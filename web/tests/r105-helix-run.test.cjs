const test=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;
const H=require('../src/helix-act.js');
const dt=1/120;
function play(run,skip=-1,lead=.34,max=120*90){
 run.start();
 for(let n=0;n<max&&run.state==='play';n++){
  const C=run.course,ob=C.obstacles[run.index];
  if(run.intro>0)run.inputDown();
  else if(ob&&run.index!==skip&&run.flight===null&&!run.outro){const eta=(ob.at-run.distance)/Math.max(1,run.speed);if(eta>0&&eta<=lead)run.inputDown()}
  run.tick(dt);
 }
 return run;
}
const evOf=run=>{const all=[];for(;;){const e=run.drainEvents();if(!e.length)break;all.push(...e)}return all};

test('module is gated by the polish flag and exposes both variants',()=>{
 assert.equal(H.enabled,true);assert.equal(typeof H.HelixRun,'function');
 for(const v of ['up','down']){const r=new H.HelixRun({variant:v});assert.equal(r.variant,v);assert.equal(r.mode,'dream');assert.equal(r.dreamMode,'helix');assert.equal(r.polish,true);assert.equal(r.state,'ready')}
});
test('course is deterministic, on the beat grid, 25-40 s long, and the descent accelerates',()=>{
 for(const v of ['up','down']){
  const a=H.buildCourse({variant:v}),b=H.buildCourse({variant:v});
  assert.equal(a,b);assert.ok(a.T>=25&&a.T<=40,v+' duration '+a.T);
  assert.ok(a.obstacles.length>=6);
  for(const o of a.obstacles){assert.ok(Math.abs(o.time/a.beat-Math.round(o.time/a.beat))<1e-9);assert.ok(Math.abs(a.timeAt(o.at)-o.time)<.02)}
  for(let i=1;i<a.obstacles.length;i++)assert.ok(a.obstacles[i].beat-a.obstacles[i-1].beat>=3);
  assert.ok(a.obstacles.at(-1).time<=a.T-2.4);
 }
 const d=H.buildCourse({variant:'down'});assert.ok(d.speedAt(d.L*.8)>d.speedAt(0)*1.8);assert.ok(d.speedAt(d.L)<d.speedAt(d.L*.8));
 const x=H.buildCourse({variant:'up',seed:7}),y=H.buildCourse({variant:'up',seed:8});assert.notDeepEqual(x.obstacles.map(o=>o.beat),y.obstacles.map(o=>o.beat));
 const k=H.buildCourse({variant:'up',bpm:120,seed:5});for(const o of k.obstacles)assert.ok(Math.abs(o.time/.5-Math.round(o.time/.5))<1e-9);
});
test('perfect play clears both variants with the contract events and result',()=>{
 for(const v of ['up','down']){
  const run=play(new H.HelixRun({variant:v,skipIntro:true}));
  assert.equal(run.state,'clear',v);assert.equal(run.pose,'joy');
  const ev=evOf(run);assert.equal(ev[0],'start');for(const e of ['jump','land','perfect','portal','clear'])assert.ok(ev.includes(e),v+' '+e);assert.equal(ev.at(-1),'clear');
  const r=run.result;assert.equal(r.state,'clear');assert.equal(r.hits,0);assert.equal(r.clears,run.course.count);assert.ok(r.shards>0&&r.shards<=r.shardTotal);assert.equal(r.perfectStreak,run.course.count);assert.ok(r.score>=r.points);assert.ok(Math.abs(r.progress-1)<1e-9);
  assert.ok(r.time>=25&&r.time<=40);
 }
});
test('a missed jump hits: hit event, hit-stop, hurt pose, outro, then fail',()=>{
 const run=new H.HelixRun({variant:'up',skipIntro:true});run.start();let hitStop=0,hitFrame=-1,n=0;
 while(run.state==='play'&&n<120*60){
  const C=run.course,ob=C.obstacles[run.index];
  if(ob&&run.index!==2&&run.flight===null){const eta=(ob.at-run.distance)/run.speed;if(eta>0&&eta<=.34)run.inputDown()}
  run.tick(dt);n++;if(run.crash&&hitFrame<0){hitFrame=n;hitStop=run.hitStop;assert.equal(run.pose,'hurt');assert.equal(run.hearts,0);assert.ok(evOf(run).includes('hit'))}
 }
 assert.equal(run.state,'fail');assert.ok(hitStop>=.11&&hitStop<=.13);assert.equal(run.crash.index,2);assert.equal(run.result.hits,1);assert.equal(run.perfectStreak,0);
 const d=run.distance;run.tick(dt);assert.equal(run.distance,d);assert.equal(run.inputDown(),false);
});
test('perfect needs a jump near the half-flight lead, normal passes keep the streak at zero',()=>{
 const early=play(new H.HelixRun({variant:'up',skipIntro:true}),-1,.42);
 assert.equal(early.state,'clear');assert.equal(early.perfects,0);assert.equal(early.perfectStreak,0);
 const perfect=play(new H.HelixRun({variant:'up',skipIntro:true}),-1,.34);assert.equal(perfect.perfects,perfect.course.count);
 assert.ok(perfect.points>early.points);
});
test('jump buffering: a tap shortly before landing queues the next jump',()=>{
 const run=new H.HelixRun({variant:'up',skipIntro:true});run.start();run.inputDown();
 for(let n=0;n<Math.round((H.TUNING.FLIGHT-.05)*120);n++)run.tick(dt);
 assert.equal(run.inputDown(),false);assert.ok(run.buffer>0);
 for(let n=0;n<12;n++)run.tick(dt);assert.equal(run.jumps,2);
});
test('chain: not first skips intro and tutorial; not last ends instantly with carried points',()=>{
 const chain={index:1,count:3,first:false,last:false,carry:{points:1000,shards:3,perfectStreak:2,hearts:1},bpm:120,seed:9};
 const run=new H.HelixRun({variant:'down',chain});
 assert.equal(run.intro,0);assert.equal(run.coach,null);assert.equal(run.slow,'done');assert.equal(run.points,1000);assert.equal(run.perfectStreak,2);
 for(const o of run.course.obstacles)assert.ok(Math.abs(o.time/.5-Math.round(o.time/.5))<1e-9);
 assert.equal(run.course.obstacles[0].beat,4);
 play(run);assert.equal(run.state,'clear');assert.equal(run.outro,null);
 const r=run.result;assert.ok(r.points>1000);assert.ok(r.points>=1000+run.course.count*100);assert.ok(r.shards<=r.shardTotal);assert.ok(r.perfectStreak>=2);
 assert.equal(evOf(run).filter(e=>e==='clear').length,1);
 const last=play(new H.HelixRun({variant:'up',chain:{first:false,last:true,carry:{points:50},seed:3}}));
 assert.equal(last.state,'clear');assert.equal(last.pose,'joy');assert.ok(last.result.points>=50+300);
 const first=new H.HelixRun({variant:'up',chain:{first:true,last:false,bpm:100}});assert.ok(first.intro>0);assert.equal(first.coach.text,H.COACH.intro);assert.equal(first.course.obstacles[0].beat,8);
 const tut=new H.HelixRun({variant:'up',tutorial:true,chain:{first:false,last:false}});assert.ok(tut.coach);
});
test('retry restarts from the section start with the carried score',()=>{
 const run=play(new H.HelixRun({variant:'up',skipIntro:true,chain:{first:false,last:false,carry:{points:400}}}),2);
 assert.equal(run.state,'fail');assert.equal(run.result.points,run.points);
 run.retry();assert.equal(run.state,'play');assert.equal(run.attempt,2);assert.equal(run.points,400);assert.equal(run.distance,0);assert.equal(run.intro,0);assert.equal(run.crash,null);assert.equal(run.result,null);
 assert.ok(evOf(run).includes('start'));
});
test('pause and resume freeze the simulation and emit events',()=>{
 const run=new H.HelixRun({variant:'up',skipIntro:true});run.start();for(let i=0;i<60;i++)run.tick(dt);
 assert.equal(run.pause(),true);const d=run.distance;for(let i=0;i<60;i++)run.tick(dt);assert.equal(run.distance,d);assert.equal(run.resume(),true);
 const ev=evOf(run);assert.ok(ev.includes('pause')&&ev.includes('resume'));
});
test('status() matches the run contract',()=>{
 const run=new H.HelixRun({variant:'down',skipIntro:true});run.start();for(let i=0;i<240;i++)run.tick(dt);
 const s=run.status();assert.equal(s.mode,'dream');assert.equal(s.state,'play');assert.ok(s.progress>0&&s.progress<1);assert.equal(s.hearts,1);assert.ok(typeof s.roomTitle==='string'&&s.roomTitle.length);assert.ok(Number.isFinite(s.score));
});
test('the first obstacle teaches with a short slow chance, only for the first act',()=>{
 const run=new H.HelixRun({variant:'up',skipIntro:true});run.start();let slowest=1;
 for(let n=0;n<120*8;n++){run.tick(dt);slowest=Math.min(slowest,run.timeScale);if(run.index>0)break}
 assert.ok(slowest<.5);
});
