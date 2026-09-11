// One-time mechanical extraction: keep source contents intact for strict script CSP.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const page of ['booking', 'menu']) {
  const filename = path.join(root, `${page}.html`);
  let html = fs.readFileSync(filename, 'utf8');
  html = html.replace(/<script>\s*([\s\S]*?)<\/script>/g, (_, script) => {
    fs.writeFileSync(path.join(root, `src/scripts/${page}.js`), script.trim() + '\n');
    return `<script src="src/scripts/${page}.js" defer></script>`;
  });
  fs.writeFileSync(filename, html);
}
