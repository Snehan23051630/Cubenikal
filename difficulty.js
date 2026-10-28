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
// Construct a continuous lattice path, then insert its blocks in reverse order.
// Arrows are derived from geometry, never sampled independently.
export function makeHardLevel(size,{random=Math.random}={}){
 const axes=[0,1,2];
 for(let i=2;i>0;i--){const j=Math.floor(random()*(i+1));[axes[i],axes[j]]=[axes[j],axes[i]];}
 const flip=[0,1,2].map(()=>random()<.5);
 const path=[];
 for(let z=0;z<size;z++){
  const swap=random()<.5,start=z%2===0?0:size-1,sign=z%2===0?1:-1;
  for(let row=0;row<size;row++)for(let col=0;col<size;col++){
   const a=start+sign*(row%2===0?col:size-1-col),b=start+sign*row;
   const local=swap?[b,a,z]:[a,b,z],pos=[0,0,0];
   local.forEach((v,i)=>pos[axes[i]]=flip[i]?size-1-v:v);path.push(pos);
  }
 }
 const blocks=[];
 for(let i=path.length-1;i>=0;i--){
  const pos=path[i],dir=i?pos.map((v,j)=>path[i-1][j]-v):pos.map((v,j)=>j===axes[2]?(v===0?-1:1):0);
  blocks.push({id:i,pos,dir,removed:false});
 }
 const analysis=analyzeDifficulty(blocks),solution=solveByBFS(blocks);
 if(!analysis.solvable||analysis.maxDepth<30||!solution.solved||solution.maxBranching>2)throw Error('Puzzle failed strict validation');
 return {blocks,analysis:{...analysis,minMoves:solution.minMoves,maxBranching:solution.maxBranching}};
}

// BFS over legal removal states. For the constructed chain its frontier is one
// state wide, so proving the exact solution is linear in the dependency edges.
export function solveByBFS(blocks,{maxStates=10000}={}){
 const lookup=new Map(blocks.map((b,i)=>[b.pos.join(','),i]));
 const size=1+Math.max(...blocks.flatMap(b=>b.pos));
 const pending=blocks.map(()=>0),followers=blocks.map(()=>[]);
 blocks.forEach((b,i)=>{
  const p=[...b.pos];
  for(let step=1;step<size;step++){
   for(let j=0;j<3;j++)p[j]+=b.dir[j];
   if(p.some(v=>v<0||v>=size))break;
   const other=lookup.get(p.join(','));
   if(other!==undefined){pending[i]++;followers[other].push(i);}
  }
 });
 const queue=[{pending,ready:pending.flatMap((n,i)=>n===0?[i]:[]),moves:0}],seen=new Set();
 let maxBranching=0;
 for(let head=0;head<queue.length;head++){
  if(head>=maxStates)return {solved:false,reason:'search limit'};
  const state=queue[head];maxBranching=Math.max(maxBranching,state.ready.length);
  if(maxBranching>2)return {solved:false,reason:'too many legal moves',maxBranching};
  if(state.moves===blocks.length)return {solved:true,minMoves:state.moves,maxBranching};
  for(const i of state.ready){
   const next=state.pending.slice(),ready=state.ready.filter(j=>j!==i);next[i]=-1;
   for(const j of followers[i])if(--next[j]===0)ready.push(j);
   const key=next.map(n=>n===-1?'1':'0').join('');
   if(seen.has(key))continue;seen.add(key);
   queue.push({pending:next,ready,moves:state.moves+1});
  }
 }
 return {solved:false,reason:'deadlock',maxBranching};
}
