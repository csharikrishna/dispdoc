#!/usr/bin/env node
/**
 * Browser smoke test: loads the landing page and studio in headless Chrome and
 * exercises every test pattern, hotkeys, Test All, the wizard, and the report.
 *
 * Requires a local Chrome/Chromium. Set CHROME_PATH if it is not auto-detected.
 * Set SCREENSHOT_DIR to save screenshots of key states.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { startServer } from './lib/static-server.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 8791;
const BASE = `http://localhost:${PORT}/panelprobe/`;
const SHOTS = process.env.SCREENSHOT_DIR ? resolve(process.env.SCREENSHOT_DIR) : null;

function findChrome() {
    const candidates = [
        process.env.CHROME_PATH,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser'
    ].filter(Boolean);
    return candidates.find((p) => existsSync(p));
}

const failures = [];
let passed = 0;

function check(name, condition, detail = '') {
    if (condition) {
        passed++;
        console.log(`  ✓ ${name}`);
    } else {
        failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
        console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
    }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function openPage(browser, path, viewport) {
    const page = await browser.newPage();
    const problems = [];
    page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
        if (msg.type() === 'error') problems.push(`console.error: ${msg.text()}`);
    });
    page.on('response', (res) => {
        if (res.status() >= 400) problems.push(`HTTP ${res.status()}: ${res.url()}`);
    });
    page.on('requestfailed', (req) => {
        if (!req.url().startsWith('blob:')) problems.push(`request failed: ${req.url()}`);
    });
    await page.setViewport(viewport);
    await page.goto(BASE + path, { waitUntil: 'networkidle0' });
    return { page, problems };
}

async function shot(page, name) {
    if (!SHOTS) return;
    mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: join(SHOTS, `${name}.png`) });
}

/** Summarize the canvas: mean luminance, variance, and a coarse hash. */
function canvasStats(page) {
    return page.evaluate(() => {
        const c = document.getElementById('displayCanvas');
        const probe = document.createElement('canvas');
        probe.width = 64;
        probe.height = 36;
        const pctx = probe.getContext('2d');
        pctx.drawImage(c, 0, 0, probe.width, probe.height);
        const d = pctx.getImageData(0, 0, probe.width, probe.height).data;
        let sum = 0;
        let sq = 0;
        let hash = 0;
        const n = d.length / 4;
        for (let i = 0; i < d.length; i += 4) {
            const l = (d[i] + d[i + 1] + d[i + 2]) / 3;
            sum += l;
            sq += l * l;
            hash = (hash * 31 + d[i] * 7 + d[i + 1] * 3 + d[i + 2]) >>> 0;
        }
        const mean = sum / n;
        return { mean, variance: sq / n - mean * mean, hash, width: c.width, height: c.height };
    });
}

async function testLanding(browser) {
    console.log('\nLanding page');
    const { page, problems } = await openPage(browser, '', { width: 1440, height: 900 });
    check('loads without errors', problems.length === 0, problems.join('; '));

    const specs = await page.$$eval('[data-display]', (els) => els.map((e) => e.textContent.trim()));
    check('display info is populated', specs.length >= 4 && specs.every((t) => t && t !== '—'), JSON.stringify(specs));

    const themeBefore = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.click('[data-theme-toggle]');
    const themeAfter = await page.evaluate(() => document.documentElement.dataset.theme);
    check('theme toggle switches theme', themeBefore !== themeAfter);
    await page.click('[data-theme-toggle]');

    const catalogCount = await page.$$eval('[data-test-list] li', (els) => els.length);
    check('test catalog lists tests', catalogCount > 20, `found ${catalogCount}`);
    await shot(page, 'landing-desktop');

    await page.setViewport({ width: 390, height: 844 });
    await sleep(200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('no horizontal overflow at 390px', overflow <= 0, `overflow ${overflow}px`);
    await shot(page, 'landing-mobile');
    await page.close();
}

async function testStudio(browser) {
    console.log('\nStudio');
    const { page, problems } = await openPage(browser, 'studio/', { width: 1440, height: 900 });
    check('loads without errors', problems.length === 0, problems.join('; '));

    check('safety advisory is shown on load', await page.$eval('#warningModal', (el) => !el.hidden));
    check('step 2 is locked until fullscreen', await page.$eval('#acceptWarningBtn', (el) => el.disabled));
    await shot(page, 'studio-safety-gate');
    await page.click('#btnProceedWindowed');
    check('windowed bypass closes advisory', await page.$eval('#warningModal', (el) => el.hidden));

    // Auto fullscreen would enable the viewport fallback in headless mode; keep tests windowed.
    await page.$eval('#autoFullscreenCheck', (el) => { el.checked = false; });

    const registry = await page.evaluate(() => DD.TESTS.map((t) => ({ id: t.id, key: t.key, animated: !!DD.patterns[t.id]?.animated })));
    const cards = await page.$$eval('.test-card', (els) => els.map((e) => e.dataset.test));
    check('one card per registered test', cards.length === registry.length, `${cards.length} cards / ${registry.length} tests`);
    await shot(page, 'studio-dashboard');

    const size = await canvasStats(page);
    const dpr = await page.evaluate(() => window.devicePixelRatio);
    check('canvas backing store matches device pixels', size.width === Math.round(1440 * dpr) && size.height === Math.round(900 * dpr), `${size.width}x${size.height}`);

    console.log('\n  Patterns');
    // near-black defaults to 0% gray; strobe alternates with full-black frames.
    const nearlyBlack = new Set(['oled-black', 'near-black', 'backlight-bleed']);
    const domDriven = new Set(['pixel-reviver']);
    for (const t of registry) {
        const before = problems.length;
        await page.evaluate((id) => DD.App.start(id), t.id);
        await sleep(t.animated ? 250 : 120);
        let a = await canvasStats(page);
        let ok = problems.length === before && (await page.evaluate(() => DD.App.currentTest)) === t.id;
        let detail = problems.slice(before).join('; ');

        if (t.id === 'strobe') {
            for (let i = 0; i < 6 && a.mean < 128; i++) {
                await sleep(45);
                a = await canvasStats(page);
            }
        }
        if (!nearlyBlack.has(t.id) && !domDriven.has(t.id) && a.variance < 1 && a.mean < 2) {
            ok = false;
            detail += ' canvas is blank';
        }
        if (t.animated && !domDriven.has(t.id)) {
            let changed = false;
            for (let i = 0; i < 5 && !changed; i++) {
                await sleep(70);
                changed = (await canvasStats(page)).hash !== a.hash;
            }
            if (!changed) {
                ok = false;
                detail += ' animation did not change the frame';
            }
        }
        check(`${t.id} renders`, ok, detail.trim());
        if (['gamma', 'sharpness', 'ufo-motion', 'subpixel'].includes(t.id)) await shot(page, `pattern-${t.id}`);
    }
    await page.evaluate(() => DD.App.stop());

    console.log('\n  Keyboard');
    await page.keyboard.press('2');
    check('"2" starts near-black', (await page.evaluate(() => DD.App.currentTest)) === 'near-black');
    const hudVisible = () => page.$eval('#testRunnerBar', (el) => !el.hidden && getComputedStyle(el).visibility === 'visible');
    await page.mouse.move(720, 150);
    await sleep(900);
    check('HUD is hidden while the pointer is away', !(await hudVisible()));
    await shot(page, 'studio-hud-hidden');
    await page.mouse.move(720, 860, { steps: 5 });
    await sleep(350);
    check('HUD appears when the pointer moves near it', await hudVisible());
    await shot(page, 'studio-hud');
    await page.mouse.move(720, 150, { steps: 5 });
    // Hide delay (600 ms) + fade (220 ms), with headroom for slow CI machines.
    await sleep(1600);
    check('HUD hides again after the pointer leaves', !(await hudVisible()));
    await page.keyboard.press('h');
    await sleep(300);
    check('"h" pins the HUD', await hudVisible());
    await page.keyboard.press('h');
    await page.keyboard.press('ArrowRight');
    check('ArrowRight moves to the next test', (await page.evaluate(() => DD.App.currentTest)) === 'burnin');
    await page.keyboard.press('Space');
    check('Space pauses', await page.evaluate(() => DD.App.isPaused()));
    await sleep(300);
    check('HUD stays visible while paused', await hudVisible());
    await shot(page, 'studio-hud-paused');
    await page.keyboard.press('s');
    check('"s" toggles the performance panel, not a test', (await page.$eval('#statsPanel', (el) => !el.hidden)) && (await page.evaluate(() => DD.App.currentTest)) === 'burnin');
    await page.keyboard.press('s');
    await page.keyboard.press('n');
    check('"n" starts TV static', (await page.evaluate(() => DD.App.currentTest)) === 'tv-static');
    const mutedBefore = await page.evaluate(() => DD.Audio.isMuted());
    await page.keyboard.press('m');
    check('"m" toggles mute', (await page.evaluate(() => DD.Audio.isMuted())) !== mutedBefore);
    await page.keyboard.press('Escape');
    check('Escape stops the test', (await page.evaluate(() => DD.App.currentTest)) === null);
    check('dashboard is restored', await page.$eval('#dashboardView', (el) => getComputedStyle(el).display !== 'none'));

    console.log('\n  Test All');
    await page.click('.btn-primary-action[data-action="test-all"]');
    const firstSuite = await page.evaluate(() => DD.suiteTests()[0].id);
    check('Test All starts with the first suite test', (await page.evaluate(() => DD.App.currentTest)) === firstSuite);
    check('progress badge is shown', await page.$eval('#testAllBadge', (el) => !el.hidden));
    await page.keyboard.press('h');
    await sleep(1200);
    check('progress line advances', (await page.$eval('#runnerProgressFill', (el) => el.style.transform)) !== 'scaleX(0)');
    await shot(page, 'studio-hud-suite');
    await page.click('#btnNextTest');
    check('Next advances within the suite', (await page.$eval('#testAllStepText', (el) => el.textContent)).startsWith('2/'));
    await page.keyboard.press('Escape');
    check('Escape ends Test All', (await page.evaluate(() => DD.Suite.isActive())) === false && (await page.$eval('#testAllBadge', (el) => el.hidden)));

    console.log('\n  Wizard & report');
    await page.click('.btn-secondary-action[data-action="wizard"]');
    check('wizard banner opens', await page.$eval('#wizardBanner', (el) => !el.hidden));
    await shot(page, 'studio-wizard');
    const steps = await page.evaluate(() => DD.Wizard.STEPS.length);
    for (let i = 0; i < steps; i++) {
        await page.click(i === 1 ? '#wizHasIssueBtn' : '#wizNoIssuesBtn');
        await sleep(30);
    }
    check('report opens after the last step', await page.$eval('#reportModal', (el) => !el.hidden));
    check('report lists every wizard step', (await page.$$eval('#reportBodyTable tr', (rows) => rows.length)) === steps);
    check('one issue gives grade B', (await page.$eval('#reportGrade', (el) => el.textContent)) === 'B');
    check('issue advice is included', (await page.$$eval('#reportRecommendations li', (els) => els.length)) === 1);
    await shot(page, 'studio-report');
    await page.keyboard.press('Escape');
    check('Escape closes the report', await page.$eval('#reportModal', (el) => el.hidden));

    check('no runtime errors during the run', problems.length === 0, problems.join('; '));

    console.log('\n  Mobile layout');
    // Switching to a mobile viewport reloads the page; the advisory is once per session.
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.waitForFunction(() => window.DD && DD.App && document.querySelector('.test-card'));
    check('advisory is not repeated on reload in the same session', await page.$eval('#warningModal', (el) => el.hidden));
    await page.$eval('#autoFullscreenCheck', (el) => { el.checked = false; });
    await sleep(300);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check('no horizontal overflow at 390px', overflow <= 0, `overflow ${overflow}px`);
    await shot(page, 'studio-mobile');
    await page.evaluate(() => DD.App.start('near-black'));
    await sleep(200);
    await page.touchscreen.tap(195, 400);
    await sleep(350);
    check('tap shows the HUD on touch screens', await page.$eval('#testRunnerBar', (el) => getComputedStyle(el).visibility === 'visible'));
    const hudOverflow = await page.$eval('#testRunnerBar', (el) => el.getBoundingClientRect().right - window.innerWidth);
    check('mobile HUD fits the screen', hudOverflow <= 0, `overflow ${hudOverflow}px`);
    await shot(page, 'studio-mobile-hud');
    await page.close();
}

const chrome = findChrome();
if (!chrome) {
    console.error('Chrome/Chromium not found. Set CHROME_PATH to run the smoke test.');
    process.exit(1);
}

const server = await startServer({ root: ROOT, port: PORT, base: '/panelprobe/' });
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });

try {
    const only = process.env.ONLY;
    if (!only || only === 'landing') await testLanding(browser);
    if (!only || only === 'studio') await testStudio(browser);
} catch (err) {
    failures.push(`crashed: ${err.stack || err}`);
    console.error(err);
} finally {
    await browser.close();
    server.close();
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
    console.log(failures.map((f) => `  - ${f}`).join('\n'));
    process.exit(1);
}
