# Cubenikal

A dependency-free vanilla JavaScript 3D puzzle. The whole game runs from three files: `index.html`, `style.css`, and `game.js`.

Run `npm start` from this folder, then open the shown local address in a browser. Python 3 is the only runtime requirement.

Choose a cube size, drag to rotate, scroll or pinch to zoom, and tap blocks to move them along their arrows. A clear path lets a block fly out. A gap lets it slide until the next block. Undo is unlimited and Reset or **R** creates a new puzzle.

`game.js` contains rendering, 3D picking, movement, undo, level generation, and difficulty validation. There are no external packages, build tools, workers, or test files.
