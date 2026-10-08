/* ---------- 29 · Why C^(n-1): a five-step argument ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v29'), sb = d3.select('#s29b'), sc = d3.select('#s29c');
  const KN = [1, 2, 3, 4].map(i => i / 5), X = d3.scaleLinear([0, 1], [50, 780]), A0 = [0.25, 0.9, -1.4, 1.2, -0.5], CB = [0.12, -0.2, 0.18, -0.15];
  const fact = m => d3.range(1, m + 1).reduce((a, b) => a * b, 1);
  let n = 3, c = [], sel = 1, ymax = 10, lastN = 0, collapsed = false, step = 1;
  const T = {
    1: String.raw`\htmlClass{eq-Pl}{P_{i-1}}(t)\ \text{and}\ \htmlClass{eq-Pr}{P_i}(t)\ \text{are polynomials of degree}\ \le n,\ \text{meeting at the knot}\ t_i`,
    2: String.raw`\htmlClass{eq-C}{P_{i-1}^{(j)}(t_i)=P_i^{(j)}(t_i)\quad\text{for}\ j=0,1,\dots,n-1}`,
    3: String.raw`\htmlClass{eq-D}{P_i(t)-P_{i-1}(t)=c_i\,(t-t_i)^n}`,
    4: String.raw`S(t)=\htmlClass{eq-poly}{\sum_{j=0}^{n}a_jt^j}+\htmlClass{eq-trunc}{\sum_{i}\htmlClass{eq-c}{c_i}(t-t_i)_+^{\,n}}\qquad \htmlClass{eq-jump}{S^{(n)}\ \text{jumps by}\ n!\,c_i\ \text{at}\ t_i}`,
    5: String.raw`\htmlClass{eq-Cn}{P_{i-1}^{(n)}(t_i)=P_i^{(n)}(t_i)\ \Longrightarrow\ c_i=0\ \Longrightarrow\ \text{both pieces are the same polynomial}}`
  };
  const STEPS = [
    ['1 · Two pieces meet', 'Look at the yellow knot. Each piece is its own polynomial of degree at most n. The question is how many derivatives (value, slope, bend, ...) the two can share there.'],
    ['2 · Match as many as possible', 'Ask for the pieces to agree in value, slope, bend, and so on up to derivative n − 1 (the ✓ rows in the table). Look at the two pieces drawn past the knot: they run together.'],
    ['3 · Only the top term survives', 'Write both pieces as a sum of terms in u = t − t_i: a constant, a u term, a u² term, up to a uⁿ term. Matching the value, slope, bend, ... wipes out the difference in every term except the last one. The table shows it term by term: the difference is 0, 0, 0, ... and then one number, c, on the uⁿ term. In the lower graph that single term is flat for a stretch and then grows.'],
    ['4 · One free number per knot', 'So each knot has exactly one free number, c: everything else about the next piece is inherited. Drag a step in the staircase (that is c, scaled by n!) and watch the curve above respond.'],
    ['5 · Why not smoother?', 'Suppose we also demand that the n-th derivative matches. Then c must be 0 at every knot, and the spline collapses to one polynomial (red). Press the button. So n − 1 is the smoothest a real spline of degree n can be.'],
    ['show everything', 'All the pictures at once, for exploring.']
  ];
  const eqEl = g('e29'), eq = eqLab('e29', T[1], () => draw());
  const a = () => A0.slice(0, n + 1);
  const tp = (t, ti, m) => t >= ti ? (m === 0 ? 1 : (t - ti) ** m) : 0;
  const S = (t, r = 0) => d3.sum(a(), (aj, j) => j >= r ? aj * fact(j) / fact(j - r) * t ** (j - r) : 0) + (r > n ? 0 : d3.sum(KN, (ti, i) => c[i] * fact(n) / fact(n - r) * tp(t, ti, n - r)));
  function setStep(s) {
    step = s; eq.hl = null; eq.locked = null;
    katex.render(s === 5 ? T[5] : s === 6 ? String.raw`\htmlClass{eq-D}{P_i(t)-P_{i-1}(t)=c_i\,(t-t_i)^n}\qquad \htmlClass{eq-C}{S\in C^{\,n-1}}\qquad \htmlClass{eq-jump}{S^{(n)}\ \text{jumps by}\ n!\,c_i}\qquad \htmlClass{eq-Cn}{S\in C^{\,n}\Rightarrow c_i=0}` : T[s], eqEl, {displayMode: true, trust: true, throwOnError: false});
    eq.refresh(); draw();
  }
  const show = (el, on) => { el.style.display = on ? '' : 'none'; };

  function draw() {
    const hl = eq.hl; n = +g('i29n').value; g('o29n').textContent = n;
    if (n !== lastN) { c = CB.map(v => v / 0.5 ** n); const lv = [fact(n) * A0[n]]; c.forEach(ci => lv.push(lv[lv.length - 1] + fact(n) * ci)); ymax = Math.max(4, 1.5 * d3.max(lv, Math.abs)); lastN = n; collapsed = false; }
    g('i29c').value = Math.max(-2, Math.min(2, c[sel] * 0.5 ** n)); g('o29c').textContent = (c[sel] * 0.5 ** n).toFixed(2);
    const all = step === 6;
    show(g('v29'), [1, 4, 5].includes(step) || all); show(g('s29b'), step === 4 || all); show(g('s29c'), [2, 3].includes(step) || all);
    show(g('t29'), step === 2 || step === 3 || all); show(g('kn29'), [1, 2, 3].includes(step) || all); show(g('l29c'), step === 3 || all); show(g('z29'), step === 5 || all); show(g('e29-sub'), step >= 4);
    g('st29-cap').innerHTML = '<b>' + STEPS[step - 1][0] + '.</b> ' + STEPS[step - 1][1];
    const chips = d3.select('#st29'); chips.selectAll('*').remove();
    STEPS.forEach((st, i) => chips.append('button').attr('class', 'chip' + (i + 1 === step ? ' on' : '')).text(st[0]).on('click', () => setStep(i + 1)));
    const kc = d3.select('#kn29'); kc.selectAll('*').remove();
    KN.forEach((k, i) => kc.append('button').attr('class', 'chip' + (i === sel ? ' on' : '')).text('knot t' + (i + 1) + ' = ' + k.toFixed(1)).on('click', () => { sel = i; draw(); }));

    // main curve
    const ts = d3.range(0, 1.00001, 0.004), vals = ts.map(t => S(t)), lo = d3.min(vals), hi = d3.max(vals), pad = (hi - lo) * .15 || .2, Y = d3.scaleLinear([lo - pad, hi + pad], [270, 20]);
    svg.selectAll('*').remove();
    KN.forEach((k, i) => svg.append('line').attr('x1', X(k)).attr('x2', X(k)).attr('y1', 20).attr('y2', 270).attr('stroke', i === sel ? '#fbbf24' : '#444').attr('stroke-width', i === sel ? 3 : 1));
    if (step === 1 || all) { const edges = [0, ...KN, 1]; [sel, sel + 1].forEach(s => svg.append('rect').attr('x', X(edges[s])).attr('y', 20).attr('width', X(edges[s + 1]) - X(edges[s])).attr('height', 250).attr('fill', col7(s)).attr('opacity', .15)); }
    const showParts = step === 4 || all;
    if (showParts) {
      svg.append('path').attr('d', d3.line()(ts.map(t => [X(t), Y(d3.sum(a(), (aj, j) => aj * t ** j))]))).attr('fill', 'none').attr('stroke', '#9ca3af').attr('stroke-width', hl === 'poly' ? 6 : 2).attr('stroke-dasharray', '6 4').attr('opacity', hl && hl !== 'poly' ? .4 : .9);
      KN.forEach((k, i) => svg.append('path').attr('d', d3.line()(ts.map(t => [X(t), Y(c[i] * tp(t, k, n))]))).attr('fill', 'none').attr('stroke', col7(i + 1)).attr('stroke-width', (hl === 'trunc' || hl === 'c') ? 4 : 2).attr('opacity', hl === 'trunc' || hl === 'c' ? 1 : hl ? .3 : .75));
    }
    const edges2 = [0, ...KN, 1];
    edges2.slice(0, -1).forEach((b, s) => { const lo2 = b + 1e-6, hi2 = edges2[s + 1] - 1e-6, xs = d3.range(0, 1.0001, 0.02).map(u => lo2 + u * (hi2 - lo2));
      svg.append('path').attr('d', d3.line()(xs.map(x => [X(x), Y(S(x))]))).attr('fill', 'none').attr('stroke', step === 1 || step === 5 ? col7(s) : '#fff').attr('stroke-width', 4).attr('opacity', step === 1 && s !== sel && s !== sel + 1 ? .45 : 1); });
    if (step === 5 || collapsed) svg.append('path').attr('d', d3.line()(ts.map(t => [X(t), Y(d3.sum(a(), (aj, j) => aj * t ** j))]))).attr('fill', 'none').attr('stroke', '#ef4444').attr('stroke-width', 5).attr('opacity', .9);
    svg.append('text').attr('x', 54).attr('y', 16).attr('fill', '#9ca3af').attr('font-size', 12).text(showParts ? 'S (white) = one polynomial (grey dashed) + one hinge-like term per knot (coloured)' : step === 5 ? 'S, and in red the single polynomial it collapses to when c = 0' : 'the spline; the shaded pieces meet at the yellow knot');

    // staircase
    sb.selectAll('*').remove();
    const SY = d3.scaleLinear([-ymax, ymax], [170, 20]), levels = [fact(n) * A0[n]]; c.forEach(ci => levels.push(levels[levels.length - 1] + fact(n) * ci));
    sb.append('text').attr('x', 54).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text(`S^(${n}) (the ${n}-th derivative) is a staircase. Drag a dot: the step height is n!·c at that knot`);
    sb.append('line').attr('x1', 50).attr('x2', 780).attr('y1', SY(0)).attr('y2', SY(0)).attr('stroke', '#555').attr('stroke-dasharray', '3 4');
    levels.forEach((L, s) => sb.append('line').attr('x1', X(edges2[s])).attr('x2', X(edges2[s + 1])).attr('y1', SY(L)).attr('y2', SY(L)).attr('stroke', hl === 'jump' ? '#fbbf24' : '#fff').attr('stroke-width', hl === 'jump' ? 5 : 3.5));
    KN.forEach((k, i) => sb.append('line').attr('x1', X(k)).attr('x2', X(k)).attr('y1', SY(levels[i])).attr('y2', SY(levels[i + 1])).attr('stroke', col7(i + 1)).attr('stroke-width', 3).attr('stroke-dasharray', '4 3'));
    sb.selectAll('.st').data(KN.map((_, i) => i)).join('circle').attr('cx', i => X(KN[i])).attr('cy', i => SY(levels[i + 1])).attr('r', hl === 'jump' || hl === 'c' ? 10 : 8).attr('fill', i => col7(i + 1)).attr('stroke', i => i === sel ? '#fff' : '#1c1c1c').attr('stroke-width', 3).style('cursor', 'ns-resize')
      .call(d3.drag().on('start', (ev, i) => { sel = i; }).on('drag', (ev, i) => { const target = Math.max(-ymax, Math.min(ymax, SY.invert(ev.y))); c[i] = (target - levels[i]) / fact(n); collapsed = false; draw(); }));
    KN.forEach((k, i) => sb.append('text').attr('x', X(k) + 12).attr('y', SY(levels[i + 1]) - 10).attr('fill', col7(i + 1)).attr('font-size', 11).attr('font-weight', 700).text((c[i] >= 0 ? '+' : '−') + Math.abs(fact(n) * c[i]).toFixed(1)));

    // the two pieces past the knot, and their difference
    const ks = KN[sel], pl = t => d3.sum(a(), (aj, j) => aj * t ** j) + d3.sum(KN.slice(0, sel), (ti, i) => c[i] * (t - ti) ** n), pr = t => pl(t) + c[sel] * (t - ks) ** n;
    const w = d3.range(ks - 0.2, ks + 0.2001, 0.004), pv = w.map(t => [pl(t), pr(t)]).flat(), CX = d3.scaleLinear([ks - 0.2, ks + 0.2], [50, 780]), CY = d3.scaleLinear([d3.min(pv) - .05, d3.max(pv) + .05], [125, 25]);
    const dv = w.map(t => pr(t) - pl(t)), DYs = d3.scaleLinear([Math.min(d3.min(dv), 0) - 1e-9, Math.max(d3.max(dv), 0) + 1e-9], [258, 180]);
    sc.selectAll('*').remove();
    sc.append('text').attr('x', 54).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 12).text(`top: the two pieces at knot t${sel + 1}, each extended past the knot`);
    sc.append('path').attr('d', d3.area().x(t => CX(t)).y0(t => CY(pl(t))).y1(t => CY(pr(t)))(w)).attr('fill', '#fbbf24').attr('opacity', .3);
    sc.append('path').attr('d', d3.line()(w.map(t => [CX(t), CY(pl(t))]))).attr('fill', 'none').attr('stroke', col7(sel)).attr('stroke-width', 3);
    sc.append('path').attr('d', d3.line()(w.map(t => [CX(t), CY(pr(t))]))).attr('fill', 'none').attr('stroke', col7(sel + 1)).attr('stroke-width', 3);
    sc.append('text').attr('x', 54).attr('y', 140).attr('fill', col7(sel)).attr('font-size', 12).text(`left piece P${sel} (extended)`);
    sc.append('text').attr('x', 780).attr('y', 140).attr('text-anchor', 'end').attr('fill', col7(sel + 1)).attr('font-size', 12).text(`right piece P${sel + 1}`);
    sc.append('text').attr('x', 54).attr('y', 164).attr('fill', '#fbbf24').attr('font-size', 12).text(`bottom: the gap between them, magnified (it is c·(t − t${sel + 1})^${n}${hl === 'D' ? '   ← this' : ''})`);
    sc.append('line').attr('x1', 50).attr('x2', 780).attr('y1', DYs(0)).attr('y2', DYs(0)).attr('stroke', '#555').attr('stroke-dasharray', '3 4');
    sc.append('path').attr('d', d3.line()(w.map((t, j) => [CX(t), DYs(dv[j])]))).attr('fill', 'none').attr('stroke', '#fbbf24').attr('stroke-width', hl === 'D' ? 6 : 3.5);
    sc.append('path').attr('d', d3.line()(w.map(t => [CX(t), DYs(c[sel] * (t - ks) ** n)]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1.5).attr('stroke-dasharray', '4 3');
    [25, 250].forEach((y0, q) => sc.append('line').attr('x1', CX(ks)).attr('x2', CX(ks)).attr('y1', q ? 180 : 25).attr('y2', q ? 262 : 130).attr('stroke', '#fbbf24').attr('stroke-width', 2));

    // table (step 3: the two pieces term by term; otherwise: derivatives at the knot)
    const dl = r => d3.sum(a(), (aj, j) => j >= r ? aj * fact(j) / fact(j - r) * ks ** (j - r) : 0) + d3.sum(d3.range(sel), i => c[i] * fact(n) / fact(n - r) * (ks - KN[i]) ** (n - r));
    const dr = r => dl(r) + c[sel] * fact(n) / fact(n - r) * 0 ** (n - r);
    const termName = j => j === 0 ? '1' : j === 1 ? 'u' : 'u' + String.fromCharCode([8304, 185, 178, 179, 8308][j]);
    const termTable = () => `<table class="mt"><tr><th></th>${d3.range(n + 1).map(j => `<th>${termName(j)}${j === 0 ? ' (value)' : j === 1 ? ' (slope)' : j === 2 ? ' (bend)' : ''}</th>`).join('')}</tr>` +
      `<tr><td>left piece P<sub>${sel}</sub></td>${d3.range(n + 1).map(j => `<td>${(dl(j) / fact(j)).toFixed(3)}</td>`).join('')}</tr>` +
      `<tr><td>right piece P<sub>${sel + 1}</sub></td>${d3.range(n + 1).map(j => `<td>${(dr(j) / fact(j)).toFixed(3)}</td>`).join('')}</tr>` +
      `<tr class="hot"><td>right − left</td>${d3.range(n + 1).map(j => { const dd = (dr(j) - dl(j)) / fact(j); return `<td class="${Math.abs(dd) < 1e-9 ? 'yes' : 'no'}">${Math.abs(dd) < 1e-9 ? '0' : dd.toFixed(3)}</td>`; }).join('')}</tr></table>` +
      `<p class="note">Each column is the coefficient of that term when a piece is written in u = t − t<sub>${sel + 1}</sub> (the knot is u = 0). The two pieces share every term except the last, so their difference has only the u<sup>${n}</sup> term, with coefficient c = ${c[sel].toFixed(3)}.</p>`;
    const e = 1e-9, rows = d3.range(n + 1).map(r => ({r, L: S(ks - e, r), R: S(ks + e, r)})); rows.forEach(q => q.eq = Math.abs(q.L - q.R) < 1e-6 * (1 + Math.abs(q.L)));
    g('t29').innerHTML = step === 3 ? termTable() : `<table class="mt"><tr><th>derivative j</th><th>left of t<sub>${sel + 1}</sub></th><th>right of t<sub>${sel + 1}</sub></th><th>equal?</th></tr>` +
      rows.map(q => `<tr class="${hl === 'C' && q.r < n || hl === 'jump' && q.r === n ? 'hot' : ''}"><td>${q.r}${q.r === n ? ' (= n)' : ''}</td><td>${q.L.toFixed(3)}</td><td>${q.R.toFixed(3)}</td><td class="${q.eq ? 'yes' : 'no'}">${q.eq ? '✓' : '✗ jump ' + (q.R - q.L).toFixed(3)}</td></tr>`).join('') + '</table>';
    // independent check against the B-spline form
    const kv = [...new Array(n + 1).fill(0), ...KN, ...new Array(n + 1).fill(1)], nb = kv.length - n - 1, xs = d3.range(0, 1.0001, 1 / 200), Bm = xs.map(t => d3.range(nb).map(i => bspline(i, n, Math.min(t, 1), kv)));
    const AtA = d3.range(nb).map(r => d3.range(nb).map(q => d3.sum(Bm, row => row[r] * row[q]))), Atb = d3.range(nb).map(r => d3.sum(Bm, (row, k) => row[r] * S(xs[k]))), cf = solveLinear(AtA, Atb);
    const res = d3.max(xs, (t, k) => Math.abs(d3.sum(cf, (v, i) => v * Bm[k][i]) - S(t))), gapErr = d3.max(w, t => Math.abs(pr(t) - pl(t) - c[sel] * (t - ks) ** n));
    g('e29-sub').innerHTML = `free numbers: ${n + 1} polynomial coefficients + ${KN.length} jumps = <b>${n + 1 + KN.length}</b> = ${nb} B-splines · the same function in B-spline form differs by at most <b>${res.toExponential(0)}</b> ` +
      (res < 1e-7 ? '<span class="yes">✓</span>' : '<span class="no">✗</span>') + ` · gap between the pieces vs c(t − t<sub>${sel + 1}</sub>)<sup>${n}</sup>: ${gapErr.toExponential(0)} · jump of S<sup>(${n})</sup> at t${sel + 1}: n!·c = ${(fact(n) * c[sel]).toFixed(3)}`;
    const CAP = {
      Pl: `<b>P<sub>i−1</sub></b>: the piece to the left of the knot.`, Pr: `<b>P<sub>i</sub></b>: the piece to the right of the knot.`,
      poly: `<b>Σ a<sub>j</sub>t<sup>j</sup></b>: one ordinary polynomial of degree ${n}, the grey dashed curve. It is the spline's shape before any knot is felt.`,
      trunc: `<b>Σ c<sub>i</sub>(t − t<sub>i</sub>)<sub>+</sub><sup>n</sup></b>: one term per knot: zero to the left of its knot and a power ${n} to the right (coloured). For n = 1 these are hinges, the shape of a ReLU. Each is smooth to order ${n - 1} at its knot, so adding them cannot break C<sup>${n - 1}</sup>.`,
      c: `<b>c<sub>i</sub></b>: the one free number at knot i, the size of its hinge term.`,
      D: `<b>P<sub>i</sub> − P<sub>i−1</sub> = c<sub>i</sub>(t − t<sub>i</sub>)<sup>n</sup></b>: write the difference as d₀ + d₁u + d₂u² + … + d<sub>n</sub>u<sup>n</sup> with u = t − t<sub>i</sub>. The pieces agreeing in value, slope, bend, … up to order ${n - 1} forces d₀ = … = d<sub>${n - 1}</sub> = 0. Only the last term d<sub>n</sub>u<sup>n</sup> can be left, and we call its coefficient c<sub>i</sub>. The table shows the zeros; the lower graph shows the leftover term (dashed white is the formula, yellow is measured).`,
      C: `<b>j = 0 … n − 1</b>: every derivative below the n-th has no jump at the knot (✓ rows). That is C<sup>n−1</sup>.`,
      jump: `<b>S<sup>(n)</sup> jumps by n!·c<sub>i</sub></b>: each piece's n-th derivative is a constant, so S<sup>(n)</sup> is a staircase; each knot's step height is n!·c<sub>i</sub>.`,
      Cn: `<b>Why not C<sup>n</sup>?</b> Matching the n-th derivative too forces c<sub>i</sub> = 0 at every knot, leaving one polynomial (red). The knots would no longer do anything.`
    };
    g('e29-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
  }
  g('i29n').addEventListener('input', draw);
  g('i29c').addEventListener('input', () => { c[sel] = +g('i29c').value / 0.5 ** n; collapsed = false; draw(); });
  g('z29').onclick = () => { c = c.map(() => 0); collapsed = true; draw(); };
  g('b29').onclick = () => { lastN = 0; draw(); };
  setStep(1);
})();
