import {moveDistance} from './engine.js';
export function createSession(blocks){
 return {blocks,history:[],complete:blocks.every(b=>b.removed)};
}
export function playMove(session,block){
 if(session.complete||block.removed||!session.blocks.includes(block))return 'ignored';
 const distance=moveDistance(block,session.blocks);
 if(distance===0)return 'blocked';
 session.history.push({block,pos:[...block.pos],removed:block.removed});
 delete block.slide;
 if(distance===Infinity){
  block.removed=true;session.complete=session.blocks.every(b=>b.removed);return 'removed';
 }
 block.pos=block.pos.map((v,i)=>v+block.dir[i]*distance);
 return 'slid';
}
export function undoMove(session){
 if(!session.history.length)return false;
 const {block,pos,removed}=session.history.pop();
 block.pos=pos;block.removed=removed;delete block.exit;delete block.slide;
 session.complete=session.blocks.every(b=>b.removed);
 return true;
}
