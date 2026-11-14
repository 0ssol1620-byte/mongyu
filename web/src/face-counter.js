/* Source-informed boss38 candidate. Input/timing/color policy are authored. */
(function(root){'use strict';
const STEP=1/240,EPS=1e-7,FLOOR=575,PLAYER_X=115;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function sweep(x,y,dx,dy,r,half=0){
 const lo=[r.x-half,r.y-half],hi=[r.x+r.w+half,r.y+r.h+half],pos=[x,y],delta=[dx,dy];let enter=-Infinity,exit=Infinity,nx=0,ny=0;
 if(x>lo[0]+EPS&&x<hi[0]-EPS&&y>lo[1]+EPS&&y<hi[1]-EPS){const d=[x-lo[0],hi[0]-x,y-lo[1],hi[1]-y],i=d.indexOf(Math.min(...d));return{t:0,nx:i===0?-1:i===1?1:0,ny:i===2?-1:i===3?1:0};}
 for(let i=0;i<2;i++){if(Math.abs(delta[i])<EPS){if(pos[i]<lo[i]||pos[i]>hi[i])return null;continue;}let a=(lo[i]-pos[i])/delta[i],b=(hi[i]-pos[i])/delta[i],n=-1;if(a>b){[a,b]=[b,a];n=1;}if(a>enter){enter=a;nx=i===0?n:0;ny=i===1?n:0;}exit=Math.min(exit,b);if(enter>exit)return null;}
 return enter>=-EPS&&enter<=1+EPS&&exit>=0?{t:clamp(enter,0,1),nx,ny}:null;
}
function offsets(angle){const c=Math.cos(angle),s=Math.sin(angle);return[[-10,-10],[10,-10],[-10,10],[10,10]].map(([x,y])=>({x:x*c-y*s,y:x*s+y*c}));}
function faceCells(){const points=[[22,2],[21,2],[20,3],[20,4],[19,5],[19,6],[19,7],[19,8],[19,9],[19,10],[18,11],[18,12],[17,13],[17,14],[18,14],[19,15],[19,16],[19,17],[20,18],[19,19],[19,20],[19,21],[20,22],[21,22],[22,21],[23,20],[21,8],[21,9]];return points.map(([x,y])=>({x:24+x*21,y:24+y*23,w:18,h:18}));}
class FaceCounter{
 constructor(options={}){this.width=options.width||570;this.height=options.height||620;this.reset();}
 setupArena(){this.floor=this.height-45;this.playerX=115+(this.width-570)*.2;this.spawnX=this.width-100;this.flightScale=(this.spawnX-this.playerX)/355;this.bounds={left:24,top:24,right:this.width-24,bottom:this.floor};this.cells=faceCells().map(r=>({...r,x:r.x+this.width-570,y:r.y>=346?r.y+this.height-620:24+(r.y-24)*(this.height-298)/322}));
  const extra=[];for(let i=1;i<26;i++){const a=this.cells[i-1],b=this.cells[i];if(a.x!==b.x)continue;const n=Math.max(1,Math.floor(Math.abs(a.y-b.y)/22));for(let j=1;j<n;j++)extra.push({...a,y:a.y+(b.y-a.y)*j/n});}this.cells.push(...extra);}
 reframe(width,height){if(!Number.isFinite(width)||!Number.isFinite(height)||width<570||width>1100||height<540||height>1000||this.projectiles.length||this.actor().air||this.actor().dogHeight>0)return false;this.width=width;this.height=height;this.setupArena();return true;}
 reset(){this.setupArena();this.state='title';this.resumeState=null;this.time=0;this.accumulator=0;this.held=false;this.hp=6;this.maxHp=6;this.lives=3;this.hits=0;this.returns=0;this.bossHits=0;this.inputs=0;this.jumps=[];this.punchStart=-Infinity;this.lastInput=-Infinity;this.invulnerableUntil=0;this.hurtUntil=0;this.nextWhite=.8;this.nextBlack=2.6;this.projectiles=[];this.nextId=1;this.events=[];this.fallbacks=0;this.droppedSeconds=0;this.releaseAge=0;this.wonAt=null;return this;}
 start(){this.reset();this.state='play';this.record('start');}
 record(type,data={}){this.events.push({type,time:this.time,...data});if(this.events.length>300)this.events.shift();}
 actor(time=this.time){const recent=this.jumps.findLast(t=>t<=time),age=recent===undefined?Infinity:time-recent,h=age>=0&&age<1.7?112*Math.sin(Math.PI*age/1.7):0;const dogJump=this.jumps.findLast(t=>t+.42<=time),dogAge=dogJump===undefined?Infinity:time-dogJump-.42,dogHeight=dogAge>=0&&dogAge<1.7?67*Math.sin(Math.PI*dogAge/1.7):0;const punchAge=time-this.punchStart,active=punchAge>=.06&&punchAge<.44;
  return{height:h,air:age<1.7,punchAge,punchActive:active,human:{x:this.playerX-8,y:this.floor-h-60,w:16,h:60},arm:{x:this.playerX+3,y:this.floor-h-55,w:45,h:20},dog:{x:this.playerX-15,y:this.floor-dogHeight-24,w:34,h:24},dogHeight};}
 nearest(kind){return this.projectiles.filter(p=>p.side==='hostile'&&p.kind===kind&&(kind==='black'?(p.x-this.playerX)*p.vx<0:p.vx<0&&p.x>=this.playerX-20)).sort((a,b)=>Math.abs(a.x-this.playerX)-Math.abs(b.x-this.playerX))[0]||null;}
 inputDown(){if(this.state!=='play'||this.held)return false;this.held=true;if(this.time-this.lastInput<.18||this.actor().air||this.time-this.punchStart<.48)return false;this.lastInput=this.time;this.inputs++;const p=this.nearest('white');if(p&&p.x-this.playerX<67+Math.abs(p.vx)*.5&&Math.abs(p.y-(this.floor-48))<55){this.punchStart=this.time;this.record('punch');return true;}this.jumps.push(this.time);if(this.jumps.length>8)this.jumps.shift();this.record('jump');return true;}
 inputUp(){this.held=false;}
 pause(){if(!['play','release'].includes(this.state))return false;this.resumeState=this.state;this.state='pause';this.held=false;return true;}
 resume(){if(this.state!=='pause')return false;this.state=this.resumeState;this.resumeState=null;this.held=false;return true;}
 add(values){if(this.projectiles.length>=20)throw Error('Projectile cap');const p={id:this.nextId++,x:this.spawnX,y:this.floor-106,vx:-165*this.flightScale,vy:28,kind:'white',side:'hostile',bounces:0,angle:0,spin:2.4,half:6,life:12,...values};if(!['x','y','vx','vy','angle','spin','half','life'].every(k=>Number.isFinite(p[k]))||Math.hypot(p.vx,p.vy)>1000||Math.abs(p.spin)>12||p.half<=0||p.half>12||p.life<=0||p.life>20||!['white','black'].includes(p.kind)||!['hostile','returned'].includes(p.side))throw Error('Invalid projectile');this.projectiles.push(p);return p;}
 hostFrame(dt){if(!Number.isFinite(dt)||dt<0)throw Error('Invalid duration');if(!['play','release'].includes(this.state))return;this.droppedSeconds+=Math.max(0,dt-.1);this.advance(Math.min(dt,.1));}
 advance(dt){if(!Number.isFinite(dt)||dt<0||dt>30)throw Error('Invalid duration');if(!['play','release'].includes(this.state))return;this.accumulator+=dt;while(this.accumulator+1e-10>=STEP&&['play','release'].includes(this.state)){this.step(STEP);this.accumulator=Math.max(0,this.accumulator-STEP);}}
 step(dt){
  if(this.state==='release'){this.releaseAge+=dt;if(this.releaseAge>=.08)this.projectiles=[];if(this.releaseAge>=3.2){this.state='result';this.record('result');}return;}
  while(this.time+EPS>=this.nextWhite){this.add({kind:'white'});this.record('spawn',{kind:'white'});this.nextWhite+=4.2;}
  while(this.time+EPS>=this.nextBlack){this.add({kind:'black',y:this.floor-17,vx:-200*this.flightScale,vy:0,life:2.4});this.record('spawn',{kind:'black'});this.nextBlack+=4.2;}
  const before=this.actor(),after=this.actor(this.time+dt),bodyVy=(after.human.y-before.human.y)/dt;
  for(const p of this.projectiles){if(this.state!=='play')break;p.angle+=dt*p.spin;this.move(p,dt,before,bodyVy);p.life-=dt;}
  this.projectiles=this.projectiles.filter(p=>!p.done&&p.life>0);this.time+=dt;
 }
 move(p,dt,actor,bodyVy){let remaining=dt,spent=0,iterations=0;const cells=offsets(p.angle);const extent=Math.max(...cells.flatMap(q=>[Math.abs(q.x),Math.abs(q.y)]))+p.half;p.x=clamp(p.x,this.bounds.left+extent,this.bounds.right-extent);p.y=clamp(p.y,this.bounds.top+extent,this.bounds.bottom-extent);
  while(remaining>1e-9&&!p.done&&this.state==='play'&&iterations++<10){const candidates=[];const add=(h,kind,extra={})=>{if(h)candidates.push({...h,kind,...extra});};
   for(const [pos,vel,edge,nx,ny]of [[p.x,p.vx,this.bounds.left+extent,1,0],[p.x,p.vx,this.bounds.right-extent,-1,0],[p.y,p.vy,this.bounds.top+extent,0,1],[p.y,p.vy,this.bounds.bottom-extent,0,-1]]){if(vel*(nx||ny)>=0)continue;const t=(edge-pos)/(vel*remaining);if(t>=-EPS&&t<=1+EPS)add({t:clamp(t,0,1),nx,ny},'wall');}
   for(const q of cells){const x=p.x+q.x,y=p.y+q.y;
    if(p.side==='returned'){for(const r of this.cells)add(sweep(x,y,p.vx*remaining,p.vy*remaining,r,p.half),'boss');}
    else{const body={...actor.human,y:actor.human.y+bodyVy*spent},arm={...actor.arm,y:actor.arm.y+bodyVy*spent};
     const h=sweep(x,y,p.vx*remaining,(p.vy-bodyVy)*remaining,arm,p.half);if(h&&p.kind==='white'&&this.actor(this.time+spent+h.t*remaining).punchActive)add(h,'punch');
     add(sweep(x,y,p.vx*remaining,(p.vy-bodyVy)*remaining,body,p.half),'body');}
   }
   candidates.sort((a,b)=>a.t-b.t||(['punch','boss','wall','body'].indexOf(a.kind)-['punch','boss','wall','body'].indexOf(b.kind)));
   const hit=candidates[0];if(!hit){p.x+=p.vx*remaining;p.y+=p.vy*remaining;break;}const used=hit.t*remaining;p.x+=p.vx*used;p.y+=p.vy*used;spent+=used;remaining-=used;const contactTime=this.time+spent;
   if(hit.kind==='punch'){const speed=Math.hypot(p.vx,p.vy)||1;p.vx=-p.vx/speed*480;p.vy=-p.vy/speed*480;p.side='returned';this.returns++;this.record('return',{projectile:p.id,contactTime,x:p.x,y:p.y});}
   else if(hit.kind==='boss'){p.done=true;this.hp=Math.max(0,this.hp-1);this.bossHits++;this.hurtUntil=this.time+.18;this.record('boss-hit',{projectile:p.id,contactTime,x:p.x,y:p.y,hp:this.hp});if(this.hp===0){this.wonAt=this.time+spent;this.state='release';this.releaseAge=0;this.held=false;this.record('victory',{contactTime});}break;}
   else if(hit.kind==='body'){p.done=true;if(this.time>=this.invulnerableUntil){this.lives--;this.hits++;this.invulnerableUntil=this.time+.9;this.record('body-hit',{kind:p.kind,contactTime});if(this.lives===0){this.state='fail';this.held=false;this.record('failure');}}break;}
   else{p.bounces++;if(hit.nx)p.vx=-p.vx;if(hit.ny)p.vy=-p.vy;this.record('wall',{projectile:p.id,contactTime});}
   p.x+=hit.nx*EPS*8;p.y+=hit.ny*EPS*8;
  }
  if(iterations>10&&!p.done){p.done=true;this.fallbacks++;this.record('iteration-limit',{projectile:p.id});}
 }
 cue(){const w=this.nearest('white'),b=this.nearest('black');if(this.state!=='play')return{verb:'wait',kind:null,ready:false};if(this.actor().air||this.time-this.punchStart<.48)return{verb:'wait',kind:null,ready:false};const white=w&&w.x-this.playerX<=67+Math.abs(w.vx)*.35&&w.x>this.playerX+30,black=b&&Math.abs(b.x-this.playerX)<=Math.abs(b.vx)*.75;if(white)return{verb:'punch',kind:'white',ready:true,id:w.id};if(black)return{verb:'jump',kind:'black',ready:true,id:b.id+'-'+b.bounces};return{verb:'wait',kind:null,ready:false};}
 snapshot(){return{state:this.state,time:this.time,hp:this.hp,maxHp:this.maxHp,lives:this.lives,hits:this.hits,returns:this.returns,bossHits:this.bossHits,inputs:this.inputs,releaseAge:this.releaseAge,wonAt:this.wonAt,hurt:this.time<this.hurtUntil,invulnerable:this.time<this.invulnerableUntil,actor:this.actor(),cells:this.cells.map(r=>({...r})),projectiles:this.projectiles.map(p=>({...p,cells:offsets(p.angle).map(q=>({x:p.x+q.x-p.half,y:p.y+q.y-p.half,w:p.half*2,h:p.half*2}))})),cue:this.cue(),fallbacks:this.fallbacks,droppedSeconds:this.droppedSeconds,events:this.events.map(e=>({...e}))};}
}
const api={FaceCounter,sweep,offsets,faceCells,STEP};root.MongyuFaceCounter=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
