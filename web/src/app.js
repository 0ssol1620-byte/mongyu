(function(){'use strict';
const localStorage=(()=>{let storage;try{storage=globalThis.localStorage}catch(error){storage={getItem(){throw error},setItem(){throw error},removeItem(){throw error}}}return typeof MongyuStorage!=='undefined'?MongyuStorage.create(storage):storage})();
const $=id=>document.getElementById(id),C=QuadRiftContent,P=QuadRiftProgress,canvas=$('game'),ctx=canvas.getContext('2d');
const currentEdition=document.documentElement?.dataset?.edition==='mongyu';
const retiredSurfaces=['modesOpen','pauseModes','settingsModes','journeyOpen','memoriesOpen','replay','tiltOpen','tutorialState','saveState','restorationLegacySettingsHelp','settingsSkip','modes','journey','memories','r34Map','mission','riddle','shopPanel'];
function retireLegacySurfaces(){if(!currentEdition)return;for(const id of retiredSurfaces){const node=$(id);if(node){node.hidden=true;node.inert=true;node.setAttribute('aria-hidden','true');if(node.tagName==='BUTTON')node.onclick=null}}}

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
const defaults=()=>({schema:5,mute:false,musicVolume:1,sfxVolume:1,reduced:systemReduced,dreamIntensity:'balanced',best:0,tutorialStatus:'new',tutorialStep:'approach',campaign:P.create()});
function volume(value){return Number.isFinite(value)?Math.max(0,Math.min(1,value)):1}
function decode(raw){
 if(!raw)return null;let v;try{v=JSON.parse(raw)}catch(e){return null}
 if(!v||![4,5].includes(v.schema))return null;
 const s=defaults();s.mute=v.mute===true;s.musicVolume=volume(v.musicVolume);s.sfxVolume=volume(v.sfxVolume);s.dreamIntensity=['calm','balanced','intense'].includes(v.dreamIntensity)?v.dreamIntensity:'balanced';s.reduced=typeof v.reduced==='boolean'?v.reduced:systemReduced;s.best=Number.isFinite(v.best)?Math.max(0,Math.floor(v.best)):0;
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
// R37 is a separate simulation and bounded record namespace. Legacy saves are never copied into it.
const SQUARE_KEY='mongyu-square-dream-v1';
let squareStorageOK=true,squareReadOnly=false,squareSave=null,activeSquareRun=null,squareLastState='',squareLastRoom=-1,restorationUI=null,restorationTitleRun=null,restorationTitleGeometry=null,squareStatusAt=-1,squareStatusKey='',squarePlayer=null,restorationTrial=null;
try{const raw=localStorage.getItem(SQUARE_KEY);if(raw){const v=JSON.parse(raw);if(v?.schema!==1||!['bestScore','clears','furthestRoom'].every(k=>Number.isSafeInteger(v[k])&&v[k]>=0&&v[k]<=1000000000)||!(v.bestTime===null||Number.isFinite(v.bestTime)&&v.bestTime>=0&&v.bestTime<=1000000)||v.furthestRoom>6)throw Error('Unknown square record');squareSave=v}}catch(e){squareStorageOK=false;squareReadOnly=true}
const squareRun=typeof QuadRiftSquare==='undefined'?null:new QuadRiftSquare.SquareRun({save:squareSave});
function leaveSquare(){restorationUI?.cancelAftermath();if(!activeSquareRun)return;activeSquareRun.pause();activeSquareRun=null;restorationTrial=null;syncTrialFeedback();squareLastState='';squareStatusAt=-1;squareStatusKey='';stopSound();licensedPlayer?.release();if($('restorationCall'))$('restorationCall').hidden=true;if($('squareHud'))$('squareHud').hidden=true;if($('squareResult'))$('squareResult').hidden=true;}
function saveSquare(){if(activeSquareRun?.mode==='restoration')return false;if(!squareRun||squareReadOnly)return false;try{const next=JSON.stringify(squareRun.exportSave());if(next.length>512)throw Error('Record too large');localStorage.setItem(SQUARE_KEY,next);squareStorageOK=localStorage.getItem(SQUARE_KEY)===next}catch(e){squareStorageOK=false}return squareStorageOK}
function startSquare(event){if(currentEdition)return false;if(typeof MongyuMobile!=='undefined')MongyuMobile.requestImmersive(event);if(!squareRun)return false;leaveBridge();clearNarrative();invalidateMemory('square');leaveOriginIntro();if(hero?.active)leaveHero();grantAudio(event);stopSound();modal(null);collectionOpen=false;game.pause();game.drain();activeSquareRun=squareRun;squareRun.start();squareLastState='';squareLastRoom=-1;resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});announce('눌러서 점프');return true}
function startRestorationRun(run,event){if(typeof MongyuMobile!=='undefined')MongyuMobile.requestImmersive(event);leaveSquare();resetOriginHeld();leaveBridge();clearNarrative();invalidateMemory('restoration');leaveOriginIntro();if(hero?.active)leaveHero();grantAudio(event);stopSound();modal(null);collectionOpen=false;game.pause();game.drain();activeSquareRun=run;restorationTrial={owner:run,soundSuppressed:run.settings?.sound===false,audioExperienced:false,visualExperienced:false,disabledExperienced:false,impact:null};fit();run.setViewport?.(viewport.width,viewport.height);run.start();if(run.nativeRuntime&&run.options.quickRetry&&!run.boss&&run.nativeFrame?.r.timerT>8)run.nativeFrame.r.timerT=8;syncAudioVolumes();syncTrialFeedback();squareLastState='';squareLastRoom=-1;squareStatusAt=-1;squareStatusKey='';resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});return true}
function resumeRestorationRun(event){const run=activeSquareRun;if(run?.mode!=='restoration'||run.state!=='pause')return false;grantAudio(event);modal(null);resetOriginHeld();run.cancelInput?.();if(!run.resume())return false;resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});return true}
function retrySquare(event){if(activeSquareRun?.mode==='restoration')return restorationUI.retry(event);if(!activeSquareRun)return startSquare(event);grantAudio(event);stopSound();modal(null);if(activeSquareRun.state==='clear')return startSquare(event);activeSquareRun.retry();resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});return true}
function squareScoreTime(){return activeSquareRun?.time||0}
function squareEvents(){const run=activeSquareRun;if(!run)return;for(const e of run.drainEvents()){trialFeedbackEvent(run,e);squareStatusAt=-1;if(['pause','fail','clear'].includes(e)){stopSound();if(e!=='pause'){if(run.mode==='restoration')restorationUI?.complete(run);else saveSquare();transitionSound(e)}}else if(e==='perfect'){if(squarePlayer&&!audioSuspended&&audioAllowed()&&effectiveAudio().sfxVolume>0)squarePlayer.perfect(squareScoreTime());else sound('pass')}else sound({corner:'square-corner',portal:'square-portal','room-clear':'square-room',morph:'square-room','goal-qualified':'pass','boss-damage':'boss-damage'}[e]||e);if(e==='room-clear')saveSquare()}if(globalThis.MongyuSFX)for(const e of MongyuSFX.observe(run))sound(e);dreamMusic();syncTrialFeedback()}
const nativeScreens=new WeakMap();
function syncNativeSquare(force=false){
 const run=activeSquareRun,updateKey=[run.updates,run.state,run.inputCount,run.supported,run.goalQualified,dialog].join('|');
 let cache=nativeScreens.get(run);if(!cache){cache={};nativeScreens.set(run,cache)}
 if(!force&&cache.updateKey===updateKey)return;cache.updateKey=updateKey;
 const v=run.status(),paused=v.state==='pause'&&!dialog,playing=v.state==='play'&&!dialog,result=['clear','fail'].includes(v.state)&&!dialog,dying=!!v.deathAnimation&&!v.deathAnimation.completed;
 const layoutKey=[v.state,dialog,run.supported,run.attempt,dying].join('|'),layoutChanged=cache.layoutKey!==layoutKey;
 const text=(id,value)=>{const n=$(id);if(n.textContent!==value)n.textContent=value};
 if(layoutChanged||force){
  cache.layoutKey=layoutKey;document.body.dataset.square='true';document.body.dataset.screen=playing?'play':'panel';
  for(const id of ['titleScreen','r34Panel','arcadePanel','collection','resultDetails','hudMastery','flowToast','arcadeReadout','r34Readout','bridgeInvitation','primary','map','home','act','skip','next','heroExit','r34Open','arcadeRisk','replyOpen'])if($(id))$(id).hidden=true;
  $('retryPlay').disabled=dying;$('pauseSheet').hidden=!paused;$('pauseStory').hidden=true;
  text('pauseContext',v.instruction+(v.supported?'':'\n'+v.reason));text('resumePlay','계속 달리기');text('retryPlay','이 세계 다시');
  $('squareHud').hidden=true;$('runHud').hidden=!playing;$('pause').hidden=!playing;text('pause','Ⅱ');$('pause').setAttribute('aria-label','일시정지 · 메뉴');$('options').hidden=!dialog;$('squareResult').hidden=!result;
  canvas.inert=!!(paused||result||dying);canvas.tabIndex=dialog||paused||result||dying?-1:0;canvas.setAttribute('aria-hidden',String(!!(paused||result||dying)));
  canvas.setAttribute('aria-label',v.roomTitle+'. 화면, Space, Enter로 점프하거나 공중에서 찹니다.');
  if(paused)$('resumePlay').focus({preventScroll:true});
 }
 const score=Math.max(0,Math.floor(v.score||0));
 const objective=v.scoreObjective;
 const tracked=playing&&!v.freePlay&&v.scoreFinalization&&objective.target>0;
 const earningTutorial=playing&&run.metadata?.tutorial&&run.nativeFrame.r.frontier===2;
 const current=tracked?Math.max(0,Math.min(objective.target,objective.current)):0;
 text('runScore',score+'점');
 text('runLives','●'.repeat(Math.max(0,v.hearts))+'○'.repeat(Math.max(0,run.initialLives-v.hearts)));
 if(cache.hearts!==v.hearts){$('runLives').setAttribute('aria-label','남은 기회 '+v.hearts+'번');cache.hearts=v.hearts;}
 $('runGoal').hidden=!tracked;
 $('runLesson').hidden=!earningTutorial;
 if(earningTutorial){
  const needsFirstJump=run.options.requireOpeningJump&&(!run.inputCount||!run.jumps);
  const recentBump=Number.isFinite(run.lastOpeningBump)&&run.time-run.lastOpeningBump<2;
  text('runLesson',recentBump?'장애물보다 조금 먼저 탭':needsFirstJump?'첫 점프 · 화면 탭':'첫 달리기');
 }
 if(tracked&&cache.goalKey!==current+':'+objective.target){
  cache.goalKey=current+':'+objective.target;
  text('runGoalLabel',current>=objective.target?'목표 달성':current+' / '+objective.target+'점');
  $('runGoalProgress').max=objective.target;
  $('runGoalProgress').value=current;
 }
 const cue=MongyuMobile.hint(v,run);text('hudCue',cue);if($('hudCue').hidden!==(!playing||!cue))$('hudCue').hidden=!playing||!cue;
 const restorationKey=[v.state,v.qualified,v.freePlay,v.native.awaitingBossConfirmation].join('|');
 if(layoutChanged||force||cache.restorationKey!==restorationKey){restorationUI?.onRunStatus(v);cache.restorationKey=restorationKey}
 if(result&&layoutChanged){announce($('squareHeading').textContent+'. '+v.score+'점. '+$('squareSummary').textContent);$($('squareResult').dataset.primaryAction||'squareRetry').focus({preventScroll:true})}
 if(cache.room!==v.roomTitle){cache.room=v.roomTitle;announce(v.roomTitle+'. '+v.instruction)}
 squareLastState=v.state;
}
function syncSquare(force=false){if(!activeSquareRun)return;if(activeSquareRun.nativeRuntime&&typeof MongyuMobile!=='undefined')return syncNativeSquare(force);$('runHud').hidden=true;const after=restorationUI?.aftermathFor(activeSquareRun),screenState=after?'aftermath':activeSquareRun.deathAnimation&&!activeSquareRun.deathAnimation.completed&&activeSquareRun.state==='play'?'dying':activeSquareRun.state,bucket=Math.floor((activeSquareRun.time+(activeSquareRun.deathAnimation?.elapsed||0))*10);if(!force&&bucket===squareStatusAt&&squareLastState===screenState)return;squareStatusAt=bucket;const v=activeSquareRun.status(),state=v.state,paused=state==='pause'&&!dialog,playing=['play','transition'].includes(state)&&!dialog,result=['fail','clear'].includes(state)&&!dialog&&!after;
 const key=JSON.stringify([screenState,activeSquareRun.inputCount||activeSquareRun.jumps||0,(v.time||0)<6,after?.phase,dialog,v.roomIndex,v.score,v.hearts,Math.round(v.progress*100),v.feedback?.text,Math.floor(v.time),v.result,v.objective,v.cue?.id,v.cue?.phase,v.cue?.text]);if(!force&&key===squareStatusKey)return;squareStatusKey=key;document.body.dataset.square='true';document.body.dataset.screen=playing||after?'play':'panel';
 for(const id of ['titleScreen','r34Panel','arcadePanel','collection','resultDetails','hudMastery','flowToast','arcadeReadout','r34Readout','bridgeInvitation','primary','map','home','act','skip','next','heroExit','r34Open','arcadeRisk','replyOpen'])if($(id))$(id).hidden=true;
 $('retryPlay').disabled=!!(v.deathAnimation&&!v.deathAnimation.completed);$('pauseSheet').hidden=!paused;$('pauseStory').hidden=true;$('pauseContext').textContent=v.mode==='restoration'?(v.instruction||v.roomTitle):(v.roomIndex+1)+' / '+v.roomCount+' · '+v.roomTitle+' · '+v.score+'점';if(v.nativeRuntime&&!v.supported)$('pauseContext').textContent+='\n'+v.reason;$('resumePlay').textContent='계속 달리기';$('retryPlay').textContent='이 세계 다시';
 $('squareHud').hidden=!(playing||after);$('squareHud').textContent=v.mode==='restoration'?((activeSquareRun.slot?.number||'')+' · '+v.roomTitle+'\n'+v.score+'점  '+('●'.repeat(Math.max(0,v.hearts)))+'  '+Math.round(v.progress*100)+'%'):String(v.roomIndex+1).padStart(2,'0')+' / '+String(v.roomCount).padStart(2,'0')+'   '+v.roomTitle+'\n'+v.score+'점   '+('♥'.repeat(Math.max(0,v.hearts)))+'   '+Math.round(Math.max(0,Math.min(1,v.progress))*100)+'%';
 $('hudCue').hidden=!playing||!!activeSquareRun.encounter;$('hudCue').textContent=state==='transition'?'다음 세계로':v.mode==='restoration'?(v.cue?.text||v.feedback?.text||v.instruction||'눌러서 '+(v.actionLabel||'점프')):v.time<6?'눌러서 점프':v.feedback?.text||'';if(typeof MongyuMobile!=='undefined'){$('squareHud').textContent=v.opening?(v.opening.practice?'연습 · ':'')+v.opening.section+'  ·  빛 '+v.opening.passed+' / '+v.opening.total:MongyuMobile.hud(v);const cue=MongyuMobile.hint(v,activeSquareRun);$('hudCue').textContent=cue;$('hudCue').hidden=!playing||!cue;}$('hudCue').style.width='';$('hudCue').style.maxWidth='calc(100% - 32px)';$('hudCue').style.right='16px';$('hudCue').style.fontSize='13px';
 $('pause').hidden=!playing;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','일시정지 · 메뉴');$('options').hidden=!dialog;$('squareResult').hidden=!result;
 if(result){$('squareHeading').textContent=state==='clear'?'꿈을 뚫었다':'꿈이 접혔다';$('squareSummary').textContent=v.score+'점 · 완주 최고 '+v.best+'점\n'+(v.roomIndex+1)+' / '+v.roomCount+' 세계 · '+Math.round(v.progress*100)+'%\n'+(v.result?.reason||'')+(!squareStorageOK?'\n이번 실행에만 기록됩니다.':'');$('squareRetry').hidden=state==='clear';$('squareRestart').textContent=state==='clear'?'처음부터 다시':'새 꿈 시작';}
 restorationUI?.onRunStatus(v);canvas.inert=!!(paused||result||after||v.deathAnimation&&!v.deathAnimation.completed);canvas.tabIndex=dialog||paused||result||after?-1:0;canvas.setAttribute('aria-hidden',String(!!(paused||result||after)));canvas.setAttribute('aria-label',v.roomTitle+(v.native?.awaitingBossConfirmation?'. '+v.instruction:activeSquareRun.encounter?'. '+v.instruction:v.boss?.ruleId==='contact-return'?'. 화면, Space, Enter를 눌러 가까운 흰 사각을 쳐내거나 검은 사각을 뛰어넘으세요.':v.boss?.ruleId==='leg-sweep'?'. 낮은 발은 화면, Space, Enter를 눌러 점프하고 높은 발은 바닥에서 기다려 피하세요.':'. 화면, Space, Enter를 눌러 점프. 모서리에서는 자동으로 회전합니다.'));
 if(screenState!==squareLastState&&!dialog){if(after)$('restorationAftermathNext').focus({preventScroll:true});if(paused)$('resumePlay').focus({preventScroll:true});if(result){announce($('squareHeading').textContent+'. '+(v.mode==='restoration'&&!v.opening?v.score+'점. ':'')+$('squareSummary').textContent);$(v.mode==='restoration'?$('squareResult').dataset.primaryAction:state==='clear'?'squareRestart':'squareRetry').focus({preventScroll:true})}}
 if(v.roomIndex!==squareLastRoom){squareLastRoom=v.roomIndex;announce(v.roomTitle+'. '+(v.mode==='restoration'?v.instruction:'눌러서 점프'))}squareLastState=screenState;
}
const MODE_CONTROLS={'morph-floor':{name:'움직이는 바닥',action:'점프',cue:'바닥이 끊긴 틈과 솟는 벽 앞에서 점프합니다. 천장 아래에서는 누르지 마세요.'},'wave-run':{name:'물결 달리기',action:'물결 점프',cue:'물결의 경사를 보며 벽 앞에서 점프합니다. 낮은 천장 아래는 달려서 통과하세요.'},'four-room':{name:'네 방 동시 달리기',action:'함께 점프',cue:'한 번 누르면 네 사람이 함께 뜁니다. 다음 위험이 오는 방의 말풍선을 보세요.'},'throw-arena':{name:'투척 대결',action:'던지기',cue:'누르면 사각 탄환을 던집니다. 움직이는 보스와 높이가 맞을 때 쏘세요.'},'dodge-arena':{name:'돌진 피하기',action:'차선 바꾸기',cue:'누를 때마다 다음 차선으로 이동합니다. 예고된 돌진을 피해 벽에 부딪히게 하세요.'},'kick-arena':{name:'부양 발차기',action:'점프 / 킥',cue:'한 번 눌러 도약, 공중에서 다시 눌러 발차기합니다. 보스에 실제로 닿아야 합니다.'}};
function controls(){if(r34Active()){const v=game.r34Status();return {name:v.title,action:v.isBoss?'응답':'점프',cue:v.isBoss?[v.boss?.cue,v.boss?.counter].filter(Boolean).join(' · '):r34RuleText(v.rule)}}if(game.mode==='arcade')return {name:'54초 도전',action:'점프',cue:'바닥 장애물은 한 번 눌러 점프. 천장 아래에서는 누르지 마세요.'};if(game.mode==='origin-route')return {name:'사각의 꿈',action:'점프',cue:'네 변을 따라 자동으로 달리고, 모서리도 자동으로 돌아갑니다. 바닥 장벽 앞에서는 눌러 점프하고, 낮은 천장 아래는 누르지 않고 지나가세요.'};return MODE_CONTROLS[game.gameMode]||{name:'안전 연습',action:'점프',cue:'화면·Space·Enter로 점프합니다.'}}
let selectedId=settings.campaign.selected,chapter=C.getLevel(selectedId).chapter,collectionOpen=false,dialog=null,returnFocus=null,activeRiddle=null,missionIsResult=false;
const HERO_LEVELS=Object.freeze([4,5,10]);
let hero=null;
// The short challenge has its own record namespace; campaign and journey saves stay independent.
const ARCADE_KEY='mongyu-arcade-personal-v1';
let arcadeRisk='standard',arcadeSeed=1,arcadeRecords={schema:1,standard:0,brave:0},arcadeStorageOK=true,arcadeLastResult=null,arcadeLastState='',arcadeLastPerfect=0,arcadeFeedbackUntil=0;
function readArcadeRecords(){try{const raw=localStorage.getItem(ARCADE_KEY);if(!raw)return true;const v=JSON.parse(raw);if(v?.schema!==1||!['standard','brave'].every(k=>Number.isSafeInteger(v[k])&&v[k]>=0))throw Error('Unsupported challenge record');for(const k of ['standard','brave'])arcadeRecords[k]=Math.max(arcadeRecords[k],v[k]);return true}catch(e){arcadeStorageOK=false;return false}}
readArcadeRecords();
function saveArcadeRecord(result){if(!result||arcadeLastResult===result)return;arcadeLastResult=result;const r=result.arcade;if(!r)return;const risk=r.risk==='brave'?'brave':'standard',score=Math.max(0,Math.floor(r.score||0));const readable=readArcadeRecords();arcadeRecords[risk]=Math.max(arcadeRecords[risk],score);if(!readable)return;try{localStorage.setItem(ARCADE_KEY,JSON.stringify(arcadeRecords));arcadeStorageOK=localStorage.getItem(ARCADE_KEY)===JSON.stringify(arcadeRecords)}catch(e){arcadeStorageOK=false}}
function startArcade(event,options={}){if(currentEdition)return false;leaveSquare();
 leaveBridge();clearNarrative();invalidateMemory('arcade');leaveOriginIntro();if(hero?.active)leaveHero();grantAudio(event);stopSound();modal(null);collectionOpen=false;
 arcadeRisk=options.risk==='brave'?'brave':options.risk==='standard'?'standard':arcadeRisk;arcadeSeed=Number.isInteger(options.seed)&&options.seed>0?options.seed:arcadeSeed;
 game.startArcade({seed:arcadeSeed,risk:arcadeRisk});arcadeLastState='';arcadeLastPerfect=0;arcadeFeedbackUntil=0;resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});announce('54초 도전. '+(arcadeRisk==='brave'?'한 번의 기회, 배율 보너스.':'세 번의 기회.')+' 바닥은 점프, 천장은 그대로. 18초마다 점수를 확정하거나 다음 막에 도전하세요.');return true;
}
function chooseArcade(choice,event){if(game.mode!=='arcade'||game.state!=='arcade-choice')return false;grantAudio(event);if(!game.chooseArcade(choice))return false;resetClock(event?.timeStamp);events();sync();draw();if(game.state==='play')canvas.focus({preventScroll:true});return true}
function newArcade(event){arcadeSeed=arcadeSeed>=2147483646?1:arcadeSeed+1;return startArcade(event)}
function syncArcade(){
 const active=game.mode==='arcade'&&game.state!=='title',v=active?game.arcadeStatus():null,s=game.state,result=active&&['clear','fail'].includes(s),choice=active&&s==='arcade-choice',title=s==='title'&&!collectionOpen&&!dialog;
 $('arcadeStart').hidden=!title;$('arcadeRisk').hidden=!title;$('arcadeRisk').textContent=arcadeRisk==='brave'?'배짱 · 1목숨 · 배율 +1':'기본 · 3목숨';$('arcadeRisk').setAttribute('aria-pressed',String(arcadeRisk==='brave'));
 $('arcadePanel').hidden=!(choice||result)||!!dialog||collectionOpen;$('arcadeBank').hidden=!choice;$('arcadePush').hidden=!choice;$('arcadeRetry').hidden=!result;$('arcadeNew').hidden=!result;
 if(active){$('resultDetails').hidden=true;$('next').hidden=true;$('primary').hidden=true;$('map').hidden=true;$('home').hidden=s==='title';$('pause').hidden=choice||result;$('act').textContent='점프';$('act').setAttribute('aria-label','점프. 바닥 장애물 앞에서 한 번 누르세요. 천장 아래에서는 누르지 마세요.');$('topLabel').textContent='54초 도전 · '+(arcadeRisk==='brave'?'배짱':'기본')+' · 패턴 '+arcadeSeed;
  if(v){$('arcadeReadout').textContent='보호 점수 '+v.bankedScore+'점. 도전 점수 '+v.pendingScore+'점. 배율 '+v.multiplier+'. '+v.combo+' 연속. 정확 '+v.perfect+'회.';if(v.perfect>arcadeLastPerfect){arcadeFeedbackUntil=game.time+.65;arcadeLastPerfect=v.perfect;announce('정확! '+v.combo+' 연속, 배율 '+v.multiplier)}game.arcadeFeedback=game.time<arcadeFeedbackUntil?'정확!':'';}
  if(choice){$('arcadeHeading').textContent=(v.act||1)+'막 완료';$('arcadeSummary').textContent='보호 점수 '+v.bankedScore+'점 · 도전 점수 '+v.pendingScore+'점';$('arcadeReason').textContent='지금 종료하면 '+v.score+'점 확정. 계속하면 다음 막의 배율이 오릅니다.';$('arcadeGoal').textContent='다음 막에서 실패해도 보호 점수는 남습니다.';}
  if(result){const r=game.result?.arcade||{};saveArcadeRecord(game.result);$('arcadeHeading').textContent=s==='fail'?'도전 종료':r.banked?'점수 확정':'54초 완주!';$('arcadeSummary').textContent=(r.grade?r.grade+' · ':'')+(r.score||0)+'점 · 최고 '+arcadeRecords[arcadeRisk]+'점';$('arcadeReason').textContent=s==='fail'?(game.result?.reason||'장애물에 닿아 이번 막의 도전 점수를 잃었습니다.')+' 보호 '+(r.bankedScore||0)+'점 · 잃은 점수 '+(r.lostScore||0)+'점.':'정확 '+(r.perfect||0)+'회 · 최고 '+(r.bestChain||0)+' 연속';$('arcadeGoal').textContent=(r.nextGoal||'같은 패턴에서 정확 판정을 한 번 더 만들어 보세요.')+(!arcadeStorageOK?' 최고 기록은 이번 실행에만 보관됩니다.':' 최고 기록은 이 기기에 저장됩니다.');}
  if((choice||result)&&arcadeLastState!==s&&!dialog){announce($('arcadeHeading').textContent+'. '+$('arcadeSummary').textContent+'. '+$('arcadeReason').textContent);$(choice?'arcadeBank':'arcadeRetry').focus({preventScroll:true})}
 }
 $('arcadeReadout').hidden=!active;if(active)canvas.tabIndex=choice||result||dialog?-1:0;arcadeLastState=active&&!dialog?s:'';
}

// R34 is a separate, versioned journey. Unknown or unreadable bytes stay untouched.
const R34_KEY='mongyu-r34-journey-v1',R34_BACKUP=R34_KEY+'-backup';
const r34Ready=typeof game.startR34Chapter==='function'&&!!C.r34;
let r34Difficulty='regular',r34Selected=1,r34Briefing=false,r34StorageOK=true,r34ReadOnly=false,r34LastState='',r34LastCue='',r34LastSaved=null,r34FlowAt=null;
function r34Active(){return r34Ready&&['r34-route','r34-boss','r34'].includes(game.mode)}
function readR34(){
 if(!r34Ready)return false;
 let okay=true;for(const key of [R34_KEY,R34_BACKUP]){try{const raw=localStorage.getItem(key);if(!raw)continue;let value;try{value=JSON.parse(raw)}catch(e){okay=false;continue}if(value?.schema!==1||!game.importR34Journey(value)){okay=false;continue}}catch(e){okay=false}}
 r34ReadOnly=!okay;r34StorageOK=okay;return okay;
}
readR34();
if(r34Ready)r34Selected=game.r34JourneyStatus().unlockedChapter||1;
function writeR34(){
 if(!r34Ready)return false;const before=game.exportR34Journey();
 // The engine merges validated proof records, so a newer tab cannot erase a clear.
 if(!readR34()){game.importR34Journey(before);if(game.exportR34Journey().selectedSkin!==before.selectedSkin)game.selectR34Skin(before.selectedSkin);return false}game.importR34Journey(before);if(game.exportR34Journey().selectedSkin!==before.selectedSkin)game.selectR34Skin(before.selectedSkin);
 const next=JSON.stringify(game.exportR34Journey());
 try{localStorage.setItem(R34_BACKUP,next);if(localStorage.getItem(R34_BACKUP)!==next)throw Error('journey backup failed');localStorage.setItem(R34_KEY,next);if(localStorage.getItem(R34_KEY)!==next)throw Error('journey save failed');r34LastSaved=next;r34StorageOK=true}catch(e){r34StorageOK=false}return r34StorageOK;
}
function r34RuleText(rule){return typeof rule==='string'?rule:[rule?.title,rule?.action,rule?.failure,rule?.mastery].filter(Boolean).join(' · ')}
function r34ChapterData(id=r34Selected){return C.r34?.chapters?.find(c=>c.id===id)||C.r34?.chapters?.[id-1]}
function r34ChapterRow(id=r34Selected){return game.r34JourneyStatus().chapters.find(c=>c.id===id)}
function r34StartChoice(id=r34Selected){const row=r34ChapterRow(id);if(!row||row.solved)return {situation:0,boss:false};const i=row.situations.findIndex(x=>!x);return i<0?{situation:2,boss:true,resumeRiddle:row.bossDefeated&&!row.solved}:{situation:i,boss:false}}
function renderR34Map(){
 if(!r34Ready)return;const journey=game.r34JourneyStatus(),data=r34ChapterData(),row=r34ChapterRow();
 $('r34Progress').textContent=journey.chapters.filter(c=>c.solved).length+' / 10장 · '+journey.chapters.filter(c=>c.bossDefeated).length+' 보스 · 수집 '+journey.chapters.filter(c=>c.collectible).length+' / 10';
 for(const ch of journey.chapters){const b=$('r34Chapter-'+ch.id);if(!b)continue;b.textContent=String(ch.id).padStart(2,'0')+' '+ch.name+' · '+(ch.solved?'해결':ch.unlocked?'열림':'잠김');b.setAttribute('aria-pressed',String(ch.id===r34Selected));b.setAttribute('aria-label',b.textContent+' · 상황 '+ch.situations.filter(Boolean).length+'/3 · 보스 '+(ch.bossDefeated?'완료':'미완료'));}
 if(!data||!row)return;
 $('r34ChapterTitle').textContent=data.id+'장 · '+data.name;if($('r36Records'))$('r36Records').textContent='길 최고 기록 · '+(row.records||[]).map((r,i)=>(i+1)+': '+(['미기록','통과','완벽'][r.rank]||'미기록')+(r.echo?' + 메아리':'')).join(' / ');if($('r36ReplayRoute'))$('r36ReplayRoute').hidden=data.id!==1||!row.situations[0];
 $('r34ChapterStory').textContent=data.story.intro;
 $('r34ChapterRule').textContent=r34RuleText(data.rule);
 $('r34Situations').textContent=data.situations.map((x,i)=>(row.situations[i]?'완료 · ':'아직 · ')+(i+1)+'. '+x.name+' — '+x.briefing).join('\n')+'\n'+(row.bossDefeated?'완료 · ':'아직 · ')+'보스: '+data.boss.name+' — '+data.boss.mechanic;
 $('r34Collection').textContent=row.collectible?'찾은 기억: '+row.collectible.name+' — '+row.collectible.description:'수집할 기억: '+data.collectible.name+' — '+data.collectible.description;
 $('r34Wear').hidden=!row.collectible;$('r34Wear').textContent=journey.selectedSkin===row.collectible?.id?'기억 색 벗기':'이 기억의 색 입기';
 $('r34Ending').textContent=journey.completed?journey.ending||'열 장의 여정을 마쳤습니다.':row.solved?data.story.ending:row.bossDefeated?data.story.clue:'세 상황을 지나 보스를 만나면 이야기의 단서를 얻습니다.';
 $('r34MapStart').disabled=!row.unlocked;$('r34MapStart').textContent=!row.unlocked?'앞 장의 수수께끼를 풀어 주세요':row.solved?'이 장 다시 만나기':row.bossDefeated?'수수께끼 이어 풀기':'선택한 장 이어가기';
 renderShopOffer();
 $('r34SaveNotice').textContent=r34StorageOK?'여정은 이 기기에 별도로 저장됩니다.':'이 여정은 현재 실행에서 이어집니다. 읽을 수 없는 저장 원본은 보존됩니다.';
}
function openR34(event){if(currentEdition)return false;
 if(!r34Ready)return false;advanceClock(event?.timeStamp);if(game.state==='play')game.pause();events();stopSound();shopMapOffer=false;r34Selected=Math.max(1,Math.min(10,r34Selected||game.r34JourneyStatus().unlockedChapter));modal('r34Map',r34Active()&&game.state!=='title'?$('r34PanelMap'):$('r34Open'));renderR34Map();sync();$('r34Chapter-'+r34Selected).focus({preventScroll:true});return true;
}
function startR34(event,id=r34Selected,replayFirst=false){if(currentEdition)return false;leaveSquare();
 if(!r34Ready||!r34ChapterRow(id)?.unlocked)return false;
 leaveBridge();clearNarrative();invalidateMemory('r34');leaveOriginIntro();if(hero?.active)leaveHero();grantAudio(event);stopSound();modal(null);collectionOpen=false;
 const choice=replayFirst&&id===1&&r34ChapterRow(1).situations[0]?{situation:0,boss:false}:r34StartChoice(id);if(game.startR34Chapter(id,{...choice,difficulty:r34Difficulty})===false)return false;r34Selected=id;r34Briefing=game.state==='play'&&id===1&&choice.situation===0&&!choice.boss&&!r34ChapterRow(id).situations.some(Boolean);r34LastState='';r34LastCue='';$('r34Answer').value='';resetClock(event?.timeStamp);events();writeR34();sync();draw();return true;
}
function beginR34(event){if(!r34Active()||!r34Briefing)return false;grantAudio(event);r34Briefing=false;if(game.state==='pause')game.resume();resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});announce(controls().cue);return true}
function retryR34(event){if(!r34Active())return false;grantAudio(event);stopSound();if(game.retryR34()===false)return false;r34Briefing=false;r34FlowAt=null;r34LastState='';resetClock(event?.timeStamp);events();writeR34();sync();draw();return true}
function advanceR34(event){if(!r34Active())return false;grantAudio(event);stopSound();if(game.advanceR34()===false)return false;r34Selected=game.r34Status().chapter;r34Briefing=false;r34FlowAt=null;r34LastState='';$('r34Answer').value='';resetClock(event?.timeStamp);events();writeR34();sync();draw();return true}
function answerR34(){if(!r34Active())return false;const result=game.answerR34($('r34Answer').value);writeR34();events();sync();draw();announce(result?.feedback||game.r34Status()?.riddle?.feedback||'답을 확인했습니다.');if(result?.correct)$('r34Advance').focus({preventScroll:true});return !!result?.correct}
function hintR34(){if(!r34Active())return false;const result=game.r34Hint();writeR34();sync();announce($('r34Hints').textContent);return result}
function r34TimingCue(v){const next=v.boss?.nextAction;if(!next)return '다음 움직임을 기다려요';if(next.kind==='memory')return '기억한 순서대로';if(next.pending)return '던진 빛을 기다려요';if(next.windowOpen)return next.expected?'지금 · '+next.label:'누르지 않고 기다리기';return next.anticipation?'준비 · '+next.label:next.label}
function r34ContextCue(v){if(v.echo&&['offer','committed','collected','missed'].includes(v.echo.state))return v.echo.cue;if(v.hitFeedback)return v.hitFeedback.reason||v.reason;if(v.isBoss)return r34TimingCue(v);if(v.inputBuffered)return '착지하면 이어서 점프';if(v.memory)return '길의 순서를 기억해요';const next=v.nextHazard;if(next)return (next.windowOpen&&next.expected?'지금 · ':'')+next.cue;return typeof v.rule==='string'?v.rule:v.rule?.action||'길을 따라 걸어요'}

function masteryText(v,goal=false){const m=v?.mastery;if(!m)return '';const best=m.best?.rank===2?'완벽':m.best?.rank===1?'통과':'미기록';return (goal?'목표 · 위험 '+m.target+'번 정확히 넘기':'넘기 '+m.clean+'/'+m.target)+(m.groundTotal?' · 걷기 '+m.groundClean+'/'+m.groundTotal:'')+' · 최고 '+best+(m.best?.echo?' + 메아리':'')}
function syncR34(){
 const entry=$('r34Open');if(!entry)return;entry.hidden=!r34Ready||game.state!=='title'||collectionOpen||!!dialog;$('bar').classList.toggle('campaign-title',!entry.hidden);
 const active=r34Active()&&game.state!=='title',v=active?game.r34Status():null,flow=active&&game.state==='clear'&&!v.isBoss&&v.canAdvance;
 if(flow&&!dialog&&!collectionOpen&&!document.hidden){if(r34FlowAt===null)r34FlowAt=viewTime;if(viewTime-r34FlowAt>=.35){advanceR34();return}}else r34FlowAt=null;
 const panel=active&&(r34Briefing||['fail','riddle'].includes(game.state)||game.state==='clear'&&!flow);
 if($('flowToast')){$('flowToast').hidden=!flow||!!dialog;$('flowToast').textContent=flow?(v.mastery?.rank===2?'완벽 통과':v.mastery?.rank===1?'통과':'길 완료')+(v.echo?.state==='collected'?' · 메아리 획득':'')+' · 길이 이어집니다…':''}
 $('r34Panel').hidden=!panel||!!dialog||collectionOpen;$('r34Readout').hidden=!active;
 if(!active){r34LastState='';return}
 const state=game.state,riddle=!!v.riddle&&(state==='riddle'||v.isBoss&&state==='clear'),data=r34ChapterData(v.chapter);
 $('primary').hidden=true;$('next').hidden=true;$('map').hidden=true;$('resultDetails').hidden=true;$('home').hidden=false;$('pause').hidden=panel;$('act').hidden=state!=='play'||r34Briefing;$('topLabel').textContent='꿈의 여정 · '+v.chapter+'/10 · '+v.chapterName;
 canvas.tabIndex=panel||dialog?-1:0;canvas.setAttribute('aria-label',v.title+'. '+r34RuleText(v.rule));
 $('r34Begin').hidden=!r34Briefing;$('r34Retry').hidden=state!=='fail';$('r34Advance').hidden=!v.canAdvance||r34Briefing;$('r34Advance').textContent=v.nextLabel||'다음으로';$('r34PanelMap').hidden=false;
 if($('r36Mastery')){$('r36Mastery').hidden=!v.mastery;$('r36Mastery').textContent=masteryText(v,r34Briefing)}
  $('r34Heading').textContent=r34Briefing?'첫 걸음':state==='fail'?'다시 걸어 볼까요':riddle?'꿈의 수수께끼':'꿈을 건넜어요';
 $('r34Briefing').textContent=r34Briefing?'화면을 한 번 눌러 점프.':v.briefing||'';$('r34Briefing').hidden=!r34Briefing;$('r34Rule').textContent=typeof v.rule==='string'?v.rule:v.rule?.action||'';$('r34Rule').hidden=true;$('r34Cause').textContent=v.reason||v.boss?.counter||'';$('r34Cause').hidden=riddle;
 $('r34Story').hidden=!riddle;$('r34Story').textContent=riddle?(v.riddle.clue||data.story.clue):state==='clear'?data.story.ending:data.story.intro;
 $('r34RiddleForm').hidden=!riddle;$('r34Prompt').textContent=v.riddle?.prompt||'';$('r34Hints').textContent=v.riddle?.hint||'';$('r34Feedback').textContent=v.riddle?.feedback||'';
 $('r34Answer').disabled=!riddle||!!v.riddle?.solved;$('r34Submit').disabled=$('r34Answer').disabled;$('r34Hint').disabled=!riddle||!!v.riddle?.solved||(v.riddle?.hintsUsed||0)>=data.riddle.hints.length;
 $('r34RewardWear').hidden=!v.collectible;$('r34RewardWear').textContent=game.r34JourneyStatus().selectedSkin===v.collectible?.id?'기억 색 벗기':'찾은 기억의 색 입기';
 $('r34Reward').textContent=v.collectible?.name?'찾은 기억: '+v.collectible.name+' — '+v.collectible.description:riddle&&v.riddle?.solved?'수수께끼를 풀었습니다. 다음 장이 열렸습니다.':'';
 $('r34Volatile').textContent=r34StorageOK?'':'현재 실행에서 진행을 이어갑니다. 저장은 사용할 수 없습니다.';
 const cue=[v.boss?.phaseName,r34TimingCue(v),v.boss?.cue,v.boss?.counter,v.memory,v.reason].filter(Boolean).join(' · '),readout=v.chapter+'/10장 · '+v.title+' · 생명 '+v.hearts+' · '+cue;
 $('r34Readout').textContent=readout;if(cue&&cue!==r34LastCue&&!panel&&!dialog){announce(cue);r34LastCue=cue}
 const focusKey=r34Briefing?'brief:'+v.chapter+':'+v.situation+':'+v.isBoss:panel?state+':'+v.chapter:'';
 if(focusKey&&focusKey!==r34LastState&&!dialog){const target=r34Briefing?'r34Begin':state==='fail'?'r34Retry':riddle&&!v.riddle.solved?'r34Answer':v.canAdvance?'r34Advance':'r34PanelMap';$(target).focus({preventScroll:true});announce($('r34Heading').textContent+'. '+$('r34Cause').textContent)}r34LastState=dialog?'':focusKey;
 if(dialog==='r34Map')renderR34Map();
}

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
function openMemories(trigger){if(currentEdition)return false;if(!M)return false;memoryParent=dialog==='settings'?'settings':null;if(game.state==='play'){game.pause();events();stopSound()}if(memoryDirty)writeMemories();else readMemories();renderMemories();modal('memories',trigger||$('resultDetails'));sync();$('memoriesClose').focus();return true}
function startMemoryChallenge(event){if(currentEdition)return false;memoryParent=null;return startOrigin(event,0)}
// Checkpoint selection is a paused system screen, never an in-play speech panel.
let journeySelection=0;
function journeyUnlocked(index){return Number.isInteger(index)&&index>=0&&index<=4&&(index===4?originProgress.finaleUnlocked:index<=originProgress.checkpoint)}
function renderJourney(){
 for(let i=0;i<5;i++){const button=$('journey-'+i),unlocked=journeyUnlocked(i);button.disabled=!unlocked;button.setAttribute('aria-pressed',String(i===journeySelection));button.textContent=(i===4?'마지막 방':(i+1)+'. '+C.originRoute.chapters[i].name)+(unlocked?'':' · 아직 도착하지 않음')}
 $('journeyNotice').textContent=(journeySelection===0?'처음부터 마지막 방까지 한 번에 통과하면 세 가지 기억에 도전할 수 있습니다.':'중간 구간 연습입니다. 여기서 시작한 여정은 기억 수집에 포함되지 않습니다.')+' 가장 멀리 도착한 체크포인트와 이미 찾은 기억은 유지됩니다.';
 $('journeyStart').textContent=journeySelection===0?'처음부터 시작':'선택한 구간에서 시작';
}
function openJourney(){if(currentEdition)return false;
 if(game.state==='play'){game.pause();events();stopSound()}
 journeySelection=originProgress.finaleUnlocked&&!originProgress.completed?4:originProgress.completed?0:originProgress.checkpoint;
 renderJourney();modal('journey',$('journeyOpen'));sync();$('journey-'+journeySelection).focus();return true;
}
function selectJourney(index){if(dialog!=='journey'||!journeyUnlocked(index))return false;journeySelection=index;renderJourney();return true}
function startJourney(event){if(currentEdition)return false;if(dialog!=='journey'||!journeyUnlocked(journeySelection))return false;return journeySelection===4?startFinale(event,true):startOrigin(event,journeySelection)}
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
function startOriginIntro(event){if(currentEdition)return false;leaveBridge();clearNarrative();invalidateMemory('intro');grantAudio(event);stopSound();modal(null);collectionOpen=false;originLearning=true;game.beginTutorial('approach');resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});return true}
function startOrigin(event,chapterIndex){if(currentEdition)return false;leaveSquare();
 leaveBridge();clearNarrative();bridgeUsed=false;replyUsed=false;dayNightUsed=false;replyReturnPending=false;invitationSeen.clear();clearInvitationAnnouncement();invitationQuietUntil=viewTime+1;
 if(!originProgress.introDone){memoryIntroChapter=chapterIndex;return startOriginIntro(event)}leaveOriginIntro();
 if(chapterIndex===undefined&&originProgress.finaleUnlocked&&!originProgress.completed)return startFinale(event);if(chapterIndex===undefined)chapterIndex=originProgress.completed?0:originProgress.checkpoint;
 grantAudio(event);if(hero?.active)leaveHero();stopSound();modal(null);collectionOpen=false;originStart=Math.max(0,Math.min(originProgress.checkpoint,Math.floor(chapterIndex)||0));beginMemory(originStart);game.startOrigin(originStart);resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});announce(controls().cue);return true;
}

function startFinale(event,direct=false){if(currentEdition)return false;leaveSquare();if(!originProgress.finaleUnlocked)return false;leaveBridge();if(direct||game.mode!=='origin-finale'||game.state==='title')clearNarrative();invalidateMemory('finale-retry');grantAudio(event);if(hero?.active)leaveHero();stopSound();modal(null);collectionOpen=false;const travel=game.mode==='origin-finale'?game.originTravelResult:null;game.startOriginFinale(travel);resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});return true}

let dreamPlayer=null,licensedPlayer=null;
const restorationAudioController=typeof MongyuRestorationAudioLifecycle!=='undefined'?MongyuRestorationAudioLifecycle.createController({chapterScores:true,mapScores:true}):null;
let restorationAudioIntent=null,audioSuspended=false;
let musicBus=null,sfxBus=null;
let audio=null,audioGesture=false,audioGeneration=0,audioPending=null,audioBlocked=false,musicPhase=null,musicAccent=false,acc=0,last=null,viewTime=0;let cachedProgress=null,cachedView=null;let resultClockKey=null,resultElapsed=0;
function syncResultClock(){const key=game.state==='clear'&&game.gameMode==='kick-arena'?game.result:null;if(key!==resultClockKey){resultClockKey=key;resultElapsed=0}return key}
function campaignView(){if(cachedProgress!==settings.campaign){cachedProgress=settings.campaign;const clearedIds=new Set(settings.campaign.completed),solvedIds=new Set(settings.campaign.riddles),unlockedIds=new Set(C.levels.filter(l=>l.id===1||clearedIds.has(l.id-1)&&(l.chapter===1||solvedIds.has(l.chapter-1))).map(l=>l.id)),summary={completed:clearedIds.size,currentCompleted:[...clearedIds].filter(id=>settings.campaign.records[id]?.contentVersion===6).length,legacyCompleted:[...clearedIds].filter(id=>settings.campaign.records[id]?.contentVersion===5).length,total:100,solved:solvedIds.size,unlocked:unlockedIds.size,nextLevel:[...unlockedIds].find(id=>!clearedIds.has(id))||null,finished:clearedIds.size===100&&solvedIds.size===10};cachedView={unlockedIds,clearedIds,summary}}return cachedView}const voices=new Set(),savedResults=new WeakSet();
function storageMessage(){const message=!originStorageOK?'사각의 꿈 진행을 아직 저장하지 못했습니다. 현재 실행에서는 계속할 수 있습니다.':!storageOK?'저장 불가 · 기록은 현재 실행에 남아 있습니다. 저장 공간·권한 복구 후 다시 저장합니다.':storageNotice;$('storage').hidden=!message;$('storage').textContent=message;$('saveState').textContent='사각의 꿈 · '+(originProgress.completed?'여정 완료':originProgress.finaleUnlocked?'마지막 방에서 이어가기':(originProgress.checkpoint+1)+'번째 구간부터 이어가기')+' / 수집 '+campaignView().summary.completed+'/100 · 새 방식 '+campaignView().summary.currentCompleted+'/100 · 수수께끼 '+campaignView().summary.solved+'/10'+(!storageOK?' · 아직 저장되지 않은 진행이 있습니다':' · 기기에 저장됩니다')}
function mergeRecovered(prior){
 if(!prior)return;settings.best=Math.max(settings.best,prior.best);for(const key of ['mute','musicVolume','sfxVolume','reduced','dreamIntensity'])if(!settingsTouched.has(key))settings[key]=prior[key];
 const ranks={new:0,learning:1,skipped:2,complete:3};if(ranks[prior.tutorialStatus]>ranks[settings.tutorialStatus]){settings.tutorialStatus=prior.tutorialStatus;settings.tutorialStep=prior.tutorialStep}else if(prior.tutorialStatus===settings.tutorialStatus&&prior.tutorialStatus==='learning'&&QuadRiftHD.TUTORIAL_STEPS.indexOf(prior.tutorialStep)>QuadRiftHD.TUTORIAL_STEPS.indexOf(settings.tutorialStep))settings.tutorialStep=prior.tutorialStep;
 // Match P.complete: a current-rules clear wins before comparing scores. Keep
 // one whole verified run; never combine favorable fields from different runs.
 const better=(candidate,previous)=>!previous||candidate.contentVersion>previous.contentVersion||candidate.contentVersion===previous.contentVersion&&(candidate.score>previous.score||candidate.score===previous.score&&(candidate.hits<previous.hits||candidate.hits===previous.hits&&candidate.time<previous.time));
 const a=prior.campaign,b=settings.campaign,records={...a.records};for(const id of Object.keys(b.records))if(better(b.records[id],records[id]))records[id]=b.records[id];const hints={...a.hints};for(const id of Object.keys(b.hints))hints[id]=Math.max(hints[id]||0,b.hints[id]);settings.campaign=P.normalize({schema:5,completed:[...new Set([...a.completed,...b.completed])],riddles:[...new Set([...a.riddles,...b.riddles])],records,hints,selected:b.selected});game.best=Math.max(game.best,settings.best);if(['complete','skipped'].includes(settings.tutorialStatus))game.tutorialDone=true;
}
function write(){
 try{
  // A read failure is not an empty save. Re-read and reconcile before any write.
  {const recovering=primaryReadFailed||backupReadFailed;const raw=localStorage.getItem(KEY),backup=localStorage.getItem(BACKUP),good=decode(raw),goodBackup=decode(backup);mergeRecovered(goodBackup);mergeRecovered(good);if(raw&&!good){if(corruptRaw!==null&&corruptRaw!==raw)throw Error('읽지 못한 원본이 추가로 있습니다');corruptRaw=raw;recoveryArchived=false}else if(!raw&&backup&&!goodBackup){if(corruptRaw!==null&&corruptRaw!==backup)throw Error('읽지 못한 백업이 추가로 있습니다');corruptRaw=backup;recoveryArchived=false}if(backup&&!goodBackup){if(corruptBackupRaw!==null&&corruptBackupRaw!==backup)throw Error('읽지 못한 백업 원본이 추가로 있습니다');corruptBackupRaw=backup;recoveryBackupArchived=false}lastGoodRaw=good?raw:goodBackup?backup:null;primaryReadFailed=false;backupReadFailed=false;if(recovering)storageNotice=raw||backup?'저장 접근이 복구되어 기존 기록과 이번 진행을 함께 보존했습니다.':''}
  settings.schema=5;if(!hero?.active&&!originActive())settings.best=Math.max(settings.best,game.best);settings.campaign=P.normalize(settings.campaign);const next=JSON.stringify(settings);
  if(corruptRaw!==null&&!recoveryArchived){const archived=localStorage.getItem(RECOVERY);if(archived&&archived!==corruptRaw)throw Error('이전 복구 원본을 보존해야 합니다');if(!archived)localStorage.setItem(RECOVERY,corruptRaw);if(localStorage.getItem(RECOVERY)!==corruptRaw)throw Error('복구 원본 보관 확인 실패');recoveryArchived=true}
  if(corruptBackupRaw!==null&&!recoveryBackupArchived){const archived=localStorage.getItem(RECOVERY_BACKUP);if(archived&&archived!==corruptBackupRaw)throw Error('이전 백업 복구 원본을 보존해야 합니다');if(!archived)localStorage.setItem(RECOVERY_BACKUP,corruptBackupRaw);if(localStorage.getItem(RECOVERY_BACKUP)!==corruptBackupRaw)throw Error('백업 복구 원본 보관 확인 실패');recoveryBackupArchived=true}
  // A durable previous-good copy is written before primary, including first migration.
  localStorage.setItem(BACKUP,lastGoodRaw||next);localStorage.setItem(KEY,next);
  if(localStorage.getItem(KEY)!==next)throw Error('저장 확인 실패');lastGoodRaw=next;storageOK=true;
 }catch(e){storageOK=false}
 writeOrigin();storageMessage();fit();return storageOK;
}
let viewport={width:360,height:480,scale:1,offsetX:0,offsetY:0,dpr:1};
function fit(){
 const previousViewport=viewport;const box=$('stage'),w=Math.max(1,box.clientWidth||360),h=Math.max(1,box.clientHeight||480),scale=Math.max(.01,Math.min(w/360,h/480)),dpr=globalThis.MongyuPresentation?MongyuPresentation.pixelRatio(w,h,window.devicePixelRatio||1):Math.max(1,Math.min(2,window.devicePixelRatio||1));
 viewport={width:w,height:h,scale,offsetX:(w-360*scale)/2,offsetY:(h-480*scale)/2,dpr};
 canvas.style.width=w+'px';canvas.style.height=h+'px';const collection=$('collection');collection.style.width=360*scale+'px';collection.style.height=480*scale+'px';collection.className='collection-layer'+(scale<.89?' compact':'');
 const bw=Math.max(1,Math.round(w*dpr)),bh=Math.max(1,Math.round(h*dpr));if(canvas.width!==bw||canvas.height!==bh){canvas.width=bw;canvas.height=bh}canvas.dataset.dpr=String(dpr);canvas.dataset.logicalSize='360x480';
 if(activeSquareRun?.mode==='restoration'&&(previousViewport.width!==w||previousViewport.height!==h)){const wasPlaying=['play','transition'].includes(activeSquareRun.state);if(wasPlaying){activeSquareRun.pause();resetOriginHeld();last=null;acc=0;stopSound()}activeSquareRun.setViewport?.(w,h);squareStatusAt=-1;squareStatusKey='';if(wasPlaying){events();syncSquare(true);announce('화면 방향이 바뀌어 잠시 멈췄습니다. 계속하기를 눌러 주세요.')}}
}
let r36Impulse=null;
function feedbackView(){if(!r36Impulse||r36Impulse.owner!==game.r34Run||!['play','pause'].includes(game.state))return null;const age=game.time-r36Impulse.at;return age>=0&&age<.24?{kind:r36Impulse.kind,age}:null}
function draw(){syncResultClock();ctx.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);if(typeof MongyuSquareArt!=='undefined'){const opts={viewport:{...viewport},reduced:settings.reduced,essentialMotion:true,dreamIntensity:settings.dreamIntensity,time:viewTime,music:activeSquareRun?.nativeRuntime||!activeSquareRun&&squareRun&&game.state==='title'?null:licensedPlayer?.inspect(),presentationTime:typeof MongyuMobile!=='undefined'?MongyuMobile.clock(viewTime,activeSquareRun?.state||game.state):undefined};if(activeSquareRun){opts.time=activeSquareRun.time;if(activeSquareRun.openingCourse){MongyuOpening.draw(ctx,activeSquareRun,opts);return}opts.aftermath=restorationUI?.aftermathRenderFor(activeSquareRun);MongyuSquareArt.draw(ctx,activeSquareRun,opts);return}if(squareRun&&game.state==='title'&&!collectionOpen){if(typeof MongyuMobile!=='undefined'){MongyuMobile.title(ctx,opts);return}if(restorationUI&&typeof QuadRiftRestoration!=='undefined'){if(!restorationTitleRun)restorationTitleRun=new (globalThis.MongyuNativeRestoration||QuadRiftRestoration).RestorationRun({slot:MongyuRestorationCatalog.getSlot(2),viewport:{width:viewport.width,height:viewport.height},practice:true});if(restorationTitleRun.viewport.width!==viewport.width||restorationTitleRun.viewport.height!==viewport.height){restorationTitleRun.setViewport(viewport.width,viewport.height);restorationTitleGeometry=null}const preview=restorationTitleGeometry||(restorationTitleGeometry=restorationTitleRun.geometry());preview.time=viewTime;MongyuSquareArt.draw(ctx,restorationTitleRun,opts,preview)}else MongyuSquareArt.title(ctx,opts);return}}QuadRiftArt.draw(ctx,game,{viewport:{...viewport},reduced:settings.reduced,dreamIntensity:settings.dreamIntensity,time:viewTime,resultElapsed,feedback:feedbackView(),epilogue:finaleEpilogue(),outcome:{...narrative},collection:collectionOpen?{chapter,progress:settings.campaign,selectedId,time:viewTime,reduced:settings.reduced,...campaignView()}:null})}

function announce(message){clearInvitationAnnouncement();invitationQuietUntil=viewTime+1;$('status').textContent=message}
function grantAudio(event){if(event?.isTrusted===true&&!document.hidden){audioGesture=true;audioSuspended=false;audioBlocked=false;licensedPlayer?.retry()}}
const restorationSettingsHidden=new Map();
function activeRestorationSettings(){return activeSquareRun?.mode==='restoration'&&['play','pause'].includes(activeSquareRun.state)?activeSquareRun:null}
function mountRunSettings(){
 const panel=$('settings');if(!panel||$('restorationRunSettings'))return;
 const group=document.createElement('div');group.setAttribute('id','restorationRunSettings');group.setAttribute('role','group');group.setAttribute('aria-label','이번 달리기 설정');group.hidden=true;
 for(const [id,label]of [['restorationRunSettingNotice','이번 달리기에만 적용됩니다.'],['restorationRunSpeed','속도'],['restorationRunVibration','시각 진동']]){const node=document.createElement(id.endsWith('Notice')?'p':'button');node.setAttribute('id',id);node.textContent=label;group.appendChild(node)}
 const box=panel.querySelector('.box')||panel;if(box.insertBefore)box.insertBefore(group,$('mute'));else box.appendChild(group);
 const legacyHelp=[...box.children].find(node=>node.tagName==='P'&&!node.id);if(legacyHelp)legacyHelp.setAttribute('id','restorationLegacySettingsHelp');
 $('restorationRunSpeed').onclick=e=>{const run=activeRestorationSettings();if(run)changeRunSetting('speed',run.settings.speed==='fast'?'slow':'fast',e)};
 $('restorationRunVibration').onclick=e=>{const run=activeRestorationSettings();if(run)changeRunSetting('vibration',!run.settings.vibration,e)};
}
function syncRunSettings(){
 const group=$('restorationRunSettings');if(!group)return;const run=activeRestorationSettings();group.hidden=!run;
 $('pauseOptions').textContent=run?'설정':'소리·화면';$('settingsTitle').textContent=run?'달리기 설정':'소리와 화면';
 for(const id of ['journeyOpen','memoriesOpen','replay','tiltOpen','tutorialState','saveState','restorationLegacySettingsHelp']){const node=$(id);if(!node)continue;if(run){if(!restorationSettingsHidden.has(node))restorationSettingsHidden.set(node,node.hidden);node.hidden=true}else if(restorationSettingsHidden.has(node)){node.hidden=restorationSettingsHidden.get(node);restorationSettingsHidden.delete(node)}}
 if(!run)return;
 const ready=dialog==='settings'&&run.state==='pause'&&(run.time>0||run.slot?.rule.type==='setting'&&Number.isInteger(run.options.frontier))&&!document.hidden;
 $('restorationRunSpeed').textContent='속도 · '+({default:'기본',slow:'느리게',fast:'빠르게'}[run.settings.speed]);$('restorationRunSpeed').disabled=!ready;
 $('restorationRunVibration').textContent='시각 진동 · '+(run.settings.vibration?'켜짐':'꺼짐');$('restorationRunVibration').setAttribute('aria-pressed',String(run.settings.vibration));$('restorationRunVibration').disabled=!ready;
 $('restorationRunSettingNotice').textContent=run.settingCredit?'설정 변경을 기록했습니다. 설정을 닫고 돌아가면 결과를 확인할 수 있습니다.':ready?'이 달리기에 적용됩니다. 설정을 바꾸고 돌아가세요.':'달리기를 시작한 뒤 설정을 바꾸세요.';
}
function changeRunSetting(name,value,event){
 const run=activeRestorationSettings();if(!run||dialog!=='settings'||run.state!=='pause'||document.hidden)return false;
 const receipt=run.setSetting(name,value);if(!receipt.accepted)return false;
 if(restorationTrial?.owner===run&&name===run.slot.rule.setting){restorationTrial.audioExperienced=false;restorationTrial.visualExperienced=false;restorationTrial.disabledExperienced=false;restorationTrial.impact=null;if(name==='sound')restorationTrial.soundSuppressed=!value;}
 if(name==='vibration'&&restorationTrial?.owner===run)restorationTrial.impact=null;
 if(name==='sound'){if(value)grantAudio(event);stopSound();syncAudioVolumes()}
 restorationUI?.settingChanged(run,receipt);squareStatusAt=-1;sync();draw();return true;
}
function isSoundTrial(){return restorationTrial?.owner===activeSquareRun&&activeSquareRun?.mode==='restoration'&&activeSquareRun.slot?.rule?.setting==='sound'&&typeof activeSquareRun.options?.settingValue==='boolean'&&['play','pause','transition'].includes(activeSquareRun.state)}
function effectiveAudio(){if(isSoundTrial()&&['play','transition'].includes(activeSquareRun.state)&&!dialog&&!document.hidden)return restorationTrial.soundSuppressed?{mute:true,musicVolume:0,sfxVolume:0}:{mute:false,musicVolume:.4,sfxVolume:.45};return settings}
function trialSettingExperienced(run){if(restorationTrial?.owner!==run)return false;const setting=run.slot?.rule?.setting,value=run.options?.settingValue;if(['sound','vibration'].includes(setting)&&value===false)return run.settingProof().settingExperienced&&restorationTrial.disabledExperienced;return !run.settingProof().settingExperienced?false:setting==='sound'?restorationTrial.audioExperienced:setting==='vibration'?restorationTrial.visualExperienced:['fast','slow'].includes(value)}
function trialFeedbackEvent(run,event){if(restorationTrial?.owner!==run)return;if(['pause','clear','fail'].includes(event)){restorationTrial.impact=null;return}if(['jump','land','hit','pass','corner'].includes(event)&&run.state==='play'&&!dialog&&!document.hidden&&run.options?.settingValue===false){const setting=run.slot?.rule?.setting;if(setting==='vibration'||setting==='sound'&&restorationTrial.soundSuppressed&&effectiveAudio().mute)restorationTrial.disabledExperienced=true;}if(run.settings?.vibration===true&&(run.slot?.rule?.setting==='vibration'||run.settingChanges.some(c=>c.name==='vibration'))&&['jump','land','hit','pass','corner'].includes(event)&&run.state==='play'&&!dialog&&!document.hidden){restorationTrial.visualExperienced=true;restorationTrial.impact={kind:event,text:{jump:'점프',land:'착지',hit:'충돌',pass:'통과',corner:'벽의 변화'}[event]}}}
function syncTrialFeedback(){const node=$('restorationImpact');if(!node)return;const impact=restorationTrial?.owner===activeSquareRun?restorationTrial.impact:null,playing=activeSquareRun?.state==='play'&&!dialog&&!document.hidden,soundNotice=isSoundTrial()?(restorationTrial.soundSuppressed?'체험 소리 꺼짐':audioBlocked?'체험 소리를 재생할 수 없습니다.':''):'';node.hidden=!playing||!impact&&!soundNotice;if(!node.hidden){const text=soundNotice||'시각 신호 · '+impact.text;if(node.textContent!==text)node.textContent=text;node.dataset.kind=soundNotice?'notice':impact.kind}}

function audioAllowed(){const values=effectiveAudio();return !values.mute&&(values.musicVolume>0||values.sfxVolume>0)&&audioGesture&&(activeSquareRun?['play','transition'].includes(activeSquareRun.state):game.state==='play')&&!dialog&&!collectionOpen&&!document.hidden}
// R76 screen music has its own permission; gameplay SFX keep audioAllowed().
function restorationMusicRequest(){return restorationAudioController?.update({enabled:!!restorationUI,title:game.state==='title'&&!collectionOpen,dialog,entry:restorationAudioIntent,run:activeSquareRun?.mode==='restoration'?activeSquareRun:null,otherRun:!!activeSquareRun&&activeSquareRun.mode!=='restoration'})||null}
function restorationMusicAllowed(request=restorationMusicRequest()){const values=effectiveAudio(),backend=request?.scope==='gameplay'||typeof MongyuLicensedScore!=='undefined'&&typeof window.Audio==='function'&&Object.values(globalThis.MONGYU_EMBEDDED_MUSIC||{}).some(t=>t.src)&&licensedPlayer?.inspect().status!=='unsupported';return backend&&!!request&&!values.mute&&values.musicVolume>0&&audioGesture&&!audioSuspended&&!document.hidden&&!sceneCueOwner&&!shopAudioOwner&&!transitionOwner}
function anyAudioOwnerAllowed(){return !audioSuspended&&(audioAllowed()||restorationMusicAllowed())}
function restorationAudioEntry(entry,event){grantAudio(event);restorationAudioIntent=entry;dreamMusic();syncMusicInfo()}
function stopSceneCue(){sceneCueOwner=null;for(const voice of [...voices])if(voice._role==='scene-cue')releaseVoice(voice);if(audio&&!anyAudioOwnerAllowed()&&voices.size===0)Promise.resolve(audio.suspend()).catch(()=>{})}
// Separate gain buses preserve the existing per-voice mix at the default 100%.
function syncAudioVolumes(){const values=effectiveAudio();if(values.mute||values.musicVolume===0)licensedPlayer?.stop();for(const [bus,value] of [[musicBus,values.musicVolume],[sfxBus,values.sfxVolume]])if(bus){const target=values.mute?0:value;try{bus.gain.cancelScheduledValues?.(audio.currentTime);if(target>0&&bus.gain.setTargetAtTime)bus.gain.setTargetAtTime(target,audio.currentTime,.015);else if(bus.gain.setValueAtTime)bus.gain.setValueAtTime(target,audio.currentTime);else bus.gain.value=target}catch(e){bus.gain.value=target}}syncMusicInfo()}
function syncVolumeControls(){for(const key of ['musicVolume','sfxVolume']){const node=$(key),percent=Math.round(settings[key]*100);if(node){node.disabled=!!isSoundTrial();node.value=String(percent);node.setAttribute('aria-valuetext',percent+'%')}if($(key+'Value'))$(key+'Value').textContent=percent+'%'}syncAudioVolumes()}
function releaseVoice(o){voices.delete(o);o.onended=null;try{o.stop()}catch(e){}try{o.disconnect();o._gain?.disconnect()}catch(e){}}
function stopSound(){sceneCueOwner=null;shopAudioOwner=null;licensedPlayer?.stop();if(dreamPlayer)dreamPlayer.stop();if(squarePlayer)squarePlayer.stop();audioGeneration++;audioPending=null;transitionOwner=null;musicPhase=null;musicAccent=false;for(const o of [...voices])releaseVoice(o);if(audio)try{Promise.resolve(audio.suspend()).catch(()=>{})}catch(e){}syncAudioVolumes();}
function ensureAudioGraph(){if(!audio){const Context=window.AudioContext||window.webkitAudioContext;if(!Context){audioBlocked=true;throw Error('Audio unavailable')}audio=new Context();musicBus=audio.createGain();sfxBus=audio.createGain();musicBus.connect(audio.destination);sfxBus.connect(audio.destination);const values=effectiveAudio();musicBus.gain.value=values.mute?0:values.musicVolume;sfxBus.gain.value=values.mute?0:values.sfxVolume}}

const transitionResults=new WeakSet(),transitionCheckpoints=new WeakMap();let transitionOwner=null,sceneCueOwner=null;
function transitionSound(kind){
 if(audioSuspended||!audioGesture||settings.mute||settings.sfxVolume===0||document.hidden||dialog||collectionOpen)return false;
 const owner=activeSquareRun||game,result=owner.result,state=owner.state,mode=owner.mode,arcade=game.arcade,act=arcade?.act;
 if(kind==='checkpoint'){if(state!=='arcade-choice'||!arcade)return false;const seen=transitionCheckpoints.get(arcade)||new Set();if(seen.has(act))return false;seen.add(act);transitionCheckpoints.set(arcade,seen)}
 else {if(!result||typeof result!=='object'||!['clear','fail','riddle'].includes(state)||transitionResults.has(result))return false;transitionResults.add(result)}
 const generation=audioGeneration,valid=()=>generation===audioGeneration&&audioGesture&&!settings.mute&&settings.sfxVolume>0&&!document.hidden&&!dialog&&!collectionOpen&&(activeSquareRun||game)===owner&&owner.state===state&&owner.mode===mode&&(kind==='checkpoint'?game.arcade===arcade&&game.arcade.act===act:owner.result===result);
 try{ensureAudioGraph();const token={generation,result,state};transitionOwner=token;const schedule=()=>{if(!valid()||audio.state!=='running'){if(transitionOwner===token)transitionOwner=null;if(!transitionOwner&&!anyAudioOwnerAllowed()&&voices.size===0)Promise.resolve(audio.suspend()).catch(()=>{});return false;}const t=audio.currentTime,o=audio.createOscillator(),gain=audio.createGain();o.type='sine';o.frequency.setValueAtTime(kind==='fail'?180:kind==='checkpoint'?430:520,t);o.frequency.exponentialRampToValueAtTime(kind==='fail'?90:kind==='checkpoint'?570:780,t+.18);gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(.028,t+.012);gain.gain.exponentialRampToValueAtTime(.001,t+.22);o.connect(gain);gain.connect(sfxBus);o._role='transition';o._gain=gain;voices.add(o);o.onended=()=>{releaseVoice(o);if(transitionOwner===token)transitionOwner=null;if(valid()&&voices.size===0)Promise.resolve(audio.suspend()).catch(()=>{})};o.start();o.stop(t+.24);return true};if(audio.state==='running')return schedule();Promise.resolve(audio.resume()).then(schedule).catch(()=>{});return true}catch(e){return false}
}

// Authored two-note bell for the ringtone memory; never recovered original audio.
function restorationSceneCue(kind,event){
 const scene=restorationUI?.view().scene;
 if(kind!=='ringtone'||event?.isTrusted!==true||dialog!=='restorationScene'||scene?.effect!=='ringtone'||scene.kind!=='interlude')return false;
 grantAudio(event);stopSound();if(!audioGesture||settings.mute||settings.sfxVolume===0||document.hidden)return false;
 const generation=audioGeneration,index=scene.index,token={generation};sceneCueOwner=token;
 const valid=()=>{const current=restorationUI?.view().scene;return sceneCueOwner===token&&generation===audioGeneration&&audioGesture&&!settings.mute&&settings.sfxVolume>0&&!document.hidden&&dialog==='restorationScene'&&current?.effect==='ringtone'&&current.kind==='interlude'&&current.index===index};
 const releaseOwner=()=>{if(sceneCueOwner===token)sceneCueOwner=null;if(!sceneCueOwner&&!shopAudioOwner&&!transitionOwner&&!anyAudioOwnerAllowed()&&voices.size===0&&audio)Promise.resolve(audio.suspend()).catch(()=>{})};
 try{ensureAudioGraph();syncAudioVolumes();const schedule=()=>{
  if(!valid()||audio.state!=='running'){releaseOwner();return false}
  const t=audio.currentTime;
  [880,1174.66].forEach((frequency,i)=>{if(voices.size>=8)return;const o=audio.createOscillator(),gain=audio.createGain(),at=t+i*.18;o.type='sine';o.frequency.setValueAtTime(frequency,at);gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(.045,at+.006);gain.gain.exponentialRampToValueAtTime(.001,at+.28);o.connect(gain);gain.connect(sfxBus);o._role='scene-cue';o._gain=gain;voices.add(o);o.onended=()=>{releaseVoice(o);if(sceneCueOwner===token&&voices.size===0)releaseOwner()};o.start(at);o.stop(at+.3)});
  return true;
 };if(audio.state==='running')return schedule();Promise.resolve(audio.resume()).then(schedule).catch(releaseOwner);return true}catch(e){stopSound();return false}
}

function readyAudio(screenMusic=false){
 if(audioSuspended||!(screenMusic?restorationMusicAllowed():audioAllowed())||audioBlocked)return false;
 try{ensureAudioGraph();syncAudioVolumes();
 if(audioPending)return false;if(audio.state==='running')return true;
 if(audio.state==='closed'){audioBlocked=true;return false}
 if(!audioPending){const generation=audioGeneration,token={generation};audioPending=token;Promise.resolve(audio.resume()).then(()=>{if(!anyAudioOwnerAllowed()&&!transitionOwner&&!sceneCueOwner)return audio.suspend();/* A newer valid session owns the running context; never schedule stale notes. */}).catch(()=>{if(generation===audioGeneration)audioBlocked=true}).finally(()=>{if(audioPending===token)audioPending=null})}
 }catch(e){audioPending=null;audioBlocked=true}return false;
}
function musicNote(note){
 if(settings.musicVolume===0||!readyAudio()||voices.size>=8)return;
 const role=note.accent?'accent':'music';if([...voices].some(o=>o._role===role))return;
 let o;try{const data=MongyuJourneyAudio.pcm(note,audio.sampleRate),buffer=audio.createBuffer(1,data.length,audio.sampleRate);buffer.getChannelData(0).set(data);o=audio.createBufferSource();o.buffer=buffer;o._role=role;o.connect(musicBus);voices.add(o);o.onended=()=>releaseVoice(o);o.start();o.stop(audio.currentTime+note.duration)}catch(e){if(o)releaseVoice(o)}
}
function musicView(){
 const credit=typeof MongyuLicensedScore==='undefined'?[]:MongyuLicensedScore.credits();
 const view=licensedPlayer?.inspect();
 if(view?.status==='unsupported')return {...view,backend:'procedural-fallback',title:'Original procedural fallback',playing:!!activeSquareRun&&audioAllowed()&&effectiveAudio().musicVolume>0&&!!squarePlayer?.inspect().active,credits:credit};
 return {roleIntent:restorationAudioController?.inspect()||null,originalAudioRestored:false,substituteRecordingCount:credit.length,...(view||{backend:'licensed-media',status:'idle',playing:false,title:credit[0]?.title||'',artist:credit[0]?.artist||'',pulse:0,beatPhase:0,beatAligned:false}),credits:credit};
}
function syncMusicInfo(){
 const panel=$('settings');
 if(panel?.hidden||dialog!=='settings')return;
 const view=musicView(),node=$('musicPlayback'),credits=$('musicCredits');
 if(node){const stamp=n=>Number.isFinite(n)?Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0'):'–:––',state=view.playing?'재생 중':view.status==='paused'?'일시정지':view.status==='loading'?'음악을 불러오는 중':'음악';const label=view.backend==='procedural-fallback'?'녹음 재생을 지원하지 않아 기본 합성 음악을 사용합니다.':view.status==='blocked'?'재생이 차단되었습니다. 계속하기를 눌러 소리를 다시 허용해 주세요.':state+' · '+(view.title||'플레이를 시작하면 음악이 재생됩니다.')+(view.artist?' — '+view.artist:'')+' · '+stamp(view.position||0)+' / '+stamp(view.duration);const description=label+'';if(node.textContent!==description)node.textContent=description}
 if(credits){const key=view.credits.map(t=>t.id+':'+t.changes).join('|');if(credits.dataset.creditKey!==key){credits.dataset.creditKey=key;const nodes=[];view.credits.forEach((t,i)=>{const title=document.createElement('p');title.textContent=t.title+' — '+t.artist;const source=document.createElement('a');source.id='musicSource'+i;source.setAttribute('id',source.id);source.setAttribute('href',t.sourceUrl);source.target='_blank';source.rel='noopener noreferrer';source.textContent='곡 출처 · '+t.sourceUrl;source.setAttribute('aria-label',t.title+' 곡 출처');const license=document.createElement('a');license.id='musicLicense'+i;license.setAttribute('id',license.id);license.setAttribute('href',t.licenseUrl);license.target='_blank';license.rel='noopener noreferrer';license.textContent=t.license+' · '+t.licenseUrl;license.setAttribute('aria-label',t.title+' '+t.license+' 이용 조건');const changes=document.createElement('p');changes.textContent=t.edit?'게임용 발췌·음량 정리·시작과 끝 페이드·형식 변환을 적용했습니다.':t.license==='Project-original composition'?'몽유를 위해 제작한 오리지널 음악입니다.':t.strippedPrefixBytes?'다운로드에 붙은 오류 문구만 제거했으며 음원은 그대로입니다.':'원본 음원을 그대로 사용합니다.';nodes.push(title,source,license,changes)});if(nodes.length){const note=document.createElement('p');note.textContent='음악: Eric Skiff · Resistor Anthems · https://ericskiff.com/music/ · CC BY 4.0. 게임에 맞게 발췌·음량 정리·페이드·형식 변환했습니다. 놈3 원본 음원이 아닙니다.';nodes.push(note)}credits.replaceChildren(...nodes)}}
}
if($('musicCreditsToggle'))$('musicCreditsToggle').onclick=()=>{const node=$('musicCredits');if(!node)return;node.hidden=!node.hidden;$('musicCreditsToggle').setAttribute('aria-expanded',String(!node.hidden))};
function dreamMusic(){
 const request=restorationMusicRequest(),permitted=request?restorationMusicAllowed(request):activeSquareRun?.mode==='restoration'?false:audioAllowed();
 if(activeSquareRun||request){
  if(!permitted){licensedPlayer?.stop();squarePlayer?.stop();return}
  // Screen music needs a packaged licensed backend; no new procedural scene score.
  if(!activeSquareRun&&(typeof MongyuLicensedScore==='undefined'||!Object.values(globalThis.MONGYU_EMBEDDED_MUSIC||{}).some(t=>t.src)))return;
  // Invoke media.play within the trusted start/resume handler even while the
  // AudioContext resume promise is pending; the bus remains silent until ready.
  const contextReady=readyAudio(!!request);if(!contextReady&&(!audio||audioBlocked))return;
  try{
   if(typeof MongyuLicensedScore!=='undefined'){
    if(!licensedPlayer)licensedPlayer=MongyuLicensedScore.createPlayer(audio,{musicDestination:musicBus});
    const media=licensedPlayer.update({authorized:audioGesture,allowed:permitted,musicVolume:effectiveAudio().musicVolume,boss:!!activeSquareRun?.boss,musicContext:request?.musicContext,entryKey:request?.key,preserveTrackOnEntry:request?.preserveTrackOnEntry,crossfadeOnEntry:request?.crossfadeOnEntry,restartOnResume:!!request});
    if(media.status!=='unsupported'){squarePlayer?.stop();if(isSoundTrial()&&!restorationTrial.soundSuppressed&&media.playing)restorationTrial.audioExperienced=true;syncMusicInfo();return}
   }
   if(!activeSquareRun||!audioAllowed()||!contextReady||typeof MongyuSquareScore==='undefined')return;
   if(!squarePlayer)squarePlayer=MongyuSquareScore.createPlayer(audio,{musicDestination:musicBus,effectsDestination:sfxBus});
   const scheduledBefore=squarePlayer.inspect().scheduled;squarePlayer.update(squareScoreTime(),{family:activeSquareRun.familyIndex??(activeSquareRun.slot?.chapter||1)-1,energy:.75,boss:!!activeSquareRun.boss,phase:activeSquareRun.boss?.phase||0});
   if(isSoundTrial()&&!restorationTrial.soundSuppressed&&effectiveAudio().musicVolume>0&&squarePlayer.inspect().scheduled>scheduledBefore)restorationTrial.audioExperienced=true;syncMusicInfo();
  }catch(e){licensedPlayer?.stop();squarePlayer?.stop();audioBlocked=true}return;
 }
 licensedPlayer?.stop();squarePlayer?.stop();if(game.mode!=='arcade'||!audioAllowed()){dreamPlayer?.stop();return}if(typeof MongyuDreamScore==='undefined'||!readyAudio())return;try{if(!dreamPlayer)dreamPlayer=MongyuDreamScore.createPlayer(audio,{musicDestination:musicBus,effectsDestination:sfxBus});dreamPlayer.update(game.time)}catch(e){dreamPlayer?.stop();audioBlocked=true}
}
function journeyMusic(){
 if(!audioAllowed()||!(['origin-route','origin-finale'].includes(game.mode)||r34Active())||typeof MongyuJourneyAudio==='undefined')return;
 const beat=Math.floor(game.time*2),phase=game.mode+':'+(r34Active()?game.r34Status().chapter+':':'')+beat;
 if(phase===musicPhase)return;musicPhase=phase;
 const chapter=r34Active()?Math.min(4,Math.floor((game.r34Status().chapter-1)/2)):game.mode==='origin-finale'?4:game.originStatus()?.chapterIndex||0;
 musicNote(MongyuJourneyAudio.score(beat,chapter));if(musicAccent)musicNote(MongyuJourneyAudio.score(beat,chapter,true));musicAccent=false;
}
function sound(kind){const musical=kind==='hero-beat';if(!musical&&globalThis.MongyuSFX&&MongyuSFX.configs[kind]){if(audioSuspended||!audioAllowed()||effectiveAudio().sfxVolume===0||voices.size>=8)return;try{if(!readyAudio())return;const source=MongyuSFX.voice(audio,sfxBus,kind);if(source){voices.add(source);source.onended=()=>releaseVoice(source);source.start();return}}catch(_){return}}if(audioSuspended||!audioAllowed()||(musical?effectiveAudio().musicVolume:effectiveAudio().sfxVolume)===0)return;const frequency={chain:1160,land:210,'square-corner':480,'square-portal':1040,'square-room':740,'hero-beat':hero?.index===2?[130.81,196,164.81,196][Math.floor(game.time*2)%4]:hero?.index===1?[164.81,196,261.63,196][Math.floor(game.time*2)%4]:[130.81,164.81,196,164.81][Math.floor(game.time*2)%4],'r34-counter':920,'r36-echo-collected':1240,'arcade-perfect':760,jump:370,hit:115,pass:570,start:260,resume:260,clear:740,fail:90,'boss-strike':820,'throw':430,'dodge':300,'kick':650,'deflect':1040,'boss-wall-impact':145,'attack-telegraph':220,'boss-projectile':185,'boss-damage':840,'tutorial-progress':510,'tutorial-complete':690,'tutorial-retry':230}[kind];if(!frequency)return;if(voices.size>=8){const music=[...voices].find(o=>o._role==='accent'||o._role==='music');if(music)releaseVoice(music);else return;}try{if(!readyAudio())return;const t=audio.currentTime,o=audio.createOscillator(),v=audio.createGain(),impact=['hit','boss-wall-impact'].includes(kind),counter=['r34-counter','deflect','r36-echo-collected'].includes(kind),warning=kind==='attack-telegraph',duration=counter?.105:impact?.18:warning?.16:.14;o.type=impact?'triangle':counter||kind==='square-portal'?'triangle':['throw','square-corner'].includes(kind)?'square':'sine';o.frequency.setValueAtTime(frequency,t);if(counter){o.frequency.exponentialRampToValueAtTime(frequency*1.45,t+.025);o.frequency.exponentialRampToValueAtTime(frequency*.9,t+.095)}else o.frequency.exponentialRampToValueAtTime(frequency*(impact?.32:warning?1.35:kind==='jump'||kind==='kick'?1.6:.72),t+duration*.65);v.gain.setValueAtTime(.001,t);v.gain.linearRampToValueAtTime(kind==='hero-beat'?.012:warning?.022:counter?.032:impact?.055:.04,t+(counter?.003:warning?.035:.008));v.gain.exponentialRampToValueAtTime(.001,t+duration-.01);o.connect(v);v.connect(musical?musicBus:sfxBus);o._role=musical?'music':'fx';o._gain=v;voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();v.disconnect()};o.start(t);o.stop(t+duration)}catch(e){}}
function modal(name,trigger){if(currentEdition&&name&&!['settings','wardrobePanel','storyJournal','restorationCollection','restorationScene'].includes(name))return false;if(sceneCueOwner&&name!=='restorationScene')stopSound();if(name){if(activeSquareRun)activeSquareRun.pause();stopSound();}dialog=name;syncTrialFeedback();squareStatusAt=-1;squareStatusKey='';returnFocus=trigger||returnFocus||$('options');for(const id of ['settings','mission','riddle','memories','journey','r34Map','modes','shopPanel','wardrobePanel','storyJournal','restorationCollection','restorationScene']){const node=$(id);if(node)node.hidden=id!==name;}for(const id of ['top','stage','bar']){$(id).inert=!!name;$(id).setAttribute('aria-hidden',String(!!name))}canvas.tabIndex=name||collectionOpen?-1:0;}
function focusable(node){if(!node||node.disabled)return false;for(let p=node;p;p=p.parentNode)if(p.hidden||p.inert)return false;return true}
function closeDialog(event){grantAudio(event);if(dialog==='shopPanel'){stopSound();if(shopParent==='r34Map'){shopParent=null;modal('r34Map',$('shopMapOpen'));renderR34Map();sync();(focusable($('shopMapOpen'))?$('shopMapOpen'):$('r34MapClose')).focus({preventScroll:true});return true}}if(dialog==='journey'){modal('settings',$('options'));sync();$('journeyOpen').focus({preventScroll:true});return true}if(dialog==='memories'&&memoryParent==='settings'){memoryParent=null;modal('settings',$('options'));sync();$('memoriesOpen').focus({preventScroll:true});return true}memoryParent=null;const target=returnFocus;modal(null);sync();if(focusable(target))target.focus({preventScroll:true});else if(collectionOpen)$('collectionPlay').focus();else if(activeSquareRun?.state==='pause'||game.state==='pause')$('resumePlay').focus({preventScroll:true});else if(game.state==='title')$('titleContinue').focus({preventScroll:true});else canvas.focus({preventScroll:true});if(event?.isTrusted===true)dreamMusic();return true}
function updateCollection(){
 $('collection').hidden=!collectionOpen;$('chapterPrev').disabled=chapter===1;$('chapterNext').disabled=chapter===10;
 const ch=C.chapters[chapter-1],view=campaignView();$('compactTitle').textContent='제 '+chapter+'장 · '+ch.name+' · '+view.summary.completed+'/100';$('collection').setAttribute('aria-label','제 '+chapter+'장 '+ch.name+'. '+(chapter*10-9)+'번부터 '+chapter*10+'번 꿈. 방향키로 선택, Enter로 자세히 보기.');
 for(let slot=1;slot<=10;slot++){const level=C.getLevel((chapter-1)*10+slot),b=$('level-'+slot),row=Math.floor((slot-1)/2),col=(slot-1)%2;b.style.left=(col?184:20)/360*100+'%';b.style.top=(98+row*56)/480*100+'%';b.style.width=156/360*100+'%';b.style.height=50/480*100+'%';const cleared=view.clearedIds.has(level.id),unlocked=view.unlockedIds.has(level.id),state=cleared?(settings.campaign.records[level.id]?.contentVersion===5?'이전판 완료':'완료'):unlocked?'도전 가능':'잠김';$('levelText-'+slot).textContent=String(level.id).padStart(3,'0')+' '+level.name+' · '+state+(level.isBoss?' · 보스':'');b.setAttribute('aria-label',String(level.id).padStart(3,'0')+' '+level.name+(level.isBoss?' 보스':'')+'. '+state+'. '+level.objectives.map(o=>o.text).join(', '));b.setAttribute('aria-pressed',String(level.id===selectedId));b.dataset.level=String(level.id)}
 const solved=settings.campaign.riddles.includes(ch.riddleId);$('chapterRiddle').textContent=solved?'수수께끼 해결 ✓':'장의 수수께끼';
}
function sync(){
 syncVolumeControls();
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
 if($('dreamIntensity')){$('dreamIntensity').textContent='꿈의 강도 · '+({calm:'고요',balanced:'균형',intense:'강렬'}[settings.dreamIntensity]);$('dreamIntensity').setAttribute('aria-label','꿈의 강도 '+({calm:'고요',balanced:'균형',intense:'강렬'}[settings.dreamIntensity])+'; 눌러 변경');}
 syncRunSettings();$('mute').textContent=isSoundTrial()?(restorationTrial.soundSuppressed?'체험 소리 켜기':'체험 소리 끄기'):settings.mute?'소리 꺼짐':'소리 켜짐';if($('trialAudioNotice')){$('trialAudioNotice').hidden=!isSoundTrial();$('trialAudioNotice').textContent='이번 체험은 음악 40%, 효과음 45%로 재생합니다. 체험을 끝내면 기존 소리 설정으로 돌아갑니다.'}$('motion').textContent=settings.reduced?'움직임 줄임':'움직임 기본';$('mute').setAttribute('aria-pressed',String(isSoundTrial()?restorationTrial.soundSuppressed:settings.mute));$('motion').setAttribute('aria-pressed',String(settings.reduced));
 $('tutorialState').textContent=settings.tutorialStatus==='complete'?'첫 연습 완료':settings.tutorialStatus==='skipped'?'연습을 건너뛰었습니다':settings.tutorialStatus==='learning'?'연습 지점이 저장됩니다':'100개의 꿈에서는 안전 연습부터 시작합니다';
 const status=campaignView().summary;$('topLabel').textContent=originLearning?'사각의 꿈 · 첫 점프':originActive()&&s!=='title'?'사각의 꿈 · '+(game.mode==='origin-finale'?'마지막 방':game.originStatus?.()?.chapterName||'달리는 중'):hero?.active?'짧은 꿈 · '+(hero.index+1)+'/3 · 기록 없음':'몽유 · 사각의 꿈'+(s==='title'?'':' · '+status.completed+'/100');storageMessage();syncArcade();syncR34();syncImmersive(true);retireLegacySurfaces();
}
function nextUnlocked(){const current=game.levelId||selectedId;for(let id=current+1;id<=100;id++)if(P.unlocked(settings.campaign,id)&&!settings.campaign.completed.includes(id))return id;return null}
function events(){if(activeSquareRun){squareEvents();return}let changed=false,transition=null;for(const e of game.drain()){if(r34Active()&&['r34-counter','deflect','boss-strike','r36-echo-collected'].includes(e))r36Impulse={owner:game.r34Run,at:game.time,kind:e};if(['clear','fail','arcade-checkpoint'].includes(e))transition=e==='arcade-checkpoint'?'checkpoint':e;if(r34Active()&&(e.startsWith('r34-')||['clear','fail'].includes(e))){writeR34();changed=true;if(['clear','fail'].includes(e)){game.best=settings.best;stopSound();announce(game.r34Status().reason||e);continue}}if(originLearning&&e.startsWith('tutorial-')){if(e==='tutorial-complete'||e==='tutorial-skip'){originProgress.introDone=true;writeOrigin();leaveOriginIntro();const startChapter=memoryIntroChapter;memoryIntroChapter=undefined;startOrigin(undefined,startChapter);return}if(e==='tutorial-start'||e==='tutorial-progress'){announce({approach:'처음 한 번, 안전하게 점프를 익혀 보세요.',jump:'장애물 앞입니다. 화면을 눌러 점프하세요.',corner:'점프 성공. 착지 후에도 자동으로 달립니다.',confirm:'연습 성공. 사각의 꿈으로 들어가세요.'}[game.tutorialStep]);changed=true}if(e==='tutorial-retry'){announce('괜찮습니다. 같은 지점에서 다시 연습합니다.');changed=true}continue}if(e==='origin-start'){if(memorySession?.startPending&&memorySession.startChapter===game.originStartChapter)memorySession.startPending=false;else invalidateMemory('untracked-start')}if(e==='origin-route-complete'){narrative.routeComplete=true;narrative.fullRoute=game.originTravelResult?.startChapter===0;if(memorySession?.eligible&&memorySession.phase==='route'&&game.mode==='origin-finale'&&game.originTravelResult?.startChapter===0){memorySession.route=game.originTravelResult;memorySession.phase='crossing'}else invalidateMemory('incomplete-route')}if(e==='origin-finale'){if(memorySession?.eligible&&memorySession.phase==='crossing'&&memorySession.route===game.originTravelResult)memorySession.phase='finale';else invalidateMemory('finale-checkpoint');originProgress.finaleUnlocked=true;originProgress.checkpoint=3;writeOrigin();announce('마지막 방. 이제 누르면 사각 탄환을 던집니다.');changed=true}if(e==='origin-chapter'){const route=game.originStatus()||{chapterIndex:3,chapterName:'마지막 방'};if(route.chapterIndex>originProgress.checkpoint){originProgress.checkpoint=route.chapterIndex;writeOrigin();announce(route.chapterName+'. 이제 이 구간에서 이어갈 수 있습니다.')}changed=true}if(['pause','clear','fail','arcade-checkpoint'].includes(e))stopSound();else if(e==='arcade-perfect'&&typeof MongyuDreamScore!=='undefined'){if(dreamPlayer&&!audioSuspended&&audioAllowed()&&settings.sfxVolume>0)dreamPlayer.perfect(game.time)}else sound(e);if(['pass','boss-damage'].includes(e)&&(['origin-route','origin-finale'].includes(game.mode)||r34Active())&&game.state==='play')musicAccent=true;
 if(e==='fail'||e==='clear'){
  if(game.mode==='arcade'){saveArcadeRecord(game.result);game.best=settings.best;stopSound();changed=true;continue}
  if(originActive()){const newMemories=e==='clear'?collectMemoryResult(game.result):0;if(e==='fail')invalidateMemory('failed');if(e==='clear'&&game.mode==='origin-finale'&&game.result?.objectivesMet&&game.result?.bossDefeated){originProgress.completed=true;originProgress.finaleUnlocked=true;originProgress.checkpoint=3;writeOrigin()}game.best=settings.best;stopSound();announce(e==='clear'?finaleEpilogue().join(' ')+(newMemories?' 새 기억 '+newMemories+'개를 찾았습니다.':''):game.mode==='origin-finale'?'다시 맞서 보세요. 마지막 방에서 다시 시작할 수 있습니다.':'다시 달려 보세요.'+(originProgress.checkpoint>originStart?' 도착한 다음 구간에서 이어갈 수도 있습니다.':''));changed=true;continue}
  if(hero?.active){game.best=settings.best;stopSound();if(e==='clear'&&hero.index<HERO_LEVELS.length-1){hero.index++;startHeroSegment();sync();return}hero.completed=e==='clear';announce((hero.completed?'짧은 꿈 체험 완료.':'체험을 다시 시작할 수 있습니다.')+' 수집·최고 점수·연습 기록은 바뀌지 않습니다.');changed=true;continue}
  settings.best=Math.max(settings.best,game.best);const result=game.result;if(e==='clear'&&result&&typeof result==='object'&&!savedResults.has(result)){settings.campaign=P.complete(settings.campaign,game.levelId,result);savedResults.add(result)}write();
  const level=game.level,go=nextUnlocked();announce((e==='clear'?'꿈 완료':'다시 도전')+'. '+game.score+'점.'+(e==='clear'&&game.mode==='campaign'?(level?.isBoss?' 이 장의 수수께끼가 열렸습니다.':go?' 다음 꿈이 열렸습니다.':' 미션 기록을 확인하세요.'):'')+(game.mode==='freeplay'?' 연습은 해금 기록에 반영되지 않습니다.':''));changed=true;
 }
 if(e==='tutorial-start'||e==='tutorial-progress'){settings.tutorialStatus='learning';settings.tutorialStep=game.tutorialStep;game.savedStep=game.tutorialStep;write();announce({approach:'장애물 앞에서 안전하게 멈춥니다',jump:'화면을 눌러 점프하세요',corner:'점프 성공. 착지 후에도 자동으로 달립니다',confirm:'연습 성공. 다음 꿈에서는 인물의 말풍선으로 새로운 조작을 배웁니다'}[game.tutorialStep]);changed=true}
 if(e==='tutorial-retry'){announce('괜찮습니다. 같은 지점에서 다시 연습합니다');changed=true}
 if(e==='tutorial-complete'||e==='tutorial-skip'){settings.tutorialStatus=e==='tutorial-complete'?'complete':'skipped';settings.tutorialStep='approach';write();changed=true}
 if(e.startsWith('world-transform-')&&game.state==='play'&&!dialog&&!collectionOpen){const phase=game.worldTransform?.();if(phase?.text)announce(phase.text)}
 if(e==='dodge'&&game.arena)announce((game.arena.lane+1)+'번 차선으로 이동합니다');if(e==='attack-telegraph'&&game.gameMode==='dodge-arena')announce((game.arena.lockedLane+1)+'번 차선에 돌진 예고. 차선을 바꿔 피하세요.');if(e==='level-start')announce(controls().name+'. '+controls().cue);if(e.startsWith('arcade-'))changed=true;if(['start','pause','resume','boss-strike','lane-change','boss-damage'].includes(e))changed=true;
 }if(transition)transitionSound(transition);if(hero?.active&&game.state==='play'&&!dialog&&!collectionOpen){const beat=Math.floor(game.time*2);if(beat!==hero.lastBeat){hero.lastBeat=beat;sound('hero-beat')}}journeyMusic();dreamMusic();if(changed)sync()}
function timestamp(value){const n=Number(value);return value!=null&&Number.isFinite(n)&&n>=0?n:(typeof performance!=='undefined'?performance.now():(last??0))}
const originHeldKeys=new Set(),originHeldPointers=new Set();
// Keep consumed pointer identities through interruptions: a late release is not a new action.
const actPointers=new Map();let actLegacyClick=null;
function releaseActPointers(){for(const gesture of actPointers.values())gesture.down=false}
function resetOriginHeld(){originHeldKeys.clear();originHeldPointers.clear();releaseActPointers()}
function resetClock(now){resetOriginHeld();last=timestamp(now);acc=0}
function advanceClock(now){if(activeSquareRun){now=timestamp(now);if(last===null){last=now;return}if(activeSquareRun.nativeRuntime&&now-last>250){resetOriginHeld();acc=0;}const elapsed=Math.min(.1,Math.max(0,(now-last)/1000));last=Math.max(last,now);if(document.hidden||dialog)return;viewTime+=elapsed;acc+=elapsed;while(acc+1e-12>=1/120){if(globalThis.MongyuPresentation)MongyuPresentation.advance(activeSquareRun,1/120);else activeSquareRun.tick(1/120);acc=Math.max(0,acc-1/120)}return}const priorResult=syncResultClock();now=timestamp(now);if(last===null){last=now;return}const elapsed=Math.min(.1,Math.max(0,(now-last)/1000));last=Math.max(last,now);viewTime+=elapsed;if(priorResult&&!document.hidden&&!dialog&&!collectionOpen)resultElapsed=Math.min(.65,resultElapsed+elapsed);if(dialog||collectionOpen||r34Active()&&r34Briefing||window.QUAD_RIFT_APP?.squareReply?.active||bridgeActive()||dayNightActive())return;acc+=elapsed;while(acc+1e-12>=1/120){game.update(1/120);acc=Math.max(0,acc-1/120)}syncResultClock()}
function openCollection(event){if(currentEdition)return false;leaveSquare();leaveBridge();clearNarrative();invalidateMemory('other-mode');leaveOriginIntro();if(hero?.active)leaveHero();if(dialog)modal(null);if(game.state==='play')game.pause();events();stopSound();collectionOpen=true;chapter=C.getLevel(selectedId).chapter;resetClock(event?.timeStamp);sync();draw();$('level-'+C.getLevel(selectedId).slot).focus();announce('제 '+chapter+'장 '+C.chapters[chapter-1].name+'. 꿈을 선택하세요');return true}
function selectLevel(id,{details=true,focus=false}={}){const level=C.getLevel(Number(id));if(!level)return false;selectedId=level.id;chapter=level.chapter;settings.campaign={...settings.campaign,selected:selectedId};write();sync();draw();if(focus)$('level-'+level.slot).focus();if(details)openMission();return true}
function openMission(showResult=false){if(currentEdition)return false;showResult=showResult===true;missionIsResult=showResult;const level=C.getLevel(selectedId),unlocked=P.unlocked(settings.campaign,selectedId);$('missionTitle').textContent=String(level.id).padStart(3,'0')+' · '+level.name;$('missionChapter').textContent='제 '+level.chapter+'장 · '+C.chapters[level.chapter-1].name+(level.isBoss?' · 보스':'');$('missionDescription').textContent=showResult&&game.state==='clear'&&level.clearClue?level.clearClue:level.description;$('missionObjectives').textContent='';for(const objective of level.objectives){const li=document.createElement('li');const row=showResult?game.objectiveProgress().find(o=>o.type===objective.type):null;li.textContent=objective.text+(row?' · '+(row.met?'달성':'미달')+' ('+row.value+' / '+row.target+')':'');$('missionObjectives').appendChild(li)}if(showResult&&game.boss){const li=document.createElement('li');li.textContent='보스 체력 · '+(game.boss.hp===0?'격파':'남은 체력 '+game.boss.hp)+' / '+game.boss.maxHp;$('missionObjectives').appendChild(li)}$('missionCue').textContent=showResult?(game.result?.reason||'기록 '+game.score+'점 · 충돌 '+(game.result?.hits||0)+'회'):'공략 · '+level.cue;$('missionLock').textContent=unlocked?(settings.campaign.completed.includes(level.id)?settings.campaign.records[level.id]?.contentVersion===5?'이전판 완료 기록과 해금을 보존했습니다. 현재 방식으로는 아직 완료하지 않았습니다. 다시 도전해 새 기록을 남기세요.':'현재 방식으로 완료한 꿈입니다. 다시 도전해 기록을 높일 수 있습니다.':'미션을 모두 달성하면 다음 꿈이 열립니다.'):P.lockReason(settings.campaign,selectedId);$('missionStart').textContent=showResult?'다시 도전':'꿈에 들어가기';$('missionClose').textContent=showResult?'결과로 돌아가기':'꿈 지도로 돌아가기';$('missionStart').disabled=!unlocked;$('missionPractice').disabled=!unlocked;$('missionRiddle').hidden=level.slot<10&&!settings.campaign.completed.includes(level.chapter*10);modal('mission',showResult?$('resultDetails'):$('level-'+level.slot));sync();(unlocked?$('missionStart'):$('missionClose')).focus();}
function startSelected(event,practice=false){if(currentEdition)return false;leaveSquare();leaveBridge();clearNarrative();invalidateMemory('other-mode');leaveOriginIntro();if(hero?.active)leaveHero();grantAudio(event);if(!P.unlocked(settings.campaign,selectedId)){announce(P.lockReason(settings.campaign,selectedId));return false}stopSound();modal(null);collectionOpen=false;game.selectLevel(selectedId);if(practice)game.startFreeplay(selectedId);else if(!['skipped','complete'].includes(settings.tutorialStatus))game.beginTutorial(settings.tutorialStep);else game.startLevel(selectedId);resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});return true}
function nextLevel(event){if(r34Active())return advanceR34(event);if(originActive())return game.state==='clear'?startOrigin(event,0):originProgress.finaleUnlocked?startFinale(event):startOrigin(event,originProgress.checkpoint);const id=nextUnlocked();if(!id)return openCollection(event);selectLevel(id,{details:false});return startSelected(event)}
function action(event){if(activeSquareRun){if(dialog||document.hidden||event?.repeat)return false;grantAudio(event);if(['pause','clear','fail'].includes(activeSquareRun.state))return false;advanceClock(event?.timeStamp);const accepted=activeSquareRun.mode==='restoration'&&['pointerdown','keydown'].includes(event?.type)?activeSquareRun.inputDown():activeSquareRun.action();squareStatusAt=-1;events();syncSquare();canvas.focus({preventScroll:true});return accepted;}if(dayNightActive()||bridgeActive()||bridgeHeldKeys.size>0||timestamp(event?.timeStamp)<=bridgeBlockUntil||window.QUAD_RIFT_APP?.squareReply?.active)return false;grantAudio(event);if(dialog||collectionOpen)return false;if(r34Active()&&game.state!=='title'){if(r34Briefing||game.state==='riddle')return false;if(game.state==='clear'&&game.r34Status().canAdvance)return advanceR34(event);if(['clear','fail'].includes(game.state))return retryR34(event)}if(game.state==='title')return restorationUI?restorationUI.continueJourney(event):squareRun?startSquare(event):r34Ready?startR34(event):startOrigin(event);if(game.mode==='arcade'){if(['clear','fail'].includes(game.state))return startArcade(event);if(game.state==='arcade-choice')return false;}if(['clear','fail'].includes(game.state)){if(originActive())return game.mode==='origin-finale'?startFinale(event):startOrigin(event,originStart);if(hero?.active)return startHero(event);const practice=game.mode==='freeplay';selectedId=game.levelId||selectedId;return startSelected(event,practice)}const now=timestamp(event?.timeStamp),before=game.state,beforeMode=game.mode,beforeLevelId=game.levelId,beforeHeroIndex=hero?.index;if(before==='play'){advanceClock(now);events();if(game.state!=='play'||game.mode!==beforeMode||game.levelId!==beforeLevelId||hero?.active&&hero.index!==beforeHeroIndex)return false}else resetClock(now);if(game.mode==='origin-route'&&game.state==='play'&&(event?.repeat||game.jump>0&&last!==null&&now<last-80))return false;const acted=game.action();events();canvas.focus({preventScroll:true});return acted}
function pauseToggle(event){if(activeSquareRun){if(dialog)return false;grantAudio(event);advanceClock(event?.timeStamp);if(activeSquareRun.state==='pause')activeSquareRun.resume();else activeSquareRun.pause();resetClock(event?.timeStamp);events();sync();draw();if(activeSquareRun.state==='play')canvas.focus({preventScroll:true});return true;}if(r34Active()&&r34Briefing)return false;if(dayNightActive()||bridgeActive()||replyActive()||replyReturnPending&&(bridgeHeldKeys.size>0||event?.repeat)||timestamp(event?.timeStamp)<=bridgeBlockUntil)return false;grantAudio(event);if(dialog||collectionOpen)return false;advanceClock(event?.timeStamp);if(game.state==='play')game.pause();else game.resume();resetClock(event?.timeStamp);events();sync();return true}
function home(event){grantAudio(event);leaveSquare();r34Briefing=false;leaveBridge();clearNarrative();resetOriginHeld();invalidateMemory('home');leaveOriginIntro();if(hero?.active)leaveHero();stopSound();modal(null);collectionOpen=false;game.title();last=null;acc=0;sync();draw();if(event?.isTrusted===true)dreamMusic();$('titleContinue').focus({preventScroll:true});return true}
function startHeroSegment(){
 game.startFreeplay(HERO_LEVELS[hero.index]);game.best=settings.best;hero.lastBeat=-1;game.heroShowcase={active:true,index:hero.index,total:HERO_LEVELS.length};acc=0;
}
function startHero(event){if(currentEdition)return false;leaveSquare();leaveBridge();clearNarrative();
 invalidateMemory('other-mode');leaveOriginIntro(); grantAudio(event);stopSound();modal(null);collectionOpen=false;hero={active:true,index:0,completed:false,lastBeat:-1};startHeroSegment();resetClock(event?.timeStamp);events();sync();draw();canvas.focus({preventScroll:true});announce('짧은 꿈 체험. 기록은 남지 않습니다. 먼저 벽과 틈 앞에서 점프하세요.');return true;
}
function leaveHero(){
 if(!hero?.active)return;stopSound();hero=null;game.heroShowcase=null;game.best=settings.best;game.selectLevel(selectedId);game.mode='campaign';game.title();last=null;acc=0;
}
function suspend(){audioSuspended=true;if(activeSquareRun){restorationUI?.suspendAftermath();activeSquareRun.pause();resetOriginHeld();last=null;acc=0;stopSound();events();sync();draw();return true;}bridgeHeldKeys.clear();window.QUAD_RIFT_APP?.dayNight?.suspend();window.QUAD_RIFT_APP?.companionBridge?.suspend();window.QUAD_RIFT_APP?.squareReply?.suspend();resetOriginHeld();const tilt=window.QUAD_RIFT_APP?.tilt;if(tilt?.active)tilt.suspend();if(game.pause()){events();sync();announce('자동으로 일시정지했습니다')}last=null;acc=0;stopSound();draw();return true}
function back(){if(activeSquareRun){if(restorationUI?.aftermathFor(activeSquareRun))return restorationUI.finishAftermath();if(dialog)return closeDialog();if(['play','transition'].includes(activeSquareRun.state))return suspend();return home();}if(dayNightActive()){window.QUAD_RIFT_APP.dayNight.suspend();return true}if(bridgeActive()){window.QUAD_RIFT_APP.companionBridge.suspend();return true}if(window.QUAD_RIFT_APP?.squareReply?.active)return window.QUAD_RIFT_APP.squareReply.close();const tilt=window.QUAD_RIFT_APP?.tilt;if(tilt?.active)return tilt.close();if(dialog)return closeDialog();if(collectionOpen)return home();if(game.state==='play'){suspend();return true}if(game.state!=='title')return home();return false}
function openRiddle(){const ch=C.chapters[chapter-1];activeRiddle=C.riddles.find(r=>r.id===ch.riddleId);if(!activeRiddle)return false;$('riddleChapter').textContent='제 '+chapter+'장 · '+ch.name;$('riddlePrompt').textContent=(settings.campaign.completed.includes(ch.bossId)&&activeRiddle.earnedClue?activeRiddle.earnedClue+'\n\n':'')+activeRiddle.prompt;$('riddleAnswer').value='';$('riddleFeedback').textContent='';renderRiddle();$('riddleClose').textContent=collectionOpen?'꿈 지도로 돌아가기':'결과로 돌아가기';modal('riddle',collectionOpen?$('chapterRiddle'):$('resultDetails'));sync();$('riddleClose').focus();if(settings.campaign.completed.includes(ch.bossId)&&!settings.campaign.riddles.includes(activeRiddle.id))$('riddleAnswer').focus();return true}
function renderRiddle(){if(!activeRiddle)return;const ch=C.chapters[activeRiddle.chapter-1],solved=settings.campaign.riddles.includes(activeRiddle.id),available=settings.campaign.completed.includes(ch.bossId),count=settings.campaign.hints[activeRiddle.id]||0;$('riddleReward').textContent=solved?'해결했습니다. '+(chapter===10?'100개의 꿈과 마지막 문장이 완성되었습니다.':'다음 장이 열렸습니다.'):!available?'이 장의 보스를 완료하면 답을 입력할 수 있습니다.':(chapter===10?'보상 · 마지막 꿈의 완성':'보상 · 다음 장의 첫 꿈 해금');$('riddleAnswer').disabled=!available||solved;$('riddleSubmit').disabled=!available||solved;$('riddleHint').disabled=!available||solved||count>=activeRiddle.hints.length;$('riddleHint').textContent='힌트 '+Math.min(count+1,activeRiddle.hints.length)+' / '+activeRiddle.hints.length;$('riddleHints').textContent=activeRiddle.hints.slice(0,count).map((h,i)=>(i+1)+'. '+h).join('\n');}
function submitRiddle(){if(!activeRiddle)return false;const r=P.solve(settings.campaign,activeRiddle.id,$('riddleAnswer').value);settings.campaign=r.save;write();renderRiddle();sync();draw();$('riddleFeedback').textContent=r.correct?(activeRiddle.chapter===10?'정답! 모든 꿈을 완성했습니다.':'정답! 다음 장의 첫 꿈이 열렸습니다.'):(r.reason||'아직 맞지 않습니다. 힌트를 살펴보세요.');if(r.correct){sound('clear');$('riddleClose').focus()}return r.correct}
function changeChapter(delta){chapter=Math.max(1,Math.min(10,chapter+delta));selectedId=(chapter-1)*10+1;settings.campaign={...settings.campaign,selected:selectedId};write();sync();draw();announce('제 '+chapter+'장 '+C.chapters[chapter-1].name);}
// The landing slot is tap-only: held/duplicate events cannot refresh it.
canvas.addEventListener('pointerdown',e=>{if(e.isPrimary===false||e.button>0)return;e.preventDefault();if(activeSquareRun||game.mode==='origin-route'){const id=e.pointerId??'primary';if(originHeldPointers.has(id))return;originHeldPointers.add(id)}action(e)});
canvas.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();if(e.repeat)return;if(activeSquareRun||game.mode==='origin-route'){if(originHeldKeys.has(e.code))return;originHeldKeys.add(e.code)}action(e)}});
window.addEventListener('keyup',e=>{if(originHeldKeys.has(e.code)&&activeSquareRun?.mode==='restoration'&&!dialog){advanceClock(e.timeStamp);activeSquareRun.inputUp();squareStatusAt=-1;events();syncSquare()}originHeldKeys.delete(e.code);bridgeHeldKeys.delete(e.code)});
window.addEventListener('pointerup',e=>{if(originHeldPointers.has(e.pointerId??'primary')&&activeSquareRun?.mode==='restoration'&&!dialog){advanceClock(e.timeStamp);activeSquareRun.inputUp();squareStatusAt=-1;events();syncSquare()}originHeldPointers.delete(e.pointerId??'primary');const gesture=actPointers.get(e.pointerId??'primary');if(gesture)gesture.down=false});
function cancelOriginInput(){activeSquareRun?.cancelInput?.();originHeldPointers.clear();releaseActPointers();game.cancelOriginJump()}
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
$('act').addEventListener('keydown',e=>{if(e.repeat&&['Space','Enter'].includes(e.code))e.preventDefault()});
$('act').onclick=e=>{
 // Keyboard, AT, and .click() have no physical pointer identity; keep native activation.
 const physical=e?.pointerId!=null&&e.pointerId>=0;
 if(physical){const id=e.pointerId,gesture=actPointers.get(id);if(gesture){actPointers.delete(id);if(actLegacyClick===gesture)actLegacyClick=null;return false}}
 else if(e?.detail>0&&actLegacyClick){const gesture=actLegacyClick;actLegacyClick=null;for(const [id,item] of actPointers)if(item===gesture)actPointers.delete(id);return false}
 if(e?.button>0||physical&&e?.isPrimary===false)return false;
 return action(e);
};$('arcadeStart').onclick=e=>startArcade(e);$('arcadeRisk').onclick=()=>{arcadeRisk=arcadeRisk==='standard'?'brave':'standard';syncArcade()};$('arcadeBank').onclick=e=>chooseArcade('bank',e);$('arcadePush').onclick=e=>chooseArcade('push',e);$('arcadeRetry').onclick=e=>startArcade(e);$('arcadeNew').onclick=newArcade;$('primary').onclick=action;$('next').onclick=nextLevel;$('pause').onclick=pauseToggle;$('home').onclick=home;$('map').onclick=openCollection;$('skip').onclick=e=>{advanceClock(e?.timeStamp);game.skipTutorial();resetClock(e?.timeStamp);events();sync()};
$('options').onclick=e=>{advanceClock(e?.timeStamp);game.pause();events();stopSound();modal('settings',$('options'));sync();const run=activeRestorationSettings();if(run){$('settings').scrollTop=0;const box=$('settings').querySelector('.box');if(box)box.scrollTop=0;const target=$(run.slot?.rule?.setting==='vibration'?'restorationRunVibration':run.slot?.rule?.setting==='sound'?'mute':'restorationRunSpeed');(focusable(target)?target:$('close')).focus({preventScroll:true})}else $('close').focus()};$('close').onclick=closeDialog;
if($('dreamIntensity'))$('dreamIntensity').onclick=()=>{const values=['calm','balanced','intense'];settingsTouched.add('dreamIntensity');settings.dreamIntensity=values[(values.indexOf(settings.dreamIntensity)+1)%3];write();sync();draw()};
for(const key of ['musicVolume','sfxVolume'])if($(key)){
 const change=()=>{const raw=Number($(key).value);if(!Number.isFinite(raw))return;settingsTouched.add(key);settings[key]=volume(raw/100);syncVolumeControls();if(settings.musicVolume===0&&settings.sfxVolume===0)stopSound()};
 $(key).addEventListener('input',change);$(key).addEventListener('change',()=>{change();write();sync()});
}
$('mute').onclick=e=>{grantAudio(e);if(isSoundTrial()){changeRunSetting('sound',!activeSquareRun.settings.sound,e);return}settingsTouched.add('mute');settings.mute=!settings.mute;if(settings.mute)stopSound();write();sync()};$('motion').onclick=()=>{settingsTouched.add('reduced');settings.reduced=!settings.reduced;write();sync();draw()};$('replay').onclick=e=>{leaveSquare();stopSound();invalidateMemory('other-mode');leaveOriginIntro();if(hero?.active)leaveHero();modal(null);collectionOpen=false;if(!P.unlocked(settings.campaign,selectedId)){selectedId=P.status(settings.campaign).nextLevel||1;chapter=C.getLevel(selectedId).chapter;settings.campaign={...settings.campaign,selected:selectedId}}game.selectLevel(selectedId);game.beginTutorial('approach');resetClock(e?.timeStamp);events();sync();canvas.focus({preventScroll:true})};
$('chapterPrev').onclick=()=>changeChapter(-1);$('chapterNext').onclick=()=>changeChapter(1);$('collectionPlay').onclick=openMission;$('chapterRiddle').onclick=openRiddle;
for(let slot=1;slot<=10;slot++)$('level-'+slot).onclick=()=>selectLevel((chapter-1)*10+slot);
$('missionStart').onclick=e=>startSelected(e,missionIsResult&&game.mode==='freeplay');$('missionPractice').onclick=e=>startSelected(e,true);$('missionClose').onclick=closeDialog;$('missionRiddle').onclick=openRiddle;
$('riddleSubmit').onclick=submitRiddle;$('riddleClose').onclick=closeDialog;$('riddleHint').onclick=()=>{if(activeRiddle){settings.campaign=P.hint(settings.campaign,activeRiddle.id);write();renderRiddle();announce($('riddleHints').textContent)}};
$('riddleAnswer').addEventListener('keydown',e=>{if(e.code==='Enter'&&!e.repeat&&!e.isComposing){e.preventDefault();submitRiddle()}});
if($('memoriesOpen'))$('memoriesOpen').onclick=()=>openMemories($('memoriesOpen'));if($('memoriesStart'))$('memoriesStart').onclick=startMemoryChallenge;if($('memoriesClose'))$('memoriesClose').onclick=closeDialog;
if($('journeyOpen'))$('journeyOpen').onclick=openJourney;if($('journeyStart'))$('journeyStart').onclick=startJourney;if($('journeyClose'))$('journeyClose').onclick=closeDialog;for(let i=0;i<5;i++)if($('journey-'+i))$('journey-'+i).onclick=()=>selectJourney(i);
function wearR34(id){if(typeof game.selectR34Skin!=='function')return false;const selected=game.r34JourneyStatus().selectedSkin;const changed=game.selectR34Skin(selected===id?null:id);if(changed){writeR34();renderR34Map();sync();draw()}return changed}
if($('r34Wear'))$('r34Wear').onclick=()=>wearR34(r34ChapterData().collectible.id);if($('r34RewardWear'))$('r34RewardWear').onclick=()=>wearR34(game.r34Status().collectible?.id);
if($('r34Open'))$('r34Open').onclick=openR34;for(let i=1;i<=10;i++)if($('r34Chapter-'+i))$('r34Chapter-'+i).onclick=()=>{r34Selected=i;renderR34Map()};if($('r34MapStart'))$('r34MapStart').onclick=e=>startR34(e);if($('r34MapClose'))$('r34MapClose').onclick=closeDialog;if($('r34Begin'))$('r34Begin').onclick=beginR34;if($('r34Retry'))$('r34Retry').onclick=retryR34;if($('r34Advance'))$('r34Advance').onclick=advanceR34;if($('r34PanelMap'))$('r34PanelMap').onclick=openR34;if($('r34Submit'))$('r34Submit').onclick=answerR34;if($('r34Hint'))$('r34Hint').onclick=hintR34;if($('r34Answer'))$('r34Answer').addEventListener('keydown',e=>{if(e.code==='Enter'&&!e.repeat&&!e.isComposing){e.preventDefault();answerR34()}});
const dialogControls={wardrobePanel:['wardrobeClose',...('moon ink dew peach lilac tide ember moss dusk frost eclipse dawn'.split(' ').map(id=>'look-'+id))],shopPanel:['shopClose','shop-aurora-thread','shop-midnight-score','shop-glass-garden','shopListen','shopWishlist'],modes:['modeRestoration','modeSquare','modeR34','modeR34Difficulty','modeR34Map','modeArcade','modeRisk','modeOrigin','modeCollection','modeReply','modeTilt','modesClose'],r34Map:[...Array.from({length:10},(_,i)=>'r34Chapter-'+(i+1)),'r34Wear','r34MapStart','r36ReplayRoute','shopMapOpen','shopOfferDismiss','r34MapClose'],journey:['journey-0','journey-1','journey-2','journey-3','journey-4','journeyStart','journeyClose'],settings:['restorationRunSpeed','restorationRunVibration','mute','musicVolume','sfxVolume','motion','dreamIntensity','journeyOpen','memoriesOpen','replay','tiltOpen','settingsModes','settingsSkip','settingsHome','musicCreditsToggle','musicSource0','musicLicense0','musicSource1','musicLicense1','musicSource2','musicLicense2','close'],memories:['memoriesStart','memoriesClose'],mission:['missionStart','missionPractice','missionRiddle','missionClose'],riddle:['riddleAnswer','riddleSubmit','riddleHint','riddleClose']};
document.addEventListener('keydown',e=>{
 if((bridgeActive()||replyActive()||dayNightActive())&&['Space','Enter'].includes(e.code))bridgeHeldKeys.add(e.code);
 if(dayNightActive()||bridgeActive()||window.QUAD_RIFT_APP?.tilt?.active||window.QUAD_RIFT_APP?.squareReply?.active)return;
 if(restorationUI?.aftermathFor(activeSquareRun)){if(['Tab','Escape','Enter','Space'].includes(e.code)){e.preventDefault();if(e.code==='Tab')$('restorationAftermathNext').focus({preventScroll:true});else if(!e.repeat)restorationUI.finishAftermath()}return}
 if(dialog){if(e.code==='Escape'){e.preventDefault();if(!e.repeat)closeDialog();return}if(e.code==='Tab'){const controls=(dialogControls[dialog]||restorationUI?.dialogControls[dialog]||[]).map($).filter(focusable),i=controls.indexOf(document.activeElement);e.preventDefault();controls[(i+(e.shiftKey?-1:1)+controls.length)%controls.length].focus()}return}
 if((activeSquareRun?.state==='pause'||game.state==='pause')&&!dialog&&!collectionOpen&&e.code==='Tab'){const nodes=['resumePlay','retryPlay','pauseRestoration','pauseStory','pauseModes','pauseOptions','pauseHome'].map($).filter(x=>x&&!x.hidden&&!x.disabled),i=nodes.indexOf(document.activeElement);e.preventDefault();nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();return}
 if(activeSquareRun&&['clear','fail'].includes(activeSquareRun.state)&&e.code==='Tab'){const nodes=['squareNext','squareRetry','squarePractice','squareCollection','squareRestart','squareHome'].map($).filter(x=>x&&!x.hidden),i=nodes.indexOf(document.activeElement);e.preventDefault();nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();return}
 if(r34Active()&&!dialog&&!collectionOpen&&!$('r34Panel').hidden&&e.code==='Tab'){const ids=r34Briefing?['r34Begin','r34PanelMap','home','options']:game.state==='fail'?['r34Retry','r34PanelMap','home','options']:['r34Answer','r34Submit','r34Hint','r34RewardWear','r34Advance','r34PanelMap','home','options'],nodes=ids.map($).filter(x=>x&&!x.hidden&&!x.disabled&&(x.id!=='r34Answer'&&x.id!=='r34Submit'&&x.id!=='r34Hint'||!$('r34RiddleForm').hidden)),i=nodes.indexOf(document.activeElement);e.preventDefault();nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();return}
 if(game.mode==='arcade'&&!collectionOpen&&['arcade-choice','clear','fail'].includes(game.state)&&e.code==='Tab'){const ids=game.state==='arcade-choice'?['arcadeBank','arcadePush','home','options']:['arcadeRetry','arcadeNew','home','options'],nodes=ids.map($).filter(x=>x&&!x.hidden&&!x.disabled),i=nodes.indexOf(document.activeElement);e.preventDefault();nodes[(i+(e.shiftKey?-1:1)+nodes.length)%nodes.length].focus();return}
 if(collectionOpen&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){const active=document.activeElement;if(!active?.id?.startsWith('level-'))return;e.preventDefault();const delta={ArrowLeft:-1,ArrowRight:1,ArrowUp:-2,ArrowDown:2}[e.code],next=Math.max((chapter-1)*10+1,Math.min(chapter*10,selectedId+delta));selectLevel(next,{details:false,focus:true});return}
 if(e.code==='Escape'){e.preventDefault();if(e.repeat)return;if(collectionOpen)home();else pauseToggle(e)}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend()});window.addEventListener('blur',suspend);window.addEventListener('pagehide',suspend);window.addEventListener('resize',()=>{fit();draw()});if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{fit();draw()}).observe($('stage'));

let immersiveState='';
for(const [id,label]of Object.entries({r34Begin:'걸어 보기',r34Retry:'지금 구간 다시',r34Advance:'계속',r34PanelMap:'이야기 · 챕터 지도',r34MapTitle:'열 개의 꿈',r34MapClose:'돌아가기',settingsTitle:'소리 · 화면',close:'돌아가기'}))if($(id))$(id).textContent=label;
// Optional offline concepts live outside play. Preferences never grant ownership.
const Commerce=typeof MongyuCommerce==='undefined'?null:MongyuCommerce,SHOP_KEY='mongyu-r36-commerce-lab-v1';
let shopState=Commerce?.beginSession(),shopSelected='aurora-thread',shopStorageOK=true,shopParent=null,shopMapOffer=false,shopAudioOwner=null;const shopHasReturned=r34Ready&&game.r34JourneyStatus().chapters.some(c=>c.situations.some(Boolean));
if(Commerce)try{shopState=Commerce.beginSession(JSON.parse(localStorage.getItem(SHOP_KEY)||'null'))}catch(e){shopStorageOK=false}
function renderShopOffer(){if(!Commerce||!$('shopMapOpen')||dialog!=='r34Map')return;const completedRuns=game.r34JourneyStatus().chapters.reduce((n,c)=>n+c.situations.filter(Boolean).length,0),context={surface:'success',outcome:'success',completedRuns,nowMs:Date.now(),hasReturned:shopHasReturned,interrupted:['play','pause','fail'].includes(game.state)||game.state==='riddle'&&!game.r34Status()?.riddle?.solved};if(context.interrupted)shopMapOffer=false;else if(!shopMapOffer&&Commerce.offerEligibility(context,shopState).suggest){shopMapOffer=true;shopState=Commerce.reduce(shopState,{type:'offer-shown',context});shopSave()}$('shopMapOpen').hidden=!shopMapOffer;$('shopOfferDismiss').hidden=!shopMapOffer}
function shopSave(){if(!Commerce)return;try{localStorage.setItem(SHOP_KEY,JSON.stringify(shopState))}catch(e){shopStorageOK=false}}
function renderShop(){if(!Commerce||!$('shopPanel'))return;const p=Commerce.getProduct(shopSelected),sample=Commerce.preview(shopSelected);for(const item of Commerce.catalog)$('shop-'+item.id).setAttribute('aria-pressed',String(item.id===shopSelected));$('shopProductTitle').textContent=p.name;$('shopPreview').textContent=sample.label;$('shopContents').textContent={cosmetic:'팔레트 1종 · 점프 잔상 1종',audio:'대체 편곡 3곡 구상 · 현재 2초 음색 샘플',expansion:'새 세계 1개 · 3장면과 보스 구상'}[p.kind];$('shopPrice').textContent='가격 가설 ₩'+p.priceHypothesis.amount.toLocaleString('ko-KR')+' · 실제 판매 아님';$('shopListen').hidden=p.kind!=='audio';const wished=shopState.wishlist.includes(p.id);$('shopWishlist').setAttribute('aria-pressed',String(wished));$('shopWishlist').textContent=wished?'관심 목록에서 빼기':'관심 목록에 담기';$('shopNotice').textContent='구매·소유권 지급 없음.'+(shopStorageOK?'':' 관심 목록은 이번 실행에서만 유지됩니다.');
 const c=$('shopPreviewCanvas').getContext('2d');c.setTransform(2,0,0,2,0,0);c.clearRect(0,0,320,180);c.fillStyle='#122d39';c.fillRect(0,0,320,180);const colors=sample.palette||['#d4e9d8','#a4d3d1','#cbbbe8'];
 if(p.kind==='cosmetic'){for(let i=0;i<3;i++){c.strokeStyle=colors[i];c.lineWidth=3-i*.5;c.beginPath();c.moveTo(20,124+i*12);c.bezierCurveTo(67,146+i*4,80,65+i*10,146,80+i*9);c.stroke()}if(typeof MongyuImmersiveArt!=='undefined'){c.save();c.translate(171,145);c.scale(2.6,2.6);MongyuImmersiveArt.player(c,{x:0,y:0,height:0,phase:0},MongyuImmersiveArt.palettes[0],{skinColor:colors[1]},true);c.restore()}colors.forEach((color,i)=>{c.fillStyle=color;c.fillRect(239+i*20,96,12,32)})}
 else if(p.kind==='audio'){c.strokeStyle='#577b86';c.lineWidth=1;for(let i=0;i<5;i++){c.beginPath();c.moveTo(25,44+i*12);c.lineTo(295,44+i*12);c.stroke()}sample.notes.forEach((n,i)=>{const x=40+i*34,y=94-n*3;c.fillStyle=colors[i%3];c.beginPath();c.ellipse(x,y,5,4,0,0,Math.PI*2);c.fill();c.fillRect(x+4,y-25,2,25)})}
 else{for(let i=0;i<5;i++){const x=24+i*57,y=75+(i%2)*15;c.beginPath();c.moveTo(x,y);c.lineTo(x+24,y-40);c.lineTo(x+48,y);c.lineTo(x+24,y+25);c.closePath();c.fillStyle=colors[i%3];c.globalAlpha=.3+i*.1;c.fill();c.globalAlpha=1;c.strokeStyle=colors[0];c.stroke()}}$('shopPreviewCanvas').setAttribute('aria-label',sample.label);}
function openShop(event){if(currentEdition)return false;if(activeSquareRun)return false;const fromMap=dialog==='r34Map'&&shopMapOffer&&game.state!=='fail';if(!Commerce||!fromMap&&(game.state!=='title'||dialog||collectionOpen))return false;advanceClock(event?.timeStamp);stopSound();shopParent=fromMap?'r34Map':null;modal('shopPanel',fromMap?$('shopMapOpen'):$('shopOpen'));selectShop(shopSelected);sync();$('shop-'+shopSelected).focus({preventScroll:true});return true}
function selectShop(id){if(!Commerce?.getProduct(id)||dialog!=='shopPanel')return false;stopSound();shopSelected=id;shopState=Commerce.reduce(shopState,{type:'preview',productId:id});shopSave();renderShop();return true}
function listenShop(event){if(dialog!=='shopPanel'||shopSelected!=='midnight-score'||!Commerce)return false;grantAudio(event);stopSound();if(audioSuspended||!audioGesture||settings.mute||settings.musicVolume===0||document.hidden){$('shopNotice').textContent='음악이 꺼져 있습니다. 소리 설정을 확인해 주세요.';return false}const generation=audioGeneration,token={generation};shopAudioOwner=token;const valid=()=>generation===audioGeneration&&dialog==='shopPanel'&&shopSelected==='midnight-score'&&!document.hidden&&!settings.mute&&settings.musicVolume>0;try{ensureAudioGraph();const schedule=()=>{if(!valid()||audio.state!=='running'){if(shopAudioOwner===token)shopAudioOwner=null;if(!shopAudioOwner&&!transitionOwner&&!anyAudioOwnerAllowed()&&voices.size===0)Promise.resolve(audio.suspend()).catch(()=>{});return false}const t=audio.currentTime;Commerce.preview(shopSelected).notes.forEach((note,i)=>{if(voices.size>=8)return;const o=audio.createOscillator(),gain=audio.createGain(),at=t+i*.25;o.type='sine';o.frequency.setValueAtTime(220*Math.pow(2,note/12),at);gain.gain.setValueAtTime(.001,at);gain.gain.linearRampToValueAtTime(.035,at+.006);gain.gain.exponentialRampToValueAtTime(.001,at+.22);o.connect(gain);gain.connect(musicBus);o._gain=gain;o._role='preview';voices.add(o);o.onended=()=>{releaseVoice(o);if(valid()&&voices.size===0){if(shopAudioOwner===token)shopAudioOwner=null;Promise.resolve(audio.suspend()).catch(()=>{})}};o.start(at);o.stop(at+.24)});return true};if(audio.state==='running')schedule();else Promise.resolve(audio.resume()).then(schedule).catch(()=>{});$('shopNotice').textContent='2초 음색 샘플 재생 중 · 완성곡이 아닙니다.';return true}catch(e){$('shopNotice').textContent='소리 샘플을 재생할 수 없습니다.';return false}}
if($('shopMapOpen')){$('shopMapOpen').onclick=openShop;$('shopOfferDismiss').onclick=()=>{shopState=Commerce.reduce(shopState,{type:'dismiss-suggestions'});shopMapOffer=false;shopSave();renderShopOffer();$('r34MapClose').focus({preventScroll:true})}}
if($('shopOpen')){$('shopOpen').hidden=!Commerce;$('shopOpen').onclick=openShop;$('shopClose').onclick=closeDialog;$('shopListen').onclick=listenShop;for(const item of Commerce?.catalog||[])$('shop-'+item.id).onclick=()=>selectShop(item.id);$('shopWishlist').onclick=()=>{if(!Commerce||dialog!=='shopPanel')return;shopState=Commerce.reduce(shopState,{type:'wishlist-toggle',productId:shopSelected});shopSave();renderShop()}}

function openModes(event){if(currentEdition)return false;advanceClock(event?.timeStamp);if(game.state==='play')game.pause();events();stopSound();modal('modes',$('modesOpen'));sync();$('modeR34').focus({preventScroll:true});return true}
function retryCurrent(event){if(activeSquareRun)return retrySquare(event);modal(null);if(r34Active())return retryR34(event);if(game.mode==='arcade')return startArcade(event);if(originActive())return game.mode==='origin-finale'?startFinale(event):startOrigin(event,originStart);if(hero?.active)return startHero(event);return startSelected(event,game.mode==='freeplay')}
function syncImmersive(force=false){
 if(!$('titleScreen'))return;if(activeSquareRun){if($('restorationOpen'))$('restorationOpen').hidden=true;syncSquare(force);return}if($('runHud'))$('runHud').hidden=true;document.body.dataset.restoration='false';if($('pauseRestoration'))$('pauseRestoration').hidden=true;if($('restorationCall'))$('restorationCall').hidden=true;document.body.dataset.square=String(!!squareRun&&game.state==='title');if($('squareHud'))$('squareHud').hidden=true;if($('squareResult'))$('squareResult').hidden=true;
 const title=game.state==='title'&&!dialog&&!collectionOpen,paused=game.state==='pause'&&!dialog&&!collectionOpen&&!r34Briefing,playing=game.state==='play'&&!dialog&&!collectionOpen&&!r34Briefing;
 canvas.tabIndex=paused||dialog||collectionOpen||r34Briefing||!$('r34Panel').hidden||!$('arcadePanel').hidden?-1:0;
 canvas.inert=paused||!$('r34Panel').hidden||!$('arcadePanel').hidden;canvas.setAttribute('aria-hidden',String(collectionOpen||paused||!$('r34Panel').hidden||!$('arcadePanel').hidden));
 const legacyResult=['clear','fail'].includes(game.state)&&!r34Active()&&game.mode!=='arcade'&&!dialog&&!collectionOpen;
 document.body.dataset.screen=title?'title':playing?'play':collectionOpen?'collection':legacyResult?'result':'panel';
 $('titleScreen').hidden=!title;$('retryPlay').disabled=false;$('pauseSheet').hidden=!paused;if(title&&!squareRun&&typeof MongyuImmersiveArt!=='undefined'){const layout=MongyuImmersiveArt.titleLayout(viewport),heading=$('titleScreen').querySelector('.title-heading'),actions=$('titleScreen').querySelector('.title-actions');if(heading)heading.style.top=layout.headingTop+'px';if(actions){actions.style.top=layout.actionsTop+'px';actions.style.setProperty?.('--title-button-height',layout.primaryHeight+'px')}}
 const journey=r34Ready?game.r34JourneyStatus():null,progress=journey?.chapters.some(c=>c.solved||c.bossDefeated||c.situations.some(Boolean));
 if(!restorationUI)$('titleContinue').textContent=squareRun?'꿈 시작':progress?'꿈 이어 걷기':'꿈 시작';$('titleContinue').hidden=!squareRun&&!r34Ready;if(squareRun&&title)$('arcadeStart').hidden=true;$('modesOpen').hidden=!title;restorationUI?.syncTitle(title);if($('shopOpen'))$('shopOpen').hidden=!title||!Commerce;
 if($('hudMastery')){$('hudMastery').hidden=!playing||!r34Active()||!game.r34Status().mastery;$('hudMastery').textContent=playing&&r34Active()?masteryText(game.r34Status()):''}
  $('hudCue').hidden=!playing;$('hudCue').textContent=playing?(r34Active()?r34ContextCue(game.r34Status()):'화면을 눌러 '+controls().action):'';
 // Landscape R34 fills a tighter action camera. Keep text in its left gutter,
 // outside the leftmost dive/anchor silhouette instead of over the action lane.
 const wideR34=r34Active()&&viewport.width>viewport.height,actionScale=Math.min(viewport.width/360,viewport.height/300),gutter=(viewport.width-360*actionScale)/2;
 $('hudCue').style.width=wideR34?Math.max(44,Math.min(210,gutter+60*actionScale-32))+'px':'';$('hudCue').style.maxWidth=wideR34?'210px':'420px';$('hudCue').style.right=wideR34?'auto':'72px';$('hudCue').style.fontSize=wideR34?'12px':'13px';
 $('options').hidden=playing||paused;$('pause').hidden=!playing;$('pause').textContent='Ⅱ';$('pause').setAttribute('aria-label','일시정지 · 메뉴');
 for(const id of ['r34Open','arcadeRisk','replyOpen','primary','map','home','act','skip','heroExit'])if(!collectionOpen&&!(legacyResult&&['primary','map','home'].includes(id)))$(id).hidden=true;
 if(legacyResult){$('primary').hidden=false;$('home').hidden=false}$('settingsSkip').hidden=game.mode!=='tutorial'||game.state==='title';
 $('pauseStory').hidden=!r34Active();$('pauseContext').textContent=r34Active()?[(game.r34Status().briefing||''),masteryText(game.r34Status(),true)].filter(Boolean).join(' · '):'화면을 눌러 '+controls().action;
 $('modeR34Difficulty').textContent=r34Difficulty==='regular'?'열 개의 꿈 난이도 · 일반':'열 개의 꿈 난이도 · 도전';$('modeR34Difficulty').setAttribute('aria-pressed',String(r34Difficulty==='challenge'));
 $('modeRisk').textContent=arcadeRisk==='brave'?'도전 난이도 · 한 목숨':'도전 난이도 · 기본';$('modeRisk').setAttribute('aria-pressed',String(arcadeRisk==='brave'));$('modeReply').hidden=!window.QUAD_RIFT_APP?.squareReply;
 // When an input method resizes the WebView, region scrolling keeps the answer and submit control reachable.
 if(paused&&immersiveState!=='pause')$('resumePlay').focus({preventScroll:true});
 immersiveState=paused?'pause':game.state;
}
if($('r36ReplayRoute'))$('r36ReplayRoute').onclick=e=>startR34(e,1,true);
$('settingsModes').onclick=openModes;$('settingsHome').onclick=home;$('settingsSkip').onclick=e=>{modal(null);$('skip').onclick(e)};
$('titleContinue').onclick=e=>restorationUI?restorationUI.continueJourney(e):squareRun?startSquare(e):startR34(e);if($('squareRetry'))$('squareRetry').onclick=retrySquare;if($('squareRestart'))$('squareRestart').onclick=e=>activeSquareRun?.mode==='restoration'?restorationUI.retry(e):startSquare(e);if($('squareHome'))$('squareHome').onclick=home;$('modesOpen').onclick=openModes;$('pauseModes').onclick=openModes;$('modesClose').onclick=closeDialog;
$('modeR34Difficulty').onclick=()=>{r34Difficulty=r34Difficulty==='regular'?'challenge':'regular';syncImmersive()};$('modeR34').onclick=e=>startR34(e);$('modeR34Map').onclick=openR34;$('modeArcade').onclick=e=>startArcade(e);$('modeRisk').onclick=()=>{arcadeRisk=arcadeRisk==='standard'?'brave':'standard';syncImmersive()};
$('modeOrigin').onclick=e=>startOrigin(e);$('modeCollection').onclick=e=>{modal(null);openCollection(e)};$('modeReply').onclick=e=>{home();window.QUAD_RIFT_APP?.squareReply?.open?.(e)};$('modeTilt').onclick=e=>{modal(null);$('tiltOpen').click()};
$('resumePlay').onclick=pauseToggle;$('retryPlay').onclick=retryCurrent;$('pauseStory').onclick=openR34;$('pauseHome').onclick=home;$('pauseOptions').onclick=e=>$('options').onclick(e);

mountRunSettings();
if(typeof MongyuRestorationUI!=='undefined')restorationUI=MongyuRestorationUI.mount({document,storage:localStorage,prepareTrialSetting:(setting,value,event)=>{if(setting==='sound'&&value)grantAudio(event)},trialSettingExperienced,sceneCue:restorationSceneCue,audioGesture:grantAudio,audioEntry:restorationAudioEntry,viewport:()=>({...viewport}),reduced:()=>settings.reduced,dialog:()=>dialog,startRun:startRestorationRun,resumeRun:resumeRestorationRun,startLegacy:startSquare,activeRun:()=>activeSquareRun,openDialog:(name,event)=>{grantAudio(event);if(name==='restorationScene'&&dialog===name)stopSceneCue();else modal(name,$(name==='storyJournal'?'storyOpen':'restorationOpen'));sync();draw()},closeDialog,refresh:()=>{squareStatusAt=-1;events();sync();draw()}});
if(window.visualViewport)window.visualViewport.addEventListener('resize',()=>{fit();draw()});
const mobileWardrobe=typeof MongyuMobile!=='undefined'?MongyuMobile.mount({document,storage:{getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)},progress:()=>restorationUI?.view().status.collected||0,open:e=>{grantAudio(e);modal('wardrobePanel',$('shopOpen'));sync()},close:closeDialog,redraw:draw}):null;
let lastStillRun=null,lastStillFrame=null,lastStillKey='';
function tick(now){
 restorationUI?.tick(now);advanceClock(now);events();
 if(!activeSquareRun){syncBridgeInvitation();syncArcade();syncR34()}
 syncImmersive();
 const run=activeSquareRun;
 const still=run?.nativeRuntime&&run.state!=='play'||!run&&settings.reduced&&game.state==='title';
 const key=still?[run?.state,viewport.width,viewport.height,settings.reduced,settings.dreamIntensity].join('|'):'';
 if(!document.hidden&&(!still||run!==lastStillRun||run?.nativeFrame!==lastStillFrame||key!==lastStillKey))draw();
 lastStillRun=still?run:null;lastStillFrame=still?run?.nativeFrame:null;lastStillKey=key;
 requestAnimationFrame(tick);
}storageMessage();sync();draw();requestAnimationFrame(tick);
window.QUAD_RIFT_APP={version:'r12.0.0',candidateVersion:'r92',mobileWardrobe,musicView,restoration:restorationUI,activeRun:()=>activeSquareRun,squareRun,startSquare,retrySquare,squareStorageKey:SQUARE_KEY,squareView:()=>({active:!!activeSquareRun,status:squareRun?.status(),storageOK:squareStorageOK,readOnly:squareReadOnly}),viewport:()=>({...viewport}),feedbackView,openShop,selectShop,listenShop,shopView:()=>({selected:shopSelected,state:Commerce?.createState(shopState),storageOK:shopStorageOK}),openModes,startArcade,chooseArcade,newArcade,arcadeStorageKey:ARCADE_KEY,arcadeRecords:()=>({...arcadeRecords,storageOK:arcadeStorageOK}),openR34,startR34,beginR34,retryR34,advanceR34,answerR34,hintR34,writeR34,r34StorageKey:R34_KEY,r34BackupKey:R34_BACKUP,r34View:()=>({ready:r34Ready,briefing:r34Briefing,selected:r34Selected,storageOK:r34StorageOK,readOnly:r34ReadOnly,journey:r34Ready?game.r34JourneyStatus():null}),openMemories,startMemoryChallenge,writeMemories,memoryStorageKey:MEMORY_KEY,memoryBackupKey:MEMORY_BACKUP,startOrigin,startFinale,writeOrigin,originStorageKey:ORIGIN_KEY,originBackupKey:ORIGIN_BACKUP,startHero,exitHero:home,processEvents:events,HERO_LEVELS,controls,MODE_CONTROLS,game,settings,action,suspend,pause:suspend,back,home,write,sync,fit,draw,openCollection,selectLevel,startSelected,nextLevel,openRiddle,submitRiddle,closeDialog,storageKey:KEY,backupKey:BACKUP,recoveryKey:RECOVERY,recoveryBackupKey:RECOVERY_BACKUP,finaleEpilogue,getState:()=>({candidateVersion:'r92',mobileWardrobe,music:musicView(),square:activeSquareRun?.status()||null,dreamIntensity:settings.dreamIntensity,dreamAudio:activeSquareRun&&licensedPlayer&&licensedPlayer.inspect().status!=='unsupported'?licensedPlayer.inspect():activeSquareRun&&squarePlayer?squarePlayer.inspect():dreamPlayer?dreamPlayer.inspect():null,restoration:restorationUI?.view()||null,arcade:game.mode==='arcade'?game.arcadeStatus():null,r34:r34Ready?{status:r34Active()?game.r34Status():null,journey:game.r34JourneyStatus(),briefing:r34Briefing,storageOK:r34StorageOK}:null,narrative:{...narrative},memories:memoryView(),origin:{...originProgress,learning:originLearning,startChapter:originStart,storageOK:originStorageOK},hero:hero?{active:hero.active,index:hero.index,completed:hero.completed,levelIds:[...HERO_LEVELS]}:null,state:activeSquareRun?.state||game.state,mode:activeSquareRun?.mode||game.mode,tutorialStep:game.tutorialStep,tutorialStatus:settings.tutorialStatus,modal:!!dialog,dialog,collection:collectionOpen,chapter,selected:selectedId,storageOK})};
function miniGameReturnFocus(){if(game.state==='pause'&&focusable($('resumePlay')))return $('resumePlay');if(game.state==='title'&&focusable($('modesOpen')))return $('modesOpen');return $('pause')}
if(typeof MongyuDayNight!=='undefined'&&$('dayNightOpen'))window.QUAD_RIFT_APP.dayNight=MongyuDayNight.mount({document,window,canOpen:dayNightAvailable,onOpen:event=>{dayNightUsed=true;replyReturnPending=true;game.cancelOriginJump();resetOriginHeld();resetClock(event?.timeStamp);game.pause();events();stopSound();syncBridgeInvitation()},onClose:(event,outcome)=>{if(game.mode==='origin-route'&&outcome?.completed)narrative.dayNightCrossed=true;game.cancelOriginJump();resetClock(event?.timeStamp);last=null;acc=0;bridgeBlockUntil=timestamp(event?.timeStamp)+100;sync();draw();return miniGameReturnFocus()},reduced:()=>settings.reduced});
if(typeof MongyuCompanionBridge!=='undefined'&&$('bridgeOpen'))window.QUAD_RIFT_APP.companionBridge=MongyuCompanionBridge.mount({document,window,canOpen:bridgeAvailable,onOpen:event=>{bridgeUsed=true;replyReturnPending=false;game.cancelOriginJump();resetClock(event?.timeStamp);game.pause();events();stopSound();syncBridgeInvitation()},onClose:(event,outcome)=>{if(game.mode==='origin-route'&&outcome?.completed)narrative.companionCrossed=true;game.cancelOriginJump();resetClock(event?.timeStamp);last=null;acc=0;bridgeBlockUntil=timestamp(event?.timeStamp)+100;sync();draw();return miniGameReturnFocus()},reduced:()=>settings.reduced});
if(typeof MongyuSquareReply!=='undefined'&&$('replyOpen'))window.QUAD_RIFT_APP.squareReply=MongyuSquareReply.mount({document,window,canOpen:context=>context==='journey'?replyAvailable():game.state==='title'&&!collectionOpen&&!dialog,onOpen:(event,context)=>{if(context==='journey'){replyUsed=true;game.cancelOriginJump();resetClock(event?.timeStamp);game.pause();events()}else{clearNarrative();invalidateMemory('other-mode')}stopSound()},onClose:(event,context,outcome)=>{if(context==='journey'&&game.mode==='origin-route'&&outcome?.completed)narrative.replySolved=true;replyReturnPending=context==='journey';if(context==='journey'){game.cancelOriginJump();resetClock(event?.timeStamp);bridgeBlockUntil=timestamp(event?.timeStamp)+100}last=null;acc=0;sync();draw();return miniGameReturnFocus()},reduced:()=>settings.reduced});
if(typeof MongyuTilt!=='undefined'&&$('tiltOpen'))window.QUAD_RIFT_APP.tilt=MongyuTilt.mount({document,window,onOpen:()=>{clearNarrative();invalidateMemory('other-mode');modal(null);suspend()},onClose:()=>{last=null;acc=0;modal('settings',$('options'));sync()},reduced:()=>settings.reduced});
retireLegacySurfaces();
// Reveal only after the final scene, style and all controllers are mounted.
if(document.documentElement?.dataset)document.documentElement.dataset.boot='ready';if($('bootSplash'))$('bootSplash').hidden=true;
})();
