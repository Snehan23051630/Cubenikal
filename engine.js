export const DIRECTIONS = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
export function canEscape(block, blocks) {
 const axis=block.dir.findIndex(v=>v!==0);
 return !blocks.some(o=>o!==block&&!o.removed&&[0,1,2].every(i=>i===axis||o.pos[i]===block.pos[i])&&(o.pos[axis]-block.pos[axis])*block.dir[axis]>0);
}
export function makeLevel(size, random=Math.random) {
 const blocks=[];
 for(let x=0;x<size;x++)for(let y=0;y<size;y++)for(let z=0;z<size;z++)blocks.push({id:blocks.length,pos:[x,y,z],dir:null,removed:false});
 const pending=[...blocks];
 while(pending.length){
  const choices=pending.flatMap(b=>DIRECTIONS.filter(dir=>canEscape({...b,dir},pending)).map(dir=>({b,dir})));
  const {b,dir}=choices[Math.floor(random()*choices.length)];b.dir=[...dir];pending.splice(pending.indexOf(b),1);
 }
 return blocks;
}
