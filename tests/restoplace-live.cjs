const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const server = spawn(process.execPath, ['tools/serve.cjs'], { cwd: root, stdio: 'ignore' });
const tableNumber = process.argv[2] || '15';
const expectedId = tableNumber === 'VIP' ? '830890' : String(830803 + Number(tableNumber) + (Number(tableNumber) >= 15 ? 1 : 0));

(async () => {
  await new Promise(resolve => setTimeout(resolve, 700));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => pageErrors.push(`${request.url()}: ${request.failure()?.errorText}`));
  const bookingUrl = process.argv[3] === 'file'
    ? pathToFileURL(path.join(root, 'booking.html')).href
    : 'http://127.0.0.1:4173/booking.html';
  await page.goto(bookingUrl, { waitUntil: process.argv[3] === 'file' ? 'commit' : 'domcontentloaded' });
  try {
    await page.waitForFunction(() => window.HHRestoplace?.config?.tableIds);
  } catch (error) {
    console.log(`Page URL: ${page.url()}`);
    console.log(`Page text: ${(await page.locator('body').innerText()).slice(0, 300)}`);
    console.log(`Ready state: ${await page.evaluate(() => document.readyState)}`);
    console.log(`Scripts: ${JSON.stringify(await page.evaluate(() => [...document.scripts].map(script => ({ src: script.src, defer: script.defer, async: script.async }))))}`);
    console.log(`Resources: ${JSON.stringify(await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => /booking|restoplace|analytics|refresh/.test(entry.name)).map(entry => ({ name: entry.name, duration: entry.duration }))))}`);
    console.log(`Page errors: ${pageErrors.join('; ')}`);
    throw error;
  }
  const tableIds = await page.evaluate(() => window.HHRestoplace.config.tableIds);
  for (let number = 1; number <= 19; number++) {
    if (tableIds[String(number)] !== String(830803 + number + (number >= 15 ? 1 : 0))) throw new Error(`Wrong local mapping for table ${number}`);
  }
  if (tableIds['20'] || Object.values(tableIds).includes('830818')) throw new Error('Deleted table still mapped');
  if (tableIds.VIP !== '830890') throw new Error('Wrong local mapping for VIP');
  await page.locator(`.table[data-table="${tableNumber}"]`).click();
  if (!await page.locator('#tablePreviewModal').evaluate(el => el.classList.contains('active'))) throw new Error('Table photo preview did not open');
  if (await page.locator('iframe[src*="restoplace.ws"]').count()) throw new Error('RestoPlace opened before booking button');
  await page.locator('#tablePreviewModal [data-restoplace-booking]').click();
  const iframe = page.locator('iframe[src*="restoplace.ws"]');
  try {
    await iframe.waitFor({ state: 'visible', timeout: 20000 });
  } catch (error) {
    console.log(`Page errors: ${pageErrors.join('; ')}`);
    console.log(`Widget: ${JSON.stringify(await page.locator('#restoplaceWidget').evaluate(el => ({ loaded: el.dataset.loaded, src: el.src })))} `);
    throw error;
  }
  const src = await iframe.getAttribute('src');
  const url = new URL(src);
  if (url.searchParams.get('address') !== 'a9b70bdfa9ef9eb0b7f6') throw new Error('Wrong RestoPlace restaurant address');
  if (url.searchParams.get('open_item') !== expectedId) throw new Error('Wrong RestoPlace table ID');
  if (url.searchParams.get('count') !== await page.locator(`.table[data-table="${tableNumber}"]`).getAttribute('data-capacity')) throw new Error('Wrong RestoPlace guest count');
  const frame = await (await iframe.elementHandle()).contentFrame();
  if (!frame) throw new Error(`RestoPlace frame did not load: ${src}`);
  try {
    await frame.getByText(tableNumber === 'VIP' ? /VIP/i : new RegExp(`СТОЛ\\s*№\\s*${tableNumber}(?!\\d)`, 'i')).first().waitFor({ timeout: 30000 });
  } catch (error) {
    console.log(`Frame URL: ${frame.url()}`);
    console.log(`Frame text: ${(await frame.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 600)}`);
    await page.screenshot({ path: path.join(root, 'hhbar-restoplace-live.png') });
    throw error;
  }
  const bodyText = (await frame.locator('body').innerText()).trim();
  if (!bodyText.includes('Забронировать')) throw new Error('RestoPlace table booking action is missing');
  if (tableNumber === '15') {
    await frame.getByText('Забронировать', { exact: true }).last().click();
    try {
      await frame.waitForFunction(() => document.body.innerText.includes('ДАТА И ВРЕМЯ') && document.body.innerText.includes('Во сколько вы придёте?'), null, { timeout: 15000 });
    } catch (error) {
      console.log(`After booking click: ${(await frame.locator('body').innerText()).replace(/\s+/g, ' ').slice(-500)}`);
      await page.screenshot({ path: path.join(root, 'hhbar-restoplace-live.png') });
      throw error;
    }
    console.log('Booking date and time step reached. No reservation submitted.');
  }
  await page.screenshot({ path: path.join(root, 'hhbar-restoplace-live.png') });
  console.log(`Live RestoPlace check passed: table ${tableNumber} -> ${url.searchParams.get('open_item')}`);
  await browser.close();
  server.kill();
})().catch(error => {
  server.kill();
  console.error(error);
  process.exit(1);
});
