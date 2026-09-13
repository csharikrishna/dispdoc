/**
 * DisplayDoctor Pro — OLED & uniformity patterns.
 */
(function (DD) {
    'use strict';

    DD.definePattern('oled-black', {
        draw(r) {
            r.fill('#000000');
        }
    });

    DD.definePattern('near-black', {
        draw(r) {
            const ire = r.settings.ireLevel;
            const v = Math.round((ire / 100) * 255);
            r.fill(`rgb(${v}, ${v}, ${v})`);
            r.caption(`NEAR-BLACK UNIFORMITY // ${ire}% (RGB ${v},${v},${v})`, ire <= 5 ? '#4b5563' : '#000000');
        }
    });

    const BURNIN_COLORS = [
        ['#FF0000', 'RED'], ['#00FF00', 'GREEN'], ['#0000FF', 'BLUE'], ['#FFFFFF', 'WHITE'],
        ['#FFFF00', 'YELLOW'], ['#00FFFF', 'CYAN'], ['#FF00FF', 'MAGENTA'], ['#808080', 'GRAY 50%']
    ];
    let burninIndex = 0;

    DD.definePattern('burnin', {
        draw(r) {
            const [color, name] = BURNIN_COLORS[burninIndex];
            r.fill(color);
            const light = color === '#FFFFFF' || color === '#FFFF00' || color === '#00FFFF' || color === '#00FF00';
            r.caption(`${name} // ${burninIndex + 1} OF ${BURNIN_COLORS.length} // CLICK OR TAP TO CYCLE`, light ? '#000000' : '#FFFFFF');
        },
        onTap(r) {
            burninIndex = (burninIndex + 1) % BURNIN_COLORS.length;
            DD.Audio.click();
            this.draw(r);
        }
    });

    const REVIVER_COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFFFF', '#000000'];
    let reviverFrame = 0;

    DD.definePattern('pixel-reviver', {
        animated: true,
        // settings.reviver is a box size in CSS px, or 'fullscreen'.
        init(r) {
            r.fill('#000000');
            const box = document.getElementById('pixelReviver');
            if (!box) return;
            const fullscreen = r.settings.reviver === 'fullscreen';
            box.hidden = fullscreen;
            if (!fullscreen) {
                box.style.width = `${r.settings.reviver}px`;
                box.style.height = `${r.settings.reviver}px`;
            }
        },
        frame(r) {
            reviverFrame = (reviverFrame + 1) % REVIVER_COLORS.length;
            const color = REVIVER_COLORS[reviverFrame];
            if (r.settings.reviver === 'fullscreen') {
                r.fill(color);
            } else {
                const box = document.getElementById('pixelReviver');
                if (box) box.style.backgroundColor = color;
            }
        },
        cleanup() {
            const box = document.getElementById('pixelReviver');
            if (box) box.hidden = true;
        }
    });

    const SAMPLE = 'The quick brown fox jumps over the lazy dog. 0123456789 AaBbCcDdEe';

    DD.definePattern('subpixel', {
        draw(r) {
            const { ctx, width, height, dpr } = r;
            const mode = r.settings.subpixelType;

            if (mode === 'text') {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, Math.floor(width / 2), height);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(Math.floor(width / 2), 0, width - Math.floor(width / 2), height);

                const x1 = 24 * dpr;
                const x2 = width / 2 + 24 * dpr;
                r.text('WHITE ON BLACK', x1, 70 * dpr, { size: 13, weight: 700, align: 'left', color: '#FFFFFF', mono: false });
                r.text('BLACK ON WHITE', x2, 70 * dpr, { size: 13, weight: 700, align: 'left', color: '#000000', mono: false });
                const sizes = [10, 11, 12, 13, 14, 16, 18, 22];
                let y = 104 * dpr;
                sizes.forEach((size) => {
                    r.text(`${size}px ${SAMPLE}`, x1, y, { size, weight: 400, align: 'left', color: '#FFFFFF', mono: false });
                    r.text(`${size}px ${SAMPLE}`, x2, y, { size, weight: 400, align: 'left', color: '#000000', mono: false });
                    y += (size + 12) * dpr;
                });
            } else if (mode === 'rgb' || mode === 'bgr') {
                const colors = mode === 'rgb' ? ['#FF0000', '#00FF00', '#0000FF'] : ['#0000FF', '#00FF00', '#FF0000'];
                for (let i = 0; i < 3; i++) {
                    ctx.fillStyle = colors[i];
                    for (let x = i; x < width; x += 3) ctx.fillRect(x, 0, 1, height);
                }
            } else {
                const img = ctx.createImageData(width, height);
                const buf = new Uint32Array(img.data.buffer);
                for (let y = 0; y < height; y++) {
                    const row = y * width;
                    for (let x = 0; x < width; x++) {
                        buf[row + x] = ((x + y) & 1) ? 0xFF000000 : 0xFFFFFFFF;
                    }
                }
                ctx.putImageData(img, 0, 0);
            }
        }
    });

    DD.definePattern('abl', {
        draw(r) {
            r.fill('#000000');
            const fraction = Math.sqrt(r.settings.aplLevel / 100);
            const w = Math.round(r.width * fraction);
            const h = Math.round(r.height * fraction);
            r.ctx.fillStyle = '#FFFFFF';
            r.ctx.fillRect(Math.round((r.width - w) / 2), Math.round((r.height - h) / 2), w, h);
            if (r.settings.aplLevel < 100) r.caption(`ABL WINDOW // ${r.settings.aplLevel}% OF SCREEN AREA`);
        }
    });
})(window.DD);
