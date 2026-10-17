const fs = require('fs');
const path = require('path');

function getJpegSize(filePath) {
    const buffer = fs.readFileSync(filePath);
    let offset = 2;
    while (offset < buffer.length) {
        if (buffer[offset] === 0xff && (buffer[offset + 1] >= 0xc0 && buffer[offset + 1] <= 0xc3)) {
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            return { width, height, ratio: (width / height).toFixed(2) };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
    }
    return null;
}

const dir = path.join(__dirname, 'public', 'dishes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg'));
files.forEach(f => {
    try {
        const size = getJpegSize(path.join(dir, f));
        console.log(`${f}: ${size ? `${size.width}x${size.height} (ratio: ${size.ratio})` : 'unknown'}`);
    } catch (e) {
        console.log(`${f}: error`);
    }
});
