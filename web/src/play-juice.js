/* R104 game feel: collision impact, aurora finish, score popups. Owned by workstream F (phase 1: B). */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
/* Timeline (seconds after impact): flash 0-.06, shake 0-.32, hit-stop .12 (OpeningRun sim), shards .12-.6, dim/desaturate ramps to .12 and holds. */
const FLASH=.06,SHAKE=.32,SHAKE_PX=6,SHARD_DELAY=.12,SHARD_LIFE=.48,DIM_IN=.12,DIM_HOLD=.6,DIM_OUT=.4,BLOOM=.95,MAX=40;
const SHARD_INKS=['255,246,224','255,214,170','201,182,255','159,243,230'],AURORA_INKS=['121,246,222','150,206,255','190,150,255','255,160,222'];
const pool=Array.from({length:MAX},()=>({on:false,kind:0,age:0,life:0,x:0,y:0,vx:0,vy:0,sx:0,sy:0,qx:0,qy:0,tx:0,ty:0,size:0,spin:0,turn:0,ink:''}));
let host=null,run=null,impact=null,bloom=null,last=0,shaking=false,shakeTimer=0,seed=7,edge=null,popupPoints=0;
const POPUP_LIFE=1.05,popups=Array.from({length:6},()=>({on:false,at:0,x:0,y:0,text:'',sub:'',perfect:false}));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=u=>1-Math.pow(1-u,3);
function rand(){seed=seed*16807%2147483647;return (seed-1)/2147483646}
function clock(){return (root.performance?.now?.()??Date.now())/1000}
function settings(){try{return host?.settings?.()||{}}catch(_){return {}}}
function reduced(){return settings().reduced===true}
/* R105 ACC: effects strength (0..1), 1 outside the UI edition or without the profile. Presentation only. */
const fx=ch=>{try{const E=root.MongyuEffects;return E&&E.enabled?E.value(ch):1}catch(_){return 1}};
function sound(kind){try{host?.sound?.(kind)}catch(_){}}
function vibrate(ms){const r=host?.activeRun?.(),on=r?.settings?.vibration??settings().vibration;if(on!==false&&on!==0&&typeof root.navigator?.vibrate==='function'){const k=fx('haptics');if(k<=0)return;try{root.navigator.vibrate(Math.max(4,Math.round(ms*(.4+.6*k))))}catch(_){}}}
function viewport(){try{return host?.viewport?.()||{width:390,height:844}}catch(_){return {width:390,height:844}}}
const glows=new Map();
/* Soft round glow per ink, rendered once and blitted (cheaper and softer than per-particle gradients). */
function glow(ink){
 if(glows.has(ink))return glows.get(ink);let g=null;
 try{g=root.document.createElement('canvas');g.width=g.height=48;const x=g.getContext('2d'),r=x.createRadialGradient(24,24,0,24,24,24);
  r.addColorStop(0,'rgba(255,255,250,.95)');r.addColorStop(.18,'rgba('+ink+',.75)');r.addColorStop(.5,'rgba('+ink+',.22)');r.addColorStop(1,'rgba('+ink+',0)');x.fillStyle=r;x.fillRect(0,0,48,48)}catch(_){g=null}
 glows.set(ink,g);return g;
}
function spawn(){for(const p of pool)if(!p.on){p.on=true;return p}return null}
function clearAll(){impact=null;bloom=null;for(const p of pool)p.on=false;for(const p of popups)p.on=false;popupPoints=run?.points||0;resetShake()}
function resetShake(){if(shaking&&host?.canvas?.style){host.canvas.style.transform='';host.canvas.classList?.remove('juice-shake')}shaking=false}
function setShake(x,y){const c=host?.canvas;if(!c?.style)return;if(!shaking)c.classList?.add('juice-shake');shaking=true;c.style.transform='translate('+x.toFixed(2)+'px,'+y.toFixed(2)+'px) scale('+Number((1+.03*fx('zoom')).toFixed(4))+')'}
function impactPoint(r){
 const O=root.MongyuOpening,vp=viewport();
 if(r.openingCourse&&O?.project&&r.crash){const o=O.OBSTACLES[r.crash.index],p=o&&O.project(r,o.at,o.height*.6);if(p)return p}
 /* Dream-mode acts (helix, penrose, illusion, course) expose the runner's screen position as run.view.actor. */
 if(r.mode==='dream'&&r.view?.actor&&Number.isFinite(r.view.actor.x)&&Number.isFinite(r.view.actor.y))return {x:r.view.actor.x,y:r.view.actor.y};
 /* Native memories: the character's screen position from the square-art renderer (workstream E), when available. */
 if(!r.openingCourse){const A=root.MongyuSquareArt;let p=null;try{p=typeof A?.actorScreen==='function'?A.actorScreen(r):A?.actorScreen}catch(_){p=null}
  if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))return {x:p.x,y:p.y}}
 return {x:vp.width*.5,y:vp.height*.46};
}
function burst(x,y,count){
 for(let i=0;i<count;i++){const p=spawn();if(!p)return;const a=rand()*Math.PI*2,v=90+rand()*170;
  p.kind=0;p.age=-SHARD_DELAY-rand()*.05;p.life=SHARD_LIFE*(.75+rand()*.4);p.x=x;p.y=y;p.vx=Math.cos(a)*v;p.vy=Math.sin(a)*v-40;p.size=5+rand()*7;p.spin=a;p.turn=(rand()-.5)*9;p.ink=SHARD_INKS[i%SHARD_INKS.length]}
}
function homing(x,y,count,delay,inks){
 const vp=viewport(),tx=vp.width/2,ty=Math.min(78,vp.height*.09);
 for(let i=0;i<count;i++){const p=spawn();if(!p)return;const side=(i%2?1:-1)*(40+rand()*120);
  p.kind=1;p.age=-delay*i/Math.max(1,count-1)-rand()*.04;p.life=.55+rand()*.3;p.sx=x+(rand()-.5)*18;p.sy=y+(rand()-.5)*18;p.qx=(x+tx)/2+side;p.qy=Math.min(y,ty)-30-rand()*80;p.tx=tx+(rand()-.5)*20;p.ty=ty;p.x=p.sx;p.y=p.sy;p.size=3+rand()*3.5;p.spin=rand()*6;p.turn=4+rand()*4;p.ink=inks[i%inks.length]}
}
function onEvent({run:r,event}){
 if(!r||r!==host?.activeRun?.())return;
 if(r!==run){run=r;clearAll()}
 if(event==='hit'||event==='fail'&&!r.openingCourse&&(!impact||clock()-impact.at>.4)){
  const p=impactPoint(r);impact={at:clock(),x:p.x,y:p.y,dim:null,ended:false};burst(p.x,p.y,16);for(const q of popups)q.on=false;
  sound('impact-glass');sound('impact-chime-fall');vibrate(40);
  clearTimeout(shakeTimer);shakeTimer=setTimeout(resetShake,(SHAKE+.08)*1000);
 }else if(r.openingCourse&&(event==='pass'||event==='perfect')){
  const O=root.MongyuOpening,o=O.OBSTACLES[r.index-1],p=o&&O.project?.(r,o.at,o.height+26);
  if(p)homing(p.x,p.y,event==='perfect'?7:4,.12,SHARD_INKS);
  if(event==='perfect')sound('perfect-chime');
  popup(r,event==='perfect');
 }
}
/* Score popups rising from the character: "+50 완벽" on perfect timing (streak bonus), "+100" on a normal clear. */
function popup(r,perfect){
 const O=root.MongyuOpening,gain=Number.isFinite(r.points)?r.points-popupPoints:100;popupPoints=r.points||0;
 const body=r.view?.body||44,p=O?.project?.(r,r.distance,(r.height||0)+body+10);if(!p)return;
 let slot=popups.find(q=>!q.on)||popups.reduce((a,b)=>a.at<b.at?a:b);
 const bonus=50*Math.min(5,Math.max(1,r.perfectStreak||1)),streak=r.perfectStreak||0;
 slot.on=true;slot.at=clock();slot.x=p.x;slot.y=p.y;slot.perfect=perfect;
 slot.text=perfect?'+'+bonus+' 완벽':'+'+Math.max(0,perfect?gain-bonus:gain);slot.sub=perfect&&streak>1?'×'+streak:'';
 for(const q of popups)if(q!==slot&&q.on&&slot.at-q.at<.5)q.y-=22;
}
function drawPopups(c,calm){
 let any=false;const now=clock();
 for(const p of popups){
  if(!p.on)continue;const t=now-p.at;if(t>=POPUP_LIFE){p.on=false;continue}any=true;
  const u=t/POPUP_LIFE,rise=calm?0:ease(Math.min(1,u*1.25))*34,pop=calm?1:t<.12?.72+.36*(t/.12):t<.22?1.08-.08*((t-.12)/.1):1,alpha=u<.08?u/.08:u>.65?(1-u)/.35:1;
  c.save();c.translate(p.x,p.y-rise);c.scale(pop,pop);c.textAlign='center';c.textBaseline='middle';
  c.font=p.perfect?'800 20px system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif':'700 15px system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR",sans-serif';
  c.globalAlpha=alpha*.55;c.fillStyle='rgba(28,16,44,.9)';c.fillText(p.text,.8,1.6);
  if(p.perfect){const g=glow('255,226,150');if(g){c.globalCompositeOperation='lighter';c.globalAlpha=alpha*.5;c.drawImage(g,-46,-22,92,44);c.globalCompositeOperation='source-over'}}
  c.globalAlpha=alpha;c.fillStyle=p.perfect?'#ffe39a':'#fff4e2';c.fillText(p.text,0,0);
  if(p.sub){c.font='800 12px system-ui,sans-serif';c.globalAlpha=alpha*.9;c.fillStyle='#ffd0a0';c.fillText(p.sub,0,17)}
  c.restore();
 }
 return any;
}
function drawShards(c,dt){
 let any=false;c.save();c.globalCompositeOperation='lighter';
 for(const p of pool){
  if(!p.on)continue;p.age+=dt;if(p.age>=p.life){p.on=false;continue}any=true;if(p.age<0)continue;
  const u=p.age/p.life;let angle,len,alpha;
  if(p.kind===0){const drag=Math.pow(.12,dt);p.vx*=drag;p.vy=p.vy*drag+120*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.spin+=p.turn*dt;angle=Math.atan2(p.vy,p.vx);len=p.size*(1-u*.6);alpha=u<.15?u/.15:1-Math.pow((u-.15)/.85,1.6)}
  else{const e=ease(u),a=1-e;p.x=a*a*p.sx+2*a*e*p.qx+e*e*p.tx;p.y=a*a*p.sy+2*a*e*p.qy+e*e*p.ty;angle=p.spin+=p.turn*dt;len=p.size*(1-u*.35);alpha=u<.1?u/.1:u>.85?(1-u)/.15:1}
  const cos=Math.cos(angle),sin=Math.sin(angle),w=len*.3,halo=glow(p.ink),size=len*(p.kind?5.5:4.2);
  if(halo){c.globalAlpha=alpha*.85;c.drawImage(halo,p.x-size/2,p.y-size/2,size,size)}
  c.globalAlpha=alpha;c.fillStyle='rgb('+p.ink+')';c.beginPath();
  c.moveTo(p.x+cos*len,p.y+sin*len);c.lineTo(p.x-sin*w,p.y+cos*w);c.lineTo(p.x-cos*len*.7,p.y-sin*len*.7);c.lineTo(p.x+sin*w,p.y-cos*w);c.closePath();c.fill();
 }
 c.restore();return any;
}
function drawImpact(c,r,w,h,calm){
 const t=clock()-impact.at,x=impact.x,y=impact.y;
 const ended=r.state!=='play'||!!r.outro,dim=t<DIM_IN?t/DIM_IN:ended||t<DIM_HOLD?1:clamp(1-(t-DIM_HOLD)/DIM_OUT,0,1);
 if(dim>0){
  c.save();c.globalCompositeOperation='saturation';c.globalAlpha=.62*dim;c.fillStyle='#808080';c.fillRect(0,0,w,h);c.restore();
  if(!impact.dim){const g=c.createRadialGradient(x,y,18,x,y,Math.hypot(w,h)*.75);g.addColorStop(0,'rgba(26,14,52,0)');g.addColorStop(.28,'rgba(26,14,52,.28)');g.addColorStop(1,'rgba(14,8,32,.7)');impact.dim=g}
  c.save();c.globalAlpha=dim;c.fillStyle=impact.dim;c.fillRect(0,0,w,h);c.restore();
 }
 c.save();c.globalCompositeOperation='lighter';
 for(let k=0;k<2;k++){const u=clamp((t-k*.07)/.5,0,1);if(u<=0||u>=1)continue;
  c.beginPath();c.arc(x,y,10+ease(u)*(k?52:78),0,Math.PI*2);c.lineWidth=(k?1.4:2.6)*(1-u)+.4;c.strokeStyle=k?'rgba(200,180,255,'+(.6*(1-u)).toFixed(3)+')':'rgba(255,240,220,'+(.85*(1-u)).toFixed(3)+')';c.stroke()}
 if(t<.18){const u=t/.18,g=1-u;c.globalAlpha=g;c.fillStyle='rgba(255,248,236,.9)';c.beginPath();c.arc(x,y,6+u*10,0,Math.PI*2);c.fill();
  c.globalAlpha=g*.5;c.beginPath();c.ellipse(x,y,38*(1-u*.4),2.2,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(x,y,2.2,30*(1-u*.4),0,0,Math.PI*2);c.fill()}
 c.restore();
 if(calm){if(t<.25&&fx('flash')>0){c.save();c.globalAlpha=.2*Math.min(1,fx('flash')/.3)*(1-t/.25);c.fillStyle='#c4b2ff';c.fillRect(0,0,w,h);c.restore()}}
 else{
  if(t<FLASH&&fx('flash')>0){c.save();c.globalAlpha=.85*fx('flash')*(1-t/FLASH);c.fillStyle='#fffaf0';c.fillRect(0,0,w,h);c.restore()}
  if(t<SHAKE&&fx('shake')>0){const k=Math.pow(1-t/SHAKE,2)*SHAKE_PX*fx('shake');setShake(Math.sin(t*97)*k,Math.cos(t*131)*k*.7)}else resetShake();
 }
 return t<DIM_HOLD+DIM_OUT||ended;
}
function edgeGlow(c,w,h){
 if(edge?.w!==w||edge.h!==h||edge.c!==c){
  const r=Math.hypot(w,h)/2,g=c.createRadialGradient(w/2,h*.48,Math.min(w,h)*.34,w/2,h*.48,r);
  g.addColorStop(0,'rgba(80,230,210,0)');g.addColorStop(.55,'rgba(80,230,210,.16)');g.addColorStop(.8,'rgba(150,120,255,.34)');g.addColorStop(1,'rgba(255,130,210,.5)');
  const top=c.createLinearGradient(0,0,0,h*.3);top.addColorStop(0,'rgba(140,240,220,.35)');top.addColorStop(1,'rgba(140,240,220,0)');edge={w,h,c,g,top};
 }
 return edge;
}
function drawAurora(c,r,w,h,calm){
 const O=root.MongyuOpening,progress=r.distance/O.FINISH,k=r.outro?.kind==='clear'||r.state==='clear'?1:clamp((progress-.8)/.2,0,1);
 const settle=1-.6*(r.view?.poster||0);
 if(k>0){const e=edgeGlow(c,w,h),t=r.clock??r.time,wave=(calm?1:.85+.15*Math.sin(t*2.1))*settle;
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=k*wave;c.fillStyle=e.g;c.fillRect(0,0,w,h);c.globalAlpha=k*(calm?.6:.6+.4*Math.sin(t*1.3+1));c.fillStyle=e.top;c.fillRect(0,0,w,h*.3);c.restore()}
 if(r.outro?.kind==='clear'&&!bloom){const p=O.project?.(r,O.FINISH,34)||{x:w/2,y:h*.4};bloom={at:clock(),x:p.x,y:p.y};homing(p.x,p.y,18,.28,AURORA_INKS);sound('aurora-shimmer')}
 if(!bloom)return k>0;
 const t=clock()-bloom.at,u=clamp(t/BLOOM,0,1),e=ease(u),radius=24+e*Math.hypot(w,h)*1.1,peak=calm?.45:.62;
 const g=c.createRadialGradient(bloom.x,bloom.y,0,bloom.x,bloom.y,radius);
 g.addColorStop(0,'rgba(255,250,240,'+(peak*.9).toFixed(3)+')');g.addColorStop(.16,'rgba(150,240,226,'+(peak*.5).toFixed(3)+')');g.addColorStop(.4,'rgba(176,146,255,'+(peak*.42).toFixed(3)+')');g.addColorStop(.68,'rgba(255,156,222,'+(peak*.3).toFixed(3)+')');g.addColorStop(1,'rgba(255,156,222,0)');
 c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(u<.1?u/.1:1)*(1-.5*clamp((t-.3)/.7,0,1));c.fillStyle=g;c.fillRect(0,0,w,h);
 if(u<1){c.beginPath();c.arc(bloom.x,bloom.y,radius*.66,0,Math.PI*2);c.globalAlpha=(1-u)*.35;c.lineWidth=22*(1-u)+6;c.strokeStyle='rgba(255,190,232,.5)';c.stroke();c.globalAlpha=(1-u)*.45;c.lineWidth=2;c.strokeStyle='rgba(255,236,248,.6)';c.stroke()}
 c.restore();return true;
}
function onFrame({ctx:c,run:r,viewport:vp,reduced:calm}){
 const now=clock(),dt=clamp(now-(last||now),0,.05);last=now;
 if(r!==run){run=r;clearAll()}
 if(!c||!r)return;
 const w=vp.width,h=vp.height;calm=calm===true||reduced();
 let live=false;
 if(r.openingCourse&&r.polish)live=drawAurora(c,r,w,h,calm)||live;
 if(impact)live=drawImpact(c,r,w,h,calm)||live;
 live=drawShards(c,dt)||live;
 if(r.openingCourse&&r.state==='play'&&!r.crash)live=drawPopups(c,calm)||live;
 if(!live&&impact&&clock()-impact.at>DIM_HOLD+DIM_OUT)impact=null;
}
function attach(h){host=h}
if(enabled&&root.MongyuPolish){
 root.MongyuPolish.on('attach',attach);root.MongyuPolish.on('run-event',onEvent);root.MongyuPolish.on('frame',onFrame);
 if(root.MongyuPolish.host)attach(root.MongyuPolish.host);
}
const api=Object.freeze({enabled,limits:Object.freeze({particles:MAX,shakePx:SHAKE_PX,hitStop:.12}),activeParticles:()=>pool.filter(p=>p.on).length,
 popups:()=>popups.filter(p=>p.on).map(p=>({text:p.text,sub:p.sub,perfect:p.perfect,x:p.x,y:p.y})),impactPoint,reset:clearAll});
root.MongyuJuice=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
