<script setup>
import config from '@/service/config';
import SiteInfoService from '@/service/webSettings/siteInfoService';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const toast = useToast();

const info = ref({
    phone: '',
    address: '',
    favicon: '',
    site_logo: '',
    site_name: '',
    contact_email: '',
    site_description: ''
});

const faviconPreview = ref('');
const logoPreview = ref('');
const loading = ref(false);

// Ambil data dari API
async function fetchSiteInfo() {
    try {
        loading.value = true;
        const response = await SiteInfoService.getSiteInfo();

        if (response.statusCode === 200 && response.data.data.length > 0) {
            const siteData = response.data.data[0].data;
            info.value = {
                phone: siteData.phone || '',
                address: siteData.address || '',
                favicon: siteData.favicon || '',
                site_logo: siteData.site_logo || '',
                site_name: siteData.site_name || '',
                contact_email: siteData.contact_email || '',
                site_description: siteData.site_description || ''
            };

            // Tambahkan base URL agar bisa di-preview
            faviconPreview.value = siteData.favicon ? `${config.API_BASE_URL}${siteData.favicon}` : '';
            logoPreview.value = siteData.site_logo ? `${config.API_BASE_URL}${siteData.site_logo}` : '';
        }
    } catch (error) {
        console.error('Error fetching site info:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Gagal mengambil data site info',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

// Upload gambar lokal (base64 preview)
function handleFileChange(event, type) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
            if (type === 'favicon') {
                faviconPreview.value = reader.result;
                info.value.favicon = file;
            } else if (type === 'logo') {
                logoPreview.value = reader.result;
                info.value.site_logo = file;
            }
        };
        reader.readAsDataURL(file);
    }
}

async function saveInfo() {
    try {
        loading.value = true;

        // Kirim sebagai FormData jika ada file
        const formData = new FormData();
        formData.append('site_name', info.value.site_name);
        formData.append('phone', info.value.phone);
        formData.append('address', info.value.address);
        formData.append('contact_email', info.value.contact_email);
        formData.append('site_description', info.value.site_description);

        if (info.value.favicon instanceof File) {
            formData.append('favicon', info.value.favicon);
        }

        if (info.value.site_logo instanceof File) {
            formData.append('site_logo', info.value.site_logo);
        }

        const response = await SiteInfoService.updateSiteInfo(formData);

        if (response.statusCode === 200) {
            toast.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Data site info berhasil disimpan',
                life: 3000
            });
        }
    } catch (error) {
        console.error('Error saving site info:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Gagal menyimpan data site info',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}
function removeImage(type) {
    if (type === 'favicon') {
        faviconPreview.value = '';
        info.value.favicon = '';
    } else if (type === 'logo') {
        logoPreview.value = '';
        info.value.site_logo = '';
    }
}

onMounted(() => {
    fetchSiteInfo();
});
</script>

<template>
    <div class="card">
        <h4 class="mb-4">Site Info</h4>

        <div v-if="loading" class="flex justify-center items-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
        </div>

        <div v-else>
            <div class="flex gap-4 mb-3">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Site Name<span class="text-red-500">*</span></label>
                    <InputText v-model="info.site_name" class="w-full" />
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Phone<span class="text-red-500">*</span></label>
                    <InputText v-model="info.phone" class="w-full" />
                </div>
            </div>

            <div class="flex gap-4 mb-3">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Contact Email<span class="text-red-500">*</span></label>
                    <InputText v-model="info.contact_email" class="w-full" />
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Address<span class="text-red-500">*</span></label>
                    <InputText v-model="info.address" class="w-full" />
                </div>
            </div>

            <div class="mb-3">
                <label class="font-bold block mb-2">Description<span class="text-red-500">*</span></label>
                <InputText v-model="info.site_description" class="w-full" />
            </div>

            <div class="flex gap-4 mb-4">
                <!-- Favicon Upload -->
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Favicon<span class="text-red-500">*</span></label>
                    <input type="file" accept="image/*" class="form-control w-full mb-2" @change="(e) => handleFileChange(e, 'favicon')" />
                    <div v-if="faviconPreview" class="relative inline-block m-1">
                        <img :src="faviconPreview" alt="Favicon Preview" class="hover-image" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1)" />
                        <button
                            @click="removeImage('favicon')"
                            class="absolute top-[-8px] right-[-8px] w-6 h-6 flex items-center justify-center text-xs leading-none rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md transition duration-200 z-20"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                <!-- Site Logo Upload -->
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Site Logo<span class="text-red-500">*</span></label>
                    <input type="file" accept="image/*" class="form-control w-full mb-2" @change="(e) => handleFileChange(e, 'logo')" />
                    <div v-if="logoPreview" class="relative inline-block m-1">
                        <img :src="logoPreview" alt="Logo Preview" class="hover-image" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1)" />
                        <button
                            @click="removeImage('logo')"
                            class="absolute top-[-8px] right-[-8px] w-6 h-6 flex items-center justify-center text-xs leading-none rounded-full bg-red-500 text-white hover:bg-red-600 shadow-md transition duration-200 z-20"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            </div>

            <div class="flex justify-end">
                <Button label="Save" icon="pi pi-check" @click="saveInfo" class="p-button-success" :loading="loading" :disabled="loading" />
            </div>
        </div>
    </div>
</template>
<style scoped>
.hover-image {
    transition: transform 0.3s ease;
}
.hover-image:hover {
    transform: scale(1.05);
}
</style>
