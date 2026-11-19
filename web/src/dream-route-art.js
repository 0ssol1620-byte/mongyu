/* Canvas scenery for the memory route. Every destination stays a DOM button. */
(function(root){'use strict';
const portrait=[[.04,.94],[.34,.91],[.68,.83],[.94,.68],[.70,.56],[.37,.57],[.06,.48],[.20,.27],[.58,.21],[.87,.04]];
const landscape=[[.04,.93],[.30,.91],[.57,.95],[.86,.89],[.97,.50],[.71,.49],[.44,.47],[.13,.49],[.23,.05],[.61,.04]];
const hues=[['#ecd293','#9ec7cd'],['#ebabc8','#b1a9eb'],['#a6e5d5','#76b3de'],['#f3b992','#d596b2'],['#d3c4f6','#a5b5e4'],['#b4d7ed','#8fcad2'],['#ecc6e9','#c3a7e1'],['#eedda1','#87c5c8'],['#d0b3f6','#a4cbe7'],['#facb97','#e4a9b0']];
const directions={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
function positions(w,h){
 const layout=w/h>1.16?landscape:portrait;
 return layout.map(([x,y])=>({x:28+(w-56)*x,y:28+(h-56)*y}));
}
function connect(c,points,index){
 const a=points[index],b=points[index+1],from=points[index-1]||a,to=points[index+2]||b;
 c.beginPath();c.moveTo(a.x,a.y);
 c.bezierCurveTo(a.x+(b.x-from.x)/7,a.y+(b.y-from.y)/7,b.x-(to.x-a.x)/7,b.y-(to.y-a.y)/7,b.x,b.y);
}
function ridge(c,x,y,s,row,ink){
 c.save();c.translate(x,y);c.scale(s,s);
 c.fillStyle=row%2?'#291f41':'#292346';
 c.beginPath();c.moveTo(-37,-5);c.lineTo(-10,-18);c.lineTo(20,-16);c.lineTo(39,-5);
 c.lineTo(19,6);c.lineTo(-14,10);c.closePath();c.fill();
 c.fillStyle='#180f29';c.beginPath();c.moveTo(-37,-5);c.lineTo(-14,10);c.lineTo(19,6);c.lineTo(39,-5);
 c.lineTo(20,15);c.lineTo(-4,27);c.lineTo(-23,13);c.closePath();c.fill();
 c.strokeStyle=ink;c.lineWidth=1;c.beginPath();c.moveTo(-37,-5);c.lineTo(-10,-18);c.lineTo(20,-16);c.lineTo(39,-5);c.stroke();
 c.restore();
}
function scenery(c,w,h,page,tint){
 // Long topographic shadows read as a place, even in the spaces between levels.
 const middle=w*.47;
 for(let i=0;i<6;i++){
  const y=h*(.19+i*.135);
  c.beginPath();c.moveTo(-30,y+6);
  c.bezierCurveTo(w*.17,y+29,middle,y-33,w*.72,y-17);
  c.quadraticCurveTo(w*.90,y-28,w+22,y-2);
  c.lineWidth=1;c.strokeStyle=tint+'21';c.stroke();
 }
 const scale=Math.max(.46,Math.min(1.05,w/410));
 ridge(c,w*.16,h*.21,scale,page,tint+'76');
 ridge(c,w*.85,h*.39,scale*.77,page+1,tint+'7d');
 ridge(c,w*.37,h*.72,scale*.71,page+2,tint+'65');
 // A broken lens hangs over the route. Its offset rims give the map depth.
 const wide=w/h>1.16;
 c.save();c.translate(w*(wide?.79:.42),h*(wide?.17:.39));
 c.rotate(-.27);c.scale(scale,scale*.72);
 const radius=wide?28:58;
 for(const [offset,width,color] of [[8,7,'#100c23'],[2,3,tint+'78'],[-4,1,tint+'72']]){
  c.beginPath();c.arc(0,offset,radius,-2.96,1.65);c.lineWidth=width;
  c.strokeStyle=color;c.stroke();
 }
 c.beginPath();c.arc(0,-4,radius,-1.86,-.81);c.strokeStyle=tint+'a8';c.stroke();
 c.beginPath();c.arc(-radius*.14,7,radius*.45,.18,3.6);c.lineWidth=1;c.strokeStyle=tint+'48';c.stroke();
 c.restore();
 for(let i=0;i<18;i++){
  const x=w*((i*127+23+17*page)%211)/211,y=h*((i*113+27)%223)/223;
  c.fillStyle=tint+(i%3===0?'66':'37');c.fillRect(x,y,i%3===0?2:1,i%3===0?2:1);
 }
}
function mount(grid,buttons,rootDocument){
 const canvas=rootDocument.createElement('canvas');canvas.className='dream-route-art';canvas.setAttribute('aria-hidden','true');grid.prepend(canvas);
 const c=canvas.getContext('2d');
 let state=null,lastKey='',points=[];
 function redraw(){
  if(!state||!c)return;
  const width=grid.clientWidth,height=grid.clientHeight;
  if(width<=56||height<=56)return;
  const dpr=Math.min(1.5,root.devicePixelRatio||1),{page,entries,selected,frontier}=state;
  const key=[width,height,dpr,page,entries.map(e=>e.unlocked?'1':'0').join(''),selected,frontier].join(':');
  if(lastKey===key)return;
  lastKey=key;
  points=positions(width,height);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  c.setTransform(dpr,0,0,dpr,0,0);
  const [gold,sky]=hues[page];
  grid.style.setProperty('--route-gold',gold);grid.style.setProperty('--route-sky',sky);
  scenery(c,width,height,page,sky);
  c.lineCap='round';c.lineJoin='round';
  for(let i=0;i<points.length-1;i++){
   const clear=entries[i].unlocked&&entries[i+1].unlocked;
   const approaching=entries[i].id===frontier;
   c.save();c.translate(0,3.5);connect(c,points,i);c.lineWidth=19;c.strokeStyle='#110b22';c.stroke();c.restore();
   connect(c,points,i);c.lineWidth=15;c.strokeStyle=clear?'#4b3546':approaching?'#3c3047':'#28213d';c.stroke();
   connect(c,points,i);c.lineWidth=1.25;c.strokeStyle=clear?gold:approaching?gold+'9a':sky+'50';c.stroke();
   if(clear||approaching){
    connect(c,points,i);c.lineDashOffset=0;c.setLineDash([2,8]);c.lineWidth=5;c.strokeStyle=gold+(clear?'83':'47');c.stroke();c.setLineDash([]);
   }
  }
  entries.forEach((entry,i)=>{
   const p=points[i],b=buttons[entry.number-1];
   b.style.left=p.x+'px';b.style.top=p.y+'px';
   if(entry.id!==selected&&entry.id!==frontier)return;
   c.beginPath();c.arc(p.x,p.y,29,0,Math.PI*2);c.lineWidth=1.2;c.strokeStyle=(entry.id===frontier?gold:sky)+'aa';c.stroke();
  });
 }
 if(root.ResizeObserver)new root.ResizeObserver(redraw).observe(grid);
 function target(number,code){
  const vector=directions[code],index=(number-1)%10,from=points[index];
  if(!vector||!from)return number;
  let best=Infinity,destination=index;
  points.forEach(({x,y},candidate)=>{
   const dx=x-from.x,dy=y-from.y,forward=dx*vector[0]+dy*vector[1];
   if(forward<=6)return;
   const lateral=Math.abs(dx*vector[1]-dy*vector[0]);
   const score=forward+lateral*1.9;
   if(score<best){best=score;destination=candidate;}
  });
  return number-index+destination;
 }
 return {update(value){state=value;redraw()},target};
}
root.MongyuDreamRouteArt={mount};
})(globalThis);
