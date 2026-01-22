import { supabase } from '../config/supabase.js';

export class SupabaseService {
    constructor() {
        this.supabase = supabase;
    }
    async testConnection() {
        try {
            const { data, error } = await supabase.from('leads').select('id').limit(1);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('❌ Error conectando a Supabase:', error.message);
            return false;
        }
    }

    async upsertLeads(leads) {
        if (!leads || leads.length === 0) return;

        // Obtener los leads existentes para detectar cambios en checkboxes
        const leadIds = leads.map(l => l.id);
        const { data: existingLeads, error: fetchError } = await supabase
            .from('leads')
            .select('id, is_cita_agendada, is_visitado, cita_agendada_at, visitado_at')
            .in('id', leadIds);

        if (fetchError) throw fetchError;

        // Crear mapa de leads existentes
        const existingMap = new Map();
        (existingLeads || []).forEach(lead => {
            existingMap.set(lead.id, lead);
        });

        // Procesar cada lead para detectar cambios en checkboxes
        const now = new Date().toISOString();
        const processedLeads = leads.map(lead => {
            const existing = existingMap.get(lead.id);

            // Determinar cita_agendada_at
            if (lead.is_cita_agendada) {
                if (!existing) {
                    // Lead nuevo con cita agendada
                    lead.cita_agendada_at = now;
                } else if (!existing.is_cita_agendada) {
                    // Cambió de false a true
                    lead.cita_agendada_at = now;
                } else {
                    // Ya estaba marcado, mantener fecha existente
                    lead.cita_agendada_at = existing.cita_agendada_at;
                }
            } else {
                // Si is_cita_agendada es false, no hay fecha
                lead.cita_agendada_at = null;
            }

            // Determinar visitado_at
            if (lead.is_visitado) {
                if (!existing) {
                    // Lead nuevo con visitado
                    lead.visitado_at = now;
                } else if (!existing.is_visitado) {
                    // Cambió de false a true
                    lead.visitado_at = now;
                } else {
                    // Ya estaba marcado, mantener fecha existente
                    lead.visitado_at = existing.visitado_at;
                }
            } else {
                // Si is_visitado es false, no hay fecha
                lead.visitado_at = null;
            }

            return lead;
        });

        const { error } = await supabase.from('leads').upsert(processedLeads, { onConflict: 'id' });
        if (error) throw error;
    }

    async upsertEvents(events) {
        if (!events || events.length === 0) return;
        const { error } = await supabase.from('events').upsert(events, { onConflict: 'id' });
        if (error) throw error;
    }

    async upsertUsers(users) {
        if (!users || users.length === 0) return;
        const { error } = await supabase.from('users').upsert(users, { onConflict: 'id' });
        if (error) throw error;
    }

    async upsertPipelines(pipelines) {
        if (!pipelines || pipelines.length === 0) return;
        const { error } = await supabase.from('pipelines').upsert(pipelines, { onConflict: 'id' });
        if (error) throw error;
    }

    async upsertPipelineStatuses(statuses) {
        if (!statuses || statuses.length === 0) return;
        const { error } = await supabase.from('pipeline_statuses').upsert(statuses, { onConflict: 'id' });
        if (error) throw error;
    }

    async getLastSyncTimestamp() {
        const { data, error } = await supabase
            .from('leads')
            .select('updated_at')
            .order('updated_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        return data?.[0]?.updated_at || new Date(0).toISOString();
    }

    async calculateResponseTimes() {
        console.log('   └─ Pasando a: Tiempos de Respuesta...');
        const { error } = await supabase.rpc('calculate_response_times');
        if (error) {
            if (error.message.includes('timeout')) {
                console.warn('   ⚠️ Timeout detectado en Tiempos de Respuesta. Se recomienda optimización SQL.');
            } else {
                throw error;
            }
        }
    }

    async calculateConversions() {
        console.log('   └─ Pasando a: Conversiones...');
        const { error } = await supabase.rpc('calculate_conversions');
        if (error) {
            if (error.message.includes('timeout')) {
                console.warn('   ⚠️ Timeout detectado en Conversiones. Se recomienda optimización SQL.');
            } else {
                throw error;
            }
        }
    }

    async getAllLeadIds() {
        let allIds = [];
        let from = 0;
        let step = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('leads')
                .select('id')
                .range(from, from + step - 1);

            if (error) throw error;

            if (data.length === 0) {
                hasMore = false;
            } else {
                allIds = allIds.concat(data.map(l => l.id));
                from += step;
            }
        }
        return new Set(allIds);
    }

    async getAllEventIds() {
        const { data, error } = await supabase.from('events').select('id');
        if (error) throw error;
        return new Set(data.map(e => e.id));
    }
}
