/* ---------- 22 · Smoothness at a knot ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v22');
  const INNER0 = [1, 2, 3, 4].map(i => i / 5), X = d3.scaleLinear([0, 1], [60, 780]);
  const dflt = m => d3.range(m).map(i => 0.5 + 0.38 * Math.sin(1.9 * i + 0.6));
  let inner = INNER0.slice(), mult = [1, 1, 1, 1], sel = 1, c = [], lastN = -1, lastKey = '';
  const eq = eqLab('e22', String.raw`\htmlClass{eq-S}{S}\in C^{\htmlClass{eq-r}{r}}\ \text{at}\ \htmlClass{eq-t}{t_i}\iff
    \htmlClass{eq-Pl}{P_{i-1}}^{(\htmlClass{eq-j}{j})}(t_i)=\htmlClass{eq-Pr}{P_i}^{(\htmlClass{eq-j}{j})}(t_i),\ \ j=0,\dots,\htmlClass{eq-r}{r}
    \qquad r=\htmlClass{eq-n}{n}-\htmlClass{eq-m}{m}`, () => draw());

  function draw() {
    const hl = eq.hl, n = +g('i22n').value, kmax = n + 1;
    mult = mult.map(m => Math.min(m, kmax)); g('i22m').max = kmax; g('i22m').value = mult[sel];
    const kv = [...new Array(n + 1).fill(0), ...inner.flatMap((v, j) => new Array(mult[j]).fill(v)), ...new Array(n + 1).fill(1)], nb = kv.length - n - 1;
    const key = nb + ':' + n; if (key !== lastKey) { c = dflt(nb); lastKey = key; }
    g('o22n').textContent = n; g('o22m').textContent = mult[sel];
    g('l22n').classList.toggle('flash', hl === 'n'); g('l22m').classList.toggle('flash', hl === 'm');
    const ks = inner[sel], e = 1e-7, S = (t, r) => d3.sum(c, (cj, q) => cj * bsD(q, n, t, kv, r));
    const bounds = [0, ...inner, 1], orders = [0, 1, 2];
    const panels = orders.map(r => {
      const vals = []; bounds.slice(0, -1).forEach((b, s) => d3.range(0, 1.0001, 0.05).forEach(u => vals.push(S(b + e + u * (bounds[s + 1] - b - 2 * e), r))));
      const lo = d3.min(vals), hi = d3.max(vals), pad = (hi - lo) * .12 || 1;
      return d3.scaleLinear([lo - pad, hi + pad], [0, 100]);
    });
    svg.selectAll('*').remove();
    orders.forEach(r => {
      const y0 = 15 + r * 115, Y = v => y0 + 100 - panels[r](v), name = ['S (value)', "S′ (1st derivative)", "S″ (2nd derivative)"][r];
      svg.append('rect').attr('x', 50).attr('y', y0).attr('width', 740).attr('height', 100).attr('fill', '#202020').attr('rx', 6);
      svg.append('text').attr('x', 58).attr('y', y0 + 14).attr('fill', '#9ca3af').attr('font-size', 12).text(name);
      bounds.slice(0, -1).forEach((b, s) => {
        const left = s === sel, right = s === sel + 1;
        svg.append('path').attr('d', d3.line()(d3.range(0, 1.0001, 0.02).map(u => { const t = b + e + u * (bounds[s + 1] - b - 2 * e); return [X(t), Y(S(t, r))]; })))
          .attr('fill', 'none').attr('stroke', col7(s)).attr('stroke-width', ((hl === 'Pl' && left) || (hl === 'Pr' && right)) ? 6 : hl === 'S' ? 5 : 3.5).attr('opacity', (hl === 'Pl' && !left) || (hl === 'Pr' && !right) ? .35 : 1);
      });
      svg.append('line').attr('x1', X(ks)).attr('x2', X(ks)).attr('y1', y0).attr('y2', y0 + 100).attr('stroke', hl === 't' ? '#fbbf24' : '#555').attr('stroke-width', hl === 't' ? 3 : 1.5);
    });
    svg.selectAll('.kh').data(inner.map((_, j) => j)).join('g').each(function (j) {
      const gg = d3.select(this); gg.selectAll('*').remove();
      d3.range(mult[j]).forEach(r => gg.append('circle').attr('cx', X(inner[j])).attr('cy', 440).attr('r', 12 - r * 2).attr('fill', 'none').attr('stroke', '#fbbf24').attr('stroke-width', 2));
      gg.append('circle').attr('cx', X(inner[j])).attr('cy', 440).attr('r', 4).attr('fill', j === sel ? '#fbbf24' : '#b0861c');
    }).style('cursor', 'ew-resize').call(d3.drag().on('start', (ev, j) => { sel = j; draw(); })
      .on('drag', (ev, j) => { inner[j] = Math.max((j ? inner[j - 1] : 0) + 0.03, Math.min((j < inner.length - 1 ? inner[j + 1] : 1) - 0.03, X.invert(ev.x))); draw(); }));

    // table of one-sided derivatives at the selected knot
    const rows = d3.range(n + 1).map(j => ({j, L: S(ks - e, j), R: S(ks + e, j)}));
    rows.forEach(r => r.ok = Math.abs(r.L - r.R) < 1e-4 * (1 + Math.abs(r.L)));
    let rr = -1; for (const r of rows) { if (r.ok) rr = r.j; else break; }
    const rTheory = n - mult[sel];
    g('t22').innerHTML = `<table class="mt"><tr><th>j</th><th>P<sub>i−1</sub><sup>(j)</sup>(t<sub>i</sub>)</th><th>P<sub>i</sub><sup>(j)</sup>(t<sub>i</sub>)</th><th>equal?</th></tr>` +
      rows.map(r => `<tr class="${(hl === 'j' || (hl === 'r' && r.j <= rTheory)) ? 'hot' : ''}"><td>${r.j}</td><td>${r.L.toFixed(3)}</td><td>${r.R.toFixed(3)}</td><td class="${r.ok ? 'yes' : 'no'}">${r.ok ? '✓' : '✗'}</td></tr>`).join('') + `</table>`;
    g('e22-sub').innerHTML = `knot t<sub>i</sub> = ${ks.toFixed(2)} with m = ${mult[sel]}: formula says r = n − m = ${n} − ${mult[sel]} = <b>${rTheory}</b>; the table shows the pieces agree up to derivative <b>${rr}</b>. ` +
      (rr === rTheory ? '<span class="yes">They match.</span>' : '<span class="no">Mismatch.</span>');
    const CAP = {
      S: `<b>S</b>: the spline. The three panels show S and its first two derivatives; a gap in a panel is a jump at the knot.`,
      r: `<b>r</b>: the smoothness level at t<sub>i</sub>: derivatives 0 up to r all match (C<sup>r</sup>). The rows of the table up to r are highlighted. Here r = n − m = ${rTheory}.`,
      t: `<b>t<sub>i</sub></b>: the i-th knot (the yellow line); i just numbers the knots. Knot i sits between piece P<sub>i−1</sub> on its left and piece P<sub>i</sub> on its right. Click another knot below the graphs to select it.`,
      j: `<b>j</b>: the order of the derivative being compared: 0 is the value, 1 the slope, 2 the bend. The (j) in P<sup>(j)</sup> means "j-th derivative" and is not a power. The conditions run j = 0 … r, so r + 1 of them.`,
      Pl: `<b>P<sub>i−1</sub></b>: the piece to the left of the knot, drawn thick. Its j-th derivative at t<sub>i</sub> is the left column.`,
      Pr: `<b>P<sub>i</sub></b>: the piece to the right of the knot, drawn thick. Its j-th derivative at t<sub>i</sub> is the right column.`,
      m: `<b>m</b>: how many times the knot is repeated. Raise it and watch the matching derivatives drop out, one per copy.`,
      n: `<b>n</b>: the degree. A higher degree can afford more derivatives matching: r = n − m.`
    };
    g('e22-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
  }
  g('i22n').addEventListener('input', draw);
  g('i22m').addEventListener('input', () => { mult[sel] = +g('i22m').value; draw(); });
  g('b22').onclick = () => { inner = INNER0.slice(); mult = [1, 1, 1, 1]; sel = 1; lastKey = ''; draw(); };
  draw();
})();
