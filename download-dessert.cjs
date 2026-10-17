const fs = require('fs');
const https = require('https');
const path = require('path');

const dest = path.join(__dirname, 'public', 'dishes', 'dessert.jpg');

// High-quality authentic South Indian dessert / payasam / sweet image
const url = 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80';

https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        https.get(res.headers.location, (res2) => {
            const fileStream = fs.createWriteStream(dest);
            res2.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                console.log('Saved dessert.jpg:', fs.statSync(dest).size, 'bytes');
            });
        });
    } else if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
            fileStream.close();
            console.log('Saved dessert.jpg:', fs.statSync(dest).size, 'bytes');
        });
    }
});
