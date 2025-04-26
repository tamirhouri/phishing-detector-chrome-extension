import fs from 'fs/promises';

function getRocCurve(yTrue, yScores) {
    const data = yTrue.map((label, i) => ({ label, score: yScores[i] }));
    data.sort((a, b) => b.score - a.score); // descending score

    const thresholds = [...new Set(data.map(d => d.score))];
    const roc = [];

    for (const threshold of thresholds) {
        let tp = 0, fp = 0, tn = 0, fn = 0;

        for (const { label, score } of data) {
            const predicted = score >= threshold ? 1 : 0;
            if (label === 1 && predicted === 1) tp++;
            else if (label === 1 && predicted === 0) fn++;
            else if (label === 0 && predicted === 1) fp++;
            else if (label === 0 && predicted === 0) tn++;
        }

        const tpr = tp / (tp + fn || 1);
        const fpr = fp / (fp + tn || 1);
        const accuracy = (tp + tn) / (tp + fp + tn + fn || 1);
        const precision = tp / (tp + fp || 1);
        const recall = tpr;
        const f1 = 2 * (precision * recall) / (precision + recall || 1);

        roc.push({ threshold, tpr, fpr, tp, fp, tn, fn, accuracy, precision, recall, f1 });
    }

    return roc;
}

async function runRocAucTest() {
    const results = JSON.parse(await fs.readFile('./generated/results.json', 'utf-8'));

    const staticContentYTrue = results.map(r => r.label === 'phishing' ? 1 : 0);
    const staticContentYScores = results.map(r => r.staticContentScore || 0);

    const urlYTrue = results.map(r => r.label === 'phishing' ? 1 : 0);
    const urlYScores = results.map(r => r.urlScore || 0);

    const staticContentRocCurve = getRocCurve(staticContentYTrue, staticContentYScores);
    const urlRocCurve = getRocCurve(urlYTrue, urlYScores);

    const staticContentBest = staticContentRocCurve.reduce((best, current) => {
        return current.accuracy > best.accuracy ? current : best;
    }, { accuracy: 0 });

    const urlBest = urlRocCurve.reduce((best, current) => {
        return current.accuracy > best.accuracy ? current : best;
    }, { accuracy: 0 });

    console.log(`StaticContentDetector - 
        Best Threshold: ${staticContentBest.threshold}, Best Accuracy: ${staticContentBest.accuracy}
        TP: ${staticContentBest.tp}, FP: ${staticContentBest.fp}, TN: ${staticContentBest.tn}, FN: ${staticContentBest.fn}, 
        Precision: ${staticContentBest.precision}, Recall: ${staticContentBest.recall}, F1: ${staticContentBest.f1}`);
    console.log(`UrlDetector - 
        Best Threshold: ${urlBest.threshold}, Best Accuracy: ${urlBest.accuracy}
        TP: ${urlBest.tp}, FP: ${urlBest.fp}, TN: ${urlBest.tn}, FN: ${urlBest.fn}
        Precision: ${urlBest.precision}, Recall: ${urlBest.recall}, F1: ${urlBest.f1}`);

    await fs.writeFile('./generated/content_roc_auc_results.json', JSON.stringify(staticContentBest, null, 2));
    await fs.writeFile('./generated/url_roc_auc_results.json', JSON.stringify(urlBest, null, 2));

    await fs.writeFile('./generated/content_roc_curve_data.json', JSON.stringify(staticContentRocCurve, null, 2));
    await fs.writeFile('./generated/url_roc_curve_data.json', JSON.stringify(urlRocCurve, null, 2));

    console.log('ROC AUC results and curve data saved for both detectors.');
}

runRocAucTest().catch(error => {
    console.error('Error running ROC AUC test:', error);
});