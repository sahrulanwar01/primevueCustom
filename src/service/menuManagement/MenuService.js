import { apiClient } from '@/service/config';

const MenusService = {
    async getMenus({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/menu', {
            params,
            withCredentials: true
        });
        return response.data;
    },
    async createMenu({ name, status }) {
        const response = await apiClient.post('/menu', { name, status }, { withCredentials: true });
        return response.data;
    },
    async getMenuDetails(menuCode) {
        const response = await apiClient.get(`/menu/${menuCode}`, {
            withCredentials: true
        });
        return response.data;
    },
    async updateMenu(menuCode, { name, status }) {
        const response = await apiClient.patch(`/menu/${menuCode}`, { name, status }, { withCredentials: true });
        return response.data;
    },
    async deleteMenu(menuCode) {
        const response = await apiClient.delete(`/menu/${menuCode}`, {
            withCredentials: true
        });
        return response.data;
    }
};

export default MenusService;
