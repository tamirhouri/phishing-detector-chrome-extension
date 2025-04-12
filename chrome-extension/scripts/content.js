const URL_PREDICTION_THRESHOLD = 0.5;
const CONTENT_PREDICTION_THRESHOLD = 0.5;

async function getUrlPrediction() {
  console.log("PREDICT_URL message sent from content.js to background.js")
  return chrome.runtime.sendMessage({ action: 'PREDICT_URL', url: window.location.href });
}

async function getContentPrediction() {
  console.log("PREDICT_CONTENT message sent from content.js to background.js")
  return chrome.runtime.sendMessage({ action: 'PREDICT_CONTENT', content: document.body.innerText });
}

async function getPhishingPrediction() {
  const [urlPrediction, contentPrediction] = await Promise.all([
    getUrlPrediction(),
    getContentPrediction()
  ]);

  if (urlPrediction.status === 'FAIL' || contentPrediction.status === 'FAIL') {
    console.error('Error retrieving predictions:', urlPrediction.error || contentPrediction.error);
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
    console.log("GET_PREDICTION message received in content.js", request);
    getPhishingPrediction()
      .then(result => {
        sendResponse({ result });
      })
  }

  return true; // Keep the message channel open for sendResponse
});
