const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');

const root = path.resolve(__dirname, '..');
const port = 4175;
const server = spawn(process.execPath, ['tools/serve.cjs'], {
  cwd: root, env: { ...process.env, PORT: String(port) }, stdio: 'ignore'
});

(async () => {
  await new Promise(resolve => setTimeout(resolve, 700));
  const browser = await chromium.launch({ headless: true });
  try {
    for (const name of ['menu', 'rent']) {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.__assetMetrics = { cls: 0 };
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) window.__assetMetrics.lcp = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__assetMetrics.cls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      const client = await page.context().newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Network.setCacheDisabled', { cacheDisabled: true });
      await client.send('Network.emulateNetworkConditions', {
        offline: false, latency: 80, downloadThroughput: 625000, uploadThroughput: 125000
      });
      await page.goto(`http://127.0.0.1:${port}/${name}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(7000);
      const metrics = await page.evaluate(() => ({
        lcpMs: Math.round(window.__assetMetrics.lcp || 0),
        cls: Number(window.__assetMetrics.cls.toFixed(3)),
        resources: performance.getEntriesByType('resource').filter(entry => entry.name.startsWith(location.origin)).map(entry => ({
          file: new URL(entry.name).pathname.split('/').pop(), bytes: entry.transferSize
        }))
      }));
      await page.screenshot({ path: path.join(os.tmpdir(), `hhbar-${name}-optimized.png`) });
      if (name === 'menu') {
        const preview = metrics.resources.find(item => item.file === 'page-14-preview.webp');
        if (!preview || preview.bytes > 200000 || metrics.resources.some(item => /^page-\d+\.webp$/.test(item.file))) {
          throw new Error('Menu should load previews before full-size pages');
        }
        await page.getByRole('link', { name: 'Напитки', exact: true }).click();
        if (new URL(page.url()).hash !== '#drinks') throw new Error('Menu section jump failed');
        await page.locator('#drinks .menu-sheet').first().click();
        const viewer = page.getByRole('dialog');
        await viewer.locator('img').evaluate(image => image.decode());
        await viewer.getByRole('button', { name: /Назад к меню/ }).click();
        if (await viewer.isVisible() || new URL(page.url()).hash !== '#drinks') {
          throw new Error('Menu viewer did not return to the drinks section');
        }
      }
      const hero = metrics.resources.find(item => item.file === 'hhbar-hero-bg.webp');
      if (!hero || hero.bytes > 200000 || errors.length) throw new Error(`${name}: optimized hero missing or script error: ${errors.join('; ')}`);
      console.log(JSON.stringify({ page: name, ...metrics }));
      await page.close();
    }
    for (const file of ['img/hhbar-hero-bg.webp', 'img/menu/page-14.webp']) {
      const response = await browser.newPage().then(async page => {
        const result = await page.request.get(`http://127.0.0.1:${port}/${file}`);
        await page.close();
        return result;
      });
      if (response.status() !== 200 || !response.headers()['content-type']?.startsWith('image/webp')) {
        throw new Error(`Wrong response for ${file}`);
      }
    }
  } finally {
    await browser.close();
    server.kill();
  }
})().catch(error => { server.kill(); console.error(error); process.exit(1); });
