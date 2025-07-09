import { apiClient } from '@/service/config';

const RolePermissionService = {
    async getRolePermissions({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/rolePermission', { params, withCredentials: true });
        return response.data;
    },
    async createRolePermission({ role_code, permission_code, can_create, can_update, can_delete, can_view, can_details }) {
        const response = await apiClient.post(
            '/rolePermission',
            {
                role_code,
                permission_code,
                can_create,
                can_update,
                can_delete,
                can_view,
                can_details
            },
            { withCredentials: true }
        );
        return response.data;
    },
    async getRolePermission(role_perms_code) {
        const response = await apiClient.get(`/rolePermission/${role_perms_code}`, { withCredentials: true });
        return response.data;
    },
    async updateRolePermission(role_perms_code, { role_code, permission_code, can_create, can_update, can_delete, can_view, can_details }) {
        const response = await apiClient.patch(
            `/rolePermission/${role_perms_code}`,
            {
                role_code,
                permission_code,
                can_create,
                can_update,
                can_delete,
                can_view,
                can_details
            },
            { withCredentials: true }
        );
        return response.data;
    },
    async deleteRolePermission(role_perms_code) {
        const response = await apiClient.delete(`/rolePermission/${role_perms_code}`, { withCredentials: true });
        return response.data;
    }
};

export default RolePermissionService;
