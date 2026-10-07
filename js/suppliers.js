/**
 * CrudeGuard AI - Suppliers Directory Controller
 */

import { CrudeGuardAPI } from './api.js';
import { setupNavigation, formatNumber, formatCurrency, renderRiskBadge, showToast, updateSystemStatusPill } from './utils.js';
import { getDbStatus } from './supabase.js';

let allSuppliers = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();

  try {
    allSuppliers = await CrudeGuardAPI.getSuppliers();
    
    // Update system status
    const dbStatus = getDbStatus();
    updateSystemStatusPill(
      dbStatus.mode === 'live' ? 'Supabase Live' : 'Demo Mode (Offline Safe)',
      dbStatus.mode,
      dbStatus.message
    );

    renderSupplierCards(allSuppliers);
    setupFilters();
  } catch (err) {
    console.error('[Suppliers] Error fetching data:', err);
    showToast('Failed to load supplier directory', 'error');
  }
});

function setupFilters() {
  const searchInput = document.getElementById('supplier-search');
  const regionSelect = document.getElementById('region-filter');
  const riskSelect = document.getElementById('risk-filter');
  const sortSelect = document.getElementById('sort-filter');

  function applyFilters() {
    const q = (searchInput?.value || '').toLowerCase().trim();
    const region = regionSelect?.value || 'all';
    const risk = riskSelect?.value || 'all';
    const sort = sortSelect?.value || 'risk-desc';

    let filtered = allSuppliers.filter(s => {
      const name = (s.name || '').toLowerCase();
      const grade = (s.crude_grade || '').toLowerCase();
      const country = (s.country || '').toLowerCase();
      const reg = s.region || '';
      const rLevel = (s.risk_level || '').toLowerCase();

      const matchSearch = !q || name.includes(q) || grade.includes(q) || country.includes(q);
      const matchRegion = region === 'all' || reg === region;
      const matchRisk = risk === 'all' || rLevel === risk.toLowerCase();
      return matchSearch && matchRegion && matchRisk;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sort === 'risk-desc') return (b.risk_score || 0) - (a.risk_score || 0);
      if (sort === 'risk-asc') return (a.risk_score || 0) - (b.risk_score || 0);
      if (sort === 'volume-desc') return (b.contracted_bpd || 0) - (a.contracted_bpd || 0);
      if (sort === 'cost-asc') return (a.unit_cost_usd || 0) - (b.unit_cost_usd || 0);
      return 0;
    });

    renderSupplierCards(filtered);
  }

  searchInput?.addEventListener('input', applyFilters);
  regionSelect?.addEventListener('change', applyFilters);
  riskSelect?.addEventListener('change', applyFilters);
  sortSelect?.addEventListener('change', applyFilters);
}

function renderSupplierCards(suppliers) {
  const grid = document.getElementById('suppliers-grid');
  const countEl = document.getElementById('supplier-count');
  if (countEl) countEl.textContent = `${suppliers.length} Suppliers Active`;

  if (!grid) return;

  if (suppliers.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
        <p>No suppliers matched your filter criteria.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = suppliers.map(s => {
    const chokepointsHtml = (s.chokepoints && s.chokepoints.length > 0)
      ? s.chokepoints.map(c => `<span class="tag-chokepoint">⚠️ ${c}</span>`).join('')
      : `<span class="tag-safe">✓ Direct Open Sea Route</span>`;

    return `
      <div class="card supplier-card">
        <div class="supplier-card-header">
          <div class="supplier-title-block">
            <h3>${s.name}</h3>
            <span class="supplier-country-badge">${s.country} • ${s.region}</span>
          </div>
          ${renderRiskBadge(s.risk_score)}
        </div>

        <div class="supplier-specs-grid">
          <div class="spec-cell">
            <span class="spec-label">Grade / API</span>
            <span class="spec-value">${s.crude_grade} (${s.api_gravity}°)</span>
          </div>
          <div class="spec-cell">
            <span class="spec-label">Sulfur Content</span>
            <span class="spec-value">${s.sulfur_pct}%</span>
          </div>
          <div class="spec-cell">
            <span class="spec-label">Contracted Flow</span>
            <span class="spec-value">${formatNumber(s.contracted_bpd)} bpd</span>
          </div>
          <div class="spec-cell">
            <span class="spec-label">Landed Unit Cost</span>
            <span class="spec-value">${formatCurrency(s.unit_cost_usd)}/bbl</span>
          </div>
        </div>

        <div class="risk-breakdown-section">
          <div class="risk-breakdown-header">
            <span>Primary Vulnerabilities</span>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${s.transit_days_normal || 20} Days Transit</span>
          </div>
          <div class="chokepoint-tags">
            ${chokepointsHtml}
          </div>
        </div>

        <div class="supplier-card-footer">
          <span style="font-size: 0.78rem; color: var(--text-muted);">
            Reliability: <b style="color: #fff;">${s.reliability_history_pct || 98}%</b>
          </span>
          <div style="display: flex; gap: 0.5rem;">
            <a href="simulator.html?preset=${s.id}" class="btn btn-sm btn-outline" title="Simulate Disruption">Simulate Shock</a>
            <a href="supplier-details.html?id=${s.id}" class="btn btn-sm btn-primary">Risk Intel →</a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
