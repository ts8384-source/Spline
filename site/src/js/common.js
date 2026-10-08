const C = {bg:'#1c1c1c', blue:'#3b82f6', yellow:'#fbbf24', green:'#22c55e', red:'#ef4444', gray:'#9ca3af'};

document.querySelectorAll('[data-tex]').forEach(el =>
  katex.render(el.dataset.tex, el, {displayMode: el.dataset.display === '1', throwOnError: false}));

/* ---------- math helpers ---------- */
function bspline(i, p, t, k) {                       // Cox–de Boor, 0/0 := 0
  if (p === 0) {
    const last = k[k.length - 1];
    return ((k[i] <= t && t < k[i + 1]) || (t === last && k[i] < k[i + 1] && k[i + 1] === last)) ? 1 : 0;
  }
  const d1 = k[i + p] - k[i], d2 = k[i + p + 1] - k[i + 1];
  return (d1 ? (t - k[i]) / d1 * bspline(i, p - 1, t, k) : 0)
       + (d2 ? (k[i + p + 1] - t) / d2 * bspline(i + 1, p - 1, t, k) : 0);
}

function natSpline(xs, ys) {                         // natural cubic spline via second derivatives M
  const n = xs.length - 1, h = [], M = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) h[i] = xs[i + 1] - xs[i];
  const m = n - 1;
  if (m > 0) {
    const b = [], c = [], r = [];
    for (let j = 0; j < m; j++) {
      const i = j + 1;
      b[j] = 2 * (h[i - 1] + h[i]); c[j] = h[i];
      r[j] = 6 * ((ys[i + 1] - ys[i]) / h[i] - (ys[i] - ys[i - 1]) / h[i - 1]);
    }
    for (let j = 1; j < m; j++) { const w = h[j] / b[j - 1]; b[j] -= w * c[j - 1]; r[j] -= w * r[j - 1]; }
    const x = []; x[m - 1] = r[m - 1] / b[m - 1];
    for (let j = m - 2; j >= 0; j--) x[j] = (r[j] - c[j] * x[j + 1]) / b[j];
    for (let j = 0; j < m; j++) M[j + 1] = x[j];
  }
  return t => {
    const i = Math.min(n - 1, Math.max(0, d3.bisect(xs, t) - 1)), H = h[i];
    return M[i] * (xs[i + 1] - t) ** 3 / (6 * H) + M[i + 1] * (t - xs[i]) ** 3 / (6 * H)
         + (ys[i] / H - M[i] * H / 6) * (xs[i + 1] - t) + (ys[i + 1] / H - M[i + 1] * H / 6) * (t - xs[i]);
  };
}

function lagrange(xs, ys) {
  return t => ys.reduce((s, yj, j) =>
    s + yj * xs.reduce((p, xm, m) => m === j ? p : p * (t - xm) / (xs[j] - xm), 1), 0);
}

function axes(g, x, y, xt, yt) {
  g.append('g').attr('transform', `translate(0,${y.range()[0]})`).call(d3.axisBottom(x).ticks(xt))
    .call(a => a.selectAll('text,line,path').attr('stroke', null).attr('fill', C.gray).attr('stroke', C.gray));
  g.append('g').attr('transform', `translate(${x.range()[0]},0)`).call(d3.axisLeft(y).ticks(yt))
    .call(a => a.selectAll('text,line,path').attr('fill', C.gray).attr('stroke', C.gray));
}

