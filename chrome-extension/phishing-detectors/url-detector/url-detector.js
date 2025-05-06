class UrlDetector {
  static PHISHING_THRESHOLD = 0.33;

  constructor() {
    this.model = null;
  }

  async load(modelUrl = null) {
    try {
      const url =
        modelUrl ||
        chrome.runtime.getURL('phishing-detectors/url-detector/model.json');
      this.model = await tf.loadGraphModel(url);
    } catch (error) {
      console.error('[url detector class] Error loading model:', error);
    }
  }

  warmup() {
    try {
      const dummyFeatures = this.extractFeatures('www.dummy.com');
      const dummyInput = tf.tensor2d(dummyFeatures, [1, dummyFeatures.length]);
      this.model.predict(dummyInput);
    } catch (error) {
      console.error('[url detector class] Error during model warmup:', error);
    }
  }

  predict(url = location.href) {
    try {
      const features = this.extractFeatures(url);
      const input = tf.tensor2d(features, [1, features.length]);

      const prediction = this.model.predict(input);
      const score = prediction.dataSync()[0];

      return { score };
    } catch (error) {
      console.error(
        `[url detector class] Error during prediction for: ${url}`,
        error
      );
      return null;
    }
  }

  extractFeatures(url) {
    const featuresExtractor = new UrlFeaturesExtractor(url);
    const features = featuresExtractor.extractAllFeatures();

    return [
      features.urlLength,
      features.subdomainLength,
      features.mainDomainLength,
      features.dotCount,
      features.hyphenCount,
      features.pathLength,
      features.isHttps,
      features.urlPathDepth,
      features.digitCount,
      features.tokenCount,
      features.encodedCharCount,
      features.hasShorteningService,
      features.subdomainCount,
      features.uncommonTld,
      features.hasSuspiciousWords,
      features.containsBrandName,
    ];
  }
}
