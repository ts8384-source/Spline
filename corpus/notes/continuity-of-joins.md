---
author: claude
status: derived-and-numerically-checked   # formulas derived by hand; the demo's readout confirmed the jumps are 0. Terminology (C^k, G^k) is standard but from memory.
---
# Continuity at the join of two cubic Bézier pieces

Pieces A = (P0,P1,P2,J) and B = (J,Q1,Q2,Q3), both with t in [0,1], sharing the join J.

## Conditions
- C0 (position): A(1) = B(0). Holds automatically because both pieces share J.
- C1 (velocity): A'(1) = B'(0), i.e. 3(J - P2) = 3(Q1 - J), so Q1 = 2J - P2 (Q1 is the mirror of P2 across J).
- C2 (acceleration): A''(1) = B''(0), i.e. P1 - 2P2 + J = J - 2Q1 + Q2. With C1 this gives Q2 = P1 - 4P2 + 4J.

## Degrees of freedom
Two pieces: 7 control points free for C0, 6 for C1, 5 for C2. Five equals the number of control points of a cubic B-spline with two spans (spans + 3).

## Direction vs speed
C1 matches the velocity vector (direction and speed, so the clock t matters). Matching only the tangent direction is the weaker geometric condition G1 (from memory).

## Acceleration, in this context
Position B(t), velocity B'(t), acceleration B''(t): derivatives with respect to the clock t (t itself runs at a constant rate). Acceleration splits into a part along the path (changes speed) and a sideways part toward the centre of the bend, of size speed^2 / radius (standard calculus, from memory).

## When to ask for C2 (general knowledge, not source-checked)
- Want: motion of cameras, robots, vehicles, animated objects (acceleration jumps are jolts); smoothing noisy data (cubic smoothing splines are C2); visible shapes such as car-body surfaces.
- Don't want: impacts and bounces (velocity really flips, use a C0 knot), designed corners and glyph points, step commands.
- Cubic B-spline with single knots is C2 everywhere (continuity C^(p-m) at a knot of multiplicity m); chained cubic Béziers need the locks above.
