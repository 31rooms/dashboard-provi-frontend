export class LeadsTransformer {
    // Custom Field IDs de Kommo (del JSON de exportación)
    static FIELD_IDS = {
        // UTM Tracking
        UTM_SOURCE: 1681790,
        UTM_CAMPAIGN: 1681788,
        UTM_MEDIUM: 1681786,
        // Custom fields creados
        DESARROLLO: 2093484,
        MODELO: 2093544,
        CITA_AGENDADA: 2093478,  // checkbox
        VISITADO: 2093480,       // checkbox
        FUENTE: 2093540,         // select
        MEDIO: 2093542,          // select
    };

    static transform(kommoLead, pipelines = {}, users = {}) {
        const getCustomField = (lead, fieldId) => {
            const field = lead.custom_fields_values?.find(f => f.field_id === fieldId);
            return field?.values?.[0]?.value || null;
        };

        // Para checkboxes de Kommo, el valor puede venir como true, "true", 1, "1"
        const getCheckboxField = (lead, fieldId) => {
            const value = getCustomField(lead, fieldId);
            if (value === null || value === undefined) return false;
            return value === true || value === "true" || value === 1 || value === "1";
        };

        const getContactEmail = (lead) => {
            // En una implementación real, esto requeriría pedir el contacto por ID o usar embedded contacts
            return null;
        };

        const getContactPhone = (lead) => {
            return null;
        };

        const pipeline = pipelines[kommoLead.pipeline_id];
        const status = pipeline?.statuses?.find(s => s.id === kommoLead.status_id);

        // Obtener fuente: priorizar custom field, fallback a utm_source
        const fuenteCustom = getCustomField(kommoLead, this.FIELD_IDS.FUENTE);
        const utmSource = getCustomField(kommoLead, this.FIELD_IDS.UTM_SOURCE);
        const fuente = fuenteCustom || utmSource || null;

        return {
            id: kommoLead.id,
            name: kommoLead.name,
            pipeline_id: kommoLead.pipeline_id,
            pipeline_name: pipeline?.name || 'Desconocido',
            status_id: kommoLead.status_id,
            status_name: status?.name || 'Desconocido',
            responsible_user_id: kommoLead.responsible_user_id,
            responsible_user_name: users[kommoLead.responsible_user_id]?.name || 'Desconocido',
            price: kommoLead.price || 0,
            created_at: new Date(kommoLead.created_at * 1000).toISOString(),
            updated_at: new Date(kommoLead.updated_at * 1000).toISOString(),
            closed_at: kommoLead.closed_at ? new Date(kommoLead.closed_at * 1000).toISOString() : null,
            is_deleted: kommoLead.is_deleted || false,

            // UTM Tracking fields
            utm_source: utmSource,
            utm_campaign: getCustomField(kommoLead, this.FIELD_IDS.UTM_CAMPAIGN),
            utm_medium: getCustomField(kommoLead, this.FIELD_IDS.UTM_MEDIUM),

            // Custom fields de negocio
            desarrollo: getCustomField(kommoLead, this.FIELD_IDS.DESARROLLO),
            modelo: getCustomField(kommoLead, this.FIELD_IDS.MODELO),

            // Campos de seguimiento (checkboxes)
            is_cita_agendada: getCheckboxField(kommoLead, this.FIELD_IDS.CITA_AGENDADA),
            is_visitado: getCheckboxField(kommoLead, this.FIELD_IDS.VISITADO),
            // Timestamps de cuando se marcaron los checkboxes (se asignan en el servicio de Supabase)
            cita_agendada_at: null, // Se llenará si is_cita_agendada cambia a true
            visitado_at: null, // Se llenará si is_visitado cambia a true

            // Campos de atribución (selects)
            fuente: fuente,
            medio: getCustomField(kommoLead, this.FIELD_IDS.MEDIO),

            // Contact info (if embedded)
            contact_name: kommoLead._embedded?.contacts?.[0]?.name || null,
            contact_email: getContactEmail(kommoLead),
            contact_phone: getContactPhone(kommoLead),

            last_synced_at: new Date().toISOString()
        };
    }
}
