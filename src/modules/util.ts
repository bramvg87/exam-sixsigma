import { h, onSettings } from '../ui/core.ts';
import { InputError } from '../ui/form.ts';
import type { Side } from '../calc/hypo.ts';

/** Run compute() and put its output into box; show Dutch errors instead of crashing. Re-runs on settings change. */
export function live(box: HTMLElement, compute: () => (HTMLElement | SVGElement | null)[] | HTMLElement | SVGElement | null): () => void {
  const run = () => {
    try {
      const out = compute();
      const arr = (Array.isArray(out) ? out : [out]).filter(Boolean) as Node[];
      box.replaceChildren(...arr);
    } catch (e: any) {
      const msg = e instanceof InputError ? e.message : `Kan niet berekenen: ${e?.message ?? e}`;
      box.replaceChildren(h('div', { class: 'note err' }, msg));
      if (!(e instanceof InputError)) console.error(e);
    }
  };
  onSettings(run);
  return run;
}

export function need(cond: boolean, msg: string): asserts cond {
  if (!cond) throw new InputError(msg);
}
export const posInt = (v: number, name: string, min = 1) => {
  need(Number.isInteger(v) && v >= min, `${name} moet een geheel getal >= ${min} zijn.`);
  return v;
};
export const pos = (v: number, name: string) => {
  need(v > 0, `${name} moet groter dan 0 zijn.`);
  return v;
};
export const prob = (v: number, name: string, open = true) => {
  need(open ? v > 0 && v < 1 : v >= 0 && v <= 1, `${name} moet tussen 0 en 1 liggen (bv. 0,05).`);
  return v;
};

export const SIDES: [Side, string][] = [
  ['left', 'Linkszijdig (<)'],
  ['two', 'Tweezijdig (≠)'],
  ['right', 'Rechtszijdig (>)'],
];
export const relTex = (s: Side) => (s === 'left' ? '<' : s === 'right' ? '>' : '\\neq');
export const relTxt = (s: Side) => (s === 'left' ? '<' : s === 'right' ? '>' : '≠');
export const sideNl = (s: Side) => (s === 'left' ? 'linkszijdig' : s === 'right' ? 'rechtszijdig' : 'tweezijdig');

export function moduleHead(el: HTMLElement, title: string, lead?: string) {
  el.appendChild(h('h2', null, title));
  if (lead) el.appendChild(h('p', { class: 'lead' }, lead));
}
