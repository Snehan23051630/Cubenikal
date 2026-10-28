import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rotatePoint,inverseRotatePoint,projectPoint,pickBlock} from '../camera.js';
import {DIRECTIONS} from '../engine.js';
const camera={yaw:0,pitch:0,size:5,width:1200,height:800,zoom:1};
test('inverse camera rotation restores arbitrary points',()=>{
 for(const yaw of [-3,-.65,0,2])for(const pitch of [-2,.48,1.5]){
  const source=[1.2,-2,3.4],result=inverseRotatePoint(rotatePoint(source,yaw,pitch),yaw,pitch);
  result.forEach((v,i)=>assert.ok(Math.abs(v-source[i])<1e-10));
 }
});
test('near-plane crossing is clipped instead of mirroring an exiting block',()=>{
 const before=projectPoint([1,-1,16],camera);assert.ok(before[0]>600&&before[1]>400);
 assert.equal(projectPoint([1,-1,17.5],camera),null);
 assert.equal(projectPoint([1,-1,20],camera),null);
});
test('arrows and visible exit movement follow the same projected line in all directions',()=>{
 for(const dir of DIRECTIONS)for(const yaw of [-2,-.65,0,1])for(const pitch of [-1,.48,2]){
  const view={...camera,yaw,pitch},point=[.6,-.8,.3];
  const a=projectPoint(point,view),b=projectPoint(point.map((v,i)=>v+dir[i]*.24),view),c=projectPoint(point.map((v,i)=>v+dir[i]*2),view);
  const arrow=[b[0]-a[0],b[1]-a[1]],travel=[c[0]-a[0],c[1]-a[1]];
  assert.ok(arrow[0]*travel[0]+arrow[1]*travel[1]>0);
  assert.ok(Math.abs(arrow[0]*travel[1]-arrow[1]*travel[0])<1e-7);
 }
});
test('ray picking selects the nearest solid cube and exposes the one behind after removal',()=>{
 const far={pos:[2,2,1]},near={pos:[2,2,3]};
 assert.equal(pickBlock(600,400,[far,near],camera),near);
 near.removed=true;assert.equal(pickBlock(600,400,[far,near],camera),far);
 assert.equal(pickBlock(0,0,[far],camera),null);
});
test('picking follows camera rotation and CSS coordinates independent of screen density',()=>{
 const b={pos:[3,1,2]};
 for(const yaw of [-2,-.65,0,1])for(const pitch of [-1,.48,2])for(const zoom of [.55,1,1.65]){
  const view={...camera,yaw,pitch,zoom},p=projectPoint([1,-1,0],view);
  assert.equal(pickBlock(p[0],p[1],[b],view),b);
 }
});
