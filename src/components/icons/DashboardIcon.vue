<template>
    <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" :class="className" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <!-- Bentuk grid 4 blok, gaya modern -->
        <rect x="3" y="3" width="7" height="7" :fill="color" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" :fill="color" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" :fill="color" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" :fill="color" rx="1.5" />
    </svg>
</template>

<script setup>
defineProps({
    size: {
        type: [String, Number],
        default: 20
    },
    color: {
        type: String,
        default: 'currentColor'
    },
    className: {
        type: String,
        default: ''
    }
});
</script>
