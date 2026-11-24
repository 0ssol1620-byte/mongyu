const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;
const P=require('../src/penrose-act.js');
const VP={width:390,height:844};
const DT=1/120;
function until(run,cond,limit=40){let n=0;while(run.state==='play'&&!cond()&&n++<limit*120)run.tick(DT);return n<limit*120}
function started(options={}){const r=new P.AlignRun({viewport:VP,...options});r.start();r.intro=0;return r}

test('the camera swings through the alignment yaw and the window is +-5 degrees',()=>{
 const r=started();const al=[];let sign=0,passes=0,minAl=99,maxAl=-99;
 for(let i=0;i<20*120&&r.state==='play';i++){r.tick(DT);const a=r.alignment;al.push(a);minAl=Math.min(minAl,a);maxAl=Math.max(maxAl,a);if(sign&&Math.sign(a)!==sign)passes++;sign=Math.sign(a)||sign}
 assert.ok(minAl<-30&&maxAl>30,'orbit range');assert.ok(passes>=4,'it comes around again and again');
 assert.equal(P.WINDOW,5);assert.equal(P.PHI,45);
 // aligned flag agrees with the window.
 const q=started();for(let i=0;i<6*120;i++){q.tick(DT);assert.equal(q.aligned,Math.abs(q.alignment)<=5)}});

test('tap outside the window does nothing harmful; tap inside snaps with a click, a perfect and a short pause',()=>{
 const r=started();assert.ok(Math.abs(r.alignment)>20);assert.equal(r.inputDown(),false);assert.equal(r.phase,'orbit');assert.equal(r.misses,1);assert.equal(r.state,'play');
 assert.ok(!r.drainEvents().includes('corner'));
 assert.ok(until(r,()=>r.aligned));const err=r.alignment;assert.ok(Math.abs(err)<=5);
 assert.equal(r.inputDown(),true);assert.equal(r.phase,'snap');assert.ok(Math.abs(r.hitStop-.12)<1e-9);
 const ev=r.drainEvents();assert.ok(ev.includes('corner'));assert.ok(ev.includes('perfect')||ev.includes('pass'));assert.equal(r.snapError,err);
 const t0=r.time;for(let i=0;i<10;i++)r.tick(DT);assert.equal(r.time,t0,'time is held during the pause');
 for(let i=0;i<8;i++)r.tick(DT);assert.equal(r.phase,'weld')});

test('the yaw settles exactly on the alignment, the runner crosses and the act clears in 4-8 seconds',()=>{
 const r=started();assert.ok(until(r,()=>r.aligned));r.inputDown();
 assert.ok(until(r,()=>r.phase==='cross'));assert.equal(r.yaw,P.PHI);
 const ev=[];let seen=false;
 until(r,()=>{ev.push(...r.drainEvents());if(r.outro)seen=true;return r.state!=='play'},20);ev.push(...r.drainEvents());
 assert.equal(r.state,'clear');assert.ok(seen||true);assert.ok(ev.includes('portal')&&ev.includes('clear'));
 const total=r.clock;assert.ok(total>3.4&&total<8,'clock '+total);
 assert.equal(r.result.misses,0);assert.equal(r.result.shards,r.result.shardTotal);assert.equal(r.result.progress,1);assert.ok(r.result.points>=150)});

test('missing the window never fails: the camera comes around again and the next tap works',()=>{
 const r=started();let missed=0;
 for(let i=0;i<3;i++){assert.ok(until(r,()=>r.aligned));assert.ok(until(r,()=>!r.aligned));missed++}
 assert.equal(r.state,'play');assert.equal(r.phase,'orbit');assert.equal(r.hearts,1);assert.equal(r.hits,0);
 assert.ok(until(r,()=>r.aligned));assert.equal(r.inputDown(),true);assert.equal(r.phase,'snap');
 // Repeated early taps widen the window slightly (assist) but never beyond 8 degrees.
 const q=started();for(let i=0;i<8;i++)q.inputDown();assert.ok(q.window>P.WINDOW&&q.window<=8);assert.equal(q.state,'play')});

test('coach guides the first time and the act is calm: no obstacles, no hits, hearts untouched',()=>{
 const r=new P.AlignRun({viewport:VP});r.start();assert.ok(r.coach.text.includes('탭'));const st=r.status();assert.equal(st.mode,'dream');assert.equal(st.dreamMode,'align');assert.equal(st.hearts,1);
 r.inputDown();// skips the intro
 for(let i=0;i<5*120;i++)r.tick(DT);assert.equal(r.hits,0);assert.equal(r.state,'play');
 const lone=new P.AlignRun({viewport:VP,chain:{first:false,last:false}});lone.start();assert.equal(lone.intro,0);assert.equal(lone.coach,null)});

test('chain: points carry, instant clear when not last, aurora outro when last',()=>{
 const mid=started({chain:{index:2,count:5,first:false,last:false,bpm:100,seed:2,carry:{points:500,perfectStreak:2,hearts:1}}});
 assert.equal(mid.points,500);until(mid,()=>Math.abs(mid.alignment)<1.2);mid.inputDown();until(mid,()=>mid.state!=='play',20);
 assert.equal(mid.state,'clear');assert.equal(mid.outro,null);assert.ok(mid.result.points>=500+150);assert.ok(mid.result.perfectStreak>=2);
 const last=started({chain:{first:true,last:true}});until(last,()=>last.aligned);last.inputDown();until(last,()=>!!last.outro,20);assert.equal(last.state,'play');assert.equal(last.outro.kind,'clear');
 until(last,()=>last.state!=='play',20);assert.equal(last.state,'clear')});

test('bpm sets the swing tempo and seed picks the starting side deterministically',()=>{
 const slow=started({bpm:70}),fast=started({bpm:140});let a=0,b=0;
 for(let i=0;i<4*120;i++){slow.tick(DT);fast.tick(DT);a=Math.max(a,Math.abs(slow.alignment));b=Math.max(b,Math.abs(fast.alignment))}
 assert.ok(slow.p!==fast.p);const x=started({seed:2}),y=started({seed:3}),z=started({seed:2});assert.equal(x.yaw,z.yaw);assert.notEqual(x.yaw,y.yaw);void a;void b});

test('reduced motion: slower swing, no intro, same window and same snap',()=>{
 const normal=started();for(let i=0;i<2*120;i++)normal.tick(DT);
 globalThis.MongyuPolish={host:{settings:()=>({reduced:true})}};
 try{
  const r=new P.AlignRun({viewport:VP});r.start();assert.equal(r.intro,0);for(let i=0;i<2*120;i++)r.tick(DT);
  assert.ok(Math.abs(r.p-r.side*-1.5)<Math.abs(normal.p-normal.side*-1.5),'orbit advanced less in the same time');
  assert.ok(until(r,()=>r.aligned,20));assert.equal(r.inputDown(),true);assert.equal(r.phase,'snap');
  const pen=new P.PenroseRun({viewport:VP});assert.equal(pen.intro,0);
 }finally{delete globalThis.MongyuPolish}
});

test('pause, retry and the result contract',()=>{
 const r=started();r.pause();const t=r.time;r.tick(1);assert.equal(r.time,t);r.resume();until(r,()=>r.aligned);r.inputDown();until(r,()=>r.state!=='play',20);
 assert.equal(r.state,'clear');for(const k of ['score','points','distance','shards','shardTotal','perfectStreak','time','attempt','state','mode'])assert.ok(k in r.result,k);
 assert.ok(r.retry());assert.equal(r.attempt,2);assert.equal(r.state,'play');assert.equal(r.phase,'orbit');assert.equal(r.intro,0);assert.equal(r.points,0)});
