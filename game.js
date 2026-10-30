// Cubenikal is intentionally self-contained: no framework, build step, or imports.
const DIRECTIONS=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const positionKey=point=>point.join(',');
const canvas=document.getElementById('puzzle'),ctx=canvas.getContext('2d');
const dimensionInputs=['width','height','depth'].map(id=>document.getElementById(id)),unevenInput=document.getElementById('uneven'),status=document.getElementById('status');
let loading=false,session=null;
const moveCount=document.getElementById('moves'),undoButton=document.getElementById('undo');
let dimensions=[5,5,5],size=5,advanceTimer=null,generation=0;
let blocks=[],yaw=-.65,pitch=.48,zoom=1,faces=[],width=0,height=0,finished=false,flash=null,flashUntil=0,revision=0,lastFrame='';
function steelFace(face){
 const n=rotate(face.def.n);
 // Camera-space key light, broad silver reflection, and dark machined edges.
 const diffuse=Math.max(0,n[0]*-.48+n[1]*.78+n[2]*.4);
 const base=135+diffuse*88;
 const points=face.pts,xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
 const gradient=ctx.createLinearGradient(Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys));
 const shade=offset=>{const v=Math.round(Math.max(0,Math.min(255,base+offset)));return `rgb(${v-3},${v},${Math.min(255,v+4)})`;};
 gradient.addColorStop(0,shade(15));gradient.addColorStop(.38,shade(3));gradient.addColorStop(.55,shade(22));gradient.addColorStop(1,shade(-13));
 return gradient;
}
const faceDefs=[{n:[1,0,0],v:[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]},{n:[-1,0,0],v:[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]},{n:[0,1,0],v:[[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]},{n:[0,-1,0],v:[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]},{n:[0,0,1],v:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]},{n:[0,0,-1],v:[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]}];
function camera(){return {yaw,pitch,size,dimensions,width,height,zoom};}
function rotate(point){return rotatePoint(point,yaw,pitch);}
function project(point){return projectPoint(point,camera());}
function newGame(){
 clearTimeout(advanceTimer);advanceTimer=null;
 dimensions=dimensionInputs.map(input=>{const value=Math.max(5,Math.min(15,Math.round(Number(input.value)||5)));input.value=value;return value;});
 size=Math.max(...dimensions);const request=++generation,shape=unevenInput.checked;
 loading=true;session=null;moveCount.textContent='';undoButton.disabled=true;blocks=[];faces=[];finished=false;flash=null;revision++;
 status.textContent='Building a tougher puzzle…';canvas.setAttribute('aria-busy','true');
 // Yield once so the loading message paints before the deliberate, local search.
 setTimeout(()=>{
  if(request!==generation)return;
  try{receivePuzzle(makeHardLevel(dimensions,{uneven:shape}));}
  catch(error){generationError(error);}
 },20);
}
function receivePuzzle({blocks:generatedBlocks,analysis}){
 blocks=generatedBlocks;session=createSession(blocks);loading=false;yaw=-.65;pitch=.48;zoom=1;revision++;
 status.textContent='Tap to slide into a gap, or escape along a clear path.';updateControls();canvas.setAttribute('aria-busy','false');
 document.title=`Cubenikal · ${dimensions.join(" × ")}`;
 canvas.setAttribute('aria-label',`${dimensions.join(" by ")} steel block puzzle. Drag to rotate, tap to slide or release, scroll or pinch to zoom. Press R for a new puzzle.`);
};
function generationError(){loading=false;status.textContent='Could not generate a puzzle. Choose New puzzle to retry.';canvas.setAttribute('aria-busy','false');};
const SLIDE_MS=260;
function sliding(block,now=performance.now()){return block.slide&&now-block.slide.started<SLIDE_MS;}
function updateControls(){
 if(!session)return;
 const remaining=blocks.filter(b=>!b.removed).length;
 moveCount.textContent=`${remaining} blocks left`;
 undoButton.textContent='Undo';
 undoButton.disabled=!session.history.length;
}
function attempt(b){
 if(loading||!session||blocks.some(block=>sliding(block)))return;
 const from=[...b.pos],result=playMove(session,b);
 if(result==='ignored')return;
 revision++;
 if(result==='removed'){b.exit=performance.now();status.textContent='';}
 else if(result==='slid'){b.slide={from,started:performance.now()};status.textContent='Slid into the gap.';}
 else{flash=b;flashUntil=performance.now()+450;status.textContent='Another block is directly in the way.';}
 finished=session.complete;updateControls();
 if(finished){status.textContent='Cleared. Loading the next puzzle…';advanceTimer=setTimeout(()=>{dimensionInputs.forEach(input=>{input.value=Math.min(15,Number(input.value)+2);});newGame();},900);}
}
undoButton.onclick=()=>{
 if(session&&undoMove(session)){
  clearTimeout(advanceTimer);advanceTimer=null;finished=session.complete;flash=null;
  revision++;status.textContent='Last move undone.';updateControls();
 }
};
document.getElementById('reset').onclick=newGame;
function polygon(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();}
function arrow(face,center){
 const d=face.b.dir,n=face.def.n;
 // Only draw on faces parallel to the escape direction: every visible arrow
 // represents the actual movement, with no alternate ring or dot notation.
 if(d.some((v,i)=>v*n[i]!==0))return;
 const side=[n[1]*d[2]-n[2]*d[1],n[2]*d[0]-n[0]*d[2],n[0]*d[1]-n[1]*d[0]];
 const point=(along,across=0)=>project(center.map((v,i)=>v+(d[i]*along+side[i]*across)*face.shrink));
 const tail=point(-.24),tip=point(.24),left=point(.045,.16),right=point(.045,-.16);
 if(!tail||!tip||!left||!right)return;
 ctx.strokeStyle='#303a43';
 ctx.lineWidth=Math.max(.85,Math.min(width*.37,height*.37)/size*zoom*.025);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
 ctx.moveTo(tail[0],tail[1]);ctx.lineTo(tip[0],tip[1]);
 ctx.moveTo(left[0],left[1]);ctx.lineTo(tip[0],tip[1]);ctx.lineTo(right[0],right[1]);ctx.stroke();
}
function draw(now){
 requestAnimationFrame(draw);
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
 const active=blocks.some(b=>(b.removed&&now-b.exit<650)||sliding(b,now))||(flash&&now<flashUntil);
 const frame=[rect.width,rect.height,dpr,yaw,pitch,zoom,revision,Boolean(flash&&now<flashUntil)].join(':');
 if(!active&&frame===lastFrame)return;
 lastFrame=active?'':frame;
 if(width!==rect.width||height!==rect.height||canvas.width!==Math.round(rect.width*dpr)){
 width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 ctx.clearRect(0,0,width,height);faces=[];
 const occupied=new Set(blocks.filter(b=>!b.removed&&!sliding(b,now)).map(b=>b.pos.join(',')));
 for(const b of blocks){let travel=0,alpha=1,shrink=1;if(b.removed){const elapsed=(now-b.exit)/650;if(!b.exit||elapsed>=1)continue;travel=elapsed*elapsed*size*5;alpha=1-elapsed;shrink=1-.25*Math.min(1,elapsed/.4);}
 const progress=b.slide?Math.min(1,(now-b.slide.started)/SLIDE_MS):1,eased=1-(1-progress)**3;
 const position=sliding(b,now)?b.slide.from.map((v,i)=>v+(b.pos[i]-v)*eased):b.pos;
 const center=position.map((v,i)=>v-(dimensions[i]-1)/2+b.dir[i]*travel);if(b===flash&&now<flashUntil)center[0]+=Math.sin(now*.06)*.04;
 // Stop the entire departing cube before it crosses the near plane.
 if(rotate(center)[2]+Math.sqrt(3)*.5*shrink>=size*3.5-.1)continue;
 for(const def of faceDefs){
  if(!b.removed&&!sliding(b,now)&&occupied.has(b.pos.map((v,i)=>v+def.n[i]).join(',')))continue;
  const fc=center.map((v,i)=>v+def.n[i]*.5*shrink),viewCenter=rotate(fc),normal=rotate(def.n);
  if(normal[0]*-viewCenter[0]+normal[1]*-viewCenter[1]+normal[2]*(size*3.5-viewCenter[2])<=.001)continue;
  const projected=project(fc),pts=def.v.map(v=>project(center.map((n,i)=>n+v[i]*.5*shrink)));
  if(!projected||pts.some(p=>!p))continue;
  faces.push({b,def,center:fc,pts,z:projected[2],alpha,shrink});
 }}
 faces.sort((a,b)=>a.z-b.z);
 for(const f of faces){ctx.globalAlpha=f.alpha;polygon(f.pts);ctx.fillStyle=steelFace(f);ctx.fill();ctx.strokeStyle=f.b===flash&&now<flashUntil?'#e4ad83':'#4b565f';ctx.lineWidth=f.b===flash&&now<flashUntil?1.7:.85;ctx.stroke();
 // Inset highlight gives each block a shallow, solid steel bevel.
 const mid=project(f.center),inset=f.pts.map(p=>[p[0]+(mid[0]-p[0])*.045,p[1]+(mid[1]-p[1])*.045]);
 polygon(inset);ctx.strokeStyle='rgba(255,255,255,.42)';ctx.lineWidth=.65;ctx.stroke();
 arrow(f,f.center,now);}ctx.globalAlpha=1;}
function hit(x,y){return pickBlock(x,y,blocks,camera());}
let pointers=new Map(),drag=null,pinchDistance=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};if(pointers.size===2){const p=[...pointers.values()];pinchDistance=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);drag.moved=true;}});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!drag)return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(pinchDistance)zoom=Math.max(.55,Math.min(1.65,zoom*d/pinchDistance));pinchDistance=d;drag.moved=true;return;}if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;if(drag.moved){yaw+=(e.clientX-drag.lastX)*.008;pitch+=(e.clientY-drag.lastY)*.008;}drag.lastX=e.clientX;drag.lastY=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&pointers.size===1){const r=canvas.getBoundingClientRect(),b=hit(e.clientX-r.left,e.clientY-r.top);if(b)attempt(b);}pointers.delete(e.pointerId);if(!pointers.size)drag=null;else if(drag){drag.moved=true;const p=[...pointers.values()][0];drag.lastX=p[0];drag.lastY=p[1];}});
canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);drag=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(1.65,zoom*Math.exp(-e.deltaY*.001)));},{passive:false});
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r')newGame();});
newGame();requestAnimationFrame(draw);

function rotatePoint([x,y,z],yaw,pitch){
 const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw);
 return [a,y*Math.cos(pitch)-b*Math.sin(pitch),y*Math.sin(pitch)+b*Math.cos(pitch)];
}
function inverseRotatePoint([x,y,z],yaw,pitch){
 const a=y*Math.cos(pitch)+z*Math.sin(pitch),b=-y*Math.sin(pitch)+z*Math.cos(pitch);
 return [x*Math.cos(yaw)-b*Math.sin(yaw),a,x*Math.sin(yaw)+b*Math.cos(yaw)];
}
function projectPoint(point,camera){
 const {yaw,pitch,size,width,height,zoom}=camera,[x,y,z]=rotatePoint(point,yaw,pitch),distance=size*3.5;
 if(distance-z<=.1)return null;
 const scale=Math.min(width*.37,height*.37)/size*zoom,perspective=distance/(distance-z);
 return [width/2+x*scale*perspective,height/2-y*scale*perspective,z];
}
function pickBlock(x,y,allBlocks,camera){
 const {yaw,pitch,size,dimensions,width,height,zoom}=camera,distance=size*3.5,scale=Math.min(width*.37,height*.37)/size*zoom;
 if(!scale)return null;
 const origin=inverseRotatePoint([0,0,distance],yaw,pitch),ray=inverseRotatePoint([(x-width/2)/scale,(height/2-y)/scale,-distance],yaw,pitch);
 let selected=null,nearest=Infinity;
 for(const block of allBlocks){
  if(block.removed)continue;
  const center=block.pos.map((v,i)=>v-(dimensions[i]-1)/2);let enter=0,leave=Infinity;
  for(let axis=0;axis<3;axis++){
   const low=center[axis]-.5,high=center[axis]+.5;
   if(Math.abs(ray[axis])<1e-10){if(origin[axis]<low||origin[axis]>high){leave=-1;break;}continue;}
   const a=(low-origin[axis])/ray[axis],b=(high-origin[axis])/ray[axis];enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
   if(enter>leave)break;
  }
  if(enter<=leave&&enter<nearest){nearest=enter;selected=block;}
 }
 return selected;
}
function moveDistance(block,allBlocks){
 const axis=block.dir.findIndex(v=>v!==0);let nearest=Infinity;
 for(const other of allBlocks){
  if(other===block||other.removed||!block.pos.every((v,i)=>i===axis||v===other.pos[i]))continue;
  const distance=(other.pos[axis]-block.pos[axis])*block.dir[axis];if(distance>0)nearest=Math.min(nearest,distance);
 }
 return nearest===Infinity?Infinity:nearest-1;
}
function canEscape(block,allBlocks){return moveDistance(block,allBlocks)===Infinity;}
function createSession(allBlocks){return {blocks:allBlocks,history:[],complete:allBlocks.every(b=>b.removed)};}
function playMove(currentSession,block){
 if(currentSession.complete||block.removed||!currentSession.blocks.includes(block))return 'ignored';
 const distance=moveDistance(block,currentSession.blocks);if(distance===0)return 'blocked';
 currentSession.history.push({block,pos:[...block.pos],removed:block.removed});delete block.slide;
 if(distance===Infinity){block.removed=true;currentSession.complete=currentSession.blocks.every(b=>b.removed);return 'removed';}
 block.pos=block.pos.map((v,i)=>v+block.dir[i]*distance);return 'slid';
}
function undoMove(currentSession){
 if(!currentSession.history.length)return false;
 const {block,pos,removed}=currentSession.history.pop();block.pos=pos;block.removed=removed;delete block.exit;delete block.slide;
 currentSession.complete=currentSession.blocks.every(b=>b.removed);return true;
}
function planAssembly(dimensions,random=Math.random,uneven=false){
 const allBlocks=[],lookup=new Map(),maxSize=Math.max(...dimensions);
 // Clip a few corners to create a stepped outline while keeping the interior connected.
 const corners=uneven?Array.from({length:3},()=>dimensions.map(()=>random()<.5?0:1)):[];
 for(let x=0;x<dimensions[0];x++)for(let y=0;y<dimensions[1];y++)for(let z=0;z<dimensions[2];z++){
  const pos=[x,y,z];
  if(corners.some(corner=>pos.reduce((sum,v,i)=>sum+(corner[i]?dimensions[i]-1-v:v),0)<=1))continue;
  const block={id:allBlocks.length,pos,dir:null,removed:false};allBlocks.push(block);lookup.set(positionKey(pos),block);
 }
 const layer=block=>Math.min(...block.pos.map((v,i)=>Math.min(v,dimensions[i]-1-v))),removal=[];
 const layers=Math.ceil(Math.min(...dimensions)/2);
 for(let r=0;r<layers;r++){
  const shell=allBlocks.filter(block=>layer(block)===r);let solved=false;
  for(let trial=0;trial<80&&!solved;trial++){
   for(const block of shell){block.removed=false;block.dir=null;}
   const choices=[],known=new Set(),sequence=[];
   function add(block,directionIndex){
    if(block.removed||layer(block)!==r)return;const token=block.id*6+directionIndex;if(known.has(token))return;
    const direction=DIRECTIONS[directionIndex];
    for(let step=1;step<maxSize;step++){const point=block.pos.map((v,i)=>v+direction[i]*step);if(point.some((v,i)=>v<0||v>=dimensions[i]))break;if(lookup.get(positionKey(point))?.removed===false)return;}
    known.add(token);choices.push({block,directionIndex});
   }
   for(const block of shell)for(let d=0;d<6;d++)add(block,d);
   while(choices.length){
    const index=Math.floor(random()*choices.length),{block,directionIndex}=choices[index];choices[index]=choices.at(-1);choices.pop();if(block.removed)continue;
    const direction=DIRECTIONS[directionIndex];
    if(DIRECTIONS.some(n=>lookup.get(positionKey(block.pos.map((v,i)=>v+n[i])))?.dir?.every((v,i)=>v===direction[i])))continue;
    block.dir=[...direction];block.removed=true;sequence.push(block);
    for(let ray=0;ray<6;ray++)for(let step=1;step<maxSize;step++){
     const point=block.pos.map((v,i)=>v+DIRECTIONS[ray][i]*step);if(point.some((v,i)=>v<0||v>=dimensions[i]))break;
     const other=lookup.get(positionKey(point));if(other&&!other.removed){add(other,ray^1);break;}
    }
   }
   if(sequence.length===shell.length){removal.push(...sequence);solved=true;}
  }
  if(!solved)return null;
 }
 return removal.reverse().map(block=>({...block,removed:false}));
}
function analyzeDifficulty(allBlocks){
 const lookup=new Map(allBlocks.map((block,i)=>[positionKey(block.pos),i])),waiting=allBlocks.map(()=>0),dependents=allBlocks.map(()=>[]),depth=allBlocks.map(()=>1),cubeSize=1+Math.max(...allBlocks.flatMap(block=>block.pos));
 allBlocks.forEach((block,i)=>{
  const point=[...block.pos];
  for(let step=1;step<cubeSize;step++){for(let axis=0;axis<3;axis++)point[axis]+=block.dir[axis];if(point.some(v=>v<0||v>=cubeSize))break;const blocker=lookup.get(positionKey(point));if(blocker!==undefined){waiting[i]++;dependents[blocker].push(i);}}
 });
 const queue=waiting.flatMap((n,i)=>n===0?[i]:[]),initialOpenings=queue.length;
 for(let head=0;head<queue.length;head++)for(const i of dependents[queue[head]]){depth[i]=Math.max(depth[i],depth[queue[head]]+1);if(--waiting[i]===0)queue.push(i);}
 const solvable=queue.length===allBlocks.length,maxDepth=Math.max(...depth),meanDepth=depth.reduce((a,b)=>a+b,0)/allBlocks.length;
 return {solvable,score:solvable?maxDepth+meanDepth*2-initialOpenings/allBlocks.length*100:-Infinity,maxDepth,meanDepth,initialOpenings};
}
function minimumDepth(cubeSize){return Math.max(30,cubeSize*4);}
function buildGraph(allBlocks){
 const lookup=new Map(allBlocks.map((block,i)=>[positionKey(block.pos),i])),pending=allBlocks.map(()=>0),followers=allBlocks.map(()=>[]),cubeSize=1+Math.max(...allBlocks.flatMap(block=>block.pos)),axes=new Set();let crossAxisEdges=0;
 allBlocks.forEach((block,i)=>{
  for(let step=1;step<cubeSize;step++){
   const point=block.pos.map((v,j)=>v+block.dir[j]*step);if(point.some(v=>v<0||v>=cubeSize))break;const j=lookup.get(positionKey(point));if(j===undefined)continue;
   pending[i]++;followers[j].push(i);if(block.dir.findIndex(v=>v)!==allBlocks[j].dir.findIndex(v=>v)){crossAxisEdges++;axes.add(block.dir.findIndex(v=>v));axes.add(allBlocks[j].dir.findIndex(v=>v));}
  }
 });
 return {pending,followers,crossAxisEdges,dependencyAxes:[...axes]};
}
function validatePatterns(allBlocks,cubeSize){
 const lookup=new Map(allBlocks.map(block=>[positionKey(block.pos),block]));let adjacentMatches=0;
 for(const block of allBlocks)for(const direction of DIRECTIONS){const other=lookup.get(positionKey(block.pos.map((v,i)=>v+direction[i])));if(other&&other.dir.every((v,i)=>v===block.dir[i]))adjacentMatches++;}
 const analysis=analyzeDifficulty(allBlocks),graph=buildGraph(allBlocks),queue=graph.pending.flatMap((n,i)=>n===0?[i]:[]);
 for(let head=0;head<queue.length;head++)for(const i of graph.followers[queue[head]])if(--graph.pending[i]===0)queue.push(i);
 const accepted=queue.length===allBlocks.length&&adjacentMatches===0&&analysis.initialOpenings<=allBlocks.length*.15&&analysis.maxDepth>=minimumDepth(cubeSize)&&graph.crossAxisEdges>=allBlocks.length/2&&graph.dependencyAxes.length===3;
 return {...analysis,accepted,adjacentMatches:adjacentMatches/2,minMoves:queue.length===allBlocks.length?allBlocks.length:null,crossAxisEdges:graph.crossAxisEdges,requiredDepth:minimumDepth(cubeSize)};
}
function makeHardLevel(dimensions,{random=Math.random,attempts=2,iterations,uneven=false}={}){
 const cubeSize=Math.max(...dimensions);let best=null;
 iterations??=Math.min(500,Math.max(30,Math.floor(40000/dimensions.reduce((a,b)=>a*b,1))));
 for(let attempt=0;attempt<attempts;attempt++){
  const allBlocks=planAssembly(dimensions,random,uneven);if(!allBlocks)continue;const lookup=new Map(allBlocks.map(block=>[positionKey(block.pos),block]));
  let analysis=analyzeDifficulty(allBlocks),cost=value=>value.initialOpenings*10-Math.min(value.maxDepth,minimumDepth(cubeSize))*2-value.meanDepth*.1,current=cost(analysis);
  for(let iteration=0;iteration<iterations;iteration++){
   if(analysis.initialOpenings<=allBlocks.length*.15&&analysis.maxDepth>=minimumDepth(cubeSize)){
    const validated=validatePatterns(allBlocks,cubeSize);if(validated.accepted)return {blocks:allBlocks,analysis:validated};
   }
   const block=allBlocks[Math.floor(random()*allBlocks.length)];
   const direction=DIRECTIONS[Math.floor(random()*6)];if(block.dir.every((v,i)=>v===direction[i]))continue;
   if(DIRECTIONS.some(d=>lookup.get(positionKey(block.pos.map((v,i)=>v+d[i])))?.dir.every((v,i)=>v===direction[i])))continue;
   const old=block.dir;block.dir=[...direction];const next=analyzeDifficulty(allBlocks),score=cost(next),temperature=2*(1-(iteration%6000)/6000);
   if(next.solvable&&(score<=current||random()<Math.exp((current-score)/temperature))){analysis=next;current=score;}else block.dir=old;
  }
  if(!best||analysis.score>best.analysis.score)best={blocks:allBlocks.map(block=>({...block,pos:[...block.pos],dir:[...block.dir]})),analysis};
 }
 if(best)return best;
 throw Error('No solvable layout could be generated.');
}
