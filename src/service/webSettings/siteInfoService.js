// import config from '@/service/config';
// import axios from 'axios';

// const SiteInfoService = {
//     async getSiteInfo() {
//         const response = await axios.get(`${config.API_BASE_URL}/web-settings/info-site`, {
//             withCredentials: true
//         });
//         return response.data;
//     },
//     async updateSiteInfo(formData) {
//         const response = await axios.patch(`${config.API_BASE_URL}/web-settings/info-site`, formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data'
//             },
//             withCredentials: true
//         });
//         return response.data;
//     }
// };

// export default SiteInfoService;
import { apiClient } from '@/service/config';

const SiteInfoService = {
    async getSiteInfo() {
        const response = await apiClient.get('/web-settings/info-site', {
            withCredentials: true
        });
        return response.data;
    },
    async updateSiteInfo(formData) {
        const response = await apiClient.patch('/web-settings/info-site', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            withCredentials: true
        });
        return response.data;
    }
};

export default SiteInfoService;
