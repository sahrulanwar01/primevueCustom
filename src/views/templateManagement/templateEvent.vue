<script setup>
import templateEventService from '@/service/templateManagement/templateEventService';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import { onMounted, ref, watch } from 'vue';

const templateEvents = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const page = ref(1);
const limit = ref(10);
const search = ref('');
const permissions = ref({
    can_create: false,
    can_update: false,
    can_delete: false,
    can_view: false,
    can_details: false
});

const showCreateDialog = ref(false);
const createForm = ref({ code: '', name: '', description: '' });
const createLoading = ref(false);
const createError = ref('');
const codeError = ref(false);
const nameError = ref(false);
const descriptionError = ref(false);

const showEditDialog = ref(false);
const editForm = ref({ code: '', name: '', description: '' });
const editLoading = ref(false);
const editError = ref('');
const editNameError = ref(false);
const editDescriptionError = ref(false);
const selectedEvent = ref(null);

const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const eventToDelete = ref(null);

async function fetchTemplateEvents() {
    loading.value = true;
    try {
        const res = await templateEventService.getTemplateEvents({ page: page.value, limit: limit.value, search: search.value });
        const responseData = res.data || res;
        templateEvents.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        if (responseData.permissions) {
            permissions.value = responseData.permissions;
        }
    } catch (error) {
        console.error('Error fetching template events:', error);
        templateEvents.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchTemplateEvents();
});

watch(
    search,
    (val, oldVal) => {
        if (val !== oldVal) {
            page.value = 1;
            fetchTemplateEvents();
        }
    },
    { debounce: 300 }
);

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    fetchTemplateEvents();
}

function openCreateDialog() {
    createForm.value = { code: '', name: '', description: '' };
    createError.value = '';
    codeError.value = false;
    nameError.value = false;
    ((descriptionError.value = false), (showCreateDialog.value = true));
}

function clearCodeError() {
    if (codeError.value) codeError.value = false;
}
function clearNameError() {
    if (nameError.value) nameError.value = false;
}
function clearDescriptionError() {
    if (descriptionError.value) descriptionError.value = false;
}

async function submitCreateTemplateEvent() {
    if (!createForm.value.code) {
        codeError.value = true;
    }
    if (!createForm.value.name) {
        nameError.value = true;
    }
    if (!createForm.value.description) {
        descriptionError.value = true;
    }
    if (codeError.value || nameError.value || descriptionError.value) return;
    createLoading.value = true;
    createError.value = '';
    try {
        await templateEventService.createTemplateEvent({
            code: createForm.value.code,
            name: createForm.value.name,
            description: createForm.value.description
        });
        showCreateDialog.value = false;
        fetchTemplateEvents();
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to create template event.';
        createError.value = msg;
    } finally {
        createLoading.value = false;
    }
}

function openEditDialog(event) {
    selectedEvent.value = event;
    editLoading.value = true;
    editError.value = '';
    editNameError.value = false;
    editDescriptionError.value = false;
    templateEventService
        .getTemplateEventDetails(event.code)
        .then((res) => {
            const data = res.data || res;
            editForm.value = {
                code: data.code,
                name: data.name,
                description: data.description
            };
            showEditDialog.value = true;
        })
        .catch(() => {
            editError.value = 'Failed to fetch event details.';
        })
        .finally(() => {
            editLoading.value = false;
        });
}
function clearEditNameError() {
    if (editNameError.value) editNameError.value = false;
}
function clearEditDescriptionError() {
    if (editDescriptionError.value) editDescriptionError.value = false;
}
async function submitEditTemplateEvent() {
    if (!editForm.value.name) {
        editNameError.value = true;
    }
    if (!editForm.value.description) {
        editDescriptionError.value = true;
    }
    if (editNameError.value || editDescriptionError.value) return;
    editLoading.value = true;
    editError.value = '';
    try {
        await templateEventService.updateTemplateEvent(editForm.value.code, {
            name: editForm.value.name,
            description: editForm.value.description
        });
        showEditDialog.value = false;
        fetchTemplateEvents();
    } catch (e) {
        const msg = e?.response?.data?.message || 'Failed to update template event.';
        editError.value = msg;
    } finally {
        editLoading.value = false;
    }
}

function openDeleteDialog(event) {
    eventToDelete.value = event;
    showDeleteDialog.value = true;
}
async function submitDeleteTemplateEvent() {
    if (!eventToDelete.value) return;
    deleteLoading.value = true;
    try {
        await templateEventService.deleteTemplateEvent(eventToDelete.value.code);
        showDeleteDialog.value = false;
        fetchTemplateEvents();
    } catch (e) {
        // Optional: tampilkan error toast
    } finally {
        deleteLoading.value = false;
    }
}
</script>

<template>
    <div>
        <div class="card">
            <div class="mb-3">
                <h4 class="m-0">Template Event Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : templateEvents"
                dataKey="code"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[5, 10, 25]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} events"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            >
                <div class="flex flex-wrap items-center justify-between w-full mb-6 mt-6">
                    <div class="flex-1 flex items-center">
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="search" placeholder="Search..." class="p-inputtext p-component" />
                        </IconField>
                    </div>
                    <div class="flex-1 flex justify-end">
                        <Button v-if="permissions.can_create" label="Add" icon="pi pi-plus" @click="openCreateDialog" />
                    </div>
                </div>
                <Column field="code" header="Code" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.code }}
                        </template>
                    </template>
                </Column>
                <Column field="name" header="Name" sortable style="min-width: 14rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.name }}
                        </template>
                    </template>
                </Column>
                <Column field="description" header="Description" sortable style="min-width: 18rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.description }}
                        </template>
                    </template>
                </Column>
                <Column field="createdAt" header="Created At" sortable style="min-width: 14rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ new Date(slotProps.data.createdAt).toLocaleString() }}
                        </template>
                    </template>
                </Column>
                <Column field="updatedAt" header="Updated At" sortable style="min-width: 14rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ new Date(slotProps.data.updatedAt).toLocaleString() }}
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
                        <Button v-if="permissions.can_update" icon="pi pi-pencil" outlined rounded class="mr-2" @click="openEditDialog(slotProps.data)" />
                        <Button v-if="permissions.can_delete" icon="pi pi-trash" outlined rounded severity="danger" @click="openDeleteDialog(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>
        <Dialog v-model:visible="showCreateDialog" header="Add Template Event" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="event-code" class="block font-bold mb-2">Code<span class="text-red-500">*</span></label>
                    <InputText id="event-code" v-model="createForm.code" placeholder="Enter event code" :disabled="createLoading" required autofocus :class="{ 'p-invalid': codeError }" @input="clearCodeError" fluid />
                </div>
                <div>
                    <label for="event-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="event-name" v-model="createForm.name" placeholder="Enter event name" :disabled="createLoading" required :class="{ 'p-invalid': nameError }" @input="clearNameError" fluid />
                </div>
                <div>
                    <label for="event-desc" class="block font-bold mb-2">Description<span class="text-red-500">*</span></label>
                    <InputText id="event-desc" v-model="createForm.description" placeholder="Enter description" :disabled="createLoading" :class="{ 'p-invalid': descriptionError }" @input="clearDescriptionError" fluid />
                </div>
                <div v-if="createError" class="text-red-500 text-sm">{{ createError }}</div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showCreateDialog = false" :disabled="createLoading" />
                <Button label="Save" icon="pi pi-check" @click="submitCreateTemplateEvent" :loading="createLoading" />
            </template>
        </Dialog>
        <Dialog v-model:visible="showEditDialog" header="Edit Template Event" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="edit-event-code" class="block font-bold mb-2">Code</label>
                    <InputText id="edit-event-code" v-model="editForm.code" disabled fluid />
                </div>
                <div>
                    <label for="edit-event-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="edit-event-name" v-model="editForm.name" :disabled="editLoading" required :class="{ 'p-invalid': editNameError }" @input="clearEditNameError" fluid />
                </div>
                <div>
                    <label for="edit-event-desc" class="block font-bold mb-2">Description<span class="text-red-500">*</span></label>
                    <InputText id="edit-event-desc" v-model="editForm.description" :disabled="editLoading" :class="{ 'p-invalid': editDescriptionError }" @input="clearEditDescriptionError" fluid />
                </div>
                <div v-if="editError" class="text-red-500 text-sm">{{ editError }}</div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showEditDialog = false" :disabled="editLoading" />
                <Button label="Update" icon="pi pi-check" @click="submitEditTemplateEvent" :loading="editLoading" />
            </template>
        </Dialog>
        <Dialog v-model:visible="showDeleteDialog" header="Delete Template Event" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3">
                    <div>
                        <p class="font-semibold text-lg">Are you sure?</p>
                        <p class="text-gray-600">
                            This action cannot be undone. The event <strong>"{{ eventToDelete?.name }}"</strong> will be permanently deleted.
                        </p>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showDeleteDialog = false" :disabled="deleteLoading" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="submitDeleteTemplateEvent" :loading="deleteLoading" />
            </template>
        </Dialog>
    </div>
</template>
