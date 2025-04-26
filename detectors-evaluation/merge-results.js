import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing the JSON files
const directoryPath = path.join(__dirname, 'generated');
const outputFilePath = path.join(directoryPath, 'results.json');

// Get all JSON files in the directory matching the pattern
const files = fs.readdirSync(directoryPath).filter(file => file.match(/^results-\d+-\d+\.json$/));

let mergedResults = [];

files.forEach((file) => {
  const filePath = path.join(directoryPath, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  mergedResults = mergedResults.concat(data);

  // Delete the file after merging
  // fs.unlinkSync(filePath);
});

// Write the merged results to a new file
fs.writeFileSync(outputFilePath, JSON.stringify(mergedResults, null, 2));

console.log(`Merged results written to ${outputFilePath}`);