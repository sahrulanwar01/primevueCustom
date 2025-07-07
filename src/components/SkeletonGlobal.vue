<template>
    <div>
        <slot name="header"></slot>
        <div>
            <div v-for="row in rows" :key="row" class="flex gap-3 mb-2">
                <Skeleton v-for="col in cols" :key="col" height="2rem" width="100%" class="flex-1" borderRadius="8px" />
            </div>
        </div>
    </div>
</template>

<script setup>
import Skeleton from 'primevue/skeleton';
const props = defineProps({
    rows: { type: Number, default: 5 },
    cols: { type: Number, default: 7 }
});
</script>
