<!-- C:\Users\sst_i\Downloads\sourcode\template\sakai-vue-master\src\layout\AppTopbar.vue -->
<script setup>
import { useLayout } from '@/layout/composables/layout';
import AuthService from '@/service/AuthService';
import config from '@/service/config';
import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppConfigurator from './AppConfigurator.vue';

const { toggleMenu, toggleDarkMode, isDarkTheme, isTopbarFull } = useLayout();
const router = useRouter();

// Profile dropdown state
const isProfileDropdownOpen = ref(false);
const profileDropdownRef = ref(null);
const profileButtonRef = ref(null);

// Toggle profile dropdown
const toggleProfileDropdown = () => {
    isProfileDropdownOpen.value = !isProfileDropdownOpen.value;
};

// Close profile dropdown when clicking outside
const closeProfileDropdown = () => {
    isProfileDropdownOpen.value = false;
};

// Handle click outside
const handleClickOutside = (event) => {
    if (profileDropdownRef.value && profileButtonRef.value) {
        if (!profileDropdownRef.value.contains(event.target) && !profileButtonRef.value.contains(event.target)) {
            closeProfileDropdown();
        }
    }
};

// Handle profile actions
const handleMyProfile = () => {
    router.push('/myProfile');
    closeProfileDropdown();
};

const handleLogout = async () => {
    try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        await AuthService.logout(token);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        router.push('/auth/login');
    } catch (err) {
        console.error('Logout error:', err);
    }
    closeProfileDropdown();
};

const user = ref(null);
const userPhotoError = ref(false);

onMounted(async () => {
    document.addEventListener('click', handleClickOutside);
    // Ambil data user saat Topbar mount
    try {
        const response = await AuthService.me();
        user.value = response?.data?.user || null;
    } catch (e) {
        user.value = null;
    }
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

function getUserPhotoUrl() {
    if (userPhotoError.value || !user.value?.photo) {
        return '/demo/images/default.jpg';
    }
    // Jika path sudah absolute
    if (user.value.photo.startsWith('http')) {
        return user.value.photo;
    }
    // Jika relative, tambahkan baseURL backend dari config
    return config.API_BASE_URL + user.value.photo;
}

function onUserPhotoError() {
    userPhotoError.value = true;
}
</script>

<template>
    <div class="layout-topbar" :class="{ 'topbar-full': isTopbarFull, 'topbar-expanded': !isTopbarFull }">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
                <i class="pi pi-bars"></i>
            </button>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>
                <div class="relative">
                    <button
                        v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein', leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout', hideOnOutsideClick: true }"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-calendar"></i>
                        <span>Calendar</span>
                    </button>
                    <button type="button" class="layout-topbar-action">
                        <i class="pi pi-inbox"></i>
                        <span>Messages</span>
                    </button>

                    <!-- Profile Dropdown -->
                    <div class="relative" ref="profileDropdownRef">
                        <button ref="profileButtonRef" type="button" class="layout-topbar-action profile-dropdown-trigger" @click="toggleProfileDropdown">
                            <img :src="getUserPhotoUrl()" alt="Profile" class="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm hover:border-blue-300 transition-colors duration-200" @error="onUserPhotoError" />
                        </button>

                        <!-- Profile Dropdown Menu -->
                        <transition
                            enter-active-class="transition ease-out duration-200"
                            enter-from-class="transform opacity-0 scale-95"
                            enter-to-class="transform opacity-100 scale-100"
                            leave-active-class="transition ease-in duration-150"
                            leave-from-class="transform opacity-100 scale-100"
                            leave-to-class="transform opacity-0 scale-95"
                        >
                            <div v-show="isProfileDropdownOpen" class="absolute right-0 mt-2 w-48 py-1 z-50" style="border-radius: var(--content-border-radius)">
                                <button @click="handleMyProfile" class="block w-full text-left px-4 py-3 text-sm flex items-center">
                                    <i class="pi pi-user mr-3"></i>
                                    My Profile
                                </button>
                                <button @click="handleLogout" class="block w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center">
                                    <i class="pi pi-sign-out mr-3"></i>
                                    LogOut
                                </button>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.profile-dropdown-trigger {
    position: relative;
    transition: all var(--element-transition-duration) ease;
}

.profile-dropdown-trigger:hover {
    transform: scale(1.05);
}

.profile-dropdown-trigger:focus {
    outline: none;
    box-shadow: var(--focus-ring-shadow);
}

/* Animation for dropdown */
.layout-topbar-menu .relative {
    position: relative;
}

/* Ensure dropdown appears above other elements */
.z-50 {
    z-index: 50;
}

/* Profile dropdown styling */
.profile-dropdown-trigger + div {
    background: var(--surface-overlay);
    border: 1px solid var(--surface-border);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.profile-dropdown-trigger + div button {
    color: var(--text-color);
    transition: background-color var(--element-transition-duration);
}

.profile-dropdown-trigger + div button:hover {
    background: var(--surface-hover);
}

.profile-dropdown-trigger + div button:last-child:hover {
    background: rgba(239, 68, 68, 0.1);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
    .layout-topbar-menu {
        display: none;
    }
}

/* Dark mode adjustments */
.dark .layout-topbar-action img {
    border-color: var(--surface-border);
}

.dark .profile-dropdown-trigger:hover img {
    border-color: var(--primary-color);
}
</style>
