function helloHandler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('hello world!');
}

module.exports = helloHandler;
