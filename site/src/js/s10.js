/* ---------- 10 · Three scenarios: C0, C1, C2 ---------- */
(function () {
  const P0 = [20, 270], P1 = [30, 80], P2 = [105, 45], J = [150, 95], Q3 = [285, 200];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k], len = a => Math.hypot(a[0], a[1]);
  const Q1_lock = sub(mul(J, 2), P2), Q2_c2 = add(sub(P1, mul(P2, 4)), mul(J, 4));
  const SC = [
    {id: 'tr0', Q1: [230, 70], Q2: [270, 120]},
    {id: 'tr1', Q1: Q1_lock, Q2: [270, 150]},
    {id: 'tr2', Q1: Q1_lock, Q2: Q2_c2}
  ];
  const bez = (P, t) => { const u = 1 - t, w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]; return [0, 1].map(k => w.reduce((s, wi, i) => s + wi * P[i][k], 0)); };
  const d1 = (P, t) => { const u = 1 - t; return [0, 1].map(k => 3 * (u * u * (P[1][k] - P[0][k]) + 2 * u * t * (P[2][k] - P[1][k]) + t * t * (P[3][k] - P[2][k]))); };
  const d2 = (P, t) => [0, 1].map(k => 6 * ((1 - t) * (P[2][k] - 2 * P[1][k] + P[0][k]) + t * (P[3][k] - 2 * P[2][k] + P[1][k])));
  const kappa = (P, t) => { const v = d1(P, t), a = d2(P, t); return (v[0] * a[1] - v[1] * a[0]) / len(v) ** 3; };
  const circle = (P, t) => {                                   // osculating circle: centre p + n/k, radius 1/|k|
    const k = kappa(P, t), v = d1(P, t), s = len(v), p = bez(P, t);
    if (Math.abs(k) < 1e-5) return null;
    return {c: add(p, mul([-v[1] / s, v[0] / s], 1 / k)), r: 1 / Math.abs(k)};
  };
  const arrow = (g, from, v, col, w) => {
    const to = add(from, v), a = Math.atan2(v[1], v[0]), h = 7;
    g.append('line').attr('x1', from[0]).attr('y1', from[1]).attr('x2', to[0]).attr('y2', to[1]).attr('stroke', col).attr('stroke-width', w);
    g.append('path').attr('d', `M${to[0]},${to[1]}L${to[0] - h * Math.cos(a - .45)},${to[1] - h * Math.sin(a - .45)}L${to[0] - h * Math.cos(a + .45)},${to[1] - h * Math.sin(a + .45)}Z`).attr('fill', col);
  };
  const tIn = document.getElementById('tr-t');

  function draw() {
    const tau = +tIn.value; document.getElementById('tr-tv').textContent = tau.toFixed(2);
    SC.forEach(s => {
      const svg = d3.select('#' + s.id), A = [P0, P1, P2, J], B = [J, s.Q1, s.Q2, Q3];
      svg.selectAll('*').remove();
      [[A, C.blue], [B, C.green]].forEach(([P, col]) => svg.append('path').attr('d', d3.line()(d3.range(0, 1.0001, .01).map(t => bez(P, t))))
        .attr('fill', 'none').attr('stroke', col).attr('stroke-width', 3.5));
      [[A, C.blue, 1], [B, C.green, 0]].forEach(([P, col, t]) => {
        const c = circle(P, t); if (c) svg.append('circle').attr('cx', c.c[0]).attr('cy', c.c[1]).attr('r', c.r).attr('fill', 'none').attr('stroke', col).attr('stroke-dasharray', '5 4').attr('opacity', .85);
      });
      svg.append('circle').attr('cx', J[0]).attr('cy', J[1]).attr('r', 5).attr('fill', '#fff');
      const onA = tau < 1, P = onA ? A : B, t = onA ? tau : tau - 1, p = bez(P, t);
      arrow(svg, p, mul(d1(P, t), .3), C.yellow, 3);
      arrow(svg, p, mul(d2(P, t), .08), C.red, 3);
      svg.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 6).attr('fill', '#fff').attr('stroke', C.bg);
      const dv = len(sub(d1(A, 1), d1(B, 0))), da = len(sub(d2(A, 1), d2(B, 0)));
      const cA = circle(A, 1), cB = circle(B, 0), rr = c => c ? Math.round(c.r) + ' px' : 'straight';
      document.getElementById(s.id + '-r').innerHTML =
        `velocity jump ${dv.toFixed(0)} · acceleration jump ${da.toFixed(0)}<br>bend radius before ${rr(cA)} · after ${rr(cB)}`;
    });
  }
  tIn.addEventListener('input', draw);
  document.getElementById('tr-before').onclick = () => { tIn.value = 0.97; draw(); };
  document.getElementById('tr-after').onclick = () => { tIn.value = 1.03; draw(); };
  let raf = null; const btn = document.getElementById('tr-play');
  btn.onclick = () => {
    if (raf) { cancelAnimationFrame(raf); raf = null; btn.textContent = '▶ play'; return; }
    btn.textContent = '❚❚ pause'; const t0 = performance.now() - (+tIn.value) * 3500;
    const step = now => { tIn.value = (((now - t0) / 3500) % 2); draw(); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };
  draw();
})();
