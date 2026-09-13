/**
 * PanelProbe — Light / dark theme controller (shared by all pages).
 *
 * Markup contract:
 *   <button data-theme-toggle>            toggles the theme on click
 *     <span data-theme-icon></span>       receives a sun/moon icon
 *     <span data-theme-label></span>      receives "Light"/"Dark" (optional)
 *   </button>
 */
(function (DD) {
    'use strict';

    const STORAGE_KEY = 'theme';
    const listeners = [];

    function systemPreference() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    function current() {
        return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    }

    function apply(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const next = theme === 'dark' ? 'light' : 'dark';
        document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
            btn.setAttribute('aria-label', `Switch to ${next} theme`);
            btn.title = `Switch to ${next} theme`;
            const icon = btn.querySelector('[data-theme-icon]');
            if (icon) icon.innerHTML = DD.icon(theme === 'dark' ? 'sun' : 'moon', 15);
            const label = btn.querySelector('[data-theme-label]');
            if (label) label.textContent = next === 'light' ? 'Light' : 'Dark';
        });
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#08090d' : '#f8fafc');
    }

    function toggle() {
        const next = current() === 'dark' ? 'light' : 'dark';
        DD.Storage.set(STORAGE_KEY, next);
        apply(next);
        listeners.forEach((fn) => fn(next));
    }

    function init() {
        const saved = DD.Storage.get(STORAGE_KEY);
        apply(saved === 'light' || saved === 'dark' ? saved : systemPreference());
        document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
            btn.addEventListener('click', toggle);
        });
    }

    DD.Theme = {
        init,
        toggle,
        current,
        onChange: (fn) => listeners.push(fn)
    };
})(window.DD = window.DD || {});
