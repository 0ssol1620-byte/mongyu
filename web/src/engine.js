/* QUAD//RIFT HD: independent mechanics and tutorial. No original game data. */
(function(root){'use strict';
const SIDE=276,LENGTH=SIDE*4,SPEED=120,JUMP_SECONDS=.68,JUMP_HEIGHT=50,HAZARD_HEIGHT=18,CLEARANCE=17;
// Distance remains the original gameplay clock. Geometry alone uses arc length.
// Radius > maximum foot jump prevents inward-offset loops at every corner.
const CORNER_RADIUS=56,CORNER_BLEND=12,CORNER_LENGTH=Math.PI*CORNER_RADIUS/2+CORNER_BLEND;
// Smooth curvature ramps join a constant-radius middle. Unlike angle-only easing,
// these tangents are integrated into the actual position, including during jumps.
function cornerAngle(u){u=Math.max(0,Math.min(CORNER_LENGTH,u));if(u>CORNER_LENGTH/2)return Math.PI/2-cornerAngle(CORNER_LENGTH-u);if(u<CORNER_BLEND){const z=u/CORNER_BLEND;return CORNER_BLEND/CORNER_RADIUS*(z*z*z-z*z*z*z/2)}return (u-CORNER_BLEND/2)/CORNER_RADIUS}
const CORNER_SAMPLES=256,CORNER_STEP=CORNER_LENGTH/CORNER_SAMPLES,CORNER_POINTS=[{x:0,y:0}];
for(let i=1;i<=CORNER_SAMPLES;i++){const a=(i-1)*CORNER_STEP,b=i*CORNER_STEP,m=(a+b)/2,p=CORNER_POINTS[i-1];CORNER_POINTS.push({x:p.x+CORNER_STEP/6*(Math.cos(cornerAngle(a))+4*Math.cos(cornerAngle(m))+Math.cos(cornerAngle(b))),y:p.y+CORNER_STEP/6*(Math.sin(cornerAngle(a))+4*Math.sin(cornerAngle(m))+Math.sin(cornerAngle(b)))})}
const CORNER_EXTENT=CORNER_POINTS[CORNER_SAMPLES].x,STRAIGHT_LENGTH=SIDE-2*CORNER_EXTENT;
const QUARTER_PATH_LENGTH=STRAIGHT_LENGTH+CORNER_LENGTH,PATH_RATIO=QUARTER_PATH_LENGTH/SIDE;
const CORNER_START=STRAIGHT_LENGTH/PATH_RATIO,TUTORIAL_STOP=68,TUTORIAL_HAZARD=102;
function cornerPoint(u){u=Math.max(0,Math.min(CORNER_LENGTH,u));const i=Math.min(CORNER_SAMPLES-1,Math.floor(u/CORNER_STEP)),t=(u-i*CORNER_STEP)/CORNER_STEP,a=CORNER_POINTS[i],b=CORNER_POINTS[i+1],a0=cornerAngle(i*CORNER_STEP),a1=cornerAngle((i+1)*CORNER_STEP),h0=2*t*t*t-3*t*t+1,h1=t*t*t-2*t*t+t,h2=-2*t*t*t+3*t*t,h3=t*t*t-t*t;return {x:h0*a.x+h1*CORNER_STEP*Math.cos(a0)+h2*b.x+h3*CORNER_STEP*Math.cos(a1),y:h0*a.y+h1*CORNER_STEP*Math.sin(a0)+h2*b.y+h3*CORNER_STEP*Math.sin(a1)}}
const HAZARDS=[480,740,1010,1270,1530,1800,2060,2320,2590,2850,3110,3380,3640,3900,4170,4430,4690,4960,5220,5480,5750,6010,6270,6500];
const TUTORIAL_STEPS=['approach','jump','corner','confirm'];
const Content=root.QuadRiftContent||(typeof require==='function'?require('./content.js'):null);
class Game {
 constructor(options={}){this.best=Number.isFinite(options.best)?Math.max(0,Math.min(1000000,options.best)):0;this.tutorialDone=options.tutorialDone===true;this.savedStep=TUTORIAL_STEPS.includes(options.tutorialStep)?options.tutorialStep:'approach';this.selectedLevelId=Content&&Content.getLevel(options.levelId)?options.levelId:null;this.reset();this.state='title'}
 reset(){this.originLastHit=null;this.originHitFeedback=null;this.distance=0;this.time=0;this.hearts=3;this.score=0;this.jump=0;this.originJumpBuffer=null;this.invincible=0;this.hitFlash=0;this.passed=0;this.combo=0;this.bestCombo=0;this.stage=0;this.events=[];this.mode='campaign';this.tutorialStep=null;this.waiting=false;this.recoveries=0;this.hazards=HAZARDS.map(d=>({d,done:false}));this.level=null;this.levelId=this.selectedLevelId;this.result=null;this.boss=null;this.metrics={hits:0,jumps:0,perfect:0,ground:0,strikes:0,bossDamage:0};this.speed=SPEED;this.state='play'}
 selectLevel(id){if(!Content||!Content.getLevel(id))return false;this.selectedLevelId=id;this.levelId=id;return true}
 start(forceCampaign=false){if(!this.tutorialDone&&!forceCampaign){this.beginTutorial(this.savedStep);return true}if(this.selectedLevelId)return this.startLevel(this.selectedLevelId);this.reset();this.events.push('start');return true}
 startLegacy(){this.selectedLevelId=null;this.reset();this.events.push('start');return true}
 startLevel(id){const level=Content&&Content.getLevel(id);if(!level)return false;this.selectedLevelId=id;this.reset();this.level=level;this.levelId=id;this.speed=level.speed;this.hearts=level.heartLimit||3;this.stage=(level.chapter-1)%3;this.hazards=level.hazards.map(h=>({...h,done:false,hit:false,struck:false,centerHeight:null}));if(level.isBoss){const hp=level.bossHp;this.boss={hp,maxHp:hp,phase:1,attack:level.bossAttack||'dodge',flash:0,rule:level.bossRule}}this.events.push('start');this.events.push('level-start');return true}
 startFreeplay(id){if(!this.startLevel(id))return false;this.mode='freeplay';return true}
 beginTutorial(step='approach'){this.reset();this.tutorialDone=false;this.mode='tutorial';this.tutorialStep=TUTORIAL_STEPS.includes(step)?step:'approach';this.hearts=3;this.hazards=[{d:TUTORIAL_HAZARD,done:false}];if(this.tutorialStep==='jump'){this.distance=TUTORIAL_STOP;this.waiting=true}else if(this.tutorialStep==='corner'){this.distance=205;this.hazards[0].done=true}else if(this.tutorialStep==='confirm'){this.distance=320;this.hazards[0].done=true;this.waiting=true}this.events.push('tutorial-start');this.events.push('tutorial-progress')}
 skipTutorial(){if(this.mode!=='tutorial')return false;this.tutorialDone=true;this.savedStep='approach';this.start(true);this.events.unshift('tutorial-skip');return true}
 completeTutorial(){this.tutorialDone=true;this.savedStep='approach';this.start(true);this.events.unshift('tutorial-complete')}
 action(){if(['title','fail','clear'].includes(this.state)){if(this.mode==='freeplay'&&this.levelId)return this.startFreeplay(this.levelId);if(this.state!=='title'&&this.level)return this.startLevel(this.levelId);return this.start()}if(this.state!=='play')return false;if(this.mode==='tutorial'&&this.tutorialStep==='confirm'){this.completeTutorial();return true}if(this.jump>0){if(this.level&&this.boss&&this.height()>=CLEARANCE){const h=this.hazards.find(h=>!h.done&&h.strike&&!h.struck&&h.d-this.distance<=48&&h.d-this.distance>=-15);if(h){h.struck=true;this.metrics.strikes++;this.boss.flash=.28;this.events.push('boss-strike');return true}}return false}if(this.mode==='tutorial'&&this.tutorialStep==='approach')return false;this.waiting=false;this.jump=JUMP_SECONDS;this.metrics.jumps++;this.events.push('jump');return true}
 pause(){this.originJumpBuffer=null;if(this.state==='play'){this.originHitFeedback=null;this.state='pause';this.events.push('pause');return true}return false}
 resume(){if(this.state==='pause'){this.state='play';this.events.push('resume');return true}return false}
 title(){this.originLastHit=null;this.originHitFeedback=null;this.originJumpBuffer=null;this.state='title';this.jump=0;this.events=[]}
 height(){return this.jump>0?Math.sin((1-this.jump/JUMP_SECONDS)*Math.PI)*JUMP_HEIGHT:0}
 objectiveProgress(){if(!this.level)return [];const m={...this.metrics,combo:this.bestCombo,passed:this.passed,finish:this.distance>=this.level.length};const rows=this.level.objectives.map(o=>{const value=o.type==='finish'?(m.finish?1:0):m[o.type]||0,met=o.type==='finish'?!!m.finish:(o.type==='hits'||o.type==='jumps'?value<=o.target:value>=o.target);return {...o,value,met}});if(this.boss)rows.push({type:'boss',target:this.boss.maxHp,text:'보스 체력 모두 소진',value:this.metrics.bossDamage,met:this.boss.hp===0});return rows}
 bossCue(){if(!this.level)return null;const h=this.hazards.find(h=>!h.done&&h.d+(h.width||18)/2>=this.distance),change=(this.level.speedChanges||[]).find(c=>c.at>this.distance&&c.at-this.distance<=240);if(change&&(!h||change.at<h.d))return {text:change.cue,type:'speed',distance:change.at-this.distance,phase:this.boss?this.boss.phase:1,strike:false};if(!h)return null;const distance=h.d-this.distance;if(distance>Math.max(240,this.level.revealDistance||0))return null;const text=h.strike?'점프 중 한 번 더 눌러 반격':h.type==='beam'?'낮게 지나가기 · 점프 금지':h.type==='precision'?'높이 정점에서 통과':h.type==='high'?'높은 벽 · 미리 점프':'벽을 뛰어넘어 회피';return {text:this.boss&&this.boss.hp===0?'마지막 파동 · '+text:text,type:h.type,distance,phase:this.boss?this.boss.phase:1,strike:!!h.strike}}
 finish(state,reason=''){this.originJumpBuffer=null;this.state=state;this.score=Math.floor(this.distance/24)+this.passed*5+this.metrics.perfect*3+this.metrics.strikes*10;this.best=Math.max(this.best,this.score);const objectivesMet=this.objectiveProgress().every(o=>o.met);this.result={levelId:this.levelId,mode:this.mode,state,objectivesMet,score:this.score,...this.metrics,passed:this.passed,bestCombo:this.bestCombo,time:this.time,reason,bossDefeated:!this.boss||this.boss.hp===0};this.events.push(state)}
 campaignStep(dt){const old=this.distance,jumpBefore=this.jump;this.time+=dt;this.hitFlash=Math.max(0,this.hitFlash-dt);this.invincible=Math.max(0,this.invincible-dt);if(this.boss)this.boss.flash=Math.max(0,this.boss.flash-dt);
  this.speed=this.level.speed;for(const change of this.level.speedChanges||[])if(old>=change.at)this.speed=change.speed;this.jump=Math.max(0,this.jump-dt);this.distance=Math.min(this.level.length,old+this.speed*dt);
  const heightAt=d=>{const elapsed=Math.max(0,Math.min(dt,(d-old)/this.speed)),remaining=Math.max(0,jumpBefore-elapsed);return remaining>0?Math.sin((1-remaining/JUMP_SECONDS)*Math.PI)*JUMP_HEIGHT:0};
  if(this.boss){const phase=Math.min(3,1+Math.floor(this.distance/this.level.length*3));if(phase!==this.boss.phase){this.boss.phase=phase;this.events.push('boss-phase')}}
  for(const h of this.hazards){if(h.done)continue;const half=(h.width||18)/2,left=h.d-half,right=h.d+half;if(old<=h.d&&this.distance>=h.d)h.centerHeight=heightAt(h.d);
   if(this.distance>=left&&old<=right){const lo=Math.max(old,left),hi=Math.min(this.distance,right),a=heightAt(lo),b=heightAt(hi),beam=h.type==='beam';let collision=beam?Math.max(a,b)>(h.ceiling??10)+1e-7:Math.min(a,b)<(h.clearance??CLEARANCE)-1e-7;
    // Counterattacks must be confirmed before crossing the center, not by holding a key.
    if(h.strike&&this.distance>=h.d&&!h.struck)collision=true;
    if(collision){h.hit=true;h.done=true;this.combo=0;this.metrics.hits++;this.hearts--;this.hitFlash=.24;this.invincible=.18;this.events.push('hit');if(this.hearts<=0){this.finish('fail','하트를 모두 잃었습니다. 다시 도전해 주세요.');return}}
   }
   if(!h.done&&this.distance>right){h.done=true;this.passed++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);if(h.type==='beam')this.metrics.ground++;else if((h.centerHeight??0)>=42)this.metrics.perfect++;this.events.push('pass');if(this.boss){const damage=h.strike?2:1;this.metrics.bossDamage+=damage;this.boss.hp=Math.max(0,this.boss.hp-damage);this.boss.flash=.22;this.events.push('boss-damage')}}
  }
  this.score=Math.floor(this.distance/24)+this.passed*5+this.metrics.perfect*3+this.metrics.strikes*10;
  if(this.distance>=this.level.length){const failed=this.objectiveProgress().filter(o=>!o.met);if(this.mode==='freeplay'||failed.length===0)this.finish('clear');else this.finish('fail','미션 미달: '+failed.map(o=>o.text).join(' · '))}
 }
 update(dt){if(this.state!=='play')return;dt=Math.max(0,Math.min(.05,Number.isFinite(dt)?dt:0));if(this.level&&this.mode!=='tutorial'){let remaining=dt;while(remaining>1e-10&&this.state==='play'){const step=Math.min(1/120,remaining);this.campaignStep(step);remaining-=step}return}this.time+=dt;this.hitFlash=Math.max(0,this.hitFlash-dt);this.invincible=Math.max(0,this.invincible-dt);if(this.waiting)return;this.jump=Math.max(0,this.jump-dt);this.distance+=(SPEED+this.stage*8)*dt;
 if(this.mode==='tutorial'){
  if(this.tutorialStep==='approach'&&this.distance>=TUTORIAL_STOP){this.distance=TUTORIAL_STOP;this.waiting=true;this.tutorialStep='jump';this.events.push('tutorial-progress');return}
  if(this.tutorialStep==='jump'){const d=this.distance-TUTORIAL_HAZARD;if(d>=-8&&d<=10&&this.height()<CLEARANCE){this.distance=TUTORIAL_STOP;this.jump=0;this.waiting=true;this.recoveries++;this.events.push('tutorial-retry');return}if(d>10&&this.jump===0){this.hazards[0].done=true;this.tutorialStep='corner';this.events.push('tutorial-progress')}}
  if(this.tutorialStep==='corner'&&this.distance>=320){this.distance=320;this.waiting=true;this.jump=0;this.tutorialStep='confirm';this.events.push('tutorial-progress')}
  return;
 }
 this.stage=Math.min(2,Math.floor(this.distance/(LENGTH*2)));for(const h of this.hazards){if(h.done)continue;const delta=this.distance-h.d;if(delta>=-8&&delta<=10&&this.height()<CLEARANCE&&this.invincible===0){h.done=true;this.hearts--;this.combo=0;this.invincible=1.1;this.hitFlash=.24;this.events.push('hit');if(this.hearts===0){this.state='fail';this.events.push('fail');break}}else if(delta>10){h.done=true;this.passed++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.events.push('pass')}}this.score=Math.floor(this.distance/24)+this.passed*5;if(this.state==='play'&&this.distance>=LENGTH*6){this.state='clear';this.events.push('clear')}if(this.state==='fail'||this.state==='clear')this.best=Math.max(this.best,this.score)
 }
 drain(){const e=this.events;this.events=[];return e}
}
// The same C1 rounded path drives feet, body tangent, shadows and hazards.
// Unwrapped angle is continuous through all quarter joins and lap boundaries.
function rail(s){
 const quarter=Math.floor(s/SIDE),local=s-quarter*SIDE,u=local*PATH_RATIO;
 const arc=Math.max(0,Math.min(CORNER_LENGTH,u-STRAIGHT_LENGTH)),theta=cornerAngle(arc),turn=arc/CORNER_LENGTH;
 let x,y;
 if(u<=STRAIGHT_LENGTH){x=42+CORNER_EXTENT+u;y=382}
 else{const p=cornerPoint(arc);x=318-CORNER_EXTENT+p.x;y=382-p.y}
 const rotation=-(((quarter%4)+4)%4)*Math.PI/2,dx=x-180,dy=y-244,cs=Math.cos(rotation),sn=Math.sin(rotation),angle=(-quarter*Math.PI/2-theta)||0;
 return {x:180+dx*cs-dy*sn,y:244+dx*sn+dy*cs,angle,nx:Math.sin(angle),ny:-Math.cos(angle),turn};
}
// Reduced motion removes decoration, never the essential geometry of a turn.
function angleAt(s,reduced=false){return rail(s).angle}
// R6 gameplay-family adapter. Tutorial/legacy rail code above remains intact.
// All interactions below are driven by action/update only; no production autoplay.
const oldBeginTutorial=Game.prototype.beginTutorial,oldStartLevel=Game.prototype.startLevel,oldAction=Game.prototype.action,oldCampaignStep=Game.prototype.campaignStep,oldObjectiveProgress=Game.prototype.objectiveProgress,oldBossCue=Game.prototype.bossCue,oldFinish=Game.prototype.finish;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),overlap=(a,b)=>Math.abs(a.x-b.x)<(a.width+b.width)/2&&Math.abs(a.y-b.y)<(a.height+b.height)/2;
const R6_ROOMS=[{x:30,y:112,width:143,height:137},{x:187,y:112,width:143,height:137},{x:30,y:263,width:143,height:137},{x:187,y:263,width:143,height:137}];
function r6Mode(g){return !!(g.level&&g.level.contentVersion===6)}
function arenaMode(g){return r6Mode(g)&&g.gameMode.endsWith('-arena')}
Game.prototype.beginTutorial=function(step='approach'){oldBeginTutorial.call(this,step);this.gameMode='tutorial-floor'};
Game.prototype.startLevel=function(id){const ok=oldStartLevel.call(this,id);if(!ok)return false;this.gameMode=this.level.gameMode||'legacy-rail';this.modeParams=this.level.modeParams||{};this.projectiles=[];this.arena=null;this.gapRecovery=0;this.transformPhase='steady';this.roomPasses=[0,0,0,0];this.metrics={...this.metrics,rooms:0,shots:0,misses:0,deflects:0,dodges:0,kicks:0};if(arenaMode(this)){this.hazards=[];this.arena={cooldown:0,lane:1,x:180,fromX:180,toX:180,move:0,cycle:-1,lockedLane:1,resolved:false,kick:0,kickedCycle:-1,attackEmitted:-1,shotLimit:this.boss.maxHp*3+4};this.boss.pose=this.bossPose()}return true};
// Transform phase is a pure function of simulation distance: pause and reduced motion
// cannot desynchronize visible track from physical track. Authored, not original fever.
Game.prototype.worldTransform=function(){
 const p=r6Mode(this)&&!arenaMode(this)&&this.mode!=='tutorial'&&this.modeParams?.worldTransform;if(!p)return null;
 const d=this.distance,ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};let phase='steady',amount=0,next=p.start-p.warning;
 if(d>=p.end+p.ramp){phase='restored';next=this.level.length}
 else if(d>=p.end){phase='settling';amount=1-ease((d-p.end)/p.ramp);next=p.end+p.ramp}
 else if(d>=p.start+p.ramp){phase='crest';amount=1;next=p.end}
 else if(d>=p.start){phase='rising';amount=ease((d-p.start)/p.ramp);next=p.start+p.ramp}
 else if(d>=p.start-p.warning){phase='warning';next=p.start}
 const labels={steady:'고요한 길',warning:'지형 변형 예고',rising:'길이 솟아오릅니다',crest:'물결 지형',settling:'길이 가라앉습니다',restored:'다시 고요한 길'};
 const texts={steady:'',warning:'곧 길이 솟아 · 틈은 그대로',rising:'길이 솟아도 틈 앞에서 점프',crest:'솟은 길 · 다음 위험을 읽어',settling:'길이 천천히 제자리로',restored:'길이 돌아왔어'};
 return {phase,label:labels[phase],text:texts[phase],amount,nextIn:Math.max(0,(next-d)/this.speed),authored:true};
};
Game.prototype.railAt=function(d,room=0){if(this.mode==='tutorial')return {x:56+.7*d,y:346,angle:0,nx:0,ny:-1,room:0};if(!r6Mode(this))return rail(d);if(this.gameMode==='four-room'){const box=R6_ROOMS[clamp(room|0,0,3)],x=box.x+35+(d-this.distance)*.38,y=box.y+105;return {x,y,angle:0,nx:0,ny:-1,room}}
 if(this.gameMode==='morph-floor'||this.gameMode==='wave-run'){
  const morph=this.gameMode==='morph-floor',transform=this.worldTransform(),amplitude=(morph?0:43)+(transform?.amount||0)*(this.modeParams.worldTransform?.amplitude||0),phase=d/(morph?175:145)+this.level.chapter*.37;
  const y=(morph?328+Math.sin(this.time*.72)*10:305)+amplitude*Math.sin(phase),angle=Math.atan2(amplitude/(morph?175:145)*Math.cos(phase),.7);
  return {x:92+(d-this.distance)*.7,y,angle,nx:Math.sin(angle),ny:-Math.cos(angle),room:0};
 }
 return {x:this.gameMode==='dodge-arena'?this.arena?.x||180:this.gameMode==='throw-arena'?80:180,y:354,angle:0,nx:0,ny:-1,room:0};
};
Game.prototype.actorPoses=function(reduced=false){if(!r6Mode(this)){const q=this.railAt(this.distance);return [{...q,height:this.height(),phase:this.distance*.14,scale:.75,room:0}]};if(this.gameMode==='four-room')return R6_ROOMS.map((_,room)=>({...this.railAt(this.distance,room),height:this.height()*.59,phase:this.distance*.14,scale:.5,room}));const q=this.railAt(this.distance),recoveryDrop=this.gapRecovery>0?12*Math.sin(Math.PI*(1-this.gapRecovery/.4)):0,facing=this.gameMode==='dodge-arena'&&this.arena.move>0&&this.arena.toX<this.arena.fromX?-1:1;return [{...q,facing,recoveryDrop,height:this.gameMode==='kick-arena'?this.airHeight():this.gameMode==='throw-arena'||this.gameMode==='dodge-arena'?0:this.height()-recoveryDrop,phase:this.distance*.14,scale:.75,room:0}]};
Game.prototype.actorPose=function(reduced=false){const poses=this.actorPoses(reduced);if(poses.length===1)return poses[0];const next=this.hazards.find(h=>!h.done&&h.d+(h.width||18)/2>=this.distance);return poses[next?.room||0]};
Game.prototype.airHeight=function(){return this.jump>0?Math.sin((1-this.jump/1.28)*Math.PI)*132:0};
Game.prototype.bossPose=function(at=this.time){if(!arenaMode(this))return null;const a=this.arena,p=this.modeParams,mode=this.gameMode;if(mode==='throw-arena')return {x:271+Math.sin(at*.83)*12,y:267+Math.sin(at*1.4)*67,width:46,height:48,vulnerable:true,attack:'patrol'};const phase=at%p.cycle;if(mode==='dodge-arena'){const lane=a?.lockedLane??1,targetX=[90,180,270][lane],blend=clamp(phase/.4,0,1),x=(a?.previousBossX??targetX)+(targetX-(a?.previousBossX??targetX))*blend,y=phase<1.3?144:phase<2.36?144+(phase-1.3)/1.06*188:phase<2.52?332:332-188*((phase-2.52)/(p.cycle-2.52))**2;return {x,y,width:42,height:44,vulnerable:false,attack:phase<1.3?'telegraph':phase<2.36?'charge':phase<2.72?'rebound':'recover',lane}}return {x:180+Math.sin(at*.7)*10,y:211+Math.sin(at*.9)*8,width:48,height:44,vulnerable:phase>=.85&&phase<=2.45,attack:phase<.85?'guard':phase<=2.45?'open':'shock'}};
Game.prototype.hazardPose=function(h){if(!r6Mode(this)){const q=this.railAt(h.d);return {...q,width:h.width||18,height:h.clearance||18,type:h.type||'barrier',room:0,visible:Math.abs(h.d-this.distance)<300}}const q=this.railAt(h.d,h.room||0),small=this.gameMode==='four-room',scale=small?.59:1,clearance=h.type==='piston'?18+6*Math.sin(this.time*1.7+h.phase):h.clearance||18;return {...q,width:(h.width||18)*(small?.38:.7),height:clearance*scale,clearance,ceiling:(h.ceiling||10)*scale,type:h.type,room:h.room||0,visible:small?q.x>R6_ROOMS[h.room||0].x-18&&q.x<R6_ROOMS[h.room||0].x+161:q.x>-32&&q.x<392}};
Game.prototype.geometry=function(){const kind=this.gameMode||'legacy-rail',out={kind,paths:[],platforms:[],rooms:[],boss:null,projectiles:[],telegraph:null,gaps:[],transform:this.worldTransform()};if(this.mode==='tutorial'){out.kind='tutorial-floor';out.paths=[{room:0,points:[{x:40,y:346},{x:320,y:346}]}];out.platforms=[{x:40,y:346,width:280,height:40}];return out}if(!r6Mode(this))return out;if(arenaMode(this)){out.paths=[{room:0,points:[{x:36,y:354},{x:324,y:354}]}];out.platforms=[{x:36,y:354,width:288,height:32}];out.boss=this.bossPose();out.projectiles=this.projectiles.filter(p=>!p.dead).map(p=>({...p}));if(kind==='dodge-arena'){const pose=out.boss;out.telegraph={type:pose.attack,lane:pose.lane,x:pose.x-27,y:114,width:54,height:266,remaining:Math.max(0,1.3-this.time%this.modeParams.cycle)}}else if(kind==='kick-arena'){out.telegraph={type:out.boss.attack,x:out.boss.x-32,y:out.boss.y-30,width:64,height:60,remaining:Math.max(0,2.45-this.time%this.modeParams.cycle)}}out.ammo=this.arena.shotLimit-this.metrics.shots;out.kick=this.arena.kick>0;return out}if(kind==='four-room'){out.rooms=R6_ROOMS.map((box,room)=>({...box,room}));for(let room=0;room<4;room++){const box=R6_ROOMS[room];out.paths.push({room,points:[{x:box.x+7,y:box.y+105},{x:box.x+box.width-7,y:box.y+105}]});out.platforms.push({x:box.x+7,y:box.y+105,width:box.width-14,height:20,room})}return out}if(kind==='wave-run'){const points=[];for(let x=16;x<=344;x+=4){const d=this.distance+(x-92)/.7;points.push(this.railAt(d))}out.paths=[{room:0,points}];return out}const gaps=this.hazards.filter(h=>h.type==='gap').map(h=>{const left=92+(h.d-h.width/2-this.distance)*.7,right=92+(h.d+h.width/2-this.distance)*.7;const points=[];for(let x=left;x<right;x+=4)points.push(this.railAt(this.distance+(x-92)/.7));points.push(this.railAt(h.d+h.width/2));return {id:h.id,d:h.d,points,left,right,leftY:this.railAt(h.d-h.width/2).y,rightY:this.railAt(h.d+h.width/2).y,y:this.railAt(h.d).y,depth:54,hit:!!h.hit}}).filter(g=>g.right>16&&g.left<344).sort((a,b)=>a.left-b.left);out.gaps=gaps;
 const addSpan=(left,right)=>{left=Math.max(16,left);right=Math.min(344,right);if(right<=left)return;const points=[];for(let x=left;x<right;x+=4)points.push(this.railAt(this.distance+(x-92)/.7));points.push(this.railAt(this.distance+(right-92)/.7));out.platforms.push({x:left,y:points[0].y,width:right-left,height:54,points});out.paths.push({room:0,points})};
 let x=16;for(const gap of gaps){addSpan(x,gap.left);x=Math.max(x,gap.right)}addSpan(x,344);return out};
Game.prototype.action=function(){if(this.state!=='play'||!arenaMode(this))return oldAction.call(this);const a=this.arena;if(this.gameMode==='throw-arena'){if(a.cooldown>0||this.metrics.shots>=a.shotLimit)return false;a.cooldown=this.modeParams.cooldown;this.metrics.shots++;this.projectiles.push({id:'shot-'+this.metrics.shots,x:94,y:332,width:10,height:10,vx:238,vy:0,owner:'player',dead:false});this.events.push('throw');return true}if(this.gameMode==='dodge-arena'){if(a.cooldown>0||a.move>0)return false;a.cooldown=this.modeParams.cooldown;a.lane=(a.lane+1)%3;a.fromX=a.x;a.toX=[90,180,270][a.lane];a.move=.16;this.events.push('dodge');return true}if(this.jump<=0){this.jump=1.28;this.metrics.jumps++;this.events.push('jump');return true}if(a.kick>0||a.kickedCycle===a.cycle||this.airHeight()<72)return false;a.kick=.24;a.kickedCycle=a.cycle;this.events.push('kick');return true};
Game.prototype.takeR6Hit=function(reason){if(this.invincible>0)return false;this.hearts--;this.metrics.hits++;this.combo=0;this.hitFlash=.25;this.invincible=.55;this.events.push('hit');if(this.hearts<=0)this.finish('fail',reason||'하트를 모두 잃었습니다.');return true};
Game.prototype.damageBoss=function(kind){if(!this.boss||this.boss.hp<=0)return;this.boss.hp--;this.metrics.bossDamage++;if(kind==='kick'){this.metrics.kicks++;this.metrics.strikes++}if(kind==='rebound')this.metrics.dodges++;this.boss.flash=.28;this.events.push('boss-damage');if(kind==='kick')this.events.push('boss-strike');const phase=Math.min(3,1+Math.floor((1-this.boss.hp/this.boss.maxHp)*3));if(phase!==this.boss.phase){this.boss.phase=phase;this.events.push('boss-phase')}if(this.boss.hp===0){this.distance=this.level.length;const failed=this.objectiveProgress().filter(o=>!o.met);if(this.mode==='freeplay'||failed.length===0)this.finish('clear');else this.finish('fail','미션 미달: '+failed.map(o=>o.text).join(' · '))}};
Game.prototype.r6RunnerStep=function(dt){const old=this.distance,jumpBefore=this.jump;this.time+=dt;this.gapRecovery=Math.max(0,(this.gapRecovery||0)-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);this.invincible=Math.max(0,this.invincible-dt);this.jump=Math.max(0,this.jump-dt);this.distance=Math.min(this.level.length,old+this.speed*dt);const transform=this.worldTransform();if(transform&&transform.phase!==this.transformPhase){this.transformPhase=transform.phase;this.events.push('world-transform-'+transform.phase)}const heightAt=d=>{const remain=Math.max(0,jumpBefore-clamp((d-old)/this.speed,0,dt));return remain>0?Math.sin((1-remain/JUMP_SECONDS)*Math.PI)*JUMP_HEIGHT:0};for(const h of this.hazards){if(h.done)continue;const half=h.width/2,left=h.d-half,right=h.d+half;if(old<=h.d&&this.distance>=h.d)h.centerHeight=heightAt(h.d);if(this.distance>=left&&old<=right){const lo=Math.max(old,left),hi=Math.min(this.distance,right),a=heightAt(lo),b=heightAt(hi),clearance=this.hazardPose(h).clearance,collision=h.type==='beam'?Math.max(a,b)>h.ceiling+1e-7:h.type==='gap'?Math.min(a,b)<8:Math.min(a,b)<clearance-1e-7;if(collision){if(h.type==='gap')this.gapRecovery=.4;h.hit=true;h.done=true;this.invincible=0;this.takeR6Hit(h.type==='gap'?'빈 발판에 떨어졌습니다. 틈 앞에서 점프하세요.':'위험에 부딪혔습니다. 다음 예고를 읽어 주세요.');if(this.state!=='play')return}}if(!h.done&&this.distance>right){h.done=true;this.passed++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);if(h.type==='beam')this.metrics.ground++;else if((h.centerHeight||0)>=42)this.metrics.perfect++;this.roomPasses[h.room||0]++;this.metrics.rooms=this.roomPasses.filter(n=>n>0).length;this.events.push('pass')}}this.score=Math.floor(this.distance/24)+this.passed*5+this.metrics.perfect*3;if(this.distance>=this.level.length){const failed=this.objectiveProgress().filter(o=>!o.met);if(this.mode==='freeplay'||!failed.length)this.finish('clear');else this.finish('fail','미션 미달: '+failed.map(o=>o.text).join(' · '))}};
Game.prototype.r6ArenaStep=function(dt){const a=this.arena,prevTime=this.time;this.time+=dt;this.distance=Math.min(this.level.length,this.time*this.speed);this.hitFlash=Math.max(0,this.hitFlash-dt);this.invincible=Math.max(0,this.invincible-dt);this.boss.flash=Math.max(0,this.boss.flash-dt);a.cooldown=Math.max(0,a.cooldown-dt);a.kick=Math.max(0,a.kick-dt);if(this.gameMode==='kick-arena')this.jump=Math.max(0,this.jump-dt);if(a.move>0){a.move=Math.max(0,a.move-dt);const t=1-a.move/.16,e=t*t*(3-2*t);a.x=a.fromX+(a.toX-a.fromX)*e}const cycle=Math.floor(this.time/this.modeParams.cycle),phase=this.time%this.modeParams.cycle;if(cycle!==a.cycle){a.previousBossX=[90,180,270][a.lockedLane];a.cycle=cycle;a.lockedLane=a.lane;a.resolved=false;a.kickedCycle=-1;this.events.push('attack-telegraph')}this.boss.pose=this.bossPose();
 if(this.gameMode==='throw-arena'){
  // Enemy projectiles and player projectiles occupy the same space and can collide.
  const attackWave=Math.floor(this.time*1.4/(Math.PI*2));if(this.boss.pose.y>=315&&Math.cos(this.time*1.4)<0&&a.attackEmitted!==attackWave){a.attackEmitted=attackWave;this.projectiles.push({id:'enemy-'+attackWave,x:this.boss.pose.x-28,y:332,width:13,height:13,vx:-136,vy:0,owner:'boss',dead:false});this.events.push('boss-projectile')}
  for(const p of this.projectiles)if(!p.dead){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.owner==='player'&&overlap(p,this.boss.pose)){p.dead=true;this.damageBoss('projectile');if(this.state!=='play')return}else if(p.owner==='boss'&&overlap(p,{x:82,y:332,width:16,height:30})){p.dead=true;this.takeR6Hit('날아오는 네모를 투척으로 막아 주세요.');if(this.state!=='play')return}if(p.x>350||p.x<16){p.dead=true;if(p.owner==='player')this.metrics.misses++}}
  for(const p of this.projectiles.filter(p=>!p.dead&&p.owner==='player'))for(const enemy of this.projectiles.filter(p=>!p.dead&&p.owner==='boss'))if(overlap(p,enemy)){p.dead=true;enemy.dead=true;this.metrics.deflects++;this.events.push('deflect');break}
  this.projectiles=this.projectiles.filter(p=>!p.dead);if(this.metrics.shots>=a.shotLimit&&!this.projectiles.some(p=>p.owner==='player')&&this.boss.hp>0)this.finish('fail','네모를 모두 사용했습니다. 보스가 투척 높이에 올 때 던져 주세요.');
 }else if(this.gameMode==='dodge-arena'){
  const body={x:a.x,y:335,width:18,height:37};if(this.boss.pose.attack==='charge'&&overlap(body,this.boss.pose)&&!a.resolved){a.resolved=true;this.takeR6Hit('돌진 예고 칸에서 벗어나 주세요.');if(this.state!=='play')return}if(phase>=2.36&&!a.resolved){a.resolved=true;this.events.push('boss-wall-impact');this.damageBoss('rebound');if(this.state!=='play')return}
 }else{
  const pose=this.actorPose(),foot={x:pose.x,y:pose.y-pose.height-10,width:42,height:23};if(a.kick>0&&this.boss.pose.vulnerable&&!a.resolved&&overlap(foot,this.boss.pose)){a.resolved=true;this.damageBoss('kick');if(this.state!=='play')return}if(phase>=2.65&&!a.resolved){a.resolved=true;this.takeR6Hit('열린 보스에 떠올라 공중에서 한 번 더 눌러 발차기하세요.');if(this.state!=='play')return}
 }
 this.score=this.metrics.bossDamage*100+this.metrics.deflects*15+Math.floor(this.time*2);if(this.time>=this.modeParams.duration&&this.state==='play')this.finish('fail','제한 시간 안에 보스를 격파하지 못했습니다.');
};
Game.prototype.campaignStep=function(dt){if(!r6Mode(this))return oldCampaignStep.call(this,dt);return arenaMode(this)?this.r6ArenaStep(dt):this.r6RunnerStep(dt)};
Game.prototype.objectiveProgress=function(){if(!r6Mode(this))return oldObjectiveProgress.call(this);const done=arenaMode(this)?this.boss?.hp===0:this.distance>=this.level.length,m={...this.metrics,combo:this.bestCombo,passed:this.passed,finish:done?1:0};const rows=this.level.objectives.map(o=>{const value=m[o.type]||0,met=['hits','jumps','misses'].includes(o.type)?value<=o.target:value>=o.target;return {...o,value,met}});if(this.boss)rows.push({type:'boss',target:this.boss.maxHp,text:'보스 체력 모두 소진',value:this.metrics.bossDamage,met:this.boss.hp===0});return rows};
Game.prototype.bossCue=function(){if(!r6Mode(this))return oldBossCue.call(this);if(arenaMode(this)){const pose=this.bossPose(),texts={'throw-arena':pose.y>294?'지금 투척 높이! 네모를 던져':'내려올 때를 보고 네모 투척','dodge-arena':pose.attack==='telegraph'?'붉은 칸에서 옆 칸으로 피해':'돌진! 비운 칸 끝에서 벽 충돌','kick-arena':this.jump>0?'가까이 떠올랐을 때 다시 눌러':'한 번 눌러 떠올라 발차기 준비'};return {text:texts[this.gameMode],type:this.gameMode,distance:0,phase:this.boss.phase,strike:this.gameMode==='kick-arena'&&this.jump>0}}const h=this.hazards.find(h=>!h.done&&h.d+h.width/2>=this.distance),transform=this.worldTransform();if(transform&&['warning','rising','settling'].includes(transform.phase)&&(!h||h.d-this.distance>this.speed*1.15))return {text:transform.text,type:'world-transform',distance:0,phase:transform.phase,strike:false};if(!h||h.d-this.distance>240)return null;return {text:h.type==='gap'?'빈 발판 앞에서 점프':h.type==='beam'?'천장 아래에서는 누르지 마':h.type==='piston'?'솟는 네모를 뛰어넘어':this.gameMode==='four-room'?'한 번 눌러 네 방 모두 점프':'물결의 벽 앞에서 점프',type:h.type,distance:h.d-this.distance,phase:1,strike:false,room:h.room||0}};
Game.prototype.finish=function(state,reason=''){oldFinish.call(this,state,reason);if(r6Mode(this)){if(arenaMode(this)){this.score=this.metrics.bossDamage*100+this.metrics.deflects*15+Math.floor(this.time*2);this.best=Math.max(this.best,this.score);this.result.score=this.score}this.result.contentVersion=6;this.result.gameMode=this.gameMode;this.result.roomPasses=this.roomPasses.slice();this.result.encounters=this.hazards.length;this.result.bossDefeated=!this.boss||this.boss.hp===0}};

// Independent four-edge route adapter. Uses the same rail for render and collision.
// Deliberately isolated from numeric R5/R6 campaign progression and legacy tutorial.
const isOrigin=g=>['origin-route','arcade'].includes(g.mode)&&g.gameMode==='origin-four-edge';
const originPrior={railAt:Game.prototype.railAt,actorPoses:Game.prototype.actorPoses,hazardPose:Game.prototype.hazardPose,geometry:Game.prototype.geometry,action:Game.prototype.action,height:Game.prototype.height,campaignStep:Game.prototype.campaignStep,bossCue:Game.prototype.bossCue,finish:Game.prototype.finish};
Game.prototype.startOriginRoute=function(chapterIndex=0){
 if(!Number.isInteger(chapterIndex)||chapterIndex<0||chapterIndex>3)return false;
 const route=Content.originRoute,index=chapterIndex;
 this.reset();this.mode='origin-route';this.gameMode='origin-four-edge';this.level={...route,chapter:index+1,isBoss:false,contentVersion:'origin-1'};this.levelId=route.id;
 this.originTravelResult=null;this.routeSummary=null;this.originStartChapter=index;this.distance=route.chapters[index].start;this.originChapter=index;this.originMorphCount=index*2;this.speed=route.speed;
 this.hazards=route.hazards.map(h=>({...h,done:h.d<this.distance,hit:false,centerHeight:null}));this.metrics={...this.metrics,edges:0,morphs:0,chapters:0,barrierPassed:0,ceilingPassed:0,barrierHits:0,ceilingHits:0};this.events.push('start','origin-start');return true;
};
Game.prototype.startOriginFinale=function(travelStats=null){
 // A fresh boss checkpoint does not fabricate a completed traversal snapshot.
 this.reset();this.mode='origin-finale';this.gameMode='throw-arena';this.level=Content.originFinale;this.levelId=this.level.id;this.modeParams=this.level.modeParams;this.speed=this.level.speed;this.hearts=this.level.heartLimit;this.hazards=[];
 this.boss={hp:this.level.bossHp,maxHp:this.level.bossHp,phase:1,attack:'throw-arena',flash:0,rule:'throw-arena'};
 this.projectiles=[];this.gapRecovery=0;this.transformPhase='steady';this.roomPasses=[0,0,0,0];this.metrics={...this.metrics,rooms:0,shots:0,misses:0,deflects:0,dodges:0,kicks:0};
 this.arena={cooldown:0,lane:1,x:180,fromX:180,toX:180,move:0,cycle:-1,lockedLane:1,resolved:false,kick:0,kickedCycle:-1,attackEmitted:-1,shotLimit:this.boss.maxHp*3+4};this.boss.pose=this.bossPose();
 this.originTravelResult=travelStats;this.routeSummary=travelStats;this.events.push('start','origin-finale');return true;
};
Game.prototype.startOrigin=function(index=0){return this.startOriginRoute(index)};
Game.prototype.originStatus=function(){
 if(!isOrigin(this))return null;
 const d=this.distance,lap=Math.min(7,Math.floor(d/LENGTH)),local=d-lap*LENGTH,chapter=Math.min(3,Math.floor(d/(2*LENGTH))),transition=clamp((local-(LENGTH-160))/160,0,1);
 return {routeId:this.levelId,provenance:Content.originRoute.provenance,chapter:chapter+1,chapterIndex:chapter,chapterName:Content.originRoute.chapters[chapter].name,phase:local>=LENGTH-160?'morphing':local>=LENGTH-240?'warning':'steady',morphCount:Math.min(8,Math.floor(d/LENGTH)),survivedMorphs:this.metrics.morphs,edge:['bottom','right','top','left'][Math.floor(d/SIDE)%4],progress:d/Content.originRoute.length,chapterProgress:clamp((d-chapter*LENGTH*2)/(LENGTH*2),0,1),transition,lap:lap+1};
};
Game.prototype.originTransform=function(){const o=this.originStatus();if(!o)return null;const transforms=Content.originRoute.transforms,lap=o.lap-1,from=lap?transforms[lap-1]:{sx:1,sy:1,skew:0},to=transforms[lap],t=o.transition*o.transition*(3-2*o.transition);return {sx:from.sx+(to.sx-from.sx)*t,sy:from.sy+(to.sy-from.sy)*t,skew:from.skew+(to.skew-from.skew)*t}};
Game.prototype.railAt=function(d,room=0){if(!isOrigin(this))return originPrior.railAt.call(this,d,room);const q=rail(d),m=this.originTransform(),dx=q.x-180,dy=q.y-244,tx=Math.cos(q.angle)*m.sx+Math.sin(q.angle)*m.skew,ty=Math.sin(q.angle)*m.sy,norm=Math.hypot(tx,ty),angle=Math.atan2(ty,tx);return {...q,x:180+dx*m.sx+dy*m.skew,y:244+dy*m.sy,angle,nx:ty/norm,ny:-tx/norm,tangent:{x:tx/norm,y:ty/norm},room:0}};
Game.prototype.height=function(){return isOrigin(this)?originPrior.height.call(this)*.64:originPrior.height.call(this)};
Game.prototype.actorPoses=function(reduced=false){if(!isOrigin(this))return originPrior.actorPoses.call(this,reduced);const q=this.railAt(this.distance),height=this.height(),phase=this.distance*.14,bob=height>1?0:Math.abs(reduced?.6:Math.cos(phase))*.8,headDistance=height+(36+bob)*.55;return [{...q,height,phase,scale:.55,facing:1,room:0,head:{x:q.x+q.tangent.x*2.2+q.nx*headDistance,y:q.y+q.tangent.y*2.2+q.ny*headDistance},edge:this.originStatus().edge}]};
Game.prototype.hazardPose=function(h){if(!isOrigin(this))return originPrior.hazardPose.call(this,h);const q=this.railAt(h.d),left=this.railAt(h.d-h.width/2),right=this.railAt(h.d+h.width/2),floor=h.type==='ceiling'?h.floor:0,top=floor+h.clearance,polygon=[{x:left.x+left.nx*floor,y:left.y+left.ny*floor},{x:right.x+right.nx*floor,y:right.y+right.ny*floor},{x:right.x+right.nx*top,y:right.y+right.ny*top},{x:left.x+left.nx*top,y:left.y+left.ny*top}];return {...q,width:Math.hypot(left.x-right.x,left.y-right.y),height:h.clearance,floor,clearance:h.clearance,type:h.type,room:0,polygon,visible:!h.done&&h.d-this.distance>=-h.width&&h.d-this.distance<=Content.originRoute.revealDistance,warningSeconds:(h.d-this.distance)/this.speed}};
// Conservative source-scaled human occupancy, not an invisible tall beam proxy.
// Head/neck and torso/limb bounds include the classic renderer's outline. The
// grounded maximum is (40.8 + .8)*.55 =22.88, below the slab's28px floor.
Game.prototype.originOccupancy=function(d,height){const q=this.railAt(d),bob=height>1?0:Math.abs(Math.cos(d*.14))*.8,boxes=[[.5,6.9,33.2,40.8],[-3.2,4.1,17,34.6],[-18,18,-3,31]];return boxes.map(([l,r,b,t])=>[[l,b],[r,b],[r,t],[l,t]].map(([x,y])=>({x:q.x+q.tangent.x*x*.55+q.nx*(height+(y+bob)*.55),y:q.y+q.tangent.y*x*.55+q.ny*(height+(y+bob)*.55)})))};
function originPolygonsOverlap(a,b){for(const p of[a,b])for(let i=0;i<p.length;i++){const x=p[(i+1)%p.length].y-p[i].y,y=p[i].x-p[(i+1)%p.length].x,aa=a.map(v=>v.x*x+v.y*y),bb=b.map(v=>v.x*x+v.y*y);if(Math.max(...aa)<Math.min(...bb)-1e-7||Math.max(...bb)<Math.min(...aa)-1e-7)return false}return true}
Game.prototype.originCeilingCollision=function(h,old,next,before,dt){const polygon=this.hazardPose(h).polygon,heightAt=d=>{const r=Math.max(0,before-clamp((d-old)/this.speed,0,dt));return r?Math.sin((1-r/JUMP_SECONDS)*Math.PI)*32:0},peak=old+(before-JUMP_SECONDS/2)*this.speed,points=[old,next];if(peak>old&&peak<next)points.push(peak);for(let d=old+.25;d<next;d+=.25)points.push(d);return points.some(d=>this.originOccupancy(d,heightAt(d)).some(body=>originPolygonsOverlap(body,polygon)))};
Game.prototype.geometry=function(){if(!isOrigin(this))return originPrior.geometry.call(this);const points=[];for(let d=0;d<=LENGTH;d+=4)points.push(this.railAt(d));return {kind:'origin-four-edge',paths:[{room:0,points,closed:true}],platforms:[],rooms:[],boss:null,projectiles:[],telegraph:null,gaps:[],transform:this.originTransform(),origin:this.originStatus(),cells:Content.originRoute.chapters.map((c,i)=>({...c,active:i===this.originStatus().chapterIndex,completed:this.distance>=c.end}))}};
Game.prototype.action=function(){if(this.mode==='origin-finale'&&['title','fail','clear'].includes(this.state))return this.startOriginFinale(this.originTravelResult);if(isOrigin(this)&&['title','fail','clear'].includes(this.state))return this.startOriginRoute(this.originStartChapter);if(isOrigin(this)&&this.state==='play'&&this.jump>0){if(this.jump>.080+1e-12||this.originJumpBuffer!==null)return false;this.originJumpBuffer=this.time+.080;return true}return originPrior.action.call(this)};
// Only a fresh origin-route tap can occupy this one-shot landing slot.
Game.prototype.cancelOriginJump=function(){this.originJumpBuffer=null};
// Presentation evidence only: captured once from the actual resolved collision.
// Frozen world coordinates deliberately do not follow the next hazard or morph.
Game.prototype.captureOriginHit=function(h){
 const q=this.hazardPose(h),polygon=Object.freeze(q.polygon.map(v=>Object.freeze({x:v.x,y:v.y})));
 this.originLastHit=this.originHitFeedback=Object.freeze({id:h.id,type:h.type,time:this.time,distance:this.distance,hazardDistance:h.d,chapter:this.originChapter,polygon});
};
Game.prototype.originStep=function(dt){
 const old=this.distance,before=this.jump;this.time+=dt;this.hitFlash=Math.max(0,this.hitFlash-dt);this.invincible=Math.max(0,this.invincible-dt);this.jump=Math.max(0,this.jump-dt);this.distance=Math.min(this.level.length,old+this.speed*dt);
 const heightAt=d=>{const r=Math.max(0,before-clamp((d-old)/this.speed,0,dt));return r?Math.sin((1-r/JUMP_SECONDS)*Math.PI)*32:0};
 for(const h of this.hazards){if(h.done)continue;const ceiling=h.type==='ceiling',left=h.d-h.width/2,right=h.d+h.width/2,reach=ceiling?12:0;if(old<=h.d&&this.distance>=h.d)h.centerHeight=heightAt(h.d);const overlap=this.distance>=left-reach&&old<=right+reach,collision=overlap&&(ceiling?this.originCeilingCollision(h,old,this.distance,before,dt):Math.min(heightAt(Math.max(old,left)),heightAt(Math.min(this.distance,right)))<h.clearance-1e-7);if(collision){this.captureOriginHit(h);h.done=true;h.hit=true;this.originJumpBuffer=null;this.hearts--;this.metrics.hits++;this.metrics[ceiling?'ceilingHits':'barrierHits']++;this.combo=0;this.hitFlash=.24;this.events.push('hit');if(this.hearts<=0){this.finish('fail','세 번 부딪혔습니다. 시작한 체크포인트에서 다시 도전하세요.');return}}if(!h.done&&this.distance>right+reach){h.done=true;this.passed++;this.metrics[ceiling?'ceilingPassed':'barrierPassed']++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);if(!ceiling&&h.centerHeight>=29)this.metrics.perfect++;this.events.push('pass')}}
 const edgeCount=Math.floor(this.distance/SIDE)-Math.floor(old/SIDE);if(edgeCount){this.metrics.edges+=edgeCount;this.events.push('origin-edge')}
 const morph=Math.min(8,Math.floor(this.distance/LENGTH));if(morph!==this.originMorphCount){this.metrics.morphs+=morph-this.originMorphCount;this.originMorphCount=morph;this.events.push('origin-morph')}
 const chapter=Math.min(3,Math.floor(this.distance/(LENGTH*2)));if(chapter!==this.originChapter){this.originLastHit=null;this.originHitFeedback=null;this.originJumpBuffer=null;this.metrics.chapters+=chapter-this.originChapter;this.originChapter=chapter;this.events.push('origin-chapter')}
 this.score=Math.floor(this.distance/24)+this.passed*5+this.metrics.perfect*3;
 if(this.distance>=this.level.length){
  this.metrics.chapters++;
  const summary=Object.freeze({routeRule:Content.originRoute.routeRule,encounters:this.hazards.filter(h=>h.done&&h.d>=Content.originRoute.chapters[this.originStartChapter].start).length,barriers:this.hazards.filter(h=>h.type==='barrier'&&h.d>=Content.originRoute.chapters[this.originStartChapter].start).length,ceilings:this.hazards.filter(h=>h.type==='ceiling'&&h.d>=Content.originRoute.chapters[this.originStartChapter].start).length,barrierPassed:this.metrics.barrierPassed,ceilingPassed:this.metrics.ceilingPassed,barrierHits:this.metrics.barrierHits,ceilingHits:this.metrics.ceilingHits,kind:'origin-route-complete',routeId:this.levelId,startChapter:this.originStartChapter,chapters:this.metrics.chapters,edges:this.metrics.edges,morphs:this.metrics.morphs,passed:this.passed,hits:this.metrics.hits,jumps:this.metrics.jumps,perfect:this.metrics.perfect,time:this.time,distance:this.distance,score:this.score,provenance:Content.originRoute.provenance});
  const events=this.events.slice();this.startOriginFinale(summary);this.events=[...events,'origin-route-complete',...this.events];
  return;
 }
 // Resolve the old jump's collisions first: buffering cannot erase a hit.
 if(this.originJumpBuffer!==null){if(this.jump<=0&&this.time<=this.originJumpBuffer+dt+1e-12){this.originJumpBuffer=null;originPrior.action.call(this)}else if(this.time>this.originJumpBuffer+1e-12)this.originJumpBuffer=null}
};
Game.prototype.campaignStep=function(dt){return isOrigin(this)?this.originStep(dt):originPrior.campaignStep.call(this,dt)};
Game.prototype.bossCue=function(){if(!isOrigin(this))return originPrior.bossCue.call(this);const h=this.hazards.find(h=>!h.done);return h&&h.d-this.distance<210?{text:h.type==='ceiling'?'여긴 그냥 지나가자.':'안쪽으로 점프',type:h.type,distance:h.d-this.distance,phase:this.originStatus().phase,strike:false}:null};
Game.prototype.finish=function(state,reason=''){originPrior.finish.call(this,state,reason);if(this.mode==='origin-finale')Object.assign(this.result,{kind:'origin-finale',contentVersion:'origin-finale-1',mode:'origin-finale',levelId:Content.originFinale.id,routeStats:this.originTravelResult,routeSummary:this.routeSummary,journeyCompleted:state==='clear'&&this.boss.hp===0&&this.result.objectivesMet,provenance:Content.originRoute.provenance});if(isOrigin(this))Object.assign(this.result,{contentVersion:'origin-1',gameMode:this.gameMode,originStartChapter:this.originStartChapter,originChapter:this.originChapter,morphCount:this.metrics.morphs,totalMorphPhase:this.originMorphCount,routeId:this.levelId,provenance:Content.originRoute.provenance})};

// R32 finite seeded score attack. Completed acts protect points; time earns none.
const ARCADE_ACT=2160,ARCADE_NAMES=['호흡 찾기','엇박 읽기','끝까지 집중'];
const arcadePrior={action:Game.prototype.action,campaignStep:Game.prototype.campaignStep,originStatus:Game.prototype.originStatus,originTransform:Game.prototype.originTransform,finish:Game.prototype.finish,bossCue:Game.prototype.bossCue};
Game.prototype.startArcade=function(options={}){
 options=options&&typeof options==='object'?options:{};
 const seed=Number.isSafeInteger(options.seed)?((options.seed>>>0)%1000000):1,risk=options.risk==='brave'?'brave':'standard';
 this.reset();this.mode='arcade';this.gameMode='origin-four-edge';this.levelId='arcade-r32';this.speed=120;
 this.level={id:this.levelId,length:ARCADE_ACT*3,speed:120,chapter:1,objectives:[],contentVersion:'arcade-1'};this.hearts=risk==='brave'?1:3;
 this.arcade={seed,risk,act:0,actsCleared:0,bankedScore:0,pendingScore:0,chain:0,bestChain:0,banked:false,lostScore:0};
 this.originChapter=0;this.originStartChapter=0;this.originMorphCount=0;this.metrics={...this.metrics,barrierPassed:0,ceilingPassed:0,barrierHits:0,ceilingHits:0};
 let rng=seed+1;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296};this.hazards=[];
 for(let act=0;act<3;act++){const count=7+act*2,spacing=(ARCADE_ACT-420)/(count-1);let ceilings=0;for(let i=0;i<count;i++){const type=i===0||ceilings>=act+2?'barrier':random()<(act===0?.18:act===1?.32:.42)?'ceiling':'barrier';if(type==='ceiling')ceilings++;const d=act*ARCADE_ACT+240+i*spacing+(random()-.5)*(act?36:20);this.hazards.push({id:'arcade-'+act+'-'+i,d,width:type==='ceiling'?40:18,clearance:12,type,...(type==='ceiling'?{floor:28}:{}),act,done:false,hit:false,centerHeight:null});}}
 this.events.push('start','arcade-start');return true;
};
Game.prototype.arcadeStatus=function(){if(this.mode!=='arcade')return null;const a=this.arcade,h=this.hazards.find(h=>!h.done&&h.act===a.act);return {seed:a.seed,risk:a.risk,act:a.act+1,actName:ARCADE_NAMES[a.act],progress:this.distance/this.level.length,actProgress:clamp((this.distance-a.act*ARCADE_ACT)/ARCADE_ACT,0,1),combo:a.chain,multiplier:1+a.act+(a.risk==='brave'?1:0)+Math.min(2,Math.floor(a.chain/3)),score:a.bankedScore+a.pendingScore,bankedScore:a.bankedScore,pendingScore:a.pendingScore,perfect:this.metrics.perfect,cleared:this.passed,total:this.hazards.length,decision:this.state==='arcade-choice',nextCue:h?(h.type==='ceiling'?'낮은 천장 · 뛰지 말고 통과':'장벽 · 중앙에 맞춰 점프'):''}};
Game.prototype.chooseArcade=function(choice){if(this.mode!=='arcade'||this.state!=='arcade-choice'||!['bank','push'].includes(choice))return false;const a=this.arcade;if(choice==='bank'){a.banked=true;this.finish('clear','점수를 확정하고 돌아왔습니다.');return true}a.act++;this.state='play';this.originJumpBuffer=null;this.events.push('arcade-push');return true};
Game.prototype.originStatus=function(){if(this.mode!=='arcade')return arcadePrior.originStatus.call(this);const a=this.arcade,s=this.arcadeStatus();return {routeId:this.levelId,provenance:'independent-score-attack',chapter:a.act+1,chapterIndex:a.act,chapterName:s.actName,phase:'steady',morphCount:0,survivedMorphs:0,edge:['bottom','right','top','left'][Math.floor(this.distance/SIDE)%4],progress:s.progress,chapterProgress:s.actProgress,transition:0,lap:Math.floor(this.distance/LENGTH)+1}};
Game.prototype.originTransform=function(){return this.mode==='arcade'?{sx:1,sy:1,skew:0}:arcadePrior.originTransform.call(this)};
Game.prototype.action=function(){if(this.mode==='arcade'){if(['clear','fail','title'].includes(this.state))return this.startArcade(this.arcade);if(this.state!=='play')return false}return arcadePrior.action.call(this)};
Game.prototype.arcadeStep=function(dt){
 const a=this.arcade,old=this.distance,before=this.jump,boundary=(a.act+1)*ARCADE_ACT;dt=Math.min(dt,(boundary-old)/this.speed);this.time+=dt;this.hitFlash=Math.max(0,this.hitFlash-dt);this.jump=Math.max(0,this.jump-dt);this.distance=Math.min(boundary,old+this.speed*dt);
 const heightAt=d=>{const r=Math.max(0,before-clamp((d-old)/this.speed,0,dt));return r?Math.sin((1-r/JUMP_SECONDS)*Math.PI)*32:0};
 for(const h of this.hazards){if(h.done||h.act!==a.act)continue;const ceiling=h.type==='ceiling',left=h.d-h.width/2,right=h.d+h.width/2,reach=ceiling?12:0;if(old<=h.d&&this.distance>=h.d)h.centerHeight=heightAt(h.d);
 const contact=this.distance>=left-reach&&old<=right+reach,collision=contact&&(ceiling?this.originCeilingCollision(h,old,this.distance,before,dt):Math.min(heightAt(Math.max(old,left)),heightAt(Math.min(this.distance,right)))<h.clearance-1e-7);
 if(collision){this.captureOriginHit(h);h.done=true;h.hit=true;this.originJumpBuffer=null;this.hearts--;this.metrics.hits++;this.metrics[ceiling?'ceilingHits':'barrierHits']++;this.combo=0;a.chain=0;this.hitFlash=.24;this.events.push('hit','arcade-chain-break');if(this.hearts<=0){this.finish('fail',ceiling?'천장에서는 점프를 쉬세요. 이번 막 점수만 잃었습니다.':'장벽 중심이 점프 꼭대기에 오도록 조금 일찍 뛰세요. 이번 막 점수만 잃었습니다.');return}}
 if(!h.done&&this.distance>right+reach){h.done=true;this.passed++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.metrics[ceiling?'ceilingPassed':'barrierPassed']++;const perfect=!ceiling&&h.centerHeight>=30;if(perfect){this.metrics.perfect++;a.chain++;a.bestChain=Math.max(a.bestChain,a.chain);this.events.push('arcade-perfect')}else if(!ceiling)a.chain=0;h.arcadePoints=(10+(perfect?10:0))*this.arcadeStatus().multiplier;a.pendingScore+=h.arcadePoints;this.events.push('pass');}}
 this.score=a.bankedScore+a.pendingScore;
 if(this.distance>=boundary-1e-7){this.distance=boundary;a.bankedScore+=a.pendingScore;a.pendingScore=0;a.actsCleared++;this.jump=0;this.originJumpBuffer=null;this.events.push('arcade-checkpoint');if(a.act===2)this.finish('clear','세 막을 모두 완주했습니다.');else this.state='arcade-choice';return}
 if(this.originJumpBuffer!==null){if(this.jump<=0&&this.time<=this.originJumpBuffer+dt+1e-12){this.originJumpBuffer=null;originPrior.action.call(this)}else if(this.time>this.originJumpBuffer+1e-12)this.originJumpBuffer=null}
};
Game.prototype.campaignStep=function(dt){return this.mode==='arcade'?this.arcadeStep(dt):arcadePrior.campaignStep.call(this,dt)};
Game.prototype.bossCue=function(){if(this.mode!=='arcade')return arcadePrior.bossCue.call(this);const h=this.hazards.find(h=>!h.done&&h.act===this.arcade.act);return h&&h.d-this.distance<210?{text:this.arcadeStatus().nextCue,type:h.type,distance:h.d-this.distance,phase:this.arcade.act+1,strike:false}:null};
Game.prototype.finish=function(state,reason=''){
 if(this.mode!=='arcade')return arcadePrior.finish.call(this,state,reason);if(this.result&&this.result.kind==='arcade'&&['clear','fail'].includes(this.state))return;const a=this.arcade;if(state==='fail'){a.lostScore=a.pendingScore;a.pendingScore=0}this.originJumpBuffer=null;this.state=state;this.score=a.bankedScore;
 const grade=state==='fail'?'RETRY':a.actsCleared===3?(this.metrics.hits===0&&this.metrics.perfect>=12?'S':'A'):a.actsCleared===2?'B':'C';const outcome={seed:a.seed,risk:a.risk,grade,score:this.score,bankedScore:a.bankedScore,lostScore:a.lostScore,perfect:this.metrics.perfect,bestChain:a.bestChain,cleared:this.passed,total:this.hazards.length,actsCleared:a.actsCleared,banked:a.banked,nextGoal:state==='fail'?'같은 코스에서 충돌한 패턴을 다시 읽어 보세요.':a.actsCleared<3?'다음에는 한 막 더 도전해 보세요.':this.metrics.hits>0?'세 막 무충돌 완주에 도전해 보세요.':grade==='S'?'다른 코스에서도 S등급에 도전해 보세요.':'정점 통과 12회로 S등급에 도전해 보세요.'};
 this.result={kind:'arcade',levelId:this.levelId,mode:'arcade',state,score:this.score,objectivesMet:state==='clear',...this.metrics,passed:this.passed,bestCombo:this.bestCombo,time:this.time,reason,arcade:outcome};this.events.push(state);
};

// R34 journey is a separate namespace. Resetting a run never resets its journal.
const r34Prior={action:Game.prototype.action,campaignStep:Game.prototype.campaignStep,geometry:Game.prototype.geometry,railAt:Game.prototype.railAt,hazardPose:Game.prototype.hazardPose,actorPoses:Game.prototype.actorPoses,bossCue:Game.prototype.bossCue,objectiveProgress:Game.prototype.objectiveProgress,finish:Game.prototype.finish,pause:Game.prototype.pause,title:Game.prototype.title};
const freshR36Record=()=>({rank:0,clean:0,groundClean:0,echo:0});
const freshR34=()=>({schema:1,recordsVersion:1,selectedSkin:null,chapters:Array.from({length:10},()=>({situations:[false,false,false],bossDefeated:false,solved:false,attempts:0,hintsUsed:0,records:Array.from({length:3},freshR36Record)}))});
const r34Chapter=g=>Content.r34.chapters[g.r34Run.chapter-1];
Game.prototype.exportR34Journey=function(){return JSON.parse(JSON.stringify(this.r34Journey||(this.r34Journey=freshR34())))};
Game.prototype.importR34Journey=function(data){
 if(!data||data.schema!==1||!Array.isArray(data.chapters)||data.chapters.length!==10)return false;
 const valid=Array.from(data.chapters).every((c,i)=>c&&Array.isArray(c.situations)&&c.situations.length===3&&Array.from(c.situations).every(x=>typeof x==='boolean')&&typeof c.bossDefeated==='boolean'&&typeof c.solved==='boolean'&&Number.isSafeInteger(c.attempts)&&c.attempts>=0&&c.attempts<=1000000&&Number.isInteger(c.hintsUsed)&&c.hintsUsed>=0&&c.hintsUsed<=3&&(!c.solved||c.bossDefeated)&&(!c.bossDefeated||c.situations.every(Boolean))&&(!c.situations[1]||c.situations[0])&&(!c.situations[2]||c.situations[1])&&(i===0||data.chapters[i-1].solved||!c.situations.some(Boolean)&&!c.bossDefeated&&!c.solved&&c.attempts===0&&c.hintsUsed===0));
 const selected=data.selectedSkin===undefined?null:data.selectedSkin,skinIndex=Content.r34.chapters.findIndex(c=>c.collectible.id===selected);
 if(!valid||selected!==null&&(skinIndex<0||!data.chapters[skinIndex].solved))return false;
 const records=data.chapters.map(c=>c.records===undefined?Array.from({length:3},freshR36Record):c.records);
 if(data.recordsVersion!==undefined&&data.recordsVersion!==1||!Array.from(records).every((row,i)=>Array.isArray(row)&&row.length===3&&Array.from(row).every((v,j)=>{const m=Content.r34.chapters[i].situations[j].mastery;return v&&['rank','clean','groundClean','echo'].every(k=>Number.isInteger(v[k])&&v[k]>=0)&&v.rank<=2&&v.clean<=m.total&&v.groundClean<=m.groundTotal&&v.echo<=(i===0&&j===0?1:0)&&(!v.rank||data.chapters[i].situations[j]&&v.clean>=m.target)&&(v.rank!==2||v.clean===m.total&&v.groundClean===m.groundTotal)&&(!v.echo||v.rank>0)&&(v.rank!==0||v.clean===0&&v.groundClean===0&&v.echo===0)})))return false;
 const previous=this.exportR34Journey();this.r34Journey={schema:1,recordsVersion:1,selectedSkin:previous.selectedSkin||selected,chapters:data.chapters.map((c,i)=>({situations:c.situations.map((v,j)=>v||previous.chapters[i].situations[j]),bossDefeated:c.bossDefeated||previous.chapters[i].bossDefeated,solved:c.solved||previous.chapters[i].solved,attempts:Math.max(c.attempts,previous.chapters[i].attempts),hintsUsed:Math.max(c.hintsUsed,previous.chapters[i].hintsUsed),records:records[i].map((v,j)=>Object.fromEntries(['rank','clean','groundClean','echo'].map(k=>[k,Math.max(v[k],previous.chapters[i].records?.[j]?.[k]||0)])))}))};return true;
};
Game.prototype.selectR34Skin=function(id=null){const c=Content.r34.chapters.find(c=>c.collectible.id===id);this.exportR34Journey();if(id!==null&&(!c||!this.r34Journey.chapters[c.id-1].solved))return false;this.r34Journey.selectedSkin=id;this.events.push('r34-skin');return true};
Game.prototype.r34JourneyStatus=function(){const j=this.exportR34Journey(),unlocked=Math.min(10,1+j.chapters.filter(c=>c.solved).length);return {schema:1,selectedSkin:j.selectedSkin,unlockedChapter:unlocked,chapters:j.chapters.map((s,i)=>({id:i+1,name:Content.r34.chapters[i].name,unlocked:i===0||j.chapters[i-1].solved,...s,collectible:s.solved?Content.r34.chapters[i].collectible:null})),completed:j.chapters[9].solved,ending:j.chapters[9].solved?Content.r34.chapters[9].story.ending:''}};
Game.prototype.startR34Chapter=function(chapter=1,options={}){
 if(!Number.isInteger(chapter)||chapter<1||chapter>10||!options||typeof options!=='object')return false;
 const journey=this.r34JourneyStatus(),entry=journey.chapters[chapter-1],c=Content.r34.chapters[chapter-1];if(!entry.unlocked)return false;
 const missing=entry.situations.findIndex(v=>!v),isBoss=options.boss===true||options.situation===undefined&&missing===-1,situation=options.situation===undefined?Math.max(0,missing):options.situation;
 if(!Number.isInteger(situation)||situation<0||situation>2||isBoss&&!entry.situations.every(Boolean)||!isBoss&&situation>0&&!entry.situations[situation-1])return false;
 this.reset();this.projectiles=[];this.mode='r34';this.gameMode=isBoss?'r34-boss':'r34-route';this.r34Run={chapter,situation,isBoss,difficulty:options.difficulty==='challenge'?'challenge':'regular',inputBuffer:null,lastLaunchTime:null,hitFeedback:null,rejectedInputs:[],launchClock:null,hintsUsed:entry.hintsUsed,feedback:'',reason:'',phase:0,clock:0,matched:[],lane:1,lockedLane:1,retryDelay:0,phaseAttempts:0,inputs:0,phaseElapsed:0,quietCharge:0,emitted:false,budgetShot:null};
 const s=c.situations[situation];this.level={id:isBoss?c.boss.id:s.id,name:isBoss?c.boss.name:s.name,chapter,contentVersion:'r34-1',length:isBoss?1:s.length,speed:120,isBoss,palette:palettesForR34(chapter),objectives:[]};this.levelId=this.level.id;r36Initialize(this,s);this.speed=120;this.hearts=this.r34Run.difficulty==='challenge'?(isBoss?c.boss.heartLimit:s.heartLimit):3;this.r34Run.heartLimit=this.hearts;
 this.r34Journey.chapters[chapter-1].attempts=Math.min(1000000,entry.attempts+1);
 this.hazards=isBoss?[]:s.events.filter(e=>e.type!=='speed').flatMap(e=>e.type==='pair'?[{...e,type:'barrier',pair:e.id},{...e,id:e.id+'b',type:'barrier',d:e.d+22,time:e.time+22/120,pair:e.id}]:[{...e}]).map(h=>({...h,clearance:h.type==='precision'&&this.r34Run.difficulty==='regular'?38:h.clearance,done:false,hit:false,centerHeight:null}));
 if(isBoss)this.boss={hp:3,maxHp:3,phase:1,flash:0,rule:c.boss.mechanic};
 if(isBoss&&options.resumeRiddle===true&&entry.bossDefeated&&!entry.solved){this.boss.hp=0;this.state='riddle';this.events.push('r34-clue-resumed')}
 this.events.push('start','r34-start');return true;
};
function palettesForR34(chapter){return Content.levels[(chapter-1)*10].palette}
Game.prototype.retryR34=function(){if(this.mode!=='r34'||!this.r34Run)return false;const {chapter,situation,isBoss,difficulty}=this.r34Run;return this.startR34Chapter(chapter,{situation,boss:isBoss,difficulty})};
Game.prototype.advanceR34=function(){if(this.mode!=='r34'||!this.r34Run)return false;const r=this.r34Run;if(this.state==='riddle'){if(!this.r34Journey.chapters[r.chapter-1].solved||r.chapter===10)return false;return this.startR34Chapter(r.chapter+1,{difficulty:r.difficulty})}if(this.state!=='clear')return false;return r.situation<2?this.startR34Chapter(r.chapter,{situation:r.situation+1,difficulty:r.difficulty}):this.startR34Chapter(r.chapter,{boss:true,difficulty:r.difficulty})};
Game.prototype.r34Hint=function(){if(this.mode!=='r34'||this.state!=='riddle')return null;const entry=this.r34Journey.chapters[this.r34Run.chapter-1],c=r34Chapter(this);entry.hintsUsed=Math.min(3,entry.hintsUsed+1);this.events.push('r34-hint');return c.riddle.hints[entry.hintsUsed-1]};
Game.prototype.answerR34=function(answer){
 if(this.mode!=='r34'||this.state!=='riddle')return {accepted:false,correct:false,feedback:'먼저 보스를 넘어 단서를 얻으세요.'};
 const r=this.r34Run,c=r34Chapter(this),entry=this.r34Journey.chapters[r.chapter-1];if(!entry.bossDefeated)return {accepted:false,correct:false,feedback:'단서가 아직 잠겨 있습니다.'};
 const correct=Content.checkAnswer(r.chapter,answer);if(!correct)entry.attempts=Math.min(1000000,entry.attempts+1);else entry.solved=true;r.feedback=correct?'문이 열렸습니다. '+c.collectible.name+' 획득.':c.riddle.wrong;this.events.push(correct?'r34-unlock':'r34-wrong-answer');return {accepted:true,correct,feedback:r.feedback,unlockedChapter:this.r34JourneyStatus().unlockedChapter};
};
// Presentation reads the same windows used by input and deadline checks.
const R35_ANTICIPATION=.9,R35_BUFFER=.14;
const r35Labels={jump:'점프',launch:'먼저 점프',apex:'공중에서 다시 누르기',move:'다음 칸으로',dodge:'잠긴 칸에서 피하기',tap:'누르기',quiet:'누르지 않고 기다리기',rest:'가짜 신호 · 기다리기'};
function r35StepAt(g,s){return s.kind==='apex'&&g.r34Run.launchClock!==null?g.r34Run.launchClock+JUMP_SECONDS/2:s.at}
function r35Window(g,s){const at=r35StepAt(g,s),tolerance=s.kind==='apex'&&g.r34Run.difficulty==='regular'?.095:s.tolerance;return {at,start:at-tolerance,end:at+tolerance}}
Game.prototype.r34NextAction=function(){
 const r=this.r34Run,p=r34Chapter(this).boss.phases[r.phase],s=p.steps.find(v=>!r.matched[v.index]);if(!s)return null;
 const w=r35Window(this,s),pending=r.budgetShot?.index===s.index||this.projectiles.some(v=>v.reflected&&v.index===s.index),expected=!pending&&!['rest','quiet'].includes(s.kind),open=r.clock>=w.start-1e-9&&r.clock<=w.end+1e-9;
 return {kind:s.kind,label:pending?'날아가는 빛 기다리기':r35Labels[s.kind],pending,stepIndex:s.index,inSeconds:Math.max(0,w.at-r.clock),secondsToAction:w.at-r.clock,opensIn:Math.max(0,w.start-r.clock),closesIn:Math.max(0,w.end-r.clock),windowOpen:open,expected,actionable:expected&&open&&(s.kind!=='apex'||this.height()>=45),anticipation:r.clock>=w.start-R35_ANTICIPATION&&r.clock<w.start,progress:clamp(1-(w.start-r.clock)/R35_ANTICIPATION,0,1)};
};
Game.prototype.r34Status=function(){
 if(this.mode!=='r34'||!this.r34Run)return null;const r=this.r34Run,c=r34Chapter(this),s=c.situations[r.situation],entry=this.r34Journey.chapters[r.chapter-1],p=c.boss.phases[r.phase],next=this.r34NextAction(),stage=r.retryDelay>0?'recover':!next||next.pending?'recover':next.windowOpen?(next.expected?'counter':'attack'):next.anticipation?'attack':'telegraph';
 const memorizing=c.boss.mechanic==='memory'||c.boss.mechanic==='weave'&&r.phase===2,hidden=memorizing&&r.clock>=1.5;
 const windows=p.steps.map((v,i)=>{const w=r35Window(this,v);return {start:w.start,end:w.end,label:hidden?'기억한 박자':v.kind,completed:hidden?false:!!r.matched[i]}});
 const cue=hidden?'기억한 순서대로 빛의 박자에 응답하세요.':p.cue;
 // Memory retains its learned order, while a neutral timing pulse remains available.
 const nextAction=hidden&&next?{...next,kind:'memory',label:'기억한 순서',expected:null,actionable:null}:next;
 const boss=r.isBoss?{phase:r.phase+1,phaseName:p.name,mechanic:c.boss.mechanic,cue,counter:hidden?cue:p.counter,stage:hidden&&stage==='attack'&&next?.windowOpen?'counter':stage,remaining:Math.max(0,p.duration-r.clock),clock:r.clock,objects:this.r34BossObjects(),windows,nextAction,completed:this.boss.hp===0,preview:p.preview&&r.clock<1.5?p.preview:null,lane:r.lane,lockedLane:r.lockedLane,quietCharge:r.quietCharge,ammo:c.boss.mechanic==='budget'?Math.max(0,1-r.inputs):null}:null;
 const riddle=this.state==='riddle'?{prompt:c.riddle.prompt,clue:c.story.clue,hint:entry.hintsUsed?c.riddle.hints[entry.hintsUsed-1]:'',hintsUsed:entry.hintsUsed,attempts:entry.attempts,feedback:r.feedback,solved:entry.solved}:null;
 const skin=Content.r34.chapters.find(c=>c.collectible.id===this.r34Journey.selectedSkin)?.collectible;
 return {mastery:r.isBoss?null:this.r36Mastery(),echo:r.isBoss?null:this.r36Echo(),chapter:r.chapter,chapterName:c.name,situation:r.situation,isBoss:r.isBoss,title:r.isBoss?c.boss.name:s.name,briefing:r.isBoss?cue:s.briefing,rule:c.rule,progress:r.isBoss?(3-this.boss.hp)/3:this.distance/this.level.length,hearts:this.hearts,heartLimit:r.heartLimit,difficulty:r.difficulty,state:this.state,canAdvance:this.state==='clear'||this.state==='riddle'&&entry.solved&&r.chapter<10,nextLabel:r.isBoss?'단서 읽기':r.situation<2?'다음 상황':'문지기 대면',reason:this.state!=='play'||r.retryDelay>0||r.hitFeedback&&this.time<r.hitFeedback.expiresAt?r.reason:'',hitFeedback:r.hitFeedback&&this.time<r.hitFeedback.expiresAt?r.hitFeedback:null,inputBuffered:!!r.inputBuffer,boss,riddle,story:c.story,collectible:entry.solved?c.collectible:null,skinColor:skin?.skinColor||null,jumpBudget:s.jumpBudget,jumpsRemaining:s.jumpBudget===null?null:Math.max(0,s.jumpBudget-this.metrics.jumps),nextHazard:this.r34NextHazard(),speedChange:s.events.filter(e=>e.type==='speed'&&e.time>this.time).map(e=>({speed:e.speed,inSeconds:e.time-this.time,cue:e.cue}))[0]||null,memory:r.isBoss?null:s.hidden&&this.time<1.3?s.events.filter(e=>e.type!=='speed').map(e=>e.type).join(' → '):null};
};
// R36: bounded route evidence is independent from hearts and optional echo choice.
function r36Initialize(g,s){const r=g.r34Run,eligible=!r.isBoss&&s.echo&&g.r34Journey.chapters[r.chapter-1].situations[r.situation];r.echo=eligible?{state:'waiting',launchTime:null}:null;r.routeRejected=[];if(eligible)g.level.length+=s.echo.extraDistance;}
Game.prototype.r36Mastery=function(){
 const r=this.r34Run,s=r34Chapter(this).situations[r.situation],groups=s.events.filter(e=>e.type!=='speed');let clean=0,groundClean=0;
 for(const e of groups){const hs=this.hazards.filter(h=>(h.pair||h.id)===e.id);if(hs.length&&hs.every(h=>h.done&&!h.hit)){if(['beam','silence'].includes(e.type))groundClean++;else clean++;}}
 const rank=clean>=s.mastery.target?(clean===s.mastery.total&&groundClean===s.mastery.groundTotal&&this.metrics.hits===0?2:1):0;
 return {...s.mastery,clean,groundClean,rank,best:{...(this.r34Journey.chapters[r.chapter-1].records?.[r.situation]||freshR36Record())}};
};
Game.prototype.r36Echo=function(){
 const r=this.r34Run,e=r.echo,s=r34Chapter(this).situations[r.situation].echo;if(!e||!s)return null;
 const committed=e.state==='committed',at=committed?e.launchTime+s.apexDelay:s.at,tolerance=committed?s.apexWindow:s.window,start=at-tolerance,end=at+tolerance;
 const state=e.state==='waiting'&&this.time>=s.at-s.window-s.anticipation?'offer':e.state;
 return {state,optional:true,missCost:s.missCost,opensIn:Math.max(0,start-this.time),closesIn:Math.max(0,end-this.time),actionIn:at-this.time,windowOpen:this.time>=start-1e-9&&this.time<=end+1e-9,expected:['offer','committed'].includes(state),anticipation:state==='offer'&&this.time<start,cue:committed?'정점에서 한 번 더 · 놓치면 하트 1':state==='collected'?'메아리 획득':state==='missed'?'메아리를 놓쳤습니다':state==='declined'?'안전하게 지나갔습니다':'선택 메아리 · 점프 후 정점에서 한 번 더 · 놓치면 하트 1'};
};
Game.prototype.r36RouteRejected=function(){
 const r=this.r34Run;r.routeRejected=r.routeRejected.filter(t=>this.time-t<1.25);r.routeRejected.push(this.time);
 if(r.routeRejected.length>=3){r.routeRejected=[];this.r34TakeHit('반복 입력을 멈추고 다음 표식을 읽어 주세요.',false,{type:'repeated-input'});}
};
// Pair centers use their actual 22-unit separation, including after speed changes.
Game.prototype.r34NextHazard=function(){
 if(this.gameMode!=='r34-route')return null;const h=this.hazards.find(h=>!h.done);if(!h)return null;
 const ground=['beam','silence'].includes(h.type),launchLead=h.pair?.25:JUMP_SECONDS/2;
 const distance=h.d-this.distance,inSeconds=Math.max(0,distance/this.speed),actionIn=ground?inSeconds:Math.max(0,inSeconds-launchLead);
 const half=h.width/(2*this.speed),clearance=h.type==='gap'?8:h.clearance;
 const rise=Math.asin(clamp(clearance/JUMP_HEIGHT,0,1))/Math.PI*JUMP_SECONDS;
 const pairTail=h.pair?22/this.speed:0;
 const start=ground?Math.max(0,(distance-h.width/2)/this.speed):(distance/this.speed+half+pairTail-(JUMP_SECONDS-rise));
 const end=ground?(distance+h.width/2)/this.speed:distance/this.speed-half-rise;
 const remembered=r34Chapter(this).situations[this.r34Run.situation].hidden&&this.time>=1.3&&actionIn>R35_ANTICIPATION;
 return {id:h.id,type:remembered?'memory':h.type,inSeconds,distance,cue:remembered?'기억한 표식이 곧 돌아옵니다':h.type==='beam'?'천장 아래 걷기':h.type==='silence'?'입력 없이 걷기':h.type==='precision'?'높은 표식 · 점프':h.type==='gap'?'빈 바닥 · 점프':'벽 앞에서 점프',actionIn,opensIn:Math.max(0,start),closesIn:Math.max(0,end),actionWindow:{start,end},windowOpen:start<=1e-9&&end>=-1e-9,expected:!ground,anticipation:actionIn<=R35_ANTICIPATION,buffered:!!this.r34Run.inputBuffer};
};
Game.prototype.r34BossObjects=function(){const r=this.r34Run,c=r34Chapter(this),p=c.boss.phases[r.phase],next=p.steps.find((s,i)=>!r.matched[i]&&s.kind!=='rest'&&s.kind!=='quiet'),x=[90,180,270][r.lane],target=[90,180,270][r.lockedLane],t=r.clock,objects=[];
 switch(c.boss.mechanic){
 case 'chain':for(const s of p.steps.filter(s=>s.kind==='jump'))objects.push({stepIndex:s.index,type:'pulse',x:92+(s.at+.34-t)*120,y:350,width:18,height:23,label:'종의 파동',active:Math.abs(t-s.at-.34)<.5});break;
 case 'mirror':objects.push({type:'mirror',x:250,y:220,width:42,height:60,label:next&&Math.abs(t-next.at)<.22?'반사':'가짜 빛',active:!!next&&Math.abs(t-next.at)<.22});break;
 case 'twins':objects.push({type:'anchor',x:target,y:180+Math.min(1,t/3)*120,width:32,height:38,label:'조준한 닻',active:t>1.3});break;
 case 'apex':objects.push({type:'flower',x:180,y:260,width:48,height:20,label:'최고점에서 열림',active:this.height()>=45});break;
 case 'silence':objects.push({type:'quiet',x:80,y:320,width:200,height:28,label:'입력 금지',active:t>=.7&&t<=p.steps[0].at+.22});break;
 case 'gear':for(const s of p.steps)objects.push({stepIndex:s.index,type:'beat',x:70+s.index*65,y:260,width:28,height:28,label:String(s.index+1),active:Math.abs(t-s.at)<s.tolerance});break;
 case 'budget':objects.push({type:'slot',x:60+(t*38)%240,y:260,width:32,height:32,label:'남은 입력 '+Math.max(0,1-r.inputs),active:!!next&&Math.abs(t-next.at)<next.tolerance});break;
 case 'memory':objects.push({type:'memory',x:100,y:230,width:160,height:50,label:t<1.5?p.preview:'표식이 접혔다',active:t<1.5});break;
 case 'pulse':objects.push({type:'dive',x:target,y:120+Math.min(1,(t%1.5)/1.5)*210,width:44,height:46,label:'잠긴 조준 칸',active:!!next&&Math.abs(t-next.at)<.4});break;
 case 'weave':objects.push({type:['mirror','flower','memory'][r.phase],x:180,y:260,width:48,height:40,label:r.phase===2?(t<1.5?p.preview:'마지막 기억'):p.name,active:!!next&&Math.abs(t-next.at)<.22});break;
 }if(r.budgetShot)objects.push({...r.budgetShot,type:'shot',label:'사용한 한 번',active:true});
 const n=this.r34NextAction(),hidden=(c.boss.mechanic==='memory'||c.boss.mechanic==='weave'&&r.phase===2)&&t>=1.5;
 return objects.map(o=>{
  const step=Number.isInteger(o.stepIndex)?p.steps[o.stepIndex]:null,w=step?r35Window(this,step):null,done=step?!!r.matched[step.index]:!n,opensIn=w?Math.max(0,w.start-t):n?.opensIn??null,closesIn=w?Math.max(0,w.end-t):n?.closesIn??null,open=w?t>=w.start&&t<=w.end:!!n?.windowOpen,anticipation=w?t>=w.start-R35_ANTICIPATION&&t<w.start:!!n?.anticipation;
  return {...o,state:o.type==='shot'?'moving':done?'resolved':open?'open':anticipation?'anticipate':'idle',active:o.type==='shot'||!done&&open,progress:w?clamp(1-(w.start-t)/R35_ANTICIPATION,0,1):n?.progress||0,opensIn,closesIn,expected:hidden?null:step?!['rest','quiet'].includes(step.kind):n?.expected,stepIndex:step?.index??n?.stepIndex??null};
 });
};
Game.prototype.r34TakeHit=function(reason,boss=false,detail={}){
 if(this.state!=='play'||boss&&this.r34Run.retryDelay>0)return;const r=this.r34Run;this.hearts--;this.metrics.hits++;this.combo=0;this.hitFlash=.25;r.reason=reason;r.inputBuffer=null;r.hitFeedback={kind:'hit',reason,at:this.time,expiresAt:this.time+2,...detail};this.events.push('hit');
 if(this.hearts<=0){this.finish('fail',reason);return}if(boss){r.retryDelay=.8;this.jump=0;this.events.push('r34-phase-retry')}
};
Game.prototype.r34BossAction=function(){
 const r=this.r34Run,c=r34Chapter(this),p=c.boss.phases[r.phase];if(r.retryDelay>0||this.boss.hp===0)return false;
 if(c.boss.mechanic==='silence'&&r.clock>=.7&&r.clock<=p.steps[0].at+.22){r.quietCharge=0;r.clock=.7;r.matched=[];r.reason='침묵이 끊겨 다시 모으고 있습니다. 줄무늬 동안 손을 쉬세요.';this.events.push('r34-quiet-reset');return false}
 const candidates=p.steps.filter((s,i)=>!r.matched[i]&&!['quiet','rest'].includes(s.kind)&&r.clock>=r35Window(this,s).start-1e-9&&r.clock<=r35Window(this,s).end+1e-9),s=candidates.sort((a,b)=>Math.abs(r.clock-r35StepAt(this,a))-Math.abs(r.clock-r35StepAt(this,b)))[0];
 const fail=reason=>{this.r34TakeHit(reason,true);return false};
 if(c.boss.mechanic==='budget'){
  if(r.inputs>=1)return false;r.inputs=1;const target=p.steps.find(v=>v.kind==='tap');r.budgetShot={x:92,y:280,width:10,height:10,owner:'player',vx:210,correct:!!s,index:target.index};this.events.push('throw');return true;
 }
 if(!s){if(p.steps.some(v=>v.kind==='rest'&&Math.abs(r.clock-v.at)<=v.tolerance))return fail('가짜 신호에 눌렀습니다. 이 박자는 기다리세요.');
  r.rejectedInputs=r.rejectedInputs.filter(t=>r.clock-t<1.25);r.rejectedInputs.push(r.clock);r.reason='아직 입력 창이 아닙니다. 물체가 모일 때 한 번 눌러 주세요.';r.hitFeedback={kind:'early',reason:r.reason,at:this.time,expiresAt:this.time+1};
  if(r.rejectedInputs.length>=3)return fail('입력 창 밖에서 반복 입력했습니다. 예고가 모인 뒤 한 번 누르세요.');return false}
 r.inputs++;
 // Ten mechanics share a clock but have different physical input consequences.
 if(s.kind==='jump'){if(this.jump>0)return fail('아직 착지하지 않았습니다. 다음 파동까지 기다리세요.');this.jump=JUMP_SECONDS;this.metrics.jumps++;this.events.push('jump')}
 else if(s.kind==='launch'){if(this.jump>0)return fail('꽃 앞에서 착지한 뒤 다시 떠오르세요.');this.jump=JUMP_SECONDS;r.launchClock=r.clock;this.metrics.jumps++;this.events.push('jump')}
 else if(s.kind==='apex'){if(this.height()<45)return fail('최고점에 닿지 않았습니다. 먼저 떠오른 뒤 다시 눌러 주세요.');this.metrics.kicks=(this.metrics.kicks||0)+1;this.events.push('boss-strike')}
 else if(s.kind==='move'){r.lane=(r.lane+1)%3;this.events.push('dodge')}
 else if(s.kind==='dodge'){if(r.lockedLane!==r.lane)return fail('조준이 아직 잠기지 않았습니다. 칸이 잠긴 뒤 피하세요.');r.lane=(r.lane+1)%3;this.metrics.dodges=(this.metrics.dodges||0)+1;this.events.push('dodge','boss-wall-impact')}
 else if(c.boss.mechanic==='twins'){if(!p.steps.filter(x=>x.kind==='move').every(x=>r.matched[x.index]))return fail('먼저 닻이 조준한 칸을 비워 주세요.');this.metrics.shots=(this.metrics.shots||0)+1;this.events.push('throw')}
 else if(c.boss.mechanic==='mirror'||c.boss.mechanic==='weave'&&r.phase===0){const projectile=this.projectiles.find(v=>v.owner==='boss'&&Math.abs(v.x-180)<=28);if(!projectile)return false;projectile.owner='player';projectile.vx=180;projectile.reflected=true;this.metrics.deflects=(this.metrics.deflects||0)+1;this.events.push('deflect');this.metrics.strikes++;return true}
 else this.events.push('r34-counter');
 r.matched[s.index]=true;this.metrics.strikes++;return true;
};
Game.prototype.action=function(){
 if(this.mode!=='r34')return r34Prior.action.call(this);if(this.state==='fail')return this.retryR34();if(this.state!=='play')return false;if(this.gameMode==='r34-boss')return this.r34BossAction();
 const r=this.r34Run,s=r34Chapter(this).situations[r.situation],echo=this.r36Echo();
 if(echo?.state==='committed'&&echo.windowOpen&&this.height()>=45){r.echo.state='collected';this.events.push('r36-echo-collected');return true}
 if(echo?.state==='offer'&&echo.windowOpen&&this.jump<=0){r.echo.state='committed';r.echo.launchTime=this.time;r.lastLaunchTime=this.time;r.inputBuffer=null;this.jump=JUMP_SECONDS;this.metrics.jumps++;this.events.push('jump','r36-echo-commit');return true}
 if(this.jump>0){if(this.jump<=R35_BUFFER&&!r.inputBuffer){r.inputBuffer={expiresAt:this.time+R35_BUFFER};this.events.push('input-buffer');return true}this.r36RouteRejected();return false}
 const silence=this.hazards.find(h=>h.type==='silence'&&!h.done&&Math.abs(h.d-this.distance)<=h.width/2);if(silence){silence.hit=true;silence.done=true;this.r34TakeHit('침묵 띠 안에서 눌렀습니다. 빗금이 끝날 때까지 걸으세요.',false,{type:'silence'});return false}
 if(s.jumpBudget!==null&&this.metrics.jumps>=s.jumpBudget){r.reason='남은 점프가 없습니다. 걸어서 통과하거나 다음 벽에서 다시 도전하세요.';r.hitFeedback={kind:'budget-empty',reason:r.reason,at:this.time,expiresAt:this.time+1.5};return false}
 const next=this.r34NextHazard();if(!next?.expected||!next.windowOpen)this.r36RouteRejected();if(this.state!=='play')return false;
 r.lastLaunchTime=this.time;r.inputBuffer=null;this.jump=JUMP_SECONDS;this.metrics.jumps++;this.events.push('jump');return true;
};
// A pause deliberately drops a pending touch; simulation resumes without a surprise jump.
Game.prototype.pause=function(){const ok=r34Prior.pause.call(this);if(ok&&this.mode==='r34')this.r34Run.inputBuffer=null;return ok};
Game.prototype.title=function(){if(this.r34Run){this.r34Run.inputBuffer=null;this.r34Run.echo=null;}return r34Prior.title.call(this)};
Game.prototype.r34RouteMiss=function(h){
 const r=this.r34Run,centerAt=this.time+(h.d-this.distance)/this.speed,lead=h.pair?.25:JUMP_SECONDS/2,offset=r.lastLaunchTime===null?null:r.lastLaunchTime-(centerAt-lead),timing=h.type==='beam'?'jumped':offset===null?'missed':offset<-.025?'early':offset>.025?'late':'clearance';
 const reason=h.type==='beam'?'천장 아래에서는 걷기입니다. 점프하지 말고 통과하세요.':timing==='early'?'점프가 일렀습니다. 표식이 더 가까워진 뒤 뛰어 주세요.':timing==='late'?'점프가 늦었습니다. 표식에 닿기 전에 뛰어 주세요.':h.type==='precision'?'높은 표식에 닿았습니다. 점프 정점이 표식 중앙에 오도록 맞추세요.':h.type==='gap'?'빈 바닥에 닿았습니다. 틈 앞에서 점프하세요.':'벽에 닿았습니다. 벽 앞에서 점프하세요.';
 return {reason,type:h.type,hazardId:h.id,launchTime:r.lastLaunchTime,timing,offsetSeconds:offset};
};
Game.prototype.r34RouteStep=function(dt){
 const r=this.r34Run,s=r34Chapter(this).situations[r.situation];
 const boundary=s.events.find(e=>e.type==='speed'&&e.time>this.time+1e-10&&e.time<this.time+dt-1e-10);
 if(boundary){const first=boundary.time-this.time;this.r34RouteStep(first);if(this.state==='play')this.r34RouteStep(dt-first);return}
 if(r.inputBuffer&&r.inputBuffer.expiresAt<this.time-1e-9)r.inputBuffer=null;
 if(r.inputBuffer&&this.jump>0&&this.jump<dt-1e-10){const first=this.jump;this.r34RouteStep(first);if(this.state==='play')this.r34RouteStep(dt-first);return}
 if(r.inputBuffer&&this.jump<=1e-10){r.inputBuffer=null;this.action();if(this.state!=='play')return}
 const old=this.distance,before=this.jump,oldTime=this.time;this.time+=dt;this.hitFlash=Math.max(0,this.hitFlash-dt);this.jump=Math.max(0,this.jump-dt);
 for(const e of s.events)if(e.type==='speed'&&e.time<=oldTime+1e-10)this.speed=e.speed;
 this.distance=Math.min(this.level.length,old+this.speed*dt);const heightAt=d=>{const remaining=Math.max(0,before-clamp((d-old)/this.speed,0,dt));return remaining?Math.sin((1-remaining/JUMP_SECONDS)*Math.PI)*JUMP_HEIGHT:0};
 for(const h of this.hazards){if(h.done)continue;const left=h.d-h.width/2,right=h.d+h.width/2;if(old<=h.d&&this.distance>=h.d)h.centerHeight=heightAt(h.d);
  if(h.type!=='silence'&&this.distance>=left&&old<=right){const lo=Math.max(old,left),hi=Math.min(this.distance,right),a=heightAt(lo),b=heightAt(hi),peak=old+(before-JUMP_SECONDS/2)*this.speed,maximum=peak>=lo&&peak<=hi?JUMP_HEIGHT:Math.max(a,b);const collision=h.type==='beam'?maximum>h.ceiling+1e-7:Math.min(a,b)<(h.type==='gap'?8:h.clearance)-1e-7;if(collision){h.done=true;h.hit=true;if(h.pair)for(const mate of this.hazards)if(mate.pair===h.pair){mate.done=true;mate.hit=true}const miss=this.r34RouteMiss(h);this.r34TakeHit(miss.reason,false,miss);if(this.state!=='play')return}}
  if(!h.done&&this.distance>right){h.done=true;this.passed++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);if(['beam','silence'].includes(h.type))this.metrics.ground++;else if(h.centerHeight>=42)this.metrics.perfect++;this.events.push('pass')}
 }
 if(r.echo){const e=s.echo;if(r.echo.state==='waiting'&&this.time>e.at+e.window)r.echo.state='declined';if(r.echo.state==='committed'&&this.time>r.echo.launchTime+e.apexDelay+e.apexWindow+1e-9){r.echo.state='missed';this.events.push('r36-echo-missed');this.r34TakeHit('선택한 메아리의 정점을 놓쳤습니다. 하트 1을 잃었습니다.',false,{type:'echo'});if(this.state!=='play')return}}
 this.score=this.passed*20+this.metrics.perfect*5;if(this.distance>=this.level.length&&this.jump<=0){const m=this.r36Mastery();this.finish(m.clean>=m.target?'clear':'fail',m.clean>=m.target?(this.metrics.hits?'실수를 딛고 통과했습니다.':'모든 표식을 깨끗하게 통과했습니다.'):'깨끗한 점프 '+m.target+'회가 필요합니다. 이번에는 '+m.clean+'회입니다.');}
};
Game.prototype.r34BossStep=function(dt){
 const r=this.r34Run,c=r34Chapter(this),p=c.boss.phases[r.phase];this.time+=dt;this.jump=Math.max(0,this.jump-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);this.boss.flash=Math.max(0,this.boss.flash-dt);
 if(r.retryDelay>0){r.retryDelay=Math.max(0,r.retryDelay-dt);if(r.retryDelay===0){r.clock=0;r.matched=[];r.inputs=0;r.lockedLane=r.lane;r.phaseAttempts++;r.phaseElapsed=0;r.quietCharge=0;r.emitted=false;r.budgetShot=null;r.launchClock=null;r.rejectedInputs=[];this.projectiles=[]}return}
 const old=r.clock;r.clock+=dt;
 r.phaseElapsed+=dt;
 if(c.boss.mechanic==='silence'){if(r.clock>=.7&&r.clock<=p.steps[0].at+.22)r.quietCharge+=dt;if(r.phaseElapsed>p.duration*2){this.r34TakeHit('침묵이 여러 번 끊겼습니다. 줄무늬가 끝날 때까지 입력을 쉬세요.',true);return}}
 const reflecting=c.boss.mechanic==='mirror'||c.boss.mechanic==='weave'&&r.phase===0;
 if(reflecting){const target=p.steps.find(s=>s.kind==='tap'),emitAt=target.at-(260-180)/120;if(!r.emitted&&r.clock>=emitAt){r.emitted=true;this.projectiles.push({id:'reflection-'+r.phase,x:260,y:320,width:14,height:14,vx:-120,owner:'boss',index:target.index})}
  for(const projectile of this.projectiles){projectile.x+=projectile.vx*dt;if(projectile.reflected&&projectile.x>=260){r.matched[projectile.index]=true;projectile.dead=true;this.events.push('r34-reflection-hit')}else if(projectile.owner==='boss'&&projectile.x<150){this.r34TakeHit('돌아온 빛을 받지 못했습니다. 빛이 몸 가까이에 왔을 때 눌러 주세요.',true);return}}this.projectiles=this.projectiles.filter(v=>!v.dead);
 }
 if(r.budgetShot){const shot=r.budgetShot;shot.x+=shot.vx*dt;if(shot.x>=260){r.budgetShot=null;if(shot.correct){r.matched[shot.index]=true;this.metrics.strikes++;this.metrics.shots=(this.metrics.shots||0)+1;this.events.push('r34-budget-hit')}else{this.r34TakeHit('한 번뿐인 네모가 닫힌 창에 닿았습니다. 밝은 창까지 기다려 주세요.',true);return}}}
 // The pulse boss retargets the player's present lane before every dive. Moving
 // too early cannot fool the second lock; each dive requires a fresh response.
 if(c.boss.mechanic==='pulse')for(const s of p.steps)if(old<s.at-.9&&r.clock>=s.at-.9){r.lockedLane=r.lane;this.events.push('attack-telegraph')}
 for(const s of p.steps){if(r.matched[s.index])continue;if(r.clock>r35Window(this,s).end+1e-9){if(s.kind==='rest'||s.kind==='quiet')r.matched[s.index]=true;else if(reflecting&&this.projectiles.some(v=>v.reflected&&v.index===s.index)||r.budgetShot?.index===s.index)continue;else{this.r34TakeHit('반격 창을 놓쳤습니다. '+p.cue,true);return}}}
 if(r.clock>=p.duration){this.boss.hp--;this.metrics.bossDamage++;this.boss.flash=.28;this.events.push('boss-damage');if(this.boss.hp===0){this.finish('clear','세 행동 단계를 모두 풀었습니다.');return}r.phase++;this.boss.phase=r.phase+1;r.clock=0;r.matched=[];r.inputs=0;r.lockedLane=r.lane;r.phaseElapsed=0;r.quietCharge=0;r.emitted=false;r.budgetShot=null;r.launchClock=null;r.rejectedInputs=[];this.projectiles=[];this.jump=0;this.events.push('boss-phase')}
};
Game.prototype.campaignStep=function(dt){return this.mode==='r34'?(this.gameMode==='r34-boss'?this.r34BossStep(dt):this.r34RouteStep(dt)):r34Prior.campaignStep.call(this,dt)};
Game.prototype.finish=function(state,reason=''){
 if(this.mode!=='r34')return r34Prior.finish.call(this,state,reason);if(this.state!=='play')return;const r=this.r34Run,entry=this.r34Journey.chapters[r.chapter-1];this.jump=0;r.inputBuffer=null;r.reason=reason;this.state=state;
 if(state==='clear'){if(r.isBoss){entry.bossDefeated=true;this.state='riddle';this.events.push('r34-clue-earned')}else{entry.situations[r.situation]=true;const m=this.r36Mastery(),record={rank:m.rank,clean:m.clean,groundClean:m.groundClean,echo:r.echo?.state==='collected'?1:0};entry.records=entry.records||Array.from({length:3},freshR36Record);entry.records[r.situation]=Object.fromEntries(Object.keys(record).map(k=>[k,Math.max(record[k],entry.records[r.situation][k])]));}}
 this.score=this.passed*20+this.metrics.perfect*5+this.metrics.bossDamage*100;this.result={mastery:r.isBoss?null:this.r36Mastery(),echo:r.isBoss?null:this.r36Echo(),kind:'r34',mode:'r34',contentVersion:'r34-1',levelId:this.levelId,chapter:r.chapter,situation:r.situation,isBoss:r.isBoss,state:this.state,score:this.score,...this.metrics,passed:this.passed,time:this.time,reason,objectivesMet:state==='clear',bossDefeated:r.isBoss&&this.boss.hp===0};this.events.push(state,'r34-progress');
};
Game.prototype.objectiveProgress=function(){if(this.mode!=='r34')return r34Prior.objectiveProgress.call(this);const r=this.r34Run,m=r.isBoss?null:this.r36Mastery();return [{type:'r34',text:r.isBoss?'세 단계 반격 완료':'깨끗한 점프 '+m.target+'회 · 실수해도 계속',value:r.isBoss?3-this.boss.hp:m.clean,target:r.isBoss?3:m.target,met:r.isBoss?this.boss.hp===0:this.state==='clear'}]};
Game.prototype.railAt=function(d,room=0){if(this.mode!=='r34')return r34Prior.railAt.call(this,d,room);return {x:this.gameMode==='r34-boss'?(r34Chapter(this).boss.mechanic==='chain'?92:[90,180,270][this.r34Run.lane]):92+(d-this.distance)*.7,y:350,angle:0,nx:0,ny:-1,room:0}};
Game.prototype.actorPoses=function(reduced=false){if(this.mode!=='r34')return r34Prior.actorPoses.call(this,reduced);return [{...this.railAt(this.distance),height:this.height(),phase:this.distance*.14,scale:.75,room:0,facing:1}]};
Game.prototype.hazardPose=function(h){if(this.mode!=='r34')return r34Prior.hazardPose.call(this,h);const q=this.railAt(h.d),s=r34Chapter(this).situations[this.r34Run.situation],hidden=s.hidden&&this.time>=1.3&&(h.d-this.distance)/this.speed-(h.pair?.25:JUMP_SECONDS/2)>R35_ANTICIPATION;return {...q,width:h.width*.7,height:h.type==='beam'?18:h.type==='silence'?8:h.clearance,clearance:h.clearance,ceiling:h.ceiling||10,type:h.type,room:0,collisionBounds:{left:q.x-h.width*.35,right:q.x+h.width*.35,top:q.y-h.clearance,bottom:q.y},floorCeiling:h.type==='beam'?q.y-h.ceiling:null,visible:!h.done&&!hidden&&q.x>-40&&q.x<400}};
Game.prototype.geometry=function(){if(this.mode!=='r34')return r34Prior.geometry.call(this);const status=this.r34Status();return {kind:this.gameMode,paths:[{room:0,points:[{x:30,y:350},{x:330,y:350}]}],platforms:[{x:30,y:350,width:300,height:24}],rooms:[],gaps:this.hazards.filter(h=>h.type==='gap'&&!h.done).map(h=>({x:92+(h.d-h.width/2-this.distance)*.7,width:h.width*.7})),projectiles:this.projectiles||[],boss:status.isBoss?{x:260,y:230,width:44,height:48,vulnerable:status.boss.stage==='counter',attack:status.boss.stage}:null,telegraph:status.boss?{text:status.boss.cue,stage:status.boss.stage,windows:status.boss.windows,objects:status.boss.objects}:null,r34:status}};
Game.prototype.bossCue=function(){if(this.mode!=='r34')return r34Prior.bossCue.call(this);const s=this.r34Status();return s.isBoss?{text:s.boss.cue,type:s.boss.mechanic,phase:s.boss.phase,distance:0,strike:s.boss.stage==='counter'}:s.nextHazard?{text:s.nextHazard.cue,type:s.nextHazard.type,distance:s.nextHazard.distance,phase:1,strike:false}:null};

root.QuadRiftHD={Game,rail,angleAt,SIDE,LENGTH,SPEED,HAZARDS,JUMP_SECONDS,JUMP_HEIGHT,HAZARD_HEIGHT,CLEARANCE,TUTORIAL_STEPS,CORNER_RADIUS,CORNER_BLEND,CORNER_LENGTH,CORNER_EXTENT,cornerAngle,cornerPoint,STRAIGHT_LENGTH,QUARTER_PATH_LENGTH,PATH_RATIO,CORNER_START,TUTORIAL_STOP,TUTORIAL_HAZARD};if(typeof module!=='undefined')module.exports=root.QuadRiftHD;
})(globalThis);
