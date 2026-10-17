const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, 'public', 'dishes');

function downloadDriveImage(id, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(dir, filename);
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
            console.log(`Skipping existing ${filename}`);
            return resolve(filePath);
        }
        const url = `https://lh3.googleusercontent.com/d/${id}=w1000`;
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                https.get(res.headers.location, (res2) => {
                    const fileStream = fs.createWriteStream(filePath);
                    res2.pipe(fileStream);
                    fileStream.on('finish', () => {
                        fileStream.close();
                        console.log(`Saved ${filename} (${fs.statSync(filePath).size} bytes)`);
                        resolve(filePath);
                    });
                }).on('error', reject);
            } else if (res.statusCode === 200) {
                const fileStream = fs.createWriteStream(filePath);
                res.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    console.log(`Saved ${filename} (${fs.statSync(filePath).size} bytes)`);
                    resolve(filePath);
                });
            } else {
                console.error(`Failed ${filename} status ${res.statusCode}`);
                resolve(null);
            }
        }).on('error', reject);
    });
}

async function run() {
    const jpgs = [
        { id: "1_YPWUovzqifi70DUq5ekEnoE8xS6UNBZ", name: "dish_13.jpg" },
        { id: "1F3VYH8H6xHkhYXSnrlNM_rruhQwzb0rg", name: "dish_14.jpg" },
        { id: "18XL1xoYg6upS4_EYZY7AXWPDgYscI7-W", name: "dish_15.jpg" },
        { id: "1kpMtLejZskJ5FlRHYulp_Nm1KSZhMQZp", name: "dish_16.jpg" },
        { id: "1Yfwla7pRylfPHoX0Wi32NAxvU1DO-8L1", name: "dish_17.jpg" },
        { id: "1C4WhkP_vBKG1km3jfBgJLq3BZuzHNFuu", name: "dish_18.jpg" },
        { id: "19Q_rtxgAalfTSk3WzI_Bobyxkjy2NUn3", name: "dish_19.jpg" },
        { id: "1v5N_SWtMnhonfxXWsu76OR--MqCfgQKA", name: "dish_20.jpg" },
        { id: "15F0bLex3f2SIb02VCAWsioc9Cz6Ywq59", name: "dish_21.jpg" },
        { id: "1RJLY6eCBSUVLPT5rEM-G07QxBV6xlr8V", name: "dish_22.jpg" },
        { id: "1KVTz8PJ2MvS_JgSFjbyZ2IiGErhf4y5Z", name: "dish_23.jpg" },
        { id: "17w2OQYt-phWN8FdI87VDuBqvh-agoCeE", name: "dish_24.jpg" }
    ];

    for (const item of jpgs) {
        await downloadDriveImage(item.id, item.name);
    }
}

run();
