/* ---------- 2 · Sum of bumps ---------- */
(function () {
  const p = 3, n = 12, k = [0, 0, 0, 0, ...d3.range(1, n - 3).map(i => i / (n - 3)), 1, 1, 1, 1];
  const base = [.2, .8, .3, .9, .5, .1, .7, .4, .9, .3, .6, .2];
  let c = base.slice(), sel = 3;
  const svg = d3.select('#bumps'), W = 800, H = 340, m = {l: 44, r: 16, t: 12, b: 28};
  const x = d3.scaleLinear([0, 1], [m.l, W - m.r]), y = d3.scaleLinear([0, 1.05], [H - m.b, m.t]);
  axes(svg.append('g'), x, y, 10, 5);
  const ts = d3.range(0, 1.0001, 0.004);
  const B = ts.map(t => d3.range(n).map(i => bspline(i, p, t, k)));      // precompute basis table
  const curve = w => B.map(row => d3.sum(row, (b, i) => b * w[i]));
  const ghost = curve(base);
  const L = d3.line().x((d, j) => x(ts[j])).y(d => y(d));
  svg.append('g').selectAll('line').data(k.filter((v, i) => i > p && i < n)).join('line')
    .attr('x1', x).attr('x2', x).attr('y1', y(0)).attr('y2', y(1.05)).attr('stroke', '#333');
  const supp = svg.append('rect').attr('y', m.t).attr('height', H - m.t - m.b).attr('fill', C.yellow).attr('opacity', .09);
  const bumpG = svg.append('g');
  svg.append('path').attr('d', L(ghost)).attr('fill', 'none').attr('stroke', C.gray).attr('stroke-dasharray', '5 4');
  const main = svg.append('path').attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
  const box = document.getElementById('bump-sliders');
  c.forEach((v, i) => {
    const lab = document.createElement('label');
    lab.innerHTML = `c<sub>${i}</sub><input type="range" min="0" max="1" step="0.01" value="${v}">`;
    const inp = lab.querySelector('input');
    inp.addEventListener('input', () => { c[i] = +inp.value; sel = i; draw(); });
    inp.addEventListener('focus', () => { sel = i; draw(); });
    box.appendChild(lab);
  });
  document.getElementById('bump-reset').onclick = () => {
    c = base.slice(); box.querySelectorAll('input').forEach((e, i) => e.value = c[i]); draw();
  };
  function draw() {
    const cur = curve(c);
    main.attr('d', L(cur));
    bumpG.selectAll('path').data(d3.range(n)).join('path')
      .attr('d', i => L(B.map(row => row[i] * c[i])))
      .attr('fill', 'none').attr('stroke-width', i => i === sel ? 2.5 : 1.2)
      .attr('stroke', i => i === sel ? C.yellow : C.blue).attr('opacity', i => i === sel ? 1 : .55);
    supp.attr('x', x(k[sel])).attr('width', x(k[Math.min(sel + p + 1, k.length - 1)]) - x(k[sel]));
    const moved = ts.filter((t, j) => Math.abs(cur[j] - ghost[j]) > 1e-9);
    document.getElementById('bump-readout').textContent = moved.length
      ? `curve differs from the original only for x ∈ [${moved[0].toFixed(2)}, ${moved[moved.length - 1].toFixed(2)}]`
      : 'curve identical to the original';
  }
  draw();
})();

