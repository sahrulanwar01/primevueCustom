<script setup>
import MenusService from '@/service/menuManagement/MenuService';
import SubMenusService from '@/service/menuManagement/SubMenuService';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ===== ROUTER & ROUTE =====
const route = useRoute();
const router = useRouter();

const subMenus = ref([]);
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
const showCreateDialog = ref(false);
const createForm = ref({ name: '', menu_code: null, status: 'ACTIVE' });
const createLoading = ref(false);
const createError = ref('');
const nameError = ref(false);
const menuCodeError = ref(false);
const showEditDialog = ref(false);
const editForm = ref({ name: '', status: 'ACTIVE' });
const editLoading = ref(false);
const editError = ref('');
const editNameError = ref(false);
const selectedSubMenu = ref(null);
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const subMenuToDelete = ref(null);
const statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
];

// Menu search functionality
// const menuOptions = ref([]);
// const menuLoading = ref(false);
const menuSuggestions = ref([]);
const menuLoading = ref(false);
// const selectedMenu = ref(null);

// Function to get status styling
function getStatusClass(status) {
    return {
        'px-2 py-1 rounded-md text-sm font-medium gap-2': true, // px-2 lebih ramping, hapus flex
        'bg-green-100 text-green-800 border border-green-200': status === 'ACTIVE',
        'bg-red-100 text-red-800 border border-red-200': status === 'INACTIVE'
    };
}

// Clear name error when user starts typing
function clearNameError() {
    if (nameError.value) nameError.value = false;
}

// Clear menu code error when user starts typing
function clearMenuCodeError() {
    if (menuCodeError.value) menuCodeError.value = false;
}

// Clear edit name error when user starts typing
function clearEditNameError() {
    if (editNameError.value) editNameError.value = false;
}

const toast = useToast();

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to search menu options (autocomplete)
async function searchMenu(event) {
    const query = event.query?.toLowerCase() || '';
    menuLoading.value = true;
    try {
        const res = await MenusService.getMenus({ page: 1, limit: 100, search: query });
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

// Handle menu select
function onMenuSelect() {
    menuCodeError.value = false;
}

function onMenuClear() {
    createForm.value.menu_code = null;
    menuCodeError.value = true;
}

async function fetchSubMenus() {
    loading.value = true;
    try {
        const res = await SubMenusService.getSubMenus({ page: page.value, limit: limit.value, search: search.value });

        // Handle different response structures
        const responseData = res.data || res;
        subMenus.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        if (responseData.permissions) {
            permissions.value = responseData.permissions;
        }
        await delay(100);
    } catch (error) {
        console.error('Error fetching submenus:', error);
        subMenus.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchSubMenus();
    // Tidak perlu fetchMenuOptions, autocomplete akan fetch sendiri
});

// ===== URL UPDATE FUNCTIONS =====
function updateURL() {
    const query = {};
    if (page.value > 1) query.page = page.value.toString();
    if (limit.value !== 10) query.limit = limit.value.toString();
    if (search.value.trim()) query.search = search.value.trim();

    router.replace({ query });
}

function onSearchInput(e) {
    page.value = 1;
}

watch(
    search,
    (val, oldVal) => {
        if (val !== oldVal) {
            page.value = 1;
            updateURL();
            fetchSubMenus();
        }
    },
    { debounce: 300 }
);

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    updateURL();
    fetchSubMenus();
}

async function editSubMenu(subMenu) {
    selectedSubMenu.value = subMenu;
    editLoading.value = true;
    editError.value = '';
    editNameError.value = false;

    try {
        const res = await SubMenusService.getSubMenuDetails(subMenu.submenu_code);
        const subMenuData = res.data || res;
        editForm.value = {
            name: subMenuData.name,
            status: subMenuData.status
        };
        showEditDialog.value = true;
    } catch (error) {
        console.error('Error fetching submenu details:', error);
    } finally {
        editLoading.value = false;
    }
}

function confirmDeleteSubMenu(subMenu) {
    subMenuToDelete.value = subMenu;
    showDeleteDialog.value = true;
}

async function openCreateDialog() {
    createForm.value = { name: '', menu_code: null, status: 'ACTIVE' };
    createError.value = '';
    nameError.value = false;
    menuCodeError.value = false;
    // selectedMenu.value = null;
    showCreateDialog.value = true;
    // Tidak perlu fetchMenuOptions, autocomplete akan fetch sendiri
}

async function submitCreateSubMenu() {
    let hasError = false;
    if (!createForm.value.name) {
        nameError.value = true;
        hasError = true;
    }
    if (!createForm.value.menu_code || typeof createForm.value.menu_code !== 'object' || !createForm.value.menu_code.code) {
        menuCodeError.value = true;
        hasError = true;
    }
    if (hasError) return;

    createLoading.value = true;
    createError.value = '';
    // nameError.value = false;
    // menuCodeError.value = false;
    try {
        const res = await SubMenusService.createSubMenu({
            name: createForm.value.name,
            menu_code: createForm.value.menu_code.code,
            status: createForm.value.status
        });
        showCreateDialog.value = false;
        fetchSubMenus();
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to create submenu.';
        createError.value = msg;
    } finally {
        createLoading.value = false;
    }
}

async function submitEditSubMenu() {
    if (!editForm.value.name) {
        editNameError.value = true;
        return;
    }
    editLoading.value = true;
    editError.value = '';
    editNameError.value = false;
    try {
        const res = await SubMenusService.updateSubMenu(selectedSubMenu.value.submenu_code, {
            name: editForm.value.name,
            status: editForm.value.status
        });
        showEditDialog.value = false;
        fetchSubMenus();
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to update submenu.';
        editError.value = msg;
    } finally {
        editLoading.value = false;
    }
}

async function deleteSubMenu() {
    deleteLoading.value = true;
    try {
        const res = await SubMenusService.deleteSubMenu(subMenuToDelete.value.submenu_code);
        showDeleteDialog.value = false;
        fetchSubMenus();
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to delete submenu.';
    } finally {
        deleteLoading.value = false;
    }
}
</script>

<template>
    <div>
        <div class="card">
            <div class="mb-3">
                <h4 class="m-0">Sub Menu Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : subMenus"
                dataKey="submenu_code"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[5, 10, 25]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} submenus"
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
                <Column field="submenu_code" header="Sub Menu Code" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.submenu_code }}
                        </template>
                    </template>
                </Column>
                <Column field="menu_code" header="Menu Code" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.menu_code }}
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
                            <Button v-if="permissions.can_update" icon="pi pi-pencil" size="small" outlined rounded class="mr-2" @click="editSubMenu(slotProps.data)" />
                            <Button v-if="permissions.can_delete" icon="pi pi-trash" size="small" outlined rounded severity="danger" @click="confirmDeleteSubMenu(slotProps.data)" />
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
        </div>
        <Dialog v-model:visible="showCreateDialog" header="Create Sub Menu" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="menu-select" class="block font-bold mb-2">Menu<span class="text-red-500">*</span></label>
                    <AutoComplete
                        id="menu-select"
                        v-model="createForm.menu_code"
                        :suggestions="menuSuggestions"
                        optionLabel="name"
                        placeholder="Search and select menu..."
                        :disabled="createLoading"
                        :loading="menuLoading"
                        :input-class="{ 'p-invalid': menuCodeError }"
                        @complete="searchMenu"
                        @item-select="onMenuSelect"
                        @clear="onMenuClear"
                        fluid
                    />
                </div>
                <div>
                    <label for="submenu-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="submenu-name" v-model="createForm.name" placeholder="Enter submenu name" :disabled="createLoading" required="true" :class="{ 'p-invalid': nameError }" @input="clearNameError" fluid />
                </div>
                <div>
                    <label for="submenu-status" class="block font-bold mb-2">Status</label>
                    <Dropdown id="submenu-status" v-model="createForm.status" :options="statusOptions" optionLabel="label" optionValue="value" :disabled="createLoading" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showCreateDialog = false" :disabled="createLoading" />
                <Button label="Save" icon="pi pi-check" @click="submitCreateSubMenu" :loading="createLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showEditDialog" header="Edit Sub Menu" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="edit-submenu-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="edit-submenu-name" v-model="editForm.name" placeholder="Enter submenu name" :disabled="editLoading" required="true" autofocus :class="{ 'p-invalid': editNameError }" @input="clearEditNameError" fluid />
                </div>
                <div>
                    <label for="edit-submenu-status" class="block font-bold mb-2">Status</label>
                    <Dropdown id="edit-submenu-status" v-model="editForm.status" :options="statusOptions" optionLabel="label" optionValue="value" :disabled="editLoading" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showEditDialog = false" :disabled="editLoading" />
                <Button label="Update" icon="pi pi-check" @click="submitEditSubMenu" :loading="editLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showDeleteDialog" header="Delete Sub Menu" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3">
                    <div>
                        <p class="font-semibold text-lg">Are you sure?</p>
                        <p class="text-gray-600">
                            This action cannot be undone. The submenu <strong>"{{ subMenuToDelete?.name }}"</strong> will be permanently deleted.
                        </p>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showDeleteDialog = false" :disabled="deleteLoading" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteSubMenu" :loading="deleteLoading" />
            </template>
        </Dialog>
    </div>
</template>
