<script setup>
import PermissionService from '@/service/generalSettings/PermissionService';
import MenuService from '@/service/menuManagement/MenuService';
import SubMenuService from '@/service/menuManagement/SubMenuService';
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

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const permissionsList = ref([]);
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

// Tambahan untuk dialog create permission
const showCreateDialog = ref(false);
const createForm = ref({ name: '', description: '', menu_code: null, submenu_code: null });
const createLoading = ref(false);
const createError = ref('');
const nameError = ref(false);
const descriptionError = ref(false);
const menuCodeError = ref(false);
const submenuCodeError = ref(false);

// AutoComplete data for menu and submenu
const menuSuggestions = ref([]);
const submenuSuggestions = ref([]);
const menuLoading = ref(false);
const submenuLoading = ref(false);

// Track selected menu and submenu for UI control
const selectedMenu = ref(null);
const selectedSubmenu = ref(null);

function clearNameError() {
    nameError.value = false;
}
function clearDescriptionError() {
    descriptionError.value = false;
}
function clearMenuCodeError() {
    menuCodeError.value = false;
}
function clearSubmenuCodeError() {
    submenuCodeError.value = false;
}

// Function to search menu options
async function searchMenu(event) {
    const query = event.query.toLowerCase();
    menuLoading.value = true;

    try {
        const res = await MenuService.getMenus({ page: 1, limit: 100, search: query });
        const responseData = res.data || res;
        const menus = Array.isArray(responseData.data) ? responseData.data : [];

        menuSuggestions.value = menus.map((menu) => ({
            name: menu.name,
            code: menu.menu_code
        }));
    } catch (error) {
        console.error('Error fetching menu suggestions:', error);
        menuSuggestions.value = [];
    } finally {
        menuLoading.value = false;
    }
}

// Function to search submenu options
async function searchSubmenu(event) {
    const query = event.query.toLowerCase();
    submenuLoading.value = true;

    try {
        const res = await SubMenuService.getSubMenus({ page: 1, limit: 100, search: query });
        const responseData = res.data || res;
        const submenus = Array.isArray(responseData.data) ? responseData.data : [];

        submenuSuggestions.value = submenus.map((submenu) => ({
            name: submenu.name,
            code: submenu.submenu_code
        }));
    } catch (error) {
        console.error('Error fetching submenu suggestions:', error);
        submenuSuggestions.value = [];
    } finally {
        submenuLoading.value = false;
    }
}

// Function to handle menu selection
function onMenuSelect(event) {
    if (event.value) {
        selectedMenu.value = event.value;
        createForm.value.menu_code = event.value.code;
        createForm.value.submenu_code = null; // Clear submenu when menu is selected
        selectedSubmenu.value = null;
    }
    clearMenuCodeError();
    clearSubmenuCodeError();
}

// Function to handle submenu selection
function onSubmenuSelect(event) {
    if (event.value) {
        selectedSubmenu.value = event.value;
        createForm.value.submenu_code = event.value.code;
        createForm.value.menu_code = null; // Clear menu when submenu is selected
        selectedMenu.value = null;
    }
    clearMenuCodeError();
    clearSubmenuCodeError();
}

async function submitCreatePermission() {
    // Validasi form
    if (!createForm.value.name) {
        nameError.value = true;
        return;
    }
    if (!createForm.value.description) {
        descriptionError.value = true;
        return;
    }

    const hasMenu = !!selectedMenu.value;
    const hasSubmenu = !!selectedSubmenu.value;

    // Validasi: Harus pilih salah satu
    if (!hasMenu && !hasSubmenu) {
        menuCodeError.value = true;
        submenuCodeError.value = true;
        createError.value = 'Pilih salah satu: Menu atau Sub Menu!';
        return;
    }

    // Tidak boleh dua-duanya terisi
    if (hasMenu && hasSubmenu) {
        createError.value = 'Hanya boleh memilih salah satu: Menu atau Sub Menu!';
        return;
    }

    createLoading.value = true;
    nameError.value = false;
    descriptionError.value = false;
    menuCodeError.value = false;
    submenuCodeError.value = false;

    // Build payload hanya dengan field yang diisi
    const payload = {
        name: createForm.value.name,
        description: createForm.value.description
    };
    if (hasMenu) payload.menu_code = selectedMenu.value.code;
    if (hasSubmenu) payload.submenu_code = selectedSubmenu.value.code;

    try {
        await PermissionService.createPermission(payload);
        showCreateDialog.value = false;
        fetchPermissions(); // Refresh data setelah create
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to create permission.';
        console.error('Error creating permission:', e);
    } finally {
        createLoading.value = false;
    }
}

async function fetchPermissions() {
    loading.value = true;
    try {
        const res = await PermissionService.getPermissions({ page: page.value, limit: limit.value, search: search.value });
        const responseData = res.data || res;
        permissionsList.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        if (responseData.permissions) {
            permissions.value = responseData.permissions;
        }
        await delay(100);
    } catch (error) {
        console.error('Error fetching permissions:', error);
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchPermissions();
});

async function openCreateDialog() {
    createForm.value = { name: '', description: '', menu_code: null, submenu_code: null };
    selectedMenu.value = null;
    selectedSubmenu.value = null;
    showCreateDialog.value = true;
}

watch(
    search,
    (val, oldVal) => {
        if (val !== oldVal) {
            page.value = 1;
            fetchPermissions();
        }
    },
    { debounce: 300 }
);

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    fetchPermissions();
}

function onSearchInput(e) {
    page.value = 1;
}

// State for edit dialog
const showEditDialog = ref(false);
const editForm = ref({ permission_code: '', name: '', description: '', menu_code: null, submenu_code: null });
const editLoading = ref(false);
const editError = ref('');
const editNameError = ref(false);
const editDescriptionError = ref(false);
const editMenuCodeError = ref(false);
const editSubmenuCodeError = ref(false);
const editSelectedMenu = ref(null);
const editSelectedSubmenu = ref(null);

// Open edit dialog and prefill data
async function openEditDialog(permission) {
    editLoading.value = true;
    editError.value = '';
    try {
        const res = await PermissionService.getPermission(permission.permission_code);
        const data = res.data || res;
        editForm.value = {
            permission_code: data.permission_code,
            name: data.name,
            description: data.description,
            menu_code: data.menu_code || null,
            submenu_code: data.submenu_code || null
        };
        editSelectedMenu.value = data.menu_code ? { name: permission.menu_name, code: data.menu_code } : null;
        editSelectedSubmenu.value = data.submenu_code ? { name: permission.subMenu_name, code: data.submenu_code } : null;
        showEditDialog.value = true;
    } catch (e) {
        editError.value = e?.response?.data?.message || 'Failed to fetch permission detail.';
        console.error('Error fetching permission detail:', e);
    } finally {
        editLoading.value = false;
    }
}

// Submit edit
async function submitEditPermission() {
    if (!editForm.value.name) {
        editNameError.value = true;
        return;
    }
    if (!editForm.value.description) {
        editDescriptionError.value = true;
        return;
    }
    const hasMenu = !!editSelectedMenu.value;
    const hasSubmenu = !!editSelectedSubmenu.value;
    if (!hasMenu && !hasSubmenu) {
        editMenuCodeError.value = true;
        editSubmenuCodeError.value = true;
        editError.value = 'Pilih salah satu: Menu atau Sub Menu!';
        return;
    }
    if (hasMenu && hasSubmenu) {
        editError.value = 'Hanya boleh memilih salah satu: Menu atau Sub Menu!';
        return;
    }
    editLoading.value = true;
    editNameError.value = false;
    editDescriptionError.value = false;
    editMenuCodeError.value = false;
    editSubmenuCodeError.value = false;

    // Build payload hanya dengan field yang diisi
    const payload = {
        name: editForm.value.name,
        description: editForm.value.description
    };
    if (hasMenu) payload.menu_code = editSelectedMenu.value.code;
    if (hasSubmenu) payload.submenu_code = editSelectedSubmenu.value.code;

    try {
        await PermissionService.updatePermission(editForm.value.permission_code, payload);
        showEditDialog.value = false;
        fetchPermissions();
    } catch (e) {
        editError.value = e?.response?.data?.message || 'Failed to update permission.';
        console.error('Error updating permission:', e);
    } finally {
        editLoading.value = false;
    }
}

// Delete
const deleteLoading = ref(false);
const deleteDialog = ref(false);
const permissionToDelete = ref(null);
function confirmDeletePermission(permission) {
    permissionToDelete.value = permission;
    deleteDialog.value = true;
}
async function deletePermission() {
    if (!permissionToDelete.value) return;
    deleteLoading.value = true;
    try {
        await PermissionService.deletePermission(permissionToDelete.value.permission_code);
        deleteDialog.value = false;
        fetchPermissions();
    } catch (e) {
        console.error('Error deleting permission:', e);
    } finally {
        deleteLoading.value = false;
        permissionToDelete.value = null;
    }
}
</script>

<template>
    <div>
        <div class="card">
            <div class="mb-3">
                <h4 class="m-0">Permission Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : permissionsList"
                dataKey="permission_code"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[5, 10, 25]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} permissions"
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
                <Column field="permission_code" header="Permission Code" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.permission_code }}
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
                            {{ slotProps.data.description }}
                        </template>
                    </template>
                </Column>
                <Column field="menu_name" header="Menu" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.menu_name }}
                        </template>
                    </template>
                </Column>
                <Column field="subMenu_name" header="Sub Menu" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.subMenu_name }}
                        </template>
                    </template>
                </Column>
                <!-- Actions Column -->
                <!-- <Column header="Actions" style="min-width: 8rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" rounded text severity="info" class="mr-2" @click="() => openEditDialog(slotProps.data)" v-if="permissions.can_update" />
                        <Button icon="pi pi-trash" rounded text severity="danger" @click="() => confirmDeletePermission(slotProps.data)" v-if="permissions.can_delete" />
                    </template>
                </Column> -->
                <Column v-if="permissions.can_update || permissions.can_delete" header="Actions" style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="60%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            <Button v-if="permissions.can_update" icon="pi pi-pencil" outlined rounded class="mr-2" @click="openEditDialog(slotProps.data)" />
                            <Button v-if="permissions.can_delete" icon="pi pi-trash" outlined rounded severity="danger" @click="confirmDeletePermission(slotProps.data)" />
                        </template>
                    </template>
                </Column>
            </DataTable>
            <Dialog v-model:visible="showCreateDialog" header="Create Permission" :modal="true" :style="{ width: '400px' }">
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="permission-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                        <InputText id="permission-name" v-model="createForm.name" placeholder="Enter permission name" :disabled="createLoading" required="true" autofocus :class="{ 'p-invalid': nameError }" @input="clearNameError" fluid />
                    </div>
                    <div>
                        <label for="permission-description" class="block font-bold mb-2">Description<span class="text-red-500">*</span></label>
                        <InputText
                            id="permission-description"
                            v-model="createForm.description"
                            placeholder="Enter permission description"
                            :disabled="createLoading"
                            required="true"
                            autofocus
                            :class="{ 'p-invalid': descriptionError }"
                            @input="clearDescriptionError"
                            fluid
                        />
                    </div>
                    <div>
                        <label for="permission-menu-code" class="block font-bold mb-2">Menu<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="permission-menu-code"
                            v-model="selectedMenu"
                            :suggestions="menuSuggestions"
                            optionLabel="name"
                            placeholder="Search and select menu..."
                            :disabled="createLoading || !!selectedSubmenu"
                            :loading="menuLoading"
                            :class="{ 'p-invalid': menuCodeError && !selectedSubmenu }"
                            @complete="searchMenu"
                            @select="onMenuSelect"
                            @input="clearMenuCodeError"
                            display="chip"
                            fluid
                        />
                    </div>
                    <div>
                        <label for="permission-submenu-code" class="block font-bold mb-2">Sub Menu<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="permission-submenu-code"
                            v-model="selectedSubmenu"
                            :suggestions="submenuSuggestions"
                            optionLabel="name"
                            placeholder="Search and select submenu..."
                            :disabled="createLoading || !!selectedMenu"
                            :loading="submenuLoading"
                            :class="{ 'p-invalid': submenuCodeError && !selectedMenu }"
                            @complete="searchSubmenu"
                            @select="onSubmenuSelect"
                            @input="clearSubmenuCodeError"
                            display="chip"
                            fluid
                        />
                    </div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showCreateDialog = false" :disabled="createLoading" />
                    <Button label="Save" icon="pi pi-check" @click="submitCreatePermission" :loading="createLoading" />
                </template>
            </Dialog>
            <Dialog v-model:visible="showEditDialog" header="Edit Permission" :modal="true" :style="{ width: '400px' }">
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="edit-permission-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                        <InputText id="edit-permission-name" v-model="editForm.name" placeholder="Enter permission name" :disabled="editLoading" required="true" autofocus :class="{ 'p-invalid': editNameError }" fluid />
                    </div>
                    <div>
                        <label for="edit-permission-description" class="block font-bold mb-2">Description<span class="text-red-500">*</span></label>
                        <InputText id="edit-permission-description" v-model="editForm.description" placeholder="Enter permission description" :disabled="editLoading" required="true" :class="{ 'p-invalid': editDescriptionError }" fluid />
                    </div>
                    <div>
                        <label for="edit-permission-menu-code" class="block font-bold mb-2">Menu<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="edit-permission-menu-code"
                            v-model="editSelectedMenu"
                            :suggestions="menuSuggestions"
                            optionLabel="name"
                            placeholder="Search and select menu..."
                            :disabled="editLoading || !!editSelectedSubmenu"
                            :loading="menuLoading"
                            :class="{ 'p-invalid': editMenuCodeError && !editSelectedSubmenu }"
                            @complete="searchMenu"
                            @select="
                                (e) => {
                                    editSelectedMenu.value = e.value;
                                    editForm.menu_code = e.value.code;
                                    editForm.submenu_code = null;
                                    editSelectedSubmenu.value = null;
                                    editMenuCodeError.value = false;
                                    editSubmenuCodeError.value = false;
                                }
                            "
                            display="chip"
                            fluid
                        />
                    </div>
                    <div>
                        <label for="edit-permission-submenu-code" class="block font-bold mb-2">Sub Menu<span class="text-red-500">*</span></label>
                        <AutoComplete
                            id="edit-permission-submenu-code"
                            v-model="editSelectedSubmenu"
                            :suggestions="submenuSuggestions"
                            optionLabel="name"
                            placeholder="Search and select submenu..."
                            :disabled="editLoading || !!editSelectedMenu"
                            :loading="submenuLoading"
                            :class="{ 'p-invalid': editSubmenuCodeError && !editSelectedMenu }"
                            @complete="searchSubmenu"
                            @select="
                                (e) => {
                                    editSelectedSubmenu.value = e.value;
                                    editForm.submenu_code = e.value.code;
                                    editForm.menu_code = null;
                                    editSelectedMenu.value = null;
                                    editMenuCodeError.value = false;
                                    editSubmenuCodeError.value = false;
                                }
                            "
                            display="chip"
                            fluid
                        />
                    </div>
                    <div v-if="editError" class="text-red-500 text-sm">{{ editError }}</div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showEditDialog = false" :disabled="editLoading" />
                    <Button label="Save" icon="pi pi-check" @click="submitEditPermission" :loading="editLoading" />
                </template>
            </Dialog>
            <Dialog v-model:visible="deleteDialog" header="Confirm Delete" :modal="true" :style="{ width: '350px' }">
                <div class="flex flex-col gap-4">
                    <div>Are you sure you want to delete this permission?</div>
                    <div class="font-bold">{{ permissionToDelete?.name }}</div>
                </div>
                <template #footer>
                    <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="deleteDialog = false" :disabled="deleteLoading" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deletePermission" :loading="deleteLoading" />
                </template>
            </Dialog>
        </div>
    </div>
</template>
