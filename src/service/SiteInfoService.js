import config from '@/service/config';
import axios from 'axios';

const SiteInfoService = {
    async getSiteInfo() {
        try {
            const response = await axios.get(`${config.API_BASE_URL}/public/site_info`);
            return response.data;
        } catch (error) {
            console.error('Error fetching site info:', error);
            return null;
        }
    }
};

export default SiteInfoService;
