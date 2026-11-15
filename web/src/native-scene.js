/* R86: present the native engine's actual cells, clips, effects and transitions.
 * The functional draw schedule is recovered; vector art and colors are our own.
 * No input, collision, engine state or RNG is written here.
 */
(function(root){'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),unit=16/10,morphClocks=new WeakMap();
function geometry(run){
 const s=run.nativeFrame,pool=s.game.pool,cur=pool.objects[pool.currentIndex],a=s.game.actor,A=run.kernels.Assembly;
 const q=A.rotatePoint(cur.scalarE+cur.position,cur.scalarF-a.height,cur.geometry.orientation),origin=A.rotatePoint(0,0,cur.geometry.orientation),tip=A.rotatePoint(pool.direction===0?1:-1,0,cur.geometry.orientation),tangent={x:tip.x-origin.x,y:tip.y-origin.y};
 const col=clamp(Math.trunc(cur.position/16),0,cur.geometry.activeLength-1),height=Math.max(0,a.height-cur.geometry.columns.c[col]);
 const player={...q,baseX:q.x,baseY:q.y,tangent,inward:{x:tangent.y,y:-tangent.x},face:cur.geometry.orientation,height,bodyHeight:42.5,poseClock:a.frame/8,jumpProgress:a.frame/Math.max(1,run.kernels.Trajectories.frameCount(a.actorState)),kick:[1,2,9,11].includes(a.actorState)?.5:0,impact:[13,16].includes(a.actorState)?.7:0,nativeState:a.actorState,nativeFrame:a.frame};
 return {nativeRuntime:true,player,characterId:run.characterId,room:run.room,bounds:{left:0,top:0,right:384,bottom:384,width:384,height:384},nativeSurfaces:[],boss:run.boss?{...run.boss}:null,time:run.time,familyIndex:run.familyIndex};
}
function snapshot(run){
 const s=run.nativeFrame,m=s.map,v=s.presentation.viewport,groups=[],backgrounds=[];let group={clip:null,cells:[],actors:[],effects:[]};groups.push(group);
 for(const cmd of m.drawCommands||[]){
  if(cmd.type==='semantic-background')backgrounds.push(cmd);
  else if(cmd.type==='semantic-clip'){group={clip:cmd.reset?null:{x:(cmd.x-v.x)*unit,y:(cmd.y-v.y)*unit,width:cmd.width*unit,height:cmd.height*unit},cells:[],actors:[],effects:[]};groups.push(group)}
  else if(cmd.role==='terrain-cell'||cmd.role==='cell-decoration')group.cells.push(cmd);
  else if(cmd.type==='semantic-actor-draw')group.actors.push(cmd);
  else if(cmd.type==='semantic-action-effect')group.effects.push(cmd);
 }
 const transition=s.game.controller.controllerStateUK===200||s.u.l===3;
 const view=s.game.view,cur=s.game.pool.objects[s.game.pool.currentIndex],floating=view.aq>0&&16*cur.geometry.activeLength<view.av;
 return {groups:groups.filter(g=>g.cells.length||g.actors.length||g.effects.length),backgrounds,origin:{x:v.x,y:v.y},palette:m.t,backgroundPeriod:root.MongyuNativeRenderParameters?.paletteByte(m.t,140)||6,counter:s.u.B,countdown:s.r.timerT,notification:s.u.D,notificationCode:s.u.aF,specialMode:s.u.musicModeI,floating,split:(s.u.actionLock&15)>0&&(s.u.actionLock&15)<=4,actionLock:s.u.actionLock,
  transition:transition?{step:m.ad,count:m.e,buffers:m.capture,actor:s.u.l===3?null:{fromX:m.Z,fromY:m.aa,toX:m.ab,toY:m.ac},boss:s.u.l===3}:null,
  phase:transition?'morph':s.u.l===4?'boss-confirm':s.r.timerT>0?'countdown':s.u.D>0?'notification':'play'};
}
function overview(viewport){
 const width=viewport.width,height=viewport.height,scale=Math.min(width/400,height/448),offsetX=width/2-192*scale,offsetY=height*.52-192*scale;
 return {width,height,scale,baseScale:scale,zoom:1,offsetX,offsetY,left:-offsetX/scale,right:(width-offsetX)/scale,top:-offsetY/scale,bottom:(height-offsetY)/scale,framing:'native-layout',follow:false};
}
function point(x,y,scene){return {x:(x-scene.origin.x)*unit,y:(y-scene.origin.y)*unit}}
function tile(c,cmd,scene,p,dx=0,dy=0){
 const q=point(cmd.screenX,cmd.screenY,scene),orientation=((cmd.orientation||0)%4+4)%4;
 const x=q.x+dx-(orientation===1||orientation===2?16:0),y=q.y+dy-(orientation===0||orientation===1?16:0);
 c.globalAlpha=(cmd.alpha??255)/255;c.fillStyle=cmd.frame%3===0?p[2]:p[1];
 // All four orientations remain axis-aligned: no per-cell canvas state stack.
 c.fillRect(x+.5,y+.5,15,15);
}
const backgroundCache=new WeakMap();
function background(c,viewport,scene,p,reduced){
 const palette=root.MongyuNativePalette,w=viewport.width,h=viewport.height,commands=scene.backgrounds||[];
 c.fillStyle=p[0];c.fillRect(0,0,w,h);if(!palette||!commands.length)return;
 let pair=backgroundCache.get(scene);if(!pair){pair={};backgroundCache.set(scene,pair)}
 const key=reduced?'reduced':'normal';let surface=pair[key];
 if(!surface&&typeof root.OffscreenCanvas==='function'){
  surface=new root.OffscreenCanvas(240,240);const b=surface.getContext('2d',{alpha:false});b.fillStyle=p[0];b.fillRect(0,0,240,240);
  for(const command of commands){
   if(command.role==='background-fill'){b.fillStyle=reduced?p[0]:palette.color(scene.palette,{rgb:command.rgb});b.fillRect(0,0,240,240)}
   else if(command.role==='background-cell'){
    const role={...command.colorRole};if(reduced){const x=Math.floor((command.x-scene.origin.x)/30),y=Math.floor((command.y-scene.origin.y)/30),fold0=y*8+x,fold=fold0>31?63-fold0:fold0;role.packedPaletteOffset=112+Math.trunc(fold/2);role.nibble=fold%2?'high':'low'}
    b.fillStyle=palette.color(scene.palette,role,reduced);b.fillRect(command.x-scene.origin.x,command.y-scene.origin.y,command.width,command.height);
   }
  }pair[key]=surface;
 }
 // Keep the native square mosaic; extend it to cover tall phones and tablets.
 const size=Math.min(w,h);if(surface){c.imageSmoothingEnabled=false;for(let x=0;x<w;x+=size)for(let y=0;y<h;y+=size)c.drawImage(surface,x,y,size,size);return}
 // Non-browser drawing harnesses have no offscreen canvas.
 for(const command of commands){c.fillStyle=command.role==='background-fill'?palette.color(scene.palette,{rgb:command.rgb}):palette.color(scene.palette,command.colorRole,reduced);if(command.role==='background-fill')c.fillRect(0,0,w,h);else c.fillRect((command.x-scene.origin.x)*size/240,(command.y-scene.origin.y)*size/240,command.width*size/240,command.height*size/240)}
}
function effects(c,group,scene,p){
 c.save();c.fillStyle=p[3];c.strokeStyle=p[3];c.lineWidth=1.5;
 for(const e of group.effects){
  if(e.primitive==='rect'){const q=point(e.x,e.y,scene);c.fillRect(q.x,q.y,(e.width||2)*unit,(e.height||2)*unit)}
  else if(e.primitive==='line'){const a=point(e.x1,e.y1,scene),b=point(e.x2,e.y2,scene);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke()}
 }c.restore();
}
function actorPose(command,geo,scene){
 const d=command.role==='history-actor',base=d?geo.companion:geo.player;if(!base)return null;
 const q=point(command.x,command.y,scene),angle=-(command.variantOrientation||0)*Math.PI/2,sign=command.direction===0?1:-1;
 // Native actor anchors include eight local units below the feet.
 return {...base,x:q.x+8*Math.sin(angle),y:q.y-8*Math.cos(angle),tangent:{x:Math.cos(angle)*sign,y:Math.sin(angle)*sign},renderAngle:angle+(sign<0?Math.PI:0),nativeState:command.state,nativeFrame:command.frame};
}
function morph(c,geo,scene,run,opt,p){
 const t=scene.transition,b=t.buffers;if(!b)return;
 const alpha=clamp(run.remainder/Math.max(1,run.stepMs),0,1);let u=clamp((t.step-1+alpha)/10,0,1);
 const last=morphClocks.get(run);if(run.state==='pause'&&last?.attempt===run.attempt&&last?.map===run.mapChanges)u=last.u;
 if(opt.reduced)u=t.step<5?0:1;
 morphClocks.set(run,{attempt:run.attempt,map:run.mapChanges,u});const mix=(a,z)=>a+(z-a)*u;
 const n=Math.min(200,t.count,b.oldX.length,b.newX.length);
 for(let i=0;i<n;i++){
  const q=point(mix(b.oldX[i],b.newX[i]),mix(b.oldY[i],b.newY[i]),scene),frame=u<.5?b.oldCommands[i]:b.newCommands[i];
  c.fillStyle=frame%3===0?p[2]:p[1];c.fillRect(q.x,q.y-16,15,15);
 }
 if(t.actor){const a=t.actor,q=point(mix(a.fromX,a.toX),mix(a.fromY,a.toY),scene);root.MongyuMobile.sprite(c,{...geo.player,...q,nativeState:11},{poseTime:opt.presentationTime||0,contrast:true},!!opt.reduced,geo.characterId)}
}
function draw(c,run,opt,geo){
 const scene=geo.nativeScene;if(!scene)return null;const M=root.MongyuMobile,reduced=!!(opt.reduced||geo.reducedMotion),p=M.worldPalette(scene.palette),special=scene.split||scene.floating||scene.transition||geo.boss;
 const cam=special?overview(opt.viewport):M.camera(opt.viewport,geo,opt,run);
 c.save();c.clearRect(0,0,cam.width,cam.height);background(c,opt.viewport,scene,p,reduced);c.translate(cam.offsetX,cam.offsetY);c.scale(cam.scale,cam.scale);
 for(const group of scene.groups){
  c.save();if(scene.split&&group.clip){c.beginPath();c.rect(group.clip.x,group.clip.y,group.clip.width,group.clip.height);c.clip()}
  for(const cell of group.cells)tile(c,cell,scene,p);c.globalAlpha=1;
  if(!reduced)effects(c,group,scene,p);
  if(scene.split){for(const command of group.actors){const q=actorPose(command,geo,scene);if(!q)continue;if(command.role==='history-actor')M.dog(c,q,{poseTime:opt.presentationTime||0,contrast:true},reduced);else M.sprite(c,q,{poseTime:opt.presentationTime||0,contrast:true},reduced,geo.characterId)}}
  c.restore();
 }
 if(scene.transition)morph(c,geo,scene,run,opt,p);
 if(!scene.split&&!scene.transition){
  const visible=scene.groups.some(g=>g.actors.some(a=>a.role==='current-actor'));
  if(geo.companion)M.dog(c,geo.companion,{poseTime:opt.presentationTime||0,contrast:true},reduced);
  if(visible||scene.groups.length===0)M.sprite(c,geo.player,{poseTime:opt.presentationTime||0,contrast:true},reduced,geo.characterId);
  if(scene.phase==='notification'){
   const q=geo.player,x=q.x+10,y=q.y-q.bodyHeight-14;c.save();c.fillStyle=p[3];c.beginPath();c.ellipse(x,y,15,10,0,0,Math.PI*2);c.fill();c.font='600 14px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=p[1];c.fillText('…',x,y-2);c.restore();
  }
 }else if(scene.transition?.boss)M.sprite(c,geo.player,{poseTime:opt.presentationTime||0,contrast:true},reduced,geo.characterId);
 c.restore();
 if(geo.boss&&geo.boss.maxHp>0){c.save();const w=Math.min(140,cam.width*.35),x=(cam.width-w)/2,y=64;c.fillStyle=p[1];c.fillRect(x,y,w,4);c.fillStyle=p[3];c.fillRect(x,y,w*clamp(geo.boss.hp/geo.boss.maxHp,0,1),4);c.restore()}
 if(scene.countdown>0){c.save();c.textAlign='center';c.textBaseline='middle';c.font='600 48px sans-serif';c.fillStyle=p[1];c.fillText(String(Math.ceil(scene.countdown/10)),cam.width/2,cam.height*.42);c.restore()}
 return {kind:'r38-square',camera:cam,nativePhase:scene.phase,nativeGroups:scene.groups.length,nativeCells:scene.groups.reduce((n,g)=>n+g.cells.length,0),nativeLayout:scene.split?'partitioned':'single',zoom:1};
}
const api={snapshot,geometry,overview,point,draw};root.MongyuNativeScene=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
