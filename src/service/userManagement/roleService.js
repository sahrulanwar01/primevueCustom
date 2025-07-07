import { apiClient } from '@/service/config';

const RoleService = {
    async getRoles({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/roles', {
            params,
            withCredentials: true
        });
        return response.data;
    },
    async createRole({ name, status }) {
        const response = await apiClient.post('/roles', { name, status }, { withCredentials: true });
        return response.data;
    },
    async getRoleDetails(roleCode) {
        const response = await apiClient.get(`/roles/${roleCode}`, {
            withCredentials: true
        });
        return response.data;
    },
    async updateRole(roleCode, { name, status }) {
        const response = await apiClient.patch(`/roles/${roleCode}`, { name, status }, { withCredentials: true });
        return response.data;
    },
    async deleteRole(roleCode) {
        const response = await apiClient.delete(`/roles/${roleCode}`, {
            withCredentials: true
        });
        return response.data;
    }
};

export default RoleService;
