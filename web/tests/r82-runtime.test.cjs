const test=require('node:test'),assert=require('node:assert/strict');
require('../src/state-clone.js');require('../src/native-kernels.js');const N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js'),R=require('../src/presentation-runtime.js'),M=require('../src/mobile-presentation.js');
const newRun=n=>{const r=new N.RestorationRun({slot:C.getSlot(n),period:'noon'});r.start();return r};
test('display projector matches canonical native coordinates and sentinel decisions',()=>{
 for(const number of [2,3,8,15,32,60,90,99]){const r=newRun(number);if(!r.supported)continue;const K=r.kernels,pool=r.nativeFrame.game.pool;
 for(let side=0;side<4;side++)for(const col of [0,Math.floor(pool.objects[side].geometry.activeLength/2),pool.objects[side].geometry.activeLength-1]){
  const a=K.Assembly.projectSurfacePoint(pool,side,col),b=R.projectSurfacePoint(pool,side,col,K.Assembly.rotatePoint);assert.deepEqual({x:b.x,y:b.y,sentinelValue:b.sentinelValue},{x:a.x,y:a.y,sentinelValue:a.sentinelValue});
 }}
});
test('all 74 physical slots: output-command pruning preserves full native state, RNG, traces, effects and results through inputs',()=>{
 let count=0;for(const slot of C.slots){if(!N.slotMetadata(slot.number).supported)continue;count++;const baseline=newRun(slot.number),fast=newRun(slot.number);
 for(let i=0;i<64;i++){
  if(i===31){baseline.inputDown();fast.inputDown()}if(i===32){baseline.inputUp();fast.inputUp()}
  baseline.tick(.095);R.advance(fast,.095);
  assert.deepEqual(fast.nativeFrame,baseline.nativeFrame,'slot '+slot.number+' step '+i);
  assert.deepEqual(fast.lastTrace,baseline.lastTrace);assert.deepEqual(fast.result,baseline.result);assert.deepEqual(fast.drainEvents(),baseline.drainEvents());
  assert.deepEqual(fast.lastResult?.effects,baseline.lastResult?.effects);
 }
 }assert.equal(count,74);
});
test('geometry is cached per native snapshot; display interpolation never writes actor or collision geometry',()=>{
 const r=newRun(2),saved=structuredClone(r.nativeFrame),canonical=r.geometry(),first=R.geometry(r,{});const plain=g=>{const {nativeSurfaces,...rest}=g;const {strideDistance,renderAngle,poseFraction,direction,groundContact,turning,turnProgress,...player}=rest.player;return {...rest,player:{...player,x:player.x-player.tangent.x*8,y:player.y-player.tangent.y*8,baseX:player.baseX-player.tangent.x*8,baseY:player.baseY-player.tangent.y*8}}};assert.deepEqual(plain(first),canonical);assert.equal(R.geometry(r,{}),first);assert.deepEqual(r.nativeFrame,saved);
 R.advance(r,.095);const snap=structuredClone(r.nativeFrame);r.remainder=47.5;const mid=R.geometry(r,{});assert.deepEqual(r.nativeFrame,snap);assert.ok(Number.isFinite(mid.player.x));
 r.pause();const paused=R.geometry(r,{});assert.deepEqual(plain(paused).player,r.geometry().player);r.retry();assert.deepEqual(plain(R.geometry(r,{})),r.geometry());
});
test('rigid knees and ankles retain segment lengths through the whole run and jump cycle',()=>{
 for(let i=0;i<180;i++)for(const q of [{},{height:10,jumpProgress:i/180,kick:.5},{climbing:true},{pose:'open-arms'}]){
  const pose=M.gait(i/120,q);for(const [a,k,b]of pose.legs){assert.ok(Math.abs(Math.hypot(k[0]-a[0],k[1]-a[1])-11)<1e-7);assert.ok(Math.abs(Math.hypot(k[0]-b[0],k[1]-b[1])-11)<1e-7);assert.ok(b[1]<=.001)}
 }
});
test('mobile render density stays within a 1.2 megapixel budget for DPR 1 through 4',()=>{
 for(const [w,h]of [[390,844],[844,390],[800,1280]])for(const d of [1,2,3,4]){const ratio=R.pixelRatio(w,h,d);assert.ok(ratio<=1.5);assert.ok(w*h*ratio*ratio<=1200000.01)}
});
const Lifecycle=require('../src/restoration-audio-lifecycle.js'),Policy=require('../src/restoration-audio-policy.js'),SFX=require('../src/game-sfx.js');
test('chapter scoring selects all ten dedicated recordings and keeps boss/story roles separate',()=>{
 const fs=require('node:fs'),manifest=JSON.parse(fs.readFileSync(require.resolve('../assets/music/manifest.json'),'utf8')),tracks=Object.fromEntries(manifest.tracks.map(t=>[t.id,{...t,src:t.file}])),p=Policy.createPolicy({tracks});
 const controller=Lifecycle.createController({chapterScores:true,rng:()=>{throw Error('authored chapters must not draw RNG')}});
 for(let i=0;i<10;i++){const run={familyIndex:i,state:'play',attempt:1,mapChanges:0};let r=controller.update({enabled:true,run});assert.equal(r.role,'stage'+String(i+1).padStart(2,'0'));assert.equal(p.update(r.musicContext).trackId,'chapter-'+String(i+1).padStart(2,'0'));const key=r.key;run.mapChanges++;r=controller.update({enabled:true,run});assert.ok(r.key>key);assert.equal(r.preserveTrackOnEntry,true);run.boss={};assert.equal(controller.update({enabled:true,run}).role,'boss')}
 const coverage=Policy.coverageFor(tracks);assert.equal(coverage.availableStageRecordingCount,10);assert.equal(coverage.originalAudioRestored,false);assert.equal(p.update({screen:'title'}).trackId,'night-corners');
});
test('tactile effects are cached, distinct, finite, silent at the ends and within the eight-voice mix budget',()=>{
 const c={sampleRate:32000,createBuffer(ch,n,sr){const data=new Float32Array(n);return{getChannelData:()=>data}}},hashes=new Set();
 for(const kind of Object.keys(SFX.configs)){const b=SFX.buffer(c,kind);assert.equal(SFX.buffer(c,kind),b);const pcm=b.getChannelData(0);assert.equal(pcm[0],0);assert.equal(pcm.at(-1),0);let peak=0;for(const x of pcm){assert.ok(Number.isFinite(x));peak=Math.max(peak,Math.abs(x))}assert.ok(peak>0&&peak<.055);if(['jump','land','hit','kick'].includes(kind))hashes.add(require('node:crypto').createHash('sha256').update(Buffer.from(pcm.buffer)).digest('hex'))}
 assert.equal(hashes.size,4);assert.equal(SFX.buffer(c,'unknown'),null);
});
test('native landing and corner effects follow state changes once; retries never replay stale sounds',()=>{
 const run={nativeRuntime:true,state:'play',attempt:1,updates:0,nativeFrame:{game:{actor:{actorState:3},pool:{currentIndex:0}}}};
 assert.deepEqual(SFX.observe(run),[]);run.updates++;run.nativeFrame.game.actor.actorState=0;assert.deepEqual(SFX.observe(run),['land']);assert.deepEqual(SFX.observe(run),[]);run.updates++;run.nativeFrame.game.pool.currentIndex=1;assert.deepEqual(SFX.observe(run),['square-corner']);run.attempt++;run.updates=0;run.nativeFrame.game.pool.currentIndex=0;assert.deepEqual(SFX.observe(run),[]);
});
