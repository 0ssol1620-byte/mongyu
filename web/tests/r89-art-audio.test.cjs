const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const D=require('../src/map-direction.js'),A=require('../src/scene-stagecraft.js'),L=require('../src/restoration-audio-lifecycle.js'),Policy=require('../src/restoration-audio-policy.js'),Score=require('../src/licensed-score.js');
const manifest=JSON.parse(fs.readFileSync(require.resolve('../assets/music/manifest.json'))),tracks=Object.fromEntries(manifest.tracks.map(t=>[t.id,{...t,src:t.file}]));
function run(){return {nativeRuntime:true,state:'play',attempt:1,mapChanges:0,hearts:3,familyIndex:0,nativeFrame:{r:{timerT:0},u:{l:1},map:{ai:1,t:0},game:{stage:{behaviorCode:0},controller:{controllerStateUK:0,modeP:0},view:{},pool:{currentIndex:0,objects:[{geometry:{activeLength:24}}]}}}}}
test('map scores follow actual geometry and boss identity, without consuming game RNG',()=>{
 const r=run(),s=r.nativeFrame,g=s.game,p=g.pool.objects[0].geometry,old=Math.random;Math.random=()=>assert.fail('presentation RNG');
 try{assert.equal(D.describe(r).id,'memory');p.activeLength=48;assert.equal(D.describe(r).id,'stream');g.view={aq:1,av:1000};assert.equal(D.describe(r).id,'floating');g.view={};g.stage.behaviorCode=1;assert.equal(D.describe(r).id,'mirror');g.stage.behaviorCode=2;assert.equal(D.describe(r).id,'wave');s.u.actionLock=2;assert.equal(D.describe(r).id,'machine');s.u.actionLock=0;g.controller.modeP=1;assert.equal(D.describe(r).id,'orbit');g.controller.modeP=0;g.stage.behaviorCode=0;p.activeLength=24;r.familyIndex=9;assert.equal(D.describe(r).id,'finale');r.familyIndex=0;s.map.ai=3;assert.equal(D.describe(r).id,'garden');g.stage.behaviorCode=3;assert.ok(['maze','garden'].includes(D.describe(r).id));r.boss={};
  const ids=new Set();for(let j=0;j<10;j++){s.boss={J:j};const before=structuredClone(s),profile=D.describe(r),policy=Policy.createPolicy({tracks,rng:()=>assert.fail('explicit recording RNG')});assert.equal(policy.update(profile).trackId,profile.recordingId);ids.add(profile.recordingId);assert.deepEqual(s,before)}assert.equal(ids.size,4);
 }finally{Math.random=old}
});
test('map morphs retain the outgoing music; new maps crossfade and retries restart',()=>{
 const r=run(),c=L.createController({mapScores:true,rng:()=>assert.fail('map music RNG')}),first=c.update({enabled:true,run:r});
 r.nativeFrame.game.controller.controllerStateUK=200;assert.equal(c.update({enabled:true,run:r}).key,first.key);assert.equal(c.update({enabled:true,run:r}).morphing,true);
 r.nativeFrame.game.controller.controllerStateUK=0;r.mapChanges++;r.nativeFrame.game.stage.behaviorCode=1;const next=c.update({enabled:true,run:r});assert.ok(next.key>first.key);assert.equal(next.crossfadeOnEntry,true);assert.equal(next.musicContext.recordingId,'chapter-07');
 r.attempt++;assert.equal(c.update({enabled:true,run:r}).crossfadeOnEntry,false);r.pause=1;r.state='pause';assert.equal(c.update({enabled:true,run:r}),null);
});
test('filled silhouette contrast and reduced depth fields remain readable and deterministic',()=>{
 assert.equal(A.inkFor('#050505'),'#fff8de');assert.equal(A.inkFor('#ffffee','#fff8de'),'#18121d');assert.equal(A.inkFor('#ffbb77'),'#18121d');
 const record=t=>{const calls=[],c=new Proxy({}, {get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)});A.draw(c,{width:390,height:844,offsetX:0,offsetY:0},D.profiles.orbit,['#111111','#ffffff'],t,true);return calls};assert.deepEqual(record(0),record(100));assert.ok(record(0).filter(c=>c[0]==='strokeRect').length>0&&record(0).filter(c=>c[0]==='strokeRect').length<=8);
});
test('all 15 packaged recordings are distinct, pinned and include ten map and four boss scores',()=>{
 assert.equal(manifest.tracks.length,15);assert.equal(manifest.tracks.filter(t=>t.musicRoles.includes('boss')).length,4);const hashes=new Set();
 for(const t of manifest.tracks){const data=fs.readFileSync(require('node:path').join(__dirname,'../assets/music',t.file));assert.equal(data.length,t.bytes);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),t.sha256);hashes.add(t.sha256)}assert.equal(hashes.size,15);assert.equal(Policy.coverageFor(tracks).availableStageRecordingCount,10);assert.ok(new Set(manifest.tracks.map(t=>t.instrument).filter(Boolean)).size>=8);
});
test('music keeps the outgoing deck until the new map really starts and mute cancels a pending start',async()=>{
 const media=[],pending=[],param=()=>({value:0,cancelScheduledValues(){},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v}}),context={state:'running',currentTime:0,destination:{},createGain:()=>({gain:param(),connect(){}}),createMediaElementSource:()=>({connect(){}})};
 const player=Score.createPlayer(context,{tracks,audioFactory:()=>{const m={paused:true,currentTime:0,duration:60,play(){return new Promise(resolve=>pending.push(()=>{m.paused=false;resolve()}))},pause(){m.paused=true},load(){},setAttribute(){}};media.push(m);return m}}),values={authorized:true,allowed:true,musicVolume:1};
 player.update({...values,entryKey:1,musicContext:{musicRole:'stage01',recordingId:'chapter-01'}});pending.shift()();await Promise.resolve();assert.equal(player.inspect().active,1);
 player.update({...values,entryKey:2,crossfadeOnEntry:true,musicContext:{musicRole:'stage02',recordingId:'chapter-02'}});assert.equal(media.filter(m=>!m.paused).length,1,'outgoing deck remains audible while loading');pending.shift()();await Promise.resolve();assert.equal(player.inspect().active,2);context.currentTime=2;player.update({...values,entryKey:2,musicContext:{musicRole:'stage02'}});assert.equal(player.inspect().active,1);
 player.update({...values,entryKey:3,crossfadeOnEntry:true,musicContext:{musicRole:'stage03'}});player.update({...values,allowed:false});pending.shift()();await Promise.resolve();assert.equal(player.inspect().active,0);assert.ok(media.every(m=>m.paused));
});

test('running elbows counter-swing the leading leg with fixed arm lengths',()=>{const M=require('../src/mobile-presentation.js');for(const strideDistance of [0,20]){const p=M.gait(0,{strideDistance});for(const [a,b,c]of p.arms){assert.ok(Math.abs(Math.hypot(b[0]-a[0],b[1]-a[1])-8.5)<1e-8);assert.ok(Math.abs(Math.hypot(c[0]-b[0],c[1]-b[1])-7.5)<1e-8)}assert.ok((p.legs[0][2][0]-p.hip[0])*(p.arms[0][1][0]-p.shoulder[0])<0)}});
test('story silhouettes respect the ink chosen for the actual scene background',()=>{const M=require('../src/mobile-presentation.js'),colors=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:k==='fill'?()=>colors.push(o.fillStyle):()=>{},set:(o,k,v)=>(o[k]=v,true)});M.narrative(c,100,200,210,'open-arms',1,false,'#234567');assert.ok(colors.length>=6);assert.ok(colors.every(color=>color==='#234567'))});
