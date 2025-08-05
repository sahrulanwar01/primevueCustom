<script setup>
import PositionService from '@/service/generalMasterData/PositionService';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
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

const positions = ref([]);
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
    name: '',
    description: '',
    status: 'ACTIVE'
});
function getStatusClass(status) {
    return {
        'px-3 py-1 rounded-md text-sm font-medium gap-2': true,
        'bg-green-100 text-green-800 border border-green-200': status === 'ACTIVE',
        'bg-red-100 text-red-800 border border-red-200': status === 'INACTIVE'
    };
}
const createLoading = ref(false);
const createError = ref('');
const nameError = ref(false);
const statusError = ref(false);

// Status options for dropdown
const statusOptions = ref([
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
]);

// Edit dialog state
const showEditDialog = ref(false);
const editForm = ref({
    position_code: '',
    name: '',
    description: '',
    status: 'ACTIVE'
});
const editLoading = ref(false);
const editError = ref('');
const editNameError = ref(false);
const editStatusError = ref(false);

// Delete dialog state
const deleteLoading = ref(false);
const deleteDialog = ref(false);
const positionToDelete = ref(null);

function clearNameError() {
    nameError.value = false;
}

function clearStatusError() {
    statusError.value = false;
}

function clearEditNameError() {
    editNameError.value = false;
}

function clearEditStatusError() {
    editStatusError.value = false;
}

async function fetchPositions() {
    loading.value = true;
    try {
        const res = await PositionService.getPositions({
            page: page.value,
            limit: limit.value,
            search: search.value.trim()
        });
        const responseData = res.data || res;
        positions.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        if (responseData.permissions) {
            permissions.value = responseData.permissions;
        }
        await delay(100);
    } catch (error) {
        console.error('Error fetching positions:', error);
        positions.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchPositions();
});

async function openCreateDialog() {
    createForm.value = {
        name: '',
        description: '',
        status: 'ACTIVE'
    };
    showCreateDialog.value = true;
    nameError.value = false;
    statusError.value = false;
    createError.value = '';
}

async function submitCreatePosition() {
    let hasError = false;
    if (!createForm.value.name) {
        nameError.value = true;
        hasError = true;
    }
    if (!createForm.value.status) {
        statusError.value = true;
        hasError = true;
    }
    if (hasError) return;

    createLoading.value = true;
    createError.value = '';

    try {
        // Prepare payload sesuai dengan format API
        const payload = {
            name: createForm.value.name,
            description: createForm.value.description,
            status: createForm.value.status
        };

        await PositionService.createPosition(payload);
        showCreateDialog.value = false;
        fetchPositions(); // Refresh data after create
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to create position.';
        createError.value = msg;
    } finally {
        createLoading.value = false;
    }
}

async function openEditDialog(position) {
    editLoading.value = true;
    editError.value = '';
    try {
        const res = await PositionService.getPosition(position.position_code);
        const data = res.data || res;
        editForm.value = {
            position_code: data.position_code,
            name: data.name,
            description: data.description || '',
            status: data.status
        };
        showEditDialog.value = true;
        editNameError.value = false;
        editStatusError.value = false;
        editError.value = '';
    } catch (e) {
        editError.value = e?.response?.data?.message || 'Failed to fetch position detail.';
        console.error('Error fetching position detail:', e);
    } finally {
        editLoading.value = false;
    }
}

async function submitEditPosition() {
    let hasError = false;
    if (!editForm.value.name) {
        editNameError.value = true;
        hasError = true;
    }
    if (!editForm.value.status) {
        editStatusError.value = true;
        hasError = true;
    }
    if (hasError) return;

    editLoading.value = true;

    try {
        // Prepare payload sesuai dengan format API
        const payload = {
            name: editForm.value.name,
            description: editForm.value.description,
            status: editForm.value.status
        };

        await PositionService.updatePosition(editForm.value.position_code, payload);
        showEditDialog.value = false;
        fetchPositions();
    } catch (e) {
        editError.value = e?.response?.data?.message || 'Failed to update position.';
        console.error('Error updating position:', e);
    } finally {
        editLoading.value = false;
    }
}

function confirmDeletePosition(position) {
    positionToDelete.value = position;
    deleteDialog.value = true;
}

async function deletePosition() {
    if (!positionToDelete.value) return;
    deleteLoading.value = true;
    try {
        await PositionService.deletePosition(positionToDelete.value.position_code);
        deleteDialog.value = false;
        fetchPositions();
    } catch (e) {
        console.error('Error deleting position:', e);
    } finally {
        deleteLoading.value = false;
        positionToDelete.value = null;
    }
}

watch(
    search,
    (val, oldVal) => {
        if (val !== oldVal) {
            page.value = 1;
            updateURL();
            // Hanya fetch jika ada search query atau jika search dikosongkan
            if (val.trim() !== '' || oldVal.trim() !== '') {
                fetchPositions();
            }
        }
    },
    { debounce: 300 }
);

// ===== URL UPDATE FUNCTIONS =====
function updateURL() {
    const query = {};
    if (page.value > 1) query.page = page.value.toString();
    if (limit.value !== 10) query.limit = limit.value.toString();
    if (search.value.trim()) query.search = search.value.trim();

    router.replace({ query });
}

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    updateURL();
    fetchPositions();
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
                <h4 class="m-0">Position Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : positions"
                dataKey="position_code"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[5, 10, 25]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} positions"
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

                <Column field="position_code" header="Position Code" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.position_code }}
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

                <Column field="description" header="Description" sortable style="min-width: 16rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.description || '-' }}
                        </template>
                    </template>
                </Column>

                <Column field="status" header="Status" sortable style="min-width: 10rem">
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

                <Column v-if="permissions.can_update || permissions.can_delete" header="Actions" style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="60%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <Button v-if="permissions.can_update" icon="pi pi-pencil" outlined rounded size="small" class="mr-1" @click="openEditDialog(slotProps.data)" />
                            <Button v-if="permissions.can_delete" icon="pi pi-trash" outlined rounded size="small" severity="danger" @click="confirmDeletePosition(slotProps.data)" />
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
            <Dialog v-model:visible="showCreateDialog" header="Create Position" :modal="true" :style="{ width: '400px' }">
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="position-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                        <InputText id="position-name" v-model="createForm.name" placeholder="Enter position name" :disabled="createLoading" required="true" :class="{ 'p-invalid': nameError }" @input="clearNameError" fluid />
                    </div>
                    <div>
                        <label for="position-description" class="block font-bold mb-2">Description</label>
                        <InputText id="position-description" v-model="createForm.description" placeholder="Enter position description" :disabled="createLoading" fluid />
                    </div>
                    <div>
                        <label for="position-status" class="block font-bold mb-2">Status<span class="text-red-500">*</span></label>
                        <Dropdown
                            id="position-status"
                            v-model="createForm.status"
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select status"
                            :class="{ 'p-invalid': statusError }"
                            @change="clearStatusError"
                            :disabled="createLoading"
                            fluid
                        />
                        <div v-if="statusError" class="text-red-500 text-xs mt-1">Status wajib dipilih.</div>
                    </div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showCreateDialog = false" :disabled="createLoading" />
                    <Button label="Save" icon="pi pi-check" @click="submitCreatePosition" :loading="createLoading" />
                </template>
            </Dialog>

            <!-- Edit Dialog -->
            <Dialog v-model:visible="showEditDialog" header="Edit Position" :modal="true" :style="{ width: '400px' }">
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="edit-position-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                        <InputText id="edit-position-name" v-model="editForm.name" placeholder="Enter position name" :disabled="editLoading" required="true" :class="{ 'p-invalid': editNameError }" @input="clearEditNameError" fluid />
                    </div>
                    <div>
                        <label for="edit-position-description" class="block font-bold mb-2">Description</label>
                        <InputText id="edit-position-description" v-model="editForm.description" placeholder="Enter position description" :disabled="editLoading" fluid />
                    </div>
                    <div>
                        <label for="edit-position-status" class="block font-bold mb-2">Status<span class="text-red-500">*</span></label>
                        <Dropdown
                            id="edit-position-status"
                            v-model="editForm.status"
                            :options="statusOptions"
                            optionLabel="label"
                            optionValue="value"
                            placeholder="Select status"
                            :class="{ 'p-invalid': editStatusError }"
                            @change="clearEditStatusError"
                            :disabled="editLoading"
                            fluid
                        />
                        <div v-if="editStatusError" class="text-red-500 text-xs mt-1">Status wajib dipilih.</div>
                    </div>
                    <div v-if="editError" class="text-red-500 text-sm">{{ editError }}</div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showEditDialog = false" :disabled="editLoading" />
                    <Button label="Save" icon="pi pi-check" @click="submitEditPosition" :loading="editLoading" />
                </template>
            </Dialog>

            <!-- Delete Dialog -->
            <Dialog v-model:visible="deleteDialog" header="Confirm Delete" :modal="true" :style="{ width: '350px' }">
                <div class="flex flex-col gap-4">
                    <div>Are you sure you want to delete this position?</div>
                    <div class="font-bold">{{ positionToDelete?.name }}</div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="deleteDialog = false" :disabled="deleteLoading" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deletePosition" :loading="deleteLoading" />
                </template>
            </Dialog>
        </div>
    </div>
</template>
