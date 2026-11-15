const test=require('node:test'),assert=require('node:assert/strict');
require('../src/state-clone.js');require('../src/native-stability.js');require('../src/native-kernels.js');
const N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js'),P=require('../src/presentation-runtime.js');
const Audio=require('../src/restoration-audio-lifecycle.js'),SFX=require('../src/game-sfx.js');
const Palette=require('../src/native-palette.js'),M=require('../src/mobile-presentation.js'),Scene=require('../src/native-scene.js');
function start(slot){const r=new N.RestorationRun({slot:C.getSlot(slot),seed:7,period:'noon',settings:{speed:'fast'}});assert.equal(r.start(),true);return r}

test('native music waits for the countdown and follows the engine selector without another random draw',()=>{
 const r=start(3),controller=Audio.createController({chapterScores:true,rng:()=>assert.fail('extra music RNG draw')});
 assert.ok(r.nativeFrame.r.timerT>0);assert.equal(controller.update({enabled:true,run:r}),null);
 while(r.nativeFrame.r.timerT>0)P.advance(r,.075);
 const before=structuredClone(r.nativeFrame),out=controller.update({enabled:true,run:r});
 assert.equal(out.stageIndex,r.nativeFrame.u.ax);assert.equal(out.role,'stage'+String(r.nativeFrame.u.ax+1).padStart(2,'0'));
 assert.equal(controller.inspect().selection.source,'native-audio-selector');assert.deepEqual(r.nativeFrame,before);
 r.pause();assert.equal(controller.update({enabled:true,run:r}),null);r.resume();assert.equal(controller.update({enabled:true,run:r}).key,out.key);
});

test('music is suspended during native morphs and boss exits, then uses the new map selection',()=>{
 const frame={r:{timerT:0},u:{l:1,ax:7},game:{controller:{controllerStateUK:0}}};
 const run={nativeRuntime:true,nativeFrame:frame,state:'play',hearts:3,attempt:1,mapChanges:0,familyIndex:0};
 const c=Audio.createController({chapterScores:true,rng:()=>assert.fail('extra music RNG draw')});
 const first=c.update({enabled:true,run});assert.equal(first.stageIndex,7);
 frame.game.controller.controllerStateUK=200;assert.equal(c.update({enabled:true,run}),null);
 frame.game.controller.controllerStateUK=0;frame.u.ax=2;run.mapChanges++;
 const next=c.update({enabled:true,run});assert.equal(next.stageIndex,2);assert.ok(next.key>first.key);
 run.boss={};assert.equal(c.update({enabled:true,run}).role,'boss');
 for(const phase of [2,3]){frame.u.l=phase;assert.equal(c.update({enabled:true,run}),null)}
});

test('boss impact feedback occurs once for a real health decrease and never on retry or boss replacement',()=>{
 const run={nativeRuntime:true,state:'play',attempt:1,updates:0,nativeFrame:{game:{actor:{actorState:0},pool:{currentIndex:0}},boss:{J:0,K:10}}};
 assert.deepEqual(SFX.observe(run),[]);run.updates++;run.nativeFrame.boss.K=9;assert.deepEqual(SFX.observe(run),['boss-damage']);assert.deepEqual(SFX.observe(run),[]);
 run.updates++;run.nativeFrame.boss={J:1,K:5};assert.deepEqual(SFX.observe(run),[]);
 run.attempt++;run.updates=0;run.nativeFrame.boss.K=2;assert.deepEqual(SFX.observe(run),[]);
 run.updates++;run.nativeFrame.boss.K=0;assert.deepEqual(SFX.observe(run),['boss-damage']);
});

test('recorded ordinary input sequences defeat bosses and return an earned result without editing native state',()=>{
 for(const row of require('./r87-normal-boss-inputs.json').rows){
  const run=start(row.slot),actions=new Set(row.actions);let steps=0;
  while(run.state==='play'&&steps++<row.updates+4){if(actions.has(run.updates))run.action();P.advance(run,.075)}
  assert.equal(run.supported,true,'slot '+row.slot);assert.equal(run.state,'clear','slot '+row.slot);
  assert.equal(run.boss.hp,0);assert.equal(run.hearts,row.lives);assert.equal(run.result.nativeProof.earned,true);
  assert.equal(C.validateResult(run.slot.id,run.result),true);assert.equal(run.updates,row.updates);
 }
});

test('a real airborne-boss hit leaves recovery after its native timer instead of making the boss permanently invulnerable',()=>{
 const row=require('./r87-normal-boss-inputs.json').rows.find(r=>r.slot===77),run=start(77),taps=new Set(row.actions);
 while(run.state==='play'&&run.boss.hp===run.boss.maxHp&&run.updates<row.updates){if(taps.has(run.updates))run.action();P.advance(run,.075)}
 assert.ok(run.boss.hp<run.boss.maxHp);assert.equal(run.nativeFrame.boss.Y,2);assert.ok(run.nativeFrame.boss.H>0);
 let recovered=false;for(let i=0;i<12&&run.state==='play';i++){P.advance(run,.075);if(run.nativeFrame.boss.Y!==2){recovered=true;break}}
 assert.equal(recovered,true);assert.equal(run.supported,true);
});

test('all 100 numeric palettes resolve native folded background cells, including signed brightness overflow',()=>{
 assert.equal(Palette.count,100);const patterns=new Set();
 for(let n=0;n<100;n++){
  const p=Palette.get(n);assert.equal(p.colors.length,16);assert.equal(p.pattern.length,16);patterns.add(JSON.stringify(p));
  for(let cell=0;cell<32;cell++)for(const delta of [-16,0,16]){
   const role={packedPaletteOffset:112+(cell>>1),nibble:cell&1?'high':'low',brightnessDelta:delta,grayTransform:'none'};
   assert.match(Palette.color(n,role),/^#[0-9a-f]{6}$/);assert.equal(Palette.color(n,role,true),Palette.color(n,{...role,brightnessDelta:0}));
  }
 }assert.ok(patterns.size>90);
});

test('actual ordinary and boss background commands reach the renderer without changing simulation or RNG',()=>{
 for(const slot of [3,8]){
  const r=start(slot);while(r.nativeFrame.r.timerT>0)P.advance(r,.075);P.advance(r,.075);
  const before=structuredClone(r.nativeFrame),g=P.geometry(r,{}),cells=g.nativeScene.backgrounds.filter(c=>c.role==='background-cell');
  assert.equal(cells.length,slot===8?256:64);
  const fills=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>{if(k==='fillRect')fills.push({color:o.fillStyle,args})},set:(o,k,v)=>(o[k]=v,true)});
  Scene.draw(c,r,{viewport:{width:390,height:844}},g);
  for(const cell of cells)assert.ok(fills.some(f=>f.color===Palette.color(g.nativeScene.palette,cell.colorRole)));
  assert.deepEqual(r.nativeFrame,before);
 }
});
