/**
 * CrudeGuard AI - Events & Geopolitical Intelligence Controller
 */

import { CrudeGuardAPI } from './api.js';
import { setupNavigation, formatBpd, renderRiskBadge, timeAgo, showToast } from './utils.js';

let allEvents = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();

  try {
    allEvents = await CrudeGuardAPI.getEvents();
    renderEventsList(allEvents);
    setupAIEventAnalyzer();
  } catch (err) {
    console.error('[Events] Error loading events:', err);
    showToast('Failed to load event intelligence feed', 'error');
  }
});

function renderEventsList(events) {
  const container = document.getElementById('events-stream-list');
  if (!container) return;

  container.innerHTML = events.map(evt => {
    const sevClass = (evt.severity || 'low').toLowerCase();

    return `
      <div class="card alert-item ${sevClass}" style="margin-bottom: 1.25rem;">
        <div class="alert-item-header" style="margin-bottom: 0.6rem;">
          <div>
            <h3 style="font-size: 1.1rem; margin-bottom: 0.2rem;">${evt.title}</h3>
            <span style="font-size: 0.76rem; color: var(--text-muted);">${evt.category} • ${evt.location} • ${timeAgo(evt.date)}</span>
          </div>
          ${renderRiskBadge(evt.severity)}
        </div>

        <p style="font-size: 0.88rem; color: var(--text-primary); margin-bottom: 0.75rem; line-height: 1.5;">
          ${evt.headline}
        </p>

        <div style="background: rgba(0, 0, 0, 0.25); border-left: 3px solid var(--accent-cyan); padding: 0.75rem 1rem; border-radius: var(--radius-sm); margin-bottom: 1rem;">
          <strong style="font-size: 0.78rem; text-transform: uppercase; color: var(--accent-cyan); letter-spacing: 0.05em; display: block; margin-bottom: 0.25rem;">
            🤖 AI Strategic Synthesis (Confidence ${evt.confidence_score}%)
          </strong>
          <p style="font-size: 0.82rem; color: #D1D5DB; margin-bottom: 0.4rem;">${evt.ai_summary}</p>
          <p style="font-size: 0.8rem; color: var(--accent-amber);"><b>Directive:</b> ${evt.recommended_action}</p>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            Estimated Flow Disruption: <b style="color: #fff;">${formatBpd(evt.estimated_flow_impact_bpd)}</b>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-sm btn-outline select-evt-btn" data-id="${evt.id}">Analyze Headline</button>
            <a href="simulator.html?event=${evt.id}" class="btn btn-sm btn-primary">Simulate Shock →</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Wire quick-analyze buttons
  document.querySelectorAll('.select-evt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const evtId = e.target.getAttribute('data-id');
      const selected = allEvents.find(ev => ev.id === evtId);
      if (selected) {
        const input = document.getElementById('ai-event-input');
        if (input) {
          input.value = `${selected.title}: ${selected.headline}`;
          window.scrollTo({ top: 0, behavior: 'smooth' });
          input.focus();
        }
      }
    });
  });
}

function setupAIEventAnalyzer() {
  const analyzeBtn = document.getElementById('btn-analyze-event');
  const inputEl = document.getElementById('ai-event-input');

  if (!analyzeBtn || !inputEl) return;

  const triggerAnalysis = async () => {
    const text = inputEl.value.trim();
    if (!text) {
      showToast('Please enter an event headline or maritime advisory to analyze', 'warning');
      return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `
      <svg style="animation: spin 1s linear infinite; width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" stroke-width="4" stroke-dasharray="32" stroke-linecap="round"></circle>
      </svg>
      Analyzing with Groq AI...
    `;

    try {
      const analysis = await CrudeGuardAPI.analyzeEventWithAI(text);
      renderAIAnalysisResult(analysis);
      showToast('AI Intelligence Analysis Complete', 'success');
    } catch (err) {
      console.error('[Events] AI Analysis failed:', err);
      showToast('Failed to run AI analysis', 'error');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `<span>⚡ Analyze with Groq AI</span>`;
    }
  };

  analyzeBtn.addEventListener('click', triggerAnalysis);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      triggerAnalysis();
    }
  });
}

function renderAIAnalysisResult(res) {
  const resultCard = document.getElementById('ai-analysis-result');
  if (!resultCard) return;

  resultCard.style.display = 'block';
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  const sevEl = document.getElementById('res-severity');
  if (sevEl) sevEl.innerHTML = renderRiskBadge(res.severity);

  const confEl = document.getElementById('res-confidence');
  if (confEl) confEl.textContent = `${res.confidence_score || 95}%`;

  const bpdEl = document.getElementById('res-impact-bpd');
  if (bpdEl) bpdEl.textContent = formatBpd(res.estimated_flow_impact_bpd || 85000);

  const summaryEl = document.getElementById('res-summary');
  if (summaryEl) summaryEl.textContent = res.ai_summary;

  const actionEl = document.getElementById('res-action');
  if (actionEl) actionEl.textContent = res.recommended_action;

  const simBtn = document.getElementById('res-sim-btn');
  if (simBtn) {
    simBtn.onclick = () => {
      window.location.href = `simulator.html?curtailment=${encodeURIComponent(res.estimated_flow_impact_bpd || 85000)}`;
    };
  }
}
