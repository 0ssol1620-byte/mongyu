const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;
const P=require('../src/penrose-act.js');
const VP={width:390,height:844};
function auto(run,{limit=90,skip=false}={}){
 run.start();if(skip)run.intro=0;let n=0;const ev=[];
 while(run.state==='play'&&n++<limit*120){
  const o=run.course.obstacles[run.blockIndex];
  if(o&&run.flight===null&&o.at-run.distance<=run.speed*P.FLIGHT/2&&o.at-run.distance>0)run.inputDown();
  run.tick(1/120);ev.push(...run.drainEvents());
 }
 return ev;
}
test('a perfectly timed run clears two laps in about half a minute with every contract field',()=>{
 const r=new P.PenroseRun({viewport:VP});
 assert.equal(r.mode,'dream');assert.equal(r.state,'ready');assert.equal(r.polish,true);assert.equal(typeof r.drawSelf,'function');
 const ev=auto(r);
 assert.equal(r.state,'clear');assert.ok(r.time>22&&r.time<40,'play time '+r.time);
 for(const e of ['start','jump','land','corner','portal','clear'])assert.ok(ev.includes(e),e);
 assert.ok(ev.includes('perfect'));assert.equal(ev.filter(e=>e==='corner').length,1,'one lap seam');
 const res=r.result;assert.equal(res.state,'clear');assert.equal(res.laps,2);assert.equal(res.clears,res.blocks);assert.ok(res.shards>=res.shardTotal*.5);
 assert.ok(res.points>0&&res.points<=res.score&&Number.isFinite(res.perfectStreak));assert.ok(res.altitude>=P.LOOP.T);
 const st=r.status();assert.equal(st.mode,'dream');assert.equal(st.state,'clear');assert.equal(st.progress,1);assert.ok(st.result)});

test('speed rises on the second lap and the loop is run twice',()=>{
 const r=new P.PenroseRun({viewport:VP});r.start();r.intro=0;const speeds=[];
 for(let i=0;i<40*120&&r.state==='play';i++){const o=r.course.obstacles[r.blockIndex];if(o&&r.flight===null&&o.at-r.distance<=r.speed*P.FLIGHT/2&&o.at-r.distance>0)r.inputDown();r.tick(1/120);if(i%60===0)speeds.push([r.lap,r.speed])}
 const l0=speeds.filter(s=>s[0]===0).pop()[1],l1=speeds.filter(s=>s[0]===1).pop()[1];assert.ok(l1>l0+5);assert.ok(Math.abs(l0-P.SPEEDS[0])<1&&Math.abs(l1-P.SPEEDS[1])<1)});

test('doing nothing fails on the first coral block and a retry restarts without the intro',()=>{
 const r=new P.PenroseRun({viewport:VP});r.start();let n=0;while(r.state==='play'&&n++<60*120)r.tick(1/120);
 assert.equal(r.state,'fail');assert.equal(r.hearts,0);assert.equal(r.crash.kind,'block');assert.ok(r.drainEvents().includes('hit'));assert.ok(r.result.distance>0&&r.result.distance<P.LAP);
 assert.ok(r.retry());assert.equal(r.state,'play');assert.equal(r.attempt,2);assert.equal(r.intro,0);assert.equal(r.distance,0)});

test('jump input: buffered while airborne, ignored while paused, intro tap skips the intro',()=>{
 const r=new P.PenroseRun({viewport:VP});r.start();assert.ok(r.intro>0);assert.equal(r.inputDown(),true);assert.equal(r.intro,0);
 r.tick(1/120);assert.equal(r.inputDown(),true);assert.equal(r.flight!==null,true);assert.equal(r.inputDown(),false);
 r.pause();assert.equal(r.state,'pause');assert.equal(r.inputDown(),false);r.tick(1);assert.equal(r.distance<5,true);r.resume();assert.equal(r.state,'play');
 const ev=r.drainEvents();assert.ok(ev.includes('start')&&ev.includes('jump')&&ev.includes('pause')&&ev.includes('resume'))});

test('runs are deterministic: same options, same inputs, same result',()=>{
 const a=new P.PenroseRun({viewport:VP,seed:5,bpm:110}),b=new P.PenroseRun({viewport:VP,seed:5,bpm:110});auto(a,{skip:true});auto(b,{skip:true});
 assert.deepEqual(a.result,b.result);assert.deepEqual(a.course.obstacles.map(o=>o.at),b.course.obstacles.map(o=>o.at))});

test('chain: not first skips intro and coach; not last clears instantly; points carry over',()=>{
 const mid=new P.PenroseRun({viewport:VP,chain:{index:1,count:3,first:false,last:false,bpm:100,seed:9,carry:{points:1000,shards:2,perfectStreak:3,hearts:1}}});
 mid.start();assert.equal(mid.intro,0);assert.equal(mid.coach,null);assert.equal(mid.points,1000);assert.equal(mid.perfectStreak,3);
 auto(mid);assert.equal(mid.state,'clear');assert.equal(mid.outro,null);assert.ok(mid.result.points>1000);assert.ok(mid.result.perfectStreak>=3);
 assert.ok(mid.result.points<=mid.score);
 // The instant end happens on the frame the line is crossed (no outro ticks).
 const solo=new P.PenroseRun({viewport:VP});solo.start();solo.intro=0;solo.distance=P.FINISH-.5;solo.lap=1;solo.blockIndex=solo.course.obstacles.length;for(let i=0;i<20&&!solo.outro;i++)solo.tick(1/120);
 assert.equal(solo.state,'play');assert.equal(solo.outro.kind,'clear');
 const first=new P.PenroseRun({viewport:VP,chain:{first:true,last:true}});first.start();assert.ok(first.intro>0);assert.ok(first.coach&&first.coach.text);
 const lone=new P.PenroseRun({viewport:VP});assert.ok(lone.coach&&lone.coach.text)});

test('chain hearts above one survive a hit and flash invulnerable',()=>{
 const r=new P.PenroseRun({viewport:VP,chain:{first:false,last:true,carry:{hearts:2}}});r.start();let n=0;while(r.state==='play'&&r.hearts===2&&n++<30*120)r.tick(1/120);
 assert.equal(r.state,'play');assert.equal(r.hearts,1);assert.ok(r.invuln>0);assert.equal(r.perfectStreak,0)});

test('perfect jumps build a streak and mistimed jumps do not',()=>{
 const r=new P.PenroseRun({viewport:VP});r.start();r.intro=0;auto(r,{skip:true});assert.ok(r.bestStreak>=2);
 const q=new P.PenroseRun({viewport:VP});q.start();q.intro=0;const o=q.course.obstacles[0];let n=0;
 while(q.state==='play'&&q.blockIndex===0&&n++<30*120){if(q.flight===null&&o.at-q.distance<=q.speed*(P.FLIGHT/2+.1))q.inputDown();q.tick(1/120)}
 assert.equal(q.state,'play');assert.equal(q.blockIndex,1);assert.equal(q.perfects,0)});

test('reduced motion and variants do not change the course',()=>{
 const a=new P.PenroseRun({viewport:VP,variant:'dawn'}),b=new P.PenroseRun({viewport:VP});
 assert.equal(a.variant,'dawn');assert.equal(b.variant,'dusk');assert.deepEqual(a.course.obstacles.map(o=>o.at),b.course.obstacles.map(o=>o.at))});
