/* R104 mode entry UI and accessibility options. Owned by workstream I.
   - Title screen: a "새로운 꿈" row (무한 꿈 / 오늘의 도전 / 착시 정원) styled like the 꿈 지도·옷장·이야기 links.
   - Settings: an 접근성 group holding 색약 모드, the existing 움직임 줄임 (#motion, moved in) and 골인 영상 기록.
   - Results for dream runs (#dreamResult) with retry, poster, clip; a share bar on other runs' clear screens.

   색약 모드 contract (for art modules):
     document.documentElement.dataset.cvd === 'on' while enabled (attribute html[data-cvd="on"]).
     CSS: html[data-polish-edition] defines --mongyu-tap, --mongyu-danger, --mongyu-danger-deep, --mongyu-goal, --mongyu-goal-2;
          under [data-cvd=on] danger becomes blue-violet (#7f8cff) and goal a pale sky blue, gold stays gold (brighter).
     JS:  MongyuModes.cvd (boolean) and MongyuModes.colors() -> {tap,tapDeep,danger,dangerTop,dangerSide,goal}; canvas art
          should read these per frame instead of hard-coding coral. A 'cvd' event is emitted on MongyuPolish when it changes. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const doc=root.document;
const CVD_KEY='mongyu.r104.cvd',ILLUSION_KEY='mongyu.r104.illusion';
const COLORS={tap:'#ffeca5',tapDeep:'#ffd98a',danger:'#ff8a73',dangerTop:'#ffb59f',dangerSide:'#c75a55',goal:'#7ff3e1'};
const COLORS_CVD={tap:'#ffe14d',tapDeep:'#ffc928',danger:'#7f8cff',dangerTop:'#b5bcff',dangerSide:'#4b55c4',goal:'#bfe9ff'};
let store=null;
function storage(){if(store)return store;try{const s=root.localStorage;store=root.MongyuStorage?root.MongyuStorage.create(s):s}catch(_){store={getItem(){return null},setItem(){throw Error('no storage')},removeItem(){}}}return store}
function read(key){try{return storage().getItem(key)}catch(_){return null}}
function write(key,value){try{storage().setItem(key,value);return true}catch(_){return false}}
let cvd=read(CVD_KEY)==='on';
function applyCvd(){try{const html=doc?.documentElement;if(!html)return;if(cvd)html.dataset.cvd='on';else delete html.dataset.cvd}catch(_){}}
function setCvd(on){cvd=!!on;write(CVD_KEY,cvd?'on':'off');applyCvd();root.MongyuPolish?.emit?.('cvd',{on:cvd});sync()}
function colors(){return cvd?COLORS_CVD:COLORS}
const isDream=run=>!!run&&run.mode==='dream'&&typeof run.drawSelf==='function';

/* ---------- illusion records ---------- */
function readIllusion(){try{const d=JSON.parse(read(ILLUSION_KEY)||'null');if(d&&d.v===1)return d}catch(_){}return {v:1,best:0,clears:0,bestShards:0}}
function recordIllusion(result){
 const d=readIllusion(),prev=d.best,attempted=d.attempts>0;d.attempts=(d.attempts||0)+1;
 if(result.state==='clear'){d.clears++;d.best=Math.max(d.best,result.score);d.bestShards=Math.max(d.bestShards,result.shards)}
 const saved=write(ILLUSION_KEY,JSON.stringify(d));
 return {best:d.best,newBest:result.state==='clear'&&result.score>prev&&prev>0&&attempted,clears:d.clears,saved};
}

/* ---------- DOM ---------- */
let host=null,ui=null,lastRun=null,lastState='',resultFor=null,record=null;
const $=id=>doc.getElementById(id);
function el(tag,attrs={},parent,text){const n=doc.createElement(tag);for(const [k,v] of Object.entries(attrs)){if(k==='class')n.className=v;else n.setAttribute(k,v)}if(text!==undefined)n.textContent=text;if(parent)parent.appendChild(n);return n}
function mount(){
 if(ui||!doc?.body)return;
 ui={};
 // Title row.
 const actions=doc.querySelector('#titleScreen .title-actions'),cont=$('titleContinue');
 if(actions){
  const row=el('div',{class:'r104-modes-row',role:'group','aria-label':'새로운 꿈'});
  ui.endless=el('button',{id:'dreamEndlessOpen',type:'button','data-glyph':'∞'},row,'무한 꿈');
  ui.daily=el('button',{id:'dreamDailyOpen',type:'button','data-glyph':'✧'},row,'오늘의 도전');
  ui.illusion=el('button',{id:'dreamIllusionOpen',type:'button','data-glyph':'◈'},row,'착시 정원');
  if(root.MongyuRoad?.enabled){ui.road=el('button',{id:'dreamRoadOpen',type:'button','data-glyph':'☾'},row,'꿈의 길');ui.road.onclick=e=>root.MongyuRoad.open(e)}
  if(cont&&cont.parentNode===actions)cont.after(row);else actions.prepend(row);
  ui.row=row;
  ui.endless.onclick=e=>startMode('endless',e);ui.daily.onclick=e=>startMode('daily',e);ui.illusion.onclick=e=>startMode('illusion',e);
 }
 // Settings: accessibility group.
 const motion=$('motion');
 if(motion&&motion.parentNode){
  const group=el('div',{id:'r104Access',class:'r104-access',role:'group','aria-labelledby':'r104AccessTitle'});
  el('p',{id:'r104AccessTitle',class:'r104-access-title'},group,'접근성');
  ui.cvd=el('button',{id:'cvdMode',type:'button','aria-pressed':'false','aria-describedby':'r104AccessHelp'},group,'색약 모드 · 꺼짐');
  motion.parentNode.insertBefore(group,motion);group.appendChild(motion);
  ui.capture=el('button',{id:'captureMode',type:'button','aria-pressed':'true'},group,'골인 영상 기록 · 켜짐');
  el('p',{id:'r104AccessHelp',class:'r104-access-help'},group,'색약 모드는 위험(산호)과 목적지(청록) 색을 파랑·노랑 계열로 바꿔요. 움직임 줄임은 화면 회전·흔들림을 줄입니다.');
  ui.cvd.onclick=()=>setCvd(!cvd);
  ui.capture.onclick=()=>{root.MongyuShare?.setWanted(!root.MongyuShare.wanted);sync()};
  ui.motion=motion;
 }
 // Dream result panel.
 const stage=$('stage')||doc.body;
 const panel=el('section',{id:'dreamResult',class:'r104-dream-result',role:'region','aria-labelledby':'dreamResultHeading',hidden:''});
 const box=el('div',{class:'box'},panel);
 const id=el('div',{class:'dream-identity'},box);
 ui.kicker=el('p',{id:'dreamResultKicker',class:'dream-kicker'},id);
 ui.badge=el('span',{id:'dreamResultBadge',class:'dream-badge',hidden:''},id,'새 최고 기록');
 ui.heading=el('h1',{id:'dreamResultHeading'},id);
 const scoreLine=el('p',{class:'dream-score'},id);ui.score=el('span',{id:'dreamResultScore'},scoreLine);el('span',{class:'score-unit'},scoreLine,'점');
 ui.detail=el('p',{id:'dreamResultDetail',class:'dream-detail'},id);
 ui.board=el('ol',{id:'dreamResultBoard',class:'dream-board','aria-label':'이번 주 기록'},id);
 const acts=el('div',{class:'dream-actions'},box);
 ui.retry=el('button',{id:'dreamRetry',type:'button','data-primary':'true'},acts,'다시 달리기');
 const share=el('div',{class:'dream-share',role:'group','aria-label':'공유'},acts);
 ui.poster=el('button',{id:'dreamPoster',type:'button'},share,'포스터 저장');
 ui.clip=el('button',{id:'dreamClip',type:'button'},share,'영상 저장');
 ui.home=el('button',{id:'dreamHome',type:'button'},acts,'처음으로');
 ui.note=el('p',{id:'dreamShareNote',class:'dream-note',role:'status','aria-live':'polite'},acts);
 stage.appendChild(panel);ui.panel=panel;
 ui.retry.onclick=e=>retry(e);ui.home.onclick=e=>{($('pauseHome')||$('squareHome'))?.click();hidePanel()};
 ui.poster.onclick=()=>exportPoster(ui.note);ui.clip.onclick=()=>exportClip(ui.note);
 // Share bar for the other runs' clear screens (first memory, native memories).
 const bar=el('div',{id:'r104ShareBar',class:'r104-share-bar',role:'group','aria-label':'이 순간 저장',hidden:''});
 ui.barPoster=el('button',{id:'sharePoster',type:'button'},bar,'포스터 저장');
 ui.barClip=el('button',{id:'shareClip',type:'button'},bar,'영상 저장');
 ui.barNote=el('p',{id:'shareNote',class:'dream-note',role:'status','aria-live':'polite'},bar);
 stage.appendChild(bar);ui.bar=bar;
 ui.barPoster.onclick=()=>exportPoster(ui.barNote);ui.barClip.onclick=()=>exportClip(ui.barNote);
 applyCvd();sync();
}
function sync(){
 if(!ui)return;
 if(ui.cvd){ui.cvd.setAttribute('aria-pressed',String(cvd));ui.cvd.textContent='색약 모드 · '+(cvd?'켜짐':'꺼짐')}
 const S=root.MongyuShare;
 if(ui.capture){const supported=!!S?.supported?.video;ui.capture.hidden=!supported;const on=!!S?.wanted;ui.capture.setAttribute('aria-pressed',String(on));ui.capture.textContent='골인 영상 기록 · '+(on?'켜짐':'꺼짐')}
}

/* ---------- starting runs ---------- */
function newRun(kind,attempt=1){
 const viewport=host?.viewport?.()||{width:390,height:844},settings=host?.settings?.()||{};
 if(kind==='illusion')return new root.MongyuIllusion.IllusionRun({viewport,settings,attempt});
 if(kind==='road')return root.MongyuRoad.newRun(null,attempt);
 return new root.MongyuEndless.EndlessRun({daily:kind==='daily',viewport,settings,attempt});
}
function startMode(kind,event){
 if(!host?.startRun)return false;
 hidePanel();
 const run=newRun(kind);
 return host.startRun(run,event);
}
function retry(event){
 const run=host?.activeRun?.();
 if(!isDream(run))return false;
 hidePanel();
 if(run.dreamMode==='road')return root.MongyuRoad.retry(run,event);
 const next=newRun(run.dreamMode,(run.attempt||1)+1);
 if(run.dreamMode==='illusion'){next.skipIntro=true;next.reset()}
 return host.startRun(next,event);
}

/* ---------- results ---------- */
function hidePanel(){if(ui?.panel){ui.panel.hidden=true;ui.note.textContent=''}root.MongyuRoad?.hideResult?.();resultFor=null}
function fmt(n){return Math.max(0,Math.floor(n||0)).toLocaleString('ko-KR')}
function onEnd(run){
 const r=run.result;if(!r)return;
 if(run.dreamMode==='road'){resultFor=run;root.MongyuRoad.onEnd(run);return}
 const S=root.MongyuShare;
 if(run.dreamMode==='illusion'){record=recordIllusion(r)}
 else{record=root.MongyuEndless.recordRun(storage(),{daily:run.daily,score:r.score},run.date&&run.daily?run.date:new Date())}
 resultFor=run;
 const kicker=run.dreamMode==='daily'?'오늘의 도전 · '+root.MongyuEndless.dayKey(run.date).slice(5).replace('-','.'):run.dreamMode==='endless'?'무한 꿈':'착시 정원';
 ui.kicker.textContent=kicker;
 ui.heading.textContent=run.dreamMode==='illusion'?(r.state==='clear'?'오로라의 문을 열었다':'정원이 접혔다'):(r.laps>0?r.laps+'바퀴를 돌았다':'꿈이 접혔다');
 ui.score.textContent=fmt(r.score);
 ui.badge.hidden=!record.newBest;
 const lines=[];
 if(run.dreamMode==='illusion'){
  lines.push(r.state==='clear'?'다리 '+r.solved+' / '+r.gaps+' · 빛 조각 '+r.shards+' / '+r.shardTotal:r.reason+' · '+Math.round(r.progress*100)+'%');
  if(record.best)lines.push('최고 '+fmt(record.best)+'점');
 }else{
  lines.push(fmt(r.meters)+'m · 넘은 장애물 '+r.clears+' · 완벽 '+r.perfects+(r.bestStreak>1?' (최대 ×'+r.bestStreak+')':''));
  if(run.daily)lines.push(record.firstTry?'오늘의 첫 기록':'오늘 최고 '+fmt(record.dayBest)+'점');
  else if(record.best)lines.push('최고 '+fmt(record.best)+'점');
 }
 if(!record.saved)lines.push('기록은 이번 실행에만 남습니다.');
 ui.detail.textContent=lines.join('\n');
 // Weekly board: daily = each day's best this week, endless = top five runs this week.
 ui.board.replaceChildren();
 const week=run.dreamMode==='illusion'?[]:record.week||[];
 ui.board.hidden=week.length===0;
 const today=root.MongyuEndless.dayKey(new Date());
 week.slice(0,5).forEach((e,i)=>{const li=el('li',{},ui.board);el('span',{class:'rank'},li,String(i+1));el('span',{class:'day'},li,e.day.slice(5).replace('-','.')+(e.day===today&&run.daily?' · 오늘':''));el('span',{class:'pts'},li,fmt(e.score));if(e.score===r.score&&e.day===today)li.dataset.current='true'});
 if(week.length)ui.board.setAttribute('aria-label',run.daily?'이번 주 도전 기록':'이번 주 최고 기록');
 ui.retry.textContent=run.dreamMode==='illusion'&&r.state==='clear'?'한 번 더':'다시 달리기';
 const exportable=S?.supported?.export!==false;
 ui.poster.hidden=!exportable;ui.clip.hidden=!exportable||!S?.supported?.video;ui.clip.disabled=true;ui.note.textContent='';
 if(S&&!ui.clip.hidden)S.clip(run).then(blob=>{if(resultFor===run){ui.clip.disabled=!blob;ui.clip.hidden=!blob}});
 ui.panel.hidden=false;
 try{ui.retry.focus({preventScroll:true})}catch(_){}
}
function captionInfo(run){
 const r=run?.result;
 if(isDream(run)){
  const road=run.dreamMode==='road',title=road?'꿈의 길 · '+run.name:run.dreamMode==='illusion'?'착시 정원':run.dreamMode==='daily'?'오늘의 도전':'무한 꿈';
  return {run,title,subtitle:fmt(r?.score)+'점'+(road||run.dreamMode==='illusion'?'':' · '+fmt(r?.meters)+'m')};
 }
 const world=$('restorationResultWorld')?.textContent?.trim(),heading=$('squareHeading')?.textContent?.trim();
 return {run,title:world||(run?.openingCourse?'접힌 빛':'몽유'),subtitle:heading||''};
}
async function exportPoster(note){
 const S=root.MongyuShare,run=host?.activeRun?.();if(!S)return;
 note.textContent='포스터를 만드는 중…';
 try{const res=await S.savePoster(captionInfo(run));note.textContent=res.ok?(res.method==='share'?'공유했어요.':'포스터를 저장했어요.'):res.method==='share-cancel'?'':'저장하지 못했어요.'}
 catch(_){note.textContent='저장하지 못했어요.'}
}
async function exportClip(note){
 const S=root.MongyuShare,run=host?.activeRun?.();if(!S)return;
 note.textContent='영상을 준비하는 중…';
 try{const res=await S.saveClip(run,captionInfo(run));note.textContent=res.ok?(res.method==='share'?'공유했어요.':'영상을 저장했어요.'):res.method==='share-cancel'?'':'저장할 영상이 없어요.'}
 catch(_){note.textContent='저장하지 못했어요.'}
}
/* Per-frame bookkeeping: body flag while a dream run is active, share bar on other clear screens. */
function watch(){
 const run=host?.activeRun?.()||null,body=doc.body;
 if(run!==lastRun){
  lastRun=run;lastState='';
  if(isDream(run))body.dataset.r104Mode=run.dreamMode;else delete body.dataset.r104Mode;
  if(!isDream(run))hidePanel();
 }
 const state=run?.state||'';
 if(state!==lastState){
  lastState=state;
  if(isDream(run)&&state==='play')hidePanel();
  if(isDream(run)&&(state==='fail'||state==='clear')&&resultFor!==run)onEnd(run);
 }
 if(ui?.bar){
  const result=$('squareResult'),show=!!run&&!isDream(run)&&state==='clear'&&result&&!result.hidden&&root.MongyuShare?.supported?.export!==false;
  if(ui.bar.hidden===show){ui.bar.hidden=!show;if(show){ui.barNote.textContent='';ui.barClip.hidden=!root.MongyuShare?.hasClip?.(run);if(root.MongyuShare?.supported?.video)root.MongyuShare.clip(run).then(b=>{ui.barClip.hidden=!b})}}
 }
}
function loop(){try{watch()}catch(e){root.console?.error?.('[MongyuModes]',e)}root.requestAnimationFrame?.(loop)}
/* app.js draws every non-opening run through MongyuSquareArt.draw(ctx,run,opts); dream runs paint themselves. */
function hookDraw(){const A=root.MongyuSquareArt;if(!A||A.__r104Draw)return;const orig=A.draw;try{A.draw=function(c,run,o,g){return typeof run?.drawSelf==='function'&&run.mode==='dream'?run.drawSelf(c,o):orig.call(this,c,run,o,g)};A.__r104Draw=true}catch(_){}}
function boot(){
 if(!enabled||!doc)return;
 applyCvd();
 const bus=root.MongyuPolish;
 const ready=()=>{hookDraw();mount();if(!loopStarted){loopStarted=true;loop()}};
 let loopStarted=false;
 if(bus){if(bus.host){host=bus.host}bus.on('attach',h=>{host=h;ready()})}
 if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',()=>{host=host||bus?.host;if(host)ready()});else if(host)ready();
 // Settings dialog: refresh labels whenever it opens.
 doc.addEventListener('click',e=>{if(e.target?.closest?.('#options,#pauseOptions'))root.setTimeout?.(sync,0)},true);
}
boot();
const api=Object.freeze({enabled,get cvd(){return cvd},setCvd,colors,COLORS,COLORS_CVD,startMode,retry,isDream,recordIllusion,readIllusion,
 get record(){return record},CVD_KEY,ILLUSION_KEY,mount:()=>mount()});
root.MongyuModes=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
