const test=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_STAGE_HUD=true;
require('../src/state-clone.js');require('../src/native-stability.js');require('../src/native-kernels.js');
const C=require('../src/restoration-catalog.js'),N=require('../src/native-restoration-run.js');
require('../src/mobile-presentation.js');
const Scene=require('../src/native-scene.js'),P=require('../src/presentation-runtime.js');
function play(slot,ticks,cadence){
 const run=new N.RestorationRun({slot:C.getSlot(slot),period:'noon',settings:{speed:'fast'}});
 assert.equal(run.start(),true);
 for(let i=0;i<ticks&&run.state==='play';i++){
  if(i%cadence===0)run.action();
  run.tick(.075);
 }
 return run;
}
test('closed native corners omit only the terminal overhangs at actual rotated joins',()=>{
 const run=play(4,301,4),frame=structuredClone(run.nativeFrame);
 assert.equal(frame.game.stage.behaviorCode,0);
 assert.equal(run.mapChanges,1);
 const geo=P.geometry(run,{}),scene=geo.nativeScene;
 const omitted=scene.groups.flatMap(layer=>[...layer.overhangs||[]]);
 assert.deepEqual(omitted.map(c=>c.orientation),[0,1,2,3]);
 const borders=omitted.map(c=>Scene.tileBounds(c,scene)).map(t=>[Math.round(t.x),Math.round(t.y)]);
 assert.deepEqual(borders,[[376,360],[360,-8],[-8,8],[8,376]]);
 const rectangles=[],clips=[],ctx=new Proxy({globalAlpha:1,fillRect(...rect){rectangles.push(rect)},rect(...rect){clips.push(rect)}},{
  get(o,k){return k in o?o[k]:()=>{}},set(o,k,v){o[k]=v;return true}
 });
 Scene.draw(ctx,run,{viewport:{width:390,height:744}},geo);
 assert.ok(clips.some(r=>r.every((v,i)=>v===[0,0,384,384][i])));
 for(const cell of omitted){
  const q=Scene.tileBounds(cell,scene);
  assert.equal(rectangles.some(([x,y,w])=>x===q.x+.35&&y===q.y+.35&&w===15.3),false);
 }
 assert.deepEqual(run.nativeFrame,frame);
});
test('mask geometry, live entities and unjoined opposing waves remain visible',()=>{
 for(const run of [play(4,50,4),play(4,316,12),play(4,631,4)]){
  const scene=Scene.snapshot(run),cells=scene.groups.flatMap(g=>g.cells);
  const overhangs=new Set(scene.groups.flatMap(g=>[...g.overhangs||[]]));
  assert.ok(cells.some(c=>c.raw.startsWith('0x4c')));
  const protectedCells=cells.filter(c=>c.raw.startsWith('0x4c')||['0x4d7f2','0x5113a'].includes(c.raw));
  assert.ok(protectedCells.length>10);
  assert.ok(protectedCells.every(c=>!overhangs.has(c)));
 }
});
