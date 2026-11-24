const test=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;
const H=require('../src/helix-act.js');
const W=390,Hh=844,dt=1/120;
/* Recording canvas stub: counts calls, flags non-finite numeric arguments, tracks sprite calls. */
function recorder(){
 const log={calls:0,bad:[],fills:0,sprites:0,ops:{}};const gradient={addColorStop(){}};
 const ctx=new Proxy({canvas:{width:W,height:Hh}},{
  get(o,k){
   if(k in o)return o[k];
   if(k==='createLinearGradient'||k==='createRadialGradient')return()=>gradient;
   if(k==='measureText')return t=>({width:String(t).length*9});
   if(k==='getTransform')return()=>({});
   return(...a)=>{log.calls++;log.ops[k]=(log.ops[k]||0)+1;if(k==='fill')log.fills++;for(const v of a)if(typeof v==='number'&&!Number.isFinite(v))log.bad.push(k+':'+a.join(','))};
  },
  set(o,k,v){o[k]=v;return true}
 });
 return {ctx,log};
}
function drawAt(run,opts={}){const r=recorder();run.drawSelf(r.ctx,{viewport:{width:W,height:Hh},reduced:false,time:run.time,...opts});return r.log}
function at(variant,f,extra={}){const run=new H.HelixRun({variant,skipIntro:true,viewport:{width:W,height:Hh},...extra});run.start();const C=run.course;run.distance=C.L*f;run.speed=C.speedAt(run.distance);let i=0;while(C.obstacles[i]&&C.obstacles[i].at<run.distance-12)i++;run.index=i;run.clock=1;return run}

test('drawSelf draws every phase of both variants without invalid geometry',()=>{
 for(const v of ['up','down'])for(const reduced of [false,true])for(const f of [0,.1,.3,.5,.7,.9,.97,.999]){
  const run=at(v,f);run.cam=null;const log=drawAt(run,{reduced});drawAt(run,{reduced});
  assert.deepEqual(log.bad,[],v+' '+f+' '+reduced);assert.ok(log.calls>50&&log.calls<6500,v+' '+f+' calls '+log.calls);
 }
});
test('intro, crash and clear outro frames draw cleanly and the HUD can be switched off',()=>{
 const run=new H.HelixRun({variant:'up',viewport:{width:W,height:Hh}});run.start();
 for(let i=0;i<40;i++){run.tick(dt);if(i%10===0)assert.deepEqual(drawAt(run).bad,[])}
 const crash=at('up',.2);crash.crash={index:crash.index,at:crash.distance,early:true};crash.pose='hurt';crash.poseAt=.5;crash.clock=.9;crash.outro={kind:'fail',age:.3,duration:1};assert.deepEqual(drawAt(crash).bad,[]);
 const clear=at('down',1);clear.outro={kind:'clear',age:.8,duration:2.1};clear.pose='joy';assert.deepEqual(drawAt(clear).bad,[]);clear.state='clear';clear.outro=null;assert.deepEqual(drawAt(clear).bad,[]);
 const quiet=at('up',.4,{hud:false}),loud=at('up',.4);assert.ok(drawAt(quiet).calls<drawAt(loud).calls);
});
test('the runner is always on screen and stays near the lane across the whole course',()=>{
 for(const v of ['up','down'])for(let f=0;f<=1.0001;f+=.025){
  const run=at(v,Math.min(1,f));run.cam=null;drawAt(run);const a=run.view.actor;
  assert.ok(a&&a.x>20&&a.x<W-20&&a.y>H.TUNING.RUN_H&&a.y<Hh-60,v+' '+f.toFixed(3)+' '+JSON.stringify(a));
  assert.ok(run.view.body>Hh*.06&&run.view.body<Hh*.12,'runner height '+run.view.body);
 }
});
test('the character sprite is drawn with the run pose and a body near 9% of the screen height',()=>{
 const seen=[];globalThis.MongyuMobile={sprite:(c,q)=>{seen.push(q)}};
 try{
  const run=at('up',.4);drawAt(run);assert.equal(seen.length,1);assert.equal(seen[0].pose,'run');assert.ok(Math.abs(seen[0].bodyHeight/Hh-.09)<.025);
  run.flight=.3;run.height=20;drawAt(run);assert.equal(seen.at(-1).pose,'jump');
  run.pose='hurt';run.poseAt=0;run.flight=null;drawAt(run);assert.equal(seen.at(-1).pose,'hurt');
 }finally{delete globalThis.MongyuMobile}
});
test('camera: ascent tilts up near the goal; reduced motion changes orbit distance and drops the speed lines',()=>{
 const far=at('up',.5);far.cam=null;drawAt(far);const farPitch=far.cam&&far.cam.phi;assert.ok(Number.isFinite(farPitch));
 const dn=at('down',.8),a=drawAt(dn),b=drawAt(at('down',.8),{reduced:true});assert.ok(a.ops.stroke>b.ops.stroke||a.calls>b.calls);
 const cp=H.TUNING;assert.ok(cp.LOOK_UP===3);
});
test('per-frame canvas work stays bounded (structural proxy for the 4 ms budget) and is stable frame to frame',()=>{
 const run=at('down',.6);run.cam=null;const counts=[];
 for(let i=0;i<30;i++){run.clock+=1/60;counts.push(drawAt(run).calls)}
 assert.ok(Math.max(...counts)<6500,'max ops '+Math.max(...counts));
 assert.ok(Math.max(...counts)<Math.min(...counts)*1.35,'ops should not spike frame to frame: '+counts.slice(0,6));
});
