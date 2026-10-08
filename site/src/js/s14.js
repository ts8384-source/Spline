/* ---------- 14 · Knots as seams of a curve ---------- */
(function () {
  const p = 3, W = 800, H = 430, EPS = 1e-9;
  const plane = d3.select('#ks'), strip = d3.select('#kst'), mIn = document.getElementById('ks-m');
  const PAL = ['#3b82f6', '#f97316', '#22c55e', '#e11d48', '#a855f7', '#06b6d4', '#eab308'];
  const INNER0 = [1, 2, 3, 4, 5].map(i => i / 6), BASE = [[50, 350], [90, 120], [190, 70], [290, 300], [400, 330], [510, 110], [610, 60], [700, 200], [760, 340]];
  let inner = INNER0.slice(), mult = [1, 1, 1, 1, 1], sel = 2, P = BASE.map(q => q.slice());
  const X = d3.scaleLinear([0, 1], [50, 780]), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const len = a => Math.hypot(a[0], a[1]), sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, s) => [a[0] * s, a[1] * s];
  const knotsOf = () => [...new Array(p + 1).fill(0), ...inner.flatMap((k, j) => new Array(mult[j]).fill(k)), ...new Array(p + 1).fill(1)];
  function dN(i, pp, t, k, r) {                                       // r-th derivative of the B-spline basis function
    if (r === 0) return bspline(i, pp, t, k);
    if (pp === 0) return 0;
    const d1 = k[i + pp] - k[i], d2 = k[i + pp + 1] - k[i + 1];
    return pp * ((d1 ? dN(i, pp - 1, t, k, r - 1) / d1 : 0) - (d2 ? dN(i + 1, pp - 1, t, k, r - 1) / d2 : 0));
  }
  const ev = (t, r, k) => [0, 1].map(c => d3.sum(P, (q, i) => q[c] * dN(i, p, t, k, r)));
  const resample = (Q, n) => Q.length === n ? Q : d3.range(n).map(i => {
    const u = i / (n - 1) * (Q.length - 1), a = Math.floor(u), b = Math.min(Q.length - 1, a + 1), f = u - a;
    return [Q[a][0] * (1 - f) + Q[b][0] * f, Q[a][1] * (1 - f) + Q[b][1] * f];
  });
  const arrow = (g, from, v, col, w, op) => {
    if (len(v) < 4) return;
    const to = add(from, v), a = Math.atan2(v[1], v[0]), h = w * 2 + 5;
    g.append('line').attr('x1', from[0]).attr('y1', from[1]).attr('x2', to[0]).attr('y2', to[1]).attr('stroke', col).attr('stroke-width', w).attr('opacity', op);
    g.append('path').attr('d', `M${to[0]},${to[1]}L${to[0] - h * Math.cos(a - .45)},${to[1] - h * Math.sin(a - .45)}L${to[0] - h * Math.cos(a + .45)},${to[1] - h * Math.sin(a + .45)}Z`).attr('fill', col).attr('opacity', op);
  };
  const layer = plane.append('g'), handles = plane.append('g'), sLayer = strip.append('g'), sHandles = strip.append('g');

  function draw() {
    const k = knotsOf(), n = k.length - p - 1; if (P.length !== n) P = resample(P, n);
    mIn.value = mult[sel]; document.getElementById('ks-mv').textContent = mult[sel];
    const bounds = [0, ...inner, 1], spanOf = t => { let s = 0; while (s < bounds.length - 2 && t >= bounds[s + 1]) s++; return s; };
    const ts = d3.range(401).map(i => i / 400), pts = ts.map(t => ev(t, 0, k));
    layer.selectAll('*').remove();
    layer.append('path').attr('d', d3.line()(P)).attr('fill', 'none').attr('stroke', '#555').attr('stroke-dasharray', '4 4');
    for (let j = 0; j < ts.length - 1; j++) {
      if (len(sub(pts[j], pts[j + 1])) > 60) continue;                                      // a real jump: do not join the two sides
      layer.append('line').attr('x1', pts[j][0]).attr('y1', pts[j][1]).attr('x2', pts[j + 1][0]).attr('y2', pts[j + 1][1])
        .attr('stroke', PAL[spanOf((ts[j] + ts[j + 1]) / 2) % PAL.length]).attr('stroke-width', 5).attr('stroke-linecap', 'round');
    }
    inner.forEach((kk, j) => {
      const L = ev(kk - EPS * 10, 0, k), R = ev(kk + EPS * 10, 0, k), on = j === sel;
      [[L, 0], [R, 1]].forEach(([q, side]) => { if (side && len(sub(L, R)) < 0.5) return;
        layer.append('circle').attr('cx', q[0]).attr('cy', q[1]).attr('r', on ? 9 : 6.5).attr('fill', on ? C.yellow : '#fff').attr('stroke', C.bg).attr('stroke-width', 2); });
    });
    const ks = inner[sel], e = EPS * 10;
    const vL = ev(ks - e, 1, k), vR = ev(ks + e, 1, k), aL = ev(ks - e, 2, k), aR = ev(ks + e, 2, k), pL = ev(ks - e, 0, k), pR = ev(ks + e, 0, k);
    const inside = d3.range(1, 100).map(i => i / 100), sv = 55 / (d3.median(inside, t => len(ev(t, 1, k))) || 1), sa = 55 / (d3.median(inside, t => len(ev(t, 2, k))) || 1);
    arrow(layer, pL, mul(vL, sv), C.yellow, 7, .45); arrow(layer, pR, mul(vR, sv), C.yellow, 3, 1);
    arrow(layer, pL, mul(aL, sa), C.red, 7, .45); arrow(layer, pR, mul(aR, sa), C.red, 3, 1);

    handles.selectAll('circle').data(d3.range(n)).join('circle').attr('cx', i => P[i][0]).attr('cy', i => P[i][1]).attr('r', 7)
      .attr('fill', '#8b95a5').attr('stroke', C.bg).attr('stroke-width', 2).style('cursor', 'grab')
      .call(d3.drag().on('drag', (ev2, i) => { P[i] = [clamp(ev2.x, 10, W - 10), clamp(ev2.y, 10, H - 10)]; draw(); }));

    sLayer.selectAll('*').remove();
    bounds.slice(0, -1).forEach((b, s) => sLayer.append('rect').attr('x', X(b)).attr('y', 32).attr('width', Math.max(0, X(bounds[s + 1]) - X(b))).attr('height', 26)
      .attr('fill', PAL[s % PAL.length]).attr('opacity', .85).attr('rx', 3));
    sLayer.append('text').attr('x', 50).attr('y', 110).attr('fill', C.gray).attr('font-size', 11).text('t = 0');
    sLayer.append('text').attr('x', 780).attr('y', 110).attr('text-anchor', 'end').attr('fill', C.gray).attr('font-size', 11).text('t = 1');
    sLayer.append('text').attr('x', 415).attr('y', 20).attr('text-anchor', 'middle').attr('fill', C.gray).attr('font-size', 11).text('the clock, cut at the knots (drag a knot)');
    sHandles.selectAll('g').data(inner.map((_, j) => j)).join('g').each(function (j) {
      const g = d3.select(this), kk = inner[j]; g.selectAll('*').remove();
      d3.range(mult[j]).forEach(r => g.append('circle').attr('cx', X(kk)).attr('cy', 82).attr('r', 11 - r * 2.2).attr('fill', 'none').attr('stroke', C.yellow).attr('stroke-width', 2));
      g.append('circle').attr('cx', X(kk)).attr('cy', 82).attr('r', 4.5).attr('fill', j === sel ? C.yellow : '#b0861c');
    }).style('cursor', 'ew-resize').call(d3.drag()
      .on('start', (ev2, j) => { sel = j; draw(); })
      .on('drag', (ev2, j) => { const lo = (j ? inner[j - 1] : 0) + 0.02, hi = (j < inner.length - 1 ? inner[j + 1] : 1) - 0.02; inner[j] = clamp(X.invert(ev2.x), lo, hi); draw(); }));

    const m = mult[sel], cont = p - m, dv = len(sub(vL, vR)), da = len(sub(aL, aR)), dp = len(sub(pL, pR));
    document.getElementById('ks-read').innerHTML =
      `knot vector [${k.map(v => +v.toFixed(2)).join(', ')}] · ${n} control points · ${bounds.length - 1} pieces<br>` +
      `selected seam at t = ${ks.toFixed(2)}, ${m} cop${m === 1 ? 'y' : 'ies'}: ${cont >= 0 ? `continuity <b>C${['⁰', '¹', '²'][cont]}</b>` : '<b>the curve jumps</b>'} · ` +
      `position gap ${dp.toFixed(0)} · velocity gap ${dv.toFixed(0)} · acceleration gap ${da.toFixed(0)}`;
  }
  mIn.addEventListener('input', () => { mult[sel] = +mIn.value; draw(); });
  document.getElementById('ks-reset').onclick = () => { inner = INNER0.slice(); mult = [1, 1, 1, 1, 1]; sel = 2; P = BASE.map(q => q.slice()); draw(); };
  draw();
})();
