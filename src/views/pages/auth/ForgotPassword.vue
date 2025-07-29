<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import AuthService from '@/service/AuthService';
import { useSiteInfoStore } from '@/stores/siteInfoStore';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

const email = ref('');
const isLoading = ref(false);
const isSubmitted = ref(false);
const emailError = ref(false);
const successMsg = ref('');
const errorMsg = ref('');

const toast = useToast();

const siteInfoStore = useSiteInfoStore();
const { getSiteLogo } = storeToRefs(siteInfoStore);

function buildFullUrl(path) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return path && !path.startsWith('http') ? baseUrl + path : path;
}

onMounted(async () => {
    if (!siteInfoStore.siteInfo) {
        await siteInfoStore.fetchSiteInfo();
    }
});

const validateForm = () => {
    isSubmitted.value = true;
    emailError.value = !email.value.trim();
    return !emailError.value;
};

const clearEmailError = () => {
    if (isSubmitted.value) emailError.value = false;
};

const handleForgotPassword = async () => {
    if (!validateForm()) {
        toast.add({
            severity: 'error',
            summary: 'Validation Failed',
            detail: 'Please enter your email address',
            life: 4000
        });
        return;
    }
    isLoading.value = true;
    try {
        await AuthService.forgotPassword(email.value);
        // Tidak perlu set pesan, toast sudah otomatis dari backend
    } catch (err) {
        // Tidak perlu set errorMsg, toast sudah otomatis dari backend
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen w-screen overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div class="p-[0.1rem] rounded-[56px]" :style="{ background: 'linear-gradient(180deg, var(--primary-color) 5%, rgba(33, 150, 243, 0) 30%)' }">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 rounded-[53px]">
                    <div class="text-center mb-8">
                        <div class="app-logo mb-4">
                            <template v-if="getSiteLogo">
                                <img :src="buildFullUrl(getSiteLogo)" alt="Site Logo" class="site-logo" />
                            </template>
                        </div>
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Forgot Password</div>
                        <span class="text-muted-color font-medium">Enter your email to reset your password</span>
                    </div>
                    <div>
                        <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"> Email <span class="text-red-500">*</span> </label>
                        <InputText id="email" v-model="email" type="email" placeholder="Email address" class="w-full md:w-[30rem] mb-2" :class="{ 'p-invalid': emailError }" @input="clearEmailError" />
                        <div class="flex justify-between items-center mb-2">
                            <RouterLink to="/auth/login" class="ml-1 font-medium text-primary-600 hover:underline">Back to Login</RouterLink>
                        </div>
                        <Button :label="isLoading ? 'Loading...' : 'Send Reset Link'" class="w-full mt-4" @click="handleForgotPassword" :disabled="isLoading" />
                        <!-- Pesan sukses/error dihapus, toast otomatis -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.app-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1rem 0;
}
.site-logo {
    width: 100%;
    max-width: 120px;
    max-height: 60px;
    height: auto;
    object-fit: contain;
    display: block;
}
@media (max-width: 600px) {
    .site-logo {
        max-width: 100px;
        max-height: 50px;
    }
}
</style>
