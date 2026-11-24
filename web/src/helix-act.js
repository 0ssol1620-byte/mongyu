/* R105 helix acts: spiral ascent and descent runs with an orbiting pseudo-3D camera. Owned by workstream B.
   A ramp winds around a tower (radius R, pitch per turn). The camera orbits the tower following the runner's angle, so the
   runner stays in view while the whole world turns behind. The ramp is cut into ~56 slabs per turn, projected with a real
   perspective camera and painted far-to-near (far side of the tower, tower body, near side). Runner, coral crystals,
   shards, clouds and the aurora gate are billboards sorted into the same list. Tap = jump over beat-grid crystals. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const TAU=Math.PI*2,DEG=Math.PI/180;
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const wrap=a=>{a%=TAU;return a>Math.PI?a-TAU:a<-Math.PI?a+TAU:a};
/* ---------- geometry (world units; the runner is RUN_H tall) ---------- */
const RT=36,R0=36,R1=70,RC=(R0+R1)/2,THICK=7,PITCH=112,SLOPE=PITCH/(TAU*RC),RAIL=4.5;
const PER_TURN=56,DTH=TAU/PER_TURN,DS=RC*DTH,PRE=34,POST=96,TH0=.6;
const RUN_H=22,FLIGHT=.68,PEAK=34,OB_H=13,OB_HALF=5,FOOT=4,REACH_T=.17,BUFFER=.1,HIT_STOP=.12,FAIL_OUTRO=1.05,CLEAR_OUTRO=2.1,INTRO=2.6,LOOK_UP=3;
const PASS=100,CLEAN=25,PERFECT=50,SHARD=25,FINISH_BONUS=300,PERFECT_WINDOW=.07;
const GATE_W=44,GATE_H=64;
const VARIANTS={
 up:{name:'나선 오르막',turns:4,bpm:100,seed:1051,v0:43,v1:50,dist:250,height:92,tilt:-14,zoom0:1,zoom1:.9,frac:.62,look:.34,gaps:[3,4,4,5,3,4,6]},
 down:{name:'나선 내리막',turns:4,bpm:100,seed:2052,v0:34,v1:74,dist:244,height:100,tilt:3,zoom0:.98,zoom1:1.06,frac:.58,look:.35,lookEnd:.6,fov:.12,gaps:[3,4,3,5,4,3,4]}
};
/* hit zone half-width follows speed so the clear window in time stays the same (about +-.17 s of the .68 s jump) */
const reachFor=v=>clamp(v*REACH_T,6.5,12);
const COACH={intro:'나선을 따라 달려요 · 탭 점프',slow:'지금 탭!',perfect:'완벽!',early:'조금 일찍 눌렀어',late:'한 박자 늦었어',finish:'오로라의 문!',crystal:'산호빛 수정은 점프'};
const reducedMotion=()=>{try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}};
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* ---------- course (deterministic) ---------- */
function speedProfile(variant,p){
 const V=VARIANTS[variant];
 if(variant==='up')return lerp(V.v0,V.v1,smooth(p));
 return lerp(V.v0,V.v1,Math.pow(clamp(p,0,1),1.35))*(1-.42*smooth((p-.86)/.14));
}
const courses=new Map();
function buildCourse(o={}){
 const variant=o.variant==='down'?'down':'up',V=VARIANTS[variant],bpm=o.bpm>0?+o.bpm:V.bpm,seed=Number.isFinite(o.seed)?o.seed:V.seed,turns=o.turns>0?+o.turns:V.turns,first=o.first!==false;
 const key=[variant,bpm,seed,turns,first?1:0].join('|');let k=courses.get(key);if(k)return k;
 const L=turns*TAU*RC,STEP=2,n=Math.ceil(L/STEP)+1,ts=new Float32Array(n);
 for(let i=1;i<n;i++){const s0=(i-1)*STEP,s1=Math.min(L,i*STEP);ts[i]=ts[i-1]+(s1-s0)/speedProfile(variant,(s0+s1)/2/L)}
 const T=ts[n-1];
 const timeAt=s=>{s=clamp(s,0,L)/STEP;const i=Math.min(n-2,Math.floor(s));return ts[i]+(ts[i+1]-ts[i])*(s-i)};
 const sAt=t=>{if(t<=0)return 0;if(t>=T)return L;let lo=0,hi=n-1;while(lo<hi-1){const m=lo+hi>>1;if(ts[m]<=t)lo=m;else hi=m}return Math.min(L,(lo+(t-ts[lo])/Math.max(1e-6,ts[hi]-ts[lo]))*STEP)};
 const beat=60/bpm,r=rng(seed),obstacles=[],shards=[];
 let b=first?8:4;const last=Math.floor((T-2.4)/beat);let gi=0;
 while(b<=last){
  const at=sAt(b*beat);obstacles.push({at,beat:b,time:b*beat,lean:(r()-.5)*.5,size:.92+r()*.2,kind:r()<.5?0:1});
  const gap=V.gaps[(gi++ + Math.floor(r()*3))%V.gaps.length];b+=gap;
 }
 for(let i=0;i<obstacles.length;i++){
  shards.push({at:obstacles[i].at,h:OB_H+17,air:true});
  const next=i+1<obstacles.length?obstacles[i+1].beat-obstacles[i].beat:Math.floor((T-obstacles[i].time)/beat);
  if(next>=5)for(let q=0;q<3;q++)shards.push({at:sAt((obstacles[i].beat+2+q*.5)*beat),h:5,air:false});
 }
 for(let q=0;q<4;q++)shards.push({at:sAt(T-(2.1-q*.38)),h:5,air:false});
 shards.sort((a,c)=>a.at-c.at);
 k={variant,L,T,turns,bpm,beat,seed,first,obstacles,shards,timeAt,sAt,speedAt:s=>speedProfile(variant,clamp(s/L,0,1)),count:obstacles.length};
 courses.set(key,k);return k;
}
/* path: theta(s), y(s) */
const thetaAt=s=>TH0+s/RC;
const groundY=(course,s)=>course.variant==='up'?SLOPE*s:SLOPE*(course.L-s);
/* ---------- the run ---------- */
class HelixRun{
 constructor(options={}){
  this.options=options;this.mode='dream';this.dreamMode='helix';this.openingCourse=false;this.polish=true;
  this.variant=options.variant==='down'?'down':'up';this.chain=options.chain||null;
  this.settings={...(options.settings||{})};this.attempt=options.attempt||1;this.skipIntro=!!options.skipIntro;
  const ch=this.chain;this.course=buildCourse({variant:this.variant,bpm:ch?.bpm||options.bpm,seed:Number.isFinite(ch?.seed)?ch.seed:options.seed,turns:options.turns,first:!(ch&&ch.first===false)});
  this.setViewport(options.viewport?.width,options.viewport?.height);this.reset();
 }
 reset(){
  const ch=this.chain,carry=ch?.carry||{},C=this.course;
  this.state='ready';this.time=0;this.clock=0;this.updates=0;this.inputCount=0;this.jumps=0;this.hits=0;this.hearts=1;this.distance=0;this.height=0;this.flight=null;this.buffer=0;this.lastJump=-Infinity;this.lastJumpTime=-Infinity;
  this.events=[];this.index=0;this.passes=0;this.clean=0;this.perfects=0;this.perfectStreak=Math.max(0,carry.perfectStreak|0);this.bestStreak=this.perfectStreak;
  this.startPoints=Number.isFinite(carry.points)?carry.points:0;this.points=this.startPoints;this.score=this.points;
  this.shardGot=new Uint8Array(C.shards.length);this.shardCount=0;this.crash=null;this.hitStop=0;this.outro=null;this.result=null;this.timeScale=1;this.speed=C.speedAt(0);
  this.pose=undefined;this.poseAt=0;this.crossedAt=-10;this.halfway=false;this.slow=this.teaching()?'pending':'done';this.popups=[{on:false,at:0,text:'',perfect:false},{on:false,at:0,text:'',perfect:false},{on:false,at:0,text:'',perfect:false}];
  this.intro=this.skipIntro||ch&&ch.first===false||reducedMotion()?0:INTRO;
  this.coach=this.teaching()?{kind:'intro',text:COACH.intro,until:this.intro+4.2}:null;
  this.fx=this.fx||Array.from({length:40},()=>({on:false,x:0,y:0,z:0,vx:0,vy:0,vz:0,age:0,life:1,size:1,kind:0}));for(const p of this.fx)p.on=false;
  this.cam=null;this.view={actor:null,body:0};
 }
 teaching(){const ch=this.chain;return !ch||ch.first!==false||this.options.tutorial===true}
 setViewport(width=390,height=844){this.viewport={width,height}}
 start(){if(this.state!=='ready')return false;this.state='play';this.events.push('start');return true}
 pause(){if(this.state!=='play')return false;this.state='pause';this.cancelInput();this.events.push('pause');return true}
 resume(){if(this.state!=='pause')return false;this.state='play';this.events.push('resume');return true}
 retry(){this.attempt++;this.skipIntro=true;this.reset();this.state='play';this.events.push('start');return true}
 inputDown(){return this.action()}
 inputUp(){}
 cancelInput(){this.buffer=0}
 action(){
  if(this.state!=='play'||this.outro||this.hitStop>0)return false;
  if(this.intro>0){this.intro=0;return true}
  this.inputCount++;
  if(this.flight!==null){if(this.flight>=FLIGHT-BUFFER)this.buffer=BUFFER;return false}
  return this.jump();
 }
 jump(){this.flight=0;this.lastJump=this.distance;this.lastJumpTime=this.time;this.jumps++;this.buffer=0;this.events.push('jump');this.burst(2,this.distance,0,5);if(this.slow==='active'||this.slow==='pending'&&this.index===0)this.slow='done';return true}
 drainEvents(){return this.events.splice(0)}
 setCoach(kind,hold){this.coach={kind,text:COACH[kind],until:this.time+hold}}
 popup(text,perfect){const p=this.popups.find(q=>!q.on)||this.popups.reduce((a,b)=>a.at<b.at?a:b);p.on=true;p.at=this.clock;p.text=text;p.perfect=perfect}
 /* world-space particles: kind 0 gold spark, 1 crystal shard, 2 dust, 3 aurora */
 burst(kind,s,h,count){
  const th=thetaAt(s),y=groundY(this.course,s)+h,sn=Math.sin(th),cs=Math.cos(th);let made=0;
  for(const p of this.fx){
   if(p.on)continue;const a=(made*2.399+kind*1.3)%TAU,v=kind===1?34+made%5*9:kind===0?18+made%4*6:kind===3?10+made%5*6:10+made%3*4;
   p.on=true;p.kind=kind;p.age=0;p.life=kind===1?.9:kind===3?1.5:kind===0?.7:.5;p.size=kind===1?2.4+made%3*.7:kind===3?1.6:kind===0?1.5:2.2;
   p.x=RC*sn;p.z=RC*cs;p.y=y;const tx=cs,tz=-sn,rx=sn,rz=cs,u=Math.cos(a),w=Math.sin(a);
   p.vx=(tx*u*v+rx*w*v*.6)*(kind===2?.6:1);p.vz=(tz*u*v+rz*w*v*.6)*(kind===2?.6:1);p.vy=(kind===2?6:kind===3?18+made%4*8:14+Math.abs(w)*v*.9);
   if(++made>=count)break;
  }
 }
 fxStep(dt){for(const p of this.fx){if(!p.on)continue;p.age+=dt;if(p.age>=p.life){p.on=false;continue}const g=p.kind===1?-70:p.kind===3?4:p.kind===0?-18:-6,d=Math.pow(p.kind===1?.25:.08,dt);p.vx*=d;p.vz*=d;p.vy=p.vy*Math.pow(.3,dt)+g*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt}}
 tick(dt){
  if(this.state!=='play')return;
  this.updates++;this.clock+=dt;this.fxStep(dt);
  if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);return}
  if(this.outro){this.outro.age+=dt;if(this.outro.age>=this.outro.duration)this.finish(this.outro.kind);return}
  if(this.intro>0){this.intro=Math.max(0,this.intro-dt);return}
  const C=this.course;dt=this.pace(dt);if(!dt)return;
  this.time+=dt;this.speed=C.speedAt(this.distance);this.distance=Math.min(C.L,this.distance+this.speed*dt);this.buffer=Math.max(0,this.buffer-dt);
  if(this.flight!==null){
   this.flight+=dt;const ph=Math.min(1,this.flight/FLIGHT);this.height=4*PEAK*ph*(1-ph);
   if(ph===1){this.flight=null;this.height=0;this.events.push('land');this.burst(2,this.distance,0,4);if(this.buffer>0)this.jump()}
  }
  const ob=C.obstacles[this.index];
  if(ob){
   const gap=this.distance-ob.at,reach=reachFor(this.speed);
   if(Math.abs(gap)<=reach&&this.height<OB_H){this.hit(ob);return}
   if(gap>reach){
    this.index++;this.passes++;this.crossedAt=this.time;
    const eta=(ob.at-this.lastJump)/Math.max(1,this.speed),perfect=this.lastJump>=ob.at-FLIGHT*this.speed*1.2&&Math.abs(eta-FLIGHT/2)<=PERFECT_WINDOW,clean=this.height>=OB_H+5;
    if(clean)this.clean++;
    this.perfectStreak=perfect?this.perfectStreak+1:0;this.bestStreak=Math.max(this.bestStreak,this.perfectStreak);if(perfect)this.perfects++;
    const gain=PASS+(clean?CLEAN:0)+(perfect?PERFECT*Math.min(5,this.perfectStreak):0);this.points+=gain;
    this.popup('+'+gain+(perfect?' 완벽':''),perfect);
    this.events.push(perfect?'perfect':'pass');
   }
  }
  for(let i=0;i<C.shards.length;i++){
   if(this.shardGot[i])continue;const sh=C.shards[i],d=Math.abs(this.distance-sh.at);if(d>9)continue;
   if(sh.air?this.height>=PEAK-13:this.height<=11){this.shardGot[i]=1;this.shardCount++;this.points+=SHARD;this.burst(0,sh.at,sh.h,6)}
  }
  if(!this.halfway&&this.distance>=C.L/2){this.halfway=true;this.events.push('corner')}
  this.score=this.points+Math.floor(this.distance/10);
  if(this.distance>=C.L)this.reach();
 }
 pace(dt){
  const C=this.course,ob=C.obstacles[this.index];let target=1;
  if(this.slow==='pending'&&ob&&ob.at-this.distance<this.speed*1.15&&ob.at-this.distance>0)this.slow='active';
  if(this.slow==='active'){if(!ob||this.distance>ob.at-this.speed*.28){this.slow='done'}else{target=.42;if(this.coach?.kind!=='slow')this.setCoach('slow',1.2)}}
  if(this.slow!=='active'&&this.coach?.kind==='slow')this.coach=null;
  this.timeScale+=(target-this.timeScale)*Math.min(1,dt*9);if(Math.abs(target-this.timeScale)<.004)this.timeScale=target;
  return dt*this.timeScale;
 }
 hit(ob){
  this.hits++;this.hearts=0;this.perfectStreak=0;
  this.crash={index:this.index,at:this.distance,early:ob.at-this.lastJump>this.speed*FLIGHT*.55&&(this.flight===null||this.flight/FLIGHT>.5)};
  this.events.push('hit');this.hitStop=reducedMotion()?0:HIT_STOP;this.pose='hurt';this.poseAt=this.clock;
  this.outro={kind:'fail',age:0,duration:FAIL_OUTRO};this.setCoach(this.crash.early?'early':'late',2.4);this.burst(1,ob.at,6,14);this.burst(0,ob.at,8,4);
 }
 reach(){
  const last=!this.chain||this.chain.last!==false;
  this.points+=last?FINISH_BONUS:100;this.score=this.points+Math.floor(this.distance/10);this.events.push('portal');this.pose='joy';this.poseAt=this.clock;
  if(!last){this.finish('clear');return}
  this.setCoach('finish',2);this.burst(3,this.course.L,12,24);this.outro={kind:'clear',age:0,duration:CLEAR_OUTRO};
 }
 finish(state){
  this.state=state;this.outro=null;const C=this.course;
  if(state==='clear'&&this.pose!=='joy'){this.pose='joy';this.poseAt=this.clock}
  this.result={runVersion:105,mode:'helix',variant:this.variant,state,score:this.score,points:this.points,shards:this.shardCount,shardTotal:C.shards.length,perfectStreak:this.perfectStreak,bestStreak:this.bestStreak,
   perfects:this.perfects,clears:this.passes,blocks:C.count,distance:Math.floor(this.distance),progress:this.distance/C.L,time:this.time,hits:this.hits,jumps:this.jumps,attempt:this.attempt,
   reason:state==='clear'?'오로라의 문을 지났어요.':'산호빛 수정에 부딪혔어요'};
  this.events.push(state);
 }
 status(){
  const C=this.course;
  return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:this.score,best:0,progress:this.distance/C.L,
   roomTitle:VARIANTS[this.variant].name,roomIndex:0,roomCount:1,instruction:'탭: 점프 · 수정 '+this.index+' / '+C.count,cue:null,result:this.result};
 }
 drawSelf(ctx,opts){return draw(ctx,this,opts)}
}
/* ---------- palette (time of day) ---------- */
const hexRGB=h=>{const n=parseInt(h.slice(1),16);return [n>>16&255,n>>8&255,n&255]};
const KEYS=['top','mid','bot','fog','sun','towerLit','towerShade','rampTop','rampWall','rampUnder','window','far','near'];
const mkKey=(...v)=>Object.fromEntries(KEYS.map((k,i)=>[k,hexRGB(v[i])]));
const SKIES={
 up:[mkKey('#0d1233','#2d2a66','#8d579a','#7d66aa','#ff9f8c','#7468b8','#201c4c','#f1e4ef','#8f72b8','#3a2f68','#ffd9a0','#34306a','#523f88'),
     mkKey('#34509f','#d27eb0','#ffd1a0','#ecb4c0','#ffe7ae','#c796cc','#43367c','#fff6ea','#d09abe','#6a4c98','#fff1c4','#8f70b8','#bd86b6')],
 down:[mkKey('#5468b8','#f2a583','#ffe2a0','#f4c29c','#fff2c4','#dca4bc','#58407e','#fff3de','#da968f','#6a4a8c','#fff5cc','#c488b4','#e09ca0'),
       mkKey('#3a2f76','#c0539a','#ff9585','#d27eac','#ffb48c','#a97ac2','#3d3175','#f8e0ea','#a97cbc','#43336f','#ffdcaa','#7050a0','#9a6cb0'),
       mkKey('#080b29','#1d1e52','#4a3978','#443c8a','#e9e2ff','#6a62b4','#1b1745','#d9d5f5','#7c6eb8','#2b2257','#ffe1a2','#27235c','#3e3478')]
};
const PQ=64;
function skyAt(variant,p){
 const ks=SKIES[variant],f=clamp(p,0,1)*(ks.length-1),i=Math.min(ks.length-2,Math.floor(f)),t=f-i,o={};
 for(const k of KEYS){const a=ks[i][k],b=ks[i+1][k];o[k]=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
 return o;
}
const mixS=(a,b,t)=>'rgb('+Math.round(a[0]+(b[0]-a[0])*t)+','+Math.round(a[1]+(b[1]-a[1])*t)+','+Math.round(a[2]+(b[2]-a[2])*t)+')';
const mixA=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const FOGN=8,LIGHTN=4,TOWERN=16,LIGHT_AZ=.9;
const pals=new Map();
function paletteFor(variant,p,fogK){
 const q=Math.round(clamp(p,0,1)*PQ),key=variant+q+'|'+fogK,hit=pals.get(key);if(hit)return hit;
 if(pals.size>200)pals.clear();
 const s=skyAt(variant,q/PQ),fa=Math.min(.9,.82*fogK);
 const top=[],wall=[],under=[];
 for(let l=0;l<LIGHTN;l++){const lt=l/(LIGHTN-1),tb=mixA(s.rampUnder,s.rampTop,.8+.2*lt),wb=mixA(s.rampUnder,s.rampWall,.3+.7*lt);top.push([]);wall.push([]);for(let f=0;f<FOGN;f++){const a=f/(FOGN-1)*fa;top[l].push(mixS(tb,s.fog,a));wall[l].push(mixS(wb,s.fog,a))}}
 for(let f=0;f<FOGN;f++)under.push(mixS(s.rampUnder,s.fog,f/(FOGN-1)*fa));
 const tower=[];for(let l=0;l<TOWERN;l++)tower.push(mixS(s.towerShade,s.towerLit,Math.pow(l/(TOWERN-1),.85)));
 const night=variant==='down'?smooth((q/PQ-.55)/.4):smooth(.9-q/PQ*1.6);
 const rgb=a=>'rgb('+(a[0]|0)+','+(a[1]|0)+','+(a[2]|0)+')',rgba=(a,al)=>'rgba('+(a[0]|0)+','+(a[1]|0)+','+(a[2]|0)+','+al+')';
 const pal={q,s,top,wall,under,tower,night,sky:[rgb(s.top),rgb(s.mid),rgb(s.bot)],fogCss:rgb(s.fog),fogA:a=>rgba(s.fog,a),sunCss:rgb(s.sun),sunA:a=>rgba(s.sun,a),windowCss:rgb(s.window),windowA:a=>rgba(s.window,a),farCss:rgb(s.far),nearCss:rgb(s.near),
  band:rgba(mixA(s.towerLit,s.rampTop,.5),.22),edge:rgba(s.rampTop,.75),ao:rgba(mixA(s.rampUnder,[10,6,30],.5),.2),cloudKey:(q>>2)};
 pals.set(key,pal);return pal;
}
/* ---------- scratch + caches ---------- */
const N_SAMPLES=(c=>Math.ceil((c.L+PRE+POST)/DS)+2);
const geo=new Map();
function geometry(course){
 const key=course.variant+'|'+course.turns;let g=geo.get(key);if(g)return g;
 const n=N_SAMPLES(course),sn=new Float32Array(n),cs=new Float32Array(n),th=new Float32Array(n),y=new Float32Array(n);
 for(let j=0;j<n;j++){const s=-PRE+j*DS,t=thetaAt(s);th[j]=t;sn[j]=Math.sin(t);cs[j]=Math.cos(t);y[j]=groundY(course,s)}
 let lo=Infinity,hi=-Infinity;for(let j=0;j<n;j++){lo=Math.min(lo,y[j]);hi=Math.max(hi,y[j])}
 const clouds=[],r=rng(course.seed*7+3);for(let i=0;i<16;i++)clouds.push({th:r()*TAU,r:96+r()*110,y:lo-70+r()*(hi-lo+160),w:90+r()*110,a:.22+r()*.3,flip:r()<.5});
 const stars=[],r2=rng(991);for(let i=0;i<70;i++)stars.push({x:r2(),y:r2(),z:.3+r2()*.7,p:r2()*TAU});
 const ridges=[0,1,2].map(i=>{const q=rng(40+i),w=[];for(let k=0;k<5;k++)w.push({f:2+k*2+Math.floor(q()*3),p:q()*TAU,a:q()});return w});
 g={n,sn,cs,th,y,lo,hi,top:hi+(course.variant==='up'?58:34),bot:lo-130,clouds,stars,ridges};geo.set(key,g);return g;
}
const SX=new Float32Array(2048*5),SY=new Float32Array(2048*5),SD=new Float32Array(2048);
const TXT=new Float32Array(50*2),TYT=new Float32Array(50*2);
const MAXI=1024,KEYS_I=new Float32Array(MAXI),KIND=new Uint8Array(MAXI),IDS=new Int16Array(MAXI),ORDER=new Int16Array(MAXI);
let PX=0,PY=0,PD=1,PK=1;
const V={cp:1,sp:0,Dc:250,yc:0,cT:1,sT:0,F:800,cx:0,cy:0};
function proj(x,y,z){const xv=x*V.cp-z*V.sp,zr=x*V.sp+z*V.cp-V.Dc,yv=y-V.yc,d=-zr*V.cT-yv*V.sT,up=yv*V.cT-zr*V.sT,k=V.F/(d<8?8:d);PX=V.cx+xv*k;PY=V.cy-up*k;PD=d;PK=k}
const skyCache={key:'',g:null},washCache={key:'',g:null};
let gateInk=null,cloudSprite=null,cloudKey=-1,glowSprites={};
function canvasOf(w,h){try{if(root.document?.createElement){const c=root.document.createElement('canvas');c.width=w;c.height=h;return c}}catch(_){}return null}
function makeCloud(pal){
 const c=canvasOf(192,80);if(!c)return null;const x=c.getContext('2d');if(!x)return null;
 const col=pal.s.fog,lit=mixA(col,[255,250,240],.55);
 const blobs=[[96,46,60,24],[58,50,40,19],[132,50,46,20],[80,36,34,17],[116,38,30,15],[30,54,24,12],[162,54,24,12]];
 for(const [bx,by,rx,ry] of blobs){const g=x.createRadialGradient(bx,by,0,bx,by,rx);g.addColorStop(0,'rgba('+(lit[0]|0)+','+(lit[1]|0)+','+(lit[2]|0)+',.9)');g.addColorStop(.55,'rgba('+(lit[0]|0)+','+(lit[1]|0)+','+(lit[2]|0)+',.4)');g.addColorStop(1,'rgba('+(col[0]|0)+','+(col[1]|0)+','+(col[2]|0)+',0)');x.save();x.translate(bx,by);x.scale(1,ry/rx);x.translate(-bx,-by);x.fillStyle=g;x.beginPath();x.arc(bx,by,rx,0,TAU);x.fill();x.restore()}
 return c;
}
function glow(rgb){
 let s=glowSprites[rgb];if(s!==undefined)return s;
 const c=canvasOf(48,48);if(!c){glowSprites[rgb]=null;return null}const x=c.getContext('2d');if(!x){glowSprites[rgb]=null;return null}
 const g=x.createRadialGradient(24,24,0,24,24,24);g.addColorStop(0,'rgba('+rgb+',.95)');g.addColorStop(.35,'rgba('+rgb+',.32)');g.addColorStop(1,'rgba('+rgb+',0)');x.fillStyle=g;x.fillRect(0,0,48,48);glowSprites[rgb]=c;return c;
}
/* ---------- camera ---------- */
function camParams(run,reduced){
 const C=run.course,V0=VARIANTS[run.variant],p=clamp(run.distance/C.L,0,1),up=run.variant==='up';
 const sp=run.speed,u=up?0:clamp((sp-V0.v0)/(V0.v1-V0.v0),0,1);
 const clearK=run.outro?.kind==='clear'?ease(clamp(run.outro.age/1.6,0,1)):run.state==='clear'?1:0;
 const left=(C.L-run.distance)/Math.max(8,sp);
 let tilt=V0.tilt,zoom=lerp(V0.zoom0,V0.zoom1,reduced?smooth(p)*.6:smooth(p)),dist=V0.dist,height=V0.height,look=V0.look;
 if(up){
  if(left<LOOK_UP&&!run.outro&&run.state!=='fail'||run.outro?.kind==='clear'||run.state==='clear'){const k=run.outro?.kind==='clear'||run.state==='clear'?1:smooth(1-left/LOOK_UP);tilt-=k*(reduced?9:20)}
 }else{
  look=lerp(V0.look,V0.lookEnd,reduced?0:u);
  if(!reduced)dist*=1-V0.fov*u;
 }
 if(reduced)dist*=1.12;
 if(clearK>0){dist*=1+.28*clearK;zoom*=1-.08*clearK;tilt-=(up?8:4)*clearK*(reduced?.5:1)}
 return {tilt,zoom,dist,height,look,u,p,clearK};
}
function updateCam(run,w,h,reduced){
 const C=run.course,g=geometry(C),cp=camParams(run,reduced),t=run.clock;
 let cam=run.cam;
 const th=thetaAt(run.distance),omega=run.speed/RC,gy=groundY(C,run.distance),gyLead=groundY(C,Math.min(C.L,run.distance+run.speed*cp.look*.8));
 const psi=(reduced?.2:.1)+cp.look*omega*(reduced?.7:1);
 if(!cam||Math.abs(t-cam.t)>.5||t<cam.t){cam=run.cam={t,phi:th+psi,y:gy,vy:0,introK:run.intro>0?0:1,psi}}
 const dt=clamp(t-cam.t,0,.05);cam.t=t;
 const K=reduced?4.5:9,ffwd=(run.hitStop>0||run.state!=='play'||run.outro&&run.outro.kind==='fail'?0:omega)/K;
 const targetPhi=th+psi+ffwd;cam.phi+=wrap(targetPhi-cam.phi)*(1-Math.exp(-dt*K));
 // height spring (zeta .8)
 const wn=reduced?5:7,target=lerp(gy,gyLead,.5);let rem=dt;
 while(rem>0){const st=Math.min(rem,1/120);cam.vy+=(wn*wn*(target-cam.y)-2*.8*wn*cam.vy)*st;cam.y+=cam.vy*st;rem-=st}
 const introTarget=run.intro>0?1-run.intro/INTRO:1;
 cam.introK=run.intro>0?introTarget:Math.min(1,cam.introK+dt*(reduced?9:2.2));
 const ik=ease(clamp(cam.introK,0,1)),ia=1-ik;
 // assemble
 const dist=cp.dist*(1+.9*ia),height=cp.height*(1+.75*ia),phi=cam.phi+ia*1.35;
 V.cp=Math.cos(phi);V.sp=Math.sin(phi);V.Dc=dist;V.yc=cam.y+height;
 const pitch=Math.atan2(height,dist-RC)+cp.tilt*DEG+ia*.12;V.cT=Math.cos(pitch);V.sT=Math.sin(pitch);
 // focal length: the runner is ~9% of the screen height at the nominal pitch/distance
 const Hs=Math.min(h,w*2.05),sRun=.092*Hs/RUN_H,sc=VARIANTS[run.variant],upv=run.variant==='up';
 const rs=Math.sin(th-phi)*RC,rz=Math.cos(th-phi)*RC,zr=rz-dist,yv=gy-V.yc,dRun=-zr*V.cT-yv*V.sT;
 V.F=sRun*dRun*cp.zoom*(.55+.45*ik);
 // principal point: the smoothed ground point sits at a fixed fraction of the screen height; the runner may jump above it
 const upr=yv*V.cT-zr*V.sT,k=V.F/Math.max(8,dRun),lookUp=upv?clamp(-(cp.tilt-sc.tilt)/20,0,1):0,frac=sc.frac+(upv?.17*lookUp:.05*cp.clearK);
 V.cy=h*frac+upr*k;V.cx=w*.5-rs*k*.62;
 return {cp,g,th,gy,pitch,phi,ik,ia,psi,omega};
}
/* ---------- drawing ---------- */
function quad(c,ax,ay,bx,by,cx,cy,dx,dy){c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.lineTo(cx,cy);c.lineTo(dx,dy);c.closePath()}
function drawSky(c,w,h,pal,cam,t,reduced,run,yh){
 const key=pal.q+'|'+h;
 if(skyCache.key!==key){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,pal.sky[0]);g.addColorStop(.55,pal.sky[1]);g.addColorStop(1,pal.sky[2]);skyCache.key=key;skyCache.g=g}
 c.fillStyle=skyCache.g;c.fillRect(0,0,w,h);
 const par=reduced?.5:1,ph=cam.phi,geo=cam.g;
 // stars at night
 if(pal.night>.05){
  c.fillStyle='#fff';
  for(let i=0;i<geo.stars.length;i++){const s=geo.stars[i],x=((s.x*w*2-ph*w*.05*s.z*par)%(w*2)+w*2)%(w*2)-w*.5,y=s.y*yh*.9;if(x<-4||x>w+4)continue;c.globalAlpha=pal.night*(.35+.5*s.z)*(reduced?.8:.65+.35*Math.sin(t*1.3+s.p));c.fillRect(x,y,s.z>.8?2:1.4,s.z>.8?2:1.4)}
  c.globalAlpha=1;
 }
 // sun / moon: slides slowly with the orbit; glow is the main light of the scene
 const sunAz=LIGHT_AZ,sx=w*.5+wrap(sunAz-ph*.5)*w*.55*par,riseU=run.variant==='up'?clamp(run.distance/run.course.L,0,1):1-clamp(run.distance/run.course.L,0,1);
 const sy=run.variant==='up'?yh-lerp(-10,.2,riseU)*h*.18:yh-lerp(.02,.2,riseU)*h*.2,sr=Math.min(w,h)*(run.variant==='down'&&pal.night>.5?.07:.11);
 if(sx>-w*.6&&sx<w*1.6){
  c.save();c.globalCompositeOperation='lighter';
  const g=glow('255,226,190');
  if(g){c.globalAlpha=.55*(1-pal.night*.5);c.drawImage(g,sx-sr*5,sy-sr*5,sr*10,sr*10);c.globalAlpha=.9;c.drawImage(g,sx-sr*2,sy-sr*2,sr*4,sr*4)}
  c.restore();
  c.fillStyle=pal.sunCss;c.globalAlpha=.9;c.beginPath();c.arc(sx,sy,sr*.42,0,TAU);c.fill();c.globalAlpha=1;
 }
 // distant silhouettes: three ridges of floating peaks over the cloud sea, parallax slower than the tower
 for(let L=0;L<3;L++){
  const rg=geo.ridges[L],fpar=(.16+L*.14)*par,base=yh+L*h*.018,amp=h*(.07+L*.03),k=[.22,.38,.6][L],col=mixS(pal.s.far,pal.s.fog,k);
  c.fillStyle=col;c.beginPath();c.moveTo(0,h);
  for(let x=0;x<=w+16;x+=16){
   const a=ph*fpar+(x-w/2)/(w*1.1);let v=0;for(const q of rg)v+=Math.sin(a*q.f*1.6+q.p)*(.35+q.a)/(1+q.f*.18);
   const y=base-amp*(.55+.55*Math.max(-.2,v))*(L===0?1.1:1);c.lineTo(x,y);
  }
  c.lineTo(w+16,h);c.closePath();c.fill();
 }
 // cloud sea / haze below the horizon
 const wk=pal.q+'|'+h+'|'+Math.round(yh);
 if(washCache.key!==wk){const g=c.createLinearGradient(0,yh-h*.04,0,h);g.addColorStop(0,pal.fogA(0));g.addColorStop(.18,pal.fogA(.6));g.addColorStop(1,pal.fogA(.9));washCache.key=wk;washCache.g=g;washCache.y=yh-h*.04}
 c.save();c.translate(0,washCache.y);c.fillStyle=washCache.g;c.fillRect(0,0,w,h-washCache.y+2);c.restore();
}
/* tower body, windows and bands. Drawn between the far and near halves of the ramp. */
function drawTower(c,w,h,pal,cam,run,reduced){
 const g=cam.g,N=48,TS=TAU/N,phi=cam.phi,yT=g.top,yB=g.bot,rr=RT+.25;
 const cutHi=Math.min(yT,V.yc+420),cutLo=Math.max(yB,V.yc-420);
 for(let k=0;k<N;k++){const a=k*TS,x=rr*Math.sin(a),z=rr*Math.cos(a);proj(x,cutHi,z);TXT[k]=PX;TYT[k]=PY;proj(x,cutLo,z);TXT[N+k]=PX;TYT[N+k]=PY}
 const thr=RT/V.Dc;let start=-1;const vis=k=>Math.cos((k+.5)*TS-phi)>thr;
 for(let k=0;k<N;k++)if(vis(k)&&!vis((k+N-1)%N)){start=k;break}
 if(start<0)return;
 let cnt=0;while(cnt<N&&vis((start+cnt)%N))cnt++;
 // silhouette clip
 c.save();c.beginPath();
 for(let i=0;i<=cnt;i++){const k=(start+i)%N;i?c.lineTo(TXT[k],TYT[k]):c.moveTo(TXT[k],TYT[k])}
 for(let i=cnt;i>=0;i--){const k=(start+i)%N;c.lineTo(TXT[N+k],TYT[N+k])}
 c.closePath();c.clip();
 for(let i=0;i<cnt;i++){
  const k=(start+i)%N,k2=(k+1)%N,l=Math.round(Math.pow(clamp(.5+.62*Math.cos((k+.5)*TS-LIGHT_AZ),0,1),1.25)*(TOWERN-1));
  quad(c,TXT[k],TYT[k],TXT[k2],TYT[k2],TXT[N+k2],TYT[N+k2],TXT[N+k],TYT[N+k]);c.fillStyle=pal.tower[l];c.fill();c.lineWidth=1;c.strokeStyle=pal.tower[l];c.stroke();
 }
 // horizontal bands (carved rings) and window slits
 const BAND=56,b0=Math.ceil((V.yc-420)/BAND),b1=Math.floor((V.yc+420)/BAND);
 c.strokeStyle=pal.band;c.lineWidth=Math.max(1,V.F/520*1.4);
 for(let b=b0;b<=b1;b++){const y=b*BAND;if(y<yB+4||y>yT-4)continue;c.beginPath();let pen=false;for(let i=0;i<=cnt;i++){const a=((start+i)%N)*TS;proj((rr+.3)*Math.sin(a),y,(rr+.3)*Math.cos(a));if(PY<-30||PY>h+30){pen=false;continue}pen?c.lineTo(PX,PY):c.moveTo(PX,PY);pen=true}c.stroke()}
 const WS=28,w0=Math.ceil((V.yc-300)/WS),w1=Math.floor((V.yc+300)/WS),hw=.032;
 c.beginPath();let any=false;
 for(let m=0;m<16;m++){
  const a=(m+.5)*TAU/16,rel=Math.cos(a-phi);if(rel<thr+.12)continue;
  for(let row=w0;row<=w1;row++){
   if((row+m)%2)continue;const y=row*WS;if(y<yB+20||y>yT-18)continue;
   const hs=(m*7+row*13)%5;if(hs===0)continue;
   const a0=a-hw,a1=a+hw,h1=y+15,x0=(rr+.2)*Math.sin(a0),z0=(rr+.2)*Math.cos(a0),x1=(rr+.2)*Math.sin(a1),z1=(rr+.2)*Math.cos(a1);
   proj(x0,y,z0);const ax=PX,ay=PY;proj(x1,y,z1);const bx=PX,by=PY;proj(x1,h1,z1);const cx=PX,cy=PY;proj(x0,h1,z0);
   if(ay<-20&&PY<-20||ay>h+20)continue;
   c.moveTo(ax,ay);c.lineTo(bx,by);c.lineTo(cx,cy);c.lineTo(PX,PY);c.closePath();any=true;
  }
 }
 if(any){c.fillStyle=pal.windowA(.78);c.fill()}
 // vertical mist: the tower dissolves above and below the runner
 const key='tw'+pal.q+'|'+h;
 if(washCache.tk!==key){const gg=c.createLinearGradient(0,0,0,h);gg.addColorStop(0,pal.fogA(.7));gg.addColorStop(.28,pal.fogA(.06));gg.addColorStop(.62,pal.fogA(0));gg.addColorStop(.9,pal.fogA(.38));gg.addColorStop(1,pal.fogA(.7));washCache.tk=key;washCache.tg=gg}
 c.fillStyle=washCache.tg;c.fillRect(0,0,w,h);
 // soft shade toward the silhouette edges (cylindrical roundness)
 c.restore();
 // crown cap (visible when the camera is above the tower top)
 if(V.yc>yT+4){
  c.beginPath();for(let k=0;k<N;k++){const a=k*TS;proj((RT+4)*Math.sin(a),yT,(RT+4)*Math.cos(a));k?c.lineTo(PX,PY):c.moveTo(PX,PY)}c.closePath();c.fillStyle=pal.top[2][1];c.fill();
 }
}
function drawSegment(c,j,pal,cam,hFrame){
 const n=cam.g.n,g=cam.g,o=j*5,o2=o+5;
 const ax=SX[o],ay=SY[o],bx=SX[o+1],by=SY[o+1],cx2=SX[o+2],cy2=SY[o+2],dx=SX[o+3],dy=SY[o+3];
 const ax2=SX[o2],ay2=SY[o2],bx2=SX[o2+1],by2=SY[o2+1],cx3=SX[o2+2],cy3=SY[o2+2],dx2=SX[o2+3],dy2=SY[o2+3];
 const top=Math.max(ay,by,ay2,by2,cy2,cy3),bot=Math.min(ay,by,ay2,by2,cy2,cy3);
 if(bot>hFrame+30||top<-30)return;
 const right=Math.max(ax,bx,ax2,bx2,dx,dx2),left=Math.min(ax,bx,ax2,bx2,dx,dx2);if(right<-24||left>V.cx*2+24)return;
 const mid=(g.th[j]+DTH*.5),lt=Math.round(clamp(.5+.5*Math.cos(mid-LIGHT_AZ),0,1)*(LIGHTN-1));
 const dn=clamp((SD[j]-(V.Dc-R1))/(2*R1+60),0,1),vf=clamp((Math.abs((by+by2)/2-V.cy)-hFrame*.3)/(hFrame*.42),0,1),fv=Math.max(dn*.55,vf*.95),fi=Math.min(FOGN-1,Math.floor(fv*FOGN));
 // top (or underside when the slab is above the camera)
 const areaTop=(ax*by-bx*ay)+(bx*by2-bx2*by)+(bx2*ay2-ax2*by2)+(ax2*ay-ax*ay2);
 const areaW=(bx*cy2-cx2*by)+(cx2*cy3-cx3*cy2)+(cx3*by2-bx2*cy3)+(bx2*by-bx*by2);
 const areaU=(dx*cy2-cx2*dy)+(cx2*cy3-cx3*cy2)+(cx3*dy2-dx2*cy3)+(dx2*dy-dx*dy2);
 if(areaW<0){quad(c,bx,by,cx2,cy2,cx3,cy3,bx2,by2);c.fillStyle=pal.wall[lt][fi];c.fill();c.lineWidth=1;c.strokeStyle=c.fillStyle;c.stroke()}
 if(areaU>0){quad(c,dx,dy,cx2,cy2,cx3,cy3,dx2,dy2);c.fillStyle=pal.under[fi];c.fill();c.lineWidth=1;c.strokeStyle=c.fillStyle;c.stroke()}
 if(areaTop<0){
  quad(c,ax,ay,bx,by,bx2,by2,ax2,ay2);c.fillStyle=pal.top[lt][fi];c.fill();c.lineWidth=1;c.strokeStyle=c.fillStyle;c.stroke();
  // contact shadow against the tower and a pale lip on the outer edge
  if(fi<6&&j%2===0){c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.strokeStyle='rgba(60,36,100,.13)';c.lineWidth=1;c.stroke()}
  const m=.3;quad(c,ax,ay,ax+(bx-ax)*m,ay+(by-ay)*m,ax2+(bx2-ax2)*m,ay2+(by2-ay2)*m,ax2,ay2);c.fillStyle=pal.ao;c.fill();
  if(fi<5){c.beginPath();c.moveTo(bx,by);c.lineTo(bx2,by2);c.strokeStyle=pal.edge;c.lineWidth=Math.max(1,V.F/380);c.stroke()}
 }
 // rail: low posts and a thin rope along the outer edge
 const ex=SX[o+4],ey=SY[o+4],ex2=SX[o2+4],ey2=SY[o2+4];
 if(areaTop<0&&fi<6){c.beginPath();c.moveTo(ex,ey);c.lineTo(ex2,ey2);c.strokeStyle=pal.edge;c.lineWidth=Math.max(.8,V.F/620);c.stroke();
  if(j%4===0){c.beginPath();c.moveTo(bx,by);c.lineTo(ex,ey);c.lineWidth=Math.max(1,V.F/460);c.stroke()}}
}
function drawCrystal(c,run,ob,i,pal,cam,t,reduced){
 const th=thetaAt(ob.at),y=groundY(run.course,ob.at),sn=Math.sin(th),cs=Math.cos(th);
 proj(RC*sn,y,RC*cs);const bx=PX,by=PY,k=PK;if(bx<-80||bx>cam.w+80)return;
 const crashed=run.crash&&run.crash.index===i,since=run.clock-run.poseAt;
 const fade=crashed?clamp(1-(since-.02)/.2,0,1):1;if(fade<=0)return;
 const dn=clamp((PD-(V.Dc-R1))/(2*R1+60),0,1),fi=Math.min(FOGN-1,Math.floor(dn*.5*FOGN));
 c.save();c.translate(bx,by);c.scale(k*ob.size,k*ob.size);
 // ground glow + warning ring on the ramp
 c.save();c.scale(1,.38);c.globalAlpha=.5*fade;c.beginPath();c.arc(0,0,11,0,TAU);c.strokeStyle='rgba(255,130,112,.75)';c.lineWidth=.9;c.stroke();c.globalAlpha=.9*fade;c.fillStyle='rgba(60,20,50,.28)';c.beginPath();c.arc(0,0,8.4,0,TAU);c.fill();c.restore();
 c.globalAlpha=fade*(1-fi*.045);
 const pulse=reduced?0:.5+.5*Math.sin(t*3.2+i);
 const spike=(x,hh,wd,lean,lc,rc,tc)=>{
  const tx=x+lean*hh*.5;
  c.beginPath();c.moveTo(x-wd,0);c.lineTo(x-wd*.78+lean*hh*.12,-hh*.72);c.lineTo(tx,-hh);c.lineTo(x+lean*hh*.02,0);c.closePath();c.fillStyle=lc;c.fill();
  c.beginPath();c.moveTo(x+lean*hh*.02,0);c.lineTo(tx,-hh);c.lineTo(x+wd*.8+lean*hh*.12,-hh*.7);c.lineTo(x+wd,0);c.closePath();c.fillStyle=rc;c.fill();
  c.beginPath();c.moveTo(tx-wd*.3,-hh*.78);c.lineTo(tx,-hh);c.lineTo(tx+wd*.28,-hh*.76);c.lineTo(tx,-hh*.66);c.closePath();c.fillStyle=tc;c.fill();
  c.lineWidth=.45;c.strokeStyle='rgba(255,236,224,.55)';c.beginPath();c.moveTo(x-wd,0);c.lineTo(x-wd*.78+lean*hh*.12,-hh*.72);c.lineTo(tx,-hh);c.stroke();
 };
 spike(-5.3,9.5,2.5,-.2+ob.lean,'#ff9d85','#cf585c','#ffe6d6');
 spike(5.6,8,2.3,.22+ob.lean*.5,'#ff8e78','#c24d58','#ffd9c8');
 spike(0,OB_H+1.6,3.6,ob.lean*.35,'#ffa793','#d45b5c','#fff0e4');
 if(ob.kind){spike(-1.4,7,1.8,-.35,'#ff8b76','#bf4a56','#ffd2c2')}
 c.restore();
 // additive halo so the crystals read at a glance
 c.save();c.globalCompositeOperation='lighter';const gl=glow('255,120,100');
 if(gl){const s=k*ob.size*40;c.globalAlpha=(.4+.2*pulse)*fade;c.drawImage(gl,bx-s/2,by-s*.62,s,s)}c.restore();
}
function drawShard(c,run,sh,i,pal,t,reduced){
 const th=thetaAt(sh.at),y=groundY(run.course,sh.at)+sh.h+(reduced?0:Math.sin(t*2.2+i)*1.2),sn=Math.sin(th),cs=Math.cos(th);
 proj(RC*sn,y,RC*cs);if(PX<-30||PX>V.cx*2+30)return;const k=PK,big=sh.air?1.35:1,sp=reduced?.4:Math.cos(t*2+i*1.7);
 const gl=glow('255,222,140');if(gl){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.55;const s=k*22*big;c.drawImage(gl,PX-s/2,PY-s/2,s,s);c.restore()}
 c.save();c.translate(PX,PY);c.scale(k*big,k*big);const w=Math.max(.35,Math.abs(sp))*3;
 c.beginPath();c.moveTo(0,-4.6);c.lineTo(w,0);c.lineTo(0,4.6);c.lineTo(-w,0);c.closePath();c.fillStyle='#ffe08a';c.fill();
 c.beginPath();c.moveTo(0,-4.6);c.lineTo(w,0);c.lineTo(0,.6);c.closePath();c.fillStyle='#fff7d0';c.fill();c.restore();
}
function drawCloud(c,cl,pal,cam,t,reduced){
 if(!cloudSprite)return;const th=cl.th+(reduced?0:t*.01),sn=Math.sin(th),cs=Math.cos(th);proj(cl.r*sn,cl.y,cl.r*cs);
 const wpx=cl.w*PK;if(PX<-wpx||PX>V.cx*2+wpx)return;const a=cl.a*(1-clamp((PD-(V.Dc+60))/200,0,1)*.2);
 c.globalAlpha=a;c.drawImage(cloudSprite,PX-wpx/2,PY-wpx*.2,wpx,wpx*.4);c.globalAlpha=1;
}
function drawGate(c,run,pal,cam,t,reduced,w,h){
 const C=run.course,th=thetaAt(C.L),y=groundY(C,C.L),sn=Math.sin(th),cs=Math.cos(th);
 proj(RC*sn,y,RC*cs);const gx=PX,gy=PY,k=PK;if(gx<-200||gx>w+200||gy<-300||gy>h+300)return;
 const near=clamp((run.distance-(C.L-240))/200,0,1),outro=run.outro?.kind==='clear'?clamp(run.outro.age/.6,0,1):run.state==='clear'?1:0,strength=.5+.4*near+.35*outro,tt=(reduced?.2:1)*run.clock;
 c.save();c.translate(gx,gy);
 const cur=[[-15,13,.62,'60,214,196',0],[-5,15,.78,'92,150,255',1.7],[6,14,.72,'160,104,246',3.1],[16,12,.6,'255,110,190',4.4]];
 if(!gateInk){gateInk=[0,1].map(pass=>cur.map(([,,,rgb])=>{const gg=c.createLinearGradient(0,0,0,-1);gg.addColorStop(0,'rgba(255,252,240,'+(pass?.5:.9)+')');gg.addColorStop(.08,'rgba('+rgb+','+(pass?.45:.85)+')');gg.addColorStop(.45,'rgba('+rgb+','+(pass?.12:.4)+')');gg.addColorStop(1,'rgba('+rgb+',0)');return gg}))}
 for(let pass=0;pass<2;pass++){
  c.globalCompositeOperation=pass?'lighter':'source-over';
  for(let i=0;i<cur.length;i++){
   const [x,wd,ht,,ph]=cur[i],H=GATE_H*k*(1.2+ht)*(1+outro*.35),X=x*k,Wd=wd*k;
   c.save();c.scale(1,H);c.fillStyle=gateInk[pass][i];c.globalAlpha=Math.min(1,strength*(.7+.2*Math.sin(tt*1.3+ph))*(pass?.7:1));
   c.beginPath();const m=10;
   for(let q=0;q<=m;q++){const u=q/m,sw=Math.sin(q*.5+tt*1.1+ph)*7*k*u,hf=Wd*.5*(1-.45*u);q?c.lineTo(X+sw-hf,-u):c.moveTo(X+sw-hf,0)}
   for(let q=m;q>=0;q--){const u=q/m,sw=Math.sin(q*.5+tt*1.1+ph)*7*k*u,hf=Wd*.5*(1-.45*u);c.lineTo(X+sw+hf,-u)}
   c.closePath();c.fill();c.restore();
  }
 }
 // arch of light
 c.globalCompositeOperation='source-over';c.globalAlpha=Math.min(1,strength+.2);c.lineCap='round';
 const aw=GATE_W*.5*k,ah=GATE_H*.74*k;
 c.beginPath();c.moveTo(-aw,0);c.lineTo(-aw,-ah*.55);c.quadraticCurveTo(-aw,-ah*1.25,0,-ah*1.25);c.quadraticCurveTo(aw,-ah*1.25,aw,-ah*.55);c.lineTo(aw,0);
 c.strokeStyle='rgba(120,230,230,.55)';c.lineWidth=Math.max(3,k*6.5);c.stroke();c.strokeStyle='rgba(255,250,236,.95)';c.lineWidth=Math.max(1.5,k*2.6);c.stroke();
 c.globalCompositeOperation='lighter';
 const gl=glow('190,240,255');if(gl){c.globalAlpha=Math.min(.4,strength*.45);const s=k*84;c.drawImage(gl,-s/2,-s*.72,s,s)}
 c.restore();
}
function drawRunner(c,run,pal,cam,t,reduced){
 const C=run.course;let s=run.distance,lift=run.height,spin=0;
 const since=run.clock-run.poseAt;
 if(run.pose==='hurt'){const u=reduced?1:clamp((since-HIT_STOP)/.55,0,1),e=1-Math.pow(1-u,3);s-=e*(reduced?3:11);lift=Math.max(lift*(1-e),reduced?0:Math.sin(Math.PI*u)*13);spin=-(reduced?.3:1.35)*e}
 const th=thetaAt(s),y=groundY(C,s),sn=Math.sin(th),cs=Math.cos(th);
 proj(RC*sn,y,RC*cs);const fx=PX,fy=PY,k=PK;
 // ahead point for the slope tilt
 const th2=thetaAt(s+8),y2=groundY(C,s+8);proj(RC*Math.sin(th2),y2,RC*Math.cos(th2));let ang=Math.atan2(PY-fy,PX-fx);if(!(ang===ang))ang=0;ang=clamp(ang,-.5,.5);
 let alpha=1;if(run.outro?.kind==='clear')alpha=1-clamp((run.outro.age-.15)/.8,0,1);if(run.state==='clear'&&run.chain&&run.chain.last===false)alpha=1;
 c.save();c.translate(fx,fy);c.scale(1,.36);c.globalAlpha=.4*alpha*(1-Math.min(.6,lift/50));c.fillStyle='rgba(36,18,60,.85)';c.beginPath();c.arc(0,0,k*8.4,0,TAU);c.fill();c.restore();
 c.globalAlpha=alpha;
 const body=RUN_H*k;run.view.body=body;run.view.actor={x:fx,y:fy-body*.55};
 const pose=run.pose||(run.intro>0||run.state==='ready'?'stand':run.flight!==null?'jump':'run');
 const q={x:fx,y:fy-lift*k-1,bodyHeight:body,renderAngle:ang*.8+spin,strideDistance:run.distance,nativeState:0,height:lift*k,jumpProgress:run.flight===null?0:run.flight/FLIGHT,pose,poseAt:run.poseAt};
 const M=root.MongyuMobile;if(M?.sprite)M.sprite(c,q,{poseTime:run.clock,onDark:true},reduced);
 c.globalAlpha=1;
}
function drawParticles(c,run,pal,reduced){
 c.save();c.globalCompositeOperation='lighter';
 for(const p of run.fx){
  if(!p.on||p.age<0)continue;proj(p.x,p.y,p.z);const u=p.age/p.life,a=(1-u)*(1-u),k=PK*p.size*(p.kind===1?1.1:1),sz=Math.max(1,k*(1-u*.4));
  if(p.kind===1){c.globalAlpha=Math.min(1,a*1.4);c.fillStyle=p.size>3?'#ffc2a8':'#ff8f78';const a2=p.age*9+p.size;c.beginPath();c.moveTo(PX+Math.cos(a2)*sz*1.5,PY+Math.sin(a2)*sz*1.5);c.lineTo(PX+Math.cos(a2+2.2)*sz,PY+Math.sin(a2+2.2)*sz);c.lineTo(PX+Math.cos(a2+4.1)*sz,PY+Math.sin(a2+4.1)*sz);c.closePath();c.fill()}
  else if(p.kind===2){c.globalAlpha=a*.35;c.fillStyle='#fff2e0';c.beginPath();c.arc(PX,PY,sz*(1+u*1.4),0,TAU);c.fill()}
  else{c.globalAlpha=a;c.fillStyle=p.kind===3?'#d8fff0':'#ffe9a0';c.beginPath();c.moveTo(PX,PY-sz*1.6);c.lineTo(PX+sz*.8,PY);c.lineTo(PX,PY+sz*1.6);c.lineTo(PX-sz*.8,PY);c.closePath();c.fill()}
 }
 c.restore();
}
function drawMotes(c,w,h,pal,cam,t,reduced){
 c.save();c.globalCompositeOperation='lighter';c.fillStyle=pal.sunA(.9);
 const nM=reduced?14:30;
 for(let i=0;i<nM;i++){
  const hx=((i*0.6180339)%1),hy=((i*0.7548776+.13)%1),par=.4+hx*.6,x=((hx*w*1.6-cam.phi*w*.09*par-t*(reduced?3:9)*par)%(w*1.6)+w*1.6)%(w*1.6)-w*.3,y=((hy*h+Math.sin(t*.5+i)*14-t*(reduced?2:6)*par)%h+h)%h;
  c.globalAlpha=(.16+.3*par)*(reduced?.8:.6+.4*Math.sin(t*1.7+i*2.1));c.fillRect(x,y,1.2+par*1.6,1.2+par*1.6);
 }
 c.restore();
}
function drawSpeedLines(c,w,h,run,cam,t,reduced,cp){
 const u=cp.u;if(reduced||u<.12)return;
 proj(RC*Math.sin(thetaAt(run.distance+run.speed*.8)),groundY(run.course,run.distance+run.speed*.8)+8,RC*Math.cos(thetaAt(run.distance+run.speed*.8)));
 const fx=clamp(PX,w*.3,w*.9),fy=clamp(PY,h*.25,h*.75);
 c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
 for(let i=0;i<24;i++){
  const a=(i*2.399+.7)%TAU,ph=(i*.37+t*(1.4+u*1.2))%1,r0=(.18+ph*.9)*Math.max(w,h)*.5,len=(18+u*70)*(.4+ph),r1=r0+len;
  const x0=fx+Math.cos(a)*r0*.9,y0=fy+Math.sin(a)*r0*1.1,x1=fx+Math.cos(a)*r1*.9,y1=fy+Math.sin(a)*r1*1.1;
  if((x0<-30&&x1<-30)||(x0>w+30&&x1>w+30)||(y0<-30&&y1<-30)||(y0>h+30&&y1>h+30))continue;
  c.globalAlpha=Math.min(.34,u*.45)*Math.sin(ph*Math.PI);c.strokeStyle='#fff6e8';c.lineWidth=1+u*1.4*(.4+ph);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();
 }
 c.restore();
}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function hud(c,run,w,h,reduced){
 if(run.state==='fail'||run.state==='clear')return;
 const fade=run.outro?1-Math.min(1,run.outro.age/.35):1;if(fade<=0)return;
 c.save();c.globalAlpha=fade;c.textAlign='center';const top=Math.max(14,h*.035),C=run.course;
 c.font='600 11px system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(20,12,36,.6)';c.strokeText(VARIANTS[run.variant].name,w/2,top+10);c.fillStyle='rgba(255,243,226,.85)';c.fillText(VARIANTS[run.variant].name,w/2,top+10);
 c.font='800 40px system-ui,sans-serif';c.lineWidth=5;c.strokeStyle='rgba(20,12,36,.55)';c.strokeText(String(run.score),w/2,top+52);c.fillStyle='#fff3d6';c.fillText(String(run.score),w/2,top+52);
 if(run.perfectStreak>=2){c.font='800 14px system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(20,12,36,.55)';const txt='완벽 ×'+run.perfectStreak;c.strokeText(txt,w/2,top+72);c.fillStyle='#ffe39a';c.fillText(txt,w/2,top+72)}
 const coach=run.coach&&run.time<run.coach.until&&run.intro<=0?run.coach.text:'';
 if(coach&&run.state==='play'){c.font='700 16px system-ui,sans-serif';const mw=c.measureText(coach),tw=Math.min(w-48,((mw&&mw.width)||coach.length*16)+36),y=h*.8;rr(c,w/2-tw/2,y-19,tw,38,19);c.fillStyle='rgba(26,19,48,.66)';c.fill();c.strokeStyle='rgba(255,236,255,.16)';c.lineWidth=1;c.stroke();c.fillStyle='#fbf4ff';c.fillText(coach,w/2,y+6)}
 const gy=h*.9,gw=Math.min(w*.7,320),x0=w/2-gw/2,frac=run.distance/C.L;
 rr(c,x0,gy,gw,6,3);c.fillStyle='rgba(255,255,255,.14)';c.fill();rr(c,x0,gy,Math.max(6,gw*frac),6,3);c.fillStyle='#bfe9ff';c.fill();
 for(let i=0;i<C.obstacles.length;i++){const x=x0+gw*C.obstacles[i].at/C.L;c.save();c.translate(x,gy+3);c.rotate(Math.PI/4);c.fillStyle=i<run.index?'#ffd98a':'rgba(255,255,255,.4)';c.fillRect(-2.8,-2.8,5.6,5.6);c.restore()}
 c.restore();
}
function drawPopups(c,run,cam,reduced){
 for(const p of run.popups){
  if(!p.on)continue;const age=run.clock-p.at;if(age>1.1){p.on=false;continue}
  const u=age/1.1,a=u<.1?u/.1:u>.65?(1-u)/.35:1,rise=reduced?0:smooth(u*1.25)*34,pop=reduced?1:age<.12?.7+.4*age/.12:age<.22?1.1-.1*(age-.12)/.1:1;
  const ax=(run.view.actor?.x||0),ay=(run.view.actor?.y||0)-RUN_H*PK*.75-rise;
  c.save();c.translate(ax,ay);c.scale(pop,pop);c.textAlign='center';c.textBaseline='middle';c.font=(p.perfect?'800 20px':'700 15px')+' system-ui,sans-serif';
  c.globalAlpha=a*.55;c.fillStyle='rgba(28,16,44,.9)';c.fillText(p.text,.8,1.6);c.globalAlpha=a;c.fillStyle=p.perfect?'#ffe39a':'#fff4e2';c.fillText(p.text,0,0);c.restore();
 }
}
function draw(c,run,opts){
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,C=run.course;
 const cam=updateCam(run,w,h,reduced);cam.w=w;
 const fogK=run.variant==='down'?1+.45*cam.cp.u*(reduced?0:1):1,progress=cam.cp.p;
 const pal=paletteFor(run.variant,run.variant==='up'?progress:progress,Math.round(fogK*10)/10);
 if(cloudKey!==pal.cloudKey||(!cloudSprite&&cloudKey===-2)){cloudKey=pal.cloudKey;cloudSprite=makeCloud(pal)}
 const g=cam.g,yh=V.cy-V.F*Math.tan(cam.pitch);
 c.save();
 drawSky(c,w,h,pal,cam,t,reduced,run,yh);
 // visible sample range
 const jr=Math.round((run.distance+PRE)/DS),back=Math.round(PER_TURN*.8),fwd=Math.round(PER_TURN*(run.variant==='up'?1.3:1.5)),j0=Math.max(0,jr-back),j1=Math.min(g.n-1,jr+fwd);
 const phi=cam.phi,cp=V.cp,sp=V.sp,Dc=V.Dc;
 for(let j=j0;j<=j1;j++){
  const sn=g.sn[j],cs=g.cs[j],y=g.y[j],o=j*5,x1=R0*sn,z1=R0*cs,x2=R1*sn,z2=R1*cs;
  proj(x1,y,z1);SX[o]=PX;SY[o]=PY;proj(x2,y,z2);SX[o+1]=PX;SY[o+1]=PY;SD[j]=PD;proj(x2,y-THICK,z2);SX[o+2]=PX;SY[o+2]=PY;proj(x1,y-THICK,z1);SX[o+3]=PX;SY[o+3]=PY;proj((R1-1.2)*sn,y+RAIL,(R1-1.2)*cs);SX[o+4]=PX;SY[o+4]=PY;
 }
 // sorted list
 let m=0;
 const depthKey=(r,th,bias)=>{const a=wrap(th-phi);return Dc-r*Math.cos(a)-bias};
 for(let j=j0;j<j1;j++){KIND[m]=0;IDS[m]=j;KEYS_I[m]=depthKey(RC,g.th[j]+DTH*.5,0);m++}
 const eb=(th)=>{const a=wrap(th-phi);return .6*DS*Math.abs(Math.sin(a))+.6};
 const sMin=run.distance-PER_TURN*.8*DS,sMax=run.distance+PER_TURN*1.5*DS;
 for(let i=0;i<C.obstacles.length&&m<MAXI-8;i++){const ob=C.obstacles[i];if(ob.at<sMin||ob.at>sMax)continue;const th=thetaAt(ob.at);KIND[m]=1;IDS[m]=i;KEYS_I[m]=depthKey(RC,th,eb(th));m++}
 for(let i=0;i<C.shards.length&&m<MAXI-8;i++){if(run.shardGot[i])continue;const sh=C.shards[i];if(sh.at<sMin||sh.at>sMax)continue;const th=thetaAt(sh.at);KIND[m]=2;IDS[m]=i;KEYS_I[m]=depthKey(RC,th,eb(th));m++}
 if(cloudSprite)for(let i=0;i<g.clouds.length&&m<MAXI-8;i++){const cl=g.clouds[i];if(Math.abs(cl.y-V.yc)>340)continue;KIND[m]=3;IDS[m]=i;KEYS_I[m]=depthKey(cl.r,cl.th+(reduced?0:t*.01),0);m++}
 const thR=thetaAt(Math.min(C.L,run.distance)),keyR=depthKey(RC,thR,eb(thR)-.1);
 {const L=C.L;if(L>=sMin&&L<=sMax+DS*20){const th=thetaAt(L),kg=depthKey(RC,th,eb(th)+.2);KIND[m]=4;IDS[m]=0;KEYS_I[m]=C.L-run.distance<90?Math.max(kg,keyR+.5):kg;m++}}
 KIND[m]=5;IDS[m]=0;KEYS_I[m]=keyR;m++;
 KIND[m]=6;IDS[m]=0;KEYS_I[m]=Dc;m++;
 for(let i=0;i<m;i++)ORDER[i]=i;
 ORDER.subarray(0,m).sort((a,b)=>KEYS_I[b]-KEYS_I[a]);
 for(let q=0;q<m;q++){
  const i=ORDER[q],id=IDS[i];
  switch(KIND[i]){
   case 0:drawSegment(c,id,pal,cam,h);break;
   case 1:drawCrystal(c,run,C.obstacles[id],id,pal,cam,t,reduced);break;
   case 2:drawShard(c,run,C.shards[id],id,pal,t,reduced);break;
   case 3:drawCloud(c,g.clouds[id],pal,cam,t,reduced);break;
   case 4:drawGate(c,run,pal,cam,t,reduced,w,h);break;
   case 5:drawRunner(c,run,pal,cam,t,reduced);break;
   case 6:drawTower(c,w,h,pal,cam,run,reduced);break;
  }
 }
 drawParticles(c,run,pal,reduced);
 drawMotes(c,w,h,pal,cam,t,reduced);
 if(run.variant==='down')drawSpeedLines(c,w,h,run,cam,t,reduced,cam.cp);
 // clear bloom
 const bloom=run.outro?.kind==='clear'?clamp(run.outro.age/CLEAR_OUTRO,0,1):run.state==='clear'?1:0;
 if(bloom>0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.13*Math.sin(Math.min(1,bloom*1.4)*Math.PI/2)*(reduced?.6:1);c.fillStyle=pal.fogCss;c.fillRect(0,0,w,h);c.restore()}
 c.restore();
 drawPopups(c,run,cam,reduced);
 if(run.options.hud!==false&&opts.hud!==false)hud(c,run,w,h,reduced);
 return null;
}
const api=Object.freeze({enabled,HelixRun,VARIANTS,buildCourse,speedProfile,thetaAt,groundY,geometry,paletteFor,draw,reachFor,TUNING:Object.freeze({REACH_T,RT,R0,R1,RC,THICK,PITCH,SLOPE,PER_TURN,RUN_H,FLIGHT,PEAK,OB_H,OB_HALF,FOOT,INTRO,LOOK_UP,HIT_STOP,PERFECT_WINDOW}),COACH});
root.MongyuHelix=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
