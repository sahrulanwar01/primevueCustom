import { apiClient } from '@/service/config';

const MailConfigService = {
    async getMailConfig() {
        const response = await apiClient.get('/mail-config', {
            withCredentials: true
        });
        return response.data;
    },
    async createMailConfig(mailConfigData) {
        const response = await apiClient.post('/mail-config', mailConfigData, {
            withCredentials: true
        });
        return response.data;
    },
    async updateMailConfig(id, mailConfigData) {
        const response = await apiClient.patch(`/mail-config/${id}`, mailConfigData, {
            withCredentials: true
        });
        return response.data;
    },
    async sendTestEmail(toEmail) {
        const response = await apiClient.post(
            '/mail-config/send-test/',
            {
                to: toEmail
            },
            {
                withCredentials: true
            }
        );
        return response.data;
    }
};

export default MailConfigService;
