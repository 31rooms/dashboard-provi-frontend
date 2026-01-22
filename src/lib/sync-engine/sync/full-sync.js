import { logger } from '../utils/logger.js';
import { LeadsTransformer } from '../transformers/leads.transformer.js';
import { EventsTransformer } from '../transformers/events.transformer.js';
import { UsersTransformer } from '../transformers/users.transformer.js';
import { PipelinesTransformer } from '../transformers/pipelines.transformer.js';
import { uniqueByKey, sleep } from '../utils/helpers.js';

export async function fullSync(kommoService, supabaseService) {
    logger.info('📦 Iniciando FULL SYNC (carga completa)');

    try {
        // 1. Usuarios
        logger.info('👥 Sincronizando usuarios...');
        const usersRaw = await kommoService.getUsers();
        const transformedUsers = uniqueByKey(usersRaw.map(user => UsersTransformer.transform(user)));

        await supabaseService.upsertUsers(transformedUsers);
        const usersMap = Object.fromEntries(usersRaw.map(u => [u.id, u]));
        logger.info(`✓ ${transformedUsers.length} usuarios sincronizados`);

        // 2. Pipelines
        logger.info('📊 Sincronizando pipelines...');
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
        logger.info(`✓ ${uniquePipelines.length} pipelines y ${uniqueStatuses.length} estados sincronizados`);

        // 3. Leads (DESACTIVADO POR PETICIÓN DEL USUARIO)
        logger.info('📋 Leads: Saltando sincronización por configuración del usuario.');
        const validLeadIds = new Set();

        // Cargamos IDs de leads existentes para el filtrado de eventos
        logger.info('🔍 Recuperando IDs de leads existentes en base de datos...');
        const existingLeadIds = await supabaseService.getAllLeadIds();
        existingLeadIds.forEach(id => validLeadIds.add(id));
        logger.info(`✓ ${validLeadIds.size} IDs de leads recuperados`);

        // Cargamos IDs de eventos existentes para omitir duplicados
        logger.info('🔍 Recuperando IDs de eventos ya sincronizados...');
        const existingEventIds = await supabaseService.getAllEventIds();
        logger.info(`✓ ${existingEventIds.size} eventos ya existen en base de datos`);

        // 4. Eventos (últimos 90 días)
        logger.info('📅 Sincronizando eventos (90 días)...');
        const dateFrom = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);

        let eventPage = 1;
        let totalEvents = 0;
        let skippedOrphans = 0;
        let skippedExisting = 0;
        let hasMoreEvents = true;

        while (hasMoreEvents) {
            let events = [];
            let success = false;
            let retries = 0;

            while (!success && retries < 3) {
                try {
                    events = await kommoService.getEvents({
                        filter: { created_at: { from: dateFrom } },
                        limit: 250,
                        page: eventPage
                    });
                    success = true;
                } catch (error) {
                    retries++;
                    logger.warn(`⚠️ Error al obtener eventos (Página ${eventPage}). Reintentando ${retries}/3 en 5s...`);
                    await sleep(5000);
                    if (retries === 3) throw error;
                }
            }

            if (events.length === 0) {
                hasMoreEvents = false;
                break;
            }

            // 1. Filtrar eventos cuya lead NO existe
            const eventsWithLead = events.filter(e => validLeadIds.has(e.entity_id));
            skippedOrphans += (events.length - eventsWithLead.length);

            // 2. Filtrar eventos que YA están en la base de datos
            const newEvents = eventsWithLead.filter(e => !existingEventIds.has(String(e.id)));
            skippedExisting += (eventsWithLead.length - newEvents.length);

            const transformedEvents = uniqueByKey(newEvents.map(event =>
                EventsTransformer.transform(event, usersMap)
            ));

            if (transformedEvents.length > 0) {
                await supabaseService.upsertEvents(transformedEvents);
                totalEvents += transformedEvents.length;
                // Actualizar set local para evitar duplicados en la misma corrida si Kommo repitiera algo
                transformedEvents.forEach(e => existingEventIds.add(e.id));

                logger.info(`   └─ Pág ${eventPage}: ${transformedEvents.length} nuevos (Total base: ${totalEvents}, Saltados: ${skippedOrphans} huérfanos, ${skippedExisting} ya existentes)...`);
            } else if (events.length > 0) {
                // Si la página tiene 250 eventos pero todos saltados, igual debemos avanzar la página
                if (eventPage % 10 === 0) {
                    logger.info(`   └─ Pág ${eventPage}: Avanzando (Todos los eventos ya existen o son huérfanos)...`);
                }
            }

            eventPage++;
            await sleep(300);
        }

        logger.info(`✓ Sincronización de eventos completada. Nuevos: ${totalEvents}, Saltados: ${skippedExisting} existentes, ${skippedOrphans} huérfanos`);

        // 5. Métricas
        logger.info('🔢 Calculando métricas en Supabase...');
        await supabaseService.calculateResponseTimes();
        await supabaseService.calculateConversions();
        logger.info('✓ Métricas calculadas');

    } catch (error) {
        logger.error('❌ Error en full sync:', error.message);
        throw error;
    }
}
