// End-to-end checks: exam "Laad in tool" buttons and Excel-style paste into the grid.
import { chromium } from 'playwright-core';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const argFile = process.argv.slice(2).find((a) => a.endsWith('.html'));
const file = pathToFileURL(join(root, argFile ?? 'release/sixsigma-toolkit.html')).href;
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = await b.newContext({ offline: true });
const p = await ctx.newPage();
const fails = [];
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
async function examLoad(label, mod, expect) {
  await p.goto(file + '#/examen');
  await p.waitForTimeout(200);
  await p.click(`text=Laad in tool: ${label}`);
  await p.waitForTimeout(300);
  const txt = await p.textContent(`.module[data-module="${mod}"] .pane:not([hidden])`);
  for (const e of expect) if (!txt.includes(e)) fails.push(`${label}: missing "${e}"`);
}
await examLoad('F-toets / BI verhouding', 'hypothese', ['0,3305', '1,239', 'M1 werkt nauwkeuriger']);
await examLoad('Cp/Cpk', 'capabiliteit', ['0,6667', '2,278%', '2,275%']);
await examLoad('σ uit P(C<720)=5%', 'verdelingen', ['60,8', '3696']);
await examLoad('Confusion matrices A/B/C', 'ml', ['96,5%', 'hoge variantie', 'hoge bias']);
// paste test into the t-test grid
await p.goto(file + '#/hypothese/t');
await p.waitForTimeout(200);
await p.click('.module[data-module="hypothese"] .pane:not([hidden]) .seg-btn:has-text("Ruwe data")');
const tsv = 'meting\r\n10,06\r\n9,89\r\n9,9\r\n9,99\r\n9,87\r\n9,88\r\n9,93\r\n9,98\r\n10,12\r\n9,86\r\n9,89\r\n9,81\r\n9,95\r\n9,92\r\n10,07\r\n9,98\r\n10,02\r\n9,62\r\n9,96\r\n9,86\r\n\r\n';
await p.evaluate((t) => {
  const pane = document.querySelector('.module[data-module="hypothese"] .pane:not([hidden])');
  const sink = pane.querySelector('.grid-sink');
  // clear and select A1
  sink.focus();
  const dt = new DataTransfer();
  dt.setData('text/plain', t);
  sink.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
}, tsv);
await p.waitForTimeout(300);
const t = await p.textContent('.module[data-module="hypothese"] .pane:not([hidden]) .result');
for (const e of ['-2,985', '0,003807', '9,981']) if (!t.includes(e)) fails.push(`paste t-test: missing ${e}`);
const head = await p.inputValue('.module[data-module="hypothese"] .pane:not([hidden]) .grid-head');
if (head !== 'meting') fails.push('paste: header row not used as header: ' + head);
console.log(fails.length || errs.length ? 'E2E FAIL\n' + [...fails, ...errs].join('\n') : 'e2e ok');
await b.close();
process.exit(fails.length || errs.length ? 1 : 0);
