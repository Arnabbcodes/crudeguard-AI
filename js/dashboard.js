/**
 * CrudeGuard AI - Dashboard Controller
 */

import { CrudeGuardAPI } from './api.js';
import { setupNavigation, formatNumber, formatBpd, renderRiskBadge, timeAgo, showToast, updateSystemStatusPill } from './utils.js';
import { CrudeMap } from './map.js';
import { CrudeCharts } from './charts.js';
import { getDbStatus } from './supabase.js';
import { APP_CONFIG } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();

  try {
    const [suppliers, chokepoints, events] = await Promise.all([
      CrudeGuardAPI.getSuppliers(),
      CrudeGuardAPI.getChokepoints(),
      CrudeGuardAPI.getEvents()
    ]);

    // Update database status indicator
    const dbStatus = getDbStatus();
    updateSystemStatusPill(
      dbStatus.mode === 'live' ? 'Supabase Live' : 'Demo Mode (Offline Safe)',
      dbStatus.mode,
      dbStatus.message
    );

    renderKPIs(suppliers, events);
    renderSupplierExposure(suppliers);
    renderAlertsFeed(events);

    // Initialize Leaflet Map
    CrudeMap.init('dashboard-map', suppliers, chokepoints, APP_CONFIG.refinery);

    // Initialize Chart
    CrudeCharts.createRiskRadar('risk-radar-chart', suppliers);

  } catch (err) {
    console.error('[Dashboard] Error initializing:', err);
    showToast('Failed to load real-time analytics data', 'error');
  }
});

function renderKPIs(suppliers, events) {
  const totalBpd = suppliers.reduce((sum, s) => sum + (s.contracted_bpd || 0), 0);
  const avgRisk = Math.round(suppliers.reduce((sum, s) => sum + (s.risk_score || 0), 0) / (suppliers.length || 1));
  
  // Calculate exposed volume (suppliers with risk >= 50 or traversing active chokepoints)
  const exposedBpd = suppliers
    .filter(s => (s.risk_score >= 50) || (s.chokepoints && s.chokepoints.includes('Strait of Hormuz')))
    .reduce((sum, s) => sum + (s.contracted_bpd || 0), 0);

  const activeAlerts = events.filter(e => e.status === 'Active').length;

  const totalBpdEl = document.getElementById('kpi-total-bpd');
  if (totalBpdEl) totalBpdEl.textContent = formatNumber(totalBpd);

  const avgRiskEl = document.getElementById('kpi-avg-risk');
  if (avgRiskEl) {
    avgRiskEl.textContent = `${avgRisk}/100`;
    avgRiskEl.style.color = avgRisk > 50 ? 'var(--risk-critical)' : 'var(--risk-low)';
  }

  const exposedBpdEl = document.getElementById('kpi-exposed-bpd');
  if (exposedBpdEl) {
    exposedBpdEl.textContent = formatNumber(exposedBpd);
    const pct = Math.round((exposedBpd / (totalBpd || 1)) * 100);
    const sub = document.getElementById('kpi-exposed-sub');
    if (sub) sub.textContent = `${pct}% of total daily refinery intake`;
  }

  const activeAlertsEl = document.getElementById('kpi-active-alerts');
  if (activeAlertsEl) activeAlertsEl.textContent = activeAlerts;
}

function renderSupplierExposure(suppliers) {
  const container = document.getElementById('supplier-exposure-list');
  if (!container) return;

  const totalBpd = suppliers.reduce((sum, s) => sum + (s.contracted_bpd || 0), 0) || 1;

  container.innerHTML = suppliers.map(s => {
    const sharePct = Math.round(((s.contracted_bpd || 0) / totalBpd) * 100);
    const riskColor = s.risk_score >= 75 ? 'var(--risk-critical)' :
                      s.risk_score >= 50 ? 'var(--risk-high)' :
                      s.risk_score >= 30 ? 'var(--risk-medium)' : 'var(--risk-low)';

    return `
      <div class="supplier-exposure-row">
        <div class="supplier-info-block">
          <a href="supplier-details.html?id=${s.id}" class="supplier-name-bold">${s.name}</a>
          <span class="supplier-grade-sub">${s.crude_grade} • ${s.region}</span>
        </div>
        <div class="exposure-bar-col">
          <div class="exposure-val-label">
            <span>${formatNumber(s.contracted_bpd)} bpd</span>
            <span style="color: ${riskColor}; font-weight: 600;">${s.risk_score}</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${sharePct}%; background: ${riskColor};"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderAlertsFeed(events) {
  const container = document.getElementById('dashboard-alerts-list');
  if (!container) return;

  container.innerHTML = events.map(e => {
    const sevClass = (e.severity || 'low').toLowerCase();
    return `
      <div class="alert-item ${sevClass}" onclick="window.location.href='events.html'">
        <div class="alert-item-header">
          <span class="alert-item-title">${e.title}</span>
          <span class="alert-item-time">${timeAgo(e.date)}</span>
        </div>
        <div class="alert-item-body">${e.headline}</div>
        <div class="alert-item-footer">
          <span>Impact: <b>${formatBpd(e.estimated_flow_impact_bpd)}</b></span>
          ${renderRiskBadge(e.severity)}
        </div>
      </div>
    `;
  }).join('');
}
