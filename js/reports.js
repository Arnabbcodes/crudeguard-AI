/**
 * CrudeGuard AI - Executive Reports & Dossier Controller
 */

import { CrudeGuardAPI } from './api.js';
import { setupNavigation, formatNumber, formatCurrency, formatBpd, formatDate, downloadJSON, showToast } from './utils.js';

let activeReport = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();

  // Load payload from session or generate executive sample
  const payloadStr = sessionStorage.getItem('report_payload');
  if (payloadStr) {
    try {
      activeReport = JSON.parse(payloadStr);
    } catch {
      activeReport = null;
    }
  }

  if (!activeReport) {
    activeReport = {
      title: 'Crude Supply Disruption Response Briefing',
      refinery: 'Rotterdam Gateway Energy Complex',
      simulation: {
        dailyDeficitBpd: 85000,
        totalBarrelsLost: 2550000,
        refineryUtilizationDropPct: 21.5,
        projectedCostIncreaseUsd: 38250000
      },
      strategy: {
        strategy_name: 'Balanced Resilience (AI Recommended)',
        coverage_pct: 100,
        metrics: {
          weighted_avg_landed_cost: 81.60,
          blended_api: 32.9,
          blended_sulfur_pct: 0.63,
          composite_residual_risk: 21,
          execution_lead_time_days: 3.5
        },
        reallocations: [
          { name: 'Equinor (Johan Sverdrup)', incremental_bpd: 40000, unit_cost_usd: 80.50, additional_cost_usd: 3220000, transit_days: 3 },
          { name: 'Petrobras (Tupi)', incremental_bpd: 30000, unit_cost_usd: 82.30, additional_cost_usd: 2469000, transit_days: 16 },
          { name: 'BP / Shell (Forties Blend)', incremental_bpd: 15000, unit_cost_usd: 83.10, additional_cost_usd: 1246500, transit_days: 2 }
        ]
      },
      explanation: `### Executive Supply Risk Assessment
The active disruption scenario exposes our Rotterdam complex to a daily intake shortfall of **85,000 bpd**, rapidly depleting on-site working inventories down to critical threshold levels within **9.4 days**. Without corrective action, unit throughput will throttle by **21.5%**, directly curtailing high-margin distillate production while incurring a cumulative replacement premium cost exposure of **$38.25M**.

### Optimization Strategy & Diet Feasibility
The **Balanced Resilience Strategy** re-routes crude sourcing toward the North Sea and South Atlantic basins, deploying **40,000 bpd of Johan Sverdrup** and **30,000 bpd of Brazilian Tupi**. This preserves our vacuum distillation tower constraints with a blended API gravity of **32.9°** and sulfur content of **0.63%**, well within allowable metallurgy tolerances while bypassing the Strait of Hormuz and Bab-el-Mandeb bottleneck corridors entirely.

### 72-Hour Operational Directives
1. **Chartering:** Exercise prompt lifting options on North Sea short-haul shuttle tankers to secure delivery within a 3-day turnaround.
2. **Hedging:** Lock in crack-spread derivatives and hedge prompt Brent-Dubai EFS differentials against expected spot freight premiums.
3. **Inventory:** Conserve 4 days of sweet crude tankage at Maasvlakte Oil Terminal to buffer potential discharge window delays.`,
      timestamp: new Date().toISOString()
    };
  }

  renderReport(activeReport);
  renderHistoricalReports();
  setupReportActions();
});

function renderReport(rep) {
  const sim = rep.simulation || {};
  const strat = rep.strategy || {};
  const metrics = strat.metrics || {};

  const timeEl = document.getElementById('report-timestamp');
  if (timeEl) timeEl.textContent = formatDate(rep.timestamp);

  // Summary Metrics
  const defEl = document.getElementById('rep-deficit');
  if (defEl) defEl.textContent = formatBpd(sim.dailyDeficitBpd);

  const costEl = document.getElementById('rep-cost');
  if (costEl) costEl.textContent = formatCurrency(sim.projectedCostIncreaseUsd, 0);

  const stratNameEl = document.getElementById('rep-strat-name');
  if (stratNameEl) stratNameEl.textContent = strat.strategy_name || 'Balanced Resilience';

  const riskEl = document.getElementById('rep-risk');
  if (riskEl) riskEl.textContent = `${metrics.composite_residual_risk || 21}/100`;

  // Reallocations Table
  const tbody = document.getElementById('rep-table-body');
  if (tbody) {
    if (!strat.reallocations || strat.reallocations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No reallocations nominated.</td></tr>`;
    } else {
      tbody.innerHTML = (strat.reallocations || []).map(r => `
        <tr>
          <td><b>${r.name}</b></td>
          <td style="font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 600;">+${formatNumber(r.incremental_bpd)} bpd</td>
          <td>${formatCurrency(r.unit_cost_usd)}</td>
          <td>${formatCurrency(r.additional_cost_usd, 0)}</td>
          <td>${r.transit_days}d</td>
        </tr>
      `).join('');
    }
  }

  // Directives / AI Executive Briefing
  const dirEl = document.getElementById('rep-directives');
  if (dirEl) {
    const text = rep.explanation || `
      <p><b>1. Immediate Chartering:</b> Declare prompt Aframax liftings at Hound Point and Mongstad to secure North Sea crude discharge windows within 72 hours.</p>
      <p style="margin-top: 0.5rem;"><b>2. Derivative Hedging:</b> Lock in crack-spread options against Dubai-Brent EFS divergence to cap replacement premium exposure.</p>
      <p style="margin-top: 0.5rem;"><b>3. CDU Diet Calibration:</b> Adjust desalter temperature and atmospheric column reflux rates to accommodate the blended 32.9° API / 0.63% sulfur stream.</p>
    `;

    const formatted = text
      .replace(/### (.*?)\n/g, '<h4 style="color: var(--accent-cyan); margin: 0.85rem 0 0.35rem; font-size: 0.95rem;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<b style="color: #fff;">$1</b>')
      .replace(/\n\n/g, '<p style="margin-bottom: 0.5rem;"></p>');

    dirEl.innerHTML = formatted;
  }
}

async function renderHistoricalReports() {
  const container = document.getElementById('historical-reports-list');
  if (!container) return;

  const history = await CrudeGuardAPI.getReports();
  if (history.length === 0) {
    container.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem 0;">No archived reports yet.</p>`;
    return;
  }

  container.innerHTML = history.slice(0, 5).map(h => `
    <div style="padding: 0.65rem 0; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; font-size: 0.82rem;">
      <div>
        <b style="color: #fff;">${h.title || 'Disruption Analysis'}</b><br>
        <span style="font-size: 0.72rem; color: var(--text-muted);">${formatDate(h.created_at)}</span>
      </div>
      <span class="badge badge-info" style="font-size: 0.7rem;">Archived</span>
    </div>
  `).join('');
}

function setupReportActions() {
  const printBtn = document.getElementById('btn-print-report');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  const exportBtn = document.getElementById('btn-export-json');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      downloadJSON(activeReport, `crudeguard-report-${Date.now()}.json`);
      showToast('Exported Report JSON', 'success');
    });
  }

  const saveBtn = document.getElementById('btn-save-report');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      try {
        await CrudeGuardAPI.saveReport(activeReport);
        showToast('Report successfully archived to Supabase', 'success');
        renderHistoricalReports();
      } catch (err) {
        showToast('Failed to archive report', 'error');
      } finally {
        saveBtn.disabled = false;
      }
    });
  }
}
