/* R104 illusion-jump course (rotate architecture to join broken paths). Owned by workstream I.
   착시 정원: an authored ~65 s isometric run. Where the path breaks, a gold marker sits on a rotating
   bridge. Tapping near it turns the bridge 90° about its pivot so the broken path joins - sometimes only
   to the eye (the next walkway is offset by (k,k,k), invisible in isometric projection: Penrose/Escher).
   Away from markers a tap is a jump over coral blocks. Same run API as OpeningRun + drawSelf(ctx,opts). */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const C=Math.cos(Math.PI/6),S=.5,TAU=Math.PI*2;
const SPEED=68,FLIGHT=.64,PEAK=40,FOOT=4,BUFFER=.09,HIT_STOP=.12,FAIL_OUTRO=.95,CLEAR_OUTRO=1.9,INTRO=2.6;
const HOLD=42,TURN=.55,WINDOW=170,WIDE=12,THICK=14,BLOCK=7,BLOCK_H=15,ALIGNED=.86;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const SECTIONS=[
 {name:'새벽 정원',sky:['#251c40','#5b4270'],arch:['#f7e3ea','#c19ab9','#6b4a7c'],mist:'#d6b3d9',at:0},
 {name:'달빛 수로',sky:['#0f1d34','#2c4f6e'],arch:['#e0f1f7','#8eb2cb','#3e5d7e'],mist:'#a7cfe6',at:0},
 {name:'오로라 탑',sky:['#10222a','#30505a'],arch:['#e9f6ee','#9cc6b6','#43706a'],mist:'#b3e2d6',at:0}
];
/* Authored plan: [direction, screen length, options]. x = down-right, z = up-right, stair = Penrose stair (rises
   along +X yet reads flat). gap = rotating bridge after this walkway; lift = invisible (k,k,k) offset of the next piece. */
const PLAN=[
 ['x',250,{tower:true,section:0}],
 ['z',220,{blocks:[124]}],
 ['stair',200,{}],
 ['x',150,{gap:92,tutorial:true}],
 ['x',220,{blocks:[112]}],
 ['z',240,{blocks:[78,168]}],
 ['x',170,{gap:100,lift:44,section:1}],
 ['z',200,{blocks:[104]}],
 ['stair',180,{}],
 ['z',150,{gap:90}],
 ['x',260,{blocks:[70,156]}],
 ['z',190,{gap:108,lift:-36}],
 ['x',200,{blocks:[96],section:2}],
 ['stair',210,{}],
 ['z',170,{gap:100,lift:40}],
 ['x',230,{blocks:[62,146]}],
 ['z',250,{finish:true}]
];
const DIRS={x:[1,0,0],z:[0,0,-1],stair:[1/C,.5/C,0]};
function project(p){return {x:(p[0]-p[2])*C,y:(p[0]+p[2])*S-p[1]}}
const add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k];
function build(plan=PLAN,grid=0){
 let p=[0,0,0],s=0,section=0;
 const sn=(v,min)=>Math.max(min,Math.round(v/grid)*grid);
 const walks=[],gaps=[],blocks=[],segments=[],shards=[];
 for(let i=0;i<plan.length;i++){
  const [kind,len0,o]=plan[i],d=DIRS[kind],len=grid?sn(len0,grid*(o.blocks?3:1)):len0;
  if(o.section!==undefined)section=o.section;
  const p1=add(p,d,len),walk={index:i,kind,p0:p,p1,len,s0:s,s1:s+len,section,tower:!!o.tower,finish:!!o.finish};
  walks.push(walk);segments.push({s0:s,s1:s+len,a:project(p),b:project(p1),walk});
  for(const at0 of o.blocks||[]){const at=grid?clamp(sn(at0,grid),grid,len-grid):at0;const b={at:s+at,p:add(p,d,at),dir:kind,picked:false};blocks.push(b);shards.push({at:s+at,p:add(add(p,d,at),[0,PEAK+6,0]),kind:'block'})}
  s+=len;p=p1;
  if(o.gap){
   const g=grid?sn(o.gap,grid*2):o.gap,end=add(p,d,g),pivot=add(p,d,g/2),gap={index:gaps.length,dir:kind,s0:s,s1:s+g,len:g,start:p,end,pivot,lift:o.lift||0,tutorial:!!o.tutorial,section,turnAt:null};
   gaps.push(gap);segments.push({s0:s,s1:s+g,a:project(p),b:project(end),gap});
   shards.push({at:s+g/2,p:add(pivot,[0,PEAK*.55,0]),kind:'gap',gap:gap.index});
   s+=g;p=end;
   if(o.lift)p=add(p,[1,1,1],o.lift);
  }
 }
 return {walks,gaps,blocks,segments,shards,finish:s};
}
const COURSE=build();
const FINISH=COURSE.finish;
function point(s,course=COURSE){
 const segs=course.segments;let lo=0,hi=segs.length-1;
 s=clamp(s,0,course.finish);
 while(lo<hi){const mid=(lo+hi)>>1;if(segs[mid].s1<s)lo=mid+1;else hi=mid}
 const g=segs[lo],t=(s-g.s0)/Math.max(1e-6,g.s1-g.s0);
 return {x:g.a.x+(g.b.x-g.a.x)*t,y:g.a.y+(g.b.y-g.a.y)*t,seg:g};
}
function sectionAt(s,course=COURSE){let k=0;for(const w of course.walks)if(s>=w.s0)k=w.section;return k}
const COACH={intro:'금빛 표식을 탭하면 건축이 돌아요',slow:'지금 금빛 표식을 탭!',joined:'길이 이어졌다!',marker:'금빛 표식 · 탭',illusion:'보이는 대로 이어진 길',fall:'다리가 아직 돌지 않았어',block:'산호빛 블록은 점프',finish:'오로라의 문!',early:'조금 일찍 눌렀어',late:'한 박자 늦었어'};
const reducedMotion=()=>{try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}};

class IllusionRun{
 constructor(options={}){
  this.options=options;this.mode='dream';this.dreamMode='illusion';this.openingCourse=false;this.polish=true;
  /* R105: options.plan/options.sections give a chained act its own course; options.chain marks it as one act of a CourseRun. */
  this.chain=options.chain||null;this.chained=!!this.chain;this.sections=options.sections||SECTIONS;
  this.cs=options.plan?makeCourse(options.plan,this.chain?.bpm?SPEED*60/this.chain.bpm:0):DEFAULT;
  this.settings={...(options.settings||{})};this.attempt=options.attempt||1;this.skipIntro=!!options.skipIntro;
  this.setViewport(options.viewport?.width,options.viewport?.height);this.reset();
 }

 reset(){
  const {COURSE}=this.cs,chain=this.chain;
  this.state='ready';this.time=0;this.clock=0;this.updates=0;this.inputCount=0;this.jumps=0;this.hits=0;this.hearts=1;
  this.distance=0;this.height=0;this.flight=null;this.buffer=0;this.lastJump=-Infinity;this.events=[];
  this.turns=COURSE.gaps.map(()=>null);this.blockIndex=0;this.gapIndex=0;this.clears=0;this.solved=0;this.shards=COURSE.shards.map(()=>false);this.shardCount=0;this.shardTotal=COURSE.shards.length;
  this.perfects=0;this.perfectStreak=chain?.carry?.perfectStreak||0;this.points=chain?.carry?.points||0;this.score=this.points;this.crash=null;this.hitStop=0;this.outro=null;this.result=null;this.timeScale=1;
  this.intro=this.skipIntro||chain||reducedMotion()?0:INTRO;this.slowChance=chain&&this.options.tutorial!==true||!COURSE.gaps.length?'done':'pending';this.coach=chain?null:{kind:'intro',text:COACH.intro,until:this.intro+2.2};
  this.crossedAt=-10;this.turnFlash=-10;this.section=0;this.cam=null;this.blockCoached=false;this.coached=new Set();
  /* R105 items: fl/pk = length and peak factor of the current jump (feather doubles it); mods/itemList from MongyuItems.setup. */
  this.fl=FLIGHT;this.pk=1;this.mods=null;this.itemList=null;
  if(chain||this.options.items)root.MongyuItems?.setup?.(this,{items:this.options.items,start:0,len:this.cs.FINISH,beat:SPEED*60/(chain?.bpm||100)});
 }
 setViewport(width=390,height=844){this.viewport={width,height}}
 start(){if(this.state!=='ready')return false;this.state='play';this.events.push('start');return true}
 pause(){if(this.state!=='play')return false;this.state='pause';this.cancelInput();this.events.push('pause');return true}
 resume(){if(this.state!=='pause')return false;this.state='play';return true}
 retry(){this.attempt++;this.skipIntro=true;this.reset();this.state='play';this.events.push('start');return true}
 inputDown(){return this.action()}
 inputUp(){}
 cancelInput(){this.buffer=0}
 /* The gap whose marker is actionable now (approaching, bridge not yet turned). */
 activeGap(){
  const {COURSE}=this.cs;
  for(let i=this.gapIndex;i<COURSE.gaps.length;i++){
   const g=COURSE.gaps[i],ahead=g.s0-this.distance;
   if(ahead>WINDOW)return null;
   if(this.turns[i]===null&&ahead>=-3)return g;
  }
  return null;
 }
 turnProgress(i,clock=this.clock){const at=this.turns[i];return at===null?0:clamp((clock-at)/TURN,0,1)}
 action(){
  if(this.state!=='play'||this.outro||this.hitStop>0)return false;
  if(this.intro>0){this.intro=0;this.coach={kind:'intro',text:COACH.intro,until:this.time+1.8};return true}
  this.inputCount++;
  const gap=this.activeGap();
  if(gap){this.turns[gap.index]=this.clock;this.turnFlash=this.clock;this.events.push('morph');if(this.slowChance==='active')this.slowChance='done';return true}
  if(this.flight!==null){if(this.flight>=this.fl-BUFFER)this.buffer=BUFFER;return false}
  return this.jump();
 }
 jump(){this.fl=root.MongyuItems?.applyJump?root.MongyuItems.applyJump(this,FLIGHT):FLIGHT;this.flight=0;this.lastJump=this.distance;this.jumps++;this.buffer=0;this.events.push('jump');return true}
 drainEvents(){return this.events.splice(0)}
 setCoach(kind,hold){this.coach={kind,text:COACH[kind],until:this.time+hold}}
 /* R105: settle() applies the surge x2 and its trigger after every tick, whichever way tick0 returns. */
 tick(dt){this.tick0(dt);if(this.mods)root.MongyuItems.settle(this)}
 tick0(dt){
  if(this.state!=='play')return;
  const {COURSE,FINISH}=this.cs;
  this.updates++;this.clock+=dt;
  if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);return}
  if(this.outro){this.outro.age+=dt;if(this.outro.age>=this.outro.duration)this.finish(this.outro.kind);return}
  if(this.intro>0){this.intro=Math.max(0,this.intro-dt);return}
  dt=this.pace(dt);if(!dt)return;
  this.time+=dt;
  this.distance=Math.min(FINISH,this.distance+SPEED*dt);
  this.buffer=Math.max(0,this.buffer-dt);
  if(this.flight!==null){
   this.flight+=dt;const phase=Math.min(1,this.flight/this.fl);this.height=4*PEAK*this.pk*phase*(1-phase);
   if(phase===1){this.flight=null;this.height=0;this.events.push('land');if(this.buffer>0)this.jump()}
  }
  if(this.mods)root.MongyuItems.collect(this,this.distance,this.height,PEAK,14);
  const section=sectionAt(this.distance,COURSE);if(section!==this.section){this.section=section;this.events.push('corner')}
  // Gaps: walking onto an unturned bridge is a fall.
  const g=COURSE.gaps[this.gapIndex];
  if(g){
   const progress=this.turnProgress(g.index);
   if(this.flight===null&&this.distance>g.s0+3&&this.distance<g.s1-3&&progress<ALIGNED){
    /* a moon bubble turns the bridge for you instead of letting you fall */
    if(this.mods&&root.MongyuItems.applyHit(this)){this.turns[g.index]=this.clock-TURN;this.turnFlash=this.clock;this.events.push('morph')}
    else{this.fall(g);return}
   }
   if(this.distance>=g.s1){this.gapIndex++;this.solved++;this.points+=150;this.crossedAt=this.time;this.events.push('perfect');if(g.lift)this.setCoach('illusion',1.6)}
   else if(this.turns[g.index]===null&&g.s0-this.distance<WINDOW&&g.s0-this.distance>0&&!this.coached.has(g.index)&&!g.tutorial){this.coached.add(g.index);this.setCoach('marker',1.2)}
  }
  // Blocks.
  const b=COURSE.blocks[this.blockIndex];
  if(b){
   if(!this.blockCoached&&b.at-this.distance<90){this.blockCoached=true;this.setCoach('block',1.3)}
   const gapS=this.distance-b.at;
   if(Math.abs(gapS)<=BLOCK+FOOT&&this.height<BLOCK_H){
    if(this.mods&&root.MongyuItems.applyHit(this)){this.blockIndex++;this.crossedAt=this.time;this.perfectStreak=0;return}
    this.hit(b);return}
   if(gapS>BLOCK+FOOT){
    this.blockIndex++;this.clears++;this.crossedAt=this.time;
    const lead=b.at-this.lastJump,perfect=Math.abs(lead-SPEED*this.fl/2)<=8;
    this.points+=60+(perfect?40:0);if(perfect){this.perfects++;this.perfectStreak++}else this.perfectStreak=0;this.events.push(perfect?'perfect':'pass');
   }
  }
  // Shards: gold diamonds over blocks (collect at the top of a jump) and over bridges (collect while crossing).
  for(let i=0;i<COURSE.shards.length;i++){
   if(this.shards[i])continue;const sh=COURSE.shards[i],d=Math.abs(this.distance-sh.at);if(d>14)continue;
   if(sh.kind==='gap'||this.height>=PEAK-14){this.shards[i]=true;this.shardCount++;this.points+=25}
  }
  this.score=this.points+Math.floor(this.distance/10);
  if(this.distance>=FINISH&&this.chain&&this.chain.last===false){this.points+=100;this.score=this.points+Math.floor(this.distance/10);this.finish('clear');return}
  if(this.distance>=FINISH){this.points+=300;this.score+=300;this.setCoach('finish',2);this.outro={kind:'clear',age:0,duration:CLEAR_OUTRO};this.events.push('portal')}
 }

 pace(dt){
  const first=this.cs.COURSE.gaps[0];let target=1;
  if(this.slowChance==='pending'&&this.distance>=first.s0-90){this.slowChance=this.turns[0]===null?'active':'done'}
  if(this.slowChance==='active'){target=.22;if(!this.coach||this.coach.kind!=='slow')this.setCoach('slow',99)}
  if(this.slowChance==='done'&&this.coach?.kind==='slow'){this.setCoach('joined',1.4)}
  this.timeScale+=(target-this.timeScale)*Math.min(1,dt*8);if(Math.abs(target-this.timeScale)<.004)this.timeScale=target;
  let step=dt*this.timeScale;
  if(this.slowChance==='active')step=clamp((first.s0-HOLD-this.distance)/SPEED,0,step);
  return this.mods?root.MongyuItems.applyPace(this,step):step;
 }
 fall(g){
  this.hits++;this.hearts=0;this.crash={kind:'fall',gap:g.index,at:this.distance,s:this.distance,early:false};
  this.events.push('hit');this.hitStop=0;this.outro={kind:'fail',age:0,duration:FAIL_OUTRO};this.setCoach('fall',2.2);
 }
 hit(b){
  this.hits++;this.hearts=0;const early=this.lastJump>b.at-120&&(this.flight===null||this.flight/FLIGHT>.5);
  this.crash={kind:'block',at:this.distance,s:b.at,early};
  this.events.push('hit');this.hitStop=reducedMotion()?0:HIT_STOP;this.outro={kind:'fail',age:0,duration:FAIL_OUTRO};this.setCoach(early?'early':'late',2.2);
 }
 finish(state){
  const {COURSE,FINISH}=this.cs;
  this.state=state;this.outro=null;
  this.result={mode:'illusion',state,score:this.score,distance:Math.floor(this.distance),progress:this.distance/FINISH,solved:this.solved,gaps:COURSE.gaps.length,
   clears:this.clears,blocks:COURSE.blocks.length,shards:this.shardCount,shardTotal:COURSE.shards.length,time:this.time,attempt:this.attempt,
   reason:state==='clear'?'오로라의 문을 지났어요.':this.crash?.kind==='fall'?'다리를 돌리기 전에 건넜어요':'산호빛 블록에 부딪혔어요'};
  if(this.chain)Object.assign(this.result,{points:this.points,perfectStreak:this.perfectStreak,perfects:this.perfects,hits:this.hits});
  this.events.push(state);
 }
 status(){
  const sec=this.sections[this.section]||this.sections[0];
  return {mode:this.mode,dreamMode:'illusion',state:this.state,time:this.time,hearts:this.hearts,score:this.score,best:0,progress:this.distance/this.cs.FINISH,
   roomTitle:'착시 정원 · '+sec.name,roomIndex:this.section,roomCount:this.sections.length,instruction:'탭: 금빛 표식 근처면 건축 회전, 아니면 점프',cue:null,result:this.result};
 }
 drawSelf(ctx,opts){return draw(ctx,this,opts)}
}

/* ---------- art: isometric blocks ---------- */
function quad(c,a,b,d,e){c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(d.x,d.y);c.lineTo(e.x,e.y);c.closePath()}
function boxSides(c,x0,x1,y0,y1,z0,z1,arch){
 const P=(x,y,z)=>project([x,y,z]);
 quad(c,P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1));c.fillStyle=arch[1];c.fill();
 quad(c,P(x1,y0,z0),P(x1,y0,z1),P(x1,y1,z1),P(x1,y1,z0));c.fillStyle=arch[2];c.fill();
}
function boxTop(c,x0,x1,y1,z0,z1,fill){const P=(x,z)=>project([x,y1,z]);quad(c,P(x0,z0),P(x1,z0),P(x1,z1),P(x0,z1));c.fillStyle=fill;c.fill()}
function walkBox(w){
 const [a,b]=[w.p0,w.p1];
 if(w.kind==='z')return [a[0]-WIDE,a[0]+WIDE,a[1]-THICK,a[1],b[2],a[2]];
 return [a[0],b[0],a[1]-THICK,a[1],a[2]-WIDE,a[2]+WIDE];
}
/* Precomputed draw lists (static architecture). */
function buildArt(COURSE){
 const pillars=[],sides=[],tops=[],windows=[];
 for(const w of COURSE.walks){
  const [x0,x1,y0,y1,z0,z1]=walkBox(w);
  if(w.kind==='stair'){
   const n=Math.max(2,Math.round((w.p1[0]-w.p0[0])/12)),step=(w.p1[0]-w.p0[0])/n;
   for(let i=0;i<n;i++){const sx=w.p0[0]+i*step,top=w.p0[1]+(i+.5)*step*.5;sides.push({box:[sx,sx+step,top-THICK,top,z0,z1],w});tops.push({box:[sx,sx+step,top,z0,z1],w,step:true})}
  }else{sides.push({box:[x0,x1,y0,y1,z0,z1],w});tops.push({box:[x0,x1,y1,z0,z1],w})}
  // Pillars under the start of each walkway (and a tower under the first).
  const px=w.kind==='z'?w.p0[0]:w.p0[0]+(w.tower?40:10),pz=w.kind==='z'?w.p0[2]-10:w.p0[2],size=w.tower?34:9;
  pillars.push({x0:px-size,x1:px+size,z0:pz-size,z1:pz+size,top:w.p0[1]-THICK,w});
  if(w.len>200&&!w.tower){const m=add(w.p0,DIRS[w.kind],w.len*.66);pillars.push({x0:m[0]-7,x1:m[0]+7,z0:m[2]-7,z1:m[2]+7,top:m[1]-THICK,w})}
 }
 for(const g of COURSE.gaps)pillars.push({x0:g.pivot[0]-6,x1:g.pivot[0]+6,z0:g.pivot[2]-6,z1:g.pivot[2]+6,top:g.pivot[1]-THICK-4,gap:g});
 pillars.sort((a,b)=>(a.x0+a.z0)-(b.x0+b.z0));
 for(const p of pillars)for(let k=0;k<3;k++)windows.push({x:p.x1,y:p.top-26-k*34,z:(p.z0+p.z1)/2,p});
 return {pillars,sides,tops,windows};
}
const ART=buildArt(COURSE);
/* Per-run course (R105 chained acts pass options.plan); the default plan reuses the module constants. */
function makeCourse(plan,grid=0){const course=build(plan,grid);return {COURSE:course,FINISH:course.finish,ART:buildArt(course)}}
const DEFAULT={COURSE,FINISH,ART};
function inView(view,a,b,margin=60){return Math.max(a.x,b.x)>view.l-margin&&Math.min(a.x,b.x)<view.r+margin&&Math.max(a.y,b.y)>view.t-margin&&Math.min(a.y,b.y)<view.b+margin}
function pillar(c,p,arch,mist){
 const fade=[1,.7,.42,.18],seg=70;
 for(let i=0;i<fade.length;i++){
  c.globalAlpha=fade[i];const y1=p.top-i*seg,y0=y1-seg-1;
  boxSides(c,p.x0,p.x1,y0,y1,p.z0,p.z1,arch);
 }
 c.globalAlpha=1;
}
function armBox(c,g,theta,arch,top,aligned){
 // Bridge box centred on the pivot, length g.len along u(theta), width 2*WIDE, rotated about the vertical axis.
 const hl=g.len/2+1,hw=WIDE,y1=g.pivot[1],y0=y1-THICK,ux=Math.cos(theta),uz=Math.sin(theta),vx=-uz,vz=ux;
 const corner=(a,b,y)=>project([g.pivot[0]+ux*a+vx*b,y,g.pivot[2]+uz*a+vz*b]);
 const faces=[[1,0],[0,1],[-1,0],[0,-1]];
 for(const [fa,fb] of faces){
  const nx=ux*fa+vx*fb,nz=uz*fa+vz*fb;if(nx+nz<=0||aligned&&fa)continue;
  const ext=fa?[[fa*hl,-hw],[fa*hl,hw]]:[[-hl,fb*hw],[hl,fb*hw]];
  quad(c,corner(ext[0][0],ext[0][1],y0),corner(ext[1][0],ext[1][1],y0),corner(ext[1][0],ext[1][1],y1),corner(ext[0][0],ext[0][1],y1));
  const t=clamp((nx-nz+1)/2,0,1);c.fillStyle=t>.5?arch[2]:arch[1];c.fill();
 }
 quad(c,corner(-hl,-hw,y1),corner(hl,-hw,y1),corner(hl,hw,y1),corner(-hl,hw,y1));c.fillStyle=top;c.fill();
}
function gapTheta(g,progress){const base=g.dir==='x'?0:-Math.PI/2;return base+(1-ease(progress))*Math.PI/2}
function lerpColor(a,b,t){const pa=parseInt(a.slice(1),16),pb=parseInt(b.slice(1),16),m=(s)=>Math.round(((pa>>s)&255)+((((pb>>s)&255)-((pa>>s)&255))*t));return 'rgb('+m(16)+','+m(8)+','+m(0)+')'}
const skyCache=new WeakMap();
function palette(run){
 const {COURSE}=run.cs,SECTIONS=run.sections,s=run.distance;let i=0;for(const w of COURSE.walks)if(s>=w.s0)i=w.section;
 const next=COURSE.walks.find(w=>w.section===i+1);let t=0;if(next)t=clamp((s-(next.s0-260))/260,0,1);
 if(!t)return SECTIONS[i];
 const a=SECTIONS[i],b=SECTIONS[i+1];
 return {name:a.name,sky:[lerpColor(a.sky[0],b.sky[0],t),lerpColor(a.sky[1],b.sky[1],t)],arch:a.arch.map((c,k)=>lerpColor(c,b.arch[k],t)),mist:lerpColor(a.mist,b.mist,t)};
}
function draw(c,run,opts){
 const {COURSE,FINISH,ART}=run.cs,SECTIONS=run.sections,{width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,k=root.MongyuEndless?.ink?.()||{danger:'#ff8a73',dangerTop:'#ffb59f',dangerSide:'#c75a55',tap:'#ffeca5',tapDeep:'#ffd98a',dangerLine:'#ffe1c8'};
 const pal=palette(run),me=point(run.distance,COURSE);
 let actor={x:me.x,y:me.y-run.height};
 // Camera: follow the runner with a lead; the intro starts wide and eases in.
 let scale=clamp(Math.min(w/290,h/600),.7,2.4),focus={x:me.x+70,y:me.y-20};
 if(run.intro>0){const k2=ease(1-run.intro/INTRO);scale*=.5+.5*k2;const far=point(Math.min(FINISH,520),COURSE);focus={x:focus.x+(far.x-focus.x)*(1-k2),y:focus.y+(far.y-focus.y)*(1-k2)}}
 const midAct=run.chain&&run.chain.last===false,finale=midAct?0:run.outro?.kind==='clear'?ease(clamp(run.outro.age/1.4,0,1)):run.state==='clear'?1:0;
 if(finale>0){const gate=project(COURSE.walks[COURSE.walks.length-1].p1);scale*=1-.3*finale;focus={x:focus.x+(gate.x-40-focus.x)*finale,y:focus.y+(gate.y-90-focus.y)*finale}}
 if(!run.cam||run.cam.reset||Math.abs(run.cam.t-t)>.5)run.cam={x:focus.x,y:focus.y,t};
 const lag=finale>0?1:Math.min(1,Math.max(0,t-run.cam.t)*(reduced?20:4.5));run.cam.x+=(focus.x-run.cam.x)*lag;run.cam.y+=(focus.y-run.cam.y)*lag;run.cam.t=t;
 if(run.intro>0){run.cam.x=focus.x;run.cam.y=focus.y}
 const cx=w*(.42+.08*finale)-run.cam.x*scale,cy=h*.55-run.cam.y*scale;
 const view={l:-cx/scale,r:(w-cx)/scale,t:-cy/scale,b:(h-cy)/scale};
 c.save();
 let sk=skyCache.get(c);const key=pal.sky.join()+h;
 if(!sk||sk.key!==key){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,pal.sky[0]);g.addColorStop(1,pal.sky[1]);sk={key,g};skyCache.set(c,sk)}
 c.fillStyle=sk.g;c.fillRect(0,0,w,h);
 // Moon / aurora glow and far floating islands (parallax 0.2).
 const mr=Math.min(w,h)*.13;c.save();c.translate(w*.74,h*.2);c.globalAlpha=.22;c.fillStyle=pal.mist;c.beginPath();c.arc(0,0,mr,0,TAU);c.fill();c.globalAlpha=.07;c.beginPath();c.arc(0,0,mr*1.6,0,TAU);c.fill();c.globalAlpha=.04;c.beginPath();c.arc(0,0,mr*2.4,0,TAU);c.fill();c.restore();
 const isl=root.MongyuEndless?.islands?.();if(isl){c.save();c.translate(w*.5-run.cam.x*scale*.2,h*.5-run.cam.y*scale*.2);c.scale(scale*.9,scale*.9);c.globalAlpha=.13;c.fillStyle=pal.mist;c.fill(isl);c.globalAlpha=.07;c.scale(1.5,1.5);c.translate(90,120);c.fill(isl);c.restore()}
 c.translate(cx,cy);c.scale(scale,scale);
 run.view={cx,cy,scale};
 // Pillars fade into the mist.
 for(const p of ART.pillars){const a=project([p.x0,p.top,p.z1]),b=project([p.x1,p.top-280,p.z0]);if(!inView(view,a,b,40))continue;pillar(c,p,pal.arch,pal.mist)}
 // Lit windows on pillars (gold glow when the course is complete).
 const lit=midAct?0:run.outro?.kind==='clear'?clamp(run.outro.age/1.2,0,1):run.state==='clear'?1:0;
 for(const wd of ART.windows){const p=project([wd.x,wd.y,wd.z]);if(p.x<view.l-20||p.x>view.r+20||p.y<view.t-20||p.y>view.b+20)continue;
  c.fillStyle=lit>0?k.tapDeep:'rgba(20,12,36,.45)';c.globalAlpha=lit>0?.35+.6*lit:1;c.beginPath();c.moveTo(p.x-1.5,p.y-6.5);c.lineTo(p.x+1.5,p.y-8.2);c.lineTo(p.x+1.5,p.y+2);c.lineTo(p.x-1.5,p.y+3.7);c.closePath();c.fill()}
 c.globalAlpha=1;
 // Walkway sides, then tops (joins read as one continuous path).
 for(const s of ART.sides){const [x0,x1,y0,y1,z0,z1]=s.box,a=project([x0,y1,z1]),b=project([x1,y0,z0]);if(!inView(view,a,b))continue;boxSides(c,x0,x1,y0,y1,z0,z1,pal.arch)}
 for(const s of ART.tops){const [x0,x1,y1,z0,z1]=s.box,a=project([x0,y1,z1]),b=project([x1,y1,z0]);if(!inView(view,a,b))continue;boxTop(c,x0,x1,y1,z0,z1,s.step?pal.arch[0]:pal.arch[0]);
  if(s.step){c.strokeStyle=pal.arch[2];c.globalAlpha=.6;c.lineWidth=.9;const e=project([x1,y1,z1]),f=project([x1,y1,z0]);c.beginPath();c.moveTo(e.x,e.y);c.lineTo(f.x,f.y);c.stroke();c.globalAlpha=1}}
 // Rails: a thin pale line along each walkway's front edge.
 c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=.8;
 for(const wk of COURSE.walks){if(wk.kind==='stair')continue;const [x0,x1,,y1,z0,z1]=walkBox(wk),a=project([x0,y1,z1]),b=project([x1,y1,z1]);if(!inView(view,a,b))continue;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke()}
 // Rotating bridges with gold markers.
 const active=run.activeGap?.();
 for(const g of COURSE.gaps){
  const a=project(g.start),b=project(g.end);if(!inView(view,a,b,120))continue;
  const progress=run.turnProgress(g.index),theta=gapTheta(g,progress);
  armBox(c,g,theta,pal.arch,progress>=ALIGNED?pal.arch[0]:lerpColor(pal.arch[1],pal.arch[0],.5),progress>=1);
  // Pivot disc and gold marker.
  const top=project([g.pivot[0],g.pivot[1]+.5,g.pivot[2]]),used=run.turns[g.index]!==null,isActive=active===g;
  c.save();c.translate(top.x,top.y);c.scale(1,.5);
  c.beginPath();c.arc(0,0,8,0,TAU);if(used){c.strokeStyle=pal.arch[1];c.globalAlpha=.7;c.lineWidth=1.2;c.stroke();c.globalAlpha=1}else{c.fillStyle=k.tapDeep;c.fill()}
  if(!used){const pulse=reduced?0:Math.sin(t*5);c.lineWidth=2;c.strokeStyle=k.tap;c.globalAlpha=.55+.3*pulse;c.beginPath();c.arc(0,0,12+pulse*1.5,0,TAU);c.stroke();
   if(isActive&&!reduced){const r=(t*.9)%1;c.globalAlpha=.7*(1-r);c.beginPath();c.arc(0,0,12+r*18,0,TAU);c.stroke()}}
  c.restore();c.globalAlpha=1;
  if(!used){
   const bob=reduced?0:Math.sin(t*2.4+g.index)*2.5,mk={x:top.x,y:top.y-26+bob};
   c.save();c.translate(mk.x,mk.y);c.rotate(Math.PI/4);c.globalAlpha=isActive?1:.7;c.fillStyle=k.tap;c.fillRect(-4.6,-4.6,9.2,9.2);c.strokeStyle='#fff8e4';c.lineWidth=1;c.strokeRect(-7,-7,14,14);c.restore();
   c.globalAlpha=isActive?.32:.14;c.fillStyle=k.tapDeep;c.fillRect(top.x-.7,mk.y+6,1.4,top.y-mk.y-8);c.globalAlpha=1;
   // Edge ring where the path breaks.
   c.save();c.translate(a.x,a.y);c.scale(1,.5);c.strokeStyle=k.tap;c.globalAlpha=isActive?.8:.35;c.lineWidth=1.4;c.beginPath();c.arc(0,0,9,0,TAU);c.stroke();c.restore();c.globalAlpha=1;
   if(isActive&&run.slowChance==='active')finger(c,top.x+2,top.y-2,t,reduced);
  }
  if(run.turnFlash>0&&g.index===run.gapIndex&&t-run.turnFlash<.6){const age=(t-run.turnFlash)/.6;c.save();c.translate(top.x,top.y);c.scale(1,.5);c.globalAlpha=(1-age)*.8;c.strokeStyle=k.tap;c.lineWidth=2.5;c.beginPath();c.arc(0,0,10+age*60,0,TAU);c.stroke();c.restore();c.globalAlpha=1}
 }
 // Coral blocks.
 for(let i=0;i<COURSE.blocks.length;i++){
  const b=COURSE.blocks[i],p=project(b.p);if(p.x<view.l-30||p.x>view.r+30)continue;
  const x=b.p[0],y=b.p[1],z=b.p[2],crashed=run.crash?.kind==='block'&&Math.abs(run.crash.s-b.at)<1;
  boxSides(c,x-BLOCK,x+BLOCK,y,y+BLOCK_H,z-BLOCK,z+BLOCK,[k.danger,crashed?'#fff2ea':k.danger,k.dangerSide]);
  boxTop(c,x-BLOCK,x+BLOCK,y+BLOCK_H,z-BLOCK,z+BLOCK,k.dangerTop);
  const f=project([x+BLOCK,y+BLOCK_H*.62,z]);c.strokeStyle=k.dangerLine;c.globalAlpha=.6;c.lineWidth=.7;c.beginPath();c.moveTo(f.x,f.y-3);c.lineTo(f.x,f.y+3);c.stroke();c.globalAlpha=1;
 }
 // Gold shards.
 for(let i=0;i<COURSE.shards.length;i++){
  if(run.shards[i])continue;const sh=COURSE.shards[i],p=project(sh.p);if(p.x<view.l-20||p.x>view.r+20)continue;
  if(sh.kind==='gap'&&run.turnProgress(sh.gap)<ALIGNED)continue;
  if(root.MongyuItems?.drawLight?.(c,p.x,p.y,19,t,i,reduced,0))continue;
  c.save();c.translate(p.x,p.y+(reduced?0:Math.sin(t*2+i)*1.5));c.rotate(Math.PI/4+(reduced?0:t*1.4));c.fillStyle=k.tap;c.fillRect(-3,-3,6,6);c.restore();
 }
 // R105 pickups: moon bubble, starlight hourglass, cloud feather, memory star.
 if(run.itemList?.length)root.MongyuItems.drawItems(c,run,it=>{const q=point(it.at,COURSE);if(q.x<view.l-30||q.x>view.r+30)return null;return {x:q.x,y:q.y-(it.lane==='hi'?46:21),s:1}},t,reduced,0);
 // Finish gate: aurora curtains rising from the last walkway's end.
 aurora(c,project(COURSE.walks[COURSE.walks.length-1].p1),run,reduced);
 // Runner (falls into the mist when a bridge was not turned).
 let alpha=1;
 if(run.crash?.kind==='fall'&&run.outro){const age=run.outro.age,dir=me.seg.b.x>me.seg.a.x?1:1;actor={x:actor.x+age*SPEED*.6*dir,y:actor.y+age*age*320};alpha=1-clamp(age/FAIL_OUTRO,0,1)*.8}
 if(run.outro?.kind==='clear')alpha=1-clamp(run.outro.age/.8,0,1);
 c.globalAlpha=.45*alpha;c.fillStyle='#fff6dc';c.beginPath();c.ellipse(me.x,me.y,6,2.2,0,0,TAU);if(!run.crash)c.fill();c.globalAlpha=alpha;
 const pose=run.crash?(run.crash.kind==='fall'?'jump':'hurt'):run.intro>0?'stand':run.flight!==null?'jump':'run';
 if(root.MongyuMobile?.sprite)root.MongyuMobile.sprite(c,{x:actor.x,y:actor.y-1,bodyHeight:42,renderAngle:0,strideDistance:run.distance,nativeState:0,height:run.height,jumpProgress:run.flight===null?0:run.flight/run.fl,pose},{poseTime:t,onDark:true},reduced);
 c.globalAlpha=1;
 if(run.mods&&!run.outro)root.MongyuItems.drawAura(c,run,actor.x,actor.y-21,27,t,reduced);
 if(!reduced&&run.time-run.crossedAt<.3){const age=(run.time-run.crossedAt)/.3;c.globalAlpha=1-age;c.fillStyle=k.tap;for(let i=0;i<6;i++){const a=i*Math.PI/3;c.fillRect(actor.x+Math.cos(a)*(9+age*18)-1.2,actor.y-18+Math.sin(a)*(9+age*18)-1.2,2.4,2.4)}c.globalAlpha=1}
 c.restore();
 // Completion bloom.
 if(lit>0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.12*lit;c.fillStyle=pal.mist;c.fillRect(0,0,w,h);c.restore()}
 if(!run.chained)hud(c,run,w,h,k);
 return null;
}
const HAND=(()=>{if(typeof Path2D==='undefined')return null;return new Path2D('M-2.3 0V-11.6a2.3 2.3 0 0 1 4.6 0V-5.2a2 2 0 0 1 3.8 .4a2 2 0 0 1 3.7 .6a1.9 1.9 0 0 1 3.5 1V3.4c0 3.6-2.6 6.4-6.2 6.4H1.6c-2 0-3.4-.9-4.6-2.4L-6.6 2.6a1.9 1.9 0 0 1 2.9-2.4z')})();
function finger(c,x,y,t,reduced){
 if(!HAND)return;const cycle=reduced?.75:(t*.95)%1,press=reduced?0:Math.max(0,Math.sin(cycle*Math.PI*2))*3;
 c.save();c.translate(x+8,y+10-press);c.rotate(-.35);c.lineJoin='round';c.lineWidth=2.4;c.strokeStyle='rgba(32,20,56,.5)';c.stroke(HAND);c.fillStyle='#fff7ec';c.fill(HAND);c.lineWidth=.7;c.strokeStyle='#ffcfae';c.stroke(HAND);c.restore();
}
const CURTAINS=[[-22,15,200,'127,243,225',0],[-8,18,240,'138,184,255',1.7],[7,17,220,'183,140,255',3.1],[21,14,186,'255,158,216',4.4]];
const auroraInks=new WeakMap();
function aurora(c,p,run,reduced){
 const FINISH=run.cs.FINISH;
 let ink=auroraInks.get(c);
 if(!ink){ink=CURTAINS.map(([,,height,rgb])=>{const g=c.createLinearGradient(0,0,0,-height);g.addColorStop(0,'rgba(255,252,240,.9)');g.addColorStop(.06,'rgba('+rgb+',.8)');g.addColorStop(.35,'rgba('+rgb+',.32)');g.addColorStop(1,'rgba('+rgb+',0)');return g});auroraInks.set(c,ink)}
 const near=clamp((run.distance-(FINISH-700))/500,0,1),outro=run.outro?.kind==='clear'?clamp(run.outro.age/.6,0,1):run.state==='clear'?1:0,strength=.45+.4*near+.3*outro,t=(reduced?.2:1)*run.clock;
 c.save();c.translate(p.x,p.y);c.globalCompositeOperation='lighter';
 for(let i=0;i<CURTAINS.length;i++){
  const [x,width,height,,phase]=CURTAINS[i];c.fillStyle=ink[i];c.globalAlpha=Math.min(1,strength*(.65+.2*Math.sin(t*1.3+phase)));
  c.beginPath();const n=12;
  for(let j=0;j<=n;j++){const u=j/n,sway=Math.sin(j*.45+t*1.1+phase)*8*u,half=width*.5*(1-.4*u);c[j?'lineTo':'moveTo'](x+sway-half,-height*u*(1+outro*.3))}
  for(let j=n;j>=0;j--){const u=j/n,sway=Math.sin(j*.45+t*1.1+phase)*8*u,half=width*.5*(1-.4*u);c.lineTo(x+sway+half,-height*u*(1+outro*.3))}
  c.closePath();c.fill();
 }
 c.globalAlpha=Math.min(1,strength);c.fillStyle='rgba(255,250,236,.85)';c.fillRect(-24,-1,48,1.6);
 c.restore();
}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function hud(c,run,w,h,k){
 const {COURSE,FINISH}=run.cs,SECTIONS=run.sections;
 if(run.state==='fail'||run.state==='clear')return;
 const fade=run.outro?1-Math.min(1,run.outro.age/.35):1;if(fade<=0)return;
 c.save();c.globalAlpha=fade;c.textAlign='center';const top=Math.max(14,h*.035);
 c.font='600 11px system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(20,12,36,.6)';c.strokeText('착시 정원 · '+SECTIONS[run.section].name,w/2,top+10);c.fillStyle='rgba(255,243,226,.85)';c.fillText('착시 정원 · '+SECTIONS[run.section].name,w/2,top+10);
 c.font='800 40px system-ui,sans-serif';c.lineWidth=5;c.strokeStyle='rgba(20,12,36,.55)';c.strokeText(String(run.score),w/2,top+52);c.fillStyle='#fff3d6';c.fillText(String(run.score),w/2,top+52);
 const coach=run.coach&&run.time<run.coach.until?run.coach.text:'';
 if(coach&&run.state==='play'){c.font='700 16px system-ui,sans-serif';const tw=Math.min(w-48,c.measureText(coach).width+36),y=h*.74;rr(c,w/2-tw/2,y-19,tw,38,19);c.fillStyle='rgba(26,19,48,.66)';c.fill();c.strokeStyle='rgba(255,236,255,.16)';c.lineWidth=1;c.stroke();c.fillStyle='#fbf4ff';c.fillText(coach,w/2,y+6)}
 // Progress gauge with bridge notches and the aurora gate at the end.
 const gy=h*.86,gw=Math.min(w*.7,320),x0=w/2-gw/2,frac=run.distance/FINISH;
 rr(c,x0,gy,gw,6,3);c.fillStyle='rgba(255,255,255,.12)';c.fill();rr(c,x0,gy,Math.max(6,gw*frac),6,3);c.fillStyle='#bfe9ff';c.fill();
 for(const g of COURSE.gaps){const x=x0+gw*g.s0/FINISH;c.save();c.translate(x,gy+3);c.rotate(Math.PI/4);c.fillStyle=run.turns[g.index]!==null?k.tapDeep:'rgba(255,255,255,.4)';c.fillRect(-3.2,-3.2,6.4,6.4);c.restore()}
 c.restore();
}
const api=Object.freeze({enabled,IllusionRun,COURSE,FINISH,SPEED,FLIGHT,PEAK,WINDOW,TURN,ALIGNED,BLOCK,BLOCK_H,FOOT,point,project,draw,SECTIONS,COACH,makeCourse,build});
root.MongyuIllusion=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
