import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LEVEL_SIZES,nextLevel} from '../levels.js';
import {makeLevel,canEscape} from '../engine.js';
test('progression starts at five, increases by two, and caps at fifteen',()=>{
 assert.deepEqual(LEVEL_SIZES,[5,7,9,11,13,15]);
 for(let i=0;i<5;i++)assert.equal(LEVEL_SIZES[nextLevel(i)],LEVEL_SIZES[i]+2);
 assert.equal(nextLevel(5),5);
});
test('every supported level has a complete solution',()=>{
 for(const size of LEVEL_SIZES){
 const blocks=makeLevel(size);assert.equal(blocks.length,size**3);
 let remaining=blocks.length;
 while(remaining){const free=blocks.filter(b=>!b.removed&&canEscape(b,blocks));assert.ok(free.length,`size ${size} must not deadlock`);for(const b of free){b.removed=true;remaining--;}}
 }
});
