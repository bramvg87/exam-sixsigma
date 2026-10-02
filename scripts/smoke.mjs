// Smoke test: open release file from file:// in Chrome, offline, visit every module, collect errors.
// Usage: node scripts/smoke.mjs [--shots]
import { chromium } from 'playwright-core';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, existsSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const argFile = process.argv.slice(2).find((a) => a.endsWith('.html'));
const file = pathToFileURL(argFile ? join(root, argFile) : join(root, 'release', 'sixsigma-toolkit.html')).href;
const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx > 0 ? process.argv[onlyIdx + 1].split(',') : null;
const shots = process.argv.includes('--shots');
const shotDir = join(root, 'scratch', only ? 'shots-' + only.join('-') : 'shots');
if (shots) mkdirSync(shotDir, { recursive: true });
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(existsSync);

const browser = await chromium.launch({ executablePath: exe, headless: true });
const ctx = await browser.newContext({ offline: true, viewport: { width: 1400, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
const requests = [];
page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text()));
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('request', (r) => !r.url().startsWith('file:') && !r.url().startsWith('data:') && requests.push(r.url()));
await page.goto(file);
await page.waitForSelector('.navlink');
const ids = await page.$$eval('.navlink', (as) => as.map((a) => a.dataset.id));
for (const id of ids.filter((i) => !only || only.includes(i))) {
  await page.goto(file + '#/' + id);
  await page.waitForTimeout(150);
  // click every tab in the module
  const tabs = await page.$$(`.module[data-module="${id}"] .tab`);
  for (let i = 0; i < tabs.length; i++) {
    await tabs[i].click();
    await page.waitForTimeout(80);
    const errs = await page.$$eval(`.module[data-module="${id}"] .pane:not([hidden]) .note.err`, (e) => e.map((x) => x.textContent));
    for (const e of errs) errors.push(`${id} tab ${i}: ${e}`);
    if (shots) await page.screenshot({ path: join(shotDir, `${id}-${i}.png`), fullPage: true });
  }
  if (!tabs.length) {
    const errs = await page.$$eval(`.module[data-module="${id}"] .note.err`, (e) => e.map((x) => x.textContent));
    for (const e of errs) errors.push(`${id}: ${e}`);
    if (shots) await page.screenshot({ path: join(shotDir, `${id}.png`), fullPage: true });
  }
}
// self-test status
await page.goto(file + '#/selftest');
await page.waitForTimeout(300);
const st = await page.textContent('.module[data-module="selftest"] .big');
console.log('selftest:', st);
console.log('modules:', ids.join(', '));
console.log('external requests:', requests.length ? requests : 'none');
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
await browser.close();
process.exit(errors.length || requests.length ? 1 : 0);
