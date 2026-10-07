/**
 * CrudeGuard AI - Utility Functions & UI Helpers
 */

/**
 * Format number with comma separators
 */
export function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format USD Currency
 */
export function formatCurrency(amount, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0.00';
  return '$' + Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format Barrels per day
 */
export function formatBpd(barrels) {
  if (barrels === null || barrels === undefined || isNaN(barrels)) return '0 bpd';
  return `${formatNumber(barrels)} bpd`;
}

/**
 * Format percentage
 */
export function formatPercent(val, decimals = 1) {
  if (val === null || val === undefined || isNaN(val)) return '0%';
  return `${Number(val).toFixed(decimals)}%`;
}

/**
 * Format ISO date string into human readable format
 */
export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

/**
 * Get human friendly relative time
 */
export function timeAgo(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  } catch {
    return '';
  }
}

/**
 * Determine risk level and color based on score (0-100)
 */
export function getRiskLevel(score) {
  const num = Number(score) || 0;
  if (num >= 75) return { label: 'Critical', class: 'badge-critical', color: 'var(--risk-critical)' };
  if (num >= 50) return { label: 'High', class: 'badge-high', color: 'var(--risk-high)' };
  if (num >= 30) return { label: 'Medium', class: 'badge-medium', color: 'var(--risk-medium)' };
  return { label: 'Low', class: 'badge-low', color: 'var(--risk-low)' };
}

/**
 * Render a styled HTML risk badge
 */
export function renderRiskBadge(scoreOrLevel) {
  if (typeof scoreOrLevel === 'number') {
    const level = getRiskLevel(scoreOrLevel);
    return `<span class="badge ${level.class}">${level.label} (${scoreOrLevel})</span>`;
  }
  const str = String(scoreOrLevel || 'Low').toLowerCase();
  if (str === 'critical') return `<span class="badge badge-critical">Critical</span>`;
  if (str === 'high') return `<span class="badge badge-high">High</span>`;
  if (str === 'medium') return `<span class="badge badge-medium">Medium</span>`;
  return `<span class="badge badge-low">Low</span>`;
}

/**
 * Toast Notification System
 */
export function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✓' :
               type === 'error' ? '✕' :
               type === 'warning' ? '⚠' : 'ℹ';

  toast.innerHTML = `
    <span style="font-weight: bold; font-size: 1.1rem;">${icon}</span>
    <span style="flex: 1;">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

/**
 * Modal helpers
 */
export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Download JSON data as file
 */
export function downloadJSON(data, filename = 'crudeguard-export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Update system status pill in navbar
 */
export function updateSystemStatusPill(label, mode = 'demo', tooltip = '') {
  const pill = document.getElementById('db-status-pill');
  if (pill) {
    const dotClass = mode === 'live' ? '' : mode === 'critical' ? 'critical' : 'warning';
    pill.innerHTML = `
      <span class="status-dot ${dotClass}"></span>
      <span>${label}</span>
    `;
    if (tooltip) pill.title = tooltip;
  }
}

/**
 * Initialize Navbar active indicator and system status pill
 */
export function setupNavigation() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}
