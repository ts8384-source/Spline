/* ---------- 31 · Free control points: drag them, the curve follows, only locally ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v31'), W = 800, H = 340;
  const base = n => d3.range(n).map(i => [60 + i * (680 / (n - 1)), 170 + 100 * Math.sin(i * 1.3 + 0.4)]);
  let P = [], ghost = null, lastN = 0, sel = null;
  const eq = eqLab('e31', String.raw`\htmlClass{eq-S}{\mathbf S(t)}\;=\;\htmlClass{eq-sum}{\sum_{i=0}^{n-1}}\;\htmlClass{eq-c}{\mathbf c_i}\;\htmlClass{eq-B}{B_{i,p}(t)}`, () => draw());

  function draw() {
    const hl = eq.hl, n = +g('i31n').value, p = Math.min(+g('i31p').value, n - 1), t = +g('i31t').value;
    if (n !== lastN) { P = base(n); ghost = null; sel = null; lastN = n; }
    g('o31t').textContent = t.toFixed(2); g('o31n').textContent = n; g('o31p').textContent = p;
    g('l31t').classList.toggle('flash', hl === 'S'); g('l31p').classList.toggle('flash', hl === 'B'); g('l31n').classList.toggle('flash', hl === 'sum');
    const inner = d3.range(1, n - p).map(i => i / (n - p)), k = [...new Array(p + 1).fill(0), ...inner, ...new Array(p + 1).fill(1)];
    const cp = (s, Q = P) => [0, 1].map(c => d3.sum(d3.range(n), i => Q[i][c] * bspline(i, p, Math.min(s, 1 - 1e-9), k)));
    const ts = d3.range(0, 1.0001, .004), bt = d3.range(n).map(i => bspline(i, p, Math.min(t, 1 - 1e-9), k)), here = cp(t);

    svg.selectAll('*').remove();
    if (ghost && ghost.length === n) svg.append('path').attr('d', d3.line()(ts.map(s => cp(s, ghost)))).attr('fill', 'none').attr('stroke', '#9ca3af').attr('stroke-dasharray', '6 4').attr('stroke-width', 2.5).attr('opacity', .8);
    svg.append('path').attr('d', d3.line()(P)).attr('fill', 'none').attr('stroke', '#555').attr('stroke-dasharray', '4 4');
    svg.append('path').attr('d', d3.line()(ts.map(s => cp(s)))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', hl === 'S' ? 7 : 3.5);
    if (sel !== null) {                                                           // stretch of curve where bump `sel` is alive
      const lo = k[sel], hi = k[sel + p + 1], seg = ts.filter(s => s >= lo - 1e-9 && s <= hi + 1e-9);
      if (seg.length > 1) svg.append('path').attr('d', d3.line()(seg.map(s => cp(s)))).attr('fill', 'none').attr('stroke', col7(sel)).attr('stroke-width', 8).attr('stroke-linecap', 'round').attr('opacity', .85);
    }
    d3.range(n).filter(i => bt[i] > 1e-9).forEach(i => svg.append('line').attr('x1', here[0]).attr('y1', here[1]).attr('x2', P[i][0]).attr('y2', P[i][1]).attr('stroke', col7(i)).attr('stroke-width', 1 + 9 * bt[i]).attr('opacity', hl === 'B' ? .95 : .45));
    svg.append('circle').attr('cx', here[0]).attr('cy', here[1]).attr('r', hl === 'S' ? 10 : 6).attr('fill', '#fff').attr('stroke', '#1c1c1c');
    svg.selectAll('.cp').data(d3.range(n)).join('circle').attr('class', 'cp').attr('cx', i => P[i][0]).attr('cy', i => P[i][1]).attr('r', hl === 'c' ? 13 : 10).attr('fill', i => col7(i))
      .attr('stroke', i => i === sel || hl === 'c' ? '#fff' : '#1c1c1c').attr('stroke-width', 2.5).style('cursor', 'grab')
      .call(d3.drag().on('start', (ev, i) => { sel = i; ghost = P.map(q => q.slice()); draw(); })
        .on('drag', (ev, i) => { P[i] = [Math.max(10, Math.min(W - 10, ev.x)), Math.max(10, Math.min(H - 10, ev.y))]; draw(); }));
    svg.selectAll('.cl').data(d3.range(n)).join('text').attr('class', 'cl').attr('x', i => P[i][0]).attr('y', i => P[i][1] + 4).attr('text-anchor', 'middle').attr('fill', '#111').attr('font-size', 11).attr('font-weight', 700).attr('pointer-events', 'none').text(i => i);
    if (hl === 'B') d3.range(n).filter(i => bt[i] > 1e-9).forEach(i => svg.append('text').attr('x', P[i][0] + 14).attr('y', P[i][1] - 12).attr('fill', col7(i)).attr('font-size', 12).attr('font-weight', 700).text(`B${i}=${bt[i].toFixed(2)}`));
    if (hl === 'c') d3.range(n).forEach(i => svg.append('text').attr('x', P[i][0] + 14).attr('y', P[i][1] - 12).attr('fill', col7(i)).attr('font-size', 11).text(`(${P[i][0].toFixed(0)}, ${P[i][1].toFixed(0)})`));

    const CAP = {
      S: `<b>S(t)</b>: the curve, a point in the plane for each clock time t. The white dot is S(${t.toFixed(2)}).`,
      sum: `<b>Σ</b>: add up all ${n} terms. At this t only ${bt.filter(b => b > 1e-9).length} are non-zero.`,
      c: `<b>c<sub>i</sub></b>: the control points, the part you are free to move. Each is just two numbers (x, y). Drag the dots.`,
      B: `<b>B<sub>i,p</sub>(t)</b>: how much point i counts at this t. You cannot drag these; they only depend on n, p and t. The lines from the white dot are as thick as these weights.`
    };
    g('e31-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
    const act = d3.range(n).filter(i => bt[i] > 1e-9);
    g('e31-sub').innerHTML = `S(${t.toFixed(2)}) = ` + act.map(i => `<span style="color:${col7(i)}">${bt[i].toFixed(2)}·(${P[i][0].toFixed(0)}, ${P[i][1].toFixed(0)})</span>`).join(' + ') + ` = <b>(${here[0].toFixed(1)}, ${here[1].toFixed(1)})</b>`;
    if (sel !== null && ghost && ghost.length === n) {
      const lo = k[sel], hi = k[sel + p + 1];
      let inMax = 0, outMax = 0;
      ts.forEach(s => { const a = cp(s), b = cp(s, ghost), d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (s > lo + 1e-9 && s < hi - 1e-9) inMax = Math.max(inMax, d); else outMax = Math.max(outMax, d); });
      g('e31-move').innerHTML = `Point <b>${sel}</b> counts only for t between ${lo.toFixed(2)} and ${hi.toFixed(2)} (its bump is zero outside). Largest curve shift inside that stretch: <b>${inMax.toFixed(1)}</b> px. Outside it: <b>${outMax.toFixed(1)}</b> px.`;
    } else g('e31-move').innerHTML = 'Grab a dot to see which part of the curve it controls.';
  }
  ['i31t', 'i31n', 'i31p'].forEach(id => g(id).addEventListener('input', draw));
  g('b31').onclick = () => { lastN = 0; draw(); };
  draw();
})();
