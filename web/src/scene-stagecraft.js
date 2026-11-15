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
const api={inkFor,backgroundAt,fieldSpec,draw};root.MongyuStagecraft=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
