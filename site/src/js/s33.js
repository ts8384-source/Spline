/* ---------- 33 · One cubic Hermite piece ---------- */
(function () {
  const g = id => document.getElementById(id), top = d3.select('#h1v'), low = d3.select('#h1b');
  const X = d3.scaleLinear([-0.2, 1.2], [40, 780]), Y = d3.scaleLinear([-1, 2], [300, 20]), D = 0.2, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const H = t => [2 * t ** 3 - 3 * t ** 2 + 1, t ** 3 - 2 * t ** 2 + t, -2 * t ** 3 + 3 * t ** 2, t ** 3 - t ** 2];
  const dH = t => [6 * t * t - 6 * t, 3 * t * t - 4 * t + 1, -6 * t * t + 6 * t, 3 * t * t - 2 * t];
  const DEF = [0.2, 2.0, 0.8, -1.0];
  let par = DEF.slice();                                                       // [p0, m0, p1, m1]
  const eq = eqLab('eh1', String.raw`\htmlClass{eq-S}{S(t)}=\htmlClass{eq-p0}{p_0}\,\htmlClass{eq-h00}{h_{00}(t)}+\htmlClass{eq-m0}{m_0}\,\htmlClass{eq-h10}{h_{10}(t)}+\htmlClass{eq-p1}{p_1}\,\htmlClass{eq-h01}{h_{01}(t)}+\htmlClass{eq-m1}{m_1}\,\htmlClass{eq-h11}{h_{11}(t)}`, () => draw());
  const KEY = {p0: 0, h00: 0, m0: 1, h10: 1, p1: 2, h01: 2, m1: 3, h11: 3}, NAME = ['p₀', 'm₀', 'p₁', 'm₁'];

  function draw() {
    const hl = eq.hl, k = hl in KEY ? KEY[hl] : null, t = +g('i1t').value; g('o1t').textContent = t.toFixed(2);
    const S = s => d3.sum(H(s), (h, i) => h * par[i]), dS = s => d3.sum(dH(s), (h, i) => h * par[i]), ss = d3.range(0, 1.0001, .01);
    top.selectAll('*').remove();
    [0, 1].forEach(e => top.append('line').attr('x1', X(e)).attr('x2', X(e)).attr('y1', 15).attr('y2', 305).attr('stroke', '#333').attr('stroke-dasharray', '4 4'));
    top.append('path').attr('d', d3.line()(ss.map(s => [X(s), Y(S(s))]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', hl === 'S' ? 7 : 3.5);
    const tx = X(t), ty = Y(S(t)), sl = dS(t) * (Y(1) - Y(0)) / (X(1) - X(0));
    top.append('line').attr('x1', tx - 40).attr('y1', ty - 40 * sl).attr('x2', tx + 40).attr('y2', ty + 40 * sl).attr('stroke', '#fbbf24').attr('stroke-width', 2).attr('opacity', .8);
    top.append('circle').attr('cx', tx).attr('cy', ty).attr('r', 6).attr('fill', '#fff');
    [[0, 0, 0, 1], [1, 2, 2, 3]].forEach(([e, , pi, mi]) => {
      const px = X(e), py = Y(par[pi]), hx = X(e + D), hy = Y(par[pi] + par[mi] * D);
      top.append('line').attr('x1', px).attr('y1', py).attr('x2', hx).attr('y2', hy).attr('stroke', col7(mi)).attr('stroke-width', k === mi ? 6 : 3);
      top.append('circle').attr('cx', hx).attr('cy', hy).attr('r', k === mi ? 11 : 8).attr('fill', col7(mi)).attr('stroke', '#1c1c1c').attr('stroke-width', 2).style('cursor', 'ns-resize')
        .call(d3.drag().on('drag', ev => { par[mi] = clamp((Y.invert(ev.y) - par[pi]) / D, -6, 6); draw(); }));
      top.append('circle').attr('cx', px).attr('cy', py).attr('r', k === pi ? 13 : 10).attr('fill', col7(pi)).attr('stroke', '#1c1c1c').attr('stroke-width', 2.5).style('cursor', 'ns-resize')
        .call(d3.drag().on('drag', ev => { par[pi] = clamp(Y.invert(ev.y), -0.9, 1.9); draw(); }));
      top.append('text').attr('x', px).attr('y', py + 4).attr('text-anchor', 'middle').attr('fill', '#111').attr('font-size', 11).attr('font-weight', 700).attr('pointer-events', 'none').text(NAME[pi]);
      top.append('text').attr('x', hx).attr('y', hy + 4).attr('text-anchor', 'middle').attr('fill', '#111').attr('font-size', 10).attr('font-weight', 700).attr('pointer-events', 'none').text(NAME[mi]);
    });

    low.selectAll('*').remove();
    const terms = ss.map(s => H(s).map((h, i) => h * par[i])), all = terms.flatMap(r => [...r, d3.sum(r)]);
    const Y2 = d3.scaleLinear([Math.min(-0.2, d3.min(all)) - 0.1, Math.max(1, d3.max(all)) + 0.1], [185, 15]);
    low.append('path').attr('d', `M40,${Y2(0)}H780`).attr('stroke', '#555').attr('fill', 'none');
    d3.range(4).forEach(i => low.append('path').attr('d', d3.line()(ss.map((s, j) => [X(s), Y2(terms[j][i])]))).attr('fill', 'none').attr('stroke', col7(i)).attr('stroke-width', k === i ? 5 : 2.2).attr('opacity', k === null ? .85 : k === i ? 1 : .25));
    low.append('path').attr('d', d3.line()(ss.map((s, j) => [X(s), Y2(d3.sum(terms[j]))]))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3).attr('opacity', k === null ? 1 : .5);
    low.append('line').attr('x1', X(t)).attr('x2', X(t)).attr('y1', 15).attr('y2', 185).attr('stroke', '#fff').attr('opacity', .6);
    H(t).forEach((h, i) => low.append('circle').attr('cx', X(t)).attr('cy', Y2(h * par[i])).attr('r', 4.5).attr('fill', col7(i)));
    low.append('text').attr('x', 44).attr('y', 14).attr('fill', '#9ca3af').attr('font-size', 11).text('the four terms (coloured) and their sum (white)');

    const CAP = {
      S: '<b>S(t)</b>: the curve on the clock t from 0 to 1.',
      p0: '<b>p₀</b>: the value at the start. Drag the left dot.', p1: '<b>p₁</b>: the value at the end. Drag the right dot.',
      m0: '<b>m₀</b>: the slope at the start (rise per unit of t). Tilt the left handle.', m1: '<b>m₁</b>: the slope at the end. Tilt the right handle.',
      h00: '<b>h₀₀(t) = 2t³ − 3t² + 1</b>: equals 1 at t = 0 and 0 at t = 1, with flat slope at both. It carries p₀.',
      h10: '<b>h₁₀(t) = t³ − 2t² + t</b>: zero at both ends, slope 1 at t = 0, slope 0 at t = 1. It carries m₀.',
      h01: '<b>h₀₁(t) = −2t³ + 3t²</b>: 0 at t = 0 and 1 at t = 1, flat at both. It carries p₁.',
      h11: '<b>h₁₁(t) = t³ − t²</b>: zero at both ends, slope 0 at t = 0, slope 1 at t = 1. It carries m₁.'
    };
    g('eh1-cap').innerHTML = hl ? CAP[hl] : 'Hover a symbol, or tap it to keep it highlighted.';
    const h = H(t);
    g('eh1-sub').innerHTML = `S(${t.toFixed(2)}) = ` + [0, 1, 2, 3].map(i => `<span style="color:${col7(i)}">${par[i].toFixed(2)}·${h[i].toFixed(2)}</span>`).join(' + ') + ` = <b>${S(t).toFixed(3)}</b>`;
    g('eh1-chk').innerHTML = `Check: S(0) = ${S(0).toFixed(3)} (p₀ = ${par[0].toFixed(3)}), S′(0) = ${dS(0).toFixed(3)} (m₀ = ${par[1].toFixed(3)}), S(1) = ${S(1).toFixed(3)} (p₁ = ${par[2].toFixed(3)}), S′(1) = ${dS(1).toFixed(3)} (m₁ = ${par[3].toFixed(3)}).`;
  }
  g('i1t').addEventListener('input', draw); g('b1').onclick = () => { par = DEF.slice(); draw(); };
  draw();
})();
