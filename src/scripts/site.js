document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduced.matches && !navigator.connection?.saveData;
  const video = document.querySelector('.page-video-bg');
  const hero = document.getElementById('home');
  const toggle = document.getElementById('motionToggle');
  let videoReady = false;
  const heroBounds = hero?.getBoundingClientRect();
  let heroVisible = !heroBounds || (heroBounds.bottom > 0 && heroBounds.top < innerHeight);
  function loadBackgroundVideo() {
    if (!video || videoReady || !motion || document.hidden || !heroVisible) return;
    const sources = video.querySelectorAll('source[data-src]');
    if (!sources.length) { videoReady = true; return; }
    sources.forEach(source => {
      source.src = source.dataset.src;
      source.removeAttribute('data-src');
    });
    video.preload = 'auto';
    video.load();
    videoReady = true;
    video.play().catch(() => {});
  }
  function updateMotion() {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    if (toggle) { toggle.textContent = motion ? 'Анимация: включена' : 'Анимация: выключена'; toggle.setAttribute('aria-pressed', String(!motion)); }
    if (video) {
      if (motion && !document.hidden && heroVisible && videoReady) video.play().catch(() => {});
      else video.pause();
    }
  }
  toggle?.addEventListener('click', () => { motion = !motion; updateMotion(); if (motion) loadBackgroundVideo(); });
  reduced.addEventListener('change', () => { motion = !reduced.matches; updateMotion(); if (motion) loadBackgroundVideo(); });
  document.addEventListener('visibilitychange', () => { updateMotion(); if (!document.hidden) loadBackgroundVideo(); });
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      updateMotion();
      if (heroVisible) loadBackgroundVideo();
    }).observe(hero);
  }
  updateMotion();
  // Start the local, fast-start MP4 as soon as the page is interactive.
  // The poster covers the first paint; reduced-motion and Save-Data users keep it static.
  loadBackgroundVideo();
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (!motion || e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--tilt-x', `${(0.5-(e.clientY-r.top)/r.height)*8}deg`);
      card.style.setProperty('--tilt-y', `${((e.clientX-r.left)/r.width-0.5)*8}deg`);
    });
    card.addEventListener('pointerleave', () => { card.style.setProperty('--tilt-x','0deg'); card.style.setProperty('--tilt-y','0deg'); });
  });
  document.querySelectorAll('iframe[data-src]').forEach(frame => {
    frame.hidden = true;
    const panel = document.createElement('div'); panel.className = 'embed-consent';
    const text = document.createElement('small'); text.textContent = 'После нажатия загрузится внешний сервис, которому станет доступен ваш IP-адрес.';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = frame.title.includes('Яндекс') ? 'Загрузить карту' : 'Загрузить видео VK';
    button.addEventListener('click', () => { frame.src = frame.dataset.src; frame.hidden = false; panel.remove(); });
    panel.append(button, text); frame.before(panel);
  });
  document.querySelectorAll('.dj-item, .dj-photo, .menu-item').forEach(el => {
    el.tabIndex = 0; el.setAttribute('role', 'button');
    el.setAttribute('aria-label', el.dataset.name || el.dataset.dj || el.closest('.dj-item')?.dataset.dj || 'Открыть');
    el.addEventListener('keydown', e => { if (e.target === el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); el.click(); } });
  });
  const banner = document.createElement('div'); banner.className = 'offline-banner'; banner.setAttribute('role','status');
  banner.textContent = 'Вы офлайн. Сохранённые страницы доступны; актуальную бронь уточните по телефону.';
  function onlineState() { banner.hidden = navigator.onLine; }
  document.body.append(banner); onlineState();
  addEventListener('online',onlineState); addEventListener('offline',onlineState);
  if ('serviceWorker' in navigator) {
    if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') {
      Promise.all([
        navigator.serviceWorker.getRegistrations().then(items => Promise.all(items.map(item => item.unregister()))),
        'caches' in window ? caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))) : Promise.resolve()
      ]).then(() => {
        if (!sessionStorage.getItem('hhbarPreviewCacheReset')) {
          sessionStorage.setItem('hhbarPreviewCacheReset', '1');
          location.reload();
        }
      }).catch(() => {});
    } else {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
});
