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
    { id: 'tiny', name: 'Tiny Titles', idea: 'Same grid; on a phone the bars keep short titles in small text. A "+N more" pill shows the colours of what is hidden.', features: [
      ['tinytext', 'Small titles stay visible on a phone'], ['morepill', '"+N more" with dots for the hidden tasks\' projects'], ['sheet', 'Tap a day to see its full list in a sheet']] },
    { id: 'accordion', name: 'Expanding Week', idea: 'Tap a day and its full task list opens right under that week, inside the calendar.', features: [
      ['inline', 'Full list opens inline under the week'], ['stayscontext', 'Rest of the month stays visible'], ['tapclose', 'Tap the day again to close']] },
    { id: 'panel', name: 'Day Panel', idea: 'The grid stays compact; the picked day is always listed beside it on a laptop or below it on a phone.', features: [
      ['alwayslist', 'Picked day always listed, no pop-ups'], ['phonelines', 'Phone grid uses thin bars, the list has the text'], ['sidepanel', 'Laptop: list sits beside the month']] },
    { id: 'grow', name: 'Growing Days', idea: 'Every task is always shown. Busy days simply grow taller; on a phone titles wrap onto two lines.', features: [
      ['noneHidden', 'Nothing hidden behind "+more"'], ['wrap', 'Titles wrap to two lines on a phone'], ['busytall', 'Busy weeks look taller at a glance']] },
    { id: 'fisheye', name: 'Focus Week', idea: 'One week is shown big with full titles and durations; the other weeks shrink to thin bars. Tap a week to focus it.', features: [
      ['bigweek', 'Current week big with full details'], ['smallweeks', 'Other weeks as thin bars'], ['tapfocus', 'Tap any week to make it the big one']] },
    { id: 'agenda', name: 'Phone Agenda', idea: 'Laptop keeps the grid. On a phone the month becomes a list of days, each with full-width duration bars.', features: [
      ['phonelist', 'Phone: month as a list of days'], ['fullbars', 'Full-width bars with title and duration'], ['weekhdr', 'Week headers with total hours']] },
    { id: 'scroll', name: 'Scrolling Days', idea: 'Days keep a fixed size; when there are more tasks you scroll inside the day.', features: [
      ['fixedsize', 'Every day the same size'], ['innerScroll', 'Scroll inside a busy day'], ['fadehint', 'Fade at the bottom hints there is more']] },
    { id: 'summary', name: 'Day Summary', idea: 'Each day shows one stacked bar of its work plus a count; the top two titles on a laptop. Tap for the list.', features: [
      ['stackbar', 'One stacked bar per day, segment per task'], ['count', 'Task count and deadline count'], ['toptwo', 'Top two titles on a laptop']] },
    { id: 'peek', name: 'Peek Bubble', idea: 'Hover a day on a laptop, or tap it on a phone, and a bubble shows every task right over the calendar.', features: [
      ['hoverpeek', 'Hover to peek on a laptop'], ['tappeek', 'Tap to peek on a phone'], ['bubble', 'Bubble stays near the day instead of a full sheet']] },
    { id: 'zoom', name: 'Zoom Levels', idea: 'Switch between Month, 2 weeks and Week. Zoomed in, every title and duration is shown, even on a phone.', features: [
      ['zoomtoggle', 'Month / 2 weeks / Week switch'], ['fulltext', 'Full titles when zoomed in'], ['weekrows', 'Week on a phone shows as rows']] },
  ];
  const PKEY = 'tcl.monthpicks.v2';
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
    return lines.length ? 'My picks for the Duration Grid month view\n' + lines.join('\n') : '';
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
      h('a', { class: 'tcl-back', href: '../', 'aria-label': 'All variations' }, '‹'),
      h('div', { class: 'tcl-name' }, h('small', null, `Variation ${n} of ${N}`), h('strong', null, pr.name)),
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
