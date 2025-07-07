// C:\Users\sst_i\Downloads\sourcode\template\sakai-vue-master\src\layout\composables\menu.js
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLayout } from './layout';

const menuData = ref([
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
                label: 'User Management',
                icon: 'pi pi-user',
                to: '/user-management',
                items: [
                    {
                        label: 'Roles',
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
                label: 'General Settings',
                icon: 'pi pi-cog',
                to: '/general-settings',
                items: [
                    {
                        label: 'Permissions',
                        icon: 'pi pi-circle-off',
                        to: '/general-settings/permissions'
                    }
                ]
            }
        ]
    }
]);

export function useMenu() {
    const route = useRoute();
    const { setActiveMenuItem } = useLayout();

    // Function to find menu item by path
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

    // Function to get breadcrumb path
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

    // Function to find parent menu key for a given path
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

    // Function to set active menu based on current route
    const setActiveMenuFromRoute = () => {
        const currentPath = route.path;

        // Find if current path matches any menu item
        const menuItem = findMenuItemByPath(currentPath);

        if (menuItem) {
            // Find parent menu key to open the dropdown
            const parentKey = findParentMenuKey(currentPath);

            if (parentKey) {
                // Set the parent menu as active to open the dropdown
                setActiveMenuItem(parentKey);
            } else {
                // Direct menu item, set it as active
                const itemIndex = menuData.value.findIndex((item) => item.to === currentPath);
                if (itemIndex !== -1) {
                    setActiveMenuItem(String(itemIndex));
                }
            }
        } else {
            // If no exact match, try to find partial matches for nested routes
            const segments = currentPath.split('/').filter((segment) => segment);
            if (segments.length > 0) {
                // Try to match with dashboard routes
                if (segments[0] === 'dashboard') {
                    setActiveMenuItem('0'); // Dashboard is at index 0
                }
            }
        }
    };

    // Watch for route changes and update active menu
    watch(
        () => route.path,
        () => {
            setActiveMenuFromRoute();
        },
        { immediate: true }
    );

    // Computed breadcrumbs
    const breadcrumbs = computed(() => {
        const path = route.path;
        const breadcrumbPath = getBreadcrumbPath(path);

        if (!breadcrumbPath) {
            // Fallback for routes not in menu
            const segments = path.split('/').filter((segment) => segment);
            const items = [];

            // Always start with Home
            items.push({
                label: 'Home',
                to: '/dashboard',
                icon: 'dashboard-icon',
                customIcon: true
            });

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

        // Filter out "Main" from breadcrumb path
        return breadcrumbPath.filter((item) => item.label !== 'Main');
    });

    return {
        menuData,
        breadcrumbs,
        findMenuItemByPath,
        getBreadcrumbPath,
        setActiveMenuFromRoute
    };
}
