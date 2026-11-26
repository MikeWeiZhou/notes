/* Duration Grid variations. One renderer, ten behaviours, picked by DG.start(id). */
(function () {
  'use strict';
  const { h } = TCL;
  const DG = (window.DG = {});
  const phone = () => innerWidth < 640;
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /* ---------- data ---------- */
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

  /* ---------- pieces ---------- */
  const fillW = (o) => Math.min(100, Math.max(8, o.dur / 240 * 100)) + '%';
  function bar(o, k, now, mode = 'text', tap = true) {
    const late = o.due < now && !o.done;
    return h('div', {
      class: 'dgb ' + mode + (o.done ? ' done' : ''), style: { '--c': late ? 'var(--danger)' : o.color, '--w': fillW(o) },
      title: `${o.title} · ${TCL.fmtDur(o.dur)} · due ${TCL.relDue(o, now)}`,
      onclick: tap ? (e) => { e.stopPropagation(); TCL.openTask(o); } : null,
    }, mode === 'line' ? null : [TCL.key(o.due) === k ? h('span', { class: 'fl' }, '▶') : null, h('span', { class: 'tx' }, o.title), mode === 'meta' ? h('span', { class: 'du' }, TCL.fmtDur(o.dur)) : null]);
  }
  const recDots = (rec) => h('span', { class: 'rd', title: rec.map((o) => o.title).join(', ') }, rec.slice(0, 5).map((o) => h('i', { style: { background: o.color, opacity: o.done ? .35 : 1 } })));
  const loadLine = (load) => h('div', { class: 'ld' }, h('i', { class: load > TCL.CAP ? 'over' : '', style: { width: Math.min(100, load / TCL.CAP * 100) + '%' } }));
  const more = (n, fn, dots) => h('button', { class: 'more', onclick: (e) => { e.stopPropagation(); fn(); } }, `+${n} more`, dots ? h('span', { class: 'md' }, dots.map((o) => h('i', { style: { background: o.color } }))) : null);
  function dayList(x, now) {
    const all = x.list.concat(x.rec);
    return h('div', { class: 'dl' },
      h('div', { class: 'dl-h' }, h('strong', null, TCL.fmtDay(x.d)), h('span', { class: 'tcl-muted' }, `${TCL.fmtHours(x.load)} planned`)),
      all.length ? all.map((o) => TCL.itemRow(o, now)) : h('p', { class: 'tcl-muted' }, 'Nothing planned.'),
      h('button', { class: 'tcl-btn add', onclick: () => TCL.openAdd({ due: x.k }) }, '+ Task due this day'));
  }
  const openSheet = (x, now) => TCL.sheet(TCL.fmtDay(x.d), dayList(x, now));
  function cellShell(x, m, tk, extraCls = '') {
    const d = x.d;
    return h('div', { class: 'cell' + (d.getMonth() !== m.getMonth() ? ' out' : '') + (d.getDay() % 6 === 0 ? ' we' : '') + (x.k === tk ? ' today' : '') + ' ' + extraCls },
      h('div', { class: 'top' }, h('span', { class: 'num' }, d.getDate()), recDots(x.rec), x.load ? h('span', { class: 'hrs' }, TCL.fmtHours(x.load)) : null));
  }
  function header(grid, extra) { DOW.forEach((d) => grid.append(h('div', { class: 'm-dow' }, phone() ? d[0] : d))); if (extra) grid.append(h('div')); }

  /* ---------- variants ---------- */
  const V = {};
  // 1 tiny text on phone, +N pill with project dots
  V.tiny = (ctx) => {
    const grid = h('div', { class: 'grid' }); header(grid);
    const max = 4;
    for (const x of ctx.cells) {
      const c = cellShell(x, ctx.m, ctx.tk);
      x.list.slice(0, max).forEach((o) => c.append(bar(o, x.k, ctx.now, phone() ? 'tiny' : 'text')));
      if (x.list.length > max) c.append(more(x.list.length - max, () => openSheet(x, ctx.now), x.list.slice(max)));
      c.append(loadLine(x.load));
      c.onclick = () => openSheet(x, ctx.now);
      grid.append(c);
    }
    return grid;
  };
  // 2 accordion: tap a day, its full list opens under that week
  let openDay = null;
  V.accordion = (ctx) => {
    const wrap = h('div', { class: 'grid' }); header(wrap);
    const max = 3;
    ctx.weeks.forEach((wk) => {
      wk.forEach((x) => {
        const c = cellShell(x, ctx.m, ctx.tk, openDay === x.k ? 'sel' : '');
        x.list.slice(0, max).forEach((o) => c.append(bar(o, x.k, ctx.now, phone() ? 'tiny' : 'text', false)));
        if (x.list.length > max) c.append(h('div', { class: 'more' }, `+${x.list.length - max}`));
        c.append(loadLine(x.load));
        c.onclick = () => { openDay = openDay === x.k ? null : x.k; ctx.redraw(); };
        wrap.append(c);
      });
      const sel = wk.find((x) => x.k === openDay);
      if (sel) wrap.append(h('div', { class: 'acc' }, dayList(sel, ctx.now)));
    });
    return wrap;
  };
  // 3 day panel: grid stays compact, the picked day is listed beside (laptop) or below (phone)
  let pick = null;
  V.panel = (ctx) => {
    pick = pick || ctx.tk;
    const grid = h('div', { class: 'grid' }); header(grid);
    for (const x of ctx.cells) {
      const c = cellShell(x, ctx.m, ctx.tk, pick === x.k ? 'sel' : '');
      x.list.slice(0, 4).forEach((o) => c.append(bar(o, x.k, ctx.now, phone() ? 'line' : 'text', !phone())));
      if (x.list.length > 4) c.append(h('div', { class: 'more' }, `+${x.list.length - 4}`));
      c.append(loadLine(x.load));
      c.onclick = () => { pick = x.k; ctx.redraw(); };
      grid.append(c);
    }
    const x = ctx.byKey[pick] || ctx.cells.find((c) => c.k === ctx.tk);
    return h('div', { class: 'split' }, grid, h('aside', { class: 'side' }, x ? dayList(x, ctx.now) : null));
  };
  // 4 grow: every task shown, cells grow taller, text wraps on phone
  V.grow = (ctx) => {
    const grid = h('div', { class: 'grid grow' }); header(grid);
    for (const x of ctx.cells) {
      const c = cellShell(x, ctx.m, ctx.tk);
      x.list.forEach((o) => c.append(bar(o, x.k, ctx.now, phone() ? 'wrap' : 'text')));
      c.append(loadLine(x.load));
      c.onclick = () => openSheet(x, ctx.now);
      grid.append(c);
    }
    return grid;
  };
  // 5 fisheye: one week is big with full text, the rest are compact
  let focusWeek = null;
  V.fisheye = (ctx) => {
    if (focusWeek == null || focusWeek >= ctx.weeks.length) focusWeek = Math.max(0, ctx.weeks.findIndex((w) => w.some((x) => x.k === ctx.tk)));
    const wrap = h('div', { class: 'grid' }); header(wrap);
    ctx.weeks.forEach((wk, wi) => {
      const big = wi === focusWeek;
      wk.forEach((x) => {
        const c = cellShell(x, ctx.m, ctx.tk, big ? 'big' : 'small');
        if (big) x.list.forEach((o) => c.append(bar(o, x.k, ctx.now, phone() ? 'wrap' : 'meta')));
        else x.list.slice(0, 6).forEach((o) => c.append(bar(o, x.k, ctx.now, 'line', false)));
        c.append(loadLine(x.load));
        c.onclick = () => { if (big) openSheet(x, ctx.now); else { focusWeek = wi; ctx.redraw(); } };
        wrap.append(c);
      });
    });
    return wrap;
  };
  // 6 phone agenda: laptop keeps the grid, phone turns the month into a list of days
  V.agenda = (ctx) => {
    if (!phone()) return V.tiny(ctx);
    const list = h('div', { class: 'agenda' });
    ctx.weeks.forEach((wk) => {
      const inMonth = wk.filter((x) => x.d.getMonth() === ctx.m.getMonth());
      if (!inMonth.length) return;
      list.append(h('div', { class: 'ag-wk' }, `Week of ${TCL.fmtDay(wk[0].d).slice(4)} · ${TCL.fmtHours(wk.reduce((s, x) => s + x.load, 0))}`));
      inMonth.forEach((x) => {
        const row = h('div', { class: 'ag-day' + (x.k === ctx.tk ? ' today' : '') + (x.d.getDay() % 6 === 0 ? ' we' : ''), onclick: () => TCL.openAdd({ due: x.k }) },
          h('div', { class: 'ag-date' }, h('b', null, x.d.getDate()), h('span', null, TCL.DOW[x.d.getDay()]), x.load ? h('small', null, TCL.fmtHours(x.load)) : null),
          h('div', { class: 'ag-bars' }, x.list.length ? x.list.map((o) => bar(o, x.k, ctx.now, 'meta')) : h('span', { class: 'tcl-muted ag-free' }, x.rec.length ? `${x.rec.length} routine${x.rec.length === 1 ? '' : 's'}` : 'free'), x.rec.length && x.list.length ? recDots(x.rec) : null));
        list.append(row);
      });
    });
    return list;
  };
  // 7 scroll: fixed-size cells, all tasks inside, scroll within the day
  V.scroll = (ctx) => {
    const grid = h('div', { class: 'grid' }); header(grid);
    for (const x of ctx.cells) {
      const c = cellShell(x, ctx.m, ctx.tk, 'fixed');
      const sc = h('div', { class: 'sc' }, x.list.map((o) => bar(o, x.k, ctx.now, phone() ? 'tiny' : 'text')));
      c.append(sc);
      if (x.list.length > (phone() ? 4 : 4)) c.append(h('div', { class: 'fade' }));
      c.append(loadLine(x.load));
      grid.append(c);
    }
    return grid;
  };
  // 8 summary: one stacked bar per day + count; top titles on laptop
  V.summary = (ctx) => {
    const grid = h('div', { class: 'grid' }); header(grid);
    for (const x of ctx.cells) {
      const c = cellShell(x, ctx.m, ctx.tk);
      const open = x.list.filter((o) => !o.done);
      const scale = Math.max(TCL.CAP, x.load);
      if (x.list.length) {
        c.append(h('div', { class: 'stack' }, open.map((o) => h('i', { style: { width: (o.dur / scale * 100) + '%', background: o.due < ctx.now ? 'var(--danger)' : o.color }, title: o.title }))));
        const dl = x.list.filter((o) => TCL.key(o.due) === x.k && !o.done).length;
        c.append(h('div', { class: 'cnt' }, `${x.list.length} task${x.list.length === 1 ? '' : 's'}`, dl ? h('span', { class: 'fl' }, ` · ▶${dl}`) : null));
        if (!phone()) x.list.slice(0, 2).forEach((o) => c.append(h('div', { class: 'ttl' + (o.done ? ' done' : '') }, h('i', { style: { background: o.color } }), o.title)));
      }
      c.onclick = () => openSheet(x, ctx.now);
      grid.append(c);
    }
    return grid;
  };
  // 9 peek: hover (laptop) or tap (phone) shows a bubble with every task, right over the day
  V.peek = (ctx) => {
    const grid = h('div', { class: 'grid' }); header(grid);
    for (const x of ctx.cells) {
      const c = cellShell(x, ctx.m, ctx.tk);
      x.list.slice(0, 3).forEach((o) => c.append(bar(o, x.k, ctx.now, phone() ? 'tiny' : 'text', false)));
      if (x.list.length > 3) c.append(h('div', { class: 'more' }, `+${x.list.length - 3}`));
      c.append(loadLine(x.load));
      c.addEventListener('mouseenter', () => { if (!phone()) showPeek(c, x, ctx.now); });
      c.addEventListener('mouseleave', (e) => { if (!phone() && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.peek'))) hidePeek(); });
      c.onclick = () => showPeek(c, x, ctx.now, true);
      grid.append(c);
    }
    return grid;
  };
  let peekEl = null;
  function hidePeek() { if (peekEl) { peekEl.remove(); peekEl = null; } }
  function showPeek(cell, x, now, sticky) {
    hidePeek();
    const all = x.list.concat(x.rec);
    peekEl = h('div', { class: 'peek' + (sticky ? ' sticky' : '') },
      h('div', { class: 'pk-h' }, h('strong', null, TCL.fmtDay(x.d)), h('span', null, TCL.fmtHours(x.load)), h('button', { class: 'tcl-x', onclick: hidePeek, 'aria-label': 'Close' }, '×')),
      all.length ? all.map((o) => h('div', { class: 'pk-i' + (o.done ? ' done' : ''), onclick: () => { hidePeek(); TCL.openTask(o); } }, h('i', { style: { background: o.color } }), h('span', null, o.title), h('small', null, TCL.fmtDur(o.dur)))) : h('p', { class: 'tcl-muted' }, 'Nothing planned.'),
      h('button', { class: 'tcl-btn add', onclick: () => { hidePeek(); TCL.openAdd({ due: x.k }); } }, '+ Task'));
    peekEl.addEventListener('mouseleave', (e) => { if (!sticky && !(e.relatedTarget && cell.contains(e.relatedTarget))) hidePeek(); });
    document.body.append(peekEl);
    const r = cell.getBoundingClientRect(), pw = Math.min(280, innerWidth - 16);
    peekEl.style.width = pw + 'px';
    let left = r.left + r.width / 2 - pw / 2; left = Math.max(8, Math.min(innerWidth - pw - 8, left));
    peekEl.style.left = left + 'px';
    const below = r.bottom + 6, ph = peekEl.offsetHeight;
    peekEl.style.top = (below + ph < innerHeight - 8 ? below : Math.max(8, r.top - ph - 6)) + 'px';
  }
  document.addEventListener('click', (e) => { if (peekEl && !e.target.closest('.peek') && !e.target.closest('.cell')) hidePeek(); });
  addEventListener('scroll', hidePeek, true);
  // 10 zoom: Month / 2 weeks / Week; zoomed-in shows full titles even on a phone
  let zoom = 'month';
  V.zoom = (ctx) => {
    const wrap = h('div');
    wrap.append(h('div', { class: 'tcl-seg zoom' }, [['month', 'Month'], ['2w', '2 weeks'], ['1w', 'Week']].map(([z, l]) => h('button', { class: zoom === z ? 'on' : '', onclick: () => { zoom = z; ctx.redraw(); } }, l))));
    let weeks = ctx.weeks;
    if (zoom !== 'month') {
      const T = TCL.sow(new Date()), n = zoom === '2w' ? 14 : 7;
      const days = Array.from({ length: n }, (_, i) => TCL.addDays(T, i));
      const map = dayData(days, ctx.now);
      weeks = [];
      for (let i = 0; i < n; i += 7) weeks.push(days.slice(i, i + 7).map((d) => map[TCL.key(d)]));
    }
    if (zoom === '1w' && phone()) { // a week on a phone reads best as rows
      const list = h('div', { class: 'agenda' });
      weeks[0].forEach((x) => list.append(h('div', { class: 'ag-day' + (x.k === ctx.tk ? ' today' : ''), onclick: () => openSheet(x, ctx.now) },
        h('div', { class: 'ag-date' }, h('b', null, x.d.getDate()), h('span', null, TCL.DOW[x.d.getDay()]), x.load ? h('small', null, TCL.fmtHours(x.load)) : null),
        h('div', { class: 'ag-bars' }, x.list.length ? x.list.map((o) => bar(o, x.k, ctx.now, 'meta')) : h('span', { class: 'tcl-muted ag-free' }, 'free')))));
      wrap.append(list); return wrap;
    }
    const grid = h('div', { class: 'grid' + (zoom === 'month' ? '' : ' zoomed z' + zoom) }); header(grid);
    weeks.flat().forEach((x) => {
      const c = cellShell(x, ctx.m, ctx.tk);
      const max = zoom === 'month' ? 4 : 99;
      x.list.slice(0, max).forEach((o) => c.append(bar(o, x.k, ctx.now, zoom === 'month' ? (phone() ? 'line' : 'text') : (phone() ? 'wrap' : 'meta'))));
      if (x.list.length > max) c.append(h('div', { class: 'more' }, `+${x.list.length - max}`));
      c.append(loadLine(x.load));
      c.onclick = () => openSheet(x, ctx.now);
      grid.append(c);
    });
    wrap.append(grid);
    return wrap;
  };

  // test helper: only touches the prototypes' copy of the data
  function busyDay() {
    const ps = TCL.projects(); if (!ps.length) return;
    const k = TCL.key(TCL.addDays(new Date(), 1));
    const names = ['Reply to landlord', 'Print boarding passes', 'Call the bank', 'Draft newsletter', 'Pick up dry cleaning', 'Review budget sheet', 'Book haircut', 'Update CV'];
    const durs = [5, 15, 30, 45, 60, 90, 20, 120];
    names.forEach((t, i) => TCL.tasks().push({ id: TCL.uid(), title: t, project: ps[i % ps.length].id, due: k, dur: durs[i], done: false, updatedAt: Date.now(), busyDemo: true }));
    TCL.changed();
    TCL.toast('Added 8 test tasks due tomorrow (prototype copy only)');
  }

  DG.start = (id, variant) => {
    TCL.mount(id);
    const app = document.getElementById('app');
    const nav = TCL.monthNav(draw);
    const stage = h('div', { class: 'stage' });
    app.append(nav.el, stage,
      h('div', { class: 'legend' }, h('span', null, h('i', { class: 'sw' }), 'bar fill = time needed (full = 4h)'), h('span', null, '▶ due that day'), h('span', null, '• routines'), h('span', null, 'line under each day = load vs 6h')),
      h('div', { class: 'tcl-actions' }, h('button', { class: 'tcl-btn', onclick: busyDay }, '+ Fill tomorrow with 8 tasks to test a busy day')),
      TCL.srcNote());
    function draw() {
      hidePeek();
      const m = nav.month(), now = new Date(), tk = TCL.key(now);
      const days = TCL.monthDays(m);
      const byKey = dayData(days, now);
      const cells = days.map((d) => byKey[TCL.key(d)]);
      const weeks = []; for (let i = 0; i < 42; i += 7) weeks.push(cells.slice(i, i + 7));
      // drop a trailing week that is entirely next month
      if (weeks[5].every((x) => x.d.getMonth() !== m.getMonth())) weeks.pop();
      stage.textContent = '';
      stage.append(V[variant]({ m, now, tk, cells: weeks.flat(), weeks, byKey, redraw: draw }));
    }
    TCL.onChange(() => { document.querySelectorAll('.tcl-scrim').forEach((s) => s.remove()); draw(); });
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(draw, 120); });
    draw();
  };
})();
