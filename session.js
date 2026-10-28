import {canEscape} from './engine.js';
export function createSession(blocks,minMoves=blocks.length){
 return {blocks,movesLeft:minMoves+2,undosLeft:2,history:[],failed:false,complete:false};
}
function update(session){
 const remaining=session.blocks.filter(b=>!b.removed).length;
 session.complete=remaining===0;
 session.failed=!session.complete&&session.movesLeft<remaining;
}
export function playMove(session,block){
 if(session.failed||session.complete||block.removed||!session.blocks.includes(block))return 'ignored';
 session.movesLeft--;
 const free=canEscape(block,session.blocks);
 if(free){block.removed=true;session.history.push(block);}
 update(session);return free?'removed':'blocked';
}
export function undoMove(session){
 if(session.failed||session.complete||!session.undosLeft||!session.history.length)return false;
 const block=session.history.pop();block.removed=false;delete block.exit;session.undosLeft--;
 // No refund: restoring a block means its next removal costs another move.
 update(session);return true;
}
