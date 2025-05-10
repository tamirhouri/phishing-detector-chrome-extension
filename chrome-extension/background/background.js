import { UrlDetector } from '../phishing-detectors/url-detector/url-detector.js';

let urlDetector = null;

async function initUrlDetector() {
  if (!urlDetector) {
    urlDetector = new UrlDetector();
    await urlDetector.load();
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await initUrlDetector();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PREDICT_URL') {
    initUrlDetector()
      .then(() => {
        return urlDetector.predict(message.url);
      })
      .then((prediction) => {
        sendResponse({ status: 'SUCCESS', ...prediction });
      })
      .catch((error) => {
        sendResponse({ status: 'FAIL', error: error.message });
      });
  }

  return true; // Keep the message channel open for sendResponse
});
