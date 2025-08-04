import { apiClient } from '@/service/config';

const PositionService = {
    async getPositions({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/position', { params, withCredentials: true });
        return response.data;
    },

    async getPosition(positionCode) {
        const response = await apiClient.get(`/position/${positionCode}`, { withCredentials: true });
        return response.data;
    },

    async createPosition(data) {
        const response = await apiClient.post('/position', data, { withCredentials: true });
        return response.data;
    },

    async updatePosition(positionCode, data) {
        const response = await apiClient.patch(`/position/${positionCode}`, data, { withCredentials: true });
        return response.data;
    },

    async deletePosition(positionCode) {
        const response = await apiClient.delete(`/position/${positionCode}`, { withCredentials: true });
        return response.data;
    }
};

export default PositionService;
