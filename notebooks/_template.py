import marimo

app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    return (mo,)


@app.cell
def _(mo):
    mo.md(r"""
    # TITLE

    ## Facts  *(Claude)*
    ...

    ## My understanding  *(you)*
    _write here_

    ## In my projects  *(you)*
    _write here_
    """)
    return


if __name__ == "__main__":
    app.run()
