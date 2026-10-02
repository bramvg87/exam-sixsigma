// DOM helpers, number formatting, settings, persistence.
import katex from 'katex';

type Child = Node | string | number | null | undefined | false | Child[];
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, any> | null = null, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k in el && typeof v !== 'string') (el as any)[k] = v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  append(el, children);
  return el;
}
function append(el: Node, children: Child[]) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
}
export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector(sel) as T | null;

// ---------- persistence ----------
const memStore: Record<string, any> = {};
const LS_KEY = 'sixsigma-toolkit-v1';
let lsOk = true;
try {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) Object.assign(memStore, JSON.parse(raw));
} catch {
  lsOk = false;
}
let saveTimer: any = null;
export const store = {
  get<T>(key: string, def: T): T {
    return key in memStore ? (memStore[key] as T) : def;
  },
  set(key: string, v: any) {
    memStore[key] = v;
    if (!lsOk) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(memStore));
      } catch {
        lsOk = false;
      }
    }, 250);
  },
  clearAll() {
    for (const k of Object.keys(memStore)) delete memStore[k];
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  },
  get available() {
    return lsOk;
  },
};

// ---------- settings ----------
export const settings = {
  digits: store.get<number>('set.digits', 4),
  dec: store.get<string>('set.dec', ','),
  xlnames: store.get<string>('set.xlnames', 'en'),
  explain: store.get<boolean>('set.explain', true),
};
const listeners = new Set<() => void>();
export function onSettings(fn: () => void) {
  listeners.add(fn);
}
export function setSetting(k: 'digits' | 'dec' | 'xlnames' | 'explain', v: any) {
  (settings as any)[k] = v;
  store.set('set.' + k, v);
  listeners.forEach((f) => {
    try {
      f();
    } catch (e) {
      console.error(e);
    }
  });
}

// ---------- number formatting ----------
/** Significant-digit format; avoids exponent notation for normal magnitudes. */
export function fmtNum(x: number, digits = settings.digits, dec = settings.dec): string {
  if (x === undefined || x === null || Number.isNaN(x)) return '-';
  if (x === Infinity) return '+∞';
  if (x === -Infinity) return '-∞';
  if (x === 0) return '0';
  const ax = Math.abs(x);
  let s: string;
  if (ax >= 1e-4 && ax < 1e15) {
    const mag = Math.floor(Math.log10(ax));
    const decimals = Math.max(0, digits - 1 - mag);
    s = x.toFixed(Math.min(decimals, 20));
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  } else {
    s = x.toExponential(digits - 1).replace(/\.?0+e/, 'e');
  }
  return dec === ',' ? s.replace('.', ',') : s;
}
export const fmt = (x: number, digits?: number) => fmtNum(x, digits);
/** Always Dutch decimal comma (for exam answers). */
export const nl = (x: number, digits = settings.digits) => fmtNum(x, digits, ',');
export const pct = (x: number, digits?: number) => fmtNum(100 * x, digits) + '%';
export const pctNl = (x: number, digits?: number) => fmtNum(100 * x, digits, ',') + '%';
/** For use inside LaTeX: comma needs braces to avoid extra spacing. */
export const tx = (x: number, digits?: number) => fmtNum(x, digits).replace(',', '{,}').replace(/e([+-]?\d+)/, '\\cdot 10^{$1}').replace('∞', '\\infty');
/** Numbers inside Dutch Excel formulas: decimal comma, up to 10 significant digits. */
export function xl(x: number): string {
  if (!isFinite(x)) return String(x);
  return String(+x.toPrecision(10)).replace('.', ',');
}

export function tex(src: string, display = true): string {
  return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore' });
}
export function texEl(src: string, display = true): HTMLElement {
  const d = h('div', { class: display ? 'tex-block' : 'tex-inline' });
  d.innerHTML = tex(src, display);
  return d;
}

/** Parse a number typed in Dutch or English notation. Returns NaN on text, null on empty. */
export function parseNum(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return raw;
  let s = raw.trim().replace(/[\s  ']/g, '');
  if (s === '') return null;
  s = s.replace(/^−/, '-');
  let pctSign = false;
  if (s.endsWith('%')) {
    pctSign = true;
    s = s.slice(0, -1);
  }
  const hasDot = s.includes('.');
  const hasComma = s.includes(',');
  if (hasDot && hasComma) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (hasComma) {
    const n = (s.match(/,/g) || []).length;
    s = n > 1 ? s.replace(/,/g, '') : s.replace(',', '.');
  } else if (hasDot) {
    const n = (s.match(/\./g) || []).length;
    if (n > 1) s = s.replace(/\./g, '');
  }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
  const v = parseFloat(s);
  return pctSign ? v / 100 : v;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = h('textarea', { style: { position: 'fixed', left: '-9999px' } }) as HTMLTextAreaElement;
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {}
    ta.remove();
    return ok;
  }
}
export function copyBtn(get: () => string, label = 'Kopieer') {
  const b = h('button', { class: 'btn btn-copy', type: 'button', title: 'Kopieer naar klembord' }, label);
  b.addEventListener('click', async () => {
    const ok = await copyText(get());
    b.textContent = ok ? 'Gekopieerd' : 'Kopiëren mislukt';
    setTimeout(() => (b.textContent = label), 1200);
  });
  return b;
}

/** Remove em/en-dashes from generated text (writing style rule). */
export const noDash = (s: string) => s.replace(/[–—]/g, '-');

// ---------- Excel function names ----------
// The course writes English function names with Dutch separators (;) and WAAR/ONWAAR.
// A Dutch-language Excel uses translated names; this map is used when that option is chosen.
export const XL_NL: Record<string, string> = {
  'NORM.DIST': 'NORM.VERD', 'NORM.S.DIST': 'NORM.S.VERD', 'NORM.INV': 'NORM.INV', 'NORM.S.INV': 'NORM.S.INV',
  'T.DIST': 'T.VERD', 'T.DIST.RT': 'T.VERD.R', 'T.DIST.2T': 'T.VERD.2T', 'T.INV': 'T.INV', 'T.INV.2T': 'T.INV.2T', 'T.TEST': 'T.TEST',
  'CHISQ.DIST': 'CHIKW.VERD', 'CHISQ.DIST.RT': 'CHIKW.VERD.RECHTS', 'CHISQ.INV': 'CHIKW.INV', 'CHISQ.INV.RT': 'CHIKW.INV.RECHTS', 'CHISQ.TEST': 'CHIKW.TEST',
  'F.DIST': 'F.VERD', 'F.DIST.RT': 'F.VERD.RECHTS', 'F.INV': 'F.INV', 'F.INV.RT': 'F.INV.RECHTS', 'F.TEST': 'F.TEST',
  'BINOM.DIST': 'BINOM.VERD', 'BINOM.INV': 'BINOM.INV', 'POISSON.DIST': 'POISSON.VERD', 'EXPON.DIST': 'EXPON.VERD',
  'HYPGEOM.DIST': 'HYPGEOM.VERD', 'BETA.INV': 'BETA.INV', 'BETA.DIST': 'BETA.VERD', 'GAMMALN': 'GAMMA.LN',
  'AVERAGE': 'GEMIDDELDE', 'STDEV.S': 'STDEV.S', 'VAR.S': 'VAR.S', 'SQRT': 'WORTEL', 'DEVSQ': 'DEV.KWAD', 'COMBIN': 'COMBINATIES',
  'ROUNDUP': 'AFRONDEN.NAAR.BOVEN', 'CORREL': 'CORRELATIE', 'LINEST': 'LIJNSCH', 'SUM': 'SOM', 'COUNT': 'AANTAL', 'MEDIAN': 'MEDIAAN',
  'QUARTILE.INC': 'KWARTIEL.INC', 'SLOPE': 'RICHTING', 'INTERCEPT': 'SNIJPUNT', 'RSQ': 'R.KWADRAAT', 'STEYX': 'STAND.FOUT.YX',
  'TREND': 'TREND', 'RANK.AVG': 'RANG.GEMIDDELDE', 'ROUNDDOWN': 'AFRONDEN.NAAR.BENEDEN', 'MIN': 'MIN', 'MAX': 'MAX', 'ABS': 'ABS', 'EXP': 'EXP', 'LN': 'LN', 'FLOOR': 'AFRONDEN.BENEDEN', 'SUMPRODUCT': 'SOMPRODUCT', 'MMULT': 'PRODUCTMAT', 'MINVERSE': 'INVERSEMAT',
};
export function xlName(formula: string): string {
  if (settings.xlnames !== 'nl') return formula;
  return formula.replace(/(^|[^A-Z0-9.])([A-Z][A-Z0-9]*(?:\.[A-Z0-9]+)*)\(/g, (m, pre, n) => (XL_NL[n] ? pre + XL_NL[n] + '(' : m));
}

/** Render all <span class="mtex"> placeholders (from the Markdown prebuild) inside root. */
export function renderMath(root: ParentNode) {
  root.querySelectorAll<HTMLElement>('span.mtex').forEach((el) => {
    const d = el.classList.contains('d');
    try {
      katex.render(el.textContent ?? '', el, { displayMode: d, throwOnError: false, strict: 'ignore' });
    } catch {}
    el.classList.remove('mtex');
  });
}
