<template>
    <div class="card">
        <h4 class="mb-10">My Profile</h4>

        <!-- Profile Header -->
        <div class="profile-header mb-4">
            <div class="flex flex-column md:flex-row align-items-center gap-4">
                <div class="profile-avatar-container">
                    <template v-if="loading">
                        <Skeleton shape="circle" size="120px" />
                    </template>
                    <template v-else>
                        <a :href="getProfilePhotoUrl()" data-fancybox="profile-avatar" data-caption="Foto Profil" tabindex="0">
                            <img :src="getProfilePhotoUrl()" :alt="profile.name" class="profile-avatar" @error="handleAvatarError" />
                        </a>
                        <button class="avatar-edit-btn p-button-rounded p-button-text" @click="openAvatarDialog" v-tooltip.top="'Change Profile Picture'">
                            <i class="pi pi-camera"></i>
                        </button>
                    </template>
                </div>
                <div class="profile-info">
                    <template v-if="loading">
                        <Skeleton height="2rem" width="200px" class="mb-2" />
                        <Skeleton height="1rem" width="150px" class="mb-2" />
                        <Skeleton height="1rem" width="180px" />
                    </template>
                    <template v-else>
                        <h2>{{ profile.name }}</h2>
                        <p>{{ profile.email }}</p>
                        <p>
                            {{ role.name }} • {{ position.name }}
                            <span v-if="profile.status === 'ACTIVE'" class="status-badge status-active">Active</span>
                            <span v-else-if="profile.status === 'INACTIVE'" class="status-badge status-inactive">Inactive</span>
                            <span v-else class="status-badge status-other">{{ profile.status }}</span>
                        </p>
                    </template>
                </div>
            </div>
        </div>

        <!-- Personal Information -->
        <div class="mb-10">
            <h6 class="mb-3">
                <i class="pi pi-user mr-2"></i>
                Personal Information
            </h6>

            <div class="flex gap-4 mb-3">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">User Code</label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="profile.user_code" placeholder="User Code" class="w-full" disabled />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Full Name<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="profile.name" placeholder="Enter your full name" class="w-full" :class="{ 'p-invalid': nameError }" @input="() => clearError('name')" />
                    </template>
                </div>
            </div>

            <div class="flex gap-4 mb-3">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Email Address<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="profile.email" placeholder="Enter your email" type="email" class="w-full" :class="{ 'p-invalid': emailError }" @input="() => clearError('email')" />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Phone Number<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="profile.phone" placeholder="Enter your phone number" class="w-full" :class="{ 'p-invalid': phoneError }" @input="() => clearError('phone')" />
                    </template>
                </div>
            </div>

            <div class="flex gap-4 mb-3">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Status<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <Dropdown v-model="profile.status" :options="statusOptions" placeholder="Select status" class="w-full" :class="{ 'p-invalid': statusError }" @change="() => clearError('status')" disabled />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Province<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <AutoComplete
                            v-model="profile.province"
                            :suggestions="provinceSuggestions"
                            optionLabel="label"
                            placeholder="Search and select province"
                            :loading="provinceLoading"
                            @complete="searchProvince"
                            :inputClass="{ 'p-invalid': provinceError }"
                            @input="() => clearError('province')"
                            fluid
                        />
                    </template>
                </div>
                <!-- <div class="w-1/2">
                    <label class="font-bold block mb-2">Password</label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <Password v-model="security.newPassword" toggleMask placeholder="Enter new password" class="w-full" :class="{ 'p-invalid': newPasswordError }" @input="() => clearError('newPassword')" fluid />
                        <small class="text-500 block mt-2">Isi Jika ingin mengubah password</small>
                    </template>
                </div> -->
            </div>
            <div class="flex gap-4 mb-3">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">City<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <AutoComplete
                            v-model="profile.city"
                            :suggestions="citySuggestions"
                            optionLabel="label"
                            placeholder="Search and select city"
                            :loading="cityLoading"
                            @complete="searchCity"
                            :inputClass="{ 'p-invalid': cityError }"
                            @input="() => clearError('city')"
                            fluid
                        />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">District<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <AutoComplete
                            v-model="profile.district"
                            :suggestions="districtSuggestions"
                            optionLabel="label"
                            placeholder="Search and select district"
                            :loading="districtLoading"
                            @complete="searchDistrict"
                            :inputClass="{ 'p-invalid': districtError }"
                            @input="() => clearError('district')"
                            fluid
                        />
                    </template>
                </div>
            </div>
            <div class="flex gap-4 mb-3">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Village<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <AutoComplete
                            v-model="profile.village"
                            :suggestions="villageSuggestions"
                            optionLabel="label"
                            placeholder="Search and select village"
                            :loading="villageLoading"
                            @complete="searchVillage"
                            :inputClass="{ 'p-invalid': villageError }"
                            @input="() => clearError('village')"
                            fluid
                        />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Full Address<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="profile.full_address" placeholder="Enter your full address" class="w-full" :class="{ 'p-invalid': fullAddressError }" @input="() => clearError('fullAddress')" />
                    </template>
                </div>
            </div>
        </div>
        <div class="flex justify-end">
            <Button label="Update Profile" icon="pi pi-user" @click="updateProfile" class="p-button" :loading="updatingProfile" />
        </div>

        <!-- Avatar Upload Dialog -->
        <Dialog v-model:visible="showAvatarDialog" header="Change Profile Picture" :style="{ width: '450px' }" :modal="true" class="avatar-dialog">
            <div class="dialog-content">
                <a :href="selectedAvatarPreview || avatarPreview" data-fancybox="avatar-dialog" data-caption="Preview Foto Profil" tabindex="0">
                    <img :src="selectedAvatarPreview || avatarPreview" :alt="profile.name" class="avatar-preview" />
                </a>
                <FileUpload mode="basic" name="photo" accept="image/*" :maxFileSize="2000000" chooseLabel="Choose Image" @select="onAvatarSelect" class="w-full" />
                <small class="text-500 block mt-2">Maximum file size: 2MB. Supported formats: JPG, PNG, GIF</small>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" @click="onCancelAvatarDialog" class="p-button-text" />
                <Button label="Upload" icon="pi pi-check" @click="uploadAvatar" :loading="uploadingAvatar" />
            </template>
        </Dialog>
    </div>
</template>

<script setup>
import AuthService from '@/service/AuthService';
import config from '@/service/config';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import axios from 'axios'; // Added axios import
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import { useToast } from 'primevue/usetoast';
import { nextTick, onMounted, ref, watch } from 'vue';

const toast = useToast();

// Profile data
const profile = ref({
    user_code: '',
    name: '',
    phone: '',
    photo: '',
    email: '',
    status: '',
    province: '',
    city: '',
    district: '',
    village: '',
    full_address: ''
});

// Role data
const role = ref({
    role_code: '',
    name: ''
});

// Position data
const position = ref({
    position_code: '',
    name: ''
});

// Status options for dropdown
const statusOptions = ref(['ACTIVE', 'INACTIVE', 'SUSPENDED']);

// Security data
const security = ref({
    currentPassword: '',
    newPassword: ''
});

// UI state
const loading = ref(false);
const showAvatarDialog = ref(false);
const changingPassword = ref(false);
const uploadingAvatar = ref(false);
const updatingProfile = ref(false);

// Validation states
const isSubmitted = ref(false);
const nameError = ref(false);
const emailError = ref(false);
const phoneError = ref(false);
const statusError = ref(false);
const currentPasswordError = ref(false);
const newPasswordError = ref(false);
const provinceError = ref(false);
const cityError = ref(false);
const districtError = ref(false);
const villageError = ref(false);
const fullAddressError = ref(false);

// Location suggestions states
const provinceSuggestions = ref([]);
const provinceLoading = ref(false);
const citySuggestions = ref([]);
const cityLoading = ref(false);
const districtSuggestions = ref([]);
const districtLoading = ref(false);
const villageSuggestions = ref([]);
const villageLoading = ref(false);
const isLoadingExistingData = ref(false);

// Avatar preview
const avatarPreview = ref('');
// Tambahan untuk preview & file sementara di dialog
const selectedAvatarFile = ref(null);
const selectedAvatarPreview = ref('');

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Location search functions
async function searchProvince(event) {
    const query = event.query?.toLowerCase() || '';
    provinceLoading.value = true;
    try {
        const res = await axios.get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        let provinces = res.data || [];
        if (query) {
            provinces = provinces.filter((p) => p.name.toLowerCase().includes(query));
        }
        provinceSuggestions.value = provinces.map((p) => ({ label: p.name, value: p.name, id: p.id }));
    } catch (e) {
        provinceSuggestions.value = [];
    } finally {
        provinceLoading.value = false;
    }
}

async function searchCity(event) {
    const query = event.query?.toLowerCase() || '';
    cityLoading.value = true;
    try {
        // Ambil province yang dipilih
        const selectedProvince = profile.value.province;
        if (!selectedProvince || !selectedProvince.id) {
            citySuggestions.value = [];
            return;
        }

        const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince.id}.json`);
        let cities = res.data || [];
        if (query) {
            cities = cities.filter((c) => c.name.toLowerCase().includes(query));
        }
        citySuggestions.value = cities.map((c) => ({ label: c.name, value: c.name, id: c.id }));
    } catch (e) {
        citySuggestions.value = [];
    } finally {
        cityLoading.value = false;
    }
}

async function searchDistrict(event) {
    const query = event.query?.toLowerCase() || '';
    districtLoading.value = true;
    try {
        // Ambil city yang dipilih
        const selectedCity = profile.value.city;
        if (!selectedCity || !selectedCity.id) {
            districtSuggestions.value = [];
            return;
        }

        const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity.id}.json`);
        let districts = res.data || [];
        if (query) {
            districts = districts.filter((d) => d.name.toLowerCase().includes(query));
        }
        districtSuggestions.value = districts.map((d) => ({ label: d.name, value: d.name, id: d.id }));
    } catch (e) {
        districtSuggestions.value = [];
    } finally {
        districtLoading.value = false;
    }
}

async function searchVillage(event) {
    const query = event.query?.toLowerCase() || '';
    villageLoading.value = true;
    try {
        // Ambil district yang dipilih
        const selectedDistrict = profile.value.district;
        if (!selectedDistrict || !selectedDistrict.id) {
            villageSuggestions.value = [];
            return;
        }

        const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrict.id}.json`);
        let villages = res.data || [];
        if (query) {
            villages = villages.filter((v) => v.name.toLowerCase().includes(query));
        }
        villageSuggestions.value = villages.map((v) => ({ label: v.name, value: v.name, id: v.id }));
    } catch (e) {
        villageSuggestions.value = [];
    } finally {
        villageLoading.value = false;
    }
}

async function loadExistingLocationData(userData) {
    try {
        // Load province data
        const provinceRes = await axios.get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        const provinces = provinceRes.data || [];
        const province = provinces.find((p) => p.name === userData.province);
        if (province) {
            // Set province tanpa memicu watcher
            profile.value.province = { label: province.name, value: province.name, id: province.id };

            // Load city data
            const cityRes = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${province.id}.json`);
            const cities = cityRes.data || [];
            const city = cities.find((c) => c.name === userData.city);
            if (city) {
                // Set city tanpa memicu watcher
                profile.value.city = { label: city.name, value: city.name, id: city.id };

                // Load district data
                const districtRes = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${city.id}.json`);
                const districts = districtRes.data || [];
                const district = districts.find((d) => d.name === userData.district);
                if (district) {
                    // Set district tanpa memicu watcher
                    profile.value.district = { label: district.name, value: district.name, id: district.id };

                    // Load village data
                    const villageRes = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${district.id}.json`);
                    const villages = villageRes.data || [];
                    const village = villages.find((v) => v.name === userData.village);
                    if (village) {
                        // Set village tanpa memicu watcher
                        profile.value.village = { label: village.name, value: village.name, id: village.id };
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading existing location data:', error);
    }
}

// Load profile data from API
async function loadProfileData() {
    try {
        loading.value = true;

        // Call actual API endpoint
        const response = await AuthService.me();

        if (response && response.statusCode === 200) {
            // Update profile data
            Object.assign(profile.value, response.data.user);
            Object.assign(role.value, response.data.role);
            Object.assign(position.value, response.data.position);

            // Set avatar preview with proper URL handling
            if (profile.value.photo) {
                if (profile.value.photo.startsWith('http')) {
                    avatarPreview.value = profile.value.photo;
                } else {
                    avatarPreview.value = config.API_BASE_URL + profile.value.photo;
                }
            }

            // Load existing location data if available
            if (profile.value.province && profile.value.city && profile.value.district && profile.value.village) {
                isLoadingExistingData.value = true;
                await loadExistingLocationData(profile.value);
                isLoadingExistingData.value = false;
            }
        } else {
        }

        await delay(100);
    } catch (error) {
        console.error('Error loading profile data:', error);
    } finally {
        loading.value = false;
    }
}

function validateForm() {
    isSubmitted.value = true;
    nameError.value = !profile.value.name.trim();
    emailError.value = !profile.value.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.value.email);
    phoneError.value = !profile.value.phone.trim();
    statusError.value = !profile.value.status;
    provinceError.value = !profile.value.province || !profile.value.province.value;
    cityError.value = !profile.value.city || !profile.value.city.value;
    districtError.value = !profile.value.district || !profile.value.district.value;
    villageError.value = !profile.value.village || !profile.value.village.value;
    fullAddressError.value = !profile.value.full_address.trim();
    return !nameError.value && !emailError.value && !phoneError.value && !statusError.value && !provinceError.value && !cityError.value && !districtError.value && !villageError.value && !fullAddressError.value;
}

function validatePasswordForm() {
    isSubmitted.value = true;
    currentPasswordError.value = !security.value.currentPassword.trim();
    newPasswordError.value = !security.value.newPassword.trim() || security.value.newPassword.length < 6;
    return !currentPasswordError.value && !newPasswordError.value;
}

function clearError(field) {
    if (isSubmitted.value) {
        if (field === 'name') nameError.value = false;
        if (field === 'email') emailError.value = false;
        if (field === 'phone') phoneError.value = false;
        if (field === 'status') statusError.value = false;
        if (field === 'currentPassword') currentPasswordError.value = false;
        if (field === 'newPassword') newPasswordError.value = false;
        if (field === 'province') provinceError.value = false;
        if (field === 'city') cityError.value = false;
        if (field === 'district') districtError.value = false;
        if (field === 'village') villageError.value = false;
        if (field === 'fullAddress') fullAddressError.value = false;
    }
}

async function updateProfile() {
    if (!validateForm()) {
        return;
    }

    try {
        updatingProfile.value = true;

        // Check if there's a new photo uploaded (File object)
        const hasNewPhoto = profile.value.photo instanceof File;
        const hasNewPassword = security.value.newPassword && security.value.newPassword.trim() !== '';

        if (hasNewPhoto) {
            // If there's a new photo, send FormData with 'photo' field
            const formData = new FormData();
            formData.append('name', profile.value.name);
            formData.append('email', profile.value.email);
            formData.append('phone', profile.value.phone);
            formData.append('status', profile.value.status);
            formData.append('photo', profile.value.photo);
            formData.append('province', profile.value.province?.value || profile.value.province);
            formData.append('city', profile.value.city?.value || profile.value.city);
            formData.append('district', profile.value.district?.value || profile.value.district);
            formData.append('village', profile.value.village?.value || profile.value.village);
            formData.append('full_address', profile.value.full_address);

            // Add password if provided
            if (hasNewPassword) {
                formData.append('password', security.value.newPassword);
            }

            await AuthService.updateMyProfile(formData);
        } else {
            // If no new photo, send JSON without photo field
            const payload = {
                name: profile.value.name,
                email: profile.value.email,
                phone: profile.value.phone,
                status: profile.value.status,
                province: profile.value.province?.value || profile.value.province,
                city: profile.value.city?.value || profile.value.city,
                district: profile.value.district?.value || profile.value.district,
                village: profile.value.village?.value || profile.value.village,
                full_address: profile.value.full_address
            };

            // Add password if provided
            if (hasNewPassword) {
                payload.password = security.value.newPassword;
            }

            await AuthService.updateMyProfile(payload);
        }

        // Clear password fields after successful update
        security.value.currentPassword = '';
        security.value.newPassword = '';

        // Reload profile data to get updated information
        await loadProfileData();
    } catch (error) {
        console.error('Error saving profile:', error);
    } finally {
        updatingProfile.value = false;
    }
}

function handleAvatarError(event) {
    event.target.src = '/demo/images/default.jpg';
}

function getProfilePhotoUrl() {
    if (profile.value.photo) {
        if (profile.value.photo.startsWith('http')) {
            return profile.value.photo;
        } else {
            return config.API_BASE_URL + profile.value.photo;
        }
    }
    return '/demo/images/default.jpg'; // Fallback to default if no photo
}

// Fungsi untuk membuka dialog avatar
function openAvatarDialog() {
    showAvatarDialog.value = true;
    selectedAvatarFile.value = null;
    // Set preview dialog ke foto profil terakhir
    selectedAvatarPreview.value = avatarPreview.value;
}
// Fungsi untuk cancel dialog avatar
function onCancelAvatarDialog() {
    showAvatarDialog.value = false;
    selectedAvatarFile.value = null;
    selectedAvatarPreview.value = '';
}

function onAvatarSelect(event) {
    const file = event.files[0];
    if (file) {
        selectedAvatarFile.value = file;
        const reader = new FileReader();
        reader.onload = async (e) => {
            selectedAvatarPreview.value = e.target.result;
            await nextTick();
            Fancybox.bind('[data-fancybox="profile-avatar"]', { groupAll: false });
            Fancybox.bind('[data-fancybox="avatar-dialog"]', { groupAll: false });
        };
        reader.readAsDataURL(file);
    }
}

async function uploadAvatar() {
    if (!selectedAvatarFile.value) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Please select an image file first',
            life: 4000
        });
        return;
    }
    try {
        uploadingAvatar.value = true;
        // Create FormData for photo upload
        const formData = new FormData();
        formData.append('photo', selectedAvatarFile.value);
        await AuthService.updateMyProfile(formData);
        showAvatarDialog.value = false;
        selectedAvatarFile.value = null;
        selectedAvatarPreview.value = '';
        // Reload profile data to get updated photo
        await loadProfileData();
    } catch (error) {
        console.error('Error uploading avatar:', error);
    } finally {
        uploadingAvatar.value = false;
    }
}

onMounted(() => {
    loadProfileData();
    Fancybox.bind('[data-fancybox="profile-avatar"]', { groupAll: false });
    Fancybox.bind('[data-fancybox="avatar-dialog"]', { groupAll: false });
});

// Watch untuk reset field ketika parent field berubah
watch(
    () => profile.value.province,
    (newProvince, oldProvince) => {
        // Hanya reset jika ada perubahan, bukan saat pertama kali load, dan bukan saat loading existing data
        if (newProvince !== oldProvince && oldProvince !== undefined && oldProvince !== '' && !isLoadingExistingData.value) {
            profile.value.city = '';
            profile.value.district = '';
            profile.value.village = '';
            citySuggestions.value = [];
            districtSuggestions.value = [];
            villageSuggestions.value = [];
        }
    }
);

watch(
    () => profile.value.city,
    (newCity, oldCity) => {
        // Hanya reset jika ada perubahan, bukan saat pertama kali load, dan bukan saat loading existing data
        if (newCity !== oldCity && oldCity !== undefined && oldCity !== '' && !isLoadingExistingData.value) {
            profile.value.district = '';
            profile.value.village = '';
            districtSuggestions.value = [];
            villageSuggestions.value = [];
        }
    }
);

watch(
    () => profile.value.district,
    (newDistrict, oldDistrict) => {
        // Hanya reset jika ada perubahan, bukan saat pertama kali load, dan bukan saat loading existing data
        if (newDistrict !== oldDistrict && oldDistrict !== undefined && oldDistrict !== '' && !isLoadingExistingData.value) {
            profile.value.village = '';
            villageSuggestions.value = [];
        }
    }
);
</script>

<style scoped>
.profile-header {
    border-bottom: 1px solid var(--surface-border);
    padding-bottom: 2rem;
}

.profile-avatar-container {
    position: relative;
    display: inline-block;
}

.profile-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid var(--surface-border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.avatar-edit-btn {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--primary-color);
    color: var(--primary-contrast-color);
    border: 3px solid var(--surface-card);
    width: 40px;
    height: 40px;
}

.avatar-edit-btn:hover {
    background: var(--primary-600);
}

.profile-info h2 {
    color: var(--text-color);
    margin: 1rem 0 0.5rem 0;
}

.profile-info p {
    color: var(--text-color-secondary);
    margin: 0 0 0.25rem 0;
}

.avatar-preview {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 1rem;
}

.status-badge {
    display: inline-block;
    padding: 0.2em 0.8em;
    border-radius: 1em;
    font-size: 0.85em;
    font-weight: 600;
    color: #fff;
    margin-left: 0.5em;
}
.status-active {
    background: #22c55e; /* hijau */
}
.status-inactive {
    background: #ef4444; /* merah */
}
.status-other {
    background: #64748b; /* netral abu */
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .profile-avatar {
        width: 80px;
        height: 80px;
    }

    .avatar-edit-btn {
        width: 32px;
        height: 32px;
    }
}
</style>
