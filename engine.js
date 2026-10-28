export const DIRECTIONS = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
// Empty cells before the nearest obstacle; Infinity means the block can exit.
export function moveDistance(block,blocks){
 const axis=block.dir.findIndex(v=>v!==0);
 let nearest=Infinity;
 for(const other of blocks){
  if(other===block||other.removed||!block.pos.every((v,i)=>i===axis||v===other.pos[i]))continue;
  const distance=(other.pos[axis]-block.pos[axis])*block.dir[axis];
  if(distance>0)nearest=Math.min(nearest,distance);
 }
 return nearest===Infinity?Infinity:nearest-1;
}
export function canEscape(block,blocks){return moveDistance(block,blocks)===Infinity;}
export function makeLevel(size, random=Math.random, chained=false) {
 const blocks=[],occupied=new Map(),choices=[],known=new Set();
 const key=p=>p.join(',');
 for(let x=0;x<size;x++)for(let y=0;y<size;y++)for(let z=0;z<size;z++){
  const b={id:blocks.length,pos:[x,y,z],dir:null,removed:false};blocks.push(b);occupied.set(key(b.pos),b);
 }
 function addIfFree(b,dir,index){
  const id=b.id*6+index;if(known.has(id))return;
  const p=[...b.pos];
  for(let step=1;step<size;step++){
   for(let i=0;i<3;i++)p[i]+=dir[i];
   if(p.some(v=>v<0||v>=size))break;
   if(occupied.has(key(p)))return;
  }
  known.add(id);choices.push({b,dir});
 }
 for(const b of blocks)DIRECTIONS.forEach((dir,i)=>addIfFree(b,dir,i));
 let remaining=blocks.length;
 while(remaining){
  const index=chained&&random()<.92?choices.length-1:Math.floor(random()*choices.length),{b,dir}=choices[index];
  choices[index]=choices[choices.length-1];choices.pop();
  if(!occupied.has(key(b.pos)))continue;
  b.dir=[...dir];occupied.delete(key(b.pos));remaining--;
  // Only the nearest surviving neighbor on each ray can become unblocked.
  DIRECTIONS.forEach((ray,i)=>{
   const p=[...b.pos];
   for(let step=1;step<size;step++){
    for(let j=0;j<3;j++)p[j]+=ray[j];
    if(p.some(v=>v<0||v>=size))break;
    const neighbor=occupied.get(key(p));
    if(neighbor){addIfFree(neighbor,DIRECTIONS[i^1],i^1);break;}
   }
  });
 }
 return blocks;
}
