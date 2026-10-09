/* ---------- 35 · Hermite on a window: x_hat = anchor + B theta ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#h3v'), ms = d3.select('#h3m');
  const F = 8, HL = 3.5, KN = [0, 3.5, 7], NAMES = ['o₀', 'm₀', 'o₁', 'm₁', 'o₂', 'm₂'];
  const H = u => [2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2];
  const PRE = {steady: [0, 3, 10.5, 3, 21, 3], hill: [0, 4, 14, 0, 0, -4], zero: [0, 0, 0, 0, 0, 0]};
  const eval1 = (th, f) => { const i = f <= KN[1] ? 0 : 1, u = (f - KN[i]) / HL, b = H(u), o = [th[0], th[2], th[4]], m = [th[1], th[3], th[5]];
    return b[0] * o[i] + HL * b[1] * m[i] + b[2] * o[i + 1] + HL * b[3] * m[i + 1]; };
  const Bm = d3.range(F).map(f => d3.range(6).map(j => eval1(d3.range(6).map(c => c === j ? 1 : 0), f)));   // column j = response to the unit vector e_j
  let th = PRE.steady.slice(), hlc = null;
  const eq = eqLab('eh3', String.raw`\htmlClass{eq-X}{\hat{\mathbf x}}=\htmlClass{eq-a}{a}+\htmlClass{eq-B}{\mathbf B}\,\htmlClass{eq-th}{\boldsymbol\theta}`, () => draw());
  const sl = d3.select('#sl35');
  NAMES.forEach((nm, j) => { const lab = sl.append('label'); lab.append('span').text(nm); lab.append('input').attr('type', 'range').attr('id', 's35-' + j).attr('min', j % 2 ? -6 : -30).attr('max', j % 2 ? 6 : 30).attr('step', j % 2 ? 0.1 : 0.5).attr('value', th[j])
    .on('input', function () { th[j] = +this.value; hlc = j; draw(); }); lab.append('b').attr('id', 's35o-' + j); });

  function draw() {
    const hl = eq.hl;
    document.querySelectorAll('#m35 .chip').forEach(b => b.classList.remove('on'));
    th.forEach((v, j) => { g('s35-' + j).value = v; g('s35o-' + j).textContent = v.toFixed(1); });
    const Xs = d3.scaleLinear([-0.5, 7.5], [40, 780]), Ys = d3.scaleLinear([-35, 35], [225, 20]), ff = d3.range(0, 7.0001, .05);
    svg.selectAll('*').remove();
    svg.append('path').attr('d', `M40,${Ys(0)}H780`).attr('stroke', '#555').attr('fill', 'none');
    svg.append('path').attr('d', d3.line()(ff.map(f => [Xs(f), Ys(eval1(th, f))]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', hl === 'X' ? 7 : 3.5);
    KN.forEach((k, i) => { const o = th[2 * i], m = th[2 * i + 1];
      svg.append('line').attr('x1', Xs(k - 0.7)).attr('y1', Ys(o - 0.7 * m)).attr('x2', Xs(k + 0.7)).attr('y2', Ys(o + 0.7 * m)).attr('stroke', col7(2 * i + 1)).attr('stroke-width', 3);
      svg.append('circle').attr('cx', Xs(k)).attr('cy', Ys(o)).attr('r', 9).attr('fill', 'none').attr('stroke', col7(2 * i)).attr('stroke-width', 3.5); });
    d3.range(F).forEach(f => svg.append('circle').attr('cx', Xs(f)).attr('cy', Ys(eval1(th, f))).attr('r', 5).attr('fill', '#fbbf24').attr('stroke', '#1c1c1c'));
    svg.append('text').attr('x', 780).attr('y', 245).attr('text-anchor', 'end').attr('fill', '#9ca3af').attr('font-size', 11).text('sample time → (yellow dots = the 8 samples, rings = knots with their slope)');

    // the matrix product
    ms.selectAll('*').remove();
    const rh = 28, cw = 52, ox = 30, oy = 50, tx = ox + 6 * cw + 50, xx = tx + cw + 50, X8 = Bm.map(r => d3.sum(r, (b, j) => b * th[j]));
    const heat = v => v >= 0 ? d3.interpolateBlues(Math.min(1, v * 1.1)) : d3.interpolateReds(Math.min(1, -v * 2.5));
    ms.append('text').attr('x', ox).attr('y', 18).attr('fill', '#9ca3af').attr('font-size', 12).text('B (8 samples × 6 numbers)');
    ms.append('text').attr('x', tx).attr('y', 18).attr('fill', '#9ca3af').attr('font-size', 12).text('θ');
    ms.append('text').attr('x', xx).attr('y', 18).attr('fill', '#9ca3af').attr('font-size', 12).text('B θ');
    NAMES.forEach((nm, j) => ms.append('text').attr('x', ox + j * cw + cw / 2).attr('y', 40).attr('text-anchor', 'middle').attr('fill', col7(j)).attr('font-size', 13).attr('font-weight', 700).text(nm));
    Bm.forEach((row, r) => {
      row.forEach((v, j) => { ms.append('rect').attr('x', ox + j * cw).attr('y', oy + r * rh).attr('width', cw - 2).attr('height', rh - 2).attr('fill', heat(v)).attr('opacity', hlc === null || hlc === j ? 1 : .35)
        .attr('stroke', hlc === j || hl === 'B' ? '#fbbf24' : 'none');
        ms.append('text').attr('x', ox + j * cw + cw / 2).attr('y', oy + r * rh + 18).attr('text-anchor', 'middle').attr('fill', (v > .55 || v < -.35) ? '#fff' : '#111').attr('font-size', 11).text(Math.abs(v) < 5e-4 ? '0' : v.toFixed(2)); });
      ms.append('text').attr('x', ox - 6).attr('y', oy + r * rh + 18).attr('text-anchor', 'end').attr('fill', '#9ca3af').attr('font-size', 10).text(r);
      ms.append('rect').attr('x', xx).attr('y', oy + r * rh).attr('width', cw + 14).attr('height', rh - 2).attr('fill', '#2a2a2a').attr('stroke', hl === 'X' ? '#fbbf24' : 'none');
      ms.append('text').attr('x', xx + (cw + 14) / 2).attr('y', oy + r * rh + 18).attr('text-anchor', 'middle').attr('fill', '#fbbf24').attr('font-size', 12).attr('font-weight', 700).text(X8[r].toFixed(2));
    });
    th.forEach((v, j) => ms.append('text').attr('x', tx + 6).attr('y', oy + j * rh + 18).attr('fill', col7(j)).attr('font-size', 12).text(`${NAMES[j]} = ${v.toFixed(1)}`));
    const direct = d3.range(F).map(f => eval1(th, f)), diff = d3.max(d3.range(F), r => Math.abs(direct[r] - X8[r]));
    g('eh3-read').innerHTML = `Largest difference between the matrix product <b>Bθ</b> and evaluating the Hermite pieces directly: <b>${diff.toExponential(0)}</b>. ` + (hlc !== null ? `Highlighted column: <b>${NAMES[hlc]}</b> shows how that one number spreads over the 8 samples (it is the curve you get with only ${NAMES[hlc]} = 1).` : 'Touch a slider to highlight its column of B.');
    const CAP = {X: '<b>x̂</b>: the 8 predicted values, one per sample (the yellow dots).', a: '<b>a</b>: an anchor added after the matrix, outside the six learned numbers. Here it is 0.', B: '<b>B</b>: the fixed 8 × 6 matrix of Hermite bump values at the sample times.', th: '<b>θ</b>: the six numbers: an offset and a slope at each of the three knots.'};
    g('eh3-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
  }
  document.querySelectorAll('#m35 .chip').forEach(b => b.onclick = () => { th = PRE[b.dataset.p].slice(); hlc = null; draw(); b.classList.add('on'); });
  draw();
})();
