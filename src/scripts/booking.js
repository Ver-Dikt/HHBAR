document.addEventListener('DOMContentLoaded', () => {
    const tables = document.querySelectorAll('.table:not(.occupied)');
    const hallScheme = document.querySelector('.hall-scheme');
    const hallContainer = document.getElementById('hallContainer');
    const selectedTableActions = document.getElementById('selectedTableActions');
    const selectedTableTitle = document.getElementById('selectedTableTitle');
    const selectedTableText = document.getElementById('selectedTableText');
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
        if (num === 'VIP') return 'img/tables/table-20.jpg';
        return `img/tables/table-${num}.jpg`;
    }

    function openTablePreview(table) {
        const num = table.dataset.table;
        const cap = table.dataset.capacity;
        const title = num === 'VIP' ? 'VIP столик' : `Столик ${num}`;
        lastTableButton = table;

        previewTitle.textContent = title;
        previewText.textContent = `За этот столик комфортно сядет до ${cap} человек. Посмотрите фото и позвоните, чтобы закрепить бронь.`;
        previewImage.src = getTablePhoto(num);
        previewImage.alt = `${title} в HHBAR`;
        previewImage.onerror = () => {
            previewImage.onerror = null;
            previewImage.src = 'img/hhbar-hero-bg.jpg';
            previewImage.alt = 'Зал HHBAR';
        };

        previewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        closePreview.focus({ preventScroll: true });
    }

    function closeTablePreview() {
        previewModal.classList.remove('active');
        document.body.style.overflow = '';
        lastTableButton?.focus({ preventScroll: true });
    }

    resizeHallScheme();
    window.addEventListener('resize', resizeHallScheme);

    if (selectedTableActions) selectedTableActions.classList.remove('active');
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
            const num = table.dataset.table;
            const cap = table.dataset.capacity;
            if (selectedTableTitle && selectedTableText) {
                selectedTableTitle.textContent = num === 'VIP' ? 'VIP столик' : `Столик ${num}`;
                selectedTableText.textContent = `Фото столика, вместимость до ${cap} человек и быстрый звонок для брони открыты в карточке.`;
            }
            openTablePreview(table);
        });
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
