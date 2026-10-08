---
author: claude
status: partly-verified   # outline taken from web-search summaries of the Wikipedia articles (Spline (mathematics), Spline interpolation, B-spline) on 2026-10-08; the article text itself was not readable (en.wikipedia.org blocked by the sandbox). Items marked (std) are standard theory not cited from those summaries.
sources:
  - https://en.wikipedia.org/wiki/Spline_(mathematics)
  - https://en.wikipedia.org/wiki/Spline_interpolation
  - https://en.wikipedia.org/wiki/B-spline
---
# Mathematics of splines: what the math page covers

1. **Definition.** A spline is a function defined piecewise by polynomials on subintervals of [a, b]; the breakpoints are knots; pieces of degree at most n give a spline of degree n (order n + 1). (summaries)
2. **Smoothness.** S has smoothness C^r at a knot if adjacent pieces agree in value and the first r derivatives. For degree n with simple knots the usual requirement is C^(n-1). Repeating a knot m times lowers it to C^(n-m). (summaries; the n-m rule also verified live on the page)
3. **Counting.** k pieces of degree n have (n+1)k coefficients; a knot with smoothness r removes r+1 conditions; the dimension of the space is n+1 plus the sum of interior-knot multiplicities. (std; checked live against the B-spline count)
4. **Interpolating cubic splines.** n intervals have 4n coefficients; interpolation and C1, C2 continuity give 4n-2 conditions; two boundary conditions complete it: natural S''=0 at the ends, clamped end slopes given, not-a-knot S''' continuous at the second and second-to-last knots. Solved through a tridiagonal-type system for M_i = S''(x_i). (summaries; system derived and checked live)
5. **Bending energy.** The natural cubic spline minimises the integral of (f'')^2 among C2 interpolants (the flexible-strip property). Proof idea: the cross term of S + eps*w vanishes. (summaries + std; verified numerically on the page)
6. **B-spline basis.** Minimal-support basis; Cox-de Boor recursion from degree-0 boxes; every spline of the given degree and knots is a linear combination of B-splines. (summaries)
7. **Properties.** Non-negative, partition of unity, local support over p+1 spans, convex-hull property, end-point interpolation with clamped knots. (summaries + std; each checked live)
8. **Matrix form.** X = B P with B[k,i] = N_i(t_k). (std)
