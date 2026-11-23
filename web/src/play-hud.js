/* R104 play HUD: large score, bottom progress gauge and speech dock. Owned by workstream C. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const num=v=>Number.isFinite(v)?v:0;
const OVERLAYS=['restorationScene','pauseSheet','squareResult','restorationAftermath'];
const FACE='<svg viewBox="0 0 48 48" aria-hidden="true"><defs><radialGradient id="r104FaceBg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#5a3f86"/><stop offset="1" stop-color="#241a3d"/></radialGradient></defs><circle cx="24" cy="24" r="23" fill="url(#r104FaceBg)"/><path d="M11 33c0-12 5-21 13-21s13 9 13 21c-3 3-8 5-13 5s-10-2-13-5z" fill="#f6ecdf"/><path d="M16 29c0-7 3.4-11.5 8-11.5s8 4.5 8 11.5c-2.4 1.6-5 2.4-8 2.4s-5.6-.8-8-2.4z" fill="#2b1f3f"/><ellipse cx="20.6" cy="25.6" rx="1.6" ry="2" fill="#ffe2b0"/><ellipse cx="27.4" cy="25.6" rx="1.6" ry="2" fill="#ffe2b0"/><path d="M12 36c4 2.6 8 3.6 12 3.6s8-1 12-3.6l1 4c-4 2.6-8.6 3.8-13 3.8s-9-1.2-13-3.8z" fill="#ff9d72"/><path d="M33 37l6 5-1.6 1.6-6.4-4.4z" fill="#ff8a63"/></svg>';
const GUIDE='<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#2c2148"/><circle cx="24" cy="24" r="13" fill="none" stroke="#ffd98f" stroke-opacity=".45" stroke-width="2"/><circle cx="24" cy="24" r="7.5" fill="#ffe7b3"/></svg>';
const GATE='<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="r104GateA" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8ff3dc"/><stop offset=".5" stop-color="#c9a2ff"/><stop offset="1" stop-color="#ffa7d1"/></linearGradient><linearGradient id="r104GateB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".85"/></linearGradient></defs><path d="M6 29V15a10 10 0 0 1 20 0v14" fill="none" stroke="url(#r104GateA)" stroke-width="3.2" stroke-linecap="round"/><path d="M10.5 29V16a5.5 5.5 0 0 1 11 0v13z" fill="url(#r104GateA)" opacity=".38"/><path d="M10.5 29V16a5.5 5.5 0 0 1 11 0v13z" fill="url(#r104GateB)" opacity=".55"/><circle cx="16" cy="6.5" r="1.4" fill="#fff6d8"/></svg>';
const HEART='<svg viewBox="0 0 16 14" aria-hidden="true"><path d="M8 13.2C3.4 9.9 1 7.5 1 4.6 1 2.6 2.6 1 4.5 1c1.4 0 2.6.8 3.5 2 .9-1.2 2.1-2 3.5-2C13.4 1 15 2.6 15 4.6c0 2.9-2.4 5.3-7 8.6z"/></svg>';

/* Pure model: everything the HUD shows, read straight from the run (no invented scoring). */
function openingModel(run,O){
 const obstacles=O?.OBSTACLES||[],sections=O?.SECTIONS||[],finish=num(O?.FINISH)||1;
 const first=Number.isInteger(run.firstIndex)?run.firstIndex:0,end=Number.isInteger(run.endIndex)?run.endIndex:obstacles.length,index=num(run.index);
 const practice=run.practice===true&&end<obstacles.length;
 const lo=practice?num(sections[run.checkpoint]?.start):0,last=obstacles[end-1];
 const hi=practice&&last?last.at+last.width+5:finish,span=Math.max(1,hi-lo);
 let section='';for(const s of sections)if(num(run.distance)>=s.start)section=s.name;
 const notches=[];for(let i=first;i<end&&i<obstacles.length;i++)notches.push({pos:clamp((obstacles[i].at-lo)/span,0,1),lit:i<index});
 return {kind:'opening',score:Math.max(0,Math.floor(num(run.score))),ratio:clamp((num(run.distance)-lo)/span,0,1),notches,
  left:(practice?'연습 · ':'')+section,right:'빛 '+clamp(index-first,0,end-first)+' / '+(end-first),hearts:null,streak:Math.max(0,Math.floor(num(run.perfectStreak)))};
}
function nativeModel(run,v){
 v=v||{};const score=Math.max(0,Math.floor(num(v.score))),objective=v.scoreObjective||{};
 const tracked=!v.freePlay&&!!v.scoreFinalization&&num(objective.target)>0;
 const current=tracked?clamp(num(objective.current),0,objective.target):0;
 const max=Math.max(0,Math.floor(num(run.initialLives))),hearts=clamp(Math.floor(num(v.hearts)),0,Math.max(max,num(v.hearts)));
 return {kind:'native',score,ratio:tracked?current/objective.target:clamp(num(v.progress),0,1),notches:[],tracked,
  left:'',right:tracked?(current>=objective.target?'목표 달성':current+' / '+objective.target+'점'):v.boss?'보스 '+Math.round(clamp(num(v.progress),0,1)*100)+'%':'',
  hearts:{now:hearts,max:Math.max(max,hearts)},streak:0};
}
function model(run,O,status){return run?.openingCourse?openingModel(run,O):nativeModel(run,status)}
/* Speech priority: coach (until run.time < coach.until) -> canvas dialogue -> section guide -> nothing. */
function pickSpeech(run,dialogue,guide){
 const c=run?.coach;
 if(c&&typeof c.text==='string'&&c.text&&(!Number.isFinite(c.until)||num(run.time)<c.until))return {text:c.text,kind:String(c.kind||'coach'),source:'coach'};
 if(dialogue)return {text:String(dialogue),kind:'line',source:'dialogue'};
 if(guide)return {text:String(guide),kind:'guide',source:'guide'};
 return null;
}
function shouldShow(run,doc){
 if(!run||!['play','transition'].includes(run.state))return false;
 if(doc?.body?.dataset&&doc.body.dataset.screen!=='play')return false;
 for(const id of OVERLAYS){const n=doc?.getElementById?.(id);if(n&&!n.hidden)return false}
 return true;
}
/* Opening section guide = the old bottom hint (status().cue), minus the brief '빛 회수' flash after each pass. */
function openingGuide(run){if(!run.crash&&num(run.time)-num(run.crossedAt)<.65)return '';try{return run.status?.()?.cue?.text||''}catch(_){return ''}}
const visibleText=n=>n&&!n.hidden&&n.textContent?n.textContent.trim():'';

function mount(doc,host){
 const $=id=>doc.getElementById(id),html=doc.documentElement;
 const el=(tag,cls,parent,inner)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(inner)n.innerHTML=inner;if(parent)parent.appendChild(n);return n};
 const hud=el('div','r104-hud');hud.id='r104Hud';hud.setAttribute('id','r104Hud');hud.dataset.show='false';
 const top=el('div','r104-top',hud);top.setAttribute('aria-hidden','true');
 const scoreBox=el('div','r104-score',top),scoreValue=el('span','r104-score-value',scoreBox);el('span','r104-score-unit',scoreBox).textContent='점';
 const streak=el('div','r104-streak',top);
 const dock=el('div','r104-dock',hud);dock.setAttribute('role','status');dock.setAttribute('aria-live','polite');dock.dataset.on='false';
 const face=el('span','r104-face',dock,FACE);face.setAttribute('aria-hidden','true');const dockText=el('p','r104-dock-text',dock);
 const gauge=el('div','r104-gauge',hud);gauge.setAttribute('aria-hidden','true');
 const cap=el('div','r104-gauge-cap',gauge),capLeft=el('span','r104-cap-left',cap),capRight=el('span','r104-cap-right',cap);
 const row=el('div','r104-gauge-row',gauge),track=el('div','r104-track',row),fill=el('div','r104-fill',el('div','r104-fill-clip',track)),notchBox=el('div','r104-notches',track),headRail=el('div','r104-head-rail',track);
 el('span','r104-head',headRail);el('span','r104-gate',row,GATE);
 ($('stage')||doc.body).appendChild(hud);
 const s={run:null,show:null,score:null,ratio:-1,left:null,right:null,notchKey:'',notches:[],heartsKey:'',hearts:[],speechKey:'',speechKind:'',dockOn:false,lastSpeechAt:-1e9,streak:-1,kind:'',statusKey:'',status:null,frameSpeech:null,frameRun:null};
 const reduced=()=>!!host?.settings?.()?.reduced;
 const pop=(n,frames,ms)=>{if(!reduced()&&typeof n.animate==='function')try{n.animate(frames,{duration:ms,easing:'cubic-bezier(.2,.9,.3,1.15)'})}catch(_){}};
 const set=(n,key,value)=>{if(n[key]!==value)n[key]=value};
 function setShow(on){if(s.show===on)return;s.show=on;hud.dataset.show=String(on);html.classList.toggle('r104-hud-on',on)}
 function status(run){if(!run.nativeRuntime||typeof run.status!=='function')return null;const key=run.updates+'|'+run.state;if(s.statusKey!==key||s.run!==run){s.statusKey=key;s.status=run.status()}return s.status}
 function update(){
  const run=host?.activeRun?.()||null,show=shouldShow(run,doc);
  setShow(show);if(!show)return;
  const red=String(reduced());if(hud.dataset.reduced!==red)hud.dataset.reduced=red;
  if(run!==s.run){s.run=run;s.score=null;s.ratio=-1;s.notchKey=null;s.speechKey='';s.streak=-1;s.frameSpeech=null}
  const m=model(run,root.MongyuOpening,status(run));
  if(s.kind!==m.kind){s.kind=m.kind;hud.dataset.kind=m.kind}
  if(m.score!==s.score){const up=s.score!==null&&m.score>s.score;s.score=m.score;set(scoreValue,'textContent',String(m.score));if(up)pop(scoreBox,[{transform:'scale(1)'},{transform:'scale(1.2)',offset:.3},{transform:'scale(1)'}],360)}
  if(m.streak!==s.streak){s.streak=m.streak;streak.textContent=m.streak>=2?'완벽 ×'+m.streak:'';streak.dataset.on=String(m.streak>=2);if(m.streak>=2)pop(streak,[{transform:'scale(.8)',opacity:.4},{transform:'scale(1)',opacity:1}],260)}
  const ratio=Math.round(m.ratio*1000)/1000;
  if(ratio!==s.ratio){s.ratio=ratio;const pct=(ratio*100).toFixed(1);fill.style.transform='translateX('+(ratio*100-100).toFixed(1)+'%)';headRail.style.transform='translateX('+pct+'%)'}
  if(m.left!==s.left){s.left=m.left;capLeft.textContent=m.left}
  if(m.right!==s.right){s.right=m.right;capRight.textContent=m.right}
  const notchKey=m.notches.map(n=>n.pos.toFixed(3)).join(',');
  if(notchKey!==s.notchKey){s.notchKey=notchKey;notchBox.replaceChildren();s.notches=m.notches.map(n=>{const d=el('span','r104-notch',notchBox);d.style.left=(n.pos*100).toFixed(2)+'%';d.dataset.lit='init';return d})}
  m.notches.forEach((n,i)=>{const d=s.notches[i];if(!d)return;const lit=String(n.lit);if(d.dataset.lit!==lit){const was=d.dataset.lit;d.dataset.lit=lit;if(lit==='true'&&was==='false')pop(d,[{transform:'translate(-50%,-50%) rotate(45deg) scale(1.9)'},{transform:'translate(-50%,-50%) rotate(45deg) scale(1)'}],420)}});
  const heartsKey=m.hearts?m.hearts.max:'';
  if(heartsKey!==s.heartsKey){s.heartsKey=heartsKey;capLeft.replaceChildren();s.left=null;s.hearts=[];if(m.hearts){capLeft.textContent='';s.left='';for(let i=0;i<m.hearts.max;i++)s.hearts.push(el('span','r104-heart',capLeft,HEART))}}
  if(m.hearts)s.hearts.forEach((h,i)=>{const on=String(i<m.hearts.now);if(h.dataset.on!==on){const was=h.dataset.on;h.dataset.on=on;if(was==='true'&&on==='false')pop(h,[{transform:'scale(1.5)'},{transform:'scale(1)'}],380)}});
  const dialogue=(s.frameRun===run&&s.frameSpeech)||visibleText($('runnerSpeech'));
  const guide=run.openingCourse?openingGuide(run):(visibleText($('runLesson'))||visibleText($('hudCue')));
  const speech=pickSpeech(run,dialogue,guide),now=num(root.performance?.now?.());
  if(speech){
   s.lastSpeechAt=now;const key=speech.kind+'|'+speech.text;
   if(key!==s.speechKey){const guide=speech.kind==='guide';if((s.speechKind==='guide')!==guide||!s.speechKind)face.innerHTML=guide?GUIDE:FACE;s.speechKey=key;s.speechKind=speech.kind;dock.dataset.kind=speech.kind;dock.dataset.source=speech.source;dockText.textContent=speech.text;
    if(s.dockOn)pop(dockText,[{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'none'}],220);
    if(speech.source==='coach')pop(face,[{transform:'scale(.8)'},{transform:'scale(1.14)',offset:.55},{transform:'scale(1)'}],320)}
   if(!s.dockOn){s.dockOn=true;dock.dataset.on='true'}
  }else if(s.dockOn&&now-s.lastSpeechAt>260){s.dockOn=false;s.speechKey='';dock.dataset.on='false'}
 }
 const off=root.MongyuPolish?.on?.('frame',d=>{s.frameRun=d?.run||null;s.frameSpeech=d?.speech?.text||null});
 let rafId=0;const raf=root.requestAnimationFrame?.bind(root);
 function loop(){rafId=raf(loop);try{update()}catch(error){root.console?.error?.('[MongyuPlayHud]',error)}}
 if(raf)rafId=raf(loop);
 return {element:hud,update,destroy(){if(rafId)root.cancelAnimationFrame?.(rafId);off?.();hud.remove();html.classList.remove('r104-hud-on')}};
}
let mounted=null;
function start(host){if(mounted||!enabled||!root.document)return mounted;mounted=mount(root.document,host);return mounted}
if(enabled&&root.MongyuPolish){if(root.MongyuPolish.host)start(root.MongyuPolish.host);else root.MongyuPolish.on('attach',start)}
const api=Object.freeze({enabled,model,openingModel,nativeModel,pickSpeech,shouldShow,openingGuide,mount,get mounted(){return mounted}});
root.MongyuPlayHud=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
