(function (root) {
    'use strict';

    // The official HHBAR loader forwards the current page query to its iframe.
    // RestoPlace uses open_item=TABLE_ID to open a specific table form.
    const config = Object.freeze({
        tableIds: Object.freeze({
            '1': '830804', '2': '830805', '3': '830806', '4': '830807', '5': '830808',
            '6': '830809', '7': '830810', '8': '830811', '9': '830812', '10': '830813',
            '11': '830814', '12': '830815', '13': '830816', '14': '830817', '15': '830818',
            '16': '830819', '17': '830820', '18': '830821', '19': '830822', '20': '830823',
            'VIP': '830890'
        })
    });

    function clickWithParams(proxy, tableNumber, guestCount) {
        const originalUrl = location.href;
        const itemId = config.tableIds[String(tableNumber)]?.trim();
        if (!itemId) { proxy.click(); return; }
        try {
            const bookingUrl = new URL(originalUrl);
            bookingUrl.searchParams.set('open_item', itemId);
            if (guestCount) bookingUrl.searchParams.set('count', String(guestCount));
            history.replaceState(history.state, '', bookingUrl);
            proxy.click();
        } finally {
            history.replaceState(history.state, '', originalUrl);
        }
    }

    function openGenericWidget(tableNumber, guestCount) {
        const proxy = document.getElementById('restoplaceOpenProxy');
        const script = document.getElementById('restoplaceWidget');
        if (!proxy) return false;
        // Works immediately when the async widget is ready. If it is still loading,
        // the second click runs as soon as its official script finishes.
        clickWithParams(proxy, tableNumber, guestCount);
        if (script && !script.dataset.loaded) {
            script.addEventListener('load', () => clickWithParams(proxy, tableNumber, guestCount), { once: true });
            script.addEventListener('error', () => document.dispatchEvent(new CustomEvent('hhbar:booking-error')), { once: true });
            return true;
        }
        return true;
    }

    function open({ tableNumber = '', guestCount = 0 } = {}) {
        return openGenericWidget(tableNumber, guestCount);
    }

    const widgetScript = document.getElementById('restoplaceWidget');
    widgetScript?.addEventListener('load', () => { widgetScript.dataset.loaded = 'true'; });
    root.HHRestoplace = Object.freeze({ open, config });
})(window);
