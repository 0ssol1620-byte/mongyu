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
function gait(time=0,q={},reduced=false){
 const idle=!!q.pose||reduced,wall=q.nativeState===12,air=!!q.climbing||(q.height||0)>1||wall,phase=idle?0:Number.isFinite(q.strideDistance)?q.strideDistance/48:time*3.3;
 const bob=idle||air?0:-.4*(1-Math.cos(phase*TAU*2)),hip=[0,-18.8+bob],shoulder=[3,-30+bob];
 const feet=[0,.5].map((offset,i)=>{const u=((phase+offset)%1+1)%1;
  if(idle)return [i?5:-5,0];
  if(wall){const u=clamp((q.nativeFrame+(q.poseFraction||0))/6,0,1);return i?[7+5*Math.sin(u*Math.PI),-8-6*Math.sin(u*Math.PI)]:[-9+5*u,-3-7*Math.sin(u*Math.PI)]}
  if(q.climbing)return i?[9,-16]:[-7,-3];
  if(air){const kick=clamp(q.kick||0,0,1);return i?[10+kick*10,-10-kick*6]:[-10,-7-Math.sin(Math.PI*clamp(q.jumpProgress??.5,0,1))*4]}
  // Ground contact occupies 60% of the cycle, with a clean toe-off and recovery.
  return u<.6?[14.4-28.8*u/.6,0]:[-14.4+28.8*(u-.6)/.4,-10*Math.sin(Math.PI*(u-.6)/.4)];
 });
 const legs=feet.map(foot=>{const dx=foot[0]-hip[0],dy=foot[1]-hip[1],d=Math.hypot(dx,dy),k=Math.min(1,24.99/(d||1)),ankle=[hip[0]+dx*k,hip[1]+dy*k];return [hip,joint(hip,ankle,12.5,12.5,-1),ankle]});
 const swing=idle?0:Math.sin(phase*TAU),hands=q.pose?[[q.pose==='open-arms'?-18:-10,q.pose==='raise-arms'?-46:-28],[q.pose==='open-arms'?20:14,q.pose==='raise-arms'?-46:-27]]:q.nativeState===11?[[-17,-34],[18,-34]]:wall?[[-9,-38],[12,-43]]:q.climbing?[[-7,-45],[13,-43]]:air?[[-11,-33],[15,-38]]:[[-7-swing*4,-29],[12+swing*4,-27]];
 const arms=hands.map((hand,i)=>[shoulder,joint(shoulder,hand,9,9,i?-1:1),hand]);
 return {hip,shoulder,legs,arms,air,bob};
}
// The default is a plain, small-headed runner. No hood, face mask or scarf.
function sprite(c,q,fx={},reduced=false,character='walker',style=look()){
 const t=reduced?0:fx.poseTime??fx.t??0,pose=gait(t,q,reduced),{hip,shoulder,legs,arms}=pose,ink=fx.onDark&&style.body==='#18121d'?'#fff8de':style.body,light=parseInt(ink.slice(1,3),16)+parseInt(ink.slice(3,5),16)+parseInt(ink.slice(5,7),16)>540;
 c.save();c.translate(q.x,q.y);c.rotate(q.renderAngle??Math.atan2(q.tangent?.y||0,q.tangent?.x??1));const size=(q.bodyHeight||60)/43.5;c.scale(size,size);
 if(q.deathProgress)c.globalAlpha*=Math.max(.05,1-q.deathProgress);
 for(const i of [0,1]){c.globalAlpha*=i?1:.82;if(light||fx.contrast){const outline=light?'#18121d':'#fff8de';line(c,legs[i],outline,4.6);line(c,arms[i],outline,4.3)}line(c,legs[i],ink,3.1);const foot=legs[i][2];line(c,[[foot[0]-.5,foot[1]],[foot[0]+3,foot[1]-.2]],ink,2.5);line(c,arms[i],ink,2.8);if(!i)c.globalAlpha/=.82}
 if(light||fx.contrast)line(c,[hip,[1,-25+pose.bob],shoulder],light?'#18121d':'#fff8de',5.8);line(c,[hip,[1,-25+pose.bob],shoulder],ink,4.3);
 const headX=character==='elder'?6:4,headY=-38.5+pose.bob;
 if(character==='woman')line(c,[[1,-39],[-4,-36],[-8,-31+Math.sin(t*8)*1.4]],ink,3.2);
 if(light||fx.contrast)oval(c,headX,headY,4.8,5.4,light?'#18121d':'#fff8de');oval(c,headX,headY,3.9,4.5,ink);
 if(character==='elder'){oval(c,-7,-32,3,3.5,ink);line(c,[[-7,-28],[-8,-22],[-2,-18],[3,-23]],ink,2.5)}
 if(style.detail==='leaf')oval(c,0,-43,4,1.6,style.accent);
 if(style.detail==='star')oval(c,1,-45,1.5,1.5,style.accent);
 if(style.detail==='comet')line(c,[[-1,-41],[-7,-44],[-12,-43]],style.accent,1.6);
 c.restore();return true;
}
function dog(c,q,fx={},reduced=false){
 if(!q)return;const phase=reduced?0:(q.strideDistance??(fx.poseTime??fx.t??0)*100)/(70/3),air=(q.height||0)>1;
 const ink=look().body,light=ink==='#fff8de';c.save();c.translate(q.x,q.y);c.rotate(q.renderAngle??Math.atan2(q.tangent?.y||0,q.tangent?.x??1));c.scale((q.bodyHeight||23)/23,(q.bodyHeight||23)/23);
 const limbs=[];for(let i=0;i<4;i++){const front=i>=2,x=front?7:-9,u=((phase+(i%2)*.5+(front?.12:0))%1+1)%1,foot=air?[x+(i%2?4:-4),-4]:u<.6?[x+7-14*u/.6,0]:[x-7+14*(u-.6)/.4,-6*Math.sin(Math.PI*(u-.6)/.4)];limbs.push([[x,-10],[x+(front?-2:2),-5],foot])}
 for(const width of light?[4.8,2.8]:[2.8]){const color=light&&width===4.8?'#18121d':ink;for(const limb of limbs)line(c,limb,color,width);line(c,[[-11,-12],[-17,-16],[-19,-21+Math.sin(phase*TAU)*1.2]],color,width)}
 if(light)line(c,[[-11,-13],[7,-13],[11,-18],[17,-17]],'#18121d',10);line(c,[[-11,-13],[7,-13],[11,-18],[17,-17]],ink,7);line(c,[[10,-18],[8,-23],[14,-20]],ink,3);line(c,[[16,-17],[20,-15]],ink,3);c.restore();
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
 const width=Math.max(1,viewport.width),height=Math.max(1,viewport.height),q=geo.player,b=geo.bounds;
 const baseScale=Math.min(width/384,height/480),zoom=cameraZoom(geo,opt,run),scale=baseScale;
 const angle=q.renderAngle??Math.atan2(q.tangent?.y||0,q.tangent?.x??1),tx=Math.cos(angle),ty=Math.sin(angle),nx=ty,ny=-tx;
 const lead=Math.min(72,(Math.abs(tx)*width+Math.abs(ty)*height)*.18);
 // Interpolate safe screen anchors per axis. Projecting the rectangle's full
 // diagonal onto the normal would push the actor off-screen halfway round a turn.
 const margin=Math.min(48,width/2,height/2);let sx=clamp(width/2-nx*Math.max(0,width/2-72)-tx*lead,margin,width-margin),sy=clamp(height/2-ny*Math.max(0,height/2-72)-ty*lead,margin,height-margin);
 // Keep the delayed dog's ears and tail inside the frame when both actors fit.
 // Use its interpolated world pose directly; no second position filter or zoom-out.
 const d=geo.companion;if(d){
  const a=d.renderAngle??Math.atan2(d.tangent.y,d.tangent.x),cs=Math.cos(a),sn=Math.sin(a),size=(d.bodyHeight||23)/23;
  const corners=[[-22,-26],[22,-26],[-22,3],[22,3]].map(([x,y])=>({x:(d.x-q.x+(x*cs-y*sn)*size)*scale+sx,y:(d.y-q.y+(x*sn+y*cs)*size)*scale+sy}));
  const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),loX=Math.max(12-Math.min(...xs),margin-sx),hiX=Math.min(width-12-Math.max(...xs),width-margin-sx),loY=Math.max(12-Math.min(...ys),margin-sy),hiY=Math.min(height-12-Math.max(...ys),height-margin-sy);
  if(loX<=hiX)sx+=clamp(0,loX,hiX);if(loY<=hiY)sy+=clamp(0,loY,hiY);
 }
 const offsetX=sx-q.x*scale,offsetY=sy-q.y*scale;
 return {width,height,scale,baseScale,zoom,offsetX,offsetY,left:-offsetX/scale,right:(width-offsetX)/scale,top:-offsetY/scale,bottom:(height-offsetY)/scale,follow:true,framing:'viewport-cover'};
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
function icon(item){return '<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="35" fill="#e4d9a2"/><path d="M39 47L47 55L39 66M39 47L30 55L32 66M41 33L30 40L34 46M41 33L51 40L55 34" fill="none" stroke="'+item.body+'" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M41 33L39 47" stroke="'+item.body+'" stroke-width="5" stroke-linecap="round"/><circle cx="42" cy="24" r="5" fill="'+item.body+'"/></svg>'}
function narrative(c,x,y,h,pose,t,reduced){return sprite(c,{x,y,bodyHeight:h,pose,tangent:{x:1,y:0}},{poseTime:t},reduced)}
function mount(host){const d=host.document,$=id=>d.getElementById(id);progress=host.progress;try{selected=decode(host.storage.getItem(KEY))}catch(_){saved=false}
 function render(){const n=count(progress()),equipped=look();$('wardrobeCount').textContent=n+' / 100개의 기억';$('wardrobeStatus').textContent=saved?'기억을 모으면 새로운 옷이 열려요.':'이번 실행에만 옷을 보관할 수 있어요.';
  for(const item of looks){const b=$('look-'+item.id),owned=available(item.id,n);b.disabled=!owned;b.setAttribute('aria-pressed',String(equipped.id===item.id));b.setAttribute('aria-label',item.name+(owned?equipped.id===item.id?' · 입는 중':' · 입기':' · 기억 '+item.at+'개 필요'));b.querySelector('small').textContent=owned?equipped.id===item.id?'입는 중':'입기':'기억 '+item.at+'개'}
 }
 for(const item of looks){const b=d.createElement('button');b.id='look-'+item.id;b.setAttribute('id',b.id);b.innerHTML=icon(item)+'<span>'+item.name+'</span><small></small>';b.onclick=()=>{if(!available(item.id,progress()))return;selected=item.id;try{const value=JSON.stringify({schema:1,selected});host.storage.setItem(KEY,value);saved=host.storage.getItem(KEY)===value}catch(_){saved=false}render();host.redraw()};$('wardrobeLooks').appendChild(b)}
 $('wardrobeClose').onclick=host.close;
 $('shopOpen').textContent='옷장';$('shopOpen').onclick=e=>{host.open(e);render();$('wardrobeClose').focus({preventScroll:true})};
 render();return {render,view:()=>({selected:look().id,saved,collected:count(progress())})};
}
const api={joint,gait,worldPalette,nativeSupport,looks,available,decode,count,look,clock,sprite,dog,narrative,title,exterior,chamber,camera,cameraZoom,requestImmersive,hud,hint,mount,storageKey:KEY};root.MongyuMobile=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
