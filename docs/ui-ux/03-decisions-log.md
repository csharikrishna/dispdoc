# Architectural & Design Decisions Log — DisplayDoctor Pro

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
