/**
 * CrudeGuard AI - Sourcing Optimization & Strategy Comparison Controller
 */

import { CrudeGuardAPI } from './api.js';
import { setupNavigation, formatNumber, formatCurrency, formatBpd, renderRiskBadge, showToast } from './utils.js';
import { CrudeCharts } from './charts.js';

let activeSimulation = null;
let currentStrategies = {};
let selectedStrategyKey = 'balanced';
let comparisonChartInstance = null;
let latestAIExplanation = '';

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();

  // Retrieve active simulation or fallback default
  const stored = sessionStorage.getItem('active_simulation');
  if (stored) {
    try {
      activeSimulation = JSON.parse(stored);
    } catch {
      activeSimulation = null;
    }
  }

  if (!activeSimulation) {
    // Generate fallback default simulation (Hormuz 50% cut)
    activeSimulation = await CrudeGuardAPI.runSimulation({
      affectedSupplierIds: ['sup-01', 'sup-03'],
      curtailmentPct: 50,
      durationDays: 30,
      freightSpikePct: 80,
      brentShockUsd: 12
    });
  }

  renderSimulationContext(activeSimulation);
  await generateStrategies(activeSimulation);
  setupStrategySelection();
  setupAIExplanationButton();
});

function renderSimulationContext(sim) {
  const summaryEl = document.getElementById('opt-deficit-summary');
  if (summaryEl) {
    const affectedNames = (sim.affectedSuppliers || []).map(s => s.name).join(', ') || 'Middle East Corridors';
    summaryEl.innerHTML = `
      Addressing a daily crude supply deficit of <b style="color: var(--risk-critical);">${formatBpd(sim.dailyDeficitBpd)}</b> 
      triggered by disruption across <b>${affectedNames}</b>.
    `;
  }
}

async function generateStrategies(sim) {
  const [costStrat, riskStrat, balancedStrat] = await Promise.all([
    CrudeGuardAPI.optimizeSourcing(sim, 'cost'),
    CrudeGuardAPI.optimizeSourcing(sim, 'risk'),
    CrudeGuardAPI.optimizeSourcing(sim, 'balanced')
  ]);

  currentStrategies = {
    cost: costStrat,
    risk: riskStrat,
    balanced: balancedStrat
  };

  renderStrategyCards();
  selectStrategy('balanced');
}

function renderStrategyCards() {
  const container = document.getElementById('strategies-container');
  if (!container) return;

  const keys = ['cost', 'balanced', 'risk'];
  container.innerHTML = keys.map(key => {
    const strat = currentStrategies[key];
    if (!strat) return '';

    const isRec = key === 'balanced';
    const isSelected = key === selectedStrategyKey;
    const m = strat.metrics || {};

    return `
      <div class="card strategy-card ${isRec ? 'recommended' : ''}" data-strategy="${key}" style="cursor: pointer;">
        ${isRec ? '<span class="strategy-ribbon">AI Recommended</span>' : ''}
        <div class="card-header">
          <div>
            <h3 style="font-size: 1.15rem;">${strat.strategy_name}</h3>
            <span class="card-subtitle">${strat.coverage_pct}% Deficit Recovered (${formatBpd(strat.covered_bpd)})</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin: 0.75rem 0; font-size: 0.82rem;">
          <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: var(--radius-sm);">
            <span style="color: var(--text-muted); font-size: 0.7rem; display: block;">Landed Avg Cost</span>
            <b style="font-family: var(--font-mono); color: #fff;">${formatCurrency(m.weighted_avg_landed_cost)}/bbl</b>
          </div>
          <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: var(--radius-sm);">
            <span style="color: var(--text-muted); font-size: 0.7rem; display: block;">Residual Risk</span>
            <b style="font-family: var(--font-mono); color: ${(m.composite_residual_risk || 0) > 30 ? 'var(--risk-medium)' : 'var(--risk-low)'};">
              ${m.composite_residual_risk || 20}/100
            </b>
          </div>
          <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: var(--radius-sm);">
            <span style="color: var(--text-muted); font-size: 0.7rem; display: block;">Diet Gravity / Sulfur</span>
            <b style="font-family: var(--font-mono); color: #fff;">${m.blended_api}° API / ${m.blended_sulfur_pct}% S</b>
          </div>
          <div style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: var(--radius-sm);">
            <span style="color: var(--text-muted); font-size: 0.7rem; display: block;">Lead Time</span>
            <b style="font-family: var(--font-mono); color: #fff;">${m.execution_lead_time_days || 3} Days</b>
          </div>
        </div>

        <button class="btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'} btn-select-strat" data-key="${key}" style="margin-top: auto;">
          ${isSelected ? 'Selected Active' : 'Select Plan'}
        </button>
      </div>
    `;
  }).join('');

  // Wire card click and button click
  document.querySelectorAll('.strategy-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const key = card.getAttribute('data-strategy');
      selectStrategy(key);
    });
  });
}

function selectStrategy(key) {
  selectedStrategyKey = key;
  const strat = currentStrategies[key];
  if (!strat) return;

  // Highlight selected card & update button texts
  document.querySelectorAll('.strategy-card').forEach(c => {
    const cardKey = c.getAttribute('data-strategy');
    const isThisCard = cardKey === key;
    c.style.borderColor = isThisCard ? 'var(--accent-cyan)' : 'var(--border-subtle)';
    c.style.boxShadow = isThisCard ? '0 0 20px rgba(0, 229, 255, 0.25)' : 'none';

    const btn = c.querySelector('.btn-select-strat');
    if (btn) {
      if (isThisCard) {
        btn.textContent = 'Selected Active';
        btn.className = 'btn btn-sm btn-primary btn-select-strat';
      } else {
        btn.textContent = 'Select Plan';
        btn.className = 'btn btn-sm btn-outline btn-select-strat';
      }
    }
  });

  // Render detailed reallocation table
  const tbody = document.getElementById('reallocations-table-body');
  if (tbody) {
    if (!strat.reallocations || strat.reallocations.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--risk-critical); padding: 1.5rem;">
            All suppliers are currently curtailed. Strategic reserve buffer withdrawal must be authorized.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = strat.reallocations.map(r => `
        <tr>
          <td><b>${r.name}</b></td>
          <td style="font-family: var(--font-mono); font-weight: 600; color: var(--accent-cyan);">+${formatNumber(r.incremental_bpd)} bpd</td>
          <td>${formatCurrency(r.unit_cost_usd)}</td>
          <td>${formatCurrency(r.additional_cost_usd, 0)}/day</td>
          <td>${r.transit_days} Days</td>
          <td>${renderRiskBadge(r.risk_score)}</td>
        </tr>
      `).join('');
    }
  }

  // Update Deficit Coverage Comparison Chart
  if (comparisonChartInstance) {
    try { comparisonChartInstance.destroy(); } catch {}
  }
  comparisonChartInstance = CrudeCharts.createDeficitComparisonBar(
    'opt-comparison-chart',
    activeSimulation.dailyIntakeTargetBpd,
    activeSimulation.dailyDeficitBpd,
    strat.covered_bpd
  );

  // Trigger AI synthesis for the selected strategy
  generateBriefing(strat);
}

function setupStrategySelection() {
  const proceedBtn = document.getElementById('btn-proceed-reports');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      const payload = {
        title: 'Executive Crude Supply Disruption Response Briefing',
        refinery: 'Rotterdam Gateway Energy Complex',
        simulation: activeSimulation,
        strategy: currentStrategies[selectedStrategyKey],
        explanation: latestAIExplanation,
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem('report_payload', JSON.stringify(payload));
      window.location.href = 'reports.html';
    });
  }
}

function setupAIExplanationButton() {
  const regenBtn = document.getElementById('btn-regen-ai');
  if (regenBtn) {
    regenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const strat = currentStrategies[selectedStrategyKey];
      generateBriefing(strat);
    });
  }
}

async function generateBriefing(strat) {
  const container = document.getElementById('ai-explanation-content');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.6rem; color: var(--accent-cyan); font-size: 0.88rem; padding: 1rem 0;">
      <svg style="animation: spin 1s linear infinite; width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" stroke-width="4" stroke-dasharray="32" stroke-linecap="round"></circle>
      </svg>
      Synthesizing executive intelligence via Groq AI (Llama-3.3-70b)...
    </div>
  `;

  try {
    const context = {
      dailyDeficitBpd: activeSimulation.dailyDeficitBpd,
      projectedCostIncreaseUsd: activeSimulation.projectedCostIncreaseUsd,
      selectedStrategy: strat.strategy_name,
      reallocations: strat.reallocations,
      metrics: strat.metrics
    };

    const explanation = await CrudeGuardAPI.generateAIExplanation(context);
    latestAIExplanation = explanation;
    
    // Markdown formatting for browser display
    const formatted = explanation
      .replace(/### (.*?)\n/g, '<h4 style="color: var(--accent-cyan); margin: 0.85rem 0 0.35rem; font-size: 1rem;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<b style="color: #fff;">$1</b>')
      .replace(/\n\n/g, '<p style="margin-bottom: 0.75rem;"></p>');

    container.innerHTML = formatted;
  } catch (err) {
    console.error('[Optimization] Briefing error:', err);
    container.innerHTML = `<p style="color: var(--risk-critical);">Failed to generate AI intelligence briefing.</p>`;
  }
}
