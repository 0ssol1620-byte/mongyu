/* R57: authored hypotheses for the observed slot58 flight/radial-cell structure. */
(function(root){'use strict';
const STEP=1/240,PERIOD=4.2,EPS=1e-9,SPEED=220,RADIUS=44;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const clock=t=>{const cycle=Math.floor((t+EPS)/PERIOD);return {cycle,phase:Math.max(0,t-cycle*PERIOD)};};
function sweep(a,b,an,bn){let enter=0,exit=1;const dx=an.x-a.x-bn.x+b.x,dy=an.y-a.y-bn.y+b.y;for(const [p,d,lo,hi] of [[a.x,dx,b.x-a.w,b.x+b.w],[a.y,dy,b.y-a.h,b.y+b.h]]){if(Math.abs(d)<EPS){if(p<lo||p>hi)return false;continue;}let l=(lo-p)/d,h=(hi-p)/d;if(l>h)[l,h]=[h,l];enter=Math.max(enter,l);exit=Math.min(exit,h);if(enter>exit)return false;}return exit>=0&&enter<=1;}
const distance=(a,b)=>Math.hypot(Math.max(0,a.x-b.x-b.w,b.x-a.x-a.w),Math.max(0,a.y-b.y-b.h,b.y-a.y-a.h));
const figure=[[-4,-20],[0,-20],[4,-20],[-8,-16],[-4,-16],[0,-16],[4,-16],[-8,-12],[-4,-12],[0,-12],[-8,-8],[-4,-8],[0,-8],[4,-8],[-8,-4],[-4,-4],[0,-4],[4,-4],[-4,0],[0,0],[4,0],[-4,4],[4,4],[-8,8],[8,8],[-8,12],[8,12],[12,-8],[16,-8],[20,-8],[20,-4],[20,0],[20,4],[20,8],[20,12],[20,16]];
const core=[[-22,0],[0,-22],[0,0],[0,22],[22,0],[-22,22],[22,-22]];
function actorCells(x,y,angle){const c=Math.cos(angle),s=Math.sin(angle);return figure.map(([px,py],i)=>({id:'p'+i,x:x+(px*c-py*s)*1.5-3,y:y+(px*s+py*c)*1.5-3,w:6,h:6}));}
function bounds(cells){const x=Math.min(...cells.map(c=>c.x)),y=Math.min(...cells.map(c=>c.y));return{x,y,w:Math.max(...cells.map(c=>c.x+c.w))-x,h:Math.max(...cells.map(c=>c.y+c.h))-y};}
function arenaValid(w,h){return Number.isFinite(w)&&Number.isFinite(h)&&w>=570&&w<=1800&&h>=570&&h<=1800;}
class RadialRun{
 constructor({width=570,height=840,control='counter',policy='contact'}={}){if(!arenaValid(width,height))throw Error('Invalid arena');if(!['counter','quarter','reverse'].includes(control))throw Error('Invalid control');if(!['contact','near','avoid','survival'].includes(policy))throw Error('Invalid policy');this.width=width;this.height=height;this.control=control;this.policy=policy;this.reset();}
 reset(){this.state='title';this.time=0;this.accumulator=0;this.x=this.width*.2;this.y=this.height*.75;this.vx=SPEED*.76;this.vy=-SPEED*Math.sqrt(1-.76*.76);this.angle=0;this.hp=10;this.lives=3;this.hits=0;this.successes=0;this.inputs=0;this.held=false;this.blockUntilUp=false;this.counterUntil=-1;this.counterUsed=false;this.cooldownUntil=-1;this.invulnerableUntil=-1;this.hurtUntil=-1;this.endingTime=0;this.events=[];this.cycle=-1;this.pass=null;this.pendingArena=null;this.resumeState=null;this.droppedSeconds=0;return this;}
 start(){const block=this.held||this.blockUntilUp,p=this.pendingArena;if(p){this.width=p.width;this.height=p.height;}this.reset();this.blockUntilUp=block;this.state='play';this.emit('start');}
 emit(type,data={}){this.events.push({type,time:this.time,...data});if(this.events.length>600)this.events.shift();}
 actor(x=this.x,y=this.y,angle=this.angle){const cells=actorCells(x,y,angle),box=bounds(cells);return{x,y,angle,cells,box,counterBox:{x:box.x-10,y:box.y-10,w:box.w+20,h:box.h+20},active:this.state==='play'&&this.time<this.counterUntil&&!this.counterUsed,invulnerable:this.time<this.invulnerableUntil};}
 body(time=this.time){const {cycle,phase}=clock(time),grow=phase<1?0:phase<1.8?ease((phase-1)/.8):phase<2.35?1:phase<3.05?1-ease((phase-2.35)/.7):0;
  const x=this.width*.52+Math.sin(time*.83)*Math.min(35,this.width*.055),y=this.height*.48+Math.cos(time*.71)*Math.min(45,this.height*.06),angle=time*.76,cells=[],rays=[];let armCount=0;
  for(let i=0;i<core.length;i++)cells.push({id:'c'+i,x:x+core[i][0]-9,y:y+core[i][1]-9,w:18,h:18,kind:'core'});
  // Responsive candidate: the windup previews each ray's reach. Cell size stays
  // fixed; additional cells make a large viewport an active field, not dead space.
  for(let arm=0;arm<4;arm++){const a=angle+arm*Math.PI/2,ux=Math.cos(a),uy=Math.sin(a),tx=Math.abs(ux)<EPS?Infinity:((ux>0?this.width-24:24)-x)/ux,ty=Math.abs(uy)<EPS?Infinity:((uy>0?this.height-24:24)-y)/uy,limit=Math.min(tx,ty)-10,maxCount=Math.max(3,Math.min(40,1+Math.floor((limit-58)/26))),count=3+Math.floor(grow*(maxCount-3+.999));armCount=Math.max(armCount,count);rays.push({x,y,tx:x+ux*(58+(maxCount-1)*26),ty:y+uy*(58+(maxCount-1)*26)});for(let j=0;j<count;j++){const r=58+j*26;cells.push({id:`a${arm}-${j}`,x:x+ux*r-9,y:y+uy*r-9,w:18,h:18,kind:'arm'});}}
  return{x,y,angle,cycle,phase,grow,armCount,cells,rays,hurt:time<this.hurtUntil};
 }
 inputDown(){if(this.state!=='play'||this.held||this.blockUntilUp)return false;this.held=true;if(this.time+EPS<this.cooldownUntil)return false;if(this.control==='quarter')[this.vx,this.vy]=[-this.vy,this.vx];if(this.control==='reverse'){this.vx=-this.vx;this.vy=-this.vy;}this.counterUntil=this.time+.42;this.counterUsed=false;this.cooldownUntil=this.time+.45;this.inputs++;this.emit('input',{control:this.control,policy:this.policy});return true;}
 inputUp(){this.held=false;this.blockUntilUp=false;}
 pause(){if(!['play','ending'].includes(this.state))return false;this.resumeState=this.state;this.state='pause';this.blockUntilUp=this.held;this.held=false;return true;}
 resume(){if(this.state!=='pause')return false;this.state=this.resumeState;this.resumeState=null;return true;}
 queueArena(width,height){if(!arenaValid(width,height))return false;this.pendingArena={width,height};this.pause();return true;}
 hostFrame(dt){if(!Number.isFinite(dt)||dt<0)throw Error('Invalid duration');this.droppedSeconds+=Math.max(0,dt-.1);this.advance(Math.min(.1,dt));}
 advance(dt){if(!Number.isFinite(dt)||dt<0||dt>30)throw Error('Invalid duration');if(!['play','ending'].includes(this.state))return;this.accumulator+=dt;while(this.accumulator+EPS>=STEP&&['play','ending'].includes(this.state)){this.step();this.accumulator=Math.max(0,this.accumulator-STEP);}}
 move(dt){const paths=[];let left=dt,done=0,n=0;while(left>EPS){if(n++>4){this.state='invalid';this.emit('boundary-budget');break;}const from={x:this.x,y:this.y,angle:this.angle},tx=this.vx>0?(this.width-RADIUS-this.x)/this.vx:this.vx<0?(RADIUS-this.x)/this.vx:Infinity,ty=this.vy>0?(this.height-RADIUS-this.y)/this.vy:this.vy<0?(RADIUS-this.y)/this.vy:Infinity,t=Math.max(0,Math.min(left,tx,ty));this.x+=this.vx*t;this.y+=this.vy*t;this.angle+=4.8*t;paths.push({from,to:{x:this.x,y:this.y,angle:this.angle},f0:done/dt,f1:(done+t)/dt});done+=t;left-=t;if(tx<=t+EPS){this.vx=-this.vx;this.emit('wall',{axis:'x'});}if(ty<=t+EPS){this.vy=-this.vy;this.emit('wall',{axis:'y'});}if(left<=EPS)break;}return paths;}
 bounce(cell){let dx=this.x-(cell.x+cell.w/2),dy=this.y-(cell.y+cell.h/2),n=Math.hypot(dx,dy);if(n<EPS){dx=-this.vx;dy=-this.vy;n=SPEED;}this.vx=dx/n*SPEED;this.vy=dy/n*SPEED;}
 damageBoss(reason,cell){this.hp--;this.successes++;this.hurtUntil=this.time+.28;this.emit('boss-damage',{reason,hp:this.hp,cell:cell?.id||null});if(!this.hp){this.state='ending';this.held=false;this.emit('victory');}}
 step(){if(this.state==='ending'){this.endingTime+=STEP;this.angle+=STEP*2;if(this.endingTime>=5){this.state='result';this.emit('result');}return;}
  const {cycle}=clock(this.time);if(cycle!==this.cycle){this.cycle=cycle;this.pass={hit:false,scored:false};this.emit('approach',{cycle});}
  const paths=this.move(STEP);if(this.state!=='play')return;let hit=null,near=null;
  for(const p of paths){const a=this.actor(p.from.x,p.from.y,p.from.angle),an=this.actor(p.to.x,p.to.y,p.to.angle),b=this.body(this.time+STEP*p.f0),bn=this.body(this.time+STEP*p.f1),before=new Map(b.cells.map(c=>[c.id,c]));for(const end of bn.cells){const start=before.get(end.id)||end;if(!near&&sweep(a.counterBox,start,an.counterBox,end))near=end;for(let j=0;j<a.cells.length&&!hit;j++)if(sweep(a.cells[j],start,an.cells[j],end))hit=end;}}
  const active=this.time<this.counterUntil&&!this.counterUsed,target=this.policy==='near'?near:hit;
  if(active&&target&&['contact','near'].includes(this.policy)){this.counterUsed=true;this.invulnerableUntil=Math.max(this.time+.35,this.cooldownUntil+.25);this.bounce(target);this.damageBoss(this.policy,target);}
  else if(hit&&this.time>=this.invulnerableUntil){this.hits++;this.lives--;this.pass.hit=true;this.invulnerableUntil=this.time+1;this.bounce(hit);this.emit('human-hit',{cell:hit.id,lives:this.lives});if(!this.lives){this.state='fail';this.held=false;this.emit('failure');}}
  const phase=this.body().phase,checkpoint=this.policy==='survival'?3.8:3.1;
  if(this.state==='play'&&['avoid','survival'].includes(this.policy)&&!this.pass.scored&&phase+EPS>=checkpoint){this.pass.scored=true;const success=this.policy==='survival'||!this.pass.hit;this.emit('pass',{cycle,success,policy:this.policy});if(success)this.damageBoss(this.policy);}
  this.time+=STEP;
 }
 cue(){const a=this.actor(),b=this.body(),dist=Math.min(...b.cells.map(c=>distance(a.box,c)));let eta=null;
  // Public practice cue predicts the same moving cells, rather than treating a
  // fixed distance as a timing window. It never changes the actor or damage.
  if(this.state==='play'&&this.time+EPS>=this.cooldownUntil&&dist<550){
   const fold=(p,v,limit,dt)=>{const span=limit-2*RADIUS;let q=(p-RADIUS+v*dt)%(2*span);if(q<0)q+=2*span;return RADIUS+(q<=span?q:2*span-q);};
   let previous=a,prior=b;
   for(let i=1;i<=14&&eta===null;i++){const dt=i*.02,now=this.actor(fold(this.x,this.vx,this.width,dt),fold(this.y,this.vy,this.height,dt),this.angle+dt*4.8),body=this.body(this.time+dt),before=new Map(prior.cells.map(c=>[c.id,c]));
    for(const c of body.cells){const pc=before.get(c.id)||c;if(this.policy==='near'){if(sweep(previous.counterBox,pc,now.counterBox,c)){eta=dt;break;}}
     else if(sweep(previous.box,pc,now.box,c)){for(let j=0;j<previous.cells.length;j++)if(sweep(previous.cells[j],pc,now.cells[j],c)){eta=dt;break;}if(eta!==null)break;}}
    previous=now;prior=body;
   }
  }
  return{distance:dist,timeToContact:eta,ready:eta!==null,text:'가까워지는 팔을 받아치기'};
 }
 snapshot(){return{state:this.state,time:this.time,width:this.width,height:this.height,hp:this.hp,lives:this.lives,hits:this.hits,successes:this.successes,inputs:this.inputs,control:this.control,policy:this.policy,x:this.x,y:this.y,vx:this.vx,vy:this.vy,angle:this.angle,actor:this.actor(),body:this.body(),cue:this.cue(),pendingArena:this.pendingArena?{...this.pendingArena}:null,endingTime:this.endingTime,events:this.events.map(e=>({...e}))};}
}
const api={RadialRun,STEP,PERIOD,SPEED,RADIUS,sweep,distance,actorCells,bounds};root.MongyuRadialLab=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
