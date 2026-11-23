const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/restoration-catalog.js');
const O=require('../src/opening-run.js');
const SFX=require('../src/game-sfx.js');
const slot=C.getSlot(2),dt=1/120,first=O.OBSTACLES[0];
function polish(on,fn){const before=globalThis.MONGYU_POLISH_EDITION;globalThis.MONGYU_POLISH_EDITION=on;try{return fn()}finally{if(before===undefined)delete globalThis.MONGYU_POLISH_EDITION;else globalThis.MONGYU_POLISH_EDITION=before}}
// Taps when the next obstacle is `lead` units ahead (or the slow-chance hold is reached), skipping obstacle `skip`.
function play({on=false,attempt=2,lead=39,firstLead=lead,skip=-1,practice=false,section=0,limit=6000,watch}={}){
 return polish(on,()=>{
  const run=new O.OpeningRun({slot,attempt,practice,section});run.start();
  const events=[];let tapped=-1;
  for(let n=0;n<limit&&run.state==='play';n++){
   const o=O.OBSTACLES[run.index],held=run.slowChance==='active'&&run.distance>=first.at-20-1e-6;
   if(o&&run.index!==skip&&tapped!==run.index&&(o.at-run.distance<=(run.index===0?firstLead:lead)||held)){run.inputDown();run.inputUp();tapped=run.index}
   run.tick(dt);events.push(...run.drainEvents());watch?.(run,events);
  }
  return {run,events};
 });
}
const canonical=r=>{const {time,...rest}=r;return rest};
test('R103 behaviour is untouched without the polish flag',()=>{
 const {run,events}=play();
 assert.equal(run.polish,false);assert.equal(run.coach,undefined);assert.equal(run.perfectStreak,undefined);
 assert.equal(run.state,'clear');assert.equal(run.score,660);assert.equal(run.result.score,660);
 assert.deepEqual(events.filter(e=>e==='perfect'||e==='pass'),Array(6).fill('perfect'));
 const crash=play({skip:2}).run;assert.equal(crash.state,'fail');assert.equal(crash.result.score,220);assert.equal(crash.crash.index,2);
});
test('polish pacing (hit-stop, crash outro, finish slow motion) leaves the validated result identical',()=>{
 for(const opts of [{},{skip:2},{skip:4},{lead:60}]){
  const plain=play(opts).run,shiny=play({...opts,on:true}).run;
  assert.equal(shiny.polish,true);
  assert.deepEqual(canonical(shiny.result),canonical(plain.result));
  assert.ok(Math.abs(shiny.result.time-plain.result.time)<=dt,'sim time within one tick');
  assert.equal(O.validResult(slot,shiny.result),O.validResult(slot,plain.result));
  assert.equal(O.validResult(slot,shiny.result),true);
 }
});
test('crash freezes the simulation for the hit-stop and holds the fail state for the outro',()=>{
 let hitAt=null,distance=null,frozenTicks=0,inputs=0,failTick=null;
 const {run}=play({on:true,skip:2,watch:(r,ev)=>{
  if(hitAt===null&&ev.includes('hit')){hitAt=r.updates;distance=r.distance;inputs=r.inputCount;assert.equal(r.inputDown(),false)}
  else if(hitAt!==null&&r.state==='play'){if(r.distance===distance)frozenTicks++;}
  if(failTick===null&&ev.includes('fail'))failTick=r.updates;
 }});
 assert.ok(hitAt!==null);assert.equal(run.state,'fail');assert.equal(run.distance,distance);assert.equal(run.inputCount,inputs);
 const outroTicks=failTick-hitAt;
 assert.ok(Math.abs(outroTicks-(.12+.72)*120)<=2,'hit-stop + outro ~0.84s real time, got '+outroTicks+' ticks');
 assert.ok(frozenTicks>=Math.floor(.12*120));
 assert.ok(run.clock>run.time+.8);
});
test('practice crashes keep recovering after the hit-stop',()=>{
 let recovered=false;
 const {run,events}=play({on:true,practice:true,section:1,skip:2,limit:600,watch:r=>{if(r.hits&&!r.crash&&r.distance>O.SECTIONS[1].start)recovered=true}});
 assert.ok(events.filter(e=>e==='hit').length>=2);assert.equal(run.state,'play');assert.ok(recovered);
});
test('perfect window: takeoff lead within ±10 of the jump apex (SPEED*FLIGHT/2)',()=>{
 assert.ok(Math.abs(O.PERFECT_LEAD-40.26)<.01);assert.equal(O.PERFECT_TOLERANCE,10);
 for(const lead of [32,40,48]){
  const {run,events}=play({on:true,lead});
  assert.deepEqual(events.filter(e=>e==='perfect'||e==='pass'),Array(6).fill('perfect'),'lead '+lead);
  assert.equal(run.perfectStreak,6);assert.equal(run.bestStreak,6);
 }
 for(const lead of [25,55]){
  const {run,events}=play({on:true,lead});
  assert.deepEqual(events.filter(e=>e==='perfect'||e==='pass'),Array(6).fill('pass'),'lead '+lead);
  assert.equal(run.perfectStreak,0);
 }
 let seen=null;play({on:true,lead:40,watch:r=>{if(!seen&&r.coach?.kind==='perfect')seen={...r.coach,time:r.time}}});
 assert.equal(seen.text,'완벽!');assert.ok(seen.until>seen.time);
});
test('polish score grows with distance, passes, perfect streaks and the finish while result.score stays canonical',()=>{
 const perfect=play({on:true,lead:40}).run,plainPass=play({on:true,lead:25}).run;
 assert.equal(perfect.result.score,660);assert.equal(O.validResult(slot,plainPass.result),true);
 assert.equal(perfect.score,1180+660+50*(1+2+3+4+5+5)+500);
 assert.equal(plainPass.score,1180+plainPass.result.score+500);
 const steps=[];play({on:true,lead:40,watch:(r,ev)=>{if(ev.at(-1)==='perfect'&&steps.at(-1)!==r.index)steps.push(r.index,r.score)}});
 assert.ok(steps.length>=12);
 const crash=play({on:true,skip:2}).run;assert.ok(crash.score>crash.result.score);assert.equal(O.validResult(slot,crash.result),true);
});
test('first-attempt slow chance slows to 0.25x from at-70 and holds at at-20 until a tap',()=>{
 const run=polish(true,()=>new O.OpeningRun({slot,attempt:1}));run.start();
 assert.equal(run.tutorial,true);assert.equal(run.slowChance,'pending');
 polish(true,()=>{for(let n=0;n<2400;n++)run.tick(dt)});
 assert.equal(run.slowChance,'active');assert.ok(Math.abs(run.distance-(first.at-20))<1e-6);assert.equal(run.timeScale,.25);
 assert.deepEqual(run.coach&&[run.coach.kind,run.coach.text],['slow','지금 탭!']);
 const frozen=run.time;polish(true,()=>{for(let n=0;n<120;n++)run.tick(dt)});assert.equal(run.time,frozen);
 assert.equal(run.inputDown(),true);assert.equal(run.slowChance,'done');
 polish(true,()=>{for(let n=0;n<96;n++)run.tick(dt)});
 assert.equal(run.timeScale,1);assert.ok(run.index>=1);assert.equal(run.state,'play');
 assert.equal(polish(true,()=>new O.OpeningRun({slot,attempt:2})).tutorial,false);
 assert.equal(polish(true,()=>new O.OpeningRun({slot,attempt:5,tutorial:true})).tutorial,true);
 assert.equal(polish(true,()=>new O.OpeningRun({slot,attempt:1,practice:true,section:0})).tutorial,false);
});
test('an early tap in the slow chance is queued to a safe takeoff and the tutorial run still validates',()=>{
 const {run,events}=play({on:true,attempt:1,firstLead:68});
 assert.equal(run.state,'clear');assert.equal(O.validResult(slot,run.result),true);assert.equal(events.filter(e=>e==='hit').length,0);
});
test('coach texts for the wall and for early or late crashes',()=>{
 const kinds=new Map();play({on:true,attempt:1,lead:40,skip:2,watch:r=>{if(r.coach)kinds.set(r.coach.kind,r.coach.text)}});
 assert.equal(kinds.get('slow'),'지금 탭!');assert.equal(kinds.get('wall'),'벽도 바닥이야');assert.equal(kinds.get('late'),'한 박자 늦었어. 조금만 더 빨리!');
 const early=play({on:true,lead:70}).run;
 assert.equal(early.crash.early,true);assert.deepEqual([early.coach.kind,early.coach.text],['early','조금 일찍 눌렀어. 장애물 바로 앞에서!']);
 assert.ok(early.coach.until>early.time);
 assert.deepEqual(O.COACH,{slow:'지금 탭!',wall:'벽도 바닥이야',perfect:'완벽!',early:'조금 일찍 눌렀어. 장애물 바로 앞에서!',late:'한 박자 늦었어. 조금만 더 빨리!'});
});
test('reduced motion removes hit-stop and finish slow motion',()=>{
 const host=globalThis.MongyuPolish;globalThis.MongyuPolish={host:{settings:()=>({reduced:true})}};
 try{
  let hitAt=null,failAt=null;play({on:true,skip:2,watch:(r,ev)=>{if(hitAt===null&&ev.includes('hit')){hitAt=r.updates;assert.equal(r.hitStop,0)}if(ev.includes('fail'))failAt=r.updates}});
  assert.ok(Math.abs(failAt-hitAt-.72*120)<=2);
  const {run}=play({on:true});assert.ok(run.clock-run.time<O.TIMING.clearOutro+.1,'only the clear outro, no slow motion');
 }finally{if(host===undefined)delete globalThis.MongyuPolish;else globalThis.MongyuPolish=host}
});
test('new synthesized effects are defined',()=>{
 for(const kind of ['impact-glass','impact-chime-fall','aurora-shimmer','perfect-chime']){
  const spec=SFX.configs[kind];assert.equal(spec.length,5,kind);assert.ok(spec[0]>0&&spec[0]<=1.5);
 }
 assert.ok(SFX.configs['impact-glass'][1]>SFX.configs.hit[1]);assert.ok(SFX.configs['impact-chime-fall'][2]<SFX.configs['impact-chime-fall'][1]);
});
test('play-juice stays inert outside the polish edition',()=>{
 const J=require('../src/play-juice.js');
 assert.equal(J.enabled,false);assert.equal(J.limits.particles,40);assert.equal(J.activeParticles(),0);
});
