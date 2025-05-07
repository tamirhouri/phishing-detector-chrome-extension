class StackedPhishingClassifier {
  static LR_PARAMS = {
    weights: [5.6314, 4.6967],
    bias: -3.2016,
  };

  static PHISHING_THRESHOLD = 0.4766;

  predict(urlPrediction, contentPrediction) {
    const features = [urlPrediction.score, contentPrediction.score];

    const linearCombination = features.reduce(
      (sum, x_i, i) =>
        sum + x_i * StackedPhishingClassifier.LR_PARAMS.weights[i],
      StackedPhishingClassifier.LR_PARAMS.bias
    );

    const score = this._sigmoid(linearCombination);

    return {
      score,
      verdict: score > StackedPhishingClassifier.PHISHING_THRESHOLD,
    };
  }

  _sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
}
