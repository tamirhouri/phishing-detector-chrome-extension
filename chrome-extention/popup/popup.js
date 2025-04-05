async function getCurrentTabId() {
  // can use also: chrome.tabs.query({ active: true, currentWindow: true })
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab?.id;
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

async function handlePhishingPrediction() {
  showLoader();

  const currentTabId = await getCurrentTabId();

  if (!currentTabId) {
    updateExtentionElementError("No active tab found.");
    return;
  }

  console.log("currentTabId", currentTabId)

  chrome.tabs.sendMessage(currentTabId, { action: 'GetPrediction' }, (response) => {
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