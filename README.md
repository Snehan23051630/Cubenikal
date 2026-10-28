# Cubenikal

A removal-only steel cube puzzle with strict move penalties. Run `npm start` (Python 3), then open the HTTP server in a browser. Module workers require HTTP rather than a file URL. No external packages or credentials are needed.

Choose 5, 7, 9, 11, 13, or 15 blocks per side. Drag to rotate, scroll/pinch to zoom, and tap a block to remove it along its arrow. Arrows appear only on faces parallel to movement; rotate to inspect them. There are no automatic hints or free-block highlights. Departing blocks shrink to 75%.

## Strict rules

The budget is the exact minimum number of removals plus two. Both successful removals and blocked taps cost one move. A run ends as soon as its remaining budget cannot cover the remaining blocks. Two undos can restore recent removals, but never refund moves; removing the restored block spends another move. Reset or R generates a new puzzle at the current size. Clearing advances through the supported sizes, with fresh puzzles at 15 after the last level.

## Generation and validation

`difficulty.js` constructs a continuous serpentine lattice path, varies plane sweep axes and cube transforms, and inserts blocks in reverse solution order. Each arrow follows a geometric dependency on its predecessor. This produces a full dependency chain: exactly one legal removal at every stage, with dependency depth equal to the block count (125–3,375). The chain layout has a learnable traversal pattern; these guarantees do not prove subjective difficulty or require five-move foresight.

An internal BFS validates legal removal states, rejects branching above two, and proves the exact minimum move count. The constructor produces a one-state-wide frontier. Generation fails closed if validation exceeds its state limit, finds a cycle, or finds depth below 30. A background module worker handles generation.

Removing a legal block can never create a structural trap. Failure comes from the move budget. The earlier proposal that every block must block two or three earlier blocks is not enforced: seed and chain-end blocks require exceptions, and strict single-move sequencing is the enforced constraint. Multi-directional blocks and structural deadlocks are not part of this removal-only variant.

## Tests

`npm test` (Node.js 18+) covers obstruction, full solutions, every size's strict branching/depth, BFS rejection, move penalties, budget exhaustion, and limited non-refunding undo.
