export class PipelinesTransformer {
    static transform(kommoPipeline) {
        const pipeline = {
            id: kommoPipeline.id,
            name: kommoPipeline.name,
            is_main: kommoPipeline.is_main || false,
            sort_order: kommoPipeline.sort || 0,
            last_synced_at: new Date().toISOString()
        };

        const statuses = (kommoPipeline._embedded?.statuses || []).map(status => ({
            id: status.id,
            pipeline_id: kommoPipeline.id,
            name: status.name,
            color: status.color,
            sort_order: status.sort || 0,
            last_synced_at: new Date().toISOString()
        }));

        return { pipeline, statuses };
    }
}
