# Sakai Vue Template

A modern Vue.js admin template built with PrimeVue components.

## Features

- **Modern Vue 3 Composition API**
- **PrimeVue Components**
- **Responsive Design**
- **Dark/Light Theme Support**
- **Automatic Toast System**

## Automatic Toast System

This project implements an automatic toast notification system that displays messages based on API responses without requiring manual toast calls in each component.

### How it works:

1. **Axios Interceptor**: All API calls use a configured axios instance with response interceptors
2. **Automatic Toast**: Success/error messages are automatically displayed based on API response status
3. **Global Configuration**: Toast behavior is controlled globally through `ToastHandler.js`

### Usage:

```javascript
// In your service files, use apiClient instead of axios
import { apiClient } from '@/service/config';

const MyService = {
    async getData() {
        const response = await apiClient.get('/api/data');
        return response.data; // Toast will show automatically
    }
};
```

### Toast Control:

```javascript
import { setAutoToast, showManualToast } from '@/service/ToastHandler';

// Disable automatic toast for specific operations
setAutoToast(false);
await someApiCall();
setAutoToast(true); // Re-enable

// Show manual toast (not affected by autoToast setting)
showManualToast(response, 'Custom message');
```

### Response Format:

The system expects API responses in this format:
```javascript
{
    statusCode: 200, // or success: true
    message: "Success message",
    data: { ... }
}
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable components
├── layout/             # Layout components
├── service/            # API services with automatic toast
├── stores/             # Pinia stores
├── views/              # Page components
└── assets/             # Styles and assets
```

## Configuration

- **API Base URL**: Configure in `src/service/config.js`
- **Toast Behavior**: Control in `src/service/ToastHandler.js`
- **Theme**: Customize in `src/assets/layout/`

## License

This project is licensed under the MIT License.
