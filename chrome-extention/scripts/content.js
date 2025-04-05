async function getPhishingPrediction() {
  const urlDetectormodule = await import(chrome.runtime.getURL("phishing-detectors/url-detector.js"));
  const staticContentDetectormodule = await import(chrome.runtime.getURL("phishing-detectors/static-content-detector.js"));

  const { UrlDetector } = urlDetectormodule;
  const { StaticContentDetector } = staticContentDetectormodule;

  const urlDetector = new UrlDetector();
  const staticContentDetector = new StaticContentDetector();

  const isURL = urlDetector.predict() === 1;
  const isContent = staticContentDetector.predict() === 1;

  const isPhishing = isURL || isContent;

  return {
    isURL,
    isContent,
    details: isPhishing ? "This page may be a phishing attempt." : "This page seems safe."
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponese) => {
  if (request.action === 'GetPrediction') {
    getPhishingPrediction()
      .then(result => {
        sendResponese({ result });
      })
  }

  return true; // Keep the message channel open for sendResponese
});
