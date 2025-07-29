<script setup>
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import AuthService from '@/service/AuthService';
import { useSiteInfoStore } from '@/stores/siteInfoStore';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const isSubmitted = ref(false);
const passwordError = ref(false);
const confirmPasswordError = ref(false);

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

const token = route.query.token || '';

const validateForm = () => {
    isSubmitted.value = true;
    passwordError.value = !password.value.trim();
    confirmPasswordError.value = !confirmPassword.value.trim() || password.value !== confirmPassword.value;
    return !passwordError.value && !confirmPasswordError.value;
};

const clearPasswordError = () => {
    if (isSubmitted.value) passwordError.value = false;
};
const clearConfirmPasswordError = () => {
    if (isSubmitted.value) confirmPasswordError.value = false;
};

const handleResetPassword = async () => {
    if (!validateForm()) {
        toast.add({
            severity: 'error',
            summary: 'Validation Failed',
            detail: 'Please fill all fields correctly',
            life: 4000
        });
        return;
    }
    isLoading.value = true;
    try {
        await AuthService.resetPassword(token, password.value);
        // Toast sukses otomatis dari backend
        // Redirect ke login setelah sukses
        setTimeout(() => {
            router.push('/auth/login');
        }, 2000);
    } catch (err) {
        // Toast error otomatis dari backend
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
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Reset Password</div>
                        <span class="text-muted-color font-medium">Enter your new password below</span>
                    </div>
                    <div>
                        <label for="password" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">New Password <span class="text-red-500">*</span></label>
                        <Password id="password" v-model="password" placeholder="New password" :toggleMask="true" :feedback="false" class="w-full md:w-[30rem] mb-2" :inputClass="{ 'p-invalid': passwordError }" fluid @input="clearPasswordError" />
                        <label for="confirmPassword" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2 mt-4">Confirm Password <span class="text-red-500">*</span></label>
                        <Password
                            id="confirmPassword"
                            v-model="confirmPassword"
                            placeholder="Confirm password"
                            :toggleMask="true"
                            :feedback="false"
                            class="w-full md:w-[30rem] mb-2"
                            :inputClass="{ 'p-invalid': confirmPasswordError }"
                            fluid
                            @input="clearConfirmPasswordError"
                        />
                        <Button :label="isLoading ? 'Loading...' : 'Reset Password'" class="w-full mt-4" @click="handleResetPassword" :disabled="isLoading" />
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
