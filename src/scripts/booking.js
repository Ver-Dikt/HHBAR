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
    const tablePicker = document.getElementById('tablePicker');
    const tableOptions = document.getElementById('tableOptions');
    const tableListStatus = document.getElementById('tableListStatus');
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
        if (num === 'VIP') return 'img/tables/table-vip.webp';
        if (num === '8') return 'img/tables/table-8.webp';
        if (num === '2') return 'img/tables/table-4.jpg';
        if (num === '4') return 'img/tables/table-2.jpg';
        if (num === '14') return 'img/tables/table-13.jpg';
        if (num === '15') return 'img/tables/table-14.jpg';
        return `img/tables/table-${num}.jpg`;
    }

    function openTablePreview(table, trigger) {
        const num = table.dataset.table;
        const cap = table.dataset.capacity;
        const title = num === 'VIP' ? 'VIP столик' : `Столик ${num}`;
        lastTableButton = trigger;

        previewTitle.textContent = title;
        previewText.textContent = `За этот столик комфортно сядет до ${cap} человек. Позвоните нам, чтобы уточнить доступность и подтвердить бронь.`;
        const photo = getTablePhoto(num);
        previewImage.alt = `${title} в HHBAR`;
        const showHallPhoto = () => {
            previewImage.onerror = null;
            previewImage.src = 'img/hhbar-hero-bg.jpg';
            previewImage.alt = 'Зал HHBAR';
            previewText.textContent = `Столик до ${cap} человек. Фото именно этого столика пока нет — показан общий вид зала. Доступность уточните у администратора по телефону.`;
        };
        if (photo) {
            previewImage.onerror = showHallPhoto;
            previewImage.src = photo;
        } else {
            showHallPhoto();
        }

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

    function selectTable(table, trigger) {
        tables.forEach(item => item.classList.toggle('selected', item === table));
        openTablePreview(table, trigger);
    }

    function updateTableOptions() {
        const requested = Number(guestCount.value);
        const options = [];
        for (const table of tables) {
            const capacity = Number(table.dataset.capacity);
            table.hidden = capacity < requested;
            if (table.hidden) {
                table.classList.remove('selected');
                continue;
            }
            const option = document.createElement('button');
            option.type = 'button';
            option.className = 'table-option';
            const label = document.createElement('strong');
            label.textContent = table.dataset.table === 'VIP' ? 'VIP столик' : `Столик ${table.dataset.table}`;
            const seats = document.createElement('span');
            seats.textContent = `До ${capacity} гостей`;
            option.append(label, seats);
            option.addEventListener('click', () => selectTable(table, option));
            options.push(option);
        }
        tableOptions.replaceChildren(...options);
        tableListStatus.textContent = requested
            ? `Подходящих по вместимости столиков: ${options.length}. Финальную доступность подтвердит администратор по телефону.`
            : 'Выберите число гостей, чтобы увидеть подходящие столики.';
        tableOptions.hidden = !requested;
    }

    tables.forEach(table => {
        table.setAttribute('role', 'button');
        table.tabIndex = 0;
        table.setAttribute('aria-label', `Столик ${table.dataset.table}, до ${table.dataset.capacity} гостей`);
        table.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); table.click(); }
        });
        table.addEventListener('click', () => selectTable(table, table));
    });

    guestCount.addEventListener('change', updateTableOptions);
    tablePicker.hidden = false;
    updateTableOptions();

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
