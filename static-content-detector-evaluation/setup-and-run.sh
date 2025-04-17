#!/bin/bash

echo "📦 Installing dependencies..."
npm install puppeteer

echo "🚀 Running static phishing detector evaluation..."
node evaluate-static-content-detector.js

echo "🖼️ Generating HTML report..."
node generate-report.js

echo "📂 Opening static_report.html..."
open static_report.html || xdg-open static_report.html || start static_report.html
