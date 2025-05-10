const DEBUG = false; // Set to true only for debugging

if (DEBUG) {
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

  getUrlPrediction = logExecutionTime(getUrlPrediction, 'getUrlPrediction');
  getContentPrediction = logExecutionTime(
    getContentPrediction,
    'getContentPrediction'
  );
}

const staticContentDetector = new StaticContentDetector();
const stackedPhishingClassifier = new StackedPhishingClassifier();

async function getContentPrediction() {
  const prediction = staticContentDetector.predict();

  if (prediction === null || prediction === undefined) {
    console.error('[content script] Error during content prediction.');
    return { status: 'FAIL', error: 'Content prediction failed' };
  }

  return { status: 'SUCCESS', ...prediction };
}

async function getUrlPrediction() {
  return chrome.runtime.sendMessage({
    action: 'PREDICT_URL',
    url: location.href,
  });
}

async function getPhishingPrediction() {
  const [urlPrediction, contentPrediction] = await Promise.all([
    getUrlPrediction(),
    getContentPrediction(),
  ]);

  if (urlPrediction.status === 'FAIL' || contentPrediction.status === 'FAIL') {
    return { isError: true, details: 'Error retrieving predictions.' };
  }

  const stackedPrediction = stackedPhishingClassifier.stack(
    urlPrediction,
    contentPrediction
  );

  const isPhishing =
    urlPrediction.verdict === contentPrediction.verdict
      ? urlPrediction.verdict
      : stackedPrediction.verdict;

  const details = isPhishing
    ? 'This page may be a phishing attempt.'
    : 'This page seems safe.';

  return {
    isURL: urlPrediction.verdict,
    urlPredictionScore: urlPrediction.score,
    isContent: contentPrediction.verdict,
    contentPredictionScore: contentPrediction.score,
    isStackedPhishing: stackedPrediction.verdict,
    stackedScore: stackedPrediction.score,
    isPhishing,
    details,
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PREDICTION') {
    getPhishingPrediction().then((result) => {
      sendResponse({ result });
    });
  }

  return true; // Keep the message channel open for sendResponse
});
