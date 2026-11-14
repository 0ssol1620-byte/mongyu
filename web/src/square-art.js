/* R38: ten original continuous square architectures. Engine geometry is authoritative. */
(function(root){'use strict';
const EncounterArt=root.MongyuEncounterArt||(typeof require==='function'?require('./encounter-art.js'):null);
const TAU=Math.PI*2,INK='#080615',IVORY='#fff8de',PINK='#ff24b6',BLUE='#213bff',LIME='#d9ff24';
const palettes=[
 ['#fff0cf','#f922a8','#a72c83','#e4ff38','#ffb1ce'],['#69eadb','#2348f4','#137ba2','#ffed45','#b7faf0'],['#b8b6fa','#ff5a35','#773cb5','#eaff53','#eeceff'],['#f6b5d5','#7534ea','#391b87','#ccff39','#fff0d9'],['#cff182','#ec396c','#8f255c','#fff4ad','#effacb'],['#f9c689','#2346b9','#ad6336','#fff2d4','#ffe6b0'],['#94d5f5','#dc358a','#4c3d99','#f2ff52','#dff4ff'],['#e7c6f7','#5141df','#ac4ab4','#bff74c','#fce7fd'],['#ff9e93','#a326bb','#63258c','#ecff46','#ffdac0'],['#f5cad8','#222a9d','#bf327c','#d4ff39','#fff1da']
].map(a=>Object.freeze({bg:a[0],wall:a[1],fold:a[2],hot:a[3],soft:a[4],ink:INK,light:IVORY}));
// Intense color architecture is authored separately; reduced motion freezes movement, not identity.
const intenseColors=[['#281056','#ff2aa9','#500a87','#e4ff38','#7643ba'],['#1019a8','#31dce9','#080d46','#efff27','#3046ed'],['#30133e','#ff6535','#853095','#eaff53','#ba62d2'],['#18104b','#a44cff','#4730ad','#ccff39','#ef65c1'],['#102f28','#ec396c','#8f255c','#e4ff67','#338e65'],['#2f133b','#ff9738','#a52d59','#fff2d4','#6b42c0'],['#102e5a','#ff40a6','#3157a8','#f2ff52','#3eb9dd'],['#080c23','#2ae8dc','#25279e','#efff35','#7850e8'],['#ff563f','#fff1cf','#ae234e','#ddff29','#ffb192'],['#201052','#ff4b8c','#6e27ac','#d4ff39','#4264ef']];
const intensePalettes=palettes.map((p,i)=>Object.freeze({...p,...Object.fromEntries(['bg','wall','fold','hot','soft'].map((k,j)=>[k,intenseColors[i][j]]))}));
const EXTERIOR_MODES=Object.freeze([0,0,1,2,1,0,0,1,2,1]);
const RGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const makeRamps=ps=>ps.map(p=>{const colors=[p.wall,p.fold,INK,p.soft,IVORY,p.hot];return colors.map((a,k)=>{const aa=RGB(a),bb=RGB(colors[(k+1)%colors.length]);return Array.from({length:33},(_,i)=>'#'+aa.map((v,j)=>Math.round(v+(bb[j]-v)*i/32).toString(16).padStart(2,'0')).join(''))})});
const RAMPS=makeRamps(palettes),INTENSE_RAMPS=makeRamps(intensePalettes);
const GRID=Object.freeze(Array.from({length:529},(_,i)=>{const row=Math.floor(i/23),col=i%23,u=(col-11)/11,v=(row-11)/11;return Object.freeze({row,col,u,v,rad:Math.hypot(u,v),a:Math.atan2(v,u),sq:Math.max(Math.abs(u),Math.abs(v))})}));
function quad(c,x,y,w,d,color){c.fillStyle=color;c.beginPath();c.moveTo(x+w,y);c.lineTo(x+w+d,y-d);c.lineTo(x+w+d,y+w-d);c.lineTo(x+w,y+w);c.closePath();c.fill()}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
function blend(a,b,u){return '#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-u)+parseInt(b.slice(i,i+2),16)*u).toString(16).padStart(2,'0')).join('')}
function polygon(c,p,fill,stroke,width=1){c.beginPath();p.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function line(c,p,color,width=1){c.beginPath();p.forEach((v,i)=>i?c.lineTo(v[0],v[1]):c.moveTo(v[0],v[1]));c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke()}
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.fillStyle=color;c.fill()}
function rounded(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath()}
function camera(viewport={},bounds={left:-148,top:-148,right:148,bottom:148,width:296,height:296},frame=bounds){
 const width=Math.max(1,Number(viewport.width)||360),height=Math.max(1,Number(viewport.height)||640),wide=width>height;
 const roomW=frame.width||frame.right-frame.left,roomH=frame.height||frame.bottom-frame.top;
 const scale=Math.min((width-28)/(roomW+12),(height-(wide?36:164))/(roomH+12));
 const s=Math.max(.05,scale),offsetX=width/2-((bounds.left+bounds.right)/2)*s,offsetY=height*(wide?.51:.51)-((bounds.top+bounds.bottom)/2)*s;
 return {width,height,scale:s,offsetX,offsetY,left:-offsetX/s,right:(width-offsetX)/s,top:-offsetY/s,bottom:(height-offsetY)/s};
}
function parameters(geo={},opt={}){const reduced=!!(opt.reduced||geo.reducedMotion),gain=reduced?0:opt.dreamIntensity==='calm'?.22:opt.dreamIntensity==='balanced'?.64:1;
 const family=geo.familyIndex??geo.room?.familyIndex??geo.slot?.chapter-1,stage=((Number.isFinite(family)?Math.floor(family):Math.floor((geo.room?.index||0)/2))%10+10)%10,t=reduced?0:Math.max(0,Number(geo.time)||0),beat=t*2;
 const intense=!['calm','balanced'].includes(opt.dreamIntensity),pulse=reduced?0:opt.music?.playing?clamp(Number(opt.music.pulse)||0,0,1):0;return {stage,p:(intense?intensePalettes:palettes)[stage],ramp:(intense?INTENSE_RAMPS:RAMPS)[stage],intense,poseTime:reduced?0:(Number.isFinite(opt.presentationTime)?opt.presentationTime:t),architecture:EXTERIOR_MODES[stage],scenePhase:t*.36+stage*.61+clamp(Number(geo.progress)||0,0,1)*.8,t,gain,beat,pulse,pace:clamp(geo.feel?.pace||1,1,2.5),tier:geo.feel?.tier||0,breath:(.5-.5*Math.cos(beat*TAU))*gain,corner:reduced?0:Math.sin(Math.PI*clamp(geo.corner?.progress||0,0,1))*Number(!!geo.corner?.turning)};
}
// Broad planes, continuous chequer waves and moving cut-outs fill the entire viewport.
// They terminate behind the actual contact boundary and never masquerade as hazards.
function exterior(c,cam,b,fx){if(root.MongyuMobile)return root.MongyuMobile.exterior(c,cam,b,fx);const {p,gain,stage}=fx,phase=fx.scenePhase??fx.t*.17+stage*.61,mode=fx.architecture??EXTERIOR_MODES[stage],w=cam.right-cam.left,h=cam.bottom-cam.top,span=Math.max(w,h);c.fillStyle=p.bg;c.fillRect(cam.left,cam.top,w,h);
 // Three large-scale spatial grammars replace the same repeated outline frames.
 // Alpha and background color stay constant: only coherent geometry travels.
 if(mode===0){
  c.save();c.rotate((stage%2?.065:-.06)+Math.sin(phase)*gain*.035);
  for(let i=0;i<6;i++){const right=i%2,x=(right?-.08:-.61)*w+Math.sin(phase+i*.31)*gain*w*.055,y=cam.top+(i-.25)*h/5,sw=w*(right?.77:.70),sh=h*(i%3===0?.13:.095);c.globalAlpha=fx.intense?.46:.28;c.fillStyle=i%3===0?p.wall:i%3===1?p.fold:p.soft;c.fillRect(x,y,sw,sh);c.globalAlpha=fx.intense?.24:.14;c.fillStyle=p.fold;c.fillRect(x+sw*.12,y+sh,sw*.88,sh*.23);}
  c.restore();
 }else if(mode===1){
  const travel=Math.sin(phase)*gain*.07,side=w*(.27+travel*.4),top=h*(.17-travel*.3),gap=h*(.16+Math.cos(phase)*gain*.025);
  c.globalAlpha=fx.intense?.48:.28;c.fillStyle=p.wall;c.fillRect(cam.left,cam.top,side,h*.48-gap);c.fillRect(cam.right-side,cam.bottom-h*.48+gap,side,h*.48-gap);c.fillRect(cam.left+side,cam.top,w-side*1.3,top);c.fillRect(cam.left+side*.3,cam.bottom-top,w-side*1.3,top);
  c.globalAlpha=fx.intense?.62:.33;c.fillStyle=p.fold;c.fillRect(cam.left,cam.top+h*.58+travel*h,side*.62,h*.42);c.fillRect(cam.right-side*.62,cam.top,side*.62,h*(.42+travel));
  c.globalAlpha=fx.intense?.38:.22;c.fillStyle=p.soft;c.fillRect(cam.left+side*.2,cam.top+h*.28,side*.30,h*.22);c.fillRect(cam.right-side*.5,cam.bottom-h*.50,side*.30,h*.22);
 }else{
  const orbit=(stage===8?-.12:.12)+Math.sin(phase*.7)*gain*.045;
  for(let ray=0;ray<8;ray++){c.save();c.rotate(ray*Math.PI/4+orbit);for(let tier=0;tier<3;tier++){const size=span*(.10+tier*.021),radius=span*(.12+tier*.19)+Math.sin(phase+tier*.55)*gain*span*.027;c.globalAlpha=fx.intense?.52:.27;c.fillStyle=(ray+tier)%3===0?p.wall:(ray+tier)%3===1?p.fold:p.soft;c.fillRect(radius,-size/2,size,size)}c.restore();}
 }
 c.globalAlpha=1;
}
function tileField(c,w,h,fx){const {p,t,gain,stage}=fx,step=Math.min(w,h)/23,phase=t*.92,morph=(.5-.5*Math.cos(t*.62))*gain,turn=Math.sin(phase),ramp=fx.ramp||RAMPS[stage];
 for(const g of GRID){const {u,v,row,col,rad,a,sq}=g;let d=0,dx=0,dy=0,depth=3,band=sq*7;
  switch(stage){
   case 0:{const y=-v+.12,heart=(u*u+y*y-.58)**3-u*u*y*y*y;const slabs=Math.min(.91-sq,Math.max(Math.abs(u)-.21,Math.abs(v)-.32));d=(.03-heart)*2*(1-morph)+slabs*morph;dx=Math.sign(u)*morph*step*1.5;dy=-Math.sign(v)*morph*step*.7;band=sq*8+Math.sin(a*3+phase)*.35;break}
   case 1:d=Math.min(.94-sq,Math.abs(u+Math.sin(v*4+phase)*.18*gain)-.18);dx=Math.sin(v*5+phase)*step*1.3*gain;dy=Math.sin(u*3-phase)*step*.6*gain;band=(v+1)*4+sq*2;break;
   case 2:d=Math.min(.94-sq,Math.abs(sq-(.25+morph*.34))-.105);dx=v*morph*step*1.4;dy=-u*morph*step*1.4;band=sq*12;break;
   case 3:d=Math.min(.91-sq,Math.max(Math.abs(u)-.15,Math.abs(v)-.15),.22-Math.abs(Math.abs(u)-Math.abs(v)));dx=Math.sign(u)*Math.sin(phase+Math.abs(v)*4)*step*gain;band=(Math.abs(u)+Math.abs(v))*5;break;
   case 4:d=Math.min(.91-sq,.24-Math.abs(Math.abs(u)-(.36+.14*Math.sin(v*4+phase)*gain)));dy=(col%2?1:-1)*Math.sin(phase)*step*gain;band=(u+1)*5+Math.floor(v*3);break;
   case 5:d=Math.min(.94-sq,Math.max(Math.abs(u)-.35,Math.abs(v)-.35),.58-Math.abs(u+v*morph));dx=Math.sign(v)*turn*gain*step*.8;band=Math.floor((v+1)*5)+Math.abs(u)*4;break;
   case 6:d=Math.min(.94-sq,.36-Math.abs(Math.abs(u)-.5),.9-Math.abs(v+Math.sin(u*4+phase)*.2*gain));dx=Math.sign(u)*morph*step;dy=Math.sign(u)*Math.sin(phase)*step*gain;band=Math.abs(u)*10+v*2;break;
   case 7:d=Math.min(.94-sq,.2-Math.abs(((Math.abs(u)+Math.abs(v))+.12*Math.sin(phase)*gain)% .48-.24));dx=Math.sin(v*4+phase)*step*.4*gain;band=(Math.abs(u)+Math.abs(v))*7;break;
   case 8:d=Math.min(.94-sq,.15-Math.abs((sq+morph*.2)% .34-.17));dx=u*morph*step*.8;dy=v*morph*step*.8;band=sq*15;break;
   default:{const link=Math.min(Math.abs(Math.max(Math.abs(u+.35),Math.abs(v))-.42),Math.abs(Math.max(Math.abs(u-.35),Math.abs(v))-.42));d=.13-link;dx=Math.sign(u)*Math.sin(phase)*step*gain;dy=Math.sin(u*5+phase)*step*gain*.4;band=sq*8+Math.sin(a*2+phase)*.5;}
  }
  const coverage=smooth(d*13+.35);if(coverage<.06)continue;
  const unit=step*(.33+.72*coverage),x=u*w*.46+dx-unit/2,y=v*h*.46+dy-unit/2;
  const whole=Math.floor(band),k=((whole%6)+6)%6,mix=band-whole;c.fillStyle=ramp[k][Math.round(mix*32)];c.fillRect(x,y,unit,unit);
  // Broad connected masses carry depth; only one quarter of tiles need a return face.
  if((row+col)%4===0&&coverage>.6){depth=step*(.15+.2*Math.sin(phase+u*3)*gain);quad(c,x,y,unit,depth,p.fold)}
 }
}
function chamber(c,b,fx){if(root.MongyuMobile)return root.MongyuMobile.chamber(c,b,fx);const {p,t,gain,stage,breath}=fx,w=b.width||b.right-b.left,h=b.height||b.bottom-b.top,cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2;
 c.save();c.translate(cx,cy);
 // A large square-cut aperture carries the field. The central motif is a place,
 // not a small icon: tile mass reaches right up to the protected collision apron.
 c.save();c.rotate(Math.sin(t*.48)*gain*.16);const zoom=1+Math.sin(t*.9)*gain*.12+fx.corner*.05+(fx.pulse||0)*gain*.045;c.scale(zoom,zoom);tileField(c,w*1.12,h*1.12,fx);c.restore();c.restore();
}
// Fast parallax lives outside the room. Support, hazard and action layers are painted afterward.
function velocity(c,cam,geo,fx){if(!fx.gain||!geo.feel)return;const b=geo.bounds,distance=geo.distance||0,span=cam.bottom-cam.top;
 c.save();c.globalAlpha=.30*fx.gain;c.fillStyle=fx.p.hot;
 for(let side=0;side<2;side++){const left=side===0?cam.left:b.right+14,right=side===0?b.left-14:cam.right,width=right-left;if(width<8)continue;for(let i=0;i<7;i++){const x=left+width*(.12+(i%3)*.29),y=cam.top+((i*span/7+distance*(side?2.4:1.7))%span),length=20+(i%3)*18+fx.tier*6;c.fillRect(x,y,2+(i%2),length);}}
 const spanX=cam.right-cam.left;for(const top of [true,false]){const y=top?b.top-19:b.bottom+19;if(y<cam.top||y>cam.bottom)continue;for(let i=0;i<6;i++){const x=cam.left+((i*spanX/6-distance*2.1)%spanX+spanX)%spanX;c.fillRect(x,y,22+(i%3)*12,2);}}
 c.restore();
}
// A short tapered wake follows the actual facing direction; it carries no collision meaning.
function wake(c,geo,fx,reduced){const q=geo.player;if(!q||reduced||!geo.feel)return;const tier=fx.tier||0;c.save();c.translate(q.x,q.y);c.rotate(Math.atan2(q.tangent?.y||0,q.tangent?.x??1));
 for(let i=0;i<3+tier;i++){const x=-24-i*15,y=-24+(i%3-1)*9;c.globalAlpha=(.36-i*.045)*fx.gain;line(c,[[x,y],[x-10-fx.pace*5,y]],INK,7);line(c,[[x,y],[x-10-fx.pace*5,y]],i%2?IVORY:fx.p.hot,2.5);}
 c.restore();
}
function inGap(geo,x,y){for(const g of geo.track?.gaps||[])if(Math.hypot(x-g.x,y-g.y)<g.width/2)return true;return false}
function supportPath(c,geo){if(Array.isArray(geo.nativePaths)){c.beginPath();for(const path of geo.nativePaths){const points=Array.isArray(path)?path:path.points;let started=false;for(const p of points||[]){if(!Number.isFinite(p.x)||!Number.isFinite(p.y)){started=false;continue}if(started)c.lineTo(p.x,p.y);else{c.moveTo(p.x,p.y);started=true}}}return}const pts=geo.track?.points;if(pts?.length>1){c.beginPath();let started=false;const count=geo.track.closed!==false?pts.length+1:pts.length;for(let i=0;i<count;i++){const p=pts[i%pts.length],x=Array.isArray(p)?p[0]:p.x,y=Array.isArray(p)?p[1]:p.y;if(inGap(geo,x,y)){started=false;continue}if(started)c.lineTo(x,y);else{c.moveTo(x,y);started=true}}if(geo.track.closed!==false&&!(geo.track.gaps?.length))c.closePath();return}const b=geo.bounds;rounded(c,b.left,b.top,b.width||b.right-b.left,b.height||b.bottom-b.top,geo.room?.radius||0)}
// q3 tiles use the actual occupied cells; decorative column profiles must not replace this contact layer.
function nativeMaskSupport(c,cells,fx){c.save();for(const cell of cells){c.fillStyle=INK;c.fillRect(cell.x,cell.y,cell.width,cell.height);c.fillStyle=fx.p.wall;c.fillRect(cell.x+1,cell.y+1,cell.width-2,cell.height-2);c.fillStyle=IVORY;c.fillRect(cell.x+2,cell.y+2,cell.width-4,2);}c.restore();}
function support(c,geo,fx){if(Array.isArray(geo.nativeMaskCells)){nativeMaskSupport(c,geo.nativeMaskCells,fx);return;}if(geo.faceCounter){faceArena(c,geo,fx);return;}if(geo.legSweep){aftermathFrame(c,geo,{...fx,p:{...fx.p,wall:'#70f344'}});return;}if(geo.boss?.ruleId==='boundary-strike')return heartSupport(c,geo,fx);c.save();supportPath(c,geo);c.globalAlpha=.6;c.strokeStyle=INK;c.lineWidth=24;c.lineJoin='round';c.lineCap='round';c.stroke();c.restore();supportPath(c,geo);c.strokeStyle=INK;c.lineWidth=13;c.lineJoin='round';c.lineCap='round';c.stroke();supportPath(c,geo);c.strokeStyle=IVORY;c.lineWidth=3;c.stroke();
 const paths=Array.isArray(geo.nativePaths)?geo.nativePaths.map(p=>({points:Array.isArray(p)?p:p.points,closed:false})):[geo.track];for(const path of paths){const points=path?.points;if(points?.length>1){let carry=0,tile=0;const count=path.closed===false?points.length-1:points.length;for(let i=0;i<count;i++){const a=points[i],b=points[(i+1)%points.length],ax=Array.isArray(a)?a[0]:a.x,ay=Array.isArray(a)?a[1]:a.y,bx=Array.isArray(b)?b[0]:b.x,by=Array.isArray(b)?b[1]:b.y,len=Math.hypot(bx-ax,by-ay);if(!Number.isFinite(len)||len<.001)continue;for(let d=carry;d<len;d+=10){const x=ax+(bx-ax)*d/len,y=ay+(by-ay)*d/len;if(!inGap(geo,x,y)){c.fillStyle=tile++%3===0?fx.p.wall:IVORY;c.fillRect(x-3.2,y-3.2,6.4,6.4)}}carry=(carry-len)%10;if(carry<0)carry+=10;}}}
}
// One visible heart is the actual polyline collider. Colour feedback never moves it.
function heartSupport(c,geo,fx){
 const pressure=geo.boundaryPressure,hit=geo.boundaryStrike?.valid,colour=hit?'#f7e55e':'#9ee344';
 if(pressure&&pressure.phase!=='off'){
  c.save();supportPath(c,geo);c.strokeStyle=PINK;c.globalAlpha=pressure.phase==='active'?.5:.16;
  c.lineWidth=pressure.width*2;c.lineJoin='round';c.stroke();c.restore();
 }
 supportPath(c,geo);c.strokeStyle=INK;c.lineWidth=19;c.lineJoin='round';c.stroke();
 supportPath(c,geo);c.strokeStyle=colour;c.lineWidth=9;c.stroke();
 const points=geo.track.points;let carry=0;
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b.x-a.x,b.y-a.y);if(len<.001)continue;
  for(let d=carry;d<len;d+=18){const x=a.x+(b.x-a.x)*d/len,y=a.y+(b.y-a.y)*d/len;c.fillStyle=INK;c.fillRect(x-7,y-7,14,14);c.fillStyle=colour;c.fillRect(x-5,y-5,10,10);}
  carry=(carry-len)%18;if(carry<0)carry+=18;
 }
}
function heartStrike(c,strike){if(!strike)return;const points=[[strike.from.x,strike.from.y],[strike.to.x,strike.to.y]];
 line(c,points,INK,10);line(c,points,IVORY,4.5);
 if(strike.valid&&strike.contact){const q=strike.contact;c.fillStyle=INK;c.fillRect(q.x-7,q.y-7,14,14);c.fillStyle='#f7e55e';c.fillRect(q.x-4,q.y-4,8,8);}
}
function heartBossHud(c,geo){if(geo.boss?.ruleId==='boundary-strike')bossHealthBar(c,geo)}
function bossHealthBar(c,geo){if(!geo.boss)return;const b=geo.bounds,w=Math.min(240,b.width*.42),x=-w/2,y=b.top+32,ratio=clamp(geo.boss.hp/Math.max(1,geo.boss.maxHp),0,1);
 c.fillStyle=INK;c.fillRect(x-7,y-7,w+14,34);c.strokeStyle=IVORY;c.lineWidth=2;c.strokeRect(x,y,w,20);c.fillStyle=IVORY;c.fillRect(x+3,y+3,(w-6)*ratio,14);
}
// Wall cell boundaries are interpolated on the supplied collider: no decorative spike fallback.
function wall(c,h,p){const pts=h.collisionPolygon?.map(q=>Array.isArray(q)?q:[q.x,q.y]);if(!pts||pts.length!==4)return;
 polygon(c,pts,INK,INK,5);polygon(c,pts,p.wall,IVORY,2);
 const cells=Math.max(1,Math.floor(h.cellsHigh||3));
 for(let i=1;i<cells;i++){const u=i/cells,a=[pts[0][0]+(pts[1][0]-pts[0][0])*u,pts[0][1]+(pts[1][1]-pts[0][1])*u],b=[pts[3][0]+(pts[2][0]-pts[3][0])*u,pts[3][1]+(pts[2][1]-pts[3][1])*u];line(c,[a,b],INK,4);line(c,[a,b],IVORY,1.4);}
 line(c,[pts[1],pts[2]],p.hot,3);
}
function hazard(c,h,p){if(h.done||h.type==='portal'||h.active===false&&h.type!=='pulse')return;
 if(h.type==='wall'){wall(c,h,p);return;}
 if(h.collisionPolygon?.length){const pts=h.collisionPolygon.map(q=>Array.isArray(q)?q:[q.x,q.y]);polygon(c,pts,INK,INK,5);polygon(c,pts,h.active===false?p.fold:h.type==='gap'?INK:p.hot,IVORY,1.8);const cx=pts.reduce((s,q)=>s+q[0],0)/pts.length,cy=pts.reduce((s,q)=>s+q[1],0)/pts.length;
  c.save();c.translate(cx,cy);c.rotate(Math.atan2(h.tangent?.y||0,h.tangent?.x??1));c.fillStyle=INK;const mark=Math.min(7,(h.width||18)*.3);
  if(h.active!==false){if(h.type==='pair'){c.fillRect(-12,-3,6,6);c.fillRect(6,-3,6,6);}else if(h.type==='kick')line(c,[[-5,-4],[2,0],[-5,4]],INK,2.2);else if(h.type==='switch'){line(c,[[-5,0],[5,0],[1,-4]],INK,2);line(c,[[5,0],[1,4]],INK,2);}else if(h.type==='wave')line(c,[[-6,2],[-2,-3],[2,3],[6,-2]],INK,2);else if(h.type==='gap')line(c,[[-5,-3],[0,3],[5,-3]],IVORY,2);else c.fillRect(-mark/2,-mark/2,mark,mark);}c.restore();return;
 }
 c.save();c.translate(h.x,h.y);c.rotate(Math.atan2(h.tangent?.y||0,h.tangent?.x??1));const w=h.width||18,height=h.clearance||h.height||20,y=h.type==='beam'?-68-height:-height;
 c.fillStyle=p.hot;c.fillRect(-w/2,y,w,height);c.strokeStyle=IVORY;c.lineWidth=1.8;c.strokeRect(-w/2,y,w,height);c.fillStyle=INK;c.fillRect(-3,y+height/2-3,6,6);c.restore();
}
// Original role silhouettes. All share the engine's 60-unit player body; the dog is cosmetic.
function elderlyCarrier(c,phase,air,kick=0,climbing=false){const swing=Math.sin(phase),hip=[0,-14],shoulder=[5,-25];
 const legs=climbing?[[hip,[10,-17],[13,-9]],[hip,[-7,-8],[-3,-2]]]:air?[[hip,[-7,-8],[-10,-3]],[hip,[8+kick*7,-12],[13+kick*15,-6-kick*8]]]:[[hip,[-2+swing*5,-7],[-swing*9,0]],[hip,[-2-swing*5,-7],[swing*9,Math.min(0,-5*Math.cos(phase))]]];
 for(const edge of [true,false]){const color=edge?INK:IVORY;for(const limb of legs)line(c,limb,color,edge?7:3.2);line(c,[hip,[1,-21],shoulder],color,edge?9:5);line(c,[shoulder,[12,-19],[15,-23]],color,edge?6.5:2.8);ellipse(c,8,-30,edge?5.6:3.7,edge?6:4.2,color)}
 polygon(c,[[-4,-26],[7,-25],[9,-14],[-5,-13]],'#f0a8c6',INK,1.8);
 ellipse(c,3,-34,3.7,3.3,INK);ellipse(c,3,-34,2.1,1.9,IVORY);line(c,[[8,-31],[12,-31]],INK,1.2);
 // The small protagonist rides on the grandmother's back: two heads, folded knees and an embracing arm.
 for(const edge of [true,false]){const color=edge?INK:IVORY;line(c,[[-9,-30],[-10,-23],[-3,-19],[3,-22]],color,edge?6.8:3);line(c,[[-9,-29],[-2,-28],[6,-26]],color,edge?6:2.6);ellipse(c,-9,-36,edge?4.7:3,edge?5.6:3.8,color)}
 line(c,[[-11,-25],[-7,-24]],'#70d8d0',2.5);
}
function womanRunner(c,phase,air,kick=0,climbing=false){const swing=Math.sin(phase),hip=[-1,-16],shoulder=[3,-29],legs=climbing?[[hip,[10,-20],[14,-11]],[hip,[-8,-9],[-4,-2]]]:air?[[hip,[-8,-10],[-11,-4]],[hip,[9+kick*8,-16],[14+kick*15,-9-kick*8]]]:[[hip,[-4+swing*7,-8],[-swing*12,0]],[hip,[-4-swing*7,-9],[swing*12,Math.min(0,-7*Math.cos(phase))]]],arms=climbing?[[shoulder,[-6,-29],[-7,-37]],[shoulder,[12,-34],[12,-42]]]:[[shoulder,[-6,-24],[-10-swing*4,-28]],[shoulder,[10,-23],[13+swing*4,-27]]];
 const tail=-12+Math.sin(phase*.5)*2;polygon(c,[[1,-38],[-5,-37],[tail,-31],[tail-1,-23],[-6,-28],[-2,-33]],'#b7b2ff',INK,2);
 for(const edge of [true,false]){const color=edge?INK:IVORY;for(const limb of [...legs,...arms])line(c,limb,color,edge?7.2:3.2);ellipse(c,5,-36,edge?5.5:3.6,edge?6.5:4.6,color)}
 polygon(c,[[0,-30],[7,-28],[5,-22],[9,-15],[-7,-15],[-2,-23]],'#b7b2ff',INK,2);line(c,[[0,-25],[5,-24]],IVORY,2);line(c,[[1,-39],[7,-40],[9,-37]],INK,2.4);
}
function dogCompanion(c,q,fx,reduced){if(!q)return;c.save();c.translate(q.x,q.y);c.rotate(Math.atan2(q.tangent?.y||0,q.tangent?.x??1));const scale=(q.bodyHeight||24)/22;c.scale(scale,scale);const stride=Math.sin(reduced?.8:fx.t*15),gold='#ffcb71';
 for(const edge of [true,false]){const color=edge?INK:gold,width=edge?5.5:2.4;line(c,[[-10,-10],[-16,-13],[-18,-18]],color,width);for(const x of [-8,7]){line(c,[[x,-9],[x+stride*4,-4],[x-stride*3,0]],color,width);line(c,[[x,-9],[x-stride*4,-4],[x+stride*3,0]],color,width)}}
 polygon(c,[[-12,-14],[6,-15],[10,-8],[-11,-7]],gold,INK,2.2);polygon(c,[[5,-16],[5,-22],[10,-18],[14,-18],[18,-13],[13,-9],[7,-10]],gold,INK,2);c.fillStyle=INK;c.fillRect(12,-16,2,2);c.fillRect(16,-13,3,2);line(c,[[6,-13],[7,-8]],'#b54764',2);c.restore();
}
function characters(c,geo,fx,reduced){if(geo.faceCounter){faceActors(c,geo,fx,reduced);return;}const id=geo.characterId||geo.character?.id||'walker';if(id==='dog')dogCompanion(c,geo.companion,fx,reduced);if(geo.player)runner(c,geo.player,fx,reduced,id);heartStrike(c,geo.boundaryStrike)}
function runner(c,q,{p,t,gain,poseTime},reduced,characterId='walker'){if(root.MongyuMobile)return root.MongyuMobile.sprite(c,q,{p,t,gain,poseTime},reduced,characterId);c.save();c.translate(q.x,q.y);if(q.deathProgress){const fade=Math.max(.08,1-q.deathProgress);c.globalAlpha*=fade;if(!reduced)c.scale(1,1-.35*q.deathProgress);}c.rotate(Math.atan2(q.tangent?.y||0,q.tangent?.x??Math.cos(q.angle||0)));c.scale((q.bodyHeight||60)/42.5,(q.bodyHeight||60)/42.5);
 const phase=reduced?.8:(q.poseClock??t)*11,climbing=!!q.climbing,air=climbing||(q.height||0)>1,swing=Math.sin(phase),hip=[-1,-16],shoulder=[3,-29],kick=reduced?0:Math.sin(Math.PI*clamp(q.kick||0,0,1)),landing=reduced?0:q.landing||0;
 if(!reduced&&!climbing&&!q.boundaryKicking){c.rotate((q.impact||0)*-.22+(air?(q.jumpProgress<.5?.035:-.035):.055));c.scale(1+landing*.13,1-landing*.16);}
 if(characterId==='elder'){elderlyCarrier(c,phase,air,kick,climbing);c.restore();return}if(characterId==='woman'){womanRunner(c,phase,air,kick,climbing);c.restore();return}
 const tuck=air?Math.sin(Math.PI*clamp(q.jumpProgress??.5,0,1))*5:0;
 const legs=q.boundaryKicking?[[hip,[-8,-10-tuck],[-11,-4-tuck]]]:climbing?[[hip,[10,-20],[14,-11]],[hip,[-8,-9],[-4,-2]]]:air?[[hip,[-8,-10-tuck],[-11,-4-tuck]],[hip,[9+kick*8,-16],[14+kick*15,-9-kick*8]]]:[[hip,[-4+swing*7,-8],[-swing*12,0],[-swing*12+4,0]],[hip,[-4-swing*7,-9],[swing*12,Math.min(0,-7*Math.cos(phase))],[swing*12+4,Math.min(0,-7*Math.cos(phase))]]];
 const arms=climbing?[[shoulder,[-6,-29],[-7,-37]],[shoulder,[12,-34],[12,-42]]]:air?[[shoulder,[-7,-26],[-14,-30-tuck]],[shoulder,[10,-31],[14,-35]]]:[[shoulder,[-6,-24],[-8-swing*4,-30]],[shoulder,[10,-23],[12+swing*4,-28]]];
 // A dark keyed silhouette surrounds ivory articulated limbs at every face angle.
 for(const edge of [true,false]){const color=edge?INK:IVORY,width=edge?7.2:3.2;for(const limb of [...legs,...arms])line(c,limb,color,width);line(c,[hip,[0,-23],shoulder],color,edge?8.4:4.4);ellipse(c,5,-36,edge?5.5:3.6,edge?6.5:4.6,color)}
 line(c,[[2,-28],[6,-25]],p.hot,3);c.restore();
}
function response(c,geo,fx,reduced){const q=geo.player;if(!q)return;const scale=(q.bodyHeight||60)/42.5;c.save();c.translate(q.x,q.y);c.rotate(Math.atan2(q.tangent?.y||0,q.tangent?.x??1));c.scale(scale,scale);
 if((q.height||0)>3&&!reduced){for(const y of [-19,-11]){line(c,[[-18,y],[-29,y+5]],INK,6);line(c,[[-18,y],[-29,y+5]],IVORY,2.5)}}
 const f=geo.feedback;if(f&&['perfect','seal','hit'].includes(f.kind)){const u=reduced?0:1-clamp(f.remaining/(f.kind==='hit'?1.2:f.kind==='seal'?1:.65),0,1),spread=5+u*15;c.globalAlpha=reduced?.9:1-u;
  for(let i=0;i<3;i++){const x=-18-spread-i*6,y=-23+(i-1)*12;c.fillStyle=INK;c.fillRect(x-4,y-4,8,8);c.fillStyle=f.kind==='hit'?PINK:fx.p.hot;c.fillRect(x-2.5,y-2.5,5,5)}
 }
 const impact=geo.feel?.impact;if(impact&&!reduced){const life=clamp(impact.remaining/impact.duration,0,1),u=1-life,ground=['jump','land'].includes(impact.kind),centerY=ground?-2:-25,spread=10+u*28,count=ground?4:6;c.globalAlpha=life;
  for(let i=0;i<count;i++){const a=ground?Math.PI+(i/(count-1))*Math.PI:i*TAU/count,x=Math.cos(a)*spread,y=centerY+Math.sin(a)*spread*.65;line(c,[[x,y],[x+Math.cos(a)*7,y+Math.sin(a)*5]],INK,6);line(c,[[x,y],[x+Math.cos(a)*7,y+Math.sin(a)*5]],impact.kind==='hit'?PINK:fx.p.hot,2.5);}
 }c.restore();
}
function portal(c,q,fx){if(!q||q.visible===false||!Number.isFinite(q.x)||!Number.isFinite(q.y))return;c.save();c.translate(q.x,q.y);c.rotate(Math.atan2(q.tangent?.y||0,q.tangent?.x??1));const w=q.width||24,h=q.height||48,open=q.open!==false;c.fillStyle=INK;c.fillRect(-w/2-5,-h-4,w+10,h+6);c.strokeStyle=open?fx.p.hot:IVORY;c.lineWidth=4;c.strokeRect(-w/2,-h,w,h);c.fillStyle=open?IVORY:fx.p.fold;c.fillRect(-w/2+5,-h+5,w-10,h-5);if(!open){c.fillStyle=IVORY;c.fillRect(-w/2+3,-h*.65,w-6,4);c.fillRect(-w/2+3,-h*.35,w-6,4)}else{c.fillStyle=fx.p.hot;c.fillRect(-3,-h-11,6,6)}c.restore()}
function bossLane(geo){return Number.isFinite(geo.boss?.targetLane)?geo.boss.targetLane:1}


// R53: actual model cells supply both visible face/cluster and collision geometry.
function faceArena(c,geo,fx){const b=geo.faceCounter.bounds,step=22,size=16,w=b.right-b.left,h=b.bottom-b.top;
 c.save();c.fillStyle='#a59bff';c.fillRect(b.left,b.top,w,h);for(let row=0;row<12;row++)for(let col=0;col<12;col++){const n=(row*3+col*7+Math.floor(fx.t/8))%17;c.globalAlpha=n<3?.8:.28;c.fillStyle=n<3?'#ed50c8':n<8?'#7163e8':'#c4b5ff';c.fillRect(b.left+col*w/12,b.top+row*h/12,w/12+.3,h/12+.3);}c.globalAlpha=1;
 let i=0;const cell=(x,y)=>{c.fillStyle=(i++ +Math.floor(fx.t*2))%7<3?INK:IVORY;c.fillRect(x-size/2,y-size/2,size,size)};
 for(let x=b.left;x<=b.right;x+=step){cell(x,b.top);cell(x,b.bottom)}for(let y=b.top+step;y<b.bottom;y+=step){cell(b.left,y);cell(b.right,y)}c.restore();
}
function faceArt(c,geo,fx){const f=geo.faceCounter;c.save();c.fillStyle=f.hurt?IVORY:INK;for(const q of f.cells)c.fillRect(q.x,q.y,q.w,q.h);
 for(const p of f.projectiles){c.fillStyle=p.kind==='white'?IVORY:INK;if(p.side==='returned'&&fx.gain){c.globalAlpha=.18;for(const q of p.cells)c.fillRect(q.x-p.vx*.025,q.y-p.vy*.025,q.w,q.h);c.globalAlpha=1;}for(const q of p.cells)c.fillRect(q.x,q.y,q.w,q.h);}c.restore();
}
function faceActors(c,geo,fx,reduced){const a=geo.faceCounter.actor,h=a.human,foot=h.y+h.h,cx=h.x+8,phase=reduced?0:geo.time*10,jump=a.air,punch=a.punchAge>=0&&a.punchAge<.48,lean=punch?8:jump?-3:4;
 c.save();c.strokeStyle=geo.faceCounter.invulnerable&&Math.floor(geo.time*8)%2?IVORY:INK;c.fillStyle=c.strokeStyle;c.lineWidth=5;c.lineCap='square';c.lineJoin='miter';c.fillRect(cx-5+lean,foot-57,10,11);
 c.beginPath();c.moveTo(cx+lean,foot-45);c.lineTo(cx-3,foot-27);c.lineTo(cx+5,foot-14);c.lineTo(cx+(jump?-6:Math.sin(phase)*11),foot);c.moveTo(cx-3,foot-27);c.lineTo(cx-11,foot-15);c.lineTo(cx-(jump?15:Math.sin(phase)*10),foot-2);c.stroke();
 c.beginPath();c.moveTo(cx+lean,foot-42);if(punch){c.lineTo(cx+23,foot-48);c.lineTo(cx+48,foot-45);}else{c.lineTo(cx-12,foot-34);c.lineTo(cx+(jump?7:Math.cos(phase)*13),foot-44);}c.stroke();
 const d=a.dog;c.fillRect(d.x+7,d.y+12,22,8);c.fillRect(d.x+25,d.y+6,8,10);c.fillRect(d.x+27,d.y+2,4,8);c.fillRect(d.x+7,d.y+18,4,6);c.fillRect(d.x+23,d.y+18,4,6);c.beginPath();c.moveTo(d.x+7,d.y+13);c.lineTo(d.x,d.y+7);c.stroke();c.restore();
}
function faceDefeat(c,geo,progress,reduced){const f=geo.faceCounter,b=f.bounds,p=clamp(progress,0,1),scatter=reduced?0:Math.max(0,(p-.62)/.38);c.save();c.fillStyle=IVORY;c.globalAlpha=p<.85?1:1-smooth((p-.85)/.15);
 for(let i=0;i<f.cells.length;i++){const q=f.cells[i],x=clamp(q.x+Math.cos(i*2.37)*scatter*180,b.left+16,b.right-q.w-16),y=clamp(q.y+Math.sin(i*2.37)*scatter*160,b.top+16,b.bottom-q.h-16);c.fillRect(x,y,q.w,q.h);}c.restore();
}

// The rendered attack foot uses the same square supplied to engine collision.
function legBossArt(c,frame,fx){
 c.save();for(const q of frame.cells){c.fillStyle='#70f344';c.fillRect(q.x-q.size/2,q.y-q.size/2,q.size,q.size);c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(q.x-q.size/2,q.y-q.size/2,q.size,q.size)}
 const q=frame.foot;c.fillStyle=frame.active?IVORY:'#a6f04e';c.fillRect(q.x-q.size/2,q.y-q.size/2,q.size,q.size);c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(q.x-q.size/2,q.y-q.size/2,q.size,q.size);c.restore();
}
function legDefeat(c,geo,fx,progress,reduced){
 const frame=geo.legSweep;if(!frame)return;const cells=[...frame.cells,frame.foot],b=geo.bounds,p=clamp(progress,0,1);
 c.save();c.globalAlpha=reduced?1:1-smooth(p);c.fillStyle=IVORY;
 for(let i=0;i<cells.length;i++){const q=cells[i],distance=reduced?0:(38+(i%9)*11)*p,angle=i*2.399963,
  x=clamp(q.x+Math.cos(angle)*distance,b.left+30,b.right-30),y=clamp(q.y+Math.sin(angle)*distance+(reduced?0:75*p*p),b.top+75,frame.floor-12);c.fillRect(x-q.size/2,y-q.size/2,q.size,q.size)}c.restore();
}

function attacks(c,geo,fx){if(geo.faceCounter){faceArt(c,geo,fx);return;}if(geo.legSweep){legBossArt(c,geo.legSweep,fx);return;}for(const a of geo.attacks||[]){if(a.phase==='waiting'||a.phase==='cleared'||a.phase==='anchored')continue;
 const s=a.size||28;c.save();c.translate(a.target.x,a.target.y);c.strokeStyle=IVORY;c.lineWidth=2;c.strokeRect(-s*.65,-s*.65,s*1.3,s*1.3);c.restore();
 if(a.phase==='flight'){c.fillStyle=INK;c.fillRect(a.x-s/2-3,a.y-s/2-3,s+6,s+6);c.fillStyle=fx.p.hot;c.fillRect(a.x-s/2,a.y-s/2,s,s);c.fillStyle=INK;c.fillRect(a.x-5,a.y-5,10,10)}
 }
 for(const q of geo.projectiles||[]){if(q.phase==='waiting'||q.phase==='cleared')continue;const w=q.width||16,h=q.height||w;c.fillStyle=INK;c.fillRect(q.x-w/2-3,q.y-h/2-3,w+6,h+6);c.fillStyle=q.owner==='player'?IVORY:fx.p.hot;if(q.decoy||q.phase==='decoy'){c.strokeStyle=IVORY;c.lineWidth=2;c.strokeRect(q.x-w/2,q.y-h/2,w,h)}else{c.fillRect(q.x-w/2,q.y-h/2,w,h);c.fillStyle=fx.p.fold;c.fillRect(q.x-w*.2,q.y-h*.2,w*.4,h*.4)}}
 if(geo.boss){const hp=Math.max(0,geo.boss.hp||0),max=Math.max(1,geo.boss.maxHp||hp),unit=23.5,phase=Number.isFinite(geo.boss.phase)?geo.boss.phase:({preview:0,ready:1,active:2,recover:3}[geo.boss.phase]||0),t=fx.t*fx.gain,kind=fx.stage,anticipate=['aim','telegraph','windup','ready'].includes(geo.boss.state||geo.boss.attackPhase||geo.boss.phase)?1:0;
  c.save();c.translate(geo.boss.x||0,geo.boss.y||0);c.scale((geo.boss.width||310)/310,(geo.boss.height||310)/310);c.rotate(kind===3||kind===8?Math.sin(t*.3)*.18:0);
  if(kind===1){const unit=13,headY=-127,aim=((bossLane(geo))-1)*95,stretch=anticipate?1:.25;const limb=(ax,ay,bx,by)=>{const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/14));for(let j=0;j<=n;j++){const f=j/n;c.fillStyle=j%3===0?'#39b562':'#b8ef46';c.fillRect(ax+(bx-ax)*f-unit/2,ay+(by-ay)*f-unit/2,unit,unit);c.strokeStyle=INK;c.lineWidth=1.4;c.strokeRect(ax+(bx-ax)*f-unit/2,ay+(by-ay)*f-unit/2,unit,unit)}};
   for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){c.fillStyle=x===1&&y===0?INK:'#b8ef46';c.fillRect(x*15-7,headY+y*15-7,14,14);c.strokeStyle=INK;c.lineWidth=1.4;c.strokeRect(x*15-7,headY+y*15-7,14,14)}
   limb(0,-98,0,24);limb(0,-70,-65+aim*stretch*.3,10);limb(-65+aim*stretch*.3,10,-95+aim*stretch*.5,65+stretch*40);limb(0,-70,65+aim*stretch*.3,-8);limb(65+aim*stretch*.3,-8,95+aim*stretch*.5,70+stretch*40);limb(0,24,-45,90);limb(-45,90,-78,175);limb(0,24,48,92);limb(48,92,85,175);
  }
  for(let y=-6;y<=6;y++)for(let x=-6;x<=6;x++){if(kind===1||kind===9&&geo.track?.kind==='heart')continue;const ax=Math.abs(x),ay=Math.abs(y);let on=false;
   if(kind===0)on=(ay<2&&ax<6)||(ax<2&&ay<6);
   else if(kind===1)on=ay<2&&ax<4||ay>=2&&ay<5&&ax<2||y===-4&&ax<3||y>2&&ax>2&&ax<5;
   else if(kind===2)on=ay===ax&&ax<6||ay===5&&ax<5;
   else if(kind===3)on=ax+ay>=4&&ax+ay<=6||ax<2&&ay<2;
   else if(kind===4)on=ax===4&&ay<6||ay===5&&ax<5||y===0&&ax<3;
   else if(kind===5)on=ax<2&&ay<6||ay<2&&ax<6||ay===4&&ax<4;
   else if(kind===6)on=ax>1&&ax<5&&ay<5&&!(ay<2&&ax===3);
   else if(kind===7)on=(Math.max(ax,ay)===5)||(Math.max(ax,ay)===2);
   else if(kind===8)on=ax+ay===6||ax===0&&ay<4||ay===0&&ax<4;
   else{const u=x/6,v=-y/6+.13;const heart=(u*u+v*v-.65)**3-u*u*v*v*v;on=heart<.055&&heart>-.14;}
   if(!on)continue;const side=unit*.88,shift=(kind===1?Math.sin(t*2+x*.2)*(ay>2?unit*.4:unit*.08):kind===3?Math.sin(t+y*.3)*unit*.22:Math.sin(t*1.2+phase+x*.15)*2),dx=(x<0?-1:1)*anticipate*unit*(ay<2?.6:.15);c.fillStyle=kind===1?((x+y)%3===0?'#39b562':'#b8ef46'):(x+y+phase)%4===0?fx.p.hot:(ax===5||ay===5?INK:IVORY);c.fillRect(x*unit-side/2+dx,y*unit-side/2+shift,side,side);c.strokeStyle=INK;c.lineWidth=1.4;c.strokeRect(x*unit-side/2+dx,y*unit-side/2+shift,side,side);}
  for(let i=0;i<(geo.boss.ruleId==='boundary-strike'?0:max);i++){c.fillStyle=i<hp?fx.p.hot:INK;c.fillRect((i-(max-1)/2)*10-3,unit*7.5,6,6)}c.restore();
 }

}
function actionCue(c,geo,fx,symbolScale=1){const cue=geo.cue,boss=geo.boss;if(!cue)return;
 if(boss&&Number.isFinite(cue.targetLane)&&['locked-lane','safe-lane-sequence'].includes(boss.ruleId)){for(const lane of geo.lanes||[]){const x=lane.x,selected=lane.index===cue.targetLane;c.globalAlpha=selected?.9:.4;c.strokeStyle=selected?(boss.ruleId==='locked-lane'?PINK:fx.p.hot):IVORY;c.lineWidth=selected?4:2;c.strokeRect(x-lane.width/2,lane.top,lane.width,lane.bottom-lane.top);if(selected){c.fillStyle=c.strokeStyle;c.fillRect(x-8,lane.top+5,16,16)}}c.globalAlpha=1;}
 if(boss&&['charge-release','open-shield','double-pulse','alternating-relay'].includes(boss.ruleId)){const x=boss.attackTarget?.x??((boss.x||0)+(boss.ruleId==='alternating-relay'?(((boss.maxHp||0)-(boss.hp||0))%2?90:-90):0)),y=boss.attackTarget?.y??((boss.y||0)+45);c.strokeStyle=boss.vulnerable?fx.p.hot:INK;c.lineWidth=4;c.strokeRect(x-20,y-20,40,40);if(!boss.vulnerable){c.fillStyle=INK;c.fillRect(x-20,y-3,40,6)}}
 const q=geo.player;if(!q)return;c.save();c.translate(q.x,q.y);c.rotate(Math.atan2(q.tangent?.y||0,q.tangent?.x??1));c.translate(0,-(q.bodyHeight||60)-23);c.scale(symbolScale,symbolScale);const x=0,y=0;c.fillStyle=INK;c.fillRect(x-13,y-13,26,26);c.strokeStyle=cue.phase==='ready'||cue.phase==='active'?fx.p.hot:IVORY;c.lineWidth=2;c.strokeRect(x-11,y-11,22,22);c.fillStyle=c.strokeStyle;
 if(cue.verb==='wait'){c.fillRect(x-6,y-6,4,12);c.fillRect(x+2,y-6,4,12)}else if(cue.verb==='hold')c.fillRect(x-6,y-6,12,12);else if(cue.verb==='release'){c.fillRect(x-2,y-7,4,14);c.fillRect(x-6,y+1,12,4)}else if(cue.verb==='switch'){c.fillRect(x-7,y-2,14,4);c.fillRect(x+3,y-6,4,12)}else{c.fillRect(x-3,y-3,6,6)}c.restore();
}
// Original-authored brief expression balloons; detailed instruction remains in the HUD.
// Centerward placement protects the body/contact boundary; text never rotates with the runner.
// World-oriented expression typography follows the observed presentation function.
// All wording, priority, lifetime and placement constants are newly authored.
function expressionLayout(geo){
 const e=geo.expression,q=geo.player,b=geo.bounds;
 if(!e||!q||!b||!e.text||e.remaining<=0||geo.cellTransition)return null;
 const angle=Math.atan2(q.tangent?.y||0,q.tangent?.x??1),w=[...e.text].length*28+16,h=40;
 const hx=(Math.abs(Math.cos(angle))*w+Math.abs(Math.sin(angle))*h)/2,hy=(Math.abs(Math.sin(angle))*w+Math.abs(Math.cos(angle))*h)/2;
 const left=b.left??-b.width/2,right=b.right??b.width/2,top=b.top??-b.height/2,bottom=b.bottom??b.height/2;
 if(right-left<hx*2+24||bottom-top<hy*2+24)return null;
 const obstacles=[];
 const box=(x,y,rx,ry=rx)=>obstacles.push({left:x-rx,right:x+rx,top:y-ry,bottom:y+ry});
 box(q.x,q.y,72);if(geo.companion)box(geo.companion.x,geo.companion.y,48);
 for(const z of [...(geo.hazards||[]),...(geo.projectiles||[]),...(geo.attacks||[])]){
  if(z.visible===false||z.done||z.active===false||['resolved','cleared','waiting'].includes(z.phase))continue;
  if(z.collisionPolygon?.length){const xs=z.collisionPolygon.map(p=>p.x),ys=z.collisionPolygon.map(p=>p.y);obstacles.push({left:Math.min(...xs)-12,right:Math.max(...xs)+12,top:Math.min(...ys)-12,bottom:Math.max(...ys)+12});}
  else if(Number.isFinite(z.x)&&Number.isFinite(z.y))box(z.x,z.y,(z.width||z.size||32)/2+16,(z.height||z.size||32)/2+16);
 }
 const nx=q.inward?.x||0,ny=q.inward?.y??-1,tx=q.tangent?.x??1,ty=q.tangent?.y||0;
 const placements=[[130,0],[170,0],[130,110],[130,-110],[210,0],[170,110],[170,-110]];
 if(geo.encounter)for(const radius of [130,170,210])for(let i=0;i<8;i++)placements.push([Math.cos(i*Math.PI/4)*radius,Math.sin(i*Math.PI/4)*radius]);
 for(const [distance,side]of placements){
  const x=clamp(q.x+nx*distance+tx*side,left+hx+12,right-hx-12),y=clamp(q.y+ny*distance+ty*side,top+hy+12,bottom-hy-12);
  const rect={left:x-hx,right:x+hx,top:y-hy,bottom:y+hy};
  if(obstacles.some(o=>rect.left<o.right&&rect.right>o.left&&rect.top<o.bottom&&rect.bottom>o.top))continue;
  return {x,y,angle,width:w,height:h,bounds:rect,text:e.text,remaining:e.remaining,duration:e.duration,kind:e.kind};
 }
 return null; // A cosmetic reaction may disappear; critical geometry must not.
}
function expression(c,geo,fx,reduced){
 const p=expressionLayout(geo);if(!p)return;
 const alpha=reduced?1:Math.min(1,(p.duration-p.remaining)/.08,p.remaining/.12);
 c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.globalAlpha=Math.max(0,alpha);c.font='900 28px sans-serif';c.textAlign='center';c.textBaseline='middle';
 // Fill offsets preserve the same outline in both Canvas and the static recorder.
 for(const [color,radius]of [[INK,4],[IVORY,2]]){c.fillStyle=color;for(let n=0;n<8;n++){const a=n*Math.PI/4;c.fillText(p.text,Math.cos(a)*radius,Math.sin(a)*radius);}}
 c.fillStyle=PINK;c.fillText(p.text,0,0);c.restore();
}
function speech(c,geo,fx,reduced=false){if(Object.hasOwn(geo,'expression'))return expression(c,geo,fx,reduced);const q=geo.player,cue=geo.cue,b=geo.bounds;if(!q||!cue||cue.phase!=='ready')return;
 const throwing=geo.boss&&['charge-release','open-shield','double-pulse','alternating-relay'].includes(geo.boss.ruleId),text=cue.verb==='hold'?'꾹…':cue.verb==='release'?'놓아!':cue.verb==='switch'?'옆으로!':cue.verb==='wait'?'그대로!':throwing?'던져!':cue.id?.endsWith('-kick')?'한 번 더!':'뛰어!',w=text.length*15+26,h=32;
 let x=clamp(q.x+(q.inward?.x||0)*160,-b.width/2+w/2+12,b.width/2-w/2-12),y=clamp(q.y+(q.inward?.y??-1)*160,-b.height/2+h/2+12,b.height/2-h/2-12);
 // If an inward jump places the body under its balloon, move it to an open side.
 if(Math.hypot(x-q.x,y-q.y)<90)x=clamp(q.x+(q.x>0?-108:108),-b.width/2+w/2+12,b.width/2-w/2-12);
 const distance=Math.max(1,Math.hypot(q.x-x,q.y-y)),dx=(q.x-x)/distance,dy=(q.y-y)/distance,edge=Math.min(w/2/Math.max(.001,Math.abs(dx)),h/2/Math.max(.001,Math.abs(dy))),ex=x+dx*edge,ey=y+dy*edge;
 c.save();polygon(c,[[ex-dy*6,ey+dx*6],[ex+dx*12,ey+dy*12],[ex+dy*6,ey-dx*6]],IVORY,INK,2.5);rounded(c,x-w/2,y-h/2,w,h,5);c.fillStyle=IVORY;c.fill();c.strokeStyle=INK;c.lineWidth=3;c.stroke();c.fillStyle=INK;c.font='bold 15px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y+1);c.restore();
}
// Display instances never create actors, hazards, input handlers or simulation clocks.
// Their source envelope is the engine's canonical rectangular support, not a lobed replacement.
function replicaLayout(geo,cam){const single=reason=>({kind:'single',requested:geo.layout?.kind||'single',reason,instances:[{id:'main',scale:1,x:0,y:0}]}),spec=geo.layout;
 if(!['quadrant-replicas','stripe-replicas'].includes(spec?.kind)||geo.boss)return single(geo.boss?'boss':null);
 const points=geo.track?.points;if(!points?.length||geo.track.closed===false)return single('canonical-track-required');
 const xs=points.map(p=>Array.isArray(p)?p[0]:p.x),ys=points.map(p=>Array.isArray(p)?p[1]:p.y),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys),w=right-left,h=bottom-top;
 if(!(w>0&&h>0)||points.some((p,i)=>Math.min(Math.abs(xs[i]-left),Math.abs(xs[i]-right),Math.abs(ys[i]-top),Math.abs(ys[i]-bottom))>1))return single('canonical-rectangle-required');
 if(spec.kind==='stripe-replicas'){
  const b=geo.bounds,horizontal=spec.orientation!=='vertical',count=3,gap=12,pad=12,bw=b.right-b.left-2*pad,bh=b.bottom-b.top-2*pad,pw=horizontal?bw:(bw-gap*(count-1))/count,ph=horizontal?(bh-gap*(count-1))/count:bh,q=geo.player;
  // A shared camera crop keeps each real actor readable without stretching any collider.
  if(!q||Math.min(pw,ph)*cam.scale<48)return single('stripe-panel-below-48px');
  const bodyHeight=q.bodyHeight||60,longFit=horizontal?pw/(w+64):ph/(h+64),shortFit=Math.min(pw,ph)*.45/bodyHeight,minScale=18/(bodyHeight*cam.scale),tx=q.tangent?.x??1,ty=q.tangent?.y||0,nx=q.inward?.x??ty,ny=q.inward?.y??-tx;
  // Fit the actual approaching collider, not its cue. The lookahead clock already
  // accounts for speed in engine geometry; inactive pulse cells still need anticipation.
  const imminent=(geo.hazards||[]).filter(h=>!h.done&&h.visible!==false&&h.phase!=='resolved'&&((h.id===geo.cue?.hazardId?geo.cue?.timeUntilActive:((h.damageAt??h.time)-geo.time))??Infinity)<=1.8);
  const required=[];for(const foot of [{x:q.x,y:q.y},{x:q.baseX??q.x,y:q.baseY??q.y}])for(const along of [-26,26])for(const rise of [0,bodyHeight+8])required.push({x:foot.x+tx*along+nx*rise,y:foot.y+ty*along+ny*rise});
  for(const h of imminent){if(h.collisionPolygon?.length)required.push(...h.collisionPolygon);else if(Number.isFinite(h.x)&&Number.isFinite(h.y))required.push({x:h.x-(h.width||24)/2,y:h.y-(h.height||24)/2},{x:h.x+(h.width||24)/2,y:h.y+(h.height||24)/2});if(Number.isFinite(h.baseX)&&Number.isFinite(h.baseY))required.push({x:h.baseX,y:h.baseY});}
  const actionBounds={left:Math.min(...required.map(p=>p.x))-16,right:Math.max(...required.map(p=>p.x))+16,top:Math.min(...required.map(p=>p.y))-16,bottom:Math.max(...required.map(p=>p.y))+16},fitScale=Math.min(pw/(actionBounds.right-actionBounds.left),ph/(actionBounds.bottom-actionBounds.top));
  if(fitScale<minScale-1e-9)return{...single('stripe-action-needs-single-view'),collisionSpace:'canonical',actionBounds,focusHazards:imminent.map(h=>h.id)};
  const scale=Math.min(Math.max(Math.min(longFit,shortFit),minScale),fitScale),bodyPixels=scale*cam.scale*bodyHeight,lead=(Math.abs(tx)*pw+Math.abs(ty)*ph)/scale*.22;
  // Keep the long-axis fill, then pan only as far as needed to contain feet/body
  // and every imminent polygon. A too-tight panel uses the full canonical view.
  const focus=(value,lo,hi,span)=>span>=hi-lo?(lo+hi)/2:clamp(value,lo+span/2,hi-span/2),cx=clamp(focus(q.x+tx*lead+nx*36,left-32,right+32,pw/scale),actionBounds.right-pw/scale/2,actionBounds.left+pw/scale/2),cy=clamp(focus(q.y+ty*lead+ny*36,top-32,bottom+32,ph/scale),actionBounds.bottom-ph/scale/2,actionBounds.top+ph/scale/2);
  const instances=Array.from({length:count},(_,i)=>{const left=b.left+pad+(horizontal?0:i*(pw+gap)),top=b.top+pad+(horizontal?i*(ph+gap):0),clip={left,top,right:left+pw,bottom:top+ph,width:pw,height:ph};return{id:'strip-'+i,scale,x:left+pw/2-scale*cx,y:top+ph/2-scale*cy,visible:true,clip,framebufferClip:{left:left*cam.scale+cam.offsetX,top:top*cam.scale+cam.offsetY,right:(left+pw)*cam.scale+cam.offsetX,bottom:(top+ph)*cam.scale+cam.offsetY,width:pw*cam.scale,height:ph*cam.scale}};});
  return{kind:'stripe-replicas',requested:spec.kind,orientation:horizontal?'horizontal':'vertical',count,collisionSpace:'canonical',progress:1,gap,bodyPixels,fit:'action-aware-crop',actionBounds,focusHazards:imminent.map(h=>h.id),canonicalBounds:{left,right,top,bottom,width:w,height:h},instances};
 }
 const b=geo.bounds,bw=b.right-b.left,bh=b.bottom-b.top,progress=clamp(Number(spec.progress)||0,0,1),gap=48*(1-smooth(progress)),scale=Math.min((bw-40-gap)/(2*w),(bh-40-gap)/(2*h)),bodyPixels=scale*cam.scale*(geo.player?.bodyHeight||60);
 // Four copies remain on normal phone viewports; exceptionally small surfaces report a truthful fallback.
 if(!Number.isFinite(scale)||scale<=0||bodyPixels<16)return single('replica-body-below-16px');
 const cx=(left+right)/2,cy=(top+bottom)/2,bx=(b.left+b.right)/2,by=(b.top+b.bottom)/2;
 return {kind:'quadrant-replicas',requested:spec.kind,collisionSpace:'canonical',progress,gap,bodyPixels,canonicalBounds:{left,right,top,bottom,width:w,height:h},instances:[[-1,-1,'ul'],[1,-1,'ur'],[-1,1,'ll'],[1,1,'lr']].map(([x,y,id])=>({id,scale,x:bx+x*(scale*w+gap)/2-scale*cx,y:by+y*(scale*h+gap)/2-scale*cy,visible:true}))};
}
// Only world-local layers repeat. The surrounding field, clear and application HUD are global.
function worldLayer(c,geo,fx,reduced,{replica=false,cueScale=1,compositionCue=false}={}){
 if(!replica)speech(c,geo,fx,reduced);support(c,geo,fx);portal(c,geo.portal,fx);wake(c,geo,fx,reduced);
 attacks(c,geo,fx);for(const h of geo.hazards||[]){if(h.visible===false)continue;const attack=(geo.attacks||[]).find(a=>a.id===h.id);if(h.type==='seal'&&attack&&attack.phase!=='anchored'&&attack.phase!=='cleared')continue;hazard(c,h,fx.p)}
 response(c,geo,fx,reduced);if(!compositionCue)actionCue(c,geo,fx,cueScale);if(geo.player)characters(c,geo,fx,reduced);
}
// A bounded, deterministic presentation of the source-observed fragmented
// transition. It never advances or substitutes the collision simulation.
function cellScatter(c,geo,fx,reduced){const t=geo.cellTransition;if(!t)return;const u=clamp(t.progress,0,1),f=smooth(u),spread=Math.sin(Math.PI*u),b=geo.bounds;
 const count=Math.min(192,t.from.length-1,t.to.length-1),size=14+spread*18,colors=[INK,fx.p.wall,fx.p.hot,IVORY,fx.p.fold];
 c.save();
 if(reduced){c.globalAlpha=1-f;support(c,{...geo,track:{...geo.track,points:t.from}},fx);c.globalAlpha=f;support(c,{...geo,track:{...geo.track,points:t.to}},fx);c.restore();return;}
 for(let i=0;i<count;i++){const a=t.from[i],z=t.to[i],dx=(((i*73)%193)/192-.5)*(b.right-b.left)*1.2,dy=(((i*47)%191)/190-.5)*(b.bottom-b.top)*1.2;
  const x=clamp(a.x+(z.x-a.x)*f+dx*spread,b.left+size/2,b.right-size/2),y=clamp(a.y+(z.y-a.y)*f+dy*spread,b.top+size/2,b.bottom-size/2);
  c.fillStyle=colors[i%colors.length];c.fillRect(x-size/2,y-size/2,size,size);
 }
 c.restore();
}
// Presentation only: terminal engine geometry and result remain immutable.
function aftermathActorScale(geo,cam){return Math.max(1,24/((geo.player?.bodyHeight||60)*cam.scale))}
function aftermathFrame(c,geo,fx){
 const b=geo.bounds,left=b.left+20,right=b.right-20,top=b.top+62,bottom=geo.player?.baseY??b.bottom-45,step=22,size=15;
 const cell=(x,y,i)=>{c.fillStyle=i%4===0?fx.p.wall:IVORY;c.fillRect(x-size/2,y-size/2,size,size)};
 let i=0;for(let x=left;x<=right;x+=step){cell(x,top,i++);cell(x,bottom,i++)}for(let y=top+step;y<bottom;y+=step){cell(left,y,i++);cell(right,y,i++)}
}
function aftermath(c,geo,fx,view,reduced,cam){
 const progress=clamp(view.elapsed/(view.release||.65),0,1);
 if(view.kind==='face'){faceArena(c,geo,fx);if(view.phase==='release')faceDefeat(c,geo,progress,reduced);}
 else if(view.kind==='sun'||view.kind==='leg'){
  // Presentation after a real terminal result: the room remains, projectiles do not.
  aftermathFrame(c,geo,view.kind==='leg'?{...fx,p:{...fx.p,wall:'#70f344'}}:fx);
  if(view.phase==='release'&&view.kind==='leg')legDefeat(c,geo,fx,progress,reduced);
  else if(view.phase==='release'){
   c.save();c.globalAlpha=reduced?1:1-smooth(Math.max(0,(progress-.35)/.65));
   attacks(c,{...geo,attacks:[],projectiles:[]},{...fx,p:{...fx.p,hot:IVORY,fold:IVORY,wall:IVORY}});c.restore();
  }
 }else{
  const opacity=reduced?(view.phase==='release'?1:0):1-smooth(progress);
  if(opacity>0){c.save();c.globalAlpha=opacity;support(c,geo,fx);c.restore()}
 }
 const actorScale=aftermathActorScale(geo,cam),anchor=geo.player;
 c.save();c.translate(anchor.x,anchor.y);c.scale(actorScale,actorScale);c.translate(-anchor.x,-anchor.y);characters(c,{...geo,expression:null,feedback:null},fx,true);c.restore();
 if(view.phase==='line'){
  const b=geo.bounds,p=geo.player,font=Math.max(28,16/cam.scale),width=Math.min(b.right-b.left-48,view.text.length*font),x=clamp(p.x,b.left+width/2+24,b.right-width/2-24),y=clamp(p.y-110,b.top+font+24,b.bottom-font-24);
  c.save();c.font='900 '+font+'px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillStyle=INK;
  for(const [dx,dy]of [[-3,-3],[0,-3],[3,-3],[-3,0],[3,0],[-3,3],[0,3],[3,3]])c.fillText(view.text,x+dx,y+dy,width);
  c.fillStyle=IVORY;c.fillText(view.text,x,y,width);c.restore();
 }
}
function draw(c,run,opt={},geometry){const geo=geometry||run.geometry(opt.aftermath?.elapsed||0),b=geo.bounds,nominal=run?.room||root.QuadRiftSquare?.ROOMS?.[geo.room?.index]||geo.room;
 if(geo.encounter)return EncounterArt.draw(c,geo,opt,{camera,parameters,bossHealthBar,expression});
 // Fit the complete room's authored 16% fold envelope, not its current width.
 // Thus actual walls visibly travel during a fold instead of camera fit cancelling it.
 const frame=geo.cameraEnvelope||{width:Math.max(nominal?.width||b.width,geo.transition?.to?.width||0)*1.16,height:Math.max(nominal?.height||b.height,geo.transition?.to?.height||0)*1.16},cam=root.MongyuMobile?.camera(opt.viewport,geo,opt,run)||camera(opt.viewport,b,frame),fx=parameters(geo,opt),layout=replicaLayout(geo,cam),replica=layout.kind!=='single',stripes=layout.kind==='stripe-replicas',reduced=!!(opt.reduced||geo.reducedMotion);c.save();c.clearRect(0,0,cam.width,cam.height);c.translate(cam.offsetX,cam.offsetY);c.scale(cam.scale,cam.scale);exterior(c,cam,b,fx);
 // Clip chamber to the exact room; perspective motion never moves collision geometry.
 c.save();rounded(c,b.left,b.top,b.width||b.right-b.left,b.height||b.bottom-b.top,geo.room?.radius||0);c.clip();if(geo.boss)c.globalAlpha=.18;else if(replica)c.globalAlpha=.32;chamber(c,b,fx);c.restore();velocity(c,cam,geo,fx);
 if(opt.aftermath)aftermath(c,geo,fx,opt.aftermath,reduced,cam);else if(geo.cellTransition)cellScatter(c,geo,fx,reduced);else{
  for(const instance of layout.instances){c.save();if(instance.clip){const r=instance.clip;rounded(c,r.left,r.top,r.width,r.height,0);c.clip();}c.translate(instance.x,instance.y);c.scale(instance.scale,instance.scale);worldLayer(c,geo,fx,reduced,{replica,compositionCue:stripes,cueScale:replica?Math.max(1,16/(26*cam.scale*instance.scale)):1});c.restore();}
  if(stripes){
   // One composition cue/expression; all three views still share one canonical event.
   const i=layout.instances[0],point=q=>({...q,x:q.x*i.scale+i.x,y:q.y*i.scale+i.y}),shape=q=>({...point(q),width:(q.width||0)*i.scale,height:(q.height||0)*i.scale,size:(q.size||0)*i.scale,collisionPolygon:q.collisionPolygon?.map(point)}),overlay={...geo,player:{...point(geo.player),bodyHeight:(geo.player.bodyHeight||60)*i.scale},hazards:(geo.hazards||[]).map(shape),attacks:(geo.attacks||[]).map(shape)};
   actionCue(c,overlay,fx,Math.max(1,16/(26*cam.scale)));speech(c,overlay,fx,reduced);
  }
 }
 if(geo.faceCounter||geo.legSweep||['sun','leg','face'].includes(opt.aftermath?.kind))bossHealthBar(c,geo);else heartBossHud(c,geo);c.restore();return {kind:'r38-square',stage:fx.stage,clock:fx.t,gain:fx.gain,camera:cam,layout};}
function title(c,opt={}){const b={left:-145,top:-145,right:145,bottom:145,width:290,height:290},t=Number(opt.time)||0;return draw(c,null,opt,{room:{index:Math.floor(t/15)%6,radius:14},bounds:b,time:t,corner:{progress:0},hazards:[],player:{x:-44,y:145,tangent:{x:1,y:0},height:0}})}
root.MongyuSquareArt={nativeMaskSupport,faceArena,faceArt,faceActors,faceDefeat,legBossArt,legDefeat,draw,title,camera,parameters,exterior,chamber,support,heartSupport,heartStrike,heartBossHud,bossHealthBar,aftermathFrame,hazard,wall,runner,portal,attacks,palettes,intensePalettes,supportPath,actionCue,characters,dogCompanion,velocity,wake,speech,expression,expressionLayout,response,replicaLayout,worldLayer,aftermath,aftermathActorScale};if(typeof module!=='undefined')module.exports=root.MongyuSquareArt;
})(globalThis);
