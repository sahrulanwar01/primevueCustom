<script setup>
import templateEventService from '@/service/templateManagement/templateEventService';
import templateService from '@/service/templateManagement/templateService';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ===== ROUTER & ROUTE =====
const route = useRoute();
const router = useRouter();

const templates = ref([]);
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
const createForm = ref({
    eventCode: '',
    channel: '',
    name: '',
    subject: '',
    content: '',
    variables: '', // comma separated string for UI, will be array for API
    status: 'ACTIVE'
});
const createLoading = ref(false);
const createError = ref('');
// Tambah error state per field
const createEventCodeError = ref(false);
const createChannelError = ref(false);
const createNameError = ref(false);
const createSubjectError = ref(false);
const createContentError = ref(false);
const createStatusError = ref(false);

const showEditDialog = ref(false);
const editForm = ref({
    id: '',
    eventCode: '',
    channel: '',
    name: '',
    subject: '',
    content: '',
    variables: '', // comma separated string for UI
    status: 'ACTIVE'
});
const editLoading = ref(false);
const editError = ref('');
// Tambah error state per field untuk edit
const editEventCodeError = ref(false);
const editChannelError = ref(false);
const editNameError = ref(false);
const editSubjectError = ref(false);
const editContentError = ref(false);
const editStatusError = ref(false);

const showDeleteDialog = ref(false);
const deleteLoading = ref(false);
const templateToDelete = ref(null);
const deleteError = ref('');

const channelOptions = [
    { label: 'Email', value: 'EMAIL' },
    { label: 'WhatsApp', value: 'WHATSAPP' },
    { label: 'SMS', value: 'SMS' },
    { label: 'Push', value: 'PUSH' },
    { label: 'System', value: 'SYSTEM' }
];

const eventOptions = ref([]);
const eventLoading = ref(false);

async function fetchEventOptions() {
    eventLoading.value = true;
    try {
        const res = await templateEventService.getTemplateEvents({ page: 1, limit: 1000 });
        eventOptions.value = (res.data || res).data || [];
    } catch (e) {
        eventOptions.value = [];
    } finally {
        eventLoading.value = false;
    }
}

const isEditSubjectDisabled = computed(() => editForm.value.channel && editForm.value.channel !== 'EMAIL');

function getStatusClass(status) {
    return {
        'px-2 py-1 rounded-md text-sm font-medium gap-2': true,
        'bg-green-100 text-green-800 border border-green-200': status === 'ACTIVE',
        'bg-red-100 text-red-800 border border-red-200': status === 'INACTIVE'
    };
}

async function fetchTemplates() {
    loading.value = true;
    try {
        const res = await templateService.getTemplate({ page: page.value, limit: limit.value, search: search.value });
        const responseData = res.data || res;
        templates.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        if (responseData.permissions) {
            permissions.value = responseData.permissions;
        }
    } catch (error) {
        console.error('Error fetching templates:', error);
        templates.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
}

function openCreateDialog() {
    createForm.value = {
        eventCode: '',
        channel: '',
        name: '',
        subject: '',
        content: '',
        variables: '',
        status: 'ACTIVE'
    };
    createError.value = '';
    showCreateDialog.value = true;
}

function isSubjectDisabled() {
    return createForm.value.channel && createForm.value.channel !== 'EMAIL';
}

async function submitCreateTemplate() {
    // Validasi per field
    let hasError = false;
    if (!createForm.value.eventCode) {
        createEventCodeError.value = true;
        hasError = true;
    }
    if (!createForm.value.channel) {
        createChannelError.value = true;
        hasError = true;
    }
    if (!createForm.value.name) {
        createNameError.value = true;
        hasError = true;
    }
    if (!createForm.value.content) {
        createContentError.value = true;
        hasError = true;
    }
    if (!createForm.value.status) {
        createStatusError.value = true;
        hasError = true;
    }
    if (createForm.value.channel === 'EMAIL' && !createForm.value.subject) {
        createSubjectError.value = true;
        hasError = true;
    }
    if (hasError) {
        createError.value = 'Please fill all required fields.';
        return;
    }
    createLoading.value = true;
    createError.value = '';
    try {
        const payload = {
            eventCode: createForm.value.eventCode,
            channel: createForm.value.channel,
            name: createForm.value.name,
            subject: isSubjectDisabled() ? null : createForm.value.subject,
            content: createForm.value.content,
            variables: createForm.value.variables
                ? createForm.value.variables
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean)
                : [],
            status: createForm.value.status
        };
        await templateService.createTemplate(payload);
        showCreateDialog.value = false;
        fetchTemplates();
    } catch (e) {
        createError.value = e?.response?.data?.message || 'Failed to create template.';
    } finally {
        createLoading.value = false;
    }
}

async function openEditDialog(template) {
    editLoading.value = true;
    editError.value = '';
    try {
        const res = await templateService.getTemplate({ page: 1, limit: 1, search: '' }); // fallback if no get by id
        let detail = null;
        if (template.id) {
            // Try to get by id if available
            try {
                const detailRes = await templateService.getTemplateById(template.id);
                detail = detailRes.data || detailRes;
            } catch (e) {
                detail = template; // fallback to row data
            }
        } else {
            detail = template;
        }
        editForm.value = {
            id: detail.id,
            eventCode: detail.eventCode || '',
            channel: detail.channel || '',
            name: detail.name || '',
            subject: detail.subject || '',
            content: detail.content || '',
            variables: Array.isArray(detail.variables) ? detail.variables.join(', ') : detail.variables || '',
            status: detail.status || 'ACTIVE'
        };
        showEditDialog.value = true;
    } finally {
        editLoading.value = false;
    }
}

function onCreateInput() {
    createError.value = '';
    if (createEventCodeError.value) createEventCodeError.value = false;
    if (createChannelError.value) createChannelError.value = false;
    if (createNameError.value) createNameError.value = false;
    if (createSubjectError.value) createSubjectError.value = false;
    if (createContentError.value) createContentError.value = false;
    if (createStatusError.value) createStatusError.value = false;
}
function onEditInput() {
    editError.value = '';
    if (editEventCodeError.value) editEventCodeError.value = false;
    if (editChannelError.value) editChannelError.value = false;
    if (editNameError.value) editNameError.value = false;
    if (editSubjectError.value) editSubjectError.value = false;
    if (editContentError.value) editContentError.value = false;
    if (editStatusError.value) editStatusError.value = false;
}

async function submitEditTemplate() {
    // Trim all fields
    const form = {
        eventCode: editForm.value.eventCode.trim(),
        channel: editForm.value.channel,
        name: editForm.value.name.trim(),
        subject: editForm.value.subject.trim(),
        content: editForm.value.content.trim(),
        variables: editForm.value.variables,
        status: editForm.value.status
    };
    // Validasi per field
    let hasError = false;
    if (!form.eventCode) {
        editEventCodeError.value = true;
        hasError = true;
    }
    if (!form.channel) {
        editChannelError.value = true;
        hasError = true;
    }
    if (!form.name) {
        editNameError.value = true;
        hasError = true;
    }
    if (!form.content) {
        editContentError.value = true;
        hasError = true;
    }
    if (!form.status) {
        editStatusError.value = true;
        hasError = true;
    }
    if (form.channel === 'EMAIL' && !form.subject) {
        editSubjectError.value = true;
        hasError = true;
    }
    if (hasError) {
        editError.value = 'Please fill all required fields.';
        return;
    }
    editLoading.value = true;
    editError.value = '';
    try {
        const payload = {
            eventCode: form.eventCode,
            channel: form.channel,
            name: form.name,
            subject: isEditSubjectDisabled.value ? null : form.subject,
            content: form.content,
            variables: form.variables
                ? form.variables
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean)
                : [],
            status: form.status
        };
        await templateService.updateTemplate(editForm.value.id, payload);
        showEditDialog.value = false;
        await fetchTemplates();
    } catch (e) {
        editError.value = e?.response?.data?.message || 'Failed to update template.';
    } finally {
        editLoading.value = false;
    }
}

function openDeleteDialog(template) {
    templateToDelete.value = template;
    deleteError.value = '';
    showDeleteDialog.value = true;
}

async function submitDeleteTemplate() {
    if (!templateToDelete.value) return;
    deleteLoading.value = true;
    deleteError.value = '';
    try {
        await templateService.deleteTemplate(templateToDelete.value.id);
        showDeleteDialog.value = false;
        templateToDelete.value = null;
        await fetchTemplates();
    } catch (e) {
        deleteError.value = e?.response?.data?.message || 'Failed to delete template.';
    } finally {
        deleteLoading.value = false;
    }
}

onMounted(() => {
    fetchEventOptions();
    fetchTemplates();
});

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
            fetchTemplates();
        }
    },
    { debounce: 300 }
);

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    updateURL();
    fetchTemplates();
}

// Tambah fungsi clear error per field untuk create
function clearCreateEventCodeError() {
    if (createEventCodeError.value) createEventCodeError.value = false;
}
function clearCreateChannelError() {
    if (createChannelError.value) createChannelError.value = false;
}
function clearCreateNameError() {
    if (createNameError.value) createNameError.value = false;
}
function clearCreateSubjectError() {
    if (createSubjectError.value) createSubjectError.value = false;
}
function clearCreateContentError() {
    if (createContentError.value) createContentError.value = false;
}
function clearCreateStatusError() {
    if (createStatusError.value) createStatusError.value = false;
}
// Tambah fungsi clear error per field untuk edit
function clearEditEventCodeError() {
    if (editEventCodeError.value) editEventCodeError.value = false;
}
function clearEditChannelError() {
    if (editChannelError.value) editChannelError.value = false;
}
function clearEditNameError() {
    if (editNameError.value) editNameError.value = false;
}
function clearEditSubjectError() {
    if (editSubjectError.value) editSubjectError.value = false;
}
function clearEditContentError() {
    if (editContentError.value) editContentError.value = false;
}
function clearEditStatusError() {
    if (editStatusError.value) editStatusError.value = false;
}
</script>

<template>
    <div>
        <div class="card">
            <div class="mb-3">
                <h4 class="m-0">Template Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : templates"
                dataKey="id"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[5, 10, 25]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} templates"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :emptyMessage="loading ? '' : 'No data available'"
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
                <Column field="eventCode" header="Event Code" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.eventCode }}
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
                <Column field="status" header="Status" sortable style="min-width: 9rem">
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
                <Column field="channel" header="Channel" sortable style="min-width: 8rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.channel }}
                        </template>
                    </template>
                </Column>
                <Column field="subject" header="Subject" sortable style="min-width: 16rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.subject }}
                        </template>
                    </template>
                </Column>
                <Column field="content" header="Content" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.content }}
                        </template>
                    </template>
                </Column>
                <Column field="variables" header="Variables" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.variables }}
                        </template>
                    </template>
                </Column>
                <Column v-if="permissions.can_update || permissions.can_delete" header="Actions" style="min-width: 8rem">
                    <template #body="slotProps">
                        <Button v-if="permissions.can_update" icon="pi pi-pencil" size="small" outlined rounded class="mr-2" @click="openEditDialog(slotProps.data)" />
                        <Button v-if="permissions.can_delete" icon="pi pi-trash" size="small" outlined rounded severity="danger" @click="openDeleteDialog(slotProps.data)" />
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
        <Dialog v-model:visible="showCreateDialog" header="Create Template" :modal="true" :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="create-eventCode" class="block font-bold mb-2">Event Code<span class="text-red-500">*</span></label>
                    <Dropdown
                        id="create-eventCode"
                        v-model="createForm.eventCode"
                        :options="eventOptions"
                        optionLabel="code"
                        optionValue="code"
                        placeholder="Select Event"
                        class="w-full"
                        :loading="eventLoading"
                        :disabled="createLoading"
                        @change="onCreateInput"
                        autofocus
                        :class="{ 'p-invalid': createEventCodeError }"
                    />
                </div>
                <div>
                    <label for="create-channel" class="block font-bold mb-2">Channel<span class="text-red-500">*</span></label>
                    <select id="create-channel" v-model="createForm.channel" class="p-inputtext p-component w-full" :disabled="createLoading" @change="onCreateInput" :class="{ 'p-invalid': createChannelError }">
                        <option value="" disabled>Select Channel</option>
                        <option v-for="opt in channelOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                </div>
                <div>
                    <label for="create-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="create-name" v-model="createForm.name" placeholder="Template Name" class="w-full" :disabled="createLoading" @input="clearCreateNameError" :class="{ 'p-invalid': createNameError }" />
                    <div v-if="createNameError" class="text-red-500 text-sm">Name is required.</div>
                </div>
                <div>
                    <label :for="'create-subject'" class="block font-bold mb-2">Subject<span class="text-red-500" v-if="createForm.channel === 'EMAIL'">*</span></label>
                    <InputText id="create-subject" v-model="createForm.subject" placeholder="Subject" class="w-full" :disabled="createLoading || isSubjectDisabled()" @input="clearCreateSubjectError" :class="{ 'p-invalid': createSubjectError }" />
                </div>
                <div>
                    <label for="create-content" class="block font-bold mb-2">Content<span class="text-red-500">*</span></label>
                    <textarea
                        id="create-content"
                        v-model="createForm.content"
                        placeholder="Content"
                        class="p-inputtext p-component w-full"
                        rows="8"
                        :disabled="createLoading"
                        @input="clearCreateContentError"
                        :class="{ 'p-invalid': createContentError }"
                    ></textarea>
                </div>
                <div>
                    <label for="create-variables" class="block font-bold mb-2">Variables (comma separated)</label>
                    <InputText id="create-variables" v-model="createForm.variables" placeholder="e.g. username, order_number" class="w-full" :disabled="createLoading" @input="onCreateInput" />
                </div>
                <div>
                    <label for="create-status" class="block font-bold mb-2">Status<span class="text-red-500">*</span></label>
                    <select id="create-status" v-model="createForm.status" class="p-inputtext p-component w-full" :disabled="createLoading" @change="onCreateInput" :class="{ 'p-invalid': createStatusError }">
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                    <div v-if="createStatusError" class="text-red-500 text-sm">Status is required.</div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showCreateDialog = false" :disabled="createLoading" />
                <Button label="Save" icon="pi pi-check" @click="submitCreateTemplate" :loading="createLoading" :disabled="createLoading" />
            </template>
        </Dialog>
        <Dialog v-model:visible="showEditDialog" header="Edit Template" :modal="true" :style="{ width: '500px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="edit-eventCode" class="block font-bold mb-2">Event Code<span class="text-red-500">*</span></label>
                    <Dropdown
                        id="edit-eventCode"
                        v-model="editForm.eventCode"
                        :options="eventOptions"
                        optionLabel="code"
                        optionValue="code"
                        placeholder="Select Event"
                        class="w-full"
                        :loading="eventLoading"
                        :disabled="editLoading"
                        @change="onEditInput"
                        autofocus
                        :class="{ 'p-invalid': editEventCodeError }"
                    />
                </div>
                <div>
                    <label for="edit-channel" class="block font-bold mb-2">Channel<span class="text-red-500">*</span></label>
                    <select id="edit-channel" v-model="editForm.channel" class="p-inputtext p-component w-full" :disabled="editLoading" @change="onEditInput" :class="{ 'p-invalid': editChannelError }">
                        <option value="" disabled>Select Channel</option>
                        <option v-for="opt in channelOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                    </select>
                </div>
                <div>
                    <label for="edit-name" class="block font-bold mb-2">Name<span class="text-red-500">*</span></label>
                    <InputText id="edit-name" v-model="editForm.name" placeholder="Template Name" class="w-full" :disabled="editLoading" @input="clearEditNameError" :class="{ 'p-invalid': editNameError }" />
                </div>
                <div>
                    <label :for="'edit-subject'" class="block font-bold mb-2">Subject<span class="text-red-500" v-if="editForm.channel === 'EMAIL'">*</span></label>
                    <InputText id="edit-subject" v-model="editForm.subject" placeholder="Subject" class="w-full" :disabled="editLoading || isEditSubjectDisabled" @input="clearEditSubjectError" :class="{ 'p-invalid': editSubjectError }" />
                </div>
                <div>
                    <label for="edit-content" class="block font-bold mb-2">Content<span class="text-red-500">*</span></label>
                    <textarea
                        id="edit-content"
                        v-model="editForm.content"
                        placeholder="Content"
                        class="p-inputtext p-component w-full"
                        rows="8"
                        :disabled="editLoading"
                        @input="clearEditContentError"
                        :class="{ 'p-invalid': editContentError }"
                    ></textarea>
                </div>
                <div>
                    <label for="edit-variables" class="block font-bold mb-2">Variables (comma separated)</label>
                    <InputText id="edit-variables" v-model="editForm.variables" placeholder="e.g. username, order_number" class="w-full" :disabled="editLoading" @input="onEditInput" />
                </div>
                <div>
                    <label for="edit-status" class="block font-bold mb-2">Status<span class="text-red-500">*</span></label>
                    <select id="edit-status" v-model="editForm.status" class="p-inputtext p-component w-full" :disabled="editLoading" @change="onEditInput" :class="{ 'p-invalid': editStatusError }">
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                    </select>
                    <div v-if="editStatusError" class="text-red-500 text-sm">Status is required.</div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showEditDialog = false" :disabled="editLoading" />
                <Button label="Update" icon="pi pi-check" @click="submitEditTemplate" :loading="editLoading" :disabled="editLoading" />
            </template>
        </Dialog>
        <Dialog v-model:visible="showDeleteDialog" header="Delete Template" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3">
                    <div>
                        <p class="font-semibold text-lg">Are you sure?</p>
                        <p class="text-gray-600">
                            This action cannot be undone. The template <strong>"{{ templateToDelete?.name }}"</strong> will be permanently deleted.
                        </p>
                        <div v-if="deleteError" class="text-red-500 text-sm mt-2">{{ deleteError }}</div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showDeleteDialog = false" :disabled="deleteLoading" />
                <Button label="Delete" icon="pi pi-trash" severity="danger" @click="submitDeleteTemplate" :loading="deleteLoading" />
            </template>
        </Dialog>
    </div>
</template>
