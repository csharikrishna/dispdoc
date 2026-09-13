/**
 * ==========================================================================
 * DisplayDoctor Pro // Unified Diagnostic & Calibration Engine
 * Built for Desktop, Tablet, and Mobile (OLED & IPS Specialization)
 * Production-ready, zero-dependency engine for GitHub Pages
 * ==========================================================================
 */

'use strict';

// ==========================================================================
// 1. AUDIO SYNTHESIZER
// ==========================================================================
const AudioEngine = {
    ctx: null,
    muted: false,

    init() {
        if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio not supported:', e);
            }
        }
        this.muted = localStorage.getItem('dispdoc_mute') === 'true';
        this.updateMuteIcon();
    },

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('dispdoc_mute', this.muted);
        this.updateMuteIcon();
        if (!this.muted) this.playTone(880, 0.05, 'sine');
    },

    updateMuteIcon() {
        const icon = document.getElementById('muteIcon');
        if (icon) {
            icon.innerHTML = this.muted
                ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
                : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        }
    },

    playTone(freq = 440, duration = 0.08, type = 'sine', volume = 0.05) {
        if (this.muted || !this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            // Non-blocking
        }
    },

    playClick() { this.playTone(900, 0.06, 'sine', 0.04); },
    playHover() { this.playTone(220, 0.03, 'triangle', 0.015); },
    playAlert() { this.playTone(550, 0.2, 'sawtooth', 0.04); },
    playSuccess() {
        this.playTone(523.25, 0.08, 'sine', 0.04);
        setTimeout(() => this.playTone(659.25, 0.12, 'sine', 0.04), 80);
    }
};

// ==========================================================================
// 2. HARDWARE & TELEMETRY MONITOR
// ==========================================================================
const Telemetry = {
    lastTime: performance.now(),
    frameCount: 0,
    fps: 60,
    frameTime: 16.67,
    frameTimes: new Float32Array(60),
    frameIndex: 0,
    droppedFrames: 0,
    targetFrameTime: 16.67, // Default 60Hz

    // Measured Refresh Rate
    refreshRate: 0,
    refreshDetected: false,
    measureStart: 0,
    measureFrames: 0,
    detectingRafId: null,

    init() {
        this.measureStart = performance.now();
        this.measureFrames = 0;
        this.detectDisplaySpecs();
        this.startRefreshRateDetection();

        // Re-detect on window resize or monitor migration
        let resizeTimer = null;
        window.addEventListener('resize', () => {
            this.detectDisplaySpecs();
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.refreshDetected = false;
                this.startRefreshRateDetection();
            }, 350);
        });
    },

    startRefreshRateDetection() {
        if (this.detectingRafId) {
            cancelAnimationFrame(this.detectingRafId);
            this.detectingRafId = null;
        }

        const refreshEl = document.getElementById('specRefresh');
        const bannerRefresh = document.getElementById('bannerRefresh');
        if (refreshEl && !this.refreshDetected) refreshEl.textContent = 'Detecting...';
        if (bannerRefresh && !this.refreshDetected) bannerRefresh.textContent = 'Detecting...';

        let frames = 0;
        const startTime = performance.now();
        let lastTime = startTime;
        const intervals = [];

        const sample = (now) => {
            frames++;
            const delta = now - lastTime;
            lastTime = now;

            // Discard startup anomaly and background tab stalls
            if (frames > 1 && delta > 2 && delta < 100) {
                intervals.push(delta);
            }

            const elapsed = now - startTime;

            // Sample for 500ms or 30 valid frame intervals for precision
            if (elapsed >= 500 && intervals.length >= 25) {
                intervals.sort((a, b) => a - b);
                // Trim 10% outliers (GC jitter or browser frame skip)
                const trim = Math.max(1, Math.floor(intervals.length * 0.1));
                const clean = intervals.slice(trim, intervals.length - trim);
                const avgInterval = clean.reduce((a, b) => a + b, 0) / clean.length;
                const rawHz = 1000 / avgInterval;

                // Common display refresh rates to snap within ±2.2 Hz
                const standardHz = [50, 60, 72, 75, 85, 90, 100, 120, 144, 165, 170, 175, 180, 200, 240, 280, 300, 360, 480, 500, 540];
                let detected = Math.round(rawHz);
                for (const std of standardHz) {
                    if (Math.abs(rawHz - std) <= 2.2) {
                        detected = std;
                        break;
                    }
                }

                this.refreshRate = detected;
                this.refreshDetected = true;
                this.targetFrameTime = 1000 / detected;
                this.detectingRafId = null;

                const text = `${detected} Hz`;
                if (refreshEl) refreshEl.textContent = text;
                if (bannerRefresh) bannerRefresh.textContent = text;
                return;
            }

            // Fallback safety timeout if running in heavily throttled environment
            if (elapsed >= 2500) {
                const fallbackHz = intervals.length > 5 
                    ? Math.round(1000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length))
                    : 60;
                this.refreshRate = fallbackHz;
                this.refreshDetected = true;
                this.targetFrameTime = 1000 / fallbackHz;
                this.detectingRafId = null;

                const text = `${fallbackHz} Hz`;
                if (refreshEl) refreshEl.textContent = text;
                if (bannerRefresh) bannerRefresh.textContent = text;
                return;
            }

            this.detectingRafId = requestAnimationFrame(sample);
        };

        this.detectingRafId = requestAnimationFrame(sample);
    },

    detectDisplaySpecs() {
        const dpr = window.devicePixelRatio || 1;
        // True physical display resolution
        const screenW = Math.round((window.screen.width || window.innerWidth) * dpr);
        const screenH = Math.round((window.screen.height || window.innerHeight) * dpr);
        const resText = `${screenW}×${screenH}`;
        const dprText = `${dpr.toFixed(2)}x (${Math.round(dpr * 100)}%)`;

        // Format color depth to reflect actual bits-per-channel (8-bit, 10-bit, 12-bit)
        const rawDepth = screen.colorDepth || 24;
        let depthText = '8-bit SDR';
        if (rawDepth >= 36) depthText = '12-bit Deep';
        else if (rawDepth >= 30) depthText = '10-bit HDR';
        else if (rawDepth === 16 || rawDepth === 18) depthText = '6-bit';
        else depthText = '8-bit SDR';

        const isWideP3 = window.matchMedia && window.matchMedia('(color-gamut: p3)').matches;
        const gamutText = isWideP3 ? 'DCI-P3' : 'sRGB';

        const specRes = document.getElementById('specRes');
        const specDpr = document.getElementById('specDpr');
        const specDepth = document.getElementById('specDepth');
        const specGamut = document.getElementById('specGamut');
        if (specRes) specRes.textContent = resText;
        if (specDpr) specDpr.textContent = dprText;
        if (specDepth) specDepth.textContent = depthText;
        if (specGamut) specGamut.textContent = gamutText;

        const bannerRes = document.getElementById('bannerRes');
        const bannerDpr = document.getElementById('bannerDpr');
        const bannerDepth = document.getElementById('bannerDepth');
        const bannerGamut = document.getElementById('bannerGamut');
        if (bannerRes) bannerRes.textContent = resText;
        if (bannerDpr) bannerDpr.textContent = dprText;
        if (bannerDepth) bannerDepth.textContent = depthText;
        if (bannerGamut) bannerGamut.textContent = gamutText;
    },

    update(now) {
        this.frameCount++;
        const delta = now - this.lastTime;
        this.lastTime = now;
        this.frameTime = delta;

        // Record rolling frame times for P95
        this.frameTimes[this.frameIndex] = delta;
        this.frameIndex = (this.frameIndex + 1) % this.frameTimes.length;

        // Dropped frame detector (>2x target)
        if (delta > this.targetFrameTime * 2.2) {
            this.droppedFrames++;
            const droppedEl = document.getElementById('statDropped');
            if (droppedEl) droppedEl.textContent = this.droppedFrames;
        }

        // Continual refinement if not yet detected
        if (!this.refreshDetected) {
            this.measureFrames++;
            const elapsed = now - this.measureStart;
            if (elapsed >= 800) {
                this.refreshRate = Math.round((this.measureFrames * 1000) / elapsed);
                this.refreshDetected = true;
                this.targetFrameTime = 1000 / this.refreshRate;
                const refreshEl = document.getElementById('specRefresh');
                if (refreshEl) refreshEl.textContent = `${this.refreshRate} Hz`;
                const bannerRefresh = document.getElementById('bannerRefresh');
                if (bannerRefresh) bannerRefresh.textContent = `${this.refreshRate} Hz`;
            }
        }

        // Update UI every 10 frames
        if (this.frameCount % 10 === 0) {
            const instantFps = 1000 / (delta || 16.67);
            this.fps = Math.round(this.fps * 0.75 + instantFps * 0.25);

            const fpsEl = document.getElementById('statFps');
            const frameTimeEl = document.getElementById('statFrameTime');

            if (fpsEl) {
                fpsEl.textContent = this.fps;
                fpsEl.className = 'stat-val ' + (this.fps >= 55 ? 'fps-high' : this.fps >= 30 ? 'fps-mid' : 'fps-low');
            }
            if (frameTimeEl) {
                frameTimeEl.textContent = `${delta.toFixed(1)} ms`;
            }
        }

        // Compute P95 every 30 frames
        if (this.frameCount % 30 === 0) {
            const copy = Array.from(this.frameTimes).filter(t => t > 0).sort((a, b) => a - b);
            if (copy.length > 5) {
                const p95 = copy[Math.floor(copy.length * 0.95)];
                const p95El = document.getElementById('statP95');
                if (p95El) p95El.textContent = `${p95.toFixed(1)} ms`;
            }
        }
    },

    reset() {
        this.droppedFrames = 0;
        this.frameCount = 0;
        const droppedEl = document.getElementById('statDropped');
        if (droppedEl) droppedEl.textContent = '0';
    }
};

// ==========================================================================
// 3. FAST BITWISE PRNG (XorShift32)
// ==========================================================================
class FastRNG {
    constructor(seed = 123456789) {
        this.state = seed;
    }
    next() {
        let x = this.state;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        this.state = x;
        return x >>> 0;
    }
}

// ==========================================================================
// 3.5 THEME MANAGER (DARK / LIGHT DUAL-THEME)
// ==========================================================================
const ThemeEngine = {
    current: 'dark',

    init() {
        const saved = localStorage.getItem('dispdoc_theme');
        if (saved === 'light' || saved === 'dark') {
            this.current = saved;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            this.current = 'light';
        } else {
            this.current = 'dark';
        }
        this.apply();
    },

    toggle() {
        this.current = this.current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('dispdoc_theme', this.current);
        this.apply();
        AudioEngine.playClick();
    },

    apply() {
        document.documentElement.setAttribute('data-theme', this.current);
        const icon = document.getElementById('themeIcon');
        const label = document.getElementById('themeLabel');
        if (this.current === 'light') {
            if (icon) icon.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
            if (label) label.textContent = 'Dark';
        } else {
            if (icon) icon.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
            if (label) label.textContent = 'Light';
        }
    }
};

// ==========================================================================
// 4. MAIN APPLICATION CORE
// ==========================================================================
const App = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    dpr: 1,
    isHiDpi: true,

    currentMode: null,
    animationId: null,
    isRunning: false,
    isPaused: false,

    motionSpeed: 480, // px/s for UFO test
    ireLevel: 0,      // 0-20% for near-black
    aplLevel: 10,     // 1-100% for ABL
    subpixelType: 'text',
    phoneOverlay: 'notch',
    reviverSize: 60,
    reviverFullscreen: false,

    safetyTimeout: null,
    safetySeconds: 15,
    autoCycleTimeout: null,
    autoCycleIndex: 0,
    autoCycleList: ['tv-static', 'rgb-noise', 'particles', 'matrix-rain', 'gradient-storm', 'rainbow'],

    // Test All Auto-Runner State
    isTestAllActive: false,
    testAllIndex: 0,
    testAllDuration: 4000,
    testAllTimer: null,
    testAllCountdownInterval: null,
    testAllRemainingSec: 4,

    idleTimer: null,
    toastTimer: null,
    isStatsVisible: false,
    rng: new FastRNG(Date.now()),

    testModesList: [
        'oled-black', 'near-black', 'burnin', 'subpixel', 'abl',
        'ufo-motion', 'backlight-bleed', 'viewing-angle', 'sharpness',
        'phone-burnin', 'pwm-flicker', 'touch-grid',
        'grayscale', 'gamma', 'black-clipping', 'white-clipping', 'color-banding',
        'tv-static', 'rgb-noise', 'particles', 'matrix-rain', 'gradient-storm', 'rainbow', 'pixel-reviver'
    ],

    testNames: {
        'oled-black': '0-Nit True Black (OLED)',
        'near-black': 'Near-Black Banding',
        'burnin': 'Burn-In & Dead Pixel Field',
        'pixel-reviver': 'Stuck Pixel Reviver',
        'subpixel': 'Subpixel & Text Fringing',
        'abl': 'ABL Window Dimming',
        'ufo-motion': 'UFO Motion Pursuit Ghosting',
        'backlight-bleed': 'Backlight Bleed & Uniformity',
        'viewing-angle': 'Viewing Angle & Gamma Shift',
        'sharpness': '1:1 Pixel Sharpness Grid',
        'phone-burnin': 'Status Bar & Notch Burn-In',
        'pwm-flicker': 'PWM Eye Strain Flicker',
        'touch-grid': 'Touch & Uniformity Grid',
        'grayscale': '32-Step Grayscale Ramp',
        'gamma': 'Gamma 2.2 Calibration Ramp',
        'black-clipping': 'Black-Level Shadow Clipping',
        'white-clipping': 'White-Level Highlight Clipping',
        'color-banding': 'Color Gradient Bit-Depth',
        'tv-static': 'TV Static (High Stress)',
        'rgb-noise': 'RGB Noise Stress',
        'particles': 'Particle Storm Benchmark',
        'matrix-rain': 'Matrix Rain High-FPS',
        'gradient-storm': 'Gradient Storm',
        'rainbow': 'Rainbow Chaos Benchmark',
        'strobe': 'High-Frequency Strobe',
        'color-flash': 'Rapid Color Flash',
        'autocycle': 'Auto-Cycle Stress Benchmark'
    },

    // Touch gesture state
    touchStartX: 0,
    touchStartY: 0,
    touchStartTime: 0,
    lastTapTime: 0,
    touchGridHits: new Set(),

    // Diagnostic Wizard Results
    wizardStep: 0,
    wizardActive: false,
    diagnosticFindings: {},

    // Test buffer caches
    noiseData: null,
    noiseBuf32: null,

    init() {
        this.canvas = document.getElementById('displayCanvas');
        this.ctx = this.canvas.getContext('2d', {
            alpha: false,
            desynchronized: true
        });

        AudioEngine.init();
        ThemeEngine.init();
        Telemetry.init();

        this.setupEventListeners();
        this.setupTouchGestures();
        this.setupDraggableHud();
        this.setupReviverDrag();
        this.setupFullscreenListeners();
        this.resizeCanvas();
        this.checkWarningStatus();

        // Default initial screen
        this.renderStandby();
    },

    // Photosensitivity Warning State
    checkWarningStatus() {
        const accepted = localStorage.getItem('dispdoc_warning_accepted') === 'true';
        const modal = document.getElementById('warningModal');
        if (!modal) return;
        if (accepted) {
            if (!document.fullscreenElement) {
                const title = document.getElementById('warningTitle');
                const lead = modal.querySelector('.warning-lead');
                const sub = modal.querySelector('.warning-sub');
                const btn = document.getElementById('acceptWarningBtn');
                if (title) title.textContent = 'Enter Fullscreen Diagnostic Studio';
                if (lead) lead.textContent = 'DisplayDoctor Pro requires exclusive fullscreen mode for uncompressed pixel mapping, 0-nit blackouts, and calibrated motion tests.';
                if (sub) sub.style.display = 'none';
                if (btn) btn.textContent = 'Enter Studio (Fullscreen)';
                modal.style.display = 'flex';
            } else {
                modal.style.display = 'none';
            }
        }
    },

    acceptWarning() {
        const warningCheck = document.getElementById('enterFullscreenWarningCheck');
        const shouldFullscreen = !warningCheck || warningCheck.checked;
        if (shouldFullscreen) {
            const docEl = document.documentElement;
            const req = docEl.requestFullscreen || 
                        docEl.webkitRequestFullscreen || 
                        docEl.webkitRequestFullScreen || 
                        docEl.mozRequestFullScreen || 
                        docEl.msRequestFullscreen;
            if (req) {
                try {
                    const res = req.call(docEl);
                    if (res && typeof res.catch === 'function') res.catch(() => {});
                } catch (e) {}
            }
        }

        AudioEngine.init();
        AudioEngine.playClick();
        localStorage.setItem('dispdoc_warning_accepted', 'true');
        localStorage.setItem('dispdoc_autofullscreen', shouldFullscreen ? 'true' : 'false');
        const autoCheck = document.getElementById('autoFullscreenCheck');
        if (autoCheck) autoCheck.checked = shouldFullscreen;

        const modal = document.getElementById('warningModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.showToast('Diagnostics Ready // Fullscreen Active');
    },

    showToast(message, duration = 2200) {
        const toast = document.getElementById('mobileToast');
        if (!toast) return;
        toast.textContent = message;
        toast.style.display = 'block';
        clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => {
            toast.style.display = 'none';
        }, duration);
    },

    // Viewport & HiDPI Scaling
    resizeCanvas() {
        this.dpr = this.isHiDpi ? (window.devicePixelRatio || 1) : 1;
        this.width = Math.floor(window.innerWidth * this.dpr);
        this.height = Math.floor(window.innerHeight * this.dpr);

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;

        try {
            this.noiseData = this.ctx.createImageData(this.width, this.height);
            this.noiseBuf32 = new Uint32Array(this.noiseData.data.buffer);
        } catch (e) {
            console.warn('ImageData buffer alloc fallback:', e);
        }

        Telemetry.detectDisplaySpecs();

        if (this.currentMode) {
            this.start(this.currentMode, true);
        } else {
            this.renderStandby();
        }
    },

    toggleHiDpi() {
        this.isHiDpi = !this.isHiDpi;
        const label = document.getElementById('dprLabel');
        if (label) label.textContent = this.isHiDpi ? '1:1' : 'CSS';
        AudioEngine.playClick();
        this.resizeCanvas();
        this.showToast(this.isHiDpi ? 'Native HiDPI (1:1 Physical Pixels)' : 'Standard CSS Scaling');
    },

    // ======================================================================
    // TOUCH GESTURES & MOBILE INTERACTION
    // ======================================================================
    setupTouchGestures() {
        const touchOptions = { passive: true };

        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
                this.touchStartTime = performance.now();
            }
        }, touchOptions);

        this.canvas.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1) {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const deltaX = endX - this.touchStartX;
                const deltaY = endY - this.touchStartY;
                const deltaTime = performance.now() - this.touchStartTime;

                // 1. Horizontal swipe detection (> 50px)
                if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && deltaTime < 400) {
                    if (deltaX < 0) {
                        this.navigateTest(1); // Swipe Left -> Next
                    } else {
                        this.navigateTest(-1); // Swipe Right -> Prev
                    }
                    return;
                }

                // 2. Tap detection: if burnin test, cycle color, otherwise toggle runner controls
                if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15 && deltaTime < 300) {
                    if (this.currentMode === 'burnin') {
                        this.burnInIndex = (this.burnInIndex + 1) % this.burnInColors.length;
                        this.drawBurnIn();
                    } else if (this.isRunning) {
                        this.toggleControls();
                    }
                }
            }
        }, touchOptions);

        // Click detection for desktop
        this.canvas.addEventListener('click', () => {
            if (this.currentMode === 'burnin') {
                this.burnInIndex = (this.burnInIndex + 1) % this.burnInColors.length;
                this.drawBurnIn();
            } else if (this.isRunning) {
                this.toggleControls();
            }
        });

        // Touch grid digitizer check (Touch & Mouse support)
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.currentMode === 'touch-grid') {
                for (let i = 0; i < e.touches.length; i++) {
                    const t = e.touches[i];
                    const col = Math.floor((t.clientX * this.dpr) / (this.width / 6));
                    const row = Math.floor((t.clientY * this.dpr) / (this.height / 10));
                    this.touchGridHits.add(`${col},${row}`);
                }
                this.drawTouchGrid();
            }
        }, touchOptions);

        // Mouse support for Touch Grid (Desktop & Laptop trackpads)
        let isMouseDownOnGrid = false;
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.currentMode === 'touch-grid') {
                isMouseDownOnGrid = true;
                const col = Math.floor((e.clientX * this.dpr) / (this.width / 6));
                const row = Math.floor((e.clientY * this.dpr) / (this.height / 10));
                this.touchGridHits.add(`${col},${row}`);
                this.drawTouchGrid();
            }
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.currentMode === 'touch-grid' && isMouseDownOnGrid) {
                const col = Math.floor((e.clientX * this.dpr) / (this.width / 6));
                const row = Math.floor((e.clientY * this.dpr) / (this.height / 10));
                this.touchGridHits.add(`${col},${row}`);
                this.drawTouchGrid();
            }
        });
        window.addEventListener('mouseup', () => { isMouseDownOnGrid = false; });

        // Screen orientation listener
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resizeCanvas();
                const isLandscape = window.innerWidth > window.innerHeight;
                this.showToast(isLandscape ? 'Landscape: Immersive View Active' : 'Portrait Mode Active');
            }, 250);
        });
    },

    navigateTest(direction) {
        const currentIndex = this.testModesList.indexOf(this.currentMode);
        let nextIndex;
        if (currentIndex === -1) {
            nextIndex = 0;
        } else {
            nextIndex = (currentIndex + direction + this.testModesList.length) % this.testModesList.length;
        }
        const nextMode = this.testModesList[nextIndex];
        AudioEngine.playClick();
        this.start(nextMode);
        this.showToast(`Switched: ${this.testNames[nextMode] || nextMode.toUpperCase()}`);
    },

    // ======================================================================
    // EVENT LISTENERS & CONTROLS
    // ======================================================================
    setupEventListeners() {
        // 1. Warning Modal Controls
        const acceptBtn = document.getElementById('acceptWarningBtn');
        if (acceptBtn) acceptBtn.addEventListener('click', () => this.acceptWarning());

        const warningCheck = document.getElementById('enterFullscreenWarningCheck');
        if (warningCheck) {
            const saved = localStorage.getItem('dispdoc_autofullscreen');
            if (saved !== null) {
                warningCheck.checked = saved === 'true';
            }
            warningCheck.addEventListener('change', () => {
                localStorage.setItem('dispdoc_autofullscreen', warningCheck.checked ? 'true' : 'false');
                const autoCheck = document.getElementById('autoFullscreenCheck');
                if (autoCheck) autoCheck.checked = warningCheck.checked;
            });
        }

        // 2. Dashboard Header & Hero Tools
        const runAllHeader = document.getElementById('btnRunAllTestsHeader');
        if (runAllHeader) runAllHeader.addEventListener('click', () => this.startTestAll());

        const runAllHero = document.getElementById('btnRunAllTestsHero');
        if (runAllHero) runAllHero.addEventListener('click', () => this.startTestAll());

        const wizardHero = document.getElementById('btnWizardHero');
        if (wizardHero) wizardHero.addEventListener('click', () => this.startWizard());

        const themeBtn = document.getElementById('btnToggleTheme');
        if (themeBtn) themeBtn.addEventListener('click', () => ThemeEngine.toggle());

        const muteBtn = document.getElementById('btnToggleMute');
        if (muteBtn) muteBtn.addEventListener('click', () => AudioEngine.toggleMute());

        const dprBtn = document.getElementById('btnToggleDpr');
        if (dprBtn) dprBtn.addEventListener('click', () => this.toggleHiDpi());

        const statsBtn = document.getElementById('btnToggleStats');
        if (statsBtn) statsBtn.addEventListener('click', () => this.toggleStats());

        const closeStatsBtn = document.getElementById('closeStatsBtn');
        if (closeStatsBtn) closeStatsBtn.addEventListener('click', () => this.toggleStats(false));

        const fsBtn = document.getElementById('btnToggleFullscreen');
        if (fsBtn) fsBtn.addEventListener('click', () => this.toggleFullscreen());

        // 3. Category Filter Tabs
        document.querySelectorAll('#categoryNav .nav-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('#categoryNav .nav-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.getAttribute('data-filter');
                this.filterCategories(filter);
                AudioEngine.playClick();
            });
        });

        // 4. Auto-Fullscreen Checkbox in Specs Banner
        const autoCheck = document.getElementById('autoFullscreenCheck');
        if (autoCheck) {
            const saved = localStorage.getItem('dispdoc_autofullscreen');
            if (saved !== null) {
                autoCheck.checked = saved === 'true';
            } else {
                autoCheck.checked = true;
            }
            autoCheck.addEventListener('click', () => {
                localStorage.setItem('dispdoc_autofullscreen', autoCheck.checked);
                if (autoCheck.checked) {
                    this.requestFullscreen();
                }
                AudioEngine.playClick();
            });
            autoCheck.addEventListener('change', () => {
                localStorage.setItem('dispdoc_autofullscreen', autoCheck.checked);
            });
        }

        // 5. Test Card Clicks (Launch Test with Synchronous Fullscreen Trigger)
        document.querySelectorAll('.test-card').forEach(card => {
            card.addEventListener('mouseenter', () => AudioEngine.playHover());
            card.addEventListener('click', () => {
                const autoCheck = document.getElementById('autoFullscreenCheck');
                if (!autoCheck || autoCheck.checked) {
                    this.requestFullscreen();
                }
                const mode = card.getAttribute('data-mode');
                if (mode) {
                    AudioEngine.playClick();
                    this.start(mode);
                }
            });
        });

        // 6. Test Runner Dock Buttons
        const exitBtn = document.getElementById('btnExitTest');
        if (exitBtn) exitBtn.addEventListener('click', () => this.stop());

        const prevBtn = document.getElementById('btnPrevTest');
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateTest(-1));

        const nextBtn = document.getElementById('btnNextTest');
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateTest(1));

        const pauseBtn = document.getElementById('btnPauseTest');
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.togglePause());

        const hideHudBtn = document.getElementById('btnHideHud');
        if (hideHudBtn) hideHudBtn.addEventListener('click', () => this.hideControls());

        // 7. Interactive Runner Segment Groups
        document.querySelectorAll('#nearBlackControls .seg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('#nearBlackControls .seg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.ireLevel = parseInt(btn.getAttribute('data-ire'), 10);
                AudioEngine.playClick();
                this.drawNearBlack();
            });
        });

        document.querySelectorAll('#motionControls .seg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('#motionControls .seg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.motionSpeed = parseInt(btn.getAttribute('data-speed'), 10);
                AudioEngine.playClick();
            });
        });

        document.querySelectorAll('#ablControls .seg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('#ablControls .seg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.aplLevel = parseInt(btn.getAttribute('data-apl'), 10);
                AudioEngine.playClick();
                this.drawAblWindow();
            });
        });

        document.querySelectorAll('#subpixelControls .seg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('#subpixelControls .seg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.subpixelType = btn.getAttribute('data-sub');
                AudioEngine.playClick();
                this.drawSubpixel();
            });
        });

        document.querySelectorAll('#phoneControls .seg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('#phoneControls .seg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.phoneOverlay = btn.getAttribute('data-phone-overlay');
                AudioEngine.playClick();
                this.drawPhoneBurnIn();
            });
        });

        document.querySelectorAll('#reviverControls .seg-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('#reviverControls .seg-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (btn.getAttribute('data-reviver-mode') === 'fullscreen') {
                    this.reviverFullscreen = true;
                    document.getElementById('pixelReviver').style.display = 'none';
                } else {
                    this.reviverFullscreen = false;
                    this.reviverSize = parseInt(btn.getAttribute('data-reviver-size'), 10);
                    const rev = document.getElementById('pixelReviver');
                    rev.style.display = 'flex';
                    rev.style.width = `${this.reviverSize}px`;
                    rev.style.height = `${this.reviverSize}px`;
                }
                AudioEngine.playClick();
            });
        });

        // 8. Guided Wizard & Report
        document.getElementById('btnWizard').addEventListener('click', () => this.startWizard());
        document.getElementById('btnOpenReport').addEventListener('click', () => this.showReport());
        document.getElementById('btnCloseReport').addEventListener('click', () => this.hideReport());
        document.getElementById('btnPrintReport').addEventListener('click', () => window.print());
        document.getElementById('btnExportJson').addEventListener('click', () => this.exportJsonReport());

        document.getElementById('wizNoIssuesBtn').addEventListener('click', () => this.handleWizardAnswer(true));
        document.getElementById('wizHasIssueBtn').addEventListener('click', () => this.handleWizardAnswer(false));
        document.getElementById('wizSkipBtn').addEventListener('click', () => this.handleWizardSkip());
        document.getElementById('wizExitBtn').addEventListener('click', () => this.exitWizard());

        // 9. Window Resize & DblClick Fullscreen
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => this.resizeCanvas(), 100);
        });

        this.canvas.addEventListener('dblclick', () => this.toggleFullscreen());

        // 10. User Activity & Keydown
        window.addEventListener('mousemove', () => this.handleUserActivity());
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // 11. Tab Visibility Change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning) {
                this.isPaused = true;
            } else if (!document.hidden && this.isRunning && this.isPaused) {
                this.isPaused = false;
            }
        });
    },

    filterCategories(filter) {
        document.querySelectorAll('.category-block').forEach(cat => {
            if (filter === 'all' || cat.getAttribute('data-cat') === filter) {
                cat.style.display = 'block';
            } else {
                cat.style.display = 'none';
            }
        });
    },

    handleUserActivity() {
        document.body.style.cursor = 'default';
        const runnerBar = document.getElementById('testRunnerBar');

        if (this.isRunning) {
            if (runnerBar && runnerBar.classList.contains('runner-hidden')) {
                runnerBar.classList.remove('runner-hidden');
            }

            clearTimeout(this.idleTimer);
            this.idleTimer = setTimeout(() => {
                if (this.isRunning) {
                    if (runnerBar) runnerBar.classList.add('runner-hidden');
                    document.body.style.cursor = 'none';
                }
            }, 2400);
        }
    },

    hideControls() {
        const runnerBar = document.getElementById('testRunnerBar');
        if (runnerBar) runnerBar.classList.add('runner-hidden');
        document.body.style.cursor = 'none';
        AudioEngine.playClick();
    },

    showControls() {
        const runnerBar = document.getElementById('testRunnerBar');
        if (runnerBar) runnerBar.classList.remove('runner-hidden');
        document.body.style.cursor = 'default';
        AudioEngine.playClick();
        this.handleUserActivity();
    },

    toggleControls() {
        const runnerBar = document.getElementById('testRunnerBar');
        if (runnerBar && runnerBar.classList.contains('runner-hidden')) {
            this.showControls();
        } else {
            this.hideControls();
        }
    },

    // Draggable Runner HUD (Mouse & Touch)
    setupDraggableHud() {
        const bar = document.getElementById('testRunnerBar');
        const handle = document.getElementById('runnerDragHandle');
        if (!bar || !handle) return;

        let isDragging = false;
        let startX = 0, startY = 0;
        let initialLeft = 0, initialTop = 0;

        const onStart = (clientX, clientY) => {
            isDragging = true;
            startX = clientX;
            startY = clientY;
            const rect = bar.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            bar.style.bottom = 'auto';
            bar.style.right = 'auto';
            bar.style.transform = 'none';
            bar.style.left = `${initialLeft}px`;
            bar.style.top = `${initialTop}px`;
            bar.classList.add('is-dragging');
        };

        const onMove = (clientX, clientY) => {
            if (!isDragging) return;
            const dx = clientX - startX;
            const dy = clientY - startY;
            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            const maxLeft = window.innerWidth - bar.offsetWidth - 8;
            const maxTop = window.innerHeight - bar.offsetHeight - 8;
            newLeft = Math.max(8, Math.min(newLeft, maxLeft));
            newTop = Math.max(8, Math.min(newTop, maxTop));

            bar.style.left = `${newLeft}px`;
            bar.style.top = `${newTop}px`;
        };

        const onEnd = () => {
            if (isDragging) {
                isDragging = false;
                bar.classList.remove('is-dragging');
                this.handleUserActivity();
            }
        };

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onStart(e.clientX, e.clientY);
        });

        handle.addEventListener('dblclick', (e) => {
            e.preventDefault();
            e.stopPropagation();
            bar.style.left = '50%';
            bar.style.top = 'auto';
            bar.style.bottom = 'max(20px, env(safe-area-inset-bottom) + 8px)';
            bar.style.transform = 'translateX(-50%)';
            AudioEngine.playClick();
            this.showToast('HUD Position Reset');
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) onMove(e.clientX, e.clientY);
        });
        window.addEventListener('mouseup', onEnd);

        handle.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                onStart(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length === 1) {
                onMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('touchend', onEnd);
    },

    handleKeyDown(e) {
        const warning = document.getElementById('warningModal');
        const report = document.getElementById('reportModal');
        if ((warning && warning.style.display !== 'none') || 
            (report && report.style.display !== 'none')) {
            if (e.key === 'Escape') {
                this.hideReport();
            }
            return;
        }

        const key = e.key.toLowerCase();
        switch (key) {
            case 'escape':
                e.preventDefault();
                if (this.wizardActive) {
                    this.exitWizard();
                } else {
                    this.stop();
                }
                break;
            case ' ':
                e.preventDefault();
                if (this.isRunning) this.togglePause();
                break;
            case 'arrowleft':
                e.preventDefault();
                if (this.isRunning) this.navigateTest(-1);
                break;
            case 'arrowright':
                e.preventDefault();
                if (this.isRunning) this.navigateTest(1);
                break;
            case 'f':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'h':
                e.preventDefault();
                this.toggleControls();
                break;
            case 's':
                e.preventDefault();
                this.toggleStats();
                break;
            case 'm':
                e.preventDefault();
                AudioEngine.toggleMute();
                break;
            case '1': this.start('oled-black'); break;
            case '2': this.start('near-black'); break;
            case '3': this.start('burnin'); break;
            case '4': this.start('pixel-reviver'); break;
            case '5': this.start('subpixel'); break;
            case '6': this.start('abl'); break;
            case '7': this.start('ufo-motion'); break;
            case '8': this.start('backlight-bleed'); break;
            case '9': this.start('viewing-angle'); break;
            case '0': this.start('sharpness'); break;
        }
    },

    toggleStats(forceState) {
        this.isStatsVisible = forceState !== undefined ? forceState : !this.isStatsVisible;
        const panel = document.getElementById('statsPanel');
        if (panel) {
            panel.style.display = this.isStatsVisible ? 'block' : 'none';
        }
        AudioEngine.playClick();
    },

    // Fullscreen Listeners & Resilient Request
    setupFullscreenListeners() {
        const onFsChange = () => {
            const isFs = !!(document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement);
            this.updateFullscreenUi(isFs);
            this.resizeCanvas();
        };

        document.addEventListener('fullscreenchange', onFsChange);
        document.addEventListener('webkitfullscreenchange', onFsChange);
        document.addEventListener('mozfullscreenchange', onFsChange);
        document.addEventListener('MSFullscreenChange', onFsChange);
    },

    updateFullscreenUi(isFs) {
        const fsBtn = document.getElementById('btnToggleFullscreen');
        if (fsBtn) {
            fsBtn.classList.toggle('active', isFs);
            fsBtn.title = isFs ? 'Exit Fullscreen (F)' : 'Toggle Fullscreen (F)';
        }
    },

    requestFullscreen() {
        try {
            if (document.fullscreenEnabled === false || document.webkitFullscreenEnabled === false) {
                return;
            }

            const isFs = document.fullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement || 
                         document.msFullscreenElement;
            if (isFs) return;

            const docEl = document.documentElement;
            const req = docEl.requestFullscreen || 
                        docEl.webkitRequestFullscreen || 
                        docEl.webkitRequestFullScreen || 
                        docEl.mozRequestFullScreen || 
                        docEl.msRequestFullscreen;

            if (req) {
                const res = req.call(docEl);
                if (res && typeof res.then === 'function') {
                    res.then(() => {
                        this.updateFullscreenUi(true);
                    }).catch(err => {
                        if (err && err.name !== 'TypeError' && err.name !== 'NotAllowedError') {
                            console.warn('Fullscreen request rejected by browser:', err);
                        }
                    });
                }
            }
        } catch (e) {
            // Non-blocking
        }
    },

    exitFullscreen() {
        try {
            const isFs = document.fullscreenElement || 
                         document.webkitFullscreenElement || 
                         document.mozFullScreenElement || 
                         document.msFullscreenElement;
            if (!isFs) return;

            const exit = document.exitFullscreen || 
                         document.webkitExitFullscreen || 
                         document.mozCancelFullScreen || 
                         document.msExitFullscreen;
            if (exit) {
                const res = exit.call(document);
                if (res && typeof res.catch === 'function') {
                    res.catch(() => {});
                }
            }
        } catch (e) {
            console.warn('Exit fullscreen error:', e);
        }
    },

    toggleFullscreen() {
        const isFs = document.fullscreenElement || 
                     document.webkitFullscreenElement || 
                     document.mozFullScreenElement || 
                     document.msFullscreenElement;
        if (!isFs) {
            this.requestFullscreen();
        } else {
            this.exitFullscreen();
        }
        AudioEngine.playClick();
    },

    // =========================================================================
    // Test All Automated Suite
    // =========================================================================
    startTestAll() {
        // Synchronously invoke fullscreen during user gesture!
        this.requestFullscreen();

        this.isTestAllActive = true;
        this.testAllIndex = 0;
        AudioEngine.playClick();
        this.showToast('⚡ Starting Full Test All Suite (24 Tests)', 2600);

        this.runTestAllStep();
    },

    runTestAllStep() {
        if (!this.isTestAllActive) return;

        if (this.testAllIndex >= this.testModesList.length) {
            this.finishTestAll();
            return;
        }

        const mode = this.testModesList[this.testAllIndex];
        this.start(mode);

        // Update Test All Badge in HUD
        const badge = document.getElementById('testAllBadge');
        const stepText = document.getElementById('testAllStepText');
        if (badge) badge.style.display = 'flex';
        if (stepText) stepText.textContent = `${this.testAllIndex + 1}/${this.testModesList.length}`;

        this.resetTestAllCountdown();
    },

    resetTestAllCountdown() {
        clearTimeout(this.testAllTimer);
        clearInterval(this.testAllCountdownInterval);

        if (this.isPaused) return;

        this.testAllRemainingSec = 4;
        this.updateCountdownText();

        this.testAllCountdownInterval = setInterval(() => {
            if (!this.isPaused && this.isTestAllActive) {
                this.testAllRemainingSec--;
                this.updateCountdownText();
                if (this.testAllRemainingSec <= 0) {
                    clearInterval(this.testAllCountdownInterval);
                }
            }
        }, 1000);

        this.testAllTimer = setTimeout(() => {
            if (this.isTestAllActive && !this.isPaused) {
                this.testAllIndex++;
                this.runTestAllStep();
            }
        }, this.testAllDuration);
    },

    resumeTestAllCountdown() {
        clearTimeout(this.testAllTimer);
        clearInterval(this.testAllCountdownInterval);
        this.updateCountdownText();

        const remainingMs = Math.max(1000, this.testAllRemainingSec * 1000);

        this.testAllCountdownInterval = setInterval(() => {
            if (!this.isPaused && this.isTestAllActive) {
                this.testAllRemainingSec--;
                this.updateCountdownText();
                if (this.testAllRemainingSec <= 0) {
                    clearInterval(this.testAllCountdownInterval);
                }
            }
        }, 1000);

        this.testAllTimer = setTimeout(() => {
            if (this.isTestAllActive && !this.isPaused) {
                this.testAllIndex++;
                this.runTestAllStep();
            }
        }, remainingMs);
    },

    updateCountdownText() {
        const countdownEl = document.getElementById('testAllCountdown');
        if (countdownEl) {
            countdownEl.textContent = this.isPaused ? 'PAUSED' : `${this.testAllRemainingSec}s`;
        }
    },

    stopTestAll() {
        this.isTestAllActive = false;
        clearTimeout(this.testAllTimer);
        clearInterval(this.testAllCountdownInterval);
        const badge = document.getElementById('testAllBadge');
        if (badge) badge.style.display = 'none';
    },

    finishTestAll() {
        this.stopTestAll();
        this.stop();
        AudioEngine.playSuccess();
        this.showToast('✓ All 24 Display Tests Completed!', 3800);
        setTimeout(() => {
            this.openReport();
        }, 600);
    },

    navigateTest(direction) {
        AudioEngine.playClick();
        if (this.isTestAllActive) {
            this.testAllIndex = Math.max(0, Math.min(this.testModesList.length - 1, this.testAllIndex + direction));
            this.runTestAllStep();
            return;
        }

        if (!this.currentMode) {
            this.start(this.testModesList[0]);
            return;
        }

        const currentIndex = this.testModesList.indexOf(this.currentMode);
        let nextIndex = currentIndex !== -1 ? currentIndex + direction : 0;
        if (nextIndex < 0) nextIndex = this.testModesList.length - 1;
        if (nextIndex >= this.testModesList.length) nextIndex = 0;

        const nextMode = this.testModesList[nextIndex];
        this.start(nextMode);
    },

    togglePause() {
        this.isPaused = !this.isPaused;
        const icon = document.getElementById('pauseIcon');
        if (icon) {
            icon.innerHTML = this.isPaused
                ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
                : `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
        }
        AudioEngine.playTone(this.isPaused ? 300 : 600, 0.08, 'sine');
        this.showToast(this.isPaused ? 'Test Paused (Space)' : 'Test Resumed');

        if (this.isTestAllActive) {
            if (this.isPaused) {
                clearTimeout(this.testAllTimer);
                clearInterval(this.testAllCountdownInterval);
                this.updateCountdownText();
            } else {
                this.resumeTestAllCountdown();
            }
        }
    },

    // Mouse & Touch Drag on Reviver Box
    setupReviverDrag() {
        const box = document.getElementById('pixelReviver');
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        const startDrag = (clientX, clientY) => {
            isDragging = true;
            offsetX = clientX - box.getBoundingClientRect().left;
            offsetY = clientY - box.getBoundingClientRect().top;
        };

        const moveDrag = (clientX, clientY) => {
            if (!isDragging) return;
            box.style.left = `${clientX - offsetX + box.offsetWidth / 2}px`;
            box.style.top = `${clientY - offsetY + box.offsetHeight / 2}px`;
            box.style.transform = 'translate(-50%, -50%)';
        };

        const endDrag = () => { isDragging = false; };

        // Mouse events
        box.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
        window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
        window.addEventListener('mouseup', endDrag);

        // Touch events
        box.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        window.addEventListener('touchend', endDrag);
    },

    // ======================================================================
    // ENGINE LIFECYCLE (START, STOP, LOOP)
    // ======================================================================
    start(mode, isInternalRedraw = false) {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.safetyTimeout) {
            clearTimeout(this.safetyTimeout);
            this.safetyTimeout = null;
        }
        if (this.autoCycleTimeout && mode !== 'autocycle') {
            clearTimeout(this.autoCycleTimeout);
            this.autoCycleTimeout = null;
        }

        this.isRunning = true;
        this.isPaused = false;
        this.currentMode = mode;
        Telemetry.reset();

        // 1. Clean canvas reset to solid black (eliminates all transition glitches)
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.restore();

        // 2. Clear 32-bit noise buffer
        if (this.noiseBuf32) {
            this.noiseBuf32.fill(0xFF000000);
        }

        // 3. Reset test-specific states
        this.particles = [];
        this.drops = [];
        this.touchGridHits.clear();
        this.strobeState = false;

        // 4. Hide Pixel Reviver box UNLESS active mode is pixel-reviver
        const reviverEl = document.getElementById('pixelReviver');
        if (reviverEl) {
            if (mode === 'pixel-reviver' && !this.reviverFullscreen) {
                reviverEl.style.display = 'flex';
            } else {
                reviverEl.style.display = 'none';
            }
        }

        // 5. Switch View Modes: Hide Dashboard Hub, Show Test Runner Bar
        const dashboard = document.getElementById('dashboardView');
        if (dashboard) dashboard.style.display = 'none';

        const runnerBar = document.getElementById('testRunnerBar');
        if (runnerBar) {
            runnerBar.style.display = 'flex';
            runnerBar.classList.remove('runner-hidden');
        }

        // Auto-Fullscreen if option is enabled
        const autoCheck = document.getElementById('autoFullscreenCheck');
        if (!autoCheck || autoCheck.checked) {
            this.requestFullscreen();
        }

        // Hide Test All badge if manual test launched
        const testAllBadge = document.getElementById('testAllBadge');
        if (testAllBadge && !this.isTestAllActive) {
            testAllBadge.style.display = 'none';
        }

        // Update Runner Test Name
        const nameEl = document.getElementById('runnerTestName');
        if (nameEl) {
            nameEl.textContent = this.testNames[mode] || mode.toUpperCase();
        }

        const specMode = document.getElementById('specMode');
        if (specMode) specMode.textContent = mode.toUpperCase();

        const pauseIcon = document.getElementById('pauseIcon');
        if (pauseIcon) {
            pauseIcon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
        }

        const safetyBadge = document.getElementById('safetyBadge');
        if (safetyBadge) safetyBadge.style.display = 'none';

        this.updateInteractiveToolbars(mode);

        if (mode === 'strobe' || mode === 'color-flash') {
            this.startSafetyTimer(15);
        }

        this.handleUserActivity();

        switch (mode) {
            // OLED Specialists
            case 'oled-black': this.drawOledBlack(); break;
            case 'near-black': this.drawNearBlack(); break;
            case 'burnin': this.drawBurnIn(); break;
            case 'pixel-reviver': this.startPixelReviver(); break;
            case 'subpixel': this.drawSubpixel(); break;
            case 'abl': this.drawAblWindow(); break;

            // Phone Specialists
            case 'phone-burnin': this.drawPhoneBurnIn(); break;
            case 'pwm-flicker': this.loop(this.drawPwmFlicker); break;
            case 'touch-grid': this.drawTouchGrid(); break;

            // IPS Specialists
            case 'ufo-motion': this.loop(this.drawUfoMotion); break;
            case 'backlight-bleed': this.drawBacklightBleed(); break;
            case 'viewing-angle': this.drawViewingAngle(); break;
            case 'sharpness': this.drawSharpness(); break;

            // Calibration Specialists
            case 'grayscale': this.drawGrayscale(); break;
            case 'gamma': this.drawGammaRamp(); break;
            case 'black-clipping': this.drawBlackClipping(); break;
            case 'white-clipping': this.drawWhiteClipping(); break;
            case 'color-banding': this.drawColorBanding(); break;

            // Visual Stress Engine
            case 'tv-static': this.loop(this.drawTvStatic); break;
            case 'rgb-noise': this.loop(this.drawRgbNoise); break;
            case 'particles': this.initParticles(); this.loop(this.drawParticles); break;
            case 'matrix-rain': this.initMatrixRain(); this.loop(this.drawMatrixRain); break;
            case 'gradient-storm': this.loop(this.drawGradientStorm); break;
            case 'rainbow': this.loop(this.drawRainbow); break;
            case 'strobe': this.loop(this.drawStrobe); break;
            case 'color-flash': this.loop(this.drawColorFlash); break;
            case 'autocycle': this.runAutoCycle(); break;

            default: this.renderStandby(); break;
        }
    },

    stop() {
        if (this.isTestAllActive) {
            this.stopTestAll();
        }

        this.isRunning = false;
        this.isPaused = false;
        this.currentMode = null;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.safetyTimeout) {
            clearTimeout(this.safetyTimeout);
            this.safetyTimeout = null;
        }
        if (this.autoCycleTimeout) {
            clearTimeout(this.autoCycleTimeout);
            this.autoCycleTimeout = null;
        }
        clearTimeout(this.idleTimer);

        document.getElementById('pixelReviver').style.display = 'none';
        
        // Restore Dashboard View
        const dashboard = document.getElementById('dashboardView');
        if (dashboard) dashboard.style.display = 'flex';

        const runnerBar = document.getElementById('testRunnerBar');
        if (runnerBar) {
            runnerBar.style.display = 'none';
            runnerBar.classList.remove('runner-hidden');
        }

        const safetyBadge = document.getElementById('safetyBadge');
        if (safetyBadge) safetyBadge.style.display = 'none';

        const specMode = document.getElementById('specMode');
        if (specMode) specMode.textContent = 'STANDBY';

        document.body.style.cursor = 'default';

        AudioEngine.playClick();
        this.renderStandby();
    },

    startSafetyTimer(seconds) {
        this.safetySeconds = seconds;
        const badge = document.getElementById('safetyBadge');
        const text = document.getElementById('safetyTimerText');
        if (badge) badge.style.display = 'flex';

        const tick = () => {
            if (!this.isRunning || this.safetySeconds <= 0) {
                if (badge) badge.style.display = 'none';
                if (this.safetySeconds <= 0) this.stop();
                return;
            }
            if (text) text.textContent = `Auto-stop: ${this.safetySeconds}s`;
            this.safetySeconds--;
            this.safetyTimeout = setTimeout(tick, 1000);
        };
        tick();
    },

    updateInteractiveToolbars(mode) {
        const nearBlack = document.getElementById('nearBlackControls');
        const motion = document.getElementById('motionControls');
        const abl = document.getElementById('ablControls');
        const sub = document.getElementById('subpixelControls');
        const rev = document.getElementById('reviverControls');
        const phone = document.getElementById('phoneControls');

        if (nearBlack) nearBlack.style.display = 'none';
        if (motion) motion.style.display = 'none';
        if (abl) abl.style.display = 'none';
        if (sub) sub.style.display = 'none';
        if (rev) rev.style.display = 'none';
        if (phone) phone.style.display = 'none';

        if (mode === 'near-black' && nearBlack) nearBlack.style.display = 'flex';
        else if (mode === 'ufo-motion' && motion) motion.style.display = 'flex';
        else if (mode === 'abl' && abl) abl.style.display = 'flex';
        else if (mode === 'subpixel' && sub) sub.style.display = 'flex';
        else if (mode === 'pixel-reviver' && rev) rev.style.display = 'flex';
        else if (mode === 'phone-burnin' && phone) phone.style.display = 'flex';
    },

    loop(drawFn) {
        const render = (now) => {
            if (!this.isRunning) return;
            if (!this.isPaused) {
                drawFn.call(this, now);
                Telemetry.update(now);
            }
            this.animationId = requestAnimationFrame(render);
        };
        this.animationId = requestAnimationFrame(render);
    },

    // ======================================================================
    // STANDBY & OLED TEST PATTERNS
    // ======================================================================
    renderStandby() {
        this.ctx.fillStyle = '#07070b';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        const step = 40 * this.dpr;
        for (let x = 0; x < this.width; x += step) {
            this.ctx.fillRect(x, 0, 1, this.height);
        }
        for (let y = 0; y < this.height; y += step) {
            this.ctx.fillRect(0, y, this.width, 1);
        }

        this.ctx.fillStyle = '#00f3ff';
        this.ctx.font = `700 ${18 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DISPLAYDOCTOR PRO // READY', this.width / 2, this.height / 2 - 15 * this.dpr);

        this.ctx.fillStyle = '#8c9cb6';
        this.ctx.font = `500 ${12 * this.dpr}px "Inter"`;
        this.ctx.fillText('Tap a test below or swipe horizontally to navigate suite', this.width / 2, this.height / 2 + 15 * this.dpr);
    },

    // 1. OLED 0-nit True Black
    drawOledBlack() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    // 2. Near-Black Banding (1% to 20% IRE)
    drawNearBlack() {
        const val = Math.round((this.ireLevel / 100) * 255);
        this.ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = this.ireLevel <= 3 ? '#555555' : '#000000';
        this.ctx.font = `${12 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`NEAR-BLACK UNIFORMITY // ${this.ireLevel}% IRE (RGB: ${val}, ${val}, ${val})`, this.width / 2, 40 * this.dpr);
    },

    // 3. Burn-in Primary & Secondary Screen Checker
    burnInColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#FFFF00', '#00FFFF', '#FF00FF', '#808080'],
    burnInIndex: 0,
    drawBurnIn() {
        const color = this.burnInColors[this.burnInIndex];
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = this.burnInIndex === 3 ? '#000000' : '#FFFFFF';
        this.ctx.font = `${12 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`BURN-IN FIELD // COLOR ${this.burnInIndex + 1} OF ${this.burnInColors.length} // TAP TO CYCLE`, this.width / 2, 40 * this.dpr);

        const clickHandler = () => {
            if (this.currentMode !== 'burnin') {
                this.canvas.removeEventListener('click', clickHandler);
                return;
            }
            this.burnInIndex = (this.burnInIndex + 1) % this.burnInColors.length;
            AudioEngine.playClick();
            this.drawBurnIn();
        };

        this.canvas.removeEventListener('click', this._lastBurnInClick);
        this._lastBurnInClick = clickHandler;
        this.canvas.addEventListener('click', clickHandler);
    },

    // 4. Stuck Pixel Reviver
    reviverFrame: 0,
    startPixelReviver() {
        const reviver = document.getElementById('pixelReviver');
        if (!this.reviverFullscreen) {
            reviver.style.display = 'flex';
            reviver.style.width = `${this.reviverSize}px`;
            reviver.style.height = `${this.reviverSize}px`;
        }

        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000'];
        const reviverLoop = () => {
            if (this.currentMode !== 'pixel-reviver') return;
            this.reviverFrame++;
            const c = colors[this.reviverFrame % colors.length];

            if (this.reviverFullscreen) {
                this.ctx.fillStyle = c;
                this.ctx.fillRect(0, 0, this.width, this.height);
            } else {
                reviver.style.backgroundColor = c;
            }
            this.animationId = requestAnimationFrame(reviverLoop);
        };
        this.animationId = requestAnimationFrame(reviverLoop);
    },

    // 5. Subpixel & Text Fringing Test
    drawSubpixel() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.subpixelType === 'text') {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.width / 2, this.height);

            // Left: White on Black
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = `600 ${14 * this.dpr}px "Inter"`;
            this.ctx.textAlign = 'left';
            this.ctx.fillText('WHITE ON BLACK (QD-OLED / WOLED Fringing Check):', 25 * this.dpr, 60 * this.dpr);
            this.ctx.font = `400 ${12 * this.dpr}px "Inter"`;
            for (let i = 0; i < 8; i++) {
                this.ctx.fillText('The quick brown fox jumps over the lazy dog. 1234567890 (AaBbCcDd)', 25 * this.dpr, (90 + i * 22) * this.dpr);
            }

            // Right: Black on White
            this.ctx.fillStyle = '#000000';
            this.ctx.font = `600 ${14 * this.dpr}px "Inter"`;
            this.ctx.fillText('BLACK ON WHITE (ClearType / Font Edge Check):', this.width / 2 + 25 * this.dpr, 60 * this.dpr);
            this.ctx.font = `400 ${12 * this.dpr}px "Inter"`;
            for (let i = 0; i < 8; i++) {
                this.ctx.fillText('The quick brown fox jumps over the lazy dog. 1234567890 (AaBbCcDd)', this.width / 2 + 25 * this.dpr, (90 + i * 22) * this.dpr);
            }
        } else if (this.subpixelType === 'stripes' || this.subpixelType === 'bgr') {
            const colors = this.subpixelType === 'stripes' ? ['#FF0000', '#00FF00', '#0000FF'] : ['#0000FF', '#00FF00', '#FF0000'];
            for (let x = 0; x < this.width; x++) {
                this.ctx.fillStyle = colors[x % 3];
                this.ctx.fillRect(x, 0, 1, this.height);
            }
        } else if (this.subpixelType === 'grid') {
            const img = this.ctx.createImageData(this.width, this.height);
            const d = new Uint32Array(img.data.buffer);
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    d[y * this.width + x] = ((x + y) % 2 === 0) ? 0xFFFFFFFF : 0xFF000000;
                }
            }
            this.ctx.putImageData(img, 0, 0);
        }
    },

    // 6. ABL (Auto Brightness Limiter) Window Test
    drawAblWindow() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const fraction = Math.sqrt(this.aplLevel / 100);
        const winW = Math.round(this.width * fraction);
        const winH = Math.round(this.height * fraction);
        const winX = Math.round((this.width - winW) / 2);
        const winY = Math.round((this.height - winH) / 2);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(winX, winY, winW, winH);

        this.ctx.fillStyle = '#00f3ff';
        this.ctx.font = `${12 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`OLED ABL TEST // ${this.aplLevel}% APL WINDOW`, this.width / 2, 40 * this.dpr);
    },

    // ======================================================================
    // PHONE & TABLET SPECIALIST PATTERNS
    // ======================================================================

    // 7. Phone Status Bar & Notch Burn-In Inspector
    drawPhoneBurnIn() {
        // High-sensitivity 50% neutral gray field
        this.ctx.fillStyle = '#7a7a7a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        this.ctx.lineWidth = 2 * this.dpr;

        if (this.phoneOverlay === 'notch') {
            // Simulated Island / Pill Notch
            const pillW = 120 * this.dpr;
            const pillH = 34 * this.dpr;
            const pillX = (this.width - pillW) / 2;
            const pillY = 18 * this.dpr;

            this.ctx.strokeRect(pillX, pillY, pillW, pillH);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.font = `${10 * this.dpr}px "JetBrains Mono"`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CAMERA NOTCH / ISLAND BOUNDARY', this.width / 2, pillY + pillH + 20 * this.dpr);
        } else if (this.phoneOverlay === 'statusbar') {
            // Top Status Bar boundary
            const barH = 50 * this.dpr;
            this.ctx.strokeRect(0, 0, this.width, barH);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.font = `${10 * this.dpr}px "JetBrains Mono"`;
            this.ctx.textAlign = 'left';
            this.ctx.fillText('9:41 ── STATUS ICONS ZONE ── [BATTERY]', 30 * this.dpr, 30 * this.dpr);
        } else if (this.phoneOverlay === 'homebar') {
            // Bottom Home indicator bar
            const barW = 140 * this.dpr;
            const barH = 6 * this.dpr;
            const barX = (this.width - barW) / 2;
            const barY = this.height - 30 * this.dpr;
            this.ctx.strokeRect(barX, barY, barW, barH);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.font = `${10 * this.dpr}px "JetBrains Mono"`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('HOME BAR ZONE', this.width / 2, barY - 14 * this.dpr);
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${13 * this.dpr}px "Inter"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('STATUS BAR & NOTCH BURN-IN CHECK', this.width / 2, this.height / 2);
        this.ctx.font = `${11 * this.dpr}px "Inter"`;
        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.fillText('Look closely inside the outlined zone for permanent ghostly clock/battery silhouettes.', this.width / 2, this.height / 2 + 25 * this.dpr);
    },

    // 8. PWM Eye Strain & Shutter Test
    pwmOffset: 0,
    drawPwmFlicker() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const stripeWidth = Math.max(2, Math.floor(4 * this.dpr));
        this.pwmOffset = (this.pwmOffset + this.intensity * 2) % (stripeWidth * 2);

        this.ctx.fillStyle = '#FFFFFF';
        for (let x = -stripeWidth * 2; x < this.width; x += stripeWidth * 2) {
            this.ctx.fillRect(x + this.pwmOffset, 0, stripeWidth, this.height);
        }

        this.ctx.fillStyle = '#00f3ff';
        this.ctx.font = `${12 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PWM FLICKER & SHUTTER TEST // VIEW THROUGH CAMERA OR FAST SWEEP', this.width / 2, 40 * this.dpr);
    },

    // 9. Interactive Touch & Digitizer Grid
    drawTouchGrid() {
        this.ctx.fillStyle = '#07070b';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cols = 6;
        const rows = 10;
        const colW = this.width / cols;
        const rowH = this.height / rows;

        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                const key = `${c},${r}`;
                const isHit = this.touchGridHits.has(key);

                this.ctx.fillStyle = isHit ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 255, 255, 0.04)';
                this.ctx.fillRect(c * colW, r * rowH, colW - 2, rowH - 2);

                this.ctx.strokeStyle = isHit ? '#00ff88' : 'rgba(255, 255, 255, 0.1)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(c * colW, r * rowH, colW - 2, rowH - 2);
            }
        }

        this.ctx.fillStyle = '#00f3ff';
        this.ctx.font = `${12 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`TOUCH DIGITIZER CHECK // DRAG FINGER OVER ALL BOXES (${this.touchGridHits.size}/${cols * rows})`, this.width / 2, 35 * this.dpr);
    },

    // ======================================================================
    // IPS & GAMING TEST PATTERNS
    // ======================================================================

    // 10. UFO Motion Pursuit & Ghosting Test
    ufoX: 0,
    drawUfoMotion(now) {
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const deltaSec = Telemetry.frameTime / 1000;
        this.ufoX = (this.ufoX + this.motionSpeed * deltaSec * this.dpr) % (this.width + 200 * this.dpr);

        const rows = [
            { y: this.height * 0.25, bg: '#1e293b', label: 'Overdrive Test (High Contrast)' },
            { y: this.height * 0.50, bg: '#334155', label: 'Mid-Gray GtG Response' },
            { y: this.height * 0.75, bg: '#020617', label: 'Dark Transition (Black Smear)' }
        ];

        rows.forEach(r => {
            this.ctx.fillStyle = r.bg;
            this.ctx.fillRect(0, r.y - 45 * this.dpr, this.width, 90 * this.dpr);

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            for (let x = 0; x < this.width; x += 100 * this.dpr) {
                this.ctx.fillRect(x, r.y - 45 * this.dpr, 1, 90 * this.dpr);
            }

            const posX = (this.ufoX - 100 * this.dpr);
            
            // UFO Dome
            this.ctx.fillStyle = '#00f3ff';
            this.ctx.beginPath();
            this.ctx.arc(posX, r.y - 8 * this.dpr, 18 * this.dpr, Math.PI, 0);
            this.ctx.fill();

            // UFO Body
            this.ctx.fillStyle = '#a855f7';
            this.ctx.beginPath();
            this.ctx.ellipse(posX, r.y, 45 * this.dpr, 12 * this.dpr, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // UFO Dots
            this.ctx.fillStyle = '#fbbf24';
            [-22, 0, 22].forEach(offset => {
                this.ctx.beginPath();
                this.ctx.arc(posX + offset * this.dpr, r.y, 3 * this.dpr, 0, Math.PI * 2);
                this.ctx.fill();
            });

            this.ctx.fillStyle = '#94a3b8';
            this.ctx.font = `${10 * this.dpr}px "JetBrains Mono"`;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${r.label} @ ${this.motionSpeed} px/s`, 20 * this.dpr, r.y - 25 * this.dpr);
        });

        this.ctx.fillStyle = '#00f3ff';
        this.ctx.font = `${13 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`MOTION PURSUIT & GHOSTING // ${this.motionSpeed} PX/S // TRACK WITH EYES`, this.width / 2, 35 * this.dpr);
    },

    // 11. Backlight Bleed & IPS Glow Inspector
    drawBacklightBleed() {
        this.ctx.fillStyle = '#050508';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.lineWidth = 1;

        const targets = [
            [60, 60],
            [this.width - 60, 60],
            [60, this.height - 60],
            [this.width - 60, this.height - 60]
        ];

        targets.forEach(([cx, cy]) => {
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 30 * this.dpr, 0, Math.PI * 2);
            this.ctx.moveTo(cx - 40 * this.dpr, cy);
            this.ctx.lineTo(cx + 40 * this.dpr, cy);
            this.ctx.moveTo(cx, cy - 40 * this.dpr);
            this.ctx.lineTo(cx, cy + 40 * this.dpr);
            this.ctx.stroke();
        });

        this.ctx.fillStyle = '#555555';
        this.ctx.font = `${12 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BACKLIGHT BLEED CHECK // LOOK AT CORNERS & EDGES IN A DARK ROOM', this.width / 2, this.height / 2);
        this.ctx.font = `${10 * this.dpr}px "Inter"`;
        this.ctx.fillText('IPS Glow shifts when changing viewing angle; Backlight Bleed remains fixed.', this.width / 2, this.height / 2 + 25 * this.dpr);
    },

    // 12. Viewing Angle & Color Shift
    drawViewingAngle() {
        const w2 = this.width / 2;
        const h2 = this.height / 2;

        const quads = [
            { x: 0, y: 0, color: '#e11d48', name: 'Warm Red' },
            { x: w2, y: 0, color: '#0284c7', name: 'Cyan Blue' },
            { x: 0, y: h2, color: '#16a34a', name: 'Emerald Green' },
            { x: w2, y: h2, color: '#ca8a04', name: 'Amber Yellow' }
        ];

        quads.forEach(q => {
            this.ctx.fillStyle = q.color;
            this.ctx.fillRect(q.x, q.y, w2, h2);
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.fillRect(q.x + 20 * this.dpr, q.y + 20 * this.dpr, 140 * this.dpr, 30 * this.dpr);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${11 * this.dpr}px "JetBrains Mono"`;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(q.name, q.x + 30 * this.dpr, q.y + 40 * this.dpr);
        });

        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(w2 - 80 * this.dpr, h2 - 25 * this.dpr, 160 * this.dpr, 50 * this.dpr);
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.font = `700 ${11 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('VIEW OFF-AXIS', w2, h2 + 4 * this.dpr);
    },

    // 13. 1:1 Pixel Sharpness Grid
    drawSharpness() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const drawTarget = (cx, cy) => {
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 30 * this.dpr, 0, Math.PI * 2);
            this.ctx.arc(cx, cy, 50 * this.dpr, 0, Math.PI * 2);
            this.ctx.moveTo(cx - 70 * this.dpr, cy);
            this.ctx.lineTo(cx + 70 * this.dpr, cy);
            this.ctx.moveTo(cx, cy - 70 * this.dpr);
            this.ctx.lineTo(cx, cy + 70 * this.dpr);
            this.ctx.stroke();
            this.ctx.strokeRect(cx - 40 * this.dpr, cy - 40 * this.dpr, 80 * this.dpr, 80 * this.dpr);
        };

        drawTarget(this.width / 2, this.height / 2);
        drawTarget(100 * this.dpr, 100 * this.dpr);
        drawTarget(this.width - 100 * this.dpr, 100 * this.dpr);
        drawTarget(100 * this.dpr, this.height - 100 * this.dpr);
        drawTarget(this.width - 100 * this.dpr, this.height - 100 * this.dpr);

        this.ctx.fillStyle = '#000000';
        this.ctx.font = `${14 * this.dpr}px "Inter"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SHARPNESS & 1:1 PIXEL SCALING CHECK', this.width / 2, this.height / 2 + 80 * this.dpr);
        this.ctx.font = `${11 * this.dpr}px "Inter"`;
        this.ctx.fillText('Circles must be clean without jagged moire or halo ghosting rings.', this.width / 2, this.height / 2 + 105 * this.dpr);
    },

    // ======================================================================
    // COLOR & CALIBRATION TEST PATTERNS
    // ======================================================================

    // 14. Grayscale 32 Steps
    drawGrayscale() {
        const steps = 32;
        const stepW = this.width / steps;

        for (let i = 0; i < steps; i++) {
            const val = Math.round((i / (steps - 1)) * 255);
            this.ctx.fillStyle = `rgb(${val}, ${val}, ${val})`;
            this.ctx.fillRect(i * stepW, 0, stepW + 1, this.height);

            if (i % 4 === 0 || i === steps - 1) {
                this.ctx.fillStyle = i < steps / 2 ? '#FFFFFF' : '#000000';
                this.ctx.font = `${10 * this.dpr}px "JetBrains Mono"`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${Math.round((i / (steps - 1)) * 100)}%`, i * stepW + stepW / 2, this.height - 25 * this.dpr);
            }
        }
    },

    // 15. Gamma 2.2 Ramp
    drawGammaRamp() {
        this.ctx.fillStyle = '#07070b';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const grad = this.ctx.createLinearGradient(0, 0, this.width, 0);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(1, '#FFFFFF');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, this.height * 0.3, this.width, this.height * 0.4);

        this.ctx.fillStyle = '#00f3ff';
        this.ctx.font = `${12 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAMMA 2.2 CONTINUOUS LUMINANCE RAMP', this.width / 2, this.height * 0.25);
    },

    // 16. Black-Level Shadow Clipping (Levels 0-25)
    drawBlackClipping() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cols = 6;
        const rows = 4;
        const pad = 16 * this.dpr;
        const cellW = (this.width - pad * (cols + 1)) / cols;
        const cellH = (this.height - 120 * this.dpr) / rows;

        for (let i = 0; i < 24; i++) {
            const level = i + 1;
            const c = i % cols;
            const r = Math.floor(i / cols);
            const x = pad + c * (cellW + pad);
            const y = 80 * this.dpr + r * (cellH + 10 * this.dpr);

            this.ctx.fillStyle = `rgb(${level}, ${level}, ${level})`;
            this.ctx.fillRect(x, y, cellW, cellH);

            this.ctx.fillStyle = '#666666';
            this.ctx.font = `${10 * this.dpr}px "JetBrains Mono"`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`L${level}`, x + cellW / 2, y + cellH / 2 + 4 * this.dpr);
        }

        this.ctx.fillStyle = '#00f3ff';
        this.ctx.font = `${13 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('BLACK-LEVEL CLIPPING // LEVEL 1-3 SHOULD BE FAINTLY VISIBLE', this.width / 2, 45 * this.dpr);
    },

    // 17. White-Level Highlight Clipping (Levels 230-255)
    drawWhiteClipping() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const cols = 6;
        const rows = 4;
        const pad = 16 * this.dpr;
        const cellW = (this.width - pad * (cols + 1)) / cols;
        const cellH = (this.height - 120 * this.dpr) / rows;

        for (let i = 0; i < 24; i++) {
            const level = 254 - i;
            const c = i % cols;
            const r = Math.floor(i / cols);
            const x = pad + c * (cellW + pad);
            const y = 80 * this.dpr + r * (cellH + 10 * this.dpr);

            this.ctx.fillStyle = `rgb(${level}, ${level}, ${level})`;
            this.ctx.fillRect(x, y, cellW, cellH);

            this.ctx.fillStyle = '#888888';
            this.ctx.font = `${10 * this.dpr}px "JetBrains Mono"`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`L${level}`, x + cellW / 2, y + cellH / 2 + 4 * this.dpr);
        }

        this.ctx.fillStyle = '#000000';
        this.ctx.font = `${13 * this.dpr}px "JetBrains Mono"`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('WHITE-LEVEL CLIPPING // LEVEL 253-254 SHOULD NOT BLOW OUT', this.width / 2, 45 * this.dpr);
    },

    // 18. Color Banding & Bit-Depth (16-bit simulated)
    drawColorBanding() {
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const bands = [
            { c1: '#000000', c2: '#ff0055', label: 'Red Spectrum (6-bit vs 8-bit+FRC vs 10-bit)' },
            { c1: '#000000', c2: '#00ff88', label: 'Green Spectrum' },
            { c1: '#000000', c2: '#00f3ff', label: 'Cyan Spectrum' },
            { c1: '#000000', c2: '#ffffff', label: 'Luminance Spectrum' }
        ];

        const barH = this.height / bands.length;
        bands.forEach((b, idx) => {
            const y = idx * barH;
            const grad = this.ctx.createLinearGradient(0, y, this.width, y);
            grad.addColorStop(0, b.c1);
            grad.addColorStop(1, b.c2);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, y, this.width, barH);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${10 * this.dpr}px "JetBrains Mono"`;
            this.ctx.textAlign = 'left';
            this.ctx.fillText(b.label, 20 * this.dpr, y + 25 * this.dpr);
        });
    },

    // ======================================================================
    // VISUAL STRESS & BENCHMARK ENGINES
    // ======================================================================

    // 19. Fast TV Static (Bitwise XorShift32 PRNG - 0 Moire Stripes)
    drawTvStatic() {
        if (!this.noiseBuf32) return;
        const buf = this.noiseBuf32;
        const len = buf.length;
        for (let i = 0; i < len; i += 16) {
            const r = this.rng.next();
            buf[i]      = (r & 1) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 1]  = (r & 2) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 2]  = (r & 4) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 3]  = (r & 8) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 4]  = (r & 16) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 5]  = (r & 32) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 6]  = (r & 64) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 7]  = (r & 128) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 8]  = (r & 256) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 9]  = (r & 512) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 10] = (r & 1024) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 11] = (r & 2048) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 12] = (r & 4096) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 13] = (r & 8192) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 14] = (r & 16384) ? 0xFFFFFFFF : 0xFF000000;
            buf[i + 15] = (r & 32768) ? 0xFFFFFFFF : 0xFF000000;
        }
        this.ctx.putImageData(this.noiseData, 0, 0);
    },

    // 20. High-Throughput RGB Noise
    drawRgbNoise() {
        if (!this.noiseBuf32) return;
        const buf = this.noiseBuf32;
        const len = buf.length;
        for (let i = 0; i < len; i += 4) {
            const r1 = this.rng.next();
            const r2 = this.rng.next();
            buf[i]     = 0xFF000000 | (r1 & 0x00FFFFFF);
            buf[i + 1] = 0xFF000000 | ((r1 >> 8) & 0x00FFFFFF);
            buf[i + 2] = 0xFF000000 | (r2 & 0x00FFFFFF);
            buf[i + 3] = 0xFF000000 | ((r2 >> 8) & 0x00FFFFFF);
        }
        this.ctx.putImageData(this.noiseData, 0, 0);
    },

    // 21. Particle Physics Storm
    particles: [],
    initParticles() {
        this.particles = [];
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        const isMobile = window.innerWidth <= 768;
        const count = (isMobile ? 120 : 250) * this.intensity;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 6 * this.dpr,
                vy: (Math.random() - 0.5) * 6 * this.dpr,
                size: (Math.random() * 3 + 1) * this.dpr,
                hue: Math.random() * 360,
                life: 1
            });
        }
    },

    drawParticles() {
        this.ctx.fillStyle = 'rgba(7, 7, 11, 0.12)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        const spd = this.intensity * 0.25;
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            p.x += p.vx * spd;
            p.y += p.vy * spd;
            p.hue = (p.hue + 2) % 360;

            if (p.x < 0 || p.x > this.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.height) p.vy *= -1;

            this.ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, 0.8)`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    // 22. Matrix Digital Rain
    drops: [],
    initMatrixRain() {
        const dropCount = Math.floor(this.width / (18 * this.dpr));
        this.drops = Array(dropCount).fill(0).map(() => Math.random() * this.height / (18 * this.dpr));
    },

    drawMatrixRain() {
        this.ctx.fillStyle = 'rgba(7, 7, 11, 0.08)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.fillStyle = '#00ff88';
        this.ctx.font = `${14 * this.dpr}px "JetBrains Mono"`;

        const step = 18 * this.dpr;
        for (let i = 0; i < this.drops.length; i++) {
            const char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
            this.ctx.fillText(char, i * step, this.drops[i] * step);

            if (this.drops[i] * step > this.height && Math.random() > 0.98) {
                this.drops[i] = 0;
            }
            this.drops[i] += this.intensity * 0.18;
        }
    },

    // 23. Spectral Gradient Storm
    gradientAngle: 0,
    drawGradientStorm() {
        this.gradientAngle = (this.gradientAngle + this.intensity * 0.6) % 360;
        const rad = (this.gradientAngle * Math.PI) / 180;

        const x1 = this.width / 2 + Math.cos(rad) * this.width;
        const y1 = this.height / 2 + Math.sin(rad) * this.height;
        const x2 = this.width / 2 - Math.cos(rad) * this.width;
        const y2 = this.height / 2 - Math.sin(rad) * this.height;

        const grad = this.ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, `hsla(${this.gradientAngle}, 100%, 50%, 0.1)`);
        grad.addColorStop(0.5, `hsla(${(this.gradientAngle + 120) % 360}, 100%, 50%, 0.1)`);
        grad.addColorStop(1, `hsla(${(this.gradientAngle + 240) % 360}, 100%, 50%, 0.1)`);

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    // 24. Rainbow Chaos
    rainbowHue: 0,
    drawRainbow() {
        this.rainbowHue = (this.rainbowHue + this.intensity) % 360;
        this.ctx.fillStyle = `hsl(${this.rainbowHue}, 100%, 40%)`;
        this.ctx.fillRect(0, 0, this.width, this.height);

        const count = this.intensity * 3;
        for (let i = 0; i < count; i++) {
            this.ctx.fillStyle = `hsla(${Math.random() * 360}, 100%, 50%, 0.6)`;
            this.ctx.fillRect(
                Math.random() * this.width,
                Math.random() * this.height,
                (40 + Math.random() * 120) * this.dpr,
                (40 + Math.random() * 120) * this.dpr
            );
        }
    },

    // 25. Strobe
    strobeState: false,
    strobeCount: 0,
    drawStrobe() {
        const speed = Math.max(1, 11 - this.intensity);
        this.strobeCount++;
        if (this.strobeCount >= speed) {
            this.strobeState = !this.strobeState;
            this.strobeCount = 0;
        }
        this.ctx.fillStyle = this.strobeState ? '#FFFFFF' : '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    // 26. Rapid Color Flash
    drawColorFlash() {
        this.ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
        this.ctx.fillRect(0, 0, this.width, this.height);
    },

    // 27. Clean Auto Cycle
    runAutoCycle() {
        const nextMode = this.autoCycleList[this.autoCycleIndex];
        this.start(nextMode);

        const autoBtn = document.querySelector('.btn-autocycle');
        if (autoBtn) autoBtn.classList.add('active');

        const specMode = document.getElementById('specMode');
        if (specMode) specMode.textContent = `CYCLE: ${nextMode.toUpperCase()}`;

        this.autoCycleTimeout = setTimeout(() => {
            if (this.isRunning && this.currentMode !== null) {
                this.autoCycleIndex = (this.autoCycleIndex + 1) % this.autoCycleList.length;
                this.runAutoCycle();
            }
        }, 4000);
    },

    // ======================================================================
    // 5. GUIDED WIZARD & DIAGNOSTIC REPORTING
    // ======================================================================
    wizardTests: [
        {
            mode: 'oled-black',
            title: 'OLED Pure Black & Backlight Bleed',
            prompt: 'Look at edges and center in dim lighting. Do you see any backlight bleeding, glowing corners, or bright stuck pixels?'
        },
        {
            mode: 'near-black',
            title: 'Near-Black Banding (5% IRE)',
            prompt: 'Examine the dark gray field. Are there severe vertical bands, cloudy blotches (mura), or flashing artifacts?'
        },
        {
            mode: 'phone-burnin',
            title: 'Status Bar & Notch Burn-In',
            prompt: 'Inspect top and bottom edges. Do you see any ghosted clock, battery, or home indicator lines etched into the glass?'
        },
        {
            mode: 'burnin',
            title: 'Dead Pixel & Primary Colors',
            prompt: 'Tap to cycle colors. Are there any permanent ghosted logos, taskbar outlines, or dead black subpixels?'
        },
        {
            mode: 'ufo-motion',
            title: 'Motion Pursuit & Ghosting Check',
            prompt: 'Track moving UFO blocks with your eyes. Is motion crisp without severe inverse overdrive white halos?'
        },
        {
            mode: 'grayscale',
            title: 'Grayscale Ramp Calibration',
            prompt: 'Can you distinctly distinguish all 32 luminance steps from 0% all the way up to 100%?'
        },
        {
            mode: 'black-clipping',
            title: 'Black-Level Shadow Detail',
            prompt: 'Are Level 1, Level 2, and Level 3 dark boxes faintly distinguishable from the black background?'
        },
        {
            mode: 'white-clipping',
            title: 'White-Level Highlight Detail',
            prompt: 'Are Level 252, Level 253, and Level 254 boxes distinguishable without blowing out to solid white?'
        },
        {
            mode: 'color-banding',
            title: 'Color Gradient Bit-Depth',
            prompt: 'Do the Red, Green, and Cyan gradients appear smooth without harsh stepped color banding lines?'
        }
    ],

    startWizard() {
        this.wizardActive = true;
        this.wizardStep = 0;
        this.diagnosticFindings = {};
        document.getElementById('wizardBanner').style.display = 'block';
        const runnerBar = document.getElementById('testRunnerBar');
        if (runnerBar) runnerBar.style.display = 'none';
        AudioEngine.playSuccess();
        this.runWizardStep();
    },

    runWizardStep() {
        const step = this.wizardTests[this.wizardStep];
        if (!step) {
            this.finishWizard();
            return;
        }

        const pct = Math.round(((this.wizardStep + 1) / this.wizardTests.length) * 100);
        document.getElementById('wizardProgressFill').style.width = `${pct}%`;
        document.getElementById('wizardStepText').textContent = `STEP ${this.wizardStep + 1} OF ${this.wizardTests.length}`;
        document.getElementById('wizardTitle').textContent = step.title;
        document.getElementById('wizardPrompt').textContent = step.prompt;

        if (step.mode === 'near-black') this.ireLevel = 5;
        this.start(step.mode);

        const runnerBar = document.getElementById('testRunnerBar');
        if (runnerBar) runnerBar.style.display = 'none';
    },

    handleWizardAnswer(passed) {
        const step = this.wizardTests[this.wizardStep];
        this.diagnosticFindings[step.title] = passed ? 'PASS' : 'ISSUE_DETECTED';
        AudioEngine.playClick();
        this.wizardStep++;
        this.runWizardStep();
    },

    handleWizardSkip() {
        const step = this.wizardTests[this.wizardStep];
        this.diagnosticFindings[step.title] = 'SKIPPED';
        AudioEngine.playHover();
        this.wizardStep++;
        this.runWizardStep();
    },

    exitWizard() {
        this.wizardActive = false;
        document.getElementById('wizardBanner').style.display = 'none';
        AudioEngine.playClick();
        this.stop();
    },

    finishWizard() {
        this.wizardActive = false;
        document.getElementById('wizardBanner').style.display = 'none';
        AudioEngine.playSuccess();
        this.stop();
        this.showReport();
    },

    // Diagnostic Report Dialog
    showReport() {
        const modal = document.getElementById('reportModal');
        const repRes = document.getElementById('repRes');
        const repRefresh = document.getElementById('repRefresh');
        const repDpr = document.getElementById('repDpr');
        const repDepth = document.getElementById('repDepth');
        const repTime = document.getElementById('reportTimestamp');
        const gradeEl = document.getElementById('reportGrade');
        const tableBody = document.getElementById('reportBodyTable');
        const recList = document.getElementById('reportRecommendations');

        const dpr = window.devicePixelRatio || 1;
        if (repRes) repRes.textContent = `${Math.round(window.innerWidth * dpr)}×${Math.round(window.innerHeight * dpr)}`;
        if (repRefresh) repRefresh.textContent = Telemetry.refreshRate ? `${Telemetry.refreshRate} Hz` : `${Telemetry.fps} Hz (Active)`;
        if (repDpr) repDpr.textContent = `${dpr.toFixed(2)}x`;
        const rawDepth = screen.colorDepth || 24;
        let bpc = 8;
        if (rawDepth >= 36) bpc = 12;
        else if (rawDepth >= 30) bpc = 10;
        else if (rawDepth === 16 || rawDepth === 18) bpc = 6;
        else bpc = 8;
        if (repDepth) repDepth.textContent = `${bpc}-bit (${rawDepth}b TrueColor)`;
        if (repTime) repTime.textContent = new Date().toLocaleString();

        tableBody.innerHTML = '';
        let passCount = 0;
        let issueCount = 0;

        const allTests = this.wizardTests.map(t => t.title);
        allTests.forEach(testName => {
            const status = this.diagnosticFindings[testName] || 'NOT TESTED';
            const tr = document.createElement('tr');
            let badgeClass = 'badge-warn';
            let statusText = 'Not Tested';

            if (status === 'PASS') {
                passCount++;
                badgeClass = 'badge-pass';
                statusText = '✓ Perfect / Pass';
            } else if (status === 'ISSUE_DETECTED') {
                issueCount++;
                badgeClass = 'badge-fail';
                statusText = '✗ Issue Observed';
            }

            tr.innerHTML = `
                <td><strong>${testName}</strong></td>
                <td><span class="${badgeClass}">${statusText}</span></td>
                <td>Certified Diagnostic Verification</td>
            `;
            tableBody.appendChild(tr);
        });

        let grade = 'A+';
        if (issueCount === 1) grade = 'A';
        else if (issueCount === 2) grade = 'B';
        else if (issueCount >= 3) grade = 'C';
        if (gradeEl) gradeEl.textContent = grade;

        recList.innerHTML = '';
        const recs = [];

        if (this.diagnosticFindings['OLED Pure Black & Backlight Bleed'] === 'ISSUE_DETECTED') {
            recs.push('OLED/IPS Bleed: If using IPS, adjust bezel mounting pressure or reduce brightness to ~120 nits to minimize IPS glow. If using OLED, perform a manual Pixel Refresh in your display settings.');
        }
        if (this.diagnosticFindings['Status Bar & Notch Burn-In'] === 'ISSUE_DETECTED') {
            recs.push('Mobile Status Bar Burn-In: Use fullscreen immersive mode for apps, hide battery percentage, and schedule dark mode to prevent permanent status icon etching.');
        }
        if (this.diagnosticFindings['Near-Black Banding (5% IRE)'] === 'ISSUE_DETECTED') {
            recs.push('Near-Black Uniformity: OLED panels often exhibit vertical banding during early operating hours. Run a full pixel cleaning cycle and check if dynamic tone mapping is causing shadow lift.');
        }
        if (this.diagnosticFindings['Dead Pixel & Primary Colors'] === 'ISSUE_DETECTED') {
            recs.push('Dead / Stuck Pixels: Utilize the [ Stuck Pixel Reviver ] mode centered directly over the affected subpixels for 15-30 minutes to stimulate dormant liquid crystal/OLED subpixels.');
        }
        if (this.diagnosticFindings['Motion Pursuit & Ghosting Check'] === 'ISSUE_DETECTED') {
            recs.push('Motion Smear & Overdrive: If trailing halos appear behind moving objects, reduce your monitor Overdrive setting from "Extreme" down to "Normal/Fast" to eliminate overshoot.');
        }
        if (this.diagnosticFindings['Black-Level Shadow Detail'] === 'ISSUE_DETECTED') {
            recs.push('Shadow Crushing: Increase display brightness by 2-4% or select a Gamma 2.2 profile so dark movie and gaming scenes do not crush into black.');
        }

        if (recs.length === 0) {
            recs.push('Display Health Optimal: No panel defects, gamma clipping, or motion response issues detected. Your display is operating at peak factory specifications.');
            recs.push('OLED Maintenance: Keep static elements on auto-hide and set a 3-5 minute display timeout to protect your panel lifespan.');
        }

        recs.forEach(r => {
            const li = document.createElement('li');
            li.textContent = r;
            recList.appendChild(li);
        });

        modal.style.display = 'flex';
        AudioEngine.playClick();
    },

    hideReport() {
        const modal = document.getElementById('reportModal');
        if (modal) modal.style.display = 'none';
        AudioEngine.playClick();
    },

    exportJsonReport() {
        const dpr = window.devicePixelRatio || 1;
        const reportData = {
            application: 'DisplayDoctor Pro v4.0',
            timestamp: new Date().toISOString(),
            specs: {
                resolution: `${Math.round(window.innerWidth * dpr)}x${Math.round(window.innerHeight * dpr)}`,
                refreshRate: Telemetry.refreshRate || Telemetry.fps,
                devicePixelRatio: dpr,
                colorDepth: screen.colorDepth || 24
            },
            diagnosticFindings: this.diagnosticFindings
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `displaydoctor-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        AudioEngine.playSuccess();
    }
};

// ==========================================================================
// 6. INITIALIZE ON DOM CONTENT LOADED
// ==========================================================================
window.App = App;
window.AudioEngine = AudioEngine;
window.ThemeEngine = ThemeEngine;
window.Telemetry = Telemetry;

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
