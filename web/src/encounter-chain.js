/* R55 experiment: observed chain/body structure, authored timing and damage policies. */
(function(root){'use strict';
const STEP=1/240,EPS=1e-9,PERIOD=3.4;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
// One clock definition for both scoring and geometry. A raw % can leave a new
// cycle at phase 3.399999999999 and incorrectly award it before an approach.
const clock=time=>{const cycle=Math.floor((time+EPS)/PERIOD);return {cycle,phase:Math.max(0,time-cycle*PERIOD)};};
// Relative translation of two AABBs over a fixed substep. Rendering uses these same cells.
function touch(a,b,an,bn){
 const dx=(an.x-a.x)-(bn.x-b.x),dy=(an.y-a.y)-(bn.y-b.y);
 let enter=0,exit=1;
 for(const [p,d,lo,hi] of [[a.x,dx,b.x-a.w,b.x+b.w],[a.y,dy,b.y-a.h,b.y+b.h]]){
  if(Math.abs(d)<EPS){if(p<lo||p>hi)return false;continue;}
  let t0=(lo-p)/d,t1=(hi-p)/d;if(t0>t1)[t0,t1]=[t1,t0];enter=Math.max(enter,t0);exit=Math.min(exit,t1);if(enter>exit)return false;
 }return exit>=0&&enter<=1;
}
const shape=[];for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)if(x*x+y*y<=5&&!(x===-1&&y===-1))shape.push({x:x*21-9,y:y*21-9,w:18,h:18});
// A pixel figure that rotates as visible, individually collidable cells. Empty
// space in its enclosing rectangle is not a damaging silhouette.
const figure=[[-4,-56],[0,-56],[4,-56],[-8,-52],[8,-52],[-8,-48],[8,-48],[-4,-44],[0,-44],[4,-44],[0,-40],[0,-36],[0,-32],[0,-28],[0,-24],[-4,-36],[-8,-32],[4,-36],[8,-32],[-4,-20],[-4,-16],[-8,-12],[-8,-8],[-12,-4],[4,-20],[4,-16],[8,-12],[8,-8],[12,-4]];
class ChainRun{
 constructor({width=570,height=840,policy='avoid',companion=true}={}){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<570||width>1800||height<570||height>1800)throw Error('Invalid arena');
  if(!['avoid','companion','survival'].includes(policy))throw Error('Invalid policy');
  this.width=width;this.height=height;this.policy=policy;this.companion=!!companion;this.reset();
 }
 reset(){this.floor=this.height-88;this.playerX=this.width*.19;this.time=0;this.accumulator=0;this.state='title';this.resumeState=null;this.held=false;this.blockUntilUp=false;this.hp=6;this.maxHp=6;this.lives=3;this.hits=0;this.successes=0;this.inputs=0;this.jumps=[];this.events=[];this.cycle=-1;this.pass=null;this.pendingArena=null;this.endingTime=0;this.droppedSeconds=0;return this;}
 start(){const blocked=this.held||this.blockUntilUp,pending=this.pendingArena;if(pending){this.width=pending.width;this.height=pending.height;}this.reset();this.blockUntilUp=blocked;this.state='play';this.emit('start');}
 emit(type,data={}){this.events.push({type,time:this.time,...data});if(this.events.length>400)this.events.shift();}
 actor(time=this.time+((['ending','result'].includes(this.state)||this.resumeState==='ending')?this.endingTime:0)){
  const start=this.jumps.findLast(t=>t<=time),age=start===undefined?Infinity:time-start,duration=1.45,h=age<duration?150*Math.sin(Math.PI*age/duration):0;
  const ds=this.jumps.findLast(t=>t+.42<=time),da=ds===undefined?Infinity:time-ds-.42,dh=da<1.6?72*Math.sin(Math.PI*da/1.6):0;
  const angle=age<duration?Math.PI*2*age/duration:0,cos=Math.cos(angle),sin=Math.sin(angle);
  const humanCells=figure.map(([x,y])=>({x:this.playerX+x*cos-(y+30)*sin-2,y:this.floor-h-30+x*sin+(y+30)*cos-2,w:4,h:4}));
  const minX=Math.min(...humanCells.map(c=>c.x)),minY=Math.min(...humanCells.map(c=>c.y)),maxX=Math.max(...humanCells.map(c=>c.x+c.w)),maxY=Math.max(...humanCells.map(c=>c.y+c.h));
  const dog=this.companion?{x:this.playerX-16,y:this.floor-dh-24,w:34,h:24}:null,dogCells=dog?[dog,{x:dog.x+27,y:dog.y-7,w:7,h:7},{x:dog.x-5,y:dog.y+3,w:5,h:5}]:[];
  return {height:h,air:age<duration,angle,humanCells,human:{x:minX,y:minY,w:maxX-minX,h:maxY-minY},dog,dogCells,dogHeight:this.companion?dh:0};
 }
 body(time=this.time){const phase=clock(time).phase,amount=phase<.8?0:phase<1.65?ease((phase-.8)/.85):phase<1.8?1:phase<2.55?1-ease((phase-1.8)/.75):0;
  const idle={x:this.width-110,y:Math.max(140,this.height*.34)},low={x:this.playerX+12,y:this.floor-52};
  // The body descends before crossing the player's column and retracts sideways
  // before rising. These authored curves keep the visible threat avoidable.
  const drop=phase<.8?0:phase<1.35?ease((phase-.8)/.55):phase<2.05?1:phase<2.55?1-ease((phase-2.05)/.5):0;
  const x=idle.x+(low.x-idle.x)*amount,y=idle.y+(low.y-idle.y)*drop,anchor={x:this.width-36,y:36};
  const cells=shape.map(c=>({...c,x:c.x+x,y:c.y+y})),length=Math.hypot(anchor.x-x,anchor.y-y),links=[];
  const n=Math.max(1,Math.floor((length-55)/23));for(let i=0;i<n;i++){const f=(i*23+55)/length;links.push({x:x+(anchor.x-x)*f-7,y:y+(anchor.y-y)*f-7,w:14,h:14});}
  return {x,y,phase,amount,cells,links,anchor};
 }
 inputDown(){if(this.state!=='play'||this.held||this.blockUntilUp)return false;this.held=true;if(this.actor().air)return false;this.jumps.push(this.time);if(this.jumps.length>12)this.jumps.shift();this.inputs++;this.emit('jump');return true;}
 inputUp(){this.held=false;this.blockUntilUp=false;}
 pause(){if(!['play','ending'].includes(this.state))return false;this.resumeState=this.state;this.state='pause';this.blockUntilUp=this.held;this.held=false;return true;}
 resume(){if(this.state!=='pause')return false;this.state=this.resumeState;this.resumeState=null;return true;}
 queueArena(width,height){if(!Number.isFinite(width)||!Number.isFinite(height)||width<570||width>1800||height<570||height>1800)return false;this.pendingArena={width,height};this.pause();return true;}
 hostFrame(dt){if(!Number.isFinite(dt)||dt<0)throw Error('Invalid duration');this.droppedSeconds+=Math.max(0,dt-.1);this.advance(Math.min(dt,.1));}
 advance(dt){if(!Number.isFinite(dt)||dt<0||dt>30)throw Error('Invalid duration');if(!['play','ending'].includes(this.state))return;this.accumulator+=dt;while(this.accumulator+EPS>=STEP&&['play','ending'].includes(this.state)){this.step();this.accumulator=Math.max(0,this.accumulator-STEP);}}
 step(){if(this.state==='ending'){this.endingTime+=STEP;if(this.endingTime>=5){this.state='result';this.emit('result');}return;}
  const c=clock(this.time).cycle;if(c!==this.cycle){this.cycle=c;this.pass={humanHit:false,dogContact:false,scored:false};this.emit('approach',{cycle:c});}
  const a=this.actor(),an=this.actor(this.time+STEP),b=this.body(),bn=this.body(this.time+STEP);let contact=false,dog=false;
  for(let i=0;i<b.cells.length;i++){for(let j=0;j<a.humanCells.length&&!contact;j++)contact=touch(b.cells[i],a.humanCells[j],bn.cells[i],an.humanCells[j]);for(let j=0;j<a.dogCells.length&&!dog;j++)dog=touch(b.cells[i],a.dogCells[j],bn.cells[i],an.dogCells[j]);}
  if(dog&&!this.pass.dogContact){this.pass.dogContact=true;this.emit('dog-contact',{cycle:c});}
  if(contact&&!this.pass.humanHit){this.pass.humanHit=true;this.lives--;this.hits++;this.emit('human-hit',{cycle:c});if(!this.lives){this.state='fail';this.held=false;this.emit('failure');}}
  // Evaluate the whole outbound-and-return pass. Awarding at the low point
  // would count an early jump as success even when its landing is struck.
  const checkpoint=this.policy==='survival'?2.9:2.55;
  if(this.state==='play'&&!this.pass.scored&&b.phase+EPS>=checkpoint){this.pass.scored=true;
   const success=this.policy==='survival'?true:this.policy==='companion'?this.pass.dogContact&&!this.pass.humanHit:!this.pass.humanHit;
   this.emit('pass',{cycle:c,success,policy:this.policy,humanHit:this.pass.humanHit,dogContact:this.pass.dogContact});
   if(success){this.hp--;this.successes++;this.emit('boss-damage',{cycle:c,hp:this.hp});if(!this.hp){this.state='ending';this.held=false;this.emit('victory');}}
  }this.time+=STEP;
 }
 cue(){const {phase:p,cycle}=clock(this.time);return {id:cycle,ready:this.state==='play'&&!this.actor().air&&p>=.7&&p<=1.05,verb:'jump',text:'사슬이 내려오면 뛰어넘기'};}
 snapshot(){return {state:this.state,time:this.time,hp:this.hp,lives:this.lives,hits:this.hits,successes:this.successes,inputs:this.inputs,cycle:this.cycle,policy:this.policy,actor:this.actor(),body:this.body(),pass:this.pass?{...this.pass}:null,pendingArena:this.pendingArena?{...this.pendingArena}:null,endingTime:this.endingTime,cue:this.cue(),events:this.events.map(e=>({...e}))};}
}
const api={ChainRun,STEP,PERIOD,touch,shape};root.MongyuChainLab=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
