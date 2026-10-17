const fs = require('fs');
const path = require('path');

const srcHero = path.join(__dirname, 'public', 'dishes', 'dish_16.jpg');
const destHero = path.join(__dirname, 'public', 'feast-hero.png');

if (fs.existsSync(srcHero)) {
    fs.copyFileSync(srcHero, destHero);
    console.log('Successfully created public/feast-hero.png from dish_16.jpg');
}
