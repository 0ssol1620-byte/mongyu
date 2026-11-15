const test=require('node:test'),assert=require('node:assert/strict');
for(const name of ['state-clone','native-stability','native-kernels'])require('../src/'+name+'.js');
const M=require('../src/mobile-presentation.js'),P=require('../src/presentation-runtime.js'),A=require('../src/scene-stagecraft.js'),S=require('../src/native-scene.js'),N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js');require('../src/native-palette.js');require('../src/map-direction.js');
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
test('contact, toe-off and heel recovery form a closed continuous cycle with planted support',()=>{
 for(const u of [0,.08,.2,.3,.4,.449]){const f=M.runFoot(u),lowest=Math.max(...M.footPoints(f.point,f.angle).map(p=>p[1]));assert.ok(Math.abs(lowest+.12)<1e-8);assert.equal(f.contact,true)}
 const eps=1e-6;assert.ok(distance(M.runFoot(.45-eps).point,M.runFoot(.45+eps).point)<.001);assert.ok(distance(M.runFoot(1-eps).point,M.runFoot(0).point)<.001);
 const recovered=M.runFoot(.6);assert.ok(recovered.point[0]<-5&&recovered.point[1]<-13,'heel recovers behind the pelvis');
 for(const u of [.1,.2,.3])assert.ok(Math.abs((M.runFoot(u+eps).point[0]-M.runFoot(u-eps).point[0])/(2*eps)+42)<1e-5);
});
test('the back arm reaches behind the pelvis and the torso travels with the load',()=>{
 const first=M.gait(0,{strideDistance:0});assert.ok(first.arms[0][2][0]<first.hip[0]);let min=Infinity,max=0,previous;
 for(let i=0;i<=1000;i++){const pose=M.gait(0,{strideDistance:i/1000*42}),length=distance(pose.hip,pose.shoulder);min=Math.min(min,length);max=Math.max(max,length);
  for(const [a,b,c]of pose.arms){assert.ok(Math.abs(distance(a,b)-8.5)<1e-8);assert.ok(Math.abs(distance(b,c)-7.5)<1e-8)}
  const points=[pose.hip,pose.shoulder,...pose.legs.flat(),...pose.arms.flat()];if(previous)for(let k=0;k<points.length;k++)assert.ok(distance(points[k],previous[k])<.6,'pose discontinuity at '+i);previous=points;
 }assert.ok(max/min<1.15,'torso must not repeatedly compress and stretch');
});
test('low take-off and landing heights blend limbs instead of switching at a one-unit threshold',()=>{
 const a=M.gait(0,{height:.99,nativeState:3,jumpProgress:.1,strideDistance:4.2}),b=M.gait(0,{height:1.01,nativeState:3,jumpProgress:.1,strideDistance:4.2});
 for(const part of ['legs','arms'])for(let i=0;i<2;i++)for(let k=0;k<3;k++)assert.ok(distance(a[part][i][k],b[part][i][k])<.15);
});
test('reduced decorative motion preserves distance-driven locomotion instead of sliding a frozen pose',()=>{
 const a=M.gait(0,{strideDistance:0},true),b=M.gait(99,{strideDistance:10.5},true);assert.notDeepEqual(a.legs,b.legs);assert.deepEqual(b,M.gait(0,{strideDistance:10.5},false));
 const r=new N.RestorationRun({slot:C.getSlot(3),period:'noon',settings:{speed:'fast'}});r.start();P.geometry(r,{});for(let i=0;i<40;i++){P.advance(r,.075);P.geometry(r,{})}r.remainder=r.stepMs*.5;const snap=P.geometry(r,{reduced:true}),smooth=P.geometry(r,{reduced:true,essentialMotion:true}),before=structuredClone(r.nativeFrame);assert.ok(Number.isFinite(smooth.player.poseFraction));assert.equal(smooth.player.poseFraction,.5);assert.notEqual(smooth,snap);assert.deepEqual(r.nativeFrame,before);
});
test('landing never rewinds the jump pose and wall poses use the displayed fractional frame',()=>{
 const p={x:0,y:-6,height:6,jumpProgress:.95,nativeState:3,nativeFrame:20,face:0,tangent:{x:1,y:0}},q={...p,x:5,y:0,height:0,jumpProgress:0,nativeState:0,nativeFrame:0},before=structuredClone([p,q]);
 for(const alpha of [.1,.5,.9])assert.ok(P.interpolatePlayer(p,q,alpha).jumpProgress>=.75);assert.deepEqual([p,q],before);
 const wall=P.interpolatePlayer({...p,nativeState:12,nativeFrame:2},{...p,x:5,nativeState:12,nativeFrame:3},.5);assert.equal(wall.poseFrame,2.5);assert.equal(wall.nativeFrame,3);
});
function recorder(){const calls=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,o.globalAlpha,o.fillStyle,...args]),set:(o,k,v)=>(o[k]=v,true)});return {c,calls}}
test('three intensity settings produce different bounded fields; reduced motion freezes every phase',()=>{
 const cam={width:390,height:844,offsetX:0,offsetY:0},profile={id:'test',field:'orbit'},colors=['#ff0','#f0f','#0ff','#fff'],reports=[];
 for(const intensity of ['calm','balanced','intense']){const {c}=recorder(),r=A.draw(c,cam,profile,colors,8,false,{intensity,colors});reports.push(r);assert.ok(r.panels<=A.fieldSpec(intensity).panels);assert.ok(r.frames<=A.fieldSpec(intensity).frames)}
 assert.ok(reports[2].panels>reports[0].panels);assert.ok(A.fieldSpec('intense').gain>A.fieldSpec('balanced').gain);
 const a=recorder(),b=recorder();A.draw(a.c,cam,profile,colors,0,true,{intensity:'intense',colors});A.draw(b.c,cam,profile,colors,100,true,{intensity:'intense',colors});assert.deepEqual(a.calls,b.calls);
});
test('native rendering forwards intensity and freezes the continuous field clock on pause',()=>{
 const r=new N.RestorationRun({slot:C.getSlot(3),period:'noon',settings:{speed:'fast'}});r.start();const g=P.geometry(r,{}),old=A.draw,seen=[];A.draw=(...args)=>seen.push({time:args[4],options:args[6]});
 const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 try{S.draw(c,r,{viewport:{width:390,height:844},dreamIntensity:'intense',presentationTime:2},g);r.pause();const before=structuredClone(r.nativeFrame);S.draw(c,r,{viewport:{width:390,height:844},dreamIntensity:'intense',presentationTime:99},g);assert.deepEqual(r.nativeFrame,before);assert.equal(seen[0].time,2);assert.equal(seen[1].time,2);assert.equal(seen[0].options.intensity,'intense');assert.ok(Number.isFinite(seen[0].options.focus.x));}finally{A.draw=old}
});
