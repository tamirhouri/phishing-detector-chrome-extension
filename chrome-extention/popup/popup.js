async function getCurrentTab() {
  // can use also: chrome.tabs.query({ active: true, currentWindow: true })
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function showLoader() {
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = `<div class="loader"></div>`;
}

function updateExtentionElement(result) {
  const { isURL, isContent, details } = result;
  const isPhishing = isURL || isContent;

  const resultEl = document.getElementById('result');

  resultEl.innerHTML = `
    <div class="detection-results">
      <div class="result-item ${isURL ? 'phishing' : 'safe'}">
        <span class="result-icon">${isURL ? '⚠️' : '✅'}</span>
        <span class="result-text">URL Detector</span>
      </div>
      <div class="result-item ${isContent ? 'phishing' : 'safe'}">
        <span class="result-icon">${isContent ? '⚠️' : '✅'}</span>
        <span class="result-text">Content Detector</span>
      </div>
    </div>
    <div class="result-details ${isPhishing ? 'phishing' : 'safe'}">
      <p>${details}</p>
    </div>
  `;
}

function updateExtentionElementError(error) {
  console.error(error);
  document.getElementById('result').textContent = "Error retrieving classification";
}

function extractFeatures(url) {
  return [
    url.length,
    url.includes('@') ? 1 : 0,
    (url.match(/\./g) || []).length,
    url.includes('-') ? 1 : 0,
    url.startsWith('https') ? 1 : 0,
    new URL(url).hostname.length
  ];
}

function createDummyModel() {
  const model = tf.sequential();
  model.add(tf.layers.dense({
    units: 1,
    inputShape: [6],
    activation: 'sigmoid',
    useBias: true,
    weights: [
      tf.tensor2d([[0.01], [0.5], [0.05], [-0.1], [0.2], [-0.01]]),  // weights for 6 features
      tf.tensor1d([0])  // bias
    ]
  }));
  return model;
}

async function handlePhishingPrediction() {
  showLoader();

  const currentTab = await getCurrentTab();

  if (!currentTab) {
    updateExtentionElementError("No active tab found.");
    return;
  }

  const url = currentTab.url;
  const features = extractFeatures(url);
  const model = createDummyModel();

  const input = tf.tensor2d([features]);
  const prediction = model.predict(input);
  const score = prediction.dataSync()[0];

  console.log("Prediction score:", score);

  console.log("currentTabId", currentTab.id)

  chrome.tabs.sendMessage(currentTab.id, { action: 'GetPrediction' }, (response) => {
    if (chrome.runtime.lastError) {
      updateExtentionElementError(chrome.runtime.lastError.message);
      return;
    }

    updateExtentionElement(response.result);
  });
}

function initializeEventListeners() {
  const refreshButton = document.getElementById('refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', handlePhishingPrediction);
  } else {
    console.error("Refresh button not found in the DOM.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  handlePhishingPrediction();
  initializeEventListeners();
});