export const LEVEL_SIZES = Object.freeze([5, 7, 9, 11, 13, 15]);
// After the final size, keep offering fresh puzzles at maximum difficulty.
export function nextLevel(index) {
 return Math.min(index + 1, LEVEL_SIZES.length - 1);
}
