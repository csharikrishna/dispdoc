# Architecture

PanelProbe is a static site with no build step. Plain HTML, CSS, and
classic `<script>` files run directly in the browser. Serve it over HTTP
(`npm start`) during development. Over `file://`, directory links such as
`studio/` show a folder listing and web fonts are blocked.

## Layout

```
index.html                  Landing page (static content)
studio/index.html           Diagnostic studio (canvas app)
assets/
  css/base.css              Fonts, design tokens (dark + light), reset, a11y defaults
  css/landing.css           Landing page styles
  js/shared/                Modules used by both pages
    storage.js              DD.Storage   – safe localStorage wrapper
    icons.js                DD.icon()    – inline SVG icon set
    theme.js                DD.Theme     – light/dark toggle
    display-info.js         DD.DisplayInfo – browser-reported resolution, depth, gamut
  js/landing.js             Landing bootstrap
  fonts/                    Self-hosted Inter & JetBrains Mono (SIL OFL 1.1)
studio/
  css/studio.css            Studio styles
  js/core/                  audio.js, fullscreen.js, telemetry.js
  js/tests/registry.js      ★ Single source of truth for every test
  js/tests/pattern-kit.js   Renderer contract, drawing helpers, PRNG
  js/tests/patterns-*.js    Pattern renderers, grouped by category
  js/ui/                    catalog, hud, safety-gate, wizard, report, suite, toast
  js/app.js                 Controller: canvas sizing, lifecycle, input
scripts/                    Dev server, static checks, browser smoke test
```

## Module pattern

Every file is an IIFE that attaches to one global namespace, `window.DD`:

```js
(function (DD) {
    'use strict';
    DD.Thing = { /* … */ };
})(window.DD = window.DD || {});
```

Files load in dependency order. See the `<script>` list at the bottom of
`studio/index.html`: shared, then core, then tests, then UI, then `app.js`.
`app.js` boots everything on `DOMContentLoaded`.

## How a test runs

1. **Registry**: `DD.TESTS` describes each test (id, hotkey, category, title,
   whether it is in Test All, HUD controls, optional auto-stop).
2. **Catalog**: `ui/catalog.js` builds category tabs and cards from the
   registry.
3. **Launch**: a card click or hotkey calls `DD.App.start(id, { fromUser: true })`.
   `fromUser` lets the controller request fullscreen, which browsers only
   allow inside a user gesture.
4. **Render**: the controller looks up `DD.patterns[id]`.
   - *Static* patterns implement `draw(r)`. It is called once, and again after
     resizes or HUD setting changes.
   - *Animated* patterns implement `frame(r, dt, now)`. It runs on
     `requestAnimationFrame`, with `dt` in seconds.
5. **HUD**: `ui/hud.js` shows the title, the control group named in the
   registry (`controls`), and pause/prev/next buttons. HUD buttons write to
   `DD.App.settings`, then the pattern redraws. The HUD starts hidden, so the
   pattern is unobstructed. It appears while the pointer is near it, briefly
   after a keyboard shortcut, and always while paused. `H` (or a tap on touch
   screens) pins it.
6. **Stop**: `DD.App.stop()` cancels the loop, calls the pattern's `cleanup()`,
   and restores the dashboard.

The renderer object `r` is documented in `studio/js/tests/pattern-kit.js`. It
exposes the 2D context, backing-store size in device pixels, the pixel ratio,
settings, a PRNG, and text helpers that take sizes in CSS pixels.

## Pixel mapping

The canvas backing store is sized to the element's **device-pixel content box**
(`ResizeObserver` with `box: 'device-pixel-content-box'`), so one canvas pixel is
one physical pixel, even at fractional scaling such as 125%. The header's
`1:1 / CSS` toggle switches to CSS-pixel sizing for comparison. Patterns that
depend on exact mapping (gamma, sharpness) show a warning when it is off.

## Adding a test

1. Add an entry to `DD.TESTS` in `studio/js/tests/registry.js`. Pick an unused
   hotkey that is not in `DD.RESERVED_KEYS`.
2. Register a renderer with the same id in the matching
   `studio/js/tests/patterns-*.js` file:

   ```js
   DD.definePattern('my-test', {
       draw(r) {
           r.fill('#000');
           r.caption('MY TEST // WHAT TO LOOK FOR');
       }
   });
   ```

3. For adjustable settings, add a `.runner-control-group` with `data-setting`
   to `studio/index.html`, set `controls` in the registry, and add a default to
   `settings` in `studio/js/app.js`.
4. Add the test to the catalog list in `index.html`.
5. Run `npm run verify`. The check fails if steps 1–4 disagree.

## Safety

- The photosensitivity advisory opens once per browser session (every new visit, not on reloads).
- Tests with `autoStop` end themselves after that many seconds.
- The strobe test has `suite: false`, so Test All never runs it.
- With `prefers-reduced-motion`, the default motion speed is lower and UI
  animations are disabled.

## Verification

| Command          | What it does |
|------------------|--------------|
| `npm start`      | Serves the site at `http://localhost:8080/panelprobe/`, the same path as GitHub Pages |
| `npm run lint`   | ESLint on browser code and scripts |
| `npm run check`  | Static consistency checks (registry, catalog, ids, asset links, no third-party requests) |
| `npm test`       | Headless-Chrome smoke test covering every pattern, hotkeys, Test All, wizard, report, and mobile layout |
| `npm run verify` | All of the above; this is what CI runs |
| `npm run social-card` | Regenerates `assets/social-card.png`, the link-preview image |
