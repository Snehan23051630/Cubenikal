import {makeLevel,canEscape} from './engine.js';
const $=id=>document.getElementById(id), canvas=$('puzzle'),ctx=canvas.getContext('2d');
let size=3,blocks=[],yaw=-.65,pitch=.48,zoom=1,faces=[],width=0,height=0,start=0,finished=false,hint=null,hintUntil=0,flash=null,flashUntil=0,sound=false,audio;
// Soft directional lighting keeps adjoining ivory faces readable.
function faceColor(normal){const n=rotate(normal),light=Math.max(0,n[0]*-.35+n[1]*.75+n[2]*.55);return `rgb(${Math.round(166+light*87)},${Math.round(204+light*50)},${Math.round(209+light*46)})`;}
const faceDefs=[{n:[1,0,0],v:[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]},{n:[-1,0,0],v:[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]},{n:[0,1,0],v:[[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]},{n:[0,-1,0],v:[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]},{n:[0,0,1],v:[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]},{n:[0,0,-1],v:[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]}];
function rotate([x,y,z]){const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw);return[a,y*Math.cos(pitch)-b*Math.sin(pitch),y*Math.sin(pitch)+b*Math.cos(pitch)];}
function project(p){const [x,y,z]=rotate(p),scale=Math.min(width*.55,height*.46)/size*zoom;return[width/2+x*scale,height*.46-y*scale,z];}
function tone(ok){if(!sound)return;try{audio??=new AudioContext();audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);osc.frequency.setValueAtTime(ok?620:150,audio.currentTime);gain.gain.setValueAtTime(.045,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);osc.start();osc.stop(audio.currentTime+.16);}catch{}}
function update(){const count=blocks.filter(b=>b.removed).length;$('cleared').textContent=count;$('total').textContent=` / ${blocks.length}`;$('remaining').textContent=`${blocks.length-count} BLOCKS LEFT`;$('progress').style.width=`${count/blocks.length*100}%`;if(count===blocks.length){finished=true;setTimeout(()=>{if(finished){$('win').hidden=false;$('result').textContent=`${blocks.length} blocks released in ${$('time').textContent}.`; }},650);}}
function newGame(){size=Number($('difficulty').value);blocks=makeLevel(size);start=0;finished=false;hint=null;flash=null;$('win').hidden=true;$('time').textContent='00:00';$('level').textContent=String(size-1).padStart(2,'0');$('notice').textContent='Follow the arrows. Rotate to find a clear path.';update();}
function attempt(b){if(b.removed||finished)return;start ||= Date.now();if(canEscape(b,blocks)){b.removed=true;b.exit=performance.now();hint=null;$('notice').textContent=['A little more breathing room.','One opening leads to another.','A clear path. Nicely spotted.'][Math.floor(Math.random()*3)];tone(true);update();}else{flash=b;flashUntil=performance.now()+550;$('notice').textContent='Something is in the way. Clear the blocks along this arrow first.';tone(false);}}
function polygon(points){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();}
function arrow(face,center){
 const d=face.b.dir,n=face.def.n;
 // Only draw on faces parallel to the escape direction: every visible arrow
 // represents the actual movement, with no alternate ring or dot notation.
 if(d.some((v,i)=>v*n[i]!==0))return;
 const side=[n[1]*d[2]-n[2]*d[1],n[2]*d[0]-n[0]*d[2],n[0]*d[1]-n[1]*d[0]];
 const point=(along,across=0)=>project(center.map((v,i)=>v+d[i]*along+side[i]*across));
 const tail=point(-.24),tip=point(.24),left=point(.045,.16),right=point(.045,-.16);
 ctx.strokeStyle='rgba(63,105,114,.78)';
 ctx.lineWidth=Math.max(1.4,Math.min(width*.55,height*.46)/size*zoom*.025);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
 ctx.moveTo(tail[0],tail[1]);ctx.lineTo(tip[0],tip[1]);
 ctx.moveTo(left[0],left[1]);ctx.lineTo(tip[0],tip[1]);ctx.lineTo(right[0],right[1]);ctx.stroke();
}
function draw(now){const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);if(width!==rect.width||height!==rect.height){width=rect.width;height=rect.height;canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}ctx.clearRect(0,0,width,height);faces=[];
 for(const b of blocks){let travel=0,alpha=1;if(b.removed){const elapsed=(now-b.exit)/650;if(!b.exit||elapsed>=1)continue;travel=elapsed*elapsed*size*5;alpha=1-elapsed;}
 const center=b.pos.map((v,i)=>v-(size-1)/2+b.dir[i]*travel);if(b===flash&&now<flashUntil)center[0]+=Math.sin(now*.06)*.04;
 for(const def of faceDefs){if(rotate(def.n)[2]<=.01)continue;const fc=center.map((v,i)=>v+def.n[i]*.495);const pts=def.v.map(v=>project(center.map((n,i)=>n+v[i]*.495)));faces.push({b,def,center:fc,pts,z:project(fc)[2],alpha});}}
 faces.sort((a,b)=>a.z-b.z);
 for(const f of faces){ctx.globalAlpha=f.alpha;polygon(f.pts);ctx.fillStyle=f.b===flash&&now<flashUntil?'#e7a99c':f.b===hint&&now<hintUntil?'#dfffaa':faceColor(f.def.n);ctx.fill();ctx.strokeStyle='rgba(91,133,142,.6)';ctx.lineWidth=.8;ctx.stroke();arrow(f,f.center,now);}ctx.globalAlpha=1;requestAnimationFrame(draw);}
function hit(x,y){for(let i=faces.length-1;i>=0;i--){const f=faces[i];if(f.b.removed)continue;polygon(f.pts);if(ctx.isPointInPath(x*(canvas.width/width),y*(canvas.height/height)))return f.b;}return null;}
let pointers=new Map(),drag=null,pinchDistance=0;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);drag={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};if(pointers.size===2){const p=[...pointers.values()];pinchDistance=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);drag.moved=true;}});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!drag)return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(pinchDistance)zoom=Math.max(.55,Math.min(1.65,zoom*d/pinchDistance));pinchDistance=d;drag.moved=true;return;}if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;if(drag.moved){yaw+=(e.clientX-drag.lastX)*.008;pitch+=(e.clientY-drag.lastY)*.008;}drag.lastX=e.clientX;drag.lastY=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved&&pointers.size===1){const r=canvas.getBoundingClientRect(),b=hit(e.clientX-r.left,e.clientY-r.top);if(b)attempt(b);}pointers.delete(e.pointerId);if(!pointers.size)drag=null;else if(drag){drag.moved=true;const p=[...pointers.values()][0];drag.lastX=p[0];drag.lastY=p[1];}});
canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);drag=null;});
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(1.65,zoom*Math.exp(-e.deltaY*.001)));},{passive:false});
$('reset-view').onclick=()=>{yaw=-.65;pitch=.48;zoom=1;};$('restart').onclick=newGame;$('next').onclick=newGame;$('difficulty').onchange=newGame;
$('hint').onclick=()=>{const b=blocks.find(b=>!b.removed&&canEscape(b,blocks));if(!b)return;hint=b;hintUntil=performance.now()+4500;const c=b.pos.map(v=>v-(size-1)/2),d=b.dir;const target=c.map((v,i)=>v+d[i]*size);yaw=Math.atan2(target[0],target[2])*-1+.5;pitch=Math.atan2(target[1],Math.hypot(target[0],target[2]))-.35;$('notice').textContent='The bright block has a clear escape route. Follow its arrow.';};
$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));tone(true);};
setInterval(()=>{if(!start||finished)return;const s=Math.floor((Date.now()-start)/1000);$('time').textContent=`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;},500);
newGame();requestAnimationFrame(draw);
