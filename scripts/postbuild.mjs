// Postbuild: verify the single file has no external references, then copy to release/.
import { readFileSync, copyFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'dist', 'index.html');
const html = readFileSync(out, 'utf8');

const problems = [];
if (/<script[^>]+src=/i.test(html)) problems.push('external <script src>');
if (/<link[^>]+rel=["']?stylesheet[^>]+href=/i.test(html)) problems.push('external stylesheet');
if (/url\((?!data:|["']?data:|#)[^)]*\.(woff2?|ttf|png|svg|jpg)/i.test(html)) problems.push('external url() asset');
if (!html.includes("default-src 'none'")) problems.push('CSP meta tag missing');
if (/—|–/.test(html.replace(/<script[\s\S]*?<\/script>/g, ''))) console.warn('warning: em/en-dash found in markup');
if (problems.length) {
  console.error('postbuild FAILED:', problems);
  process.exit(1);
}
mkdirSync(join(root, 'release'), { recursive: true });
copyFileSync(out, join(root, 'release', 'sixsigma-toolkit.html'));
console.log(`postbuild ok: ${(statSync(out).size / 1024 / 1024).toFixed(2)} MB -> release/sixsigma-toolkit.html`);
