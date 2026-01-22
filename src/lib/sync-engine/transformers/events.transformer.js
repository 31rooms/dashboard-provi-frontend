export class EventsTransformer {
    static transform(kommoEvent, users = {}) {
        return {
            id: kommoEvent.id,
            lead_id: kommoEvent.entity_id,
            event_type: kommoEvent.type,
            created_at: new Date(kommoEvent.created_at * 1000).toISOString(),
            created_by_id: kommoEvent.created_by,
            created_by_name: users[kommoEvent.created_by]?.name || 'Sistema',
            value_before: kommoEvent.value_before ? JSON.stringify(kommoEvent.value_before) : null,
            value_after: kommoEvent.value_after ? JSON.stringify(kommoEvent.value_after) : null,
            last_synced_at: new Date().toISOString()
        };
    }
}
