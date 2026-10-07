/**
 * CrudeGuard AI - Chart.js Visualizations
 * Provides dark-themed, sleek charts for risk, volumes, and cost impacts.
 */

function ensureChartDefaults() {
  if (window.Chart && window.Chart.defaults) {
    window.Chart.defaults.color = '#94A3B8';
    window.Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    if (window.Chart.defaults.plugins && window.Chart.defaults.plugins.tooltip) {
      window.Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(13, 21, 34, 0.95)';
      window.Chart.defaults.plugins.tooltip.titleColor = '#F0F6FC';
      window.Chart.defaults.plugins.tooltip.bodyColor = '#D1D5DB';
      window.Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.15)';
      window.Chart.defaults.plugins.tooltip.borderWidth = 1;
      window.Chart.defaults.plugins.tooltip.padding = 10;
      window.Chart.defaults.plugins.tooltip.cornerRadius = 8;
    }
  }
}

export const CrudeCharts = {
  /**
   * Risk Breakdown Radar Chart
   */
  createRiskRadar(canvasId, suppliers = []) {
    if (!window.Chart) {
      console.warn('[CrudeCharts] Chart.js not loaded on page.');
      return null;
    }
    ensureChartDefaults();

    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    // Destroy existing chart on canvas if any
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    // Compute average factor scores
    let geo = 0, chk = 0, ops = 0, fin = 0;
    const count = suppliers.length || 1;

    suppliers.forEach(s => {
      geo += s.risk_factors?.geopolitical || 40;
      chk += s.risk_factors?.maritime_chokepoint || 40;
      ops += s.risk_factors?.operational || 25;
      fin += s.risk_factors?.financial_sovereign || 20;
    });

    return new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Geopolitical Instability', 'Chokepoint Bottlenecks', 'Operational & Weather', 'Financial & Sovereign'],
        datasets: [
          {
            label: 'Current Portfolio Exposure',
            data: [
              Math.round(geo / count),
              Math.round(chk / count),
              Math.round(ops / count),
              Math.round(fin / count)
            ],
            backgroundColor: 'rgba(0, 229, 255, 0.2)',
            borderColor: '#00E5FF',
            pointBackgroundColor: '#00E5FF',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#00E5FF',
            borderWidth: 2
          },
          {
            label: 'Risk Tolerance Threshold',
            data: [50, 45, 40, 40],
            backgroundColor: 'rgba(255, 77, 109, 0.08)',
            borderColor: 'rgba(255, 77, 109, 0.6)',
            borderDash: [5, 5],
            pointRadius: 0,
            borderWidth: 1.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: {
              color: '#94A3B8',
              font: { size: 11, weight: '500' }
            },
            ticks: {
              backdropColor: 'transparent',
              color: '#64748B',
              stepSize: 20
            },
            min: 0,
            max: 100
          }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 12, padding: 15 }
          }
        }
      }
    });
  },

  /**
   * Supply Deficit Impact Bar Chart (Before vs After Disruption)
   */
  createDeficitComparisonBar(canvasId, intakeTarget = 395000, deficitBpd = 0, coveredBpd = 0) {
    if (!window.Chart) {
      console.warn('[CrudeCharts] Chart.js not loaded on page.');
      return null;
    }
    ensureChartDefaults();

    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    const postDisruption = Math.max(0, intakeTarget - deficitBpd);
    const postOptimization = Math.min(intakeTarget, postDisruption + coveredBpd);

    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Baseline Demand', 'Post-Disruption Flow', 'With Reallocation'],
        datasets: [{
          label: 'Daily Intake (bpd)',
          data: [intakeTarget, postDisruption, postOptimization],
          backgroundColor: [
            'rgba(0, 229, 255, 0.65)',
            'rgba(255, 77, 109, 0.7)',
            'rgba(6, 214, 160, 0.7)'
          ],
          borderColor: [
            '#00E5FF',
            '#FF4D6D',
            '#06D6A0'
          ],
          borderWidth: 1.5,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: {
              callback: (value) => `${(value / 1000).toFixed(0)}k bpd`
            }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  },

  /**
   * Strategic Reserve Depletion Horizon Line Chart
   */
  createReserveDepletionLine(canvasId, initialReserveDays = 18, deficitBpd = 85000) {
    if (!window.Chart) {
      console.warn('[CrudeCharts] Chart.js not loaded on page.');
      return null;
    }
    ensureChartDefaults();

    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    const days = [0, 5, 10, 15, 20, 25, 30];
    const baselineInventory = days.map(() => initialReserveDays);
    const unmitigatedInventory = days.map(d => Math.max(0, Number((initialReserveDays - (d * (deficitBpd / 395000) * 1.5)).toFixed(1))));
    const mitigatedInventory = days.map(d => Math.max(initialReserveDays - 3, Number((initialReserveDays - (d * 0.1)).toFixed(1))));

    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: days.map(d => `Day ${d}`),
        datasets: [
          {
            label: 'Baseline Buffer (Days)',
            data: baselineInventory,
            borderColor: '#64748B',
            borderDash: [4, 4],
            fill: false,
            tension: 0.2
          },
          {
            label: 'Unmitigated Disruption',
            data: unmitigatedInventory,
            borderColor: '#FF4D6D',
            backgroundColor: 'rgba(255, 77, 109, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Optimized Reallocation',
            data: mitigatedInventory,
            borderColor: '#06D6A0',
            fill: false,
            tension: 0.3,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            title: { display: true, text: 'Inventory Days on Hand' },
            min: 0,
            max: 22
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)' }
          }
        },
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
};
