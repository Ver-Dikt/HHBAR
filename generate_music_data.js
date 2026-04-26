const fs = require('fs');
const path = require('path');

const audioDir = path.join(__dirname, 'audio');
const djsData = [];

// Iterate through dj directories (dj1, dj2, etc.)
for (let i = 1; i <= 8; i++) {
    const djDirPath = path.join(audioDir, `dj${i}`);
    const djTracks = [];

    if (fs.existsSync(djDirPath) && fs.lstatSync(djDirPath).isDirectory()) {
        const files = fs.readdirSync(djDirPath);
        files.forEach(file => {
            if (file.endsWith('.mp3')) {
                const trackPath = `audio/dj${i}/${file}`.replace(/\\/g, '/');
                let trackName = file.replace(\.mp3$\, '').replace(/_/g, ' ').replace(/-/g, ' ').trim();
                // Capitalize first letter of each word
                trackName = trackName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                djTracks.push({ name: trackName, src: trackPath });
            }
        });
    }
    djsData.push(djTracks);
}

fs.writeFileSync(path.join(__dirname, 'src/scripts/music_data.json'), JSON.stringify(djsData, null, 2));
console.log('music_data.json generated successfully!');
