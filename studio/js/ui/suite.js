/**
 * DisplayDoctor Pro — "Test All": shows every suite test for a fixed time,
 * with pause/resume, manual skip, and a progress line in the HUD.
 */
(function (DD) {
    'use strict';

    const STEP_MS = 10000;
    const TICK_MS = 100;

    let app = null;
    let tests = [];
    let index = 0;
    let elapsed = 0;
    let lastTick = 0;
    let timer = null;
    let active = false;

    function clearTimer() {
        clearInterval(timer);
        timer = null;
    }

    function updateHud() {
        DD.Hud.setSuiteProgress(`${index + 1}/${tests.length}`, elapsed / STEP_MS);
        DD.Hud.setCountdown(app.isPaused() ? 'Paused' : `${Math.ceil((STEP_MS - elapsed) / 1000)}s`);
    }

    function tick() {
        const now = performance.now();
        if (!app.isPaused()) elapsed += now - lastTick;
        lastTick = now;
        if (elapsed >= STEP_MS) {
            go(index + 1);
            return;
        }
        updateHud();
    }

    function go(nextIndex) {
        clearTimer();
        if (nextIndex >= tests.length) {
            finish();
            return;
        }
        index = Math.max(0, nextIndex);
        elapsed = 0;
        lastTick = performance.now();
        app.start(tests[index].id, { fromSuite: true, position: `Test All ${index + 1} of ${tests.length}` });
        updateHud();
        timer = setInterval(tick, TICK_MS);
    }

    function finish() {
        DD.Suite.stop();
        app.stop();
        DD.Audio.success();
        DD.toast(`Test All complete — ${tests.length} tests shown`, 3200);
    }

    DD.Suite = {
        STEP_SECONDS: STEP_MS / 1000,

        init(appRef) {
            app = appRef;
        },

        start() {
            tests = DD.suiteTests();
            active = true;
            go(0);
        },

        stop() {
            if (!active) return;
            active = false;
            clearTimer();
            DD.Hud.setSuiteProgress(null);
        },

        /** Move within the suite (HUD prev/next, arrow keys, swipes). */
        step(direction) {
            go(Math.min(tests.length - 1, index + direction));
        },

        onPauseChanged() {
            if (active) updateHud();
        },

        isActive: () => active
    };
})(window.DD);
