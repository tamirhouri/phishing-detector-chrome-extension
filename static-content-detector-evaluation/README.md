# 🛡️ StaticContentDetector Evaluation Tool

This project runs a phishing detection model using DOM content features, evaluates it against a labeled dataset of URLs, and generates a visual report.

---

## 📁 Files

| File                          | Purpose |
|-------------------------------|---------|
| `urls.json`                   | List of URLs to scan, with ground-truth labels |
| `evaluate-static-content-detector.js` | Loads each URL, runs detection in a headless browser, logs predictions |
| `generate-report.js`          | Builds a clean HTML report showing scores + explanations |
| `setup-and-run.sh`            | One-click install + evaluation + report launcher |
| `static_content_results.json` | Results saved from detection run |
| `static_content_metrics.json` | Evaluation metrics (accuracy, precision, recall, etc.) |
| `static_report.html`          | Clickable report for visual inspection |
| `evaluate-roc-auc.js`             | Runs a ROC AUC test to determine the best threshold for classification |
| `generate-roc-plot.js`        | Generates an HTML file to visualize the ROC curve using Chart.js |

---

## 📥 Setup

### 1. Clone or download the project

Make sure your project includes the Chrome extension and `StaticContentDetector`.

### 2. Add your labeled dataset

Edit `urls.json` like this:

```json
[
  { "url": "https://example.com", "label": "benign" },
  { "url": "https://phishing.test", "label": "phishing" }
]
```

### 3. Run the file `setup-and-run.sh` with:

```bash
./setup-and-run.sh
```
