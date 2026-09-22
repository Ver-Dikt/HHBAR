(function (root) {
    'use strict';

    // Official table deep links use: https://YOUR-VENUE.restoplace.ws/?open_item=TABLE_ID
    // Fill widgetUrl with the public *.restoplace.ws link from the RestoPlace cabinet.
    const config = Object.freeze({
        widgetUrl: '',
        tableIds: Object.freeze({
            '1': '830804', '2': '830805', '3': '830806', '4': '830807', '5': '830808',
            '6': '830809', '7': '830810', '8': '830811', '9': '830812', '10': '830813',
            '11': '830814', '12': '830815', '13': '830816', '14': '830817', '15': '830818',
            '16': '830819', '17': '830820', '18': '830821', '19': '830822', '20': '830823',
            'VIP': '830890'
        })
    });

    function specificTableUrl(tableNumber, guestCount) {
        const itemId = config.tableIds[String(tableNumber)]?.trim();
        const widgetUrl = config.widgetUrl.trim();
        if (!itemId || !widgetUrl) return null;
        const url = new URL(widgetUrl);
        url.searchParams.set('open_item', itemId);
        if (guestCount) url.searchParams.set('count', String(guestCount));
        return url.href;
    }

    function openGenericWidget() {
        const proxy = document.getElementById('restoplaceOpenProxy');
        const script = document.getElementById('restoplaceWidget');
        if (!proxy) return false;
        // Works immediately when the async widget is ready. If it is still loading,
        // the second click runs as soon as its official script finishes.
        proxy.click();
        if (script && !script.dataset.loaded) {
            script.addEventListener('load', () => proxy.click(), { once: true });
            script.addEventListener('error', () => document.dispatchEvent(new CustomEvent('hhbar:booking-error')), { once: true });
            return true;
        }
        return true;
    }

    function open({ tableNumber = '', guestCount = 0 } = {}) {
        const url = specificTableUrl(tableNumber, guestCount);
        if (url) {
            root.open(url, '_blank', 'noopener,noreferrer');
            return true;
        }
        return openGenericWidget();
    }

    const widgetScript = document.getElementById('restoplaceWidget');
    widgetScript?.addEventListener('load', () => { widgetScript.dataset.loaded = 'true'; });
    root.HHRestoplace = Object.freeze({ open, config });
})(window);
