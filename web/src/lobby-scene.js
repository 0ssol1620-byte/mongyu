/* R105 dark-psychedelic lobby scene (workstream LB). Back layer: the generated backdrop `lobby-trip` (blacklight violet, a glowing
   moon-jar with its own mandala, stairs and stepping stones over a dark lake). Portrait: cover-fit. Landscape: the jar is fitted to
   the height and the image edges melt into the dark base behind the right-hand menu column.
   Live layers (all slow, low alpha, additive, palette = MongyuTrip.get('violet') only, no hue cycling):
   a breathing glow of the jar (7.5 s period, +-6%), concentric ripples that leave the jar (violet / magenta family), two slowly
   counter-rotating procedural mandala rings (64 s and 96 s per turn), slow blinks over the eyes at their image positions,
   violet / cyan drifting motes, the dreamer on a stepping stone with a breathing scale, and a neon violet-to-magenta "몽유" logo with a
   thin cyan contour. Nothing moves faster than ~0.3 Hz; reduced = one static frame.
   draw(ctx,{viewport:{width,height,dpr},time,reduced}) is what MongyuMobile.title delegates to. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

/* Palette: the violet trip (rim #7b3cff, rim2 #ff2e9a, glow #b46bff, accent cyan #19e3ff) with a local fallback. */
const FALLBACK={sky:['#07031a','#140a33','#2a1259'],block:['#2b1b5e','#170d3a','#0a0620'],rim:'#7b3cff',rim2:'#ff2e9a',glow:'#b46bff',accent:'#19e3ff',ink:'#f3eaff'};
const pal=()=>{try{const t=root.MongyuTrip?.get?.('violet');if(t&&t.rim&&t.rim2&&t.glow)return t}catch(_){}return FALLBACK};
const BASE='#0b0322';
const hex3=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const rgba=(h,a)=>{const [r,g,b]=hex3(h);return 'rgba('+r+','+g+','+b+','+a+')'};

/* ---------- backdrop geometry ---------- */
/* Image space is the 720x1279 generated backdrop. Measured on the image: the jar is an ellipse, widest at y~205 (x 170..546),
   neck lip at y~28, foot at y~376; the mandala star at (359,214). Eyes are almond shapes (centre, width, height). */
const IMG=Object.freeze({w:720,h:1279,
 moon:Object.freeze({x:358,y:207,rx:188,ry:165,r:188,top:28,bottom:376,star:Object.freeze({x:359,y:214})}),
 eyes:Object.freeze([{x:99,y:124.5,w:74,h:21,ph:0},{x:626,y:124,w:70,h:20,ph:3.4},{x:564,y:649.5,w:64,h:19,ph:6.1}]),
 stone:Object.freeze({x:343,y:748})});
const CTA_H=58,DOCK_H=66,DOCK_B=14,CTA_GAP=14;
function layout(w,h){
 const wide=w>h*1.15;
 let ps,ox,oy,s,title,hero,useSlab=false;
 if(!wide){
  s=clamp(Math.min(w/390,h/760),.72,1.55);
  ps=Math.max(w/IMG.w,h/IMG.h);
  const th=clamp(Math.min(w*.185,h*.085),42,76);
  title={x:w*.5,y:th*.5+12,h:th};
  ox=(w-IMG.w*ps)*.5;
  oy=Math.max(0,th+12+6-IMG.moon.top*ps);                              // jar lip just below the logo
  const ctaTop=h-(DOCK_B+DOCK_H+CTA_GAP)-CTA_H;
  let sy=oy+IMG.stone.y*ps;const sx=ox+IMG.stone.x*ps;
  const lim=ctaTop-26;
  if(sy>lim){                                                         // tablet: slide the picture up first, then fall back to a slab
   const shift=Math.min(sy-lim,Math.max(0,IMG.h*ps+oy-h)),ny=oy-shift;
   if(ny+IMG.moon.top*ps>th+14){oy=ny;sy-=shift}
   if(sy>lim){sy=lim;useSlab=true}
  }
  hero={x:sx,y:sy,h:104*s};
 }else{
  s=clamp(h/390,.62,1.45)*.92;
  const th=clamp(h*.15,38,56),colLeft=w-24-Math.min(280,w*.34);
  title={x:Math.max(th+10,w*.1),y:h*.04+th*.5+10,h:th};
  // fit the jar to the height, keep it left of the menu column, and shrink it a little if the logo would touch it
  ps=clamp(h*.88/(IMG.moon.bottom-IMG.moon.top),.7,1.6);
  for(let it=0;it<24;it++){
   const rx=IMG.moon.rx*ps,ry=IMG.moon.ry*ps,cx=Math.min(w*.4,colLeft-4-rx),cy=h*.045+(IMG.moon.y-IMG.moon.top)*ps;
   let hit=false;
   for(let a=0;a<=8&&!hit;a++)for(let b=0;b<=4&&!hit;b++){
    const x=title.x-th+a/8*th*2,y=title.y-th/2+b/4*th;hit=((x-cx)/rx)**2+((y-cy)/ry)**2<1.04;
   }
   if(!hit||ps<=.7)break;
   ps*=.97;
  }
  ox=Math.min(w*.4,colLeft-4-IMG.moon.rx*ps)-IMG.moon.x*ps;oy=h*.045-IMG.moon.top*ps;
  hero={x:w*.13,y:h-30*s-8,h:80*s};useSlab=true;
 }
 const moon={x:IMG.moon.x*ps+ox,y:IMG.moon.y*ps+oy,rx:IMG.moon.rx*ps,ry:IMG.moon.ry*ps,r:IMG.moon.rx*ps};
 return {wide,w,h,s,ps,ox,oy,moon,title,hero,useSlab,slab:{x:hero.x,y:hero.y,rx:hero.h*.42,depth:hero.h*.22},
  cta:{top:wide?h-(12+68+18)-56:h-(DOCK_B+DOCK_H+CTA_GAP)-CTA_H}};
}
const toScreen=(L,ix,iy)=>[L.ox+ix*L.ps,L.oy+iy*L.ps];

/* ---------- canvas plumbing ---------- */
let factory=null,cache=null;
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
function linear(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [o,col] of stops)g.addColorStop(o,col);return g}
function radial(c,x,y,r0,r1,stops){const g=c.createRadialGradient(x,y,r0,x,y,r1);for(const [o,col] of stops)g.addColorStop(o,col);return g}
function glow(dpr,size,stops){const r=size/2;return sprite(size,size,r,r,dpr,g=>{g.fillStyle=radial(g,0,0,0,r,stops);g.fillRect(-r,-r,size,size)})}

/* ---------- mandala rings (procedural, baked once, rotated slowly) ---------- */
const spriteDpr=(dpr,R)=>Math.min(dpr,Math.max(1,720/(R*2.2)));
function ringOuter(dpr,R,P){
 const d=spriteDpr(dpr,R),lw=1/d*1.15;
 return sprite(R*2.2,R*2.2,R*1.1,R*1.1,d,g=>{
  g.lineCap='round';g.lineJoin='round';g.shadowColor=rgba(P.glow,.85);g.shadowBlur=Math.max(3,R*.035);
  g.lineWidth=lw;g.strokeStyle=rgba(P.rim,.95);g.beginPath();g.arc(0,0,R*.82,0,TAU);g.stroke();
  g.strokeStyle=rgba(P.rim2,.8);g.lineWidth=lw*.8;g.beginPath();g.arc(0,0,R*.995,0,TAU);g.stroke();
  // 24 lotus petals between the two circles
  g.strokeStyle=rgba(P.rim2,.9);g.lineWidth=lw*1.2;
  for(let i=0;i<24;i++){
   const a=i/24*TAU;g.save();g.rotate(a);g.beginPath();g.moveTo(0,-R*.82);g.quadraticCurveTo(R*.062,-R*.9,0,-R*.985);g.quadraticCurveTo(-R*.062,-R*.9,0,-R*.82);g.stroke();g.restore();
  }
  // 12 diamonds just inside, glow-coloured
  g.strokeStyle=rgba(P.glow,.8);g.lineWidth=lw;
  for(let i=0;i<12;i++){g.save();g.rotate(i/12*TAU+TAU/24);g.beginPath();g.moveTo(0,-R*.7);g.lineTo(R*.035,-R*.76);g.lineTo(0,-R*.82);g.lineTo(-R*.035,-R*.76);g.closePath();g.stroke();g.restore()}
  // 48 beads on the outside
  g.fillStyle=rgba(P.glow,.85);
  for(let i=0;i<48;i++){const a=i/48*TAU;g.beginPath();g.arc(Math.sin(a)*R*1.045,-Math.cos(a)*R*1.045,(i%4===0?2.1:1.1)/d*1.1,0,TAU);g.fill()}
 });
}
function ringInner(dpr,R,P){
 const d=spriteDpr(dpr,R),lw=1/d*1.1;
 return sprite(R*2.2,R*2.2,R*1.1,R*1.1,d,g=>{
  g.lineCap='round';g.shadowColor=rgba(P.rim2,.8);g.shadowBlur=Math.max(3,R*.03);
  g.strokeStyle=rgba(P.rim,.9);g.lineWidth=lw;g.setLineDash([R*.045,R*.03]);g.beginPath();g.arc(0,0,R*.9,0,TAU);g.stroke();g.setLineDash([]);
  g.strokeStyle=rgba(P.glow,.8);g.lineWidth=lw*.8;g.beginPath();g.arc(0,0,R*.74,0,TAU);g.stroke();
  g.strokeStyle=rgba(P.rim2,.85);g.lineWidth=lw;
  for(let i=0;i<36;i++){const a=i/36*TAU,l=i%3===0?.1:.045;g.beginPath();g.moveTo(Math.sin(a)*R*.9,-Math.cos(a)*R*.9);g.lineTo(Math.sin(a)*R*(.9+l),-Math.cos(a)*R*(.9+l));g.stroke()}
  for(let i=0;i<12;i++){const a=i/12*TAU+TAU/24;g.beginPath();g.arc(Math.sin(a)*R*.82,-Math.cos(a)*R*.82,R*.016,0,TAU);g.stroke()}
 });
}

/* ---------- eyes: a dark lid with a neon lash line that closes over the picture's own eye ---------- */
function lidPath(g,w,h){
 const hw=w/2,hh=h/2;
 g.beginPath();g.moveTo(-hw,0);g.quadraticCurveTo(0,-hh*2.05,hw,0);g.quadraticCurveTo(0,hh*2.05,-hw,0);g.closePath();
}
function drawLid(c,x,y,w,h,k,P){
 // k 0..1: 0 open, 1 closed. The top lid sweeps down past the centre line, the lower lid rises a little; the lids are the
 // surrounding skin colour, with a neon lash line along the closing edge that settles into a gentle downward curve.
 if(k<=.015)return;
 const hh=h*.62,top=-hh+hh*1.3*k,bot=hh-hh*1.3*k;
 c.save();c.translate(x,y);lidPath(c,w*1.0,h*1.0);c.clip();
 c.fillStyle=linear(c,0,-hh,0,hh,[[0,'rgba(34,10,80,.97)'],[1,'rgba(22,5,56,.97)']]);
 c.fillRect(-w,-h*2,w*2,top+h*2);c.fillRect(-w,bot,w*2,h*2);
 c.restore();
 c.save();c.translate(x,y);c.lineCap='round';c.lineWidth=Math.max(1,h*.075);
 c.strokeStyle=linear(c,-w/2,0,w/2,0,[[0,rgba(P.rim2,0)],[.2,rgba(P.rim2,.9*Math.min(1,k*3))],[.8,rgba(P.rim2,.9*Math.min(1,k*3))],[1,rgba(P.rim2,0)]]);
 c.beginPath();c.moveTo(-w*.5,0);c.quadraticCurveTo(0,-hh*.8*(1-k)+h*.2*k,w*.5,0);c.stroke();
 c.restore();
}

/* ---------- small sprites ---------- */
function mote(dpr,r,col){return glow(dpr,r*2,[[0,rgba(col,.95)],[.3,rgba(col,.45)],[1,rgba(col,0)]])}

/* ---------- stepping slab (landscape and tablets, where the picture's stones are off screen) ---------- */
function slabSprite(dpr,S,P){
 const rx=S.rx,ry=rx*.27,depth=S.depth,pad=rx*.9;
 return sprite((rx+pad)*2,ry*2+depth+pad*1.2,rx+pad,ry+pad*.5,dpr,g=>{
  g.fillStyle=radial(g,0,depth*.4,rx*.3,rx*1.55,[[0,rgba(P.rim,.4)],[1,rgba(P.rim,0)]]);g.fillRect(-rx-pad,-ry-pad,(rx+pad)*2,ry*2+depth+pad*1.8);
  g.beginPath();g.moveTo(-rx,0);g.lineTo(-rx*.84,depth);g.ellipse(0,depth,rx*.84,ry*.84,0,Math.PI,0,true);g.lineTo(rx,0);g.ellipse(0,0,rx,ry,0,0,Math.PI,false);g.closePath();
  g.fillStyle=linear(g,0,0,0,depth+ry,[[0,'#3a1c82'],[.5,'#1d0b4e'],[1,'#0a0322']]);g.fill();
  g.beginPath();g.ellipse(0,0,rx,ry,0,0,TAU);g.fillStyle=linear(g,-rx,0,rx,0,[[0,'#2a1066'],[.5,'#5a2cc0'],[1,'#3a1480']]);g.fill();
  g.lineWidth=1.6;g.strokeStyle=linear(g,-rx,0,rx,0,[[0,P.rim],[1,P.rim2]]);g.shadowColor=rgba(P.glow,.9);g.shadowBlur=6;g.stroke();
  g.shadowBlur=0;g.beginPath();g.ellipse(0,0,rx*.6,ry*.55,0,0,TAU);g.lineWidth=1;g.strokeStyle=rgba(P.glow,.45);g.stroke();
  g.beginPath();g.ellipse(0,depth,rx*.84,ry*.84,0,0,Math.PI,false);g.lineWidth=1.3;g.strokeStyle=rgba(P.rim2,.7);g.stroke();
 });
}

/* ---------- hand-built lettering: violet -> magenta neon, thin cyan contour, soft glow (fixed colours) ---------- */
/* Strokes are authored in a 200x100 box: 몽 = ㅁ + ㅗ + ㅇ at x 0..92, 유 = ㅇ + ㅠ at x 108..200. */
const LETTER_W=200,LETTER_H=100,STROKE=11;
function letterPaths(g){
 const rr=(x,y,w,h,r)=>{g.moveTo(x+r,y);g.lineTo(x+w-r,y);g.quadraticCurveTo(x+w,y,x+w,y+r);g.lineTo(x+w,y+h-r);g.quadraticCurveTo(x+w,y+h,x+w-r,y+h);g.lineTo(x+r,y+h);g.quadraticCurveTo(x,y+h,x,y+h-r);g.lineTo(x,y+r);g.quadraticCurveTo(x,y,x+r,y)};
 g.beginPath();
 rr(17,4,58,25,8);
 g.moveTo(46,37);g.lineTo(46,49);g.moveTo(13,50);g.quadraticCurveTo(46,47,79,50.5);
 g.moveTo(60,76);g.ellipse(46,76,14,14.4,0,0,TAU);
 g.moveTo(108+61,20);g.ellipse(108+46,20,15,15.2,0,0,TAU);
 g.moveTo(108+8,53);g.quadraticCurveTo(108+46,50,108+84,53.5);
 g.moveTo(108+29,54);g.quadraticCurveTo(108+30.5,72,108+28,91);
 g.moveTo(108+63,54);g.quadraticCurveTo(108+61.5,72,108+64,91);
}
function titleSprite(dpr,hCss,P){
 const k=hCss/LETTER_H,pad=26*Math.max(.6,k);
 const W=LETTER_W*k+pad*2,H=LETTER_H*k+pad*2;
 const body=sprite(W,H,pad,pad,dpr,g=>{
  g.scale(k,k);g.lineCap='round';g.lineJoin='round';
  // soft outer glow: a wide violet stroke with a blurred shadow, drawn first
  g.save();g.shadowColor=rgba(P.glow,.9);g.shadowBlur=18*k+4;letterPaths(g);g.lineWidth=STROKE+5;g.strokeStyle=rgba(P.rim,.55);g.stroke();g.restore();
  g.save();g.shadowColor=rgba(P.rim2,.8);g.shadowBlur=10*k+3;letterPaths(g);g.lineWidth=STROKE+5;g.strokeStyle=rgba(P.rim2,.35);g.stroke();g.restore();
  // thin cyan contour, then the dark keyline, then the gradient body
  letterPaths(g);g.lineWidth=STROKE+4.6;g.strokeStyle=P.accent;g.stroke();
  letterPaths(g);g.lineWidth=STROKE+2.2;g.strokeStyle='#12043a';g.stroke();
  letterPaths(g);g.lineWidth=STROKE;g.strokeStyle=linear(g,0,0,LETTER_W,LETTER_H*.35,[[0,'#8d55ff'],[.45,'#c43dff'],[1,'#ff3fb4']]);g.stroke();
  // inner highlight in the same family
  g.save();g.translate(-1.4,-1.6);letterPaths(g);g.lineWidth=1.3;g.strokeStyle='rgba(232,208,255,.7)';g.stroke();g.restore();
 });
 return {body,k,W,H,pad};
}

/* ---------- per-viewport cache ---------- */
const N_MOTES=26;
function build(w,h,dpr){
 const L=layout(w,h),P=pal(),C={key:w+'x'+h+'@'+dpr,L,dpr,P};
 const R=L.moon.rx*1.3;
 C.ringR=R;C.ringA=ringOuter(dpr,R,P);C.ringB=ringInner(dpr,R*.93,P);
 C.title=titleSprite(dpr,L.title.h,P);
 C.slab=L.useSlab?slabSprite(dpr,L.slab,P):null;
 C.jarGlow=glow(dpr,Math.ceil(L.moon.rx*3.6),[[0,rgba(P.glow,.7)],[.32,rgba(P.rim,.32)],[.62,rgba(P.rim2,.1)],[1,rgba(P.rim2,0)]]);
 C.floorGlow=glow(dpr,128,[[0,rgba(P.glow,.55)],[.45,rgba(P.rim,.2)],[1,rgba(P.rim,0)]]);
 C.irisGlow=glow(dpr,48,[[0,rgba(P.rim2,.9)],[.4,rgba(P.rim2,.3)],[1,rgba(P.rim2,0)]]);
 C.motes=[mote(dpr,8,P.glow),mote(dpr,8,P.accent),mote(dpr,8,P.rim2)];
 const r=rng(77);C.mote=[];
 for(let i=0;i<N_MOTES;i++){
  const kind=i%5===0?1:i%7===0?2:0;                                  // mostly violet, some cyan, few magenta
  C.mote.push({kind,x:r()*IMG.w,y:r(),sz:(.5+r()*.9),v:.012+r()*.02,sw:6+r()*18,ph:r()*TAU,fr:.12+r()*.2,a:.28+r()*.4});
 }
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
function drawHero(c,C,t,reduced,x,y){
 const M=root.MongyuMobile;if(!M?.sprite)return;
 const L=C.L,br=reduced?0:Math.sin(t*TAU/4.2);
 c.save();c.translate(x,y);c.scale(1,1+.012*br);c.translate(-x,-y);
 try{M.sprite(c,{x,y,bodyHeight:L.hero.h,pose:'stand'},{poseTime:t,onDark:true},reduced)}catch(_){}
 c.restore();
}
function edgeFades(c,L,w,h){
 const ix0=L.ox,ix1=L.ox+IMG.w*L.ps,iy0=L.oy,iy1=L.oy+IMG.h*L.ps;
 if(ix1<w+.5){const f=Math.min(120,IMG.w*L.ps*.2),x0=ix1-f;c.fillStyle=linear(c,x0,0,ix1,0,[[0,rgba(BASE,0)],[1,rgba(BASE,1)]]);c.fillRect(x0,0,f+1,h)}
 if(ix0>.5){const f=Math.min(120,IMG.w*L.ps*.2);c.fillStyle=linear(c,ix0,0,ix0+f,0,[[0,rgba(BASE,1)],[1,rgba(BASE,0)]]);c.fillRect(ix0-1,0,f+1,h)}
 if(iy0>.5){const f=IMG.moon.top*L.ps*.95+6;c.fillStyle=linear(c,0,iy0,0,iy0+f,[[0,rgba(BASE,1)],[1,rgba(BASE,0)]]);c.fillRect(0,iy0-1,w,f+1)}
 if(iy1<h-.5){c.fillStyle=BASE;c.fillRect(0,iy1-1,w,h-iy1+2)}
}
function draw(c,opts){
 const t0=now(),vp=opts.viewport,w=vp.width,h=vp.height,dpr=vp.dpr||1,reduced=!!opts.reduced;
 const t=reduced?0:(opts.time||0);
 const buildStart=!cache||cache.key!==w+'x'+h+'@'+dpr;
 const C=ensure(w,h,dpr),L=C.L,s=L.s,m=L.moon,P=C.P;
 c.save();
 c.globalAlpha=1;c.globalCompositeOperation='source-over';
 // 1. backdrop
 const A=root.MongyuArt;
 c.fillStyle=BASE;c.fillRect(0,0,w,h);
 if(A?.ready&&A.ready('lobby-trip')){const im=A.image('lobby-trip');c.drawImage(im,L.ox,L.oy,IMG.w*L.ps,IMG.h*L.ps)}
 else A?.image?.('lobby-trip');
 edgeFades(c,L,w,h);
 // lake darkening so the menu reads: transparent at 58% of the height, deeper violet-black at the bottom
 c.fillStyle=linear(c,0,h*.56,0,h,[[0,rgba(BASE,0)],[1,rgba(BASE,L.wide?.25:.5)]]);c.fillRect(0,h*.56,w,h*.44);
 // 2. everything below is additive light
 c.globalCompositeOperation='lighter';
 // 2a. the jar breathes: glow intensity +-6% around its base, 7.5 s period
 {
  const k=1+(reduced?0:.06*Math.sin(t*TAU/7.5)),g=C.jarGlow;
  if(g){c.globalAlpha=.5*k;const sc=1;c.drawImage(g.canvas,m.x-g.w*sc/2,m.y-g.h*sc/2,g.w*sc,g.h*sc)}
 }
 // 2b. ripples leaving the jar: four elliptical rings, 14 s lifetime, alpha <= .22, violet / magenta family
 {
  const cols=[P.rim,P.rim2,P.glow,P.rim2];
  for(let i=0;i<4;i++){
   const u=reduced?(i===1?.38:-1):(t/14+i/4)%1;if(u<0)continue;
   const a=.22*Math.pow(Math.sin(Math.PI*u),1.2),e=1.08+u*.9;
   c.globalAlpha=a;c.lineWidth=Math.max(1.2,2*s*(1-u*.55));c.strokeStyle=cols[i];
   c.beginPath();c.ellipse(m.x,m.y+m.ry*.04,m.rx*e,m.ry*e*1.02,0,0,TAU);c.stroke();
  }
 }
 // 2c. mandala rings around the jar: outer turns once per 64 s, inner the other way once per 96 s
 if(C.ringA){
  const a=reduced?0:t/64*TAU,sp=C.ringA,R=C.ringR;
  c.save();c.translate(m.x,m.y+m.ry*.03);c.rotate(a);c.globalAlpha=.3;c.drawImage(sp.canvas,-sp.w/2,-sp.h/2,sp.w,sp.h);c.restore();
  const sb=C.ringB;
  if(sb){c.save();c.translate(m.x,m.y+m.ry*.03);c.rotate(reduced?0:-t/96*TAU);c.globalAlpha=.22;c.drawImage(sb.canvas,-sb.w/2,-sb.h/2,sb.w,sb.h);c.restore()}
  void R;
 }
 // 2d. eyes: a slow glow in the iris, and every ~9 s a slow blink (1.4 s) over the picture's own lids
 c.globalAlpha=1;
 IMG.eyes.forEach((e,i)=>{
  const [ex,ey]=toScreen(L,e.x,e.y),k=C.irisGlow,gs=e.w*L.ps*.75;
  c.globalAlpha=reduced?.14:.14+.07*(.5+.5*Math.sin(t*TAU/6.3+e.ph));
  c.drawImage(k.canvas,ex-gs/2,ey-gs/2,gs,gs);
 });
 c.globalCompositeOperation='source-over';c.globalAlpha=1;
 if(!reduced)IMG.eyes.forEach((e,i)=>{
  const per=9.5+i*1.7,u=((t+e.ph*1.3)%per)/per,d=1.4/per;
  if(u>d)return;const q=u/d,k=.5-.5*Math.cos(q*TAU);               // 0 -> 1 -> 0
  const [ex,ey]=toScreen(L,e.x,e.y);drawLid(c,ex,ey,e.w*L.ps,e.h*L.ps,k,P);
 });
 // 2e. violet / cyan motes drifting up through the picture
 c.globalCompositeOperation='lighter';
 {
  const top=IMG.moon.bottom*.5,span=IMG.h*.9-top;
  for(let i=0;i<C.mote.length;i++){
   const o=C.mote[i],u=reduced?(i*.37)%1:(o.y+t*o.v*1.0)%1,iy=top+(1-u)*span,ix=o.x+(reduced?0:Math.sin(t*.2+o.ph)*o.sw);
   const [sx,sy]=toScreen(L,ix,iy);if(sx<-12||sx>w+12||sy<-12||sy>h+12)continue;
   const a=Math.sin(Math.PI*u)*o.a*(reduced?1:.8+.2*Math.sin(t*TAU*o.fr+o.ph));if(a<=.02)continue;
   const sp=C.motes[o.kind],z=(5+o.sz*7)*s;
   c.globalAlpha=a;c.drawImage(sp.canvas,sx-z,sy-z,z*2,z*2);
  }
 }
 c.globalAlpha=1;c.globalCompositeOperation='source-over';
 // 3. the dreamer on a stepping stone
 {
  const hx=L.hero.x,hy=L.hero.y,rx=L.slab.rx;
  const pulse=reduced?.5:.5+.5*Math.sin(t*TAU/6);
  c.globalCompositeOperation='lighter';
  const fg=C.floorGlow,gz=rx*3.4;c.globalAlpha=.55+.1*pulse;c.drawImage(fg.canvas,hx-gz/2,hy-gz*.34,gz,gz*.62);
  // small ripples on the water around the stone
  for(let i=0;i<2;i++){
   const u=reduced?(i?-1:.4):(t/9+i/2)%1;if(u<0)continue;
   c.globalAlpha=.2*Math.sin(Math.PI*u);c.strokeStyle=i?P.rim2:P.rim;c.lineWidth=Math.max(1,1.4*s);
   c.beginPath();c.ellipse(hx,hy+rx*.1,rx*(1.1+u*1.1),rx*(.28+u*.3),0,0,TAU);c.stroke();
  }
  c.globalCompositeOperation='source-over';c.globalAlpha=1;
  if(C.slab)c.drawImage(C.slab.canvas,hx-C.slab.ax,hy-C.slab.ay,C.slab.w,C.slab.h);
  drawHero(c,C,t,reduced,hx,hy);
 }
 // 4. logo: dark plate behind it, then the neon letters (fixed colours, no cycling)
 {
  const T=C.title,tx=L.title.x-(LETTER_W*T.k)/2,ty=L.title.y-(LETTER_H*T.k)/2;
  c.save();c.translate(L.title.x,L.title.y);c.scale(1,.5);
  c.fillStyle=radial(c,0,0,0,LETTER_W*T.k*.9,[[0,'rgba(11,3,34,.55)'],[.6,'rgba(11,3,34,.25)'],[1,'rgba(11,3,34,0)']]);c.fillRect(-LETTER_W*T.k,-LETTER_W*T.k,LETTER_W*T.k*2,LETTER_W*T.k*2);
  c.restore();
  if(T.body)c.drawImage(T.body.canvas,tx-T.pad,ty-T.pad,T.W,T.H);
 }
 c.restore();
 const ms=now()-t0;stats.frames++;stats.last=ms;stats.max=Math.max(stats.max,ms);stats.avg+=(ms-stats.avg)*.05;if(buildStart)stats.built=ms;
 return {kind:'r105-lobby',width:w,height:h};
}

/* Reset sprites (e.g. after the character look changes). */
function invalidate(){cache=null}
const api=Object.freeze({enabled,draw,layout,invalidate,setFactory,stats,IMG,letterPaths,LETTER_W,LETTER_H,rng,
 CTA_H,DOCK_H,DOCK_B,CTA_GAP,
 get cached(){return cache?cache.key:null}});
root.MongyuLobbyScene=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
