/* R105 chapter 8 act (workstream CH610): 색채의 섬망 / Chromatic Delirium (blueprint M09 Rhythm). Follows the act contract of docs/R105_SPEC_KO.md.
   rhythm: obstacles on the beat grid in a hall with a visible pulsing frame. Four shapes, each with its own cue (never colour alone): solid squares on the beat ("note"), hollow diamonds on the half-beat ("off"),
        wide low striped bars ("bass") and pairs two beats apart ("duo"). Every obstacle owns an approach ring on the floor that contracts and closes exactly when the tap is due (dashed for off-beats, double for bass),
        so the rule can be played without sound. The frame around the hall breathes on every beat with a thin outline only.
        Strict sensory safety: pulses are <= bpm/60 per second (138 bpm = 2.3 Hz, under the 3 Hz limit), carried by line width and alpha of a thin outline (no full-screen fills, no colour swap); the kaleidoscope
        background is a cached, low-contrast tile in the cool palette hues (never the hazard colour) that turns once per 90 s and never carries collision; reduced motion stops the turning, the pulse of the frame
        becomes a static thickness step.
        options beats (length), level 0-3 (off-beats, bass bars, pairs), seed, bpm, items, trip, hud:false, tutorial. Light shards hang at the apex of every second jump.
   Registers with MongyuCourse.registerAct (course-run.js registers it at load, or this file does when the course engine is already there). Inert unless MONGYU_POLISH_EDITION===true. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const TAU=Math.PI*2;
const K=()=>root.MongyuSquareAct?.kit||null;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const RHY={B:100,LEVELS:[
 {gap:[4,4,5],off:0,bass:0,duo:0},
 {gap:[3,4,4],off:.3,bass:0,duo:0},
 {gap:[3,3,4],off:.3,bass:.25,duo:.15},
 {gap:[3,3],off:.3,bass:.25,duo:.25}
]};
const rngOf=seed=>{const E=root.MongyuEndless;if(E?.rng)return E.rng(seed);let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}};

/* Pure, seeded layout: every obstacle sits on a beat (note, bass) or a half-beat (off); taps are 2+ beats apart. */
function buildRhythm(o={}){
 const bpm=Number(o.bpm)||138,seed=(o.seed??1)>>>0,beats=Math.max(24,Number(o.beats)||44),lv=RHY.LEVELS[clamp(o.level|0,0,3)],B=RHY.B,speed=B*bpm/60,r=rngOf(seed^0x1F83D9),events=[];
 const lead=(K()?K().SIDE.FL:.62)*bpm/120;let m=o.tutorial?8:7,k=0;
 const add=(mm,kind)=>{events.push({m:mm,at:mm*B,kind,hw:kind==='bass'?22:0,h:kind==='bass'?10:(r()<.45?22:14),tapBeat:mm-lead,idx:k,shard:k%2===0,done:false,absorbed:false});k++};
 while(m<beats-6){
  const q=r(),first=events.length===0||o.tutorial&&events.length<2;
  let kind='note';
  if(!first){if(q<lv.duo)kind='duo';else if(q<lv.duo+lv.bass)kind='bass';else if(q<lv.duo+lv.bass+lv.off)kind='off'}
  if(kind==='duo'){add(m,'note');add(m+2,'note');m+=2}
  else if(kind==='off')add(m+.5,'off');
  else add(m,kind);
  m+=lv.gap[Math.floor(r()*lv.gap.length)];
 }
 const end=Math.ceil(m)+3;
 return {bpm,B,speed,lead,beats:end,length:end*B,events,shardTotal:events.filter(e=>e.shard).length};
}

function makeRhythmRun(){
 const k=K();if(!k)return null;
 const {sideBase,sideHud,palOf,dangerInk,lum,items,SIDE,corridorGate}=k;
 const Base=sideBase();
 class RhythmRun extends Base{
  constructor(options={}){
   super(options);this.dreamMode='rhythm';this.B=RHY.B;
   this.course=buildRhythm({bpm:this.bpm,seed:this.seed,beats:options.beats,level:options.level,tutorial:options.tutorial===true});this.length=this.course.length;this.shardTotal=this.course.shardTotal;
   this.reset();
  }
  reset(){
   const C=this.course;this.baseReset();this.hi=0;
   for(const e of C.events){e.done=false;e.absorbed=false}
   this.shardList=C.events.filter(e=>e.shard).map(e=>({e,got:false}));
   const ch=this.chain,teach=!ch||ch.first!==false||this.options.tutorial===true;
   this.coach=teach&&this.options.coachText!==false?{kind:'start',text:this.options.coachText||'고리가 닫힐 때 탭',until:3.4}:null;
   this.initItems(6*C.B,Math.max(1,C.length-6*C.B-4*C.B),C.B);
  }
  action(){
   if(this.state!=='play'||this.outro||this.finishing||this.hitStop>0)return false;
   this.inputCount++;
   if(this.fly!==null){if(this.fly>=this.fl-.14)this.buffer=.14;return false}
   const C=this.course,e=C.events[this.next];
   if(e&&!e.done&&Math.abs(this.x/C.B-e.tapBeat)<=1.2){
    e.done=true;this.next++;const err=Math.abs(this.x/C.B-e.tapBeat);
    if(err<=.17){this.perfects++;this.perfectStreak++;this.bestStreak=Math.max(this.bestStreak,this.perfectStreak);this.perfectPoints+=20*Math.min(5,this.perfectStreak);this.events.push('perfect');this.setCoach('perfect',.6,'완벽!')}
    else{this.perfectStreak=0;this.events.push('pass')}
   }else this.perfectStreak=0;
   this.jumpNow();return true;
  }
  tick(dt){
   if(!this.gate(dt))return;
   const C=this.course,sdt=this.pace(dt),W=SIDE.W+4,MI=items();
   this.time+=dt;this.gt+=sdt;this.x+=C.speed*sdt;this.distance=this.x;this.buffer=Math.max(0,this.buffer-dt);
   this.flightStep(sdt);
   const beatNow=Math.floor(this.x/C.B);if(beatNow!==this.lastBeat){this.lastBeat=beatNow;if(beatNow%4===0)this.events.push('pass')}
   for(;this.hi<C.events.length&&this.x>C.events[this.hi].at+W+40;)this.hi++;
   for(let i=this.hi;i<C.events.length;i++){const e=C.events[i];if(e.at-W-e.hw>this.x)break;
    if(!e.absorbed&&Math.abs(this.x-e.at)<=W+e.hw&&this.height<e.h){if(MI&&this.mods&&MI.applyHit(this))e.absorbed=true;else{this.crashNow('박자를 놓쳤어요','한 박자 늦었어',{kind:'hit',at:this.x});return}}}
   for(const sh of this.shardList){if(sh.got)continue;const sx=sh.e.at;if(this.x>sx+16)continue;if(Math.abs(this.x-sx)<12&&this.height>=this.pkH-16){sh.got=true;this.shards++;this.pickedAt=this.time;this.events.push('collect')}}
   this.scoreStep();
   if(this.x>=this.length&&!this.crash)this.reachGate();
  }
  status(){return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:Math.floor(this.points),best:0,progress:this.progressNow,roomTitle:'박자',roomIndex:0,roomCount:1,instruction:'탭: 점프 · 고리가 닫힐 때',cue:null,result:this.result}}
  /* Autopilot for the headless checks: centres the jump on the obstacle (mode 'ignore' = a little early). */
  pilot(cr,mode){
   const C=this.course,e=C.events[this.next];if(!e||this.fly!==null||this.outro||this.finishing||this.hitStop>0)return;
   const MI=items(),fl=this.mods&&this.mods.featherCharges>0?SIDE.FL*(MI?.TUNING?.featherLen||1.6):SIDE.FL;
   if(e.at-this.x<=C.speed*fl/2-(mode==='ignore'?6:0)+.5)cr.action();
  }
  draw(c,opts){return drawRhythm(c,this,opts,k)}
  drawAura(){}
 }
 return RhythmRun;
}

/* ---------- drawing ---------- */
const tiles=new Map();
/* the kaleidoscope turns once per 90 s and not at all with reduced motion */
const kaleidoAngle=(t,reduced)=>reduced?0:t*TAU/90;
/* One cached 8-fold mirrored tile (a wedge of rings, triangles and dots in the cool palette hues, never the hazard colour); null when canvases are unavailable (tests). */
function kaleidoTile(P,key,S){
 const id=key+'|'+S;let t=tiles.get(id);if(t!==undefined)return t;
 try{
  const doc=root.document;if(!doc?.createElement){tiles.set(id,null);return null}
  const cv=doc.createElement('canvas');cv.width=cv.height=S;const x=cv.getContext('2d');if(!x){tiles.set(id,null);return null}
  let a=0x5EED;const rnd=()=>{a=(a+0x6D2B79F5)>>>0;let q=a;q=Math.imul(q^q>>>15,q|1);q^=q+Math.imul(q^q>>>7,q|61);return((q^q>>>14)>>>0)/4294967296};
  const cols=[P.rim,P.rim2,P.glow,P.accent],R=S/2,shapes=[];
  for(let i=0;i<14;i++)shapes.push({d:R*(.12+rnd()*.8),a:rnd()*Math.PI/4,r:R*(.03+rnd()*.1),k:Math.floor(rnd()*3),c:cols[Math.floor(rnd()*cols.length)]});
  x.translate(R,R);x.lineJoin='round';
  for(let i=0;i<8;i++){
   x.save();x.rotate(i*Math.PI/4);if(i%2)x.scale(1,-1);
   x.beginPath();x.moveTo(0,0);x.lineTo(R,0);x.arc(0,0,R,0,Math.PI/4);x.closePath();x.clip();
   for(const s of shapes){const sx=Math.cos(s.a)*s.d,sy=Math.sin(s.a)*s.d;x.strokeStyle=s.c;x.fillStyle=s.c;x.lineWidth=2;x.globalAlpha=.8;
    if(s.k===0){x.beginPath();x.arc(sx,sy,s.r,0,TAU);x.stroke()}
    else if(s.k===1){x.beginPath();x.moveTo(sx,sy-s.r);x.lineTo(sx+s.r,sy+s.r*.7);x.lineTo(sx-s.r,sy+s.r*.7);x.closePath();x.globalAlpha=.4;x.fill();x.globalAlpha=.9;x.stroke()}
    else{x.beginPath();x.arc(sx,sy,s.r*.45,0,TAU);x.globalAlpha=.55;x.fill()}}
   x.restore();
  }
  tiles.set(id,cv);return cv;
 }catch(_){tiles.set(id,null);return null}
}
function drawRhythm(c,run,opts,k){
 const {palOf,dangerInk,lum,items,SIDE,corridorGate,sideHud}=k;
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,C=run.course,MI=items(),P=palOf(run.trip),kd=dangerInk(P),light=lum(P.sky[1])>.5,MODE=light?'source-over':'lighter';
 const sc=clamp(Math.min(w/300,h/560),.8,1.7),yF=h*.64,px=w*.3,X=wx=>px+(wx-run.x)*sc,beat=run.x/C.B,frac=beat-Math.floor(beat);
 /* pulse: sharp attack, quick decay, 0..1; the frame uses it only for line width and alpha */
 const pulse=reduced?0:Math.exp(-5*frac),down=Math.floor(beat)%4===0;
 const ink=light?'#1b1626':'#f3eefc';
 c.save();
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,P.sky[0]);g.addColorStop(.5,P.sky[1]);g.addColorStop(1,P.sky[2]);c.fillStyle=g;c.fillRect(0,0,w,h);
 // kaleidoscope: decoration only, low contrast, one turn per 90 s (still when reduced)
 {const tile=kaleidoTile(P,run.trip,420);if(tile){const sz=Math.hypot(w,h)*1.05;c.save();c.globalAlpha=light?.16:.14;c.translate(w*.5,h*.4);c.rotate(kaleidoAngle(t,reduced));c.drawImage(tile,-sz/2,-sz/2,sz,sz);c.restore()}}
 // the hall: floor slab with beat marks, half-beat ticks lighter
 c.fillStyle=P.block[2];c.fillRect(0,yF,w,h-yF);c.fillStyle=P.block[0];c.globalAlpha=.7;c.fillRect(0,yF,w,10*sc);c.globalAlpha=1;
 c.save();c.globalCompositeOperation=MODE;c.strokeStyle=P.rim;c.globalAlpha=.9;c.lineWidth=1.8;c.beginPath();c.moveTo(0,yF);c.lineTo(w,yF);c.stroke();c.restore();
 {const first=Math.floor((run.x-px/sc)/C.B)*C.B-C.B;c.save();c.globalCompositeOperation=MODE;c.fillStyle=P.rim2;
  for(let wx=first;X(wx)<w+C.B*sc;wx+=C.B/2){const on=Math.abs((wx/C.B)%1)<1e-6,big=on&&Math.round(wx/C.B)%4===0,s=(on?(big?4.2:3):1.8)*sc*(on?1+.35*pulse*(Math.abs(wx/C.B-Math.round(beat))<.01?1:0):1);c.globalAlpha=big?.8:on?.5:.28;c.fillRect(X(wx)-s/2,yF+16*sc,s,s)}c.restore()}
 // approach rings and obstacles
 const next=run.next,tapDist=C.speed*SIDE.FL/2;
 for(let i=0;i<C.events.length;i++){
  const e=C.events[i],sx=X(e.at);if(sx<-40)continue;if(sx>w+60)break;
  const hh=e.h*sc;
  if(e.kind==='note'){
   c.fillStyle=kd.side;c.fillRect(sx-SIDE.W*sc+3,yF-hh-3,SIDE.W*2*sc,hh+3);c.fillStyle=e.absorbed?'#b8c4d0':kd.d;c.fillRect(sx-SIDE.W*sc,yF-hh,SIDE.W*2*sc,hh);c.fillStyle=kd.top;c.fillRect(sx-SIDE.W*sc,yF-hh,SIDE.W*2*sc,3.2);
   c.strokeStyle='#f4ffff';c.globalAlpha=.55;c.lineWidth=1;c.strokeRect(sx-SIDE.W*sc+.5,yF-hh+.5,SIDE.W*2*sc-1,hh-1);c.globalAlpha=1;
  }else if(e.kind==='off'){
   // hollow diamond on a stalk: the off-beat shape
   const r2=SIDE.W*1.25*sc,cy=yF-hh;c.fillStyle=light?'rgba(255,250,244,.7)':'rgba(20,12,36,.55)';c.strokeStyle=e.absorbed?'#b8c4d0':kd.d;c.lineWidth=3.2;
   c.beginPath();c.moveTo(sx,cy-r2);c.lineTo(sx+r2,cy);c.lineTo(sx,cy+r2);c.lineTo(sx-r2,cy);c.closePath();c.fill();c.stroke();
   c.beginPath();c.moveTo(sx,cy+r2);c.lineTo(sx,yF);c.stroke();
  }else{
   // bass: a wide low bar with a striped top
   const bw=e.hw*sc,bh=Math.max(10*sc,hh);c.fillStyle=kd.side;c.fillRect(sx-bw+3,yF-bh-3,bw*2,bh+3);c.fillStyle=e.absorbed?'#b8c4d0':kd.d;c.fillRect(sx-bw,yF-bh,bw*2,bh);
   c.strokeStyle=kd.top;c.lineWidth=2;for(let sxx=sx-bw+4;sxx<sx+bw-2;sxx+=8*sc){c.beginPath();c.moveTo(sxx,yF-bh);c.lineTo(sxx+4*sc,yF-bh+Math.min(bh,6*sc));c.stroke()}
   c.strokeStyle='#f4ffff';c.globalAlpha=.55;c.lineWidth=1;c.strokeRect(sx-bw+.5,yF-bh+.5,bw*2-1,bh-1);c.globalAlpha=1;
  }
  // approach ring: closes (radius 9) exactly when the jump is due
  if(i>=next&&!e.done){
   const dist=e.at-run.x-tapDist,u=clamp(dist/(C.B*2.2),0,1),rad=(9+u*46)*sc;
   if(u<1||dist>-8){
    c.save();c.globalAlpha=clamp(1-Math.max(0,-dist)/8,0,1)*(.35+.6*(1-u));c.strokeStyle=ink;c.lineWidth=2.2;const ry=yF+7*sc;
    if(e.kind==='off')c.setLineDash([5,4]);
    c.beginPath();c.ellipse(sx,ry,rad,rad*.32,0,0,TAU);c.stroke();
    if(e.kind==='bass'){c.beginPath();c.ellipse(sx,ry,rad*.72,rad*.23,0,0,TAU);c.stroke()}
    c.restore();
   }
  }
 }
 {const gx=X(C.length);if(gx<w+60)corridorGate(c,gx,yF-h*.3,yF,P,run.finishing?run.finishing.age/run.finishing.dur:0,clamp((C.length-run.x)/(C.speed*5),0,1),MODE,sc)}
 const dia=(x,y,r,rot,fill)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=fill;c.fillRect(-r,-r,r*2,r*2);c.restore()};
 for(const sh of run.shardList){if(sh.got)continue;const sx=X(sh.e.at);if(sx<-20||sx>w+20)continue;const sy=yF-(SIDE.PEAK+8)*sc;
  c.save();c.globalCompositeOperation=MODE;c.globalAlpha=.3;dia(sx,sy,9*sc,Math.PI/4,P.gold);c.restore();
  if(!(MI&&MI.drawLight(c,sx,sy,26*sc,t,sh.e.idx,reduced,0)))dia(sx,sy,4.2*sc,Math.PI/4+(reduced?0:t*1.6),P.gold)}
 if(MI&&run.itemList&&run.itemList.length)MI.drawItems(c,run,it=>{const sx=X(it.at);if(sx<-30||sx>w+30)return null;return {x:sx,y:yF-(it.lane==='hi'?SIDE.PEAK*.62+10:15)*sc,s:sc}},t,reduced,0);
 const cr=run.crash;
 if(root.MongyuMobile?.sprite)root.MongyuMobile.sprite(c,{x:px,y:yF-run.height*sc,bodyHeight:SIDE.PEAK*sc*1.12,renderAngle:0,strideDistance:run.x,nativeState:0,height:run.height,jumpProgress:run.fly===null?0:run.fly/run.fl,pose:cr?'hurt':run.fly!==null?'jump':'run'},{poseTime:t,onDark:true},reduced);
 else{c.fillStyle='#fff3e0';c.fillRect(px-5,yF-run.height*sc-SIDE.PEAK*sc,10,SIDE.PEAK*sc)}
 if(MI&&run.mods)MI.drawAura(c,run,px,yF-(run.height+22)*sc,SIDE.PEAK*sc*.7,t,reduced);
 if(run.time-run.pickedAt<.4){const a=(run.time-run.pickedAt)/.4;c.save();c.globalCompositeOperation=MODE;c.globalAlpha=(1-a)*.7;c.strokeStyle=P.gold;c.lineWidth=2;c.beginPath();c.arc(px,yF-30*sc,(10+a*34)*sc,0,TAU);c.stroke();c.restore()}
 // the pulsing frame: a thin rounded outline around the hall; width and alpha follow the beat (the downbeat adds an inner line). Never a fill.
 {const inset=6+2*pulse,lw=(reduced?3:2.4+2.4*pulse),al=.55+.3*pulse;
  c.save();c.strokeStyle=ink;c.globalAlpha=al*(light?.8:.7);c.lineWidth=lw;
  c.beginPath();if(c.roundRect)c.roundRect(inset,inset,w-inset*2,h-inset*2,26);else c.rect(inset,inset,w-inset*2,h-inset*2);c.stroke();
  if(down||reduced){c.globalAlpha=(reduced?.4:.35*pulse+.12);c.lineWidth=1.4;const i2=inset+9;c.beginPath();if(c.roundRect)c.roundRect(i2,i2,w-i2*2,h-i2*2,20);else c.rect(i2,i2,w-i2*2,h-i2*2);c.stroke()}
  c.restore()}
 c.restore();
 if(!run.hudOff)sideHud(c,run,w,h,P,'박자');
 return null;
}

/* ---------- registry ---------- */
let RhythmRun=null;
const getRhythm=()=>RhythmRun||(RhythmRun=makeRhythmRun());
const ACTS=Object.freeze({rhythm:o=>{const Kl=getRhythm();return new Kl(o)}});
const LABELS=Object.freeze({rhythm:'박자'});
function register(Course){const C=Course||root.MongyuCourse;if(!enabled||!C?.registerAct)return false;for(const [type,f] of Object.entries(ACTS))C.registerAct(type,f,LABELS[type]);return true}
const api=Object.freeze({enabled,ACTS,register,buildRhythm,kaleidoAngle,RHY,get RhythmRun(){return getRhythm()}});
root.MongyuRhythmAct=api;if(typeof module!=='undefined')module.exports=api;
if(enabled&&root.MongyuCourse?.registerAct)register(root.MongyuCourse);
})(globalThis);
