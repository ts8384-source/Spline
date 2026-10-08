/* ---------- 4 · Tree <-> plane ---------- */
(function () {
  const svg = d3.select('#pour'), xy = d3.select('#pourxy'), XYS = 400;
  const rowH = 50, top = 34, dx = 64, R = 15;
  const tIn = document.getElementById('pour-t'), nIn = document.getElementById('pour-n');
  const PAL = [C.blue, C.green, C.yellow, '#f97316', '#a855f7', '#ec4899', '#22d3ee'];
  const colorOf = (L, n) => L === n - 1 ? C.red : PAL[L];
  const nameOf = (L, n) => L === 0 ? 'control points' : L === n - 1 ? 'B(t)' : `blend ${L}`;
  const gen = n => n === 2 ? [[50, 300], [350, 100]] : d3.range(n).map(i =>
    [50 + 300 * i / (n - 1), 300 - 220 * Math.sin(Math.PI * i / (n - 1)) + (i > 0 && i < n - 1 ? (i % 2 ? -30 : 40) : 0)]);
  const levelsPos = (P, t) => {                      // lv[L] has n-L points; lv[0] = control points
    const lv = [P];
    while (lv[lv.length - 1].length > 1) {
      const q = lv[lv.length - 1];
      lv.push(q.slice(1).map((b, i) => [(1 - t) * q[i][0] + t * b[0], (1 - t) * q[i][1] + t * b[1]]));
    }
    return lv;
  };
  const f0 = p => `${Math.round(p[0])}, ${Math.round(p[1])}`;
  const f3 = v => v.toFixed(3);
  let sel = 1, node = null, selLevel = null, P = [], Pn = 0;
  xy.attr('viewBox', `0 0 ${XYS} ${XYS}`);
  const xyLayer = xy.append('g'), xyHandles = xy.append('g');

  function explain(L, n) {
    if (L === null) return 'Click a circle on the tree, or a chip above, to see what that row is doing in the plane.';
    if (L === 0) return `<b>Control points</b> (${n}): the only points you place. Their dot size on the right shows their weight in B(t).`;
    if (L === n - 1) return '<b>B(t)</b>: the one point left after all the blending. This is the point on the curve.';
    return `<b>${nameOf(L, n)}</b> (${n - L} points): each one sits <i>t</i> of the way along a segment between two neighbouring points of the row below it. ${n - L} points join into ${n - L - 1} segment${n - L - 1 > 1 ? 's' : ''}, which become the next row.`;
  }

  function draw() {
    const t = +tIn.value, n = +nIn.value;
    document.getElementById('pour-tv').textContent = t.toFixed(2);
    document.getElementById('pour-nv').textContent = n;
    if (n !== Pn) { P = gen(n); Pn = n; }
    sel = Math.min(sel, n - 1);
    if (node && node[0] >= n) node = null;
    if (selLevel !== null && selLevel > n - 1) selLevel = null;
    const lv = levelsPos(P, t), last = n - 1;
    const share = [[1]], routes = [[1]];
    for (let r = 0; r < last; r++) {
      const s = new Array(r + 2).fill(0), c = new Array(r + 2).fill(0);
      share[r].forEach((v, j) => { s[j] += (1 - t) * v; s[j + 1] += t * v; c[j] += routes[r][j]; c[j + 1] += routes[r][j]; });
      share.push(s); routes.push(c);
    }

    /* chips: choose a row */
    const chips = d3.select('#pour-chips'); chips.selectAll('*').remove();
    const mk = (label, color, on, fn) => {
      const b = chips.append('button').attr('class', 'chip' + (on ? ' on' : '')).on('click', fn);
      if (color) b.append('span').attr('class', 'dot').style('background', color);
      b.append('span').text(label);
    };
    mk('all rows', null, selLevel === null, () => { selLevel = null; node = null; draw(); });
    for (let L = 0; L < n; L++) mk(nameOf(L, n), colorOf(L, n), selLevel === L, () => { selLevel = L; node = null; draw(); });

    /* tree */
    const W = Math.max(400, last * dx + 80), H = top + last * rowH + 140;
    svg.attr('viewBox', `0 0 ${W} ${H}`).selectAll('*').remove();
    const X = (r, j) => W / 2 + (j - r / 2) * dx, Y = r => top + r * rowH;
    const onPath = (r, j) => j <= sel && sel <= j + (n - 2 - r);
    const edges = svg.append('g');
    for (let r = 0; r < last; r++) for (let j = 0; j <= r; j++) [[j, C.blue], [j + 1, C.yellow]].forEach(([jj, col]) => {
      const hot = onPath(r, jj), inc = node && r + 1 === node[0] && jj === node[1];
      if (inc) edges.append('line').attr('x1', X(r, j)).attr('y1', Y(r)).attr('x2', X(r + 1, jj)).attr('y2', Y(r + 1))
        .attr('stroke', '#fff').attr('stroke-width', 9).attr('opacity', .55);
      edges.append('line').attr('x1', X(r, j)).attr('y1', Y(r)).attr('x2', X(r + 1, jj)).attr('y2', Y(r + 1))
        .attr('stroke', col).attr('stroke-width', hot ? 3.5 : 1.5).attr('opacity', hot ? 1 : .22);
    });
    const nodes = svg.append('g');
    share.forEach((row, r) => row.forEach((v, j) => {
      const L = last - r, dim = selLevel !== null && selLevel !== L ? .4 : 1;
      const g = nodes.append('g').attr('transform', `translate(${X(r, j)},${Y(r)})`).style('cursor', 'pointer')
        .on('click', () => { node = [r, j]; selLevel = L; if (r === last) sel = j; draw(); });
      g.append('circle').attr('r', R).attr('fill', C.bg).attr('stroke', colorOf(L, n)).attr('stroke-width', 2.5).attr('opacity', dim);
      g.append('circle').attr('r', R - 1).attr('fill', colorOf(L, n)).attr('opacity', dim * (.1 + .6 * v));
      g.append('text').attr('text-anchor', 'middle').attr('dy', '0.35em').attr('fill', '#fff').attr('font-size', 10).attr('opacity', dim)
        .text(v >= .9995 ? '1' : v.toFixed(2).replace(/^0/, ''));
      if (node && node[0] === r && node[1] === j) g.append('circle').attr('r', R + 4).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
    }));
    const by = Y(last) + 100;
    share[last].forEach((v, i) => {
      const x = X(last, i), isSel = i === sel, h = v * 80;
      const hit = svg.append('g').style('cursor', 'pointer').on('click', () => { sel = i; node = [last, i]; selLevel = 0; draw(); });
      hit.append('rect').attr('x', x - dx / 2).attr('y', Y(last) + R + 2).attr('width', dx).attr('height', by - Y(last) - R + 20).attr('fill', 'transparent');
      hit.append('rect').attr('x', x - 15).attr('y', by - h).attr('width', 30).attr('height', Math.max(h, 1)).attr('fill', C.blue)
        .attr('opacity', isSel ? 1 : .5).attr('stroke', isSel ? '#fff' : 'none').attr('stroke-width', 2);
      hit.append('text').attr('x', x).attr('y', by - h - 5).attr('text-anchor', 'middle').attr('fill', C.gray).attr('font-size', 10).text(f3(v));
      hit.append('text').attr('x', x).attr('y', by + 16).attr('text-anchor', 'middle').attr('fill', isSel ? '#fff' : C.gray).attr('font-size', 12).text('P' + i);
    });
    svg.append('text').attr('x', 8).attr('y', 18).attr('fill', C.blue).attr('font-size', 11).text('← × (1 − t)');
    svg.append('text').attr('x', W - 8).attr('y', 18).attr('text-anchor', 'end').attr('fill', C.yellow).attr('font-size', 11).text('× t →');

    /* plane */
    xyLayer.selectAll('*').remove();
    const bez = s => levelsPos(P, s).at(-1)[0];
    xyLayer.append('path').attr('d', d3.line()(d3.range(0, 1.0001, .01).map(bez))).attr('fill', 'none').attr('stroke', '#444').attr('stroke-width', 2);
    xyLayer.append('path').attr('d', d3.line()(d3.range(0, t + 1e-9, .01).map(bez))).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 3);
    const lop = L => selLevel === null ? .9 : L === selLevel ? 1 : L === selLevel - 1 ? .55 : .15;
    lv.forEach((pts, L) => {
      const col = colorOf(L, n);
      if (pts.length > 1) xyLayer.append('path').attr('d', d3.line()(pts)).attr('fill', 'none').attr('stroke', col)
        .attr('stroke-width', L === selLevel ? 3 : 1.8).attr('opacity', lop(L));
      if (L > 0) xyLayer.selectAll(null).data(pts).join('circle').attr('cx', d => d[0]).attr('cy', d => d[1])
        .attr('r', L === last ? 8 : 5.5).attr('fill', col).attr('opacity', lop(L));
    });
    let msg = '';
    if (node) {
      const [r, j] = node, L = last - r, pt = lv[L][j], v = share[r][j];
      xyLayer.append('circle').attr('cx', pt[0]).attr('cy', pt[1]).attr('r', 12).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 2.5);
      if (L > 0) {
        const a = lv[L - 1][j], b = lv[L - 1][j + 1];
        xyLayer.append('line').attr('x1', a[0]).attr('y1', a[1]).attr('x2', b[0]).attr('y2', b[1]).attr('stroke', '#fff').attr('stroke-width', 3).attr('opacity', .85);
        msg += `<b>Position</b> (${f0(pt)}) = ${(1 - t).toFixed(2)} × (${f0(a)}) + ${t.toFixed(2)} × (${f0(b)}), the point ${t.toFixed(2)} of the way from the first to the second.<br>`;
      } else msg += `<b>P${j}</b> sits at (${f0(pt)}) because you put it there.<br>`;
      if (r === 0) msg += '<b>Weight</b>: the whole 1 unit starts here.';
      else {
        const fromL = j >= 1 ? t * share[r - 1][j - 1] : null, fromR = j <= r - 1 ? (1 - t) * share[r - 1][j] : null, parts = [];
        if (fromL !== null) parts.push(`${f3(fromL)} (t × ${f3(share[r - 1][j - 1])} from the circle above-left)`);
        if (fromR !== null) parts.push(`${f3(fromR)} ((1−t) × ${f3(share[r - 1][j])} from the circle above-right)`);
        msg += `<b>Weight</b> on the tree = ${f3(v)} = ${parts.join(' + ')}`;
      }
      if (r === last) msg += `<br><b>Routes</b>: ${routes[last][j]} × ${((1 - t) ** (last - j) * t ** j).toFixed(4)} per route = ${f3(share[last][j])}`;
    }
    document.getElementById('pour-explain').innerHTML = explain(node ? last - node[0] : selLevel, n);
    document.getElementById('pour-readout').innerHTML = msg;

    xyHandles.selectAll('circle').data(P).join('circle')
      .attr('cx', d => d[0]).attr('cy', d => d[1]).attr('r', (d, i) => 5 + 22 * share[last][i])
      .attr('fill', C.blue).attr('stroke', '#fff').attr('stroke-width', (d, i) => node && node[0] === last && node[1] === i ? 3 : 1)
      .attr('opacity', lop(0)).style('cursor', 'grab')
      .call(d3.drag().on('drag', (ev, d) => { d[0] = Math.max(10, Math.min(XYS - 10, ev.x)); d[1] = Math.max(10, Math.min(XYS - 10, ev.y)); draw(); }));
    xyLayer.selectAll(null).data(P).join('text').attr('x', d => d[0] + 12).attr('y', d => d[1] - 12).attr('fill', C.gray).attr('font-size', 11)
      .attr('pointer-events', 'none').text((d, i) => 'P' + i);
  }
  const presets = {
    reset: n => gen(n),
    straight: n => d3.range(n).map(i => [50 + 300 * i / (n - 1), 300 - 200 * i / (n - 1)]),
    zigzag: n => d3.range(n).map(i => [50 + 300 * i / (n - 1), i % 2 ? 90 : 310]),
    loop: () => [[130, 330], [350, 40], [50, 40], [270, 330]]
  };
  document.querySelectorAll('#pour-presets [data-p]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.p === 'loop') nIn.value = 4;
    const n = +nIn.value; P = presets[b.dataset.p](n); Pn = n; draw();
  }));
  tIn.addEventListener('input', draw); nIn.addEventListener('input', draw);
  draw();
})();

