/* R104 endless dream mode (procedural Nom-style run) and daily challenge. Owned by workstream I.
   The runner loops floor -> wall -> ceiling -> wall inside a rotating square room (놈3의 사각형).
   Obstacles come from a seeded RNG (same seed = same course), difficulty rises every lap, one life.
   Run API mirrors OpeningRun (start/pause/resume/action/tick/drainEvents/status/retry/setViewport) and
   adds drawSelf(ctx,opts) so app.js can dispatch drawing without knowing the mode. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const L=300,R=40,ARC=Math.PI*R/2,SIDE=L+ARC,LAP=4*SIDE,T=30;
const CENTER={x:L/2,y:-(L/2+R)};
const FLIGHT=.62,PEAK=46,FOOT=4,BUFFER=.09,HIT_STOP=.12,FAIL_OUTRO=.8,START_SPEED=120,MAX_SPEED=205,LAP_SPEED=9;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const TAU=Math.PI*2;
/* Chapter palettes: sky (top,bottom) + architecture three tones (top face, side, shadow) + mist. Low-saturation backgrounds. */
const PALETTES=[
 {name:'새벽 계단',sky:['#211a3d','#4e3a66'],arch:['#f6dcea','#b48bb8','#4f3768'],mist:'#c9a6d8'},
 {name:'달빛 수로',sky:['#101f36','#2c4a6a'],arch:['#dcf0f6','#86abc6','#33506f'],mist:'#9cc7e0'},
 {name:'사각 정원',sky:['#112a2b','#2b5250'],arch:['#e2f3e0','#8fbfa8','#36615a'],mist:'#a9d8c4'},
 {name:'거꾸로 된 성',sky:['#26142c','#5c3049'],arch:['#ffe3d9','#d39ca8','#6c3c58'],mist:'#e2a9bd'},
 {name:'심장의 시계탑',sky:['#1f1714','#4e3a29'],arch:['#ffefd2','#d2aa7a','#6a4b30'],mist:'#e3c08f'}
].map(Object.freeze);
/* Meaning colours. CVD mode (html[data-cvd=on]) swaps coral danger for a blue-violet that stays distinct from gold. */
const INK={danger:'#ff8a73',dangerTop:'#ffb59f',dangerSide:'#c75a55',dangerLine:'#ffe1c8',tap:'#ffeca5',tapDeep:'#ffd98a'};
const INK_CVD={danger:'#7f8cff',dangerTop:'#b5bcff',dangerSide:'#4b55c4',dangerLine:'#eef0ff',tap:'#ffe14d',tapDeep:'#ffc928'};
function ink(){try{const d=root.document?.documentElement;return d&&d.dataset&&d.dataset.cvd==='on'?INK_CVD:INK}catch(_){return INK}}
/* R105 dark look for the square act: a MongyuTrip palette turned into the room palette, meaning colours (neon) and a beat pulse (<= +-5%). Pure data, cached per key. */
const themes=new Map();
function tripTheme(key){
 let t=themes.get(key||'violet');if(t)return t;
 const T=root.MongyuTrip,P=T?.get?.(key||'violet');if(!P)return null;
 const mixc=(a,b,k)=>T.mix(a,b,k);
 const palette={name:P.name,sky:[P.sky[0],P.sky[2]],arch:[P.block[0],P.block[1],P.block[2]],mist:P.fog};
 const inkN={danger:P.danger,dangerTop:mixc(P.danger,'#ffffff',.45),dangerSide:mixc(P.danger,'#000000',.5),dangerLine:'#f4ffff',tap:P.gold,tapDeep:mixc(P.gold,P.glow,.35)};
 const lum=c=>{const n=parseInt(String(c).slice(1,7),16)||0;return (.2126*(n>>16&255)+.7152*(n>>8&255)+.0722*(n&255))/255},light=lum(P.sky[1])>.5;
 t=Object.freeze({key:key||'violet',P,light,mode:light?'source-over':'lighter',palette,ink:inkN,rim:P.rim,rim2:P.rim2,glow:P.glow,accent:P.accent});themes.set(key||'violet',t);return t;
}

/* ---------- deterministic RNG and date seeds ---------- */
function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function hash(text){let h=2166136261>>>0;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0}return h>>>0}
const pad=n=>String(n).padStart(2,'0');
function dayKey(date=new Date()){return date.getFullYear()+'-'+pad(date.getMonth()+1)+'-'+pad(date.getDate())}
function weekKey(date=new Date()){
 const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day+3);
 const first=new Date(d.getFullYear(),0,4);const week=1+Math.round(((d-first)/864e5-3+((first.getDay()+6)%7))/7);
 return d.getFullYear()+'-W'+pad(week);
}
function dailySeed(date=new Date()){return hash('mongyu-daily:'+dayKey(date))}

/* ---------- geometry: rounded square loop, arc length s ---------- */
function rotate(p,k){
 let x=p.x-CENTER.x,y=p.y-CENTER.y;
 for(let i=0;i<k;i++){const nx=y,ny=-x;x=nx;y=ny}
 return {x:CENTER.x+x,y:CENTER.y+y,a:p.a-k*Math.PI/2};
}
function surface(s){
 const lap=Math.floor(s/LAP),u=s-lap*LAP,k=Math.min(3,Math.floor(u/SIDE)),v=u-k*SIDE;
 let p;
 if(v<=L)p={x:v,y:0,a:0};
 else{const phi=(v-L)/R;p={x:L+R*Math.sin(phi),y:R*(Math.cos(phi)-1),a:-phi}}
 const q=rotate(p,k);q.a-=lap*TAU;return q;
}
function offset(p,h){return {x:p.x+Math.sin(p.a)*h,y:p.y-Math.cos(p.a)*h}}
function sideOf(s){const u=((s%LAP)+LAP)%LAP;return Math.min(3,Math.floor(u/SIDE))}
function inCorner(s){const u=((s%LAP)+LAP)%LAP;return u-sideOf(s)*SIDE>L}

/* ---------- procedural course ---------- */
const TYPES={low:{w:11,h:14},mid:{w:12,h:20},tall:{w:10,h:26}};
function speedFor(lap){return Math.min(MAX_SPEED,START_SPEED+LAP_SPEED*lap)}
function difficulty(lap){return clamp(lap/6,0,1)}
/* Generates the obstacles of one straight side (index = lap*4+side). Pure function of (seed, index). */
/* opt (R105 square act): lapBase raises the difficulty/speed as if lapBase laps were already run, beat (bpm) snaps every hazard to the half-beat grid (gaps only grow), calm widens the gaps. */
function generateSide(seed,index,opt){
 const lapBase=opt?.lapBase|0,lap=Math.floor(index/4)+lapBase,side=index%4,r=rng(seed^Math.imul(index+1,0x9E3779B1)),d=difficulty(lap),speed=Math.min(opt?.maxSpeed||MAX_SPEED,speedFor(lap));
 const base=index*SIDE,out=[],step=opt?.beat>0?speed*30/opt.beat:0,calm=opt?.calm>0?opt.calm:1;
 const minGap=speed*(FLIGHT+.16)*calm,slack=speed*(.62-.34*d)*calm;
 let v=index===0?175:46+r()*28;
 const end=L-44;
 while(v<=end){
  if(step>0)v=Math.ceil((base+v)/step-1e-9)*step-base;
  if(v>end)break;
  const roll=r();let o;
  if(lap>=1&&roll<.14+.1*d){const len=Math.round(32+r()*(10+10*d));if(v+len>end)break;o={kind:'pit',at:base+v+len/2,start:base+v,end:base+v+len,len};v+=len}
  else if(lap>=2&&roll<.27+.12*d){o={kind:'double',at:base+v+13,parts:[base+v,base+v+26],w:11,h:14};v+=26}
  else{const tall=lap>=3&&r()<.18+.25*d,mid=!tall&&r()<.3+.3*d,t=tall?'tall':mid?'mid':'low';o={kind:t,at:base+v,w:TYPES[t].w,h:TYPES[t].h}}
  o.shard=r()<.42;o.side=side;o.lap=lap;out.push(o);
  v+=minGap+r()*slack;
 }
 return out;
}

/* ---------- records (pure; storage injected) ---------- */
const RECORD_KEY='mongyu.r104.dream';
function readRecords(store){try{const raw=store?.getItem(RECORD_KEY);const data=raw?JSON.parse(raw):null;if(data&&data.v===1)return data}catch(_){}return {v:1,best:0,days:{},weeks:{}}}
function recordRun(store,entry,now=new Date()){
 const data=readRecords(store),day=dayKey(now),week=weekKey(now),score=Math.max(0,Math.floor(entry.score||0));
 const out={score,newBest:false,dayBest:0,best:data.best,week:[],saved:false};
 if(entry.daily){
  const prev=data.days[day]||{best:0,tries:0};const next={best:Math.max(prev.best,score),tries:prev.tries+1};
  out.newBest=score>prev.best&&prev.tries>0;out.firstTry=prev.tries===0;data.days[day]=next;out.dayBest=next.best;
  const list=(data.weeks[week]||[]).filter(e=>e.day!==day);list.push({day,score:next.best});list.sort((a,b)=>b.score-a.score||(a.day<b.day?-1:1));data.weeks[week]=list.slice(0,7);
 }else{
  out.newBest=score>data.best&&data.best>0;data.best=Math.max(data.best,score);out.best=data.best;
  const list=(data.weeks[week+':endless']||[]).slice();list.push({day,score});list.sort((a,b)=>b.score-a.score);data.weeks[week+':endless']=list.slice(0,5);
 }
 // Keep two weeks of history at most.
 const keepDays=Object.keys(data.days).sort().slice(-14);data.days=Object.fromEntries(keepDays.map(k=>[k,data.days[k]]));
 const keepWeeks=[...new Set(Object.keys(data.weeks).map(k=>k.split(':')[0]))].sort().slice(-2);
 data.weeks=Object.fromEntries(Object.entries(data.weeks).filter(([k])=>keepWeeks.includes(k.split(':')[0])));
 out.week=entry.daily?data.weeks[week]||[]:data.weeks[week+':endless']||[];out.best=data.best;
 try{store.setItem(RECORD_KEY,JSON.stringify(data));out.saved=true}catch(_){out.saved=false}
 return out;
}
function summary(store,now=new Date()){const data=readRecords(store),day=dayKey(now),week=weekKey(now);return {best:data.best,today:data.days[day]||null,daily:data.weeks[week]||[],endless:data.weeks[week+':endless']||[],day,week}}

/* ---------- run ---------- */
const COACH={start:'탭하여 점프',lap:'한 바퀴! 조금 더 빨라져',perfect:'완벽!',pit:'틈은 뛰어넘어',double:'둘을 한 번에',tall:'높은 블록은 바로 앞에서'};
class EndlessRun{
 constructor(options={}){
  this.options=options;this.mode='dream';this.dreamMode=options.daily?'daily':'endless';this.daily=!!options.daily;
  this.openingCourse=false;this.polish=true;this.settings={...(options.settings||{})};
  this.date=options.date instanceof Date?options.date:new Date();
  this.seed=(options.seed??(this.daily?dailySeed(this.date):(Date.now()^Math.floor(Math.random()*4294967296))))>>>0;
  this.attempt=options.attempt||1;this.lapBase=options.lapBase|0;this.beatBpm=options.beatBpm>0?options.beatBpm:0;this.maxSpeed=options.maxSpeed||MAX_SPEED;this.calm=options.calm>0?options.calm:1;this.setViewport(options.viewport?.width,options.viewport?.height);this.reset();
 }
 reset(){
  this.state='ready';this.time=0;this.clock=0;this.updates=0;this.inputCount=0;this.jumps=0;this.hits=0;this.hearts=1;
  this.distance=0;this.height=0;this.flight=null;this.buffer=0;this.lastJump=-Infinity;this.events=[];
  this.obstacles=[];this.generated=0;this.index=0;this.clears=0;this.shards=0;this.perfects=0;this.perfectStreak=0;this.bestStreak=0;
  this.perfectPoints=0;this.score=0;this.lap=0;this.side=0;this.crash=null;this.hitStop=0;this.outro=null;this.result=null;
  this.coach={kind:'start',text:COACH.start,until:3};this.seen=new Set();this.crossedAt=-10;this.pickedAt=-10;this.fx=[];
  this.fl=FLIGHT;this.pkH=PEAK;this.shardReach=12;
  this.ensure();
 }
 setViewport(width=390,height=844){this.viewport={width,height}}
 get speed(){return Math.min(this.maxSpeed,speedFor(Math.floor(this.distance/LAP)+this.lapBase))}
 /* Hooks for wrappers (the square act): time scale, jump length and height, hit absorption. Defaults leave the endless modes unchanged. */
 pace(dt){return dt}
 flightTime(){return FLIGHT}
 peakHeight(){return PEAK}
 absorb(o){return false}
 genOpt(){return this.lapBase||this.beatBpm||this.calm!==1||this.maxSpeed!==MAX_SPEED?{lapBase:this.lapBase,beat:this.beatBpm,maxSpeed:this.maxSpeed,calm:this.calm}:undefined}
 ensure(){
  while(this.generated*SIDE<this.distance+2.2*SIDE){this.obstacles.push(...generateSide(this.seed,this.generated,this.genOpt()));this.generated++}
  // Drop obstacles far behind so long runs stay bounded.
  let drop=0;while(drop<this.index&&this.obstacles[drop].at<this.distance-500)drop++;
  if(drop>32){this.obstacles.splice(0,drop);this.index-=drop}
 }
 start(){if(this.state!=='ready')return false;this.state='play';this.events.push('start');return true}
 pause(){if(this.state!=='play')return false;this.state='pause';this.cancelInput();this.events.push('pause');return true}
 resume(){if(this.state!=='pause')return false;this.state='play';return true}
 retry(){const keep=this.daily?this.seed:(this.seed*1664525+1013904223)>>>0;this.attempt++;this.seed=keep;this.reset();this.state='play';this.events.push('start');return true}
 inputDown(){return this.action()}
 inputUp(){}
 cancelInput(){this.buffer=0}
 action(){
  if(this.state!=='play'||this.outro||this.hitStop>0)return false;
  this.inputCount++;
  if(this.flight!==null){if(this.flight>=this.fl-BUFFER)this.buffer=BUFFER;return false}
  return this.jump();
 }
 jump(){this.fl=this.flightTime();this.pkH=this.peakHeight();this.flight=0;this.lastJump=this.distance;this.jumps++;this.buffer=0;this.events.push('jump');return true}
 drainEvents(){return this.events.splice(0)}
 setCoach(kind,hold,text){this.coach={kind,text:text||COACH[kind],until:this.time+hold}}
 tick(dt){
  if(this.state!=='play')return;
  this.updates++;this.clock+=dt;
  if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);return}
  if(this.outro){this.outro.age+=dt;if(this.outro.age>=this.outro.duration)this.finish('fail');return}
  this.time+=dt;
  const speed=this.speed,sdt=this.pace(dt);
  this.distance+=speed*sdt;this.ensure();
  this.buffer=Math.max(0,this.buffer-dt);
  if(this.flight!==null){
   this.flight+=sdt;const phase=Math.min(1,this.flight/this.fl);this.height=4*this.pkH*phase*(1-phase);
   if(phase===1){this.flight=null;this.height=0;this.events.push('land');if(this.buffer>0)this.jump()}
  }
  const lap=Math.floor(this.distance/LAP),side=sideOf(this.distance);
  if(side!==this.side||lap!==this.lap){
   if(lap!==this.lap){this.lap=lap;this.events.push('portal');this.setCoach('lap',1.6,(lap+1)+'바퀴 · '+PALETTES[lap%PALETTES.length].name)}
   else this.events.push('corner');
   this.side=side;
  }
  const o=this.obstacles[this.index];
  if(o){
   if(!this.seen.has(o.kind)&&o.at-this.distance<speed*1.1&&COACH[o.kind]&&this.lap>0){this.seen.add(o.kind);this.setCoach(o.kind,1.2)}
   if(this.collide(o)){if(this.absorb(o))o.absorbed=true;else{this.crashAt(o);return}}
   if(this.distance>this.passPoint(o)){
    this.index++;this.clears++;this.crossedAt=this.time;
    const lead=o.at-this.lastJump,ideal=speed*this.fl/2,perfect=!o.absorbed&&this.lastJump>o.at-speed*this.fl&&Math.abs(lead-ideal)<=10*speed/START_SPEED;
    if(perfect){this.perfects++;this.perfectStreak++;this.bestStreak=Math.max(this.bestStreak,this.perfectStreak);this.perfectPoints+=20*Math.min(5,this.perfectStreak);if(this.perfectStreak===1)this.setCoach('perfect',.6)}
    else this.perfectStreak=0;
    this.events.push(perfect?'perfect':'pass');
   }
   if(o.shard&&!o.picked&&Math.abs(this.distance-o.at)<this.shardReach&&this.height>=this.pkH-16){o.picked=true;this.shards++;this.pickedAt=this.time}
  }
  this.score=Math.floor(this.distance/10)+this.clears*10+this.perfectPoints+this.shards*25;
 }
 passPoint(o){return o.kind==='pit'?o.end:o.kind==='double'?o.parts[1]+o.w+FOOT:o.at+o.w+FOOT}
 collide(o){
  const s=this.distance;if(o.absorbed)return false;
  if(o.kind==='pit')return this.flight===null&&s>o.start+3&&s<o.end-3;
  const parts=o.kind==='double'?o.parts:[o.at];
  for(const at of parts)if(Math.abs(s-at)<=o.w+FOOT&&this.height<o.h)return true;
  return false;
 }
 crashAt(o){
  this.hits++;this.hearts=0;this.perfectStreak=0;
  this.crash={kind:o.kind,at:this.distance,lap:this.lap,height:this.height,fall:o.kind==='pit'};
  this.events.push('hit');
  const reduced=reducedMotion();
  this.hitStop=reduced?0:HIT_STOP;this.outro={kind:'fail',age:0,duration:FAIL_OUTRO};
  this.setCoach('crash',2,o.kind==='pit'?'틈에 빠졌어':this.distance<o.at?'한 박자 늦었어':'조금 일찍 눌렀어');
 }
 finish(state){
  this.state=state;this.outro=null;
  this.result={mode:this.dreamMode,state,daily:this.daily,seed:this.seed,score:this.score,distance:Math.floor(this.distance),meters:Math.floor(this.distance/10),
   clears:this.clears,perfects:this.perfects,bestStreak:this.bestStreak,shards:this.shards,laps:this.lap,time:this.time,attempt:this.attempt,
   reason:this.crash?.fall?'틈에 빠졌어요':'블록에 부딪혔어요'};
  this.events.push(state);
 }
 status(){
  const palette=PALETTES[this.lap%PALETTES.length];
  return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:this.score,best:0,
   progress:((this.distance%LAP)/LAP),roomTitle:(this.daily?'오늘의 도전':'무한 꿈')+' · '+palette.name,roomIndex:this.lap,roomCount:this.lap+1,
   instruction:'탭하여 점프',cue:null,result:this.result};
 }
 drawSelf(ctx,opts){return draw(ctx,this,opts)}
}
function reducedMotion(){try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}}

/* ---------- art ---------- */
function roundedRect(path,x,y,w,h,r){path.moveTo(x+r,y);path.lineTo(x+w-r,y);path.arcTo(x+w,y,x+w,y+r,r);path.lineTo(x+w,y+h-r);path.arcTo(x+w,y+h,x+w-r,y+h,r);path.lineTo(x+r,y+h);path.arcTo(x,y+h,x,y+h-r,r);path.lineTo(x,y+r);path.arcTo(x,y,x+r,y,r);path.closePath()}
let roomPaths=null;
function room(){
 if(roomPaths||typeof Path2D==='undefined')return roomPaths;
 const top=-(L+2*R),inner=new Path2D(),outer=new Path2D(),ring=new Path2D(),lip=new Path2D(),deep=new Path2D();
 roundedRect(inner,-R,top,L+2*R,L+2*R,R);
 roundedRect(outer,-R-T,top-T,L+2*R+2*T,L+2*R+2*T,R+T);
 roundedRect(ring,-R-T,top-T,L+2*R+2*T,L+2*R+2*T,R+T);roundedRect(ring,-R,top,L+2*R,L+2*R,R);
 roundedRect(lip,-R-5,top-5,L+2*R+10,L+2*R+10,R+5);roundedRect(lip,-R,top,L+2*R,L+2*R,R);
 const mass=new Path2D(),T2=T+30;roundedRect(mass,-R-T2,top-T2,L+2*R+2*T2,L+2*R+2*T2,R+T2);roundedRect(mass,-R-T,top-T,L+2*R+2*T,L+2*R+2*T,R+T);
 const k=.74,cx=CENTER.x,cy=CENTER.y,hw=(L/2+R)*k;roundedRect(deep,cx-hw,cy-hw,hw*2,hw*2,R*k);
 // Windows along the thick wall: small arched slots on every side, positioned in side-0 coordinates then rotated.
 const windows=new Path2D(),rails=new Path2D(),lower=new Path2D();
 for(let k2=0;k2<4;k2++)for(let i=0;i<6;i++){
  const x=30+i*48,a=rotate({x,y:T*.62,a:0},k2),b=rotate({x:x+12,y:T*.62,a:0},k2),c=rotate({x:x+12,y:T*.2,a:0},k2),d=rotate({x,y:T*.2,a:0},k2);
  windows.moveTo(a.x,a.y);windows.lineTo(b.x,b.y);windows.lineTo(c.x,c.y);windows.lineTo(d.x,d.y);windows.closePath();
  const p=rotate({x:x+6,y:0,a:0},k2),q=rotate({x:x+6,y:-7,a:0},k2);rails.moveTo(p.x,p.y);rails.lineTo(q.x,q.y);
  if(i%2===0){const e=rotate({x:x+20,y:T+12,a:0},k2),f=rotate({x:x+28,y:T+12,a:0},k2),g=rotate({x:x+28,y:T+22,a:0},k2),h=rotate({x:x+20,y:T+22,a:0},k2);lower.moveTo(e.x,e.y);lower.lineTo(f.x,f.y);lower.lineTo(g.x,g.y);lower.lineTo(h.x,h.y);lower.closePath()}
 }
 const rail=new Path2D();roundedRect(rail,-R+7,top+7,L+2*R-14,L+2*R-14,R-7);
 const moon=new Path2D();moon.arc(CENTER.x,CENTER.y,62,0,TAU);const moonRing=new Path2D();moonRing.arc(CENTER.x,CENTER.y,74,0,TAU);
 roomPaths={inner,outer,ring,lip,deep,windows,rails,rail,mass,lower,moon,moonRing,corners:[[-R,0],[L+R,0],[L+R,top],[-R,top]],deepCorners:[[cx-hw,cy+hw],[cx+hw,cy+hw],[cx+hw,cy-hw],[cx-hw,cy-hw]]};
 return roomPaths;
}
function mix(a,b,t){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16);const r=(pa>>16)+(((pb>>16)-(pa>>16))*t),g=((pa>>8)&255)+((((pb>>8)&255)-((pa>>8)&255))*t),bl=(pa&255)+(((pb&255)-(pa&255))*t);return '#'+((1<<24)+(Math.round(r)<<16)+(Math.round(g)<<8)+Math.round(bl)).toString(16).slice(1)}
function paletteAt(run){
 const lapF=run.distance/LAP,lap=Math.floor(lapF),frac=lapF-lap,blend=clamp((frac-.94)/.06,0,1);
 const a=PALETTES[lap%PALETTES.length],b=PALETTES[(lap+1)%PALETTES.length];
 if(blend===0)return a;
 return {name:a.name,sky:[mix(a.sky[0],b.sky[0],blend),mix(a.sky[1],b.sky[1],blend)],arch:a.arch.map((c,i)=>mix(c,b.arch[i],blend)),mist:mix(a.mist,b.mist,blend)};
}
const skyCache=new WeakMap();
function sky(c,w,h,p){
 let entry=skyCache.get(c);const key=p.sky[0]+p.sky[1]+w+'x'+h;
 if(!entry||entry.key!==key){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,p.sky[0]);g.addColorStop(1,p.sky[1]);entry={key,g};skyCache.set(c,entry)}
 c.fillStyle=entry.g;c.fillRect(0,0,w,h);
}
/* Far layer: misty floating islands carrying slender towers (shared with the illusion course). */
let islandPath=null;
function islands(){
 if(islandPath||typeof Path2D==='undefined')return islandPath;
 const p=new Path2D();
 for(let i=0;i<9;i++){
  const x=i*165-660+(i*53%40),y=(i*97%170)-80,wd=34+(i*31%34),depth=26+(i*17%22);
  p.moveTo(x-wd,y);p.lineTo(x+wd,y);p.lineTo(x+wd*.72,y+depth*.35);p.lineTo(x+wd*.36,y+depth*.55);p.lineTo(x+wd*.08,y+depth);p.lineTo(x-wd*.24,y+depth*.62);p.lineTo(x-wd*.62,y+depth*.4);p.closePath();
  const towers=1+(i%3);
  for(let k=0;k<towers;k++){
   const tw=4+((i+k)%3)*2,th=18+((i*7+k*11)%34),tx=x-wd*.55+k*wd*.45+(i%2)*4;
   p.rect(tx,y-th,tw,th);
   if((i+k)%2){p.moveTo(tx-1.5,y-th);p.lineTo(tx+tw/2,y-th-tw*1.6);p.lineTo(tx+tw+1.5,y-th);p.closePath()}
   else{p.moveTo(tx+tw,y-th);p.arc(tx+tw/2,y-th,tw/2,0,Math.PI,true);p.closePath()}
  }
 }
 islandPath=p;return p;
}
let starPath=null;
function stars(){if(starPath||typeof Path2D==='undefined')return starPath;starPath=new Path2D();for(let i=0;i<60;i++){const x=(i*211)%900-450,y=(i*137)%900-450,r=.7+(i%4)*.4;starPath.moveTo(x+r,y);starPath.arc(x,y,r,0,TAU)}return starPath}
function diamond(c,x,y,r,rot,fill){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=fill;c.fillRect(-r,-r,r*2,r*2);c.restore()}
function blockArt(c,run,o,at,k,t,reduced,pulse=1){
 const p=surface(at),w=o.w*pulse,h=o.h*pulse;
 c.save();c.translate(p.x,p.y);c.rotate(p.a);
 if(run.theme&&!o.absorbed){c.save();c.globalCompositeOperation=run.theme.mode;c.globalAlpha=run.theme.light?.12:.22;c.fillStyle=k.danger;c.fillRect(-w-4,-h-5,w*2+8,h+5);c.restore()}
 const crashed=run.crash&&!run.crash.fall&&Math.abs(run.crash.at-at)<w+FOOT+2;
 // Thick block: shadow, front face, top face, side bevel, window seam.
 c.fillStyle='rgba(10,6,22,.35)';c.fillRect(-w-2,-1,w*2+6,3);
 c.fillStyle=k.dangerSide;c.fillRect(-w+3,-h-3,w*2,h+3);
 c.fillStyle=crashed?'#fff4ea':k.danger;c.fillRect(-w,-h,w*2,h);
 c.fillStyle=k.dangerTop;c.fillRect(-w,-h,w*2,3.2);
 c.fillStyle='rgba(255,255,255,.18)';c.fillRect(-w,-h,2,h);
 c.strokeStyle=k.dangerLine;c.globalAlpha*=.55;c.lineWidth=.8;c.strokeRect(-w*.42,-h*.72,w*.84,h*.42);c.globalAlpha/=.55;
 if(o.h>=26){c.fillStyle=k.dangerTop;c.fillRect(-2,-h-7,4,4)}
 c.restore();
}
function pitArt(c,o,p0,k,palette,t){
 const p=surface(o.start);
 c.save();c.translate(p.x,p.y);c.rotate(p.a);
 c.fillStyle=palette.sky[1];c.fillRect(0,-.5,o.len,T+2);
 const g=c.createLinearGradient(0,0,0,T+2);g.addColorStop(0,'rgba(8,4,18,.75)');g.addColorStop(1,'rgba(8,4,18,0)');c.fillStyle=g;c.fillRect(0,-.5,o.len,T+2);
 c.fillStyle=k.danger;c.fillRect(-1.5,-1,2.2,T*.8);c.fillRect(o.len-.7,-1,2.2,T*.8);
 c.globalAlpha=.35+.25*Math.sin(t*5);c.fillStyle=k.dangerTop;c.fillRect(-2,-3,4,2);c.fillRect(o.len-2,-3,4,2);
 c.restore();
}
const auroraInk=new WeakMap();
function auroraGlow(c){let g=auroraInk.get(c);if(g)return g;g=c.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,'rgba(170,246,232,.55)');g.addColorStop(.45,'rgba(138,184,255,.22)');g.addColorStop(1,'rgba(183,140,255,0)');auroraInk.set(c,g);return g}
/* Neon outline of the room (two strokes, no shadowBlur) and nested squares that breathe outward with the beat. */
function neonRim(c,paths,th,beatP,reduced){
 c.save();c.globalCompositeOperation=th.mode;
 c.globalAlpha=.16+.05*beatP;c.lineWidth=7;c.strokeStyle=th.glow;c.stroke(paths.lip);
 c.globalAlpha=.85;c.lineWidth=1.6;c.strokeStyle=th.rim;c.stroke(paths.lip);
 c.globalAlpha=.55;c.lineWidth=1;c.strokeStyle=th.rim2;c.stroke(paths.outer);c.restore();
}
function nestedSquares(c,th,beatP,reduced,t){
 const cx=CENTER.x,cy=CENTER.y,half=L/2+R;
 c.save();c.globalCompositeOperation=th.mode;c.lineWidth=1.2;
 for(let i=0;i<5;i++){
  const k=.2+i*.17+(reduced?0:.012*Math.sin(t*.6+i)),hw=half*k,a=(.07+.05*beatP*(1-i*.15))*(1-i*.1);
  c.globalAlpha=Math.max(0,a);c.strokeStyle=i%2?th.rim2:th.rim;c.strokeRect(cx-hw,cy-hw,hw*2,hw*2);
 }
 c.restore();
}
function draw(c,run,opts){
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,th=run.theme||null,k=th?(ink()===INK_CVD?{...th.ink,...INK_CVD}:th.ink):ink(),palette=th?th.palette:paletteAt(run),paths=room();
 const beatP=th&&run.beatBpm>0&&!reduced?.5+.5*Math.cos((t*run.beatBpm/60%1)*TAU):0,pulse=1+.05*(beatP*2-1)*(th&&!reduced?1:0);
 const foot=surface(run.distance);
 let rot=0,scale=clamp(Math.min(w/318,h/600),.72,2.4),cx,cy,tx,ty;
 if(reduced){
  scale=clamp(Math.min(w,h*.8)/(L+2*R+2*T+30),.5,2.4);tx=CENTER.x;ty=CENTER.y;cx=w*.5;cy=h*.47;
 }else{
  const ahead=surface(run.distance+34),u=((run.distance%LAP)+LAP)%LAP,v=u-sideOf(run.distance)*SIDE;
  const corner=v>L-30?Math.sin(clamp((v-L+30)/(ARC+60),0,1)*Math.PI):0;
  scale*=1-.1*corner;rot=-surface(run.distance+16).a;
  const target=offset(ahead,30);tx=target.x;ty=target.y;cx=w*.44;cy=h*.6;
 }
 c.save();
 sky(c,w,h,palette);
 // Far layer: stars and misty architecture, parallax 0.2 of the camera rotation.
 c.save();c.translate(w*.5,h*.45);c.rotate(rot*.2);c.globalAlpha=.55;c.fillStyle=palette.mist;c.fill(stars());
 c.globalAlpha=.1;c.fillStyle=palette.mist;c.scale(.9,.9);c.fill(islands());c.globalAlpha=.06;c.scale(1.3,1.3);c.translate(70,140);c.fill(islands());c.restore();
 c.globalAlpha=1;
 c.translate(cx,cy);c.rotate(rot);c.scale(scale,scale);c.translate(-tx,-ty);
 run.view={cx,cy,scale,rot,tx,ty};
 // Room interior: back wall with a perspective frame (box seen from the front).
 c.fillStyle=palette.sky[0];c.globalAlpha=.72;c.fill(paths.inner);c.globalAlpha=1;c.fillStyle='rgba(8,5,20,.2)';c.fill(paths.inner);
 c.strokeStyle=palette.mist;c.globalAlpha=.18;c.lineWidth=1.2;c.stroke(paths.deep);
 c.beginPath();for(let i=0;i<4;i++){c.moveTo(paths.corners[i][0],paths.corners[i][1]);c.lineTo(paths.deepCorners[i][0],paths.deepCorners[i][1])}c.stroke();
 if(th)nestedSquares(c,th,beatP,reduced,t);
 c.globalAlpha=.06;c.fillStyle=palette.mist;c.fill(paths.deep);c.globalAlpha=.1;c.fill(paths.moon);c.globalAlpha=.16;c.strokeStyle=palette.mist;c.lineWidth=1.4;c.stroke(paths.moonRing);c.globalAlpha=1;
 // Thick wall: shadow face, side face, bright top face, windows.
 c.fillStyle=palette.arch[2];c.fill(paths.mass,'evenodd');c.fillStyle=palette.arch[1];c.globalAlpha=.35;c.fill(paths.lower);c.globalAlpha=1;
 c.fillStyle=palette.arch[1];c.fill(paths.ring,'evenodd');
 c.fillStyle=palette.arch[2];c.globalAlpha=.65;c.fill(paths.windows);c.globalAlpha=1;
 c.strokeStyle=palette.arch[2];c.lineWidth=2.2;c.stroke(paths.outer);
 c.fillStyle=palette.arch[0];c.fill(paths.lip,'evenodd');
 if(th)neonRim(c,paths,th,beatP,reduced);
 c.strokeStyle=palette.arch[0];c.globalAlpha=.4;c.lineWidth=.8;c.stroke(paths.rail);c.stroke(paths.rails);c.globalAlpha=1;
 // Lit windows: a warm glow per lap completed (the room "remembers" the run).
 if(run.lap>0){c.fillStyle=k.tapDeep;c.globalAlpha=Math.min(.55,.12*run.lap);c.fill(paths.windows);c.globalAlpha=1}
 // Obstacles in view (two sides back to one and a half ahead).
 const lo=run.distance-SIDE*1.6,hi=run.distance+SIDE*2.2;
 for(let i=Math.max(0,run.index-6);i<run.obstacles.length;i++){
  const o=run.obstacles[i];if(o.at<lo)continue;if(o.at>hi)break;
  if(o.kind==='pit')pitArt(c,o,null,k,palette,t);
  else if(o.kind==='double'){blockArt(c,run,o,o.parts[0],k,t,reduced,pulse);blockArt(c,run,o,o.parts[1],k,t,reduced,pulse)}
  else blockArt(c,run,o,o.at,k,t,reduced,pulse);
  if(o.shard&&!o.picked){const sp=offset(surface(o.at),PEAK+8);diamond(c,sp.x,sp.y,3.6,Math.PI/4+(reduced?0:t*1.6+i),k.tap);c.globalAlpha=.25;diamond(c,sp.x,sp.y,6,Math.PI/4,k.tapDeep);c.globalAlpha=1}
 }

 if(run.drawWorld)run.drawWorld(c,{t,reduced,up:-rot,foot,k,th});
 // Runner.
 const pose=run.crash?(run.crash.fall?'jump':'hurt'):run.flight!==null?'jump':'run';
 let actor=offset(foot,run.height+1.5),angle=foot.a;
 if(run.crash&&run.outro){
  const age=run.outro.age;
  if(run.crash.fall){const drop=age*age*260;actor={x:actor.x-Math.sin(foot.a)*drop,y:actor.y+Math.cos(foot.a)*drop};angle+=reduced?0:age*2.4}
  else{const back=Math.min(1,age*3)*10;actor={x:actor.x-Math.cos(foot.a)*back,y:actor.y-Math.sin(foot.a)*back}}
 }
 const contact=offset(foot,.8);c.save();c.translate(contact.x,contact.y);c.rotate(foot.a);c.globalAlpha=.4*(1-clamp(run.height/PEAK,0,.8));c.fillStyle='#fff6dc';c.beginPath();c.ellipse(0,0,7,1.6,0,0,TAU);c.fill();c.restore();c.globalAlpha=1;
 if(root.MongyuMobile?.sprite)root.MongyuMobile.sprite(c,{...actor,bodyHeight:46,renderAngle:angle,strideDistance:run.distance,nativeState:0,height:run.height,jumpProgress:run.flight===null?0:run.flight/run.fl,pose},{poseTime:t,onDark:true},reduced);
 else{c.fillStyle='#fff3e0';c.fillRect(actor.x-5,actor.y-30,10,30)}
 if(run.drawAura)run.drawAura(c,actor.x,actor.y-20,{t,reduced});
 // Pass sparkle and shard pickup.
 if(!reduced&&run.time-run.crossedAt<.3){const age=(run.time-run.crossedAt)/.3;c.globalAlpha=1-age;for(let i=0;i<6;i++){const a=i*Math.PI/3;diamond(c,actor.x+Math.cos(a)*(10+age*20),actor.y-18+Math.sin(a)*(10+age*20),1.4,0,k.tap)}c.globalAlpha=1}
 if(run.time-run.pickedAt<.45){const age=(run.time-run.pickedAt)/.45;c.save();c.translate(actor.x,actor.y-24);c.scale(1+age*2,1+age*2);c.fillStyle=auroraGlow(c);c.globalAlpha=1-age;c.beginPath();c.arc(0,0,1,0,TAU);c.fill();c.restore();c.globalAlpha=1}
 c.restore();
 if(run.hudOff!==true)hud(c,run,w,h,k,reduced);
 return null;
}
function roundRectPath(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function hud(c,run,w,h,k,reduced){
 if(run.state==='fail')return;
 const fade=run.outro?1-Math.min(1,run.outro.age/.35):1;if(fade<=0)return;
 c.save();c.globalAlpha=fade;c.textAlign='center';c.textBaseline='alphabetic';
 const top=Math.max(14,h*.035);
 c.font='600 11px system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(20,12,36,.6)';const label=(run.daily?'오늘의 도전':'무한 꿈')+' · '+(run.lap+1)+'바퀴';c.strokeText(label,w/2,top+10);c.fillStyle='rgba(255,243,226,.85)';
 c.fillText(label,w/2,top+10);
 c.font='800 40px system-ui,sans-serif';c.lineWidth=5;c.strokeStyle='rgba(20,12,36,.55)';c.strokeText(String(run.score),w/2,top+52);
 c.fillStyle='#fff3d6';c.fillText(String(run.score),w/2,top+52);
 if(run.perfectStreak>=2){
  const label='완벽 ×'+run.perfectStreak;c.font='750 12px system-ui,sans-serif';const tw=c.measureText(label).width+20;
  roundRectPath(c,w/2-tw/2,top+60,tw,20,10);c.fillStyle=k.tapDeep;c.fill();c.fillStyle='#3a2410';c.fillText(label,w/2,top+74);
 }
 // Speech dock: coach line low on screen, above the thumb zone.
 const coach=run.coach&&run.time<run.coach.until?run.coach.text:'';
 if(coach&&run.state==='play'){
  c.font='700 16px system-ui,sans-serif';const tw=Math.min(w-48,c.measureText(coach).width+36),y=h*.74;
  roundRectPath(c,w/2-tw/2,y-19,tw,38,19);c.fillStyle='rgba(26,19,48,.66)';c.fill();c.strokeStyle='rgba(255,236,255,.16)';c.lineWidth=1;c.stroke();
  c.fillStyle='#fbf4ff';c.fillText(coach,w/2,y+6);
 }
 // Lap gauge: thin ring progress at the bottom.
 const gy=h*.86,gw=Math.min(w*.7,320),frac=(run.distance%LAP)/LAP;
 roundRectPath(c,w/2-gw/2,gy,gw,6,3);c.fillStyle='rgba(255,255,255,.12)';c.fill();
 roundRectPath(c,w/2-gw/2,gy,Math.max(6,gw*frac),6,3);c.fillStyle=k.tapDeep;c.fill();
 for(let i=1;i<4;i++){c.fillStyle='rgba(20,12,36,.6)';c.fillRect(w/2-gw/2+gw*i/4-1,gy,2,6)}
 c.restore();
}
const api=Object.freeze({enabled,islands,EndlessRun,generateSide,tripTheme,surface,offset,speedFor,rng,hash,dayKey,weekKey,dailySeed,recordRun,readRecords,summary,draw,
 PALETTES,INK,INK_CVD,ink,LAP,SIDE,L,R,FLIGHT,PEAK,RECORD_KEY,inCorner});
root.MongyuEndless=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
