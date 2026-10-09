/* ---------- 30 · Training without peeking: which forecast cells can be scored now ---------- */
(function () {
  const p = 3, F = 200, v = 0.022, X0 = 0.3, K = 6;
  const posAt = f => { const u = (((X0 + v * f) % 2) + 2) % 2; return u <= 1 ? u : 2 - u; };
  const g = id => document.getElementById(id);
  const tr = d3.select('#lgt'), gd = d3.select('#lgg'), chips = d3.select('#lg-chips');
  const X = d3.scaleLinear([0, F - 1], [40, 780]), Y = d3.scaleLinear([-0.05, 1.05], [225, 15]);
  const GY = d3.scaleLinear([0, F - 1], [20, 280]);
  let mode = 'A';

  // stand-in forecaster: best K-control-point fit to the true window, then control points nudged (error grows toward the far end)
  function forecast(tau, past, W) {
    const a = tau - past, b = tau + W, n = b - a;
    const inner = d3.range(1, K - p).map(i => i / (K - p)), knots = [...new Array(p + 1).fill(0), ...inner, ...new Array(p + 1).fill(1)];
    const Bm = d3.range(n + 1).map(i => d3.range(K).map(j => bspline(j, p, Math.min(i / n, 1 - 1e-9), knots)));
    const ys = d3.range(a, b + 1).map(posAt);
    const A = d3.range(K).map(r => d3.range(K).map(c => d3.sum(Bm, row => row[r] * row[c]) + (r === c ? 1e-9 : 0)));
    const c = solveLinear(A, d3.range(K).map(r => d3.sum(Bm, (row, i) => row[r] * ys[i])));
    const c2 = c.map((cj, j) => cj + 0.09 * Math.sin(1.3 * j + 0.37 * tau) * (j / (K - 1)));
    return {a, b, pred: Bm.map(row => d3.sum(c2, (cj, j) => cj * row[j]))};
  }
  const predAt = (fc, f) => fc.pred[f - fc.a], err = (fc, f) => predAt(fc, f) - posAt(f);
  const mse = (fc, fs) => fs.length ? d3.mean(fs, f => err(fc, f) ** 2) : NaN;

  function draw() {
    const W = +g('lg-w').value, Wp = +g('lg-wp').value;
    const nowIn = g('lg-now'); nowIn.min = W + Wp; nowIn.max = F - 1 - W; if (+nowIn.value < +nowIn.min) nowIn.value = nowIn.min; if (+nowIn.value > +nowIn.max) nowIn.value = nowIn.max;
    const now = +nowIn.value, t0In = g('lg-t0'); t0In.max = now; t0In.min = Wp;
    if (+t0In.value > now) t0In.value = now; if (+t0In.value < Wp) t0In.value = Wp;
    const t0 = +t0In.value, past = mode === 'C' ? Wp : 0;
    g('lg-nowv').textContent = now; g('lg-wv').textContent = W; g('lg-t0v').textContent = t0; g('lg-wpv').textContent = Wp;

    chips.selectAll('*').remove();
    [['A', 'A · score each new frame as it arrives'], ['B', 'B · score a whole window afterwards'], ['C', 'C · window reaches into the past too']].forEach(([k, label]) =>
      chips.append('button').attr('class', 'chip' + (mode === k ? ' on' : '')).text(label).on('click', () => { mode = k; draw(); }));

    // ---- top: path and forecasts ----
    tr.selectAll('*').remove();
    tr.append('path').attr('d', d3.line()(d3.range(F).map(f => [X(f), Y(posAt(f))]))).attr('fill', 'none').attr('stroke', '#777').attr('stroke-width', 2).attr('opacity', .25);
    tr.append('path').attr('d', d3.line()(d3.range(now + 1).map(f => [X(f), Y(posAt(f))]))).attr('fill', 'none').attr('stroke', '#bbb').attr('stroke-width', 2.5);
    tr.append('line').attr('x1', X(now)).attr('x2', X(now)).attr('y1', 15).attr('y2', 225).attr('stroke', '#fff');
    tr.append('text').attr('x', X(now) + 4).attr('y', 28).attr('fill', '#fff').attr('font-size', 11).text('now');
    tr.append('text').attr('x', 780).attr('y', 245).attr('text-anchor', 'end').attr('fill', C.gray).attr('font-size', 11).text('frame →');
    const drawFc = (fc, color, fromF, op) => {
      const fs = d3.range(Math.max(fc.a, fromF), fc.b + 1), solid = fs.filter(f => f <= now), dash = fs.filter(f => f >= now);
      if (solid.length > 1) tr.append('path').attr('d', d3.line()(solid.map(f => [X(f), Y(predAt(fc, f))]))).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 3).attr('opacity', op);
      if (dash.length > 1) tr.append('path').attr('d', d3.line()(dash.map(f => [X(f), Y(predAt(fc, f))]))).attr('fill', 'none').attr('stroke', color).attr('stroke-width', 3).attr('stroke-dasharray', '5 4').attr('opacity', op);
    };
    const tick = (f, fc, color) => tr.append('line').attr('x1', X(f)).attr('x2', X(f)).attr('y1', Y(posAt(f))).attr('y2', Y(predAt(fc, f))).attr('stroke', color).attr('stroke-width', 1.6);
    let text = '';
    if (mode === 'A') {
      const taus = d3.range(now - W, now), fcs = taus.map(t => forecast(t, 0, W));
      [0, Math.floor(W / 2), W - 1].forEach(i => drawFc(fcs[i], C.yellow, taus[i], .55));
      fcs.forEach((fc, i) => { tr.append('circle').attr('cx', X(now)).attr('cy', Y(predAt(fc, now))).attr('r', 3.2).attr('fill', C.yellow).attr('opacity', .9); });
      tr.append('circle').attr('cx', X(now)).attr('cy', Y(posAt(now))).attr('r', 6).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 2);
      const m = d3.mean(fcs, fc => err(fc, now) ** 2);
      text = `<b>A.</b> Frame <b>${now}</b> has just arrived. It was forecast by the ${W} forecasts made at frames ${now - W} … ${now - 1} (yellow dots, one per lead time 1…${W}); the white ring is the truth. Loss at this step = mean squared error of those ${W} dots: <b>${m.toFixed(4)}</b>. It uses truth up to frame ${now} only. The cost: you must remember the last ${W} forecasts, and each one is graded between 1 and ${W} frames after it was made.`;
    } else if (mode === 'B') {
      const fc = forecast(t0, 0, W); drawFc(fc, C.yellow, t0, 1);
      const full = t0 + W <= now, fs = d3.range(t0 + 1, Math.min(now, t0 + W) + 1);
      fs.forEach(f => tick(f, fc, C.red));
      tr.append('line').attr('x1', X(t0)).attr('x2', X(t0)).attr('y1', 15).attr('y2', 225).attr('stroke', C.yellow).attr('stroke-dasharray', '2 3');
      text = full
        ? `<b>B.</b> The forecast made at frame <b>${t0}</b> covers ${t0 + 1} … ${t0 + W}, and all of that is now in the past (red ticks = errors). Whole-window loss: <b>${mse(fc, fs).toFixed(4)}</b>. It was only computable ${now - (t0 + W)} frame${now - (t0 + W) === 1 ? '' : 's'} after the window ended, never at frame ${t0}. On recorded data that is fine: the network is never <i>shown</i> those later frames, they are just labels.`
        : `<b>B.</b> The forecast made at frame <b>${t0}</b> needs truth up to frame ${t0 + W}, but "now" is ${now}: <b>${t0 + W - now}</b> frame${t0 + W - now === 1 ? '' : 's'} short. Only the part up to now can be graded (${fs.length ? 'error so far ' + mse(fc, fs).toFixed(4) : 'nothing yet'}). A strictly online learner must wait; a learner on recorded data simply uses the later frames as labels.`;
    } else {
      const fc = forecast(t0, Wp, W); drawFc(fc, C.yellow, fc.a, 1);
      const pastF = d3.range(t0 - Wp, t0 + 1), futF = d3.range(t0 + 1, Math.min(now, t0 + W) + 1);
      pastF.forEach(f => tick(f, fc, C.blue)); futF.forEach(f => tick(f, fc, C.red));
      tr.append('line').attr('x1', X(t0)).attr('x2', X(t0)).attr('y1', 15).attr('y2', 225).attr('stroke', C.yellow).attr('stroke-dasharray', '2 3');
      text = `<b>C.</b> At frame <b>${t0}</b> the network outputs a spline for frames ${t0 - Wp} … ${t0 + W}. The first part is already known when it is made, so it is graded with <b>no delay</b> (blue ticks, error <b>${mse(fc, pastF).toFixed(4)}</b>). The future part waits like in B (red ticks so far: ${futF.length ? mse(fc, futF).toFixed(4) : 'none yet'}). Caution: the blue part only teaches the network to <i>describe the past</i>; forecasting is still only taught by the red part.`;
    }
    g('lg-read').innerHTML = text;

    // ---- grid: rows = forecast time, columns = target frame ----
    gd.selectAll('*').remove();
    const L = t => Math.max(0, t + 1 - past), R = t => t + W, tMax = F - 1 - W;
    const poly = (t1, t2, lo, hi) => { const ts = d3.range(t1, t2 + 1); return d3.line()([...ts.map(t => [X(lo(t)), GY(t)]), ...ts.slice().reverse().map(t => [X(hi(t)), GY(t)])]) + 'Z'; };
    gd.append('path').attr('d', poly(now, tMax, L, R)).attr('fill', '#fff').attr('opacity', .06);
    gd.append('path').attr('d', poly(0, now, L, R)).attr('fill', '#666').attr('opacity', .55);
    gd.append('path').attr('d', poly(0, now, t => Math.min(L(t), now), t => Math.min(R(t), now))).attr('fill', C.green).attr('opacity', .55);
    gd.append('line').attr('x1', X(now)).attr('x2', X(now)).attr('y1', 20).attr('y2', 280).attr('stroke', '#fff');
    gd.append('line').attr('x1', 40).attr('x2', 780).attr('y1', GY(now)).attr('y2', GY(now)).attr('stroke', '#fff').attr('stroke-dasharray', '3 3').attr('opacity', .5);
    gd.append('text').attr('x', X(now) + 4).attr('y', 16).attr('fill', '#fff').attr('font-size', 11).text('now (newest frame)');
    gd.append('text').attr('x', 44).attr('y', GY(now) + 14).attr('fill', '#ccc').attr('font-size', 11).text('forecasts made up to here ↑   later ones not made yet ↓');
    gd.append('text').attr('x', 780).attr('y', 296).attr('text-anchor', 'end').attr('fill', C.gray).attr('font-size', 11).text('target frame →   (green = answer already arrived, grey = still waiting)');
    const seg = (x1, x2, y, color) => gd.append('line').attr('x1', X(x1)).attr('x2', X(x2)).attr('y1', GY(y)).attr('y2', GY(y)).attr('stroke', color).attr('stroke-width', 4.5).attr('stroke-linecap', 'round');
    if (mode === 'A') gd.append('line').attr('x1', X(now)).attr('x2', X(now)).attr('y1', GY(now - W)).attr('y2', GY(now - 1)).attr('stroke', C.yellow).attr('stroke-width', 5).attr('stroke-linecap', 'round');
    if (mode === 'B') seg(t0 + 1, t0 + W, t0, t0 + W <= now ? C.yellow : C.red);
    if (mode === 'C') { seg(t0 - Wp, t0, t0, C.blue); seg(t0 + 1, t0 + W, t0, C.yellow); }
  }
  ['lg-now', 'lg-w', 'lg-t0', 'lg-wp'].forEach(id => g(id).addEventListener('input', draw));
  draw();
})();
