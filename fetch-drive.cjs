const https = require('https');
const fs = require('fs');

const url = 'https://drive.google.com/drive/folders/1S13ZkvcLKC6NYQ-_Yzy54HuVGJQCm7Aa';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        fs.writeFileSync('drive_content.html', data);
        console.log('Saved html, length:', data.length);

        // Look for filenames or image titles
        const matches = data.match(/(\w[\w\s\-_]+\.(?:jpg|jpeg|png|webp|mp4|mov))/gi) || [];
        console.log('Image/media file matches:', Array.from(new Set(matches)));

        // Look for any titles or labels
        const titleMatches = data.match(/\["([a-zA-Z0-9_\-]{20,})","([^"]+)"/g) || [];
        console.log('ID and Title matches:', titleMatches.slice(0, 30));
    });
}).on('error', err => console.error(err));
