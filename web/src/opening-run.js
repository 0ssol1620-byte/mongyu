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
const PERFECT_LEAD=SPEED*FLIGHT/2,PERFECT_TOLERANCE=10,HIT_STOP=.12,CRASH_OUTRO=.72,CLEAR_OUTRO=1.05,FINISH_SLOW=18,FINISH_SCALE=.35;
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
function obstacleHeight(o,gap){
 const relative=Math.max(0,Math.abs(gap)-FOOT)/o.width;
 return o.height*clamp((1-relative)/.72,0,1);
}

class OpeningRun{
 constructor(options){
  this.options=options;this.openingCourse=true;this.mode='restoration';this.slot=options.slot;
  this.settings={...options.settings};this.attempt=options.attempt;this.practice=options.practice===true;
  this.checkpoint=this.practice?clamp(Math.trunc(options.section||0),0,2):0;
  this.familyIndex=0;this.state='ready';this.time=0;this.updates=0;this.inputCount=0;
  this.score=0;this.clean=0;this.jumps=0;this.hits=0;this.hearts=1;
  this.flight=null;this.buffer=0;this.held=false;this.events=[];
  this.distance=SECTIONS[this.checkpoint].start;
  this.firstIndex=this.checkpoint*2;
  this.endIndex=this.practice?this.firstIndex+2:OBSTACLES.length;
  this.index=this.firstIndex;this.mapChanges=sectionAt(this.distance);
  this.height=0;this.result=null;this.crossedAt=-10;this.lastJump=-Infinity;
  this.polish=root.MONGYU_POLISH_EDITION===true;
  if(this.polish){
   this.clock=0;this.hitStop=0;this.outro=null;this.timeScale=1;this.coach=null;this.perfectStreak=0;this.bestStreak=0;this.points=0;this.wallCoached=false;
   this.tutorial=!this.practice&&(options.attempt===1||options.tutorial===true);this.slowChance=this.tutorial?'pending':'off';
  }
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
  if(this.flight!==null){if(this.flight>=FLIGHT-BUFFER)this.buffer=BUFFER;return false}
  if(this.polish&&this.slowChance==='active'){
   if(this.distance<OBSTACLES[0].at-SLOW_QUEUE){this.slowChance='queued';return true}
   this.slowChance='done';
  }
  return this.jump();
 }
 jump(){this.flight=0;this.lastJump=this.distance;this.jumps++;this.buffer=0;this.events.push('jump');return true}
 drainEvents(){return this.events.splice(0)}
 tick(dt){
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
   if(this.polish){this.points=0;this.perfectStreak=0}
  }
  const step=(this.practice ? .78 : 1)*dt;
  this.distance=Math.min(FINISH,this.distance+SPEED*step);
  this.buffer=Math.max(0,this.buffer-step);
  if(this.flight!==null){
   this.flight+=step;
   const phase=Math.min(1,this.flight/FLIGHT);
   this.height=4*PEAK*phase*(1-phase);
   if(phase===1){this.flight=null;this.events.push('land');if(this.buffer>0)this.jump()}
  }
  if(this.polish)this.coachCourse();
  const sector=sectionAt(this.distance);
  if(sector!==this.mapChanges){this.mapChanges=sector;this.events.push('corner')}
  const obstacle=OBSTACLES[this.index];
  if(obstacle){
   const gap=this.distance-obstacle.at,reach=obstacle.width+FOOT;
   if(this.height<obstacleHeight(obstacle,gap)){
    this.hits++;this.crash={index:this.index,section:sector,at:this.distance,early:obstacle.at-this.lastJump>55&&obstacle.at-this.lastJump<98};
    this.events.push('hit');
    if(this.polish){
     this.perfectStreak=0;this.hitStop=reducedMotion()?0:HIT_STOP;this.setCoach(this.crash.early?'early':'late',3.5);
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
  if(this.polish)this.score=this.points+Math.floor(this.distance-SECTIONS[this.checkpoint].start);
  if(this.polish&&!this.practice&&this.distance>=FINISH){
   this.points+=FINISH_BONUS;this.score+=FINISH_BONUS;this.outro={kind:'clear',age:0,duration:CLEAR_OUTRO};return;
  }
  if(this.distance>=FINISH||this.practice&&this.index===this.endIndex)this.finish('clear');
 }
 /* R104: real-time pacing on top of the simulation clock. Returns the simulated step (0 = frozen this tick).
    run.time only advances by simulated steps, so distance===time*SPEED still holds for validResult. */
 pace(dt){
  this.clock+=dt;
  if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);return 0}
  if(this.outro){this.outro.age+=dt;if(this.outro.age>=this.outro.duration&&this.state==='play')this.finish(this.outro.kind);return 0}
  const first=OBSTACLES[0];let target=1;
  if(this.slowChance==='pending'&&this.index===0&&this.distance>=first.at-SLOW_START)this.slowChance=this.flight===null?'active':'done';
  if(this.slowChance==='active'){target=SLOW_SCALE;this.setCoach('slow',.5)}
  if(!this.practice&&this.index===this.endIndex&&this.distance>=FINISH-FINISH_SLOW&&!reducedMotion())target=FINISH_SCALE;
  this.timeScale+=(target-this.timeScale)*Math.min(1,dt*(target<this.timeScale?9:7));
  if(Math.abs(target-this.timeScale)<.004)this.timeScale=target;
  let step=dt*this.timeScale;
  if(this.slowChance==='active')step=clamp((first.at-SLOW_HOLD-this.distance)/SPEED,0,step);
  return step;
 }
 setCoach(kind,hold){this.coach={kind,text:COACH[kind],until:this.time+hold}}
 coachCourse(){
  if(this.slowChance==='queued'&&this.distance>=OBSTACLES[0].at-SLOW_QUEUE){this.slowChance='done';if(this.flight===null)this.jump()}
  if(!this.wallCoached&&!this.practice&&this.distance>=FLOOR&&this.distance<WALL_START&&(!this.coach||this.time>=this.coach.until||this.distance>=WALL_START-30)){this.wallCoached=true;this.setCoach('wall',1.5)}
 }
 scorePass(obstacle,clean){
  const lead=obstacle.at-this.lastJump,perfect=Math.abs(lead-PERFECT_LEAD)<=PERFECT_TOLERANCE;
  this.perfectStreak=perfect?this.perfectStreak+1:0;this.bestStreak=Math.max(this.bestStreak,this.perfectStreak);
  this.points+=100+(clean?CLEAN_BONUS:0)+(perfect?50*Math.min(5,this.perfectStreak):0);
  if(perfect)this.setCoach('perfect',.7);
  this.events.push(perfect?'perfect':'pass');
 }
 finish(state){
  this.state=state;
  this.result={runVersion:97,mode:this.mode,slotId:this.slot.id,ruleId:this.slot.ruleId,
   completed:true,practice:this.practice,state,attempt:this.attempt,time:this.time,
   hits:this.hits,score:this.polish?(this.index-this.firstIndex)*100+this.clean*CLEAN_BONUS:this.score,jumps:this.jumps,kicks:0,mapChanges:this.mapChanges,
   bestCombo:this.index-this.firstIndex,
   openingProof:{course:COURSE,passed:this.index,clean:this.clean,distance:this.distance},
   reason:this.crash?SECTIONS[this.crash.section].name+' '+(this.crash.index%2+1)+'번째 장애물에서 충돌':'빛의 문을 통과했어요.'};
  this.events.push(state);
 }
 status(){
  const section=SECTIONS[this.mapChanges],crash=this.crash;
  const prompt=crash&&this.practice?'잠시 후 '+section.name+' 처음부터':this.time-this.crossedAt<.65?'빛 회수':this.index===this.firstIndex?'장애물 앞에서 탭':this.distance>=FLOOR&&this.distance<WALL_START+72?'벽에서도 같은 타이밍으로 탭':'';
  return {mode:this.mode,state:this.state,time:this.time,hearts:this.hearts,score:this.score,best:0,
   progress:this.distance/FINISH,roomTitle:'접힌 빛',roomIndex:this.mapChanges,roomCount:SECTIONS.length,
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
 let ink=auroraInks.get(c);if(ink)return ink;
 const curtain=CURTAINS.map(([,,height,rgb])=>{const g=c.createLinearGradient(0,0,0,-height);
  g.addColorStop(0,'rgba(255,252,240,.95)');g.addColorStop(.05,'rgba('+rgb+',.85)');g.addColorStop(.3,'rgba('+rgb+',.4)');g.addColorStop(.68,'rgba('+rgb+',.13)');g.addColorStop(1,'rgba('+rgb+',0)');return g});
 const halo=c.createRadialGradient(0,-90,6,0,-90,150);halo.addColorStop(0,'rgba(150,128,255,.2)');halo.addColorStop(.55,'rgba(86,196,232,.08)');halo.addColorStop(1,'rgba(86,196,232,0)');
 const base=c.createRadialGradient(0,0,0,0,0,36);base.addColorStop(0,'rgba(255,255,244,.95)');base.addColorStop(.35,'rgba(170,246,232,.55)');base.addColorStop(1,'rgba(170,246,232,0)');
 ink={curtain,halo,base};auroraInks.set(c,ink);return ink;
}
function ribbon(c,x,width,height,t,phase,narrow){
 const n=16;c.beginPath();
 for(let k=0;k<=n;k++){const u=k/n,sway=Math.sin(k*.42+t*1.1+phase)*9*u+Math.sin(t*.7+phase)*2,half=width*narrow*(1-.38*u)+Math.sin(k*.9-t*1.6+phase)*1.4*narrow;c[k?'lineTo':'moveTo'](x+sway-half,-height*u)}
 for(let k=n;k>=0;k--){const u=k/n,sway=Math.sin(k*.42+t*1.1+phase)*9*u+Math.sin(t*.7+phase)*2,half=width*narrow*(1-.38*u)+Math.sin(k*.9-t*1.6+phase)*1.4*narrow;c.lineTo(x+sway+half,-height*u)}
 c.closePath();c.fill();
}
function aurora(c,run,reduced){
 const p=surface(FINISH),ink=auroraInk(c),t=(reduced?.18:1)*(run.clock??run.time),outro=run.outro?.kind==='clear'?clamp(run.outro.age/.5,0,1):0;
 const strength=(.58+.42*clamp((run.distance-FINISH+520)/420,0,1))*(1+outro*.35);
 c.save();c.translate(p.x,p.y);c.rotate(p.a);c.globalCompositeOperation='lighter';
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
 c.save();c.translate(x,y);c.globalCompositeOperation='lighter';
 c.beginPath();c.ellipse(0,0,6,1.8,0,0,Math.PI*2);c.fillStyle='rgba(255,236,200,'+(.35+.4*press/3.4).toFixed(3)+')';c.fill();
 if(!reduced&&cycle<.5){const r=cycle*2;c.beginPath();c.ellipse(0,0,5+r*15,1.6+r*4.2,0,0,Math.PI*2);c.strokeStyle='rgba(255,236,200,'+(.8*(1-r)).toFixed(3)+')';c.lineWidth=1.1;c.stroke()}
 c.globalCompositeOperation='source-over';
 if(HAND){const k=1,a=Math.PI-.42,lift=3.4-press;c.translate(-11-Math.sin(a)*(13.9*k+lift),-2+Math.cos(a)*(13.9*k+lift));c.rotate(a);c.scale(k,k);c.lineJoin='round';
  c.lineWidth=2.6;c.strokeStyle='rgba(32,20,56,.5)';c.stroke(HAND);c.fillStyle='#fff7ec';c.fill(HAND);c.lineWidth=.7;c.strokeStyle='#ffcfae';c.stroke(HAND)}
 c.restore();
}
function tapHint(c,run,index,reduced){
 const o=OBSTACLES[index],spot=o.at-(index===0?SLOW_HOLD+3:PERFECT_LEAD),gap=spot-run.distance,active=index===0&&(run.slowChance==='active'||run.slowChance==='queued');
 if(!active&&(gap>240||gap<-12))return;
 const t=run.clock??run.time,fade=active?1:clamp((240-gap)/70,0,1)*clamp((gap+12)/12,0,1),near=active?1:clamp(1-Math.abs(gap)/30,0,1);
 const p=surface(spot),pulse=reduced?0:Math.sin(t*5.4);
 c.save();c.translate(p.x,p.y);c.rotate(p.a);c.globalCompositeOperation='lighter';
 c.globalAlpha=fade*(.45+.55*near);
 c.beginPath();c.ellipse(0,-1,11+pulse,3.4+pulse*.3,0,0,Math.PI*2);c.lineWidth=4.5;c.strokeStyle='rgba(255,196,150,.28)';c.stroke();
 c.lineWidth=1.3;c.strokeStyle='#fff1d6';c.stroke();
 c.beginPath();c.ellipse(0,-1,7,2,0,0,Math.PI*2);c.fillStyle='rgba(255,226,180,.35)';c.fill();
 if(!reduced){const r=(t*.8)%1;c.beginPath();c.ellipse(0,-1,11+r*12,3.4+r*3.4,0,0,Math.PI*2);c.lineWidth=.9;c.strokeStyle='rgba(255,226,190,'+(.6*(1-r)).toFixed(3)+')';c.stroke()}
 c.globalAlpha=fade*.22*(.5+near);c.fillStyle='#ffe6c4';c.fillRect(-.8,-34,1.6,32);
 c.restore();
 if(active){const f=offset(p,1);finger(c,f.x,f.y,t,reduced);return}
 const label=offset(p,24);c.save();c.globalAlpha=fade*(.55+.45*near);c.font='700 9px system-ui,sans-serif';c.textAlign='center';c.textBaseline='middle';
 c.fillStyle='rgba(30,18,52,.6)';c.fillText('탭',label.x+.5,label.y+.7);c.fillStyle='#fff3dc';c.fillText('탭',label.x,label.y);c.restore();
}
function project(run,s,h=0){const v=run.view;if(!v)return null;const p=offset(surface(s),h);return {x:v.cx+p.x*v.scale,y:v.cy+p.y*v.scale}}
function draw(c,run,opts){
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
const api=Object.freeze({OpeningRun,validResult,draw,drawLobby,surface,project,SECTIONS,OBSTACLES,FINISH,PERFECT_LEAD,PERFECT_TOLERANCE,COACH});
root.MongyuOpening=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
