(function (root) {
    'use strict';

    // Official table deep links use: https://YOUR-VENUE.restoplace.ws/?open_item=TABLE_ID
    // Fill widgetUrl and the matching IDs from RestoPlace's table editor when available.
    const config = Object.freeze({
        widgetUrl: '',
        tableIds: Object.freeze({
            '1': '', '2': '', '3': '', '4': '', '5': '',
            '6': '', '7': '', '8': '', '9': '', '10': '',
            '11': '', '12': '', '13': '', '16': '', '17': '',
            '18': '', '19': '', '20': '', 'VIP': ''
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
