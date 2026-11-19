const test=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_PLAYABLE_RELEASE='R99';
globalThis.MONGYU_DREAM_EDITION=true;
require('../src/state-clone.js');
require('../src/native-stability.js');
require('../src/native-kernels.js');
const N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js');
require('../src/mobile-presentation.js');
const Scene=require('../src/native-scene.js');
function fixture(){
 const run=new N.RestorationRun({slot:C.getSlot(3),period:'noon',settings:{speed:'fast'}});
 assert.ok(run.start());
 const geo=Scene.geometry(run);
 geo.nativeScene={...Scene.snapshot(run),phase:'notification',countdown:0,notification:10};
 return {run,geo};
}
function draw(run,geo){
 const labels=[];
 const c=new Proxy({fillText:text=>labels.push(text)},{get:(o,k)=>(k in o?o[k]:()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const before=structuredClone(run.nativeFrame);
 const frame=Scene.draw(c,run,{viewport:{width:390,height:844},reduced:true},geo);
 assert.deepEqual(run.nativeFrame,before);
 assert.ok(!labels.includes('…'));
 return frame.speech;
}
test('notifications produce authored text and never reuse the ellipsis placeholder',()=>{
 const {run,geo}=fixture();
 for(const [code,pattern] of [[0,/새 길/],[47,/바뀌었/],[78,/이 길/],[256,/최고 기록/],[257,/목표/]]){
  geo.nativeScene.notificationCode=code;
  const line=draw(run,geo);
  assert.match(line.text,pattern);
  assert.ok(line.x>0&&line.x<390&&line.y>0&&line.y<844);
 }
 geo.nativeScene.notificationCode=999;
 assert.equal(draw(run,geo),null);
});
test('notification remains readable, hides on pause and expires on simulation time',()=>{
 const {run,geo}=fixture();
 geo.nativeScene.notificationCode=257;
 assert.ok(draw(run,geo));
 geo.nativeScene.phase='play';
 run.time=1.1;assert.ok(draw(run,geo));
 run.state='pause';assert.equal(draw(run,geo),null);
 run.state='play';run.time=1.7;assert.equal(draw(run,geo),null);
});
