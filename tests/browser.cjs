const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname,'..');
const server = spawn(process.execPath,['tools/serve.cjs'],{cwd:root,stdio:'ignore'});
(async()=>{
  await new Promise(r=>setTimeout(r,700));
  const browser=await chromium.launch({headless:true});
  for(const viewport of [{width:390,height:844,name:'mobile'},{width:1440,height:900,name:'desktop'}]){
    const page=await browser.newPage({viewport}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/index.html');
    await page.locator('#eventsGrid').waitFor();
    if(await page.locator('#eventsGrid .event-card-3d').count()!==3) throw new Error('Event cards not rendered');
    await page.locator('.playlist button.track-item').first().waitFor();
    await page.locator('#playBtn').click(); await page.waitForTimeout(600);
    if (!await page.locator('#audioPlayer').evaluate(audio => audio.src.includes('/audio/') && !audio.paused)) throw new Error('Audio player failed');
    await page.locator('#playBtn').click();
    await page.screenshot({path:path.join(root,`hhbar-${viewport.name}.png`),fullPage:true});
    if (await page.locator('body').evaluate(el => el.scrollWidth > el.clientWidth)) throw new Error(`Horizontal overflow on ${viewport.name}`);
    await page.goto('http://127.0.0.1:4173/menu.html'); await page.locator('#menuSearch').fill('кофе');
    if(!await page.locator('.menu-search-result').count()) throw new Error('Menu search failed');
    await page.route('**/widget.js?*', route => route.fulfill({
      contentType: 'application/javascript',
      body: `document.addEventListener('click',event=>{if(event.target.closest('.restoplace-click-open'))window.__restoplaceOpens=(window.__restoplaceOpens||0)+1;});`
    }));
    await page.goto('http://127.0.0.1:4173/booking.html'); await page.locator('#guestCount').selectOption('10');
    const tableIds = await page.evaluate(() => window.HHRestoplace?.config.tableIds);
    if(tableIds?.['1'] !== '830804' || tableIds?.['20'] !== '830823' || tableIds?.VIP !== '830890') throw new Error('RestoPlace table mapping failed');
    if(await page.locator('.table[data-capacity="2"]:visible').count()) throw new Error('Table filter failed');
    await page.locator('.table[data-table="16"]').click();
    await page.waitForFunction(() => window.__restoplaceOpens === 1);
    if(!await page.locator('.table[data-table="16"]').evaluate(el => el.classList.contains('selected'))) throw new Error('Selected table state failed');
    if(!await page.locator('#selectedTableActions').evaluate(el => el.classList.contains('active'))) throw new Error('Booking action did not appear');
    await page.locator('#selectedTableActions [data-restoplace-booking]').click();
    await page.waitForFunction(() => window.__restoplaceOpens === 2);
    if(await page.locator('body').evaluate(el => el.scrollWidth > el.clientWidth)) throw new Error(`Booking overflow on ${viewport.name}`);
    await page.screenshot({path:path.join(root,`hhbar-booking-${viewport.name}.png`),fullPage:true});
    if(errors.length) throw new Error(errors.join('; '));
  }
  const localPage=await browser.newPage({viewport:{width:1440,height:900}}); const localErrors=[]; localPage.on('pageerror',e=>localErrors.push(e.message));
  await localPage.goto(pathToFileURL(path.join(root,'index.html')).href,{waitUntil:'domcontentloaded'});
  await localPage.locator('#eventsGrid .event-card-3d').first().waitFor();
  if(await localPage.locator('#eventsGrid .event-card-3d').count()!==3) throw new Error('Local-file events failed');
  await localPage.waitForFunction(() => [...document.querySelectorAll('.card-front')].every(card => {
    const match = getComputedStyle(card).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    if (!match) return false;
    const image = new Image(); image.src = match[1];
    return image.complete && image.naturalWidth > 0;
  }));
  await localPage.locator('.playlist button.track-item').first().waitFor();
  if(await localPage.locator('.playlist button.track-item').count()<3) throw new Error('Local-file music library failed');
  if(localErrors.length) throw new Error(`Local-file errors: ${localErrors.join('; ')}`);
  await browser.close(); server.kill(); console.log('Browser checks passed; screenshots created.');
})().catch(error=>{server.kill();console.error(error);process.exit(1);});
