const http = require('http');

[5173, 5174, 3000, 8080].forEach(port => {
    const req = http.get(`http://localhost:${port}/dish-gallery.html`, (res) => {
        console.log(`Port ${port}: status ${res.statusCode}`);
    });
    req.on('error', () => {
        // not active
    });
});
