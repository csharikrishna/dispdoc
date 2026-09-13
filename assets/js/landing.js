/**
 * PanelProbe — Landing page bootstrap.
 * Theme toggle and browser-reported display info; everything else is static.
 */
(function (DD) {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {
        DD.Theme.init();
        DD.DisplayInfo.watch();
    });
})(window.DD);
