/* R105 authored vector lobby scene. Owned by workstream E2.
   A dawn over a garden of floating Korean architecture; the "dream road" climbs as stepping islands from the
   dreamer's first island up to an aurora gate in front of a moon that is also a moon jar.
   Static art is drawn once per viewport into offscreen sprites; each frame only composites them (<=3 ms):
   sky, 3 parallax fog bands, far islands, road islands, aurora gate, fireflies, stars, hand-built "몽유" lettering.
   draw(ctx,{viewport:{width,height,dpr},time,reduced}) is what MongyuMobile.title delegates to. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const PAL=Object.freeze({
 sky:['#1b1530','#2b2150','#54407e','#a9648f','#e8907f','#f6b98e'],
 rockTop:'#5d4a86',rockMid:'#3d3066',rockLow:'#261d48',rim:'#ffd2a0',rimTeal:'#9ff6e8',
 moss:'#5fa59b',mossDeep:'#3a7684',moss2:'#8fd0b4',soil:'#7a5f95',
 gold:'#ffd98a',goldHi:'#ffeca5',aurora:'#7ff3e1',pink:'#ff9ed8',ice:'#dff2ff',far:'#46366f',farLow:'#2c2352'
});

/* ---------- layout (design units are CSS px; s is the uniform scale against a 390-wide phone) ---------- */
function layout(w,h){
 const wide=w>h*1.15;
 if(!wide){
  const s=clamp(Math.min(w/390,h/760),.72,1.55);
  return {wide,w,h,s,
   title:{x:w*.5,y:h*.135,h:84*s},
   moon:{x:w*.805,y:h*.275,r:47*s},
   islands:[
    {x:w*.31,y:h*.672,rx:112*s,depth:66*s,kind:'home'},
    {x:w*.725,y:h*.588,rx:58*s,depth:44*s,kind:'lantern'},
    {x:w*.355,y:h*.508,rx:50*s,depth:40*s,kind:'bush'},
    {x:w*.675,y:h*.438,rx:43*s,depth:36*s,kind:'shard'},
    {x:w*.47,y:h*.372,rx:42*s,depth:34*s,kind:'gate'}],
   far:[{x:w*.115,y:h*.398,k:'pavilion',z:1*s},{x:w*.9,y:h*.49,k:'pagoda',z:.92*s},{x:w*.235,y:h*.262,k:'pine',z:.62*s}],
   fog:[.545,.735,.885],hero:{h:100*s}};
 }
 const s=clamp(h/390,.62,1.45)*.92;
 return {wide,w,h,s,
  title:{x:w*.235,y:h*.185,h:62*s},
  moon:{x:w*.5,y:h*.235,r:36*s},
  islands:[
   {x:w*.14,y:h*.745,rx:96*s,depth:56*s,kind:'home'},
   {x:w*.285,y:h*.645,rx:50*s,depth:38*s,kind:'lantern'},
   {x:w*.18,y:h*.545,rx:42*s,depth:34*s,kind:'bush'},
   {x:w*.32,y:h*.46,rx:36*s,depth:30*s,kind:'shard'},
   {x:w*.435,y:h*.395,rx:36*s,depth:30*s,kind:'gate'}],
  far:[{x:w*.07,y:h*.33,k:'pavilion',z:.7*s},{x:w*.5,y:h*.62,k:'pagoda',z:.7*s},{x:w*.37,y:h*.19,k:'pine',z:.5*s}],
  fog:[.56,.76,.9],hero:{h:88*s}};
}

/* ---------- canvas plumbing ---------- */
let factory=null;
function setFactory(fn){factory=typeof fn==='function'?fn:null;cache=null}
function makeCanvas(w,h){
 if(factory)return factory(w,h);
 const doc=root.document;if(!doc?.createElement)return null;
 const c=doc.createElement('canvas');c.width=w;c.height=h;return c;
}
function sprite(wCss,hCss,ax,ay,dpr,paint){
 const cw=Math.max(1,Math.ceil(wCss*dpr)),ch=Math.max(1,Math.ceil(hCss*dpr)),canvas=makeCanvas(cw,ch);
 if(!canvas)return null;
 const g=canvas.getContext('2d');if(!g)return null;
 g.setTransform(dpr,0,0,dpr,0,0);g.translate(ax,ay);paint(g);
 return {canvas,ax,ay,w:wCss,h:hCss};
}
function blit(c,sp,x,y,alpha){
 if(!sp)return;
 if(alpha!==undefined&&alpha!==1){const old=c.globalAlpha;c.globalAlpha=old*alpha;c.drawImage(sp.canvas,x-sp.ax,y-sp.ay,sp.w,sp.h);c.globalAlpha=old}
 else c.drawImage(sp.canvas,x-sp.ax,y-sp.ay,sp.w,sp.h);
}

/* ---------- little drawing helpers ---------- */
function smooth(c,pts,close){
 const n=pts.length;if(n<2)return;
 c.moveTo(pts[0][0],pts[0][1]);
 for(let i=1;i<n-1;i++){const mx=(pts[i][0]+pts[i+1][0])/2,my=(pts[i][1]+pts[i+1][1])/2;c.quadraticCurveTo(pts[i][0],pts[i][1],mx,my)}
 c.lineTo(pts[n-1][0],pts[n-1][1]);if(close)c.closePath();
}
function linear(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [o,col] of stops)g.addColorStop(o,col);return g}
function radial(c,x,y,r0,r1,stops){const g=c.createRadialGradient(x,y,r0,x,y,r1);for(const [o,col] of stops)g.addColorStop(o,col);return g}
function glowSprite(dpr,color,size){
 const r=size/2;
 return sprite(size,size,r,r,dpr,g=>{g.fillStyle=radial(g,0,0,0,r,[[0,color],[.35,color.replace(/[\d.]+\)$/,'.35)')],[1,color.replace(/[\d.]+\)$/,'0)')]]);g.fillRect(-r,-r,size,size)});
}

/* ---------- rock + island bodies ---------- */
/* Hanging rock under a surface ellipse (center 0,0; half width rx). Returns the lit/shadow polygons. */
function rockProfile(rx,depth,seed){
 const r=rng(seed),n=9,left=[],right=[];
 for(let i=0;i<=n;i++){
  const u=i/n,x=lerp(-rx,0,u),edge=Math.pow(Math.abs(x)/rx,1.55),jag=(r()-.5)*depth*.13*(i>0&&i<n?1:0);
  left.push([x,depth*(1-edge)*(.92+r()*.1)+jag]);
 }
 for(let i=1;i<=n;i++){const u=i/n,x=lerp(0,rx,u),edge=Math.pow(Math.abs(x)/rx,1.55),jag=(r()-.5)*depth*.13*(i<n?1:0);right.push([x,depth*(1-edge)*(.9+r()*.12)+jag])}
 return {left,right};
}
function drawRock(g,rx,depth,seed,opt){
 const o=opt||{},ry=rx*.2,prof=rockProfile(rx,depth,seed),pts=[...prof.left,...prof.right];
 // body
 g.beginPath();g.moveTo(-rx,0);
 for(const p of pts)g.lineTo(p[0],p[1]);
 g.lineTo(rx,0);g.ellipse(0,0,rx,ry,0,0,Math.PI,true);g.closePath();
 g.fillStyle=linear(g,0,0,0,depth,[[0,o.top||PAL.rockTop],[.45,o.mid||PAL.rockMid],[1,o.low||PAL.rockLow]]);g.fill();
 // facets: shadowed left planes, lit right planes
 g.save();g.clip();
 const r=rng(seed+7);
 for(let i=0;i<5;i++){
  const x0=lerp(-rx*.9,rx*.9,r()),y0=ry*.6+r()*depth*.15;
  g.beginPath();g.moveTo(x0,y0);g.lineTo(x0+(r()-.35)*rx*.5,y0+depth*(.35+r()*.4));g.lineTo(x0+rx*(.12+r()*.2),y0+depth*(.1+r()*.2));g.closePath();
  g.fillStyle=r()<.5?'rgba(20,12,48,.28)':'rgba(255,190,170,.08)';g.fill();
 }
 g.fillStyle=linear(g,-rx,0,rx,0,[[0,'rgba(18,10,44,.42)'],[.55,'rgba(18,10,44,0)'],[1,'rgba(255,206,160,.16)']]);g.fillRect(-rx,0,rx*2,depth);
 g.restore();
 // rim light down the sun-facing (right) edge
 g.beginPath();g.moveTo(rx,0);for(let i=prof.right.length-1;i>=0;i--)g.lineTo(prof.right[i][0],prof.right[i][1]);
 g.lineWidth=1.6;g.lineCap='round';g.lineJoin='round';g.strokeStyle=o.rim||'rgba(255,210,160,.7)';g.stroke();
 // hanging pebbles
 const rp=rng(seed+31);
 for(let i=0;i<3;i++){
  const x=lerp(-rx*.35,rx*.4,rp()),y=depth*(.78+rp()*.3)+4,rr=2+rp()*3.4;
  g.beginPath();g.ellipse(x,y+rr*(i%2),rr,rr*.8,0,0,TAU);g.fillStyle=i%2?'#352a5c':'#43376d';g.fill();
 }
}
function drawTop(g,rx,o){
 const ry=rx*.2,opt=o||{};
 // soil lip
 g.beginPath();g.ellipse(0,0,rx,ry,0,0,TAU);g.fillStyle=linear(g,0,-ry,0,ry+8,[[0,'#8b6fa5'],[1,'#4d3a78']]);g.fill();
 // moss surface, slightly inset and raised
 g.beginPath();g.ellipse(0,-3,rx*.97,ry*.9,0,0,TAU);g.fillStyle=radial(g,-rx*.25,-ry*.6,2,rx,[[0,opt.moss2||PAL.moss2],[.5,opt.moss||PAL.moss],[1,opt.mossDeep||PAL.mossDeep]]);g.fill();
 g.beginPath();g.ellipse(0,-3,rx*.97,ry*.9,0,Math.PI*1.1,Math.PI*1.85);g.lineWidth=1.4;g.lineCap='round';g.strokeStyle='rgba(255,236,190,.55)';g.stroke();
 // tufts on the rim
 const r=rng(Math.round(rx*13));
 g.strokeStyle='rgba(120,210,176,.8)';g.lineWidth=1.3;g.lineCap='round';
 for(let i=0;i<Math.round(rx/6);i++){
  const a=lerp(.1,Math.PI-.1,r()),x=Math.cos(a)*rx*.93,y=Math.sin(a)*ry*.86-3;
  g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*3,y-2.5-r()*3);g.stroke();
 }
}
function drawStone(g,x,y,rx,seed){
 g.save();g.translate(x,y);
 drawRock(g,rx,rx*.8,seed,{top:'#6a5792',mid:'#43376d',low:'#2d2350'});
 drawTop(g,rx,{});
 g.restore();
}

/* ---------- props ---------- */
function pine(g,x,y,k,col){
 g.save();g.translate(x,y);g.scale(k,k);
 g.strokeStyle=col;g.lineCap='round';g.lineWidth=3.2;
 g.beginPath();g.moveTo(0,0);g.bezierCurveTo(-3,-14,6,-24,1,-40);g.stroke();
 g.beginPath();g.moveTo(1,-24);g.quadraticCurveTo(-9,-27,-14,-24);g.lineWidth=2;g.stroke();
 g.fillStyle=col;
 for(const [cx,cy,rx,ry] of [[0,-44,17,6.5],[-11,-33,13,5],[10,-28,12,4.6],[-4,-52,9,4]]){g.beginPath();g.ellipse(cx,cy,rx,ry,0,0,TAU);g.fill()}
 g.restore();
}
function lantern(g,x,y,k,body,flame){
 g.save();g.translate(x,y);g.scale(k,k);
 g.fillStyle=body;
 g.fillRect(-7,-5,14,5);g.fillRect(-3.2,-17,6.4,12);g.fillRect(-6,-24,12,7);
 g.beginPath();g.moveTo(-11,-24);g.quadraticCurveTo(-5,-25,0,-31);g.quadraticCurveTo(5,-25,11,-24);g.quadraticCurveTo(0,-22.4,-11,-24);g.closePath();g.fill();
 g.beginPath();g.arc(0,-33,1.9,0,TAU);g.fill();
 if(flame){g.fillStyle=flame;g.fillRect(-3.2,-22,6.4,3.6)}
 g.restore();
}
function roof(g,cx,y,W,H,col){
 g.save();g.translate(cx,y);g.fillStyle=col;
 g.beginPath();
 g.moveTo(-W,-5);
 g.bezierCurveTo(-W*.78,3,-W*.62,-H*.5,-W*.36,-H);
 g.lineTo(W*.36,-H);
 g.bezierCurveTo(W*.62,-H*.5,W*.78,3,W,-5);
 g.quadraticCurveTo(W*.8,3.4,W*.5,2.4);
 g.lineTo(-W*.5,2.4);g.quadraticCurveTo(-W*.8,3.4,-W,-5);
 g.closePath();g.fill();
 g.fillRect(-W*.4,-H-2.6,W*.8,3);
 g.restore();
}
function pavilion(g,col,rimCol){
 // platform, pillars, hip roof with upswept eaves
 g.fillStyle=col;g.fillRect(-36,-5,72,5);g.fillRect(-32,-8,64,3);
 for(const x of [-28,-14,0,14,28])g.fillRect(x-1.6,-30,3.2,22);
 g.fillRect(-30,-22,60,2.6);
 roof(g,0,-30,46,20,col);
 g.strokeStyle=rimCol;g.lineWidth=1.3;g.lineCap='round';
 g.beginPath();g.moveTo(10,-51.5);g.lineTo(16.5,-51.5);g.moveTo(46,-35);g.bezierCurveTo(40,-28,36,-44,16,-50);g.stroke();
}
function pagoda(g,col,rimCol){
 g.fillStyle=col;
 g.fillRect(-26,-6,52,6);g.fillRect(-21,-12,42,6);
 let y=-12;
 for(let i=0;i<3;i++){
  const w=15-i*3.3,bh=15-i*2.3,ew=w+9-i;
  g.fillRect(-w,y-bh,w*2,bh);y-=bh;
  g.beginPath();g.moveTo(-ew-4,y+1);g.quadraticCurveTo(-ew+2,y-1,-ew+4,y-6);g.lineTo(ew-4,y-6);g.quadraticCurveTo(ew-2,y-1,ew+4,y+1);g.quadraticCurveTo(0,y+5,-ew-4,y+1);g.closePath();g.fill();
  y-=6;
 }
 g.fillRect(-1.2,y-17,2.4,17);
 for(let i=0;i<3;i++){g.beginPath();g.ellipse(0,y-5-i*4.3,3.7-i*.8,1.6,0,0,TAU);g.fill()}
 g.beginPath();g.arc(0,y-19,2.1,0,TAU);g.fill();
 g.strokeStyle=rimCol;g.lineWidth=1.2;g.lineCap='round';
 g.beginPath();g.moveTo(26,-6);g.lineTo(26,0);g.moveTo(15,-12);g.lineTo(15,-27);g.moveTo(8,-33);g.quadraticCurveTo(13,-34,16,-38);g.stroke();
}
function stele(g,col,rimCol){
 g.fillStyle=col;g.beginPath();g.moveTo(-8,0);g.lineTo(-9,-9);g.lineTo(9,-9);g.lineTo(8,0);g.closePath();g.fill();
 g.beginPath();g.moveTo(-6,-9);g.lineTo(-6,-36);g.quadraticCurveTo(0,-46,6,-36);g.lineTo(6,-9);g.closePath();g.fill();
 g.strokeStyle=rimCol;g.lineWidth=1.2;g.beginPath();g.moveTo(6,-12);g.lineTo(6,-35);g.stroke();
}
function farIsland(dpr,spec,sc){
 const rx=spec.k==='pagoda'?62:spec.k==='pine'?50:spec.k==='stele'?34:70,depth=spec.k==='pine'?34:spec.k==='stele'?22:46,up=spec.k==='pagoda'?96:spec.k==='pine'?70:spec.k==='stele'?56:64;
 return sprite((rx+8)*2*sc,(up+depth+12)*sc,(rx+8)*sc,up*sc,dpr,g=>{
  g.scale(sc,sc);
  drawRock(g,rx,depth,Math.round(spec.x*7+spec.y),{top:'#4e3d78',mid:'#392c61',low:'#241b44',rim:'rgba(255,196,160,.55)'});
  g.beginPath();g.ellipse(0,0,rx,rx*.2,0,0,TAU);g.fillStyle='#4a3a78';g.fill();
  g.beginPath();g.ellipse(0,-1.5,rx*.95,rx*.17,0,0,TAU);g.fillStyle='#5b5388';g.fill();
  const col='#2f2556',rimCol='rgba(255,205,165,.75)';
  if(spec.k==='pavilion')pavilion(g,col,rimCol);
  else if(spec.k==='pagoda')pagoda(g,col,rimCol);
  else if(spec.k==='pine'){pine(g,-10,-1,1.1,col);pine(g,14,-1,.7,col)}
  else stele(g,col,rimCol);
 });
}
function roadIsland(dpr,spec,sc){
 const rx=spec.rx/sc,depth=spec.depth/sc,up=spec.kind==='home'?96:spec.kind==='gate'?96:spec.kind==='lantern'?50:spec.kind==='bush'?36:64;
 const pad=14;
 return sprite((rx+pad)*2*sc,(up+depth+pad)*sc,(rx+pad)*sc,up*sc,dpr,g=>{
  g.scale(sc,sc);
  const seed=Math.round(spec.x*3+spec.y*5);
  drawRock(g,rx,depth,seed,{rim:'rgba(255,214,168,.75)'});
  drawTop(g,rx,{});
  const k=spec.kind;
  if(k==='home'){
   pine(g,-rx*.6,-4,1.25,'#2d4a62');
   lantern(g,rx*.52,-4,1.15,'#cfc2dc','#ffd98a');
   // a few flowers and a stepping slab where the dreamer stands
   g.beginPath();g.ellipse(-rx*.1,-2.4,24,5.4,0,0,TAU);g.fillStyle='#d9d1e6';g.fill();g.lineWidth=1;g.strokeStyle='rgba(255,236,200,.8)';g.stroke();
   const r=rng(5);for(let i=0;i<9;i++){const x=lerp(-rx*.8,rx*.8,r()),y=-3-r()*rx*.12;g.beginPath();g.arc(x,y,1.5,0,TAU);g.fillStyle=i%3?'#ff9ed8':'#ffeca5';g.fill()}
  }else if(k==='lantern'){
   lantern(g,-rx*.25,-3,1,'#cfc2dc','#ffd98a');
   const r=rng(9);for(let i=0;i<4;i++){g.beginPath();g.arc(lerp(rx*.1,rx*.7,r()),-3-r()*5,1.4,0,TAU);g.fillStyle='#ff9ed8';g.fill()}
  }else if(k==='bush'){
   for(const [x,y,rr,col] of [[-8,-8,11,'#3f7f86'],[6,-9,12,'#4b9291'],[-1,-15,9,'#5fa59b']]){g.beginPath();g.arc(x,y,rr,0,TAU);g.fillStyle=col;g.fill()}
   const r=rng(4);for(let i=0;i<8;i++){g.beginPath();g.arc(lerp(-14,14,r()),-8-r()*12,1.7,0,TAU);g.fillStyle='#ffc1e6';g.fill()}
  }else if(k==='shard'){
   // a standing slab with a floating light shard above it (gold = collectible)
   g.fillStyle='#d9d1e6';g.fillRect(-9,-12,18,10);g.fillStyle='#bdb2d2';g.fillRect(-6,-18,12,7);
  }else if(k==='gate'){
   // moon gate: stone arch with a round lintel, the aurora fills it live
   g.fillStyle='#cdc3de';
   g.fillRect(-28,-4,56,5);
   g.fillRect(-23,-62,9,60);g.fillRect(14,-62,9,60);
   g.beginPath();g.moveTo(-28,-62);g.lineTo(28,-62);g.quadraticCurveTo(0,-72,-28,-62);g.closePath();g.fill();
   g.beginPath();g.moveTo(-34,-66);g.quadraticCurveTo(-24,-66,-18,-74);g.lineTo(18,-74);g.quadraticCurveTo(24,-66,34,-66);g.quadraticCurveTo(0,-62,-34,-66);g.closePath();g.fill();
   g.strokeStyle='rgba(159,246,232,.85)';g.lineWidth=1.4;g.beginPath();g.moveTo(14,-60);g.lineTo(14,-4);g.moveTo(23,-62);g.lineTo(23,-4);g.stroke();
  }
 });
}

/* ---------- fog bands: tile horizontally, so one period is exactly the viewport width ---------- */
function fogBand(dpr,w,bh,col,seed,amp,layers,solid){
 return sprite(w,bh,0,0,dpr,g=>{
  const r=rng(seed);
  for(let l=0;l<layers;l++){
   const periods=[1,2,3,5][l%4],phase=r()*TAU,top=bh*(.22+l*.12),a=amp*(1-l*.2);
   g.beginPath();g.moveTo(0,bh);
   const steps=Math.max(8,Math.ceil(w/6));for(let k=0;k<=steps;k++){const x=k/steps*w,u=k/steps*TAU,y=top+Math.sin(u*periods+phase)*a+Math.sin(u*(periods+2)+phase*1.7)*a*.45;g.lineTo(x,y)}
   g.lineTo(w,bh);g.closePath();
   const clear=col.replace(/[\d.]+\)$/,'0)'),strong=col.replace(/[\d.]+\)$/,Math.min(1,parseFloat(col.match(/([\d.]+)\)$/)[1])*1.25).toFixed(2)+')');
   g.fillStyle=solid?linear(g,0,top-a,0,bh,[[0,clear],[.4,col],[1,strong]]):linear(g,0,top-a,0,bh,[[0,clear],[.38,col],[.72,col.replace(/[\d.]+\)$/,(parseFloat(col.match(/([\d.]+)\)$/)[1])*.55).toFixed(2)+')')],[1,clear]]);
   g.fill();
  }
 });
}

/* ---------- sky ---------- */
function skySprite(dpr,L,starSeed){
 const {w,h}=L;
 return sprite(w,h,0,0,dpr,g=>{
  g.fillStyle=linear(g,0,0,0,h,[[0,PAL.sky[0]],[.26,PAL.sky[1]],[.46,PAL.sky[2]],[.6,PAL.sky[3]],[.69,PAL.sky[4]],[.75,PAL.sky[5]],[.8,'#a37094'],[1,'#2b2150']]);
  g.fillRect(0,0,w,h);
  // dawn bloom just under the road
  const bx=L.wide?w*.26:w*.45,by=L.wide?h*.78:h*.7;
  g.fillStyle=radial(g,bx,by,4,Math.max(w,h)*.62,[[0,'rgba(255,214,160,.55)'],[.4,'rgba(255,160,150,.2)'],[1,'rgba(255,160,150,0)']]);g.fillRect(0,0,w,h);
  // stars thin out toward the horizon
  const r=rng(starSeed),n=Math.round(w*h/2200);
  for(let i=0;i<n;i++){
   const x=r()*w,y=Math.pow(r(),1.6)*h*.5,a=(1-y/(h*.5))*(.3+r()*.7),sz=r()<.07?1.7:r()<.3?1.1:.7;
   g.fillStyle='rgba(255,246,226,'+a.toFixed(2)+')';g.fillRect(x,y,sz,sz);
  }
  // the moon jar
  const m=L.moon;
  g.fillStyle=radial(g,m.x,m.y,m.r*.8,m.r*3.1,[[0,'rgba(246,238,255,.5)'],[.5,'rgba(200,180,250,.16)'],[1,'rgba(190,170,240,0)']]);g.fillRect(m.x-m.r*3.2,m.y-m.r*3.2,m.r*6.4,m.r*6.4);
  g.save();g.translate(m.x,m.y);
  g.beginPath();g.ellipse(0,0,m.r,m.r*.985,0,0,TAU);
  g.fillStyle=radial(g,-m.r*.35,-m.r*.4,m.r*.1,m.r*1.15,[[0,'#fffefa'],[.5,'#fbf1e6'],[1,'#e2d0d8']]);g.fill();
  g.save();g.clip();
  g.fillStyle=radial(g,m.r*.6,m.r*.5,m.r*.2,m.r*1.3,[[0,'rgba(120,90,150,0)'],[1,'rgba(130,100,160,.2)']]);g.fillRect(-m.r,-m.r,m.r*2,m.r*2);
  // glaze seam and faint crackle: what makes it a jar
  g.strokeStyle='rgba(150,120,160,.3)';g.lineWidth=1;g.beginPath();g.ellipse(0,-m.r*.1,m.r*.98,m.r*.18,0,.12,Math.PI-.12);g.stroke();
  g.strokeStyle='rgba(150,120,160,.12)';
  for(const [a,b,c2,d] of [[-.5,-.3,-.2,.1],[.35,.2,.55,.5],[-.1,.45,.2,.7]]){g.beginPath();g.moveTo(a*m.r,b*m.r);g.quadraticCurveTo((a+c2)*m.r*.6,(b+d)*m.r*.4,c2*m.r,d*m.r);g.stroke()}
  g.restore();
  g.beginPath();g.ellipse(0,-m.r*.98,m.r*.3,m.r*.07,0,0,TAU);g.fillStyle='#f3e6e0';g.fill();g.strokeStyle='rgba(170,140,170,.55)';g.lineWidth=1;g.stroke();g.beginPath();g.ellipse(0,-m.r*.985,m.r*.2,m.r*.032,0,0,TAU);g.fillStyle='#b9a2b8';g.fill();
  g.restore();
  // soft top vignette so the lettering reads
  g.fillStyle=linear(g,0,0,0,h*.3,[[0,'rgba(14,10,32,.5)'],[1,'rgba(14,10,32,0)']]);g.fillRect(0,0,w,h*.3);
 });
}

/* ---------- hand-built lettering ---------- */
/* Strokes are authored in a 200x100 box: 몽 = ㅁ + ㅗ + ㅇ at x 0..92, 유 = ㅇ + ㅠ at x 108..200. */
const LETTER_W=200,LETTER_H=100,STROKE=9.6;
function letterPaths(g){
 const rr=(x,y,w,h,r)=>{g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y)};
 g.beginPath();
 // 몽
 rr(17,4,58,25,8);
 g.moveTo(46,37);g.lineTo(46,49);g.moveTo(13,50);g.quadraticCurveTo(46,47,79,50.5);
 g.moveTo(60,76);g.ellipse(46,76,14,14.4,0,0,TAU);
 // 유
 g.moveTo(108+61,20);g.ellipse(108+46,20,15,15.2,0,0,TAU);
 g.moveTo(108+8,53);g.quadraticCurveTo(108+46,50,108+84,53.5);
 g.moveTo(108+29,54);g.quadraticCurveTo(108+30.5,72,108+28,91);
 g.moveTo(108+63,54);g.quadraticCurveTo(108+61.5,72,108+64,91);
}
function titleSprite(dpr,hCss){
 const k=hCss/LETTER_H,pad=28;
 const W=LETTER_W*k+pad*2,H=LETTER_H*k+pad*2+16*k;
 const body=sprite(W,H,pad,pad,dpr,g=>{
  g.scale(k,k);g.lineCap='round';g.lineJoin='round';
  letterPaths(g);
  g.lineWidth=STROKE+5;g.strokeStyle='#241a45';g.stroke();
  letterPaths(g);
  g.lineWidth=STROKE;g.strokeStyle=linear(g,0,0,0,LETTER_H,[[0,'#fffaf0'],[.5,'#ffe9b8'],[1,'#ffc873']]);g.stroke();
  g.save();g.translate(-1.5,-1.6);letterPaths(g);g.lineWidth=1.3;g.strokeStyle='rgba(255,255,255,.75)';g.stroke();g.restore();
  g.save();g.translate(1.5,1.8);letterPaths(g);g.lineWidth=1.3;g.strokeStyle='rgba(190,120,50,.55)';g.stroke();g.restore();
  // brush flourish: a shooting star trailing under both syllables
  g.beginPath();g.moveTo(-8,101);g.bezierCurveTo(60,106,150,108,205,95);g.bezierCurveTo(150,103,60,102,-8,101);
  g.fillStyle=linear(g,-8,0,205,0,[[0,'rgba(255,217,138,0)'],[.5,'rgba(255,217,138,.9)'],[1,'#fffaf0']]);g.fill();
 });
 const glow=sprite(W,H,pad,pad,dpr,g=>{
  g.scale(k,k);g.lineCap='round';g.lineJoin='round';
  g.shadowColor='rgba(255,217,138,.9)';g.shadowBlur=26*k*dpr;
  letterPaths(g);g.lineWidth=STROKE+6;g.strokeStyle='rgba(255,217,138,.55)';g.stroke();
 });
 return {body,glow,k,W,H,pad,star:{x:(108+68)*k,y:5*k}};
}
function sparkle(c,x,y,r,a){
 if(a<=0)return;
 c.save();c.translate(x,y);c.globalAlpha*=a;c.fillStyle='#fffaf0';
 c.beginPath();c.moveTo(0,-r);c.quadraticCurveTo(r*.12,-r*.12,r,0);c.quadraticCurveTo(r*.12,r*.12,0,r);c.quadraticCurveTo(-r*.12,r*.12,-r,0);c.quadraticCurveTo(-r*.12,-r*.12,0,-r);c.fill();
 c.restore();
}

/* ---------- cache ---------- */
let cache=null;
function build(w,h,dpr){
 const L=layout(w,h),sc=L.s;
 const C={key:w+'x'+h+'@'+dpr,L,dpr};
 C.sky=skySprite(dpr,L,1337);
 C.far=L.far.map(f=>({spec:f,sp:farIsland(dpr,f,f.z)}));
 C.isl=L.islands.map(i=>({spec:i,sp:roadIsland(dpr,i,sc)}));
 // stepping stones between islands: fixed positions along gentle arcs
 C.stones=[];
 for(let i=0;i<L.islands.length-1;i++){
  const a=L.islands[i],b=L.islands[i+1];
  for(let j=1;j<=2;j++){
   const u=j/3,x=lerp(a.x,b.x,u)+(i%2?-1:1)*8*sc*Math.sin(u*Math.PI),y=lerp(a.y,b.y,u)-12*sc*Math.sin(u*Math.PI);
   C.stones.push({x,y,r:(6.2-j*.5)*sc*(1-i*.05),phase:i*1.7+j,seed:i*10+j});
  }
 }
 C.stoneSprites=C.stones.map(s=>sprite(s.r*2+12,s.r*1.2+14,s.r+6,s.r*.4+4,dpr,g=>{
  const r=s.r,ry=r*.38;
  g.beginPath();g.ellipse(0,2.6,r,ry,0,0,TAU);g.fillStyle='#4a3b78';g.fill();
  g.beginPath();g.ellipse(0,0,r,ry,0,0,TAU);g.fillStyle=linear(g,-r,-ry,r,ry,[[0,'#f2e9ff'],[1,'#b9a9d6']]);g.fill();
  g.beginPath();g.ellipse(0,0,r,ry,0,Math.PI*1.1,Math.PI*1.9);g.strokeStyle='rgba(255,236,190,.8)';g.lineWidth=1;g.stroke();
 }));
 const fogCols=['rgba(246,176,190,.30)','rgba(190,148,226,.34)','rgba(58,44,110,.62)'];
 C.fog=L.fog.map((fy,i)=>({y:h*fy,speed:[7,11,17][i],sp:fogBand(dpr,w,Math.round((L.wide?.2:.16)*h*(1+i*.25)),fogCols[i],77+i*13,(5+i*3)*sc,3,i===2)}));
 C.glow={gold:glowSprite(dpr,'rgba(255,217,138,1)',40),teal:glowSprite(dpr,'rgba(127,243,225,1)',64),white:glowSprite(dpr,'rgba(255,246,230,1)',24),pink:glowSprite(dpr,'rgba(255,158,216,1)',30)};
 C.title=titleSprite(dpr,L.title.h);
 // fireflies and twinklers
 const r=rng(99);
 C.flies=Array.from({length:Math.round(clamp(w*h/9000,12,36))},(_,i)=>({x:r(),y:.18+r()*.62,ph:r()*TAU,sp:.25+r()*.5,amp:6+r()*16,size:.5+r()*.9,hue:r()<.7?'gold':'teal'}));
 C.twinkle=Array.from({length:22},()=>({x:r()*w,y:Math.pow(r(),1.5)*h*.46,ph:r()*TAU,sp:.6+r()*1.4,r:.9+r()*1.2}));
 return C;
}
function ensure(w,h,dpr){
 const key=w+'x'+h+'@'+dpr;
 if(!cache||cache.key!==key)cache=build(w,h,dpr);
 return cache;
}

/* ---------- frame ---------- */
const stats={frames:0,last:0,avg:0,max:0,built:0};
function now(){return root.performance?.now?.()??Date.now()}
function draw(c,opts){
 const t0=now(),vp=opts.viewport,w=vp.width,h=vp.height,dpr=vp.dpr||1,reduced=!!opts.reduced;
 const t=reduced?0:(opts.time||0);
 const buildStart=!cache||cache.key!==w+'x'+h+'@'+dpr;
 const C=ensure(w,h,dpr),L=C.L,sc=L.s;
 if(!C.sky){c.fillStyle=PAL.sky[1];c.fillRect(0,0,w,h);return {kind:'r105-lobby',width:w,height:h,skipped:true}}
 c.save();
 c.globalAlpha=1;c.globalCompositeOperation='source-over';
 blit(c,C.sky,0,0);
 // twinkling stars
 for(const s of C.twinkle){const a=reduced?.6:.35+.65*Math.max(0,Math.sin(t*s.sp+s.ph));c.globalAlpha=a*.9;c.drawImage(C.glow.white.canvas,s.x-s.r*3,s.y-s.r*3,s.r*6,s.r*6)}
 c.globalAlpha=1;
 // a shooting star every ~11 s
 if(!reduced){
  const cycle=11,ph=(t%cycle)/cycle;
  if(ph<.075){
   const u=ph/.075,x0=w*.12,y0=h*.07,x=x0+u*w*.34,y=y0+u*h*.09;
   const g=c.createLinearGradient(x-70*sc,y-12*sc,x,y);g.addColorStop(0,'rgba(255,236,190,0)');g.addColorStop(1,'rgba(255,250,235,'+(1-Math.abs(u-.5)*1.6).toFixed(2)+')');
   c.strokeStyle=g;c.lineWidth=1.6;c.lineCap='round';c.beginPath();c.moveTo(x-70*sc,y-12*sc);c.lineTo(x,y);c.stroke();
  }
 }
 // far islands: slow vertical float, each on its own phase
 C.far.forEach((f,i)=>{const bob=reduced?0:Math.sin(t*.35+i*1.9)*3.2*sc,sway=reduced?0:Math.sin(t*.17+i)*2.2*sc;blit(c,f.sp,f.spec.x+sway,f.spec.y+bob)});
 // far fog
 const fog=(i,alpha)=>{const f=C.fog[i];if(!f.sp)return;const off=reduced?0:(t*f.speed)%w,y=f.y-f.sp.h*.5;c.globalAlpha=alpha;c.drawImage(f.sp.canvas,-off,y,w,f.sp.h);c.drawImage(f.sp.canvas,w-off,y,w,f.sp.h);c.globalAlpha=1};
 fog(0,1);
 // stepping stones, behind the islands
 C.stones.forEach((s,i)=>{const bob=reduced?0:Math.sin(t*.9+s.phase)*2.2*sc;blit(c,C.stoneSprites[i],s.x,s.y+bob)});
 // aurora gate glow lives behind the arch
 const gi=C.isl.length-1,gate=C.isl[gi],gbob=reduced?0:Math.sin(t*.55+gi*1.3)*2.6*sc;
 // islands, far to near
 for(let i=C.isl.length-1;i>=0;i--){
  const it=C.isl[i],bob=reduced?0:Math.sin(t*.55+i*1.3)*(i===0?1.6:2.6)*sc;
  if(i===gi){
   // aurora inside the moon gate (clipped to the opening), then the stone frame over it
   const gx=it.spec.x,gy=it.spec.y+bob,k=sc;
   c.save();c.beginPath();c.rect(gx-14*k,gy-61*k,28*k,57*k);c.clip();
   const ag=c.createLinearGradient(0,gy-61*k,0,gy);ag.addColorStop(0,'rgba(127,243,225,.95)');ag.addColorStop(.55,'rgba(150,200,255,.8)');ag.addColorStop(1,'rgba(255,158,216,.85)');
   c.fillStyle=ag;c.fillRect(gx-14*k,gy-61*k,28*k,57*k);
   c.globalCompositeOperation='lighter';
   for(let b=0;b<3;b++){
    const cx=gx+(Math.sin(t*.45+b*2.1)*8+(b-1)*8)*k,cg=c.createLinearGradient(cx-9*k,0,cx+9*k,0);
    cg.addColorStop(0,'rgba(255,255,255,0)');cg.addColorStop(.5,'rgba(235,255,250,'+(.3+b*.04)+')');cg.addColorStop(1,'rgba(255,255,255,0)');
    c.fillStyle=cg;c.fillRect(cx-9*k,gy-61*k,18*k,57*k);
   }
   c.restore();
  }
  blit(c,it.sp,it.spec.x,it.spec.y+bob);
  if(it.spec.kind==='shard'){
   // floating light shard (gold = collectible)
   const sy=it.spec.y+bob-42*sc+(reduced?0:Math.sin(t*1.7)*3.2*sc);
   c.globalAlpha=.9;c.drawImage(C.glow.gold.canvas,it.spec.x-20*sc,sy-20*sc,40*sc,40*sc);c.globalAlpha=1;
   c.save();c.translate(it.spec.x,sy);if(!reduced)c.rotate(Math.sin(t*1.2)*.12);c.beginPath();c.moveTo(0,-9*sc);c.lineTo(6*sc,0);c.lineTo(0,9*sc);c.lineTo(-6*sc,0);c.closePath();
   c.fillStyle='#ffe9a8';c.fill();c.lineWidth=1.2;c.strokeStyle='#fffaf0';c.stroke();c.restore();
  }
  if(i===0){
   // the dreamer, standing on the first island
   const px=it.spec.x-it.spec.rx*.12,py=it.spec.y+bob-2.4;
   const M=root.MongyuMobile;
   if(M?.sprite){try{M.sprite(c,{x:px,y:py,bodyHeight:L.hero.h,pose:'stand'},{poseTime:t,onDark:true},reduced)}catch(_){}}
  }
 }
 // lantern flames glow (flicker)
 for(const it of C.isl){
  const k=it.spec.kind;if(k!=='home'&&k!=='lantern')continue;
  const bob=reduced?0:Math.sin(t*.55+C.isl.indexOf(it)*1.3)*(it===C.isl[0]?1.6:2.6)*sc;
  const lx=k==='home'?it.spec.x+it.spec.rx*.52:it.spec.x-it.spec.rx*.25,ly=it.spec.y+bob-24*sc*(k==='home'?1.15:1);
  const fl=reduced?1:.8+.2*Math.sin(t*7+lx)+.06*Math.sin(t*13);
  c.globalCompositeOperation='lighter';c.globalAlpha=.75*fl;const sz=64*sc;c.drawImage(C.glow.gold.canvas,lx-sz/2,ly-sz/2,sz,sz);c.globalCompositeOperation='source-over';c.globalAlpha=1;
 }
 // gate glow
 {const gx=gate.spec.x,gy=gate.spec.y+gbob-34*sc,pulse=reduced?1:.8+.2*Math.sin(t*1.3);c.globalCompositeOperation='lighter';c.globalAlpha=.7*pulse;const sz=150*sc;c.drawImage(C.glow.teal.canvas,gx-sz/2,gy-sz/2,sz,sz);c.globalCompositeOperation='source-over';c.globalAlpha=1}
 // mid fog drifts across the foot of the islands
 fog(1,1);
 // fireflies
 c.globalCompositeOperation='lighter';
 for(const f of C.flies){
  const x=f.x*w+(reduced?0:Math.sin(t*f.sp+f.ph)*f.amp),y=f.y*h+(reduced?0:Math.cos(t*f.sp*.8+f.ph)*f.amp*.7-((t*3*f.sp)%12));
  const tw=reduced?.7:.45+.55*Math.max(0,Math.sin(t*(.9+f.sp)+f.ph*2)),g=f.hue==='gold'?C.glow.gold:C.glow.teal,sz=(5+f.size*7)*sc;
  c.globalAlpha=tw*.8;c.drawImage(g.canvas,x-sz/2,y-sz/2,sz,sz);c.globalAlpha=tw;c.drawImage(C.glow.white.canvas,x-1.6*sc,y-1.6*sc,3.2*sc,3.2*sc);
 }
 c.globalCompositeOperation='source-over';c.globalAlpha=1;
 fog(2,1);
 // lettering with a breathing glow
 const T=C.title,tx=L.title.x-(LETTER_W*T.k)/2,ty=L.title.y-(LETTER_H*T.k)/2,floatY=reduced?0:Math.sin(t*.8)*1.6;
 c.globalAlpha=reduced?.7:.55+.3*Math.sin(t*1.1);if(T.glow)c.drawImage(T.glow.canvas,tx-T.pad,ty-T.pad+floatY,T.W,T.H);
 c.globalAlpha=1;if(T.body)c.drawImage(T.body.canvas,tx-T.pad,ty-T.pad+floatY,T.W,T.H);
 sparkle(c,tx+T.star.x,ty+T.star.y+floatY,(reduced?4.6:3.6+2*Math.max(0,Math.sin(t*2.2)))*T.k*1.1,1);
 c.restore();
 const ms=now()-t0;stats.frames++;stats.last=ms;stats.max=Math.max(stats.max,ms);stats.avg+=(ms-stats.avg)*.05;if(buildStart)stats.built=ms;
 return {kind:'r105-lobby',width:w,height:h};
}

/* Reset sprites (e.g. after the character look changes). */
function invalidate(){cache=null}
const api=Object.freeze({enabled,draw,layout,invalidate,setFactory,stats,PAL,letterPaths,LETTER_W,LETTER_H,rng,
 get cached(){return cache?cache.key:null}});
root.MongyuLobbyScene=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
