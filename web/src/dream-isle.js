/* R105 꿈의 섬 (Dream Isle): the collection screen opened from the lobby dock. Owned by workstream GAL.
   A 기억판 (memory board) with one floating square per course of every chapter (read from MongyuCourse.CHAPTERS at open time, so new chapters appear by themselves).
   A slot shows a slice of the chapter backdrop, the stars earned, the memory star when found, and replays the course on a second tap; locked slots say why in one line.
   A plain list view of the same data is always one switch away (blueprint 25: no forced decorative navigation). Reads mongyu.r105.road through MongyuRoad; writes nothing.
   Pure data: buildModel(). DOM: open()/close()/render(). Active only when MONGYU_UI_EDITION===true. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const doc=root.document;
const VIEW_KEY='mongyu.r105.isleView';
const fmt=n=>Math.max(0,Math.floor(n||0)).toLocaleString('ko-KR');
const bits=g=>[!!(g&1),!!(g&2),!!(g&4)];
const fmtTime=s=>{s=Math.max(0,Math.round(Number(s)||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const artSrc=id=>{try{return root.MONGYU_EMBEDDED_ART?.[id]?.src||null}catch(_){return null}};
const icon=(name,size)=>{try{return root.MongyuIcons?.svg?.(name,{size:size||22})||''}catch(_){return ''}};

/* ---------- data model (pure) ---------- */
/* chapters: [{id,number,title,trip,courses:[{id,title,subtitle}]}], data: the road record {courses:{id:{g,stars,best,clears,plays,bestTime,memoryStars}}},
   unlocked(flatIndex)->bool (defaults to the road rule: the course before it has a star). Returns chapters with slots, totals and the next course to play. */
function buildModel(chapters,data,unlocked){
 const courses=(data&&data.courses&&typeof data.courses==='object')?data.courses:{};
 const rec=id=>{const c=courses[id];return c&&typeof c==='object'?c:{}};
 const flat=chapters.flatMap(ch=>ch.courses);
 const open=typeof unlocked==='function'?unlocked:i=>i<=0||(rec(flat[i-1].id).stars|0)>=1;
 let index=0,stars=0,memory=0,cleared=0,next=null;
 const out=chapters.map(ch=>{
  const slots=ch.courses.map((course,k)=>{
   const i=index++,e=rec(course.id),g=e.g|0,s=Math.max(0,Math.min(3,e.stars|0)),isOpen=!!open(i);
   const state=!isOpen?'locked':s>0?'cleared':'open';
   const prev=i>0?flat[i-1]:null;
   const slot={id:course.id,index:i,chapter:ch.number,pos:k,title:course.title,subtitle:course.subtitle||'',state,stars:s,goals:bits(g),
    memory:(e.memoryStars|0)>0,best:s>0?(e.best|0):0,bestTime:s>0&&e.bestTime>0?Number(e.bestTime):0,clears:e.clears|0,plays:e.plays|0,
    reason:state==='locked'&&prev?{prev:prev.title,id:prev.id}:null};
   stars+=s;if(slot.memory)memory++;if(s>0)cleared++;
   if(!next&&state==='open')next=course.id;
   return slot;
  });
  return {id:ch.id,number:ch.number,title:ch.title,trip:ch.trip||null,slots,
   stars:slots.reduce((a,x)=>a+x.stars,0),maxStars:slots.length*3,memory:slots.filter(x=>x.memory).length,count:slots.length,
   open:slots.some(x=>x.state!=='locked')};
 });
 return {chapters:out,stars,maxStars:flat.length*3,memory,memoryMax:flat.length,cleared,total:flat.length,next};
}
/* The line a locked slot shows (system voice, one short line). */
const reasonText=slot=>slot.reason?'‘'+slot.reason.prev+'’ 완주가 필요해요':'';
/* Everything one slot says to a screen reader, joined with ' · ' (the English translator splits on that separator). */
function describe(slot){
 const p=[slot.title];
 if(slot.state==='locked')p.push('잠김',reasonText(slot));
 else{p.push('별 '+slot.stars+' / 3');p.push(slot.memory?'기억의 별 찾음':'기억의 별 아직');if(slot.best>0)p.push('최고 '+fmt(slot.best)+'점');if(slot.bestTime>0)p.push('가장 빠른 길 '+fmtTime(slot.bestTime))}
 return p.join(' · ');
}

/* ---------- view state ---------- */
let ui=null,model=null,selected=null,mode='isle',returnFocus=null,openFlag=false,offLang=null;
const R=()=>root.MongyuRoad;
const hostApi=()=>root.MongyuPolish?.host||null;
const reduced=()=>{try{if(hostApi()?.settings?.()?.reduced===true)return true}catch(_){}try{return !!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches}catch(_){return false}};
function readMode(){try{const v=root.localStorage?.getItem(VIEW_KEY);return v==='list'?'list':'isle'}catch(_){return 'isle'}}
function saveMode(v){try{root.localStorage?.setItem(VIEW_KEY,v)}catch(_){}}
function currentModel(){
 const road=R(),ch=road?.chapters?.()||root.MongyuCourse?.CHAPTERS||[],d=road?.read?.()||{courses:{}};
 const unlocked=road?.unlocked?i=>road.unlocked(i,d):undefined;
 return buildModel(ch,d,unlocked);
}

/* ---------- DOM ---------- */
function el(tag,attrs,parent,text){
 const n=doc.createElement(tag);
 if(attrs)for(const k of Object.keys(attrs)){const v=attrs[k];if(v===undefined||v===null||v===false)continue;if(k==='class')n.className=v;else n.setAttribute(k,v===true?'':v)}
 if(text!==undefined)n.textContent=text;if(parent)parent.appendChild(n);return n;
}
const setVar=(node,name,v)=>{const st=node.style;if(st.setProperty)st.setProperty(name,v);else st[name]=v};
function mount(){
 if(ui||!doc?.body)return;
 ui={};const stage=doc.getElementById('stage')||doc.body;
 const screen=el('section',{id:'isleScreen',class:'r105-isle',role:'dialog','aria-modal':'true','aria-labelledby':'isleHeading',hidden:true},stage);
 ui.screen=screen;
 const sky=el('div',{class:'isle-sky','aria-hidden':'true'},screen);for(let i=0;i<14;i++){const m=el('i',{class:'isle-mote'},sky);setVar(m,'--x',((i*37)%100)+'%');setVar(m,'--y',((i*53+11)%100)+'%');setVar(m,'--d',(i*.7).toFixed(1)+'s')}
 const head=el('header',{class:'isle-head'},screen);
 ui.back=el('button',{type:'button',class:'isle-back',id:'isleBack','aria-label':'처음으로'},head);ui.back.innerHTML=icon('back',24)||'‹';
 const titles=el('div',{class:'isle-titles'},head);
 el('p',{class:'isle-kicker'},titles,'기억판');
 el('h1',{id:'isleHeading'},titles,'꿈의 섬');
 ui.summary=el('p',{class:'isle-summary',id:'isleSummary'},titles);
 const tools=el('div',{class:'isle-tools'},screen);
 const seg=el('div',{class:'isle-seg',role:'group','aria-label':'보기 방식'},tools);
 ui.bIsle=el('button',{type:'button','data-view':'isle',id:'isleViewIsle'},seg,'섬');
 ui.bList=el('button',{type:'button','data-view':'list',id:'isleViewList'},seg,'목록');
 ui.wardrobe=el('button',{type:'button',class:'isle-wardrobe',id:'isleWardrobe'},tools);ui.wardrobe.innerHTML=icon('wardrobe',20);el('span',{},ui.wardrobe,'옷장');
 ui.scroll=el('div',{class:'isle-scroll',id:'isleScroll'},screen);
 ui.board=el('div',{class:'isle-board',id:'isleBoard'},ui.scroll);
 ui.list=el('div',{class:'isle-list',id:'isleList',hidden:true},ui.scroll);
 // Info panel under the board: what the selected square holds, and the one button.
 const info=el('aside',{class:'isle-info',id:'isleInfo','aria-live':'polite'},screen);ui.info=info;
 ui.infoThumb=el('span',{class:'isle-info-thumb','aria-hidden':'true'},info);
 const body=el('div',{class:'isle-info-body'},info);
 ui.infoTitle=el('strong',{class:'isle-info-title'},body);
 ui.infoStars=el('span',{class:'isle-pips',role:'img'},body);
 ui.infoLine=el('span',{class:'isle-info-line'},body);
 ui.play=el('button',{type:'button',class:'isle-play',id:'islePlay'},info);
 // wiring
 ui.back.onclick=()=>close();
 ui.bIsle.onclick=()=>setMode('isle');ui.bList.onclick=()=>setMode('list');
 ui.wardrobe.onclick=e=>toWardrobe(e);
 screen.addEventListener('keydown',onKey);
}
function pips(host,goals,label){
 host.replaceChildren();host.setAttribute('aria-label',label);
 for(const on of goals){const s=el('i',{class:'isle-pip','data-on':String(on),'aria-hidden':'true'},host);s.innerHTML=icon('star',14)||'★'}
}
function setMode(m,focus){
 mode=m==='list'?'list':'isle';saveMode(mode);
 if(!ui)return;
 ui.board.hidden=mode!=='isle';ui.list.hidden=mode!=='list';ui.info.hidden=mode!=='isle';
 ui.screen.dataset.view=mode;
 for(const b of [ui.bIsle,ui.bList])b.setAttribute('aria-pressed',String(b.dataset.view===mode));
 if(focus)try{(mode==='isle'?ui.bIsle:ui.bList).focus({preventScroll:true})}catch(_){}
}
function lookAt(chap){
 const P=root.MongyuTrip?.get?.(chap.trip||'violet');
 return {rim:P?.rim||'#a95bdc',rim2:P?.rim2||'#7a6bff',glow:P?.glow||'#c58cf0'};
}
function render(){
 if(!ui)return;
 model=currentModel();
 const m=model;
 ui.summary.textContent='별 '+m.stars+' / '+m.maxStars+'  ·  기억의 별 '+m.memory+' / '+m.memoryMax;
 ui.screen.dataset.reduced=String(reduced());
 ui.board.replaceChildren();ui.list.replaceChildren();
 const bg=artSrc('lobby-trip')||artSrc('lobby-psy');if(bg)setVar(ui.screen,'--isle-bg','url('+bg+')');
 const star=artSrc('item-star');
 m.chapters.forEach((chap,ci)=>{
  const look=lookAt(chap),art=artSrc('chapter-'+chap.number)||artSrc('lobby-trip')||artSrc('lobby-psy');
  // --- board: one floating isle per chapter ---
  const isle=el('section',{class:'isle-ch','data-open':String(chap.open),'data-chapter':String(chap.number)},ui.board);
  setVar(isle,'--rim',look.rim);setVar(isle,'--rim2',look.rim2);setVar(isle,'--glow',look.glow);if(art)setVar(isle,'--ch-art','url('+art+')');
  const h=el('header',{class:'isle-ch-head'},isle);
  el('span',{class:'isle-ch-disc','aria-hidden':'true'},h);
  const t=el('h2',{},h);el('span',{class:'isle-ch-num'},t,chap.number+'장');el('span',{class:'isle-ch-name'},t,chap.title);
  const tot=el('span',{class:'isle-ch-total'},h);
  el('span',{},tot,'별 '+chap.stars+' / '+chap.maxStars);
  const ol=el('ol',{class:'isle-slots'},isle);
  chap.slots.forEach(slot=>{
   const li=el('li',{class:'isle-cell'},ol);setVar(li,'--k',String(slot.pos));setVar(li,'--d',(-((slot.index*1.13)%6)).toFixed(2)+'s');
   const b=el('button',{type:'button',class:'isle-slot','data-state':slot.state,'data-course':slot.id,'data-memory':String(slot.memory),'aria-pressed':'false','aria-label':describe(slot)},li);
   b.dataset.index=String(slot.index);
   const face=el('span',{class:'isle-face','aria-hidden':'true'},b);
   if(slot.state==='locked'){const l=el('span',{class:'isle-lock'},face);l.innerHTML=icon('lock',22)||'—'}
   else{
    const row=el('span',{class:'isle-pips isle-pips-mini'},face);goalsPips(row,slot.goals);
    const gem=el('span',{class:'isle-gem','data-on':String(slot.memory)},face);
    if(slot.memory&&star){const im=el('img',{alt:'',draggable:'false'},gem);im.src=star}else gem.textContent=slot.memory?'✦':'';
   }
   b.onclick=e=>onSlot(slot,e);
  });
  // --- list: the same data as plain rows ---
  const sec=el('section',{class:'isle-lc'},ui.list);
  const lh=el('h2',{},sec);el('span',{class:'isle-ch-num'},lh,chap.number+'장');el('span',{class:'isle-ch-name'},lh,chap.title);
  el('span',{class:'isle-ch-total'},lh,'별 '+chap.stars+' / '+chap.maxStars);
  const ul=el('ul',{},sec);
  chap.slots.forEach(slot=>{
   const li=el('li',{class:'isle-row','data-state':slot.state,'data-course':slot.id},ul);
   const main=el('span',{class:'isle-row-main'},li);
   el('strong',{},main,slot.title);
   if(slot.state==='locked')el('span',{class:'isle-row-line'},main,reasonText(slot));
   else{
    const line=[];if(slot.best>0)line.push('최고 '+fmt(slot.best)+'점');if(slot.bestTime>0)line.push('가장 빠른 길 '+fmtTime(slot.bestTime));
    el('span',{class:'isle-row-line'},main,line.length?line.join(' · '):(slot.plays>0?'아직 문을 못 열었어요':'아직 가 보지 않았어요'));
   }
   const meta=el('span',{class:'isle-row-meta'},li);
   if(slot.state==='locked'){const l=el('span',{class:'isle-lock'},meta);l.innerHTML=icon('lock',20)||'—';}
   else{
    const pp=el('span',{class:'isle-pips',role:'img','aria-label':'별 '+slot.stars+' / 3'},meta);goalsPips(pp,slot.goals);
    if(slot.memory){const g=el('span',{class:'isle-gem isle-gem-row','data-on':'true',role:'img','aria-label':'기억의 별 찾음'},meta);if(star){const im=el('img',{alt:'',draggable:'false'},g);im.src=star}else g.textContent='✦'}
   }
   if(slot.state!=='locked'){
    const go=el('button',{type:'button',class:'isle-row-go','data-course':slot.id},li,slot.state==='cleared'?'다시 달리기':'달리기');
    go.setAttribute('aria-label',slot.title+' · '+(slot.state==='cleared'?'다시 달리기':'달리기'));
    go.onclick=e=>play(slot.id,e);
   }
  });
 });
 // keep the selection across a re-render
 const keep=selected&&flatSlots().find(s=>s.id===selected);
 select(keep?keep.id:(m.next||flatSlots()[0]?.id||null),false);
 setMode(mode);
}
function goalsPips(host,goals){
 host.replaceChildren();
 for(const on of goals){const s=el('i',{class:'isle-pip','data-on':String(on),'aria-hidden':'true'},host);s.innerHTML=icon('star',12)||'★'}
}
const flatSlots=()=>model?model.chapters.flatMap(c=>c.slots):[];
function select(id,scroll){
 selected=id;
 for(const b of ui.board.querySelectorAll('.isle-slot'))b.setAttribute('aria-pressed',String(b.dataset.course===id));
 const slot=flatSlots().find(s=>s.id===id);
 if(!slot){ui.infoTitle.textContent='네모를 눌러 보세요';ui.infoLine.textContent='';ui.infoStars.replaceChildren();ui.play.hidden=true;return}
 ui.info.dataset.state=slot.state;
 const chap=model.chapters.find(c=>c.number===slot.chapter),art=artSrc('chapter-'+slot.chapter);
 if(art)setVar(ui.infoThumb,'--thumb','url('+art+')');
 setVar(ui.infoThumb,'--tx',(slot.pos*25)+'%');
 ui.infoTitle.textContent=slot.title;void chap;
 if(slot.state==='locked'){
  ui.infoStars.replaceChildren();ui.infoStars.removeAttribute('aria-label');
  ui.infoLine.textContent=reasonText(slot);ui.play.hidden=true;
 }else{
  pips(ui.infoStars,slot.goals,'별 '+slot.stars+' / 3');
  const line=[slot.memory?'기억의 별 찾음':'기억의 별 아직'];
  if(slot.best>0)line.push('최고 '+fmt(slot.best)+'점');if(slot.bestTime>0)line.push('가장 빠른 길 '+fmtTime(slot.bestTime));
  ui.infoLine.textContent=line.join(' · ');
  ui.play.hidden=false;ui.play.textContent=slot.state==='cleared'?'다시 달리기':'달리기';ui.play.dataset.course=slot.id;ui.play.onclick=e=>play(slot.id,e);
 }
 if(scroll){const b=ui.board.querySelector('[data-course="'+id+'"]');try{b?.scrollIntoView?.({block:'nearest',inline:'nearest'})}catch(_){}}
}
/* First tap selects a square (the panel under the board tells what it holds); a second tap on the selected open square replays the course. */
function onSlot(slot,event){
 if(selected===slot.id&&slot.state!=='locked'){play(slot.id,event);return}
 select(slot.id,true);
}
function play(courseId,event){
 const road=R();if(!road||typeof road.start!=='function')return false;
 const go=()=>{close(true);return road.start(courseId,event)};
 const kit=root.MongyuUiKit;
 try{kit?.sound?.('ui-open')}catch(_){}
 return kit?.transition?kit.transition(go):go();
}
function toWardrobe(event){
 close(true);
 const L=root.MongyuLobbyUi;
 if(L?.invoke&&L.invoke('shopOpen',event))return true;
 try{doc.getElementById('shopOpen')?.click();return true}catch(_){return false}
}
function open(event){
 if(!enabled||!doc)return false;
 mount();if(!ui)return false;
 if(openFlag)return true;
 openFlag=true;returnFocus=doc.activeElement;
 mode=readMode();
 render();ui.screen.hidden=false;doc.body.dataset.isle='open';
 if(!offLang&&root.MongyuI18n?.onChange)offLang=root.MongyuI18n.onChange(()=>{if(openFlag)render()});
 try{root.MongyuUiKit?.sound?.('ui-open')}catch(_){}
 const target=ui.board.querySelector('[data-course="'+selected+'"]')||ui.bIsle;
 try{(mode==='list'?ui.bList:target).focus({preventScroll:true});target.scrollIntoView?.({block:'center'})}catch(_){}
 void event;return true;
}
function close(silent){
 if(!ui||!openFlag)return false;
 openFlag=false;ui.screen.hidden=true;if(doc.body?.dataset)delete doc.body.dataset.isle;
 const back=returnFocus;returnFocus=null;
 if(silent!==true){try{root.MongyuUiKit?.sound?.('ui-close')}catch(_){}if(back&&typeof back.focus==='function')try{back.focus({preventScroll:true})}catch(_){}}
 return true;
}
function onKey(e){
 if(e.key==='Escape'){e.stopPropagation();e.preventDefault();close();return}
 if(e.key!=='Tab')return;
 const nodes=[...ui.screen.querySelectorAll('button')].filter(n=>!n.disabled&&!n.hidden&&!n.closest('[hidden]'));
 if(!nodes.length)return;
 const i=nodes.indexOf(doc.activeElement);e.preventDefault();
 nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();
}

const api=Object.freeze({enabled,buildModel,describe,reasonText,fmtTime,open,close,render,mount:()=>mount(),select,setMode,
 get isOpen(){return openFlag},get ui(){return ui},get model(){return model},get selected(){return selected},get mode(){return mode}});
root.MongyuDreamIsle=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
