/* ---------- 32 · The fixed choices: degree, knots, basis rule (n stays 7) ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v32'), kv = d3.select('#k32'), N = 7, W = 800, H = 300;
  const base = () => d3.range(N).map(i => [60 + i * (680 / (N - 1)), 150 + 100 * Math.sin(i * 1.3 + 0.4)]);
  const uni = p => d3.range(1, N - p).map(i => i / (N - p));
  const knotsOf = (p, inner) => [...new Array(p + 1).fill(0), ...inner, ...new Array(p + 1).fill(1)];
  const binom = (m, i) => d3.range(i).reduce((a, j) => a * (m - j) / (j + 1), 1);
  const bern = (i, t) => binom(N - 1, i) * Math.pow(t, i) * Math.pow(1 - t, N - 1 - i);
  let P = base(), mode = 'bs', p = 3, inner = uni(3), pre = 'uni';
  const eq = eqLab('e32', String.raw`\htmlClass{eq-S}{\mathbf S(t)}=\sum_{i=0}^{n-1}\htmlClass{eq-c}{\mathbf c_i}\,\htmlClass{eq-B}{B_{i,\htmlClass{eq-p}{p},\htmlClass{eq-T}{\mathbf T}}(t)}`, () => draw());
  g('e32').classList.add('learnview');
  const KX = d3.scaleLinear([0, 1], [40, 780]), KY = d3.scaleLinear([0, 1], [150, 12]), ts = d3.range(0, 1.0001, .004);

  function draw() {
    const hl = eq.hl, t = Math.min(+g('i32t').value, 1 - 1e-9), bz = mode === 'bz', pe = bz ? N - 1 : p, k = knotsOf(pe, bz ? [] : inner);
    g('o32p').textContent = bz ? `${N - 1} (fixed by Bézier)` : p; g('o32t').textContent = (+g('i32t').value).toFixed(2); g('i32p').disabled = bz;
    document.querySelectorAll('#m32 .chip').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    document.querySelectorAll('#pre32 .chip').forEach(b => { b.classList.toggle('on', !bz && b.dataset.k === pre); b.disabled = bz; });
    g('l32p').classList.toggle('flash', hl === 'p');
    const Bf = (i, s) => bz ? bern(i, s) : bspline(i, pe, Math.min(s, 1 - 1e-9), k);
    const cur = (s, Q = P) => [0, 1].map(c => d3.sum(d3.range(N), i => Q[i][c] * Bf(i, s)));
    const kRef = knotsOf(3, uni(3)), ref = s => [0, 1].map(c => d3.sum(d3.range(N), i => P[i][c] * bspline(i, 3, Math.min(s, 1 - 1e-9), kRef)));
    const bt = d3.range(N).map(i => Bf(i, t)), here = cur(t), act = d3.range(N).filter(i => Math.abs(bt[i]) > 1e-9);

    svg.selectAll('*').remove();
    svg.append('path').attr('d', d3.line()(ts.map(ref))).attr('fill', 'none').attr('stroke', '#9ca3af').attr('stroke-width', 1.8).attr('opacity', .75);
    svg.append('path').attr('d', d3.line()(P)).attr('fill', 'none').attr('stroke', '#555').attr('stroke-dasharray', '4 4');
    svg.append('path').attr('d', d3.line()(ts.map(s => cur(s)))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', hl === 'S' ? 7 : 3.5);
    act.forEach(i => svg.append('line').attr('x1', here[0]).attr('y1', here[1]).attr('x2', P[i][0]).attr('y2', P[i][1]).attr('stroke', col7(i)).attr('stroke-width', 1 + 9 * Math.max(0, bt[i])).attr('opacity', hl === 'B' ? .95 : .4));
    svg.append('circle').attr('cx', here[0]).attr('cy', here[1]).attr('r', 6).attr('fill', '#fff').attr('stroke', '#1c1c1c');
    svg.selectAll('.cp').data(d3.range(N)).join('circle').attr('class', 'cp').attr('cx', i => P[i][0]).attr('cy', i => P[i][1]).attr('r', hl === 'c' ? 13 : 10).attr('fill', i => col7(i))
      .attr('stroke', hl === 'c' ? '#fff' : '#1c1c1c').attr('stroke-width', 2.5).style('cursor', 'grab')
      .call(d3.drag().on('drag', (ev, i) => { P[i] = [Math.max(10, Math.min(W - 10, ev.x)), Math.max(10, Math.min(H - 10, ev.y))]; draw(); }));
    svg.selectAll('.cl').data(d3.range(N)).join('text').attr('class', 'cl').attr('x', i => P[i][0]).attr('y', i => P[i][1] + 4).attr('text-anchor', 'middle').attr('fill', '#111').attr('font-size', 11).attr('font-weight', 700).attr('pointer-events', 'none').text(i => i);
    if (!bz) d3.rollups(inner, v => v.length, v => v.toFixed(4)).map(([v, m]) => [+v, m]).forEach(([v, m]) => {
      const q = cur(v), r = p - m;
      svg.append('circle').attr('cx', q[0]).attr('cy', q[1]).attr('r', hl === 'T' ? 11 : 8).attr('fill', 'none').attr('stroke', '#fbbf24').attr('stroke-width', 3);
      svg.append('text').attr('x', q[0]).attr('y', q[1] - 14).attr('text-anchor', 'middle').attr('fill', '#fbbf24').attr('font-size', 12).attr('font-weight', 700).text(r >= 0 ? (r === 0 ? 'corner allowed (C⁰)' : `smooth (C${['⁰', '¹', '²'][r] || r})`) : 'can break');
    });
    svg.append('text').attr('x', 10).attr('y', 16).attr('fill', '#9ca3af').attr('font-size', 11).text('grey = default (cubic, evenly spaced knots, B-spline)');

    // bumps + knot handles
    kv.selectAll('*').remove();
    kv.append('path').attr('d', `M40,150H780`).attr('stroke', '#9ca3af').attr('fill', 'none');
    d3.range(N).forEach(i => kv.append('path').attr('d', d3.line()(ts.map(s => [KX(s), KY(Math.max(0, Math.min(1.05, Bf(i, s))))]))).attr('fill', 'none').attr('stroke', col7(i)).attr('stroke-width', hl === 'B' ? 3 : 1.8).attr('opacity', hl === 'B' ? 1 : .8));
    kv.append('line').attr('x1', KX(t)).attr('x2', KX(t)).attr('y1', 12).attr('y2', 150).attr('stroke', '#fff').attr('opacity', .7);
    if (!bz) {
      kv.append('text').attr('x', 40).attr('y', 178).attr('fill', '#9ca3af').attr('font-size', 11).attr('text-anchor', 'start').text(`×${pe + 1}`);
      kv.append('text').attr('x', 780).attr('y', 178).attr('fill', '#9ca3af').attr('font-size', 11).attr('text-anchor', 'end').text(`×${pe + 1}`);
      kv.selectAll('.kh').data(d3.range(inner.length)).join('circle').attr('class', 'kh').attr('cx', j => KX(inner[j])).attr('cy', 168).attr('r', hl === 'T' ? 11 : 8).attr('fill', '#fff').attr('stroke', '#1c1c1c').attr('stroke-width', 2).style('cursor', 'ew-resize')
        .call(d3.drag().on('drag', (ev, j) => { const lo = j > 0 ? inner[j - 1] : 0, hi = j < inner.length - 1 ? inner[j + 1] : 1; inner[j] = Math.max(lo, Math.min(hi, KX.invert(ev.x))); pre = ''; draw(); }));
      const groups = d3.rollups(inner, v => v.length, v => v.toFixed(4)).map(([v, m]) => [+v, m]);
      groups.forEach(([v, m]) => { if (m > 1) kv.append('text').attr('x', KX(v)).attr('y', 192).attr('text-anchor', 'middle').attr('fill', '#fbbf24').attr('font-size', 12).attr('font-weight', 700).text(`×${m}`); });
    } else kv.append('text').attr('x', 410).attr('y', 178).attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', 12).text('no inner knots: one polynomial of degree 6 for the whole clock');

    const CAP = {
      S: `<b>S(t)</b>: the curve for the current choices.`,
      c: `<b>c<sub>i</sub></b>: control points. <span style="color:#22c55e">Learned</span>: drag them freely.`,
      B: `<b>B<sub>i,p,T</sub>(t)</b>: the bumps. <span style="color:#9ca3af">Not learned</span>: they are decided by the degree, the knots and the basis rule below.`,
      p: `<b>p</b>: the degree, a knob. Fewer pieces of freedom per bump (1) or smoother cubics (3).`,
      T: `<b>T</b>: the knot vector, the places where the bumps change. Drag the white handles under the bumps.`
    };
    g('e32-cap').innerHTML = hl ? CAP[hl] : 'Green = learned, grey = chosen. Hover a symbol, or tap it to keep it highlighted.';
    g('e32-sub').innerHTML = `S(${(+g('i32t').value).toFixed(2)}) = ` + act.map(i => `<span style="color:${col7(i)}">${bt[i].toFixed(2)}·(${P[i][0].toFixed(0)}, ${P[i][1].toFixed(0)})</span>`).join(' + ') + ` = <b>(${here[0].toFixed(1)}, ${here[1].toFixed(1)})</b>`;
    if (bz) {
      const kB = knotsOf(N - 1, []), diff = d3.max(ts, s => d3.max(d3.range(N), i => Math.abs(bern(i, s) - bspline(i, N - 1, Math.min(s, 1 - 1e-9), kB))));
      g('e32-kn').innerHTML = `A Bézier curve is the B-spline with degree <b>${N - 1}</b> and <b>no inner knots</b> (I checked: the largest difference between the two bump sets is ${diff.toExponential(0)}). Every control point now affects the whole curve; there is no local control.`;
    } else {
      const groups = d3.rollups(inner, v => v.length, v => v.toFixed(4)).map(([v, m]) => [+v, m]);
      g('e32-kn').innerHTML = (groups.length ? groups.map(([v, m]) => { const r = p - m; return `knot at ${v.toFixed(2)} ×${m}: ` + (r >= 0 ? `<b>C<sup>${r}</sup></b>${r === 0 ? ' (corner allowed)' : ''}` : '<b>the curve can break</b>'); }).join(' · ') : 'no inner knots') + `. Rule: smoothness = p − (repeats) = ${p} − m. You can move ${inner.length} inner knot${inner.length === 1 ? '' : 's'} (${N} control points − degree ${p} − 1).`;
    }
  }
  document.querySelectorAll('#m32 .chip').forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
  document.querySelectorAll('#pre32 .chip').forEach(b => b.onclick = () => {
    pre = b.dataset.k; const cnt = N - p - 1;
    if (pre === 'uni') inner = uni(p);
    else { const c = Math.min(cnt, p), r = cnt - c, l = Math.floor(r / 2), rr = r - l;
      inner = [...d3.range(l).map(j => (j + 1) / (l + 1) * 0.5), ...new Array(c).fill(0.5), ...d3.range(rr).map(j => 0.5 + (j + 1) / (rr + 1) * 0.5)]; }
    draw();
  });
  g('i32p').addEventListener('input', () => { p = +g('i32p').value; inner = uni(p); pre = 'uni'; draw(); });
  g('i32t').addEventListener('input', draw);
  g('b32').onclick = () => { P = base(); draw(); };
  draw();
})();
