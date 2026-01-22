import { logger } from '../utils/logger.js';
import { LeadsTransformer } from '../transformers/leads.transformer.js';
import { EventsTransformer } from '../transformers/events.transformer.js';
import { UsersTransformer } from '../transformers/users.transformer.js';
import { PipelinesTransformer } from '../transformers/pipelines.transformer.js';
import { uniqueByKey } from '../utils/helpers.js';

export async function incrementalSync(kommoService, supabaseService) {
    logger.info('🔄 Iniciando INCREMENTAL SYNC');
    const startTime = Date.now();

    try {
        const lastSync = await supabaseService.getLastSyncTimestamp();
        const lastSyncUnix = Math.floor(new Date(lastSync).getTime() / 1000);
        logger.info(`📅 Buscando cambios desde: ${lastSync}`);

        // Refresh Users and Pipelines
        const usersRaw = await kommoService.getUsers();
        const transformedUsers = uniqueByKey(usersRaw.map(u => UsersTransformer.transform(u)));
        await supabaseService.upsertUsers(transformedUsers);
        const usersMap = Object.fromEntries(usersRaw.map(u => [u.id, u]));

        const pipelinesRaw = await kommoService.getPipelines();
        const transformedPipelines = [];
        const allStatuses = [];
        pipelinesRaw.forEach(p => {
            const { pipeline, statuses } = PipelinesTransformer.transform(p);
            transformedPipelines.push(pipeline);
            allStatuses.push(...statuses);
        });

        const uniquePipelines = uniqueByKey(transformedPipelines);
        const uniqueStatuses = uniqueByKey(allStatuses);

        await supabaseService.upsertPipelines(uniquePipelines);
        await supabaseService.upsertPipelineStatuses(uniqueStatuses);
        const pipelinesMap = Object.fromEntries(pipelinesRaw.map(p => [p.id, p]));

        // Obtener IDs de leads válidos para el filtrado de eventos
        const validLeadIds = await supabaseService.getAllLeadIds();

        // Leads actualizados
        const updatedLeads = await kommoService.getLeads({
            filter: { updated_at: { from: lastSyncUnix } }
        });

        if (updatedLeads.length > 0) {
            const transformedLeads = uniqueByKey(updatedLeads.map(lead =>
                LeadsTransformer.transform(lead, pipelinesMap, usersMap)
            ));
            await supabaseService.upsertLeads(transformedLeads);
            transformedLeads.forEach(l => validLeadIds.add(l.id));
            logger.info(`✓ ${transformedLeads.length} leads actualizados`);
        }

        // Cargamos IDs de eventos existentes para evitar reconteo
        const existingEventIds = await supabaseService.getAllEventIds();

        // Eventos nuevos
        logger.info('📅 Buscando eventos nuevos...');
        let eventPage = 1;
        let totalEventsCount = 0;
        let skippedEvents = 0;
        let hasMoreEvents = true;

        while (hasMoreEvents) {
            let events = [];
            let success = false;
            let retries = 0;

            while (!success && retries < 3) {
                try {
                    events = await kommoService.getEvents({
                        filter: { created_at: { from: lastSyncUnix } },
                        limit: 250,
                        page: eventPage
                    });
                    success = true;
                } catch (error) {
                    retries++;
                    logger.warn(`⚠️ Error al obtener eventos (Página ${eventPage}). Reintentando ${retries}/3 en 5s...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    if (retries === 3) throw error;
                }
            }

            if (events.length === 0) {
                hasMoreEvents = false;
                break;
            }

            const eventsWithLead = events.filter(e => validLeadIds.has(e.entity_id));
            const newEventsList = eventsWithLead.filter(e => !existingEventIds.has(String(e.id)));
            skippedEvents += (events.length - newEventsList.length);

            const transformedEvents = uniqueByKey(newEventsList.map(event =>
                EventsTransformer.transform(event, usersMap)
            ));

            if (transformedEvents.length > 0) {
                await supabaseService.upsertEvents(transformedEvents);
                totalEventsCount += transformedEvents.length;
                transformedEvents.forEach(e => existingEventIds.add(e.id));
                logger.info(`   └─ Procesados ${transformedEvents.length} eventos nuevos...`);
            }

            eventPage++;
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        if (updatedLeads.length > 0 || totalEventsCount > 0) {
            const metricsStart = Date.now();
            logger.info('🔢 Recalculando métricas...');
            try {
                await supabaseService.calculateResponseTimes();
                await supabaseService.calculateConversions();
                const metricsDuration = ((Date.now() - metricsStart) / 1000).toFixed(2);
                logger.info(`✅ Métricas recalculadas en ${metricsDuration}s`);
            } catch (metricsError) {
                logger.warn(`⚠️ Error al calcular métricas: ${metricsError.message}`);
                logger.info('💡 Nota: Este error es común si el esquema SQL no ha sido actualizado con "06_FIX_TIMEOUT_METRICAS.sql".');
            }
        }

        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`✅ Sincronización incremental completada en ${totalDuration}s. Nuevos: ${totalEventsCount}, Saltados: ${skippedEvents}`);

    } catch (error) {
        logger.error('❌ Error en incremental sync:', error.message);
        throw error;
    }
}
