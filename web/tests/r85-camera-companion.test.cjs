const test=require('node:test'),assert=require('node:assert/strict');
require('../src/state-clone.js');require('../src/native-kernels.js');
const N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js'),P=require('../src/presentation-runtime.js'),M=require('../src/mobile-presentation.js');
const newRun=n=>{const r=new N.RestorationRun({slot:C.getSlot(n),settings:{speed:'fast'}});r.start();return r};
test('dog uses native history render positions, including the delayed wall change, without simulation writes',()=>{
 const r=newRun(23);let visible=0,faces=new Set(),delayedTurn=false;
 for(let i=0;i<180;i++){
  if(i%6===0)r.action();P.advance(r,.075);const saved=structuredClone(r.nativeFrame),g=P.geometry(r,{reduced:true}),d=g.companion;
  assert.deepEqual(r.nativeFrame,saved);
  const command=r.nativeFrame.map.drawCommands.find(x=>x.type==='semantic-actor-draw'&&x.role==='history-actor');
  if(!command){assert.equal(d,null);continue}assert.ok(d);visible++;faces.add(d.face);if(d.face!==g.player.face)delayedTurn=true;
  // Native anchors include +8 actor-local units and 10/16 pixel truncation.
  const offset=r.kernels.Assembly.rotatePoint(0,8,d.face),origin=r.kernels.Assembly.rotatePoint(0,0,d.face);
  assert.equal(Math.trunc((d.x+offset.x-origin.x)*10/16)+r.nativeFrame.presentation.viewport.x,command.x);
  assert.equal(Math.trunc((d.y+offset.y-origin.y)*10/16)+r.nativeFrame.presentation.viewport.y,command.y);
  assert.equal(d.nativeState,command.state);assert.equal(d.nativeFrame,command.frame);
  if([43,117,163,176].includes(i)){
   const cam=M.camera({width:390,height:844},g,{presentationTime:i*.075},r),a=Math.atan2(d.tangent.y,d.tangent.x);
   for(const [x,y]of [[-22,-26],[22,-26],[-22,3],[22,3]]){
    const px=(d.x+x*Math.cos(a)-y*Math.sin(a))*cam.scale+cam.offsetX,py=(d.y+x*Math.sin(a)+y*Math.cos(a))*cam.scale+cam.offsetY;
    assert.ok(px>=12-1e-7&&px<=378+1e-7,'dog clipped horizontally');assert.ok(py>=12-1e-7&&py<=832+1e-7,'dog clipped vertically');
   }
   assert.deepEqual(r.nativeFrame,saved);
  }
 }
 assert.ok(visible>50);assert.ok(faces.size>1);assert.ok(delayedTurn);r.retry();assert.equal(P.geometry(r,{}).companion,null);
});
test('companion is exclusive to the dog chapter; interpolation stays presentation-only',()=>{
 for(const n of [2,48]){const r=newRun(n);r.nativeFrame.history.ay=1;assert.equal(P.geometry(r,{}).companion,null)}
 const r=newRun(23);for(let i=0;i<44;i++){P.advance(r,.075);P.geometry(r,{})}
 const saved=structuredClone(r.nativeFrame);r.remainder=37.5;const mid=P.geometry(r,{}),end=P.geometry(r,{reduced:true});
 assert.ok(mid.companion.x<end.companion.x);assert.ok(Number.isFinite(mid.companion.renderAngle));assert.deepEqual(r.nativeFrame,saved);
});
test('R86 removes the invented R85 zoom on straights, corners and pause',()=>{
 const r=newRun(23),g=P.geometry(r,{reduced:true}),view={width:390,height:844};let time=0,last=M.camera(view,g,{presentationTime:time},r),peak=1;
 r.nativeFrame.game.pool.objects[0].position=80;
 for(let i=0;i<120;i++){time+=1/60;const c=M.camera(view,g,{presentationTime:time},r);assert.ok(c.zoom>=1&&c.zoom<=1.09);assert.ok(Math.abs(c.zoom-last.zoom)<.004);peak=Math.max(peak,c.zoom);last=c}
 assert.equal(peak,1);r.nativeFrame.game.pool.objects[0].position=380;
 for(let i=0;i<90;i++){time+=1/60;const c=M.camera(view,g,{presentationTime:time},r);assert.ok(c.zoom<=last.zoom);last=c}assert.ok(last.zoom<1.005);
 r.state='pause';assert.equal(M.camera(view,g,{presentationTime:time+20},r).zoom,last.zoom);
 assert.equal(M.camera(view,g,{presentationTime:time+21,reduced:true},r).zoom,1);
});
test('zoom preserves full viewport framing and safe foot anchors throughout all four turns',()=>{
 const r=newRun(23),g=P.geometry(r,{reduced:true});let time=0;
 for(const view of [{width:390,height:844},{width:844,height:390},{width:320,height:568}])for(let i=0;i<=360;i++){
  const angle=i*Math.PI/180,geo={...g,player:{...g.player,renderAngle:angle}};
  const c=M.camera(view,geo,{presentationTime:time+=1/60},r),x=geo.player.x*c.scale+c.offsetX,y=geo.player.y*c.scale+c.offsetY;
  assert.equal(c.framing,'viewport-cover');assert.ok(c.scale>=c.baseScale);assert.ok(x>=48&&x<=view.width-48);assert.ok(y>=48&&y<=view.height-48);
 }
});
