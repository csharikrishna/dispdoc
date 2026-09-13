// Minimal zero-dependency static file server for local development and tests.
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/plain; charset=utf-8'
};

/**
 * Serve `root` under an optional URL `base` (e.g. "/dispdoc/" to mirror
 * GitHub Pages project sites).
 */
export function startServer({ root, port = 8080, base = '/' }) {
    const rootDir = resolve(root);

    const server = createServer((req, res) => {
        const url = new URL(req.url, 'http://localhost');
        let pathname = decodeURIComponent(url.pathname);

        if (!pathname.startsWith(base)) {
            res.writeHead(302, { Location: base });
            res.end();
            return;
        }
        pathname = pathname.slice(base.length - 1);

        let file = normalize(join(rootDir, pathname));
        if (file !== rootDir && !file.startsWith(rootDir + sep)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        if (existsSync(file) && statSync(file).isDirectory()) {
            if (!pathname.endsWith('/')) {
                res.writeHead(301, { Location: `${url.pathname}/` });
                res.end();
                return;
            }
            file = join(file, 'index.html');
        }

        if (!existsSync(file)) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }

        res.writeHead(200, {
            'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        createReadStream(file).pipe(res);
    });

    return new Promise((resolvePromise, reject) => {
        server.once('error', reject);
        server.listen(port, () => resolvePromise(server));
    });
}
