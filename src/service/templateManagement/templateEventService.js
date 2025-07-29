import { apiClient } from '@/service/config';

const templateEventService = {
    async getTemplateEvents({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/template-event', {
            params,
            withCredentials: true
        });
        return response.data;
    },
    // Tambahkan method lain (create, update, delete) jika diperlukan
    async createTemplateEvent({ code, name, description }) {
        const response = await apiClient.post('/template-event', { code, name, description }, { withCredentials: true });
        return response.data;
    },
    async getTemplateEventDetails(code) {
        const response = await apiClient.get(`/template-event/${code}`, { withCredentials: true });
        return response.data;
    },
    async updateTemplateEvent(code, { name, description }) {
        const response = await apiClient.patch(`/template-event/${code}`, { name, description }, { withCredentials: true });
        return response.data;
    },
    async deleteTemplateEvent(code) {
        const response = await apiClient.delete(`/template-event/${code}`, { withCredentials: true });
        return response.data;
    }
};

export default templateEventService;
