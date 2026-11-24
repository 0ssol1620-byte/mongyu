/* R105 psychedelic lobby scene (workstream P). Replaces the old dawn-garden vector scene.
   Back layer: the generated backdrop `lobby-psy` (cover-fit). The hollow white moon jar in that image is filled with a live
   spiral + kaleidoscope drawn here: a per-pixel field on a small offscreen canvas (precomputed polar lookup, palette lookup per
   frame), clipped to the moon circle. On top: ripples that leave the moon, drifting eyes, diamond sparkles, a slow hue breath
   (composite 'hue', no canvas filter), the vector dreamer on a small floating slab with an iridescent rim, and iridescent
   "몽유" lettering. Everything moves slowly (spiral turn >= 48 s, hue breath 26 s, nothing faster than ~0.4 Hz).
   draw(ctx,{viewport:{width,height,dpr},time,reduced}) is what MongyuMobile.title delegates to. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

/* Palette taken from the backdrop: hot magenta, violet, electric blue, cyan, acid lime, yellow, coral, on deep indigo. */
const PAL=Object.freeze({
 indigo:'#1b0e5c',indigoDeep:'#12083f',
 band:Object.freeze(['#ff2fa3','#7a35ff','#2b7bff','#1fe3e0','#a6ff4a','#ffe04a','#ff8a4a']),
 rim:Object.freeze(['#6ff0ff','#a6ff6a','#ffe66a','#ff7ad9','#a98bff']),
 ice:'#dff2ff',gold:'#ffd98a'
});

/* ---------- backdrop geometry ---------- */
/* Image space is the 720x1279 generated backdrop. The hollow jar moon was measured on the image: white disc centre (360,229), radius 105. */
const IMG=Object.freeze({w:720,h:1279,moon:Object.freeze({x:360,y:229,r:105}),
 /* anchors in image space for the drifting overlays; chosen on the image's calm indigo pockets, away from its own eyes and gems */
 eyes:Object.freeze([{x:120,y:430,s:30,ph:.4},{x:628,y:318,s:26,ph:2.1},{x:355,y:455,s:22,ph:4.2},{x:560,y:935,s:30,ph:5.3}]),
 spark:Object.freeze([[96,150],[640,120],[40,330],[680,420],[206,330],[520,318],[120,620],[640,640],[250,520],[472,470],[60,880],[660,900],[170,960],[600,1000],[330,1080],[420,1040],[690,740],[30,760]])});
/* where the backdrop sits on a w x h screen, plus the other anchors. s = uniform scale of the whole UI against a 390-wide phone. */
function layout(w,h){
 const wide=w>h*1.15;
 let ps,ox,oy,s,title,hero;
 if(!wide){
  s=clamp(Math.min(w/390,h/760),.72,1.55);
  ps=Math.max(w/IMG.w,h/IMG.h);
  ox=(w-IMG.w*ps)*.5;oy=(h-IMG.h*ps)*.12;
  const my=IMG.moon.y*ps+oy,mr=IMG.moon.r*ps;
  const th=clamp(mr*.98,40,82);
  title={x:w*.5,y:Math.max(th*.5+8,my-mr-th*.5+7),h:th};
  hero={x:w*.31,y:h*.6,h:112*s};
 }else{
  s=clamp(h/390,.62,1.45)*.92;
  ps=Math.max(w/IMG.w*1.08,h/IMG.h);
  ox=(w-IMG.w*ps)*1;oy=h*.4-IMG.moon.y*ps;oy=Math.min(0,Math.max(oy,h-IMG.h*ps));
  const th=clamp(h*.17,40,70);
  title={x:w*.175,y:h*.2,h:th};
  hero={x:w*.2,y:h*.8,h:84*s};
 }
 const moon={x:IMG.moon.x*ps+ox,y:IMG.moon.y*ps+oy,r:IMG.moon.r*ps};
 return {wide,w,h,s,ps,ox,oy,moon,title,hero,slab:{x:hero.x,y:hero.y,rx:hero.h*.5,depth:hero.h*.34}};
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
function blit(c,sp,x,y,alpha){
 if(!sp)return;
 if(alpha!==undefined&&alpha!==1){const old=c.globalAlpha;c.globalAlpha=old*alpha;c.drawImage(sp.canvas,x-sp.ax,y-sp.ay,sp.w,sp.h);c.globalAlpha=old}
 else c.drawImage(sp.canvas,x-sp.ax,y-sp.ay,sp.w,sp.h);
}
function linear(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);for(const [o,col] of stops)g.addColorStop(o,col);return g}
function radial(c,x,y,r0,r1,stops){const g=c.createRadialGradient(x,y,r0,x,y,r1);for(const [o,col] of stops)g.addColorStop(o,col);return g}

/* ---------- the moon: spiral + kaleidoscope field ---------- */
const ARMS=2,PITCH=-.95,WEDGES=8,PAL_N=512,LIGHT_N=16;
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
/* 512 colours x (16 light levels + 16 seam levels): hard-edged bands with a thin dark linocut line between them. */
function paletteTable(){
 const cols=PAL.band.map(hex),ink=hex(PAL.indigoDeep),T=new Uint32Array(PAL_N*32);
 for(let p=0;p<PAL_N;p++){
  const u=p/PAL_N*cols.length,b=Math.floor(u),f=u-b,c0=cols[b%cols.length],c1=cols[(b+1)%cols.length];
  // band edge: a short dark line on both sides of each boundary
  const edge=Math.max(0,1-Math.min(f,1-f)/.06),k=edge*edge*(3-2*edge)*.62;
  const base=f>.5?c1:c0,rgb=[0,1,2].map(i=>lerp(base[i],ink[i],k));
  for(let l=0;l<LIGHT_N;l++){
   const fac=.58+.42*l/(LIGHT_N-1);
   T[p*32+l]=pack(rgb[0]*fac,rgb[1]*fac,rgb[2]*fac);
   T[p*32+16+l]=pack(rgb[0]*.5+ink[0]*.3,rgb[1]*.5+ink[1]*.3,rgb[2]*.5+ink[2]*.3);
  }
 }
 return T;
}
const pack=(r,g,b)=>((255<<24)|((b&255)<<16)|((g&255)<<8)|(r&255))>>>0;
function buildSpiral(N){
 const W=TAU/WEDGES;
 let n=0;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const nx=(x+.5)/N*2-1,ny=(y+.5)/N*2-1;if(nx*nx+ny*ny<=1.06)n++}
 const idx=new Uint32Array(n),A=new Int32Array(n),B=new Int32Array(n),S=new Uint8Array(n);
 let k=0;
 for(let y=0;y<N;y++)for(let x=0;x<N;x++){
  const nx=(x+.5)/N*2-1,ny=(y+.5)/N*2-1,r2=nx*nx+ny*ny;if(r2>1.06)continue;
  const r=Math.sqrt(r2),ang=Math.atan2(ny,nx);
  const v=ARMS*ang/TAU+PITCH*Math.log(r+.045);                   // log spiral, palette cycles along it
  const fold=Math.abs(((ang+Math.PI)%W+W)%W-W/2)/(W/2);            // mirror-folded angle: 0 at the seams, 1 mid-wedge
  const l=fold*.55+r*2.3;                                          // kaleidoscope light: rings and petals
  idx[k]=y*N+x;A[k]=Math.round((v%1)*65536);B[k]=Math.round((l%1)*65536);S[k]=(fold<.022||fold>.99)&&r>.18?16:0;k++;
 }
 return {N,n,idx,A,B,S};
}
function spiralState(Nwant,dpr){
 const N=clamp(Math.ceil(Nwant*Math.min(dpr,2)),96,320),canvas=makeCanvas(N,N);if(!canvas)return null;
 const g=canvas.getContext('2d');if(!g||typeof g.createImageData!=='function')return null;
 let img=null;try{img=g.createImageData(N,N)}catch(_){img=null}
 if(!img||!img.data)return null;
 return {N,canvas,g,img,u32:new Uint32Array(img.data.buffer),field:buildSpiral(N),pal:paletteTable(),step:-1,dpr};
}
/* Shading LUT: soft cosine over the 16 light levels. */
const LIGHT_LUT=(()=>{const a=new Uint8Array(256);for(let i=0;i<256;i++)a[i]=Math.round((.5+.5*Math.cos(i/256*TAU))*(LIGHT_N-1));return a})();
function paintSpiral(S,t){
 const {u32,pal,field}=S,{idx,A,B,S:seam,n}=field;
 const turn=t/52,flow=t*.032;                                      // one full turn per 52 s; slow inward drift of the bands
 const pa=Math.round(((ARMS*turn+flow)%1+1)%1*65536)|0,pb=Math.round((((-t*.045)%1)+1)%1*65536)|0;
 for(let k=0;k<n;k++){
  const p=((A[k]+pa)&0xFFFF)>>7,l=LIGHT_LUT[((B[k]+pb)&0xFFFF)>>8];
  u32[idx[k]]=pal[(p<<5)|seam[k]|l];
 }
 S.g.putImageData(S.img,0,0);
}

/* ---------- small sprites ---------- */
function eyeSprite(dpr,w){
 const h=w*.52;
 return sprite(w*1.2,h*1.4,w*.6,h*.7,dpr,g=>{
  const hw=w/2,hh=h/2;
  g.beginPath();g.moveTo(-hw,0);g.quadraticCurveTo(0,-hh*1.9,hw,0);g.quadraticCurveTo(0,hh*1.9,-hw,0);g.closePath();
  g.fillStyle='rgba(236,226,255,.95)';g.fill();g.lineWidth=Math.max(1.2,w*.07);g.lineJoin='round';g.strokeStyle='#1b0e5c';g.stroke();
  g.save();g.clip();
  g.fillStyle=radial(g,0,0,1,hh*.95,[[0,'#12083f'],[.34,'#12083f'],[.4,'#a6ff4a'],[.66,'#1fe3e0'],[.9,'#7a35ff'],[1,'#ff2fa3']]);
  g.beginPath();g.arc(0,0,hh*.98,0,TAU);g.fill();
  g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.arc(-hh*.3,-hh*.3,hh*.13,0,TAU);g.fill();
  g.restore();
 });
}
function diamond(dpr,r,col){
 return sprite(r*3,r*3,r*1.5,r*1.5,dpr,g=>{
  g.fillStyle=radial(g,0,0,0,r*1.5,[[0,'rgba(255,255,255,.6)'],[.4,col.replace(/[\d.]+\)$/,'.22)')],[1,col.replace(/[\d.]+\)$/,'0)')]]);g.fillRect(-r*1.5,-r*1.5,r*3,r*3);
  g.beginPath();g.moveTo(0,-r);g.quadraticCurveTo(r*.14,-r*.14,r*.62,0);g.quadraticCurveTo(r*.14,r*.14,0,r);g.quadraticCurveTo(-r*.14,r*.14,-r*.62,0);g.quadraticCurveTo(-r*.14,-r*.14,0,-r);g.closePath();
  g.fillStyle='#fff7ff';g.fill();
 });
}
function glow(dpr,size,stops){const r=size/2;return sprite(size,size,r,r,dpr,g=>{g.fillStyle=radial(g,0,0,0,r,stops);g.fillRect(-r,-r,size,size)})}

/* ---------- floating slab ---------- */
/* Hanging rock under a surface ellipse (centre 0,0; half width rx). */
function rockProfile(rx,depth,seed){
 const r=rng(seed),n=9,left=[],right=[];
 for(let i=0;i<=n;i++){const u=i/n,x=lerp(-rx,0,u),edge=Math.pow(Math.abs(x)/rx,1.55),jag=(r()-.5)*depth*.13*(i>0&&i<n?1:0);left.push([x,depth*(1-edge)*(.92+r()*.1)+jag])}
 for(let i=1;i<=n;i++){const u=i/n,x=lerp(0,rx,u),edge=Math.pow(Math.abs(x)/rx,1.55),jag=(r()-.5)*depth*.13*(i<n?1:0);right.push([x,depth*(1-edge)*(.9+r()*.12)+jag])}
 return {left,right};
}
function slabSprite(dpr,S){
 const rx=S.rx,depth=S.depth,pad=rx*1.1,up=rx*1.2,down=rx*.9;
 return sprite((rx+pad)*2,up+depth+down,rx+pad,up,dpr,g=>{
  const ry=rx*.2,prof=rockProfile(rx,depth,11),pts=[...prof.left,...prof.right];
  // soft aura so the slab separates from the cream staircase behind it
  g.fillStyle=radial(g,0,depth*.3,rx*.2,rx*1.1,[[0,'rgba(20,8,70,.55)'],[1,'rgba(20,8,70,0)']]);g.fillRect(-rx*1.15,-rx*1.15,rx*2.3,rx*1.15+depth+rx*.85);
  g.beginPath();g.moveTo(-rx,0);for(const p of pts)g.lineTo(p[0],p[1]);g.lineTo(rx,0);g.ellipse(0,0,rx,ry,0,0,Math.PI,true);g.closePath();
  g.fillStyle=linear(g,0,0,0,depth,[[0,'#8a63d9'],[.4,'#4f2fa0'],[1,'#22115e']]);g.fill();
  g.save();g.clip();
  g.fillStyle=linear(g,-rx,0,rx,0,[[0,'rgba(18,8,60,.5)'],[.55,'rgba(18,8,60,0)'],[1,'rgba(255,120,220,.22)']]);g.fillRect(-rx,0,rx*2,depth);
  g.restore();
  // iridescent rim down the underside edge
  g.beginPath();g.moveTo(-rx,0);for(const p of pts)g.lineTo(p[0],p[1]);g.lineTo(rx,0);
  g.lineWidth=1.8;g.lineCap='round';g.lineJoin='round';g.strokeStyle=linear(g,-rx,0,rx,depth,[[0,'#6ff0ff'],[.35,'#a98bff'],[.65,'#ff7ad9'],[1,'#ffe66a']]);g.stroke();
  // top face: pale glaze with a thin rainbow lip
  g.beginPath();g.ellipse(0,0,rx,ry,0,0,TAU);g.fillStyle=linear(g,0,-ry,0,ry,[[0,'#fff5ff'],[1,'#cdb4ff']]);g.fill();
  g.beginPath();g.ellipse(0,0,rx,ry,0,0,TAU);g.lineWidth=1.6;g.strokeStyle=linear(g,-rx,0,rx,0,[[0,'#6ff0ff'],[.3,'#a6ff6a'],[.5,'#ffe66a'],[.75,'#ff7ad9'],[1,'#a98bff']]);g.stroke();
  g.beginPath();g.ellipse(-rx*.1,ry*.05,rx*.62,ry*.5,0,0,TAU);g.strokeStyle='rgba(122,53,255,.28)';g.lineWidth=1;g.stroke();
  const rp=rng(31);
  for(let i=0;i<3;i++){const x=lerp(-rx*.4,rx*.45,rp()),y=depth*(.8+rp()*.28)+3,rr=2+rp()*2.6;g.beginPath();g.ellipse(x,y+rr*(i%2),rr,rr*.8,0,0,TAU);g.fillStyle=i%2?'#4b2c98':'#6a45c4';g.fill()}
 });
}

/* ---------- hand-built lettering, iridescent ---------- */
/* Strokes are authored in a 200x100 box: 몽 = ㅁ + ㅗ + ㅇ at x 0..92, 유 = ㅇ + ㅠ at x 108..200. */
const LETTER_W=200,LETTER_H=100,STROKE=9.6;
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
function titleSprite(dpr,hCss){
 const k=hCss/LETTER_H,pad=22*Math.max(.6,k);
 const W=LETTER_W*k+pad*2+8*k,H=LETTER_H*k+pad*2+18*k;
 const body=sprite(W,H,pad,pad,dpr,g=>{
  g.scale(k,k);g.lineCap='round';g.lineJoin='round';
  // misregistered shadow: a solid violet copy and a thin hot-pink contour copy, both pushed down-right
  g.save();g.translate(4.6,5.8);letterPaths(g);g.lineWidth=STROKE+6;g.strokeStyle='#4a16a8';g.stroke();g.restore();
  g.save();g.translate(9,10.6);letterPaths(g);g.lineWidth=1.9;g.strokeStyle='#ff4fb8';g.stroke();g.restore();
  g.save();g.translate(-3.2,-3.4);letterPaths(g);g.lineWidth=1.4;g.strokeStyle='rgba(111,240,255,.9)';g.stroke();g.restore();
  letterPaths(g);g.lineWidth=STROKE+6;g.strokeStyle='#14083f';g.stroke();
  letterPaths(g);g.lineWidth=STROKE;
  g.strokeStyle=linear(g,0,0,LETTER_W,LETTER_H*1.1,[[0,'#30e6ff'],[.2,'#8cff6b'],[.4,'#ffe65a'],[.58,'#ff8f5a'],[.78,'#ff3fa4'],[1,'#a064ff']]);g.stroke();
  g.save();g.translate(-1.6,-1.7);letterPaths(g);g.lineWidth=1.3;g.strokeStyle='rgba(255,255,255,.8)';g.stroke();g.restore();
 });
 return {body,k,W,H,pad,star:{x:(108+68)*k,y:5*k}};
}
function sparkle(c,x,y,r,a){
 if(a<=0)return;
 c.save();c.translate(x,y);c.globalAlpha*=a;c.fillStyle='#fffaf0';
 c.beginPath();c.moveTo(0,-r);c.quadraticCurveTo(r*.12,-r*.12,r,0);c.quadraticCurveTo(r*.12,r*.12,0,r);c.quadraticCurveTo(-r*.12,r*.12,-r,0);c.quadraticCurveTo(-r*.12,-r*.12,0,-r);c.fill();
 c.restore();
}

/* ---------- per-viewport cache ---------- */
function build(w,h,dpr){
 const L=layout(w,h),C={key:w+'x'+h+'@'+dpr,L,dpr};
 C.spiral=spiralState(Math.ceil(L.moon.r*2),dpr);
 C.slab=slabSprite(dpr,L.slab);
 C.title=titleSprite(dpr,L.title.h);
 C.eyes=IMG.eyes.map(e=>({spec:e,sp:eyeSprite(dpr,Math.max(18,e.s*L.ps*1.1))}));
 C.dia=[diamond(dpr,5,'rgba(255,160,230,0)'),diamond(dpr,7,'rgba(120,240,255,0)')];
 C.glow={white:glow(dpr,48,[[0,'rgba(255,255,255,.95)'],[.3,'rgba(255,230,255,.5)'],[1,'rgba(255,230,255,0)']]),
  halo:glow(dpr,128,[[0,'rgba(255,120,220,.5)'],[.5,'rgba(255,120,220,.12)'],[1,'rgba(255,120,220,0)']])};
 // character rim light: render the dreamer offscreen once per frame, tint the silhouette, stamp it around the original
 const bh=L.hero.h,bw=Math.ceil(bh*1.25),bhh=Math.ceil(bh*1.3);
 C.hero={bw,bh:bhh,feetY:bhh-6,body:makeCanvas(Math.ceil(bw*dpr),Math.ceil(bhh*dpr)),rim:makeCanvas(Math.ceil(bw*dpr),Math.ceil(bhh*dpr))};
 for(const k of ['body','rim']){const cv=C.hero[k];if(cv){const g=cv.getContext('2d');if(g&&g.setTransform)g.setTransform(dpr,0,0,dpr,0,0);C.hero[k+'G']=g}}
 return C;
}
function ensure(w,h,dpr){
 const key=w+'x'+h+'@'+dpr;
 if(!cache||cache.key!==key)cache=build(w,h,dpr);
 return cache;
}

/* ---------- frame ---------- */
const stats={frames:0,last:0,avg:0,max:0,built:0,spiral:0};
function now(){return root.performance?.now?.()??Date.now()}
function drawHero(c,C,t,reduced,x,y){
 const M=root.MongyuMobile;if(!M?.sprite)return;
 const H=C.hero,L=C.L,bg=H.bodyG,rg=H.rimG;
 if(!bg||!rg){try{M.sprite(c,{x,y,bodyHeight:L.hero.h,pose:'stand'},{poseTime:t,onDark:true},reduced)}catch(_){}return}
 bg.save();bg.setTransform(C.dpr,0,0,C.dpr,0,0);bg.clearRect(0,0,H.bw,H.bh);
 try{M.sprite(bg,{x:H.bw/2,y:H.feetY,bodyHeight:L.hero.h,pose:'stand'},{poseTime:t,onDark:true},reduced)}catch(_){}
 bg.restore();
 rg.save();rg.setTransform(C.dpr,0,0,C.dpr,0,0);rg.clearRect(0,0,H.bw,H.bh);rg.globalCompositeOperation='source-over';
 rg.drawImage(H.body,0,0,H.bw,H.bh);rg.globalCompositeOperation='source-in';
 rg.fillStyle=linear(rg,0,0,0,H.bh,[[0,'#6ff0ff'],[.38,'#a98bff'],[.62,'#ff7ad9'],[.85,'#ffe66a'],[1,'#a6ff6a']]);rg.fillRect(0,0,H.bw,H.bh);
 rg.restore();
 const dx=x-H.bw/2,dy=y-H.feetY,o=Math.max(1.6,L.s*2.1);
 c.save();c.globalAlpha=1;
 for(const [ox,oy] of [[-o,0],[o,0],[0,-o],[0,o],[-o*.7,-o*.7],[o*.7,-o*.7],[-o*.7,o*.7],[o*.7,o*.7]])c.drawImage(H.rim,dx+ox,dy+oy,H.bw,H.bh);
 c.globalAlpha=1;c.drawImage(H.body,dx,dy,H.bw,H.bh);c.restore();
}
function draw(c,opts){
 const t0=now(),vp=opts.viewport,w=vp.width,h=vp.height,dpr=vp.dpr||1,reduced=!!opts.reduced;
 const t=reduced?0:(opts.time||0);
 const buildStart=!cache||cache.key!==w+'x'+h+'@'+dpr;
 const C=ensure(w,h,dpr),L=C.L,s=L.s,m=L.moon;
 c.save();
 c.globalAlpha=1;c.globalCompositeOperation='source-over';
 // 1. backdrop, cover-fit with the moon jar always in view
 const A=root.MongyuArt;
 c.fillStyle=PAL.indigo;c.fillRect(0,0,w,h);
 if(A?.ready&&A.ready('lobby-psy')){const im=A.image('lobby-psy');c.drawImage(im,L.ox,L.oy,IMG.w*L.ps,IMG.h*L.ps)}
 else A?.image?.('lobby-psy');
 // 2. the moon fill: live spiral clipped to the jar circle
 const sp=C.spiral;
 if(sp){
  const step=reduced?0:Math.floor(t*24);
  if(step!==sp.step){const a=now();paintSpiral(sp,reduced?0:t);sp.step=step;stats.spiral=now()-a}
  c.save();c.beginPath();c.arc(m.x,m.y,m.r*1.012,0,TAU);c.clip();
  c.imageSmoothingEnabled=true;c.drawImage(sp.canvas,m.x-m.r*1.03,m.y-m.r*1.03,m.r*2.06,m.r*2.06);
  // depth: dark inner rim, bright core so the singularity reads as the moon's light
  c.fillStyle=radial(c,m.x,m.y,m.r*.5,m.r*1.02,[[0,'rgba(18,8,63,0)'],[.78,'rgba(18,8,63,.18)'],[1,'rgba(18,8,63,.62)']]);c.fillRect(m.x-m.r,m.y-m.r,m.r*2,m.r*2);
  const pulse=reduced?.5:.5+.5*Math.sin(t*TAU/9);
  c.fillStyle=radial(c,m.x,m.y,0,m.r*.34,[[0,'rgba(255,250,255,'+(.62+pulse*.14).toFixed(2)+')'],[.5,'rgba(255,230,250,.22)'],[1,'rgba(255,230,250,0)']]);c.fillRect(m.x-m.r,m.y-m.r,m.r*2,m.r*2);
  c.restore();
 }
 // 3. colour breathing over the whole backdrop: composite 'hue', 26 s period, never the filter property
 {
  const hue=300+(reduced?0:Math.sin(t*TAU/26)*55);
  c.globalCompositeOperation='hue';c.globalAlpha=.2;c.fillStyle='hsl('+hue.toFixed(1)+',85%,55%)';c.fillRect(0,0,w,h);
  c.globalCompositeOperation='source-over';c.globalAlpha=1;
 }
 // 4. ripples leaving the moon: three thin rings, slow, alpha <= .25
 c.globalCompositeOperation='lighter';
 for(let i=0;i<3;i++){
  const u=reduced?(i===1?.42:-1):(t/11+i/3)%1;if(u<0)continue;
  const a=.25*Math.pow(Math.sin(Math.PI*u),1.3);
  c.globalAlpha=a;c.lineWidth=Math.max(1.4,2.2*s*(1-u*.5));c.strokeStyle=PAL.rim[(i*2)%5];
  c.beginPath();c.arc(m.x,m.y,m.r*(1.04+u*1.2),0,TAU);c.stroke();
 }
 c.globalAlpha=1;
 // 5. drifting eyes (slow fade in and out, rare slow blink) and diamond sparkles
 C.eyes.forEach((e,i)=>{
  if(!e.sp)return;
  const cyc=reduced?.55:Math.max(0,Math.sin(t*TAU/17+e.spec.ph))*.78;if(cyc<=.02)return;
  const [ex,ey]=toScreen(L,e.spec.x,e.spec.y),dx=reduced?0:Math.sin(t*.13+e.spec.ph)*9*s,dy=reduced?0:Math.cos(t*.1+e.spec.ph*1.3)*6*s;
  const bp=reduced?0:((t+e.spec.ph*3)%9)/9,q=bp>.93?(bp-.93)/.07:-1,o=clamp(q<0?1:Math.abs(2*q-1),.12,1);
  c.globalAlpha=cyc;c.globalCompositeOperation='source-over';
  c.drawImage(e.sp.canvas,ex+dx-e.sp.ax,ey+dy-e.sp.ay*o,e.sp.w,e.sp.h*o);
 });
 c.globalCompositeOperation='lighter';
 IMG.spark.forEach(([ix,iy],i)=>{
  const [sx,sy]=toScreen(L,ix,iy);if(sx<-8||sx>w+8||sy<-8||sy>h+8)return;
  const a=reduced?.6:Math.max(0,Math.sin(t*(.4+(i%5)*.09)+i*1.7))*.85;if(a<=.02)return;
  const d=C.dia[i%2],sc=(i%3===0?1.15:.85)*s;
  c.globalAlpha=a;c.drawImage(d.canvas,sx-d.w*sc/2,sy-d.h*sc/2+(reduced?0:Math.sin(t*.3+i)*3*s),d.w*sc,d.h*sc);
 });
 c.globalAlpha=1;c.globalCompositeOperation='source-over';
 // 6. the dreamer on a floating slab with an iridescent rim light
 {
  const bob=reduced?0:Math.sin(t*TAU/6.5)*3*s,sl=L.slab;
  c.globalCompositeOperation='lighter';c.globalAlpha=.55;const hs=sl.rx*3.4;if(C.glow.halo)c.drawImage(C.glow.halo.canvas,sl.x-hs/2,sl.y+bob-hs*.55,hs,hs);
  c.globalCompositeOperation='source-over';c.globalAlpha=1;
  if(C.slab)blit(c,C.slab,sl.x,sl.y+bob);
  drawHero(c,C,t,reduced,sl.x,sl.y+bob-sl.rx*.02);
 }
 // 7. lettering: soft dark plate so it reads on the busy crown, then the iridescent strokes
 {
  const T=C.title,tx=L.title.x-(LETTER_W*T.k)/2,ty=L.title.y-(LETTER_H*T.k)/2,fy=reduced?0:Math.sin(t*.8)*1.4;
  c.save();c.translate(L.title.x,L.title.y);c.scale(1,.55);
  c.fillStyle=radial(c,0,0,0,LETTER_W*T.k*.95,[[0,'rgba(14,6,50,.62)'],[.6,'rgba(14,6,50,.3)'],[1,'rgba(14,6,50,0)']]);c.fillRect(-LETTER_W*T.k,-LETTER_W*T.k,LETTER_W*T.k*2,LETTER_W*T.k*2);
  c.restore();
  if(T.body)c.drawImage(T.body.canvas,tx-T.pad,ty-T.pad+fy,T.W,T.H);
  sparkle(c,tx+T.star.x,ty+T.star.y+fy,(reduced?4:3.4+1.6*Math.max(0,Math.sin(t*1.4)))*T.k*1.1,1);
 }
 c.restore();
 const ms=now()-t0;stats.frames++;stats.last=ms;stats.max=Math.max(stats.max,ms);stats.avg+=(ms-stats.avg)*.05;if(buildStart)stats.built=ms;
 return {kind:'r105-lobby',width:w,height:h};
}

/* Reset sprites (e.g. after the character look changes). */
function invalidate(){cache=null}
const api=Object.freeze({enabled,draw,layout,invalidate,setFactory,stats,PAL,IMG,letterPaths,LETTER_W,LETTER_H,rng,
 get cached(){return cache?cache.key:null}});
root.MongyuLobbyScene=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
