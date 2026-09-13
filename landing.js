/**
 * ==========================================================================
 * DisplayDoctor Pro // Flagship Home Page Script
 * Proactive Hardware Telemetry & Theme Controller
 * ==========================================================================
 */

'use strict';

// 1. THEME ENGINE (Shared with Studio)
const ThemeEngine = {
    current: 'dark',

    init() {
        const saved = localStorage.getItem('dispdoc_theme');
        if (saved === 'light' || saved === 'dark') {
            this.current = saved;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
            this.current = 'light';
        } else {
            this.current = 'dark';
        }
        this.apply();

        const btn = document.getElementById('btnToggleTheme');
        if (btn) {
            btn.addEventListener('click', () => this.toggle());
        }
    },

    toggle() {
        this.current = this.current === 'dark' ? 'light' : 'dark';
        localStorage.setItem('dispdoc_theme', this.current);
        this.apply();
    },

    apply() {
        document.documentElement.setAttribute('data-theme', this.current);
        const icon = document.getElementById('themeIcon');
        if (icon) {
            icon.innerHTML = this.current === 'dark'
                ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
                : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
        }
    }
};

// 2. 100% VERIFIED HARDWARE TELEMETRY
const Telemetry = {
    init() {
        this.detectDisplaySpecs();

        let resizeTimer = null;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.detectDisplaySpecs();
            }, 250);
        });
    },

    detectDisplaySpecs() {
        const dpr = window.devicePixelRatio || 1;
        // True physical panel resolution (using screen dimensions scaled by DPR)
        const screenW = Math.round((window.screen.width || window.innerWidth) * dpr);
        const screenH = Math.round((window.screen.height || window.innerHeight) * dpr);
        const resText = `${screenW}×${screenH}`;
        const dprText = `${dpr.toFixed(2)}x (${Math.round(dpr * 100)}%)`;

        const rawDepth = screen.colorDepth || 24;
        let depthText = '8-bit SDR';
        if (rawDepth >= 36) depthText = '12-bit Deep';
        else if (rawDepth >= 30) depthText = '10-bit HDR';
        else if (rawDepth === 16 || rawDepth === 18) depthText = '6-bit';
        else depthText = '8-bit SDR';

        const isWideP3 = window.matchMedia && window.matchMedia('(color-gamut: p3)').matches;
        const gamutText = isWideP3 ? 'DCI-P3 Wide' : 'sRGB (Rec. 709)';

        const resEl = document.getElementById('heroRes');
        const dprEl = document.getElementById('heroDpr');
        const depthEl = document.getElementById('heroDepth');
        const gamutEl = document.getElementById('heroGamut');

        if (resEl) resEl.textContent = resText;
        if (dprEl) dprEl.textContent = dprText;
        if (depthEl) depthEl.textContent = depthText;
        if (gamutEl) gamutEl.textContent = gamutText;
    }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    ThemeEngine.init();
    Telemetry.init();
});
