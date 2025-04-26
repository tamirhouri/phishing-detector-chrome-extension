class UrlDetector {

  static PHISHING_THRESHOLD = 0.5;

  constructor() {
    this.model = null;
  }

  async load(modelUrl = null) {
    try {
      const url =
        modelUrl ||
        chrome.runtime.getURL('phishing-detectors/url-detector/model.json');
      console.log(`[url detector class] Loading model from: ${url}`);
      this.model = await tf.loadGraphModel(url);
      console.log('[url detector class] Model loaded successfully');
    } catch (error) {
      console.error('[url detector class] Error loading model:', error);
    }
  }

  warmup() {
    if (!this.model) {
      console.error('[url detector class] Model is not loaded');
      return;
    }
    try {
      const dummyFeatures = this.extractFeatures('www.dummy.com');
      const dummyInput = tf.tensor2d(dummyFeatures, [1, dummyFeatures.length]);
      this.model.predict(dummyInput);
    } catch (error) {
      console.error('[url detector class] Error during model warmup:', error);
    }
  }

  predict(url = location.href) {
    console.log(`[url detector class] Predicting URL: ${url}`);

    if (!this.model) {
      console.error('[url detector class] Model is not loaded');
      return null;
    }

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
      features.queryLength,
      features.hasRedirection,
      features.urlPathDepth,
      features.digitCount,
      features.tokenCount,
      features.encodedCharCount,
      features.hasShorteningService,
      features.hasIpAddress,
      features.subdomainCount,
      features.uncommonTld,
      features.hasSuspiciousWords,
      features.containsBrandName,
    ];
  }
}
