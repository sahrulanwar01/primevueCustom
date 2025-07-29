// C:\Users\sst_i\Downloads\sourcode\template\sakai-vue-master\src\service\AuthService.js\
import { apiClient } from '@/service/config';

const AuthService = {
    async login(email, password) {
        const response = await apiClient.post('/auth/login', { email, password }, { withCredentials: true });
        return response.data;
    },
    async me() {
        try {
            const response = await apiClient.get('/auth/me', { withCredentials: true });
            // console.log('response ME', response);
            return response.data;
        } catch (e) {
            console.error('Error in AuthService.me():', e);
            return null;
        }
    },
    async updateMyProfile(payload) {
        const response = await apiClient.patch('/users', payload, { withCredentials: true });
        return response.data;
    },
    async logout(token) {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await apiClient.post('/auth/logout', {}, { headers, withCredentials: true });
        return response.data;
    },
    async forgotPassword(email) {
        const response = await apiClient.post('/auth/forgot-password', { email });
        return response.data;
    },
    async resetPassword(token, newPassword) {
        const response = await apiClient.post('/auth/reset-password', { token, newPassword });
        return response.data;
    }
};

export default AuthService;
