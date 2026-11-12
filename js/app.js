/* Moliya — kunlik limit va tejash maqsadi. Maʼlumotlar faqat shu qurilmada (localStorage). */
(() => {
'use strict';

// ───────────────────────── Constants ─────────────────────────
const LS_KEY = 'moliya.v1';
const NBSP = ' ';
const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];

const CUR = {
  UZS: { label: 'soʻm', name: 'Oʻzbek soʻmi', dec: 0, step: 100 },
  USD: { label: '$', name: 'AQSH dollari', dec: 2, step: 0.01 },
  EUR: { label: '€', name: 'Yevro', dec: 2, step: 0.01 },
  RUB: { label: '₽', name: 'Rossiya rubli', dec: 0, step: 1 },
  KZT: { label: '₸', name: 'Qozogʻiston tengesi', dec: 0, step: 1 },
};

const CATS = {
  expense: [
    ['food', '🛒', 'Oziq-ovqat'], ['cafe', '🍽️', 'Kafe'], ['transport', '🚕', 'Transport'],
    ['house', '🧺', 'Uy-roʻzgʻor'], ['phone', '📱', 'Aloqa'], ['health', '💊', 'Sogʻliq'],
    ['clothes', '👕', 'Kiyim'], ['fun', '🎬', 'Koʻngilochar'], ['edu', '📚', 'Taʼlim'],
    ['gift', '🎁', 'Sovgʻa'], ['home', '🏠', 'Ijara'], ['bills', '💡', 'Kommunal'],
    ['credit', '🏦', 'Kredit'], ['other', '✨', 'Boshqa'],
  ],
  income: [
    ['salary', '💼', 'Maosh'], ['side', '💰', 'Qoʻshimcha'], ['gift', '🎁', 'Sovgʻa'],
    ['refund', '↩️', 'Qaytarildi'], ['other', '✨', 'Boshqa'],
  ],
};
const PRE_CAT = ['pre', '📦', 'Oy boshidagi xarajatlar'];
// Majburiy toʻlovlar: kunlik limitga kirmaydi, oy budjetidan oldindan ajratiladi.
const FIXED_CATS = new Set(['home', 'bills', 'credit']);

const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1" fill="currentColor"/><circle cx="3.5" cy="12" r="1" fill="currentColor"/><circle cx="3.5" cy="18" r="1" fill="currentColor"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h8M16 18h4"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="14" cy="18" r="2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  fwd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  bksp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z"/><path d="m12 9.5 5 5M17 9.5l-5 5"/></svg>',
};

// ───────────────────────── State ─────────────────────────
function defaults() {
  return {
    v: 1, onboarded: false, currency: 'UZS', theme: 'auto',
    plans: {},            // 'YYYY-MM' → { goal, income, fixed }
    tx: [],               // { id, type: 'expense'|'income', amount, cat, note, date: 'YYYY-MM-DD', ts }
    since: null,          // ilova ishlatila boshlangan sana
    lastCat: { expense: 'food', income: 'salary' },
    hideInstall: false,
  };
}
function normalize(raw) {
  const d = defaults();
  if (!raw || typeof raw !== 'object') return d;
  const s = Object.assign(d, raw);
  if (!CUR[s.currency]) s.currency = 'UZS';
  if (!s.plans || typeof s.plans !== 'object') s.plans = {};
  s.lastCat = Object.assign({ expense: 'food', income: 'salary' }, s.lastCat);
  s.tx = (Array.isArray(s.tx) ? s.tx : []).filter(t =>
    t && (t.type === 'expense' || t.type === 'income') && Number.isFinite(+t.amount) && +t.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(t.date)
  ).map(t => ({ id: String(t.id || uid()), type: t.type, amount: +t.amount, cat: String(t.cat || 'other'), note: String(t.note || '').slice(0, 80), date: t.date, ts: +t.ts || 0 }));
  return s;
}
function load() {
  try { return normalize(JSON.parse(localStorage.getItem(LS_KEY))); } catch (e) { return defaults(); }
}
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { toast('Saqlab boʻlmadi — xotira toʻlgan boʻlishi mumkin'); }
}
let S = load();
const ui = { tab: 'home', viewMonth: null, filter: 'all', selDay: null };

// ───────────────────────── Helpers ─────────────────────────
const $ = (sel, root = document) => root.querySelector(sel);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const curKey = () => today().slice(0, 7);
const cur = () => CUR[S.currency];
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return ymd(new Date(y, m - 1, d + n));
}
function shiftMonth(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
const monthTitle = key => { const [y, m] = key.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
function dateLabel(dateStr, withWeekday = true) {
  const t = today();
  if (dateStr === t) return 'Bugun';
  if (dateStr === addDays(t, -1)) return 'Kecha';
  const [y, m, d] = dateStr.split('-').map(Number);
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${d}-${MONTHS[m - 1].toLowerCase()}${withWeekday ? ', ' + wd : ''}`;
}
function fmtNum(n) {
  const dec = cur().dec;
  const neg = n < 0;
  n = Math.abs(n);
  let [i, f] = (dec ? n.toFixed(dec) : String(Math.round(n))).split('.');
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  if (f && +f !== 0) i += ',' + f;
  return (neg && +n !== 0 ? '−' : '') + i;
}
const money = n => `${fmtNum(n)}${NBSP}${cur().label}`;
function compact(n) {
  const f = v => String(Math.round(v * 10) / 10).replace('.', ',');
  if (n >= 1e9) return f(n / 1e9) + ' mlrd';
  if (n >= 1e6) return f(n / 1e6) + ' mln';
  if (n >= 1e4) return f(n / 1e3) + ' ming';
  return fmtNum(n);
}
function floorLimit(v) {
  const step = cur().step;
  if (!(v > 0)) return 0;
  const s = (step === 100 && v < 1000) ? 1 : step;
  return Math.floor(v / s + 1e-9) * s;
}
function median(arr) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
function catInfo(type, id) {
  if (id === 'pre') return PRE_CAT;
  return CATS[type].find(c => c[0] === id) || CATS[type][CATS[type].length - 1];
}

// ───────────────────────── Plan & calculations ─────────────────────────
function planFor(key) {
  if (S.plans[key]) return S.plans[key];
  let best = null;
  for (const k in S.plans) if (k < key && (!best || k > best)) best = k;
  return best ? S.plans[best] : { goal: 0, income: 0, fixed: 0 };
}
function setPlan(key, patch) {
  S.plans[key] = Object.assign({}, planFor(key), patch);
  save();
}

/**
 * Oy boʻyicha hisob-kitob.
 *   kunlik budjet = max(kutilgan tushum, haqiqiy tushum) − tejash maqsadi
 *                   − max(rejadagi majburiy toʻlovlar, toʻlangan majburiy toʻlovlar)
 *   kunlik limit  = (kunlik budjet − bugungacha kundalik xarajatlar) / qolgan kunlar (bugun bilan)
 * Limit kun davomida oʻzgarmaydi; ortiqcha yoki tejalgan pul ertadan boshlab
 * qolgan kunlarga teng taqsimlanadi.
 */
function monthStats(key, now = today(), planOverride = null) {
  const [y, m] = key.split('-').map(Number);
  const dim = new Date(y, m, 0).getDate();
  const nowKey = now.slice(0, 7);
  const isCurrent = key === nowKey, isPast = key < nowKey;
  const plan = planOverride || planFor(key);
  const goal = +plan.goal || 0, planned = +plan.income || 0, fixedPlan = +plan.fixed || 0;

  const byDay = new Array(dim + 1).fill(0);   // kundalik xarajatlar (grafik uchun)
  const regByDay = new Array(dim + 1).fill(0); // kundalik + oy boshidagi (limit uchun)
  const cats = {};
  let income = 0, spent = 0, fixedPaid = 0, regSpent = 0;
  for (const t of S.tx) {
    if (t.date.slice(0, 7) !== key) continue;
    if (t.type === 'income') { income += t.amount; continue; }
    const d = +t.date.slice(8);
    spent += t.amount;
    cats[t.cat] = (cats[t.cat] || 0) + t.amount;
    if (FIXED_CATS.has(t.cat)) { fixedPaid += t.amount; continue; }
    regSpent += t.amount;
    regByDay[d] += t.amount;
    if (t.cat !== 'pre') byDay[d] += t.amount;
  }

  const expIncome = isPast ? income : Math.max(planned, income);
  const reserved = isPast ? fixedPaid : Math.max(fixedPlan, fixedPaid);
  const budget = expIncome - goal - reserved;
  const limits = new Array(dim + 1).fill(0);
  let cum = 0;
  for (let d = 1; d <= dim; d++) {
    limits[d] = floorLimit((budget - cum) / (dim - d + 1));
    cum += regByDay[d];
  }

  const st = { key, y, m, dim, isCurrent, isPast, goal, planned, fixedPlan, fixedPaid, reserved, income, spent, regSpent, expIncome, budget, byDay, limits, cats, saved: income - spent };
  if (!isCurrent) return st;

  const day = +now.slice(8);
  const remaining = budget - regSpent;
  st.day = day;
  st.daysLeft = dim - day + 1;
  st.limit = limits[day];
  st.todaySpent = regByDay[day];
  st.left = st.limit - st.todaySpent;
  st.tomorrow = day < dim ? floorLimit(remaining / (dim - day)) : null;
  st.shortfall = remaining < 0 ? -remaining : 0;

  if (expIncome <= 0) st.state = 'setup';
  else if (st.limit <= 0) st.state = 'empty';
  else if (st.left < 0) st.state = 'over';
  else if (st.todaySpent >= st.limit * 0.8) st.state = 'warn';
  else st.state = 'ok';

  // Prognoz: kuzatilgan toʻliq kunlarning odatiy (median) xarajati boʻyicha
  let from = 1;
  if (S.since && S.since.slice(0, 7) === key) from = Math.min(day, +S.since.slice(8));
  const full = byDay.slice(from, day);
  st.forecast = null;
  if (full.length >= 3) {
    const typical = median(full);
    const projSpend = regSpent + Math.max(0, typical - byDay[day]) + typical * (dim - day);
    st.typical = typical;
    st.forecast = expIncome - reserved - projSpend;
  }
  return st;
}

// ───────────────────────── Toast ─────────────────────────
let toastTimer = 0, toastAction = null;
function toast(msg, opt = {}) {
  const el = $('#toast');
  toastAction = opt.onAction || null;
  el.innerHTML = `<span>${esc(msg)}</span>${opt.action ? `<button data-act="toast-action">${esc(opt.action)}</button>` : ''}`;
  el.classList.add('in');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('in'), opt.action ? 5000 : 2200);
}

// ───────────────────────── Keypad ─────────────────────────
let kp = { value: '', onChange() {} };
function kpApply(str, k) {
  const dec = cur().dec;
  if (k === 'back') return str.slice(0, -1);
  if (k === ',') return (!dec || str.includes('.')) ? str : (str || '0') + '.';
  if (k === '000' && (!str || str === '0' || str.includes('.'))) return str;
  const next = str === '0' ? k : str + k;
  const [i, f = ''] = next.split('.');
  if (i.length > 11 || f.length > dec) return str;
  return next;
}
const strToAmt = s => parseFloat(s) || 0;
const amtToStr = n => n ? String(cur().dec ? Math.round(n * 100) / 100 : Math.round(n)) : '';
function fmtAmtStr(s) {
  if (!s) return '0';
  const [i, f] = s.split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) + (s.includes('.') ? ',' + (f || '') : '');
}
function keypadHTML() {
  const fn = cur().dec ? ',' : '000';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', fn, '0', 'back'];
  return `<div class="keypad">${keys.map(k => k === 'back'
    ? `<button class="key fn" data-act="key" data-k="back" aria-label="Oʻchirish">${ICON.bksp}</button>`
    : `<button class="key${k === fn ? ' fn' : ''}" data-act="key" data-k="${k}">${k}</button>`).join('')}</div>`;
}
function amountHTML(str) {
  const txt = fmtAmtStr(str);
  return `<div class="amount${strToAmt(str) ? '' : ' zero'}${txt.length > 9 ? ' len-l' : ''}"><span class="num">${txt}</span><span class="cur">${cur().label}</span></div>`;
}

// ───────────────────────── Sheet ─────────────────────────
const overlayRoot = $('#overlay-root');
let sheetEl = null, backdropEl = null;
function openSheet(html) {
  closeSheet(true);
  backdropEl = document.createElement('div');
  backdropEl.className = 'backdrop';
  backdropEl.dataset.act = 'sheet-close';
  sheetEl = document.createElement('div');
  sheetEl.className = 'sheet';
  sheetEl.setAttribute('role', 'dialog');
  sheetEl.setAttribute('aria-modal', 'true');
  sheetEl.innerHTML = '<div class="grab"></div>' + html;
  overlayRoot.append(backdropEl, sheetEl);
  const s = sheetEl, b = backdropEl;
  void s.offsetHeight;
  requestAnimationFrame(() => { s.classList.add('in'); b.classList.add('in'); });
  bindSheetDrag(s);
}
function closeSheet(immediate) {
  if (!sheetEl) return;
  const s = sheetEl, b = backdropEl;
  sheetEl = backdropEl = null;
  draft = null;
  if (document.activeElement && s.contains(document.activeElement)) document.activeElement.blur();
  s.classList.remove('in', 'drag');
  s.style.transform = '';
  b.classList.remove('in');
  if (immediate) { s.remove(); b.remove(); } else setTimeout(() => { s.remove(); b.remove(); }, 340);
}
function bindSheetDrag(s) {
  let y0 = null, dy = 0;
  s.addEventListener('touchstart', e => {
    if (!e.target.closest('.grab, .sheet-head, .amount') || e.target.closest('button')) return;
    y0 = e.touches[0].clientY; dy = 0;
  }, { passive: true });
  s.addEventListener('touchmove', e => {
    if (y0 === null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    s.classList.add('drag');
    s.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  s.addEventListener('touchend', () => {
    if (y0 === null) return;
    y0 = null;
    if (dy > 110) { if (s === sheetEl) closeSheet(); return; }
    s.classList.remove('drag');
    s.style.transform = '';
  });
}

// ───────────────────────── Transaction sheet ─────────────────────────
let draft = null;
function openTx(id) {
  const t = id ? S.tx.find(x => x.id === id) : null;
  draft = t
    ? { id: t.id, type: t.type, amt: amtToStr(t.amount), cat: t.cat, note: t.note || '', date: t.date, orig: t }
    : { id: null, type: 'expense', amt: '', cat: S.lastCat.expense, note: '', date: today(), orig: null };
  const d = draft;
  openSheet(`
    <div class="sheet-head">
      <button class="icon-btn" data-act="sheet-close" aria-label="Yopish">${ICON.close}</button>
      <div class="seg on-bg" role="tablist">
        <button data-act="tx-type" data-type="expense">Xarajat</button>
        <button data-act="tx-type" data-type="income">Tushum</button>
      </div>
      <button class="icon-btn del${t ? '' : ' ghosted'}" data-act="tx-delete" aria-label="Oʻchirish">${ICON.trash}</button>
    </div>
    <div id="tx-amount"></div>
    <div class="amount-hint" id="tx-hint"></div>
    <div class="cats" id="tx-cats"></div>
    <div class="meta">
      <label class="date-chip"><span>📅</span><span id="tx-date"></span>
        <input type="date" data-change="tx-date" max="${today()}" value="${d.date}" aria-label="Sana">
      </label>
      <input class="note-input" data-input="tx-note" type="text" maxlength="80" placeholder="Izoh (ixtiyoriy)" value="${esc(d.note)}" autocomplete="off" enterkeyhint="done">
    </div>
    ${keypadHTML()}
    <button class="btn" id="tx-save" data-act="tx-save">Saqlash</button>
  `);
  kp = { get value() { return draft ? draft.amt : ''; }, set value(v) { if (draft) draft.amt = v; }, onChange: refreshTxAmount };
  refreshTxType();
}
function refreshTxType() {
  if (!draft || !sheetEl) return;
  sheetEl.querySelectorAll('[data-act="tx-type"]').forEach(b => b.classList.toggle('on', b.dataset.type === draft.type));
  const list = CATS[draft.type].slice();
  if (draft.cat === 'pre') list.unshift(PRE_CAT);
  const box = $('#tx-cats', sheetEl);
  box.classList.toggle('one-row', list.length <= 6);
  box.innerHTML = list.map(c => `<button class="chip${c[0] === draft.cat ? ' on' : ''}" data-act="tx-cat" data-cat="${c[0]}"><span class="e">${c[1]}</span>${c[2]}</button>`).join('');
  const on = $('.chip.on', box);
  if (on) box.scrollLeft = Math.max(0, on.offsetLeft - 60);
  $('#tx-date', sheetEl).textContent = dateLabel(draft.date, false);
  $('#tx-save', sheetEl).textContent = draft.id ? 'Saqlash' : (draft.type === 'expense' ? 'Xarajatni qoʻshish' : 'Tushumni qoʻshish');
  refreshTxAmount();
}
function refreshTxAmount() {
  if (!draft || !sheetEl) return;
  $('#tx-amount', sheetEl).innerHTML = amountHTML(draft.amt);
  const amt = strToAmt(draft.amt);
  $('#tx-save', sheetEl).disabled = !amt;
  const hint = $('#tx-hint', sheetEl);
  hint.className = 'amount-hint';
  hint.textContent = '';
  if (draft.type === 'expense' && FIXED_CATS.has(draft.cat)) {
    if (draft.date.slice(0, 7) === curKey()) {
      const st = monthStats(curKey());
      const o = draft.orig;
      const paid = st.fixedPaid - (o && o.type === 'expense' && FIXED_CATS.has(o.cat) && o.date.slice(0, 7) === curKey() ? o.amount : 0) + amt;
      if (paid <= st.fixedPlan) hint.textContent = 'Majburiy toʻlov — kunlik limitga taʼsir qilmaydi';
      else { hint.textContent = `Rejadagi majburiy toʻlovlardan ${money(paid - st.fixedPlan)} oshadi`; hint.classList.add('neg'); }
    }
  } else if (draft.type === 'expense' && draft.date === today()) {
    const st = monthStats(curKey());
    if (st.state !== 'setup') {
      const o = draft.orig;
      const base = st.left + (o && o.type === 'expense' && o.date === today() && !FIXED_CATS.has(o.cat) ? o.amount : 0);
      const after = base - amt;
      if (after >= 0) hint.textContent = `Bugungi limitdan qoladi: ${money(after)}`;
      else { hint.textContent = `Bugungi limitdan ${money(-after)} oshadi`; hint.classList.add('neg'); }
    }
  } else if (draft.type === 'income') {
    hint.textContent = 'Tushum rejadan oshsa, kunlik limit koʻtariladi';
  }
}
function saveTx() {
  if (!draft) return;
  const amount = strToAmt(draft.amt);
  if (!amount) return;
  const rec = { type: draft.type, amount, cat: draft.cat, note: draft.note.trim(), date: draft.date };
  const isNew = !draft.id;
  if (isNew) S.tx.push(Object.assign({ id: uid(), ts: Date.now() }, rec));
  else Object.assign(S.tx.find(x => x.id === draft.id) || {}, rec);
  if (rec.cat !== 'pre') S.lastCat[rec.type] = rec.cat;
  save();
  closeSheet();
  render(true);
  let msg = 'Saqlandi';
  if (rec.type === 'expense' && rec.date === today() && !FIXED_CATS.has(rec.cat)) {
    const st = monthStats(curKey());
    if (st.state === 'over') msg = `Limitdan ${money(-st.left)} oshdi`;
    else if (st.state === 'ok' || st.state === 'warn') msg = `Saqlandi · bugun yana ${money(st.left)}`;
  }
  toast(msg);
}
function deleteTx() {
  if (!draft || !draft.id) return;
  const i = S.tx.findIndex(x => x.id === draft.id);
  if (i < 0) return;
  const [removed] = S.tx.splice(i, 1);
  save();
  closeSheet();
  render(true);
  toast('Oʻchirildi', { action: 'Qaytarish', onAction() { S.tx.push(removed); save(); render(true); } });
}

// ───────────────────────── Generic amount / confirm sheets ─────────────────────────
let amountCtx = null;
function openAmount(opt) {
  amountCtx = { str: amtToStr(opt.value || 0), opt };
  openSheet(`
    <div class="sheet-head">
      <button class="icon-btn" data-act="sheet-close" aria-label="Yopish">${ICON.close}</button>
      <h2>${esc(opt.title)}</h2>
      <span class="icon-btn ghosted"></span>
    </div>
    ${opt.sub ? `<p class="sheet-sub">${esc(opt.sub)}</p>` : ''}
    <div id="am-amount"></div>
    <div class="amount-hint" id="am-hint"></div>
    ${keypadHTML()}
    <button class="btn" data-act="amount-save">Saqlash</button>
  `);
  const refresh = () => {
    if (!sheetEl || !amountCtx) return;
    $('#am-amount', sheetEl).innerHTML = amountHTML(amountCtx.str);
    $('#am-hint', sheetEl).textContent = opt.hint ? opt.hint(strToAmt(amountCtx.str)) : '';
  };
  kp = { get value() { return amountCtx.str; }, set value(v) { amountCtx.str = v; }, onChange: refresh };
  refresh();
}
function editPlan(field, title, sub, done) {
  const key = curKey();
  const plan = planFor(key);
  openAmount({
    title, sub: sub(key), value: plan[field] || 0,
    hint(v) {
      const st = monthStats(key, today(), Object.assign({}, plan, { [field]: v }));
      if (st.state === 'setup') return '';
      return st.limit > 0 ? `Kunlik limit: ${money(st.limit)}` : 'Bu reja bilan kunlik limit qolmaydi';
    },
    onSave(v) { setPlan(key, { [field]: v }); render(true); toast(done); },
  });
}
let confirmCb = null;
function openConfirm({ title, text, ok, danger, onOk }) {
  confirmCb = onOk;
  openSheet(`
    <div class="sheet-head"><h2>${esc(title)}</h2></div>
    <p class="sheet-sub" style="margin-bottom:18px">${esc(text)}</p>
    <button class="btn${danger ? ' danger' : ''}" data-act="confirm-ok">${esc(ok)}</button>
    <button class="btn ghost" data-act="sheet-close">Bekor qilish</button>
  `);
}

// ───────────────────────── Views ─────────────────────────
function txRow(t) {
  const c = catInfo(t.type, t.cat);
  const inc = t.type === 'income';
  return `<button class="tx" data-act="tx-edit" data-id="${esc(t.id)}">
    <span class="ico">${c[1]}</span>
    <span class="mid"><div class="name">${c[2]}</div>${t.note ? `<div class="note">${esc(t.note)}</div>` : ''}</span>
    <span class="amt${inc ? ' in' : ''}">${inc ? '+' : '−'}${fmtNum(t.amount)}</span>
  </button>`;
}
const byRecent = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.ts - a.ts);

function heroHTML(st) {
  let label, big, note;
  const pct = st.limit > 0 ? Math.min(100, st.todaySpent / st.limit * 100) : (st.state === 'empty' ? 100 : 0);
  switch (st.state) {
    case 'setup':
      label = 'Reja kiritilmagan'; big = 0;
      note = 'Limit chiqishi uchun tushum va maqsadni kiriting'; break;
    case 'empty':
      label = '⚠︎ Bu oy budjeti tugadi'; big = -st.todaySpent;
      note = `Maqsadga yetish uchun ${money(st.shortfall)} yetishmayapti`; break;
    case 'over':
      label = '⚠︎ Bugungi limitdan oshdi'; big = st.left;
      note = st.shortfall ? `Maqsadga ${money(st.shortfall)} yetishmayapti`
        : st.tomorrow !== null ? `Ertangi limit ${money(st.tomorrow)} ga tushadi` : 'Bugun oyning oxirgi kuni'; break;
    case 'warn':
      label = 'Bugun sarflash mumkin'; big = st.left;
      note = st.left > 0 ? 'Limitga yaqinlashdingiz — ehtiyot boʻling' : 'Bugungi limit tugadi'; break;
    default:
      label = 'Bugun sarflash mumkin'; big = st.left;
      note = st.todaySpent ? 'Zoʻr! Limit ichidasiz' : 'Bugun hali xarajat yoʻq';
  }
  const num = fmtNum(big);
  const len = num.length > 11 ? ' len-xl' : num.length > 9 ? ' len-l' : num.length > 7 ? ' len-m' : '';
  return `<section class="hero ${st.state}">
    <div class="hero-label">${label}</div>
    <div class="hero-amount${len}"><span class="num">${num}</span><span class="cur">${cur().label}</span></div>
    <div class="hero-note">${note}</div>
    <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct}%"></i></div>
    <div class="meter-legend"><span>Sarflandi: ${fmtNum(st.todaySpent)}</span><span>Kunlik limit: ${fmtNum(st.limit)}</span></div>
    <div class="hero-stats">
      <div><small>Ertangi limit</small><b>${st.tomorrow === null ? '—' : compact(st.tomorrow)}</b></div>
      <div><small>Oy oxirigacha</small><b>${st.daysLeft} kun</b></div>
      <div><small>Maqsad</small><b>${st.goal ? compact(st.goal) : '—'}</b></div>
    </div>
  </section>`;
}

function goalHTML(st) {
  if (!st.goal) {
    return `<section class="card"><div class="card-title"><h2>Tejash maqsadi</h2></div>
      <p class="goal-text" style="margin-bottom:12px">Oy oxirida qancha tejashni belgilang — kunlik limit shunga qarab hisoblanadi.</p>
      <button class="btn soft" data-act="edit-goal">Maqsad qoʻyish</button></section>`;
  }
  let bar = '', text, badge = '';
  if (st.state === 'setup') {
    text = 'Kutilayotgan tushumni kiriting — shunda kunlik limit hisoblanadi.';
  } else if (st.forecast === null) {
    text = st.shortfall
      ? `Maqsadga yetish uchun <b>${money(st.shortfall)}</b> yetishmayapti. Xarajatni kamaytiring yoki maqsadni oʻzgartiring.`
      : `Kunlik limitga amal qilsangiz, oy oxirida <b>${money(st.goal)}</b> tejab qolasiz.`;
    if (st.shortfall) badge = '<span class="badge bad">Xavf ostida</span>';
  } else {
    const f = st.forecast, diff = f - st.goal;
    const pct = Math.max(0, Math.min(100, f / st.goal * 100));
    bar = `<div class="goal-bar${diff < 0 ? ' behind' : ''}"><i style="width:${pct}%"></i></div>`;
    if (diff >= 0) {
      badge = '<span class="badge ok">✓ Yoʻlda</span>';
      text = `Shu surʼatda oy oxirida taxminan <b>${money(f)}</b> tejaysiz` + (diff >= cur().step * 10 ? ` — maqsaddan ${money(diff)} koʻp.` : '.');
    } else if (f >= 0) {
      badge = '<span class="badge bad">Ortda</span>';
      text = `Shu surʼatda taxminan <b>${money(f)}</b> tejaysiz — maqsaddan <b>${money(-diff)}</b> kam. Kunlik limitdan oshirmang.`;
    } else {
      badge = '<span class="badge bad">Xavf ostida</span>';
      text = `Shu surʼatda oy oxirida <b>${money(-f)}</b> yetmay qoladi. Kunlik limitdan oshirmang.`;
    }
  }
  return `<section class="card">
    <div class="card-title"><h2>Oy oxiridagi maqsad</h2><button class="link" data-act="edit-goal">${money(st.goal)}</button></div>
    ${bar}
    <p class="goal-text">${badge ? badge + ' ' : ''}${text}</p>
  </section>`;
}

function viewHome() {
  const st = monthStats(curKey());
  const t = today();
  const [, m, d] = t.split('-').map(Number);
  const todays = S.tx.filter(x => x.date === t).sort(byRecent);
  const pending = st.planned > st.income ? st.planned - st.income : 0;
  const fixedLeft = st.reserved - st.fixedPaid;
  const install = isIosBrowser() && !S.hideInstall ? `<section class="card install">
      <span class="em">📲</span>
      <p><b>iPhone’ga oʻrnating.</b> Safari’da pastdagi «Ulashish» tugmasi → «Ekranga qoʻshish». Maʼlumotlar oʻrnatilgan ilovada alohida saqlanadi.</p>
      <button class="x" data-act="hide-install" aria-label="Yopish">✕</button>
    </section>` : '';
  return `
    <header class="page-head">
      <div><div class="sub">${d}-${MONTHS[m - 1].toLowerCase()}, ${WEEKDAYS[new Date().getDay()]}</div><h1>Bugun</h1></div>
    </header>
    ${install}
    ${heroHTML(st)}
    ${goalHTML(st)}
    <section class="card">
      <div class="card-title"><h2>${monthTitle(st.key)}</h2><button class="link" data-act="go" data-tab="stats">Tahlil</button></div>
      <div class="kv"><span>Tushum${pending ? `<small>yana ${compact(pending)} kutilmoqda</small>` : ''}</span><b class="pos">+${money(st.income)}</b></div>
      <div class="kv"><span>Kundalik xarajatlar</span><b>−${money(st.regSpent)}</b></div>
      ${st.reserved ? `<div class="kv"><span>Majburiy toʻlovlar${fixedLeft ? `<small>yana ${compact(fixedLeft)} toʻlanadi</small>` : ''}</span><b>−${money(st.fixedPaid)}</b></div>` : ''}
      <div class="kv"><span>Hozirgi qoldiq</span><b class="${st.saved < 0 ? 'neg' : ''}">${money(st.saved)}</b></div>
    </section>
    <section class="card">
      <div class="card-title"><h2>Bugungi yozuvlar</h2><button class="link" data-act="go" data-tab="history">Hammasi</button></div>
      ${todays.length ? `<div class="tx-list">${todays.map(txRow).join('')}</div>`
        : `<div class="empty"><span class="big">🧾</span>Hali yozuv yoʻq.<br>Xarajat yoki tushum qoʻshish uchun <b>+</b> tugmasini bosing.</div>`}
    </section>`;
}

function monthSwitcher() {
  const key = ui.viewMonth;
  let min = curKey();
  for (const t of S.tx) if (t.date.slice(0, 7) < min) min = t.date.slice(0, 7);
  return `<div class="month-sw">
    <button data-act="month" data-d="-1" ${key <= min ? 'disabled' : ''} aria-label="Oldingi oy">${ICON.back}</button>
    <b>${monthTitle(key)}</b>
    <button data-act="month" data-d="1" ${key >= curKey() ? 'disabled' : ''} aria-label="Keyingi oy">${ICON.fwd}</button>
  </div>`;
}

function viewHistory() {
  const key = ui.viewMonth;
  const st = monthStats(key);
  const list = S.tx.filter(t => t.date.slice(0, 7) === key && (ui.filter === 'all' || t.type === ui.filter)).sort(byRecent);
  const groups = [];
  for (const t of list) {
    const g = groups[groups.length - 1];
    if (g && g.date === t.date) g.items.push(t); else groups.push({ date: t.date, items: [t] });
  }
  const body = groups.map(g => {
    const d = +g.date.slice(8);
    const exp = g.items.reduce((s, t) => s + (t.type === 'expense' ? t.amount : 0), 0);
    const inc = g.items.reduce((s, t) => s + (t.type === 'income' ? t.amount : 0), 0);
    const over = st.byDay[d] > st.limits[d];
    const tot = exp
      ? `<span class="tot" title="${over ? 'Limitdan oshgan' : 'Limit ichida'}"><i class="dot${over ? ' over' : ''}"></i>−${money(exp)}${over ? ' · limitdan oshgan' : ''}</span>`
      : `<span class="tot">+${money(inc)}</span>`;
    return `<div class="day-head"><span>${dateLabel(g.date)}</span>${tot}</div>
      <section class="card flush"><div class="tx-list">${g.items.map(txRow).join('')}</div></section>`;
  }).join('');
  const f = (id, label) => `<button data-act="filter" data-f="${id}" class="${ui.filter === id ? 'on' : ''}">${label}</button>`;
  return `
    <header class="page-head"><h1>Tarix</h1></header>
    ${monthSwitcher()}
    <div class="seg on-bg filters">${f('all', 'Hammasi')}${f('expense', 'Xarajat')}${f('income', 'Tushum')}</div>
    ${body || `<div class="empty" style="padding-top:60px"><span class="big">🗓️</span>Bu oyda yozuvlar yoʻq.</div>`}`;
}

function niceMax(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return [1, 2, 3, 4, 5, 6, 8, 10].find(k => n <= k) * p;
}
const CH = { W: 340, H: 150, L: 52, R: 4, T: 8, B: 20 };
function chartHTML(st) {
  const { W, H, L, R, T, B } = CH;
  const pw = W - L - R, ph = H - T - B;
  const top = niceMax(Math.max(1, ...st.byDay.slice(1)));
  const slot = pw / st.dim;
  const bw = Math.min(24, Math.max(3, slot - 2));
  let g = '';
  for (const k of [0, 0.5, 1]) {
    const y = T + ph - ph * k;
    g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text x="${L - 6}" y="${y + 3.5}" text-anchor="end">${k ? compact(top * k) : '0'}</text>`;
  }
  for (const d of [1, 5, 10, 15, 20, 25, 30]) {
    if (d <= st.dim) g += `<text x="${L + slot * (d - 0.5)}" y="${H - 5}" text-anchor="middle">${d}</text>`;
  }
  for (let d = 1; d <= st.dim; d++) {
    const v = st.byDay[d];
    if (!v) continue;
    const h = Math.max(2, v / top * ph);
    const x = L + slot * (d - 1) + (slot - bw) / 2, y = T + ph - h;
    const r = Math.min(4, bw / 2, h);
    g += `<path class="bar${v > st.limits[d] ? ' over' : ''}" data-d="${d}" d="M${x},${T + ph}V${y + r}a${r},${r} 0 0 1 ${r},${-r}h${bw - 2 * r}a${r},${r} 0 0 1 ${r},${r}V${T + ph}z"/>`;
  }
  return `<svg class="chart" id="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Kunlik xarajatlar grafigi" style="touch-action:pan-y">${g}</svg>`;
}
function readoutHTML(st, d) {
  if (d) {
    const v = st.byDay[d], lim = st.limits[d];
    return `<b>${dateLabel(`${st.key}-${pad(d)}`, false)}</b>: ${money(v)} · limit ${money(lim)}${v > lim ? ' · <b>oshgan</b>' : ''}`;
  }
  const days = st.isCurrent ? st.day : st.dim;
  const total = st.byDay.reduce((a, b) => a + b, 0);
  return total ? `Kuniga oʻrtacha <b>${money(floorLimit(total / days))}</b>` : 'Bu oyda kundalik xarajat yoʻq';
}

function viewStats() {
  const st = monthStats(ui.viewMonth);
  let savedTile;
  if (st.isCurrent) {
    savedTile = `<div class="row"><b class="${st.saved < 0 ? 'neg' : ''}">${money(st.saved)}</b></div>
      <div class="hint">${st.goal ? `Oy oxiridagi maqsad: ${money(st.goal)}` : 'Maqsad belgilanmagan'}</div>`;
  } else {
    const ok = st.goal > 0 && st.saved >= st.goal;
    savedTile = `<div class="row"><b class="${st.saved < 0 ? 'neg' : ''}">${money(st.saved)}</b>
        ${st.goal ? `<span class="badge ${ok ? 'ok' : 'bad'}">${ok ? '✓ Maqsad bajarildi' : 'Maqsadga yetmadi'}</span>` : ''}</div>
      <div class="hint">${st.goal ? `Maqsad: ${money(st.goal)}${ok ? '' : ` · ${money(st.goal - st.saved)} kam`}` : 'Maqsad belgilanmagan'}</div>`;
  }
  const catRows = Object.entries(st.cats).sort((a, b) => b[1] - a[1]);
  const maxCat = catRows.length ? catRows[0][1] : 1;
  const catsHTML = catRows.map(([id, v]) => {
    const c = catInfo('expense', id);
    return `<div class="cat-row">
      <div class="top"><span>${c[1]}</span><span class="nm">${c[2]}</span><span class="pc">${Math.round(v / st.spent * 100)}%</span><b>${money(v)}</b></div>
      <div class="track"><i style="width:${v / maxCat * 100}%"></i></div>
    </div>`;
  }).join('');
  return `
    <header class="page-head"><h1>Tahlil</h1></header>
    ${monthSwitcher()}
    <div class="tiles">
      <div class="tile"><small>Tushum</small><b class="pos">+${fmtNum(st.income)}</b></div>
      <div class="tile"><small>Xarajat</small><b>−${fmtNum(st.spent)}</b></div>
      <div class="tile wide"><small>${st.isCurrent ? 'Hozirgi qoldiq' : 'Tejaldi'}</small>${savedTile}</div>
    </div>
    <section class="card">
      <div class="card-title"><h2>Kunlik xarajatlar</h2></div>
      <div class="readout" id="readout">${readoutHTML(st, null)}</div>
      ${chartHTML(st)}
      <div class="legend"><span><i></i>Limit ichida</span><span><i class="over"></i>Limitdan oshgan</span></div>
      ${st.fixedPaid ? '<p class="footnote" style="margin:8px 0 0">Majburiy toʻlovlar grafikka kirmaydi.</p>' : ''}
    </section>
    <section class="card">
      <div class="card-title"><h2>Toifalar boʻyicha</h2><span class="right">${money(st.spent)}</span></div>
      ${catsHTML || '<div class="empty">Xarajatlar yoʻq.</div>'}
    </section>`;
}
function bindChart() {
  const svg = $('#chart');
  if (!svg) return;
  const st = monthStats(ui.viewMonth);
  const lastDay = st.isCurrent ? st.day : st.dim;
  const pick = e => {
    const r = svg.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * CH.W;
    const d = Math.max(1, Math.min(lastDay, Math.floor((x - CH.L) / ((CH.W - CH.L - CH.R) / st.dim)) + 1));
    if (d === ui.selDay) return;
    ui.selDay = d;
    svg.classList.add('has-sel');
    svg.querySelectorAll('.bar').forEach(b => b.classList.toggle('sel', +b.dataset.d === d));
    $('#readout').innerHTML = readoutHTML(st, d);
  };
  let down = false;
  svg.addEventListener('pointerdown', e => { down = true; pick(e); });
  svg.addEventListener('pointermove', e => { if (down || e.pointerType === 'mouse') pick(e); });
  window.addEventListener('pointerup', () => { down = false; }, { once: false });
  svg.addEventListener('pointerleave', e => {
    if (e.pointerType !== 'mouse') return;
    ui.selDay = null;
    svg.classList.remove('has-sel');
    $('#readout').innerHTML = readoutHTML(st, null);
  });
}

function viewSettings() {
  const key = curKey();
  const plan = planFor(key);
  const seg = (id, label) => `<button data-act="theme" data-t="${id}" class="${S.theme === id ? 'on' : ''}">${label}</button>`;
  return `
    <header class="page-head"><h1>Sozlamalar</h1></header>
    <div class="section-label">Reja · ${monthTitle(key)} · ${cur().label}</div>
    <div class="group">
      <button class="cell" data-act="edit-goal"><span class="em">🎯</span><span class="lbl">Tejash maqsadi<small>Oy oxirida qoladigan summa</small></span><span class="val">${fmtNum(plan.goal || 0)}</span>${ICON.chev}</button>
      <button class="cell" data-act="edit-income"><span class="em">💼</span><span class="lbl">Tushum rejasi<small>Shu oydagi jami daromad</small></span><span class="val">${fmtNum(plan.income || 0)}</span>${ICON.chev}</button>
      <button class="cell" data-act="edit-fixed"><span class="em">📌</span><span class="lbl">Majburiy toʻlovlar<small>Ijara, kredit, kommunal</small></span><span class="val">${fmtNum(plan.fixed || 0)}</span>${ICON.chev}</button>
    </div>
    <p class="footnote">Kunlik limit = (tushum − maqsad − majburiy toʻlovlar − kundalik xarajatlar) ÷ oy oxirigacha qolgan kunlar. Reja keyingi oylarga ham oʻtadi.</p>

    <div class="section-label">Umumiy</div>
    <div class="group">
      <label class="cell"><span class="em">💱</span><span class="lbl">Valyuta</span><span class="val">${cur().name}</span>${ICON.chev}
        <select data-change="currency" aria-label="Valyuta">${Object.entries(CUR).map(([k, c]) => `<option value="${k}"${k === S.currency ? ' selected' : ''}>${c.name} (${c.label})</option>`).join('')}</select>
      </label>
      <div class="cell"><span class="em">🌗</span><span class="lbl">Mavzu</span>
        <div class="seg on-bg">${seg('auto', 'Avto')}${seg('light', 'Yorugʻ')}${seg('dark', 'Tungi')}</div>
      </div>
    </div>

    <div class="section-label">Maʼlumotlar</div>
    <div class="group">
      <button class="cell" data-act="export"><span class="em">📤</span><span class="lbl">Zaxira nusxa olish<small>${S.tx.length} ta yozuv · JSON fayl</small></span>${ICON.chev}</button>
      <label class="cell"><span class="em">📥</span><span class="lbl">Zaxiradan tiklash</span>${ICON.chev}
        <input type="file" accept="application/json,.json" data-change="import" hidden>
      </label>
      <button class="cell danger" data-act="reset"><span class="em">🗑️</span><span class="lbl">Barcha maʼlumotlarni oʻchirish</span></button>
    </div>
    <p class="footnote">Maʼlumotlaringiz faqat shu qurilmada saqlanadi va hech qayerga yuborilmaydi. Telefon almashtirishdan oldin zaxira nusxa oling.</p>`;
}

const VIEWS = { home: viewHome, history: viewHistory, stats: viewStats, settings: viewSettings };
const TABS = [['home', 'Bugun', ICON.home], ['history', 'Tarix', ICON.list], null, ['stats', 'Tahlil', ICON.chart], ['settings', 'Sozlamalar', ICON.gear]];

let renderedDay = today();
function render(keepScroll) {
  renderedDay = today();
  if (!ui.viewMonth || ui.viewMonth > curKey()) ui.viewMonth = curKey();
  const v = $('#view');
  const top = v.scrollTop;
  ui.selDay = null;
  v.innerHTML = VIEWS[ui.tab]();
  v.scrollTop = keepScroll ? top : 0;
  $('#tabbar').innerHTML = TABS.map(t => t
    ? `<button class="tab${ui.tab === t[0] ? ' on' : ''}" data-act="go" data-tab="${t[0]}" aria-current="${ui.tab === t[0] ? 'page' : 'false'}">${t[2]}<span>${t[1]}</span></button>`
    : `<button class="fab" data-act="add" aria-label="Yozuv qoʻshish">${ICON.plus}</button>`).join('');
  if (ui.tab === 'stats') bindChart();
}

// ───────────────────────── Theme ─────────────────────────
function applyTheme() {
  const root = document.documentElement;
  if (S.theme === 'auto') delete root.dataset.theme; else root.dataset.theme = S.theme;
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  if (bg) $('#theme-color').setAttribute('content', bg);
}

// ───────────────────────── Onboarding ─────────────────────────
const isStandalone = () => window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
const isIosBrowser = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone();
let ob = null;
function startOnboarding() {
  ob = { step: isIosBrowser() ? 'install' : 'welcome', income: '', fixed: '', goal: '', pre: '' };
  const el = document.createElement('div');
  el.className = 'onb';
  el.id = 'onb';
  overlayRoot.append(el);
  renderOnb();
}
function obSteps() {
  const s = ['income', 'fixed', 'goal'];
  if (+today().slice(8) > 1) s.push('pre');
  s.push('result');
  return s;
}
function obCalc() {
  const t = today();
  const dim = new Date(+t.slice(0, 4), +t.slice(5, 7), 0).getDate();
  const daysLeft = dim - +t.slice(8) + 1;
  const income = strToAmt(ob.income), fixed = strToAmt(ob.fixed), goal = strToAmt(ob.goal), pre = strToAmt(ob.pre);
  return { daysLeft, income, fixed, goal, pre, limit: floorLimit((income - fixed - goal - pre) / daysLeft) };
}
function renderOnb() {
  const el = $('#onb');
  if (!el || !ob) return;
  const steps = obSteps();
  const idx = steps.indexOf(ob.step);
  const top = idx >= 0 ? `<div class="onb-top">
      <button class="back" data-act="ob-back" aria-label="Orqaga">${ICON.back}</button>
      <div class="steps">${steps.map((_, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>
    </div>` : '';
  const c = obCalc();
  let body = '', foot = '';
  const amountStep = (field, title, lead, extra, canSkip) => {
    kp = { get value() { return ob[field]; }, set value(v) { ob[field] = v; }, onChange: renderOnb };
    const warn = field === 'goal' && c.goal > 0 && c.goal >= c.income - c.fixed ? 'Maqsad tushumdan (majburiy toʻlovlarsiz) kichik boʻlishi kerak'
      : field === 'fixed' && c.fixed >= c.income ? 'Majburiy toʻlovlar tushumdan kichik boʻlishi kerak' : '';
    body = `<div class="onb-body"><h1>${title}</h1><p class="lead">${lead}</p>
      <div style="margin-top:14px">${amountHTML(ob[field])}</div>${extra || ''}</div>`;
    const ok = field === 'income' ? c.income > 0 : !warn;
    foot = `<div class="warn-text">${warn}</div>${keypadHTML()}
      <button class="btn" data-act="ob-next" ${ok ? '' : 'disabled'}>${canSkip && !strToAmt(ob[field]) ? 'Oʻtkazib yuborish' : 'Davom etish'}</button>`;
  };
  switch (ob.step) {
    case 'install':
      body = `<div class="onb-body">
        <img class="logo" src="icons/icon-192.png" alt="">
        <h1>Avval iPhone’ga oʻrnating</h1>
        <p class="lead">Shunda Moliya oddiy ilova kabi toʻliq ekranda, internetsiz ham ishlaydi va maʼlumotlaringiz ishonchli saqlanadi.</p>
        <div class="features">
          <div><span>1️⃣</span><p><b>«Ulashish» tugmasini bosing</b>Safari’ning pastki panelidagi yuqoriga strelkali kvadrat.</p></div>
          <div><span>2️⃣</span><p><b>«Ekranga qoʻshish»ni tanlang</b>Roʻyxatni pastga suring — «На экран Домой» / «Add to Home Screen».</p></div>
          <div><span>3️⃣</span><p><b>Ilovani ekrandagi belgidan oching</b>Sozlashni oʻsha yerda davom ettirasiz.</p></div>
        </div></div>`;
      foot = `<button class="btn ghost" data-act="ob-skip-install">Brauzerda davom etish</button>`;
      break;
    case 'welcome':
      body = `<div class="onb-body">
        <img class="logo" src="icons/icon-192.png" alt="">
        <h1>Moliya</h1>
        <p class="lead">Oy oxirida qancha tejab qolmoqchi ekaningizni ayting — har kuni qancha sarflash mumkinligini ilova oʻzi hisoblab beradi.</p>
        <div class="features">
          <div><span>🎯</span><p><b>Tejash maqsadi</b>Oy oxirida qolishi kerak boʻlgan summani belgilaysiz.</p></div>
          <div><span>📆</span><p><b>Kunlik limit</b>Har bir xarajat va tushumdan keyin avtomatik qayta hisoblanadi.</p></div>
          <div><span>⚡️</span><p><b>Ikki soniyada yozuv</b>Summa, toifa — tayyor.</p></div>
        </div></div>`;
      foot = `<button class="btn" data-act="ob-next">Boshlash</button>`;
      break;
    case 'income':
      amountStep('income', 'Bu oy qancha tushum kutyapsiz?', 'Maosh va boshqa daromadlar — jami. Keyin oʻzgartirish mumkin.',
        `<label class="cur-pick">Valyuta: ${cur().name} ▾<select data-change="ob-currency" aria-label="Valyuta">${Object.entries(CUR).map(([k, x]) => `<option value="${k}"${k === S.currency ? ' selected' : ''}>${x.name} (${x.label})</option>`).join('')}</select></label>`);
      break;
    case 'fixed':
      amountStep('fixed', 'Har oy majburiy toʻlovlaringiz qancha?', 'Ijara, kredit, kommunal — jami. Ular kunlik limitga kirmaydi, oldindan ajratib qoʻyiladi.', '', true);
      break;
    case 'goal': {
      const quick = c.income > 0 ? `<div class="quick" style="margin-top:12px">${[10, 20, 30].map(p => {
        const v = amtToStr(Math.round(c.income * p / 100));
        return `<button class="chip${ob.goal === v ? ' on' : ''}" data-act="ob-quick" data-v="${v}">${p}%</button>`;
      }).join('')}</div>` : '';
      amountStep('goal', 'Oy oxirida qancha tejab qolmoqchisiz?', 'Bu — asosiy maqsadingiz. Kunlik limit shu summa saqlanib qoladigan qilib hisoblanadi.', quick);
      break;
    }
    case 'pre':
      amountStep('pre', 'Bu oy kundalik xarajatlarga qancha ketdi?', `Bugun oyning ${+today().slice(8)}-kuni. Majburiy toʻlovlarni qoʻshmasdan, taxminan yozing — limit aniqroq chiqadi.`, '', true);
      break;
    case 'result':
      body = `<div class="onb-body"><h1>Hammasi tayyor 🎉</h1>
        <div class="onb-result"><small>Kunlik limitingiz</small>
          <span class="num">${fmtNum(c.limit)}<span>${cur().label}</span></span>
          <p>Oy oxirigacha ${c.daysLeft} kun · maqsad ${money(c.goal)}</p></div>
        <p class="lead">${c.limit > 0
          ? 'Har kuni shu summadan oshirmasangiz, oy oxirida maqsadingizdagi pul tejalib qoladi. Kam sarflasangiz — ertangi limit oshadi.'
          : 'Hozirgi raqamlar bilan maqsadga yetib boʻlmaydi. Orqaga qaytib maqsadni kamaytiring yoki shu holatda davom eting.'}</p></div>`;
      foot = `<button class="btn" data-act="ob-finish">Boshladik</button>`;
      break;
  }
  el.innerHTML = top + body + foot;
}
function obNext() {
  const steps = obSteps();
  if (ob.step === 'welcome') ob.step = steps[0];
  else ob.step = steps[Math.min(steps.length - 1, steps.indexOf(ob.step) + 1)];
  renderOnb();
}
function obBack() {
  const steps = obSteps();
  const i = steps.indexOf(ob.step);
  ob.step = i <= 0 ? 'welcome' : steps[i - 1];
  renderOnb();
}
function obFinish() {
  const c = obCalc();
  const t = today();
  S.plans[t.slice(0, 7)] = { goal: c.goal, income: c.income, fixed: c.fixed };
  if (c.pre > 0) S.tx.push({ id: uid(), type: 'expense', amount: c.pre, cat: 'pre', note: '', date: addDays(t, -1), ts: Date.now() });
  S.since = t;
  S.onboarded = true;
  save();
  ob = null;
  const el = $('#onb');
  if (el) el.remove();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  render();
}

// ───────────────────────── Export / import ─────────────────────────
async function exportData() {
  const name = `moliya-zaxira-${today()}.json`;
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Moliya zaxira nusxasi' });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast('Zaxira fayl saqlandi');
}
function importData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = JSON.parse(reader.result); } catch (e) { data = null; }
    if (!data || typeof data !== 'object' || !Array.isArray(data.tx) || typeof data.plans !== 'object') {
      toast('Bu Moliya zaxira fayli emas');
      return;
    }
    const next = normalize(data);
    openConfirm({
      title: 'Zaxiradan tiklansinmi?',
      text: `Fayldagi ${next.tx.length} ta yozuv hozirgi maʼlumotlar oʻrnini egallaydi.`,
      ok: 'Tiklash',
      onOk() { S = next; S.onboarded = true; save(); applyTheme(); render(); toast('Tiklandi'); },
    });
  };
  reader.readAsText(file);
}

// ───────────────────────── Actions ─────────────────────────
const actions = {
  go(el) { const same = ui.tab === el.dataset.tab; ui.tab = el.dataset.tab; render(false); if (same) $('#view').scrollTop = 0; },
  add() { openTx(null); },
  'tx-edit'(el) { openTx(el.dataset.id); },
  'tx-type'(el) {
    if (!draft || draft.type === el.dataset.type) return;
    draft.type = el.dataset.type;
    draft.cat = S.lastCat[draft.type];
    refreshTxType();
  },
  'tx-cat'(el) {
    if (!draft) return;
    draft.cat = el.dataset.cat;
    sheetEl.querySelectorAll('#tx-cats .chip').forEach(c => c.classList.toggle('on', c === el));
    refreshTxAmount();
  },
  'tx-save': saveTx,
  'tx-delete': deleteTx,
  key(el) {
    const next = kpApply(kp.value, el.dataset.k);
    if (next !== kp.value) { kp.value = next; kp.onChange(); }
  },
  'sheet-close'() { closeSheet(); },
  'toast-action'() { const f = toastAction; toastAction = null; $('#toast').classList.remove('in'); if (f) f(); },
  'amount-save'() {
    if (!amountCtx) return;
    const { opt, str } = amountCtx;
    const err = opt.validate ? opt.validate(strToAmt(str)) : '';
    if (err) { toast(err); return; }
    closeSheet();
    opt.onSave(strToAmt(str));
    amountCtx = null;
  },
  'confirm-ok'() { const f = confirmCb; confirmCb = null; closeSheet(); if (f) f(); },
  'edit-goal'() { editPlan('goal', 'Tejash maqsadi', k => `${monthTitle(k)} oxirida qancha pul tejab qolmoqchisiz?`, 'Maqsad yangilandi'); },
  'edit-income'() { editPlan('income', 'Kutilayotgan tushum', k => `${monthTitle(k)} davomidagi jami daromadingiz.`, 'Tushum rejasi yangilandi'); },
  'edit-fixed'() { editPlan('fixed', 'Majburiy toʻlovlar', () => 'Ijara, kredit, kommunal kabi har oylik toʻlovlar — jami.', 'Majburiy toʻlovlar yangilandi'); },
  month(el) { ui.viewMonth = shiftMonth(ui.viewMonth, +el.dataset.d); render(false); },
  filter(el) { ui.filter = el.dataset.f; render(false); },
  theme(el) { S.theme = el.dataset.t; save(); applyTheme(); render(true); },
  'hide-install'() { S.hideInstall = true; save(); render(true); },
  export: exportData,
  reset() {
    openConfirm({
      title: 'Hammasi oʻchirilsinmi?', text: 'Barcha yozuvlar va reja butunlay oʻchadi. Bu amalni qaytarib boʻlmaydi.',
      ok: 'Ha, oʻchirish', danger: true,
      onOk() { S = defaults(); save(); applyTheme(); ui.tab = 'home'; render(); startOnboarding(); },
    });
  },
  'ob-next': obNext,
  'ob-back': obBack,
  'ob-finish': obFinish,
  'ob-skip-install'() { ob.step = 'welcome'; renderOnb(); },
  'ob-quick'(el) { ob.goal = el.dataset.v; renderOnb(); },
};
const changes = {
  'tx-date'(el) {
    if (!draft || !el.value) return;
    draft.date = el.value > today() ? today() : el.value;
    $('#tx-date', sheetEl).textContent = dateLabel(draft.date, false);
    refreshTxAmount();
  },
  currency(el) { S.currency = el.value; save(); render(true); },
  'ob-currency'(el) { S.currency = el.value; ob.income = ob.fixed = ob.goal = ob.pre = ''; save(); renderOnb(); },
  import(el) { importData(el.files[0]); el.value = ''; },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.act];
  if (fn) fn(el, e);
});
document.addEventListener('change', e => {
  const fn = e.target.dataset && changes[e.target.dataset.change];
  if (fn) fn(e.target);
});
document.addEventListener('input', e => {
  if (e.target.dataset && e.target.dataset.input === 'tx-note' && draft) draft.note = e.target.value;
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('note-input')) e.target.blur();
  if (e.key === 'Escape') closeSheet();
});

// Kun almashganda (yarim tunda yoki ilovaga qaytganda) limitni yangilash
function refreshIfNewDay() { if (S.onboarded && today() !== renderedDay) render(true); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshIfNewDay(); });
setInterval(refreshIfNewDay, 30000);
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

// ───────────────────────── Boot ─────────────────────────
applyTheme();
render();
if (!S.onboarded) startOnboarding();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
window.Moliya = { stats: monthStats, get state() { return S; } };
})();
