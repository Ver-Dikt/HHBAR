const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, 'audio');
const outputFile = path.join(__dirname, 'src', 'scripts', 'music_data.json');

function cleanTrackName(fileName) {
    return path.basename(fileName, path.extname(fileName))
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getDjFolders() {
    if (!fs.existsSync(audioDir)) return [];

    return fs.readdirSync(audioDir, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && /^dj\d+$/i.test(entry.name))
        .sort((a, b) => {
            const aNum = Number(a.name.replace(/\D/g, ''));
            const bNum = Number(b.name.replace(/\D/g, ''));
            return aNum - bNum;
        })
        .map(entry => entry.name);
}

const musicData = {};

getDjFolders().forEach(folder => {
    const folderPath = path.join(audioDir, folder);
    const tracks = fs.readdirSync(folderPath, { withFileTypes: true })
        .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === '.mp3')
        .sort((a, b) => a.name.localeCompare(b.name, 'ru', { numeric: true }))
        .map(entry => ({
            src: `audio/${folder}/${encodeURIComponent(entry.name)}`,
            displayName: cleanTrackName(entry.name),
            fileName: entry.name
        }));

    musicData[folder.toLowerCase()] = tracks;
});

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, JSON.stringify(musicData, null, 2) + '\n', 'utf8');
console.log(`Generated ${outputFile}`);
