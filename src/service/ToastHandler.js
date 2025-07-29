let toastInstance = null;
let autoToastEnabled = true; // Flag untuk mengontrol toast otomatis

export function setToastInstance(instance) {
    toastInstance = instance;
}

export function setAutoToast(enabled) {
    autoToastEnabled = enabled;
}

export function showToast({ severity = 'info', summary = '', detail = '', life = 3000 }) {
    if (toastInstance) {
        toastInstance.add({ severity, summary, detail, life });
    } else {
        // fallback: alert
        alert(`${summary}\n${detail}`);
    }
}

// Helper for BE response
export function showResponseToast(response, fallback = 'Operation completed') {
    if (!toastInstance || !autoToastEnabled) return;

    let detail = response?.message || fallback;
    if (Array.isArray(detail)) {
        detail = detail.join(', ');
    }

    if (response?.statusCode === 200 || response?.success) {
        showToast({
            severity: 'success',
            summary: 'Success',
            detail
        });
    } else {
        showToast({
            severity: 'error',
            summary: 'Error',
            detail
        });
    }
}

// Helper untuk menampilkan toast manual (tidak terpengaruh autoToastEnabled)
export function showManualToast(response, fallback = 'Operation completed') {
    if (!toastInstance) return;

    if (response?.statusCode === 200 || response?.success) {
        showToast({
            severity: 'success',
            summary: 'Success',
            detail: response?.message || fallback
        });
    } else {
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: response?.message || fallback
        });
    }
}
