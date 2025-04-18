import * as tf from '../libs/tf.es2017.min.js';
import { UrlDetector } from '../phishing-detectors/url-detector/url-detector.js';


let urlDetector = null;

chrome.runtime.onInstalled.addListener(async () => {
    console.log("[background script] Installing Phishing Detection Extension...");

    urlDetector = new UrlDetector()
    await urlDetector.load().then(() => {
        console.log("[background script] UrlDetector loaded successfully.");
    })
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'PREDICT_URL') {
        console.log("[background script] PREDICT_URL message received", message);
        if (!urlDetector) {
            sendResponse({ status: 'FAIL', error: 'UrlDetector failed to load' });
            return;
        }

        // TODO: REMOVE ALL PERFORMANCE RELATED LOGS
        const startTime = performance.now();
        urlDetector.predict(message.url).then((score) => {
            const endTime = performance.now();
            console.log("[background script] url-detector prediction score:", score);
            console.log("[background script] URL prediction time:", endTime - startTime, "ms");
            sendResponse({ status: 'SUCCESS', score });
        }).catch((error) => {
            console.error('Error during prediction:', error);
            sendResponse({ status: 'FAIL', error: 'Prediction failed' });
        });
    }

    return true; // Keep the message channel open for sendResponse
});