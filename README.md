# Cubenikal

A full-screen HTML5/JavaScript spatial puzzle, with solid steel blocks and a compact size selector. Directional silver lighting, beveled edges, and perspective keep the cube's faces distinct while rotating.

Run `npm start` (Python 3 required) and open the server in a browser.

Drag to rotate, tap a block to release it along its arrow, and scroll or pinch to zoom. A block only leaves when its whole path is clear. Arrows lie flat on faces parallel to movement; rotate to reveal them. Press **R** to generate a new puzzle at the current size.

Start at **5 × 5 × 5** (125 blocks). Clearing all blocks automatically advances to **7, 9, 11, 13, then 15 per side** (3,375 blocks). After the hardest level, clearing it generates another puzzle at that size. Each new level starts at a clear three-quarter viewing angle. Progress lasts for the current page session; reloading starts at 5 again.

Run `npm test` (Node.js 18+) for directional rules, progression, and complete solutions at every supported size. No external dependencies or credentials are required. Internal faces are omitted and idle frames are not repainted.

## Size selection and harder puzzles

The compact selector lets you jump directly to any supported size. Clearing a puzzle still advances automatically. Generation runs in a module Web Worker, scores 24 candidates, and selects the highest-scoring solvable candidate. It favors long blocker chains and fewer initial openings, using a chain-biased generator alongside a random baseline. This is a bounded search, not a proof of maximum possible difficulty. All legal removals remain safe; the challenge is finding openings and tracing dependencies.

Departing blocks smoothly shrink to 75% size while escaping; their arrows shrink with them. Stationary blocks keep their original size. New files: `difficulty.js` (analysis/search), `generator.worker.js` (background generation). Serve via HTTP, as module workers do not work from a directly opened file URL.
