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
        if (!document.querySelector('.gallery-modal.active, .dj-modal.active')) unlockPageScroll();
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
    // PARTICLE BACKGROUND
    // =========================================
    const pCanvas = document.getElementById('particleCanvas');
    const particlesEnabled = window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!particlesEnabled) pCanvas.hidden = true;
    const pCtx = pCanvas.getContext('2d');
    let particles = [];
    let pMouse = { x: null, y: null, radius: 150 };
    let animationId;

    function resizePCanvas() {
        pCanvas.width = window.innerWidth;
        pCanvas.height = window.innerHeight;
    }
    resizePCanvas();
    window.addEventListener('resize', resizePCanvas);

    class Particle {
        constructor() {
            this.x = Math.random() * pCanvas.width;
            this.y = Math.random() * pCanvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.color = Math.random() > 0.5 ? 'rgba(0, 243, 255, ' : 'rgba(255, 0, 255, ';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > pCanvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > pCanvas.height) this.speedY *= -1;

            if (pMouse.x != null) {
                let dx = pMouse.x - this.x;
                let dy = pMouse.y - this.y;
                let distance = Math.sqrt(dx*dx + dy*dy);
                if (distance < pMouse.radius) {
                    const force = (pMouse.radius - distance) / pMouse.radius;
                    this.x -= dx * force * 0.02;
                    this.y -= dy * force * 0.02;
                }
            }
        }
        draw() {
            pCtx.fillStyle = this.color + (Math.random() * 0.3 + 0.2) + ')';
            pCtx.beginPath();
            pCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            pCtx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const count = particlesEnabled ? 80 : 0;
        for (let i = 0; i < count; i++) particles.push(new Particle());
    }
    initParticles();

    function connectParticles() {
        const maxDist = 120;
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                let dx = particles[i].x - particles[j].x;
                let dy = particles[i].y - particles[j].y;
                let dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < maxDist) {
                    pCtx.strokeStyle = 'rgba(0, 243, 255, ' + (0.1 * (1 - dist/maxDist)) + ')';
                    pCtx.lineWidth = 0.5;
                    pCtx.beginPath();
                    pCtx.moveTo(particles[i].x, particles[i].y);
                    pCtx.lineTo(particles[j].x, particles[j].y);
                    pCtx.stroke();
                }
            }
        }
    }

    let frameCount = 0;
    function animateParticles() {
        if (!particlesEnabled) return;
        frameCount++;
        const skipFrames = window.innerWidth < 768 ? 2 : 1;
        if (frameCount % skipFrames === 0) {
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            connectParticles();
        }
        animationId = requestAnimationFrame(animateParticles);
    }
    animateParticles();

    document.addEventListener('mousemove', (e) => {
        pMouse.x = e.clientX;
        pMouse.y = e.clientY;
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animateParticles();
        }
    });

    // =========================================
    // MAGNETIC BUTTONS
    // =========================================
    function bindMagneticButton(btn) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        if (btn.dataset.magneticReady) return;
        btn.dataset.magneticReady = 'true';
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const rect = this.getBoundingClientRect();
            ripple.style.left = (e.clientX - rect.left) + 'px';
            ripple.style.top = (e.clientY - rect.top) + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    }

    document.querySelectorAll('.magnetic-btn').forEach(bindMagneticButton);

    // =========================================
    // THEME TOGGLE
    // =========================================
    const footerThemeToggle = document.getElementById('footerThemeToggle');
    const body = document.body;
    footerThemeToggle.addEventListener('click', () => {
        body.classList.toggle('magenta-mode');
        const isMagenta = body.classList.contains('magenta-mode');
        footerThemeToggle.textContent = isMagenta ? 'Акцент: пурпурный' : 'Акцент: бирюзовый';
        footerThemeToggle.setAttribute('aria-label', 'Сменить цветовой акцент');
    });

    // =========================================
    // MOBILE MENU
    // =========================================
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    const setMobileNavOpen = (open) => {
        navLinks.classList.toggle('active', open);
        menuBtn.setAttribute('aria-expanded', open);
        menuBtn.setAttribute('aria-label', open ? 'Закрыть навигацию' : 'Открыть навигацию');
        menuBtn.innerHTML = open ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    };

    menuBtn.addEventListener('click', () => {
        setMobileNavOpen(!navLinks.classList.contains('active'));
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            setMobileNavOpen(false);
            menuBtn.focus();
        }
    });

    document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(link => {
        link.addEventListener('click', () => {
            setMobileNavOpen(false);
            document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // =========================================
    // EVENTS FROM JSON
    // =========================================
    const eventsGrid = document.getElementById('eventsGrid');

    function createEventCard(event) {
        const card = document.createElement('div');
        card.className = 'event-card-3d';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-expanded', 'false');
        card.setAttribute('aria-label', event.ariaLabel || `${event.title}, ${event.date}`);

        const front = document.createElement('div');
        front.className = 'card-face card-front';
        front.style.backgroundImage = `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%), url('${event.image}')`;

        const date = document.createElement('div');
        date.className = 'event-date';
        date.textContent = event.date;

        const hint = document.createElement('p');
        hint.className = 'event-hint';
        hint.textContent = 'Нажмите, чтобы узнать больше';
        front.append(date, hint);

        const back = document.createElement('div');
        back.className = 'card-face card-back';
        back.inert = true;

        const title = document.createElement('h3');
        title.textContent = event.title;
        back.appendChild(title);

        (event.description || []).forEach(text => {
            const paragraph = document.createElement('p');
            paragraph.textContent = text;
            back.appendChild(paragraph);
        });

        const booking = document.createElement('a');
        booking.href = event.bookingUrl || 'booking.html';
        booking.className = 'btn magnetic-btn book-trigger';
        booking.style.marginTop = '20px';
        booking.textContent = 'Забронировать столик';
        bindMagneticButton(booking);
        back.appendChild(booking);

        card.append(front, back);
        return card;
    }

    function bindEventCard(card) {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return;
            toggleEventCard(card);
        });
        card.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            if (e.target.closest('a')) return;
            e.preventDefault();
            toggleEventCard(card);
        });
    }

    async function loadEvents() {
        if (!eventsGrid) return;
        try {
            let data = window.HHBAR_EVENTS;
            if (!Array.isArray(data)) {
                const response = await fetch('src/data/events.json', { cache: 'no-store' });
                if (!response.ok) throw new Error(`events.json ${response.status}`);
                data = await response.json();
            }
            if (!Array.isArray(data)) throw new Error('Invalid events');
            const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
            const events = data.slice(0, 100).map(item => HHData.eventData(item, location.href, today)).filter(Boolean);
            eventsGrid.replaceChildren(...events.map(createEventCard));
            eventsGrid.querySelectorAll('.event-card-3d').forEach(bindEventCard);
        } catch (error) {
            const fallback = document.createElement('p');
            fallback.className = 'events-empty';
            fallback.textContent = 'Афиша скоро обновится. Для актуальных событий смотрите VK или Telegram.';
            eventsGrid.replaceChildren(fallback);
        }
    }

    const toggleEventCard = (card) => {
        const flipped = card.classList.toggle('flipped');
        card.setAttribute('aria-expanded', flipped);
        card.querySelector('.card-back').inert = !flipped;
    };

    loadEvents();

    // =========================================
    // GALLERY SLIDER MODAL
    // =========================================
    const galleryModal = document.getElementById('galleryModal');
    const modalSlides = document.querySelectorAll('.modal-gallery-slide');
    const modalPrevBtn = document.getElementById('modalPrevBtn');
    const modalNextBtn = document.getElementById('modalNextBtn');
    const modalCounter = document.getElementById('modalCounter');
    const closeGalleryModal = document.getElementById('closeGalleryModal');
    const galleryItems = document.querySelectorAll('.gallery-item');
    let currentModalSlide = 0;
    let currentGallerySet = 0;

    function showModalSlide(index) {
        modalSlides.forEach(slide => slide.classList.remove('active'));
        modalSlides[index].classList.add('active');
        modalCounter.textContent = `${index + 1} / ${modalSlides.length}`;
        currentModalSlide = index;
    }

    galleryItems.forEach((item) => {
        item.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            item.click();
        });
        item.addEventListener('click', () => {
            currentGallerySet = parseInt(item.dataset.galleryIndex);
            modalSlides.forEach((slide, slideIndex) => {
                const imgPath = `img/gallery/g${currentGallerySet + 1}/${slideIndex + 1}.jpg`;
                slide.style.backgroundImage = `url('${imgPath}')`;
            });
            currentModalSlide = 0;
            showModalSlide(0);
            openModal(galleryModal, item, closeGalleryModal);
        });
    });

    modalPrevBtn.addEventListener('click', () => {
        currentModalSlide = (currentModalSlide - 1 + modalSlides.length) % modalSlides.length;
        showModalSlide(currentModalSlide);
    });

    modalNextBtn.addEventListener('click', () => {
        currentModalSlide = (currentModalSlide + 1) % modalSlides.length;
        showModalSlide(currentModalSlide);
    });

    closeGalleryModal.addEventListener('click', () => {
        closeModal(galleryModal);
    });

    galleryModal.addEventListener('click', (e) => {
        if(e.target === galleryModal) {
            closeModal(galleryModal);
        }
    });

    // =========================================
    // DJ PHOTO MODAL
    // =========================================
    const djModal = document.getElementById('djModal');
    const closeDjModal = document.getElementById('closeDjModal');
    const djModalPhoto = document.getElementById('djModalPhoto');
    const djModalName = document.getElementById('djModalName');
    const djSocialLink = document.getElementById('djSocialLink');
    const djTelegramLink = document.getElementById('djTelegramLink');
    const djPhotos = document.querySelectorAll('.dj-photo');
    const formatDjName = (name) => name.replace(/\(([^)]+)\)/g, '\u00A0($1)');

    djPhotos.forEach(photo => {
        photo.addEventListener('click', (e) => {
            e.stopPropagation();
            const djItem = photo.closest('.dj-item');
            const djName = djItem.dataset.dj;
            const djPhoto = djItem.dataset.photo;
            const djSocial = djItem.dataset.social;
            const djTelegram = djItem.dataset.telegram;

            djModalName.textContent = formatDjName(djName);
            djModalPhoto.style.backgroundImage = `url('${djPhoto}')`;
            djSocialLink.href = djSocial;
            if (djTelegram) {
                djTelegramLink.href = djTelegram;
                djTelegramLink.classList.remove('hidden');
            } else {
                djTelegramLink.href = 'https://t.me/hhbar_murmansk';
                djTelegramLink.classList.add('hidden');
            }

            openModal(djModal, photo, closeDjModal);
        });
    });

    djSocialLink.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    djTelegramLink.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    closeDjModal.addEventListener('click', () => {
        closeModal(djModal);
    });

    djModal.addEventListener('click', (e) => {
        if(e.target === djModal) {
            closeModal(djModal);
        }
    });

    document.addEventListener('keydown', (e) => {
        const activeModal = document.querySelector('.gallery-modal.active, .dj-modal.active');
        if (!activeModal) return;
        if (e.key === 'Escape') closeModal(activeModal);
        trapFocus(e, activeModal);
    });

    // =========================================
    // MUSIC PLAYER WITH LOCAL AUDIO FILES
    // =========================================
    const audio = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const trackName = document.getElementById('trackName');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const prevTrackBtn = document.getElementById('prevTrack');
    const nextTrackBtn = document.getElementById('nextTrack');
    const volumeSlider = document.getElementById('volumeSlider');
    let isPlaying = false;
    let audioContext, analyser, dataArray, source;
    let currentTracks = [];
    let currentTrackIndex = 0;
    let currentDjIndex = 0;
    let musicLibrary = null;

    function initAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            dataArray = new Uint8Array(analyser.frequencyBinCount);
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function getTrackTitleEl() {
        return document.querySelector('#trackName .track-title');
    }

    function updateTrackStatus(playing) {
        const status = document.querySelector('#trackName .track-status');
        if (status) {
            status.classList.toggle('paused', !playing);
        }
    }

    function setTrackTitle(name) {
        const title = getTrackTitleEl();
        if (title) {
            title.textContent = name;
            title.title = name;
        }
    }

    function loadTrack(src, name) {
        audio.src = src;
        setTrackTitle(name);
        currentTimeEl.textContent = '0:00';
        durationEl.textContent = '0:00';
        progressFill.style.width = '0%';
        updateTrackStatus(false);
    }

    async function playAudio() {
        if (!audio.src) {
            if (currentTracks.length) {
                selectTrack(0, false);
            }
        }
        if (!audio.src) return;

        try {
            initAudioContext();
            await audio.play();
            isPlaying = true;
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            playBtn.setAttribute('aria-label', 'Пауза');
            updateTrackStatus(true);
        } catch (e) {
            showToast('Нажмите на страницу для воспроизведения музыки', false);
            isPlaying = false;
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            playBtn.setAttribute('aria-label', 'Воспроизвести');
            updateTrackStatus(false);
        }
    }

    function pauseAudio() {
        audio.pause();
        isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playBtn.setAttribute('aria-label', 'Воспроизвести');
        updateTrackStatus(false);
    }

    playBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
    });

    prevTrackBtn.addEventListener('click', () => moveTrack(-1));
    nextTrackBtn.addEventListener('click', () => moveTrack(1));

    audio.volume = 0.8;
    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value / 100;
    });

    audio.addEventListener('timeupdate', () => {
        if(audio.duration && !isNaN(audio.duration)) {
            const pct = (audio.currentTime / audio.duration) * 100;
            progressFill.style.width = pct + '%';
            progressBar.setAttribute('aria-valuenow', Math.round(pct));
            progressBar.setAttribute('aria-valuetext', `${formatTime(audio.currentTime)} из ${formatTime(audio.duration)}`);
            currentTimeEl.textContent = formatTime(audio.currentTime);
            durationEl.textContent = formatTime(audio.duration);
        }
    });

    audio.addEventListener('ended', () => {
        if (currentTrackIndex < currentTracks.length - 1) {
            moveTrack(1, true);
        } else {
            pauseAudio();
            audio.currentTime = 0;
        }
    });

    audio.addEventListener('waiting', () => {
        setTrackTitle('Загрузка...');
    });

    audio.addEventListener('canplay', () => {
        const activeTrack = currentTracks[currentTrackIndex];
        if (activeTrack) {
            setTrackTitle(activeTrack.displayName);
        }
    });

    audio.addEventListener('error', (e) => {
        pauseAudio();
        showToast('Ошибка загрузки аудиофайла', true);
        setTrackTitle('Ошибка загрузки');
    });

    function seekToPosition(pos) {
        if (audio.duration && !isNaN(audio.duration)) {
            audio.currentTime = Math.min(Math.max(pos, 0), 1) * audio.duration;
        }
    }

    progressBar.addEventListener('click', (e) => {
        const rect = progressBar.getBoundingClientRect();
        seekToPosition((e.clientX - rect.left) / rect.width);
    });

    progressBar.addEventListener('keydown', (e) => {
        if (!audio.duration || isNaN(audio.duration)) return;
        const step = e.shiftKey ? 30 : 10;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); audio.currentTime = Math.max(0, audio.currentTime - step); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); audio.currentTime = Math.min(audio.duration, audio.currentTime + step); }
        if (e.key === 'Home') { e.preventDefault(); audio.currentTime = 0; }
        if (e.key === 'End') { e.preventDefault(); audio.currentTime = audio.duration; }
    });

    // DJ selection with generated local audio data
    const djItems = document.querySelectorAll('.dj-item');
    const playlistContainer = document.querySelector('.playlist');

    function normalizeTrack(track) {
        const displayName = track.displayName || track.name || track.fileName || 'Без названия';
        return { src: HHData.localAsset(track.src, 'audio/', location.href), displayName };
    }

    async function loadMusicLibrary() {
        try {
            if (window.HHBAR_MUSIC && typeof window.HHBAR_MUSIC === 'object') {
                musicLibrary = window.HHBAR_MUSIC;
                return;
            }
            const response = await fetch('src/scripts/music_data.json?v=20260505-1', { cache: 'no-store' });
            if (!response.ok) throw new Error(`music_data.json ${response.status}`);
            musicLibrary = await response.json();
        } catch (e) {
            musicLibrary = null;
        }
    }

    function getFallbackTracks(item) {
        try {
            return [];
        } catch (e) {
            return [];
        }
    }

    function getTracksForDj(item, index) {
        const key = item.dataset.folder || `dj${index + 1}`;
        if (musicLibrary && Object.prototype.hasOwnProperty.call(musicLibrary, key)) {
            return Array.isArray(musicLibrary[key]) ? musicLibrary[key].filter(t => t && typeof t.src === 'string').map(normalizeTrack).filter(t => t.src) : [];
        }
        return musicLibrary ? [] : getFallbackTracks(item);
    }

    function renderPlaylist(tracks) {
        playlistContainer.innerHTML = '';

        if (!tracks.length) {
            const empty = document.createElement('div');
            empty.className = 'track-item empty';
            empty.textContent = 'Треки не найдены';
            playlistContainer.appendChild(empty);
            setTrackTitle('Треки не найдены');
            audio.removeAttribute('src');
            audio.load();
            return;
        }

        tracks.forEach((track, i) => {
            const trackEl = document.createElement('button');
            trackEl.type = 'button';
            trackEl.className = `track-item ${i === 0 ? 'active' : ''}`;
            trackEl.dataset.index = i;

            const icon = document.createElement('i');
            icon.className = 'fas fa-music';
            icon.setAttribute('aria-hidden', 'true');

            const label = document.createElement('span');
            label.textContent = track.displayName;
            label.title = track.displayName;
            trackEl.title = track.displayName;

            trackEl.append(icon, label);
            trackEl.addEventListener('click', () => selectTrack(i, isPlaying));
            playlistContainer.appendChild(trackEl);
        });
    }

    function selectTrack(index, shouldPlay = false) {
        if (!currentTracks[index]) return;
        currentTrackIndex = index;
        document.querySelectorAll('.track-item').forEach((track, i) => {
            track.classList.toggle('active', i === index);
        });
        loadTrack(currentTracks[index].src, currentTracks[index].displayName);
        if (shouldPlay) playAudio();
    }

    function moveTrack(delta, shouldPlay = isPlaying) {
        const nextIndex = currentTrackIndex + delta;
        if (nextIndex >= 0 && nextIndex < currentTracks.length) {
            selectTrack(nextIndex, shouldPlay);
        }
    }

    function selectDj(item, index, shouldPlay = false) {
        pauseAudio();
        djItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        currentDjIndex = index;
        currentTracks = getTracksForDj(item, index);
        renderPlaylist(currentTracks);
        selectTrack(0, shouldPlay);
    }

    djItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('dj-photo') || e.target.closest('.dj-modal')) return;
            selectDj(item, index, isPlaying);
        });
    });

    playlistContainer.innerHTML = '<div class="track-item empty">Загрузка треков...</div>';
    loadMusicLibrary().then(() => {
        const activeDj = document.querySelector('.dj-item.active') || djItems[0];
        if (activeDj) selectDj(activeDj, Array.from(djItems).indexOf(activeDj), false);
    });

    // Waveform Visualization
    const wfCanvas = document.getElementById('waveformCanvas');
    const wfCtx = wfCanvas.getContext('2d');
    let lastTimestamp = 0;
    const DRAW_INTERVAL = 1000 / 30;
    let isWaveformActive = false;
    let waveformFrame;

    function resizeWfCanvas() {
        wfCanvas.width = wfCanvas.offsetWidth;
        wfCanvas.height = wfCanvas.offsetHeight;
    }
    resizeWfCanvas();
    window.addEventListener('resize', resizeWfCanvas);

    function drawWaveform() {
        if (document.hidden || !isWaveformActive || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const now = performance.now();
        if (now - lastTimestamp >= DRAW_INTERVAL) {
            if (!analyser || !isWaveformActive) {
                waveformFrame = requestAnimationFrame(drawWaveform);
                return;
            }

            analyser.getByteFrequencyData(dataArray);
            wfCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            wfCtx.fillRect(0, 0, wfCanvas.width, wfCanvas.height);

            const barWidth = (wfCanvas.width / dataArray.length) * 2.5;
            let x = 0;

            for(let i = 0; i < dataArray.length; i++) {
                const barHeight = (dataArray[i] / 255) * wfCanvas.height;
                const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary').trim() || '#00f3ff';
                const secondaryColor = getComputedStyle(document.body).getPropertyValue('--secondary').trim() || '#ff00ff';
                const gradient = wfCtx.createLinearGradient(0, wfCanvas.height - barHeight, 0, wfCanvas.height);
                gradient.addColorStop(0, primaryColor);
                gradient.addColorStop(1, secondaryColor);

                wfCtx.fillStyle = gradient;
                wfCtx.fillRect(x, wfCanvas.height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
            lastTimestamp = now;
        }
        waveformFrame = requestAnimationFrame(drawWaveform);
    }
    drawWaveform();

    // Pause waveform when not playing
    audio.addEventListener('play', () => { isWaveformActive = true; cancelAnimationFrame(waveformFrame); drawWaveform(); });
    document.addEventListener('visibilitychange', () => { cancelAnimationFrame(waveformFrame); if (!document.hidden) drawWaveform(); });
    if ('mediaSession' in navigator) {
        for (const [action, handler] of Object.entries({ play: playAudio, pause: pauseAudio, previoustrack: () => moveTrack(-1), nexttrack: () => moveTrack(1) })) {
            try { navigator.mediaSession.setActionHandler(action, handler); } catch {}
        }
        audio.addEventListener('play', () => {
            if ('MediaMetadata' in window) navigator.mediaSession.metadata = new MediaMetadata({ title: currentTracks[currentTrackIndex]?.displayName || 'HHBAR', artist: djItems[currentDjIndex]?.dataset.dj || 'HHBAR' });
        });
    }
    audio.addEventListener('pause', () => { isWaveformActive = false; });
    audio.addEventListener('ended', () => { isWaveformActive = false; });// TOAST NOTIFICATION
    // =========================================
    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast' + (isError ? ' error' : '');
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 4000);
    }

    // =========================================
    // SCROLL TEXT REVEAL
    // =========================================
    function initTextReveal() {
        document.querySelectorAll('.reveal-text').forEach(el => {
            const text = el.textContent;
            el.innerHTML = '';
            text.split(' ').forEach((word, i) => {
                const span = document.createElement('span');
                span.classList.add('word');
                span.textContent = word + ' ';
                span.style.transitionDelay = (i * 0.05) + 's';
                el.appendChild(span);
            });
            setTimeout(() => el.classList.add('visible'), 100);
        });
    }
    initTextReveal();

    // =========================================
    // SCROLL ANIMATIONS
    // =========================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add("active");
        });
    }, { threshold: 0.1 });
    document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

    // =========================================
    // SMOOTH SCROLL
    // =========================================
    document.querySelectorAll("a[href^=\"#\"]").forEach(anchor => {
        anchor.addEventListener("click", function(e) {
            const href = this.getAttribute("href");
            if (!href || href === "#" || !href.startsWith("#")) return;
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });

    // =========================================
    // BACK TO TOP
    // =========================================
    const backToTop = document.createElement("button");
    backToTop.className = "back-to-top";
    backToTop.innerHTML = "<i class=\"fas fa-arrow-up\"></i>";
    backToTop.setAttribute("aria-label", "Наверх");
    document.body.appendChild(backToTop);

    backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    let scrollTimeout;
    window.addEventListener("scroll", () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            if (window.pageYOffset > 500) {
                backToTop.classList.add("active");
            } else {
                backToTop.classList.remove("active");
            }
        }, 100);
    });

    // Initialize AudioContext on first interaction
    document.body.addEventListener("click", () => {
        if (audioContext && audioContext.state === "suspended") {
            audioContext.resume();
        }
    }, { once: true });

});
