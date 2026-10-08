/* ---------- 26 · Cox-de Boor recursion ---------- */
(function () {
  const g = id => document.getElementById(id), svg = d3.select('#v26');
  const T0 = [0.05, 0.14, 0.26, 0.42, 0.55, 0.68, 0.81, 0.9, 0.97], X = d3.scaleLinear([0, 1], [40, 780]), Y = d3.scaleLinear([-0.05, 1.1], [270, 15]);
  let T = T0.slice(), p = 3, bi = 1;
  const eq = eqLab('e26', String.raw`\begin{aligned}
    N_{i,0}(t)&=\begin{cases}1&t_i\le t<t_{i+1}\\0&\text{otherwise}\end{cases}\\[4pt]
    \htmlClass{eq-N}{N_{i,p}(t)}&=\htmlClass{eq-w1}{\frac{t-t_i}{t_{i+p}-t_i}}\;\htmlClass{eq-N1}{N_{i,p-1}(t)}\;+\;\htmlClass{eq-w2}{\frac{t_{i+p+1}-t}{t_{i+p+1}-t_{i+1}}}\;\htmlClass{eq-N2}{N_{i+1,p-1}(t)}
  \end{aligned}`, () => draw());
  const N = (i, q, t) => bspline(i, q, t, T);

  function draw() {
    const hl = eq.hl, nmax = T.length - p - 1; bi = Math.min(bi, nmax - 1); const t = +g('i26t').value; g('o26t').textContent = t.toFixed(2); g('l26t').classList.toggle('flash', hl === 't');
    const chips = (id, items, cur, fn) => { const el = d3.select(id); el.selectAll('*').remove(); items.forEach(v => el.append('button').attr('class', 'chip' + (v === cur ? ' on' : '')).text(id === '#dg26' ? 'degree ' + v : 'bump i = ' + v).on('click', () => fn(v))); };
    chips('#dg26', [1, 2, 3], p, v => { p = v; draw(); }); chips('#bi26', d3.range(T.length - p - 1), bi, v => { bi = v; draw(); });
    const ts = d3.range(0.02, 1.0001, 0.004), i = bi, ti = T[i], tip = T[i + p], ti1 = T[i + 1], tip1 = T[i + p + 1];
    const r1 = x => (x >= ti && x < tip) ? (x - ti) / (tip - ti) : 0, r2 = x => (x >= ti1 && x < tip1) ? (tip1 - x) / (tip1 - ti1) : 0;
    const A = x => N(i, p - 1, x), B = x => N(i + 1, p - 1, x), R = x => N(i, p, x);
    const dim = k => hl && hl !== k ? .35 : 1, line = (f, col, w, dash, op) => svg.append('path').attr('d', d3.line()(ts.map(x => [X(x), Y(f(x))]))).attr('fill', 'none').attr('stroke', col).attr('stroke-width', w).attr('stroke-dasharray', dash).attr('opacity', op);
    const area = (f, col, op) => svg.append('path').attr('d', d3.area().x(d => X(d)).y0(Y(0)).y1(d => Y(f(d)))(ts)).attr('fill', col).attr('opacity', op);
    svg.selectAll('*').remove();
    svg.append('path').attr('d', `M40,${Y(0)}H780`).attr('stroke', '#9ca3af').attr('fill', 'none');
    area(x => r1(x) * A(x), '#3b82f6', hl === 'N1' || hl === 'w1' ? .45 : .22); area(x => r2(x) * B(x), '#f97316', hl === 'N2' || hl === 'w2' ? .45 : .22);
    line(A, '#3b82f6', hl === 'N1' ? 5 : 2.5, null, dim('N1') * (hl === 'N' || hl === 'w1' ? .6 : 1)); line(B, '#f97316', hl === 'N2' ? 5 : 2.5, null, dim('N2') * (hl === 'N' || hl === 'w2' ? .6 : 1));
    line(r1, '#3b82f6', hl === 'w1' ? 5 : 1.6, '6 4', hl && hl !== 'w1' ? .25 : .85); line(r2, '#f97316', hl === 'w2' ? 5 : 1.6, '6 4', hl && hl !== 'w2' ? .25 : .85);
    line(R, '#fff', hl === 'N' ? 8 : 4, null, hl && hl !== 'N' ? .6 : 1);
    T.forEach((k, j) => { const inside = j >= i && j <= i + p + 1; svg.append('line').attr('x1', X(k)).attr('x2', X(k)).attr('y1', 15).attr('y2', 270).attr('stroke', inside ? '#555' : '#2c2c2c'); });
    svg.selectAll('.kh').data(T.map((_, j) => j)).join('circle').attr('cx', j => X(T[j])).attr('cy', 295).attr('r', 7).attr('fill', j => (j >= i && j <= i + p + 1) ? '#fbbf24' : '#6b5a24').attr('stroke', '#1c1c1c').attr('stroke-width', 2).style('cursor', 'ew-resize')
      .call(d3.drag().on('drag', (ev, j) => { T[j] = Math.max((j ? T[j - 1] : 0) + 0.02, Math.min((j < T.length - 1 ? T[j + 1] : 1) - 0.02, X.invert(ev.x))); draw(); }));
    svg.selectAll('.kl').data(T.map((_, j) => j)).join('text').attr('x', j => X(T[j])).attr('y', 320).attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', 11).text(j => 't' + j);
    svg.append('line').attr('x1', X(t)).attr('x2', X(t)).attr('y1', 15).attr('y2', 270).attr('stroke', hl === 't' ? '#fbbf24' : '#fff').attr('stroke-width', hl === 't' ? 3 : 1).attr('opacity', .7);
    [[A(t) * r1(t), '#3b82f6'], [B(t) * r2(t), '#f97316'], [R(t), '#fff']].forEach(([v, c]) => svg.append('circle').attr('cx', X(t)).attr('cy', Y(v)).attr('r', 5).attr('fill', c));
    const w1 = r1(t), w2 = r2(t), a = A(t), b = B(t), direct = R(t), viaRec = w1 * a + w2 * b;
    g('e26-sub').innerHTML = `at t = ${t.toFixed(2)}: N<sub>${i},${p}</sub> = <span style="color:#3b82f6">${w1.toFixed(3)} × ${a.toFixed(3)}</span> + <span style="color:#f97316">${w2.toFixed(3)} × ${b.toFixed(3)}</span> = <b>${viaRec.toFixed(4)}</b> · computed directly: ${direct.toFixed(4)} ` + (Math.abs(viaRec - direct) < 1e-9 ? '<span class="yes">✓ same</span>' : '<span class="no">✗</span>') +
      ` · non-zero only between t<sub>${i}</sub> = ${ti.toFixed(2)} and t<sub>${i + p + 1}</sub> = ${tip1.toFixed(2)}`;
    const CAP = {
      N: `<b>N<sub>i,p</sub></b>: the bump we are building (thick white). It is zero outside [t<sub>${i}</sub>, t<sub>${i + p + 1}</sub>] and covers p + 1 = ${p + 1} knot spans.`,
      w1: `<b>(t − t<sub>i</sub>)/(t<sub>i+p</sub> − t<sub>i</sub>)</b>: a ramp rising from 0 to 1 across [t<sub>${i}</sub>, t<sub>${i + p}</sub>] (blue dashed). It fades the left lower bump in.`,
      N1: `<b>N<sub>i,p−1</sub></b>: the lower-degree bump on the left (blue). Its product with the rising ramp is the shaded blue area.`,
      w2: `<b>(t<sub>i+p+1</sub> − t)/(t<sub>i+p+1</sub> − t<sub>i+1</sub>)</b>: a ramp falling from 1 to 0 across [t<sub>${i + 1}</sub>, t<sub>${i + p + 1}</sub>] (orange dashed). It fades the right lower bump out.`,
      N2: `<b>N<sub>i+1,p−1</sub></b>: the lower-degree bump on the right (orange). Its product with the falling ramp is the shaded orange area.`
    };
    g('e26-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted. Blue and orange are the two lower-degree bumps; the white curve is their ramp-weighted sum.';
  }
  g('i26t').addEventListener('input', draw); g('b26').onclick = () => { T = T0.slice(); draw(); };
  draw();
})();
