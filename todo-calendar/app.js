/* Todo Calendar app: three views over one task store.
   Runway (deadlines), Blocks (week time blocking), Focus (today's deck), Month (Tiny Titles grid). */
(function () {
  'use strict';
  const { h } = TCL;
  const VIEW_KEY = 'todocal.view';
  const CAP = 6 * 60;
  const viewEl = document.getElementById('view');
  const views = {};
  let current = null;

  /* =================================================================== RUNWAY */
  views.runway = (() => {
    let days = +localStorage.getItem('todocal.runway.days') || 14;
    let showRoutines = localStorage.getItem('todocal.runway.routines') !== '0';
    let el, zoom, rbtn, sum, chart;
    function build() {
      el = h('div', { class: 'rw' });
      zoom = h('div', { class: 'tcl-seg' }, [[7, '1 wk'], [14, '2 wks'], [31, 'Month']].map(([n, l]) =>
        h('button', { 'data-n': n, onclick: () => { days = n; localStorage.setItem('todocal.runway.days', n); render(); } }, l)));
      rbtn = h('button', { class: 'tcl-btn', onclick: () => { showRoutines = !showRoutines; localStorage.setItem('todocal.runway.routines', showRoutines ? '1' : '0'); render(); } }, 'Routines');
      sum = h('div', { class: 'sum' });
      chart = h('div', { class: 'chart' });
      el.append(h('div', { class: 'controls' }, sum, zoom, rbtn), chart,
        h('div', { class: 'key' },
          h('span', null, h('i', { class: 'k1' }), 'runway: time until you must start'),
          h('span', null, h('i', { class: 'k2' }), 'scheduled work'),
          h('span', null, h('i', { class: 'k3' }), 'not scheduled, shown at the latest start'),
          h('span', null, '▶ deadline')));
      return el;
    }
    function render() {
      zoom.querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.n === days));
      rbtn.classList.toggle('on', showRoutines);
      const now = new Date();
      const from = TCL.addDays(TCL.sod(now), -1), to = TCL.addDays(from, days + 1);
      const LABEL = innerWidth < 560 ? 118 : 210;
      const avail = chart.clientWidth - LABEL - 2;
      const dayW = Math.max(innerWidth < 560 ? 44 : 56, avail / (days + 1));
      const W = dayW * (days + 1);
      const x = (t) => Math.max(0, Math.min(W, (t - from) / 864e5 * dayW));
      const oneOffs = TCL.openOneOffs().filter((o) => o.due < to);
      const later = TCL.openOneOffs().length - oneOffs.length;
      const late = oneOffs.filter((o) => o.due < now).length;
      const soon = oneOffs.filter((o) => o.due >= now && o.due < TCL.addDays(TCL.sod(now), 3)).length;
      sum.innerHTML = `${oneOffs.length} open task${oneOffs.length === 1 ? '' : 's'}<small>${late ? `<b style="color:var(--danger)">${late} overdue</b> · ` : ''}${soon} due in the next 3 days${later ? ` · ${later} later` : ''}</small>`;
      const inner = h('div', { class: 'inner', style: { width: (LABEL + W) + 'px' } });
      const cols = h('div', { class: 'cols', style: { left: LABEL + 'px', width: W + 'px' } });
      const headTrack = h('div', { class: 'track', style: { width: W + 'px' } });
      const todayK = TCL.key(now);
      for (let i = 0; i <= days; i++) {
        const d = TCL.addDays(from, i), we = d.getDay() === 0 || d.getDay() === 6, isT = TCL.key(d) === todayK;
        cols.append(h('div', { class: 'col' + (we ? ' we' : '') + (isT ? ' today' : ''), style: { left: i * dayW + 'px', width: dayW + 'px' } }));
        headTrack.append(h('div', { class: 'dayhead' + (isT ? ' today' : ''), style: { left: i * dayW + 'px', width: dayW + 'px' } }, TCL.DOW[d.getDay()], h('b', null, d.getDate())));
      }
      inner.append(cols, h('div', { class: 'row head' }, h('div', { class: 'lab', style: { width: LABEL + 'px' } }, h('span', { class: 'c' }, 'Deadlines ▸')), headTrack));
      const lane = (name, color) => inner.append(h('div', { class: 'row lane' }, h('div', { class: 'lab', style: { width: LABEL + 'px', color } }, h('span', { class: 'tcl-dot', style: { background: color } }), name), h('div', { class: 'track', style: { width: W + 'px' } })));
      if (showRoutines) {
        const by = new Map();
        TCL.expand(from, to).filter((o) => o.recurring).forEach((o) => { if (!by.has(o.task)) by.set(o.task, []); by.get(o.task).push(o); });
        if (by.size) lane('Routines', 'var(--muted)');
        for (const [t, list] of by) {
          const track = h('div', { class: 'track', style: { width: W + 'px', color: TCL.color(t.project) } });
          list.forEach((o) => {
            const s = o.start || TCL.parse(o.dateKey + 'T12:00');
            track.append(h('div', { class: 'tick' + (o.done ? ' done' : ''), title: `${o.title} · ${TCL.fmtDay(o.due)}${o.start ? ' ' + TCL.fmtTime(o.start) : ''}`, style: { left: x(s) + 'px', width: Math.max(5, o.dur / 1440 * dayW) + 'px' }, onclick: () => TCL.openTask(o) }));
          });
          inner.append(h('div', { class: 'row' }, h('div', { class: 'lab', style: { width: LABEL + 'px' }, onclick: () => TCL.openTask(list[0]) }, h('span', { class: 't' }, t.title), h('span', { class: 'c' }, TCL.recurText(t.recur))), track));
        }
      }
      for (const p of TCL.projects().concat(TCL.openOneOffs().some((o) => !TCL.PROJECTS[o.project]) ? [{ id: '?', name: 'Unknown project', color: '#8a9a96' }] : [])) {
        const pk = p.id;
        const list = oneOffs.filter((o) => pk === '?' ? !TCL.PROJECTS[o.project] : o.project === pk);
        if (!list.length) continue;
        lane(p.name, p.color);
        for (const o of list) {
          const isLate = o.due < now;
          const track = h('div', { class: 'track', style: { width: W + 'px', color: p.color } });
          const open = () => TCL.openTask(o);
          const latest = new Date(o.due - o.dur * 6e4);
          const ws = o.start || (o.task.plan ? TCL.parse(o.task.plan + 'T09:00') : latest);
          const xs = x(ws), xe = x(new Date(ws.getTime() + o.dur * 6e4));
          const firm = !!(o.start || o.task.plan);
          if (!isLate) track.append(h('div', { class: 'run', style: { left: x(now) + 'px', width: Math.max(0, xs - x(now)) + 'px' } }));
          track.append(h('div', { class: 'work' + (firm ? '' : ' latest'), title: `${o.title}: ${TCL.fmtDur(o.dur)}${o.start ? ' at ' + TCL.fmtTime(o.start) + ' ' + TCL.fmtDay(o.start) : ', not scheduled'}`, style: { left: (isLate ? x(now) - Math.max(8, xe - xs) : xs) + 'px', width: Math.max(8, xe - xs) + 'px', background: isLate ? 'var(--danger)' : p.color }, onclick: open }));
          const xd = x(o.due);
          track.append(h('div', { class: 'flag', style: { left: xd + 'px', background: isLate ? 'var(--danger)' : p.color, color: isLate ? 'var(--danger)' : p.color }, title: 'Deadline ' + TCL.fmtDay(o.due), onclick: open }));
          const cd = h('div', { class: 'cd' + (isLate ? ' late' : ''), onclick: open }, TCL.countdown(o, now));
          if (xd + 120 < W) cd.style.left = (xd + 16) + 'px'; else cd.style.right = (W - xd + 6) + 'px';
          track.append(cd);
          inner.append(h('div', { class: 'row' }, h('div', { class: 'lab', style: { width: LABEL + 'px' }, onclick: open }, h('span', { class: 't' }, o.title), h('span', { class: 'c' + (isLate ? ' late' : '') }, `${TCL.fmtDur(o.dur)} · due ${TCL.relDue(o, now)}`)), track));
        }
      }
      if (!oneOffs.length && !showRoutines) inner.append(h('p', { class: 'tcl-muted', style: { padding: '16px' } }, 'No deadlines in this range.'));
      inner.append(h('div', { class: 'now', style: { left: (LABEL + x(now)) + 'px' } }));
      const sl = chart.scrollLeft;
      chart.textContent = ''; chart.append(inner); chart.scrollLeft = sl;
    }
    return { build, render, resize: render };
  })();

  /* =================================================================== BLOCKS */
  views.week = (() => {
    const H0 = 6, H1 = 24, HH = 46;
    let offset = 0, placing = null, scrolled = false, lastN = 0;
    let el, range, heads, body, scroll, tray, trayTitle, hint, hintText;
    const nDays = () => innerWidth < 700 ? 3 : 7;
    const firstDay = () => nDays() === 7 ? TCL.addDays(TCL.sow(new Date()), offset * 7) : TCL.addDays(TCL.sod(new Date()), offset * 3);
    function place(o) { placing = o; el.classList.add('placing'); hintText.textContent = `Tap a time to place “${o.title}” (${TCL.fmtDur(o.dur)})`; render(); }
    function stopPlacing() { placing = null; el && el.classList.remove('placing'); render(); }
    function build() {
      scrolled = false; lastN = nDays();
      range = h('h2'); heads = h('div', { class: 'heads' }); body = h('div', { class: 'body' });
      scroll = h('div', { class: 'scroll' }, body);
      tray = h('div', { class: 'chips' }); trayTitle = h('span');
      hintText = h('span');
      hint = h('div', { class: 'hint' }, hintText, h('button', { onclick: stopPlacing }, 'Cancel'));
      el = h('div', { class: 'wk' },
        hint,
        h('div', { class: 'controls' }, range, h('div', { class: 'tcl-seg' },
          h('button', { 'aria-label': 'Earlier', onclick: () => { offset--; render(); } }, '‹'),
          h('button', { onclick: () => { offset = 0; render(); } }, 'Today'),
          h('button', { 'aria-label': 'Later', onclick: () => { offset++; render(); } }, '›'))),
        h('div', { class: 'cal' }, heads, scroll),
        h('div', { class: 'tray' }, h('div', { class: 'tray-h' }, trayTitle, h('span', null, 'tap one, then tap a time')), tray));
      return el;
    }
    function lanes(list) {
      const ends = [];
      list.sort((a, b) => a.start - b.start);
      for (const o of list) {
        const s = +o.start; let i = ends.findIndex((e) => e <= s);
        if (i < 0) { i = ends.length; ends.push(0); }
        ends[i] = s + Math.max(o.dur, 30) * 6e4; o._lane = i;
      }
      for (const o of list) { const s = +o.start, e = s + Math.max(o.dur, 30) * 6e4; o._n = 1 + Math.max(...list.filter((p) => +p.start < e && +p.start + Math.max(p.dur, 30) * 6e4 > s).map((p) => p._lane)); }
    }
    function render() {
      const n = nDays(), d0 = firstDay(), d1 = TCL.addDays(d0, n);
      const now = new Date(), todayK = TCL.key(now);
      const last = TCL.addDays(d1, -1);
      range.textContent = `${TCL.MON[d0.getMonth()]} ${d0.getDate()} – ${TCL.MON[last.getMonth()]} ${last.getDate()}`;
      const occs = TCL.expand(d0, d1);
      heads.textContent = ''; body.textContent = '';
      heads.append(h('div', { class: 'gut' }));
      const hours = h('div', { class: 'hours' });
      for (let i = H0; i < H1; i++) hours.append(h('div', { style: { height: HH + 'px' } }, i === H0 ? '' : TCL.fmtTime(new Date(2000, 0, 1, i))));
      body.append(hours);
      for (let i = 0; i < n; i++) {
        const d = TCL.addDays(d0, i), k = TCL.key(d);
        const mine = occs.filter((o) => o.start && TCL.key(o.start) === k);
        const dues = occs.filter((o) => !o.recurring && TCL.key(o.due) === k);
        const load = occs.filter((o) => o.planDay === k && !o.done).reduce((s, o) => s + o.dur, 0);
        heads.append(h('div', { class: 'dh' + (k === todayK ? ' today' : '') },
          h('div', { class: 'd' }, TCL.DOW[d.getDay()], h('b', null, d.getDate()), h('span', { style: { marginLeft: 'auto' } }, load ? TCL.fmtHours(load) : '')),
          h('div', { class: 'load', title: `${TCL.fmtHours(load)} planned of ${TCL.fmtHours(CAP)}` }, h('i', { class: load > CAP ? 'over' : '', style: { width: Math.min(100, load / CAP * 100) + '%' } })),
          h('div', { class: 'flags' }, dues.map((o) => h('div', { class: 'fl' + (o.done ? ' done' : ''), style: { borderColor: o.color }, title: 'Deadline: ' + o.title, onclick: () => TCL.openTask(o, [{ label: o.start ? 'Move' : 'Place on calendar', fn: () => place(o) }]) }, `▶ ${o.hasTime ? TCL.fmtTime(o.due) + ' ' : ''}${o.title}`)))));
        const ghost = h('div', { class: 'ghost' });
        const col = h('div', { class: 'day' + (d.getDay() % 6 === 0 ? ' we' : ''), style: { height: (H1 - H0) * HH + 'px', backgroundSize: `100% ${HH}px` } }, ghost);
        col.addEventListener('pointermove', (e) => {
          if (!placing || e.target !== col) return;
          const m = Math.round((e.offsetY / HH * 60) / 15) * 15;
          ghost.style.top = (m / 60 * HH) + 'px'; ghost.style.height = (placing.dur / 60 * HH) + 'px';
          ghost.textContent = TCL.fmtTime(new Date(2000, 0, 1, H0, m));
        });
        col.addEventListener('click', (e) => {
          if (e.target !== col && e.target !== ghost) return;
          const y = e.clientY - col.getBoundingClientRect().top;
          const st = new Date(d); st.setHours(H0, Math.max(0, Math.round((y / HH * 60) / 15) * 15));
          if (placing) { const o = placing; placing = null; el.classList.remove('placing'); TCL.setStart(o, st); }
          else TCL.openAdd({ due: k, start: st });
        });
        lanes(mine);
        for (const o of mine) {
          const top = ((o.start.getHours() - H0) * 60 + o.start.getMinutes()) / 60 * HH;
          const end = new Date(o.start.getTime() + o.dur * 6e4);
          const late = !o.recurring && !o.done && end > o.due;
          const w = 100 / o._n;
          col.append(h('div', {
            class: 'blk' + (o.recurring ? ' rec' : '') + (o.done ? ' done' : '') + (late ? ' late' : '') + (placing && placing.key === o.key ? ' sel' : ''),
            style: { top: Math.max(0, top) + 'px', height: Math.max(20, o.dur / 60 * HH - 2) + 'px', left: `calc(${o._lane * w}% + 2px)`, width: `calc(${w}% - 4px)`, background: o.color },
            title: `${o.title} · ${TCL.fmtTime(o.start)}–${TCL.fmtTime(end)}`,
            onclick: (e) => { e.stopPropagation(); TCL.openTask(o, [{ label: 'Move', fn: () => place(o) }]); },
          }, h('b', null, o.title), o.dur >= 30 ? `${TCL.fmtTime(o.start)} · ${TCL.fmtDur(o.dur)}` : ''));
        }
        for (const o of dues) if (o.hasTime && !o.done) {
          const top = ((o.due.getHours() - H0) * 60 + o.due.getMinutes()) / 60 * HH;
          if (top >= 0) col.append(h('div', { class: 'dl', style: { top: top + 'px', borderColor: o.color, color: o.color } }, h('span', null, '▶ due ' + o.title)));
        }
        if (k === todayK) col.append(h('div', { class: 'now', style: { top: ((now.getHours() - H0) * 60 + now.getMinutes()) / 60 * HH + 'px' } }));
        body.append(col);
      }
      tray.textContent = '';
      const un = TCL.openOneOffs().filter((o) => !o.start);
      trayTitle.textContent = `Not scheduled yet · ${un.length}`;
      un.forEach((o) => tray.append(h('button', { class: 'tk' + (placing && placing.key === o.key ? ' sel' : ''), style: { borderLeftColor: o.color }, onclick: () => placing && placing.key === o.key ? stopPlacing() : place(o) },
        h('b', null, o.title), h('span', null, TCL.fmtDur(o.dur) + ' · ', h('span', { class: o.due < now ? 'late' : '' }, 'due ' + TCL.relDue(o, now))))));
      if (!un.length) tray.append(h('span', { class: 'tcl-muted' }, 'Everything has a time.'));
      if (!scrolled) { scroll.scrollTop = (Math.max(H0, Math.min(now.getHours() - 1, 17)) - H0) * HH; scrolled = true; }
    }
    function onData() { placing = null; el && el.classList.remove('placing'); render(); }
    function resize() { if (nDays() !== lastN) { lastN = nDays(); offset = 0; } render(); }
    function key(e) { if (e.key === 'Escape' && placing) stopPlacing(); }
    return { build, render, onData, resize, key, fixed: true };
  })();

  /* =================================================================== FOCUS DECK */
  views.deck = (() => {
    const back = [];
    const C = 2 * Math.PI * 26;
    let el, prog, title, sub, stack, btns, hint, queue;
    function build() {
      prog = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      [['class', 'fg'], ['cx', 32], ['cy', 32], ['r', 26], ['stroke-dasharray', C]].forEach(([a, v]) => prog.setAttribute(a, v));
      const ring = h('div', { class: 'ring', html: '<svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/></svg>' });
      ring.firstChild.append(prog);
      title = h('h2'); sub = h('p');
      stack = h('div', { class: 'stack' }); btns = h('div', { class: 'btns' });
      hint = h('div', { class: 'hint' }, 'Swipe right when it\'s done, left to push it to tomorrow. Arrow keys work too.');
      queue = h('div', { class: 'queue' });
      el = h('div', { class: 'dk' }, h('div', { class: 'head' }, ring, h('div', null, title, sub)), stack, btns, hint, queue);
      return el;
    }
    function deck(now) {
      const T = TCL.sod(now), tk = TCL.key(T);
      const todays = TCL.expand(T, TCL.addDays(T, 1)).filter((o) => o.planDay === tk);
      const carried = TCL.openOneOffs().filter((o) => o.planDay < tk)
        .concat(TCL.expand(new Date(2000, 0, 1), new Date(2100, 0, 1), TCL.tasks().filter((t) => !t.recur && t.done && t.doneOn === tk)).filter((o) => o.planDay < tk));
      const all = carried.concat(todays.filter((o) => !carried.some((x) => x.key === o.key)));
      const open = all.filter((o) => !o.done).sort((a, b) => {
        const ba = back.indexOf(a.key), bb = back.indexOf(b.key);
        if (ba !== bb) return ba - bb;
        return ((b.due < now) - (a.due < now)) || (a.start || a.due) - (b.start || b.due);
      });
      return { all, open };
    }
    function act(o, dir) {
      if (dir > 0) TCL.toggle(o);
      else if (o.recurring) TCL.skip(o);
      else TCL.setPlan(o, TCL.key(TCL.addDays(TCL.sod(new Date()), 1)));
      if (dir > 0) TCL.toast(`Done: ${o.title}`); else TCL.toast(`Moved to tomorrow: ${o.title}`);
    }
    function render() {
      const now = new Date();
      const { all, open } = deck(now);
      const doneM = all.filter((o) => o.done).reduce((s, o) => s + o.dur, 0), totM = all.reduce((s, o) => s + o.dur, 0);
      prog.setAttribute('stroke-dashoffset', C * (1 - (totM ? doneM / totM : 1)));
      title.textContent = `Today · ${TCL.fmtDay(now)}`;
      sub.textContent = `${all.length - open.length} of ${all.length} done · ${TCL.fmtHours(totM - doneM)} left`;
      stack.textContent = ''; btns.textContent = ''; queue.textContent = '';
      hint.hidden = !open.length;
      if (!open.length) {
        const t1 = TCL.addDays(TCL.sod(now), 1);
        const tom = TCL.expand(t1, TCL.addDays(t1, 1)).filter((o) => o.planDay === TCL.key(t1));
        stack.append(h('div', { class: 'card', style: { '--c': 'var(--accent)' } }, h('div', { class: 'empty' },
          h('h3', null, all.length ? 'Deck cleared' : 'Nothing planned today'),
          all.length ? h('p', null, `You finished ${all.filter((o) => o.done).length} task${all.filter((o) => o.done).length === 1 ? '' : 's'} today, ${TCL.fmtHours(doneM)} of work.`) : h('p', null, 'Add a task, or pull one in from Runway or Blocks.'),
          h('p', { class: 'tcl-muted' }, `Tomorrow has ${tom.length} card${tom.length === 1 ? '' : 's'}, ${TCL.fmtHours(tom.reduce((s, o) => s + o.dur, 0))}.`),
          h('div', { class: 'tcl-actions', style: { justifyContent: 'center' } }, h('button', { class: 'tcl-btn primary', onclick: () => TCL.openAdd() }, '+ Task for today')))));
        return;
      }
      open.slice(0, 3).reverse().forEach((o, ri, arr) => {
        const depth = arr.length - 1 - ri, isTop = depth === 0;
        const late = o.due < now;
        const yes = h('div', { class: 'stamp yes' }, 'Done'), no = h('div', { class: 'stamp no' }, 'Tomorrow');
        const card = h('div', { class: 'card' + (isTop ? ' top' : ''), style: { '--c': o.color, transform: `translateY(${depth * 14}px) scale(${1 - depth * .05})`, opacity: isTop ? 1 : 1 - depth * .25, zIndex: 10 - depth } },
          yes, no,
          h('div', { class: 'proj' }, TCL.project(o.project).name + (o.recurring ? ' · routine' : '')),
          h('h3', null, o.title),
          h('div', { class: 'facts' }, h('span', null, '⏱ ' + TCL.fmtDur(o.dur)), o.start ? h('span', null, '🕑 ' + TCL.fmtTime(o.start)) : h('span', null, 'any time today'), h('span', null, 'due ' + TCL.relDue(o, now))),
          o.task.note ? h('div', { class: 'note' }, o.task.note) : null,
          h('div', { class: 'cd' + (late ? ' late' : '') }, TCL.countdown(o, now).replace(/ (left|late)$/, '')),
          h('div', { class: 'cdl' }, late ? 'past the deadline' : 'until the deadline'));
        if (isTop) {
          let x0 = null, dx = 0;
          card.addEventListener('pointerdown', (e) => { x0 = e.clientX; dx = 0; card.setPointerCapture(e.pointerId); card.style.transition = 'none'; });
          card.addEventListener('pointermove', (e) => {
            if (x0 == null) return; dx = e.clientX - x0;
            card.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
            yes.style.opacity = Math.max(0, dx / 100); no.style.opacity = Math.max(0, -dx / 100);
          });
          const end = () => {
            if (x0 == null) return; x0 = null; card.style.transition = '';
            if (Math.abs(dx) > 100) { card.style.transform = `translateX(${Math.sign(dx) * 600}px) rotate(${Math.sign(dx) * 25}deg)`; card.style.opacity = 0; setTimeout(() => act(o, dx), 250); }
            else if (Math.abs(dx) < 5) { card.style.transform = ''; TCL.openTask(o); }
            else { card.style.transform = ''; yes.style.opacity = no.style.opacity = 0; }
          };
          card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
        }
        stack.append(card);
      });
      const top = open[0];
      btns.append(
        h('button', { class: 'tcl-btn', onclick: () => act(top, -1) }, '← Tomorrow'),
        h('button', { class: 'tcl-btn', onclick: () => { const i = back.indexOf(top.key); if (i >= 0) back.splice(i, 1); back.push(top.key); render(); } }, 'Later today'),
        h('button', { class: 'tcl-btn primary', onclick: () => act(top, 1) }, 'Done →'));
      if (open.length > 1) queue.append(h('h4', null, `Still in the deck · ${open.length - 1}`), h('div', { class: 'q' }, open.slice(1).map((o) => h('span', { style: { borderLeftColor: o.color } }, `${o.title} · ${TCL.fmtDur(o.dur)}`))));
    }
    function key(e) {
      const { open } = deck(new Date()); if (!open.length) return;
      if (e.key === 'ArrowRight') act(open[0], 1); else if (e.key === 'ArrowLeft') act(open[0], -1);
    }
    return { build, render, key };
  })();

  /* =================================================================== MONTH */
  views.month = (() => {
    const DOWS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const MAX = 4; // bars shown per day before "+N more"
    const phone = () => innerWidth < 640;
    let m = TCL.sod(new Date()); m.setDate(1);
    let el, title, stage, sheet = null; // sheet: {k, body} while a day's list is open
    function dayData(days, now) {
      const tk = TCL.key(now);
      const occs = TCL.expand(days[0], TCL.addDays(days[days.length - 1], 1));
      const late = TCL.openOneOffs().filter((o) => o.planDay < tk);
      const map = {};
      for (const d of days) {
        const k = TCL.key(d);
        let list = occs.filter((o) => !o.recurring && o.planDay === k);
        if (k === tk) list = late.concat(list.filter((o) => !late.some((x) => x.key === o.key)));
        list.sort((a, b) => a.done - b.done || (b.due < now) - (a.due < now) || b.dur - a.dur);
        const rec = occs.filter((o) => o.recurring && o.planDay === k);
        const load = list.concat(rec).filter((o) => !o.done).reduce((s, o) => s + o.dur, 0);
        map[k] = { d, k, list, rec, load };
      }
      return map;
    }
    const fillW = (o) => Math.min(100, Math.max(8, o.dur / 240 * 100)) + '%';
    function bar(o, k, now, mode) {
      const late = o.due < now && !o.done;
      return h('div', {
        class: 'dgb ' + mode + (o.done ? ' done' : ''), style: { '--c': late ? 'var(--danger)' : o.color, '--w': fillW(o) },
        title: `${o.title} · ${TCL.fmtDur(o.dur)} · due ${TCL.relDue(o, now)}`,
        onclick: (e) => { e.stopPropagation(); TCL.openTask(o); },
      }, TCL.key(o.due) === k ? h('span', { class: 'fl' }, '▶') : null, h('span', { class: 'tx' }, o.title));
    }
    const recDots = (rec) => h('span', { class: 'rd', title: rec.map((o) => o.title).join(', ') }, rec.slice(0, 5).map((o) => h('i', { style: { background: o.color, opacity: o.done ? .35 : 1 } })));
    const loadLine = (load) => h('div', { class: 'ld' }, h('i', { class: load > CAP ? 'over' : '', style: { width: Math.min(100, load / CAP * 100) + '%' } }));
    const itemRow = (o, now) => h('div', { class: 'm-item' + (o.done ? ' done' : ''), onclick: () => TCL.openTask(o) },
      h('input', { type: 'checkbox', checked: o.done, onclick: (e) => { e.stopPropagation(); TCL.toggle(o); } }),
      h('span', { class: 'st', style: { background: o.color } }),
      h('div', null, h('div', { class: 't' }, o.title), h('div', { class: 'm' }, [o.start ? TCL.fmtTime(o.start) : null, o.recurring ? TCL.recurText(o.task.recur).toLowerCase() : 'due ' + TCL.relDue(o, now), TCL.project(o.project).name].filter(Boolean).join(' · '))),
      h('span', { class: 'd' }, TCL.fmtDur(o.dur)));
    function dayList(x, now) {
      const all = x.list.concat(x.rec);
      return h('div', { class: 'dl' },
        h('div', { class: 'dl-h' }, h('span', { class: 'tcl-muted' }, `${all.length} task${all.length === 1 ? '' : 's'} · ${TCL.fmtHours(x.load)} planned`)),
        all.length ? all.map((o) => itemRow(o, now)) : h('p', { class: 'tcl-muted' }, 'Nothing planned.'),
        h('button', { class: 'tcl-btn add', onclick: () => TCL.openAdd({ due: x.k }) }, '+ Task due this day'));
    }
    function openDay(x, now) {
      const body = h('div', { class: 'v-month-sheet' }, dayList(x, now));
      sheet = { k: x.k, body };
      TCL.sheet(TCL.fmtDay(x.d), body, { onClose: () => { if (sheet && sheet.body === body) sheet = null; } });
    }
    function go(n) {
      if (n === 0) { m = TCL.sod(new Date()); m.setDate(1); } else m.setMonth(m.getMonth() + n);
      render();
    }
    function build() {
      title = h('h2');
      stage = h('div', { class: 'stage' });
      el = h('div', { class: 'mo' },
        h('div', { class: 'm-controls' }, title, h('div', { class: 'tcl-seg' },
          h('button', { 'aria-label': 'Previous month', onclick: () => go(-1) }, '‹'),
          h('button', { onclick: () => go(0) }, 'Today'),
          h('button', { 'aria-label': 'Next month', onclick: () => go(1) }, '›'))),
        stage,
        h('div', { class: 'legend' }, h('span', null, h('i', { class: 'sw' }), 'bar fill = time needed (full = 4h)'), h('span', null, '▶ due that day'), h('span', null, '• routines'), h('span', null, 'line under each day = load vs 6h')));
      return el;
    }
    function render() {
      const now = new Date(), tk = TCL.key(now);
      title.textContent = MONTHS[m.getMonth()] + ' ' + m.getFullYear();
      const start = TCL.addDays(TCL.sod(m), -((m.getDay() + 6) % 7));
      let days = Array.from({ length: 42 }, (_, i) => TCL.addDays(start, i));
      if (days[35].getMonth() !== m.getMonth()) days = days.slice(0, 35); // drop a week that is all next month
      const byKey = dayData(days, now);
      const grid = h('div', { class: 'grid' });
      DOWS.forEach((d) => grid.append(h('div', { class: 'm-dow' }, phone() ? d[0] : d)));
      for (const d of days) {
        const x = byKey[TCL.key(d)];
        const c = h('div', { class: 'cell' + (d.getMonth() !== m.getMonth() ? ' out' : '') + (d.getDay() % 6 === 0 ? ' we' : '') + (x.k === tk ? ' today' : ''), onclick: () => openDay(x, now) },
          h('div', { class: 'top' }, h('span', { class: 'num' }, d.getDate()), recDots(x.rec), x.load ? h('span', { class: 'hrs' }, TCL.fmtHours(x.load)) : null));
        x.list.slice(0, MAX).forEach((o) => c.append(bar(o, x.k, now, phone() ? 'tiny' : 'text')));
        if (x.list.length > MAX) {
          const hidden = x.list.slice(MAX);
          c.append(h('button', { class: 'more', onclick: (e) => { e.stopPropagation(); openDay(x, now); } }, `+${hidden.length} more`, h('span', { class: 'md' }, hidden.map((o) => h('i', { style: { background: o.color } })))));
        }
        c.append(loadLine(x.load));
        grid.append(c);
      }
      stage.textContent = '';
      stage.append(grid);
      // keep an open day list current after a task is ticked, edited or added
      if (sheet) {
        const k = sheet.k, d = TCL.parse(k + 'T00:00');
        const x = byKey[k] || dayData([d], now)[k];
        sheet.body.textContent = '';
        sheet.body.append(dayList(x, now));
      }
    }
    function key(e) {
      if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); else if (e.key === 't') go(0);
    }
    return { build, render, key };
  })();

  /* =================================================================== SHELL */
  function welcome() {
    return h('div', { class: 'welcome' },
      h('h2', null, 'Plan with your eyes'),
      h('p', null, 'See every deadline as a runway, block time for work on a week grid, get through today one card at a time, and see the whole month at a glance.'),
      h('div', { class: 'tcl-actions' },
        h('button', { class: 'tcl-btn primary', onclick: () => TCL.openAdd() }, '+ Add your first task'),
        h('button', { class: 'tcl-btn', onclick: () => TCL.loadSample() }, 'Try with sample tasks')),
      h('p', { class: 'tcl-muted', style: { marginTop: '18px' } }, 'Your tasks are saved in this browser on this device.'));
  }
  function show(name) {
    if (!views[name]) name = 'runway';
    current = name;
    localStorage.setItem(VIEW_KEY, name);
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
    viewEl.textContent = '';
    viewEl.className = '';
    if (!TCL.tasks().length) { viewEl.append(welcome()); return; }
    const v = views[name];
    viewEl.classList.toggle('fixed', !!v.fixed);
    viewEl.classList.add('v-' + name);
    viewEl.append(v.build());
    v.render();
  }
  function rerender() {
    const empty = !TCL.tasks().length;
    const showing = !!viewEl.querySelector('.welcome');
    if (empty !== showing) return show(current);
    if (empty) return;
    const v = views[current];
    (v.onData || v.render)();
  }
  TCL.onChange(rerender);
  TCL.every(() => { if (TCL.tasks().length && !document.querySelector('.tcl-scrim')) views[current].render(); });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (TCL.tasks().length) { const v = views[current]; (v.resize || v.render)(); } }, 120); });
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.tcl-scrim') || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'n' && !e.metaKey && !e.ctrlKey) { e.preventDefault(); TCL.openAdd(); return; }
    if (['1', '2', '3', '4'].includes(e.key)) { show(['runway', 'week', 'month', 'deck'][+e.key - 1]); return; }
    const v = views[current]; if (TCL.tasks().length && v.key) v.key(e);
  });
  addEventListener('hashchange', () => show(location.hash.slice(1)));
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
  document.getElementById('add').addEventListener('click', () => TCL.openAdd());
  document.getElementById('menu').addEventListener('click', () => {
    let close;
    const file = h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' } });
    file.addEventListener('change', async () => {
      try { const r = TCL.importJSON(await file.files[0].text()); TCL.toast(`Imported: ${r.added} new, ${r.updated} updated`); close(); }
      catch (e) { TCL.toast('That file is not a Todo Calendar backup'); }
    });
    const item = (label, note, fn, cls = '') => h('button', { class: 'tcl-btn ' + cls, onclick: fn }, label, note ? h('small', null, note) : null);
    const n = TCL.tasks().length;
    close = TCL.sheet('Todo Calendar', h('div', { class: 'menu-list' },
      h('p', { class: 'tcl-muted', style: { margin: '0 0 4px' } }, `${n} task${n === 1 ? '' : 's'} saved in this browser. Shortcuts: N new task, 1 2 3 switch views.`),
      item('Projects', 'Add, rename, recolour or delete projects', () => { close(); openProjects(); }),
      item('Export backup', 'Download all tasks as a JSON file', () => {
        const a = h('a', { href: URL.createObjectURL(new Blob([TCL.exportJSON()], { type: 'application/json' })), download: `todo-calendar-${TCL.key(new Date())}.json` });
        document.body.append(a); a.click(); a.remove(); close();
      }),
      item('Import backup', 'Merge tasks from a backup file; newer edits win', () => file.click()),
      TCL.hasSample() ? item('Remove sample tasks', 'Keeps the tasks you added yourself', () => { TCL.clearSample(); close(); }, 'danger')
        : item('Add sample tasks', 'A few weeks of example tasks to explore with', () => { TCL.loadSample(); close(); }),
      file));
  });
  /* ---------- projects screen ---------- */
  function swatchRow(color, onPick) {
    const row = h('div', { class: 'pp-swatches' });
    const draw = (c) => { row.textContent = ''; TCL.PALETTE.forEach((x) => row.append(h('button', { type: 'button', class: 'pp-sw' + (x === c ? ' on' : ''), style: { background: x }, 'aria-label': 'Colour ' + x, onclick: () => { onPick(x); draw(x); } }))); };
    draw(color);
    return row;
  }
  function openProjects() {
    let close;
    const list = h('div', { class: 'pj-list' });
    const ps = TCL.projects();
    if (!ps.length) list.append(h('p', { class: 'tcl-muted' }, 'No projects yet. Add one here or type a new name when you add a task.'));
    ps.forEach((p) => {
      const n = TCL.projectTaskCount(p.id);
      list.append(h('button', { class: 'pj-row', onclick: () => { close(); openProject(p); } },
        h('span', { class: 'tcl-dot', style: { background: p.color, width: '14px', height: '14px' } }),
        h('span', { class: 'pj-name' }, p.name),
        h('span', { class: 'tcl-muted' }, `${n} task${n === 1 ? '' : 's'} ›`)));
    });
    close = TCL.sheet('Projects', h('div', null, list,
      h('div', { class: 'tcl-actions' }, h('button', { class: 'tcl-btn primary', onclick: () => { close(); openProject(null); } }, '+ New project'))));
  }
  function openProject(p) {
    let close, color = p ? p.color : TCL.nextColor();
    const name = h('input', { type: 'text', value: p ? p.name : '', placeholder: 'Project name', required: true, autocomplete: 'off' });
    const err = h('p', { class: 'pj-err', hidden: true });
    const save = () => {
      const v = name.value.trim();
      if (!v) { err.textContent = 'Give the project a name.'; err.hidden = false; return; }
      const clash = TCL.findProject(v);
      if (clash && clash !== p) { err.textContent = `There is already a project called “${clash.name}”.`; err.hidden = false; return; }
      if (p) TCL.updateProject(p, { name: v, color }); else TCL.addProject(v, color);
      close(); openProjects();
    };
    const body = h('form', { class: 'tcl-form', onsubmit: (e) => { e.preventDefault(); save(); } },
      h('label', null, h('span', null, 'Name'), name),
      h('label', null, h('span', null, 'Colour'), swatchRow(color, (c) => (color = c))),
      err,
      h('div', { class: 'tcl-actions' },
        h('button', { class: 'tcl-btn primary', type: 'submit' }, p ? 'Save' : 'Add project'),
        h('button', { class: 'tcl-btn', type: 'button', onclick: () => { close(); openProjects(); } }, 'Back'),
        p ? h('button', { class: 'tcl-btn danger', type: 'button', style: { marginLeft: 'auto' }, onclick: () => { close(); openDeleteProject(p); } }, 'Delete') : null));
    close = TCL.sheet(p ? 'Edit project' : 'New project', body);
    setTimeout(() => name.focus(), 50);
  }
  function openDeleteProject(p) {
    let close;
    const n = TCL.projectTaskCount(p.id);
    const others = TCL.projects().filter((x) => x !== p);
    const back = h('button', { class: 'tcl-btn', type: 'button', onclick: () => { close(); openProject(p); } }, 'Cancel');
    let body;
    if (!n) {
      body = h('div', null, h('p', null, `“${p.name}” has no tasks. Delete it?`),
        h('div', { class: 'tcl-actions' }, h('button', { class: 'tcl-btn danger', onclick: () => { TCL.deleteProject(p); close(); openProjects(); } }, 'Delete project'), back));
    } else if (!others.length) {
      body = h('div', null, h('p', null, `“${p.name}” has ${n} task${n === 1 ? '' : 's'}, and every task needs a project. Create another project first, then delete this one and move its tasks there.`),
        h('div', { class: 'tcl-actions' }, h('button', { class: 'tcl-btn primary', onclick: () => { close(); openProject(null); } }, '+ New project'), back));
    } else {
      const sel = h('select', null, others.map((x) => h('option', { value: x.id }, x.name)));
      body = h('div', { class: 'tcl-form' },
        h('p', { style: { margin: 0 } }, `“${p.name}” has ${n} task${n === 1 ? '' : 's'}. Move ${n === 1 ? 'it' : 'them'} to:`),
        h('label', null, sel),
        h('div', { class: 'tcl-actions' }, h('button', { class: 'tcl-btn danger', onclick: () => { const to = TCL.PROJECTS[sel.value]; TCL.deleteProject(p, sel.value); TCL.toast(`Deleted “${p.name}”. ${n} task${n === 1 ? '' : 's'} moved to ${to.name}.`); close(); openProjects(); } }, `Move and delete`), back));
    }
    close = TCL.sheet('Delete project', body);
  }

  show(location.hash.slice(1) || localStorage.getItem(VIEW_KEY) || 'runway');
})();
