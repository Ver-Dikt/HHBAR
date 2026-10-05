document.addEventListener('DOMContentLoaded', () => {
    // External decoration must never delay the table and booking handlers.
    for (const href of [
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Inter:wght@400;500;600&display=swap',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    ]) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        if (href.includes('font-awesome')) {
            link.integrity = 'sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw==';
            link.crossOrigin = 'anonymous';
            link.referrerPolicy = 'no-referrer';
        }
        document.head.append(link);
    }
    const tables = document.querySelectorAll('.table[data-table]');
    const hallScheme = document.querySelector('.hall-scheme');
    const hallContainer = document.getElementById('hallContainer');
    const previewModal = document.getElementById('tablePreviewModal');
    const previewImage = document.getElementById('tablePreviewImage');
    const previewTitle = document.getElementById('tablePreviewTitle');
    const previewText = document.getElementById('tablePreviewText');
    const closePreview = document.getElementById('closeTablePreview');
    const guestCount = document.getElementById('guestCount');
    let lastTableButton = null;

    function resizeHallScheme() {
        if (!hallScheme || !hallContainer) return;

        const baseWidth = 950;
        const baseHeight = 750;
        const availableWidth = hallScheme.clientWidth - 24;
        const scale = Math.min(1, Math.max(0.1, availableWidth / baseWidth));

        hallContainer.style.transform = `scale(${scale})`;
        hallScheme.style.height = `${baseHeight * scale + 24}px`;
    }

    function getTablePhoto(num) {
        if (num === 'VIP') return 'img/tables/table-vip.jpg';
        return `img/tables/table-${num}.jpg`;
    }

    function openTablePreview(table) {
        const num = table.dataset.table;
        const cap = table.dataset.capacity;
        const title = num === 'VIP' ? 'VIP столик' : `Столик ${num}`;
        lastTableButton = table;

        previewTitle.textContent = title;
        previewText.textContent = `За этот столик комфортно сядет до ${cap} человек. Проверьте доступность и завершите бронь в RestoPlace.`;
        previewImage.src = getTablePhoto(num);
        previewImage.alt = `${title} в HHBAR`;
        previewImage.onerror = () => {
            previewImage.onerror = null;
            previewImage.src = 'img/hhbar-hero-bg.jpg';
            previewImage.alt = 'Зал HHBAR';
            previewText.textContent = `Столик до ${cap} человек. Фото именно этого столика пока нет — показан общий вид зала. Доступность проверьте в RestoPlace.`;
        };

        previewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        closePreview.focus({ preventScroll: true });
    }

    function closeTablePreview({ restoreFocus = true } = {}) {
        previewModal.classList.remove('active');
        document.body.style.overflow = '';
        if (restoreFocus) lastTableButton?.focus({ preventScroll: true });
    }

    resizeHallScheme();
    window.addEventListener('resize', resizeHallScheme);

    guestCount?.addEventListener('change', () => {
        const requested = Number(guestCount.value);
        tables.forEach(table => { table.hidden = Boolean(requested && Number(table.dataset.capacity) < requested); });
    });

    tables.forEach(table => {
        table.setAttribute('role', 'button');
        table.tabIndex = 0;
        table.setAttribute('aria-label', `Столик ${table.dataset.table}, до ${table.dataset.capacity} гостей`);
        table.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); table.click(); }
        });
        table.addEventListener('click', () => {
            tables.forEach(t => t.classList.remove('selected'));
            table.classList.add('selected');
            openTablePreview(table);
        });
    });

    document.querySelectorAll('[data-restoplace-booking]').forEach(button => {
        button.addEventListener('click', event => {
            const selected = document.querySelector('.table.selected');
            if (!selected) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (previewModal.classList.contains('active')) closeTablePreview({ restoreFocus: false });
            window.HHRestoplace.open({
                tableNumber: selected.dataset.table,
                guestCount: Number(guestCount?.value) || Number(selected.dataset.capacity)
            });
        }, true);
    });

    document.addEventListener('hhbar:booking-error', () => {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = 'Не удалось загрузить онлайн-бронирование. Позвоните: +7 (8152) 70-70-57';
        toast.classList.add('active');
        window.setTimeout(() => toast.classList.remove('active'), 5000);
    });

    closePreview.addEventListener('click', closeTablePreview);
    previewModal.addEventListener('click', (event) => {
        if (event.target === previewModal) closeTablePreview();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && previewModal.classList.contains('active')) closeTablePreview();
        if (event.key === 'Tab' && previewModal.classList.contains('active')) {
            const controls = [...previewModal.querySelectorAll('button, a[href]')].filter(el => !el.hidden);
            const first = controls[0], last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
            if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
    });
});
