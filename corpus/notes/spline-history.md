---
author: claude
status: partly-verified   # items marked (src) come from a web search summary (2026-10-08) of the pages listed below; (mem) items are from memory
sources:
  - https://en.wikipedia.org/wiki/Spline_(mathematics)
  - https://en.wikipedia.org/wiki/Flat_spline
---
# Where splines came from

## The physical spline
(src) Draftsmen pinned a long thin flexible strip of wood, plastic or metal (a spline or lath) at points using lead weights called "ducks", mainly to draw ship hulls; British aircraft designers used the same lofting method in WWII. The strip's elasticity gives the shape that minimizes bending energy between the ducks.

## The maths
(src) Isaac Schoenberg's 1946 paper is commonly accepted as the first mathematical use of "spline" for smooth piecewise-polynomial approximation, named after the draftsman's tool. Conic lofting was replaced in the early 1960s by splines (J. C. Ferguson at Boeing, later Malcolm Sabin at BAC).

## Parametric curves for car bodies
(src) Paul de Casteljau (Citroën) and Pierre Bézier (Renault) worked in near parallel; Bézier published, so the curves carry his name and de Casteljau's name is on the algorithm.

## Parameter t
(mem) The physical strip has no t. It is a shape, naturally written as height y = f(x) along the board. The parameter t arrived with computers: a car body needs curves that loop or go vertical, which y = f(x) cannot do. The closest physical analogue of a parameter is distance measured along the strip (arc length), which is not what Bézier's t is.
