const DEBUG = true; // Set to false in production

function logExecutionTime(fn, fnName) {
  return async function (...args) {
    const startTime = performance.now();
    const result = await fn.apply(this, args);
    const endTime = performance.now();
    console.log(
      `[metrics] ${fnName} executed in ${(endTime - startTime).toFixed(2)} ms`
    );
    return result;
  };
}

if (DEBUG) {
  handlePhishingPrediction = logExecutionTime(
    handlePhishingPrediction,
    'handlePhishingPrediction'
  );
} else {
  // Disable all logging in production
  console.log = function () {};
}

async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function showLoader() {
  const resultEl = document.getElementById('result');
  resultEl.innerHTML = `<div class="loader"></div>`;
}

function updateExtensionElement(result) {
  const {
    isURL,
    urlPredictionScore,
    isContent,
    contentPredictionScore,
    isCombinedPhishing,
    combinedScore,
    isPhishing,
    details,
  } = result;
  const resultEl = document.getElementById('result');

  const combinedResultHTML =
    isURL !== isContent
      ? `<div class="result-item ${isCombinedPhishing ? 'phishing' : 'safe'}">
         <span class="result-icon">${isCombinedPhishing ? '⚠️' : '✅'}</span>
         <span class="result-text">Tie-break</span>
         <span class="result-score">${(combinedScore * 100).toFixed(2)}%</span>
       </div>`
      : '';

  resultEl.innerHTML = `
    <div class="detection-results">
      <div class="result-item ${isURL ? 'phishing' : 'safe'}">
        <span class="result-icon">${isURL ? '⚠️' : '✅'}</span>
        <span class="result-text">URL Detector</span>
        <span class="result-score">${(urlPredictionScore * 100).toFixed(
          2
        )}%</span>
      </div>
      <div class="result-item ${isContent ? 'phishing' : 'safe'}">
        <span class="result-icon">${isContent ? '⚠️' : '✅'}</span>
        <span class="result-text">Content Detector</span>
        <span class="result-score">${(contentPredictionScore * 100).toFixed(
          2
        )}%</span>
      </div>
      ${combinedResultHTML}
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
    updateExtensionElementError('No active tab found.');
    return;
  }

  console.log(
    '[popup script] GET_PREDICTION message sent to content script with currentTabId',
    currentTab.id
  );

  chrome.tabs.sendMessage(
    currentTab.id,
    { action: 'GET_PREDICTION' },
    (response) => {
      console.log('[popup script] GET_PREDICTION response received', response);
      if (chrome.runtime.lastError) {
        updateExtensionElementError(chrome.runtime.lastError.message);
        return;
      }

      if (!response || response.result.isError) {
        updateExtensionElementError(response.details);
        return;
      }

      updateExtensionElement(response.result);
    }
  );
}

function initializeEventListeners() {
  const refreshButton = document.getElementById('refresh');
  if (refreshButton) {
    refreshButton.addEventListener('click', handlePhishingPrediction);
  } else {
    console.error('[popup script] Refresh button not found in the DOM.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  handlePhishingPrediction();
  initializeEventListeners();
});
