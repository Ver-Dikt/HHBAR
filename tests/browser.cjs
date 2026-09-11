const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const server = spawn(process.execPath,['tools/serve.cjs'],{cwd:root,stdio:'ignore'});
(async()=>{
  await new Promise(r=>setTimeout(r,700));
  const browser=await chromium.launch({headless:true});
  for(const viewport of [{width:390,height:844,name:'mobile'},{width:1440,height:900,name:'desktop'}]){
    const page=await browser.newPage({viewport}); const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173/index.html');
    await page.locator('#eventsGrid').waitFor();
    if(await page.locator('#eventsGrid .event-card-3d').count()) throw new Error('Past events visible as upcoming');
    if(await page.locator('#eventsArchive .event-card-3d').count()!==3) throw new Error('Archive not rendered');
    await page.screenshot({path:path.join(root,`hhbar-${viewport.name}.png`),fullPage:true});
    if (await page.locator('body').evaluate(el => el.scrollWidth > el.clientWidth)) throw new Error(`Horizontal overflow on ${viewport.name}`);
    await page.goto('http://127.0.0.1:4173/menu.html'); await page.locator('#menuSearch').fill('кофе');
    if(!await page.locator('.menu-search-result').count()) throw new Error('Menu search failed');
    await page.goto('http://127.0.0.1:4173/booking.html'); await page.locator('#guestCount').selectOption('10');
    if(await page.locator('.table[data-capacity="2"]:visible').count()) throw new Error('Table filter failed');
    if(errors.length) throw new Error(errors.join('; '));
  }
  await browser.close(); server.kill(); console.log('Browser checks passed; screenshots created.');
})().catch(error=>{server.kill();console.error(error);process.exit(1);});
