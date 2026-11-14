/* R50 isolated mechanics experiment. Authored values, not recovered NOM3 rules. */
(function(root){'use strict';
const STEP=1/120,EPS=1e-6,COLORS=['#fff','#eaff1b','#ff9418','#8cff21','#26c8ff'];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function sweepRect(x,y,dx,dy,rect,radius=0){
 const q={left:rect.x-radius,right:rect.x+rect.w+radius,top:rect.y-radius,bottom:rect.y+rect.h+radius};
 if(x>q.left+EPS&&x<q.right-EPS&&y>q.top+EPS&&y<q.bottom-EPS){
  const sides=[{d:x-q.left,nx:-1,ny:0},{d:q.right-x,nx:1,ny:0},{d:y-q.top,nx:0,ny:-1},{d:q.bottom-y,nx:0,ny:1}].sort((a,b)=>a.d-b.d);
  return {t:0,nx:sides[0].nx,ny:sides[0].ny,inside:true};
 }
 let entry=-Infinity,exit=Infinity,nx=0,ny=0;
 for(const [pos,delta,lo,hi,ax,ay]of [[x,dx,q.left,q.right,1,0],[y,dy,q.top,q.bottom,0,1]]){
  if(Math.abs(delta)<EPS){if(pos<lo||pos>hi)return null;continue}
  let a=(lo-pos)/delta,b=(hi-pos)/delta,sign=-1;if(a>b){[a,b]=[b,a];sign=1}
  if(a>entry){entry=a;nx=ax?sign:0;ny=ay?sign:0}exit=Math.min(exit,b);if(entry>exit)return null;
 }
 if(entry< -EPS||entry>1+EPS||exit<0)return null;
 return {t:clamp(entry,0,1),nx,ny,inside:false};
}
function reflect(vx,vy,nx,ny){const dot=vx*nx+vy*ny;return {vx:vx-2*dot*nx,vy:vy-2*dot*ny}}
function cells(){const rows=['  # #  ',' ######','# # # #','#     #','#######',' # # # ','## # ##'];const out=[];
 rows.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='#')out.push({x:330+i*28,y:765+j*28,w:22,h:22})}));return out;
}
class Experiment{
 constructor(options={}){this.hypothesis=options.hypothesis||'human';this.scenario=options.scenario||'air';if(!['human','pair'].includes(this.hypothesis))throw Error('Unknown hypothesis');this.reset()}
 reset(){this.time=0;this.accumulator=0;this.paused=true;this.held=false;this.jumpStart=-Infinity;this.inputCount=0;this.returnCount=0;this.playerHits=0;this.bossContacts=0;this.wallBounces=0;this.fallbacks=0;this.droppedSeconds=0;this.events=[];this.bounds={left:24,top:24,right:546,bottom:955};this.bossCells=cells();this.projectiles=[];this.nextId=1;this.seedCase();return this}
 seedCase(){const x=115,floor=955;
  if(this.scenario==='air')this.add({x:x+120,y:floor-130,vx:-180,vy:0,color:COLORS[0]});
  else if(this.scenario==='dog')this.add({x:x+180,y:floor-12,vx:-220,vy:0,color:COLORS[3]});
  else if(this.scenario==='left')this.add({x:x-65,y:floor-130,vx:180,vy:0,color:COLORS[1]});
  else throw Error('Unknown experiment scenario');
 }
 add(v){if(this.projectiles.length>=32)throw Error('Projectile cap');const p={id:this.nextId++,radius:8,side:'hostile',life:12,trail:[],...v};if(!['x','y','vx','vy','radius','life'].every(k=>Number.isFinite(p[k]))||p.radius<=0||p.radius>32||p.life<=0||p.life>60||Math.hypot(p.vx,p.vy)>20000)throw Error('Invalid projectile');this.projectiles.push(p);return p}
 bodies(time=this.time){const age=time-this.jumpStart,air=age>=0&&age<1.1,height=air?112*Math.sin(Math.PI*age/1.1):0;
  return {air,height,human:{x:102,y:955-height-60,w:26,h:60},dog:{x:109,y:931,w:36,h:24}};
 }
 inputDown(){if(this.paused||this.held)return false;this.held=true;if(this.bodies().air)return false;this.jumpStart=this.time;this.inputCount++;this.record('jump');return true}
 inputUp(){this.held=false}
 pause(){this.paused=true;this.held=false}
 resume(){this.paused=false;this.held=false}
 record(type,data={}){this.events.push({type,time:this.time,...data});if(this.events.length>200)this.events.shift()}
 advance(dt){if(!Number.isFinite(dt)||dt<0||dt>30)throw Error('Invalid duration');if(this.paused)return;this.accumulator+=dt;while(this.accumulator+1e-10>=STEP){this.step(STEP);this.accumulator=Math.max(0,this.accumulator-STEP)}}
 hostFrame(dt){if(!Number.isFinite(dt)||dt<0)throw Error('Invalid duration');if(this.paused)return;const used=Math.min(dt,.1);this.droppedSeconds+=Math.max(0,dt-used);this.advance(used)}
 step(dt){
  const start=this.bodies(this.time),end=this.bodies(this.time+dt),vy=(end.human.y-start.human.y)/dt;
  for(const p of this.projectiles){p.trail.push({x:p.x,y:p.y});if(p.trail.length>12)p.trail.shift();this.move(p,dt,start,vy);p.life-=dt;}
  this.projectiles=this.projectiles.filter(p=>!p.removed&&p.life>0);this.time+=dt;
 }
 move(p,dt,start,humanVy){let remaining=dt,spent=0,iterations=0;
  while(remaining>1e-9&&!p.removed&&iterations++<12){
   const candidates=[],add=(h,kind,target)=>{if(h)candidates.push({...h,kind,target})};
   const bound=this.bounds;
   for(const [position,velocity,limit,nx,ny]of [[p.x,p.vx,bound.left+p.radius,1,0],[p.x,p.vx,bound.right-p.radius,-1,0],[p.y,p.vy,bound.top+p.radius,0,1],[p.y,p.vy,bound.bottom-p.radius,0,-1]]){
    if(velocity* (nx||ny)>=0)continue;const t=(limit-position)/(velocity*remaining);if(t>=-EPS&&t<=1+EPS)add({t:clamp(t,0,1),nx,ny},'wall');
   }
   if(p.side==='hostile'){
    const human={...start.human,y:start.human.y+humanVy*spent};add(sweepRect(p.x,p.y,p.vx*remaining,(p.vy-humanVy)*remaining,human,p.radius),'human',{vy:humanVy});
    if(this.hypothesis==='pair')add(sweepRect(p.x,p.y,p.vx*remaining,p.vy*remaining,start.dog,p.radius),'dog',{vy:0});
   }else for(const cell of this.bossCells)add(sweepRect(p.x,p.y,p.vx*remaining,p.vy*remaining,cell,p.radius),'boss');
   candidates.sort((a,b)=>a.t-b.t||(['wall','human','dog','boss'].indexOf(a.kind)-['wall','human','dog','boss'].indexOf(b.kind)));
   const hit=candidates[0];if(!hit){p.x+=p.vx*remaining;p.y+=p.vy*remaining;break}
   const used=hit.t*remaining;p.x+=p.vx*used;p.y+=p.vy*used;spent+=used;remaining-=used;
   if(hit.kind==='boss'){p.removed=true;this.bossContacts++;this.record('boss-contact',{projectile:p.id,x:p.x,y:p.y,contactTime:this.time+spent});break}
   if(hit.kind==='wall'){Object.assign(p,reflect(p.vx,p.vy,hit.nx,hit.ny));this.wallBounces++;this.record('wall',{projectile:p.id,x:p.x,y:p.y,contactTime:this.time+spent});}
   else{
    const air=this.bodies(this.time+spent).height>1;
    if(!air){p.removed=true;this.playerHits++;this.record('body-hit',{projectile:p.id,actor:hit.kind,x:p.x,y:p.y,contactTime:this.time+spent});break}
    const targetVy=hit.target.vy,speed=Math.min(1400,Math.max(240,Math.hypot(p.vx,p.vy)*3)),v=reflect(p.vx,p.vy-targetVy,hit.nx,hit.ny);v.vy+=targetVy;
    const length=Math.hypot(v.vx,v.vy)||1;p.vx=v.vx/length*speed;p.vy=v.vy/length*speed;p.side='returned';this.returnCount++;this.record('return',{projectile:p.id,actor:hit.kind,x:p.x,y:p.y,vx:p.vx,vy:p.vy,contactTime:this.time+spent});
   }
   p.x+=hit.nx*EPS*4;p.y+=hit.ny*EPS*4;
  }
  if(iterations>12&&!p.removed){this.fallbacks++;p.removed=true;this.record('iteration-limit',{projectile:p.id})}
 }
 snapshot(){return {time:this.time,paused:this.paused,hypothesis:this.hypothesis,scenario:this.scenario,bodies:this.bodies(),bounds:{...this.bounds},bossCells:this.bossCells.map(x=>({...x})),projectiles:this.projectiles.map(p=>({...p,trail:p.trail.map(q=>({...q}))})),inputs:this.inputCount,returns:this.returnCount,playerHits:this.playerHits,bossContacts:this.bossContacts,wallBounces:this.wallBounces,fallbacks:this.fallbacks,droppedSeconds:this.droppedSeconds,events:this.events.map(x=>({...x}))}}
}
const api={Experiment,sweepRect,reflect,STEP};root.MongyuProjectileLab=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
