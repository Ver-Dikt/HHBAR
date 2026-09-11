const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.ico':'image/x-icon' };
http.createServer((req,res) => {
  const url = new URL(req.url, 'http://localhost');
  const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const file = path.resolve(root, '.' + requested);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (error,data) => { if(error){res.writeHead(404);return res.end('Not found');} res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream'); res.end(data); });
}).listen(Number(process.env.PORT)||4173, '127.0.0.1', () => console.log('HHBAR preview: http://127.0.0.1:'+(Number(process.env.PORT)||4173)));
