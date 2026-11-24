/* R105 "꿈의 길" campaign mode: chapters, course list, stars, unlocks, result panel. Owned by workstream A (chapter selection: workstream CP).
   Title button (added by play-modes.js) -> #roadScreen (chapter tabs + the 5 courses of the chosen chapter up a stone road) -> a CourseRun via MongyuPolish.host.startRun -> #roadResult.
   Progress lives in mongyu.r105.road: {v:1,plays,last,courses:{c1:{g:bitmask(1 완주,2 빛 조각,4 무피격),stars,best,clears,plays,bestShards,bestProgress}}}; ids c1-c5 are chapter 1, c6-c25 chapters 2-5, c26-c50 chapters 6-10 (UI edition).
   Unlocks run over the flat course list: a course opens once the one before it has a star, so a chapter opens when the previous chapter's last course is cleared. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const doc=root.document;
const KEY='mongyu.r105.road';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const fmt=n=>Math.max(0,Math.floor(n||0)).toLocaleString('ko-KR');
const GOAL_TEXT=['끝까지 가기','빛 조각 모으기','안 부딪히기'];
/* Generated art (R105 UI edition only): data-URI sources of the embedded WebP table, or null when absent (tests, older builds). */
const artSrc=id=>{try{return root.MONGYU_UI_EDITION===true&&root.MONGYU_EMBEDDED_ART?.[id]?.src||null}catch(_){return null}};
const icon=(name,size)=>{try{return root.MongyuIcons?.svg?.(name,{size:size||22})||''}catch(_){return ''}};
const setIcon=(node,name,size)=>{const svg=icon(name,size);if(svg)node.innerHTML=svg};
const bits=g=>[!!(g&1),!!(g&2),!!(g&4)];
const pop=g=>bits(g).filter(Boolean).length;

/* ---------- storage ---------- */
let store=null;
function storage(){if(store)return store;try{const s=root.localStorage;store=root.MongyuStorage?root.MongyuStorage.create(s):s}catch(_){store={getItem(){return null},setItem(){throw Error('no storage')},removeItem(){}}}return store}
function blank(){return {v:1,plays:0,last:null,courses:{}}}
function read(){
 try{const d=JSON.parse(storage().getItem(KEY)||'null');if(d&&d.v===1&&d.courses&&typeof d.courses==='object'&&!Array.isArray(d.courses))return d}catch(_){}
 return blank();
}
function write(d){try{storage().setItem(KEY,JSON.stringify(d));return true}catch(_){return false}}
function reset(){try{storage().removeItem(KEY)}catch(_){}}
const C=()=>root.MongyuCourse;
const chapters=()=>C()?.CHAPTERS||(C()?.CHAPTER1?[C().CHAPTER1]:[]);
const courses=()=>C()?.allCourses?.()||C()?.CHAPTER1?.courses||[];
const chapterOfId=id=>chapters().find(ch=>ch.courses.some(c=>c.id===id))||chapters()[0]||null;
const setVar=(node,name,v)=>{const st=node.style;if(st.setProperty)st.setProperty(name,v);else st[name]=v};
/* Backdrop of a chapter: the generated chapter-N art, else the dark lobby, else the old lobby (nothing when the art table is missing). */
/* Chapters 6-10 until their own chapter-N art is generated: a dark trip image that suits the theme (stage / liquid / pulse / void), else chapter 1. */
const FALLBACK_ART={6:'trip-heart',7:'trip-aqua',8:'trip-toxic',9:'lobby-trip',10:'chapter-1'};
const backdrop=n=>artSrc('chapter-'+n)||(FALLBACK_ART[n]&&artSrc(FALLBACK_ART[n]))||artSrc('lobby-trip')||artSrc('lobby-psy');
const entry=(d,id)=>{const c=d.courses[id];return c&&typeof c==='object'?c:{g:0,stars:0,best:0,clears:0,plays:0,bestShards:0,bestProgress:0}};
/* A course opens once the one before it was completed (at least one star). */
function unlocked(index,d=read()){if(index<=0)return true;const prev=courses()[index-1];return !!prev&&entry(d,prev.id).stars>=1}
function totalStars(d=read()){return courses().reduce((s,c)=>s+entry(d,c.id).stars,0)}
/* Chapter i (0-based) is open when its first course is: the previous chapter's last course has a star. */
function chapterUnlocked(i,d=read()){const ch=chapters()[i];if(!ch)return false;const first=courses().findIndex(c=>c.id===ch.courses[0].id);return first<=0||unlocked(first,d)}
function chapterStars(i,d=read()){const ch=chapters()[i];return ch?ch.courses.reduce((s,c)=>s+entry(d,c.id).stars,0):0}
/* The course the 달리기 button enters: the first open course without a star yet, else the last cleared one, else course 1 (over every chapter). */
function nextCourseId(d=read()){
 const list=courses();let target=0;
 for(let i=0;i<list.length;i++){const e=entry(d,list[i].id);if(unlocked(i,d)&&e.stars<1){target=i;break}else if(e.stars>=1)target=i}
 return list[target]?.id||'c1';
}
function record(r){
 const d=read(),list=courses(),index=list.findIndex(c=>c.id===r.courseId),c=entry(d,r.courseId);
 const prevStars=c.stars,prevBest=c.best,clear=r.state==='clear',next={...c};
 next.plays=(c.plays||0)+1;next.bestProgress=Math.max(c.bestProgress||0,r.progress||0);
 if(clear){
  const goals=C().goals(r);next.clears=(c.clears||0)+1;next.best=Math.max(c.best||0,r.score);next.bestShards=Math.max(c.bestShards||0,r.shards||0);
  next.g=(c.g|0)|(goals[0]?1:0)|(goals[1]?2:0)|(goals[2]?4:0);next.stars=pop(next.g);
 }
 d.courses[r.courseId]=next;d.plays=(d.plays||0)+1;d.last=r.courseId;
 const saved=write(d),newGoals=bits(next.g).map((on,i)=>on&&!bits(c.g|0)[i]);
 return {best:next.best,newBest:clear&&r.score>prevBest&&prevBest>0,firstClear:clear&&prevStars===0,prevStars,stars:next.stars,newGoals,saved,
  unlockedNext:clear&&prevStars===0&&index>=0&&index<list.length-1?list[index+1]:null};
}

/* ---------- DOM ---------- */
let host=null,ui=null,resultFor=null,countToken=0,starTimers=[],view=0;
const $=id=>doc.getElementById(id);
function el(tag,attrs={},parent,text){const n=doc.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='class')n.className=v;else n.setAttribute(k,v)}if(text!==undefined)n.textContent=text;if(parent)parent.appendChild(n);return n}
const hostApi=()=>host||root.MongyuPolish?.host||null;
const reduced=()=>{try{return hostApi()?.settings?.()?.reduced===true}catch(_){return false}};
function mount(){
 if(ui||!doc?.body)return;
 ui={};const stage=$('stage')||doc.body;
 // Campaign screen.
 const screen=el('section',{id:'roadScreen',class:'r105-road',role:'dialog','aria-modal':'true','aria-labelledby':'roadHeading',hidden:''});
 const head=el('header',{class:'r105-road-head'},screen);
 ui.back=el('button',{id:'roadBack',type:'button',class:'r105-road-back','aria-label':'처음으로'},head);setIcon(ui.back,'back',24);if(!ui.back.firstChild)ui.back.textContent='‹';
 const titles=el('div',{class:'r105-road-titles'},head);
 ui.kicker=el('p',{class:'r105-road-kicker'},titles);
 ui.heading=el('h1',{id:'roadHeading'},titles);
 ui.summary=el('p',{id:'roadSummary',class:'r105-road-summary'},titles);
 // Chapter tabs (one per chapter; a locked chapter stays selectable so it can say why it is closed) and the chapter's intro monologue.
 ui.tabs=el('nav',{class:'r105-chapter-tabs',id:'roadChapters',role:'tablist','aria-label':'장 선택'},screen);
 const intro=el('div',{class:'r105-chapter-intro',id:'roadChapterIntro'},screen);ui.intro=intro;
 ui.chSub=el('p',{class:'ch-sub'},intro);ui.chText=el('p',{class:'ch-text'},intro);ui.chLock=el('p',{class:'ch-lock',role:'status',hidden:''},intro);
 const scroll=el('div',{class:'r105-road-scroll',id:'roadScroll'},screen);ui.scroll=scroll;
 ui.list=el('ol',{id:'roadList',class:'r105-road-list'},scroll);
 applyChapterLook(screen,view);
 stage.appendChild(screen);ui.screen=screen;
 // Horizontal swipe on the list moves between chapters.
 {let sx=0,sy=0,on=false;
  scroll.addEventListener('touchstart',e=>{const t=e.touches?.[0];if(!t)return;sx=t.clientX;sy=t.clientY;on=true});
  scroll.addEventListener('touchend',e=>{if(!on)return;on=false;const t=e.changedTouches?.[0];if(!t)return;const dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.6)selectChapter(view+(dx<0?1:-1))})}
 ui.back.onclick=()=>close();
 screen.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();close()}});
 // Result panel: portrait up top, a compact sheet in the bottom third (score + stars, goal chips, buttons). The stage behind stays visible like a poster.
 const panel=el('section',{id:'roadResult',class:'r104-dream-result r105-road-result',role:'region','aria-labelledby':'roadResultHeading',hidden:''});
 const share=el('div',{class:'road-share',role:'group','aria-label':'공유'},panel);
 ui.poster=el('button',{id:'roadPoster',type:'button',class:'road-icon-btn','aria-label':'포스터 저장'},share);setIcon(ui.poster,'poster',22);if(!ui.poster.firstChild)ui.poster.textContent='포스터';
 ui.clip=el('button',{id:'roadClip',type:'button',class:'road-icon-btn','aria-label':'영상 저장'},share);setIcon(ui.clip,'video',22);if(!ui.clip.firstChild)ui.clip.textContent='영상';
 ui.stage=el('div',{class:'road-portrait','aria-hidden':'true'},panel);
 ui.portrait=el('img',{class:'road-portrait-img',alt:'',draggable:'false',hidden:''},ui.stage);
 const box=el('div',{class:'box'},panel),id=el('div',{class:'dream-identity'},box);
 ui.rKicker=el('p',{class:'dream-kicker',id:'roadResultKicker'},id);
 const hl=el('div',{class:'road-headline'},id);
 ui.rHeading=el('h1',{id:'roadResultHeading'},hl);
 ui.rBadge=el('span',{class:'dream-badge',id:'roadResultBadge',hidden:''},hl,'새 최고 기록');
 const row=el('div',{class:'road-scorerow'},id);
 ui.stars=el('div',{class:'road-stars',role:'img',id:'roadResultStars'},row);
 ui.starNodes=[0,1,2].map(()=>el('span',{class:'road-star','data-on':'false'},ui.stars));
 const line=el('p',{class:'dream-score'},row);ui.score=el('span',{id:'roadResultScore'},line);el('span',{class:'score-unit'},line,'점');
 ui.starGoals=el('ul',{class:'road-goals','aria-hidden':'true'},id);
 ui.goalNodes=GOAL_TEXT.map(t=>el('li',{'data-on':'false'},ui.starGoals,t));
 ui.detail=el('p',{id:'roadResultDetail',class:'dream-detail'},id);
 ui.ending=el('p',{id:'roadResultEnding',class:'road-ending',hidden:''},id);
 const acts=el('div',{class:'dream-actions'},box);
 ui.primary=el('button',{id:'roadPrimary',type:'button','data-primary':'true'},acts,'다음 꿈');
 const sec=el('div',{class:'road-secondary'},acts);
 ui.again=el('button',{id:'roadAgain',type:'button'},sec,'다시 달리기');
 ui.toRoad=el('button',{id:'roadToRoad',type:'button'},sec,'꿈의 길로');
 ui.note=el('p',{id:'roadShareNote',class:'dream-note',role:'status','aria-live':'polite'},panel);
 stage.appendChild(panel);ui.panel=panel;
 ui.poster.onclick=()=>exportPoster();ui.clip.onclick=()=>exportClip();
 ui.toRoad.onclick=()=>toRoad();
}
/* Backdrop and accent colour of the chapter shown (accent = the chapter palette's neon rim). */
function applyChapterLook(screen,i){
 const ch=chapters()[i],bg=backdrop(ch?.number||1);
 if(bg)setVar(screen,'--r105-road-bg','url('+bg+')');
 const P=root.MongyuTrip?.get?.(ch?.trip||'violet');
 if(P){setVar(screen,'--r105-ch',P.rim);setVar(screen,'--r105-ch2',P.rim2);setVar(screen,'--r105-ch-glow',P.glow)}
 screen.dataset.chapter=String(ch?.number||1);
}
function selectChapter(i,focus){
 const n=chapters().length;if(!n)return false;
 const next=clamp(Math.trunc(i)||0,0,n-1);if(next===view&&ui?.list?.children?.length)return false;
 view=next;if(ui)render();
 if(focus){try{ui.tabs.querySelector('[aria-selected="true"]')?.focus?.({preventScroll:true})}catch(_){}}
 return true;
}
/* With ten chapters the tab row scrolls sideways: keep the selected tab centred (needs the screen to be visible for real sizes). */
function centerTab(){
 try{const sel=ui?.tabs?.querySelector?.('[aria-selected="true"]');if(!sel||!ui.tabs.clientWidth)return;
  const x=sel.offsetLeft-(ui.tabs.clientWidth-sel.offsetWidth)/2;if(Number.isFinite(x))ui.tabs.scrollLeft=Math.max(0,x)}catch(_){}
}
function renderTabs(d){
 const list=chapters();ui.tabs.hidden=list.length<2;ui.tabs.replaceChildren();
 list.forEach((ch,i)=>{
  const open=chapterUnlocked(i,d),n=chapterStars(i,d),max=ch.courses.length*3;
  const tab=el('button',{type:'button',class:'ch-tab',role:'tab','data-chapter':String(ch.number),'data-state':open?'open':'locked','aria-selected':String(i===view),
   'aria-label':ch.number+'장 '+ch.title+(open?', 별 '+n+' / '+max:', 잠김. 앞 장의 마지막 코스를 완주하면 열려요.')},ui.tabs);
  const num=el('span',{class:'ch-num','aria-hidden':'true'},tab);
  if(open)num.textContent=String(ch.number);else{setIcon(num,'lock',16);if(!num.firstChild)num.textContent=String(ch.number)}
  el('span',{class:'ch-n','aria-hidden':'true'},tab,open?'★ '+n:'잠김');
  tab.onclick=()=>selectChapter(i);
 });
 centerTab();
}
function render(){
 if(!ui)return;
 const d=read(),list=courses(),all=chapters(),ch=all[view]||all[0];if(!ch)return;
 const idx=ch.courses.map(c=>list.findIndex(x=>x.id===c.id)),open=chapterUnlocked(view,d);
 applyChapterLook(ui.screen,view);
 ui.kicker.textContent=ch.number+'장';ui.heading.textContent=ch.title||'꿈의 길';
 const stars=totalStars(d),next=list.findIndex((c,i)=>unlocked(i,d)&&entry(d,c.id).stars<1);
 ui.summary.textContent='별 '+stars+' / '+list.length*3+'  ·  '+(next>=0?'다음 길은 '+list[next].title:'모든 길을 걸었어요');
 renderTabs(d);
 // Chapter header: the subtitle and the monologue intro, or why the chapter is closed.
 ui.intro.hidden=!ch.intro&&open;ui.chSub.textContent=ch.subtitle||'';
 ui.chText.textContent=open?(ch.intro||[]).join('\n'):'';ui.chText.hidden=!open||!(ch.intro&&ch.intro.length);
 if(open)ui.chLock.hidden=true;
 else{const prev=all[view-1],last=prev?.courses[prev.courses.length-1];ui.chLock.textContent=last?'앞 장의 마지막 코스 「'+last.title+'」를 완주하면 열려요':'앞 장을 완주하면 열려요';ui.chLock.hidden=false}
 ui.list.replaceChildren();
 ch.courses.forEach((course,k)=>{
  const gi=idx[k],e=entry(d,course.id),isOpen=unlocked(gi,d),state=!isOpen?'locked':e.stars>0?'done':'open',playable=C().playableActs(course).acts;
  const seconds=Math.round(playable.reduce((s,a)=>s+(a.weight||10),0)/5)*5;
  const li=el('li',{class:'r105-road-node','data-state':state,'data-course':course.id},ui.list);
  const stone=el('span',{class:'rd-stone','aria-hidden':'true'},li);el('i',{},stone,!isOpen?'':String(k+1));
  const card=el('button',{type:'button',class:'rd-card','data-course':course.id},li);
  const why=k===0&&gi>0?'앞 장을 완주하면 열려요':'앞 코스를 완주하면 열려요';
  if(!isOpen){card.setAttribute('aria-disabled','true');card.setAttribute('aria-label',course.title+', 잠김. '+why+'.')}
  // Thumbnail: the chapter's own art (chapter-N), else the course backdrop, else the dark lobby; locked courses are dimmed behind a padlock.
  const thumb=el('span',{class:'rd-thumb','aria-hidden':'true'},card),src=artSrc('chapter-'+ch.number)||artSrc('course-'+course.id)||backdrop(ch.number);
  if(src){const img=el('img',{class:'rd-thumb-img',alt:'',draggable:'false'},thumb);img.src=src}
  if(!isOpen){const lock=el('span',{class:'rd-lock'},thumb);setIcon(lock,'lock',26);if(!lock.firstChild)lock.textContent='잠김'}
  else if(state==='done'){const ok=el('span',{class:'rd-done'},thumb);setIcon(ok,'check',16)}
  const body=el('span',{class:'rd-body'},card);
  const top=el('span',{class:'rd-row'},body);el('span',{class:'rd-name'},top,course.title);
  const st=el('span',{class:'rd-stars',role:'img','aria-label':'별 '+e.stars+' / 3'},top);
  bits(e.g|0).forEach(on=>{const sp=el('span',{class:'rd-s','data-on':String(on),'aria-hidden':'true'},st);setIcon(sp,'star',16);if(!sp.firstChild)sp.textContent='★'});
  el('span',{class:'rd-desc'},body,!isOpen?why:course.subtitle);
  const meta=el('span',{class:'rd-meta'},body);
  el('span',{},meta,playable.length+'구간 · 약 '+seconds+'초');
  if(isOpen&&e.clears>0)el('span',{class:'rd-best'},meta,'최고 '+fmt(e.best));
  else if(isOpen&&e.plays>0)el('span',{class:'rd-best'},meta,'도전 '+Math.round((e.bestProgress||0)*100)+'%');
  card.onclick=ev=>{if(!isOpen)return;start(course.id,ev)};
 });
}
function open(event){
 if(!doc)return false;mount();if(!ui)return false;
 hideResult();const d=read(),list=courses(),targetId=nextCourseId(d);
 view=Math.max(0,chapters().indexOf(chapterOfId(targetId)));
 render();ui.screen.hidden=false;centerTab();try{root.setTimeout(()=>root.MongyuPsy?.warm?.(),350)}catch(_){}doc.body.dataset.road='open';
 const node=ui.list.querySelector('[data-course="'+targetId+'"] .rd-card');
 try{node?.focus?.({preventScroll:true});node?.scrollIntoView?.({block:'center'})}catch(_){}
 return true;
}
function close(){if(!ui)return false;ui.screen.hidden=true;if(doc?.body?.dataset)delete doc.body.dataset.road;return true}
function toRoad(){hideResult();const h=$('pauseHome')||$('squareHome');try{h?.click()}catch(_){}open()}

/* ---------- starting runs ---------- */
function newRun(id,attempt=1){
 const Co=C(),h=hostApi(),d=read(),course=Co.courseById(id||d.last||'c1')||courses()[0];
 try{root.MongyuPsy?.warm?.(['course-'+course.id])}catch(_){}
 return new Co.CourseRun({...course,viewport:h?.viewport?.()||{width:390,height:844},settings:h?.settings?.()||{},attempt});
}
function start(id,event){const h=hostApi();if(!h?.startRun)return false;hideResult();close();return h.startRun(newRun(id),event)}
/* Fail -> restart the failed act with its carried score; clear (or force) -> a fresh run of the same course. */
function retry(run,event,fresh=false){
 const h=hostApi();if(!h?.startRun)return false;hideResult();
 const next=!fresh&&run.state==='fail'&&typeof run.checkpointRun==='function'?run.checkpointRun():newRun(run.id,(run.attempt||1)+1);
 return h.startRun(next,event);
}

/* ---------- result ---------- */
function clearTimers(){countToken++;for(const t of starTimers)root.clearTimeout?.(t);starTimers=[]}
function countUp(node,to,calm){
 const token=++countToken;node.textContent=fmt(calm?to:0);
 if(calm||!root.requestAnimationFrame||to<=0){node.textContent=fmt(to);return}
 const t0=root.performance?.now?.()??0,dur=clamp(500+to*.1,600,1300);
 const step=now=>{if(token!==countToken)return;const u=clamp(((now??t0)-t0)/dur,0,1),e=1-Math.pow(1-u,3);node.textContent=fmt(to*e);if(u<1)root.requestAnimationFrame(step);else node.textContent=fmt(to)};
 root.requestAnimationFrame(step);
}
function hideResult(){if(ui?.panel){ui.panel.hidden=true;ui.note.textContent=''}clearTimers();resultFor=null}
/* Result copy follows docs/R105_VOICE_TONE_KO.md: the headline is a short monologue, everything under it speaks in the system voice. */
function onEnd(run){
 const r=run.result;if(!r||!doc)return;mount();if(!ui)return;
 clearTimers();resultFor=run;const rec=record(r),calm=reduced(),clear=r.state==='clear';
 const list=courses(),index=list.findIndex(c=>c.id===r.courseId),course=list[index],next=list[index+1]||null,goals=r.goals||C().goals(r);
 ui.panel.dataset.reduced=String(calm);ui.panel.dataset.state=r.state;
 const chap=chapterOfId(r.courseId),lastOfChapter=!!chap&&chap.courses[chap.courses.length-1].id===r.courseId,nextChap=next&&chapterOfId(next.id)!==chap?chapterOfId(next.id):null;
 ui.rKicker.textContent=(chap?.number||1)+'장 · '+(course?.title||r.name||'꿈의 길');
 setVar(ui.panel,'--r105-ch',root.MongyuTrip?.get?.(chap?.trip||'violet')?.rim||'#ffd98a');
 // The chapter's closing line (monologue) comes with the last course of the chapter.
 ui.ending.textContent=clear&&lastOfChapter&&chap?.ending?chap.ending:'';ui.ending.hidden=!ui.ending.textContent;
 ui.rBadge.hidden=!rec.newBest;
 ui.rHeading.textContent=clear?'빛의 문이 열렸어':'꿈이 접혔네';
 // Portrait: joy when the gate opened, pose-hurt otherwise (generated art; nothing is shown when the table is missing).
 const pid=root.MongyuCharacter?.portraitId?.(clear?'joy':'hurt')||(clear?'pose-joy':'pose-hurt'),pose=artSrc(pid);
 if(pose){ui.portrait.src=pose;ui.portrait.hidden=false}else{ui.portrait.removeAttribute('src');ui.portrait.hidden=true}
 ui.portrait.dataset.pose=clear?'joy':'hurt';ui.portrait.dataset.art=pid;
 ui.stars.setAttribute('aria-label',clear?'별 '+goals.filter(Boolean).length+' / 3':'별 없음');
 ui.starNodes.forEach(n=>{n.dataset.on='false'});ui.goalNodes.forEach((n,i)=>{n.dataset.on='false';n.dataset.new=String(!!rec.newGoals[i]&&clear)});
 ui.stars.hidden=!clear;ui.starGoals.hidden=!clear;
 if(clear)goals.forEach((on,i)=>{if(!on)return;const show=()=>{ui.starNodes[i].dataset.on='true';ui.goalNodes[i].dataset.on='true'};if(calm)show();else starTimers.push(root.setTimeout(show,500+i*340))});
 countUp(ui.score,r.score,calm);
 const lines=[];
 if(clear){
  lines.push('오로라의 문을 지났어요');
  lines.push('빛 조각 '+r.shards+' / '+r.shardTotal+(r.deaths?' · 넘어짐 '+r.deaths+'번':' · 한 번도 안 넘어졌어요')+(r.bestStreak>1?' · 완벽 ×'+r.bestStreak:''));
  if(rec.unlockedNext)lines[0]=(nextChap?'새 장이 열렸어요 · '+nextChap.number+'장 '+nextChap.title:'새 길이 열렸어요 · '+rec.unlockedNext.title);
  else if(rec.best&&!rec.newBest)lines[0]='최고 '+fmt(rec.best)+'점 · 별 '+rec.stars+' / 3';
 }else{
  lines.push(r.actName+'에서 길이 끊겼어요');
  const cp=run.carries?.[run.actIndex];lines.push('길의 '+Math.round((r.progress||0)*100)+'% · 빛 조각 '+r.shards+'개'+(cp&&cp.points+cp.bonus>0?' · 이 구간은 '+fmt(cp.points+cp.bonus)+'점부터':''));
 }
 if(!rec.saved)lines.push('기록을 저장하지 못했어요. 이번 플레이에만 남아요.');
 ui.detail.textContent=lines.join('\n');
 if(clear){
  if(next){ui.primary.textContent=nextChap?'다음 장 · '+nextChap.title:'다음 꿈 · '+next.title;ui.primary.onclick=e=>start(next.id,e)}
  else{ui.primary.textContent='꿈의 길로';ui.primary.onclick=()=>toRoad()}
  ui.again.textContent='다시 달리기';ui.again.onclick=e=>retry(run,e,true);
  ui.toRoad.hidden=!next;
 }else{
  ui.primary.textContent='이 구간부터 다시';ui.primary.onclick=e=>retry(run,e);
  ui.again.textContent='처음부터';ui.again.onclick=e=>retry(run,e,true);ui.toRoad.hidden=false;
 }
 ui.again.hidden=false;ui.toRoad.onclick=()=>toRoad();
 const S=root.MongyuShare,exportable=S?.supported?.export!==false;
 ui.poster.hidden=!clear||!exportable;ui.clip.hidden=!clear||!exportable||!S?.supported?.video;ui.clip.disabled=true;ui.note.textContent='';
 if(S&&!ui.clip.hidden)S.clip(run).then(blob=>{if(resultFor===run){ui.clip.disabled=!blob;ui.clip.hidden=!blob}});
 ui.panel.hidden=false;
 try{ui.primary.focus({preventScroll:true})}catch(_){}
}
function info(run){const r=run?.result;return {run,title:'꿈의 길 · '+(run?.name||''),subtitle:fmt(r?.score)+'점'}}
async function exportPoster(){
 const S=root.MongyuShare,run=hostApi()?.activeRun?.();if(!S||!run)return;ui.note.textContent='포스터를 만드는 중…';
 try{const res=await S.savePoster(info(run));ui.note.textContent=res.ok?(res.method==='share'?'공유했어요.':'포스터를 저장했어요.'):res.method==='share-cancel'?'':'저장하지 못했어요.'}catch(_){ui.note.textContent='저장하지 못했어요.'}
}
async function exportClip(){
 const S=root.MongyuShare,run=hostApi()?.activeRun?.();if(!S||!run)return;ui.note.textContent='영상을 준비하는 중…';
 try{const res=await S.saveClip(run,info(run));ui.note.textContent=res.ok?(res.method==='share'?'공유했어요.':'영상을 저장했어요.'):res.method==='share-cancel'?'':'저장할 영상이 없어요.'}catch(_){ui.note.textContent='저장하지 못했어요.'}
}

function boot(){
 if(!enabled||!doc)return;
 const bus=root.MongyuPolish;
 const ready=h=>{host=h||host;mount()};
 if(bus){if(bus.host)host=bus.host;bus.on('attach',ready)}
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>{if(bus?.host||host)ready(bus?.host)});else if(bus?.host)ready(bus.host);
}
boot();
const api=Object.freeze({enabled,KEY,read,write,reset,record,unlocked,totalStars,entry,open,close,start,newRun,retry,onEnd,hideResult,render,mount:()=>mount(),toRoad,
 nextCourseId,chapterUnlocked,chapterStars,selectChapter,chapters,courses,
 get view(){return view},get ui(){return ui},get resultFor(){return resultFor}});
root.MongyuRoad=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
