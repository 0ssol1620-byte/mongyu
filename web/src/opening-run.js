/* 몽유's authored opening route. Positions are arc lengths along the running surface. */
(function(root){'use strict';
const dreamEdition=root.MONGYU_DREAM_EDITION===true;
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
  this.inputCount++;
  if(this.flight!==null){if(this.flight>=FLIGHT-BUFFER)this.buffer=BUFFER;return false}
  return this.jump();
 }
 jump(){this.flight=0;this.lastJump=this.distance;this.jumps++;this.buffer=0;this.events.push('jump');return true}
 drainEvents(){return this.events.splice(0)}
 tick(dt){
  if(this.state!=='play')return;
  this.updates++;this.time+=dt;
  if(this.recoverAt!==undefined){
   if(this.time<this.recoverAt)return;
   this.recoverAt=undefined;this.crash=null;
   this.distance=SECTIONS[this.checkpoint].start;this.index=this.firstIndex;
   this.score=0;this.clean=0;this.lastJump=-Infinity;
   this.height=0;this.flight=null;this.buffer=0;this.crossedAt=-10;
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
  const sector=sectionAt(this.distance);
  if(sector!==this.mapChanges){this.mapChanges=sector;this.events.push('corner')}
  const obstacle=OBSTACLES[this.index];
  if(obstacle){
   const gap=this.distance-obstacle.at,reach=obstacle.width+FOOT;
   if(this.height<obstacleHeight(obstacle,gap)){
    this.hits++;this.crash={index:this.index,section:sector,at:this.distance,early:obstacle.at-this.lastJump>55&&obstacle.at-this.lastJump<98};
    this.events.push('hit');
    if(this.practice){this.recoverAt=this.time+.45;return}
    this.hearts=0;this.finish('fail');return;
   }
   if(gap>reach){
    this.index++;this.crossedAt=this.time;
    const clean=this.height>=obstacle.height+6;
    if(clean)this.clean++;
    this.score+=100+(clean?CLEAN_BONUS:0);
    this.events.push(clean?'perfect':'pass');
   }
  }
  if(this.distance>=FINISH||this.practice&&this.index===this.endIndex)this.finish('clear');
 }
 finish(state){
  this.state=state;
  this.result={runVersion:97,mode:this.mode,slotId:this.slot.id,ruleId:this.slot.ruleId,
   completed:true,practice:this.practice,state,attempt:this.attempt,time:this.time,
   hits:this.hits,score:this.score,jumps:this.jumps,kicks:0,mapChanges:this.mapChanges,
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
const lobby={};
function drawLobby(c,opts){
 const {width:w,height:h}=opts.viewport,wide=w>h*1.15,t=opts.reduced?0:opts.time||0;
 const x=wide?w*.72:w*.5,y=wide?h*.61:h*.61,r=Math.min(w*(wide?.19:.34),h*.24);
 c.save();backdrop(c,lobby,w,h,SECTIONS[0],x+r*.13,y-r*.63,Math.sin(t*.22)*5);
 c.translate(x,y);
 const floor=[{x:-r*1.6,y:r*.16},{x:r*.63,y:r*.16},{x:r*.92,y:r*.08},{x:r*1.12,y:-r*.23},{x:r*1.28,y:-r*.63}];
 path(c,floor);c.strokeStyle='#100e1e';c.lineJoin='round';c.lineWidth=16;c.stroke();
 c.translate(0,-5);
 path(c,floor);c.strokeStyle='#a06eaf';c.lineWidth=4;c.stroke();
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
function draw(c,run,opts){
 const {width:w,height:h}=opts.viewport,palette=SECTIONS[run.mapChanges],foot=surface(run.distance),reduced=opts.reduced;
 const actor=offset(foot,run.height+1.5),time=run.time,scale=clamp(Math.min(w/318,h/275),.63,2.5);
 const lead=surface(run.distance+(reduced?20:32)),target=offset(lead,35);
 const focusX=w*.48,focusY=h*.43;
 const cx=focusX-target.x*scale,cy=focusY-target.y*scale;
 c.save();
 backdrop(c,run,w,h,palette,w*.51-(target.x-110)*scale*.09,h*.37-(target.y+100)*scale*.07,-target.y*scale*.12);
 c.translate(cx,cy);c.scale(scale,scale);
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
 if(run.distance>FINISH-260){
  const gate=offset(surface(FINISH-5),24);
  c.save();c.translate(gate.x,gate.y);c.rotate(Math.PI/4);c.strokeStyle=palette.track;c.lineWidth=3;
  c.strokeRect(-14,-14,28,28);c.lineWidth=1;c.strokeRect(-20,-20,40,40);c.restore();
 }
 const contact=offset(foot,1);
 c.save();c.translate(contact.x,contact.y);c.rotate(foot.a);
 ellipse(c,0,0,7,1.7,'#fff8de38');c.restore();
 root.MongyuMobile.sprite(c,{...actor,bodyHeight:44,renderAngle:foot.a,strideDistance:run.distance,
  nativeState:0,height:run.height,jumpProgress:run.flight===null?0:run.flight/FLIGHT},{poseTime:time,onDark:true},reduced);
 if(run.crash){
  c.beginPath();c.arc(actor.x,actor.y,13,0,Math.PI*2);c.strokeStyle='#ff835d';c.lineWidth=2;c.stroke();
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
const api=Object.freeze({OpeningRun,validResult,draw,drawLobby,surface,SECTIONS,OBSTACLES,FINISH});
root.MongyuOpening=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
