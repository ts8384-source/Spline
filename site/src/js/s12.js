/* ---------- 12 · Derivative ladder ---------- */
(function () {
  const svg = d3.select('#dl'), tIn = document.getElementById('dl-t');
  const P0 = [40, 60, 260, 250]; let p = P0.slice();
  const X = d3.scaleLinear([0, 1], [70, 780]);
  const BANDS = [[10, 170], [200, 360], [390, 530]];
  const f0 = t => { const u = 1 - t; return u * u * u * p[0] + 3 * u * u * t * p[1] + 3 * u * t * t * p[2] + t * t * t * p[3]; };
  const f1 = t => { const u = 1 - t; return 3 * (u * u * (p[1] - p[0]) + 2 * u * t * (p[2] - p[1]) + t * t * (p[3] - p[2])); };
  const f2 = t => 6 * ((1 - t) * (p[2] - 2 * p[1] + p[0]) + t * (p[3] - 2 * p[2] + p[1]));
  const ts = d3.range(0, 1.0001, 0.005);
  const mk = (f, band, fixed) => {
    const v = ts.map(f), lo = fixed ? fixed[0] : Math.min(0, d3.min(v)), hi = fixed ? fixed[1] : Math.max(0, d3.max(v)), pad = (hi - lo) * .12 || 1;
    return d3.scaleLinear([lo - pad, hi + pad], [band[1], band[0]]);
  };
  const layer = svg.append('g'), handles = svg.append('g');

  function draw() {
    const t = +tIn.value; document.getElementById('dl-tv').textContent = t.toFixed(2);
    const Y = [mk(f0, BANDS[0], [0, 300]), mk(f1, BANDS[1]), mk(f2, BANDS[2])], F = [f0, f1, f2];
    const cols = [C.blue, C.yellow, C.red], names = ['position x(t)', "velocity x′(t) = slope of the graph above", "acceleration x″(t) = slope of the graph above"];
    layer.selectAll('*').remove();
    BANDS.forEach((b, i) => {
      layer.append('rect').attr('x', 60).attr('y', b[0]).attr('width', 730).attr('height', b[1] - b[0]).attr('fill', '#202020').attr('rx', 6);
      if (i > 0) layer.append('line').attr('x1', 60).attr('x2', 790).attr('y1', Y[i](0)).attr('y2', Y[i](0)).attr('stroke', '#555').attr('stroke-dasharray', '3 4');
      layer.append('text').attr('x', 68).attr('y', b[0] + 16).attr('fill', C.gray).attr('font-size', 12).text(names[i]);
    });
    // position curve, coloured by the sign of the acceleration (bend)
    for (let k = 0; k < ts.length - 1; k++) {
      const up = f2((ts[k] + ts[k + 1]) / 2) >= 0;
      layer.append('line').attr('x1', X(ts[k])).attr('y1', Y[0](f0(ts[k]))).attr('x2', X(ts[k + 1])).attr('y2', Y[0](f0(ts[k + 1])))
        .attr('stroke', up ? '#22c55e' : '#f97316').attr('stroke-width', 3.5);
    }
    [1, 2].forEach(i => layer.append('path').attr('d', d3.line()(ts.map(s => [X(s), Y[i](F[i](s))]))).attr('fill', 'none').attr('stroke', cols[i]).attr('stroke-width', 3));
    layer.append('line').attr('x1', X(t)).attr('x2', X(t)).attr('y1', 10).attr('y2', 530).attr('stroke', '#fff').attr('opacity', .6).attr('stroke-dasharray', '4 4');
    // tangent lines: slope of band i is the value of band i+1
    [0, 1].forEach(i => {
      const x0 = F[i](t), s = F[i + 1](t), h = .14, a = [X(t - h), Y[i](x0 - h * s)], b = [X(t + h), Y[i](x0 + h * s)];
      layer.append('line').attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1]).attr('stroke', cols[i + 1]).attr('stroke-width', 3).attr('stroke-linecap', 'round');
    });
    [0, 1, 2].forEach(i => layer.append('circle').attr('cx', X(t)).attr('cy', Y[i](F[i](t))).attr('r', 6.5).attr('fill', '#fff').attr('stroke', C.bg));
    layer.append('path').attr('d', d3.line()(p.map((v, i) => [X(i / 3), Y[0](v)]))).attr('fill', 'none').attr('stroke', '#666').attr('stroke-dasharray', '4 4');
    handles.selectAll('circle').data([0, 1, 2, 3]).join('circle').attr('cx', i => X(i / 3)).attr('cy', i => Y[0](p[i])).attr('r', 9).attr('fill', C.blue).style('cursor', 'ns-resize')
      .call(d3.drag().on('drag', (ev, i) => { p[i] = Math.max(0, Math.min(300, Y[0].invert(ev.y))); draw(); }));
    const a = f2(t);
    document.getElementById('dl-read').innerHTML =
      `t = ${t.toFixed(2)}: position <b>${f0(t).toFixed(0)}</b> · velocity <b>${f1(t).toFixed(0)}</b> (${f1(t) > 1 ? 'rising' : f1(t) < -1 ? 'falling' : 'flat'}) · acceleration <b>${a.toFixed(0)}</b> (the top graph is bending ${Math.abs(a) < 1 ? 'not at all' : a > 0 ? 'upward, like a smile' : 'downward, like a frown'})`;
  }
  tIn.addEventListener('input', draw);
  document.getElementById('dl-reset').onclick = () => { p = P0.slice(); draw(); };
  let raf = null; const btn = document.getElementById('dl-play');
  btn.onclick = () => {
    if (raf) { cancelAnimationFrame(raf); raf = null; btn.textContent = '▶ play'; return; }
    btn.textContent = '❚❚ pause'; const t0 = performance.now() - (+tIn.value) * 5000;
    const step = now => { tIn.value = ((now - t0) / 5000) % 1; draw(); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };
  draw();
})();
