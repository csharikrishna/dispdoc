# Design System & Token Rationale — DisplayDoctor Pro

Complete token catalog and architectural rationale for DisplayDoctor Pro.

---

## 1. Typography Tokens

```css
:root {
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace;
}
```

- **Rationale**: Display testing software requires absolute legibility. `Inter` provides neutral, grotesque letterforms with tall x-height for long technical descriptions. `JetBrains Mono` provides tabular figures and unambiguous character distinctions (`0` vs `O`, `1` vs `l`) essential for resolution and color depth readings.

---

## 2. Color System Tokens

### A. Dark Palette (Obsidian Studio)
```css
[data-theme="dark"] {
    --bg-base: #08090d;               /* Pitch obsidian for OLED calibration */
    --bg-surface: #11141c;            /* First surface level */
    --bg-surface-elevated: #161b26;   /* Interactive card level */
    --bg-surface-hover: #1c2230;      /* Hover states */
    --bg-glass: rgba(14, 17, 24, 0.85);/* Frosted HUD capsule */

    --border-subtle: rgba(255, 255, 255, 0.07);
    --border-medium: rgba(255, 255, 255, 0.12);
    --border-highlight: rgba(0, 229, 255, 0.4);

    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;

    --accent-cyan: #00e5ff;
    --accent-cyan-glow: rgba(0, 229, 255, 0.25);
}
```

### B. Light Palette (Swiss Precision)
```css
[data-theme="light"] {
    --bg-base: #f8fafc;               /* Non-glare slate */
    --bg-surface: #ffffff;            /* Crisp white cards */
    --bg-surface-elevated: #f1f5f9;
    --bg-surface-hover: #e2e8f0;
    --bg-glass: rgba(255, 255, 255, 0.92);

    --border-subtle: #e2e8f0;
    --border-medium: #cbd5e1;
    --border-highlight: rgba(2, 132, 199, 0.45);

    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;

    --accent-cyan: #0284c7;
    --accent-cyan-glow: rgba(2, 132, 199, 0.2);
}
```

- **Rationale**: Display testing takes place in both darkrooms (OLED true black, near-black banding, backlight bleed) and brightly lit office environments (color grading, text fringing). Having true dark and light parity ensures comfortable inspection under all ambient lighting conditions.

---

## 3. Geometry & Corner Radii

```css
:root {
    --radius-sm: 6px;       /* Monospace badges, inner tags */
    --radius-md: 10px;      /* Interactive buttons, inputs */
    --radius-lg: 16px;      /* Diagnostic test cards */
    --radius-xl: 22px;      /* Command bar container, modal dialogue cards */
    --radius-full: 9999px;  /* Pills, floating HUD capsule */
}
```

---

## 4. Spacing Scale

Strict 8-point geometric scale:
- `xxs`: `4px`
- `xs`: `8px`
- `sm`: `12px`
- `md`: `16px`
- `lg`: `24px`
- `xl`: `32px`
- `2xl`: `48px`
- `3xl`: `64px`

---

## 5. Focus & Accessibility Tokens

```css
:focus-visible {
    outline: 2px solid var(--accent-cyan) !important;
    outline-offset: 3px !important;
    box-shadow: 0 0 0 4px var(--accent-cyan-glow) !important;
}
```

- **Touch Targets**: Minimum 44×44px hit areas on touch devices (`@media (pointer: coarse)`).
- **Reduced Motion**: Disables transitions and throttles motion tests when `prefers-reduced-motion: reduce` is active.
