# Sistem Toast Otomatis

## Overview

Sistem toast otomatis memungkinkan aplikasi menampilkan notifikasi toast secara otomatis berdasarkan response dari API tanpa perlu menulis kode toast manual di setiap komponen.

## Komponen Sistem

### 1. Config.js - Axios Interceptor
```javascript
// src/service/config.js
import axios from 'axios';
import { showResponseToast } from './ToastHandler';

const apiClient = axios.create({
    baseURL: config.API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response interceptor untuk toast otomatis
apiClient.interceptors.response.use(
    (response) => {
        // Auto show toast untuk response sukses
        if (response.data && (response.data.statusCode === 200 || response.data.success)) {
            showResponseToast(response.data);
        }
        return response;
    },
    (error) => {
        // Auto show toast untuk error
        const errorResponse = error.response?.data || {};
        showResponseToast(errorResponse, 'Terjadi kesalahan');
        return Promise.reject(error);
    }
);
```

### 2. ToastHandler.js - Kontrol Toast
```javascript
// src/service/ToastHandler.js
let autoToastEnabled = true; // Flag untuk mengontrol toast otomatis

export function setAutoToast(enabled) {
    autoToastEnabled = enabled;
}

export function showResponseToast(response, fallback = 'Operation completed') {
    if (!toastInstance || !autoToastEnabled) return;
    
    if (response?.statusCode === 200 || response?.success) {
        showToast({
            severity: 'success',
            summary: 'Success',
            detail: response?.message || fallback
        });
    } else {
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: response?.message || fallback
        });
    }
}

// Helper untuk menampilkan toast manual (tidak terpengaruh autoToastEnabled)
export function showManualToast(response, fallback = 'Operation completed') {
    // ... implementation
}
```

## Cara Penggunaan

### 1. Service dengan Toast Otomatis
```javascript
// src/service/MyService.js
import { apiClient } from '@/service/config';

const MyService = {
    async getData() {
        const response = await apiClient.get('/api/data');
        return response.data; // Toast akan muncul otomatis
    },
    
    async createData(data) {
        const response = await apiClient.post('/api/data', data);
        return response.data; // Toast akan muncul otomatis
    }
};
```

### 2. Komponen Vue (Tanpa Toast Manual)
```javascript
// src/views/MyComponent.vue
<script setup>
import MyService from '@/service/MyService';

async function handleSubmit() {
    try {
        await MyService.createData(formData);
        // Toast akan muncul otomatis, tidak perlu kode manual
        closeDialog();
        refreshData();
    } catch (error) {
        // Error toast juga muncul otomatis
        console.error('Error:', error);
    }
}
</script>
```

### 3. Kontrol Toast Manual
```javascript
import { setAutoToast, showManualToast } from '@/service/ToastHandler';

// Nonaktifkan toast otomatis untuk operasi tertentu
setAutoToast(false);
await someApiCall();
setAutoToast(true); // Aktifkan kembali

// Tampilkan toast manual
showManualToast(response, 'Pesan kustom');
```

## Format Response API

Sistem mengharapkan response API dalam format berikut:

### Success Response
```javascript
{
    statusCode: 200, // atau success: true
    message: "Data berhasil disimpan",
    data: { ... }
}
```

### Error Response
```javascript
{
    statusCode: 400, // atau success: false
    message: "Data tidak valid",
    errors: { ... }
}
```

## Konfigurasi

### 1. Base URL
```javascript
// src/service/config.js
const config = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000/api'
};
```

### 2. Toast Instance
```javascript
// src/App.vue
import { setToastInstance } from '@/service/ToastHandler';

onMounted(() => {
    if (toastRef.value) {
        setToastInstance(toastRef.value);
    }
});
```

## Keuntungan

1. **Konsistensi**: Semua toast menggunakan format yang sama
2. **DRY Principle**: Tidak perlu menulis kode toast berulang
3. **Maintainability**: Perubahan format toast cukup di satu tempat
4. **Error Handling**: Error handling otomatis untuk semua API call
5. **Flexibility**: Bisa dinonaktifkan untuk kasus khusus

## Migration Guide

### Dari Toast Manual ke Otomatis

**Sebelum:**
```javascript
// Service
const response = await axios.post('/api/data', data);
return response.data;

// Component
const toast = useToast();
try {
    const response = await MyService.createData(data);
    toast.add({
        severity: 'success',
        summary: 'Success',
        detail: response.message,
        life: 3000
    });
} catch (error) {
    toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message,
        life: 4000
    });
}
```

**Sesudah:**
```javascript
// Service
const response = await apiClient.post('/api/data', data);
return response.data;

// Component
try {
    await MyService.createData(data);
    // Toast muncul otomatis
} catch (error) {
    // Error toast muncul otomatis
    console.error('Error:', error);
}
```

## Troubleshooting

### Toast Tidak Muncul
1. Pastikan `Toast` component sudah dipasang di `App.vue`
2. Pastikan `setToastInstance()` sudah dipanggil
3. Periksa apakah `autoToastEnabled` bernilai `true`

### Toast Muncul Dua Kali
1. Pastikan hanya ada satu komponen `<Toast />` di aplikasi
2. Hapus komponen `<Toast />` dari `AppLayout.vue`

### Toast Manual Tidak Berfungsi
1. Gunakan `showManualToast()` untuk toast manual
2. Pastikan `toastInstance` sudah diset dengan benar 