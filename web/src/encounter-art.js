/* Draw exactly the collision cells; no replacement silhouette or fake lanes. */
(function(root){'use strict';
const palettes={chain:['#f7e8f1','#f1badc','#fff7fd','#e7aed2'],radial:['#fff06e','#f4d73b','#fff5a3','#e6c622'],wave:['#f5d8e9','#eab6d1','#fff2f8','#dba0c3'],robot:['#eeeeef','#c4c4c7','#ffffff','#d6d6d9'],orbit:['#3eb7b2','#83d8ba','#e7e92c','#54c4b5'],heart:['#080710','#1c102c','#100a1b','#241038']};
palettes.alien=['#100c29','#281048','#17123b','#341252'];
palettes.sun=['#aa4fef','#bd63f4','#a449e6','#cd75fa'];
function camera(viewport,bounds){const width=Math.max(1,viewport?.width||390),height=Math.max(1,viewport?.height||844),scale=Math.max(.05,Math.min((width-24)/bounds.width,(height-24)/bounds.height));return{width,height,scale,offsetX:width/2,offsetY:height/2,left:-width/2/scale,right:width/2/scale,top:-height/2/scale,bottom:height/2/scale};}
function draw(c,geo,opt,helpers){
 const e=geo.encounter,b=geo.bounds,cam=camera(opt.viewport,b),reduced=!!opt.reduced,after=opt.aftermath,et=after?.elapsed||0,palette=palettes[e.kind],dx=b.left,dy=b.top;
 const rect=(r,color,outline=false)=>{c.fillStyle=color;c.fillRect(r.x+dx,r.y+dy,r.w,r.h);if(outline){c.strokeStyle='#245c87';c.lineWidth=1.2;c.strokeRect(r.x+dx+.6,r.y+dy+.6,r.w-1.2,r.h-1.2);}};
 c.save();c.clearRect(0,0,cam.width,cam.height);c.fillStyle=palette[0];c.fillRect(0,0,cam.width,cam.height);c.translate(cam.offsetX,cam.offsetY);c.scale(cam.scale,cam.scale);
 const phase=reduced?0:Math.floor(e.time*.4);
 for(let y=0,j=0;y<e.height;y+=82,j++)for(let x=0,i=0;x<e.width;x+=82,i++)rect({x,y,w:Math.min(82,e.width-x),h:Math.min(82,e.height-y)},palette[(i*17+j*31+i*j*3+phase)%palette.length]);
 if(['alien','sun'].includes(e.kind)){
  const r=e.body.arena,colors=e.kind==='sun'?['#111118','#ffffff']:['#35d9e8','#7bdd45','#f5e14a','#f49640','#e64caa'];
  for(let x=r.left,i=0;x<r.right;x+=24,i++){const w=Math.min(20,r.right-x);rect({x,y:r.top-10,w,h:10},colors[i%colors.length]);rect({x,y:r.bottom,w,h:10},colors[(i+2)%colors.length]);}
  for(let y=r.top,i=0;y<r.bottom;y+=24,i++){const h=Math.min(20,r.bottom-y);rect({x:r.left-10,y,w:10,h},colors[(i+1)%colors.length]);rect({x:r.right,y,w:10,h},colors[(i+3)%colors.length]);}
 }
 if(!['wave','orbit','heart','alien','sun'].includes(e.kind)){
  const colors=e.kind==='radial'?['#14151c','#2d5ea7']:e.kind==='chain'?['#743d89','#eb61b7']:['#4f9cdf','#f1d421','#eb782b'];
  for(let x=0,i=0;x<e.width;x+=24,i++){rect({x,y:0,w:20,h:10},colors[i%colors.length]);rect({x,y:e.height-10,w:20,h:10},colors[(i+1)%colors.length]);}
  for(let y=12,i=0;y<e.height-10;y+=24,i++){rect({x:0,y,w:10,h:20},colors[i%colors.length]);rect({x:e.width-10,y,w:10,h:20},colors[(i+1)%colors.length]);}
 }
 const bodyColor=e.kind==='sun'?'#111118':e.kind==='alien'?'#27d6e5':e.kind==='chain'?'#a83dab':e.kind==='radial'?'#2361aa':e.kind==='robot'?'#4c9bd9':e.kind==='heart'?'#4fce69':e.kind==='orbit'?'#10151b':'#265ca8',hurt=e.body.hurt||e.kind==='radial'&&e.time<e.hurtUntil;
 const reactionColor={sun:'#ffffff',alien:'#ffffff',chain:'#713c9c',radial:'#e6982a',wave:bodyColor,robot:'#e6c924',orbit:'#2361aa',heart:'#f0de46'}[e.kind];
 const release=e.kind==='sun'?(after?.release??2):2.4;
 if(!after||et<release){
  c.globalAlpha=after?Math.max(0,1-Math.max(0,et-.8)/Math.max(.001,release-.8)):1;
  for(const q of e.body.links||[])rect(q,bodyColor);
  e.body.cells.forEach((q,i)=>{const spread=after&&!reduced&&!['heart','alien','sun'].includes(e.kind)?Math.max(0,et-.8)*85:0,jitter=after&&!reduced&&e.kind!=='sun'&&et<.8?Math.sin(et*22+i)*2:0;rect({...q,x:q.x+Math.sin(i*2.71)*spread+jitter,y:q.y+Math.cos(i*1.63)*spread-jitter},after||hurt?reactionColor:bodyColor,e.kind==='robot');});c.globalAlpha=1;
 }
 const a=e.actor;
 if(!after)for(const o of e.orbs||[]){c.globalAlpha=o.deflected?.18:1;for(const q of o.cells)rect(q,o.color);c.globalAlpha=1;}
 if(!after){for(const p of e.projectiles||[]){const color=['alien','sun'].includes(e.kind)?p.color:p.color==='black'?'#10151b':'#205eac';if(!reduced)for(const [i,t]of p.trail.entries()){c.globalAlpha=.22*(i+1)/p.trail.length;rect({x:t.x-3,y:t.y-3,w:6,h:6},color);}c.globalAlpha=1;for(const q of p.cells)rect(q,color);}}
 if(!after&&a.counterBox&&a.active){const r=a.counterBox,l=8;c.strokeStyle='#d12e8e';c.lineWidth=2;for(const [x,y,sx,sy]of [[r.x,r.y,1,1],[r.x+r.w,r.y,-1,1],[r.x,r.y+r.h,1,-1],[r.x+r.w,r.y+r.h,-1,-1]]){c.beginPath();c.moveTo(x+dx+sx*l,y+dy);c.lineTo(x+dx,y+dy);c.lineTo(x+dx,y+dy+sy*l);c.stroke();}}
 const actorDisplayScale=after?Math.max(1,24/(a.box.h*cam.scale)):1,ax=a.box.x+a.box.w/2+dx,ay=a.box.y+a.box.h/2+dy;c.save();c.translate(ax,ay);c.scale(actorDisplayScale,actorDisplayScale);c.translate(-ax,-ay);
 const alienColor=!after&&a.counter?'#ffe846':'#3ed7ed',sunColor=!after&&a.counter?'#ffe846':'#111118';
 for(const q of a.dogCells||[])rect(q,e.kind==='alien'?(a.invulnerable?'#74747f':alienColor):'#14151c');
 for(const q of a.cells)rect(q,a.invulnerable?'#74747f':e.kind==='alien'?alienColor:e.kind==='sun'?sunColor:e.kind==='heart'?'#f5f3f7':'#14151c');c.restore();
 if(!after&&e.cue.ready){c.fillStyle=['heart','alien'].includes(e.kind)?'#ffffff':'#14151c';c.font='900 22px system-ui';c.textAlign='center';c.fillText(e.kind==='chain'||e.kind==='wave'||['alien','sun'].includes(e.kind)&&!a.air||e.kind==='orbit'&&e.cue.color==='blue'?'뛰어!':'받아쳐!',Math.max(b.left+64,Math.min(b.right-64,a.box.x+a.box.w/2+dx)),Math.max(b.top+90,a.box.y+dy-20));}
 if(after?.phase==='line'){c.font='900 28px system-ui';c.textAlign='center';c.fillStyle=['heart','alien'].includes(e.kind)?'#f5f3f7':'#142443';c.fillText(after.text,0,Math.max(b.top+130,Math.min(b.bottom-100,a.box.y+dy-70)),e.width-64);}
 if(!after&&geo.expression)helpers.expression(c,{...geo,attacks:[...e.body.cells,...(e.orbs||[]).flatMap(o=>o.cells),...(e.projectiles||[]).flatMap(p=>p.cells)].map(q=>({x:q.x+q.w/2+dx,y:q.y+q.h/2+dy,width:q.w,height:q.h}))},{},reduced);
 const hudBounds=e.kind==='heart'?{...b,top:b.top-12,width:Math.min(b.width*.65,570)}:['alien','sun'].includes(e.kind)?{...b,top:b.top+10}:{...b,top:b.top+65};helpers.bossHealthBar(c,{...geo,bounds:hudBounds});c.restore();return{kind:'r64-observed-encounter',actorDisplayScale,camera:cam,layout:{kind:'single'},clock:e.time};
}
root.MongyuEncounterArt={draw,camera};if(typeof module!=='undefined')module.exports={draw,camera};
})(typeof globalThis!=='undefined'?globalThis:this);
