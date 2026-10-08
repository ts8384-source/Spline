/* ---------- 13 · Knots and the B-spline basis ---------- */
(function () {
  const top = d3.select('#kb'), bot = d3.select('#kc');
  const pIn = document.getElementById('kb-p'), mIn = document.getElementById('kb-m');
  const INNER0 = [1, 2, 3, 4, 5].map(i => i / 6);
  let inner = INNER0.slice(), mult = [1, 1, 1, 1, 1], sel = 2, c = [], hb = null;
  const PAL = ['#3b82f6', '#f97316', '#22c55e', '#e11d48', '#a855f7', '#06b6d4', '#eab308'];
  const col = i => PAL[i % PAL.length], dash = i => i >= PAL.length ? '7 4' : null;
  const ts = d3.range(401).map(i => i / 400);
  const X = d3.scaleLinear([0, 1], [50, 780]), YT = d3.scaleLinear([0, 1.05], [215, 15]), YB = d3.scaleLinear([-0.05, 1.05], [215, 15]);
  const dflt = n => d3.range(n).map(i => 0.5 + 0.38 * Math.sin(1.9 * i + 0.6));
  const knotsOf = p => [...new Array(p + 1).fill(0), ...inner.flatMap((k, j) => new Array(Math.min(mult[j], p + 1)).fill(k)), ...new Array(p + 1).fill(1)];
  const layerT = top.append('g'), hT = top.append('g'), layerB = bot.append('g'), hB = bot.append('g');

  function draw() {
    const p = +pIn.value; mIn.max = p + 1; mult = mult.map(m => Math.min(m, p + 1));
    sel = Math.max(0, Math.min(inner.length - 1, sel)); mIn.value = mult[sel];
    document.getElementById('kb-pv').textContent = p; document.getElementById('kb-mv').textContent = mult[sel];
    const k = knotsOf(p), n = k.length - p - 1;
    if (c.length !== n) c = dflt(n);
    if (hb !== null && hb >= n) hb = null;
    const chips = d3.select('#kb-chips'); chips.selectAll('*').remove();
    const chip = (label, color, on, fn) => { const b = chips.append('button').attr('class', 'chip' + (on ? ' on' : '')).on('click', fn); if (color) b.append('span').attr('class', 'dot').style('background', color); b.append('span').text(label); };
    chip('all bumps', null, hb === null, () => { hb = null; draw(); });
    d3.range(n).forEach(i => chip('bump ' + i, col(i), hb === i, () => { hb = hb === i ? null : i; draw(); }));
    const B = ts.map(t => d3.range(n).map(i => bspline(i, p, t, k)));
    const sums = B.map(r => d3.sum(r)), f = B.map(r => d3.sum(r, (b, i) => b * c[i]));
    const grev = c.map((_, i) => p === 0 ? (k[i] + k[i + 1]) / 2 : d3.sum(k.slice(i + 1, i + p + 1)) / p);

    layerT.selectAll('*').remove();
    layerT.append('path').attr('d', `M50,${YT(0)}H780`).attr('stroke', C.gray).attr('fill', 'none');
    layerT.append('line').attr('x1', 50).attr('x2', 780).attr('y1', YT(1)).attr('y2', YT(1)).attr('stroke', '#555').attr('stroke-dasharray', '3 4');
    layerT.append('text').attr('x', 415).attr('y', YT(1) - 4).attr('text-anchor', 'middle').attr('fill', C.gray).attr('font-size', 11).text('1 (the bumps always add up to this)');
    inner.forEach((kk, j) => layerT.append('line').attr('x1', X(kk)).attr('x2', X(kk)).attr('y1', 15).attr('y2', 215).attr('stroke', j === sel ? C.yellow : '#444').attr('stroke-width', j === sel ? 2 : 1).attr('opacity', j === sel ? .8 : 1));
    const order = d3.range(n).sort((a, b) => (a === hb) - (b === hb));                       // highlighted bump drawn last
    order.forEach(i => {
      const on = hb === i, dim = hb !== null && !on, vals = ts.map((t, s) => [X(t), YT(B[s][i])]);
      layerT.append('path').attr('d', d3.area().x(d => d[0]).y0(YT(0)).y1(d => d[1])(vals)).attr('fill', col(i)).attr('opacity', on ? .45 : dim ? .04 : .16);
      layerT.append('path').attr('d', d3.line()(vals)).attr('fill', 'none').attr('stroke', col(i)).attr('stroke-width', on ? 4 : 2.2)
        .attr('stroke-dasharray', dash(i)).attr('opacity', dim ? .25 : 1);
    });
    d3.range(n).forEach(i => {                                                                  // number each bump at its peak
      const vs = B.map(r => r[i]), m = d3.max(vs); if (m < .15) return;
      const s = vs.indexOf(m), dim = hb !== null && hb !== i;
      layerT.append('text').attr('x', X(ts[s])).attr('y', YT(m) - 6).attr('text-anchor', 'middle').attr('fill', col(i)).attr('font-size', 13).attr('font-weight', 700).attr('opacity', dim ? .3 : 1).text(i);
    });
    layerT.append('text').attr('x', 50).attr('y', 262).attr('fill', C.gray).attr('font-size', 11).text('t = 0');
    layerT.append('text').attr('x', 780).attr('y', 262).attr('text-anchor', 'end').attr('fill', C.gray).attr('font-size', 11).text('t = 1');
    hT.selectAll('g').data(inner.map((_, j) => j)).join('g').each(function (j) {      // data = knot index, so drags stay valid while values change
      const g = d3.select(this), kk = inner[j]; g.selectAll('*').remove();
      d3.range(mult[j]).forEach(r => g.append('circle').attr('cx', X(kk)).attr('cy', 235).attr('r', 9 - r * 2).attr('fill', 'none').attr('stroke', C.yellow).attr('stroke-width', 2));
      g.append('circle').attr('cx', X(kk)).attr('cy', 235).attr('r', 5).attr('fill', j === sel ? C.yellow : '#b0861c');
    }).style('cursor', 'ew-resize').call(d3.drag()
      .on('start', (ev, j) => { sel = j; draw(); })
      .on('drag', (ev, j) => {
        const lo = (j ? inner[j - 1] : 0) + 0.01, hi = (j < inner.length - 1 ? inner[j + 1] : 1) - 0.01;
        inner[j] = Math.max(lo, Math.min(hi, X.invert(ev.x))); draw();
      }));

    layerB.selectAll('*').remove();
    layerB.append('path').attr('d', `M50,${YB(0)}H780`).attr('stroke', C.gray).attr('fill', 'none');
    inner.forEach((kk, j) => layerB.append('line').attr('x1', X(kk)).attr('x2', X(kk)).attr('y1', 15).attr('y2', 215).attr('stroke', j === sel ? C.yellow : '#444').attr('opacity', j === sel ? .8 : 1));
    order.forEach(i => {                                                                         // each weight x bump, faint, under the sum
      const on = hb === i, dim = hb !== null && !on, vals = ts.map((t, s) => [X(t), YB(c[i] * B[s][i])]);
      layerB.append('path').attr('d', d3.area().x(d => d[0]).y0(YB(0)).y1(d => d[1])(vals)).attr('fill', col(i)).attr('opacity', on ? .45 : dim ? .03 : .14);
      layerB.append('path').attr('d', d3.line()(vals)).attr('fill', 'none').attr('stroke', col(i)).attr('stroke-width', on ? 3 : 1.4)
        .attr('stroke-dasharray', dash(i)).attr('opacity', dim ? .2 : .9);
    });
    layerB.append('path').attr('d', d3.line()(c.map((v, i) => [X(grev[i]), YB(v)]))).attr('fill', 'none').attr('stroke', '#666').attr('stroke-dasharray', '4 4');
    layerB.append('path').attr('d', d3.line()(ts.map((t, s) => [X(t), YB(f[s])]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3.5);
    layerB.append('text').attr('x', 56).attr('y', 28).attr('fill', C.gray).attr('font-size', 11).text('curve = sum of (weight × bump)');
    hB.selectAll('circle').data(c.map((_, i) => i)).join('circle').attr('cx', i => X(grev[i])).attr('cy', i => YB(c[i])).attr('r', 10)
      .attr('fill', i => col(i)).attr('stroke', i => hb === i ? '#fff' : C.bg).attr('stroke-width', i => hb === i ? 3.5 : 2).style('cursor', 'ns-resize')
      .attr('opacity', i => hb !== null && hb !== i ? .45 : 1)
      .call(d3.drag().on('drag', (ev, i) => { c[i] = Math.max(0, Math.min(1, YB.invert(ev.y))); draw(); }));
    hB.selectAll('text').data(c.map((_, i) => i)).join('text').attr('x', i => X(grev[i])).attr('y', i => YB(c[i]) + 4).attr('text-anchor', 'middle')
      .attr('fill', '#111').attr('font-size', 11).attr('font-weight', 700).attr('pointer-events', 'none').text(i => i);

    const m = mult[sel], cont = p - m;
    document.getElementById('kb-read').innerHTML =
      `knot vector: [${k.map(v => +v.toFixed(2)).join(', ')}] · <b>${n}</b> bumps · bumps add to ${d3.min(sums).toFixed(3)}–${d3.max(sums).toFixed(3)}` +
      `<br>selected knot at t = ${inner[sel].toFixed(2)} with <b>${m}</b> cop${m === 1 ? 'y' : 'ies'} → ${cont >= 0 ? `continuity <b>C${cont === 0 ? '⁰' : cont === 1 ? '¹' : cont === 2 ? '²' : cont}</b>` : '<b>the curve may jump here</b>'} (degree ${p} − ${m})`;
  }
  pIn.addEventListener('input', draw);
  mIn.addEventListener('input', () => { mult[sel] = +mIn.value; draw(); });
  document.getElementById('kb-reset').onclick = () => { inner = INNER0.slice(); mult = [1, 1, 1, 1, 1]; sel = 2; c = []; draw(); };
  draw();
})();
