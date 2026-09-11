document.addEventListener('DOMContentLoaded', () => {
    const lockPageScroll = () => document.body.classList.add('modal-open');
    const unlockPageScroll = () => document.body.classList.remove('modal-open');
    window.hhbarLockPageScroll = lockPageScroll;
    window.hhbarUnlockPageScroll = unlockPageScroll;

    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    let modalReturnFocus = null;

    function getFocusableElements(container) {
        return Array.from(container.querySelectorAll(focusableSelector)).filter(el => el.offsetParent !== null || el === document.activeElement);
    }

    function openModal(modal, opener = document.activeElement, focusTarget = null) {
        if (!modal) return;
        modalReturnFocus = opener instanceof HTMLElement ? opener : document.activeElement;
        modal.classList.add('active');
        lockPageScroll();
        window.setTimeout(() => {
            const target = focusTarget || getFocusableElements(modal)[0] || modal;
            target?.focus?.({ preventScroll: true });
        }, 0);
    }

    function closeModal(modal) {
        if (!modal?.classList.contains('active')) return;
        modal.classList.remove('active');
        if (!document.querySelector('.menu-modal.active, .kitchen-modal.active')) unlockPageScroll();
        modalReturnFocus?.focus?.({ preventScroll: true });
        modalReturnFocus = null;
    }

    function trapFocus(e, modal) {
        if (e.key !== 'Tab' || !modal?.classList.contains('active')) return;
        const focusable = getFocusableElements(modal);
        if (!focusable.length) { e.preventDefault(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    // =========================================
    // MENU FILTER
    // =========================================
    const catBtns = document.querySelectorAll('.category-btn');
    const menuItems = document.querySelectorAll('.menu-item');
    const menuGrid = document.getElementById('menuGrid');
    const menuSearch = document.getElementById('menuSearch');
    const menuSearchResults = document.getElementById('menuSearchResults');

    function setMenuGridCategory(cat) {
        if (!menuGrid) return;
        menuGrid.className = `menu-grid category-${cat}`;
    }

    const activeCategory = document.querySelector('.category-btn.active')?.dataset.cat || 'kitchen';
    setMenuGridCategory(activeCategory);
    function runSearch() {
        const query = menuSearch.value.trim().toLocaleLowerCase('ru-RU');
        menuSearchResults.replaceChildren();
        if (query.length < 2) return;
        const matches = [...menuItems].filter(item => `${item.dataset.name || ''} ${item.dataset.desc || ''}`.toLocaleLowerCase('ru-RU').includes(query)).slice(0, 8);
        matches.forEach(item => {
            const button = document.createElement('button'); button.type = 'button'; button.className = 'menu-search-result';
            const name = document.createElement('strong'); name.textContent = item.dataset.name || 'Позиция меню';
            const details = document.createElement('small'); details.textContent = `${item.dataset.price || ''} · ${item.dataset.desc || ''}`.slice(0, 190);
            button.append(name, details); button.addEventListener('click', () => item.click()); menuSearchResults.append(button);
        });
        if (!matches.length) { const empty = document.createElement('p'); empty.textContent = 'Ничего не найдено. Попробуйте другое слово.'; menuSearchResults.append(empty); }
    }
    menuSearch?.addEventListener('input', runSearch);

    catBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const cat = btn.dataset.cat;
            setMenuGridCategory(cat);
            menuItems.forEach(item => {
                if (item.dataset.category === cat) {
                    item.style.display = 'flex';
                    setTimeout(() => item.style.opacity = '1', 10);
                } else {
                    item.style.display = 'none';
                    item.style.opacity = '0';
                }
            });
        });
    });

    // =========================================
    // MENU 3D TILT
    // =========================================
    document.querySelectorAll('.tilt-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
        });

        const imgUrl = card.dataset.img;
        if (imgUrl) {
            const testImg = new Image();
            testImg.onerror = () => {
                card.classList.add('error-image');
            };
            testImg.src = imgUrl;
        }
    });

    // =========================================
    // MENU MODAL
    // =========================================
    const menuModal = document.getElementById('menuModal');
    const closeMenuModal = document.getElementById('closeMenuModal');
    const menuModalDesc = document.getElementById('menuModalDesc');
    const menuModalVolume = document.getElementById('menuModalVolume');

    const getCommonVolume = (raw, category) => {
        if (!(category === 'drinks' || category === 'cocktails')) return '';
        const lines = raw.split('\n').map(line => line.trim()).filter(Boolean);
        const volumeLine = lines.find(line => /^Объем(?:\s+чайника)?:\s*\d+\s*мл\.?$/i.test(line));
        if (volumeLine) return volumeLine.replace(/^Объем(?:\s+чайника)?:\s*/i, '').replace(/\.$/, '');
        if (category !== 'cocktails') return '';
        const trailing = raw.match(/(?:^|[\s.])(\d+\s*мл)\.?$/i);
        return trailing ? trailing[1] : '';
    };

    const stripCommonVolume = (raw, volume) => {
        if (!volume) return raw;
        const escaped = volume.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\ /g, '\\s*');
        return raw
            .split('\n')
            .map(line => line.trim())
            .filter(line => !new RegExp(`^Объем(?:\\s+чайника)?:\\s*${escaped}\.?$`, 'i').test(line))
            .join('\n')
            .replace(new RegExp(`(?:\\s*\.\\s*|\\s+)${escaped}\.?$`, 'i'), '')
            .trim();
    };

    const renderModalDescription = (item) => {
        const raw = item.dataset.desc || '';
        const volume = getCommonVolume(raw, item.dataset.category);
        const displayRaw = stripCommonVolume(raw, volume);
        menuModalVolume.textContent = volume;

        const lines = displayRaw
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);

        if ((item.dataset.category === 'drinks' || item.dataset.category === 'cocktails') && lines.length > 1) {
            const linesWrap = document.createElement('div');
            linesWrap.className = 'menu-modal-lines';

            lines.forEach(line => {
                const parts = line.split(/\s[—-]\s(.+)/);
                const lineEl = document.createElement('div');
                lineEl.className = 'menu-modal-line';
                const titleEl = document.createElement('div');
                titleEl.className = 'menu-modal-line-title';
                titleEl.textContent = parts[0] || line;
                lineEl.appendChild(titleEl);

                if (parts.length >= 3) {
                    const descEl = document.createElement('div');
                    descEl.className = 'menu-modal-line-desc';
                    descEl.textContent = parts[1];
                    lineEl.appendChild(descEl);
                }

                linesWrap.appendChild(lineEl);
            });

            menuModalDesc.replaceChildren(linesWrap);
        } else {
            menuModalDesc.textContent = displayRaw;
        }
    };

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('kitchen-cat-card')) return;

            const imgUrl = item.dataset.img;
            const hasRealImage = imgUrl && !(imgUrl.includes('hhbar-hero-bg.jpg') && (item.dataset.category === 'drinks' || item.dataset.category === 'cocktails'));
            const modalImg = document.getElementById('menuModalImg');
            modalImg.classList.toggle('fill-width', Boolean(imgUrl && imgUrl.includes('img/kitchen/lemonade/')));
            modalImg.classList.toggle('fit-napitki', Boolean(imgUrl && imgUrl.includes('img/kitchen/Napitki/')));
            if (hasRealImage) {
                modalImg.style.backgroundImage = `url('${imgUrl}')`;
                modalImg.classList.remove('no-image');
                modalImg.innerHTML = '';
            } else {
                modalImg.style.backgroundImage = 'none';
                modalImg.classList.add('no-image');
                modalImg.innerHTML = '<i class="fas fa-utensils"></i>';
            }
            document.getElementById('menuModalName').textContent = item.dataset.name;
            const modalPrice = document.getElementById('menuModalPrice');
            const price = item.dataset.price || '';
            modalPrice.textContent = price.trim().toLowerCase().startsWith('от') ? '' : price;
            renderModalDescription(item);
            openModal(menuModal, item, closeMenuModal);
        });
    });
    closeMenuModal.addEventListener('click', () => {
        closeModal(menuModal);
    });
    menuModal.addEventListener('click', (e) => {
        if(e.target === menuModal) {
            closeModal(menuModal);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        closeModal(menuModal);
    });

    // =========================================
    // KITCHEN SUBCATEGORY MODAL
    // =========================================
    const kitchenMenuData = {
        soups: [
            { name: "Крем-суп тыквенный с крабом", price: "890₽", desc: "Нежный тыквенный овощной крем-суп с мясом камчатского краба и сливками" },
            { name: "Любимый суп шефа", price: "490₽", desc: "Куриный бульон с лапшой, копченой грудкой и половинкой яйца. Подается с жареным беконом, соусом дзадзики, сухариками, томатами черри зеленым луком и жареным хлебом" },
            { name: "Том-ям", price: "710₽", desc: "Тайский суп в авторской интерпретации с грибами шиитаке и луком порей" },
            { name: "Крем-суп с гребешком", price: "740₽", desc: "Нежно-сливочный крем-суп с жареным гребешком и трюфельным маслом" },
            { name: "Крем-суп из курицы и шпината", price: "590₽", desc: "Легкий сливочный овощной крем-суп со шпинатом и куриной грудкой из собственной коптильни" }
        ],
        salads: [
            { name: "Баварский салат", price: "510₽", desc: "Овощной микс-салат с жареными баварскими колбасками и картофелем бейби на чесночном масле и травах" },
            { name: "Салат с жареным сыром и беконом", price: "590₽", desc: "Овощной микс-салат с жареными беконом, сыром моцареллой и медово-горчичной заправкой" },
            { name: "Боул с курицей и киноа", price: "680₽", desc: "Боул с киноа, копченой куриной грудкой, ананасом, авокадо и овощами в сочетании с азиатским соусом" },
            { name: "Цезарь с курицей", price: "560₽", desc: "Куриная грудка из собственной коптильни, салат айсберг, помидоры черри, крутоны и насыщенный соус Цезарь под чипсами из пармезана" },
            { name: "Салат с говяжьей вырезкой", price: "630₽", desc: "Овощной микс-салат с говяжьим ростбисом, яйцом пашот и ореховой заправкой" },
            { name: "Салат с жареным авокадо и лососем", price: "820₽", desc: "Овощной микс-салат с жареным авокадо, лососем авторского посола и пряной заправкой на основе кинзы и соусов азиатской кухни" },
            { name: "Салат с креветками и авокадо", price: "640₽", desc: "Легкий овощной салат из тигровых креветок, спелого авокадо и китайской капусты с фирменным соусом и икрой масаго" },
            { name: "Салат с лососем и грушей", price: "640₽", desc: "Овощной микс-салат с лососем авторского посола, винной грушей и цитрусовой дрессинг-заправкой" },
            { name: "Салат с тунцом", price: "650₽", desc: "Овощной микс-салат с нежным тунцом средней прожарки и цитрусовой дрессинг-заправкой" },
            { name: "Цезарь с креветкой", price: "640₽", desc: "Нежные тигровые креветки и свежие листья айсберга, заправленные сливочным соусом Цезарь с хрустящими крутонами и чипсами из пармезана" }
        ],
        pizzas: [
            { name: "Пицца с тигровыми креветками", price: "880₽", desc: "Пицца с тигровыми креветками" },
            { name: "Мясная", price: "860₽", desc: "Мясная пицца" },
            { name: "Сырная", price: "740₽", desc: "Сырная пицца" },
            { name: "С копченой грудкой", price: "790₽", desc: "Пицца с копченой грудкой" }
        ],
        hot: [
            { name: "Скерт стейк", price: "1350₽", desc: "Сочный стейк из диафрагмы с явно выраженными волокнами и насыщенным ароматом говядины. Гарнир и соус на выбор. Прожарка Medium" },
            { name: "Блейд стейк", price: "1350₽", desc: "Говяжий стейк из лопаточного отруба с ярко выраженной жилой, разделяющей мясо на две части. Гарнир и соус на выбор. Прожарка Medium" },
            { name: "Стейк свинина", price: "890₽", desc: "Большой и сочный кусок свиной шеи, приготовленный на гриле с горчичным соусом, подается с гарниром из меню на выбор" },
            { name: "Стейк лосось", price: "990₽", desc: "Свежий лосось, приготовленный на гриле, подается с розовым картофельным пюре и соусом терияки" },
            { name: "Стейк из тунца", price: "1170₽", desc: "Стейк из тунца средней прожарки, обжаренный в маринаде на сливочном масле. Подается с пюре из зеленого горошка" },
            { name: "Бифштекс с яйцом пашот", price: "880₽", desc: "Бифштекс из говяжьей вырезки, приготовленный на гриле, подается с пюре из сельдерея и поджаренной чиабаттой" },
            { name: "Карбонара", price: "560₽", desc: "Классическая паста карбонара" },
            { name: "Паста с курицей и перечным соусом", price: "550₽", desc: "Паста с курицей и перечным соусом" },
            { name: "Путтанеска", price: "590₽", desc: "Паста путтанеска" }
        ],
        snacks: [
            { name: "Сет брускетт Северный", price: "920₽", desc: "Сет из 4 брускетт: с олениной су-вид и облепиховым соусом, с тартаром из лосося, с гребешком, с тартаром из огурцов и вяленых томатов" },
            { name: "Сет брускетт Винный", price: "920₽", desc: "Сет из 4 брускетт: с тартаром из говяжьей вырезки, с тигровыми креветками, с сыром бри, с авокадо и клубничным муссом" },
            { name: "Сет брускетт Классический", price: "920₽", desc: "Сет из 4 брускетт: с ростбифом, с лососем, с креветками, с моцареллой и оливковым дрессингом" },
            { name: "Тартар из говяжьей вырезки", price: "780₽", desc: "Нежная говяжья вырезка с трюфельным сыром, кинзой, красным луком, соусом ворчестер, горчицей и чиабаттой" },
            { name: "Севиче из Мурманской трески", price: "490₽", desc: "Треска авторского посола с картофелем, черным жареным хлебом и соевым соусом" },
            { name: "Закуска из гребешка и лосося", price: "950₽", desc: "Гребешок и лосось авторского посола с чиабаттой, сливочно-трюфельным сыром и клубничным муссом" },
            { name: "Пивной сет", price: "1490₽", desc: "Крылья BBQ, Фиш Чипс, креветки темпура, кольца кальмара, жареный сыр, картофель фри и три соуса" },
            { name: "Фиш Чипс", price: "420₽", desc: "Северная треска в хрустящем пивном кляре" },
            { name: "Жареные крылышки BBQ", price: "360₽", desc: "Куриные крылья в фирменном соусе BBQ" },
            { name: "Креветки темпура", price: "450₽", desc: "Хрустящие тигровые креветки в пивном кляре" },
            { name: "Кольца кальмара", price: "350₽", desc: "Кольца кальмара в хрустящем кляре" },
            { name: "Луковые кольца", price: "275₽", desc: "Луковые кольца в хрустящем кляре" },
            { name: "Куриные стрипсы", price: "320₽", desc: "Хрустящие куриные стрипсы в кляре" }
        ]
    };

    const getKitchenModalParts = () => ({
        modal: document.getElementById("kitchenModal"),
        close: document.getElementById("closeKitchenModal"),
        title: document.getElementById("kitchenModalTitle"),
        list: document.getElementById("kitchenModalList")
    });

    const closeKitchenMenu = () => {
        const { modal } = getKitchenModalParts();
        closeModal(modal);
    };

    document.addEventListener("click", (e) => {
        const card = e.target.closest(".kitchen-cat-card");
        if (!card) return;

        const { modal, close, title, list } = getKitchenModalParts();
        const items = kitchenMenuData[card.dataset.subcat];
        if (!modal || !title || !list || !items) return;

        title.textContent = card.dataset.name;
        list.replaceChildren();

        items.forEach(item => {
            const itemEl = document.createElement("div");
            itemEl.className = "kitchen-modal-item";
            const infoEl = document.createElement("div");
            infoEl.className = "kitchen-modal-item-info";
            const nameEl = document.createElement("div");
            nameEl.className = "kitchen-modal-item-name";
            nameEl.textContent = item.name;
            const descEl = document.createElement("div");
            descEl.className = "kitchen-modal-item-desc";
            descEl.textContent = item.desc;
            const priceEl = document.createElement("div");
            priceEl.className = "kitchen-modal-item-price";
            priceEl.textContent = item.price;
            infoEl.append(nameEl, descEl);
            itemEl.append(infoEl, priceEl);
            list.appendChild(itemEl);
        });

        openModal(modal, card, close);
    });

    document.addEventListener("click", (e) => {
        const { modal, close } = getKitchenModalParts();
        if (!modal) return;
        if (e.target === modal || e.target === close) closeKitchenMenu();
    });

    document.addEventListener("keydown", (e) => {
        const activeModal = document.querySelector('.menu-modal.active, .kitchen-modal.active');
        if (!activeModal) return;
        if (e.key === "Escape") closeModal(activeModal);
        trapFocus(e, activeModal);
    });
});
