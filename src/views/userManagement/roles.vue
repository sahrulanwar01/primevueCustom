<script setup>
import RoleService from '@/service/userManagement/roleService';
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

const roles = ref([]);
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
const showCreateDialog = ref(false);
const createForm = ref({ name: '', status: 'ACTIVE' });
const createLoading = ref(false);
const createError = ref('');
const nameError = ref(false);
const showEditDialog = ref(false);
const editForm = ref({ name: '', status: 'ACTIVE' });
const editLoading = ref(false);
const editError = ref('');
const editNameError = ref(false);
const selectedRole = ref(null);
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const roleToDelete = ref(null);
const statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
];

// Function to get status styling
function getStatusClass(status) {
    return {
        'px-3 py-1 rounded-md text-sm font-medium gap-2': true,
        'bg-green-100 text-green-800 border border-green-200': status === 'ACTIVE',
        'bg-red-100 text-red-800 border border-red-200': status === 'INACTIVE'
    };
}

// Clear name error when user starts typing
function clearNameError() {
    if (nameError.value) nameError.value = false;
}

// Clear edit name error when user starts typing
function clearEditNameError() {
    if (editNameError.value) editNameError.value = false;
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchRoles() {
    loading.value = true;
    try {
        const res = await RoleService.getRoles({ page: page.value, limit: limit.value, search: search.value });

        // Handle different response structures
        const responseData = res.data || res;
        roles.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        if (responseData.permissions) {
            permissions.value = responseData.permissions;
        }
        await delay(100);
    } catch (error) {
        console.error('Error fetching roles:', error);
        roles.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
}

onMounted(fetchRoles);

function onSearchInput(e) {
    // Reset to first page when searching
    page.value = 1;
}

watch(
    search,
    (val, oldVal) => {
        if (val !== oldVal) {
            page.value = 1;
            fetchRoles();
        }
    },
    { debounce: 300 }
);

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    fetchRoles();
}

async function editRole(role) {
    selectedRole.value = role;
    editLoading.value = true;
    editError.value = '';
    editNameError.value = false;

    try {
        const res = await RoleService.getRoleDetails(role.role_code);
        const roleData = res.data || res;
        editForm.value = {
            name: roleData.name,
            status: roleData.status
        };
        showEditDialog.value = true;
    } catch (error) {
        console.error('Error fetching role details:', error);
    } finally {
        editLoading.value = false;
    }
}

function confirmDeleteRole(role) {
    roleToDelete.value = role;
    showDeleteDialog.value = true;
}

async function openCreateDialog() {
    createForm.value = { name: '', status: 'ACTIVE' };
    createError.value = '';
    nameError.value = false;
    showCreateDialog.value = true;
}

async function submitCreateRole() {
    if (!createForm.value.name) {
        nameError.value = true;
        return;
    }
    createLoading.value = true;
    createError.value = '';
    nameError.value = false;
    try {
        await RoleService.createRole({
            name: createForm.value.name,
            status: createForm.value.status
        });
        showCreateDialog.value = false;
        fetchRoles();
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to create role.';
        createError.value = msg;
    } finally {
        createLoading.value = false;
    }
}

async function submitEditRole() {
    if (!editForm.value.name) {
        editNameError.value = true;
        return;
    }
    editLoading.value = true;
    editError.value = '';
    editNameError.value = false;
    try {
        await RoleService.updateRole(selectedRole.value.role_code, {
            name: editForm.value.name,
            status: editForm.value.status
        });
        showEditDialog.value = false;
        fetchRoles();
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to update role.';
        editError.value = msg;
    } finally {
        editLoading.value = false;
    }
}

async function deleteRole() {
    deleteLoading.value = true;
    try {
        await RoleService.deleteRole(roleToDelete.value.role_code);
        showDeleteDialog.value = false;
        fetchRoles();
    } catch (e) {
        console.error('Error deleting role:', e);
    } finally {
        deleteLoading.value = false;
    }
}
</script>

<template>
    <div>
        <div class="card">
            <div class="mb-3">
                <h4 class="m-0">Role Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : roles"
                dataKey="role_code"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[5, 10, 25]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} roles"
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
                        <Button v-if="permissions.can_create" label="Add" icon="pi pi-plus" @click="openCreateDialog" />
                    </div>
                </div>
                <Column field="role_code" header="Role Code" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.role_code }}
                        </template>
                    </template>
                </Column>
                <Column field="name" header="Name" sortable style="min-width: 16rem">
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
                        <template v-if="loading">
                            <Skeleton height="2rem" width="60%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <Button v-if="permissions.can_update" icon="pi pi-pencil" outlined rounded class="mr-2" @click="editRole(slotProps.data)" />
                            <Button v-if="permissions.can_delete" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeleteRole(slotProps.data)" />
                        </template>
                    </template>
                </Column>
            </DataTable>
        </div>
        <Dialog v-model:visible="showCreateDialog" header="Create Role" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="role-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="role-name" v-model="createForm.name" placeholder="Enter role name" :disabled="createLoading" required="true" autofocus :class="{ 'p-invalid': nameError }" @input="clearNameError" fluid />
                </div>
                <div>
                    <label for="role-status" class="block font-bold mb-2">Status</label>
                    <Dropdown id="role-status" v-model="createForm.status" :options="statusOptions" optionLabel="label" optionValue="value" :disabled="createLoading" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showCreateDialog = false" :disabled="createLoading" />
                <Button label="Save" icon="pi pi-check" @click="submitCreateRole" :loading="createLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showEditDialog" header="Edit Role" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="edit-role-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="edit-role-name" v-model="editForm.name" placeholder="Enter role name" :disabled="editLoading" required="true" autofocus :class="{ 'p-invalid': editNameError }" @input="clearEditNameError" fluid />
                </div>
                <div>
                    <label for="edit-role-status" class="block font-bold mb-2">Status</label>
                    <Dropdown id="edit-role-status" v-model="editForm.status" :options="statusOptions" optionLabel="label" optionValue="value" :disabled="editLoading" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showEditDialog = false" :disabled="editLoading" />
                <Button label="Update" icon="pi pi-check" @click="submitEditRole" :loading="editLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showDeleteDialog" header="Delete Role" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3">
                    <div>
                        <p class="font-semibold text-lg">Are you sure?</p>
                        <p class="text-gray-600">
                            This action cannot be undone. The role <strong>"{{ roleToDelete?.name }}"</strong> will be permanently deleted.
                        </p>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showDeleteDialog = false" :disabled="deleteLoading" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteRole" :loading="deleteLoading" />
            </template>
        </Dialog>
    </div>
</template>
