const fs = require('fs');

const content = fs.readFileSync('drive_content.html', 'utf8');

// Google drive embeds file items in data structures like:
// [["<ID>","<NAME>",null,"image/jpeg",...]]
// Let's find matches:
const fileRegex = /\["([a-zA-Z0-9_\-]{25,})","([^"]+\.(?:jpg|jpeg|png|webp))"/gi;
const results = [];
let match;
while ((match = fileRegex.exec(content)) !== null) {
    results.push({ id: match[1], name: match[2] });
}

console.log('Found', results.length, 'files:');
console.log(JSON.stringify(results, null, 2));
