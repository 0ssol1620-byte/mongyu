/* R104 adaptive layered music and tuned sfx. Owned by workstream H.
   One chapter = one generative-but-deterministic piece with four stems (1 바탕 pad/drone/heartbeat,
   2 리듬 percussion/pizzicato, 3 멜로디 gayageum + daegeum/haegeum-like lead, 4 절정 choir/rising strings).
   Everything is synthesized with Web Audio on the shared AudioContext and routed into host.audio().music;
   notes are scheduled bar by bar with a short lookahead on the AudioContext clock. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const LOOKAHEAD=.28,OPEN=16000,CLOSED=300,MAX_VOICES=38;
const NOTE_NAMES=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
/* Pentatonic melody scales (semitones from the tonic). pyeong ≈ 평조 (sol-mode), minor ≈ 계면조, yo = suspended minor. */
const SCALES=Object.freeze({major:[0,2,4,7,9],pyeong:[0,2,5,7,9],minor:[0,3,5,7,10],yo:[0,2,5,7,10]});
const MINOR=Object.freeze({major:false,pyeong:false,minor:true,yo:true});
/* Chords: bass offset + colour tones (pitch classes relative to the tonic). */
const CHORDS=Object.freeze({
 I9:{b:0,p:[4,7,11,2]},ii9:{b:2,p:[5,9,0,4]},iii7:{b:4,p:[7,11,2]},IVmaj7:{b:5,p:[9,0,4,7]},V9sus:{b:7,p:[0,2,5,9]},vi9:{b:9,p:[0,4,7,11]},
 i9:{b:0,p:[3,7,10,2]},iv9:{b:5,p:[8,0,3,7]},v7:{b:7,p:[10,2,5]},III7:{b:3,p:[7,10,2]},VI7:{b:8,p:[0,3,7]},VIIsus:{b:10,p:[3,5,0]}
});
/* Arrangement per chapter. loops[section] is a 4-bar chord loop; shift[section] transposes the key (semitones).
   Sections: 1st memory floor/wall/ceiling; native memories rotate with map changes. */
const ARRANGEMENTS=Object.freeze({
 opening:{title:'접힌 빛',pc:2,mode:'major',bpm:100,seed:104,lead:'daegeum',pizz:[0,6,8,12],loops:[['I9','vi9','IVmaj7','V9sus'],['vi9','IVmaj7','I9','V9sus'],['IVmaj7','I9','vi9','V9sus']],shift:[0,0,2]},
 1:{title:'낯선 곳',pc:2,mode:'pyeong',bpm:96,seed:11,lead:'daegeum',pizz:[0,4,8,12],loops:[['I9','IVmaj7','vi9','V9sus'],['vi9','IVmaj7','I9','V9sus'],['IVmaj7','V9sus','I9','vi9']],shift:[0,0,2]},
 2:{title:'아픈 네모',pc:9,mode:'minor',bpm:100,seed:23,lead:'haegeum',pizz:[0,3,6,10,12],loops:[['i9','VI7','III7','VIIsus'],['VI7','VIIsus','i9','i9'],['iv9','VI7','i9','VIIsus']],shift:[0,0,2]},
 3:{title:'솔과 함께',pc:7,mode:'major',bpm:104,seed:37,lead:'daegeum',pizz:[0,6,8,14],loops:[['I9','iii7','IVmaj7','V9sus'],['vi9','iii7','IVmaj7','V9sus'],['IVmaj7','V9sus','vi9','I9']],shift:[0,0,2]},
 4:{title:'흐르는 시간',pc:4,mode:'minor',bpm:98,seed:41,lead:'haegeum',pizz:[0,4,8,10],loops:[['i9','iv9','VI7','VIIsus'],['VI7','III7','iv9','v7'],['i9','VI7','iv9','VIIsus']],shift:[0,0,2]},
 5:{title:'담의 다정함',pc:5,mode:'major',bpm:92,seed:53,lead:'daegeum',pizz:[0,6,8,12],loops:[['I9','ii9','IVmaj7','V9sus'],['IVmaj7','I9','ii9','V9sus'],['vi9','ii9','V9sus','I9']],shift:[0,0,2]},
 6:{title:'닿지 않는 연락',pc:1,mode:'yo',bpm:100,seed:67,lead:'haegeum',pizz:[0,3,6,10,12],loops:[['i9','VI7','iv9','VIIsus'],['VI7','VIIsus','III7','i9'],['iv9','i9','VI7','VIIsus']],shift:[0,0,2]},
 7:{title:'여울',pc:9,mode:'major',bpm:108,seed:71,lead:'daegeum',pizz:[0,3,6,8,12,14],loops:[['I9','vi9','ii9','V9sus'],['IVmaj7','V9sus','iii7','vi9'],['I9','IVmaj7','ii9','V9sus']],shift:[0,0,2]},
 8:{title:'이별을 말하다',pc:6,mode:'minor',bpm:96,seed:83,lead:'haegeum',pizz:[0,4,8,12],loops:[['i9','III7','VI7','v7'],['VI7','VIIsus','i9','III7'],['iv9','VI7','v7','i9']],shift:[0,0,2]},
 9:{title:'혼자 달리는 밤',pc:2,mode:'yo',bpm:90,seed:97,lead:'daegeum',pizz:[0,6,8,12],loops:[['i9','VIIsus','VI7','iv9'],['VI7','iv9','i9','VIIsus'],['III7','VI7','VIIsus','i9']],shift:[0,0,2]},
 10:{title:'작별',pc:3,mode:'pyeong',bpm:94,seed:101,lead:'daegeum',pizz:[0,4,8,12],loops:[['IVmaj7','I9','vi9','V9sus'],['vi9','IVmaj7','V9sus','I9'],['ii9','V9sus','IVmaj7','I9']],shift:[0,0,2]}
});
const PLANS=[['pluck','pluck','lead','pluck','lead','lead','pluck','lead'],['lead','pluck','pluck','lead','pluck','pluck','lead','lead']];
const RHYTHMS=Object.freeze({
 pluck:[[[0,1],[1,.5],[1.5,1.5],[3,1]],[[0,.75],[.75,.75],[1.5,1],[2.5,1.5]],[[0,1.5],[1.5,.5],[2,2]],[[0,.5],[.5,.5],[1,1],[2,.5],[2.5,1.5]]],
 lead:[[[0,3],[3,1]],[[0,4]],[[.5,1.5],[2,2]],[[0,2],[2,1],[3,1]]]
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mtof=m=>440*Math.pow(2,(m-69)/12);
function prng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

/* ---------- pure arrangement (deterministic; shared by the live scheduler, offline renderer and tests) ---------- */
function arrangement(id){return ARRANGEMENTS[id]||ARRANGEMENTS[1]}
function chapterOf(run){
 if(!run)return null;if(run.openingCourse)return 'opening';
 const n=Number(run.slot?.chapter)||Math.floor(((Number(run.slot?.number)||1)-1)/10)+1;return clamp(n|0,1,10);
}
function keyOf(cfg,section=0){
 const s=((section%3)+3)%3,tonic=(cfg.pc+(cfg.shift[s]||0))%12,minor=MINOR[cfg.mode];
 return {tonic,name:NOTE_NAMES[tonic]+(minor?'m':''),mode:cfg.mode,minor,third:minor?3:4,scale:SCALES[cfg.mode]};
}
function chordAt(cfg,section,bar){
 const s=((section%3)+3)%3,loop=cfg.loops[s]||cfg.loops[0],c=CHORDS[loop[((bar%4)+4)%4]],key=keyOf(cfg,s);
 return {name:loop[((bar%4)+4)%4],bass:(key.tonic+c.b)%12,pcs:c.p.map(p=>(key.tonic+p)%12),key};
}
function chordSet(ch){return new Set([ch.bass,...ch.pcs])}
/* A melody pitch class is safe over a chord unless it sits a semitone from a chord tone it is not itself. */
function safe(pc,ch){const set=chordSet(ch);if(set.has(pc))return true;for(const c of set){const d=(pc-c+12)%12;if(d===1||d===11)return false}return true}
function place(pc,lo,hi,center){let best=null;for(let m=lo;m<=hi;m++)if(((m%12)+12)%12===pc&&(best===null||Math.abs(m-center)<Math.abs(best-center)))best=m;return best}
function voicing(pcs,lo,hi,center,count){
 const out=[];for(const pc of pcs.slice(0,count)){let m=place(pc,lo,hi,center);while(out.includes(m))m+=12;if(m!==null&&m<=hi+12)out.push(m)}return out.sort((a,b)=>a-b);
}
const phraseCache=new Map();
/* 8-bar melody phrase: gayageum plucks (call) and daegeum/haegeum long tones (answer), stepwise pentatonic contour. */
function phrase(cfg,section,variant){
 const id=cfg.seed+':'+section+':'+variant;if(phraseCache.has(id))return phraseCache.get(id);
 const key=keyOf(cfg,section),scale=key.scale,base=60+key.tonic-(key.tonic>=6?12:0),random=prng(cfg.seed*977+section*131+variant*7919);
 const midiOf=d=>base+scale[((d%5)+5)%5]+12*Math.floor(d/5),pcOf=d=>((midiOf(d)%12)+12)%12;
 const plan=PLANS[variant%2],events=[];let d=5;
 for(let bar=0;bar<8;bar++){
  const ch=chordAt(cfg,section,bar),type=plan[bar],pool=RHYTHMS[type],rhythm=pool[Math.floor(random()*pool.length)],lo=type==='lead'?2:3,hi=type==='lead'?8:9;
  rhythm.forEach(([at,dur],k)=>{
   const last=bar===7&&k===rhythm.length-1;
   if(last){let best=d,score=1e9;for(let x=lo;x<=hi;x++){const pc=pcOf(x);if(pc!==key.tonic&&pc!==(key.tonic+7)%12)continue;const s=Math.abs(x-d);if(s<score){score=s;best=x}}d=best}
   else if(k===0){let best=d,score=1e9;for(let x=lo;x<=hi;x++){const pc=pcOf(x);if(!ch.pcs.includes(pc)&&pc!==ch.bass)continue;const s=Math.abs(x-d)+random()*.6;if(s<score){score=s;best=x}}d=best}
   else{
    const bias=bar<4?.1:-.1,r=clamp(random()+bias,0,.999);let step=r<.14?-2:r<.46?-1:r<.52?0:r<.86?1:2;
    if(d+step>hi||d+step<lo)step=-step;
    let next=clamp(d+step,lo,hi),tries=0;while(!safe(pcOf(next),ch)&&tries++<4)next=clamp(next+(step>=0?1:-1),lo,hi);
    if(!safe(pcOf(next),ch)){for(let x=lo;x<=hi;x++)if(safe(pcOf(x),ch)&&Math.abs(x-d)<=2){next=x;break}}
    d=next;
   }
   const inst=type==='pluck'?'gayageum':cfg.lead;
   events.push({bar,at,dur,midi:midiOf(d),inst,vel:type==='pluck'?(k===0?.95:.72+random()*.2):.85,bend:type==='pluck'?dur>=1&&random()<.45:random()<.6,vib:dur>=1.5});
  });
 }
 const out=Object.freeze(events.map(Object.freeze));phraseCache.set(id,out);return out;
}
/* All note events of one bar for stems 1..level. at/dur are in beats from the bar start. */
function barEvents(cfg,bar,section=0,level=1,options={}){
 const ch=chordAt(cfg,section,bar),key=ch.key,events=[],random=prng(cfg.seed*31+bar*17+section*5);
 const pad=voicing(ch.pcs,52,71,61,4),bass=place(ch.bass,38,49,43);
 events.push({stem:1,inst:'pad',at:0,dur:4,midis:pad,vel:1});
 events.push({stem:1,inst:'bass',at:0,dur:4,midi:bass,vel:1});
 events.push({stem:1,inst:'kick',at:0,dur:.5,vel:1},{stem:1,inst:'kick',at:.25,dur:.5,vel:.55},{stem:1,inst:'kick',at:2,dur:.5,vel:.42});
 if(level>=2){
  [.5,.25,.35,.22,.45,.25,.35,.3].forEach((v,i)=>events.push({stem:2,inst:'shaker',at:i*.5,dur:.25,vel:v}));
  if(bar%2===1)events.push({stem:2,inst:'shaker',at:3.75,dur:.25,vel:.18});
  events.push({stem:2,inst:'wood',at:1,dur:.25,vel:.55},{stem:2,inst:'wood',at:3,dur:.25,vel:.5});
  if(bar%2===1)events.push({stem:2,inst:'buk',at:3.5,dur:.5,vel:.7});
  const tones=voicing([ch.bass,...ch.pcs],55,72,64,4);
  cfg.pizz.forEach((s,i)=>events.push({stem:2,inst:'pizz',at:s/4,dur:.5,midi:tones[(i+bar)%tones.length],vel:i===0?.9:.65+random()*.2}));
 }
 if(level>=3){
  const variant=Math.floor(bar/8)%2;
  for(const e of phrase(cfg,section,variant))if(e.bar===((bar%8)+8)%8)events.push({stem:3,...e,bar:undefined});
 }
 if(level>=4){
  events.push({stem:4,inst:'choir',at:0,dur:4,midis:voicing(ch.pcs,62,79,70,3),vel:1});
  if(bar%2===0){
   const scale=key.scale,next=chordAt(cfg,section,bar+1),base=48+key.tonic,line=[];
   let d=7;for(let x=6;x<=9;x++){const pc=(key.tonic+scale[x%5])%12;if(ch.pcs.includes(pc)||pc===ch.bass){d=x;break}}
   for(let beat=0;beat<8;beat++){const over=beat<4?ch:next;let tries=0;while(!safe((key.tonic+scale[d%5])%12,over)&&tries++<3)d++;line.push(base+scale[d%5]+12*Math.floor(d/5));d++}
   events.push({stem:4,inst:'strings',at:0,dur:8,line,vel:1});
  }
 }
 if(options.goal)events.length=0;
 return events;
}
function goalEvents(cfg,section=0){
 const key=keyOf(cfg,section),t=key.tonic,third=key.third;
 return [{inst:'goal-bass',midi:place(t,36,47,40),at:0},{inst:'goal-pad',midis:[48+t,55+t,48+t+12+third,62+t,67+t].map(m=>m>79?m-12:m),at:0},
  {inst:'goal-bell',midis:[72+t,72+t+third,79+t,84+t,86+t].map(m=>m>91?m-12:m),at:0}];
}

/* ---------- Web Audio voices ---------- */
const shared=new WeakMap();
function resources(ctx){
 let r=shared.get(ctx);if(r)return r;
 const rate=ctx.sampleRate||48000,noise=ctx.createBuffer(1,rate,rate),data=noise.getChannelData(0),random=prng(9001);
 for(let i=0;i<data.length;i++)data[i]=random()*2-1;
 const wave=(h)=>{const real=new Float32Array(h.length+1),imag=new Float32Array(h.length+1);h.forEach((a,i)=>{imag[i+1]=a});return ctx.createPeriodicWave(real,imag)};
 /* Reverb impulse: stereo decorrelated noise, exponential decay, darkening over time. */
 const len=Math.floor(rate*1.9),ir=ctx.createBuffer(2,len,rate);
 for(let c=0;c<2;c++){const ch=ir.getChannelData(c),rnd=prng(77+c);let lp=0;for(let i=0;i<len;i++){const t=i/rate,k=.9*Math.exp(-t*1.6)+.05;lp+=(rnd()*2-1-lp)*k;ch[i]=lp*Math.exp(-t/.42)*(i<rate*.012?i/(rate*.012):1)}}
 r={noise,ir,soft:wave([1,.28,.1,.04,.015]),reed:wave([1,.5,.32,.18,.12,.07,.05,.03]),plucks:new Map()};shared.set(ctx,r);return r;
}
function pluckBuffer(ctx,kind,midi){
 const r=resources(ctx),id=kind+':'+midi;if(r.plucks.has(id))return r.plucks.get(id);
 const SFX=root.MongyuSFX,rate=ctx.sampleRate||48000;if(!SFX?.pluckData)return null;
 const g=kind==='gayageum',data=SFX.pluckData(mtof(midi),rate,g?2.2:.7,{decay:g?1.5:.42,bright:g?.62:.5,seed:midi*7+(g?1:2)});
 let peak=0;for(const x of data)peak=Math.max(peak,Math.abs(x));const k=peak?1/peak:0,fade=Math.round(rate*.04);
 for(let i=0;i<data.length;i++)data[i]*=k*(i<rate*.0015?i/(rate*.0015):1)*(i>data.length-fade?(data.length-i)/fade:1);
 const b=ctx.createBuffer(1,data.length,rate);if(b.copyToChannel)b.copyToChannel(data,0);else b.getChannelData(0).set(data);
 if(r.plucks.size>160)r.plucks.clear();r.plucks.set(id,b);return b;
}
/* Session = one live (or offline) graph: stems -> sum -> duck low-pass -> master -> compressor -> out -> music bus. */
function createSession(ctx,destination,cfg,{bar0=0,start,fadeIn=1.2,closed=false,section=0}={}){
 const r=resources(ctx),t0=start??ctx.currentTime+.08,spb=60/cfg.bpm;
 const S={ctx,cfg,r,spb,barDur:spb*4,t0,bar0,nextBar:bar0,nextTime:t0,section,level:0,ducked:false,goal:false,spans:[],scheduled:0,nodes:new Set(),upper:[],stopped:false,bass:null};
 const node=n=>{S.nodes.add(n);return n};
 S.out=node(ctx.createGain());S.out.gain.value=.55;/* compensates the compressor's automatic makeup gain (≈+4.3 dB at these settings) */
 S.comp=node(ctx.createDynamicsCompressor());
 const c=S.comp;c.threshold.value=-8;c.knee.value=3;c.ratio.value=10;c.attack.value=.003;c.release.value=.2;
 S.master=node(ctx.createGain());S.master.gain.value=0;S.master.gain.setValueAtTime(0,t0-.05);S.master.gain.linearRampToValueAtTime(1,t0+fadeIn);
 S.duck=node(ctx.createBiquadFilter());S.duck.type='lowpass';S.duck.Q.value=.6;S.duck.frequency.setValueAtTime(closed?CLOSED:OPEN,ctx.currentTime);S.ducked=closed;
 S.sum=node(ctx.createGain());
 S.verbIn=node(ctx.createGain());const hp=node(ctx.createBiquadFilter());hp.type='highpass';hp.frequency.value=240;
 S.verb=node(ctx.createConvolver());S.verb.buffer=r.ir;S.verbOut=node(ctx.createGain());S.verbOut.gain.value=.55;
 S.verbIn.connect(hp);hp.connect(S.verb);S.verb.connect(S.verbOut);S.verbOut.connect(S.duck);
 S.sum.connect(S.duck);S.duck.connect(S.master);S.master.connect(S.comp);S.comp.connect(S.out);S.out.connect(destination);
 S.stemLevels=[.9,.72,.7,.62];S.sends=[.4,.22,.5,.6];
 S.stems=[0,1,2,3].map(i=>{const g=node(ctx.createGain()),send=node(ctx.createGain());g.gain.value=0;send.gain.value=S.sends[i];g.connect(S.sum);g.connect(send);send.connect(S.verbIn);return g});
 S.goalBus=node(ctx.createGain());S.goalBus.gain.value=1;S.goalBus.connect(S.sum);const gs=node(ctx.createGain());gs.gain.value=.6;S.goalBus.connect(gs);gs.connect(S.verbIn);
 return S;
}
/* Voices are counted by their scheduled [start,end) span, so the cap also holds while scheduling ahead (and offline). */
function track(S,src,stem,at,end,offset=0){
 const span=[at,end];S.spans.push(span);S.scheduled++;S.nodes.add(src);
 src.onended=()=>{S.nodes.delete(src);try{src.disconnect()}catch(_){}};
 if(stem>=2)S.upper.push({src,at,stem,span});
 try{if(offset)src.start(at,offset);else src.start(at);src.stop(end)}catch(_){}
}
function voicesAt(S,t){let n=0;for(const [a,z] of S.spans)if(a<=t+.001&&z>t)n++;return n}
function canVoice(S,priority,t){return voicesAt(S,t)<(priority?MAX_VOICES:MAX_VOICES-8)}
function env(param,t,peak,attack,hold,release){param.setValueAtTime(0,t);param.linearRampToValueAtTime(peak,t+attack);param.setValueAtTime(peak,t+Math.max(attack,hold));param.setTargetAtTime(0,t+Math.max(attack,hold),release/4)}
/* Envelope gains start at 0: a default gain of 1 lets the first frame of a source through before setValueAtTime applies. */
function zg(ctx){const g=ctx.createGain();g.gain.value=0;return g}
function play(S,e,t,dest){
 const ctx=S.ctx,spb=S.spb,dur=(e.dur||1)*spb;
 switch(e.inst){
  case 'pad':{if(!canVoice(S,true,t))return;const g=zg(ctx),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1100;lp.Q.value=.2;env(g.gain,t,.0245*e.vel,.9,dur,1.8);lp.connect(g);g.connect(dest);
   e.midis.forEach((m,i)=>{const o=ctx.createOscillator();o.setPeriodicWave(S.r.soft);o.frequency.value=mtof(m);o.detune.value=(i%2?5:-5)+((m*37)%7-3);o.connect(lp);track(S,o,e.stem,t,t+dur+1.9,true)});break}
  case 'bass':{
   if(!S.bass||S.curBar%16===0&&S.bass.from<t-.05){if(!canVoice(S,true,t))return;
    if(S.bass){const old=S.bass;try{old.g.gain.cancelScheduledValues(t);old.g.gain.setTargetAtTime(0,t,.25);old.o.stop(t+2);old.o2.stop(t+2)}catch(_){}}
    const o=ctx.createOscillator(),o2=ctx.createOscillator(),lp=ctx.createBiquadFilter(),g=zg(ctx),g2=zg(ctx);o.type='sine';o2.type='triangle';lp.type='lowpass';lp.frequency.value=380;
    o.frequency.setValueAtTime(mtof(e.midi),t);o2.frequency.setValueAtTime(mtof(e.midi+12),t);g2.gain.value=.22;o.connect(g);o2.connect(g2);g2.connect(lp);lp.connect(g);g.connect(dest);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.043,t+.6);
    S.bass={o,o2,g,from:t};track(S,o,1,t,t+600,true);track(S,o2,1,t,t+600,true);
   }else{for(const [osc,m] of [[S.bass.o,e.midi],[S.bass.o2,e.midi+12]])osc.frequency.setTargetAtTime(mtof(m),t,.09)}
   break}
  case 'kick':{if(!canVoice(S,true,t))return;const o=ctx.createOscillator(),g=zg(ctx),o2=ctx.createOscillator(),g2=zg(ctx);o.type='sine';o2.type='sine';
   o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(42,t+.13);o2.frequency.setValueAtTime(140,t);o2.frequency.exponentialRampToValueAtTime(84,t+.13);
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.148*e.vel,t+.006);g.gain.setTargetAtTime(0,t+.01,.085);g2.gain.value=.22;o.connect(g);o2.connect(g2);g2.connect(g);g.connect(dest);
   track(S,o,e.stem,t,t+.55,true);track(S,o2,e.stem,t,t+.55,true);break}
  case 'shaker':{if(!canVoice(S,false,t))return;const src=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),g=zg(ctx);src.buffer=S.r.noise;hp.type='highpass';hp.frequency.value=6500;
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.19*e.vel,t+.004);g.gain.setTargetAtTime(0,t+.006,.022);src.connect(hp);hp.connect(g);g.connect(dest);
   track(S,src,e.stem,t,t+.16,(t*7.919)%.8);break}
  case 'wood':{if(!canVoice(S,false,t))return;const o=ctx.createOscillator(),g=zg(ctx);o.type='triangle';o.frequency.setValueAtTime(mtof(84+S.key.tonic),t);o.frequency.exponentialRampToValueAtTime(mtof(79+S.key.tonic),t+.03);
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22*e.vel,t+.002);g.gain.setTargetAtTime(0,t+.003,.016);o.connect(g);g.connect(dest);track(S,o,e.stem,t,t+.14);break}
  case 'buk':{if(!canVoice(S,false,t))return;const o=ctx.createOscillator(),g=zg(ctx);o.type='sine';o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(88,t+.12);
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.27*e.vel,t+.005);g.gain.setTargetAtTime(0,t+.01,.08);o.connect(g);g.connect(dest);track(S,o,e.stem,t,t+.5);break}
  case 'pizz':case 'gayageum':{if(!canVoice(S,e.inst==='gayageum',t))return;const b=pluckBuffer(ctx,e.inst,e.midi);if(!b)return;const src=ctx.createBufferSource(),g=zg(ctx);src.buffer=b;
   const peak=e.inst==='pizz'?.27*e.vel:.5*e.vel;g.gain.setValueAtTime(peak,t);
   if(e.inst==='gayageum'){
    if(e.bend&&src.detune){src.detune.setValueAtTime(-90,t);src.detune.setTargetAtTime(0,t+.01,.035)}
    if(e.vib&&src.detune){const lfo=ctx.createOscillator(),depth=zg(ctx);lfo.frequency.value=5.2;depth.gain.setValueAtTime(0,t);depth.gain.linearRampToValueAtTime(16,t+dur*.6);lfo.connect(depth);depth.connect(src.detune);track(S,lfo,e.stem,t,t+2.2)}
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(5200,t);lp.frequency.setTargetAtTime(1800,t+.02,.3);src.connect(lp);lp.connect(g);
   }else src.connect(g);
   g.connect(dest);track(S,src,e.stem,t,t+b.duration);break}
  case 'daegeum':case 'haegeum':{if(!canVoice(S,true,t))return;const h=e.inst==='haegeum',f=mtof(e.midi),o=ctx.createOscillator(),g=zg(ctx),lp=ctx.createBiquadFilter();
   if(h){o.setPeriodicWave(S.r.reed)}else o.type='triangle';
   o.frequency.value=f;lp.type='lowpass';lp.frequency.value=h?2400:2800;lp.Q.value=h?1.4:.4;const len=Math.max(.25,dur*.96);
   const peak=(h?.11:.144)*e.vel;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+(h?.09:.12));g.gain.setTargetAtTime(peak*.82,t+.15,.3);g.gain.setTargetAtTime(0,t+len,.12);
   if(e.bend){o.detune.setValueAtTime(h?-140:-60,t);o.detune.setTargetAtTime(0,t+.01,h?.06:.04)}
   const lfo=ctx.createOscillator(),depth=zg(ctx);lfo.frequency.value=h?5.6:4.8;depth.gain.setValueAtTime(0,t);depth.gain.linearRampToValueAtTime(e.vib?(h?22:14):6,t+Math.min(.6,len));lfo.connect(depth);depth.connect(o.detune);
   o.connect(lp);lp.connect(g);g.connect(dest);track(S,o,e.stem,t,t+len+.6,true);track(S,lfo,e.stem,t,t+len+.6,true);
   if(!h){const n=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),ng=zg(ctx);n.buffer=S.r.noise;n.loop=true;bp.type='bandpass';bp.frequency.value=Math.min(6000,f*2.2);bp.Q.value=2.2;
    ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*.55,t+.05);ng.gain.setTargetAtTime(peak*.16,t+.08,.12);ng.gain.setTargetAtTime(0,t+len,.1);n.connect(bp);bp.connect(ng);ng.connect(dest);track(S,n,e.stem,t,t+len+.5)}
   break}
  case 'choir':{if(!canVoice(S,false,t))return;const g=zg(ctx),f1=ctx.createBiquadFilter(),f2=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter();
   f1.type='bandpass';f1.frequency.value=720;f1.Q.value=2.5;f2.type='bandpass';f2.frequency.value=1150;f2.Q.value=3;lp.type='lowpass';lp.frequency.value=2600;
   f1.connect(g);f2.connect(g);g.connect(lp);lp.connect(dest);env(g.gain,t,.062,1.1,dur,1.6);
   e.midis.forEach((m,i)=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=i%2?9:-8;o.connect(f1);o.connect(f2);track(S,o,e.stem,t,t+dur+1.7)});break}
  case 'strings':{if(!canVoice(S,false,t))return;const g=zg(ctx),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(900,t);lp.frequency.linearRampToValueAtTime(2600,t+dur);lp.Q.value=.5;
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.029,t+spb);g.gain.linearRampToValueAtTime(.065,t+dur-spb*.5);g.gain.setTargetAtTime(0,t+dur-spb*.3,.25);lp.connect(g);g.connect(dest);
   for(const det of [-7,8]){const o=ctx.createOscillator();o.type='sawtooth';o.detune.value=det;e.line.forEach((m,i)=>{if(i===0)o.frequency.setValueAtTime(mtof(m),t);else o.frequency.setTargetAtTime(mtof(m),t+i*spb,.03)});o.connect(lp);track(S,o,e.stem,t,t+dur+1)}
   break}
  case 'goal-bass':{const o=ctx.createOscillator(),g=zg(ctx);o.type='sine';o.frequency.value=mtof(e.midi);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.08);g.gain.setTargetAtTime(0,t+.4,1.1);o.connect(g);g.connect(dest);track(S,o,0,t,t+5.5,true);break}
  case 'goal-pad':{const g=zg(ctx),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.042,t+.18);g.gain.setTargetAtTime(0,t+.6,1.2);lp.connect(g);g.connect(dest);
   e.midis.forEach((m,i)=>{const o=ctx.createOscillator();o.setPeriodicWave(S.r.soft);o.frequency.value=mtof(m);o.detune.value=i%2?4:-4;o.connect(lp);track(S,o,0,t,t+6,true)});break}
  case 'goal-bell':{e.midis.forEach((m,i)=>{const at=t+i*.06;for(const [ratio,amp,tau] of [[1,.05,.9],[4,.011,.25]]){const o=ctx.createOscillator(),g=zg(ctx);o.type='sine';o.frequency.value=mtof(m)*ratio;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(amp,at+.004);g.gain.setTargetAtTime(0,at+.006,tau);o.connect(g);g.connect(dest);track(S,o,0,at,at+tau*7,true)}});break}
 }
}
function setStem(S,i,value,t,tc){const p=S.stems[i].gain;try{p.cancelScheduledValues(t)}catch(_){}p.setTargetAtTime(value,t,tc)}
function scheduleBar(S,level,section){
 const t=S.nextTime,bar=S.nextBar;S.curBar=bar;S.section=section;S.key=keyOf(S.cfg,section);
 if(!S.goal){
  for(let i=0;i<4;i++)setStem(S,i,i<level?S.stemLevels[i]:0,t,i<level?S.spb*.3:S.spb*.5);
  S.level=level;
  for(const e of barEvents(S.cfg,bar,section,level))if(!S.only||S.only.includes(e.inst))play(S,e,t+e.at*S.spb,S.stems[e.stem-1]);
 }
 const now=S.ctx.currentTime;S.upper=S.upper.filter(u=>u.at>now-.05);S.spans=S.spans.filter(z=>z[1]>now);
 S.nextBar++;S.nextTime+=S.barDur;return {bar,time:t,level};
}
/* Crash: low-pass sweeps closed in ~120ms, upper stems drop, not-yet-started upper notes are cancelled. */
function duck(S,t){
 const f=S.duck.frequency;try{if(f.cancelAndHoldAtTime)f.cancelAndHoldAtTime(t);else{f.cancelScheduledValues(t);f.setValueAtTime(S.ducked?CLOSED:OPEN,t)}}catch(_){}
 f.exponentialRampToValueAtTime(CLOSED,t+.12);S.ducked=true;
 for(let i=1;i<4;i++)setStem(S,i,0,t,.04);setStem(S,0,S.stemLevels[0]*.8,t,.08);
 for(const u of S.upper)if(u.at>t+.01){try{u.src.stop(t)}catch(_){}u.span[1]=t}
 S.upper=[];S.level=1;
}
function rebuild(S,t){
 const f=S.duck.frequency;try{f.cancelScheduledValues(t)}catch(_){}f.setValueAtTime(CLOSED,t);f.exponentialRampToValueAtTime(OPEN,t+S.barDur);S.ducked=false;
}
/* Goal: rhythm/melody stems fade out, the tonic resolution chord rings on its own bus. */
function goalChord(S,t,section){
 if(S.goal)return;S.goal=true;
 const f=S.duck.frequency;try{f.cancelScheduledValues(t)}catch(_){}f.setValueAtTime(S.ducked?CLOSED:OPEN,t);if(S.ducked)f.exponentialRampToValueAtTime(OPEN,t+.25);S.ducked=false;
 for(let i=0;i<4;i++)setStem(S,i,0,t,i===0?.35:.12);
 for(const u of S.upper)if(u.at>t+.01){try{u.src.stop(t)}catch(_){}u.span[1]=t}
 for(const e of goalEvents(S.cfg,section))play(S,e,t+e.at,S.goalBus);
}
function disposeSession(S,fade=0){
 if(!S||S.stopped)return;S.stopped=true;const ctx=S.ctx,t=ctx.currentTime;
 const hold=fade>=2?1:0;try{S.master.gain.cancelScheduledValues(t);if(fade>0){S.master.gain.setValueAtTime(S.master.gain.value,t);S.master.gain.setTargetAtTime(0,t+hold,fade/4)}else S.master.gain.setValueAtTime(0,t)}catch(_){}
 const kill=()=>{for(const n of S.nodes){try{if(n.stop)n.stop()}catch(_){}try{n.onended=null}catch(_){}try{n.disconnect()}catch(_){}}S.nodes.clear();S.spans=[]};
 S.kill=kill;if(fade>0){S.killAt=t+hold+fade+.1;if(typeof setTimeout==='function'){const id=setTimeout(()=>{if(!S.done){S.done=true;kill()}},(hold+fade+.4)*1000);id?.unref?.()}}else kill();
}

/* ---------- live controller ---------- */
const bus=root.MongyuPolish;
let session=null,lingering=[],timer=null,clockOverride=null,lastResume=0;
const M={run:null,chapter:null,cfg:null,section:0,applied:0,jumpOk:false,jumpAt:null,shards:0,melody:false,climax:false,crashed:false,crashedAt:0,recover:false,bar:0,goal:false,jumpStep:0,lastJump:-9,lastEnd:null,warm:[],stats:{bars:0,notes:0,ducks:0,rebuilds:0,goals:0,sessions:0,transitions:[]}};
const now=()=>clockOverride?clockOverride():(root.performance?.now?.()??Date.now())/1000;
const hostOf=()=>bus?.host||null;
function hidden(){try{return !!root.document?.hidden}catch(_){return false}}
function supported(){return !!(root.AudioContext||root.webkitAudioContext)}
function sectionOf(run){return run.openingCourse?clamp(run.mapChanges|0,0,2):((run.mapChanges|0)%3)}
function progressOf(run){
 if(run.openingCourse){const O=root.MongyuOpening;if(!O)return 0;
  if(run.practice){const end=O.OBSTACLES[Math.max(0,(run.endIndex|0)-1)];const start=O.OBSTACLES[run.firstIndex|0];return end&&start?clamp((run.distance-(start.at-120))/(end.at+30-(start.at-120)),0,1):0}
  return clamp(run.distance/O.FINISH,0,1)}
 try{return Number(run.status?.().progress)||0}catch(_){return 0}
}
function desired(run){
 const melody=M.melody||M.shards>=3||(run.perfectStreak|0)>=2,climax=M.climax||progressOf(run)>=.8;
 if(melody)M.melody=true;if(climax)M.climax=true;
 let level=1;if(M.jumpOk||M.melody||M.climax)level=2;if(M.melody||M.climax)level=3;if(M.climax)level=4;
 if(run.boss)level=Math.max(level,2);
 return M.crashed?1:level;
}
function beginRun(run){
 const recentCrash=M.lastEnd&&M.lastEnd.kind==='crash'&&now()-M.lastEnd.at<45&&M.chapter===chapterOf(run);
 endSession(0);
 Object.assign(M,{run,chapter:chapterOf(run),section:sectionOf(run),jumpOk:false,jumpAt:null,shards:0,melody:false,climax:false,crashed:false,recover:false,bar:0,goal:false,jumpStep:0,lastJump:-9,rebuildStart:!!recentCrash});
 M.cfg=arrangement(M.chapter);M.applied=M.section;queueWarm();
}
function endRun(){endSession(.25);M.run=null;M.chapter=null;M.cfg=null;M.warm=[]}
function endSession(fade){
 if(session){M.bar=session.nextBar;disposeSession(session,fade);if(fade>0)lingering.push(session);session=null}
 if(timer){clearInterval(timer);timer=null}
}
function crash(){
 M.crashed=true;M.crashedAt=now();M.recover=false;M.jumpStep=0;M.lastJump=-9;M.jumpAt=null;M.stats.ducks++;
 if(session&&!session.goal)duck(session,session.ctx.currentTime);
}
function goal(){
 if(M.goal)return;M.goal=true;M.stats.goals++;
 if(session){const S=session,t=S.ctx.currentTime,eighth=S.spb/2,k=Math.ceil((t+.03-S.t0)/eighth);goalChord(S,S.t0+k*eighth,M.applied)}
}
function ensureSession(host,run){
 const audio=host.audio?.();if(!audio||!audio.context||!audio.music){endSession(0);return}
 const s=host.settings?.()||{};if(s.mute||Number(s.musicVolume)<=0){endSession(0);return}
 const ctx=audio.context;if(session&&session.ctx!==ctx)endSession(0);
 if(!session){
  session=createSession(ctx,audio.music,M.cfg,{bar0:M.bar,fadeIn:M.bar>0?.5:1.4,closed:M.rebuildStart||M.crashed,section:M.applied});
  if(M.rebuildStart){M.rebuildStart=false;rebuild(session,session.t0);M.stats.rebuilds++}
  M.stats.sessions++;
  if(!timer&&typeof setInterval==='function'){timer=setInterval(update,45);timer?.unref?.()}
 }
 if(ctx.state==='suspended'&&now()-lastResume>.5){lastResume=now();try{Promise.resolve(ctx.resume()).catch(()=>{})}catch(_){}}
}
function pump(run){
 const S=session;if(!S||S.goal)return;
 while(S.nextTime<S.ctx.currentTime+LOOKAHEAD){
  if(M.crashed&&M.recover){M.crashed=false;M.recover=false;if(S.ducked){rebuild(S,S.nextTime);M.stats.rebuilds++}}
  if(M.section!==M.applied)M.applied=M.section;
  const want=desired(run),level=want<S.level?want:Math.min(want,S.level+1)||1,before=S.level;
  const out=scheduleBar(S,level,M.applied);M.stats.bars++;
  if(level!==before)M.stats.transitions.push({bar:out.bar,time:+out.time.toFixed(3),from:before,to:level});
  if(M.stats.transitions.length>64)M.stats.transitions.shift();
 }
 M.stats.notes=S.scheduled;
}
function update(){
 for(const S of lingering)if(!S.done&&(S.ctx.currentTime>=S.killAt||S.ctx.state==='closed')){S.done=true;S.kill()}
 lingering=lingering.filter(S=>!S.done);
 if(!enabled)return;
 const host=hostOf(),run=host?.activeRun?.();
 if(!run){if(M.run)endRun();return}
 if(run!==M.run)beginRun(run);
 M.section=sectionOf(run);
 if(M.jumpAt!==null&&now()-M.jumpAt>.7){M.jumpOk=true;M.jumpAt=null}
 if(M.crashed&&!M.recover&&run.state==='play'&&!run.outro&&run.recoverAt===undefined&&now()-M.crashedAt>.5)M.recover=true;
 if(!M.goal&&run.outro?.kind==='clear')goal();
 if(run.state==='play'&&!hidden()){ensureSession(host,run);pump(run)}
 else if(session)endSession(['clear','fail'].includes(run.state)?(M.goal?4:.35):0);
 warmStep(host);
}
function onEvent({run,event}){
 if(!enabled)return;const host=hostOf();if(!run||run!==host?.activeRun?.())return;
 if(run!==M.run)beginRun(run);
 switch(event){
  case 'jump':{const t=now();M.jumpStep=t-M.lastJump<2.4?Math.min(5,M.jumpStep+1):0;M.lastJump=t;if(!run.openingCourse)M.jumpAt=t;else M.pendingLand=true;break}
  case 'land':if(M.pendingLand&&!M.crashed)M.jumpOk=true;M.pendingLand=false;break;
  case 'pass':case 'perfect':M.shards++;M.jumpOk=true;break;
  case 'kick':case 'morph':case 'boss-damage':case 'room-clear':case 'portal':M.shards++;break;
  case 'goal-qualified':M.climax=true;break;
  case 'hit':M.pendingLand=false;crash();break;
  case 'pause':endSession(0);break;
  case 'fail':M.lastEnd={kind:'crash',at:now()};endSession(.35);break;
  case 'clear':goal();M.lastEnd={kind:'clear',at:now()};endSession(4);break;
 }
 if(['jump','land','pass','perfect','hit'].includes(event))update();
}
/* Pre-render the tuned effect buffers for the current key a few per frame so the first jump never stalls. */
function queueWarm(){
 const kinds=[['jump',0],['land',0],['pass',0],['chain',0],['hit',0],['impact-glass',0],['impact-chime-fall',0],['perfect-chime',0],['square-corner',0],['jump',1],['jump',2],['jump',3],['pass',1],['pass',2],['chain',1],['chain',2],['jump',4],['jump',5],['pass',3],['pass',4],['pass',5],['aurora-shimmer',0],['result-clear',0]];
 M.warm=kinds.map(([kind,step])=>({kind,step}));
}
function warmStep(host){
 if(!M.warm.length||!root.MongyuSFX?.tunedBuffer)return;const audio=host?.audio?.();if(!audio?.context)return;
 const item=M.warm.shift(),t=tuning(item.kind,item.step,'');if(t)try{root.MongyuSFX.tunedBuffer(audio.context,item.kind,t)}catch(_){}
}
function tuning(kind,step,variant){
 if(!M.cfg)return null;const key=keyOf(M.cfg,M.applied);
 return {tonic:key.tonic,third:key.third,scale:key.scale,step,variant,key:key.name};
}
function sfxTuning(kind){
 if(!enabled||!M.run||M.run!==hostOf()?.activeRun?.())return null;
 const step=kind==='jump'?M.jumpStep:kind==='pass'||kind==='chain'?Math.max(0,M.shards-1):0;
 return tuning(kind,step,kind==='hit'&&M.run.state==='fail'?'fail':'');
}
if(enabled&&bus){
 bus.claimMusic(run=>!!run&&supported()&&(run.openingCourse||!!run.slot));
 bus.on('run-event',onEvent);bus.on('frame',update);
 bus.on('attach',host=>{try{host.refreshMusic?.()}catch(_){}});
 if(typeof root.document?.addEventListener==='function')root.document.addEventListener('visibilitychange',()=>{if(hidden())endSession(0);else update()});
}

/* Offline render (tests/tools): ~seconds of a chapter at a fixed stem level, optional crash/rebuild/goal times. */
async function renderOffline({chapter='opening',level=4,seconds=20,section=0,sampleRate=44100,crashAt=null,rebuildAt=null,goalAt=null,only=null}={}){
 const Offline=root.OfflineAudioContext||root.webkitOfflineAudioContext;if(!Offline)throw Error('OfflineAudioContext unavailable');
 const ctx=new Offline(2,Math.ceil(seconds*sampleRate),sampleRate),cfg=arrangement(chapter),S=createSession(ctx,ctx.destination,cfg,{start:.05,fadeIn:.02,section});if(Array.isArray(only))S.only=only;
 const marks={crash:crashAt,rebuild:rebuildAt,goal:goalAt},done={};let crashed=false;
 while(S.nextTime<seconds){
  for(const k of ['crash','rebuild','goal'])if(marks[k]!==null&&!done[k]&&marks[k]<=S.nextTime-LOOKAHEAD*.5){done[k]=true;
   if(k==='crash'){duck(S,marks[k]);crashed=true}else if(k==='rebuild'){crashed=false}else goalChord(S,marks[k],section)}
  if(done.rebuild&&S.ducked&&!crashed)rebuild(S,S.nextTime);
  if(S.goal)break;
  scheduleBar(S,crashed?1:level,section);
 }
 for(const k of ['crash','goal'])if(marks[k]!==null&&!done[k]){if(k==='crash')duck(S,marks[k]);else goalChord(S,marks[k],section)}
 const buffer=await ctx.startRendering();return {buffer,notes:S.scheduled,cfg:{bpm:cfg.bpm,key:keyOf(cfg,section).name}};
}
function inspect(){
 const S=session;
 return {enabled,active:!!S,chapter:M.chapter,key:M.cfg?keyOf(M.cfg,M.applied).name:null,bpm:M.cfg?.bpm||0,section:M.applied,level:S?S.level:0,ducked:!!S?.ducked,goal:M.goal,
  jumpOk:M.jumpOk,shards:M.shards,melody:M.melody,climax:M.climax,crashed:M.crashed,bar:S?S.nextBar:M.bar,voices:S?voicesAt(S,S.ctx.currentTime):0,scheduled:S?S.scheduled:0,duckHz:S?S.duck.frequency.value:0,stats:JSON.parse(JSON.stringify(M.stats))};
}
const api={
 enabled,ARRANGEMENTS,SCALES,CHORDS,arrangement,chapterOf,keyOf,chordAt,phrase,barEvents,goalEvents,safe,renderOffline,inspect,sfxTuning,update,
 get intensity(){return session&&!session.stopped?(session.goal?0:session.level):0},
 get bpm(){return M.cfg?.bpm||0},
 get key(){return M.cfg?keyOf(M.cfg,M.applied).name:null},
 get secondsPerBeat(){return M.cfg?60/M.cfg.bpm:0},
 /* Current musical position in beats (fractional) on the AudioContext clock; 0 when idle. */
 beat(){const S=session;if(!S||S.stopped)return 0;return Math.max(0,(S.ctx.currentTime-S.t0)/S.spb)+S.bar0*4},
 /* Next beat (or bar, unit=4) boundary in AudioContext seconds; null when idle. */
 nextBeatTime(unit=1){const S=session;if(!S||S.stopped)return null;const b=(S.ctx.currentTime-S.t0)/S.spb;return S.t0+Math.ceil(b/unit+1e-9)*unit*S.spb},
 /* Level-design helper: world units per beat for a run speed (e.g. 1st memory speed 122 → 73.2 units at 100 BPM). */
 beatDistance(speed,chapter){const cfg=chapter!==undefined?arrangement(chapter):M.cfg||arrangement('opening');return speed*60/cfg.bpm},
 _setClock(fn){clockOverride=typeof fn==='function'?fn:null},
 _reset(){endSession(0);for(const S of lingering)S.kill?.();lingering=[];Object.assign(M,{run:null,chapter:null,cfg:null,section:0,applied:0,lastEnd:null,warm:[],stats:{bars:0,notes:0,ducks:0,rebuilds:0,goals:0,sessions:0,transitions:[]}})}
};
Object.freeze(api);
root.MongyuAdaptiveMusic=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
