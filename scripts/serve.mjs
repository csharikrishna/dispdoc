#!/usr/bin/env node
// Serve the site locally, mirroring the GitHub Pages path: http://localhost:8080/dispdoc/
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { startServer } from './lib/static-server.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 8080;
const base = '/dispdoc/';

await startServer({ root, port, base });
console.log(`DisplayDoctor Pro running at http://localhost:${port}${base}`);
console.log(`Studio:                      http://localhost:${port}${base}studio/`);
