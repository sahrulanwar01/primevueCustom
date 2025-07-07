import AuthService from '@/service/AuthService'; // Sesuaikan path jika berbeda
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLayout } from './layout';

const originalMenu = [
    {
        label: 'Main',
        icon: 'home-icon',
        customIcon: true,
        items: [
            {
                label: 'Dashboard',
                icon: 'dashboard-icon',
                to: '/dashboard',
                customIcon: true,
                items: [
                    {
                        label: 'Home',
                        icon: 'pi pi-circle-off',
                        to: '/dashboard/home'
                    }
                ]
            },
            {
                label: 'Manage Account',
                icon: 'pi pi-user',
                to: '/user-management',
                items: [
                    {
                        label: 'Role',
                        icon: 'pi pi-circle-off',
                        to: '/user-management/roles'
                    }
                ]
            },
            {
                label: 'Menu Management',
                icon: 'pi pi-fw pi-bars',
                to: '/menu-management',
                items: [
                    {
                        label: 'Menus',
                        icon: 'pi pi-circle-off',
                        to: '/menu-management/menus'
                    },
                    {
                        label: 'Sub Menus',
                        icon: 'pi pi-circle-off',
                        to: '/menu-management/sub-menus'
                    }
                ]
            },
            {
                label: 'Website Settings',
                icon: 'pi pi-globe',
                to: '/website-settings',
                items: [
                    {
                        label: 'Site Info',
                        icon: 'pi pi-circle-off',
                        to: '/website-settings/site-info'
                    }
                ]
            }
        ]
    }
];

const menuData = ref([]);
let refreshTimeout = null;
let lastRefreshTime = 0;
const CACHE_DURATION = 5000; // 5 detik cache

// ⬇️ Filter menu dari backend permission
async function filterMenuBasedOnPermissions() {
    try {
        const response = await AuthService.me();
        const menusFromBackend = response?.data?.menus ?? [];

        const mappedMenu = originalMenu.map((section) => {
            const filteredItems = section.items
                .map((menuItem) => {
                    const backendMenu = menusFromBackend.find((b) => b.name === menuItem.label);
                    if (!backendMenu) return null;

                    if (!menuItem.items) return menuItem;

                    const filteredSubItems = menuItem.items.filter((sub) => {
                        return backendMenu.subMenus?.some((bsub) => bsub.name === sub.label);
                    });

                    if (filteredSubItems.length === 0) return null;

                    return {
                        ...menuItem,
                        items: filteredSubItems
                    };
                })
                .filter(Boolean);

            return {
                ...section,
                items: filteredItems
            };
        });

        menuData.value = mappedMenu;
        lastRefreshTime = Date.now();
    } catch (err) {
        console.error('Gagal load menu dari backend:', err);
        menuData.value = originalMenu; // fallback
    }
}

// ⬇️ Fungsi untuk refresh menu dengan debounce dan cache (dipanggil setelah login)
export async function refreshMenu() {
    const now = Date.now();

    // Skip jika masih dalam cache duration
    if (now - lastRefreshTime < CACHE_DURATION) {
        return;
    }

    // Clear timeout sebelumnya jika ada
    if (refreshTimeout) {
        clearTimeout(refreshTimeout);
    }

    // Set timeout baru untuk debounce
    refreshTimeout = setTimeout(async () => {
        await filterMenuBasedOnPermissions();
    }, 100); // Debounce 100ms
}

// ⬇️ Load menu pertama kali
filterMenuBasedOnPermissions();

export function useMenu() {
    const route = useRoute();
    const { setActiveMenuItem } = useLayout();

    const findMenuItemByPath = (path, items = menuData.value) => {
        for (const item of items) {
            if (item.to === path) {
                return item;
            }
            if (item.items) {
                const found = findMenuItemByPath(path, item.items);
                if (found) return found;
            }
        }
        return null;
    };

    const getBreadcrumbPath = (targetPath, items = menuData.value, currentPath = []) => {
        for (const item of items) {
            const newPath = [...currentPath, item];

            if (item.to === targetPath) {
                return newPath;
            }

            if (item.items) {
                const found = getBreadcrumbPath(targetPath, item.items, newPath);
                if (found) return found;
            }
        }
        return null;
    };

    const findParentMenuKey = (targetPath, items = menuData.value, parentKey = null, index = 0) => {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const currentKey = parentKey ? `${parentKey}-${i}` : String(i);

            if (item.to === targetPath) {
                return parentKey;
            }

            if (item.items) {
                const found = findParentMenuKey(targetPath, item.items, currentKey, 0);
                if (found !== null) return found;
            }
        }
        return null;
    };

    const setActiveMenuFromRoute = () => {
        const currentPath = route.path;
        const menuItem = findMenuItemByPath(currentPath);

        if (menuItem) {
            const parentKey = findParentMenuKey(currentPath);
            if (parentKey) {
                setActiveMenuItem(parentKey);
            } else {
                const itemIndex = menuData.value.findIndex((item) => item.to === currentPath);
                if (itemIndex !== -1) {
                    setActiveMenuItem(String(itemIndex));
                }
            }
        } else {
            const segments = currentPath.split('/').filter((segment) => segment);
            if (segments.length > 0 && segments[0] === 'dashboard') {
                setActiveMenuItem('0');
            }
        }
    };

    watch(
        () => route.path,
        () => {
            setActiveMenuFromRoute();
        },
        { immediate: true }
    );

    const breadcrumbs = computed(() => {
        const path = route.path;
        const breadcrumbPath = getBreadcrumbPath(path);

        if (!breadcrumbPath) {
            const segments = path.split('/').filter((segment) => segment);
            const items = [
                {
                    label: 'Home',
                    to: '/dashboard',
                    icon: 'dashboard-icon',
                    customIcon: true
                }
            ];

            let currentPath = '';
            segments.forEach((segment, index) => {
                currentPath += `/${segment}`;
                const label = segment.charAt(0).toUpperCase() + segment.slice(1);
                items.push({
                    label: label,
                    to: index === segments.length - 1 ? null : currentPath,
                    icon: 'pi pi-fw pi-file'
                });
            });

            return items;
        }

        return breadcrumbPath.filter((item) => item.label !== 'Main');
    });

    return {
        menuData,
        breadcrumbs,
        findMenuItemByPath,
        getBreadcrumbPath,
        setActiveMenuFromRoute,
        refreshMenu
    };
}
