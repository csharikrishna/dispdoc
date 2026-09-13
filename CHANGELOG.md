# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [4.3.0] — 2026-09-13

### Changed
- **Renamed to PanelProbe** (formerly DisplayDoctor Pro). The old name collided with an existing Android screen-testing app and SciTech Display Doctor. The URL and saved preferences are unchanged.

## [4.2.0] — 2026-09-13

### Changed
- **Test HUD** is hidden by default. It appears when the pointer moves near it, briefly after shortcuts, and whenever a test is paused. `H` or a tap pins it.
- **HUD redesign**: a fixed dark style that reads over any pattern, with test key, title, category and position, grouped controls, a Test All progress line with countdown, and a pin toggle.
- **Pacing**: Test All shows each test for 10 seconds (was 4), and Auto-Cycle rotates every 8 seconds (was 4).
- The photosensitivity advisory appears once per browser session instead of on every reload.
- Removed redundant toasts (test switched, paused/resumed) and the card hover sound.

## [4.1.0] — 2026-09-13

### Changed
- **Architecture**: the studio now exists only in `studio/`. The landing page no longer embeds a hidden copy of the studio, and the duplicate root `app.js` and `styles.css` are gone.
- **Modules**: the 2,800-line `app.js` is split into focused modules (`core/`, `tests/`, `ui/`) around a single test registry. Cards, hotkeys, category tabs, navigation, and Test All are generated from that registry.
- **Hotkeys**: TV Static moved from `S` to `N` and Matrix Rain from `M` to `Q`, so they no longer clash with the Performance panel (`S`) and Mute (`M`). All letter hotkeys now work.
- **Honest copy**: display values are labeled as browser-reported, the report is a self-assessment, and the README and landing page describe what actually ships.
- **Privacy**: fonts are self-hosted; no third-party requests remain.
- **Design**: one set of design tokens shared by both pages; the studio header, HUD, and modals were rebuilt for narrow screens.

### Added
- A real gamma calibration pattern (γ 1.8–2.6 line-dither patches).
- 1px gratings in the sharpness test, and exact 1:1 canvas mapping via `device-pixel-content-box`.
- Wizard steps for highlight clipping, grayscale, and banding advice; report grades now reflect answered checks.
- Focus management for dialogs, a skip link, `aria-pressed` toggle states, and theme-color updates.
- `npm run lint`, `npm run check` (registry, catalog, id, and asset consistency), `npm test` (headless Chrome smoke test), and a CI workflow.
- LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, architecture docs, and issue/PR templates.

### Fixed
- Six stress patterns rendered nothing or froze because of an undefined `intensity` value.
- Finishing Test All threw an error (`openReport` is not a function).
- Clicking the burn-in field skipped a color on every click.
- Resizing during a test could loop fullscreen requests and reset test state.
- In the fullscreen fallback, the HUD was hidden behind the canvas.
- `Ctrl+F`, `Ctrl+S`, and other browser shortcuts were swallowed by studio hotkeys.
- The "Enter Studio" button had no background because it used undefined CSS variables.
- Report status badges and FPS colors had no styles.
- The JSON export revoked its download URL before the download could start in some browsers.
- Horizontal overflow on phones on both pages.

## [4.0.0] — 2026-09-12

- Initial public release.
