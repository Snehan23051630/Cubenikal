import {makeLevel} from './engine.js';
// Build the complete blocking DAG and solve it in simultaneous removal waves.
export function analyzeDifficulty(blocks) {
 const lookup=new Map(blocks.map((b,i)=>[b.pos.join(','),i]));
 const waiting=blocks.map(()=>0),dependents=blocks.map(()=>[]),depth=blocks.map(()=>1);
 const size=1+Math.max(...blocks.flatMap(b=>b.pos));
 blocks.forEach((b,i)=>{
  const p=[...b.pos];
  for(let step=1;step<size;step++){
   for(let axis=0;axis<3;axis++)p[axis]+=b.dir[axis];
   if(p.some(v=>v<0||v>=size))break;
   const blocker=lookup.get(p.join(','));
   if(blocker!==undefined){waiting[i]++;dependents[blocker].push(i);}
  }
 });
 const queue=waiting.flatMap((n,i)=>n===0?[i]:[]),initialOpenings=queue.length;
 for(let head=0;head<queue.length;head++){
  const i=queue[head];
  for(const j of dependents[i]){depth[j]=Math.max(depth[j],depth[i]+1);if(--waiting[j]===0)queue.push(j);}
 }
 const solvable=queue.length===blocks.length;
 const maxDepth=Math.max(...depth),meanDepth=depth.reduce((a,b)=>a+b,0)/blocks.length;
 // Favor sustained dependencies and penalize broad opening sets.
 const score=solvable?maxDepth+meanDepth*2-initialOpenings/blocks.length*100:-Infinity;
 return {solvable,score,maxDepth,meanDepth,initialOpenings};
}
export function makeHardLevel(size,{candidates=24,random=Math.random}={}){
 let best=null;
 for(let i=0;i<candidates;i++){
  const blocks=makeLevel(size,random,i>0),analysis=analyzeDifficulty(blocks);
  if(!best||analysis.score>best.analysis.score)best={blocks,analysis};
 }
 if(!best?.analysis.solvable)throw Error('No solvable puzzle generated');
 return best;
}
