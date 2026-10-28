import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSession,playMove,undoMove} from '../session.js';
import {DIRECTIONS} from '../engine.js';
test('blocked taps never consume a budget or end play',()=>{
 const blocks=[0,1,2].map(x=>({pos:[x,0,0],dir:[-1,0,0],removed:false})),s=createSession(blocks);
 for(let i=0;i<100;i++)assert.equal(playMove(s,blocks[2]),'blocked');
 assert.equal(s.history.length,0);assert.equal(s.complete,false);assert.equal('movesLeft' in s,false);
 for(const b of blocks)assert.equal(playMove(s,b),'removed');assert.equal(s.complete,true);
});
test('one-cell gaps work in all six directions and never pass through a blocker',()=>{
 for(const dir of DIRECTIONS){
  const b={pos:[5,5,5],dir,removed:false},obstacle={pos:b.pos.map((v,i)=>v+dir[i]*2),dir:[1,0,0],removed:false};
  const s=createSession([b,obstacle]);assert.equal(playMove(s,b),'slid');
  assert.deepEqual(b.pos,[5,5,5].map((v,i)=>v+dir[i]));assert.equal(b.removed,false);
  assert.equal(playMove(s,b),'blocked');
 }
});
test('slides stop before the nearest blocker and ignore off-axis blocks',()=>{
 const b={pos:[0,0,0],dir:[1,0,0]},near={pos:[3,0,0]},far={pos:[5,0,0]},offAxis={pos:[1,1,0]};
 const s=createSession([b,far,offAxis,near]);assert.equal(playMove(s,b),'slid');assert.deepEqual(b.pos,[2,0,0]);
});
test('unlimited undo restores slides and removals in reverse order',()=>{
 const b={pos:[0,0,0],dir:[1,0,0],removed:false},other={pos:[3,0,0],dir:[0,1,0],removed:false},s=createSession([b,other]);
 assert.equal(playMove(s,b),'slid');assert.equal(playMove(s,other),'removed');assert.equal(playMove(s,b),'removed');assert.equal(s.complete,true);
 assert.equal(undoMove(s),true);assert.equal(b.removed,false);assert.deepEqual(b.pos,[2,0,0]);assert.equal(s.complete,false);
 assert.equal(undoMove(s),true);assert.equal(other.removed,false);
 assert.equal(undoMove(s),true);assert.deepEqual(b.pos,[0,0,0]);assert.equal(undoMove(s),false);
 for(let i=0;i<10;i++){assert.equal(playMove(s,b),'slid');assert.equal(undoMove(s),true);}
});
test('sliding changes obstruction on a crossing path; undo restores it',()=>{
 const slider={pos:[0,0,0],dir:[1,0,0]},stopper={pos:[3,0,0],dir:[0,1,0]},crossing={pos:[2,-1,0],dir:[0,1,0]};
 const s=createSession([slider,stopper,crossing]);playMove(s,slider);
 assert.equal(playMove(s,crossing),'blocked');undoMove(s);assert.equal(playMove(s,crossing),'removed');
});
