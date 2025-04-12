import { UrlFeaturesExtractor } from './url-feature-extractor.js';

export class UrlDetectorModel {

  constructor() {
    this.model = null;
  }

  async load() {
    console.log("Loading UrlDetectorModel...", tf);
    const startTime = performance.now();

    try {
      this.model = await tf.loadLayersModel(chrome.runtime.getURL('phishing-detectors/url-detector/model.json'));
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      console.log(`UrlDetectorModel loaded in ${loadTime} ms`);
    } catch (error) {
      console.error('Error loading model:', error);
    }
  }

  async predict(url) {
    console.log("predict called with URL:", url);
    if (!this.model) {
      console.error("UrlDetectorModel is not loaded yet.");
      return null;
    }

    try {
      const features = this.extractFeatures(url);
      const input = tf.tensor2d(features, [1, features.length]);
      const prediction = this.model.predict(input);
      const score = prediction.dataSync()[0];
      console.log("Prediction score:", score);
      return score;
    } catch (error) {
      console.error('Error during prediction:', error);
      return null;
    }
  }

  extractFeatures(url) {
    const featuresExtractor = new UrlFeaturesExtractor(url);

    return [
      featuresExtractor.isHttps(),
      featuresExtractor.usesSuspiciousTLD(),
      featuresExtractor.usesIPAddress(),
      featuresExtractor.urlLength(),
      featuresExtractor.hostnameLength(),
      featuresExtractor.pathLength(),
      featuresExtractor.queryLength(),
      featuresExtractor.hashLength(),
      featuresExtractor.dotCount(),
      featuresExtractor.hyphenCount(),
    ];
  }

}
