<script setup>
import MenusService from '@/service/menuManagement/MenuService';
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

const menus = ref([]);
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
const createForm = ref({ name: '', status: 'ACTIVE' });
const createLoading = ref(false);
const createError = ref('');
const nameError = ref(false);
const showEditDialog = ref(false);
const editForm = ref({ name: '', status: 'ACTIVE' });
const editLoading = ref(false);
const editError = ref('');
const editNameError = ref(false);
const selectedMenu = ref(null);
const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const menuToDelete = ref(null);
const statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' }
];

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

// Clear edit name error when user starts typing
function clearEditNameError() {
    if (editNameError.value) editNameError.value = false;
}

const toast = useToast();

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchMenus() {
    loading.value = true;
    try {
        const res = await MenusService.getMenus({ page: page.value, limit: limit.value, search: search.value });

        // Handle different response structures
        const responseData = res.data || res;
        menus.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        if (responseData.permissions) {
            permissions.value = responseData.permissions;
        }
        await delay(100);
    } catch (error) {
        console.error('Error fetching menus:', error);
    } finally {
        loading.value = false;
    }
}

onMounted(fetchMenus);

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
            fetchMenus();
        }
    },
    { debounce: 300 }
);

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    updateURL();
    fetchMenus();
}

async function editMenu(menu) {
    selectedMenu.value = menu;
    editLoading.value = true;
    editError.value = '';
    editNameError.value = false;

    try {
        const res = await MenusService.getMenuDetails(menu.menu_code);
        const menuData = res.data || res;
        editForm.value = {
            name: menuData.name,
            status: menuData.status
        };
        showEditDialog.value = true;
    } catch (error) {
        console.error('Error fetching menu details:', error);
    } finally {
        editLoading.value = false;
    }
}

function confirmDeleteMenu(menu) {
    menuToDelete.value = menu;
    showDeleteDialog.value = true;
}

async function openCreateDialog() {
    createForm.value = { name: '', status: 'ACTIVE' };
    createError.value = '';
    nameError.value = false;
    showCreateDialog.value = true;
}

async function submitCreateMenu() {
    if (!createForm.value.name) {
        nameError.value = true;
        return;
    }
    createLoading.value = true;
    createError.value = '';
    nameError.value = false;
    try {
        const res = await MenusService.createMenu({
            name: createForm.value.name,
            status: createForm.value.status
        });
        showCreateDialog.value = false;
        fetchMenus();
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to create menu.';
        createError.value = msg;
    } finally {
        createLoading.value = false;
    }
}

async function submitEditMenu() {
    if (!editForm.value.name) {
        editNameError.value = true;
        return;
    }
    editLoading.value = true;
    editError.value = '';
    editNameError.value = false;
    try {
        const res = await MenusService.updateMenu(selectedMenu.value.menu_code, {
            name: editForm.value.name,
            status: editForm.value.status
        });
        showEditDialog.value = false;
        fetchMenus();
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to update menu.';
        editError.value = msg;
    } finally {
        editLoading.value = false;
    }
}

async function deleteMenu() {
    deleteLoading.value = true;
    try {
        const res = await MenusService.deleteMenu(menuToDelete.value.menu_code);
        showDeleteDialog.value = false;
        fetchMenus();
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to delete menu.';
    } finally {
        deleteLoading.value = false;
    }
}
</script>

<template>
    <div>
        <div class="card">
            <div class="mb-3">
                <h4 class="m-0">Menu Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : menus"
                dataKey="menu_code"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[5, 10, 25]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} menus"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :emptyMessage="loading ? '' : 'No data available'"
            >
                <!-- <template #header> -->
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
                <!-- </template> -->
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
                            <Button v-if="permissions.can_update" icon="pi pi-pencil" size="small" outlined rounded class="mr-2" @click="editMenu(slotProps.data)" />
                            <Button v-if="permissions.can_delete" icon="pi pi-trash" size="small" outlined rounded severity="danger" @click="confirmDeleteMenu(slotProps.data)" />
                        </template>
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
        <Dialog v-model:visible="showCreateDialog" header="Create Menu" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="menu-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="menu-name" v-model="createForm.name" placeholder="Enter menu name" :disabled="createLoading" required="true" autofocus :class="{ 'p-invalid': nameError }" @input="clearNameError" fluid />
                </div>
                <div>
                    <label for="menu-status" class="block font-bold mb-2">Status</label>
                    <Dropdown id="menu-status" v-model="createForm.status" :options="statusOptions" optionLabel="label" optionValue="value" :disabled="createLoading" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showCreateDialog = false" :disabled="createLoading" />
                <Button label="Save" icon="pi pi-check" @click="submitCreateMenu" :loading="createLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showEditDialog" header="Edit Menu" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="edit-menu-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="edit-menu-name" v-model="editForm.name" placeholder="Enter menu name" :disabled="editLoading" required="true" autofocus :class="{ 'p-invalid': editNameError }" @input="clearEditNameError" fluid />
                </div>
                <div>
                    <label for="edit-menu-status" class="block font-bold mb-2">Status</label>
                    <Dropdown id="edit-menu-status" v-model="editForm.status" :options="statusOptions" optionLabel="label" optionValue="value" :disabled="editLoading" fluid />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showEditDialog = false" :disabled="editLoading" />
                <Button label="Update" icon="pi pi-check" @click="submitEditMenu" :loading="editLoading" />
            </template>
        </Dialog>

        <Dialog v-model:visible="showDeleteDialog" header="Delete Menu" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3">
                    <div>
                        <p class="font-semibold text-lg">Are you sure?</p>
                        <p class="text-gray-600">
                            This action cannot be undone. The menu <strong>"{{ menuToDelete?.name }}"</strong> will be permanently deleted.
                        </p>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showDeleteDialog = false" :disabled="deleteLoading" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteMenu" :loading="deleteLoading" />
            </template>
        </Dialog>
    </div>
</template>
