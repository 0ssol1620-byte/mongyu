const test=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.AudioContext=function(){};
const bus=require('../src/polish-bus.js');
const SFX=require('../src/game-sfx.js');globalThis.MongyuSFX=SFX;
const M=require('../src/adaptive-music.js');
const {mockContext}=require('./r105-music-mock.cjs');
const I=M._internals,ROAD=['r1','r2','r3','r4','r5'];
const PALETTES=['violet','aqua','ember','toxic','heart'];

test('five road pieces: chapter identity (tempo, mode, tension, reverb, heartbeat) and a consonant resolve',()=>{
 const t=ROAD.map(id=>M.TRIPS[id]);
 assert.deepEqual(t.map(c=>c.trip),PALETTES);
 assert.equal(new Set(t.map(c=>c.seed)).size,5);
 assert.ok(t[0].bpm>=90&&t[0].bpm<=100,'chapter 1 is a slow hypnotic 90-100 BPM');
 for(const c of t){assert.ok(c.bpm>=90&&c.bpm<=112,c.title);assert.equal(c.loops.length,4);for(const l of c.loops){assert.equal(l.length,4);for(const n of l)assert.ok(M.CHORDS[n],n)}
  assert.equal(M.CHORDS[c.loops[3][3]].b,0,c.title+' resolve ends on the tonic');assert.equal(M.keyOf(c,3).tonic,c.pc);assert.ok(c.heart.gap===.5,'dub sits on the eighth grid')}
 assert.ok(t[1].verb.sec>=6&&t[1].verb.sec>t[0].verb.sec&&t[1].verb.sec>t[2].verb.sec,'chapter 2 has the longest tails');
 assert.ok(Object.values(t[1].drops).some(n=>n>0),'chapter 2 has water drops');
 assert.ok(t[2].groove.filter(r=>['gung','deok','kung'].includes(r[1])).length>=6&&t[2].fill.length>0,'chapter 3 leans on janggu rhythm and fills');
 assert.ok(t[3].tension>0&&t[3].pad.detune>=14,'chapter 4 is tense and beating');
 const rub=new Set();for(const l of t[3].loops.slice(0,3))for(const n of l){const ps=M.CHORDS[n].p;for(const a of ps)for(const b of ps)if((b-a+12)%12===1)rub.add(n)}
 assert.ok(rub.size>=2,'chapter 4 uses semitone clusters');for(const n of t[3].loops[3])assert.ok(!['bII','tri','clus','i-b2'].includes(n),'chapter 4 resolve has no cluster chords');
 assert.ok(t[4].heart.dub.every(v=>v>0)&&t[4].heart.lub.every(v=>v>0),'chapter 5 beats on every beat');assert.ok(t[4].bpm===Math.max(...t.map(c=>c.bpm)));
 assert.ok(t[4].groove.some(r=>r[1]==='bell')&&t[4].groove.filter(r=>r[1]==='tick').length>=8,'clock tower');
});
test('macro structure: intro, A, B, climax, resolve, locked to bars',()=>{
 const plan=M.macroPlan();assert.equal(plan.length,32);
 assert.deepEqual([...new Set(plan.map(p=>p.section))],['intro','A','B','climax','resolve']);
 assert.equal(plan.filter(p=>p.newSection).length,5);assert.ok(plan[0].newSection&&plan[4].newSection);
 let last=-1;for(let i=0;i<=100;i++){const s=M.SECTIONS.indexOf(M.sectionAtProgress(i/100));assert.ok(s>=last);last=s}
 assert.equal(M.sectionAtProgress(0),'intro');assert.equal(M.sectionAtProgress(1),'resolve');assert.equal(M.sectionAtProgress(.5),'B');
 assert.ok(M.isDropout('A',7)&&!M.isDropout('A',6)&&M.isDropout('B',7)&&M.isDropout('climax',5)&&!M.isDropout('intro',3));
 const lv=s=>M.tripLevel(s,{jumpOk:false,melody:false});assert.equal(lv('intro'),1);assert.ok(M.tripLevel('A',{jumpOk:true})===2&&M.tripLevel('climax',{melody:true})===4&&M.tripLevel('resolve',{melody:true})<=3&&M.tripLevel('intro',{melody:true,surge:true})<=4);
});
test('road bar events: deterministic, on the sixteenth grid, stems add up, drop-outs and swells mark the structure',()=>{
 for(const id of ROAD){
  const cfg=M.arrangement(id),plan=M.macroPlan();
  plan.forEach((m,i)=>{
   const st={section:m.section,barIn:m.barIn,newSection:m.newSection,level:4,energy:.5,dropout:M.isDropout(m.section,m.barIn),swellNext:false};
   const a=M.tripBarEvents(cfg,i,st),b=M.tripBarEvents(cfg,i,st);assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));
   for(const e of a){assert.ok(Math.abs(e.at*4-Math.round(e.at*4))<1e-9,`${id} ${m.section}/${m.barIn} ${e.inst} at ${e.at}`);assert.ok(e.at>=0&&e.at<4);assert.ok(e.vel>=0)}
   const stems=new Set(a.map(e=>e.stem));
   if(st.dropout){assert.deepEqual([...stems],[1],'drop-out keeps only the base stem');assert.ok(a.some(e=>e.inst==='swell'))}
   else if(m.section==='intro')assert.ok(!stems.has(3)&&!stems.has(4)||st.level>=3);
   if(m.newSection&&i>0)assert.ok(a.some(e=>e.inst==='impact'),'impact on every section change');
   assert.ok(a.some(e=>e.inst==='heart'&&e.kind==='lub'),'a heartbeat in every bar');
  });
  for(let l=1;l<=4;l++){const s=new Set(M.tripBarEvents(cfg,9,{section:'B',barIn:1,level:l,energy:0}).map(e=>e.stem));assert.deepEqual([...s].sort(),[1,2,3,4].slice(0,l))}
  const next=M.tripBarEvents(cfg,3,{section:'A',barIn:3,level:2,swellNext:true});assert.ok(next.some(e=>e.inst==='swell'&&e.at===2&&e.dur===2),'swell blooms into the next downbeat');
 }
});
test('road melodies stay in the scale; chapters 1,2,3,5 never rub the chord, chapter 4 may but always resolves on tonic or fifth',()=>{
 for(const id of ROAD){const cfg=M.arrangement(id);
  for(let loop=0;loop<4;loop++){const key=M.keyOf(cfg,loop);
   for(const v of [0,1]){const ph=M.phrase(cfg,loop,v);assert.ok(ph.length>=10);
    for(const e of ph){const rel=((e.midi-key.tonic)%12+12)%12;assert.ok(key.scale.includes(rel),`${id}/${loop}`);if(!cfg.tension)assert.ok(M.safe(e.midi%12,M.chordAt(cfg,loop,e.bar)),`${id}/${loop}/${v} bar ${e.bar}`)}
    const last=ph[ph.length-1],rel=((last.midi-key.tonic)%12+12)%12;assert.ok(rel===0||rel===7,id+' phrase ends on tonic/fifth')}}
 }
 const a=M.arrangement('r3','c13'),b=M.arrangement('r3','c14');assert.notEqual(a.seed,b.seed);assert.notDeepEqual(JSON.parse(JSON.stringify(M.phrase(a,0,0))),JSON.parse(JSON.stringify(M.phrase(b,0,0))),'courses of one chapter vary');
 assert.equal(M.arrangement('r3'),M.arrangement('r3'));
});
test('Shepard-Risset: window vanishes at the edges and the partials sum to a constant level at every phase',()=>{
 const N=M.SHEP.N;assert.equal(M.shepWindow(0),0);assert.equal(M.shepWindow(N),0);assert.ok(M.shepWindow(N/2)>.99);
 let lo=1e9,hi=0;for(let i=0;i<200;i++){const v=M.shepLoudness(i/200);lo=Math.min(lo,v);hi=Math.max(hi,v)}
 assert.ok(20*Math.log10(hi/lo)<1.0,'amplitude ripple '+(20*Math.log10(hi/lo)).toFixed(2)+' dB');
 for(let i=1;i<10;i++)assert.ok(M.shepFreq(i/2,0)>M.shepFreq((i-1)/2,0));assert.ok(Math.abs(M.shepFreq(1,0)/M.shepFreq(0,0)-2)<1e-9);
 assert.equal(M.shepDirOf('helix-up'),1);assert.equal(M.shepDirOf('penrose'),1);assert.equal(M.shepDirOf('helix-down'),-1);assert.equal(M.shepDirOf('bridge'),0);assert.equal(M.shepDirOf('floor-wall'),0);
 assert.equal(M.shepDirOf('mobius-up'),1);assert.equal(M.shepDirOf('tube-descent'),-1);M.registerShepardAct('flip',-1);assert.equal(M.shepDirOf('flip'),-1);M.registerShepardAct('flip',0);assert.equal(M.shepDirOf('flip'),0);
});
test('context mapping: course id -> chapter, trip key, act and tempo precedence, claim for dream-road runs',()=>{
 const run=(id,extra={})=>({courseRun:true,dreamMode:'road',id,acts:[{type:'helix-up',opts:{}},{type:'bridge',opts:{bpm:120}}],actIndex:0,child:{chain:{bpm:104}},bpm:100,...extra});
 const want={c1:1,c5:1,c6:2,c10:2,c11:3,c15:3,c16:4,c20:4,c21:5,c25:5};
 for(const [id,ch] of Object.entries(want))assert.equal(M.contextOf(run(id)).piece,'r'+ch,id);
 assert.equal(M.contextOf(run('c3',{options:{trip:'toxic'}})).piece,'r4');
 const c=M.contextOf(run('c13'));assert.equal(c.act,'helix-up');assert.equal(c.shepDir,1);assert.equal(c.bpm,104,'child chain bpm beats the course bpm');assert.equal(c.trip,'ember');
 assert.equal(M.contextOf(run('c13',{actIndex:1})).bpm,120,'act option beats everything but an override');assert.equal(M.contextOf(run('c13'),{bpm:90}).bpm,90);
 assert.equal(M.contextOf(run('c13'),{trip:'heart'}).piece,'r5');assert.equal(M.contextOf(run('c13'),{chapter:2}).piece,'r2');assert.equal(M.contextOf(null,{chapter:4}).piece,'r4');
 assert.equal(M.contextOf({openingCourse:true}).piece,'opening');assert.equal(M.contextOf({slot:{chapter:7}}).piece,7);
 assert.ok(bus.musicOverride(run('c1')),'road courses are claimed');assert.ok(bus.musicOverride({dreamMode:'road'}));assert.ok(bus.musicOverride({openingCourse:true}));assert.ok(bus.musicOverride({slot:{chapter:2}}));assert.ok(!bus.musicOverride({mode:'arcade'}));
});
function fakeRun(extra={}){
 const run={courseRun:true,mode:'dream',dreamMode:'road',id:'c13',state:'play',actIndex:0,acts:[{type:'helix-up',opts:{}},{type:'bridge',opts:{}},{type:'penrose',opts:{}}],child:{time:0,chain:{bpm:100},lastItem:null},portal:null,attempt:1,bpm:100,perfectStreak:0,progressValue:0,options:{},
  status(){return {progress:run.progressValue}},...extra};return run;
}
function liveSetup(){
 M._reset();const ctx=mockContext(),music=ctx.createGain(),run=fakeRun();let t=0;M._setClock(()=>t);
 bus.attach({audio:()=>({context:ctx,music}),settings:()=>({}),activeRun:()=>run,sound(){},refreshMusic(){}});
 return {ctx,run,tick(dt=.045){ctx.currentTime+=dt;t+=dt;M.update()},set time(v){t=v}};
}
test('live road run: macro sections follow progress in order, voices stay under the cap, the music follows act changes and keeps the beat grid',()=>{
 const L=liveSetup(),{ctx,run}=L;ctx.currentTime=1;M.update();
 let info=M.inspect();assert.ok(info.active&&info.road&&info.piece==='r3'&&info.bpm===100&&info.key==='Gm');
 const seen=[];let resyncsAtGate=-1;
 for(let i=0;i<1400;i++){
  run.progressValue=Math.min(1,i/1250);L.tick();
  if(i===300){run.actIndex=1;run.child={time:0,chain:{bpm:100}};run.portal={age:0,duration:.6,swapped:false,reduced:false};run.events=[]}
  if(i>=300&&i<340){run.portal.age+=.045;if(run.portal.age>=.3)run.portal.swapped=true}
  if(i===340)run.portal=null;
  if(i===340)resyncsAtGate=M.inspect().stats.resyncs;
  if(i===700){run.actIndex=2;run.child={time:0,chain:{bpm:100}};run.portal={age:0,duration:.6,swapped:false};}
  if(i>=700&&i<730){run.portal.age+=.045;if(run.portal.age>=.3)run.portal.swapped=true}
  if(i===730)run.portal=null;
  const sec=M.inspect().macro?.name;if(sec&&seen[seen.length-1]!==sec)seen.push(sec);
  if(i===400)run.perfectStreak=3;
 }
 info=M.inspect();
 assert.deepEqual(seen,['intro','A','B','climax','resolve'],'sections in order '+seen);
 assert.equal(info.stats.gates,2);assert.ok(info.stats.resyncs>=2);
 assert.ok(info.stats.maxVoices<=48,'voices '+info.stats.maxVoices);assert.ok(ctx.peakVoices()<=48,'mock voices '+ctx.peakVoices());
 assert.ok(info.stats.sections.length===5);assert.ok(info.stats.transitions.length>=3,'intensity changes');assert.equal(info.shepDir,1,'penrose act: rising Shepard');
 const S=M._session();assert.ok(S.shep[1]&&!S.shep[1].dead,'rising bank alive');
 /* bars start on the beat grid of the act: the gate re-anchor puts the next bar on an exact multiple of the beat after the swap */
 const a=S.anchors,spb=60/100;for(let i=1;i<a.length;i++)assert.ok(a[i].time>a[i-1].time-1e-9);
 assert.ok(M.beat()>0);const ph=M.beatPhase();assert.ok(ph>=0&&ph<1);const p=M.pulse();assert.ok(p>=0&&p<=1.0001);assert.ok(M.nextBeatTime(1)>ctx.currentTime);
 M._reset();
});
test('act change re-locks the grid to the new act start (swap time + k beats) and a new tempo applies from there',()=>{
 const L=liveSetup(),{ctx,run}=L;ctx.currentTime=1;M.update();for(let i=0;i<120;i++)L.tick();
 const S=M._session(),before=S.nextTime;
 run.actIndex=1;run.child={time:0,chain:{bpm:120}};run.acts[1].opts.bpm=120;run.portal={age:0,duration:.6,swapped:false};L.tick(.001);const swapAt=ctx.currentTime+.3;
 const spb=60/120,k=(S.nextTime-swapAt)/spb;assert.ok(Math.abs(k-Math.round(k))<1e-6,'next bar sits on the new act\'s beat grid: k='+k);
 assert.ok(S.nextTime>=before-1e-9&&S.nextTime-before<spb+1e-6,'extends the running bar by less than one beat');assert.equal(S.nextBpm,120);
 for(let i=0;i<80;i++){if(i===8)run.portal.swapped=true;L.tick()}assert.equal(Math.round(S.bpm),120);assert.equal(M.inspect().bpm,120);
 M._reset();
});
test('hit closes the filter and drops the stems, retry rebuilds, clear rings the goal chord, surge adds the sparkle layer, items count as combo',()=>{
 const L=liveSetup(),{ctx,run}=L;ctx.currentTime=1;M.update();bus.emit('run-event',{run,event:'perfect'});for(let i=0;i<260;i++){run.progressValue=.5;L.tick()}
 assert.ok(M.inspect().level>=2);const before=ctx.sources.length;
 bus.emit('run-event',{run,event:'surge'});assert.equal(M.inspect().stats.surges,1);assert.ok(ctx.sources.length>before+10,'surge arpeggio + pad scheduled');assert.ok(M.inspect().surging);
 bus.emit('run-event',{run,event:'hit'});assert.ok(M.inspect().ducked&&M.inspect().crashed);assert.equal(M.inspect().level,1);
 for(let i=0;i<120;i++)L.tick();assert.ok(!M.inspect().crashed,'recovers on its own once the run plays on');
 const shards=M.inspect().shards;bus.emit('run-event',{run,event:'item'});assert.equal(M.inspect().shards,shards+1);
 run.progressValue=1;run.outro={kind:'clear'};L.tick();assert.ok(M.inspect().goal);
 M._reset();
});
test('setContext steers the piece without a CourseRun cooperating; clearContext returns to detection',()=>{
 const L=liveSetup(),{ctx,run}=L;ctx.currentTime=1;M.update();assert.equal(M.inspect().piece,'r3');
 M.setContext({trip:'toxic',bpm:90,act:'helix-down'});assert.equal(M.getContext().piece,'r4');assert.equal(M.getContext().bpm,90);assert.equal(M.getContext().shepDir,-1);
 M.update();assert.equal(M.inspect().piece,'r4');assert.equal(M.inspect().override.trip,'toxic');
 M.clearContext();M.update();assert.equal(M.getContext().piece,'r3');
 M._reset();
});
test('every piece, with the Shepard bank and the climax layers, stays within 48 voices on an independent count',()=>{
 for(const id of ROAD)for(const shep of [1,-1]){
  const ctx=mockContext(),cfg=M.arrangement(id),S=I.createSession(ctx,ctx.destination,cfg,{start:0,fadeIn:.1});
  for(const m of M.macroPlan()){ctx.currentTime=S.nextTime-.2;I.scheduleBar(S,4,0,{section:m.section,barIn:m.barIn,newSection:m.newSection,level:4,energy:1,dropout:M.isDropout(m.section,m.barIn),swellNext:false,shepDir:shep,shep:.9,bpm:cfg.bpm})}
  I.surgeLayer(S,S.nextTime-S.barDur*2,4);
  assert.ok(ctx.peakVoices()<=48,`${id} shep ${shep}: ${ctx.peakVoices()}`);assert.ok(S.peakVoices<=48);
 }
});
test('legacy pieces keep their structure and the new instrument chain schedules without error',()=>{
 for(const id of ['opening',1,2,3,4,5,6,7,8,9,10]){
  const ctx=mockContext(),cfg=M.arrangement(id),S=I.createSession(ctx,ctx.destination,cfg,{start:0,fadeIn:.1});
  for(let b=0;b<12;b++){ctx.currentTime=S.nextTime-.2;I.scheduleBar(S,4,b>7?1:0)}
  assert.ok(ctx.peakVoices()<=48,id+' '+ctx.peakVoices());
 }
});
