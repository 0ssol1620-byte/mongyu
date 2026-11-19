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
 const dx=foot[0]-hip[0],dy=foot[1]-hip[1],d=Math.hypot(dx,dy),k=Math.min(1,21.7/(d||1)),ankle=[hip[0]+dx*k,hip[1]+dy*k];
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

const sole=[[-.8,-.35],[1.6,-.3],[2.05,.4],[1.9,.95],[-.9,.95],[-1,.1]];
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
function footPoints(ankle,angle=0){const co=Math.cos(angle),si=Math.sin(angle);return sole.map(([x,y])=>[ankle[0]+x*co-y*si,ankle[1]+x*si+y*co])}
function soleHeight(angle){return Math.max(...footPoints([0,0],angle).map(p=>p[1]))+.12}
function runFoot(u){
 const contact=.45,front=9.45,back=-9.45;
 if(u<contact){const angle=u<.08?-.28*(1-ease(u/.08)):u>.3?.7*ease((u-.3)/.15):0;return {point:[front-42*u,-soleHeight(angle)],angle,contact:true}}
 const v=(u-contact)/(1-contact),w=1-v,x=w*w*w*back+3*w*w*v*(back-7.7)+3*w*v*v*(front+7.7)+v*v*v*front;
 const y0=-soleHeight(.7),y1=-soleHeight(-.28),lift=15*v*v*w*w*w*w/(16/729),y=y0+(y1-y0)*ease(v)-lift;
 const angle=v<.45?.7+(-.55-.7)*ease(v/.45):-.55+(.27)*ease((v-.45)/.55);
 return {point:[x,y],angle,contact:false};
}
function blendArm(a,b,u){
 const mix=(x,y)=>x+Math.atan2(Math.sin(y-x),Math.cos(y-x))*u,s=a[0],upper=mix(Math.atan2(a[1][1]-s[1],a[1][0]-s[0]),Math.atan2(b[1][1]-s[1],b[1][0]-s[0])),lower=mix(Math.atan2(a[2][1]-a[1][1],a[2][0]-a[1][0]),Math.atan2(b[2][1]-b[1][1],b[2][0]-b[1][0])),elbow=[s[0]+8.5*Math.cos(upper),s[1]+8.5*Math.sin(upper)];return [s,elbow,[elbow[0]+7.5*Math.cos(lower),elbow[1]+7.5*Math.sin(lower)]];
}
function airborneFoot(progress,index){
 const poses=[[[ -10,-3],[11,-5]],[[-5,-15],[7,-17]],[[-10,-9],[11,-12]],[[-5,-6],[8,-5]],[[-5,-1],[6,-1]]],times=[0,.22,.5,.76,1];
 let segment=0;while(segment<3&&progress>times[segment+1])segment++;
 const u=ease((progress-times[segment])/(times[segment+1]-times[segment]));
 return poses[segment][index].map((v,k)=>v+(poses[segment+1][index][k]-v)*u);
}
function gait(time=0,q={},reduced=false){
 const idle=!!q.pose||reduced&&!Number.isFinite(q.strideDistance),wall=q.nativeState===12,height=Math.max(0,q.height||0),air=!!q.climbing||height>.05||wall,airMix=wall||q.climbing?1:ease(height/6),phase=idle?0:Number.isFinite(q.strideDistance)?q.strideDistance/42:time*2.4,local=((phase%1)+1)%1,step=local%.5;
 const x=9.45-42*Math.min(step,.45),flight=step>.45?.7*Math.sin(Math.PI*(step-.45)/.05):0,runPelvis=1.12+Math.sqrt(21.2**2-x*x)+flight,turn=(!air&&q.turning)?Math.sin(Math.PI*(q.turnProgress||0)):0;
 const pelvis=(idle?22.3:(runPelvis+(21.5-runPelvis)*airMix)*(1-turn)+21.5*turn)-(q.carrier?1:0),bob=idle?0:(21.1-runPelvis)*.6*(1-airMix)-.15*airMix,hip=[idle?0:-.65,-pelvis],shoulder=[q.carrier?5:3,(q.carrier?-30.5:-31.5)+bob];
 const samples=[0,.5].map(offset=>runFoot(((phase+offset)%1+1)%1));
 const feet=samples.map((sample,i)=>{
  if(idle)return [i?3:-3,-1];
  if(wall){const u=clamp((q.poseFrame??q.nativeFrame??0)/6,0,1);return i?[7+5*Math.sin(u*Math.PI),-8-6*Math.sin(u*Math.PI)]:[-9+5*u,-3-7*Math.sin(u*Math.PI)]}
  if(q.climbing)return i?[9,-16]:[-7,-3];
  if(air){const u=clamp(q.jumpProgress??.5,0,1),kick=clamp((q.kick||0)*2,0,1)*Math.sin(Math.PI*clamp(u/.7,0,1)),target=airborneFoot(u,i);if(i){target[0]+=14*kick;target[1]-=8*kick}return sample.point.map((v,k)=>v+(target[k]-v)*airMix)}
  const target=i?[5,-8]:[-4,-5];return sample.point.map((v,k)=>v+(target[k]-v)*turn);
 });
 const legs=feet.map(foot=>!air&&!q.pose&&q.nativeState===0?plantedLeg(hip,foot,q):legPose(hip,foot));
 const footAngles=samples.map((sample,i)=>idle||wall||q.climbing||q.turning||(!air&&Math.hypot(legs[i][2][0]-feet[i][0],legs[i][2][1]-feet[i][1])>1)?0:sample.angle*(1-airMix));
 const u=clamp(q.jumpProgress??.5,0,1),reach=Math.sin(Math.PI*u),fall=ease((u-.55)/.45),hands=q.pose?[[-10,q.pose==='raise-arms'?-46:-25],[14,q.pose==='raise-arms'?-46:-25]]:idle?[[-4,-21],[7,-22]]:q.nativeState===11?[[-17,-34],[18,-34]]:wall?[[-9,-38],[12,-43]]:q.climbing?[[-7,-45],[13,-43]]:[[-10+3*reach,-29-8*reach+6*fall],[12+3*reach,-33-7*reach+10*fall]];
 const running=[0,1].map(i=>{const swing=Math.cos(phase*TAU+i*Math.PI),angle=-.88*swing,flex=1.15-.65*swing,elbow=[shoulder[0]+8.5*Math.sin(angle),shoulder[1]+8.5*Math.cos(angle)],wrist=[elbow[0]+7.5*Math.sin(angle+flex),elbow[1]+7.5*Math.cos(angle+flex)];return [shoulder,elbow,wrist]}),posed=hands.map(hand=>{const dx=hand[0]-shoulder[0],dy=hand[1]-shoulder[1],k=Math.min(1,15.99/(Math.hypot(dx,dy)||1)),wrist=[shoulder[0]+dx*k,shoulder[1]+dy*k];return [shoulder,joint(shoulder,wrist,8.5,7.5,wrist[0]<shoulder[0]?-1:1),wrist]});
 const arms=idle||wall||q.climbing||q.nativeState===11?posed:air?running.map((a,i)=>blendArm(a,posed[i],airMix)):running;
 return {hip,shoulder,legs,arms,air,bob,footAngles};
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
function angular(c,points,ink){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=ink;c.fill()}
function paintLeg(c,bones,widths,ink,angle=0){
 c.beginPath();contourPath(c,limbContour(bones,widths));contourPath(c,footPoints(bones[2],angle));c.fillStyle=ink;c.fill();
}
function limbContour(bones,widths,foot=false){
 const [a,b,d]=bones,normal=(p,q)=>{const x=q[0]-p[0],y=q[1]-p[1],length=Math.hypot(x,y)||1;return [-y/length,x/length]},u=normal(a,b),v=normal(b,d),length=Math.hypot(u[0]+v[0],u[1]+v[1])||1,w=[(u[0]+v[0])/length,(u[1]+v[1])/length];
 const centres=[a,[(a[0]+b[0])/2,(a[1]+b[1])/2],b,[(b[0]+d[0])/2,(b[1]+d[1])/2],d],normals=[u,u,w,v,v];
 const left=centres.map((p,i)=>[p[0]+normals[i][0]*widths[i],p[1]+normals[i][1]*widths[i]]),right=centres.map((p,i)=>[p[0]-normals[i][0]*widths[i],p[1]-normals[i][1]*widths[i]]).reverse();
 return foot?[...left,[d[0]+2.3,d[1]-.3],[d[0]+2.8,d[1]+.8],[d[0]-.6,d[1]+1],...right]:[...left,...right];
}
function sprite(c,q,fx={},reduced=false,character='walker',style=look()){
 const t=reduced?0:fx.poseTime??fx.t??0,pose=gait(t,character==='elder'?{...q,carrier:true}:q,reduced),{hip,shoulder,legs,arms}=pose;
 const ink=fx.ink||(fx.onDark&&style.body==='#18121d'?'#fff8de':style.body),basis=actorBasis(q),size=(q.bodyHeight||60)/43.5;
 c.save();c.translate(q.x,q.y);c.rotate(basis.angle);c.scale(size,size*basis.sign);if(q.deathProgress)c.globalAlpha*=Math.max(.05,1-q.deathProgress);
 // Both legs are real filled contours; contact QA inspects their raster pixels.
 paintLeg(c,legs[0],[1.25,1.35,.95,1.05,.55],ink,pose.footAngles[0]);
 paintLeg(c,legs[1],[1.4,1.5,1.05,1.1,.58],ink,pose.footAngles[1]);
 contour(c,limbContour(arms[0],[1.05,.95,.68,.6,.36]),ink);
 const bob=pose.bob,lean=character==='elder'?2:0;
 if(character==='walker'&&!q.pose){
  const drift=Number.isFinite(q.strideDistance)?Math.sin(q.strideDistance/7):Math.sin(t*4);
  const tail=reduced?0:drift*1.4;
  const ribbon=style.detail==='scarf'?style.accent:ink==='#fff8de'?'#ffc08f':'#742861';
  contour(c,[[4,-35+bob],[-2,-33+bob],[-8,-33+bob+tail],[-14,-29+bob+tail],[-8,-29+bob+tail],[-2,-31+bob],[5,-32+bob]],ribbon);
 }
 c.beginPath();c.moveTo(hip[0]-2.3,hip[1]+1);c.bezierCurveTo(-2.1,hip[1]-3,-1.2,shoulder[1]+3,shoulder[0]-1.4,shoulder[1]-1.3);
 c.quadraticCurveTo(3+lean,-32+bob,3.2+lean,-36+bob);c.lineTo(5.1+lean,-35.8+bob);
 c.quadraticCurveTo(4.5+lean,-32.7+bob,shoulder[0]+2.8,shoulder[1]-.5);c.bezierCurveTo(7.4,shoulder[1]+3,3.8,hip[1]-3,hip[0]+2.9,hip[1]+1);c.closePath();c.fillStyle=ink;c.fill();
 contour(c,limbContour(arms[1],[1.25,1.1,.8,.72,.48]),ink);
 // Independently drawn angular profile: no ball head or separate joint discs.
 // The commercial atlas is research only, never a shipped texture or traced outline.
 const headLean=character==='elder'?1.5:0;
 angular(c,[[2.1+headLean,-36.2+bob],[2.5+headLean,-39.8+bob],[5.2+headLean,-42.5+bob],[7.1+headLean,-42.5+bob],[6.8+headLean,-39.4+bob],[5.5+headLean,-38.1+bob],[5.4+headLean,-35.8+bob]],ink);
 if(character==='woman')contour(c,[[2,-41+bob],[-.5,-39+bob],[-.8,-35+bob],[-5,-33+bob],[-2.8,-36+bob],[.8,-41.5+bob]],ink);
 if(character==='elder'){
  // A second person rides on the carrier's back; a hump alone lost this event.
  angular(c,[[-8,-39+bob],[-7,-43+bob],[-4,-45+bob],[-2.5,-44+bob],[-3,-41+bob],[-5,-39+bob]],ink);
  contour(c,[[-5,-39+bob],[-2,-34+bob],[-1,-27+bob],[-5,-26+bob],[-7,-32+bob]],ink);
  line(c,[[-3,-35+bob],[1,-32+bob],[5,-33+bob]],ink,1.5);
  line(c,[[-4,-27+bob],[2,-24+bob],[3,-20+bob]],ink,1.6);
  line(c,[[-5,-27+bob],[-7,-23+bob],[-3,-20+bob]],ink,1.4);
 }
 if(character==='walker'&&!q.pose)line(c,[[3.2,-34+bob],[5,-34.5+bob]],ink==='#fff8de'?'#693b72':'#f0a97f',1.7);
 if(style.detail==='leaf')contour(c,[[2,-43],[5,-45],[7,-43.5],[4,-42]],style.accent);
 if(style.detail==='star')oval(c,1,-43,1,1,style.accent);
 if(style.detail==='comet')contour(c,[[1,-40],[-4,-42],[-9,-40.5],[-4,-43.5]],style.accent);
 c.restore();return true;
}

function dog(c,q,fx={},reduced=false){
 if(!q)return;const phase=Number.isFinite(q.strideDistance)?q.strideDistance/(70/3):reduced?0:(fx.poseTime??fx.t??0)*100/(70/3),air=(q.height||0)>1;
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
 if(run.openingCourse)return v.cue?.text||'';
 if(v.native?.awaitingBossConfirmation)return '탭하여 다음으로';
 if(v.nativeRuntime&&v.scoreFinalization&&v.qualified&&v.state==='play')return '목표 달성 · 계속 달립니다.';
 if(v.cue?.text&&v.cue.phase==='confirm')return v.cue.text;
 if(v.feedback?.kind==='hit')return '';
 if((v.time||0)<6&&(run.inputCount||run.jumps||0)===0)return v.boss?'타이밍에 맞춰 탭':'탭하여 점프';
 return '';
}
function icon(item){return '<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="35" fill="#9eacac"/><g fill="'+item.body+'"><path d="M39 43Q35 49 29 52Q27 54 31 63L33 65L34 64L33 62L32 54Q40 52 42 47L48 53L41 63L40 65L44 65L45 63L53 54Q54 51 43 43L46 32L45 29L42 29Q42 35 39 43Z"/><path d="M43 33Q37 33 32 40L35 47L38 47L37 44L36 40L42 37Q48 41 53 40L56 35L54 33L51 37L46 33Z"/><path d="M41 29L41 23L46 19L50 19L49 24L46 27L46 30Z"/></g></svg>'}
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
const api={joint,gait,runFoot,footPoints,actorBasis,contour,limbContour,worldPalette,nativeSupport,looks,available,decode,count,look,clock,sprite,dog,narrative,title,exterior,chamber,camera,cameraZoom,requestImmersive,hud,hint,mount,storageKey:KEY};root.MongyuMobile=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
