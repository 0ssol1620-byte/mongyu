/* R37: independent four-wall dream run. World coordinates are centred, +y down. */
(function(root){'use strict';
const JUMP_SECONDS=.82,JUMP_HEIGHT=57,PLAYER_RADIUS=8,PLAYER_BODY_HEIGHT=60,BEAM_BOTTOM=PLAYER_BODY_HEIGHT+8,BEAM_TOP=BEAM_BOTTOM+56,STEP=1/240;
const FACE_NAMES=['아래 벽','오른쪽 벽','위 벽','왼쪽 벽'];
const ROOM_DATA=[
 ['fold-1','접히는 사각','fold',480,480,104,'네 벽을 따라 · 붉은 이빨 앞에서 점프'],
 ['fold-2','늘어나는 문','fold',600,390,106,'낮은 천장 아래에서는 달리기'],
 ['tide-1','안으로 흐르는 물결','tide',450,620,108,'물결 이빨을 넘어 반대 벽으로'],
 ['tide-2','겹쳐진 파동','tide',560,480,112,'두 이빨은 한 번의 긴 궤적으로'],
 ['prism-1','갈라지는 프리즘','prism',630,410,114,'높은 이빨과 낮은 천장을 구별하기'],
 ['prism-2','네 벽의 심장','prism',540,540,116,'네 봉인을 넘어 심장을 열기']
];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function shape(width,height,radius=72){
 const arc=Math.PI*radius/2, lengths=[width-2*radius+arc,height-2*radius+arc,width-2*radius+arc,height-2*radius+arc];
 let start=0;const faces=lengths.map((length,index)=>{const f={index,name:FACE_NAMES[index],start,length,straight:length-arc};start+=length;return f});
 return {width,height,radius,perimeter:start,faces};
}
const ROOMS=Object.freeze(ROOM_DATA.map((a,index)=>Object.freeze({id:a[0],index,title:a[1],motif:a[2],...shape(a[3],a[4]),speed:a[5],cue:a[6]})));
/** Continuous true arc-length mapping: bottom -> right -> top -> left. */
function poseAt(room,d,height=0){
 const {width:w,height:h,radius:r,perimeter:p}=room;
 d=((d%p)+p)%p;
 const f=room.faces.find(v=>d<v.start+v.length-1e-9)||room.faces[3],u=d-f.start;
 const starts=[[-w/2+r,h/2],[w/2,h/2-r],[w/2-r,-h/2],[-w/2,-h/2+r]];
 const tangents=[[1,0],[0,-1],[-1,0],[0,1]];
 let x,y,tx,ty,turning=u>f.straight,turnProgress=0;
 if(!turning){[tx,ty]=tangents[f.index];x=starts[f.index][0]+tx*u;y=starts[f.index][1]+ty*u}
 else {
  const theta=(u-f.straight)/r,angle=Math.PI/2-f.index*Math.PI/2-theta;
  const centers=[[w/2-r,h/2-r],[w/2-r,-h/2+r],[-w/2+r,-h/2+r],[-w/2+r,h/2-r]];
  x=centers[f.index][0]+r*Math.cos(angle);y=centers[f.index][1]+r*Math.sin(angle);tx=Math.sin(angle);ty=-Math.cos(angle);turnProgress=theta/(Math.PI/2);
 }
 const inward={x:ty,y:-tx};return {x:x+inward.x*height,y:y+inward.y*height,baseX:x,baseY:y,tangent:{x:tx,y:ty},inward,angle:Math.atan2(ty,tx),face:f.index,height,turning,turnProgress};
}
function roomHazards(room){
 const list=[];
 function add(face,u,type,width=18,clearance=24){const f=room.faces[face];list.push({id:room.id+'-'+list.length,type,d:f.start+u*f.straight,width,clearance,height:type==='beam'?BEAM_TOP:clearance,face,done:false,hit:false,centerHeight:0})}
 for(let face=0;face<4;face++){
  const type=room.index===5?'seal':room.index===3?'pair':room.index>=2?'pulse':'spike';
  add(face,room.index===5&&face===0?.60:.36,type,type==='pair'?30:type==='seal'?28:18,type==='seal'?28:type==='pulse'?29:24);
  if(room.index>0&&face<3)add(face,room.index===5&&face===0?.18:.78,(room.index+face)%2?'beam':'spike',18,(room.index+face)%2?7:24);
 }
 // Portal is a physical inward leap on the final face, clear of the corner arc.
 const d=room.perimeter-170;
 list.push({id:room.id+'-portal',type:'portal',d,width:22,clearance:20,height:20,face:3,done:false,hit:false,centerHeight:0});
 return list.sort((a,b)=>a.d-b.d);
}
function normalizeSave(v){
 const s={schema:1,bestScore:0,bestTime:0,clears:0,furthestRoom:0};
 if(!v||v.schema!==1)return s;
 for(const k of ['bestScore','clears'])if(Number.isSafeInteger(v[k]))s[k]=clamp(v[k],0,1000000);
 if(Number.isFinite(v.bestTime))s.bestTime=clamp(v.bestTime,0,36000);
 if(Number.isInteger(v.furthestRoom))s.furthestRoom=clamp(v.furthestRoom,0,5);
 return s;
}
class SquareRun {
 constructor(options={}){this.save=normalizeSave(options.save);this.mode='square-dream';this.events=[];this.state='title';this.reset();this.state='title'}
 reset(){this.roomIndex=0;this.time=0;this.score=0;this.hearts=3;this.combo=0;this.bestCombo=0;this.passed=0;this.hits=0;this.jumps=0;this.perfect=0;this.retries=0;this.result=null;this.feedback=null;this.transition=null;this.pausedFrom=null;this.loadRoom(0);this.events=[]}
 loadRoom(index){this.roomIndex=index;this.room=ROOMS[index];this.worldShape=shape(this.room.width,this.room.height);this.fold=null;this.distance=0;this.jumpElapsed=-1;this.hazards=roomHazards(this.room);this.portalOpen=false;this.boss=index===5?{hp:4,maxHp:4,phase:1}:null;this.lastFace=0;this.checkpoint={score:this.score,passed:this.passed,perfect:this.perfect,bestCombo:this.bestCombo};this.feedback={kind:'room',text:this.room.cue,remaining:3};}
 start(){this.reset();this.state='play';this.events.push('start');return true}
 title(){this.state='title';this.jumpElapsed=-1;this.events=[];this.feedback=null;return true}
 action(){if(this.state!=='play'||this.jumpElapsed>=0||this.fold)return false;this.jumpElapsed=0;this.jumps++;this.events.push('jump');return true}
 pause(){if(!['play','transition'].includes(this.state))return false;this.pausedFrom=this.state;this.state='pause';this.events.push('pause');return true}
 resume(){if(this.state!=='pause')return false;this.state=this.pausedFrom||'play';this.pausedFrom=null;this.events.push('resume');return true}
 retry(){if(!['fail','play','pause','transition'].includes(this.state))return false;this.retries++;this.hearts=3;this.combo=0;Object.assign(this,this.checkpoint);this.loadRoom(this.roomIndex);this.transition=null;this.pausedFrom=null;this.result=null;this.state='play';this.events.push('retry');return true}
 height(){return this.jumpElapsed>=0?JUMP_HEIGHT*Math.sin(Math.PI*clamp(this.jumpElapsed/JUMP_SECONDS,0,1)):0}
 drainEvents(){return this.events.splice(0)}
 exportSave(){return {...this.save}}
 update(dt){return this.tick(dt)}
 tick(dt){
  if(!Number.isFinite(dt)||dt<=0||!['play','transition'].includes(this.state))return;
  // Large host-frame gaps are suspended time, not invisible movement/hits.
  let remaining=Math.min(dt,.25);
  while(remaining>1e-10&&['play','transition'].includes(this.state)){const step=Math.min(STEP,remaining);this.step(step);remaining-=step}
 }
 step(dt){
  this.time+=dt;
  if(this.feedback){this.feedback.remaining=Math.max(0,this.feedback.remaining-dt);if(!this.feedback.remaining)this.feedback=null}
  if(this.state==='transition'){
   this.transition.elapsed+=dt;this.transition.progress=clamp(this.transition.elapsed/this.transition.duration,0,1);
   const t=this.transition.progress*this.transition.progress*(3-2*this.transition.progress),a=this.transition.from,b=this.transition.to;this.worldShape=shape(a.width+(b.width-a.width)*t,a.height+(b.height-a.height)*t);
   if(this.transition.progress>=1){const next=this.roomIndex+1;this.loadRoom(next);this.transition=null;this.state='play';this.events.push('room-start')}
   return;
  }
  if(this.fold){
   this.fold.elapsed+=dt;this.fold.progress=clamp(this.fold.elapsed/this.fold.duration,0,1);const t=this.fold.progress*this.fold.progress*(3-2*this.fold.progress),a=this.fold.from,b=this.fold.to;this.worldShape=shape(a.width+(b.width-a.width)*t,a.height+(b.height-a.height)*t);
   if(this.fold.progress>=1)this.fold=null;return;
  }
  const before=this.distance,heightBefore=this.height();
  this.distance=Math.min(this.room.perimeter,this.distance+this.room.speed*dt);
  if(this.jumpElapsed>=0){this.jumpElapsed+=dt;if(this.jumpElapsed>=JUMP_SECONDS){this.jumpElapsed=-1;this.events.push('land')}}
  const heightAfter=this.height(),pose=poseAt(this.room,this.distance),face=pose.face;
  if(face!==this.lastFace&&this.distance<this.room.perimeter-1e-6){
   this.lastFace=face;this.events.push('corner');const scales=[[1,1],[1.16,.84],[.84,1.16],[1.12,.92]],s=scales[face];
   this.fold={elapsed:0,progress:0,duration:.32,face,from:this.worldShape,to:shape(this.room.width*s[0],this.room.height*s[1])};this.events.push('fold');
  }
  if(this.boss)this.boss.phase=Math.max(this.boss.phase,Math.min(4,face+1));
  for(const h of this.hazards){
   if(h.done)continue;
   const half=(h.width/2+PLAYER_RADIUS)/this.faceScale(h.face),left=h.d-half,right=h.d+half;
   if(before<=h.d&&this.distance>=h.d)h.centerHeight=heightAfter;
   if(this.distance>=left&&before<=right){
    const collision=h.type==='beam'?Math.max(heightBefore,heightAfter)>h.clearance+1e-7:Math.min(heightBefore,heightAfter)<h.clearance-1e-7;
    if(collision){h.hit=true;h.done=true;this.hits++;this.hearts--;this.combo=0;this.feedback={kind:'hit',text:h.type==='beam'?'천장 아래에서는 뛰지 않기':'이빨이 닿기 전에 조금 일찍 점프',remaining:1.2};this.events.push('hit');if(h.type==='portal')this.feedback.text='문턱을 뛰어넘어야 다음 방이 열립니다';if(this.hearts<=0){this.finish('fail','세 번 부딪혔습니다. 이 방부터 다시 도전하세요.');return}}
   }
   if(!h.done&&this.distance>right){
    h.done=true;this.passed++;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);
    const perfect=h.type!=='beam'&&h.centerHeight>=JUMP_HEIGHT*.92;
    if(perfect)this.perfect++;
    this.score+=h.type==='beam'?60:perfect?120:90;this.events.push('pass');if(perfect)this.events.push('perfect');
    this.feedback={kind:perfect?'perfect':'pass',text:h.type==='beam'?'낮게 통과':perfect?'정중앙 점프':'넘었다',remaining:.65};
    if(h.type==='portal'){this.portalOpen=true;this.events.push('portal');this.feedback={kind:'portal',text:this.roomIndex===5?'출구가 열렸습니다':'다음 사각으로',remaining:1.2}}
    if(h.type==='seal'&&this.boss){this.boss.hp=Math.max(0,this.boss.hp-1);this.events.push('boss-damage');this.feedback={kind:'seal',text:'봉인 '+(4-this.boss.hp)+' / 4',remaining:1}}
   }
  }
  if(this.distance>=this.room.perimeter){
   if(!this.portalOpen){this.finish('fail','마지막 벽의 사각 문턱을 뛰어넘어 주세요.');return}
   if(this.boss&&this.boss.hp>1){this.finish('fail','네 벽의 봉인 중 세 개 이상을 넘어야 합니다.');return}
   this.events.push('room-clear');this.save.furthestRoom=Math.max(this.save.furthestRoom,Math.min(5,this.roomIndex+1));
   if(this.roomIndex===5){this.finish('clear','여섯 사각을 통과했습니다.');return}
   this.transition={elapsed:0,progress:0,duration:.75,from:{...this.room,...this.worldShape},to:ROOMS[this.roomIndex+1]};this.state='transition';this.jumpElapsed=-1;
  }
 }
 faceScale(face){return this.worldShape.faces[face].length/this.room.faces[face].length}
 worldPose(d,height=0){const base=poseAt(this.room,d),f=this.room.faces[base.face],current=this.worldShape.faces[base.face],u=(((d%this.room.perimeter)+this.room.perimeter)%this.room.perimeter-f.start)/f.length;return poseAt(this.worldShape,current.start+u*current.length,height)}
 finish(state,reason){
  this.state=state;this.jumpElapsed=-1;
  const score=Math.max(0,this.score-this.retries*150),rank=state==='clear'?(this.hits===0&&this.retries===0?'S':this.retries===0?'A':'B'):null;
  this.result={mode:this.mode,state,reason,score,rank,time:this.time,hits:this.hits,jumps:this.jumps,perfect:this.perfect,passed:this.passed,bestCombo:this.bestCombo,retries:this.retries,roomsCleared:state==='clear'?6:this.roomIndex};
  if(state==='clear'){this.save.bestScore=Math.max(this.save.bestScore,score);this.save.bestTime=this.save.bestTime?Math.min(this.save.bestTime,this.time):this.time;this.save.clears=Math.min(1000000,this.save.clears+1);this.save.furthestRoom=5}
  this.events.push(state);
 }
 nextHazard(){
  const h=this.hazards.find(h=>!h.done);if(!h)return null;
  const inSeconds=(h.d-this.distance)/this.room.speed,half=(h.width/2+PLAYER_RADIUS)/this.room.speed/this.faceScale(h.face);
  const rise=JUMP_SECONDS*Math.asin(clamp(h.clearance/JUMP_HEIGHT,0,1))/Math.PI;
  return {...h,inSeconds,actionWindow:{start:inSeconds-(JUMP_SECONDS-rise-half),end:inSeconds-(rise+half)},cue:h.type==='beam'?'천장 아래 · 그대로 달리기':h.type==='portal'?'사각 문턱 · 점프':h.type==='seal'?'봉인 · 점프':h.type==='pair'?'두 이빨 · 한 번 점프':'이빨 앞에서 점프',expected:h.type!=='beam'};
 }
 status(){
  const pose=this.worldPose(this.distance,this.height());
  return {state:this.state,mode:this.mode,roomIndex:this.roomIndex,roomCount:6,roomTitle:this.room.title,motif:this.room.motif,time:this.time,score:Math.max(0,this.score-this.retries*150),best:this.save.bestScore,hearts:this.hearts,combo:this.combo,bestCombo:this.bestCombo,passed:this.passed,totalHazards:ROOMS.reduce((n,r)=>n+roomHazards(r).length,0),progress:(this.roomIndex+this.distance/this.room.perimeter)/6,roomProgress:this.distance/this.room.perimeter,face:pose.face,faceName:FACE_NAMES[pose.face],jumping:this.jumpElapsed>=0,height:this.height(),nextHazard:this.nextHazard(),feedback:this.feedback?{...this.feedback}:null,boss:this.boss?{...this.boss}:null,result:this.result?{...this.result}:null,retries:this.retries,transition:this.transition?{...this.transition}:null};
 }
 geometry(){
  const room={...this.room,...this.worldShape},w=room.width,h=room.height;
  const at=(d,t=0)=>this.worldPose(d,t);
  const hazards=this.hazards.map(h=>{
   const pose=at(h.d),point=(along,inward)=>({x:pose.baseX+pose.tangent.x*along+pose.inward.x*inward,y:pose.baseY+pose.tangent.y*along+pose.inward.y*inward});
   const collisionPolygon=h.type==='beam'?[point(-h.width/2,BEAM_BOTTOM),point(h.width/2,BEAM_BOTTOM),point(h.width/2,BEAM_TOP),point(-h.width/2,BEAM_TOP)]:[point(-h.width/2,0),point(-h.width/2,h.clearance),point(h.width/2,h.clearance),point(h.width/2,0)];
   return {...h,...pose,height:h.height,collisionPolygon};
  });
  const player={...at(this.distance,this.height()),radius:PLAYER_RADIUS,bodyHeight:PLAYER_BODY_HEIGHT};
  // Boss tiles travel through unused room interior, settle on the real rail,
  // then become the same collision objects that the player must jump.
  const attacks=hazards.filter(v=>v.type==='seal').map(v=>{
   const timeToImpact=(v.d-this.distance)/room.speed-.85;
   const flight=clamp(1-timeToImpact/.65,0,1),target={x:v.baseX+v.inward.x*14,y:v.baseY+v.inward.y*14};
   const phase=v.done?'cleared':timeToImpact>2.05?'waiting':timeToImpact>.65?'aim':timeToImpact>0?'flight':'anchored';
   return {id:v.id,phase,x:target.x*flight,y:target.y*flight,size:28,target,targetFace:v.face,origin:{x:0,y:0},timeToImpact,hit:v.hit};
  });
  return {room,bounds:{left:-w/2,top:-h/2,right:w/2,bottom:h/2,width:w,height:h},faces:room.faces.map(f=>({...f,startPoint:poseAt(room,f.start),endPoint:poseAt(room,f.start+f.straight),railStart:f.start,railEnd:f.start+f.length,tangent:poseAt(room,f.start).tangent,inward:poseAt(room,f.start).inward})),player,hazards,attacks,portal:{...hazards.find(v=>v.type==='portal'),open:this.portalOpen},distance:this.distance,time:this.time,progress:this.distance/this.room.perimeter,corner:{face:player.face,turning:player.turning,progress:player.turnProgress},fold:this.fold?{...this.fold}:null,transition:this.transition?{...this.transition}:null,boss:this.boss?{...this.boss}:null,feedback:this.feedback?{...this.feedback}:null,reducedMotion:false};
 }
}
const api={SquareRun,ROOMS,poseAt,normalizeSave,JUMP_SECONDS,JUMP_HEIGHT,PLAYER_RADIUS,PLAYER_BODY_HEIGHT,BEAM_BOTTOM,BEAM_TOP};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.QuadRiftSquare=api;
})(typeof globalThis!=='undefined'?globalThis:this);
