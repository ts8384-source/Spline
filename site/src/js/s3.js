/* ---------- 3 · de Casteljau ---------- */
(function () {
  const svg = d3.select('#dc'), W = 800, H = 380;
  const P = [[90, 310], [190, 60], [560, 40], [700, 290]], P0 = P.map(p => p.slice());
  const cols = [C.blue, C.green, C.yellow], tIn = document.getElementById('dc-t');
  const layer = svg.append('g'), handles = svg.append('g');
  const bez = (pts, t) => { let q = pts; while (q.length > 1) q = q.slice(1).map((b, i) => [(1 - t) * q[i][0] + t * b[0], (1 - t) * q[i][1] + t * b[1]]); return q[0]; };
  function draw() {
    const t = +tIn.value; document.getElementById('dc-tv').textContent = t.toFixed(2);
    const levels = [P]; while (levels[levels.length - 1].length > 1) {
      const q = levels[levels.length - 1];
      levels.push(q.slice(1).map((b, i) => [(1 - t) * q[i][0] + t * b[0], (1 - t) * q[i][1] + t * b[1]]));
    }
    layer.selectAll('*').remove();
    const full = d3.range(0, 1.0001, 0.01).map(s => bez(P, s));
    layer.append('path').attr('d', d3.line()(full)).attr('fill', 'none').attr('stroke', '#333').attr('stroke-width', 2);
    const trail = d3.range(0, t + 1e-9, 0.01).map(s => bez(P, s));
    layer.append('path').attr('d', d3.line()(trail)).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
    levels.slice(0, -1).forEach((L, k) => {
      layer.append('path').attr('d', d3.line()(L)).attr('fill', 'none').attr('stroke', cols[k]).attr('stroke-width', 2).attr('opacity', .9);
      if (k > 0) layer.selectAll(null).data(L).join('circle').attr('cx', d => d[0]).attr('cy', d => d[1]).attr('r', 5).attr('fill', cols[k]);
    });
    const e = levels[levels.length - 1][0];
    layer.append('circle').attr('cx', e[0]).attr('cy', e[1]).attr('r', 8).attr('fill', C.red);
    handles.selectAll('circle').data(P).join('circle').attr('r', 9).attr('fill', C.blue).attr('cx', d => d[0]).attr('cy', d => d[1])
      .style('cursor', 'grab')
      .call(d3.drag().on('drag', function (ev, d) {
        d[0] = Math.max(10, Math.min(W - 10, ev.x)); d[1] = Math.max(10, Math.min(H - 10, ev.y)); draw();
      }));
  }
  tIn.addEventListener('input', draw);
  document.getElementById('dc-reset').onclick = () => { P.forEach((p, i) => { p[0] = P0[i][0]; p[1] = P0[i][1]; }); draw(); };
  let raf = null; const btn = document.getElementById('dc-play');
  btn.onclick = () => {
    if (raf) { cancelAnimationFrame(raf); raf = null; btn.textContent = '▶ play'; return; }
    btn.textContent = '❚❚ pause'; let t0 = performance.now() - (+tIn.value) * 4000;
    const step = now => { const t = ((now - t0) / 4000) % 1; tIn.value = t; draw(); raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  };
  draw();
})();

