import { apiClient } from '@/service/config';

const PermissionService = {
    async getPermissions({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/permissions', { params, withCredentials: true });
        return response.data;
    },
    async createPermission({ name, description, menu_code, submenu_code }) {
        const response = await apiClient.post('/permissions', { name, description, menu_code, submenu_code }, { withCredentials: true });
        return response.data;
    },
    async getPermission(permission_code) {
        const response = await apiClient.get(`/permissions/${permission_code}`, { withCredentials: true });
        return response.data;
    },
    async updatePermission(permission_code, { name, description, menu_code, submenu_code }) {
        const response = await apiClient.patch(`/permissions/${permission_code}`, { name, description, menu_code, submenu_code }, { withCredentials: true });
        return response.data;
    },
    async deletePermission(permission_code) {
        const response = await apiClient.delete(`/permissions/${permission_code}`, { withCredentials: true });
        return response.data;
    }
};

export default PermissionService;
