(function () {
  const config = document.querySelector('meta[name="yandex-metrika-id"]');
  const counterId = config?.content?.trim();
  const consentKey = 'hhbar_cookie_consent';
  const consent = localStorage.getItem(consentKey);
  const hasCounter = Boolean(counterId && /^\d+$/.test(counterId));

  function reachGoal(goal, params = {}) {
    if (!goal || !hasCounter || typeof window.ym !== 'function') return;
    window.ym(Number(counterId), 'reachGoal', goal, params);
  }

  window.hhbarReachGoal = reachGoal;

  function loadMetrika() {
    if (!hasCounter || window.ym) return;
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

    window.ym(Number(counterId), 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: false
    });
  }

  function bindGoals() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a, button');
      if (!link) return;

      if (link.matches('a[href^="tel:"]')) {
        reachGoal('CALL_CLICK', { href: link.getAttribute('href') });
        return;
      }

      if (link.matches('a[href*="booking.html"], .book-trigger, .call-booking-btn')) {
        reachGoal('BOOKING_CLICK', { text: link.textContent.trim() });
      }
    });
  }

  function initCookieBanner() {
    let banner = document.getElementById('cookieConsent');
    if (!hasCounter || consent) return;
    if (!document.getElementById('cookieConsentStyles')) {
      const style = document.createElement('style');
      style.id = 'cookieConsentStyles';
      style.textContent = '.cookie-consent{position:fixed;right:24px;bottom:24px;z-index:60000;width:min(420px,calc(100vw - 32px));padding:18px;border:1px solid rgba(0,243,255,.35);border-radius:8px;background:rgba(5,5,5,.94);box-shadow:0 18px 50px rgba(0,0,0,.45);color:#e8e8e8}.cookie-consent[hidden]{display:none}.cookie-consent p{margin:0 0 14px;color:#c8c8c8;font-size:.92rem}.cookie-consent a{color:#00f3ff;text-decoration:underline;text-underline-offset:3px}.cookie-actions{display:flex;gap:10px;flex-wrap:wrap}.cookie-actions .btn{min-height:42px;padding:10px 18px}';
      document.head.appendChild(style);
    }
    if (!banner) {
      banner = document.createElement('div');
      banner.className = 'cookie-consent';
      banner.id = 'cookieConsent';
      banner.hidden = true;
      banner.innerHTML = '<p>Мы используем аналитические cookies, чтобы понимать, какие разделы сайта помогают гостям. Подробности — в <a href="cookies.html">политике cookies</a>.</p><div class="cookie-actions"><button type="button" class="btn magnetic-btn" data-cookie-accept>Принять</button><button type="button" class="btn btn-secondary" data-cookie-decline>Отклонить</button></div>';
      document.body.appendChild(banner);
    }

    banner.hidden = false;
    banner.querySelector('[data-cookie-accept]')?.addEventListener('click', () => {
      localStorage.setItem(consentKey, 'accepted');
      banner.hidden = true;
      loadMetrika();
    });

    banner.querySelector('[data-cookie-decline]')?.addEventListener('click', () => {
      localStorage.setItem(consentKey, 'declined');
      banner.hidden = true;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindGoals();
    if (consent === 'accepted') loadMetrika();
    initCookieBanner();
  });
})();
