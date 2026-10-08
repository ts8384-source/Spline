/* ---------- 25 · Natural spline minimises bending energy ---------- */
(function () {
  const g = id => document.getElementById(id), sv = d3.select('#v25'), pv = d3.select('#p25'), cv = d3.select('#c25');
  const X = d3.scaleLinear([0, 1], [30, 380]), Y = d3.scaleLinear([-0.3, 1.3], [275, 15]);
  const P0 = [[.06, .3], [.24, .75], [.42, .4], [.6, .8], [.78, .35], [.94, .6]];
  let P = P0.map(p => p.slice());
  const eq = eqLab('e25', String.raw`\htmlClass{eq-E}{E[f]}=\htmlClass{eq-int}{\int_{x_0}^{x_k}}\big(\htmlClass{eq-f2}{f''}(x)\big)^2dx,\qquad
    f=\htmlClass{eq-S}{S}+\htmlClass{eq-eps}{\varepsilon}\,\htmlClass{eq-w}{w},\ \ w(x_i)=0
    \ \Longrightarrow\ E[S+\varepsilon w]=E[S]+\varepsilon^2E[w]\ \ge\ E[S]\ \ \text{because}\ \htmlClass{eq-cross}{\textstyle\int S''w''\,dx=0}`, () => draw());

  function draw() {
    const hl = eq.hl, xs = P.map(p => p[0]), ys = P.map(p => p[1]), n = xs.length - 1, eps = +g('i25e').value;
    g('o25e').textContent = eps.toFixed(2); g('l25e').classList.toggle('flash', hl === 'eps');
    const S = cubicSystem(xs, ys, 'natural'), grid = d3.range(xs[0], xs[n] + 1e-9, (xs[n] - xs[0]) / 800);
    const prod = (x, skip) => d3.range(n + 1).filter(j => !skip.includes(j)).reduce((a, j) => a * (x - xs[j]), 1);
    const w0 = x => prod(x, []), wmax = d3.max(grid, x => Math.abs(w0(x))) || 1, w = x => w0(x) / wmax;
    const w2 = x => { let s = 0; for (let a = 0; a <= n; a++) for (let b = 0; b <= n; b++) if (a !== b) s += prod(x, [a, b]); return s / wmax; };
    const dx = grid[1] - grid[0], integ = f => d3.sum(grid, x => f(x) * dx);
    const E0 = integ(x => S.ev(x, 2) ** 2), Ew = integ(x => w2(x) ** 2), cross = integ(x => S.ev(x, 2) * w2(x));
    const Eof = e => integ(x => (S.ev(x, 2) + e * w2(x)) ** 2), Ecur = Eof(eps);

    sv.selectAll('*').remove();
    sv.append('path').attr('d', `M30,${Y(0)}H380`).attr('stroke', '#444').attr('fill', 'none');
    sv.append('text').attr('x', 34).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text('curves through the same points');
    if (hl === 'w' || hl === 'eps') sv.append('path').attr('d', d3.line()(grid.map(x => [X(x), Y(eps * w(x))]))).attr('fill', 'none').attr('stroke', '#22c55e').attr('stroke-width', 3).attr('stroke-dasharray', '5 3');
    sv.append('path').attr('d', d3.line()(grid.map(x => [X(x), Y(S.ev(x))]))).attr('fill', 'none').attr('stroke', '#3b82f6').attr('stroke-width', hl === 'S' ? 7 : 4);
    sv.append('path').attr('d', d3.line()(grid.map(x => [X(x), Y(S.ev(x) + eps * w(x))]))).attr('fill', 'none').attr('stroke', '#f97316').attr('stroke-width', 3.5);
    sv.selectAll('.dp').data(d3.range(n + 1)).join('circle').attr('cx', i => X(xs[i])).attr('cy', i => Y(ys[i])).attr('r', 7).attr('fill', '#fff').attr('stroke', '#1c1c1c').attr('stroke-width', 2).style('cursor', 'ns-resize')
      .call(d3.drag().on('drag', (ev, i) => { P[i] = [xs[i], Math.max(-0.25, Math.min(1.25, Y.invert(ev.y)))]; draw(); }));
    sv.append('text').attr('x', 34).attr('y', 292).attr('fill', '#3b82f6').attr('font-size', 12).text('natural spline S');
    sv.append('text').attr('x', 380).attr('y', 292).attr('text-anchor', 'end').attr('fill', '#f97316').attr('font-size', 12).text('S + ε w');

    // energy as a function of epsilon
    const es = d3.range(-0.5, 0.5001, 0.02), ev = es.map(Eof), PX = d3.scaleLinear([-0.5, 0.5], [40, 380]), PY = d3.scaleLinear([0, d3.max(ev) * 1.05], [265, 20]);
    pv.selectAll('*').remove();
    pv.append('text').attr('x', 44).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text('energy E against ε');
    pv.append('path').attr('d', 'M40,265H380M' + PX(0) + ',20V265').attr('stroke', '#555').attr('fill', 'none');
    pv.append('path').attr('d', d3.line()(es.map((e, i) => [PX(e), PY(ev[i])]))).attr('fill', 'none').attr('stroke', '#f97316').attr('stroke-width', hl === 'E' ? 6 : 3.5);
    pv.append('circle').attr('cx', PX(0)).attr('cy', PY(E0)).attr('r', 6).attr('fill', '#3b82f6');
    pv.append('text').attr('x', PX(0) + 8).attr('y', PY(E0) - 8).attr('fill', '#3b82f6').attr('font-size', 11).text('S itself: the minimum');
    pv.append('circle').attr('cx', PX(eps)).attr('cy', PY(Ecur)).attr('r', 7).attr('fill', '#fff');
    pv.append('text').attr('x', 380).attr('y', 285).attr('text-anchor', 'end').attr('fill', '#9ca3af').attr('font-size', 11).text('ε →');

    // squared curvature
    const CX = d3.scaleLinear([xs[0], xs[n]], [50, 780]), cmax = d3.max(grid, x => Math.max(S.ev(x, 2) ** 2, (S.ev(x, 2) + eps * w2(x)) ** 2)) || 1, CY = d3.scaleLinear([0, cmax * 1.05], [190, 20]);
    cv.selectAll('*').remove();
    cv.append('text').attr('x', 54).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text('(f″)² : the area under each curve is the energy' + (hl === 'f2' || hl === 'int' ? '   ← this' : ''));
    const area = (f, color, op) => cv.append('path').attr('d', d3.area().x(d => CX(d)).y0(CY(0)).y1(d => CY(f(d)))(grid)).attr('fill', color).attr('opacity', op);
    area(x => S.ev(x, 2) ** 2, '#3b82f6', hl === 'int' ? .55 : .3);
    area(x => (S.ev(x, 2) + eps * w2(x)) ** 2, '#f97316', hl === 'int' ? .5 : .25);
    cv.append('path').attr('d', d3.line()(grid.map(x => [CX(x), CY(S.ev(x, 2) ** 2)]))).attr('fill', 'none').attr('stroke', '#3b82f6').attr('stroke-width', hl === 'f2' ? 5 : 2.5);
    cv.append('path').attr('d', d3.line()(grid.map(x => [CX(x), CY((S.ev(x, 2) + eps * w2(x)) ** 2)]))).attr('fill', 'none').attr('stroke', '#f97316').attr('stroke-width', hl === 'f2' ? 5 : 2.5);
    xs.forEach(x => cv.append('line').attr('x1', CX(x)).attr('x2', CX(x)).attr('y1', 20).attr('y2', 190).attr('stroke', '#444'));

    g('e25-sub').innerHTML = `E[S] = <span style="color:#3b82f6">${E0.toFixed(3)}</span> · E[S + εw] at ε = ${eps.toFixed(2)} is <span style="color:#f97316"><b>${Ecur.toFixed(3)}</b></span> · ` +
      `E[S] + ε²E[w] = ${E0.toFixed(3)} + ${(eps * eps).toFixed(3)} × ${Ew.toFixed(3)} = ${(E0 + eps * eps * Ew).toFixed(3)} · cross term ∫S″w″ = <b>${Math.abs(cross) < 5e-4 ? '0.000' : cross.toFixed(4)}</b> ` +
      (Ecur >= E0 - 1e-6 ? '<span class="yes">✓ energy never goes below E[S]</span>' : '<span class="no">✗</span>');
    const CAP = {
      E: `<b>E[f]</b>: the bending energy of f. The orange curve on the right shows it for S + εw as ε changes: a parabola whose lowest point is at ε = 0, which is S itself.`,
      int: `<b>∫</b>: the energy is the area under the squared curvature (shaded in the lower panel).`,
      f2: `<b>f″</b>: the second derivative, how sharply the curve bends. The lower panel plots (f″)². Natural-spline S has f″ piecewise straight, with f″ = 0 at the ends.`,
      S: `<b>S</b>: the natural cubic spline through the data (blue). Drag the white points to change the data.`,
      eps: `<b>ε</b>: how much of the wiggle w to add. Slide it and watch the orange energy rise whichever way you go.`,
      w: `<b>w</b>: a smooth wiggle that is zero at every data point (the green dashed shape), so S + εw still passes through every point.`,
      cross: `<b>∫S″w″ = 0</b>: the cross term vanishes. Integrating by parts, it reduces to terms that contain w at the data points (zero) and S″ at the ends (zero for the natural spline). That is why the energy has no linear term in ε, only ε², and the minimum sits exactly at ε = 0.`
    };
    g('e25-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
  }
  g('i25e').addEventListener('input', draw); g('b25').onclick = () => { P = P0.map(p => p.slice()); draw(); };
  draw();
})();
