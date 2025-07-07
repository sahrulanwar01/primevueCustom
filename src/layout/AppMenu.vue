<!-- C:\Users\sst_i\Downloads\sourcode\template\sakai-vue-master\src\layout\AppMenu.vue -->
<script setup>
import { useSiteInfoStore } from '@/stores/siteInfoStore';
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import AppMenuItem from './AppMenuItem.vue';
import { useMenu } from './composables/menu';

const { menuData: model, refreshMenu } = useMenu();
const siteInfoStore = useSiteInfoStore();
const { getSiteLogo } = storeToRefs(siteInfoStore);

// ⬇️ Refresh menu saat komponen dimuat
onMounted(async () => {
    await refreshMenu();
});

// Helper untuk bikin URL lengkap dari path relatif (copy dari store)
function buildFullUrl(path) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    return path && !path.startsWith('http') ? baseUrl + path : path;
}
</script>

<template>
    <div class="layout-sidebar">
        <div class="app-logo">
            <template v-if="getSiteLogo">
                <img :src="buildFullUrl(getSiteLogo)" alt="Site Logo" class="site-logo" />
            </template>
        </div>

        <div class="scrollable-menu">
            <ul class="layout-menu">
                <template v-for="(item, i) in model" :key="item">
                    <app-menu-item v-if="!item.separator" :item="item" :index="i"></app-menu-item>
                    <li v-if="item.separator" class="menu-separator"></li>
                </template>
            </ul>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.app-logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem 0 1rem 0;
    min-height: 80px;
}

.site-logo {
    width: 100%;
    max-width: 100px;
    max-height: 40px;
    height: auto;
    object-fit: contain;
    display: block;
}

@media (max-width: 600px) {
    .app-logo {
        padding: 1rem 0 0.5rem 0;
    }
    .site-logo {
        max-width: 100px;
        max-height: 40px;
    }
}
</style>
