/* ---------- 7 · Knots on a bouncing ball ---------- */
(function () {
  const p = 3, N = 140, V = 4.4, X0 = 0.3, K = [1, 2, 3, 4].map(k => (k - X0) / V);   // bounce times
  const tri = t => { const u = (((X0 + V * t) % 2) + 2) % 2; return u <= 1 ? u : 2 - u; };
  let seed = 7;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
  const ts = d3.range(N).map(i => i / (N - 1)), z = ts.map(gauss), truth = ts.map(tri);
  const grid = d3.range(0, 1.00001, 0.0025), gt = grid.map(tri);
  const svg = d3.select('#kn'), sb = d3.select('#knb');
  const x = d3.scaleLinear([0, 1], [40, 780]), y = d3.scaleLinear([-0.1, 1.1], [300, 15]), yb = d3.scaleLinear([0, 1], [105, 10]);

  function solve(A, b) {
    const n = b.length;
    for (let c = 0; c < n; c++) {
      let q = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[q][c])) q = r;
      [A[c], A[q]] = [A[q], A[c]]; [b[c], b[q]] = [b[q], b[c]];
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; }
    }
    const s = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) s[r] = (b[r] - d3.sum(d3.range(r + 1, n), k => A[r][k] * s[k])) / A[r][r];
    return s;
  }
  const kv = (m, mult) => {
    const inner = d3.range(1, m + 1).map(i => i / (m + 1)), bk = K.flatMap(t => new Array(mult).fill(t));
    return [...new Array(p + 1).fill(0), ...inner.concat(bk).sort(d3.ascending), ...new Array(p + 1).fill(1)];
  };
  function fit(knots, ys) {
    const n = knots.length - p - 1, B = ts.map(t => d3.range(n).map(i => bspline(i, p, t, knots)));
    const A = d3.range(n).map(r => d3.range(n).map(c => d3.sum(B, row => row[r] * row[c]) + (r === c ? 1e-9 : 0)));
    const c = solve(A, d3.range(n).map(r => d3.sum(B, (row, k) => row[r] * ys[k])));
    return grid.map(t => d3.sum(c, (ci, i) => ci * bspline(i, p, t, knots)));
  }
  const score = f => {
    const rms = Math.sqrt(d3.mean(f, (v, i) => (v - gt[i]) ** 2));
    const near = d3.max(f, (v, i) => K.some(b => Math.abs(grid[i] - b) < 0.02) ? Math.abs(v - gt[i]) : 0);
    return `RMS error ${rms.toFixed(3)} · worst miss near a bounce ${near.toFixed(3)}`;
  };

  function draw() {
    const noise = +document.getElementById('kn-noise').value, u = +document.getElementById('kn-u').value, m = +document.getElementById('kn-m').value;
    document.getElementById('kn-noisev').textContent = noise.toFixed(3);
    document.getElementById('kn-uv').textContent = u; document.getElementById('kn-mv').textContent = m;
    const ys = truth.map((v, i) => v + noise * z[i]);
    const kU = kv(u, 0), kB = kv(u, m), fU = fit(kU, ys), fB = fit(kB, ys);
    svg.selectAll('*').remove(); sb.selectAll('*').remove();
    [0, 1].forEach(w => svg.append('line').attr('x1', 40).attr('x2', 780).attr('y1', y(w)).attr('y2', y(w)).attr('stroke', '#555').attr('stroke-dasharray', '4 4'));
    svg.append('text').attr('x', 44).attr('y', y(1) - 4).attr('fill', C.gray).attr('font-size', 11).text('wall');
    svg.append('text').attr('x', 44).attr('y', y(0) + 14).attr('fill', C.gray).attr('font-size', 11).text('wall');
    svg.append('text').attr('x', 780).attr('y', 326).attr('text-anchor', 'end').attr('fill', C.gray).attr('font-size', 11).text('time t →');
    K.forEach(b => svg.append('line').attr('x1', x(b)).attr('x2', x(b)).attr('y1', 15).attr('y2', 300).attr('stroke', C.yellow).attr('opacity', .18));
    svg.append('path').attr('d', d3.line()(grid.map((t, i) => [x(t), y(gt[i])]))).attr('fill', 'none').attr('stroke', '#777').attr('stroke-width', 1.5);
    svg.selectAll('.d').data(ts).join('circle').attr('cx', t => x(t)).attr('cy', (t, i) => y(ys[i])).attr('r', 2.4).attr('fill', '#ddd').attr('opacity', .6);
    const line = f => d3.line()(grid.map((t, i) => [x(t), y(f[i])]));
    svg.append('path').attr('d', line(fU)).attr('fill', 'none').attr('stroke', C.blue).attr('stroke-width', 3);
    svg.append('path').attr('d', line(fB)).attr('fill', 'none').attr('stroke', C.yellow).attr('stroke-width', 3);
    const ticks = (s, ks, col, h, base) => { const seen = {}; ks.slice(p + 1, ks.length - p - 1).forEach(v => { const r = seen[v] = (seen[v] || 0) + 1; s.append('line').attr('x1', x(v)).attr('x2', x(v)).attr('y1', base - (r - 1) * 5).attr('y2', base - (r - 1) * 5 - 4).attr('stroke', col).attr('stroke-width', 2); }); };
    ticks(svg, kU, C.blue, 4, 318); ticks(svg, kB.filter(v => K.includes(v)).length ? kB.filter(v => v === 0 || v === 1 || K.includes(v)) : [], C.yellow, 4, 310);
    // basis functions for the yellow knot vector
    const nb = kB.length - p - 1;
    d3.range(nb).forEach(i => sb.append('path').attr('d', d3.line()(d3.range(0, 1.00001, 0.004).map(t => [x(t), yb(bspline(i, p, t, kB))])))
      .attr('fill', 'none').attr('stroke', d3.schemeTableau10[i % 10]).attr('stroke-width', 1.4).attr('opacity', .85));
    K.forEach(b => sb.append('line').attr('x1', x(b)).attr('x2', x(b)).attr('y1', 10).attr('y2', 105).attr('stroke', C.yellow).attr('opacity', .25));
    sb.append('text').attr('x', 44).attr('y', 14).attr('fill', C.gray).attr('font-size', 11).text(`bump functions (${nb}), yellow knot vector`);
    document.getElementById('kn-read').innerHTML =
      `<span class="blue">blue</span> (${kU.length - 2 * (p + 1)} knots): ${score(fU)}<br><span class="yellow">yellow</span> (${kB.length - 2 * (p + 1)} knots, bounce knots ×${m}, continuity C<sup>${p - m}</sup> there): ${score(fB)}`;
  }
  ['kn-noise', 'kn-u', 'kn-m'].forEach(id => document.getElementById(id).addEventListener('input', draw));
  draw();
})();

