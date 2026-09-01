// ============================================================
// FFB Strategy 2026 — Master App & Interactive Engine
// ============================================================

// --- 1. Unit Economics Simulator Engine ---
function initSimulator() {
  const budgetInput = document.getElementById('sim-budget');
  const cpcInput = document.getElementById('sim-cpc');
  const crLandingInput = document.getElementById('sim-cr-landing');
  const crSalesInput = document.getElementById('sim-cr-sales');
  const avgCheckInput = document.getElementById('sim-avg-check');
  const ltvMonthsInput = document.getElementById('sim-ltv-months');
  const marginInput = document.getElementById('sim-margin');

  if (!budgetInput) return; // Not on simulator page

  function update() {
    const budget = parseFloat(budgetInput.value);
    const cpc = parseFloat(cpcInput.value);
    const crLanding = parseFloat(crLandingInput.value) / 100;
    const crSales = parseFloat(crSalesInput.value) / 100;
    const avgCheck = parseFloat(avgCheckInput.value);
    const ltvMonths = parseFloat(ltvMonthsInput.value);
    const margin = parseFloat(marginInput.value) / 100;

    // Display slider values
    document.getElementById('val-budget').textContent = budget.toLocaleString('ru-RU') + ' €';
    document.getElementById('val-cpc').textContent = cpc.toFixed(2) + ' €';
    document.getElementById('val-cr-landing').textContent = (crLanding * 100).toFixed(1) + '%';
    document.getElementById('val-cr-sales').textContent = (crSales * 100).toFixed(1) + '%';
    document.getElementById('val-avg-check').textContent = avgCheck.toLocaleString('ru-RU') + ' €/мес';
    document.getElementById('val-ltv-months').textContent = ltvMonths + ' мес';
    document.getElementById('val-margin').textContent = (margin * 100).toFixed(0) + '%';

    // Core Calculations
    const clicks = Math.round(budget / cpc);
    const leads = Math.round(clicks * crLanding);
    const cpl = leads > 0 ? (budget / leads) : 0;
    const rawClients = leads * crSales;
    const clients = rawClients;
    const clientsRounded = Math.max(1, Math.round(rawClients));
    const cac = clients > 0 ? (budget / clients) : 0;

    const revMonth1 = clients * avgCheck;
    const revLtv = clients * avgCheck * ltvMonths;
    const grossProfitLtv = revLtv * margin;
    const netProfitLtv = grossProfitLtv - budget;
    const roi = budget > 0 ? (netProfitLtv / budget) * 100 : 0;
    const paybackDays = (avgCheck * margin > 0) ? Math.round((cac / (avgCheck * margin)) * 30) : 0;

    // Update Result Tiles
    document.getElementById('res-clicks').textContent = clicks.toLocaleString('ru-RU');
    document.getElementById('res-leads').textContent = leads.toLocaleString('ru-RU');
    document.getElementById('res-cpl').textContent = cpl.toFixed(2) + ' €';
    document.getElementById('res-clients').textContent = clients.toFixed(1) + ' (' + clientsRounded + ' шт)';
    document.getElementById('res-cac').textContent = cac.toFixed(0) + ' €';
    document.getElementById('res-rev-m1').textContent = revMonth1.toLocaleString('ru-RU', {maximumFractionDigits: 0}) + ' €';
    document.getElementById('res-rev-ltv').textContent = revLtv.toLocaleString('ru-RU', {maximumFractionDigits: 0}) + ' €';
    
    const profitEl = document.getElementById('res-net-profit');
    profitEl.textContent = (netProfitLtv >= 0 ? '+' : '') + netProfitLtv.toLocaleString('ru-RU', {maximumFractionDigits: 0}) + ' €';
    profitEl.style.color = netProfitLtv >= 0 ? 'var(--ds-good)' : 'var(--ds-bad)';

    const roiEl = document.getElementById('res-roi');
    roiEl.textContent = (roi >= 0 ? '+' : '') + roi.toFixed(0) + '%';
    roiEl.style.color = roi >= 0 ? 'var(--ds-good)' : 'var(--ds-bad)';

    const paybackEl = document.getElementById('res-payback');
    if (paybackEl) paybackEl.textContent = paybackDays + ' дней';

    // Update Simulator Chart if available
    updateSimChart(budget, revLtv, grossProfitLtv, netProfitLtv, ltvMonths, avgCheck, margin, clients);
  }

  [budgetInput, cpcInput, crLandingInput, crSalesInput, avgCheckInput, ltvMonthsInput, marginInput].forEach(el => {
    el.addEventListener('input', update);
  });

  update();
}

let simChartInstance = null;
function updateSimChart(budget, revLtv, grossProfitLtv, netProfitLtv, ltvMonths, avgCheck, margin, clients) {
  const ctx = document.getElementById('simProfitChart');
  if (!ctx || typeof Chart === 'undefined') return;

  const labels = [];
  const cumulativeGross = [];
  const cumulativeNet = [];

  const monthlyGross = clients * avgCheck * margin;
  for (let m = 1; m <= 12; m++) {
    labels.push('Месяц ' + m);
    const gross = monthlyGross * Math.min(m, ltvMonths);
    cumulativeGross.push(gross);
    cumulativeNet.push(gross - budget);
  }

  if (simChartInstance) {
    simChartInstance.data.labels = labels;
    simChartInstance.data.datasets[0].data = cumulativeGross;
    simChartInstance.data.datasets[1].data = cumulativeNet;
    simChartInstance.update();
  } else {
    simChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Валовая прибыль накопленная (€)',
            data: cumulativeGross,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            fill: true,
            tension: 0.3
          },
          {
            label: 'Чистая прибыль (после вычета рекламы) (€)',
            data: cumulativeNet,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            fill: true,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8' } }
        },
        scales: {
          x: { grid: { color: '#1e2330' }, ticks: { color: '#94a3b8' } },
          y: { grid: { color: '#1e2330' }, ticks: { color: '#94a3b8' } }
        }
      }
    });
  }
}

// --- 2. Copy Code helper ---
function copyCode(btn, targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const text = target.innerText || target.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = '✓ Скопировано!';
    btn.style.background = 'var(--ds-good)';
    btn.style.color = '#000';
    setTimeout(() => {
      btn.textContent = original;
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  });
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initSimulator();
});
