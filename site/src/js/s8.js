/* ---------- 8 · Spline readout over a sliding window ---------- */
(function () {
  const p = 3, F = 200, v = 0.022, X0 = 0.3;
  const posAt = f => { const u = (((X0 + v * f) % 2) + 2) % 2; return u <= 1 ? u : 2 - u; };
  const BN = [1, 2, 3, 4, 5].map(k => (k - X0) / v).filter(b => b < F - 1);          // bounce frames
  const g = id => document.getElementById(id);
  const top = d3.select('#sw'), hm = d3.select('#swm'), er = d3.select('#swe');
  const X = d3.scaleLinear([0, F - 1], [40, 780]), Y = d3.scaleLinear([-0.05, 1.05], [225, 15]);

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
  function windowFit(now, W, k, kink) {
    const ys = d3.range(W + 1).map(i => posAt(now + i));
    const inWin = BN.filter(b => b > now && b < now + W).map(b => (b - now) / W);
    const inner = d3.range(1, k - p).map(i => i / (k - p));
    const bk = kink ? inWin.flatMap(s => [s, s, s]) : [];
    const knots = [...new Array(p + 1).fill(0), ...inner.concat(bk).sort(d3.ascending), ...new Array(p + 1).fill(1)];
    const n = knots.length - p - 1, Bm = ys.map((_, i) => d3.range(n).map(j => bspline(j, p, i / W, knots)));
    const A = d3.range(n).map(r => d3.range(n).map(c => d3.sum(Bm, row => row[r] * row[c]) + (r === c ? 1e-9 : 0)));
    const c = solve(A, d3.range(n).map(r => d3.sum(Bm, (row, i) => row[r] * ys[i])));
    const fit = Bm.map(row => d3.sum(c, (cj, j) => cj * row[j]));
    const res = fit.map((f, i) => f - ys[i]);
    return {knots, n, Bm, c, fit, ys, nb: inWin.length, rms: Math.sqrt(d3.mean(res, r => r * r)), worst: d3.max(res, Math.abs)};
  }

  function draw() {
    const W = +g('sw-w').value, k = +g('sw-k').value, kink = g('sw-kink').checked;
    const nowIn = g('sw-now'); nowIn.max = F - 1 - W; if (+nowIn.value > +nowIn.max) nowIn.value = nowIn.max;
    const now = +nowIn.value;
    g('sw-nowv').textContent = now; g('sw-wv').textContent = W; g('sw-kv').textContent = k;
    const r = windowFit(now, W, k, kink);

    top.selectAll('*').remove();
    top.append('rect').attr('x', X(now)).attr('y', 15).attr('width', X(now + W) - X(now)).attr('height', 210).attr('fill', C.yellow).attr('opacity', .08);
    BN.forEach(b => top.append('line').attr('x1', X(b)).attr('x2', X(b)).attr('y1', 15).attr('y2', 225).attr('stroke', C.gray).attr('stroke-dasharray', '2 4').attr('opacity', .5));
    top.append('path').attr('d', d3.line()(d3.range(F).map(f => [X(f), Y(posAt(f))]))).attr('fill', 'none').attr('stroke', '#777').attr('stroke-width', 2);
    top.append('path').attr('d', d3.line()(r.fit.map((y, i) => [X(now + i), Y(y)]))).attr('fill', 'none').attr('stroke', C.yellow).attr('stroke-width', 3.5);
    const gre = r.c.map((_, j) => d3.sum(r.knots.slice(j + 1, j + p + 1)) / p);          // Greville abscissae
    const poly = r.c.map((cj, j) => [X(now + gre[j] * W), Y(cj)]);
    top.append('path').attr('d', d3.line()(poly)).attr('fill', 'none').attr('stroke', C.blue).attr('stroke-dasharray', '4 3').attr('opacity', .8);
    top.selectAll('.cp').data(poly).join('circle').attr('cx', d => d[0]).attr('cy', d => d[1]).attr('r', 4.5).attr('fill', C.blue);
    top.append('line').attr('x1', X(now)).attr('x2', X(now)).attr('y1', 15).attr('y2', 225).attr('stroke', '#fff');
    top.append('text').attr('x', X(now) + 4).attr('y', 28).attr('fill', '#fff').attr('font-size', 11).text('now');
    top.append('text').attr('x', 780).attr('y', 245).attr('text-anchor', 'end').attr('fill', C.gray).attr('font-size', 11).text('frame →');

    hm.selectAll('*').remove();
    const cw = 330 / r.n, ch = 200 / (W + 1);
    r.Bm.forEach((row, i) => row.forEach((val, j) => hm.append('rect').attr('x', 50 + j * cw).attr('y', 30 + i * ch).attr('width', cw + .3).attr('height', ch + .3).attr('fill', d3.interpolateBlues(Math.min(1, val * 1.15)))));
    hm.append('text').attr('x', 8).attr('y', 18).attr('fill', C.gray).attr('font-size', 12).text(`readout matrix M: ${W + 1} frames × ${r.n} control points`);
    hm.append('text').attr('x', 8).attr('y', 130).attr('fill', C.gray).attr('font-size', 11).attr('transform', 'rotate(-90 14 130)').text('future frames →');
    hm.append('text').attr('x', 215).attr('y', 250).attr('text-anchor', 'middle').attr('fill', C.gray).attr('font-size', 11).text('control point index →');

    er.selectAll('*').remove();
    const nows = d3.range(0, F - W, 2), errs = nows.map(n => windowFit(n, W, k, kink).rms);
    const ex = d3.scaleLinear([0, F - 1], [40, 390]), ey = d3.scaleLinear([0, Math.max(0.05, d3.max(errs))], [225, 30]);
    nows.forEach(n => { if (BN.some(b => b > n && b < n + W)) er.append('rect').attr('x', ex(n)).attr('y', 30).attr('width', ex(2) - ex(0) + .5).attr('height', 195).attr('fill', C.yellow).attr('opacity', .09); });
    er.append('path').attr('d', d3.line()(nows.map((n, i) => [ex(n), ey(errs[i])]))).attr('fill', 'none').attr('stroke', C.red).attr('stroke-width', 2.5);
    er.append('line').attr('x1', ex(now)).attr('x2', ex(now)).attr('y1', 30).attr('y2', 225).attr('stroke', '#fff');
    er.append('path').attr('d', 'M40,30V225H390').attr('fill', 'none').attr('stroke', C.gray);
    er.append('text').attr('x', 8).attr('y', 18).attr('fill', C.gray).attr('font-size', 12).text(`best-possible RMS error (max ${ey.domain()[1].toFixed(2)})`);
    er.append('text').attr('x', 390).attr('y', 245).attr('text-anchor', 'end').attr('fill', C.gray).attr('font-size', 11).text('now →');

    g('sw-read').innerHTML = `Window frames ${now}–${now + W} contains <b>${r.nb}</b> bounce${r.nb === 1 ? '' : 's'}. The network would output <b>${r.n}</b> numbers. Best-possible error: RMS ${r.rms.toFixed(3)}, worst ${r.worst.toFixed(3)} (the ball moves 0–1 between walls).`;
  }
  ['sw-now', 'sw-w', 'sw-k', 'sw-kink'].forEach(id => g(id).addEventListener('input', draw));
  draw();
})();
