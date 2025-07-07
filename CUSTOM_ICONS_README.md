# Custom Icons System

Sistem icon custom untuk Sakai Vue yang memungkinkan penggunaan icon SVG custom selain icon PrimeVue.

## Struktur File

```
src/components/icons/
├── DashboardIcon.vue    # Icon dashboard custom
├── HomeIcon.vue         # Icon home custom
└── index.js            # Export semua icon
```

## Cara Menambahkan Icon Baru

### 1. Buat Komponen Icon Baru

Buat file baru di `src/components/icons/`, contoh: `SettingsIcon.vue`

```vue
<template>
    <svg 
        :width="size" 
        :height="size" 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        :class="className"
    >
        <path 
            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" 
            :fill="color"
        />
    </svg>
</template>

<script setup>
defineProps({
    size: {
        type: [String, Number],
        default: 16
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
```

### 2. Export Icon di index.js

```javascript
export { default as DashboardIcon } from './DashboardIcon.vue';
export { default as HomeIcon } from './HomeIcon.vue';
export { default as SettingsIcon } from './SettingsIcon.vue'; // Tambahkan ini
```

### 3. Update Menu Data

Di `src/layout/composables/menu.js`, tambahkan icon baru:

```javascript
{
    label: 'Settings',
    icon: 'settings-icon',
    to: '/settings',
    customIcon: true
}
```

### 4. Update Fungsi renderIcon

Di `AppMenuItem.vue` dan `Breadcrumb.vue`, tambahkan case baru:

```javascript
function renderIcon(item) {
    if (item.customIcon) {
        switch (item.icon) {
            case 'dashboard-icon':
                return DashboardIcon;
            case 'home-icon':
                return HomeIcon;
            case 'settings-icon':  // Tambahkan ini
                return SettingsIcon;
            default:
                return null;
        }
    }
    return null;
}
```

## Penggunaan

Icon custom akan otomatis digunakan ketika:
- `customIcon: true` di data menu
- `icon: 'nama-icon'` sesuai dengan case di fungsi renderIcon

## Keuntungan

1. **Konsisten** - Semua icon menggunakan format yang sama
2. **Scalable** - Mudah menambah icon baru
3. **Customizable** - Bisa mengatur size, color, dan class
4. **Performance** - SVG inline lebih cepat dari font icon 