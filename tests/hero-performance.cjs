const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');

const root = path.resolve(__dirname, '..');
const port = 4174;
const server = spawn(process.execPath, ['tools/serve.cjs'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: 'ignore'
});

(async () => {
  await new Promise(resolve => setTimeout(resolve, 700));
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 900 }, { width: 1440, height: 900 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block' });
      await page.addInitScript(() => {
        window.__heroMetrics = { started: performance.now() };
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) window.__heroMetrics.lcp = entry.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        window.__heroMetrics.cls = 0;
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__heroMetrics.cls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
        document.addEventListener('DOMContentLoaded', () => {
          const video = document.querySelector('.page-video-bg');
          video?.addEventListener('playing', () => { window.__heroMetrics.videoPlaying = performance.now(); }, { once: true });
        });
      });
      const client = await page.context().newCDPSession(page);
      await client.send('Network.enable');
      await client.send('Network.setCacheDisabled', { cacheDisabled: true });
      await client.send('Network.emulateNetworkConditions', {
        offline: false, latency: 80, downloadThroughput: 625000, uploadThroughput: 125000
      });
      await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(os.tmpdir(), `hhbar-hero-poster-${viewport.width}.png`) });
      await page.waitForTimeout(11000);
      await page.screenshot({ path: path.join(os.tmpdir(), `hhbar-hero-video-${viewport.width}.png`) });
      const metrics = await page.evaluate(() => ({
        lcpMs: Math.round(window.__heroMetrics.lcp || 0),
        cls: Number(window.__heroMetrics.cls.toFixed(3)),
        videoPlayingMs: Math.round(window.__heroMetrics.videoPlaying || 0),
        videoReadyState: document.querySelector('.page-video-bg')?.readyState,
        videoUrl: document.querySelector('.page-video-bg')?.currentSrc || '',
        posterUrl: document.querySelector('.page-video-bg')?.poster || '',
        orbCount: document.querySelectorAll('.orbital-scene').length,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
        h1Count: document.querySelectorAll('h1').length,
        missingAlts: [...document.images].filter(image => !image.hasAttribute('alt')).length,
        canonical: document.querySelector('link[rel="canonical"]')?.href || '',
        heroButtonsVisible: (() => {
          const buttons = document.querySelector('.hero-buttons').getBoundingClientRect();
          const mobileNav = document.querySelector('.mobile-nav');
          const visibleBottom = getComputedStyle(mobileNav).display === 'none' ? innerHeight : mobileNav.getBoundingClientRect().top;
          return buttons.top >= 0 && buttons.bottom <= visibleBottom;
        })(),
        heroElements: ['.hero', '.floating-logo', '#heroSubtitle', '.hero-buttons'].map(selector => {
          const element = document.querySelector(selector);
          const bounds = element?.getBoundingClientRect();
          return { selector, top: Math.round(bounds?.top || 0), bottom: Math.round(bounds?.bottom || 0), opacity: element ? getComputedStyle(element).opacity : '' };
        }),
        resources: performance.getEntriesByType('resource').filter(item => /hero-video|logo-main|\.css/.test(item.name)).map(item => ({
          name: item.name.split('/').pop(), startMs: Math.round(item.startTime), durationMs: Math.round(item.duration), bytes: item.transferSize
        }))
      }));
      console.log(JSON.stringify({ viewport: viewport.width, ...metrics }));
      if (metrics.orbCount !== 0 || metrics.horizontalOverflow || !metrics.heroButtonsVisible || !metrics.videoPlayingMs || metrics.h1Count !== 1 || metrics.missingAlts !== 0 || !metrics.canonical.startsWith('https://hhbar.ru/')) {
        throw new Error(`Hero regression at ${viewport.width}px`);
      }
      if (viewport.width === 375 && !metrics.videoUrl.endsWith('hero-video-mobile.mp4')) throw new Error('Mobile video variant not selected');
      if (viewport.width > 375 && !metrics.videoUrl.endsWith('hero-video.mp4')) throw new Error('Desktop video variant not selected');
      await page.evaluate(() => window.scrollTo(0, document.getElementById('home').offsetHeight + 150));
      await page.waitForFunction(() => document.querySelector('.page-video-bg').paused);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForFunction(() => !document.querySelector('.page-video-bg').paused);
      await page.close();
    }
    const reducedPage = await browser.newPage({ reducedMotion: 'reduce', serviceWorkers: 'block' });
    await reducedPage.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'domcontentloaded' });
    const reducedVideo = await reducedPage.locator('.page-video-bg').evaluate(video => ({ paused: video.paused, source: video.currentSrc }));
    if (!reducedVideo.paused || reducedVideo.source) throw new Error('Reduced-motion preference loaded autoplay video');
    await reducedPage.close();
    const localPage = await browser.newPage({ serviceWorkers: 'block' });
    await localPage.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'domcontentloaded' });
    await localPage.waitForFunction(() => document.querySelector('.page-video-bg')?.currentSrc.startsWith('file:'));
    if (await localPage.locator('.orbital-scene').count()) throw new Error('Orbital graphic exists in local file');
    await localPage.close();
  } finally {
    await browser.close();
    server.kill();
  }
})().catch(error => { server.kill(); console.error(error); process.exit(1); });
