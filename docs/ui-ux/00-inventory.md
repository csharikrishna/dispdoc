# UI/UX Inventory — DisplayDoctor Pro

Complete screen, view, and modal inventory across DisplayDoctor Pro.

---

## 1. Flagship Product Home Page — `/dispdoc/` (or `/`)

- **Primary purpose**: Introduce DisplayDoctor Pro, demonstrate hardware-level display diagnostics, query live monitor telemetry, present the 4-step new monitor inspection checklist, and launch the calibration studio.
- **Primary user action**: Click `[ Launch Diagnostic Studio ]` to enter fullscreen calibration studio immediately.
- **Secondary actions**: Explore Capabilities, toggle Light/Dark theme, review 24-test catalog, inspect panel technology comparison matrix (OLED vs. Fast-IPS vs. Mini-LED).
- **Information hierarchy notes**:
  1. Top navigation with transparent brand logo, section anchors, theme toggle, and `Launch Studio` CTA.
  2. Hero with status badge (`PRODUCTION CALIBRATION SUITE • v4.0`), headline with gradient emphasis, primary/secondary CTAs, and live hardware display specs card (`1920×1080`, `8-bit SDR`, `sRGB`, `1.25x`).
  3. Interactive Capabilities Grid (5 deep dives).
  4. 4-Step Darkroom Monitor Inspection Checklist with direct studio test launcher.
  5. Panel Technology Matrix.
  6. 24 Diagnostic Test Catalog.
  7. Technical FAQ and footer.
- **Existing UX problems solved**: Replaced guessed refresh rate with verified gamut/scaling; eliminated `.html` extensions; added instant fullscreen on launch.
- **Accessibility status**: Fully compliant. Focus-visible rings on all buttons, semantic landmarks, high contrast.
- **Responsive behavior**: Fluid reflow from 320px mobile to 4K desktop; touch targets $\ge 44\text{px}$.

---

## 2. Diagnostic Studio Dashboard — `/dispdoc/studio/`

- **Primary purpose**: Central calibration studio to review hardware telemetry, select from 24 test patterns across 5 categories, launch automated Test All sequencing, run the 2-minute diagnostic wizard, and export health reports.
- **Primary user action**: Click any diagnostic card or click `[ Run Full Suite (24 Tests) ]`.
- **Secondary actions**: Filter by category (`OLED`, `IPS / Gaming`, `Touch & Mobile`, `Color & Gamma`, `Stress`), toggle theme, toggle mute, toggle 1:1 pixel mapping, open telemetry drawer, open health report, open keyboard shortcuts modal.
- **Information hierarchy notes**:
  1. App Header with `← Overview` back link, brand mark, category filter tabs, and tool actions.
  2. Studio Command Bar with title, subtitle, `Run Full Suite` primary CTA, and Hardware Telemetry Card with auto-fullscreen toggle.
  3. 5 Category Sections containing the 24 tactical hardware cards.
- **Accessibility status**: Fully accessible with `tabindex="0"`, `role="button"`, descriptive `aria-label`, and `Enter`/`Space` keyboard triggers.
- **Responsive behavior**: Category tabs scroll horizontally on touch devices; 1-column layout on mobile, 2-column on tablet, 3-column on desktop, 4-column on ultra-wide.

---

## 3. Active Test Runner (Canvas Fullscreen Mode)

- **Primary purpose**: Render uncompressed GPU canvas patterns directly with 1:1 pixel mapping for precision inspection (0-nit black, UFO motion, banding, gamma, etc.).
- **Primary user action**: Scrutinize display panel visually; drag reviver box or inspect subpixels.
- **Secondary actions**: Pause/Resume (`Space`), previous/next test (`◀`/`▶`), adjust test-specific parameters (e.g. speed, IRE level, APL window, subpixel pattern), toggle HUD visibility (`H`), stop test (`ESC`).
- **Information hierarchy notes**:
  1. Fullscreen canvas covering 100vw × 100vh.
  2. Floating draggable HUD capsule with glassmorphism, current test name, dynamic interactive controls, automated countdown (if Test All), and navigation dock.
- **Accessibility status**: `prefers-reduced-motion` auto-throttles motion speeds; pause key enables static scrutiny.
- **States**: Running, Paused (with visible paused badge), Autocycle countdown, Pure view (HUD hidden).

---

## 4. Photosensitivity & Visual Stress Advisory Modal

- **Primary purpose**: Warn photosensitive users about high-frequency strobe, chromatic flashes, and stress benchmarks before entering the studio.
- **Primary user action**: Click `[ I Understand & Enter Studio ]` to enter fullscreen studio mode.
- **Secondary actions**: Toggle `[x] Always Launch Tests in Fullscreen Mode`.
- **Accessibility status**: Accessible dialog with `role="dialog"`, `aria-labelledby`, and synchronous fullscreen activation on user click.

---

## 5. Hardware Telemetry Drawer (`#statsPanel`)

- **Primary purpose**: Deep-dive display technical specifications (Renderer GPU, RAF clock interval, DPR, Color Space, Bit Depth, Canvas Viewport Buffer).
- **Primary user action**: Inspect telemetry metrics; close drawer.
- **Secondary actions**: Direct jump to corresponding tests.

---

## 6. Diagnostic Health Report Modal (`#reportModal`)

- **Primary purpose**: Generate a certified display health report summarizing test findings, panel grade (A+, A, B, C), detected hardware specs, and calibration recommendations.
- **Primary user action**: `[ Print / Save PDF ]` or `[ Export JSON ]`.
- **Secondary actions**: Close report (`ESC` or Close button).
