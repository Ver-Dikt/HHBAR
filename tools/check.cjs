const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html','menu.html','booking.html','rent.html','cookies.html','offline.html'];
const failures = [];
for (const page of pages) {
  const html = fs.readFileSync(path.join(root,page),'utf8');
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    const target = decodeURIComponent(match[1].split('?')[0]);
    if (/^(https?:|tel:|mailto:|data:)/.test(target)) continue;
    if (!fs.existsSync(path.resolve(root,target))) failures.push(`${page}: missing ${target}`);
  }
  if (/<script>(?![\s\S]*application\/ld\+json)/.test(html)) failures.push(`${page}: inline script`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`Checked ${pages.length} pages: local assets resolve.`);
