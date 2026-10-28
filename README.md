# Cubenikal

A full-screen HTML5/JavaScript puzzle: just a 10 × 10 × 10 cluster of 1,000 small white cubes. No menus, levels, statistics, panels, or external dependencies.

Run `npm start` (Python 3 required) and open the server in a browser.

Drag to rotate, tap a block to release it along its arrow, and scroll or pinch to zoom. A block only leaves when its whole path is clear. Arrows are drawn flat on faces parallel to the escape direction; rotate to see arrows on other faces. Press **R** to generate a fresh puzzle, including after clearing the cube.

Run `npm test` (Node.js 18+) to check directional obstruction and complete puzzle solutions. Generation uses a randomized valid removal sequence, so every puzzle is solvable. The renderer omits internal faces and redraws only when the view or puzzle changes or an animation is active.
