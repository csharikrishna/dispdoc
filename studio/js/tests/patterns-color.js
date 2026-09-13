/**
 * PanelProbe — Color, gamma and dynamic range patterns.
 */
(function (DD) {
    'use strict';

    DD.definePattern('grayscale', {
        draw(r) {
            const { ctx, width, height, dpr } = r;
            const steps = 32;
            const stepW = width / steps;
            for (let i = 0; i < steps; i++) {
                const v = Math.round((i / (steps - 1)) * 255);
                const x = Math.floor(i * stepW);
                ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
                ctx.fillRect(x, 0, Math.ceil(stepW) + 1, height);
                if (i % 4 === 0 || i === steps - 1) {
                    r.text(String(v), x + stepW / 2, height - 28 * dpr, { size: 10, color: i < steps / 2 ? '#9ca3af' : '#374151' });
                }
            }
        }
    });

    /**
     * Gamma check: each patch is a solid gray chosen so that, at the stated
     * gamma, it emits the same light as 50% black/white line dither. The patch
     * that disappears into its dithered surround marks the display gamma.
     */
    const GAMMAS = [1.8, 2.0, 2.2, 2.4, 2.6];

    DD.definePattern('gamma', {
        draw(r) {
            const { ctx, width, height, dpr } = r;
            r.fill('#101010');

            const cols = GAMMAS.length;
            const gap = Math.round(12 * dpr);
            const tileW = Math.floor((width - gap * (cols + 1)) / cols);
            const tileH = Math.min(Math.floor(height * 0.5), Math.round(tileW * 1.4));
            const top = Math.round((height - tileH) / 2);
            const patch = Math.round(tileW * 0.42);

            GAMMAS.forEach((g, i) => {
                const x = gap + i * (tileW + gap);

                ctx.fillStyle = '#000000';
                ctx.fillRect(x, top, tileW, tileH);
                ctx.fillStyle = '#FFFFFF';
                for (let y = 0; y < tileH; y += 2) ctx.fillRect(x, top + y, tileW, 1);

                const v = Math.round(255 * Math.pow(0.5, 1 / g));
                ctx.fillStyle = `rgb(${v}, ${v}, ${v})`;
                ctx.fillRect(x + Math.round((tileW - patch) / 2), top + Math.round((tileH - patch) / 2), patch, patch);

                r.text(`γ ${g.toFixed(1)}`, x + tileW / 2, top + tileH + 26 * dpr, { size: 14, weight: 700, color: g === 2.2 ? '#00e5ff' : '#e5e7eb' });
                r.text(`RGB ${v}`, x + tileW / 2, top + tileH + 46 * dpr, { size: 10, color: '#6b7280' });
            });

            r.caption('GAMMA // STEP BACK OR SQUINT — THE PATCH THAT BLENDS IN IS YOUR GAMMA (TARGET 2.2)');
            if (r.dpr !== (window.devicePixelRatio || 1)) {
                r.text('Enable 1:1 pixel mapping in the studio header — scaled lines give a false reading.', width / 2, 60 * dpr, { size: 11, color: '#f87171', mono: false });
            }
        }
    });

    function levelGrid(r, levels, background, labelColor, caption, captionColor) {
        const { ctx, width, height, dpr } = r;
        r.fill(background);
        const cols = 6;
        const rows = Math.ceil(levels.length / cols);
        const pad = 16 * dpr;
        const top = 72 * dpr;
        const cellW = (width - pad * (cols + 1)) / cols;
        const cellH = (height - top - pad * (rows + 1)) / rows;

        levels.forEach((level, i) => {
            const x = pad + (i % cols) * (cellW + pad);
            const y = top + Math.floor(i / cols) * (cellH + pad);
            ctx.fillStyle = `rgb(${level}, ${level}, ${level})`;
            ctx.fillRect(x, y, cellW, cellH);
            r.text(String(level), x + cellW / 2, y + cellH / 2 + 4 * dpr, { size: 11, color: labelColor });
        });
        r.caption(caption, captionColor);
    }

    DD.definePattern('black-clipping', {
        draw(r) {
            const levels = Array.from({ length: 24 }, (_, i) => i + 1);
            levelGrid(r, levels, '#000000', '#52525b', 'BLACK LEVEL // PATCHES 1–3 SHOULD BE FAINTLY VISIBLE AGAINST BLACK');
        }
    });

    DD.definePattern('white-clipping', {
        draw(r) {
            const levels = Array.from({ length: 24 }, (_, i) => 254 - i);
            levelGrid(r, levels, '#FFFFFF', '#a1a1aa', 'WHITE LEVEL // PATCHES 252–254 SHOULD BE FAINTLY VISIBLE AGAINST WHITE', '#0f172a');
        }
    });

    DD.definePattern('color-banding', {
        draw(r) {
            const { ctx, width, height, dpr } = r;
            const bands = [['#FF0000', 'RED'], ['#00FF00', 'GREEN'], ['#0000FF', 'BLUE'], ['#FFFFFF', 'LUMINANCE']];
            const bandH = height / bands.length;
            bands.forEach(([color, label], i) => {
                const y = Math.floor(i * bandH);
                const grad = ctx.createLinearGradient(0, 0, width, 0);
                grad.addColorStop(0, '#000000');
                grad.addColorStop(1, color);
                ctx.fillStyle = grad;
                ctx.fillRect(0, y, width, Math.ceil(bandH));
                r.text(`${label} 0 → 255`, 20 * dpr, y + 26 * dpr, { size: 11, align: 'left', color: '#FFFFFF' });
            });
        }
    });
})(window.DD);
