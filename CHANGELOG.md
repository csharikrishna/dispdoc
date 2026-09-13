# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-09-13

First public release of **PanelProbe**.

### Studio
- 26 full-screen test patterns in five categories (OLED & uniformity, motion & IPS, touch & mobile, color & gamma, stress), each with a one-key shortcut.
- **Test All** steps through the 24 non-flashing suite tests, 10 seconds each, with pause, skip, and a progress line.
- **Guided Wizard** with nine pass/issue checks and a self-assessment report you can print, save as PDF, or export as JSON, with advice for each issue.
- A real gamma calibration pattern (γ 1.8–2.6 line-dither patches), 1px sharpness gratings, and exact 1:1 device-pixel canvas mapping.
- Refresh-rate detection (60–540 Hz), frame-time stats, and time-based animation that runs at the same speed at any refresh rate.
- Auto-hiding test controls that appear when the pointer approaches, stay visible while paused, and can be pinned (`H`, or tap on touch screens).
- Photosensitivity advisory with an optional two-step fullscreen gate. Flashing tests auto-stop, and the strobe is excluded from Test All.
- Touch support: swipe between tests, a draggable controls bar, and a 60-cell touch digitizer grid.

### Platform
- Static site with no runtime dependencies and no build step, deployed on GitHub Pages.
- Private by design: no analytics, cookies, or third-party requests. Fonts are self-hosted.
- Accessible: keyboard operable, focus management in dialogs, screen-reader labels, light/dark themes, and `prefers-reduced-motion` support.
- Modular architecture around a single test registry; see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Tooling
- `npm run lint`, `npm run check` (registry, catalog, id, and asset consistency), `npm test` (headless Chrome smoke test), and `npm run verify`, all run in CI.

[1.0.0]: https://github.com/csharikrishna/panelprobe/releases/tag/v1.0.0
