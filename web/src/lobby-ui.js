/* R105 lobby menu: the "달리기" call to action, a five-button dock, and the 다른 꿈 bottom sheet. Owned by workstream E2.
   The original title buttons stay in the DOM (hidden by CSS under html[data-ui-edition]); every new control calls the
   original element's own handler with the *real* (trusted) event, so audio unlock, focus rules and state sync all keep working.
   Active only when MONGYU_UI_EDITION===true. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const doc=root.document;
const L=(key,fallback)=>{try{const t=root.MongyuI18n?.t;if(typeof t==='function'){const v=t.call(root.MongyuI18n,key,fallback);if(typeof v==='string'&&v&&v!==key)return v}}catch(_){}return fallback};
const $=id=>doc?doc.getElementById(id):null;
const icons=()=>root.MongyuIcons;
function el(tag,attrs,parent,text){
 const n=doc.createElement(tag);
 if(attrs)for(const k of Object.keys(attrs)){const v=attrs[k];if(v===undefined||v===null||v===false)continue;n.setAttribute(k,v===true?'':v)}
 if(text!==undefined)n.textContent=text;
 if(parent)parent.appendChild(n);
 return n;
}
function svgInto(node,name,size){const I=icons();if(I&&node)node.innerHTML=I.svg(name,{size:size||24});return node}
const kit=()=>root.MongyuUiKit;

/* Call an original control's handler with the user's real event. App handlers are assigned as properties (button.onclick). */
function invoke(id,event){
 const n=$(id);if(!n||n.disabled)return false;
 try{
  if(typeof n.onclick==='function'){n.onclick(event);return true}
  n.click();return true;
 }catch(e){root.console?.error?.('[MongyuLobbyUi]',id,e);return false}
}

/* ---------- starting the dream road ---------- */
/* Contract with the road workstream: MongyuRoad.start(event) when it exists, otherwise a #roadOpen button, otherwise the old 꿈속으로. */
function roadEntry(){
 const R=root.MongyuRoad;
 if(R&&typeof R.start==='function')return 'api';
 if($('roadOpen'))return 'button';
 return 'continue';
}
function startRoad(event){
 const how=roadEntry();
 const go=()=>{
  if(how==='api')return root.MongyuRoad.start(event)!==false;
  if(how==='button')return invoke('roadOpen',event);
  return invoke('titleContinue',event);
 };
 return kit()?.transition?kit().transition(go):go();
}
function startMode(kind,event){
 const M=root.MongyuModes,ids={endless:'dreamEndlessOpen',daily:'dreamDailyOpen',illusion:'dreamIllusionOpen'};
 closeSheet(true);
 const go=()=>{if(M&&typeof M.startMode==='function'&&M.startMode(kind,event)!==false)return true;return invoke(ids[kind],event)};
 return kit()?.transition?kit().transition(go):go();
}

/* ---------- DOM ---------- */
let ui=null,sheetOpen=false,returnFocus=null,toastTimer=0;
const DOCK=[
 {id:'map',icon:'map',key:'lobby.map',label:'꿈 지도',target:'restorationOpen'},
 {id:'modes',icon:'moon',key:'lobby.modes',label:'다른 꿈'},
 {id:'wardrobe',icon:'wardrobe',key:'lobby.wardrobe',label:'옷장',target:'shopOpen'},
 {id:'story',icon:'story',key:'lobby.story',label:'이야기',target:'storyOpen'},
 {id:'isle',icon:'isle',key:'lobby.isle',label:'꿈의 섬',soon:true}
];
/* Each mode card carries its own small drawn vignette, so the three do not read as one repeated template. */
const ART={
 endless:'<svg viewBox="0 0 96 64" aria-hidden="true" focusable="false"><defs><linearGradient id="r105e" x1="0" x2="1"><stop offset="0" stop-color="#7ff3e1"/><stop offset="1" stop-color="#ff9ed8"/></linearGradient></defs><path d="M48 32C40 18 30 14 22 18c-9 5-9 23 0 28 8 4 18 0 26-14s18-18 26-14c9 5 9 23 0 28-8 4-18 0-26-14z" fill="none" stroke="url(#r105e)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="74" cy="32" r="3.2" fill="#fffaf0"/><circle cx="15" cy="11" r="1.4" fill="#dff2ff"/><circle cx="84" cy="52" r="1.6" fill="#dff2ff"/></svg>',
 daily:'<svg viewBox="0 0 96 64" aria-hidden="true" focusable="false"><path d="M8 52h80" stroke="#ffd98a" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/><path d="M48 8l6.4 14 15.2 1.8-11.3 10.4 3 15L48 41.6 34.7 49.2l3-15L26.4 23.8 41.6 22z" fill="#ffd98a" stroke="#ffeca5" stroke-width="3" stroke-linejoin="round"/><circle cx="16" cy="20" r="2" fill="#fffaf0"/><circle cx="82" cy="14" r="1.6" fill="#fffaf0"/></svg>',
 illusion:'<svg viewBox="0 0 96 64" aria-hidden="true" focusable="false"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="4"><path d="M18 56V34a30 30 0 0 1 60 0v22" stroke="#ff9ed8"/><path d="M30 56V36a18 18 0 0 1 36 0v20" stroke="#dff2ff"/><path d="M42 56V38a6 6 0 0 1 12 0v18" stroke="#7ff3e1"/></g><path d="M10 56h76" stroke="#dff2ff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/></svg>'
};
const MODES=[
 {kind:'endless',key:'mode.endless',label:'무한 꿈',noteKey:'mode.endlessNote',note:'끝없이 달려요'},
 {kind:'daily',key:'mode.daily',label:'오늘의 도전',noteKey:'mode.dailyNote',note:'하루에 한 번 열려요'},
 {kind:'illusion',key:'mode.illusion',label:'착시 정원',noteKey:'mode.illusionNote',note:'길이 뒤집혀요'}
];
function mount(){
 if(ui||!enabled||!doc?.body)return;
 const title=$('titleScreen');if(!title)return;
 ui={};
 const lobby=el('div',{id:'r105Lobby',class:'r105-lobby',role:'group','aria-label':L('lobby.menu','몽유 메뉴')},title);
 ui.lobby=lobby;
 // Main call to action.
 const run=el('button',{id:'r105Run',type:'button',class:'r105-cta'},lobby);
 const halo=el('span',{class:'r105-cta-halo','aria-hidden':'true'},run);
 const ico=el('span',{class:'r105-cta-ic','aria-hidden':'true'},run);svgInto(ico,'play',26);
 el('span',{class:'r105-cta-text'},run,L('lobby.run','달리기'));
 el('span',{class:'r105-cta-sheen','aria-hidden':'true'},run);
 run.onclick=e=>{startRoad(e)};
 ui.run=run;void halo;
 // Dock.
 const dock=el('nav',{id:'r105Dock',class:'r105-dock','aria-label':L('lobby.dock','메뉴')},lobby);
 ui.dock=dock;ui.dockBtn={};
 for(const d of DOCK){
  const b=el('button',{type:'button',class:'r105-dock-btn','data-dock':d.id,id:'r105Dock-'+d.id},dock);
  if(d.target)b.setAttribute('data-target',d.target);
  if(d.target==='restorationOpen'||d.target==='storyOpen'||d.target==='shopOpen'||d.id==='modes')b.setAttribute('aria-haspopup','dialog');
  const i=el('span',{class:'r105-dock-ic','aria-hidden':'true'},b);svgInto(i,d.icon,26);
  el('span',{class:'r105-dock-label'},b,L(d.key,d.label));
  if(d.soon){b.setAttribute('aria-disabled','true');b.setAttribute('data-soon','1');el('span',{class:'r105-soon','aria-hidden':'true'},b,L('lobby.soonBadge','곧'))}
  b.onclick=e=>onDock(d,b,e);
  ui.dockBtn[d.id]=b;
 }
 ui.toast=el('p',{id:'r105Toast',class:'r105-toast',role:'status','aria-live':'polite'},lobby);
 // Bottom sheet: 다른 꿈.
 const sheet=el('div',{id:'r105Modes',class:'r105-sheet',role:'dialog','aria-modal':'true','aria-labelledby':'r105ModesTitle',hidden:true},title);
 ui.sheet=sheet;
 const scrim=el('button',{type:'button',class:'r105-scrim','aria-label':L('common.close','닫기'),tabindex:'-1'},sheet);
 scrim.onclick=()=>closeSheet();
 const panel=el('div',{class:'r105-sheet-panel'},sheet);
 el('span',{class:'r105-grab','aria-hidden':'true'},panel);
 const head=el('header',{class:'r105-sheet-head'},panel);
 el('h2',{id:'r105ModesTitle'},head,L('lobby.modes','다른 꿈'));
 const close=el('button',{type:'button',class:'r105-icon-btn',id:'r105ModesClose','aria-label':L('common.close','닫기')},head);svgInto(close,'close',22);
 close.onclick=()=>closeSheet();
 const list=el('div',{class:'r105-cards'},panel);
 ui.cards={};
 for(const m of MODES){
  const card=el('button',{type:'button',class:'r105-card','data-mode':m.kind},list);
  const art=el('span',{class:'r105-card-art','aria-hidden':'true'},card);art.innerHTML=ART[m.kind];
  const txt=el('span',{class:'r105-card-text'},card);
  el('strong',{},txt,L(m.key,m.label));
  el('span',{class:'r105-card-note'},txt,L(m.noteKey,m.note));
  const go=el('span',{class:'r105-card-go','aria-hidden':'true'},card);svgInto(go,'chevron',22);
  card.onclick=e=>startMode(m.kind,e);
  ui.cards[m.kind]=card;
 }
 sheet.addEventListener('keydown',onSheetKey,true);
 // Keep dock availability and the entrance animation in sync with the original title screen.
 syncAvailability();
 if(typeof root.MutationObserver==='function'){
  const mo=new root.MutationObserver(syncAvailability);
  for(const id of ['restorationOpen','shopOpen','storyOpen'])if($(id))mo.observe($(id),{attributes:true,attributeFilter:['hidden','disabled','inert']});
  let was=title.hidden;
  new root.MutationObserver(()=>{if(title.hidden===was)return;was=title.hidden;if(!was){closeSheet(true);replay()}else closeSheet(true)}).observe(title,{attributes:true,attributeFilter:['hidden']});
 }
 // Escape also closes the sheet when focus is elsewhere.
 doc.addEventListener('keydown',e=>{if(sheetOpen&&e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSheet()}},true);
 replay();
}

function onDock(d,btn,event){
 if(d.soon){toast(L('lobby.soon','곧 열려요'));return}
 if(d.id==='modes'){openSheet(btn);return}
 if(d.target){
  const src=$(d.target);
  if(!src||src.hidden||src.disabled){toast(L('lobby.notYet','아직 열 수 없어요'));return}
  const open=()=>invoke(d.target,event);
  kit()?.sound?.('ui-open');
  open();
 }
}

/* ---------- 다른 꿈 sheet ---------- */
function openSheet(trigger){
 if(!ui||sheetOpen)return;
 sheetOpen=true;returnFocus=trigger||doc.activeElement;
 ui.sheet.hidden=false;ui.sheet.classList.remove('closing');
 doc.documentElement.classList.add('r105-sheet-open');
 ui.lobby.setAttribute('aria-hidden','true');ui.lobby.inert=true;
 kit()?.sound?.('ui-open');
 const cards=ui.sheet.querySelector('.r105-cards');if(cards)kit()?.stagger?.(cards,{start:1});
 const first=ui.cards.endless;root.setTimeout?.(()=>first?.focus?.({preventScroll:true}),30);
}
function closeSheet(immediate){
 if(!ui||!sheetOpen)return;
 sheetOpen=false;
 doc.documentElement.classList.remove('r105-sheet-open');
 ui.lobby.removeAttribute('aria-hidden');ui.lobby.inert=false;
 const done=()=>{ui.sheet.hidden=true;ui.sheet.classList.remove('closing')};
 if(immediate===true||kit()?.reduced?.()){done()}else{ui.sheet.classList.add('closing');root.setTimeout?.(()=>{if(!sheetOpen)done()},180)}
 if(immediate!==true)kit()?.sound?.('ui-close');
 const back=returnFocus;returnFocus=null;
 if(immediate!==true&&back&&typeof back.focus==='function')root.setTimeout?.(()=>{try{back.focus({preventScroll:true})}catch(_){}},0);
}
function onSheetKey(e){
 if(e.key!=='Tab')return;
 const nodes=[...ui.sheet.querySelectorAll('button:not([tabindex="-1"])')].filter(n=>!n.disabled);
 if(!nodes.length)return;
 const i=nodes.indexOf(doc.activeElement);e.preventDefault();
 nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();
}

/* ---------- small things ---------- */
function toast(text){
 if(!ui?.toast)return;
 ui.toast.textContent=text;ui.toast.classList.remove('show');void ui.toast.offsetWidth;ui.toast.classList.add('show');
 root.clearTimeout?.(toastTimer);toastTimer=root.setTimeout?.(()=>ui.toast.classList.remove('show'),1800);
}
function syncAvailability(){
 if(!ui)return;
 for(const d of DOCK){
  if(!d.target)continue;
  const src=$(d.target),b=ui.dockBtn[d.id];
  b.toggleAttribute('data-off',!src||src.disabled===true);
 }
}
function replay(){
 if(!ui||!kit()?.stagger)return;
 const items=[ui.run,ui.dock];
 for(const n of items)n.classList.remove('r105-in');
 void ui.lobby.offsetWidth;
 kit().stagger(ui.lobby,{selector:':scope > .r105-cta, :scope > .r105-dock'});
 const btns=[...ui.dock.children];btns.forEach((b,i)=>{b.classList.add('r105-in');b.style.setProperty('--i',String(i+2))});
}

function boot(){
 if(!enabled||!doc)return;
 const go=()=>{try{mount()}catch(e){root.console?.error?.('[MongyuLobbyUi]',e)}};
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>root.setTimeout?.(go,0));else root.setTimeout?.(go,0);
}
boot();
const api=Object.freeze({enabled,mount,startRoad,startMode,openSheet,closeSheet,roadEntry,toast,invoke,
 get sheetOpen(){return sheetOpen},get ui(){return ui}});
root.MongyuLobbyUi=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
