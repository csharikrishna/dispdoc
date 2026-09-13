/**
 * PanelProbe — Photosensitivity advisory with a two-step fullscreen gate.
 *
 * Step 1 requests fullscreen. Step 2 ("Enter Studio") unlocks only after a real
 * fullscreenchange event confirms fullscreen is active — never on a rejected
 * request. Users can also continue in a window.
 */
(function (DD) {
    'use strict';

    const $ = (id) => document.getElementById(id);
    let modal = null;
    let lastFocus = null;

    function setStep1(state) {
        const btn = $('modalFullscreenBtn');
        const text = $('modalFsBtnText');
        const badge = $('modalFsBadge');
        const hint = $('modalFsHint');
        const accept = $('acceptWarningBtn');

        const states = {
            idle: ['1. Enter Fullscreen', 'Required', '', 'Fullscreen hides browser UI so patterns fill the entire panel.', ''],
            pending: ['Requesting Fullscreen…', 'Pending', 'badge-warning', 'Approve the browser prompt if one appears.', ''],
            blocked: ['1. Enter Fullscreen', 'Blocked', 'badge-warning', 'Your browser blocked fullscreen. Press F11 (or use the browser menu), and Step 2 unlocks automatically.', 'hint-warn'],
            active: ['✓ Fullscreen Active', 'Verified', 'badge-success', 'Fullscreen confirmed. You can enter the studio.', 'hint-success']
        };
        const [label, badgeText, badgeClass, hintText, hintClass] = states[state];

        btn.classList.toggle('is-verified', state === 'active');
        text.textContent = label;
        badge.textContent = badgeText;
        badge.className = `gate-badge ${badgeClass}`.trim();
        hint.textContent = hintText;
        hint.className = `modal-fs-hint ${hintClass}`.trim();
        accept.disabled = state !== 'active';
    }

    const SESSION_KEY = 'panelprobe_warning_session';

    function acknowledgedThisSession() {
        try {
            return window.sessionStorage.getItem(SESSION_KEY) === 'true';
        } catch (_) {
            return false;
        }
    }

    function close(message) {
        DD.Storage.set('warning_accepted', 'true');
        try {
            window.sessionStorage.setItem(SESSION_KEY, 'true');
        } catch (_) {
            /* show again next load */
        }
        modal.hidden = true;
        document.body.classList.remove('modal-open');
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
        DD.Audio.click();
        if (message) DD.toast(message, 2600);
    }

    function trapFocus(e) {
        if (modal.hidden || e.key !== 'Tab') return;
        const focusable = Array.from(modal.querySelectorAll('button:not([disabled])'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    DD.SafetyGate = {
        init() {
            modal = $('warningModal');
            if (!modal) return;

            $('modalFullscreenBtn').addEventListener('click', () => {
                DD.Audio.click();
                if (DD.Fullscreen.isNative()) {
                    setStep1('active');
                    return;
                }
                setStep1('pending');
                DD.Fullscreen.request({ allowFallback: false }).catch(() => setStep1('blocked'));
            });

            $('acceptWarningBtn').addEventListener('click', () => close('Studio ready — fullscreen active'));
            $('btnProceedWindowed').addEventListener('click', () => close('Studio ready — windowed mode (press F for fullscreen)'));

            DD.Fullscreen.onChange((state) => {
                if (!modal.hidden) setStep1(state.native ? 'active' : 'idle');
                if (state.native && !modal.hidden) $('acceptWarningBtn').focus();
            });

            document.addEventListener('keydown', trapFocus);

            // Shown once per browser session: every new visit, but not on reloads.
            if (!acknowledgedThisSession()) DD.SafetyGate.open();
        },

        open() {
            lastFocus = document.activeElement;
            setStep1(DD.Fullscreen.isNative() ? 'active' : 'idle');
            modal.hidden = false;
            document.body.classList.add('modal-open');
            $('modalFullscreenBtn').focus();
        },

        isOpen: () => !!modal && !modal.hidden
    };
})(window.DD);
