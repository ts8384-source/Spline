/* ---------- 1 · Runge ---------- */
(function () {
  const svg = d3.select('#runge'), W = 800, H = 380, m = {l: 44, r: 16, t: 12, b: 28};
  const x = d3.scaleLinear([-1, 1], [m.l, W - m.r]), y = d3.scaleLinear([-0.6, 1.4], [H - m.b, m.t]);
  svg.append('clipPath').attr('id', 'rc').append('rect').attr('x', m.l).attr('y', m.t).attr('width', W - m.l - m.r).attr('height', H - m.t - m.b);
  axes(svg.append('g'), x, y, 8, 6);
  const f = t => 1 / (1 + 25 * t * t), grid = d3.range(-1, 1.0001, 0.005);
  const line = fn => d3.line().x(t => x(t)).y(t => y(fn(t)))(grid);
  const layer = svg.append('g').attr('clip-path', 'url(#rc)');
  layer.append('path').attr('d', line(f)).attr('fill', 'none').attr('stroke', C.gray).attr('stroke-dasharray', '5 4');
  const poly = layer.append('path').attr('fill', 'none').attr('stroke', C.red).attr('stroke-width', 2.5);
  const spl = layer.append('path').attr('fill', 'none').attr('stroke', C.green).attr('stroke-width', 2.5);
  const dots = svg.append('g');
  function draw() {
    const n = +document.getElementById('runge-n').value;
    document.getElementById('runge-nv').textContent = n;
    const xs = d3.range(n).map(i => -1 + 2 * i / (n - 1)), ys = xs.map(f);
    const P = lagrange(xs, ys), S = natSpline(xs, ys);
    poly.attr('d', line(P)); spl.attr('d', line(S));
    dots.selectAll('circle').data(xs).join('circle').attr('cx', x).attr('cy', (d, i) => y(ys[i])).attr('r', 4.5).attr('fill', C.blue);
    const err = fn => d3.max(grid, t => Math.abs(fn(t) - f(t)));
    document.getElementById('runge-err').innerHTML =
      `max error — <span class="red">polynomial ${err(P).toFixed(3)}</span> · <span class="green">spline ${err(S).toFixed(3)}</span>`;
  }
  document.getElementById('runge-n').addEventListener('input', draw);
  draw();
})();

