/**
 * PanelProbe — Studio application controller.
 *
 * Owns the canvas, the render loop and test lifecycle, and wires global input
 * (keyboard, pointer, header buttons) to the UI modules in studio/js/ui/.
 * Test definitions live in studio/js/tests/.
 */
(function (DD) {
    'use strict';

    const $ = (id) => document.getElementById(id);

    const settings = {
        ireLevel: 0,
        motionSpeed: 480,
        aplLevel: 10,
        subpixelType: 'text',
        phoneOverlay: 'notch',
        reviver: 60
    };

    const state = {
        test: null,
        pattern: null,
        paused: false,
        autoPaused: false,
        rafId: null,
        hiDpi: true,
        autoStopTimer: null,
        statsVisible: false,
        hintShown: false
    };

    let canvas = null;
    let r = null;

    // ---------------------------------------------------------------------
    // Canvas sizing — maps the backing store 1:1 to device pixels when
    // "1:1" mode is on, using device-pixel-content-box where supported.
    // ---------------------------------------------------------------------
    let devicePixelSize = null;

    function applyCanvasSize() {
        const cssW = canvas.clientWidth || window.innerWidth;
        const cssH = canvas.clientHeight || window.innerHeight;
        const ratio = window.devicePixelRatio || 1;

        let w;
        let h;
        if (!state.hiDpi) {
            w = Math.round(cssW);
            h = Math.round(cssH);
        } else if (devicePixelSize) {
            [w, h] = devicePixelSize;
        } else {
            w = Math.round(cssW * ratio);
            h = Math.round(cssH * ratio);
        }

        const changed = canvas.width !== w || canvas.height !== h;
        if (changed) {
            canvas.width = w;
            canvas.height = h;
        }
        r.width = w;
        r.height = h;
        r.dpr = state.hiDpi ? w / cssW : 1;
        return changed;
    }

    function onResize() {
        applyCanvasSize();
        if (!state.pattern) return;
        if (state.pattern.animated) {
            if (state.pattern.resize) state.pattern.resize(r);
        } else {
            state.pattern.draw(r);
        }
    }

    function setupCanvasSizing() {
        if ('ResizeObserver' in window) {
            const ro = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (entry.devicePixelContentBoxSize && entry.devicePixelContentBoxSize[0]) {
                    const box = entry.devicePixelContentBoxSize[0];
                    devicePixelSize = [box.inlineSize, box.blockSize];
                }
                onResize();
            });
            try {
                ro.observe(canvas, { box: 'device-pixel-content-box' });
            } catch (_) {
                ro.observe(canvas);
            }
        } else {
            window.addEventListener('resize', onResize);
        }
        applyCanvasSize();
    }

    function toggleHiDpi() {
        state.hiDpi = !state.hiDpi;
        const btn = $('btnToggleDpr');
        btn.textContent = state.hiDpi ? '1:1' : 'CSS';
        btn.setAttribute('aria-pressed', String(state.hiDpi));
        DD.Audio.click();
        onResize();
        DD.toast(state.hiDpi ? 'Pixel mapping: 1:1 device pixels' : 'Pixel mapping: CSS pixels (scaled)');
    }

    // ---------------------------------------------------------------------
    // Test lifecycle
    // ---------------------------------------------------------------------
    function cancelLoop() {
        if (state.rafId) cancelAnimationFrame(state.rafId);
        state.rafId = null;
    }

    function runLoop() {
        cancelLoop();
        const pattern = state.pattern;
        const frame = (now) => {
            if (state.pattern !== pattern) return;
            const dt = DD.Telemetry.tick(now);
            if (!state.paused) pattern.frame(r, dt, now);
            state.rafId = requestAnimationFrame(frame);
        };
        state.rafId = requestAnimationFrame(frame);
    }

    function clearAutoStop() {
        clearInterval(state.autoStopTimer);
        state.autoStopTimer = null;
        DD.Hud.setSafetyTimer(null);
    }

    function startAutoStop(seconds) {
        let remaining = seconds;
        DD.Hud.setSafetyTimer(remaining);
        state.autoStopTimer = setInterval(() => {
            if (state.paused) return;
            remaining--;
            DD.Hud.setSafetyTimer(remaining);
            if (remaining <= 0) {
                stop();
                DD.toast('Flashing test stopped automatically');
            }
        }, 1000);
    }

    function teardownPattern() {
        cancelLoop();
        clearAutoStop();
        if (state.pattern && state.pattern.cleanup) state.pattern.cleanup(r);
    }

    function wantsAutoFullscreen() {
        const check = $('autoFullscreenCheck');
        return !check || check.checked;
    }

    /**
     * Start a test.
     * @param {string} id
     * @param {{ fromUser?: boolean, fromSuite?: boolean, hud?: boolean, position?: string }} opts
     *   fromUser  started by a click/key — may request fullscreen
     *   fromSuite started by Test All — keeps the suite running
     *   hud       show the floating HUD (the wizard uses its own banner)
     *   position  HUD subtitle override, e.g. "Test All 3 of 24"
     */
    function start(id, opts = {}) {
        const test = DD.getTest(id);
        const pattern = DD.patterns[id];
        if (!test || !pattern) {
            console.error(`[PanelProbe] Unknown test "${id}"`);
            return;
        }

        if (!opts.fromSuite) DD.Suite.stop();
        if (opts.fromUser && wantsAutoFullscreen()) DD.Fullscreen.request();

        teardownPattern();
        state.test = test;
        state.pattern = pattern;
        state.paused = false;
        state.autoPaused = false;

        document.body.classList.add('is-testing');
        DD.Telemetry.reset();
        $('specMode').textContent = test.title;

        const interactive = opts.hud !== false;
        const position = opts.position || `${DD.TESTS.indexOf(test) + 1} of ${DD.TESTS.length}`;
        DD.Hud.show(test, settings, { interactive, position });
        if (interactive && !state.hintShown) {
            state.hintShown = true;
            const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
            DD.toast(touch ? 'Tap the screen to show controls' : 'Move the pointer to the bottom for controls · H to pin', 3200);
        }
        r.fill('#000000');
        if (pattern.init) pattern.init(r);

        if (pattern.animated) runLoop();
        else pattern.draw(r);

        if (test.autoStop) startAutoStop(test.autoStop);
    }

    function stop() {
        const wasRunning = !!state.test;
        DD.Suite.stop();
        if (DD.Wizard.isActive()) {
            DD.Wizard.exit();
            return;
        }
        teardownPattern();
        state.test = null;
        state.pattern = null;
        state.paused = false;

        DD.Hud.hide();
        document.body.classList.remove('is-testing');
        $('specMode').textContent = 'Standby';
        r.fill('#000000');
        if (wasRunning) DD.Audio.click();
    }

    function navigate(direction) {
        if (!state.test) return;
        DD.Audio.click();
        if (DD.Suite.isActive()) {
            DD.Suite.step(direction);
            return;
        }
        const list = DD.TESTS;
        const i = list.indexOf(state.test);
        const next = list[(i + direction + list.length) % list.length];
        start(next.id);
    }

    function setPaused(paused) {
        if (!state.test) return;
        state.paused = paused;
        DD.Hud.setPaused(paused);
        DD.Suite.onPauseChanged(paused);
    }

    function togglePause() {
        if (!state.test) return;
        setPaused(!state.paused);
        DD.Audio.tone(state.paused ? 300 : 600, 0.08);
        if (!state.paused) DD.Hud.peek(900);
    }

    function onSettingChange(key, value) {
        settings[key] = value;
        if (!state.pattern) return;
        if (state.pattern.animated) {
            if (key === 'reviver' && state.pattern.init) state.pattern.init(r);
        } else {
            state.pattern.draw(r);
        }
    }

    // ---------------------------------------------------------------------
    // Input
    // ---------------------------------------------------------------------
    function isTypingTarget(el) {
        return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    }

    function handleKeyDown(e) {
        if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
        if (DD.SafetyGate.isOpen()) return;

        if (DD.Report.isOpen()) {
            if (e.key === 'Escape') DD.Report.hide();
            return;
        }

        const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
        const onButton = e.target && e.target.closest && e.target.closest('button');

        switch (key) {
            case 'Escape':
                if (state.test) {
                    e.preventDefault();
                    stop();
                }
                return;
            case ' ':
                if (state.test && !onButton) {
                    e.preventDefault();
                    togglePause();
                }
                return;
            case 'ArrowLeft':
            case 'ArrowRight':
                if (state.test && !DD.Wizard.isActive()) {
                    e.preventDefault();
                    navigate(key === 'ArrowRight' ? 1 : -1);
                    DD.Hud.peek();
                }
                return;
            case 'f':
                e.preventDefault();
                toggleFullscreen();
                return;
            case 'h':
                if (state.test) DD.Hud.togglePin();
                return;
            case 's':
                toggleStats();
                return;
            case 'm':
                DD.Audio.toggleMute();
                return;
            default:
                break;
        }

        const test = DD.getTestByKey(key);
        if (test && !DD.Wizard.isActive()) {
            e.preventDefault();
            DD.Audio.click();
            start(test.id, { fromUser: true });
        }
    }

    function setupPointer() {
        let down = null;

        canvas.addEventListener('pointerdown', (e) => {
            down = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType };
            if (state.pattern && state.pattern.onPointer) {
                canvas.setPointerCapture(e.pointerId);
                state.pattern.onPointer(r, e.clientX, e.clientY);
            }
        });

        canvas.addEventListener('pointermove', (e) => {
            if (down && state.pattern && state.pattern.onPointer) state.pattern.onPointer(r, e.clientX, e.clientY);
        });

        canvas.addEventListener('pointerup', (e) => {
            if (!down || !state.pattern) {
                down = null;
                return;
            }
            const dx = e.clientX - down.x;
            const dy = e.clientY - down.y;
            const dt = performance.now() - down.t;
            const pattern = state.pattern;
            const origin = down;
            down = null;

            if (pattern.onPointer) return;

            const isSwipe = origin.type !== 'mouse' && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500;
            if (isSwipe && !DD.Wizard.isActive()) {
                navigate(dx < 0 ? 1 : -1);
                return;
            }

            const isTap = Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 350;
            if (!isTap) return;
            if (pattern.onTap) pattern.onTap(r);
            else if (origin.type !== 'mouse' && !DD.Wizard.isActive()) DD.Hud.togglePin();
        });

        canvas.addEventListener('pointercancel', () => {
            down = null;
        });

        canvas.addEventListener('dblclick', () => {
            if (state.pattern && !state.pattern.onTap && !state.pattern.onPointer) toggleFullscreen();
        });

        // Pixel reviver box: drag to position over a stuck pixel.
        const box = $('pixelReviver');
        box.addEventListener('pointerdown', (e) => {
            box.setPointerCapture(e.pointerId);
            box.dataset.dragging = 'true';
        });
        box.addEventListener('pointermove', (e) => {
            if (box.dataset.dragging !== 'true') return;
            box.style.left = `${e.clientX}px`;
            box.style.top = `${e.clientY}px`;
        });
        const endBoxDrag = () => {
            delete box.dataset.dragging;
        };
        box.addEventListener('pointerup', endBoxDrag);
        box.addEventListener('pointercancel', endBoxDrag);
    }

    // ---------------------------------------------------------------------
    // Header tools
    // ---------------------------------------------------------------------
    function toggleFullscreen() {
        DD.Audio.click();
        DD.Fullscreen.toggle().then((result) => {
            if (result === 'fallback') DD.toast('Full-viewport mode (browser fullscreen unavailable)', 3000);
        });
    }

    function syncFullscreenUi({ active }) {
        document.querySelectorAll('[data-fullscreen-toggle]').forEach((btn) => {
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', String(active));
            const label = btn.querySelector('[data-fs-label]');
            if (label) label.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
        });
    }

    function toggleStats(force) {
        state.statsVisible = force !== undefined ? force : !state.statsVisible;
        $('statsPanel').hidden = !state.statsVisible;
        $('btnToggleStats').setAttribute('aria-pressed', String(state.statsVisible));
        DD.Audio.click();
    }

    function setupHeader() {
        document.querySelectorAll('[data-action="test-all"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (wantsAutoFullscreen()) DD.Fullscreen.request();
                DD.Audio.click();
                DD.Suite.start();
            });
        });
        document.querySelectorAll('[data-action="wizard"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (wantsAutoFullscreen()) DD.Fullscreen.request();
                DD.Wizard.start();
            });
        });
        document.querySelectorAll('[data-fullscreen-toggle]').forEach((btn) => {
            btn.addEventListener('click', toggleFullscreen);
        });

        $('btnOpenReport').addEventListener('click', () => DD.Report.show());
        $('btnToggleMute').addEventListener('click', () => DD.Audio.toggleMute());
        $('btnToggleDpr').addEventListener('click', toggleHiDpi);
        $('btnToggleStats').addEventListener('click', () => toggleStats());
        $('closeStatsBtn').addEventListener('click', () => toggleStats(false));

        const autoCheck = $('autoFullscreenCheck');
        autoCheck.checked = DD.Storage.getBool('autofullscreen', true);
        autoCheck.addEventListener('change', () => DD.Storage.set('autofullscreen', autoCheck.checked));

        DD.Theme.onChange(() => DD.Audio.click());
        DD.Fullscreen.onChange(syncFullscreenUi);
    }

    // ---------------------------------------------------------------------
    // Boot
    // ---------------------------------------------------------------------
    const App = {
        settings,
        start,
        stop,
        navigate,
        togglePause,
        isPaused: () => state.paused,
        get currentTest() { return state.test ? state.test.id : null; }
    };

    function init() {
        canvas = $('displayCanvas');
        r = DD.createRenderer(canvas, settings);
        r.setStatus = (text) => DD.Hud.setStatus(text);

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            settings.motionSpeed = 240;
        }

        DD.Theme.init();
        DD.Audio.init();
        DD.DisplayInfo.watch();
        DD.Telemetry.init();

        setupCanvasSizing();
        setupPointer();
        setupHeader();

        DD.Catalog.init((id) => start(id, { fromUser: true }));
        DD.Hud.init({
            onExit: stop,
            onPrev: () => navigate(-1),
            onNext: () => navigate(1),
            onPause: togglePause,
            onSettingChange
        });
        DD.Suite.init(App);
        DD.Wizard.init(App);
        DD.Report.init();
        DD.SafetyGate.init();

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.test && !state.paused) {
                state.autoPaused = true;
                setPaused(true);
            } else if (!document.hidden && state.autoPaused) {
                state.autoPaused = false;
                setPaused(false);
            }
        });

        r.fill('#000000');
    }

    DD.App = App;
    document.addEventListener('DOMContentLoaded', init);
})(window.DD);
