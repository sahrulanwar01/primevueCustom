<script setup>
import LoggingService from '@/service/generalSettings/LoggingService';
import Button from 'primevue/button';
import Calendar from 'primevue/calendar';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ===== ROUTER & ROUTE =====
const route = useRoute();
const router = useRouter();

const loggings = ref([]);
const totalRecords = ref(0);
const loading = ref(false);
const page = ref(parseInt(route.query.page) || 1);
const limit = ref(parseInt(route.query.limit) || 50);
const search = ref(route.query.search || '');

// Export modal state
const showExportDialog = ref(false);
const exportLoading = ref(false);
const startDate = ref(null);
const endDate = ref(null);
const exportError = ref('');

const today = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
});

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchLoggings() {
    loading.value = true;
    try {
        const res = await LoggingService.getLoggings({ page: page.value, limit: limit.value, search: search.value });
        const responseData = res.data || res;
        loggings.value = Array.isArray(responseData.data) ? responseData.data : [];
        totalRecords.value = parseInt(responseData.total_items || responseData.total || 0);
        await delay(100);
    } catch (error) {
        console.error('Error fetching loggings:', error);
    } finally {
        loading.value = false;
    }
}

onMounted(fetchLoggings);

function onSearchInput(e) {
    page.value = 1;
}

// ===== URL UPDATE FUNCTIONS =====
function updateURL() {
    const query = {};
    if (page.value > 1) query.page = page.value.toString();
    if (limit.value !== 50) query.limit = limit.value.toString();
    if (search.value.trim()) query.search = search.value.trim();

    router.replace({ query });
}

watch(
    search,
    (val, oldVal) => {
        if (val !== oldVal) {
            page.value = 1;
            updateURL();
            fetchLoggings();
        }
    },
    { debounce: 300 }
);

function onPage(event) {
    page.value = event.page + 1;
    limit.value = event.rows;
    updateURL();
    fetchLoggings();
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

// Export functions
function openExportDialog() {
    startDate.value = null;
    endDate.value = null;
    exportError.value = '';
    showExportDialog.value = true;
}

async function exportLoggings() {
    if (!startDate.value || !endDate.value) {
        exportError.value = 'Please select both start and end dates';
        return;
    }

    if (startDate.value > endDate.value) {
        exportError.value = 'Start date cannot be after end date';
        return;
    }

    exportLoading.value = true;
    exportError.value = '';

    try {
        const startDateStr = startDate.value.toISOString().split('T')[0];
        const endDateStr = endDate.value.toISOString().split('T')[0];

        const response = await LoggingService.exportLoggings(startDateStr, endDateStr);

        // Create download link
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `loggings_${startDateStr}_${endDateStr}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showExportDialog.value = false;
    } catch (error) {
        console.error('Error exporting loggings:', error);
        exportError.value = 'Failed to export loggings. Please try again.';
    } finally {
        exportLoading.value = false;
    }
}
</script>

<template>
    <div>
        <div class="card">
            <div class="mb-3">
                <h4 class="m-0">Logging Management</h4>
            </div>
            <DataTable
                :value="loading ? Array(limit).fill({}) : loggings"
                dataKey="log_code"
                :paginator="true"
                :rows="limit"
                :totalRecords="totalRecords"
                :first="(page - 1) * limit"
                :rowsPerPageOptions="[25, 50, 100]"
                :lazy="true"
                @page="onPage"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} loggings"
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
                        <Button label="Export" icon="pi pi-download" @click="openExportDialog" />
                    </div>
                </div>

                <Column field="log_code" header="Log Code" sortable style="min-width: 15rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.log_code }}
                        </template>
                    </template>
                </Column>

                <Column field="action" header="Action" sortable style="min-width: 20rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.action }}
                        </template>
                    </template>
                </Column>

                <Column field="name" header="User Name" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.name }}
                        </template>
                    </template>
                </Column>

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

                <Column field="ip_address" header="IP Address" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        <template v-if="loading">
                            <Skeleton height="2rem" width="100%" borderRadius="8px" />
                        </template>
                        <template v-else>
                            {{ slotProps.data.ip_address }}
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

                <!-- Empty State Template -->
                <template #empty>
                    <div v-if="!loading" class="flex flex-col items-center justify-center py-12">
                        <img src="/noData.png" alt="No Data" style="width: 25%" class="mb-6" />
                    </div>
                </template>
            </DataTable>
        </div>

        <!-- Export Dialog -->
        <Dialog v-model:visible="showExportDialog" header="Export Loggings" :modal="true" :style="{ width: '400px' }">
            <div class="flex flex-col gap-4">
                <div>
                    <label for="start-date" class="block font-bold mb-2"> Start Date<span class="text-red-500">*</span> </label>
                    <Calendar
                        id="start-date"
                        v-model="startDate"
                        dateFormat="yy-mm-dd"
                        placeholder="Select start date"
                        :disabled="exportLoading"
                        showIcon
                        :class="['w-full border rounded-md shadow-sm focus:ring-2 focus:ring-primary-500', exportError && !startDate ? 'border-red-500 ring-red-500' : 'border-gray-300']"
                    />
                </div>
                <div>
                    <label for="end-date" class="block font-bold mb-2"> End Date<span class="text-red-500">*</span> </label>
                    <Calendar
                        id="end-date"
                        v-model="endDate"
                        dateFormat="yy-mm-dd"
                        placeholder="Select end date"
                        :disabled="exportLoading"
                        showIcon
                        :maxDate="today"
                        :class="['w-full border rounded-md shadow-sm focus:ring-2 focus:ring-primary-500', exportError && !endDate ? 'border-red-500 ring-red-500' : 'border-gray-300']"
                    />
                </div>
                <div v-if="exportError" class="text-red-500 text-sm">
                    {{ exportError }}
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" icon="pi pi-times" outlined severity="secondary" @click="showExportDialog = false" :disabled="exportLoading" />
                <Button label="Export" icon="pi pi-download" @click="exportLoggings" :loading="exportLoading" />
            </template>
        </Dialog>
    </div>
</template>
