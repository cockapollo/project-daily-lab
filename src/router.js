const helloHandler = require('./handlers/hello');
const weatherHandler = require('./handlers/weather');

const routes = {
  '/hello': helloHandler,
  '/weather': weatherHandler,
};

function router(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  const handler = routes[pathname];

  if (handler) {
    handler(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
}

module.exports = router;
