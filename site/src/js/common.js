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


/* ---------- shared helpers for the math page ---------- */
const PAL7 = ['#3b82f6', '#f97316', '#22c55e', '#e11d48', '#a855f7', '#06b6d4', '#eab308'], col7 = i => PAL7[i % PAL7.length];

function bsD(i, pp, t, k, r) {                                   // r-th derivative of the B-spline basis function N_{i,pp}
  if (r === 0) return bspline(i, pp, t, k);
  if (pp === 0) return 0;
  const d1 = k[i + pp] - k[i], d2 = k[i + pp + 1] - k[i + 1];
  return pp * ((d1 ? bsD(i, pp - 1, t, k, r - 1) / d1 : 0) - (d2 ? bsD(i + 1, pp - 1, t, k, r - 1) / d2 : 0));
}

function solveLinear(A, b) {                                     // Gaussian elimination with partial pivoting (copies its input)
  A = A.map(r => r.slice()); b = b.slice();
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

function eqLab(id, tex, onChange) {                              // equation whose symbols (class "eq-<key>") are hoverable / tappable
  const el = document.getElementById(id);
  katex.render(tex, el, {displayMode: true, trust: true, throwOnError: false});
  const keyOf = n => { const m = n && n.closest && n.closest('[class*="eq-"]'); const k = m && [...m.classList].find(x => x.startsWith('eq-')); return k ? k.slice(3) : null; };
  const st = {hl: null, locked: null};
  const apply = () => { el.querySelectorAll('[class*="eq-"]').forEach(e => e.classList.toggle('on', keyOf(e) === st.hl)); onChange(st.hl); };
  el.addEventListener('mouseover', e => { st.hl = keyOf(e.target) || st.locked; apply(); });
  el.addEventListener('mouseleave', () => { st.hl = st.locked; apply(); });
  el.addEventListener('click', e => { const k = keyOf(e.target); st.locked = st.locked === k ? null : k; st.hl = st.locked; apply(); });
  st.refresh = () => el.querySelectorAll('[class*="eq-"]').forEach(e => e.classList.toggle('on', keyOf(e) === st.hl));
  return st;
}

function cubicSystem(xs, ys, type, s0, sn) {                     // interpolating cubic spline: system A M = r for M_i = S''(x_i), then coefficients
  const n = xs.length - 1, h = d3.range(n).map(i => xs[i + 1] - xs[i]), dl = d3.range(n).map(i => (ys[i + 1] - ys[i]) / h[i]);
  const A = d3.range(n + 1).map(() => new Array(n + 1).fill(0)), r = new Array(n + 1).fill(0);
  for (let i = 1; i < n; i++) { A[i][i - 1] = h[i - 1]; A[i][i] = 2 * (h[i - 1] + h[i]); A[i][i + 1] = h[i]; r[i] = 6 * (dl[i] - dl[i - 1]); }
  if (type === 'natural') { A[0][0] = 1; A[n][n] = 1; }
  else if (type === 'clamped') { A[0][0] = 2 * h[0]; A[0][1] = h[0]; r[0] = 6 * (dl[0] - s0); A[n][n - 1] = h[n - 1]; A[n][n] = 2 * h[n - 1]; r[n] = 6 * (sn - dl[n - 1]); }
  else { A[0][0] = h[1]; A[0][1] = -(h[0] + h[1]); A[0][2] = h[0]; A[n][n] = h[n - 2]; A[n][n - 1] = -(h[n - 2] + h[n - 1]); A[n][n - 2] = h[n - 1]; }
  const M = solveLinear(A, r);
  const a = ys.slice(0, n), c = M.slice(0, n).map(m => m / 2), d = d3.range(n).map(i => (M[i + 1] - M[i]) / (6 * h[i])), b = d3.range(n).map(i => dl[i] - h[i] * (2 * M[i] + M[i + 1]) / 6);
  const piece = x => Math.max(0, Math.min(n - 1, d3.bisectRight(xs, x) - 1));
  const ev = (x, o = 0) => { const i = piece(x), u = x - xs[i];
    return o === 0 ? a[i] + b[i] * u + c[i] * u * u + d[i] * u ** 3 : o === 1 ? b[i] + 2 * c[i] * u + 3 * d[i] * u * u : o === 2 ? 2 * c[i] + 6 * d[i] * u : 6 * d[i]; };
  return {n, h, A, r, M, a, b, c, d, piece, ev};
}
