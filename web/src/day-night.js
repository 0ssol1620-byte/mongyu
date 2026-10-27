/* R29: a voluntary spatial room. Phase is an action, never a real-world clock. */
(function(root){'use strict';
const STEP=1/120,EPS=1e-7;
class Room{
 constructor(){this.reset()}
 reset(){this.phase='night';this.liftY=340;this.player={x:64,y:340,ground:'start',moving:false,target:64};this.state='active';this.paused=false;this.elapsed=0;this.acc=0;return true}
 geometry(){const lift={id:'lift',x:112,y:this.liftY,w:64};return {platforms:[{id:'start',x:24,y:340,w:88},lift,{id:'ledge',x:176,y:240,w:160}],lift,gate:{x:276,y:196,w:12,h:44,closed:this.phase==='day'},exit:{x:312,y:240,w:18}}}
 get message(){if(this.state==='exited')return '건넜다! 본길로 돌아가자.';if(this.paused)return '쉬어도 길은 그대로야.';if(this.phase==='night'&&this.player.y===240&&this.player.x>269&&this.player.x<295)return '문 안이야. 먼저 지나가자.';if(this.player.ground==='start')return this.phase==='day'?'밤으로 발판을 내려 볼까?':'낮은 발판에 올라가자.';if(this.player.ground==='lift')return this.phase==='night'?'올라탔어. 낮으로 바꾸자.':'고정 턱으로 건너가자.';return this.phase==='day'?'밤이면 저 문이 열려.':'열린 문 너머로 걸어가자.'}
 walk(){if(this.paused||this.state!=='active'||this.player.moving)return false;const p=this.player;p.target=p.ground==='start'?144:p.ground==='lift'?(this.phase==='day'?224:170):322;p.moving=true;return true}
 toggle(){if(this.paused||this.state!=='active')return false;const p=this.player;if(this.phase==='night'&&p.y===240&&p.x>269&&p.x<295)return false;this.phase=this.phase==='night'?'day':'night';p.moving=false;p.target=p.x;this.acc=0;return true}
 step(dt){this.elapsed+=dt;const p=this.player,target=this.phase==='night'?340:240;this.liftY+=Math.sign(target-this.liftY)*Math.min(Math.abs(target-this.liftY),400*dt);if(p.ground==='lift')p.y=this.liftY;const g=this.geometry();if(!p.moving||p.ground==='lift'&&Math.abs(this.liftY-target)>EPS)return;let next=Math.min(p.target,p.x+96*dt);if(g.gate.closed&&p.y===240&&next>=g.gate.x-7)next=Math.max(p.x,g.gate.x-7);const support=g.platforms.find(s=>next>=s.x-EPS&&next<=s.x+s.w+EPS&&Math.abs(p.y-s.y)<EPS);if(!support){if(p.ground==='start'&&target===340&&Math.abs(this.liftY-target)>EPS)return;p.moving=false;p.target=p.x;return}p.x=next;p.ground=support.id;if(p.x>=p.target-EPS||g.gate.closed&&p.x>=g.gate.x-7-EPS)p.moving=false;if(p.ground==='ledge'&&!g.gate.closed&&p.x>=g.exit.x&&p.y===g.exit.y){this.state='exited';p.moving=false}}
 update(dt){if(this.paused||this.state!=='active'||!Number.isFinite(dt)||dt<=0)return;this.acc+=Math.min(.1,dt);while(this.acc+EPS>=STEP){this.acc=Math.max(0,this.acc-STEP);this.step(STEP);if(this.state==='exited'){this.acc=0;break}}}
 suspend(){this.paused=true;this.player.moving=false;this.acc=0}
 resume(){this.paused=false;this.acc=0}
}
function draw(c,r,{reduced=false}={}){
 const night=r.phase==='night',ink='#18363D',paper='#DDF7C5',sky='#69DBDF',blue='#2198BC',sun='#E4ED48';
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 c.save();rect(0,0,360,480,sky);if(root.QuadRiftArt?.squareWorld)root.QuadRiftArt.squareWorld(c,{x:0,y:0,w:360,h:480,time:r.elapsed,reduced,chapter:0,variant:0});
 // An open stepped clearing, not a framed instruction panel.
 c.fillStyle=sky;c.beginPath();c.moveTo(18,123);for(const [x,y]of [[67,123],[67,140],[121,140],[121,123],[178,123],[178,138],[232,138],[232,121],[291,121],[291,138],[342,138],[342,394],[18,394]])c.lineTo(x,y);c.closePath();c.fill();
 c.fillStyle=ink;c.font='600 17px sans-serif';c.fillText('해와 달의 틈',24,32);c.font='12px sans-serif';c.fillText(night?'밤 · 발판 아래 / 문 열림':'낮 · 발판 위 / 문 닫힘',45,57);c.fillStyle=night?paper:sun;c.beginPath();c.arc(31,53,8,0,Math.PI*2);c.fill();if(night){c.fillStyle=sky;c.beginPath();c.arc(35,49,7,0,Math.PI*2);c.fill()}else{c.strokeStyle=ink;c.lineWidth=1;for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.moveTo(31+10*Math.cos(a),53+10*Math.sin(a));c.lineTo(31+13*Math.cos(a),53+13*Math.sin(a));c.stroke()}}
 const g=r.geometry();
 // Lift rails and the empty docking mark reveal the height change without color.
 rect(119,244,4,96,blue);rect(165,244,4,96,blue);c.strokeStyle=blue;c.lineWidth=1;c.setLineDash([4,4]);c.strokeRect(112,night?240:340,64,8);c.setLineDash([]);
 for(const p of g.platforms){rect(p.x,p.y,p.w,12,p.id==='lift'?sun:paper);rect(p.x,p.y,p.w,2,ink);if(p.id==='lift'){rect(p.x+4,p.y+12,56,12,blue);rect(p.x+27,p.y+4,10,5,ink)}else{for(let x=p.x+4;x<p.x+p.w-5;x+=22)rect(x,p.y+12,10,p.id==='ledge'?18:25,blue)}}
 // Lift is a transforming square column; upper ledge is independent solid ground.
 if(Math.abs(r.liftY-(night?340:240))<EPS){c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.moveTo(144,night?320:280);c.lineTo(144,night?296:306);c.moveTo(138,night?302:300);c.lineTo(144,night?296:306);c.lineTo(150,night?302:300);c.stroke()}
 rect(g.gate.x-3,188,18,8,ink);if(g.gate.closed){rect(g.gate.x,196,12,44,blue);for(let y=200;y<238;y+=9)rect(g.gate.x,y,12,3,paper)}else{rect(g.gate.x,188,12,7,blue);c.strokeStyle=blue;c.lineWidth=1;c.setLineDash([3,4]);c.strokeRect(g.gate.x,196,12,44);c.setLineDash([])}
 rect(312,196,21,44,paper);rect(316,200,13,40,sky);rect(330,196,3,44,blue);rect(316,236,13,4,sun);
 c.fillStyle=ink;c.font='10px sans-serif';c.fillText(g.gate.closed?'닫힘':'열림',267,177);
 const p=r.player;if(root.QuadRiftArt?.human)root.QuadRiftArt.human(c,p.x,p.y,{scale:.65,phase:r.elapsed*8,idle:!p.moving||r.paused,time:r.elapsed,reduced,color:ink});else{c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-28,4,0,Math.PI*2);c.moveTo(p.x,p.y-24);c.lineTo(p.x,p.y-10);c.moveTo(p.x-6,p.y-18);c.lineTo(p.x+6,p.y-18);c.moveTo(p.x,p.y-10);c.lineTo(p.x-5,p.y);c.moveTo(p.x,p.y-10);c.lineTo(p.x+5,p.y);c.stroke()}
 // Speech tail attaches to the actual moving person's head; never covers the next footfall.
 const nearExit=p.x>=295,bw=nearExit?64:160,bx=nearExit?292:p.ground==='lift'?14:p.ground==='start'?24:80,by=p.y-76;c.fillStyle=paper;c.fillRect(bx,by,bw,30);const tipX=p.x-3,baseX=Math.max(bx+8,Math.min(bx+bw-14,tipX));c.beginPath();c.moveTo(baseX,by+30);c.lineTo(tipX,p.y-34);c.lineTo(baseX+7,by+30);c.fill();c.fillStyle=ink;c.font='11px sans-serif';c.fillText(nearExit?(r.state==='exited'?'건넜다!':'조금만 더!'):r.message,bx+7,by+19);
 c.restore();
}
function mount({document:d,window:w,canOpen,onOpen,onClose,reduced=()=>false}){
 const $=id=>d.getElementById(id),panel=$('dayNightPanel'),canvas=$('dayNightCanvas'),c=canvas.getContext('2d'),room=new Room();let active=false,last=null,frame=0,generation=0,completed=false;const held=new Set();
 // Capture only a physically reached, open night exit; invitation and gate state alone prove nothing.
 function captureCompletion(){const g=room.geometry(),p=room.player,ledge=g.platforms.find(s=>s.id==='ledge');completed=completed||room.state==='exited'&&room.phase==='night'&&!g.gate.closed&&p.ground==='ledge'&&p.x>=g.exit.x&&p.x<=ledge.x+ledge.w&&p.y===g.exit.y;return Object.freeze({completed})}
 function ui(){captureCompletion();const msg=(room.phase==='night'?'밤. ':'낮. ')+room.message+' 위치 '+({start:'아래 길',lift:'승강 발판',ledge:'고정 턱'}[room.player.ground])+'.';if($('dayNightStatus').textContent!==msg)$('dayNightStatus').textContent=msg;$('dayNightWalk').disabled=room.paused||room.state==='exited'||room.player.moving;$('dayNightToggle').disabled=room.paused||room.state==='exited';$('dayNightToggle').textContent=room.phase==='night'?'☀ 낮으로 바꾸기':'☾ 밤으로 바꾸기';$('dayNightPause').textContent=room.paused?'이어하기':'쉬기';$('dayNightClose').textContent=room.state==='exited'?'본길로 돌아가기':'곁길 건너뛰고 본길로';if(active&&d.activeElement?.disabled)$(room.paused||room.state==='exited'?'dayNightPause':'dayNightToggle').focus();c.setTransform(canvas.width/360,0,0,canvas.height/480,0,0);draw(c,room,{reduced:reduced()})}
 function loop(now,token){if(!active||token!==generation)return;if(last!==null&&!d.hidden)room.update(Math.max(0,(now-last)/1000));last=now;ui();frame=w.requestAnimationFrame(t=>loop(t,token))}
 function open(e){if(active||d.hidden||e?.repeat||e?.detail>1||!canOpen())return false;completed=false;onOpen(e);room.reset();held.clear();active=true;last=null;generation++;panel.hidden=false;for(const id of ['top','stage','bar','bridgeInvitation']){$(id).inert=true;$(id).setAttribute('aria-hidden','true')}ui();$('dayNightWalk').focus();const token=generation;frame=w.requestAnimationFrame(t=>loop(t,token));return true}
 function close(e){if(!active)return false;const outcome=captureCompletion();held.clear();active=false;generation++;w.cancelAnimationFrame(frame);room.suspend();last=null;panel.hidden=true;for(const id of ['top','stage','bar','bridgeInvitation']){$(id).inert=false;$(id).setAttribute('aria-hidden','false')}onClose(e,outcome);$('pause').focus();return true}
 function suspend(){if(active){held.clear();room.suspend();last=null;ui()}}
 const actions={dayNightWalk:()=>room.walk(),dayNightToggle:()=>room.toggle(),dayNightPause:()=>{if(room.paused)room.resume();else room.suspend();last=null},dayNightClose:close};
 function invoke(id,e){e?.stopPropagation?.();if(!active||d.hidden||e?.repeat||e?.detail>1||$(id).disabled)return false;actions[id](e);if(active)ui();return true}
 $('dayNightOpen').onclick=open;for(const id of Object.keys(actions))$(id).onclick=e=>invoke(id,e);
 panel.addEventListener('keydown',e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();if(!e.repeat&&!held.has(e.code)){held.add(e.code);if(actions[d.activeElement?.id])invoke(d.activeElement.id,e)}return}if(e.code==='Escape'){e.preventDefault();e.stopPropagation();if(!e.repeat)suspend();return}if(e.code==='Tab'){const controls=Object.keys(actions).map($).filter(b=>!b.disabled&&!b.hidden),i=controls.indexOf(d.activeElement);e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length].focus()}});
 w.addEventListener('keyup',e=>held.delete(e.code));w.addEventListener('blur',suspend);w.addEventListener('pagehide',suspend);d.addEventListener('visibilitychange',()=>{if(d.hidden)suspend()});return {room,open,close,suspend,get active(){return active}};
}
root.MongyuDayNight={Room,draw,mount,STEP};if(typeof module!=='undefined')module.exports=root.MongyuDayNight;
})(globalThis);
