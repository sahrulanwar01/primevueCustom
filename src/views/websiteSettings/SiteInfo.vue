<script setup>
import config from '@/service/config';
import SiteInfoService from '@/service/webSettings/siteInfoService';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

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
const permissions = ref({
    can_create: false,
    can_update: false,
    can_delete: false
});
const isSubmitted = ref(false);
const siteNameError = ref(false);
const phoneError = ref(false);
const emailError = ref(false);
const addressError = ref(false);
const descriptionError = ref(false);

const toast = useToast();

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
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
        if (response.data.permissions) {
            permissions.value = response.data.permissions;
        }
        await delay(100);
    } catch (error) {
        console.error('Error fetching site info:', error);
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

function validateForm() {
    isSubmitted.value = true;
    siteNameError.value = !info.value.site_name.trim();
    phoneError.value = !info.value.phone.trim();
    emailError.value = !info.value.contact_email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(info.value.contact_email);
    addressError.value = !info.value.address.trim();
    descriptionError.value = !info.value.site_description.trim();
    return !siteNameError.value && !phoneError.value && !emailError.value && !addressError.value && !descriptionError.value;
}

function clearError(field) {
    if (isSubmitted.value) {
        if (field === 'site_name') siteNameError.value = false;
        if (field === 'phone') phoneError.value = false;
        if (field === 'contact_email') emailError.value = false;
        if (field === 'address') addressError.value = false;
        if (field === 'site_description') descriptionError.value = false;
    }
}

async function saveInfo() {
    if (!validateForm()) {
        toast.add({
            severity: 'error',
            summary: 'Validation Failed',
            detail: 'Please fill in all required fields correctly.',
            life: 4000
        });
        return;
    }
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

        await SiteInfoService.updateSiteInfo(formData);
        // Toast otomatis dari interceptor
    } catch (error) {
        console.error('Error saving site info:', error);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchSiteInfo();
    Fancybox.bind('[data-fancybox="siteinfo-img"]', { groupAll: false });
});
</script>

<template>
    <div class="card">
        <h4 class="mb-10">Site Information</h4>
        <div>
            <div class="flex gap-4 mb-3">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Site Name<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="info.site_name" placeholder="Enter site name" class="w-full" :class="{ 'p-invalid': siteNameError }" @input="() => clearError('site_name')" />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Phone<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="info.phone" placeholder="Enter phone number" class="w-full" :class="{ 'p-invalid': phoneError }" @input="() => clearError('phone')" type="number" />
                    </template>
                </div>
            </div>

            <div class="flex gap-4 mb-3">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Email<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="info.contact_email" placeholder="Enter email" class="w-full" :class="{ 'p-invalid': emailError }" @input="() => clearError('contact_email')" type="email" />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Address<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="info.address" placeholder="Enter address" class="w-full" :class="{ 'p-invalid': addressError }" @input="() => clearError('address')" />
                    </template>
                </div>
            </div>

            <div class="mb-3">
                <label class="font-bold block mb-2">Description<span class="text-red-500">*</span></label>
                <template v-if="loading">
                    <Skeleton height="2rem" width="100%" borderRadius="8px" />
                </template>
                <template v-else>
                    <InputText v-model="info.site_description" placeholder="Enter description" class="w-full" :class="{ 'p-invalid': descriptionError }" @input="() => clearError('site_description')" />
                </template>
            </div>

            <div class="flex gap-4 mb-4">
                <!-- Favicon Upload -->
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Favicon<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="70px" width="70px" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <input type="file" accept="image/*" class="form-control w-full mb-2" @change="(e) => handleFileChange(e, 'favicon')" />
                        <div v-if="faviconPreview" class="relative inline-block m-1">
                            <a :href="faviconPreview" data-fancybox="siteinfo-img" data-caption="Favicon" tabindex="0">
                                <img :src="faviconPreview" alt="Favicon Preview" class="hover-image" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1)" />
                            </a>
                        </div>
                    </template>
                </div>

                <!-- Site Logo Upload -->
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Site Logo<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="70px" width="70px" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <input type="file" accept="image/*" class="form-control w-full mb-2" @change="(e) => handleFileChange(e, 'logo')" />
                        <div v-if="logoPreview" class="relative inline-block m-1">
                            <a :href="logoPreview" data-fancybox="siteinfo-img" data-caption="Logo" tabindex="0">
                                <img :src="logoPreview" alt="Logo Preview" class="hover-image" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1)" />
                            </a>
                        </div>
                    </template>
                </div>
            </div>

            <div class="flex justify-end">
                <template v-if="loading">
                    <Skeleton height="2.5rem" width="120px" borderRadius="8px" />
                </template>
                <template v-else>
                    <Button v-if="permissions.can_update" label="Save" icon="pi pi-check" @click="saveInfo" class="p-button-success" :loading="loading" :disabled="loading" />
                </template>
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
