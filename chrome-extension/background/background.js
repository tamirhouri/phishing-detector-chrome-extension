import * as tf from '../libs/tf.es2017.min.js';
import { UrlDetector } from '../phishing-detectors/url-detector/url-detector.js';


let urlDetector = new UrlDetector();
// let contentDetectorModel = new ContentDetectorModel();

chrome.runtime.onInstalled.addListener(async () => {
    console.log("[background script] Installing Phishing Detection Extension...");

    await Promise.all([
        urlDetector.load(),
        // contentDetectorModel.load()
    ]);

    console.log("[background script] Phishing Detection Extension installed.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'PREDICT_URL') {
        console.log("[background script] PREDICT_URL message received", message);
        if (!urlDetector) {
            sendResponse({ status: 'FAIL', error: 'Model failed to load' });
            return;
        }

        urlDetector.predict(message.url).then((score) => {
            console.log("[background script] url-detector prediction score:", score);
            sendResponse({ status: 'SUCCESS', score });
        }).catch((error) => {
            console.error('Error during prediction:', error);
            sendResponse({ status: 'FAIL', error: 'Prediction failed' });
        });
    }
    else if (message.action === 'PREDICT_CONTENT') {
        console.log("[background script] PREDICT_CONTENT message received", message);
        sendResponse({ status: 'SUCCESS', score: 0.3 });
    }

    return true; // Keep the message channel open for sendResponse
});