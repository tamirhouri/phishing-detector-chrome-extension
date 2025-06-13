import fs from 'fs/promises';
import { plot } from 'nodeplotlib';

async function generateRocPlot() {
  const staticContentRoc = JSON.parse(
    await fs.readFile('./generated/content_roc_curve_data.json', 'utf-8')
  );
  const staticContentBestTh = JSON.parse(
    await fs.readFile('./generated/content_roc_auc_results.json', 'utf-8')
  );
  const urlRoc = JSON.parse(
    await fs.readFile('./generated/url_roc_curve_data.json', 'utf-8')
  );
  const urlBestTh = JSON.parse(
    await fs.readFile('./generated/url_roc_auc_results.json', 'utf-8')
  );
  const combinedRoc = JSON.parse(
    await fs.readFile('./generated/combined_roc_curve_data.json', 'utf-8')
  );
  const combinedBestTh = JSON.parse(
    await fs.readFile('./generated/combined_roc_auc_results.json', 'utf-8')
  );

  const staticContentData = {
    x: staticContentRoc.map((point) => point.fpr),
    y: staticContentRoc.map((point) => point.tpr),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Static Content Detector',
  };

  const urlData = {
    x: urlRoc.map((point) => point.fpr),
    y: urlRoc.map((point) => point.tpr),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'URL Detector',
  };

  const combinedData = {
    x: combinedRoc.map((point) => point.fpr),
    y: combinedRoc.map((point) => point.tpr),
    type: 'scatter',
    mode: 'lines+markers',
    name: 'Combined Results',
  };

  const diagonalLine = {
    x: [0, 1],
    y: [0, 1],
    type: 'scatter',
    mode: 'lines',
    name: 'Diagonal (y = x)',
    line: { dash: 'dot', color: 'gray' }
  };

  function calculateAUC(x, y) {
    let auc = 0;
    for (let i = 1; i < x.length; i++) {
      const width = x[i] - x[i - 1];
      const height = (y[i] + y[i - 1]) / 2;
      auc += width * height;
    }
    return auc;
  }

  const staticContentAUC = calculateAUC(staticContentData.x, staticContentData.y);
  const urlAUC = calculateAUC(urlData.x, urlData.y);
  const combinedAUC = calculateAUC(combinedData.x, combinedData.y);

  const layout = {
    title: `ROC Curve (Static Content AUC: ${staticContentAUC.toFixed(4)}, URL AUC: ${urlAUC.toFixed(4)}), Combined AUC: ${combinedAUC.toFixed(4)}`,
    xaxis: { title: 'False Positive Rate (FPR)' },
    yaxis: { title: 'True Positive Rate (TPR)' },
  };

  const bestThresholdPointStatic = {
    x: [staticContentBestTh.fpr],
    y: [staticContentBestTh.tpr],
    type: 'scatter',
    mode: 'markers',
    name: 'Best Threshold (Static Content)',
    marker: { color: 'red', size: 10 }
  };

  const bestThresholdPointUrl = {
    x: [urlBestTh.fpr],
    y: [urlBestTh.tpr],
    type: 'scatter',
    mode: 'markers',
    name: 'Best Threshold (URL)',
    marker: { color: 'blue', size: 10 }
  };

  const bestThresholdPointCombined = {
    x: [combinedBestTh.fpr],
    y: [combinedBestTh.tpr],
    type: 'scatter',
    mode: 'markers',
    name: 'Best Threshold (Combined)',
    marker: { color: 'green', size: 10 }
  };

  const data = [staticContentData, urlData, combinedData, diagonalLine, bestThresholdPointStatic, bestThresholdPointUrl, bestThresholdPointCombined];

  // Generate the plot and save it as an HTML file
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f4f4f4;
    }
    #plot {
      width: 800px;
      height: 600px;
    }
  </style>
</head>
<body>
  <div id="plot"></div>
  <script>
    const data = ${JSON.stringify(data)};
    const layout = ${JSON.stringify(layout)};
    Plotly.newPlot('plot', data, layout);
  </script>
</body>
</html>`;

  await fs.writeFile('./generated/roc_plot.html', htmlContent);
  console.log('ROC plot saved as roc_plot.html');
}

generateRocPlot().catch((error) => {
  console.error('Error generating ROC plot:', error);
});
