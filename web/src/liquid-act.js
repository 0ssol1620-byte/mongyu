/* R105 chapter 7 act (workstream CH610): 녹아내리는 현실 / Liquid Reality (blueprint M04 Living Geometry + M11 Metamorph). Follows the act contract of docs/R105_SPEC_KO.md.
   liquid: a taps-on-beat run over a floor that breathes. Floor pits open like mouths as you approach (their edges sway side to side on a four-beat cycle at higher levels) and floor bulges rise and sink;
        one tap = one jump, always on the beat grid, and both the pit and the jump window use the same numbers (the pit is sized from the current form's jump length). At morph gates (a frame in the silhouette of the
        next form, always with 3+ beats of clear floor on both sides) the runner changes form: droplet (round teardrop), ink (wide blot with drips), paper (angular folded sheet). The forms differ only in how long a jump is
        (ink short and low, paper long and floaty), so the hazards after a gate are sized to that form. Pit = hollow with a toothed lip, bulge = a raised hump; both wear the hazard outline, shapes carry the meaning.
        options beats (length), level 0-3 (gap, sway, share of bulges), morph (gates; default on from level 1), seed, bpm, items, trip, hud:false, tutorial. Light shards hang at the apex of every second jump.
   Registers with MongyuCourse.registerAct (course-run.js registers it at load, or this file does when the course engine is already there). Inert unless MONGYU_POLISH_EDITION===true. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const TAU=Math.PI*2;
const K=()=>root.MongyuSquareAct?.kit||null;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const FORMS=Object.freeze([
 Object.freeze({id:'drop',name:'물방울',fl:.62,pk:1}),
 Object.freeze({id:'ink',name:'잉크',fl:.5,pk:.82}),
 Object.freeze({id:'paper',name:'종이',fl:.78,pk:1.12})
]);
const LIQ={B:100,OPEN_UP:1.5,PIT_K:.42,LEVELS:[
 {gap:[4,5,4],sway:0,pit:.7},
 {gap:[3,4,4],sway:8,pit:.6},
 {gap:[3,3,4],sway:13,pit:.55},
 {gap:[3,3,3],sway:18,pit:.5}
]};
const rngOf=seed=>{const E=root.MongyuEndless;if(E?.rng)return E.rng(seed);let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}};

/* Pure, seeded layout: hazards (pits, bulges) and morph gates on the beat grid. */
function buildLiquid(o={}){
 const bpm=Number(o.bpm)||125,seed=(o.seed??1)>>>0,beats=Math.max(24,Number(o.beats)||44),li=clamp(o.level|0,0,3),lv=LIQ.LEVELS[li],B=LIQ.B,speed=B*bpm/60,r=rngOf(seed^0x4B1D2F);
 const morph=o.morph===undefined?li>=1:!!o.morph,events=[],gates=[];let m=o.tutorial?7:6,f=Math.max(0,Math.min(2,o.form0|0)),k=0,since=0;
 const form0=f;
 while(m<beats-6){
  const F=FORMS[f],lead=F.fl*bpm/120,kind=r()<lv.pit?'pit':'bulge';
  const e={m,at:m*B,kind,form:f,lead,tapBeat:m-lead,idx:k,shard:k%2===0,done:false,absorbed:false,sway:kind==='pit'?lv.sway:0,
   w:kind==='pit'?Math.round(F.fl*speed*LIQ.PIT_K):0,hw:kind==='pit'?Math.round(F.fl*speed*LIQ.PIT_K)/2:Math.round(F.fl*speed*.05),h:kind==='bulge'?Math.round(44*F.pk*(r()<.45?.42:.3)):0};
  events.push(e);k++;since++;
  let next=m+lv.gap[Math.floor(r()*lv.gap.length)];
  // a gate needs three clear beats on both sides: it sits 3 beats after this hazard and the next hazard 4 beats after it
  if(morph&&since>=2&&r()<.6&&next+4<beats-6&&!o.tutorial){const g=m+3,nf=(f+1+Math.floor(r()*2))%3;gates.push({beat:g,at:g*B,from:f,to:nf});f=nf;since=0;next=Math.max(next,g+4)}
  m=next;
 }
 const end=m+3;
 return {bpm,B,speed,beats:end,length:end*B,events,gates,form0,shardTotal:events.filter(e=>e.shard).length,forms:FORMS};
}
const formAt=(C,x)=>{let f=C.form0;for(const g of C.gates){if(x>=g.at)f=g.to;else break}return f};
/* how far open a hazard is (0..1) at a beat: it opens 3.2..1.7 beats ahead, stays open through 0.9 beats after its centre and closes again */
const openAt=(e,beat)=>Math.min(clamp((beat-(e.m-1.7-LIQ.OPEN_UP))/LIQ.OPEN_UP,0,1),clamp((e.m+.9+LIQ.OPEN_UP-beat)/LIQ.OPEN_UP,0,1));
const centerAt=(e,beat)=>e.at+(e.sway?e.sway*Math.sin(TAU*(beat-e.m)/4):0);

function makeLiquidRun(){
 const k=K();if(!k)return null;
 const {sideBase,hazardBlock,corridorGate,sideHud,palOf,dangerInk,lum,items,SIDE}=k;
 const Base=sideBase();
 class LiquidRun extends Base{
  constructor(options={}){
   super(options);this.dreamMode='liquid';this.B=LIQ.B;
   this.course=buildLiquid({bpm:this.bpm,seed:this.seed,beats:options.beats,level:options.level,morph:options.morph,tutorial:options.tutorial===true,form0:options.form0});this.length=this.course.length;this.shardTotal=this.course.shardTotal;
   this.reset();
  }
  reset(){
   const C=this.course;this.baseReset();this.hi=0;this.formIdx=C.form0;this.morphAt=-10;this.fell=0;
   for(const e of C.events){e.done=false;e.absorbed=false}
   this.shardList=C.events.filter(e=>e.shard).map(e=>({e,got:false}));
   const ch=this.chain,teach=!ch||ch.first!==false||this.options.tutorial===true;
   this.coach=teach&&this.options.coachText!==false?{kind:'start',text:this.options.coachText||'바닥이 입을 벌려. 박자에 맞춰 뛰어',until:3.6}:null;
   this.initItems(6*C.B,Math.max(1,C.length-6*C.B-4*C.B),C.B);
  }
  get form(){return FORMS[this.formIdx]}
  jumpNow(){const MI=items();this.fl=MI?MI.applyJump(this,this.form.fl):this.form.fl;this.pkH=SIDE.PEAK*this.form.pk*(this.pk||1);this.fly=0;this.buffer=0;this.jumps++;this.events.push('jump')}
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
   const fi=formAt(C,this.x);
   if(fi!==this.formIdx){this.formIdx=fi;this.morphAt=this.time;this.events.push('morph');this.setCoach('morph',1.6,FORMS[fi].name)}
   const beat=this.x/C.B;
   for(;this.hi<C.events.length&&this.x>C.events[this.hi].at+80;)this.hi++;
   for(let i=this.hi;i<C.events.length;i++){
    const e=C.events[i];if(e.at-90>this.x)break;if(e.absorbed)continue;
    const u=openAt(e,beat),cx=centerAt(e,beat);
    if(e.kind==='pit'){
     if(this.height<=2&&this.fly===null&&Math.abs(this.x-cx)<e.hw*u-4){
      if(MI&&this.mods&&MI.applyHit(this))e.absorbed=true;else{this.crashNow('바닥이 녹아 내렸어요','발밑이 녹았어',{kind:'pit',at:this.x,cx});return}}
     }else if(Math.abs(this.x-cx)<=W+e.hw&&this.height<e.h*u){
      if(MI&&this.mods&&MI.applyHit(this))e.absorbed=true;else{this.crashNow('바닥 혹에 부딪혔어요','한 박자 늦었어',{kind:'hit',at:this.x});return}}
   }
   for(const sh of this.shardList){if(sh.got)continue;const sx=sh.e.at;if(this.x>sx+16)continue;if(Math.abs(this.x-sx)<12&&this.height>=this.pkH-16){sh.got=true;this.shards++;this.pickedAt=this.time;this.events.push('collect')}}
   this.scoreStep();
   if(this.x>=this.length&&!this.crash)this.reachGate();
  }
  status(){return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:Math.floor(this.points),best:0,progress:this.progressNow,roomTitle:'녹는 길',roomIndex:0,roomCount:1,instruction:'탭: 점프 · 바닥이 입을 벌리면 뛰기',cue:null,result:this.result}}
  /* Autopilot for the headless checks: centres the jump on the hazard (mode 'ignore' = a little early). */
  pilot(cr,mode){
   const C=this.course,e=C.events[this.next];if(!e||this.fly!==null||this.outro||this.finishing||this.hitStop>0)return;
   const MI=items(),fl=this.mods&&this.mods.featherCharges>0?FORMS[e.form].fl*(MI?.TUNING?.featherLen||1.6):FORMS[e.form].fl;
   if(e.at-this.x<=C.speed*fl/2-(mode==='ignore'?6:0)+.5)cr.action();
  }
  draw(c,opts){return drawLiquid(c,this,opts,k)}
  drawAura(){}
 }
 return LiquidRun;
}

/* ---------- drawing ---------- */
/* Runner silhouettes: droplet (round teardrop), ink (wide blot with drips), paper (angular folded sheet). H = body height in px, (x,y) = feet. */
function drawForm(c,id,x,y,H,o){
 const {t,reduced,fly,pose,ink,rim}=o,k=fly===null?0:fly,run=!reduced&&fly===null?Math.sin(t*14):0;
 c.save();c.translate(x,y);c.fillStyle=ink;c.strokeStyle=rim;c.lineWidth=1.6;c.lineJoin='round';
 if(id==='drop'){
  const sy=1+(fly!==null?.14*Math.sin(k*Math.PI):0)+.04*run,sx=1/sy,r=H*.3;c.scale(sx,sy);
  c.beginPath();c.moveTo(0,-H);c.bezierCurveTo(r*.25,-H*.7,r*1.05,-r*1.5,r,-r*1.05);c.arc(0,-r*1.05,r,0,Math.PI,false);c.bezierCurveTo(-r*1.05,-r*1.5,-r*.25,-H*.7,0,-H);c.closePath();c.fill();if(rim)c.stroke();
  c.fillStyle=rim||'rgba(255,255,255,.4)';c.globalAlpha=.55;c.beginPath();c.ellipse(-r*.38,-r*1.35,r*.14,r*.26,.4,0,TAU);c.fill();
 }else if(id==='ink'){
  const sw=1+(fly!==null?.12*Math.sin(k*Math.PI):0)+.05*run,sh=1/sw,bw=H*.46,bh=H*.5;c.scale(sw,sh);
  c.beginPath();c.moveTo(-bw,0);c.bezierCurveTo(-bw*1.1,-bh*.9,-bw*.4,-bh*1.15,0,-bh*1.05);c.bezierCurveTo(bw*.5,-bh*1.2,bw*1.15,-bh*.8,bw,0);
  c.lineTo(bw*.62,0);c.quadraticCurveTo(bw*.55,bh*.28,bw*.4,0);c.lineTo(bw*.1,0);c.quadraticCurveTo(0,bh*.4,-bw*.12,0);c.lineTo(-bw*.45,0);c.quadraticCurveTo(-bw*.55,bh*.22,-bw*.65,0);c.closePath();c.fill();if(rim)c.stroke();
  c.beginPath();c.arc(-bw*1.35,-bh*.35,H*.07,0,TAU);c.arc(-bw*1.7,-bh*.15,H*.045,0,TAU);c.fill();
 }else{
  const w=H*.44,h=H*.92,tilt=(fly!==null?.2*Math.sin(k*Math.PI):0)+(reduced?0:.05*run);c.rotate(tilt);
  c.beginPath();c.moveTo(-w/2,0);c.lineTo(-w/2,-h);c.lineTo(w/2-w*.34,-h);c.lineTo(w/2,-h+w*.34);c.lineTo(w/2,0);c.closePath();c.fill();if(rim)c.stroke();
  c.fillStyle=rim||'rgba(255,255,255,.5)';c.globalAlpha=.6;c.beginPath();c.moveTo(w/2-w*.34,-h);c.lineTo(w/2,-h+w*.34);c.lineTo(w/2-w*.34,-h+w*.34);c.closePath();c.fill();c.globalAlpha=.4;
  c.beginPath();c.moveTo(-w/2,-h*.46);c.lineTo(w/2,-h*.52);c.stroke();
 }
 c.restore();void pose;
}
function drawLiquid(c,run,opts,k){
 const {palOf,dangerInk,lum,items,SIDE,corridorGate,sideHud}=k;
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,C=run.course,MI=items(),P=palOf(run.trip),kd=dangerInk(P),light=lum(P.sky[1])>.5,MODE=light?'source-over':'lighter';
 const sc=clamp(Math.min(w/300,h/560),.8,1.7),yF=h*.64,px=w*.3,X=wx=>px+(wx-run.x)*sc,beat=run.x/C.B,beatP=reduced?0:.5+.5*Math.cos(((t*run.bpm/60)%1)*TAU);
 const ink=light?'#14101c':'#0b0912',rim=light?'':'rgba(243,238,252,.55)';
 c.save();
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,P.sky[0]);g.addColorStop(.5,P.sky[1]);g.addColorStop(1,P.sky[2]);c.fillStyle=g;c.fillRect(0,0,w,h);
 // satin bands and refraction rings far behind (slow parallax; nothing here ever carries collision)
 c.save();c.globalCompositeOperation=MODE;c.lineWidth=1.4;
 for(let i=0;i<3;i++){c.strokeStyle=i%2?P.rim2:P.glow;c.globalAlpha=light?.22:.1;const by=h*(.2+.12*i),par=.08+.05*i;c.beginPath();for(let x=0;x<=w;x+=10){const y=by+8*Math.sin((x+run.x*par*sc)/(46+10*i)+i+(reduced?0:t*.35));if(x===0)c.moveTo(x,y);else c.lineTo(x,y)}c.stroke()}
 for(let i=0;i<5;i++){const cx=((i*173+40-run.x*.12*sc)%(w+120)+w+120)%(w+120)-60,cy=h*(.16+.07*((i*3)%5)),rr=(26+i*7)*sc;c.globalAlpha=light?.18:.08;c.strokeStyle=P.rim;c.beginPath();c.arc(cx,cy,rr,0,TAU);c.stroke();c.beginPath();c.arc(cx+rr*.18,cy-rr*.14,rr*.62,.3,2.2);c.stroke()}
 c.restore();
 // floor profile: a slow breathing wave plus the hazards
 const wave=(wx)=>reduced?0:-2.6*sc*Math.sin(TAU*(wx/C.B/2-t*run.bpm/120));
 const vis=C.events.filter(e=>{const sx=X(e.at);return sx>-120&&sx<w+120});
 const bulge=(wx)=>{let y=0;for(const e of vis){if(e.kind!=='bulge')continue;const d=Math.abs(wx-e.at),R=e.hw+14;if(d<R){const u=openAt(e,beat);y-=e.h*u*sc*(d<e.hw?1:.5*(1+Math.cos(Math.PI*(d-e.hw)/14)))}}return y};
 c.beginPath();c.moveTo(0,h);
 for(let sx=0;sx<=w+6;sx+=6){const wx=run.x+(sx-px)/sc;c.lineTo(sx,yF+wave(wx)+bulge(wx))}
 c.lineTo(w,h);c.closePath();
 const fg=c.createLinearGradient(0,yF,0,h);fg.addColorStop(0,P.block[0]);fg.addColorStop(.35,P.block[1]);fg.addColorStop(1,P.block[2]);c.fillStyle=fg;c.fill();
 c.save();c.globalCompositeOperation=MODE;c.strokeStyle=P.rim;c.globalAlpha=.95;c.lineWidth=2.2;c.beginPath();
 for(let sx=0;sx<=w+6;sx+=6){const wx=run.x+(sx-px)/sc,y=yF+wave(wx)+bulge(wx);if(sx===0)c.moveTo(sx,y);else c.lineTo(sx,y)}c.stroke();
 c.globalAlpha=.25;c.strokeStyle=P.glow;for(let j=1;j<=2;j++){c.beginPath();for(let sx=0;sx<=w+6;sx+=8){const wx=run.x+(sx-px)/sc,y=yF+(14*j)*sc+wave(wx*.9)*1.3;if(sx===0)c.moveTo(sx,y);else c.lineTo(sx,y)}c.stroke()}c.restore();
 // beat marks on the floor
 {const first=Math.floor((run.x-px/sc)/C.B)*C.B;c.save();c.globalCompositeOperation=MODE;c.fillStyle=P.rim2;for(let wx=first;X(wx)<w+C.B*sc;wx+=C.B){const s=(2.4+1*beatP)*sc;c.globalAlpha=((wx/C.B)%4===0?.7:.4);c.fillRect(X(wx)-s/2,yF+18*sc,s,s)}c.restore()}
 // pits: a hollow cut through the floor with a toothed lip in the hazard colour
 for(const e of vis){
  if(e.kind!=='pit')continue;const u=openAt(e,beat);if(u<=.02)continue;const cx=X(centerAt(e,beat)),hw=e.hw*u*sc;
  const vg=c.createLinearGradient(0,yF,0,h);vg.addColorStop(0,P.sky[2]);vg.addColorStop(1,'#0a0712');
  c.fillStyle=vg;c.beginPath();c.moveTo(cx-hw,yF-3);c.lineTo(cx-hw*.8,h);c.lineTo(cx+hw*.8,h);c.lineTo(cx+hw,yF-3);c.closePath();c.fill();
  c.strokeStyle=kd.d;c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(cx-hw,yF-3);c.lineTo(cx-hw*.8,yF+60*sc);c.moveTo(cx+hw,yF-3);c.lineTo(cx+hw*.8,yF+60*sc);c.stroke();
  c.fillStyle=kd.d;const n=Math.max(2,Math.round(hw/(6*sc)));for(let i=0;i<n;i++){const tx=cx-hw+(i+.5)*(hw*2)/n,tw=hw/n*.8;c.beginPath();c.moveTo(tx-tw,yF-1);c.lineTo(tx,yF+8*sc*u);c.lineTo(tx+tw,yF-1);c.closePath();c.fill()}
 }
 // bulges: outline the hump in the hazard colour
 for(const e of vis){
  if(e.kind!=='bulge')continue;const u=openAt(e,beat);if(u<=.02)continue;const cx=X(centerAt(e,beat)),R=(e.hw+14)*sc;
  c.strokeStyle=kd.d;c.lineWidth=3;c.beginPath();for(let sx=cx-R;sx<=cx+R;sx+=4){const wx=run.x+(sx-px)/sc,y=yF+wave(wx)+bulge(wx);if(sx===cx-R)c.moveTo(sx,y);else c.lineTo(sx,y)}c.stroke();
  c.fillStyle=kd.top;c.globalAlpha=.7;const hh=e.h*u*sc;c.fillRect(cx-e.hw*sc,yF-hh-2,e.hw*2*sc,3.2);c.globalAlpha=1;
 }
 // morph gates: a frame in the silhouette of the form that waits behind it
 for(const gt of C.gates){
  const sx=X(gt.at);if(sx<-60||sx>w+60)continue;const near=clamp(1-(gt.beat-beat)/4,0,1),Hh=SIDE.PEAK*sc*1.9,id=FORMS[gt.to].id;
  c.save();c.globalAlpha=.5+.5*near;c.strokeStyle=ink;c.lineWidth=3;c.beginPath();c.moveTo(sx-24*sc,yF);c.lineTo(sx-24*sc,yF-Hh*.8);c.quadraticCurveTo(sx,yF-Hh*1.3,sx+24*sc,yF-Hh*.8);c.lineTo(sx+24*sc,yF);c.stroke();
  c.strokeStyle=P.accent;c.lineWidth=1.6;c.stroke();
  c.globalAlpha=.4+.3*near;drawForm(c,id,sx,yF-2,SIDE.PEAK*sc*1.1,{t,reduced:true,fly:null,pose:'run',ink:'rgba(20,16,28,.35)',rim:ink});
  c.globalAlpha=.9;c.font='700 13px system-ui,sans-serif';c.textAlign='center';c.fillStyle=light?'#1b1626':'#f3eefc';c.fillText(FORMS[gt.to].name,sx,yF-Hh*1.2);c.restore();
 }
 {const gx=X(C.length);if(gx<w+60)corridorGate(c,gx,yF-h*.3,yF,P,run.finishing?run.finishing.age/run.finishing.dur:0,clamp((C.length-run.x)/(C.speed*5),0,1),MODE,sc)}
 const dia=(x,y,r,rot,fill)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=fill;c.fillRect(-r,-r,r*2,r*2);c.restore()};
 for(const sh of run.shardList){if(sh.got)continue;const sx=X(sh.e.at);if(sx<-20||sx>w+20)continue;const sy=yF-(SIDE.PEAK*FORMS[sh.e.form].pk+8)*sc;
  c.save();c.globalCompositeOperation=MODE;c.globalAlpha=.3;dia(sx,sy,9*sc,Math.PI/4,P.gold);c.restore();
  if(!(MI&&MI.drawLight(c,sx,sy,26*sc,t,sh.e.idx,reduced,0)))dia(sx,sy,4.2*sc,Math.PI/4+(reduced?0:t*1.6),P.gold)}
 if(MI&&run.itemList&&run.itemList.length)MI.drawItems(c,run,it=>{const sx=X(it.at);if(sx<-30||sx>w+30)return null;return {x:sx,y:yF-(it.lane==='hi'?SIDE.PEAK*.62+10:15)*sc,s:sc}},t,reduced,0);
 // the runner (one of the three silhouettes); morph = a short squeeze and a thin ring
 const cr=run.crash,sinkK=cr&&cr.kind==='pit'&&run.outro?clamp(run.outro.age*2.4,0,1):0,mk=clamp((run.time-run.morphAt)/.45,0,1);
 c.save();
 if(cr&&cr.kind==='pit')c.globalAlpha=1-sinkK*.6;
 const H=SIDE.PEAK*sc*1.12*(mk<1&&!reduced?1+.18*Math.sin(mk*Math.PI):1);
 drawForm(c,run.form.id,px,yF-run.height*sc+sinkK*40*sc,H,{t,reduced,fly:run.fly===null?null:run.fly/run.fl,pose:cr?'hurt':'run',ink,rim});
 c.restore();
 if(!reduced&&mk<1){c.save();c.globalAlpha=(1-mk)*.55;c.strokeStyle=P.accent;c.lineWidth=2;c.beginPath();c.ellipse(px,yF-26*sc,(14+mk*40)*sc,(22+mk*30)*sc,0,0,TAU);c.stroke();c.restore()}
 if(MI&&run.mods)MI.drawAura(c,run,px,yF-(run.height+22)*sc,SIDE.PEAK*sc*.7,t,reduced);
 if(run.time-run.pickedAt<.4){const a=(run.time-run.pickedAt)/.4;c.save();c.globalCompositeOperation=MODE;c.globalAlpha=(1-a)*.7;c.strokeStyle=P.gold;c.lineWidth=2;c.beginPath();c.arc(px,yF-30*sc,(10+a*34)*sc,0,TAU);c.stroke();c.restore()}
 c.restore();
 if(!run.hudOff)sideHud(c,run,w,h,P,'녹는 길');
 return null;
}

/* ---------- registry ---------- */
let LiquidRun=null;
const getLiquid=()=>LiquidRun||(LiquidRun=makeLiquidRun());
const ACTS=Object.freeze({liquid:o=>{const Kl=getLiquid();return new Kl(o)}});
const LABELS=Object.freeze({liquid:'녹는 길'});
function register(Course){const C=Course||root.MongyuCourse;if(!enabled||!C?.registerAct)return false;for(const [type,f] of Object.entries(ACTS))C.registerAct(type,f,LABELS[type]);return true}
const api=Object.freeze({enabled,ACTS,register,buildLiquid,formAt,openAt,centerAt,FORMS,LIQ,get LiquidRun(){return getLiquid()}});
root.MongyuLiquidAct=api;if(typeof module!=='undefined')module.exports=api;
if(enabled&&root.MongyuCourse?.registerAct)register(root.MongyuCourse);
})(globalThis);
