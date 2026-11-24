const test=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.AudioContext=function(){};
const bus=require('../src/polish-bus.js');
const SFX=require('../src/game-sfx.js');globalThis.MongyuSFX=SFX;
const M=require('../src/adaptive-music.js');
const {mockContext}=require('./r105-music-mock.cjs');
const BLUE=['b1','b2','b3','b4','b5','b8'];
function liveSetup(){
 M._reset();const ctx=mockContext(),music=ctx.createGain();let t=0;M._setClock(()=>t);
 const run={courseRun:true,mode:'dream',dreamMode:'road',id:'c13',state:'play',actIndex:0,acts:[{type:'helix-up',opts:{}},{type:'bridge',opts:{}}],child:{time:0,chain:{bpm:100}},portal:null,attempt:1,bpm:100,perfectStreak:0,progressValue:.2,options:{},status(){return {progress:run.progressValue}}};
 bus.attach({audio:()=>({context:ctx,music}),settings:()=>({}),activeRun:()=>run,sound(){},refreshMusic(){}});
 return {ctx,run,tick(dt=.045){ctx.currentTime+=dt;t+=dt;M.update()}};
}
test('blueprint chapters: tempo and instrument identity, Heartline cell, trip keys c1..c10 map to a piece',()=>{
 const want={b1:[96,'piano'],b2:[88,'musicbox'],b3:[120,'arp'],b4:[100,'piano'],b5:[76,'piano'],b8:[138,'arp']};
 for(const id of BLUE){const c=M.TRIPS[id];assert.equal(c.bpm,want[id][0],id);assert.equal(c.pluck,want[id][1],id);assert.ok(c.hline&&c.hline.b>0);assert.equal(c.loops.length,4)}
 assert.ok(M.TRIPS.b2.tape&&M.TRIPS.b8.acid&&M.TRIPS.b4.reverseTex&&M.TRIPS.b4.echoArp);assert.ok(M.TRIPS.b5.groove.some(r=>r[1]==='ding')&&M.TRIPS.b5.verb.sec>=6);
 for(let i=1;i<=10;i++)assert.ok(M.BLUE_KEYS['c'+i],'c'+i);
 const run=o=>({courseRun:true,dreamMode:'road',id:'c1',acts:[],actIndex:0,options:o});
 assert.equal(M.contextOf(run({trip:'c8'})).piece,'b8');assert.equal(M.contextOf(run({trip:'c8'})).bpm,138);assert.equal(M.contextOf(run({trip:'c5'})).piece,'b5');
 assert.equal(M.contextOf(run({trip:'violet'})).piece,'r1');assert.equal(M.contextOf(run({}),{trip:'c3'}).piece,'b3');
 for(const id of BLUE){const cfg=M.arrangement(id);
  for(const sec of ['A','B','climax']){
   const ev=M.tripBarEvents(cfg,5,{section:sec,barIn:2,level:4,energy:.5}).filter(e=>e.inst==='heart'&&e.midi&&e.at%1===0).sort((x,y)=>x.at-y.at);
   assert.equal(ev.length,3,id+' '+sec);const rot=cfg.hline.rot,slot=e=>((e.at-rot)%4+4)%4,bySlot=[...ev].sort((x,y)=>slot(x)-slot(y));assert.deepEqual(bySlot.map(slot),[0,1,2]);assert.equal(bySlot[0].midi,bySlot[2].midi);assert.notEqual(bySlot[0].midi,bySlot[1].midi);
  }
  assert.equal(M.tripBarEvents(cfg,0,{section:'intro',barIn:0,level:1}).filter(e=>e.midi&&e.inst==='heart').length,0,'no Heartline in the intro');
  const insts=new Set(M.tripBarEvents(cfg,6,{section:'climax',barIn:1,level:4,energy:1}).map(e=>e.inst));assert.ok(insts.has(cfg.arp.C.inst),id+' arp voice');
 }
});
test('fever states map onto the stems; a hit never stops the music; essential cues dip the decoration bus',()=>{
 assert.deepEqual(['NORMAL','FLOW','LUCID','OVERLOAD','RECOVERY'].map(k=>M.FEVER_LEVEL[k]),[1,2,3,4,2]);
 const L=liveSetup(),{ctx,run}=L;ctx.currentTime=1;M.update();
 for(const [f,min] of [['NORMAL',1],['FLOW',2],['LUCID',3],['OVERLOAD',4]]){run.fever={state:f};for(let i=0;i<220;i++)L.tick();assert.ok(M.inspect().level>=min,f+' '+M.inspect().level);assert.equal(M.inspect().fever,f)}
 run.fever={state:'RECOVERY'};for(let i=0;i<220;i++)L.tick();assert.ok(M.inspect().level<=2,'recovery thins the layers');
 bus.emit('run-event',{run,event:'hit'});assert.ok(M.inspect().active,'a hit never stops the music');for(let i=0;i<30;i++)L.tick();assert.ok(M.inspect().active);
 const S=M._session();let got=null;const orig=S.deco.gain.setTargetAtTime;S.deco.gain.setTargetAtTime=(v)=>{if(got===null)got=v};bus.emit('run-event',{run,event:'item'});S.deco.gain.setTargetAtTime=orig;assert.ok(got!==null&&got<1,'item cue dips decoration to '+got);
 M.setContext({fever:'lucid'});assert.equal(M.inspect().override.fever,'lucid');M._reset();
});
test('item and UI tones: every kind renders in key with silent edges, bounded peak and no DC',()=>{
 const t={tonic:7,third:3,scale:[0,3,5,7,10],step:0,variant:''};
 for(const it of SFX.ITEM_KINDS){const d=SFX.renderTuned('square-room',{...t,variant:'item:'+it},48000);assert.ok(d&&d.length>20000,it);let m=0,sum=0;for(const x of d){assert.ok(Number.isFinite(x));m=Math.max(m,Math.abs(x));sum+=x}assert.ok(m>.02&&m<.1,it+' '+m);assert.equal(d[0],0);assert.equal(d[d.length-1],0);assert.ok(Math.abs(sum/d.length)<5e-4,it+' dc')}
 const a=SFX.renderTuned('square-room',{...t,variant:'item:bubble'}),b=SFX.renderTuned('square-room',{...t,tonic:2,variant:'item:bubble'});assert.notDeepEqual(Array.from(a.slice(4000,4100)),Array.from(b.slice(4000,4100)),'pitch follows the key');
 assert.notDeepEqual(Array.from(SFX.renderTuned('square-room',{...t,variant:'item:time'}).slice(9000,9100)),Array.from(SFX.renderTuned('square-room',{...t,variant:'item:feather'}).slice(9000,9100)));
 for(const k of SFX.UI_KINDS){const d=SFX.renderUi(k,48000);let m=0;for(const x of d)m=Math.max(m,Math.abs(x));assert.ok(m>.02&&m<.06,k);assert.equal(d[0],0)}
});
test('instrument models: pitch accuracy, finite output, silent edges',()=>{
 const ac=(d,rate,lo,hi)=>{let best=-1,bl=0;const c=[];for(let L=lo-1;L<=hi+1;L++){let s=0;for(let i=0;i<d.length-L;i++)s+=d[i]*d[i+L];c[L]=s;if(L>=lo&&L<=hi&&s>best){best=s;bl=L}}const a=c[bl-1],b=c[bl],e=c[bl+1];return rate/(bl+.5*(a-e)/(a-2*b+e))};
 for(const midi of [48,60,72,84]){const f=440*2**((midi-69)/12),rate=24000,d=SFX.bowedData(f,rate,3,{});assert.ok(d.every(Number.isFinite));
  const est=ac(d.slice(24000,33000),rate,Math.floor(rate/f*.85),Math.ceil(rate/f*1.18));assert.ok(Math.abs(1200*Math.log2(est/f))<25,'bowed '+midi+' '+(1200*Math.log2(est/f)).toFixed(1)+' cents');
  const g=SFX.pluckData(f,48000,1,{decay:1.5,bright:.6,body:.8,sym:.5,pick:.2});assert.ok(g.every(Number.isFinite));const ge=ac(g.slice(2000,6000),48000,Math.floor(48000/f*.85),Math.ceil(48000/f*1.18));assert.ok(Math.abs(1200*Math.log2(ge/f))<8,'pluck '+midi)}
 for(const k of Object.keys(SFX.MEMBRANE)){const d=SFX.membraneData(k,48000,{tonic:3});assert.ok(d.every(Number.isFinite)&&d[0]===0)}
 for(const k of ['marimba','musicbox','ding','piano']){const d=SFX.voiceData(k,440,48000);assert.ok(d.every(Number.isFinite)&&d[0]===0&&Math.abs(d[d.length-1])<1e-3,k)}
 const ir=SFX.impulseData(48000,3);assert.equal(ir.length,2);assert.notDeepEqual(Array.from(ir[0].slice(5000,5050)),Array.from(ir[1].slice(5000,5050)),'stereo decorrelated');
 const sw=SFX.swellData(48000,1,{f:110});assert.ok(Math.abs(sw[0][sw[0].length-1])<1e-3&&Math.abs(sw[0][sw[0].length>>1])>Math.abs(sw[0][sw[0].length>>3]),'blooms toward the end');
});
test('blueprint pieces schedule within 48 voices with Shepard and the surge layer',()=>{
 const I=M._internals;
 for(const id of BLUE){const ctx=mockContext(),cfg=M.arrangement(id),S=I.createSession(ctx,ctx.destination,cfg,{start:0,fadeIn:.1});
  for(const m of M.macroPlan()){ctx.currentTime=S.nextTime-.2;I.scheduleBar(S,4,0,{section:m.section,barIn:m.barIn,newSection:m.newSection,level:4,energy:1,dropout:M.isDropout(m.section,m.barIn),swellNext:false,shepDir:-1,shep:.9,bpm:cfg.bpm})}
  I.surgeLayer(S,S.nextTime-S.barDur*2,4);assert.ok(ctx.peakVoices()<=48,id+' '+ctx.peakVoices())}
});
