<script setup>
/* === Import === */
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { refreshMenu } from '@/layout/composables/menu';
import AuthService from '@/service/AuthService';
import { useSiteInfoStore } from '@/stores/siteInfoStore';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

/* === Reactive State === */
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMsg = ref('');
const isSubmitted = ref(false);

const emailError = ref(false);
const passwordError = ref(false);

const router = useRouter();
const toast = useToast();

/* === Site Info Store === */
const siteInfoStore = useSiteInfoStore();
const { getLoginImage } = storeToRefs(siteInfoStore);

// Helper untuk bikin URL lengkap dari path relatif (copy dari store)
function buildFullUrl(path) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return path && !path.startsWith('http') ? baseUrl + path : path;
}

/* === Lifecycle === */
onMounted(async () => {
    // Fetch site info jika belum ada
    if (!siteInfoStore.siteInfo) {
        await siteInfoStore.fetchSiteInfo();
    }
});

/* === Validasi Form === */
const validateForm = () => {
    isSubmitted.value = true;
    emailError.value = !email.value.trim();
    passwordError.value = !password.value.trim();
    return !emailError.value && !passwordError.value;
};

/* === Clear Error saat Input === */
const clearEmailError = () => {
    if (isSubmitted.value) emailError.value = false;
};

const clearPasswordError = () => {
    if (isSubmitted.value) passwordError.value = false;
};

/* === Login Logic === */
const handleLogin = async () => {
    if (!validateForm()) {
        toast.add({
            severity: 'error',
            summary: 'Validation Failed',
            detail: 'Please fill in your email and password correctly',
            life: 4000
        });
        return;
    }

    isLoading.value = true;
    errorMsg.value = '';

    try {
        const response = await AuthService.login(email.value, password.value);

        if (response?.statusCode === 200) {
            await refreshMenu();
            router.push('/dashboard/home');
        } else {
            errorMsg.value = Array.isArray(response?.message) ? response.message.join(', ') : response?.message || 'Login Failed';
            // const detail = Array.isArray(response?.message) ? response.message.join(', ') : response?.message || 'Login Failed';
            // toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
            // errorMsg.value = detail;
        }
    } catch (err) {
        errorMsg.value = Array.isArray(res?.message) ? res.message.join(', ') : res?.message || 'Login Failed';
        // const res = err?.response?.data;
        // const detail = Array.isArray(res?.message) ? res.message.join(', ') : res?.message || 'Login Failed';
        // toast.add({ severity: 'error', summary: 'Error', detail, life: 4000 });
        // errorMsg.value = detail;
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
                <!-- <div class="p-[0.1rem] rounded-[56px]" :style="{ background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)' }"> -->
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20 rounded-[53px]">
                    <!-- Logo dan Heading -->
                    <div class="text-center mb-8">
                        <!-- Login Image atau Site Logo sebagai fallback -->
                        <div class="app-logo mb-4">
                            <template v-if="getLoginImage">
                                <img :src="buildFullUrl(getLoginImage)" alt="Site Logo" class="site-logo" />
                            </template>
                        </div>
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Welcome to PrimeLand!</div>
                        <span class="text-muted-color font-medium">Sign in to continue</span>
                    </div>

                    <!-- Form -->
                    <form @submit.prevent="handleLogin">
                        <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"> Email <span class="text-red-500">*</span> </label>
                        <InputText id="email" v-model="email" type="email" placeholder="Email address" class="w-full md:w-[30rem] mb-2" :class="{ 'p-invalid': emailError }" @input="clearEmailError" />

                        <label for="password" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2"> Password <span class="text-red-500">*</span> </label>
                        <Password id="password" v-model="password" placeholder="Password" :toggleMask="true" :feedback="false" class="mb-2" :inputClass="{ 'p-invalid': passwordError }" fluid @input="clearPasswordError" />

                        <div class="flex justify-between items-center mt-2 mb-8">
                            <RouterLink to="/auth/forgot-password" class="ml-1 font-medium text-primary-600 hover:underline">Forgot password?</RouterLink>
                        </div>

                        <Button type="submit" :label="isLoading ? 'Loading...' : 'Sign In'" class="w-full" :disabled="isLoading" />
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye,
.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}

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
