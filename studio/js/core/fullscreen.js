/**
 * DisplayDoctor Pro — Fullscreen API wrapper.
 *
 * Wraps vendor-prefixed APIs and adds a "full viewport" fallback for contexts
 * where native fullscreen is unavailable or denied (iOS Safari on iPhone,
 * embedded webviews, iframes without allowfullscreen).
 *
 * Native requests only succeed inside a user gesture; callers must invoke
 * request() synchronously from a click/keydown handler.
 */
(function (DD) {
    'use strict';

    const FALLBACK_CLASS = 'is-fullscreen-fallback';
    const listeners = [];

    function isNative() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement);
    }

    function isFallback() {
        return document.body.classList.contains(FALLBACK_CLASS);
    }

    function isActive() {
        return isNative() || isFallback();
    }

    function emit() {
        const state = { active: isActive(), native: isNative(), fallback: isFallback() };
        listeners.forEach((fn) => fn(state));
    }

    function enableFallback() {
        if (isFallback()) return;
        document.body.classList.add(FALLBACK_CLASS);
        emit();
    }

    /**
     * Request fullscreen. Resolves to 'native', 'fallback' or 'already'.
     * @param {{ allowFallback?: boolean }} options
     */
    function request({ allowFallback = true } = {}) {
        if (isActive()) return Promise.resolve('already');

        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        const enabled = document.fullscreenEnabled !== false || document.webkitFullscreenEnabled;

        const fail = (err) => {
            if (allowFallback) {
                enableFallback();
                return 'fallback';
            }
            throw err || new Error('Fullscreen unavailable');
        };

        if (!req || !enabled) {
            try {
                return Promise.resolve(fail());
            } catch (err) {
                return Promise.reject(err);
            }
        }

        try {
            const result = req.call(el, { navigationUI: 'hide' });
            if (result && typeof result.then === 'function') {
                return result.then(() => 'native', fail);
            }
            return Promise.resolve('native');
        } catch (err) {
            try {
                return Promise.resolve(fail(err));
            } catch (e) {
                return Promise.reject(e);
            }
        }
    }

    function exit() {
        const hadFallback = isFallback();
        document.body.classList.remove(FALLBACK_CLASS);
        if (isNative()) {
            const fn = document.exitFullscreen || document.webkitExitFullscreen;
            try {
                const result = fn && fn.call(document);
                if (result && typeof result.catch === 'function') result.catch(() => {});
            } catch (_) {
                /* already exited */
            }
        } else if (hadFallback) {
            emit();
        }
    }

    function toggle() {
        if (isActive()) {
            exit();
            return Promise.resolve('exited');
        }
        return request();
    }

    document.addEventListener('fullscreenchange', emit);
    document.addEventListener('webkitfullscreenchange', emit);

    DD.Fullscreen = {
        isActive,
        isNative,
        isFallback,
        request,
        exit,
        toggle,
        onChange: (fn) => listeners.push(fn)
    };
})(window.DD = window.DD || {});
