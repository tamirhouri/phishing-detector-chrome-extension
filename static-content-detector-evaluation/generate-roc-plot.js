import fs from 'fs/promises';

async function generateRocPlot() {
  // 1) load your JSON; each entry is [threshold, TPR, FPR]
  const raw = JSON.parse(
    await fs.readFile('./static_roc_curve_data.json', 'utf-8')
  );

  // 2) turn into objects & sort by FPR ascending
  const roc = raw
    .map(([threshold, tpr, fpr]) => ({ threshold, tpr, fpr }))
    .sort((a, b) => a.fpr - b.fpr);

  // 3) extract arrays for plotting
  const fprVals = roc.map(p => p.fpr);
  const tprVals = roc.map(p => p.tpr);

  // 4) find best threshold via Youden’s J = TPR – FPR
  const best = roc.reduce((best, p) => {
    const j = p.tpr - p.fpr;
    return j > best.j ? { ...p, j } : best;
  }, { threshold: 0, tpr: 0, fpr: 0, j: -Infinity });

  // 5) emit HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ROC Curve</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { margin:0; display:flex; align-items:center; justify-content:center; height:100vh; }
    #rocChart { max-width:600px; max-height:600px; }
  </style>
</head>
<body>
  <canvas id="rocChart"></canvas>
  <script>
    // embed our pre‑computed arrays
    const roc = ${JSON.stringify(roc)};
    const best = ${JSON.stringify(best)};

    new Chart(document.getElementById('rocChart'), {
      type: 'scatter',
      data: {
        datasets: [
          {
            label: 'ROC Curve',
            data: roc.map(p => ({ x: p.fpr, y: p.tpr })),
            showLine: true,
            borderColor: 'rgba(0, 123, 255, 0.8)',
            borderWidth: 2,
            fill: false,
            tension: 0.2
          },
          {
            label: 'Random Classifier',
            data: [ { x: 0, y: 0 }, { x: 1, y: 1 } ],
            showLine: true,
            borderColor: 'rgba(0,0,0,0.3)',
            borderDash: [5,5],
            pointRadius: 0
          },
          {
            label: \`Best threshold: \${best.threshold.toFixed(3)}\`,
            data: [ { x: best.fpr, y: best.tpr } ],
            type: 'scatter',
            pointBackgroundColor: 'red',
            pointBorderColor: 'red',
            pointRadius: 6
          }
        ]
      },
      options: {
        scales: {
          x: {
            type: 'linear',
            min: 0,
            max: 1,
            title: { display: true, text: 'False Positive Rate' }
          },
          y: {
            type: 'linear',
            min: 0,
            max: 1,
            title: { display: true, text: 'True Positive Rate' }
          }
        },
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'nearest', intersect: false }
        },
        maintainAspectRatio: false
      }
    });
  <\/script>
</body>
</html>`;

  await fs.writeFile('./static_roc_plot.html', html, 'utf-8');
  console.log('ROC plot saved to static_roc_plot.html');
}

generateRocPlot().catch(err => {
  console.error('Error generating ROC plot:', err);
});
