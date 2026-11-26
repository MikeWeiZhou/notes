/* Monthly view prototypes: harness on top of the app's core.js.
   Each page loads with TODOCAL_KEY = 'todocal.monthproto', a copy of the app's data,
   so nothing done here touches the real app. */
(function () {
  'use strict';
  const { h } = TCL;
  const COPY = 'todocal.monthproto', REAL = 'todocal.v1';
  TCL.source = localStorage.getItem('todocal.monthproto.src') || 'sample';
  if (!TCL.tasks().length) { TCL.loadSample(); TCL.source = 'sample'; localStorage.setItem('todocal.monthproto.src', 'sample'); }

  // fresh copy from the app (or samples if the app is empty), then reload
  TCL.refreshCopy = () => {
    let real = null;
    try { real = JSON.parse(localStorage.getItem(REAL)); } catch (e) {}
    if (real && real.tasks && real.tasks.length) { localStorage.setItem(COPY, JSON.stringify(real)); localStorage.setItem('todocal.monthproto.src', 'app'); }
    else { localStorage.removeItem(COPY); localStorage.setItem('todocal.monthproto.src', 'sample'); }
    location.reload();
  };

  TCL.MPROTOS = [
    { id: 'grid', name: 'Duration Grid', idea: 'A classic month grid. Each task is a bar whose length shows how long it takes, so busy days look full.', features: [
      ['bars', 'Task bars sized by duration inside each day'],
      ['deadlineflag', 'Deadline marker ▶ on bars due that day'],
      ['loadline', 'Thin load line at the bottom of each day'],
      ['more', '"+3 more" when a day overflows, tap to see all'],
      ['dayinfo', 'Tap a day for its full list'],
      ['weekends', 'Weekends tinted'],
    ] },
    { id: 'heat', name: 'Heat Month', idea: 'Days shaded by how busy they are, with project-coloured deadline dots. The whole month in one glance.', features: [
      ['heat', 'Shade = hours of work planned'],
      ['dots', 'Project-coloured deadline dots'],
      ['over', 'Red ring when a day is over capacity'],
      ['weektotal', 'Hours per week column'],
      ['panel', 'Side panel (laptop) / drawer (phone) for the picked day'],
      ['filter', 'Filter by project'],
    ] },
    { id: 'span', name: 'Runway Month', idea: 'Your Runway on a month calendar. Each task stretches from when you plan to start until its deadline.', features: [
      ['spans', 'Bars that span days, ending at the deadline'],
      ['lanes', 'Bars stack in lanes so none overlap'],
      ['flag', 'Flag on the deadline end of each bar'],
      ['work', 'Solid part = planned work day, faded part = runway'],
      ['overdue', 'Overdue tasks pinned in red at today'],
      ['routines', 'Routines hidden to keep the month clean'],
    ] },
    { id: 'strip', name: 'Blocks Month', idea: 'Your Blocks view shrunk to a month. Each day is a mini timeline from 6am to midnight with time blocks.', features: [
      ['minitime', 'Mini 6am–midnight timeline in every day'],
      ['blocks', 'Scheduled tasks as coloured blocks at their time'],
      ['unsched', 'Unscheduled tasks as a dotted pile at the bottom'],
      ['nowline', 'Now line on today'],
      ['hover', 'Hover or tap a block to see the task'],
      ['jumpweek', 'Tap a day to open it in Blocks (in the real app)'],
    ] },
    { id: 'rings', name: 'Ring Month', idea: 'Every day is a ring that fills up by project as work is planned. Done work turns solid.', features: [
      ['ring', 'Ring per day, segments coloured by project'],
      ['fill', 'Ring fills toward your daily capacity'],
      ['donefill', 'Done work solid, open work outlined'],
      ['center', 'Deadline count in the ring centre'],
      ['agenda', 'Agenda for the picked day underneath'],
      ['streak', 'Month summary: hours planned, done and overdue'],
    ] },
  ];
  const PKEY = 'tcl.monthpicks.v1';
  TCL.picks = () => { try { return JSON.parse(localStorage.getItem(PKEY)) || {}; } catch (e) { return {}; } };
  TCL.savePicks = (p) => localStorage.setItem(PKEY, JSON.stringify(p));
  TCL.picksText = () => {
    const p = TCL.picks(), lines = [];
    const base = TCL.MPROTOS.find((x) => x.id === p.base);
    if (base) lines.push(`Base month view: ${base.name}`);
    for (const pr of TCL.MPROTOS) {
      const sel = pr.features.filter(([id]) => (p[pr.id] || {})[id]);
      const note = (p.notes || {})[pr.id];
      if (!sel.length && !note) continue;
      lines.push(`\n${pr.name}:`);
      sel.forEach(([, l]) => lines.push(`- ${l}`));
      if (note) lines.push(`- Note: ${note}`);
    }
    if (p.general) lines.push(`\nOther: ${p.general}`);
    return lines.length ? 'My picks for the monthly view\n' + lines.join('\n') : '';
  };
  TCL.featureList = (pr, onChange) => {
    const p = TCL.picks();
    const box = h('div', { class: 'tcl-feats' });
    pr.features.forEach(([id, label]) => {
      const cb = h('input', { type: 'checkbox', checked: !!(p[pr.id] || {})[id] });
      cb.addEventListener('change', () => { const q = TCL.picks(); q[pr.id] = q[pr.id] || {}; q[pr.id][id] = cb.checked; TCL.savePicks(q); onChange && onChange(); });
      box.append(h('label', { class: 'tcl-feat' }, cb, h('span', null, label)));
    });
    const base = h('input', { type: 'radio', name: 'mbase-' + Math.random(), checked: p.base === pr.id });
    base.addEventListener('change', () => { const q = TCL.picks(); q.base = pr.id; TCL.savePicks(q); onChange && onChange(); });
    box.append(h('label', { class: 'tcl-feat base' }, base, h('span', null, 'Use this as the month view')));
    const note = h('textarea', { rows: 2, placeholder: 'Anything you liked or disliked here?' });
    note.value = (p.notes || {})[pr.id] || '';
    note.addEventListener('input', () => { const q = TCL.picks(); q.notes = q.notes || {}; q.notes[pr.id] = note.value; TCL.savePicks(q); onChange && onChange(); });
    box.append(note);
    return box;
  };
  TCL.mount = (id) => {
    const pr = TCL.MPROTOS.find((x) => x.id === id);
    const n = TCL.MPROTOS.indexOf(pr) + 1, N = TCL.MPROTOS.length;
    const prev = TCL.MPROTOS[(n - 2 + N) % N], next = TCL.MPROTOS[n % N];
    const badge = h('span', { class: 'tcl-badge' });
    const upd = () => { const c = Object.values(TCL.picks()[id] || {}).filter(Boolean).length; badge.textContent = c || ''; badge.hidden = !c; };
    const bar = h('header', { class: 'tcl-bar' },
      h('a', { class: 'tcl-back', href: '../', 'aria-label': 'All month prototypes' }, '‹'),
      h('div', { class: 'tcl-name' }, h('small', null, `Month view ${n} of ${N}`), h('strong', null, pr.name)),
      h('div', { class: 'tcl-tools' },
        h('a', { class: 'tcl-icon', href: `../${prev.id}/`, title: 'Previous', 'aria-label': 'Previous prototype' }, '←'),
        h('a', { class: 'tcl-icon', href: `../${next.id}/`, title: 'Next', 'aria-label': 'Next prototype' }, '→'),
        h('button', { class: 'tcl-btn feat', onclick: () => TCL.sheet(`What do you like in ${pr.name}?`, h('div', null,
          h('p', { class: 'tcl-muted' }, pr.idea), TCL.featureList(pr, upd),
          h('p', { class: 'tcl-muted' }, TCL.source === 'app' ? 'Showing a copy of your app\'s tasks. Changes here don\'t touch the app.' : 'Showing sample tasks (the app had none in this browser).'),
          h('button', { class: 'tcl-btn ghost', onclick: TCL.refreshCopy }, TCL.source === 'app' ? 'Re-copy tasks from the app' : 'Copy tasks from the app now'))) }, '★ Pick', badge),
        h('button', { class: 'tcl-btn primary', onclick: () => TCL.openAdd() }, '+ Task')));
    document.body.prepend(bar);
    upd();
  };

  /* helpers shared by the month views */
  TCL.CAP = 6 * 60;
  TCL.monthDays = (month) => { const s = TCL.sow(month); return Array.from({ length: 42 }, (_, i) => TCL.addDays(s, i)); };
  TCL.monthName = (d) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getFullYear();
  // month navigation controls; returns {el, month()} and calls onNav
  TCL.monthNav = (onNav) => {
    let m = TCL.sod(new Date()); m.setDate(1);
    const title = h('h2');
    const go = (n) => { if (n === 0) { m = TCL.sod(new Date()); m.setDate(1); } else m.setMonth(m.getMonth() + n); title.textContent = TCL.monthName(m); onNav(); };
    title.textContent = TCL.monthName(m);
    const el = h('div', { class: 'm-controls' }, title, h('div', { class: 'tcl-seg' },
      h('button', { 'aria-label': 'Previous month', onclick: () => go(-1) }, '‹'), h('button', { onclick: () => go(0) }, 'Today'), h('button', { 'aria-label': 'Next month', onclick: () => go(1) }, '›')));
    return { el, month: () => m };
  };
  TCL.itemRow = (o, now = new Date()) => h('div', { class: 'm-item' + (o.done ? ' done' : ''), onclick: () => TCL.openTask(o) },
    h('input', { type: 'checkbox', checked: o.done, onclick: (e) => { e.stopPropagation(); TCL.toggle(o); } }),
    h('span', { class: 'st', style: { background: o.color } }),
    h('div', null, h('div', { class: 't' }, o.title), h('div', { class: 'm' }, [o.start ? TCL.fmtTime(o.start) : null, o.recurring ? TCL.recurText(o.task.recur).toLowerCase() : 'due ' + TCL.relDue(o, now), TCL.project(o.project).name].filter(Boolean).join(' · '))),
    h('span', { class: 'd' }, TCL.fmtDur(o.dur)));
  TCL.srcNote = () => h('p', { class: 'm-src' }, TCL.source === 'app' ? 'Showing a copy of your app\'s tasks. Changes here don\'t touch the app.' : 'Showing sample tasks. Your app had no tasks in this browser.');
})();
