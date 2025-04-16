const URL_PREDICTION_THRESHOLD = 0.5;
const CONTENT_PREDICTION_THRESHOLD = 0.5;

const staticContentDetector = new StaticContentDetector();

async function getContentPrediction() {
  console.log("[content script] Predicting content using StaticContentDetector")
  const prediction = staticContentDetector.predict();

  if (prediction === null || prediction === undefined) {
    console.error("[content script] Error during content prediction.");
    return { status: 'FAIL', error: 'Content prediction failed' };
  }

  console.log("[content script] Content prediction score:", prediction.score, prediction.reasons);
  return { status: 'SUCCESS', ...prediction };
}

async function getUrlPrediction() {
  console.log("[content script] Sending PREDICT_URL message to background script")
  return chrome.runtime.sendMessage({ action: 'PREDICT_URL', url: location.href });
}

async function getPhishingPrediction() {
  const [urlPrediction, contentPrediction] = await Promise.all([
    getUrlPrediction(),
    getContentPrediction()
  ]);

  if (urlPrediction.status === 'FAIL' || contentPrediction.status === 'FAIL') {
    console.error('[content script] Error retrieving predictions:', urlPrediction.error || contentPrediction.error);
    return { isError: true, details: "Error retrieving predictions." };
  }

  const isURL = urlPrediction.score > URL_PREDICTION_THRESHOLD;
  const isContent = contentPrediction.score > CONTENT_PREDICTION_THRESHOLD

  const isPhishing = isURL || isContent;

  return {
    isURL,
    isContent,
    details: isPhishing ? "This page may be a phishing attempt." : "This page seems safe."
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PREDICTION') {
    console.log("[content script] GET_PREDICTION message received", request);
    getPhishingPrediction()
      .then(result => {
        sendResponse({ result });
      })
  }

  return true; // Keep the message channel open for sendResponse
});
