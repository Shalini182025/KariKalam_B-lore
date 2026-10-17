const fs = require('fs');
const content = fs.readFileSync('drive_content.html', 'utf8');

// Match data-id="..." ... data-tooltip="..."
const regex = /data-id="([a-zA-Z0-9_\-]+)"[^>]*data-tooltip="([^"]+)"/g;
const files = [];
let m;
while ((m = regex.exec(content)) !== null) {
    files.push({ id: m[1], name: m[2] });
}

// Also try matching aria-label="... Image Shared"
const regex2 = /aria-label="([^"]+)"[^>]*data-handled-by-drag-and-drop="true"[^>]*ssk='[^']*?:([a-zA-Z0-9_\-]+)-/g;
while ((m = regex2.exec(content)) !== null) {
    files.push({ id: m[2], name: m[1] });
}

// Remove duplicates
const unique = [];
const seen = new Set();
for (const f of files) {
    if (!seen.has(f.id)) {
        seen.add(f.id);
        unique.push(f);
    }
}

fs.writeFileSync('drive_files.json', JSON.stringify(unique, null, 2));
console.log('Extracted', unique.length, 'files');
console.log(unique);
