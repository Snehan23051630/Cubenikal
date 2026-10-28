import {DIRECTIONS} from './engine.js';
const key=p=>p.join(',');
export function planAssembly(size,random=Math.random){
 const mid=(size-1)/2,blocks=[],lookup=new Map();
 for(let x=0;x<size;x++)for(let y=0;y<size;y++)for(let z=0;z<size;z++){
  const b={id:blocks.length,pos:[x,y,z],dir:null,removed:false};blocks.push(b);lookup.set(key(b.pos),b);
 }
 const radius=b=>Math.max(...b.pos.map(v=>Math.abs(v-mid)));
 // Plan each shell's removal order. Reversing it gives a core-first assembly
 // certificate; the chosen cardinal directions are sampled, never coordinate-derived.
 const removal=[];
 for(let r=mid;r>=0;r--){
  const shell=blocks.filter(b=>radius(b)===r);let solved=false;
  for(let trial=0;trial<80&&!solved;trial++){
   for(const b of shell){b.removed=false;b.dir=null;}
   const choices=[],known=new Set(),sequence=[];
   function add(b,d){
    if(b.removed||radius(b)!==r)return;
    const token=b.id*6+d;if(known.has(token))return;
    const dir=DIRECTIONS[d];
    for(let step=1;step<size;step++){
     const p=b.pos.map((v,i)=>v+dir[i]*step);if(p.some(v=>v<0||v>=size))break;
     if(!lookup.get(key(p)).removed)return;
    }
    known.add(token);choices.push({b,d});
   }
   for(const b of shell)for(let d=0;d<6;d++)add(b,d);
   while(choices.length){
    const index=Math.floor(random()*choices.length),{b,d}=choices[index];choices[index]=choices.at(-1);choices.pop();
    if(b.removed)continue;
    const dir=DIRECTIONS[d];
    if(DIRECTIONS.some(n=>lookup.get(key(b.pos.map((v,i)=>v+n[i])))?.dir?.every((v,i)=>v===dir[i])))continue;
    b.dir=[...dir];b.removed=true;sequence.push(b);
    for(let ray=0;ray<6;ray++)for(let step=1;step<size;step++){
     const p=b.pos.map((v,i)=>v+DIRECTIONS[ray][i]*step);if(p.some(v=>v<0||v>=size))break;
     const other=lookup.get(key(p));if(!other.removed){add(other,ray^1);break;}
    }
   }
   if(sequence.length===shell.length){removal.push(...sequence);solved=true;}
  }
  if(!solved)return null;
 }
 return removal.reverse().map(b=>({...b,removed:false}));
}
