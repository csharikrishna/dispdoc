/**
 * PanelProbe — Pattern renderer contract and drawing helpers.
 *
 * A pattern is registered with DD.definePattern(id, spec):
 *
 *   spec.animated  boolean — true: frame() runs every animation frame
 *   spec.init(r)   optional — reset per-run state (called when the test starts)
 *   spec.resize(r) optional — rebuild size-dependent state after a resize
 *   spec.draw(r)   static patterns: paint the full frame (also after resizes
 *                  and HUD setting changes)
 *   spec.frame(r, dt, now)
 *                  animated patterns: paint one frame; dt is seconds since the
 *                  previous frame (clamped), now is the rAF timestamp
 *   spec.onTap(r)            optional — canvas click / tap
 *   spec.onPointer(r, x, y)  optional — pointer down/drag in CSS pixels
 *   spec.cleanup(r)          optional — undo DOM side effects on stop
 *
 * The renderer `r` passed to every hook exposes:
 *   r.ctx, r.width, r.height   2D context and backing-store size (device px)
 *   r.dpr                      backing-store pixels per CSS pixel
 *   r.settings                 user-adjustable HUD values
 *   r.rng                      fast PRNG (next() → uint32)
 *   r.text(str, x, y, opts)    draw a label; sizes are in CSS px
 *   r.fill(color)              fill the whole canvas
 *   r.setStatus(text)          update the HUD subtitle
 */
(function (DD) {
    'use strict';

    DD.patterns = Object.create(null);

    DD.definePattern = function definePattern(id, spec) {
        if (DD.patterns[id]) throw new Error(`Pattern "${id}" is already defined`);
        DD.patterns[id] = spec;
    };

    /** XorShift32 — fast, allocation-free PRNG for per-frame noise. */
    DD.FastRNG = class FastRNG {
        constructor(seed = 2463534242) {
            this.state = (seed >>> 0) || 2463534242;
        }

        next() {
            let x = this.state;
            x ^= x << 13;
            x ^= x >>> 17;
            x ^= x << 5;
            this.state = x >>> 0;
            return this.state;
        }
    };

    DD.createRenderer = function createRenderer(canvas, settings) {
        const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true }) || canvas.getContext('2d');

        const r = {
            canvas,
            ctx,
            width: 0,
            height: 0,
            dpr: 1,
            settings,
            rng: new DD.FastRNG(Date.now()),
            setStatus: () => {},

            fill(color) {
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, r.width, r.height);
            },

            text(str, x, y, opts = {}) {
                const size = (opts.size || 12) * r.dpr;
                const family = opts.mono === false ? 'Inter, system-ui, sans-serif' : '"JetBrains Mono", Consolas, monospace';
                ctx.font = `${opts.weight || 500} ${size}px ${family}`;
                ctx.textAlign = opts.align || 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = opts.color || '#00e5ff';
                if (opts.maxWidth) ctx.fillText(str, x, y, opts.maxWidth);
                else ctx.fillText(str, x, y);
            },

            /** Top-of-screen caption used by most patterns; condensed to fit narrow screens. */
            caption(str, color) {
                r.text(str, r.width / 2, 36 * r.dpr, { size: 12, color: color || '#00e5ff', maxWidth: r.width - 32 * r.dpr });
            }
        };

        return r;
    };
})(window.DD = window.DD || {});
