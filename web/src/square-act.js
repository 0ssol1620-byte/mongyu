/* R105 new acts for chapters 2-5 (workstream CP). Owned by workstream CP; both follow the act contract of docs/R105_SPEC_KO.md (chain, items, hud, trip, determinism, events).
   square: a finite, chain-aware wrapper of EndlessRun (the rotating square room, Nom-style): options sides (length), startLap (difficulty), seed, bpm (hazards snap to the beat grid),
           calm (wider gaps), items, trip (dark neon look), hud:false, tutorial. Clear = reaching the aurora gate that stands on the last straight side.
   flip:   a gravity-flip corridor: tap = gravity flips and you fall (accelerating) to the opposite surface. Crystals on one surface force the flip, every flip is a beat on the grid.
           options beats (length), level 0-3 (spacing and tall crystals), seed, bpm, items, trip, hud:false, tutorial. Light shards hang on the ideal flip path, the memory star on a late-flip path.
   mirror: a reflected twin runs under the mirror line, repeating every tap one beat late. Hazards sit in both lanes: a tap clears the player's block now and the twin's block one beat later, so some taps
           are for the twin only (jump on empty ground). options beats, level 0-3 (share of twin-only taps, tighter spacing), seed, bpm, items, trip, hud:false, tutorial. Light shards hang at the apex of every tap.
   wait:   a hotel corridor with elevator doors. Luggage carts need a jump as usual; at each elevator the car brakes to a stop and NOT pressing is the answer: a tap there fails ("누르지 않기").
           options waits (doors), level 0-2, seed, bpm, items, trip, hud:false, tutorial.
   All four register with MongyuCourse.registerAct (course-run.js registers them at load, or this file does when the course engine is already there). Inert unless MONGYU_POLISH_EDITION===true. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const num=v=>Number.isFinite(v)?v:0;
const reducedMotion=()=>{try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}};
const cvdOn=()=>{try{const d=root.document?.documentElement;return !!d&&d.dataset&&d.dataset.cvd==='on'}catch(_){return false}};
const items=()=>root.MONGYU_UI_EDITION===true&&root.MongyuItems?.enabled?root.MongyuItems:null;
const mixc=(a,b,k)=>root.MongyuTrip?.mix?.(a,b,k)||a;
const lum=c=>{const n=parseInt(String(c).slice(1,7),16)||0;return (.2126*(n>>16&255)+.7152*(n>>8&255)+.0722*(n&255))/255};

/* ================================================================== square */
function makeSquareRun(){
 const E=root.MongyuEndless;if(!E?.EndlessRun)return null;
 const {EndlessRun,LAP,SIDE,L,FLIGHT,PEAK,surface,offset,generateSide}=E;
 const END_V=250,GATE_CLEAR=1.1;
 class SquareRun extends EndlessRun{
  constructor(options={}){
   const chain=options.chain||null,bpm=Number(chain?.bpm??options.bpm)||100,seed=(chain?.seed??options.seed??1)>>>0;
   super({...options,daily:false,seed,lapBase:options.startLap|0,beatBpm:bpm,maxSpeed:options.maxSpeed||172,calm:options.calm,viewport:options.viewport,settings:options.settings,attempt:options.attempt});
   this.dreamMode='square';this.hudOff=options.hud===false;this.theme=E.tripTheme?.(options.trip)||null;
  }
  reset(){
   const o=this.options,ch=o.chain||null,sides=Math.max(2,Math.trunc(o.sides)||8);
   this.chain=ch;this.length=(sides-1)*SIDE+END_V;this.bpm=Number(ch?.bpm??o.bpm)||100;this.shardTotal=0;this.finishing=null;this.points=0;this._own=0;
   super.reset();
   const carry=ch?.carry||{};this.points=num(carry.points);this.perfectStreak=num(carry.perfectStreak);this.score=this.points;this._own=0;
   const teach=!ch||ch.first!==false||o.tutorial===true;
   this.coach=teach&&o.coachText!==false?{kind:'start',text:o.coachText||'탭하여 점프',until:3}:null;
   const MI=items();
   if(MI&&(ch||o.items)){const st=170,len=Math.max(1,this.length-st-110);MI.setup(this,{items:o.items,start:st,len,beat:Math.min(this.maxSpeed,E.speedFor(this.lapBase))*60/this.bpm})}
   else{this.mods=null;this.itemList=null}
  }
  /* The whole course is generated at once (deterministic) so the light-shard total is known; hazards stay clear of the gate. */
  ensure(){
   if(this.generated>0)return;
   const sides=Math.ceil(this.length/SIDE)+1,opt=this.genOpt()||{lapBase:this.lapBase,beat:this.beatBpm,maxSpeed:this.maxSpeed,calm:this.calm},lim=this.length-GATE_CLEAR*this.maxSpeed*.5;
   let k=0;
   for(let i=0;i<sides;i++)for(const o of generateSide(this.seed,i,opt)){
    const end=o.kind==='pit'?o.end:o.kind==='double'?o.parts[1]+o.w:o.at+o.w;if(end>lim)continue;
    o.shard=(k++)%2===1;if(o.shard)this.shardTotal++;this.obstacles.push(o);
   }
   this.generated=sides;
  }
  retry(){this.attempt++;this.reset();this.state='play';this.events.push('start');return true}
  /* Hooks of EndlessRun: the item mods act through the shared helpers. */
  pace(dt){const MI=items();return MI?MI.applyPace(this,dt):dt}
  flightTime(){const MI=items();return MI?MI.applyJump(this,FLIGHT):FLIGHT}
  peakHeight(){return PEAK*(this.pk||1)}
  absorb(){const MI=items();return MI?MI.applyHit(this):false}
  setCoach(kind,hold,text){if(kind==='lap')return;super.setCoach(kind,hold,text)}
  tick(dt){
   if(this.state!=='play')return;
   if(this.finishing){const f=this.finishing;f.age+=dt;this.clock+=dt;this.time+=dt;this.distance+=this.speed*dt*Math.max(0,1-f.age/f.dur)*.9;if(f.age>=f.dur)this.complete();return}
   super.tick(dt);
   if(this.state!=='play')return;
   const own=this.score;this.points+=own-this._own;this._own=own;this.score=this.points;
   const MI=items();if(MI&&this.mods){MI.collect(this,this.distance,this.height,this.pkH,13);MI.settle(this)}
   if(this.distance>=this.length&&!this.crash)this.reachGate();
  }
  reachGate(){
   const ch=this.chain;this.events.push('portal');
   if(ch&&ch.last===false)this.complete();
   else this.finishing={age:0,dur:GATE_CLEAR};
  }
  complete(){this.finishing=null;this.finish('clear')}
  finish(state){
   this.state=state;this.outro=null;this.finishing=null;
   this.result={mode:'square',state,points:Math.floor(this.points),score:Math.floor(this.points),shards:this.shards,shardTotal:this.shardTotal,perfectStreak:this.perfectStreak,perfects:this.perfects,bestStreak:this.bestStreak,
    time:this.time,attempt:this.attempt,seed:this.seed,meters:Math.floor(this.distance/10),reason:state==='clear'?'오로라의 문을 지났어요.':this.crash?.fall?'틈에 빠졌어요':'블록에 부딪혔어요'};
   this.events.push(state);
  }
  get progressNow(){return clamp(this.distance/this.length,0,1)}
  status(){
   return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:Math.floor(this.points),best:0,progress:this.progressNow,roomTitle:'사각 방',roomIndex:0,roomCount:1,instruction:'탭하여 점프',cue:null,result:this.result};
  }
  /* Autopilot used by the headless checks: jumps at the centre of the jump arc (mode 'ignore' = a sloppier tap that still clears). */
  pilot(cr,mode){
   const o=this.obstacles[this.index];if(!o||this.flight!==null||this.outro||this.finishing||this.hitStop>0)return;
   const fl=this.mods&&this.mods.featherCharges>0?FLIGHT*(items()?.TUNING?.featherLen||1.6):FLIGHT,ideal=this.speed*fl/2-(mode==='ignore'?7:0);
   if(o.at-this.distance<=ideal+.5)cr.action();
  }
  /* inside the camera space of EndlessRun.draw: pickups, aurora gate. */
  drawWorld(c,x){
   const MI=items();
   if(MI&&this.itemList&&this.itemList.length)MI.drawItems(c,this,it=>{const p=surface(it.at),q=offset(p,it.lane==='hi'?PEAK*.62:15);return {x:q.x,y:q.y,s:1}},x.t,x.reduced,x.up);
   const g=surface(this.length),near=clamp((this.length-this.distance)/(this.speed*5),0,1);
   gateArt(c,g,this.theme,x.t,x.reduced,near,this.finishing?this.finishing.age/this.finishing.dur:0);
  }
  drawAura(c,x,y,o){const MI=items();if(MI&&this.mods)MI.drawAura(c,this,x,y,26,o.t,o.reduced)}
 }
 return SquareRun;
}
/* The aurora gate: two neon posts and a soft curtain standing on the surface (surface angle g.a). */
function gateArt(c,g,th,t,reduced,near,open){
 const P=th?.P||root.MongyuTrip?.get?.('violet')||{aurora:'#4df5e0',rim:'#7b3cff',rim2:'#ff2e9a',glow:'#b46bff'},H=70,Wd=26;
 c.save();c.translate(g.x,g.y);c.rotate(g.a);
 const a=.55+.45*(1-near);
 c.globalCompositeOperation=th?.mode||'lighter';
 const gr=c.createLinearGradient(0,-H,0,0);gr.addColorStop(0,P.aurora+'00');gr.addColorStop(.6,P.aurora+(reduced?'33':'44'));gr.addColorStop(1,P.glow+'88');
 c.globalAlpha=a*(1-open*.5);c.fillStyle=gr;c.fillRect(-Wd,-H,Wd*2,H);
 c.globalAlpha=a;c.lineWidth=3;c.strokeStyle=P.aurora;c.beginPath();c.moveTo(-Wd,0);c.lineTo(-Wd,-H+Wd);c.arc(0,-H+Wd,Wd,Math.PI,0);c.lineTo(Wd,0);c.stroke();
 c.lineWidth=9;c.globalAlpha=a*.2;c.stroke();
 if(!reduced){c.globalAlpha=a*.5;c.lineWidth=1.2;c.strokeStyle=P.rim2;for(let i=0;i<3;i++){const y=-H*(.2+.25*i)-Math.sin(t*1.3+i)*3;c.beginPath();c.moveTo(-Wd+4,y);c.lineTo(Wd-4,y);c.stroke()}}
 c.restore();
 const MA=root.MongyuArt;if(MA?.ready?.('item-gate')){c.save();c.translate(g.x,g.y);c.rotate(g.a);c.globalAlpha=.9;const im=MA.image('item-gate');c.drawImage(im,-48,-100,96,96);c.restore()}
}

/* ================================================================== flip */
const FLIP={CH:250,BODY:40,B:100,TFB:.72,CRY_W:24,LEAD:1.05,WIN:.3,MIN_GAP:.62,REACH:24,SHARD_H:30};
const LEVELS=[
 {gap:[1.4,1.9],len:[1,1.5],tall:0},
 {gap:[1.0,1.5],len:[.5,1,1.5],tall:0},
 {gap:[.8,1.2],len:[.5,1,1.5,2],tall:.25},
 {gap:[.7,1.0],len:[.5,1,1.5,2],tall:.35}
];
/* Pure, seeded layout: flip events (tap beats) and the crystals that force each one. Everything is on the beat grid. */
function buildFlip(o={}){
 const E=root.MongyuEndless,rng=E?.rng||(seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}});
 const bpm=Number(o.bpm)||100,seed=(o.seed??1)>>>0,beats=Math.max(16,Number(o.beats)||36),lv=LEVELS[clamp(o.level|0,0,LEVELS.length-1)],r=rng(seed^0x51ED27),B=FLIP.B;
 const events=[],crystals=[];let b=o.tutorial?6:5,surf=0,k=0;
 const q=v=>Math.round(v*4)/4;
 while(b+FLIP.LEAD+1<beats-3){
  const len=lv.len[Math.floor(r()*lv.len.length)],tall=lv.tall>0&&k>=2&&r()<lv.tall,lead=tall?1.25:FLIP.LEAD,start=q(b+lead),n=Math.max(1,Math.round(len*B/(FLIP.CRY_W*2.4)));
  /* the crystals sit on the surface we leave; each flip may carry a shard on its mid-air path and every 5th is the star path */
  crystals.push({surf,start,len,n,h:tall?72:40,tall,beat:b});
  events.push({beat:b,from:surf,to:1-surf,shard:k%2===0,idx:k,done:false});
  const gap=lv.gap[0]+r()*(lv.gap[1]-lv.gap[0]);
  b=q(start+len+gap);surf=1-surf;k++;
 }
 const end=q((events.length?crystals[crystals.length-1].start+crystals[crystals.length-1].len:b)+4);
 return {bpm,B,speed:B*bpm/60,beats:end,length:end*B,events,crystals,shardTotal:events.filter(e=>e.shard).length,tf:FLIP.TFB*60/bpm};
}

function makeFlipRun(){
 class FlipRun{
  constructor(options={}){
   this.options=options;this.mode='dream';this.dreamMode='flip';this.openingCourse=false;this.polish=true;this.hudOff=options.hud===false;
   this.chain=options.chain||null;this.settings={...(options.settings||{})};this.attempt=options.attempt||1;this.trip=options.trip||'violet';
   this.bpm=Number(this.chain?.bpm??options.bpm)||100;this.seed=(this.chain?.seed??options.seed??1)>>>0;
   this.course=buildFlip({bpm:this.bpm,seed:this.seed,beats:options.beats,level:options.level,tutorial:options.tutorial===true});
   this.setViewport(options.viewport?.width,options.viewport?.height);this.reset();
  }
  reset(){
   const C=this.course,ch=this.chain,carry=ch?.carry||{};
   this.state='ready';this.time=0;this.clock=0;this.updates=0;this.inputCount=0;this.events=[];this.hearts=1;this.x=0;this.distance=0;this.surf=0;this.fy=0;this.fly=null;this.buffer=0;
   this.crash=null;this.hitStop=0;this.outro=null;this.finishing=null;this.result=null;this.points=num(carry.points);this._own=0;this.score=this.points;this.perfectStreak=num(carry.perfectStreak);this.bestStreak=0;this.perfects=0;
   this.shards=0;this.shardTotal=C.shardTotal;this.flips=0;this.passed=0;this.next=0;this.cnext=0;this.perfectPoints=0;this.landedAt=-10;this.pickedAt=-10;this.pose=undefined;this.fx=[];
   for(const e of C.events)e.done=false;
   for(const s of C.crystals)s.passed=false;
   this.shardList=C.events.filter(e=>e.shard).map(e=>({e,got:false}));
   const teach=!ch||ch.first!==false||this.options.tutorial===true;
   this.coach=teach&&this.options.coachText!==false?{kind:'start',text:this.options.coachText||'탭하면 중력이 뒤집혀',until:3.2}:null;
   const MI=items();
   if(MI&&(ch||this.options.items)){const st=5*C.B,len=Math.max(1,C.length-st-4*C.B);MI.setup(this,{items:this.options.items,start:st,len,beat:C.B})}
   else{this.mods=null;this.itemList=null}
  }
  setViewport(width=390,height=844){this.viewport={width,height}}
  get speed(){return this.course.speed}
  start(){if(this.state!=='ready')return false;this.state='play';this.events.push('start');return true}
  pause(){if(this.state!=='play')return false;this.state='pause';this.cancelInput();this.events.push('pause');return true}
  resume(){if(this.state!=='pause')return false;this.state='play';return true}
  retry(){this.attempt++;this.reset();this.state='play';this.events.push('start');return true}
  inputDown(){return this.action()}
  inputUp(){}
  cancelInput(){this.buffer=0}
  drainEvents(){return this.events.splice(0)}
  action(){
   if(this.state!=='play'||this.outro||this.finishing||this.hitStop>0)return false;
   this.inputCount++;
   if(this.fly!==null){if(this.fly>=this.course.tf-.14)this.buffer=.14;return false}
   return this.flip();
  }
  flip(){
   const C=this.course;this.fly=0;this.buffer=0;this.jumpFrom=this.surf;this.events.push('jump');this.flips++;
   const e=C.events[this.next];
   if(e&&!e.done&&Math.abs(this.x/C.B-e.beat)<=2.2){
    e.done=true;this.next++;const err=Math.abs(this.x/C.B-e.beat);
    if(err<=FLIP.WIN*.55){this.perfects++;this.perfectStreak++;this.bestStreak=Math.max(this.bestStreak,this.perfectStreak);this.perfectPoints+=20*Math.min(5,this.perfectStreak);this.events.push('perfect');this.setCoach('perfect',.6,'완벽!')}
    else{this.perfectStreak=0;this.events.push('pass')}
   }else this.perfectStreak=0;
   return true;
  }
  setCoach(kind,hold,text){this.coach={kind,text,until:this.time+hold}}
  /* player centre height above the floor (0..CH): floor/ceiling rest, accelerating fall in between */
  yc(){
   const half=FLIP.BODY/2,lo=half,hi=FLIP.CH-half;
   if(this.fly===null)return this.surf===0?lo:hi;
   const k=clamp(this.fly/this.course.tf,0,1),e=k*k,a=this.jumpFrom===0?lo:hi,b=this.jumpFrom===0?hi:lo;return a+(b-a)*e;
  }
  tick(dt){
   if(this.state!=='play')return;
   this.updates++;this.clock+=dt;
   if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);return}
   if(this.outro){this.outro.age+=dt;if(this.outro.age>=this.outro.duration)this.finish('fail');return}
   const C=this.course,MI=items(),sdt=MI&&this.mods?MI.applyPace(this,dt):dt;
   if(this.finishing){const f=this.finishing;f.age+=dt;this.time+=dt;this.x+=C.speed*sdt*Math.max(0,1-f.age/f.dur)*.9;this.distance=this.x;if(f.age>=f.dur)this.complete();return}
   this.time+=dt;this.x+=C.speed*sdt;this.distance=this.x;this.buffer=Math.max(0,this.buffer-dt);
   if(this.fly!==null){
    this.fly+=sdt;
    if(this.fly>=C.tf){this.fly=null;this.surf=1-this.jumpFrom;this.events.push('land');this.landedAt=this.time;if(this.buffer>0)this.flip()}
   }
   // crystals
   const y=this.yc(),half=FLIP.BODY/2-4;
   for(let i=this.cnext;i<C.crystals.length;i++){
    const s=C.crystals[i],x0=s.start*C.B,x1=(s.start+s.len)*C.B;
    if(x0-14>this.x)break;
    if(this.x>x1+14){if(i===this.cnext){this.cnext++;this.passed++}continue}
    if(this.x>=x0-FLIP.CRY_W*.4&&this.x<=x1+FLIP.CRY_W*.4){
     const lo=s.surf===0?0:FLIP.CH-s.h,hi=s.surf===0?s.h:FLIP.CH;
     if(y+half>lo+3&&y-half<hi-3&&!s.absorbed){if(MI&&this.mods&&MI.applyHit(this)){s.absorbed=true}else{this.crashAt(s);return}}
    }
   }
   // light shards on the ideal flip path (mid corridor, x of the middle of the fall)
   for(const sh of this.shardList){
    if(sh.got)continue;const sx=(sh.e.beat*C.B)+Math.sqrt(.5)*C.tf*C.speed;
    if(this.x>sx+FLIP.REACH+4)continue;
    if(Math.abs(this.x-sx)<FLIP.REACH&&Math.abs(y-FLIP.CH/2)<FLIP.SHARD_H&&this.fly!==null){sh.got=true;this.shards++;this.pickedAt=this.time;this.events.push('collect')}
   }
   const own=Math.floor(this.x/12)+this.flips*10+this.perfectPoints+this.shards*25;this.points+=own-this._own;this._own=own;this.score=this.points;
   if(MI&&this.mods){MI.collect(this,this.x,this.fly===null?0:1,1,13);MI.settle(this)}
   if(this.x>=C.length&&!this.crash)this.reachGate();
  }
  /* items: 'lo' pickups ride the surface we stand on (collected while grounded), 'hi' hang mid-corridor (collected in the fall) */
  surfAtX(x){
   const C=this.course;let s=0;
   for(const e of C.events){if(x>=e.beat*C.B+C.tf*C.speed*.9)s=e.to;else break}
   return s;
  }
  crashAt(s){
   this.hearts=0;this.perfectStreak=0;this.crash={kind:'crystal',at:this.x,surf:s.surf};this.events.push('hit');
   const reduced=reducedMotion();this.hitStop=reduced?0:.12;this.outro={kind:'fail',age:0,duration:.8};
   this.setCoach('crash',2,'한 박자 늦었어');
  }
  reachGate(){this.events.push('portal');const ch=this.chain;if(ch&&ch.last===false)this.complete();else this.finishing={age:0,dur:1.0}}
  complete(){this.finishing=null;this.finish('clear')}
  finish(state){
   this.state=state;this.outro=null;this.finishing=null;
   this.result={mode:'flip',state,points:Math.floor(this.points),score:Math.floor(this.points),shards:this.shards,shardTotal:this.shardTotal,perfectStreak:this.perfectStreak,perfects:this.perfects,bestStreak:this.bestStreak,
    time:this.time,attempt:this.attempt,seed:this.seed,flips:this.flips,reason:state==='clear'?'오로라의 문을 지났어요.':'수정에 부딪혔어요'};
   this.events.push(state);
  }
  status(){
   return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:Math.floor(this.points),best:0,progress:clamp(this.x/this.course.length,0,1),roomTitle:'중력 뒤집기',roomIndex:0,roomCount:1,instruction:'탭하면 중력이 뒤집혀',cue:null,result:this.result};
  }
  /* Autopilot for the headless checks: taps on the beat of the next flip event (mode 'ignore' = a little late, still inside the window). */
  pilot(cr,mode){
   const C=this.course,e=C.events[this.next];if(!e||this.fly!==null||this.outro||this.finishing||this.hitStop>0)return;
   const tapAt=(e.beat+(mode==='ignore'?.22:0))*C.B;
   if(this.x>=tapAt-.5)cr.action();
  }
  drawSelf(c,opts){return drawFlip(c,this,opts)}
  drawAura(){}
 }
 return FlipRun;
}

/* ---------- flip drawing ---------- */
const skyline=new Map();
/* One tile of mirrored castle silhouettes (spires up), cached per palette + size; the top and bottom layers reuse it flipped. */
function skylineTile(P,key,wpx,hpx,seed){
 const k=key+'|'+wpx+'x'+hpx+'|'+seed;let t=skyline.get(k);if(t!==undefined)return t;
 try{
  const doc=root.document;if(!doc?.createElement){skyline.set(k,null);return null}
  const cv=doc.createElement('canvas');cv.width=wpx;cv.height=hpx;const x=cv.getContext('2d');if(!x){skyline.set(k,null);return null}
  let a=seed>>>0;const rnd=()=>{a=(a+0x6D2B79F5)>>>0;let t2=a;t2=Math.imul(t2^t2>>>15,t2|1);t2^=t2+Math.imul(t2^t2>>>7,t2|61);return((t2^t2>>>14)>>>0)/4294967296};
  x.fillStyle=P.block[1];x.strokeStyle=P.rim;x.lineWidth=1.2;x.lineJoin='round';
  let px0=0;
  while(px0<wpx){
   const bw=wpx*(.05+rnd()*.07),bh=hpx*(.35+rnd()*.55),roof=rnd();
   x.beginPath();x.moveTo(px0,hpx);x.lineTo(px0,hpx-bh);
   if(roof<.45){x.lineTo(px0+bw/2,hpx-bh-bw*.9);x.lineTo(px0+bw,hpx-bh)}
   else if(roof<.75){x.lineTo(px0,hpx-bh-bw*.25);x.lineTo(px0+bw*.2,hpx-bh-bw*.25);x.lineTo(px0+bw*.2,hpx-bh);x.lineTo(px0+bw*.5,hpx-bh);x.lineTo(px0+bw*.5,hpx-bh-bw*.25);x.lineTo(px0+bw*.75,hpx-bh-bw*.25);x.lineTo(px0+bw*.75,hpx-bh);x.lineTo(px0+bw,hpx-bh)}
   else{x.arc(px0+bw/2,hpx-bh,bw/2,Math.PI,0)}
   x.lineTo(px0+bw,hpx);x.closePath();x.fill();x.globalAlpha=.55;x.stroke();x.globalAlpha=1;
   x.fillStyle=P.glow;x.globalAlpha=.5;
   for(let wy=hpx-bh+bw*.5;wy<hpx-bw*.4;wy+=bw*.55)if(rnd()<.55)x.fillRect(px0+bw*.3,wy,bw*.16,bw*.26);
   x.globalAlpha=1;x.fillStyle=P.block[1];
   px0+=bw+wpx*(.008+rnd()*.02);
  }
  skyline.set(k,cv);return cv;
 }catch(_){skyline.set(k,null);return null}
}
function drawFlip(c,run,opts){
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,C=run.course,MI=items();
 const P=root.MongyuTrip?.get?.(run.trip)||{sky:['#07031a','#140a33','#2a1259'],fog:'#5b2bd6',block:['#2b1b5e','#170d3a','#0a0620'],rim:'#7b3cff',rim2:'#ff2e9a',glow:'#b46bff',accent:'#19e3ff',danger:'#ff4d5e',gold:'#ffe27a',aurora:'#4df5e0',ink:'#f3eaff'};
 const cvd=cvdOn(),danger=cvd?'#7f8cff':P.danger,dangerTop=cvd?'#b5bcff':mixc(P.danger,'#ffffff',.45),dangerSide=cvd?'#4b55c4':mixc(P.danger,'#000000',.5);
 const MODE=lum(P.sky[1])>.5?'source-over':'lighter';
 const sc=clamp(Math.min(w/300,h/560),.8,1.7),CH=FLIP.CH*sc,slab=26*sc,cy=h*.5,yF=cy+CH/2,yC=cy-CH/2,px=w*.3;
 const beatT=t*run.bpm/60,beatP=reduced?0:.5+.5*Math.cos((beatT%1)*TAU),X=wx=>px+(wx-run.x)*sc,Y=wy=>yF-wy*sc;
 c.save();
 // sky
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,P.sky[0]);g.addColorStop(.5,P.sky[1]);g.addColorStop(1,P.sky[0]);c.fillStyle=g;c.fillRect(0,0,w,h);
 c.globalCompositeOperation=MODE;
 const hz=c.createRadialGradient(w*.62,cy,0,w*.62,cy,w*.9);hz.addColorStop(0,P.fog+'55');hz.addColorStop(1,P.fog+'00');c.globalAlpha=.55;c.fillStyle=hz;c.fillRect(0,0,w,h);c.restore();c.save();
 // mirrored skylines: upright above the ceiling slab, hanging below the floor slab (the castle stands on its head)
 const layers=[[.1,.55,1,.42],[.22,.8,2,.7]];
 for(const [par,hs,seed,al] of layers){
  const th=Math.round(Math.max(60,yC-slab)*hs),tw=Math.round(w*1.3),tile=skylineTile(P,run.trip,tw,th,seed*977);if(!tile)continue;
  const off=((run.x*par*sc)%tw+tw)%tw;
  c.globalAlpha=al;
  for(let ix=-1;ix<=1;ix++){
   const dx=ix*tw-off;if(dx>w||dx+tw<0)continue;
   c.drawImage(tile,dx,yC-slab-th);
   c.save();c.translate(0,yF+slab);c.scale(1,-1);c.translate(0,-(yF+slab));c.drawImage(tile,dx,yF+slab-th);c.restore();
  }
 }
 c.globalAlpha=1;
 // slabs (floor and ceiling) with neon rim and beat marks
 const slabFill=(y0,y1,rimY)=>{c.fillStyle=P.block[2];c.fillRect(0,Math.min(y0,y1),w,Math.abs(y1-y0));c.fillStyle=P.block[0];c.globalAlpha=.65;c.fillRect(0,Math.min(y0,y1),w,Math.abs(y1-y0)*.35);c.globalAlpha=1;
  c.save();c.globalCompositeOperation=MODE;c.strokeStyle=P.glow;c.globalAlpha=.16+.06*beatP;c.lineWidth=8;c.beginPath();c.moveTo(0,rimY);c.lineTo(w,rimY);c.stroke();c.globalAlpha=.9;c.strokeStyle=P.rim;c.lineWidth=2;c.stroke();c.restore()};
 slabFill(yF,yF+slab,yF);slabFill(yC-slab,yC,yC);
 const step=C.B*sc,first=Math.floor((run.x-px/sc)/C.B)*C.B;
 c.save();c.globalCompositeOperation=MODE;
 for(let wx=first;X(wx)<w+step;wx+=C.B){
  const sx=X(wx),pul=.35+.35*(((wx/C.B)%4===0)?1:.4)*(1-.3*(1-beatP)),s=(3.2+1.2*beatP)*sc;
  c.globalAlpha=pul;c.fillStyle=P.rim2;c.fillRect(sx-s/2,yF+6*sc,s,s);c.fillRect(sx-s/2,yC-6*sc-s,s,s);
 }
 c.restore();
 // faint nested squares behind the corridor (nom3 motif), breathing with the beat
 c.save();c.globalCompositeOperation=MODE;c.lineWidth=1.1;
 for(let i=0;i<4;i++){const k=.22+i*.2,hw=w*.5*k*1.3,hh=CH*.5*k*1.3;c.globalAlpha=(.05+.04*beatP)*(1-i*.15);c.strokeStyle=i%2?P.rim2:P.rim;c.strokeRect(w*.62-hw,cy-hh,hw*2,hh*2)}
 c.restore();
 // crystals
 for(let i=Math.max(0,run.cnext-1);i<C.crystals.length;i++){
  const s=C.crystals[i],x0=s.start*C.B,x1=(s.start+s.len)*C.B;if(X(x0)>w+40)break;if(X(x1)<-40)continue;
  const n=s.n,span=(x1-x0)/n,hh=s.h*sc*(1+.05*(beatP*2-1)*(reduced?0:1)),dir=s.surf===0?-1:1,base=s.surf===0?yF:yC;
  for(let j=0;j<n;j++){
   const cx=X(x0+span*(j+.5)),bw=Math.min(FLIP.CRY_W,span*.9)*sc*.9,top=base+dir*hh*(j%2?.82:1);
   c.save();c.globalCompositeOperation=MODE;c.globalAlpha=s.absorbed?.1:.3;c.fillStyle=danger;c.beginPath();c.moveTo(cx-bw*.75,base);c.lineTo(cx,top+dir*-6);c.lineTo(cx+bw*.75,base);c.closePath();c.fill();c.restore();
   c.fillStyle=dangerSide;c.beginPath();c.moveTo(cx-bw/2,base);c.lineTo(cx,top);c.lineTo(cx+bw/2,base);c.closePath();c.fill();
   c.fillStyle=s.absorbed?'#b8c4d0':danger;c.beginPath();c.moveTo(cx-bw/2,base);c.lineTo(cx,top);c.lineTo(cx-bw*.08,base);c.closePath();c.fill();
   c.fillStyle=dangerTop;c.beginPath();c.moveTo(cx-bw*.2,base+dir*hh*.55);c.lineTo(cx,top);c.lineTo(cx+bw*.1,base+dir*hh*.5);c.closePath();c.fill();
   c.strokeStyle='#f4ffff';c.globalAlpha=.7;c.lineWidth=1;c.beginPath();c.moveTo(cx-bw/2,base);c.lineTo(cx,top);c.lineTo(cx+bw/2,base);c.stroke();c.globalAlpha=1;
  }
 }
 // gate
 {
  const gx=X(C.length);if(gx<w+60){
   const open=run.finishing?run.finishing.age/run.finishing.dur:0,near=clamp((C.length-run.x)/(C.speed*5),0,1),a=(.55+.45*(1-near))*(1-open*.4);
   c.save();c.globalCompositeOperation=MODE;
   const gr=c.createLinearGradient(gx,yC,gx,yF);gr.addColorStop(0,P.aurora+'22');gr.addColorStop(.5,P.aurora+'66');gr.addColorStop(1,P.glow+'88');
   c.globalAlpha=a;c.fillStyle=gr;c.fillRect(gx-16*sc,yC,32*sc,CH);
   c.strokeStyle=P.aurora;c.lineWidth=3;c.globalAlpha=a;c.beginPath();c.moveTo(gx-16*sc,yF);c.lineTo(gx-16*sc,yC);c.moveTo(gx+16*sc,yF);c.lineTo(gx+16*sc,yC);c.stroke();
   c.lineWidth=10;c.globalAlpha=a*.2;c.stroke();c.restore();
   const MA=root.MongyuArt;if(MA?.ready?.('item-gate')){const im=MA.image('item-gate'),gs=CH*.7;c.globalAlpha=.9*(1-open*.4);c.drawImage(im,gx-gs/2,cy-gs/2,gs,gs);c.globalAlpha=1}
  }
 }
 // shards and pickups
 const dia=(x,y,r,rot,fill)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=fill;c.fillRect(-r,-r,r*2,r*2);c.restore()};
 for(const sh of run.shardList){
  if(sh.got)continue;const wx=sh.e.beat*C.B+Math.sqrt(.5)*C.tf*C.speed,sx=X(wx);if(sx<-20||sx>w+20)continue;
  const sy=cy;c.save();c.globalCompositeOperation=MODE;c.globalAlpha=.3;dia(sx,sy,9*sc,Math.PI/4,P.gold);c.restore();
  if(!(MI&&MI.drawLight(c,sx,sy,26*sc,t,sh.e.idx,reduced,0)))dia(sx,sy,4.2*sc,Math.PI/4+(reduced?0:t*1.6),P.gold);
 }
 if(MI&&run.itemList&&run.itemList.length)MI.drawItems(c,run,it=>{const sx=X(it.at);if(sx<-30||sx>w+30)return null;const sf=run.surfAtX(it.at),wy=it.lane==='hi'?FLIP.CH/2:(sf===0?FLIP.BODY*.5:FLIP.CH-FLIP.BODY*.5);return {x:sx,y:Y(wy),s:sc}},t,reduced,0);
 // runner
 const half=FLIP.BODY/2,yc=run.yc(),flying=run.fly!==null;
 let feetY,feetX=px,ang;
 if(!flying){feetY=run.surf===0?yF:yC;ang=run.surf===0?0:Math.PI}
 else{const k=clamp(run.fly/C.tf,0,1),e=k*k;ang=(run.jumpFrom===0?0:Math.PI)+(reduced?0:Math.PI*e)*(run.jumpFrom===0?1:-1);if(reduced)ang=run.jumpFrom===0?0:Math.PI;feetY=Y(yc)+Math.cos(ang)*half*sc;feetX=px-Math.sin(ang)*half*sc}
 if(run.crash&&run.outro){feetY+=(run.crash.surf===0?-1:1)*Math.min(1,run.outro.age*3)*6}
 // trail while falling
 if(flying&&!reduced){c.save();c.globalCompositeOperation=MODE;const k=clamp(run.fly/C.tf,0,1);for(let i=1;i<=3;i++){const kk=Math.max(0,k-i*.09),y2=Y(run.jumpFrom===0?half+(FLIP.CH-FLIP.BODY)*kk*kk:FLIP.CH-half-(FLIP.CH-FLIP.BODY)*kk*kk);c.globalAlpha=.16/i;c.fillStyle=P.rim;c.fillRect(px-7*sc,y2-half*sc,14*sc,FLIP.BODY*sc)}c.restore()}
 const squash=!reduced&&!flying&&run.time-run.landedAt<.14?1-.12*(1-(run.time-run.landedAt)/.14):1;
 const q={x:feetX,y:feetY,bodyHeight:FLIP.BODY*sc*1.12,renderAngle:ang,strideDistance:run.x,nativeState:0,height:flying?1:0,jumpProgress:flying?run.fly/C.tf:0,pose:run.crash?'hurt':flying?'jump':'run'};
 if(root.MongyuMobile?.sprite)root.MongyuMobile.sprite(c,q,{poseTime:t,onDark:true},reduced);
 else{c.save();c.translate(px,feetY);c.rotate(ang);c.fillStyle='#fff3e0';c.fillRect(-5,-FLIP.BODY*sc,10,FLIP.BODY*sc);c.restore()}
 if(run.drawAura&&MI&&run.mods)MI.drawAura(c,run,px,Y(yc),FLIP.BODY*sc*.7,t,reduced);
 if(run.time-run.pickedAt<.4){const a=(run.time-run.pickedAt)/.4;c.save();c.globalCompositeOperation=MODE;c.globalAlpha=(1-a)*.7;c.strokeStyle=P.gold;c.lineWidth=2;c.beginPath();c.arc(px,cy,(10+a*34)*sc,0,TAU);c.stroke();c.restore()}
 c.restore();
 if(!run.hudOff)flipHud(c,run,w,h,P);
 return null;
}
function flipHud(c,run,w,h,P){
 if(run.state==='fail')return;
 const fade=run.outro?1-Math.min(1,run.outro.age/.35):1;if(fade<=0)return;
 c.save();c.globalAlpha=fade;c.textAlign='center';const top=Math.max(14,h*.035);
 c.font='600 11px system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(20,12,36,.6)';c.strokeText('중력 뒤집기',w/2,top+10);c.fillStyle='rgba(255,243,226,.85)';c.fillText('중력 뒤집기',w/2,top+10);
 c.font='800 40px system-ui,sans-serif';c.lineWidth=5;c.strokeStyle='rgba(20,12,36,.55)';const sc=String(Math.floor(run.points));c.strokeText(sc,w/2,top+52);c.fillStyle='#fff3d6';c.fillText(sc,w/2,top+52);
 const coach=run.coach&&run.time<run.coach.until?run.coach.text:'';
 if(coach&&run.state==='play'){c.font='700 16px system-ui,sans-serif';const tw=Math.min(w-48,c.measureText(coach).width+36),y=h*.8;c.fillStyle='rgba(26,19,48,.66)';c.fillRect(w/2-tw/2,y-19,tw,38);c.fillStyle='#fbf4ff';c.fillText(coach,w/2,y+6)}
 const gy=h*.9,gw=Math.min(w*.7,320);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(w/2-gw/2,gy,gw,6);c.fillStyle=P.accent;c.fillRect(w/2-gw/2,gy,Math.max(6,gw*clamp(run.x/run.course.length,0,1)),6);
 c.restore();
}

/* ================================================================== shared side-scroller pieces (mirror, wait) */
const PAL_FALLBACK={sky:['#07031a','#140a33','#2a1259'],fog:'#5b2bd6',block:['#2b1b5e','#170d3a','#0a0620'],rim:'#7b3cff',rim2:'#ff2e9a',glow:'#b46bff',accent:'#19e3ff',danger:'#ff4d5e',gold:'#ffe27a',aurora:'#4df5e0',ink:'#f3eaff'};
const palOf=key=>root.MongyuTrip?.get?.(key||'violet')||PAL_FALLBACK;
function dangerInk(P){const cvd=cvdOn();return {d:cvd?'#7f8cff':P.danger,top:cvd?'#b5bcff':mixc(P.danger,'#ffffff',.45),side:cvd?'#4b55c4':mixc(P.danger,'#000000',.5)}}
/* A block of the hazard colour with a bright top and rim; dir -1 stands on base (up), +1 hangs from base (down). */
function hazardBlock(c,cx,base,w,h,dir,k,P,absorbed,pulse){
 const hh=h*pulse,x0=cx-w/2,top=base+dir*hh;
 c.fillStyle=k.side;c.fillRect(x0+3,Math.min(base,top)-(dir<0?3:0),w,hh+3);
 c.fillStyle=absorbed?'#b8c4d0':k.d;c.fillRect(x0,Math.min(base,top),w,hh);
 c.fillStyle=k.top;c.fillRect(x0,dir<0?top:top-3.2,w,3.2);
 c.strokeStyle='#f4ffff';c.globalAlpha=.55;c.lineWidth=1;c.strokeRect(x0+.5,Math.min(base,top)+.5,w-1,hh-1);c.globalAlpha=1;
}
/* Aurora gate across a corridor (flip, mirror, wait). */
function corridorGate(c,gx,yTop,yBot,P,open,near,mode,sc){
 const a=(.55+.45*(1-near))*(1-open*.4);c.save();c.globalCompositeOperation=mode;
 const gr=c.createLinearGradient(gx,yTop,gx,yBot);gr.addColorStop(0,P.aurora+'22');gr.addColorStop(.5,P.aurora+'66');gr.addColorStop(1,P.glow+'88');
 c.globalAlpha=a;c.fillStyle=gr;c.fillRect(gx-16*sc,yTop,32*sc,yBot-yTop);
 c.strokeStyle=P.aurora;c.lineWidth=3;c.beginPath();c.moveTo(gx-16*sc,yBot);c.lineTo(gx-16*sc,yTop);c.moveTo(gx+16*sc,yBot);c.lineTo(gx+16*sc,yTop);c.stroke();
 c.lineWidth=10;c.globalAlpha=a*.2;c.stroke();c.restore();
 const MA=root.MongyuArt;if(MA?.ready?.('item-gate')){const im=MA.image('item-gate'),gs=(yBot-yTop)*.7;c.globalAlpha=.9*(1-open*.4);c.drawImage(im,gx-gs/2,(yTop+yBot)/2-gs/2,gs,gs);c.globalAlpha=1}
}
function sideHud(c,run,w,h,P,label){
 if(run.state==='fail')return;
 const fade=run.outro?1-Math.min(1,run.outro.age/.35):1;if(fade<=0)return;
 c.save();c.globalAlpha=fade;c.textAlign='center';const top=Math.max(14,h*.035);
 c.font='600 11px system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(20,12,36,.6)';c.strokeText(label,w/2,top+10);c.fillStyle='rgba(255,243,226,.9)';c.fillText(label,w/2,top+10);
 c.font='800 40px system-ui,sans-serif';c.lineWidth=5;c.strokeStyle='rgba(20,12,36,.55)';const sc=String(Math.floor(run.points));c.strokeText(sc,w/2,top+52);c.fillStyle='#fff3d6';c.fillText(sc,w/2,top+52);
 const coach=run.coach&&run.time<run.coach.until?run.coach.text:'';
 if(coach&&run.state==='play'){c.font='700 16px system-ui,sans-serif';const tw=Math.min(w-48,c.measureText(coach).width+36),y=h*.8;c.fillStyle='rgba(26,19,48,.7)';c.fillRect(w/2-tw/2,y-19,tw,38);c.fillStyle='#fbf4ff';c.fillText(coach,w/2,y+6)}
 const gy=h*.9,gw=Math.min(w*.7,320);c.fillStyle='rgba(20,12,36,.35)';c.fillRect(w/2-gw/2,gy,gw,6);c.fillStyle=P.accent;c.fillRect(w/2-gw/2,gy,Math.max(6,gw*clamp(run.progressNow,0,1)),6);
 c.restore();
}
const SIDE_PEAK=44,SIDE_FL=.62,SIDE_W=11;
/* Common core of the corridor acts that share the runner, jump, items and events (mirror, wait). */
function sideBase(){
 return class SideRun{
  constructor(options={}){
   this.options=options;this.mode='dream';this.openingCourse=false;this.polish=true;this.hudOff=options.hud===false;
   this.chain=options.chain||null;this.settings={...(options.settings||{})};this.attempt=options.attempt||1;this.trip=options.trip||'violet';
   this.bpm=Number(this.chain?.bpm??options.bpm)||100;this.seed=(this.chain?.seed??options.seed??1)>>>0;
   this.setViewport(options.viewport?.width,options.viewport?.height);
  }
  setViewport(width=390,height=844){this.viewport={width,height}}
  baseReset(){
   const carry=this.chain?.carry||{};
   this.state='ready';this.time=0;this.clock=0;this.gt=0;this.updates=0;this.inputCount=0;this.events=[];this.hearts=1;this.x=0;this.distance=0;this.fly=null;this.fl=SIDE_FL;this.pkH=SIDE_PEAK;this.height=0;this.buffer=0;
   this.crash=null;this.hitStop=0;this.outro=null;this.finishing=null;this.result=null;this.points=num(carry.points);this._own=0;this.score=this.points;this.perfectStreak=num(carry.perfectStreak);this.bestStreak=0;this.perfects=0;
   this.shards=0;this.jumps=0;this.next=0;this.perfectPoints=0;this.landedAt=-10;this.pickedAt=-10;this.pose=undefined;this.pk=1;
  }
  initItems(start,len,beat){const MI=items();if(MI&&(this.chain||this.options.items))MI.setup(this,{items:this.options.items,start,len,beat});else{this.mods=null;this.itemList=null}}
  get progressNow(){return clamp(this.x/this.length,0,1)}
  get speed(){return this.B*this.bpm/60}
  start(){if(this.state!=='ready')return false;this.state='play';this.events.push('start');return true}
  pause(){if(this.state!=='play')return false;this.state='pause';this.cancelInput();this.events.push('pause');return true}
  resume(){if(this.state!=='pause')return false;this.state='play';return true}
  retry(){this.attempt++;this.reset();this.state='play';this.events.push('start');return true}
  inputDown(){return this.action()}
  inputUp(){}
  cancelInput(){this.buffer=0}
  drainEvents(){return this.events.splice(0)}
  setCoach(kind,hold,text){this.coach={kind,text,until:this.time+hold}}
  pace(dt){const MI=items();return MI&&this.mods?MI.applyPace(this,dt):dt}
  jumpNow(){const MI=items();this.fl=MI?MI.applyJump(this,SIDE_FL):SIDE_FL;this.pkH=SIDE_PEAK*(this.pk||1);this.fly=0;this.buffer=0;this.jumps++;this.events.push('jump')}
  flightStep(sdt){
   if(this.fly===null)return;
   this.fly+=sdt;const ph=Math.min(1,this.fly/this.fl);this.height=4*this.pkH*ph*(1-ph);
   if(ph===1){this.fly=null;this.height=0;this.events.push('land');this.landedAt=this.time;if(this.buffer>0)this.action()}
  }
  scoreStep(){
   const own=Math.floor(this.x/12)+this.jumps*10+this.perfectPoints+this.shards*25;this.points+=own-this._own;this._own=own;this.score=this.points;
   const MI=items();if(MI&&this.mods){MI.collect(this,this.x,this.height,this.pkH,13);MI.settle(this)}
  }
  reachGate(){this.events.push('portal');const ch=this.chain;if(ch&&ch.last===false)this.complete();else this.finishing={age:0,dur:1.0}}
  complete(){this.finishing=null;this.finish('clear')}
  finish(state,reason){
   this.state=state;this.outro=null;this.finishing=null;
   this.result={mode:this.dreamMode,state,points:Math.floor(this.points),score:Math.floor(this.points),shards:this.shards,shardTotal:this.shardTotal,perfectStreak:this.perfectStreak,perfects:this.perfects,bestStreak:this.bestStreak,
    time:this.time,attempt:this.attempt,seed:this.seed,reason:state==='clear'?'오로라의 문을 지났어요.':(reason||this.failReason||'부딪혔어요')};
   this.events.push(state);
  }
  crashNow(reason,text,info){
   this.hearts=0;this.perfectStreak=0;this.crash=info||{kind:'hit',at:this.x};this.failReason=reason;this.events.push('hit');
   this.hitStop=reducedMotion()?0:.12;this.outro={kind:'fail',age:0,duration:.8};this.setCoach('crash',2,text);
  }
  /* shared head of tick(): input stops, outro, finishing; returns false when the caller should not simulate this frame */
  gate(dt){
   if(this.state!=='play')return false;
   this.updates++;this.clock+=dt;
   if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);return false}
   if(this.outro){this.outro.age+=dt;if(this.outro.age>=this.outro.duration)this.finish('fail');return false}
   if(this.finishing){const f=this.finishing;f.age+=dt;this.time+=dt;this.x+=this.speed*dt*Math.max(0,1-f.age/f.dur)*.9;this.distance=this.x;if(f.age>=f.dur)this.complete();return false}
   return true;
  }
  drawSelf(c,opts){return this.draw(c,opts)}
 };
}

/* ================================================================== mirror */
const MIRROR={B:100,LEVELS:[
 {gap:[3,4],w:{both:.5,me:.3,twin:.2}},
 {gap:[3,3,4],w:{both:.35,me:.25,twin:.4}},
 {gap:[2,3,3],w:{both:.3,me:.2,twin:.5}},
 {gap:[2,2,3],w:{both:.25,me:.15,twin:.6}}
]};
/* Pure seeded layout. The twin runs right under you but jumps one beat after every tap. A tap at beat m-lead clears the player's hazard at beat m (kind 'me'/'both') and, one beat later, the twin's hazard at beat m+1 (kind 'twin'/'both').
   Every hazard is on the beat grid; taps are always 2+ beats apart so a jump never overlaps the next one (the twin repeats the same spacing). */
function buildMirror(o={}){
 const E=root.MongyuEndless,rng=E?.rng,bpm=Number(o.bpm)||100,seed=(o.seed??1)>>>0,beats=Math.max(18,Number(o.beats)||36),lv=MIRROR.LEVELS[clamp(o.level|0,0,3)],r=rng(seed^0x3C6EF3);
 const B=MIRROR.B,speed=B*bpm/60,lead=SIDE_FL*bpm/120,events=[];let m=o.tutorial?8:7,k=0,twins=0;
 const pick=()=>{const q=r();let a=0;for(const key of ['both','me','twin']){a+=lv.w[key];if(q<a)return key}return 'both'};
 while(m<beats-5){
  let kind=k===0?'both':(o.tutorial&&k===1?'twin':pick());if(kind==='twin')twins++;
  events.push({m,kind,idx:k,tapBeat:m-lead,h:r()<.45?22:14,shard:k%2===0||kind==='twin',done:false});
  m+=lv.gap[Math.floor(r()*lv.gap.length)];k++;
 }
 if(!twins&&events.length>1)events[events.length-1].kind='twin';
 const end=m+3,own=[],twin=[];
 for(const e of events){if(e.kind!=='twin')own.push({at:e.m*B,h:e.h,ev:e.idx,absorbed:false});if(e.kind!=='me')twin.push({at:(e.m+1)*B,h:e.h,ev:e.idx,absorbed:false})}
 return {bpm,B,speed,lead,delay:60/bpm,beats:end,length:end*B,events,own,twin,shardTotal:events.filter(e=>e.shard).length};
}
function makeMirrorRun(){
 const Base=sideBase();
 class MirrorRun extends Base{
  constructor(options={}){
   super(options);this.dreamMode='mirror';this.B=MIRROR.B;
   this.course=buildMirror({bpm:this.bpm,seed:this.seed,beats:options.beats,level:options.level,tutorial:options.tutorial===true});this.length=this.course.length;this.shardTotal=this.course.shardTotal;
   this.reset();
  }
  reset(){
   const C=this.course;this.baseReset();this.q=[];this.tfly=null;this.tfl=SIDE_FL;this.tpk=1;this.theight=0;this.tlandedAt=-10;this.pi=0;this.ti=0;this.tx=0;
   for(const e of C.events)e.done=false;for(const o of C.own)o.absorbed=false;for(const o of C.twin)o.absorbed=false;
   this.shardList=C.events.filter(e=>e.shard).map(e=>({e,got:false}));
   const ch=this.chain,teach=!ch||ch.first!==false||this.options.tutorial===true;
   this.coach=teach&&this.options.coachText!==false?{kind:'start',text:this.options.coachText||'거울 속 내가 한 박자 늦게 뛰어',until:3.4}:null;
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
   this.jumpNow();this.q.push({at:this.gt+C.delay,fl:this.fl,pk:this.pk||1});
   return true;
  }
  tick(dt){
   if(!this.gate(dt))return;
   const C=this.course,sdt=this.pace(dt),W=SIDE_W+4;
   this.time+=dt;this.gt+=sdt;this.x+=C.speed*sdt;this.distance=this.x;this.tx=this.x;this.buffer=Math.max(0,this.buffer-dt);
   this.flightStep(sdt);
   // the twin repeats every tap one beat late
   if(this.q.length&&this.gt>=this.q[0].at){const t=this.q.shift();this.tfly=0;this.tfl=t.fl;this.tpk=SIDE_PEAK*t.pk}
   if(this.tfly!==null){this.tfly+=sdt;const ph=Math.min(1,this.tfly/this.tfl);this.theight=4*this.tpk*ph*(1-ph);if(ph===1){this.tfly=null;this.theight=0;this.tlandedAt=this.time}}
   const MI=items();
   for(;this.pi<C.own.length&&this.x>C.own[this.pi].at+W+14;)this.pi++;
   for(let i=this.pi;i<C.own.length;i++){const o=C.own[i];if(o.at-W>this.x)break;
    if(!o.absorbed&&Math.abs(this.x-o.at)<=W&&this.height<o.h){if(MI&&this.mods&&MI.applyHit(this))o.absorbed=true;else{this.crashNow('블록에 부딪혔어요','한 박자 늦었어',{kind:'me',at:this.x});return}}}
   for(;this.ti<C.twin.length&&this.tx>C.twin[this.ti].at+W+14;)this.ti++;
   for(let i=this.ti;i<C.twin.length;i++){const o=C.twin[i];if(o.at-W>this.tx)break;
    if(!o.absorbed&&Math.abs(this.tx-o.at)<=W&&this.theight<o.h){if(MI&&this.mods&&MI.applyHit(this))o.absorbed=true;else{this.crashNow('거울 속 내가 부딪혔어요','거울 속 내가 먼저 부딪혔어',{kind:'twin',at:this.x});return}}}
   for(const sh of this.shardList){if(sh.got)continue;const sx=sh.e.m*C.B;if(this.x>sx+16)continue;if(Math.abs(this.x-sx)<12&&this.height>=this.pkH-16){sh.got=true;this.shards++;this.pickedAt=this.time;this.events.push('collect')}}
   this.scoreStep();
   if(this.x>=this.length&&!this.crash)this.reachGate();
  }
  status(){return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:Math.floor(this.points),best:0,progress:this.progressNow,roomTitle:'거울',roomIndex:0,roomCount:1,instruction:'탭: 점프 · 거울 속 나는 한 박자 늦게',cue:null,result:this.result}}
  /* Autopilot for the headless checks: taps at the ideal beat of the next event (mode 'ignore' = a little late). */
  pilot(cr,mode){
   const C=this.course,e=C.events[this.next];if(!e||this.fly!==null||this.outro||this.finishing||this.hitStop>0)return;
   if(this.x>=(e.tapBeat+(mode==='ignore'?.08:0))*C.B-.5)cr.action();
  }
  draw(c,opts){return drawMirror(c,this,opts)}
  drawAura(){}
 }
 return MirrorRun;
}
function drawMirror(c,run,opts){
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,C=run.course,MI=items(),P=palOf(run.trip),k=dangerInk(P),MODE=lum(P.sky[1])>.5?'source-over':'lighter';
 const sc=clamp(Math.min(w/300,h/560),.8,1.7),yM=h*.5,bd=8*sc,y0=yM-bd,y1=yM+bd,px=w*.44,B=C.B*sc,X=wx=>px+(wx-run.x)*sc,beatP=reduced?0:.5+.5*Math.cos(((t*run.bpm/60)%1)*TAU);
 c.save();
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,P.sky[0]);g.addColorStop(.5,P.sky[1]);g.addColorStop(1,P.sky[2]);c.fillStyle=g;c.fillRect(0,0,w,h);
 // skyline: upright on the mirror line above, reflected (hanging, dimmer) below
 const th=Math.round(yM*.62),tw=Math.round(w*1.3),tile=skylineTile(P,run.trip,tw,th,1307);
 if(tile){const off=((run.x*.14*sc)%tw+tw)%tw;for(let ix=-1;ix<=1;ix++){const dx=ix*tw-off;if(dx>w||dx+tw<0)continue;
  c.globalAlpha=.5;c.drawImage(tile,dx,y0-th);c.globalAlpha=.28;c.save();c.translate(0,y1);c.scale(1,-1);c.drawImage(tile,dx,-th);c.restore()}c.globalAlpha=1}
 // the reflection half is veiled so the two lanes read as "me" and "mirror me"
 c.fillStyle=P.block[2];c.globalAlpha=.32;c.fillRect(0,yM,w,h-yM);c.globalAlpha=1;
 // mirror band
 const band=c.createLinearGradient(0,y0,0,y1);band.addColorStop(0,P.block[0]);band.addColorStop(.5,P.accent+'aa');band.addColorStop(1,P.block[0]);c.fillStyle=band;c.fillRect(0,y0,w,y1-y0);
 c.save();c.globalCompositeOperation=MODE;c.strokeStyle=P.rim;c.globalAlpha=.9;c.lineWidth=1.6;c.beginPath();c.moveTo(0,y0);c.lineTo(w,y0);c.moveTo(0,y1);c.lineTo(w,y1);c.stroke();
 c.globalAlpha=.16+.06*beatP;c.lineWidth=7;c.beginPath();c.moveTo(0,y0);c.lineTo(w,y0);c.moveTo(0,y1);c.lineTo(w,y1);c.stroke();c.restore();
 // beat ticks on the band
 c.save();c.globalCompositeOperation=MODE;c.fillStyle=P.rim2;const first=Math.floor((run.x-px/sc)/C.B)*C.B;
 for(let wx=first;X(wx)<w+B;wx+=C.B){const s=(2.6+1.2*beatP)*sc;c.globalAlpha=((wx/C.B)%4===0?.75:.4);c.fillRect(X(wx)-s/2,yM-s/2,s,s)}c.restore();
 const ph=1+.05*(beatP*2-1);
 // hazards: the player's stand on the line, the twin's hang below it
 for(const o of C.own){const sx=X(o.at);if(sx<-30)continue;if(sx>w+30)break;hazardBlock(c,sx,y0,SIDE_W*2*sc,o.h*sc,-1,k,P,o.absorbed,reduced?1:ph)}
 for(const o of C.twin){const sx=X(o.at);if(sx<-30)continue;if(sx>w+30)break;hazardBlock(c,sx,y1,SIDE_W*2*sc,o.h*sc,1,k,P,o.absorbed,reduced?1:ph)}
 // gate
 {const gx=X(C.length);if(gx<w+60)corridorGate(c,gx,y0-h*.38,y1+h*.38,P,run.finishing?run.finishing.age/run.finishing.dur:0,clamp((C.length-run.x)/(C.speed*5),0,1),MODE,sc)}
 // shards on the apex of every tap
 const dia=(x,y,r,rot,fill)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=fill;c.fillRect(-r,-r,r*2,r*2);c.restore()};
 for(const sh of run.shardList){if(sh.got)continue;const sx=X(sh.e.m*C.B);if(sx<-20||sx>w+20)continue;const sy=y0-(SIDE_PEAK+8)*sc;
  c.save();c.globalCompositeOperation=MODE;c.globalAlpha=.3;dia(sx,sy,9*sc,Math.PI/4,P.gold);c.restore();
  if(!(MI&&MI.drawLight(c,sx,sy,26*sc,t,sh.e.idx,reduced,0)))dia(sx,sy,4.2*sc,Math.PI/4+(reduced?0:t*1.6),P.gold)}
 if(MI&&run.itemList&&run.itemList.length)MI.drawItems(c,run,it=>{const sx=X(it.at);if(sx<-30||sx>w+30)return null;return {x:sx,y:y0-(it.lane==='hi'?SIDE_PEAK*.62+10:15)*sc,s:sc}},t,reduced,0);
 // the twin: right under you, upside down under the line, ghosted; it jumps one beat after you
 const txs=px,tfp=run.tfly===null?0:run.tfly/run.tfl,cr=run.crash;
 c.save();c.globalCompositeOperation=MODE;c.globalAlpha=.22+.08*beatP;c.fillStyle=P.accent;c.beginPath();c.arc(txs,y1+34*sc,26*sc,0,TAU);c.fill();c.restore();
 c.save();c.globalAlpha=.82;
 if(root.MongyuMobile?.sprite)root.MongyuMobile.sprite(c,{x:txs,y:y1+run.theight*sc,bodyHeight:SIDE_PEAK*sc*1.05,renderAngle:Math.PI,strideDistance:run.tx,nativeState:0,height:run.theight>.05?1:0,jumpProgress:tfp,pose:cr&&cr.kind==='twin'?'hurt':run.tfly!==null?'jump':'run'},{poseTime:t,onDark:true},reduced);
 else{c.fillStyle='#fff3e0';c.fillRect(txs-5,y1+run.theight*sc,10,SIDE_PEAK*sc)}
 c.restore();
 // the player
 const squash=!reduced&&run.fly===null&&run.time-run.landedAt<.14;void squash;
 if(root.MongyuMobile?.sprite)root.MongyuMobile.sprite(c,{x:px,y:y0-run.height*sc,bodyHeight:SIDE_PEAK*sc*1.12,renderAngle:0,strideDistance:run.x,nativeState:0,height:run.height,jumpProgress:run.fly===null?0:run.fly/run.fl,pose:cr&&cr.kind==='me'?'hurt':run.fly!==null?'jump':'run'},{poseTime:t,onDark:true},reduced);
 else{c.fillStyle='#fff3e0';c.fillRect(px-5,y0-run.height*sc-SIDE_PEAK*sc,10,SIDE_PEAK*sc)}
 if(MI&&run.mods)MI.drawAura(c,run,px,y0-(run.height+22)*sc,SIDE_PEAK*sc*.7,t,reduced);
 if(run.time-run.pickedAt<.4){const a=(run.time-run.pickedAt)/.4;c.save();c.globalCompositeOperation=MODE;c.globalAlpha=(1-a)*.7;c.strokeStyle=P.gold;c.lineWidth=2;c.beginPath();c.arc(px,y0-30*sc,(10+a*34)*sc,0,TAU);c.stroke();c.restore()}
 c.restore();
 if(!run.hudOff)sideHud(c,run,w,h,P,'거울');
 return null;
}

/* ================================================================== wait */
const WAIT={B:100,DEC:150,STOP:30,RAMP:.7,OPEN:.9,LEVELS:[
 {hold:[3,3,4],gap:[3,4],jumps:[1,2]},
 {hold:[3,4,4],gap:[3,4],jumps:[1,2]},
 {hold:[4,4,5],gap:[3,3],jumps:[2,2]}
]};
/* Pure seeded layout: hazards to jump and elevator doors to wait at. Between segments there are always 4+ beats so a jump is over before the car slows down. */
function buildWait(o={}){
 const E=root.MongyuEndless,rng=E?.rng,bpm=Number(o.bpm)||76,seed=(o.seed??1)>>>0,waits=Math.max(1,o.waits|0||2),lv=WAIT.LEVELS[clamp(o.level|0,0,2)],r=rng(seed^0x9E3779B1);
 const B=WAIT.B,speed=B*bpm/60,lead=SIDE_FL*bpm/120,hazards=[],doors=[];let m=o.tutorial?6:5,k=0,idx=0;
 const jumpRun=n=>{for(let i=0;i<n;i++){hazards.push({at:m*B,h:r()<.4?22:14,idx:idx++,tapBeat:m-lead,shard:idx%2===1,done:false,absorbed:false});m+=lv.gap[Math.floor(r()*lv.gap.length)]}};
 jumpRun(o.tutorial?1:lv.jumps[Math.floor(r()*lv.jumps.length)]);
 for(let w=0;w<waits;w++){
  m+=1;const hold=lv.hold[Math.floor(r()*lv.hold.length)];doors.push({at:m*B,hold,idx:w,done:false,beat:m});m+=2;
  jumpRun(lv.jumps[Math.floor(r()*lv.jumps.length)]);
 }
 const end=m+2,holdTotal=doors.reduce((s,d)=>s+d.hold,0);
 return {bpm,B,speed,lead,beats:end,length:end*B,hazards,doors,shardTotal:hazards.filter(h=>h.shard).length,holdSeconds:holdTotal*60/bpm};
}
function makeWaitRun(){
 const Base=sideBase();
 class WaitRun extends Base{
  constructor(options={}){
   super(options);this.dreamMode='wait';this.B=WAIT.B;
   this.course=buildWait({bpm:this.bpm,seed:this.seed,waits:options.waits,level:options.level,tutorial:options.tutorial===true});this.length=this.course.length;this.shardTotal=this.course.shardTotal;
   this.reset();
  }
  reset(){
   const C=this.course;this.baseReset();this.hi=0;this.di=0;this.zone=null;this.v=C.speed;
   for(const h of C.hazards){h.done=false;h.absorbed=false}for(const d of C.doors)d.done=false;
   this.shardList=C.hazards.filter(h=>h.shard).map(h=>({h,got:false}));this.waited=0;this.lamp=0;
   const ch=this.chain,teach=!ch||ch.first!==false||this.options.tutorial===true;
   this.coach=teach&&this.options.coachText!==false?{kind:'start',text:this.options.coachText||'탭하면 점프. 엘리베이터 앞에선 가만히',until:3.6}:null;
   this.initItems(5*C.B,Math.max(1,C.length-5*C.B-3*C.B),C.B);
  }
  inZone(){return !!this.zone&&(this.zone.phase==='brake'||this.zone.phase==='hold')}
  action(){
   if(this.state!=='play'||this.outro||this.finishing||this.hitStop>0)return false;
   this.inputCount++;
   if(this.inZone()){this.crashNow('엘리베이터 버튼을 눌렀어요','눌렀더니 층이 도망갔어',{kind:'button',at:this.x});this.events.push('wait-fail');return true}
   if(this.fly!==null){if(this.fly>=this.fl-.14)this.buffer=.14;return false}
   const C=this.course,e=C.hazards[this.next];
   if(e&&!e.done&&Math.abs(this.x/C.B-e.tapBeat)<=1.2){
    e.done=true;this.next++;const err=Math.abs(this.x/C.B-e.tapBeat);
    if(err<=.17){this.perfects++;this.perfectStreak++;this.bestStreak=Math.max(this.bestStreak,this.perfectStreak);this.perfectPoints+=20*Math.min(5,this.perfectStreak);this.events.push('perfect');this.setCoach('perfect',.6,'완벽!')}
    else{this.perfectStreak=0;this.events.push('pass')}
   }else this.perfectStreak=0;
   this.jumpNow();return true;
  }
  /* speed factor of the car: full, braking to a stop in front of a door, held, then easing back up */
  stepZone(sdt){
   const C=this.course,d=C.doors[this.di],z=this.zone;
   if(!z){if(d&&this.x>=d.at-WAIT.DEC-WAIT.STOP){this.zone={d,phase:'brake',t:0};this.setCoach('wait',2.2,'누르지 말고 기다려')}return 1}
   const stop=d.at-WAIT.STOP;
   if(z.phase==='brake'){const u=clamp((stop-this.x)/WAIT.DEC,0,1);if(this.x>=stop-1.5){z.phase='hold';z.t=0;this.lamp=d.hold;this.events.push('wait')}return .1+.9*u}
   if(z.phase==='hold'){z.t+=sdt;const beatT=60/C.bpm,left=Math.max(0,d.hold-Math.floor(z.t/beatT));if(left!==this.lamp){this.lamp=left;if(left>0)this.events.push('pass')}
    if(z.t>=d.hold*beatT){z.phase='open';z.t=0;this.events.push('corner');this.waited++}return 0}
   if(z.phase==='open'){z.t+=sdt;if(z.t>=WAIT.OPEN){z.phase='go';z.t=0}return 0}
   z.t+=sdt;const f=clamp(z.t/WAIT.RAMP,.08,1);if(this.x>d.at+30){d.done=true;this.di++;this.zone=null}return f;
  }
  tick(dt){
   if(!this.gate(dt))return;
   const C=this.course,sdt=this.pace(dt),W=SIDE_W+4,f=this.stepZone(sdt);
   this.time+=dt;this.gt+=sdt;this.v=C.speed*f;this.x+=this.v*sdt;this.distance=this.x;this.buffer=Math.max(0,this.buffer-dt);
   this.flightStep(sdt);
   const MI=items();
   for(;this.hi<C.hazards.length&&this.x>C.hazards[this.hi].at+W+14;)this.hi++;
   for(let i=this.hi;i<C.hazards.length;i++){const o=C.hazards[i];if(o.at-W>this.x)break;
    if(!o.absorbed&&Math.abs(this.x-o.at)<=W&&this.height<o.h){if(MI&&this.mods&&MI.applyHit(this))o.absorbed=true;else{this.crashNow('트렁크에 부딪혔어요','한 박자 늦었어',{kind:'hit',at:this.x});return}}}
   for(const sh of this.shardList){if(sh.got)continue;const sx=sh.h.at;if(this.x>sx+16)continue;if(Math.abs(this.x-sx)<12&&this.height>=this.pkH-16){sh.got=true;this.shards++;this.pickedAt=this.time;this.events.push('collect')}}
   this.scoreStep();
   if(this.x>=this.length&&!this.crash)this.reachGate();
  }
  status(){return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:Math.floor(this.points),best:0,progress:this.progressNow,roomTitle:'엘리베이터',roomIndex:0,roomCount:1,instruction:'엘리베이터 앞에서는 누르지 않기',cue:null,result:this.result}}
  /* Autopilot: jumps the hazards on the beat, never touches the screen while waiting (mode 'ignore' = a little late). */
  pilot(cr,mode){
   const C=this.course,e=C.hazards[this.next];if(!e||this.fly!==null||this.outro||this.finishing||this.hitStop>0||this.inZone())return;
   if(this.x>=(e.tapBeat+(mode==='ignore'?.08:0))*C.B-.5)cr.action();
  }
  draw(c,opts){return drawWait(c,this,opts)}
  drawAura(){}
 }
 return WaitRun;
}
function drawWait(c,run,opts){
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,C=run.course,MI=items(),P=palOf(run.trip),k=dangerInk(P),MODE=lum(P.sky[1])>.5?'source-over':'lighter';
 const sc=clamp(Math.min(w/300,h/560),.8,1.7),yF=h*.62,yC=h*.3,px=w*.3,X=wx=>px+(wx-run.x)*sc,beatP=reduced?0:.5+.5*Math.cos(((t*run.bpm/60)%1)*TAU);
 c.save();
 // wall, ceiling band with lamps, carpet band
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,P.sky[0]);g.addColorStop(.5,P.sky[1]);g.addColorStop(1,P.sky[2]);c.fillStyle=g;c.fillRect(0,0,w,h);
 const bare=run.options.bare===true;   // R105 chapter 9: no hotel, only a void, a few stars and one line to follow
 if(bare){c.fillStyle=P.glow;for(let i=0;i<34;i++){const sx=(((i*97+13)%100)/100*w*1.4-run.x*.03*sc%(w*1.4)+w*1.4)%(w*1.4)-w*.2,sy=((i*53+7)%100)/100*yC*1.1;c.globalAlpha=.12+.22*((i*31)%7)/7;c.fillRect(sx,sy,i%5===0?2.4:1.4,i%5===0?2.4:1.4)}c.globalAlpha=1}
 if(!bare){
 c.fillStyle=P.block[1];c.globalAlpha=.55;c.fillRect(0,yC,w,yF-yC);c.globalAlpha=1;
 // repeating door frames receding (same door, again and again): parallax 0.5, every 150 units
 const par=.5,period=150*sc;let off=((run.x*par*sc)%period+period)%period;
 for(let x=-off;x<w+period;x+=period){
  const dw=34*sc,dh=(yF-yC)*.62;c.fillStyle=P.block[0];c.globalAlpha=.8;c.fillRect(x,yF-dh,dw,dh);c.globalAlpha=1;
  c.strokeStyle=P.rim;c.globalAlpha=.5;c.lineWidth=1.2;c.strokeRect(x+.5,yF-dh+.5,dw-1,dh-1);c.globalAlpha=1;
  c.fillStyle=P.gold;c.globalAlpha=.8;c.fillRect(x+dw*.74,yF-dh*.5,3*sc,3*sc);c.globalAlpha=1;
 }
 // ceiling lamps
 c.save();c.globalCompositeOperation=MODE;for(let x=-((run.x*.9*sc)%(110*sc));x<w+110*sc;x+=110*sc){c.globalAlpha=.55;c.fillStyle=P.gold;c.fillRect(x,yC-3*sc,34*sc,4*sc);c.globalAlpha=.12;c.fillRect(x-6*sc,yC-3*sc,46*sc,40*sc)}c.restore();
 c.fillStyle=P.block[2];c.fillRect(0,yC-12*sc,w,10*sc);
 }
 // carpet with a pattern that repeats exactly (the hotel never ends)
 if(!bare){
 c.fillStyle=P.block[2];c.fillRect(0,yF,w,h-yF);c.fillStyle=P.block[0];c.globalAlpha=.7;c.fillRect(0,yF,w,10*sc);c.globalAlpha=1;
 c.fillStyle=P.rim2;c.globalAlpha=.35;{const per=40*sc,o2=((run.x*sc)%per+per)%per;for(let x=-o2;x<w+per;x+=per){c.fillRect(x,yF+22*sc,18*sc,4*sc);c.fillRect(x+20*sc,yF+40*sc,18*sc,4*sc)}}c.globalAlpha=1;
 }
 c.save();c.globalCompositeOperation=MODE;c.strokeStyle=bare?P.glow:P.rim;c.globalAlpha=bare?1:.9;c.lineWidth=bare?2.6:1.8;c.beginPath();c.moveTo(0,yF);c.lineTo(w,yF);c.stroke();c.globalAlpha=.15+.06*beatP;c.lineWidth=bare?11:7;c.stroke();c.restore();
 // elevator doors: two sliding panels, a lamp that counts down the beats
 for(const d of C.doors){
  const sx=X(d.at);if(sx<-90||sx>w+90)continue;
  const z=run.zone&&run.zone.d===d?run.zone:null,openAmt=d.done?1:z&&z.phase==='open'?clamp(z.t/WAIT.OPEN,0,1):z&&z.phase==='go'?1:0,dw=48*sc,dh=(yF-yC)*.82,top=yF-dh;
  c.fillStyle=P.block[0];c.fillRect(sx-dw-6*sc,top-10*sc,dw*2+12*sc,dh+10*sc);
  c.fillStyle=openAmt>0?P.aurora:P.block[1];c.globalAlpha=openAmt>0?.55:1;c.fillRect(sx-dw,top,dw*2,dh);c.globalAlpha=1;
  const pw=dw*(1-openAmt);c.fillStyle=P.block[2];c.fillRect(sx-dw,top,pw,dh);c.fillRect(sx+dw-pw,top,pw,dh);
  c.strokeStyle='rgba(255,255,255,.2)';c.lineWidth=1;c.strokeRect(sx-dw+.5,top+.5,dw*2-1,dh-1);
  c.strokeStyle=P.rim;c.globalAlpha=.8;c.lineWidth=1.8;c.strokeRect(sx-dw-6*sc+.5,top-10*sc+.5,dw*2+12*sc-1,dh+10*sc-1);c.globalAlpha=1;
  // lamp
  const lampOn=z&&z.phase==='hold',n=lampOn?run.lamp:d.done||z&&(z.phase==='open'||z.phase==='go')?0:d.hold;
  c.fillStyle='#10101a';c.fillRect(sx-16*sc,top-34*sc,32*sc,20*sc);c.font='800 '+Math.round(15*sc)+'px system-ui,sans-serif';c.textAlign='center';c.fillStyle=n>0?P.gold:P.aurora;c.fillText(n>0?String(n):'▼',sx,top-19*sc);
 }
 // hazards (luggage carts) and the gate
 for(const o of C.hazards){const sx=X(o.at);if(sx<-30)continue;if(sx>w+30)break;hazardBlock(c,sx,yF,SIDE_W*2*sc,o.h*sc,-1,k,P,o.absorbed,reduced?1:1+.05*(beatP*2-1))}
 {const gx=X(C.length);if(gx<w+60)corridorGate(c,gx,yC-8*sc,yF,P,run.finishing?run.finishing.age/run.finishing.dur:0,clamp((C.length-run.x)/(C.speed*5),0,1),MODE,sc)}
 const dia=(x,y,r,rot,fill)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=fill;c.fillRect(-r,-r,r*2,r*2);c.restore()};
 for(const sh of run.shardList){if(sh.got)continue;const sx=X(sh.h.at);if(sx<-20||sx>w+20)continue;const sy=yF-(SIDE_PEAK+8)*sc;
  c.save();c.globalCompositeOperation=MODE;c.globalAlpha=.3;dia(sx,sy,9*sc,Math.PI/4,P.gold);c.restore();
  if(!(MI&&MI.drawLight(c,sx,sy,26*sc,t,sh.h.idx,reduced,0)))dia(sx,sy,4.2*sc,Math.PI/4+(reduced?0:t*1.6),P.gold)}
 if(MI&&run.itemList&&run.itemList.length)MI.drawItems(c,run,it=>{const sx=X(it.at);if(sx<-30||sx>w+30)return null;return {x:sx,y:yF-(it.lane==='hi'?SIDE_PEAK*.62+10:15)*sc,s:sc}},t,reduced,0);
 // the runner stands still while holding
 const cr=run.crash,holding=run.inZone()&&run.zone.phase==='hold';
 if(root.MongyuMobile?.sprite)root.MongyuMobile.sprite(c,{x:px,y:yF-run.height*sc,bodyHeight:SIDE_PEAK*sc*1.12,renderAngle:0,strideDistance:run.x,nativeState:0,height:run.height,jumpProgress:run.fly===null?0:run.fly/run.fl,pose:cr?'hurt':holding?'stand':run.fly!==null?'jump':'run'},{poseTime:t,onDark:true},reduced);
 else{c.fillStyle='#fff3e0';c.fillRect(px-5,yF-run.height*sc-SIDE_PEAK*sc,10,SIDE_PEAK*sc)}
 if(MI&&run.mods)MI.drawAura(c,run,px,yF-(run.height+22)*sc,SIDE_PEAK*sc*.7,t,reduced);
 if(run.time-run.pickedAt<.4){const a=(run.time-run.pickedAt)/.4;c.save();c.globalCompositeOperation=MODE;c.globalAlpha=(1-a)*.7;c.strokeStyle=P.gold;c.lineWidth=2;c.beginPath();c.arc(px,yF-30*sc,(10+a*34)*sc,0,TAU);c.stroke();c.restore()}
 c.restore();
 if(!run.hudOff)sideHud(c,run,w,h,P,'엘리베이터');
 return null;
}

/* ---------- registry ---------- */
let SquareRun=null,FlipRun=null,MirrorRun=null,WaitRun=null;
const getSquare=()=>SquareRun||(SquareRun=makeSquareRun());
const getFlip=()=>FlipRun||(FlipRun=makeFlipRun());
const getMirror=()=>MirrorRun||(MirrorRun=makeMirrorRun());
const getWait=()=>WaitRun||(WaitRun=makeWaitRun());
const ACTS=Object.freeze({
 square:o=>{const K=getSquare();return new K(o)},
 flip:o=>{const K=getFlip();return new K(o)},
 mirror:o=>{const K=getMirror();return new K(o)},
 wait:o=>{const K=getWait();return new K(o)}
});
function register(Course){const C=Course||root.MongyuCourse;if(!enabled||!C?.registerAct)return false;for(const [type,f] of Object.entries(ACTS))C.registerAct(type,f);return true}
/* shared pieces for later act files (eye-act.js, liquid-act.js, rhythm-act.js) */
const kit=Object.freeze({sideBase,hazardBlock,corridorGate,sideHud,palOf,dangerInk,skylineTile,lum,mixc,items,cvdOn,reducedMotion,clamp,num,SIDE:Object.freeze({PEAK:SIDE_PEAK,FL:SIDE_FL,W:SIDE_W})});
const api=Object.freeze({enabled,ACTS,register,kit,buildFlip,buildMirror,buildWait,FLIP,LEVELS,MIRROR,WAIT,get SquareRun(){return getSquare()},get FlipRun(){return getFlip()},get MirrorRun(){return getMirror()},get WaitRun(){return getWait()}});
root.MongyuSquareAct=api;if(typeof module!=='undefined')module.exports=api;
if(enabled&&root.MongyuCourse?.registerAct)register(root.MongyuCourse);
})(globalThis);
