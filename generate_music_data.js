const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, 'audio');
const outputPath = path.join(__dirname, 'src/scripts/music_data.json');
const djsData = {};

function prettifyTrackName(fileName) {
    return fileName
        .replace(/\.mp3$/i, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

if (!fs.existsSync(audioDir)) {
    throw new Error(`Audio directory not found: ${audioDir}`);
}

const djDirs = fs.readdirSync(audioDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^dj\d+$/i.test(entry.name))
    .map(entry => entry.name)
    .sort((a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')));

djDirs.forEach((djDirName) => {
    const djDirPath = path.join(audioDir, djDirName);
    const tracks = fs.readdirSync(djDirPath)
        .filter(file => /\.mp3$/i.test(file))
        .sort((a, b) => a.localeCompare(b, 'ru', { numeric: true, sensitivity: 'base' }))
        .map((file) => ({
            src: `audio/${djDirName}/${file}`.replace(/\\/g, '/'),
            displayName: prettifyTrackName(file),
            fileName: file
        }));

    djsData[djDirName] = tracks;
});

fs.writeFileSync(outputPath, JSON.stringify(djsData, null, 2), 'utf-8');
console.log(`music_data.json generated successfully: ${outputPath}`);
