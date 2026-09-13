/**
 * PanelProbe — GPU and panel stress patterns.
 */
(function (DD) {
    'use strict';

    // Shared full-screen ImageData buffer for the noise patterns.
    let noise = null;
    let noiseBuf = null;

    function ensureNoiseBuffer(r) {
        if (noise && noise.width === r.width && noise.height === r.height) return true;
        try {
            noise = r.ctx.createImageData(r.width, r.height);
            noiseBuf = new Uint32Array(noise.data.buffer);
            return true;
        } catch (_) {
            noise = noiseBuf = null;
            return false;
        }
    }

    const BLACK = 0xFF000000;
    const WHITE = 0xFFFFFFFF;

    DD.definePattern('tv-static', {
        animated: true,
        frame(r) {
            if (!ensureNoiseBuffer(r)) return;
            const buf = noiseBuf;
            const len = buf.length;
            let bits = 0;
            let rand = 0;
            for (let i = 0; i < len; i++) {
                if (bits === 0) {
                    rand = r.rng.next();
                    bits = 32;
                }
                buf[i] = (rand & 1) ? WHITE : BLACK;
                rand >>>= 1;
                bits--;
            }
            r.ctx.putImageData(noise, 0, 0);
        }
    });

    DD.definePattern('rgb-noise', {
        animated: true,
        frame(r) {
            if (!ensureNoiseBuffer(r)) return;
            const buf = noiseBuf;
            const len = buf.length;
            for (let i = 0; i < len; i++) buf[i] = BLACK | (r.rng.next() & 0x00FFFFFF);
            r.ctx.putImageData(noise, 0, 0);
        }
    });

    let particles = [];

    function seedParticles(r) {
        const count = window.innerWidth <= 768 ? 600 : 1250;
        particles = Array.from({ length: count }, () => ({
            x: Math.random() * r.width,
            y: Math.random() * r.height,
            vx: (Math.random() - 0.5) * 220 * r.dpr,
            vy: (Math.random() - 0.5) * 220 * r.dpr,
            size: (Math.random() * 3 + 1) * r.dpr,
            hue: Math.random() * 360
        }));
        r.fill('#000000');
    }

    DD.definePattern('particles', {
        animated: true,
        init: seedParticles,
        resize: seedParticles,
        frame(r, dt) {
            const { ctx, width, height } = r;
            ctx.fillStyle = 'rgba(7, 7, 11, 0.12)';
            ctx.fillRect(0, 0, width, height);
            for (const p of particles) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.hue = (p.hue + 120 * dt) % 360;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;
                ctx.fillStyle = `hsla(${p.hue | 0}, 100%, 55%, 0.8)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });

    let drops = [];

    function seedRain(r) {
        const step = 18 * r.dpr;
        drops = Array.from({ length: Math.ceil(r.width / step) }, () => Math.random() * (r.height / step));
        r.fill('#000000');
    }

    DD.definePattern('matrix-rain', {
        animated: true,
        init: seedRain,
        resize: seedRain,
        frame(r, dt) {
            const { ctx, width, height, dpr } = r;
            const step = 18 * dpr;
            ctx.fillStyle = 'rgba(7, 7, 11, 0.08)';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#10b981';
            ctx.font = `${14 * dpr}px "JetBrains Mono", monospace`;
            ctx.textAlign = 'left';
            for (let i = 0; i < drops.length; i++) {
                const glyph = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
                ctx.fillText(glyph, i * step, drops[i] * step);
                if (drops[i] * step > height && Math.random() > 0.975) drops[i] = 0;
                drops[i] += 54 * dt;
            }
        }
    });

    let gradientAngle = 0;

    DD.definePattern('gradient-storm', {
        animated: true,
        init(r) {
            gradientAngle = 0;
            r.fill('#000000');
        },
        frame(r, dt) {
            const { ctx, width, height } = r;
            gradientAngle = (gradientAngle + 180 * dt) % 360;
            const rad = (gradientAngle * Math.PI) / 180;
            const dx = Math.cos(rad) * width;
            const dy = Math.sin(rad) * height;
            const grad = ctx.createLinearGradient(width / 2 + dx, height / 2 + dy, width / 2 - dx, height / 2 - dy);
            grad.addColorStop(0, `hsla(${gradientAngle}, 100%, 50%, 0.1)`);
            grad.addColorStop(0.5, `hsla(${(gradientAngle + 120) % 360}, 100%, 50%, 0.1)`);
            grad.addColorStop(1, `hsla(${(gradientAngle + 240) % 360}, 100%, 50%, 0.1)`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
        }
    });

    let rainbowHue = 0;

    DD.definePattern('rainbow', {
        animated: true,
        init() {
            rainbowHue = 0;
        },
        frame(r, dt) {
            const { ctx, width, height, dpr } = r;
            rainbowHue = (rainbowHue + 300 * dt) % 360;
            r.fill(`hsl(${rainbowHue | 0}, 100%, 40%)`);
            for (let i = 0; i < 15; i++) {
                ctx.fillStyle = `hsla(${(Math.random() * 360) | 0}, 100%, 50%, 0.6)`;
                ctx.fillRect(Math.random() * width, Math.random() * height, (40 + Math.random() * 120) * dpr, (40 + Math.random() * 120) * dpr);
            }
        }
    });

    const STROBE_INTERVAL = 0.1; // seconds per phase
    let strobeClock = 0;
    let strobeOn = false;

    DD.definePattern('strobe', {
        animated: true,
        init() {
            strobeClock = 0;
            strobeOn = false;
        },
        frame(r, dt) {
            strobeClock += dt;
            if (strobeClock >= STROBE_INTERVAL) {
                strobeClock %= STROBE_INTERVAL;
                strobeOn = !strobeOn;
            }
            r.fill(strobeOn ? '#FFFFFF' : '#000000');
        }
    });

    const CYCLE_SECONDS = 8;
    let cycleIndex = 0;
    let cycleClock = 0;

    function enterCycleStep(r) {
        const id = DD.AUTOCYCLE_SEQUENCE[cycleIndex];
        const sub = DD.patterns[id];
        if (sub.init) sub.init(r);
        const test = DD.getTest(id);
        r.setStatus(`Auto-Cycle: ${test ? test.title : id}`);
    }

    DD.definePattern('autocycle', {
        animated: true,
        init(r) {
            cycleIndex = 0;
            cycleClock = 0;
            enterCycleStep(r);
        },
        resize(r) {
            const sub = DD.patterns[DD.AUTOCYCLE_SEQUENCE[cycleIndex]];
            if (sub.resize) sub.resize(r);
        },
        frame(r, dt, now) {
            cycleClock += dt;
            if (cycleClock >= CYCLE_SECONDS) {
                cycleClock = 0;
                cycleIndex = (cycleIndex + 1) % DD.AUTOCYCLE_SEQUENCE.length;
                enterCycleStep(r);
            }
            DD.patterns[DD.AUTOCYCLE_SEQUENCE[cycleIndex]].frame(r, dt, now);
        }
    });
})(window.DD);
