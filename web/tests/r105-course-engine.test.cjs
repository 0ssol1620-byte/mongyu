const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;
const Opening=require('../src/opening-run.js'),Illusion=require('../src/illusion-course.js'),Course=require('../src/course-run.js');
const VP={width:390,height:844},DT=1/120;
const mk=(course,extra={})=>new Course.CourseRun({...course,viewport:VP,settings:{},attempt:1,...extra});
/* Test pilot: taps like a careful player. `slip` makes it miss the given act (index) once by never tapping. */
function pilot(run,{lazy=-1}={}){
 const c=run.child;if(!c||run.state!=='play'||run.portal&&!run.portal.swapped)return;
 if(run.actIndex===lazy)return;
 if(c.openingCourse){
  const o=c.obstacles[c.index];
  if(c.slowChance==='active'&&c.distance>=c.obstacles[0].at-80)run.action();
  else if(o&&o.at-c.distance<=Opening.PERFECT_LEAD+1&&c.flight===null)run.action();
  return;
 }
 const g=c.activeGap?.();
 if(g){const ahead=g.s0-c.distance;if(ahead<=90&&ahead>10||c.slowChance==='active')run.action();return}
 const b=c.cs.COURSE.blocks[c.blockIndex];
 if(b&&b.at-c.distance<=Illusion.SPEED*Illusion.FLIGHT/2+.5&&c.flight===null)run.action();
}
function play(run,{lazy=-1,max=120*200}={}){
 run.start();let n=0;const seen=[];
 while(run.state==='play'&&n++<max){pilot(run,{lazy});run.tick(DT);for(const e of run.drainEvents())seen.push(e)}
 return {n,seen,seconds:n*DT};
}
const FB=id=>({...Course.courseById(id)});

test('act registry: lazily resolves built-ins, skips unregistered, uses the fallback list', () => {
 assert.ok(Course.hasAct('floor-wall'));assert.ok(Course.hasAct('bridge'));
 assert.equal(Course.hasAct('helix-up'),false);
 const c2=Course.courseById('c2'),p=Course.playableActs(c2);
 assert.equal(p.fallback,true);assert.deepEqual(p.acts.map(a=>a.type),['floor-wall','bridge','bridge']);
 assert.ok(p.missing.some(a=>a.type==='helix-up'));
 Course.registerAct('helix-up',o=>new Illusion.IllusionRun({...o,plan:Course.BRIDGES.calm}));
 assert.ok(Course.hasAct('helix-up'));Course.unregisterAct('helix-up');assert.equal(Course.hasAct('helix-up'),false)});

test('a registered act replaces the fallback and receives the chain contract', () => {
 let seen=null;
 Course.registerAct('helix-up',o=>{seen=o;return new Illusion.IllusionRun({...o,plan:Course.BRIDGES.calm})});
 Course.registerAct('helix-down',o=>new Illusion.IllusionRun({...o,plan:Course.BRIDGES.calm}));
 try{
  const run=mk(FB('c4'));assert.equal(run.usedFallback,false);// c4 needs only helix-down, which is registered
  assert.deepEqual(run.acts.map(a=>a.type),['helix-down','bridge','floor-wall']);
  const r2=mk(FB('c2'));assert.equal(r2.usedFallback,false);r2.start();
  // advance to the helix-up act
  let guard=0;while(r2.actIndex<1&&guard++<120*60){pilot(r2);r2.tick(DT)}
  while(r2.portal&&guard++<120*80)r2.tick(DT);
  assert.ok(seen,'factory called');assert.equal(seen.chain.index,1);assert.equal(seen.chain.first,false);assert.equal(seen.chain.last,false);assert.equal(seen.chain.count,4);
  assert.ok(seen.chain.carry.points>0);assert.equal(seen.chain.bpm,100);assert.equal(seen.variant,undefined);assert.deepEqual(seen.viewport,VP);
 }finally{Course.unregisterAct('helix-up');Course.unregisterAct('helix-down')}});

test('every chapter 1 course plays through end to end with the pilot, carrying points and shards', () => {
 for(const course of Course.CHAPTER1.courses){
  const run=mk(course),{seconds,seen}=play(run);
  assert.equal(run.state,'clear',course.id+' '+JSON.stringify(run.result));
  assert.ok(seconds>=25&&seconds<=75,course.id+' takes '+seconds.toFixed(1)+'s');
  const r=run.result;assert.equal(r.mode,'road');assert.equal(r.actCount,run.acts.length);
  assert.ok(r.score>run.acts.length*100,course.id+' score '+r.score);assert.ok(r.shards>0&&r.shards<=r.shardTotal);
  assert.equal(seen.filter(e=>e==='portal').length>=run.acts.length-1,true);
  assert.equal(seen.filter(e=>e==='clear').length,1);assert.equal(seen.filter(e=>e==='fail').length,0);
  assert.equal(r.deaths,0);assert.ok(r.stars>=1&&r.stars<=3);
 }});

test('score, shards and perfect streak carry across act gates; the portal lasts 0.6s (0.22s reduced)', () => {
 const run=mk(FB('c1'));run.start();let last=0,gates=0,maxStreak=0;
 for(let i=0;i<120*80&&run.state==='play';i++){
  pilot(run);const before=run.actIndex,s=run.score;run.tick(DT);
  assert.ok(run.score>=s-1e-9,'score never decreases ('+s+' -> '+run.score+')');
  if(run.actIndex!==before){gates++;assert.ok(run.portal&&run.portal.duration===Course.PORTAL);assert.ok(run.score>=last)}
  last=run.score;maxStreak=Math.max(maxStreak,run.perfectStreak);
 }
 assert.equal(gates,2);assert.equal(run.state,'clear');
 globalThis.MongyuPolish={host:{settings:()=>({reduced:true})}};
 try{const r=mk(FB('c1'));r.start();let guard=0;while(!r.portal&&guard++<120*60){pilot(r);r.tick(DT)}assert.equal(r.portal.duration,Course.PORTAL_REDUCED)}finally{delete globalThis.MongyuPolish}});

test('fail restarts the failed act with the carried state; the first act fails without losing the tutorial', () => {
 const course=FB('c1');let run=mk(course);run.start();
 // fly through act 0 and 1, then stop tapping in act 2
 let guard=0;while(run.actIndex<2&&guard++<120*90){pilot(run);run.tick(DT)}
 while(run.portal&&guard++<120*95)run.tick(DT);
 assert.equal(run.actIndex,2);const carry={...run.carries[2]};assert.ok(carry.points>0&&carry.shards>0);
 let n=0;while(run.state==='play'&&n++<120*60)run.tick(DT);// no taps
 assert.equal(run.state,'fail');assert.equal(run.result.state,'fail');assert.equal(run.result.stars,0);assert.equal(run.result.actIndex,2);assert.equal(run.deaths,1);
 const ev=run.drainEvents();assert.ok(ev.includes('fail')&&!ev.includes('clear'));
 // fresh run through the host path
 const next=run.checkpointRun();next.start();
 assert.equal(next.actIndex,2);assert.equal(next.attempt,2);assert.equal(next.deaths,1);assert.equal(next.score,carry.points+carry.bonus);
 assert.equal(next.child.options.chain.carry.points,carry.points);assert.equal(next.child.options.chain.first,false);
 // in place retry too
 run.retry();assert.equal(run.state,'play');assert.equal(run.actIndex,2);assert.equal(run.score,carry.points+carry.bonus);assert.equal(run.result,null);
 // finishing after a retry: no-hit star is gone, clear still counts
 const out=play(next);assert.equal(next.state,'clear');assert.equal(next.result.deaths,1);assert.ok(next.result.stars>=1&&next.result.stars<=2)});

test('a failure in the first act keeps score 0 and replays the tutorial act', () => {
 const run=mk(FB('c1'));run.start();let n=0;while(run.state==='play'&&run.child.index<1&&n++<120*60){pilot(run);run.tick(DT)}
 while(run.state==='play'&&n++<120*60)run.tick(DT);
 assert.equal(run.state,'fail');assert.equal(run.result.actIndex,0);
 const next=run.checkpointRun();assert.equal(next.actIndex,0);assert.equal(next.score,0);assert.equal(next.child.tutorial,true)});

test('status() follows the dream-mode contract: weighted progress, hearts, labels, events', () => {
 const run=mk(FB('c1'));run.start();const s0=run.status();
 assert.equal(s0.mode,'dream');assert.equal(s0.dreamMode,'road');assert.equal(s0.state,'play');assert.equal(s0.hearts,1);assert.equal(s0.roomCount,3);assert.equal(s0.progress,0);
 let prev=0,guard=0;while(run.state==='play'&&guard++<120*90){pilot(run);run.tick(DT);const p=run.status().progress;assert.ok(p>=prev-1e-9,'progress is monotonic');prev=p}
 const s1=run.status();assert.equal(s1.progress,1);assert.equal(s1.result.state,'clear');
 assert.equal(run.boundaries().length,2);
 assert.ok(run.pause()===false);assert.equal(run.child.state,'clear')});

test('pause/resume freezes the course and input is ignored during the first half of a gate', () => {
 const run=mk(FB('c1'));run.start();for(let i=0;i<60;i++)run.tick(DT);
 const d=run.child.distance;assert.ok(run.pause());for(let i=0;i<120;i++)run.tick(DT);assert.equal(run.child.distance,d);assert.ok(run.resume());
 let guard=0;while(!run.portal&&guard++<120*60){pilot(run);run.tick(DT)}
 assert.ok(run.portal);assert.equal(run.action(),false);const before=run.child.updates;run.tick(DT);assert.equal(run.child.updates,before,'next act is frozen before the gate is half open')});

test('bridge acts are deterministic and obstacles sit on the beat grid', () => {
 const a=mk(FB('c3')),b=mk(FB('c3'));
 const sig=r=>JSON.stringify(r.child.cs.COURSE.blocks.map(x=>[x.at,x.dir]).concat(r.child.cs.COURSE.gaps.map(g=>[g.s0,g.len])));
 assert.equal(sig(a),sig(b));
 const beat=Illusion.SPEED*60/100;
 for(const x of a.child.cs.COURSE.blocks)assert.ok(Math.abs(x.at/beat-Math.round(x.at/beat))<1e-6,'block on beat '+x.at);
 const o=Opening.OpeningRun,r=new o({slot:Course.SLOT,attempt:1,viewport:VP,settings:{},chain:{index:0,count:2,first:true,last:false,carry:{points:0,shards:0,perfectStreak:0,hearts:1},bpm:100,seed:1},span:[0,1]}),B=Opening.FINISH>0?122*60/100:0;
 for(let i=0;i<4;i++)assert.ok(Math.abs(r.obstacles[i].at/B-Math.round(r.obstacles[i].at/B))<1e-6)});
