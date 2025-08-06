import { apiClient } from '@/service/config';

const UsersService = {
    async getUsers({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/users', {
            params,
            withCredentials: true
        });
        return response.data;
    },

    async addUser(payload) {
        // payload: { name, email, password, phone, role_code, photo, status }
        const response = await apiClient.post('/users', payload, { withCredentials: true });
        return response.data;
    },

    async deleteUser(user_code) {
        const response = await apiClient.delete(`/users/${user_code}`, {
            withCredentials: true
        });
        return response.data;
    },

    async getUserDetails(user_code) {
        const response = await apiClient.get(`/users/${user_code}`, {
            withCredentials: true
        });
        return response.data;
    },

    async updateUser(user_code, payload) {
        // payload: { name, email, phone, role_code, photo, status }
        const response = await apiClient.patch(`/users/${user_code}`, payload, { withCredentials: true });
        return response.data;
    },

    async downloadTemplate() {
        const response = await apiClient.get('/users/import-template', {
            responseType: 'blob',
            withCredentials: true
        });
        return response.data;
    },

    async importUsers(formData) {
        const response = await apiClient.post('/users/import-users', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            withCredentials: true
        });
        return response.data;
    }
};

export default UsersService;
