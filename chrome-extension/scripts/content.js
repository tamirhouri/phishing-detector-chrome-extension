const DEBUG = true; // Set to false in production

COMBINED_LR_PARAMS = {
  weights: [5.6314, 4.6967],
  bias: -3.2016,
  PHISHING_THRESHOLD: 0.4766,
};

const staticContentDetector = new StaticContentDetector();
const urlDetector = new UrlDetector();

function logExecutionTime(fn, fnName) {
  return async function (...args) {
    const startTime = performance.now();
    const result = await fn.apply(this, args);
    const endTime = performance.now();
    console.log(
      `[metrics] ${fnName} executed in ${(endTime - startTime).toFixed(2)} ms`
    );
    return result;
  };
}

if (DEBUG) {
  // Wrap the methods in the StaticContentDetector and UrlDetector classes with metrics in debug mode
  urlDetector.load = logExecutionTime(urlDetector.load, 'urlDetector.load');
  urlDetector.warmup = logExecutionTime(
    urlDetector.warmup,
    'urlDetector.warmup'
  );
  getUrlPrediction = logExecutionTime(getUrlPrediction, 'getUrlPrediction');
  getContentPrediction = logExecutionTime(
    getContentPrediction,
    'getContentPrediction'
  );
} else {
  // Disable all logging in production
  console.log = function () {};
}

(async function initialize() {
  await urlDetector.load();
  urlDetector.warmup();
})();

async function getContentPrediction() {
  console.log(
    '[content script] Predicting content using StaticContentDetector'
  );
  const prediction = staticContentDetector.predict();

  if (prediction === null || prediction === undefined) {
    console.error('[content script] Error during content prediction.');
    return { status: 'FAIL', error: 'Content prediction failed' };
  }

  console.log(
    '[content script] Content prediction score:',
    prediction.score,
    prediction.reasons
  );
  return { status: 'SUCCESS', ...prediction };
}

async function getUrlPrediction() {
  console.log('[content script] Predicting URL using UrlDetector');
  const prediction = urlDetector.predict();

  if (prediction === null || prediction === undefined) {
    console.error('[content script] Error during URL prediction.');
    return { status: 'FAIL', error: 'URL prediction failed' };
  }

  console.log('[content script] URL prediction score:', prediction.score);
  return { status: 'SUCCESS', ...prediction };
}

async function getPhishingPrediction() {
  const [urlPrediction, contentPrediction] = await Promise.all([
    getUrlPrediction(),
    getContentPrediction(),
  ]);

  if (urlPrediction.status === 'FAIL' || contentPrediction.status === 'FAIL') {
    console.error(
      '[content script] Error retrieving predictions:',
      urlPrediction.error || contentPrediction.error
    );
    return { isError: true, details: 'Error retrieving predictions.' };
  }

  const isURL = urlPrediction.score > UrlDetector.PHISHING_THRESHOLD;
  const isContent =
    contentPrediction.score > StaticContentDetector.PHISHING_THRESHOLD;

  const combinedScore = sigmoid(
    COMBINED_LR_PARAMS.weights[0] * urlPrediction.score +
      COMBINED_LR_PARAMS.weights[1] * contentPrediction.score +
      COMBINED_LR_PARAMS.bias
  );
  
  const isCombinedPhishing =
    combinedScore > COMBINED_LR_PARAMS.PHISHING_THRESHOLD;

  const isPhishing = isURL === isContent ? isURL : isCombinedPhishing;

  return {
    isURL,
    urlPredictionScore: urlPrediction.score,
    isContent,
    contentPredictionScore: contentPrediction.score,
    isCombinedPhishing,
    combinedScore,
    isPhishing,
    details: isPhishing
      ? 'This page may be a phishing attempt.'
      : 'This page seems safe.',
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PREDICTION') {
    console.log('[content script] GET_PREDICTION message received', request);
    getPhishingPrediction().then((result) => {
      sendResponse({ result });
    });
  }

  return true; // Keep the message channel open for sendResponse
});
