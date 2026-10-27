/* R18: one optional, volatile spatial rule puzzle. No progression or storage access. */
(function(root){'use strict';
const CALL=Object.freeze(['dot','line','window']),LABEL={dot:'점',line:'선',window:'창'},GLYPH={dot:'●',line:'━',window:'▣'};
class Puzzle{
 constructor(){this.reset()}
 reset(){this.id='square-reply-v1';this.state='ready';this.reply=[];this.sent=[];this.gateOpen=false;this.solvedCount=0;this.exitProgress=0;this.elapsed=0;this.paused=false;this.message='여긴 끝에서부터 답하는 곳이래.';return true}
 get call(){return CALL.slice()}
 editable(){return !this.paused&&['ready','composing'].includes(this.state)}
 select(symbol){if(!this.editable()||!CALL.includes(symbol)||this.reply.includes(symbol)||this.reply.length>=3)return false;this.reply.push(symbol);this.state='composing';this.message=this.reply.length===3?'세 칸이 찼어. 이제 보내 볼까?':'끝에서부터, 하나씩.';return true}
 undo(){if(!this.editable()||!this.reply.length)return false;this.reply.pop();this.message='마지막 칸을 되돌렸어.';return true}
 hint(){if(this.editable())this.message='여긴 끝에서부터 답하는 곳이래.'}
 submit(){if(!this.editable())return false;if(this.reply.length!==3){this.message=(3-this.reply.length)+'칸이 비었어. 세 신호를 채워 줘.';return false}this.sent=this.reply.slice();this.state='submitted';this.elapsed=0;this.message='답신을 보내는 중.';return true}
 update(dt,{reduced=false}={}){if(this.paused||!Number.isFinite(dt)||dt<0)return;dt=Math.min(dt,.1);if(this.state==='submitted'){this.elapsed=0;if(this.sent.every((v,i)=>v===CALL[2-i])){this.state='solved';this.gateOpen=true;this.solvedCount++;this.message='통했어. 문 너머로 가자.'}else{this.state='incorrect';this.message='마지막 신호부터 돌려보내자.'}return}if(this.state==='incorrect'){this.elapsed+=dt;if(reduced||this.elapsed>=.6-1e-9){this.reply=[];this.state='composing';this.elapsed=0}return}if(this.state==='solved'){this.exitProgress=Math.min(1,this.exitProgress+dt/1.4);if(reduced||this.exitProgress>=1-1e-9)this.skip()}}
 skip(){if(this.state!=='solved')return false;this.exitProgress=1;this.state='exited';this.message='답신이 길을 열었어.';return true}
 suspend(){this.paused=true}
 resume(){this.paused=false}
}
function draw(c,p,{reduced=false,time=0}={}){
 const ink='#15343d',paper='#DDF7C5',cyan='#69DBDF',lemon='#E4ED48',pink='#B53D69',blue='#2198BC';
 const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h)};
 const glyph=(s,x,y,size=12,color=ink)=>{c.fillStyle=color;c.strokeStyle=color;c.lineWidth=2;if(s==='dot'){c.beginPath();c.arc(x,y,size*.32,0,Math.PI*2);c.fill()}else if(s==='line')c.fillRect(x-size*.5,y-1.5,size,3);else if(s==='window'){c.strokeRect(x-size*.43,y-size*.43,size*.86,size*.86);c.fillRect(x-1.5,y-1.5,3,3)}};
 const text=(s,x,y,size=11,color=ink,align='left')=>{c.fillStyle=color;c.font=`${size>=16?'600 ':''}${size}px "Noto Sans CJK KR", sans-serif`;c.textAlign=align;c.fillText(s,x,y)};
 c.save();rect(0,0,360,480,ink);
 if(root.QuadRiftArt?.squareWorld)root.QuadRiftArt.squareWorld(c,{x:0,y:0,w:360,h:480,time,reduced,chapter:0,variant:0});
 // The camera is inside the same living square field as the journey.
 // Quiet stepped space is carved out for the voice and the three signal stones.
 c.fillStyle=cyan;c.beginPath();c.moveTo(45,78);c.lineTo(238,78);c.lineTo(238,147);c.lineTo(257,147);c.lineTo(257,340);c.lineTo(53,340);c.lineTo(53,291);c.lineTo(69,291);c.lineTo(69,198);c.lineTo(45,198);c.closePath();c.fill();
 text('모서리의 답신',24,34,16,ink);
 // Call and latches sit on one continuous inset rail rather than a panel.
 c.strokeStyle=paper;c.lineWidth=4;c.lineJoin='miter';c.beginPath();c.moveTo(52,111);c.lineTo(272,111);c.lineTo(272,233);c.stroke();
 
 for(let i=0;i<3;i++){const x=83+i*60;rect(x-14,97,28,28,paper);glyph(CALL[i],x,111,17);if(i<2){c.strokeStyle=ink;c.lineWidth=1;c.beginPath();c.moveTo(x+20,111);c.lineTo(x+38,111);c.lineTo(x+34,107);c.moveTo(x+38,111);c.lineTo(x+34,115);c.stroke()}}
 // The right-hand boundary is both latch and exit, never a separate sidebar.
 rect(294,151,25,189,p.gateOpen?paper:blue);rect(319,139,9,201,cyan);
 if(p.gateOpen){rect(304,163,8,156,lemon);rect(328,321,14,19,cyan)}else{rect(305,151,3,189,ink);rect(294,320,25,3,lemon)}
 for(let i=0;i<3;i++){const y=167+i*22,s=p.reply[i];rect(258,y,29,18,s?(p.state==='incorrect'?pink:lemon):paper);c.strokeStyle=ink;c.lineWidth=1;c.strokeRect(258,y,29,18);if(s)glyph(s,272.5,y+9,11);else{text(String(i+1),272.5,y+13,10,ink,'center')}rect(287,y+8,p.gateOpen?7:18,2,s?lemon:cyan)}
 rect(252,234,62,19,ink);text('되돌리기',280,247,10,paper,'center');
 // An unbroken walk line exits through the same opening. Controls are inset stones.
 rect(24,340,318,2,ink);rect(24,342,318,11,paper);
 // Uneven rock roots connect every input to the living foreground.
 for(const [x,y,w,h]of [[45,393,42,31],[108,393,39,40],[167,393,43,31],[247,389,57,38]]){rect(x,y,w,h,ink);rect(x+5,y+12,9,17,blue)}
 for(let i=0;i<3;i++){const sx=50+i*61,on=p.reply.includes(CALL[i]),y=on?370:366;rect(sx+9,y+5,28,22,ink);rect(sx+6,y,28,22,on?cyan:lemon);glyph(CALL[i],sx+20,y+11,13);text(on?'새겨짐':LABEL[CALL[i]],sx+22,411,11,paper,'center');if(on){rect(sx+12,354,16,2,ink)}}
 const enabled=p.reply.length===3;rect(254,366,39,22,enabled?ink:cyan);c.strokeStyle=enabled?lemon:ink;c.lineWidth=2;c.beginPath();c.moveTo(268,382);c.lineTo(280,372);c.lineTo(272,372);c.moveTo(280,372);c.lineTo(280,380);c.stroke();text('보내기',274,408,11,paper,'center');
 const x=184+p.exitProgress*145,y=340;
 if(root.QuadRiftArt?.human)root.QuadRiftArt.human(c,x,y,{scale:.72,phase:time*9,idle:p.state!=='solved',time,reduced,color:ink});
 else{c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.arc(x,y-25,3,0,Math.PI*2);c.moveTo(x,y-22);c.lineTo(x,y-10);c.moveTo(x-6,y-17);c.lineTo(x+6,y-15);c.moveTo(x,y-10);c.lineTo(x-4,y);c.moveTo(x,y-10);c.lineTo(x+5,y);c.stroke()}
 // A short voice cue belongs to the actor; permanent rule remains above the call.
 const bx=Math.min(178,x-91),by=282;
 const message=p.paused?'잠깐 쉬는 중이야.':p.message;
 rect(bx,by,160,24,paper);c.fillStyle=paper;c.beginPath();c.moveTo(Math.min(bx+144,x-7),by+24);c.lineTo(x,y-31);c.lineTo(Math.min(bx+153,x+3),by+24);c.fill();text(message,bx+7,by+16,10);

 c.restore();
}
function mount({document:d,window:w,canOpen=()=>false,onOpen=()=>{},onClose=()=>{},reduced=()=>false}){
 const $=id=>d.getElementById(id),panel=$('replyPanel'),canvas=$('replyCanvas'),c=canvas.getContext('2d'),p=new Puzzle();let active=false,last=null,frame=0,time=0,generation=0,context='title',completed=false;
 function captureCompletion(){completed=completed||p.gateOpen&&p.solvedCount>0&&p.sent.length===CALL.length&&p.sent.every((v,i)=>v===CALL[CALL.length-1-i])&&['solved','exited'].includes(p.state);return Object.freeze({completed})}
 function ui(){captureCompletion();const set=(id,key,value)=>{if($(id)[key]!==value)$(id)[key]=value};for(const s of CALL){set('reply-'+s,'disabled',!p.editable()||p.reply.includes(s));$('reply-'+s).setAttribute('aria-pressed',String(p.reply.includes(s)))}
 set('replyClose','textContent',context==='journey'?'곁길 건너뛰고 본길로':'제목으로');set('replySend','disabled',!p.editable());set('replyUndo','disabled',!p.editable()||!p.reply.length);set('replyReset','disabled',!p.editable());set('replySkip','hidden',p.state!=='solved');set('replyRetry','hidden',p.state!=='exited');set('replyPause','disabled',p.state==='exited');set('replyPause','textContent',p.paused?'이어하기':'쉬기');
 for(let i=0;i<3;i++)set('replySlot'+i,'textContent',(i+1)+'. '+(p.reply[i]?GLYPH[p.reply[i]]+' '+LABEL[p.reply[i]]:'빈 칸'));
 set('replyStatus','textContent',(p.paused?'일시정지. ':'')+p.message+' 답신 '+p.reply.map(s=>LABEL[s]).join(' → ')+' ('+p.reply.length+'/3). '+(p.gateOpen?'문 열림.':'문 닫힘.'));
 const focused=d.activeElement;if(active&&focused&&(focused.disabled||focused.hidden)){const ids=p.state==='exited'?['replyRetry','replyClose']:p.state==='solved'?['replySkip','replyClose']:[...CALL.map(s=>'reply-'+s),'replySend','replyPause','replyClose'];const next=ids.map($).find(b=>!b.hidden&&!b.disabled);next?.focus()}
 c.setTransform(canvas.width/360,0,0,canvas.height/480,0,0);draw(c,p,{reduced:reduced(),time});}
 function loop(now,token){if(!active||token!==generation)return;if(last!==null){const dt=Math.max(0,(now-last)/1000);if(!p.paused)time+=Math.min(dt,.1);p.update(dt,{reduced:reduced()})}last=now;if(context==='journey'&&p.state==='exited'){close();return}ui();frame=w.requestAnimationFrame(now=>loop(now,token))}
 function background(inert){for(const id of ['top','stage','bar','bridgeInvitation']){const el=$(id);if(el){el.inert=inert;el.setAttribute('aria-hidden',String(inert))}}}
 function open(event,entry='title'){if(active||d.hidden||!canOpen(entry))return false;context=entry;completed=false;onOpen(event,context);p.reset();active=true;generation++;time=0;last=null;panel.hidden=false;background(true);ui();$('replyCall').focus();const token=generation;frame=w.requestAnimationFrame(now=>loop(now,token));return true}
 function close(event){if(!active)return false;const outcome=captureCompletion();active=false;generation++;w.cancelAnimationFrame(frame);last=null;p.reset();panel.hidden=true;background(false);const target=onClose(event,context,outcome)||$('replyOpen');if(!target.hidden&&!target.disabled)target.focus();return true}
 function suspend(){if(!active)return;p.suspend();last=null;ui()}
 function bind(id,fn){$(id).onclick=e=>{e?.stopPropagation?.();if(!active||d.hidden||e?.repeat||e?.detail>1)return;captureCompletion();fn(e);if(active)ui()}}
 $('replyOpen').onclick=e=>open(e);if($('replyJourneyOpen'))$('replyJourneyOpen').onclick=e=>open(e,'journey');for(const s of CALL)bind('reply-'+s,()=>p.select(s));bind('replyCall',()=>p.hint());bind('replySend',()=>p.submit());bind('replyUndo',()=>p.undo());bind('replyReset',()=>p.reset());bind('replySkip',e=>{if(p.skip()&&context==='journey')close(e)});bind('replyRetry',()=>p.reset());bind('replyClose',close);bind('replyPause',()=>{if(p.paused)p.resume();else p.suspend();last=null});
 panel.addEventListener('keydown',e=>{if(['Enter','Space'].includes(e.code)&&e.repeat){e.preventDefault();return}if(e.code==='Escape'){e.preventDefault();e.stopPropagation();if(!e.repeat)close(e);return}if(e.code==='Tab'){const controls=[...panel.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled),i=controls.indexOf(d.activeElement);e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length].focus()}});
 w.addEventListener('blur',suspend);w.addEventListener('pagehide',suspend);d.addEventListener('visibilitychange',()=>{if(d.hidden)suspend()});
 return {open,close,suspend,puzzle:p,get active(){return active}};
}
root.MongyuSquareReply={Puzzle,draw,mount};if(typeof module!=='undefined')module.exports=root.MongyuSquareReply;
})(globalThis);
