import {makeLevel,canEscape} from './engine.js';
import {LEVEL_SIZES,nextLevel} from './levels.js';
const canvas=document.getElementById('puzzle'),ctx=canvas.getContext('2d');
let levelIndex=0,size=LEVEL_SIZES[0],advanceTimer=null;
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
function rotate([x,y,z]){const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw);return[a,y*Math.cos(pitch)-b*Math.sin(pitch),y*Math.sin(pitch)+b*Math.cos(pitch)];}
function project(p){const [x,y,z]=rotate(p),scale=Math.min(width*.37,height*.37)/size*zoom;const perspective=1/(1-z/(size*3.5));return[width/2+x*scale*perspective,height*.5-y*scale*perspective,z];}
function newGame(){
 clearTimeout(advanceTimer);advanceTimer=null;
 size=LEVEL_SIZES[levelIndex];blocks=makeLevel(size);finished=false;flash=null;
 yaw=-.65;pitch=.48;zoom=1;revision++;
 document.title=`Cubenikal · ${size} × ${size} × ${size}`;
 canvas.setAttribute('aria-label',`${size} by ${size} by ${size} steel cube puzzle. Drag to rotate, tap to release, scroll or pinch to zoom. Press R to restart this level.`);
}
function attempt(b){
 if(b.removed||finished)return;
 if(canEscape(b,blocks)){b.removed=true;b.exit=performance.now();revision++;finished=blocks.every(b=>b.removed);
 if(finished)advanceTimer=setTimeout(()=>{levelIndex=nextLevel(levelIndex);newGame();},900);}
 else{flash=b;flashUntil=performance.now()+450;revision++;}
}
function polygon(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();}
function arrow(face,center){
 const d=face.b.dir,n=face.def.n;
 // Only draw on faces parallel to the escape direction: every visible arrow
 // represents the actual movement, with no alternate ring or dot notation.
 if(d.some((v,i)=>v*n[i]!==0))return;
 const side=[n[1]*d[2]-n[2]*d[1],n[2]*d[0]-n[0]*d[2],n[0]*d[1]-n[1]*d[0]];
 const point=(along,across=0)=>project(center.map((v,i)=>v+d[i]*along+side[i]*across));
 const tail=point(-.24),tip=point(.24),left=point(.045,.16),right=point(.045,-.16);
 ctx.strokeStyle='#303a43';
 ctx.lineWidth=Math.max(.85,Math.min(width*.37,height*.37)/size*zoom*.025);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
 ctx.moveTo(tail[0],tail[1]);ctx.lineTo(tip[0],tip[1]);
 ctx.moveTo(left[0],left[1]);ctx.lineTo(tip[0],tip[1]);ctx.lineTo(right[0],right[1]);ctx.stroke();
}
function draw(now){
 requestAnimationFrame(draw);
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
 const active=blocks.some(b=>b.removed&&now-b.exit<650)||(flash&&now<flashUntil);
 const frame=[rect.width,rect.height,dpr,yaw,pitch,zoom,revision,Boolean(flash&&now<flashUntil)].join(':');
 if(!active&&frame===lastFrame)return;
 lastFrame=active?'':frame;
 if(width!==rect.width||height!==rect.height||canvas.width!==Math.round(rect.width*dpr)){
 width=rect.width;height=rect.height;canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
 }
 ctx.clearRect(0,0,width,height);faces=[];
 const occupied=new Set(blocks.filter(b=>!b.removed).map(b=>b.pos.join(',')));
 for(const b of blocks){let travel=0,alpha=1;if(b.removed){const elapsed=(now-b.exit)/650;if(!b.exit||elapsed>=1)continue;travel=elapsed*elapsed*size*5;alpha=1-elapsed;}
 const center=b.pos.map((v,i)=>v-(size-1)/2+b.dir[i]*travel);if(b===flash&&now<flashUntil)center[0]+=Math.sin(now*.06)*.04;
 for(const def of faceDefs){if(rotate(def.n)[2]<=.01)continue;if(!b.removed&&occupied.has(b.pos.map((v,i)=>v+def.n[i]).join(',')))continue;const fc=center.map((v,i)=>v+def.n[i]*.5);const pts=def.v.map(v=>project(center.map((n,i)=>n+v[i]*.5)));faces.push({b,def,center:fc,pts,z:project(fc)[2],alpha});}}
 faces.sort((a,b)=>a.z-b.z);
 for(const f of faces){ctx.globalAlpha=f.alpha;polygon(f.pts);ctx.fillStyle=steelFace(f);ctx.fill();ctx.strokeStyle=f.b===flash&&now<flashUntil?'#e4ad83':'#4b565f';ctx.lineWidth=f.b===flash&&now<flashUntil?1.7:.85;ctx.stroke();
 // Inset highlight gives each block a shallow, solid steel bevel.
 const mid=project(f.center),inset=f.pts.map(p=>[p[0]+(mid[0]-p[0])*.045,p[1]+(mid[1]-p[1])*.045]);
 polygon(inset);ctx.strokeStyle='rgba(255,255,255,.42)';ctx.lineWidth=.65;ctx.stroke();
 arrow(f,f.center,now);}ctx.globalAlpha=1;}
function hit(x,y){for(let i=faces.length-1;i>=0;i--){const f=faces[i];if(f.b.removed)continue;polygon(f.pts);if(ctx.isPointInPath(x*(canvas.width/width),y*(canvas.height/height)))return f.b;}return null;}
let pointers=new Map(),drag=null,pinchDistance=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};if(pointers.size===2){const p=[...pointers.values()];pinchDistance=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);drag.moved=true;}});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!drag)return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(pinchDistance)zoom=Math.max(.55,Math.min(1.65,zoom*d/pinchDistance));pinchDistance=d;drag.moved=true;return;}if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;if(drag.moved){yaw+=(e.clientX-drag.lastX)*.008;pitch+=(e.clientY-drag.lastY)*.008;}drag.lastX=e.clientX;drag.lastY=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&pointers.size===1){const r=canvas.getBoundingClientRect(),b=hit(e.clientX-r.left,e.clientY-r.top);if(b)attempt(b);}pointers.delete(e.pointerId);if(!pointers.size)drag=null;else if(drag){drag.moved=true;const p=[...pointers.values()][0];drag.lastX=p[0];drag.lastY=p[1];}});
canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);drag=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(1.65,zoom*Math.exp(-e.deltaY*.001)));},{passive:false});
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='r')newGame();});
newGame();requestAnimationFrame(draw);
