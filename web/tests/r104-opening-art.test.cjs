const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/restoration-catalog.js');
const O=require('../src/opening-run.js');
const slot=C.getSlot(2),dt=1/120;
function polish(fn){const b=globalThis.MONGYU_POLISH_EDITION;globalThis.MONGYU_POLISH_EDITION=true;try{return fn()}finally{if(b===undefined)delete globalThis.MONGYU_POLISH_EDITION;else globalThis.MONGYU_POLISH_EDITION=b}}
function play(run,skip=-1,lead=39){
 let tapped=-1;run.start();
 for(let n=0;n<8000&&run.state==='play';n++){
  const o=O.OBSTACLES[run.index],held=run.slowChance==='active'&&run.distance>=O.OBSTACLES[0].at-20-1e-6;
  if(o&&run.index!==skip&&tapped!==run.index&&(o.at-run.distance<=lead||held)){run.inputDown();run.inputUp();tapped=run.index}
  run.tick(dt);run.drainEvents();
 }
 return run;
}
test('crash sets the hurt pose; clear sets the joy pose',()=>polish(()=>{
 const crash=play(new O.OpeningRun({slot,attempt:2}),2);
 assert.equal(crash.state,'fail');assert.equal(crash.pose,'hurt');assert.ok(Number.isFinite(crash.poseAt));
 const clear=play(new O.OpeningRun({slot,attempt:2}));
 assert.equal(clear.state,'clear');assert.equal(clear.pose,'joy');
}));
test('retryFromCheckpoint restarts at the crashed section start with its score, through the host',()=>polish(()=>{
 const g=globalThis.MongyuPolish,started=[];
 globalThis.MongyuPolish={host:{startRun:(r)=>started.push(r)}};
 try{
  const crash=play(new O.OpeningRun({slot,attempt:2}),3);
  assert.equal(crash.state,'fail');assert.equal(crash.crash.section,1);
  assert.equal(crash.retryFromCheckpoint(),true);assert.equal(started.length,1);
  const next=started[0];
  assert.equal(next.distance,O.SECTIONS[1].start);assert.equal(next.index,2);assert.equal(next.attempt,3);
  assert.equal(next.score,next.points+Math.floor(next.distance));assert.ok(next.points>=200);
  const done=play(next);assert.equal(done.state,'clear');assert.equal(done.result.completed,true);
 }finally{if(g===undefined)delete globalThis.MongyuPolish;else globalThis.MongyuPolish=g}
 const plain=new O.OpeningRun({slot,attempt:2});assert.equal(plain.retryFromCheckpoint(),false);
}));
test('R103 runs expose no polish pose and refuse checkpoint retry',()=>{
 const run=play(new O.OpeningRun({slot,attempt:2}),2);
 assert.equal(run.pose,undefined);assert.equal(run.retryFromCheckpoint(),false);
});
