/* ---------- 28 · Parametric curve as a matrix product ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v28'), ms = d3.select('#m28'), W = 800, H = 340, M = 24;
  const base = n => d3.range(n).map(i => [60 + i * (680 / (n - 1)), 170 + 110 * Math.sin(i * 1.3 + 0.4)]);
  let P = [], lastN = 0, mode = 'pos';
  const eq = eqLab('e28', String.raw`\begin{aligned}
    \htmlClass{eq-C}{\mathbf C(t)}&=\sum_{i=0}^{n-1}\htmlClass{eq-P}{\mathbf P_i}\,\htmlClass{eq-N}{N_{i,p}(t)}\\[4pt]
    \htmlClass{eq-X}{\mathbf X}&=\htmlClass{eq-B}{\mathbf B}\,\htmlClass{eq-Pm}{\mathbf P},\qquad
    \mathbf B_{k,i}=N_{i,p}(t_k),\quad \mathbf X_k=\mathbf C(t_k)
  \end{aligned}`, () => draw());

  function draw() {
    const hl = eq.hl, n = +g('i28n').value, p = Math.min(+g('i28p').value, n - 1), t = +g('i28t').value;
    if (n !== lastN) { P = base(n); lastN = n; }
    g('o28t').textContent = t.toFixed(2); g('o28n').textContent = n; g('o28p').textContent = p;
    document.querySelectorAll('#md28 .chip').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    const order = mode === 'vel' ? 1 : 0, inner = d3.range(1, n - p).map(i => i / (n - p)), k = [...new Array(p + 1).fill(0), ...inner, ...new Array(p + 1).fill(1)];
    const tk = d3.range(M).map(i => i / (M - 1)), Bm = tk.map(s => d3.range(n).map(i => order ? bsD(i, p, Math.min(s, 1 - 1e-9), k, 1) : bspline(i, p, s, k)));
    const Xm = Bm.map(r => [0, 1].map(c => d3.sum(r, (b, i) => b * P[i][c])));
    const kc = Math.round(t * (M - 1)), curveT = d3.range(0, 1.0001, .005), cp = s => [0, 1].map(c => d3.sum(d3.range(n), i => P[i][c] * bspline(i, p, s, k)));
    svg.selectAll('*').remove();
    svg.append('path').attr('d', d3.line()(P)).attr('fill', 'none').attr('stroke', '#555').attr('stroke-dasharray', '4 4').attr('opacity', hl === 'Pm' ? 1 : .6);
    svg.append('path').attr('d', d3.line()(curveT.map(cp))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', hl === 'C' ? 7 : 3.5);
    const bt = d3.range(n).map(i => bspline(i, p, t, k)), here = cp(t);
    d3.range(n).filter(i => bt[i] > 1e-9).forEach(i => svg.append('line').attr('x1', here[0]).attr('y1', here[1]).attr('x2', P[i][0]).attr('y2', P[i][1]).attr('stroke', col7(i)).attr('stroke-width', 1 + 9 * bt[i]).attr('opacity', hl === 'N' ? .95 : .5));
    if (mode === 'vel') Xm.forEach((v, r) => { const q = cp(tk[r]), s = 0.045; svg.append('line').attr('x1', q[0]).attr('y1', q[1]).attr('x2', q[0] + v[0] * s).attr('y2', q[1] + v[1] * s).attr('stroke', '#fbbf24').attr('stroke-width', 2); });
    tk.forEach((s, r) => { const q = cp(s); svg.append('circle').attr('cx', q[0]).attr('cy', q[1]).attr('r', r === kc ? 7 : 3.5).attr('fill', r === kc ? '#fff' : hl === 'X' ? '#fbbf24' : '#9ca3af'); });
    svg.append('circle').attr('cx', here[0]).attr('cy', here[1]).attr('r', 6).attr('fill', 'none').attr('stroke', '#fff');
    svg.selectAll('.cp').data(d3.range(n)).join('circle').attr('cx', i => P[i][0]).attr('cy', i => P[i][1]).attr('r', hl === 'Pm' || hl === 'P' ? 12 : 9).attr('fill', i => col7(i)).attr('stroke', hl === 'Pm' || hl === 'P' ? '#fff' : '#1c1c1c').attr('stroke-width', 3).style('cursor', 'grab')
      .call(d3.drag().on('drag', (ev, i) => { P[i] = [Math.max(10, Math.min(W - 10, ev.x)), Math.max(10, Math.min(H - 10, ev.y))]; draw(); }));
    svg.selectAll('.cl').data(d3.range(n)).join('text').attr('x', i => P[i][0]).attr('y', i => P[i][1] + 4).attr('text-anchor', 'middle').attr('fill', '#111').attr('font-size', 11).attr('font-weight', 700).attr('pointer-events', 'none').text(i => i);

    // matrices
    ms.selectAll('*').remove();
    const rh = 14, oy = 40, bw = Math.min(46, 330 / n), xX = 20, xB = 210, xP = xB + n * bw + 60, bmax = d3.max(Bm.flat(), Math.abs) || 1;
    const heat = v => v === 0 ? '#202020' : order ? d3.interpolateRdBu(0.5 + 0.5 * v / bmax) : d3.interpolateBlues(Math.min(1, v * 1.1) * 0.9 + 0.05);
    const label = (x, y, s, h) => ms.append('text').attr('x', x).attr('y', y).attr('fill', h ? '#fbbf24' : '#9ca3af').attr('font-size', 13).attr('font-weight', h ? 700 : 400).text(s);
    label(xX, 24, mode === 'vel' ? "X′ (m × 2)" : 'X (m × 2)', hl === 'X'); label(xB, 24, mode === 'vel' ? "B′ (m × n)" : 'B (m × n)', hl === 'B'); label(xP, 24, 'P (n × 2)', hl === 'Pm');
    ms.append('text').attr('x', xX + 140).attr('y', oy + M * rh / 2).attr('fill', '#9ca3af').attr('font-size', 22).text('=');
    ms.append('text').attr('x', xB + n * bw + 22).attr('y', oy + M * rh / 2).attr('fill', '#9ca3af').attr('font-size', 22).text('×');
    tk.forEach((s, r) => {
      const hot = r === kc, op = hl && !(hl === 'N' && hot) && !['X', 'B', 'Pm'].includes(hl) ? .6 : 1;
      Xm[r].forEach((v, c) => { ms.append('rect').attr('x', xX + c * 64).attr('y', oy + r * rh).attr('width', 62).attr('height', rh - 1).attr('fill', hot ? '#3a3a3a' : '#242424').attr('stroke', hl === 'X' ? '#fbbf24' : 'none');
        ms.append('text').attr('x', xX + c * 64 + 58).attr('y', oy + r * rh + 11).attr('text-anchor', 'end').attr('fill', hot ? '#fff' : '#9ca3af').attr('font-size', 10).text(v.toFixed(1)); });
      Bm[r].forEach((v, i) => { ms.append('rect').attr('x', xB + i * bw).attr('y', oy + r * rh).attr('width', bw - 1).attr('height', rh - 1).attr('fill', heat(v)).attr('stroke', hl === 'B' ? '#fbbf24' : hot && hl === 'N' ? '#fbbf24' : 'none').attr('stroke-width', hot && hl === 'N' ? 1.5 : 1).attr('opacity', op);
        if (Math.abs(v) > 0.005) ms.append('text').attr('x', xB + i * bw + bw / 2).attr('y', oy + r * rh + 11).attr('text-anchor', 'middle').attr('fill', order ? '#111' : v > 0.55 ? '#fff' : '#111').attr('font-size', 8.5).text(v.toFixed(2).replace(/^0\./, '.')); });
    });
    ms.append('rect').attr('x', xX - 3).attr('y', oy + kc * rh - 1).attr('width', 134).attr('height', rh + 1).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1.5);
    ms.append('rect').attr('x', xB - 3).attr('y', oy + kc * rh - 1).attr('width', n * bw + 4).attr('height', rh + 1).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1.5);
    const ph = Math.min(rh * M / n, 26);
    d3.range(n).forEach(i => [0, 1].forEach(c => {
      const gx = xP + c * 70, gy = oy + i * ph, gg = ms.append('g').style('cursor', 'ns-resize');
      gg.append('rect').attr('x', gx).attr('y', gy).attr('width', 68).attr('height', ph - 2).attr('fill', col7(i)).attr('opacity', hl === 'Pm' ? .9 : .45).attr('stroke', hl === 'Pm' ? '#fbbf24' : 'none');
      gg.append('text').attr('x', gx + 34).attr('y', gy + ph / 2 + 3).attr('text-anchor', 'middle').attr('fill', '#fff').attr('font-size', 11).attr('font-weight', 700).text(P[i][c].toFixed(0));
      gg.call(d3.drag().on('drag', ev => { P[i][c] = Math.max(10, Math.min(c ? H - 10 : W - 10, P[i][c] - ev.dy * 1.5)); draw(); }));
    }));
    ms.append('text').attr('x', xP).attr('y', oy + n * ph + 16).attr('fill', '#9ca3af').attr('font-size', 11).text('drag a number up or down');
    ms.append('text').attr('x', xP).attr('y', oy + n * ph + 32).attr('fill', '#9ca3af').attr('font-size', 11).text('columns: x, y');

    const act = d3.range(n).filter(i => Math.abs(Bm[kc][i]) > 1e-9), parts = act.map(i => `<span style="color:${col7(i)}">${Bm[kc][i].toFixed(2)}·P<sub>${i}</sub></span>`).join(' + ');
    g('e28-sub').innerHTML = `row ${kc} of the matrices (t<sub>${kc}</sub> = ${tk[kc].toFixed(2)}, outlined): ${mode === 'vel' ? 'velocity' : 'point'} = ${parts} = <b>(${Xm[kc][0].toFixed(1)}, ${Xm[kc][1].toFixed(1)})</b>. ` +
      `B has ${M} × ${n} entries but only ${act.length} are non-zero in this row, because only ${act.length} bumps are alive at that moment.`;
    const CAP = {
      C: `<b>C(t)</b>: the curve, a point in the plane for each clock time t (the thick white line).`,
      P: `<b>P<sub>i</sub></b>: control point i, a pair (x, y). Each is also the weight on bump i, separately for x and for y.`,
      N: `<b>N<sub>i,p</sub>(t)</b>: how much control point i counts at time t. The lines from the curve point to the control points have thickness equal to those weights; the outlined row of B holds the same numbers.`,
      X: `<b>X</b>: the curve sampled at m = ${M} moments, one row per moment: the grey dots on the curve are the rows of X.`,
      B: `<b>B</b>: the table of bump values. Row k lists N<sub>0,p</sub>(t<sub>k</sub>) … N<sub>n−1,p</sub>(t<sub>k</sub>); most entries are zero because each bump is local.`,
      Pm: `<b>P</b>: the control points as a matrix, one row per point, columns x and y. Drag a number to move that coordinate.`
    };
    g('e28-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
  }
  document.querySelectorAll('#md28 .chip').forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; draw(); }));
  ['i28t', 'i28n', 'i28p'].forEach(id => g(id).addEventListener('input', draw));
  g('b28').onclick = () => { lastN = 0; draw(); };
  draw();
})();
