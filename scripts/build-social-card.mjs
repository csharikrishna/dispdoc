#!/usr/bin/env node
/**
 * Renders assets/social-card.png (1200×630), the Open Graph / Twitter preview
 * image, from an HTML template using the project's own fonts and logo.
 * Run after changing branding: `npm run social-card`.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const b64 = (p) => readFileSync(join(ROOT, p)).toString('base64');

const chrome = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium'
].filter(Boolean).find((p) => existsSync(p));

if (!chrome) {
    console.error('Chrome not found. Set CHROME_PATH.');
    process.exit(1);
}

const swatches = ['#000000', '#1a1a1a', '#404040', '#808080', '#ff0000', '#00ff00', '#0000ff', '#ffffff'];

const html = `<!DOCTYPE html><html><head><style>
@font-face { font-family: Inter; font-weight: 400 800; src: url(data:font/woff2;base64,${b64('assets/fonts/inter-latin-var.woff2')}) format('woff2'); }
@font-face { font-family: 'JetBrains Mono'; font-weight: 400 700; src: url(data:font/woff2;base64,${b64('assets/fonts/jetbrains-mono-latin-var.woff2')}) format('woff2'); }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #08090d; color: #f1f5f9; font-family: Inter, sans-serif; overflow: hidden; position: relative; }
.glow { position: absolute; inset: -200px -100px auto auto; width: 760px; height: 760px; background: radial-gradient(circle, rgba(0,229,255,.16), rgba(167,139,250,.08) 45%, transparent 70%); }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size: 40px 40px; }
.wrap { position: relative; padding: 72px 80px; height: 100%; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 18px; font-size: 40px; font-weight: 800; letter-spacing: -.02em; }
.brand img { width: 64px; height: 64px; }
.accent { color: #00e5ff; }
h1 { margin-top: 56px; font-size: 68px; line-height: 1.06; font-weight: 800; letter-spacing: -.035em; max-width: 900px; }
h1 span { background: linear-gradient(120deg, #00e5ff, #a78bfa); -webkit-background-clip: text; color: transparent; }
p { margin-top: 24px; font-size: 26px; color: #94a3b8; max-width: 860px; }
.foot { margin-top: auto; display: flex; align-items: center; justify-content: space-between; }
.pills { display: flex; gap: 12px; font-family: 'JetBrains Mono', monospace; font-size: 19px; }
.pill { padding: 8px 16px; border: 1px solid rgba(255,255,255,.14); border-radius: 999px; color: #cbd5e1; background: rgba(255,255,255,.04); }
.sw { display: flex; gap: 0; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,.14); }
.sw i { width: 34px; height: 34px; display: block; }
</style></head><body>
<div class="glow"></div><div class="grid"></div>
<div class="wrap">
  <div class="brand"><img src="data:image/svg+xml;base64,${b64('assets/logo.svg')}" alt=""><span>Panel<span class="accent">Probe</span></span></div>
  <h1>Pixel-perfect display tests,<br><span>right in your browser.</span></h1>
  <p>26 lossless test patterns for OLED black, dead pixels, motion clarity, gamma &amp; banding. Free and open source.</p>
  <div class="foot">
    <div class="pills"><span class="pill">No install</span><span class="pill">No tracking</span><span class="pill">MIT</span></div>
    <div class="sw">${swatches.map((c) => `<i style="background:${c}"></i>`).join('')}</div>
  </div>
</div></body></html>`;

const browser = await puppeteer.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(ROOT, 'assets/social-card.png'), type: 'png' });
await browser.close();
console.log('Wrote assets/social-card.png');
