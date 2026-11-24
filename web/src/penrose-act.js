/* R105 isometric illusion acts: Penrose stair loop and alignment bridge. Owned by workstream C.
   PenroseRun: four flights close into a loop on screen although the real 3D stair spirals up by T = rise of all
   four flights; the open end of the spiral is displaced by (T,T,T), which is invisible in isometric projection
   (screen = ((x-z)C, (x+z)/2-y)). The runner circles the loop twice over coral blocks; altitude keeps rising.
   AlignRun: two bridge halves hang at different depths; the camera swings around the scene and where the view ray
   joins them (yaw +-5 deg) a tap snaps the path together. Both follow the act contract of IllusionRun/OpeningRun. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const C=Math.cos(Math.PI/6),TAU=Math.PI*2,DEG=Math.PI/180;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const easeOut=t=>1-Math.pow(1-clamp(t,0,1),3);
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const reducedMotion=()=>{try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}};
function rng(seed){let a=(seed>>>0)||1;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mixc=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const css=a=>'rgb('+Math.round(a[0])+','+Math.round(a[1])+','+Math.round(a[2])+')';
const rgba=(a,al)=>'rgba('+Math.round(a[0])+','+Math.round(a[1])+','+Math.round(a[2])+','+al+')';
const SHADOW=hex('#3a2c6e'),LIGHT=hex('#fffaf0');
/* Face tones for a base colour: top, left (+z face), right (+x face, in shade). */
const tones=b=>[css(mixc(b,LIGHT,.14)),css(mixc(b,SHADOW,.26)),css(mixc(b,SHADOW,.5))];
const INK={danger:'#ff8a73',dangerTop:'#ffb59f',dangerSide:'#c75a55',dangerLine:'#ffe1c8',tap:'#ffeca5',tapDeep:'#ffd98a'};
const ink=()=>root.MongyuEndless?.ink?.()||INK;
const SKIES={
 dusk:{sky:['#1a1240','#45307c','#c98ab8'],mist:'#d9b3e6',moon:'#ffe9c9',flights:['#ffe0a3','#a9ead2','#9fcfff','#cdb6ff']},
 dawn:{sky:['#22346a','#8a6cb4','#ffc7a8'],mist:'#ffd9cf',moon:'#fff2d6',flights:['#ffd1c1','#ffe9a8','#b7ecd6','#b8c6ff']}
};
const COACH={
 intro:'오르고 올라도 제자리 · 끝없는 계단',jump:'산호빛 블록은 탭으로 점프',lap:'한 바퀴 더 · 조금 빨라져요',finish:'오로라의 문!',early:'조금 일찍 눌렀어',late:'한 박자 늦었어',
 align:'두 길이 겹칠 때 탭',snap:'딸깍 · 길이 이어졌어',miss:'조금만 더 · 선이 하나가 될 때',again:'괜찮아요 · 한 번 더 돌아와요',cross:'건너가요',gate:'오로라의 문!'
};

/* ---------- shared depth sorting of axis-aligned boxes [x0,x1,y0,y1,z0,z1] ---------- */
const EPS=1e-6;
/* a is behind b (b nearer the camera at +x,+y,+z): they are separated along an axis with a on the far side. */
const behind=(a,b)=>a[1]<=b[0]+EPS||a[3]<=b[2]+EPS||a[5]<=b[4]+EPS;
function depthOrder(items){
 const n=items.length,out=[],indeg=new Array(n).fill(0),edges=items.map(()=>[]),key=items.map(it=>(it.box[0]+it.box[1]+it.box[2]+it.box[3]+it.box[4]+it.box[5])/2);
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){if(i===j)continue;const ab=behind(items[i].box,items[j].box),ba=behind(items[j].box,items[i].box);if(ab&&!ba){edges[i].push(j);indeg[j]++}}
 const done=new Array(n).fill(false);
 for(let step=0;step<n;step++){
  let pick=-1;for(let i=0;i<n;i++)if(!done[i]&&indeg[i]===0&&(pick<0||key[i]<key[pick]))pick=i;
  if(pick<0)for(let i=0;i<n;i++)if(!done[i]&&(pick<0||key[i]<key[pick]))pick=i;
  done[pick]=true;out.push(items[pick]);for(const j of edges[pick])indeg[j]--;
 }
 out.forEach((it,i)=>it.rank=i);return out;
}

/* ---------- Penrose geometry ---------- */
const W=38,LT=16,SLAB=15,PILLAR=520;
const PRM={nf:5,rf:21,nb:3,rb:14,hb:6};
const BLOCK=3.5,FOOT=1.5,BLOCK_H=12,PEAK=38,FLIGHT=.8,BUFFER=.09,HIT_STOP=.12,FAIL_OUTRO=.95,CLEAR_OUTRO=1.9,INTRO=2.2;
const SPEEDS=[28,37];
const iso=(x,y,z)=>({x:(x-z)*C,y:(x+z)*.5-y});
function faceQuads(b){
 const [x0,x1,y0,y1,z0,z1]=b,P=(x,y,z)=>{const p=iso(x,y,z);return [p.x,p.y]};
 const f=(a,b2,c,d)=>[a[0],a[1],b2[0],b2[1],c[0],c[1],d[0],d[1]];
 return [f(P(x0,y0,z1),P(x1,y0,z1),P(x1,y1,z1),P(x0,y1,z1)),f(P(x1,y0,z0),P(x1,y0,z1),P(x1,y1,z1),P(x1,y1,z0)),f(P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1))];
}
function buildLoop(){
 const {nf,rf,nb,rb,hb}=PRM,hf=((nf*rf-nb*rb)/2-nb*hb)/nf;
 const F=[{dx:1,dz:0,n:nf,r:rf,h:hf},{dx:0,dz:1,n:nf,r:rf,h:hf},{dx:-1,dz:0,n:nb,r:rb,h:hb},{dx:0,dz:-1,n:nb,r:rb,h:hb}];
 let x=0,y=0,z=0,s=0;const blocks=[],lands=[],treads=[];
 const land=(k,cx,cy,cz)=>{const b={kind:'land',k,box:[cx-W/2,cx+W/2,cy-LT,cy,cz-W/2,cz+W/2],flight:k%4};blocks.push(b);lands[k]=b;return b};
 land(0,0,0,0);
 for(let k=0;k<4;k++){
  const f=F[k];f.len=f.n*f.r+W;f.s0=s;f.s1=s+f.len;f.x0=x;f.y0=y;f.z0=z;treads[k]=[];
  for(let j=0;j<f.n;j++){
   const a=W/2+j*f.r,b=a+f.r,top=y+f.h*j;
   const px0=x+f.dx*a,px1=x+f.dx*b,pz0=z+f.dz*a,pz1=z+f.dz*b,hw=f.dx?0:W/2,hz=f.dz?0:W/2;
   const box=[Math.min(px0,px1)-hw,Math.max(px0,px1)+hw,top-SLAB,top,Math.min(pz0,pz1)-hz,Math.max(pz0,pz1)+hz];
   const t={kind:'tread',k,j,box,flight:k,top};blocks.push(t);treads[k][j]=t;
  }
  x+=f.dx*f.len;z+=f.dz*f.len;y+=f.n*f.h;s+=f.len;f.x1=x;f.y1=y;f.z1=z;
  land(k+1,x,y,z);
 }
 const T=y;
 // Pillars carry three of the four landings into the mist (the seam landing floats).
 const pillars=[];for(const k of [1,2,3]){const l=lands[k],cx=(l.box[0]+l.box[1])/2,cz=(l.box[4]+l.box[5])/2;const p={kind:'pillar',k,box:[cx-8,cx+8,-PILLAR,l.box[2]-.01,cz-8,cz+8],flight:k};pillars.push(p);blocks.push(p)}
 const order=depthOrder(blocks);
 // Palette: each flight blends its base colour into the next one so the loop reads as one continuous ribbon.
 const base=['dusk','dawn'].reduce((o,v)=>{o[v]=SKIES[v].flights.map(hex);return o},{});
 const pal={};for(const v of ['dusk','dawn']){
  pal[v]=blocks.map(b=>{const fl=b.flight,col=b.kind==='tread'?mixc(base[v][fl],base[v][(fl+1)%4],(b.j+1)/(F[fl].n+1)*.9):base[v][fl%4];return tones(col)});
 }
 blocks.forEach((b,i)=>{b.id=i;b.faces=faceQuads(b.box)});
 // Chevrons on treads point along the direction of travel; a gold ring marks the seam landing.
 for(const t of blocks){if(t.kind!=='tread')continue;const f=F[t.k],cx=(t.box[0]+t.box[1])/2,cz=(t.box[4]+t.box[5])/2,a=f.r*.28,l=W*.22,top=t.top;
  const P=(px,pz)=>{const p=iso(px,top,pz);return [p.x,p.y]};
  const tip=P(cx+f.dx*a,cz+f.dz*a),t1=P(cx-f.dx*a+f.dz*l,cz-f.dz*a+f.dx*l),t2=P(cx-f.dx*a-f.dz*l,cz-f.dz*a-f.dx*l);t.chev=[t1[0],t1[1],tip[0],tip[1],t2[0],t2[1]];t.q=(f.s0+W/2+(t.j+.5)*f.r)/s}
 // Slit windows on the pillars' right faces.
 for(const p of pillars){p.slits=[];const [x0,x1,y0,y1,z0,z1]=p.box,zc=(z0+z1)/2;for(let y=y1-46;y>y0+60;y-=78){const P=(yy,zz)=>{const q=iso(x1,yy,zz);return [q.x,q.y]},a=P(y-16,zc-2.2),b=P(y-16,zc+2.2),c2=P(y+16,zc+2.2),d=P(y+16,zc-2.2);p.slits.push([a[0],a[1],b[0],b[1],c2[0],c2[1],d[0],d[1]])}}
 // Screen bounds of the structure (without pillars).
 let l=1e9,r=-1e9,tp=1e9,bt=-1e9;for(const b of blocks){if(b.kind==='pillar')continue;for(const q of b.faces)for(let i=0;i<8;i+=2){l=Math.min(l,q[i]);r=Math.max(r,q[i]);tp=Math.min(tp,q[i+1]);bt=Math.max(bt,q[i+1])}}
 return {F,blocks:order,all:blocks,lands,treads,pal,T,LAP:s,hf,bounds:{l,r,t:tp,b:bt},closure:Math.hypot(x-T,z-T)};
}
const LOOP=buildLoop();
const LAP=LOOP.LAP,FINISH=LAP*2;
/* Position on the loop at path distance s (wraps each lap): world point, support block and facing. */
function pathAt(s,o={}){
 const lap=Math.floor(s/LAP);s-=lap*LAP;let k=0;while(k<3&&s>=LOOP.F[k].s1)k++;
 const f=LOOP.F[k],d=s-f.s0,u=(d-W/2)/f.r;
 let y=f.y0,top=f.y0,block;
 if(d<W/2){block=LOOP.lands[k]}
 else if(u>=f.n){y=top=f.y0+f.n*f.h;block=LOOP.lands[k+1]}
 else{const j=Math.floor(u);top=f.y0+f.h*j;block=LOOP.treads[k][j]}
 if(u>0){const done=clamp(Math.floor(u-.22),0,f.n),i=done+1;y=f.y0+f.h*(done+(i<=f.n?sstep(i-.22,i+.22,u):0))}
 o.x=f.x0+f.dx*d;o.z=f.z0+f.dz*d;o.y=y;o.top=top;o.block=block;o.k=k;o.lap=lap;o.dx=f.dx;o.dz=f.dz;o.d=d;o.u=u;return o;
}
const climbAt=(s,o={})=>{pathAt(s,o);return Math.floor(s/LAP)*LOOP.T+o.y};
/* Deterministic course: coral blocks on the beat grid of each lap (distance = k * speed * 60 / bpm from the lap start). */
const courseCache=new Map();
function makeCourse(bpm,seed){
 const key=bpm+'|'+seed;if(courseCache.has(key))return courseCache.get(key);
 const r=rng((seed>>>0)*7919+13),beat=60/bpm,obstacles=[],shards=[],tmp={};
 for(let lap=0;lap<2;lap++){
  const sp=SPEEDS[lap]*beat,gap=Math.max(2,Math.ceil((lap?1.55:1.95)/beat));let k=Math.ceil((lap?72:120)/sp);
  while(k*sp<LAP-(lap?64:80)){obstacles.push({at:lap*LAP+k*sp,lap,beat:k,spacing:sp});k+=gap+(r()<.4?1:0)}
 }
 for(const o of obstacles){pathAt(o.at,tmp);o.p=[tmp.x,tmp.top,tmp.z];o.rank=tmp.block.rank;o.flight=tmp.k}
 obstacles.forEach((o,i)=>{shards.push({at:o.at,lap:o.lap,kind:'block',p:[o.p[0],o.p[1]+PEAK+10,o.p[2]],rank:o.rank});
  const nx=obstacles[i+1];if(nx&&nx.lap===o.lap){const at=(o.at+nx.at)/2;pathAt(at,tmp);shards.push({at,lap:o.lap,kind:'trail',p:[tmp.x,tmp.top+16,tmp.z],rank:tmp.block.rank})}});
 const out={obstacles,shards,beat};courseCache.set(key,out);return out;
}

/* ---------- shared art: backdrop, aurora, finger, hud ---------- */
const skyCache=new WeakMap();
function sky(c,w,h,pal){
 let e=skyCache.get(c);const key=pal.sky.join()+w+'x'+h;
 if(!e||e.key!==key){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,pal.sky[0]);g.addColorStop(.58,pal.sky[1]);g.addColorStop(1,pal.sky[2]);e={key,g};skyCache.set(c,e)}
 c.fillStyle=e.g;c.fillRect(0,0,w,h);
}
/* Far floating architecture: towers, arches and islands, three misty layers. */
const SIL=(()=>{const r=rng(4217),out=[];
 for(let layer=0;layer<3;layer++)for(let i=0;i<7;i++){out.push({layer,x:(i+r()*.7)/6.4-.1,w:10+r()*16+layer*5,h:50+r()*110+layer*20,kind:r()<.4?'arch':r()<.5?'isle':'tower',base:r()*.08,seed:r()})}
 return out})();
const MOTES=(()=>{const r=rng(991),out=[];for(let i=0;i<30;i++)out.push({x:r(),y:r(),s:1+r()*2.6,v:.4+r()*.9,ph:r()*TAU,gold:r()<.4});return out})();
function silhouette(c,e,x,y,fill){
 c.fillStyle=fill;c.beginPath();
 if(e.kind==='tower'){c.moveTo(x-e.w/2,y);c.lineTo(x-e.w/2,y-e.h*.78);c.lineTo(x,y-e.h);c.lineTo(x+e.w/2,y-e.h*.78);c.lineTo(x+e.w/2,y);}
 else if(e.kind==='arch'){const ww=e.w*1.5;c.moveTo(x-ww,y);c.lineTo(x-ww,y-e.h*.6);c.arc(x,y-e.h*.6,ww,Math.PI,0);c.lineTo(x+ww,y);c.lineTo(x+ww*.55,y);c.lineTo(x+ww*.55,y-e.h*.6);c.arc(x,y-e.h*.6,ww*.55,0,Math.PI,true);c.lineTo(x-ww*.55,y);}
 else{const ww=e.w*1.5,y0=y-e.h*.4;c.moveTo(x-ww,y0);c.quadraticCurveTo(x,y0-6,x+ww,y0);c.quadraticCurveTo(x+ww*.8,y0+e.h*.1,x+ww*.3,y0+e.h*.2);c.quadraticCurveTo(x-ww*.5,y0+e.h*.14,x-ww,y0);c.moveTo(x-e.w*.5,y0-3);c.lineTo(x-e.w*.5,y0-e.h*.3);c.lineTo(x-e.w*.1,y0-e.h*.38);c.lineTo(x+e.w*.5,y0-e.h*.3);c.lineTo(x+e.w*.5,y0-3);}
 c.closePath();c.fill();
}
/* opts: pan (parallax offset in px), rise (px the world has climbed, scrolls clouds/motes downward), horizon (y of far base). */
function backdrop(c,w,h,t,pal,reduced,pan,rise,horizon){
 sky(c,w,h,pal);const mist=hex(pal.mist);
 // Stars and moon.
 c.fillStyle='rgba(255,246,230,.85)';for(let i=0;i<MOTES.length;i++){const m=MOTES[i];if(i%2)continue;const a=.25+.5*(reduced?.5:.5+.5*Math.sin(t*.8+m.ph));c.globalAlpha=a*.7;c.fillRect(m.x*w,m.y*h*.45,1.3,1.3)}
 c.globalAlpha=1;const mr=Math.min(w,h)*.12,mx=w*.76-pan*.15,my=h*.17;
 const mg=c.createRadialGradient(mx,my,mr*.2,mx,my,mr*3);mg.addColorStop(0,'rgba(255,240,214,.34)');mg.addColorStop(.35,'rgba(255,226,200,.12)');mg.addColorStop(1,'rgba(255,226,200,0)');c.fillStyle=mg;c.fillRect(mx-mr*3,my-mr*3,mr*6,mr*6);
 c.globalAlpha=.88;c.fillStyle=pal.moon;c.beginPath();c.arc(mx,my,mr*.8,0,TAU);c.fill();c.globalAlpha=.1;c.fillStyle='#b497d6';c.beginPath();c.arc(mx+mr*.22,my+mr*.08,mr*.8,-1.2,1.9);c.arc(mx-mr*.05,my+mr*.08,mr*.7,1.9,-1.2,true);c.fill();c.globalAlpha=1;
 for(const e of SIL){const par=[.12,.24,.42][e.layer],x=((e.x+1.2)%1.4-.1)*w-pan*par,y=horizon+h*(.1+e.base)+e.layer*h*.03;
  silhouette(c,e,x,y,rgba(mist,[.09,.14,.2][e.layer]))}
 // Clouds and motes drift downward as the stair climbs: the cue that the ascent never ends.
 const rs=reduced?.25:1;
 for(let i=0;i<MOTES.length;i++){const m=MOTES[i],par=.25+m.v*.5,y=((m.y*h+rise*par*rs)%(h+30)+h+30)%(h+30)-15,x=m.x*w+Math.sin(t*.3*rs+m.ph)*6;
  c.globalAlpha=.12+.18*m.v;c.fillStyle=m.gold?'#ffe9a8':pal.mist;c.beginPath();c.arc(x,y,m.s*(1+par*.6),0,TAU);c.fill()}
 c.globalAlpha=1;
 for(let i=0;i<5;i++){const par=.18+i*.07,y=((i*h*.23+rise*par*rs)%(h*1.1)+h*1.1)%(h*1.1)-h*.05,x=((i*.37+.1)%1)*w-pan*par*.5;c.fillStyle=rgba(mist,.07+.02*i);c.beginPath();c.ellipse(x,y,w*(.28+.06*i),12+i*4,0,0,TAU);c.fill()}
}
const HAND=(()=>{if(typeof Path2D==='undefined')return null;return new Path2D('M-2.3 0V-11.6a2.3 2.3 0 0 1 4.6 0V-5.2a2 2 0 0 1 3.8 .4a2 2 0 0 1 3.7 .6a1.9 1.9 0 0 1 3.5 1V3.4c0 3.6-2.6 6.4-6.2 6.4H1.6c-2 0-3.4-.9-4.6-2.4L-6.6 2.6a1.9 1.9 0 0 1 2.9-2.4z')})();
function finger(c,x,y,t,reduced){
 if(!HAND)return;const cycle=reduced?.75:(t*.95)%1,press=reduced?0:Math.max(0,Math.sin(cycle*Math.PI*2))*3;
 c.save();c.translate(x+8,y+10-press);c.rotate(-.35);c.lineJoin='round';c.lineWidth=2.4;c.strokeStyle='rgba(32,20,56,.5)';c.stroke(HAND);c.fillStyle='#fff7ec';c.fill(HAND);c.lineWidth=.7;c.strokeStyle='#ffcfae';c.stroke(HAND);c.restore();
}
const CURTAINS=[[-22,15,200,'127,243,225',0],[-8,18,240,'138,184,255',1.7],[7,17,220,'183,140,255',3.1],[21,14,186,'255,158,216',4.4]];
const auroraInks=new WeakMap();
function aurora(c,x,y,strength,t,scale=1,grow=0){
 let ink2=auroraInks.get(c);
 if(!ink2){ink2=CURTAINS.map(([,,height,rgb])=>{const g=c.createLinearGradient(0,0,0,-height);g.addColorStop(0,'rgba(255,252,240,.9)');g.addColorStop(.06,'rgba('+rgb+',.8)');g.addColorStop(.35,'rgba('+rgb+',.32)');g.addColorStop(1,'rgba('+rgb+',0)');return g});auroraInks.set(c,ink2)}
 if(strength<=0)return;
 c.save();c.translate(x,y);c.scale(scale,scale);c.globalCompositeOperation='lighter';
 for(let i=0;i<CURTAINS.length;i++){
  const [cx,width,height,,phase]=CURTAINS[i];c.fillStyle=ink2[i];c.globalAlpha=Math.min(1,strength*(.65+.2*Math.sin(t*1.3+phase)));
  c.beginPath();const n=12;
  for(let j=0;j<=n;j++){const u=j/n,sway=Math.sin(j*.45+t*1.1+phase)*8*u,half=width*.5*(1-.4*u);c[j?'lineTo':'moveTo'](cx+sway-half,-height*u*(1+grow*.3))}
  for(let j=n;j>=0;j--){const u=j/n,sway=Math.sin(j*.45+t*1.1+phase)*8*u,half=width*.5*(1-.4*u);c.lineTo(cx+sway+half,-height*u*(1+grow*.3))}
  c.closePath();c.fill();
 }
 c.globalAlpha=Math.min(1,strength);c.fillStyle='rgba(255,250,236,.85)';c.fillRect(-24,-1,48,1.6);
 c.restore();
}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
/* Score, coach pill and gauge. gauge: {frac, marks:[0..1]} */
function hud(c,run,w,h,title,gauge,k){
 if(run.state==='fail'||run.state==='clear'||run.hudOff)return;
 const fade=run.outro?1-Math.min(1,run.outro.age/.35):1;if(fade<=0)return;
 c.save();c.globalAlpha=fade;c.textAlign='center';const top=Math.max(14,h*.035);
 c.font='600 11px system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(20,12,36,.6)';c.strokeText(title,w/2,top+10);c.fillStyle='rgba(255,243,226,.85)';c.fillText(title,w/2,top+10);
 c.font='800 40px system-ui,sans-serif';c.lineWidth=5;c.strokeStyle='rgba(20,12,36,.55)';c.strokeText(String(run.score),w/2,top+52);c.fillStyle='#fff3d6';c.fillText(String(run.score),w/2,top+52);
 const coach=run.coach&&run.time<run.coach.until?run.coach.text:'';
 if(coach&&run.state==='play'){c.font='700 16px system-ui,sans-serif';const tw=Math.min(w-48,c.measureText(coach).width+36),y=h*.74;rr(c,w/2-tw/2,y-19,tw,38,19);c.fillStyle='rgba(26,19,48,.66)';c.fill();c.strokeStyle='rgba(255,236,255,.16)';c.lineWidth=1;c.stroke();c.fillStyle='#fbf4ff';c.fillText(coach,w/2,y+6)}
 const gy=h*.86,gw=Math.min(w*.7,320),x0=w/2-gw/2;
 rr(c,x0,gy,gw,6,3);c.fillStyle='rgba(255,255,255,.12)';c.fill();rr(c,x0,gy,Math.max(6,gw*clamp(gauge.frac,0,1)),6,3);c.fillStyle='#bfe9ff';c.fill();
 for(const m of gauge.marks||[]){c.save();c.translate(x0+gw*m.at,gy+3);c.rotate(Math.PI/4);c.fillStyle=m.lit?k.tapDeep:'rgba(255,255,255,.4)';c.fillRect(-3.2,-3.2,6.4,6.4);c.restore()}
 c.restore();
}
function sprite(c,q,t,reduced,flip){
 if(!root.MongyuMobile?.sprite)return;
 if(flip){c.save();c.translate(q.x,0);c.scale(-1,1);c.translate(-q.x,0)}
 root.MongyuMobile.sprite(c,q,{poseTime:t,onDark:true},reduced);
 if(flip)c.restore();
}
function gem(c,x,y,rot,k,size=3){c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=k.tap;c.fillRect(-size,-size,size*2,size*2);c.globalAlpha*=.6;c.fillStyle='#fffbe8';c.fillRect(-size*.35,-size*.35,size*.7,size*.7);c.restore()}

/* ---------- common run plumbing ---------- */
class ActRun{
 constructor(options,dreamMode){
  this.options=options;this.mode='dream';this.dreamMode=dreamMode;this.openingCourse=false;this.polish=true;
  this.chain=options.chain||null;this.variant=options.variant||null;
  this.bpm=Number(this.chain?.bpm??options.bpm)||100;this.seed=(this.chain?.seed??options.seed??1)>>>0;
  this.settings={...(options.settings||{})};this.attempt=options.attempt||1;this.skipIntro=!!options.skipIntro||this.chain?.first===false;
  this.firstTime=!this.chain||this.chain.first!==false;this.hudOff=options.hud===false;
  this.setViewport(options.viewport?.width,options.viewport?.height);
 }
 setViewport(width=390,height=844){this.viewport={width,height}}
 start(){if(this.state!=='ready')return false;this.state='play';this.events.push('start');return true}
 pause(){if(this.state!=='play')return false;this.state='pause';this.cancelInput();this.events.push('pause');return true}
 resume(){if(this.state!=='pause')return false;this.state='play';this.events.push('resume');return true}
 retry(){this.attempt++;this.skipIntro=true;this.reset();this.state='play';this.events.push('start');return true}
 inputDown(){return this.action()}
 inputUp(){}
 cancelInput(){this.buffer=0}
 drainEvents(){return this.events.splice(0)}
 setCoach(kind,hold){this.coach={kind,text:COACH[kind],until:this.time+hold}}
 carry(){const c=this.chain?.carry||{};return {points:Number(c.points)||0,streak:Number(c.perfectStreak)||0,hearts:Number(c.hearts)>0?Math.floor(c.hearts):1}}
 /* Ends the act: instantly when it is not the last act of a chain, else through the outro. */
 finishLine(kind){
  this.events.push('portal');
  if(this.chain&&this.chain.last===false){this.finish('clear');return}
  this.outro={kind,age:0,duration:CLEAR_OUTRO};
 }
}

/* ---------- PenroseRun ---------- */
class PenroseRun extends ActRun{
 constructor(options={}){
  super(options,'penrose');this.variant=options.variant==='dawn'?'dawn':'dusk';
  this.course=makeCourse(this.bpm,this.seed);this.reset();
 }
 reset(){
  const cr=this.carry();
  this.state='ready';this.time=0;this.clock=0;this.updates=0;this.inputCount=0;this.jumps=0;this.hits=0;this.hearts=cr.hearts;this.invuln=0;
  this.distance=0;this.height=0;this.flight=null;this.buffer=0;this.lastJump=-Infinity;this.events=[];this.lap=0;this.speed=SPEEDS[0]*.55;
  this.blockIndex=0;this.clears=0;this.shards=this.course.shards.map(()=>false);this.shardCount=0;this.perfects=0;this.perfectStreak=cr.streak;this.bestStreak=cr.streak;
  this.points=cr.points;this.basePoints=cr.points;this.score=this.points;this.crash=null;this.hitStop=0;this.outro=null;this.result=null;
  this.intro=this.skipIntro||reducedMotion()?0:INTRO;this.crossedAt=-10;this.cam=null;this.pose='run';this.climb=0;this.jumpCoached=false;
  this.coach=this.firstTime?{kind:'intro',text:COACH.intro,until:this.intro+3.2}:null;
  /* R105 items: fl/pk = length and peak factor of the current jump (feather doubles it); mods/itemList from MongyuItems.setup. */
  this.fl=FLIGHT;this.pk=1;this.mods=null;this.itemList=null;
  if(this.chain||this.options.items){
   const list=root.MongyuItems?.setup?.(this,{items:this.options.items,start:0,len:FINISH,beat:SPEEDS[0]*60/this.bpm});
   if(list)for(const it of list){pathAt(it.at,ptmp);it.p=[ptmp.x,ptmp.top,ptmp.z];it.rank=ptmp.block.rank;it.lap=Math.floor(it.at/LAP)}
  }
 }
 action(){
  if(this.state!=='play'||this.outro||this.hitStop>0)return false;
  if(this.intro>0){this.intro=0;this.coach={kind:'intro',text:COACH.intro,until:this.time+2};return true}
  this.inputCount++;
  if(this.flight!==null){if(this.flight>=this.fl-BUFFER)this.buffer=BUFFER;return false}
  return this.jump();
 }
 jump(){this.fl=root.MongyuItems?.applyJump?root.MongyuItems.applyJump(this,FLIGHT):FLIGHT;this.flight=0;this.lastJump=this.distance;this.jumps++;this.buffer=0;this.pose='jump';this.events.push('jump');return true}
 /* R105: settle() applies the surge x2 and its trigger after every tick, whichever way tick0 returns. */
 tick(dt){this.tick0(dt);if(this.mods)root.MongyuItems.settle(this)}
 tick0(dt){
  if(this.state!=='play')return;
  this.updates++;this.clock+=dt;
  if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);return}
  if(this.outro){this.outro.age+=dt;if(this.outro.age>=this.outro.duration)this.finish(this.outro.kind);return}
  if(this.intro>0){this.intro=Math.max(0,this.intro-dt);return}
  if(this.mods)dt=root.MongyuItems.applyPace(this,dt);
  this.time+=dt;this.invuln=Math.max(0,this.invuln-dt);
  const target=SPEEDS[this.lap];this.speed+=(target-this.speed)*Math.min(1,dt*(this.time<1.2?2.4:3));if(Math.abs(target-this.speed)<.02)this.speed=target;
  const before=this.distance;this.distance=Math.min(FINISH,this.distance+this.speed*dt);
  this.buffer=Math.max(0,this.buffer-dt);
  if(this.flight!==null){
   this.flight+=dt;const ph=Math.min(1,this.flight/this.fl);this.height=4*PEAK*this.pk*ph*(1-ph);
   if(ph===1){this.flight=null;this.height=0;this.pose='run';this.events.push('land');if(this.buffer>0)this.jump()}
  }
  // Lap seam: the loop closes; the stair has climbed one more spiral turn.
  if(this.lap===0&&this.distance>=LAP){this.lap=1;this.points+=150;this.crossedAt=this.time;this.events.push('corner');this.setCoach('lap',2.2)}
  this.climb=climbAt(this.distance);
  const obs=this.course.obstacles,b=obs[this.blockIndex];
  if(b){
   if(!this.jumpCoached&&this.firstTime&&b.at-this.distance<80){this.jumpCoached=true;this.setCoach('jump',2.4)}
   const gap=this.distance-b.at;
   if(Math.abs(gap)<=BLOCK+FOOT&&this.height<BLOCK_H&&this.invuln<=0){this.hit(b);if(this.state!=='play'||this.outro)return}
   else if(gap>BLOCK+FOOT){
    this.blockIndex++;this.clears++;this.crossedAt=this.time;
    const lead=b.at-this.lastJump,perfect=Math.abs(lead-this.speed*this.fl/2)<=this.speed*.065;
    this.perfectStreak=perfect?this.perfectStreak+1:0;this.bestStreak=Math.max(this.bestStreak,this.perfectStreak);
    this.points+=60+(perfect?40+10*Math.min(5,this.perfectStreak):0);if(perfect)this.perfects++;this.events.push(perfect?'perfect':'pass');
   }
  }
  if(this.mods)root.MongyuItems.collect(this,this.distance,this.height,PEAK,9);
  const sh=this.course.shards;
  for(let i=0;i<sh.length;i++){
   if(this.shards[i])continue;const s=sh[i],d=Math.abs(this.distance-s.at);if(d>9)continue;
   if(s.kind==='trail'||this.height>=PEAK-16){this.shards[i]=true;this.shardCount++;this.points+=25}
  }
  this.score=this.points+Math.floor(this.distance/10);
  if(this.distance>=FINISH&&before<FINISH){this.points+=300;this.score+=300;this.setCoach('finish',2);this.pose='joy';this.finishLine('clear')}
 }
 hit(b){
  if(this.mods&&root.MongyuItems.applyHit(this)){this.blockIndex++;this.perfectStreak=0;this.crossedAt=this.time;return}
  this.hits++;this.hearts--;this.perfectStreak=0;
  const early=this.lastJump>b.at-120&&(this.flight===null||this.flight/FLIGHT>.5);
  this.events.push('hit');this.setCoach(early?'early':'late',2.2);
  if(this.hearts<=0){this.hearts=0;this.crash={kind:'block',at:this.distance,s:b.at,early};this.pose='hurt';this.hitStop=reducedMotion()?0:HIT_STOP;this.outro={kind:'fail',age:0,duration:FAIL_OUTRO}}
  else{this.invuln=1.2;this.blockIndex++;this.crashedAt=this.time}
 }
 finish(state){
  this.state=state;this.outro=null;
  this.result={mode:'penrose',state,score:this.score,points:this.points,distance:Math.floor(this.distance),progress:this.distance/FINISH,laps:this.lap+(this.distance>=FINISH?1:0),
   clears:this.clears,blocks:this.course.obstacles.length,shards:this.shardCount,shardTotal:this.course.shards.length,perfects:this.perfects,perfectStreak:this.perfectStreak,hearts:this.hearts,
   time:this.time,attempt:this.attempt,altitude:Math.floor(this.climb),reason:state==='clear'?'끝없는 계단을 두 바퀴 올랐어요.':'산호빛 블록에 부딪혔어요'};
  this.events.push(state);
 }
 status(){
  return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:this.score,best:0,progress:this.distance/FINISH,
   roomTitle:'펜로즈 계단 · '+(this.lap+1)+'바퀴째',roomIndex:this.lap,roomCount:2,instruction:'탭: 산호빛 블록 점프',cue:null,result:this.result};
 }
 drawSelf(ctx,opts){return drawPenrose(ctx,this,opts)}
}

const ptmp={};
function drawPenrose(c,run,opts){
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,k=ink(),pal=SKIES[run.variant],tones2=LOOP.pal[run.variant];
 const bd=LOOP.bounds,bw=bd.r-bd.l,bh=bd.b-bd.t;
 let scale=clamp(Math.min(w*.92/bw,h*.46/bh),.6,2.6);
 const finale=run.outro?.kind==='clear'?ease(clamp(run.outro.age/1.4,0,1)):run.state==='clear'?1:0;
 let introK=1;if(run.intro>0)introK=ease(1-run.intro/INTRO);
 scale*=(.86+.14*introK)*(1-.16*finale)*(reduced?1:1+.012*Math.sin(t*.21));
 const swayX=reduced?0:Math.sin(t*.23)*7,swayY=reduced?0:Math.cos(t*.17)*4;
 const ccx=(bd.l+bd.r)/2,ccy=(bd.t+bd.b)/2,ox=w/2+swayX-ccx*scale,oy=h*.45+swayY-ccy*scale;
 const rise=run.climb*1.15+(run.intro>0?introK*LOOP.T*.5:0);
 c.save();
 backdrop(c,w,h,t,pal,reduced,swayX*2+(run.clock*(reduced?0:3)),rise,h*.42);
 c.translate(ox,oy);c.scale(scale,scale);
 // Entities that sit on blocks are drawn right after their support block.
 const me=pathAt(run.distance,ptmp),runnerRank=me.block.rank;
 const obs=run.course.obstacles;
 const dead=run.crash&&run.outro?.kind==='fail';
 for(let i=0;i<LOOP.blocks.length;i++){
  const b=LOOP.blocks[i],tn=tones2[b.id];
  c.fillStyle=tn[1];quad8(c,b.faces[0]);c.fill();c.fillStyle=tn[2];quad8(c,b.faces[1]);c.fill();c.fillStyle=tn[0];quad8(c,b.faces[2]);c.fill();
  if(b.kind==='pillar'){c.fillStyle='rgba(32,20,70,.34)';for(const q of b.slits){quad8(c,q);c.fill()}}
  else if(b.kind==='tread'){c.strokeStyle='rgba(58,44,110,.34)';c.lineWidth=.7;quad8(c,b.faces[2]);c.stroke();const wv=reduced?.3:Math.pow(Math.max(0,Math.cos(TAU*(b.q*2-t*.16))),5);c.strokeStyle=wv>.05?'rgba(255,236,160,'+(.38+.6*wv)+')':'rgba(255,250,236,.38)';c.lineWidth=1.1+.9*wv;c.beginPath();c.moveTo(b.chev[0],b.chev[1]);c.lineTo(b.chev[2],b.chev[3]);c.lineTo(b.chev[4],b.chev[5]);c.stroke()}
  else if(b.kind==='land'){c.strokeStyle='rgba(58,44,110,.3)';c.lineWidth=.7;quad8(c,b.faces[2]);c.stroke();landMark(c,b,t,reduced,k)}
  // Coral blocks, gold shards and the runner.
  for(let j=0;j<obs.length;j++){const o=obs[j];if(o.rank!==i||o.lap!==run.lap)continue;coral(c,o,run,k,reduced)}
  if(run.intro<=0){for(let j=0;j<run.course.shards.length;j++){const s=run.course.shards[j];if(s.rank!==i||run.shards[j]||s.lap!==run.lap)continue;shard(c,s,t,j,reduced,k)}}
  if(run.itemList&&run.intro<=0){for(let j=0;j<run.itemList.length;j++){const it=run.itemList[j];if(it.rank!==i||it.lap!==run.lap)continue;root.MongyuItems.drawItem(c,it,pickupAt,t,reduced,0)}}
  if(runnerRank===i&&!(run.intro>0))runner(c,run,me,t,reduced,dead);
 }
 if(run.intro>0)introOrb(c,run,t,k);
 c.restore();
 // Mist swallows the pillars.
 const yb=oy+bd.b*scale+10,g=c.createLinearGradient(0,yb,0,h);const mc=hex(pal.sky[2]);g.addColorStop(0,rgba(mc,0));g.addColorStop(.55,rgba(mc,.75));g.addColorStop(1,rgba(mc,.96));c.fillStyle=g;c.fillRect(0,yb,w,h-yb);
 // Aurora gate rises from the seam landing during the second lap.
 const seam=iso(0,0,0),near=clamp((run.distance-(FINISH-LAP*.55))/(LAP*.4),0,1),outro=run.outro?.kind==='clear'?clamp(run.outro.age/.6,0,1):run.state==='clear'?1:0;
 aurora(c,ox+seam.x*scale,oy+(seam.y-1)*scale,near*.8+.45*outro,reduced?t*.2:t,scale*1.05,outro);
 if(finale>0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.12*finale;c.fillStyle=pal.mist;c.fillRect(0,0,w,h);c.restore()}
 ribbon(c,run,w,h,rise,reduced);
 hud(c,run,w,h,'펜로즈 계단 · '+(run.lap+1)+' / 2',{frac:run.distance/FINISH,marks:[{at:.5,lit:run.lap>=1}]},k);
 return null;
}
/* R105 pickup centre on the isometric stair (lane lo: runner chest height, hi: jump apex). */
function pickupAt(it){const q=iso(it.p[0],it.p[1]+(it.lane==='hi'?34:15),it.p[2]);return {x:q.x,y:q.y,s:.7}}
function quad8(c,q){c.beginPath();c.moveTo(q[0],q[1]);c.lineTo(q[2],q[3]);c.lineTo(q[4],q[5]);c.lineTo(q[6],q[7]);c.closePath()}
function landMark(c,b,t,reduced,k){
 if(b.k%4!==0)return;
 const cx=(b.box[0]+b.box[1])/2,cz=(b.box[4]+b.box[5])/2,p=iso(cx,b.box[3],cz),pulse=reduced?0:Math.sin(t*2.2);
 c.save();c.translate(p.x,p.y);c.scale(1,.5);c.strokeStyle=k.tap;c.lineWidth=2;c.globalAlpha=.7+.2*pulse;c.beginPath();c.arc(0,0,8.5,0,TAU);c.stroke();c.globalAlpha=.25;c.fillStyle=k.tapDeep;c.beginPath();c.arc(0,0,6,0,TAU);c.fill();c.restore();
}
function coral(c,o,run,k,reduced){
 const x=o.p[0],y=o.p[1],z=o.p[2],crashed=run.crash&&Math.abs(run.crash.s-o.at)<1;
 const P=(px,py,pz)=>iso(px,py,pz),q=(a,b2,c2,d)=>{c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b2.x,b2.y);c.lineTo(c2.x,c2.y);c.lineTo(d.x,d.y);c.closePath()};
 const x0=x-BLOCK,x1=x+BLOCK,z0=z-BLOCK,z1=z+BLOCK,y1=y+BLOCK_H;
 q(P(x0,y,z1),P(x1,y,z1),P(x1,y1,z1),P(x0,y1,z1));c.fillStyle=crashed?'#fff2ea':k.danger;c.fill();
 q(P(x1,y,z0),P(x1,y,z1),P(x1,y1,z1),P(x1,y1,z0));c.fillStyle=k.dangerSide;c.fill();
 q(P(x0,y1,z0),P(x1,y1,z0),P(x1,y1,z1),P(x0,y1,z1));c.fillStyle=k.dangerTop;c.fill();
 if(crashed&&run.outro&&!reduced){const age=clamp(run.outro.age/.6,0,1),p0=P(x,y+BLOCK_H*.5,z);c.globalAlpha=1-age;c.fillStyle=k.dangerTop;for(let i=0;i<9;i++){const a=i/9*TAU+.4,r=4+age*(16+(i%3)*8);c.fillRect(p0.x+Math.cos(a)*r-1.6,p0.y+Math.sin(a)*r*.6-age*10+age*age*14-1.6,3.2,3.2)}c.globalAlpha=1}
 const f=P(x1,y+BLOCK_H*.62,z);c.strokeStyle=k.dangerLine;c.globalAlpha=.6;c.lineWidth=.7;c.beginPath();c.moveTo(f.x,f.y-3);c.lineTo(f.x,f.y+3);c.stroke();c.globalAlpha=1;
}
function shard(c,s,t,i,reduced,k){const p=iso(s.p[0],s.p[1],s.p[2]);if(root.MongyuItems?.drawLight?.(c,p.x,p.y+(reduced?0:Math.sin(t*2+i)*1.5),12,t,i,reduced,0))return;gem(c,p.x,p.y+(reduced?0:Math.sin(t*2+i)*1.5),Math.PI/4+(reduced?0:t*1.4),k,3)}
function runner(c,run,me,t,reduced,dead){
 const p=iso(me.x,me.y,me.z);let ax=p.x,ay=p.y-run.height,alpha=1;
 if(run.outro?.kind==='clear')alpha=1-clamp(run.outro.age/.8,0,1);
 if(run.state==='clear')alpha=0;
 if(run.crash&&run.outro){const age=run.outro.age;ay+=age*age*140;alpha=1-clamp(age/FAIL_OUTRO,0,1)*.8}
 const blink=run.invuln>0&&!reduced&&Math.floor(run.clock*14)%2===0;
 c.globalAlpha=.4*alpha*(run.height>0?1-clamp(run.height/PEAK,0,1)*.45:1);c.fillStyle='#fff6dc';c.beginPath();c.ellipse(p.x,p.y,6,2.2,0,0,TAU);if(!run.crash)c.fill();
 c.globalAlpha=alpha*(blink?.45:1);
 const pose=run.crash?'hurt':run.state==='clear'||run.outro?.kind==='clear'?'joy':run.intro>0?'stand':run.flight!==null?'jump':'run';
 sprite(c,{x:ax,y:ay-1,bodyHeight:31,renderAngle:0,strideDistance:run.distance*2.2,nativeState:0,height:run.height,jumpProgress:run.flight===null?0:run.flight/run.fl,pose},t,reduced,me.dx<0||me.dz>0);
 c.globalAlpha=1;
 if(run.mods&&!run.outro)root.MongyuItems.drawAura(c,run,ax,ay-15,21,t,reduced);
 if(!reduced&&run.time-run.crossedAt<.3){const age=(run.time-run.crossedAt)/.3;c.globalAlpha=1-age;c.fillStyle=ink().tap;for(let i=0;i<6;i++){const a=i*Math.PI/3;c.fillRect(ax+Math.cos(a)*(9+age*18)-1.2,ay-18+Math.sin(a)*(9+age*18)-1.2,2.4,2.4)}c.globalAlpha=1}
}
/* Intro: a light traces the loop once so the endless climb is seen before it is run. */
function introOrb(c,run,t,k){
 const u=ease(clamp(1-run.intro/INTRO*1.05,0,1)),s=u*LAP,o={};
 c.save();
 for(let i=14;i>=0;i--){const q=pathAt(Math.max(0,s-i*9),o),p=iso(q.x,q.y+14,q.z);c.globalAlpha=(1-i/15)*.8;c.fillStyle=i?k.tapDeep:'#fffbe8';c.beginPath();c.arc(p.x,p.y,6-i*.3,0,TAU);c.fill()}
 c.restore();
}
/* Altitude ribbon: tick marks slide down as the stair climbs. */
function ribbon(c,run,w,h,rise,reduced){
 if(run.hudOff||run.state==='fail'||run.state==='clear')return;
 const x=Math.max(12,w*.045),gap=26,off=((rise*.9)%gap+gap)%gap,fade=run.outro?1-Math.min(1,run.outro.age/.35):1;
 c.save();c.globalAlpha=.5*fade;c.strokeStyle='rgba(255,243,226,.8)';c.lineWidth=1;
 const y0=h*.2,y1=h*.7;c.beginPath();c.moveTo(x,y0);c.lineTo(x,y1);c.stroke();
 for(let y=y0+off-gap;y<=y1;y+=gap){if(y<y0)continue;const a=Math.min(1,Math.min(y-y0,y1-y)/30);c.globalAlpha=.5*fade*a;c.beginPath();c.moveTo(x,y);c.lineTo(x+((Math.round((y-off-y0)/gap)%5)?4:8),y);c.stroke()}
 
 c.globalAlpha=fade;c.textAlign='center';c.font='700 13px system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(20,12,36,.6)';const txt='▲ 고도 '+Math.floor(run.climb)+'m';const ty=Math.max(14,h*.035)+74;c.strokeText(txt,w/2,ty);c.fillStyle='#ffeca5';c.fillText(txt,w/2,ty);
 c.restore();
}

/* ---------- AlignRun ---------- */
const PHI=45,ARC=34,WINDOW=5,SE=1/Math.sqrt(3),CE=Math.sqrt(2/3),KK=1/CE;
const GAPK=30,BW=26,BT=11,RUN_SPEED=84,SNAP_PAUSE=.12,WELD=.5,LEDGE=56,HALF=56,LZ=32;
const SX=HALF,BX0=SX+GAPK,BX1=BX0+HALF,RX1=BX1+LEDGE;
const AB={
 ledgeL:{box:[-LEDGE,0,-40,0,-LZ,LZ],tone:'stone'},
 pillarL:{box:[-LEDGE+14,-14,-520,-40,-12,12],tone:'pillar'},
 a:{box:[0,SX,-BT,0,-BW/2,BW/2],tone:'a'},
 b:{box:[BX0,BX1,GAPK-BT,GAPK,GAPK-BW/2,GAPK+BW/2],tone:'b'},
 ledgeR:{box:[BX1,RX1,GAPK-40,GAPK,GAPK-LZ,GAPK+LZ],tone:'stone'},
 pillarR:{box:[BX1+14,RX1-14,-520,GAPK-40,GAPK-12,GAPK+12],tone:'pillar'},
 postA:{box:[RX1-16,RX1-8,GAPK,GAPK+66,GAPK-24,GAPK-16],tone:'gate'},
 postB:{box:[RX1-16,RX1-8,GAPK,GAPK+66,GAPK+16,GAPK+24],tone:'gate'},
 lintel:{box:[RX1-17,RX1-7,GAPK+66,GAPK+74,GAPK-27,GAPK+27],tone:'gate'},
 lamp:{box:[-LEDGE+9,-LEDGE+14,0,22,-3,2],tone:'gate'}
};
const AORDER=depthOrder(Object.values(AB));
const CEN=[(-LEDGE+RX1)/2,0,GAPK/2];
const ATONE={dusk:{stone:'#e9dfff',a:'#ffe0a3',b:'#a9ead2',pillar:'#b9a4e6',gate:'#fff0d6'},dawn:{stone:'#ffe9df',a:'#ffd1c1',b:'#ffe9a8',pillar:'#e8c0cc',gate:'#fff4e2'}};
const ALIGN_TONES={};for(const v of ['dusk','dawn'])ALIGN_TONES[v]=Object.fromEntries(Object.entries(ATONE[v]).map(([k2,col])=>[k2,tones(hex(col))]));
const ASTART=-LEDGE*.55,AEND=RX1-30,LEN1=SX-ASTART,LEN2=AEND-BX0,A_TOTAL=LEN1+LEN2;
/* Path distance -> world point and the support box. The step from half A to half B runs along the view ray (invisible at the alignment yaw). */
function alignPath(s,o){
 if(s<=LEN1){o.x=ASTART+s;o.y=0;o.z=0;o.box=o.x<0?AB.ledgeL:AB.a}
 else{const d=s-LEN1;o.x=BX0+d;o.y=GAPK;o.z=GAPK;o.box=o.x<BX1?AB.b:AB.ledgeR}
 return o;
}
const ASHARDS=[{s:22,y:18},{s:50,y:21},{s:LEN1-6,y:19},{s:LEN1+16,y:19},{s:LEN1+40,y:21},{s:LEN1+66,y:19}].filter(s=>s.s<A_TOTAL-8);
function projA(x,y,z,yaw,o){const cy=Math.cos(yaw),sy=Math.sin(yaw),X=x-CEN[0],Y=y-CEN[1],Z=z-CEN[2];o.x=KK*(X*cy-Z*sy);o.y=KK*((X*sy+Z*cy)*SE-Y*CE);return o}

class AlignRun extends ActRun{
 constructor(options={}){
  super(options,'align');this.variant=options.variant==='dawn'?'dawn':'dusk';
  this.side=(this.seed&1)?1:-1;this.reset();
 }
 reset(){
  const cr=this.carry();
  this.state='ready';this.time=0;this.clock=0;this.updates=0;this.inputCount=0;this.hits=0;this.hearts=cr.hearts;this.events=[];this.buffer=0;
  this.points=cr.points;this.perfectStreak=cr.streak;this.score=this.points;this.crash=null;this.hitStop=0;this.outro=null;this.result=null;
  this.phase='orbit';this.phaseAt=0;this.p=this.side*-1.5;this.yaw=PHI+ARC*Math.sin(this.p);this.snapYaw=null;this.snapError=null;
  this.misses=0;this.passes=0;this.s=0;this.distance=0;this.shards=ASHARDS.map(()=>false);this.shardCount=0;this.perfects=0;this.pose='stand';this.crossedAt=-10;
  this.intro=this.skipIntro||reducedMotion()?0:.8;this.snapFlash=-10;this.nearMissAt=-10;this.assist=0;
  this.coach=this.firstTime?{kind:'align',text:COACH.align,until:6}:null;
 }
 /* Angular error from the alignment yaw, degrees. */
 get alignment(){return this.yaw-PHI}
 get window(){return WINDOW+this.assist}
 get aligned(){return this.phase==='orbit'&&Math.abs(this.alignment)<=this.window}
 action(){
  if(this.state!=='play'||this.outro||this.hitStop>0)return false;
  if(this.intro>0){this.intro=0;return true}
  this.inputCount++;
  if(this.phase!=='orbit')return false;
  if(this.aligned){this.snap();return true}
  // Early or late: no penalty, only a gentle nudge (and a slightly wider window after repeated misses).
  this.misses++;this.nearMissAt=this.clock;if(this.misses>=3)this.assist=Math.min(3,this.assist+1.5);
  this.setCoach(Math.abs(this.alignment)<18?'miss':'again',2);return false;
 }
 snap(){
  this.snapError=this.alignment;this.snapYaw=this.yaw;this.phase='snap';this.phaseAt=this.time;this.hitStop=SNAP_PAUSE;this.snapFlash=this.clock;this.events.push('corner');
  const perfect=Math.abs(this.snapError)<=2;this.perfectStreak=perfect?this.perfectStreak+1:0;if(perfect)this.perfects++;
  this.points+=150+(perfect?100:0);this.events.push(perfect?'perfect':'pass');this.setCoach('snap',2.4);this.pose='joy';
 }
 tick(dt){
  if(this.state!=='play')return;
  this.updates++;this.clock+=dt;
  if(this.hitStop>0){this.hitStop=Math.max(0,this.hitStop-dt);if(this.hitStop===0){this.phase='weld';this.phaseAt=this.time}return}
  if(this.outro){this.outro.age+=dt;if(this.outro.age>=this.outro.duration)this.finish(this.outro.kind);return}
  if(this.intro>0){this.intro=Math.max(0,this.intro-dt);return}
  this.time+=dt;const reduced=reducedMotion();
  if(this.phase==='orbit'){
   // Slow beat-linked swing (half period = 4 beats); it slows near the alignment so the window is comfortable.
   const beat=60/this.bpm,omega=Math.PI/(4*beat)*(reduced?.6:1),g=.42+.58*sstep(0,20,Math.abs(this.alignment));
   const before=this.alignment;this.p+=omega*g*dt;this.yaw=PHI+ARC*Math.sin(this.p);
   if(before*this.alignment<0)this.passes++;
   if(this.coach?.kind==='align'&&this.time>5.5&&this.passes<2){this.setCoach('align',2)}
  }else if(this.phase==='weld'){
   const k=clamp((this.time-this.phaseAt)/WELD,0,1);this.yaw=PHI+(this.snapYaw-PHI)*(1-easeOut(k));
   if(k>=1){this.yaw=PHI;this.phase='cross';this.phaseAt=this.time;this.pose='run';this.setCoach('cross',1.6)}
  }else if(this.phase==='cross'){
   const before=this.s;this.s=Math.min(A_TOTAL,this.s+RUN_SPEED*dt);this.distance=this.s;
   for(let i=0;i<ASHARDS.length;i++)if(!this.shards[i]&&this.s>=ASHARDS[i].s-4){this.shards[i]=true;this.shardCount++;this.points+=25}
   if(this.s>=A_TOTAL&&before<A_TOTAL){this.points+=200;this.pose='joy';this.setCoach('gate',2);this.finishLine('clear')}
  }
  this.score=this.points+Math.floor(this.s/10);
 }
 finish(state){
  this.state=state;this.outro=null;
  this.result={mode:'align',state,score:this.score,points:this.points,distance:Math.floor(this.s),progress:this.s/A_TOTAL,shards:this.shardCount,shardTotal:ASHARDS.length,misses:this.misses,perfects:this.perfects,
   perfectStreak:this.perfectStreak,snapError:this.snapError,hearts:this.hearts,time:this.time,attempt:this.attempt,reason:'두 길이 하나로 이어졌어요.'};
  this.events.push(state);
 }
 progress(){return this.state==='clear'?1:this.phase==='cross'?.4+.6*this.s/A_TOTAL:this.phase==='orbit'?.04+.3*clamp(1-Math.abs(this.alignment)/ARC,0,1):.4}
 status(){
  return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:this.score,best:0,progress:this.progress(),
   roomTitle:'시점 정렬 · 고요',roomIndex:0,roomCount:1,instruction:'탭: 두 길이 겹칠 때 정렬',cue:null,result:this.result};
 }
 drawSelf(ctx,opts){return drawAlign(ctx,this,opts)}
}

const A1={x:0,y:0},A2={x:0,y:0},A3={x:0,y:0},A4={x:0,y:0},A5={x:0,y:0};
function face(c,a,b,d,e,fill){c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(d.x,d.y);c.lineTo(e.x,e.y);c.closePath();c.fillStyle=fill;c.fill()}
/* Box seen from yaw in (0,90) degrees: +z face (left), +x face (right), top. */
function box3(c,e,yaw,tn,edge){
 const [x0,x1,y0,y1,z0,z1]=e.box,P=projA;
 face(c,P(x0,y0,z1,yaw,A1),P(x1,y0,z1,yaw,A2),P(x1,y1,z1,yaw,A3),P(x0,y1,z1,yaw,A4),tn[1]);
 face(c,P(x1,y0,z0,yaw,A1),P(x1,y0,z1,yaw,A2),P(x1,y1,z1,yaw,A3),P(x1,y1,z0,yaw,A4),tn[2]);
 face(c,P(x0,y1,z0,yaw,A1),P(x1,y1,z0,yaw,A2),P(x1,y1,z1,yaw,A3),P(x0,y1,z1,yaw,A4),tn[0]);
 if(edge){c.strokeStyle='rgba(58,44,110,.3)';c.lineWidth=.7;c.stroke()}
}
function drawAlign(c,run,opts){
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,k=ink(),pal=SKIES[run.variant],tn=ALIGN_TONES[run.variant];
 const yaw=run.yaw*DEG;
 let lo=1e9,hi=-1e9;for(let i=0;i<4;i++){const q=projA(i&1?RX1:-LEDGE,0,i&2?GAPK+LZ:-LZ,yaw,A5);lo=Math.min(lo,q.x);hi=Math.max(hi,q.x)}
 let scale=clamp(w*.9/Math.max(1,hi-lo),.62,2.2);
 const introK=run.intro>0?ease(1-run.intro/.8):1,done=run.state==='clear'?1:run.outro?ease(clamp(run.outro.age/1.4,0,1)):0;
 scale*=(.9+.1*introK)*(1-.08*done);
 const wob=reduced?0:Math.sin(t*.4)*3,ox=w/2,oy=h*.46+wob;
 c.save();
 backdrop(c,w,h,t,pal,reduced,(run.yaw-PHI)*6,t*(reduced?3:9),h*.4);
 c.translate(ox,oy);c.scale(scale,scale);
 const sa=projA(SX,0,0,yaw,{x:0,y:0}),sb=projA(BX0,GAPK,GAPK,yaw,{x:0,y:0}),near=run.phase==='orbit'?clamp(1-Math.abs(run.alignment)/20,0,1):1,inwin=run.aligned;
 const me=alignPath(clamp(run.s,0,A_TOTAL),{}),eb=[me.x-4,me.x+4,me.y,me.y+34,me.z-4,me.z+4],bIdx=AORDER.indexOf(AB.b);
 let runnerAt=AORDER.length;for(let i=0;i<AORDER.length;i++){const bx=AORDER[i].box;if(behind(eb,bx)&&!behind(bx,eb)){runnerAt=i;break}}
 const gp=projA(RX1-12,GAPK+2,GAPK,yaw,{x:0,y:0}),open=run.phase==='cross'?clamp(run.s/A_TOTAL,0,1):0,outro=run.outro?clamp(run.outro.age/.6,0,1):run.state==='clear'?1:0;
 for(let i=0;i<=AORDER.length;i++){
  if(i===runnerAt)alignRunner(c,run,me,yaw,t,reduced);
  if(i===AORDER.length)break;
  const e=AORDER[i];box3(c,e,yaw,tn[e.tone],e.tone==='a'||e.tone==='b');
  if(e===AB.a||e===AB.b)bridgeTop(c,e,yaw);
  else if(e===AB.ledgeL||e===AB.ledgeR)inlay(c,e,yaw,run.variant);
  if(e===AB.lamp)lampGlow(c,yaw,t,reduced);
  if(e===AB.ledgeR)gateFloor(c,yaw,k);
  if(e===AB.postA)aurora(c,gp.x,gp.y,.1+.5*open+.4*outro,reduced?t*.2:t,.42,outro);
  if(i===bIdx){for(let j=0;j<ASHARDS.length;j++){if(run.shards[j])continue;const sh=ASHARDS[j],q=alignPath(sh.s,{}),p=projA(q.x,q.y+sh.y,q.z,yaw,A5);gem(c,p.x,p.y+(reduced?0:Math.sin(t*2+j)*1.5),Math.PI/4+(reduced?0:t*1.4),k,3)}}
 }
 seamFx(c,run,sa,sb,near,inwin,yaw,t,reduced,k);
 c.restore();
 const mc=hex(pal.sky[2]),yb=oy+h*.14,g=c.createLinearGradient(0,yb,0,h);g.addColorStop(0,rgba(mc,0));g.addColorStop(.6,rgba(mc,.7));g.addColorStop(1,rgba(mc,.95));c.fillStyle=g;c.fillRect(0,yb,w,h-yb);
 if(done>0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.12*done;c.fillStyle=pal.mist;c.fillRect(0,0,w,h);c.restore()}
 if(run.firstTime&&run.phase==='orbit'&&run.misses===0&&run.state==='play'&&near>.5&&run.intro<=0)finger(c,ox+(sa.x+sb.x)/2*scale+4,oy+(sa.y+sb.y)/2*scale+24,t,reduced);
 if(!reduced&&t-run.snapFlash<.5&&run.snapFlash>0){const age=(t-run.snapFlash)/.5;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-age)*.1;c.fillStyle='#fff6d8';c.fillRect(0,0,w,h);c.restore()}
 orbitTrack(c,run,w,h,t,reduced,k);
 hud(c,run,w,h,'시점 정렬 · 고요',{frac:run.progress(),marks:[{at:.4,lit:run.phase!=='orbit'}]},k);
 return null;
}
/* Yaw meter: a dot swings along a track; the gold zone is the +-5 degree window. */
function orbitTrack(c,run,w,h,t,reduced,k){
 if(run.state!=='play'||run.hudOff||run.phase!=='orbit')return;
 const tw=Math.min(w*.46,170),x0=w/2-tw/2,y=h*.805,span=ARC*1.25,zone=tw*(run.window/span)/2,px=w/2+clamp(run.alignment/span,-1,1)*tw/2;
 c.save();c.globalAlpha=.9;c.lineCap='round';c.lineWidth=3;c.strokeStyle='rgba(255,255,255,.2)';c.beginPath();c.moveTo(x0,y);c.lineTo(x0+tw,y);c.stroke();
 c.lineWidth=5;c.strokeStyle=run.aligned?'#fff3c4':'rgba(255,226,150,.6)';c.beginPath();c.moveTo(w/2-zone,y);c.lineTo(w/2+zone,y);c.stroke();
 c.fillStyle=run.aligned?'#ffffff':'#ffeca5';c.beginPath();c.arc(px,y,run.aligned?5.5:4,0,TAU);c.fill();
 if(run.aligned&&!reduced){c.globalAlpha=.4;c.strokeStyle='#fff3c4';c.lineWidth=1.5;c.beginPath();c.arc(px,y,9+Math.sin(t*10)*1.5,0,TAU);c.stroke()}
 c.restore();
}
function bridgeTop(c,e,yaw){
 const [x0,x1,,y1,z0,z1]=e.box,zc=(z0+z1)/2,a=projA(x0+4,y1,zc,yaw,A1),b=projA(x1-4,y1,zc,yaw,A2);
 c.strokeStyle='rgba(255,246,214,.6)';c.lineWidth=1;c.setLineDash([3,4]);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.setLineDash([]);
}
/* Lighter paving inlay and a rim on ledge tops. */
function inlay(c,e,yaw,variant){
 const [x0,x1,,y1,z0,z1]=e.box,m=7,P=projA;
 face(c,P(x0+m,y1+.1,z0+m,yaw,A1),P(x1-m,y1+.1,z0+m,yaw,A2),P(x1-m,y1+.1,z1-m,yaw,A3),P(x0+m,y1+.1,z1-m,yaw,A4),'rgba(255,255,255,.2)');
 c.strokeStyle='rgba(58,44,110,.22)';c.lineWidth=.7;c.stroke();
}
function lampGlow(c,yaw,t,reduced){const p=projA(-LEDGE+11.5,24,0,yaw,A5),pulse=reduced?0:Math.sin(t*1.7)*.08;for(const [r,a] of [[16,.1],[9,.2],[3.8,.9]]){c.globalAlpha=a+pulse;c.fillStyle='#ffe8a8';c.beginPath();c.arc(p.x,p.y,r,0,TAU);c.fill()}c.globalAlpha=1}
function gateFloor(c,yaw,k){const p=projA(RX1-12,GAPK,GAPK,yaw,A5);c.save();c.translate(p.x,p.y);c.scale(1,.5);c.strokeStyle=k.tap;c.globalAlpha=.55;c.lineWidth=2;c.beginPath();c.arc(0,0,17,0,TAU);c.stroke();c.restore();c.globalAlpha=1}
function alignRunner(c,run,me,yaw,t,reduced){
 const p=projA(me.x,me.y,me.z,yaw,A5);let alpha=1;
 if(run.state==='clear')alpha=0;else if(run.outro?.kind==='clear')alpha=1-clamp(run.outro.age/.9,0,1);
 c.globalAlpha=.4*alpha;c.fillStyle='#fff6dc';c.beginPath();c.ellipse(p.x,p.y,6,2.2,0,0,TAU);c.fill();c.globalAlpha=alpha;
 const walking=run.phase==='cross'&&run.s<A_TOTAL,bob=reduced||walking?0:Math.sin(t*1.8)*.6,pose=walking?'run':run.pose==='joy'?'joy':'stand';
 sprite(c,{x:p.x,y:p.y-1+bob,bodyHeight:40,renderAngle:0,strideDistance:run.s*2.2,nativeState:0,height:0,jumpProgress:0,pose},t,reduced,false);
 c.globalAlpha=1;
}
/* Seam: a gold thread joins the two bridge ends while they are apart and collapses as they align; on the snap the
   two toothed edges interlock and a ring of light spreads. */
function seamFx(c,run,sa,sb,near,inwin,yaw,t,reduced,k){
 const phase=run.phase,mx=(sa.x+sb.x)/2,my=(sa.y+sb.y)/2;
 c.save();
 if(phase==='orbit'){
  c.globalAlpha=.35+.5*near;c.strokeStyle=k.tap;c.lineWidth=1.4+near;c.setLineDash([2,3]);c.beginPath();c.moveTo(sa.x,sa.y);c.lineTo(sb.x,sb.y);c.stroke();c.setLineDash([]);
  gem(c,sa.x,sa.y-1,Math.PI/4,k,2.4+near*1.4);gem(c,sb.x,sb.y-1,Math.PI/4,k,2.4+near*1.4);
  c.globalCompositeOperation='lighter';{const r=16+30*near,g=c.createRadialGradient(mx,my,0,mx,my,r);g.addColorStop(0,'rgba(255,236,165,'+(.12+.5*near)+')');g.addColorStop(1,'rgba(255,236,165,0)');c.globalAlpha=1;c.fillStyle=g;c.fillRect(mx-r,my-r,r*2,r*2)}
  if(inwin){const pulse=reduced?.5:.5+.5*Math.sin(t*9);c.globalAlpha=.55+.3*pulse;c.strokeStyle='#fff6d0';c.lineWidth=2;c.beginPath();c.ellipse(mx,my,22+pulse*3,11+pulse*1.5,0,0,TAU);c.stroke()}
 }else if(phase==='snap'||phase==='weld'){
  const age=phase==='snap'?0:clamp((run.time-run.phaseAt)/WELD,0,1),gap=1-easeOut(age);
  const z0=-BW/2+2,z1=BW/2-2,a1=projA(SX,0,z0,yaw,{x:0,y:0}),a2=projA(SX,0,z1,yaw,{x:0,y:0}),b1=projA(BX0,GAPK,GAPK+z0,yaw,{x:0,y:0}),b2=projA(BX0,GAPK,GAPK+z1,yaw,{x:0,y:0});
  c.strokeStyle='#fff3c8';c.lineWidth=1.6;c.globalAlpha=.95;c.lineJoin='round';
  for(const [p1,p2,sgn] of [[a1,a2,-1],[b1,b2,1]]){c.beginPath();for(let i=0;i<=6;i++){const u=i/6,x=p1.x+(p2.x-p1.x)*u,y=p1.y+(p2.y-p1.y)*u,s=(i%2?1:-1)*3.2*(.3+gap)*sgn;c.lineTo(x+s*C,y+s*.5)}c.stroke()}
  c.globalCompositeOperation='lighter';
  const ring=phase==='weld'?age:0;c.globalAlpha=(1-ring)*.8;c.strokeStyle='#fff6d0';c.lineWidth=2.4;c.beginPath();c.ellipse(mx,my,10+ring*70,5+ring*35,0,0,TAU);c.stroke();
  c.globalAlpha=(1-ring)*.35;c.fillStyle=k.tap;c.beginPath();c.arc(mx,my,18+ring*20,0,TAU);c.fill();
  if(!reduced)for(let i=0;i<10;i++){const a=i/10*TAU+.3,r=8+ring*(30+(i%3)*14);c.globalAlpha=(1-ring)*.9;c.fillStyle='#ffe9a8';c.fillRect(mx+Math.cos(a)*r-1.3,my+Math.sin(a)*r*.5-1.3,2.6,2.6)}
 }else if(phase==='cross'){
  const age=clamp((run.time-run.phaseAt)/.9,0,1);
  c.globalCompositeOperation='lighter';c.globalAlpha=(1-age)*.5;c.strokeStyle='#fff6d0';c.lineWidth=1.6;c.beginPath();c.ellipse(mx,my,20+age*26,10+age*13,0,0,TAU);c.stroke();
 }
 c.restore();
}

const api=Object.freeze({enabled,PenroseRun,AlignRun,LOOP,LAP,FINISH,SPEEDS,FLIGHT,PEAK,BLOCK,BLOCK_H,FOOT,PHI,ARC,WINDOW,A_TOTAL,makeCourse,pathAt,climbAt,draw:drawPenrose,drawAlign,COACH});
root.MongyuPenrose=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
