/* Original R35 architectural dream. Pure presentation; no wall clock or game writes. */
(function(root){'use strict';
const palettes=[{bg:'#102f39',deep:'#286a70',light:'#edf0d4',accent:'#efc879',danger:'#ec8590'}, {bg:'#282438',deep:'#655774',light:'#f0e6d1',accent:'#dfb379',danger:'#ed879a'}, {bg:'#18283d',deep:'#3e5e7c',light:'#e2e9dc',accent:'#c7bded',danger:'#ef8c9b'}];
function camera(viewport={}, {gameplay=false}={}){const width=Math.max(1,Number(viewport.width)||360),height=Math.max(1,Number(viewport.height)||480),wide=gameplay&&width>height,span=wide?300:480,scale=Math.min(width/360,height/span),offsetX=(width-360*scale)/2,offsetY=(height-span*scale)/2-(wide?80*scale:0);return {width,height,scale,offsetX,offsetY,left:-offsetX/scale,right:(width-offsetX)/scale,top:-offsetY/scale,bottom:(height-offsetY)/scale}}
function shape(c,points,fill,stroke=null,width=1){c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function oval(c,x,y,rx,ry,color,stroke=null,width=1){c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,Math.PI*2);if(color){c.fillStyle=color;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function line(c,points,color,width=1){c.beginPath();points.forEach((q,i)=>i?c.lineTo(...q):c.moveTo(...q));c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.stroke()}
function garden(c,cam,p,t,gain){
 const drift=Math.sin(t*.17)*gain*19,horizon=277;
 shape(c,[[cam.left,cam.top],[cam.right,cam.top],[cam.right,horizon],[cam.left,horizon]],'#352b49');
 // An upside-down orchard hangs above a chasm; its roots become the bridges.
 for(const [x,y,w]of [[-35,cam.top+122,184],[187,cam.top+167,210]]){
  shape(c,[[x,y],[x+w,y+22],[x+w-19,y+47],[x+17,y+31]],'#735c76');shape(c,[[x,y],[x+35,y-26],[x+w-20,y-4],[x+w,y+22]],'#bd9a91');
  for(let j=0;j<5;j++){const q=x+20+j*w/5;c.beginPath();c.moveTo(q,y+26);c.bezierCurveTo(q+18+drift,y+65,q-28,y+89,q+drift*.6,y+125);c.strokeStyle=j%2?'#9e8793':'#836d83';c.lineWidth=5-j*.4;c.stroke();oval(c,q+drift*.6,y+121,8,15,j%2?'#cfb197':'#8fb2a5')}
 }
 // A distant folded viaduct threads through the canopy without nested frames.
 c.beginPath();c.moveTo(cam.left,226);c.bezierCurveTo(50+drift,171,125,242,190,192);c.bezierCurveTo(253,143,282,185,cam.right,138);c.lineTo(cam.right,160);c.bezierCurveTo(284,211,250,166,195,219);c.bezierCurveTo(125,271,46+drift,200,cam.left,254);c.closePath();c.fillStyle='#785f80';c.fill();c.strokeStyle='#bb9aa3';c.lineWidth=2;c.stroke();
 for(const [x,y,flip]of [[46,282,-1],[278,253,1]]){c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+flip*28,y-53,x-flip*(18+drift),y-74,x+flip*10,y-121);c.strokeStyle='#9a7d87';c.lineWidth=8;c.stroke();for(let j=0;j<5;j++){const yy=y-30-j*18,xx=x+Math.sin(j+flip)*12;oval(c,xx+flip*15,yy,22-j*2,9,p.deep);line(c,[[xx,yy],[xx+flip*28,yy-2]],'#bcae9a',.7)}}
 // Planters sit behind the playable ledge; their lit upper faces define depth.
 shape(c,[[cam.left,cam.bottom],[cam.right,cam.bottom],[320,285],[36,285]],'#28283c');
 for(const [x,y,w]of [[-24,290,117],[245,292,126]]){shape(c,[[x,y],[x+w,y-9],[x+w-19,y+18],[x+10,y+24]],'#5f526b');shape(c,[[x,y],[x+w,y-9],[x+w-26,y-27],[x+22,y-17]],'#8e8584');for(let j=0;j<6;j++)oval(c,x+15+j*w/7,y-17-j%2*9,13,5,j%2?'#88a99b':'#a9b492')}
 // A broad Möbius root crosses the lower chasm. Its back face stays darker.
 const base=cam.bottom-102;c.beginPath();c.moveTo(cam.left,base+16);c.bezierCurveTo(94+drift,base-94,254-drift,base+93,cam.right,base-23);c.lineTo(cam.right,base+4);c.bezierCurveTo(253-drift,base+128,95+drift,base-57,cam.left,base+49);c.closePath();c.fillStyle='#816a82';c.fill();c.strokeStyle='#b99a9e';c.lineWidth=1;c.stroke();
 if(gain>.7){for(let i=0;i<3;i++){const x=70+i*105+drift*.3,y=cam.top+72+i%2*33;shape(c,[[x-26,y],[x,y-17],[x+28,y+2],[x+1,y+18]],'#a48a94');shape(c,[[x-26,y],[x+1,y+18],[x+1,y+31],[x-21,y+13]],'#5c4d6b');oval(c,x,y-16,10,5,'#bad0ac')}}
 return {clock:t,gain,stage:1};
}
function observatory(c,cam,p,t,gain){
 const drift=Math.sin(t*.14)*gain*17,cx=184+drift,cy=167;
 shape(c,[[cam.left,cam.top],[cam.right,cam.top],[cam.right,cam.bottom],[cam.left,cam.bottom]],'#151e35');
 // One eclipse, huge enough to be a place. A broken vault reveals its horizon.
 oval(c,cx,cy,112,107,'#6b79a0');oval(c,cx+13,cy-13,105,105,'#101b31');oval(c,cx-43,cy+22,11,9,'#b3b5c8');
 for(const [x,y,r]of [[35,125,1.5],[83,63,2],[282,76,1],[316,190,2],[126,271,1.5],[205,39,1]])oval(c,x+drift*.2,y,r,r,'#a2a7bb');
 // Three unconnected vault fragments share a vanishing point, with deep returns.
 const top=cam.top;
 shape(c,[[cam.left,top],[140,top],[99,87],[47,145],[cam.left,122]],'#344a68');shape(c,[[140,top],[99,87],[112,95],[155,top]],'#65748c');
 shape(c,[[cam.right,top],[252,top],[281,94],[cam.right,139]],'#485a7b');shape(c,[[252,top],[281,94],[270,104],[236,top]],'#7c83a1');
 shape(c,[[cam.left,225],[63,188],[83,247],[40,290],[cam.left,281]],'#2c425e');shape(c,[[63,188],[83,247],[96,251],[78,184]],'#6b7d92');
 shape(c,[[cam.right,213],[301,185],[281,272],[cam.right,291]],'#354b69');shape(c,[[301,185],[281,272],[268,275],[288,182]],'#7886a0');
 // An orrery is a physical brass instrument, not a debug ring around the scene.
 const ox=265,oy=275;line(c,[[ox-23,oy+8],[ox+20,oy+8]],'#6c7a8d',4);line(c,[[ox,oy+8],[ox,oy-43]],'#7f859a',3);oval(c,ox,oy-49,23,8,null,p.accent,1.5);line(c,[[ox-17,oy-63],[ox+17,oy-35]],'#7986a0',2);oval(c,ox+13,oy-55,4,4,p.accent);
 shape(c,[[cam.left,cam.bottom],[cam.right,cam.bottom],[cam.right,298],[cam.left,298]],'#17283e');
 // Fractured observatory stairs descend toward the eclipse's reflected axis.
 for(let i=0;i<5;i++){const y=cam.bottom-33-i*28,x=cam.left+24+i*21,w=cam.right-cam.left-48-i*37;shape(c,[[x,y],[x+w,y-16],[x+w-9,y+4],[x+8,y+17]],i%2?'#344863':'#2b3d57');line(c,[[x,y],[x+w,y-16]],'#65718a',1)}
 if(gain>.7){c.beginPath();c.moveTo(cam.left,cam.top+88);c.bezierCurveTo(113+drift,cam.top+198,223-drift,cam.top-48,cam.right,cam.top+104);c.strokeStyle='#897e9c';c.lineWidth=14;c.stroke();c.strokeStyle='#c3b4be';c.lineWidth=2;c.stroke()}
 return {clock:t,gain,stage:2};
}
function room(c,cam,p,{time=0,reduced=false,dreamIntensity='balanced',chapter=0}={}){
 const t=reduced?0:Math.max(0,time),gain=reduced?0:dreamIntensity==='calm'?.28:dreamIntensity==='intense'?1:.6,beat=root.MongyuDreamScore?.timeline?.(t,Math.min(2,Math.floor(chapter/4)))?.beat??t*2,sway=Math.sin(t*.24)*gain*22;
 c.fillStyle=p.bg;c.fillRect(cam.left,cam.top,cam.right-cam.left,cam.bottom-cam.top);
 const stage=Math.min(2,Math.floor(chapter/4));if(stage===1)return garden(c,cam,p,t,gain);if(stage===2)return observatory(c,cam,p,t,gain);
 shape(c,[[cam.left,cam.top],[20,cam.top],[20,282],[cam.left,cam.bottom]],'#0b2532');shape(c,[[cam.right,cam.top],[330,cam.top],[330,282],[cam.right,cam.bottom]],'#102738');shape(c,[[cam.left,cam.top],[cam.right,cam.top],[330,58],[20,58]],'#0a2530');
 // One distant arched window; no concentric wallpaper or cell overlay.
 c.beginPath();c.moveTo(36,280);c.lineTo(36,151);c.bezierCurveTo(36,56,192,48,192,151);c.lineTo(192,280);c.closePath();c.fillStyle=p.deep;c.fill();c.strokeStyle='#0c2635';c.lineWidth=9;c.stroke();
 oval(c,117,145,31,31,p.accent);oval(c,129,139,29,31,p.deep);shape(c,[[104,176],[124,176],[162,275],[63,275]],'#6e9794');line(c,[[113,78],[113,276]],'#183b47',4);line(c,[[40,197],[188,197]],'#183b47',4);
 for(const side of [-1,1]){const x=side<0?28:200;c.beginPath();c.moveTo(x,68);c.bezierCurveTo(x+side*(14+sway),122,x-side*21,208,x+side*7,286);c.lineTo(x+side*24,292);c.bezierCurveTo(x+side*5,207,x+side*(42+sway),123,x+side*23,67);c.closePath();c.fillStyle=side<0?'#315963':'#254958';c.fill();line(c,[[x+side*10,74],[x+side*(15+sway*.3),138],[x+side*5,221],[x+side*13,284]],p.deep,2)}
 // The tidal archive: shelves lean into a canal, and a bridge grows into a vault.
 shape(c,[[221,280],[221,160],[309,145],[309,280]],'#163543');for(let row=0;row<4;row++){const y=184+row*26;line(c,[[223,y],[307,y-6]],'#78958d',3);for(let j=0;j<6;j++){const x=228+j*12,h=13+(j*7+row*3)%10;shape(c,[[x,y-2],[x,y-h],[x+7,y-h-1],[x+7,y-2]],['#52767b','#9a9c84','#7d8b91'][(j+row)%3])}}
 c.beginPath();c.moveTo(cam.left,95);c.bezierCurveTo(113,-25,211,122,cam.right,27);c.lineTo(cam.right,46);c.bezierCurveTo(214,151,107,2,cam.left,125);c.closePath();c.fillStyle='#437c7d';c.fill();c.strokeStyle='#9cb9a2';c.lineWidth=2;c.stroke();
 shape(c,[[cam.left,cam.bottom],[cam.right,cam.bottom],[330,281],[20,281]],'#102c38');for(let i=-4;i<=7;i++)line(c,[[176+(i-1)*22,282],[176+(i-1)*150,cam.bottom]],'#1b3c47',1);for(const y of [311,401,526,700])if(y<cam.bottom)line(c,[[cam.left,y],[cam.right,y]],'#193942',1);
 for(const x of [cam.left+28,cam.right-42])if(x<0||x>360){shape(c,[[x,cam.top],[x+16,cam.top],[x+24,cam.bottom],[x-8,cam.bottom]],'#163542');line(c,[[x+5,cam.top],[x+9,cam.bottom]],'#24505b',2)}
 // The lower canal fills the portrait's depth and turns upward on its far bank.
 const water=cam.bottom-119;c.beginPath();c.moveTo(cam.left,water+49);c.bezierCurveTo(104+sway,water-77,234-sway,water+110,cam.right,water-14);c.lineTo(cam.right,cam.bottom);c.lineTo(cam.left,cam.bottom);c.closePath();c.fillStyle='#245967';c.fill();c.beginPath();c.moveTo(cam.left,water+49);c.bezierCurveTo(104+sway,water-77,234-sway,water+110,cam.right,water-14);c.strokeStyle='#6d9c98';c.lineWidth=6;c.stroke();
 // The ceiling and lower floor turn into one impossible folded stair. Broad
 // contiguous faces, not repeated outlines, carry the high intensity treatment.
 // All folding stays behind/below the literal collision surface.
 const fold=reduced?.24:gain,drift=Math.sin(beat*Math.PI/16)*18*fold;
 if(fold>.1){
  const y=cam.top+45,faces=[
   [[cam.left,y],[76+drift,y+31],[193,y+5],[cam.right,y+91],[cam.right,y+127],[189,y+40],[73+drift,y+68],[cam.left,y+30]],
   [[cam.left,y+30],[73+drift,y+68],[189,y+40],[cam.right,y+127],[cam.right,y+150],[188,y+62],[73+drift,y+88],[cam.left,y+51]],
   [[cam.left,y+51],[73+drift,y+88],[188,y+62],[cam.right,y+150],[cam.right,y+157],[187,y+70],[73+drift,y+96],[cam.left,y+59]]
  ];c.save();c.globalAlpha=Math.min(1,.22+fold*.8);faces.forEach((v,i)=>shape(c,v,['#696e9e','#ad8d94','#dbba86'][i]));c.restore();
  if(fold>.7){
   // A cut in the ceiling reveals a second, inverted room with an off-axis sun.
   shape(c,[[191,y+6],[245,y+28],[295,y+83],[248,y+61]],'#2f4559');shape(c,[[205,y+14],[242,y+30],[266,y+57],[239,y+44]],'#598d91');oval(c,238,y+32,9,6,p.accent);
   for(let i=0;i<5;i++){const x=45+i*55,z=cam.bottom-104+i*8+drift*.3;shape(c,[[x-52,z],[x+5,z-32],[x+61,z+4],[x+2,z+37]],i%2?'#466881':'#5e718e');shape(c,[[x+2,z+37],[x+61,z+4],[x+61,z+16],[x+2,z+51]],'#253e59');line(c,[[x-52,z],[x+5,z-32],[x+61,z+4]],'#b8a8a6',1)}
   // Three branches of the same river climb the room's side returns.
   for(const side of [-1,1]){const x=side<0?12:340;c.beginPath();c.moveTo(x,290);c.bezierCurveTo(x-side*36,220,x+side*(44+drift),164,x-side*2,92);c.lineTo(x+side*12,96);c.bezierCurveTo(x+side*(61+drift),169,x-side*18,224,x+side*12,291);c.closePath();c.fillStyle=side<0?'#897290':'#527d8f';c.fill();c.strokeStyle='#b7aaae';c.lineWidth=1;c.stroke()}
  }
 }
 return {clock:t,gain,beat};
}
function ground(c,geo,p){for(const q of geo.platforms||[]){const x=q.x,y=q.y,w=q.width??q.w??0,h=q.height??q.h??24;c.fillStyle='#091e2b';c.fillRect(x,y,w,h);shape(c,[[x,y+5],[x+w,y+5],[x+w-8,y+h],[x+8,y+h]],'#33505b');shape(c,[[x,y],[x+w,y],[x+w-3,y+6],[x+3,y+6]],p.light);line(c,[[x+5,y+7],[x+w-5,y+7]],p.deep,1);for(let j=24;j<w-5;j+=43)line(c,[[x+j,y+7],[x+j-4,y+h]],'#193743',1);for(const px of [x+18,x+w-26])shape(c,[[px,y+h],[px+8,y+h],[px+21,450],[px-7,450]],'#173440')}}
function hazard(c,q,h,p){const w=q.width??h.width??18,H=q.height??h.clearance??18,type=q.type||h.type;c.save();c.translate(q.x,q.y);c.rotate(q.angle||0);
 if(type==='gap'){c.fillStyle='#061520';c.fillRect(-w/2,-1,w,27);line(c,[[-w/2,-1],[-w/2,12]],p.danger,2);line(c,[[w/2,-1],[w/2,12]],p.danger,2)}
 else if(type==='beam'||type==='ceiling'){const top=(q.floorCeiling!=null?q.floorCeiling-q.y-37:-(37+(q.ceiling??h.ceiling??10)))-13;c.fillStyle=p.danger;c.fillRect(-w/2,top,w,13);shape(c,[[-w/2,top],[w/2,top],[w/2-3,top+4],[-w/2+3,top+4]],p.light);for(const x of [-w/2+3,w/2-3])line(c,[[x,top-1],[x,top-18]],'#42606a',1);line(c,[[-w/2+3,top+10],[w/2-3,top+10]],'#72384e',2)}
 else if(type==='silence'){oval(c,0,-4,w/2,4,'#1e5660',p.accent,1);line(c,[[-w/2,-2],[w/2,-2]],p.accent,2)}
 else {shape(c,[[-w/2,0],[-w/2,-H+3],[-w/2+3,-H],[w/2-3,-H],[w/2,-H+3],[w/2,0]],p.danger,p.light,1.3);shape(c,[[-w/2+3,-H+4],[0,-H+2],[w/2-3,-H+4],[0,-3]],'#9d4965');line(c,[[-w/2+3,-4],[w/2-3,-H+4]],p.light,1)}c.restore();}
// Presentation impulses use only the simulation clock; neither collision nor input is changed.
function feedback(g,opt={}){const age=Number(opt.feedback?.age),accepted=Number.isFinite(age)&&age>=0&&age<.24?1-age/.24:0,hit=Math.max(0,Math.min(1,(g.hitFlash||0)/.25)),bossHit=Math.max(0,Math.min(1,(g.boss?.flash||0)/.28));return {accepted,hit,bossHit}}
function echo(c,e,p){if(!e||!['offer','committed','collected'].includes(e.state))return;const x=92,y=239,open=e.windowOpen||e.state==='collected',color=open?p.accent:p.light;shape(c,[[x,y-10],[x+9,y],[x,y+10],[x-9,y]],'#163543',color,2);if(e.state==='committed')line(c,[[x-15,y+13],[x,y+20],[x+15,y+13]],color,2);else if(e.state==='collected')line(c,[[x-5,y],[x-1,y+4],[x+6,y-4]],p.light,2)}
function player(c,q,p,v,reduced,fx={}){const x=q.x,y=q.y-Math.max(0,q.height||0),phase=reduced?0:q.phase||0,swing=Math.sin(phase)*4,accent=v.skinColor||p.accent;oval(c,x,q.y+1,11,2,'#061b27');c.save();c.translate(x,y);c.rotate(q.angle||0);const hit=fx.hit||0,accepted=fx.accepted||0;if(!reduced){if(accepted>0){c.save();c.globalAlpha=accepted*.22;shape(c,[[-17,-36],[-5,-36],[-4,-10],[-16,-10]],accent);c.restore()}c.translate(-hit*4+accepted*2,0);c.scale(1+hit*.09-accepted*.07,1-hit*.07+accepted*.04)}if(hit||accepted){const cue=hit?p.danger:p.accent;line(c,[[-11,-36],[-11,-10],[-5,-7]],cue,3);line(c,[[9,-36],[9,-10],[4,-7]],cue,3)}line(c,[[-4,-10],[-5+swing,0]],'#081f2b',5);line(c,[[3,-10],[5-swing,0]],'#081f2b',5);line(c,[[-4,-10],[-5+swing,-1]],p.light,2);line(c,[[3,-10],[5-swing,-1]],p.light,2);shape(c,[[-6,-25],[5,-25],[7,-11],[1,-8],[-7,-11]],p.light,'#081f2b',2);shape(c,[[-6,-25],[-11,-18],[-7,-12],[-3,-19]],accent,'#081f2b',1);line(c,[[4,-21],[9,-17],[12,-19]],p.light,3);oval(c,0,-30,7,7,p.light,'#081f2b',2);oval(c,2,-30,3.5,4,'#193541');oval(c,3,-31,1,1,p.accent);shape(c,[[-6,-25],[4,-25],[4,-22],[-5,-22],[-13-(reduced?0:Math.sin(phase*.4)*2),-26],[-10,-29]],accent,'#081f2b',.8);c.restore()}
function boss(c,b,v,p,t,reduced,fx={}){if(!b||v.boss?.completed)return;const mechanic=v.boss?.mechanic||'chain',a=v.boss?.nextAction,open=a?!!(a.windowOpen&&a.expected!==false&&a.actionable!==false&&!a.pending):b.vulnerable;c.save();c.translate(b.x,b.y+(reduced?0:Math.sin(t*.9)*2));const response=Math.max(fx.accepted||0,fx.bossHit||0);if(!reduced){c.translate(response*7,-response*2);c.rotate(response*(mechanic==='gear'?.1:mechanic==='memory'?-.055:.025))}if(response)line(c,[[-39,-35],[-43,-35],[-43,34],[-38,34]],p.accent,3);const light=response?p.accent:open?p.accent:p.light,dark='#0b2130';
 if(mechanic==='weave'){line(c,[[0,39],[0,-1],[-27,-20]],p.deep,9);line(c,[[0,-1],[29,-19]],p.deep,9);line(c,[[0,0],[0,-38]],p.deep,9);shape(c,[[0,-50],[-12,-35],[0,-20],[12,-35]],'#4d7886',light,1.5);for(let j=0;j<5;j++){const a=j*Math.PI*2/5;oval(c,-28+Math.cos(a)*10,-17+Math.sin(a)*10,6,8,'#867294',light,.8)}oval(c,-28,-17,5,5,p.accent);shape(c,[[18,-30],[29,-26],[41,-31],[41,-9],[29,-5],[18,-10]],'#5d7489',light,1.5);line(c,[[29,-26],[29,-5]],p.accent,1);oval(c,0,13,7,10,dark,light,1.5)}
 else if(mechanic==='mirror'){shape(c,[[0,-42],[30,-12],[19,30],[0,43],[-19,30],[-30,-12]],dark,p.deep,4);shape(c,[[0,-33],[20,-10],[12,24],[0,32],[-12,24],[-20,-10]],'#457e8c',light,2);shape(c,[[-9,-21],[3,-12],[-1,22],[-14,8]],p.light);line(c,[[8,-20],[13,-11],[6,17]],p.accent,2);shape(c,[[-24,-5],[-46,9],[-27,17]],p.deep);shape(c,[[24,-5],[43,10],[26,19]],p.deep)}
 else if(mechanic==='apex'){line(c,[[0,43],[-7,19],[0,-1]],p.deep,7);for(let i=0;i<7;i++){c.save();c.rotate(i*Math.PI*2/7+(reduced?0:Math.sin(t*.3)*.08));oval(c,0,-24,11,22,i%2?p.deep:'#85658d',light,1);c.restore()}oval(c,0,0,13,13,dark,light,2);oval(c,0,0,5,5,open?p.accent:p.danger)}
 else if(mechanic==='silence'){for(const side of [-1,1])shape(c,[[0,-22],[side*34,-44],[side*48,-7],[side*22,30],[side*4,14]],side<0?'#365b70':'#496878',p.deep,2);shape(c,[[0,-28],[12,-10],[10,24],[0,37],[-10,24],[-12,-10]],dark,light,2);oval(c,0,0,5,12,open?p.accent:p.deep);line(c,[[-6,-28],[-13,-39]],p.accent,1);line(c,[[6,-28],[13,-39]],p.accent,1)}
 else if(mechanic==='twins'){for(const side of [-1,1]){c.save();c.translate(side*20,side*5);shape(c,[[-13,18],[-10,-10],[0,-23],[10,-10],[13,18]],side<0?p.deep:'#82618a',light,2);oval(c,0,19,14,4,dark,light,1);oval(c,0,-2,3,6,p.accent);c.restore()}line(c,[[-20,-19],[0,-37],[20,-14]],p.accent,2)}
 else if(mechanic==='gear'){const pts=[];for(let i=0;i<32;i++){const a=i*Math.PI/16,r=i%4<2?35:28;pts.push([Math.cos(a)*r,Math.sin(a)*r])}shape(c,pts,p.deep,light,2);oval(c,0,0,22,22,dark,light,2);for(let i=0;i<5;i++){const a=i*Math.PI*2/5+(reduced?0:t*.25);line(c,[[Math.cos(a)*9,Math.sin(a)*9],[Math.cos(a)*19,Math.sin(a)*19]],p.accent,3)}oval(c,0,0,6,6,light)}
 else if(mechanic==='memory'){shape(c,[[-35,-24],[-3,-16],[0,31],[-35,18]],'#456273',light,2);shape(c,[[35,-24],[3,-16],[0,31],[35,18]],'#294b62',light,2);for(let i=0;i<4;i++)line(c,[[-29,-15+i*8],[-7,-10+i*8]],p.deep,2);for(let i=0;i<3;i++)oval(c,15,-8+i*11,3,3,open?p.accent:p.deep);shape(c,[[-2,-17],[2,-17],[7,37],[0,31],[-6,37]],p.accent)}
 else if(mechanic==='pulse'){shape(c,[[0,-43],[15,-12],[34,-1],[13,8],[5,42],[-6,17],[-31,2],[-9,-5]],p.deep,light,2);shape(c,[[2,-37],[8,-9],[27,0],[3,8],[-4,-6]],'#8aa7aa');oval(c,6,-16,3,3,p.accent);shape(c,[[12,-12],[30,-7],[13,-2]],p.danger)}
 else if(mechanic==='budget'){oval(c,0,0,32,35,p.deep,light,2);oval(c,12,-8,27,29,dark);line(c,[[-23,-23],[-7,29]],p.accent,2);shape(c,[[-7,10],[14,25],[-10,30]],p.light);oval(c,0,12,4,4,open?p.accent:p.danger)}
 else{shape(c,[[-34,10],[-22,-22],[-9,-28],[9,-28],[24,-18],[35,12],[24,31],[-24,31]],p.deep,light,2);shape(c,[[-16,-24],[-28,-40],[-22,-42],[-5,-27]],p.accent);shape(c,[[16,-24],[28,-40],[22,-42],[5,-27]],p.accent);shape(c,[[-21,-7],[21,-7],[15,15],[-15,15]],dark);for(const x of [-10,10])oval(c,x,0,3,6,light);line(c,[[-19,23],[19,23]],p.accent,3)}
 if(open){oval(c,0,0,43,45,null,p.accent,1.5);for(const side of [-1,1])line(c,[[side*47,-5],[side*41,0],[side*47,5]],p.light,2)}c.restore();}
function object(c,q,p,b){if(q.visible===false)return;const w=q.width??q.w??12,h=q.height??q.h??12,open=q.state?q.state==='open':q.active,anticipate=q.state==='anticipate',color=open?p.accent:anticipate?p.light:p.deep,type=q.type;c.save();c.translate(q.x,q.y);
 if(type==='pulse'){shape(c,[[-w/2,0],[-w/2,-h],[0,-h-5],[w/2,-h],[w/2,0]],p.danger,p.light,1.5);line(c,[[-w/2-5,-4],[-w/2-5,-h]],color,1)}
 else if(type==='flower'){for(let i=0;i<5;i++){c.save();c.rotate(i*Math.PI*2/5);oval(c,0,-h*.45,w*.14,h*.55,p.deep,color,1.5);c.restore()}oval(c,0,0,5,5,color)}
 else if(type==='anchor'||type==='dive'){shape(c,[[0,-h/2],[-w/2,0],[-w*.22,h*.2],[0,h/2],[w*.22,h*.2],[w/2,0]],p.danger,color,2);line(c,[[0,h/2+4],[-5,h/2+10],[5,h/2+10],[0,h/2+4]],color,1.5)}
 else if(type==='quiet'){oval(c,0,0,w/2,h/2,null,color,1.5);line(c,[[-w*.35,0],[w*.35,0]],color,1.5);oval(c,0,0,5,5,open?p.accent:p.deep)}
 else if(type==='memory'){if(b?.preview){const words=String(b.preview).split(/\s*[→·,]\s*/);words.slice(0,5).forEach((word,i)=>{const x=(i-(Math.min(5,words.length)-1)/2)*29;oval(c,x,0,12,14,'#183543',color,1);c.fillStyle=p.light;c.font='650 9px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText([...word].slice(0,2).join(''),x,0)})}else line(c,[[-18,0],[18,0]],p.deep,2)}
 else if(type==='mirror'){shape(c,[[0,-h/2],[-w/2,0],[0,h/2],[w/2,0]],'#245064',color,2);line(c,[[-w*.22,-h*.1],[w*.1,h*.23]],p.light,2)}
 else if(type==='beat'){oval(c,0,0,w/2,h/2,'#153442',color,2);line(c,[[0,-h*.25],[0,0],[w*.2,0]],color,2)}
 else if(type==='slot'){oval(c,0,0,w/2,h/2,null,color,3);line(c,[[-w*.22,0],[w*.22,0]],color,2)}
 else oval(c,0,0,w/2,h/2,p.danger,color,1);
 if(anticipate)oval(c,0,0,Math.max(12,w*.65),Math.max(12,h*.65),null,p.light,.8);c.restore();}
function draw(c,g,opt={},geo=g.geometry()){const v=geo.r34||g.r34Status(),chapter=Math.max(0,(v.chapter||1)-1),p=palettes[Math.min(2,Math.floor(chapter/4))],reduced=!!opt.reduced,cam=camera(opt.viewport,{gameplay:true}),t=Number(g.time)||0,fx=feedback(g,opt);c.save();c.clearRect(0,0,cam.width,cam.height);c.translate(cam.offsetX,cam.offsetY);c.scale(cam.scale,cam.scale);room(c,cam,p,{time:t,reduced,dreamIntensity:opt.dreamIntensity,chapter});ground(c,geo,p);for(const h of g.hazards||[]){const q=g.hazardPose(h);if(!h.done&&q&&q.visible!==false)hazard(c,q,h,p)}boss(c,geo.boss,v,p,t,reduced,fx);echo(c,v.echo,p);for(const q of geo.telegraph?.objects||v.boss?.objects||[])object(c,q,p,v.boss);for(const q of geo.projectiles||[]){oval(c,q.x,q.y,(q.width??8)/2,(q.height??8)/2,q.owner==='player'?p.accent:p.danger,p.light,1.2);line(c,[[q.x-(q.vx>0?1:-1)*12,q.y],[q.x-(q.vx>0?1:-1)*5,q.y]],q.owner==='player'?p.accent:p.danger,2)}for(const q of g.actorPoses?.(reduced)||[]){const a=v.boss?.nextAction||v.nextHazard;if(a?.windowOpen&&a.expected!==false&&a.actionable!==false&&!a.pending)oval(c,q.x,q.y-(q.height||0)-18,24,26,null,a.expected===null?p.light:p.accent,1.5);else if(a?.anticipation){const radius=24+Math.max(0,Math.min(1,(a.opensIn||0)/.9))*11;oval(c,q.x,q.y-(q.height||0)-18,radius,radius+2,null,p.light,.8)}player(c,q,p,v,reduced,fx)}/* Literal hazards stay in front of transient actor feedback. */for(const h of g.hazards||[]){const q=g.hazardPose(h);if(!h.done&&q&&q.visible!==false)hazard(c,q,h,p)}c.restore();c.save();for(let i=0;i<(v.heartLimit||3);i++)oval(c,21+i*13,25,3,4,i<(v.hearts??g.hearts??3)?p.light:'#38505b');c.fillStyle=p.accent;c.font='650 10px sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillText(String(v.chapter).padStart(2,'0'),66,25);c.restore();return geo.kind}
// Shared with the native DOM title: controls follow the actual title platform.
function titleLayout(viewport={}){const cam=camera(viewport),wide=cam.height<=480,primaryHeight=wide?46:cam.height<680?44:52,actionsHeight=primaryHeight*2+56,actionsTop=wide?(cam.height-actionsHeight)/2:Math.min(cam.offsetY+374*cam.scale+12,cam.height-actionsHeight-12),floorY=wide?350:Math.min(350,(actionsTop-12-cam.offsetY)/cam.scale-24);return {wide,primaryHeight,actionsHeight,actionsTop,headingTop:cam.height*(wide?.28:.15),floorY,hero:{left:cam.offsetX+132*cam.scale,right:cam.offsetX+158*cam.scale,top:cam.offsetY+(floorY-37)*cam.scale,bottom:cam.offsetY+floorY*cam.scale},supportBottom:cam.offsetY+(floorY+24)*cam.scale}}
function title(c,opt={}){const cam=camera(opt.viewport),p=palettes[0],layout=titleLayout(opt.viewport);c.save();c.translate(cam.offsetX,cam.offsetY);c.scale(cam.scale,cam.scale);room(c,cam,p,{time:opt.time||0,reduced:!!opt.reduced,dreamIntensity:opt.dreamIntensity});ground(c,{platforms:[{x:30,y:layout.floorY,width:300,height:24}]},p);player(c,{x:145,y:layout.floorY,height:0,phase:0},p,{},true);c.restore()}
root.MongyuImmersiveArt={camera,room,ground,hazard,player,boss,object,feedback,echo,draw,title,titleLayout,palettes};if(typeof module!=='undefined')module.exports=root.MongyuImmersiveArt;
})(globalThis);
