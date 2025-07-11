<script setup>
import config from '@/service/config';
import RoleService from '@/service/userManagement/roleService';
import usersService from '@/service/userManagement/usersService';
import { Fancybox } from '@fancyapps/ui';
import '@fancyapps/ui/dist/fancybox/fancybox.css';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import { nextTick, onMounted, ref, watch } from 'vue';

// Helper untuk bikin URL lengkap dari path relatif
function buildFullUrl(path) {
    const baseUrl = config.API_BASE_URL || '';
    return path && !path.startsWith('http') ? baseUrl + path : path;
}

// ===== REACTIVE DATA =====
const users = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const page = ref(1);
const limit = ref(10);
const search = ref('');
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
    status: 'ACTIVE'
});

const editForm = ref({
    name: '',
    email: '',
    phone: '',
    role_code: null,
    status: 'ACTIVE',
    photo: null
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
const editError = ref('');

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

// ===== FORM HANDLING FUNCTIONS =====
function resetAddUserForm() {
    addUserForm.value = {
        name: '',
        email: '',
        password: '',
        phone: '',
        role_code: null,
        photo: null,
        status: 'ACTIVE'
    };
    addUserError.value = '';
    nameError.value = false;
    emailError.value = false;
    passwordError.value = false;
    roleError.value = false;
    phoneError.value = false;
    photoError.value = false;
    statusError.value = false;
    photoPreview.value = null;
}

async function submitAddUser() {
    // Reset error states
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
        photo: null
    };
    editPhotoPreview.value = null;

    try {
        usersService.getUserDetails(user.user_code).then(async (res) => {
            const userData = res.data || res;
            editForm.value = {
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                role_code: userData.role ? { name: userData.role.name, code: userData.role.role_code } : null,
                status: userData.status,
                photo: null // Reset photo, tidak simpan URL existing
            };
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
    // Validate required fields
    let hasError = false;
    if (!editForm.value.name) {
        hasError = true;
    }
    if (!editForm.value.email) {
        hasError = true;
    }
    if (!editForm.value.phone) {
        hasError = true;
    }
    if (!editForm.value.role_code || !editForm.value.role_code.code) {
        hasError = true;
    }
    if (!editForm.value.status) {
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

            await usersService.updateUser(selectedUser.value.user_code, formData);
        } else {
            // If no new photo, send JSON without photo field
            const payload = {
                name: editForm.value.name,
                email: editForm.value.email,
                phone: editForm.value.phone,
                role_code: editForm.value.role_code.code,
                status: editForm.value.status
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

// ===== EVENT HANDLING FUNCTIONS =====
function onSearchInput(e) {
    page.value = 1;
}

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
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

function onEditPhotoChange(event) {
    const file = event.target.files && event.target.files[0];
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
            fetchUsers();
        }
    },
    { debounce: 300 }
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
                <Column field="createdBy" header="Created By" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.createdBy }}
                        </template>
                    </template>
                </Column>
                <Column field="updatedBy" header="Updated By" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.updatedBy }}
                        </template>
                    </template>
                </Column>
                <Column v-if="permissions.can_update || permissions.can_delete" header="Actions" style="min-width: 10rem">
                    <template #body="slotProps">
                        <Button v-if="permissions.can_update" icon="pi pi-pencil" outlined rounded class="mr-2" @click="confirmEditUser(slotProps.data)" />
                        <Button v-if="permissions.can_delete" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteUser(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>
        <!-- Dialog Tambah User -->
        <Dialog v-model:visible="showAddDialog" header="Add User" :modal="true" :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="user-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="user-name" v-model="addUserForm.name" placeholder="Enter Name" :class="{ 'p-invalid': nameError }" @input="clearNameError" fluid />
                </div>
                <div>
                    <label for="user-email" class="block font-bold mb-2">Email<span class="text-red-500">*</span></label>
                    <InputText id="user-email" v-model="addUserForm.email" placeholder="Enter email" :class="{ 'p-invalid': emailError }" @input="clearEmailError" fluid />
                </div>
                <div>
                    <label for="user-password" class="block font-bold mb-2">Password<span class="text-red-500">*</span></label>
                    <InputText id="user-password" v-model="addUserForm.password" placeholder="Enter password" type="password" :class="{ 'p-invalid': passwordError }" @input="clearPasswordError" fluid />
                </div>
                <div>
                    <label for="user-phone" class="block font-bold mb-2">No. HP<span class="text-red-500">*</span></label>
                    <InputText id="user-phone" v-model="addUserForm.phone" placeholder="Enter no. HP" :class="{ 'p-invalid': phoneError }" @input="clearPhoneError" fluid />
                </div>
                <div>
                    <label for="user-role" class="block font-bold mb-2">Role<span class="text-red-500">*</span></label>
                    <AutoComplete
                        id="user-role"
                        v-model="addUserForm.role_code"
                        :suggestions="roleSuggestions"
                        optionLabel="name"
                        placeholder="Search and select role"
                        :loading="roleLoading"
                        @complete="searchRole"
                        :inputClass="{ 'p-invalid': roleError }"
                        @input="clearRoleError"
                        fluid
                    />
                </div>
                <div>
                    <label for="user-status" class="block font-bold mb-2">Status<span class="text-red-500">*</span></label>
                    <Dropdown id="user-status" v-model="addUserForm.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" :class="{ 'p-invalid': statusError }" @change="clearStatusError" fluid />
                </div>
                <div>
                    <label for="user-photo" class="block font-bold mb-2">Photo<span class="text-red-500">*</span></label>
                    <FileUpload mode="basic" name="photo" accept="image/*" :maxFileSize="2000000" chooseLabel="Select Photo" @select="onPhotoSelect" :inputClass="{ 'p-invalid': photoError }" class="w-full" />
                    <div v-if="photoPreview" class="mt-2">
                        <a :href="photoPreview" data-fancybox="preview" data-caption="Preview Foto" tabindex="0">
                            <img :src="photoPreview" alt="Preview Foto" class="w-32 h-32 object-cover rounded shadow border cursor-pointer hover:opacity-80 transition" />
                        </a>
                    </div>
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
        <Dialog v-model:visible="showEditDialog" header="Edit User" :modal="true" :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="edit-user-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="edit-user-name" v-model="editForm.name" placeholder="Enter Name" fluid />
                </div>
                <div>
                    <label for="edit-user-email" class="block font-bold mb-2">Email<span class="text-red-500">*</span></label>
                    <InputText id="edit-user-email" v-model="editForm.email" placeholder="Enter email" fluid />
                </div>
                <div>
                    <label for="edit-user-phone" class="block font-bold mb-2">No. HP<span class="text-red-500">*</span></label>
                    <InputText id="edit-user-phone" v-model="editForm.phone" placeholder="Enter no. HP" fluid />
                </div>
                <div>
                    <label for="edit-user-role" class="block font-bold mb-2">Role<span class="text-red-500">*</span></label>
                    <AutoComplete id="edit-user-role" v-model="editForm.role_code" :suggestions="roleSuggestions" optionLabel="name" placeholder="Search and select role" :loading="roleLoading" @complete="searchRole" fluid />
                </div>
                <div>
                    <label for="edit-user-status" class="block font-bold mb-2">Status<span class="text-red-500">*</span></label>
                    <Dropdown id="edit-user-status" v-model="editForm.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Pilih status" fluid />
                </div>
                <div>
                    <label for="edit-user-photo" class="block font-bold mb-2">Photo</label>
                    <input type="file" accept="image/*" @change="onEditPhotoChange" class="w-full p-2 border border-gray-300 rounded" style="max-width: 100%" />
                    <div v-if="editPhotoPreview" class="mt-2">
                        <a :href="editPhotoPreview" data-fancybox="edit-preview" data-caption="Preview Foto" tabindex="0">
                            <img :src="editPhotoPreview" alt="Preview Foto" class="w-32 h-32 object-cover rounded shadow border cursor-pointer hover:opacity-80 transition" />
                        </a>
                    </div>
                    <small class="text-500 block mt-2">Max 2MB. Format: JPG, PNG, GIF</small>
                </div>
                <div v-if="editError" class="text-red-500 text-sm">{{ editError }}</div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showEditDialog = false" :disabled="editLoading" />
                <Button label="Save" icon="pi pi-check" @click="submitEditUser" :loading="editLoading" />
            </template>
        </Dialog>
    </div>
</template>
