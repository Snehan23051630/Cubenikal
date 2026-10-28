import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSession,playMove,undoMove} from '../session.js';
const puzzle=()=>[0,1,2].map(x=>({pos:[x,0,0],dir:[-1,0,0],removed:false}));
test('two blocked penalties still allow completion with zero budget left',()=>{
 const s=createSession(puzzle());
 assert.equal(playMove(s,s.blocks[2]),'blocked');assert.equal(playMove(s,s.blocks[2]),'blocked');
 for(const b of s.blocks)assert.equal(playMove(s,b),'removed');
 assert.equal(s.movesLeft,0);assert.equal(s.complete,true);assert.equal(s.failed,false);
});
test('third blocked tap ends the run and further taps cost nothing',()=>{
 const s=createSession(puzzle());for(let i=0;i<3;i++)playMove(s,s.blocks[2]);
 assert.equal(s.failed,true);const left=s.movesLeft;assert.equal(playMove(s,s.blocks[0]),'ignored');assert.equal(s.movesLeft,left);
});
test('undo restores blocks without refund and is limited to two',()=>{
 const s=createSession(puzzle());playMove(s,s.blocks[0]);assert.equal(undoMove(s),true);assert.equal(s.movesLeft,4);
 playMove(s,s.blocks[0]);assert.equal(undoMove(s),true);assert.equal(s.undosLeft,0);assert.equal(s.movesLeft,3);
 playMove(s,s.blocks[0]);assert.equal(undoMove(s),false);playMove(s,s.blocks[1]);playMove(s,s.blocks[2]);assert.equal(s.complete,true);
});
