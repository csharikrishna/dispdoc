<p align="center">
  <a href="https://csharikrishna.github.io/dispdoc/">
    <img src="assets/logo.svg" width="96" height="96" alt="DisplayDoctor Pro Logo">
  </a>
</p>

<h1 align="center">DisplayDoctor Pro</h1>

<p align="center">
  <strong>Hardware-Grade Display Diagnostics, OLED True Black, and Panel Calibration Suite</strong>
</p>

<p align="center">
  <a href="https://csharikrishna.github.io/dispdoc/"><strong>Explore Overview</strong></a> •
  <a href="https://csharikrishna.github.io/dispdoc/studio/"><strong>Launch Diagnostic Studio</strong></a> •
  <a href="#24-calibrated-diagnostic-tests"><strong>Test Catalog</strong></a> •
  <a href="#keyboard-shortcuts"><strong>Shortcuts</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="MIT License">
  <img src="https://img.shields.io/badge/Dependencies-Zero-emerald.svg?style=flat-square" alt="Zero Dependencies">
  <img src="https://img.shields.io/badge/Engine-HTML5%20Canvas%20%2B%20WebAudio-00f0ff.svg?style=flat-square" alt="Pure Canvas">
  <img src="https://img.shields.io/badge/GitHub%20Pages-Live%20Deploy-purple.svg?style=flat-square" alt="GitHub Pages">
</p>

---

## Overview

**DisplayDoctor Pro** is a standalone, client-side display diagnostics and calibration engine built for desktop monitors, laptops, smartphones, and tablets. It provides 24 uncompressed, hardware-calibrated test patterns specifically engineered for **OLED pixel shutoff**, **ultra-high refresh gaming pursuit (up to 540Hz)**, **QD-OLED / WOLED subpixel text fringing**, and **backlight bleed inspection**.

Unlike video-based test clips on YouTube (which suffer from lossy 8-bit AV1/VP9 compression, macroblocking, and color banding), DisplayDoctor renders uncompressed mathematical buffers directly on your GPU canvas with 1:1 pixel mapping.

---

## Live Links (GitHub Pages)

| Destination | URL | Description |
|---|---|---|
| **Flagship Home Page** | [`csharikrishna.github.io/dispdoc/`](https://csharikrishna.github.io/dispdoc/) | Product showcase, panel buying checklist, and live hardware specs. |
| **Diagnostic Studio** | [`csharikrishna.github.io/dispdoc/studio/`](https://csharikrishna.github.io/dispdoc/studio/) | Full 24-test diagnostic engine with draggable HUD and automated Test All. |

*Both URLs use clean directory-based routing with zero `.html` extensions.*

---

## Key Diagnostic Capabilities

### 1. OLED & QD-OLED Specialization
- **0-Nit True Black (`Key: 1`)**: Verifies absolute individual pixel shutoff and detects display controller leakage glow.
- **Near-Black Banding (`Key: 2`)**: 1% to 20% IRE grayscale steps exposing vertical panel banding, shadow noise, and dirty screen effect (DSE).
- **Subpixel & ClearType Fringing (`Key: 5`)**: Inspects triangular QD-OLED and RWBG WOLED subpixel layouts for chromatic aberration on high-contrast text.
- **ABL Window Dimming (`Key: 6`)**: Measures Auto Brightness Limiter aggressive throttling from 1% to 100% white window areas.
- **Stuck Pixel Reviver (`Key: 4`)**: Targeted 60Hz rapid RGB subpixel cycle box that can be dragged directly over stuck subpixels.

### 2. High-Refresh Gaming & IPS Precision
- **UFO Motion Pursuit (`Key: 7`)**: Calibrated multi-tiered motion targets rendering up to 540Hz to evaluate GtG response times and overdrive overshoot coronas.
- **Backlight Bleed & IPS Glow (`Key: 8`)**: Distinguishes between mechanical bezel edge pinch bleed and angular IPS glow.
- **Viewing Angle Shift (`Key: 9`)**: Angular gamma and chromatic shift evaluation.
- **VRR Flicker Stress (`Key: W`)**: Rapid alternating luminance patterns to reveal variable refresh rate flicker on G-Sync / FreeSync panels.

### 3. Color & Gamma Calibration
- **Gamma 2.2 Calibration (`Key: B`)**: Half-tone dithered optical calibration fields from 1.8 to 2.6.
- **Black Crush & White Clipping (`Key: D`)**: Evaluates shadow visibility (levels 0–25) and highlight retention (levels 230–255).
- **64-Level Color Ramps (`Key: S`)**: Evaluates bit-depth gradations across 8-bit, 10-bit, and 12-bit color pipelines.

---

## 24 Calibrated Diagnostic Tests

```
Category 1: OLED & UNIFORMITY
  [ 1 ] 0-Nit True Black
  [ 2 ] Near-Black Banding (1%-20% IRE)
  [ 3 ] Burn-In & Dead Pixel Field (RGBW)
  [ 4 ] Stuck Pixel Reviver (60Hz Subpixel Cycle)
  [ 5 ] Subpixel & ClearType Text Fringing
  [ 6 ] ABL Window Dimming (1%-100%)

Category 2: IPS & GAMING MOTION
  [ 7 ] UFO Motion Pursuit (Up to 540Hz)
  [ 8 ] Backlight Bleed & IPS Glow
  [ 9 ] Viewing Angle Shift
  [ 0 ] 1:1 Sharpness & Moiré Interference
  [ P ] Color Banding & Dither Gradient
  [ W ] VRR Flicker & Frame Pacing Stress

Category 3: MOBILE & TOUCH
  [ T ] Multi-Touch Matrix Tracking
  [ G ] 240Hz Touch Sampling Latency
  [ C ] Smartphone AMOLED Burn-In Field

Category 4: COLOR & GAMMA
  [ B ] Gamma 2.2 Calibration (1.8 - 2.6)
  [ K ] Grayscale Contrast Steps (32-Step)
  [ D ] Black Crush & White Highlight Clip
  [ S ] 64-Level RGB Color Ramps
  [ R ] Color Uniformity & Tint Field
  [ X ] ANSI Static Contrast Checkerboard

Category 5: STRESS BENCHMARKS
  [ M ] Analog TV Static White Noise (XorShift32)
  [ Z ] 60FPS High-Load Particle Storm
  [ A ] Dual-Plane Matrix Digital Rain
```

---

## Keyboard Shortcuts

| Key | Action |
| :---: | :--- |
| **`Space`** | Pause / Resume current test (freezes motion for close scrutiny) |
| **`F`** | Toggle Fullscreen Mode |
| **`H`** | Hide / Show Floating Controls HUD |
| **`S`** | Toggle Hardware Telemetry Drawer |
| **`M`** | Toggle Audio Sound Effects & Chimes |
| **`←` / `→`** | Previous / Next Test in sequence |
| **`ESC`** | Stop Test & Return to Studio Overview |
| **`1` – `0`** | Direct Jump to Tests 1 through 10 |
| **`P, W, T, G, C, B, K, D, S, R, X, M, Z, A`** | Direct Jump to Tests 11 through 24 |

---

## Repository Architecture

```
dispdoc/
├── index.html              <-- Flagship Home Page (Clean URL: /dispdoc/)
├── landing.css             <-- Home Page Styles (Obsidian & Swiss Precision)
├── landing.js              <-- Telemetry & Theme Controller
├── studio/
│   ├── index.html          <-- Full Diagnostic Suite (Clean URL: /dispdoc/studio/)
│   ├── styles.css          <-- Studio Design System
│   └── app.js              <-- 24-Test Diagnostic Engine & Audio Synth
├── assets/
│   ├── logo.svg            <-- Transparent Brand Vector Mark
│   └── logo.png            <-- Transparent High-Res PNG
├── favicon.svg             <-- Root Vector Favicon
├── favicon.ico             <-- Root Binary Favicon
└── README.md
```

---

## Privacy & Hardware Security

- **100% Client-Side**: Zero telemetry tracking, analytics cookies, or external server calls.
- **Zero Dependencies**: Pure HTML5, Vanilla CSS, and JavaScript. Zero npm runtime bloat.
- **Photosensitivity Warning**: Includes an active advisory modal before running rapid chromatic stress or high-frequency strobe sequences.

---

## License

MIT License © 2026 [csharikrishna](https://github.com/csharikrishna). Open-source for personal and commercial display calibration.
