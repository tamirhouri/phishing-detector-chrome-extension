# 🛡️ Phishing Detection Chrome Extension

A lightweight, **multi‑layered** browser extension that detects phishing attempts in real‑time by combining static URL analysis with dynamic content inspection – all on the user’s device, with **no external calls or blacklists**.

> ⚡ **Protects users before credentials are stolen, without slowing their browsing experience.**

---

## 📑 Table of Contents
- [Features](#features)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Development Setup](#development-setup)
- [Re‑training the Model](#re-training-the-model)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🚀 Features
| Layer | Technique | Highlights |
|-------|-----------|------------|
| **1. URL Detector** | TensorFlow.js model fed with 25 handcrafted URL features | • <1 ms inference<br>• Works offline<br>• Catches homograph & look‑alike domains |
| **2. Static Content Detector** | Heuristic + ML rules on DOM elements (forms, scripts, anchors) | • Flags mismatched links & suspicious JS<br>• Runs after `DOMContentLoaded` |
| **3. (Optional) Dynamic Behavior** | Monitors late redirects & injected resources | • Detects deferred attacks |

*Detection decision is a logical OR between layers with configurable weights & thresholds.*

---

## 🛠️ How It Works
1. **Content Script** injects into every page, extracts URL + DOM features.
2. Features are **standard‑scaled** on the fly using mean/σ saved during Python training.
3. Prediction & heuristics are combined → result is sent back to the popup script.
4. **Popup UI** (HTML/CSS) shows a green “Safe ✅” or red “Phishing ⚠️” banner with details.

![image](https://github.com/user-attachments/assets/79d4a00d-9c4e-4585-a4d7-78cc0b6b527d)
![image](https://github.com/user-attachments/assets/451d233b-fe6d-490f-9541-6ea6a8f51e70)

---

## 📂 Project Structure
```
.
├── chrome-extension/
│   ├── popup/
│   │   ├── popup.js
│   │   ├── popup.css
│   │   └── popup.html
│   ├── libs/
│   │   └── tf.es2017.min.js
│   ├── scripts/
│   │   └── content.js
│   ├── phishing-detectors/
│   │   ├── url-detector/
│   │   │   ├── model.json
│   │   │   ├── group1-shard1of1.bin
│   │   │   ├── url-feature-extractor.js
│   │   │   └── url-detector.js
│   │   └── static-content-detector/
│   │       └── static-content-detector.js
│   └── manifest.json
├── static-content-detector-logistic-regression/
│   └── StaticContentDetector_Logistic_Regression.ipynb
├── url-detector-model/
│   └── PhishingDetectors.ipynb
├── detectors-evaluation/    # benchmarking scripts & generated metrics
│   ├── scripts/
│   ├── generated/
│   └── data/
├── package.json
├── package-lock.json
└── README.md
```

## 📦 Installation
### 1. From Source (Development)
```bash
git clone https://github.com/your-org/phishing-detection-extension.git
```
1. Open **Chrome** ➜ `chrome://extensions/` ➜ enable **Developer mode**
2. **Load unpacked** ➜ select `chrome-extension/` folder
3. A shield icon will appear in the toolbar.

### 2. Production Build
Download the latest `phishing-detection-extension.zip` from the [Releases](https://github.com/your-org/phishing-detection-extension/releases) page, then **Load unpacked** as above.

---

## 👀 Usage
- Browse as usual; the extension runs silently.
- Click the shield icon to open the popup and view the current page’s verdict.
- If a page is classified as phishing, a red banner appears with details (which detectors fired, key features, and recommended action).

---

## 🧑‍💻 Development Setup
> Requires **Node ≥18** only for dev tooling (eslint, prettier, hot‑reload); the extension itself is vanilla JS + TF.js.

```bash
# Optional: install dev dependencies
npm install
# Lint
npm run lint
# Format
npm run format
```
**Hot reload:** run `npm run watch` and refresh the extension in the Chrome Extensions page on every save.

---

## 🔄 Re‑training the Model
The original Keras notebook lives at `url-detector-model/PhishingDetectors.ipynb`.

1. Run all cells to train & evaluate.
2. Export for TensorFlow.js:
   ```bash
   tensorflowjs_converter --input_format=tf_saved_model url_model_tf chrome-extension/phishing-detectors/url-detector
   ```
3. Copy updated `mean.json` & `std.json` (feature scaler) next to the model.

---

## 🛠️ Troubleshooting
| Symptom | Fix |
|---------|-----|
| `Failed to fetch model.json` | Ensure `model.json` path is resolved via `chrome.runtime.getURL()` |
| `Improper config format` | Make sure you exported the model with `model.export("url_model_tf")` before conversion |
| Predictions look off | Verify that feature scaling (`mean`/`std`) matches the values in Python |
