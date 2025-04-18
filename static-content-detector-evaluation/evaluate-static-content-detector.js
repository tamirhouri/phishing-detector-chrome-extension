import puppeteer from 'puppeteer';
import fs from 'fs/promises';

// Set a global threshold for classification
const CLASSIFICATION_THRESHOLD = 0.5;

// Load the StaticContentDetector source code
const detectorPath = '../chrome-extension/phishing-detectors/static-content-detector/static-content-detector.js';
const detectorScript = await fs.readFile(detectorPath, 'utf-8');

// Load dataset
const urls = JSON.parse(await fs.readFile('./urls.json', 'utf-8'));

async function evaluateUrls() {
    const results = [];

    for (const { url, label } of urls) {
        let browser;
        try {
            browser = await puppeteer.launch();
            const page = await browser.newPage();

            console.log(`🔍 Testing URL: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Inject StaticContentDetector into page
            await page.addScriptTag({ content: detectorScript });

            // Run prediction
            const prediction = await page.evaluate(async () => {
                const detector = new StaticContentDetector().withReasons();
                return detector.predict();
            });

            const result = {
                url,
                score: prediction.score,
                reasons: prediction.reasons,
                label
            };

            results.push(result);

            // Update the log to include classification and emoji based on correctness
            const isCorrect = (prediction.score > CLASSIFICATION_THRESHOLD) === (label === 'phishing');
            const classification = prediction.score > CLASSIFICATION_THRESHOLD ? 'phishing' : 'benign';
            const emoji = isCorrect ? '✅' : '⚠️';
            console.log(`${emoji} ${url} → Score: ${prediction.score} Classification: ${classification} Label: ${label}`);
        } catch (error) {
            console.error(`❌ Failed for ${url}: ${error.message}`);
            results.push({ url, label, error: error.message });
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    // Save results
    const outputPath = './static_content_results.json';

    // Squash duplicate reasons in results
    const squashReasons = (reasons) => {
        const reasonCounts = reasons.reduce((acc, reason) => {
            acc[reason] = (acc[reason] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(reasonCounts).map(([reason, count]) => count > 1 ? `(${count}) ${reason}` : reason);
    };

    const squashedResults = results.map(result => {
        if (result.reasons) {
            result.reasons = squashReasons(result.reasons);
        }
        return result;
    });

    await fs.writeFile(outputPath, JSON.stringify(squashedResults, null, 2));
    console.log(`📦 Results saved to ${outputPath}`);

    // Evaluation metrics
    function computeMetrics(results) {
        let TP = 0, TN = 0, FP = 0, FN = 0;

        for (const entry of results) {
            if (!('score' in entry) || !('label' in entry)) continue;

            const isPhishing = entry.score > CLASSIFICATION_THRESHOLD;
            const isTruePhishing = entry.label === 'phishing';

            if (isPhishing && isTruePhishing) TP++;
            else if (!isPhishing && !isTruePhishing) TN++;
            else if (isPhishing && !isTruePhishing) FP++;
            else if (!isPhishing && isTruePhishing) FN++;
        }

        const accuracy = (TP + TN) / (TP + TN + FP + FN || 1);
        const precision = TP / (TP + FP || 1);
        const recall = TP / (TP + FN || 1);
        const f1 = 2 * (precision * recall) / (precision + recall || 1);

        return {
            accuracy: +accuracy.toFixed(4),
            precision: +precision.toFixed(4),
            recall: +recall.toFixed(4),
            f1_score: +f1.toFixed(4),
            confusion_matrix: { TP, FP, FN, TN }
        };
    }

    const metrics = computeMetrics(squashedResults);
    console.log('\n📊 Evaluation Metrics:', metrics);

    // Save metrics
    await fs.writeFile('./static_content_metrics.json', JSON.stringify(metrics, null, 2));
    console.log('📈 Metrics saved to static_content_metrics.json');
}

evaluateUrls().catch(error => {
    console.error('🚨 Critical error during evaluation:', error);
});
