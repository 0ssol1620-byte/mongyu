const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('../src/mobile-presentation.js'),P=require('../src/presentation-runtime.js');
test('knees bend forward in actor-local space in every run and jump frame',()=>{
 for(let i=0;i<400;i++)for(const q of [{},{height:8,jumpProgress:i/400,kick:.5},{climbing:true}])for(const [hip,knee,ankle]of M.gait(i/240,q).legs){
  const side=(ankle[0]-hip[0])*(knee[1]-hip[1])-(ankle[1]-hip[1])*(knee[0]-hip[0]);assert.ok(side<=1e-7,'knee points backwards');
 }
});
test('stance feet stay planted against actual forward distance rather than an unrelated wall clock',()=>{
 const a=M.gait(0,{strideDistance:0}),b=M.gait(100,{strideDistance:4});
 assert.ok(Math.abs(a.legs[0][2][0]-(4+b.legs[0][2][0]))<1e-8);assert.equal(a.legs[0][2][1],0);assert.equal(b.legs[0][2][1],0);
});
test('all four corner turns have continuous endpoints, a contact path and bounded angular increments',()=>{
 for(let face=0;face<4;face++){
  const a=face*Math.PI/2,t={x:Math.round(Math.cos(a)),y:Math.round(Math.sin(a))},u={x:-t.y,y:t.x};
  const p={x:-t.x*8,y:-t.y*8,tangent:t,face,height:0,strideDistance:200,nativeState:0},q={x:u.x*24,y:u.y*24,tangent:u,face:(face+1)%4,height:0,nativeState:0};
  let last=P.interpolatePlayer(p,q,0);assert.ok(Math.abs(last.x-p.x)<1e-8);assert.ok(Math.abs(last.y-p.y)<1e-8);
  for(let i=1;i<=20;i++){const v=P.interpolatePlayer(p,q,i/20);assert.ok(Math.hypot(v.x-last.x,v.y-last.y)<=1.60001);assert.ok(Math.abs(v.renderAngle-last.renderAngle)<.079);assert.ok(Math.abs(v.x*t.x+v.y*t.y)<1e-7||Math.abs(v.x*u.x+v.y*u.y)<1e-7);last=v}
  assert.ok(Math.abs(last.x-q.x)<1e-8);assert.ok(Math.abs(last.y-q.y)<1e-8);assert.equal(last.strideDistance,232);
 }
});
test('teleports and impacts are never smoothed through geometry',()=>{
 const p={x:0,y:0,face:0,tangent:{x:1,y:0},height:0,nativeState:0};for(const q of [{...p,x:300},{...p,x:10,nativeState:13}])assert.deepEqual(P.interpolatePlayer(p,q,.5),q);
});
test('default avatar is plain and the tile layer follows native points on all four walls',()=>{
 assert.equal(M.looks[0].detail,'plain');assert.equal(M.looks[0].body,'#18121d');
 const calls=[],ctx=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,...args]),set:(o,k,v)=>(o[k]=v,true)});
 const g={nativeSurfaces:[{side:0,tangent:[1,0],points:[{x:32,y:48},null,{x:64,y:48}]}]};assert.equal(M.nativeSupport(ctx,g,{stage:0}),true);assert.equal(calls.filter(c=>c[0]==='transform').length,1);assert.ok(calls.some(c=>c[0]==='fillRect'&&c[1]===32&&c[2]===48));assert.ok(calls.some(c=>c[0]==='fillRect'&&c[1]===64&&c[2]===48));assert.ok(calls.some(c=>c[0]==='fillRect'&&c[3]===16&&c[4]===16));assert.equal(calls.some(c=>c[0]==='stroke'),false);
});
test('boot markup hides legacy controls until the final initialized screen is ready',()=>{
 const template=fs.readFileSync(require.resolve('../index.template.html'),'utf8'),app=fs.readFileSync(require.resolve('../src/app.js'),'utf8');assert.match(template,/data-boot="loading"/);assert.ok(template.indexOf('html[data-boot=loading]')<template.indexOf('<body>'));assert.match(template,/<div id="bootSplash"/);assert.ok(app.lastIndexOf("dataset.boot='ready'")>app.indexOf('window.QUAD_RIFT_APP={'));
});
test('airborne turns blend the ground path and inward height without snapping at the wall',()=>{
 const p={x:-8,y:-10,height:10,tangent:{x:1,y:0},face:0,nativeState:3},q={x:12,y:24,height:12,tangent:{x:0,y:1},face:1,nativeState:0};
 // Incoming floor is y=0, outgoing wall is x=0; its inward normal points right.
 const first=P.interpolatePlayer(p,q,0),mid=P.interpolatePlayer(p,q,.5),last=P.interpolatePlayer(p,q,1);
 assert.ok(Math.hypot(first.x-p.x,first.y-p.y)<1e-8);assert.ok(Math.hypot(last.x-q.x,last.y-q.y)<1e-8);assert.ok(mid.renderAngle>0&&mid.renderAngle<Math.PI/2);assert.ok(Math.abs(mid.height-11)<1e-8);
});
test('normal UI starts at the native fast setting; explicit slow setting remains available to missions',()=>{
 const {host}=require('./host.cjs'),h=host({inline:true,square:true,restoration:true,native:true});h.click('titleContinue');h.click('restorationSceneNext');h.click('restorationSceneNext');h.click('restorationStart');const run=h.app.activeRun();assert.equal(run.settings.speed,'fast');assert.equal(run.stepMs,75);
 const N=h.ctx.MongyuNativeRestoration,C=h.ctx.MongyuRestorationCatalog,slow=new N.RestorationRun({slot:C.getSlot(2),settings:{speed:'fast'},setting:'speed',settingValue:'slow'});assert.equal(slow.settings.speed,'slow');assert.equal(slow.stepMs,115);
});
