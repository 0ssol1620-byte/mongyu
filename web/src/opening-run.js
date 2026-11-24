/* 몽유's authored opening route. Positions are arc lengths along the running surface. */
(function(root){'use strict';
const stageEdition=root.MONGYU_STAGE_EDITION===true;
const dreamEdition=root.MONGYU_DREAM_EDITION===true;
const spectralEdition=root.MONGYU_SPECTRAL_EDITION===true;
const COURSE='folded-light',FINISH=1180,RADIUS=44,FLOOR=340,WALL=310,ARC=Math.PI*RADIUS/2;
const WALL_START=FLOOR+ARC,CEILING_START=WALL_START+WALL+ARC;
const SECTIONS=[
 {name:'바닥',start:0,back:'#201831',far:'#805488',track:'#ffb083'},
 {name:'벽',start:WALL_START,back:'#252044',far:'#8e63b4',track:'#e9b2ff'},
 {name:'천장',start:CEILING_START,back:'#162d3b',far:'#4f92a3',track:'#9be8da'}
].map(Object.freeze);
const OBSTACLES=[
 [158,12,17],[283,13,23],[532,12,18],[646,14,23],[926,13,21],[1062,15,25]
].map(([at,width,height],index)=>Object.freeze({at,width,height,section:Math.floor(index/2)}));
Object.freeze(SECTIONS);Object.freeze(OBSTACLES);
const SPEED=122,FLIGHT=.66,PEAK=46,FOOT=5,BUFFER=.09,CLEAN_BONUS=10;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
/* R104 polish timing. Perfect = takeoff lead puts the jump apex (SPEED*FLIGHT/2 ≈ 40.3 ahead) within ±10 units (≈82ms) of the obstacle centre. */
const PERFECT_LEAD=SPEED*FLIGHT/2,PERFECT_TOLERANCE=10,HIT_STOP=.12,CRASH_OUTRO=.72,CLEAR_OUTRO=2.3,FINISH_SLOW=18,FINISH_SCALE=.35;
const CHAIN_ENDS=[FLOOR+8,WALL_START+WALL+8,FINISH],CHAIN_BONUS=150;
const SLOW_START=70,SLOW_HOLD=20,SLOW_SCALE=.25,SLOW_QUEUE=56,FINISH_BONUS=500;
const COACH=Object.freeze({slow:'지금 탭!',wall:'벽도 바닥이야',perfect:'완벽!',early:'조금 일찍 눌렀어. 장애물 바로 앞에서!',late:'한 박자 늦었어. 조금만 더 빨리!'});
const reducedMotion=()=>{try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}};
function surface(s){
 if(s<=FLOOR)return {x:s,y:0,a:0};
 if(s<WALL_START){const angle=(s-FLOOR)/RADIUS;return {x:FLOOR+RADIUS*Math.sin(angle),y:RADIUS*(Math.cos(angle)-1),a:-angle}}
 if(s<=WALL_START+WALL)return {x:FLOOR+RADIUS,y:-RADIUS-s+WALL_START,a:-Math.PI/2};
 if(s<CEILING_START){const angle=(s-WALL_START-WALL)/RADIUS;return {x:FLOOR+RADIUS*Math.cos(angle),y:-RADIUS-WALL-RADIUS*Math.sin(angle),a:-Math.PI/2-angle}}
 return {x:FLOOR-s+CEILING_START,y:-WALL-2*RADIUS,a:-Math.PI};
}
function offset(p,h){return {x:p.x+Math.sin(p.a)*h,y:p.y-Math.cos(p.a)*h}}
function sectionAt(s){return s>=CEILING_START?2:s>=WALL_START?1:0}
/* Beat grid for chained acts: obstacle positions become multiples of one beat (SPEED*60/bpm) from the act start, at least two beats in. */
function gridObstacles(bpm,start){
 const beat=SPEED*60/clamp(bpm,40,240);let last=-1;
 return OBSTACLES.map(o=>{const n=Math.max(2,Math.round((o.at-start)/beat),last+1);last=n;return Object.freeze({...o,at:start+n*beat})});
}
function obstacleHeight(o,gap){
 const relative=Math.max(0,Math.abs(gap)-FOOT)/o.width;
 return o.height*clamp((1-relative)/.72,0,1);
}

class OpeningRun{
 constructor(options){
  this.options=options;this.openingCourse=true;this.mode='restoration';this.slot=options.slot;
  this.trip=root.MONGYU_UI_EDITION===true&&root.MongyuTrip&&root.MongyuTrip.face?(options.trip||'violet'):null;   // R105 TR: dark psychedelic look
  this.settings={...options.settings};this.attempt=options.attempt;this.practice=options.practice===true;this.rubber=options.rubber===true;   // R105 POL: chapter 2 rubber floor (visual squash, see rubberSquash)
  /* R105 chain: this run is one act of a CourseRun. options.span=[a,b] runs sections a..b (floor=0, wall=1, ceiling=2); obstacles snap to the chain.bpm beat grid. */
  const chain=options.chain||null,span=chain?[clamp(Math.trunc(options.span?.[0]??0),0,2),clamp(Math.trunc(options.span?.[1]??2),0,2)]:null;
  if(span&&span[1]<span[0])span[1]=span[0];
  this.chain=chain;this.span=span;this.endAt=span?CHAIN_ENDS[span[1]]:FINISH;this.midAct=!!chain&&chain.last===false;
  this.obstacles=chain&&chain.bpm?gridObstacles(chain.bpm,SECTIONS[span[0]].start):OBSTACLES;
  this.checkpoint=this.practice?clamp(Math.trunc(options.section||0),0,2):span?span[0]:0;
  this.familyIndex=0;this.state='ready';this.time=0;this.updates=0;this.inputCount=0;
  this.score=0;this.clean=0;this.jumps=0;this.hits=0;this.hearts=1;
  this.flight=null;this.buffer=0;this.held=false;this.events=[];
  this.distance=SECTIONS[this.checkpoint].start;
  this.firstIndex=this.checkpoint*2;
  this.endIndex=this.practice?this.firstIndex+2:span?span[1]*2+2:OBSTACLES.length;
  this.index=this.firstIndex;this.mapChanges=sectionAt(this.distance);
  this.height=0;this.result=null;this.crossedAt=-10;this.lastJump=-Infinity;
  this.polish=root.MONGYU_POLISH_EDITION===true;
  if(this.polish){
   this.clock=0;this.hitStop=0;this.outro=null;this.timeScale=1;this.coach=null;this.perfectStreak=chain?.carry?.perfectStreak||0;this.bestStreak=0;this.points=chain?.carry?.points||0;this.wallCoached=!!chain&&chain.first===false;
   if(chain)this.score=this.points;
   this.tutorial=!this.practice&&(chain?options.tutorial===true:options.attempt===1||options.tutorial===true);this.slowChance=this.tutorial?'pending':'off';
   this.pose=undefined;this.poseAt=0;this.saves=[];
   const resume=!this.practice&&options.resume;
   if(resume){
    /* Checkpoint retry: the run resumes as if it had just reached the start of section k, so distance===time*SPEED still holds for validResult. */
    const k=clamp(Math.trunc(resume.section)||0,0,2),index=k*2,int=(v,max)=>Number.isInteger(v)?clamp(v,0,max):0;
    this.resumed=k;this.distance=SECTIONS[k].start;this.time=this.distance/SPEED;this.index=index;this.mapChanges=k;
    this.clean=int(resume.clean,index);this.jumps=Math.max(index,int(resume.jumps,30));this.points=int(resume.points,1e6);this.bestStreak=int(resume.bestStreak,6);
    this.score=this.points+Math.floor(this.distance);this.wallCoached=k>0;this.tutorial=false;this.slowChance='off';
   }
   this.saves[sectionAt(this.distance)]=this.snapshot();
  }
  /* R105 items: fl/pk = length and peak factor of the current jump (feather doubles it); run.mods/itemList come from MongyuItems.setup. */
  this.fl=FLIGHT;this.pk=1;
  if(this.polish&&(chain||options.items))root.MongyuItems?.setup?.(this,{items:options.items,start:SECTIONS[this.checkpoint].start,len:this.endAt-SECTIONS[this.checkpoint].start,beat:SPEED*60/clamp(chain?.bpm||100,40,240)});
  this.setViewport(options.viewport?.width,options.viewport?.height);
 }
 setViewport(width=390,height=844){this.viewport={width,height}}
 start(){this.state='play';return true}
 pause(){if(this.state!=='play')return false;this.state='pause';this.cancelInput();this.events.push('pause');return true}
 resume(){if(this.state!=='pause')return false;this.state='play';return true}
 inputDown(){if(this.held||this.state!=='play')return false;this.held=true;return this.action()}
 inputUp(){this.held=false}
 cancelInput(){this.held=false;this.buffer=0}
 action(){
  if(this.state!=='play'||this.recoverAt!==undefined)return false;
  if(this.polish&&(this.outro||this.hitStop>0))return false;
  this.inputCount++;
  if(this.flight!==null){if(this.flight>=this.fl-BUFFER)this.buffer=BUFFER;return false}
  if(this.polish&&this.slowChance==='active'){
   if(this.distance<this.obstacles[0].at-SLOW_QUEUE){this.slowChance='queued';return true}
   this.slowChance='done';
  }
  return this.jump();
 }
 jump(){this.fl=root.MongyuItems?.applyJump?root.MongyuItems.applyJump(this,FLIGHT):FLIGHT;this.flight=0;this.lastJump=this.distance;this.jumps++;this.buffer=0;this.events.push('jump');return true}
 drainEvents(){return this.events.splice(0)}
 /* R105: settle() applies the surge x2 and its trigger after every tick, whichever way tick0 returns. */
 tick(dt){this.tick0(dt);if(this.mods)root.MongyuItems.settle(this)}
 tick0(dt){
  if(this.state!=='play')return;
  this.updates++;
  if(this.polish&&!(dt=this.pace(dt)))return;
  this.time+=dt;
  if(this.recoverAt!==undefined){
   if(this.time<this.recoverAt)return;
   this.recoverAt=undefined;this.crash=null;
   this.distance=SECTIONS[this.checkpoint].start;this.index=this.firstIndex;
   this.score=0;this.clean=0;this.lastJump=-Infinity;
   this.height=0;this.flight=null;this.buffer=0;this.crossedAt=-10;
   if(this.polish){this.points=0;this.perfectStreak=0;this.pose=undefined;this.poseAt=this.clock}
  }
  const step=(this.practice ? .78 : 1)*dt;
  this.distance=Math.min(this.endAt,this.distance+SPEED*step);
  this.buffer=Math.max(0,this.buffer-step);
  if(this.flight!==null){
   this.flight+=step;
   const phase=Math.min(1,this.flight/this.fl);
   this.height=4*PEAK*this.pk*phase*(1-phase);
   if(phase===1){this.flight=null;this.events.push('land');if(this.buffer>0)this.jump()}
  }
  if(this.polish)this.coachCourse();
  if(this.mods)root.MongyuItems.collect(this,this.distance,this.height,PEAK,10);
  const sector=sectionAt(this.distance);
  if(this.polish&&!this.saves[sector])this.saves[sector]=this.snapshot();
  if(sector!==this.mapChanges){this.mapChanges=sector;this.events.push('corner')}
  const obstacle=this.obstacles[this.index];
  if(obstacle){
   const gap=this.distance-obstacle.at,reach=obstacle.width+FOOT;
   if(this.height<obstacleHeight(obstacle,gap)){
    if(this.mods&&root.MongyuItems.applyHit(this)){this.index++;this.crossedAt=this.time;this.perfectStreak=0;return}
    this.hits++;this.crash={index:this.index,section:sector,at:this.distance,early:obstacle.at-this.lastJump>55&&obstacle.at-this.lastJump<98};
    this.events.push('hit');
    if(this.polish){
     this.perfectStreak=0;this.hitStop=reducedMotion()?0:HIT_STOP;this.setCoach(this.crash.early?'early':'late',3.5);this.pose='hurt';this.poseAt=this.clock;
     if(!this.practice){this.hearts=0;this.outro={kind:'fail',age:0,duration:CRASH_OUTRO};return}
    }
    if(this.practice){this.recoverAt=this.time+.45;return}
    this.hearts=0;this.finish('fail');return;
   }
   if(gap>reach){
    this.index++;this.crossedAt=this.time;
    const clean=this.height>=obstacle.height+6;
    if(clean)this.clean++;
    if(this.polish)this.scorePass(obstacle,clean);
    else{this.score+=100+(clean?CLEAN_BONUS:0);this.events.push(clean?'perfect':'pass')}
   }
  }
  if(this.polish)this.score=this.points+Math.floor((this.distance-SECTIONS[this.checkpoint].start)/(this.chain?10:1));
  if(this.polish&&!this.practice&&this.distance>=this.endAt&&this.midAct){this.points+=CHAIN_BONUS;this.score+=CHAIN_BONUS;this.finish('clear');return}
  if(this.polish&&!this.practice&&this.distance>=this.endAt){
   this.points+=FINISH_BONUS;this.score+=FINISH_BONUS;this.outro={kind:'clear',age:0,duration:CLEAR_OUTRO};this.pose='joy';this.poseAt=this.clock;return;
  }
  if(this.distance>=this.endAt||this.practice&&this.index===this.endIndex)this.finish('clear');
 }
 /* R104: real-time pacing on top of the simulation clock. Returns the simulated step (0 = frozen this tick).
    run.time only advances by simulated steps, so distance===time*SPEED still holds for validResult. */
 pace(dt){
  this.clock+=dt;
  if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);return 0}
  if(this.outro){this.outro.age+=dt;if(this.outro.age>=this.outro.duration&&this.state==='play')this.finish(this.outro.kind);return 0}
  const first=this.obstacles[0];let target=1;
  if(this.slowChance==='pending'&&this.index===0&&this.distance>=first.at-SLOW_START)this.slowChance=this.flight===null?'active':'done';
  if(this.slowChance==='active'){target=SLOW_SCALE;this.setCoach('slow',.5)}
  if(!this.practice&&!this.midAct&&this.index===this.endIndex&&this.distance>=this.endAt-FINISH_SLOW&&!reducedMotion())target=FINISH_SCALE;
  this.timeScale+=(target-this.timeScale)*Math.min(1,dt*(target<this.timeScale?9:7));
  if(Math.abs(target-this.timeScale)<.004)this.timeScale=target;
  let step=dt*this.timeScale;
  if(this.slowChance==='active')step=clamp((first.at-SLOW_HOLD-this.distance)/SPEED,0,step);
  return this.mods?root.MongyuItems.applyPace(this,step):step;
 }
 setCoach(kind,hold){this.coach={kind,text:COACH[kind],until:this.time+hold}}
 coachCourse(){
  if(this.slowChance==='queued'&&this.distance>=this.obstacles[0].at-SLOW_QUEUE){this.slowChance='done';if(this.flight===null)this.jump()}
  if(!this.wallCoached&&!this.practice&&this.distance>=FLOOR&&this.distance<WALL_START&&(!this.coach||this.time>=this.coach.until||this.distance>=WALL_START-30)){this.wallCoached=true;this.setCoach('wall',1.5)}
 }
 scorePass(obstacle,clean){
  const lead=obstacle.at-this.lastJump,perfect=Math.abs(lead-SPEED*this.fl/2)<=PERFECT_TOLERANCE;
  this.perfectStreak=perfect?this.perfectStreak+1:0;this.bestStreak=Math.max(this.bestStreak,this.perfectStreak);
  this.points+=100+(clean?CLEAN_BONUS:0)+(perfect?50*Math.min(5,this.perfectStreak):0);
  if(perfect)this.setCoach('perfect',.7);
  this.events.push(perfect?'perfect':'pass');
 }
 /* R104 checkpoint: section-start snapshot used by retryFromCheckpoint. */
 snapshot(){return {section:sectionAt(this.distance),index:this.index,clean:this.clean,jumps:this.jumps,points:this.points||0,bestStreak:this.bestStreak||0}}
 checkpointRun(){
  if(!this.polish||this.practice||this.state!=='fail'||!this.crash)return null;
  const k=this.crash.section,save=this.saves[k]||this.saves[0]||{section:0,index:0,clean:0,jumps:0,points:0};
  return new OpeningRun({...this.options,attempt:this.attempt+1,practice:false,section:0,tutorial:false,viewport:{...this.viewport},resume:{...save,section:save===this.saves[k]?k:0}});
 }
 /* Restart from the start of the crashed section (score as it was there) as a fresh run through the host, so results/completion work as for any new run. */
 retryFromCheckpoint(event){
  let run=this;for(let n=0;run.successor&&n<64;n++)run=run.successor;
  const next=run.checkpointRun(),host=root.MongyuPolish?.host;
  if(!next||typeof host?.startRun!=='function')return false;
  run.successor=next;host.startRun(next,event);return true;
 }
 finish(state){
  this.state=state;
  if(this.polish&&state==='clear'&&this.pose!=='joy'){this.pose='joy';this.poseAt=this.clock}
  this.result={runVersion:97,mode:this.mode,slotId:this.slot.id,ruleId:this.slot.ruleId,
   completed:true,practice:this.practice,state,attempt:this.attempt,time:this.time,
   hits:this.hits,score:this.polish?(this.index-this.firstIndex)*100+this.clean*CLEAN_BONUS:this.score,jumps:this.jumps,kicks:0,mapChanges:this.mapChanges,
   bestCombo:this.index-this.firstIndex,
   openingProof:{course:COURSE,passed:this.index,clean:this.clean,distance:this.distance},
   reason:this.crash?SECTIONS[this.crash.section].name+' '+(this.crash.index%2+1)+'번째 장애물에서 충돌':'빛의 문을 통과했어요.'};
  if(this.chain)Object.assign(this.result,{points:this.points,perfectStreak:this.perfectStreak,shards:this.index-this.firstIndex,shardTotal:this.endIndex-this.firstIndex});
  this.events.push(state);
 }
 status(){
  const section=SECTIONS[this.mapChanges],crash=this.crash;
  const prompt=crash&&this.practice?'잠시 후 '+section.name+' 처음부터':this.time-this.crossedAt<.65?'빛 회수':this.index===this.firstIndex?'장애물 앞에서 탭':this.distance>=FLOOR&&this.distance<WALL_START+72?'벽에서도 같은 타이밍으로 탭':'';
  return {mode:this.mode,state:this.state,time:this.time,hearts:this.hearts,score:this.score,best:0,
   progress:this.chain?clamp((this.distance-SECTIONS[this.checkpoint].start)/(this.endAt-SECTIONS[this.checkpoint].start),0,1):this.distance/FINISH,roomTitle:'접힌 빛',roomIndex:this.mapChanges,roomCount:SECTIONS.length,
   instruction:'탭하여 점프 · 빛 '+this.index+' / '+OBSTACLES.length,
   cue:prompt?{id:'opening',text:prompt}:null,result:this.result,
   opening:{section:section.name,passed:this.index-this.firstIndex,total:this.endIndex-this.firstIndex,clean:this.clean,
    practice:this.practice,crash}};
 }
}

function validResult(slot,r){
 const p=r.openingProof;
 if(!p||p.course!==COURSE||slot?.number!==2||r.slotId!==slot.id||r.ruleId!==slot.ruleId||
  r.mode!=='restoration'||r.nativeRuntime||r.freePlay||r.practice===true||r.completed!==true||!['fail','clear'].includes(r.state)||
  !Number.isInteger(r.attempt)||r.attempt<1||r.attempt>1000000||
  !Number.isFinite(r.time)||r.time<=0||r.time>FINISH/SPEED+1||
  !Number.isInteger(p.passed)||p.passed<0||p.passed>OBSTACLES.length||
  !Number.isInteger(p.clean)||p.clean<0||p.clean>p.passed||
  !Number.isInteger(r.jumps)||r.jumps<p.passed||r.jumps>30||
  !Number.isFinite(p.distance)||p.distance<0||p.distance>FINISH||
  Math.abs(Math.min(FINISH,r.time*SPEED)-p.distance)>SPEED/60||
  r.mapChanges!==sectionAt(p.distance)||r.score!==p.passed*100+p.clean*CLEAN_BONUS)return false;
 if(r.state==='clear')return r.time>=FINISH/SPEED-.001&&p.passed===OBSTACLES.length&&p.distance===FINISH&&r.hits===0;
 const obstacle=OBSTACLES[p.passed];
 return !!obstacle&&Math.abs(obstacle.at-p.distance)<=obstacle.width+FOOT&&r.hits===1;
}

const PATH_POINTS=Array.from({length:133},(_,i)=>surface(-244+i*12));
function ellipse(c,x,y,rx,ry,ink){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=ink;c.fill()}
function path(c,points){
 c.beginPath();c.moveTo(points[0].x,points[0].y);
 for(let i=1;i<points.length;i++)c.lineTo(points[i].x,points[i].y);
}
const GLOW_TRACK=PATH_POINTS.map(p=>offset(p,-2));
const SHELF=PATH_POINTS.map(p=>offset(p,-16));
const RAIL=PATH_POINTS.map(p=>offset(p,-6));
const MARKS=Array.from({length:54},(_,i)=>{
 const p=surface(-55+i*24);
 return [offset(p,-5),offset(p,-12)];
});
const trackPaths=new Map();
function rails(visible){
 if(trackPaths.has(visible))return trackPaths.get(visible);
 const paths=[SHELF,RAIL,GLOW_TRACK].map(points=>{
  const shape=new Path2D();
  shape.moveTo(points[0].x,points[0].y);
  for(let i=1;i<visible;i++)shape.lineTo(points[i].x,points[i].y);
  return shape;
 });
 const ticks=new Path2D();
 for(let i=0;i<MARKS.length&&i*24<visible*12-220;i++){
  const [start,end]=MARKS[i];ticks.moveTo(start.x,start.y);ticks.lineTo(end.x,end.y);
 }
 paths.push(ticks);trackPaths.set(visible,paths);return paths;
}
const OBSTACLE_ART=OBSTACLES.map(o=>{
 const p=surface(o.at);
 const points=[[ -o.width,0],[-o.width*.67,o.height*.45],[-2,o.height],[4,o.height],[o.width*.73,o.height*.56],[o.width,0]];
 return {p,points:points.map(([x,y])=>({x:p.x+x*Math.cos(p.a)+y*Math.sin(p.a),y:p.y+x*Math.sin(p.a)-y*Math.cos(p.a)})),shard:offset(p,o.height+26)};
});
let stars=null;
function starField(){
 if(stars)return stars;
 stars=new Path2D();
 for(let i=0;i<42;i++){
  const x=(i*181)%650-140,y=(i*97)%680-530,r=1+(i%4)*.48;
  stars.moveTo(x+r,y);stars.arc(x,y,r,0,Math.PI*2);
 }
 return stars;
}
function waves(run,w,h){
 if(run.waveField?.width===w&&run.waveField.height===h)return run.waveField.paths;
 const low=new Path2D(),high=new Path2D();
 for(let i=0;i<13;i++){
  const y=h*(.38+i*.059),shape=i%4===0?high:low;
  shape.moveTo(-30,y+20);
  shape.bezierCurveTo(w*.18,y-74,w*.45,y+120,w*.74,y+20);
  shape.quadraticCurveTo(w*.88,y-21,w+30,y-47);
 }
 const paths=[low,high];run.waveField={width:w,height:h,paths};return paths;
}
function backdrop(c,owner,w,h,palette,skyX,skyY,drift){
 const aperture=Math.min(w,h);
 c.fillStyle=palette.back;c.fillRect(0,0,w,h);
 ellipse(c,skyX,skyY,aperture*.41,aperture*.44,palette.far+'1a');
 ellipse(c,skyX,skyY,aperture*.36,aperture*.375,palette.far+'4a');
 ellipse(c,skyX-aperture*.062,skyY+aperture*.043,aperture*.30,aperture*.32,palette.back);
 const [low,high]=waves(owner,w,h);
 c.save();c.translate(0,drift);c.lineWidth=1;
 c.strokeStyle=palette.far+'36';c.stroke(low);
 c.strokeStyle=palette.far+'70';c.stroke(high);c.restore();
}
let spectralPaths;
function spectralContours(c,time,scale,intensity,reduced,ambient=false){
 if(!spectralPaths){
  spectralPaths=[.68,.83,1].map(radius=>{
   const stroke=new Path2D();
   for(let i=0;i<=96;i++){
    const a=i*Math.PI/48,r=radius*(1+.088*Math.sin(3*a+.68)+.04*Math.sin(7*a-1.4)+.021*Math.cos(13*a));
    const x=r*Math.cos(a),y=r*Math.sin(a)*1.16;
    if(i===0)stroke.moveTo(x,y);else stroke.lineTo(x,y);
   }
   stroke.closePath();return stroke;
  });
 }
 const strength={calm:.32,balanced:.76,intense:1}[intensity]??.76;
 const drift=reduced?0:Math.sin(time*.48),breath=reduced?0:Math.sin(time*.75);
 const colors=['#46eaf1','#f979df','#ac8cfa'];
 c.save();c.rotate(drift*.019);c.scale(scale*(1+breath*.014),scale*(1+breath*.014));
 c.lineWidth=(ambient ? .65 : .95)/scale;
 for(let i=0;i<spectralPaths.length;i++){
  c.save();c.translate((i-1)*(.023+drift*.006),(i-1)*-.011);
  c.strokeStyle=colors[i];c.globalAlpha=strength*(ambient ? .13 : .37);
  c.stroke(spectralPaths[i]);c.restore();
 }
 c.restore();
}
const lobby={};
function drawLobby(c,opts){
 const {width:w,height:h}=opts.viewport,wide=w>h*1.15,t=opts.reduced?0:opts.time||0;
 const x=wide?w*.72:w*.5,y=wide?h*.61:h*.61,r=Math.min(w*(wide?.19:.34),h*.24);
 c.save();
 if(spectralEdition){
  c.clearRect(0,0,w,h);
  c.save();c.translate(x,wide?h*.52:h*.49);
  spectralContours(c,t,r*1.18,opts.dreamIntensity,opts.reduced);
  c.restore();
 }else backdrop(c,lobby,w,h,SECTIONS[0],x+r*.13,y-r*.63,Math.sin(t*.22)*5);
 c.translate(x,y);
 const floor=[{x:-r*1.6,y:r*.16},{x:r*.63,y:r*.16},{x:r*.92,y:r*.08},{x:r*1.12,y:-r*.23},{x:r*1.28,y:-r*.63}];
 path(c,floor);c.strokeStyle='#100e1e';c.lineJoin='round';c.lineWidth=16;c.stroke();
 c.translate(0,-5);
 if(spectralEdition){
  c.save();c.translate(0,3);path(c,floor);c.lineWidth=1.1;c.strokeStyle='#d568d5';c.stroke();c.restore();
 }
 path(c,floor);c.strokeStyle=spectralEdition?'#76bdd7':'#a06eaf';c.lineWidth=4;c.stroke();
 path(c,floor);c.strokeStyle='#ffc8a4';c.lineWidth=1.4;c.stroke();
 const dust=opts.reduced?0:Math.sin(t*1.6)*5;
 for(let i=0;i<10;i++){
  const py=-r*(.55+(i*13%83)*.016),px=r*((i*47%139)*.018-1.24);
  ellipse(c,px,py+(i%2?dust:-dust)*.65,1+(i%3)*.35,1+(i%3)*.35,i%3===0?'#ffd4a8aa':'#c692bb85');
 }
 c.save();c.translate(r*.64,-r*.58+dust*.65);c.rotate(Math.PI/4+(opts.reduced?0:Math.sin(t*.4)*.18));
 c.strokeStyle='#ffe4b5';c.lineWidth=1.2;c.strokeRect(-8,-8,16,16);
 c.fillStyle='#f7b98e';c.fillRect(-4,-4,8,8);c.restore();
 root.MongyuMobile.sprite(c,{x:-r*.16,y:r*.16-1.5,bodyHeight:r*.87,pose:'stand'},{poseTime:t,onDark:true},!!opts.reduced);
 c.restore();
}
function dialogue(run){
 if(!dreamEdition||run.practice||run.state!=='play'||run.flight!==null)return '';
 if(run.distance>=12&&run.distance<=93&&run.inputCount===0)return '저 빛을 따라가 볼까?';
 if(run.distance>=WALL_START-14&&run.distance<=WALL_START+60)return '벽도 길이 되는구나.';
 if(run.index===6&&run.distance<=FINISH-6)return '찾았다, 빛의 문!';
 return '';
}
/* R104 aurora finish gate: additive curtains rising from the finish line, drawn in the surface's local frame (up = -y). */
const CURTAINS=[[-23,16,206,'79,242,210',0],[-9,19,252,'92,206,255',1.7],[6,18,230,'167,124,255',3.1],[21,15,192,'255,134,214',4.4]];
const auroraInks=new WeakMap();
function auroraInk(c){
 let ink=auroraInks.get(c);if(ink&&ink.tk===TRIPK&&ink.cv===TCVD)return ink;
 const rgbs=TI?[TI.auroraRgb,TI.rimRgb,TI.auroraRgb,TI.glowRgb]:CURTAINS.map(q=>q[3]);   // R105 TR: the trip's own 2-3 hue family, no rainbow
 const curtain=CURTAINS.map(([,,height],ci)=>{const rgb=rgbs[ci],g=c.createLinearGradient(0,0,0,-height);
  g.addColorStop(0,'rgba(255,252,240,.95)');g.addColorStop(.05,'rgba('+rgb+',.85)');g.addColorStop(.3,'rgba('+rgb+',.4)');g.addColorStop(.68,'rgba('+rgb+',.13)');g.addColorStop(1,'rgba('+rgb+',0)');return g});
 const halo=c.createRadialGradient(0,-90,6,0,-90,150);const hr=TI?TI.rimRgb:'150,128,255',hr2=TI?TI.auroraRgb:'86,196,232';halo.addColorStop(0,'rgba('+hr+',.24)');halo.addColorStop(.55,'rgba('+hr2+',.09)');halo.addColorStop(1,'rgba('+hr2+',0)');
 const base=c.createRadialGradient(0,0,0,0,0,36);base.addColorStop(0,'rgba(255,255,244,.95)');const br=TI?TI.auroraRgb:'170,246,232';base.addColorStop(.35,'rgba('+br+',.55)');base.addColorStop(1,'rgba('+br+',0)');
 ink={curtain,halo,base,tk:TRIPK,cv:TCVD};auroraInks.set(c,ink);return ink;
}
function ribbon(c,x,width,height,t,phase,narrow){
 const n=16;c.beginPath();
 for(let k=0;k<=n;k++){const u=k/n,sway=Math.sin(k*.42+t*1.1+phase)*9*u+Math.sin(t*.7+phase)*2,half=width*narrow*(1-.38*u)+Math.sin(k*.9-t*1.6+phase)*1.4*narrow;c[k?'lineTo':'moveTo'](x+sway-half,-height*u)}
 for(let k=n;k>=0;k--){const u=k/n,sway=Math.sin(k*.42+t*1.1+phase)*9*u+Math.sin(t*.7+phase)*2,half=width*narrow*(1-.38*u)+Math.sin(k*.9-t*1.6+phase)*1.4*narrow;c.lineTo(x+sway+half,-height*u)}
 c.closePath();c.fill();
}
function aurora(c,run,reduced){
 const fin=run.endAt||FINISH,p=surface(fin),ink=auroraInk(c),t=(reduced?.18:1)*(run.clock??run.time),outro=run.outro?.kind==='clear'?clamp(run.outro.age/.5,0,1):0;
 const strength=(.58+.42*clamp((run.distance-fin+520)/420,0,1))*(1+outro*.35);
 c.save();c.translate(p.x,p.y);c.rotate(p.a);c.globalCompositeOperation=LOP;
 c.globalAlpha=Math.min(1,strength);c.fillStyle=ink.halo;c.fillRect(-150,-240,300,300);
 for(let i=0;i<CURTAINS.length;i++){
  const [x,width,height,,phase]=CURTAINS[i],breath=1+(reduced?0:Math.sin(t*.9+phase)*.07);
  c.fillStyle=ink.curtain[i];c.globalAlpha=Math.min(1,strength*(.62+.18*Math.sin(t*1.3+phase*2)));
  c.save();c.scale(1,breath);ribbon(c,x,width,height,t,phase,.5);c.globalAlpha=Math.min(1,strength*.75);ribbon(c,x,width,height*.92,t*1.25,phase+.8,.17);c.restore();
 }
 c.globalAlpha=Math.min(1,strength);c.save();c.scale(1,.3);c.fillStyle=ink.base;c.beginPath();c.arc(0,-3,36,0,Math.PI*2);c.fill();c.restore();
 c.fillStyle='rgba(255,250,236,.85)';c.fillRect(-26,-1.2,52,1.4);
 c.restore();
}
const HAND=(()=>{if(typeof Path2D==='undefined')return null;const p=new Path2D('M-2.3 0V-11.6a2.3 2.3 0 0 1 4.6 0V-5.2a2 2 0 0 1 3.8 .4a2 2 0 0 1 3.7 .6a1.9 1.9 0 0 1 3.5 1V3.4c0 3.6-2.6 6.4-6.2 6.4H1.6c-2 0-3.4-.9-4.6-2.4L-6.6 2.6a1.9 1.9 0 0 1 2.9-2.4z');return p})();
function finger(c,x,y,t,reduced){
 const cycle=reduced?.75:(t*.95)%1,press=reduced?0:Math.max(0,Math.sin(cycle*Math.PI*2))*3.4;
 c.save();c.translate(x,y);c.globalCompositeOperation=LOP;
 c.beginPath();c.ellipse(0,0,6,1.8,0,0,Math.PI*2);c.fillStyle='rgba(255,236,200,'+(.35+.4*press/3.4).toFixed(3)+')';c.fill();
 if(!reduced&&cycle<.5){const r=cycle*2;c.beginPath();c.ellipse(0,0,5+r*15,1.6+r*4.2,0,0,Math.PI*2);c.strokeStyle='rgba(255,236,200,'+(.8*(1-r)).toFixed(3)+')';c.lineWidth=1.1;c.stroke()}
 c.globalCompositeOperation='source-over';
 if(HAND){const k=1,a=Math.PI-.42,lift=3.4-press;c.translate(-11-Math.sin(a)*(13.9*k+lift),-2+Math.cos(a)*(13.9*k+lift));c.rotate(a);c.scale(k,k);c.lineJoin='round';
  c.lineWidth=2.6;c.strokeStyle='rgba(32,20,56,.5)';c.stroke(HAND);c.fillStyle='#fff7ec';c.fill(HAND);c.lineWidth=.7;c.strokeStyle='#ffcfae';c.stroke(HAND)}
 c.restore();
}
function tapHint(c,run,index,reduced,rot=0){
 const o=run.obstacles[index],spot=o.at-(index===0?SLOW_HOLD+3:PERFECT_LEAD),gap=spot-run.distance,active=index===0&&(run.slowChance==='active'||run.slowChance==='queued');
 if(!active&&(gap>240||gap<-12))return;
 const t=run.clock??run.time,fade=active?1:clamp((240-gap)/70,0,1)*clamp((gap+12)/12,0,1),near=active?1:clamp(1-Math.abs(gap)/30,0,1);
 const p=surface(spot),pulse=reduced?0:Math.sin(t*5.4);
 c.save();c.translate(p.x,p.y);c.rotate(p.a);c.globalCompositeOperation=LOP;
 c.globalAlpha=fade*(.45+.55*near);
 c.beginPath();c.ellipse(0,-1,11+pulse,3.4+pulse*.3,0,0,Math.PI*2);c.lineWidth=4.5;c.strokeStyle='rgba(255,196,150,.28)';c.stroke();
 c.lineWidth=1.3;c.strokeStyle='#fff1d6';c.stroke();
 c.beginPath();c.ellipse(0,-1,7,2,0,0,Math.PI*2);c.fillStyle='rgba(255,226,180,.35)';c.fill();
 if(!reduced){const r=(t*.8)%1;c.beginPath();c.ellipse(0,-1,11+r*12,3.4+r*3.4,0,0,Math.PI*2);c.lineWidth=.9;c.strokeStyle='rgba(255,226,190,'+(.6*(1-r)).toFixed(3)+')';c.stroke()}
 c.globalAlpha=fade*.22*(.5+near);c.fillStyle='#ffe6c4';c.fillRect(-.8,-34,1.6,32);
 c.restore();
 if(active){const f=offset(p,1);finger(c,f.x,f.y,t,reduced);return}
 const label=offset(p,24);c.save();c.globalAlpha=fade*(.55+.45*near);c.font='700 9px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';
 c.translate(label.x,label.y);c.rotate(-rot);
 c.fillStyle='rgba(30,18,52,.6)';c.fillText('탭',.5,.7);c.fillStyle='#fff3dc';c.fillText('탭',0,0);c.restore();
}
/* World → screen (CSS px) through the last drawn camera: screen = c + R(rot)·(p - t)·scale. */
function project(run,s,h=0){
 const v=run.view;if(!v)return null;const p=offset(surface(s),h),dx=(p.x-(v.tx||0))*v.scale,dy=(p.y-(v.ty||0))*v.scale,r=v.rot||0;
 if(!r)return {x:v.cx+dx,y:v.cy+dy};
 const cs=Math.cos(r),sn=Math.sin(r);return {x:v.cx+dx*cs-dy*sn,y:v.cy+dx*sn+dy*cs};
}
/* ---------- R104 polish art: floating architecture, rotating camera, poster shot ---------- */
const TAU=Math.PI*2,QUARTER=Math.PI/2,TURN=.35,TURN_ZOOM=.92,TURN_LEAD=SPEED*TURN/2;
const CAM_SWITCH=[FLOOR+ARC/2-TURN_LEAD,WALL_START+WALL+ARC/2-TURN_LEAD];
const S_START=-150,S_END=FINISH+120,TOP=6,EDGE=-3,SIDE=-29,BASE=-36;
const LIGHT_START=.12,LIGHT_SWEEP=1.05,POSTER_START=.55,POSTER_MOVE=1.3;
/* Section palettes: sky 3 stops, fog, distant silhouettes, architecture 3 tones (top lit, side, shadow) + deep underside. Low saturation. */
const ART_BASE=[
 {sky:['#191428','#352743','#6a4c64'],fog:'#c9a2b2',far:'#4b3a57',near:'#3a2c47',top:'#f4dccd',side:'#b98d9f',shadow:'#7a5674',deep:'#3c2b45',edge:'#fff4e6',slit:'#4a3150',moon:'#f6dccb'},
 {sky:['#15152b','#2c2a4d','#58507c'],fog:'#a59cc9',far:'#3f3a63',near:'#302c50',top:'#e8def4',side:'#9d90c0',shadow:'#62568c',deep:'#2e2850',edge:'#f7f1ff',slit:'#3a3160',moon:'#e8def4'},
 {sky:['#0d1a24','#1b3642','#3d6670'],fog:'#93c3c0',far:'#2b4a55',near:'#203b46',top:'#d9efe8',side:'#82b0ae',shadow:'#4b7b80',deep:'#203e48',edge:'#f1fffb',slit:'#24434d',moon:'#d9efe8'}
].map(Object.freeze);
/* R105 TR: dark psychedelic look. useTrip(key) swaps ART (3 section palettes, each leaning to rim / rim2 / glow of the trip), the obstacle colours OB and the meaning inks TI.
   OB_BASE is the R104 coral set; trip obstacles are bright danger-coloured crystals with a white-hot edge on the dark base. */
const OB_BASE={glow:'255,128,108',cr:['#ffb3a0','#e8667a','#c84f6c'],crH:['#fff3ea','#ffe2d6','#ffd8cc'],line:'rgba(255,246,236,.85)',stem:'#b9566c',stemH:'#ffe9df',plate:['#ff8a73','#e8667a'],plateH:'#fff3ea',disc:'#ffd9c8',discH:'#ffffff',petal:'#e15c70',petalH:'#ffd0c0',hub:'#fff6e8',sh:['#ff9a84','#e8667a'],shH:'#fff3ea',shLine:'rgba(255,236,224,.8)',spark:'255,214,236',tint:'#ff7a66',edge:null,gold:'255,226,150',goldHex:'#ffeca5',goldHex2:'#fffbe8',win:'#f2b77e',winOn:'#ffd98a',winRgb:'255,200,130',lantern:'255,214,150',moonRgb:'255,236,214',edgeLine:'rgba(255,250,240,.72)',star:null};
let ART=ART_BASE,OB=OB_BASE,TI=null,TRIPK=null,TCVD=false,LOP='lighter';   // LOP: additive glow on dark looks, plain alpha on the light calm palettes (additive would clip to white)
function tripArt(key){
 const T=root.MongyuTrip,p=T.get(key),f=T.face(key),lean=[p.rim,p.rim2,p.glow];
 return [0,1,2].map(k=>{const l=lean[k],m=(a,t)=>T.mix(a,l,t);
  return Object.freeze({sky:[m(p.sky[0],.04*k),m(p.sky[1],.1+.04*k),m(T.mix(p.sky[2],p.sky[0],.3),.14+.05*k)],fog:T.mix(p.fog,p.sky[0],.62),far:m(T.mix(p.block[1],p.fog,.22),.1),near:m(p.block[1],.04),
   top:m(f.top,.1),side:m(f.front,.06),shadow:f.side,deep:f.deep,edge:T.mix(l,'#ffffff',.3),slit:m(p.block[2],.35),moon:p.glow})});
}
function useTrip(key){
 const T=root.MongyuTrip,k=key&&T&&T.face?key:null,cv=k?T.cvdOn():false;
 if(k===TRIPK&&cv===TCVD)return;
 TRIPK=k;TCVD=cv;paletteCache.clear();
 if(!k){ART=ART_BASE;OB=OB_BASE;TI=null;LOP='lighter';return}
 ART=tripArt(k);TI=T.ink(k);const d=TI;LOP=d.light?'source-over':'lighter';
 OB={glow:d.dangerRgb,cr:[d.dangerTop,d.danger,d.dangerSide],crH:['#ffffff',d.dangerLine,d.dangerTop],line:d.dangerLine,stem:d.dangerSide,stemH:'#ffffff',plate:[d.danger,d.dangerSide],plateH:'#ffffff',disc:d.dangerTop,discH:'#ffffff',petal:d.danger,petalH:d.dangerLine,hub:d.dangerLine,
  sh:[d.dangerTop,d.danger],shH:'#ffffff',shLine:d.dangerLine,spark:d.dangerRgb,tint:d.danger,edge:d.dangerLine,gold:d.tapRgb,goldHex:d.tap,goldHex2:T.mix(d.tap,'#ffffff',.7),win:d.rim2,winOn:d.tapDeep,winRgb:d.rim2Rgb,lantern:d.glowRgb,moonRgb:d.glowRgb,edgeLine:null,star:d.rim};
}
const ART_KEYS=Object.keys(ART_BASE[0]);
const rgbCache=new Map();
function rgb(hex){let v=rgbCache.get(hex);if(!v){const n=parseInt(hex.slice(1),16);v=[n>>16&255,n>>8&255,n&255];rgbCache.set(hex,v)}return v}
function mixHex(a,b,t){if(t<=0)return a;if(t>=1)return b;const x=rgb(a),y=rgb(b);let out='#';for(let i=0;i<3;i++)out+=Math.round(x[i]+(y[i]-x[i])*t).toString(16).padStart(2,'0');return out}
function rgba(hex,a){const v=rgb(hex);return 'rgba('+v[0]+','+v[1]+','+v[2]+','+a.toFixed(3)+')'}
const paletteCache=new Map();
function paletteAt(f){
 f=clamp(f,0,2);const key=Math.round(f*40);let p=paletteCache.get(key);if(p)return p;
 const k=Math.min(1,Math.floor(key/40)),t=key/40-k,a=ART[k],b=ART[k+1];p={};
 for(const name of ART_KEYS)p[name]=name==='sky'?a.sky.map((v,i)=>mixHex(v,b.sky[i],t)):mixHex(a[name],b[name],t);
 paletteCache.set(key,p);return p;
}
const easeInOut=u=>u<.5?2*u*u:1-2*(1-u)*(1-u);
const easeOut=u=>1-Math.pow(1-u,3);
function camSection(s){return s>=CAM_SWITCH[1]?2:s>=CAM_SWITCH[0]?1:0}
/* Surface-local frame: u along the course, v up (away from the block). */
function local(s,u,v){const p=surface(s),cs=Math.cos(p.a),sn=Math.sin(p.a);return {x:p.x+u*cs+v*sn,y:p.y+u*sn-v*cs}}
function band(s0,s1,h0,h1,step=4){
 const shape=new Path2D(),n=Math.max(1,Math.ceil((s1-s0)/step));
 for(let i=0;i<=n;i++){const q=offset(surface(s0+(s1-s0)*i/n),h1);if(i)shape.lineTo(q.x,q.y);else shape.moveTo(q.x,q.y)}
 for(let i=n;i>=0;i--){const q=offset(surface(s0+(s1-s0)*i/n),h0);shape.lineTo(q.x,q.y)}
 shape.closePath();return shape;
}
function polyline(shape,s0,s1,h,step=4){const n=Math.max(1,Math.ceil((s1-s0)/step));for(let i=0;i<=n;i++){const q=offset(surface(s0+(s1-s0)*i/n),h);if(i)shape.lineTo(q.x,q.y);else shape.moveTo(q.x,q.y)}}
const STRAIGHTS=[[S_START,FLOOR,0],[WALL_START,WALL_START+WALL,1],[CEILING_START,S_END,2]];
let courseArt=null;
function buildCourse(){
 if(courseArt)return courseArt;
 const cuts=[S_START,FLOOR,FLOOR+ARC/4,FLOOR+ARC/2,FLOOR+ARC*3/4,WALL_START,WALL_START+WALL,WALL_START+WALL+ARC/4,WALL_START+WALL+ARC/2,WALL_START+WALL+ARC*3/4,CEILING_START,S_END];
 const mixes=[0,.125,.375,.625,.875,1,1.125,1.375,1.625,1.875,2];
 const pieces=[];
 for(let i=0;i<cuts.length-1;i++){
  const s0=cuts[i]-(i?.6:0),s1=cuts[i+1]+.6,f=mixes[i];
  pieces.push({f,top:band(s0,s1,EDGE,TOP),side:band(s0,s1,SIDE,EDGE),lip:band(s0,s1,EDGE-2.6,EDGE),shade:band(s0,s1,BASE,SIDE)});
 }
 const tiers=[],windows=[],seams=[new Path2D(),new Path2D(),new Path2D()],rails=[new Path2D(),new Path2D(),new Path2D()];
 for(const [a,b,k] of STRAIGHTS){
  /* Hanging stepped (ziggurat) modules under the slab: the structure floats. */
  const count=Math.max(1,Math.round((b-a-60)/120)),gap=(b-a)/count;
  for(let m=0;m<count;m++){const mid=a+gap*(m+.5),span=Math.min(78,gap*.62);
   [[1,BASE-10,BASE],[.64,BASE-19,BASE-10],[.3,BASE-27,BASE-19]].forEach(([k2,h0,h1],level)=>tiers.push({f:k,level,shape:band(mid-span*k2/2,mid+span*k2/2,h0,h1,3)}));
   const tip=offset(surface(mid),BASE-31);tiers.push({f:k,level:3,shape:(()=>{const d=new Path2D();d.arc(tip.x,tip.y,2.2,0,TAU);return d})()});
  }
  for(let s=a+20,i=0;s<b-16;s+=26,i++)windows.push({s,f:k,lit:(i*7+k*3)%5===0});
  for(let s=a+40;s<b-10;s+=40){const p=offset(surface(s),EDGE-2.6),q=offset(surface(s),SIDE+1);seams[k].moveTo(p.x,p.y);seams[k].lineTo(q.x,q.y)}
  /* Oblique paving joints on the lit top face give it depth. */
  for(let s=a+10;s<b-6;s+=20){const p=local(s,0,EDGE),q=local(s,4.5,TOP);seams[k].moveTo(p.x,p.y);seams[k].lineTo(q.x,q.y)}
 }
 /* Corner rails/windows follow the arc pieces' nearest section. */
 for(const [a,b,k] of STRAIGHTS){for(let s=a+6;s<=b-4;s+=9){const p=offset(surface(s),TOP),q=offset(surface(s),TOP+6);rails[k].moveTo(p.x,p.y);rails[k].lineTo(q.x,q.y)}polyline(rails[k],a+6,b-4,TOP+6)}
 const slits=[new Path2D(),new Path2D(),new Path2D()];
 for(const w of windows){
  const pts=[[-2.2,-23],[-2.2,-14.5],[-1.6,-12.4],[0,-11.4],[1.6,-12.4],[2.2,-14.5],[2.2,-23]].map(([u,v])=>local(w.s,u,v));
  w.points=pts;const shape=slits[w.f];shape.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)shape.lineTo(pts[i].x,pts[i].y);shape.closePath();
  w.center=local(w.s,0,-17);
 }
 const edges=[];
 for(let s=S_START;s<S_END;s+=20){const shape=new Path2D();polyline(shape,s,Math.min(S_END,s+20.5),EDGE+.4,2);edges.push({s:s+10,shape})}
 const edgeAll=new Path2D();polyline(edgeAll,S_START,S_END,EDGE+.4);
 const backAll=new Path2D();polyline(backAll,S_START,S_END,TOP);
 /* Start pavilion (floor, before the first step): two pillars, beam and an upturned hanok roof. */
 const gx=-112,pillars=new Path2D(),roof=new Path2D(),beam=new Path2D();
 pillars.rect(gx-17,-50,5,50);pillars.rect(gx+12,-50,5,50);
 beam.rect(gx-22,-55,44,5);
 roof.moveTo(gx-33,-57);roof.quadraticCurveTo(gx-22,-58.5,gx-18,-66);roof.lineTo(gx+18,-66);roof.quadraticCurveTo(gx+22,-58.5,gx+33,-57);roof.quadraticCurveTo(gx,-61,gx-33,-57);roof.closePath();
 const ridge=new Path2D();ridge.rect(gx-19,-69,38,3);
 courseArt={pieces,tiers,windows,seams,rails,slits,edges,edgeAll,backAll,pavilion:{pillars,beam,roof,ridge,lantern:{x:gx,y:-44}}};
 return courseArt;
}
/* Cached soft glow sprites (one per ink) — no per-frame gradients for glows. */
const glowSprites=new Map();
function glowSprite(ink){
 if(glowSprites.has(ink))return glowSprites.get(ink);let g=null;
 try{g=root.document.createElement('canvas');g.width=g.height=64;const x=g.getContext('2d'),r=x.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,'rgba('+ink+',.9)');r.addColorStop(.25,'rgba('+ink+',.45)');r.addColorStop(.6,'rgba('+ink+',.12)');r.addColorStop(1,'rgba('+ink+',0)');x.fillStyle=r;x.fillRect(0,0,64,64)}catch(_){g=null}
 glowSprites.set(ink,g);return g;
}
function glowAt(c,ink,x,y,size,alpha){const g=glowSprite(ink);if(!g||alpha<=0)return;c.globalAlpha=alpha;c.drawImage(g,x-size/2,y-size/2,size,size)}
/* Distant floating architecture: islands with towers, gates and stone pagodas (layer units ≈ CSS px at 390 wide). */
const skylineCache=[];
function skyline(k){
 if(skylineCache[k])return skylineCache[k];
 const far=new Path2D(),near=new Path2D(),rand=((seed)=>()=>((seed=seed*16807%2147483647)-1)/2147483646)(31+k*977);
 const roofed=(shape,x,base,hw,hh)=>{
  shape.rect(x-hw,base-hh,hw*2,hh);
  const top=base-hh,eave=hw*1.55,rise=hw*.62;
  shape.moveTo(x-eave,top-rise*.18);shape.quadraticCurveTo(x-hw*.9,top-rise*.28,x-hw*.62,top-rise);shape.lineTo(x+hw*.62,top-rise);shape.quadraticCurveTo(x+hw*.9,top-rise*.28,x+eave,top-rise*.18);shape.lineTo(x+hw,top);shape.lineTo(x-hw,top);shape.closePath();
  return top-rise;
 };
 const island=(shape,x,y,size,kind)=>{
  const w=size;
  /* slab + shallow stepped (ziggurat) underside */
  shape.rect(x-w,y,w*2,size*.16);shape.rect(x-w*.78,y+size*.16,w*1.56,size*.13);shape.rect(x-w*.5,y+size*.29,w,size*.12);shape.rect(x-w*.22,y+size*.41,w*.44,size*.1);
  if(kind===0){const top=roofed(shape,x-w*.25,y,w*.2,size*.95);roofed(shape,x-w*.25,top,w*.13,size*.32);roofed(shape,x+w*.45,y,w*.26,size*.36)}
  else if(kind===1){const pw=w*.09,gh=size*.62;shape.rect(x-w*.62,y-gh,pw*2,gh);shape.rect(x-w*.08,y-gh,pw*2,gh);
   shape.moveTo(x-w*.75,y-gh-size*.05);shape.lineTo(x+w*.05,y-gh-size*.05);shape.lineTo(x+w*.05,y-gh);shape.lineTo(x-w*.75,y-gh);shape.closePath();
   for(let i=0;i<4;i++)shape.rect(x+w*(.18+i*.2),y-size*.1*(4-i),w*.21,size*.1*(4-i))}
  else{let sw=w*.24,sy=y;for(let i=0;i<5;i++){const sh=size*.13;shape.rect(x-w*.35-sw,sy-sh,sw*2,sh);sy-=sh;if(i<4){shape.rect(x-w*.35-sw*.55,sy-size*.06,sw*1.1,size*.06);sy-=size*.06}sw*=.8}
   roofed(shape,x+w*.5,y,w*.18,size*.55)}
 };
 for(let i=0;i<5;i++)island(far,-300+i*152+rand()*50,-210+rand()*230,20+rand()*12,(i+k)%3);
 for(let i=0;i<4;i++)island(near,-280+i*190+rand()*60,-150+rand()*190,32+rand()*14,(i*2+k+1)%3);
 return skylineCache[k]={far,near,period:760};
}
let starPath=null;
function starsPath(){if(starPath)return starPath;starPath=new Path2D();for(let i=0;i<46;i++){const x=(i*233)%997/997,y=(i*389)%991/991,r=.5+(i%5)*.22;starPath.moveTo(x*1000+r,y*1000);starPath.arc(x*1000,y*1000,r,0,TAU)}return starPath}
function layout(w,h){
 const wide=w>h*1.15,target=h*.09,scale=clamp(Math.min(target/44,w*.7/170),.5,2.6);
 return {wide,scale,body:clamp(target/scale,44,50),ax:w*(wide?.34:.3),ay:h*(wide?.6:.55)};
}
/* Poster framing: the whole structure at rest (floor down); the aurora hangs from the ceiling into the open court. */
const POSTER_BOX={x0:-176,x1:446,y0:-462,y1:62};
function posterView(w,h){
 const bw=POSTER_BOX.x1-POSTER_BOX.x0,bh=POSTER_BOX.y1-POSTER_BOX.y0,wide=w>h*1.15;
 const scale=Math.min(w*(wide?.62:.92)/bw,h*(wide?.8:.38)/bh);
 return {cx:wide?w*.62:w*.5,cy:wide?h*.52:h*.44,tx:(POSTER_BOX.x0+POSTER_BOX.x1)/2,ty:(POSTER_BOX.y0+POSTER_BOX.y1)/2,rot:0,scale};
}
function cameraTurn(run,reduced){
 const k=camSection(run.distance),t=run.clock;let cam=run.cam;
 if(!cam)cam=run.cam={k,from:k*QUARTER,at:-1};
 if(k!==cam.k){cam.from=turnAngle(cam,t,reduced).rot;cam.k=k;cam.at=t}
 return turnAngle(cam,t,reduced);
}
function turnAngle(cam,t,reduced){
 const to=cam.k*QUARTER;if(reduced||cam.at<0)return {rot:to,zoom:1,turning:0};
 const u=clamp((t-cam.at)/TURN,0,1);return {rot:cam.from+(to-cam.from)*easeInOut(u),zoom:1-(1-TURN_ZOOM)*Math.sin(Math.PI*u),turning:u<1?1:0};
}
function cameraFor(run,w,h,reduced){
 const L=layout(w,h),turn=cameraTurn(run,reduced),foot=surface(run.distance);
 const play={cx:L.ax,cy:L.ay,tx:foot.x,ty:foot.y,rot:turn.rot,scale:L.scale*turn.zoom};
 let poster=0;
 if(run.outro?.kind==='clear'||run.state==='clear'&&run.outro){const age=run.outro.age;poster=reduced?1:easeInOut(clamp((age-POSTER_START)/POSTER_MOVE,0,1))}
 if(poster>0){
  const p=posterView(w,h),e=poster,lerp=(a,b)=>a+(b-a)*e;
  const rot=play.rot+(((p.rot-play.rot)%TAU+TAU+Math.PI)%TAU-Math.PI)*e;
  return {L,turn,poster,cam:{cx:lerp(play.cx,p.cx),cy:lerp(play.cy,p.cy),tx:lerp(play.tx,p.tx),ty:lerp(play.ty,p.ty),rot,scale:Math.exp(lerp(Math.log(play.scale),Math.log(p.scale)))}};
 }
 return {L,turn,poster,cam:play};
}
function finishLight(run){
 if(run.state==='clear'&&run.outro)return 1;
 if(run.outro?.kind!=='clear')return 0;
 return clamp((run.outro.age-LIGHT_START)/LIGHT_SWEEP,0,1);
}
function drawSky(c,w,h,f,run,cam,reduced){
 const pal=paletteAt(f),t=reduced?0:(run.clock||0);
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,pal.sky[0]);g.addColorStop(.55,pal.sky[1]);g.addColorStop(1,pal.sky[2]);
 c.fillStyle=g;c.fillRect(0,0,w,h);
 const m=Math.min(w,h),mx=w*.74,my=h*.17;
 c.save();c.globalCompositeOperation=LOP;
 glowAt(c,OB.moonRgb,mx,my,m*.95,TI?.3:.16);
 c.globalAlpha=.11;c.fillStyle=pal.moon;c.beginPath();c.arc(mx,my,m*.085,0,TAU);c.fill();
 c.globalAlpha=.07;c.beginPath();c.arc(mx-m*.012,my-m*.01,m*.07,0,TAU);c.fill();
 c.globalAlpha=.42+(reduced?0:.08*Math.sin(t*.7));c.fillStyle=pal.edge;
 c.save();c.scale(w/1000,h*.62/1000);c.fill(starsPath());c.restore();
 c.restore();
}
function drawFog(c,w,h,f,y0,y1,alpha){
 const pal=paletteAt(f),g=c.createLinearGradient(0,h*y0,0,h*y1);
 g.addColorStop(0,rgba(pal.fog,0));g.addColorStop(.5,rgba(pal.fog,alpha));g.addColorStop(1,rgba(pal.fog,0));
 c.fillStyle=g;c.fillRect(0,h*y0,w,h*(y1-y0));
}
function drawSkyline(c,w,h,run,cam,f){
 const unit=Math.max(w,h)/520;
 for(let k=0;k<3;k++){
  const weight=clamp(1-Math.abs(f-k),0,1);if(weight<=0)continue;
  const sk=skyline(k),pal=ART[k],spin=cam.rot-k*QUARTER;
  for(const [shape,par,ink,alpha] of [[sk.far,.1,pal.far,.55],[sk.near,.2,pal.near,.72]]){
   const shift=-((run.distance*par*cam.scale/unit)%sk.period+sk.period)%sk.period;
   c.save();c.translate(w/2,h*.48);c.rotate(spin);c.scale(unit,unit);
   c.globalAlpha=alpha*weight;c.fillStyle=ink;
   for(let i=-1;i<=1;i++){c.save();c.translate(shift+i*sk.period,0);c.fill(shape);c.restore()}
   c.restore();
  }
 }
 c.globalAlpha=1;
}
function drawCourse(c,run,light,reduced,f=0){
 const A=buildCourse(),t=reduced?0:(run.clock||0);
 for(const tier of A.tiers){const pal=ART[tier.f];c.fillStyle=tier.level===3?OB.winOn:mixHex(pal.shadow,pal.deep,.2+tier.level*.22);c.globalAlpha=tier.level===3?.6:1;c.fill(tier.shape)}
 c.globalAlpha=1;
 for(const piece of A.pieces){const pal=paletteAt(piece.f);c.fillStyle=pal.deep;c.fill(piece.shade);c.fillStyle=pal.side;c.fill(piece.side);c.fillStyle=mixHex(pal.side,pal.shadow,.45);c.fill(piece.lip);c.fillStyle=pal.top;c.fill(piece.top)}
 /* Ambient occlusion under the lip and on the lower side face. */
 for(let k=0;k<3;k++){const pal=ART[k];c.lineWidth=.8;c.strokeStyle=rgba(pal.deep,.4);c.stroke(A.seams[k]);c.fillStyle=pal.slit;c.fill(A.slits[k])}
 if(TI){const e=paletteAt(f).edge;c.lineJoin='round';c.lineWidth=3.6;c.strokeStyle=rgba(e,.2);c.stroke(A.edgeAll);c.lineWidth=1;c.strokeStyle=rgba(e,.95);c.stroke(A.edgeAll)}
 else{c.lineWidth=.9;c.strokeStyle=OB.edgeLine;c.stroke(A.edgeAll)}
 c.lineWidth=.6;c.strokeStyle='rgba(40,26,52,.28)';c.stroke(A.backAll);
 for(let k=0;k<3;k++){c.lineWidth=.75;c.strokeStyle=rgba(ART[k].shadow,.62);c.stroke(A.rails[k])}
 /* Pavilion at the start. */
 const P=A.pavilion,pal=ART[0];
 c.fillStyle=pal.side;c.fill(P.pillars);c.fillStyle=pal.shadow;c.fill(P.beam);c.fillStyle=pal.top;c.fill(P.roof);c.fillStyle=pal.deep;c.fill(P.ridge);
 /* Windows: a few warm lights during the run; the finish sweep lights them all. */
 const front=light>0?FINISH-light*(FINISH-S_START+60):Infinity;
 c.save();c.globalCompositeOperation=LOP;
 for(const w of A.windows){
  const on=light>0?clamp((w.s-front)/36,0,1):0,base=w.lit?.32+(reduced?0:.08*Math.sin(t*1.3+w.s)):0,k=Math.max(on,base);
  if(k<=0)continue;
  c.globalAlpha=k;c.fillStyle=on>0?OB.winOn:OB.win;c.beginPath();const pts=w.points;c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y);c.closePath();c.fill();
  glowAt(c,OB.winRgb,w.center.x,w.center.y,on>0?20:14,k*(on>0?.55:.3));
 }
 glowAt(c,OB.lantern,P.lantern.x,P.lantern.y,light>0?46:24,light>0?.9:.45);
 if(light>0){
  for(const e of A.edges){const on=clamp((e.s-front)/40,0,1);if(on<=0)continue;c.globalAlpha=on*.45;c.lineWidth=2.6;c.strokeStyle=TI?rgba(TI.aurora,.6):'rgba(255,214,150,.6)';c.stroke(e.shape);c.globalAlpha=on*.85;c.lineWidth=.8;c.strokeStyle=TI?'#ffffff':'#fff3da';c.stroke(e.shape)}
  if(light<1){const head=offset(surface(clamp(front,S_START,S_END)),EDGE);glowAt(c,TI?TI.auroraRgb:'255,232,190',head.x,head.y,44,.9);glowAt(c,TI?TI.glowRgb:'255,200,150',head.x,head.y,90,.3)}
 }
 c.restore();c.globalAlpha=1;
}
/* Obstacles: floor = coral crystal spikes, wall = rotating ornament plates, ceiling = broken memory shards. Same collision envelope. */
function facet(c,pts,ink){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fillStyle=ink;c.fill();if(OB.edge){c.lineJoin='round';c.lineWidth=.55;c.strokeStyle=OB.edge;c.stroke()}}
function crystals(c,o,t,hot){
 const w=o.width,h=o.height;
 for(const [x,hh,hw,lean] of [[-w*.56,h*.52,w*.3,-.32],[w*.52,h*.64,w*.32,.26],[0,h,w*.4,-.05]]){
  const tip=[x+lean*hh,-hh],sl=[x-hw*.95,-hh*.5],sr=[x+hw*.95,-hh*.56],bl=[x-hw*.7,0],br=[x+hw*.7,0],mid=[x+lean*hh*.4,-hh*.35];
  facet(c,[bl,sl,tip,mid],hot?OB.crH[0]:OB.cr[0]);facet(c,[mid,tip,sr,br],hot?OB.crH[1]:OB.cr[1]);facet(c,[bl,mid,br],hot?OB.crH[2]:OB.cr[2]);
  c.beginPath();c.moveTo(mid[0],mid[1]);c.lineTo(tip[0],tip[1]);c.lineWidth=.7;c.strokeStyle=OB.line;c.stroke();
  if(TI&&TI.light){c.save();c.lineJoin='round';c.lineWidth=1.6;c.strokeStyle=OB.line;c.beginPath();c.moveTo(bl[0],bl[1]);c.lineTo(sl[0],sl[1]);c.lineTo(tip[0],tip[1]);c.lineTo(sr[0],sr[1]);c.lineTo(br[0],br[1]);c.closePath();c.stroke();c.restore()}   // R105 POL: bold dark outline on light palettes
 }
}
function ornament(c,o,t,hot,i){
 const h=o.height,r=Math.min(o.width*.82,h*.42),cy=-h+r;
 c.fillStyle=hot?OB.stemH:OB.stem;c.fillRect(-1.2,cy,2.4,-cy);
 c.save();c.translate(0,cy);c.scale(.8+.2*Math.cos(t*1.7+i),1);c.rotate(t*1.15+i);
 for(let k=0;k<2;k++){c.save();c.rotate(k*Math.PI/4);c.fillStyle=hot?OB.plateH:OB.plate[k];c.fillRect(-r*.74,-r*.74,r*1.48,r*1.48);if(OB.edge){c.lineWidth=TI&&TI.light?1.5:.6;c.strokeStyle=OB.edge;c.strokeRect(-r*.74,-r*.74,r*1.48,r*1.48)}c.restore()}
 c.beginPath();c.arc(0,0,r*.62,0,TAU);c.fillStyle=hot?OB.discH:OB.disc;c.fill();
 c.fillStyle=hot?OB.petalH:OB.petal;for(let k=0;k<4;k++){c.save();c.rotate(k*QUARTER);c.beginPath();c.ellipse(0,-r*.3,r*.13,r*.28,0,0,TAU);c.fill();c.restore()}
 c.beginPath();c.arc(0,0,r*.14,0,TAU);c.fillStyle=OB.hub;c.fill();
 c.restore();
}
function shards(c,o,t,hot,i){
 const w=o.width,h=o.height,gap=1.1+Math.sin(t*1.5+i)*.9;
 const pieces=[[[-w*.42,0],[-w*.34,-h*.62],[-w*.02,-h],[w*.32,-h*.58],[w*.3,0]],[[-w*.95,-h*.18],[-w*.58,-h*.5],[-w*.52,-h*.12]],[[w*.5,-h*.3],[w*.78,-h*.62],[w*.98,-h*.22]]];
 pieces.forEach((pts,k)=>{const dx=k===1?-gap:k===2?gap:0,dy=k?-gap*.6:0;
  facet(c,pts.map(([x,y])=>[x+dx,y+dy]),hot?OB.shH:k?OB.sh[1]:OB.sh[0]);
  c.beginPath();c.moveTo(pts[0][0]+dx,pts[0][1]+dy);for(const [x,y] of pts)c.lineTo(x+dx,y+dy);c.closePath();c.lineWidth=TI&&TI.light?1.5:.7;c.lineJoin='round';c.strokeStyle=OB.shLine;c.stroke()});
 c.save();c.globalCompositeOperation=LOP;c.beginPath();c.moveTo(-w*.2,-h*.15);c.lineTo(-w*.05,-h*.45);c.lineTo(-w*.16,-h*.62);c.moveTo(-w*.05,-h*.45);c.lineTo(w*.14,-h*.66);
 c.lineWidth=1.1;c.strokeStyle='rgba('+OB.spark+','+(.55+.35*Math.sin(t*2.2+i)).toFixed(3)+')';c.stroke();c.restore();
}
function drawObstacles(c,run,reduced){
 const t=reduced?0:(run.clock||0);
 const list=run.obstacles,lo=run.chain?run.firstIndex:0,hi=run.chain?run.endIndex:list.length;
 for(let i=lo;i<hi;i++){
  const o=list[i],p=surface(o.at),hot=run.crash?.index===i&&(run.clock-run.poseAt)<.32,breath=1+(reduced?0:.035*Math.sin(t*2+i*1.3));
  c.save();c.translate(p.x,p.y);c.rotate(p.a);
  c.save();c.globalCompositeOperation=LOP;glowAt(c,OB.glow,0,-o.height*.55,o.height*(hot?4.4:2.7)*breath,TI&&TI.light&&!hot?.14:hot?.95:(TI?.62:.42)+(reduced?0:.12*Math.sin(t*2+i)));c.restore();
  c.scale(breath,breath);
  if(o.section===0)crystals(c,o,t,hot);else if(o.section===1)ornament(c,o,t,hot,i);else shards(c,o,t,hot,i);
  c.restore();
  if(i>=run.index){
   const q=offset(p,o.height+26),bob=reduced?0:Math.sin(t*2.4+i)*1.6,b=offset(p,o.height+26+bob);
   c.save();c.globalCompositeOperation=LOP;glowAt(c,OB.gold,b.x,b.y,26,TI&&TI.light?.18:.8);c.restore();
   if(!(root.MongyuItems?.drawLight?.(c,b.x,b.y,21,t,i,reduced,-(run.view?.rot||0)))){c.save();c.translate(b.x,b.y);c.rotate(p.a+Math.PI/4+(reduced?0:t*1.2+i));c.fillStyle=OB.goldHex;c.fillRect(-3.4,-3.4,6.8,6.8);if(TI&&TI.light){c.lineWidth=1.3;c.strokeStyle=TI.tapLine;c.strokeRect(-3.4,-3.4,6.8,6.8)}c.fillStyle=OB.goldHex2;c.fillRect(-1.3,-1.3,2.6,2.6);c.restore()}
   void q;
  }
 }
 c.globalAlpha=1;
}
/* R105 pickups in the surface frame, kept upright under the rotating camera. */
function drawPickups(c,run,reduced,rot){
 root.MongyuItems.drawItems(c,run,it=>{if(Math.abs(it.at-run.distance)>480)return null;const p=offset(surface(it.at),it.lane==='hi'?46:20);return {x:p.x,y:p.y,s:1}},run.clock||0,reduced,-rot);
}
/* Character: knock-back tumble after a crash, obstacle-colour tint for ~80ms at impact. */
let tintCanvas=null;
function tinted(c,draw,ink,alpha){
 try{
  const src=c.canvas;if(!src||!root.document)return draw(c);
  if(!tintCanvas)tintCanvas=root.document.createElement('canvas');
  if(tintCanvas.width!==src.width||tintCanvas.height!==src.height){tintCanvas.width=src.width;tintCanvas.height=src.height}
  const x=tintCanvas.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,src.width,src.height);x.setTransform(c.getTransform());x.globalAlpha=c.globalAlpha;
  draw(x);x.setTransform(1,0,0,1,0,0);x.globalAlpha=alpha;x.globalCompositeOperation='source-atop';x.fillStyle=ink;x.fillRect(0,0,src.width,src.height);x.globalCompositeOperation='source-over';x.globalAlpha=1;
  c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.drawImage(tintCanvas,0,0);c.restore();
 }catch(_){draw(c)}
}
function drawRunner(c,run,L,reduced){
 let s=run.distance,lift=run.height,spin=0;
 const since=(run.clock||0)-(run.poseAt||0);
 if(run.pose==='hurt'){
  const k=reduced?1:easeOut(clamp((since-HIT_STOP)/.55,0,1));
  s-=k*(reduced?5:15);lift=Math.max(lift*(1-k),reduced?0:Math.sin(Math.PI*clamp((since-HIT_STOP)/.55,0,1))*15);
  spin=-(reduced?.35:1.5)*k-(reduced?0:Math.sin(Math.PI*k)*.6);
 }
 const foot=surface(s),actor=offset(foot,lift+1.5),contact=offset(foot,1);
 c.save();c.translate(contact.x,contact.y);c.rotate(foot.a);ellipse(c,0,0,9*(1-Math.min(.6,lift/90)),2,TI?rgba(TI.rim,.4):'rgba(30,18,40,.28)');c.restore();
 const q={...actor,bodyHeight:L.body,renderAngle:foot.a+spin,strideDistance:run.distance,nativeState:0,height:lift,
  jumpProgress:run.flight===null?0:run.flight/run.fl,pose:run.pose,poseAt:run.poseAt};
 const draw=x=>root.MongyuMobile.sprite(x,q,{poseTime:run.clock??run.time,onDark:true},reduced);
 if(run.pose==='hurt'&&since<.1)tinted(c,draw,OB.tint,.72);else draw(c);
 if(run.mods&&!run.outro){const mid=offset(foot,lift+1.5+L.body*.5);root.MongyuItems.drawAura(c,run,mid.x,mid.y,L.body*.7,run.clock||0,reduced)}
 return actor;
}
const rubberSquash=t=>1+.06*Math.sin(Math.PI*2*t/3.2);   // same rhythm as illusion-course RUBBER (period 3.2 s, +-6 %)
function drawPolish(c,run,opts){
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced;
 useTrip(run.trip);
 const {L,cam,poster,turn}=cameraFor(run,w,h,reduced),f=clamp(turn.rot/QUARTER,0,2),light=finishLight(run);
 run.view={cx:cam.cx,cy:cam.cy,tx:cam.tx,ty:cam.ty,rot:cam.rot,scale:cam.scale,width:w,height:h,body:L.body,poster};
 c.save();
 drawSky(c,w,h,f,run,cam,reduced);
 drawFog(c,w,h,f,.18,.5,.1);
 drawSkyline(c,w,h,run,cam,f);
 drawFog(c,w,h,f,.42,.86,.16);
 if(run.rubber&&!reduced){const sq=rubberSquash(run.clock||0);c.translate(0,cam.cy);c.scale(1,sq);c.translate(0,-cam.cy)}   // R105 POL: +-6 % vertical squash in a 3.2 s rhythm about the runner's height on screen
 c.translate(cam.cx,cam.cy);c.rotate(cam.rot);c.scale(cam.scale,cam.scale);c.translate(-cam.tx,-cam.ty);
 drawCourse(c,run,light,reduced,f);
 drawObstacles(c,run,reduced);
 if(run.itemList?.length)drawPickups(c,run,reduced,cam.rot);
 if(run.tutorial)for(let i=0;i<3;i++)if(run.index===i)tapHint(c,run,i,reduced,cam.rot);
 aurora(c,run,reduced);
 const actor=drawRunner(c,run,L,reduced);
 const time=run.time;
 if(!reduced&&time-run.crossedAt<.32){
  const age=(time-run.crossedAt)/.32;c.globalAlpha=1-age;
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ellipse(c,actor.x+Math.cos(a)*(12+age*22),actor.y+Math.sin(a)*(12+age*22),1.6,1.6,OB.goldHex)}
  c.globalAlpha=1;
 }
 c.restore();
 /* Low fog over the base of the frame keeps the floating structure airy. */
 const pal=paletteAt(f),g=c.createLinearGradient(0,h*.78,0,h);g.addColorStop(0,rgba(pal.fog,0));g.addColorStop(1,rgba(pal.fog,TI?.24:.16));c.fillStyle=g;c.fillRect(0,h*.78,w,h*.22);
 const line=dialogue(run);
 if(!line||poster>0)return null;
 const head=project(run,run.distance,run.height+L.body+4);
 return {text:line,x:clamp(head.x,92,Math.max(92,w-92)),y:clamp(head.y-10,88,Math.max(88,h-106))};
}

function draw(c,run,opts){
 if(run.polish)return drawPolish(c,run,opts);
 const {width:w,height:h}=opts.viewport,palette=SECTIONS[run.mapChanges],foot=surface(run.distance),reduced=opts.reduced;
 const actor=offset(foot,run.height+1.5),time=run.time,scale=clamp(Math.min(w/318,h/275),.63,2.5);
 const lead=surface(run.distance+(reduced?20:32)),target=offset(lead,35);
 const focusX=w*.48,focusY=h*.43;
 const cx=focusX-target.x*scale,cy=focusY-target.y*scale;
 c.save();
 backdrop(c,run,w,h,palette,w*.51-(target.x-110)*scale*.09,h*.37-(target.y+100)*scale*.07,-target.y*scale*.12);
 if(spectralEdition){
  c.save();c.translate(w*.52-target.x*scale*.04,h*.47-target.y*scale*.06);
  spectralContours(c,time,Math.min(w,h)*.43,opts.dreamIntensity,reduced,true);
  c.restore();
 }
 c.translate(cx,cy);c.scale(scale,scale);
 if(run.polish)run.view={cx,cy,scale,width:w,height:h};
 c.save();c.translate(target.x*.18,target.y*.17);c.fillStyle=palette.far+'9c';c.fill(starField());c.restore();
 const visible=Math.min(PATH_POINTS.length,Math.ceil((run.distance+620)/48)*4);
 const [shelf,rail,glow,ticks]=rails(visible);
 c.lineWidth=27;c.lineJoin='round';c.strokeStyle='#130f23';c.stroke(shelf);
 c.lineWidth=4;c.strokeStyle=palette.far;c.stroke(rail);
 c.lineWidth=2;c.strokeStyle=palette.track;c.stroke(glow);
 c.strokeStyle='#fdf0dc55';c.lineWidth=.7;c.stroke(ticks);
 for(let i=0;i<OBSTACLE_ART.length;i++){
  const o=OBSTACLE_ART[i],picked=i<run.index,alpha=clamp((345-Math.abs(OBSTACLES[i].at-run.distance))/65,0,1);
  if(alpha===0)continue;
  c.globalAlpha=alpha;
  path(c,o.points);c.closePath();c.fillStyle=run.crash?.index===i?'#fff5e6':'#ff826c';c.fill();
  c.lineWidth=1.25;c.strokeStyle='#ffe1b9';c.stroke();
  const seam=offset(o.p,OBSTACLES[i].height*.68);
  path(c,[o.points[0],seam,o.points[3]]);c.strokeStyle='#ffd9b67c';c.stroke();
  if(!picked){
   c.save();c.translate(o.shard.x,o.shard.y);c.rotate(Math.PI/4+(reduced?0:time*1.2+i));
   c.fillStyle='#ffeca5';c.fillRect(-3.7,-3.7,7.4,7.4);c.restore();
  }
 }
 c.globalAlpha=1;
 if(run.polish){
  if(run.tutorial)for(let i=0;i<3;i++)if(run.index===i)tapHint(c,run,i,reduced);
  aurora(c,run,reduced);
 }else if(run.distance>FINISH-260){
  const gate=offset(surface(FINISH-5),24);
  c.save();c.translate(gate.x,gate.y);c.rotate(Math.PI/4);c.strokeStyle=palette.track;c.lineWidth=3;
  c.strokeRect(-14,-14,28,28);c.lineWidth=1;c.strokeRect(-20,-20,40,40);c.restore();
 }
 const contact=offset(foot,1);
 c.save();c.translate(contact.x,contact.y);c.rotate(foot.a);
 ellipse(c,0,0,7,1.7,'#fff8de38');c.restore();
 const vanish=run.polish&&run.outro?.kind==='clear'?clamp(run.outro.age/.55,0,1):0;
 c.globalAlpha=1-vanish;
 root.MongyuMobile.sprite(c,{...actor,bodyHeight:44,renderAngle:foot.a,strideDistance:run.distance,
  nativeState:0,height:run.height,jumpProgress:run.flight===null?0:run.flight/FLIGHT},{poseTime:time,onDark:true},reduced);
 c.globalAlpha=1;
 if(run.crash&&!run.polish){
  const obstacle=OBSTACLE_ART[run.crash.index],impact=stageEdition&&obstacle?offset(obstacle.p,OBSTACLES[run.crash.index].height*.6):actor;
  c.beginPath();c.arc(impact.x,impact.y,stageEdition?18:13,0,Math.PI*2);
  c.strokeStyle=stageEdition?'#ffdfac':'#ff835d';c.lineWidth=stageEdition?1.35:2;c.stroke();
  if(stageEdition){c.beginPath();c.arc(impact.x,impact.y,22,0,Math.PI*2);c.strokeStyle='#f9a39770';c.lineWidth=.8;c.stroke();}
 }
 if(!reduced&&time-run.crossedAt<.32){
  const age=(time-run.crossedAt)/.32;c.globalAlpha=1-age;
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ellipse(c,actor.x+Math.cos(a)*(12+age*22),actor.y+Math.sin(a)*(12+age*22),1.6,1.6,'#ffeca5')}
 }
 c.restore();
 const line=dialogue(run);
 if(!line)return null;
 const head=offset(foot,run.height+44);
 return {text:line,x:clamp(cx+head.x*scale,92,Math.max(92,w-92)),y:clamp(cy+head.y*scale-10,88,Math.max(88,h-106))};
}
const api=Object.freeze({OpeningRun,validResult,draw,drawLobby,surface,project,SECTIONS,OBSTACLES,FINISH,PERFECT_LEAD,PERFECT_TOLERANCE,COACH,
 TIMING:Object.freeze({hitStop:HIT_STOP,crashOutro:CRASH_OUTRO,clearOutro:CLEAR_OUTRO,turn:TURN,turnZoom:TURN_ZOOM}),camSection,layout,posterView});
root.MongyuOpening=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
