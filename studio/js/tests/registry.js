/**
 * PanelProbe — Test registry (single source of truth).
 *
 * Everything user-facing about a test — its card, hotkey, category, order in
 * "Test All", and HUD controls — is derived from this list. To add a test:
 *   1. Add an entry here.
 *   2. Register a renderer with the same id via DD.definePattern() in
 *      studio/js/tests/patterns-*.js.
 *   `npm run check` verifies ids, hotkeys and renderers stay in sync.
 *
 * Fields:
 *   id        unique renderer id
 *   key       single-character hotkey (must not clash with RESERVED_KEYS)
 *   category  one of CATEGORIES[].id
 *   icon      name from assets/js/shared/icons.js
 *   title     card + HUD title
 *   desc      one-sentence card description
 *   meta      short monospace caption on the card footer
 *   suite     included in the automated "Test All" run
 *   controls  id of the HUD control group to show (see studio/index.html)
 *   autoStop  seconds before the test stops itself (photosensitivity guard)
 */
(function (DD) {
    'use strict';

    DD.CATEGORIES = [
        { id: 'oled', label: 'OLED', kicker: 'OLED & Uniformity', heading: 'Pixel & Uniformity Diagnostics', accent: 'cyan' },
        { id: 'motion', label: 'Motion & IPS', kicker: 'IPS & High Refresh', heading: 'Response Time, Bleed & Sharpness', accent: 'purple' },
        { id: 'mobile', label: 'Touch & Mobile', kicker: 'Touch & Digitizer', heading: 'Mobile & Touch Screen Checks', accent: 'purple' },
        { id: 'color', label: 'Color & Gamma', kicker: 'Gamma & Color', heading: 'Luminance & Dynamic Range Calibration', accent: 'emerald' },
        { id: 'stress', label: 'Stress', kicker: 'Stress Benchmarks', heading: 'GPU & Panel Stress Patterns', accent: 'rose' }
    ];

    /** Keys used by global studio shortcuts; tests may not use these. */
    DD.RESERVED_KEYS = ['f', 'h', 's', 'm', ' '];

    DD.TESTS = [
        // OLED & uniformity
        { id: 'oled-black', key: '1', category: 'oled', icon: 'grid', suite: true,
            title: '0-Nit True Black', meta: 'RGB 0,0,0 • Pixel Shutoff',
            desc: 'Full-screen pure black to check OLED pixel shutoff, controller glow, and bright stuck pixels.' },
        { id: 'near-black', key: '2', category: 'oled', icon: 'bars', suite: true, controls: 'nearBlackControls',
            title: 'Near-Black Uniformity', meta: '0%–20% Gray Steps',
            desc: 'Uniform dark gray fields to expose vertical banding, dirty screen effect, and mura.' },
        { id: 'burnin', key: '3', category: 'oled', icon: 'target', suite: true,
            title: 'Dead Pixel & Burn-In Field', meta: '8 Solid Colors • Click to Cycle',
            desc: 'Solid primary, secondary, white, and gray fields to find dead subpixels and retained images.' },
        { id: 'pixel-reviver', key: '4', category: 'oled', icon: 'crosshair', suite: true, controls: 'reviverControls',
            title: 'Stuck Pixel Reviver', meta: 'Per-Frame RGB Cycle',
            desc: 'A draggable box that cycles colors every frame to exercise stuck LCD subpixels.' },
        { id: 'subpixel', key: '5', category: 'oled', icon: 'zoom', suite: true, controls: 'subpixelControls',
            title: 'Subpixel & Text Fringing', meta: 'Text / RGB / BGR / Checker',
            desc: 'High-contrast text and single-pixel stripes to reveal color fringing on QD-OLED and WOLED layouts.' },
        { id: 'abl', key: '6', category: 'oled', icon: 'sun', suite: true, controls: 'ablControls',
            title: 'ABL Window Dimming', meta: '1%–100% White Window',
            desc: 'Centered white windows of increasing area to observe automatic brightness limiting.' },

        // Motion & IPS
        { id: 'ufo-motion', key: '7', category: 'motion', icon: 'bolt', suite: true, controls: 'motionControls',
            title: 'Motion Pursuit', meta: '120–1440 px/s • Native Refresh',
            desc: 'Moving targets on three backgrounds, rendered at your display’s refresh rate, to judge ghosting and overshoot.' },
        { id: 'backlight-bleed', key: '8', category: 'motion', icon: 'corner', suite: true,
            title: 'Backlight Bleed & Glow', meta: 'Near-Black • Corner Targets',
            desc: 'A near-black field with corner markers to separate fixed edge bleed from angle-dependent IPS glow.' },
        { id: 'viewing-angle', key: '9', category: 'motion', icon: 'cube', suite: true,
            title: 'Viewing Angle Shift', meta: '4 Color Quadrants',
            desc: 'Saturated color quadrants to compare hue, gamma, and contrast shift when viewed off-axis.' },
        { id: 'sharpness', key: '0', category: 'motion', icon: 'aperture', suite: true,
            title: 'Sharpness & Scaling', meta: '1px Lines • Native Mapping',
            desc: 'Single-pixel lines and targets to detect scaling blur, over-sharpening halos, and moiré.' },

        // Touch & mobile
        { id: 'phone-burnin', key: 'p', category: 'mobile', icon: 'phone', suite: true, controls: 'phoneControls',
            title: 'Status Bar & Notch Burn-In', meta: 'Mid-Gray • Zone Outlines',
            desc: 'A mid-gray field with status bar, notch, and home bar outlines to spot retained UI elements.' },
        { id: 'pwm-flicker', key: 'w', category: 'mobile', icon: 'pulse', suite: true,
            title: 'PWM Flicker Visualizer', meta: 'Scrolling Stripes • Camera Check',
            desc: 'Fast-scrolling stripes that make PWM dimming visible through a phone camera or eye sweep.' },
        { id: 'touch-grid', key: 't', category: 'mobile', icon: 'touch', suite: true,
            title: 'Touch Digitizer Grid', meta: '60-Zone Coverage Map',
            desc: 'Drag a finger or mouse across every cell to find dead touch zones.' },

        // Color & gamma
        { id: 'grayscale', key: 'g', category: 'color', icon: 'ramp', suite: true,
            title: '32-Step Grayscale', meta: '32 Discrete Steps',
            desc: 'Distinct gray steps from black to white to check that every step is separable.' },
        { id: 'gamma', key: 'c', category: 'color', icon: 'curve', suite: true,
            title: 'Gamma Calibration', meta: 'γ 1.8 / 2.0 / 2.2 / 2.4 / 2.6',
            desc: 'Solid patches against 1px line dither; the patch that blends in shows your effective gamma.' },
        { id: 'black-clipping', key: 'b', category: 'color', icon: 'shadow', suite: true,
            title: 'Black Level Clipping', meta: 'Levels 1–24',
            desc: 'Shadow patches from level 1 to 24 to tune brightness so dark detail is not crushed.' },
        { id: 'white-clipping', key: 'k', category: 'color', icon: 'highlight', suite: true,
            title: 'White Level Clipping', meta: 'Levels 231–254',
            desc: 'Highlight patches from level 254 down to 231 to tune contrast so bright detail is not clipped.' },
        { id: 'color-banding', key: 'd', category: 'color', icon: 'globe', suite: true,
            title: 'Gradient Banding', meta: 'R / G / B / Luma Ramps',
            desc: 'Smooth color and luminance ramps to reveal visible steps from low bit depth or processing.' },

        // Stress
        { id: 'tv-static', key: 'n', category: 'stress', icon: 'tv', suite: true,
            title: 'TV Static Noise', meta: 'XorShift32 • Every Frame',
            desc: 'Full-resolution black-and-white noise regenerated every frame.' },
        { id: 'rgb-noise', key: 'r', category: 'stress', icon: 'triangle', suite: true,
            title: 'RGB Chromatic Noise', meta: '24-bit Color Noise',
            desc: 'Full-resolution random color noise for GPU throughput and display link stress.' },
        { id: 'particles', key: 'x', category: 'stress', icon: 'particles', suite: true,
            title: 'Particle Storm', meta: 'Up to 1,250 Particles',
            desc: 'Hundreds of blended, color-shifting particles to load the canvas compositor.' },
        { id: 'matrix-rain', key: 'q', category: 'stress', icon: 'rain', suite: true,
            title: 'Matrix Digital Rain', meta: 'Glyph Trails',
            desc: 'Cascading glyph columns with fading trails.' },
        { id: 'gradient-storm', key: 'e', category: 'stress', icon: 'layers', suite: true,
            title: 'Gradient Storm', meta: 'Rotating Spectrum',
            desc: 'A continuously rotating tri-color gradient that accumulates into shifting color fields.' },
        { id: 'rainbow', key: 'u', category: 'stress', icon: 'cycle', suite: true, autoStop: 30,
            title: 'Rainbow Chaos', meta: 'Flashing • 30s Auto-Stop',
            desc: 'Rapid hue cycling with random color blocks. Contains flashing imagery.' },
        { id: 'strobe', key: 'z', category: 'stress', icon: 'bolt', suite: false, autoStop: 15,
            title: 'Black / White Strobe', meta: 'Flashing • 15s Auto-Stop',
            desc: 'Alternating black and white frames. Contains intense flashing; stops automatically.' },
        { id: 'autocycle', key: 'a', category: 'stress', icon: 'cycle', suite: false,
            title: 'Auto-Cycle Stress', meta: '6 Patterns • 8s Each',
            desc: 'Rotates through the six stress patterns above, eight seconds each, until stopped.' }
    ];

    /** Stress patterns rotated by the "autocycle" test. */
    DD.AUTOCYCLE_SEQUENCE = ['tv-static', 'rgb-noise', 'particles', 'matrix-rain', 'gradient-storm', 'rainbow'];

    const byId = new Map(DD.TESTS.map((t) => [t.id, t]));
    const byKey = new Map(DD.TESTS.map((t) => [t.key, t]));

    DD.getTest = (id) => byId.get(id) || null;
    DD.getTestByKey = (key) => byKey.get(String(key).toLowerCase()) || null;
    DD.suiteTests = () => DD.TESTS.filter((t) => t.suite);
})(window.DD = window.DD || {});
