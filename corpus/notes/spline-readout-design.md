---
author: Claude, from the chat; decisions are the user's to confirm
status: unverified
---
# Spline readout for the bouncing-ball RSNN: output, loss, spline type

Nothing here has been trained or tested. The demos (project page, slides 2 and 3) use the best spline fit as a stand-in for the network, so they show bookkeeping and the best-possible error, not real results.

## 1. What the network outputs
- Per time step τ the readout turns the hidden state into **control points**: `P = reshape(W_out · h_τ + b)`, shape n × 2 (x and y).
- A **fixed matrix B** (W × n) holds the bump values `B[k,i] = N_{i,p}(t_k)` at the W future frames. It depends only on knots, degree and sample times, so it is precomputed once and never trained.
- Predicted future positions: `X̂ = B · P` (W × 2). Collapsing it: `X̂ = (B · W_out) · h_τ`, a linear readout whose output is forced onto smooth curves.
- The network never has to learn smoothness. It only learns where control points go.

## 2. What spline
Starting choice (to confirm):
- **Clamped cubic B-spline** (degree p = 3, C² smooth), n ≈ 6–8 control points, uniform knots over the window.
- Why B-spline over an interpolating (natural) spline: local control, no linear solve, smoothness built in, convex-hull (no overshoot beyond nearby control points). The energy ∫(f'')² is not needed.
- Open: the **bounce is a corner**. A cubic with simple knots cannot make one. Options:
  1. Uniform knots, a few extra control points (simplest, measure error in windows with a bounce).
  2. A **triple knot (multiplicity 3)** at the bounce time makes the curve pass through a control point with a corner there. Needs the bounce time, so B is rebuilt per step (the knot positions are not differentiable inputs to P; predict the time separately or use a fixed schedule).
  3. Piecewise: one spline per segment between bounces (not explored).

## 3. Loss: only truth up to "now" is allowed
A forecast made at frame τ covers τ+1 … τ+W. Each target frame arrives later, so grade it then. Cell (τ, f) is gradable once f ≤ now.
- **A. Score each new frame (online):** at frame `now`, compare the W forecasts made at now−W … now−1 for frame `now` with the truth. Needs the last W forecasts stored; each is graded 1…W frames after it was made. Strictly causal.
- **B. Score a whole window afterwards:** loss of the forecast made at τ over τ+1 … τ+W, computed at τ+W. Fine on recorded data (later frames are labels, never inputs). A strictly online learner must wait W frames.
- **C. Window reaching into the past:** also output frames τ−Wp … τ. The past part is graded immediately but only teaches reconstruction, not forecasting; the future part is graded like B.
- Gradient route (my reasoning, untested): for A, an old forecast's error must reach the network state at the time it was made: truncated BPTT over W steps, or an eligibility-trace rule (e-prop) for an RSNN.
- Computing the ball's trajectory analytically is fine for making labels on synthetic data; it is mode B.

## 4. Open questions (my understanding goes here)
- Strictly online learning, or training on recorded sequences?
- Window length W and number of control points n?
- Bounce: extra control points, or triple knot with predicted bounce time?
- Does the loss weight near frames more than far frames?

## My understanding

## In my projects
