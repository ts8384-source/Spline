# Learning roadmap

## Done (Spline Lab, `site/learn.html`)
1. Why one big polynomial fails (Runge) and a spline doesn't
2. A curve as a weighted sum of local bumps (basis functions)
3. de Casteljau: building a point by repeated averaging
4. Where the weights come from (the tree) and how it maps to the plane
5. What `t` is: a clock, not a length
6. Why we need `t`: regression `y=f(x)` cannot draw curves that double back
7. Continuity at a join (C0, C1, C2): two cubic pieces, locks, curvature comb

## Suggested next (in this order)
1. ~~Joining two pieces: continuity~~ (done, learn.html section 7).
2. **Knots and the B-spline basis.** Knot vectors, multiplicity (m copies lowers continuity by m), the Cox-de Boor recursion, clamped vs uniform. The project page already uses these without teaching them.
3. **Fitting: interpolation vs least squares vs smoothing splines.** Penalty on the bending energy, choosing the number of knots, overfitting. Links to regression and regularisation.
4. **Derivatives: velocity and acceleration from control points.** Needed for the sliding-window idea (successive windows should join with matching velocity).

## Later, only if needed
Catmull-Rom / Hermite (interpolating splines), arc-length reparametrisation (constant speed), NURBS (weights, exact circles), tensor-product surfaces.

## Project (`site/project.html`)
Knots on a bounce; spline as a network readout (oracle fit). Next: sliding window with per-frame correction; frames and difference-frames notebook.
