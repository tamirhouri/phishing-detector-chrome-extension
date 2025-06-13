#!/bin/bash

echo "📦 Installing dependencies..."
npm install csv-parser puppeteer http fs path get-port nodeplotlib

echo "🚀 Running phishing detector evaluation..."
node evaluate-detectors.js

echo "📊 Merging results..."
node merge-results.js

echo "📊 Running ROC AUC test..."
node evaluate-roc-auc.js

echo "📊 Generating ROC plot..."
node generate-roc-plot.js

echo "🖼️ Generating HTML report..."
node generate-report.js

echo "📂 Opening generated/report.html..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  open generated/report.html
else
  xdg-open generated/report.html || start generated/report.html
fi

echo "✅ Done!"