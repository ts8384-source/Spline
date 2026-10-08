/* ---------- 29 · Why C^(n-1): the truncated power form ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v29'), sb = d3.select('#s29b'), sc = d3.select('#s29c');
  const KN = [1, 2, 3, 4].map(i => i / 5), X = d3.scaleLinear([0, 1], [50, 780]), A0 = [0.25, 0.9, -1.4, 1.2, -0.5], CB = [0.12, -0.2, 0.18, -0.15];
  const fact = m => d3.range(1, m + 1).reduce((a, b) => a * b, 1);
  let n = 3, c = [], sel = 1, ymax = 10, lastN = 0, collapsed = false;
  const eq = eqLab('e29', String.raw`\begin{aligned}
    S(t)&=\htmlClass{eq-poly}{\sum_{j=0}^{n}a_jt^j}\;+\;\htmlClass{eq-trunc}{\sum_{i=1}^{k-1}\htmlClass{eq-c}{c_i}\,(t-t_i)_+^{\,n}}\\[2pt]
    &\text{where}\ (t-t_i)_+^{\,n}=(t-t_i)^n\ \text{if}\ t\ge t_i,\ \text{and}\ 0\ \text{otherwise}\\[4pt]
    &\htmlClass{eq-D}{P_i(t)-P_{i-1}(t)=c_i\,(t-t_i)^n}\\[4pt]
    &\htmlClass{eq-C}{S\in C^{\,n-1}}\ \ \text{and}\ \ \htmlClass{eq-jump}{S^{(n)}\ \text{jumps by}\ n!\,c_i\ \text{at}\ t_i}\\[4pt]
    &\htmlClass{eq-Cn}{S\in C^{\,n}\ \Rightarrow\ \text{every}\ c_i=0\ \Rightarrow\ S\ \text{is one polynomial}}
  \end{aligned}`, () => draw());
  const a = () => A0.slice(0, n + 1);
  const tp = (t, ti, m) => t >= ti ? (m === 0 ? 1 : (t - ti) ** m) : 0;
  const S = (t, r = 0) => d3.sum(a(), (aj, j) => j >= r ? aj * fact(j) / fact(j - r) * t ** (j - r) : 0) + (r > n ? 0 : d3.sum(KN, (ti, i) => c[i] * fact(n) / fact(n - r) * tp(t, ti, n - r)));

  function draw() {
    const hl = eq.hl; n = +g('i29n').value; g('o29n').textContent = n;
    if (n !== lastN) { c = CB.map(v => v / 0.5 ** n); const lv = [fact(n) * A0[n]]; c.forEach(ci => lv.push(lv[lv.length - 1] + fact(n) * ci)); ymax = Math.max(4, 1.5 * d3.max(lv, Math.abs)); lastN = n; collapsed = false; }
    const chips = d3.select('#kn29'); chips.selectAll('*').remove();
    KN.forEach((k, i) => chips.append('button').attr('class', 'chip' + (i === sel ? ' on' : '')).text('knot t' + (i + 1) + ' = ' + k.toFixed(1)).on('click', () => { sel = i; draw(); }));
    const ts = d3.range(0, 1.00001, 0.004), vals = ts.map(t => S(t)), lo = d3.min(vals), hi = d3.max(vals), pad = (hi - lo) * .15 || .2, Y = d3.scaleLinear([lo - pad, hi + pad], [270, 20]);
    svg.selectAll('*').remove();
    KN.forEach((k, i) => svg.append('line').attr('x1', X(k)).attr('x2', X(k)).attr('y1', 20).attr('y2', 270).attr('stroke', i === sel ? '#fbbf24' : '#444').attr('stroke-width', i === sel ? 2.5 : 1));
    const dim = k => hl && hl !== k ? .3 : 1;
    svg.append('path').attr('d', d3.line()(ts.map(t => [X(t), Y(d3.sum(a(), (aj, j) => aj * t ** j))]))).attr('fill', 'none').attr('stroke', '#9ca3af').attr('stroke-width', hl === 'poly' ? 6 : 2).attr('stroke-dasharray', '6 4').attr('opacity', hl && hl !== 'poly' ? .4 : .9);
    KN.forEach((k, i) => svg.append('path').attr('d', d3.line()(ts.map(t => [X(t), Y(c[i] * tp(t, k, n))]))).attr('fill', 'none').attr('stroke', col7(i + 1)).attr('stroke-width', (hl === 'trunc' || hl === 'c') ? 4 : 2).attr('opacity', hl === 'trunc' || hl === 'c' ? 1 : hl ? .3 : .75));
    svg.append('path').attr('d', d3.line()(ts.map((t, j) => [X(t), Y(vals[j])]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 4);
    svg.append('text').attr('x', 54).attr('y', 16).attr('fill', '#9ca3af').attr('font-size', 12).text('S (white) = polynomial part (grey dashed) + one hinge-like term per knot (coloured)');
    if (hl === 'Cn' || collapsed) svg.append('path').attr('d', d3.line()(ts.map(t => [X(t), Y(d3.sum(a(), (aj, j) => aj * t ** j))]))).attr('fill', 'none').attr('stroke', '#ef4444').attr('stroke-width', 5).attr('opacity', .85);

    // staircase of the n-th derivative, draggable
    sb.selectAll('*').remove();
    const SY = d3.scaleLinear([-ymax, ymax], [170, 20]), levels = [fact(n) * A0[n]]; c.forEach(ci => levels.push(levels[levels.length - 1] + fact(n) * ci));
    sb.append('text').attr('x', 54).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text(`S^(${n}) (the ${n}-th derivative) is a staircase. Drag a step: its height change is n!·c_i`);
    sb.append('line').attr('x1', 50).attr('x2', 780).attr('y1', SY(0)).attr('y2', SY(0)).attr('stroke', '#555').attr('stroke-dasharray', '3 4');
    const edges = [0, ...KN, 1];
    levels.forEach((L, s) => sb.append('line').attr('x1', X(edges[s])).attr('x2', X(edges[s + 1])).attr('y1', SY(L)).attr('y2', SY(L)).attr('stroke', hl === 'jump' ? '#fbbf24' : '#fff').attr('stroke-width', hl === 'jump' ? 5 : 3.5));
    KN.forEach((k, i) => sb.append('line').attr('x1', X(k)).attr('x2', X(k)).attr('y1', SY(levels[i])).attr('y2', SY(levels[i + 1])).attr('stroke', col7(i + 1)).attr('stroke-width', 3).attr('stroke-dasharray', '4 3'));
    sb.selectAll('.st').data(KN.map((_, i) => i)).join('circle').attr('cx', i => X(KN[i])).attr('cy', i => SY(levels[i + 1])).attr('r', hl === 'jump' || hl === 'c' ? 10 : 8).attr('fill', i => col7(i + 1)).attr('stroke', i => i === sel ? '#fff' : '#1c1c1c').attr('stroke-width', 3).style('cursor', 'ns-resize')
      .call(d3.drag().on('start', (ev, i) => { sel = i; }).on('drag', (ev, i) => { const target = Math.max(-ymax, Math.min(ymax, SY.invert(ev.y))); c[i] = (target - levels[i]) / fact(n); collapsed = false; draw(); }));
    KN.forEach((k, i) => sb.append('text').attr('x', X(k) + 12).attr('y', SY(levels[i + 1]) - 10).attr('fill', col7(i + 1)).attr('font-size', 11).attr('font-weight', 700).text((c[i] >= 0 ? '+' : '−') + Math.abs(fact(n) * c[i]).toFixed(1)));

    // the two neighbouring pieces, extended past the knot
    const ks = KN[sel], pl = t => d3.sum(a(), (aj, j) => aj * t ** j) + d3.sum(KN.slice(0, sel), (ti, i) => c[i] * (t - ti) ** n), pr = t => pl(t) + c[sel] * (t - ks) ** n;
    const w = d3.range(ks - 0.2, ks + 0.2001, 0.004), pv = w.map(t => [pl(t), pr(t)]).flat(), CX = d3.scaleLinear([ks - 0.2, ks + 0.2], [50, 780]), CY = d3.scaleLinear([d3.min(pv) - .05, d3.max(pv) + .05], [170, 25]);
    sc.selectAll('*').remove();
    sc.append('text').attr('x', 54).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text(`the two pieces next to knot t${sel + 1}, each extended past the knot: they hug each other to order ${n - 1}, then separate like (t − t${sel + 1})^${n}` + (hl === 'D' ? '   ← this' : ''));
    sc.append('path').attr('d', d3.area().x(t => CX(t)).y0(t => CY(pl(t))).y1(t => CY(pr(t)))(w)).attr('fill', '#fbbf24').attr('opacity', hl === 'D' ? .5 : .22);
    sc.append('path').attr('d', d3.line()(w.map(t => [CX(t), CY(pl(t))]))).attr('fill', 'none').attr('stroke', col7(sel)).attr('stroke-width', hl === 'D' ? 5 : 3).attr('stroke-dasharray', t => null);
    sc.append('path').attr('d', d3.line()(w.map(t => [CX(t), CY(pr(t))]))).attr('fill', 'none').attr('stroke', col7(sel + 1)).attr('stroke-width', hl === 'D' ? 5 : 3);
    sc.append('line').attr('x1', CX(ks)).attr('x2', CX(ks)).attr('y1', 25).attr('y2', 170).attr('stroke', '#fbbf24').attr('stroke-width', 2);
    sc.append('text').attr('x', 54).attr('y', 184).attr('fill', col7(sel)).attr('font-size', 12).text(`left piece P${sel} (extended)`);
    sc.append('text').attr('x', 780).attr('y', 184).attr('text-anchor', 'end').attr('fill', col7(sel + 1)).attr('font-size', 12).text(`right piece P${sel + 1}`);

    // derivative table at the selected knot
    const e = 1e-9, rows = d3.range(n + 1).map(r => ({r, L: S(ks - e, r), R: S(ks + e, r)})); rows.forEach(q => q.eq = Math.abs(q.L - q.R) < 1e-6 * (1 + Math.abs(q.L)));
    g('t29').innerHTML = `<table class="mt"><tr><th>derivative r</th><th>left of t<sub>${sel + 1}</sub></th><th>right of t<sub>${sel + 1}</sub></th><th>equal?</th></tr>` +
      rows.map(q => `<tr class="${hl === 'C' && q.r < n || hl === 'jump' && q.r === n ? 'hot' : ''}"><td>${q.r}${q.r === n ? ' (= n)' : ''}</td><td>${q.L.toFixed(3)}</td><td>${q.R.toFixed(3)}</td><td class="${q.eq ? 'yes' : 'no'}">${q.eq ? '✓' : '✗ jump ' + (q.R - q.L).toFixed(3)}</td></tr>`).join('') + '</table>';
    // independent check: the same function written with B-spline bumps on the same knots
    const kv = [...new Array(n + 1).fill(0), ...KN, ...new Array(n + 1).fill(1)], nb = kv.length - n - 1, xs = d3.range(0, 1.0001, 1 / 200), Bm = xs.map(t => d3.range(nb).map(i => bspline(i, n, Math.min(t, 1), kv)));
    const AtA = d3.range(nb).map(r => d3.range(nb).map(q => d3.sum(Bm, row => row[r] * row[q]))), Atb = d3.range(nb).map(r => d3.sum(Bm, (row, k) => row[r] * S(xs[k]))), cf = solveLinear(AtA, Atb);
    const res = d3.max(xs, (t, k) => Math.abs(d3.sum(cf, (v, i) => v * Bm[k][i]) - S(t)));
    const jumpOk = rows[n] && !rows[n].eq === (Math.abs(c[sel]) > 1e-12);
    g('e29-sub').innerHTML = `free numbers: ${n + 1} polynomial coefficients + ${KN.length} jumps = <b>${n + 1 + KN.length}</b> = ${nb} B-splines · the same function written with B-spline bumps differs by at most <b>${res.toExponential(0)}</b> ` +
      (res < 1e-7 ? '<span class="yes">✓ it is a spline in the B-spline sense too</span>' : '<span class="no">✗</span>') + ` · jump of S<sup>(${n})</sup> at t${sel + 1}: n!·c = ${(fact(n) * c[sel]).toFixed(3)}`;
    const CAP = {
      poly: `<b>Σ a<sub>j</sub>t<sup>j</sup></b>: one ordinary polynomial of degree ${n}, the grey dashed curve. It is the spline's shape before any knot is felt.`,
      trunc: `<b>Σ c<sub>i</sub>(t − t<sub>i</sub>)<sub>+</sub><sup>n</sup></b>: one term per knot, zero to the left of its knot and a power ${n} to the right (the coloured curves). For n = 1 these are hinges, exactly the shape of a ReLU. They are smooth to order ${n - 1} at the knot, so adding them cannot break C<sup>${n - 1}</sup>.`,
      c: `<b>c<sub>i</sub></b>: the one free number at knot i, the size of its hinge term. Drag the coloured dots in the middle graph to change it.`,
      D: `<b>P<sub>i</sub> − P<sub>i−1</sub> = c<sub>i</sub>(t − t<sub>i</sub>)<sup>n</sup></b>: because the two pieces agree to order ${n - 1}, their difference is flat to order ${n - 1} at the knot, so it can only be a multiple of (t − t<sub>i</sub>)<sup>${n}</sup>. The shaded gap shows it.`,
      C: `<b>C<sup>n−1</sup></b>: every derivative below the n-th has no jump at a knot (✓ rows in the table). The n-th derivative is the first that can jump.`,
      jump: `<b>S<sup>(n)</sup> jumps by n!·c<sub>i</sub></b>: the n-th derivative of each piece is a constant, so S<sup>(n)</sup> is a staircase and each knot's step height is n!·c<sub>i</sub>.`,
      Cn: `<b>Why not C<sup>n</sup>?</b> Demanding the n-th derivative match too forces every c<sub>i</sub> = 0, leaving only the grey polynomial (red): the knots no longer do anything. C<sup>n−1</sup> is the smoothest a genuine spline of degree n can be. Press the button below to see it.`
    };
    g('e29-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
  }
  g('i29n').addEventListener('input', draw);
  g('z29').onclick = () => { c = c.map(() => 0); collapsed = true; draw(); };
  g('b29').onclick = () => { lastN = 0; draw(); };
  draw();
})();
