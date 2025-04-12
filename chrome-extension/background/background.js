import * as tf from '../libs/tf.es2017.min.js';
import { UrlDetectorModel } from '../phishing-detectors/url-detector/url-detector-model.js';
// import { ContentDetectorModel } from '../phishing-detectors/static-content-detector/static-content-detector.js';

// TODO: Delete this before the final release
// This is a workaround to keep the background script alive
// and prevent it from being unloaded by Chrome.
setInterval(() => console.log('Keep alive'), 10000);

let urlDetectorModel = new UrlDetectorModel();
// let contentDetectorModel = new ContentDetectorModel();


chrome.runtime.onInstalled.addListener(async () => {
    console.log("Installing Phishing Detection Extension...");

    await Promise.all([
        urlDetectorModel.load(),
        // contentDetectorModel.load()
    ]);

    console.log("Phishing Detection Extension installed.");
});

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === 'PREDICT_URL') {
        console.log("PREDICT_URL message received in background.js", message);
        if (!urlDetectorModel) {
            sendResponse({ status: 'FAIL', error: 'Model failed to load' });
            return;
        }

        try {
            const score = urlDetectorModel.predict(message.url);
            console.log("Prediction score:", score);
            sendResponse({ status: 'SUCCESS', score });
        } catch (error) {
            console.error('Error during prediction:', error);
            sendResponse({ status: 'FAIL', error: 'Prediction failed' });
        }
    }
    else if (message.action === 'PREDICT_CONTENT') {
        console.log("PREDICT_CONTENT message received in background.js", message);
        sendResponse({ status: 'SUCCESS', score: Math.random() });
    }

    return true; // Keep the message channel open for sendResponse
});