// R105 ACC: the effects level changes presentation only. Same seed + same inputs => identical judgement, score and events at every level,
// and no simulation code reads MongyuEffects.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
const SRC=path.resolve(__dirname,'..','src');
const hostSettings={reduced:false};
globalThis.MongyuPolish={host:{settings:()=>hostSettings}};
for(const f of ['trip-palettes','items','endless-dream','chapters','effects-profile'])require('../src/'+f+'.js');
const Square=require('../src/square-act.js'),Course=require('../src/course-run.js'),E=globalThis.MongyuEffects;
const VP={width:390,height:844},DT=1/120;
const chain=(o={})=>({index:1,count:3,first:false,last:false,carry:{points:500,shards:3,perfectStreak:2,hearts:1},bpm:100,seed:77,...o});
const MK={
 square:()=>Square.ACTS.square({viewport:VP,settings:{},sides:6,chain:chain()}),
 flip:()=>Square.ACTS.flip({viewport:VP,settings:{},beats:24,chain:chain()}),
 mirror:()=>Square.ACTS.mirror({viewport:VP,settings:{},beats:30,chain:chain()}),
 wait:()=>Square.ACTS.wait({viewport:VP,settings:{},waits:1,chain:chain({bpm:76})})
};
function play(run,{mode='collect',lazy=false,max=120*150}={}){
 const cr={action:()=>run.action()},seen=[];run.start();let n=0;
 while(run.state==='play'&&n++<max){if(!lazy)run.pilot(cr,mode);run.tick(DT);for(const e of run.drainEvents())seen.push(e)}
 const r=run.result||{};
 return {state:run.state,seen,r:{points:r.points,score:r.score,shards:r.shards,shardTotal:r.shardTotal,perfectStreak:r.perfectStreak,reason:r.reason,state:r.state},distance:Math.round(run.distance*1000)/1000,hearts:run.hearts};
}
const LEVELS=['standard','reduced','minimal'];
const withLevel=(lv,fn)=>{E.set(lv);try{return fn()}finally{E.set('standard')}};

for(const type of Object.keys(MK)){
 test(type+': a cleared run is identical at Standard, Reduced and Minimal (same seed, same inputs)',()=>{
  const out=LEVELS.map(lv=>withLevel(lv,()=>{assert.equal(hostSettings.reduced,lv!=='standard');return play(MK[type]())}));
  assert.equal(out[0].state,'clear',JSON.stringify(out[0].r));
  for(const o of out.slice(1))assert.deepEqual(o,out[0],type+' differs between levels');
 });
 test(type+': a failed run (no input) fails identically at every level',()=>{
  const out=LEVELS.map(lv=>withLevel(lv,()=>play(MK[type](),{lazy:true})));
  assert.equal(out[0].state,'fail');
  for(const o of out.slice(1)){assert.equal(o.state,'fail');assert.deepEqual(o.r,out[0].r);assert.deepEqual(o.seen.filter(e=>e!=='portal'),out[0].seen.filter(e=>e!=='portal'))}
 });
}

test('per-channel overrides do not change gameplay either (everything off vs everything on)',()=>{
 const a=withLevel('standard',()=>play(MK.flip()));
 E.set('standard');for(const c of E.CHANNELS)E.set(c,0);
 const b=play(MK.flip());E.set('standard');
 assert.deepEqual(b,a);
});

test('a chain of the four new acts through the aurora gates ends with the same score at every level',()=>{
 const c25={...Course.courseById('c25')};   // c25 is the B05 boss now: build the chain from the first act of each type found in the other courses
 const acts=['square','flip','mirror','wait'].map(t=>Course.allCourses().filter(c=>!c.boss).flatMap(c=>c.acts).find(a=>a.type===t));
 assert.equal(acts.length,4);
 const res=LEVELS.map(lv=>withLevel(lv,()=>{
  const run=new Course.CourseRun({...c25,acts,viewport:VP,settings:{},attempt:1});run.start();let n=0;const seen=[];
  while(run.state==='play'&&n++<120*600){const ch=run.child;if(ch&&!run.portal&&typeof ch.pilot==='function')ch.pilot({action:()=>run.action()},'collect');run.tick(DT);for(const e of run.drainEvents())seen.push(e)}
  return {state:run.state,score:run.score,shards:run.result?.shards,events:seen.filter(e=>e!=='portal').join(',')};
 }));
 assert.equal(res[0].state,'clear',JSON.stringify(res[0]));
 assert.deepEqual(res[1],res[0]);assert.deepEqual(res[2],res[0]);
});

/* ---- source level: nothing that decides gameplay reads the effects profile ---- */
const read=f=>fs.readFileSync(path.join(SRC,f),'utf8');
test('no simulation module references MongyuEffects',()=>{
 const sim=['engine.js','content.js','progression.js','origin-records.js','square-world.js','state-clone.js','native-stability.js','native-kernels.js','native-restoration-run.js','restoration-world.js','restoration-catalog.js','restoration-mastery.js','observed-encounter.js','map-direction.js','road-mode.js','items.js','chapters.js','dream-score.js','square-score.js','commerce.js'];
 for(const f of sim)if(fs.existsSync(path.join(SRC,f)))assert.ok(!/MongyuEffects|fxv\(/.test(read(f)),f+' must not read the effects profile');
});
test('act files read the effects profile only inside drawing code (canvas functions and the camera maths)',()=>{
 for(const f of ['square-act.js','helix-act.js','penrose-act.js','illusion-course.js','endless-dream.js','opening-run.js']){
  const lines=read(f).split(/\r?\n/);
  lines.forEach((l,i)=>{
   if(!/fxv\(|MongyuEffects/.test(l)||/^const fxv=/.test(l))return;
   let j=i;while(j>0&&!/^ ?function [\w$]+\(/.test(lines[j]))j--;
   const sig=lines[j];
   assert.ok(/function (draw\w*|camParams|updateCam)\(/.test(sig)&&(/\(c,/.test(sig)||/camParams|updateCam/.test(sig)),f+':'+(i+1)+' reads effects outside drawing code ('+sig.slice(0,60)+')');
  });
 }
});
test('course-run reads the profile only in the gate and HUD drawing functions',()=>{
 const src=read('course-run.js'),i0=src.indexOf('function gate('),i1=src.indexOf('function draw(c,run,opts)');
 assert.ok(i0>0&&i1>i0);
 const outside=src.slice(0,i0)+src.slice(i1);
 const hits=outside.split('\n').filter(l=>/fxv\(|textK\(|MongyuEffects/.test(l)&&!/^const (fxv|textK)=/.test(l));
 assert.deepEqual(hits,[]);
});
test('every drawing consumer of the profile is inert when the profile is missing',()=>{
 for(const f of ['psy-layer.js','play-juice.js','square-act.js','helix-act.js','course-run.js'])assert.ok(/root\.MongyuEffects;return E&&E\.enabled\?E\./.test(read(f)),f);
 assert.ok(/E&&E\.enabled\?E\.value\('gate'\)/.test(read('ui-kit.js')));
});
