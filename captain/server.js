const app = require('./app');
const http = require('http');

const server = http.createServer(app);

server.listen(3002, () => {
    console.log("User is running on port 3002");
});