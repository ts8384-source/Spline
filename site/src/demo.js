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
  const P = [[90, 310], [190, 60], [560, 40], [700, 290]];
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
  let raf = null; const btn = document.getElementById('dc-play');
  btn.onclick = () => {
    if (raf) { cancelAnimationFrame(raf); raf = null; btn.textContent = '▶ play'; return; }
    btn.textContent = '❚❚ pause'; let t0 = performance.now() - (+tIn.value) * 4000;
    const step = now => { const t = ((now - t0) / 4000) % 1; tIn.value = t; draw(); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };
  draw();
})();

/* ---------- 4 · Pouring board (Bernstein weights) ---------- */
(function () {
  const svg = d3.select('#pour'), W = 800, rowH = 50, top = 34, dx = 88, R = 18;
  const tIn = document.getElementById('pour-t'), nIn = document.getElementById('pour-n');
  let sel = 1;
  function draw() {
    const t = +tIn.value, n = +nIn.value;
    document.getElementById('pour-tv').textContent = t.toFixed(2);
    document.getElementById('pour-nv').textContent = n;
    sel = Math.min(sel, n - 1);
    const H = top + (n - 1) * rowH + 150;
    svg.attr('viewBox', `0 0 ${W} ${H}`).selectAll('*').remove();
    const share = [[1]], routes = [[1]];                      // row r has r+1 nodes
    for (let r = 0; r < n - 1; r++) {
      const s = new Array(r + 2).fill(0), c = new Array(r + 2).fill(0);
      share[r].forEach((v, j) => { s[j] += (1 - t) * v; s[j + 1] += t * v; c[j] += routes[r][j]; c[j + 1] += routes[r][j]; });
      share.push(s); routes.push(c);
    }
    const X = (r, j) => W / 2 + (j - r / 2) * dx, Y = r => top + r * rowH;
    const onPath = (r, j) => j <= sel && sel <= j + (n - 2 - r);     // edge ends at (r+1, j) and can still reach `sel`
    const edges = svg.append('g');
    for (let r = 0; r < n - 1; r++) for (let j = 0; j <= r; j++) [[j, C.blue], [j + 1, C.yellow]].forEach(([jj, col]) => {
      const hot = onPath(r, jj);
      edges.append('line').attr('x1', X(r, j)).attr('y1', Y(r)).attr('x2', X(r + 1, jj)).attr('y2', Y(r + 1))
        .attr('stroke', col).attr('stroke-width', hot ? 3.5 : 1.5).attr('opacity', hot ? 1 : .22);
    });
    const nodes = svg.append('g');
    share.forEach((row, r) => row.forEach((v, j) => {
      const g = nodes.append('g').attr('transform', `translate(${X(r, j)},${Y(r)})`);
      g.append('circle').attr('r', R).attr('fill', C.bg).attr('stroke', C.gray).attr('stroke-width', 1);
      g.append('circle').attr('r', R).attr('fill', C.green).attr('opacity', .12 + .78 * v);
      g.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em').attr('fill', '#fff').attr('font-size', 11)
        .text(v >= .9995 ? '1' : v.toFixed(2).replace(/^0/, ''));
    }));
    const last = n - 1, by = Y(last) + 108;
    share[last].forEach((v, i) => {
      const x = X(last, i), isSel = i === sel, h = v * 80;
      const hit = svg.append('g').style('cursor', 'pointer').on('click', () => { sel = i; draw(); });
      hit.append('rect').attr('x', x - dx / 2).attr('y', Y(last) - R - 2).attr('width', dx).attr('height', by - Y(last) + R + 22).attr('fill', 'transparent');
      hit.append('circle').attr('cx', x).attr('cy', Y(last)).attr('r', R + 4).attr('fill', 'none').attr('stroke', isSel ? C.red : 'none').attr('stroke-width', 3);
      hit.append('rect').attr('x', x - 18).attr('y', by - h).attr('width', 36).attr('height', Math.max(h, 1)).attr('fill', isSel ? C.red : C.green).attr('opacity', isSel ? 1 : .6);
      hit.append('text').attr('x', x).attr('y', by - h - 5).attr('text-anchor', 'middle').attr('fill', C.gray).attr('font-size', 11).text(v.toFixed(3));
      hit.append('text').attr('x', x).attr('y', by + 16).attr('text-anchor', 'middle').attr('fill', isSel ? C.red : C.gray).attr('font-size', 13)
        .text('P' + i);
    });
    svg.append('text').attr('x', 14).attr('y', 20).attr('fill', C.blue).attr('font-size', 12).text('← left: × (1 − t)');
    svg.append('text').attr('x', W - 14).attr('y', 20).attr('text-anchor', 'end').attr('fill', C.yellow).attr('font-size', 12).text('right: × t →');
    const each = (1 - t) ** (n - 1 - sel) * t ** sel;
    document.getElementById('pour-readout').textContent =
      `P${sel}: ${routes[last][sel]} route${routes[last][sel] > 1 ? 's' : ''} × ${each.toFixed(4)} per route = ${share[last][sel].toFixed(4)}`;
  }
  tIn.addEventListener('input', draw); nIn.addEventListener('input', draw);
  draw();
})();
