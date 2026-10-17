const fs = require('fs');
const path = require('path');

// Let's inspect the files in public/dishes
const dir = path.join(__dirname, 'public', 'dishes');
const files = fs.readdirSync(dir).filter(f => f.startsWith('dish_'));
console.log('Total dish files:', files.length);

// In Google Drive folder, the user had:
// DSC00001 to DSC00025
// Let's create an HTML review gallery page 'dish-gallery.html' so we can view all dishes with their filename!
const galleryHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Karikalam Photoshoot Dishes Review</title>
  <style>
    body { font-family: sans-serif; background: #1a1a1a; color: white; padding: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .card { background: #2a2a2a; border-radius: 8px; overflow: hidden; padding: 10px; }
    img { width: 100%; height: 220px; object-fit: cover; border-radius: 4px; }
    h3 { margin: 10px 0 5px; font-size: 16px; color: #e4c681; }
  </style>
</head>
<body>
  <h1>Karikalam Photoshoot Dishes</h1>
  <div class="grid">
    ${files.map(f => `
      <div class="card">
        <img src="/dishes/${f}" alt="${f}" />
        <h3>${f}</h3>
      </div>
    `).join('')}
  </div>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'public', 'dish-gallery.html'), galleryHtml);
console.log('Created public/dish-gallery.html');
