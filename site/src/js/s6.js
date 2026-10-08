/* ---------- 6 · Why t? regression y=f(x) vs parametric ---------- */
(function () {
  const L = d3.select('#rg'), R = d3.select('#rgt'), S = 400;
  const SHAPES = {
    hill: [[50, 330], [130, 60], [270, 60], [350, 330]],
    hairpin: [[60, 340], [385, 340], [385, 60], [60, 60]],
    loop: [[130, 330], [350, 40], [50, 40], [270, 330]]
  };
  const NOTES = {
    hill: 'This one is already a function of x, so regression copes: the error is small. Regression is fine <i>when the curve never doubles back</i>.',
    hairpin: 'The curve goes right, then turns back left, like a ball bouncing off a wall and returning. Most x values are visited twice.',
    loop: 'A loop crosses itself, so near the middle one x is visited three times.'
  };
  let shape = 'loop';
  const xIn = document.getElementById('rg-x'), dIn = document.getElementById('rg-d');
  const bez = (P, s) => { const u = 1 - s, w = [u * u * u, 3 * u * u * s, 3 * u * s * s, s * s * s]; return [0, 1].map(k => w.reduce((a, wi, i) => a + wi * P[i][k], 0)); };

  function polyfit(xs, ys, deg) {                       // least squares on x scaled to [-1,1]
    const m = deg + 1, A = Array.from({length: m}, () => new Array(m + 1).fill(0));
    xs.forEach((x, k) => {
      const u = (x - 200) / 200, pw = [1];
      for (let i = 1; i < 2 * m; i++) pw.push(pw[i - 1] * u);
      for (let r = 0; r < m; r++) { for (let c = 0; c < m; c++) A[r][c] += pw[r + c]; A[r][m] += pw[r] * ys[k]; }
    });
    for (let c = 0; c < m; c++) {                       // Gaussian elimination, partial pivoting
      let p = c; for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]];
      for (let r = c + 1; r < m; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k <= m; k++) A[r][k] -= f * A[c][k]; }
    }
    const co = new Array(m).fill(0);
    for (let r = m - 1; r >= 0; r--) co[r] = (A[r][m] - d3.sum(d3.range(r + 1, m), k => A[r][k] * co[k])) / A[r][r];
    return x => { const u = (x - 200) / 200; return co.reduceRight((a, c) => a * u + c, 0); };
  }

  function draw() {
    const P = SHAPES[shape], xs0 = +xIn.value, deg = +dIn.value;
    document.getElementById('rg-xv').textContent = xs0; document.getElementById('rg-dv').textContent = deg;
    document.querySelectorAll('#rg-shapes .chip').forEach(b => b.classList.toggle('on', b.dataset.s === shape));
    const ts = d3.range(0, 1.00001, 0.0025), pts = ts.map(s => bez(P, s));
    const f = polyfit(pts.map(p => p[0]), pts.map(p => p[1]), deg);
    const xmin = d3.min(pts, p => p[0]), xmax = d3.max(pts, p => p[0]);
    const rms = Math.sqrt(d3.mean(pts, p => (f(p[0]) - p[1]) ** 2));
    const hits = [];                                   // parameter values where x(t) = x*
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i][0] - xs0, b = pts[i + 1][0] - xs0;
      if (a === 0 || a * b < 0) { const w = a === b ? 0 : a / (a - b), t = ts[i] + w * (ts[i + 1] - ts[i]); hits.push([t, bez(P, t)[1]]); }
    }
    const fx = d3.range(xmin, xmax + 1, 2);
    const base = (svg, title) => {
      svg.selectAll('*').remove();
      svg.append('line').attr('x1', xs0).attr('x2', xs0).attr('y1', 0).attr('y2', S).attr('stroke', '#fff').attr('stroke-dasharray', '5 4').attr('opacity', .7);
      svg.append('text').attr('x', 10).attr('y', 20).attr('fill', C.gray).attr('font-size', 13).text(title);
    };
    base(L, 'regression: y = f(x)');
    L.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', '#666').attr('stroke-width', 2.5);
    L.append('path').attr('d', d3.line()(fx.map(x => [x, f(x)]))).attr('fill', 'none').attr('stroke', '#f97316').attr('stroke-width', 3);
    L.selectAll('.h').data(hits).join('circle').attr('cx', xs0).attr('cy', d => d[1]).attr('r', 6).attr('fill', C.yellow);
    if (xs0 >= xmin && xs0 <= xmax) L.append('circle').attr('cx', xs0).attr('cy', f(xs0)).attr('r', 6).attr('fill', 'none').attr('stroke', '#f97316').attr('stroke-width', 3);
    L.append('text').attr('x', 10).attr('y', S - 12).attr('fill', '#f97316').attr('font-size', 12).text(`fitted curve · RMS miss ${rms.toFixed(1)} px`);
    base(R, 'with t: (x(t), y(t))');
    R.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
    const col = d3.scaleSequential(d3.interpolateViridis).domain([0, 1]);
    R.selectAll('.h').data(hits).join('circle').attr('cx', xs0).attr('cy', d => d[1]).attr('r', 6.5).attr('fill', d => col(d[0])).attr('stroke', C.bg);
    R.selectAll('.l').data(hits).join('text').attr('x', xs0 + 10).attr('y', d => d[1] - 8).attr('fill', d => col(d[0])).attr('font-size', 12).text(d => 't=' + d[0].toFixed(2));
    const ys = hits.map(h => Math.round(h[1]));
    document.getElementById('rg-left').innerHTML = hits.length
      ? `At x = ${xs0} the real curve has <b>${hits.length}</b> y-value${hits.length > 1 ? 's' : ''} (${ys.join(', ')}). A function must give one: regression says ${Math.round(f(xs0))}.`
      : `At x = ${xs0} the curve isn't there (move the line over the curve).`;
    document.getElementById('rg-right').innerHTML = hits.length
      ? `With t, that x is reached at ${hits.map(h => 't = ' + h[0].toFixed(2)).join(', ')}, giving y = ${ys.join(', ')}. Different t, so no clash.`
      : '';
    document.getElementById('rg-note').innerHTML = NOTES[shape];
  }
  document.querySelectorAll('#rg-shapes .chip').forEach(b => b.addEventListener('click', () => { shape = b.dataset.s; draw(); }));
  xIn.addEventListener('input', draw); dIn.addEventListener('input', draw);
  draw();
})();

