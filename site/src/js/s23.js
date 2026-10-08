/* ---------- 23 · Counting the dimension ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v23');
  let mult = [];
  const eq = eqLab('e23', String.raw`\dim=\htmlClass{eq-U}{(n+1)\,k}\;-\;\htmlClass{eq-C}{\sum_{i=1}^{k-1}\big(r_i+1\big)}
    \;=\;\htmlClass{eq-D}{n+1+\sum_{i=1}^{k-1}\htmlClass{eq-m}{m_i}},\qquad r_i=n-m_i`, () => draw());

  function draw() {
    const hl = eq.hl, K = +g('i23k').value, n = +g('i23n').value;
    while (mult.length < K - 1) mult.push(1); mult.length = K - 1; mult = mult.map(m => Math.min(m, n + 1));
    g('o23k').textContent = K; g('o23n').textContent = n;
    const unknown = (n + 1) * K, conds = mult.map(m => n - m + 1), condTotal = d3.sum(conds), dim = unknown - condTotal, formula = n + 1 + d3.sum(mult);
    const knots = [...new Array(n + 1).fill(0), ...mult.flatMap((m, i) => new Array(m).fill((i + 1) / K)), ...new Array(n + 1).fill(1)], count = knots.length - n - 1;
    svg.selectAll('*').remove();
    const W = 700, sx = W / Math.max(unknown, 1), x0 = 50;
    // bar 1: all unknown coefficients, one block per coefficient, grouped by piece
    svg.append('text').attr('x', x0).attr('y', 22).attr('fill', '#9ca3af').attr('font-size', 13).text(`unknowns: ${K} pieces × ${n + 1} coefficients = ${unknown}`);
    d3.range(K).forEach(p => d3.range(n + 1).forEach(q => svg.append('rect').attr('x', x0 + (p * (n + 1) + q) * sx + 1).attr('y', 30).attr('width', sx - 2).attr('height', 34)
      .attr('fill', col7(p)).attr('opacity', hl === 'U' ? 1 : hl ? .5 : .85)));
    // bar 2: conditions removed at each knot
    svg.append('text').attr('x', x0).attr('y', 100).attr('fill', '#9ca3af').attr('font-size', 13).text(`conditions: at each of the ${K - 1} interior knots, r+1 of them  (total ${condTotal})`);
    let pos = 0;
    mult.forEach((m, i) => { d3.range(conds[i]).forEach(q => { svg.append('rect').attr('x', x0 + pos * sx + 1).attr('y', 108).attr('width', sx - 2).attr('height', 34).attr('fill', '#ef4444').attr('opacity', hl === 'C' ? 1 : hl ? .5 : .85); pos++; });
      svg.append('text').attr('x', x0 + (pos - conds[i] / 2) * sx).attr('y', 160).attr('text-anchor', 'middle').attr('fill', '#ef4444').attr('font-size', 11).text('t' + (i + 1)); });
    // bar 3: what is left
    svg.append('text').attr('x', x0).attr('y', 192).attr('fill', '#9ca3af').attr('font-size', 13).text(`free numbers = dimension = ${dim}  (one control point each)`);
    d3.range(dim).forEach(q => svg.append('rect').attr('x', x0 + q * sx + 1).attr('y', 200).attr('width', sx - 2).attr('height', 34).attr('fill', '#22c55e').attr('opacity', hl === 'D' ? 1 : hl ? .5 : .9));
    // clickable knot multiplicities
    svg.append('text').attr('x', x0).attr('y', 268).attr('fill', '#9ca3af').attr('font-size', 13).text('click a knot to repeat it (m copies); r = n − m derivatives then match there');
    mult.forEach((m, i) => {
      const gx = x0 + 60 + i * 80, gg = svg.append('g').style('cursor', 'pointer').on('click', () => { mult[i] = mult[i] % (n + 1) + 1; draw(); });
      gg.append('rect').attr('x', gx - 30).attr('y', 276).attr('width', 60).attr('height', 40).attr('rx', 6).attr('fill', '#242424').attr('stroke', hl === 'm' ? '#fbbf24' : '#555').attr('stroke-width', hl === 'm' ? 3 : 1);
      gg.append('text').attr('x', gx).attr('y', 292).attr('text-anchor', 'middle').attr('fill', '#fbbf24').attr('font-size', 12).text(`t${i + 1}: m=${m}`);
      gg.append('text').attr('x', gx).attr('y', 309).attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', 11).text(`r=${n - m}`);
    });
    g('e23-sub').innerHTML = `dim = ${unknown} − ${condTotal} = <b>${dim}</b> · by the right-hand formula n + 1 + Σm<sub>i</sub> = ${n + 1} + ${d3.sum(mult)} = <b>${formula}</b> · ` +
      `B-splines in the knot vector (entries − n − 1) = <b>${count}</b> ` + (dim === formula && formula === count ? '<span class="yes">✓ all three agree</span>' : '<span class="no">✗ mismatch</span>');
    const CAP = {
      U: `<b>(n+1)k</b>: every piece has n+1 free coefficients, so before any smoothness is demanded there are ${unknown} unknowns (the coloured blocks).`,
      C: `<b>Σ(r<sub>i</sub>+1)</b>: matching value and r derivatives at a knot costs r+1 conditions. Here the knots remove ${condTotal} unknowns in total (red).`,
      D: `<b>dim</b>: what is left, ${dim}, is the number of independent numbers that define the spline: the control points (green).`,
      m: `<b>m<sub>i</sub></b>: how many times knot i is repeated. Each extra copy lowers r by one, so it removes one fewer condition and adds one free number.`
    };
    g('e23-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
  }
  ['i23k', 'i23n'].forEach(id => g(id).addEventListener('input', draw));
  g('b23').onclick = () => { mult = []; draw(); };
  draw();
})();
