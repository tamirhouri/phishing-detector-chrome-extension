# 🛡️ Phishing Detector Evaluation Tool

This project evaluates phishing detection models using both DOM content features (StaticContentDetector) and URL features (UrlDetector). 
It processes a labeled dataset of URLs and HTML content, calculates metrics, generates visual reports, and creates a dynamic dashboard for analysis.

---

## 📁 Files

| File                          | Purpose |
|-------------------------------|---------|
| `setup-and-run.sh`            | One-click install + evaluation + report launcher |
| `evaluate-detectors.js`      | Evaluates phishing detection models on a dataset of URLs and HTML content |
| `evaluate-roc-auc.js`        | Runs a ROC AUC test to determine the best threshold for classification |
| `generate-roc-plot.js`       | Generates an interactive ROC curve plot for both detectors |
| `generate-report.js`         | Builds a clean HTML report showing scores, ROC curve plots and explanations |

---

## 📥 Setup

### 1. Clone or download the project

Make sure your project includes the Chrome extension, `StaticContentDetector`, and `UrlDetector`.

### 2. Add your labeled dataset

Ensure your labeled dataset is available in `detectors-evaluation/data/index.csv`. This file should contain the required data for evaluation.

### 3. Run the file `setup-and-run.sh` with:

```bash
./setup-and-run.sh
```

---

## 🛠️ How It Works

1. **Site Evaluation**: The tool evaluates each site listed in `data/index.csv` using both StaticContentDetector and UrlDetector.
2. **Metrics Calculation**: It calculates metrics such as accuracy, precision, recall, and F1-score for each detector.
3. **ROC Curve and Plots**: Generates ROC curves and plots for both detectors to visualize their performance.
4. **Dynamic Dashboard**: Creates a dynamic dashboard for interactive analysis of the results.

---

## 🤖 Built with AI

This tool was developed using an AI agent powered by GPT-4o, utilizing the GitHub Copilot extension. The AI-assisted development process ensured efficient and accurate implementation of all features.

---

## 🧑‍💻 How to Use

1. **Prepare the Dataset**: Ensure that your dataset is in `detectors-evaluation/data/index.csv`. The dataset should include labeled URLs and corresponding HTML files in the `dataset-part-*` directories.

2. **Run the Evaluation**: Execute the `setup-and-run.sh` script to install dependencies, evaluate detectors, merge results, calculate metrics, and generate reports.

3. **View Results**:
   - **Merged Results**: Check `detectors-evaluation/generated/results.json` for the combined evaluation results.
   - **ROC Curve Data**: View `content_roc_curve_data.json` and `url_roc_curve_data.json` for ROC curve details.
   - **ROC Plot**: Open `roc_plot.html` for an interactive visualization of the ROC curves.
   - **HTML Report**: Open `report.html` for a detailed evaluation report.

4. **Dynamic Dashboard**: Use the generated data to create a dynamic dashboard for further analysis.

### 4. View the Outputs

After running the `setup-and-run.sh` script, the following output files will be generated in the `detectors-evaluation/generated/` directory:

- **`results.json`**: Contains the merged evaluation results from all dataset parts.
- **`content_roc_auc_results.json`**: Stores the best threshold and metrics for the StaticContentDetector.
- **`url_roc_auc_results.json`**: Stores the best threshold and metrics for the UrlDetector.
- **`content_roc_curve_data.json`**: Contains the ROC curve data points for the StaticContentDetector.
- **`url_roc_curve_data.json`**: Contains the ROC curve data points for the UrlDetector.
- **`roc_plot.html`**: An interactive HTML file visualizing the ROC curves for both detectors.
- **`report.html`**: A detailed HTML report summarizing the evaluation results and metrics.

These files provide insights into the performance of the phishing detection models and can be used for further analysis.

---

## 📂 Directory Structure

- `detectors-evaluation/data/`: Contains the dataset and labeled data.
- `detectors-evaluation/generated/`: Stores generated results, plots, and reports.
- `detectors-evaluation/scripts/`: Includes utility scripts for additional processing.
- `chrome-extension/`: Contains the Chrome extension and detector implementations.
