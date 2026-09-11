/* Shared validation boundary for editable content. No HTML interpolation. */
(function (root) {
  'use strict';
  function localAsset(value, prefix, base = location.href) {
    if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value)) return null;
    try {
      const directory = new URL('.', base);
      const url = new URL(value, directory);
      const decoded = decodeURIComponent(url.pathname);
      if (url.origin !== directory.origin || !decoded.startsWith(directory.pathname + prefix) || decoded.includes('..') || url.search || url.hash) return null;
      return url.href;
    } catch { return null; }
  }
  function eventData(item, base, today) {
    if (!item || typeof item.title !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.datetime || '')) return null;
    const parsed = new Date(item.datetime + 'T12:00:00Z');
    if (!Number.isFinite(+parsed) || parsed.toISOString().slice(0, 10) !== item.datetime) return null;
    const image = localAsset(item.image, 'img/events/', base);
    if (!image) return null;
    return { title: item.title.slice(0, 160), datetime: item.datetime,
      date: parsed.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'Europe/Moscow' }),
      image, description: Array.isArray(item.description) ? item.description.filter(x => typeof x === 'string').slice(0, 10).map(x => x.slice(0, 1500)) : [],
      bookingUrl: 'booking.html', archived: item.datetime < today };
  }
  root.HHData = { localAsset, eventData };
  if (typeof module !== 'undefined') module.exports = root.HHData;
})(typeof window === 'undefined' ? globalThis : window);
