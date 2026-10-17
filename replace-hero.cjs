const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'public', 'dishes', 'dish_08.jpg');
const dest = path.join(__dirname, 'public', 'feast-hero.png');

fs.copyFileSync(src, dest);
console.log('Replaced feast-hero.png with dish_08.jpg successfully!');
