import './generated/katex.css';
import './styles.css';
import { h, settings, setSetting, store } from './ui/core.ts';
import { BUILD } from './generated/buildinfo.ts';
import { formularium } from './generated/content.ts';
import { MODULES } from './modules/registry.ts';
import type { Ctx, Instance, ModuleDef } from './modules/types.ts';

const app = document.getElementById('app')!;
const mounted = new Map<string, { el: HTMLElement; inst: Instance }>();

// ---------- layout ----------
const main = h('main', { class: 'main', id: 'main' });
const nav = h('nav', { class: 'sidebar' });
const searchInput = h('input', { type: 'search', class: 'search', placeholder: 'Zoeken (Ctrl+K)...', 'aria-label': 'Zoeken' }) as HTMLInputElement;
const searchResults = h('div', { class: 'search-results', hidden: true });
const themeBtn = h('button', { class: 'btn btn-sm', type: 'button', title: 'Licht / donker' }, 'Thema');
const digitsSel = h('select', { title: 'Significante cijfers' }, h('option', { value: '4' }, '4 cijfers'), h('option', { value: '6' }, '6 cijfers')) as HTMLSelectElement;
const decSel = h('select', { title: 'Decimaalteken uitvoer' }, h('option', { value: ',' }, 'komma ,'), h('option', { value: '.' }, 'punt .')) as HTMLSelectElement;
const xlSel = h('select', { title: 'Excel-functienamen' }, h('option', { value: 'en' }, 'Excel: EN-namen'), h('option', { value: 'nl' }, 'Excel: NL-namen')) as HTMLSelectElement;
xlSel.value = settings.xlnames;
xlSel.addEventListener('change', () => setSetting('xlnames', xlSel.value));
digitsSel.value = String(settings.digits);
decSel.value = settings.dec;
digitsSel.addEventListener('change', () => setSetting('digits', +digitsSel.value));
decSel.addEventListener('change', () => setSetting('dec', decSel.value));

const header = h(
  'header',
  { class: 'topbar' },
  h('button', { class: 'btn btn-sm menu-btn', type: 'button', onclick: () => document.body.classList.toggle('nav-open') }, 'Menu'),
  h('a', { class: 'brand', href: '#/start' }, 'Six Sigma BB toolkit'),
  h('div', { class: 'search-box' }, searchInput, searchResults),
  h('div', { class: 'settings' }, digitsSel, decSel, xlSel, themeBtn),
);
const footer = h(
  'footer',
  { class: 'footer' },
  `Build ${BUILD.date} - commit ${BUILD.commit} - volledig offline`,
  store.available ? '' : ' - lokale opslag niet beschikbaar (invoer blijft enkel tijdens deze sessie bewaard)',
);
app.append(header, h('div', { class: 'layout' }, nav, main), footer);

// theme
const theme = store.get<string>('set.theme', matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = theme;
themeBtn.addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  store.set('set.theme', t);
});

// sidebar
const groups = ['Start', 'Fase 1', 'Fase 2', 'Extra'] as const;
const groupNames: Record<string, string> = { Start: 'Start', 'Fase 1': 'Kern', 'Fase 2': 'Verdieping', Extra: 'Extra' };
for (const g of groups) {
  const items = MODULES.filter((m) => m.group === g);
  if (!items.length) continue;
  nav.appendChild(h('div', { class: 'navgroup' }, groupNames[g]));
  for (const m of items) nav.appendChild(h('a', { href: `#/${m.id}`, class: 'navlink', 'data-id': m.id }, m.title));
}

// ---------- routing ----------
const ctx: Ctx = {
  go(id, sub, params) {
    pendingParams = params;
    const hash = `#/${id}${sub ? '/' + sub : ''}`;
    if (location.hash === hash) route();
    else location.hash = hash;
  },
};
let pendingParams: any = undefined;

function route() {
  const [, id = 'start', sub] = location.hash.split('/');
  const def = MODULES.find((m) => m.id === id) ?? MODULES[0];
  let entry = mounted.get(def.id);
  if (!entry) {
    const el = h('div', { class: 'module', 'data-module': def.id });
    main.appendChild(el);
    let inst: Instance = {};
    try {
      inst = (def.mount(el, ctx) as Instance) ?? {};
    } catch (e: any) {
      el.appendChild(h('div', { class: 'note err' }, `Module kon niet laden: ${e?.message ?? e}`));
      console.error(e);
    }
    entry = { el, inst };
    mounted.set(def.id, entry);
  }
  mounted.forEach((v, k) => (v.el.hidden = k !== def.id));
  nav.querySelectorAll('.navlink').forEach((a) => a.classList.toggle('on', (a as HTMLElement).dataset.id === def.id));
  document.body.classList.remove('nav-open');
  const params = pendingParams;
  pendingParams = undefined;
  try {
    entry.inst.route?.(sub, params);
  } catch (e) {
    console.error(e);
  }
  document.title = `${def.title} - Six Sigma BB toolkit`;
  main.scrollTop = 0;
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

// ---------- search ----------
interface Hit { label: string; sub: string; hay: string; go: () => void }
const index: Hit[] = [];
for (const m of MODULES) {
  index.push({ label: m.title, sub: 'module', hay: norm([m.title, ...m.keywords].join(' ')), go: () => ctx.go(m.id) });
  for (const [sid, label, kw] of m.subs ?? []) index.push({ label, sub: m.title, hay: norm(`${label} ${kw ?? ''} ${m.title}`), go: () => ctx.go(m.id, sid) });
}
for (const t of formularium.toc) index.push({ label: t.text, sub: 'Formularium', hay: norm(t.text), go: () => ctx.go('formularium', t.id) });
function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
let hits: Hit[] = [];
let hi = 0;
function doSearch() {
  const q = norm(searchInput.value.trim());
  if (!q) {
    searchResults.hidden = true;
    return;
  }
  const terms = q.split(/\s+/);
  hits = index
    .map((x) => ({ x, score: terms.every((t) => x.hay.includes(t)) ? (x.hay.startsWith(terms[0]) ? 2 : 1) + (x.sub === 'module' ? 0.5 : 0) : 0 }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 14)
    .map((r) => r.x);
  hi = 0;
  renderHits();
}
function renderHits() {
  searchResults.replaceChildren(
    ...(hits.length
      ? hits.map((x, i) => {
          const d = h('div', { class: 'hit' + (i === hi ? ' on' : '') }, h('span', null, x.label), h('small', null, x.sub));
          d.addEventListener('mousedown', (e) => {
            e.preventDefault();
            pick(i);
          });
          return d;
        })
      : [h('div', { class: 'hit muted' }, 'Geen resultaten')]),
  );
  searchResults.hidden = false;
}
function pick(i: number) {
  const x = hits[i];
  if (!x) return;
  searchInput.value = '';
  searchResults.hidden = true;
  searchInput.blur();
  x.go();
}
searchInput.addEventListener('input', doSearch);
searchInput.addEventListener('blur', () => setTimeout(() => (searchResults.hidden = true), 150));
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    hi = Math.min(hits.length - 1, hi + 1);
    renderHits();
    e.preventDefault();
  } else if (e.key === 'ArrowUp') {
    hi = Math.max(0, hi - 1);
    renderHits();
    e.preventDefault();
  } else if (e.key === 'Enter') pick(hi);
  else if (e.key === 'Escape') {
    searchInput.value = '';
    searchResults.hidden = true;
    searchInput.blur();
  }
});
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInput.focus();
    searchInput.select();
  }
});

route();
