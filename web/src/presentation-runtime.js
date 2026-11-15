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
 const point=rotate(cur.scalarE+row[0],cur.scalarF-row[1],face);
 const angle=mode>0?-row[2]*Math.PI/180:-face*Math.PI/2,sign=row[3]===0?1:-1;
 const tangent={x:Math.cos(angle)*sign,y:Math.sin(angle)*sign};
 // Height above the recorded face, rather than above the current runner's wall.
 const surface=pool.objects.find(x=>x.geometry.orientation===face)||cur;
 const col=clamp(Math.trunc(row[0]/16),0,surface.geometry.activeLength-1);
 return {...point,tangent,face,height:Math.max(0,row[1]-surface.geometry.columns.c[col]),bodyHeight:23,nativeState:row[4],nativeFrame:row[5],historyIndex:h.aw,source:'native-seven-pose-history'};
}
function snapshot(run){
 if(root.MongyuNativeScene)return {...root.MongyuNativeScene.geometry(run),companion:historicalCompanion(run),nativeScene:root.MongyuNativeScene.snapshot(run)};
 let K=facades.get(run.kernels);if(!K){const rotate=run.kernels.Assembly.rotatePoint;K={...run.kernels,Assembly:{...run.kernels.Assembly,projectSurfacePoint:(p,s,c)=>projectSurfacePoint(p,s,c,rotate)}};facades.set(run.kernels,K)}
 const geo=root.MongyuNativeRestoration.nativeGeometry(run.nativeFrame,run,K),pool=run.nativeFrame.game.pool;
 const nativeSurfaces=pool.objects.map((entry,side)=>{const angle=-entry.geometry.orientation*Math.PI/2,tangent=[Math.round(Math.cos(angle)),Math.round(Math.sin(angle))];
  const points=Array.from({length:entry.geometry.activeLength},(_,col)=>{const p=K.Assembly.projectSurfacePoint(pool,side,col);return p.sentinelValue===null?{x:p.x,y:p.y}:null});return {side,tangent,points};});
 return {...geo,nativeSurfaces,companion:historicalCompanion(run),...(root.MongyuNativeScene?{nativeScene:root.MongyuNativeScene.snapshot(run)}:{})};
}
const cross=(a,b)=>a.x*b.y-a.y*b.x;
function segment(p,q){
 const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy),a=p.tangent,b=q.tangent;
 if(d>96||!a||!b)return null;
 if(p.face===q.face)return {length:Math.max(0,dx*a.x+dy*a.y),turn:false};
 const den=cross(a,b);if(Math.abs(den)<.5)return null;
 const ground={x:p.x-a.y*(p.height||0),y:p.y+a.x*(p.height||0)},nextGround={x:q.x-b.y*(q.height||0),y:q.y+b.x*(q.height||0)};
 const delta={x:nextGround.x-ground.x,y:nextGround.y-ground.y},before=cross(delta,b)/den,after=cross(a,delta)/den;
 if(before<-.5||after<-.5||before+after>96)return null;
 return {length:Math.max(0,before)+Math.max(0,after),before:Math.max(0,before),ground,corner:{x:ground.x+a.x*Math.max(0,before),y:ground.y+a.y*Math.max(0,before)},turn:true};
}
function interpolatePlayer(p,q,alpha){
 const step=segment(p,q);if(!step||[13,16].includes(q.nativeState))return {...q};alpha=clamp(alpha,0,1);const player={...q};
 for(const k of ['x','y','height','jumpProgress'])if(Number.isFinite(q[k])&&Number.isFinite(p[k]))player[k]=p[k]+(q[k]-p[k])*alpha;
 const start=Math.atan2(p.tangent.y,p.tangent.x),end=Math.atan2(q.tangent.y,q.tangent.x),delta=Math.atan2(Math.sin(end-start),Math.cos(end-start));
 if(step.turn){const along=step.length*alpha;
  const angle=start+delta*alpha,height=player.height||0;
  player.x=(along<step.before?step.ground.x+p.tangent.x*along:step.corner.x+q.tangent.x*(along-step.before))+Math.sin(angle)*height;
  player.y=(along<step.before?step.ground.y+p.tangent.y*along:step.corner.y+q.tangent.y*(along-step.before))-Math.cos(angle)*height;
 }
 player.renderAngle=start+delta*alpha;
 player.poseFraction=alpha;
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
 if(opt.reduced||state!=='play'||!p||!q)return f.current;
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
