/* MONGYU R80. Presentation only: no simulation writes, random draws, or paid grants. */
(function(root){'use strict';
const TAU=Math.PI*2,KEY='mongyu.r80.style.v1';
const looks=Object.freeze([
 ['moon','달잠',0,'#f6edd9','#ed987c','scarf'],['ink','먹빛',0,'#849ca9','#edc888','scarf'],
 ['dew','이슬',1,'#bcf4df','#75cbbd','leaf'],['peach','복숭아',3,'#ffd2bd','#ed8c83','scarf'],
 ['lilac','라일락',6,'#d9c6fa','#a191e1','comet'],['tide','물결',10,'#a5dae8','#63acd1','leaf'],
 ['ember','잔불',15,'#f7be88','#ee755a','comet'],['moss','이끼',25,'#c5db97','#91ad6c','leaf'],
 ['dusk','저녁별',40,'#dfb9cf','#edcd88','star'],['frost','서리',60,'#d6e8f5','#92d4e6','comet'],
 ['eclipse','일식',80,'#ad9dba','#f5bc65','star'],['dawn','새벽',100,'#fff1c7','#ffd47d','star']
].map(([id,name,at,body,accent,detail])=>Object.freeze({id,name,at,body,accent,detail})));
let selected='moon',saved=true,progress=()=>0,lastWall=null,motion=0;
const cameras=new WeakMap();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function count(n){return Number.isSafeInteger(n)?clamp(n,0,100):0}
function available(id,n){const item=looks.find(x=>x.id===id);return !!item&&count(n)>=item.at}
function decode(raw){try{const v=JSON.parse(raw);return v?.schema===1&&looks.some(x=>x.id===v.selected)?v.selected:'moon'}catch(_){return 'moon'}}
function look(){return looks.find(x=>x.id===selected&&available(x.id,progress()))||looks[0]}
function clock(wall,state){const delta=lastWall===null?0:clamp(wall-lastWall,0,.05);lastWall=wall;if(state==='play'||state==='transition'||state==='title')motion+=delta;return motion}
function line(c,pts,color,width){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.stroke()}
function oval(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fillStyle=color;c.fill()}
function sprite(c,q,fx={},reduced=false,character='walker',style=look()){
 const t=reduced?0:fx.poseTime??fx.t??0,phase=t*11,air=!!q.climbing||(q.height||0)>1,sw=Math.sin(phase),jump=air?Math.sin(Math.PI*clamp(q.jumpProgress??.5,0,1)):0,kick=q.kick||0;
 c.save();c.translate(q.x,q.y);c.rotate(Math.atan2(q.tangent?.y||0,q.tangent?.x??1));const s=(q.bodyHeight||60)/45;c.scale(s,s);
 if(q.deathProgress)c.globalAlpha*=Math.max(.05,1-q.deathProgress);
 const bob=reduced||air?0:q.pose?Math.sin(t*2)*.35:Math.sin(phase*2)*.8,lean=q.pose?0:air?-1:2;
 c.translate(lean,bob);const hip=[0,-18],shoulder=[2,-30];
 const legs=q.pose?[[hip,[-4,-10],[-7,0]],[hip,[5,-10],[8,0]]]:q.climbing?[[hip,[-7,-11],[-2,-3]],[hip,[9,-23],[13,-13]]]:air?[[hip,[-9,-12-jump*4],[-13,-6-jump*4]],[hip,[10,-19],[15+kick*20,-10-kick*10]]]:[[hip,[-3+sw*7,-10],[-sw*11,-1]],[hip,[-3-sw*7,-10],[sw*11,Math.min(-1,-6*Math.cos(phase))]]];
 const arms=q.pose?[-1,1].map(side=>[shoulder,[side*(q.pose==='open-arms'?14:10),q.pose==='raise-arms'?-35:-26],[side*(q.pose==='open-arms'?21:13),q.pose==='raise-arms'?-46:q.pose==='open-arms'?-29:-20]]):q.climbing?[[shoulder,[-8,-34],[-6,-41]],[shoulder,[10,-35],[12,-44]]]:air?[[shoulder,[-8,-28],[-13,-33]],[shoulder,[11,-30],[14,-36]]]:[[shoulder,[-7,-26],[-8-sw*5,-29]],[shoulder,[10,-24],[13+sw*5,-28]]];
 for(const edge of [true,false]){const color=edge?'#121822':style.body;for(const p of [...legs,...arms])line(c,p,color,edge?7.6:4.2);line(c,[hip,[0,-25],shoulder],color,edge?11:7)}
 // A soft hood, small face, and a cloth tail remain legible on all four walls.
 oval(c,3,-37,8,8.5,'#121822');oval(c,3,-37,6.5,7,style.body);oval(c,6,-37,4.3,3.9,'#202b38');
 oval(c,7.5,-37.8,.85,1.1,'#fff1cb');
 const tail=reduced?0:Math.sin(t*8)*2.8;
 line(c,[[0,-31],[-8,-30],[-15,-33+tail],[-23,-31+tail*.6]],'#121822',6);
 line(c,[[0,-31],[-8,-30],[-15,-33+tail],[-23,-31+tail*.6]],style.accent,3.6);
 if(style.detail==='leaf'){c.save();c.translate(0,-44);c.rotate(-.4);oval(c,-3,-2,5,2.3,style.accent);c.restore()}
 if(style.detail==='star'){line(c,[[-1,-46],[-1,-52]],style.accent,1.5);oval(c,-1,-52,2,2,style.accent)}
 if(style.detail==='comet'){line(c,[[-2,-43],[-9,-46],[-16,-44+tail]],style.accent,2.4)}
 if(character==='woman'){line(c,[[-1,-40],[-8,-37],[-9,-30+tail*.2]],style.body,4)}
 c.restore();return true;
}
const themes=[['#121a2b','#43607a','#d6a582'],['#10252d','#306869','#8ddbc8'],['#231e38','#6d548a','#c2b0e5'],['#211e2e','#704e70','#ecadc2'],['#152924','#446844','#bed798'],['#302124','#87554b','#f2ba88'],['#152633','#38698b','#8bcee5'],['#211e36','#665c9a','#c2b4f2'],['#2d2224','#884d50','#f7a89d'],['#242237','#6a657b','#eed8a1']];
function atmosphere(c,x,y,w,h,t,stage=0,gain=1){const p=themes[stage%10];
 const g=c.createLinearGradient(x,y,x+w*.3,y+h);g.addColorStop(0,p[0]);g.addColorStop(.55,p[1]);g.addColorStop(1,p[0]);c.fillStyle=g;c.fillRect(x,y,w,h);
 c.save();c.globalAlpha=.08;c.strokeStyle=p[2];c.lineWidth=Math.max(1,w*.0015);
 for(let i=0;i<7;i++){c.beginPath();const yy=y+h*(.18+i*.105),d=Math.sin(t*.13+i)*h*.04*gain;c.moveTo(x-w*.1,yy);c.bezierCurveTo(x+w*.25,yy-h*.13+d,x+w*.55,yy+h*.12+d,x+w*1.1,yy-h*.06);c.stroke()}
 c.globalAlpha=.55;for(let i=0;i<39;i++){const px=x+((i*.61803398875)%1)*w,py=y+((i*.38196601125+.1)%1)*h,drift=Math.sin(t*.3+i)*3*gain;oval(c,px,py+drift,i%7===0?1.3:.65,i%7===0?1.3:.65,p[2])}c.restore();
}
function exterior(c,cam,b,fx){atmosphere(c,cam.left,cam.top,cam.right-cam.left,cam.bottom-cam.top,fx.poseTime??fx.t,fx.stage,fx.gain);return true}
function chamber(c,b,fx){const w=b.width||b.right-b.left,h=b.height||b.bottom-b.top,cx=(b.left+b.right)/2,cy=(b.top+b.bottom)/2,p=themes[fx.stage%10];c.save();
 c.fillStyle='#0b1321';c.globalAlpha=.38;c.fillRect(b.left,b.top,w,h);c.globalAlpha=.12;c.strokeStyle=p[2];c.lineWidth=1.1;
 const t=fx.poseTime??fx.t;for(let i=0;i<5;i++){c.beginPath();c.ellipse(cx,cy,Math.max(1,w*(.12+i*.095)),Math.max(1,h*(.08+i*.07)),Math.sin(t*.12)*.12*fx.gain+fx.stage*.12,0,TAU);c.stroke()}
 c.globalAlpha=.06;oval(c,cx+w*.13,cy-h*.08,w*.22,h*.22,p[2]);c.restore();return true}
function camera(viewport,geo,opt,run){
 if(!geo.nativeRuntime||geo.boss||Array.isArray(geo.nativeMaskCells)||Math.max(geo.bounds.width,geo.bounds.height)<600||!geo.player)return null;
 const width=Math.max(1,viewport.width),height=Math.max(1,viewport.height),scale=Math.min(width/420,height/(width>height?340:560)),q=geo.player;
 const tx=q.x+(q.tangent?.x??1)*55+(q.inward?.x||0)*105,ty=q.y+(q.tangent?.y||0)*55+(q.inward?.y??-1)*105,t=opt.presentationTime||0;
 let state=cameras.get(run);if(!state||run.time<state.sim){state={x:tx,y:ty,t,sim:run.time};cameras.set(run,state)}
 const dt=clamp(t-state.t,0,.05),a=opt.reduced?1:1-Math.exp(-dt/0.13);state.x+=(tx-state.x)*a;state.y+=(ty-state.y)*a;state.t=t;state.sim=run.time;
 const offsetX=width/2-state.x*scale,offsetY=height/2-state.y*scale;
 return {width,height,scale,offsetX,offsetY,left:-offsetX/scale,right:(width-offsetX)/scale,top:-offsetY/scale,bottom:(height-offsetY)/scale,follow:true};
}
function title(c,opt={}){const w=opt.viewport.width,h=opt.viewport.height,wide=w>h*1.15,t=opt.reduced?0:opt.time||0;
 c.save();atmosphere(c,0,0,w,h,t,0,opt.reduced?0:1);const x=wide?w*.65:w*.5,y=wide?h*.45:h*.47,r=Math.min(w*(wide?.21:.38),h*.245);
 // Four suspended corners, an eclipse, and a looping traveller: the game's motif.
 c.translate(x,y);const halo=c.createRadialGradient(0,0,r*.15,0,0,r*1.7);halo.addColorStop(0,'#d4b18d24');halo.addColorStop(1,'#d4b18d00');c.fillStyle=halo;c.fillRect(-r*1.7,-r*1.7,r*3.4,r*3.4);
 oval(c,0,0,r*.69,r*.69,'#dfbea0');oval(c,r*.12,-r*.08,r*.65,r*.65,'#202d43');
 c.save();c.rotate(-.23+Math.sin(t*.16)*.035);c.strokeStyle='#dccbb1';c.lineWidth=1.2;
 for(let i=0;i<4;i++){c.save();c.rotate(i*Math.PI/2);c.beginPath();c.moveTo(-r*.98,-r*.44);c.lineTo(-r*.98,-r*.98);c.lineTo(-r*.44,-r*.98);c.stroke();oval(c,-r*.98,-r*.98,2,2,'#e6bd98');c.restore()}c.restore();
 const a=t*.22+.8;c.save();c.rotate(-.2);c.strokeStyle='#ddc8ae50';c.lineWidth=1;c.beginPath();c.ellipse(0,0,r*1.22,r*.79,0,0,TAU);c.stroke();c.restore();
 for(let i=0;i<8;i++){const aa=a-i*.045;oval(c,Math.cos(aa)*r*1.22,Math.sin(aa)*r*.79,Math.max(.5,2-i*.2),Math.max(.5,2-i*.2),'#efd4ac'+Math.round(180-i*18).toString(16).padStart(2,'0'))}
 c.save();c.translate(-r*.06,r*.85);const scale=Math.min(1.2,r/105);c.scale(scale,scale);sprite(c,{x:0,y:0,tangent:{x:1,y:0},bodyHeight:64},{poseTime:t},!!opt.reduced);c.restore();
 c.restore();return {kind:'r80-title',width:w,height:h};
}
let immersiveAttempted=false;
function requestImmersive(event,doc=root.document){
 if(immersiveAttempted||event?.isTrusted!==true||doc?.fullscreenElement||!root.matchMedia?.('(pointer: coarse)').matches||typeof doc?.documentElement?.requestFullscreen!=='function')return false;
 immersiveAttempted=true;
 try{Promise.resolve(doc.documentElement.requestFullscreen({navigationUI:'hide'})).catch(()=>{});return true}catch(_){return false}
}
function hud(v){return Math.max(0,Math.floor(v.score||0))+'  '+('●'.repeat(Math.max(0,Math.min(5,v.hearts||0))))}
function hint(v,run){
 if(v.native?.awaitingBossConfirmation)return '탭하여 다음으로';
 if(v.cue?.text&&v.cue.phase==='confirm')return v.cue.text;
 if(v.feedback?.kind==='hit')return '';
 if((v.time||0)<6&&(run.inputCount||run.jumps||0)===0)return v.boss?'타이밍에 맞춰 탭':'탭하여 점프';
 return '';
}
function icon(item){return '<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="35" fill="'+item.accent+'18"/><path d="M38 47L29 65M40 47L51 64M39 33L24 45M42 33L54 44" stroke="'+item.body+'" stroke-width="5" stroke-linecap="round"/><path d="M40 32V48" stroke="'+item.body+'" stroke-width="9" stroke-linecap="round"/><circle cx="40" cy="22" r="10" fill="'+item.body+'"/><ellipse cx="44" cy="23" rx="6" ry="4.5" fill="#182335"/><path d="M38 33L25 32L15 27" stroke="'+item.accent+'" stroke-width="4" fill="none" stroke-linecap="round"/></svg>'}
function narrative(c,x,y,h,pose,t,reduced){return sprite(c,{x,y,bodyHeight:h,pose,tangent:{x:1,y:0}},{poseTime:t},reduced)}
function mount(host){const d=host.document,$=id=>d.getElementById(id);progress=host.progress;try{selected=decode(host.storage.getItem(KEY))}catch(_){saved=false}
 function render(){const n=count(progress()),equipped=look();$('wardrobeCount').textContent=n+' / 100개의 기억';$('wardrobeStatus').textContent=saved?'기억을 모으면 새로운 옷이 열려요.':'이번 실행에만 옷을 보관할 수 있어요.';
  for(const item of looks){const b=$('look-'+item.id),owned=available(item.id,n);b.disabled=!owned;b.setAttribute('aria-pressed',String(equipped.id===item.id));b.setAttribute('aria-label',item.name+(owned?equipped.id===item.id?' · 입는 중':' · 입기':' · 기억 '+item.at+'개 필요'));b.querySelector('small').textContent=owned?equipped.id===item.id?'입는 중':'입기':'기억 '+item.at+'개'}
 }
 for(const item of looks){const b=d.createElement('button');b.id='look-'+item.id;b.setAttribute('id',b.id);b.innerHTML=icon(item)+'<span>'+item.name+'</span><small></small>';b.onclick=()=>{if(!available(item.id,progress()))return;selected=item.id;try{const value=JSON.stringify({schema:1,selected});host.storage.setItem(KEY,value);saved=host.storage.getItem(KEY)===value}catch(_){saved=false}render();host.redraw()};$('wardrobeLooks').appendChild(b)}
 $('wardrobeClose').onclick=host.close;
 $('shopOpen').textContent='옷장';$('shopOpen').onclick=e=>{host.open(e);render();$('wardrobeClose').focus({preventScroll:true})};
 render();return {render,view:()=>({selected:look().id,saved,collected:count(progress())})};
}
const api={looks,available,decode,count,look,clock,sprite,narrative,title,exterior,chamber,camera,requestImmersive,hud,hint,mount,storageKey:KEY};root.MongyuMobile=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
