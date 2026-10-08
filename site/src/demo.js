const C = {bg:'#1c1c1c', blue:'#3b82f6', yellow:'#fbbf24', green:'#22c55e', red:'#ef4444', gray:'#9ca3af'};

document.querySelectorAll('[data-tex]').forEach(el =>
  katex.render(el.dataset.tex, el, {displayMode: el.dataset.display === '1', throwOnError: false}));

/* ---------- math helpers ---------- */
function bspline(i, p, t, k) {                       // Cox–de Boor, 0/0 := 0
  if (p === 0) {
    const last = k[k.length - 1];
    return ((k[i] <= t && t < k[i + 1]) || (t === last && k[i] < k[i + 1] && k[i + 1] === last)) ? 1 : 0;
  }
  const d1 = k[i + p] - k[i], d2 = k[i + p + 1] - k[i + 1];
  return (d1 ? (t - k[i]) / d1 * bspline(i, p - 1, t, k) : 0)
       + (d2 ? (k[i + p + 1] - t) / d2 * bspline(i + 1, p - 1, t, k) : 0);
}

function natSpline(xs, ys) {                         // natural cubic spline via second derivatives M
  const n = xs.length - 1, h = [], M = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) h[i] = xs[i + 1] - xs[i];
  const m = n - 1;
  if (m > 0) {
    const b = [], c = [], r = [];
    for (let j = 0; j < m; j++) {
      const i = j + 1;
      b[j] = 2 * (h[i - 1] + h[i]); c[j] = h[i];
      r[j] = 6 * ((ys[i + 1] - ys[i]) / h[i] - (ys[i] - ys[i - 1]) / h[i - 1]);
    }
    for (let j = 1; j < m; j++) { const w = h[j] / b[j - 1]; b[j] -= w * c[j - 1]; r[j] -= w * r[j - 1]; }
    const x = []; x[m - 1] = r[m - 1] / b[m - 1];
    for (let j = m - 2; j >= 0; j--) x[j] = (r[j] - c[j] * x[j + 1]) / b[j];
    for (let j = 0; j < m; j++) M[j + 1] = x[j];
  }
  return t => {
    const i = Math.min(n - 1, Math.max(0, d3.bisect(xs, t) - 1)), H = h[i];
    return M[i] * (xs[i + 1] - t) ** 3 / (6 * H) + M[i + 1] * (t - xs[i]) ** 3 / (6 * H)
         + (ys[i] / H - M[i] * H / 6) * (xs[i + 1] - t) + (ys[i + 1] / H - M[i + 1] * H / 6) * (t - xs[i]);
  };
}

function lagrange(xs, ys) {
  return t => ys.reduce((s, yj, j) =>
    s + yj * xs.reduce((p, xm, m) => m === j ? p : p * (t - xm) / (xs[j] - xm), 1), 0);
}

function axes(g, x, y, xt, yt) {
  g.append('g').attr('transform', `translate(0,${y.range()[0]})`).call(d3.axisBottom(x).ticks(xt))
    .call(a => a.selectAll('text,line,path').attr('stroke', null).attr('fill', C.gray).attr('stroke', C.gray));
  g.append('g').attr('transform', `translate(${x.range()[0]},0)`).call(d3.axisLeft(y).ticks(yt))
    .call(a => a.selectAll('text,line,path').attr('fill', C.gray).attr('stroke', C.gray));
}

/* ---------- 1 · Runge ---------- */
(function () {
  const svg = d3.select('#runge'), W = 800, H = 380, m = {l: 44, r: 16, t: 12, b: 28};
  const x = d3.scaleLinear([-1, 1], [m.l, W - m.r]), y = d3.scaleLinear([-0.6, 1.4], [H - m.b, m.t]);
  svg.append('clipPath').attr('id', 'rc').append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b);
  axes(svg.append('g'), x, y, 8, 6);
  const f = t => 1 / (1 + 25 * t * t), grid = d3.range(-1, 1.0001, 0.005);
  const line = fn => d3.line().x(t => x(t)).y(t => y(fn(t)))(grid);
  const layer = svg.append('g').attr('clip-path', 'url(#rc)');
  layer.append('path').attr('d', line(f)).attr('fill', 'none').attr('stroke', C.gray).attr('stroke-dasharray', '5 4');
  const poly = layer.append('path').attr('fill', 'none').attr('stroke', C.red).attr('stroke-width', 2.5);
  const spl = layer.append('path').attr('fill', 'none').attr('stroke', C.green).attr('stroke-width', 2.5);
  const dots = svg.append('g');
  function draw() {
    const n = +document.getElementById('runge-n').value;
    document.getElementById('runge-nv').textContent = n;
    const xs = d3.range(n).map(i => -1 + 2 * i / (n - 1)), ys = xs.map(f);
    const P = lagrange(xs, ys), S = natSpline(xs, ys);
    poly.attr('d', line(P)); spl.attr('d', line(S));
    dots.selectAll('circle').data(xs).join('circle').attr('cx', x).attr('cy', (d, i) => y(ys[i])).attr('r', 4.5).attr('fill', C.blue);
    const err = fn => d3.max(grid, t => Math.abs(fn(t) - f(t)));
    document.getElementById('runge-err').innerHTML =
      `max error — <span class="red">polynomial ${err(P).toFixed(3)}</span> · <span class="green">spline ${err(S).toFixed(3)}</span>`;
  }
  document.getElementById('runge-n').addEventListener('input', draw);
  draw();
})();

/* ---------- 2 · Sum of bumps ---------- */
(function () {
  const p = 3, n = 12, k = [0, 0, 0, 0, ...d3.range(1, n - 3).map(i => i / (n - 3)), 1, 1, 1, 1];
  const base = [.2, .8, .3, .9, .5, .1, .7, .4, .9, .3, .6, .2];
  let c = base.slice(), sel = 3;
  const svg = d3.select('#bumps'), W = 800, H = 340, m = {l: 44, r: 16, t: 12, b: 28};
  const x = d3.scaleLinear([0, 1], [m.l, W - m.r]), y = d3.scaleLinear([0, 1.05], [H - m.b, m.t]);
  axes(svg.append('g'), x, y, 10, 5);
  const ts = d3.range(0, 1.0001, 0.004);
  const B = ts.map(t => d3.range(n).map(i => bspline(i, p, t, k)));      // precompute basis table
  const curve = w => B.map(row => d3.sum(row, (b, i) => b * w[i]));
  const ghost = curve(base);
  const L = d3.line().x((d, j) => x(ts[j])).y(d => y(d));
  svg.append('g').selectAll('line').data(k.filter((v, i) => i > p && i < n)).join('line')
    .attr('x1', x).attr('x2', x).attr('y1', y(0)).attr('y2', y(1.05)).attr('stroke', '#333');
  const supp = svg.append('rect').attr('y', m.t).attr('height', H - m.t - m.b).attr('fill', C.yellow).attr('opacity', .09);
  const bumpG = svg.append('g');
  svg.append('path').attr('d', L(ghost)).attr('fill', 'none').attr('stroke', C.gray).attr('stroke-dasharray', '5 4');
  const main = svg.append('path').attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
  const box = document.getElementById('bump-sliders');
  c.forEach((v, i) => {
    const lab = document.createElement('label');
    lab.innerHTML = `c<sub>${i}</sub><input type="range" min="0" max="1" step="0.01" value="${v}">`;
    const inp = lab.querySelector('input');
    inp.addEventListener('input', () => { c[i] = +inp.value; sel = i; draw(); });
    inp.addEventListener('focus', () => { sel = i; draw(); });
    box.appendChild(lab);
  });
  document.getElementById('bump-reset').onclick = () => {
    c = base.slice(); box.querySelectorAll('input').forEach((e, i) => e.value = c[i]); draw();
  };
  function draw() {
    const cur = curve(c);
    main.attr('d', L(cur));
    bumpG.selectAll('path').data(d3.range(n)).join('path')
      .attr('d', i => L(B.map(row => row[i] * c[i])))
      .attr('fill', 'none').attr('stroke-width', i => i === sel ? 2.5 : 1.2)
      .attr('stroke', i => i === sel ? C.yellow : C.blue).attr('opacity', i => i === sel ? 1 : .55);
    supp.attr('x', x(k[sel])).attr('width', x(k[Math.min(sel + p + 1, k.length - 1)]) - x(k[sel]));
    const moved = ts.filter((t, j) => Math.abs(cur[j] - ghost[j]) > 1e-9);
    document.getElementById('bump-readout').textContent = moved.length
      ? `curve differs from the original only for x ∈ [${moved[0].toFixed(2)}, ${moved[moved.length - 1].toFixed(2)}]`
      : 'curve identical to the original';
  }
  draw();
})();

/* ---------- 3 · de Casteljau ---------- */
(function () {
  const svg = d3.select('#dc'), W = 800, H = 380;
  const P = [[90, 310], [190, 60], [560, 40], [700, 290]], P0 = P.map(p => p.slice());
  const cols = [C.blue, C.green, C.yellow], tIn = document.getElementById('dc-t');
  const layer = svg.append('g'), handles = svg.append('g');
  const bez = (pts, t) => { let q = pts; while (q.length > 1) q = q.slice(1).map((b, i) => [(1 - t) * q[i][0] + t * b[0], (1 - t) * q[i][1] + t * b[1]]); return q[0]; };
  function draw() {
    const t = +tIn.value; document.getElementById('dc-tv').textContent = t.toFixed(2);
    const levels = [P]; while (levels[levels.length - 1].length > 1) {
      const q = levels[levels.length - 1];
      levels.push(q.slice(1).map((b, i) => [(1 - t) * q[i][0] + t * b[0], (1 - t) * q[i][1] + t * b[1]]));
    }
    layer.selectAll('*').remove();
    const full = d3.range(0, 1.0001, 0.01).map(s => bez(P, s));
    layer.append('path').attr('d', d3.line()(full)).attr('fill', 'none').attr('stroke', '#333').attr('stroke-width', 2);
    const trail = d3.range(0, t + 1e-9, 0.01).map(s => bez(P, s));
    layer.append('path').attr('d', d3.line()(trail)).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
    levels.slice(0, -1).forEach((L, k) => {
      layer.append('path').attr('d', d3.line()(L)).attr('fill', 'none').attr('stroke', cols[k]).attr('stroke-width', 2).attr('opacity', .9);
      if (k > 0) layer.selectAll(null).data(L).join('circle').attr('cx', d => d[0]).attr('cy', d => d[1]).attr('r', 5).attr('fill', cols[k]);
    });
    const e = levels[levels.length - 1][0];
    layer.append('circle').attr('cx', e[0]).attr('cy', e[1]).attr('r', 8).attr('fill', C.red);
    handles.selectAll('circle').data(P).join('circle').attr('r', 9).attr('fill', C.blue).attr('cx', d => d[0]).attr('cy', d => d[1])
      .style('cursor', 'grab')
      .call(d3.drag().on('drag', function (ev, d) {
        d[0] = Math.max(10, Math.min(W - 10, ev.x)); d[1] = Math.max(10, Math.min(H - 10, ev.y)); draw();
      }));
  }
  tIn.addEventListener('input', draw);
  document.getElementById('dc-reset').onclick = () => { P.forEach((p, i) => { p[0] = P0[i][0]; p[1] = P0[i][1]; }); draw(); };
  let raf = null; const btn = document.getElementById('dc-play');
  btn.onclick = () => {
    if (raf) { cancelAnimationFrame(raf); raf = null; btn.textContent = '▶ play'; return; }
    btn.textContent = '❚❚ pause'; let t0 = performance.now() - (+tIn.value) * 4000;
    const step = now => { const t = ((now - t0) / 4000) % 1; tIn.value = t; draw(); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };
  draw();
})();

/* ---------- 4 · Tree <-> plane ---------- */
(function () {
  const svg = d3.select('#pour'), xy = d3.select('#pourxy'), XYS = 400;
  const rowH = 50, top = 34, dx = 64, R = 15;
  const tIn = document.getElementById('pour-t'), nIn = document.getElementById('pour-n');
  const PAL = [C.blue, C.green, C.yellow, '#f97316', '#a855f7', '#ec4899', '#22d3ee'];
  const colorOf = (L, n) => L === n - 1 ? C.red : PAL[L];
  const nameOf = (L, n) => L === 0 ? 'control points' : L === n - 1 ? 'B(t)' : `blend ${L}`;
  const gen = n => n === 2 ? [[50, 300], [350, 100]] : d3.range(n).map(i =>
    [50 + 300 * i / (n - 1), 300 - 220 * Math.sin(Math.PI * i / (n - 1)) + (i > 0 && i < n - 1 ? (i % 2 ? -30 : 40) : 0)]);
  const levelsPos = (P, t) => {                      // lv[L] has n-L points; lv[0] = control points
    const lv = [P];
    while (lv[lv.length - 1].length > 1) {
      const q = lv[lv.length - 1];
      lv.push(q.slice(1).map((b, i) => [(1 - t) * q[i][0] + t * b[0], (1 - t) * q[i][1] + t * b[1]]));
    }
    return lv;
  };
  const f0 = p => `${Math.round(p[0])}, ${Math.round(p[1])}`;
  const f3 = v => v.toFixed(3);
  let sel = 1, node = null, selLevel = null, P = [], Pn = 0;
  xy.attr('viewBox', `0 0 ${XYS} ${XYS}`);
  const xyLayer = xy.append('g'), xyHandles = xy.append('g');

  function explain(L, n) {
    if (L === null) return 'Click a circle on the tree, or a chip above, to see what that row is doing in the plane.';
    if (L === 0) return `<b>Control points</b> (${n}): the only points you place. Their dot size on the right shows their weight in B(t).`;
    if (L === n - 1) return '<b>B(t)</b>: the one point left after all the blending. This is the point on the curve.';
    return `<b>${nameOf(L, n)}</b> (${n - L} points): each one sits <i>t</i> of the way along a segment between two neighbouring points of the row below it. ${n - L} points join into ${n - L - 1} segment${n - L - 1 > 1 ? 's' : ''}, which become the next row.`;
  }

  function draw() {
    const t = +tIn.value, n = +nIn.value;
    document.getElementById('pour-tv').textContent = t.toFixed(2);
    document.getElementById('pour-nv').textContent = n;
    if (n !== Pn) { P = gen(n); Pn = n; }
    sel = Math.min(sel, n - 1);
    if (node && node[0] >= n) node = null;
    if (selLevel !== null && selLevel > n - 1) selLevel = null;
    const lv = levelsPos(P, t), last = n - 1;
    const share = [[1]], routes = [[1]];
    for (let r = 0; r < last; r++) {
      const s = new Array(r + 2).fill(0), c = new Array(r + 2).fill(0);
      share[r].forEach((v, j) => { s[j] += (1 - t) * v; s[j + 1] += t * v; c[j] += routes[r][j]; c[j + 1] += routes[r][j]; });
      share.push(s); routes.push(c);
    }

    /* chips: choose a row */
    const chips = d3.select('#pour-chips'); chips.selectAll('*').remove();
    const mk = (label, color, on, fn) => {
      const b = chips.append('button').attr('class', 'chip' + (on ? ' on' : '')).on('click', fn);
      if (color) b.append('span').attr('class', 'dot').style('background', color);
      b.append('span').text(label);
    };
    mk('all rows', null, selLevel === null, () => { selLevel = null; node = null; draw(); });
    for (let L = 0; L < n; L++) mk(nameOf(L, n), colorOf(L, n), selLevel === L, () => { selLevel = L; node = null; draw(); });

    /* tree */
    const W = Math.max(400, last * dx + 80), H = top + last * rowH + 140;
    svg.attr('viewBox', `0 0 ${W} ${H}`).selectAll('*').remove();
    const X = (r, j) => W / 2 + (j - r / 2) * dx, Y = r => top + r * rowH;
    const onPath = (r, j) => j <= sel && sel <= j + (n - 2 - r);
    const edges = svg.append('g');
    for (let r = 0; r < last; r++) for (let j = 0; j <= r; j++) [[j, C.blue], [j + 1, C.yellow]].forEach(([jj, col]) => {
      const hot = onPath(r, jj), inc = node && r + 1 === node[0] && jj === node[1];
      if (inc) edges.append('line').attr('x1', X(r, j)).attr('y1', Y(r)).attr('x2', X(r + 1, jj)).attr('y2', Y(r + 1))
        .attr('stroke', '#fff').attr('stroke-width', 9).attr('opacity', .55);
      edges.append('line').attr('x1', X(r, j)).attr('y1', Y(r)).attr('x2', X(r + 1, jj)).attr('y2', Y(r + 1))
        .attr('stroke', col).attr('stroke-width', hot ? 3.5 : 1.5).attr('opacity', hot ? 1 : .22);
    });
    const nodes = svg.append('g');
    share.forEach((row, r) => row.forEach((v, j) => {
      const L = last - r, dim = selLevel !== null && selLevel !== L ? .4 : 1;
      const g = nodes.append('g').attr('transform', `translate(${X(r, j)},${Y(r)})`).style('cursor', 'pointer')
        .on('click', () => { node = [r, j]; selLevel = L; if (r === last) sel = j; draw(); });
      g.append('circle').attr('r', R).attr('fill', C.bg).attr('stroke', colorOf(L, n)).attr('stroke-width', 2.5).attr('opacity', dim);
      g.append('circle').attr('r', R - 1).attr('fill', colorOf(L, n)).attr('opacity', dim * (.1 + .6 * v));
      g.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em').attr('fill', '#fff').attr('font-size', 10).attr('opacity', dim)
        .text(v >= .9995 ? '1' : v.toFixed(2).replace(/^0/, ''));
      if (node && node[0] === r && node[1] === j) g.append('circle').attr('r', R + 4).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
    }));
    const by = Y(last) + 100;
    share[last].forEach((v, i) => {
      const x = X(last, i), isSel = i === sel, h = v * 80;
      const hit = svg.append('g').style('cursor', 'pointer').on('click', () => { sel = i; node = [last, i]; selLevel = 0; draw(); });
      hit.append('rect').attr('x', x - dx / 2).attr('y', Y(last) + R + 2).attr('width', dx).attr('height', by - Y(last) - R + 20).attr('fill', 'transparent');
      hit.append('rect').attr('x', x - 15).attr('y', by - h).attr('width', 30).attr('height', Math.max(h, 1)).attr('fill', C.blue)
        .attr('opacity', isSel ? 1 : .5).attr('stroke', isSel ? '#fff' : 'none').attr('stroke-width', 2);
      hit.append('text').attr('x', x).attr('y', by - h - 5).attr('text-anchor', 'middle').attr('fill', C.gray).attr('font-size', 10).text(f3(v));
      hit.append('text').attr('x', x).attr('y', by + 16).attr('text-anchor', 'middle').attr('fill', isSel ? '#fff' : C.gray).attr('font-size', 12).text('P' + i);
    });
    svg.append('text').attr('x', 8).attr('y', 18).attr('fill', C.blue).attr('font-size', 11).text('← × (1 − t)');
    svg.append('text').attr('x', W - 8).attr('y', 18).attr('text-anchor', 'end').attr('fill', C.yellow).attr('font-size', 11).text('× t →');

    /* plane */
    xyLayer.selectAll('*').remove();
    const bez = s => levelsPos(P, s).at(-1)[0];
    xyLayer.append('path').attr('d', d3.line()(d3.range(0, 1.0001, .01).map(bez))).attr('fill', 'none').attr('stroke', '#444').attr('stroke-width', 2);
    xyLayer.append('path').attr('d', d3.line()(d3.range(0, t + 1e-9, .01).map(bez))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
    const lop = L => selLevel === null ? .9 : L === selLevel ? 1 : L === selLevel - 1 ? .55 : .15;
    lv.forEach((pts, L) => {
      const col = colorOf(L, n);
      if (pts.length > 1) xyLayer.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', col)
        .attr('stroke-width', L === selLevel ? 3 : 1.8).attr('opacity', lop(L));
      if (L > 0) xyLayer.selectAll(null).data(pts).join('circle').attr('cx', d => d[0]).attr('cy', d => d[1])
        .attr('r', L === last ? 8 : 5.5).attr('fill', col).attr('opacity', lop(L));
    });
    let msg = '';
    if (node) {
      const [r, j] = node, L = last - r, pt = lv[L][j], v = share[r][j];
      xyLayer.append('circle').attr('cx', pt[0]).attr('cy', pt[1]).attr('r', 12).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 2.5);
      if (L > 0) {
        const a = lv[L - 1][j], b = lv[L - 1][j + 1];
        xyLayer.append('line').attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1]).attr('stroke', '#fff').attr('stroke-width', 3).attr('opacity', .85);
        msg += `<b>Position</b> (${f0(pt)}) = ${(1 - t).toFixed(2)} × (${f0(a)}) + ${t.toFixed(2)} × (${f0(b)}), the point ${t.toFixed(2)} of the way from the first to the second.<br>`;
      } else msg += `<b>P${j}</b> sits at (${f0(pt)}) because you put it there.<br>`;
      if (r === 0) msg += '<b>Weight</b>: the whole 1 unit starts here.';
      else {
        const fromL = j >= 1 ? t * share[r - 1][j - 1] : null, fromR = j <= r - 1 ? (1 - t) * share[r - 1][j] : null, parts = [];
        if (fromL !== null) parts.push(`${f3(fromL)} (t × ${f3(share[r - 1][j - 1])} from the circle above-left)`);
        if (fromR !== null) parts.push(`${f3(fromR)} ((1−t) × ${f3(share[r - 1][j])} from the circle above-right)`);
        msg += `<b>Weight</b> on the tree = ${f3(v)} = ${parts.join(' + ')}`;
      }
      if (r === last) msg += `<br><b>Routes</b>: ${routes[last][j]} × ${((1 - t) ** (last - j) * t ** j).toFixed(4)} per route = ${f3(share[last][j])}`;
    }
    document.getElementById('pour-explain').innerHTML = explain(node ? last - node[0] : selLevel, n);
    document.getElementById('pour-readout').innerHTML = msg;

    xyHandles.selectAll('circle').data(P).join('circle')
      .attr('cx', d => d[0]).attr('cy', d => d[1]).attr('r', (d, i) => 5 + 22 * share[last][i])
      .attr('fill', C.blue).attr('stroke', '#fff').attr('stroke-width', (d, i) => node && node[0] === last && node[1] === i ? 3 : 1)
      .attr('opacity', lop(0)).style('cursor', 'grab')
      .call(d3.drag().on('drag', (ev, d) => { d[0] = Math.max(10, Math.min(XYS - 10, ev.x)); d[1] = Math.max(10, Math.min(XYS - 10, ev.y)); draw(); }));
    xyLayer.selectAll(null).data(P).join('text').attr('x', d => d[0] + 12).attr('y', d => d[1] - 12).attr('fill', C.gray).attr('font-size', 11)
      .attr('pointer-events', 'none').text((d, i) => 'P' + i);
  }
  const presets = {
    reset: n => gen(n),
    straight: n => d3.range(n).map(i => [50 + 300 * i / (n - 1), 300 - 200 * i / (n - 1)]),
    zigzag: n => d3.range(n).map(i => [50 + 300 * i / (n - 1), i % 2 ? 90 : 310]),
    loop: () => [[130, 330], [350, 40], [50, 40], [270, 330]]
  };
  document.querySelectorAll('#pour-presets [data-p]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.p === 'loop') nIn.value = 4;
    const n = +nIn.value; P = presets[b.dataset.p](n); Pn = n; draw();
  }));
  tIn.addEventListener('input', draw); nIn.addEventListener('input', draw);
  draw();
})();

/* ---------- 5 · t is a clock ---------- */
(function () {
  const plane = d3.select('#clk'), gx = d3.select('#clkx'), gy = d3.select('#clky'), S = 400;
  const P0 = [[60, 330], [100, 260], [340, 40], [350, 320]], P = P0.map(p => p.slice());
  const tIn = document.getElementById('clk-t'), ts = d3.range(0, 1.0001, 0.01);
  const bez = s => { const u = 1 - s, w = [u * u * u, 3 * u * u * s, 3 * u * s * s, s * s * s]; return [0, 1].map(k => w.reduce((a, wi, i) => a + wi * P[i][k], 0)); };
  const lerp = (a, b, s) => [(1 - s) * a[0] + s * b[0], (1 - s) * a[1] + s * b[1]];
  const yellow = s => { const q = [0, 1, 2].map(i => lerp(P[i], P[i + 1], s)); return [lerp(q[0], q[1], s), lerp(q[1], q[2], s)]; };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const tick = d3.scaleSequential(d3.interpolateViridis).domain([0, 1]);
  const layer = plane.append('g'), handles = plane.append('g');

  function graph(svg, name, vals, t) {
    svg.selectAll('*').remove();
    const x = d3.scaleLinear([0, 1], [44, 388]), y = d3.scaleLinear([0, S], [128, 14]);
    svg.append('path').attr('d', `M44,14V128H388`).attr('fill', 'none').attr('stroke', C.gray);
    svg.append('path').attr('d', d3.line()(vals.map((v, i) => [x(ts[i]), y(v)]))).attr('fill', 'none').attr('stroke', C.blue).attr('stroke-width', 2.5);
    svg.selectAll('.tk').data(d3.range(0, 1.0001, 0.1)).join('circle').attr('cx', d => x(d)).attr('cy', d => y(vals[Math.round(d * 100)]))
      .attr('r', 4).attr('fill', d => tick(d));
    svg.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', 14).attr('y2', 128).attr('stroke', '#fff').attr('opacity', .7);
    svg.append('circle').attr('cx', x(t)).attr('cy', y(vals[Math.round(t * 100)] ?? vals[100])).attr('r', 6).attr('fill', C.red);
    svg.append('text').attr('x', 8).attr('y', 20).attr('fill', C.gray).attr('font-size', 12).text(name);
    svg.append('text').attr('x', 388).attr('y', 144).attr('text-anchor', 'end').attr('fill', C.gray).attr('font-size', 12).text('t →');
  }

  function draw() {
    const t = +tIn.value; document.getElementById('clk-tv').textContent = t.toFixed(2);
    const pts = ts.map(bez), cur = bez(t);
    layer.selectAll('*').remove();
    layer.append('path').attr('d', d3.line()(P)).attr('fill', 'none').attr('stroke', '#555').attr('stroke-dasharray', '4 4');
    layer.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', '#444').attr('stroke-width', 2);
    layer.append('path').attr('d', d3.line()(pts.slice(0, Math.round(t * 100) + 1).concat([cur]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
    const [a, b] = yellow(t);
    layer.append('line').attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1]).attr('stroke', C.yellow).attr('stroke-width', 3);
    layer.selectAll('.tk').data(d3.range(0, 1.0001, 0.1)).join('circle').attr('cx', d => bez(d)[0]).attr('cy', d => bez(d)[1]).attr('r', 5).attr('fill', d => tick(d)).attr('stroke', C.bg);
    layer.append('circle').attr('cx', cur[0]).attr('cy', cur[1]).attr('r', 8).attr('fill', C.red);
    handles.selectAll('circle').data(P).join('circle').attr('r', 8).attr('fill', C.blue).attr('cx', d => d[0]).attr('cy', d => d[1]).style('cursor', 'grab')
      .call(d3.drag().on('drag', (ev, d) => { d[0] = Math.max(10, Math.min(S - 10, ev.x)); d[1] = Math.max(10, Math.min(S - 10, ev.y)); draw(); }));
    graph(gx, 'x(t)', pts.map(p => p[0]), t);
    graph(gy, 'height y(t)', pts.map(p => S - p[1]), t);
    const per = d3.range(10).map(k => d3.sum(d3.range(10), i => dist(pts[10 * k + i], pts[10 * k + i + 1])));
    document.getElementById('clk-read').innerHTML =
      `t = ${t.toFixed(2)} → point (${Math.round(cur[0])}, ${Math.round(cur[1])}) · speed now = 3 × ${Math.round(dist(a, b))} = <b>${Math.round(3 * dist(a, b))}</b> px per unit of t` +
      `<br>distance covered in each tenth of t (colour order): ${per.map(Math.round).join(' · ')} px`;
  }
  tIn.addEventListener('input', draw);
  document.getElementById('clk-reset').onclick = () => { P.forEach((p, i) => { p[0] = P0[i][0]; p[1] = P0[i][1]; }); draw(); };
  let raf = null; const btn = document.getElementById('clk-play');
  btn.onclick = () => {
    if (raf) { cancelAnimationFrame(raf); raf = null; btn.textContent = '▶ play'; return; }
    btn.textContent = '❚❚ pause'; const t0 = performance.now() - (+tIn.value) * 5000;
    const step = now => { tIn.value = ((now - t0) / 5000) % 1; draw(); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };
  draw();
})();

/* ---------- 6 · Why t? regression y=f(x) vs parametric ---------- */
(function () {
  const L = d3.select('#rg'), R = d3.select('#rgt'), S = 400;
  const SHAPES = {
    hill: [[50, 330], [130, 60], [270, 60], [350, 330]],
    hairpin: [[60, 340], [385, 340], [385, 60], [60, 60]],
    loop: [[130, 330], [350, 40], [50, 40], [270, 330]]
  };
  const NOTES = {
    hill: 'This one is already a function of x, so regression copes: the error is small. Regression is fine <i>when the curve never doubles back</i>.',
    hairpin: 'The curve goes right, then turns back left, like a ball bouncing off a wall and returning. Most x values are visited twice.',
    loop: 'A loop crosses itself, so near the middle one x is visited three times.'
  };
  let shape = 'loop';
  const xIn = document.getElementById('rg-x'), dIn = document.getElementById('rg-d');
  const bez = (P, s) => { const u = 1 - s, w = [u * u * u, 3 * u * u * s, 3 * u * s * s, s * s * s]; return [0, 1].map(k => w.reduce((a, wi, i) => a + wi * P[i][k], 0)); };

  function polyfit(xs, ys, deg) {                       // least squares on x scaled to [-1,1]
    const m = deg + 1, A = Array.from({length: m}, () => new Array(m + 1).fill(0));
    xs.forEach((x, k) => {
      const u = (x - 200) / 200, pw = [1];
      for (let i = 1; i < 2 * m; i++) pw.push(pw[i - 1] * u);
      for (let r = 0; r < m; r++) { for (let c = 0; c < m; c++) A[r][c] += pw[r + c]; A[r][m] += pw[r] * ys[k]; }
    });
    for (let c = 0; c < m; c++) {                       // Gaussian elimination, partial pivoting
      let p = c; for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]];
      for (let r = c + 1; r < m; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k <= m; k++) A[r][k] -= f * A[c][k]; }
    }
    const co = new Array(m).fill(0);
    for (let r = m - 1; r >= 0; r--) co[r] = (A[r][m] - d3.sum(d3.range(r + 1, m), k => A[r][k] * co[k])) / A[r][r];
    return x => { const u = (x - 200) / 200; return co.reduceRight((a, c) => a * u + c, 0); };
  }

  function draw() {
    const P = SHAPES[shape], xs0 = +xIn.value, deg = +dIn.value;
    document.getElementById('rg-xv').textContent = xs0; document.getElementById('rg-dv').textContent = deg;
    document.querySelectorAll('#rg-shapes .chip').forEach(b => b.classList.toggle('on', b.dataset.s === shape));
    const ts = d3.range(0, 1.00001, 0.0025), pts = ts.map(s => bez(P, s));
    const f = polyfit(pts.map(p => p[0]), pts.map(p => p[1]), deg);
    const xmin = d3.min(pts, p => p[0]), xmax = d3.max(pts, p => p[0]);
    const rms = Math.sqrt(d3.mean(pts, p => (f(p[0]) - p[1]) ** 2));
    const hits = [];                                   // parameter values where x(t) = x*
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i][0] - xs0, b = pts[i + 1][0] - xs0;
      if (a === 0 || a * b < 0) { const w = a === b ? 0 : a / (a - b), t = ts[i] + w * (ts[i + 1] - ts[i]); hits.push([t, bez(P, t)[1]]); }
    }
    const fx = d3.range(xmin, xmax + 1, 2);
    const base = (svg, title) => {
      svg.selectAll('*').remove();
      svg.append('line').attr('x1', xs0).attr('x2', xs0).attr('y1', 0).attr('y2', S).attr('stroke', '#fff').attr('stroke-dasharray', '5 4').attr('opacity', .7);
      svg.append('text').attr('x', 10).attr('y', 20).attr('fill', C.gray).attr('font-size', 13).text(title);
    };
    base(L, 'regression: y = f(x)');
    L.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', '#666').attr('stroke-width', 2.5);
    L.append('path').attr('d', d3.line()(fx.map(x => [x, f(x)]))).attr('fill', 'none').attr('stroke', '#f97316').attr('stroke-width', 3);
    L.selectAll('.h').data(hits).join('circle').attr('cx', xs0).attr('cy', d => d[1]).attr('r', 6).attr('fill', C.yellow);
    if (xs0 >= xmin && xs0 <= xmax) L.append('circle').attr('cx', xs0).attr('cy', f(xs0)).attr('r', 6).attr('fill', 'none').attr('stroke', '#f97316').attr('stroke-width', 3);
    L.append('text').attr('x', 10).attr('y', S - 12).attr('fill', '#f97316').attr('font-size', 12).text(`fitted curve · RMS miss ${rms.toFixed(1)} px`);
    base(R, 'with t: (x(t), y(t))');
    R.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
    const col = d3.scaleSequential(d3.interpolateViridis).domain([0, 1]);
    R.selectAll('.h').data(hits).join('circle').attr('cx', xs0).attr('cy', d => d[1]).attr('r', 6.5).attr('fill', d => col(d[0])).attr('stroke', C.bg);
    R.selectAll('.l').data(hits).join('text').attr('x', xs0 + 10).attr('y', d => d[1] - 8).attr('fill', d => col(d[0])).attr('font-size', 12).text(d => 't=' + d[0].toFixed(2));
    const ys = hits.map(h => Math.round(h[1]));
    document.getElementById('rg-left').innerHTML = hits.length
      ? `At x = ${xs0} the real curve has <b>${hits.length}</b> y-value${hits.length > 1 ? 's' : ''} (${ys.join(', ')}). A function must give one: regression says ${Math.round(f(xs0))}.`
      : `At x = ${xs0} the curve isn't there (move the line over the curve).`;
    document.getElementById('rg-right').innerHTML = hits.length
      ? `With t, that x is reached at ${hits.map(h => 't = ' + h[0].toFixed(2)).join(', ')}, giving y = ${ys.join(', ')}. Different t, so no clash.`
      : '';
    document.getElementById('rg-note').innerHTML = NOTES[shape];
  }
  document.querySelectorAll('#rg-shapes .chip').forEach(b => b.addEventListener('click', () => { shape = b.dataset.s; draw(); }));
  xIn.addEventListener('input', draw); dIn.addEventListener('input', draw);
  draw();
})();

/* ---------- 7 · Knots on a bouncing ball ---------- */
(function () {
  const p = 3, N = 140, V = 4.4, X0 = 0.3, K = [1, 2, 3, 4].map(k => (k - X0) / V);   // bounce times
  const tri = t => { const u = (((X0 + V * t) % 2) + 2) % 2; return u <= 1 ? u : 2 - u; };
  let seed = 7;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  const ts = d3.range(N).map(i => i / (N - 1)), z = ts.map(gauss), truth = ts.map(tri);
  const grid = d3.range(0, 1.00001, 0.0025), gt = grid.map(tri);
  const svg = d3.select('#kn'), sb = d3.select('#knb');
  const x = d3.scaleLinear([0, 1], [40, 780]), y = d3.scaleLinear([-0.1, 1.1], [300, 15]), yb = d3.scaleLinear([0, 1], [105, 10]);

  function solve(A, b) {
    const n = b.length;
    for (let c = 0; c < n; c++) {
      let q = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[q][c])) q = r;
      [A[c], A[q]] = [A[q], A[c]]; [b[c], b[q]] = [b[q], b[c]];
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
    }
    const s = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) s[r] = (b[r] - d3.sum(d3.range(r + 1, n), k => A[r][k] * s[k])) / A[r][r];
    return s;
  }
  const kv = (m, mult) => {
    const inner = d3.range(1, m + 1).map(i => i / (m + 1)), bk = K.flatMap(t => new Array(mult).fill(t));
    return [...new Array(p + 1).fill(0), ...inner.concat(bk).sort(d3.ascending), ...new Array(p + 1).fill(1)];
  };
  function fit(knots, ys) {
    const n = knots.length - p - 1, B = ts.map(t => d3.range(n).map(i => bspline(i, p, t, knots)));
    const A = d3.range(n).map(r => d3.range(n).map(c => d3.sum(B, row => row[r] * row[c]) + (r === c ? 1e-9 : 0)));
    const c = solve(A, d3.range(n).map(r => d3.sum(B, (row, k) => row[r] * ys[k])));
    return grid.map(t => d3.sum(c, (ci, i) => ci * bspline(i, p, t, knots)));
  }
  const score = f => {
    const rms = Math.sqrt(d3.mean(f, (v, i) => (v - gt[i]) ** 2));
    const near = d3.max(f, (v, i) => K.some(b => Math.abs(grid[i] - b) < 0.02) ? Math.abs(v - gt[i]) : 0);
    return `RMS error ${rms.toFixed(3)} · worst miss near a bounce ${near.toFixed(3)}`;
  };

  function draw() {
    const noise = +document.getElementById('kn-noise').value, u = +document.getElementById('kn-u').value, m = +document.getElementById('kn-m').value;
    document.getElementById('kn-noisev').textContent = noise.toFixed(3);
    document.getElementById('kn-uv').textContent = u; document.getElementById('kn-mv').textContent = m;
    const ys = truth.map((v, i) => v + noise * z[i]);
    const kU = kv(u, 0), kB = kv(u, m), fU = fit(kU, ys), fB = fit(kB, ys);
    svg.selectAll('*').remove(); sb.selectAll('*').remove();
    [0, 1].forEach(w => svg.append('line').attr('x1', 40).attr('x2', 780).attr('y1', y(w)).attr('y2', y(w)).attr('stroke', '#555').attr('stroke-dasharray', '4 4'));
    svg.append('text').attr('x', 44).attr('y', y(1) - 4).attr('fill', C.gray).attr('font-size', 11).text('wall');
    svg.append('text').attr('x', 44).attr('y', y(0) + 14).attr('fill', C.gray).attr('font-size', 11).text('wall');
    svg.append('text').attr('x', 780).attr('y', 326).attr('text-anchor', 'end').attr('fill', C.gray).attr('font-size', 11).text('time t →');
    K.forEach(b => svg.append('line').attr('x1', x(b)).attr('x2', x(b)).attr('y1', 15).attr('y2', 300).attr('stroke', C.yellow).attr('opacity', .18));
    svg.append('path').attr('d', d3.line()(grid.map((t, i) => [x(t), y(gt[i])]))).attr('fill', 'none').attr('stroke', '#777').attr('stroke-width', 1.5);
    svg.selectAll('.d').data(ts).join('circle').attr('cx', t => x(t)).attr('cy', (t, i) => y(ys[i])).attr('r', 2.4).attr('fill', '#ddd').attr('opacity', .6);
    const line = f => d3.line()(grid.map((t, i) => [x(t), y(f[i])]));
    svg.append('path').attr('d', line(fU)).attr('fill', 'none').attr('stroke', C.blue).attr('stroke-width', 3);
    svg.append('path').attr('d', line(fB)).attr('fill', 'none').attr('stroke', C.yellow).attr('stroke-width', 3);
    const ticks = (s, ks, col, h, base) => { const seen = {}; ks.slice(p + 1, ks.length - p - 1).forEach(v => { const r = seen[v] = (seen[v] || 0) + 1; s.append('line').attr('x1', x(v)).attr('x2', x(v)).attr('y1', base - (r - 1) * 5).attr('y2', base - (r - 1) * 5 - 4).attr('stroke', col).attr('stroke-width', 2); }); };
    ticks(svg, kU, C.blue, 4, 318); ticks(svg, kB.filter(v => K.includes(v)).length ? kB.filter(v => v === 0 || v === 1 || K.includes(v)) : [], C.yellow, 4, 310);
    // basis functions for the yellow knot vector
    const nb = kB.length - p - 1;
    d3.range(nb).forEach(i => sb.append('path').attr('d', d3.line()(d3.range(0, 1.00001, 0.004).map(t => [x(t), yb(bspline(i, p, t, kB))])))
      .attr('fill', 'none').attr('stroke', d3.schemeTableau10[i % 10]).attr('stroke-width', 1.4).attr('opacity', .85));
    K.forEach(b => sb.append('line').attr('x1', x(b)).attr('x2', x(b)).attr('y1', 10).attr('y2', 105).attr('stroke', C.yellow).attr('opacity', .25));
    sb.append('text').attr('x', 44).attr('y', 14).attr('fill', C.gray).attr('font-size', 11).text(`bump functions (${nb}), yellow knot vector`);
    document.getElementById('kn-read').innerHTML =
      `<span class="blue">blue</span> (${kU.length - 2 * (p + 1)} knots): ${score(fU)}<br><span class="yellow">yellow</span> (${kB.length - 2 * (p + 1)} knots, bounce knots ×${m}, continuity C<sup>${p - m}</sup> there): ${score(fB)}`;
  }
  ['kn-noise', 'kn-u', 'kn-m'].forEach(id => document.getElementById(id).addEventListener('input', draw));
  draw();
})();
