# DisplayDoctor Pro v4.0

> **Ultimate Mobile & Desktop Display Diagnostics, Motion Pursuit Benchmark, and Calibration Suite.**  
> Engineered for phones, tablets, laptops, and ultra-high refresh gaming monitors (60Hz – 360Hz+).  
> 100% standalone, zero-dependency, and ready for **GitHub Pages**.

---

## 📱 Mobile & Tablet Features
- **Touch Swipe Navigation**: Swipe left or right on the canvas to cycle through tests.
- **Double-Tap Controls**: Double-tap anywhere to hide or show the HUD.
- **Touch Reviver Box**: Drag the 60Hz stuck pixel exerciser box directly with your finger over lazy subpixels.
- **Status Bar & Notch Burn-In**: High-sensitivity 50% neutral gray field with simulated iPhone Dynamic Island / notch and status bar boundaries to detect permanent battery, clock, and home bar burn-in.
- **Touch Digitizer & Uniformity Grid**: 60-point touch tracking grid to identify dead touch areas or ghost touches.
- **PWM Eye Strain / Shutter Test**: Visualizes pulse-width modulation dimming flicker through phone cameras.
- **Mobile Bottom Bar**: Ergonomic bottom navigation pill tailored for one-handed phone use.
- **Safe-Area Support**: Full compatibility with device notches, home swipe indicators, and dynamic islands (`viewport-fit=cover`).

---

## 🖥️ Desktop & Gaming Monitor Features
- **OLED 0-Nit True Black**: Verifies individual pixel shutoff and absolute contrast.
- **Near-Black Gray Uniformity (1% – 20% IRE)**: Exposes vertical banding, mura, and near-black flashing artifacts.
- **UFO Motion Pursuit & Ghosting**: BlurBusters-style multi-tiered pursuit test at customizable speeds (120 to 1440 px/s) to evaluate GtG response times and overdrive overshoot.
- **Backlight Bleed & IPS Glow**: Pinpoints corner bezel pressure bleed and distinguishes it from angle-dependent IPS glow.
- **1:1 Native Sharpness Grid**: 1px checkerboard and concentric rings to detect scaling distortion and HDMI chroma subsampling (4:4:4 vs 4:2:2).
- **Fast TV Static & RGB Noise**: Hardware-accelerated bitwise XorShift32 PRNG running at 240Hz+ with zero CPU bottleneck.
- **Gamma 2.2 & Clipping Calibration**: Grayscale 32 steps, Level 0–25 black shadow clipping, and Level 230–255 highlight clipping.
- **Certified Health Report**: Generates panel rating (A+, A, B, etc.) and exports to printable PDF or JSON.

---

## ⌨️ Desktop Keyboard Shortcuts

| Key | Action |
| :---: | :--- |
| **`Space`** | Pause / Resume current test |
| **`F`** | Toggle Fullscreen |
| **`H`** | Hide / Show Controls HUD |
| **`S`** | Toggle Telemetry Panel |
| **`M`** | Toggle Audio Sound Effects |
| **`ESC`** | Stop Test / Return to Standby |
| **`1` – `6`** | Instant OLED Suite Shortcuts (True Black, Near-Black, Burn-In, Reviver, Subpixel, ABL) |
| **`7` – `0`** | Instant IPS Suite Shortcuts (UFO Motion, Backlight Bleed, Viewing Angle, Sharpness) |

---

## 🌐 Deploy to GitHub Pages

1. Create a new repository on GitHub (e.g., `displaydoctor`).
2. Push the files in this folder (`index.html`, `styles.css`, `app.js`, `README.md`) to the `main` branch.
3. In GitHub, go to **Settings** > **Pages**.
4. Under **Branch**, select `main` and `/ (root)`, then click **Save**.
5. Your display diagnostic suite is live instantly!
