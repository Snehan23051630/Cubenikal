# Cubenikal

An HTML5 and JavaScript 3D spatial puzzle with no dependencies or build step.

## Play

Run `npm start` (requires Python 3) in this directory and open the server in a browser. Drag to rotate, tap a cube to release it, and scroll or pinch to zoom. Every arrow describes a world-space escape direction. Arrows lie flat on faces parallel to the escape direction. Faces perpendicular to that direction stay blank; rotate to reveal the arrows. A block cannot escape until its entire path is clear. Hint rotates toward a free block and highlights it. Three puzzle sizes, optional sound, a timer, and a completion screen are included.

Every generated puzzle is solvable. New puzzles use a randomized valid removal sequence to assign directions.

## Validate

Run `npm test` (Node.js 18+). Tests check directional obstruction and complete solutions for 90 generated puzzles across all three sizes.

Source: `engine.js` contains puzzle rules; `game.js` handles Canvas 3D projection, interaction, and animation; `style.css` defines the responsive interface. No external APIs, credentials, fonts, or packages are required.
