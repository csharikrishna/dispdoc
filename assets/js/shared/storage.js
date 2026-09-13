/**
 * PanelProbe — Safe localStorage wrapper.
 * Storage can throw (private mode, disabled cookies, sandboxed iframes);
 * every read/write here degrades to an in-memory no-op instead.
 */
(function (DD) {
    'use strict';

    const PREFIX = 'panelprobe_';
    const memory = new Map();

    function get(key, fallback = null) {
        try {
            const value = window.localStorage.getItem(PREFIX + key);
            return value === null ? fallback : value;
        } catch (_) {
            return memory.has(key) ? memory.get(key) : fallback;
        }
    }

    function set(key, value) {
        const str = String(value);
        memory.set(key, str);
        try {
            window.localStorage.setItem(PREFIX + key, str);
        } catch (_) {
            /* in-memory only */
        }
    }

    DD.Storage = {
        get,
        set,
        getBool: (key, fallback = false) => {
            const v = get(key);
            return v === null ? fallback : v === 'true';
        }
    };
})(window.DD = window.DD || {});
