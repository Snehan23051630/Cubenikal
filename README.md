# Cubenikal

A removal-only steel cube puzzle with strict move penalties. Run `npm start` (Python 3), then open the HTTP server in a browser. Module workers require HTTP rather than a file URL. No external packages or credentials are needed.

Choose 5, 7, 9, 11, 13, or 15 blocks per side. Drag to rotate, scroll/pinch to zoom, and tap a block to remove it along its arrow. Arrows appear only on faces parallel to movement; rotate to inspect them. There are no automatic hints or free-block highlights. Departing blocks shrink to 75%.

## Strict rules

The budget is the exact minimum number of removals plus two. Both successful removals and blocked taps cost one move. A run ends as soon as its remaining budget cannot cover the remaining blocks. Two undos can restore recent removals, but never refund moves; removing the restored block spends another move. Reset or R generates a new puzzle at the current size. Clearing advances through the supported sizes, with fresh puzzles at 15 after the last level.

## Spatial interlock generation

`generation.js` samples directions from all six cardinal vectors subject to ray clearance and neighbor exclusions. Coordinates define positions, shell membership, and obstruction tests; they do not select arrow directions. A randomized shell-removal plan is reversed to establish core-first placement. `difficulty.js` refines orientations using random proposals, rejecting adjacent matches, inward dependencies on smaller shells, and cycles. It reconstructs the accepted layout from an empty grid in reverse dependency order and verifies each insertion has a clear escape ray. Outer insertions then obstruct previously placed inner blocks.

Every accepted puzzle must satisfy:

- No two face-adjacent blocks have the same direction (six orthogonal neighbors, not diagonals).
- At most 15% of blocks are immediately removable in the initial state.
- Dependency depth at least `max(30, 4 × size)`: 30, 30, 36, 44, 52, 60 across the six sizes.
- Cross-axis blocking edges involving all three axes, with at least one cross-axis edge per two blocks overall.
- Complete solvability and an exact minimum of one successful removal per block.

The prior single-path serpentine generator is removed. A puzzle may have several simultaneous legal moves within the opening limit. Generation is a bounded randomized search: failed candidates are discarded; exhausted searches display a retry message rather than silently relaxing constraints. It runs in a background worker and usually takes seconds, longer at larger sizes. Changing size or resetting cancels stale work.

## Solver

The internal BFS uses partial-order reduction for removal-only play. Legal removals commute and cannot disable each other, so exploring one canonical ordering avoids exponentially many equivalent subsets without losing solvability or changing the minimum move count. Tests compare it with exhaustive state BFS on small arbitrary puzzles. This reduction would be invalid for sliding or other mechanics that can introduce obstacles.

Strict penalties discourage blind tapping. Legal moves still cannot create structural deadlocks, and these measured constraints do not prove subjective difficulty or require a player to plan a fixed number of moves ahead.

## Validation

Run `npm test` (Node.js 18+) for neighbor constraints, physical ray checks, core-first insertion, full solutions at every size, opening/depth filters, solver equivalence, penalty exhaustion, and non-refunding undo.

Run `npm run validate:levels -- 5` for a fresh 5³ puzzle's measured validation report; omit the size to check all supported sizes. Reports include opening count, longest dependency chain, cross-axis edge count, and generation time.
