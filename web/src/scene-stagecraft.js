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
function draw(c,cam,profile,p,time=0,reduced=false){
 const w=cam.width,h=cam.height,unit=Math.min(w,h),t=reduced?0:time,phase=profile.field,offset=phase==='flow'?t*unit*.012:0;
 c.save();c.fillStyle=p[1];c.strokeStyle=p[1];c.lineWidth=Math.max(.65,unit/650);c.globalAlpha=.055;
 // Spacious, slow planes live behind the actual tiles. Never resemble solid ledges.
 for(let i=0;i<5;i++){
  const size=unit*(.34+i*.14),x=(((i*.618*unit+cam.offsetX*.055+offset)%(w+size))+(w+size))%(w+size)-size,y=(((i*.387*h+cam.offsetY*.055)%(h+size))+(h+size))%(h+size)-size;
  c.save();c.translate(x+size/2,y+size/2);if(phase==='orbit')c.rotate(i*.3+t*.012);else if(phase==='mirror')c.rotate(i%2?Math.PI/4:0);c.strokeRect(-size/2,-size/2,size,size);c.restore();
 }
 c.globalAlpha=.07;for(let i=0;i<22;i++){const size=1+(i%3)*.6,x=((i*.61803398875)%1)*w,y=((((i*.381966+.07)%1)*h+offset*(i%2?1:-1))%h+h)%h;c.fillRect(x,y,size,size)}
 c.restore();return {planes:5,motes:22,profile:profile.id};
}
const api={inkFor,backgroundAt,draw};root.MongyuStagecraft=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
