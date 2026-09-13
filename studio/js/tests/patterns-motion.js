/**
 * PanelProbe — Motion, IPS and mobile patterns.
 */
(function (DD) {
    'use strict';

    // ---------------------------------------------------------------------
    // Motion & IPS
    // ---------------------------------------------------------------------
    let ufoX = 0;

    DD.definePattern('ufo-motion', {
        animated: true,
        init() {
            ufoX = 0;
        },
        frame(r, dt) {
            const { ctx, width, height, dpr } = r;
            const speed = r.settings.motionSpeed;
            r.fill('#0f172a');

            const span = width + 200 * dpr;
            ufoX = (ufoX + speed * dpr * dt) % span;
            const x = ufoX - 100 * dpr;

            const lanes = [
                { y: height * 0.28, bg: '#1e293b', label: 'Dark gray background' },
                { y: height * 0.52, bg: '#64748b', label: 'Mid gray background' },
                { y: height * 0.76, bg: '#020617', label: 'Near-black background (smear check)' }
            ];

            lanes.forEach((lane) => {
                const top = lane.y - 48 * dpr;
                ctx.fillStyle = lane.bg;
                ctx.fillRect(0, top, width, 96 * dpr);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                for (let gx = 0; gx < width; gx += Math.round(100 * dpr)) ctx.fillRect(gx, top, 1, 96 * dpr);

                ctx.fillStyle = '#00e5ff';
                ctx.beginPath();
                ctx.arc(x, lane.y - 8 * dpr, 18 * dpr, Math.PI, 0);
                ctx.fill();

                ctx.fillStyle = '#a78bfa';
                ctx.beginPath();
                ctx.ellipse(x, lane.y, 45 * dpr, 12 * dpr, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#fbbf24';
                [-22, 0, 22].forEach((off) => {
                    ctx.beginPath();
                    ctx.arc(x + off * dpr, lane.y, 3 * dpr, 0, Math.PI * 2);
                    ctx.fill();
                });

                r.text(lane.label, 20 * dpr, top - 8 * dpr, { size: 11, align: 'left', color: '#94a3b8' });
            });

            r.caption(`MOTION PURSUIT // ${speed} PX/S // FOLLOW THE UFO WITH YOUR EYES`);
        }
    });

    DD.definePattern('backlight-bleed', {
        draw(r) {
            const { ctx, width, height, dpr } = r;
            r.fill('#050505');

            const inset = 70 * dpr;
            const marks = [[inset, inset], [width - inset, inset], [inset, height - inset], [width - inset, height - inset]];
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
            ctx.lineWidth = Math.max(1, dpr);
            marks.forEach(([cx, cy]) => {
                ctx.beginPath();
                ctx.arc(cx, cy, 30 * dpr, 0, Math.PI * 2);
                ctx.moveTo(cx - 40 * dpr, cy);
                ctx.lineTo(cx + 40 * dpr, cy);
                ctx.moveTo(cx, cy - 40 * dpr);
                ctx.lineTo(cx, cy + 40 * dpr);
                ctx.stroke();
            });

            r.text('BACKLIGHT BLEED // DIM THE ROOM, SET BRIGHTNESS TO YOUR USUAL LEVEL', width / 2, height / 2, { size: 12, color: '#3f3f46' });
            r.text('Bleed stays fixed at the edges. IPS glow changes as you move your head.', width / 2, height / 2 + 24 * dpr, { size: 11, color: '#3f3f46', mono: false });
        }
    });

    DD.definePattern('viewing-angle', {
        draw(r) {
            const { ctx, width, height, dpr } = r;
            const w2 = Math.floor(width / 2);
            const h2 = Math.floor(height / 2);
            const quads = [
                [0, 0, '#e11d48', 'RED'],
                [w2, 0, '#0284c7', 'BLUE'],
                [0, h2, '#16a34a', 'GREEN'],
                [w2, h2, '#808080', 'GRAY 50%']
            ];
            quads.forEach(([x, y, color, name]) => {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, width - w2, height - h2);
                r.text(name, x + 24 * dpr, y + 40 * dpr, { size: 12, weight: 700, align: 'left', color: '#FFFFFF' });
            });

            ctx.fillStyle = '#000000';
            ctx.fillRect(w2 - 90 * dpr, h2 - 24 * dpr, 180 * dpr, 48 * dpr);
            r.text('VIEW OFF-AXIS', w2, h2 + 5 * dpr, { size: 12, weight: 700 });
        }
    });

    DD.definePattern('sharpness', {
        draw(r) {
            const { ctx, width, height, dpr } = r;
            r.fill('#FFFFFF');

            // 1px gratings: vertical lines, horizontal lines, and a checkerboard.
            const block = Math.round(140 * dpr);
            const gap = Math.round(24 * dpr);
            const total = block * 3 + gap * 2;
            const bx = Math.round((width - total) / 2);
            const by = Math.round(height / 2 - block / 2);

            ctx.fillStyle = '#000000';
            for (let x = 0; x < block; x += 2) ctx.fillRect(bx + x, by, 1, block);
            for (let y = 0; y < block; y += 2) ctx.fillRect(bx + block + gap, by + y, block, 1);
            const cx = bx + (block + gap) * 2;
            for (let y = 0; y < block; y++) {
                for (let x = y & 1; x < block; x += 2) ctx.fillRect(cx + x, by + y, 1, 1);
            }

            ['1PX VERTICAL', '1PX HORIZONTAL', '1PX CHECKER'].forEach((label, i) => {
                r.text(label, bx + i * (block + gap) + block / 2, by - 12 * dpr, { size: 11, weight: 600, color: '#000000' });
            });

            // Corner targets for edge-to-edge geometry and focus.
            const target = (tx, ty) => {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(tx, ty, 30 * dpr, 0, Math.PI * 2);
                ctx.moveTo(tx + 50 * dpr, ty);
                ctx.arc(tx, ty, 50 * dpr, 0, Math.PI * 2);
                ctx.moveTo(tx - 70 * dpr, ty + 0.5);
                ctx.lineTo(tx + 70 * dpr, ty + 0.5);
                ctx.moveTo(tx + 0.5, ty - 70 * dpr);
                ctx.lineTo(tx + 0.5, ty + 70 * dpr);
                ctx.stroke();
            };
            const m = 100 * dpr;
            target(Math.round(m), Math.round(m));
            target(Math.round(width - m), Math.round(m));
            target(Math.round(m), Math.round(height - m));
            target(Math.round(width - m), Math.round(height - m));

            r.text('Line blocks should look uniformly gray-textured with no moiré, blur, or colored halos.', width / 2, by + block + 36 * dpr, { size: 12, color: '#000000', mono: false });
            if (r.dpr !== (window.devicePixelRatio || 1)) {
                r.text('Enable 1:1 pixel mapping in the studio header for an accurate result.', width / 2, by + block + 60 * dpr, { size: 12, color: '#b91c1c', mono: false });
            }
        }
    });

    // ---------------------------------------------------------------------
    // Touch & mobile
    // ---------------------------------------------------------------------
    DD.definePattern('phone-burnin', {
        draw(r) {
            const { ctx, width, height, dpr } = r;
            r.fill('#7a7a7a');
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 2 * dpr;
            const overlay = r.settings.phoneOverlay;
            const labelOpts = { size: 10, color: 'rgba(255, 255, 255, 0.6)' };

            if (overlay === 'notch') {
                const w = 120 * dpr;
                const h = 34 * dpr;
                const y = 18 * dpr;
                ctx.strokeRect((width - w) / 2, y, w, h);
                r.text('CAMERA NOTCH / ISLAND ZONE', width / 2, y + h + 20 * dpr, labelOpts);
            } else if (overlay === 'statusbar') {
                ctx.strokeRect(dpr, dpr, width - 2 * dpr, 50 * dpr);
                r.text('STATUS BAR ZONE (CLOCK • SIGNAL • BATTERY)', width / 2, 32 * dpr, labelOpts);
            } else {
                const w = 140 * dpr;
                const y = height - 30 * dpr;
                ctx.strokeRect((width - w) / 2, y, w, 6 * dpr);
                r.text('HOME INDICATOR ZONE', width / 2, y - 14 * dpr, labelOpts);
            }

            r.text('STATUS BAR & NOTCH BURN-IN CHECK', width / 2, height / 2, { size: 13, weight: 700, color: '#FFFFFF', mono: false });
            r.text('Look inside the outlined zone for faint, permanent clock or icon silhouettes.', width / 2, height / 2 + 24 * dpr, { size: 11, color: '#f1f5f9', mono: false });
        }
    });

    let pwmOffset = 0;

    DD.definePattern('pwm-flicker', {
        animated: true,
        init() {
            pwmOffset = 0;
        },
        frame(r, dt) {
            const { ctx, width, height, dpr } = r;
            const stripe = Math.max(2, Math.round(4 * dpr));
            const period = stripe * 2;
            pwmOffset = (pwmOffset + 180 * dpr * dt) % period;

            r.fill('#000000');
            ctx.fillStyle = '#FFFFFF';
            const offset = Math.round(pwmOffset);
            for (let x = -period; x < width; x += period) ctx.fillRect(x + offset, 0, stripe, height);

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 12 * dpr, width, 36 * dpr);
            r.caption('PWM VISUALIZER // VIEW THROUGH A PHONE CAMERA OR SWEEP YOUR EYES ACROSS');
        }
    });

    const GRID_COLS = 6;
    const GRID_ROWS = 10;
    const touchHits = new Set();

    DD.definePattern('touch-grid', {
        init() {
            touchHits.clear();
        },
        draw(r) {
            const { ctx, width, height, dpr } = r;
            r.fill('#07070b');
            const cw = width / GRID_COLS;
            const ch = height / GRID_ROWS;
            for (let c = 0; c < GRID_COLS; c++) {
                for (let row = 0; row < GRID_ROWS; row++) {
                    const hit = touchHits.has(c * GRID_ROWS + row);
                    ctx.fillStyle = hit ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255, 255, 255, 0.04)';
                    ctx.fillRect(c * cw + dpr, row * ch + dpr, cw - 2 * dpr, ch - 2 * dpr);
                    ctx.strokeStyle = hit ? '#10b981' : 'rgba(255, 255, 255, 0.12)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(c * cw + dpr, row * ch + dpr, cw - 2 * dpr, ch - 2 * dpr);
                }
            }
            const total = GRID_COLS * GRID_ROWS;
            const done = touchHits.size === total;
            r.caption(done ? `ALL ${total} ZONES RESPONDED` : `TOUCH GRID // DRAG ACROSS EVERY CELL (${touchHits.size}/${total})`, done ? '#10b981' : '#00e5ff');
        },
        onPointer(r, x, y) {
            const col = Math.floor((x / window.innerWidth) * GRID_COLS);
            const row = Math.floor((y / window.innerHeight) * GRID_ROWS);
            if (col < 0 || row < 0 || col >= GRID_COLS || row >= GRID_ROWS) return;
            const key = col * GRID_ROWS + row;
            if (touchHits.has(key)) return;
            touchHits.add(key);
            this.draw(r);
        }
    });
})(window.DD);
