/**
 * PanelProbe — Guided wizard: walks through key tests and records
 * the user's pass / issue / skip answers for the report.
 */
(function (DD) {
    'use strict';

    /**
     * Each step references a test id; `preset` applies HUD settings first.
     * `advice` is shown in the report when the user flags an issue.
     */
    const STEPS = [
        { test: 'oled-black', title: 'Black Uniformity & Bleed',
            prompt: 'In a dim room, look at the edges and center. Do you see light bleed, glowing corners, or bright stuck pixels?',
            advice: 'Edge bleed or glow: on IPS panels, lower brightness and check whether the glow moves with viewing angle (glow) or stays put (bleed). On OLED, run the panel’s pixel refresh cycle.' },
        { test: 'near-black', title: 'Near-Black Banding (5%)', preset: { ireLevel: 5 },
            prompt: 'Look across the dark gray field. Are there vertical bands, blotches (mura), or flickering?',
            advice: 'Near-black non-uniformity: some OLED banding improves after a pixel refresh. Disable dynamic tone mapping or black stabilizer features and re-check.' },
        { test: 'phone-burnin', title: 'Status Bar & Notch Burn-In',
            prompt: 'Check the outlined zone. Can you see ghosted clock, battery, or navigation silhouettes?',
            advice: 'UI burn-in: enable auto-hiding status and navigation bars, use dark mode, and shorten the screen timeout to slow further retention.' },
        { test: 'burnin', title: 'Dead Pixels & Solid Colors',
            prompt: 'Click or tap to cycle through every color. Any dead or stuck subpixels, or retained logos?',
            advice: 'Dead or stuck pixels: position the Stuck Pixel Reviver (key 4) over the pixel for 10–30 minutes. Pixels that stay dark are usually dead and may qualify for a warranty return.' },
        { test: 'ufo-motion', title: 'Motion Clarity',
            prompt: 'Follow the moving UFO with your eyes. Is it reasonably crisp, without bright halos or long dark trails?',
            advice: 'Motion artifacts: bright halos indicate excessive overdrive — try a lower overdrive setting. Long dark trails on the near-black lane indicate slow dark transitions (common on VA panels).' },
        { test: 'grayscale', title: 'Grayscale Steps',
            prompt: 'Can you tell every one of the 32 gray steps apart from its neighbors?',
            advice: 'Merged gray steps: reset picture mode to a standard/sRGB preset and disable contrast enhancement or dynamic contrast.' },
        { test: 'black-clipping', title: 'Shadow Detail',
            prompt: 'Are patches 1–3 faintly distinguishable from the black background?',
            advice: 'Crushed shadows: raise brightness (black level) a few steps, or check that GPU output range matches the display (Full vs Limited RGB).' },
        { test: 'white-clipping', title: 'Highlight Detail',
            prompt: 'Are patches 252–254 faintly distinguishable from the white background?',
            advice: 'Clipped highlights: lower the contrast setting until patches 252–254 reappear, and disable sharpness or dynamic contrast enhancement.' },
        { test: 'color-banding', title: 'Gradient Smoothness',
            prompt: 'Do the red, green, blue, and gray ramps look smooth, without hard visible steps?',
            advice: 'Visible banding: disable color-processing “enhancement” modes, avoid reduced color depth (e.g. 6-bit or compressed output), and check the GPU dithering setting.' }
    ];

    const $ = (id) => document.getElementById(id);
    let index = 0;
    let active = false;
    let app = null;
    const findings = {};

    function render() {
        const step = STEPS[index];
        if (!step) {
            finish();
            return;
        }
        $('wizardProgressFill').style.width = `${Math.round(((index + 1) / STEPS.length) * 100)}%`;
        $('wizardStepText').textContent = `Step ${index + 1} of ${STEPS.length}`;
        $('wizardTitle').textContent = step.title;
        $('wizardPrompt').textContent = step.prompt;
        if (step.preset) Object.assign(app.settings, step.preset);
        app.start(step.test, { hud: false });
    }

    function answer(result) {
        findings[STEPS[index].title] = result;
        if (result === 'skip') DD.Audio.hover(); else DD.Audio.click();
        index++;
        render();
    }

    function finish() {
        active = false;
        $('wizardBanner').hidden = true;
        app.stop();
        DD.Audio.success();
        DD.Report.show();
    }

    DD.Wizard = {
        STEPS,
        findings,

        init(appRef) {
            app = appRef;
            $('wizNoIssuesBtn').addEventListener('click', () => answer('pass'));
            $('wizHasIssueBtn').addEventListener('click', () => answer('issue'));
            $('wizSkipBtn').addEventListener('click', () => answer('skip'));
            $('wizExitBtn').addEventListener('click', () => DD.Wizard.exit());
        },

        start() {
            Object.keys(findings).forEach((k) => delete findings[k]);
            index = 0;
            active = true;
            $('wizardBanner').hidden = false;
            DD.Audio.success();
            render();
            $('wizNoIssuesBtn').focus();
        },

        exit() {
            if (!active) return;
            active = false;
            $('wizardBanner').hidden = true;
            app.stop();
        },

        isActive: () => active
    };
})(window.DD);
