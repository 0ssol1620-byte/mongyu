const test=require('node:test'),assert=require('node:assert/strict');
const Clone=require('../src/state-clone.js'),Stability=require('../src/native-stability.js');require('../src/native-kernels.js');
const N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js'),P=require('../src/presentation-runtime.js'),M=require('../src/mobile-presentation.js'),Scene=require('../src/native-scene.js');
const newRun=(n,options={})=>{const r=new N.RestorationRun({slot:C.getSlot(n),period:'noon',settings:{speed:'fast'},...options});r.start();return r};
function recorder(){const calls=[];return new Proxy({calls,globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...a)=>{for(const n of a)if(typeof n==='number')assert.ok(Number.isFinite(n),k+' non-finite');calls.push([k,...a])},set:(o,k,v)=>(o[k]=v,true)})}
function draw(r,options={}){const c=recorder(),g=P.geometry(r,options),before=structuredClone(r.nativeFrame),out=Scene.draw(c,r,{viewport:{width:390,height:844},presentationTime:4,...options},g);assert.deepEqual(r.nativeFrame,before);assert.equal(c.calls.filter(x=>x[0]==='save').length,c.calls.filter(x=>x[0]==='restore').length);return{c,out,g}}
function fixture(name){const data=require('./r86-'+name+'-fixture.json'),frame=data.checkpoint.frame;return newRun(frame.r.slot+1,{nativeFrame:frame,frameProvenance:data.provenance})}

test('dense copier preserves aliases, cycles and one getter read, including arrays with null prototypes',()=>{
 const a=[1,2],shared={a};a.push(shared,a);let reads=0;const numbers=[0,1];Object.defineProperty(numbers,0,{enumerable:true,get(){reads++;return 9}});
 const b=Clone.clone({a,shared,numbers});assert.equal(b.a[2],b.shared);assert.equal(b.a[3],b.a);assert.equal(b.shared.a,b.a);assert.equal(b.numbers[0],9);assert.equal(reads,1);
 const plain=[1,2];Object.setPrototypeOf(plain,null);assert.deepEqual(Clone.clone(plain),[1,2]);assert.throws(()=>Clone.clone([Symbol('x')]),{name:'DataCloneError'});
});

test('running gait continues through native camera translations while world screen position stays fixed',()=>{
 const r=newRun(2);let previous=null,checked=0;
 for(let i=0;i<100;i++){if(i%7===0)r.action();P.advance(r,.075);const g=P.geometry(r,{reduced:true}),cur=r.nativeFrame.game.pool.objects[r.nativeFrame.game.pool.currentIndex],now={x:g.player.x,y:g.player.y,face:g.player.face,local:cur.position,travel:g.player.strideDistance};
  if(previous&&now.face===previous.face&&now.local-previous.local===8&&now.x===previous.x&&now.y===previous.y){assert.equal(now.travel-previous.travel,8);checked++}previous=now;
 }assert.ok(checked>=10,'exercise actual following, not only the countdown');
});

test('scoped capture sharing keeps old frames unchanged and exported checkpoints independently mutable',()=>{
 const r=newRun(3),old=r.nativeFrame,before=structuredClone(old);P.advance(r,.075);assert.deepEqual(old,before);
 const live=r.nativeFrame.map.capture.oldX;assert.equal(Object.isFrozen(live),true);
 const exported=r.exportNativeCheckpoint().frame.map.capture.oldX;assert.notEqual(exported,live);assert.equal(Object.isFrozen(exported),false);const value=live[0];exported[0]=12345;assert.equal(live[0],value);
 // A real recorded morph exercises buffers produced by a writer phase.
 const m=fixture('morph');for(let i=0;i<16&&m.state==='play';i++)P.advance(m,.075);assert.equal(m.supported,true);assert.ok(Clone.inspect().sharedCaptureArrays>0);
});

test('rendering preserves native positions with an explicit eight-unit mask foot offset and independent facing',()=>{
 let count=0;for(const slot of C.slots){
  if(!N.slotMetadata(slot.number).supported)continue;const r=newRun(slot.number);for(let i=0;i<34;i++)P.advance(r,.075);
  const before=structuredClone(r.nativeFrame),actual=Scene.geometry(r).player,canonical=r.geometry().player,sign=r.nativeFrame.game.pool.direction===0?1:-1;
  const offset=r.nativeFrame.game.stage.behaviorCode===3?8:0,normal={x:canonical.inward.x*sign,y:canonical.inward.y*sign};
  if(r.nativeFrame.game.controller.modeP>0){
   const command=r.nativeFrame.map.drawCommands.find(c=>c.role==='current-actor'),angle=-command.variantOrientation*Math.PI/2,origin=r.nativeFrame.presentation.viewport;
   assert.equal(actual.x,(command.x-origin.x)*1.6+8*Math.sin(angle));assert.equal(actual.y,(command.y-origin.y)*1.6-8*Math.cos(angle));assert.equal(actual.nativeFrame,command.frame);
  }else assert.deepEqual(actual,{...canonical,x:canonical.x-normal.x*offset+canonical.tangent.x*(offset?0:8),y:canonical.y-normal.y*offset+canonical.tangent.y*(offset?0:8),baseX:canonical.x-normal.x*offset+canonical.tangent.x*(offset?0:8),baseY:canonical.y-normal.y*offset+canonical.tangent.y*(offset?0:8),inward:normal,direction:r.nativeFrame.game.pool.direction},'slot '+slot.number);
  assert.deepEqual(r.nativeFrame,before);count++;
 }assert.equal(count,74);
});

test('all ten boss outlines consume their real native draw cells without model or random writes',()=>{
 const random=Math.random;Math.random=()=>{throw Error('render consumed randomness')};try{
 for(const n of [8,20,31,38,45,58,66,77,90,99]){const r=newRun(n);for(let i=0;i<38;i++)P.advance(r,.075);const source=r.nativeFrame.map.drawCommands.filter(c=>c.role==='terrain-cell'||c.role==='cell-decoration'),{out}=draw(r);assert.equal(out.nativeCells,source.length);assert.ok(source.some(c=>c.raw==='0x5595a'),'boss cells missing at '+n);assert.equal(out.camera.zoom,1)}
 }finally{Math.random=random}
});

test('native partition clips and actor visibility survive presentation for every recovered split mode',()=>{
 const data=require('./r86-partition-fixtures.json');assert.deepEqual(data.fixtures.map(f=>f.mode).sort((a,b)=>a-b),[3,4,17,20]);
 for(const f of data.fixtures){const r=newRun(3,{nativeFrame:f.checkpoint.frame,frameProvenance:f.provenance}),{out,c,g}=draw(r);assert.equal(out.nativeLayout,'partitioned');assert.ok(g.nativeScene.groups.length>=2);assert.ok(c.calls.some(x=>x[0]==='clip'));assert.equal(out.nativeCells,g.nativeScene.groups.reduce((n,g)=>n+g.cells.length,0))}
});

test('map morph uses actual capture endpoints, animates between engine ticks and freezes its displayed pose on pause',()=>{
 const r=fixture('morph');r.remainder=10;const first=draw(r),a=first.c.calls.filter(x=>x[0]==='fillRect');r.remainder=60;const second=draw(r),b=second.c.calls.filter(x=>x[0]==='fillRect');assert.equal(first.out.nativePhase,'morph');assert.ok(first.g.nativeScene.transition.count>0);assert.notDeepEqual(a,b);
 r.pause();const paused=draw(r);assert.deepEqual(paused.c.calls.filter(x=>x[0]==='fillRect'),b);const reduced=draw(r,{reduced:true});assert.equal(reduced.out.nativePhase,'morph');
});

test('native parry particles are visible and respect reduced motion instead of triggering invented zoom',()=>{
 const r=fixture('parry'),source=Scene.snapshot(r).groups.reduce((n,g)=>n+g.effects.length,0);assert.ok(source>0);const normal=draw(r),reduced=draw(r,{reduced:true});assert.equal(normal.out.zoom,1);assert.ok(normal.c.calls.length>reduced.c.calls.length);
});

test('formerly cyclic spawn row resumes with a valid live entity and no fabricated score, item or clear',()=>{
 const K=MongyuNativeKernels,kernels={...K,MapProviders:{...K.MapProviders,createProviders:options=>{const p=K.MapProviders.createProviders(options);return{...p,stageRecord:()=>p.stageRecord(36*9)}}}};
 const binding=globalThis.MongyuNativeStability;let blocked;try{delete globalThis.MongyuNativeStability;blocked=newRun(3,{kernels});assert.equal(blocked.supported,false);assert.match(blocked.reason,/posthook-x nonterminating cycle/)}finally{globalThis.MongyuNativeStability=binding}
 const before=Stability.inspect().repairs,r=newRun(3,{kernels});assert.equal(r.supported,true);assert.ok(Stability.inspect().repairs>before);assert.equal(r.score,0);assert.equal(r.hearts,3);assert.equal(r.result,null);assert.ok(r.nativeFrame.entities.some(e=>e&&e.a));for(let i=0;i<66&&r.state==='play';i++){if(i%6===0)r.action();P.advance(r,.075)}assert.equal(r.supported,true);
});
