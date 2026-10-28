import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeLevel,canEscape,DIRECTIONS} from '../engine.js';
test('only blocks ahead on the same line obstruct each of six directions',()=>{
 for(const dir of DIRECTIONS){const b={pos:[0,0,0],dir};const other={pos:dir.map(v=>v*3)};assert.equal(canEscape(b,[b,other]),false);other.removed=true;assert.equal(canEscape(b,[b,other]),true);assert.equal(canEscape(b,[b,{pos:dir.map(v=>-v)}]),true);}
});
test('parallel neighboring lines do not obstruct',()=>{const b={pos:[0,0,0],dir:[1,0,0]};assert.equal(canEscape(b,[b,{pos:[1,1,0]}]),true);});
test('every generated difficulty can be completely dismantled',()=>{for(const size of [2,3,4])for(let run=0;run<30;run++){const blocks=makeLevel(size);assert.equal(blocks.length,size**3);while(blocks.some(b=>!b.removed)){const free=blocks.find(b=>!b.removed&&canEscape(b,blocks));assert.ok(free,'puzzle must not deadlock');free.removed=true;}}});
test('a 10 by 10 by 10 puzzle has 1000 distinct cubes and a complete solution',()=>{
 const blocks=makeLevel(10);assert.equal(blocks.length,1000);assert.equal(new Set(blocks.map(b=>b.pos.join(','))).size,1000);
 let remaining=1000;while(remaining){const free=blocks.filter(b=>!b.removed&&canEscape(b,blocks));assert.ok(free.length,'large puzzle must not deadlock');for(const b of free){b.removed=true;remaining--;}}
});
test('an empty neighboring cell does not permit passage through a more distant blocker',()=>{
 const b={pos:[0,3,0],dir:[0,-1,0]},distant={pos:[0,0,0]};
 assert.equal(canEscape(b,[b,distant]),false);
 distant.removed=true;assert.equal(canEscape(b,[b,distant]),true);
});
