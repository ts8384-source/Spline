/* ---------- 11 · Position, velocity, acceleration ---------- */
(function () {
  const svg = d3.select('#rf'), tIn = document.getElementById('rf-t');
  const CP = [[60, 280], [160, 20], [560, 40], [740, 260]];
  const bz = (t) => { const u = 1 - t, w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]; return [0, 1].map(k => w.reduce((s, wi, i) => s + wi * CP[i][k], 0)); };
  const bv = (t) => { const u = 1 - t; return [0, 1].map(k => 3 * (u * u * (CP[1][k] - CP[0][k]) + 2 * u * t * (CP[2][k] - CP[1][k]) + t * t * (CP[3][k] - CP[2][k]))); };
  const ba = (t) => [0, 1].map(k => 6 * ((1 - t) * (CP[2][k] - 2 * CP[1][k] + CP[0][k]) + t * (CP[3][k] - 2 * CP[2][k] + CP[1][k])));
  const W = 2 * Math.PI;
  const MODES = {
    speed: {p: t => [60 + 680 * t * t, 165], v: t => [1360 * t, 0], a: () => [1360, 0], sv: .12, sa: .05,
      note: 'Straight road, speeding up: the ticks spread out because the dot covers more road per tick. All of the acceleration is along the path.'},
    circle: {p: t => [400 + 110 * Math.cos(W * t), 165 + 110 * Math.sin(W * t)], v: t => [-110 * W * Math.sin(W * t), 110 * W * Math.cos(W * t)],
      a: t => [-110 * W * W * Math.cos(W * t), -110 * W * W * Math.sin(W * t)], sv: .12, sa: .025,
      note: 'Constant speed (equally spaced ticks) but the direction keeps turning. All of the acceleration is sideways, aimed at the centre of the circle. Changing direction counts as accelerating.'},
    curve: {p: bz, v: bv, a: ba, sv: .12, sa: .04,
      note: 'A cubic Bézier piece: both parts at once. The dot speeds up and slows down along the path and bends sideways around the turns.'}
  };
  let mode = 'curve';
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1], len = a => Math.hypot(a[0], a[1]);
  const arrow = (from, v, col, w) => {
    const to = [from[0] + v[0], from[1] + v[1]], a = Math.atan2(v[1], v[0]), h = 8;
    if (len(v) < 3) return;
    svg.append('line').attr('x1', from[0]).attr('y1', from[1]).attr('x2', to[0]).attr('y2', to[1]).attr('stroke', col).attr('stroke-width', w);
    svg.append('path').attr('d', `M${to[0]},${to[1]}L${to[0] - h * Math.cos(a - .45)},${to[1] - h * Math.sin(a - .45)}L${to[0] - h * Math.cos(a + .45)},${to[1] - h * Math.sin(a + .45)}Z`).attr('fill', col);
  };
  const tick = d3.scaleSequential(d3.interpolateViridis).domain([0, 1]);

  function draw() {
    const t = +tIn.value, M = MODES[mode]; document.getElementById('rf-tv').textContent = t.toFixed(2);
    document.querySelectorAll('#rf-modes .chip').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    svg.selectAll('*').remove();
    svg.append('path').attr('d', d3.line()(d3.range(0, 1.0001, .01).map(M.p))).attr('fill', 'none').attr('stroke', '#555').attr('stroke-width', 2);
    svg.selectAll('.tk').data(d3.range(0, 1.0001, .1)).join('circle').attr('cx', d => M.p(d)[0]).attr('cy', d => M.p(d)[1]).attr('r', 4).attr('fill', d => tick(d));
    const p = M.p(t), v = M.v(t), a = M.a(t), s = len(v) || 1e-9, T = [v[0] / s, v[1] / s], N = [-T[1], T[0]];
    const aT = dot(a, T), aN = dot(a, N);
    arrow(p, [T[0] * aT * M.sa, T[1] * aT * M.sa], '#f9a8d4', 2.5);
    arrow(p, [N[0] * aN * M.sa, N[1] * aN * M.sa], '#f97316', 2.5);
    arrow(p, [a[0] * M.sa, a[1] * M.sa], C.red, 4);
    arrow(p, [v[0] * M.sv, v[1] * M.sv], C.yellow, 4);
    svg.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', 7).attr('fill', '#fff').attr('stroke', C.bg);
    document.getElementById('rf-read').innerHTML =
      `position (${Math.round(p[0])}, ${Math.round(p[1])}) · speed ${Math.round(s)} px per unit of t · acceleration ${Math.round(len(a))}: ` +
      `along the path <b>${Math.round(aT)}</b> (${aT > 1 ? 'speeding up' : aT < -1 ? 'slowing down' : 'steady speed'}), sideways <b>${Math.round(aN)}</b> (${Math.abs(aN) > 1 ? 'bending the path' : 'no bend'})`;
    document.getElementById('rf-note').textContent = M.note;
  }
  tIn.addEventListener('input', draw);
  document.querySelectorAll('#rf-modes .chip').forEach(b => b.addEventListener('click', () => { mode = b.dataset.m; draw(); }));
  let raf = null; const btn = document.getElementById('rf-play');
  btn.onclick = () => {
    if (raf) { cancelAnimationFrame(raf); raf = null; btn.textContent = '▶ play'; return; }
    btn.textContent = '❚❚ pause'; const t0 = performance.now() - (+tIn.value) * 5000;
    const step = now => { tIn.value = ((now - t0) / 5000) % 1; draw(); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };
  draw();
})();
