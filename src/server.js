const http = require('http');
const router = require('./router');

const PORT = 3000;

const server = http.createServer(router);

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
