document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduced.matches && !navigator.connection?.saveData;
  const video = document.querySelector('.page-video-bg');
  const toggle = document.getElementById('motionToggle');
  function updateMotion() {
    document.documentElement.dataset.motion = motion ? 'on' : 'off';
    if (toggle) { toggle.textContent = motion ? 'Анимация: включена' : 'Анимация: выключена'; toggle.setAttribute('aria-pressed', String(!motion)); }
    if (video) { if (motion && !document.hidden) video.play().catch(() => {}); else video.pause(); }
  }
  toggle?.addEventListener('click', () => { motion = !motion; updateMotion(); });
  reduced.addEventListener('change', () => { motion = !reduced.matches; updateMotion(); });
  document.addEventListener('visibilitychange', updateMotion);
  updateMotion();
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
