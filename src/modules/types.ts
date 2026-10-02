import { h, store } from '../ui/core.ts';

export interface Ctx {
  go(id: string, sub?: string, params?: any): void;
}
export interface Instance {
  route?(sub: string | undefined, params?: any): void;
}
export interface ModuleDef {
  id: string;
  title: string;
  group: 'Start' | 'Fase 1' | 'Fase 2' | 'Extra';
  keywords: string[];
  /** sub-entries for search: [sub id, label, keywords] */
  subs?: [string, string, string?][];
  mount(el: HTMLElement, ctx: Ctx): Instance | void;
}

export interface TabDef {
  id: string;
  label: string;
  build(el: HTMLElement): { prefill?(p: any): void } | void;
}

/** Lazily built tabs with persistent active tab. Returns a router for sub ids. */
export function tabs(key: string, defs: TabDef[], root: HTMLElement) {
  const bar = h('div', { class: 'tabs', role: 'tablist' });
  const panes = h('div', { class: 'panes' });
  const built = new Map<string, { el: HTMLElement; api: any }>();
  let active = store.get<string>(`tab.${key}`, defs[0].id);
  if (!defs.some((d) => d.id === active)) active = defs[0].id;
  const btns = defs.map((d) => {
    const b = h('button', { type: 'button', class: 'tab', role: 'tab' }, d.label);
    b.addEventListener('click', () => show(d.id));
    bar.appendChild(b);
    return b;
  });
  function show(id: string, params?: any) {
    const d = defs.find((x) => x.id === id) ?? defs[0];
    active = d.id;
    store.set(`tab.${key}`, d.id);
    btns.forEach((b, i) => b.classList.toggle('on', defs[i].id === d.id));
    if (!built.has(d.id)) {
      const el = h('div', { class: 'pane' });
      panes.appendChild(el);
      let api: any;
      try {
        api = d.build(el) ?? {};
      } catch (e: any) {
        el.appendChild(h('div', { class: 'note err' }, 'Fout bij opbouwen: ' + (e?.message ?? e)));
        api = {};
      }
      built.set(d.id, { el, api });
    }
    built.forEach((v, k) => (v.el.hidden = k !== d.id));
    if (params) built.get(d.id)!.api.prefill?.(params);
  }
  root.append(bar, panes);
  show(active);
  return { show, get active() { return active; } };
}
