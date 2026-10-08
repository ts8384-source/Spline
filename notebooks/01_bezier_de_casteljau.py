import marimo

app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    import numpy as np
    import matplotlib.pyplot as plt
    from math import comb
    return comb, mo, np, plt


@app.cell
def _(mo):
    mo.md(r"""
    # Bézier curves and de Casteljau

    ## Facts  *(Claude — see `corpus/notes/bezier-bspline-basics.md`, unverified)*

    A degree-$n$ Bézier curve with control points $P_0,\dots,P_n$:

    $$B(t)=\sum_{i=0}^{n}\binom{n}{i}(1-t)^{n-i}t^{i}\,P_i,\quad t\in[0,1].$$

    de Casteljau evaluates it by repeated linear interpolation:
    $P_i^{(k)}=(1-t)P_i^{(k-1)}+tP_{i+1}^{(k-1)}$. Drag $t$ below to watch the levels collapse to one point.
    """)
    return


@app.cell
def _(mo):
    t = mo.ui.slider(0, 1, step=0.01, value=0.4, label="t", full_width=True)
    t
    return (t,)


@app.cell
def _(comb, np, plt, t):
    P = np.array([[0, 0], [1, 3], [3, 3.5], [4, 0.5]], float)
    n = len(P) - 1
    ts = np.linspace(0, 1, 200)
    curve = sum(comb(n, i) * (1 - ts) ** (n - i) * ts**i * P[i][:, None] for i in range(n + 1))

    levels = [P]
    while len(levels[-1]) > 1:
        L = levels[-1]
        levels.append((1 - t.value) * L[:-1] + t.value * L[1:])

    fig, ax = plt.subplots(figsize=(6, 4))
    ax.plot(*curve, "k", lw=2)
    for k, L in enumerate(levels):
        ax.plot(*L.T, "o-", alpha=0.8, label=f"level {k}")
    ax.plot(*levels[-1][0], "r*", ms=14)
    ax.set_aspect("equal"); ax.legend(loc="lower right"); ax.grid(alpha=0.3)
    ax
    return


@app.cell
def _(mo):
    mo.md(r"""
    ## My understanding  *(you)*
    _write here_

    ## In my projects  *(you)*
    _write here_
    """)
    return


if __name__ == "__main__":
    app.run()
