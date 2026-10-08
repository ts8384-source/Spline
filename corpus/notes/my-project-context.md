---
author: user (stated in chat, paraphrased by Claude)
status: user-stated
---
# My project: why I'm learning splines

## The task
Train a recurrent spiking neural network (RSNN) and let its internal dynamics do the work, to see whether it can observe and predict the motion of digits. The problem is dumbed down for now to a **bouncing ball**. This is a "pre-game" for a larger problem (I said "balancing evidence"; the wording came from voice transcription, so the exact name is unconfirmed).

## Current angle
Can the network predict motion? Input is **only the difference between consecutive frames** (no absolute frame), so the first thing to see is whether it learns a motion detector.

## Open questions (where splines might or might not help)
- Is a spline needed in the model at all? Probably not: the input is pixels, and a bouncing path is simple piecewise physics (straight lines or parabolas that reflect at walls).
- Possible uses: a generator for non-physical curved test trajectories, a smoother or evaluator for decoded paths, and a way to describe the network's internal state trajectory.
- The bounce is a kink in velocity, so a plain smooth cubic spline is the wrong tool across it (see the knots/multiplicity discussion).
