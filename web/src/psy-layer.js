/* R105 psychedelic layer drawn over course acts (backdrop blend, beat ripples, iridescent vignette, mandala lines). Owned by workstream L.
   MongyuPsy.draw(ctx,run,opts) is called by course-run.js right after the child act (and before the aurora gate and HUD). It only ever adds
   low-alpha, edge-weighted light; the centre lane (runner and obstacles) is masked out so gameplay stays crisp.
   Flash safety (docs/R105_PSYCHEDELIC_ART_KO.md): every parameter is a continuous function of time with periods >= 20 s (colour 48 s, rotation 64 s,
   backdrop breathing 24 s, parallax 61 s/47 s); the only beat-locked motion is a thin expanding ring (alpha <= .15) and a +-6 % vignette swell,
   both smooth. `opts.reduced` draws one static faint vignette. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const mod=(a,n)=>((a%n)+n)%n;

/* Every tunable in one frozen table (reported by the verification script). */
const PARAMS=Object.freeze({
 backdropSoft:.2,backdropScreen:.045,breathPeriod:24,breathDepth:.18,        // backdrop: soft-light alpha, screen alpha, breathing period (s) and depth
 parallaxX:.022,parallaxY:.016,parallaxPeriodX:61,parallaxPeriodY:47,zoom:1.12,// slow drift as a fraction of the viewport
 huePeriod:48,rotatePeriod:64,                                                 // colour cycle and mandala turn, both >= 20 s / >= 40 s
 washSoft:.26,washScreen:.045,washBoost:.08,washCombo:.06,                       // iridescent edge: base alphas and extra at combo >= 3
 rippleAlpha:.07,rippleCombo:.08,rippleMax:.15,rippleBeats:6,                 // ripple: base alpha, extra at combo, hard cap, lifetime in beats
 mandalaAlpha:.07,mandalaCombo:.1,rings:4,
 comboFull:6,levelUp:.3,levelDown:.15,                                         // combo level eases at <= .3 per second up and .15 down
 maskInner:.3,maskOuter:.85,                                                   // lane mask: transparent inside, full beyond (elliptical distance)
 reducedAlpha:.13,fadeIn:1.4,budgetMs:2});

/* ---------- pure helpers (also used by tests) ---------- */
const levelFor=streak=>clamp((streak|0)/PARAMS.comboFull,0,1);
const hueAt=(t,offset=0)=>mod(offset+360*t/PARAMS.huePeriod,360);
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

/* ---------- canvases (created lazily, cached per size) ---------- */
const mk=(w,h)=>{const d=root.document;if(!d||!d.createElement)return null;const c=d.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return c};
const baked=new Map();                                 // art id -> {canvas, id, ready}
let wash=null,edge=null,washKey='',still=null,stillKey='',washAt=-9,washHue=-1;
function bake(id){
 let e=baked.get(id);if(e)return e;
 e={canvas:null,iw:0,ih:0};baked.set(id,e);
 const A=root.MongyuArt,img=A?.image?.(id);if(!img){baked.delete(id);return null}
 if(!A.ready(id)){baked.delete(id);return null}
 const iw=img.naturalWidth,ih=img.naturalHeight,bw=320,bh=Math.round(bw*ih/iw),c=mk(bw,bh),x=c?.getContext?.('2d');
 if(!x){baked.delete(id);return null}
 x.drawImage(img,0,0,bw,bh);
 // Elliptical lane mask: the centre of the picture (where the runner and obstacles are) is transparent, the ornate frame stays.
 x.save();x.globalCompositeOperation='destination-in';x.translate(bw/2,bh/2);x.scale(bw/2,bh*.62);
 const g=x.createRadialGradient(0,0,0,0,0,1);
 g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(PARAMS.maskInner,'rgba(0,0,0,0)');g.addColorStop(PARAMS.maskOuter,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,1)');
 x.fillStyle=g;x.fillRect(-2,-2,4,4);x.restore();
 e.canvas=c;e.iw=bw;e.ih=bh;return e;
}
function ensureWash(W,H){
 const key=W+'x'+H;if(key===washKey&&wash)return;
 washKey=key;washAt=-9;washHue=-1;
 const w=64,h=Math.max(16,Math.round(64*H/W));wash=mk(w,h);edge=mk(w,h);
 const x=edge?.getContext?.('2d');if(!x||!wash)return;
 // Edge ramp: 0 in the middle, 1 at the border (rectangular distance, soft).
 try{
  const img=x.createImageData(w,h),d=img.data;
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
   const nx=Math.abs((i+.5)/w*2-1),ny=Math.abs((j+.5)/h*2-1),m=Math.max(nx,ny*.96),a=smooth(.6,1,m),o=(j*w+i)*4;
   d[o]=d[o+1]=d[o+2]=255;d[o+3]=Math.round(a*255);
  }
  x.putImageData(img,0,0);
 }catch(_){x.fillStyle='rgba(255,255,255,.6)';x.fillRect(0,0,w,h)}
}
/* The iridescent border colour field: a conic hue wheel that turns slowly, masked to the edge. Refreshed ~10x per second (it changes over tens of seconds). */
function refreshWash(t,hueOffset){
 if(!wash||!edge)return;
 const hue=hueAt(t,hueOffset);if(Math.abs(hue-washHue)<.4&&t-washAt<.5&&t>=washAt)return;
 washAt=t;washHue=hue;
 const x=wash.getContext('2d'),w=wash.width,h=wash.height;if(!x)return;
 x.globalCompositeOperation='source-over';x.clearRect(0,0,w,h);
 let g=null;
 try{if(x.createConicGradient){g=x.createConicGradient(hue*Math.PI/180,w/2,h/2);for(let i=0;i<=6;i++)g.addColorStop(i/6,'hsl('+(i*60)%360+',88%,58%)')}}catch(_){g=null}
 if(!g){g=x.createLinearGradient(0,0,w,h);for(let i=0;i<=4;i++)g.addColorStop(i/4,'hsl('+mod(hue+i*72,360).toFixed(0)+',88%,58%)')}
 x.fillStyle=g;x.fillRect(0,0,w,h);
 x.globalCompositeOperation='destination-in';x.drawImage(edge,0,0);x.globalCompositeOperation='source-over';
}
function ensureStill(W,H){
 const key=W+'x'+H;if(key===stillKey&&still)return;
 stillKey=key;ensureWash(W,H);still=mk(wash?.width||64,wash?.height||112);const x=still?.getContext?.('2d');if(!x||!wash)return;
 const w=still.width,h=still.height;
 const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'hsl(285,70%,60%)');g.addColorStop(.5,'hsl(190,70%,58%)');g.addColorStop(1,'hsl(330,70%,62%)');
 x.fillStyle=g;x.fillRect(0,0,w,h);x.globalCompositeOperation='destination-in';x.drawImage(edge,0,0);x.globalCompositeOperation='source-over';
}

/* ---------- mandala rosettes in the four corners (never the lane) ---------- */
function rosette(c,cx,cy,R,t,dir,level,hue,alpha,corner){
 const turn=dir*TAU*t/PARAMS.rotatePeriod,rings=PARAMS.rings;
 c.save();c.translate(cx,cy);c.rotate(turn);
 c.lineWidth=1.1;
 // six spokes always, six more (the 30 degree gaps) fade in with the combo
 for(let g=0;g<2;g++){
  const a=g===0?1:smooth(.12,.7,level);if(a<=.01)continue;
  c.strokeStyle='hsla('+mod(hue+g*38,360).toFixed(0)+',90%,72%,'+(alpha*a).toFixed(3)+')';
  c.beginPath();
  for(let i=0;i<6;i++){const ang=i*TAU/6+g*TAU/12;c.moveTo(Math.cos(ang)*R*.14,Math.sin(ang)*R*.14);c.lineTo(Math.cos(ang)*R,Math.sin(ang)*R)}
  c.stroke();
 }
 // rings with petal scallops; ring k appears once the combo level reaches it
 for(let k=0;k<rings;k++){
  const a=k===0?1:smooth((k-1)/3-.06,k/3,level);if(a<=.01)continue;
  const r=R*(.3+.7*k/(rings-1)),n=12;
  c.strokeStyle='hsla('+mod(hue+60+k*43,360).toFixed(0)+',90%,74%,'+(alpha*a*.9).toFixed(3)+')';
  c.beginPath();
  for(let i=0;i<n;i++){const a0=i*TAU/n,a1=(i+1)*TAU/n,am=(a0+a1)/2,bulge=r*.1;
   c.moveTo(Math.cos(a0)*r,Math.sin(a0)*r);c.quadraticCurveTo(Math.cos(am)*(r+bulge*(1+corner%2)),Math.sin(am)*(r+bulge*(1+corner%2)),Math.cos(a1)*r,Math.sin(a1)*r)}
  c.stroke();
 }
 c.restore();
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
/* Side bands wider than the picture (landscape) would show gaps: the mask is transparent there anyway, so nothing else is needed. */

function render(ctx,run,opts){
 if(!enabled||!ctx||!run)return false;
 const o=opts||{},vp=o.viewport||run.viewport||{width:390,height:844},W=vp.width||390,H=vp.height||844;
 const t0=nowMs();
 const reduced=o.reduced===true||(()=>{try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}})();
 const t=Number.isFinite(o.time)?o.time:(Number.isFinite(run.clock)?run.clock:0);
 const st=stateFor(run,t),dt=clamp(t-st.lastT,0,.1);st.lastT=t;
 const portal=run.portal||null;
 // Layer swap at the aurora gate: the new act's layer rises with the gate (the old one is in the cross-faded snapshot).
 const act=run.actIndex|0,variant=act&1,hueOff=act*53;
 if(st.act!==act){st.fadeAt=portal?0:t;st.act=act}
 let master=ease(clamp((t-st.start)/PARAMS.fadeIn,0,1));
 if(portal)master*=ease(clamp(portal.age/Math.max(.01,portal.duration),0,1));
 if(master<=.002)return true;

 if(reduced){
  ensureStill(W,H);
  if(still){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=PARAMS.reducedAlpha*master;ctx.drawImage(still,0,0,W,H);ctx.restore()}
  return finish(t0);
 }

 const streak=Number.isFinite(run.perfectStreak)?run.perfectStreak:(run.child?.perfectStreak|0);
 st.level=easeLevel(st.level,levelFor(streak),dt);
 const L=st.level,sat=.7+.3*L;                          // saturation and line density rise gradually with the combo
 const beat=60/Math.max(40,run.bpm||100),phase=mod(t/beat,1),pulse=1+.06*L*(.5-.5*Math.cos(TAU*phase));
 const breath=1+PARAMS.breathDepth*Math.sin(TAU*t/PARAMS.breathPeriod);
 ctx.save();
 // 1. course backdrop: soft-light then a faint screen glow, ornate frame only (the lane is masked)
 const id=backdropId(run),b=id?bake(id):null;
 if(b?.canvas){
  const p=placement(b.iw,b.ih,W,H,t,variant);
  ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=Math.min(.34,PARAMS.backdropSoft*breath*(.85+.35*L)*master);
  tileBackdrop(ctx,b.canvas,p,H,!!variant);
  ctx.globalCompositeOperation='screen';ctx.globalAlpha=PARAMS.backdropScreen*breath*sat*master;
  tileBackdrop(ctx,b.canvas,p,H,!!variant);
 }
 // 2. iridescent edge vignette (hue cycles over 48 s, thicker once the combo reaches x3)
 ensureWash(W,H);refreshWash(t,hueOff);
 if(wash){
  const boost=PARAMS.washBoost*L+PARAMS.washCombo*smooth(2.5,3.5,streak);
  ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=Math.min(.85,(PARAMS.washSoft+boost*1.5)*pulse*master);ctx.drawImage(wash,0,0,W,H);
  ctx.globalCompositeOperation='screen';ctx.globalAlpha=Math.min(.4,(PARAMS.washScreen+boost)*pulse*master);ctx.drawImage(wash,0,0,W,H);
 }
 // 3. mandala rosettes in the corners
 ctx.globalCompositeOperation='lighter';
 const R=Math.min(W,H)*.5,hue=hueAt(t,hueOff+20),ma=(PARAMS.mandalaAlpha+PARAMS.mandalaCombo*L)*master;
 const sgn=variant?-1:1;
 rosette(ctx,-W*.04,-H*.015,R,t,sgn,L,hue,ma,0);rosette(ctx,W*1.04,-H*.015,R,t,-sgn,L,hue+40,ma,1);
 rosette(ctx,-W*.04,H*1.015,R,t,-sgn,L,hue+80,ma,2);rosette(ctx,W*1.04,H*1.015,R,t,sgn,L,hue+120,ma,3);
 // 4. beat ripples: thin expanding ellipses born on the beat
 const rs=ripples(t,run.bpm||100,L,tmp),cx=W/2,cy=H*.6,maxR=Math.hypot(W,H)*.52;
 for(let i=0;i<rs.length;i++){
  const r=rs[i],rad=maxR*r.r;if(rad<4)continue;
  ctx.globalAlpha=r.alpha*master;ctx.lineWidth=1.5+2.5*r.u;
  ctx.strokeStyle='hsl('+mod(hue+r.k*29,360).toFixed(0)+',85%,72%)';
  ctx.beginPath();ctx.ellipse(cx,cy,rad,rad*.72,0,0,TAU);ctx.stroke();
 }
 ctx.restore();
 return finish(t0);
}
let warned=false;
function draw(ctx,run,opts){
 try{return render(ctx,run,opts)}catch(e){try{ctx.restore?.()}catch(_){}if(!warned){warned=true;try{root.console?.error?.('[MongyuPsy] draw failed',e)}catch(_){}}return false}
}
function finish(t0){const ms=nowMs()-t0;S.lastMs=ms;S.frames++;S.sumMs+=ms;if(ms>S.maxMs)S.maxMs=ms;if(ms>PARAMS.budgetMs)S.over++;return true}
/* Bake the backdrops ahead of the first run (called when the road screen opens) so the first frame of a course has no hitch. */
function warm(ids){
 const A=root.MongyuArt;if(!enabled||!A)return 0;
 const list=(ids||['course-c1','course-c2','course-c3','course-c4','course-c5']).filter(id=>A.has?.(id));
 let n=0;for(const id of list)if(bake(id))n++;
 if(n<list.length&&A.preload){try{A.preload(list).then(()=>{for(const id of list)bake(id)})}catch(_){}}
 return n;
}
function stats(){return {frames:S.frames,lastMs:S.lastMs,maxMs:S.maxMs,avgMs:S.frames?S.sumMs/S.frames:0,overBudget:S.over,level:S.level}}
function resetStats(){S.over=0;S.frames=0;S.sumMs=0;S.maxMs=0;S.lastMs=0}
function reset(){S.run=null;S.level=0;baked.clear();wash=edge=still=null;washKey=stillKey=''}

const api=Object.freeze({enabled,PARAMS,draw,warm,levelFor,easeLevel,hueAt,ripples,placement,backdropId,stats,resetStats,reset,get level(){return S.level}});
root.MongyuPsy=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
