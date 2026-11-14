/* R59 authored experiment based on observed slot66 drop -> floor-wave structure.
 * Period, jump, HP and policy values remain hypotheses, not original constants. */
(function(root){'use strict';
const STEP=1/240,PERIOD=3.2,EPS=1e-9,JUMP=1.25,HP=12;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const clock=t=>{const cycle=Math.floor((t+EPS)/PERIOD);return{cycle,phase:Math.max(0,t-cycle*PERIOD)};};
const figure=[[-4,-20],[0,-20],[4,-20],[-8,-16],[-4,-16],[0,-16],[4,-16],[-8,-12],[-4,-12],[0,-12],[-8,-8],[-4,-8],[0,-8],[4,-8],[-8,-4],[-4,-4],[0,-4],[4,-4],[-4,0],[0,0],[4,0],[-4,4],[4,4],[-8,8],[8,8],[-8,12],[8,12],[12,-8],[16,-8],[20,-8],[20,-4],[20,0],[20,4],[20,8],[20,12],[20,16]];
const drop=[[0,-3],[0,-2],[-1,-1],[1,-1],[-1,0],[1,0],[-2,1],[2,1],[-2,2],[2,2],[-1,3],[0,3],[1,3]];
const wave=[[-5,-1],[-4,-2],[-3,-3],[-2,-3],[-1,-3],[0,-2],[1,-2],[2,-1],[3,-1],[-3,-1],[-5,0],[-4,0],[-3,0]];
function sweep(a,b,an,bn){let enter=0,exit=1;const dx=an.x-a.x-bn.x+b.x,dy=an.y-a.y-bn.y+b.y;for(const[p,d,lo,hi]of[[a.x,dx,b.x-a.w,b.x+b.w],[a.y,dy,b.y-a.h,b.y+b.h]]){if(Math.abs(d)<EPS){if(p<lo||p>hi)return false;continue;}let l=(lo-p)/d,h=(hi-p)/d;if(l>h)[l,h]=[h,l];enter=Math.max(enter,l);exit=Math.min(exit,h);if(enter>exit)return false;}return exit>=0&&enter<=1;}
function valid(w,h){return Number.isFinite(w)&&Number.isFinite(h)&&w>=570&&h>=570&&w<=1800&&h<=1800;}
class WaveRun{
 constructor({width=570,height=840,policy='cycle'}={}){if(!valid(width,height))throw Error('Invalid arena');if(!['cycle','clean','time'].includes(policy))throw Error('Invalid policy');this.width=width;this.height=height;this.policy=policy;this.reset();}
 reset(){this.state='title';this.time=0;this.elapsed=0;this.acc=0;this.hp=HP;this.lives=3;this.hits=0;this.successes=0;this.inputs=0;this.jumpStart=null;this.held=false;this.blockUntilUp=false;this.stun=0;this.invulnerableUntil=-1;this.cycle=-1;this.pass=null;this.pendingArena=null;this.resumeState=null;this.endingTime=0;this.nextTimedDamage=PERIOD;this.droppedSeconds=0;this.events=[];}
 start(){const block=this.held||this.blockUntilUp,p=this.pendingArena;if(p){this.width=p.width;this.height=p.height;}this.reset();this.blockUntilUp=block;this.state='play';this.emit('start');}
 emit(type,data={}){this.events.push({type,time:this.time,elapsed:this.elapsed,...data});if(this.events.length>600)this.events.shift();}
 get floor(){return this.height-24;}
 jumpProgress(time=this.time){if(this.jumpStart===null)return null;const p=(time-this.jumpStart)/JUMP;return p<0||p>=1?null:p;}
 actor(time=this.time+((['ending','result'].includes(this.state)||(this.state==='pause'&&this.resumeState==='ending'))?this.endingTime:0)){const p=this.jumpProgress(time),lift=p===null?0:Math.min(190,this.height*.3)*4*p*(1-p),angle=p===null?0:Math.PI*2*p,x=this.width*.18,y=this.floor-28-lift,c=Math.cos(angle),s=Math.sin(angle),cells=figure.map(([px,py],i)=>({id:'p'+i,x:x+(px*c-py*s)*1.5-3,y:y+(px*s+py*c)*1.5-3,w:6,h:6}));return{x,y,lift,angle,cells,jumping:p!==null,invulnerable:this.elapsed<this.invulnerableUntil,hurt:this.stun>0};}
 body(time=this.time){const{cycle,phase}=clock(time),floor=this.floor,startX=this.width-114;let stage='hover',x=startX,y=110,morph=0;
  if(phase>=.3&&phase<.9){stage='fall';y=mix(110,floor-78,ease((phase-.3)/.6));}
  else if(phase>=.9&&phase<1.25){stage='morph';morph=ease((phase-.9)/.35);y=mix(floor-78,floor-9,morph);}
  else if(phase>=1.25&&phase<2.65){stage='wave';morph=1;y=floor-9;x=mix(startX,-120,(phase-1.25)/1.4);}
  else if(phase>=2.65)stage='return';
  const prefix=`${cycle}-${stage==='return'?'return':'attack'}-`,cells=drop.map(([dx,dy],i)=>({id:prefix+i,x:x+mix(dx,wave[i][0],morph)*22-9,y:y+mix(dy,wave[i][1],morph)*22-9,w:18,h:18}));
  if(morph>.5)for(let i=-2;i<=4;i++)cells.push({id:prefix+'base'+i,x:x+i*22-9,y:floor-18,w:18,h:18});
  return{x,y,cycle,phase,stage,morph,cells};
 }
 inputDown(){if(this.state!=='play'||this.held||this.blockUntilUp)return false;this.held=true;if(this.stun>0||this.jumpProgress()!==null)return false;this.jumpStart=this.time;this.inputs++;this.emit('jump');return true;}
 inputUp(){this.held=false;this.blockUntilUp=false;}
 pause(){if(!['play','ending'].includes(this.state))return false;this.resumeState=this.state;this.state='pause';this.blockUntilUp=this.held;this.held=false;return true;}
 resume(){if(this.state!=='pause')return false;this.state=this.resumeState;this.resumeState=null;return true;}
 queueArena(width,height){if(!valid(width,height))return false;this.pendingArena={width,height};this.pause();return true;}
 advance(dt){if(!Number.isFinite(dt)||dt<0||dt>30)throw Error('Invalid duration');if(!['play','ending'].includes(this.state))return;this.acc+=dt;while(this.acc+EPS>=STEP&&['play','ending'].includes(this.state)){this.step();this.acc=Math.max(0,this.acc-STEP);}}
 hostFrame(dt){if(!Number.isFinite(dt)||dt<0)throw Error('Invalid duration');this.droppedSeconds+=Math.max(0,dt-.1);this.advance(Math.min(.1,dt));}
 damageBoss(reason){this.hp--;this.successes++;this.emit('boss-damage',{reason,hp:this.hp});if(this.hp===0){this.state='ending';this.held=false;this.emit('victory');}}
 step(){if(this.state==='ending'){this.endingTime+=STEP;if(this.endingTime+EPS>=5){this.state='result';this.emit('result');}return;}
  this.elapsed+=STEP;
  if(this.stun>0){this.stun=Math.max(0,this.stun-STEP);return;}
  const{cycle}=clock(this.time);if(cycle!==this.cycle){this.cycle=cycle;this.pass={hit:false,scored:false};this.emit('attack',{cycle});}
  const next=this.time+STEP,a=this.actor(),an=this.actor(next),b=this.body(),bn=this.body(next),before=new Map(b.cells.map(c=>[c.id,c]));let hit=null;
  for(const end of bn.cells){const start=before.get(end.id)||end;for(let i=0;i<a.cells.length&&!hit;i++)if(sweep(a.cells[i],start,an.cells[i],end))hit=end;}
  // One continuous wave is one attack. Its trailing cells cannot consume a
  // second life after the hit animation; recovery is visibly retained until exit.
  if(hit&&!this.pass.hit&&this.elapsed>=this.invulnerableUntil){this.lives--;this.hits++;this.pass.hit=true;this.stun=.25;this.invulnerableUntil=this.elapsed+Math.max(.8,2.65-b.phase+.35);this.emit('human-hit',{cell:hit.id,lives:this.lives});if(!this.lives){this.state='fail';this.held=false;this.emit('failure');}}
  if(this.state==='play'&&this.policy!=='time'&&!this.pass.scored&&b.phase<2.65&&bn.cycle===b.cycle&&bn.phase+EPS>=2.65){this.pass.scored=true;const success=this.policy==='cycle'||!this.pass.hit;this.emit('pass',{cycle,success,hadHit:this.pass.hit});if(success)this.damageBoss(this.policy);}
  if(this.state==='play'&&this.policy==='time'&&this.elapsed+EPS>=this.nextTimedDamage){this.nextTimedDamage+=PERIOD;this.damageBoss('elapsed');}
  this.time=next;
 }
 cue(){const{cycle,phase}=clock(this.time),speed=(this.width+6)/1.4,leading=this.width-114-119,target=cycle*PERIOD+1.25+(leading-(this.width*.18+33))/speed,eta=target-this.time,ready=this.state==='play'&&!this.stun&&!this.actor().jumping&&phase<2.65&&eta<=.42&&eta>=-.08;return{ready,timeToFront:eta,contactTime:target,text:'바닥 파동을 넘기'};}
 snapshot(){return{state:this.state,time:this.time,elapsed:this.elapsed,width:this.width,height:this.height,hp:this.hp,lives:this.lives,hits:this.hits,successes:this.successes,inputs:this.inputs,policy:this.policy,stun:this.stun,invulnerableUntil:this.invulnerableUntil,actor:this.actor(),body:this.body(),cue:this.cue(),endingTime:this.endingTime,pendingArena:this.pendingArena,events:this.events.map(e=>({...e}))};}
}
const api={WaveRun,STEP,PERIOD,JUMP,HP,sweep};root.MongyuWaveLab=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
