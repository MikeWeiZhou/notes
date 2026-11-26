/* Todo Calendar app: data model, recurrence, storage, sheets.
   Tasks live in localStorage under one versioned key. Every task has a random id and
   updatedAt, and deletions leave a tombstone, so a sync backend can merge later. */
(function () {
  'use strict';
  const TCL = (window.TCL = {});

  /* ---------- projects ----------
     Projects are user data: db.projects = [{id, name, color, updatedAt}].
     TCL.PROJECTS is a live id -> {name, color} map rebuilt after every change. */
  TCL.PALETTE = ['#3b6fd8', '#d6457a', '#e0762b', '#8a5bd6', '#14998f', '#c8372d', '#2f9e44', '#b8860b', '#0e8fc0', '#a0522d', '#6b7a8f', '#c2185b'];
  TCL.PROJECTS = {};
  const UNKNOWN = { name: 'Unknown project', color: '#8a9a96' };
  TCL.project = (id) => TCL.PROJECTS[id] || UNKNOWN;
  TCL.color = (id) => TCL.project(id).color;
  const SAMPLE_PROJECTS = { work: ['Work', '#3b6fd8'], personal: ['Personal', '#d6457a'], health: ['Health', '#e0762b'], home: ['Home', '#8a5bd6'], learn: ['Learning', '#14998f'] };

  /* ---------- dates ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => {
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    const t = new Date(y, m - 1, d);
    if (s.length > 10) { const [h, mi] = s.slice(11, 16).split(':').map(Number); t.setHours(h, mi); }
    return t;
  };
  const sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const addDays = (d, n) => { const t = new Date(d); t.setDate(t.getDate() + n); return t; };
  const sow = (d) => addDays(sod(d), -((d.getDay() + 6) % 7)); // Monday
  const stamp = (d) => `${key(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const dayDiff = (a, b) => Math.round((sod(b) - sod(a)) / 864e5);
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 't' + Date.now().toString(36) + Math.random().toString(36).slice(2));
  Object.assign(TCL, { pad, key, parse, sod, addDays, sow, stamp, dayDiff, uid });

  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  TCL.DOW = DOW; TCL.MON = MON;
  TCL.fmtTime = (d) => {
    const h = d.getHours(), m = d.getMinutes();
    return `${h % 12 || 12}${m ? ':' + pad(m) : ''}${h < 12 ? 'am' : 'pm'}`;
  };
  TCL.fmtDay = (d) => `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
  TCL.fmtDur = (m) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}`);
  TCL.fmtHours = (m) => `${Math.round(m / 6) / 10}h`;
  TCL.relDue = (o, now = new Date()) => {
    const ms = o.due - now;
    const dd = dayDiff(now, o.due);
    const t = o.hasTime ? ' ' + TCL.fmtTime(o.due) : '';
    if (ms < 0) return dd === 0 ? `today${t}` : dd === -1 ? 'yesterday' : `${Math.abs(dd)}d ago`;
    if (dd === 0) return `today${t}`;
    if (dd === 1) return `tomorrow${t}`;
    if (dd < 7) return `${DOW[o.due.getDay()]}${t}`;
    return `${o.due.getDate()} ${MON[o.due.getMonth()]}`;
  };
  TCL.countdown = (o, now = new Date()) => {
    let ms = o.due - now;
    const neg = ms < 0; ms = Math.abs(ms);
    const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
    const s = d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`;
    return neg ? `${s} late` : `${s} left`;
  };
  TCL.recurText = (r) => {
    if (!r) return '';
    const ev = r.every || 1;
    if (r.freq === 'daily') return ev === 1 ? 'Every day' : `Every ${ev} days`;
    if (r.freq === 'weekly') {
      const ds = r.days || [];
      if (ds.length === 5 && [1, 2, 3, 4, 5].every((x) => ds.includes(x))) return 'Weekdays';
      return 'Every ' + ds.map((x) => DOW[x]).join(', ');
    }
    if (r.freq === 'monthly') return `Monthly on the ${r.dom}${['th', 'st', 'nd', 'rd'][(r.dom % 10 < 4 && Math.floor(r.dom / 10) !== 1) ? r.dom % 10 : 0]}`;
    return '';
  };

  /* ---------- sample data (relative to today) ---------- */
  function sample() {
    const T = sod(new Date());
    const D = (n, time) => key(addDays(T, n)) + (time ? 'T' + time : '');
    let id = 0;
    const mk = (o) => Object.assign({ id: uid(), sample: true, dur: 60, done: false, updatedAt: Date.now() }, o);
    return [
      mk({ title: 'Q4 report draft', project: 'work', due: D(2, '17:00'), dur: 240, start: D(1, '09:30'), note: 'Pull numbers from the dashboard. Six pages max.' }),
      mk({ title: "Review Ana's pull request", project: 'work', due: D(0, '15:00'), dur: 45, start: D(0, '13:00') }),
      mk({ title: 'Slides for Monday sync', project: 'work', due: D(4, '10:00'), dur: 90 }),
      mk({ title: 'Submit expense receipts', project: 'work', due: D(-1), dur: 30 }),
      mk({ title: '1:1 notes for Sam', project: 'work', due: D(2, '11:00'), dur: 20 }),
      mk({ title: 'Team retro', project: 'work', due: D(3, '15:00'), dur: 60, start: D(3, '14:00') }),
      mk({ title: 'Client proposal v2', project: 'work', due: D(8, '17:00'), dur: 180, start: D(7, '10:00') }),
      mk({ title: 'Quarterly planning doc', project: 'work', due: D(11, '12:00'), dur: 150 }),
      mk({ title: 'Call insurance', project: 'personal', due: D(0), dur: 20, done: true }),
      mk({ title: 'Birthday gift for Mom', project: 'personal', due: D(6), dur: 45 }),
      mk({ title: 'Renew passport', project: 'personal', due: D(12), dur: 60 }),
      mk({ title: 'Plan holiday trip', project: 'personal', due: D(15), dur: 120 }),
      mk({ title: 'Tax documents to accountant', project: 'personal', due: D(18, '12:00'), dur: 90 }),
      mk({ title: 'Book dentist', project: 'health', due: D(3), dur: 15 }),
      mk({ title: 'Grocery run', project: 'home', due: D(1, '19:00'), dur: 45, start: D(1, '18:00') }),
      mk({ title: 'Fix leaking tap', project: 'home', due: D(5), dur: 60, start: D(5, '18:30') }),
      mk({ title: 'Clean out garage', project: 'home', due: D(10), dur: 180 }),
      mk({ title: 'Car service', project: 'home', due: D(13, '09:00'), dur: 120, start: D(13, '08:00') }),
      mk({ title: 'Online course: module 4', project: 'learn', due: D(7), dur: 120 }),
      mk({ title: 'Read Deep Work ch. 3', project: 'learn', due: D(9), dur: 40 }),
      mk({ title: 'Write blog post', project: 'learn', due: D(20), dur: 150 }),
      mk({ title: 'Gym', project: 'health', dur: 60, recur: { freq: 'weekly', days: [1, 3, 5], at: '07:00', from: D(-35) } }),
      mk({ title: 'Team standup', project: 'work', dur: 15, recur: { freq: 'weekly', days: [1, 2, 3, 4, 5], at: '09:15', from: D(-35) } }),
      mk({ title: 'Spanish practice', project: 'learn', dur: 20, recur: { freq: 'daily', at: '21:00', from: D(-35) } }),
      mk({ title: 'Weekly review', project: 'personal', dur: 30, recur: { freq: 'weekly', days: [5], at: '16:30', from: D(-35) } }),
      mk({ title: 'Water plants', project: 'home', dur: 10, recur: { freq: 'daily', every: 3, from: D(-1) } }),
      mk({ title: 'Pay rent', project: 'home', dur: 10, recur: { freq: 'monthly', dom: 1, from: D(-70) } }),
    ].map((t) => {
      // pretend some past habit occurrences were done, for streak views
      if (t.recur) {
        t.doneDates = {};
        for (let i = 1; i <= 14; i++) if ((i * 7 + t.title.length) % 5 !== 0) t.doneDates[key(addDays(T, -i))] = true;
      }
      return t;
    });
  }

  /* ---------- storage ---------- */
  const KEY = 'todocal.v1';
  let db = null; // {version, tasks, deleted: {id: time}}
  const listeners = [];
  function load() {
    if (db) return db;
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.tasks)) db = Object.assign({ deleted: {} }, s); } catch (e) {}
    if (!db) db = { version: 2, tasks: [], projects: [], deleted: {}, created: Date.now() };
    if (!db.projects) { // v1 had five fixed projects keyed by name
      db.projects = [];
      const used = new Set(db.tasks.map((t) => t.project));
      for (const [id, [name, color]] of Object.entries(SAMPLE_PROJECTS)) if (used.has(id)) db.projects.push({ id, name, color, updatedAt: Date.now() });
      db.version = 2;
    }
    syncProjects();
    return db;
  }
  function syncProjects() {
    Object.keys(TCL.PROJECTS).forEach((k) => delete TCL.PROJECTS[k]);
    for (const p of db.projects) TCL.PROJECTS[p.id] = p;
  }
  TCL.projects = () => load().projects.slice().sort((a, b) => a.name.localeCompare(b.name));
  TCL.findProject = (name) => load().projects.find((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());
  TCL.addProject = (name, color) => { const p = { id: uid(), name: name.trim(), color, updatedAt: Date.now() }; load().projects.push(p); TCL.changed(); return p; };
  TCL.updateProject = (p, fields) => { Object.assign(p, fields, { updatedAt: Date.now() }); TCL.changed(); };
  TCL.projectTaskCount = (id) => TCL.tasks().filter((t) => t.project === id).length;
  TCL.deleteProject = (p, moveTo) => {
    const d = load();
    if (moveTo) d.tasks.forEach((t) => { if (t.project === p.id) { t.project = moveTo; t.updatedAt = Date.now(); } });
    d.projects.splice(d.projects.indexOf(p), 1);
    d.deleted[p.id] = Date.now();
    TCL.changed();
  };
  TCL.nextColor = () => { const used = new Set(load().projects.map((p) => p.color)); return TCL.PALETTE.find((c) => !used.has(c)) || TCL.PALETTE[load().projects.length % TCL.PALETTE.length]; };
  TCL.tasks = () => load().tasks;
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(load())); } catch (e) { alertOnce(); } }
  let warned = false;
  function alertOnce() { if (!warned) { warned = true; TCL.toast && TCL.toast('Could not save. Storage may be full or blocked.'); } }
  TCL.onChange = (fn) => listeners.push(fn);
  TCL.changed = (t) => { if (t) t.updatedAt = Date.now(); if (db) syncProjects(); persist(); listeners.forEach((f) => f()); };
  TCL.hasSample = () => TCL.tasks().some((t) => t.sample);
  TCL.loadSample = () => {
    const d = load(), map = {};
    for (const [k, [name, color]] of Object.entries(SAMPLE_PROJECTS)) {
      let p = TCL.findProject(name);
      if (!p) { p = { id: uid(), name, color, updatedAt: Date.now() }; d.projects.push(p); }
      map[k] = p.id;
    }
    d.tasks.push(...sample().map((t) => Object.assign(t, { project: map[t.project] })));
    TCL.changed();
  };
  TCL.clearSample = () => { const d = load(); d.tasks.filter((t) => t.sample).forEach((t) => (d.deleted[t.id] = Date.now())); d.tasks = d.tasks.filter((t) => !t.sample); TCL.changed(); };
  window.addEventListener('storage', (e) => { if (e.key === KEY) { db = null; load(); listeners.forEach((f) => f()); } });
  /* backup and future sync: export everything, import merges by id (newer wins) */
  TCL.exportJSON = () => JSON.stringify(Object.assign({}, load(), { exported: new Date().toISOString() }), null, 2);
  TCL.importJSON = (text) => {
    const inc = JSON.parse(text);
    if (!inc || !Array.isArray(inc.tasks)) throw new Error('Not a Todo Calendar backup');
    const d = load(), byId = new Map(d.tasks.map((t) => [t.id, t]));
    let added = 0, updated = 0;
    for (const t of inc.tasks) {
      if (!t.id || (d.deleted[t.id] && d.deleted[t.id] >= (t.updatedAt || 0))) continue;
      const cur = byId.get(t.id);
      if (!cur) { d.tasks.push(t); added++; }
      else if ((t.updatedAt || 0) > (cur.updatedAt || 0)) { Object.keys(cur).forEach((k) => delete cur[k]); Object.assign(cur, t); updated++; }
    }
    const pById = new Map(d.projects.map((p) => [p.id, p]));
    for (const p of inc.projects || []) {
      if (!p.id || (d.deleted[p.id] && d.deleted[p.id] >= (p.updatedAt || 0))) continue;
      const cur = pById.get(p.id);
      if (!cur) d.projects.push(p); else if ((p.updatedAt || 0) > (cur.updatedAt || 0)) Object.assign(cur, p);
    }
    if (!inc.projects) for (const t of inc.tasks) if (SAMPLE_PROJECTS[t.project] && !d.projects.some((p) => p.id === t.project)) {
      const [name, color] = SAMPLE_PROJECTS[t.project]; d.projects.push({ id: t.project, name, color, updatedAt: Date.now() });
    }
    for (const [id, at] of Object.entries(inc.deleted || {})) {
      const cur = byId.get(id), cp = pById.get(id);
      if (cur && at >= (cur.updatedAt || 0)) d.tasks.splice(d.tasks.indexOf(cur), 1);
      if (cp && at >= (cp.updatedAt || 0)) d.projects.splice(d.projects.indexOf(cp), 1);
      d.deleted[id] = Math.max(d.deleted[id] || 0, at);
    }
    TCL.changed();
    return { added, updated };
  };

  /* ---------- occurrences ---------- */
  function occ(t, k, due, start, done, hasTime) {
    return {
      key: t.id + (k ? '@' + k : ''), task: t, title: t.title, project: t.project, color: TCL.color(t.project),
      due, start, dur: t.dur, done, recurring: !!k, dateKey: k, hasTime,
      planDay: start ? key(start) : (!k && t.plan) || key(due),
    };
  }
  TCL.expand = (from, to, list = TCL.tasks()) => {
    const out = [];
    for (const t of list) {
      if (!t.recur) {
        const hasTime = t.due.length > 10;
        const due = hasTime ? parse(t.due) : parse(t.due + 'T23:59');
        const st = t.start ? parse(t.start) : null;
        const a = st || due;
        if ((a >= from && a < to) || (due >= from && due < to)) out.push(occ(t, null, due, st, !!t.done, hasTime));
        continue;
      }
      const r = t.recur, f = parse(r.from), ev = r.every || 1;
      for (let d = sod(from); d < to; d = addDays(d, 1)) {
        if (d < f) continue;
        const k = key(d);
        if (t.skip && t.skip[k]) continue;
        let ok = false;
        if (r.freq === 'daily') ok = dayDiff(f, d) % ev === 0;
        else if (r.freq === 'weekly') ok = (r.days || [f.getDay()]).includes(d.getDay()) && Math.floor(dayDiff(sow(f), sow(d)) / 7) % ev === 0;
        else if (r.freq === 'monthly') ok = d.getDate() === (r.dom || f.getDate());
        if (!ok) continue;
        const mv = t.moved && t.moved[k];
        const st = mv ? parse(mv) : r.at ? parse(k + 'T' + r.at) : null;
        const due = r.at ? new Date(parse(k + 'T' + r.at).getTime() + t.dur * 6e4) : parse(k + 'T23:59');
        out.push(occ(t, k, due, st, !!(t.doneDates && t.doneDates[k]), !!r.at));
      }
    }
    return out.sort((a, b) => a.due - b.due);
  };
  /* all undone one-off tasks, whatever their date (overdue included) */
  TCL.openOneOffs = () => TCL.expand(new Date(2000, 0, 1), new Date(2100, 0, 1), TCL.tasks().filter((t) => !t.recur && !t.done));

  TCL.minutesByDay = (list) => {
    const m = {};
    for (const o of list) m[o.planDay] = (m[o.planDay] || 0) + o.dur;
    return m;
  };

  /* ---------- mutations ---------- */
  TCL.toggle = (o) => {
    const t = o.task;
    if (o.recurring) { t.doneDates = t.doneDates || {}; if (t.doneDates[o.dateKey]) delete t.doneDates[o.dateKey]; else t.doneDates[o.dateKey] = true; }
    else { t.done = !t.done; if (t.done) t.doneOn = key(new Date()); else delete t.doneOn; }
    TCL.changed(t);
  };
  TCL.setStart = (o, d) => {
    const t = o.task;
    if (o.recurring) { t.moved = t.moved || {}; if (d) t.moved[o.dateKey] = stamp(d); else delete t.moved[o.dateKey]; }
    else if (d) t.start = stamp(d); else delete t.start;
    TCL.changed(t);
  };
  TCL.setPlan = (o, k) => { if (k) o.task.plan = k; else delete o.task.plan; delete o.task.start; TCL.changed(o.task); };
  TCL.remove = (o) => {
    const list = TCL.tasks();
    const i = list.indexOf(o.task);
    if (i >= 0) list.splice(i, 1);
    load().deleted[o.task.id] = Date.now();
    TCL.changed();
  };
  TCL.skip = (o) => { o.task.skip = o.task.skip || {}; o.task.skip[o.dateKey] = true; TCL.changed(o.task); };
  TCL.add = (t) => { t.id = uid(); t.createdAt = Date.now(); TCL.tasks().push(t); TCL.changed(t); return t; };

  const repeatOf = (r) => !r ? '' : r.freq === 'daily' ? 'daily' : r.freq === 'monthly' ? 'monthly' : (r.days || []).length === 5 ? 'weekdays' : 'weekly';
  /* free-text project field with a dropdown of matches; a new name asks for a colour */
  TCL.projectPicker = (currentId) => {
    const h = TCL.h;
    const cur = currentId && TCL.PROJECTS[currentId];
    const input = h('input', { type: 'text', placeholder: 'Type or pick a project', autocomplete: 'off', required: true, value: cur ? cur.name : '', role: 'combobox', 'aria-autocomplete': 'list' });
    const dot = h('span', { class: 'tcl-dot pp-dot' });
    const list = h('div', { class: 'pp-list', role: 'listbox', hidden: true });
    let color = TCL.nextColor(), active = -1, items = [];
    const swatches = h('div', { class: 'pp-swatches' });
    const newBox = h('div', { class: 'pp-new', hidden: true }, h('span', { class: 'pp-newlab' }), swatches);
    const el = h('div', { class: 'pp' }, h('div', { class: 'pp-field' }, dot, input, list), newBox);
    function drawSwatches() {
      swatches.textContent = '';
      TCL.PALETTE.forEach((c) => swatches.append(h('button', { type: 'button', class: 'pp-sw' + (c === color ? ' on' : ''), style: { background: c }, 'aria-label': 'Colour ' + c, onclick: () => { color = c; drawSwatches(); update(false); } })));
    }
    function update(open = true) {
      const q = input.value.trim().toLowerCase();
      const all = TCL.projects();
      const match = q ? all.filter((p) => p.name.toLowerCase().includes(q)) : all;
      const exact = q && all.find((p) => p.name.toLowerCase() === q);
      items = match.map((p) => ({ p }));
      if (q && !exact) items.push({ create: input.value.trim() });
      list.textContent = '';
      items.forEach((it, i) => list.append(h('div', { class: 'pp-opt' + (i === active ? ' on' : ''), role: 'option', onmousedown: (e) => { e.preventDefault(); choose(it); } },
        h('span', { class: 'tcl-dot', style: { background: it.p ? it.p.color : color } }), it.p ? it.p.name : `Create “${it.create}”`)));
      list.hidden = !open || !items.length;
      dot.style.background = exact ? exact.color : q ? color : 'transparent';
      newBox.hidden = !q || !!exact;
      newBox.firstChild.textContent = `New project “${input.value.trim()}”. Pick its colour:`;
      if (!newBox.hidden && !swatches.childNodes.length) drawSwatches();
    }
    function choose(it) { input.value = it.p ? it.p.name : it.create; active = -1; update(false); if (!it.p) drawSwatches(); }
    input.addEventListener('input', () => { active = -1; update(); });
    input.addEventListener('focus', () => update());
    input.addEventListener('blur', () => setTimeout(() => update(false), 120));
    input.addEventListener('keydown', (e) => {
      if (list.hidden) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(items.length - 1, active + 1); update(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); update(); }
      else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); choose(items[active]); }
      else if (e.key === 'Escape') { e.stopPropagation(); update(false); }
    });
    update(false);
    return {
      el,
      // returns a project id, creating the project if the name is new
      resolve() {
        const name = input.value.trim();
        if (!name) { input.focus(); return null; }
        const p = TCL.findProject(name);
        return p ? p.id : TCL.addProject(name, color).id;
      },
    };
  };

  TCL.toast = (msg) => { const t = TCL.h('div', { class: 'tcl-toast' }, msg); document.body.append(t); setTimeout(() => t.remove(), 2600); };

  /* ---------- DOM helpers ---------- */
  TCL.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  TCL.h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
    return el;
  };
  const h = TCL.h;

  /* ---------- sheet (bottom sheet on phone, centred dialog on laptop) ---------- */
  TCL.sheet = (title, body, opts = {}) => {
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); opts.onClose && opts.onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const wrap = h('div', { class: 'tcl-scrim', onclick: (e) => { if (e.target === wrap) close(); } },
      h('div', { class: 'tcl-sheet', role: 'dialog', 'aria-label': title },
        h('div', { class: 'tcl-sheet-head' }, h('strong', null, title), h('button', { class: 'tcl-x', 'aria-label': 'Close', onclick: close }, '×')),
        body));
    document.body.append(wrap);
    document.addEventListener('keydown', onKey);
    return close;
  };

  /* task detail sheet. extra: [{label, fn}] prototype-specific actions */
  TCL.openTask = (o, extra = []) => {
    const t = o.task;
    let close;
    const act = (label, fn, cls = '') => h('button', { class: 'tcl-btn ' + cls, onclick: () => { close(); fn(); } }, label);
    const body = h('div', { class: 'tcl-detail' },
      h('div', { class: 'tcl-detail-title' }, h('span', { class: 'tcl-dot', style: { background: o.color } }), o.title),
      h('dl', null,
        h('dt', null, 'Project'), h('dd', null, TCL.project(o.project).name),
        h('dt', null, o.recurring ? 'This one' : 'Deadline'), h('dd', null, `${TCL.fmtDay(o.due)}${o.hasTime ? ' · ' + TCL.fmtTime(o.due) : ''} (${TCL.relDue(o)})`),
        h('dt', null, 'Takes'), h('dd', null, TCL.fmtDur(o.dur)),
        h('dt', null, 'Scheduled'), h('dd', null, o.start ? `${TCL.fmtDay(o.start)} · ${TCL.fmtTime(o.start)}` : 'Not yet'),
        o.recurring && [h('dt', null, 'Repeats'), h('dd', null, TCL.recurText(t.recur))],
        t.note && [h('dt', null, 'Note'), h('dd', null, t.note)]),
      h('div', { class: 'tcl-actions' },
        act(o.done ? 'Mark not done' : 'Mark done', () => TCL.toggle(o), 'primary'),
        act('Edit', () => TCL.openEditor(t)),
        extra.map((x) => act(x.label, x.fn)),
        o.start && act('Unschedule', () => TCL.setStart(o, null)),
        o.recurring ? act('Skip this one', () => TCL.skip(o)) : null,
        act(o.recurring ? 'Delete series' : 'Delete', () => TCL.remove(o), 'danger')));
    close = TCL.sheet(o.recurring ? 'Recurring task' : 'Task', body);
  };

  /* add or edit task sheet. defaults: {due:'YYYY-MM-DD', start:Date} */
  TCL.openAdd = (defaults = {}) => TCL.openEditor(null, defaults);
  TCL.openEditor = (existing, defaults = {}) => {
    const ex = existing || {};
    const r = ex.recur;
    const today = key(new Date());
    const f = h('form', { class: 'tcl-form' });
    const field = (label, input) => h('label', null, h('span', null, label), input);
    const title = h('input', { name: 'title', required: true, placeholder: 'What needs doing?', autocomplete: 'off', value: ex.title || '' });
    const project = TCL.projectPicker(ex.project);
    const note = h('textarea', { name: 'note', rows: 2, placeholder: 'Notes (optional)' }); note.value = ex.note || '';
    const due = h('input', { type: 'date', name: 'due', value: r ? r.from : ex.due ? ex.due.slice(0, 10) : defaults.due || today, required: true });
    const dueTime = h('input', { type: 'time', name: 'dueTime', value: !r && ex.due && ex.due.length > 10 ? ex.due.slice(11, 16) : '' });
    const dur = h('select', { name: 'dur' }, [5, 15, 30, 45, 60, 90, 120, 180, 240].map((m) => h('option', { value: m, selected: m === (ex.dur || 60) }, TCL.fmtDur(m))));
    const repeat = h('select', { name: 'repeat' },
      [['', 'Does not repeat'], ['daily', 'Every day'], ['weekdays', 'Weekdays'], ['weekly', 'Weekly (same weekday)'], ['monthly', 'Monthly (same date)']].map(([v, l]) => h('option', { value: v, selected: v === repeatOf(r) }, l)));
    const start = h('input', { type: 'datetime-local', name: 'start', value: r && r.at ? r.from + 'T' + r.at : ex.start || (defaults.start ? stamp(defaults.start) : '') });
    f.append(
      field('Task', title),
      field('Project', project.el),
      field('Takes', dur),
      h('div', { class: 'tcl-row' }, field('Deadline', due), field('by (optional)', dueTime)),
      field('Repeats', repeat),
      field('Block time at (optional)', start),
      field('Notes', note),
      h('div', { class: 'tcl-actions' }, h('button', { class: 'tcl-btn primary', type: 'submit' }, existing ? 'Save' : 'Add task')));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!title.value.trim()) return;
      const pid = project.resolve();
      if (!pid) return;
      const t = { title: title.value.trim(), project: pid, dur: +dur.value, done: !!ex.done };
      if (note.value.trim()) t.note = note.value.trim();
      if (repeat.value) {
        const d0 = parse(due.value);
        const at = start.value ? start.value.slice(11, 16) : dueTime.value || undefined;
        t.recur = repeat.value === 'daily' ? { freq: 'daily' }
          : repeat.value === 'weekdays' ? { freq: 'weekly', days: [1, 2, 3, 4, 5] }
          : repeat.value === 'weekly' ? { freq: 'weekly', days: [d0.getDay()] }
          : { freq: 'monthly', dom: d0.getDate() };
        t.recur.from = due.value; if (at) t.recur.at = at;
        t.doneDates = (r && ex.doneDates) || {};
        if (r && ex.skip) t.skip = ex.skip;
      } else {
        t.due = due.value + (dueTime.value ? 'T' + dueTime.value : '');
        if (start.value) t.start = start.value.slice(0, 16);
      }
      if (existing) {
        if (ex.plan && !t.recur && !t.start) t.plan = ex.plan;
        if (ex.doneOn) t.doneOn = ex.doneOn;
        ['title', 'project', 'dur', 'done', 'note', 'recur', 'doneDates', 'skip', 'due', 'start', 'plan', 'moved', 'doneOn'].forEach((k) => delete existing[k]);
        Object.assign(existing, t);
        TCL.changed(existing);
      } else TCL.add(t);
      close();
    });
    const close = TCL.sheet(existing ? 'Edit task' : 'New task', f);
    setTimeout(() => title.focus(), 50);
  };

  TCL.every = (fn, ms = 60000) => setInterval(fn, ms);
})();
