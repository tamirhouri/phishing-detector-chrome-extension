import fs from 'fs/promises';

async function safeReadFile(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf-8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(
        `⚠️ Warning: Missing file ${filePath}. Skipping this section.`
      );
      return null;
    }
    throw error;
  }
}

// Read results.json as the source of truth for both StaticContent and Url results
const results = await safeReadFile('./generated/results.json');
const contentBestMetrics = await safeReadFile(
  './generated/content_roc_auc_results.json'
);
const contentRocCurveData = await safeReadFile(
  './generated/content_roc_curve_data.json'
);
const urlBestMetrics = await safeReadFile(
  './generated/url_roc_auc_results.json'
);
const urlRocCurveData = await safeReadFile(
  './generated/url_roc_curve_data.json'
);

// Declare urlThreshold and contentThreshold at the top level to ensure they are accessible globally
let urlThreshold = urlBestMetrics.threshold;
let contentThreshold = contentBestMetrics.threshold;

// Replace the problematic string with a safe representation
const sanitizeString = (str) => {
  return str
    .replace(/<script>/g, '&lt;script&gt;')
    .replace(/<\/script>/g, '&lt;/script&gt;');
};

// Function to squash duplicate reasons and add occurrence count
const squashReasons = (reasons) => {
  const reasonCounts = reasons.reduce((acc, reason) => {
    acc[reason] = (acc[reason] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(reasonCounts).map(([reason, count]) =>
    count > 1 ? `[${count}] ${reason}` : reason
  );
};

// Ensure all reasons are sanitized and squashed before being added to the report
results.forEach((result) => {
  if (result.staticContentReasons) {
    const sanitizedReasons = result.staticContentReasons.map(sanitizeString);
    result.staticContentReasons = squashReasons(sanitizedReasons);
  }
});

// Update the logic to compare classifications with the selected thresholds
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
    td:nth-child(3), td:nth-child(4) {
      white-space: nowrap;
    }
  </style>
  <script>
    const urlRocCurveData = ${JSON.stringify(urlRocCurveData)};
    const contentRocCurveData = ${JSON.stringify(contentRocCurveData)};

    function getMetricsForThreshold(data, threshold) {
      // Find the entry in the data that matches the given threshold
      const entry = data.find(item => item.threshold === parseFloat(threshold));

      // If no matching entry is found, return null
      if (!entry) {
        console.warn(\`⚠️ Warning: No metrics found for threshold \${threshold}\`);
        return null;
      }

      // Return the metrics for the matching entry
      return entry;
    }

    function updateMetrics(type, threshold) {
      const data = type === 'url' ? urlRocCurveData : contentRocCurveData;
      const metrics = getMetricsForThreshold(data, threshold);

      if (metrics) {
        document.getElementById(\`\${type}-accuracy\`).innerText = metrics.accuracy;
        document.getElementById(\`\${type}-precision\`).innerText = metrics.precision;
        document.getElementById(\`\${type}-recall\`).innerText = metrics.recall;
        document.getElementById(\`\${type}-f1\`).innerText = metrics.f1;
      }

      if (type === 'url') {
        urlThreshold = parseFloat(threshold);
      } else {
        contentThreshold = parseFloat(threshold);
      }

      updateClassifications();
    }

    // Ensure updateClassifications function uses the globally declared thresholds
    function updateClassifications() {
      const rows = document.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const urlScore = parseFloat(row.dataset.urlScore);
        const contentScore = parseFloat(row.dataset.contentScore);

        row.querySelector('.url-classification').innerText = urlScore >= urlThreshold ? 'Phishing' : 'Benign';
        row.querySelector('.content-classification').innerText = contentScore >= contentThreshold ? 'Phishing' : 'Benign';
      });
    }
  </script>
</head>
<body>
  <h1>Phishing Detection Report</h1>

  <h2>📊 UrlDetector Metrics</h2>
  <label for="url-threshold-select">Set Url Threshold:</label>
  <select id="url-threshold-select" onchange="updateMetrics('url', this.value)">
    ${urlRocCurveData
      .map(
        (entry) =>
          `<option value="${entry.threshold}">${entry.threshold}</option>`
      )
      .join('')}
  </select>
  <ul>
    <li><strong>Accuracy:</strong> <span id="url-accuracy">${
      urlBestMetrics.accuracy
    }</span></li>
    <li><strong>Precision:</strong> <span id="url-precision">${
      urlBestMetrics.precision
    }</span></li>
    <li><strong>Recall:</strong> <span id="url-recall">${
      urlBestMetrics.recall
    }</span></li>
    <li><strong>F1 Score:</strong> <span id="url-f1">${
      urlBestMetrics.f1
    }</span></li>
    <li><strong>Best Accuracy:</strong> ${
      urlBestMetrics.accuracy
    } at <strong>Threshold:</strong> ${urlBestMetrics.threshold}</li>
  </ul>


  <h2>📊 StaticContentDetector Metrics</h2>
    <label for="content-threshold-select">Set Content Threshold:</label>
  <select id="content-threshold-select" onchange="updateMetrics('content', this.value)">
    ${contentRocCurveData
      .map(
        (entry) =>
          `<option value="${entry.threshold}">${entry.threshold}</option>`
      )
      .join('')}
  </select>
  <ul>
    <li><strong>Accuracy:</strong> <span id="content-accuracy">${
      contentBestMetrics.accuracy
    }</span></li>
    <li><strong>Precision:</strong> <span id="content-precision">${
      contentBestMetrics.precision
    }</span></li>
    <li><strong>Recall:</strong> <span id="content-recall">${
      contentBestMetrics.recall
    }</span></li>
    <li><strong>F1 Score:</strong> <span id="content-f1">${
      contentBestMetrics.f1
    }</span></li>
    <li><strong>Best Accuracy:</strong> ${
      contentBestMetrics.accuracy
    } at <strong>Threshold:</strong> ${contentBestMetrics.threshold}</li>
  </ul>


  <h2>📈 ROC Plot</h2>
  <div id="roc-plot-container">
    <iframe src="./roc_plot.html" style="width: 100%; height: 600px; border: none;"></iframe>
  </div>

  <h2>🔍 Results</h2>
  <table>
    <thead>
      <tr>
        <th>rec_id</th>
        <th>URL</th>
        <th>Label</th>
        <th>UrlDetector Score</th>
        <th>StaticContent Score</th>
        <th>StaticContent Reasons</th>
        <th>UrlDetector Classification</th>
        <th>StaticContent Classification</th>
      </tr>
    </thead>
    <tbody>
      ${results
        .map(
          (r) => `
        <tr class="${r.label}" data-url-score="${
            r.urlScore
          }" data-content-score="${r.staticContentScore}">
          <td>${r.rec_id}</td>
          <td>${r.url}</td>
          <td>${r.label}</td>
          <td>${r.urlScore ?? 'N/A'}</td>
          <td>${r.staticContentScore ?? 'N/A'}</td>
          <td>${
            r.staticContentReasons ? r.staticContentReasons.join('<br>') : 'N/A'
          }</td>
          <td class="url-classification">${
            r.urlScore >= urlThreshold ? 'Phishing' : 'Safe'
          }</td>
          <td class="content-classification">${
            r.staticContentScore >= contentThreshold ? 'Phishing' : 'Safe'
          }</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>
</body>
</html>
`;

await fs.writeFile('./generated/report.html', html);
console.log('📄 Report saved to report.html');
