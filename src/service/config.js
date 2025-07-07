// C:\Users\sst_i\Downloads\sourcode\template\sakai-vue-master\src\service\config.js
import axios from 'axios';
import { showResponseToast } from './ToastHandler';

const config = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'
};

// Buat instance axios dengan konfigurasi default
const apiClient = axios.create({
    baseURL: config.API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor untuk menambahkan token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor untuk menangani toast secara otomatis
apiClient.interceptors.response.use(
    (response) => {
        // Hanya tampilkan toast jika method-nya BUKAN GET
        if (response.config && response.config.method && response.config.method.toLowerCase() !== 'get' && (response.data.statusCode === 200 || response.data.success)) {
            showResponseToast(response.data);
        }
        return response;
    },
    (error) => {
        // Untuk error, juga cek method
        const errorResponse = error.response?.data || {};
        const method = error.config?.method?.toLowerCase();
        if (method && method !== 'get') {
            showResponseToast(errorResponse, 'Terjadi kesalahan');
        }
        return Promise.reject(error);
    }
);

export default config;
export { apiClient };
