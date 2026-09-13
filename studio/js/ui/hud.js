/**
 * DisplayDoctor Pro — Floating test HUD.
 *
 * Visibility model (the screen belongs to the test pattern):
 *   • Hidden by default when a test starts.
 *   • Revealed while the pointer is near the bar (a padded zone around it),
 *     and hidden again shortly after the pointer leaves.
 *   • Briefly revealed after a keyboard shortcut, so the result is visible.
 *   • Always visible while paused or while a HUD control has keyboard focus.
 *   • "Pinned" (H key, tap on touch screens) keeps it visible until unpinned.
 */
(function (DD) {
    'use strict';

    const ZONE_X = 80;          // px of slack around the bar that counts as "near"
    const ZONE_Y = 110;
    const HIDE_DELAY = 600;     // ms after the pointer leaves the zone
    const KEY_PEEK = 1800;      // ms the bar stays visible after a shortcut
    const CURSOR_IDLE = 2000;   // ms before the cursor hides over the pattern

    const $ = (id) => document.getElementById(id);

    let bar = null;
    let active = false;         // a test with an interactive HUD is running
    let pinned = false;
    let paused = false;
    let near = false;
    let peekUntil = 0;
    let hideTimer = null;
    let cursorTimer = null;
    let lastPointer = null;

    function shouldShow() {
        return pinned || paused || near || performance.now() < peekUntil || bar.contains(document.activeElement);
    }

    function render() {
        if (!bar || !active) return;
        const show = shouldShow();
        bar.classList.toggle('is-visible', show);
        bar.setAttribute('aria-hidden', String(!show));
        $('btnHideHud').setAttribute('aria-pressed', String(pinned));
    }

    function scheduleRender(delay) {
        clearTimeout(hideTimer);
        hideTimer = setTimeout(render, delay);
    }

    function isNearBar(x, y) {
        const rect = bar.getBoundingClientRect();
        return x >= rect.left - ZONE_X && x <= rect.right + ZONE_X && y >= rect.top - ZONE_Y && y <= rect.bottom + ZONE_Y;
    }

    function onPointerMove(e) {
        if (!active) return;
        lastPointer = { x: e.clientX, y: e.clientY };

        document.body.classList.remove('hide-cursor');
        clearTimeout(cursorTimer);
        cursorTimer = setTimeout(() => {
            if (active && !near) document.body.classList.add('hide-cursor');
        }, CURSOR_IDLE);

        if (e.pointerType === 'touch') return; // touch uses tap-to-pin instead of proximity
        const wasNear = near;
        near = isNearBar(e.clientX, e.clientY);
        if (near) {
            clearTimeout(hideTimer);
            render();
        } else if (wasNear) {
            scheduleRender(HIDE_DELAY);
        }
    }

    function setupDrag() {
        const handle = $('runnerDragHandle');
        let startX = 0;
        let startY = 0;
        let originLeft = 0;
        let originTop = 0;
        let dragging = false;

        handle.addEventListener('pointerdown', (e) => {
            dragging = true;
            handle.setPointerCapture(e.pointerId);
            const rect = bar.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            originLeft = rect.left;
            originTop = rect.top;
            bar.classList.add('is-dragging', 'is-positioned');
            bar.style.left = `${originLeft}px`;
            bar.style.top = `${originTop}px`;
        });

        handle.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const maxLeft = window.innerWidth - bar.offsetWidth - 8;
            const maxTop = window.innerHeight - bar.offsetHeight - 8;
            bar.style.left = `${Math.max(8, Math.min(originLeft + e.clientX - startX, maxLeft))}px`;
            bar.style.top = `${Math.max(8, Math.min(originTop + e.clientY - startY, maxTop))}px`;
        });

        const end = () => {
            dragging = false;
            bar.classList.remove('is-dragging');
        };
        handle.addEventListener('pointerup', end);
        handle.addEventListener('pointercancel', end);

        handle.addEventListener('dblclick', () => {
            bar.classList.remove('is-positioned');
            bar.style.left = '';
            bar.style.top = '';
        });
    }

    function setupControlGroups(onSettingChange) {
        document.querySelectorAll('.runner-control-group').forEach((group) => {
            group.addEventListener('click', (e) => {
                const btn = e.target.closest('.seg-btn');
                if (!btn) return;
                group.querySelectorAll('.seg-btn').forEach((b) => {
                    b.classList.toggle('active', b === btn);
                    b.setAttribute('aria-pressed', String(b === btn));
                });
                const raw = btn.getAttribute('data-value');
                const value = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw;
                DD.Audio.click();
                onSettingChange(group.getAttribute('data-setting'), value);
            });
        });
    }

    /** Reflect current settings in the segmented buttons (e.g. wizard presets). */
    function syncControls(settings) {
        document.querySelectorAll('.runner-control-group').forEach((group) => {
            const value = String(settings[group.getAttribute('data-setting')]);
            group.querySelectorAll('.seg-btn').forEach((b) => {
                const on = b.getAttribute('data-value') === value;
                b.classList.toggle('active', on);
                b.setAttribute('aria-pressed', String(on));
            });
        });
    }

    DD.Hud = {
        init({ onExit, onPrev, onNext, onPause, onSettingChange }) {
            bar = $('testRunnerBar');
            $('btnExitTest').addEventListener('click', onExit);
            $('btnPrevTest').addEventListener('click', onPrev);
            $('btnNextTest').addEventListener('click', onNext);
            $('btnPauseTest').addEventListener('click', onPause);
            $('btnHideHud').addEventListener('click', () => DD.Hud.togglePin());
            setupDrag();
            setupControlGroups(onSettingChange);

            window.addEventListener('pointermove', onPointerMove, { passive: true });
            bar.addEventListener('focusin', render);
            bar.addEventListener('focusout', () => scheduleRender(HIDE_DELAY));
            document.documentElement.addEventListener('pointerleave', () => {
                near = false;
                scheduleRender(HIDE_DELAY);
            });
        },

        /**
         * @param {object} test      registry entry
         * @param {object} settings  current HUD settings
         * @param {{ interactive?: boolean, position?: string }} opts
         */
        show(test, settings, { interactive = true, position = '' } = {}) {
            const category = DD.CATEGORIES.find((c) => c.id === test.category);
            $('runnerTestName').textContent = test.title;
            $('runnerMeta').textContent = [category && category.label, position].filter(Boolean).join(' · ');
            $('runnerKey').textContent = test.key.toUpperCase();
            $('runnerStatus').textContent = '';
            document.querySelectorAll('.runner-control-group').forEach((g) => {
                g.hidden = g.id !== test.controls;
            });
            syncControls(settings);
            DD.Hud.setPaused(false);

            active = interactive;
            bar.hidden = !interactive;
            if (!interactive) return;

            // Re-evaluate proximity against the new layout (width changes per test).
            requestAnimationFrame(() => {
                near = lastPointer ? isNearBar(lastPointer.x, lastPointer.y) : false;
                render();
            });
        },

        hide() {
            active = false;
            near = false;
            peekUntil = 0;
            if (bar) {
                bar.hidden = true;
                bar.classList.remove('is-visible');
            }
            clearTimeout(hideTimer);
            clearTimeout(cursorTimer);
            document.body.classList.remove('hide-cursor');
        },

        /** Show the bar briefly (after keyboard shortcuts). */
        peek(ms = KEY_PEEK) {
            if (!active) return;
            peekUntil = performance.now() + ms;
            render();
            scheduleRender(ms + 20);
        },

        /** H key, tap on touch screens, and the pin button. */
        togglePin(force) {
            if (!active) return;
            pinned = force !== undefined ? force : !pinned;
            if (!pinned) {
                near = false;
                peekUntil = 0;
            }
            render();
        },

        isPinned: () => pinned,

        setStatus(text) {
            $('runnerStatus').textContent = text;
        },

        setPaused(value) {
            paused = value;
            const btn = $('btnPauseTest');
            btn.innerHTML = DD.icon(value ? 'play' : 'pause', 14);
            btn.setAttribute('aria-label', value ? 'Resume test (Space)' : 'Pause test (Space)');
            btn.title = value ? 'Resume (Space)' : 'Pause (Space)';
            bar.classList.toggle('is-paused', value);
            render();
        },

        /** Test All progress; pass null to hide. fraction is 0–1 of the current step. */
        setSuiteProgress(label, fraction = 0) {
            const chip = $('testAllBadge');
            const track = $('runnerProgress');
            const visible = label !== null;
            chip.hidden = !visible;
            track.hidden = !visible;
            if (!visible) return;
            $('testAllStepText').textContent = label;
            $('runnerProgressFill').style.transform = `scaleX(${Math.max(0, Math.min(1, fraction))})`;
        },

        setCountdown(text) {
            $('testAllCountdown').textContent = text;
        },

        setSafetyTimer(seconds) {
            const badge = $('safetyBadge');
            badge.hidden = seconds === null;
            if (seconds !== null) $('safetyTimerText').textContent = `${seconds}s`;
        },

        syncControls
    };
})(window.DD);
