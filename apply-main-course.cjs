const fs = require('fs');
const path = require('path');

const src = 'C:\\Users\\SHALINI\\.gemini\\antigravity\\brain\\d3598458-7054-40ab-b507-c21952bcf7de\\karikalam_main_course_1791690986762.png';
const dest = path.join(__dirname, 'public', 'dishes', 'main-course.png');

fs.copyFileSync(src, dest);
console.log('Saved public/dishes/main-course.png successfully! Size:', fs.statSync(dest).size);
