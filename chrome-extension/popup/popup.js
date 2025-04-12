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

function updateExtensionElement(result) {
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

function updateExtensionElementError(error) {
  console.error(error);

  const resultEl = document.getElementById('result');
  resultEl.innerHTML = `
    <div class="error-message">
      <span class="error-icon">❌</span>
      <span class="error-text">${error || 'An unknown error occurred.'}</span>
    </div>
  `;
}

async function handlePhishingPrediction() {
  showLoader();

  const currentTab = await getCurrentTab();

  if (!currentTab) {
    updateExtensionElementError("No active tab found.");
    return;
  }

  console.log("currentTabId", currentTab.id)
  console.log("GET_PREDICTION message sent from popup.js to content.js")

  chrome.tabs.sendMessage(currentTab.id, { action: 'GET_PREDICTION' }, (response) => {
    console.log("GET_PREDICTION response received in popup.js", response);
    if (chrome.runtime.lastError) {
      updateExtensionElementError(chrome.runtime.lastError.message);
      return;
    }

    if (!response || response.result.isError) {
      updateExtensionElementError(response.details);
      return;
    }

    updateExtensionElement(response.result);
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
