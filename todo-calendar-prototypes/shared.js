/* Todo Calendar prototypes: shared data model, sample data, storage, sheets and feature picker.
   Every prototype reads the same tasks from localStorage, so a change in one shows in all. */
(function () {
  'use strict';
  const TCL = (window.TCL = {});

  /* ---------- projects ---------- */
  TCL.PROJECTS = {
    work: { name: 'Work', color: '#3b6fd8' },
    personal: { name: 'Personal', color: '#d6457a' },
    health: { name: 'Health', color: '#e0762b' },
    home: { name: 'Home', color: '#8a5bd6' },
    learn: { name: 'Learning', color: '#14998f' },
  };
  TCL.color = (p) => (TCL.PROJECTS[p] || TCL.PROJECTS.personal).color;

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
  Object.assign(TCL, { pad, key, parse, sod, addDays, sow, stamp, dayDiff });

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
    const mk = (o) => Object.assign({ id: 's' + ++id, dur: 60, done: false }, o);
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
  const KEY = 'tcl.tasks.v1';
  let tasks = null;
  const listeners = [];
  TCL.tasks = () => {
    if (tasks) return tasks;
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.tasks)) return (tasks = s.tasks); } catch (e) {}
    tasks = sample(); persist(); return tasks;
  };
  function persist() { try { localStorage.setItem(KEY, JSON.stringify({ seeded: key(new Date()), tasks })); } catch (e) {} }
  TCL.onChange = (fn) => listeners.push(fn);
  TCL.changed = () => { persist(); listeners.forEach((f) => f()); };
  TCL.reset = () => { tasks = sample(); TCL.changed(); };
  window.addEventListener('storage', (e) => { if (e.key === KEY) { tasks = null; listeners.forEach((f) => f()); } });

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
    TCL.changed();
  };
  TCL.setStart = (o, d) => {
    const t = o.task;
    if (o.recurring) { t.moved = t.moved || {}; if (d) t.moved[o.dateKey] = stamp(d); else delete t.moved[o.dateKey]; }
    else if (d) t.start = stamp(d); else delete t.start;
    TCL.changed();
  };
  TCL.setPlan = (o, k) => { if (k) o.task.plan = k; else delete o.task.plan; delete o.task.start; TCL.changed(); };
  TCL.remove = (o) => {
    const list = TCL.tasks();
    const i = list.indexOf(o.task);
    if (i >= 0) list.splice(i, 1);
    TCL.changed();
  };
  TCL.skip = (o) => { o.task.skip = o.task.skip || {}; o.task.skip[o.dateKey] = true; TCL.changed(); };
  TCL.add = (t) => { t.id = 'u' + Date.now().toString(36); TCL.tasks().push(t); TCL.changed(); return t; };

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
        h('dt', null, 'Project'), h('dd', null, TCL.PROJECTS[o.project].name),
        h('dt', null, o.recurring ? 'This one' : 'Deadline'), h('dd', null, `${TCL.fmtDay(o.due)}${o.hasTime ? ' · ' + TCL.fmtTime(o.due) : ''} (${TCL.relDue(o)})`),
        h('dt', null, 'Takes'), h('dd', null, TCL.fmtDur(o.dur)),
        h('dt', null, 'Scheduled'), h('dd', null, o.start ? `${TCL.fmtDay(o.start)} · ${TCL.fmtTime(o.start)}` : 'Not yet'),
        o.recurring && [h('dt', null, 'Repeats'), h('dd', null, TCL.recurText(t.recur))],
        t.note && [h('dt', null, 'Note'), h('dd', null, t.note)]),
      h('div', { class: 'tcl-actions' },
        act(o.done ? 'Mark not done' : 'Mark done', () => TCL.toggle(o), 'primary'),
        extra.map((x) => act(x.label, x.fn)),
        o.start && act('Unschedule', () => TCL.setStart(o, null)),
        o.recurring ? act('Skip this one', () => TCL.skip(o)) : null,
        act(o.recurring ? 'Delete series' : 'Delete', () => TCL.remove(o), 'danger')));
    close = TCL.sheet(o.recurring ? 'Recurring task' : 'Task', body);
  };

  /* add task sheet. defaults: {due:'YYYY-MM-DD', start:Date} */
  TCL.openAdd = (defaults = {}) => {
    const today = key(new Date());
    const f = h('form', { class: 'tcl-form' });
    const field = (label, input) => h('label', null, h('span', null, label), input);
    const title = h('input', { name: 'title', required: true, placeholder: 'What needs doing?', autocomplete: 'off' });
    const project = h('select', { name: 'project' }, Object.entries(TCL.PROJECTS).map(([k, p]) => h('option', { value: k }, p.name)));
    const due = h('input', { type: 'date', name: 'due', value: defaults.due || today, required: true });
    const dueTime = h('input', { type: 'time', name: 'dueTime' });
    const dur = h('select', { name: 'dur' }, [15, 30, 45, 60, 90, 120, 180, 240].map((m) => h('option', { value: m, selected: m === 60 }, TCL.fmtDur(m))));
    const repeat = h('select', { name: 'repeat' },
      [['', 'Does not repeat'], ['daily', 'Every day'], ['weekdays', 'Weekdays'], ['weekly', 'Weekly (same weekday)'], ['monthly', 'Monthly (same date)']].map(([v, l]) => h('option', { value: v }, l)));
    const start = h('input', { type: 'datetime-local', name: 'start', value: defaults.start ? stamp(defaults.start) : '' });
    f.append(
      field('Task', title),
      h('div', { class: 'tcl-row' }, field('Project', project), field('Takes', dur)),
      h('div', { class: 'tcl-row' }, field('Deadline', due), field('by (optional)', dueTime)),
      field('Repeats', repeat),
      field('Block time at (optional)', start),
      h('div', { class: 'tcl-actions' }, h('button', { class: 'tcl-btn primary', type: 'submit' }, 'Add task')));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const t = { title: title.value.trim(), project: project.value, dur: +dur.value, done: false };
      if (!t.title) return;
      if (repeat.value) {
        const d0 = parse(due.value);
        const at = start.value ? start.value.slice(11, 16) : dueTime.value || undefined;
        t.recur = repeat.value === 'daily' ? { freq: 'daily' }
          : repeat.value === 'weekdays' ? { freq: 'weekly', days: [1, 2, 3, 4, 5] }
          : repeat.value === 'weekly' ? { freq: 'weekly', days: [d0.getDay()] }
          : { freq: 'monthly', dom: d0.getDate() };
        t.recur.from = due.value; if (at) t.recur.at = at;
        t.doneDates = {};
      } else {
        t.due = due.value + (dueTime.value ? 'T' + dueTime.value : '');
        if (start.value) t.start = start.value.slice(0, 16);
      }
      TCL.add(t);
      close();
    });
    const close = TCL.sheet('New task', f);
    setTimeout(() => title.focus(), 50);
  };

  /* ---------- feature picker ---------- */
  TCL.PROTOS = [
    { id: 'heatmap', name: 'Heat Calendar', idea: 'A month calendar shaded by how busy each day is. Scan a whole month in one look.', features: [
      ['heat', 'Days shaded darker the more hours of work they hold'],
      ['dots', 'Coloured deadline dots on each day'],
      ['daylist', 'Tap a day to see its tasks as duration bars'],
      ['weektotal', 'Hours per week column'],
      ['overload', 'Red ring on days over your daily capacity'],
      ['filter', 'Project filter chips'],
    ] },
    { id: 'runway', name: 'Deadline Runway', idea: 'Every task is a runway that ends at its deadline flag, so you see how much time is left to start.', features: [
      ['runway', 'Dashed runway from now to each deadline'],
      ['workblock', 'Solid block = the work itself, sized by duration'],
      ['countdown', 'Countdown labels ("2d 4h left")'],
      ['lanes', 'Lanes grouped by project'],
      ['routines', 'Recurring tasks as tick marks in a Routines lane'],
      ['zoom', 'Zoom between 1 week, 2 weeks and a month'],
    ] },
    { id: 'week', name: 'Time Blocks', idea: 'A week planner. Tasks become blocks sized by how long they take; drop unscheduled ones into free time.', features: [
      ['blocks', 'Tasks as blocks on an hourly week grid'],
      ['tray', 'Unscheduled tray: tap a task, then tap a time to place it'],
      ['flags', 'Deadline flags in each day header and on the grid'],
      ['late', 'Warning when a block ends after its deadline'],
      ['stripes', 'Striped style for recurring tasks'],
      ['phone3', 'Phone shows 3 days, laptop shows 7'],
    ] },
    { id: 'bubbles', name: 'Urgency Orbit', idea: 'Tasks float as bubbles. Bigger means longer, closer to the centre means sooner. Pick one and zone in.', features: [
      ['size', 'Bubble size = how long the task takes'],
      ['orbit', 'Distance from centre = time until deadline'],
      ['rings', 'Rings for Today, This week, Later'],
      ['group', 'Group bubbles by project'],
      ['focus', 'Focus mode: one task, big countdown timer ring'],
      ['nextup', 'Next up list sorted by urgency'],
    ] },
    { id: 'stack', name: 'Capacity Stack', idea: 'A scrolling stack of days, each with a fuel gauge of how full it is. Spread work so no day overflows.', features: [
      ['gauge', 'Capacity bar per day, filled by task segments'],
      ['overflow', 'Overflow past capacity shown in red'],
      ['slider', 'Set your own daily capacity'],
      ['spread', 'Auto-spread unscheduled work before deadlines'],
      ['habits', 'Habit streak dots for recurring tasks'],
      ['overdue', 'Overdue section pinned to the top'],
    ] },
    { id: 'board', name: 'Horizon Board', idea: 'A board with columns for Today, Tomorrow, This week, Next week and Later. Card height shows how long a task takes.', features: [
      ['columns', 'Columns by time horizon instead of dates'],
      ['height', 'Card height = how long the task takes'],
      ['colcap', 'Hours total and a fill bar on each column'],
      ['move', 'Move a card to another column to change when you do it'],
      ['deadlinetag', 'Deadline tag on each card, red when close'],
      ['routinesrow', 'Today\'s routines as a compact strip on top'],
    ] },
    { id: 'clock', name: 'Day Clock', idea: 'Your day as a 24-hour clock face. Scheduled work is arcs, deadlines are ticks, the hand is now.', features: [
      ['dial', '24-hour dial with tasks as coloured arcs'],
      ['hand', 'Clock hand showing now, with time left today'],
      ['ticks', 'Deadline ticks around the rim'],
      ['floating', 'Unscheduled tasks due today listed beside the clock'],
      ['week7', 'Mini clocks for the next 7 days'],
      ['freegaps', 'Free gaps highlighted so you see where work fits'],
    ] },
    { id: 'terrain', name: 'Workload Terrain', idea: 'The next month as a mountain range. Peaks are busy days, coloured by project, with deadline pins on top.', features: [
      ['area', 'Stacked hills of hours per day by project'],
      ['pins', 'Deadline pins standing on the hills'],
      ['capline', 'Capacity line; anything above it is a crunch'],
      ['scrub', 'Drag across the chart to read any day'],
      ['legendtoggle', 'Tap a project in the legend to hide it'],
      ['daylist', 'Selected day\'s tasks listed below'],
    ] },
    { id: 'mosaic', name: 'Task Mosaic', idea: 'All open work as one mosaic. Tile area = time needed, colour = project, brightness = urgency.', features: [
      ['area', 'Tile size = how long the task takes'],
      ['urgencyfade', 'Urgent tiles are bold, far-off tiles are faded'],
      ['buckets', 'Mosaic grouped into Overdue, This week, Later'],
      ['bucketsize', 'See at a glance which period holds the most work'],
      ['groupswitch', 'Switch grouping between time and project'],
      ['tapdone', 'Tap a tile for details, mark done from there'],
    ] },
    { id: 'deck', name: 'Focus Deck', idea: 'Today as a deck of big cards, one at a time. Swipe right to do it now, left to push to tomorrow.', features: [
      ['onecard', 'One big task card at a time'],
      ['swipe', 'Swipe right = done, left = tomorrow'],
      ['dayring', 'Progress ring for how much of today is done'],
      ['queue', 'Peek at the cards still in the deck'],
      ['countdown', 'Big countdown to the deadline on each card'],
      ['endofday', 'End of day summary when the deck is empty'],
    ] },
  ];
  const PKEY = 'tcl.picks.v1';
  TCL.picks = () => { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; } };
  TCL.savePicks = (p) => { try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch (e) {} };
  TCL.picksText = () => {
    const p = TCL.picks();
    const lines = [];
    const base = TCL.PROTOS.find((x) => x.id === p.base);
    if (base) lines.push(`Base design: ${base.name}`);
    for (const pr of TCL.PROTOS) {
      const sel = pr.features.filter(([id]) => (p[pr.id] || {})[id]);
      const note = (p.notes || {})[pr.id];
      if (!sel.length && !note) continue;
      lines.push(`\n${pr.name}:`);
      sel.forEach(([, l]) => lines.push(`- ${l}`));
      if (note) lines.push(`- Note: ${note}`);
    }
    if (p.general) lines.push(`\nOther: ${p.general}`);
    return lines.length ? 'My picks from the todo calendar prototypes\n' + lines.join('\n') : '';
  };
  TCL.featureList = (pr, onChange) => {
    const p = TCL.picks();
    const box = h('div', { class: 'tcl-feats' });
    pr.features.forEach(([id, label]) => {
      const cb = h('input', { type: 'checkbox', checked: !!(p[pr.id] || {})[id] });
      cb.addEventListener('change', () => {
        const q = TCL.picks(); q[pr.id] = q[pr.id] || {}; q[pr.id][id] = cb.checked; TCL.savePicks(q); onChange && onChange();
      });
      box.append(h('label', { class: 'tcl-feat' }, cb, h('span', null, label)));
    });
    const base = h('input', { type: 'radio', name: 'tcl-base-' + Math.random(), checked: p.base === pr.id });
    base.addEventListener('change', () => { const q = TCL.picks(); q.base = pr.id; TCL.savePicks(q); onChange && onChange(); });
    box.append(h('label', { class: 'tcl-feat base' }, base, h('span', null, 'Use this as the base layout')));
    const note = h('textarea', { rows: 2, placeholder: 'Anything you liked or disliked here?' });
    note.value = (p.notes || {})[pr.id] || '';
    note.addEventListener('input', () => { const q = TCL.picks(); q.notes = q.notes || {}; q.notes[pr.id] = note.value; TCL.savePicks(q); onChange && onChange(); });
    box.append(note);
    return box;
  };

  /* ---------- prototype chrome: top bar with back, add, features, reset ---------- */
  TCL.mount = (id) => {
    const pr = TCL.PROTOS.find((x) => x.id === id);
    const n = TCL.PROTOS.indexOf(pr) + 1, N = TCL.PROTOS.length;
    const prev = TCL.PROTOS[(n - 2 + N) % N], next = TCL.PROTOS[n % N];
    const count = () => Object.values(TCL.picks()[id] || {}).filter(Boolean).length;
    const badge = h('span', { class: 'tcl-badge' });
    const upd = () => { const c = count(); badge.textContent = c ? c : ''; badge.hidden = !c; };
    const bar = h('header', { class: 'tcl-bar' },
      h('a', { class: 'tcl-back', href: '../', 'aria-label': 'All prototypes' }, '‹'),
      h('div', { class: 'tcl-name' }, h('small', null, `Prototype ${n} of ${N}`), h('strong', null, pr.name)),
      h('div', { class: 'tcl-tools' },
        h('a', { class: 'tcl-icon', href: `../${prev.id}/`, title: 'Previous prototype', 'aria-label': 'Previous prototype' }, '←'),
        h('a', { class: 'tcl-icon', href: `../${next.id}/`, title: 'Next prototype', 'aria-label': 'Next prototype' }, '→'),
        h('button', { class: 'tcl-btn ghost tcl-wide', title: 'Restore sample data', onclick: () => confirmReset() }, 'Reset'),
        h('button', { class: 'tcl-btn feat', onclick: () => {
          TCL.sheet(`What do you like in ${pr.name}?`, h('div', null, h('p', { class: 'tcl-muted' }, pr.idea), TCL.featureList(pr, upd),
            h('p', { class: 'tcl-muted' }, 'Picks are saved on this device. The overview page collects them for you to send.'),
            h('button', { class: 'tcl-btn ghost', onclick: () => confirmReset() }, 'Reset tasks to sample data')));
        } }, '★ Pick', badge),
        h('button', { class: 'tcl-btn primary', onclick: () => TCL.openAdd() }, '+ Task')));
    document.body.prepend(bar);
    upd();
  };
  // Reset is undoable only by re-adding, so ask with an inline sheet instead of a browser dialog.
  function confirmReset() {
    const close = TCL.sheet('Reset to sample data?', h('div', null,
      h('p', null, 'Your own tasks and changes in all the prototypes go away and the sample tasks come back.'),
      h('div', { class: 'tcl-actions' },
        h('button', { class: 'tcl-btn danger', onclick: () => { close(); TCL.reset(); } }, 'Reset'),
        h('button', { class: 'tcl-btn', onclick: () => close() }, 'Cancel'))));
  }

  /* tick: re-render callbacks every minute so countdowns and the now line move */
  TCL.every = (fn, ms = 60000) => setInterval(fn, ms);
})();
