import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeDifficulty,makeHardLevel} from '../difficulty.js';
import {canEscape,makeLevel} from '../engine.js';
function rng(){let n=42;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
test('hard candidate search never scores below its baseline and does not mutate puzzle state',()=>{
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
 const result=makeHardLevel(15,{candidates:3,random:rng()});
 assert.equal(result.blocks.length,3375);assert.ok(result.analysis.solvable);
});
