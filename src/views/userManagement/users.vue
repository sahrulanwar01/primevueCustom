<script setup>
import config from '@/service/config';
import RoleService from '@/service/userManagement/roleService';
import usersService from '@/service/userManagement/usersService';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import axios from 'axios';
import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Helper untuk bikin URL lengkap dari path relatif
function buildFullUrl(path) {
    const baseUrl = config.API_BASE_URL || '';
    return path && !path.startsWith('http') ? baseUrl + path : path;
}

// ===== ROUTER & ROUTE =====
const route = useRoute();
const router = useRouter();

// ===== REACTIVE DATA =====
const users = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const page = ref(parseInt(route.query.page) || 1);
const limit = ref(parseInt(route.query.limit) || 10);
const search = ref(route.query.search || '');
const permissions = ref({
    can_create: false,
    can_update: false,
    can_delete: false
});

// ===== DIALOG STATES =====
const showAddDialog = ref(false);
const showDeleteDialog = ref(false);
const showEditDialog = ref(false);

// ===== FORM DATA =====
const addUserForm = ref({
    name: '',
    email: '',
    password: '',
    phone: '',
    role_code: null,
    photo: null,
    status: 'ACTIVE',
    province: '',
    city: '',
    district: '',
    village: '',
    full_address: ''
});

const editForm = ref({
    name: '',
    email: '',
    phone: '',
    role_code: null,
    status: 'ACTIVE',
    photo: null,
    province: '',
    city: '',
    district: '',
    village: '',
    full_address: ''
});

// ===== VALIDATION STATES =====
const addUserError = ref(false);
const nameError = ref(false);
const emailError = ref(false);
const passwordError = ref(false);
const phoneError = ref(false);
const photoError = ref(false);
const statusError = ref(false);
const roleError = ref(false);
const provinceError = ref(false);
const cityError = ref(false);
const districtError = ref(false);
const villageError = ref(false);
const fullAddressError = ref(false);
const editError = ref('');

// ===== EDIT VALIDATION STATES =====
const editNameError = ref(false);
const editEmailError = ref(false);
const editPhoneError = ref(false);
const editStatusError = ref(false);
const editRoleError = ref(false);
const editProvinceError = ref(false);
const editCityError = ref(false);
const editDistrictError = ref(false);
const editVillageError = ref(false);
const editFullAddressError = ref(false);

// ===== LOADING STATES =====
const deleteLoading = ref(false);
const editLoading = ref(false);
const roleLoading = ref(false);

// ===== OTHER STATES =====
const roleSuggestions = ref([]);
const photoPreview = ref(null);
const editPhotoPreview = ref(null);
const userToDelete = ref(null);
const selectedUser = ref(null);
const provinceSuggestions = ref([]);
const provinceLoading = ref(false);
const citySuggestions = ref([]);
const cityLoading = ref(false);
const districtSuggestions = ref([]);
const districtLoading = ref(false);
const villageSuggestions = ref([]);
const villageLoading = ref(false);
const isLoadingExistingData = ref(false);

// ===== OPTIONS =====
const statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
];

// ===== UTILITY FUNCTIONS =====
function getStatusClass(status) {
    return {
        'px-3 py-1 rounded-md text-sm font-medium gap-2': true,
        'bg-green-100 text-green-800 border border-green-200': status === 'ACTIVE',
        'bg-red-100 text-red-800 border border-red-200': status === 'INACTIVE'
    };
}

// ===== VALIDATION CLEAR FUNCTIONS =====
function clearNameError() {
    nameError.value = false;
}

function clearEmailError() {
    emailError.value = false;
}

function clearPasswordError() {
    passwordError.value = false;
}

function clearRoleError() {
    roleError.value = false;
}

function clearPhoneError() {
    phoneError.value = false;
}

function clearPhotoError() {
    photoError.value = false;
}

function clearStatusError() {
    statusError.value = false;
}

function clearProvinceError() {
    provinceError.value = false;
}

function clearCityError() {
    cityError.value = false;
}

function clearDistrictError() {
    districtError.value = false;
}

function clearVillageError() {
    villageError.value = false;
}

function clearFullAddressError() {
    fullAddressError.value = false;
}

// ===== EDIT VALIDATION CLEAR FUNCTIONS =====
function clearEditNameError() {
    editNameError.value = false;
}

function clearEditEmailError() {
    editEmailError.value = false;
}

function clearEditPhoneError() {
    editPhoneError.value = false;
}

function clearEditStatusError() {
    editStatusError.value = false;
}

function clearEditRoleError() {
    editRoleError.value = false;
}

function clearEditProvinceError() {
    editProvinceError.value = false;
}

function clearEditCityError() {
    editCityError.value = false;
}

function clearEditDistrictError() {
    editDistrictError.value = false;
}

function clearEditVillageError() {
    editVillageError.value = false;
}

function clearEditFullAddressError() {
    editFullAddressError.value = false;
}

// ===== EDIT AUTOCOMPLETE HANDLERS =====
function onEditRoleSelect() {
    clearEditRoleError();
}

function onEditProvinceSelect() {
    clearEditProvinceError();
}

function onEditCitySelect() {
    clearEditCityError();
}

function onEditDistrictSelect() {
    clearEditDistrictError();
}

function onEditVillageSelect() {
    clearEditVillageError();
}

function closeEditDialog() {
    showEditDialog.value = false;
    // Reset edit validation states
    editNameError.value = false;
    editEmailError.value = false;
    editPhoneError.value = false;
    editStatusError.value = false;
    editRoleError.value = false;
    editProvinceError.value = false;
    editCityError.value = false;
    editDistrictError.value = false;
    editVillageError.value = false;
    editFullAddressError.value = false;
    editError.value = '';
}

// ===== FORM HANDLING FUNCTIONS =====
function resetAddUserForm() {
    addUserForm.value = {
        name: '',
        email: '',
        password: '',
        phone: '',
        role_code: null,
        photo: null,
        status: 'ACTIVE',
        province: '',
        city: '',
        district: '',
        village: '',
        full_address: ''
    };
    addUserError.value = '';
    nameError.value = false;
    emailError.value = false;
    passwordError.value = false;
    roleError.value = false;
    phoneError.value = false;
    photoError.value = false;
    statusError.value = false;
    // Field berikut tidak required di add dialog, jadi tidak perlu reset error state
    // provinceError.value = false;
    // cityError.value = false;
    // districtError.value = false;
    // villageError.value = false;
    // fullAddressError.value = false;
    photoPreview.value = null;
    citySuggestions.value = [];
    districtSuggestions.value = [];
    villageSuggestions.value = [];
}

async function submitAddUser() {
    addUserError.value = '';
    nameError.value = false;
    emailError.value = false;
    passwordError.value = false;
    roleError.value = false;
    phoneError.value = false;
    photoError.value = false;
    statusError.value = false;

    // Validate required fields
    let hasError = false;
    if (!addUserForm.value.name) {
        nameError.value = true;
        hasError = true;
    }
    if (!addUserForm.value.email) {
        emailError.value = true;
        hasError = true;
    }
    if (!addUserForm.value.password) {
        passwordError.value = true;
        hasError = true;
    }
    if (!addUserForm.value.role_code || !addUserForm.value.role_code.code) {
        roleError.value = true;
        hasError = true;
    }
    if (!addUserForm.value.phone) {
        phoneError.value = true;
        hasError = true;
    }
    if (!addUserForm.value.photo) {
        photoError.value = true;
        hasError = true;
    }
    if (!addUserForm.value.status) {
        statusError.value = true;
        hasError = true;
    }

    if (hasError) {
        addUserError.value = 'Semua field wajib diisi.';
        return;
    }

    try {
        const payload = { ...addUserForm.value, role_code: addUserForm.value.role_code.code };
        // Handle province, city, district, village values
        payload.province = payload.province?.value || payload.province;
        payload.city = payload.city?.value || payload.city;
        payload.district = payload.district?.value || payload.district;
        payload.village = payload.village?.value || payload.village;

        if (payload.photo instanceof File) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, val]) => {
                if (key === 'photo' && val) {
                    formData.append('photo', val);
                } else {
                    formData.append(key, val);
                }
            });
            await usersService.addUser(formData);
        } else {
            await usersService.addUser(payload);
        }
        showAddDialog.value = false;
        resetAddUserForm();
        fetchUsers();
    } catch (e) {
        // Error toast sudah otomatis ditangani oleh interceptor
    }
}

// ===== CRUD OPERATIONS =====
async function fetchUsers() {
    loading.value = true;
    try {
        const res = await usersService.getUsers({ page: page.value, limit: limit.value, search: search.value });
        const responseData = res.data || res;
        users.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        if (responseData.permissions) {
            permissions.value = responseData.permissions;
        }
    } catch (error) {
        console.error('Error fetching users:', error);
        users.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
}

async function searchRole(event) {
    const query = event.query?.toLowerCase() || '';
    roleLoading.value = true;
    try {
        const res = await RoleService.getRoles({ page: 1, limit: 20, search: query });
        const data = res.data || res;
        roleSuggestions.value = (Array.isArray(data.data) ? data.data : []).map((r) => ({ name: r.name, code: r.role_code }));
    } catch (e) {
        roleSuggestions.value = [];
    } finally {
        roleLoading.value = false;
    }
}

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
        // Ambil province yang dipilih (bisa dari edit form atau add form)
        const selectedProvince = editForm.value.province || addUserForm.value.province;
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
        // Ambil city yang dipilih (bisa dari edit form atau add form)
        const selectedCity = editForm.value.city || addUserForm.value.city;
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
        // Ambil district yang dipilih (bisa dari edit form atau add form)
        const selectedDistrict = editForm.value.district || addUserForm.value.district;
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
            editForm.value.province = { label: province.name, value: province.name, id: province.id };

            // Load city data
            const cityRes = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${province.id}.json`);
            const cities = cityRes.data || [];
            const city = cities.find((c) => c.name === userData.city);
            if (city) {
                // Set city tanpa memicu watcher
                editForm.value.city = { label: city.name, value: city.name, id: city.id };

                // Load district data
                const districtRes = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${city.id}.json`);
                const districts = districtRes.data || [];
                const district = districts.find((d) => d.name === userData.district);
                if (district) {
                    // Set district tanpa memicu watcher
                    editForm.value.district = { label: district.name, value: district.name, id: district.id };

                    // Load village data
                    const villageRes = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${district.id}.json`);
                    const villages = villageRes.data || [];
                    const village = villages.find((v) => v.name === userData.village);
                    if (village) {
                        // Set village tanpa memicu watcher
                        editForm.value.village = { label: village.name, value: village.name, id: village.id };
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading existing location data:', error);
    }
}

function confirmDeleteUser(user) {
    userToDelete.value = user;
    showDeleteDialog.value = true;
}

async function deleteUser() {
    deleteLoading.value = true;
    try {
        await usersService.deleteUser(userToDelete.value.user_code);
        showDeleteDialog.value = false;
        fetchUsers();
    } catch (e) {
        // Error toast sudah otomatis ditangani oleh interceptor
    } finally {
        deleteLoading.value = false;
    }
}

function confirmEditUser(user) {
    selectedUser.value = user;
    editLoading.value = true;
    editError.value = '';
    editForm.value = {
        name: '',
        email: '',
        phone: '',
        role_code: null,
        status: 'ACTIVE',
        photo: null,
        province: '',
        city: '',
        district: '',
        village: '',
        full_address: ''
    };
    editPhotoPreview.value = null;
    citySuggestions.value = [];
    districtSuggestions.value = [];
    villageSuggestions.value = [];

    // Reset edit validation states
    editNameError.value = false;
    editEmailError.value = false;
    editPhoneError.value = false;
    editStatusError.value = false;
    editRoleError.value = false;
    editProvinceError.value = false;
    editCityError.value = false;
    editDistrictError.value = false;
    editVillageError.value = false;
    editFullAddressError.value = false;

    try {
        usersService.getUserDetails(user.user_code).then(async (res) => {
            const userData = res.data || res;
            editForm.value = {
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                role_code: userData.role ? { name: userData.role.name, code: userData.role.role_code } : null,
                status: userData.status,
                photo: null,
                province: userData.province ? { label: userData.province, value: userData.province } : '',
                city: userData.city ? { label: userData.city, value: userData.city } : '',
                district: userData.district ? { label: userData.district, value: userData.district } : '',
                village: userData.village ? { label: userData.village, value: userData.village } : '',
                full_address: userData.full_address || ''
            };

            // Load existing data untuk suggestions
            if (userData.province) {
                isLoadingExistingData.value = true;
                await loadExistingLocationData(userData);
                isLoadingExistingData.value = false;
            }

            if (userData.photo) {
                editPhotoPreview.value = buildFullUrl(userData.photo);
                await nextTick();
                Fancybox.bind('[data-fancybox="edit-preview"]', {
                    groupAll: false
                });
            }
            showEditDialog.value = true;
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
    } finally {
        editLoading.value = false;
    }
}

async function submitEditUser() {
    // Reset validation states
    editNameError.value = false;
    editEmailError.value = false;
    editPhoneError.value = false;
    editStatusError.value = false;
    editRoleError.value = false;
    editProvinceError.value = false;
    editCityError.value = false;
    editDistrictError.value = false;
    editVillageError.value = false;
    editFullAddressError.value = false;
    editError.value = '';

    // Validate required fields
    let hasError = false;
    if (!editForm.value.name) {
        editNameError.value = true;
        hasError = true;
    }
    if (!editForm.value.email) {
        editEmailError.value = true;
        hasError = true;
    }
    if (!editForm.value.phone) {
        editPhoneError.value = true;
        hasError = true;
    }
    if (!editForm.value.role_code || !editForm.value.role_code.code) {
        editRoleError.value = true;
        hasError = true;
    }
    if (!editForm.value.status) {
        editStatusError.value = true;
        hasError = true;
    }
    if (!editForm.value.province) {
        editProvinceError.value = true;
        hasError = true;
    }
    if (!editForm.value.city) {
        editCityError.value = true;
        hasError = true;
    }
    if (!editForm.value.district) {
        editDistrictError.value = true;
        hasError = true;
    }
    if (!editForm.value.village) {
        editVillageError.value = true;
        hasError = true;
    }
    if (!editForm.value.full_address) {
        editFullAddressError.value = true;
        hasError = true;
    }

    if (hasError) {
        editError.value = 'Semua field wajib diisi.';
        return;
    }

    editLoading.value = true;
    editError.value = '';

    try {
        // Check if there's a new photo uploaded (File object)
        const hasNewPhoto = editForm.value.photo instanceof File;

        if (hasNewPhoto) {
            // If there's a new photo, send FormData with 'photo' field
            const formData = new FormData();
            formData.append('name', editForm.value.name);
            formData.append('email', editForm.value.email);
            formData.append('phone', editForm.value.phone);
            formData.append('role_code', editForm.value.role_code.code);
            formData.append('status', editForm.value.status);
            formData.append('photo', editForm.value.photo);
            formData.append('province', editForm.value.province?.value || editForm.value.province);
            formData.append('city', editForm.value.city?.value || editForm.value.city);
            formData.append('district', editForm.value.district?.value || editForm.value.district);
            formData.append('village', editForm.value.village?.value || editForm.value.village);
            formData.append('full_address', editForm.value.full_address);

            await usersService.updateUser(selectedUser.value.user_code, formData);
        } else {
            // If no new photo, send JSON without photo field
            const payload = {
                name: editForm.value.name,
                email: editForm.value.email,
                phone: editForm.value.phone,
                role_code: editForm.value.role_code.code,
                status: editForm.value.status,
                province: editForm.value.province?.value || editForm.value.province,
                city: editForm.value.city?.value || editForm.value.city,
                district: editForm.value.district?.value || editForm.value.district,
                village: editForm.value.village?.value || editForm.value.village,
                full_address: editForm.value.full_address
            };

            await usersService.updateUser(selectedUser.value.user_code, payload);
        }

        showEditDialog.value = false;
        fetchUsers();
    } catch (e) {
        // editError.value = e?.response?.data?.message || 'Gagal update user.';
    } finally {
        editLoading.value = false;
    }
}

// ===== URL UPDATE FUNCTIONS =====
function updateURL() {
    const query = {};
    if (page.value > 1) query.page = page.value.toString();
    if (limit.value !== 10) query.limit = limit.value.toString();
    if (search.value.trim()) query.search = search.value.trim();

    router.replace({ query });
}

// ===== EVENT HANDLING FUNCTIONS =====
function onSearchInput(e) {
    page.value = 1;
}

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    updateURL();
    fetchUsers();
}

function onPhotoSelect(event) {
    const file = event.files && event.files[0];
    if (file) {
        addUserForm.value.photo = file;
        clearPhotoError();
        const reader = new FileReader();
        reader.onload = async (e) => {
            photoPreview.value = e.target.result;
            await nextTick();
            Fancybox.bind('[data-fancybox="preview"]', {
                groupAll: false
            });
        };
        reader.readAsDataURL(file);
    }
}

function onEditPhotoSelect(event) {
    const file = event.files && event.files[0];
    if (file) {
        // Simpan File object langsung untuk dikirim ke backend
        editForm.value.photo = file;

        const reader = new FileReader();
        reader.onload = async (e) => {
            editPhotoPreview.value = e.target.result;
            await nextTick();
            Fancybox.bind('[data-fancybox="edit-preview"]', {
                groupAll: false
            });
        };
        reader.readAsDataURL(file);
    }
}

// ===== WATCHERS =====
watch(
    search,
    (val, oldVal) => {
        if (val !== oldVal) {
            page.value = 1;
            updateURL();
            fetchUsers();
        }
    },
    { debounce: 300 }
);

// Watch untuk reset field ketika parent field berubah
watch(
    () => editForm.value.province,
    (newProvince, oldProvince) => {
        // Hanya reset jika ada perubahan, bukan saat pertama kali load, dan bukan saat loading existing data
        if (newProvince !== oldProvince && oldProvince !== undefined && oldProvince !== '' && !isLoadingExistingData.value) {
            editForm.value.city = '';
            editForm.value.district = '';
            editForm.value.village = '';
            citySuggestions.value = [];
            districtSuggestions.value = [];
            villageSuggestions.value = [];
        }
    }
);

watch(
    () => editForm.value.city,
    (newCity, oldCity) => {
        // Hanya reset jika ada perubahan, bukan saat pertama kali load, dan bukan saat loading existing data
        if (newCity !== oldCity && oldCity !== undefined && oldCity !== '' && !isLoadingExistingData.value) {
            editForm.value.district = '';
            editForm.value.village = '';
            districtSuggestions.value = [];
            villageSuggestions.value = [];
        }
    }
);

watch(
    () => editForm.value.district,
    (newDistrict, oldDistrict) => {
        // Hanya reset jika ada perubahan, bukan saat pertama kali load, dan bukan saat loading existing data
        if (newDistrict !== oldDistrict && oldDistrict !== undefined && oldDistrict !== '' && !isLoadingExistingData.value) {
            editForm.value.village = '';
            villageSuggestions.value = [];
        }
    }
);

// Watch untuk form tambah user
watch(
    () => addUserForm.value.province,
    (newProvince, oldProvince) => {
        if (newProvince !== oldProvince && oldProvince !== undefined && oldProvince !== '') {
            addUserForm.value.city = '';
            addUserForm.value.district = '';
            addUserForm.value.village = '';
            citySuggestions.value = [];
            districtSuggestions.value = [];
            villageSuggestions.value = [];
        }
    }
);

watch(
    () => addUserForm.value.city,
    (newCity, oldCity) => {
        if (newCity !== oldCity && oldCity !== undefined && oldCity !== '') {
            addUserForm.value.district = '';
            addUserForm.value.village = '';
            districtSuggestions.value = [];
            villageSuggestions.value = [];
        }
    }
);

watch(
    () => addUserForm.value.district,
    (newDistrict, oldDistrict) => {
        if (newDistrict !== oldDistrict && oldDistrict !== undefined && oldDistrict !== '') {
            addUserForm.value.village = '';
            villageSuggestions.value = [];
        }
    }
);

// ===== LIFECYCLE =====
onMounted(fetchUsers);
</script>

<template>
    <div>
        <div class="card">
            <div class="mb-3 flex justify-between items-center">
                <h4 class="m-0">User Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : users"
                dataKey="user_code"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[5, 10, 25]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} users"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :emptyMessage="loading ? '' : 'No data available'"
            >
                <div class="flex flex-wrap items-center justify-between w-full mb-6 mt-6">
                    <div class="flex-1 flex items-center">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="search" placeholder="Search..." @input="onSearchInput" />
                        </IconField>
                    </div>
                    <div class="flex-1 flex justify-end">
                        <Button v-if="permissions.can_create" label="Add" icon="pi pi-plus" @click="showAddDialog = true" />
                    </div>
                </div>
                <Column field="user_code" header="User Code" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.user_code }}
                        </template>
                    </template>
                </Column>
                <Column field="name" header="Name" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.name }}
                        </template>
                    </template>
                </Column>
                <Column field="status" header="Status" sortable style="max-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <span :class="getStatusClass(slotProps.data.status)">
                                <i
                                    :class="{
                                        'pi pi-check-circle': slotProps.data.status === 'ACTIVE',
                                        'pi pi-times-circle': slotProps.data.status === 'INACTIVE'
                                    }"
                                ></i>
                                {{ slotProps.data.status }}
                            </span>
                        </template>
                    </template>
                </Column>
                <Column field="positions" header="Position" sortable style="min-width: 14rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.positions }}
                        </template>
                    </template>
                </Column>
                <Column field="email" header="Email" sortable style="min-width: 14rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.email }}
                        </template>
                    </template>
                </Column>
                <Column field="phone" header="Phone" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.phone }}
                        </template>
                    </template>
                </Column>
                <Column field="province" header="Province" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.province }}
                        </template>
                    </template>
                </Column>
                <Column field="city" header="City" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.city }}
                        </template>
                    </template>
                </Column>
                <Column v-if="permissions.can_update || permissions.can_delete" header="Actions" style="min-width: 10rem">
                    <template #body="slotProps">
                        <Button v-if="permissions.can_update" icon="pi pi-pencil" size="small" outlined rounded class="mr-2" @click="confirmEditUser(slotProps.data)" />
                        <Button v-if="permissions.can_delete" icon="pi pi-trash" size="small" outlined rounded severity="danger" @click="confirmDeleteUser(slotProps.data)" />
                    </template>
                </Column>

                <!-- Empty State Template -->
                <template #empty>
                    <div v-if="!loading" class="flex flex-col items-center justify-center py-12">
                        <img src="/noData.png" alt="No Data" style="width: 25%" class="mb-6 opacity-60" />
                    </div>
                </template>
            </DataTable>
        </div>
        <!-- Dialog Tambah User -->
        <Dialog v-model:visible="showAddDialog" header="Add User" :modal="true" :style="{ width: '1000px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="user-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="user-name" v-model="addUserForm.name" placeholder="Enter Name" :class="{ 'p-invalid': nameError }" @input="clearNameError" fluid />
                </div>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="user-email" class="block font-bold mb-2">Email<span class="text-red-500">*</span></label>
                        <InputText id="user-email" v-model="addUserForm.email" placeholder="Enter email" :class="{ 'p-invalid': emailError }" @input="clearEmailError" fluid />
                    </div>
                    <div class="w-1/2">
                        <label for="user-password" class="block font-bold mb-2">Password<span class="text-red-500">*</span></label>
                        <InputText id="user-password" v-model="addUserForm.password" placeholder="Enter password" type="password" :class="{ 'p-invalid': passwordError }" @input="clearPasswordError" fluid />
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="user-phone" class="block font-bold mb-2">No. HP<span class="text-red-500">*</span></label>
                        <InputText id="user-phone" v-model="addUserForm.phone" placeholder="Enter no. HP" :class="{ 'p-invalid': phoneError }" @input="clearPhoneError" fluid />
                    </div>
                    <div class="w-1/2">
                        <label for="user-role" class="block font-bold mb-2">Role<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="user-role"
                            v-model="addUserForm.role_code"
                            :suggestions="roleSuggestions"
                            optionLabel="name"
                            placeholder="Search and select role"
                            :loading="roleLoading"
                            @complete="searchRole"
                            :input-class="{ 'p-invalid': roleError }"
                            @item-select="clearRoleError"
                            fluid
                        />
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="user-status" class="block font-bold mb-2">Status<span class="text-red-500">*</span></label>
                        <Dropdown id="user-status" v-model="addUserForm.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" :class="{ 'p-invalid': statusError }" @change="clearStatusError" fluid />
                    </div>
                    <div class="w-1/2">
                        <label for="user-province" class="block font-bold mb-2">Province</label>
                        <AutoComplete
                            id="user-province"
                            v-model="addUserForm.province"
                            :suggestions="provinceSuggestions"
                            optionLabel="label"
                            placeholder="Search and select province"
                            :loading="provinceLoading"
                            @complete="searchProvince"
                            @change="clearProvinceError"
                            fluid
                        />
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="user-city" class="block font-bold mb-2">City</label>
                        <AutoComplete id="user-city" v-model="addUserForm.city" :suggestions="citySuggestions" optionLabel="label" placeholder="Search and select city" :loading="cityLoading" @complete="searchCity" @change="clearCityError" fluid />
                    </div>
                    <div class="w-1/2">
                        <label for="user-district" class="block font-bold mb-2">District</label>
                        <AutoComplete
                            id="user-district"
                            v-model="addUserForm.district"
                            :suggestions="districtSuggestions"
                            optionLabel="label"
                            placeholder="Search and select district"
                            :loading="districtLoading"
                            @complete="searchDistrict"
                            @change="clearDistrictError"
                            fluid
                        />
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="user-village" class="block font-bold mb-2">Village</label>
                        <AutoComplete
                            id="user-village"
                            v-model="addUserForm.village"
                            :suggestions="villageSuggestions"
                            optionLabel="label"
                            placeholder="Search and select village"
                            :loading="villageLoading"
                            @complete="searchVillage"
                            @change="clearVillageError"
                            fluid
                        />
                    </div>
                    <div class="w-1/2">
                        <label for="user-full_address" class="block font-bold mb-2">Full Address</label>
                        <InputText id="user-full_address" v-model="addUserForm.full_address" placeholder="Enter full address" @input="clearFullAddressError" fluid />
                    </div>
                </div>
                <div>
                    <label for="user-photo" class="block font-bold mb-2">Photo<span class="text-red-500">*</span></label>
                    <FileUpload mode="basic" name="photo" accept="image/*" :maxFileSize="2000000" chooseLabel="Select Photo" @select="onPhotoSelect" :class="{ 'p-invalid': photoError }" class="w-full" />
                    <div v-if="photoPreview" class="mt-2">
                        <a :href="photoPreview" data-fancybox="preview" data-caption="Preview Foto" tabindex="0">
                            <img :src="photoPreview" alt="Preview Foto" class="w-32 h-32 object-cover rounded shadow border cursor-pointer hover:opacity-80 transition" />
                        </a>
                    </div>
                    <small v-if="photoError" class="p-error block mt-1 text-red-500">Photo wajib diunggah.</small>
                    <small class="text-500 block mt-2">Max 2MB. Format: JPG, PNG, GIF</small>
                </div>
            </div>
            <template #footer>
                <Button
                    label="Batal"
                    icon="pi pi-times"
                    outlined
                    severity="secondary"
                    @click="
                        () => {
                            showAddDialog = false;
                            resetAddUserForm();
                        }
                    "
                />
                <Button label="Simpan" icon="pi pi-check" @click="submitAddUser" />
            </template>
        </Dialog>
        <Dialog v-model:visible="showDeleteDialog" header="Delete User" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div>
                    This action cannot be undone. The user <strong>"{{ userToDelete?.name }}"</strong> will be permanently deleted.
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showDeleteDialog = false" :disabled="deleteLoading" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteUser" :loading="deleteLoading" />
            </template>
        </Dialog>
        <!-- Dialog Edit User -->
        <Dialog v-model:visible="showEditDialog" header="Edit User" :modal="true" :style="{ width: '1000px' }">
            <div class="flex flex-col gap-4">
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="edit-user-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                        <InputText id="edit-user-name" v-model="editForm.name" placeholder="Enter Name" :class="{ 'p-invalid': editNameError }" @input="clearEditNameError" fluid />
                        <small v-if="editNameError" class="p-error block mt-1 text-red-500">Name wajib diisi.</small>
                    </div>
                    <div class="w-1/2">
                        <label for="edit-user-role" class="block font-bold mb-2">Role<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="edit-user-role"
                            v-model="editForm.role_code"
                            :suggestions="roleSuggestions"
                            optionLabel="name"
                            placeholder="Search and select role"
                            :loading="roleLoading"
                            @complete="searchRole"
                            :input-class="{ 'p-invalid': editRoleError }"
                            @item-select="onEditRoleSelect"
                            fluid
                        />
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="edit-user-email" class="block font-bold mb-2">Email<span class="text-red-500">*</span></label>
                        <InputText id="edit-user-email" v-model="editForm.email" placeholder="Enter email" :class="{ 'p-invalid': editEmailError }" @input="clearEditEmailError" fluid />
                    </div>
                    <div class="w-1/2">
                        <label for="edit-user-phone" class="block font-bold mb-2">No. HP<span class="text-red-500">*</span></label>
                        <InputText id="edit-user-phone" v-model="editForm.phone" placeholder="Enter no. HP" :class="{ 'p-invalid': editPhoneError }" @input="clearEditPhoneError" fluid />
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="edit-user-status" class="block font-bold mb-2">Status<span class="text-red-500">*</span></label>
                        <Dropdown
                            id="edit-user-status"
                            v-model="editForm.status"
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Pilih status"
                            :class="{ 'p-invalid': editStatusError }"
                            @change="clearEditStatusError"
                            fluid
                        />
                    </div>
                    <div class="w-1/2">
                        <label for="edit-user-province" class="block font-bold mb-2">Province<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="edit-user-province"
                            v-model="editForm.province"
                            :suggestions="provinceSuggestions"
                            optionLabel="label"
                            placeholder="Search and select province"
                            :loading="provinceLoading"
                            @complete="searchProvince"
                            :input-class="{ 'p-invalid': editProvinceError }"
                            @item-select="onEditProvinceSelect"
                            fluid
                        />
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="edit-user-city" class="block font-bold mb-2">City<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="edit-user-city"
                            v-model="editForm.city"
                            :suggestions="citySuggestions"
                            optionLabel="label"
                            placeholder="Search and select city"
                            :loading="cityLoading"
                            @complete="searchCity"
                            :input-class="{ 'p-invalid': editCityError }"
                            @item-select="onEditCitySelect"
                            fluid
                        />
                    </div>
                    <div class="w-1/2">
                        <label for="edit-user-district" class="block font-bold mb-2">District<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="edit-user-district"
                            v-model="editForm.district"
                            :suggestions="districtSuggestions"
                            optionLabel="label"
                            placeholder="Search and select district"
                            :loading="districtLoading"
                            @complete="searchDistrict"
                            :input-class="{ 'p-invalid': editDistrictError }"
                            @item-select="onEditDistrictSelect"
                            fluid
                        />
                    </div>
                </div>
                <div class="flex gap-4">
                    <div class="w-1/2">
                        <label for="edit-user-village" class="block font-bold mb-2">Village<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="edit-user-village"
                            v-model="editForm.village"
                            :suggestions="villageSuggestions"
                            optionLabel="label"
                            placeholder="Search and select village"
                            :loading="villageLoading"
                            @complete="searchVillage"
                            :input-class="{ 'p-invalid': editVillageError }"
                            @item-select="onEditVillageSelect"
                            fluid
                        />
                    </div>
                    <div class="w-1/2">
                        <label for="edit-user-full_address" class="block font-bold mb-2">Full Address<span class="text-red-500">*</span></label>
                        <InputText id="edit-user-full_address" v-model="editForm.full_address" placeholder="Enter full address" :class="{ 'p-invalid': editFullAddressError }" @input="clearEditFullAddressError" fluid />
                    </div>
                </div>
                <div>
                    <label for="edit-user-photo" class="block font-bold mb-2">Photo</label>
                    <FileUpload mode="basic" name="photo" accept="image/*" :maxFileSize="2000000" chooseLabel="Select Photo" @select="onEditPhotoSelect" class="w-full" />
                    <div v-if="editPhotoPreview" class="mt-2">
                        <a :href="editPhotoPreview" data-fancybox="edit-preview" data-caption="Preview Foto" tabindex="0">
                            <img :src="editPhotoPreview" alt="Preview Foto" class="w-32 h-32 object-cover rounded shadow border cursor-pointer hover:opacity-80 transition" />
                        </a>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="closeEditDialog" :disabled="editLoading" />
                <Button label="Save" icon="pi pi-check" @click="submitEditUser" :loading="editLoading" />
            </template>
        </Dialog>
    </div>
</template>
