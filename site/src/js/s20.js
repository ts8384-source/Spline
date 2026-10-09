/* ---------- 20 · The core equation, wired up ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#eqv'), tIn = g('eq-t'), pIn = g('eq-p'), eq = g('eq');
  const INNER = [1, 2, 3, 4, 5].map(i => i / 6);
  const PAL = ['#3b82f6', '#f97316', '#22c55e', '#e11d48', '#a855f7', '#06b6d4', '#eab308'], col = i => PAL[i % PAL.length];
  const X = d3.scaleLinear([0, 1], [50, 780]), Y = d3.scaleLinear([-0.05, 1.05], [290, 15]), ts = d3.range(401).map(i => i / 400);
  const dflt = n => d3.range(n).map(i => 0.5 + 0.38 * Math.sin(1.9 * i + 0.6));
  let c = [], hl = null, locked = null;

  katex.render(String.raw`\htmlClass{eq-S}{S(t)} \;=\; \htmlClass{eq-sum}{\sum_{i=0}^{n-1}}\; \htmlClass{eq-c}{c_i}\; \htmlClass{eq-B}{B_{i,\htmlClass{eq-p}{p}}(\htmlClass{eq-t}{t})}`,
    eq, {displayMode: true, trust: true, throwOnError: false});
  const keyOf = el => { const m = el && el.closest && el.closest('[class*="eq-"]'); const k = m && [...m.classList].find(x => x.startsWith('eq-')); return k ? k.slice(3) : null; };
  eq.addEventListener('mouseover', e => { hl = keyOf(e.target) || locked; draw(); });
  eq.addEventListener('mouseleave', () => { hl = locked; draw(); });
  eq.addEventListener('click', e => { const k = keyOf(e.target); locked = locked === k ? null : k; hl = locked; draw(); });

  function draw() {
    const p = +pIn.value, t = +tIn.value; g('eq-tv').textContent = t.toFixed(2); g('eq-pv').textContent = p;
    const k = [...new Array(p + 1).fill(0), ...INNER, ...new Array(p + 1).fill(1)], n = k.length - p - 1;
    if (c.length !== n) c = dflt(n);
    const B = ts.map(s => d3.range(n).map(i => bspline(i, p, s, k))), f = B.map(r => d3.sum(r, (b, i) => b * c[i]));
    const bt = d3.range(n).map(i => bspline(i, p, t, k)), S = d3.sum(bt, (b, i) => b * c[i]), act = d3.range(n).filter(i => bt[i] > 1e-9);
    const grev = c.map((_, i) => p === 0 ? (k[i] + k[i + 1]) / 2 : d3.sum(k.slice(i + 1, i + p + 1)) / p);
    eq.querySelectorAll('[class*="eq-"]').forEach(el => el.classList.toggle('on', keyOf(el) === hl));
    g('eq-t-l').classList.toggle('flash', hl === 't'); g('eq-p-l').classList.toggle('flash', hl === 'p');

    const bOp = hl === 'B' ? 1 : (hl === 'c' || hl === 'sum' || hl === 'S') ? .2 : .7;
    svg.selectAll('*').remove();
    svg.append('path').attr('d', `M50,${Y(0)}H780`).attr('stroke', '#9ca3af').attr('fill', 'none');
    INNER.forEach(v => svg.append('line').attr('x1', X(v)).attr('x2', X(v)).attr('y1', 15).attr('y2', 290).attr('stroke', '#333'));
    d3.range(n).forEach(i => {                                                         // unweighted bumps B_i
      svg.append('path').attr('d', d3.line()(ts.map((s, j) => [X(s), Y(B[j][i])]))).attr('fill', 'none').attr('stroke', col(i))
        .attr('stroke-width', hl === 'B' ? 3.2 : 1.8).attr('opacity', bOp).attr('stroke-dasharray', i >= PAL.length ? '6 3' : null);
    });
    d3.range(n).forEach(i => {                                                         // weighted bumps c_i B_i
      const vals = ts.map((s, j) => [X(s), Y(c[i] * B[j][i])]);
      svg.append('path').attr('d', d3.area().x(d => d[0]).y0(Y(0)).y1(d => d[1])(vals)).attr('fill', col(i)).attr('opacity', hl === 'sum' ? .45 : hl === 'c' ? .22 : .12);
      if (hl === 'sum') svg.append('path').attr('d', d3.line()(vals)).attr('fill', 'none').attr('stroke', col(i)).attr('stroke-width', 2);
    });
    svg.append('path').attr('d', d3.line()(ts.map((s, j) => [X(s), Y(f[j])]))).attr('fill', 'none').attr('stroke', '#fff')
      .attr('stroke-width', hl === 'S' ? 7 : 3.5).attr('opacity', hl === 'B' || hl === 'c' ? .55 : 1);
    svg.append('line').attr('x1', X(t)).attr('x2', X(t)).attr('y1', 15).attr('y2', 290).attr('stroke', hl === 't' ? '#fbbf24' : '#fff').attr('stroke-width', hl === 't' ? 4 : 1.5).attr('opacity', .85);
    act.forEach(i => {                                                                 // the live B_i(t) values
      svg.append('circle').attr('cx', X(t)).attr('cy', Y(bt[i])).attr('r', hl === 'B' ? 7 : 4.5).attr('fill', col(i));
      if (hl === 'B') svg.append('text').attr('x', X(t) + 10).attr('y', Y(bt[i]) + 4).attr('fill', col(i)).attr('font-size', 12).attr('font-weight', 700).text(`B${i}=${bt[i].toFixed(2)}`);
    });
    svg.append('circle').attr('cx', X(t)).attr('cy', Y(S)).attr('r', hl === 'S' ? 10 : 6).attr('fill', '#fff').attr('stroke', '#1c1c1c');
    svg.selectAll('.w').data(d3.range(n)).join('circle').attr('cx', i => X(grev[i])).attr('cy', i => Y(c[i])).attr('r', hl === 'c' ? 12 : 9)
      .attr('fill', i => col(i)).attr('stroke', hl === 'c' ? '#fff' : '#1c1c1c').attr('stroke-width', hl === 'c' ? 3 : 2).style('cursor', 'ns-resize')
      .call(d3.drag().on('drag', (ev, i) => { c[i] = Math.max(0, Math.min(1, Y.invert(ev.y))); draw(); }));
    svg.selectAll('.wl').data(d3.range(n)).join('text').attr('x', i => X(grev[i])).attr('y', i => Y(c[i]) + 4).attr('text-anchor', 'middle').attr('fill', '#111')
      .attr('font-size', 11).attr('font-weight', 700).attr('pointer-events', 'none').text(i => i);
    if (hl === 'c') svg.selectAll('.wv').data(d3.range(n)).join('text').attr('x', i => X(grev[i])).attr('y', i => Y(c[i]) - 16).attr('text-anchor', 'middle')
      .attr('fill', i => col(i)).attr('font-size', 12).text(i => c[i].toFixed(2));

    const CAP = {
      S: `<b>S(t)</b>: where the curve is at clock time t. Right now S(${t.toFixed(2)}) = ${S.toFixed(3)} (the white dot).`,
      sum: `<b>Σ</b>: add up the contributions of all ${n} bumps. The index runs i = 0, …, n − 1 because n things counted from 0 end at n − 1. At this t only ${act.length} are non-zero: ${act.join(', ')}.`,
      c: `<b>c<sub>i</sub></b>: the weight of bump i (a control point). You set these. Drag the numbered dots.`,
      B: `<b>B<sub>i,p</sub>(t)</b>: how much bump i counts at time t, between 0 and 1. The non-zero ones add to ${d3.sum(bt).toFixed(3)}.`,
      p: `<b>p</b>: the degree. Slide it: boxes (0), triangles (1), rounded hats (2), smooth cubic bumps (3).`,
      t: `<b>t</b>: the clock. Slide it to move the cursor along the curve.`
    };
    g('eq-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
    g('eq-sub').innerHTML = `S(${t.toFixed(2)}) = Σ c<sub>i</sub>·B<sub>i</sub>(t) = ` +
      act.map(i => `<span style="color:${col(i)}">${c[i].toFixed(2)}·${bt[i].toFixed(2)}</span>`).join(' + ') + ` = <b>${S.toFixed(3)}</b>`;
    g('eq-learn-live').innerHTML = `Because S is a plain weighted sum, <b>∂S/∂c<sub>i</sub> = B<sub>i,p</sub>(t)</b>: the bump values <i>are</i> the gradient weights. At t = ${t.toFixed(2)} only bump${act.length === 1 ? '' : 's'} ${act.join(', ')} ${act.length === 1 ? 'has' : 'have'} a non-zero gradient (${act.map(i => bt[i].toFixed(2)).join(', ')}), so only those weights would move if the error at this t were reduced. With B fixed, S is linear in c, so fitting c to data is a linear least-squares problem.`;
  }
  g('eq-learn-cb').addEventListener('change', e => { eq.classList.toggle('learnview', e.target.checked); g('eq-learn').style.display = e.target.checked ? '' : 'none'; });
  tIn.addEventListener('input', draw); pIn.addEventListener('input', draw);
  g('eq-reset').onclick = () => { c = []; draw(); };
  draw();
})();
