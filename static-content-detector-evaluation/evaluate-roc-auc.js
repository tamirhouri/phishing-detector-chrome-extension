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

        roc.push([threshold, tpr, fpr]);
    }

    return roc;
}

async function runRocAucTest() {
    const results = JSON.parse(await fs.readFile('./static_content_results.json', 'utf-8'));

    const yTrue = results.map(r => r.label === 'phishing' ? 1 : 0);
    const yScores = results.map(r => r.score || 0);

    const rocCurve = getRocCurve(yTrue, yScores);

    let bestThreshold = 0;
    let bestAccuracy = 0;

    for (const [threshold, tpr, fpr] of rocCurve) {
        const accuracy = (tpr + (1 - fpr)) / 2;
        if (accuracy > bestAccuracy) {
            bestAccuracy = accuracy;
            bestThreshold = threshold;
        }
    }

    console.log(`Best Threshold: ${bestThreshold}`);
    console.log(`Best Accuracy: ${bestAccuracy}`);

    await fs.writeFile('./static_roc_auc_results.json', JSON.stringify({ bestThreshold, bestAccuracy }, null, 2));
    console.log('ROC AUC results saved to static_roc_auc_results.json');

    await fs.writeFile('./static_roc_curve_data.json', JSON.stringify(rocCurve, null, 2));
    console.log('ROC Curve data saved to static_roc_curve_data.json');
}

runRocAucTest().catch(error => {
    console.error('Error running ROC AUC test:', error);
});