/* ---------- 9 · Continuity at a join ---------- */
(function () {
  const W = 800, H = 420, svg = d3.select('#ct');
  const P0 = [[60, 340], [150, 60], [350, 150], [400, 230], [560, 265], [640, 370], [745, 90]];   // P0 P1 P2 J Q1 Q2 Q3
  const NAMES = ['P0', 'P1', 'P2', 'J', 'Q1', 'Q2', 'Q3'];
  let pts = P0.map(p => p.slice()), mode = 0;
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const len = a => Math.hypot(a[0], a[1]);
  const bez = (P, t) => { const u = 1 - t, w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]; return [0, 1].map(k => w.reduce((s, wi, i) => s + wi * P[i][k], 0)); };
  const d1 = (P, t) => { const u = 1 - t; return [0, 1].map(k => 3 * (u * u * (P[1][k] - P[0][k]) + 2 * u * t * (P[2][k] - P[1][k]) + t * t * (P[3][k] - P[2][k]))); };
  const d2 = (P, t) => [0, 1].map(k => 6 * ((1 - t) * (P[2][k] - 2 * P[1][k] + P[0][k]) + t * (P[3][k] - 2 * P[2][k] + P[1][k])));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const layer = svg.append('g'), handles = svg.append('g');

  function enforce() {
    if (mode === 1 || mode === 2) pts[4] = sub(mul(pts[3], 2), pts[2]);                              // Q1 = 2J - P2
    if (mode === 2) pts[5] = add(sub(pts[1], mul(pts[2], 4)), mul(pts[3], 4));                      // Q2 = P1 - 4 P2 + 4 J
    if (mode === 3) {                                                                              // G1: Q1 may slide along the line through P2 and J, never off it
      const d = sub(pts[3], pts[2]), sc = Math.max(0.15, ((pts[4][0] - pts[3][0]) * d[0] + (pts[4][1] - pts[3][1]) * d[1]) / (d[0] * d[0] + d[1] * d[1]));
      pts[4] = add(pts[3], mul(d, sc));
    }
  }
  function arrow(from, v, col, w) {
    const to = add(from, mul(v, 0.45)), a = Math.atan2(v[1], v[0]), h = 11;
    layer.append('line').attr('x1', from[0]).attr('y1', from[1]).attr('x2', to[0]).attr('y2', to[1]).attr('stroke', col).attr('stroke-width', w);
    layer.append('path').attr('d', `M${to[0]},${to[1]}L${to[0] - h * Math.cos(a - .4)},${to[1] - h * Math.sin(a - .4)}L${to[0] - h * Math.cos(a + .4)},${to[1] - h * Math.sin(a + .4)}Z`).attr('fill', col);
  }

  function draw() {
    enforce();
    document.querySelectorAll('#ct-modes [data-m]').forEach(b => b.classList.toggle('on', +b.dataset.m === mode));
    layer.selectAll('*').remove();
    const A = pts.slice(0, 4), B = pts.slice(3, 7), J = pts[3];
    [[A, C.blue], [B, C.green]].forEach(([P, col]) => {
      layer.append('path').attr('d', d3.line()(P)).attr('fill', 'none').attr('stroke', '#555').attr('stroke-dasharray', '4 4');
      const tips = [];
      d3.range(0, 1.0001, 1 / 40).forEach(t => {
        const p = bez(P, t), v = d1(P, t), a = d2(P, t), sp = len(v) || 1e-9;
        const k = (v[0] * a[1] - v[1] * a[0]) / sp ** 3, L = clamp(k * 2500, -85, 85), n = [-v[1] / sp, v[0] / sp], tip = add(p, mul(n, L));
        tips.push(tip);
        layer.append('line').attr('x1', p[0]).attr('y1', p[1]).attr('x2', tip[0]).attr('y2', tip[1]).attr('stroke', col).attr('opacity', .35);
      });
      layer.append('path').attr('d', d3.line()(tips)).attr('fill', 'none').attr('stroke', col).attr('opacity', .8);
      layer.append('path').attr('d', d3.line()(d3.range(0, 1.0001, .01).map(t => bez(P, t)))).attr('fill', 'none').attr('stroke', col).attr('stroke-width', 3.5);
    });
    const vA = d1(A, 1), vB = d1(B, 0);
    arrow(J, vA, C.blue, 6); arrow(J, vB, C.yellow, 3);
    layer.append('circle').attr('cx', J[0]).attr('cy', J[1]).attr('r', 7).attr('fill', '#fff');
    layer.selectAll('.lb').data(pts).join('text').attr('x', d => d[0] + 11).attr('y', d => d[1] - 11).attr('fill', C.gray).attr('font-size', 12)
      .attr('pointer-events', 'none').text((d, i) => NAMES[i]);

    const derived = i => ((mode === 1 || mode === 2) && i === 4) || (mode === 2 && i === 5);
    handles.selectAll('circle').data(pts).join('circle').attr('cx', d => d[0]).attr('cy', d => d[1]).attr('r', 8)
      .attr('fill', (d, i) => derived(i) ? C.bg : i < 3 ? C.blue : i === 3 ? '#fff' : C.green)
      .attr('stroke', (d, i) => i < 3 ? C.blue : i === 3 ? '#fff' : C.green).attr('stroke-width', 2.5)
      .attr('opacity', (d, i) => derived(i) ? .8 : 1).style('cursor', (d, i) => derived(i) ? 'not-allowed' : 'grab').attr('pointer-events', (d, i) => derived(i) ? 'none' : 'all')
      .call(d3.drag().on('drag', (ev, d) => { d[0] = clamp(ev.x, 10, W - 10); d[1] = clamp(ev.y, 10, H - 10); draw(); }));

    const vJ = len(sub(vA, vB)), aJ = len(sub(d2(A, 1), d2(B, 0)));
    const cross = (vA[0] * vB[1] - vA[1] * vB[0]) / ((len(vA) * len(vB)) || 1), sameDir = Math.abs(cross) < 1e-6 && (vA[0] * vB[0] + vA[1] * vB[1]) > 0;
    const level = vJ < .5 ? (aJ < .5 ? 'C²' : 'C¹') : sameDir ? 'G¹ only (same direction, different speed)' : 'C⁰', free = mode === 3 ? '6 points plus Q1 slid along a line' : `${7 - Math.min(mode, 2)} of 7`;
    document.getElementById('ct-read').innerHTML =
      `Continuity at the join: <b>${level}</b> · velocity jump ${vJ.toFixed(1)} px per unit of t · acceleration jump ${aJ.toFixed(1)} · free control points: <b>${free}</b>` +
      (mode === 1 || mode === 2 ? ' (hollow dots are determined by the lock)' : mode === 3 ? ' (drag Q1 along the line: the angle stays equal, the length changes)' : '');
  }
  document.querySelectorAll('#ct-modes [data-m]').forEach(b => b.addEventListener('click', () => { mode = +b.dataset.m; draw(); }));
  document.getElementById('ct-reset').addEventListener('click', () => { pts = P0.map(p => p.slice()); draw(); });
  draw();
})();
