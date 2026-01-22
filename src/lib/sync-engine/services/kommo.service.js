import { kommoClient } from '../config/kommo.js';

export class KommoService {
    async testConnection() {
        try {
            const response = await kommoClient.get('/account');
            return !!response.data;
        } catch (error) {
            console.error('❌ Error conectando a Kommo API:', error.response?.data || error.message);
            return false;
        }
    }

    async getLeads(params = {}) {
        const response = await kommoClient.get('/leads', { params });
        return response.data?._embedded?.leads || [];
    }

    async getEvents(params = {}) {
        // Solo buscamos eventos de leads para evitar miles de eventos de contactos/empresas que no usamos
        const enrichedParams = {
            ...params,
            'filter[entity]': 'lead'
        };
        const response = await kommoClient.get('/events', { params: enrichedParams });
        return response.data?._embedded?.events || [];
    }

    async getUsers() {
        const response = await kommoClient.get('/users');
        return response.data?._embedded?.users || [];
    }

    async getPipelines() {
        const response = await kommoClient.get('/leads/pipelines');
        return response.data?._embedded?.pipelines || [];
    }

    async getAllLeads(filters = {}) {
        let allLeads = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const leads = await this.getLeads({ ...filters, limit: 250, page });
            if (leads.length === 0) {
                hasMore = false;
            } else {
                allLeads = allLeads.concat(leads);
                page++;
                // Respect rate limit
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        return allLeads;
    }

    async getAllEvents(filters = {}) {
        let allEvents = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const events = await this.getEvents({ ...filters, limit: 250, page });
            if (events.length === 0) {
                hasMore = false;
            } else {
                allEvents = allEvents.concat(events);
                if (page % 5 === 0 || events.length < 250) {
                    console.log(`   └─ Descargando eventos: ${allEvents.length} recuperados...`);
                }
                page++;
                // Respect rate limit
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        return allEvents;
    }
}
