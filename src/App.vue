<script setup>
import { setToastInstance } from '@/service/ToastHandler';
import { onMounted, ref } from 'vue';

const toastRef = ref();

onMounted(() => {
    if (toastRef.value) {
        setToastInstance(toastRef.value);
    }
});
</script>

<template>
    <router-view />
    <Toast ref="toastRef" />
</template>

<style scoped></style>
