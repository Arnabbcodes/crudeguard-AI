/**
 * CrudeGuard AI - Supplier Details & Deep Risk Intelligence
 */

import { CrudeGuardAPI } from './api.js';
import { setupNavigation, formatNumber, formatCurrency, renderRiskBadge, showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();

  const urlParams = new URLSearchParams(window.location.search);
  const supplierId = urlParams.get('id') || 'sup-01';

  try {
    const [targetSupplier, allSuppliers] = await Promise.all([
      CrudeGuardAPI.getSupplierById(supplierId),
      CrudeGuardAPI.getSuppliers()
    ]);

    const supplier = targetSupplier || allSuppliers[0];

    if (!supplier) {
      showToast('Supplier data currently unavailable', 'error');
      return;
    }

    renderSupplierDetails(supplier, allSuppliers);
  } catch (err) {
    console.error('[Supplier Details] Error:', err);
    showToast('Failed to load supplier details', 'error');
  }
});

function renderSupplierDetails(s, allSuppliers) {
  // Title & Header
  const titleEl = document.getElementById('supplier-name');
  if (titleEl) titleEl.textContent = s.name;

  const subEl = document.getElementById('supplier-sub');
  if (subEl) subEl.textContent = `${s.country} • ${s.region} • Port of ${s.origin_port || 'Export Terminal'}`;

  const badgeEl = document.getElementById('supplier-risk-badge');
  if (badgeEl) badgeEl.innerHTML = renderRiskBadge(s.risk_score);

  // Quick Stats
  const volEl = document.getElementById('stat-volume');
  if (volEl) volEl.textContent = `${formatNumber(s.contracted_bpd)} bpd`;

  const costEl = document.getElementById('stat-cost');
  if (costEl) costEl.textContent = `${formatCurrency(s.unit_cost_usd)}/bbl`;

  const transitEl = document.getElementById('stat-transit');
  if (transitEl) transitEl.textContent = `${s.transit_days_normal || 20} Days`;

  const relEl = document.getElementById('stat-reliability');
  if (relEl) relEl.textContent = `${s.reliability_history_pct || 98.5}%`;

  // Specs Sheet
  const specList = document.getElementById('spec-sheet-list');
  if (specList) {
    specList.innerHTML = `
      <div class="spec-sheet-row">
        <span class="spec-label">Crude Grade</span>
        <span class="spec-value">${s.crude_grade}</span>
      </div>
      <div class="spec-sheet-row">
        <span class="spec-label">API Gravity</span>
        <span class="spec-value">${s.api_gravity}° (${s.api_gravity > 35 ? 'Light' : s.api_gravity > 30 ? 'Medium' : 'Heavy'})</span>
      </div>
      <div class="spec-sheet-row">
        <span class="spec-label">Sulfur Content</span>
        <span class="spec-value">${s.sulfur_pct}% (${s.sulfur_pct < 0.5 ? 'Sweet' : 'Sour'})</span>
      </div>
      <div class="spec-sheet-row">
        <span class="spec-label">Contract Modality</span>
        <span class="spec-value">${s.contract_type || 'Term Contract'}</span>
      </div>
      <div class="spec-sheet-row">
        <span class="spec-label">Procurement Flexibility</span>
        <span class="spec-value">${s.flexibility_rating || 'Medium'}</span>
      </div>
      <div class="spec-sheet-row">
        <span class="spec-label">Primary Route</span>
        <span class="spec-value" style="font-size: 0.8rem; text-align: right; max-width: 60%;">${s.primary_route || 'Standard Maritime Corridor'}</span>
      </div>
    `;
  }

  // Risk Factors Progress Bars
  const rf = s.risk_factors || { geopolitical: 50, maritime_chokepoint: 50, operational: 30, financial_sovereign: 20 };
  const factorsContainer = document.getElementById('risk-factors-container');
  if (factorsContainer) {
    const factorList = [
      { label: 'Geopolitical Instability', score: rf.geopolitical },
      { label: 'Maritime Chokepoint Exposure', score: rf.maritime_chokepoint },
      { label: 'Operational & Weather Risk', score: rf.operational },
      { label: 'Financial & Sovereign Stability', score: rf.financial_sovereign }
    ];

    factorsContainer.innerHTML = factorList.map(f => {
      const color = f.score >= 70 ? 'var(--risk-critical)' :
                    f.score >= 50 ? 'var(--risk-high)' :
                    f.score >= 30 ? 'var(--risk-medium)' : 'var(--risk-low)';
      return `
        <div style="margin-bottom: 0.85rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 0.3rem;">
            <span>${f.label}</span>
            <span style="font-family: var(--font-mono); color: ${color}; font-weight: 600;">${f.score}/100</span>
          </div>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${f.score}%; background: ${color};"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Chokepoints Tag Cloud
  const chkContainer = document.getElementById('supplier-chokepoints');
  if (chkContainer) {
    if (s.chokepoints && s.chokepoints.length > 0) {
      chkContainer.innerHTML = s.chokepoints.map(c => `
        <div style="padding: 0.85rem; background: rgba(255, 77, 109, 0.08); border: 1px solid rgba(255, 77, 109, 0.25); border-radius: var(--radius-md); margin-bottom: 0.6rem;">
          <strong style="color: var(--risk-critical); display: flex; align-items: center; gap: 0.4rem;">
            ⚠️ ${c}
          </strong>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Tankers lifting from ${s.origin_port} must navigate this strategic bottleneck. High susceptibility to hostile drone interdiction and closure risks.
          </p>
        </div>
      `).join('');
    } else {
      chkContainer.innerHTML = `
        <div style="padding: 0.85rem; background: rgba(6, 214, 160, 0.08); border: 1px solid rgba(6, 214, 160, 0.25); border-radius: var(--radius-md);">
          <strong style="color: var(--risk-low);">✓ Zero Strategic Chokepoint Vulnerabilities</strong>
          <p style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Vessels enjoy uninterrupted deepwater or coastal transit to Rotterdam. Low vulnerability to maritime closures.
          </p>
        </div>
      `;
    }
  }

  // Pre-calculated Substitutes
  const subContainer = document.getElementById('substitutes-table-body');
  if (subContainer) {
    const substitutes = allSuppliers.filter(other => (s.alternative_substitute_ids || []).includes(other.id));
    if (substitutes.length > 0) {
      subContainer.innerHTML = substitutes.map(sub => `
        <tr>
          <td>
            <strong>${sub.name}</strong><br>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${sub.crude_grade} (${sub.country})</span>
          </td>
          <td>${sub.api_gravity}° / ${sub.sulfur_pct}%</td>
          <td>${formatCurrency(sub.unit_cost_usd)}</td>
          <td>${sub.transit_days_normal}d</td>
          <td>${renderRiskBadge(sub.risk_score)}</td>
          <td>
            <a href="supplier-details.html?id=${sub.id}" class="btn btn-sm btn-outline">Analyze</a>
          </td>
        </tr>
      `).join('');
    } else {
      subContainer.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No pre-mapped substitutes.</td></tr>`;
    }
  }

  // Wire Simulate Outage Action Button
  const simBtn = document.getElementById('btn-simulate-outage');
  if (simBtn) {
    simBtn.href = `simulator.html?supplierId=${s.id}`;
  }
}
