// Result panel: question/hypotheses, formula, substituted formula, result, decision, Excel, exam answer.
import { h, texEl, copyBtn, noDash, xlName } from '../ui/core.ts';

export interface ResultSpec {
  title?: string;
  question: string | string[]; // hypotheses or question; strings may contain inline TeX between \( \)
  formula?: string | string[]; // TeX
  substituted?: string | string[]; // TeX
  result: (string | [string, string])[]; // lines or [label, value]
  decision?: { text: string; kind: 'reject' | 'accept' | 'neutral' };
  excel?: string[];
  answer?: string;
  extra?: HTMLElement | HTMLElement[] | null;
  warnings?: string[];
}

function inlineMath(s: string): HTMLElement {
  // Render text with \( ... \) inline math
  const span = h('span');
  const parts = s.split(/\\\((.+?)\\\)/g);
  parts.forEach((p, i) => {
    if (i % 2) span.appendChild(texEl(p, false));
    else span.appendChild(document.createTextNode(p));
  });
  return span;
}
const arr = <T>(x: T | T[] | undefined): T[] => (x === undefined ? [] : Array.isArray(x) ? x : [x]);

export function resultPanel(r: ResultSpec): HTMLElement {
  const blocks: HTMLElement[] = [];
  const blk = (cls: string, label: string, body: HTMLElement[], copy?: () => string) =>
    h('div', { class: 'rblock ' + cls }, h('div', { class: 'rhead' }, h('span', null, label), copy ? copyBtn(copy) : null), h('div', { class: 'rbody' }, body));

  const q = arr(r.question);
  blocks.push(blk('rq', 'Vraag / hypothesen', q.map((s) => h('div', null, inlineMath(s))), () => q.join('\n').replace(/\\\(|\\\)/g, '')));
  const f = arr(r.formula);
  if (f.length) blocks.push(blk('rf', 'Formule', f.map((s) => texEl(s)), () => f.join('\n')));
  const sb = arr(r.substituted);
  if (sb.length) blocks.push(blk('rs', 'Ingevuld', sb.map((s) => texEl(s)), () => sb.join('\n')));
  const res = r.result.map((l) => (Array.isArray(l) ? h('div', { class: 'kv' }, h('span', { class: 'k' }, inlineMath(l[0])), h('span', { class: 'v' }, l[1])) : h('div', null, inlineMath(l))));
  if (r.decision) res.push(h('div', { class: 'decision ' + r.decision.kind }, r.decision.text));
  blocks.push(
    blk('rr', 'Resultaat', res, () =>
      r.result.map((l) => (Array.isArray(l) ? `${l[0]}: ${l[1]}` : l).replace(/\\\(|\\\)/g, '')).concat(r.decision ? [r.decision.text] : []).join('\n'),
    ),
  );
  for (const w of r.warnings ?? []) blocks.push(h('div', { class: 'note warn' }, w));
  if (r.extra) blocks.push(...arr(r.extra));
  const ex = arr(r.excel).map(xlName);
  if (ex.length) blocks.push(blk('rx', 'Excel (Nederlandse notatie)', ex.map((s) => h('code', { class: 'xl' }, s)), () => ex.join('\n')));
  if (r.answer) {
    const a = noDash(r.answer);
    blocks.push(blk('ra', 'Examenantwoord', [h('p', null, a)], () => a));
  }
  return h('div', { class: 'result' }, r.title ? h('h3', { class: 'rtitle' }, r.title) : null, blocks);
}

export function errorPanel(msg: string) {
  return h('div', { class: 'note err' }, msg);
}

/** Simple HTML table. */
export function table(headers: string[], rows: (string | number | HTMLElement)[][], cls = '') {
  return h(
    'div',
    { class: 'tablewrap' },
    h('table', { class: 'tbl ' + cls }, h('thead', null, h('tr', null, headers.map((x) => h('th', null, x)))), h('tbody', null, rows.map((r) => h('tr', null, r.map((c) => h('td', null, c as any)))))),
  );
}
