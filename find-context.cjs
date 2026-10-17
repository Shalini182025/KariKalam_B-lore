const fs = require('fs');
const content = fs.readFileSync('drive_content.html', 'utf8');

const idx = content.indexOf('DSC00001');
if (idx !== -1) {
    console.log('Context around DSC00001:');
    console.log(content.substring(Math.max(0, idx - 200), Math.min(content.length, idx + 400)));
} else {
    console.log('DSC00001 not found directly');
}
