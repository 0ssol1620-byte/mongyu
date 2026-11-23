/* Authored square depth field. Presentation only; no collision, rewards or RNG. */
(function(root){'use strict';
function inkFor(color,preferred='#18121d'){
 const rgb=color.match(/^#([0-9a-f]{6})$/i);if(!rgb)return preferred;
 const v=[0,2,4].map(i=>{const x=parseInt(rgb[1].slice(i,i+2),16)/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4}),l=.2126*v[0]+.7152*v[1]+.0722*v[2];
 const bright=preferred!=='#18121d';if(bright&&l>.45){if(preferred==='#fff8de')return '#18121d';return '#'+[1,3,5].map(i=>Math.round(parseInt(preferred.slice(i,i+2),16)*.32).toString(16).padStart(2,'0')).join('')}return !bright&&l<.17?'#fff8de':preferred;
}
function backgroundAt(scene,p,viewport,x,y,reduced){
 const palette=root.MongyuNativePalette;if(!palette)return p[0];const size=Math.min(viewport.width,viewport.height),px=((x%size)+size)%size/size*240,py=((y%size)+size)%size/size*240;let color=p[0];
 for(const cmd of scene.backgrounds||[]){if(cmd.role==='background-fill')color=reduced?p[0]:palette.color(scene.palette,{rgb:cmd.rgb});else if(px>=cmd.x-scene.origin.x&&px<cmd.x-scene.origin.x+cmd.width&&py>=cmd.y-scene.origin.y&&py<cmd.y-scene.origin.y+cmd.height){let role=cmd.colorRole;if(reduced){const x=Math.floor((cmd.x-scene.origin.x)/30),y=Math.floor((cmd.y-scene.origin.y)/30),a=y*8+x,fold=a>31?63-a:a;role={...role,packedPaletteOffset:112+Math.trunc(fold/2),nibble:fold%2?'high':'low'}}color=palette.color(scene.palette,role,reduced)}}return color;
}
function fieldSpec(level='balanced',reduced=false){
 const gain=level==='calm'?.22:level==='intense'?1:.7;
 return {gain,panels:reduced?48:level==='calm'?48:level==='intense'?128:96,frames:level==='calm'?4:level==='intense'?12:8,motion:!reduced};
}
const mesh=new Float64Array(600);
function draw(c,cam,profile,p,time=0,reduced=false,opt={}){
 const w=cam.width,h=cam.height,unit=Math.min(w,h),spec=fieldSpec(opt.intensity,reduced),t=reduced?0:time,phase=profile.field,colors=opt.colors||[p[0],p[2],p[3],p[0]],focus=opt.focus||{x:w/2,y:h/2},tempo=Number.isFinite(opt.tempo)?opt.tempo:120;
 const breath=reduced?0:.5+.5*Math.sin(t*tempo/60/16*Math.PI*2);let cell=unit*(opt.intensity==='intense'?.18:opt.intensity==='calm'?.4:.25),columns=Math.ceil(w/cell)+2,rows=Math.ceil(h/cell)+2;
 while(columns*rows>spec.panels){cell*=1.1;columns=Math.ceil(w/cell)+2;rows=Math.ceil(h/cell)+2}
 // Shared vertices create one connected, breathing mosaic rather than floating cards.
 for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
  let x=(col-1)*cell,y=(row-1)*cell,dx=x-w/2,dy=y-h/2,r=Math.hypot(dx,dy)/unit;
  const twist=phase==='orbit'?.15*Math.sin(t*.24-r*1.7):phase==='mirror'?.09*Math.sin(t*.24-r):0,co=Math.cos(twist),si=Math.sin(twist);
  x=w/2+dx*co-dy*si+Math.sin(t*.4+row*.67)*cell*(phase==='flow'?.28:.13)+cam.offsetX*.018;
  y=h/2+dx*si+dy*co+Math.sin(t*.31+col*.63)*cell*.13+cam.offsetY*.018;
  if(phase==='pulse'){const scale=1+.025*Math.sin(t*.45+r*2);x=w/2+(x-w/2)*scale;y=h/2+(y-h/2)*scale}
  const index=(row*(columns+1)+col)*2;mesh[index]=x;mesh[index+1]=y;
 }
 let panels=0,frames=0;c.save();
 for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
  const a=(row*(columns+1)+col)*2,b=a+2,d=a+(columns+1)*2,e=d+2,minX=Math.min(mesh[a],mesh[b],mesh[d],mesh[e]),maxX=Math.max(mesh[a],mesh[b],mesh[d],mesh[e]),minY=Math.min(mesh[a+1],mesh[b+1],mesh[d+1],mesh[e+1]),maxY=Math.max(mesh[a+1],mesh[b+1],mesh[d+1],mesh[e+1]),dx=Math.max(0,minX-focus.x,focus.x-maxX),dy=Math.max(0,minY-focus.y,focus.y-maxY),clear=Math.max(0,Math.min(1,(Math.hypot(dx,dy)-unit*.08)/(unit*.25)));
  if(clear<.01)continue;
  const ix=Math.floor(Math.abs(col-columns/2)),iy=Math.floor(Math.abs(row-rows/2)),key=phase==='mirror'||phase==='orbit'?ix+iy:phase==='flow'?row*2+col:row+col;
  c.globalAlpha=spec.gain*(.25+.07*breath)*clear;c.fillStyle=colors[key%colors.length];c.beginPath();c.moveTo(mesh[a],mesh[a+1]);c.lineTo(mesh[b],mesh[b+1]);c.lineTo(mesh[e],mesh[e+1]);c.lineTo(mesh[d],mesh[d+1]);c.closePath();c.fill();panels++;
 }
 // Nested squares unfold around two off-centre vanishing points.
 const morph=reduced?0:Math.sin(Math.PI*Math.max(0,Math.min(1,opt.morph||0)));
 c.lineWidth=Math.max(1.3,unit/240);
 for(let i=0;i<spec.frames;i++){
  const lane=i%2,depth=Math.floor(i/2),size=unit*(.24+depth*.19)*(1+.06*Math.sin(t*.4+depth*.8)+morph*.14),cx=w*(lane?.81:.19),cy=h*(lane?.67:.33);
  const angle=(lane?-1:1)*(Math.PI/4+Math.sin(t*.17+depth*.31)*.2+depth*.12),dx=focus.x-cx,dy=focus.y-cy,ax=Math.abs(dx*Math.cos(angle)+dy*Math.sin(angle)),ay=Math.abs(-dx*Math.sin(angle)+dy*Math.cos(angle)),half=size/2,distance=ax<=half&&ay<=half?half-Math.max(ax,ay):Math.hypot(Math.max(0,ax-half),Math.max(0,ay-half)),clear=Math.max(0,Math.min(1,(distance-unit*.075)/(unit*.12)));if(clear<.01)continue;
  c.save();c.translate(cx,cy);c.rotate(angle);c.globalAlpha=spec.gain*(.12+.04*breath+morph*.035)*clear;c.strokeStyle=colors[(i+1)%colors.length];c.strokeRect(-size/2,-size/2,size,size);c.restore();frames++;
 }
 c.restore();return {panels,frames,budgetFrames:spec.frames,profile:profile.id,intensity:opt.intensity||'balanced',motion:spec.motion};
}
// R104 polish sky: a cached per-chapter night (gradient, moon, stars, vignette), one
// cached far-architecture layer moved at 0.2x camera parallax and three cached fog bands.
// Nothing here is rebuilt per frame; only drawImage offsets and a few motes change.
const PARALLAX=.2,MARGIN=64;
function surface(w,h){
 w=Math.max(1,Math.ceil(w));h=Math.max(1,Math.ceil(h));
 if(typeof root.OffscreenCanvas==='function')return new root.OffscreenCanvas(w,h);
 const d=root.document;if(d&&typeof d.createElement==='function'){const s=d.createElement('canvas');if(s&&typeof s.getContext==='function'){s.width=w;s.height=h;return s}}
 return null;
}
function hexRgb(h){return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16))}
function mix(a,b,u){const x=hexRgb(a),y=hexRgb(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*u).toString(16).padStart(2,'0')).join('')}
function rgba(h,a){const x=hexRgb(h);return 'rgba('+x[0]+','+x[1]+','+x[2]+','+a+')'}
function seeded(seed){let s=seed>>>0;return ()=>{s=(s+0x6d2b79f5)>>>0;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const glowCache=new Map();
function glow(color,size=64){
 const key=color+':'+size;if(glowCache.has(key))return glowCache.get(key);
 const s=surface(size,size);if(!s){glowCache.set(key,null);return null}
 const g=s.getContext('2d'),r=size/2,grad=g.createRadialGradient(r,r,0,r,r,r);
 grad.addColorStop(0,rgba(color,1));grad.addColorStop(.28,rgba(color,.55));grad.addColorStop(.62,rgba(color,.16));grad.addColorStop(1,rgba(color,0));
 g.fillStyle=grad;g.fillRect(0,0,size,size);glowCache.set(key,s);return s;
}
function paintBase(g,w,h,p,rand){
 const sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,p.sky[0]);sky.addColorStop(.62,mix(p.sky[0],p.sky[1],.72));sky.addColorStop(1,p.sky[1]);
 g.fillStyle=sky;g.fillRect(0,0,w,h);
 const unit=Math.min(w,h),hz=g.createRadialGradient(w*.5,h*.92,0,w*.5,h*.92,Math.max(w,h)*.8);
 hz.addColorStop(0,rgba(p.glow,.2));hz.addColorStop(.5,rgba(p.glow,.07));hz.addColorStop(1,rgba(p.glow,0));g.fillStyle=hz;g.fillRect(0,0,w,h);
 // A large pale moon with the first memory's wide contour rings.
 const mx=w*.72,my=h*.15,mr=unit*.13,halo=g.createRadialGradient(mx,my,mr*.6,mx,my,mr*3.4);
 halo.addColorStop(0,rgba(p.glow,.3));halo.addColorStop(1,rgba(p.glow,0));g.fillStyle=halo;g.fillRect(0,0,w,h);
 const disc=g.createRadialGradient(mx-mr*.3,my-mr*.3,mr*.1,mx,my,mr);disc.addColorStop(0,rgba(mix(p.glow,'#fffaf0',.75),.6));disc.addColorStop(.7,rgba(mix(p.glow,'#fffaf0',.35),.32));disc.addColorStop(1,rgba(p.glow,.16));
 g.beginPath();g.arc(mx,my,mr,0,Math.PI*2);g.fillStyle=disc;g.fill();
 g.lineWidth=1;for(const [r,a] of [[unit*.58,.09],[unit*.82,.06],[unit*1.1,.04]]){g.beginPath();g.arc(w*.5,h*.4,r,0,Math.PI*2);g.strokeStyle=rgba(p.glow,a);g.stroke()}
 for(let i=0;i<54;i++){const x=rand()*w,y=rand()*h*.7,r=.45+rand()*.9;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=rgba(mix(p.glow,'#ffffff',.6),.12+rand()*.42);g.fill()}
 const v=g.createRadialGradient(w/2,h*.46,unit*.32,w/2,h*.46,Math.max(w,h)*.78);
 v.addColorStop(0,rgba(p.sky[0],0));v.addColorStop(1,rgba(mix(p.sky[0],'#000000',.35),.62));g.fillStyle=v;g.fillRect(0,0,w,h);
}
// A floating fragment: stepped rock keel, tiled roofs, towers, arches and lit windows.
function island(g,x,y,s,tone,p,rand,lit){
 const keel=[[x-s,y],[x+s,y],[x+s*.82,y+s*.22],[x+s*.55,y+s*.28],[x+s*.42,y+s*.55],[x+s*.18,y+s*.62],[x+s*.04,y+s*1.05],[x-s*.12,y+s*.6],[x-s*.4,y+s*.5],[x-s*.62,y+s*.26],[x-s*.88,y+s*.2]];
 g.beginPath();keel.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.closePath();g.fillStyle=tone;g.fill();
 g.fillStyle=rgba(mix(tone,'#000000',.25),.6);g.fillRect(x-s,y,s*2,Math.max(1,s*.05));
 let cx=x-s*.86;const pieces=2+Math.floor(rand()*3);
 for(let i=0;i<pieces&&cx<x+s*.8;i++){
  const bw=s*(.32+rand()*.38),bh=s*(.25+rand()*.6),bx=cx,top=y-bh;cx+=bw+s*(.04+rand()*.1);if(bx+bw>x+s*.95)break;
  g.fillStyle=tone;g.fillRect(bx,top,bw,bh);
  const kind=rand();
  if(kind<.45){ // curved hanok roof with lifted eaves
   const over=bw*.22,rh=Math.max(2,bw*.2);g.beginPath();g.moveTo(bx-over,top+rh*.15);g.quadraticCurveTo(bx+bw*.15,top+rh*.55,bx+bw*.3,top-rh*.55);g.lineTo(bx+bw*.7,top-rh*.55);g.quadraticCurveTo(bx+bw*.85,top+rh*.55,bx+bw+over,top+rh*.15);g.lineTo(bx+bw+over*.6,top+rh*.45);g.lineTo(bx-over*.6,top+rh*.45);g.closePath();g.fill();
   if(lit){g.strokeStyle=rgba(p.glow,.28);g.lineWidth=.8;g.beginPath();g.moveTo(bx-over,top+rh*.15);g.quadraticCurveTo(bx+bw*.15,top+rh*.55,bx+bw*.3,top-rh*.55);g.lineTo(bx+bw*.7,top-rh*.55);g.quadraticCurveTo(bx+bw*.85,top+rh*.55,bx+bw+over,top+rh*.15);g.stroke()}
  }else if(kind<.7){ // slim tower with a spire
   g.fillRect(bx+bw*.3,top-bh*.5,bw*.4,bh*.5);g.beginPath();g.moveTo(bx+bw*.24,top-bh*.5);g.lineTo(bx+bw*.5,top-bh*.82);g.lineTo(bx+bw*.76,top-bh*.5);g.closePath();g.fill();
  }else{ // arcade with arched openings
   g.fillStyle=rgba(mix(tone,'#000000',.35),.7);const n=Math.max(1,Math.round(bw/(s*.16)));for(let k=0;k<n;k++){const ax=bx+bw*(k+.5)/n,ar=bw/n*.28;g.beginPath();g.moveTo(ax-ar,y);g.lineTo(ax-ar,y-bh*.42);g.arc(ax,y-bh*.42,ar,Math.PI,0);g.lineTo(ax+ar,y);g.closePath();g.fill()}
  }
  if(lit){const n=Math.floor(bh/(s*.16));for(let k=0;k<n;k++)if(rand()<.42){g.fillStyle=rgba(p.lamp,.32+rand()*.3);g.fillRect(bx+bw*(.2+rand()*.6),top+bh*(.2+k/(n+1)*.7),Math.max(1,s*.035),Math.max(1.4,s*.07))}}
  if(lit){g.fillStyle=rgba(p.glow,.2);g.fillRect(bx,top,bw,Math.max(.8,s*.025))}
 }
 if(lit){g.strokeStyle=rgba(p.glow,.3);g.lineWidth=1;g.beginPath();g.moveTo(x-s,y+.5);g.lineTo(x+s,y+.5);g.stroke()}
}
function paintFar(g,w,h,p,rand){
 const far=mix(p.far,p.fog,.32),unit=Math.min(w,h);
 // Distant row: small, fog-tinted fragments high in the sky.
 for(let i=0;i<5;i++){const x=w*(i+.3+rand()*.4)/5,y=h*(.26+rand()*.16),s=unit*(.05+rand()*.04);g.globalAlpha=.55;island(g,x,y,s,far,p,rand,false)}
 // Nearer row: larger fragments toward both sides, leaving the centre calm.
 g.globalAlpha=.85;
 for(let i=0;i<4;i++){const side=i%2,x=side?w*(.78+rand()*.2):w*(.02+rand()*.2),y=h*(.5+i*.11+rand()*.06),s=unit*(.1+rand()*.07);island(g,x,y,s,p.far,p,rand,true)}
 // A faint arched aqueduct crossing the middle distance.
 g.globalAlpha=.2;g.fillStyle=far;const by=h*(.4+rand()*.06),ax0=w*.18,ax1=w*.82,deck=unit*.012,span=(ax1-ax0)/9;
 g.fillRect(ax0,by,ax1-ax0,deck);for(let k=0;k<9;k++){const x=ax0+k*span;g.beginPath();g.moveTo(x,by+deck);g.lineTo(x+span,by+deck);g.lineTo(x+span,by+deck+unit*.05);g.lineTo(x+span*.88,by+deck+unit*.05);g.arc(x+span/2,by+deck+unit*.05,span*.38,0,Math.PI,true);g.lineTo(x,by+deck+unit*.05);g.closePath();g.fill()}
 g.globalAlpha=1;
}
function paintFog(g,w,h,p){
 const v=g.createLinearGradient(0,0,0,h);v.addColorStop(0,rgba(p.fog,0));v.addColorStop(.5,rgba(p.fog,.42));v.addColorStop(1,rgba(p.fog,0));g.fillStyle=v;g.fillRect(0,0,w,h);
 // Horizontally tileable breaks so drifting fog is never a flat stripe.
 g.globalCompositeOperation='destination-in';const x=g.createLinearGradient(0,0,w,0);
 for(const [o,a] of [[0,.85],[.18,.45],[.36,1],[.55,.5],[.72,.95],[.88,.4],[1,.85]])x.addColorStop(o,'rgba(0,0,0,'+a+')');
 g.fillStyle=x;g.fillRect(0,0,w,h);g.globalCompositeOperation='source-over';
}
const skyCache={key:null};
function skyLayers(w,h,dpr,chapter){
 const p=root.MongyuNativePalette?.chapter?.(chapter);if(!p)return null;
 const key=p.index+':'+w+'x'+h+'@'+dpr;if(skyCache.key===key)return skyCache;
 const base=surface(w*dpr,h*dpr);if(!base)return null;
 const rand=seeded(9173+p.index*7919);let g=base.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);paintBase(g,w,h,p,rand);
 const fd=Math.min(dpr,1.25),far=surface((w+2*MARGIN)*fd,(h+2*MARGIN)*fd);if(far){g=far.getContext('2d');g.setTransform(fd,0,0,fd,0,0);g.translate(MARGIN,MARGIN);paintFar(g,w,h,p,rand)}
 const fog=surface(256,48);if(fog){g=fog.getContext('2d');paintFog(g,256,48,p)}
 Object.assign(skyCache,{key,palette:p,base,far,fog,w,h,builds:(skyCache.builds||0)+1});return skyCache;
}
function sky(c,viewport,chapter,cam,time=0,reduced=false){
 const w=Math.max(1,viewport.width|0||cam?.width||360),h=Math.max(1,viewport.height|0||cam?.height||640),dpr=Math.max(1,Math.min(2,Number(viewport.dpr)||1));
 const p=root.MongyuNativePalette?.chapter?.(chapter);if(!p)return null;
 const t=reduced?0:time,s=cam?.scale||1,relX=cam?192*s+cam.offsetX-w/2:0,relY=cam?192*s+cam.offsetY-h/2:0;
 const dx=Math.max(-MARGIN,Math.min(MARGIN,relX*PARALLAX)),dy=Math.max(-MARGIN,Math.min(MARGIN,relY*PARALLAX))+(reduced?0:Math.sin(t*.21)*3);
 const layers=skyLayers(w,h,dpr,chapter);
 c.save();
 if(!layers){ // Non-browser harnesses: same composition, painted directly.
  if(typeof c.createLinearGradient==='function'){const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,p.sky[0]);g.addColorStop(1,p.sky[1]);c.fillStyle=g}else c.fillStyle=p.sky[1];
  c.fillRect(0,0,w,h);c.restore();return {chapter:p.index,cached:false,parallax:{x:dx,y:dy}};
 }
 c.imageSmoothingEnabled=true;c.drawImage(layers.base,0,0,w,h);
 if(layers.far)c.drawImage(layers.far,-MARGIN+dx,-MARGIN+dy,w+2*MARGIN,h+2*MARGIN);
 if(layers.fog){
  const bw=w*1.25,bh=h*.17;
  for(let i=0;i<3;i++){const y=h*(.3+i*.25)+dy*(.6+i*.3)-bh/2,speed=(i%2?-1:1)*(5+i*3),x0=((t*speed+i*137)%bw+bw)%bw-bw;c.globalAlpha=.5+i*.12;for(let x=x0;x<w;x+=bw)c.drawImage(layers.fog,x,y,bw,bh)}
  c.globalAlpha=1;
 }
 // Slow rising motes: the only per-frame primitives in the backdrop.
 const mote=mix(p.glow,'#ffffff',.35);c.fillStyle=mote;
 for(let i=0;i<16;i++){const a=(i*0.6180339)%1,b=(i*0.7548776)%1,x=(a*w+Math.sin(t*.3+i)*14+dx*.5+w)%w,y=(h-((b*h+t*(6+i%4*3))%h)+h)%h,r=i%3?1:1.6;c.globalAlpha=(.16+.18*Math.sin(t*.8+i*1.7)**2);c.fillRect(x-r/2,y-r/2,r,r)}
 c.restore();
 return {chapter:p.index,cached:true,builds:layers.builds,parallax:{x:dx,y:dy}};
}
const api={inkFor,backgroundAt,fieldSpec,draw,sky,glow,mix,rgba,PARALLAX};root.MongyuStagecraft=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
