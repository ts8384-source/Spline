/* ---------- 5 · t is a clock ---------- */
(function () {
  const plane = d3.select('#clk'), gx = d3.select('#clkx'), gy = d3.select('#clky'), S = 400;
  const P0 = [[60, 330], [100, 260], [340, 40], [350, 320]], P = P0.map(p => p.slice());
  const tIn = document.getElementById('clk-t'), ts = d3.range(0, 1.0001, 0.01);
  const bez = s => { const u = 1 - s, w = [u * u * u, 3 * u * u * s, 3 * u * s * s, s * s * s]; return [0, 1].map(k => w.reduce((a, wi, i) => a + wi * P[i][k], 0)); };
  const lerp = (a, b, s) => [(1 - s) * a[0] + s * b[0], (1 - s) * a[1] + s * b[1]];
  const yellow = s => { const q = [0, 1, 2].map(i => lerp(P[i], P[i + 1], s)); return [lerp(q[0], q[1], s), lerp(q[1], q[2], s)]; };
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const tick = d3.scaleSequential(d3.interpolateViridis).domain([0, 1]);
  const layer = plane.append('g'), handles = plane.append('g');

  function graph(svg, name, vals, t) {
    svg.selectAll('*').remove();
    const x = d3.scaleLinear([0, 1], [44, 388]), y = d3.scaleLinear([0, S], [128, 14]);
    svg.append('path').attr('d', `M44,14V128H388`).attr('fill', 'none').attr('stroke', C.gray);
    svg.append('path').attr('d', d3.line()(vals.map((v, i) => [x(ts[i]), y(v)]))).attr('fill', 'none').attr('stroke', C.blue).attr('stroke-width', 2.5);
    svg.selectAll('.tk').data(d3.range(0, 1.0001, 0.1)).join('circle').attr('cx', d => x(d)).attr('cy', d => y(vals[Math.round(d * 100)]))
      .attr('r', 4).attr('fill', d => tick(d));
    svg.append('line').attr('x1', x(t)).attr('x2', x(t)).attr('y1', 14).attr('y2', 128).attr('stroke', '#fff').attr('opacity', .7);
    svg.append('circle').attr('cx', x(t)).attr('cy', y(vals[Math.round(t * 100)] ?? vals[100])).attr('r', 6).attr('fill', C.red);
    svg.append('text').attr('x', 8).attr('y', 20).attr('fill', C.gray).attr('font-size', 12).text(name);
    svg.append('text').attr('x', 388).attr('y', 144).attr('text-anchor', 'end').attr('fill', C.gray).attr('font-size', 12).text('t →');
  }

  function draw() {
    const t = +tIn.value; document.getElementById('clk-tv').textContent = t.toFixed(2);
    const pts = ts.map(bez), cur = bez(t);
    layer.selectAll('*').remove();
    layer.append('path').attr('d', d3.line()(P)).attr('fill', 'none').attr('stroke', '#555').attr('stroke-dasharray', '4 4');
    layer.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', '#444').attr('stroke-width', 2);
    layer.append('path').attr('d', d3.line()(pts.slice(0, Math.round(t * 100) + 1).concat([cur]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
    const [a, b] = yellow(t);
    layer.append('line').attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1]).attr('stroke', C.yellow).attr('stroke-width', 3);
    layer.selectAll('.tk').data(d3.range(0, 1.0001, 0.1)).join('circle').attr('cx', d => bez(d)[0]).attr('cy', d => bez(d)[1]).attr('r', 5).attr('fill', d => tick(d)).attr('stroke', C.bg);
    layer.append('circle').attr('cx', cur[0]).attr('cy', cur[1]).attr('r', 8).attr('fill', C.red);
    handles.selectAll('circle').data(P).join('circle').attr('r', 8).attr('fill', C.blue).attr('cx', d => d[0]).attr('cy', d => d[1]).style('cursor', 'grab')
      .call(d3.drag().on('drag', (ev, d) => { d[0] = Math.max(10, Math.min(S - 10, ev.x)); d[1] = Math.max(10, Math.min(S - 10, ev.y)); draw(); }));
    graph(gx, 'x(t)', pts.map(p => p[0]), t);
    graph(gy, 'height y(t)', pts.map(p => S - p[1]), t);
    const per = d3.range(10).map(k => d3.sum(d3.range(10), i => dist(pts[10 * k + i], pts[10 * k + i + 1])));
    document.getElementById('clk-read').innerHTML =
      `t = ${t.toFixed(2)} → point (${Math.round(cur[0])}, ${Math.round(cur[1])}) · speed now = 3 × ${Math.round(dist(a, b))} = <b>${Math.round(3 * dist(a, b))}</b> px per unit of t` +
      `<br>distance covered in each tenth of t (colour order): ${per.map(Math.round).join(' · ')} px`;
  }
  tIn.addEventListener('input', draw);
  document.getElementById('clk-reset').onclick = () => { P.forEach((p, i) => { p[0] = P0[i][0]; p[1] = P0[i][1]; }); draw(); };
  let raf = null; const btn = document.getElementById('clk-play');
  btn.onclick = () => {
    if (raf) { cancelAnimationFrame(raf); raf = null; btn.textContent = '▶ play'; return; }
    btn.textContent = '❚❚ pause'; const t0 = performance.now() - (+tIn.value) * 5000;
    const step = now => { tIn.value = ((now - t0) / 5000) % 1; draw(); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };
  draw();
})();

