/* R105 HUM: MongyuHumor, the data-driven humor engine (blueprint 6.6 / 24). Active only when MONGYU_UI_EDITION===true; R103/R104 stay untouched.
   Pipeline: event bus -> context snapshot -> eligible filter -> priority -> recent-history exclusion (last 20 ids) -> SEEDED weighted pick (own RNG stream, never the
   gameplay RNG) -> safe presentation queue -> output (play-hud bubble / gesture hook / sfx) -> history.
   Rules: global gap 8-15 s (config) + max 3 lines/min; STORY/TEACH bypass both; a line is DROPPED, never deferred, while a hazard is within ~700 ms, a coach/guide is
   on screen, the portal is open, or the fever peak / a boss climax is running; bubbles dwell 1.2-2.8 s by text length; nothing here touches input, physics or music.
   Level: 'off' | 'min' (STORY/TEACH/FAIL help only) | 'default'. Persisted in localStorage 'mongyu.r105.humor' with the per-course fail counts and the once-per-profile set.
   Hooks for other workstreams: MongyuHumor.on('line'|'gesture'|'hide'|'silence', fn); MongyuPolish bus 'humor-bubble' / 'humor-hide' / 'humor-gesture'; an act may expose
   hazardEta() -> seconds until its next hazard (Infinity when none) and boss:true / kind:'boss' to mark a boss climax. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const Bank=root.MongyuHumorBank||(typeof require==='function'&&enabled?(()=>{try{return require('./humor-bank.js')}catch(_){return null}})():null);
const KEY='mongyu.r105.humor',LEVELS=['off','min','default'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=v=>Number.isFinite(v)?v:0;
const DEFAULTS=Object.freeze({gapMs:12000,maxPerMinute:3,historySize:20,dangerMs:700,passedMs:220,warmupMs:2600,minDwellMs:1200,maxDwellMs:2800,koMsPerChar:105,enMsPerChar:60,baseMs:850,pendingGraceMs:900,quietAfterSilenceMs:9000,logSize:60});
const MIN_CLASSES=new Set(['STORY','TEACH','FAIL']),KNOWN_ACTS=new Set(['floor-wall','bridge','helix-up','helix-down','penrose','align']);
const BYPASS_GAP=new Set(['STORY','TEACH','FAIL']),BYPASS_CAP=new Set(['STORY','TEACH']);
const CROSS=[.2,.3,.35,.4,.5,.55,.6,.7,.75,.8,.85,.9];

/* ---- seeded RNG (mulberry32 over a string/number hash): this stream is the only randomness the engine uses ---- */
function hashSeed(...parts){let h=2166136261>>>0;for(const p of parts){const s=String(p);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0}h^=0x9e3779b9;h=Math.imul(h,16777619)>>>0}return h>>>0}
function makeRng(seed){let a=(seed>>>0)||1;return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

/* chapter = options.chapter (chapters.js) or ceil(n/5) of the course id cN (c1..c25). */
function chapterOf(run){
 const o=run?.options||{};if(Number.isFinite(o.chapter))return o.chapter;
 const m=/^c(\d+)$/.exec(String(run?.id||''));return m?Math.ceil(+m[1]/5):0;
}
/* Seconds until the next hazard of the running act (Infinity when unknown/none). Order: the act's own hazardEta() hook, then the known acts' fields. */
function hazardEta(child){
 if(!child)return Infinity;
 try{
  if(typeof child.hazardEta==='function'){const v=child.hazardEta();return Number.isFinite(v)?v:Infinity}
  const dist=child.distance;if(!Number.isFinite(dist))return Infinity;
  let at=null,speed=num(child.speed);
  if(child.openingCourse&&Array.isArray(child.obstacles)){at=child.obstacles[child.index]?.at;speed=122*(child.practice?.78:1)*(child.timeScale||1)}
  else if(child.cs?.COURSE){const C=child.cs.COURSE,g=C.gaps?.[child.gapIndex],b=C.blocks?.[child.blockIndex],cand=[];if(g&&child.turns&&child.turns[g.index]==null)cand.push(g.s0);if(b)cand.push(b.at);at=cand.length?Math.min(...cand):null;speed=num(root.MongyuIllusion?.SPEED)||68}
  else if(child.course?.obstacles){const i=Number.isInteger(child.blockIndex)?child.blockIndex:child.index;at=child.course.obstacles[i]?.at}
  if(!Number.isFinite(at)||!(speed>0))return Infinity;
  return (at-dist)/speed;
 }catch(_){return Infinity}
}
const visibleText=(doc,id)=>{try{const n=doc?.getElementById?.(id);return n&&!n.hidden&&n.textContent?n.textContent.trim():''}catch(_){return ''}};

function create(opts={}){
 const cfg={...DEFAULTS,...(opts.config||{})};
 cfg.gapMs=clamp(cfg.gapMs,8000,15000);
 const entries=(opts.bank||Bank)?.ENTRIES||[];
 const byEvent=new Map();for(const e of entries){if(!byEvent.has(e.event))byEvent.set(e.event,[]);byEvent.get(e.event).push(e)}
 const clock=opts.clock||(()=>num(root.performance?.now?.()));
 const wall=opts.wall||(()=>Date.now());
 const bus=opts.bus===undefined?root.MongyuPolish:opts.bus;
 const storage=opts.storage===undefined?(()=>{try{return root.localStorage||null}catch(_){return null}})():opts.storage;
 const langOf=opts.lang||(()=>{try{return root.MongyuI18n?.lang?.()||'ko'}catch(_){return 'ko'}});
 const docOf=opts.doc||(()=>root.document||null);
 const listeners=new Map();
 const S={level:'default',readingScale:1,history:[],last:new Map(),counts:new Map(),seen:new Set(),fails:{},seed:0,runs:0,lastSeen:0,awayDays:0,
  lineAt:-1e12,stamps:[],quietUntil:0,pending:null,bubble:null,rng:null,run:null,tr:null,log:[],stats:{events:0,emitted:0,dropped:{},silence:0},portalAt:-1e12,gestureCount:0};
 /* ---------- persistence ---------- */
 function load(){
  let d=null;try{d=JSON.parse(storage?.getItem?.(KEY)||'null')}catch(_){}
  if(d&&typeof d==='object'){
   if(LEVELS.includes(d.level))S.level=d.level;
   if(Number.isFinite(d.seed))S.seed=d.seed>>>0;
   if(Array.isArray(d.seen))for(const g of d.seen)if(typeof g==='string')S.seen.add(g);
   if(d.fails&&typeof d.fails==='object')for(const k of Object.keys(d.fails))if(Number.isFinite(d.fails[k])&&d.fails[k]>0)S.fails[k]=Math.min(999,d.fails[k]|0);
   if(Number.isFinite(d.runs))S.runs=Math.max(0,d.runs|0);
   if(Number.isFinite(d.lastSeen))S.lastSeen=d.lastSeen;
  }
  if(!S.seed)S.seed=opts.seed!==undefined?(opts.seed>>>0)||1:(hashSeed(wall(),Math.random())||1);
  S.awayDays=S.lastSeen>0?Math.max(0,Math.floor((wall()-S.lastSeen)/86400000)):0;
  if(S.awayDays>=1)S.fails={};
  S.rng=makeRng(hashSeed(S.seed,'boot'));
 }
 function save(){
  try{storage?.setItem?.(KEY,JSON.stringify({v:1,level:S.level,seed:S.seed,seen:[...S.seen],fails:S.fails,runs:S.runs,lastSeen:wall()}))}catch(_){}
 }
 /* ---------- events out ---------- */
 function emit(type,detail){for(const fn of [...(listeners.get(type)||[])]){try{fn(detail)}catch(e){try{root.console?.error?.('[MongyuHumor]',type,e)}catch(_){}}}}
 function on(type,fn){if(typeof fn!=='function')return()=>{};if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);return()=>listeners.get(type)?.delete(fn)}
 const drop=reason=>{S.stats.dropped[reason]=(S.stats.dropped[reason]||0)+1;return null};
 /* ---------- context snapshot ---------- */
 function coachBusy(run){
  const c=run?.child;
  try{if(c?.coach&&typeof c.coach.text==='string'&&c.coach.text&&(!Number.isFinite(c.coach.until)||num(c.time)<c.coach.until))return true}catch(_){}
  try{if(run?.coach&&typeof run.coach.text==='string'&&run.coach.text&&(!Number.isFinite(run.coach.until)||num(run.time)<run.coach.until))return true}catch(_){}
  const d=docOf();return !!(visibleText(d,'runLesson')||visibleText(d,'hudCue'));
 }
 function snapshot(run,now){
  const ctx={run:run||null,now,chapter:chapterOf(run),course:String(run?.id||''),act:'',actIndex:num(run?.actIndex),state:run?.state||'',streak:0,progress:0,fails:0,attempt:num(run?.attempt)||1,
   assistPlaced:false,lastItem:run?.lastItem||null,awayDays:S.awayDays,runs:S.runs,tags:new Set(),eta:Infinity,safe:false,why:''};
  if(!run)return ctx;
  const child=run.child;
  ctx.act=String(run.acts?.[run.actIndex]?.type||'');
  ctx.streak=num(run.perfectStreak);ctx.fails=S.fails[ctx.course]|0;
  try{ctx.progress=typeof run.progress==='function'?num(run.progress()):0}catch(_){}
  ctx.assistPlaced=!!(run.assistActs&&run.assistActs[run.actIndex])||!!child?.assisted;
  ctx.eta=hazardEta(child);
  ctx.blind=!KNOWN_ACTS.has(ctx.act)&&typeof child?.hazardEta!=='function';
  const sumSurge=(()=>{try{return num(root.MongyuItems?.summary?.(child)?.surgeLeft)>0}catch(_){return false}})();
  if(sumSurge)ctx.tags.add('fever_peak');
  if(child?.boss===true||child?.kind==='boss'||run.acts?.[run.actIndex]?.type==='boss')ctx.tags.add('boss_climax');
  const coach=coachBusy(run);if(coach)ctx.tags.add('tutorial_critical');
  ctx.coach=coach;
  const hazard=ctx.eta<=cfg.dangerMs/1000&&ctx.eta>=-cfg.passedMs/1000;
  ctx.danger=hazard;
  if(run.state!=='play')ctx.why='state';
  else if(run.crash||run.outro)ctx.why='outro';
  else if(run.portal)ctx.why='portal';
  else if(coach)ctx.why='coach';
  else if(hazard)ctx.why='danger';
  else if(S.tr&&S.tr.run===run&&now-S.tr.startedAt<cfg.warmupMs)ctx.why='warmup';
  ctx.safe=ctx.why==='';
  return ctx;
 }
 /* ---------- filter ---------- */
 const has=(list,v)=>!Array.isArray(list)||list.includes(v);
 function eligible(e,ctx,detail,now){
  const w=e.when;
  if(S.level==='min'&&!MIN_CLASSES.has(e.cls))return false;
  if(w.ch&&!has(w.ch,ctx.chapter))return false;
  if(w.course&&!has(w.course,ctx.course))return false;
  if(w.act&&!has(w.act,detail.act??ctx.act))return false;
  if(w.streakMin!==undefined&&ctx.streak<w.streakMin)return false;
  if(w.failEq&&!w.failEq.includes(ctx.fails))return false;
  if(w.failMin!==undefined&&ctx.fails<w.failMin)return false;
  if(w.failMax!==undefined&&ctx.fails>w.failMax)return false;
  if(w.failEvery&&!(ctx.fails>=w.failEvery[0]&&(ctx.fails-w.failEvery[0])%w.failEvery[1]===0))return false;
  if(w.cross!==undefined&&!(Array.isArray(w.cross)?w.cross.includes(detail.cross):w.cross===detail.cross))return false;
  if(w.item&&!w.item.includes(detail.item))return false;
  if(w.assist!==undefined&&w.assist!==ctx.assistPlaced)return false;
  if(w.assistItem!==undefined&&w.assistItem!==!!detail.assist)return false;
  if(w.pausedMsMin!==undefined&&num(detail.pausedMs)<w.pausedMsMin)return false;
  if(w.awayDaysMin!==undefined&&ctx.awayDays<w.awayDaysMin)return false;
  if(w.notFirstEver&&ctx.runs<=0)return false;
  if(e.oncePerProfile&&S.seen.has(e.group))return false;
  if((S.counts.get(e.id)||0)>=e.maxPerSession)return false;
  const t=S.last.get(e.id);if(t!==undefined&&now-t<e.cooldownSeconds*1000)return false;
  for(const tag of e.exclusionTags)if(ctx.tags.has(tag)&&!e.allow.includes(tag))return false;
  return true;
 }
 /* ---------- pick ---------- */
 function pick(list,now){
  if(!list.length)return null;
  const recent=new Set(S.history);
  const groups=new Map();for(const e of list){if(!groups.has(e.priority))groups.set(e.priority,[]);groups.get(e.priority).push(e)}
  const order=[...groups.keys()].sort((a,b)=>b-a);
  for(const p of order){
   const pool=groups.get(p).filter(e=>!recent.has(e.id));
   if(!pool.length)continue;
   let total=0;for(const e of pool)total+=Math.max(0,e.weight);
   if(!(total>0))continue;
   let r=S.rng()*total;for(const e of pool){r-=Math.max(0,e.weight);if(r<0)return e}
   return pool[pool.length-1];
  }
  return null;
 }
 const textOf=e=>(langOf()==='en'?e.en:e.ko)??'';
 function dwell(e,text){
  if(e.durationMs>0)return clamp(e.durationMs,cfg.minDwellMs,cfg.maxDwellMs)*S.readingScale;
  const len=[...text].length,per=langOf()==='en'?cfg.enMsPerChar:cfg.koMsPerChar;
  return clamp(cfg.baseMs+len*per,cfg.minDwellMs,cfg.maxDwellMs)*S.readingScale;
 }
 /* ---------- gates shared by selection and presentation ---------- */
 function gate(e,ctx,now){
  if(!(e.outputs.result)&&!ctx.safe)return 'unsafe:'+ctx.why;
  if(ctx.blind&&!e.outputs.result&&e.event!=='act.enter'&&e.event!=='act.exit')return 'blind';
  if(e.outputs.result&&ctx.why==='danger')return 'unsafe:danger';
  if(now<S.quietUntil&&e.priority<90)return 'quiet';
  const cap=BYPASS_CAP.has(e.cls);
  if(!BYPASS_GAP.has(e.cls)&&now-S.lineAt<cfg.gapMs)return 'gap';
  if(!cap){let n=0;for(const t of S.stamps)if(now-t<60000)n++;if(n>=cfg.maxPerMinute)return 'cap'}
  if(S.bubble&&now<S.bubble.until&&e.priority<=S.bubble.priority&&e.priority<90)return 'busy';
  return '';
 }
 function present(e,ctx,now,detail){
  const text=textOf(e),silent=!e.outputs.bubble||text==='';
  S.stamps=S.stamps.filter(t=>now-t<60000);S.stamps.push(now);
  S.lineAt=now;S.history.push(e.id);if(S.history.length>cfg.historySize)S.history.shift();
  S.last.set(e.id,now);S.counts.set(e.id,(S.counts.get(e.id)||0)+1);
  if(e.oncePerProfile)S.seen.add(e.group);
  S.stats.emitted++;
  const ms=silent?0:Math.round(dwell(e,text));
  const payload={id:e.id,key:e.key,text,ko:e.ko,en:e.en,lang:langOf(),cls:e.cls,priority:e.priority,durationMs:ms,gesture:e.outputs.gesture,hint:e.outputs.hint,sfx:e.outputs.sfx,
   place:e.outputs.result?'result':'bubble',course:ctx.course,chapter:ctx.chapter,at:now};
  S.log.push({id:e.id,text,at:now,course:ctx.course});if(S.log.length>cfg.logSize)S.log.shift();
  if(silent){
   if(e.cls==='STORY'&&text==='')S.quietUntil=Math.max(S.quietUntil,now+cfg.quietAfterSilenceMs);
   if(text==='')S.stats.silence++;
  }else if(!e.outputs.result){S.bubble={id:e.id,until:now+ms,priority:e.priority}}
  if(e.priority>=90&&silent)S.quietUntil=Math.max(S.quietUntil,now+cfg.quietAfterSilenceMs);
  save();
  emit(text===''?'silence':'line',payload);
  if(!silent&&!e.outputs.result)try{bus?.emit?.('humor-bubble',payload)}catch(_){}
  if(e.outputs.gesture&&e.outputs.gesture!=='none'){S.gestureCount++;emit('gesture',{id:e.id,gesture:e.outputs.gesture,at:now});try{bus?.emit?.('humor-gesture',{id:e.id,gesture:e.outputs.gesture})}catch(_){}}
  if(e.outputs.sfx&&e.outputs.sfx!=='none'){try{bus?.host?.sound?.(e.outputs.sfx)}catch(_){}}
  return payload;
 }
 function hide(reason){
  S.pending=null;
  if(S.bubble){S.bubble=null;emit('hide',{reason});try{bus?.emit?.('humor-hide',{reason})}catch(_){}}
 }
 /* ---------- pipeline ---------- */
 function handle(event,detail={},runArg){
  S.stats.events++;
  const run=runArg!==undefined?runArg:S.run?.run||null,now=clock();
  if(S.level==='off')return null;
  const list0=byEvent.get(event)||[];
  if(!list0.length)return null;
  const ctx=snapshot(run,now);
  const list=list0.filter(e=>eligible(e,ctx,detail,now));
  if(!list.length)return null;
  const e=pick(list,now);if(!e)return drop('exhausted');
  if(e.delayMs>0&&!e.outputs.result){
   /* queued lines are gated again when they come due (and dropped, not retried, if the moment is no longer safe) */
   if(S.pending&&S.pending.e.priority>=e.priority)return drop('pending');
   S.pending={e,at:now+e.delayMs,expires:now+e.delayMs+cfg.pendingGraceMs,detail,run};return {queued:e.id};
  }
  const g=gate(e,ctx,now);
  if(g)return drop(g);
  return present(e,ctx,now,detail);
 }
 /* Called every frame: flushes the queued line once it is due and still safe (otherwise it is dropped, never retried), hides the bubble on danger. */
 function tick(run){
  const now=clock(),p=S.pending;
  if(S.level==='off'){if(p||S.bubble)hide('off');return}
  if(!p&&!S.bubble)return;
  const ctx=snapshot(run||S.run?.run||null,now);
  if(S.bubble&&now>=S.bubble.until)S.bubble=null;
  if(S.bubble&&(ctx.danger||ctx.why==='state'||ctx.why==='outro')){hide(ctx.why||'danger')}
  if(p&&S.pending===p){
   if(now>=p.expires){S.pending=null;drop('expired');return}
   if(now>=p.at){
    S.pending=null;
    if(S.level==='min'&&!MIN_CLASSES.has(p.e.cls))return;
    const g=gate(p.e,ctx,now);if(g){drop(g);return}
    present(p.e,ctx,now,p.detail);
   }
  }
 }
 /* ---------- run tracking (frame level) ---------- */
 function newRunState(run,now){
  const ctx=snapshot(run,now);
  return {run,startedAt:now,state:run.state,pausedAt:null,actIndex:ctx.actIndex,act:ctx.act,progress:ctx.progress,crossed:new Set(CROSS.filter(c=>c<=ctx.progress)),surge:false,started:false};
 }
 function seedFor(run){S.rng=makeRng(hashSeed(S.seed,run?.id||'',run?.seed||0,num(run?.attempt)||1,S.fails[String(run?.id||'')]|0))}
 function onRunEvent(run,ev){
  if(!enabled||!run||!run.courseRun)return;
  const now=clock();
  if(!S.tr||S.tr.run!==run)S.tr=newRunState(run,now);
  switch(ev){
   case 'start':{
    S.tr.startedAt=now;S.tr.started=true;S.pending=null;seedFor(run);
    const id=String(run.id||''),retry=(S.fails[id]|0)>0;
    handle(retry?'run.retry':'run.start',{},run);
    if(!retry){S.runs++;save()}
    break}
   case 'perfect':handle('obstacle.pass',{},run);handle('jump.perfect',{},run);break;
   case 'pass':handle('obstacle.pass',{},run);break;
   case 'corner':handle('corner',{},run);break;
   case 'morph':handle('morph',{},run);break;
   case 'portal':if(now-S.portalAt>1500){S.portalAt=now;handle('portal',{},run)}break;
   case 'item':handle('item',{item:run.lastItem?.kind,assist:!!run.lastItem?.assist},run);break;
   case 'surge':handle('surge',{},run);break;
   case 'shield-break':handle('shield.break',{},run);break;
   case 'hit':hide('hit');break;
   case 'fail':{
    const id=String(run.id||'');S.fails[id]=(S.fails[id]|0)+1;hide('fail');save();break}
   case 'clear':{
    const id=String(run.id||'');delete S.fails[id];hide('clear');save();
    handle('course.clear',{},run);break}
   default:break;
  }
 }
 function onFrame(run){
  if(!enabled||!run||!run.courseRun)return;
  const now=clock();
  let tr=S.tr;
  if(!tr||tr.run!==run){tr=S.tr=newRunState(run,now);S.pending=null;if(S.bubble)hide('run')}
  /* pause -> play with the time spent paused */
  if(run.state==='pause'&&tr.pausedAt===null){tr.pausedAt=now;if(S.bubble)hide('pause')}
  if(run.state==='play'&&tr.pausedAt!==null){const pausedMs=now-tr.pausedAt;tr.pausedAt=null;tr.startedAt+=pausedMs;if(pausedMs>0)handle('run.resume',{pausedMs},run)}
  if(run.state==='play'){
   const ctx=snapshot(run,now);
   if(ctx.actIndex!==tr.actIndex||(!tr.started&&tr.act!==ctx.act)){
    const prev=tr.act;tr.actIndex=ctx.actIndex;tr.act=ctx.act;
    if(prev)handle('act.exit',{act:prev},run);
    handle('act.enter',{act:ctx.act},run);
   }else if(!tr.entered){tr.entered=true;handle('act.enter',{act:ctx.act},run)}
   tr.progress=ctx.progress;
   for(const c of CROSS){if(!tr.crossed.has(c)&&ctx.progress>=c){tr.crossed.add(c);handle('progress',{cross:c},run)}}
   const surge=ctx.tags.has('fever_peak');
   if(tr.surge&&!surge)handle('surge.end',{},run);
   tr.surge=surge;
  }
  tick(run);
 }
 /* ---------- public ---------- */
 function setLevel(level){
  if(!LEVELS.includes(level))return false;
  S.level=level;if(level==='off')hide('off');save();emit('level',{level});return true;
 }
 function reset(){S.history.length=0;S.last.clear();S.counts.clear();S.stamps.length=0;S.lineAt=-1e12;S.quietUntil=0;S.pending=null;S.bubble=null;S.log.length=0;S.stats={events:0,emitted:0,dropped:{},silence:0};S.tr=null}
 load();
 const api={
  config:cfg,entries,
  on,handle,tick,onRunEvent,onFrame,snapshot:(run)=>snapshot(run,clock()),hide,reset,
  setLevel,getLevel:()=>S.level,levels:()=>LEVELS.slice(),
  setReadingScale(x){S.readingScale=clamp(num(x)||1,1,2.5)},
  setGap(ms){cfg.gapMs=clamp(num(ms)||DEFAULTS.gapMs,8000,15000)},
  fails:()=>({...S.fails}),setFails(course,n){if(n>0)S.fails[String(course)]=n|0;else delete S.fails[String(course)];save()},
  history:()=>S.history.slice(),log:()=>S.log.slice(),seen:()=>[...S.seen],stats:()=>({...S.stats,dropped:{...S.stats.dropped},gestures:S.gestureCount}),
  get bubble(){return S.bubble},get pending(){return S.pending},get seed(){return S.seed},rngSample:()=>S.rng(),
  makeRng,hashSeed
 };
 return Object.freeze(api);
}

let inst=null;
function start(){
 if(inst||!enabled)return inst;
 inst=create();
 const bus=root.MongyuPolish;
 if(bus?.on){
  bus.on('run-event',d=>{try{inst.onRunEvent(d?.run,d?.event)}catch(e){try{root.console?.error?.('[MongyuHumor]',e)}catch(_){}}});
  bus.on('frame',d=>{try{inst.onFrame(d?.run)}catch(e){try{root.console?.error?.('[MongyuHumor]',e)}catch(_){}}});
 }
 return inst;
}
const lazy=name=>(...a)=>{const i=start();return i?i[name](...a):undefined};
const api=Object.freeze({enabled,create,start,chapterOf,hazardEta,hashSeed,makeRng,DEFAULTS,KEY,LEVELS,
 setLevel:lazy('setLevel'),getLevel:()=>start()?.getLevel()??'default',on:lazy('on'),handle:lazy('handle'),log:()=>start()?.log()||[],stats:()=>start()?.stats()||null,
 setReadingScale:lazy('setReadingScale'),setGap:lazy('setGap'),history:()=>start()?.history()||[],get instance(){return start()}});
if(enabled)start();
root.MongyuHumor=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
