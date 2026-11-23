const test=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;
const bus=require('../src/polish-bus.js');
const SFX=require('../src/game-sfx.js');globalThis.MongyuSFX=SFX;
const M=require('../src/adaptive-music.js');
const ids=['opening',1,2,3,4,5,6,7,8,9,10];
test('every chapter has a deterministic arrangement in a sensible tempo and key',()=>{
 assert.equal(Object.keys(M.ARRANGEMENTS).length,11);
 for(const id of ids){
  const cfg=M.arrangement(id);assert.ok(cfg.bpm>=90&&cfg.bpm<=110,id+' bpm');
  assert.equal(M.keyOf(cfg,0).scale.length,5);
  const a=JSON.stringify(M.phrase(cfg,0,0)),b=JSON.stringify(M.phrase(cfg,0,0));assert.equal(a,b);
  for(let s=0;s<3;s++)assert.ok(M.keyOf(cfg,s).name);
 }
 assert.notEqual(M.keyOf(M.arrangement('opening'),2).tonic,M.keyOf(M.arrangement('opening'),0).tonic,'ceiling shifts key');
 assert.equal(new Set(ids.map(i=>M.arrangement(i).seed)).size,11);
});
test('stems add up: 1 pad/bass/kick, 2 rhythm, 3 melody, 4 climax',()=>{
 const cfg=M.arrangement(3),stems=l=>new Set(M.barEvents(cfg,2,0,l).map(e=>e.stem));
 assert.deepEqual([...stems(1)],[1]);assert.deepEqual([...stems(2)].sort(),[1,2]);assert.deepEqual([...stems(3)].sort(),[1,2,3]);assert.deepEqual([...stems(4)].sort(),[1,2,3,4]);
 assert.equal(M.barEvents(cfg,0,0,4,{goal:true}).length,0);
 const inst=l=>new Set(M.barEvents(cfg,0,0,l).map(e=>e.inst));
 assert.ok(inst(1).has('pad')&&inst(1).has('kick')&&inst(2).has('pizz')&&inst(3).has('gayageum')&&inst(4).has('choir')&&inst(4).has('strings'));
});
test('melody notes never clash a semitone with the chord and stay in the pentatonic scale',()=>{
 for(const id of ids)for(let s=0;s<3;s++){
  const cfg=M.arrangement(id),key=M.keyOf(cfg,s);
  for(const v of [0,1])for(const e of M.phrase(cfg,s,v)){
   const rel=((e.midi-key.tonic)%12+12)%12;assert.ok(key.scale.includes(rel),`${id}/${s}/${v} bar ${e.bar} pc ${rel}`);
   assert.ok(M.safe(e.midi%12,M.chordAt(cfg,s,e.bar)),`${id}/${s}/${v} bar ${e.bar} clash`);
  }
 }
});
test('goal chord resolves on the tonic',()=>{
 const cfg=M.arrangement(2),key=M.keyOf(cfg,0),ev=M.goalEvents(cfg,0);
 assert.equal(ev[0].midi%12,key.tonic);assert.ok(ev.some(e=>e.inst==='goal-bell'));
});
test('tuned effects: tonic-aware, deterministic, normalized, silent edges, no DC',()=>{
 const t={tonic:2,third:4,scale:[0,2,4,7,9],step:0,variant:''};
 for(const kind of SFX.TUNED){
  const d=SFX.renderTuned(kind,t,48000);assert.ok(d&&d.length>1000,kind);
  let max=0,sum=0;for(const x of d){max=Math.max(max,Math.abs(x));sum+=x}
  assert.ok(max<.5&&max>.01,kind+' peak '+max);assert.equal(d[0],0);assert.equal(d[d.length-1],0);assert.ok(Math.abs(sum/d.length)<.002,kind+' dc');
  assert.deepEqual(Array.from(SFX.renderTuned(kind,t,48000).slice(0,200)),Array.from(d.slice(0,200)));
 }
 const a=SFX.renderTuned('jump',{...t,step:0}),b=SFX.renderTuned('jump',{...t,step:3});assert.notDeepEqual(Array.from(a.slice(2000,2100)),Array.from(b.slice(2000,2100)));
 assert.equal(SFX.renderTuned('jump',null),null);assert.equal(SFX.renderTuned('nope',t),null);
});
test('no audio host means no nodes and idle intensity',()=>{
 M._reset();let created=0;
 bus.attach({audio:()=>null,settings:()=>({}),activeRun:()=>({state:'play',openingCourse:true}),sound(){},refreshMusic(){}});
 M.update();assert.equal(M.intensity,0);assert.equal(M.inspect().active,false);assert.equal(created,0);
});
