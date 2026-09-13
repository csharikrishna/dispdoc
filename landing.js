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

// 2. LIVE HARDWARE TELEMETRY SAMPLER
const Telemetry = {
    refreshRate: 0,
    refreshDetected: false,
    detectingRafId: null,

    init() {
        this.detectDisplaySpecs();
        this.startRefreshRateDetection();

        let resizeTimer = null;
        window.addEventListener('resize', () => {
            this.detectDisplaySpecs();
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.refreshDetected = false;
                this.startRefreshRateDetection();
            }, 350);
        });
    },

    startRefreshRateDetection() {
        if (this.detectingRafId) {
            cancelAnimationFrame(this.detectingRafId);
            this.detectingRafId = null;
        }

        const refreshEl = document.getElementById('heroRefresh');
        if (refreshEl && !this.refreshDetected) {
            refreshEl.textContent = 'Detecting...';
        }

        let frames = 0;
        const startTime = performance.now();
        let lastTime = startTime;
        const intervals = [];

        const sample = (now) => {
            frames++;
            const delta = now - lastTime;
            lastTime = now;

            if (frames > 1 && delta > 2 && delta < 100) {
                intervals.push(delta);
            }

            const elapsed = now - startTime;

            if (elapsed >= 500 && intervals.length >= 25) {
                intervals.sort((a, b) => a - b);
                const trim = Math.max(1, Math.floor(intervals.length * 0.1));
                const clean = intervals.slice(trim, intervals.length - trim);
                const avgInterval = clean.reduce((a, b) => a + b, 0) / clean.length;
                const rawHz = 1000 / avgInterval;

                const standardHz = [50, 60, 72, 75, 85, 90, 100, 120, 144, 165, 170, 175, 180, 200, 240, 280, 300, 360, 480, 500, 540];
                let detected = Math.round(rawHz);
                for (const std of standardHz) {
                    if (Math.abs(rawHz - std) <= 2.2) {
                        detected = std;
                        break;
                    }
                }

                this.refreshRate = detected;
                this.refreshDetected = true;
                this.detectingRafId = null;

                if (refreshEl) {
                    refreshEl.textContent = `${detected} Hz`;
                }
                return;
            }

            if (elapsed >= 2500) {
                const fallbackHz = intervals.length > 5 
                    ? Math.round(1000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length))
                    : 60;
                this.refreshRate = fallbackHz;
                this.refreshDetected = true;
                this.detectingRafId = null;
                if (refreshEl) refreshEl.textContent = `${fallbackHz} Hz`;
                return;
            }

            this.detectingRafId = requestAnimationFrame(sample);
        };

        this.detectingRafId = requestAnimationFrame(sample);
    },

    detectDisplaySpecs() {
        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;
        const resText = `${Math.round(width * dpr)}×${Math.round(height * dpr)}`;
        const dprText = `${dpr.toFixed(2)}x`;

        const rawDepth = screen.colorDepth || 24;
        let bpc = 8;
        if (rawDepth >= 36) bpc = 12;
        else if (rawDepth >= 30) bpc = 10;
        else if (rawDepth === 16 || rawDepth === 18) bpc = 6;
        else bpc = 8;

        const isHDR = window.matchMedia && window.matchMedia('(dynamic-range: high)').matches;
        const depthText = isHDR && bpc < 10 ? `${bpc}-bit HDR (${rawDepth}b)` : `${bpc}-bit (${rawDepth}b)`;
        const depthTitle = `${bpc} bits per channel (RGB) • ${rawDepth}-bit total (${Math.pow(2, rawDepth > 24 ? 30 : 24).toLocaleString()} colors)`;

        const resEl = document.getElementById('heroRes');
        const dprEl = document.getElementById('heroDpr');
        const depthEl = document.getElementById('heroDepth');

        if (resEl) resEl.textContent = resText;
        if (dprEl) dprEl.textContent = dprText;
        if (depthEl) {
            depthEl.textContent = depthText;
            depthEl.title = depthTitle;
        }
    }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    ThemeEngine.init();
    Telemetry.init();
});
