import { apiClient } from '@/service/config';

const UserPositionService = {
    async getUserPositions({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/user-position', { params, withCredentials: true });
        return response.data;
    },

    async getUserPosition(id) {
        const response = await apiClient.get(`/user-position/${id}`, { withCredentials: true });
        return response.data;
    },

    async createUserPosition(data) {
        const response = await apiClient.post('/user-position', data, { withCredentials: true });
        return response.data;
    },

    async updateUserPosition(id, data) {
        const response = await apiClient.patch(`/user-position/${id}`, data, { withCredentials: true });
        return response.data;
    },

    async deleteUserPosition(id) {
        const response = await apiClient.delete(`/user-position/${id}`, { withCredentials: true });
        return response.data;
    }
};

export default UserPositionService;
