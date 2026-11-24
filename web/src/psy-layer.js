/* R105 psychedelic layer drawn over course acts: the dark "trip" look (docs/R105_TRIP_ART_KO.md). Owned by workstream L, rewritten by workstream TR (wave 3).
   MongyuPsy.draw(ctx,run,opts) is called by course-run.js right after the child act (and before the aurora gate and HUD). Everything is drawn in the course's
   MongyuTrip palette (the child act's `trip`, default violet): two or three neighbouring neon hue families, never a rainbow wheel.
   Layers, back to front: dark edge vignette, course backdrop (duotone-tinted to the palette, screen/lighten blend, lane masked), palette-gradient edge wash with
   moire / concentric stripes, NOM3 beat-pulsing square grid (never over the central lane, size +-6 %), corner mandalas, beat ripples.
   Flash safety (docs/R105_PSYCHEDELIC_ART_KO.md): every parameter is a continuous function of time with periods >= 20 s (gradient turn 48 s, rotation 64 s,
   backdrop breathing 24 s, parallax 61 s/47 s, moire drift 47 s); the only beat-locked motion is a thin expanding ring (alpha <= .15), a +-6 % vignette swell and the
   +-6 % size / +-20 % alpha pulse of the square grid (a few % of the frame, low alpha), all smooth. The combo raises saturation and pattern density gradually
   (<= .3 level per second). `opts.reduced` draws one static faint edge wash. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const mod=(a,n)=>((a%n)+n)%n;

/* Every tunable in one frozen table (reported by the verification script). */
const PARAMS=Object.freeze({
 backdropScreen:.3,backdropLighten:.1,backdropMax:.4,breathPeriod:24,breathDepth:.18, // backdrop: screen alpha, lighten alpha, hard cap, breathing period (s) and depth
 parallaxX:.022,parallaxY:.016,parallaxPeriodX:61,parallaxPeriodY:47,zoom:1.12,       // slow drift as a fraction of the viewport
 huePeriod:48,rotatePeriod:64,moirePeriod:47,                                         // gradient-axis turn, mandala turn (both >= 40 s) and moire drift (>= 20 s)
 washScreen:.24,washBoost:.1,washCombo:.08,washMax:.5,                                 // palette edge wash: base alpha, extra with the combo level / at combo >= 3, cap
 darkEdge:.3,                                                                          // dark vignette alpha at the corners (keeps the lane contrast)
 rippleAlpha:.07,rippleCombo:.08,rippleMax:.15,rippleBeats:6,                         // ripple: base alpha, extra at combo, hard cap, lifetime in beats
 mandalaAlpha:.1,mandalaCombo:.12,rings:4,
 gridAlpha:.1,gridCombo:.08,gridMax:.22,gridAmp:.06,gridAlphaAmp:.2,gridCell:.075,     // NOM3 squares: base alpha, extra with combo, cap, size amplitude (+-6 %), alpha amplitude, cell as a fraction of the short side
 gridInner:{x:.36,y:.34},                                                              // lane ellipse (fractions of W/H) the grid never enters
 comboFull:6,levelUp:.3,levelDown:.15,                                                 // combo level eases at <= .3 per second up and .15 down
 maskInner:.3,maskOuter:.85,                                                           // backdrop lane mask: transparent inside, full beyond (elliptical distance)
 reducedAlpha:.2,fadeIn:1.4,budgetMs:2});

/* ---------- palette ---------- */
const FALLBACK={rim:'#7b3cff',rim2:'#ff2e9a',glow:'#b46bff',fog:'#5b2bd6',accent:'#19e3ff',sky:['#07031a','#140a33','#2a1259']};
const hexRGB=h=>{const n=parseInt(h.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255]};
const mixHex=(a,b,t)=>{const x=hexRGB(a),y=hexRGB(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')};
const rgba=(h,a)=>{const v=hexRGB(h);return 'rgba('+v[0]+','+v[1]+','+v[2]+','+a.toFixed(3)+')'};
const palCache=new Map();
function paletteOf(key){
 key=key||'violet';let p=palCache.get(key);if(p)return p;
 let src=root.MongyuTrip?.get?.(key)||FALLBACK;
 const light=!!src.light;
 if(light)src=root.MongyuTrip.get('violet');   // light calm chapters: the overlay that blooms with the combo is always the violet/magenta family (no rainbow)
 const rc=hexRGB(src.rim),lum=(.2126*rc[0]+.7152*rc[1]+.0722*rc[2])/255;   // bright neons (lime, aqua) get a gentler wash so the scene stays dark
 p={key,light,k:.55+.45*clamp(1.2-lum,.35,1),rim:src.rim,rim2:src.rim2,glow:src.glow,fog:src.fog,accent:src.accent,sky:src.sky,rimL:mixHex(src.rim,'#ffffff',.22),glowL:mixHex(src.glow,'#ffffff',.18),rimD:mixHex(src.rim,'#000000',.3),rim2D:mixHex(src.rim2,'#000000',.34),glowD:mixHex(src.glow,'#000000',.4)};
 palCache.set(key,p);return p;
}
const tripOf=run=>run?.child?.trip||run?.options?.trip||run?.trip||'violet';

/* ---------- pure helpers (also used by tests) ---------- */
const levelFor=streak=>clamp((streak|0)/PARAMS.comboFull,0,1);
const hueAt=(t,offset=0)=>mod(offset+360*t/PARAMS.huePeriod,360);     // gradient axis angle in degrees: one turn per 48 s
function easeLevel(cur,target,dt){return target>cur?Math.min(target,cur+PARAMS.levelUp*dt):Math.max(target,cur-PARAMS.levelDown*dt)}
/* Rings alive at time t: one per beat (every second beat while the combo is low), born exactly on the beat, fading as they widen. */
function ripples(t,bpm,level,out=[]){
 out.length=0;const beat=60/Math.max(40,bpm||100),pos=t/beat,life=PARAMS.rippleBeats,every=level>=.5?1:2;
 for(let k=Math.floor(pos);k>pos-life;k--){
  if(k<0||k%every)continue;
  const u=(pos-k)/life;if(u<0||u>=1)continue;
  const a=(PARAMS.rippleAlpha+PARAMS.rippleCombo*level)*Math.pow(1-u,1.6)*smooth(0,.08,u);
  out.push({k,u,r:1-Math.pow(1-u,2),alpha:Math.min(PARAMS.rippleMax,a)});
 }
 return out;
}
/* Backdrop placement (cover width with a gentle vertical stretch; mirrored tiles fill the rest). */
function placement(iw,ih,W,H,t,variant){
 const z=PARAMS.zoom+(variant?.04:0)+.012*Math.sin(TAU*t/PARAMS.breathPeriod);
 const sx=W/iw*z,sy=clamp(H/ih*z,sx,sx*1.25),dw=iw*sx,dh=ih*sy;
 const dir=variant?-1:1,px=dir*PARAMS.parallaxX*W*Math.sin(TAU*t/PARAMS.parallaxPeriodX),py=PARAMS.parallaxY*H*Math.sin(TAU*t/PARAMS.parallaxPeriodY+variant);
 return {x:(W-dw)/2+px,y:(H-dh)/2+py,w:dw,h:dh};
}
/* NOM3 square grid for a viewport: cells never inside the lane ellipse. Returns [{x,y,d}] (d = elliptical distance, >= 1) and the cell size. Pure, so tests can check the lane is empty. */
function gridCells(W,H,level,out=[]){
 out.length=0;const cell=Math.round(clamp(Math.min(W,H)*PARAMS.gridCell,22,40)*(1-.18*level)),cx=W/2,cy=H*.52,rx=W*PARAMS.gridInner.x,ry=H*PARAMS.gridInner.y;
 const x0=(W/2)%cell-cell,y0=(H/2)%cell-cell;
 for(let y=y0;y<H+cell;y+=cell)for(let x=x0;x<W+cell;x+=cell){
  const dx=(x-cx)/rx,dy=(y-cy)/ry,d=Math.sqrt(dx*dx+dy*dy);
  if(d<1.02)continue;out.push({x,y,d,i:Math.round((x-x0)/cell),j:Math.round((y-y0)/cell)});
 }
 out.cell=cell;return out;
}

/* ---------- canvases (created lazily, cached per size) ---------- */
const mk=(w,h)=>{const d=root.document;if(!d||!d.createElement)return null;const c=d.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return c};
const baked=new Map();                                 // art id|trip -> {canvas, iw, ih}
let wash=null,edge=null,washKey='',still=null,stillKey='',washAt=-9,washAng=-1,washTrip='';
/* Duotone tint: the old course backdrops were rainbow-ish, so their luminance is mapped onto black -> rim -> rim2 -> glow of the palette (adjacent hues only). */
function lutFor(p){
 const stops=[[0,[0,0,0]],[.42,hexRGB(p.rimD)],[.78,hexRGB(p.rim2D)],[1,hexRGB(p.glow)]],lut=new Uint8Array(256*3);
 for(let i=0;i<256;i++){
  const u=Math.pow(i/255,1.9);let k=0;while(k<stops.length-2&&u>stops[k+1][0])k++;
  const a=stops[k],b=stops[k+1],t=clamp((u-a[0])/(b[0]-a[0]),0,1);
  for(let c=0;c<3;c++)lut[i*3+c]=Math.round(a[1][c]+(b[1][c]-a[1][c])*t);
 }
 return lut;
}
function bake(id,p){
 const bk=id+'|'+p.key;let e=baked.get(bk);if(e)return e;
 e={canvas:null,iw:0,ih:0};baked.set(bk,e);
 const A=root.MongyuArt,img=A?.image?.(id);if(!img){baked.delete(bk);return null}
 if(!A.ready(id)){baked.delete(bk);return null}
 const iw=img.naturalWidth,ih=img.naturalHeight,bw=320,bh=Math.round(bw*ih/iw),c=mk(bw,bh),x=c?.getContext?.('2d');
 if(!x){baked.delete(bk);return null}
 x.drawImage(img,0,0,bw,bh);
 try{
  const im=x.getImageData(0,0,bw,bh);
  if(im&&im.data&&im.data.length>=bw*bh*4){
   const d=im.data,lut=lutFor(p);
   for(let o=0;o<d.length;o+=4){const l=(d[o]*.3+d[o+1]*.59+d[o+2]*.11)|0,k=l*3;d[o]=lut[k];d[o+1]=lut[k+1];d[o+2]=lut[k+2]}
   x.putImageData(im,0,0);
  }
 }catch(_){/* tainted canvas: keep the picture as it is */}
 // Elliptical lane mask: the centre of the picture (where the runner and obstacles are) is transparent, the ornate frame stays.
 x.save();x.globalCompositeOperation='destination-in';x.translate(bw/2,bh/2);x.scale(bw/2,bh*.62);
 const g=x.createRadialGradient(0,0,0,0,0,1);
 g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(PARAMS.maskInner,'rgba(0,0,0,0)');g.addColorStop(PARAMS.maskOuter,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,1)');
 x.fillStyle=g;x.fillRect(-2,-2,4,4);x.restore();
 e.canvas=c;e.iw=bw;e.ih=bh;return e;
}
const WASH_W=128;
function ensureWash(W,H){
 const key=W+'x'+H;if(key===washKey&&wash)return;
 washKey=key;washAt=-9;washAng=-1;
 const w=WASH_W,h=Math.max(32,Math.round(WASH_W*H/W));wash=mk(w,h);edge=mk(w,h);
 const x=edge?.getContext?.('2d');if(!x||!wash)return;
 // Edge ramp: 0 in the middle, 1 at the border (rectangular distance, soft).
 try{
  const img=x.createImageData(w,h),d=img.data;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
   const nx=Math.abs((i+.5)/w*2-1),ny=Math.abs((j+.5)/h*2-1),m=Math.max(nx,ny*.96),a=smooth(.52,1,m),o=(j*w+i)*4;
   d[o]=d[o+1]=d[o+2]=255;d[o+3]=Math.round(a*255);
  }
  x.putImageData(img,0,0);
 }catch(_){x.fillStyle='rgba(255,255,255,.6)';x.fillRect(0,0,w,h)}
}
/* The edge colour field: a palette gradient whose axis turns once per 48 s (rim -> rim2 -> glow -> rim, neighbouring hues only) with two sets of concentric rings
   on slightly different centres (moire), masked to the border. Redrawn ~10x per second (it changes over tens of seconds). level = combo level (denser rings). */
function paintWash(x,w,h,p,ang,t,level,staticOnly){
 x.globalCompositeOperation='source-over';x.clearRect(0,0,w,h);
 const a=ang*Math.PI/180,cx=w/2,cy=h/2,r=Math.hypot(w,h)/2,ca=Math.cos(a),sa=Math.sin(a);
 const g=x.createLinearGradient(cx-ca*r,cy-sa*r,cx+ca*r,cy+sa*r);
 g.addColorStop(0,p.rimD);g.addColorStop(.34,p.rim2D);g.addColorStop(.67,p.glowD);g.addColorStop(1,p.rimD);
 x.fillStyle=g;x.fillRect(0,0,w,h);
 // moire / concentric stripes (only the border survives the mask)
 const step=7-1.8*level,drift=staticOnly?0:TAU*t/PARAMS.moirePeriod,ox=Math.sin(drift)*step*.9,oy=Math.cos(drift)*step*.7,n=Math.ceil(Math.hypot(w,h)/step/1.6);
 x.lineWidth=1;
 for(let s=0;s<2;s++){
  x.strokeStyle=s?rgba(p.rim2,.5):rgba(p.glowL,.55);
  const sx=cx+(s?ox:0),sy=h*.56+(s?oy:0),st=step*(s?1.06:1);
  x.beginPath();
  for(let k=3;k<n*1.6;k++){const rr=k*st;x.moveTo(sx+rr,sy);x.arc(sx,sy,rr,0,TAU)}
  x.stroke();
 }
 x.globalCompositeOperation='destination-in';x.drawImage(edge,0,0);x.globalCompositeOperation='source-over';
}
function refreshWash(t,p,level){
 if(!wash||!edge)return;
 const ang=hueAt(t),key=p.key+'|'+Math.round(level*10);
 if(key===washTrip&&Math.abs(ang-washAng)<.4&&t-washAt<.5&&t>=washAt)return;
 washAt=t;washAng=ang;washTrip=key;
 const x=wash.getContext('2d');if(!x)return;
 paintWash(x,wash.width,wash.height,p,ang,t,level,false);
}
function ensureStill(W,H,p){
 const key=W+'x'+H+'|'+p.key;if(key===stillKey&&still)return;
 stillKey=key;ensureWash(W,H);if(!wash)return;
 still=mk(wash.width,wash.height);const x=still?.getContext?.('2d');if(!x)return;
 paintWash(x,still.width,still.height,p,35,0,0,true);
}

/* ---------- mandala rosettes in the four corners (never the lane) ---------- */
function rosette(c,cx,cy,R,t,dir,level,colA,colB,alpha,corner){
 const turn=dir*TAU*t/PARAMS.rotatePeriod,rings=PARAMS.rings;
 c.save();c.translate(cx,cy);c.rotate(turn);
 c.lineWidth=1.1;
 // six spokes always, six more (the 30 degree gaps) fade in with the combo
 for(let g=0;g<2;g++){
  const a=g===0?1:smooth(.12,.7,level);if(a<=.01)continue;
  c.strokeStyle=rgba(g?colB:colA,alpha*a);
  c.beginPath();
  for(let i=0;i<6;i++){const ang=i*TAU/6+g*TAU/12;c.moveTo(Math.cos(ang)*R*.14,Math.sin(ang)*R*.14);c.lineTo(Math.cos(ang)*R,Math.sin(ang)*R)}
  c.stroke();
 }
 // rings with petal scallops; ring k appears once the combo level reaches it
 for(let k=0;k<rings;k++){
  const a=k===0?1:smooth((k-1)/3-.06,k/3,level);if(a<=.01)continue;
  const r=R*(.3+.7*k/(rings-1)),n=12;
  c.strokeStyle=rgba(k%2?colB:colA,alpha*a*.9);
  c.beginPath();
  for(let i=0;i<n;i++){const a0=i*TAU/n,a1=(i+1)*TAU/n,am=(a0+a1)/2,bulge=r*.1;
   c.moveTo(Math.cos(a0)*r,Math.sin(a0)*r);c.quadraticCurveTo(Math.cos(am)*(r+bulge*(1+corner%2)),Math.sin(am)*(r+bulge*(1+corner%2)),Math.cos(a1)*r,Math.sin(a1)*r)}
  c.stroke();
 }
 c.restore();
}

/* ---------- NOM3: squares that pulse on the beat, outside the lane ---------- */
const cells=[];
function squares(c,W,H,t,bpm,level,p,alpha,pulsing){
 gridCells(W,H,level,cells);const cell=cells.cell,beat=60/Math.max(40,bpm||100),phase=pulsing?mod(t/beat,1):0;
 const base=Math.min(PARAMS.gridMax,(PARAMS.gridAlpha+PARAMS.gridCombo*level))*alpha,half=cell*.31,inner=smooth(.3,.8,level);
 const P2=root.Path2D;if(!P2)return;
 const bands=[new P2(),new P2(),new P2()],nest=[new P2(),new P2(),new P2()],fills=new P2();
 for(let i=0;i<cells.length;i++){
  const q=cells[i],wave=pulsing?.5+.5*Math.cos(TAU*(phase-q.d*.07)):.5;      // the pulse travels outward from the lane, one wave per beat
  const s=half*(1+PARAMS.gridAmp*(wave*2-1)),b=wave<.34?0:wave<.67?1:2;
  bands[b].rect(q.x-s,q.y-s,s*2,s*2);
  if(inner>.02)nest[b].rect(q.x-s*.5,q.y-s*.5,s,s);
  if((q.i*7+q.j*13)%11===0)fills.rect(q.x-s,q.y-s,s*2,s*2);
 }
 c.lineWidth=1;c.lineJoin='miter';
 const alphas=[1-PARAMS.gridAlphaAmp,1,1+PARAMS.gridAlphaAmp];
 for(let b=0;b<3;b++){
  const col=b===1?p.rimL:b===2?p.glowL:p.rim;
  c.globalAlpha=base*alphas[b];c.strokeStyle=col;c.stroke(bands[b]);
  if(inner>.02){c.globalAlpha=base*alphas[b]*.8*inner;c.strokeStyle=p.rim2;c.stroke(nest[b])}
 }
 c.globalAlpha=base*.34;c.fillStyle=p.rim2;c.fill(fills);
}

/* ---------- per-run state ---------- */
const S={run:null,lastT:0,level:0,start:0,act:-1,fadeAt:0,beatPulse:0,ms:0,frames:0,lastMs:0,maxMs:0,sumMs:0,over:0};
const tmp=[];
const nowMs=()=>root.performance?.now?.()??Date.now();
function stateFor(run,t){
 if(S.run!==run||t<S.lastT-.5){S.run=run;S.level=0;S.start=t;S.lastT=t;S.act=-1}
 return S;
}
/* Backdrop id for a run: course-<id>, else the lobby art. */
function backdropId(run){
 const A=root.MongyuArt;if(!A?.has)return null;
 const id='course-'+(run?.id||'');if(A.has(id))return id;
 return A.has('lobby-psy')?'lobby-psy':null;
}
function tileBackdrop(c,canvas,p,H,mirror){
 // Draw the baked backdrop, then flipped copies above/below so tall screens are always filled.
 const x0=p.x,w=p.w,h=p.h;
 const draw=(y,flip,mx)=>{
  c.save();
  if(flip||mx){c.translate(mx?x0+w:x0,flip?y+h:y);c.scale(mx?-1:1,flip?-1:1);c.drawImage(canvas,0,0,w,h)}
  else c.drawImage(canvas,x0,y,w,h);
  c.restore();
 };
 draw(p.y,false,mirror);
 for(let n=1;p.y-n*h>-h&&n<4;n++)draw(p.y-n*h,n%2===1,mirror);
 for(let n=1;p.y+n*h<H&&n<4;n++)draw(p.y+n*h,n%2===1,mirror);
}

function render(ctx,run,opts){
 if(!enabled||!ctx||!run)return false;
 const o=opts||{},vp=o.viewport||run.viewport||{width:390,height:844},W=vp.width||390,H=vp.height||844;
 const t0=nowMs();
 const reduced=o.reduced===true||(()=>{try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}})();
 const t=Number.isFinite(o.time)?o.time:(Number.isFinite(run.clock)?run.clock:0);
 const st=stateFor(run,t),dt=clamp(t-st.lastT,0,.1);st.lastT=t;
 const portal=run.portal||null,pal=paletteOf(tripOf(run));
 // Layer swap at the aurora gate: the new act's layer rises with the gate (the old one is in the cross-faded snapshot).
 const act=run.actIndex|0,variant=act&1;
 if(st.act!==act){st.fadeAt=portal?0:t;st.act=act}
 let master=ease(clamp((t-st.start)/PARAMS.fadeIn,0,1));
 if(portal)master*=ease(clamp(portal.age/Math.max(.01,portal.duration),0,1));
 if(master<=.002)return true;

 if(reduced){
  ensureStill(W,H,pal);
  ctx.save();
  if(!pal.light){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=PARAMS.darkEdge*.7*master;ctx.fillStyle=darkEdge(ctx,W,H);ctx.fillRect(0,0,W,H)}
  if(still){ctx.globalCompositeOperation=pal.light?'source-over':'screen';ctx.globalAlpha=PARAMS.reducedAlpha*master*(pal.light?.4:1);ctx.drawImage(still,0,0,W,H)}
  ctx.restore();
  return finish(t0);
 }

 const streak=Number.isFinite(run.perfectStreak)?run.perfectStreak:(run.child?.perfectStreak|0);
 st.level=easeLevel(st.level,levelFor(streak),dt);
 const L=st.level;                                     // combo level: saturation (alpha), pattern density and ring count rise gradually with it
 const beat=60/Math.max(40,run.bpm||100),phase=mod(t/beat,1),pulse=1+.06*L*(.5-.5*Math.cos(TAU*phase));
 const breath=1+PARAMS.breathDepth*Math.sin(TAU*t/PARAMS.breathPeriod);
 ctx.save();
 // 0. dark edge vignette: keeps the lane readable and gives the neon something to glow against
 if(!pal.light){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=PARAMS.darkEdge*master;ctx.fillStyle=darkEdge(ctx,W,H);ctx.fillRect(0,0,W,H)}
 // 1. course backdrop, duotone-tinted: screen + lighten over the dark scene, ornate frame only (the lane is masked)
 const id=pal.light?null:backdropId(run),b=id?bake(id,pal):null;
 const lv=pal.light?.1+.9*smooth(.08,.9,L):1,sc=pal.light?'source-over':'screen',lt=pal.light?'source-over':'lighter';   // light palettes: faint at base, blooming with the combo (fever)
 if(b?.canvas){
  const pl=placement(b.iw,b.ih,W,H,t,variant),a=Math.min(PARAMS.backdropMax,(PARAMS.backdropScreen+PARAMS.backdropLighten)*pal.k*breath*(.88+.3*L))*master;
  ctx.globalCompositeOperation='screen';ctx.globalAlpha=a*PARAMS.backdropScreen/(PARAMS.backdropScreen+PARAMS.backdropLighten);
  tileBackdrop(ctx,b.canvas,pl,H,!!variant);
  ctx.globalCompositeOperation='lighten';ctx.globalAlpha=a*PARAMS.backdropLighten/(PARAMS.backdropScreen+PARAMS.backdropLighten);
  tileBackdrop(ctx,b.canvas,pl,H,!!variant);
 }
 // 2. palette edge wash with moire stripes (axis turns once per 48 s, denser rings with the combo)
 ensureWash(W,H);refreshWash(t,pal,L);
 if(wash){
  const boost=PARAMS.washBoost*L+PARAMS.washCombo*smooth(2.5,3.5,streak);
  ctx.globalCompositeOperation='screen';ctx.globalCompositeOperation=sc;ctx.globalAlpha=Math.min(PARAMS.washMax,(PARAMS.washScreen+boost)*pal.k*pulse*master*(pal.light?lv*.8:1));ctx.drawImage(wash,0,0,W,H);
 }
 // 3. NOM3 squares pulsing with the beat, outside the lane
 ctx.globalCompositeOperation=lt;
 squares(ctx,W,H,t,run.bpm||100,L,pal,master*lv,true);
 // 4. mandala rosettes in the corners
 const R=Math.min(W,H)*.5,ma=(PARAMS.mandalaAlpha+PARAMS.mandalaCombo*L)*master*lv,sgn=variant?-1:1;
 rosette(ctx,-W*.04,-H*.015,R,t,sgn,L,pal.rim,pal.rim2,ma,0);rosette(ctx,W*1.04,-H*.015,R,t,-sgn,L,pal.rim2,pal.glow,ma,1);
 rosette(ctx,-W*.04,H*1.015,R,t,-sgn,L,pal.glow,pal.rim,ma,2);rosette(ctx,W*1.04,H*1.015,R,t,sgn,L,pal.rim,pal.glow,ma,3);
 // 5. beat ripples: thin expanding ellipses born on the beat, in the palette's own colours
 const rs=ripples(t,run.bpm||100,L,tmp),cx=W/2,cy=H*.6,maxR=Math.hypot(W,H)*.52,cols=[pal.rimL,pal.glowL,pal.rim2];
 for(let i=0;i<rs.length;i++){
  const r=rs[i],rad=maxR*r.r;if(rad<4)continue;
  ctx.globalAlpha=r.alpha*master*lv;ctx.lineWidth=1.5+2.5*r.u;
  ctx.strokeStyle=cols[mod(r.k,3)];
  ctx.beginPath();ctx.ellipse(cx,cy,rad,rad*.72,0,0,TAU);ctx.stroke();
 }
 ctx.restore();
 return finish(t0);
}
let darkKey='',darkGrad=null,darkCtx=null;
/* Corner darkening: a black radial gradient (transparent in the middle, opaque at the corners); cached per size and context. */
function darkEdge(ctx,W,H){
 const key=W+'x'+H;if(darkCtx===ctx&&key===darkKey&&darkGrad)return darkGrad;
 const g=ctx.createRadialGradient(W/2,H*.52,Math.min(W,H)*.4,W/2,H*.52,Math.hypot(W,H)*.62);
 g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,1)');darkKey=key;darkGrad=g;darkCtx=ctx;return g;
}
let warned=false;
function draw(ctx,run,opts){
 try{return render(ctx,run,opts)}catch(e){try{ctx.restore?.()}catch(_){}if(!warned){warned=true;try{root.console?.error?.('[MongyuPsy] draw failed',e)}catch(_){}}return false}
}
function finish(t0){const ms=nowMs()-t0;S.lastMs=ms;S.frames++;S.sumMs+=ms;if(ms>S.maxMs)S.maxMs=ms;if(ms>PARAMS.budgetMs)S.over++;return true}
/* Bake the backdrops ahead of the first run (called when the road screen opens) so the first frame of a course has no hitch. */
function warm(ids,trip){
 const A=root.MongyuArt;if(!enabled||!A)return 0;
 const list=(ids||['course-c1','course-c2','course-c3','course-c4','course-c5']).filter(id=>A.has?.(id)),p=paletteOf(trip);
 let n=0;for(const id of list)if(bake(id,p))n++;
 if(n<list.length&&A.preload){try{A.preload(list).then(()=>{for(const id of list)bake(id,p)})}catch(_){}}
 return n;
}
function stats(){return {frames:S.frames,lastMs:S.lastMs,maxMs:S.maxMs,avgMs:S.frames?S.sumMs/S.frames:0,overBudget:S.over,level:S.level}}
function resetStats(){S.over=0;S.frames=0;S.sumMs=0;S.maxMs=0;S.lastMs=0}
function reset(){S.run=null;S.level=0;baked.clear();wash=edge=still=null;washKey=stillKey=washTrip='';darkGrad=null;darkCtx=null}

const api=Object.freeze({enabled,PARAMS,draw,warm,levelFor,easeLevel,hueAt,ripples,placement,gridCells,backdropId,paletteOf,lutFor,stats,resetStats,reset,get level(){return S.level}});
root.MongyuPsy=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
