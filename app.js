const express = require('express');
const app = express();
const routes = require('./server/routes/routes');
const path = require('path');
const https = require('https');
const fs = require('fs');

app.set('views', path.join(__dirname, '/server/views'));
app.set('view engine', 'hjs');

app.use(routes);

const httpsOptions = {
    key: fs.readFileSync('./key.pm'),
    cert: fs.readFileSync('./cert.pem')
}

const server = https.createServer(httpsOptions, app)
    .listen(3000, () => {
        console.log('3k');
    });

/*app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/viven-health/index.html'));
});*/

//app.listen(3000);