/* ---------- 34 · A chain of Hermite pieces: C1 for free, C2 only by choosing the tangents ---------- */
(function () {
  const g = id => document.getElementById(id), top = d3.select('#h2v'), bend = d3.select('#h2d'), W = 800, Hh = 340, D = 46, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const X0 = [70, 220, 370, 540, 730], Y0 = [210, 90, 230, 100, 180];
  let xs = X0.slice(), ys = Y0.slice(), m = [], mode = 'free';
  const fdTan = () => xs.map((x, i) => { const a = Math.max(0, i - 1), b = Math.min(xs.length - 1, i + 1); return (ys[b] - ys[a]) / (xs[b] - xs[a]); });
  const c2Tan = () => { const S = cubicSystem(xs, ys, 'natural'); return xs.map(x => S.ev(x, 1)); };
  const H = u => [2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2];
  const dH = u => [6 * u * u - 6 * u, 3 * u * u - 4 * u + 1, -6 * u * u + 6 * u, 3 * u * u - 2 * u];
  const ddH = u => [12 * u - 6, 6 * u - 4, -12 * u + 6, 6 * u - 2];
  const val = (i, u) => { const h = xs[i + 1] - xs[i], b = H(u); return b[0] * ys[i] + h * b[1] * m[i] + b[2] * ys[i + 1] + h * b[3] * m[i + 1]; };
  const slope = (i, u) => { const h = xs[i + 1] - xs[i], b = dH(u); return (b[0] * ys[i] + h * b[1] * m[i] + b[2] * ys[i + 1] + h * b[3] * m[i + 1]) / h; };
  const bendAt = (i, u) => { const h = xs[i + 1] - xs[i], b = ddH(u); return (b[0] * ys[i] + h * b[1] * m[i] + b[2] * ys[i + 1] + h * b[3] * m[i + 1]) / (h * h); };

  function draw() {
    const n = xs.length - 1;
    if (mode === 'fd') m = fdTan(); else if (mode === 'c2') m = c2Tan(); else if (m.length !== n + 1) m = fdTan();
    document.querySelectorAll('#m34 .chip').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    top.selectAll('*').remove();
    const pts = []; for (let i = 0; i < n; i++) for (let k = 0; k <= 50; k++) pts.push([xs[i] + (xs[i + 1] - xs[i]) * k / 50, val(i, k / 50)]);
    top.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3.5);
    xs.forEach((x, i) => {
      const hx = x + D, hy = ys[i] + m[i] * D;
      top.append('line').attr('x1', x - D).attr('y1', ys[i] - m[i] * D).attr('x2', hx).attr('y2', hy).attr('stroke', col7(i)).attr('stroke-width', 2.5).attr('opacity', .8);
      top.append('circle').attr('cx', hx).attr('cy', hy).attr('r', 7).attr('fill', col7(i)).attr('stroke', '#1c1c1c').attr('stroke-width', 2).style('cursor', mode === 'free' ? 'ns-resize' : 'default').attr('opacity', mode === 'free' ? 1 : .45)
        .call(d3.drag().on('drag', ev => { if (mode !== 'free') return; m[i] = clamp((ev.y - ys[i]) / D, -4, 4); draw(); }));
      top.append('circle').attr('cx', x).attr('cy', ys[i]).attr('r', 10).attr('fill', col7(i)).attr('stroke', '#1c1c1c').attr('stroke-width', 2.5).style('cursor', 'grab')
        .call(d3.drag().on('drag', ev => { xs[i] = clamp(ev.x, (i > 0 ? xs[i - 1] : 20) + 25, (i < n ? xs[i + 1] : W - 20) - 25); ys[i] = clamp(ev.y, 15, Hh - 15); draw(); }));
      top.append('text').attr('x', x).attr('y', ys[i] + 4).attr('text-anchor', 'middle').attr('fill', '#111').attr('font-size', 11).attr('font-weight', 700).attr('pointer-events', 'none').text(i);
    });
    // bend plot
    bend.selectAll('*').remove();
    const bp = []; for (let i = 0; i < n; i++) bp.push([[xs[i], bendAt(i, 0)], [xs[i + 1], bendAt(i, 1)]]);
    const mx = Math.max(0.004, d3.max(bp.flat(), d => Math.abs(d[1]))), BY = d3.scaleLinear([-mx, mx], [135, 15]);
    bend.append('path').attr('d', `M20,${BY(0)}H${W - 20}`).attr('stroke', '#555').attr('fill', 'none');
    bp.forEach((seg, i) => bend.append('path').attr('d', d3.line()(seg.map(d => [d[0], BY(d[1])]))).attr('fill', 'none').attr('stroke', col7(i)).attr('stroke-width', 3));
    for (let i = 1; i < n; i++) bend.append('line').attr('x1', xs[i]).attr('x2', xs[i]).attr('y1', BY(bendAt(i - 1, 1))).attr('y2', BY(bendAt(i, 0))).attr('stroke', '#9ca3af').attr('stroke-dasharray', '3 3').attr('stroke-width', 2);
    bend.append('text').attr('x', 24).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 11).text("bend S'' along the curve (straight inside a piece; the dashed grey line is the jump at a knot)");

    let vj = 0, sj = 0; const bj = [];
    for (let i = 1; i < n; i++) { vj = Math.max(vj, Math.abs(val(i - 1, 1) - val(i, 0))); sj = Math.max(sj, Math.abs(slope(i - 1, 1) - slope(i, 0))); bj.push(bendAt(i, 0) - bendAt(i - 1, 1)); }
    const mb = d3.max(bj, Math.abs), fmt = v => Math.abs(v) < 1e-9 ? '0' : v.toFixed(4);
    g('h2-read').innerHTML = `At the ${n - 1} inner knots: largest jump in <b>value</b> ${vj.toExponential(0)}, in <b>slope</b> ${sj.toExponential(0)} (both zero: C¹ for free), in <b>bend</b> ${mb < 1e-9 ? '<b>0</b> (C² as well)' : `<b>${mb.toFixed(4)}</b> (per knot: ${bj.map(fmt).join(', ')})`}. Units are pixels, as drawn.`;
  }
  document.querySelectorAll('#m34 .chip').forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
  g('b34').onclick = () => { xs = X0.slice(); ys = Y0.slice(); m = []; draw(); };
  draw();
})();
