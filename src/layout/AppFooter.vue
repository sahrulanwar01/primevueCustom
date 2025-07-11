<script setup>
import { useSiteInfoStore } from '@/stores/siteInfoStore';
import { storeToRefs } from 'pinia';
import { computed, onMounted } from 'vue';

const siteInfoStore = useSiteInfoStore();
const { getSiteName } = storeToRefs(siteInfoStore);

onMounted(() => {
    if (!siteInfoStore.siteInfo) {
        siteInfoStore.fetchSiteInfo();
    }
});

const currentYear = new Date().getFullYear();
const copyrightText = computed(() => {
    return `© ${currentYear} ${getSiteName.value || ''}`;
});
</script>

<template>
    <div class="layout-footer">
        <span>{{ copyrightText }}</span>
    </div>
</template>
