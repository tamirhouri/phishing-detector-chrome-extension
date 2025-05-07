import { UrlDetector } from '../phishing-detectors/url-detector/url-detector.js';

const urlDetector = new UrlDetector();

chrome.runtime.onInstalled.addListener(async () => {
  await urlDetector.load();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'PREDICT_URL') {
    if (!urlDetector) {
      sendResponse({ status: 'FAIL', error: 'UrlDetector failed to load' });
      return;
    }

    urlDetector
      .predict(message.url)
      .then((prediction) => {
        sendResponse({ status: 'SUCCESS', ...prediction });
      })
      .catch((error) => {
        sendResponse({ status: 'FAIL', error: error.message });
      });
  }

  return true; // Keep the message channel open for sendResponse
});
