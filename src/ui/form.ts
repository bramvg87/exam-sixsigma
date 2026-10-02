// Persistent form fields bound to a module, with a shared change callback.
import { h, parseNum, store } from './core.ts';

export class InputError extends Error {}

export interface Field<T> {
  el: HTMLElement;
  get(): T;
  set(v: any): void;
}

export class Form {
  private fields = new Map<string, Field<any>>();
  constructor(
    public prefix: string,
    public onChange: () => void,
  ) {}

  private key(k: string) {
    return `${this.prefix}.${k}`;
  }

  num(k: string, label: string, def: number | string | null, opts: { hint?: string; width?: string; title?: string } = {}): Field<number> {
    const input = h('input', { type: 'text', inputmode: 'decimal', class: 'num', value: String(store.get(this.key(k), def ?? '')).replace('.', ','), title: opts.title }) as HTMLInputElement;
    if (opts.width) input.style.width = opts.width;
    input.addEventListener('input', () => {
      store.set(this.key(k), input.value);
      const v = parseNum(input.value);
      input.classList.toggle('invalid', v !== null && Number.isNaN(v));
      this.onChange();
    });
    const el = h('label', { class: 'field' }, h('span', { class: 'lbl' }, label), input, opts.hint ? h('span', { class: 'hint' }, opts.hint) : null);
    const f: Field<number> = {
      el,
      get: () => {
        const v = parseNum(input.value);
        if (v === null) throw new InputError(`Vul "${label}" in.`);
        if (Number.isNaN(v)) throw new InputError(`"${label}" is geen geldig getal: "${input.value}".`);
        return v;
      },
      set: (v) => {
        input.value = String(v).replace('.', ',');
        store.set(this.key(k), input.value);
      },
    };
    (f as any).opt = () => parseNum(input.value);
    this.fields.set(k, f);
    return f;
  }

  /** Optional number: returns undefined when empty. */
  optNum(k: string, label: string, def: number | string | null, opts: { hint?: string } = {}): Field<number | undefined> {
    const f = this.num(k, label, def, opts);
    const g: Field<number | undefined> = {
      el: f.el,
      get: () => {
        const v = (f as any).opt();
        if (v === null) return undefined;
        if (Number.isNaN(v)) throw new InputError(`"${label}" is geen geldig getal.`);
        return v;
      },
      set: f.set,
    };
    this.fields.set(k, g);
    return g;
  }

  text(k: string, label: string, def: string): Field<string> {
    const input = h('input', { type: 'text', value: store.get(this.key(k), def) }) as HTMLInputElement;
    input.addEventListener('input', () => {
      store.set(this.key(k), input.value);
      this.onChange();
    });
    const el = h('label', { class: 'field' }, h('span', { class: 'lbl' }, label), input);
    const f = { el, get: () => input.value, set: (v: string) => ((input.value = v), store.set(this.key(k), v)) };
    this.fields.set(k, f);
    return f;
  }

  select<T extends string>(k: string, label: string, options: [T, string][], def: T): Field<T> {
    const sel = h('select', null, options.map(([v, t]) => h('option', { value: v }, t))) as HTMLSelectElement;
    sel.value = store.get(this.key(k), def);
    if (!options.some(([v]) => v === sel.value)) sel.value = def;
    sel.addEventListener('change', () => {
      store.set(this.key(k), sel.value);
      this.onChange();
    });
    const el = h('label', { class: 'field' }, h('span', { class: 'lbl' }, label), sel);
    const f = { el, get: () => sel.value as T, set: (v: T) => ((sel.value = v), store.set(this.key(k), v)) };
    this.fields.set(k, f);
    return f;
  }

  /** Segmented radio buttons. */
  seg<T extends string>(k: string, label: string, options: [T, string][], def: T): Field<T> {
    let cur = store.get<T>(this.key(k), def);
    if (!options.some(([v]) => v === cur)) cur = def;
    const btns = options.map(([v, t]) => {
      const b = h('button', { type: 'button', class: 'seg-btn' + (v === cur ? ' on' : '') }, t);
      b.addEventListener('click', () => {
        cur = v;
        store.set(this.key(k), v);
        btns.forEach((x, i) => x.classList.toggle('on', options[i][0] === v));
        this.onChange();
      });
      return b;
    });
    const el = h('div', { class: 'field' }, label ? h('span', { class: 'lbl' }, label) : null, h('div', { class: 'seg' }, btns));
    const f = {
      el,
      get: () => cur,
      set: (v: T) => {
        cur = v;
        store.set(this.key(k), v);
        btns.forEach((x, i) => x.classList.toggle('on', options[i][0] === v));
      },
    };
    this.fields.set(k, f);
    return f;
  }

  check(k: string, label: string, def: boolean): Field<boolean> {
    const cb = h('input', { type: 'checkbox' }) as HTMLInputElement;
    cb.checked = store.get(this.key(k), def);
    cb.addEventListener('change', () => {
      store.set(this.key(k), cb.checked);
      this.onChange();
    });
    const el = h('label', { class: 'field check' }, cb, h('span', null, label));
    const f = { el, get: () => cb.checked, set: (v: boolean) => ((cb.checked = v), store.set(this.key(k), v)) };
    this.fields.set(k, f);
    return f;
  }

  setValues(vals: Record<string, any>) {
    for (const [k, v] of Object.entries(vals)) this.fields.get(k)?.set(v);
    this.onChange();
  }
}

/** Row of buttons that load example values into a form. */
export function exampleRow(f: Form, examples: [string, Record<string, any>][]) {
  return h('div', { class: 'row' }, examples.map(([label, vals]) => h('button', { type: 'button', class: 'btn btn-sm', onclick: () => f.setValues(vals) }, label)));
}
export function row(...els: (HTMLElement | null)[]) {
  return h('div', { class: 'row' }, els);
}
export function card(title: string | null, ...children: any[]) {
  return h('section', { class: 'card' }, title ? h('h3', null, title) : null, ...children);
}
export function note(text: string, kind: 'info' | 'warn' | 'err' | 'ok' = 'info') {
  return h('div', { class: 'note ' + kind }, text);
}
