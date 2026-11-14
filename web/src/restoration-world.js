/* Original-authored encounters. R39 traversal/feedback do not rescale objective or cue clocks. */
(function(root){'use strict';
const ObservedEncounter=root.MongyuObservedEncounter?.ObservedEncounter||(typeof require==='function'?require('./observed-encounter.js').ObservedEncounter:null);
const FaceCounter=root.MongyuFaceCounter?.FaceCounter||(typeof require==='function'?require('./face-counter.js').FaceCounter:null);
const StagePolicy=root.MongyuRestorationStagePolicy||(typeof require==='function'?require('./restoration-stage-policy.js'):null);
// Session phase survives retries and mission changes. Zero is an explicit
// authored startup choice, not a proven native first-visible-map phase.
const stageSession={previousVariant:0,phaseSource:'authored-startup-phase-0',selections:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2,STEP=1/120,JUMP_SECONDS=1.10,JUMP_HEIGHT=76;
const PERIODS=['am','pm','noon','midnight'];
const periodHour={am:9,pm:18,noon:12,midnight:0};
const hourPeriod=h=>h===0?'midnight':h===12?'noon':h<12?'am':'pm';
// The native defeat flow spans about 20 updates. Seconds remain an adaptation.
const BOSS_DEFEAT_SECONDS=1.6;
// R75: authored presentation duration; native gate is actor13/16 and counter>7.
const SCORE_DEATH_SECONDS=.64;
const SETTING_SPEEDS={default:180,slow:125,fast:225},MAX_SETTING_CHANGES=64;
const WALL_HEIGHT=96,WALL_DURATION=.55,WALL_READY=.85,WALL_CLOSE=.2;
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);},wrap=v=>(v%1+1)%1;
// R46: observed contraction; amplitude, recovery placement and easing are authored.
function heartPulseScale(time){const phase=wrap(time/3.2)*3.2;if(phase<=2.6)return 1;return 1-.10*Math.sin(Math.PI*(phase-2.6)/.6)**2;}
function validSetting(name,value){return name==='speed'?typeof value==='string'&&Object.hasOwn(SETTING_SPEEDS,value):(name==='sound'||name==='vibration')&&typeof value==='boolean';}

// R49: observed low/high leg contrast; coordinates, sequence and clocks are authored.
const LEG_CYCLE=3.6,LEG_JUMP_HEIGHT=112,LEG_PATTERN=['low','high','low','low','high','high'];
function legBossFrame(size,phase,kind){
 const floor=size.height/2-45,actorX=-size.width*.32,scale=clamp((size.height-145)/380,.8,1.8),
 approach=phase<.6?0:phase<1.3?smooth((phase-.6)/.7):phase<2.2?1:1-smooth((phase-2.2)/.65),
 cx=size.width*(.27-.24*approach),windup=smooth((phase-.9)/.3)*(1-smooth((phase-2.05)/.2)),crouch=kind==='low'?28*scale*windup:0,
 hip={x:cx,y:floor-100*scale+crouch},shoulder={x:cx,y:floor-215*scale+crouch},head={x:cx-12*scale,y:floor-330*scale+crouch},
 extension=phase<2?smooth((phase-1.65)/.2):1-smooth((phase-2)/.1),height=kind==='low'?56:130,
 restFoot={x:cx-65*scale,y:floor-12-(kind==='high'?75*windup:0)},foot={x:restFoot.x+(actorX-restFoot.x)*extension,y:restFoot.y+(floor-height-restFoot.y)*extension,size:24},
 knee={x:cx-45*scale-25*extension,y:floor-45*scale-(kind==='high'?65*windup:0)+(floor-height-(floor-45*scale-(kind==='high'?65*windup:0)))*extension};
 return {kind,phase,floor,actorX,scale,approach,windup,extension,hip,shoulder,head,knee,foot,active:phase>=1.65&&phase<=2.1,
  backKnee:{x:cx+42*scale,y:floor-48*scale},backFoot:{x:cx+60*scale,y:floor-12},
  leftElbow:{x:cx-65*scale,y:shoulder.y+(kind==='high'?-25*windup:40)*scale},leftHand:{x:cx-80*scale,y:shoulder.y+(kind==='high'?70-120*windup:70)*scale},
  rightElbow:{x:cx+55*scale,y:shoulder.y+40*scale},rightHand:{x:cx+65*scale,y:shoulder.y+76*scale}};
}
function legFootPolygon(frame){const q=frame.foot,h=q.size/2;return [{x:q.x-h,y:q.y-h},{x:q.x+h,y:q.y-h},{x:q.x+h,y:q.y+h},{x:q.x-h,y:q.y+h}];}
function legBossCells(f){const cells=[],unit=clamp(12*f.scale,12,18),line=(a,b)=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/(unit+3)));for(let i=0;i<=n;i++)cells.push({x:a.x+(b.x-a.x)*i/n,y:a.y+(b.y-a.y)*i/n,size:unit})};
 const l={x:f.shoulder.x-35*f.scale,y:f.shoulder.y},r={x:f.shoulder.x+35*f.scale,y:f.shoulder.y};
 line(f.head,f.hip);line(l,r);line(l,f.leftElbow);line(f.leftElbow,f.leftHand);line(r,f.rightElbow);line(f.rightElbow,f.rightHand);line(f.hip,f.knee);line(f.knee,f.foot);line(f.hip,f.backKnee);line(f.backKnee,f.backFoot);
 for(const [x,y]of [[-1,-1],[0,-1],[1,0],[1,1],[0,2],[-1,2]])cells.push({x:f.head.x+x*(unit+3),y:f.head.y+y*(unit+3),size:unit});
 return cells;
}

const BOSS_SLOTS=[8,20,31,38,45,58,66,77,90,99];
const BOSS_RULES=[
 {id:'sun-return',family:'throw',verb:'tap',name:'흑백 탄 받아치기',instruction:'가까운 탄을 점프로 받아치세요. 공중에 다시 탄이 오면 한 번 더 누르세요. 되돌린 탄이 햇살 윤곽에 닿아야 합니다.'},
 {id:'leg-sweep',family:'dodge',verb:'tap',name:'발차기 읽기',instruction:'몸을 낮추면 점프, 무릎을 들면 바닥에서 기다리세요. 뻗는 발을 피해 12번 빈틈을 만드세요.'},
 {id:'alien-return',family:'throw',verb:'tap',name:'튕기는 탄 받아치기',instruction:'가까운 탄을 점프로 받아치세요. 공중에 다시 탄이 오면 한 번 더 누르세요. 되돌린 탄이 외계인에게 닿아야 합니다.'},
 {id:'contact-return',family:'throw',verb:'tap',name:'사각 쳐내기',instruction:'흰 사각이 손 가까이 오면 눌러 쳐내세요. 검은 사각은 눌러 뛰어넘으세요. 되돌린 사각이 얼굴에 닿아야 합니다.'},
 {id:'chain-avoid',family:'dodge',verb:'tap',name:'사슬 뛰어넘기',instruction:'내려오는 사슬을 한 번 눌러 뛰어넘으세요. 되돌아갈 때까지 부딪히지 않아야 합니다.'},
 {id:'radial-counter',family:'kick',verb:'tap',name:'회전 가지 반격',instruction:'인물은 화면을 튕기며 날아갑니다. 사각 가지가 가까이 오면 한 번 눌러 받아치세요.'},
 {id:'wave-jump',family:'dodge',verb:'tap',name:'바닥 파동 넘기',instruction:'오른쪽에서 낙하한 몸이 바닥 파동으로 밀려옵니다. 한 번 눌러 넘으세요.'},
 {id:'robot-counter',family:'kick',verb:'tap',name:'손끝 반격',instruction:'움직이는 팔과 몸이 인물 가까이 오면 한 번 눌러 받아치세요.'},
 {id:'orbit-return',family:'throw',verb:'tap',name:'회오리의 반사',instruction:'검은 사각이 손 가까이 오면 눌러 받아치세요. 파란 사각은 일찍 눌러 뛰어넘으세요. 되돌린 사각이 보스의 몸에 닿아야 합니다.'},
 {id:'heart-counter',family:'kick',verb:'tap',name:'하트 안의 비행',instruction:'하트 안을 날아갑니다. 경계나 안쪽 사각이 가까워지면 한 번 눌러 받아치세요. 초록 경계에 팔·다리가 닿아야 보스 체력이 줄어듭니다.'}
];
// Original-informed contours, newly authored coordinates. All feed the same collision track.
const CONTOURS={
 court:[[0,220],[190,220],[245,165],[245,-165],[190,-220],[-190,-220],[-245,-165],[-245,165],[-190,220]],
 corridor:[[0,220],[240,220],[240,100],[-95,100],[-95,35],[240,35],[240,-220],[-240,-220],[-240,-100],[95,-100],[95,-35],[-240,-35],[-240,220]],
 'four-chambers':[[0,150],[70,150],[70,225],[240,225],[240,65],[150,65],[150,-65],[240,-65],[240,-225],[70,-225],[70,-150],[-70,-150],[-70,-225],[-240,-225],[-240,-65],[-150,-65],[-150,65],[-240,65],[-240,225],[-70,225],[-70,150]],
 cross:[[0,225],[75,225],[75,75],[245,75],[245,-75],[75,-75],[75,-225],[-75,-225],[-75,-75],[-245,-75],[-245,75],[-75,75],[-75,225]],
 dispersal:[[0,120],[110,225],[210,180],[145,70],[245,-20],[220,-150],[95,-100],[0,-225],[-95,-100],[-220,-150],[-245,-20],[-145,70],[-210,180],[-110,225]]
};
function contourPoints(vertices,N,sx,sy){const rounded=[];for(let i=0;i<vertices.length;i++){const a=vertices[(i+vertices.length-1)%vertices.length],b=vertices[i],d=vertices[(i+1)%vertices.length],la=Math.hypot(a[0]-b[0],a[1]-b[1]),ld=Math.hypot(d[0]-b[0],d[1]-b[1]),r=Math.min(24,la*.3,ld*.3),p=[b[0]+(a[0]-b[0])*r/la,b[1]+(a[1]-b[1])*r/la],q=[b[0]+(d[0]-b[0])*r/ld,b[1]+(d[1]-b[1])*r/ld];for(let j=0;j<=8;j++){const t=j/8;rounded.push({x:((1-t)**2*p[0]+2*(1-t)*t*b[0]+t*t*q[0])*sx,y:((1-t)**2*p[1]+2*(1-t)*t*b[1]+t*t*q[1])*sy});}}rounded.push({...rounded[0]});const raw=measureTrack({points:rounded});return Array.from({length:N+1},(_,i)=>{const p=atTrack(raw,i===N?0:i/N);return {x:p.baseX,y:p.baseY};});}
const PHRASES=[
 ['spike','spike','gap','beam','pair','kick','spike','wave'],
 ['beam','spike','beam','gap','kick','pair','beam','switch'],
 ['gap','spike','pair','gap','beam','kick','wave','spike'],
 ['pulse','spike','beam','pulse','kick','gap','pair','wave'],
 ['pair','beam','spike','gap','pair','kick','beam','switch'],
 ['kick','spike','beam','kick','wave','gap','pair','spike'],
 ['switch','beam','gap','spike','kick','pair','wave','spike'],
 ['wave','spike','gap','beam','kick','wave','pair','switch'],
 ['spike','gap','kick','beam','pair','switch','wave','spike'],
 ['beam','kick','spike','wave','gap','pair','switch','spike']
];
// R70: authored closed support contours, informed by the observed diagonal
// passage and the help's three-cell obstacle threshold. Low-step automatic
// traversal is an adaptation; these are support, not extra hazard entities.
const SUPPORT_CONTOURS={
 'diagonal-channel':[[-160,220],[245,-195],[220,-220],[160,-220],[-245,195],[-220,220]],
 'stepped-waist':[[245,220],[245,85],[105,85],[105,-85],[245,-85],[245,-220],[-245,-220],[-245,-85],[-105,-85],[-105,85],[-245,85],[-245,220]],
 // The source's narrow strip/pillars do not establish every cell's collision.
 // These alternating rectangular intrusions are explicitly authored support.
 'pillar-strip':[[-110,220],[110,220],[110,90],[60,90],[60,20],[110,20],[110,-220],[-110,-220],[-110,-90],[-60,-90],[-60,-20],[-110,-20]],
 'support-steps':[[245,220],[245,-220],[-245,-220],[-245,220],[0,220],[60,220],[60,188],[100,188],[100,220],[145,220],[145,156],[200,156],[200,220]]
};
// R71: two separated winding boundaries, joined by authored end returns.
// Rotate the same physical channel for the vertical family, keeping its
// longitudinal extent within the ordinary court envelope.
const waveEdge=Array.from({length:25},(_,i)=>{const x=-245+i*490/24;return [x,35*Math.sin(x/245*TAU)];});
SUPPORT_CONTOURS['horizontal-wave-bands']=[...waveEdge.map(([x,y])=>[x,y+145]),...waveEdge.slice().reverse().map(([x,y])=>[x,y-145])];
SUPPORT_CONTOURS['vertical-wave-bands']=SUPPORT_CONTOURS['horizontal-wave-bands'].map(([x,y])=>[-y*.65,x*220/245]);
function movingCourtFrame(size,age=0){const phase=TAU*Math.max(0,age)/8;return {age:Math.max(0,age),scale:.66+.10*Math.cos(phase),x:size.width*.08*Math.sin(phase),y:size.height*.06*Math.sin(phase*2),authored:true};}
function moveCourtTrack(base,size,age){const motion=movingCourtFrame(size,age);return measureTrack({kind:'moving-court',closed:true,motion,points:base.points.map(p=>({x:p.x*motion.scale+motion.x,y:p.y*motion.scale+motion.y}))});}
function supportContourPoints(vertices,N,sx,sy){
 const lengths=vertices.map((a,i)=>{const b=vertices[(i+1)%vertices.length];return Math.hypot((b[0]-a[0])*sx,(b[1]-a[1])*sy);}),total=lengths.reduce((a,b)=>a+b,0),counts=lengths.map(l=>Math.max(1,Math.floor(N*l/total)));
 while(counts.reduce((a,b)=>a+b,0)<N){let best=0;for(let i=1;i<counts.length;i++)if(N*lengths[i]/total-counts[i]>N*lengths[best]/total-counts[best])best=i;counts[best]++;}
 while(counts.reduce((a,b)=>a+b,0)>N){let best=counts.findIndex(n=>n>1);for(let i=0;i<counts.length;i++)if(counts[i]>1&&counts[i]-N*lengths[i]/total>counts[best]-N*lengths[best]/total)best=i;counts[best]--;}
 const points=[];for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length];for(let j=0;j<counts[i];j++){const f=j/counts[i];points.push({x:(a[0]+(b[0]-a[0])*f)*sx,y:(a[1]+(b[1]-a[1])*f)*sy});}}points.push({...points[0]});return points;
}
function buildTrack(kind='rounded-rectangle',size=1){
 const points=[],N=192,heartFit=typeof size==='object'?Math.min((size.width-80)/490,(size.height-100)/440):size,
 sx=typeof size==='object'?(kind==='heart'?heartFit:(size.width-80)/490):size,sy=typeof size==='object'?(kind==='heart'?heartFit:(size.height-100)/440):size;
 if(kind==='moving-court'){const frame=typeof size==='object'?size:{width:570*size,height:540*size};return moveCourtTrack(buildTrack('court',size),frame,0);}
 if(SUPPORT_CONTOURS[kind]){const vertices=kind==='support-steps'?SUPPORT_CONTOURS[kind].map(([x,y])=>[x,y===188?220-32/sy:y===156?220-64/sy:y]):SUPPORT_CONTOURS[kind];return measureTrack({kind,points:supportContourPoints(vertices,N,sx,sy),closed:true,...(kind==='support-steps'?{supportSteps:{heights:[32,64],cellSize:32,authored:true,automatic:true}}:{})});}
 if(kind==='four-chambers'){
  // One rectangular simulation is presented through four synchronized views.
  for(let i=0;i<=N;i++){const a=Math.PI/2-i/N*TAU,c=Math.cos(a),s=Math.sin(a),m=Math.max(Math.abs(c),Math.abs(s));points.push({x:245*c/m*sx,y:220*s/m*sy});}
  return measureTrack({kind,points,closed:true});
 }
 if(CONTOURS[kind])return measureTrack({kind,points:contourPoints(CONTOURS[kind],N,sx,sy),closed:true});
 for(let i=0;i<=N;i++){
  const u=i/N,a=Math.PI/2-u*TAU;let x,y;
  if(kind==='rounded-rectangle'){
   const c=Math.cos(a),s=Math.sin(a);x=245*Math.sign(c)*Math.pow(Math.abs(c),.48);y=220*Math.sign(s)*Math.pow(Math.abs(s),.48);
  }else if(kind==='hourglass'){
   x=255*Math.cos(a)*(.52+.48*Math.abs(Math.sin(a)));y=235*Math.sin(a);
  }else if(kind==='nested-loop'){
   const theta=Math.PI/2-u*TAU*2,r=1-.46*Math.sin(Math.PI*u)**2;x=245*r*Math.cos(theta);y=220*r*Math.sin(theta);
  }else if(kind==='heart'){
   const th=Math.PI-u*TAU;x=15.3*16*Math.sin(th)**3;y=-14*(13*Math.cos(th)-5*Math.cos(2*th)-2*Math.cos(3*th)-Math.cos(4*th));
  }else{
   const r=.74+.22*Math.cos(4*a);x=255*r*Math.cos(a);y=235*r*Math.sin(a);
  }
  points.push({x:x*sx,y:y*sy});
 }
 return measureTrack({kind,points,closed:true});
}
function measureTrack(track){let length=0;const lengths=[0];for(let i=1;i<track.points.length;i++){length+=Math.hypot(track.points[i].x-track.points[i-1].x,track.points[i].y-track.points[i-1].y);lengths.push(length)}return {...track,length,lengths};}
function atTrack(track,u,height=0,reverse=false){
 u=clamp(u,0,.999999999);const positions=track.supportPhases||track.lengths,distance=track.supportPhases?u:u*track.length;let lo=0,hi=positions.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(positions[m]<=distance)lo=m;else hi=m}
 const a=track.points[lo],b=track.points[lo+1],span=positions[lo+1]-positions[lo],f=span?(distance-positions[lo])/span:0;
 let dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
 // Opposite edges can collapse at a morph midpoint; retain a unit nearby tangent.
 for(let i=1;length<1e-9&&i<track.points.length;i++){const k=(lo+i)%(track.points.length-1);dx=track.points[k+1].x-track.points[k].x;dy=track.points[k+1].y-track.points[k].y;length=Math.hypot(dx,dy)}
 const tx=length?dx/length:1,ty=length?dy/length:0,normal={x:ty,y:-tx},baseX=a.x+(b.x-a.x)*f,baseY=a.y+(b.y-a.y)*f;
 return {x:baseX+normal.x*height,y:baseY+normal.y*height,baseX,baseY,tangent:{x:reverse?-tx:tx,y:reverse?-ty:ty},inward:normal,angle:Math.atan2(reverse?-ty:ty,reverse?-tx:tx),face:Math.min(3,Math.floor(u*4)),height,turning:false,turnProgress:0};
}
function wallPose(track,anchor,travel,progress,startHeight){
 const s=clamp(progress,0,1),p=atTrack(track,wrap(travel/1800)),blend=smooth((s-.35)/.30),height=s<.35?startHeight+(WALL_HEIGHT+8-startHeight)*smooth(s/.35):s<=.65?WALL_HEIGHT+8:(WALL_HEIGHT+8)*(1-smooth((s-.65)/.35)),baseX=anchor.baseX+(p.baseX-anchor.baseX)*blend,baseY=anchor.baseY+(p.baseY-anchor.baseY)*blend;
 const turn=smooth((s-.65)/.35),tx=anchor.tangent.x+(p.tangent.x-anchor.tangent.x)*turn,ty=anchor.tangent.y+(p.tangent.y-anchor.tangent.y)*turn,n=Math.hypot(tx,ty)||1,tangent={x:tx/n,y:ty/n},inward={x:tangent.y,y:-tangent.x};
 return {...p,baseX,baseY,x:baseX+anchor.inward.x*height,y:baseY+anchor.inward.y*height,tangent,inward,angle:Math.atan2(tangent.y,tangent.x),height,climbing:s<1,climbProgress:s};
}
function wallPolygon(p,width=18){const point=(x,y)=>({x:p.baseX+p.tangent.x*x+p.inward.x*y,y:p.baseY+p.tangent.y*x+p.inward.y*y});return [point(8,0),point(8,WALL_HEIGHT),point(8+width,WALL_HEIGHT),point(8+width,0)];}
function bodyPolygon(p){const point=(x,y)=>({x:p.x+p.tangent.x*x+p.inward.x*y,y:p.y+p.tangent.y*x+p.inward.y*y});return [point(-8,0),point(8,0),point(8,60),point(-8,60)];}
function overlaps(a,b){for(const poly of [a,b])for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],nx=q.y-p.y,ny=p.x-q.x,pa=a.map(v=>v.x*nx+v.y*ny),pb=b.map(v=>v.x*nx+v.y*ny);if(Math.max(...pa)<=Math.min(...pb)+1e-6||Math.max(...pb)<=Math.min(...pa)+1e-6)return false;}return true;}
const wallClearanceCache=new Map();
function wallClearance(track,time){
 const xs=track.points.map(p=>p.x),ys=track.points.map(p=>p.y),key=[track.kind,track.length,Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys),time].join(':');if(wallClearanceCache.has(key))return wallClearanceCache.get(key);
 let clear=true;
 // The opening encounter cannot morph before this wall. Check every sampled
 // contact phase from any 125..225 speed history, then the entire climb envelope.
 for(let i=0;i<=32&&clear;i++){const travel=time*(125+100*i/32),anchor=atTrack(track,wrap(travel/1800)),wall=wallPolygon(anchor);
  for(let j=0;j<=40&&clear;j++){const s=j/40;for(const speed of [125,150,180,200,225]){const p=wallPose(track,anchor,travel+speed*WALL_DURATION*s,s,40);if(overlaps(bodyPolygon(p),wall)){clear=false;break;}}}
 }
 if(wallClearanceCache.size>=32)wallClearanceCache.delete(wallClearanceCache.keys().next().value);wallClearanceCache.set(key,clear);return clear;
}
const TRACK_KINDS=['rounded-rectangle','hourglass','nested-loop','radial','court','corridor','four-chambers','cross','dispersal'];
// Separate schedule: original nine mission/save indices are never extended.
const FREEPLAY_TRACK_KINDS=['diagonal-channel','support-steps','horizontal-wave-bands','vertical-wave-bands','stepped-waist','pillar-strip','moving-court',...TRACK_KINDS];
const SUPPORT_DWELL_KINDS=new Set(FREEPLAY_TRACK_KINDS.slice(1,7));
function copySlot(slot){return slot&&slot.rule?slot:{id:'r38-003',number:3,title:'사각의 길',ruleId:'r38-003:run-score',rule:{type:'run-score',target:300},physical:true,traversal:'square-run',characterId:'walker'};}
function segmentContact(a,b,c,d){const ux=b.x-a.x,uy=b.y-a.y,vx=d.x-c.x,vy=d.y-c.y,den=ux*vy-uy*vx;
 if(Math.abs(den)<1e-9)return null;
 const dx=c.x-a.x,dy=c.y-a.y,t=(dx*vy-dy*vx)/den,u=(dx*uy-dy*ux)/den;
 return t>=-1e-8&&t<=1+1e-8&&u>=-1e-8&&u<=1+1e-8?{x:a.x+t*ux,y:a.y+t*uy,t:clamp(t,0,1)}:null;
}
function boundaryContact(track,segment){let hit=null;for(let i=1;i<track.points.length;i++){const p=segmentContact(segment.from,segment.to,track.points[i-1],track.points[i]);if(p&&(!hit||p.t<hit.t))hit={...p,edge:i-1};}return hit;}
function boundaryDistance(track,q){let best=Infinity;for(let i=1;i<track.points.length;i++){const a=track.points[i-1],b=track.points[i],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;if(l<1e-12)continue;const t=clamp(((q.x-a.x)*dx+(q.y-a.y)*dy)/l,0,1);best=Math.min(best,Math.hypot(q.x-a.x-t*dx,q.y-a.y-t*dy));}return best;}
class RestorationRun{
 constructor(options={}){
  this.freePlay=options.freePlay===true;this.seed=Number.isSafeInteger(options.seed)?options.seed>>>0:this.freePlay?Math.floor(Math.random()*4294967296):1;
  this.options={...options};this.viewport=options.viewport||null;this.pendingViewport=null;this.configureViewport();this.slot=copySlot(options.slot);this.rule=this.freePlay?{type:'free-run'}:this.slot.rule;this.characterId=this.rule.characterId||options.characterId||this.slot.characterId||'walker';if(!['walker','dog','elder','woman'].includes(this.characterId))this.characterId='walker';this.mode='restoration';this.period=PERIODS.includes(options.period)?options.period:'am';this.attempt=Number.isSafeInteger(options.attempt)&&options.attempt>0?options.attempt:1;this.practice=options.practice===true||this.freePlay;this.familyIndex=Math.floor((this.slot.number-1)/10)%10;this.events=[];this.state='title';this.reset();this.state='title';
 }
 configureViewport(){const v=this.viewport;if([8,31,45,58,66,77,90,99].includes(this.options?.slot?.number)&&Number.isFinite(v?.width)&&Number.isFinite(v?.height)&&v.width>24&&v.height>24){const ratio=(v.width-24)/(v.height-24);this.worldSize=ratio>1?{width:clamp(570*ratio,570,1800),height:570}:{width:570,height:clamp(570/ratio,570,1800)};return;}if(!v||!Number.isFinite(v.width)||!Number.isFinite(v.height)){this.worldSize={width:570,height:540};return;}this.worldSize=v.width>v.height?{width:clamp(570*(v.width-32)/Math.max(100,v.height-28),570,1100),height:570}:{width:570,height:clamp(570*(v.height-130)/Math.max(100,v.width-24),570,1000)};}
 setViewport(width,height){if(this.encounter&&['play','pause'].includes(this.state)&&Number.isFinite(width)&&Number.isFinite(height)&&width>0&&height>0){if(this.viewport?.width===width&&this.viewport?.height===height)return true;this.pendingViewport={width,height};this.wallResizePending=true;this.pause();return false;}if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return false;if(this.viewport?.width===width&&this.viewport?.height===height)return true;if(this.state==='play'||this.wallLocked()||this.transform||this.heartLocked()||this.legLocked()||this.faceLocked()){this.pendingViewport={width,height};if(this.wallLocked()||this.transform||this.heartLocked()||this.legLocked()||['boundary-strike','leg-sweep','contact-return'].includes(this.bossRule?.id))this.wallResizePending=true;return false;}return this.applyViewport(width,height);}
 applyViewport(width,height){this.wallResizePending=false;const old=this.worldSize;this.viewport={width,height};this.pendingViewport=null;this.configureViewport();if(this.track){this.track=buildTrack(this.track.kind,this.worldSize);this.heartBaseTrack=null;this.updateHeartTrack();this.movingCourtBaseTrack=null;this.updateMovingCourtTrack();}this.transform=null;if(this.room){this.room.width=this.worldSize.width;this.room.height=this.worldSize.height;this.room.perimeter=this.track.length;}if(this.boss){this.boss.width=this.worldSize.width*.70;this.boss.height=this.worldSize.height*(this.bossIndex===1?.80:.67);this.boss.y=-this.worldSize.height*.10;}if(this.faceCounter)this.faceCounter.reframe(this.worldSize.width,this.worldSize.height);for(const p of this.projectiles||[]){for(const q of [p,p.from,p.target]){q.x*=this.worldSize.width/old.width;q.y*=this.worldSize.height/old.height;}}return true;}
 reset(selectStage=false){
  if(this.pendingViewport){this.viewport=this.pendingViewport;this.pendingViewport=null;this.configureViewport();}
  this.settings={speed:'default',sound:true,vibration:true};for(const name of Object.keys(this.settings))if(validSetting(name,this.options.settings?.[name]))this.settings[name]=this.options.settings[name];
  if(validSetting(this.options.setting,this.options.settingValue))this.settings[this.options.setting]=this.options.settingValue;
  this.speed=SETTING_SPEEDS[this.settings.speed];this.settingChanges=[];this.settingCredit=null;this.boundaryStrike=null;this.boundaryStrikeCount=0;this.heartBaseTrack=null;this.heartPulse=1;this.wallClimb=null;this.wallClimbs=0;this.wallMisses=0;this.wallResizePending=false;this.layoutStarted=0;
  this.expression=null;this.expressionAfter=0;this.expressionSequence=0;
  // R69: slots70/91 show repeated horizontal then vertical strips. One
  // canonical rectangle owns all contact; the 3s safe-gap switch is authored.
  this.stripeOrientation=!this.freePlay&&[70,91].includes(this.slot.number)?'horizontal':null;
  this.supportStepsExitTravel=0;this.supportExitTravel=0;this.movingCourtBaseTrack=null;
  this.impact=null;this.landingElapsed=0;this.poseClock=0;this.inputCount=0;this.wave=0;this.randomState=this.seed;this.deferredFold=false;this.pendingTrackIndex=null;this.phraseStep=0;
  if(this.freePlay){this.familyIndex=Math.floor(this.random()*10);this.characterId=['walker','dog','elder','woman'][Math.floor(this.random()*4)];}
  this.patternId='r40-'+(this.freePlay?'free-'+this.seed:this.slot.number)+'-'+this.familyIndex;
  this.time=0;this.runTime=0;this.score=0;this.hits=0;this.jumps=0;this.kicks=0;this.shots=0;this.dodges=0;this.counters=0;this.wavePasses=0;this.mapChanges=0;this.combo=0;this.bestCombo=0;this.passed=0;this.perfect=0;this.retries=0;this.damageTypeCounts={};this.damageScores=[];this.damageHours=[];this.damageTypes=[];this.kickHours=[];this.clockSample=null;this.bossDefeatElapsed=null;this.feedback=null;this.result=null;this.jumpElapsed=-1;this.kickElapsed=0;this.held=false;this.holdStarted=0;this.buffered=false;this.projectiles=[];this.lastShot=-10;this.portalMissed=false;this.portalPassed=false;this.bossDamage=0;this.lastMap=0;this.lane=1;this.laneFrom=1;this.laneBlend=1;this.visualLane=1;this.cycle=-1;this.bossCycleState=null;this.pausedFrom=null;this.localCalls=0;
  // R74: native r.e initializes score=0 and life=3 on a fresh run (raw 0x30046..0x30056).
  this.initialLives=3;this.hearts=this.initialLives;this.scoreFinalization=!this.freePlay&&['cumulative-score','run-score'].includes(this.rule.type);this.deathAnimation=null;this.goalQualified=false;this.endlessCondition=this.scoreFinalization||['death-range','clock-death'].includes(this.rule.type);
  this.bossIndex=BOSS_SLOTS.indexOf(this.slot.number);this.bossRule=this.rule.type==='boss'?BOSS_RULES[this.bossIndex>=0?this.bossIndex:0]:null;
  this.boss=this.bossRule?{hp:this.rule.target||6,maxHp:this.rule.target||6,phase:'preview',ruleId:this.bossRule.id,cue:this.bossRule.instruction,x:0,y:-this.worldSize.height*.10,width:this.worldSize.width*.70,height:this.worldSize.height*(this.bossIndex===1?.80:.67),vulnerable:false}:null;
  if(['leg-sweep','contact-return'].includes(this.bossRule?.id))this.hearts=3;
  this.encounter=null;if(this.rule.type==='boss'&&[8,31,45,58,66,77,90,99].includes(this.slot.number)){this.worldSize.height=Math.max(570,this.worldSize.height);this.encounter=new ObservedEncounter(this.slot.number,this.worldSize,this.rule.target||6);this.hearts=3;this.boss.hp=this.boss.maxHp=this.encounter.maxHp;}
  this.faceCounter=this.bossRule?.id==='contact-return'?new FaceCounter(this.worldSize):null;if(this.faceCounter){this.faceCounter.start();this.faceCounter.hp=this.faceCounter.maxHp=this.rule.target||6;this.boss.hp=this.boss.maxHp=this.faceCounter.maxHp;}
  if(this.bossRule)this.familyIndex=Math.max(0,this.bossIndex);
  this.duration=this.boss?Infinity:this.rule.type==='map-change'||this.rule.type==='tutorial'?(this.rule.target||4)*5+2:this.rule.type==='run-score'||this.rule.type==='flawless-score'?Math.max(12,(this.rule.target||300)/80+3):this.rule.type==='cumulative-score'?20:14;
  if(['death-range','damage-range'].includes(this.rule.type))this.duration=Math.max(10,(this.rule.min+this.rule.max)/160+5);
  if(this.freePlay||this.endlessCondition)this.duration=Infinity;
  if(selectStage)this.selectStagePolicy(true);
  this.scoreRate=80;this.trackIndex=this.stripeOrientation?TRACK_KINDS.indexOf('four-chambers'):this.familyIndex%TRACK_KINDS.length;this.track=buildTrack(this.nativeStage?this.stageTrackKind():this.freePlay?'diagonal-channel':this.bossRule?.id==='boundary-strike'?'heart':TRACK_KINDS[this.trackIndex],this.worldSize);this.trackFrom=null;this.trackTo=null;this.transform=null;this.travel=0;this.roomIndex=0;
  this.room={id:this.slot.id,index:this.familyIndex,familyIndex:this.familyIndex,title:this.freePlay?"자유 달리기 · 1":this.slot.title,motif:this.track.kind,width:this.worldSize.width,height:this.worldSize.height,radius:0,speed:this.speed,perimeter:this.track.length};
  this.hazards=this.boss?[]:this.createHazards();this.events=[];
 }
 createHazards(){
  const list=[],type=this.rule.type;
  // Native life/death semantics, authored route. Preserve an accessible contact
  // in the narrow score window until original collision maps are recovered.
  // It is no longer sufficient by itself: the player must manage three lives.
  if(this.endlessCondition){const route=this.createPhrase(0,18,this.slot.number%10,false);if(type==='death-range'){const at=(this.rule.min+this.rule.max)/160;const target={id:this.slot.id+'-score-contact',type:'spike',time:at,damageAt:at,width:18,clearance:18,height:18,done:false,hit:false,active:true,pulseOffset:0,authoredScoreContact:true};return [...route.filter(h=>Math.abs(h.time-at)>1.1),target].sort((a,b)=>a.time-b.time);}return route;}
  if(!['death-range','damage-range','clock-death','repeated-damage'].includes(type))return this.createPhrase(0,this.freePlay?18:this.duration,this.freePlay?Math.floor(this.random()*10):this.slot.number%10,!this.freePlay);
  const add=(time,kind='spike')=>list.push({id:this.slot.id+'-h'+list.length,type:kind,time,width:kind==='pair'?44:18,clearance:18,height:18,done:false,hit:false,active:true,pulseOffset:list.length%2});
  if(['death-range','damage-range'].includes(type)){
   const target=(this.rule.min+this.rule.max)/160;add(target,'spike');list[list.length-1].damageAt=target;
   if(type==='death-range')return list;
  }else if(type==='clock-death'){add(2.5,'spike');return list;}
  else if(type==='repeated-damage'){for(let i=0;i<this.rule.target;i++)add(2.5+i*2.2,'spike');return list;}
  const kick=['kick','combined'].includes(type);
  for(let time=2.4,index=0;time<this.duration-2.4;time+=2.35,index++){
   if(list.some(h=>Math.abs(h.time-time)<1.6))continue;
   // Keep a clear landing/reorientation interval around the physical track morph.
   if(time%5<1.1||time%5>4.15)continue;
   const families=['spike','beam','gap','pulse','pair','kick','switch','wave'];
   let kind=kick?'kick':families[(this.familyIndex+index)%families.length];
   if(type==='tutorial')kind=index%2?'beam':'spike';
   add(time,kind);
  }
  if(kick&&list.filter(h=>h.type==='kick').length<(this.rule.target||this.rule.kicks||1)){
   list.length=0;for(let i=0;i<(this.rule.target||this.rule.kicks||1);i++)add(2.4+i*2.8,'kick');
  }
  add(this.duration-1.1,'portal');return list.sort((a,b)=>a.time-b.time);
 }
 random(){this.randomState=(Math.imul(this.randomState,1664525)+1013904223)>>>0;return this.randomState/4294967296;}
 stageRandom(stream,count){
  const injected=this.options[stream==='A'?'stageRngA':'stageRngB'];if(typeof injected==='function')return injected(count);
  // Separate authored LCG streams, deliberately independent of hazard RNG.
  // Native seed derivation and intervening calls have not been reconstructed.
  const key=stream==='A'?'stageRandomA':'stageRandomB';
  if(this[key]===undefined)this[key]=(this.seed^(stream==='A'?0x741a35d9:0x74b290c7))>>>0;
  this[key]=(Math.imul(this[key],1664525)+1013904223)>>>0;
  return Math.floor(this[key]/4294967296*count);
 }
 selectStagePolicy(firstSelection){
  const ordinal=StagePolicy?.ORDINARY_SLOTS.indexOf(this.slot.number)??-1;
  if(!StagePolicy||this.boss||(!this.freePlay&&ordinal<0)){this.nativeStage=null;return;}
  const session=this.options.stageSession||stageSession;
  if(!Number.isInteger(session.previousVariant)||session.previousVariant<0||session.previousVariant>3)throw new RangeError('stageSession.previousVariant required');
  const mode=this.freePlay?'freePlay':'ordinary',selectedSlot=this.freePlay?100:this.slot.number-1,
   rngA=n=>this.stageRandom('A',n),rngB=n=>this.stageRandom('B',n),previous=this.nativeStage;
  const selection=StagePolicy.selectStage({mode,selectedSlot,ordinal,previousVariant:session.previousVariant,previousGroup:previous?.group,firstSelection,rngA,rngB,maxDraws:4096});
  session.previousVariant=selection.variant;session.selections=(session.selections||0)+1;
  const paletteRecord=firstSelection?StagePolicy.initialPalette({mode,selectedSlot,rngB}):previous.paletteRecord,
   pendingPaletteRecord=firstSelection?null:StagePolicy.nextPalette({mode,selectedSlot,currentPalette:paletteRecord,rngA,maxDraws:4096});
  this.nativeStage={...selection,mode,selectedSlot,ordinal:this.freePlay?null:ordinal,paletteRecord,pendingPaletteRecord,
   phaseSource:session.phaseSource||'caller-supplied-phase',selectionNumber:session.selections,
   rngSource:this.options.stageRngA&&this.options.stageRngB?'injected-distinct-streams':'authored-distinct-LCG-streams',
   selectionSource:'recovered-one-unverified-KTF-candidate',paletteSource:'native-record-selection-authored-colors',
   timingSource:'authored-existing-fold-schedule-native-countdown-unlinked',paletteCommitSource:'authored-transform-completion',
   startupSelectionSource:'authored-run-start-treats-u.u-as-zero',geometryMappingSource:'authored-(group*4+variant)-mod-shape-count'};
 }
 stageTrackKind(){
  if(this.stripeOrientation&&this.mapChanges===0)return 'four-chambers';
  const kinds=this.freePlay?FREEPLAY_TRACK_KINDS:TRACK_KINDS;
  return kinds[(this.nativeStage.group*4+this.nativeStage.variant)%kinds.length];
 }
 stageSelectionStatus(){return this.nativeStage?{...this.nativeStage,authoredTrackKind:this.stageTrackKind(),authoredPaletteIndex:this.nativeStage.paletteRecord%10,geometryMappingSource:this.stripeOrientation&&this.mapChanges===0?'authored-stripe-mission-opening-override':this.nativeStage.geometryMappingSource}:null;}
 createPhrase(start,duration,variant,terminal){
  const list=[],sequence=PHRASES[this.familyIndex],kick=['kick','combined'].includes(this.rule.type),tutorial=this.rule.type==='tutorial',cadence=(tutorial||this.rule.type==='map-change')?1.95:1.58+(variant%4)*.07;
  let time=start+1.9+(variant%3)*.08,index=0;
  while(time<start+duration-(terminal?2.25:1.1)){
   let kind=sequence[(index+(index>1?variant%3:0))%sequence.length];if(tutorial)kind=['spike','beam','spike','gap','beam','spike'][index%6];
   if(kick&&index%3===variant%3)kind='kick';
   list.push({id:this.slot.id+'-w'+this.wave+'-h'+index,type:kind,time,width:kind==='pair'?44:18,clearance:18,height:18,done:false,hit:false,active:true,pulseOffset:(index+variant)%2,phraseStep:index,phrase:index<2?'teach':index<4?'echo':'twist'});
   time+=cadence+(index%3===1?.18:index%3===2?-.03:0);index++;
  }
  if(kick){const required=this.rule.target||this.rule.kicks||1;for(let i=0;list.filter(h=>h.type==='kick').length<required&&i<list.length;i++)list[i].type='kick';}
  // First ordinary score room and the corresponding opening free-play family
  // only: no required kicks, timed damage, bosses, or map-count objectives move.
  if(start===0&&(this.slot.number===3&&this.rule.type==='run-score'||this.freePlay&&this.familyIndex===0)&&list[0]?.type==='spike'&&list[1]?.time-2.1>=1.2&&wallClearance(this.track,2.1))Object.assign(list[0],{type:'wall',time:2.1,width:18,height:WALL_HEIGHT,clearance:WALL_HEIGHT,cellsHigh:3,cellSize:32,phase:'approach',armedAt:null});
  if(terminal)list.push({id:this.slot.id+'-exit',type:'portal',time:start+duration-1.1,width:18,clearance:18,height:18,done:false,hit:false,active:true,phraseStep:index,phrase:'finish'});
  return list;
 }
 mastery(){return {clean:this.perfect,bestChain:this.bestCombo,actions:this.inputCount,hits:this.hits};}
 runProgress(){if(this.endlessCondition)return (this.initialLives-this.hearts)/this.initialLives;return this.freePlay?(this.time%18)/18:clamp(this.time/this.duration,0,1);}
 phraseView(){const h=this.hazards.find(h=>!h.done);return {id:this.patternId,step:h?.phraseStep??this.passed,section:h?.phrase||(this.boss?'counter':'finish')};}
 advanceWave(){this.wave++;this.familyIndex=(this.familyIndex+1+Math.floor(this.random()*9))%10;this.characterId=['walker','dog','elder','woman'][Math.floor(this.random()*4)];this.patternId='r40-free-'+this.seed+'-'+this.wave+'-'+this.familyIndex;this.room.familyIndex=this.familyIndex;this.room.index=this.familyIndex;this.room.title='자유 달리기 · '+(this.wave+1);this.hazards=this.hazards.filter(h=>!h.done);this.hazards.push(...this.createPhrase(this.wave*18,18,Math.floor(this.random()*10),false));this.deferredFold=true;this.events.push('wave');}
 start(){this.reset(true);this.state='play';this.events.push('start');return true;}
 title(){this.state='title';this.held=false;this.jumpElapsed=-1;this.events=[];return true;}
 pause(){if(this.state!=='play')return false;this.encounter?.pause();this.pausedFrom=this.state;this.state='pause';this.held=false;this.buffered=false;this.events.push('pause');return true;}
 resume(){if(this.state!=='pause')return false;this.encounter?.resume();this.state=this.pausedFrom||'play';this.pausedFrom=null;this.events.push('resume');return true;}
 setSetting(name,value){
  const reject=reason=>({accepted:false,changed:false,reason});
  if(!['play','pause'].includes(this.state))return reject('inactive');
  if(this.time<=0&&!(this.rule.type==='setting'&&Number.isInteger(this.options.frontier)))return reject('not-started');
  if(!validSetting(name,value))return reject('invalid-setting');
  if(this.settings[name]===value)return reject('unchanged');
  if(this.settingChanges.length>=MAX_SETTING_CHANGES)return reject('change-limit');
  const receipt={accepted:true,changed:true,name,from:this.settings[name],value,time:this.time,score:this.score,travel:this.travel,mapChanges:this.mapChanges,state:this.state,sequence:this.settingChanges.length+1};
  this.settings[name]=value;this.options.settings={...this.settings};
  if(name==='speed'){this.speed=SETTING_SPEEDS[value];this.room.speed=this.speed;}
  if(name===(this.rule.setting||this.options.setting)){this.options.setting=name;this.options.settingValue=value;}
  this.settingChanges.push(Object.freeze(receipt));
  // Native setting credit uses the operation clock, not the finish clock or output feedback.
  if(!this.settingCredit&&!this.freePlay&&!this.practice&&this.rule.type==='setting'&&name===this.rule.setting&&this.slot.number-1!==100&&this.options.frontier===this.slot.number){
   const Catalog=root.MongyuRestorationCatalog||(typeof require==='function'?require('./restoration-catalog.js'):null),clock=this.sampleClock();if(!this.rule.period||Catalog.hourMatches(this.rule.period,clock.hour))this.settingCredit=Object.freeze({typeCode:Catalog.settingType(this.rule),credit:1,activeIndex:this.slot.number-1,frontier:this.options.frontier,setting:name,before:receipt.from,after:value,atTime:this.time,hour:clock.hour,clockSource:clock.source});
  }
  this.events.push('setting-change');return {...receipt};
 }
 settingProof(){
  const setting=this.rule.setting||this.options.setting,change=this.settingChanges.slice().reverse().find(c=>c.name===setting),settingValue=setting?this.settings[setting]:undefined;
  return {settings:{...this.settings},setting,settingValue,settingChanges:this.settingChanges.map(c=>({...c})),settingChanged:!!change,settingExperienced:!!change&&this.time>change.time+1e-9,...(this.settingCredit?{settingCredit:{...this.settingCredit}}:{})};
 }
 retry(){if(this.deathAnimation&&!this.deathAnimation.completed)return false;if(!['play','pause','fail','clear'].includes(this.state))return false;this.attempt++;this.reset(true);this.state='play';this.retries=1;this.events.push('retry');return true;}
 updateHeartTrack(){
  if(this.bossRule?.id!=='boundary-strike'||this.track?.kind!=='heart')return;
  const base=this.heartBaseTrack||(this.heartBaseTrack=this.track),scale=heartPulseScale(this.time);
  this.heartPulse=scale;
  if(scale===1){this.track=base;}else{
   if(!base.pulseOrigin){const xs=base.points.map(p=>p.x),ys=base.points.map(p=>p.y);base.pulseOrigin={x:(Math.min(...xs)+Math.max(...xs))/2,y:(Math.min(...ys)+Math.max(...ys))/2};}
   const o=base.pulseOrigin;this.track={...base,points:base.points.map(p=>({x:o.x+(p.x-o.x)*scale,y:o.y+(p.y-o.y)*scale})),length:base.length*scale,lengths:base.lengths.map(n=>n*scale)};
  }
  if(this.room)this.room.perimeter=this.track.length;
 }
 faceLocked(){return !!this.faceCounter&&(this.faceCounter.projectiles.length>0||this.faceCounter.actor().air||this.faceCounter.actor().dogHeight>0);}
 legLocked(){return this.bossRule?.id==='leg-sweep'&&(this.jumpElapsed>=0||this.time%LEG_CYCLE>=.6&&this.time%LEG_CYCLE<=2.4);}
 heartLocked(){return this.bossRule?.id==='boundary-strike'&&(this.jumpElapsed>=0||!!this.boundaryStrike);}
 wallLocked(){return !!this.wallClimb||(this.hazards||[]).some(h=>h.type==='wall'&&!h.done&&h.time-this.time<=1.4);}
 climbPose(){const c=this.wallClimb;return c?wallPose(this.track,c.anchor,this.travel,(this.time-c.started)/WALL_DURATION,c.startHeight):null;}
 height(){if(this.encounter){const a=this.encounter.model.actor();return a.height||a.lift||0;}if(this.faceCounter)return this.faceCounter.actor().height;if(this.wallClimb)return this.climbPose().height;return this.jumpElapsed>=0?(this.bossRule?.id==='boundary-strike'?48:this.bossRule?.id==='leg-sweep'?LEG_JUMP_HEIGHT:JUMP_HEIGHT)*Math.sin(Math.PI*clamp(this.jumpElapsed/JUMP_SECONDS,0,1)):0;}
 jump(){if(this.deathAnimation)return false;if(this.jumpElapsed>=0)return false;this.jumpElapsed=0;this.landingElapsed=0;this.jumps++;this.markImpact('jump',.18);this.events.push('jump');return true;}
 markImpact(kind,duration=.3){this.impact={kind,remaining:duration,duration};}
  // Authored character reactions, separate from actionable cue/HUD text. No scoring effect.
  express(kind){
   const spec={hit:{text:'앗!',priority:3,duration:.8},counter:{text:'됐다!',priority:2,duration:.65},chain:{text:'좋아!',priority:1,duration:.65}}[kind];
   if(this.state!=='play'||!spec)return false;
   const current=this.expression,priority=current?.priority||0;
   if(priority>spec.priority)return false;
   if(kind!=='hit'&&spec.priority<=priority&&this.time<this.expressionAfter)return false;
   if(kind!=='hit'&&!current&&this.time<this.expressionAfter)return false;
   this.expression={...spec,kind,id:++this.expressionSequence,at:this.time,remaining:spec.duration};this.expressionAfter=this.time+2;return true;
  }
  cleanResponse(){this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.perfect++;this.markImpact(this.combo%3===0?'chain':'pass',.32);if(this.combo%3===0){this.events.push('chain');this.express('chain');}}
 feel(){return {pace:this.speed/105,chain:this.combo,tier:Math.min(3,Math.floor(this.combo/3)),impact:this.impact?{...this.impact}:null};}
 inputDown(){if(this.deathAnimation||this.state!=='play'||this.held||this.transform||this.bossDefeatElapsed!==null)return false;if(this.encounter){this.inputCount++;this.held=true;return this.encounter.inputDown();}this.inputCount++;this.held=true;this.holdStarted=this.time;if(this.bossRule?.id==='charged-counter'&&this.jumpElapsed>=0)return this.action();if(['charge-release','shelter-hold','charged-counter','alternating-relay'].includes(this.bossRule?.id))return true;return this.action();}
 inputUp(){if(this.encounter){const was=this.held;this.held=false;this.encounter.inputUp();return was;}if(!this.held)return false;const charge=this.time-this.holdStarted;this.held=false;if(this.state!=='play')return false;if(['charge-release','alternating-relay'].includes(this.bossRule?.id))return this.fire(charge);if(this.bossRule?.id==='charged-counter'){if(this.jumpElapsed>=0)return false;if(charge<.25){this.feedback={kind:'early',text:'조금 더 모았다 놓으세요.',remaining:.8};return false}return this.jump()}return true;}
 action(){
  if(this.deathAnimation)return false;
  if(this.state!=='play'||this.transform||this.bossDefeatElapsed!==null)return false;
  if(this.encounter){const accepted=this.inputDown();this.inputUp();return accepted;}
  if(this.wallClimb)return false;
  const wall=this.hazards.find(h=>!h.done);
  if(wall?.type==='wall'){
   if(wall.armedAt!==null)return false;
   const lead=wall.time-this.time;
   if(lead<=WALL_READY+1e-9&&lead>=WALL_CLOSE-1e-9&&this.jumpElapsed<0){if(!this.jump())return false;wall.armedAt=this.time;wall.phase='armed';this.events.push('wall-arm');return true;}
  }
  const id=this.bossRule?.id;
  if(id==='contact-return'){const accepted=this.faceCounter.inputDown();this.faceCounter.inputUp();if(accepted){const jumping=this.faceCounter.events.at(-1)?.type==='jump';if(jumping)this.jumps++;else this.shots++;this.events.push(jumping?'jump':'throw');this.markImpact(jumping?'jump':'counter',.18);}return accepted;}
  if(id==='leg-sweep')return this.jump();
  if(this.bossRule?.family==='throw'){if(id==='charge-release'){this.feedback={kind:'cue',text:'누르고 모은 뒤 손을 떼세요.',remaining:1};return false}return this.fire(0);}
  if(this.bossRule?.family==='dodge'){
   if(id==='shelter-hold'){this.feedback={kind:'cue',text:'누른 채로 파도를 기다리세요.',remaining:1};return false}
   this.laneFrom=this.visualLane;this.lane=(this.lane+1)%3;this.laneBlend=0;this.events.push('jump');return true;
  }
  if(this.jumpElapsed>=0){
   if(this.kickElapsed>0)return false;
   this.kickElapsed=.28;this.markImpact('kick',.22);this.events.push('kick');this.tryKick();return true;
  }
  if(id==='charged-counter'){this.feedback={kind:'cue',text:'누르고 모은 뒤 놓아 뛰세요.',remaining:1};return false}
  return this.jump();
 }
 fire(charge){
  const c=this.bossCycleState;if(!c||this.time-this.lastShot<.18)return false;this.lastShot=this.time;this.shots++;const phase=c.elapsed,id=this.bossRule.id;
  let valid=false,progressOnly=false;
  if(id==='charge-release')valid=charge>=.35&&phase>=1.15&&phase<=2.25;
  else if(id==='double-pulse'){
   const pulse=phase>=.8&&phase<=1.45?0:phase>=1.75&&phase<=2.4?1:-1;
   if(pulse>=0&&!c.pulses.includes(pulse)){c.pulses.push(pulse);valid=c.pulses.length===2;progressOnly=!valid;}else valid=false;
  }else if(id==='alternating-relay')valid=phase>=1.1&&phase<=2.35&&!c.struck&&(charge>=.4?1:0)===this.bossDamage%2;
  else valid=phase>=1&&phase<=2.2;
  const p=this.playerPose(),target={x:this.boss.x+(id==='alternating-relay'?(charge>=.4?90:-90):0),y:this.boss.y+45};
  this.projectiles.push({id:this.slot.id+'-shot-'+this.shots,owner:'player',x:p.x,y:p.y-35,from:{x:p.x,y:p.y-35},target,width:15,height:15,elapsed:0,duration:.32,valid,progressOnly,cycle:c.id});
  this.events.push('shot');return true;
 }
 strikeSegment(){const q=this.playerPose(),n=q.inward,t=q.tangent;return {from:{x:q.x+n.x*(16*60/42.5)-t.x*(60/42.5),y:q.y+n.y*(16*60/42.5)-t.y*(60/42.5)},to:{x:q.x-n.x*38,y:q.y-n.y*38}};}
 tryBoundaryStrike(){const c=this.bossCycleState;if(!c||c.struck)return false;const segment=this.strikeSegment(),contact=boundaryContact(this.track,segment),valid=!!contact&&c.elapsed>=1.45&&c.elapsed<=2.2;
  this.boundaryStrike={id:this.slot.id+'-strike-'+(++this.boundaryStrikeCount),...segment,contact,valid,remaining:.28,at:this.time};
  if(!valid){this.feedback={kind:'miss',text:contact?'내려올 때 벽을 차세요':'발이 벽에 닿지 않았습니다',remaining:.65};return false;}
  c.struck=true;this.recordKick();this.bossHit();this.events.push('boss-strike');return true;
 }
 tryKick(){
  if(['leg-sweep','contact-return'].includes(this.bossRule?.id))return false;
  if(this.height()<(this.bossRule?.id==='boundary-strike'?8:18)){this.feedback={kind:'early',text:'먼저 뛰어오른 뒤 차세요.',remaining:.6};return false;}
  if(this.boss){
   if(this.bossRule.id==='boundary-strike')return this.tryBoundaryStrike();
   const c=this.bossCycleState;if(!c||c.struck||c.elapsed<1.45||c.elapsed>2.20)return false;
   this.recordKick();this.bossHit();c.struck=true;this.events.push('boss-strike');return true;
  }
  const h=this.hazards.find(v=>v.type==='kick'&&!v.done&&Math.abs(v.time-this.time)<.62);
  if(h&&!h.kicked){h.kicked=true;this.recordKick();this.events.push('boss-strike');return true;}return false;
 }
 cancelInput(){this.encounter?.inputUp();this.faceCounter?.inputUp();this.held=false;this.buffered=false;return true;}
 localCall(){if(this.state!=='play')return false;this.localCalls++;this.events.push('local-call');return true;}
 localQuit(){if(this.deathAnimation||this.state!=='play')return false;this.finish('fail','이번 시도를 마쳤습니다.','quit');return true;}
 drainEvents(){return this.events.splice(0);}
 exportSave(){return {schema:1,bestScore:0,bestTime:0,clears:0,furthestRoom:0};}
 update(dt){this.tick(dt);}
 tick(dt){if(this.state!=='play'||!Number.isFinite(dt)||dt<=0)return;let left=Math.min(dt,.25);while(left>1e-9&&this.state==='play'){let d=Math.min(left,STEP);const boundary=this.wallClimb?this.wallClimb.started+WALL_DURATION:this.hazards.find(h=>h.type==='wall'&&!h.done&&h.time>this.time+1e-9)?.time;if(boundary>this.time+1e-9)d=Math.min(d,boundary-this.time);this.step(d);left-=d;}}
 step(dt){
  if(this.deathAnimation&&!this.deathAnimation.completed){const a=this.deathAnimation;a.elapsed=Math.min(SCORE_DEATH_SECONDS,a.elapsed+dt);a.counter=Math.min(8,Math.floor((a.elapsed+1e-9)/SCORE_DEATH_SECONDS*8));if(a.counter>7){a.completed=true;this.finish('fail',a.reason,'collision');}return;}
  if(this.settingCredit){this.finish('clear','설정 변경을 기록했습니다.');return;}
  if(this.bossDefeatElapsed!==null){this.bossDefeatElapsed+=dt;if(this.bossDefeatElapsed+1e-9>=BOSS_DEFEAT_SECONDS)this.finish('clear',this.bossDefeatReason);return;}
  if(this.encounter){this.encounterStep(dt);return;}
  if(this.faceCounter){this.faceBossStep(dt);return;}
  // Source frames show the score held during scatter/reassembly. Freeze active
  // simulation, hazards and input together; the no-collision policy is authored.
  if(this.transform){this.advanceTransform(dt);return;}
  this.time+=dt;this.runTime=this.time;this.score=Math.floor(this.time*this.scoreRate+1e-7);this.travel+=dt*this.speed;this.poseClock+=dt*this.speed/105;if(this.scoreFinalization&&!this.goalQualified&&this.scoreObjective().qualified){this.goalQualified=true;this.events.push('goal-qualified');}
  this.landingElapsed=Math.max(0,this.landingElapsed-dt);if(this.impact){this.impact.remaining-=dt;if(this.impact.remaining<=0)this.impact=null;}
  if(this.feedback){this.feedback.remaining-=dt;if(this.feedback.remaining<=0)this.feedback=null;}
  if(this.expression){this.expression.remaining-=dt;if(this.expression.remaining<=0)this.expression=null;}
  if(this.jumpElapsed>=0&&!this.wallClimb){this.jumpElapsed+=dt;if(this.jumpElapsed>=JUMP_SECONDS-1e-9){this.jumpElapsed=-1;this.landingElapsed=.16;this.markImpact('land',.2);this.events.push('land');}}
  this.kickElapsed=Math.max(0,this.kickElapsed-dt);this.laneBlend=Math.min(1,this.laneBlend+dt/.18);this.visualLane=this.laneFrom+(this.lane-this.laneFrom)*(this.laneBlend*this.laneBlend*(3-2*this.laneBlend));
  if(this.boss){this.bossStep(dt);}else{this.routeStep(dt);}
  for(const p of this.projectiles){p.elapsed+=dt;const f=clamp(p.elapsed/p.duration,0,1);p.x=p.from.x+(p.target.x-p.from.x)*f;p.y=p.from.y+(p.target.y-p.from.y)*f;
   if(f>=1&&!p.done){p.done=true;if(p.owner==='player'&&p.valid&&p.cycle===this.bossCycleState?.id&&!this.bossCycleState.struck){this.bossCycleState.struck=true;this.bossHit();}else if(p.owner==='player'&&p.progressOnly)this.feedback={kind:'pass',text:'첫 고리 연결 · 다음 고리를 기다리세요.',remaining:.6};else if(p.owner==='player')this.feedback={kind:'miss',text:'열린 표적을 기다리세요.',remaining:.6};}}
  this.projectiles=this.projectiles.filter(p=>!p.done);
 }
 updateMovingCourtTrack(){
  if(this.track.kind!=='moving-court'||this.transform)return;
  if(!this.movingCourtBaseTrack)this.movingCourtBaseTrack=buildTrack('court',this.worldSize);
  this.track=moveCourtTrack(this.movingCourtBaseTrack,this.worldSize,this.time-this.layoutStarted);this.room.perimeter=this.track.length;
 }
 routeStep(dt){
  this.updateMovingCourtTrack();
  if(this.freePlay&&this.time>=(this.wave+1)*18)this.advanceWave();
  if(this.endlessCondition&&this.time>=(this.wave+1)*18){this.wave++;this.hazards=this.hazards.filter(h=>!h.done);this.hazards.push(...this.createPhrase(this.wave*18,18,(this.slot.number+this.wave)%10,false));}
  const map=Math.min(Math.floor(this.time/5),Math.floor((this.duration-.5)/5));
  if(map>this.lastMap)this.deferredFold=true;
  const next=this.hazards.find(h=>!h.done),lead=next?this.hazardTime(next)-this.time:Infinity;
  // Change only the projection at a grounded, readable encounter boundary.
  // No support mutation, extra collision, score hold or map-change credit.
  if(this.stripeOrientation==='horizontal'&&this.track.kind==='four-chambers'&&this.time>=3&&this.jumpElapsed<0&&lead>1.3&&!this.wallLocked()&&!this.transform){this.stripeOrientation='vertical';this.events.push('layout-change');}
  if(this.wallResizePending&&this.pendingViewport&&!this.wallLocked()&&this.jumpElapsed<0&&lead>.85&&!this.transform)this.applyViewport(this.pendingViewport.width,this.pendingViewport.height);
  // Let a full supported circuit expose both low rises even at slow speed.
  // Consume elapsed fold requests on exit; waiting never invents extra folds.
  const supportDwell=this.freePlay&&SUPPORT_DWELL_KINDS.has(this.track.kind);
  if(this.deferredFold&&!this.transform&&this.jumpElapsed<0&&lead>1.3&&!this.wallLocked()&&(!supportDwell||this.travel>=this.supportExitTravel)){if(supportDwell)this.lastMap=map;else if(map>this.lastMap)this.lastMap++;this.deferredFold=false;this.changeTrack(this.pendingTrackIndex??((this.trackIndex+1)%TRACK_KINDS.length));this.pendingTrackIndex=null;}
  if(this.transform)return;
  for(const h of this.hazards){if(h.done)continue;if(h.type==='wall'){this.wallStep(h);if(this.state!=='play')return;continue;}const half=this.hazardHalf(h),offset=this.time-this.hazardTime(h);
   // Wave moves toward the runner during its approach. Its physical marker and
   // collision interval use the same shifted crossing time.
   if(Math.abs(offset)<=half){
    const y=this.height();let collision;
    if(h.type==='beam')collision=y>9;
    else if(h.type==='kick')collision=!h.kicked;
    else if(h.type==='pulse')collision=this.pulseActive(h)&&y<18;
    else collision=y<18;
    if(collision){h.hit=true;h.done=true;this.damage(h.type==='gap'?'gap':h.type==='beam'?'ceiling':'spike');if(h.type==='portal')this.portalMissed=true;}
   }
   if(!h.done&&offset>half){h.done=true;this.passed++;this.cleanResponse();this.events.push('pass');if(h.type==='portal'){this.portalPassed=true;this.events.push('portal');}if(h.type==='switch'){this.deferredFold=true;this.pendingTrackIndex=(this.trackIndex+2)%TRACK_KINDS.length;this.feedback={kind:'seal',text:'발판이 다음 길을 열었습니다.',remaining:.8};this.events.push('counter');}else this.feedback={kind:this.combo>=3?'perfect':'pass',text:this.combo>=3?this.combo+' 연속 통과':h.type==='beam'?'그대로 통과':h.type==='kick'?'차서 돌려보냈습니다':'넘었습니다',remaining:.55};}
   if(this.state!=='play')return;
  }
  if(this.rule.type==='repeated-damage'&&Object.values(this.damageTypeCounts).some(n=>n>=this.rule.target)){this.finish('clear','같은 사각에 닿은 흔적을 모았습니다.');return;}
  if(this.rule.type==='damage-range'&&this.damageScores.some(n=>n>=this.rule.min&&n<=this.rule.max)){this.finish('clear','정해진 점수에서 부딪힌 흔적을 남겼습니다.');return;}
  if(this.time>=this.duration){if(this.portalMissed||!this.portalPassed){this.finish('fail','밝은 출구의 턱을 뛰어넘으세요.');return;}this.finish('clear','길을 통과했습니다.');}
 }
 wallStep(h){
  if(this.time<h.time-1e-9)return;
  if(!this.wallClimb){
   const anchor=atTrack(this.track,wrap(this.travel/1800)),startHeight=this.height(),success=h.armedAt!==null;
   h.anchor=anchor;h.phase=success?'climb':'recover';this.wallClimb={id:h.id,started:this.time,anchor,startHeight,success};
   if(!success){h.hit=true;this.wallMisses++;this.events.push('wall-miss');this.damage('wall');if(this.state!=='play'){h.done=true;this.wallClimb=null;return;}}
  }
  if(this.time-this.wallClimb.started<WALL_DURATION-1e-9)return;
  const success=this.wallClimb.success;this.wallClimb=null;this.jumpElapsed=-1;this.kickElapsed=0;this.landingElapsed=.16;h.done=true;h.phase='resolved';
  if(success){this.wallClimbs++;this.passed++;this.cleanResponse();this.events.push('wall-climb');this.events.push('pass');this.feedback={kind:'pass',text:'벽을 타고 넘었습니다',remaining:.65};}
 }
 sceneLayout(){
  if(this.boss||this.transform||this.track.kind!=='four-chambers')return {kind:'single',collisionSpace:'canonical'};
  if(this.stripeOrientation)return {kind:'stripe-replicas',orientation:this.stripeOrientation,count:3,progress:1,collisionSpace:'canonical'};
  return {kind:'quadrant-replicas',progress:smooth((this.time-this.layoutStarted)/3),collisionSpace:'canonical'};
 }
 advanceTransform(dt){const t=this.transform;t.elapsed=Math.min(t.duration,t.elapsed+dt);const f=smooth(t.elapsed/t.duration);
  // Preserve source/destination traversal correspondence while edges shrink or grow.
  // Re-normalizing the intermediate perimeter can sweep a grounded actor across it.
  const supportPhases=this.trackFrom.lengths.map((d,i)=>d/this.trackFrom.length*(1-f)+this.trackTo.lengths[i]/this.trackTo.length*f);
  this.track=measureTrack({kind:this.trackTo.kind,closed:this.trackTo.closed,supportPhases,points:this.trackFrom.points.map((p,i)=>({x:p.x+(this.trackTo.points[i].x-p.x)*f,y:p.y+(this.trackTo.points[i].y-p.y)*f}))});if(t.elapsed+1e-9<t.duration)return;this.track=this.trackTo;this.transform=null;if(this.nativeStage?.pendingPaletteRecord!==null&&this.nativeStage?.pendingPaletteRecord!==undefined){this.nativeStage.paletteRecord=this.nativeStage.pendingPaletteRecord;this.nativeStage.pendingPaletteRecord=null;}this.layoutStarted=this.time;if(this.freePlay&&SUPPORT_DWELL_KINDS.has(this.track.kind)){this.supportExitTravel=this.travel+1800;if(this.track.kind==='support-steps')this.supportStepsExitTravel=this.supportExitTravel;}this.movingCourtBaseTrack=null;this.updateMovingCourtTrack();this.events.push('reassemble');}
 cellTransition(){const t=this.transform;return t?{kind:'cell-scatter',progress:t.elapsed/t.duration,duration:t.duration,collisionPolicy:'paused-authored',from:this.trackFrom.points.map(p=>({...p})),to:this.trackTo.points.map(p=>({...p}))}:null;}
 changeTrack(index){if(this.nativeStage)this.selectStagePolicy(false);this.expression=null;this.mapChanges++;this.trackFrom=this.track;this.trackIndex=index;this.trackTo=buildTrack(this.nativeStage?this.stageTrackKind():this.freePlay?FREEPLAY_TRACK_KINDS[this.mapChanges%FREEPLAY_TRACK_KINDS.length]:TRACK_KINDS[index],this.worldSize);this.room.motif=this.trackTo.kind;this.transform={elapsed:0,duration:.5,from:this.trackFrom.kind,to:this.trackTo.kind};this.held=false;this.buffered=false;this.events.push('fold');this.events.push('corner');this.feedback={kind:'map',text:'길이 '+this.mapChanges+'번 바뀌었습니다.',remaining:.8};}
 hazardHalf(h){return (h.width/2+8)/(this.track.length*this.speed/1800)/(h.type==='wave'?1.35:1);}
 hazardTime(h){return h.damageAt!==undefined?h.damageAt+this.hazardHalf(h):h.time;}
 pulseActive(h){const lockAt=h.time-1.4,clock=this.time<lockAt?this.time:lockAt;return Math.sin((clock+h.pulseOffset)*Math.PI)>0;}
 recordKick(){this.kicks++;this.kickHours.push(this.sampleClock().hour);}
 sampleClock(){const supplied=PERIODS.includes(this.options.period),date=supplied?null:(typeof this.options.clockNow==='function'?this.options.clockNow():new Date()),hour=supplied?periodHour[this.options.period]:date.getHours();if(!Number.isInteger(hour)||hour<0||hour>23)throw Error('Invalid event clock');this.period=hourPeriod(hour);return this.clockSample={hour,source:supplied?'simulation':'device',atTime:this.time};}
 damage(type){
  if(this.state!=='play'||this.deathAnimation||this.bossDefeatElapsed!==null)return;this.damageHours.push(this.sampleClock().hour);this.damageTypes.push(type);
  this.hits++;this.hearts--;this.combo=0;this.express('hit');this.markImpact('hit',.34);this.damageScores.push(this.score);this.damageTypeCounts[type]=(this.damageTypeCounts[type]||0)+1;this.feedback={kind:'hit',text:type==='face-white'?'흰 사각을 손 가까이 기다렸다가 쳐내세요.':type==='face-black'?'검은 사각은 뛰어넘으세요.':type==='boss-high'?'높게 뻗는 발은 바닥에서 기다리세요.':type==='boss-low'?'몸을 낮추면 발이 오기 전에 점프하세요.':type==='ceiling'?'천장 아래에서는 그대로 달리세요.':type==='gap'?'빈 길 앞에서 뛰어오르세요.':type==='heart-boundary'?'경계가 차오르기 전에 안쪽으로 뛰세요.':'사각 앞에서 조금 일찍 뛰어오르세요.',remaining:1};this.events.push('hit');
  if(this.hearts<=0)this.finish('fail','부딪힌 흔적을 남기고 멈췄습니다.','collision');
 }
 bossHit(){if(this.state!=='play'||!this.boss||this.boss.hp<=0)return;this.bossDamage++;this.boss.hp--;this.cleanResponse();this.express('counter');this.markImpact('counter',.34);this.feedback={kind:'seal',text:(this.bossRule.id==='leg-sweep'?'회피 ':'응답 ')+this.bossDamage+' / '+this.boss.maxHp,remaining:.8};this.events.push('boss-damage');if(this.boss.hp<=0){this.bossDefeatElapsed=0;this.bossDefeatReason=this.encounter?this.encounter.clearReason():this.bossRule.id==='leg-sweep'?'긴 몸의 휘두르기를 모두 피했습니다.':'사각의 응답을 모두 돌려보냈습니다.';this.cancelInput();this.boss.phase='defeated';this.events.push('boss-defeated');}}

 encounterStep(dt){
  const e=this.encounter,m=e.model;e.advance(dt);this.time=m.time;this.runTime=this.time;this.score=Math.floor(this.time*this.scoreRate+1e-7);this.poseClock+=dt;
  for(const key of ['impact','feedback','expression'])if(this[key]){this[key].remaining-=dt;if(this[key].remaining<=0)this[key]=null;}
  const a=m.actor();this.jumpElapsed=a.air||a.jumping?0:-1;
  for(const event of e.drain()){
   if(event.type==='approach'||event.type==='attack')this.events.push('attack-telegraph');
   else if(event.type==='jump'){this.jumps++;this.events.push('jump');this.markImpact('jump',.18);}
   else if(event.type==='input'){this.events.push('kick');this.markImpact('kick',.18);}
   else if(event.type==='deflection'){this.events.push('boss-strike');this.express('counter');this.markImpact('counter',.2);}
   else if(event.type==='return'){this.shots++;this.events.push('boss-strike');this.express('counter');this.markImpact('counter',.25);}
   else if(event.type==='human-hit'){this.damage('encounter');if(this.state!=='play')break;}
   else if(event.type==='boss-damage'){if(e.kind==='wave'){this.wavePasses++;if(!m.pass.hit)this.dodges++;}else if(e.kind==='chain')this.dodges++;else if(!['orbit','alien','sun'].includes(e.kind))this.counters++;this.bossHit();if(this.state!=='play')break;}
  }
  this.boss.phase=e.cue().ready?'ready':'preview';this.boss.vulnerable=false;this.boss.cue=this.cue().text;
  if(this.state==='play'&&m.state==='invalid')this.finish('fail','이동 경계를 확인해야 합니다. 다시 시작하세요.');
 }
 encounterGeometry(endingSeconds=0){
  const e=this.encounter.snapshot(endingSeconds),w=e.width,h=e.height,a=e.actor,player=this.encounterPlayer(e);
  return{encounter:e,heartPulse:null,faceCounter:null,legSweep:null,expression:this.expression?{...this.expression}:null,layout:{kind:'single',collisionSpace:'canonical'},freePlay:false,room:{...this.room},characterId:this.characterId,character:this.characterView(),companion:null,bounds:{left:-w/2,top:-h/2,right:w/2,bottom:h/2,width:w,height:h},cameraEnvelope:{width:w,height:h},familyIndex:this.familyIndex,lanes:[],track:{kind:'encounter-'+e.kind,points:[],closed:false,gaps:[]},player,hazards:[],attacks:[],projectiles:[],time:this.time,progress:this.bossDamage/this.boss.maxHp,corner:{face:0,turning:false,progress:0},boss:{...this.boss},cue:this.cue(),feedback:this.feedback?{...this.feedback}:null,feel:this.feel()};
 }
 encounterPlayer(e=this.encounter.snapshot()){
  const a=e.actor,b=a.box,x=b.x+b.w/2-e.width/2,y=b.y+b.h-e.height/2;
  return{x,y,baseX:x,baseY:y,tangent:{x:1,y:0},inward:{x:0,y:-1},angle:a.angle||0,face:0,height:a.height||a.lift||0,turning:false,turnProgress:0,poseClock:this.poseClock,pace:1,jumpProgress:(a.air||a.jumping)?0.5:-1,radius:8,bodyHeight:b.h};
 }
 faceBossStep(dt){
  const f=this.faceCounter;f.advance(dt);this.time=f.time;this.runTime=this.time;this.score=Math.floor(this.time*this.scoreRate+1e-7);this.travel+=dt*this.speed;this.poseClock+=dt*this.speed/105;if(this.scoreFinalization&&!this.goalQualified&&this.scoreObjective().qualified){this.goalQualified=true;this.events.push('goal-qualified');}
  for(const key of ['impact','feedback','expression'])if(this[key]){this[key].remaining-=dt;if(this[key].remaining<=0)this[key]=null;}
  const actor=f.actor();this.jumpElapsed=actor.air?this.time-f.jumps.at(-1):-1;
  for(const event of f.events.splice(0)){
   if(event.type==='spawn')this.events.push('attack-telegraph');
   else if(event.type==='deflection'){this.events.push('boss-strike');this.express('counter');this.markImpact('counter',.2);}
   else if(event.type==='return'){this.events.push('boss-strike');this.express('counter');this.markImpact('counter',.25);}
   else if(event.type==='body-hit'){this.damage('face-'+event.kind);if(this.state!=='play')break;}
   else if(event.type==='boss-hit'){this.bossHit();if(this.state!=='play')break;}
  }
  this.boss.phase=f.hurtUntil>f.time?'recover':f.cue().ready?'ready':'preview';this.boss.vulnerable=false;this.boss.cue=this.cue().text;
  if(this.state==='play'&&this.pendingViewport&&!this.faceLocked())this.applyViewport(this.pendingViewport.width,this.pendingViewport.height);
  if(this.state==='play'&&this.time>=this.duration)this.finish('fail','흰 사각을 쳐내고 검은 사각을 넘으며 다시 도전하세요.');
 }
 faceGeometry(){const s=this.faceCounter.snapshot(),dx=-this.worldSize.width/2,dy=-this.worldSize.height/2,rect=r=>({...r,x:r.x+dx,y:r.y+dy});return {...s,actor:{...s.actor,human:rect(s.actor.human),arm:rect(s.actor.arm),dog:rect(s.actor.dog)},cells:s.cells.map(rect),projectiles:s.projectiles.map(p=>({...p,x:p.x+dx,y:p.y+dy,cells:p.cells.map(rect)})),bounds:{left:this.faceCounter.bounds.left+dx,top:this.faceCounter.bounds.top+dy,right:this.faceCounter.bounds.right+dx,bottom:this.faceCounter.bounds.bottom+dy}};}

 legBossStep(){
  const cycle=Math.floor(this.time/LEG_CYCLE),phase=this.time-cycle*LEG_CYCLE;
  if(cycle!==this.cycle){this.cycle=cycle;this.bossCycleState={id:this.slot.id+'-attack-'+cycle,elapsed:phase,kind:LEG_PATTERN[cycle%LEG_PATTERN.length],struck:false,resolved:false,hit:false};this.events.push('attack-telegraph');}
  const c=this.bossCycleState;c.elapsed=phase;this.boss.phase=phase<1.05?'preview':phase<1.65?'ready':phase<=2.1?'active':'recover';this.boss.vulnerable=false;this.boss.cue=this.cue().text;
  const frame=legBossFrame(this.worldSize,phase,c.kind);
  if(frame.active&&!c.hit&&!c.resolved&&overlaps(bodyPolygon(this.playerPose()),legFootPolygon(frame))){c.hit=true;this.damage(c.kind==='low'?'boss-low':'boss-high');if(this.state!=='play')return;}
  if(phase>=2.15&&!c.resolved){c.resolved=true;if(!c.hit){c.struck=true;this.dodges++;this.bossHit();}}
  if(this.state!=='play')return;
  if(this.pendingViewport&&this.jumpElapsed<0&&phase>2.5)this.applyViewport(this.pendingViewport.width,this.pendingViewport.height);
  if(this.time>=this.duration)this.finish('fail','다리의 높이를 보고 점프와 기다리기를 나누세요.');
 }

 bossStep(dt){
  if(this.bossRule.id==='leg-sweep'){this.legBossStep();return;}
  if(this.boundaryStrike){this.boundaryStrike.remaining=Math.max(0,this.boundaryStrike.remaining-dt);if(this.boundaryStrike.remaining===0)this.boundaryStrike=null;}
  const cycle=Math.floor(this.time/3.2),phase=this.time-cycle*3.2,id=this.bossRule.id;
  if(cycle!==this.cycle){this.cycle=cycle;this.bossCycleState={id:this.slot.id+'-attack-'+cycle,elapsed:phase,lockedLane:this.lane,safeLane:(cycle*2)%3,struck:false,resolved:false,pulses:[]};this.events.push('attack-telegraph');}
  const c=this.bossCycleState;c.elapsed=phase;this.boss.phase=phase<.7?'preview':phase<2.25?'ready':phase<2.65?'active':'recover';this.boss.vulnerable=id==='boundary-strike'?phase>=1.45&&phase<=2.2&&!c.struck:phase>=1&&phase<=2.25;this.boss.cue=this.cue().text;
  if(this.bossRule.family==='dodge'&&phase>=2.45&&!c.resolved){
   c.resolved=true;let safe=id==='locked-lane'?this.lane!==c.lockedLane:id==='safe-lane-sequence'?this.lane===c.safeLane:this.held&&this.time-this.holdStarted>=.35&&this.holdStarted>=cycle*3.2;
   if(safe){this.dodges++;c.struck=true;this.bossHit();}else this.damage('boss');
  }
  if(this.wallResizePending&&this.pendingViewport&&!this.heartLocked()&&phase>2.65)this.applyViewport(this.pendingViewport.width,this.pendingViewport.height);
  this.updateHeartTrack();
  if(id==='boundary-strike'&&phase>=2.3&&!c.resolved){c.resolved=true;if(!c.struck&&boundaryDistance(this.track,this.playerPose())<=32)this.damage('heart-boundary');}
  if(id!=='boundary-strike'&&this.bossRule.family==='kick'&&phase>=2.3&&!c.resolved){c.resolved=true;if(!c.struck)this.damage('boss');}
  if(this.time>=this.duration&&this.state==='play')this.finish('fail','표적의 신호를 읽고 응답해 보세요.');
 }
 cue(){
  if(this.encounter)return this.encounter.cue();
  if(this.faceCounter){const q=this.faceCounter.cue();return {id:this.slot.id+'-contact-'+(q.id??'wait'),verb:q.ready?'tap':'wait',phase:q.ready?'ready':'preview',text:q.kind==='white'?'흰 사각 — 지금 쳐내세요':q.kind==='black'?'검은 사각 — 지금 뛰어넘으세요':'흰 사각은 반격 · 검은 사각은 점프',progress:q.ready?1:0,kind:q.kind};}
  if(this.transform)return {id:this.slot.id+'-scatter-'+this.mapChanges,verb:'wait',phase:'recover',text:'길이 다시 모입니다',progress:this.transform.elapsed/this.transform.duration};
  if(this.boss){const c=this.bossCycleState||{id:this.slot.id+'-attack-0',elapsed:0,lockedLane:this.lane,safeLane:0},p=c.elapsed,id=this.bossRule.id;let verb=this.bossRule.verb,text=this.bossRule.instruction,phase=this.boss.phase;

   if(id==='leg-sweep'){
    const low=(c.kind||LEG_PATTERN[0])==='low',ready=low&&!c.resolved&&this.jumpElapsed<0&&p>=1.05&&p<1.65;
    return {id:c.id,verb:ready?'tap':'wait',phase:ready?'ready':c.resolved?'recover':'preview',text:c.resolved?(c.hit?'다음 다리의 높이를 읽으세요':'피했습니다. 다음 자세를 보세요'):low?(ready?'낮게 뻗는 발 — 지금 점프':this.jumpElapsed>=0?'발이 지나갈 때까지 공중에서':'몸을 낮춥니다 — 점프를 준비하세요'):'무릎이 올라갑니다 — 바닥에서 기다리세요',progress:clamp(p/2.15,0,1),timeUntilActive:Math.max(0,1.85-p),deadline:1.85-p,attackHeight:low?'low':'high'};
   }
   if(id==='charge-release'){verb=p<1.15?'hold':p<=2.25?'release':'wait';text=verb==='hold'?'누르고 힘을 모으세요':verb==='release'?'지금 놓아 던지세요':'다음 고리를 기다리세요';}
   else if(id==='double-pulse'){const ready=p>=.8&&p<=1.45||p>=1.75&&p<=2.4;verb=ready?'tap':'wait';phase=ready?'ready':'preview';text=ready?(p<1.5?'첫 번째 고리 · 던지세요':'두 번째 고리 · 던지세요'):'두 고리의 간격을 보세요';}
   else if(id==='alternating-relay'){const right=this.bossDamage%2===1;if(right){verb=this.held&&this.time-this.holdStarted>=.4&&p>=1.1?'release':'hold';text=verb==='hold'?'오른쪽 표적 · 길게 모으세요':'오른쪽 표적 · 놓으세요';}else{verb=p>=1.1&&p<=2.35?'tap':'wait';text='왼쪽 표적 · 짧게 눌렀다 놓으세요';}phase=p>=1.1&&p<=2.35?'ready':'preview';}
   else if(id==='shelter-hold'){verb=p<2.6?'hold':'release';phase=p<.7?'preview':'ready';text=verb==='hold'?'누른 채로 낮추세요':'파도가 지났습니다 · 놓으세요';}
   else if(id==='safe-lane-sequence'){text='밝은 '+(c.safeLane+1)+'번 발판으로 옮기세요';verb=this.lane===c.safeLane?'wait':'switch';}
   else if(id==='locked-lane'){text=this.lane===c.lockedLane?'표적이 고정됐습니다 · 다른 발판으로':'안전한 발판 · 기다리세요';verb=this.lane===c.lockedLane?'switch':'wait';}
   else if(this.bossRule.family==='kick'){
    if(p<.95&&id!=='charged-counter'){verb='wait';text=id==='boundary-strike'?'하트 안쪽을 따라 달립니다':'다가오는 사각을 기다리세요';}
    else if(id==='charged-counter'&&p<1.15){verb='hold';text='누르고 힘을 모으세요';}
    else if(this.jumpElapsed<0){verb=id==='charged-counter'?'release':'tap';text=id==='charged-counter'?'놓아 뛰세요':id==='boundary-strike'?'안쪽으로 뛰세요':'먼저 한 번 눌러 뛰세요';}
    else{const kickReady=id==='boundary-strike'?1.85:1.45;verb=p<kickReady?'wait':'tap';text=id==='boundary-strike'?(p<kickReady?'내려올 때까지 기다리세요':'한 번 더 눌러 하트 벽을 차세요'):(p<kickReady?'가까워질 때까지 기다리세요':'지금 공중에서 한 번 더 차세요');}
    phase=verb==='wait'?'preview':'ready';
   }else{phase=this.boss.vulnerable?'ready':'preview';verb=this.boss.vulnerable?'tap':'wait';text=this.boss.vulnerable?'열린 표적 · 던지세요':'닫힌 표적 · 기다리세요';}
   if(c.struck&&id!=='shelter-hold'){verb='wait';phase='recover';text='응답했습니다 · 다음 신호를 기다리세요';}
   return {id:c.id+(id==='double-pulse'?(p<1.5?'-first':'-second'):this.bossRule.family==='kick'?(this.jumpElapsed<0?'-jump':'-kick'):''),verb,phase:verb==='wait'?'preview':phase,text,timeUntilActive:Math.max(0,2.45-p),deadline:2.45-p,progress:clamp(p/2.45,0,1),targetLane:id==='locked-lane'?c.lockedLane:c.safeLane};
  }
  const h=this.hazards.find(v=>!v.done);if(!h)return {id:this.slot.id+'-end',verb:'wait',phase:'recover',text:'다음 길로',progress:1};const t=this.hazardTime(h)-this.time,verb=h.type==='beam'?'wait':h.type==='kick'&&this.jumpElapsed>=0?'tap':'tap';
  if(h.type==='wall'){const armed=h.armedAt!==null||!!this.wallClimb;return {id:h.id+':climb',action:'wall-climb',verb:armed?'wait':'tap',phase:armed?'active':t>WALL_READY?'preview':t>=WALL_CLOSE?'ready':'active',text:armed?'벽을 타고 넘어갑니다':'높은 벽 · 한 번 눌러 타고 넘으세요',timeUntilActive:t,deadline:t,progress:clamp(1-t/1.4,0,1),hazardId:h.id};}
  const special=['damage-range','repeated-damage','clock-death'].includes(this.rule.type)||this.rule.type==='death-range'&&(this.hearts>1||h.authoredScoreContact===true);
  let text=special?'이번 기록은 사각에 닿아 남깁니다':h.type==='beam'?'낮은 천장 · 그대로 달리세요':h.type==='kick'?(this.jumpElapsed>=0?'공중에서 한 번 더 눌러 차세요':'뛰고 공중에서 한 번 더 누르세요'):h.type==='gap'?'빈 길을 뛰어넘으세요':h.type==='portal'?'밝은 문턱을 뛰어넘으세요':'사각 앞에서 누르세요';
  if(h.type==='pulse')text=this.pulseActive(h)?'솟아오른 사각 · 뛰세요':'낮아진 사각 · 그대로 지나가세요';
  if(special&&h.type==='beam')text='천장에 닿으려면 뛰어오르세요';
  return {id:h.id+(h.type==='kick'&&this.jumpElapsed>=0?'-kick':''),verb:special?(h.type==='beam'?'tap':'wait'):h.type==='pulse'&&!this.pulseActive(h)?'wait':verb,phase:t>.85?'preview':t>.2?'ready':'active',text,timeUntilActive:t,deadline:t,progress:clamp(1-t/1.4,0,1),hazardId:h.id};
 }
 playerPose(){
  if(this.encounter)return this.encounterPlayer();
  if(this.faceCounter){const a=this.faceCounter.actor(),x=a.human.x+a.human.w/2-this.worldSize.width/2,baseY=this.faceCounter.floor-this.worldSize.height/2;return {x,y:baseY-a.height,baseX:x,baseY,tangent:{x:1,y:0},inward:{x:0,y:-1},angle:0,face:0,height:a.height,turning:false,turnProgress:0,poseClock:this.poseClock,pace:this.speed/105,jumpProgress:a.air?(this.time-this.faceCounter.jumps.at(-1))/1.7:-1,kick:0,landing:0,impact:0,radius:8,bodyHeight:60,punchAge:a.punchAge};}
  const height=this.height(),u=(this.travel/1800)%1,kinetic={poseClock:this.poseClock,pace:this.speed/105,jumpProgress:this.jumpElapsed<0?-1:this.jumpElapsed/JUMP_SECONDS,kick:this.kickElapsed/.28,landing:this.landingElapsed/.16,impact:this.impact?.kind==='hit'?this.impact.remaining/.34:0};
  if(this.wallClimb)return {...this.climbPose(),...kinetic,radius:8,bodyHeight:60,climbing:this.wallClimb.success,recovering:!this.wallClimb.success};
  if(this.boss&&this.bossRule.id==='boundary-strike')return {...atTrack(this.track,u,height),...kinetic,radius:8,bodyHeight:60};
  if(this.boss){const x=this.bossRule.id==='leg-sweep'?-this.worldSize.width*.32:this.bossRule.family==='dodge'?(this.visualLane-1)*this.worldSize.width*.26:0,y=this.worldSize.height/2-45;return {x,y:y-height,baseX:x,baseY:y,tangent:{x:1,y:0},inward:{x:0,y:-1},angle:0,face:0,height,turning:false,turnProgress:0,...kinetic,radius:8,bodyHeight:this.bossRule.id==='shelter-hold'&&this.held?30:60};}
  return {...atTrack(this.track,u,height),...kinetic,radius:8,bodyHeight:60};
 }
 finish(state,reason,termination=state==='clear'?'objective':'exit'){
  if(this.state!=='play')return;
  if(this.scoreFinalization){
   if(termination==='collision'&&!this.deathAnimation){if(this.hearts!==0||this.hits!==3)return;this.deathAnimation={actorState:13,counter:0,elapsed:0,completed:false,reason};this.cancelInput();this.events.push('death-animation');return;}
   if(termination==='collision'&&!this.deathAnimation?.completed)return;
   if(!['collision','quit'].includes(termination))return;
  }
  if(termination!=='collision'||!this.clockSample)this.sampleClock();this.expression=null;this.state=state;this.held=false;this.jumpElapsed=-1;this.events.push(state);
  this.result={runVersion:75,...(this.scoreFinalization&&termination==='collision'?{animationGate:{schema:1,actorState:this.deathAnimation.actorState,counter:this.deathAnimation.counter,completed:true,presentationSeconds:SCORE_DEATH_SECONDS,timingSource:'authored-presentation'}}:{}),stageSelection:this.stageSelectionStatus(),initialLives:this.initialLives,livesRemaining:this.hearts,termination,wallClimbs:this.wallClimbs,wallMisses:this.wallMisses,mode:'restoration',freePlay:this.freePlay,seed:this.seed,wave:this.wave,patternId:this.patternId,mastery:this.mastery(),slotId:this.slot.id,ruleId:this.slot.ruleId,state,completed:true,practice:this.practice,attempt:this.attempt,period:this.period,score:this.score,time:this.time,hits:this.hits,jumps:this.jumps,kicks:this.kicks,mapChanges:this.mapChanges,damageTypeCounts:{...this.damageTypeCounts},damageScores:this.damageScores.slice(),damageHours:this.damageHours.slice(),damageTypes:this.damageTypes.slice(),kickHours:this.kickHours.slice(),clockSample:{...this.clockSample},bossDefeated:!!this.boss&&this.boss.hp===0,bossDamage:this.bossDamage,shots:this.shots,dodges:this.dodges,counters:this.counters,wavePasses:this.wavePasses,boss:this.boss?{hp:this.boss.hp,maxHp:this.boss.maxHp,ruleId:this.boss.ruleId}:null,characterId:this.characterId,setting:this.options.setting||this.rule.setting,settingValue:this.options.settingValue,reason,encounter:this.encounter?{kind:this.encounter.kind,policy:this.encounter.model.policy,sourceStatus:'observed-structure-authored-input-and-timing'}:null,rank:state==='clear'?(this.hits===0?'S':'A'):null,passed:this.passed,perfect:this.perfect,bestCombo:this.bestCombo,retries:this.retries,roomsCleared:this.mapChanges,...this.settingProof()};
 }
 characterView(){const id=this.characterId,role=id==='dog'?'dog-companion':id==='elder'?'carried-protagonist':id==='woman'?'replacement-runner':this.slot.number>=87?'returned-protagonist':'protagonist';return {id,role,runnerId:id==='dog'?'walker':id,carries:id==='elder'?'walker':null,totalBodyHeight:60,physics:this.encounter?.kind==='alien'?'authored-pair-contact':'authored-shared',companionCollides:this.encounter?.kind==='alien'&&this.encounter.model.policy==='pair-air-contact'};}
 companionPose(){if(this.encounter)return null;if(this.faceCounter){const a=this.faceCounter.actor(),d=a.dog,baseY=this.faceCounter.floor-this.worldSize.height/2;return {x:d.x+d.w/2-this.worldSize.width/2,y:d.y+d.h-this.worldSize.height/2,baseX:d.x+d.w/2-this.worldSize.width/2,baseY,tangent:{x:1,y:0},height:a.dogHeight,bodyHeight:24,collides:false,kind:'dog'};}if(this.characterId!=='dog')return null;const q=this.playerPose();if(this.boss&&this.bossRule.id!=='boundary-strike')return {...q,x:q.baseX-48,y:q.baseY,baseX:q.baseX-48,height:0,bodyHeight:24,collides:false,kind:'dog'};const u=((this.travel/1800-48/this.track.length)%1+1)%1;return {...atTrack(this.track,u,0),bodyHeight:24,collides:false,kind:'dog'};}
 scoreObjective(){const prior=this.rule.type==='cumulative-score'?(this.options.priorCredit||0):0;return {type:this.rule.type==='cumulative-score'?0:10,target:this.rule.target,priorCredit:prior,total:prior+this.score,qualified:this.scoreFinalization&&!this.practice&&(!Number.isInteger(this.options.frontier)||this.options.frontier===this.slot.number)&&prior+this.score>=this.rule.target};}
 status(){return {scoreFinalization:this.scoreFinalization,qualified:this.scoreFinalization&&this.scoreObjective().qualified,scoreObjective:this.scoreFinalization?this.scoreObjective():null,deathAnimation:this.deathAnimation?{counter:this.deathAnimation.counter,elapsed:this.deathAnimation.elapsed,completed:this.deathAnimation.completed,progress:this.deathAnimation.elapsed/SCORE_DEATH_SECONDS,timingSource:'authored-presentation'}:null,stageSelection:this.stageSelectionStatus(),layout:this.sceneLayout(),wallClimbs:this.wallClimbs,wallMisses:this.wallMisses,...this.settingProof(),freePlay:this.freePlay,seed:this.seed,wave:this.wave,patternId:this.patternId,phrase:this.phraseView(),mastery:this.mastery(),feel:this.feel(),state:this.state,characterId:this.characterId,character:this.characterView(),mode:this.mode,slotId:this.slot.id,ruleId:this.slot.ruleId,familyIndex:this.familyIndex,roomIndex:0,roomCount:1,roomTitle:this.freePlay?this.room.title:this.slot.title,motif:this.track.kind,time:this.time,score:this.score,best:0,hearts:this.hearts,combo:this.combo,bestCombo:this.bestCombo,passed:this.passed,totalHazards:this.hazards.length,progress:this.boss?this.bossDamage/this.boss.maxHp:this.runProgress(),roomProgress:this.runProgress(),face:this.playerPose().face,jumping:this.jumpElapsed>=0,height:this.height(),nextHazard:null,feedback:this.feedback?{...this.feedback}:null,boss:this.boss?{...this.boss}:null,result:this.result?{...this.result}:null,retries:this.retries,transition:null,cue:this.cue(),instruction:this.freePlay?'변하는 길을 달리며 점프·기다리기·발차기를 이어 가세요. 출구 없이 계속 달립니다.':this.bossRule?.instruction||this.slot.instruction||'',actionLabel:this.bossRule?.name||'뛰기 · 공중에서 차기',objective:this.freePlay?'더 오래 달리고, 부딪히지 않은 연속 통과 기록을 높이세요.':this.slot.instruction||'',mapChanges:this.mapChanges,lane:this.lane,held:this.held};}
 geometry(endingSeconds=0){
  if(this.encounter)return this.encounterGeometry(endingSeconds);
  const hazards=this.hazards.map(h=>{const targetTime=this.hazardTime(h),moving=h.type==='wave'?clamp(targetTime-this.time,-1.5,1.5)*.35:0,u=(((this.travel+(targetTime-this.time+moving)*this.speed)/1800)%1+1)%1,pose=atTrack(this.track,u),point=(x,y)=>({x:pose.baseX+pose.tangent.x*x+pose.inward.x*y,y:pose.baseY+pose.tangent.y*x+pose.inward.y*y}),low=h.type==='beam'?70:0,high=h.type==='beam'?120:h.type==='gap'?-22:h.type==='pulse'&&!this.pulseActive(h)?2:18;
   if(h.type==='wall'){const p=h.anchor||pose;return {...h,...p,visible:targetTime-this.time<=3,active:true,d:u*this.track.length,phase:h.phase,cue:'wall-climb',collisionPolygon:wallPolygon(p,h.width)};}
   return {...h,...pose,visible:targetTime-this.time<=3,active:h.type!=='pulse'||this.pulseActive(h),d:u*this.track.length,phase:h.done?'resolved':h.time-this.time<1.4?'ready':'preview',cue:h.type==='beam'?'wait':'jump',collisionPolygon:[point(-h.width/2,low),point(-h.width/2,high),point(h.width/2,high),point(h.width/2,low)]};});
  if(this.transform)for(const h of hazards){h.visible=false;h.active=false;}
  const player={...this.playerPose(),deathProgress:this.deathAnimation?this.deathAnimation.elapsed/SCORE_DEATH_SECONDS:0,boundaryKicking:!!this.boundaryStrike},portal=hazards.find(h=>h.type==='portal');
  const projectiles=this.projectiles.map(p=>({...p}));
  if(this.boss&&this.bossRule.family==='kick'&&this.bossRule.id!=='boundary-strike'){
   const c=this.bossCycleState,p=c?.elapsed||0,f=clamp((p-.4)/1.9,0,1);if(p<2.4&&!c?.struck){const target={x:0,y:this.worldSize.height/2-95};projectiles.push({id:c?.id||'incoming',owner:'boss',x:-this.worldSize.width*.37+(target.x+this.worldSize.width*.37)*f,y:(this.worldSize.height/2-95)+(target.y-(this.worldSize.height/2-95))*f,width:26,height:26,phase:'active'});}
  }
  const legSweep=this.bossRule?.id==='leg-sweep'?legBossFrame(this.worldSize,this.bossCycleState?.elapsed||0,this.bossCycleState?.kind||LEG_PATTERN[0]):null;if(legSweep){legSweep.collisionPolygon=legFootPolygon(legSweep);legSweep.cells=legBossCells(legSweep);legSweep.hit=!!this.bossCycleState?.hit;}
  return {faceCounter:this.faceCounter?this.faceGeometry():null,legSweep,heartPulse:this.bossRule?.id==='boundary-strike'?{scale:this.heartPulse,source:'observed-contraction-authored-timing'}:null,expression:this.expression?{...this.expression}:null,boundaryStrike:this.boundaryStrike?{...this.boundaryStrike,...this.strikeSegment(),recordedFrom:{...this.boundaryStrike.from},recordedTo:{...this.boundaryStrike.to},contact:this.boundaryStrike.contact?{...this.boundaryStrike.contact}:null}:null,boundaryPressure:this.bossRule?.id==='boundary-strike'?{width:32,phase:this.bossCycleState?.struck?'off':(this.bossCycleState?.elapsed||0)<1.65?'off':(this.bossCycleState?.elapsed||0)<2.3?'warning':(this.bossCycleState?.elapsed||0)<2.4?'active':'off'}:null,cellTransition:this.cellTransition(),layout:this.sceneLayout(),wall:this.wallClimb?{id:this.wallClimb.id,phase:this.wallClimb.success?'climb':'recover'}:null,freePlay:this.freePlay,wave:this.wave,phrase:this.phraseView(),feel:this.feel(),room:{...this.room},characterId:this.characterId,character:this.characterView(),companion:this.companionPose(),bounds:{left:-this.worldSize.width/2,top:-this.worldSize.height/2,right:this.worldSize.width/2,bottom:this.worldSize.height/2,...this.worldSize},cameraEnvelope:{...this.worldSize},stageSelection:this.stageSelectionStatus(),familyIndex:this.nativeStage?this.nativeStage.paletteRecord%10:this.familyIndex,lanes:['leg-sweep','contact-return'].includes(this.bossRule?.id)?[]:[0,1,2].map(index=>({index,x:(index-1)*this.worldSize.width*.26,top:this.worldSize.height/2-245,bottom:this.worldSize.height/2-45,width:this.worldSize.width*.14})),track:{kind:this.track.kind,motion:this.track.motion?{...this.track.motion}:null,supportSteps:this.track.supportSteps?{...this.track.supportSteps,heights:this.track.supportSteps.heights.slice()}:null,points:this.boss&&this.bossRule.id!=='boundary-strike'?[{x:-this.worldSize.width/2+45,y:this.worldSize.height/2-45},{x:this.worldSize.width/2-45,y:this.worldSize.height/2-45}]:this.track.points.map(p=>({...p})),closed:(!this.boss||this.bossRule.id==='boundary-strike')&&this.track.closed,progress:(this.travel/1800)%1,gaps:hazards.filter(h=>h.type==='gap'&&!h.done&&h.visible).map(h=>({x:h.baseX,y:h.baseY,width:h.width+12}))},player,hazards,attacks:[],projectiles,portal:portal?{...portal,open:!!this.portalPassed,missed:!!this.portalMissed}:null,distance:this.travel,time:this.time,progress:this.runProgress(),corner:{face:player.face,turning:false,progress:0},fold:this.transform?{...this.transform}:null,transition:null,boss:this.boss?{...this.boss,attackTarget:{x:this.boss.x+(this.bossDamage%2?90:-90),y:this.boss.y+45},aimLane:this.held&&this.time-this.holdStarted>=.4?1:0,targetLane:this.bossCycleState?.lockedLane,safeLane:this.bossCycleState?.safeLane,lane:this.lane,held:this.held}:null,cue:this.cue(),feedback:this.feedback?{...this.feedback}:null,reducedMotion:false};
 }
}
const api={SCORE_DEATH_SECONDS,BOSS_DEFEAT_SECONDS,legBossFrame,legFootPolygon,legBossCells,LEG_CYCLE,LEG_JUMP_HEIGHT,LEG_PATTERN,RestorationRun,TRACK_KINDS,FREEPLAY_TRACK_KINDS,movingCourtFrame,BOSS_RULES,BOSS_SLOTS,buildTrack,atTrack,JUMP_SECONDS,JUMP_HEIGHT,WALL_HEIGHT,WALL_DURATION,wallPose,wallPolygon,bodyPolygon,overlaps,segmentContact,boundaryContact,boundaryDistance,heartPulseScale};root.QuadRiftRestoration=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
