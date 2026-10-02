// Excel-like data grid: paste TSV, decimal comma/point, keyboard navigation, range selection, undo.
import { h, parseNum, store, fmt } from '../ui/core.ts';
import { describe } from '../stats/desc.ts';

export interface GridColumn { name: string; values: number[]; invalid: number; blanks: number }
export interface GridOptions {
  key: string;
  rows?: number;
  cols?: number;
  headers?: string[];
  example?: () => { headers: string[]; rows: (string | number)[][] };
  examples?: { label: string; data: () => { headers: string[]; rows: (string | number)[][] } }[];
  onChange?: () => void;
  height?: string;
}

interface State { headers: string[]; cells: string[][] }

export class DataGrid {
  el: HTMLElement;
  private st: State;
  private table!: HTMLTableElement;
  private sink: HTMLTextAreaElement;
  private summary: HTMLElement;
  private sel = { r0: 0, c0: 0, r1: 0, c1: 0 };
  private editing: { r: number; c: number; input: HTMLInputElement } | null = null;
  private undo: string[] = [];
  private redo: string[] = [];
  private dragging = false;
  private wrap: HTMLElement;
  private changeTimer: any;

  constructor(private o: GridOptions) {
    const R = o.rows ?? 30;
    const C = o.cols ?? 6;
    const saved = store.get<State | null>(`grid.${o.key}`, null);
    if (saved && Array.isArray(saved.cells) && Array.isArray(saved.headers)) this.st = saved;
    else {
      const ex = o.example?.() ?? o.examples?.[0]?.data();
      this.st = { headers: Array.from({ length: C }, (_, j) => o.headers?.[j] ?? colName(j)), cells: Array.from({ length: R }, () => Array(C).fill('')) };
      if (ex) this.load(ex.headers, ex.rows, false);
    }
    this.sink = h('textarea', { class: 'grid-sink', 'aria-label': 'Gridinvoer', spellcheck: false }) as HTMLTextAreaElement;
    this.summary = h('div', { class: 'grid-summary' });
    this.wrap = h('div', { class: 'grid-wrap', style: { maxHeight: o.height ?? '380px' } });
    const examples = o.examples ?? (o.example ? [{ label: 'Voorbeeld laden', data: o.example }] : []);
    const tb = h(
      'div',
      { class: 'grid-toolbar' },
      examples.map((e) => btn(e.label, () => this.loadExample(e.data))),
      btn('Wissen', () => this.clear()),
      btn('Rij +', () => this.addRow()),
      btn('Rij -', () => this.delRow()),
      btn('Kolom +', () => this.addCol()),
      btn('Kolom -', () => this.delCol()),
      btn('Transponeren', () => this.transpose()),
      btn('Ongedaan maken', () => this.doUndo()),
      h('span', { class: 'grid-help' }, 'Plak rechtstreeks uit Excel (Ctrl+V). Enter = omlaag, Tab = rechts, F2 = bewerken.'),
    );
    this.el = h('div', { class: 'grid' }, tb, this.wrap, this.summary, this.sink);
    this.render();
    this.bind();
  }

  // ---------- public API ----------
  getColumns(): GridColumn[] {
    return this.st.headers.map((name, j) => {
      const values: number[] = [];
      let invalid = 0;
      let blanks = 0;
      let lastNonEmpty = -1;
      this.st.cells.forEach((r, i) => {
        if (r[j]?.trim()) lastNonEmpty = i;
      });
      for (let i = 0; i <= lastNonEmpty; i++) {
        const v = parseNum(this.st.cells[i][j]);
        if (v === null) blanks++;
        else if (Number.isNaN(v)) invalid++;
        else values.push(v);
      }
      return { name: name || colName(j), values, invalid, blanks };
    });
  }
  /** Non-empty columns only. */
  getFilledColumns(): GridColumn[] {
    return this.getColumns().filter((c) => c.values.length > 0 || c.invalid > 0);
  }
  /** Numeric matrix of all non-empty rows (null for blank/invalid cells), trimmed to used columns. */
  getMatrix(): (number | null)[][] {
    const usedCols = this.usedCols();
    return this.st.cells
      .filter((r) => r.slice(0, usedCols).some((v) => v.trim() !== ''))
      .map((r) =>
        r.slice(0, usedCols).map((v) => {
          const p = parseNum(v);
          return p === null || Number.isNaN(p) ? null : p;
        }),
      );
  }
  getRaw(): string[][] {
    const usedCols = this.usedCols();
    return this.st.cells.filter((r) => r.slice(0, usedCols).some((v) => v.trim() !== '')).map((r) => r.slice(0, usedCols));
  }
  get headers() {
    return this.st.headers.slice(0, this.usedCols());
  }
  setData(headers: string[], rows: (string | number | null)[][]) {
    this.pushUndo();
    this.load(headers, rows, true);
    this.render();
    this.changed();
  }

  // ---------- internals ----------
  private usedCols() {
    let m = 0;
    this.st.cells.forEach((r) => r.forEach((v, j) => v.trim() !== '' && (m = Math.max(m, j + 1))));
    return m;
  }
  private load(headers: string[], rows: (string | number | null)[][], keepSize: boolean) {
    const C = Math.max(headers.length, ...rows.map((r) => r.length), keepSize ? 1 : this.o.cols ?? 6);
    const R = Math.max(rows.length + 5, this.o.rows ?? 30);
    this.st.headers = Array.from({ length: C }, (_, j) => headers[j] ?? colName(j));
    this.st.cells = Array.from({ length: R }, (_, i) =>
      Array.from({ length: C }, (_, j) => {
        const v = rows[i]?.[j];
        if (v === null || v === undefined) return '';
        return typeof v === 'number' ? String(v).replace('.', ',') : String(v);
      }),
    );
  }
  private loadExample(f: () => { headers: string[]; rows: (string | number)[][] }) {
    const ex = f();
    this.setData(ex.headers, ex.rows);
  }
  private snapshot() {
    return JSON.stringify(this.st);
  }
  private pushUndo() {
    this.undo.push(this.snapshot());
    if (this.undo.length > 50) this.undo.shift();
    this.redo = [];
  }
  private doUndo() {
    const s = this.undo.pop();
    if (!s) return;
    this.redo.push(this.snapshot());
    this.st = JSON.parse(s);
    this.render();
    this.changed();
  }
  private doRedo() {
    const s = this.redo.pop();
    if (!s) return;
    this.undo.push(this.snapshot());
    this.st = JSON.parse(s);
    this.render();
    this.changed();
  }
  private changed() {
    store.set(`grid.${this.o.key}`, this.st);
    this.updateSummary();
    clearTimeout(this.changeTimer);
    this.changeTimer = setTimeout(() => this.o.onChange?.(), 60);
  }
  private clear() {
    this.pushUndo();
    this.st.cells = this.st.cells.map((r) => r.map(() => ''));
    this.render();
    this.changed();
  }
  private addRow() {
    this.pushUndo();
    this.st.cells.push(Array(this.st.headers.length).fill(''));
    this.render();
    this.changed();
  }
  private delRow() {
    if (this.st.cells.length <= 1) return;
    this.pushUndo();
    this.st.cells.pop();
    this.render();
    this.changed();
  }
  private addCol() {
    this.pushUndo();
    this.st.headers.push(colName(this.st.headers.length));
    this.st.cells.forEach((r) => r.push(''));
    this.render();
    this.changed();
  }
  private delCol() {
    if (this.st.headers.length <= 1) return;
    this.pushUndo();
    this.st.headers.pop();
    this.st.cells.forEach((r) => r.pop());
    this.render();
    this.changed();
  }
  private transpose() {
    this.pushUndo();
    const raw = this.getRaw();
    const used = this.usedCols();
    const heads = this.st.headers.slice(0, used);
    // Headers become first column; rows become columns
    const newRows: string[][] = heads.map((hd, j) => raw.map((r) => r[j] ?? ''));
    const newHeads = raw.map((_, i) => `R${i + 1}`);
    this.load(newHeads, newRows, true);
    this.render();
    this.changed();
  }

  private render() {
    const C = this.st.headers.length;
    const head = h(
      'tr',
      null,
      h('th', { class: 'corner' }, ''),
      this.st.headers.map((name, j) => {
        const inp = h('input', { class: 'grid-head', value: name, title: 'Kolomnaam (bewerkbaar)' }) as HTMLInputElement;
        inp.addEventListener('change', () => {
          this.pushUndo();
          this.st.headers[j] = inp.value;
          this.changed();
        });
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            inp.blur();
            this.setSel(0, j);
          }
        });
        return h('th', null, inp);
      }),
    );
    const numericCol = this.st.headers.map((_, j) => this.st.cells.some((r) => { const p = parseNum(r[j] ?? ''); return p !== null && !Number.isNaN(p); }));
    const body = this.st.cells.map((r, i) =>
      h(
        'tr',
        null,
        h('th', { class: 'rownum' }, String(i + 1)),
        r.map((v, j) => {
          const td = h('td', { 'data-r': i, 'data-c': j }, v);
          if (v.trim() !== '') {
            const p = parseNum(v);
            if (p !== null && Number.isNaN(p)) td.classList.add(numericCol[j] ? 'txt' : 'label');
          }
          return td;
        }),
      ),
    );
    this.table = h('table', { class: 'grid-table' }, h('thead', null, head), h('tbody', null, body)) as HTMLTableElement;
    this.wrap.replaceChildren(this.table);
    if (this.sel.r1 >= this.st.cells.length || this.sel.c1 >= C) this.sel = { r0: 0, c0: 0, r1: 0, c1: 0 };
    this.paintSel();
    this.updateSummary();
  }

  private cell(r: number, c: number) {
    return this.table.tBodies[0].rows[r]?.cells[c + 1] as HTMLTableCellElement | undefined;
  }
  private range() {
    const { r0, c0, r1, c1 } = this.sel;
    return { ra: Math.min(r0, r1), rb: Math.max(r0, r1), ca: Math.min(c0, c1), cb: Math.max(c0, c1) };
  }
  private paintSel() {
    this.table.querySelectorAll('td.sel,td.cur').forEach((td) => td.classList.remove('sel', 'cur'));
    const { ra, rb, ca, cb } = this.range();
    for (let r = ra; r <= rb; r++) for (let c = ca; c <= cb; c++) this.cell(r, c)?.classList.add('sel');
    const cur = this.cell(this.sel.r1, this.sel.c1);
    cur?.classList.add('cur');
    if (cur) {
      const wr = this.wrap.getBoundingClientRect();
      const cr = cur.getBoundingClientRect();
      if (cr.bottom > wr.bottom) this.wrap.scrollTop += cr.bottom - wr.bottom + 4;
      if (cr.top < wr.top + 28) this.wrap.scrollTop -= wr.top + 28 - cr.top;
      if (cr.right > wr.right) this.wrap.scrollLeft += cr.right - wr.right + 4;
      if (cr.left < wr.left + 40) this.wrap.scrollLeft -= wr.left + 40 - cr.left;
    }
  }
  private setSel(r: number, c: number, extend = false) {
    r = Math.max(0, Math.min(this.st.cells.length - 1, r));
    c = Math.max(0, Math.min(this.st.headers.length - 1, c));
    if (extend) this.sel = { ...this.sel, r1: r, c1: c };
    else this.sel = { r0: r, c0: c, r1: r, c1: c };
    this.paintSel();
    this.updateSummary();
  }
  private updateSummary() {
    const j = this.sel.c1;
    const col = this.getColumns()[j];
    if (!col) return;
    const d = describe(col.values);
    const parts = [
      `<b>${escapeHtml(col.name)}</b>`,
      `n = ${d.n}`,
      `gemiddelde = ${fmt(d.mean)}`,
      `s = ${fmt(d.sd)}`,
      `min = ${fmt(d.min)}`,
      `max = ${fmt(d.max)}`,
      `R = ${fmt(d.range)}`,
    ];
    if (col.invalid && !col.values.length) parts.splice(1, parts.length - 1, '<span class="muted">tekstkolom (labels)</span>');
    else if (col.invalid) parts.push(`<span class="err">${col.invalid} cel(len) met tekst genegeerd</span>`);
    if (col.blanks) parts.push(`<span class="muted">${col.blanks} lege cel(len)</span>`);
    this.summary.innerHTML = parts.join(' &middot; ');
  }

  private startEdit(initial?: string) {
    const { r1: r, c1: c } = this.sel;
    const td = this.cell(r, c);
    if (!td) return;
    const input = h('input', { class: 'grid-edit', value: initial ?? this.st.cells[r][c] }) as HTMLInputElement;
    td.textContent = '';
    td.appendChild(input);
    this.editing = { r, c, input };
    input.focus();
    if (initial === undefined) input.select();
    else input.setSelectionRange(input.value.length, input.value.length);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.commitEdit();
        this.setSel(r + (e.shiftKey ? -1 : 1), c);
        this.focusSink();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.commitEdit();
        this.setSel(r, c + (e.shiftKey ? -1 : 1));
        this.focusSink();
      } else if (e.key === 'Escape') {
        this.cancelEdit();
        this.focusSink();
      } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && initial !== undefined) {
        e.preventDefault();
        this.commitEdit();
        this.setSel(r + (e.key === 'ArrowDown' ? 1 : -1), c);
        this.focusSink();
      }
    });
    input.addEventListener('blur', () => {
      if (this.editing?.input === input) this.commitEdit();
    });
  }
  private commitEdit() {
    if (!this.editing) return;
    const { r, c, input } = this.editing;
    this.editing = null;
    const v = input.value;
    if (v !== this.st.cells[r][c]) {
      this.pushUndo();
      this.st.cells[r][c] = v;
      if (r === this.st.cells.length - 1) this.st.cells.push(Array(this.st.headers.length).fill(''));
      this.render();
      this.changed();
    } else {
      const td = this.cell(r, c);
      if (td) td.textContent = v;
    }
  }
  private cancelEdit() {
    if (!this.editing) return;
    const { r, c } = this.editing;
    this.editing = null;
    const td = this.cell(r, c);
    if (td) td.textContent = this.st.cells[r][c];
  }
  private focusSink() {
    this.sink.value = '';
    this.sink.focus({ preventScroll: true });
  }

  private selectionTSV() {
    const { ra, rb, ca, cb } = this.range();
    const lines: string[] = [];
    for (let r = ra; r <= rb; r++) lines.push(this.st.cells[r].slice(ca, cb + 1).join('\t'));
    return lines.join('\r\n');
  }

  private paste(text: string) {
    let lines = text.replace(/\r\n?/g, '\n').split('\n');
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    if (!lines.length) return;
    const block = lines.map((l) => l.split('\t'));
    this.pushUndo();
    let { ra: r0, ca: c0 } = this.range();
    // If pasted block's first row looks like headers (non-numeric) and we paste at row 0, use as headers
    const first = block[0];
    const looksHeader = r0 === 0 && block.length > 1 && first.some((v) => v.trim() !== '' && Number.isNaN(parseNum(v) as number)) && block.slice(1).some((r) => r.some((v) => { const p = parseNum(v); return p !== null && !Number.isNaN(p); }));
    let data = block;
    if (looksHeader) {
      data = block.slice(1);
      first.forEach((v, j) => {
        this.ensureSize(0, c0 + j);
        this.st.headers[c0 + j] = v.trim() || colName(c0 + j);
      });
    }
    // single value pasted into a multi-cell selection fills the selection
    const { rb, cb } = this.range();
    if (data.length === 1 && data[0].length === 1 && (rb > r0 || cb > c0)) {
      for (let r = r0; r <= rb; r++) for (let c = c0; c <= cb; c++) this.st.cells[r][c] = data[0][0].trim();
    } else {
      data.forEach((row, i) =>
        row.forEach((v, j) => {
          this.ensureSize(r0 + i, c0 + j);
          this.st.cells[r0 + i][c0 + j] = v.trim();
        }),
      );
      this.sel = { r0, c0, r1: r0 + data.length - 1, c1: c0 + Math.max(...data.map((r) => r.length)) - 1 };
    }
    this.ensureSize(r0 + data.length + 2, 0);
    this.render();
    this.changed();
  }
  private ensureSize(r: number, c: number) {
    while (this.st.headers.length <= c) {
      this.st.headers.push(colName(this.st.headers.length));
      this.st.cells.forEach((row) => row.push(''));
    }
    while (this.st.cells.length <= r) this.st.cells.push(Array(this.st.headers.length).fill(''));
  }

  private bind() {
    this.wrap.addEventListener('mousedown', (e) => {
      const td = (e.target as HTMLElement).closest('td');
      if (!td || td.querySelector('input')) return;
      e.preventDefault();
      if (this.editing) this.commitEdit();
      const r = +td.dataset.r!;
      const c = +td.dataset.c!;
      this.setSel(r, c, e.shiftKey);
      this.dragging = true;
      this.focusSink();
    });
    this.wrap.addEventListener('mouseover', (e) => {
      if (!this.dragging) return;
      const td = (e.target as HTMLElement).closest('td');
      if (td) this.setSel(+td.dataset.r!, +td.dataset.c!, true);
    });
    window.addEventListener('mouseup', () => (this.dragging = false));
    this.wrap.addEventListener('dblclick', (e) => {
      const td = (e.target as HTMLElement).closest('td');
      if (td) this.startEdit();
    });
    this.sink.addEventListener('paste', (e) => {
      e.preventDefault();
      const t = e.clipboardData?.getData('text/plain') ?? '';
      this.paste(t);
    });
    this.sink.addEventListener('copy', (e) => {
      e.preventDefault();
      e.clipboardData?.setData('text/plain', this.selectionTSV());
    });
    this.sink.addEventListener('cut', (e) => {
      e.preventDefault();
      e.clipboardData?.setData('text/plain', this.selectionTSV());
      this.clearSel();
    });
    this.sink.addEventListener('focus', () => this.el.classList.add('focus'));
    this.sink.addEventListener('blur', () => this.el.classList.remove('focus'));
    this.sink.addEventListener('keydown', (e) => {
      const { r1, c1 } = this.sel;
      const ctrl = e.ctrlKey || e.metaKey;
      const k = e.key;
      if (ctrl && k.toLowerCase() === 'a') {
        e.preventDefault();
        this.sel = { r0: 0, c0: 0, r1: this.st.cells.length - 1, c1: this.st.headers.length - 1 };
        this.paintSel();
        return;
      }
      if (ctrl && k.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.doRedo();
        else this.doUndo();
        return;
      }
      if (ctrl && k.toLowerCase() === 'y') {
        e.preventDefault();
        this.doRedo();
        return;
      }
      if (ctrl && (k.toLowerCase() === 'c' || k.toLowerCase() === 'x')) {
        // give the native copy event a selection so it fires; the copy handler sets the TSV
        this.sink.value = this.selectionTSV() || ' ';
        this.sink.select();
        return;
      }
      if (ctrl) return; // allow Ctrl+V native paste
      const move: Record<string, [number, number]> = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (move[k]) {
        e.preventDefault();
        this.setSel(r1 + move[k][0], c1 + move[k][1], e.shiftKey);
        return;
      }
      if (k === 'Enter') {
        e.preventDefault();
        this.setSel(r1 + (e.shiftKey ? -1 : 1), c1);
        return;
      }
      if (k === 'Tab') {
        e.preventDefault();
        this.setSel(r1, c1 + (e.shiftKey ? -1 : 1));
        return;
      }
      if (k === 'Delete' || k === 'Backspace') {
        e.preventDefault();
        this.clearSel();
        return;
      }
      if (k === 'F2') {
        e.preventDefault();
        this.startEdit();
        return;
      }
      if (k === 'Home') {
        e.preventDefault();
        this.setSel(r1, 0, e.shiftKey);
        return;
      }
      if (k === 'End') {
        e.preventDefault();
        this.setSel(r1, this.st.headers.length - 1, e.shiftKey);
        return;
      }
      if (k.length === 1 && !e.altKey) {
        e.preventDefault();
        this.startEdit(k);
      }
    });
  }
  private clearSel() {
    this.pushUndo();
    const { ra, rb, ca, cb } = this.range();
    for (let r = ra; r <= rb; r++) for (let c = ca; c <= cb; c++) this.st.cells[r][c] = '';
    this.render();
    this.changed();
  }
}

function colName(j: number) {
  return 'Kolom ' + (j + 1);
}
function btn(label: string, fn: () => void) {
  const b = h('button', { type: 'button', class: 'btn btn-sm' }, label);
  b.addEventListener('click', fn);
  return b;
}
function escapeHtml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/** Helper: rows of a matrix as plain arrays of numbers (skipping null). */
export const rowsOf = (m: (number | null)[][]) => m.map((r) => r.filter((v): v is number => v !== null));
