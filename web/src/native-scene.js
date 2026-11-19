/* R86: present the native engine's actual cells, clips, effects and transitions.
 * The functional draw schedule is recovered; vector art and colors are our own.
 * No input, collision, engine state or RNG is written here.
 */
(function(root){'use strict';
const readableNotices=['R99','R100'].includes(root.MONGYU_PLAYABLE_RELEASE);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),unit=16/10,morphClocks=new WeakMap(),fieldClocks=new WeakMap();
function geometry(run){
 const s=run.nativeFrame,pool=s.game.pool,cur=pool.objects[pool.currentIndex],a=s.game.actor,A=run.kernels.Assembly;
 const q=A.rotatePoint(cur.scalarE+cur.position,cur.scalarF-a.height+(s.game.stage.behaviorCode===3?8:0),cur.geometry.orientation),origin=A.rotatePoint(0,0,cur.geometry.orientation),tip=A.rotatePoint(pool.direction===0?1:-1,0,cur.geometry.orientation),tangent={x:tip.x-origin.x,y:tip.y-origin.y};
 const col=clamp(Math.trunc(cur.position/16),0,cur.geometry.activeLength-1),height=Math.max(0,a.height-cur.geometry.columns.c[col]);
 const forward=s.game.stage.behaviorCode===3?0:8,px=q.x+tangent.x*forward,py=q.y+tangent.y*forward;
 let player={...q,x:px,y:py,baseX:px,baseY:py,tangent,inward:{x:tangent.y*(pool.direction===0?1:-1),y:-tangent.x*(pool.direction===0?1:-1)},direction:pool.direction,face:cur.geometry.orientation,height,bodyHeight:42.5,poseClock:a.frame/8,jumpProgress:a.frame/Math.max(1,run.kernels.Trajectories.frameCount(a.actorState)),kick:[1,2,9,11].includes(a.actorState)?.5:0,impact:[13,16].includes(a.actorState)?.7:0,nativeState:a.actorState,nativeFrame:a.frame};
 if(s.game.controller.modeP>0){const command=(s.map.drawCommands||[]).find(c=>c.role==='current-actor');if(command){player=actorPose(command,{player},{origin:s.presentation.viewport,mask:false});player.baseX=player.x;player.baseY=player.y;player.face=cur.geometry.orientation;}}
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
 return {mask:s.game.stage.behaviorCode===3,groups:groups.filter(g=>g.cells.length||g.actors.length||g.effects.length),backgrounds,origin:{x:v.x,y:v.y},palette:m.t,backgroundPeriod:root.MongyuNativeRenderParameters?.paletteByte(m.t,140)||6,counter:s.u.B,countdown:s.r.timerT,notification:s.u.D,notificationCode:s.u.aF,specialMode:s.u.musicModeI,floating,split:(s.u.actionLock&15)>0&&(s.u.actionLock&15)<=4,actionLock:s.u.actionLock,
  transition:transition?{step:m.ad,count:m.e,buffers:m.capture,actor:s.u.l===3?null:{fromX:m.Z,fromY:m.aa,toX:m.ab,toY:m.ac},boss:s.u.l===3}:null,
  phase:transition?'morph':s.u.l===4?'boss-confirm':s.r.timerT>0?'countdown':s.u.D>0?'notification':'play'};
}
function overview(viewport){
 const width=viewport.width,height=viewport.height,scale=Math.min(width/400,height/448),offsetX=width/2-192*scale,offsetY=height*.52-192*scale;
 return {width,height,scale,baseScale:scale,zoom:1,offsetX,offsetY,left:-offsetX/scale,right:(width-offsetX)/scale,top:-offsetY/scale,bottom:(height-offsetY)/scale,framing:'native-layout',follow:false};
}
function point(x,y,scene){return {x:(x-scene.origin.x)*unit,y:(y-scene.origin.y)*unit}}
function tileBounds(cmd,scene){
 const q=point(cmd.screenX,cmd.screenY,scene),orientation=((cmd.orientation||0)%4+4)%4;
 // The mask emitter supplies cell centres (16*column+8, 16*row+8).
 // Ordinary surface commands supply a rotated bottom-left corner instead.
 return cmd.raw==='0x5113a'?{x:q.x-8,y:q.y-8,width:16,height:16}:{x:q.x-(orientation===1||orientation===2?16:0),y:q.y-(orientation===0||orientation===1?16:0),width:16,height:16};
}
// Static terrain uses native numeric swatches; moving boxes use centred,
// four-phase vector squares. Geometry is authored, not copied sprite pixels.
function scenePalette(index){const colors=root.MongyuNativePalette?.get(index).colors;return colors?[colors[0],colors[3],colors[1],colors[2]]:root.MongyuMobile.worldPalette(index)}
function cellStyle(cmd,scene,p){const colors=root.MongyuNativePalette?.get(cmd.palette??scene.palette).colors;if(!colors)return {base:cmd.role!=='cell-decoration'&&cmd.frame===2?p[2]:p[1],accent:p[3]};return {base:cmd.role!=='cell-decoration'&&cmd.frame===2?colors[1]:colors[3],accent:colors[1]}}
function tile(c,cmd,scene,p,dx=0,dy=0,reduced=false){
 const color=cellStyle(cmd,scene,p);c.globalAlpha=(cmd.alpha??255)/255;c.fillStyle=color.base;
 if(cmd.role==='cell-decoration'){
  const q=point(cmd.screenX,cmd.screenY,scene),frame=reduced?3:((cmd.frame||0)%4+4)%4,angle=[-Math.PI/8,Math.PI/4,Math.PI/8,0][frame],size=frame===3?12.8:16/(Math.abs(Math.sin(angle))+Math.abs(Math.cos(angle)));
  c.save();c.translate(q.x+dx,q.y+dy);c.rotate(angle);
  c.fillStyle='#241a34';c.fillRect(-size/2,-size/2,size,size);
  c.fillStyle=cmd.kind===2?'#fff0c1':'#ffbc8f';
  const inset=size*.24;
  c.fillRect(-size/2+inset,-size/2+inset,size-2*inset,size-2*inset);
  c.restore();return;
 }
 const r=tileBounds(cmd,scene),x=r.x+dx,y=r.y+dy;
 c.fillRect(x+.35,y+.35,15.3,15.3);
 const darkBase=/^#[0-3][0-9a-f][0-3][0-9a-f][0-3][0-9a-f]$/i.test(color.base);
 c.fillStyle=darkBase?'#e5cbd189':color.accent;
 const side=((cmd.orientation||0)%4+4)%4;
 if(side===0)c.fillRect(x+1,y+14,14,1.3);
 if(side===1)c.fillRect(x+14,y+1,1.3,14);
 if(side===2)c.fillRect(x+1,y+1,14,1.3);
 if(side===3)c.fillRect(x+1,y+1,1.3,14);
}

const backgroundCache={normal:null,reduced:null};
function background(c,viewport,scene,p,reduced){
 const palette=root.MongyuNativePalette,w=viewport.width,h=viewport.height,commands=scene.backgrounds||[];
 c.fillStyle=p[0];c.fillRect(0,0,w,h);if(!palette||!commands.length)return;
 const key=reduced?'reduced':'normal';
 let cached=backgroundCache[key];
 if(typeof root.OffscreenCanvas==='function'&&cached?.scene!==scene){
  const signature=scene.palette+':'+commands.map(cmd=>cmd.role==='background-fill'?cmd.rgb:[cmd.x-scene.origin.x,cmd.y-scene.origin.y,cmd.width,cmd.height,cmd.colorRole?.packedPaletteOffset,cmd.colorRole?.nibble,cmd.colorRole?.grayTransform,reduced?0:cmd.colorRole?.brightnessDelta].join(',')).join('|');
  if(cached?.signature===signature)cached.scene=scene;
  else {
  const surface=cached?.surface||new root.OffscreenCanvas(240,240);
  const b=surface.getContext('2d',{alpha:false});b.fillStyle=p[0];b.fillRect(0,0,240,240);
  for(const command of commands){
   if(command.role==='background-fill'){b.fillStyle=reduced?p[0]:palette.color(scene.palette,{rgb:command.rgb});b.fillRect(0,0,240,240)}
   else if(command.role==='background-cell'){
    const role={...command.colorRole};if(reduced){const x=Math.floor((command.x-scene.origin.x)/30),y=Math.floor((command.y-scene.origin.y)/30),fold0=y*8+x,fold=fold0>31?63-fold0:fold0;role.packedPaletteOffset=112+Math.trunc(fold/2);role.nibble=fold%2?'high':'low'}
    b.fillStyle=palette.color(scene.palette,role,reduced);b.fillRect(command.x-scene.origin.x,command.y-scene.origin.y,command.width,command.height);
   }
  }
  cached={scene,signature,surface};backgroundCache[key]=cached;
  }
 }
 const surface=cached?.surface;
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
 // Mask contact consumes the eight-unit anchor; ordinary sprites end above it.
 const offset=scene.mask?0:8;
 return {...base,x:q.x+offset*Math.sin(angle),y:q.y-offset*Math.cos(angle),inward:{x:Math.sin(angle),y:-Math.cos(angle)},tangent:{x:Math.cos(angle)*sign,y:Math.sin(angle)*sign},renderAngle:angle+(sign<0?Math.PI:0),direction:command.direction,nativeState:command.state,nativeFrame:command.frame};
}
function morphProgress(scene,run,reduced){
 const t=scene.transition,alpha=clamp(run.remainder/Math.max(1,run.stepMs),0,1);let u=clamp((t.step-1+alpha)/10,0,1);
 const last=morphClocks.get(run);if(run.state==='pause'&&last?.attempt===run.attempt&&last?.map===run.mapChanges)u=last.u;
 if(reduced)u=t.step<5?0:1;
 morphClocks.set(run,{attempt:run.attempt,map:run.mapChanges,u});return u;
}
function morphPlayer(geo,scene,u){
 const a=scene.transition?.actor;if(!a)return geo.player;const q=point(a.fromX+(a.toX-a.fromX)*u,a.fromY+(a.toY-a.fromY)*u,scene),basis=root.MongyuMobile.actorBasis(geo.player),offset=scene.mask?8:16;
 return {...geo.player,x:q.x+basis.nx*offset,y:q.y+basis.ny*offset,nativeState:11};
}
function morph(c,geo,scene,run,opt,p,u,player){
 const t=scene.transition,b=t.buffers;if(!b)return;const mix=(a,z)=>a+(z-a)*u;
 const n=Math.min(200,t.count,b.oldX.length,b.newX.length);
 for(let i=0;i<n;i++){
  const q=point(mix(b.oldX[i],b.newX[i]),mix(b.oldY[i],b.newY[i]),scene),frame=u<.5?b.oldCommands[i]:b.newCommands[i];
  c.fillStyle=frame===2?p[2]:p[1];c.fillRect(q.x-(scene.mask?8:0),q.y-(scene.mask?8:16),15,15);
 }
 if(t.actor)root.MongyuMobile.sprite(c,player,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},!!opt.reduced,geo.characterId);
}

function fieldClock(run,opt){
 const last=fieldClocks.get(run);if(run.state==='pause'&&last?.attempt===run.attempt)return last.time;
 const time=Number.isFinite(opt.presentationTime)?opt.presentationTime:(run.time||0)+Math.max(0,Math.min(run.stepMs||75,run.remainder||0))/1000;
 fieldClocks.set(run,{attempt:run.attempt,time});return time;
}
const notices=new WeakMap();
function noticeText(code){
 if(code===256)return '최고 기록과 같아졌어!';
 if(code===257)return '목표를 채웠어!';
 if(code>=0&&code<30)return '새 길이 열렸어.';
 if(code>=45&&code<75)return '길이 또 바뀌었어.';
 if(code>=75&&code<90)return '이 길 끝엔 뭐가 있을까?';
 return '';
}
function speech(run,scene,player,cam,M){
 if(run.state!=='play'||scene.split||scene.transition||[13,16].includes(player.nativeState))return null;
 const latest=notices.get(run),remaining=scene.phase==='notification'?scene.notification:0;
 let notice=latest?.attempt===run.attempt?latest:null;
 if(remaining>0&&(!notice||notice.code!==scene.notificationCode||remaining>notice.remaining)){
  const text=noticeText(scene.notificationCode);
  notice={attempt:run.attempt,code:scene.notificationCode,text,until:run.time+1.65,remaining};
  notices.set(run,notice);
 }
 if(!notice)return null;
 notice.remaining=remaining;
 if(!notice.text||run.time>=notice.until)return null;
 const basis=M.actorBasis(player),height=player.bodyHeight||42.5;
 const x=(player.x+basis.nx*height*.5)*cam.scale+cam.offsetX;
 const top=Math.min(player.y,player.y+basis.ny*height);
 return {text:notice.text,x:clamp(x,94,Math.max(94,cam.width-94)),
  y:clamp(top*cam.scale+cam.offsetY-12,90,Math.max(90,cam.height-80))};
}
function draw(c,run,opt,geo){
 const scene=geo.nativeScene;if(!scene)return null;const M=root.MongyuMobile,reduced=!!(opt.reduced||geo.reducedMotion),p=scenePalette(scene.palette),special=scene.split||geo.boss;
 const progress=scene.transition?morphProgress(scene,run,reduced):0,player=scene.transition?morphPlayer(geo,scene,progress):geo.player;
 const cam=special?overview(opt.viewport):M.camera(opt.viewport,{...geo,player},opt,run);
 const art=root.MongyuStagecraft,profile=root.MongyuMapDirection?.describe(run),backdrop=art?.backgroundAt(scene,p,opt.viewport,cam.width/2,cam.height/2,reduced),actorInk=art?.inkFor(backdrop,M.look().body);opt={...opt,actorInk};
 c.save();background(c,opt.viewport,scene,p,reduced);c.fillStyle='#20183645';c.fillRect(0,0,cam.width,cam.height);if(art&&profile){const colors=root.MongyuNativePalette?.get(scene.palette).colors,basis=M.actorBasis(player);art.draw(c,cam,profile,p,fieldClock(run,opt),reduced,{intensity:opt.dreamIntensity,colors:colors?[colors[0],colors[2],colors[4],colors[5]]:undefined,focus:{x:(player.x+basis.nx*21.25)*cam.scale+cam.offsetX,y:(player.y+basis.ny*21.25)*cam.scale+cam.offsetY},tempo:root.MONGYU_EMBEDDED_MUSIC?.[profile.recordingId]?.bpm||120,morph:scene.transition?progress:0})}c.translate(cam.offsetX,cam.offsetY);c.scale(cam.scale,cam.scale);
 for(const group of scene.groups){
  c.save();if(scene.split&&group.clip){c.beginPath();c.rect(group.clip.x,group.clip.y,group.clip.width,group.clip.height);c.clip()}
  for(const cell of group.cells)tile(c,cell,scene,p,0,0,reduced);c.globalAlpha=1;
  if(!reduced)effects(c,group,scene,p);
  if(scene.split){for(const command of group.actors){const q=actorPose(command,geo,scene);if(!q)continue;if(command.role==='history-actor')M.dog(c,q,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},reduced);else M.sprite(c,q,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},reduced,geo.characterId)}}
  c.restore();
 }
 if(scene.transition)morph(c,geo,scene,run,opt,p,progress,player);
 if(!scene.split&&!scene.transition){
  const visible=scene.groups.some(g=>g.actors.some(a=>a.role==='current-actor'));
  if(geo.companion)M.dog(c,geo.companion,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},reduced);
  if(visible||scene.groups.length===0){
   const player=root.MONGYU_DREAM_EDITION===true&&scene.phase==='countdown'?{...geo.player,pose:'stand'}:geo.player;
   M.sprite(c,player,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},reduced,geo.characterId);
  }
  if(!readableNotices&&scene.phase==='notification'){
   const q=geo.player,x=q.x+10,y=q.y-q.bodyHeight-14;c.save();c.fillStyle=p[3];c.beginPath();c.ellipse(x,y,15,10,0,0,Math.PI*2);c.fill();c.font='600 14px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=p[1];c.fillText('…',x,y-2);c.restore();
  }
 }else if(scene.transition?.boss)M.sprite(c,geo.player,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},reduced,geo.characterId);
 c.restore();
 if(geo.boss&&geo.boss.maxHp>0){c.save();const w=Math.min(140,cam.width*.35),x=(cam.width-w)/2,y=64;c.fillStyle=p[1];c.fillRect(x,y,w,4);c.fillStyle=p[3];c.fillRect(x,y,w*clamp(geo.boss.hp/geo.boss.maxHp,0,1),4);c.restore()}
 if(scene.countdown>0){
  const x=cam.width/2,y=cam.height*.29;
  c.save();c.translate(x,y);c.fillStyle='#20182ded';
  if(typeof c.roundRect==='function'){c.beginPath();c.roundRect(-68,-34,136,68,18);c.fill()}else c.fillRect(-68,-34,136,68);
  c.textAlign='center';c.textBaseline='middle';c.font='750 27px system-ui';c.fillStyle='#fff0d6';
  c.fillText(String(Math.ceil(scene.countdown/10)),0,-6);
  c.font='600 11px system-ui';c.fillText('곧 달리기 시작',0,18);c.restore();
 }
 return {kind:'r38-square',camera:cam,nativePhase:scene.phase,nativeGroups:scene.groups.length,nativeCells:scene.groups.reduce((n,g)=>n+g.cells.length,0),nativeLayout:scene.split?'partitioned':'single',zoom:1,speech:readableNotices?speech(run,scene,player,cam,M):null};
}
const api={snapshot,geometry,overview,point,tileBounds,scenePalette,cellStyle,tile,actorPose,morphPlayer,draw};root.MongyuNativeScene=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
