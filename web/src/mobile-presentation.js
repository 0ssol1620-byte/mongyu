/* MONGYU R80. Presentation only: no simulation writes, random draws, or paid grants. */
(function(root){'use strict';
const TAU=Math.PI*2,KEY='mongyu.r80.style.v1';
const looks=Object.freeze([
 ['moon','길',0,'#18121d','#18121d','plain'],['ink','달빛',0,'#fff8de','#fff8de','plain'],
 ['dew','이슬',1,'#bcf4df','#75cbbd','leaf'],['peach','복숭아',3,'#ffd2bd','#ed8c83','scarf'],
 ['lilac','라일락',6,'#d9c6fa','#a191e1','comet'],['tide','물결',10,'#a5dae8','#63acd1','leaf'],
 ['ember','잔불',15,'#f7be88','#ee755a','comet'],['moss','이끼',25,'#c5db97','#91ad6c','leaf'],
 ['dusk','저녁별',40,'#dfb9cf','#edcd88','star'],['frost','서리',60,'#d6e8f5','#92d4e6','comet'],
 ['eclipse','일식',80,'#ad9dba','#f5bc65','star'],['dawn','새벽',100,'#fff1c7','#ffd47d','star']
].map(([id,name,at,body,accent,detail])=>Object.freeze({id,name,at,body,accent,detail})));
let selected='moon',saved=true,progress=()=>0,lastWall=null,motion=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function count(n){return Number.isSafeInteger(n)?clamp(n,0,100):0}
function available(id,n){const item=looks.find(x=>x.id===id);return !!item&&count(n)>=item.at}
function decode(raw){try{const v=JSON.parse(raw);return v?.schema===1&&looks.some(x=>x.id===v.selected)?v.selected:'moon'}catch(_){return 'moon'}}
function look(){return looks.find(x=>x.id===selected&&available(x.id,progress()))||looks[0]}
function clock(wall,state){const delta=lastWall===null?0:clamp(wall-lastWall,0,.05);lastWall=wall;if(state==='play'||state==='transition'||state==='title')motion+=delta;return motion}
function line(c,pts,color,width){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke()}
function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fillStyle=color;c.fill()}
// Two rigid links per limb: the knee follows the foot, never an unrelated wave.
function joint(a,b,upper=11.5,lower=11.5,bend=1){
 const dx=b[0]-a[0],dy=b[1]-a[1],raw=Math.hypot(dx,dy),d=clamp(raw,.001,upper+lower-.001),ux=dx/(raw||1),uy=dy/(raw||1);
 const reach=(upper*upper-lower*lower+d*d)/(2*d),rise=Math.sqrt(Math.max(0,upper*upper-reach*reach));
 return [a[0]+ux*reach-uy*rise*bend,a[1]+uy*reach+ux*rise*bend];
}
function legPose(hip,foot){
 const dx=foot[0]-hip[0],dy=foot[1]-hip[1],d=Math.hypot(dx,dy),k=Math.min(1,21.99/(d||1)),ankle=[hip[0]+dx*k,hip[1]+dy*k];
 return [hip,joint(hip,ankle,11,11,-1),ankle];
}
// Quarter-unit edge tolerance keeps native rounded anchors valid while reserving
// room for the filled skin, instead of testing only a thin centreline.
function segmentHits(a,b,r){
 let low=0,high=1;
 for(const [p,d,min,max]of [[a.x,b.x-a.x,r.x+.25,r.x+15.75],[a.y,b.y-a.y,r.y+.25,r.y+15.75]]){
  if(Math.abs(d)<1e-10){if(p<=min||p>=max)return false;continue}
  const v=(min-p)/d,w=(max-p)/d;low=Math.max(low,Math.min(v,w));high=Math.min(high,Math.max(v,w));if(high-low<1e-8)return false;
 }return high>=0&&low<=1;
}
function plantedLeg(hip,foot,q){
 const blockers=q.groundContact?.blockers;if(!blockers?.length)return legPose(hip,foot);
 const basis=actorBasis(q),size=(q.bodyHeight||60)/43.5,reach=44*size,rects=blockers.filter(r=>r.x<q.x+reach&&r.x+16>q.x-reach&&r.y<q.y+reach&&r.y+16>q.y-reach);
 const world=([x,y])=>({x:q.x+(x*basis.tx-y*basis.nx)*size,y:q.y+(x*basis.ty-y*basis.ny)*size});
 const inside=(p,r)=>p.x>r.x+.5&&p.x<r.x+15.5&&p.y>r.y+.5&&p.y<r.y+15.5;
 const lift=(x,y,extra=0)=>{
  const ankle=[x,y-extra];
  for(let i=0;i<8;i++){
   const p=world(ankle),r=rects.find(r=>inside(p,r));if(!r)break;
   const dx=basis.nx>1e-8?(r.x+18.3-p.x)/basis.nx:basis.nx< -1e-8?(r.x-2.3-p.x)/basis.nx:Infinity;
   const dy=basis.ny>1e-8?(r.y+18.3-p.y)/basis.ny:basis.ny< -1e-8?(r.y-2.3-p.y)/basis.ny:Infinity;
   const distance=Math.min(dx,dy);if(!Number.isFinite(distance)||distance>64)break;ankle[1]-=distance/size;
  }return ankle;
 };
 const clear=leg=>{const points=leg.map(world);return !rects.some(r=>segmentHits(points[0],points[1],r)||segmentHits(points[1],points[2],r))};
 let best=legPose(hip,lift(...foot));if(clear(best)||rects.some(r=>inside(world(hip),r)))return best;let score=Infinity;
 // Lift onto a step or shorten the stride, retaining both rigid bone lengths.
 for(const x of [foot[0],foot[0]*.75,foot[0]*.5,foot[0]*.25,0,-4,-8,-14,-18,-21,4,8,14,18,21])for(const extra of [0,4,8,12,20,24]){
  const ankle=lift(x,foot[1],extra),cost=(ankle[0]-foot[0])**2+(ankle[1]-foot[1])**2*.7;if(cost>=score)continue;const candidate=legPose(hip,ankle);if(clear(candidate)){best=candidate;score=cost}
 }return best;
}

function gait(time=0,q={},reduced=false){
 const idle=!!q.pose||reduced,wall=q.nativeState===12,air=!!q.climbing||(q.height||0)>1||wall,phase=idle?0:Number.isFinite(q.strideDistance)?q.strideDistance/(110/3):time*2.8;
 const bob=idle||air?0:-.35*(1-Math.cos(phase*TAU*2)),pelvis=idle?22.3:air?21.5:1+Math.sqrt(21.8**2-(11*Math.cos(phase*TAU))**2),hip=[0,-pelvis],shoulder=[3,-31.5+bob];
 const feet=[0,.5].map((offset,i)=>{const u=((phase+offset)%1+1)%1;
  if(idle)return [i?3:-3,-1];
  if(wall){const u=clamp((q.nativeFrame+(q.poseFraction||0))/6,0,1);return i?[7+5*Math.sin(u*Math.PI),-8-6*Math.sin(u*Math.PI)]:[-9+5*u,-3-7*Math.sin(u*Math.PI)]}
  if(q.climbing)return i?[9,-16]:[-7,-3];
  if(air){const kick=clamp(q.kick||0,0,1),u=clamp(q.jumpProgress??.5,0,1),fall=clamp((u-.55)/.45,0,1);return i?[8+kick*10,-14+11*fall-kick*5]:[-10+3*fall,-9+5*fall-Math.sin(Math.PI*u)*3]}
  // Ground contact occupies 60% of the cycle, with a clean toe-off and recovery.
  return u<.6?[11-22*u/.6,-1]:[-11+22*(u-.6)/.4,-1-9*Math.sin(Math.PI*(u-.6)/.4)];
 });
 if(q.turning&&!air){const lift=22*Math.sin(Math.PI*(q.turnProgress||0));for(const foot of feet)foot[1]-=lift}
 const legs=feet.map(foot=>!air&&!q.pose&&q.nativeState===0?plantedLeg(hip,foot,q):legPose(hip,foot));
 const swing=idle?0:Math.sin(phase*TAU),hands=q.pose?[[q.pose==='open-arms'?-18:-10,q.pose==='raise-arms'?-46:-28],[q.pose==='open-arms'?20:14,q.pose==='raise-arms'?-46:-27]]:q.nativeState===11?[[-17,-34],[18,-34]]:wall?[[-9,-38],[12,-43]]:q.climbing?[[-7,-45],[13,-43]]:air?[[-7,-28],[11,-32+5*clamp(((q.jumpProgress??.5)-.55)/.45,0,1)]]:[[-5+swing*9,-23-swing*2],[8-swing*9,-24+swing*2]];
 const arms=!idle&&!air&&!q.climbing&&q.nativeState!==11?[0,1].map(i=>{const angle=-.85*Math.cos(phase*TAU+i*Math.PI),elbow=[shoulder[0]+9*Math.sin(angle),shoulder[1]+9*Math.cos(angle)],wrist=[elbow[0]+9*Math.sin(angle+1.65),elbow[1]+9*Math.cos(angle+1.65)];return [shoulder,elbow,wrist]}):hands.map(hand=>{const dx=hand[0]-shoulder[0],dy=hand[1]-shoulder[1],k=Math.min(1,17.99/(Math.hypot(dx,dy)||1)),wrist=[shoulder[0]+dx*k,shoulder[1]+dy*k];return [shoulder,joint(shoulder,wrist,9,9,wrist[0]<shoulder[0]?-1:1),wrist]});
 return {hip,shoulder,legs,arms,air,bob};
}
// Forward motion and the surface normal are independent. Reversing mirrors
// the runner along its surface; rotating by PI alone would bury its body.
function actorBasis(q){
 const angle=q.renderAngle??Math.atan2(q.tangent?.y||0,q.tangent?.x??1),sign=q.direction===1?-1:1;
 return {angle,sign,tx:Math.cos(angle),ty:Math.sin(angle),nx:Math.sin(angle)*sign,ny:-Math.cos(angle)*sign};
}
// Tapered, filled anatomy follows the contact rig. No circles at the joints.
function contourPath(c,points){
 const last=points[points.length-1],first=points[0];c.moveTo((last[0]+first[0])/2,(last[1]+first[1])/2);
 for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];c.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2)}
 c.closePath();
}
function contour(c,points,ink){c.beginPath();contourPath(c,points);c.fillStyle=ink;c.fill()}
function paintLeg(c,bones,widths,ink){
 c.beginPath();contourPath(c,limbContour(bones,widths));const [x,y]=bones[2];contourPath(c,[[x-.8,y-.35],[x+1.6,y-.3],[x+2.05,y+.4],[x+1.9,y+.95],[x-.9,y+.95],[x-1,y+.1]]);c.fillStyle=ink;c.fill();
}
function limbContour(bones,widths,foot=false){
 const [a,b,d]=bones,normal=(p,q)=>{const x=q[0]-p[0],y=q[1]-p[1],length=Math.hypot(x,y)||1;return [-y/length,x/length]},u=normal(a,b),v=normal(b,d),length=Math.hypot(u[0]+v[0],u[1]+v[1])||1,w=[(u[0]+v[0])/length,(u[1]+v[1])/length];
 const centres=[a,[(a[0]+b[0])/2,(a[1]+b[1])/2],b,[(b[0]+d[0])/2,(b[1]+d[1])/2],d],normals=[u,u,w,v,v];
 const left=centres.map((p,i)=>[p[0]+normals[i][0]*widths[i],p[1]+normals[i][1]*widths[i]]),right=centres.map((p,i)=>[p[0]-normals[i][0]*widths[i],p[1]-normals[i][1]*widths[i]]).reverse();
 return foot?[...left,[d[0]+2.3,d[1]-.3],[d[0]+2.8,d[1]+.8],[d[0]-.6,d[1]+1],...right]:[...left,...right];
}
function sprite(c,q,fx={},reduced=false,character='walker',style=look()){
 const t=reduced?0:fx.poseTime??fx.t??0,pose=gait(t,q,reduced),{hip,shoulder,legs,arms}=pose;
 const ink=fx.ink||(fx.onDark&&style.body==='#18121d'?'#fff8de':style.body),basis=actorBasis(q),size=(q.bodyHeight||60)/43.5;
 c.save();c.translate(q.x,q.y);c.rotate(basis.angle);c.scale(size,size*basis.sign);if(q.deathProgress)c.globalAlpha*=Math.max(.05,1-q.deathProgress);
 // Both legs are real filled contours; contact QA inspects their raster pixels.
 paintLeg(c,legs[0],[2,2.05,1.35,1.45,.72],ink);
 paintLeg(c,legs[1],[2.15,2.2,1.4,1.55,.75],ink);
 contour(c,limbContour(arms[0],[1.65,1.5,1.05,.95,.65]),ink);
 const bob=pose.bob,lean=character==='elder'?2:0;
 c.beginPath();c.moveTo(hip[0]-1.8,hip[1]+1);c.bezierCurveTo(-2.1,hip[1]-3,-1.2,shoulder[1]+3,shoulder[0]-1.4,shoulder[1]-1.3);
 c.quadraticCurveTo(3+lean,-32+bob,3.2+lean,-35.5+bob);c.lineTo(5.4+lean,-35.3+bob);
 c.quadraticCurveTo(4.5+lean,-32.7+bob,shoulder[0]+2,shoulder[1]-.5);c.bezierCurveTo(6.5,shoulder[1]+3,3,hip[1]-3,hip[0]+2.3,hip[1]+1);c.closePath();c.fillStyle=ink;c.fill();
 contour(c,limbContour(arms[1],[1.7,1.55,1.1,1,.7]),ink);
 const headX=character==='elder'?6:4,headY=-38.5+bob;oval(c,headX,headY,2.65,3.9,ink);
 if(character==='woman')contour(c,[[2,-41+bob],[-.5,-39+bob],[-.8,-35+bob],[-5,-33+bob],[-2.8,-36+bob],[.8,-41.5+bob]],ink);
 if(character==='elder')contour(c,[[-1,-30+bob],[-4,-29+bob],[-4.8,-24+bob],[.5,-21+bob],[2,-26+bob]],ink);
 if(style.detail==='leaf')contour(c,[[2,-43],[5,-45],[7,-43.5],[4,-42]],style.accent);
 if(style.detail==='star')oval(c,1,-43,1,1,style.accent);
 if(style.detail==='comet')contour(c,[[1,-40],[-4,-42],[-9,-40.5],[-4,-43.5]],style.accent);
 c.restore();return true;
}

function dog(c,q,fx={},reduced=false){
 if(!q)return;const phase=reduced?0:(q.strideDistance??(fx.poseTime??fx.t??0)*100)/(70/3),air=(q.height||0)>1;
 const ink=fx.ink||look().body;c.save();c.translate(q.x,q.y);const basis=actorBasis(q);c.rotate(basis.angle);c.scale((q.bodyHeight||23)/23,(q.bodyHeight||23)/23*basis.sign);
 for(let i=0;i<4;i++){const front=i>=2,x=front?7:-9,u=((phase+(i%2)*.5+(front?.12:0))%1+1)%1,foot=air?[x+(i%2?4:-4),-4]:u<.6?[x+7-14*u/.6,0]:[x-7+14*(u-.6)/.4,-6*Math.sin(Math.PI*(u-.6)/.4)];contour(c,limbContour([[x,-10],[x+(front?-2:2),-5],foot],[1.4,1.25,.9,.75,.5]),ink)}
 contour(c,[[-13,-14],[-8,-17],[5,-16],[10,-21],[15,-22],[17,-18],[21,-16],[20,-14],[14,-13],[10,-9],[-8,-9],[-13,-11]],ink);
 contour(c,[[9,-20],[8,-25],[14,-22],[13,-18]],ink);contour(c,[[-11,-12],[-16,-15],[-20,-21],[-17,-20],[-14,-16],[-10,-15]],ink);c.restore();
}
const themes=[['#121a2b','#43607a','#d6a582'],['#10252d','#306869','#8ddbc8'],['#231e38','#6d548a','#c2b0e5'],['#211e2e','#704e70','#ecadc2'],['#152924','#446844','#bed798'],['#302124','#87554b','#f2ba88'],['#152633','#38698b','#8bcee5'],['#211e36','#665c9a','#c2b4f2'],['#2d2224','#884d50','#f7a89d'],['#242237','#6a657b','#eed8a1']];
function atmosphere(c,x,y,w,h,t,stage=0,gain=1){const p=themes[stage%10];
 const g=c.createLinearGradient(x,y,x+w*.3,y+h);g.addColorStop(0,p[0]);g.addColorStop(.55,p[1]);g.addColorStop(1,p[0]);c.fillStyle=g;c.fillRect(x,y,w,h);
 c.save();c.globalAlpha=.08;c.strokeStyle=p[2];c.lineWidth=Math.max(1,w*.0015);
 for(let i=0;i<7;i++){c.beginPath();const yy=y+h*(.18+i*.105),d=Math.sin(t*.13+i)*h*.04*gain;c.moveTo(x-w*.1,yy);c.bezierCurveTo(x+w*.25,yy-h*.13+d,x+w*.55,yy+h*.12+d,x+w*1.1,yy-h*.06);c.stroke()}
 c.globalAlpha=.55;for(let i=0;i<39;i++){const px=x+((i*.61803398875)%1)*w,py=y+((i*.38196601125+.1)%1)*h,drift=Math.sin(t*.3+i)*3*gain;oval(c,px,py+drift,i%7===0?1.3:.65,i%7===0?1.3:.65,p[2])}c.restore();
}
// Bright flat planes and 16-unit terrain tiles, rather than screen-fixed neon boxes.
const worldPalettes=[
 ['#eced8a','#9a1645','#d9af35','#fff8c9'],['#379ee2','#075392','#f5e652','#9be2f1'],
 ['#cab7ed','#6632a0','#df676d','#f9f0b2'],['#ef9abd','#7a205e','#d9e76c','#ffe3b6'],
 ['#a6d985','#276e54','#e3b84a','#eef0b0'],['#f3b567','#a63c4e','#7270bc','#ffe8a0'],
 ['#82c8ea','#32528c','#e65e9c','#def4aa'],['#b4a0df','#623a9c','#e7b27c','#eee3b4'],
 ['#ee907c','#9b2869','#d7e66b','#ffdda2'],['#e3b5ce','#4f388f','#b56c94','#f3e2a5']
];
function worldPalette(stage=0){return worldPalettes[((stage%10)+10)%10]}
function exterior(c,cam,b,fx){
 const p=worldPalette(fx.stage),w=cam.right-cam.left,h=cam.bottom-cam.top;c.save();c.fillStyle=p[0];c.fillRect(cam.left,cam.top,w,h);
 // Large, quiet planes remain tied to world coordinates, so travelling is visible.
 c.globalAlpha=fx.gain<.4?.12:.24;c.fillStyle=p[1];const step=256;
 for(let x=Math.floor(cam.left/step)*step;x<cam.right;x+=step){const y=Math.floor(cam.top/step)*step;c.fillRect(x,y,step*.28,h+step)}
 c.restore();return true;
}
function chamber(c,b,fx){return true}
function nativeSupport(c,geo,fx){
 if(!Array.isArray(geo.nativeSurfaces))return false;const p=worldPalette(fx.stage),view=fx.viewBounds;c.save();
 for(const face of geo.nativeSurfaces){const [tx,ty]=face.tangent,nx=-ty,ny=tx;c.save();c.transform(tx,ty,nx,ny,0,0);
  for(let col=0;col<face.points.length;col++){const q=face.points[col];if(!q)continue;
   const dx=(tx+nx)*16,dy=(ty+ny)*16;
   if(view&&(Math.max(q.x,q.x+dx)<view.left-2||Math.min(q.x,q.x+dx)>view.right+2||Math.max(q.y,q.y+dy)<view.top-2||Math.min(q.y,q.y+dy)>view.bottom+2))continue;
   const x=q.x*tx+q.y*ty,y=q.x*nx+q.y*ny;
   c.fillStyle=(col+face.side)%4<2?p[1]:p[2];c.fillRect(x,y,16,16);
   c.fillStyle=p[0];c.fillRect(x,y,1,16);c.fillRect(x,y+15,16,1);
  }c.restore();
 }c.restore();return true;
}
function fieldDraw(c,x,y,w,h,fx){const p=worldPalette(fx.stage);c.save();c.fillStyle=p[0];c.fillRect(x,y,w,h);c.globalAlpha=.18;c.fillStyle=p[1];const unit=Math.max(12,Math.min(w,h)/18);for(let i=0;i<18;i++)for(let j=0;j<18;j++)if((i+j)%4===0)c.fillRect(x+i*unit,y+j*unit,unit*.8,unit*.8);c.restore()}
function cameraZoom(geo,opt={},run){
 // No evidence links a straight/corner proximity to native zoom. R85's
 // invented permanent push-in is removed. Native layout effects render below.
 return 1;
}
function camera(viewport,geo,opt={},run){
 if(!geo.nativeRuntime||geo.boss||!geo.player)return null;
 const width=Math.max(1,viewport.width),height=Math.max(1,viewport.height),q=geo.player,basis=actorBasis(q);
 const baseScale=Math.min(width/384,height/384),zoom=cameraZoom(geo,opt,run),scale=baseScale;
 // Track the displayed body centre, including interpolated jumps and turns.
 // A fixed screen target avoids the old direction-dependent orbit across the phone.
 const half=(q.bodyHeight||42.5)/2,targetX=q.x+basis.nx*half,targetY=q.y+basis.ny*half;
 const offsetX=width/2-targetX*scale,offsetY=height/2-targetY*scale;
 return {width,height,scale,baseScale,zoom,offsetX,offsetY,left:-offsetX/scale,right:(width-offsetX)/scale,top:-offsetY/scale,bottom:(height-offsetY)/scale,follow:true,framing:'viewport-cover',target:{x:targetX,y:targetY}};
}

function title(c,opt={}){const w=opt.viewport.width,h=opt.viewport.height,wide=w>h*1.15,t=opt.reduced?0:opt.time||0;
 c.save();atmosphere(c,0,0,w,h,t,0,opt.reduced?0:1);c.save();c.globalAlpha=.16;fieldDraw(c,0,0,w,h,{stage:2,poseTime:t,gain:opt.reduced?0:.5});c.restore();const x=wide?w*.65:w*.5,y=wide?h*.45:h*.47,r=Math.min(w*(wide?.21:.38),h*.245);
 // Four suspended corners, an eclipse, and a looping traveller: the game's motif.
 c.translate(x,y);const halo=c.createRadialGradient(0,0,r*.15,0,0,r*1.7);halo.addColorStop(0,'#d4b18d24');halo.addColorStop(1,'#d4b18d00');c.fillStyle=halo;c.fillRect(-r*1.7,-r*1.7,r*3.4,r*3.4);
 oval(c,0,0,r*.69,r*.69,'#dfbea0');oval(c,r*.12,-r*.08,r*.65,r*.65,'#202d43');
 c.save();c.rotate(-.23+Math.sin(t*.16)*.035);c.strokeStyle='#dccbb1';c.lineWidth=1.2;
 for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);c.beginPath();c.moveTo(-r*.98,-r*.44);c.lineTo(-r*.98,-r*.98);c.lineTo(-r*.44,-r*.98);c.stroke();oval(c,-r*.98,-r*.98,2,2,'#e6bd98');c.restore()}c.restore();
 const a=t*.22+.8;c.save();c.rotate(-.2);c.strokeStyle='#ddc8ae50';c.lineWidth=1;c.beginPath();c.ellipse(0,0,r*1.22,r*.79,0,0,TAU);c.stroke();c.restore();
 for(let i=0;i<8;i++){const aa=a-i*.045;oval(c,Math.cos(aa)*r*1.22,Math.sin(aa)*r*.79,Math.max(.5,2-i*.2),Math.max(.5,2-i*.2),'#efd4ac'+Math.round(180-i*18).toString(16).padStart(2,'0'))}
 c.save();c.translate(-r*.06,r*.85);const scale=Math.min(1.2,r/105);c.scale(scale,scale);sprite(c,{x:0,y:0,tangent:{x:1,y:0},bodyHeight:64},{poseTime:t,onDark:true},!!opt.reduced);c.restore();
 c.restore();return {kind:'r80-title',width:w,height:h};
}
let immersiveAttempted=false;
function requestImmersive(event,doc=root.document){
 if(immersiveAttempted||event?.isTrusted!==true||doc?.fullscreenElement||!root.matchMedia?.('(pointer: coarse)').matches||typeof doc?.documentElement?.requestFullscreen!=='function')return false;
 immersiveAttempted=true;
 try{Promise.resolve(doc.documentElement.requestFullscreen({navigationUI:'hide'})).catch(()=>{});return true}catch(_){return false}
}
function hud(v){return Math.max(0,Math.floor(v.score||0))+'  '+('●'.repeat(Math.max(0,Math.min(5,v.hearts||0))))}
function hint(v,run){
 if(v.native?.awaitingBossConfirmation)return '탭하여 다음으로';
 if(v.nativeRuntime&&v.scoreFinalization&&v.qualified&&v.state==='play')return '목표 달성 · 계속 달립니다.';
 if(v.cue?.text&&v.cue.phase==='confirm')return v.cue.text;
 if(v.feedback?.kind==='hit')return '';
 if((v.time||0)<6&&(run.inputCount||run.jumps||0)===0)return v.boss?'타이밍에 맞춰 탭':'탭하여 점프';
 return '';
}
function icon(item){return '<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="35" fill="#9eacac"/><g fill="'+item.body+'"><path d="M39 43Q35 49 29 52Q27 54 31 63L33 65L34 64L33 62L32 54Q40 52 42 47L48 53L41 63L40 65L44 65L45 63L53 54Q54 51 43 43L46 32L45 29L42 29Q42 35 39 43Z"/><path d="M43 33Q37 33 32 40L35 47L38 47L37 44L36 40L42 37Q48 41 53 40L56 35L54 33L51 37L46 33Z"/><ellipse cx="44" cy="24" rx="3.5" ry="5"/></g></svg>'}
function narrative(c,x,y,h,pose,t,reduced,ink){return sprite(c,{x,y,bodyHeight:h,pose,tangent:{x:1,y:0}},{poseTime:t,ink},reduced)}
function mount(host){const d=host.document,$=id=>d.getElementById(id);progress=host.progress;try{selected=decode(host.storage.getItem(KEY))}catch(_){saved=false}
 function render(){const n=count(progress()),equipped=look();$('wardrobeCount').textContent=n+' / 100개의 기억';$('wardrobeStatus').textContent=saved?'기억을 모으면 새로운 옷이 열려요.':'이번 실행에만 옷을 보관할 수 있어요.';
  for(const item of looks){const b=$('look-'+item.id),owned=available(item.id,n);b.disabled=!owned;b.setAttribute('aria-pressed',String(equipped.id===item.id));b.setAttribute('aria-label',item.name+(owned?equipped.id===item.id?' · 입는 중':' · 입기':' · 기억 '+item.at+'개 필요'));b.querySelector('small').textContent=owned?equipped.id===item.id?'입는 중':'입기':'기억 '+item.at+'개'}
 }
 for(const item of looks){const b=d.createElement('button');b.id='look-'+item.id;b.setAttribute('id',b.id);b.innerHTML=icon(item)+'<span>'+item.name+'</span><small></small>';b.onclick=()=>{if(!available(item.id,progress()))return;selected=item.id;try{const value=JSON.stringify({schema:1,selected});host.storage.setItem(KEY,value);saved=host.storage.getItem(KEY)===value}catch(_){saved=false}render();host.redraw()};$('wardrobeLooks').appendChild(b)}
 $('wardrobeClose').onclick=host.close;
 $('shopOpen').textContent='옷장';$('shopOpen').onclick=e=>{host.open(e);render();$('wardrobeClose').focus({preventScroll:true})};
 render();return {render,view:()=>({selected:look().id,saved,collected:count(progress())})};
}
const api={joint,gait,actorBasis,contour,limbContour,worldPalette,nativeSupport,looks,available,decode,count,look,clock,sprite,dog,narrative,title,exterior,chamber,camera,cameraZoom,requestImmersive,hud,hint,mount,storageKey:KEY};root.MongyuMobile=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
