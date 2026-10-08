/* ---------- 21 · Definition ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v21');
  const X = d3.scaleLinear([0, 1], [50, 780]), Y = d3.scaleLinear([-0.05, 1.05], [270, 15]);
  const dflt = m => d3.range(m).map(i => 0.5 + 0.38 * Math.sin(1.9 * i + 0.6));
  let inner = [], c = [], lastK = 0;
  const eq = eqLab('e21', String.raw`\begin{aligned}
    \htmlClass{eq-S}{S}(t) &= \htmlClass{eq-P}{P_{\htmlClass{eq-i}{i}}}(t), \qquad \htmlClass{eq-ti}{t_i} \le t < \htmlClass{eq-ti1}{t_{i+1}}, \qquad i=0,\dots,\htmlClass{eq-k}{k}-1\\
    \deg P_i &\le \htmlClass{eq-n}{n}
  \end{aligned}`, () => draw());
  const f = (t, k, n) => d3.sum(c, (cj, j) => cj * bspline(j, n, t, k));

  function draw() {
    const hl = eq.hl, K = +g('i21k').value, n = +g('i21n').value, t = +g('i21t').value;
    if (K !== lastK) { inner = d3.range(1, K).map(i => i / K); lastK = K; c = []; }
    const kv = [...new Array(n + 1).fill(0), ...inner, ...new Array(n + 1).fill(1)], nb = kv.length - n - 1;
    if (c.length !== nb) c = dflt(nb);
    g('o21t').textContent = t.toFixed(2); g('o21k').textContent = K; g('o21n').textContent = n;
    ['t', 'k', 'n'].forEach(q => g('l21' + q).classList.toggle('flash', hl === q));
    const bounds = [0, ...inner, 1], span = d3.max(d3.range(bounds.length - 1).filter(s => bounds[s] <= t)), tl = bounds[span], tr = bounds[span + 1];
    svg.selectAll('*').remove();
    svg.append('path').attr('d', `M50,${Y(0)}H780`).attr('stroke', '#9ca3af').attr('fill', 'none');
    bounds.slice(0, -1).forEach((b, s) => {
      const on = s === span, lo = b + 1e-6, hi = bounds[s + 1] - 1e-6, xs = d3.range(0, 1.0001, 0.02).map(u => lo + u * (hi - lo));
      if (on && (hl === 'P' || hl === 'i' || hl === 'ti' || hl === 'ti1')) svg.append('rect').attr('x', X(b)).attr('y', 15).attr('width', X(bounds[s + 1]) - X(b)).attr('height', 255).attr('fill', col7(s)).attr('opacity', .15);
      svg.append('path').attr('d', d3.line()(xs.map(x => [X(x), Y(f(x, kv, n))]))).attr('fill', 'none').attr('stroke', col7(s))
        .attr('stroke-width', on && hl === 'P' ? 8 : hl === 'S' ? 6 : 4).attr('opacity', hl && hl !== 'S' && hl !== 'P' && !on ? .55 : 1);
      svg.append('text').attr('x', (X(b) + X(bounds[s + 1])) / 2).attr('y', 30).attr('text-anchor', 'middle').attr('fill', col7(s)).attr('font-size', hl === 'i' && on ? 18 : 12).attr('font-weight', 700).text('P' + s);
    });
    bounds.forEach((b, j) => {
      const hot = (hl === 'ti' && j === span) || (hl === 'ti1' && j === span + 1) || hl === 'k';
      svg.append('line').attr('x1', X(b)).attr('x2', X(b)).attr('y1', 15).attr('y2', 270).attr('stroke', hot ? '#fbbf24' : '#444').attr('stroke-width', hot ? 3 : 1);
      svg.append('text').attr('x', X(b)).attr('y', 295).attr('text-anchor', 'middle').attr('fill', hot ? '#fbbf24' : '#9ca3af').attr('font-size', 12).text('t' + j);
    });
    svg.append('line').attr('x1', X(t)).attr('x2', X(t)).attr('y1', 15).attr('y2', 270).attr('stroke', '#fff').attr('opacity', .8);
    svg.append('circle').attr('cx', X(t)).attr('cy', Y(f(t, kv, n))).attr('r', 7).attr('fill', '#fff');
    svg.selectAll('.kh').data(inner.map((_, j) => j)).join('circle').attr('cx', j => X(inner[j])).attr('cy', 313).attr('r', 7).attr('fill', '#fbbf24').attr('stroke', '#1c1c1c').attr('stroke-width', 2).style('cursor', 'ew-resize')
      .call(d3.drag().on('drag', (ev, j) => { inner[j] = Math.max((j ? inner[j - 1] : 0) + 0.02, Math.min((j < inner.length - 1 ? inner[j + 1] : 1) - 0.02, X.invert(ev.x))); draw(); }));

    // the active piece as an ordinary polynomial in (t - t_i): Taylor coefficients at the left end
    const e = 1e-9, coef = d3.range(n + 1).map(j => d3.sum(c, (cj, q) => cj * bsD(q, n, tl + e, kv, j)) / d3.range(1, j + 1).reduce((a, b) => a * b, 1));
    const term = (a, j) => `${a >= 0 && j ? '+ ' : a < 0 ? '− ' : ''}${Math.abs(a).toFixed(2)}${j ? `(t−t<sub>${span}</sub>)${j > 1 ? `<sup>${j}</sup>` : ''}` : ''}`;
    g('e21-sub').innerHTML = `t = ${t.toFixed(2)} lies in piece i = <b>${span}</b>, where t<sub>${span}</sub> = ${tl.toFixed(2)} ≤ t &lt; t<sub>${span + 1}</sub> = ${tr.toFixed(2)}. ` +
      `There S = P<sub>${span}</sub>(t) = ${coef.map(term).join(' ')} = <b>${f(t, kv, n).toFixed(3)}</b>`;
    const CAP = {
      S: `<b>S</b>: the whole function. It is defined everywhere on [0, 1], but only through its pieces.`,
      P: `<b>P<sub>i</sub></b>: the polynomial that S equals on piece i. Each piece is a different polynomial: pieces ${bounds.length - 1}, each of degree at most ${n}.`,
      i: `<b>i</b>: the index of the piece, found by asking which interval t falls in. Here i = ${span}.`,
      ti: `<b>t<sub>i</sub></b>: the knot at the left end of piece i (here ${tl.toFixed(2)}). Drag the yellow dots to move knots.`,
      ti1: `<b>t<sub>i+1</sub></b>: the knot at the right end of the piece (here ${tr.toFixed(2)}). The piece includes its left end and excludes its right end.`,
      k: `<b>k</b>: the number of pieces, so k − 1 interior knots. Slide it to cut the interval into more or fewer pieces.`,
      n: `<b>n</b>: the largest degree any piece may have. Slide it: degree 0 gives steps, 1 gives straight segments, 3 gives cubic pieces.`
    };
    g('e21-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
  }
  ['i21t', 'i21k', 'i21n'].forEach(id => g(id).addEventListener('input', draw));
  g('b21').onclick = () => { lastK = 0; c = []; draw(); };
  draw();
})();
