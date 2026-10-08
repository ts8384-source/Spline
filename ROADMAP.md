# Learning roadmap

## Done (Spline Lab, `site/learn.html`)
1. Why one big polynomial fails (Runge) and a spline doesn't
2. A curve as a weighted sum of local bumps (basis functions)
3. de Casteljau: building a point by repeated averaging
4. Where the weights come from (the tree) and how it maps to the plane
5. What `t` is: a clock, not a length
6. Why we need `t`: regression `y=f(x)` cannot draw curves that double back
7. Continuity at a join (C0, C1, C2): two cubic pieces, locks, curvature comb
8. Position, velocity, acceleration refresher (learn.html section 7), and when to ask for C2
9. The derivative ladder (learn.html section 8): x, x', x'' as three stacked graphs, acceleration as how much the graph bends
10. Knots are the seams of a curve (learn.html section 11): coloured pieces, clock strip, arrows at the seam, copies 1-4
11. What C0, C1, C2 feel like: three joins side by side, velocity and acceleration arrows, osculating circles

## Suggested next (in this order)
1. ~~Joining two pieces: continuity~~ (done, learn.html section 7).
2. ~~Knots and the B-spline basis~~ (done, learn.html section 11): draggable knots, degree 0-3, multiplicity and continuity p-m, Cox-de Boor recursion, bumps add to 1.
3. **Fitting: interpolation vs least squares vs smoothing splines.** Penalty on the bending energy, choosing the number of knots, overfitting. Links to regression and regularisation.
4. **Derivatives: velocity and acceleration from control points.** Needed for the sliding-window idea (successive windows should join with matching velocity).

## Later, only if needed
Catmull-Rom / Hermite (interpolating splines), arc-length reparametrisation (constant speed), NURBS (weights, exact circles), tensor-product surfaces.

## Project (`site/project.html`)
Knots on a bounce; spline as a network readout (oracle fit). Next: sliding window with per-frame correction; frames and difference-frames notebook.

## Math page (math.html)
Prototype done (core equation). Next: cover each section of the Wikipedia article 'Spline (mathematics)' as annotated, interactive equations. Blocked on article access (allow en.wikipedia.org in the environment network settings, or paste the text).
