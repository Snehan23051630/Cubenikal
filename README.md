# Cubenikal

A full-screen HTML5/JavaScript spatial puzzle, with solid steel blocks and no menus or panels. Directional silver lighting, beveled edges, and perspective keep the cube's faces distinct while rotating.

Run `npm start` (Python 3 required) and open the server in a browser.

Drag to rotate, tap a block to release it along its arrow, and scroll or pinch to zoom. A block only leaves when its whole path is clear. Arrows lie flat on faces parallel to movement; rotate to reveal them. Press **R** to restart the current level.

Start at **5 × 5 × 5** (125 blocks). Clearing all blocks automatically advances to **7, 9, 11, 13, then 15 per side** (3,375 blocks). After the hardest level, clearing it generates another puzzle at that size. Each new level starts at a clear three-quarter viewing angle. Progress lasts for the current page session; reloading starts at 5 again.

Run `npm test` (Node.js 18+) for directional rules, progression, and complete solutions at every supported size. No external dependencies or credentials are required. Internal faces are omitted and idle frames are not repainted.
