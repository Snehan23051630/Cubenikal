import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeDifficulty,makeHardLevel} from '../difficulty.js';
import {canEscape,makeLevel} from '../engine.js';
function rng(){let n=42;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
test('reverse assembly exceeds baseline depth and leaves puzzle state intact',()=>{
 const baseline=analyzeDifficulty(makeLevel(5,rng()));
 const result=makeHardLevel(5,{random:rng()});
 assert.ok(result.analysis.score>=baseline.score);assert.ok(result.analysis.solvable);
 assert.ok(result.blocks.every(b=>!b.removed));
 while(result.blocks.some(b=>!b.removed)){const free=result.blocks.filter(b=>!b.removed&&canEscape(b,result.blocks));assert.ok(free.length);free.forEach(b=>b.removed=true);}
});
test('analyzer rejects cyclic dependencies',()=>{
 assert.equal(analyzeDifficulty([{pos:[0,0,0],dir:[1,0,0]},{pos:[1,0,0],dir:[-1,0,0]}]).solvable,false);
});
test('hardest supported size generates a valid dependency graph',()=>{
 const result=makeHardLevel(15,{random:rng()});
 assert.equal(result.blocks.length,3375);assert.ok(result.analysis.solvable);
});
import {solveByBFS} from '../difficulty.js';
test('strict generation has one legal move throughout every supported size',()=>{
 for(const size of [5,7,9,11,13,15]){
  const {analysis}=makeHardLevel(size,{random:rng()});
  assert.equal(analysis.minMoves,size**3);assert.equal(analysis.maxDepth,size**3);assert.equal(analysis.maxBranching,1);
 }
});
test('BFS rejects a puzzle with more than two choices',()=>{
 const blocks=[0,1,2].map(y=>({pos:[0,y,0],dir:[1,0,0]}));
 assert.equal(solveByBFS(blocks).reason,'too many legal moves');
});
