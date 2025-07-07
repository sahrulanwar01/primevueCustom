<template>
    <nav class="breadcrumb-container" v-if="breadcrumbs.length > 0">
        <ol class="breadcrumb">
            <li v-for="(breadcrumb, index) in breadcrumbs" :key="index" class="breadcrumb-item">
                <span class="breadcrumb-text">
                    <component v-if="breadcrumb.customIcon" :is="renderIcon(breadcrumb)" class="breadcrumb-icon" :size="15" />
                    <i v-else-if="breadcrumb.icon" :class="breadcrumb.icon" class="breadcrumb-icon"></i>
                    {{ breadcrumb.label }}
                </span>
                <i v-if="index < breadcrumbs.length - 1" class="pi pi-chevron-right breadcrumb-separator"></i>
            </li>
        </ol>
    </nav>
</template>

<script setup>
import { DashboardIcon, HomeIcon } from '@/components/icons';
import { useMenu } from '@/layout/composables/menu';

const { breadcrumbs } = useMenu();

// Function to render icon
function renderIcon(breadcrumb) {
    if (breadcrumb.customIcon) {
        switch (breadcrumb.icon) {
            case 'dashboard-icon':
                return DashboardIcon;
            case 'home-icon':
                return HomeIcon;
            default:
                return null;
        }
    }
    return null;
}
</script>

<style lang="scss" scoped>
.breadcrumb-container {
    margin-bottom: 2rem;
}

.breadcrumb {
    display: flex;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 0.875rem;
    flex-wrap: wrap;
}

.breadcrumb-item {
    display: flex;
    align-items: center;
    color: var(--text-color-secondary);
}

.breadcrumb-text {
    display: flex;
    align-items: center;
    color: var(--text-color);
    font-weight: 500;
}

.breadcrumb-icon {
    margin-right: 0.5rem;
    font-size: 0.75rem;
}

.breadcrumb-separator {
    margin: 0 0.5rem;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
}

@media (max-width: 768px) {
    .breadcrumb-container {
        padding: 0.5rem 1rem;
    }

    .breadcrumb {
        font-size: 0.8rem;
    }

    .breadcrumb-icon {
        margin-right: 0.25rem;
    }

    .breadcrumb-separator {
        margin: 0 0.25rem;
    }
}
</style>
