# Cubenikal

A steel cube puzzle with gap sliding and no move limits or penalties. Run `npm start` (Python 3), then open the HTTP server in a browser. Module workers require HTTP rather than a file URL. No external packages or credentials are needed.

Choose 5, 7, 9, 11, 13, or 15 blocks per side. Drag to rotate, scroll/pinch to zoom, and tap a block to move it along its arrow. Arrows appear only on faces parallel to movement; rotate to inspect them. There are no automatic hints or free-block highlights. Departing blocks shrink to 75%.

## Movement and undo

A tap moves a block along its arrow. If the entire path is clear, it flies out. If another block is farther along that path, it slides through the available gap and stops immediately before that block. Even a one-cell gap is usable. A block with an occupied cell immediately ahead stays in place, without penalty.

There is no move budget, mistake limit, or failed-run state. Undo is unlimited and restores both slides and removals in reverse order. Sliding may obstruct a crossing path, so use Undo or Reset if needed. Block taps briefly wait while a slide animates; camera rotation and Undo remain available. Reset or R generates a new puzzle at the current size. Clearing all blocks advances to the next size; undoing the last removal before advancement cancels that transition.

## Spatial interlock generation

`generation.js` samples directions from all six cardinal vectors subject to ray clearance and neighbor exclusions. Coordinates define positions, shell membership, and obstruction tests; they do not select arrow directions. A randomized shell-removal plan is reversed to establish core-first placement. `difficulty.js` refines orientations using random proposals, rejecting adjacent matches, inward dependencies on smaller shells, and cycles. It reconstructs the accepted layout from an empty grid in reverse dependency order and verifies each insertion has a clear escape ray. Outer insertions then obstruct previously placed inner blocks.

Every accepted puzzle must satisfy:

- No two face-adjacent blocks have the same direction (six orthogonal neighbors, not diagonals).
- At most 15% of blocks are immediately removable in the initial state.
- Dependency depth at least `max(30, 4 × size)`: 30, 30, 36, 44, 52, 60 across the six sizes.
- Cross-axis blocking edges involving all three axes, with at least one cross-axis edge per two blocks overall.
- Complete solvability and an exact minimum of one successful removal per block.

The prior single-path serpentine generator is removed. A puzzle may have several simultaneous legal moves within the opening limit. Generation is a bounded randomized search: failed candidates are discarded; exhausted searches display a retry message rather than silently relaxing constraints. It runs in a background worker and usually takes seconds, longer at larger sizes. Changing size or resetting cancels stale work.

## Initial-layout solver

The internal BFS uses partial-order reduction for removal-only play. Legal removals commute and cannot disable each other, so exploring one canonical ordering avoids exponentially many equivalent subsets without losing solvability or changing the minimum move count. Tests compare it with exhaustive state BFS on small arbitrary puzzles. This validates a complete removal-only route from the initial layout, which remains a valid solution under the new rules. It does not analyze arbitrary states after optional slides: those can introduce obstacles and require Undo.

The initial layout remains fully solvable. These measured constraints do not prove subjective difficulty or require a fixed amount of foresight.

## Validation

Run `npm test` (Node.js 18+) for neighbor constraints, physical ray checks, core-first insertion, full solutions at every size, opening/depth filters, solver equivalence, penalty-free blocked taps, gap slides, collision stops, and unlimited undo.

Run `npm run validate:levels -- 5` for a fresh 5³ puzzle's measured validation report; omit the size to check all supported sizes. Reports include opening count, longest dependency chain, cross-axis edge count, and generation time.

## Camera and input

`camera.js` shares rotation and projection math with 3D ray-box picking, so selection follows the nearest actual solid cube regardless of screen density. Departing cubes are clipped before the camera near plane to prevent mirrored or reversed exits. Tests verify projected arrows and movement agree in all six directions across rotated views.
