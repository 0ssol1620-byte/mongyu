(function(){'use strict';
const $=id=>document.getElementById(id),C=QuadRiftContent,P=QuadRiftProgress,canvas=$('game'),ctx=canvas.getContext('2d');
// Old source-only fixtures omit optional modules; the current HTML explicitly requires this one.
const M=typeof QuadRiftOriginRecords==='undefined'?null:QuadRiftOriginRecords;
if(!M&&document.documentElement?.dataset?.originMemories==='required')throw Error('Origin memory module missing');
if(typeof MongyuJourneyAudio==='undefined'&&document.documentElement?.dataset?.journeyAudio==='required')throw Error('Journey audio module missing');
if(typeof MongyuSquareReply==='undefined'&&document.documentElement?.dataset?.squareReply==='required'){const notice=$('status');if(notice){notice.textContent='짧은 사건 모듈을 불러오지 못했습니다. 완전한 게임 파일을 다시 열어 주세요.';notice.className='';notice.hidden=false}throw Error('Square reply module missing')}
if(typeof MongyuDayNight==='undefined'&&document.documentElement?.dataset?.dayNight==='required'){const notice=$('status');if(notice){notice.textContent='해와 달 사건 모듈을 불러오지 못했습니다. 완전한 게임 파일을 다시 열어 주세요.';notice.hidden=false}throw Error('Day night module missing')}
if(typeof MongyuCompanionBridge==='undefined'&&document.documentElement?.dataset?.companionBridge==='required'){const notice=$('status');if(notice){notice.textContent='동행 사건 모듈을 불러오지 못했습니다. 완전한 게임 파일을 다시 열어 주세요.';notice.className='';notice.hidden=false}throw Error('Companion bridge module missing')}
const KEY='quad-rift-hd-r4',BACKUP=KEY+'-backup',RECOVERY=KEY+'-recovery',RECOVERY_BACKUP=KEY+'-backup-recovery';
const systemReduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
let storageOK=true,storageNotice='',lastGoodRaw=null,corruptRaw=null,recoveryArchived=false,corruptBackupRaw=null,recoveryBackupArchived=false;
const defaults=()=>({schema:5,mute:false,reduced:systemReduced,best:0,tutorialStatus:'new',tutorialStep:'approach',campaign:P.create()});
function decode(raw){
 if(!raw)return null;let v;try{v=JSON.parse(raw)}catch(e){return null}
 if(!v||![4,5].includes(v.schema))return null;
 const s=defaults();s.mute=v.mute===true;s.reduced=typeof v.reduced==='boolean'?v.reduced:systemReduced;s.best=Number.isFinite(v.best)?Math.max(0,Math.floor(v.best)):0;
 s.tutorialStatus=['new','learning','skipped','complete'].includes(v.tutorialStatus)?v.tutorialStatus:'new';s.tutorialStep=QuadRiftHD.TUTORIAL_STEPS.includes(v.tutorialStep)?v.tutorialStep:'approach';
 if(v.schema===5){if(!v.campaign||v.campaign.schema!==5||!Array.isArray(v.campaign.completed)||!Array.isArray(v.campaign.riddles)||!v.campaign.records||typeof v.campaign.records!=='object')return null;s.campaign=P.normalize(v.campaign);
  // Do not silently discard a damaged/future progress record; keep its raw bytes.
  for(const k of ['completed','riddles']){const wanted=[...new Set(v.campaign[k])].sort((a,b)=>a-b),got=s.campaign[k].slice().sort((a,b)=>a-b);if(JSON.stringify(wanted)!==JSON.stringify(got))return null}
 }
 return s;
}
let mainRaw=null,backupRaw=null,primaryReadFailed=false,backupReadFailed=false;const settingsTouched=new Set();try{mainRaw=localStorage.getItem(KEY)}catch(e){storageOK=false;primaryReadFailed=true}
try{backupRaw=localStorage.getItem(BACKUP)}catch(e){storageOK=false;backupReadFailed=true}
const primarySave=decode(mainRaw),backupSave=decode(backupRaw);let settings=primarySave||backupSave||defaults();
if(backupRaw&&!backupSave)corruptBackupRaw=backupRaw;
if(primarySave)lastGoodRaw=mainRaw;else if(backupSave){lastGoodRaw=backupRaw;storageNotice='백업에서 진행을 복구했습니다. 원본은 복구 보관함에 보존합니다.'}
if(mainRaw&&!primarySave){corruptRaw=mainRaw;storageNotice=backupSave?storageNotice:'저장 기록을 읽지 못했습니다. 원본을 보존하며 이번 실행의 진행을 별도로 유지합니다.'}
if(backupRaw&&!backupSave&&!primarySave&&!mainRaw){corruptRaw=backupRaw;storageNotice='백업을 읽지 못했습니다. 원본을 보존하며 이번 실행에서 계속할 수 있습니다.'}
const game=new QuadRiftHD.Game({levelId:settings.campaign.selected,best:settings.best,tutorialDone:['skipped','complete'].includes(settings.tutorialStatus),tutorialStep:settings.tutorialStep});
const MODE_CONTROLS={'morph-floor':{name:'움직이는 바닥',action:'점프',cue:'바닥이 끊긴 틈과 솟는 벽 앞에서 점프합니다. 천장 아래에서는 누르지 마세요.'},'wave-run':{name:'물결 달리기',action:'물결 점프',cue:'물결의 경사를 보며 벽 앞에서 점프합니다. 낮은 천장 아래는 달려서 통과하세요.'},'four-room':{name:'네 방 동시 달리기',action:'함께 점프',cue:'한 번 누르면 네 사람이 함께 뜁니다. 다음 위험이 오는 방의 말풍선을 보세요.'},'throw-arena':{name:'투척 대결',action:'던지기',cue:'누르면 사각 탄환을 던집니다. 움직이는 보스와 높이가 맞을 때 쏘세요.'},'dodge-arena':{name:'돌진 피하기',action:'차선 바꾸기',cue:'누를 때마다 다음 차선으로 이동합니다. 예고된 돌진을 피해 벽에 부딪히게 하세요.'},'kick-arena':{name:'부양 발차기',action:'점프 / 킥',cue:'한 번 눌러 도약, 공중에서 다시 눌러 발차기합니다. 보스에 실제로 닿아야 합니다.'}};
function controls(){if(game.mode==='origin-route')return {name:'사각의 꿈',action:'점프',cue:'네 변을 따라 자동으로 달리고, 모서리도 자동으로 돌아갑니다. 바닥 장벽 앞에서는 눌러 점프하고, 낮은 천장 아래는 누르지 않고 지나가세요.'};return MODE_CONTROLS[game.gameMode]||{name:'안전 연습',action:'점프',cue:'화면·Space·Enter로 점프합니다.'}}
let selectedId=settings.campaign.selected,chapter=C.getLevel(selectedId).chapter,collectionOpen=false,dialog=null,returnFocus=null,activeRiddle=null,missionIsResult=false;
const HERO_LEVELS=Object.freeze([4,5,10]);
let hero=null;
// Independent route namespace: never turn route checkpoints into R5/R6 clears.
const ORIGIN_KEY='mongyu-origin-route-v1',ORIGIN_BACKUP=ORIGIN_KEY+'-backup';
let originProgress={schema:2,checkpoint:0,finaleUnlocked:false,completed:false,introDone:['complete','skipped'].includes(settings.tutorialStatus)},originStorageOK=true,originLastGood=null;
function originActive(){return ['origin-route','origin-finale'].includes(game.mode)}
function decodeOrigin(raw){try{const v=JSON.parse(raw);if(!v||![1,2].includes(v.schema)||!Number.isInteger(v.checkpoint)||v.checkpoint<0||v.checkpoint>3||typeof v.completed!=='boolean'||v.schema===2&&typeof v.finaleUnlocked!=='boolean'||v.schema===2&&v.completed&&!v.finaleUnlocked)return null;return {schema:2,checkpoint:v.checkpoint,finaleUnlocked:v.schema===1?v.completed:v.finaleUnlocked,completed:v.schema===2&&v.completed,introDone:v.introDone===true||v.checkpoint>0||v.completed||v.finaleUnlocked===true}}catch(e){return null}}
function mergeOrigin(v){if(v){originProgress.checkpoint=Math.max(originProgress.checkpoint,v.checkpoint);originProgress.completed=originProgress.completed||v.completed;originProgress.finaleUnlocked=originProgress.finaleUnlocked||v.finaleUnlocked;originProgress.introDone=originProgress.introDone||v.introDone}}
try{const raw=localStorage.getItem(ORIGIN_KEY),backup=localStorage.getItem(ORIGIN_BACKUP),a=decodeOrigin(raw),b=decodeOrigin(backup);mergeOrigin(a);mergeOrigin(b);originLastGood=a?raw:b?backup:null;if(raw&&!a||backup&&!b)originStorageOK=false}catch(e){originStorageOK=false}
function writeOrigin(){try{
 // Re-read before writing: inaccessible or corrupt copies are never treated as empty.
 for(const key of [ORIGIN_KEY,ORIGIN_BACKUP]){const raw=localStorage.getItem(key),v=decodeOrigin(raw);if(v)mergeOrigin(v);else if(raw){const archive=key+'-recovery',old=localStorage.getItem(archive);if(old&&old!==raw)throw Error('route archive occupied');if(!old)localStorage.setItem(archive,raw);if(localStorage.getItem(archive)!==raw)throw Error('route archive failed')}}
 const next=JSON.stringify(originProgress),backupNext=JSON.stringify(decodeOrigin(originLastGood))===next?originLastGood:next;localStorage.setItem(ORIGIN_BACKUP,backupNext);if(localStorage.getItem(ORIGIN_BACKUP)!==backupNext)throw Error('route backup failed');localStorage.setItem(ORIGIN_KEY,next);if(localStorage.getItem(ORIGIN_KEY)!==next)throw Error('route save failed');originLastGood=next;originStorageOK=true;
 }catch(e){originStorageOK=false}storageMessage();return originStorageOK}
// Memories have their own storage and a volatile run token. No legacy migration, no saved eligibility.
const MEMORY_KEY='mongyu-origin-memories-v1',MEMORY_BACKUP=MEMORY_KEY+'-backup';
let memoryStore=M?M.create():null,memoryStorageOK=true,memoryReadOnly=false,memoryDirty=false,memorySession=null,memoryOutcome=null,memoryParent=null,memoryIntroChapter;
const memoryConsumed=new WeakSet();
function memoryCompatible(v){if(!M||!v||v.schema!==M.VERSION)return null;const records={...v.records};for(const memory of M.MEMORIES)if(records[memory.id]?.schema>M.RECORD_VERSION)delete records[memory.id];return M.normalize({...v,records})}
function readMemories(){
 if(!M)return [];const copies=[];let okay=true,readOnly=false;
 for(const key of [MEMORY_KEY,MEMORY_BACKUP]){try{
  const raw=localStorage.getItem(key),value=raw?M.decode(raw):null;copies.push({key,raw,value});let recoverable=value;
  // A damaged known record must not erase its valid neighbors. Keep the raw
  // copy marked corrupt (and archive it before writes), while recovering only
  // supported evidence. Unknown future semantics still make the copy readonly.
  if(!recoverable&&raw){try{const v=JSON.parse(raw);if(v?.schema===M.VERSION&&v.kind==='origin-memories'&&v.provenance===M.PROVENANCE&&v.records&&typeof v.records==='object'&&!Array.isArray(v.records))recoverable=M.normalize(v)}catch(e){}}
  if(recoverable){readOnly=readOnly||M.summarize(recoverable).readOnly;const compatible=memoryCompatible(recoverable);if(compatible)memoryStore=M.merge(memoryStore,compatible)}
 }catch(e){okay=false}}
 memoryStorageOK=okay&&!readOnly&&!memoryDirty&&copies.every(c=>!c.raw||c.value);memoryReadOnly=readOnly;return okay?copies:null;
}
function writeMemories(){
 if(!M)return false;const copies=readMemories();if(!copies||memoryReadOnly){memoryStorageOK=false;return false}
 try{
  // Preflight both archives before touching either live copy. Unknown bytes are never discarded.
  // recordVersion 2 already archived schema1 originals; v3 must not re-archive
  // its rewritten wrapper into the occupied original history-v1 slot.
  const archives=copies.filter(c=>c.raw&&(!c.value||![2,M.RECORD_VERSION].includes(c.value.recordVersion)&&M.MEMORIES.some(m=>c.value.records?.[m.id]?.schema===1))).map(c=>{
   // Preserve the exact historical bytes before a newer proof can replace them.
   const archive=c.key+(c.value?'-history-v1':'-recovery');return {...c,archive,saved:localStorage.getItem(archive)};
  });
  for(const c of archives)if(c.saved&&c.saved!==c.raw)throw Error('memory archive occupied');
  for(const c of archives){if(!c.saved)localStorage.setItem(c.archive,c.raw);if(localStorage.getItem(c.archive)!==c.raw)throw Error('memory archive failed')}
  const next=JSON.stringify({...memoryStore,recordVersion:M.RECORD_VERSION});localStorage.setItem(MEMORY_BACKUP,next);if(localStorage.getItem(MEMORY_BACKUP)!==next)throw Error('memory backup failed');localStorage.setItem(MEMORY_KEY,next);if(localStorage.getItem(MEMORY_KEY)!==next)throw Error('memory save failed');memoryStorageOK=true;memoryDirty=false;
 }catch(e){memoryStorageOK=false}return memoryStorageOK;
}
if(M)readMemories();
function invalidateMemory(reason){if(memorySession){memorySession.eligible=false;memorySession.phase='interrupted';memorySession.reason=reason;memorySession.route=null}}
function beginMemory(chapterIndex){memoryOutcome=null;memorySession={eligible:chapterIndex===0,phase:'route',reason:chapterIndex===0?'':'checkpoint',startChapter:chapterIndex,startPending:true,route:null}}
function memoryView(){
 if(!M)return null;const summary=M.summarize(memoryStore),route=memorySession?.route,liveRoute=game.mode==='origin-route'&&['play','pause'].includes(game.state),routeScore=route?.score??(liveRoute?game.score:memoryOutcome?.record?.routeScore??0),routeHits=route?.hits??(liveRoute?game.metrics.hits:memoryOutcome?.record?.routeHits??0),finaleHits=game.mode==='origin-finale'?game.metrics.hits:memoryOutcome?.record?.finaleHits??0;
 return {...summary,available:true,storageOK:memoryStorageOK,readOnly:memoryReadOnly,dirty:memoryDirty,session:{eligible:memorySession?.eligible===true,phase:memorySession?.phase||'idle',reason:memorySession?.reason||'',startChapter:memorySession?.startChapter??null,routeScore,routeHits,finaleHits,totalHits:routeHits+finaleHits},last:memoryOutcome?{eligible:memoryOutcome.eligible,reason:memoryOutcome.reason,earned:[...memoryOutcome.earned]}:null};
}
function collectMemoryResult(result){
 if(!M||!result||typeof result!=='object'||memoryConsumed.has(result))return 0;memoryConsumed.add(result);
 const eligible=game.state==='clear'&&game.mode==='origin-finale'&&game.boss?.hp===0&&game.metrics.bossDamage===game.boss.maxHp&&memorySession?.eligible===true&&memorySession.phase==='finale'&&!!memorySession.route&&result.routeStats===memorySession.route&&game.originTravelResult===memorySession.route;
 memoryOutcome=M.evaluate(result,{sessionEligible:eligible});const before=M.summarize(memoryStore).obtained;
 if(memoryOutcome.eligible){memoryStore=M.complete(memoryStore,result,{sessionEligible:true});memoryDirty=true;writeMemories()}
 if(memorySession){memorySession.eligible=false;memorySession.phase=memoryOutcome.eligible?'complete':'interrupted';memorySession.reason=memoryOutcome.reason||''}
 return M.summarize(memoryStore).obtained-before;
}
function renderMemories(){
 if(!M)return;const v=memoryView(),run=v.session;$('memoriesCount').textContent='찾은 기억 '+v.obtained+' / '+v.total;
 $('memoriesProgress').textContent=run.eligible?(run.phase==='finale'?'마지막 방 · 길 '+run.routeScore+'점 · 전체 부딪힘 '+run.totalHits+'회':'이번 여정 · '+Math.floor(game.distance/C.originRoute.length*100)+'% · 길 '+run.routeScore+'점 · 부딪힘 '+run.routeHits+'회'):run.phase==='complete'?'이번 여정 · 길 '+run.routeScore+'점 · 전체 부딪힘 '+run.totalHits+'회. 찾은 기억을 확인하세요.':'첫 구간부터 네 구간을 달리고 마지막 방을 통과하면 기억이 남습니다. 중간 체크포인트에서 시작하거나 마지막 방만 다시 하면 포함되지 않습니다.';
 for(const card of v.memories){const id='memory-'+card.id,record=card.record;$(id).dataset.earned=String(card.earned);$(id+'-title').textContent=card.title;$(id+'-state').textContent=card.earned?'찾음':'아직 잠김';$(id+'-description').textContent=card.description;$(id+'-progress').textContent=card.earned?'길 '+record.routeScore+'점 · 전체 부딪힘 '+record.hits+'회':!run.eligible&&run.phase!=='complete'?'처음부터 도전해 이 기억을 찾아보세요.':card.id==='journey'?(run.phase==='finale'?'네 구간 통과 · 마지막 방의 보스를 쓰러뜨리세요.':'네 구간을 지나 마지막 방까지 달려보세요.'):card.id==='unbroken'?'전체 부딪힘 '+run.totalHits+'회 / 0회'+(run.phase==='complete'?' · 처음부터 다시 도전해 보세요.':' · 길과 마지막 방을 모두 포함합니다.'):'길 점수 '+run.routeScore+' / '+M.SCORE_TARGET+(run.phase==='complete'?' · 다음 도전에서 길 점수를 더 모아보세요.':' · 마지막 방 격파도 필요합니다.')}
 $('memoriesNotice').textContent=v.readOnly?'더 새로운 기억 기록을 보호하고 있습니다. 이번에 찾은 기억은 이 화면에만 남습니다.':!v.storageOK?'기기에 아직 저장하지 못했습니다. 이번에 찾은 기억은 이 화면에 남아 있습니다.':v.dirty?'이번에 찾은 기억을 기기에 저장하지 못했습니다.':'찾은 기억은 이 기기에 저장됩니다.';
 $('memoriesClose').textContent=memoryParent==='settings'?'설정으로 돌아가기':'결과로 돌아가기';
}
function openMemories(trigger){if(!M)return false;memoryParent=dialog==='settings'?'settings':null;if(game.state==='play'){game.pause();events();stopSound()}if(memoryDirty)writeMemories();else readMemories();renderMemories();modal('memories',trigger||$('resultDetails'));sync();$('memoriesClose').focus();return true}
function startMemoryChallenge(event){memoryParent=null;return startOrigin(event,0)}
// Checkpoint selection is a paused system screen, never an in-play speech panel.
let journeySelection=0;
function journeyUnlocked(index){return Number.isInteger(index)&&index>=0&&index<=4&&(index===4?originProgress.finaleUnlocked:index<=originProgress.checkpoint)}
function renderJourney(){
 for(let i=0;i<5;i++){const button=$('journey-'+i),unlocked=journeyUnlocked(i);button.disabled=!unlocked;button.setAttribute('aria-pressed',String(i===journeySelection));button.textContent=(i===4?'마지막 방':(i+1)+'. '+C.originRoute.chapters[i].name)+(unlocked?'':' · 아직 도착하지 않음')}
 $('journeyNotice').textContent=(journeySelection===0?'처음부터 마지막 방까지 한 번에 통과하면 세 가지 기억에 도전할 수 있습니다.':'중간 구간 연습입니다. 여기서 시작한 여정은 기억 수집에 포함되지 않습니다.')+' 가장 멀리 도착한 체크포인트와 이미 찾은 기억은 유지됩니다.';
 $('journeyStart').textContent=journeySelection===0?'처음부터 시작':'선택한 구간에서 시작';
}
function openJourney(){
 if(game.state==='play'){game.pause();events();stopSound()}
 journeySelection=originProgress.finaleUnlocked&&!originProgress.completed?4:originProgress.completed?0:originProgress.checkpoint;
 renderJourney();modal('journey',$('journeyOpen'));sync();$('journey-'+journeySelection).focus();return true;
}
function selectJourney(index){if(dialog!=='journey'||!journeyUnlocked(index))return false;journeySelection=index;renderJourney();return true}
function startJourney(event){if(dialog!=='journey'||!journeyUnlocked(journeySelection))return false;return journeySelection===4?startFinale(event,true):startOrigin(event,journeySelection)}
let originStart=0,originLearning=false,bridgeUsed=false,replyUsed=false,dayNightUsed=false,replyReturnPending=false,bridgeBlockUntil=-1;
// R22 narrative facts belong only to this live run, never engine results or storage.
let narrative={replySolved:false,companionCrossed:false,dayNightCrossed:false,routeComplete:false,fullRoute:false};
function clearNarrative(){narrative={replySolved:false,companionCrossed:false,dayNightCrossed:false,routeComplete:false,fullRoute:false}}
function finaleEpilogue(){
 if(game.mode!=='origin-finale'||game.state!=='clear')return [];
 const lines=['문지기를 넘어섰다.',narrative.fullRoute?'네 구간을 지나 마지막 방을 통과했다.':narrative.routeComplete?'이어 달린 길 끝, 마지막 방을 통과했다.':'이번 도전에서 마지막 방을 통과했다.'];
 if(narrative.replySolved)lines.push(narrative.companionCrossed?'답신으로 길을 열고,':'돌려보낸 답신이 길을 열어 주었다.');
 if(narrative.companionCrossed)lines.push('서로 길이 되어, 둘이 함께 건넜다.');
 if(narrative.dayNightCrossed)lines.push('낮에 올라, 밤에 열린 출구를 건넜다.');
 if(!narrative.replySolved&&!narrative.companionCrossed&&!narrative.dayNightCrossed)lines.push('문 너머에서 잠시 숨을 고른다.');
 return lines;
}
const bridgeHeldKeys=new Set();
// Presentation-only, per-run discovery. Separate from urgent gameplay feedback and save data.
const invitationSeen=new Set();let invitationQuietUntil=0;
function clearInvitationAnnouncement(){const node=$('invitationStatus');if(node&&node.textContent)node.textContent=''}
function dayNightActive(){return !!window.QUAD_RIFT_APP?.dayNight?.active}
function dayNightAvailable(){return typeof MongyuDayNight!=='undefined'&&!dayNightUsed&&!collectionOpen&&!dialog&&!bridgeActive()&&!replyActive()&&game.mode==='origin-route'&&['play','pause'].includes(game.state)&&game.originStatus()?.chapterIndex===3}
function bridgeActive(){return !!window.QUAD_RIFT_APP?.companionBridge?.active}
function bridgeAvailable(){return typeof MongyuCompanionBridge!=='undefined'&&!bridgeUsed&&!collectionOpen&&!dialog&&game.mode==='origin-route'&&['play','pause'].includes(game.state)&&game.originStatus()?.chapterIndex===2}
function replyActive(){return !!window.QUAD_RIFT_APP?.squareReply?.active}
function replyAvailable(){return typeof MongyuSquareReply!=='undefined'&&!replyUsed&&!collectionOpen&&!dialog&&game.mode==='origin-route'&&['play','pause'].includes(game.state)&&game.originStatus()?.chapterIndex===1}
function syncBridgeInvitation(){
 const available=!bridgeActive()&&!replyActive()&&!dayNightActive(),bridge=available&&bridgeAvailable(),reply=available&&replyAvailable(),dayNight=available&&dayNightAvailable();
 if($('bridgeInvitation'))$('bridgeInvitation').hidden=!(bridge||reply||dayNight);
 if($('bridgeOpen'))$('bridgeOpen').hidden=!bridge;if($('replyJourneyOpen'))$('replyJourneyOpen').hidden=!reply;
 if($('dayNightOpen'))$('dayNightOpen').hidden=!dayNight;
 const kind=reply?'reply':bridge?'bridge':dayNight?'dayNight':null,node=$('invitationStatus');
 if(!kind){clearInvitationAnnouncement();return}
 // A quiet interval keeps chapter/start/urgent cues first. Never steal focus or write #status.
 if(node&&!document.hidden&&!invitationSeen.has(kind)&&viewTime>=invitationQuietUntil){
  node.textContent=(reply?'모서리의 답신':dayNight?'해와 달의 틈':'동행의 손짓')+'. 선택 곁길을 열 수 있습니다. 들어가면 여정이 일시정지되고 같은 달리기로 돌아옵니다. 별도 기록·보상은 없습니다.';
  invitationSeen.add(kind);
 }
}
function leaveBridge(){if(dayNightActive())window.QUAD_RIFT_APP.dayNight.close();if(bridgeActive())window.QUAD_RIFT_APP.companionBridge.close();if(replyActive())window.QUAD_RIFT_APP.squareReply.close()}

function leaveOriginIntro(){if(!originLearning)return;originLearning=false;game.tutorialDone=['complete','skipped'].includes(settings.tutorialStatus);game.savedStep=settings.tutorialStep}
function startOriginIntro(event){leaveBridge();clearNarrative();invalidateMemory('intro');grantAudio(event);stopSound();modal(null);collectionOpen=false;originLearning=true;game.beginTutorial('approach');resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});return true}
function startOrigin(event,chapterIndex){
 leaveBridge();clearNarrative();bridgeUsed=false;replyUsed=false;dayNightUsed=false;replyReturnPending=false;invitationSeen.clear();clearInvitationAnnouncement();invitationQuietUntil=viewTime+1;
 if(!originProgress.introDone){memoryIntroChapter=chapterIndex;return startOriginIntro(event)}leaveOriginIntro();
 if(chapterIndex===undefined&&originProgress.finaleUnlocked&&!originProgress.completed)return startFinale(event);if(chapterIndex===undefined)chapterIndex=originProgress.completed?0:originProgress.checkpoint;
 grantAudio(event);if(hero?.active)leaveHero();stopSound();modal(null);collectionOpen=false;originStart=Math.max(0,Math.min(originProgress.checkpoint,Math.floor(chapterIndex)||0));beginMemory(originStart);game.startOrigin(originStart);resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});announce(controls().cue);return true;
}

function startFinale(event,direct=false){if(!originProgress.finaleUnlocked)return false;leaveBridge();if(direct||game.mode!=='origin-finale'||game.state==='title')clearNarrative();invalidateMemory('finale-retry');grantAudio(event);if(hero?.active)leaveHero();stopSound();modal(null);collectionOpen=false;const travel=game.mode==='origin-finale'?game.originTravelResult:null;game.startOriginFinale(travel);resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});return true}

let audio=null,audioGesture=false,audioGeneration=0,audioPending=null,audioBlocked=false,musicPhase=null,musicAccent=false,acc=0,last=null,viewTime=0;let cachedProgress=null,cachedView=null;let resultClockKey=null,resultElapsed=0;
function syncResultClock(){const key=game.state==='clear'&&game.gameMode==='kick-arena'?game.result:null;if(key!==resultClockKey){resultClockKey=key;resultElapsed=0}return key}
function campaignView(){if(cachedProgress!==settings.campaign){cachedProgress=settings.campaign;const clearedIds=new Set(settings.campaign.completed),solvedIds=new Set(settings.campaign.riddles),unlockedIds=new Set(C.levels.filter(l=>l.id===1||clearedIds.has(l.id-1)&&(l.chapter===1||solvedIds.has(l.chapter-1))).map(l=>l.id)),summary={completed:clearedIds.size,currentCompleted:[...clearedIds].filter(id=>settings.campaign.records[id]?.contentVersion===6).length,legacyCompleted:[...clearedIds].filter(id=>settings.campaign.records[id]?.contentVersion===5).length,total:100,solved:solvedIds.size,unlocked:unlockedIds.size,nextLevel:[...unlockedIds].find(id=>!clearedIds.has(id))||null,finished:clearedIds.size===100&&solvedIds.size===10};cachedView={unlockedIds,clearedIds,summary}}return cachedView}const voices=new Set(),savedResults=new WeakSet();
function storageMessage(){const message=!originStorageOK?'사각의 꿈 진행을 아직 저장하지 못했습니다. 현재 실행에서는 계속할 수 있습니다.':!storageOK?'저장 불가 · 기록은 현재 실행에 남아 있습니다. 저장 공간·권한 복구 후 다시 저장합니다.':storageNotice;$('storage').hidden=!message;$('storage').textContent=message;$('saveState').textContent='사각의 꿈 · '+(originProgress.completed?'여정 완료':originProgress.finaleUnlocked?'마지막 방에서 이어가기':(originProgress.checkpoint+1)+'번째 구간부터 이어가기')+' / 수집 '+campaignView().summary.completed+'/100 · 새 방식 '+campaignView().summary.currentCompleted+'/100 · 수수께끼 '+campaignView().summary.solved+'/10'+(!storageOK?' · 아직 저장되지 않은 진행이 있습니다':' · 기기에 저장됩니다')}
function mergeRecovered(prior){
 if(!prior)return;settings.best=Math.max(settings.best,prior.best);for(const key of ['mute','reduced'])if(!settingsTouched.has(key))settings[key]=prior[key];
 const ranks={new:0,learning:1,skipped:2,complete:3};if(ranks[prior.tutorialStatus]>ranks[settings.tutorialStatus]){settings.tutorialStatus=prior.tutorialStatus;settings.tutorialStep=prior.tutorialStep}else if(prior.tutorialStatus===settings.tutorialStatus&&prior.tutorialStatus==='learning'&&QuadRiftHD.TUTORIAL_STEPS.indexOf(prior.tutorialStep)>QuadRiftHD.TUTORIAL_STEPS.indexOf(settings.tutorialStep))settings.tutorialStep=prior.tutorialStep;
 // Match P.complete: a current-rules clear wins before comparing scores. Keep
 // one whole verified run; never combine favorable fields from different runs.
 const better=(candidate,previous)=>!previous||candidate.contentVersion>previous.contentVersion||candidate.contentVersion===previous.contentVersion&&(candidate.score>previous.score||candidate.score===previous.score&&(candidate.hits<previous.hits||candidate.hits===previous.hits&&candidate.time<previous.time));
 const a=prior.campaign,b=settings.campaign,records={...a.records};for(const id of Object.keys(b.records))if(better(b.records[id],records[id]))records[id]=b.records[id];const hints={...a.hints};for(const id of Object.keys(b.hints))hints[id]=Math.max(hints[id]||0,b.hints[id]);settings.campaign=P.normalize({schema:5,completed:[...new Set([...a.completed,...b.completed])],riddles:[...new Set([...a.riddles,...b.riddles])],records,hints,selected:b.selected});game.best=Math.max(game.best,settings.best);if(['complete','skipped'].includes(settings.tutorialStatus))game.tutorialDone=true;
}
function write(){
 try{
  // A read failure is not an empty save. Re-read and reconcile before any write.
  if(primaryReadFailed||backupReadFailed){const raw=localStorage.getItem(KEY),backup=localStorage.getItem(BACKUP),good=decode(raw),goodBackup=decode(backup);mergeRecovered(goodBackup);mergeRecovered(good);if(raw&&!good){if(corruptRaw!==null&&corruptRaw!==raw)throw Error('읽지 못한 원본이 추가로 있습니다');corruptRaw=raw;recoveryArchived=false}else if(!raw&&backup&&!goodBackup){if(corruptRaw!==null&&corruptRaw!==backup)throw Error('읽지 못한 백업이 추가로 있습니다');corruptRaw=backup;recoveryArchived=false}if(backup&&!goodBackup){if(corruptBackupRaw!==null&&corruptBackupRaw!==backup)throw Error('읽지 못한 백업 원본이 추가로 있습니다');corruptBackupRaw=backup;recoveryBackupArchived=false}lastGoodRaw=good?raw:goodBackup?backup:null;primaryReadFailed=false;backupReadFailed=false;storageNotice=raw||backup?'저장 접근이 복구되어 기존 기록과 이번 진행을 함께 보존했습니다.':''}
  settings.schema=5;if(!hero?.active&&!originActive())settings.best=Math.max(settings.best,game.best);settings.campaign=P.normalize(settings.campaign);const next=JSON.stringify(settings);
  if(corruptRaw!==null&&!recoveryArchived){const archived=localStorage.getItem(RECOVERY);if(archived&&archived!==corruptRaw)throw Error('이전 복구 원본을 보존해야 합니다');if(!archived)localStorage.setItem(RECOVERY,corruptRaw);if(localStorage.getItem(RECOVERY)!==corruptRaw)throw Error('복구 원본 보관 확인 실패');recoveryArchived=true}
  if(corruptBackupRaw!==null&&!recoveryBackupArchived){const archived=localStorage.getItem(RECOVERY_BACKUP);if(archived&&archived!==corruptBackupRaw)throw Error('이전 백업 복구 원본을 보존해야 합니다');if(!archived)localStorage.setItem(RECOVERY_BACKUP,corruptBackupRaw);if(localStorage.getItem(RECOVERY_BACKUP)!==corruptBackupRaw)throw Error('백업 복구 원본 보관 확인 실패');recoveryBackupArchived=true}
  // A durable previous-good copy is written before primary, including first migration.
  localStorage.setItem(BACKUP,lastGoodRaw||next);localStorage.setItem(KEY,next);
  if(localStorage.getItem(KEY)!==next)throw Error('저장 확인 실패');lastGoodRaw=next;storageOK=true;
 }catch(e){storageOK=false}
 writeOrigin();storageMessage();fit();return storageOK;
}
function fit(){const box=$('stage'),scale=Math.max(.01,Math.min(box.clientWidth/360,box.clientHeight/480)),w=360*scale,h=480*scale,dpr=Math.max(1,Math.min(3,window.devicePixelRatio||1)),bw=Math.max(1,Math.round(w*dpr)),bh=Math.max(1,Math.round(h*dpr));canvas.style.width=w+'px';canvas.style.height=h+'px';$('collection').style.width=w+'px';$('collection').style.height=h+'px';$('collection').className='collection-layer'+(scale<.89?' compact':'');if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh}canvas.dataset.dpr=String(dpr);canvas.dataset.logicalSize='360x480';}
function draw(){syncResultClock();ctx.setTransform(canvas.width/360,0,0,canvas.height/480,0,0);QuadRiftArt.draw(ctx,game,{reduced:settings.reduced,time:viewTime,resultElapsed,epilogue:finaleEpilogue(),outcome:{...narrative},collection:collectionOpen?{chapter,progress:settings.campaign,selectedId,time:viewTime,reduced:settings.reduced,...campaignView()}:null})}
function announce(message){clearInvitationAnnouncement();invitationQuietUntil=viewTime+1;$('status').textContent=message}
function grantAudio(event){if(event?.isTrusted===true){audioGesture=true;audioBlocked=false}}
function audioAllowed(){return !settings.mute&&audioGesture&&game.state==='play'&&!dialog&&!collectionOpen&&!document.hidden}
function releaseVoice(o){voices.delete(o);o.onended=null;try{o.stop()}catch(e){}try{o.disconnect();o._gain?.disconnect()}catch(e){}}
function stopSound(){audioGeneration++;audioPending=null;musicPhase=null;musicAccent=false;for(const o of [...voices])releaseVoice(o);if(audio)try{Promise.resolve(audio.suspend()).catch(()=>{})}catch(e){}}
function readyAudio(){
 if(!audioAllowed()||audioBlocked)return false;
 try{if(!audio){const Context=window.AudioContext||window.webkitAudioContext;if(!Context){audioBlocked=true;return false}audio=new Context()}
 if(audioPending)return false;if(audio.state==='running')return true;
 if(audio.state==='closed'){audioBlocked=true;return false}
 if(!audioPending){const generation=audioGeneration,token={generation};audioPending=token;Promise.resolve(audio.resume()).then(()=>{if(!audioAllowed())return audio.suspend();/* A newer valid session owns the running context; never schedule stale notes. */}).catch(()=>{if(generation===audioGeneration)audioBlocked=true}).finally(()=>{if(audioPending===token)audioPending=null})}
 }catch(e){audioPending=null;audioBlocked=true}return false;
}
function musicNote(note){
 if(!readyAudio()||voices.size>=8)return;
 const role=note.accent?'accent':'music';if([...voices].some(o=>o._role===role))return;
 let o;try{const data=MongyuJourneyAudio.pcm(note,audio.sampleRate),buffer=audio.createBuffer(1,data.length,audio.sampleRate);buffer.getChannelData(0).set(data);o=audio.createBufferSource();o.buffer=buffer;o._role=role;o.connect(audio.destination);voices.add(o);o.onended=()=>releaseVoice(o);o.start();o.stop(audio.currentTime+note.duration)}catch(e){if(o)releaseVoice(o)}
}
function journeyMusic(){
 if(!audioAllowed()||!['origin-route','origin-finale'].includes(game.mode)||typeof MongyuJourneyAudio==='undefined')return;
 const beat=Math.floor(game.time*2),phase=game.mode+':'+beat;
 if(phase===musicPhase)return;musicPhase=phase;
 const chapter=game.mode==='origin-finale'?4:game.originStatus()?.chapterIndex||0;
 musicNote(MongyuJourneyAudio.score(beat,chapter));if(musicAccent)musicNote(MongyuJourneyAudio.score(beat,chapter,true));musicAccent=false;
}
function sound(kind){if(!audioAllowed())return;const frequency={'hero-beat':hero?.index===2?[130.81,196,164.81,196][Math.floor(game.time*2)%4]:hero?.index===1?[164.81,196,261.63,196][Math.floor(game.time*2)%4]:[130.81,164.81,196,164.81][Math.floor(game.time*2)%4],jump:370,hit:115,pass:570,start:260,resume:260,clear:740,fail:90,'boss-strike':820,'throw':430,'dodge':300,'kick':650,'deflect':1040,'boss-wall-impact':145,'attack-telegraph':220,'boss-projectile':185,'boss-damage':840,'tutorial-progress':510,'tutorial-complete':690,'tutorial-retry':230}[kind];if(!frequency)return;if(voices.size>=8){const music=[...voices].find(o=>o._role==='accent'||o._role==='music');if(music)releaseVoice(music);else return;}try{if(!readyAudio())return;const t=audio.currentTime,o=audio.createOscillator(),v=audio.createGain(),impact=['hit','boss-wall-impact'].includes(kind);o.type=impact?'triangle':kind==='throw'?'square':'sine';o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(frequency*(kind==='jump'||kind==='kick'?1.6:kind==='deflect'?1.15:.72),t+.09);v.gain.setValueAtTime(.001,t);v.gain.linearRampToValueAtTime(kind==='hero-beat'?.012:kind==='attack-telegraph'?.022:.04,t+.01);v.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(v);v.connect(audio.destination);o._role='fx';o._gain=v;voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();v.disconnect()};o.start();o.stop(t+.14)}catch(e){}}
function modal(name,trigger){if(name)stopSound();dialog=name;returnFocus=trigger||returnFocus||$('options');for(const id of ['settings','mission','riddle','memories','journey']){const node=$(id);if(node)node.hidden=id!==name;}for(const id of ['top','stage','bar']){$(id).inert=!!name;$(id).setAttribute('aria-hidden',String(!!name))}canvas.tabIndex=name||collectionOpen?-1:0;}
function closeDialog(){if(dialog==='journey'){modal('settings',$('options'));sync();$('journeyOpen').focus({preventScroll:true});return true}if(dialog==='memories'&&memoryParent==='settings'){memoryParent=null;modal('settings',$('options'));sync();$('memoriesOpen').focus({preventScroll:true});return true}memoryParent=null;const target=returnFocus;modal(null);sync();if(target&&!target.hidden&&!target.disabled)target.focus({preventScroll:true});else if(collectionOpen)$('collectionPlay').focus();else canvas.focus({preventScroll:true});return true}
function updateCollection(){
 $('collection').hidden=!collectionOpen;$('chapterPrev').disabled=chapter===1;$('chapterNext').disabled=chapter===10;
 const ch=C.chapters[chapter-1],view=campaignView();$('compactTitle').textContent='제 '+chapter+'장 · '+ch.name+' · '+view.summary.completed+'/100';$('collection').setAttribute('aria-label','제 '+chapter+'장 '+ch.name+'. '+(chapter*10-9)+'번부터 '+chapter*10+'번 꿈. 방향키로 선택, Enter로 자세히 보기.');
 for(let slot=1;slot<=10;slot++){const level=C.getLevel((chapter-1)*10+slot),b=$('level-'+slot),row=Math.floor((slot-1)/2),col=(slot-1)%2;b.style.left=(col?184:20)/360*100+'%';b.style.top=(98+row*56)/480*100+'%';b.style.width=156/360*100+'%';b.style.height=50/480*100+'%';const cleared=view.clearedIds.has(level.id),unlocked=view.unlockedIds.has(level.id),state=cleared?(settings.campaign.records[level.id]?.contentVersion===5?'이전판 완료':'완료'):unlocked?'도전 가능':'잠김';$('levelText-'+slot).textContent=String(level.id).padStart(3,'0')+' '+level.name+' · '+state+(level.isBoss?' · 보스':'');b.setAttribute('aria-label',String(level.id).padStart(3,'0')+' '+level.name+(level.isBoss?' 보스':'')+'. '+state+'. '+level.objectives.map(o=>o.text).join(', '));b.setAttribute('aria-pressed',String(level.id===selectedId));b.dataset.level=String(level.id)}
 const solved=settings.campaign.riddles.includes(ch.riddleId);$('chapterRiddle').textContent=solved?'수수께끼 해결 ✓':'장의 수수께끼';
}
function sync(){
 const epilogue=finaleEpilogue(),epilogueNode=$('finaleEpilogue');if(epilogueNode){epilogueNode.hidden=!epilogue.length||collectionOpen||!!dialog;epilogueNode.textContent=epilogue.join(' ')}
 syncBridgeInvitation();fit();if($('replyOpen'))$('replyOpen').hidden=game.state!=='title'||collectionOpen||!!dialog;const s=game.state,tut=game.mode==='tutorial',result=s==='fail'||s==='clear';updateCollection();
 $('resultDetails').hidden=collectionOpen||!result||tut||!!hero?.active||(originActive()&&!M);$('resultDetails').textContent=originActive()?'찾은 기억':'미션 결과';if($('memoriesOpen')){$('memoriesOpen').hidden=!M;$('memoriesOpen').textContent=M?'사각의 꿈 · 기억 '+M.summarize(memoryStore).obtained+'/3':'사각의 꿈 · 기억'}
 $('heroStart').hidden=true;$('heroExit').hidden=!hero?.active;$('heroStart').textContent='짧은 꿈 체험';$('heroExit').textContent='체험 나가기';
 $('act').hidden=collectionOpen||s!=='play'||(tut&&game.tutorialStep==='confirm');$('act').textContent=tut?'점프':controls().action;$('act').setAttribute('aria-label',(tut?'점프':controls().action)+'. '+controls().cue);
 $('primary').hidden=collectionOpen||!(s==='title'||result||(tut&&game.tutorialStep==='confirm'&&s==='play'));
 $('primary').textContent=s==='title'?(originProgress.completed?'처음부터 달리기':originProgress.finaleUnlocked?'마지막 방으로':originProgress.checkpoint?'이어서 달리기':'꿈속으로'):originActive()&&result?(game.mode==='origin-finale'?'다시 맞서기':'다시 달리기'):hero?.active&&result?'체험 다시 하기':s==='title'?(['skipped','complete'].includes(settings.tutorialStatus)?'꿈 지도 열기':'시작하기'):tut&&game.tutorialStep==='confirm'?(originLearning?'사각의 꿈으로':'첫 꿈으로'):'다시 도전';
 $('pause').hidden=collectionOpen||s==='title'||result||(tut&&game.tutorialStep==='confirm'&&s==='play');$('pause').textContent=s==='pause'?'이어하기':'일시정지';
 $('home').hidden=!collectionOpen&&!((originActive()||originLearning)&&s!=='title');$('map').hidden=collectionOpen||tut||originActive()&&s!=='title'||!!hero?.active&&!result;$('map').textContent=s==='title'?'100개의 다른 꿈':hero?.active&&result?'캠페인 시작':'꿈 지도';$('skip').hidden=collectionOpen||!tut||s==='title';
 const next=nextUnlocked();$('next').hidden=collectionOpen||s!=='clear'||!next||game.mode==='freeplay';$('next').textContent=next?'다음 꿈':'다음 꿈';if(originActive()){ $('next').hidden=collectionOpen||!result||!(s==='clear'||game.mode==='origin-route'&&(originProgress.finaleUnlocked||originProgress.checkpoint>originStart));$('next').textContent=s==='clear'?'처음부터':originProgress.finaleUnlocked?'마지막 방으로':'다음 구간에서';}
 canvas.tabIndex=dialog||collectionOpen?-1:0;canvas.setAttribute('aria-hidden',String(collectionOpen));canvas.setAttribute('aria-label',s==='title'?'몽유. 터치 또는 Enter로 시작':s==='play'?(tut?'안전 연습. 안내에 따라 화면을 눌러 점프':(game.level?.name||'달리는 중')+'. '+controls().cue+' 화면·Space·Enter를 사용합니다.'):s==='pause'?'일시정지':originActive()?'결과. 다시 달리거나 처음 화면으로 돌아갈 수 있습니다.':'결과. 다시 도전하거나 꿈 지도를 여세요');
 $('mute').textContent=settings.mute?'소리 꺼짐':'소리 켜짐';$('motion').textContent=settings.reduced?'움직임 줄임':'움직임 기본';$('mute').setAttribute('aria-pressed',String(settings.mute));$('motion').setAttribute('aria-pressed',String(settings.reduced));
 $('tutorialState').textContent=settings.tutorialStatus==='complete'?'첫 연습 완료':settings.tutorialStatus==='skipped'?'연습을 건너뛰었습니다':settings.tutorialStatus==='learning'?'연습 지점이 저장됩니다':'100개의 꿈에서는 안전 연습부터 시작합니다';
 const status=campaignView().summary;$('topLabel').textContent=originLearning?'사각의 꿈 · 첫 점프':originActive()&&s!=='title'?'사각의 꿈 · '+(game.mode==='origin-finale'?'마지막 방':game.originStatus?.()?.chapterName||'달리는 중'):hero?.active?'짧은 꿈 · '+(hero.index+1)+'/3 · 기록 없음':'몽유 · 사각의 꿈'+(s==='title'?'':' · '+status.completed+'/100');storageMessage();
}
function nextUnlocked(){const current=game.levelId||selectedId;for(let id=current+1;id<=100;id++)if(P.unlocked(settings.campaign,id)&&!settings.campaign.completed.includes(id))return id;return null}
function events(){let changed=false;for(const e of game.drain()){if(originLearning&&e.startsWith('tutorial-')){if(e==='tutorial-complete'||e==='tutorial-skip'){originProgress.introDone=true;writeOrigin();leaveOriginIntro();const startChapter=memoryIntroChapter;memoryIntroChapter=undefined;startOrigin(undefined,startChapter);return}if(e==='tutorial-start'||e==='tutorial-progress'){announce({approach:'처음 한 번, 안전하게 점프를 익혀 보세요.',jump:'장애물 앞입니다. 화면을 눌러 점프하세요.',corner:'점프 성공. 착지 후에도 자동으로 달립니다.',confirm:'연습 성공. 사각의 꿈으로 들어가세요.'}[game.tutorialStep]);changed=true}if(e==='tutorial-retry'){announce('괜찮습니다. 같은 지점에서 다시 연습합니다.');changed=true}continue}if(e==='origin-start'){if(memorySession?.startPending&&memorySession.startChapter===game.originStartChapter)memorySession.startPending=false;else invalidateMemory('untracked-start')}if(e==='origin-route-complete'){narrative.routeComplete=true;narrative.fullRoute=game.originTravelResult?.startChapter===0;if(memorySession?.eligible&&memorySession.phase==='route'&&game.mode==='origin-finale'&&game.originTravelResult?.startChapter===0){memorySession.route=game.originTravelResult;memorySession.phase='crossing'}else invalidateMemory('incomplete-route')}if(e==='origin-finale'){if(memorySession?.eligible&&memorySession.phase==='crossing'&&memorySession.route===game.originTravelResult)memorySession.phase='finale';else invalidateMemory('finale-checkpoint');originProgress.finaleUnlocked=true;originProgress.checkpoint=3;writeOrigin();announce('마지막 방. 이제 누르면 사각 탄환을 던집니다.');changed=true}if(e==='origin-chapter'){const route=game.originStatus()||{chapterIndex:3,chapterName:'마지막 방'};if(route.chapterIndex>originProgress.checkpoint){originProgress.checkpoint=route.chapterIndex;writeOrigin();announce(route.chapterName+'. 이제 이 구간에서 이어갈 수 있습니다.')}changed=true}if(['pause','clear','fail'].includes(e))stopSound();else sound(e);if(['pass','boss-damage'].includes(e)&&['origin-route','origin-finale'].includes(game.mode)&&game.state==='play')musicAccent=true;
 if(e==='fail'||e==='clear'){
  if(originActive()){const newMemories=e==='clear'?collectMemoryResult(game.result):0;if(e==='fail')invalidateMemory('failed');if(e==='clear'&&game.mode==='origin-finale'&&game.result?.objectivesMet&&game.result?.bossDefeated){originProgress.completed=true;originProgress.finaleUnlocked=true;originProgress.checkpoint=3;writeOrigin()}game.best=settings.best;stopSound();announce(e==='clear'?finaleEpilogue().join(' ')+(newMemories?' 새 기억 '+newMemories+'개를 찾았습니다.':''):game.mode==='origin-finale'?'다시 맞서 보세요. 마지막 방에서 다시 시작할 수 있습니다.':'다시 달려 보세요.'+(originProgress.checkpoint>originStart?' 도착한 다음 구간에서 이어갈 수도 있습니다.':''));changed=true;continue}
  if(hero?.active){game.best=settings.best;stopSound();if(e==='clear'&&hero.index<HERO_LEVELS.length-1){hero.index++;startHeroSegment();sync();return}hero.completed=e==='clear';announce((hero.completed?'짧은 꿈 체험 완료.':'체험을 다시 시작할 수 있습니다.')+' 수집·최고 점수·연습 기록은 바뀌지 않습니다.');changed=true;continue}
  settings.best=Math.max(settings.best,game.best);const result=game.result;if(e==='clear'&&result&&typeof result==='object'&&!savedResults.has(result)){settings.campaign=P.complete(settings.campaign,game.levelId,result);savedResults.add(result)}write();
  const level=game.level,go=nextUnlocked();announce((e==='clear'?'꿈 완료':'다시 도전')+'. '+game.score+'점.'+(e==='clear'&&game.mode==='campaign'?(level?.isBoss?' 이 장의 수수께끼가 열렸습니다.':go?' 다음 꿈이 열렸습니다.':' 미션 기록을 확인하세요.'):'')+(game.mode==='freeplay'?' 연습은 해금 기록에 반영되지 않습니다.':''));changed=true;
 }
 if(e==='tutorial-start'||e==='tutorial-progress'){settings.tutorialStatus='learning';settings.tutorialStep=game.tutorialStep;game.savedStep=game.tutorialStep;write();announce({approach:'장애물 앞에서 안전하게 멈춥니다',jump:'화면을 눌러 점프하세요',corner:'점프 성공. 착지 후에도 자동으로 달립니다',confirm:'연습 성공. 다음 꿈에서는 인물의 말풍선으로 새로운 조작을 배웁니다'}[game.tutorialStep]);changed=true}
 if(e==='tutorial-retry'){announce('괜찮습니다. 같은 지점에서 다시 연습합니다');changed=true}
 if(e==='tutorial-complete'||e==='tutorial-skip'){settings.tutorialStatus=e==='tutorial-complete'?'complete':'skipped';settings.tutorialStep='approach';write();changed=true}
 if(e.startsWith('world-transform-')&&game.state==='play'&&!dialog&&!collectionOpen){const phase=game.worldTransform?.();if(phase?.text)announce(phase.text)}
 if(e==='dodge'&&game.arena)announce((game.arena.lane+1)+'번 차선으로 이동합니다');if(e==='attack-telegraph'&&game.gameMode==='dodge-arena')announce((game.arena.lockedLane+1)+'번 차선에 돌진 예고. 차선을 바꿔 피하세요.');if(e==='level-start')announce(controls().name+'. '+controls().cue);if(['start','pause','resume','boss-strike','lane-change','boss-damage'].includes(e))changed=true;
 }if(hero?.active&&game.state==='play'&&!dialog&&!collectionOpen){const beat=Math.floor(game.time*2);if(beat!==hero.lastBeat){hero.lastBeat=beat;sound('hero-beat')}}journeyMusic();if(changed)sync()}
function timestamp(value){const n=Number(value);return value!=null&&Number.isFinite(n)&&n>=0?n:(typeof performance!=='undefined'?performance.now():(last??0))}
const originHeldKeys=new Set(),originHeldPointers=new Set();
// Keep consumed pointer identities through interruptions: a late release is not a new action.
const actPointers=new Map();let actLegacyClick=null;
function releaseActPointers(){for(const gesture of actPointers.values())gesture.down=false}
function resetOriginHeld(){originHeldKeys.clear();originHeldPointers.clear();releaseActPointers()}
function resetClock(now){resetOriginHeld();last=timestamp(now);acc=0}
function advanceClock(now){const priorResult=syncResultClock();now=timestamp(now);if(last===null){last=now;return}const elapsed=Math.min(.1,Math.max(0,(now-last)/1000));last=Math.max(last,now);viewTime+=elapsed;if(priorResult&&!document.hidden&&!dialog&&!collectionOpen)resultElapsed=Math.min(.65,resultElapsed+elapsed);if(dialog||collectionOpen||window.QUAD_RIFT_APP?.squareReply?.active||bridgeActive()||dayNightActive())return;acc+=elapsed;while(acc+1e-12>=1/120){game.update(1/120);acc=Math.max(0,acc-1/120)}syncResultClock()}
function openCollection(event){leaveBridge();clearNarrative();invalidateMemory('other-mode');leaveOriginIntro();if(hero?.active)leaveHero();if(dialog)modal(null);if(game.state==='play')game.pause();events();stopSound();collectionOpen=true;chapter=C.getLevel(selectedId).chapter;resetClock(event?.timeStamp);sync();draw();$('level-'+C.getLevel(selectedId).slot).focus();announce('제 '+chapter+'장 '+C.chapters[chapter-1].name+'. 꿈을 선택하세요');return true}
function selectLevel(id,{details=true,focus=false}={}){const level=C.getLevel(Number(id));if(!level)return false;selectedId=level.id;chapter=level.chapter;settings.campaign={...settings.campaign,selected:selectedId};write();sync();draw();if(focus)$('level-'+level.slot).focus();if(details)openMission();return true}
function openMission(showResult=false){showResult=showResult===true;missionIsResult=showResult;const level=C.getLevel(selectedId),unlocked=P.unlocked(settings.campaign,selectedId);$('missionTitle').textContent=String(level.id).padStart(3,'0')+' · '+level.name;$('missionChapter').textContent='제 '+level.chapter+'장 · '+C.chapters[level.chapter-1].name+(level.isBoss?' · 보스':'');$('missionDescription').textContent=showResult&&game.state==='clear'&&level.clearClue?level.clearClue:level.description;$('missionObjectives').textContent='';for(const objective of level.objectives){const li=document.createElement('li');const row=showResult?game.objectiveProgress().find(o=>o.type===objective.type):null;li.textContent=objective.text+(row?' · '+(row.met?'달성':'미달')+' ('+row.value+' / '+row.target+')':'');$('missionObjectives').appendChild(li)}if(showResult&&game.boss){const li=document.createElement('li');li.textContent='보스 체력 · '+(game.boss.hp===0?'격파':'남은 체력 '+game.boss.hp)+' / '+game.boss.maxHp;$('missionObjectives').appendChild(li)}$('missionCue').textContent=showResult?(game.result?.reason||'기록 '+game.score+'점 · 충돌 '+(game.result?.hits||0)+'회'):'공략 · '+level.cue;$('missionLock').textContent=unlocked?(settings.campaign.completed.includes(level.id)?settings.campaign.records[level.id]?.contentVersion===5?'이전판 완료 기록과 해금을 보존했습니다. 현재 방식으로는 아직 완료하지 않았습니다. 다시 도전해 새 기록을 남기세요.':'현재 방식으로 완료한 꿈입니다. 다시 도전해 기록을 높일 수 있습니다.':'미션을 모두 달성하면 다음 꿈이 열립니다.'):P.lockReason(settings.campaign,selectedId);$('missionStart').textContent=showResult?'다시 도전':'꿈에 들어가기';$('missionClose').textContent=showResult?'결과로 돌아가기':'꿈 지도로 돌아가기';$('missionStart').disabled=!unlocked;$('missionPractice').disabled=!unlocked;$('missionRiddle').hidden=level.slot<10&&!settings.campaign.completed.includes(level.chapter*10);modal('mission',showResult?$('resultDetails'):$('level-'+level.slot));sync();(unlocked?$('missionStart'):$('missionClose')).focus();}
function startSelected(event,practice=false){leaveBridge();clearNarrative();invalidateMemory('other-mode');leaveOriginIntro();if(hero?.active)leaveHero();grantAudio(event);if(!P.unlocked(settings.campaign,selectedId)){announce(P.lockReason(settings.campaign,selectedId));return false}stopSound();modal(null);collectionOpen=false;game.selectLevel(selectedId);if(practice)game.startFreeplay(selectedId);else if(!['skipped','complete'].includes(settings.tutorialStatus))game.beginTutorial(settings.tutorialStep);else game.startLevel(selectedId);resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});return true}
function nextLevel(event){if(originActive())return game.state==='clear'?startOrigin(event,0):originProgress.finaleUnlocked?startFinale(event):startOrigin(event,originProgress.checkpoint);const id=nextUnlocked();if(!id)return openCollection(event);selectLevel(id,{details:false});return startSelected(event)}
function action(event){if(dayNightActive()||bridgeActive()||bridgeHeldKeys.size>0||timestamp(event?.timeStamp)<=bridgeBlockUntil||window.QUAD_RIFT_APP?.squareReply?.active)return false;grantAudio(event);if(dialog||collectionOpen)return false;if(game.state==='title')return startOrigin(event);if(['clear','fail'].includes(game.state)){if(originActive())return game.mode==='origin-finale'?startFinale(event):startOrigin(event,originStart);if(hero?.active)return startHero(event);const practice=game.mode==='freeplay';selectedId=game.levelId||selectedId;return startSelected(event,practice)}const now=timestamp(event?.timeStamp),before=game.state,beforeMode=game.mode,beforeLevelId=game.levelId,beforeHeroIndex=hero?.index;if(before==='play'){advanceClock(now);events();if(game.state!=='play'||game.mode!==beforeMode||game.levelId!==beforeLevelId||hero?.active&&hero.index!==beforeHeroIndex)return false}else resetClock(now);if(game.mode==='origin-route'&&game.state==='play'&&(event?.repeat||game.jump>0&&last!==null&&now<last-80))return false;const acted=game.action();events();canvas.focus({preventScroll:true});return acted}
function pauseToggle(event){if(dayNightActive()||bridgeActive()||replyActive()||replyReturnPending&&(bridgeHeldKeys.size>0||event?.repeat)||timestamp(event?.timeStamp)<=bridgeBlockUntil)return false;grantAudio(event);if(dialog||collectionOpen)return false;advanceClock(event?.timeStamp);if(game.state==='play')game.pause();else game.resume();resetClock(event?.timeStamp);events();sync();return true}
function home(){leaveBridge();clearNarrative();resetOriginHeld();invalidateMemory('home');leaveOriginIntro();if(hero?.active)leaveHero();stopSound();modal(null);collectionOpen=false;game.title();last=null;acc=0;sync();draw();$('primary').focus();return true}
function startHeroSegment(){
 game.startFreeplay(HERO_LEVELS[hero.index]);game.best=settings.best;hero.lastBeat=-1;game.heroShowcase={active:true,index:hero.index,total:HERO_LEVELS.length};acc=0;
}
function startHero(event){leaveBridge();clearNarrative();
 invalidateMemory('other-mode');leaveOriginIntro(); grantAudio(event);stopSound();modal(null);collectionOpen=false;hero={active:true,index:0,completed:false,lastBeat:-1};startHeroSegment();resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});announce('짧은 꿈 체험. 기록은 남지 않습니다. 먼저 벽과 틈 앞에서 점프하세요.');return true;
}
function leaveHero(){
 if(!hero?.active)return;stopSound();hero=null;game.heroShowcase=null;game.best=settings.best;game.selectLevel(selectedId);game.mode='campaign';game.title();last=null;acc=0;
}
function suspend(){bridgeHeldKeys.clear();window.QUAD_RIFT_APP?.dayNight?.suspend();window.QUAD_RIFT_APP?.companionBridge?.suspend();window.QUAD_RIFT_APP?.squareReply?.suspend();resetOriginHeld();const tilt=window.QUAD_RIFT_APP?.tilt;if(tilt?.active)tilt.suspend();if(game.pause()){events();sync();announce('자동으로 일시정지했습니다')}last=null;acc=0;stopSound();draw();return true}
function back(){if(dayNightActive()){window.QUAD_RIFT_APP.dayNight.suspend();return true}if(bridgeActive()){window.QUAD_RIFT_APP.companionBridge.suspend();return true}if(window.QUAD_RIFT_APP?.squareReply?.active)return window.QUAD_RIFT_APP.squareReply.close();const tilt=window.QUAD_RIFT_APP?.tilt;if(tilt?.active)return tilt.close();if(dialog)return closeDialog();if(collectionOpen)return home();if(game.state==='play'){suspend();return true}if(game.state!=='title')return home();return false}
function openRiddle(){const ch=C.chapters[chapter-1];activeRiddle=C.riddles.find(r=>r.id===ch.riddleId);if(!activeRiddle)return false;$('riddleChapter').textContent='제 '+chapter+'장 · '+ch.name;$('riddlePrompt').textContent=(settings.campaign.completed.includes(ch.bossId)&&activeRiddle.earnedClue?activeRiddle.earnedClue+'\n\n':'')+activeRiddle.prompt;$('riddleAnswer').value='';$('riddleFeedback').textContent='';renderRiddle();$('riddleClose').textContent=collectionOpen?'꿈 지도로 돌아가기':'결과로 돌아가기';modal('riddle',collectionOpen?$('chapterRiddle'):$('resultDetails'));sync();$('riddleClose').focus();if(settings.campaign.completed.includes(ch.bossId)&&!settings.campaign.riddles.includes(activeRiddle.id))$('riddleAnswer').focus();return true}
function renderRiddle(){if(!activeRiddle)return;const ch=C.chapters[activeRiddle.chapter-1],solved=settings.campaign.riddles.includes(activeRiddle.id),available=settings.campaign.completed.includes(ch.bossId),count=settings.campaign.hints[activeRiddle.id]||0;$('riddleReward').textContent=solved?'해결했습니다. '+(chapter===10?'100개의 꿈과 마지막 문장이 완성되었습니다.':'다음 장이 열렸습니다.'):!available?'이 장의 보스를 완료하면 답을 입력할 수 있습니다.':(chapter===10?'보상 · 마지막 꿈의 완성':'보상 · 다음 장의 첫 꿈 해금');$('riddleAnswer').disabled=!available||solved;$('riddleSubmit').disabled=!available||solved;$('riddleHint').disabled=!available||solved||count>=activeRiddle.hints.length;$('riddleHint').textContent='힌트 '+Math.min(count+1,activeRiddle.hints.length)+' / '+activeRiddle.hints.length;$('riddleHints').textContent=activeRiddle.hints.slice(0,count).map((h,i)=>(i+1)+'. '+h).join('\n');}
function submitRiddle(){if(!activeRiddle)return false;const r=P.solve(settings.campaign,activeRiddle.id,$('riddleAnswer').value);settings.campaign=r.save;write();renderRiddle();sync();draw();$('riddleFeedback').textContent=r.correct?(activeRiddle.chapter===10?'정답! 모든 꿈을 완성했습니다.':'정답! 다음 장의 첫 꿈이 열렸습니다.'):(r.reason||'아직 맞지 않습니다. 힌트를 살펴보세요.');if(r.correct){sound('clear');$('riddleClose').focus()}return r.correct}
function changeChapter(delta){chapter=Math.max(1,Math.min(10,chapter+delta));selectedId=(chapter-1)*10+1;settings.campaign={...settings.campaign,selected:selectedId};write();sync();draw();announce('제 '+chapter+'장 '+C.chapters[chapter-1].name);}
// The landing slot is tap-only: held/duplicate events cannot refresh it.
canvas.addEventListener('pointerdown',e=>{if(e.isPrimary===false||e.button>0)return;e.preventDefault();if(game.mode==='origin-route'){const id=e.pointerId??'primary';if(originHeldPointers.has(id))return;originHeldPointers.add(id)}action(e)});
canvas.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(e.repeat)return;if(game.mode==='origin-route'){if(originHeldKeys.has(e.code))return;originHeldKeys.add(e.code)}action(e)}});
window.addEventListener('keyup',e=>{originHeldKeys.delete(e.code);bridgeHeldKeys.delete(e.code)});
window.addEventListener('pointerup',e=>{originHeldPointers.delete(e.pointerId??'primary');const gesture=actPointers.get(e.pointerId??'primary');if(gesture)gesture.down=false});
function cancelOriginInput(){originHeldPointers.clear();releaseActPointers();game.cancelOriginJump()}
window.addEventListener('pointercancel',cancelOriginInput);
canvas.addEventListener('pointercancel',cancelOriginInput);
window.addEventListener('blur',()=>{originHeldKeys.clear();originHeldPointers.clear()});
$('resultDetails').onclick=()=>{if(originActive())return openMemories($('resultDetails'));selectedId=game.levelId||selectedId;chapter=C.getLevel(selectedId).chapter;openMission(true)};
$('heroStart').onclick=startHero;$('heroExit').onclick=home;
$('act').addEventListener('pointerdown',e=>{
 const id=e.pointerId??'primary',prior=actPointers.get(id);if(prior?.down)return;
 const gesture={down:true};actPointers.set(id,gesture);actLegacyClick=gesture;
 if(e.isPrimary===false||e.button>0)return;
 e.preventDefault();
 // This is the gameplay control, not the title/retry/navigation button.
 if(game.state!=='play'||dialog||collectionOpen)return;
 action(e);
});
$('act').addEventListener('pointercancel',cancelOriginInput);
$('act').onclick=e=>{
 // Keyboard, AT, and .click() have no physical pointer identity; keep native activation.
 const physical=e?.pointerId!=null&&e.pointerId>=0;
 if(physical){const id=e.pointerId,gesture=actPointers.get(id);if(gesture){actPointers.delete(id);if(actLegacyClick===gesture)actLegacyClick=null;return false}}
 else if(e?.detail>0&&actLegacyClick){const gesture=actLegacyClick;actLegacyClick=null;for(const [id,item] of actPointers)if(item===gesture)actPointers.delete(id);return false}
 if(e?.button>0||physical&&e?.isPrimary===false)return false;
 return action(e);
};$('primary').onclick=action;$('next').onclick=nextLevel;$('pause').onclick=pauseToggle;$('home').onclick=home;$('map').onclick=openCollection;$('skip').onclick=e=>{advanceClock(e?.timeStamp);game.skipTutorial();resetClock(e?.timeStamp);events();sync()};
$('options').onclick=e=>{advanceClock(e?.timeStamp);game.pause();events();stopSound();modal('settings',$('options'));sync();$('close').focus()};$('close').onclick=closeDialog;
$('mute').onclick=()=>{settingsTouched.add('mute');settings.mute=!settings.mute;if(settings.mute)stopSound();write();sync()};$('motion').onclick=()=>{settingsTouched.add('reduced');settings.reduced=!settings.reduced;write();sync();draw()};$('replay').onclick=e=>{stopSound();invalidateMemory('other-mode');leaveOriginIntro();if(hero?.active)leaveHero();modal(null);collectionOpen=false;if(!P.unlocked(settings.campaign,selectedId)){selectedId=P.status(settings.campaign).nextLevel||1;chapter=C.getLevel(selectedId).chapter;settings.campaign={...settings.campaign,selected:selectedId}}game.selectLevel(selectedId);game.beginTutorial('approach');resetClock(e?.timeStamp);events();sync();canvas.focus({preventScroll:true})};
$('chapterPrev').onclick=()=>changeChapter(-1);$('chapterNext').onclick=()=>changeChapter(1);$('collectionPlay').onclick=openMission;$('chapterRiddle').onclick=openRiddle;
for(let slot=1;slot<=10;slot++)$('level-'+slot).onclick=()=>selectLevel((chapter-1)*10+slot);
$('missionStart').onclick=e=>startSelected(e,missionIsResult&&game.mode==='freeplay');$('missionPractice').onclick=e=>startSelected(e,true);$('missionClose').onclick=closeDialog;$('missionRiddle').onclick=openRiddle;
$('riddleSubmit').onclick=submitRiddle;$('riddleClose').onclick=closeDialog;$('riddleHint').onclick=()=>{if(activeRiddle){settings.campaign=P.hint(settings.campaign,activeRiddle.id);write();renderRiddle();announce($('riddleHints').textContent)}};
$('riddleAnswer').addEventListener('keydown',e=>{if(e.code==='Enter'&&!e.repeat&&!e.isComposing){e.preventDefault();submitRiddle()}});
if($('memoriesOpen'))$('memoriesOpen').onclick=()=>openMemories($('memoriesOpen'));if($('memoriesStart'))$('memoriesStart').onclick=startMemoryChallenge;if($('memoriesClose'))$('memoriesClose').onclick=closeDialog;
if($('journeyOpen'))$('journeyOpen').onclick=openJourney;if($('journeyStart'))$('journeyStart').onclick=startJourney;if($('journeyClose'))$('journeyClose').onclick=closeDialog;for(let i=0;i<5;i++)if($('journey-'+i))$('journey-'+i).onclick=()=>selectJourney(i);
const dialogControls={journey:['journey-0','journey-1','journey-2','journey-3','journey-4','journeyStart','journeyClose'],settings:['mute','motion','journeyOpen','memoriesOpen','replay','tiltOpen','close'],memories:['memoriesStart','memoriesClose'],mission:['missionStart','missionPractice','missionRiddle','missionClose'],riddle:['riddleAnswer','riddleSubmit','riddleHint','riddleClose']};
document.addEventListener('keydown',e=>{
 if((bridgeActive()||replyActive()||dayNightActive())&&['Space','Enter'].includes(e.code))bridgeHeldKeys.add(e.code);
 if(dayNightActive()||bridgeActive()||window.QUAD_RIFT_APP?.tilt?.active||window.QUAD_RIFT_APP?.squareReply?.active)return;
 if(dialog){if(e.code==='Escape'){e.preventDefault();if(!e.repeat)closeDialog();return}if(e.code==='Tab'){const controls=dialogControls[dialog].map($).filter(x=>x&&!x.hidden&&!x.disabled),i=controls.indexOf(document.activeElement);e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length].focus()}return}
 if(collectionOpen&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){const active=document.activeElement;if(!active?.id?.startsWith('level-'))return;e.preventDefault();const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-2,ArrowDown:2}[e.code],next=Math.max((chapter-1)*10+1,Math.min(chapter*10,selectedId+delta));selectLevel(next,{details:false,focus:true});return}
 if(e.code==='Escape'){e.preventDefault();if(e.repeat)return;if(collectionOpen)home();else pauseToggle(e)}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend()});window.addEventListener('blur',suspend);window.addEventListener('pagehide',suspend);window.addEventListener('resize',()=>{fit();draw()});if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{fit();draw()}).observe($('stage'));
function tick(now){advanceClock(now);events();syncBridgeInvitation();draw();requestAnimationFrame(tick)}storageMessage();sync();draw();requestAnimationFrame(tick);
window.QUAD_RIFT_APP={version:'r12.0.0',openMemories,startMemoryChallenge,writeMemories,memoryStorageKey:MEMORY_KEY,memoryBackupKey:MEMORY_BACKUP,startOrigin,startFinale,writeOrigin,originStorageKey:ORIGIN_KEY,originBackupKey:ORIGIN_BACKUP,startHero,exitHero:home,processEvents:events,HERO_LEVELS,controls,MODE_CONTROLS,game,settings,action,suspend,pause:suspend,back,home,write,sync,fit,draw,openCollection,selectLevel,startSelected,nextLevel,openRiddle,submitRiddle,closeDialog,storageKey:KEY,backupKey:BACKUP,recoveryKey:RECOVERY,recoveryBackupKey:RECOVERY_BACKUP,finaleEpilogue,getState:()=>({narrative:{...narrative},memories:memoryView(),origin:{...originProgress,learning:originLearning,startChapter:originStart,storageOK:originStorageOK},hero:hero?{active:hero.active,index:hero.index,completed:hero.completed,levelIds:[...HERO_LEVELS]}:null,state:game.state,mode:game.mode,tutorialStep:game.tutorialStep,tutorialStatus:settings.tutorialStatus,modal:!!dialog,dialog,collection:collectionOpen,chapter,selected:selectedId,storageOK})};
if(typeof MongyuDayNight!=='undefined'&&$('dayNightOpen'))window.QUAD_RIFT_APP.dayNight=MongyuDayNight.mount({document,window,canOpen:dayNightAvailable,onOpen:event=>{dayNightUsed=true;replyReturnPending=true;game.cancelOriginJump();resetOriginHeld();resetClock(event?.timeStamp);game.pause();events();stopSound();syncBridgeInvitation()},onClose:(event,outcome)=>{if(game.mode==='origin-route'&&outcome?.completed)narrative.dayNightCrossed=true;game.cancelOriginJump();resetClock(event?.timeStamp);last=null;acc=0;bridgeBlockUntil=timestamp(event?.timeStamp)+100;sync();draw()},reduced:()=>settings.reduced});
if(typeof MongyuCompanionBridge!=='undefined'&&$('bridgeOpen'))window.QUAD_RIFT_APP.companionBridge=MongyuCompanionBridge.mount({document,window,canOpen:bridgeAvailable,onOpen:event=>{bridgeUsed=true;replyReturnPending=false;game.cancelOriginJump();resetClock(event?.timeStamp);game.pause();events();stopSound();syncBridgeInvitation()},onClose:(event,outcome)=>{if(game.mode==='origin-route'&&outcome?.completed)narrative.companionCrossed=true;game.cancelOriginJump();resetClock(event?.timeStamp);last=null;acc=0;bridgeBlockUntil=timestamp(event?.timeStamp)+100;sync();draw()},reduced:()=>settings.reduced});
if(typeof MongyuSquareReply!=='undefined'&&$('replyOpen'))window.QUAD_RIFT_APP.squareReply=MongyuSquareReply.mount({document,window,canOpen:context=>context==='journey'?replyAvailable():game.state==='title'&&!collectionOpen&&!dialog,onOpen:(event,context)=>{if(context==='journey'){replyUsed=true;game.cancelOriginJump();resetClock(event?.timeStamp);game.pause();events()}else{clearNarrative();invalidateMemory('other-mode')}stopSound()},onClose:(event,context,outcome)=>{if(context==='journey'&&game.mode==='origin-route'&&outcome?.completed)narrative.replySolved=true;replyReturnPending=context==='journey';if(context==='journey'){game.cancelOriginJump();resetClock(event?.timeStamp);bridgeBlockUntil=timestamp(event?.timeStamp)+100}last=null;acc=0;sync();draw();return context==='journey'?$('pause'):$('replyOpen')},reduced:()=>settings.reduced});
if(typeof MongyuTilt!=='undefined'&&$('tiltOpen'))window.QUAD_RIFT_APP.tilt=MongyuTilt.mount({document,window,onOpen:()=>{clearNarrative();invalidateMemory('other-mode');modal(null);suspend()},onClose:()=>{last=null;acc=0;modal('settings',$('options'));sync()},reduced:()=>settings.reduced});
})();
