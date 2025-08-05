<script setup>
import PositionService from '@/service/generalMasterData/PositionService';
import UserPositionService from '@/service/generalMasterData/UserPositionService';
import usersService from '@/service/userManagement/usersService';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== ROUTER & ROUTE =====
const route = useRoute();
const router = useRouter();

const userPositions = ref([]);
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

// Create dialog state
const showCreateDialog = ref(false);
const createForm = ref({
    user_code: '',
    position_code: '',
    is_main: false,
    notes: ''
});
const createLoading = ref(false);
const createError = ref('');
const userCodeError = ref(false);
const positionCodeError = ref(false);

// AutoComplete data for user and position
const userSuggestions = ref([]);
const positionSuggestions = ref([]);
const userLoading = ref(false);
const positionLoading = ref(false);

// Track selected user and position for UI control
const selectedUser = ref(null);
const selectedPosition = ref(null);

// Edit dialog state
const showEditDialog = ref(false);
const editForm = ref({
    id: '',
    user_code: '',
    position_code: '',
    is_main: false,
    notes: ''
});
const editLoading = ref(false);
const editError = ref('');
const editUserCodeError = ref(false);
const editPositionCodeError = ref(false);

// Track selected user and position for edit dialog
const editSelectedUser = ref(null);
const editSelectedPosition = ref(null);

// Delete dialog state
const deleteLoading = ref(false);
const deleteDialog = ref(false);
const userPositionToDelete = ref(null);

function clearUserCodeError() {
    userCodeError.value = false;
}

function clearPositionCodeError() {
    positionCodeError.value = false;
}

function clearEditUserCodeError() {
    editUserCodeError.value = false;
}

function clearEditPositionCodeError() {
    editPositionCodeError.value = false;
}

// Function to search user options
async function searchUser(event) {
    const query = event.query.toLowerCase();
    userLoading.value = true;

    try {
        const res = await usersService.getUsers({ page: 1, limit: 100, search: query });
        const responseData = res.data || res;
        const users = Array.isArray(responseData.data) ? responseData.data : [];

        userSuggestions.value = users.map((user) => ({
            name: user.name,
            code: user.user_code
        }));
    } catch (error) {
        console.error('Error fetching user suggestions:', error);
        userSuggestions.value = [];
    } finally {
        userLoading.value = false;
    }
}

// Function to search position options
async function searchPosition(event) {
    const query = event.query.toLowerCase();
    positionLoading.value = true;

    try {
        const res = await PositionService.getPositions({ page: 1, limit: 100, search: query });
        const responseData = res.data || res;
        const positions = Array.isArray(responseData.data) ? responseData.data : [];

        positionSuggestions.value = positions.map((position) => ({
            name: position.name,
            code: position.position_code
        }));
    } catch (error) {
        console.error('Error fetching position suggestions:', error);
        positionSuggestions.value = [];
    } finally {
        positionLoading.value = false;
    }
}

// Function to handle user selection
function onUserSelect(event) {
    if (event.value) {
        selectedUser.value = event.value;
        createForm.value.user_code = event.value.code;
    }
    clearUserCodeError();
}

// Function to handle position selection
function onPositionSelect(event) {
    if (event.value) {
        selectedPosition.value = event.value;
        createForm.value.position_code = event.value.code;
    }
    clearPositionCodeError();
}

async function fetchUserPositions() {
    loading.value = true;
    try {
        const res = await UserPositionService.getUserPositions({
            page: page.value,
            limit: limit.value,
            search: search.value.trim()
        });
        const responseData = res.data || res;
        userPositions.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        if (responseData.permissions) {
            permissions.value = responseData.permissions;
        }
        await delay(100);
    } catch (error) {
        console.error('Error fetching user positions:', error);
        userPositions.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchUserPositions();
});

async function openCreateDialog() {
    createForm.value = {
        user_code: '',
        position_code: '',
        is_main: false,
        notes: ''
    };
    selectedUser.value = null;
    selectedPosition.value = null;
    showCreateDialog.value = true;
    userCodeError.value = false;
    positionCodeError.value = false;
    createError.value = '';
}

async function submitCreateUserPosition() {
    let hasError = false;
    if (!selectedUser.value) {
        userCodeError.value = true;
        hasError = true;
    }
    if (!selectedPosition.value) {
        positionCodeError.value = true;
        hasError = true;
    }
    if (hasError) return;

    createLoading.value = true;
    createError.value = '';

    try {
        // Prepare payload dengan user_code dan position_code dari selected items
        const payload = {
            user_code: selectedUser.value.code,
            position_code: selectedPosition.value.code,
            is_main: createForm.value.is_main,
            notes: createForm.value.notes
        };

        await UserPositionService.createUserPosition(payload);
        showCreateDialog.value = false;
        fetchUserPositions(); // Refresh data after create
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to create user position.';
        createError.value = msg;
    } finally {
        createLoading.value = false;
    }
}

async function openEditDialog(userPosition) {
    editLoading.value = true;
    editError.value = '';
    try {
        const res = await UserPositionService.getUserPosition(userPosition.id);
        const data = res.data || res;
        editForm.value = {
            id: data.id,
            user_code: data.user_code,
            position_code: data.position_code,
            is_main: data.is_main,
            notes: data.notes || ''
        };
        editSelectedUser.value = data.user_code ? { name: userPosition.user_name, code: data.user_code } : null;
        editSelectedPosition.value = data.position_code ? { name: userPosition.position_name, code: data.position_code } : null;
        showEditDialog.value = true;
        editUserCodeError.value = false;
        editPositionCodeError.value = false;
        editError.value = '';
    } catch (e) {
        editError.value = e?.response?.data?.message || 'Failed to fetch user position detail.';
        console.error('Error fetching user position detail:', e);
    } finally {
        editLoading.value = false;
    }
}

async function submitEditUserPosition() {
    let hasError = false;
    if (!editSelectedUser.value) {
        editUserCodeError.value = true;
        hasError = true;
    }
    if (!editSelectedPosition.value) {
        editPositionCodeError.value = true;
        hasError = true;
    }
    if (hasError) return;

    editLoading.value = true;

    try {
        // Prepare payload dengan user_code dan position_code dari selected items
        const payload = {
            user_code: editSelectedUser.value.code,
            position_code: editSelectedPosition.value.code,
            is_main: editForm.value.is_main,
            notes: editForm.value.notes
        };

        await UserPositionService.updateUserPosition(editForm.value.id, payload);
        showEditDialog.value = false;
        fetchUserPositions();
    } catch (e) {
        editError.value = e?.response?.data?.message || 'Failed to update user position.';
        console.error('Error updating user position:', e);
    } finally {
        editLoading.value = false;
    }
}

function confirmDeleteUserPosition(userPosition) {
    userPositionToDelete.value = userPosition;
    deleteDialog.value = true;
}

async function deleteUserPosition() {
    if (!userPositionToDelete.value) return;
    deleteLoading.value = true;
    try {
        await UserPositionService.deleteUserPosition(userPositionToDelete.value.id);
        deleteDialog.value = false;
        fetchUserPositions();
    } catch (e) {
        console.error('Error deleting user position:', e);
    } finally {
        deleteLoading.value = false;
        userPositionToDelete.value = null;
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

watch(
    search,
    (val, oldVal) => {
        if (val !== oldVal) {
            page.value = 1;
            updateURL();
            // Hanya fetch jika ada search query atau jika search dikosongkan
            if (val.trim() !== '' || oldVal.trim() !== '') {
                fetchUserPositions();
            }
        }
    },
    { debounce: 300 }
);

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    updateURL();
    fetchUserPositions();
}

function onSearchInput(e) {
    // Reset page ke 1 saat user mulai mengetik
    page.value = 1;
    // Tidak perlu fetch di sini karena sudah ditangani oleh watch
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}
</script>

<template>
    <div>
        <div class="card">
            <div class="mb-3">
                <h4 class="m-0">User Position Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : userPositions"
                dataKey="id"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[5, 10, 25]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} user positions"
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
                        <Button v-if="permissions.can_create" label="Add" icon="pi pi-plus" @click="openCreateDialog" />
                    </div>
                </div>

                <Column field="user_name" header="User Name" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.user_name }}
                        </template>
                    </template>
                </Column>

                <Column field="position_name" header="Position Name" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.position_name }}
                        </template>
                    </template>
                </Column>

                <Column field="is_main" header="Main Position" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <span :class="slotProps.data.is_main ? 'text-green-600 font-bold' : 'text-gray-500'">
                                {{ slotProps.data.is_main ? 'Yes' : 'No' }}
                            </span>
                        </template>
                    </template>
                </Column>

                <Column field="notes" header="Notes" sortable style="min-width: 15rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.notes || '-' }}
                        </template>
                    </template>
                </Column>

                <Column field="createdAt" header="Created At" sortable style="min-width: 15rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ formatDate(slotProps.data.createdAt) }}
                        </template>
                    </template>
                </Column>
                <Column field="updatedAt" header="Updated At" sortable style="min-width: 15rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ formatDate(slotProps.data.updatedAt) }}
                        </template>
                    </template>
                </Column>

                <Column v-if="permissions.can_update || permissions.can_delete" header="Actions" style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="60%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <Button v-if="permissions.can_update" icon="pi pi-pencil" outlined rounded size="small" class="mr-1" @click="openEditDialog(slotProps.data)" />
                            <Button v-if="permissions.can_delete" icon="pi pi-trash" outlined rounded size="small" severity="danger" @click="confirmDeleteUserPosition(slotProps.data)" />
                        </template>
                    </template>
                </Column>

                <!-- Empty State Template -->
                <template #empty>
                    <div v-if="!loading" class="flex flex-col items-center justify-center py-12">
                        <img src="/noData.png" alt="No Data" style="width: 25%" class="mb-6" />
                    </div>
                </template>
            </DataTable>

            <!-- Create Dialog -->
            <Dialog v-model:visible="showCreateDialog" header="Create User Position" :modal="true" :style="{ width: '400px' }">
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="user-code" class="block font-bold mb-2">User<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="user-code"
                            v-model="selectedUser"
                            :suggestions="userSuggestions"
                            optionLabel="name"
                            placeholder="Search and select user..."
                            :disabled="createLoading"
                            :loading="userLoading"
                            :class="{ 'p-invalid': userCodeError }"
                            @complete="searchUser"
                            @select="onUserSelect"
                            display="chip"
                            fluid
                        />
                        <div v-if="userCodeError" class="text-red-500 text-xs mt-1">User wajib dipilih.</div>
                    </div>
                    <div>
                        <label for="position-code" class="block font-bold mb-2">Position<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="position-code"
                            v-model="selectedPosition"
                            :suggestions="positionSuggestions"
                            optionLabel="name"
                            placeholder="Search and select position..."
                            :disabled="createLoading"
                            :loading="positionLoading"
                            :class="{ 'p-invalid': positionCodeError }"
                            @complete="searchPosition"
                            @select="onPositionSelect"
                            display="chip"
                            fluid
                        />
                        <div v-if="positionCodeError" class="text-red-500 text-xs mt-1">Position wajib dipilih.</div>
                    </div>
                    <div>
                        <label for="notes" class="block font-bold mb-2">Notes</label>
                        <InputText id="notes" v-model="createForm.notes" placeholder="Enter notes (optional)" :disabled="createLoading" fluid />
                    </div>
                    <div>
                        <label for="is-main" class="block font-bold mb-2">Main Position</label>
                        <div class="flex items-center">
                            <input id="is-main" type="checkbox" v-model="createForm.is_main" :disabled="createLoading" class="mr-2" />
                            <label for="is-main" class="text-sm">Set as main position</label>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showCreateDialog = false" :disabled="createLoading" />
                    <Button label="Save" icon="pi pi-check" @click="submitCreateUserPosition" :loading="createLoading" />
                </template>
            </Dialog>

            <!-- Edit Dialog -->
            <Dialog v-model:visible="showEditDialog" header="Edit User Position" :modal="true" :style="{ width: '400px' }">
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="edit-user-code" class="block font-bold mb-2">User<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="edit-user-code"
                            v-model="editSelectedUser"
                            :suggestions="userSuggestions"
                            optionLabel="name"
                            placeholder="Search and select user..."
                            :disabled="editLoading"
                            :loading="userLoading"
                            :class="{ 'p-invalid': editUserCodeError }"
                            @complete="searchUser"
                            @select="
                                (e) => {
                                    editSelectedUser.value = e.value;
                                    editForm.user_code = e.value.code;
                                    editUserCodeError.value = false;
                                }
                            "
                            display="chip"
                            fluid
                        />
                        <div v-if="editUserCodeError" class="text-red-500 text-xs mt-1">User wajib dipilih.</div>
                    </div>
                    <div>
                        <label for="edit-position-code" class="block font-bold mb-2">Position<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="edit-position-code"
                            v-model="editSelectedPosition"
                            :suggestions="positionSuggestions"
                            optionLabel="name"
                            placeholder="Search and select position..."
                            :disabled="editLoading"
                            :loading="positionLoading"
                            :class="{ 'p-invalid': editPositionCodeError }"
                            @complete="searchPosition"
                            @select="
                                (e) => {
                                    editSelectedPosition.value = e.value;
                                    editForm.position_code = e.value.code;
                                    editPositionCodeError.value = false;
                                }
                            "
                            display="chip"
                            fluid
                        />
                        <div v-if="editPositionCodeError" class="text-red-500 text-xs mt-1">Position wajib dipilih.</div>
                    </div>
                    <div>
                        <label for="edit-notes" class="block font-bold mb-2">Notes</label>
                        <InputText id="edit-notes" v-model="editForm.notes" placeholder="Enter notes (optional)" :disabled="editLoading" fluid />
                    </div>
                    <div>
                        <label for="edit-is-main" class="block font-bold mb-2">Main Position</label>
                        <div class="flex items-center">
                            <input id="edit-is-main" type="checkbox" v-model="editForm.is_main" :disabled="editLoading" class="mr-2" />
                            <label for="edit-is-main" class="text-sm">Set as main position</label>
                        </div>
                    </div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showEditDialog = false" :disabled="editLoading" />
                    <Button label="Save" icon="pi pi-check" @click="submitEditUserPosition" :loading="editLoading" />
                </template>
            </Dialog>

            <!-- Delete Dialog -->
            <Dialog v-model:visible="deleteDialog" header="Confirm Delete" :modal="true" :style="{ width: '350px' }">
                <div class="flex flex-col gap-4">
                    <div>Are you sure you want to delete this user position?</div>
                    <div class="font-bold">{{ userPositionToDelete?.user_name }} - {{ userPositionToDelete?.position_name }}</div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="deleteDialog = false" :disabled="deleteLoading" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteUserPosition" :loading="deleteLoading" />
                </template>
            </Dialog>
        </div>
    </div>
</template>
