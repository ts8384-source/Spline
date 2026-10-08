/* ---------- 27 · Properties of the basis ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v27'), sa = d3.select('#s27a'), gv = d3.select('#g27');
  const INNER = [1, 2, 3, 4, 5].map(i => i / 6), X = d3.scaleLinear([0, 1], [50, 780]), Y = d3.scaleLinear([-0.05, 1.05], [265, 15]);
  const dflt = n => d3.range(n).map(i => 0.5 + 0.38 * Math.sin(1.9 * i + 0.6));
  let c = [];
  const ts = d3.range(401).map(i => i / 400);
  const eq = eqLab('e27', String.raw`\begin{aligned}
    &\htmlClass{eq-pos}{N_{i,p}(t)\ \ge\ 0}\\[2pt]
    &\htmlClass{eq-sum}{\textstyle\sum_i N_{i,p}(t)=1}\\[2pt]
    &\htmlClass{eq-loc}{N_{i,p}(t)=0\ \text{unless}\ t_i\le t<t_{i+p+1}}\\[2pt]
    &\htmlClass{eq-hull}{\min_{\text{active }j}c_j\ \le\ S(t)\ \le\ \max_{\text{active }j}c_j}\\[2pt]
    &\htmlClass{eq-end}{S(0)=c_0,\qquad S(1)=c_{n-1}}
  \end{aligned}`, () => draw());

  function draw() {
    const hl = eq.hl, p = +g('i27p').value, t = +g('i27t').value; g('o27t').textContent = t.toFixed(2); g('o27p').textContent = p; g('l27t').classList.toggle('flash', false);
    const k = [...new Array(p + 1).fill(0), ...INNER, ...new Array(p + 1).fill(1)], n = k.length - p - 1; if (c.length !== n) c = dflt(n);
    const B = ts.map(s => d3.range(n).map(i => bspline(i, p, s, k))), f = B.map(r => d3.sum(r, (b, i) => b * c[i]));
    const bt = d3.range(n).map(i => bspline(i, p, t, k)), S = d3.sum(bt, (b, i) => b * c[i]), act = d3.range(n).filter(i => bt[i] > 1e-9);
    const grev = c.map((_, i) => p === 0 ? (k[i] + k[i + 1]) / 2 : d3.sum(k.slice(i + 1, i + p + 1)) / p), jt = Math.round(t * 400);
    svg.selectAll('*').remove();
    svg.append('path').attr('d', `M50,${Y(0)}H780`).attr('stroke', '#9ca3af').attr('fill', 'none');
    d3.range(n).forEach(i => {
      const on = act.includes(i), vals = ts.map((s, j) => [X(s), Y(B[j][i])]);
      svg.append('path').attr('d', d3.area().x(d => d[0]).y0(Y(0)).y1(d => d[1])(vals)).attr('fill', col7(i)).attr('opacity', hl === 'pos' ? .4 : hl === 'loc' && on ? .45 : .12);
      svg.append('path').attr('d', d3.line()(vals)).attr('fill', 'none').attr('stroke', col7(i)).attr('stroke-width', (hl === 'loc' && on) ? 4 : 2).attr('opacity', hl === 'loc' && !on ? .25 : .9).attr('stroke-dasharray', i >= 7 ? '6 3' : null);
    });
    if (hl === 'hull') svg.append('rect').attr('x', X(t) - 12).attr('width', 24).attr('y', Y(d3.max(act, i => c[i]))).attr('height', Y(d3.min(act, i => c[i])) - Y(d3.max(act, i => c[i]))).attr('fill', '#fbbf24').attr('opacity', .3);
    svg.append('path').attr('d', d3.line()(ts.map((s, j) => [X(s), Y(f[j])]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3.5).attr('opacity', hl === 'pos' || hl === 'loc' ? .5 : 1);
    svg.append('line').attr('x1', X(t)).attr('x2', X(t)).attr('y1', 15).attr('y2', 265).attr('stroke', '#fff').attr('opacity', .6);
    svg.append('circle').attr('cx', X(t)).attr('cy', Y(S)).attr('r', 7).attr('fill', '#fff');
    svg.selectAll('.w').data(d3.range(n)).join('circle').attr('cx', i => X(grev[i])).attr('cy', i => Y(c[i])).attr('r', (i) => (hl === 'hull' && act.includes(i)) || (hl === 'end' && (i === 0 || i === n - 1)) ? 13 : 9)
      .attr('fill', i => col7(i)).attr('stroke', i => (hl === 'hull' && act.includes(i)) || (hl === 'end' && (i === 0 || i === n - 1)) ? '#fbbf24' : '#1c1c1c').attr('stroke-width', 3).style('cursor', 'ns-resize')
      .call(d3.drag().on('drag', (ev, i) => { c[i] = Math.max(0, Math.min(1, Y.invert(ev.y))); draw(); }));
    if (hl === 'end') [0, 1].forEach(s => svg.append('circle').attr('cx', X(s)).attr('cy', Y(s ? f[400] : f[0])).attr('r', 12).attr('fill', 'none').attr('stroke', '#fbbf24').attr('stroke-width', 3));

    // stacked bumps add up to one
    sa.selectAll('*').remove();
    sa.append('text').attr('x', 54).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text('the bumps stacked: always exactly 1' + (hl === 'sum' ? '   ← this' : ''));
    const SY = d3.scaleLinear([0, 1.05], [110, 22]);
    d3.range(n).forEach(i => sa.append('path').attr('d', d3.area().x((d, j) => X(ts[j])).y0((d, j) => SY(d3.sum(B[j].slice(0, i)))).y1((d, j) => SY(d3.sum(B[j].slice(0, i + 1))))(ts)).attr('fill', col7(i)).attr('opacity', hl === 'sum' ? .95 : .45));
    sa.append('line').attr('x1', 50).attr('x2', 780).attr('y1', SY(1)).attr('y2', SY(1)).attr('stroke', '#fff').attr('stroke-dasharray', '3 3');
    sa.append('line').attr('x1', X(t)).attr('x2', X(t)).attr('y1', 22).attr('y2', 110).attr('stroke', '#fff').attr('opacity', .8);
    // support bars
    gv.selectAll('*').remove();
    gv.append('text').attr('x', 54).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text('where each bump is non-zero: at most p + 1 = ' + (p + 1) + ' bars cross the cursor' + (hl === 'loc' ? '   ← this' : ''));
    const rh = Math.min(11, 120 / n);
    d3.range(n).forEach(i => {
      const lo = k[i], hi = k[i + p + 1], on = act.includes(i);
      gv.append('rect').attr('x', X(lo)).attr('y', 24 + i * (rh + 2)).attr('width', Math.max(2, X(hi) - X(lo))).attr('height', rh).attr('fill', col7(i)).attr('opacity', on ? 1 : hl === 'loc' ? .25 : .5).attr('rx', 2);
    });
    gv.append('line').attr('x1', X(t)).attr('x2', X(t)).attr('y1', 20).attr('y2', 145).attr('stroke', '#fff').attr('opacity', .8);

    const minB = d3.min(B.flat()), sums = B.map(r => d3.sum(r)), cmin = d3.min(act, i => c[i]), cmax = d3.max(act, i => c[i]);
    const row = (name, ok, text) => `<tr><td>${name}</td><td>${text}</td><td class="${ok ? 'yes' : 'no'}">${ok ? '✓' : '✗'}</td></tr>`;
    g('t27').innerHTML = `<table class="mt" style="text-align:left"><tr><th>property</th><th>measured for the current curve</th><th></th></tr>` +
      row('non-negative', minB >= -1e-12, `smallest value of any bump anywhere: ${Math.max(minB, 0).toFixed(3)}`) +
      row('add to 1', Math.abs(d3.min(sums) - 1) < 1e-9 && Math.abs(d3.max(sums) - 1) < 1e-9, `sum over all t ranges from ${d3.min(sums).toFixed(4)} to ${d3.max(sums).toFixed(4)}`) +
      row('local support', act.length <= p + 1, `at t = ${t.toFixed(2)} only ${act.length} bump${act.length === 1 ? '' : 's'} (${act.join(', ')}) are non-zero; limit p + 1 = ${p + 1}`) +
      row('convex hull', S >= cmin - 1e-9 && S <= cmax + 1e-9, `S(t) = ${S.toFixed(3)} lies between the active weights ${cmin.toFixed(3)} and ${cmax.toFixed(3)}`) +
      row('end points', Math.abs(f[0] - c[0]) < 1e-9 && Math.abs(f[400] - c[n - 1]) < 1e-9, `S(0) = ${f[0].toFixed(3)} = c₀ = ${c[0].toFixed(3)} and S(1) = ${f[400].toFixed(3)} = c<sub>${n - 1}</sub> = ${c[n - 1].toFixed(3)}`) + `</table>`;
    const CAP = {
      pos: `<b>N ≥ 0</b>: no bump ever goes negative, so a weight never pushes the curve the wrong way. (Every bump is filled above the axis.)`,
      sum: `<b>Σ N = 1</b>: stacked, the bumps fill up to exactly 1 at every t (middle panel). So S(t) is a <i>weighted average</i> of the weights.`,
      loc: `<b>local support</b>: bump i is non-zero only between t<sub>i</sub> and t<sub>i+p+1</sub> (p + 1 knot spans). At the cursor only ${act.length} bump${act.length === 1 ? ' counts' : 's count'} (bars in the lower panel).`,
      hull: `<b>convex hull</b>: an average of numbers cannot leave their range, so S(t) stays between the smallest and largest active weights (the shaded strip and ringed dots).`,
      end: `<b>end points</b>: with the end knots repeated p + 1 times, one bump equals 1 at each end, so the curve starts at c₀ and ends at c<sub>n−1</sub>.`
    };
    g('e27-cap').innerHTML = hl ? CAP[hl] : 'Hover a property, or tap it to keep it highlighted.';
  }
  ['i27t', 'i27p'].forEach(id => g(id).addEventListener('input', draw)); g('b27').onclick = () => { c = []; draw(); };
  draw();
})();
