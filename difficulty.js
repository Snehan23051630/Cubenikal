import {DIRECTIONS} from './engine.js';
import {planAssembly} from './generation.js';
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
export const minimumDepth=size=>Math.max(30,size*4);
const key=p=>p.join(',');
function graph(blocks){
 const lookup=new Map(blocks.map((b,i)=>[key(b.pos),i])),pending=blocks.map(()=>0),followers=blocks.map(()=>[]);
 const size=1+Math.max(...blocks.flatMap(b=>b.pos));let crossAxisEdges=0;const dependencyAxes=new Set();
 blocks.forEach((b,i)=>{
  for(let step=1;step<size;step++){
   const p=b.pos.map((v,j)=>v+b.dir[j]*step);if(p.some(v=>v<0||v>=size))break;
   const j=lookup.get(key(p));if(j===undefined)continue;
   pending[i]++;followers[j].push(i);
   if(b.dir.findIndex(v=>v)!==blocks[j].dir.findIndex(v=>v)){crossAxisEdges++;dependencyAxes.add(b.dir.findIndex(v=>v));dependencyAxes.add(blocks[j].dir.findIndex(v=>v));}
  }
 });return {pending,followers,crossAxisEdges,dependencyAxes:[...dependencyAxes]};
}
// Partial-order-reduced BFS: legal removals commute and cannot disable each
// other. Explore one canonical ordering instead of all equivalent subsets.
// This is exact for removal-only rules and must not be used for sliding blocks.
export function solveByBFS(blocks){
 const {pending,followers,crossAxisEdges,dependencyAxes}=graph(blocks);
 const queue=pending.flatMap((n,i)=>n===0?[i]:[]),initialOpenings=queue.length;
 for(let head=0;head<queue.length;head++)for(const j of followers[queue[head]])if(--pending[j]===0)queue.push(j);
 return {solved:queue.length===blocks.length,minMoves:queue.length===blocks.length?blocks.length:null,initialOpenings,crossAxisEdges,dependencyAxes,order:queue};
}
export function validatePatterns(blocks,size){
 const lookup=new Map(blocks.map(b=>[key(b.pos),b]));let adjacentMatches=0;
 for(const b of blocks)for(const d of DIRECTIONS){const other=lookup.get(key(b.pos.map((v,i)=>v+d[i])));if(other&&other.dir.every((v,i)=>v===b.dir[i]))adjacentMatches++;}
 const analysis=analyzeDifficulty(blocks),solution=solveByBFS(blocks);
 const accepted=solution.solved&&adjacentMatches===0&&analysis.initialOpenings<=blocks.length*.15&&analysis.maxDepth>=minimumDepth(size)&&solution.crossAxisEdges>=blocks.length/2&&solution.dependencyAxes.length===3;
 return {...analysis,accepted,adjacentMatches:adjacentMatches/2,minMoves:solution.minMoves,crossAxisEdges:solution.crossAxisEdges,requiredDepth:minimumDepth(size)};
}
export function makeHardLevel(size,{random=Math.random,attempts=8,iterations=24000}={}){
 if(![5,7,9,11,13,15].includes(size))throw Error('Unsupported cube size');
 const mid=(size-1)/2;
 for(let attempt=0;attempt<attempts;attempt++){
  const blocks=planAssembly(size,random);if(!blocks)continue;
  const lookup=new Map(blocks.map(b=>[key(b.pos),b]));
  let analysis=analyzeDifficulty(blocks);
  const cost=a=>a.initialOpenings*10-Math.min(a.maxDepth,minimumDepth(size))*2-a.meanDepth*.1;
  let current=cost(analysis);
  for(let iteration=0;iteration<iterations;iteration++){
   if(analysis.initialOpenings<=blocks.length*.15&&analysis.maxDepth>=minimumDepth(size)){
    const validated=validatePatterns(blocks,size);
    if(validated.accepted){
     // Rebuild from an empty grid in reverse solution order, explicitly core
     // first. Shell preservation prevents outer blocks from depending on cores.
     const {followers}=graph(blocks),outgoing=followers.map(list=>list.length),parents=blocks.map(()=>[]);
     followers.forEach((list,i)=>list.forEach(j=>parents[j].push(i)));
     const ready=outgoing.flatMap((n,i)=>n===0?[i]:[]),assembled=[],occupied=new Set();
     while(ready.length){
      ready.sort((a,b)=>radius(blocks[b])-radius(blocks[a]));
      const i=ready.pop(),b=blocks[i];
      for(let step=1;step<size;step++){
       const p=b.pos.map((v,j)=>v+b.dir[j]*step);if(p.some(v=>v<0||v>=size))break;
       if(occupied.has(key(p)))throw Error('Blocked reverse-assembly insertion');
      }
      occupied.add(key(b.pos));assembled.push(b);
      for(const j of parents[i])if(--outgoing[j]===0)ready.push(j);
     }
     if(assembled.length!==blocks.length)throw Error('Invalid assembly DAG');
     return {blocks:assembled,analysis:validated};
    }
   }
   const b=blocks[Math.floor(random()*blocks.length)];if(radius(b)===0)continue;
   const dir=DIRECTIONS[Math.floor(random()*6)],axis=dir.findIndex(v=>v);
   if(b.dir.every((v,i)=>v===dir[i]))continue;
   if(DIRECTIONS.some(d=>lookup.get(key(b.pos.map((v,i)=>v+d[i])))?.dir.every((v,i)=>v===dir[i])))continue;
   // An outward or tangential ray cannot make an outer shell depend on an inner one.
   if(Math.max(...b.pos.filter((_,i)=>i!==axis).map(v=>Math.abs(v-mid)))<radius(b)&&(mid-b.pos[axis])*dir[axis]>0)continue;
   const old=b.dir;b.dir=[...dir];const next=analyzeDifficulty(blocks),score=cost(next),temperature=2*(1-(iteration%6000)/6000);
   if(next.solvable&&(score<=current||random()<Math.exp((current-score)/temperature))){analysis=next;current=score;}else b.dir=old;
  }
 }
 throw Error('No layout met all pattern and depth requirements. Reset to generate another.');
 function radius(b){return Math.max(...b.pos.map(v=>Math.abs(v-mid)));}
}
