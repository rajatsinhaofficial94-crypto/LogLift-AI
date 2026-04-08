import fs from 'fs';
import path from 'path';

const csvPath = '../exercises.csv';
const jsonPath = './src/data/exercises.json';

const csv = fs.readFileSync(csvPath, 'utf8');
const lines = csv.split('\n');
const headers = lines[0].trim().split(',');

const exercises = lines.slice(1).filter(l => l.trim()).map((line, id) => {
  // Simple regex to handle quotes in CSV:
  // "Back / Wing, Erector Spinae"
  let regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
  let matches = [];
  let match;
  // This is a naive regex, let's just do a proper parse
  
  // A better simple CSV parser
  let row = [];
  let currentString = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && line[i+1] === '"') {
      currentString += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(currentString);
      currentString = '';
    } else {
      currentString += char;
    }
  }
  row.push(currentString);

  return {
    id: id.toString(),
    name: row[0].trim(),
    bodyPart: row[1] ? row[1].trim().replace(/\r/g, '') : '',
  };
});

fs.mkdirSync('./src/data', { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify(exercises, null, 2));
console.log('Successfully written JSON');
