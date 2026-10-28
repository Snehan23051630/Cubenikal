import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeDifficulty,makeHardLevel,solveByBFS,minimumDepth,validatePatterns} from '../difficulty.js';
import {canEscape,DIRECTIONS} from '../engine.js';
function rng(seed){let n=seed;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
for(const size of [5,7,9,11,13,15])test(`size ${size}: random vectors, neighbor exclusions, core-first assembly, depth and openings`,()=>{
 const {blocks,analysis}=makeHardLevel(size,{random:rng(42+size)}),lookup=new Map(blocks.map(b=>[b.pos.join(','),b])),mid=(size-1)/2;
 assert.equal(blocks.length,size**3);assert.equal(lookup.size,blocks.length);
 assert.deepEqual(blocks[0].pos,[mid,mid,mid]);
 let lastRadius=0;const placed=[];
 for(const b of blocks){
  assert.ok(DIRECTIONS.some(d=>d.every((v,i)=>v===b.dir[i])));
  const radius=Math.max(...b.pos.map(v=>Math.abs(v-mid)));assert.ok(radius>=lastRadius);lastRadius=radius;
  assert.equal(canEscape(b,placed),true,'reverse insertion must have a clear ray');placed.push(b);
  for(const d of DIRECTIONS){const other=lookup.get(b.pos.map((v,i)=>v+d[i]).join(','));if(other)assert.notDeepEqual(b.dir,other.dir);}
 }
 const free=blocks.filter(b=>canEscape(b,blocks));assert.equal(free.length,analysis.initialOpenings);assert.ok(free.length<=Math.floor(blocks.length*.15));
 assert.ok(analysis.maxDepth>=minimumDepth(size));assert.ok(analysis.crossAxisEdges>=blocks.length/2);assert.equal(analysis.minMoves,blocks.length);
 // Independently exercise the physical rule, in reverse assembly order.
 for(const b of [...blocks].reverse()){assert.equal(canEscape(b,blocks),true);b.removed=true;}
});
test('different random seeds produce different accepted layouts',()=>{
 const a=makeHardLevel(5,{random:rng(1)}),b=makeHardLevel(5,{random:rng(2)});
 const orientations=r=>[...r.blocks].sort((a,b)=>a.id-b.id).map(b=>b.dir);
 assert.notDeepEqual(orientations(a),orientations(b));
});
test('cycle and easy pattern candidates are rejected',()=>{
 const cycle=[{pos:[0,0,0],dir:[1,0,0]},{pos:[1,0,0],dir:[-1,0,0]}];
 assert.equal(analyzeDifficulty(cycle).solvable,false);assert.equal(solveByBFS(cycle).solved,false);
 const easy=[0,1,2].map(y=>({pos:[0,y,0],dir:[1,0,0]}));
 assert.equal(solveByBFS(easy).minMoves,3);assert.equal(validatePatterns(easy,5).accepted,false);
 assert.throws(()=>makeHardLevel(5,{attempts:0}),/No layout/);
});
test('reduced BFS agrees with exhaustive state BFS on small arbitrary puzzles',()=>{
 const random=rng(2026);
 for(let sample=0;sample<40;sample++){
  const blocks=[];for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)blocks.push({pos:[x,y,z],dir:DIRECTIONS[Math.floor(random()*6)]});
  const states=[0],seen=new Set(states);let solved=false;
  for(let head=0;head<states.length;head++){
   const mask=states[head];if(mask===255){solved=true;break;}
   const state=blocks.map((b,i)=>({...b,removed:Boolean(mask&(1<<i))}));
   state.forEach((b,i)=>{if(!b.removed&&canEscape(b,state)){const next=mask|(1<<i);if(!seen.has(next)){seen.add(next);states.push(next);}}});
  }
  assert.equal(solveByBFS(blocks).solved,solved);
 }
});
