#!/usr/bin/env node
/**
 * Static consistency checks (no browser, no dependencies):
 *   • test registry ↔ renderers ↔ HUD controls ↔ icons
 *   • hotkeys are unique and don't clash with studio shortcuts
 *   • landing page catalog matches the registry
 *   • no duplicate element ids; every id referenced from studio JS exists
 *   • every local src/href/url() resolves, and no third-party resources load
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const errors = [];
const fail = (msg) => errors.push(msg);

// ---------------------------------------------------------------------------
// Load registry, icons and pattern modules in a sandbox
// ---------------------------------------------------------------------------
const sandbox = { window: {}, console };
sandbox.window.DD = {};
vm.createContext(sandbox);
[
    'assets/js/shared/icons.js',
    'studio/js/tests/registry.js',
    'studio/js/tests/pattern-kit.js',
    ...readdirSync(join(ROOT, 'studio/js/tests')).filter((f) => f.startsWith('patterns-')).map((f) => `studio/js/tests/${f}`)
].forEach((file) => vm.runInContext(read(file), sandbox, { filename: file }));

const DD = sandbox.window.DD;
const studioHtml = read('studio/index.html');
const landingHtml = read('index.html');

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
const categoryIds = new Set(DD.CATEGORIES.map((c) => c.id));
const seenIds = new Set();
const seenKeys = new Map();
const fallbackIcon = DD.icon('__missing__');

for (const t of DD.TESTS) {
    const where = `test "${t.id}"`;
    for (const field of ['id', 'key', 'category', 'icon', 'title', 'desc', 'meta']) {
        if (!t[field]) fail(`${where}: missing "${field}"`);
    }
    if (typeof t.suite !== 'boolean') fail(`${where}: "suite" must be true or false`);
    if (seenIds.has(t.id)) fail(`${where}: duplicate id`);
    seenIds.add(t.id);

    if (t.key.length !== 1 || t.key !== t.key.toLowerCase()) fail(`${where}: key must be one lowercase character`);
    if (DD.RESERVED_KEYS.includes(t.key)) fail(`${where}: key "${t.key}" is reserved for a studio shortcut`);
    if (seenKeys.has(t.key)) fail(`${where}: key "${t.key}" already used by "${seenKeys.get(t.key)}"`);
    seenKeys.set(t.key, t.id);

    if (!categoryIds.has(t.category)) fail(`${where}: unknown category "${t.category}"`);
    if (t.icon !== 'grid' && DD.icon(t.icon) === fallbackIcon) fail(`${where}: unknown icon "${t.icon}"`);
    if (t.controls && !studioHtml.includes(`id="${t.controls}"`)) fail(`${where}: controls "#${t.controls}" not found in studio/index.html`);

    const pattern = DD.patterns[t.id];
    if (!pattern) {
        fail(`${where}: no renderer registered with DD.definePattern`);
    } else if (pattern.animated && typeof pattern.frame !== 'function') {
        fail(`${where}: animated pattern needs frame()`);
    } else if (!pattern.animated && typeof pattern.draw !== 'function') {
        fail(`${where}: static pattern needs draw()`);
    }
}

for (const id of Object.keys(DD.patterns)) {
    if (!seenIds.has(id)) fail(`renderer "${id}" has no registry entry`);
}
for (const id of DD.AUTOCYCLE_SEQUENCE) {
    if (!DD.patterns[id]?.animated) fail(`AUTOCYCLE_SEQUENCE: "${id}" must be an animated pattern`);
}

// ---------------------------------------------------------------------------
// Landing catalog ↔ registry
// ---------------------------------------------------------------------------
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

for (const cat of DD.CATEGORIES) {
    const match = landingHtml.match(new RegExp(`<ul[^>]*data-test-list="${cat.id}"[^>]*>([\\s\\S]*?)</ul>`));
    if (!match) {
        fail(`index.html: missing catalog list data-test-list="${cat.id}"`);
        continue;
    }
    const items = [...match[1].matchAll(/<li><kbd>([^<]+)<\/kbd>\s*([^<]+)<\/li>/g)].map((m) => `${m[1].toLowerCase()} ${decode(m[2])}`);
    const expected = DD.TESTS.filter((t) => t.category === cat.id).map((t) => `${t.key} ${t.title}`);
    if (items.join('|') !== expected.join('|')) {
        fail(`index.html: "${cat.id}" catalog is out of sync with the registry\n      expected: ${expected.join(', ')}\n      found:    ${items.join(', ')}`);
    }
}

const total = DD.TESTS.length;
const suite = DD.TESTS.filter((t) => t.suite).length;
if (!landingHtml.includes(`${total} Tests`)) fail(`index.html: catalog heading should mention "${total} Tests"`);
if (!landingHtml.includes(`the ${suite} non-strobe tests`)) fail(`index.html: Test All description should mention ${suite} tests`);

// ---------------------------------------------------------------------------
// Element ids
// ---------------------------------------------------------------------------
function ids(html) {
    return [...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
}

for (const [file, html] of [['index.html', landingHtml], ['studio/index.html', studioHtml]]) {
    const list = ids(html);
    const dupes = list.filter((id, i) => list.indexOf(id) !== i);
    if (dupes.length) fail(`${file}: duplicate ids: ${[...new Set(dupes)].join(', ')}`);
}

const studioIds = new Set(ids(studioHtml));
const jsFiles = [];
(function walk(dir) {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (name.endsWith('.js')) jsFiles.push(full);
    }
})(join(ROOT, 'studio/js'));

for (const file of jsFiles) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/(?:getElementById|\$)\('([A-Za-z][\w-]*)'\)/g)) {
        if (!studioIds.has(m[1])) fail(`${relative(ROOT, file)}: references #${m[1]}, which is not in studio/index.html`);
    }
}

// ---------------------------------------------------------------------------
// Local references & third-party resources
// ---------------------------------------------------------------------------
function checkRefs(file, content, attrPattern) {
    const base = dirname(join(ROOT, file));
    for (const m of content.matchAll(attrPattern)) {
        const ref = m[1].split(/[?#]/)[0];
        if (!ref || /^(https?:|mailto:|data:|#)/.test(m[1])) continue;
        if (!existsSync(join(base, ref))) fail(`${file}: broken reference "${m[1]}"`);
    }
}

for (const file of ['index.html', 'studio/index.html']) {
    const html = read(file);
    checkRefs(file, html, /\s(?:src|href)="([^"]+)"/g);
    for (const m of html.matchAll(/<(?:script|link|img)\b[^>]*\s(?:src|href)="(https?:[^"]+)"/g)) {
        if (!/rel="canonical"/.test(m[0])) fail(`${file}: loads third-party resource ${m[1]}`);
    }
}
for (const file of ['assets/css/base.css', 'assets/css/landing.css', 'studio/css/studio.css']) {
    const css = read(file);
    checkRefs(file, css, /url\(['"]?([^'")]+)['"]?\)/g);
    if (/url\(['"]?https?:/.test(css) || /@import\s+url\(['"]?https?:/.test(css)) fail(`${file}: loads a third-party resource`);
}

// ---------------------------------------------------------------------------
if (errors.length) {
    console.error(`✗ ${errors.length} problem${errors.length === 1 ? '' : 's'} found:\n`);
    errors.forEach((e) => console.error(`  • ${e}`));
    process.exit(1);
}
console.log(`✓ All checks passed (${total} tests, ${suite} in Test All, ${Object.keys(DD.patterns).length} renderers)`);
