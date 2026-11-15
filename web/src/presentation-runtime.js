/* R82 display adapter. Simulation, collision and input stay owned by the native engine. */
(function(root){'use strict';
const frames=new WeakMap(),facades=new WeakMap();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function cameraTranslation(run){
 const rotate=run.kernels.Assembly.rotatePoint,delta={x:0,y:0};
 for(const t of run.lastTrace||[]){
  const v=t.translation||t;
  if(!['nativeT-follow','nativeT-floating','map-camera-follow'].includes(t.phase)&&!['camera-follow','partition-camera-follow'].includes(t.operation))continue;
  if(!Number.isFinite(v.dx)||!Number.isFinite(v.dy))continue;
  const ref=v.referenceOrientation||0,o=rotate(0,0,ref),p=rotate(v.dx,v.dy,ref);delta.x+=p.x-o.x;delta.y+=p.y-o.y;
 }
 return delta;
}
function shifted(q,delta){return q?{...q,x:q.x+delta.x,y:q.y+delta.y}:q}
// The canonical projector first clones/validates the whole four-surface pool for
// every vertex. Here the engine has already validated its own snapshot. Read the
// same integer coordinates once for display; never pass this facade to Driver.
function projectSurfacePoint(pool,side,column,rotate){
 const entry=pool.objects[side],height=entry.geometry.columns.c[column];
 return {...rotate(entry.scalarE+16*column,entry.scalarF-height,entry.geometry.orientation),sentinelValue:height===-1||height===-80?height:null};
}
// The native resource-1 actor follows the oldest of seven recorded poses.
// Resolve its feet in world coordinates, without creating an actor or collider.
function historicalCompanion(run){
 const s=run.nativeFrame,h=s?.history;if(run.characterId!=='dog'||h?.ay!==1)return null;
 const row=h.rows?.[h.aw];if(!row||row.length<6)return null;
 const pool=s.game.pool,cur=pool.objects[pool.currentIndex],mode=s.game.controller.modeP;
 const face=mode>0?s.game.actor.orientation:row[2],rotate=run.kernels.Assembly.rotatePoint;
 const point=rotate(cur.scalarE+row[0],cur.scalarF-row[1]+(s.game.stage.behaviorCode===3?8:0),face);
 const angle=mode>0?-row[2]*Math.PI/180:-face*Math.PI/2,sign=row[3]===0?1:-1;
 const tangent={x:Math.cos(angle)*sign,y:Math.sin(angle)*sign};
 // Height above the recorded face, rather than above the current runner's wall.
 const surface=pool.objects.find(x=>x.geometry.orientation===face)||cur;
 const col=clamp(Math.trunc(row[0]/16),0,surface.geometry.activeLength-1);
 const forward=s.game.stage.behaviorCode===3?0:8;
 return {...point,x:point.x+tangent.x*forward,y:point.y+tangent.y*forward,tangent,inward:{x:Math.sin(angle),y:-Math.cos(angle)},direction:row[3],face,height:Math.max(0,row[1]-surface.geometry.columns.c[col]),bodyHeight:23,nativeState:row[4],nativeFrame:row[5],historyIndex:h.aw,source:'native-seven-pose-history'};
}
function withGroundContact(geo,run){
 const s=run.nativeFrame,p=s.game.pool,c=p.objects[p.currentIndex],A=run.kernels.Assembly,face=c.geometry.orientation,zero=A.rotatePoint(0,0,face),x=A.rotatePoint(1,0,face),n=A.rotatePoint(0,-1,face),column=Math.trunc(c.position/16),first=Math.max(0,column-2);
 const groundContact={origin:A.rotatePoint(s.game.stage.behaviorCode===3?0:c.scalarE,s.game.stage.behaviorCode===3?384:c.scalarF,face),tangent:{x:x.x-zero.x,y:x.y-zero.y},inward:{x:n.x-zero.x,y:n.y-zero.y},first,columns:c.geometry.columns.c.slice(first,Math.min(c.geometry.activeLength,column+3))};
 if(geo.nativeScene&&root.MongyuNativeScene){groundContact.blockers=geo.nativeScene.groups.flatMap(g=>g.cells).filter(c=>c.role==='terrain-cell'&&!/^0x4c/.test(c.raw)).map(c=>root.MongyuNativeScene.tileBounds(c,geo.nativeScene)).filter(r=>r.x<geo.player.x+96&&r.x+16>geo.player.x-96&&r.y<geo.player.y+96&&r.y+16>geo.player.y-96)}
 return {...geo,player:{...geo.player,groundContact}};
}
function snapshot(run){
 if(root.MongyuNativeScene)return withGroundContact({...root.MongyuNativeScene.geometry(run),companion:historicalCompanion(run),nativeScene:root.MongyuNativeScene.snapshot(run)},run);
 let K=facades.get(run.kernels);if(!K){const rotate=run.kernels.Assembly.rotatePoint;K={...run.kernels,Assembly:{...run.kernels.Assembly,projectSurfacePoint:(p,s,c)=>projectSurfacePoint(p,s,c,rotate)}};facades.set(run.kernels,K)}
 const geo=root.MongyuNativeRestoration.nativeGeometry(run.nativeFrame,run,K),pool=run.nativeFrame.game.pool;
 const nativeSurfaces=pool.objects.map((entry,side)=>{const angle=-entry.geometry.orientation*Math.PI/2,tangent=[Math.round(Math.cos(angle)),Math.round(Math.sin(angle))];
  const points=Array.from({length:entry.geometry.activeLength},(_,col)=>{const p=K.Assembly.projectSurfacePoint(pool,side,col);return p.sentinelValue===null?{x:p.x,y:p.y}:null});return {side,tangent,points};});
 const raw=geo.player,sign=pool.direction===0?1:-1,normal={x:raw.inward.x*sign,y:raw.inward.y*sign},mask=run.nativeFrame.game.stage.behaviorCode===3,player={...raw,x:raw.x+raw.tangent.x*(mask?0:8)-normal.x*(mask?8:0),y:raw.y+raw.tangent.y*(mask?0:8)-normal.y*(mask?8:0),direction:pool.direction,inward:normal};player.baseX=player.x;player.baseY=player.y;
 return {...geo,player,nativeSurfaces,companion:historicalCompanion(run)};
}
const cross=(a,b)=>a.x*b.y-a.y*b.x;
function segment(p,q){
 const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy),a=p.tangent,b=q.tangent;
 if(d>96||!a||!b)return null;
 if(p.face===q.face)return {length:Math.max(0,dx*a.x+dy*a.y),turn:false};
 const den=cross(a,b);if(Math.abs(den)<.5)return null;
 const pn=p.inward||{x:a.y,y:-a.x},qn=q.inward||{x:b.y,y:-b.x};
 const ground={x:p.x-pn.x*(p.height||0),y:p.y-pn.y*(p.height||0)},nextGround={x:q.x-qn.x*(q.height||0),y:q.y-qn.y*(q.height||0)};
 const delta={x:nextGround.x-ground.x,y:nextGround.y-ground.y},before=cross(delta,b)/den,after=cross(a,delta)/den;
 if(before<-.5||after<-.5||before+after>96)return null;
 return {length:Math.max(0,before)+Math.max(0,after),before:Math.max(0,before),ground,corner:{x:ground.x+a.x*Math.max(0,before),y:ground.y+a.y*Math.max(0,before)},turn:true};
}
function interpolatePlayer(p,q,alpha){
 const step=segment(p,q);if(!step||(p.direction??0)!==(q.direction??0)||[13,16].includes(q.nativeState))return {...q};alpha=clamp(alpha,0,1);const player={...q};
 for(const k of ['x','y','height'])if(Number.isFinite(q[k])&&Number.isFinite(p[k]))player[k]=p[k]+(q[k]-p[k])*alpha;
 // Do not rewind a completed jump back to its take-off pose at landing.
 if(Number.isFinite(p.jumpProgress)&&Number.isFinite(q.jumpProgress))player.jumpProgress=p.nativeState===q.nativeState&&q.jumpProgress>=p.jumpProgress?p.jumpProgress+(q.jumpProgress-p.jumpProgress)*alpha:(p.height||0)>(q.height||0)?Math.max(.75,q.jumpProgress):q.jumpProgress;
 if(p.nativeState===12&&q.nativeState===12&&Number.isFinite(p.nativeFrame)&&Number.isFinite(q.nativeFrame))player.poseFrame=q.nativeFrame>=p.nativeFrame?p.nativeFrame+(q.nativeFrame-p.nativeFrame)*alpha:q.nativeFrame;
 const start=Math.atan2(p.tangent.y,p.tangent.x),end=Math.atan2(q.tangent.y,q.tangent.x),delta=Math.atan2(Math.sin(end-start),Math.cos(end-start));
 if(step.turn){const along=step.length*alpha;
  const angle=start+delta*alpha,height=player.height||0,sign=q.direction===1?-1:1;
  player.x=(along<step.before?step.ground.x+p.tangent.x*along:step.corner.x+q.tangent.x*(along-step.before))+Math.sin(angle)*height*sign;
  player.y=(along<step.before?step.ground.y+p.tangent.y*along:step.corner.y+q.tangent.y*(along-step.before))-Math.cos(angle)*height*sign;
 }
 player.renderAngle=start+delta*alpha;
 if(q.inward)player.inward={x:Math.sin(player.renderAngle)*(q.direction===1?-1:1),y:-Math.cos(player.renderAngle)*(q.direction===1?-1:1)};
 player.poseFraction=alpha;
 player.turning=step.turn;player.turnProgress=step.turn?alpha:0;
 player.strideDistance=(p.strideDistance||0)+step.length*alpha;
 return player;
}
function geometry(run,opt={}){
 if(!run.nativeRuntime||!run.nativeFrame||!root.MongyuNativeRestoration)return run.geometry(opt.aftermath?.elapsed||0);
 let f=frames.get(run);
 const key=run.nativeFrame,state=run.state,reset=!f||f.attempt!==run.attempt||f.map!==run.mapChanges;
 if(reset||f.key!==key||f.state!==state){
  const current=snapshot(run),delta=!reset&&f.updates!==run.updates?cameraTranslation(run):{x:0,y:0},previous=reset?null:{...f.current,player:shifted(f.current.player,delta),companion:shifted(f.current.companion,delta)},step=previous?segment(previous.player,current.player):null,travel=(reset?0:f.travel)+(step?.length||0);
  current.player={...current.player,strideDistance:travel};
  if(current.companion){const prev=previous?.companion,step=prev?segment(prev,current.companion):null;current.companion.strideDistance=(prev?.strideDistance||0)+(step?.length||0)}
  f={key,state,attempt:run.attempt,map:run.mapChanges,updates:run.updates,current,previous,travel};frames.set(run,f);
 }
 const q=f.current.player,p=f.previous?.player;
 if(opt.reduced&&!opt.essentialMotion||state!=='play'||!p||!q)return f.current;
 const alpha=clamp((run.remainder||0)/Math.max(1,run.stepMs),0,1);
 const dog=f.current.companion,previousDog=f.previous?.companion;
 return {...f.current,player:interpolatePlayer(p,q,alpha),companion:dog&&previousDog?interpolatePlayer(previousDog,dog,alpha):dog};
}
// Last-frame semantic draw commands are output, never input to the next frame.
// The native presenter clears them before producing its new commands. Discard
// them before Driver's intermediate copies as well, preserving live captures/RNG.
function advance(run,dt){
 const tick=()=>{
 if(run.nativeRuntime&&run.state==='play'&&run.supported&&run.nativeFrame?.map?.drawCommands?.length&&run.remainder+dt*1000+1e-8>=run.stepMs){
  run.nativeFrame={...run.nativeFrame,map:{...run.nativeFrame.map,drawCommands:[]}};
 }
 return run.tick(dt);
 };
 return run.nativeRuntime&&root.MongyuStateClone?.duringNativeTick?root.MongyuStateClone.duringNativeTick(tick):tick();
}
function pixelRatio(width,height,device=1){return Math.max(1,Math.min(1.5,device,Math.sqrt(1200000/Math.max(1,width*height))))}
const api={advance,geometry,historicalCompanion,cameraTranslation,interpolatePlayer,segment,projectSurfacePoint,pixelRatio};root.MongyuPresentation=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
