const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const server = spawn(process.execPath, ['tools/serve.cjs'], { cwd: root, stdio: 'ignore' });

(async () => {
  await new Promise(resolve => setTimeout(resolve, 700));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('http://127.0.0.1:4173/booking.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.table[data-table="16"]').click();
  const iframe = page.locator('iframe[src*="restoplace.ws"]');
  await iframe.waitFor({ state: 'visible', timeout: 20000 });
  const src = await iframe.getAttribute('src');
  const url = new URL(src);
  if (url.searchParams.get('address') !== 'a9b70bdfa9ef9eb0b7f6') throw new Error('Wrong RestoPlace restaurant address');
  if (url.searchParams.get('open_item') !== '830819') throw new Error('Wrong RestoPlace table ID');
  if (url.searchParams.get('count') !== '10') throw new Error('Wrong RestoPlace guest count');
  const frame = await (await iframe.elementHandle()).contentFrame();
  if (!frame) throw new Error(`RestoPlace frame did not load: ${src}`);
  await frame.locator('body').waitFor({ timeout: 20000 });
  const bodyText = (await frame.locator('body').innerText()).trim();
  if (!bodyText) throw new Error('RestoPlace booking interface is empty');
  console.log(`Live RestoPlace check passed: table 16 -> ${url.searchParams.get('open_item')}`);
  await browser.close();
  server.kill();
})().catch(error => {
  server.kill();
  console.error(error);
  process.exit(1);
});
