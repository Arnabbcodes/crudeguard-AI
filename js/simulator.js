/**
 * CrudeGuard AI - Supply Disruption Simulator Controller
 */

import { CrudeGuardAPI } from './api.js';
import { setupNavigation, formatNumber, formatCurrency, formatBpd, showToast } from './utils.js';
import { CrudeCharts } from './charts.js';

let allSuppliers = [];
let allScenarios = [];
let allEvents = [];
let currentSimulationResult = null;
let barChartInstance = null;
let lineChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();

  try {
    const [suppliers, scenarios, events] = await Promise.all([
      CrudeGuardAPI.getSuppliers(),
      CrudeGuardAPI.getScenarios(),
      CrudeGuardAPI.getEvents()
    ]);
    allSuppliers = suppliers;
    allScenarios = scenarios;
    allEvents = events;

    renderSupplierCheckboxes(suppliers);
    renderPresetChips(scenarios);
    setupSliderListeners();

    // Check query params for preset, supplier, event, or raw curtailment triggers
    const urlParams = new URLSearchParams(window.location.search);
    const supplierParam = urlParams.get('supplierId') || urlParams.get('preset');
    const eventParam = urlParams.get('event');
    const rawCurtailment = urlParams.get('curtailment');

    if (eventParam) {
      loadEventShock(eventParam);
    } else if (supplierParam) {
      selectSingleSupplierShock(supplierParam);
    } else if (rawCurtailment) {
      loadRawCurtailmentShock(Number(rawCurtailment));
    } else {
      // Default to Hormuz scenario
      loadScenarioPreset('scen-hormuz-50');
    }

    setupRunOptimizerButton();
  } catch (err) {
    console.error('[Simulator] Init error:', err);
    showToast('Failed to initialize simulation engine', 'error');
  }
});

function renderSupplierCheckboxes(suppliers) {
  const container = document.getElementById('supplier-checkbox-list');
  if (!container) return;

  container.innerHTML = suppliers.map(s => `
    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer; padding: 0.3rem 0;">
      <input type="checkbox" name="affected-supplier" value="${s.id}" class="supplier-check">
      <span>${s.name} (${s.crude_grade} - ${formatNumber(s.contracted_bpd)} bpd)</span>
    </label>
  `).join('');

  container.querySelectorAll('.supplier-check').forEach(chk => {
    chk.addEventListener('change', runLiveSimulation);
  });
}

function renderPresetChips(scenarios) {
  const container = document.getElementById('preset-chips-container');
  if (!container) return;

  container.innerHTML = scenarios.map((scen, idx) => `
    <div class="preset-chip ${idx === 0 ? 'active' : ''}" data-id="${scen.id}">
      <div class="preset-title">
        <span>${scen.name}</span>
        <span class="badge badge-critical" style="font-size: 0.65rem;">${scen.type}</span>
      </div>
      <div class="preset-desc">${scen.duration_days} Days Duration • Curtailment ${scen.parameters?.curtailment_pct}%</div>
    </div>
  `).join('');

  container.querySelectorAll('.preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadScenarioPreset(chip.getAttribute('data-id'));
    });
  });
}

function loadScenarioPreset(scenarioId) {
  const scenario = allScenarios.find(s => s.id === scenarioId);
  if (!scenario) return;

  const params = scenario.parameters || {};

  // Set sliders
  setSlider('curtailment-slider', 'curtailment-val', params.curtailment_pct || 50, '%');
  setSlider('duration-slider', 'duration-val', scenario.duration_days || 30, ' days');
  setSlider('freight-slider', 'freight-val', params.freight_spike_pct || 80, '%');
  setSlider('shock-slider', 'shock-val', params.brent_price_shock_usd || 12, ' $/bbl');

  // Check affected suppliers
  const affected = params.affected_supplier_ids || [];
  document.querySelectorAll('.supplier-check').forEach(chk => {
    chk.checked = affected.includes(chk.value);
  });

  runLiveSimulation();
}

function loadEventShock(eventId) {
  const evt = allEvents.find(e => e.id === eventId);
  if (!evt) {
    loadScenarioPreset('scen-hormuz-50');
    return;
  }

  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));

  // Match suppliers affected by name
  const affectedNames = evt.affected_suppliers || [];
  document.querySelectorAll('.supplier-check').forEach(chk => {
    const sup = allSuppliers.find(s => s.id === chk.value);
    chk.checked = Boolean(sup && affectedNames.some(name => sup.name.toLowerCase().includes(name.toLowerCase())));
  });

  setSlider('curtailment-slider', 'curtailment-val', evt.severity === 'Critical' ? 60 : 40, '%');
  setSlider('duration-slider', 'duration-val', 30, ' days');
  setSlider('freight-slider', 'freight-val', 85, '%');
  setSlider('shock-slider', 'shock-val', 14, ' $/bbl');

  runLiveSimulation();
  showToast(`Loaded scenario from event: ${evt.title}`, 'info');
}

function loadRawCurtailmentShock(targetBpd) {
  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
  // Select top 2 suppliers
  document.querySelectorAll('.supplier-check').forEach((chk, idx) => {
    chk.checked = idx < 2;
  });

  setSlider('curtailment-slider', 'curtailment-val', 50, '%');
  setSlider('duration-slider', 'duration-val', 30, ' days');
  setSlider('freight-slider', 'freight-val', 75, '%');
  setSlider('shock-slider', 'shock-val', 10, ' $/bbl');

  runLiveSimulation();
}

function selectSingleSupplierShock(supplierId) {
  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.supplier-check').forEach(chk => {
    chk.checked = (chk.value === supplierId);
  });

  setSlider('curtailment-slider', 'curtailment-val', 100, '%');
  setSlider('duration-slider', 'duration-val', 21, ' days');
  setSlider('freight-slider', 'freight-val', 35, '%');
  setSlider('shock-slider', 'shock-val', 6, ' $/bbl');

  runLiveSimulation();
}

function setSlider(sliderId, badgeId, value, unit) {
  const slider = document.getElementById(sliderId);
  const badge = document.getElementById(badgeId);
  if (slider) slider.value = value;
  if (badge) badge.textContent = `${value}${unit}`;
}

function setupSliderListeners() {
  const sliders = [
    { id: 'curtailment-slider', badge: 'curtailment-val', unit: '%' },
    { id: 'duration-slider', badge: 'duration-val', unit: ' days' },
    { id: 'freight-slider', badge: 'freight-val', unit: '%' },
    { id: 'shock-slider', badge: 'shock-val', unit: ' $/bbl' }
  ];

  sliders.forEach(s => {
    const el = document.getElementById(s.id);
    const badge = document.getElementById(s.badge);
    if (el && badge) {
      el.addEventListener('input', () => {
        badge.textContent = `${el.value}${s.unit}`;
        runLiveSimulation();
      });
    }
  });
}

async function runLiveSimulation() {
  // Collect inputs
  const checkedSuppliers = Array.from(document.querySelectorAll('.supplier-check:checked')).map(c => c.value);
  const curtailmentPct = Number(document.getElementById('curtailment-slider')?.value || 50);
  const durationDays = Number(document.getElementById('duration-slider')?.value || 30);
  const freightSpikePct = Number(document.getElementById('freight-slider')?.value || 50);
  const brentShockUsd = Number(document.getElementById('shock-slider')?.value || 10);

  const result = await CrudeGuardAPI.runSimulation({
    affectedSupplierIds: checkedSuppliers,
    curtailmentPct,
    durationDays,
    freightSpikePct,
    brentShockUsd
  });

  currentSimulationResult = result;
  sessionStorage.setItem('active_simulation', JSON.stringify(result));

  updateSimulationUI(result);
}

function updateSimulationUI(res) {
  // Metric 1: Daily Deficit
  const defEl = document.getElementById('impact-daily-deficit');
  if (defEl) defEl.textContent = formatBpd(res.dailyDeficitBpd);

  // Metric 2: Total Volume Lost
  const lostEl = document.getElementById('impact-total-lost');
  if (lostEl) lostEl.textContent = `${formatNumber(res.totalBarrelsLost)} bbl`;

  // Metric 3: Utilization Drop
  const utilEl = document.getElementById('impact-util-drop');
  if (utilEl) {
    utilEl.textContent = `-${res.refineryUtilizationDropPct}%`;
    const noteEl = document.getElementById('impact-util-sub');
    if (noteEl) noteEl.textContent = `New run rate: ${res.postUtilizationPct}%`;
  }

  // Metric 4: Days of Reserve
  const reserveEl = document.getElementById('impact-reserve-days');
  if (reserveEl) {
    if (res.dailyDeficitBpd > 0) {
      reserveEl.textContent = `${res.reserveDepletionDays} Days`;
      reserveEl.style.color = res.reserveDepletionDays < 10 ? 'var(--risk-critical)' : 'var(--risk-medium)';
    } else {
      reserveEl.textContent = 'Nominal (18 Days)';
      reserveEl.style.color = 'var(--risk-low)';
    }
  }

  // Metric 5: Financial Impact
  const costEl = document.getElementById('impact-cost-surge');
  if (costEl) costEl.textContent = formatCurrency(res.projectedCostIncreaseUsd, 0);

  // Update Charts
  if (barChartInstance) {
    try { barChartInstance.destroy(); } catch {}
  }
  barChartInstance = CrudeCharts.createDeficitComparisonBar(
    'sim-deficit-chart', 
    res.dailyIntakeTargetBpd, 
    res.dailyDeficitBpd, 
    0
  );

  if (lineChartInstance) {
    try { lineChartInstance.destroy(); } catch {}
  }
  lineChartInstance = CrudeCharts.createReserveDepletionLine(
    'sim-reserve-chart', 
    18, 
    res.dailyDeficitBpd
  );
}

function setupRunOptimizerButton() {
  const optBtn = document.getElementById('btn-run-optimizer');
  if (optBtn) {
    optBtn.addEventListener('click', () => {
      if (!currentSimulationResult || currentSimulationResult.dailyDeficitBpd <= 0) {
        showToast('Please select at least one affected supplier to simulate disruption', 'warning');
        return;
      }
      window.location.href = 'optimization.html';
    });
  }
}
