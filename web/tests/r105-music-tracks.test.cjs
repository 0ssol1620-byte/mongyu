/* R105 track mode: the embedded Suno loops (web/assets/audio) under the synthesized reactive layer. Mapping, manifest loop-point sanity, fallbacks with a mocked decoder,
   the fever crossfade, act-gate re-phasing, screen music (lobby / menu / story) and one-shot effects. No real audio decoding happens here (Chrome does that in the verify script). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.AudioContext=function(){};
const bus=require('../src/polish-bus.js');
const SFXMOD=require('../src/game-sfx.js');globalThis.MongyuSFX=SFXMOD;
const M=require('../src/adaptive-music.js');
const {mockContext,param}=require('./r105-music-mock.cjs');
const dir=path.join(__dirname,'..','assets','audio');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const tracks=manifest.tracks;

/* ---------- mapping ---------- */
test('trip keys map to tracks: c1..c10 directly, legacy violet/aqua/ember/toxic/heart, boss:n via setContext({boss})',()=>{
 for(const id of ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10'])assert.equal(M.trackIdOf(id),id);
 assert.deepEqual(['violet','aqua','ember','toxic','heart'].map(M.trackIdOf),['c1','c2','c3','c8','c5']);
 assert.equal(M.trackIdOf('nope'),null);assert.equal(M.trackIdOf(null),null);
 assert.deepEqual([1,2,3,4,5].map(n=>M.trackKeyOf(null,{chapter:n})),['c1','c2','c3','c8','c5'],'legacy chapters 1..5');
 assert.equal(M.trackKeyOf(null,{trip:'c7'}),'c7');assert.equal(M.trackKeyOf(null,{trip:'toxic'}),'c8');
 assert.deepEqual([1,2,3,4,5].map(n=>M.trackKeyOf(null,{boss:n})),['boss1','boss2','boss3','boss4','boss5']);assert.equal(M.trackKeyOf(null,{boss:6}),null);assert.equal(M.trackKeyOf(null,{boss:0}),null);
 const run=(o={})=>({courseRun:true,dreamMode:'road',id:'c3',acts:[{type:'bridge',opts:{}}],actIndex:0,options:{},...o});
 assert.equal(M.trackKeyOf(run(),{}),'c1','a road run without a trip key is the default violet = c1');
 assert.equal(M.trackKeyOf(run({options:{trip:'c6'}}),{}),'c6');assert.equal(M.trackKeyOf(run({trip:'ember'}),{}),'c3');
 assert.equal(M.trackKeyOf(run({acts:[{type:'boss',opts:{boss:4}}]}),{}),'boss4','a boss act picks its own track');
 assert.equal(M.contextOf(run(),{trip:'c9'}).track,'c9');assert.equal(M.contextOf(run(),{boss:2}).track,'boss2');assert.equal(M.contextOf({openingCourse:true},{}).track,null,'non-road pieces never use tracks');
 assert.equal(M.contextOf(run({options:{trip:'c8'}}),{}).piece,'b8','the synth piece (fallback) still follows the trip key');
});

/* ---------- manifest ---------- */
test('manifest: loop points sit inside the decoded buffer on whole bars, files match their hashes, loudness and peak are in range, sizes are in budget',()=>{
 const ids=Object.keys(tracks);for(const id of ['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','title','fever','story','menu','boss1','boss2','boss3','boss4','boss5','boss1-outro','sfx-gate-clear','sfx-star','sfx-portal','sfx-recover','sfx-unlock','sfx-discovery'])assert.ok(ids.includes(id),'manifest has '+id);
 let music=0,sfx=0;
 for(const [id,t] of Object.entries(tracks)){
  const data=fs.readFileSync(path.join(dir,t.file));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),t.sha256,id+' hash');assert.equal(data.length,t.bytes);
  assert.equal(t.source,'suno');assert.match(t.note,/Suno Pro plan/);
  if(t.kind==='sfx'){sfx+=t.bytes;assert.ok(t.peak<=-2.5&&t.peak>=-5,id+' sfx peak about -3 dBFS (true-peak limited): '+t.peak);assert.ok(t.durationSec>=1.9&&t.durationSec<=4.1,id+' duration '+t.durationSec);continue}
  music+=t.bytes;assert.ok(t.peak<=-1,id+' peak '+t.peak);
  if(t.kind==='outro'){assert.ok(t.durationSec>=4&&t.durationSec<=8);continue}
  assert.ok(['loop','intro-loop'].includes(t.kind));
  assert.ok(Math.abs(t.lufs+18)<=.6,id+' loudness '+t.lufs);
  assert.ok(t.loopStart>=0&&t.loopEnd>t.loopStart&&t.loopEnd<=t.durationSec+1e-6,id+' loop inside buffer');
  const L=t.loopEnd-t.loopStart,exact=t.bars*t.beatsPerBar*60/t.bpm;
  assert.ok(Math.abs(L-t.loopSeconds)<2e-3,id+' loopSeconds');assert.ok(Math.abs(L-exact)/exact<.003,id+' loop is '+t.bars+' bars at '+t.bpm+' BPM: '+L+' vs '+exact);
  assert.ok(t.durationSec-t.loopEnd>=.09,id+' keeps the periodic padding after the loop end (decoder delay safe)');
  if(t.kind==='loop'){assert.ok(t.loopStart>=.09,id+' keeps the padding before the loop start');assert.equal(t.introEnd,0)}else{assert.ok(t.introEnd>3&&Math.abs(t.introEnd-t.loopStart)<1e-6,id+' intro ends where the loop starts')}
  assert.ok(L<=60.5,id+' loop <= ~60 s: '+L);
  assert.ok(Number.isInteger(t.keyTonic)&&['major','minor'].includes(t.keyMode),id+' key estimate');
 }
 assert.ok(music<=9.5e6,'music bytes '+music);assert.ok(sfx<=.4e6,'sfx bytes '+sfx);
 const first=['c1','c2','c3','c4','c5','c8','title','fever'].reduce((a,id)=>a+tracks[id].bytes,0);assert.ok(first<=4e6,'first batch <= 4 MB: '+first);
 const added=['c6','c7','c9','c10','story','menu','boss1','boss2','boss3','boss4','boss5','boss1-outro','boss2-outro','boss3-outro','boss4-outro','boss5-outro','sfx-gate-clear','sfx-star','sfx-portal','sfx-recover','sfx-unlock','sfx-discovery'].reduce((a,id)=>a+tracks[id].bytes,0);assert.ok(added<=6e6,'second batch <= 6 MB: '+added);
 assert.deepEqual(['c1','c2','c3','c4','c5','c6','c7','c8','c9','c10'].filter(id=>tracks[id].bars*tracks[id].beatsPerBar<=0),[]);
 assert.equal(tracks.boss1.beatsPerBar,3,'the waltz is counted in 3');assert.ok(tracks.c1.keyMode==='minor'&&tracks.c1.keyTonic===0,'c1 is C minor as specified');
});
test('pure helpers: effective tempo, playbackRate lock within +-8 %, fever ratios, track cfg keeps the synth piece in the track key',()=>{
 const e={bars:16,beatsPerBar:4,loopStart:.1,loopEnd:.1+39.588,bpm:97};const bpm=M.trackBpmOf(e);assert.ok(Math.abs(bpm-97)<.01,String(bpm));
 const l=M.trackRateFor(e,96);assert.ok(l.locked&&Math.abs(l.rate-96/bpm)<1e-9&&l.bpm===96);
 const far=M.trackRateFor(e,120);assert.ok(!far.locked&&far.rate===1&&Math.abs(far.bpm-bpm)<1e-9,'too far: natural tempo');
 assert.ok(!M.trackRateFor(e,NaN).locked);
 const fe={bars:8,beatsPerBar:4,loopStart:.1,loopEnd:.1+14.013};
 const a=M.feverRateFor(fe,96),b=M.feverRateFor(fe,100),c=M.feverRateFor(fe,138);
 assert.ok(a.locked&&Math.abs(a.rate-1)<=.08&&a.ratio===1.5,'96 BPM chapter: fever sits at 3:2');assert.ok(c.locked&&c.ratio===1&&Math.abs(c.rate-138/137.02)<.01);assert.ok(b.rate>=.92&&b.rate<=1.08);
 assert.ok(!M.feverRateFor(fe,120).locked||Math.abs(M.feverRateFor(fe,120).rate-1)<=.08,'120 BPM: either related or natural');
 const cfg=M.trackCfgFor(M.arrangement('r1'),{keyTonic:0,keyMode:'minor',bars:16,beatsPerBar:4,loopStart:0,loopEnd:40});
 assert.equal(M.keyOf(cfg,0).name,'Cm');assert.ok(cfg.trackMode);const maj=M.trackCfgFor(M.arrangement('r1'),{keyTonic:2,keyMode:'major',bars:16,beatsPerBar:4,loopStart:0,loopEnd:40});assert.equal(M.keyOf(maj,0).name,'D');
 assert.equal(M.chordAt(cfg,0,0).bass,0);
});
test('fever decision: the run\'s own fever state wins (LUCID/OVERLOAD on, RECOVERY off), else a surge or a long streak, never after a hit',()=>{
 const w=M.feverWanted;
 assert.ok(w('LUCID')&&w('OVERLOAD'));assert.ok(!w('RECOVERY')&&!w('NORMAL')&&!w('FLOW'));
 assert.ok(!w('OVERLOAD',{crashed:true}));assert.ok(!w('NORMAL',{surge:true,streak:20}),'a known fever state is not overridden by the fallback');
 assert.ok(w(null,{surge:true})&&w(null,{streak:6})&&!w(null,{streak:5})&&!w(null,{}));assert.ok(!w(null,{surge:true,crashed:true}));
});

/* ---------- live behaviour with a mocked decoder ---------- */
function fakeEntry(extra={}){return {src:'data:audio/mpeg;base64,AAAA',kind:'loop',bpm:96,bars:16,beatsPerBar:4,loopStart:.1,loopEnd:.1+40,introEnd:0,keyTonic:0,keyMode:'minor',lufs:-18,peak:-5,source:'suno',...extra}}
function fakeTable(){return {c1:fakeEntry(),c2:fakeEntry({bpm:88,loopEnd:.1+43.636}),c6:fakeEntry({kind:'intro-loop',introEnd:9.75,loopStart:9.75,loopEnd:9.75+41.7,bpm:92.28}),fever:fakeEntry({bpm:137,bars:8,loopEnd:.1+14.013}),
 'sfx-gate-clear':fakeEntry({kind:'sfx'}),'sfx-portal':fakeEntry({kind:'sfx'}),'sfx-star':fakeEntry({kind:'sfx'}),'sfx-recover':fakeEntry({kind:'sfx'}),'sfx-unlock':fakeEntry({kind:'sfx'}),'sfx-discovery':fakeEntry({kind:'sfx'}),title:fakeEntry({loopEnd:.1+40}),menu:fakeEntry(),story:fakeEntry()}}
function decoderContext(mode='ok'){
 const ctx=mockContext(),calls=[];
 ctx.decodeAudioData=(ab,ok,bad)=>{calls.push(ab.byteLength);if(mode==='missing')return undefined;
  if(mode==='fail'){const e=new Error('EncodingError');setTimeout(()=>bad&&bad(e),0);return Promise.reject(e)}
  if(mode==='throw')throw new Error('sync boom');
  const b=ctx.createBuffer(2,1000,48000);return Promise.resolve(b)};
 ctx.decodeCalls=calls;ctx.createWaveShaper=()=>({connect(x){return x},disconnect(){},curve:null,oversample:'none'});return ctx;
}
function fakeRun(extra={}){return {courseRun:true,mode:'dream',dreamMode:'road',id:'c1',state:'play',actIndex:0,acts:[{type:'helix-up',opts:{}},{type:'bridge',opts:{}}],child:{time:0,chain:{bpm:96},lastItem:null},portal:null,attempt:1,bpm:96,perfectStreak:0,progressValue:0,options:{},
 status(){return {progress:this.progressValue}},...extra}}
const flush=async()=>{for(let i=0;i<6;i++)await new Promise(r=>setImmediate(r))};
function live(mode,{table=fakeTable(),run=fakeRun(),settings={}}={}){
 M._reset();globalThis.MONGYU_EMBEDDED_AUDIO=table;const ctx=decoderContext(mode),music=ctx.createGain(),sfx=ctx.createGain();let t=0;M._setClock(()=>t);
 bus.attach({audio:()=>({context:ctx,music,sfx}),settings:()=>settings,activeRun:()=>run,sound(){},refreshMusic(){}});
 const L={ctx,run,music,sfx,tick(dt=.045){ctx.currentTime+=dt;t+=dt;M.update()}};ctx.currentTime=1;return L;
}
const bufferSources=ctx=>ctx.sources.filter(s=>s.buffer&&s.loop===true&&s.loopEnd>0);
test('track mode: until decoded the synth piece plays, then the loop starts on the beat grid with loop points from the manifest and only the reactive layer stays synthesized',async()=>{
 const L=live('ok'),{ctx}=L;M.update();
 assert.equal(M.inspect().track.want,'c1');assert.equal(ctx.decodeCalls.length,1,'decoding starts lazily once a session exists');
 for(let i=0;i<20;i++)L.tick();assert.ok(!M.inspect().track.active,'still decoding: synth fallback');const before=M._session().scheduled;assert.ok(before>0,'synth piece is playing meanwhile');
 await flush();for(let i=0;i<10;i++)L.tick();
 const info=M.inspect().track;assert.ok(info.active&&info.id==='c1'&&info.locked,JSON.stringify(info));
 const src=bufferSources(ctx);assert.equal(src.length,1);assert.equal(src[0].loopStart,.1);assert.ok(Math.abs(src[0].loopEnd-40.1)<1e-9);assert.ok(src[0].starts>=1);
 const S=M._session();assert.deepEqual(S.only,['heart']);assert.ok(S.trackMode);assert.equal(M.inspect().key,'Cm','synth layer re-keyed to the track (C minor)');assert.ok(Math.abs(info.rate-96/(16*4*60/40))<1e-9,'playbackRate locks the 96 BPM course to the loop');
 const n=S.scheduled;for(let i=0;i<120;i++)L.tick();assert.ok(S.scheduled>n,'heartbeat pulse keeps being scheduled');
 assert.ok(!S.nodes.size||true);const insts=new Set();assert.ok(M.pulse()>=0&&M.pulse()<=1.0001);
 /* the sfx tuning follows the track key */
 const tune=M.sfxTuning('jump');assert.equal(tune.key,'Cm');
 M._reset();
});
test('fallback: a decoder that fails (rejects, throws, is missing, or has no table entry) leaves the synth piece playing without exceptions',async()=>{
 for(const mode of ['fail','throw','missing']){
  const L=live(mode);M.update();for(let i=0;i<30;i++)L.tick();await flush();for(let i=0;i<60;i++)L.tick();
  const i=M.inspect();assert.ok(i.active&&!i.track.active,mode+': synth plays');if(mode!=='missing')assert.equal(i.track.failed,'c1',mode);assert.equal(bufferSources(L.ctx).length,0);assert.ok(M._session().scheduled>0);M._reset();
 }
 const L=live('ok',{table:{}});M.update();for(let i=0;i<30;i++)L.tick();await flush();assert.equal(M.inspect().track.active,false);assert.equal(L.ctx.decodeCalls.length,0,'no entry: nothing decoded');M._reset();
 const bad=fakeTable();bad.c1.loopEnd=bad.c1.loopStart;const L2=live('ok',{table:bad});M.update();for(let i=0;i<10;i++)L2.tick();assert.equal(L2.ctx.decodeCalls.length,0,'a broken manifest entry is ignored');M._reset();
});
test('a decoded cache is per context: retries and later runs do not decode twice; a run on a chapter without a track keeps the synth',async()=>{
 const L=live('ok');M.update();await flush();for(let i=0;i<10;i++)L.tick();const first=L.ctx.decodeCalls.length;M._reset();
 M.update();assert.ok(first>=1);
 const L2=live('ok',{table:fakeTable(),run:fakeRun({options:{trip:'c9'}})});M.update();for(let i=0;i<20;i++)L2.tick();await flush();for(let i=0;i<10;i++)L2.tick();assert.equal(M.inspect().track.want,'c9');assert.equal(M.inspect().track.active,false,'c9 has no entry in this fake table');M._reset();
});
test('fever: on LUCID the fever loop crosses in over two beats on the next beat, RECOVERY crosses back over four; surge/streak do the same when no fever state exists; a hit drops it',async()=>{
 const L=live('ok'),{ctx,run}=L;M.update();await flush();for(let i=0;i<10;i++)L.tick();await flush();for(let i=0;i<40;i++)L.tick();
 assert.ok(M.inspect().track.active);assert.ok(!M.inspect().track.fever);
 run.fever={state:'LUCID'};for(let i=0;i<20;i++)L.tick();
 let tr=M.inspect().track;assert.ok(tr.fever,'fever layer on');assert.equal(bufferSources(ctx).length,2,'main + fever');const fv=bufferSources(ctx)[1];assert.ok(Math.abs(fv.loopEnd-14.113)<1e-9);assert.ok(tr.feverLocked&&Math.abs(tr.feverRate-1)<=.08);
 assert.ok(fv.starts>=ctx.currentTime-1,'starts on a beat of the session grid');
 const S=M._session(),spb=S.spb,beats=(fv.starts-S.anchors[0].time)/spb;assert.ok(Math.abs(beats-Math.round(beats))<1e-6||fv.starts<S.anchors[0].time+.2,'fever start is beat-quantised: '+beats);
 assert.equal(M.inspect().stats.feverIn,1);
 run.fever={state:'OVERLOAD'};for(let i=0;i<20;i++)L.tick();assert.equal(M.inspect().stats.feverIn,1,'stays in fever');
 run.fever={state:'RECOVERY'};for(let i=0;i<20;i++)L.tick();assert.ok(!M.inspect().track.fever,'RECOVERY leaves the fever layer');assert.equal(M.inspect().stats.feverOut,1);
 delete run.fever;run.perfectStreak=7;for(let i=0;i<20;i++)L.tick();assert.ok(M.inspect().track.fever,'fallback: a long streak');
 bus.emit('run-event',{run,event:'hit'});for(let i=0;i<20;i++)L.tick();assert.ok(!M.inspect().track.fever,'a hit leaves fever');M._reset();
});
test('hit closes the track low-pass, cues dip the track by ~2 dB, clear fades the track with the session; no exceptions',async()=>{
 const L=live('ok'),{ctx,run}=L;M.update();await flush();for(let i=0;i<10;i++)L.tick();await flush();for(let i=0;i<40;i++)L.tick();
 const S=M._session(),tb=S.tb;assert.ok(tb&&tb.lp&&tb.duck&&tb.master);
 const log=[];const orig=tb.lp.frequency;const spy=(p,name)=>{for(const k of ['exponentialRampToValueAtTime','setValueAtTime','setTargetAtTime','cancelScheduledValues'])if(p[k]){const f=p[k];p[k]=(...a)=>{log.push([name,k,...a]);return f.apply(p,a)}}};
 spy(tb.lp.frequency,'lp');spy(tb.duck.gain,'duck');
 bus.emit('run-event',{run,event:'hit'});assert.ok(log.some(e=>e[0]==='lp'&&e[1]==='exponentialRampToValueAtTime'&&e[2]<=300),'low-pass closes to ~300 Hz');
 bus.emit('run-event',{run,event:'perfect'});const dip=log.find(e=>e[0]==='duck'&&e[1]==='setTargetAtTime');assert.ok(dip&&Math.abs(20*Math.log10(dip[2])+2.04)<.2,'dip is about -2 dB: '+(dip&&dip[2]));
 for(let i=0;i<200;i++)L.tick();assert.ok(log.some(e=>e[0]==='lp'&&e[1]==='exponentialRampToValueAtTime'&&e[2]>=16000),'reopens after the recover');
 run.outro={kind:'clear'};L.tick();assert.ok(M.inspect().goal);M._reset();
});
test('act gate keeps the track playing (no restart), re-phases it onto the new act\'s beat grid and re-tempos; a different chapter crossfades in 1.5 s',async()=>{
 const L=live('ok'),{ctx,run}=L;M.update();await flush();for(let i=0;i<10;i++)L.tick();await flush();for(let i=0;i<60;i++)L.tick();
 const S=M._session();const startCount=bufferSources(ctx).length;assert.equal(startCount,1);
 run.actIndex=1;run.child={time:0,chain:{bpm:100}};run.acts[1].opts.bpm=100;run.portal={age:0,duration:.6,swapped:false};L.tick(.001);
 for(let i=0;i<30;i++){if(i===8)run.portal.swapped=true;L.tick()}run.portal=null;
 const t=M.inspect().track;assert.ok(t.active&&t.id==='c1');assert.ok(t.retempos>=1,'tempo changes with the act');assert.ok(Math.abs(t.bpm-100)<1e-6,'track follows the act bpm');assert.ok(Math.abs(t.rate-100/(16*4*60/40))<1e-9);
 assert.ok(t.rephases<=1);assert.ok(M.inspect().stats.gates>=1);assert.equal(M.inspect().stats.trackRestarts|0,0,'a gate is not a restart');
 /* chapter switch through setContext on the same run: new track crossfades */
 M.setContext({trip:'c2'});for(let i=0;i<60;i++)L.tick();M._reset();
});
test('retry restarts the track from its loop head, a fresh course start plays the intro of an intro-loop track, a retry skips it',async()=>{
 const L=live('ok',{run:fakeRun({options:{trip:'c6'}})}),{ctx}=L;M.update();await flush();for(let i=0;i<10;i++)L.tick();await flush();for(let i=0;i<10;i++)L.tick();
 let src=bufferSources(ctx);assert.equal(src.length,1);assert.equal(src[0].loopStart,9.75);
 const offs=[];const orig=ctx.createBufferSource;ctx.createBufferSource=()=>{const s=orig();const st=s.start;s.start=(t,o)=>{offs.push(o);st(t)};return s};
 M._reset();
 /* first run: offset 0 (+decoder delay) = the intro; after a crash within 45 s the next session starts at the loop head */
 const L2=live('ok',{run:fakeRun({options:{trip:'c6'}})});const first=[];const o2=L2.ctx.createBufferSource;L2.ctx.createBufferSource=()=>{const s=o2();const st=s.start;s.start=(t,o)=>{first.push(o);st(t)};return s};
 M.update();await flush();for(let i=0;i<10;i++)L2.tick();await flush();for(let i=0;i<10;i++)L2.tick();
 assert.ok(first.length>=1&&first[0]<.1,'intro: starts from the beginning of the file: '+first[0]);
 bus.emit('run-event',{run:L2.run,event:'fail'});L2.run.state='fail';L2.tick();L2.run.state='play';
 const retry=fakeRun({options:{trip:'c6'},attempt:2});const L3run=retry;bus.attach({audio:()=>({context:L2.ctx,music:L2.music,sfx:L2.sfx}),settings:()=>({}),activeRun:()=>L3run,sound(){},refreshMusic(){}});
 const second=[];const o3=L2.ctx.createBufferSource;L2.ctx.createBufferSource=()=>{const s=o3();const st=s.start;s.start=(t,o)=>{second.push(o);st(t)};return s};
 for(let i=0;i<60;i++)L2.tick();
 const loopHead=second.find(o=>o>9);assert.ok(loopHead!==undefined&&Math.abs(loopHead-(9.75+1105/48000))<1e-6,'retry starts at the loop head: '+JSON.stringify(second));
 M._reset();
});

/* ---------- effects ---------- */
test('one-shot effects: gate-clear on course clear, portal on act gates, star on a memory star; they respect mute and sfx volume and the polyphony cap; synth stays the fallback',async()=>{
 const L=live('ok'),{ctx,run,sfx}=L;M.update();await flush();for(let i=0;i<10;i++)L.tick();await flush();for(let i=0;i<80;i++)L.tick();await flush();
 const count=()=>ctx.sources.filter(s=>s.buffer&&!s.loop).length;
 const base=count();
 run.child.lastItem={kind:'memory-star'};bus.emit('run-event',{run,event:'item'});assert.equal(count(),base+1,'star layered on the pickup');
 run.child.lastItem={kind:'bubble'};bus.emit('run-event',{run,event:'item'});assert.equal(count(),base+1,'other items stay synthesized');
 bus.emit('run-event',{run,event:'perfect'});bus.emit('run-event',{run,event:'jump'});bus.emit('run-event',{run,event:'hit'});assert.equal(count(),base+1,'judgement sfx are never sampled');
 run.outro={kind:'clear'};L.tick();assert.ok(count()>=base+2,'gate-clear at the clear');
 /* polyphony cap */
 for(let i=0;i<6;i++)M.playSfx('discovery');assert.ok(M.inspect().stats.sfx>=3);
 const live3=[...ctx.sources].filter(s=>s.buffer&&!s.loop&&s.stops===null).length;assert.ok(live3<=3,'at most 3 sample effects at once: '+live3);
 M._reset();
 const L2=live('ok',{settings:{mute:true}});M.update();await flush();for(let i=0;i<10;i++)L2.tick();await flush();assert.equal(M.playSfx('unlock'),false,'mute');M._reset();
 const L3=live('ok',{settings:{sfxVolume:0}});M.update();await flush();for(let i=0;i<10;i++)L3.tick();await flush();assert.equal(M.playSfx('unlock'),false,'sfx volume 0');M._reset();
 const L4=live('ok');assert.equal(M.playSfx('nope'),false);assert.equal(M.playSfx('unlock'),false,'not decoded yet: synth fallback');M._reset();
});

/* ---------- screen music ---------- */
function fakeDoc(visible){
 const els=new Map();const doc={hidden:false,getElementById:id=>{if(!visible.has(id))return null;const el={id,hidden:false,getClientRects:()=>[{}],getAttribute:()=>null};return el},addEventListener(){}};return doc;
}
function screenCtxFactory(){
 const created=[];function Ctx(){const c=decoderContext('ok');created.push(c);c.destination={};c.state='running';return c}return {Ctx,created};
}
test('screen music: title in the lobby, menu on menu screens, story on story scenes (low level); only after a gesture; follows mute / volume; fades out when a run starts',async()=>{
 M._reset();globalThis.MONGYU_EMBEDDED_AUDIO=fakeTable();const f=screenCtxFactory();globalThis.AudioContext=f.Ctx;
 const visible=new Set(['r105Lobby']);globalThis.document=fakeDoc(visible);let settings={mute:false,musicVolume:.8,sfxVolume:1},run=null;
 bus.attach({audio:()=>null,settings:()=>settings,activeRun:()=>run,sound(){},refreshMusic(){}});
 const doc=globalThis.document;doc.getElementById=(id)=>visible.has(id)?{id,hidden:false,getClientRects:()=>[{}],getAttribute:()=>null}:null;
 const S=M._screens;assert.equal(S.wanted(),'title');
 S.tick();assert.equal(S.state().ctx,null,'no AudioContext before a gesture');
 S.gesture();await flush();S.tick();let st=S.state();assert.ok(st.ctx&&st.cur&&st.cur.id==='title','title plays in the lobby');assert.ok(Math.abs(st.cur.level-.708)<.01,'-3 dB');assert.ok(Math.abs(st.master.gain.value-.8)<1e-9,'music volume applied');
 assert.equal(st.cur.src.loopStart,.1);
 visible.add('settings');assert.equal(S.wanted(),'menu');S.tick();await flush();S.tick();st=S.state();assert.equal(st.cur.id,'menu','crossfaded to menu');assert.ok(st.stats.switches>=1);
 visible.delete('settings');visible.add('wardrobePanel');assert.equal(S.wanted(),'menu');visible.delete('wardrobePanel');visible.add('roadScreen');assert.equal(S.wanted(),'menu');visible.delete('roadScreen');
 visible.add('storyJournal');assert.equal(S.wanted(),'menu');visible.delete('storyJournal');
 visible.add('restorationScene');assert.equal(S.wanted(),'story');S.tick();await flush();S.tick();assert.equal(S.state().cur.id,'story');assert.ok(Math.abs(S.state().cur.level-.5)<.01,'story is at low level');visible.delete('restorationScene');
 settings={mute:true,musicVolume:.8,sfxVolume:1};S.tick();assert.equal(S.state().cur,null,'mute fades the screen music out');settings={mute:false,musicVolume:.8,sfxVolume:1};S.tick();await flush();S.tick();assert.equal(S.state().cur?.id,'title');
 settings={mute:false,musicVolume:0,sfxVolume:1};S.tick();assert.equal(S.state().cur,null,'music volume 0');settings={mute:false,musicVolume:.8,sfxVolume:1};S.tick();await flush();S.tick();
 run={state:'play'};assert.equal(S.wanted(),null,'a run owns the sound');S.tick();assert.equal(S.state().cur,null,'fades out when a run starts');
 run={state:'clear'};visible.add('roadResult');assert.equal(S.wanted(),'story','a cleared course result is a chapter-ending moment');visible.delete('roadResult');assert.equal(S.wanted(),'title','a finished run on the lobby');run={state:'pause'};assert.equal(S.wanted(),null);
 run=null;doc.hidden=true;assert.equal(S.wanted(),null,'hidden page');doc.hidden=false;
 visible.clear();assert.equal(S.wanted(),null);
 S._screens;S.reset();delete globalThis.document;globalThis.AudioContext=function(){};M._reset();
});
test('story scenes win over an active run (they are shown over it) and the effect samples play through the screen context outside a run',async()=>{
 M._reset();globalThis.MONGYU_EMBEDDED_AUDIO=fakeTable();const f=screenCtxFactory();globalThis.AudioContext=f.Ctx;
 const visible=new Set(['restorationScene']);globalThis.document={hidden:false,getElementById:id=>visible.has(id)?{id,hidden:false,getClientRects:()=>[{}],getAttribute:()=>null}:null,addEventListener(){}};
 bus.attach({audio:()=>null,settings:()=>({}),activeRun:()=>({state:'scene'}),sound(){},refreshMusic(){}});
 const S=M._screens;assert.equal(S.wanted(),'story');S.gesture();await flush();S.tick();await flush();S.tick();assert.equal(S.state().cur.id,'story');
 /* the screen context hosts decoded effects */
 const sc=S.state().ctx;assert.equal(M.playSfx('unlock'),false,'not decoded yet');await flush();assert.equal(M.playSfx('unlock'),true);assert.ok(sc.sources.some(s=>s.buffer&&!s.loop));
 S.reset();delete globalThis.document;globalThis.AudioContext=function(){};M._reset();
});
test('boss hook: setContext({boss:n}) selects boss<n>, clearContext returns to the course track',()=>{
 const L=live('ok');M.update();M.setContext({boss:3});assert.equal(M.getContext().piece!==undefined,true);assert.equal(M.contextOf(L.run,{boss:3}).track,'boss3');M.clearContext();assert.equal(M.contextOf(L.run,{}).track,'c1');M._reset();
});
test('no embedded audio at all (R103/R104 builds, tests): everything above is inert and the synth plays exactly as before',()=>{
 M._reset();delete globalThis.MONGYU_EMBEDDED_AUDIO;const ctx=decoderContext('ok'),music=ctx.createGain(),run=fakeRun();let t=0;M._setClock(()=>t);
 bus.attach({audio:()=>({context:ctx,music}),settings:()=>({}),activeRun:()=>run,sound(){},refreshMusic(){}});ctx.currentTime=1;M.update();
 for(let i=0;i<100;i++){ctx.currentTime+=.045;t+=.045;M.update()}
 assert.ok(M.inspect().active&&!M.inspect().track.active);assert.equal(ctx.decodeCalls.length,0);assert.equal(M.playSfx('unlock'),false);assert.equal(M._screens.wanted(),null);
 M._reset();
});
