/* R105 chapter 6 act (workstream CH610): 눈치 / Someone Is Watching (blueprint M08 Observer). Follows the act contract of docs/R105_SPEC_KO.md (chain, items, hud, trip, determinism, events).
   eye: a stage corridor under a big eye. The lid opens and closes on a visible beat grid (a lid that rises = "watched", a closed lid = "safe"). The runner always runs; "moving" means a tap (jump).
        A tap while the lid is open fails ("눈에 들켰어요") unless the runner stands inside a lit safe pool on the floor (a spotlight announced a few beats ahead). Every hazard sits so that its tap beat is inside
        a safe window with a one-beat margin on both sides, so the rhythm of the lid is also the rhythm of the course. Cues never rely on colour alone: open eye with iris + hatched gaze beam + hollow squares
        vs. closed lid line + clear floor + filled dots; the pool is a ringed, hatch-free ellipse with corner ticks.
        options beats (length), level 0-3 (shorter safe windows, more spot pools), short (a shorter run-up for a mid-course stretch), seed, bpm, items, trip, hud:false, tutorial. Light shards hang at the apex of every second jump.
   Registers with MongyuCourse.registerAct (course-run.js registers it at load, or this file does when the course engine is already there). Inert unless MONGYU_POLISH_EDITION===true. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const TAU=Math.PI*2;
const K=()=>root.MongyuSquareAct?.kit||null;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const EYE={B:100,MARGIN:1,POOL:1.3,LEVELS:[
 {safe:[7,8],watch:[3,4],hz:[1,2],spot:0},
 {safe:[6,7,8],watch:[4,4,5],hz:[1,2],spot:.35},
 {safe:[6,6,7],watch:[4,5,5],hz:[2,2],spot:.5},
 {safe:[5,6,6],watch:[5,5,6],hz:[2,2],spot:.6}
]};
const rngOf=seed=>{const E=root.MongyuEndless;if(E?.rng)return E.rng(seed);let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}};

/* Pure, seeded layout. windows: alternating safe/watched stretches on the beat grid; events: the hazards (tap beat inside a safe window or inside a spot pool). */
function buildEye(o={}){
 const bpm=Number(o.bpm)||92,seed=(o.seed??1)>>>0,beats=Math.max(24,Number(o.beats)||44),lv=EYE.LEVELS[clamp(o.level|0,0,3)],r=rngOf(seed^0x7A3C91),B=EYE.B;
 const lead=(K()?K().SIDE.FL:.62)*bpm/120,events=[],watch=[],pools=[];let cur=0,k=0,first=true;
 const pick=a=>a[Math.floor(r()*a.length)];
 const hz=(tap,spot)=>{const m=Math.ceil(tap+lead-1e-9);events.push({m,tapBeat:m-lead,idx:k,h:r()<.45?22:14,shard:k%2===0,done:false,spot:!!spot});k++;return m};
 while(cur<beats-8){
  // safe window [cur, cur+Ls): hazards need the tap beat one beat inside both edges
  const Ls=first?(o.tutorial?11:o.short?6:10):pick(lv.safe);first=false;
  let want=o.tutorial&&k===0?1:pick(lv.hz),t=cur+EYE.MARGIN+(events.length?0:o.tutorial?5:o.short?2:4);
  for(let n=0;n<want;n++){const m=Math.ceil(t+lead-1e-9);if(m-lead+EYE.MARGIN>cur+Ls)break;hz(m-lead,false);t=m+3}
  cur+=Ls;
  // watched window [cur, cur+Lw): a stare, or (levels 1+) a hazard under a spot pool
  const Lw=o.tutorial&&watch.length===0?4:pick(lv.watch),w0=cur;
  if(Lw>=5&&lv.spot>0&&r()<lv.spot){
   const m=hz(w0+2.2,true),tb=m-lead;pools.push({b0:tb-EYE.POOL,b1:tb+EYE.POOL,x0:(tb-EYE.POOL)*B,x1:(tb+EYE.POOL)*B});
  }
  watch.push({w0,w1:w0+Lw});cur+=Lw;
 }
 const end=cur+6;
 return {bpm,B,speed:B*bpm/60,lead,beats:end,length:end*B,events,watch,pools,shardTotal:events.filter(e=>e.shard).length};
}
/* openness of the lid 0..1 at a beat: a half-beat ramp on both sides of every watched window (>= .5 exactly inside the window) */
function lidAt(C,beat){
 let L=0;
 for(const w of C.watch){if(beat<w.w0-.5)break;if(beat>w.w1+.5)continue;L=Math.max(L,Math.min(clamp(beat-(w.w0-.5),0,1),clamp(w.w1+.5-beat,0,1)))}
 return L;
}
const watchedAt=(C,x)=>{const b=x/C.B;for(const w of C.watch){if(b<w.w0)return false;if(b<w.w1)return true}return false};
const inPool=(C,x)=>{for(const p of C.pools)if(x>=p.x0&&x<=p.x1)return true;return false};
/* beats until the next change of state (watched <-> safe) */
function untilChange(C,beat){
 for(const w of C.watch){if(beat<w.w0)return {watched:false,left:w.w0-beat};if(beat<w.w1)return {watched:true,left:w.w1-beat}}
 return {watched:false,left:Math.max(0,C.beats-beat)};
}

function makeEyeRun(){
 const k=K();if(!k)return null;
 const {sideBase,hazardBlock,corridorGate,sideHud,palOf,dangerInk,lum,items,reducedMotion,SIDE}=k;
 const Base=sideBase();
 class EyeRun extends Base{
  constructor(options={}){
   super(options);this.dreamMode='eye';this.B=EYE.B;
   this.course=buildEye({bpm:this.bpm,seed:this.seed,beats:options.beats,level:options.level,tutorial:options.tutorial===true,short:options.short===true});this.length=this.course.length;this.shardTotal=this.course.shardTotal;
   this.reset();
  }
  reset(){
   const C=this.course;this.baseReset();this.hi=0;this.wasWatched=false;this.seenCoach=false;
   for(const e of C.events){e.done=false;e.absorbed=false}
   this.shardList=C.events.filter(e=>e.shard).map(e=>({e,got:false}));
   const ch=this.chain,teach=!ch||ch.first!==false||this.options.tutorial===true;
   this.coach=teach&&this.options.coachText!==false?{kind:'start',text:this.options.coachText||'눈 감으면 뛰어. 뜨면 가만히',until:3.6}:null;
   this.teach=teach;
   this.initItems(6*C.B,Math.max(1,C.length-6*C.B-4*C.B),C.B);
  }
  watchedNow(){return watchedAt(this.course,this.x)}
  /* true when a tap is allowed here: lid closed, or inside a lit pool */
  allowed(){const C=this.course;return !watchedAt(C,this.x)||inPool(C,this.x)}
  action(){
   if(this.state!=='play'||this.outro||this.finishing||this.hitStop>0)return false;
   this.inputCount++;
   if(!this.allowed()){this.crashNow('눈에 들켰어요','들켰어',{kind:'seen',at:this.x});this.events.push('seen');return true}
   if(this.fly!==null)return false;
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
   const C=this.course,sdt=this.pace(dt),W=SIDE.W+4;
   this.time+=dt;this.gt+=sdt;this.x+=C.speed*sdt;this.distance=this.x;this.buffer=0;
   this.flightStep(sdt);
   const w=this.watchedNow();
   if(w!==this.wasWatched){
    this.wasWatched=w;this.events.push(w?'eye-open':'eye-close');this.events.push(w?'pass':'corner');
    if(w&&this.teach&&!this.seenCoach){this.seenCoach=true;this.setCoach('watch',2,'보고 있어. 가만히')}
   }
   const MI=items();
   for(;this.hi<C.events.length&&this.x>C.events[this.hi].m*C.B+W+14;)this.hi++;
   for(let i=this.hi;i<C.events.length;i++){const e=C.events[i],at=e.m*C.B;if(at-W>this.x)break;
    if(!e.absorbed&&Math.abs(this.x-at)<=W&&this.height<e.h){if(MI&&this.mods&&MI.applyHit(this))e.absorbed=true;else{this.crashNow('소품에 부딪혔어요','한 박자 늦었어',{kind:'hit',at:this.x});return}}}
   for(const sh of this.shardList){if(sh.got)continue;const sx=sh.e.m*C.B;if(this.x>sx+16)continue;if(Math.abs(this.x-sx)<12&&this.height>=this.pkH-16){sh.got=true;this.shards++;this.pickedAt=this.time;this.events.push('collect')}}
   this.scoreStep();
   if(this.x>=this.length&&!this.crash)this.reachGate();
  }
  status(){return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:Math.floor(this.points),best:0,progress:this.progressNow,roomTitle:'시선',roomIndex:0,roomCount:1,instruction:'눈이 감겼을 때만 점프',cue:null,result:this.result}}
  /* Autopilot for the headless checks: taps at the tap beat of the next hazard (mode 'ignore' = a little late); never taps while watched. */
  pilot(cr,mode){
   const C=this.course,e=C.events[this.next];if(!e||this.fly!==null||this.outro||this.finishing||this.hitStop>0||!this.allowed())return;
   if(this.x>=(e.tapBeat+(mode==='ignore'?.08:0))*C.B-.5)cr.action();
  }
  draw(c,opts){return drawEye(c,this,opts,k)}
  drawAura(){}
 }
 return EyeRun;
}

/* ---------- drawing ---------- */
/* First decoded generated backdrop of the list (chapter-6 when it exists, then dark trip art, then chapter-1), cover-fitted at a low alpha under the scene. */
function artBackdrop(c,ids,w,h,alpha){
 const A=root.MongyuArt;if(!A?.ready)return false;
 for(const id of ids){if(!A.ready(id))continue;const im=A.image(id),s=Math.max(w/im.naturalWidth,h/im.naturalHeight),dw=im.naturalWidth*s,dh=im.naturalHeight*s;c.save();c.globalAlpha=alpha;c.drawImage(im,(w-dw)/2,(h-dh)/2,dw,dh);c.restore();return true}
 return false;
}
function eyeShape(c,cx,cy,ew,eh,L,t,reduced,ink,P,light){
 // almond: upper lid rises with L, lower lid is a shallow curve. L=0 -> a single curved line
 const up=eh*L,lo=eh*.22*(.35+.65*L),x0=cx-ew/2,x1=cx+ew/2;
 c.save();
 c.beginPath();c.moveTo(x0,cy);c.quadraticCurveTo(cx,cy-up*2,x1,cy);c.quadraticCurveTo(cx,cy+lo*2,x0,cy);c.closePath();
 if(L>.04){
  c.fillStyle=light?'#fbf6ee':'#e9e4f2';c.fill();
  c.save();c.clip();
  const ir=eh*.46*(reduced?1:1+.025*Math.sin(t*TAU*.5)),ix=cx+(reduced?0:Math.sin(t*.7)*ew*.04),iy=cy-up*.12;
  c.fillStyle=light?mixIris(P,.2):P.accent;c.beginPath();c.arc(ix,iy,ir,0,TAU);c.fill();
  c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.arc(ix,iy,ir,0,TAU);c.stroke();
  c.fillStyle=ink;c.beginPath();c.arc(ix,iy,ir*(.5-.1*L),0,TAU);c.fill();
  c.fillStyle='#fff';c.globalAlpha=.9;c.beginPath();c.arc(ix-ir*.28,iy-ir*.3,ir*.14,0,TAU);c.fill();
  c.restore();
 }
 c.lineJoin='round';c.lineCap='round';c.strokeStyle=ink;c.lineWidth=4.2;
 c.beginPath();c.moveTo(x0,cy);c.quadraticCurveTo(cx,cy-up*2,x1,cy);c.stroke();
 c.lineWidth=2.6;c.beginPath();c.moveTo(x0,cy);c.quadraticCurveTo(cx,cy+lo*2,x1,cy);c.stroke();
 // lashes: point up when open, fall downward when closed (a second cue besides the lid line)
 c.lineWidth=3;
 for(let i=0;i<9;i++){
  const u=(i+.5)/9,peak=1-Math.pow(2*u-1,2),bx=x0+ew*u,by=cy-up*peak,dir=L>.5?-1:1,len=eh*(.22+.1*peak)*(L>.5?1:.8),sw=(u-.5)*ew*.1;
  c.beginPath();c.moveTo(bx,by);c.lineTo(bx+sw,by+dir*len);c.stroke();
 }
 // brow
 c.lineWidth=3;c.globalAlpha=.8;c.beginPath();c.moveTo(x0+ew*.08,cy-eh*(.95+.25*L));c.quadraticCurveTo(cx,cy-eh*(1.5+.3*L),x1-ew*.08,cy-eh*(.95+.25*L));c.stroke();
 c.restore();
}
const mixIris=(P,k)=>root.MongyuTrip?.mix?.(P.accent,'#ffffff',k)||P.accent;
function drawEye(c,run,opts,k){
 const {palOf,dangerInk,lum,items,SIDE,hazardBlock,corridorGate,sideHud}=k;
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,C=run.course,MI=items(),P=palOf(run.trip),kd=dangerInk(P),light=lum(P.sky[1])>.5,MODE=light?'source-over':'lighter';
 const sc=clamp(Math.min(w/300,h/560),.8,1.7),yF=h*.64,px=w*.3,X=wx=>px+(wx-run.x)*sc,beat=run.x/C.B;
 const ink=light?'#1b1626':'#f3eefc',beatP=reduced?0:.5+.5*Math.cos(((t*run.bpm/60)%1)*TAU);
 const Lraw=lidAt(C,beat),L=reduced?(Lraw<.25?0:Lraw<.75?.5:1):Lraw,ch=untilChange(C,beat),watched=watchedAt(C,run.x);
 c.save();
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,P.sky[0]);g.addColorStop(.5,P.sky[1]);g.addColorStop(1,P.sky[2]);c.fillStyle=g;c.fillRect(0,0,w,h);
 artBackdrop(c,['chapter-6','trip-heart','chapter-1'],w,h,light?.22:.3);
 // stage: back wall, curtains at both sides, valance on top
 c.fillStyle=P.block[1];c.globalAlpha=.4;c.fillRect(0,h*.34,w,yF-h*.34);c.globalAlpha=1;
 const folds=(x0,x1,dir)=>{const wd=x1-x0;c.fillStyle=P.block[2];c.fillRect(x0,0,wd,yF);for(let i=0;i<5;i++){const fx=x0+wd*(i+.5)/5;c.fillStyle=P.block[i%2?0:1];c.globalAlpha=.55;c.fillRect(fx-wd/14,0,wd/7,yF);c.globalAlpha=1}
  c.strokeStyle=P.rim;c.globalAlpha=.55;c.lineWidth=1.4;c.beginPath();c.moveTo(dir>0?x1:x0,0);c.lineTo(dir>0?x1:x0,yF);c.stroke();c.globalAlpha=1};
 folds(0,w*.07,1);folds(w*.93,w,-1);
 c.fillStyle=P.block[2];c.fillRect(0,0,w,h*.035);c.strokeStyle=P.rim;c.globalAlpha=.6;c.lineWidth=1.4;c.beginPath();c.moveTo(0,h*.035);c.lineTo(w,h*.035);c.stroke();c.globalAlpha=1;
 // stage floor: planks that repeat, with a rim line
 c.fillStyle=P.block[2];c.fillRect(0,yF,w,h-yF);c.fillStyle=P.block[0];c.globalAlpha=.7;c.fillRect(0,yF,w,10*sc);c.globalAlpha=1;
 {const per=60*sc,off=((run.x*sc)%per+per)%per;c.strokeStyle=P.rim2;c.globalAlpha=.35;c.lineWidth=1.2;for(let x=-off;x<w+per;x+=per){c.beginPath();c.moveTo(x,yF+10*sc);c.lineTo(x-26*sc,h);c.stroke()}c.globalAlpha=1}
 c.save();c.globalCompositeOperation=MODE;c.strokeStyle=P.rim;c.globalAlpha=.9;c.lineWidth=1.8;c.beginPath();c.moveTo(0,yF);c.lineTo(w,yF);c.stroke();c.restore();
 // footlights on the beat grid
 {const first=Math.floor((run.x-px/sc)/C.B)*C.B;for(let wx=first;X(wx)<w+C.B*sc;wx+=C.B){const sx=X(wx),on=((wx/C.B)%4===0);c.fillStyle=P.gold;c.globalAlpha=on?.8:.45;c.beginPath();c.arc(sx,yF+7*sc,(on?3.2:2.2)*sc*(1+.15*beatP),Math.PI,0);c.fill()}c.globalAlpha=1}
 // the eye
 const ew=Math.min(w*.84,340),eh=ew*.2,ex=w*.5,ey=h*.27;
 eyeShape(c,ex,ey,ew,eh,L,t,reduced,ink,P,light);
 // gaze beam: hatched triangle from the pupil to the floor, with the lit pools cut out
 if(L>.05){
  c.save();c.beginPath();c.moveTo(ex,ey+eh*.25);c.lineTo(-10,yF);c.lineTo(w+10,yF);c.closePath();
  for(const p of C.pools){const a=X(p.x0),b=X(p.x1);if(b<-20||a>w+20)continue;c.moveTo(b,yF+7*sc);c.ellipse((a+b)/2,yF+7*sc,(b-a)/2,9*sc,0,0,TAU)}
  c.clip('evenodd');
  c.fillStyle=light?'#2a2434':'#ffffff';c.globalAlpha=.06*L;c.fillRect(0,ey,w,yF-ey);
  c.strokeStyle=light?P.rim:P.glow;c.globalAlpha=.34*L;c.lineWidth=1.6;
  const gap=16*sc,sh=((run.x*.4*sc)%gap+gap)%gap;
  for(let x=-h-sh;x<w+gap;x+=gap){c.beginPath();c.moveTo(x,yF);c.lineTo(x+(yF-ey),ey);c.stroke()}
  c.restore();
 }
 // spot pools: a hatch-free, ringed ellipse with corner ticks and a soft light shaft
 for(const p of C.pools){
  const a=X(p.x0),b=X(p.x1);if(b<-30||a>w+30)continue;const cx=(a+b)/2,rx=(b-a)/2,ry=9*sc,ahead=clamp(1-(p.b0-beat)/5,0,1);
  c.save();c.globalCompositeOperation=MODE;
  const sg=c.createLinearGradient(0,yF-h*.3,0,yF);sg.addColorStop(0,P.gold+'00');sg.addColorStop(1,P.gold+(light?'44':'55'));c.globalAlpha=.35+.65*ahead;c.fillStyle=sg;
  c.beginPath();c.moveTo(cx-rx*.35,yF-h*.3);c.lineTo(cx+rx*.35,yF-h*.3);c.lineTo(b,yF+7*sc);c.lineTo(a,yF+7*sc);c.closePath();c.fill();c.restore();
  c.save();c.globalAlpha=.35+.65*ahead;c.fillStyle=P.gold;c.globalAlpha*=.55;c.beginPath();c.ellipse(cx,yF+7*sc,rx,ry,0,0,TAU);c.fill();c.globalAlpha=.35+.65*ahead;
  c.strokeStyle=ink;c.lineWidth=2.4;c.beginPath();c.ellipse(cx,yF+7*sc,rx,ry,0,0,TAU);c.stroke();c.lineWidth=1.2;c.beginPath();c.ellipse(cx,yF+7*sc,rx*.78,ry*.62,0,0,TAU);c.stroke();
  for(const sx of [a,b]){c.lineWidth=2.4;c.beginPath();c.moveTo(sx,yF+7*sc-ry*1.5);c.lineTo(sx,yF+7*sc+ry*1.5);c.stroke()}
  c.restore();
 }
 // hazards (stage props), gate
 for(const e of C.events){const sx=X(e.m*C.B);if(sx<-30)continue;if(sx>w+30)break;hazardBlock(c,sx,yF,SIDE.W*2*sc,e.h*sc,-1,kd,P,e.absorbed,reduced?1:1+.05*(beatP*2-1))}
 {const gx=X(C.length);if(gx<w+60)corridorGate(c,gx,yF-h*.3,yF,P,run.finishing?run.finishing.age/run.finishing.dur:0,clamp((C.length-run.x)/(C.speed*5),0,1),MODE,sc)}
 const dia=(x,y,r,rot,fill)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=fill;c.fillRect(-r,-r,r*2,r*2);c.restore()};
 for(const sh of run.shardList){if(sh.got)continue;const sx=X(sh.e.m*C.B);if(sx<-20||sx>w+20)continue;const sy=yF-(SIDE.PEAK+8)*sc;
  c.save();c.globalCompositeOperation=MODE;c.globalAlpha=.3;dia(sx,sy,9*sc,Math.PI/4,P.gold);c.restore();
  if(!(MI&&MI.drawLight(c,sx,sy,26*sc,t,sh.e.idx,reduced,0)))dia(sx,sy,4.2*sc,Math.PI/4+(reduced?0:t*1.6),P.gold)}
 if(MI&&run.itemList&&run.itemList.length)MI.drawItems(c,run,it=>{const sx=X(it.at);if(sx<-30||sx>w+30)return null;return {x:sx,y:yF-(it.lane==='hi'?SIDE.PEAK*.62+10:15)*sc,s:sc}},t,reduced,0);
 // the runner holds its breath (stand pose) while the lid is open and no pool covers it
 const cr=run.crash,frozen=watched&&!inPool(C,run.x);
 if(root.MongyuMobile?.sprite)root.MongyuMobile.sprite(c,{x:px,y:yF-run.height*sc,bodyHeight:SIDE.PEAK*sc*1.12,renderAngle:0,strideDistance:run.x,nativeState:0,height:run.height,jumpProgress:run.fly===null?0:run.fly/run.fl,pose:cr?'hurt':run.fly!==null?'jump':frozen?'stand':'run'},{poseTime:t,onDark:true},reduced);
 else{c.fillStyle='#fff3e0';c.fillRect(px-5,yF-run.height*sc-SIDE.PEAK*sc,10,SIDE.PEAK*sc)}
 if(MI&&run.mods)MI.drawAura(c,run,px,yF-(run.height+22)*sc,SIDE.PEAK*sc*.7,t,reduced);
 if(run.time-run.pickedAt<.4){const a=(run.time-run.pickedAt)/.4;c.save();c.globalCompositeOperation=MODE;c.globalAlpha=(1-a)*.7;c.strokeStyle=P.gold;c.lineWidth=2;c.beginPath();c.arc(px,yF-30*sc,(10+a*34)*sc,0,TAU);c.stroke();c.restore()}
 // state tag and countdown pips: hollow squares + "보는 중" while watched, filled dots + "눈 감음" while safe
 {
  const ty=ey+eh*.5+Math.max(16,h*.026),word=watched?'보는 중':'눈 감음';
  c.font='700 14px system-ui,sans-serif';c.textAlign='center';const tw=c.measureText(word).width+34,pill=18;
  c.fillStyle=light?'rgba(255,250,244,.82)':'rgba(20,12,36,.7)';c.strokeStyle=ink;c.lineWidth=1.6;
  c.beginPath();if(c.roundRect)c.roundRect(ex-tw/2,ty-pill*.75,tw,pill*1.5,pill*.75);else c.rect(ex-tw/2,ty-pill*.75,tw,pill*1.5);c.fill();c.stroke();
  c.fillStyle=ink;c.fillText(word,ex+8,ty+5);
  if(watched){c.lineWidth=2;c.beginPath();c.arc(ex-tw/2+14,ty,5,0,TAU);c.stroke();c.beginPath();c.arc(ex-tw/2+14,ty,1.8,0,TAU);c.fill()}else{c.lineWidth=2.4;c.beginPath();c.moveTo(ex-tw/2+8,ty);c.lineTo(ex-tw/2+20,ty);c.stroke()}
  const n=Math.min(5,Math.max(1,Math.ceil(ch.left-1e-6))),py=ty+pill*1.2+7,gapp=14;
  c.lineWidth=1.8;for(let i=0;i<n;i++){const x=ex+(i-(n-1)/2)*gapp;if(watched){c.strokeRect(x-4,py-4,8,8)}else{c.beginPath();c.arc(x,py,4,0,TAU);c.fill()}}
 }
 c.restore();
 if(!run.hudOff)sideHud(c,run,w,h,P,'눈치');
 return null;
}

/* ---------- registry ---------- */
let EyeRun=null;
const getEye=()=>EyeRun||(EyeRun=makeEyeRun());
const ACTS=Object.freeze({eye:o=>{const Kl=getEye();return new Kl(o)}});
const LABELS=Object.freeze({eye:'시선'});
function register(Course){const C=Course||root.MongyuCourse;if(!enabled||!C?.registerAct)return false;for(const [type,f] of Object.entries(ACTS))C.registerAct(type,f,LABELS[type]);return true}
const api=Object.freeze({enabled,ACTS,register,buildEye,lidAt,watchedAt,inPool,untilChange,EYE,get EyeRun(){return getEye()}});
root.MongyuEyeAct=api;if(typeof module!=='undefined')module.exports=api;
if(enabled&&root.MongyuCourse?.registerAct)register(root.MongyuCourse);
})(globalThis);
