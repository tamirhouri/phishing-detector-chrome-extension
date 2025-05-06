import puppeteer from 'puppeteer';
import * as fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import csv from 'csv-parser';
import http from 'http';
import getPort from 'get-port';

// Variable to control how the model and weights are loaded
const USE_HTTP_SERVER_FOR_MODEL = true; // Default: true, can be overridden

// Function to start a local HTTP server to serve model files
async function startHttpServer(directory) {
  const port = await getPort({ port: 8080 }); // Dynamically find an available port
  return new Promise((resolve, reject) => {
    // Add logging to confirm requests for all files, including group1-shard1of1.bin
    const server = http.createServer((req, res) => {
      const filePath = path.join(directory, req.url);
      console.log(`📂 Serving file: ${filePath}`); // Log the file being served

      // Add CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
      );

      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.error(`❌ Error serving file: ${filePath}`, err);
          res.writeHead(404);
          res.end();
        } else {
          res.writeHead(200);
          res.end(data);
        }
      });
    });

    server.listen(port, () => {
      console.log(`📡 HTTP server started at http://localhost:${port}`);
      resolve({ server, port });
    });

    server.on('error', (err) => {
      console.error('❌ Failed to start HTTP server:', err);
      reject(err);
    });
  });
}

const scripts = [
  '../chrome-extension/phishing-detectors/static-content-detector/static-content-detector.js',
  '../chrome-extension/phishing-detectors/url-detector/url-detector.js',
  '../chrome-extension/phishing-detectors/url-detector/url-feature-extractor.js',
  '../chrome-extension/libs/tf.es2017.min.js',
];

for (const script of scripts) {
  try {
    await fsPromises.access(script);
  } catch (error) {
    console.error(
      `❌ Error: Unable to access script at ${script}. Please check the path.`
    );
    process.exit(1);
  }
}

// Load dataset from CSV
const csvFilePath = './data/index.csv';
const urls = [];
await new Promise((resolve, reject) => {
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      urls.push(row);
    })
    .on('end', resolve)
    .on('error', reject);
});

// Start the HTTP server once for all tests
let httpServer = null;
let httpPort = null;
if (USE_HTTP_SERVER_FOR_MODEL) {
  const modelDirectory = path.resolve(
    '../chrome-extension/phishing-detectors/url-detector'
  );
  try {
    const serverInfo = await startHttpServer(modelDirectory);
    httpServer = serverInfo.server;
    httpPort = serverInfo.port;
    console.log(`📡 HTTP server started at http://localhost:${httpPort}`);
  } catch (error) {
    console.error('❌ Could not start HTTP server:', error);
    process.exit(1);
  }
}

// Debug open handles to identify what is keeping the process alive
process.on('beforeExit', () => {
  const handles = process._getActiveHandles();
  console.log('🛠 Active handles before exit:', handles);
});

// Ensure the HTTP server is stopped after all tests
process.on('exit', () => {
  if (httpServer) {
    httpServer.close(() => {
      console.log('🛑 HTTP server stopped.');
    });
  }

  console.log('✅ All resources cleaned up. Exiting process.');
});

// Force exit as a last resort
process.on('SIGINT', () => {
  console.log('🔴 SIGINT received. Forcing process exit.');
  process.exit(0);
});

// Locate the corresponding HTML file
const datasetFolders = [
  './data/dataset-part-1',
  './data/dataset-part-2',
  './data/dataset-part-3',
  './data/dataset-part-4',
  './data/dataset-part-5',
  './data/dataset-part-6',
  './data/dataset-part-7',
  './data/dataset-part-8',
];

// Load websites_with_errors.json
const websitesWithErrors = JSON.parse(
  await fsPromises.readFile('./generated/websites_with_errors.json', 'utf-8')
);

// Create a set of skipRecIds
const skipRecIds = new Set(websitesWithErrors);

// Pass the HTTP server port to the evaluation logic
async function evaluateUrls(fromRecId = null, toRecId = null) {
  const results = [];

  // Filter URLs based on rec_id range if provided (rec_id is a string)
  const filteredUrls = urls.filter((urlObj) => {
    const recId = +urlObj.rec_id; // Convert rec_id to a number
    if (fromRecId !== null && toRecId !== null) {
      return recId >= fromRecId && recId <= toRecId;
    }
    return true; // Include all URLs if no range is specified
  });

  for (const { rec_id, url, website, label, created_date } of filteredUrls) {
    console.log(
      `Processing record: rec_id=${rec_id}, url=${url}, website=${website}, label=${label}, created_date=${created_date}`
    );

    // Skip specific rec_ids for testing purposes
    if (skipRecIds.has(rec_id)) {
      console.log(`Skipping rec_id: ${rec_id}`);
      continue;
    }

    let browser;
    try {
      // Add a check to ensure the 'website' field is valid before locating the HTML file
      if (!website) {
        console.error(`❌ Invalid website field for URL: ${url}`);
        results.push({ url, website, error: 'Invalid website field' });
        continue;
      }

      let htmlFilePath = null;
      for (const folder of datasetFolders) {
        const potentialPath = path.join(folder, website);
        try {
          await fsPromises.access(potentialPath);
          htmlFilePath = potentialPath;
          break;
        } catch {
          // File not found, continue searching
        }
      }

      if (!htmlFilePath) {
        console.error(`❌ HTML file not found for website: ${website}`);
        results.push({ url, website, error: 'HTML file not found' });
        continue;
      }

      browser = await puppeteer.launch();
      const page = await browser.newPage();

      // // Add a listener to capture console logs from the browser context
      // page.on('console', (msg) => {
      //   const message = msg.text();
      //   console.log(`[Browser Console] ${message}`);
      // });

      console.log(
        `🔍 ${rec_id} Testing URL: ${url} (htmlFilePath: ${htmlFilePath})`
      );
      await page.goto(`file://${path.resolve(htmlFilePath)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 5000,
      });

      for (const script of scripts) {
        await page.addScriptTag({ path: script });
      }

      const predictions = await page.evaluate(
        async (url, useHttpServer, port) => {
          try {
            console.log('ℹ️ Initializing StaticContentDetector...');
            const staticContentDetector = new StaticContentDetector()
              .withReasons()
              .withFeatures();
            const staticContentResult = staticContentDetector.predict();
            console.log(
              '✅ StaticContentDetector initialized and prediction made.'
            );

            console.log('ℹ️ Initializing UrlDetector...');
            const urlDetector = new UrlDetector();

            if (useHttpServer) {
              // Override the model loading logic to use the HTTP server
              urlDetector.load = async function () {
                try {
                  const modelUrl = `http://localhost:${port}/model.json`;
                  console.log(
                    `[url detector class] Loading model from: ${modelUrl}`
                  );
                  this.model = await tf.loadGraphModel(modelUrl);
                  console.log('[url detector class] Model loaded successfully');
                } catch (error) {
                  console.error(
                    '[url detector class] Error loading model from HTTP server:',
                    error
                  );
                }
              };
            }

            await urlDetector.load();
            console.log('✅ UrlDetector loaded successfully.');

            const urlResult = urlDetector.predict(url);
            console.log(
              `[url detector class] Prediction result: ${JSON.stringify(
                urlResult
              )}`
            );

            const COMBINED_LR_PARAMS = {
              weights: [4.9935, 3.1742],
              bias: -4.4864,
              PHISHING_THRESHOLD: 0.5,
            };

            const isUrlPhishing = urlResult?.score
              ? urlResult.score > UrlDetector.PHISHING_THRESHOLD
              : undefined;

            const isStaticContentPhishing = staticContentResult?.score
              ? staticContentResult?.score >
                StaticContentDetector.PHISHING_THRESHOLD
              : undefined;

            const sigmoid = (x) => {
              return 1 / (1 + Math.exp(-x));
            };

            const combinedScore =
              urlResult?.score && staticContentResult?.score
                ? sigmoid(
                    COMBINED_LR_PARAMS.weights[0] * urlResult.score +
                      COMBINED_LR_PARAMS.weights[1] *
                        staticContentResult.score +
                      COMBINED_LR_PARAMS.bias
                  )
                : undefined;

            const isCombinedPhishing = combinedScore
              ? combinedScore > COMBINED_LR_PARAMS.PHISHING_THRESHOLD
              : undefined;

            const isPhishing =
              isUrlPhishing === isStaticContentPhishing
                ? isUrlPhishing
                : isCombinedPhishing;

            return {
              staticContentResult,
              urlResult,
              isStaticContentPhishing,
              isUrlPhishing,
              combinedScore,
              isCombinedPhishing,
              isPhishing,
            };
          } catch (error) {
            console.error(
              '❌ Error during evaluation in page context:',
              error.message
            );
            return {
              staticContentResult: null,
              urlResult: null,
              error: error.message,
            };
          }
        },
        url,
        USE_HTTP_SERVER_FOR_MODEL,
        httpPort
      );

      const result = {
        rec_id,
        url,
        website,
        staticContentScore: predictions.staticContentResult?.score,
        staticContentReasons: predictions.staticContentResult?.reasons,
        staticContentFeatures: predictions.staticContentResult?.features,
        isStaticContentPhishing:
          predictions.isStaticContentPhishing ?? undefined,
        urlScore: predictions.urlResult?.score,
        isUrlPhishing: predictions.isUrlPhishing ?? undefined,
        combinedScore: predictions.combinedScore ?? undefined,
        isCombinedPhishing: predictions.isCombinedPhishing ?? undefined,
        isPhishing: predictions.isPhishing ?? undefined,
        label: label === '1' ? 'phishing' : 'benign',
      };

      results.push(result);

      const getLabel = (classification) => {
        return classification ? 'phishing' : 'benign';
      };

      const getEmoji = (classification) => {
        return classification === (label === '1') ? '✅' : '⚠️';
      };

      console.log(
        `${getEmoji(
          predictions.isStaticContentPhishing
        )} StaticContentDetector → Score: ${
          predictions.staticContentResult?.score
        } Classification: ${getLabel(
          predictions.isStaticContentPhishing
        )} Label: ${getLabel(label === '1')}`
      );
      console.log(
        `${getEmoji(predictions.isUrlPhishing)} UrlDetector → Score: ${
          predictions.urlResult?.score
        } Classification: ${getLabel(
          predictions.isUrlPhishing
        )} Label: ${getLabel(label === '1')}`
      );
    } catch (error) {
      console.error(`❌ Failed for ${url}: ${error.message}`);
      results.push({ rec_id, url, website, error: error.message });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // Save results
  const outputPath = `./generated/results-${fromRecId}-${toRecId}.json`;

  await fsPromises.writeFile(outputPath, JSON.stringify(results, null, 2));
  console.log(`📦 Results saved to ${outputPath}`);

  // Ensure the process exits after saving results
  console.log('✅ Evaluation completed. Exiting process.');
}

// Evaluate 1000 URLs at a time for 10 iterations

const batchSize = 1000;
const iterations = 70;

for (let i = 60; i < iterations; i++) {
  const fromRecId = i * batchSize + 1;
  const toRecId = (i + 1) * batchSize;
  console.log(`🔄 Evaluating URLs from ${fromRecId} to ${toRecId}`);
  await evaluateUrls(fromRecId, toRecId).catch((error) => {
    console.error('🚨 Critical error during evaluation:', error);
  });
}

process.exit(0);
