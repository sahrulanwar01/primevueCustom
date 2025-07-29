import { apiClient } from '@/service/config';

const templateService = {
    async getTemplate({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/template', {
            params,
            withCredentials: true
        });
        return response.data;
    },
    async createTemplate({ eventCode, channel, name, subject, content, variables, status }) {
        const response = await apiClient.post('/template', { eventCode, channel, name, subject, content, variables, status }, { withCredentials: true });
        return response.data;
    },
    async getTemplateById(id) {
        const response = await apiClient.get(`/template/${id}`, { withCredentials: true });
        return response.data;
    },
    async updateTemplate(id, payload) {
        const response = await apiClient.patch(`/template/${id}`, payload, { withCredentials: true });
        return response.data;
    },
    async deleteTemplate(id) {
        const response = await apiClient.delete(`/template/${id}`, { withCredentials: true });
        return response.data;
    }
};

export default templateService;
