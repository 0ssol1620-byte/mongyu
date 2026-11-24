/* R104 character art: hooded dreamer sprite with full pose set. Owned by workstream D.
 * Presentation only: never writes the actor, run state or RNG. Local space matches the
 * legacy sprite: feet at y=0, facing +x, 43.5 units tall before the caller's bodyHeight.
 */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const TAU=Math.PI*2,clamp=(x,a,b)=>x<a?a:x>b?b:x,lerp=(a,b,u)=>a+(b-a)*u;
const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x)};
const POSES=new Set(['stand','run','jump','land','wall','hurt','joy','sleep']);

/* ---------- colour ---------- */
function rgb(h){const m=/^#?([0-9a-f]{6})/i.exec(typeof h==='string'?h:'');if(!m)return [24,18,29];const n=parseInt(m[1],16);return [n>>16&255,n>>8&255,n&255]}
function mix(a,b,t){const x=rgb(a),y=rgb(b);let s='#';for(let i=0;i<3;i++)s+=Math.round(x[i]+(y[i]-x[i])*t).toString(16).padStart(2,'0');return s}
function lum(h){const v=rgb(h).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*v[0]+.7152*v[1]+.0722*v[2]}
const NIGHT='#241a40';
// The two starter looks are near-black / near-white silhouettes in the legacy
// sprite; the polish child gets a signature palette for them instead.
const SIGNATURE={moon:{hood:'#5a60b6',pj:'#eeeafb',cape:'#93a3ff',accent:'#ffe3a0'},ink:{hood:'#eadfc0',pj:'#fffaf0',cape:'#a9b6ff',accent:'#ffe3a0'}};
const palettes=new Map();
function palette(style,ink,onDark){
 const id=style&&typeof style.id==='string'?style.id:'moon',dark=!!onDark||(typeof ink==='string'&&lum(ink)>.45),inkDark=typeof ink==='string'&&lum(ink)<.12;
 const key=id+'|'+(style?.body||'')+'|'+(style?.accent||'')+'|'+(inkDark?ink:'')+'|'+(dark?1:0);let p=palettes.get(key);if(p)return p;
 if(palettes.size>96)palettes.clear();
 const sig=SIGNATURE[id],body=style?.body||'#18121d',accent=style?.accent||body;
 const hood=sig?sig.hood:mix(body,'#3a2d5c',.16),pj=sig?sig.pj:mix(body,'#fffaf0',.58),cape=sig?sig.cape:accent;
 const deep=mix(hood,'#0d0a1b',.8),trim=mix(pj,'#fff6e2',.62);
 p={key,id,detail:style?.detail||'plain',accent:sig?sig.accent:accent,
  hood,hoodHi:mix(hood,'#ffffff',.3),hoodShade:mix(hood,NIGHT,.4),
  pj,pjHi:mix(pj,'#ffffff',.55),pjShade:mix(pj,'#5f4f8c',.32),farPj:mix(pj,'#4a3d73',.42),
  cape,capeHi:mix(cape,'#ffffff',.42),capeShade:mix(cape,NIGHT,.42),
  trim,trimShade:mix(trim,'#6f5f98',.36),outline:inkDark?mix(ink,deep,.35):deep,
  rim:dark?'#ffeccc':'#ffffff',rimAlpha:dark?.75:.4,skin:'#ffe2d1',skinShade:'#f1bba9',blush:'#ff9ab3',eye:'#291f43',hair:'#80596d',mouth:'#a2425c'};
 palettes.set(key,p);return p;
}
const ELDER=Object.freeze({jacket:'#efe6f4',jacketShade:'#b9abd0',skirt:'#4b5193',skirtHi:'#6c74b8',skirtShade:'#2f3266',ribbon:'#b78cdf',hair:'#e4dfee',hairShade:'#a9a1c2',shoe:'#fbf6ee',lantern:'#5577d8',lanternLow:'#c75f80',glow:'#ffe3a6'});
const WOMAN=Object.freeze({coat:'#f1dbe8',coatHi:'#fff3f8',coatShade:'#c6a3c2',legs:'#3f3560',shoe:'#5d4b7f',hair:'#3b2a4d',hairHi:'#6a5284'});

/* ---------- proportions (local units, sole at y=0) ---------- */
const RIGS={
 child:{id:'child',s:1,pelvis:12.4,ankle:1.4,thigh:5.6,shin:5.7,legW:3.4,shoulder:[.4,-8.2],armU:4.2,armF:4,armW:2.8,hand:1.5,head:[1.6,-19.6],capeSeg:2.5,capeW:1,shadow:8.5},
 woman:{id:'woman',s:1.3,pelvis:16,ankle:1.3,thigh:7.4,shin:7.5,legW:2.5,shoulder:[.5,-11.8],armU:5.6,armF:5.2,armW:2.1,hand:1.25,head:[2,-21.2],capeSeg:2.1,capeW:.7,shadow:8},
 elder:{id:'elder',s:1.2,pelvis:14.6,ankle:1.3,thigh:6.8,shin:6.9,legW:2.6,shoulder:[.3,-12],armU:5.4,armF:5,armW:2.3,hand:1.3,head:[2.6,-18.4],capeSeg:1.6,capeW:.55,shadow:9.5}
};

/* ---------- pose solver ---------- */
// Eight run keys per leg (contact, load, pass, push, toe-off, recoil, swing, reach): x, y, foot angle.
const LEG=[[6,0,-.3],[3.2,0,0],[0,0,0],[-3.6,0,.35],[-6.4,-1.8,.75],[-4.8,-6,.55],[.6,-7,.1],[5.2,-3.4,-.35]];
const PELVIS=[[1.6],[2],[1],[.5]];// per half cycle, added to the standing pelvis
function cyc(keys,u,j){const n=keys.length,f=(((u%1)+1)%1)*n,i=Math.floor(f)%n,s=f-Math.floor(f);const p0=keys[(i+n-1)%n][j],p1=keys[i][j],p2=keys[(i+1)%n][j],p3=keys[(i+2)%n][j];return .5*(2*p1+(-p0+p2)*s+(2*p0-5*p1+4*p2-p3)*s*s+(-p0+3*p1-3*p2+p3)*s*s*s)}
const JT=[0,.25,.55,.85,1];
function seg(vals,u){let i=0;while(i<3&&u>JT[i+1])i++;return lerp(vals[i],vals[i+1],ease((u-JT[i])/(JT[i+1]-JT[i])))}
const J={nx:[4,4.2,3.2,3.6,3],ny:[-2.5,-6.8,-7.6,-2.8,-.6],fx:[-5,-3.6,-1.6,-2.6,-2.2],fy:[-1.2,-3.8,-6.4,-2,-.5],py:[0,-.4,-.6,-.4,0],lean:[.2,.06,.02,.08,.12],an:[-.7,2,1.7,1.4,.8],af:[.9,2.1,-1.8,-2,-.7],ab:[1.2,.35,.5,.7,1],sy:[1.07,1.04,1,.97,1],cape:[1,.85,.35,-.35,-.1],tail:[.8,.7,.3,-.3,-.1]};
const S={name:'run',ox:0,oy:0,rot:0,sx:1,sy:1,px:0,py:0,lean:0,breath:0,tilt:0,flip:false,eyes:'open',mouth:'',
 capeA:1.3,capeAmp:0,capeW:0,capeLen:1,tail:.9,feet:[[0,0,0],[0,0,0]],arms:[[0,0],[0,0]],ground:0,phase:0,land:0,wall:0,swing:0,stand:false};
function poseOf(q){
 const p=q&&q.pose;if(!q)return 'stand';
 if(p){if(p==='raise-arms')return 'joy';if(p==='open-arms')return 'open';return POSES.has(p)?p:'stand'}
 const ns=q.nativeState;
 if(q.deathProgress>0||ns===13||ns===16)return 'hurt';
 if(ns===12||q.turning||q.climbing)return 'wall';
 if(ns===11)return 'float';
 if((q.height||0)>.05)return 'jump';
 if(ns===14)return 'stand';
 return 'run';
}
// Small per-character memory for secondary motion (landing squash, corner lean,
// cape lag). Keyed by the presentation clock, so pause freezes it; never used
// when reduced motion is on, which keeps reduced frames time-independent.
const tracks=new Map();
function track(id,t,name,angle){
 if(!Number.isFinite(t))return null;let s=tracks.get(id);
 if(!s){s={t,dt:0,air:false,landAt:-9,angle:NaN,turn:0,pose:name,poseAt:t,cape:NaN,tail:NaN};tracks.set(id,s)}
 let dt=t-s.t;if(dt<0||dt>.5){s.landAt=-9;s.turn=0;s.angle=NaN;s.cape=NaN;s.tail=NaN;s.pose=name;s.poseAt=t;dt=0}
 s.t=t;s.dt=dt;
 if(s.pose!==name){s.pose=name;s.poseAt=t}
 const air=name==='jump';if(s.air&&!air&&dt>0)s.landAt=t;s.air=air;
 if(name==='run'&&Number.isFinite(angle)){
  if(Number.isFinite(s.angle)&&dt>0){const d=Math.atan2(Math.sin(angle-s.angle),Math.cos(angle-s.angle));const w=Math.abs(d)<1?Math.abs(d)/dt:0;s.turn+=(w-s.turn)*Math.min(1,dt*7)}
  s.angle=angle;
 }else{s.angle=NaN;if(dt>0)s.turn*=Math.max(0,1-dt*8)}
 return s;
}
function setFoot(f,x,y,a){f[0]=x;f[1]=y;f[2]=a}
function solve(q,fx,reduced,id,t,R,angle){
 const name=poseOf(q),st=reduced||q.pose==='stand'?null:track(id,t,name,angle),k=R.s,stand0=-R.pelvis;
 S.name=name;S.ox=0;S.oy=0;S.rot=0;S.sx=1;S.sy=1;S.px=0;S.py=stand0;S.lean=0;S.breath=0;S.tilt=0;S.flip=false;S.eyes='open';S.mouth='';
 S.capeAmp=0;S.capeW=0;S.capeLen=1;S.phase=0;S.land=0;S.wall=0;S.swing=0;S.stand=false;
 const [near,far]=S.feet,[an,af]=S.arms;
 const blink=!reduced&&(t%3.9)>3.77;
 if(name==='run'||name==='wall'){
  const phase=reduced&&!Number.isFinite(q.strideDistance)?0:Number.isFinite(q.strideDistance)?q.strideDistance/(34*((q.bodyHeight||60)/43.5)):t*3.2;
  const u=((phase%1)+1)%1;S.phase=u;
  setFoot(near,cyc(LEG,u,0)*k,Math.min(0,cyc(LEG,u,1))*k,cyc(LEG,u,2));
  setFoot(far,cyc(LEG,u+.5,0)*k,Math.min(0,cyc(LEG,u+.5,1))*k,cyc(LEG,u+.5,2));
  const dy=cyc(PELVIS,u*2,0)*k;S.px=.8*k;S.py=stand0+dy;S.lean=.16+.03*Math.sin(u*TAU*2);S.oy=0;
  const sw=Math.cos(u*TAU);S.swing=sw;an[0]=-.95*sw;an[1]=1.45+.25*Math.max(0,sw);af[0]=.95*sw;af[1]=1.45+.25*Math.max(0,-sw);
  S.capeA=.3+.09*Math.sin(u*TAU*2);S.capeAmp=reduced?.05:.32;S.capeW=phase*TAU*1.5;S.tail=.28+.12*Math.sin(u*TAU*2+1);S.tilt=-.04*Math.sin(u*TAU*2);
  if(blink)S.eyes='closed';
 }else if(name==='jump'){
  const u=clamp(Number.isFinite(q.jumpProgress)?q.jumpProgress:.5,0,1);
  setFoot(near,seg(J.nx,u)*k,seg(J.ny,u)*k,.12);setFoot(far,seg(J.fx,u)*k,seg(J.fy,u)*k,.25);
  const kick=clamp((q.kick||0)*2,0,1)*Math.sin(Math.PI*clamp(u/.7,0,1));if(kick){near[0]+=5*kick*k;near[1]-=2.5*kick*k;near[2]=-.5*kick}
  S.px=.4*k;S.py=stand0+seg(J.py,u)*k;S.lean=seg(J.lean,u);an[0]=seg(J.an,u);af[0]=seg(J.af,u);an[1]=af[1]=seg(J.ab,u);
  S.sy=reduced?1:seg(J.sy,u);S.sx=1/Math.sqrt(S.sy);S.capeA=seg(J.cape,u);S.capeAmp=reduced?.05:.22;S.capeW=t*9;S.tail=seg(J.tail,u);
 }else if(name==='hurt'){
  let p=.18;
  if(!reduced){
   if(q.nativeState===13||q.nativeState===16)p=clamp((q.poseFrame??q.nativeFrame??0)/14,0,1);
   else if(q.deathProgress>0)p=.25+.75*clamp(q.deathProgress,0,1);
   else if(Number.isFinite(q.poseAt)&&t>=q.poseAt)p=clamp((t-q.poseAt)/.85,0,1);
   else if(st)p=clamp((t-st.poseAt)/.85,0,1);
  }
  S.rot=-TAU*ease((p-.04)/.6);S.oy=-Math.sin(Math.PI*clamp(p/.64,0,1))*9*k;S.ox=-8*ease(p/.75)*k;
  const v=ease((p-.62)/.22);
  setFoot(near,lerp(3.4,7.4,v)*k,lerp(-5.6,0,v)*k,lerp(.4,-.6,v));setFoot(far,lerp(-1,5.4,v)*k,lerp(-5,0,v)*k,lerp(.4,-.5,v));
  S.py=lerp(stand0+1,-4.6*k,v);S.lean=lerp(.1,-.26,v);
  const flail=reduced?0:Math.sin(t*19)*.25*(1-v);an[0]=lerp(2+flail,-.55,v);an[1]=lerp(.3,.25,v);af[0]=lerp(-2.6-flail,-.8,v);af[1]=lerp(-.3,.2,v);
  S.capeA=lerp(-.6,1.25,v);S.capeAmp=reduced?0:.35*(1-v)+.05;S.capeW=t*11;S.tail=lerp(-.4,1,v);S.tilt=reduced?0:Math.sin(t*5.5)*.12*v;
  S.eyes='hurt';S.mouth='o';
 }else{
  // stand, joy, open, float
  S.stand=true;setFoot(near,2.4*k,0,0);setFoot(far,-2.2*k,0,0);S.py=stand0+.3;S.lean=.02;
  an[0]=.22;an[1]=.35;af[0]=-.12;af[1]=.3;
  const breath=reduced?0:Math.sin(t*2.5);S.breath=breath;
  S.capeA=1.32+(reduced?0:.06*Math.sin(t*1.6));S.capeAmp=reduced?0:.06;S.capeW=t*2;S.tail=.95+(reduced?0:.06*Math.sin(t*1.3));
  if(blink)S.eyes='closed';
  if(q.pose==='turn-head')S.flip=reduced||Math.sin(t*2.4)<-.25;
  if(name==='joy'){
   const hop=reduced?0:Math.abs(Math.sin(t*6.2))*2.8*k;S.oy=-hop;near[1]=-hop*.35;far[1]=-hop*.5;
   an[0]=1.75;an[1]=.85;af[0]=-2.7;af[1]=-.3;S.tilt=-.1;S.eyes='happy';S.mouth='smile';S.capeA=.75-hop*.08;S.capeAmp=reduced?0:.18;S.capeW=t*7;S.tail=.5;
  }else if(name==='open'){
   const w=reduced?0:Math.sin(t*3)*.2;an[0]=1.4+w;an[1]=.15;af[0]=-1.4-w;af[1]=-.15;S.mouth='smile';
  }else if(name==='float'){
   setFoot(near,1.8*k,-1*k,.5);setFoot(far,-2.4*k,-2.2*k,.6);an[0]=1.9;an[1]=.3;af[0]=-1.9;af[1]=-.3;S.lean=0;
   S.capeA=-.3;S.capeAmp=reduced?0:.25;S.capeW=t*3;S.tail=-.2;S.eyes='closed';
  }
 }
 // Overlays: landing squash and surface-change lean.
 let land=name==='land'?(Number.isFinite(q.landProgress)?1-clamp(q.landProgress,0,1):st?clamp(1-(t-st.poseAt)/.22,0,1):.7):0;
 if(name==='run'&&st&&st.landAt>-9)land=Math.max(land,clamp(1-(t-st.landAt)/.2,0,1));
 if(reduced&&name!=='land')land=0;
 if(land>0){
  const L=Math.sin(Math.PI*.5*land);S.land=L;S.py+=2.6*L*k;S.sx=1+.14*L;S.sy=1-.17*L;near[0]=lerp(near[0],3.8*k,L);far[0]=lerp(far[0],-3.2*k,L);near[1]=lerp(near[1],0,L);far[1]=lerp(far[1],0,L);
  an[0]=lerp(an[0],1.2,L);af[0]=lerp(af[0],-1.25,L);S.capeA+=.55*L;
 }
 let wall=0;
 if(name==='wall')wall=q.nativeState===12?Math.sin(Math.PI*clamp((q.poseFrame??q.nativeFrame??0)/6,0,1)):q.turning?Math.sin(Math.PI*clamp(q.turnProgress||0,0,1)):q.climbing?.8:q.pose==='wall'?.85:0;
 else if(name==='run'&&st)wall=clamp((st.turn-.7)/1.5,0,1);
 if(wall>0){
  S.wall=wall;S.lean+=.38*wall;S.py+=.9*wall*k;
  setFoot(near,lerp(near[0],6.6*k,wall),lerp(near[1],-7.4*k,wall),lerp(near[2],-.45,wall));setFoot(far,lerp(far[0],-5.4*k,wall),lerp(far[1],0,wall),lerp(far[2],.55,wall));
  an[0]=lerp(an[0],-.9,wall);an[1]=lerp(an[1],1,wall);af[0]=lerp(af[0],1.7,wall);af[1]=lerp(af[1],.4,wall);S.tilt-=.18*wall;S.capeA-=.45*wall;S.capeAmp+=reduced?0:.1*wall;
 }
 if(!reduced&&S.stand){S.py-=.2*S.breath}
 // Cape and cap lag behind the pose target like a damped spring.
 if(st&&st.dt>0){const a=1-Math.exp(-st.dt*9);st.cape=Number.isFinite(st.cape)?st.cape+(S.capeA-st.cape)*a:S.capeA;st.tail=Number.isFinite(st.tail)?st.tail+(S.tail-st.tail)*a*.8:S.tail;S.capeA=st.cape;S.tail=st.tail}
 else if(st&&Number.isFinite(st.cape)){S.capeA=st.cape;S.tail=st.tail}
 S.ground=Math.max(0,q.height||0)/((q.bodyHeight||60)/43.5)+(Number.isFinite(q.strideDistance)&&q.nativeState===0?1.5:0);
 return S;
}

/* ---------- caches and primitives ---------- */
const grads=new WeakMap();
function gradientsFor(c,p,R){
 let m=grads.get(c);if(!m){m=new Map();grads.set(c,m)}const key=p.key+R.id;let g=m.get(key);if(g)return g;if(m.size>64)m.clear();
 const lg=(x0,y0,x1,y1,stops)=>{const v=c.createLinearGradient(x0,y0,x1,y1);for(const [o,col]of stops)v.addColorStop(o,col);return v};
 const rg=(x,y,r0,r1,stops)=>{const v=c.createRadialGradient(x,y,r0,x,y,r1);for(const [o,col]of stops)v.addColorStop(o,col);return v};
 g={torso:lg(0,-11,0,3,[[0,p.pjHi],[.45,p.pj],[1,p.pjShade]]),hood:rg(-3,-5,.5,13,[[0,p.hoodHi],[.5,p.hood],[1,p.hoodShade]]),
  cape:lg(0,-12,-14,6,[[0,p.cape],[1,p.capeShade]]),shadow:rg(0,0,0,1,[[0,'rgba(10,6,26,.42)'],[.6,'rgba(10,6,26,.18)'],[1,'rgba(10,6,26,0)']]),
  glow:rg(0,0,0,9,[[0,'rgba(255,227,166,.6)'],[1,'rgba(255,227,166,0)']]),
  coat:lg(0,-13,0,6,[[0,WOMAN.coatHi],[.5,WOMAN.coat],[1,WOMAN.coatShade]]),skirt:lg(-8,0,8,0,[[0,ELDER.skirtShade],[.55,ELDER.skirt],[1,ELDER.skirtHi]]),
  jacket:lg(0,-13,0,-6,[[0,'#ffffff'],[1,ELDER.jacket]])};
 m.set(key,g);return g;
}
const K=[0,0],E=[0,0],W=[0,0];
function ik(ax,ay,bx,by,l1,l2,bend){
 const dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy)||1e-6,dd=clamp(d,Math.abs(l1-l2)+1e-3,l1+l2-1e-3),ux=dx/d,uy=dy/d;
 const a=(l1*l1-l2*l2+dd*dd)/(2*dd),h=Math.sqrt(Math.max(0,l1*l1-a*a));
 K[0]=ax+ux*a-uy*h*bend;K[1]=ay+uy*a+ux*h*bend;E[0]=ax+ux*dd;E[1]=ay+uy*dd;
}
function ellPath(c,x,y,rx,ry,r=0){c.moveTo(x+rx*Math.cos(r),y+rx*Math.sin(r));c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),r,0,TAU)}
function blob(c,x,y,rx,ry,fill,out,ow,r=0){c.beginPath();ellPath(c,x,y,rx,ry,r);c.fillStyle=fill;c.fill();if(out){c.lineWidth=ow;c.strokeStyle=out;c.stroke()}}
function stroke2(c,w,fill,out,ow){c.lineCap='round';c.lineJoin='round';c.strokeStyle=out;c.lineWidth=w+ow;c.stroke();c.strokeStyle=fill;c.lineWidth=w;c.stroke()}
// Rim light: the shape minus itself shifted down-front leaves a crescent on the
// upper-back edge, as if lit by the moon behind the runner.
function rim(c,path,p,dx,dy,scale=1){c.save();c.beginPath();path(c,0,0);c.clip();c.beginPath();path(c,0,0);path(c,dx,dy);c.globalAlpha*=p.rimAlpha*scale;c.fillStyle=p.rim;c.fill('evenodd');c.restore()}
function leg(c,hx,hy,f,R,fill,shoe,out,ow){
 ik(hx,hy,f[0],f[1]-R.ankle,R.thigh,R.shin,-1);
 c.beginPath();c.moveTo(hx,hy);c.lineTo(K[0],K[1]);c.lineTo(E[0],E[1]);stroke2(c,R.legW,fill,out,ow);
 blob(c,E[0]+.75*R.s,E[1]+.2*R.s,2.45*R.s,1.45*R.s,shoe,out,ow*.9,f[2]);
}
function arm(c,sx,sy,a1,b,R,fill,skin,out,ow){
 const ex=sx+R.armU*Math.sin(a1),ey=sy+R.armU*Math.cos(a1),wx=ex+R.armF*Math.sin(a1+b),wy=ey+R.armF*Math.cos(a1+b);
 c.beginPath();c.moveTo(sx,sy);c.lineTo(ex,ey);c.lineTo(wx,wy);stroke2(c,R.armW,fill,out,ow);
 blob(c,wx,wy,R.hand,R.hand,skin,out,ow*.8);W[0]=wx;W[1]=wy;
}
const PX=new Float64Array(8),PY=new Float64Array(8),LX=new Float64Array(8),LY=new Float64Array(8),RX=new Float64Array(8),RY=new Float64Array(8);
const CAPE_W=[1.5,2.3,2.75,2.85,2.6,2,1],HAIR_W=[2.6,3,2.9,2.5,1.9,1.2,.6];
// A chain of segments that trails from the anchor; angle 0 = straight back, PI/2 = hanging.
function chain(c,ax,ay,base,amp,wave,len,widths,n=6){
 PX[0]=ax;PY[0]=ay;let a=base;
 for(let i=1;i<=n;i++){a=base+amp*Math.sin(wave-i*.9)*(i/n)+(base<1.1?.05*i:0);PX[i]=PX[i-1]-Math.cos(a)*len;PY[i]=PY[i-1]+Math.sin(a)*len}
 for(let i=0;i<=n;i++){const j=i<n?i:i-1,dx=PX[j+1]-PX[j],dy=PY[j+1]-PY[j],l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l,w=widths[i];LX[i]=PX[i]+nx*w;LY[i]=PY[i]+ny*w;RX[i]=PX[i]-nx*w;RY[i]=PY[i]-ny*w}
 const tx=PX[n]+(PX[n]-PX[n-1])*.45,ty=PY[n]+(PY[n]-PY[n-1])*.45;
 c.beginPath();c.moveTo(LX[0],LY[0]);
 for(let i=1;i<n;i++)c.quadraticCurveTo(LX[i],LY[i],(LX[i]+LX[i+1])/2,(LY[i]+LY[i+1])/2);
 c.quadraticCurveTo(LX[n],LY[n],tx,ty);c.quadraticCurveTo(RX[n],RY[n],(RX[n]+RX[n-1])/2,(RY[n]+RY[n-1])/2);
 for(let i=n-1;i>0;i--)c.quadraticCurveTo(RX[i],RY[i],(RX[i]+RX[i-1])/2,(RY[i]+RY[i-1])/2);
 c.lineTo(RX[0],RY[0]);c.closePath();
}
function edge(c,X,Y,from,to,color,w,alpha=1){c.beginPath();c.moveTo(X[from],Y[from]);for(let i=from+1;i<=to;i++)c.lineTo(X[i],Y[i]);c.save();c.globalAlpha*=alpha;c.lineCap='round';c.lineJoin='round';c.strokeStyle=color;c.lineWidth=w;c.stroke();c.restore()}
function star(c,x,y,r,fill){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;i?c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath();c.fillStyle=fill;c.fill()}

/* ---------- shared parts ---------- */
function shadow(c,S,R,g,reduced){
 const h=S.ground+Math.max(0,-S.oy);if(h>70)return;const k=1/(1+h/20);
 c.save();c.translate(S.ox*.5,S.ground);c.scale(R.shadow*k*(1+.12*S.land),R.shadow*k*.26);c.globalAlpha*=k;c.beginPath();c.arc(0,0,1,0,TAU);c.fillStyle=g.shadow;c.fill();c.restore();
}
function face(c,x,y,k,S,p,far=true){
 const ex=x+2.4*k,ey=y+.2*k,fx=x-1.6*k;c.lineCap='round';
 if(S.eyes==='open'){
  blob(c,ex,ey,.9*k,1.35*k,p.eye);if(far)blob(c,fx,ey-.05*k,.74*k,1.22*k,p.eye);
  blob(c,ex+.3*k,ey-.5*k,.36*k,.36*k,'#ffffff');if(far)blob(c,fx+.26*k,ey-.52*k,.28*k,.28*k,'#ffffff');
 }else{
  c.beginPath();
  for(const [cx,w] of far?[[ex,1],[fx,.82]]:[[ex,1]]){
   if(S.eyes==='happy'){c.moveTo(cx-.85*k*w,ey+.35*k);c.quadraticCurveTo(cx,ey-1.05*k,cx+.85*k*w,ey+.35*k)}
   else if(S.eyes==='hurt'){c.moveTo(cx-.75*k*w,ey-.8*k);c.lineTo(cx+.55*k*w,ey);c.lineTo(cx-.75*k*w,ey+.8*k)}
   else{c.moveTo(cx-.85*k*w,ey);c.quadraticCurveTo(cx,ey+.85*k,cx+.85*k*w,ey)}
  }
  c.strokeStyle=p.eye;c.lineWidth=.55*k;c.stroke();
 }
 c.save();c.globalAlpha*=.5;blob(c,ex+.9*k,ey+2.2*k,1.25*k,.7*k,p.blush);if(far)blob(c,fx-1.1*k,ey+2.2*k,.9*k,.62*k,p.blush);c.restore();
 if(S.mouth==='smile'){c.beginPath();c.moveTo(x+.6*k,y+3*k);c.quadraticCurveTo(x+1.4*k,y+4.6*k,x+2.3*k,y+2.9*k);c.closePath();c.fillStyle=p.mouth;c.fill()}
 else if(S.mouth==='o')blob(c,x+1.4*k,y+3.4*k,.5*k,.65*k,p.mouth);
}
// One continuous silhouette: a rounded hood whose crown runs into a long, floppy
// nightcap. The tip angle lags the body like the cape does.
let TX=0,TY=0;
function hoodPath(c,dx,dy){
 c.moveTo(5.4+dx,7+dy);c.quadraticCurveTo(-1.6+dx,10.4+dy,-7.4+dx,5.2+dy);c.quadraticCurveTo(-10.2+dx,.6+dy,-8+dx,-4.6+dy);
 c.quadraticCurveTo(-8.6+dx,-9.6+dy,TX+dx-1.2,TY+dy+.9);c.quadraticCurveTo(TX+dx,TY+dy-1.6,TX+dx+1.3,TY+dy-.6);
 c.quadraticCurveTo(-3.4+dx,-14.6+dy,1+dx,-9+dy);c.quadraticCurveTo(7.6+dx,-8+dy,8.6+dx,-1.4+dy);c.quadraticCurveTo(9+dx,4.4+dy,5.4+dx,7+dy);c.closePath();
}
function childHead(c,S,p,g,ow){
 const ta=S.tail;TX=-3.6-10.4*Math.cos(ta);TY=-9.4+10.4*Math.sin(ta);
 c.beginPath();hoodPath(c,0,0);c.fillStyle=g.hood;c.fill();c.lineWidth=ow;c.strokeStyle=p.outline;c.stroke();
 rim(c,hoodPath,p,.95,.85);
 // soft fold where the cap leaves the crown
 c.beginPath();c.moveTo(-6.4,-6.2);c.quadraticCurveTo(-3.6,-9.4,.2,-8.8);c.strokeStyle=p.hoodShade;c.lineWidth=.7;c.stroke();
 const d=p.detail,tx=TX,ty=TY;
 if(d==='star'){c.save();c.globalAlpha*=.35;blob(c,tx,ty,3.6,3.6,p.accent);c.restore();star(c,tx,ty,2.7,p.accent)}
 else{blob(c,tx,ty,2.2,2.2,d==='plain'||d==='scarf'?p.trim:p.accent,p.outline,ow*.9);blob(c,tx-.6,ty-.7,.8,.7,'#ffffff')}
 if(d==='leaf'){c.beginPath();c.moveTo(tx+1.4,ty-1.1);c.quadraticCurveTo(tx+3.8,ty-4.4,tx+5.6,ty-2.6);c.quadraticCurveTo(tx+3.6,ty-.4,tx+1.4,ty-1.1);c.fillStyle=p.accent;c.fill();c.lineWidth=ow*.8;c.strokeStyle=p.outline;c.stroke()}
 if(d==='comet'){c.save();for(let i=1;i<4;i++){c.globalAlpha*=.62;blob(c,tx-2.2*i,ty+.7*i,1.6-.3*i,1.25-.25*i,p.accent)}c.restore()}
 // face opening with a thin fleece trim
 blob(c,3,1.6,5.35,5.2,p.trim,p.outline,ow*.6);
 blob(c,3.1,1.7,4.7,4.6,p.skin);
 c.save();c.globalAlpha*=.35;blob(c,1.4,4.2,2.6,1.2,p.skinShade);c.restore();
 // two soft bang tufts, not a full fringe
 c.beginPath();c.moveTo(-.6,-1.6);c.quadraticCurveTo(2,-3.9,4.6,-2.6);c.quadraticCurveTo(3.4,-2.2,3,-1.1);c.quadraticCurveTo(2.1,-2,1.2,-1.2);c.quadraticCurveTo(.4,-1.9,-.6,-1.6);c.fillStyle=p.hair;c.fill();
 face(c,3,2,1,S,p);
}
function childTorsoPath(c,dx,dy){
 c.moveTo(-3.3+dx,-9.6+dy);c.quadraticCurveTo(.6+dx,-11.7+dy,4.2+dx,-9.4+dy);c.quadraticCurveTo(6.7+dx,-4.6+dy,6.5+dx,1.5+dy);
 c.quadraticCurveTo(.3+dx,3.5+dy,-5.9+dx,1.4+dy);c.quadraticCurveTo(-6.3+dx,-5+dy,-3.3+dx,-9.6+dy);c.closePath();
}
function capeAt(c,S,p,g,R,ax,ay,ow,len=1,width=1){
 const n=6;chain(c,ax,ay,S.capeA-S.lean,S.capeAmp,S.capeW,R.capeSeg*S.capeLen*len,scaled(CAPE_W,R.capeW*width),n);
 c.fillStyle=p.cape;c.fill();c.lineWidth=ow;c.strokeStyle=p.outline;c.stroke();
 edge(c,RX,RY,1,n-1,p.capeShade,1.1,.8);edge(c,LX,LY,1,n-1,p.capeHi,.6,.9);
 if(p.detail==='scarf'){for(const i of [2,4]){c.beginPath();c.moveTo(LX[i],LY[i]);c.lineTo(RX[i],RY[i]);c.strokeStyle=p.trim;c.lineWidth=.9;c.stroke()}}
 if(p.detail==='comet'){c.save();for(let i=1;i<4;i++){c.globalAlpha*=.6;blob(c,PX[n]-(PX[n-1]-PX[n])*i*.7,PY[n]-(PY[n-1]-PY[n])*i*.7,1-.2*i,1-.2*i,p.accent)}c.restore()}
}
const WBUF=new Float64Array(7);
function scaled(src,k){for(let i=0;i<7;i++)WBUF[i]=src[i]*k;return WBUF}

/* ---------- characters ---------- */
// Cheongsachorong: blue over red silk, a warm candle and a cached glow.
function lantern(c,x,y,rot,p,g,ow){
 const P=ELDER;c.save();c.translate(x,y);c.rotate(rot);
 c.beginPath();c.moveTo(0,0);c.lineTo(0,3);c.strokeStyle=p.outline;c.lineWidth=.6;c.stroke();
 c.translate(0,6.4);c.fillStyle=g.glow;c.fillRect(-9,-9,18,18);
 c.beginPath();c.moveTo(-2.2,-3);c.lineTo(2.2,-3);c.quadraticCurveTo(3.2,0,2.2,3);c.lineTo(-2.2,3);c.quadraticCurveTo(-3.2,0,-2.2,-3);c.closePath();c.fillStyle=P.lanternLow;c.fill();
 c.save();c.clip();c.fillStyle=P.lantern;c.fillRect(-4,-4,8,4);c.restore();c.lineWidth=ow*.8;c.strokeStyle=p.outline;c.stroke();
 blob(c,0,.6,1.1,1.5,'#fff1c4');c.fillStyle=p.outline;c.fillRect(-1.8,-3.8,3.6,.9);c.fillRect(-1.4,3,2.8,.8);c.restore();
}
function drawChild(c,S,p,g,R,ow,reduced){
 const [near,far]=S.feet,[an,af]=S.arms,sh=R.shoulder,hd=R.head;
 const torsoT=()=>{c.translate(S.px,S.py);c.rotate(S.lean);if(S.breath)c.scale(1,1+.016*S.breath)};
 // far arm and leg sit in shade behind the body
 c.save();torsoT();arm(c,sh[0]-1,sh[1]-.2,af[0],af[1],R,p.farPj,p.skinShade,p.outline,ow);c.restore();
 leg(c,S.px-.7,S.py,far,R,p.farPj,p.trimShade,p.outline,ow);
 c.save();torsoT();capeAt(c,S,p,g,R,-2.2,-10.2,ow);c.restore();
 leg(c,S.px+.7,S.py,near,R,p.pj,p.trim,p.outline,ow);
 c.save();torsoT();
 c.beginPath();childTorsoPath(c,0,0);c.fillStyle=g.torso;c.fill();c.lineWidth=ow;c.strokeStyle=p.outline;c.stroke();
 rim(c,childTorsoPath,p,1.3,1.2,.8);
 // a little crescent-moon print on the pyjama top
 c.beginPath();c.arc(3.2,-4.4,1.5,0,TAU);c.moveTo(4.4,-5);c.arc(3.75,-4.85,1.3,0,TAU,true);c.fillStyle=p.cape;c.fill('evenodd');
 blob(c,-1.2,-2.2,.45,.45,p.capeHi);blob(c,.6,-7,.38,.38,p.capeHi);
 // collar knot with two short tails that answer the cape's motion
 const fl=reduced?0:Math.sin(S.capeW+1)*.5*S.capeAmp*3;
 c.beginPath();c.moveTo(2.6,-9.6);c.quadraticCurveTo(4.6+fl*.3,-7.6,4.1+fl,-5.6);c.lineTo(2.9+fl*.6,-6.4);c.quadraticCurveTo(2.6,-7.8,1.7,-9.1);c.closePath();c.fillStyle=p.capeShade;c.fill();c.lineWidth=ow*.8;c.strokeStyle=p.outline;c.stroke();
 blob(c,.8,-10.3,4.7,1.9,p.cape,p.outline,ow);blob(c,2.6,-9.9,1.25,1.15,p.capeHi,p.outline,ow*.7);
 c.save();c.translate(hd[0],hd[1]-(S.breath?.25*S.breath:0));c.rotate(S.tilt);if(S.flip)c.scale(-1,1);childHead(c,S,p,g,ow);c.restore();
 arm(c,sh[0],sh[1],an[0],an[1],R,p.pj,p.skin,p.outline,ow);
 c.restore();
}
function drawWoman(c,S,p,g,R,ow,reduced){
 const [near,far]=S.feet,[an,af]=S.arms,sh=R.shoulder,hd=R.head,P=WOMAN;
 const torsoT=()=>{c.translate(S.px,S.py);c.rotate(S.lean);if(S.breath)c.scale(1,1+.012*S.breath)};
 c.save();torsoT();arm(c,sh[0]-1,sh[1],af[0],af[1],R,P.coatShade,p.skinShade,p.outline,ow);c.restore();
 leg(c,S.px-.6,S.py,far,R,mix(P.legs,NIGHT,.3),P.shoe,p.outline,ow);
 // long hair streams back from the crown like a second cape
 c.save();torsoT();c.translate(hd[0],hd[1]);
 chain(c,-3.6,-3.2,S.capeA-S.lean+.25,S.capeAmp*.8,S.capeW+.6,2.4,HAIR_W,6);c.fillStyle=P.hair;c.fill();c.lineWidth=ow;c.strokeStyle=p.outline;c.stroke();edge(c,LX,LY,0,5,P.hairHi,.7,.8);
 c.restore();
 c.save();torsoT();capeAt(c,S,p,g,R,-1.6,-12.6,ow,.8,.9);c.restore();
 leg(c,S.px+.6,S.py,near,R,P.legs,P.shoe,p.outline,ow);
 c.save();torsoT();
 const coat=(c,dx,dy)=>{c.moveTo(-2.9+dx,-12.6+dy);c.quadraticCurveTo(.6+dx,-14+dy,3.6+dx,-12.4+dy);c.quadraticCurveTo(5+dx,-6+dy,7.2+dx,4.4+dy);c.quadraticCurveTo(.4+dx,6.4+dy,-6.6+dx,4.2+dy);c.quadraticCurveTo(-4.8+dx,-6+dy,-2.9+dx,-12.6+dy);c.closePath()};
 c.beginPath();coat(c,0,0);c.fillStyle=g.coat;c.fill();c.lineWidth=ow;c.strokeStyle=p.outline;c.stroke();rim(c,coat,p,1.2,1.2,.8);
 blob(c,.9,-12.6,4,1.7,p.cape,p.outline,ow);
 c.save();c.translate(hd[0],hd[1]);c.rotate(S.tilt);if(S.flip)c.scale(-1,1);
 blob(c,.4,0,6.2,6.3,p.skin,p.outline,ow);
 const hair=(c,dx,dy)=>{c.moveTo(-6.4+dx,1.6+dy);c.quadraticCurveTo(-7,-6.4+dy,-.6+dx,-6.8+dy);c.quadraticCurveTo(5.6+dx,-6.8+dy,6.6+dx,-1.2+dy);c.quadraticCurveTo(3.6+dx,-3.6+dy,1.2+dx,-2.4+dy);c.quadraticCurveTo(-1.6+dx,-1.6+dy,-2.6+dx,2.8+dy);c.closePath()};
 c.beginPath();hair(c,0,0);c.fillStyle=P.hair;c.fill();c.lineWidth=ow;c.strokeStyle=p.outline;c.stroke();rim(c,hair,p,.7,.6,.6);
 face(c,1.5,1.4,.85,S,p);
 c.restore();
 arm(c,sh[0],sh[1],an[0],an[1],R,P.coat,p.skin,p.outline,ow);
 c.restore();
}
function drawElder(c,S,p,g,R,ow,reduced,q,t){
 const [near,far]=S.feet,[an,af]=S.arms,sh=R.shoulder,hd=R.head,P=ELDER,lean=S.lean*.6+.14,alone=!!q.alone;
 for(const f of S.feet){f[0]*=.55;f[1]*=.6}
 const torsoT=()=>{c.translate(S.px,S.py);c.rotate(lean);if(S.breath)c.scale(1,1+.01*S.breath)};
 // Standing (story): the near hand holds the caller's stick and the lantern hangs
 // from the far hand. Moving: the far arm swings and the lantern leads in front.
 const standing=S.stand&&q.pose==='stand',swing=reduced?0:Math.sin((S.phase||0)*TAU+(S.stand?t*1.4:0))*.35-(S.stand?0:.2);
 c.save();torsoT();
 arm(c,sh[0]-1,sh[1],standing?-.25:af[0]*.6-.2,.5,R,P.jacketShade,p.skinShade,p.outline,ow);
 if(standing)lantern(c,W[0],W[1],swing-lean,p,g,ow);
 c.restore();
 // the child riding on her back (omitted when the caller asks for the elder alone)
 if(!alone){c.save();torsoT();c.translate(-4.2,-12.4);c.scale(.5,.5);capeAt(c,S,p,g,RIGS.child,-1,0,ow*2,1.1);c.restore()}
 // gomusin tips peek under the long skirt
 leg(c,S.px-.6,S.py,far,R,P.skirtShade,P.shoe,p.outline,ow);leg(c,S.px+.6,S.py,near,R,P.skirtShade,P.shoe,p.outline,ow);
 const sw=reduced?0:(S.stand?Math.sin(t*1.5)*.3:S.swing*1.1);
 const wx=S.px+Math.sin(lean)*9,wy=S.py-Math.cos(lean)*9;
 const skirt=(c,dx,dy)=>{c.moveTo(wx-3.6+dx,wy+dy);c.quadraticCurveTo(wx+1+dx,wy-1.4+dy,wx+4.2+dx,wy+.2+dy);c.quadraticCurveTo(S.px+7.4+sw+dx,-6+dy,S.px+7.6+sw+dx,-1.6+dy);c.quadraticCurveTo(S.px+.5+sw*.5+dx,.2+dy,S.px-7.8+sw+dx,-1.8+dy);c.quadraticCurveTo(S.px-7.4+sw+dx,-7+dy,wx-3.6+dx,wy+dy);c.closePath()};
 c.beginPath();skirt(c,0,0);c.fillStyle=g.skirt;c.fill();c.lineWidth=ow;c.strokeStyle=p.outline;c.stroke();rim(c,skirt,p,1.2,1.1,.6);
 c.beginPath();c.moveTo(wx+.6,wy+1);c.quadraticCurveTo(S.px+2+sw,-6,S.px+2.4+sw,-1);c.strokeStyle=P.skirtShade;c.lineWidth=.7;c.stroke();
 c.save();torsoT();
 const jacket=(c,dx,dy)=>{c.moveTo(-3.6+dx,-12.6+dy);c.quadraticCurveTo(.4+dx,-14+dy,3.8+dx,-12.6+dy);c.quadraticCurveTo(5.8+dx,-10+dy,5.6+dx,-7.4+dy);c.quadraticCurveTo(.6+dx,-6.2+dy,-4.8+dx,-7.2+dy);c.quadraticCurveTo(-5.4+dx,-10.6+dy,-3.6+dx,-12.6+dy);c.closePath()};
 c.beginPath();jacket(c,0,0);c.fillStyle=g.jacket;c.fill();c.lineWidth=ow;c.strokeStyle=p.outline;c.stroke();
 c.beginPath();c.moveTo(1.2,-12.8);c.lineTo(4.2,-9.6);c.strokeStyle=P.jacketShade;c.lineWidth=.8;c.stroke();
 const rib=reduced?0:Math.sin(S.capeW+.5)*.6;
 c.beginPath();c.moveTo(3.6,-9.4);c.quadraticCurveTo(5.2+rib,-7,4.6+rib*1.4,-4.4);c.lineTo(3.6+rib,-4.8);c.quadraticCurveTo(3.8,-7,3,-9.2);c.closePath();c.fillStyle=P.ribbon;c.fill();c.lineWidth=ow*.7;c.strokeStyle=p.outline;c.stroke();
 if(!alone){
  // rider's head peeks over her shoulder; its little arm hugs her neck
  c.save();c.translate(-4.6,-17.6);c.scale(.5,.5);c.rotate(-.1);
  const rs=S.eyes;if(S.name==='run')S.eyes='open';childHead(c,S,p,g,ow*2);S.eyes=rs;c.restore();
  c.beginPath();c.moveTo(-3.2,-12.6);c.quadraticCurveTo(-.6,-13.6,1.6,-12.2);stroke2(c,1.3,p.pj,p.outline,ow);blob(c,1.8,-12.2,.8,.8,p.skin,p.outline,ow*.7);
 }
 c.save();c.translate(hd[0],hd[1]);c.rotate(S.tilt+.05);if(S.flip)c.scale(-1,1);
 blob(c,-4.4,-3.6,2.6,2.4,P.hair,p.outline,ow);c.beginPath();c.moveTo(-7.8,-4.6);c.lineTo(-1.4,-2.6);c.strokeStyle='#e7c27c';c.lineWidth=.7;c.stroke();
 blob(c,.6,0,5.7,5.8,p.skin,p.outline,ow);
 const hair=(c,dx,dy)=>{c.moveTo(-5.4+dx,2.4+dy);c.quadraticCurveTo(-6.4+dx,-5.6+dy,.2+dx,-6+dy);c.quadraticCurveTo(5.4+dx,-6+dy,6+dx,-1.6+dy);c.quadraticCurveTo(2.6+dx,-3.6+dy,.2+dx,-3.2+dy);c.quadraticCurveTo(-2.2+dx,-2.4+dy,-2.6+dx,2.6+dy);c.closePath()};
 c.beginPath();hair(c,0,0);c.fillStyle=P.hair;c.fill();c.lineWidth=ow;c.strokeStyle=p.outline;c.stroke();rim(c,hair,p,1.1,1);
 const eyes=S.eyes;if(eyes==='open')S.eyes='closed';face(c,1.6,1.6,.8,S,p);S.eyes=eyes;
 c.restore();
 // near hand rests on the caller's walking stick when standing in a story scene
 if(standing){
  const tx=8.7-S.px,ty=-21.75-S.py,co=Math.cos(-lean),si=Math.sin(-lean),lx2=tx*co-ty*si,ly2=tx*si+ty*co;
  ik(sh[0],sh[1],lx2,ly2,R.armU,R.armF,1);c.beginPath();c.moveTo(sh[0],sh[1]);c.lineTo(K[0],K[1]);c.lineTo(E[0],E[1]);stroke2(c,R.armW,P.jacket,p.outline,ow);blob(c,E[0],E[1],R.hand,R.hand,p.skin,p.outline,ow*.8);
 }else{const a1=S.name==='run'||S.name==='wall'?.85+.25*S.swing:an[0]*.7;arm(c,sh[0],sh[1],a1,S.name==='run'||S.name==='wall'?.35:an[1],R,P.jacket,p.skin,p.outline,ow);lantern(c,W[0],W[1],swing-lean-(S.name==='run'?.25:0),p,g,ow)}
 c.restore();
}

/* ---------- R105 raster dreamer ---------- */
// The generated design (pose-*.webp, run-01..08.webp, 512px, transparent) replaces the vector child. The elder, the woman, the dog
// and the vector child itself (while images decode, or where no canvas exists) keep the code above.
const RUN_IDS=['run-01','run-02','run-03','run-04','run-05','run-06','run-07','run-08'];
const ART_IDS=['pose-stand','pose-run-a','pose-run-b','pose-jump','pose-land','pose-hurt','pose-joy','pose-sleep',...RUN_IDS];
// Anchor in the 512px source: [body centre x, sole line y]. All frames share one scale so the head keeps its size.
const META={'pose-stand':[288,484],'pose-run-a':[286,482],'pose-run-b':[288,483],'pose-jump':[269,478],'pose-land':[295,457],'pose-hurt':[250,450],'pose-joy':[266,483],'pose-sleep':[250,417]};
for(const id of RUN_IDS)META[id]=[287,503];
const REF_H=470,UNIT=43.5/REF_H;// local units per source pixel (the legacy child is 43.5 units tall)
const TIERS=[96,128,160,192,256,320,384,512];
const NECK=[235,200];// cape pivot in source pixels
const STRIPS=[235,190,145,100,55,0];
// Wardrobe: the hat, cape and slippers (the purple parts of the art) take this colour; null keeps the original art.
const TINT={moon:null,ink:'#d9d3f3',dew:'#58d1b4',peach:'#f08e86',lilac:'#d79af2',tide:'#4ea9e0',ember:'#f27a48',moss:'#8fba58',dusk:'#e08cb6',frost:'#8cd5f2',eclipse:'#f2b445',dawn:'#ffd36e'};
const TRIP_RIM={violet:'#7b3cff',aqua:'#19f0d0',ember:'#ff7a1a',toxic:'#b6ff2a',heart:'#ff3d7a'};
let currentTrip='violet',rasterOn=true,artRequested=false;
const base=new Map(),rimmed=new Map();// bucket key -> Map(frame|tier -> {cv,m})
const stats={builds:0,fallbacks:0};
function art(){return root.MongyuArt&&root.MongyuArt.enabled?root.MongyuArt:null}
function makeCanvas(w,h,read){
 let cv=null;
 if(root.document&&typeof root.document.createElement==='function')cv=root.document.createElement('canvas');
 else if(typeof root.OffscreenCanvas==='function')cv=new root.OffscreenCanvas(w,h);
 if(!cv)return null;cv.width=w;cv.height=h;
 const x=cv.getContext&&cv.getContext('2d',read?{willReadFrequently:true}:undefined);return x?{cv,x}:null;
}
function ensureArt(){const A=art();if(!A||artRequested)return;artRequested=true;try{A.preload(ART_IDS)}catch(_){}}
function artReady(){const A=art();return !!A&&ART_IDS.every(id=>A.ready(id))}
function whenReady(cb){const A=art();if(!A||typeof cb!=='function')return false;ensureArt();Promise.resolve(A.preload(ART_IDS)).then(()=>{try{cb()}catch(_){}});return true}
let pinned=null;
function setTrip(key){pinned=typeof key==='string'&&key?key:null}
// Best-effort chapter colour when the caller names none: the running course/act's `trip` option (set by CourseRun), probed twice a second.
let probeAt=-1e9;
function detectTrip(){
 if(pinned)return pinned;
 const now=typeof root.performance?.now==='function'?root.performance.now():0;
 if(now-probeAt<500)return currentTrip;probeAt=now;
 try{const r=root.MongyuPolish?.host?.activeRun?.();const k=r?.child?.trip||r?.acts?.[r.actIndex]?.opts?.trip||r?.trip||r?.options?.trip;currentTrip=typeof k==='string'&&k?k:'violet'}catch(_){}
 return currentTrip;
}
function rimColor(key){const T=root.MongyuTrip;return(T&&T.get&&T.get(key).rim)||TRIP_RIM[key]||TRIP_RIM.violet}
function tintHex(style){
 const id=style&&style.id;if(id&&Object.prototype.hasOwnProperty.call(TINT,id))return TINT[id];
 if(!style||typeof style.accent!=='string')return null;return mix(style.accent,'#ffffff',.08);
}
// Hue remap of the purple hat/cape/slippers only: skin, pyjamas, hair and the white pom-pom keep their colours.
function recolor(d,T){
 const tr=T?T[0]:0,tg=T?T[1]:0,tb=T?T[2]:0,YREF=105;
 for(let i=0;i<d.length;i+=4){
  const a=d[i+3];if(!a)continue;if(a<6){d[i+3]=0;continue}
  const r=d[i],b=d[i+2];let g=d[i+1];
  // the cut-out can leave a faint magenta cast on a soft edge: pull it back to a neutral lavender
  if(a<170&&r-g>45&&b-g>45){g=g+((Math.min(r,b)-g)*.8|0);d[i+1]=g}
  if(!T)continue;
  const mx=r>g?(r>b?r:b):(g>b?g:b),mn=r<g?(r<b?r:b):(g<b?g:b),df=mx-mn;if(df<26)continue;
  const sat=df/mx;if(sat<.16)continue;
  let h;if(mx===b)h=240+60*(r-g)/df;else if(mx===r)h=(60*(g-b)/df+360)%360;else h=120+60*(b-r)/df;
  const wh=Math.min(1,Math.max(0,(h-170)/22))*Math.min(1,Math.max(0,(308-h)/14));if(wh<=0)continue;
  const w=wh*Math.min(1,(sat-.16)/.2);if(w<=.01)continue;
  const ratio=(.299*r+.587*g+.114*b)/YREF;let nr,ng,nb;
  if(ratio<=1){nr=tr*ratio;ng=tg*ratio;nb=tb*ratio}else{const k=Math.min(1,(ratio-1)*.8);nr=tr+(255-tr)*k;ng=tg+(255-tg)*k;nb=tb+(255-tb)*k}
  d[i]=r+(nr-r)*w;d[i+1]=g+(ng-g)*w;d[i+2]=b+(nb-b)*w;
 }
}
function bucket(map,key){let m=map.get(key);if(m)map.delete(key);else{if(map.size>=16)map.delete(map.keys().next().value);m=new Map()}map.set(key,m);return m}
function baseCanvas(id,tier,tint,skin){
 const A=art(),img=A&&A.image(id);if(!img||!img.complete||!img.naturalWidth)return null;
 const m=bucket(base,skin),key=id+'|'+tier;let e=m.get(key);if(e)return e;
 const w=makeCanvas(tier,tier,true),out=makeCanvas(tier,tier,false);if(!w||!out)return null;
 w.x.imageSmoothingEnabled=true;w.x.imageSmoothingQuality='high';w.x.clearRect(0,0,tier,tier);w.x.drawImage(img,0,0,tier,tier);
 try{const im=w.x.getImageData(0,0,tier,tier);recolor(im.data,tint?rgb(tint):null);out.x.putImageData(im,0,0)}
 catch(_){
  out.x.drawImage(w.cv,0,0);
  if(tint){// no pixel access: a 'color' blend over the whole figure, clipped back to its alpha
   const t=makeCanvas(tier,tier,false);
   if(t){t.x.drawImage(w.cv,0,0);t.x.globalCompositeOperation='color';t.x.globalAlpha=.7;t.x.fillStyle=tint;t.x.fillRect(0,0,tier,tier);
    t.x.globalAlpha=1;t.x.globalCompositeOperation='destination-in';t.x.drawImage(w.cv,0,0);out.x.clearRect(0,0,tier,tier);out.x.drawImage(t.cv,0,0)}
  }
 }
 e={cv:out.cv,m:0};m.set(key,e);stats.builds++;return e;
}
// A thin neon outline plus a soft halo in the chapter colour, baked once per frame, size, skin and chapter.
function rimCanvas(id,tier,tint,skin,trip){
 const key=id+'|'+tier,m=bucket(rimmed,skin+'|'+trip);let e=m.get(key);if(e)return e;
 const b=baseCanvas(id,tier,tint,skin);if(!b)return null;
 const r=Math.max(1,Math.round(tier/170)),mg=r+r*3+1,size=tier+mg*2,o=makeCanvas(size,size,false),s=makeCanvas(tier,tier,false);if(!o||!s)return b;
 const col=rimColor(trip);
 s.x.drawImage(b.cv,0,0);s.x.globalCompositeOperation='source-in';s.x.fillStyle=col;s.x.fillRect(0,0,tier,tier);
 const BIG=size*2;o.x.save();o.x.shadowColor=col;o.x.shadowBlur=r*3;o.x.shadowOffsetX=BIG;o.x.globalAlpha=.55;o.x.drawImage(s.cv,mg-BIG,mg);o.x.restore();
 o.x.globalAlpha=.9;for(let k=0;k<8;k++){const a=k*Math.PI/4;o.x.drawImage(s.cv,mg+Math.cos(a)*r,mg+Math.sin(a)*r)}
 o.x.globalAlpha=1;o.x.drawImage(b.cv,mg,mg);
 e={cv:o.cv,m:mg};m.set(key,e);stats.builds++;return e;
}
// Builds the other frames in idle slices after the first draw at a new size/skin/chapter, so a stride never stalls on a cache miss.
let warmKey='',warmToken=0;
const WARM_ORDER=[...RUN_IDS,'pose-stand','pose-jump','pose-land','pose-hurt','pose-joy','pose-run-a','pose-run-b','pose-sleep'];
function scheduleWarm(tier,tint,skin,trip){
 const key=tier+'|'+skin+'|'+trip;if(key===warmKey||typeof root.setTimeout!=='function')return;
 warmKey=key;const token=++warmToken;let i=0;
 const step=()=>{
  if(token!==warmToken)return;const A=art();if(!A)return;
  while(i<WARM_ORDER.length){const id=WARM_ORDER[i++];if(A.ready(id)){rimCanvas(id,tier,tint,skin,trip);root.setTimeout(step,12);return}}
 };
 root.setTimeout(step,60);
}
function pickTier(side){for(const t of TIERS)if(t>=side*.95)return t;return 512}
function runFrame(q,reduced,t){
 if(Number.isFinite(q.strideDistance))return RUN_IDS[Math.floor(((q.strideDistance/(.9*(q.bodyHeight||60)))%1+1)%1*8)&7];
 if(reduced)return 'pose-run-a';
 return Math.floor(t*4)%2?'pose-run-b':'pose-run-a';
}
// Nearest decoded frame so a late decode never flashes the vector fallback mid-run.
function readyId(A,id){
 if(A.ready(id))return id;
 const k=RUN_IDS.indexOf(id);
 if(k>=0)for(let d=1;d<4;d++)for(const j of [k-d,k+d]){const n=RUN_IDS[(j+8)%8];if(A.ready(n))return n}
 for(const f of ['pose-run-a','pose-run-b','pose-stand'])if(A.ready(f))return f;
 return null;
}
// The cape and cap tip are the left of the figure: they are drawn as strips that fan out about the neck, so the whole back leans with speed.
function drawFigure(c,e,id,u2,ox,oy,theta,tier){
 const m=e.m,full=e.cv.width,k=tier/512;
 if(!theta){c.drawImage(e.cv,ox,oy,full*u2,full*u2);return}
 const px=(NECK[0]-META[id][0])*UNIT,py=(NECK[1]-META[id][1])*UNIT,n=STRIPS.length-1,sx=STRIPS[0]*k+m;
 c.drawImage(e.cv,sx,0,full-sx,full,ox+sx*u2,oy,(full-sx)*u2,full*u2);
 for(let i=0;i<n;i++){
  const x1=STRIPS[i]*k+m+1,x0=i===n-1?0:STRIPS[i+1]*k+m,a=theta*((i+1)/n)**1.3;
  c.save();c.translate(px,py);c.rotate(a);c.translate(-px,-py);
  c.drawImage(e.cv,x0,0,x1-x0,full,ox+x0*u2,oy,(x1-x0)*u2,full*u2);c.restore();
 }
}
function rasterDraw(c,q,fx,reduced,id,style,t,b,size){
 const A=art();if(!A||!rasterOn||typeof c.drawImage!=='function')return false;
 ensureArt();
 let name=poseOf(q);if(q.pose==='sleep'||q.sleeping||fx.sleep)name='sleep';
 const st=reduced||q.pose==='stand'?null:track(id,t,name==='sleep'?'stand':name,b.angle),tm=Number.isFinite(t)?t:0,height=Math.max(0,q.height||0);
 let frame,sx=1,sy=1,ox=0,oy=0,rot=0,theta=0,shadowK=1;
 if(st&&Number.isFinite(q.strideDistance)){
  if(Number.isFinite(st.sd)&&st.dt>0){const sp=Math.abs(q.strideDistance-st.sd)/st.dt;st.speed=Number.isFinite(st.speed)?st.speed+(sp-st.speed)*Math.min(1,st.dt*8):sp}
  st.sd=q.strideDistance;
 }else if(st)st.sd=NaN;
 const speedN=st&&Number.isFinite(st.speed)?Math.min(1.6,st.speed/((q.bodyHeight||60)*5.5)):.75;
 switch(name){
  case 'run':case 'wall':{
   frame=runFrame(q,reduced,tm);
   if(name==='run'&&st&&st.landAt>-9&&tm-st.landAt<.16){const L=Math.sin(Math.PI*.5*clamp(1-(tm-st.landAt)/.16,0,1));frame='pose-land';sx=1+.05*L;sy=1-.06*L}
   if(!reduced)theta=.14*(speedN-.75)+.025*Math.sin(tm*9);
   if(name==='wall'&&!reduced)rot=-.06;
   break}
  case 'jump':case 'float':{
   frame='pose-jump';
   if(name==='jump'&&!reduced){sy=seg(J.sy,clamp(Number.isFinite(q.jumpProgress)?q.jumpProgress:.5,0,1));sx=1/Math.sqrt(sy);theta=.1+.03*Math.sin(tm*8)}
   else if(!reduced){oy=Math.sin(tm*2)*1.2;theta=.1}
   break}
  case 'land':{
   frame='pose-land';let L=Number.isFinite(q.landProgress)?1-clamp(q.landProgress,0,1):st?clamp(1-(tm-st.poseAt)/.22,0,1):.7;if(reduced)L=0;
   const Ls=Math.sin(Math.PI*.5*L);sx=1+.06*Ls;sy=1-.07*Ls;break}
  case 'hurt':{
   frame='pose-hurt';let p=.18;
   if(!reduced){
    if(q.nativeState===13||q.nativeState===16)p=clamp((q.poseFrame??q.nativeFrame??0)/14,0,1);
    else if(q.deathProgress>0)p=.25+.75*clamp(q.deathProgress,0,1);
    else if(Number.isFinite(q.poseAt)&&tm>=q.poseAt)p=clamp((tm-q.poseAt)/.85,0,1);
    else if(st)p=clamp((tm-st.poseAt)/.85,0,1);
    ox=-6*ease(p/.75);oy=-Math.sin(Math.PI*clamp(p/.64,0,1))*8;rot=-.45*Math.sin(Math.PI*clamp(p/.8,0,1));theta=-.05;
   }
   break}
  case 'sleep':{frame='pose-sleep';if(!reduced)sy=1+.014*Math.sin(tm*1.5);break}
  case 'joy':case 'open':{
   frame='pose-joy';if(!reduced){const hop=Math.abs(Math.sin(tm*6.2))*2.6;oy=-hop;shadowK=1+hop*.04;theta=.05*Math.sin(tm*7)+.04}
   break}
  default:{frame='pose-stand';if(!reduced){sy=1+.012*Math.sin(tm*2.5);theta=.025*Math.sin(tm*1.6)}}
 }
 const fid=readyId(A,frame);if(!fid)return false;
 let ms=1;if(typeof c.getTransform==='function'){const m=c.getTransform();if(m&&Number.isFinite(m.a)&&Number.isFinite(m.b))ms=Math.hypot(m.a,m.b)||1}
 const tier=pickTier(512*size*UNIT*ms),skin=style&&style.id?style.id+'|'+(style.accent||''):'moon',tint=tintHex(style),trip=q.trip||fx.trip||detectTrip();
 const e=fx.rim===false?baseCanvas(fid,tier,tint,skin):rimCanvas(fid,tier,tint,skin,trip);
 if(e&&!reduced&&fx.rim!==false)scheduleWarm(tier,tint,skin,trip);
 if(!e){stats.fallbacks++;return false}
 const u2=512/tier*UNIT,meta=META[fid],ground=height/size;
 c.save();c.translate(q.x,q.y);c.rotate(b.angle);c.scale(size,size*b.sign);
 if(q.deathProgress)c.globalAlpha*=Math.max(.05,1-q.deathProgress);
 if(fx.shadow!==false){// soft contact shadow, shrinking as the body rises
  const h=ground+Math.max(0,-oy),k=1/(1+h/20);
  if(h<70){c.save();c.translate(ox*.5,ground);c.scale(11*shadowK*k,11*shadowK*k*.26);c.globalAlpha*=.5*k;c.beginPath();c.arc(0,0,1,0,TAU);c.fillStyle='rgba(8,4,24,.6)';c.fill();c.restore()}
 }
 c.translate(ox,oy);
 if(rot){c.translate(0,-18);c.rotate(rot);c.translate(0,18)}
 if(sx!==1||sy!==1)c.scale(sx,sy);
 drawFigure(c,e,fid,u2,-meta[0]*UNIT-e.m*u2,-meta[1]*UNIT-e.m*u2,reduced?0:theta,tier);
 c.restore();return true;
}

/* ---------- entry ---------- */
function basisOf(q){const angle=q.renderAngle??Math.atan2(q.tangent?.y||0,q.tangent?.x??1);return {angle,sign:q.direction===1?-1:1}}
function draw(c,q,fx={},reduced=false,character='walker',style){
 if(!c||!q)return false;fx=fx||{};
 const t=reduced?0:(fx.poseTime??fx.t??0),b=basisOf(q),size=(q.bodyHeight||60)/43.5;
 const kind=character==='elder'?'elder':character==='woman'?'woman':'child',R=RIGS[kind];
 if(!style)style=root.MongyuMobile?.look?.()||null;
 if(kind==='child'&&rasterDraw(c,q,fx,!!reduced,character||'walker',style,Number(t)||0,b,size))return true;
 const p=palette(style,fx.ink,fx.onDark),g=gradientsFor(c,p,R);
 solve(q,fx,!!reduced,character||'walker',Number(t)||0,R,b.angle);
 // Outlines stay about one device pixel wide at any bodyHeight.
 const ow=clamp(.85/Math.max(.6,size),.45,1.1);
 c.save();c.translate(q.x,q.y);c.rotate(b.angle);c.scale(size,size*b.sign);
 if(q.deathProgress)c.globalAlpha*=Math.max(.05,1-q.deathProgress);
 shadow(c,S,R,g,reduced);
 c.translate(S.ox,S.oy);
 if(S.rot){c.translate(0,-18);c.rotate(S.rot);c.translate(0,18)}
 if(S.sx!==1||S.sy!==1)c.scale(S.sx,S.sy);
 if(kind==='elder')drawElder(c,S,p,g,R,ow,!!reduced,q,t);else if(kind==='woman')drawWoman(c,S,p,g,R,ow,!!reduced);else drawChild(c,S,p,g,R,ow,!!reduced);
 c.restore();return true;
}
function resetMotion(){tracks.clear()}
const api=Object.freeze({enabled,draw,poseOf,palette,resetMotion,setTrip,whenReady,ready:artReady,stats,setRaster:v=>{rasterOn=!!v},poses:Object.freeze([...POSES]),artIds:Object.freeze([...ART_IDS])});
root.MongyuCharacter=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
