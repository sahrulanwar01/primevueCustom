<script setup>
import PermissionService from '@/service/generalSettings/PermissionService';
import RolePermissionService from '@/service/generalSettings/RolePermissionService';
import RoleService from '@/service/userManagement/roleService';
import AutoComplete from 'primevue/autocomplete';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import { onMounted, ref, watch } from 'vue';

const rolePermissionsList = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const page = ref(1);
const limit = ref(10);
const search = ref('');

// State for create dialog
const showCreateDialog = ref(false);
const createLoading = ref(false);
const createError = ref('');
const createForm = ref({
    role: null,
    permission: null,
    can_create: false,
    can_update: false,
    can_delete: false,
    can_view: false,
    can_details: false
});
const roleSuggestions = ref([]);
const permissionSuggestions = ref([]);
const roleLoading = ref(false);
const permissionLoading = ref(false);

const permissions = ref({
    can_create: false,
    can_update: false,
    can_delete: false
});

// State for edit dialog
const showEditDialog = ref(false);
const editLoading = ref(false);
const editError = ref('');
const editForm = ref({
    role_perms_code: '',
    role: null,
    permission: null,
    can_create: false,
    can_update: false,
    can_delete: false,
    can_view: false,
    can_details: false
});
const editRoleSuggestions = ref([]);
const editPermissionSuggestions = ref([]);
const editRoleLoading = ref(false);
const editPermissionLoading = ref(false);

// State for delete dialog
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const rolePermissionToDelete = ref(null);
const deleteError = ref('');

async function fetchRolePermissions() {
    loading.value = true;
    try {
        const res = await RolePermissionService.getRolePermissions({ page: page.value, limit: limit.value, search: search.value });
        const responseData = res.data || res;
        rolePermissionsList.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        if (responseData.permissions) {
            permissions.value = responseData.permissions;
        }
    } catch (error) {
        console.error('Error fetching role permissions:', error);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchRolePermissions();
});

watch(
    search,
    (val, oldVal) => {
        if (val !== oldVal) {
            page.value = 1;
            fetchRolePermissions();
        }
    },
    { debounce: 300 }
);

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    fetchRolePermissions();
}

function onSearchInput(e) {
    page.value = 1;
}

function openCreateDialog() {
    createForm.value = {
        role: null,
        permission: null,
        can_create: false,
        can_update: false,
        can_delete: false,
        can_view: false,
        can_details: false
    };
    createError.value = '';
    showCreateDialog.value = true;
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

async function searchPermission(event) {
    const query = event.query?.toLowerCase() || '';
    permissionLoading.value = true;
    try {
        const res = await PermissionService.getPermissions({ page: 1, limit: 20, search: query });
        const data = res.data || res;
        permissionSuggestions.value = (Array.isArray(data.data) ? data.data : []).map((p) => ({ name: p.name, code: p.permission_code }));
    } catch (e) {
        permissionSuggestions.value = [];
    } finally {
        permissionLoading.value = false;
    }
}

async function submitCreateRolePermission() {
    if (!createForm.value.role || !createForm.value.permission) {
        createError.value = 'Role dan Permission wajib diisi!';
        return;
    }
    createLoading.value = true;
    createError.value = '';
    try {
        await RolePermissionService.createRolePermission({
            role_code: createForm.value.role.code,
            permission_code: createForm.value.permission.code,
            can_create: createForm.value.can_create,
            can_update: createForm.value.can_update,
            can_delete: createForm.value.can_delete,
            can_view: createForm.value.can_view,
            can_details: createForm.value.can_details
        });
        showCreateDialog.value = false;
        fetchRolePermissions();
    } catch (e) {
        createError.value = e?.response?.data?.message || 'Gagal membuat role permission.';
    } finally {
        createLoading.value = false;
    }
}

async function openEditDialog(row) {
    showEditDialog.value = true;
    editLoading.value = true;
    editError.value = '';
    try {
        const res = await RolePermissionService.getRolePermission(row.role_perms_code);
        const data = res.data || res;
        let roleObj = null;
        let permissionObj = null;
        // If name is missing, fetch by code
        if (data.role_code) {
            if (data.role_name) {
                roleObj = { name: data.role_name, code: data.role_code };
            } else {
                // Fetch role name by code
                try {
                    const roleRes = await RoleService.getRoleDetails(data.role_code);
                    const roleData = roleRes.data || roleRes;
                    roleObj = { name: roleData.name, code: data.role_code };
                } catch {
                    roleObj = { name: data.role_code, code: data.role_code };
                }
            }
        }
        if (data.permission_code) {
            if (data.permission_name) {
                permissionObj = { name: data.permission_name, code: data.permission_code };
            } else {
                // Fetch permission name by code
                try {
                    const permRes = await PermissionService.getPermission(data.permission_code);
                    const permData = permRes.data || permRes;
                    permissionObj = { name: permData.name, code: data.permission_code };
                } catch {
                    permissionObj = { name: data.permission_code, code: data.permission_code };
                }
            }
        }
        editForm.value = {
            role_perms_code: data.role_perms_code,
            role: roleObj,
            permission: permissionObj,
            can_create: !!data.can_create,
            can_update: !!data.can_update,
            can_delete: !!data.can_delete,
            can_view: !!data.can_view,
            can_details: !!data.can_details
        };
    } catch (e) {
        editError.value = e?.response?.data?.message || 'Gagal mengambil data.';
    } finally {
        editLoading.value = false;
    }
}

async function searchEditRole(event) {
    const query = event.query?.toLowerCase() || '';
    editRoleLoading.value = true;
    try {
        const res = await RoleService.getRoles({ page: 1, limit: 20, search: query });
        const data = res.data || res;
        editRoleSuggestions.value = (Array.isArray(data.data) ? data.data : []).map((r) => ({ name: r.name, code: r.role_code }));
    } catch (e) {
        editRoleSuggestions.value = [];
    } finally {
        editRoleLoading.value = false;
    }
}

async function searchEditPermission(event) {
    const query = event.query?.toLowerCase() || '';
    editPermissionLoading.value = true;
    try {
        const res = await PermissionService.getPermissions({ page: 1, limit: 20, search: query });
        const data = res.data || res;
        editPermissionSuggestions.value = (Array.isArray(data.data) ? data.data : []).map((p) => ({ name: p.name, code: p.permission_code }));
    } catch (e) {
        editPermissionSuggestions.value = [];
    } finally {
        editPermissionLoading.value = false;
    }
}

async function submitEditRolePermission() {
    if (!editForm.value.role || !editForm.value.permission) {
        editError.value = 'Role dan Permission wajib diisi!';
        return;
    }
    editLoading.value = true;
    editError.value = '';
    try {
        await RolePermissionService.updateRolePermission(editForm.value.role_perms_code, {
            role_code: editForm.value.role.code,
            permission_code: editForm.value.permission.code,
            can_create: editForm.value.can_create,
            can_update: editForm.value.can_update,
            can_delete: editForm.value.can_delete,
            can_view: editForm.value.can_view,
            can_details: editForm.value.can_details
        });
        showEditDialog.value = false;
        fetchRolePermissions();
    } catch (e) {
        editError.value = e?.response?.data?.message || 'Gagal update role permission.';
    } finally {
        editLoading.value = false;
    }
}

function confirmDeleteRolePermission(row) {
    rolePermissionToDelete.value = row;
    showDeleteDialog.value = true;
    deleteError.value = '';
}

async function deleteRolePermission() {
    if (!rolePermissionToDelete.value) return;
    deleteLoading.value = true;
    try {
        await RolePermissionService.deleteRolePermission(rolePermissionToDelete.value.role_perms_code);
        showDeleteDialog.value = false;
        fetchRolePermissions();
    } catch (e) {
        deleteError.value = e?.response?.data?.message || 'Gagal menghapus role permission.';
    } finally {
        deleteLoading.value = false;
        rolePermissionToDelete.value = null;
    }
}
</script>

<template>
    <div>
        <div class="card">
            <div class="mb-3 flex items-center justify-between">
                <h4 class="m-0">Role Permission Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : rolePermissionsList"
                dataKey="role_perms_code"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[5, 10, 25]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} role permissions"
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
                    <div v-if="permissions.can_create">
                        <Button label="Add" icon="pi pi-plus" @click="openCreateDialog" />
                    </div>
                </div>
                <Column field="role_perms_code" header="Role Permission Code" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.role_perms_code }}
                        </template>
                    </template>
                </Column>
                <Column field="role_name" header="Role Name" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.role_name }}
                        </template>
                    </template>
                </Column>
                <Column field="permission_name" header="Permission Name" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.permission_name }}
                        </template>
                    </template>
                </Column>
                <Column field="can_view" header="Can View" style="min-width: 8rem" headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="60%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <i v-if="slotProps.data.can_view" class="pi pi-check-circle" style="color: #22c55e; font-size: 1.2rem"></i>
                            <i v-else class="pi pi-times-circle" style="color: #ef4444; font-size: 1.2rem"></i>
                        </template>
                    </template>
                </Column>
                <Column field="can_create" header="Can Create" style="min-width: 8rem" headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="60%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <i v-if="slotProps.data.can_create" class="pi pi-check-circle" style="color: #22c55e; font-size: 1.2rem"></i>
                            <i v-else class="pi pi-times-circle" style="color: #ef4444; font-size: 1.2rem"></i>
                        </template>
                    </template>
                </Column>
                <Column field="can_update" header="Can Update" style="min-width: 8rem" headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="60%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <i v-if="slotProps.data.can_update" class="pi pi-check-circle" style="color: #22c55e; font-size: 1.2rem"></i>
                            <i v-else class="pi pi-times-circle" style="color: #ef4444; font-size: 1.2rem"></i>
                        </template>
                    </template>
                </Column>
                <Column field="can_delete" header="Can Delete" style="min-width: 8rem" headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="60%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <i v-if="slotProps.data.can_delete" class="pi pi-check-circle" style="color: #22c55e; font-size: 1.2rem"></i>
                            <i v-else class="pi pi-times-circle" style="color: #ef4444; font-size: 1.2rem"></i>
                        </template>
                    </template>
                </Column>
                <Column field="can_details" header="Can Details" style="min-width: 8rem" headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="60%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <i v-if="slotProps.data.can_details" class="pi pi-check-circle" style="color: #22c55e; font-size: 1.2rem"></i>
                            <i v-else class="pi pi-times-circle" style="color: #ef4444; font-size: 1.2rem"></i>
                        </template>
                    </template>
                </Column>
                <Column v-if="permissions.can_update || permissions.can_delete" header="Actions" style="min-width: 8rem" headerClass="text-center" bodyClass="text-center">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="60%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <Button v-if="permissions.can_update" icon="pi pi-pencil" outlined rounded class="mr-2" @click="() => openEditDialog(slotProps.data)" />
                            <Button v-if="permissions.can_delete" icon="pi pi-trash" outlined rounded severity="danger" @click="() => confirmDeleteRolePermission(slotProps.data)" />
                        </template>
                    </template>
                </Column>
            </DataTable>
            <Dialog v-model:visible="showCreateDialog" header="Create Role Permission" :modal="true" :style="{ width: '400px' }">
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="block font-bold mb-2">Role<span class="text-red-500">*</span></label>
                        <AutoComplete v-model="createForm.role" :suggestions="roleSuggestions" optionLabel="name" placeholder="Search and select role..." :loading="roleLoading" @complete="searchRole" :disabled="createLoading" display="chip" fluid />
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Permission<span class="text-red-500">*</span></label>
                        <AutoComplete
                            v-model="createForm.permission"
                            :suggestions="permissionSuggestions"
                            optionLabel="name"
                            placeholder="Search and select permission..."
                            :loading="permissionLoading"
                            @complete="searchPermission"
                            :disabled="createLoading"
                            display="chip"
                            fluid
                        />
                    </div>
                    <div class="flex flex-wrap gap-4">
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="createForm.can_view" :binary="true" inputId="can_view" />
                            <label for="can_view">Can View</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="createForm.can_create" :binary="true" inputId="can_create" />
                            <label for="can_create">Can Create</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="createForm.can_update" :binary="true" inputId="can_update" />
                            <label for="can_update">Can Update</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="createForm.can_delete" :binary="true" inputId="can_delete" />
                            <label for="can_delete">Can Delete</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="createForm.can_details" :binary="true" inputId="can_details" />
                            <label for="can_details">Can Details</label>
                        </div>
                    </div>
                    <div v-if="createError" class="text-red-500 text-sm">{{ createError }}</div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showCreateDialog = false" :disabled="createLoading" />
                    <Button label="Save" icon="pi pi-check" @click="submitCreateRolePermission" :loading="createLoading" />
                </template>
            </Dialog>
            <Dialog v-model:visible="showEditDialog" header="Edit Role Permission" :modal="true" :style="{ width: '400px' }">
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="block font-bold mb-2">Role<span class="text-red-500">*</span></label>
                        <AutoComplete
                            v-model="editForm.role"
                            :suggestions="editRoleSuggestions"
                            optionLabel="name"
                            placeholder="Search and select role..."
                            :loading="editRoleLoading"
                            @complete="searchEditRole"
                            :disabled="editLoading"
                            display="chip"
                            fluid
                        />
                    </div>
                    <div>
                        <label class="block font-bold mb-2">Permission<span class="text-red-500">*</span></label>
                        <AutoComplete
                            v-model="editForm.permission"
                            :suggestions="editPermissionSuggestions"
                            optionLabel="name"
                            placeholder="Search and select permission..."
                            :loading="editPermissionLoading"
                            @complete="searchEditPermission"
                            :disabled="editLoading"
                            display="chip"
                            fluid
                        />
                    </div>
                    <div class="flex flex-wrap gap-4">
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="editForm.can_view" :binary="true" inputId="edit_can_view" />
                            <label for="edit_can_view">Can View</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="editForm.can_create" :binary="true" inputId="edit_can_create" />
                            <label for="edit_can_create">Can Create</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="editForm.can_update" :binary="true" inputId="edit_can_update" />
                            <label for="edit_can_update">Can Update</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="editForm.can_delete" :binary="true" inputId="edit_can_delete" />
                            <label for="edit_can_delete">Can Delete</label>
                        </div>
                        <div class="flex items-center gap-2">
                            <Checkbox v-model="editForm.can_details" :binary="true" inputId="edit_can_details" />
                            <label for="edit_can_details">Can Details</label>
                        </div>
                    </div>
                    <div v-if="editError" class="text-red-500 text-sm">{{ editError }}</div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showEditDialog = false" :disabled="editLoading" />
                    <Button label="Save" icon="pi pi-check" @click="submitEditRolePermission" :loading="editLoading" />
                </template>
            </Dialog>
            <Dialog v-model:visible="showDeleteDialog" header="Confirm Delete" :modal="true" :style="{ width: '350px' }">
                <div class="flex flex-col gap-4">
                    <div>Are you sure you want to delete this role permission?</div>
                    <div class="font-bold">{{ rolePermissionToDelete?.role_perms_code }}</div>
                    <div v-if="deleteError" class="text-red-500 text-sm">{{ deleteError }}</div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showDeleteDialog = false" :disabled="deleteLoading" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteRolePermission" :loading="deleteLoading" />
                </template>
            </Dialog>
        </div>
    </div>
</template>
