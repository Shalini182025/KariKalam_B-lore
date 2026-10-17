const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\SHALINI\\.gemini\\antigravity\\brain\\d3598458-7054-40ab-b507-c21952bcf7de\\media__1791689106551.jpg';
const destHero = path.join(__dirname, 'public', 'feast-hero.png');
const destDishes = path.join(__dirname, 'public', 'dishes', 'full-meals.jpg');

fs.copyFileSync(src, destHero);
fs.copyFileSync(src, destDishes);

console.log('Successfully copied media__1791689106551.jpg to:');
console.log('1.', destHero, fs.statSync(destHero).size, 'bytes');
console.log('2.', destDishes, fs.statSync(destDishes).size, 'bytes');
