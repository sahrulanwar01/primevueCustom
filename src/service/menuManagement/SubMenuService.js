// import config from '@/service/config';
// import axios from 'axios';

// const SubMenusService = {
//     async getSubMenus({ page = 1, limit = 10, search = '' } = {}) {
//         const params = { page, limit };
//         if (search) params.search = search;
//         const response = await axios.get(`${config.API_BASE_URL}/subMenus`, {
//             params,
//             withCredentials: true
//         });
//         return response.data;
//     },
//     async createSubMenu({ name, menu_code, status }) {
//         const response = await axios.post(`${config.API_BASE_URL}/subMenus`, { name, menu_code, status }, { withCredentials: true });
//         return response.data;
//     },
//     async getSubMenuDetails(submenu_code) {
//         const response = await axios.get(`${config.API_BASE_URL}/subMenus/${submenu_code}`, { withCredentials: true });
//         return response.data;
//     },
//     async updateSubMenu(submenu_code, { name, status }) {
//         const response = await axios.patch(`${config.API_BASE_URL}/subMenus/${submenu_code}`, { name, status }, { withCredentials: true });
//         return response.data;
//     },
//     async deleteSubMenu(submenu_code) {
//         const response = await axios.delete(`${config.API_BASE_URL}/subMenus/${submenu_code}`, { withCredentials: true });
//         return response.data;
//     }
// };

// export default SubMenusService;
import { apiClient } from '@/service/config';

const SubMenusService = {
    async getSubMenus({ page = 1, limit = 10, search = '' } = {}) {
        const params = { page, limit };
        if (search) params.search = search;
        const response = await apiClient.get('/subMenus', {
            params,
            withCredentials: true
        });
        return response.data;
    },
    async createSubMenu({ name, menu_code, status }) {
        const response = await apiClient.post('/subMenus', { name, menu_code, status }, { withCredentials: true });
        return response.data;
    },
    async getSubMenuDetails(submenu_code) {
        const response = await apiClient.get(`/subMenus/${submenu_code}`, { withCredentials: true });
        return response.data;
    },
    async updateSubMenu(submenu_code, { name, status }) {
        const response = await apiClient.patch(`/subMenus/${submenu_code}`, { name, status }, { withCredentials: true });
        return response.data;
    },
    async deleteSubMenu(submenu_code) {
        const response = await apiClient.delete(`/subMenus/${submenu_code}`, { withCredentials: true });
        return response.data;
    }
};

export default SubMenusService;
