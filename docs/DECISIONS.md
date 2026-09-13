# Architectural & Design Decisions Log — PanelProbe

Append-only log of non-obvious engineering decisions, rationale, and behavioral modifications.

---

### Entry 001: Physical Hardware Resolution Calculation
- **Date**: 2026-09-13
- **Context**: The browser previously reported `1920 × 970` on standard 1080p monitors.
- **Root Cause**: `window.innerHeight * window.devicePixelRatio` measures the CSS viewport minus the Windows taskbar, address bar, and browser tab bar.
- **Decision**: Query physical hardware screen boundaries: `Math.round(window.screen.width * dpr) × Math.round(window.screen.height * dpr)`.
- **Outcome**: Accurately outputs native panel resolution: **`1920 × 1080`**.

---

### Entry 002: Abandoning Heuristic Refresh Rate Guessing on Home Dashboard
- **Date**: 2026-09-13
- **Context**: Browser compositor frame bursts during tab startup produced false readings of "100 Hz" on 60Hz displays.
- **Rule Applied**: Prompt Kit Ground Rule #2 ("No fabricated content, ever. If real data doesn't exist, design honestly").
- **Decision**: Remove static RAF refresh rate guessing from the home dashboard telemetry panel. Replace with 100% verified hardware properties: Color Gamut (`sRGB (Rec. 709)` / `DCI-P3 Wide`) and Display Scaling (`1.25x (125%)`). Active render framerate is strictly measured live during active motion pursuit benchmarks where genuine benchmarking belongs.

---

### Entry 003: Immediate Synchronous Fullscreen on "Launch Studio" Click
- **Date**: 2026-09-13
- **Context**: Clicking "Launch Studio" originally performed a standard `<a href="./studio/">` HTTP document navigation. Document unloads immediately terminate browser fullscreen, and subsequent pages cannot programmatically enter fullscreen without another user click.
- **Decision**: Architect a seamless Single Page Application (SPA) in-place view transition. On the user's click gesture of "Launch Diagnostic Studio," call `requestFullscreen()` synchronously on line 1, swap `#landingView` for `#studioView`, and update the address bar to `/dispdoc/studio/` via `history.pushState`.
- **Outcome**: The screen moves to fullscreen immediately on that exact click without document reload.

---

### Entry 004: Canonical URL Path Routing to Prevent `/studio/studio/` Stacking
- **Date**: 2026-09-13
- **Context**: Repeated clicks on studio links while at `/dispdoc/studio/` caused relative path concatenation (`./studio/` $\rightarrow$ `/studio/studio/`).
- **Decision**: Implement `getPaths()` method in `landing.js` that strips any trailing `/studio/` segments and dynamically generates canonical `/dispdoc/` and `/dispdoc/studio/` targets.
- **Outcome**: Clean, stable URLs across all navigation flows.

---

### Entry 005: 100% Vector SVG Icon System
- **Date**: 2026-09-13
- **Context**: Legacy implementation used mixed platform emojis (`⬛`, `🌫️`, `💡`, `🛸`) which rendered inconsistently across Windows, macOS, Android, and iOS.
- **Decision**: Author custom inline SVGs with a uniform 1.75px geometric stroke for all 24 cards and navigation actions.
- **Outcome**: Zero icon font dependencies, crisp rendering at all DPRs (1x to 4K Retina).

---

### Entry 006: Remove the Embedded SPA Studio (supersedes 003 and 004)
- **Date**: 2026-09-13
- **Context**: Entry 003 embedded a full copy of the studio markup inside the landing page, plus duplicate root copies of `app.js` and `styles.css`. The copies had to be kept in sync by hand, the studio CSS overrode landing styles, and `landing.js` called studio APIs that did not exist (`App.startTest`, `App.stopTest`).
- **Decision**: `studio/` is the only copy of the studio. The landing page links to it normally. The studio's safety gate already asks for fullscreen with a single click, so the cost is one click after navigation.
- **Outcome**: About 1,700 duplicated lines removed; `getPaths()` URL normalization is no longer needed.

---

### Entry 007: Single Test Registry
- **Date**: 2026-09-13
- **Context**: Test names, hotkeys, and ordering lived separately in card HTML, the keyboard handler, the "Test All" list, the README, and the landing page, and they disagreed. Most letter hotkeys shown on cards did nothing, and `S`/`M` were assigned both to tests and to studio shortcuts.
- **Decision**: `studio/js/tests/registry.js` defines every test. Cards, category tabs, hotkeys, navigation order, and Test All are generated from it. `npm run check` fails if renderers, HUD controls, or the landing-page catalog drift from the registry, or if a hotkey collides with a studio shortcut. TV Static moved from `S` to `N` and Matrix Rain from `M` to `Q`.

---

### Entry 008: Time-Based Animation
- **Date**: 2026-09-13
- **Context**: Stress patterns multiplied by an undefined `intensity` value (NaN), so PWM, Particles, Matrix Rain, Gradient Storm, Rainbow, and Strobe rendered nothing or froze. Speeds were also per-frame, so they varied with refresh rate.
- **Decision**: All animated patterns receive a clamped `dt` (seconds) and scale motion by it. The strobe toggles every 100 ms regardless of refresh rate.

---

### Entry 009: Honest Display Information
- **Date**: 2026-09-13
- **Context**: Labels such as "Hardware Detected", "8-bit SDR", and "Certified Hardware Assessment" implied measurements a browser cannot make. The privacy copy promised zero external requests while Google Fonts loaded from a CDN.
- **Decision**: Display values are labeled "as reported by your browser". HDR and Rec. 2020 come from media queries. The report is a "Self-Assessment" and says it is not a certified measurement. Fonts (SIL OFL) are self-hosted in `assets/fonts/`.

---

### Entry 010: Real Gamma Pattern and 1:1 Canvas Mapping
- **Date**: 2026-09-13
- **Context**: "Gamma 2.2 Calibration" was a plain linear gradient. The canvas backing store used `floor(innerWidth × dpr)`, which is not exactly 1:1 at fractional scaling.
- **Decision**: The gamma test shows solid gray patches (value `255 × 0.5^(1/γ)`) against 1-pixel black/white line dither for γ 1.8–2.6. Canvas size comes from `ResizeObserver` `device-pixel-content-box` where available, falling back to rounding.

---

### Entry 011: Rename to PanelProbe
- **Date**: 2026-09-13
- **Context**: "Display Doctor" is already used by a screen-testing Android app (Google Play) and by the SciTech Display Doctor driver suite.
- **Decision**: Rename the product to **PanelProbe**. Search, GitHub, and npm showed no conflicts. The GitHub repository, the Pages URL (`/dispdoc/`), and `localStorage` keys (`dispdoc_*`) are unchanged, so links and saved preferences keep working.
