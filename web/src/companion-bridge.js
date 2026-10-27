/* R19: original, volatile contact-driven cooperative room. No storage or rewards. */
(function(root){'use strict';
const STEP=1/120, EPS=1e-7;
const STATIC=Object.freeze([{id:'start',x:24,y:310,w:76},{id:'upper-start',x:24,y:240,w:86},{id:'second',x:210,y:240,w:40},{id:'upper-exit',x:250,y:240,w:88},{id:'exit',x:280,y:310,w:58},{id:'safe',x:24,y:400,w:314}].map(Object.freeze));
const PLATES=Object.freeze([{id:'A',x:48,y:310,w:32},{id:'B',x:218,y:240,w:24}].map(Object.freeze));
class Room{
 constructor(){this.reset()}
 reset(){this.player={x:64,y:310,vy:0,ground:'start',moving:false};this.companion={x:86,y:240,vy:0,ground:'upper-start'};this.state='waiting';this.paused=false;this.elapsed=0;this.acc=0;this.message='여길 밟고 있을게. 먼저 건너.';this.contacts={A:true,B:false};return true}
 onPlate(a,p){return !!a.ground&&Math.abs(a.y-p.y)<EPS&&a.x>=p.x&&a.x<=p.x+p.w}
 contact(){this.contacts={A:this.onPlate(this.player,PLATES[0]),B:this.onPlate(this.companion,PLATES[1])};return this.contacts}
 geometry(){const q=this.contact();return {platforms:[...STATIC,...(q.A?[{id:'bridge-A',x:110,y:240,w:100}]:[]),...(q.B?[{id:'bridge-B',x:100,y:310,w:180}]:[])],plates:PLATES,bridges:[{id:'bridge-A',x:110,y:240,w:100,active:q.A},{id:'bridge-B',x:100,y:310,w:180,active:q.B}]}}
 jump(){if(this.paused||!['waiting','crossing'].includes(this.state)||!this.player.ground||this.player.moving)return false;this.player.vy=-220;this.player.ground=null;this.player.moving=true;this.state='crossing';this.contact();return true}
 move(a,v,dt,platforms){const before=a.y;a.walking=Math.abs(v)>0;a.x=Math.min(322,a.x+v*dt);if(a.ground&&!platforms.some(p=>p.id===a.ground&&a.x>=p.x&&a.x<=p.x+p.w))a.ground=null;if(!a.ground){a.vy+=600*dt;a.y+=a.vy*dt;if(a.vy>=0){const p=platforms.filter(p=>a.x>=p.x&&a.x<=p.x+p.w&&before<=p.y+EPS&&a.y>=p.y-EPS).sort((a,b)=>a.y-b.y)[0];if(p){a.y=p.y;a.vy=0;a.ground=p.id}}}}
 step(dt){this.elapsed+=dt;let g=this.geometry();const p=this.player,c=this.companion;this.move(p,this.state==='falling'?0:p.moving?100:0,dt,g.platforms);g=this.geometry();const departing=p.ground==='exit'&&p.x>=300;let speed=this.state==='falling'?0:departing?70:this.contacts.B?0:60;this.move(c,speed,dt,g.platforms);this.contact();if(p.ground==='safe'||c.ground==='safe'){this.state=p.ground&&c.ground?'retry':'falling';this.message='아래는 안전해. 다시 맞춰 보자.';return}if(p.x>=310&&p.ground==='exit'&&c.x>=310&&c.ground==='upper-exit'){this.state='exited';this.message='서로 길이 되어 줬네.';return}this.message=this.contacts.B?'내가 받칠게. 이제 뛰어!':p.moving?'발판에서 발이 떨어졌어.':'여길 밟고 있을게. 먼저 건너.'}
 update(dt){if(this.paused||!['waiting','crossing','falling'].includes(this.state)||!Number.isFinite(dt)||dt<=0)return;this.acc+=Math.min(.1,dt);while(this.acc+EPS>=STEP){this.acc=Math.max(0,this.acc-STEP);this.step(STEP);if(['retry','exited'].includes(this.state)){this.acc=0;break}}}
 suspend(){this.paused=true;this.acc=0}
 resume(){this.paused=false;this.acc=0}
}
function draw(c,r,{reduced=false}={}){
 const ink='#18363D',paper='#DDF7C5',cyan='#69DBDF',lemon='#E4ED48',blue='#2198BC';
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 c.save();rect(0,0,360,480,cyan);
 if(root.QuadRiftArt?.squareWorld)root.QuadRiftArt.squareWorld(c,{x:0,y:0,w:360,h:480,time:r.elapsed,reduced,chapter:0,variant:0});
 // The shared square field surrounds, never competes with, the physical lanes.
 // This continuous quiet volume also keeps a falling body and the safe floor legible.
 c.fillStyle=cyan;c.beginPath();c.moveTo(18,135);for(const [x,y]of [[53,135],[53,148],[91,148],[91,134],[127,134],[127,148],[165,148],[165,138],[202,138],[202,148],[238,148],[238,131],[276,131],[276,146],[306,146],[306,137],[342,137],[342,419],[18,419]])c.lineTo(x,y);c.closePath();c.fill();
 c.fillStyle=ink;c.font='600 17px sans-serif';c.fillText('서로의 다리',24,32);
 const g=r.geometry();
 // Fine bent conduits link the actual plates to their respective bridge ends.
 c.strokeStyle=blue;c.lineWidth=2;c.beginPath();c.moveTo(64,316);c.lineTo(64,337);c.lineTo(104,337);c.lineTo(104,253);c.lineTo(116,253);c.moveTo(230,246);c.lineTo(230,268);c.lineTo(272,268);c.lineTo(272,322);c.stroke();
 for(const b of g.bridges){
  // Solid active tops versus two folded end stubs: state is not color-only.
  c.strokeStyle=ink;c.lineWidth=2;c.beginPath();
  if(b.active){c.moveTo(b.x,b.y+11);c.lineTo(b.x+b.w,b.y+11);for(let x=b.x+7;x<b.x+b.w;x+=18){c.moveTo(x,b.y+4);c.lineTo(x+6,b.y+11)}}
  else{c.moveTo(b.x,b.y+3);c.lineTo(b.x+10,b.y+26);c.moveTo(b.x+b.w,b.y+3);c.lineTo(b.x+b.w-10,b.y+26)}c.stroke();
  rect(b.x-3,b.y+3,7,9,blue);rect(b.x+b.w-4,b.y+3,7,9,blue);
 }
 for(const p of g.platforms){
  const bridge=p.id.startsWith('bridge'),safe=p.id==='safe';
  rect(p.x,p.y,p.w,8,bridge?lemon:paper);if(safe)rect(p.x,p.y+8,p.w,4,paper);rect(p.x,p.y,p.w,2,ink);
  if(!bridge){rect(p.x+4,p.y+(safe?12:8),8,safe?6:13,blue);rect(p.x+p.w-12,p.y+(safe?12:8),8,safe?6:13,blue)}
 }
 for(const p of g.plates){const on=r.contacts[p.id];rect(p.x-3,p.y-2,p.w+6,7,ink);rect(p.x,p.y-(on?2:7),p.w,on?3:5,on?lemon:paper);c.strokeStyle=ink;c.lineWidth=1;c.strokeRect(p.x,p.y-(on?2:7),p.w,on?3:5);c.fillStyle=ink;if(p.id==='A'){c.fillRect(p.x+p.w/2-2,p.y-(on?2:7),4,3)}else{c.fillRect(p.x+p.w/2-5,p.y-(on?2:7),3,3);c.fillRect(p.x+p.w/2+2,p.y-(on?2:7),3,3)}}
 // Slim open seams end both real lanes; no ornamental window or frame.
 for(const y of [240,310]){rect(312,y-43,17,43,paper);rect(315,y-39,11,37,cyan);rect(326,y-43,3,43,blue);rect(315,y-4,11,4,lemon)}
 // The uninterrupted pale landing is deliberately smooth: no spike-like grass.
 function actor(a,companion){if(root.QuadRiftArt?.human)root.QuadRiftArt.human(c,a.x,a.y,{scale:.65,phase:r.elapsed*8,idle:!!a.ground&&(!a.walking||r.paused),time:r.elapsed,reduced,color:companion?'#B53D69':'#18363D'});else{c.strokeStyle=companion?'#B53D69':'#18363D';c.lineWidth=2;c.beginPath();c.arc(a.x,a.y-28,4,0,Math.PI*2);c.moveTo(a.x,a.y-24);c.lineTo(a.x,a.y-10);c.moveTo(a.x-5,a.y-18);c.lineTo(a.x+6,a.y-17);c.moveTo(a.x,a.y-10);c.lineTo(a.x-5,a.y);c.moveTo(a.x,a.y-10);c.lineTo(a.x+5,a.y);c.stroke()}if(companion){c.fillStyle='#E4ED48';c.fillRect(a.x-5,a.y-20,10,4)}}actor(r.player,false);actor(r.companion,true);
 const speaker=r.contacts.B?r.companion:r.player,other=speaker===r.player?r.companion:r.player,clampX=x=>Math.max(26,Math.min(166,x)),candidates=[[speaker.x+18,speaker.y-49],[speaker.x-186,speaker.y-49],[clampX(speaker.x-84),speaker.y-84],[clampX(speaker.x-84),speaker.y+12]];const clear=([x,y])=>x>=24&&x+168<=338&&y>=80&&y+30<=398&&[speaker,other].every(a=>a.x+10<=x||a.x-10>=x+168||a.y<=y||a.y-34>=y+30);const [bx,by]=candidates.find(clear)||[clampX(speaker.x-84),110];c.fillStyle='#DDF7C5';c.fillRect(bx,by,168,30);const anchor=speaker.x<bx?bx:bx+168;c.beginPath();c.moveTo(anchor,by+12);c.lineTo(speaker.x+(speaker.x<bx?6:-6),speaker.y-29);c.lineTo(anchor,by+21);c.fill();c.fillStyle='#18363D';c.font='11px sans-serif';c.fillText(r.paused?'잠깐 쉬는 중이야.':r.message,bx+6,by+18);c.restore()}
function mount({document:d,window:w,canOpen,onOpen,onClose,reduced=()=>false}){const $=id=>d.getElementById(id),panel=$('bridgePanel'),canvas=$('bridgeCanvas'),c=canvas.getContext('2d'),room=new Room();let active=false,last=null,frame=0,generation=0,held=new Set(),completed=false;
 function captureCompletion(){completed=completed||room.state==='exited'&&room.player.x>=310&&room.player.ground==='exit'&&room.companion.x>=310&&room.companion.ground==='upper-exit';return Object.freeze({completed})}
 function ui(){captureCompletion();const msg=(room.paused?'일시정지. ':'')+room.message+' A 발판 '+(room.contacts.A?'눌림':'비어 있음')+'. B 발판 '+(room.contacts.B?'눌림':'비어 있음')+'.';if($('bridgeStatus').textContent!==msg)$('bridgeStatus').textContent=msg;$('bridgeJump').disabled=room.paused||room.player.moving||['retry','exited'].includes(room.state);$('bridgeReset').disabled=room.paused;$('bridgePause').textContent=room.paused?'이어하기':'쉬기';$('bridgeClose').textContent=room.state==='exited'?'함께 본길로':'곁길 건너뛰고 본길로';const focus=d.activeElement;if(active&&(focus?.disabled||focus?.hidden))$('bridgePause').focus();c.setTransform(canvas.width/360,0,0,canvas.height/480,0,0);draw(c,room,{reduced:reduced()})}
 function loop(now,token){if(!active||token!==generation)return;if(last!==null)room.update(Math.max(0,(now-last)/1000));last=now;ui();frame=w.requestAnimationFrame(t=>loop(t,token))}
 function open(e){if(active||!canOpen()||d.hidden)return false;completed=false;onOpen(e);room.reset();held.clear();active=true;last=null;generation++;panel.hidden=false;for(const id of ['top','stage','bar','bridgeInvitation']){$(id).inert=true;$(id).setAttribute('aria-hidden','true')}ui();$('bridgeJump').focus();const token=generation;frame=w.requestAnimationFrame(t=>loop(t,token));return true}
 function close(e){if(!active)return false;const outcome=captureCompletion();active=false;generation++;w.cancelAnimationFrame(frame);last=null;held.clear();panel.hidden=true;for(const id of ['top','stage','bar','bridgeInvitation']){$(id).inert=false;$(id).setAttribute('aria-hidden','false')}onClose(e,outcome);$('pause').focus();return true}
 function suspend(){if(active){held.clear();room.suspend();last=null;ui()}}
 const bind=(id,fn)=>{$(id).onclick=e=>{e?.stopPropagation?.();if(active&&!d.hidden&&!e?.repeat&&!(e?.detail>1)){captureCompletion();fn(e);ui()}}};$('bridgeOpen').onclick=open;bind('bridgeJump',()=>room.jump());bind('bridgeReset',()=>{if(!room.paused)room.reset();last=null;held.clear()});bind('bridgePause',()=>{if(room.paused)room.resume();else room.suspend();last=null;held.clear()});bind('bridgeClose',close);
 canvas.addEventListener('pointerdown',e=>{if(!active||d.hidden||e.isPrimary===false||e.button>0||held.has('pointer'))return;e.preventDefault();held.add('pointer');room.jump();ui()});w.addEventListener('pointerup',()=>held.delete('pointer'));w.addEventListener('pointercancel',()=>held.delete('pointer'));
 canvas.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();if(active&&!d.hidden&&!e.repeat&&!held.has(e.code)){held.add(e.code);room.jump();ui()}}});w.addEventListener('keyup',e=>held.delete(e.code));
 panel.addEventListener('keydown',e=>{if(e.repeat&&['Space','Enter'].includes(e.code)){e.preventDefault();return}if(e.code==='Escape'){e.preventDefault();e.stopPropagation();if(!e.repeat)suspend();return}if(e.code==='Tab'){const controls=[canvas,...panel.querySelectorAll('button')].filter(b=>!b.disabled&&!b.hidden),i=controls.indexOf(d.activeElement);e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length].focus()}});w.addEventListener('blur',suspend);w.addEventListener('pagehide',suspend);d.addEventListener('visibilitychange',()=>{if(d.hidden)suspend()});return {room,open,close,suspend,get active(){return active}}}
root.MongyuCompanionBridge={Room,draw,mount,STEP};if(typeof module!=='undefined')module.exports=root.MongyuCompanionBridge;
})(globalThis);
