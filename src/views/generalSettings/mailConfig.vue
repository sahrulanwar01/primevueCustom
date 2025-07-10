<script setup>
import MailConfigService from '@/service/generalSettings/MailConfigService';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Skeleton from 'primevue/skeleton';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const mailConfig = ref({
    driver: '',
    host: '',
    port: '',
    from_address: '',
    from_name: '',
    to: '',
    encryption: '',
    username: '',
    password: ''
});

const loading = ref(false);
const testEmailLoading = ref(false);
const testEmailAddress = ref('');
const showTestEmailDialog = ref(false);
const permissions = ref({
    can_create: false,
    can_update: false,
    can_delete: false,
    can_view: false,
    can_details: false
});
const isSubmitted = ref(false);
const currentId = ref(null);

// Error states
const driverError = ref(false);
const hostError = ref(false);
const portError = ref(false);
const fromAddressError = ref(false);
const fromNameError = ref(false);
const toError = ref(false);
const encryptionError = ref(false);
const usernameError = ref(false);
const passwordError = ref(false);
const testEmailError = ref(false);

const toast = useToast();

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetch mail configuration data
async function fetchMailConfig() {
    try {
        loading.value = true;
        const response = await MailConfigService.getMailConfig();

        if (response.statusCode === 200 && response.data.data.length > 0) {
            const configData = response.data.data[0];
            currentId.value = configData.id;
            mailConfig.value = {
                driver: configData.driver || '',
                host: configData.host || '',
                port: configData.port || '',
                from_address: configData.from_address || '',
                from_name: configData.from_name || '',
                to: configData.to || '',
                encryption: configData.encryption || '',
                username: configData.username || '',
                password: configData.password || ''
            };
        }

        if (response.data.permissions) {
            permissions.value = response.data.permissions;
        }

        await delay(100);
    } catch (error) {
        console.error('Error fetching mail config:', error);
    } finally {
        loading.value = false;
    }
}

function validateForm() {
    isSubmitted.value = true;
    driverError.value = !mailConfig.value.driver.trim();
    hostError.value = !mailConfig.value.host.trim();
    portError.value = !mailConfig.value.port || mailConfig.value.port <= 0;
    fromAddressError.value = !mailConfig.value.from_address.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mailConfig.value.from_address);
    fromNameError.value = !mailConfig.value.from_name.trim();
    toError.value = !mailConfig.value.to.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mailConfig.value.to);
    encryptionError.value = !mailConfig.value.encryption.trim();
    usernameError.value = !mailConfig.value.username.trim();
    passwordError.value = !mailConfig.value.password.trim();

    return !driverError.value && !hostError.value && !portError.value && !fromAddressError.value && !fromNameError.value && !toError.value && !encryptionError.value && !usernameError.value && !passwordError.value;
}

function validateTestEmail() {
    testEmailError.value = !testEmailAddress.value.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(testEmailAddress.value);
    return !testEmailError.value;
}

function clearError(field) {
    if (isSubmitted.value) {
        if (field === 'driver') driverError.value = false;
        if (field === 'host') hostError.value = false;
        if (field === 'port') portError.value = false;
        if (field === 'from_address') fromAddressError.value = false;
        if (field === 'from_name') fromNameError.value = false;
        if (field === 'to') toError.value = false;
        if (field === 'encryption') encryptionError.value = false;
        if (field === 'username') usernameError.value = false;
        if (field === 'password') passwordError.value = false;
    }
    if (field === 'test_email') testEmailError.value = false;
}

async function saveMailConfig() {
    if (!validateForm()) {
        return;
    }

    try {
        loading.value = true;

        const configData = {
            driver: mailConfig.value.driver,
            host: mailConfig.value.host,
            port: parseInt(mailConfig.value.port),
            from_address: mailConfig.value.from_address,
            from_name: mailConfig.value.from_name,
            to: mailConfig.value.to,
            encryption: mailConfig.value.encryption,
            username: mailConfig.value.username,
            password: mailConfig.value.password
        };

        if (currentId.value) {
            // Update existing config
            await MailConfigService.updateMailConfig(currentId.value, configData);
        }

        // Refresh data after save
        await fetchMailConfig();
    } catch (error) {
        console.error('Error saving mail config:', error);
    } finally {
        loading.value = false;
    }
}

function openTestEmailDialog() {
    testEmailAddress.value = '';
    testEmailError.value = false;
    showTestEmailDialog.value = true;
}

function closeTestEmailDialog() {
    showTestEmailDialog.value = false;
    testEmailAddress.value = '';
    testEmailError.value = false;
}

async function sendTestEmail() {
    if (!validateTestEmail()) {
        return;
    }

    try {
        testEmailLoading.value = true;
        await MailConfigService.sendTestEmail(testEmailAddress.value);

        // Clear the test email field after successful send
        testEmailAddress.value = '';
        closeTestEmailDialog();
    } catch (error) {
        console.error('Error sending test email:', error);
    } finally {
        testEmailLoading.value = false;
    }
}

onMounted(() => {
    fetchMailConfig();
});
</script>

<template>
    <div class="card">
        <h4 class="mb-10">Mail Configuration</h4>
        <div>
            <div class="flex gap-4 mb-5">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Driver<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="mailConfig.driver" placeholder="Enter driver (e.g., smtp)" class="w-full" :class="{ 'p-invalid': driverError }" @input="() => clearError('driver')" />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Host<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="mailConfig.host" placeholder="Enter host (e.g., smtp.gmail.com)" class="w-full" :class="{ 'p-invalid': hostError }" @input="() => clearError('host')" />
                    </template>
                </div>
            </div>

            <div class="flex gap-4 mb-5">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Port<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="mailConfig.port" placeholder="Enter port (e.g., 587)" class="w-full" :class="{ 'p-invalid': portError }" @input="() => clearError('port')" type="number" />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Encryption<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="mailConfig.encryption" placeholder="Enter encryption (e.g., tls)" class="w-full" :class="{ 'p-invalid': encryptionError }" @input="() => clearError('encryption')" />
                    </template>
                </div>
            </div>

            <div class="flex gap-4 mb-5">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">From Address<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="mailConfig.from_address" placeholder="Enter from email address" class="w-full" :class="{ 'p-invalid': fromAddressError }" @input="() => clearError('from_address')" type="email" />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">From Name<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="mailConfig.from_name" placeholder="Enter from name" class="w-full" :class="{ 'p-invalid': fromNameError }" @input="() => clearError('from_name')" />
                    </template>
                </div>
            </div>

            <div class="flex gap-4 mb-5">
                <div class="w-1/2">
                    <label class="font-bold block mb-2">To Address<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="mailConfig.to" placeholder="Enter to email address" class="w-full" :class="{ 'p-invalid': toError }" @input="() => clearError('to')" type="email" />
                    </template>
                </div>
                <div class="w-1/2">
                    <label class="font-bold block mb-2">Username<span class="text-red-500">*</span></label>
                    <template v-if="loading">
                        <Skeleton height="2rem" width="100%" borderRadius="8px" />
                    </template>
                    <template v-else>
                        <InputText v-model="mailConfig.username" placeholder="Enter username" class="w-full" :class="{ 'p-invalid': usernameError }" @input="() => clearError('username')" />
                    </template>
                </div>
            </div>

            <div class="mb-4">
                <label class="font-bold block mb-2">Password<span class="text-red-500">*</span></label>
                <template v-if="loading">
                    <Skeleton height="2rem" width="100%" borderRadius="8px" />
                </template>
                <template v-else>
                    <InputText v-model="mailConfig.password" placeholder="Enter password" class="w-full" :class="{ 'p-invalid': passwordError }" @input="() => clearError('password')" type="password" />
                </template>
            </div>

            <div class="flex justify-end gap-2">
                <template v-if="loading">
                    <Skeleton height="2.5rem" width="120px" borderRadius="8px" />
                </template>
                <template v-else>
                    <Button label="Test Email" icon="pi pi-send" @click="openTestEmailDialog" class="p-button-info" :disabled="loading" />
                    <Button v-if="permissions.can_update" :label="currentId ? 'Update' : 'Save'" icon="pi pi-check" @click="saveMailConfig" :loading="loading" :disabled="loading" />
                </template>
            </div>
        </div>
    </div>

    <!-- Test Email Dialog -->
    <Dialog v-model:visible="showTestEmailDialog" modal header="Test Email Configuration" :style="{ width: '500px' }" :closable="true" :closeOnEscape="true" :closeOnMaskClick="false">
        <div class="p-4">
            <div class="mb-4">
                <label class="font-bold block mb-2">Email Address<span class="text-red-500">*</span></label>
                <InputText v-model="testEmailAddress" placeholder="Enter email address to send test email" class="w-full" :class="{ 'p-invalid': testEmailError }" @input="() => clearError('test_email')" type="email" />
                <small v-if="testEmailError" class="p-error">Please enter a valid email address.</small>
            </div>

            <div class="text-sm text-gray-600 mb-4">
                <p>This will send a test email to verify your mail configuration is working correctly.</p>
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" @click="closeTestEmailDialog" class="p-button-text" :disabled="testEmailLoading" />
                <Button label="Send Test Email" icon="pi pi-send" @click="sendTestEmail" class="p-button-info" :loading="testEmailLoading" :disabled="testEmailLoading" />
            </div>
        </template>
    </Dialog>
</template>

<style scoped>
.hover-image {
    transition: transform 0.3s ease;
}
.hover-image:hover {
    transform: scale(1.05);
}
</style>
