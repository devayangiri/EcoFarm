const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const app = next({ dev: false, dir: '.next/standalone' });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });
  server.listen(port, () => {
    console.log(`[EcoFarm Server] Production server listening at http://localhost:${port}`);
  });
}).catch(err => {
  console.error('[EcoFarm Server] Failed to start:', err);
  process.exit(1);
});
