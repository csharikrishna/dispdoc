/**
 * DisplayDoctor Pro — Frame timing telemetry and refresh-rate estimation.
 *
 * The refresh rate is estimated from requestAnimationFrame intervals and
 * snapped to common panel rates. It reflects the rate the browser is
 * compositing at, which is normally the display's refresh rate.
 */
(function (DD) {
    'use strict';

    const STANDARD_RATES = [50, 60, 72, 75, 85, 90, 100, 120, 144, 165, 170, 175, 180, 200, 240, 280, 300, 360, 480, 500, 540];
    const WINDOW = 120;

    const state = {
        refreshRate: 0,
        targetFrameTime: 1000 / 60,
        fps: 0,
        frameTime: 0,
        droppedFrames: 0,
        lastTime: 0,
        frameCount: 0,
        samples: new Float32Array(WINDOW),
        sampleIndex: 0,
        sampleCount: 0,
        detectRaf: null
    };

    const $ = (id) => document.getElementById(id);

    function setText(id, text) {
        const el = $(id);
        if (el) el.textContent = text;
    }

    function setRefreshText(text) {
        document.querySelectorAll('[data-refresh-rate]').forEach((el) => {
            el.textContent = text;
        });
    }

    function snapRate(hz) {
        for (const std of STANDARD_RATES) {
            if (Math.abs(hz - std) <= 2.2) return std;
        }
        return Math.round(hz);
    }

    function detectRefreshRate() {
        if (state.detectRaf) cancelAnimationFrame(state.detectRaf);
        setRefreshText('Measuring…');

        const intervals = [];
        let start = 0;
        let last = 0;

        const sample = (now) => {
            if (!start) {
                start = last = now;
            } else {
                const delta = now - last;
                last = now;
                if (delta > 1 && delta < 100) intervals.push(delta);
            }

            const elapsed = now - start;
            const enough = elapsed >= 600 && intervals.length >= 30;
            if (enough || elapsed >= 2500) {
                state.detectRaf = null;
                if (intervals.length < 5) {
                    setRefreshText('Unavailable');
                    return;
                }
                intervals.sort((a, b) => a - b);
                const trim = Math.floor(intervals.length * 0.1);
                const clean = intervals.slice(trim, intervals.length - trim);
                const avg = clean.reduce((a, b) => a + b, 0) / clean.length;
                state.refreshRate = snapRate(1000 / avg);
                state.targetFrameTime = 1000 / state.refreshRate;
                setRefreshText(`${state.refreshRate} Hz`);
                return;
            }
            state.detectRaf = requestAnimationFrame(sample);
        };

        state.detectRaf = requestAnimationFrame(sample);
    }

    function reset() {
        state.lastTime = 0;
        state.frameCount = 0;
        state.droppedFrames = 0;
        state.sampleIndex = 0;
        state.sampleCount = 0;
        state.frameTime = 0;
        setText('statDropped', '0');
        setText('statFps', '--');
        setText('statFrameTime', '-- ms');
        setText('statP95', '-- ms');
    }

    /**
     * Record one animation frame. Returns the clamped frame delta in seconds,
     * suitable for driving motion without jumps after pauses or tab switches.
     */
    function tick(now) {
        if (!state.lastTime) {
            state.lastTime = now;
            return 0;
        }
        const delta = now - state.lastTime;
        state.lastTime = now;
        state.frameTime = delta;
        state.frameCount++;

        state.samples[state.sampleIndex] = delta;
        state.sampleIndex = (state.sampleIndex + 1) % WINDOW;
        state.sampleCount = Math.min(state.sampleCount + 1, WINDOW);

        if (delta > state.targetFrameTime * 1.8 && delta < 1000) {
            state.droppedFrames++;
            setText('statDropped', String(state.droppedFrames));
        }

        if (state.frameCount % 10 === 0) updatePanel();

        return Math.min(delta, 100) / 1000;
    }

    function updatePanel() {
        const n = state.sampleCount;
        if (!n) return;
        const values = Array.from(state.samples.subarray(0, n)).sort((a, b) => a - b);
        const avg = values.reduce((a, b) => a + b, 0) / n;
        const p95 = values[Math.min(n - 1, Math.floor(n * 0.95))];
        state.fps = Math.round(1000 / avg);

        const fpsEl = $('statFps');
        if (fpsEl) {
            const ratio = state.refreshRate ? state.fps / state.refreshRate : state.fps / 60;
            fpsEl.textContent = String(state.fps);
            fpsEl.className = 'stat-val ' + (ratio >= 0.95 ? 'is-good' : ratio >= 0.6 ? 'is-warn' : 'is-bad');
        }
        setText('statFrameTime', `${avg.toFixed(1)} ms`);
        setText('statP95', `${p95.toFixed(1)} ms`);
    }

    DD.Telemetry = {
        init() {
            detectRefreshRate();
            let timer = null;
            window.addEventListener('resize', () => {
                clearTimeout(timer);
                timer = setTimeout(detectRefreshRate, 400);
            });
        },
        reset,
        tick,
        get refreshRate() { return state.refreshRate; },
        get fps() { return state.fps; }
    };
})(window.DD = window.DD || {});
