const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const jobs = [
  ['src/data/events.json', 'src/data/events-data.js', 'HHBAR_EVENTS'],
  ['src/scripts/music_data.json', 'src/scripts/music-data.js', 'HHBAR_MUSIC']
];

for (const [source, target, globalName] of jobs) {
  const data = JSON.parse(fs.readFileSync(path.join(root, source), 'utf8'));
  const output = `/* Generated from ${source}. Run npm run build:data after editing JSON. */\nwindow.${globalName} = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(path.join(root, target), output, 'utf8');
}

console.log('Browser data files generated.');
