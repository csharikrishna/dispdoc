/**
 * ==========================================================================
 * DisplayDoctor Pro // Flagship Home Page & Studio Transition Controller
 * Seamless SPA Fullscreen Engine, Verified Telemetry & Dual-Theme System
 * ==========================================================================
 */

'use strict';

(() => {
    // 1. THEME CONTROLLER FOR LANDING PAGE
    const LandingTheme = {
        init() {
            const saved = localStorage.getItem('dispdoc_theme');
            const current = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
            this.apply(current);

            const btn = document.getElementById('btnToggleThemeLanding');
            if (btn) {
                btn.addEventListener('click', () => {
                    const active = document.documentElement.getAttribute('data-theme') || 'dark';
                    const next = active === 'dark' ? 'light' : 'dark';
                    this.apply(next);
                    localStorage.setItem('dispdoc_theme', next);
                });
            }
        },

        apply(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            const icon = document.getElementById('themeIconLanding');
            if (icon) {
                icon.innerHTML = theme === 'dark'
                    ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
                    : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
            }
        }
    };

    // 2. VERIFIED HARDWARE TELEMETRY SAMPLER
    const LandingTelemetry = {
        init() {
            this.sample();
            let timer = null;
            window.addEventListener('resize', () => {
                clearTimeout(timer);
                timer = setTimeout(() => this.sample(), 250);
            });
        },

        sample() {
            const dpr = window.devicePixelRatio || 1;
            // Exact physical hardware display resolution
            const screenW = Math.round((window.screen.width || window.innerWidth) * dpr);
            const screenH = Math.round((window.screen.height || window.innerHeight) * dpr);
            const resText = `${screenW}×${screenH}`;
            const dprText = `${dpr.toFixed(2)}x (${Math.round(dpr * 100)}%)`;

            // Formatted to match OS display settings & monitor manufacturer ratings
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

    // 3. SEAMLESS FULLSCREEN STUDIO CONTROLLER
    const StudioTransition = {
        getPaths() {
            const p = window.location.pathname;
            // Cleanly normalize base path to prevent any /studio/studio/ stacking
            let base = p.replace(/\/index\.html$/i, '').replace(/\/studio(\/studio)*\/?$/i, '').replace(/\/+$/, '');
            const root = base ? base + '/' : '/';
            return {
                root: root,
                studio: root + 'studio/'
            };
        },

        init() {
            this.bindTriggers();
            this.handleNavigationState();
        },

        enterStudioFullscreen(targetTestIndex = null) {
            // STEP 1: Execute requestFullscreen SYNCHRONOUSLY within the user click gesture
            const docEl = document.documentElement;
            const req = docEl.requestFullscreen || 
                        docEl.webkitRequestFullscreen || 
                        docEl.webkitRequestFullScreen || 
                        docEl.mozRequestFullScreen || 
                        docEl.msRequestFullscreen;
            if (req) {
                try {
                    const res = req.call(docEl);
                    if (res && typeof res.catch === 'function') res.catch(() => {});
                } catch (e) {}
            }

            // STEP 2: Smooth View Transition
            const landingView = document.getElementById('landingView');
            const studioView = document.getElementById('studioView');
            if (landingView) landingView.style.display = 'none';
            if (studioView) {
                studioView.style.display = 'block';
                // Trigger canvas resize
                if (window.App && typeof window.App.resizeCanvas === 'function') {
                    window.App.resizeCanvas();
                }
            }

            // STEP 3: Update browser URL with canonical studio path
            try {
                window.history.pushState({ view: 'studio' }, '', this.getPaths().studio);
            } catch (e) {}

            // STEP 4: Audio Chime & Warning Status Check
            if (window.AudioEngine && typeof window.AudioEngine.playClick === 'function') {
                window.AudioEngine.playClick();
            }

            // If user already acknowledged safety advisory, hide modal so studio is immediately accessible
            const modal = document.getElementById('warningModal');
            if (modal && localStorage.getItem('dispdoc_warning_accepted') === 'true') {
                modal.style.display = 'none';
            }

            // STEP 5: If a specific test index was requested (e.g. from capability cards or checklist)
            if (typeof targetTestIndex === 'number' && window.App && typeof window.App.startTest === 'function') {
                window.App.startTest(targetTestIndex);
            }
        },

        returnToOverview() {
            // Exit fullscreen if active
            if (document.fullscreenElement) {
                try {
                    const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
                    if (exit) exit.call(document).catch(() => {});
                } catch (e) {}
            }

            // Stop any active diagnostic test
            if (window.App && window.App.activeTest !== null && typeof window.App.stopTest === 'function') {
                window.App.stopTest();
            }

            // Switch back to landing view
            const landingView = document.getElementById('landingView');
            const studioView = document.getElementById('studioView');
            if (studioView) studioView.style.display = 'none';
            if (landingView) landingView.style.display = 'block';

            // Update browser URL with canonical root path
            try {
                window.history.pushState({ view: 'landing' }, '', this.getPaths().root);
            } catch (e) {}

            window.scrollTo(0, 0);
        },

        bindTriggers() {
            // Hero launch CTA
            const heroBtn = document.getElementById('btnLaunchHero');
            if (heroBtn) {
                heroBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.enterStudioFullscreen();
                });
            }

            // Nav launch CTA
            const navBtn = document.getElementById('btnLaunchNav');
            if (navBtn) {
                navBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.enterStudioFullscreen();
                });
            }

            // Checklist 4-step acceptance button
            const checklistBtn = document.querySelector('.btn-checklist-launch');
            if (checklistBtn) {
                checklistBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.enterStudioFullscreen(1); // Launch Test 1: 0-Nit True Black
                });
            }

            // Capabilities card launch buttons
            const cardBtns = document.querySelectorAll('.card-action-btn');
            cardBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const testAttr = btn.getAttribute('data-test');
                    const testIdx = testAttr ? parseInt(testAttr, 10) : null;
                    this.enterStudioFullscreen(testIdx);
                });
            });

            // Footer launch link
            const footerLinks = document.querySelectorAll('.footer-link');
            footerLinks.forEach(link => {
                if (link.getAttribute('href') === './studio/') {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.enterStudioFullscreen();
                    });
                }
            });

            // Studio back link to Overview
            const backBtn = document.getElementById('btnStudioBackToOverview');
            if (backBtn) {
                backBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.returnToOverview();
                });
            }

            // Listen for popstate (Browser Back/Forward)
            window.addEventListener('popstate', (e) => {
                if (e.state && e.state.view === 'studio') {
                    const landingView = document.getElementById('landingView');
                    const studioView = document.getElementById('studioView');
                    if (landingView) landingView.style.display = 'none';
                    if (studioView) studioView.style.display = 'block';
                } else {
                    const landingView = document.getElementById('landingView');
                    const studioView = document.getElementById('studioView');
                    if (studioView) studioView.style.display = 'none';
                    if (landingView) landingView.style.display = 'block';
                    if (window.App && window.App.activeTest !== null && typeof window.App.stopTest === 'function') {
                        window.App.stopTest();
                    }
                }
            });
        },

        handleNavigationState() {
            // If page loaded with hash #studio or query param
            if (window.location.hash === '#studio' || window.location.search.includes('studio')) {
                const landingView = document.getElementById('landingView');
                const studioView = document.getElementById('studioView');
                if (landingView) landingView.style.display = 'none';
                if (studioView) studioView.style.display = 'block';
            }
        }
    };

    // Initialize on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', () => {
        LandingTheme.init();
        LandingTelemetry.init();
        StudioTransition.init();
    });
})();
