/* R65 candidate: R62 observed anchored runner, open rotating arms and physical
   black-projectile return. Color policy, timing and aim are authored hypotheses. */
(function(root){'use strict';
const sweep=root.MongyuRobotLab?.sweep||(typeof require==='function'?require('./encounter-robot.js').sweep:null);
const STEP=1/240,EPS=1e-9,PERIOD=3.4;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const figure=[[-4,-56],[0,-56],[4,-56],[-8,-52],[8,-52],[-8,-48],[8,-48],[-4,-44],[0,-44],[4,-44],[0,-40],[0,-36],[0,-32],[0,-28],[0,-24],[-4,-36],[-8,-32],[4,-36],[8,-32],[-4,-20],[-4,-16],[-8,-12],[-8,-8],[-12,-4],[4,-20],[4,-16],[8,-12],[8,-8],[12,-4]];
function bounds(cells){const x=Math.min(...cells.map(c=>c.x)),y=Math.min(...cells.map(c=>c.y));return{x,y,w:Math.max(...cells.map(c=>c.x+c.w))-x,h:Math.max(...cells.map(c=>c.y+c.h))-y};}
class OrbitRun{
 constructor({width=570,height=1000,policy='black-return-blue-jump'}={}){
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<570||height<570||width>1800||height>1800)throw Error('Invalid arena');
  if(policy!=='black-return-blue-jump')throw Error('Invalid policy');this.width=width;this.height=height;this.policy=policy;this.reset();
 }
 reset(){this.floor=this.height-88;this.playerX=this.width*.19;this.state='title';this.time=0;this.accumulator=0;this.hp=6;this.maxHp=6;this.lives=3;this.hits=0;this.successes=0;this.inputs=0;this.returns=0;this.held=false;this.blockUntilUp=false;this.resumeState=null;this.jumpStart=-10;this.punchUntil=-1;this.counterUntil=-1;this.cooldownUntil=-1;this.invulnerableUntil=-1;this.hurtUntil=-1;this.endingTime=0;this.nextSpawn=.6;this.volley=0;this.sequence=0;this.projectiles=[];this.events=[];return this;}
 start(){const block=this.held||this.blockUntilUp;this.reset();this.blockUntilUp=block;this.state='play';this.emit('start');}
 emit(type,data={}){this.events.push({type,time:this.time,...data});if(this.events.length>500)this.events.shift();}
 actor(time=this.time+(['ending','result'].includes(this.state)?this.endingTime:0)){
  const age=time-this.jumpStart,air=age>=0&&age<1.25,height=air?170*Math.sin(Math.PI*age/1.25):0,angle=air?Math.PI*2*age/1.25:0,c=Math.cos(angle),s=Math.sin(angle),punch=time<this.punchUntil;
  const points=punch?[...figure,[12,-36],[16,-36],[20,-36]]:figure;
  const cells=points.map(([x,y],i)=>({id:'actor-'+i,x:this.playerX+x*c-(y+30)*s-2,y:this.floor-height-30+x*s+(y+30)*c-2,w:4,h:4}));
  const hand={x:this.playerX+12*c+6*s,y:this.floor-height-30+12*s-6*c};
  return{x:this.playerX,y:this.floor-height,height,air,angle,cells,box:bounds(cells),counterBox:{x:hand.x-16,y:hand.y-18,w:32,h:36},active:this.state==='play'&&this.time<this.counterUntil,invulnerable:time<this.invulnerableUntil};
 }
 body(time=this.time){
  const x=this.width*.72+Math.sin(time*.53)*this.width*.055,y=this.height*.28+Math.sin(time*.71)*Math.min(55,this.height*.055),angle=time*.42;
  const extension=(1-Math.cos(time*1.2))/2,pitch=23,cell=17,cells=[];
  // Four bent open arms. The central hole is deliberately empty and non-collidable.
  for(let arm=0;arm<4;arm++){const a=angle+arm*Math.PI/2,c=Math.cos(a),s=Math.sin(a);const points=[[0,-1],[1,-1],[2,-2],[2,-3]];
   for(let i=0;i<points.length;i++){const [px,py]=points[i],u=px*pitch*(1+extension*.55),v=py*pitch*(1+extension*.55);cells.push({id:'arm'+arm+'-'+i,x:x+u*c-v*s-cell/2,y:y+u*s+v*c-cell/2,w:cell,h:cell});}}
  const box=bounds(cells),sx=box.x<12?12-box.x:box.x+box.w>this.width-12?this.width-12-box.x-box.w:0,sy=box.y<24?24-box.y:box.y+box.h>this.height-24?this.height-24-box.y-box.h:0;
  return{x:x+sx,y:y+sy,cells:cells.map(q=>({...q,x:q.x+sx,y:q.y+sy})),phase:time%PERIOD,angle,extension,hurt:time<this.hurtUntil};
 }
 projectileCells(p,time=this.time){const a=time*4.1,c=Math.cos(a),s=Math.sin(a);return[[-5,-5],[5,-5],[-5,5],[5,5]].map(([x,y],i)=>({id:p.id+'-'+i,x:p.x+x*c-y*s-4,y:p.y+x*s+y*c-4,w:8,h:8}));}
 arrival(p){if(p.side!=='incoming')return null;const x=this.playerX+12,y=this.floor-36,dx=x-p.x,dy=y-p.y,speed2=p.vx*p.vx+p.vy*p.vy,eta=(dx*p.vx+dy*p.vy)/speed2;if(eta<-.12)return null;const miss=Math.hypot(dx-p.vx*eta,dy-p.vy*eta);return miss<45?eta:null;}
 inputDown(){
  if(this.state!=='play'||this.held||this.blockUntilUp)return false;this.held=true;if(this.time+EPS<this.cooldownUntil)return false;
  const nearby=this.projectiles.some(p=>p.color==='black'&&this.arrival(p)!==null&&this.arrival(p)<=.45);
  if(!nearby&&this.actor().air)return false;this.inputs++;this.cooldownUntil=this.time+.65;
  if(nearby){this.counterUntil=this.time+.24;this.punchUntil=this.time+.24;this.emit('input',{kind:'return'});}
  else{this.jumpStart=this.time;this.emit('jump');}return true;
 }
 inputUp(){this.held=false;this.blockUntilUp=false;}
 pause(){if(!['play','ending'].includes(this.state))return false;this.resumeState=this.state;this.state='pause';this.blockUntilUp=this.held;this.held=false;return true;}
 resume(){if(this.state!=='pause')return false;this.state=this.resumeState;this.resumeState=null;return true;}
 spawn(){const b=this.body(),target={x:this.playerX+12,y:this.floor-36},base=Math.atan2(target.y-b.y,target.x-b.x),speed=clamp(Math.hypot(target.x-b.x,target.y-b.y)/1.8,280,850),mainColor=this.volley%3===1?'blue':'black';
  for(let i=0;i<8;i++){const a=base+i*Math.PI/4,raySpeed=i===0?speed:Math.min(220,Math.min(this.width,this.height)*.32),p={id:++this.sequence,color:i===0?mainColor:i%3===1?'blue':'black',side:'incoming',x:b.x+Math.cos(a)*80,y:b.y+Math.sin(a)*80,vx:Math.cos(a)*raySpeed,vy:Math.sin(a)*raySpeed,trail:[]};this.projectiles.push(p);}
  this.emit('spawn',{volley:this.volley,color:mainColor});this.volley++;this.nextSpawn+=PERIOD;
 }
 reflect(p){const speed=650,center=this.body(),flight=Math.hypot(center.x-p.x,center.y-p.y)/speed,target=this.body(this.time+flight).cells[0],dx=target.x+target.w/2-p.x,dy=target.y+target.h/2-p.y,d=Math.hypot(dx,dy);p.vx=dx/d*speed;p.vy=dy/d*speed;p.side='returned';p.returnedAt=this.time;this.counterUntil=-1;this.returns++;this.emit('return',{id:p.id});}
 advance(dt){if(!Number.isFinite(dt)||dt<0||dt>30)throw Error('Invalid duration');if(!['play','ending'].includes(this.state))return;this.accumulator+=dt;while(this.accumulator+EPS>=STEP&&['play','ending'].includes(this.state)){this.step();this.accumulator=Math.max(0,this.accumulator-STEP);}}
 step(){
  if(this.state==='ending'){this.endingTime+=STEP;if(this.endingTime+EPS>=5){this.state='result';this.emit('result');}return;}
  if(this.time+EPS>=this.nextSpawn)this.spawn();const a=this.actor(),an=this.actor(this.time+STEP),b=this.body(),bn=this.body(this.time+STEP),priorBody=new Map(b.cells.map(q=>[q.id,q]));
  for(const p of this.projectiles){const old={...p},pc=this.projectileCells(old);p.x+=p.vx*STEP;p.y+=p.vy*STEP;const nc=this.projectileCells(p,this.time+STEP);if(Math.floor(this.time*20)!==Math.floor((this.time+STEP)*20)){p.trail.push({x:p.x,y:p.y});if(p.trail.length>8)p.trail.shift();}
   if(p.side==='incoming'){
    const counter=p.color==='black'&&this.time<this.counterUntil&&pc.some((q,i)=>sweep(a.counterBox,q,an.counterBox,nc[i]));
    if(counter){this.reflect(p);continue;}
    let hit=false;for(let j=0;j<a.cells.length&&!hit;j++)hit=pc.some((q,i)=>sweep(a.cells[j],q,an.cells[j]||an.cells.at(-1),nc[i]));
    if(hit){p.remove=true;if(this.time>=this.invulnerableUntil){this.lives--;this.hits++;this.invulnerableUntil=this.time+.85;this.emit('human-hit',{color:p.color,lives:this.lives});if(!this.lives){this.state='fail';this.held=false;this.emit('failure');break;}}}
   }else{
    const contact=bn.cells.find(cell=>pc.some((q,i)=>sweep(priorBody.get(cell.id),q,cell,nc[i])));
    if(contact){p.remove=true;this.hp--;this.successes++;this.hurtUntil=this.time+.35;this.emit('boss-damage',{id:p.id,cell:contact.id,hp:this.hp,returnedAt:p.returnedAt});if(!this.hp){this.state='ending';this.held=false;this.emit('victory');break;}}
   }
   if(p.x< -100||p.x>this.width+100||p.y< -100||p.y>this.height+100)p.remove=true;
  }
  this.projectiles=this.projectiles.filter(p=>!p.remove);this.time+=STEP;
 }
 cue(){const q=this.projectiles.map(p=>({p,eta:this.arrival(p)})).filter(q=>q.eta!==null).sort((a,b)=>a.eta-b.eta)[0];const ready=this.state==='play'&&this.time+EPS>=this.cooldownUntil&&!!q&&q.eta<=(q.p.color==='blue'?.7:.36)&&(q.p.color==='black'||!this.actor().air);return{id:q?String(q.p.id):'waiting-'+this.volley,ready,color:q?.p.color||null,timeToContact:q?.eta??null,text:q?.p.color==='black'?'검은 사각 받아치기':'파란 사각 넘기'};}
 snapshot(){return{state:this.state,time:this.time,width:this.width,height:this.height,hp:this.hp,lives:this.lives,hits:this.hits,successes:this.successes,inputs:this.inputs,returns:this.returns,policy:this.policy,actor:this.actor(),body:this.body(),projectiles:this.projectiles.map(p=>({...p,trail:p.trail.map(q=>({...q})),cells:this.projectileCells(p)})),cue:this.cue(),endingTime:this.endingTime,events:this.events.map(e=>({...e}))};}
}
root.MongyuOrbitEncounter={OrbitRun,STEP,PERIOD};if(typeof module!=='undefined')module.exports=root.MongyuOrbitEncounter;
})(typeof globalThis!=='undefined'?globalThis:this);
