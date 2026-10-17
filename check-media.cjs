const fs = require('fs');
const path = require('path');

// Let's inspect Google Drive folder files to see which one was the banana leaf meal:
// In the folder, there were files DSC00001 to DSC00025.
// Let's check the size of the image uploaded in the user prompt:
// Wait, can we inspect if the user's uploaded image exists in Antigravity brain / media artifacts?
const brainDir = 'C:\\Users\\SHALINI\\.gemini\\antigravity\\brain\\d3598458-7054-40ab-b507-c21952bcf7de';
const files = fs.readdirSync(brainDir).filter(f => f.startsWith('media__') && (f.endsWith('.png') || f.endsWith('.jpg')));

console.log('Recent media files in brain:', files.slice(-5));
files.slice(-5).forEach(f => {
    const stat = fs.statSync(path.join(brainDir, f));
    console.log(`${f}: ${stat.size} bytes, modified: ${stat.mtime}`);
});
