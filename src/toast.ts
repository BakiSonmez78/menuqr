// ============================================
// Toast Notification System
// ============================================

let container: HTMLElement | null = null;

function ensureContainer(): HTMLElement {
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000): void {
    const c = ensureContainer();

    const icons: Record<string, string> = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;

    c.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
