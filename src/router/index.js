import AppLayout from '@/layout/AppLayout.vue';
import { refreshMenu } from '@/layout/composables/menu';
import AuthService from '@/service/AuthService';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/dashboard/home'
        },
        {
            path: '/dashboard',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'home',
                    name: 'dashboard-home',
                    component: () => import('@/views/dashboard/Home.vue'),
                    meta: { requiresAuth: true }
                }
            ]
        },
        {
            path: '/landing',
            name: 'landing',
            component: () => import('@/views/pages/Landing.vue')
        },
        {
            path: '/pages/empty',
            name: 'empty',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    component: () => import('@/views/pages/Empty.vue')
                }
            ]
        },
        {
            path: '/pages/crud',
            name: 'crud',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    component: () => import('@/views/pages/Crud.vue')
                }
            ]
        },
        {
            path: '/myProfile',
            name: 'myProfile',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: '',
                    component: () => import('@/views/pages/MyProfile.vue')
                }
            ]
        },
        {
            path: '/pages/notfound',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/auth/access',
            name: 'accessDenied',
            component: () => import('@/views/pages/auth/Access.vue')
        },
        {
            path: '/auth/error',
            name: 'error',
            component: () => import('@/views/pages/auth/Error.vue')
        },
        {
            path: '/user-management',
            name: 'user-management',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: 'roles',
                    name: 'roles',
                    component: () => import('@/views/userManagement/roles.vue'),
                    meta: { requiresAuth: true }
                }
            ]
        },
        {
            path: '/menu-management',
            name: 'menu-management',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: 'menus',
                    name: 'menu-management-menus',
                    component: () => import('@/views/menuManagement/Menus.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'sub-menus',
                    name: 'menu-management-submenus',
                    component: () => import('@/views/menuManagement/SubMenus.vue'),
                    meta: { requiresAuth: true }
                }
            ]
        },
        // Website Settings
        {
            path: '/website-settings',
            name: 'website-settings',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: 'site-info',
                    name: 'website-settings-site-info',
                    component: () => import('@/views/websiteSettings/SiteInfo.vue'),
                    meta: { requiresAuth: true }
                }
            ]
        },
        // General Settings
        {
            path: '/general-settings',
            name: 'general-settings',
            component: AppLayout,
            meta: { requiresAuth: true },
            children: [
                {
                    path: 'permissions',
                    name: 'general-settings-permissions',
                    component: () => import('@/views/generalSettings/permissions.vue'),
                    meta: { requiresAuth: true }
                },
                {
                    path: 'role-permissions',
                    name: 'general-settings-role-permissions',
                    component: () => import('@/views/generalSettings/rolePermissions.vue'),
                    meta: { requiresAuth: true }
                }
            ]
        }
    ]
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
    if (to.matched.some((record) => record.meta.requiresAuth)) {
        try {
            const isLoggedIn = await AuthService.me();
            if (!isLoggedIn) {
                next({ path: '/auth/login' });
            } else {
                await refreshMenu();
                next();
            }
        } catch (e) {
            next({ path: '/auth/login' });
        }
    } else {
        next();
    }
});

export default router;
