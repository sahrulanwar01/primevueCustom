# Perbaikan Masalah Menu Tidak Langsung Tampil Setelah Login

## Masalah
Setelah login berhasil, menu tidak langsung tampil dan harus di-reload dulu untuk melihat menu yang sesuai dengan permission user.

## Penyebab
1. **Menu hanya di-load sekali saat aplikasi dimulai** - Fungsi `filterMenuBasedOnPermissions()` hanya dipanggil sekali saat modul di-import
2. **Tidak ada re-fetch menu setelah login** - Setelah login berhasil, menu tidak di-refresh untuk mengambil data permission terbaru dari backend

## Solusi yang Diterapkan

### 1. Menambahkan Fungsi `refreshMenu()`
- **File**: `src/layout/composables/menu.js`
- **Fungsi**: Refresh menu dengan mengambil data permission terbaru dari backend
- **Fitur**: 
  - Debounce 100ms untuk menghindari request berulang
  - Cache 5 detik untuk menghindari request berulang dalam waktu singkat

### 2. Memanggil `refreshMenu()` Setelah Login
- **File**: `src/views/pages/auth/Login.vue`
- **Lokasi**: Setelah login berhasil, sebelum redirect ke dashboard
- **Kode**: `await refreshMenu();`

### 3. Memanggil `refreshMenu()` di Router Guard
- **File**: `src/router/index.js`
- **Lokasi**: Saat navigasi ke halaman yang memerlukan auth
- **Kode**: `await refreshMenu();`

### 4. Memanggil `refreshMenu()` di Layout Components
- **File**: `src/layout/AppLayout.vue` dan `src/layout/AppMenu.vue`
- **Lokasi**: Saat komponen dimuat
- **Tujuan**: Memastikan menu selalu ter-update

## Hasil
✅ Menu langsung tampil setelah login tanpa perlu reload  
✅ Menu selalu ter-update sesuai permission user  
✅ Performa optimal dengan debounce dan cache  
✅ Tidak ada request berulang yang tidak perlu  

## Cara Kerja
1. User login → `AuthService.login()` berhasil
2. `refreshMenu()` dipanggil → Ambil data permission dari backend
3. Menu di-filter berdasarkan permission → Update `menuData.value`
4. User di-redirect ke dashboard → Menu sudah ter-update
5. Router guard juga memanggil `refreshMenu()` → Memastikan menu selalu ter-update

## Optimasi
- **Debounce**: Menghindari request berulang dalam waktu singkat
- **Cache**: Menghindari request berulang dalam 5 detik
- **Error Handling**: Fallback ke menu default jika request gagal
- **Performance**: Minimal impact pada performa aplikasi 