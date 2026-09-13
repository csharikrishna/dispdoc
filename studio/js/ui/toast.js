/**
 * PanelProbe — Transient status toast (announced to screen readers).
 */
(function (DD) {
    'use strict';

    let timer = null;

    DD.toast = function toast(message, duration = 2200) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = message;
        el.hidden = false;
        clearTimeout(timer);
        timer = setTimeout(() => {
            el.hidden = true;
        }, duration);
    };
})(window.DD);
