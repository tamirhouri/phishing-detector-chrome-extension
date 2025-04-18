import fs from 'fs/promises';

const results = JSON.parse(await fs.readFile('./static_content_results.json', 'utf-8'));
const metrics = JSON.parse(await fs.readFile('./static_content_metrics.json', 'utf-8'));
const rocResults = JSON.parse(await fs.readFile('./static_roc_auc_results.json', 'utf-8'));

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Phishing Detection Report</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; }
    table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
    th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
    th { background: #eee; }
    .phishing { background-color: #ffe6e6; }
    .safe { background-color: #e6ffe6; }
    td {
      word-wrap: break-word;
      word-break: break-word;
      white-space: pre-wrap;
    }
    td:nth-child(2), td:nth-child(3) {
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <h1>Static Content Phishing Detector Report</h1>

  <h2>📊 Metrics</h2>
  <ul>
    <li><strong>Accuracy:</strong> ${metrics.accuracy}</li>
    <li><strong>Precision:</strong> ${metrics.precision}</li>
    <li><strong>Recall:</strong> ${metrics.recall}</li>
    <li><strong>F1 Score:</strong> ${metrics.f1_score}</li>
  </ul>

  <h2>🔍 ROC AUC Results</h2>
  <ul>
    <li><strong>Best Threshold:</strong> ${rocResults.bestThreshold}</li>
    <li><strong>Best Accuracy:</strong> ${rocResults.bestAccuracy}</li>
  </ul>

  <h2>📈 ROC Plot</h2>
  <a href="static_roc_plot.html" target="_blank">View ROC Plot</a>

  <h2>🔍 URL Results</h2>
  <table>
    <thead>
      <tr>
        <th>URL</th>
        <th>Label</th>
        <th>Score</th>
        <th>Reasons / Errors</th>
      </tr>
    </thead>
    <tbody>
      ${results.map(r => `
        <tr class="${r.label}">
          <td>${r.url}</td>
          <td>${r.label}</td>
          <td>${r.score ?? 'N/A'}</td>
          <td>${r.error ? `Error: ${r.error}` : (r.reasons || []).join('<br>')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>
`;

await fs.writeFile('./static_report.html', html);
console.log('📄 Report saved to static_report.html');
