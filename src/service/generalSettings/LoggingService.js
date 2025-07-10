import { apiClient } from '@/service/config';

const LoggingService = {
    async getLoggings({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/loggings', {
            params,
            withCredentials: true
        });
        return response.data;
    },

    async exportLoggings(startDate, endDate) {
        const params = { startDate, endDate };
        const response = await apiClient.get('/loggings/export-excel', {
            params,
            responseType: 'blob',
            withCredentials: true
        });
        return response;
    }
};
export default LoggingService;
