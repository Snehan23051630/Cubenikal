export function rotatePoint([x,y,z],yaw,pitch){
 const a=x*Math.cos(yaw)+z*Math.sin(yaw),b=-x*Math.sin(yaw)+z*Math.cos(yaw);
 return [a,y*Math.cos(pitch)-b*Math.sin(pitch),y*Math.sin(pitch)+b*Math.cos(pitch)];
}
export function inverseRotatePoint([x,y,z],yaw,pitch){
 const a=y*Math.cos(pitch)+z*Math.sin(pitch),b=-y*Math.sin(pitch)+z*Math.cos(pitch);
 return [x*Math.cos(yaw)-b*Math.sin(yaw),a,x*Math.sin(yaw)+b*Math.cos(yaw)];
}
export function projectPoint(point,camera){
 const {yaw,pitch,size,width,height,zoom}=camera;
 const [x,y,z]=rotatePoint(point,yaw,pitch),distance=size*3.5;
 // Perspective is undefined at/behind the camera. Never draw mirrored exits.
 if(distance-z<=.1)return null;
 const scale=Math.min(width*.37,height*.37)/size*zoom,perspective=distance/(distance-z);
 return [width/2+x*scale*perspective,height/2-y*scale*perspective,z];
}
export function pickBlock(x,y,blocks,camera){
 const {yaw,pitch,size,width,height,zoom}=camera;
 const distance=size*3.5,scale=Math.min(width*.37,height*.37)/size*zoom;
 if(!scale)return null;
 const origin=inverseRotatePoint([0,0,distance],yaw,pitch);
 const ray=inverseRotatePoint([(x-width/2)/scale,(height/2-y)/scale,-distance],yaw,pitch);
 let selected=null,nearest=Infinity;
 for(const block of blocks){
  if(block.removed)continue;
  const center=block.pos.map(v=>v-(size-1)/2);
  let enter=0,leave=Infinity;
  for(let axis=0;axis<3;axis++){
   const low=center[axis]-.5,high=center[axis]+.5;
   if(Math.abs(ray[axis])<1e-10){if(origin[axis]<low||origin[axis]>high){leave=-1;break;}continue;}
   const a=(low-origin[axis])/ray[axis],b=(high-origin[axis])/ray[axis];
   enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
   if(enter>leave)break;
  }
  if(enter<=leave&&enter<nearest){nearest=enter;selected=block;}
 }
 return selected;
}
