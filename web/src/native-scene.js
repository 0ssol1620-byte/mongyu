/* R86: present the native engine's actual cells, clips, effects and transitions.
 * The functional draw schedule is recovered; vector art and colors are our own.
 * No input, collision, engine state or RNG is written here.
 */
(function(root){'use strict';
const stageHud=root.MONGYU_STAGE_HUD===true;
const readableNotices=['R99','R100','R101','R102','R103'].includes(root.MONGYU_PLAYABLE_RELEASE);
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
const surfaceCommands=new Set(['0x4d936','0x4d68a','0x4d35a','0x4d72c']);
const entityCommands=new Set(['0x4c91e','0x4c88a','0x4caac']);
const surfaceDirection=[[1,0],[0,-1],[-1,0],[0,1]];
function jointOverhangs(cells,pool,rotate){
 const byPosition=new Set(),terrain=[];
 for(const cell of cells){
  if(cell.role!=='terrain-cell'||!surfaceCommands.has(cell.raw))continue;
  const face=cell.orientation%4,q=rotate(cell.x,cell.y,face);
  const x=q.x-(face===1||face===2?16:0),y=q.y-(face===0||face===1?16:0);
  terrain.push({cell,face,x,y});byPosition.add(face+':'+x+':'+y);
 }
 const overhangs=new Set();
 for(const {cell,face,x,y} of terrain){
  const joined=pool.objects.some(entry=>{
   if(!entry||entry.geometry.orientation!==face||cell.x!==entry.scalarE+entry.geometry.scalarD)return false;
   const next=pool.objects[entry.linkB];
   return next?.geometry.orientation===(face+1)%4;
  });
  if(!joined)continue;
  const wall=(face+1)%4;
  const [dx,dy]=surfaceDirection[face],[wx,wy]=surfaceDirection[wall];
  const bx=x-16*dx,by=y-16*dy;
  if(byPosition.has(wall+':'+bx+':'+by)&&byPosition.has(wall+':'+(bx+16*wx)+':'+(by+16*wy))){
   overhangs.add(cell);
  }
 }
 return overhangs;
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
 // The terrain pass includes the terminal sampling column. At a connected
 // perpendicular joint, the adjacent wall already closes the visible face.
 if(stageHud&&s.game.stage.behaviorCode!==3){
  for(const layer of groups){
   const overhangs=jointOverhangs(layer.cells,s.game.pool,run.kernels.Assembly.rotatePoint);
   if(overhangs.size)layer.overhangs=overhangs;
  }
 }
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
 if(stageHud&&entityCommands.has(cmd.raw)){
  // Moving collision cells keep their full footprint and a distinct edge.
  c.fillStyle='#21152b';c.fillRect(x+.35,y+.35,15.3,15.3);
  c.strokeStyle='#ffbd9d';c.lineWidth=1.25;c.strokeRect(x+1,y+1,14,14);
  c.fillStyle='#ffbd9dbb';c.fillRect(x+4,y+6.5,8,2.2);return;
 }
 c.fillRect(x+.35,y+.35,15.3,15.3);
 const darkBase=/^#[0-3][0-9a-f][0-3][0-9a-f][0-3][0-9a-f]$/i.test(color.base);
 c.fillStyle=darkBase?'#e5cbd189':color.accent;
 const side=((cmd.orientation||0)%4+4)%4;
 if(side===0)c.fillRect(x+1,y+14,14,1.3);
 if(side===1)c.fillRect(x+14,y+1,1.3,14);
 if(side===2)c.fillRect(x+1,y+1,14,1.3);
 if(side===3)c.fillRect(x+1,y+1,1.3,14);
}

// R104 polish: native cells drawn as lit architecture. Every block keeps its exact
// 16-unit collision square as its lit top face; a darker front face and a soft cast
// shadow extend only beyond the side facing away from the running surface.
const polishEdition=()=>root.MONGYU_POLISH_EDITION===true;
const BOSS_RAW='0x5595a',MASK_RAW='0x5113a',WALK=[[0,-1],[-1,0],[0,1],[1,0]],AWAY=[[0,1],[1,0],[0,-1],[-1,0]],FACE=6;
const occupied=new Set(),cellKey=(x,y)=>(Math.round(x)+4096)*16384+(Math.round(y)+4096);
const blockBuffer={x:new Float64Array(512),y:new Float64Array(512),o:new Int8Array(512),n:0};
function cellHash(x,y){let h=(Math.round(x)*73856093)^(Math.round(y)*19349663);h=Math.imul(h^(h>>>13),0x5bd1e995);return ((h^(h>>>15))>>>0)}
function chapterPalette(geo,run){const f=geo?.familyIndex??run?.familyIndex;return root.MongyuNativePalette?.chapter?.(Number.isFinite(f)?f:0)||null}
// Strip of depth [a,b] measured outward (a,b>=0) or inward (a,b<0) from one side of a 16-unit cell,
// optionally lengthened by `before`/`after` units along the side.
function sideRect(c,x,y,dx,dy,a,b,before=0,after=0){
 const lo=Math.min(a,b),hi=Math.max(a,b),d=hi-lo,l=16+before+after;
 if(dy<0)c.rect(x-before,y-hi,l,d);else if(dy>0)c.rect(x-before,y+16+lo,l,d);else if(dx<0)c.rect(x-hi,y-before,d,l);else c.rect(x+16+lo,y-before,d,l);
}
function polishBlocks(c,cells,scene,pal,overhangs){
 const B=blockBuffer,S=root.MongyuStagecraft,mix=S.mix,rgba=S.rgba,tone=pal.block;B.n=0;occupied.clear();
 for(const cmd of cells){
  if(cmd.role!=='terrain-cell'||entityCommands.has(cmd.raw)||cmd.raw===BOSS_RAW||overhangs?.has(cmd))continue;
  if(B.n>=B.x.length)break;const r=tileBounds(cmd,scene);B.x[B.n]=r.x;B.y[B.n]=r.y;B.o[B.n]=cmd.raw===MASK_RAW?-1:((cmd.orientation||0)%4+4)%4;occupied.add(cellKey(r.x,r.y));B.n++;
 }
 if(!B.n)return 0;
 const has=(x,y)=>occupied.has(cellKey(x,y)),n=B.n,open=(x,y,d)=>!has(x+16*d[0],y+16*d[1]);
 const pass=(fill,fn)=>{c.beginPath();for(let i=0;i<n;i++)fn(B.x[i],B.y[i],B.o[i]);c.fillStyle=fill;c.fill()};
 // Front face beyond the away side. At an L joint the face also wraps the open run end
 // (and its diagonal) so corners read as one solid mass; free ends stay exact.
 const face=(x,y,o,a,b)=>{if(o<0)return;const d=AWAY[o];if(!open(x,y,d))return;const corner=!open(x,y,WALK[o]);
  const p0=d[1]?[-1,0]:[0,-1],p1=d[1]?[1,0]:[0,1],e0=corner&&open(x,y,p0),e1=corner&&open(x,y,p1);
  sideRect(c,x,y,d[0],d[1],a,b,e0?b:0,e1?b:0);
  if(e0)sideRect(c,x,y,p0[0],p0[1],0,Math.min(b,FACE));if(e1)sideRect(c,x,y,p1[0],p1[1],0,Math.min(b,FACE))};
 const dark=mix(pal.sky[0],'#000000',.45);
 pass(rgba(dark,.2),(x,y,o)=>o<0?(open(x,y,AWAY[2])&&sideRect(c,x,y,0,1,0,6)):face(x,y,o,0,FACE+6));
 pass(rgba(dark,.3),(x,y,o)=>o<0?(open(x,y,AWAY[2])&&sideRect(c,x,y,0,1,0,3)):face(x,y,o,0,FACE+2.5));
 pass(tone.shadow,(x,y,o)=>face(x,y,o,0,FACE));
 // Lamp-lit windows in the front face, in the middle of long runs.
 pass(rgba(pal.lamp,.82),(x,y,o)=>{if(o<0||cellHash(x,y)%3)return;const d=AWAY[o];if(!open(x,y,d))return;const along=d[1]?[1,0]:[0,1];if(open(x,y,along)||open(x,y,[-along[0],-along[1]]))return;
  const h=d[1]?3.2:4.4,cx=d[0]>0?x+16+FACE/2:d[0]<0?x-FACE/2:x+8,cy=d[1]>0?y+16+FACE/2:d[1]<0?y-FACE/2:y+8;c.rect(cx-.9,cy-h/2,1.8,h)});
 // Lit top face (the collision square) with a soft gradient toward the front face.
 pass(tone.side,(x,y)=>c.rect(x-.15,y-.15,16.3,16.3));
 pass(rgba(tone.shadow,.55),(x,y,o)=>{const d=o<0?AWAY[2]:AWAY[o];if(open(x,y,d))sideRect(c,x,y,d[0],d[1],-2.2,0)});
 pass(rgba(tone.shadow,.4),(x,y,o)=>{if(cellHash(x,y)%2)return;const w=o<0||o%2===0;if(w&&has(x-16,y))c.rect(x-.35,y+4.2,.7,8);else if(!w&&has(x,y-16))c.rect(x+4.2,y-.35,8,.7)});
 pass(tone.top,(x,y,o)=>{const s=o<0?WALK[0]:WALK[o];if(open(x,y,s))sideRect(c,x,y,s[0],s[1],-5,0)});
 // Run ends: pale toward the light (left/top), dark away from it.
 pass(rgba(tone.top,.85),(x,y)=>{if(!has(x-16,y))c.rect(x,y,1.3,16);if(!has(x,y-16))c.rect(x,y,16,1.3)});
 pass(rgba(tone.shadow,.85),(x,y)=>{if(!has(x+16,y))c.rect(x+14.6,y,1.4,16);if(!has(x,y+16))c.rect(x,y+14.6,16,1.4)});
 // Rail on the running edge: bright lip, rail shadow line and two posts per cell.
 pass(mix(tone.top,'#ffffff',.6),(x,y,o)=>{const s=o<0?WALK[0]:WALK[o];if(open(x,y,s))sideRect(c,x,y,s[0],s[1],-1,0)});
 pass(rgba(tone.side,.8),(x,y,o)=>{const s=o<0?WALK[0]:WALK[o];if(!open(x,y,s))return;sideRect(c,x,y,s[0],s[1],-3.4,-2.7);
  for(const k of [3.6,11.6]){if(s[1]<0)c.rect(x+k,y+1,.8,1.8);else if(s[1]>0)c.rect(x+k,y+13.2,.8,1.8);else if(s[0]<0)c.rect(x+1,y+k,1.8,.8);else c.rect(x+13.2,y+k,1.8,.8)}});
 return n;
}
function polishCrystals(c,cells,scene,pal,t,reduced){
 const S=root.MongyuStagecraft,M=root.MongyuNativePalette.MEANING,halo=S.glow(M.coral,64);let n=0;
 for(const cmd of cells){
  if(cmd.role!=='terrain-cell'||!entityCommands.has(cmd.raw))continue;n++;
  const r=tileBounds(cmd,scene),x=r.x,y=r.y,cx=x+8,cy=y+8,h=cellHash(cmd.screenX,cmd.screenY),b=reduced?.5:.5+.5*Math.sin(t*3.1+(h%628)/100),a=(cmd.alpha??255)/255;
  c.globalAlpha=a;
  if(halo){c.globalCompositeOperation='lighter';c.globalAlpha=a*(.34+.26*b);c.drawImage(halo,cx-17,cy-17,34,34);c.globalCompositeOperation='source-over';c.globalAlpha=a}
  c.fillStyle=S.rgba(S.mix(pal.block.shadow,M.coralDeep,.3),.72);c.fillRect(x+.4,y+.4,15.2,15.2);
  // Faceted coral crystal filling the collision footprint.
  const k=reduced?0:Math.sin(t*2+(h%97))*.6;
  c.beginPath();c.moveTo(cx,y+.6+k*.3);c.lineTo(x+15.4,y+5.2);c.lineTo(cx,cy);c.lineTo(x+.6,y+5.2);c.closePath();c.fillStyle='#ffc1b0';c.fill();
  c.beginPath();c.moveTo(x+15.4,y+5.2);c.lineTo(x+15.4,y+10.8);c.lineTo(cx,y+15.4-k*.3);c.lineTo(cx,cy);c.closePath();c.fillStyle=M.coralDeep;c.fill();
  c.beginPath();c.moveTo(x+.6,y+5.2);c.lineTo(cx,cy);c.lineTo(cx,y+15.4-k*.3);c.lineTo(x+.6,y+10.8);c.closePath();c.fillStyle=M.coral;c.fill();
  c.globalAlpha=a*(.45+.45*b);c.fillStyle='#fff3ea';c.beginPath();c.moveTo(cx,cy-3.2);c.lineTo(cx+1.7,cy);c.lineTo(cx,cy+3.2);c.lineTo(cx-1.7,cy);c.closePath();c.fill();
 }
 c.globalAlpha=1;return n;
}
function polishShards(c,cells,scene,t,reduced){
 const S=root.MongyuStagecraft,M=root.MongyuNativePalette.MEANING,halo=S.glow(M.gold,64);let n=0;
 for(const cmd of cells){
  if(cmd.role!=='cell-decoration')continue;n++;
  const q=point(cmd.screenX,cmd.screenY,scene),h=cellHash(cmd.x,cmd.y+cmd.kind*7),fade=(cmd.alpha??255)/255,big=(cmd.kind===2?1.12:1)*(.5+.5*fade),b=reduced?.5:.5+.5*Math.sin(t*2.6+(h%628)/100),angle=reduced?Math.PI/8:t*1.5+cmd.kind*.8,bob=reduced?0:Math.sin(t*2.2+h%11)*1.1;
  c.globalAlpha=(cmd.alpha??255)/255;
  if(halo){c.globalCompositeOperation='lighter';c.globalAlpha*=.42+.3*b;c.drawImage(halo,q.x-18*big,q.y+bob-18*big,36*big,36*big);c.globalCompositeOperation='source-over';c.globalAlpha=(cmd.alpha??255)/255}
  c.save();c.translate(q.x,q.y+bob);c.rotate(angle);c.scale(big,big);
  c.beginPath();c.moveTo(0,-8);c.lineTo(3.6,-1);c.lineTo(0,8);c.closePath();c.fillStyle=M.gold;c.fill();
  c.beginPath();c.moveTo(0,-8);c.lineTo(-3.6,1);c.lineTo(0,8);c.closePath();c.fillStyle=M.goldLight;c.fill();
  c.beginPath();c.moveTo(0,-8);c.lineTo(3.6,-1);c.lineTo(0,8);c.lineTo(-3.6,1);c.closePath();c.strokeStyle='rgba(255,250,232,.85)';c.lineWidth=.7;c.stroke();
  c.globalAlpha*=.55+.45*b;c.fillStyle='#fffaf0';c.fillRect(-.6,-4.5,1.2,9);
  c.restore();
 }
 c.globalAlpha=1;return n;
}
const bossBuffer={x:new Float64Array(256),y:new Float64Array(256)};
function polishBoss(c,cells,scene,pal,t,reduced){
 const S=root.MongyuStagecraft,M=root.MongyuNativePalette.MEANING,X=bossBuffer.x,Y=bossBuffer.y;let n=0,sx=0,sy=0,minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9;
 for(const cmd of cells){if(cmd.role!=='terrain-cell'||cmd.raw!==BOSS_RAW||n>=X.length)continue;const r=tileBounds(cmd,scene);X[n]=r.x;Y[n]=r.y;n++;sx+=r.x+8;sy+=r.y+8;minX=Math.min(minX,r.x);maxX=Math.max(maxX,r.x+16);minY=Math.min(minY,r.y);maxY=Math.max(maxY,r.y+16)}
 if(!n)return 0;
 const breath=reduced?.5:.5+.5*Math.sin(t*1.7),halo=S.glow(M.coralDeep,96),size=Math.max(maxX-minX,maxY-minY)*1.5;
 if(halo){c.globalCompositeOperation='lighter';c.globalAlpha=.3+.18*breath;c.drawImage(halo,sx/n-size/2,sy/n-size/2,size,size);c.globalCompositeOperation='source-over';c.globalAlpha=1}
 // Thin coral threads tie neighbouring plates into one broken memory.
 c.beginPath();for(let i=0;i<n;i++)for(let j=0;j<n;j++){const dx=X[j]-X[i],dy=Y[j]-Y[i];if((dx>8&&dx<24&&Math.abs(dy)<8)||(dy>8&&dy<24&&Math.abs(dx)<8)){c.moveTo(X[i]+8,Y[i]+8);c.lineTo(X[j]+8,Y[j]+8)}}
 c.strokeStyle=S.rgba(M.coral,.35+.25*breath);c.lineWidth=2.2;c.stroke();
 const plate=S.mix(pal.block.shadow,M.coralDeep,.38),lit=S.mix(plate,M.coral,.42),rim=S.rgba(M.coral,.95);
 c.beginPath();for(let i=0;i<n;i++)c.rect(X[i]+1,Y[i]+1,14,14);c.fillStyle=plate;c.fill();
 c.beginPath();for(let i=0;i<n;i++){c.moveTo(X[i]+1,Y[i]+1);c.lineTo(X[i]+15,Y[i]+1);c.lineTo(X[i]+1,Y[i]+15);c.closePath()}c.fillStyle=lit;c.fill();
 c.beginPath();for(let i=0;i<n;i++)c.rect(X[i]+1.5,Y[i]+1.5,13,13);c.strokeStyle=rim;c.lineWidth=1;c.stroke();
 // A slowly turning ornament on each plate.
 for(let i=0;i<n;i++){const a=reduced?Math.PI/4:t*.9+i*.55,s=3.6+(reduced?0:Math.sin(t*2.3+i)*.7);
  c.save();c.translate(X[i]+8,Y[i]+8);c.rotate(a);c.fillStyle='#ffb6a4';c.fillRect(-s/2,-s/2,s,s);c.fillStyle='#fff1e9';c.fillRect(-s/5,-s/5,s/2.5,s/2.5);c.restore();
 }
 return n;
}
function polishGroup(c,group,scene,pal,t,reduced){
 const blocks=polishBlocks(c,group.cells,scene,pal,group.overhangs),boss=polishBoss(c,group.cells,scene,pal,t,reduced),crystals=polishCrystals(c,group.cells,scene,pal,t,reduced),shards=polishShards(c,group.cells,scene,t,reduced);
 return {blocks,boss,crystals,shards};
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
function effects(c,group,scene,p,polish=false){
 c.save();c.fillStyle=polish?'#ffeca5':p[3];c.strokeStyle=c.fillStyle;c.lineWidth=1.5;
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
function morph(c,geo,scene,run,opt,p,u,player,pal=null){
 const t=scene.transition,b=t.buffers;if(!b)return;const mix=(a,z)=>a+(z-a)*u;
 const n=Math.min(200,t.count,b.oldX.length,b.newX.length);
 for(let i=0;i<n;i++){
  const q=point(mix(b.oldX[i],b.newX[i]),mix(b.oldY[i],b.newY[i]),scene),frame=u<.5?b.oldCommands[i]:b.newCommands[i],x=q.x-(scene.mask?8:0),y=q.y-(scene.mask?8:16);
  if(pal){c.fillStyle=pal.block.side;c.fillRect(x,y,15.4,15.4);c.fillStyle=pal.block.top;c.fillRect(x,y,15.4,3.6);c.fillStyle=pal.block.shadow;c.fillRect(x,y+11.6,15.4,3.8);continue}
  c.fillStyle=frame===2?p[2]:p[1];c.fillRect(x,y,15,15);
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
 const art=root.MongyuStagecraft,pal=polishEdition()&&art?.sky?chapterPalette(geo,run):null,profile=pal?null:root.MongyuMapDirection?.describe(run),backdrop=pal?art.mix(pal.sky[0],pal.sky[1],.5):art?.backgroundAt(scene,p,opt.viewport,cam.width/2,cam.height/2,reduced),actorInk=art?.inkFor(backdrop,M.look().body);opt={...opt,actorInk};
 const clock=pal?fieldClock(run,opt):0;let polishStats=null;
 c.save();if(pal){art.sky(c,opt.viewport,pal.index,cam,clock,reduced);polishStats={blocks:0,boss:0,crystals:0,shards:0}}else{background(c,opt.viewport,scene,p,reduced);c.fillStyle='#20183645';c.fillRect(0,0,cam.width,cam.height)}if(art&&profile){const colors=root.MongyuNativePalette?.get(scene.palette).colors,basis=M.actorBasis(player);art.draw(c,cam,profile,p,fieldClock(run,opt),reduced,{intensity:opt.dreamIntensity,colors:colors?[colors[0],colors[2],colors[4],colors[5]]:undefined,focus:{x:(player.x+basis.nx*21.25)*cam.scale+cam.offsetX,y:(player.y+basis.ny*21.25)*cam.scale+cam.offsetY},tempo:root.MONGYU_EMBEDDED_MUSIC?.[profile.recordingId]?.bpm||120,morph:scene.transition?progress:0})}c.translate(cam.offsetX,cam.offsetY);c.scale(cam.scale,cam.scale);
 for(const group of scene.groups){
  c.save();if((scene.split||stageHud)&&group.clip){c.beginPath();c.rect(group.clip.x,group.clip.y,group.clip.width,group.clip.height);c.clip()}
  if(pal){const s=polishGroup(c,group,scene,pal,clock,reduced);for(const k in s)polishStats[k]+=s[k]}
  else for(const cell of group.cells){if(!group.overhangs?.has(cell))tile(c,cell,scene,p,0,0,reduced)}c.globalAlpha=1;
  if(!reduced)effects(c,group,scene,p,!!pal);
  if(scene.split){for(const command of group.actors){const q=actorPose(command,geo,scene);if(!q)continue;if(command.role==='history-actor')M.dog(c,q,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},reduced);else M.sprite(c,q,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},reduced,geo.characterId)}}
  c.restore();
 }
 if(scene.transition)morph(c,geo,scene,run,opt,p,progress,player,pal);
 if(!scene.split&&!scene.transition){
  const visible=scene.groups.some(g=>g.actors.some(a=>a.role==='current-actor'));
  if(geo.companion)M.dog(c,geo.companion,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},reduced);
  if(visible||scene.groups.length===0){
   const player=root.MONGYU_DREAM_EDITION===true&&scene.phase==='countdown'?{...geo.player,pose:'stand'}:geo.player;
   M.sprite(c,player,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},reduced,geo.characterId);
  }
  if(!readableNotices&&scene.phase==='notification'){
   const q=geo.player,x=q.x+10,y=q.y-q.bodyHeight-14;c.save();c.fillStyle=pal?'#fff4dc':p[3];c.beginPath();c.ellipse(x,y,15,10,0,0,Math.PI*2);c.fill();c.font='600 14px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle=pal?pal.block.shadow:p[1];c.fillText('…',x,y-2);c.restore();
  }
 }else if(scene.transition?.boss)M.sprite(c,geo.player,{poseTime:opt.presentationTime||0,contrast:true,ink:opt.actorInk},reduced,geo.characterId);
 c.restore();
 if(geo.boss&&geo.boss.maxHp>0){c.save();const w=Math.min(140,cam.width*.35),x=(cam.width-w)/2,y=64;c.fillStyle=pal?'rgba(20,14,32,.6)':p[1];c.fillRect(x,y,w,4);c.fillStyle=pal?root.MongyuNativePalette.MEANING.coral:p[3];c.fillRect(x,y,w*clamp(geo.boss.hp/geo.boss.maxHp,0,1),4);c.restore()}
 if(scene.countdown>0){
  const x=cam.width/2,y=cam.height*.29;
  c.save();c.translate(x,y);c.fillStyle='#20182ded';
  if(stageHud){
   c.beginPath();c.moveTo(0,-27);c.lineTo(27,0);c.lineTo(0,27);c.lineTo(-27,0);c.closePath();c.fill();
   c.strokeStyle='#fff0d67d';c.lineWidth=1;c.stroke();
   c.textAlign='center';c.textBaseline='middle';c.font='750 24px system-ui';c.fillStyle='#fff0d6';
   c.fillText(String(Math.ceil(scene.countdown/10)),0,1);c.restore();
  }else{
  if(typeof c.roundRect==='function'){c.beginPath();c.roundRect(-68,-34,136,68,18);c.fill()}else c.fillRect(-68,-34,136,68);
  c.textAlign='center';c.textBaseline='middle';c.font='750 27px system-ui';c.fillStyle='#fff0d6';
  c.fillText(String(Math.ceil(scene.countdown/10)),0,-6);
  c.font='600 11px system-ui';c.fillText('곧 달리기 시작',0,18);c.restore();
  }
 }
 const shown=scene.transition?.boss?geo.player:player,basis=shown?M.actorBasis(shown):null,half=(shown?.bodyHeight||42.5)/2;
 const actor=shown&&Number.isFinite(shown.x)&&Number.isFinite(shown.y)?{x:(shown.x+basis.nx*half)*cam.scale+cam.offsetX,y:(shown.y+basis.ny*half)*cam.scale+cam.offsetY,footX:shown.x*cam.scale+cam.offsetX,footY:shown.y*cam.scale+cam.offsetY}:null;
 return {kind:'r38-square',camera:cam,actor,polish:polishStats,nativePhase:scene.phase,nativeGroups:scene.groups.length,nativeCells:scene.groups.reduce((n,g)=>n+g.cells.length,0),nativeLayout:scene.split?'partitioned':'single',zoom:1,speech:readableNotices?speech(run,scene,player,cam,M):null};
}
const api={snapshot,geometry,overview,point,tileBounds,scenePalette,cellStyle,tile,actorPose,morphPlayer,draw};root.MongyuNativeScene=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
