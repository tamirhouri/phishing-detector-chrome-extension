import { UrlFeaturesExtractor } from './url-feature-extractor.js';

export class UrlDetector {

  constructor() {
    this.model = null;
  }

  async load() {
    console.log("[url detector class] Loading model..", tf);
    const startTime = performance.now();

    try {
      this.model = await tf.loadGraphModel(chrome.runtime.getURL('phishing-detectors/url-detector/model.json'));
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      console.log(`[url detector class] Model loaded successfully in ${loadTime} ms`);
    } catch (error) {
      console.error("[url detector class] Error loading model:", error);
    }
  }

  async predict(url) {
    console.log("[url detector class] Predicting URL:", url);
    if (!this.model) {
      console.error("[url detector class] Model is not loaded");
      return null;
    }

    try {
      const features = this.extractFeatures(url);
      const input = tf.tensor2d(features, [1, features.length]);
      const prediction = this.model.predict(input);
      const score = prediction.dataSync()[0];
      console.log("[url detector class] Prediction score:", score);
      return score;
    } catch (error) {
      console.error("[url detector class] Error during prediction:", error);
      return null;
    }
  }

  extractFeatures(url) {
    const featuresExtractor = new UrlFeaturesExtractor(url);

    // return [
    //   featuresExtractor.isHttps(),
    //   featuresExtractor.usesSuspiciousTLD(),
    //   featuresExtractor.usesIPAddress(),
    //   featuresExtractor.urlLength(),
    //   featuresExtractor.hostnameLength(),
    //   featuresExtractor.pathLength(),
    //   featuresExtractor.queryLength(),
    //   featuresExtractor.hashLength(),
    //   featuresExtractor.dotCount(),
    //   featuresExtractor.hyphenCount(),
    // ];

    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Placeholder for actual feature extraction
  }

}
