/* R105 design system: tokens, press feedback, menu sounds, staggered entrance, aurora-gate transition,
   and the settings / pause re-skin. Owned by workstream E2.
   Everything is additive: the original buttons stay the real controls (their handlers, ids, aria-pressed and focus
   order are untouched); this module only labels them, groups them into sections and lets CSS draw switches/sliders.
   Active only when MONGYU_UI_EDITION===true. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const doc=root.document;
const TOKENS=Object.freeze({
 night0:'#1b1530',night1:'#2a2146',night2:'#3a2c5c',gold:'#ffd98a',goldHi:'#ffeca5',goldEdge:'#b97d2e',ice:'#dff2ff',pink:'#ff9ed8',coral:'#ff8a73',aurora:'#7ff3e1',
 radiusM:16,radiusL:24,unit:8,pressMs:80,staggerMs:40,gateMs:400,tapTarget:44,
 font:'system-ui,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif'
});
/* Tiny i18n bridge: MongyuI18n.t(key,fallback) when the localization module is present, Korean fallback otherwise. */
function L(key,fallback){
 try{const t=root.MongyuI18n?.t;if(typeof t==='function'){const v=t.call(root.MongyuI18n,key,fallback);if(typeof v==='string'&&v&&v!==key)return v}}catch(_){}
 return fallback;
}
const $=id=>doc?doc.getElementById(id):null;
function el(tag,attrs,parent){
 const n=doc.createElement(tag);
 if(attrs)for(const k of Object.keys(attrs)){const v=attrs[k];if(v===undefined||v===null||v===false)continue;if(k==='class')n.className=v;else if(k==='text')n.textContent=v;else if(k==='html')n.innerHTML=v;else n.setAttribute(k,v===true?'':v)}
 if(parent)parent.appendChild(n);
 return n;
}
function settings(){try{return root.MongyuPolish?.host?.settings?.()||{}}catch(_){return {}}}
function reduced(){
 try{if(settings().reduced===true)return true}catch(_){}
 try{return !!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches}catch(_){return false}
}

/* ---------- menu sounds + haptics ---------- */
/* The run's own audio graph is gated to gameplay, so menus get a dedicated, lazily created context. It obeys
   the same mute and effects-volume settings, and plays nothing before the first user gesture. */
let actx=null,lastSound=0,gestured=false;
const buffers=new Map();
function sound(kind){
 if(!enabled||!gestured)return false;
 const s=settings();if(s.mute===true||s.sfxVolume===0)return false;
 const now=root.performance?.now?.()??Date.now();if(now-lastSound<45)return false;lastSound=now;
 try{
  const Ctx=root.AudioContext||root.webkitAudioContext,S=root.MongyuSFX;if(!Ctx||!S?.renderUi)return false;
  if(!actx)actx=new Ctx();
  if(actx.state==='suspended')actx.resume?.();
  let buf=buffers.get(kind);
  if(!buf){const rate=actx.sampleRate||48000,data=S.renderUi(kind,rate);buf=actx.createBuffer(1,data.length,rate);if(buf.copyToChannel)buf.copyToChannel(data,0);else buf.getChannelData(0).set(data);buffers.set(kind,buf)}
  const src=actx.createBufferSource(),gain=actx.createGain();
  src.buffer=buf;gain.gain.value=Math.max(0,Math.min(1,Number.isFinite(s.sfxVolume)?s.sfxVolume:1))*1.6;
  src.connect(gain);gain.connect(actx.destination);src.start();return true;
 }catch(_){return false}
}
function vibrate(ms){
 /* R105 ACC: the haptics channel of MongyuEffects replaces the old blanket 'reduced = no vibration'. */
 try{const s=settings(),E=root.MongyuEffects,k=E&&E.enabled?E.value('haptics'):(s.reduced===true?0:1);if(k<=0||s.vibration===false)return false;const d=Number.isFinite(ms)?ms:6;return !!root.navigator?.vibrate?.(Math.max(4,Math.round(d*(.4+.6*k))))}catch(_){return false}
}
const PRESS='.r105-lobby button,.r105-sheet button,#settings button,#pauseSheet button,#options,.r105-press';
function onPointerDown(e){
 gestured=true;
 const t=e.target?.closest?.(PRESS);
 if(!t||t.disabled||t.getAttribute('aria-disabled')==='true')return;
 sound('ui-tap');vibrate(6);
}

/* ---------- staggered entrance ---------- */
function stagger(container,opts){
 if(!container)return 0;
 const o=opts||{},step=Number.isFinite(o.step)?o.step:TOKENS.staggerMs,items=o.selector?[...container.querySelectorAll(o.selector)]:[...container.children];
 let i=o.start||0;
 for(const n of items){n.classList.add('r105-in');n.style.setProperty('--i',String(i++));n.style.setProperty('--r105-step',step+'ms')}
 return items.length;
}

/* ---------- aurora-gate transition ---------- */
let gate=null;
function transition(fn,opts){
 const o=opts||{},gk=fxGate(),soft=o.reduced===undefined?(reduced()||gk<1):!!o.reduced;
 let result;
 try{result=typeof fn==='function'?fn():undefined}finally{
  if(doc?.body&&enabled)playGate(soft);
 }
 return result;
}
/* R105 ACC: gate intensity 0..1 (Standard 1, Reduced a short soft fade, Minimal none). */
function fxGate(){try{const E=root.MongyuEffects;return E&&E.enabled?E.value('gate'):1}catch(_){return 1}}
function playGate(soft){
 if(gate){gate.remove();gate=null}
 if(fxGate()<=0)return null;
 const g=el('div',{class:'r105-gate'+(soft?' soft':''),'aria-hidden':'true'},doc.body),L1=el('i',{class:'l'},g),R1=el('i',{class:'r'},g),seam=el('b',null,g);
 gate=g;
 const done=()=>{if(gate===g){g.remove();gate=null}else g.remove()};
 const ms=soft?120:TOKENS.gateMs;
 if(typeof g.animate!=='function'){root.setTimeout?.(done,ms+30);return g}
 const ease=soft?'linear':'cubic-bezier(.7,0,.2,1)';
 if(soft){const a=g.animate([{opacity:.85*Math.max(.3,fxGate())},{opacity:0}],{duration:ms,easing:ease,fill:'forwards'});a.onfinish=done;return g}
 L1.animate([{transform:'translateX(0)'},{transform:'translateX(-101%)'}],{duration:ms,easing:ease,fill:'forwards'});
 R1.animate([{transform:'translateX(0)'},{transform:'translateX(101%)'}],{duration:ms,easing:ease,fill:'forwards'});
 const a=seam.animate([{opacity:1,transform:'scaleX(1)'},{opacity:.9,transform:'scaleX(5)',offset:.55},{opacity:0,transform:'scaleX(9)'}],{duration:ms,easing:'ease-out',fill:'forwards'});
 a.onfinish=done;
 return g;
}

/* ---------- icons as CSS masks ---------- */
let iconStyle=null;
function injectIconCss(){
 const I=root.MongyuIcons;if(!doc||!I||iconStyle)return;
 let css='html[data-ui-edition]{--r105-chev:url("'+I.uri('chevron-down')+'")}'+String.fromCharCode(10);for(const n of I.names)css+='[data-r105-icon="'+n+'"]{--r105-ic:url("'+I.uri(n)+'")}\n';
 iconStyle=el('style',{id:'r105IconMasks'},doc.head||doc.documentElement);iconStyle.textContent=css;
}
function icon(node,name,label){if(!node)return;if(name)node.setAttribute('data-r105-icon',name);if(label!==undefined){node.setAttribute('data-r105-label',label)}}

/* ---------- settings: sections, switches, sliders ---------- */
/* Rows: [icon][label + sub] with the ORIGINAL button stretched invisibly over the whole row. The app keeps rewriting that
   button's text ("색약 모드 · 꺼짐"), so nothing is injected inside it: CSS hides its text and draws the switch / value
   from aria-pressed and data attributes that a MutationObserver copies over. */
const SWITCH={ /* id -> label, sub, icon pair [off,on], invert (aria-pressed means "off") */
 mute:{label:['settings.soundOn','소리 켜기'],sub:['settings.soundOnSub','음악과 효과음 모두'],icons:['sound-off','sound'],invert:true},
 motion:{label:['settings.reduceMotion','움직임 줄이기'],sub:['settings.reduceMotionSub','회전과 흔들림을 줄여요'],icons:['sparkle','sparkle']},
 cvdMode:{label:['settings.cvd','색약 모드'],sub:['settings.cvdSub','위험과 목적지 색을 바꿔요'],icons:['accessibility','accessibility']},
 captureMode:{label:['settings.capture','골인 영상 기록'],sub:['settings.captureSub','골인 순간을 영상으로 남겨요'],icons:['video','video']},
 restorationRunVibration:{label:['settings.runFlash','화면 반짝임'],sub:['settings.runFlashSub','이번 달리기에만 적용돼요'],icons:['vibration','vibration']}
};
const CYCLE={
 dreamIntensity:{label:['settings.intensity','꿈의 강도'],sub:['settings.intensitySub','화면 연출의 세기'],icon:'moon'},
 restorationRunSpeed:{label:['settings.runSpeed','속도'],sub:['settings.runSpeedSub','이번 달리기에만 적용돼요'],icon:'play'}
};
function valueOf(btn){const t=(btn.textContent||'').trim(),i=t.lastIndexOf('·');return i>=0?t.slice(i+1).trim():''}
function syncControl(btn){
 if(!btn||btn.nodeType!==1)return;
 const id=btn.id,sw=SWITCH[id],cy=CYCLE[id],row=btn.parentNode;
 if(sw){
  const pressed=btn.getAttribute('aria-pressed')==='true',on=sw.invert?!pressed:pressed;
  btn.setAttribute('data-r105-on',on?'1':'0');
  const ic=row?.querySelector?.('.r105-row-ic'),I=root.MongyuIcons,name=sw.icons[on?1:0];
  if(ic&&I&&ic.getAttribute('data-n')!==name){ic.setAttribute('data-n',name);ic.innerHTML=I.svg(name,{size:22})}
  if(row?.classList)row.classList.toggle('is-off',!on);
 }else if(cy){
  const v=valueOf(btn);btn.setAttribute('data-r105-value',v);
  const steps={'고요':0,'균형':1,'강렬':2,'느리게':0,'기본':1,'빠르게':2};
  if(v in steps)btn.setAttribute('data-r105-step',String(steps[v]));
 }
 if(row?.classList?.contains('r105-row')){if(btn.hidden===true)row.setAttribute('hidden','');else row.removeAttribute('hidden')}
}
function syncSlider(input){
 if(!input)return;
 const min=Number(input.min||0),max=Number(input.max||100),v=Number(input.value),p=max>min?Math.max(0,Math.min(100,(v-min)/(max-min)*100)):0;
 input.style.setProperty('--r105-fill',p.toFixed(1)+'%');
}
function watch(node,fn,filter,deep){
 if(!node||typeof root.MutationObserver!=='function')return;
 const mo=new root.MutationObserver(()=>fn(node));
 mo.observe(node,{attributes:true,attributeFilter:filter||['aria-pressed','disabled','hidden'],characterData:!!deep,childList:!!deep,subtree:!!deep});
}
function rowFor(btn,kind,iconName,label,sub){
 const I=root.MongyuIcons,r=el('div',{class:'r105-row','data-kind':kind});
 btn.parentNode.insertBefore(r,btn);
 const ic=el('span',{class:'r105-row-ic','aria-hidden':'true'},r);if(I&&iconName){ic.setAttribute('data-n',iconName);ic.innerHTML=I.svg(iconName,{size:22})}
 const tx=el('span',{class:'r105-row-text','aria-hidden':'true'},r);el('b',{text:label},tx);if(sub)el('i',{text:sub},tx);
 r.appendChild(btn);btn.setAttribute('data-r105-row',kind);
 return r;
}
let settingsDone=false;
function skinSettings(){
 if(!doc||settingsDone)return settingsDone;
 const panel=$('settings'),box=panel?.querySelector('.box'),mute=$('mute'),music=$('musicVolume'),sfx=$('sfxVolume');
 if(!box||!mute||!music||!sfx||!$('cvdMode'))return false;
 settingsDone=true;panel.setAttribute('data-r105','settings');
 const I=root.MongyuIcons;
 // Header.
 const title=$('settingsTitle'),close=$('close');
 const head=el('header',{class:'r105-head'});box.insertBefore(head,box.firstElementChild);
 if(title){title.setAttribute('data-r105-label',L('settings.title','설정'));head.appendChild(title)}
 if(close){close.innerHTML='';if(I)close.innerHTML=I.svg('close',{size:22});close.setAttribute('aria-label',L('common.close','닫기'));close.setAttribute('data-r105-close','1');head.appendChild(close)}
 const sectionHead=(s,id,ic,text)=>{
  const h=el('h2',{id:'r105sec-'+id});s.insertBefore(h,s.firstChild);
  const i=el('span',{class:'r105-sec-ic','aria-hidden':'true'},h);if(I)i.innerHTML=I.svg(ic,{size:18});el('span',{text:text},h);
  s.setAttribute('aria-labelledby','r105sec-'+id);
 };
 const section=(id,ic,text,nodes)=>{
  const s=el('section',{class:'r105-sec','data-sec':id});
  sectionHead(s,id,ic,text);
  for(const n of nodes)if(n)s.appendChild(n);
  return s;
 };
 // Switch rows.
 const rows={};
 for(const id of Object.keys(SWITCH)){const b=$(id);if(!b)continue;const d=SWITCH[id];rows[id]=rowFor(b,'switch',d.icons[0],L(d.label[0],d.label[1]),L(d.sub[0],d.sub[1]));syncControl(b);watch(b,syncControl,['aria-pressed','disabled','hidden'],true)}
 for(const id of Object.keys(CYCLE)){const b=$(id);if(!b)continue;const d=CYCLE[id];rows[id]=rowFor(b,'cycle',d.icon,L(d.label[0],d.label[1]),L(d.sub[0],d.sub[1]));syncControl(b);watch(b,syncControl,['aria-pressed','disabled','hidden'],true)}
 // Sliders: label + live value on one line, then the track.
 const slider=(input,key,fallback,iconName)=>{
  const lab=box.querySelector('label[for="'+input.id+'"]'),r=el('div',{class:'r105-row r105-slider','data-kind':'slider'});
  const anchor=lab||input;anchor.parentNode.insertBefore(r,anchor);
  const top=el('div',{class:'r105-slider-top'},r),ic=el('span',{class:'r105-row-ic','aria-hidden':'true'},top);if(I)ic.innerHTML=I.svg(iconName,{size:22});
  if(lab){const t=[...lab.childNodes].find(n=>n.nodeType===3);if(t)t.nodeValue=L(key,fallback);top.appendChild(lab)}
  r.appendChild(input);return r;
 };
 const mRow=slider(music,'settings.music','음악','music'),sRow=slider(sfx,'settings.sfx','효과음','sparkle');
 // Sections.
 const soundSec=section('sound','sound',L('settings.secSound','소리'),[rows.mute,mRow,sRow,$('trialAudioNotice')]);
 const screenSec=section('screen','moon',L('settings.secScreen','화면'),[rows.dreamIntensity,rows.captureMode]);
 const accessSec=section('access','accessibility',L('settings.secAccess','접근성'),[rows.cvdMode,rows.motion]);
 const toggle=$('musicCreditsToggle'),credits=$('musicCredits'),playing=$('musicPlayback');
 if(toggle){toggle.setAttribute('data-r105-row','fold');toggle.setAttribute('data-r105-label',L('settings.credits','음악 출처와 이용 조건'))}
 const infoSec=section('info','info',L('settings.secInfo','정보'),[toggle,playing,credits]);
 const actions=el('div',{class:'r105-actions'});
 const labels={settingsHome:L('common.home','처음으로'),settingsModes:L('lobby.modes','다른 꿈'),settingsSkip:L('settings.skip','연습 건너뛰기')};
 for(const id of ['settingsModes','settingsSkip','settingsHome']){const b=$(id);if(b){b.setAttribute('data-r105-label',labels[id]);b.setAttribute('data-r105-act',id);icon(b,({settingsHome:'door',settingsModes:'moon',settingsSkip:'play'})[id]);actions.appendChild(b)}}
 const frag=doc.createDocumentFragment();
 // The per-run group is the app's own element (it toggles .hidden); skin it in place and lift it to the top.
 const run=$('restorationRunSettings');
 if(run){run.classList.add('r105-sec');run.setAttribute('data-sec','run');sectionHead(run,'run','play',L('settings.thisRun','이번 달리기'));
  for(const id of ['restorationRunSpeed','restorationRunVibration']){if(rows[id])run.appendChild(rows[id])}
  const note=$('restorationRunSettingNotice');if(note){note.classList.add('r105-note');run.appendChild(note)}frag.appendChild(run)}
 for(const n of [soundSec,screenSec,accessSec,infoSec,actions])frag.appendChild(n);
 box.insertBefore(frag,head.nextSibling);
 try{root.MongyuEffects?.mountSettings?.(box)}catch(e){root.console?.error?.('[MongyuEffects]',e)}   // R105 ACC: the effects-strength section
 for(const input of [music,sfx]){
  syncSlider(input);
  input.addEventListener('input',()=>syncSlider(input));
  watch(input,syncSlider,['aria-valuetext','disabled','value']);
 }
 // Anything the app rewrites while the dialog is closed gets re-read the moment it opens.
 const refresh=()=>{syncSlider(music);syncSlider(sfx);for(const id of [...Object.keys(SWITCH),...Object.keys(CYCLE)])syncControl($(id))};
 new root.MutationObserver(()=>{if(!panel.hidden)refresh()}).observe(panel,{attributes:true,attributeFilter:['hidden']});
 refresh();
 return true;
}

/* ---------- pause sheet ---------- */
const PAUSE={
 resumePlay:['play','pause.resume','계속 달리기'],retryPlay:['retry','pause.retry','다시 달리기'],pauseRestoration:['map','pause.map','꿈 지도'],
 pauseStory:['story','pause.story','이야기'],pauseModes:['moon','pause.modes','다른 꿈'],pauseOptions:['settings','pause.settings','설정'],pauseHome:['door','common.home','처음으로']
};
let pauseDone=false;
function skinPause(){
 if(!doc||pauseDone)return pauseDone;
 const sheet=$('pauseSheet');if(!sheet||!$('resumePlay'))return false;
 pauseDone=true;sheet.setAttribute('data-r105','pause');
 for(const id of Object.keys(PAUSE)){const b=$(id);if(!b)continue;const [ic,key,fb]=PAUSE[id],text=L(key,fb);icon(b,ic,text);b.setAttribute('aria-label',text)}
 const t=$('pauseTitle');if(t)t.textContent=L('pause.title','잠깐 멈춤');
 const acts=sheet.querySelector('.pause-actions');if(acts)stagger(acts,{selector:':scope > button'});
 return true;
}

/* ---------- open / close sounds for dialogs ---------- */
const DIALOGS=['settings','pauseSheet','wardrobePanel','storyJournal','restorationCollection'];
function watchDialogs(){
 if(typeof root.MutationObserver!=='function')return;
 for(const id of DIALOGS){
  const node=$(id);if(!node)continue;
  let was=node.hidden;
  new root.MutationObserver(()=>{const now=node.hidden;if(now===was)return;was=now;if(!gestured)return;sound(now?'ui-close':'ui-open')}).observe(node,{attributes:true,attributeFilter:['hidden']});
 }
}

/* ---------- boot ---------- */
let booted=false;
function init(){
 if(!enabled||!doc||booted&&settingsDone&&pauseDone)return;
 if(!booted){
  booted=true;injectIconCss();
  doc.addEventListener('pointerdown',onPointerDown,true);
  doc.addEventListener('keydown',()=>{gestured=true},true);
  const opt=$('options');if(opt&&root.MongyuIcons){opt.innerHTML=root.MongyuIcons.svg('settings',{size:24});opt.setAttribute('data-r105','options')}
  watchDialogs();
 }
 skinSettings();skinPause();
 if(!(settingsDone&&pauseDone)&&retries++<40)root.setTimeout?.(init,100);
}
let retries=0;
function boot(){
 if(!enabled||!doc)return;
 const bus=root.MongyuPolish;
 const go=()=>{try{init()}catch(e){root.console?.error?.('[MongyuUiKit]',e)}};
 if(bus){bus.on?.('attach',go);if(bus.host)go()}
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>root.setTimeout?.(go,0));else root.setTimeout?.(go,0);
}
boot();
const api=Object.freeze({enabled,tokens:TOKENS,L,el,icon,sound,vibrate,stagger,transition,reduced,init,skinSettings,skinPause,syncControl,syncSlider,
 get gated(){return gestured}});
root.MongyuUiKit=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
