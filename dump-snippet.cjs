const fs = require('fs');
const content = fs.readFileSync('drive_content.html', 'utf8');

const idx = content.indexOf('DSC00001');
if (idx !== -1) {
    fs.writeFileSync('snippet.txt', content.substring(idx - 100, idx + 600));
    console.log('Wrote snippet.txt');
}
