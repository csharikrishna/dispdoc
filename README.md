<p align="center">
  <a href="https://csharikrishna.github.io/dispdoc/">
    <img src="assets/logo.svg" width="88" height="88" alt="DisplayDoctor Pro logo">
  </a>
</p>

<h1 align="center">DisplayDoctor Pro</h1>

<p align="center">
  Display test patterns and calibration aids for OLED, IPS, and mobile screens, running entirely in your browser.
</p>

<p align="center">
  <a href="https://csharikrishna.github.io/dispdoc/"><strong>Website</strong></a> ·
  <a href="https://csharikrishna.github.io/dispdoc/studio/"><strong>Open the Studio</strong></a> ·
  <a href="#test-catalog">Tests</a> ·
  <a href="#keyboard-shortcuts">Shortcuts</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <a href="https://github.com/csharikrishna/dispdoc/actions/workflows/ci.yml"><img src="https://github.com/csharikrishna/dispdoc/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <img src="https://img.shields.io/badge/runtime%20dependencies-0-brightgreen.svg" alt="Zero runtime dependencies">
</p>

---

## Why

Test videos are compressed. Codecs smear near-black detail and add banding and
blocking, which are exactly the artifacts you're trying to spot. DisplayDoctor
draws every pattern losslessly to a canvas mapped 1:1 to your device pixels.
There's nothing to install and nothing leaves your machine.

## Features

- **26 test patterns** in five categories, each with a one-key shortcut.
- **Test All** steps through the 24 non-strobe tests automatically — 10 seconds each, with pause and skip.
- **Guided Wizard** walks you through nine pass/issue checks. It produces a report you can print or save as PDF, or export as JSON, with advice for each issue.
- **True 1:1 pixel mapping.** The canvas backing store follows the device-pixel content box, so it stays exact even at fractional scaling (125%, 150%).
- **Refresh-rate detection** snaps to common panel rates (60–540 Hz). Motion tests render at the native rate.
- **Touch-friendly**: swipe between tests, drag the HUD, and use a 60-cell touch digitizer grid.
- **Private by design**: no analytics, no cookies, no third-party requests. Fonts are self-hosted.
- **Accessible**: keyboard operable, visible focus, screen-reader labels, a light/dark theme, and `prefers-reduced-motion` support.

> [!WARNING]
> Some stress tests contain **flashing images** that can trigger seizures in people with photosensitive epilepsy.
> The studio shows a warning on every visit. Flashing tests stop automatically, and the strobe is never included in Test All.

## Test catalog

| Key | Test | What to look for |
|:---:|------|------------------|
| **OLED & Uniformity** |||
| `1` | 0-Nit True Black | Glow, bright stuck pixels, OLED pixel shutoff |
| `2` | Near-Black Uniformity | Vertical banding, dirty screen effect, mura at 0–20% gray |
| `3` | Dead Pixel & Burn-In Field | Dead subpixels and retained images across 8 solid colors |
| `4` | Stuck Pixel Reviver | Draggable color-cycling box for stuck LCD subpixels |
| `5` | Subpixel & Text Fringing | Color fringing on text, RGB/BGR stripes, 1px checkerboard |
| `6` | ABL Window Dimming | Brightness limiting with 1%–100% white windows |
| **Motion & IPS** |||
| `7` | Motion Pursuit | Ghosting, overdrive halos, and dark smear at 120–1440 px/s |
| `8` | Backlight Bleed & Glow | Fixed edge bleed compared with angle-dependent IPS glow |
| `9` | Viewing Angle Shift | Hue and gamma shift off-axis |
| `0` | Sharpness & Scaling | Blur, halos, and moiré on 1px gratings |
| **Touch & Mobile** |||
| `P` | Status Bar & Notch Burn-In | Retained status bar, notch, and home indicator |
| `W` | PWM Flicker Visualizer | PWM dimming, visible through a phone camera |
| `T` | Touch Digitizer Grid | Dead touch zones |
| **Color & Gamma** |||
| `G` | 32-Step Grayscale | Merged or crushed gray steps |
| `C` | Gamma Calibration | Effective gamma, from γ 1.8 to 2.6 |
| `B` | Black Level Clipping | Shadow detail at levels 1–24 |
| `K` | White Level Clipping | Highlight detail at levels 231–254 |
| `D` | Gradient Banding | Visible steps in R/G/B/luma ramps |
| **Stress** |||
| `N` | TV Static Noise | Full-resolution noise every frame |
| `R` | RGB Chromatic Noise | Full-resolution color noise |
| `X` | Particle Storm | Compositor load |
| `Q` | Matrix Digital Rain | Glyph trails |
| `E` | Gradient Storm | Rotating accumulated gradients |
| `U` | Rainbow Chaos ⚠️ | Flashing; stops after 30 s |
| `Z` | Black / White Strobe ⚠️ | Flashing; stops after 15 s; not in Test All |
| `A` | Auto-Cycle Stress | Rotates the six stress patterns above |

## Keyboard shortcuts

| Key | Action |
|:---:|--------|
| `Space` | Pause / resume |
| `←` `→` | Previous / next test |
| `H` | Pin the test controls (they otherwise appear when you move the pointer to them) |
| `F` | Toggle fullscreen |
| `S` | Performance panel (FPS, frame times, late frames) |
| `M` | Mute sound effects |
| `Esc` | Exit the current test |

On touch screens, swipe left or right to change tests and tap to show or hide the controls. With a mouse, the controls stay out of the way until you move the pointer to the bottom of the screen.

## Running locally

No build step is needed. Any static file server works:

```bash
git clone https://github.com/csharikrishna/dispdoc.git
cd dispdoc
npm install      # dev tools only: lint, checks, smoke test
npm start        # http://localhost:8080/dispdoc/
```

Without Node, any static server works, for example `python -m http.server 8000`, then open `http://localhost:8000/`.

> [!NOTE]
> Use a local server rather than double-clicking the files. Over `file://`, links such as `studio/` open a folder listing instead of the page, and browsers block the web fonts.

### Checks

```bash
npm run lint     # ESLint
npm run check    # registry, catalog, ids, and asset links stay in sync
npm test         # headless Chrome smoke test (set CHROME_PATH if Chrome isn't found)
npm run verify   # all of the above; this is what CI runs
```

## Project structure

```
index.html              Landing page
studio/                 Diagnostic studio
  js/tests/registry.js  Single source of truth for all tests
  js/tests/patterns-*.js  Pattern renderers
  js/core/ js/ui/       Audio, fullscreen, telemetry; HUD, wizard, report…
  js/app.js             Controller
assets/                 Shared CSS/JS, fonts, logo
scripts/                Dev server, static checks, smoke test
docs/                   Architecture and design decisions
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together and a step-by-step guide to adding a new test.

## Browser support

Current versions of Chrome, Edge, Firefox, and Safari (desktop and mobile). iPhone Safari doesn't support the Fullscreen API for pages; the studio falls back to a full-viewport mode there.

A browser can only report what the operating system exposes: resolution, scaling, a coarse color depth, and wide-gamut/HDR flags. DisplayDoctor labels these values as *reported*. The patterns are visual aids for your own judgment, not a substitute for a colorimeter.

## Contributing

Bug reports, test ideas, and pull requests are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2026 CS Hari Krishna.
Bundled fonts, Inter and JetBrains Mono, are licensed under the [SIL Open Font License 1.1](assets/fonts/).
