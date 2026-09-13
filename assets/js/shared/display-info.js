/**
 * DisplayDoctor Pro — Browser-reported display characteristics.
 *
 * Browsers expose only coarse information: screen size in CSS pixels, the
 * device pixel ratio, colorDepth, and a few media queries. Everything here is
 * what the browser *reports*, not a hardware measurement, and the UI labels it
 * accordingly.
 *
 * Markup contract: any element with data-display="resolution|depth|gamut|scaling"
 * is filled in by DD.DisplayInfo.render().
 */
(function (DD) {
    'use strict';

    function mq(query) {
        return !!(window.matchMedia && window.matchMedia(query).matches);
    }

    function read() {
        const dpr = window.devicePixelRatio || 1;
        const cssW = window.screen.width || window.innerWidth;
        const cssH = window.screen.height || window.innerHeight;
        const colorDepth = window.screen.colorDepth || 24;

        let bitsPerChannel = 8;
        if (colorDepth >= 36) bitsPerChannel = 12;
        else if (colorDepth >= 30) bitsPerChannel = 10;
        else if (colorDepth <= 18) bitsPerChannel = 6;

        let gamut = 'sRGB';
        if (mq('(color-gamut: rec2020)')) gamut = 'Rec. 2020';
        else if (mq('(color-gamut: p3)')) gamut = 'Display P3';

        const hdr = mq('(dynamic-range: high)');

        return {
            physicalWidth: Math.round(cssW * dpr),
            physicalHeight: Math.round(cssH * dpr),
            dpr,
            colorDepth,
            bitsPerChannel,
            gamut,
            hdr
        };
    }

    function format(info = read()) {
        return {
            resolution: `${info.physicalWidth}×${info.physicalHeight}`,
            depth: `${info.bitsPerChannel}-bit${info.hdr ? ' · HDR' : ''}`,
            gamut: info.gamut,
            scaling: `${info.dpr.toFixed(2)}× (${Math.round(info.dpr * 100)}%)`
        };
    }

    function render(root = document) {
        const text = format();
        root.querySelectorAll('[data-display]').forEach((el) => {
            const value = text[el.getAttribute('data-display')];
            if (value !== undefined) el.textContent = value;
        });
    }

    function watch(onChange) {
        let timer = null;
        const handler = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                render();
                if (onChange) onChange();
            }, 250);
        };
        window.addEventListener('resize', handler);
        render();
    }

    DD.DisplayInfo = { read, format, render, watch };
})(window.DD = window.DD || {});
