// R104 world art: chapter night palettes, cached sky layers, architectural native cells,
// immutable collision geometry and the MongyuSquareArt.actorScreen contract.
const test=require('node:test'),assert=require('node:assert/strict');
let surfaces=0;
class FakeSurface{constructor(w,h){surfaces++;this.width=w;this.height=h}getContext(){return recorder()}}
globalThis.OffscreenCanvas=FakeSurface;
require('../src/state-clone.js');require('../src/native-stability.js');require('../src/native-kernels.js');
const N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js'),P=require('../src/presentation-runtime.js');
require('../src/mobile-presentation.js');
const Palette=require('../src/native-palette.js'),Stage=require('../src/scene-stagecraft.js'),Scene=require('../src/native-scene.js'),Art=require('../src/square-art.js');
const viewport={width:390,height:844,dpr:1.5};
function recorder(){const calls=[];return new Proxy({calls,globalAlpha:1,globalCompositeOperation:'source-over'},{get:(o,k)=>k in o?o[k]:k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):(...a)=>{for(const n of a)if(typeof n==='number')assert.ok(Number.isFinite(n),String(k)+' non-finite');calls.push([k,...a])},set:(o,k,v)=>{if(k!=='calls')o.calls.push(['set',k,v]);o[k]=v;return true}})}
const newRun=(n,options={})=>{const r=new N.RestorationRun({slot:C.getSlot(n),period:'noon',settings:{speed:'fast'},...options});r.start();return r};
function advance(r,steps){for(let i=0;i<steps;i++){if(i%9===0)r.action();P.advance(r,.075)}return r}
function draw(r,options={}){const c=recorder(),g=P.geometry(r,options),before=structuredClone(r.nativeFrame),out=Scene.draw(c,r,{viewport,presentationTime:4,...options},g);
 assert.deepEqual(r.nativeFrame,before,'art never writes engine state');assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);return {c,out,g}}
function withPolish(on,fn){const prev=globalThis.MONGYU_POLISH_EDITION;globalThis.MONGYU_POLISH_EDITION=on;try{return fn()}finally{globalThis.MONGYU_POLISH_EDITION=prev}}
const hsl=h=>{const [r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255),max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,d=max-min;return {l,s:d===0?0:d/(1-Math.abs(2*l-1))}};

test('ten chapter night palettes: dark low-saturation skies, three-tone blocks, fixed meaning colours',()=>{
 assert.equal(Palette.chapters.length,10);
 for(const p of Palette.chapters){
  for(const h of [...p.sky,p.glow,p.fog,p.far,p.near,p.block.top,p.block.side,p.block.shadow,p.lamp])assert.match(h,/^#[0-9a-f]{6}$/);
  for(const h of p.sky){const c=hsl(h);assert.ok(c.l<.32,p.name+' sky stays dark');assert.ok(c.s<.5,p.name+' sky stays muted')}
  assert.ok(hsl(p.block.top).l>hsl(p.block.side).l&&hsl(p.block.side).l>hsl(p.block.shadow).l,p.name+' lit > side > shadow');
 }
 assert.equal(Palette.chapter(12),Palette.chapters[2]);assert.equal(Palette.chapter(-1),Palette.chapters[9]);assert.equal(Palette.chapter(NaN),Palette.chapters[0]);
 assert.equal(Palette.MEANING.gold,'#ffd98a');assert.equal(Palette.MEANING.coral,'#ff8a73');assert.deepEqual([...Palette.MEANING.aurora],['#7ff3e1','#8ab8ff','#b78cff','#ff9ed8']);
 assert.equal(Palette.get(3).colors.length,16,'R87 numeric swatches remain intact');
});

test('polish memories replace the native chequer with a cached chapter sky and lit blocks on exact cells',()=>withPolish(true,()=>{
 const r=advance(newRun(3),60),{c,out,g}=draw(r);
 assert.ok(out.polish&&out.polish.blocks>20,'blocks drawn through the polish path');
 assert.ok(c.calls.some(x=>x[0]==='drawImage'),'sky layers are composited images');
 assert.ok(!c.calls.some(x=>x[0]==='set'&&x[1]==='imageSmoothingEnabled'&&x[2]===false),'no pixel-scaled chequer mosaic');
 const blocks=g.nativeScene.groups.flatMap(x=>x.cells).filter(x=>x.role==='terrain-cell'&&!['0x4c91e','0x4c88a','0x4caac','0x5595a'].includes(x.raw));
 const faces=new Set(c.calls.filter(x=>x[0]==='rect'&&x[3]===16.3&&x[4]===16.3).map(x=>(x[1]+.15).toFixed(2)+','+(x[2]+.15).toFixed(2)));
 for(const cell of blocks){const b=Scene.tileBounds(cell,g.nativeScene);assert.ok(faces.has(b.x.toFixed(2)+','+b.y.toFixed(2)),'top face sits on the collision square')}
 assert.equal(out.nativeCells,g.nativeScene.groups.reduce((n,x)=>n+x.cells.length,0));
}));

test('sky, fog and glow layers are built once and reused across frames',()=>withPolish(true,()=>{
 const r=advance(newRun(3),40);draw(r);const after=surfaces;
 for(let i=0;i<30;i++){advance(r,1);draw(r,{presentationTime:4+i/60})}
 assert.equal(surfaces,after,'no per-frame surfaces or gradient rebuilds');
 const sky=Stage.sky(recorder(),viewport,0,null,1,false);assert.equal(sky.cached,true);assert.equal(sky.builds,1);
 const other=Stage.sky(recorder(),{...viewport,width:400},0,null,1,false);assert.equal(other.builds,2,'a new viewport rebuilds once');
 const p=Stage.sky(recorder(),viewport,0,{scale:1,offsetX:-5000,offsetY:5000},0,true);assert.ok(Math.abs(p.parallax.x)<=64&&Math.abs(p.parallax.y)<=64,'parallax is bounded');
 const near=Stage.sky(recorder(),viewport,0,{scale:1,offsetX:viewport.width/2-192+100,offsetY:viewport.height/2-192},0,true);assert.ok(Math.abs(near.parallax.x-100*Stage.PARALLAX)<1e-9,'far layer moves at 0.2x camera travel');
}));

test('boss plates, coral crystals and gold shards draw in polish; reduced motion is frame-stable',()=>withPolish(true,()=>{
 const boss=advance(newRun(8),30);const b=draw(boss);assert.ok(b.out.polish.boss>0,'boss cells become ornament plates');
 const data=require('./r86-partition-fixtures.json');for(const f of data.fixtures){const r=newRun(3,{nativeFrame:f.checkpoint.frame,frameProvenance:f.provenance}),{out,c}=draw(r);assert.equal(out.nativeLayout,'partitioned');assert.ok(c.calls.some(x=>x[0]==='clip'));assert.ok(out.polish.blocks+out.polish.crystals+out.polish.shards>0)}
 let shards=0;const r=newRun(3);for(let i=0;i<200&&!shards;i++){advance(r,3);shards=draw(r).out.polish.shards}assert.ok(shards>0,'kickable light shards appear');
 const a=draw(r,{reduced:true,presentationTime:2}).c.calls,z=draw(r,{reduced:true,presentationTime:9}).c.calls;assert.deepEqual(a,z,'reduced motion freezes art motion');
}));

test('actorScreen reports the drawn body centre in CSS pixels and expires without native frames',()=>withPolish(true,()=>{
 let now=1000;const clock=globalThis.performance.now;globalThis.performance.now=()=>now;
 try{
  const r=advance(newRun(3),50),c=recorder(),g=P.geometry(r,{}),out=Art.draw(c,r,{viewport,presentationTime:4},g),a=Art.actorScreen;
  assert.ok(a&&Number.isFinite(a.x)&&Number.isFinite(a.y));assert.deepEqual({x:a.x,y:a.y},{x:out.actor.x,y:out.actor.y});
  assert.ok(Math.abs(a.x-out.camera.target.x*out.camera.scale-out.camera.offsetX)<1e-6&&Math.abs(a.y-out.camera.target.y*out.camera.scale-out.camera.offsetY)<1e-6,'body centre the follow camera tracks');
  now+=200;assert.ok(Art.actorScreen,'still live within one interrupted frame');now+=100;assert.equal(Art.actorScreen,null,'stale after 250 ms');
  Art.draw(c,r,{viewport,presentationTime:4},g);assert.ok(Art.actorScreen);Art.markActor(null);assert.equal(Art.actorScreen,null);
 }finally{globalThis.performance.now=clock}
}));

test('R103 path is unchanged when the polish flag is off',()=>withPolish(false,()=>{
 const r=advance(newRun(3),60),{c,out}=draw(r);assert.equal(out.polish,null);
 assert.ok(c.calls.some(x=>x[0]==='fillRect'&&x[3]===15.3&&x[4]===15.3),'native swatch tiles');
 assert.ok(!c.calls.some(x=>x[0]==='rect'&&x[3]===16.3),'no polish block faces');
}));
