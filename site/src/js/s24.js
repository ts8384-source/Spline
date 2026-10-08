/* ---------- 24 · Interpolating cubic splines ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v24'), dsv = d3.select('#d24'), msv = d3.select('#m24'), bsv = d3.select('#bb24');
  const X = d3.scaleLinear([0, 1], [50, 780]), Y = d3.scaleLinear([-0.3, 1.3], [275, 15]);
  const P0 = [[.05, .3], [.18, .75], [.32, .45], [.5, .8], [.66, .35], [.8, .6], [.95, .5]];
  let P = P0.map(p => p.slice()), type = 'natural';
  const eq = eqLab('e24', String.raw`\begin{aligned}
    P_{\htmlClass{eq-i}{i}}(x) &= \htmlClass{eq-a}{a_i}+\htmlClass{eq-b}{b_i}(x-x_i)+\htmlClass{eq-c}{c_i}(x-x_i)^2+\htmlClass{eq-d}{d_i}(x-x_i)^3\\[2pt]
    &\htmlClass{eq-I}{P_i(x_i)=y_i,\ \ P_i(x_{i+1})=y_{i+1}}\\[2pt]
    &\htmlClass{eq-C1}{P_i'(x_{i+1})=P_{i+1}'(x_{i+1})}\\[2pt]
    &\htmlClass{eq-C2}{P_i''(x_{i+1})=P_{i+1}''(x_{i+1})}\\[2pt]
    &\htmlClass{eq-bc}{\text{two boundary conditions (natural, clamped or not-a-knot)}}\\[2pt]
    &\htmlClass{eq-A}{A}\,\htmlClass{eq-M}{\mathbf M}=\htmlClass{eq-r}{\mathbf r}
  \end{aligned}`, () => draw());

  function draw() {
    const hl = eq.hl, xs = P.map(p => p[0]), ys = P.map(p => p[1]), s0 = +g('i24s0').value, sn = +g('i24sn').value, xc = +g('i24x').value;
    g('o24x').textContent = xc.toFixed(2); g('o24s0').textContent = s0.toFixed(2); g('o24sn').textContent = sn.toFixed(2);
    document.querySelectorAll('#bc24 .chip').forEach(b => b.classList.toggle('on', b.dataset.t === type));
    g('l24s0').style.display = g('l24sn').style.display = type === 'clamped' ? '' : 'none';
    g('l24x').classList.toggle('flash', hl === 'i');
    const S = cubicSystem(xs, ys, type, s0, sn), n = S.n, i0 = S.piece(xc), x0 = xs[i0], u = xc - x0;
    const grid = d3.range(xs[0], xs[n] + 1e-9, (xs[n] - xs[0]) / 300);
    svg.selectAll('*').remove();
    svg.append('path').attr('d', `M50,${Y(0)}H780`).attr('stroke', '#444').attr('fill', 'none');
    if (hl === 'i' || hl === 'a' || hl === 'b' || hl === 'c' || hl === 'd') svg.append('rect').attr('x', X(xs[i0])).attr('y', 15).attr('width', X(xs[i0 + 1]) - X(xs[i0])).attr('height', 260).attr('fill', col7(i0)).attr('opacity', .16);
    d3.range(n).forEach(i => svg.append('path').attr('d', d3.line()(d3.range(0, 1.0001, .04).map(q => { const x = xs[i] + q * S.h[i]; return [X(x), Y(S.ev(x))]; })))
      .attr('fill', 'none').attr('stroke', col7(i)).attr('stroke-width', i === i0 && hl === 'i' ? 7 : 4));
    // conditions overlays
    if (hl === 'C1') d3.range(1, n).forEach(i => { const s = S.b[i], dx = .05; svg.append('line').attr('x1', X(xs[i] - dx)).attr('y1', Y(ys[i] - dx * s)).attr('x2', X(xs[i] + dx)).attr('y2', Y(ys[i] + dx * s)).attr('stroke', '#fbbf24').attr('stroke-width', 4); });
    if (hl === 'C2') d3.range(1, n).forEach(i => { const m = S.M[i], k = Math.min(60, Math.abs(m) * 12); svg.append('line').attr('x1', X(xs[i])).attr('x2', X(xs[i])).attr('y1', Y(ys[i])).attr('y2', Y(ys[i]) - Math.sign(m) * k).attr('stroke', '#ef4444').attr('stroke-width', 4); });
    if (hl === 'bc') [0, n].forEach(i => svg.append('circle').attr('cx', X(xs[i])).attr('cy', Y(ys[i])).attr('r', 18).attr('fill', 'none').attr('stroke', '#fbbf24').attr('stroke-width', 3));
    if (hl === 'M') d3.range(n + 1).forEach(i => svg.append('text').attr('x', X(xs[i])).attr('y', Y(ys[i]) - 16).attr('text-anchor', 'middle').attr('fill', '#ef4444').attr('font-size', 12).attr('font-weight', 700).text('M' + i + '=' + S.M[i].toFixed(1)));
    svg.append('line').attr('x1', X(xc)).attr('x2', X(xc)).attr('y1', 15).attr('y2', 275).attr('stroke', '#fff').attr('opacity', .5).attr('stroke-dasharray', '4 4');
    svg.selectAll('.dp').data(d3.range(n + 1)).join('circle').attr('cx', i => X(xs[i])).attr('cy', i => Y(ys[i])).attr('r', hl === 'I' ? 11 : 8).attr('fill', '#fff').attr('stroke', hl === 'I' ? '#fbbf24' : '#1c1c1c').attr('stroke-width', hl === 'I' ? 4 : 2).style('cursor', 'grab')
      .call(d3.drag().on('drag', (ev, i) => { const lo = (i ? P[i - 1][0] : 0) + 0.04, hi = (i < n ? P[i + 1][0] : 1) - 0.04; P[i] = [Math.max(lo, Math.min(hi, X.invert(ev.x))), Math.max(-0.25, Math.min(1.25, Y.invert(ev.y)))]; draw(); }));
    svg.selectAll('.dl').data(d3.range(n + 1)).join('text').attr('x', i => X(xs[i])).attr('y', 298).attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', 11).text(i => 'x' + i);

    // the four terms of the active cubic
    const hh = S.h[i0], us = d3.range(0, 1.0001, .05).map(q => q * hh), T = [us.map(() => S.a[i0]), us.map(v => S.b[i0] * v), us.map(v => S.c[i0] * v * v), us.map(v => S.d[i0] * v ** 3)];
    const tot = us.map((v, q) => d3.sum(T, t => t[q])), all = T.flat().concat(tot), DX = d3.scaleLinear([0, hh], [60, 620]), DY = d3.scaleLinear([d3.min(all) - .1, d3.max(all) + .1], [200, 20]);
    dsv.selectAll('*').remove();
    const names = ['a', 'b', 'c', 'd'], tcol = ['#9ca3af', '#fbbf24', '#22c55e', '#a855f7'];
    T.forEach((t, k) => dsv.append('path').attr('d', d3.line()(us.map((v, q) => [DX(v), DY(t[q])]))).attr('fill', 'none').attr('stroke', tcol[k]).attr('stroke-width', hl === names[k] ? 7 : 2.5).attr('opacity', hl && hl !== names[k] && 'abcd'.includes(hl) ? .3 : 1));
    dsv.append('path').attr('d', d3.line()(us.map((v, q) => [DX(v), DY(tot[q])]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3.5).attr('opacity', hl && 'abcd'.includes(hl) ? .6 : 1);
    dsv.append('line').attr('x1', 60).attr('x2', 620).attr('y1', DY(0)).attr('y2', DY(0)).attr('stroke', '#555').attr('stroke-dasharray', '3 4');
    dsv.append('text').attr('x', 60).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text(`interval i = ${i0}, plotted against x − x_i`);
    names.forEach((nm, k) => dsv.append('text').attr('x', 640).attr('y', 40 + k * 22).attr('text-anchor', 'start').attr('fill', tcol[k]).attr('font-size', 12).text(['a_i (constant)', 'b_i(x−x_i)', 'c_i(x−x_i)²', 'd_i(x−x_i)³'][k]));

    // the same curve written as weighted bumps (clamped cubic B-splines on the data x-values as knots)
    {
      const kk = [xs[0], xs[0], xs[0], xs[0], ...xs.slice(1, n), xs[n], xs[n], xs[n], xs[n]], nb = kk.length - 4;
      const xg = d3.range(241).map(q => q === 240 ? xs[n] : xs[0] + q / 240 * (xs[n] - xs[0])), Bm = xg.map(x => d3.range(nb).map(i => bspline(i, 3, x, kk)));
      const AtA = d3.range(nb).map(r => d3.range(nb).map(q => d3.sum(Bm, row => row[r] * row[q]))), Atb = d3.range(nb).map(r => d3.sum(Bm, (row, k) => row[r] * S.ev(xg[k]))), cw = solveLinear(AtA, Atb);
      const fit = Bm.map(row => d3.sum(row, (b, i) => b * cw[i])), err = d3.max(xg, (x, k) => Math.abs(fit[k] - S.ev(x)));
      const BX = d3.scaleLinear([xs[0], xs[n]], [50, 780]), lo = Math.min(d3.min(cw), d3.min(fit), 0) - .1, hi = Math.max(d3.max(cw), d3.max(fit)) + .1, BY = d3.scaleLinear([lo, hi], [215, 20]);
      const grev = cw.map((_, i) => (kk[i + 1] + kk[i + 2] + kk[i + 3]) / 3);
      bsv.selectAll('*').remove();
      bsv.append('path').attr('d', `M50,${BY(0)}H780`).attr('stroke', '#444').attr('fill', 'none');
      d3.range(nb).forEach(i => { const vals = xg.map((x, k) => [BX(x), BY(Bm[k][i] * cw[i])]);
        bsv.append('path').attr('d', d3.area().x(d => d[0]).y0(BY(0)).y1(d => d[1])(vals)).attr('fill', col7(i)).attr('opacity', .22);
        bsv.append('path').attr('d', d3.line()(vals)).attr('fill', 'none').attr('stroke', col7(i)).attr('stroke-width', 1.6).attr('opacity', .8); });
      bsv.append('path').attr('d', d3.line()(xg.map((x, k) => [BX(x), BY(fit[k])]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3.5);
      bsv.selectAll('.bw').data(d3.range(nb)).join('circle').attr('cx', i => BX(grev[i])).attr('cy', i => BY(cw[i])).attr('r', 9).attr('fill', i => col7(i)).attr('stroke', '#1c1c1c').attr('stroke-width', 2);
      bsv.selectAll('.bl').data(d3.range(nb)).join('text').attr('x', i => BX(grev[i])).attr('y', i => BY(cw[i]) + 4).attr('text-anchor', 'middle').attr('fill', '#111').attr('font-size', 11).attr('font-weight', 700).text(i => i);
      bsv.append('text').attr('x', 54).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text('the SAME curve as one sum of weighted bumps (white = the sum; numbered dots = the weights)');
      g('b24-note').innerHTML = `One spline, two descriptions. Above: <b>${nb}</b> weights on ${nb} bumps (= k + 3, with k = ${n}); the sum differs from the curve at the top by at most <b>${err.toExponential(0)}</b>. Pieces form: ${n} cubics × 4 = ${4 * n} coefficients tied by ${4 * n - 2} + 2 conditions. Bump form: just ${nb} numbers, because each bump is already smooth, so the smoothness conditions are built in. Same function, fewer numbers to keep track of.`;
    }
    // the linear system
    msv.selectAll('*').remove();
    const N = n + 1, cs = 52, rs = 28, ox = 50, oy = 40, amax = d3.max(S.A.flat(), Math.abs), heat = v => v === 0 ? '#202020' : d3.interpolateRdBu(0.5 + 0.5 * (v / amax));
    msv.append('text').attr('x', ox).attr('y', 22).attr('fill', '#9ca3af').attr('font-size', 12).text('A');
    msv.append('text').attr('x', ox + N * cs + 40).attr('y', 22).attr('fill', '#9ca3af').attr('font-size', 12).text('M (solved)');
    msv.append('text').attr('x', ox + N * cs + 130).attr('y', 22).attr('fill', '#9ca3af').attr('font-size', 12).text('r');
    S.A.forEach((row, i) => {
      const boundary = i === 0 || i === n, hot = (hl === 'A') || (hl === 'bc' && boundary) || ((hl === 'C1' || hl === 'C2' || hl === 'I') && !boundary);
      row.forEach((v, j) => { msv.append('rect').attr('x', ox + j * cs).attr('y', oy + i * rs).attr('width', cs - 2).attr('height', rs - 2).attr('fill', heat(v)).attr('opacity', hl && !hot ? .35 : 1);
        if (v !== 0) msv.append('text').attr('x', ox + j * cs + cs / 2).attr('y', oy + i * rs + rs / 2 + 3).attr('text-anchor', 'middle').attr('fill', '#111').attr('font-size', 10).text(v.toFixed(2)); });
      msv.append('rect').attr('x', ox + N * cs + 40).attr('y', oy + i * rs).attr('width', 70).attr('height', rs - 2).attr('fill', '#242424').attr('stroke', hl === 'M' ? '#fbbf24' : '#555').attr('stroke-width', hl === 'M' ? 3 : 1);
      msv.append('text').attr('x', ox + N * cs + 75).attr('y', oy + i * rs + rs / 2 + 3).attr('text-anchor', 'middle').attr('fill', '#ef4444').attr('font-size', 11).text(S.M[i].toFixed(3));
      msv.append('rect').attr('x', ox + N * cs + 130).attr('y', oy + i * rs).attr('width', 70).attr('height', rs - 2).attr('fill', '#242424').attr('stroke', hl === 'r' ? '#fbbf24' : '#555').attr('stroke-width', hl === 'r' ? 3 : 1);
      msv.append('text').attr('x', ox + N * cs + 165).attr('y', oy + i * rs + rs / 2 + 3).attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', 11).text(S.r[i].toFixed(3));
    });

    // verify the claims numerically
    const e = 1e-9, jumps = [0, 1, 2].map(o => d3.max(d3.range(1, n), i => Math.abs(S.ev(xs[i] - e, o) - S.ev(xs[i] + e, o)))), interp = d3.max(d3.range(n + 1), i => Math.abs(S.ev(xs[i] - (i === n ? e : 0)) - ys[i]));
    const bcOk = type === 'natural' ? Math.abs(S.ev(xs[0], 2)) + Math.abs(S.ev(xs[n] - e, 2)) : type === 'clamped' ? Math.abs(S.ev(xs[0], 1) - s0) + Math.abs(S.ev(xs[n] - e, 1) - sn) : Math.abs(S.d[0] - S.d[1]) + Math.abs(S.d[n - 2] - S.d[n - 1]);
    const f = (v, d = 2) => (v >= 0 ? '' : '−') + Math.abs(v).toFixed(d);
    g('e24-sub').innerHTML = `i = ${i0}: S<sub>${i0}</sub>(x) = <span style="color:#9ca3af">${f(S.a[i0], 3)}</span> + <span style="color:#fbbf24">${f(S.b[i0], 3)}</span>(x−x<sub>${i0}</sub>) + <span style="color:#22c55e">${f(S.c[i0], 3)}</span>(x−x<sub>${i0}</sub>)² + <span style="color:#a855f7">${f(S.d[i0], 3)}</span>(x−x<sub>${i0}</sub>)³ = <b>${S.ev(xc).toFixed(3)}</b><br>` +
      `checks: passes through the points (max miss ${interp.toExponential(0)}) · jump in S, S′, S″ at knots: ${jumps.map(v => v.toExponential(0)).join(', ')} · boundary condition residual ${bcOk.toExponential(0)}`;
    const CAP = {
      i: `<b>i</b>: which interval x is in (here ${i0}, shaded). Move the cursor slider to change it.`,
      a: `<b>a<sub>i</sub> = y<sub>i</sub></b>: the constant term. It is just the height of the data point at the left end of the interval.`,
      b: `<b>b<sub>i</sub> = S′(x<sub>i</sub>)</b>: the slope at the left end. It tilts the piece.`,
      c: `<b>c<sub>i</sub> = S″(x<sub>i</sub>)/2</b>: half the second derivative at the left end. It bends the piece.`,
      d: `<b>d<sub>i</sub></b> = (M<sub>i+1</sub> − M<sub>i</sub>)/(6h<sub>i</sub>): how fast the bend changes across the interval. It is the only term that differs between neighbours' curvature.`,
      I: `<b>Interpolation</b>: each cubic passes through both of its end points: 2 conditions per interval, ${2 * n} in all (the ringed dots).`,
      C1: `<b>C¹</b>: neighbouring cubics have the same slope at the shared knot: ${n - 1} conditions (yellow tangents).`,
      C2: `<b>C²</b>: neighbouring cubics have the same second derivative at the knot: ${n - 1} conditions (red bars show S″).`,
      bc: `<b>Boundary</b>: ${2 * n} + ${n - 1} + ${n - 1} = ${4 * n - 2} conditions for ${4 * n} unknowns, so two more are needed (k = ${n} intervals, so 4k − (4k − 2) = 2). natural: S″ = 0 at both ends; clamped: the end slopes are given; not-a-knot: S‴ continuous at x₁ and x<sub>k−1</sub>.`,
      A: `<b>A</b>: the matrix of the system for the second derivatives. Each interior row ties a knot's M to its two neighbours; with unequal spacing h<sub>i</sub> the entries change.`,
      M: `<b>M</b>: the unknown second derivatives M<sub>i</sub> = S″(x<sub>i</sub>) at the knots. Once found, every coefficient follows.`,
      r: `<b>r</b>: the right-hand side, built from the data's divided differences (slopes between points).`
    };
    g('e24-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
  }
  document.querySelectorAll('#bc24 .chip').forEach(b => b.addEventListener('click', () => { type = b.dataset.t; draw(); }));
  ['i24x', 'i24s0', 'i24sn'].forEach(id => g(id).addEventListener('input', draw));
  g('b24').onclick = () => { P = P0.map(p => p.slice()); draw(); };
  draw();
})();
