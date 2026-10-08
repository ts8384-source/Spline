---
author: claude
status: unverified   # written from memory; check against corpus/sources before trusting
---
# Bézier and B-spline basics

## Bézier curve
A degree-n Bézier curve with control points P_0..P_n is B(t) = sum_i C(n,i) (1-t)^(n-i) t^i P_i, t in [0,1].
It interpolates P_0 and P_n, and is tangent to the first and last control-polygon segments.

## de Casteljau algorithm
Evaluate by repeated linear interpolation: P_i^(0)=P_i, P_i^(k)=(1-t)P_i^(k-1)+t P_(i+1)^(k-1). The single point left at level n is B(t). Numerically stable and subdivides the curve at t for free.

## B-spline
A degree-p B-spline curve is C(t) = sum_i N_{i,p}(t) P_i, where the basis N is defined over a non-decreasing knot vector by the Cox–de Boor recursion:
N_{i,0}(t)=1 if t_i <= t < t_{i+1} else 0;
N_{i,p}(t) = (t-t_i)/(t_{i+p}-t_i) N_{i,p-1}(t) + (t_{i+p+1}-t)/(t_{i+p+1}-t_{i+1}) N_{i+1,p-1}(t), with 0/0 := 0.

## Key properties
- Local support: moving one control point changes only p+1 knot spans.
- Partition of unity: the basis functions sum to 1, so the curve lies in the convex hull of its control points.
- Continuity: C^(p-m) at a knot of multiplicity m.
- A clamped knot vector (end knots repeated p+1 times) makes the curve start and end at the first and last control points; with n+1 points and degree n it reduces to a Bézier curve.

## Where the Bézier weights come from (route counting)
In de Casteljau each node is built from a left parent (weight 1-t) and a right parent (weight t). Pour one unit of weight from the final point down the tree: it splits (1-t)/t at every node. The share reaching control point P_i is (number of routes to P_i) * (1-t)^(n-i) * t^i, and the route counts are binomial coefficients C(n,i) (Pascal's triangle). So the weights are Bernstein polynomials = Binomial(n, t) probabilities, and B(t) is the expected control point. At t=0.5 every route weighs the same, so weights are C(n,i)/2^n (cubic: 1,3,3,1 over 8; quartic: 1,4,6,4,1 over 16).

## How one point of a cubic B-spline is computed (checked with exact fractions)
Given t: (1) find the knot span containing t; (2) only 4 bumps (degree + 1) are non-zero there; (3) evaluate those 4 bumps (Cox-de Boor: each is a blend of two lower-degree bumps); (4) the point is the sum of (bump value x control point) over those 4.
Uniform knots, cubic: in the middle of a span the four bump values are 1/48, 23/48, 23/48, 1/48; exactly at a knot only three are non-zero: 1/6, 2/3, 1/6. Both sets sum to 1. Compare the single Bézier at t = 0.5: 1/8, 3/8, 3/8, 1/8.
The list of control points is the spline's coordinate vector in the basis of bumps (like Fourier coefficients in a basis of sine waves, but the bumps are local).
