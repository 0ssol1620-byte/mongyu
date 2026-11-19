/* Authored wording/staging. R74 native cursor, lane and terminal structure is recovered;
 * original dialogue, marker appearance and frame-exact presentation are not reproduced. */
(function(root){'use strict';
const VIGNETTES={
 28:{name:'공중의 틈',effect:'levitate',pages:['잠깐, 달리기를 지켜보는 당신에게 보여 줄 것이 있다.','길이 잠시 공중에 떠올랐다. 이 정도면 작은 묘기라고 해도 될까.','구경은 여기까지. 발끝이 다시 바닥에 닿았다.'],reactions:['!','?','']},
 41:{name:'달아난 벨소리',effect:'ringtone',pages:['이번 물음표에는 공짜 벨소리 선물을 준비했다고 한다.','그런데 선물이 될 벨소리가 먼저 달아나 버렸다.','받을 것은 없어졌다. 남은 것은 조금 허탈한 웃음뿐이었다.'],reactions:['!','?','']},
 56:{name:'첫 번째 쉼',effect:'breath',pages:['물음표 차례가 돌아왔다. 이번에는 무엇이 나올까.','오늘의 물음표는 쉬고 싶다고 한다.','별일 없이 쉬어 가는 것도 한 차례. 이제 다시 달려 보자.'],reactions:['','…','']},
 65:{name:'조언도 쉬는 날',effect:'look-back',pages:['생활에 도움이 될 이야기를 들려주려던 참이었다.','하지만 준비한 조언보다 쉬고 싶은 마음이 앞섰다.','이야기는 다음으로 미루고 이번 물음표도 잠시 쉰다.'],reactions:['?','…','']},
 81:{name:'마지막 물음표의 쉼',effect:'stillness',pages:['마지막 물음표를 만났다.','끝이라고 거창한 것을 준비하지는 못했다. 이번에도 쉬는 시간이다.','짧은 여백을 남겨 두고 달리기로 돌아간다.'],reactions:['','?','!']}
};
const INTRO={
 20:{name:'다가오는 발',pages:['어디서 본 얼굴인지 이야기가 오갔다. 예전 게임에서 만난 사이냐는 실랑이가 곧 대결로 번졌다.'],reaction:'!'},
 38:{name:'벽의 얼굴',pages:['상대는 자기 얼굴이 신경 쓰이는 모양이었다. 길이 얼굴의 비율을 놀리자 분위기가 험악해졌다.'],reaction:'?'},
 8:{name:'작은 햇살',pages:['여기서 마음대로 놀아도 되느냐는 말에 시비가 붙었다. 길은 앞을 막은 상대를 마주 보았다.'],reaction:'!'},
 22:{name:'뒤따르는 발소리',pages:['주인공은 작은 개를 발견했다. 서로 장난스럽게 반응을 주고받은 뒤, 강아지를 데리고 함께 가기로 했다.'],cast:'dog',reaction:'?'},
 47:{name:'등을 내어 준 사람',pages:['할머니가 등에 업혀 가라고 권했다. 주인공은 어느새 이미 업혀 있었다. 그 사실을 알아챈 둘이 함께 놀랐다.'],cast:'elder',reaction:''},
 69:{name:'새로운 만남',pages:['새 연인과 길은 서로에게 호감을 보였다. 새 연인이 길 대신 달려 주겠다고 나섰고, 두 사람은 새 만남에 함께 기뻐했다.'],cast:'woman',reaction:'!'},
 87:{name:'알고 있던 이별',pages:['주인공이 이별을 꺼내려 머뭇거리자 여울은 이미 알고 있었다는 듯 받아들였다. 말을 마친 두 사람은 오히려 마음이 편해졌다.'],cast:'walker',reaction:'…'},
 31:{name:'강아지를 지키는 길',pages:['상대가 강아지를 내놓으라고 했다. 주인공은 함께 온 친구를 넘길 생각이 없었다. 물러서지 않는 둘 사이에 대결이 시작됐다.'],reaction:'!'},
 45:{name:'매달린 사슬',pages:['상대가 주인공에게 누군가를 소개해 주겠다고 나섰다. 주인공은 그 만남을 사양했고, 대화는 순순히 끝나지 않았다.'],reaction:'!'},
 58:{name:'돌아가는 가지',pages:['날카롭게 구는 상대에게 주인공은 로션이라도 바르면 부드러워지겠다고 농담했다. 농할머니를 반기는 기색은 없었다.'],reaction:'?'},
 66:{name:'밀려오는 물결',pages:['상대는 옛 연인이 이미 길을 잊었을 거라고 말했다. 주인공은 그 말을 받아들이지 못하고 맞섰다.'],reaction:'!'},
 77:{name:'교차하는 두 팔',pages:['상대가 새 연인에게 관심을 보이자 주인공은 퉁명스럽게 대꾸했다. 말이 끝나자 곧 대결이 시작됐다.'],reaction:'!'},
 90:{name:'회오리의 반사',pages:['길은 한 사람에게 빠져드는 마음을 회오리에 휘말리는 일에 빗대었다. 그 마음을 안고 다시 상대를 마주했다.'],reaction:'?'},
 99:{name:'거절 뒤의 대결',pages:['주인공은 옛 연인에게 다가가려 했다. 그녀는 받아들이지 않았지만, 길은 여전히 그리운 마음을 거두지 못했다.'],reaction:'…'}
};
const STORY_REACTIONS={1:['!','?'],5:['?','…'],13:['?','…'],16:['?','!'],24:['!','?'],34:['','?'],39:['!','…'],49:['','…'],52:['','?'],55:['?','…'],62:['','?'],73:['!','?'],80:['?','…'],84:['!','…'],92:['…','?'],96:['!','…'],100:['…','?','']};
// Authored actor staging. Marks never assert original dialogue attribution.
function sceneStage(slot,index,kind,mark=''){
 const actor=(id,x,reaction='',facing=1)=>({id,x,reaction,facing,sourceRole:({'walker':'protagonist','woman':'new-girlfriend','red-form':'former-beloved','dog-only':'dog','elder-alone':'grandmother','elder':'grandmother-carrying-protagonist'}[id]||id)});
 if(kind==='intro'){
  if(slot.number===22)return {beat:'meeting-dog',actors:[actor('walker',240,'!'),actor('dog-only',500,'?',-1)]};
  if(slot.number===47)return {beat:'meeting-elder',actors:[actor('walker',240,'!'),actor('elder-alone',500,'!',-1)]};
  if(slot.number===69)return {beat:'meeting-woman',actors:[actor('walker',240,'!'),actor('woman',500,'',-1)]};
  if(slot.number===87)return {beat:'parting',actors:[actor('walker',240,''),actor('woman',500,'?',-1)]};
  if(slot.number===99)return {beat:'rejected-approach',actors:[actor('walker',230,mark),actor('red-form',500,'')]};
 }
 if(slot.number===100)return {beat:['meeting','distance','departure'][index]||'departure',actors:index<2?[actor('walker',230,index===0?'!':''),actor('red-form',index===0?500:575,index===1?'!':'')]:[actor('walker',300,'')]};
 if([73,80,84].includes(slot.number))return {beat:({73:'new-relationship',80:'remembering-former-beloved',84:'deciding-to-part'})[slot.number],actors:[actor('walker',240,mark),actor('woman',500,'',-1)]};
 const id=slot.characterId||'walker';
 if(id==='dog')return {beat:'companions',actors:[actor('walker',285,mark),actor('dog-only',490,'')]};
 return {beat:'journey',actors:[actor(id,360,mark)]};
}
function sceneElder(c,x,y,height,ink='#18121d'){
 if(root.MongyuMobile){root.MongyuMobile.sprite(c,{x,y,bodyHeight:height,pose:'stand',tangent:{x:1,y:0}},{ink},true,'elder');c.save();c.strokeStyle=ink;c.lineWidth=height/100;c.beginPath();c.moveTo(x+height*.2,y-height*.5);c.lineTo(x+height*.23,y);c.stroke();c.restore();return;}
 // Separate standing visitor: gameplay's elder renderer carries the runner.
 c.save();c.translate(x,y);c.scale(height/100,height/100);c.strokeStyle='#f6f3e9';c.fillStyle='#f6f3e9';c.lineWidth=4;c.lineCap='round';
 c.beginPath();c.arc(0,-83,7,0,Math.PI*2);c.fill();
 for(const points of [[[0,-74],[-7,-50],[-14,-34]], [[-7,-50],[6,-31],[9,-3]], [[-14,-34],[-23,-3]], [[-2,-66],[14,-51],[23,-52]], [[23,-55],[23,0]]]){c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke()}
 c.restore();
}
function mount(host){
 const C=root.MongyuRestorationCatalog,G=root.MongyuRestorationStoryGraph,R=root.QuadRiftRestoration,M=root.MongyuRestorationMastery,$=id=>host.document.getElementById(id);
 if(!C||!R||!$('restorationCollection'))return null;
 const native=root.MongyuNativeRestoration;
 const storage=native?native.isolatedStorage(host.storage):host.storage,skinJournal=root.MongyuMapSkins?.create(storage);
 const loaded=C.loadSave(storage);let save=loaded.save,storageOK=loaded.ok,readOnly=loaded.readOnly,selected=C.getSlot(save.selected)||C.slots[0];
 let audioBoardEntry=0,aftermath=null,scene=null,sceneLast=null,activeSlot=null,activeConfig=null,activeRun=null,callContext=null,award='',free=false,settingValue=false,settingTouched=false,qualified=false,summaryCache=null,launchAfterOpening=false,newBest=0;
 let mastery=M?.load(storage)||{ok:true,save:null},completionSequence=0;
 const journalButtons=[];
 const sessionId=Date.now().toString(36),completedRuns=new WeakSet(),aftermathRuns=new WeakSet(),progressCache=new Map(),buttons=[];
 const labels={story:'이야기',character:'동행',condition:'기억의 조건',boss:'대결',ending:'마지막 이야기'};
 function summary(){return summaryCache||(summaryCache=C.status(save))}
 function scoreProgress(slot=selected){if(!progressCache.has(slot.id))progressCache.set(slot.id,C.scoreProgress?.(save,slot.id)||{current:0,target:slot.rule.type==='cumulative-score'?slot.rule.target:slot.rule.type==='combined'?slot.rule.totalScore:0,remaining:0});return progressCache.get(slot.id)}
 function persist(next){save=next;summaryCache=null;progressCache.clear();const r=C.writeSave(storage,save);storageOK=r===true||r?.ok===true;if(r?.readOnly)readOnly=true;return storageOK}
 function text(id,value){const node=$(id);if(node&&node.textContent!==String(value??''))node.textContent=String(value??'')}
 function ticketKind(slot){return {story:'S',boss:'B',character:'E',call:'?',interlude:'?'}[slot.rule.type]||''}
 function page(){return Math.floor((selected.number-1)/10)}
 function localRecord(key){return M?.get(mastery.save,key)||{bestScore:0,bestChain:0,attemptCount:0,clearCount:0}}
 function recordText(key){const v=localRecord(key);return v.attemptCount?'최고 '+v.bestScore+'점 · 연속 '+v.bestChain+' · 완주 '+v.clearCount+'회':''}
 function focusSlot(){buttons[selected.number-1]?.focus({preventScroll:true})}
 function select(id,focus=false){const slot=C.getSlot(id);if(!slot)return false;if(slot.id!==selected.id){settingValue=false;settingTouched=false;award=''}selected=slot;render();if(focus)focusSlot();return true}
 function render(){
  const s=summary(),currentPage=page();text('restorationProgress',s.collected+' / 100');text('restorationPage',(currentPage+1)+' / 10');
  for(const entry of C.collection(save)){
   const b=buttons[entry.number-1];if(!b)continue;
   const skin=skinJournal?.get(entry.number,entry.collected);if(skin!==null&&skin!==undefined&&b.dataset.skinPalette!==String(skin)){root.MongyuMapSkins.draw(b.skinPlate.getContext('2d'),skin);b.dataset.skinPalette=String(skin)}b.skinPlate.hidden=skin===null||skin===undefined;
   const chosen=entry.id===selected.id;b.hidden=Math.floor((entry.number-1)/10)!==currentPage;b.numberPlate.textContent=String(entry.number).padStart(3,'0');
   b.statePlate.textContent=entry.number===100&&entry.unlocked?(entry.collected?'감상 완료':'획득'):entry.collected?'찾음':entry.unlocked?'열림':'잠김';b.markPlate.textContent=entry.collected?'✓':entry.unlocked?(ticketKind(entry)||'→'):'×';
   b.dataset.collected=String(entry.collected);b.dataset.locked=String(!entry.unlocked);b.tabIndex=chosen?0:-1;b.setAttribute('aria-pressed',String(chosen));b.setAttribute('aria-label',entry.number+'. '+entry.title+'. '+(entry.number===100&&entry.unlocked?(entry.collected?'감상한 마지막 이야기':'획득한 마지막 이야기'):entry.collected?'찾은 기억':entry.unlocked?'열린 기억':'잠긴 기억'));
  }
  $('restorationPagePrev').disabled=currentPage===0;$('restorationPageNext').disabled=currentPage===9;$('restorationRouteNext').disabled=!s.nextSlot;
  text('restorationSlotTitle',String(selected.number).padStart(3,'0')+' · '+selected.title);text('restorationKind',labels[selected.kind]||'기억');text('restorationInstruction',selected.instruction);
  text('restorationMastery',recordText(selected.id));$('restorationMastery').hidden=!recordText(selected.id);
  $('restorationSettingNotice').hidden=selected.rule.type!=='setting';
  text('restorationSettingNotice',selected.rule.setting==='sound'?'시작 소리를 고를 수 있어요. 시작 후 설정에서 소리를 한 번 바꾸면 됩니다. 켜기: 음악 40%, 효과음 45%. 끝나면 원래 설정으로 돌아갑니다.':selected.rule.setting==='vibration'?'시작 후 설정에서 시각 진동을 한 번 바꾸면 됩니다. 점프·착지·충돌의 시각 신호이며 화면은 흔들리지 않습니다.':'시작 속도를 고를 수 있어요. 시작 후 설정에서 속도를 한 번 바꾸면 됩니다.');
  const objective=scoreProgress();text('restorationObjective',objective.target?'이 기억 '+objective.current+' / '+objective.target+'점':'');$('restorationObjective').hidden=!objective.target;
  text('restorationLock',selected.number===100&&s.endingAcquired&&!s.endingViewed?'마지막 이야기를 얻었습니다. 끝까지 감상하면 자유 달리기가 열립니다.':C.lockReason(save,selected.id)||'지금 들어갈 수 있어요.');
  const open=C.unlocked(save,selected.id)||s.finished,obtained=save.collected.includes(selected.id),isSetting=selected.rule.type==='setting';
  $('restorationStart').disabled=!open;$('restorationSetting').hidden=!isSetting;$('restorationSettingOff').hidden=!isSetting;
  const fast=selected.rule.setting==='speed',initialValue=settingTouched?settingValue:fast?'slow':selected.rule.setting==='vibration';text('restorationSetting',fast?'빠르게':'켜기');text('restorationSettingOff',fast?'느리게':'끄기');
  $('restorationSetting').setAttribute('aria-pressed',String(fast?initialValue==='fast':initialValue===true));
  $('restorationSettingOff').setAttribute('aria-pressed',String(fast?initialValue==='slow':initialValue===false));
  text('restorationStart',selected.number===100&&s.endingAcquired?(s.endingViewed?'엔딩 다시 보기':'엔딩 보기'):obtained?'다시 들어가기':selected.traversal?'이 꿈 시작':'기억 만나기');
  $('restorationClock').hidden=!selected.rule.period;$('restorationFree').disabled=!s.finished;text('restorationFree',s.finished?'자유롭게 달리기':'자유 달리기 · 엔딩 감상 후');
  text('restorationNotice',readOnly?'기존 기록은 보존합니다. 지금 진행은 이번 실행에만 남습니다.':!storageOK?'저장할 수 없어 이번 실행에만 남습니다.':award||'');
  const palette=root.MongyuSquareArt?.palettes,tone=palette?.[(selected.chapter-1)%palette.length]?.hot; if(tone)host.document.body.style.setProperty?.('--world-color',tone);
 }
 function revealPending(){
  if(!save.pendingUnlock)return false;
  persist(C.reveal(save,save.pendingUnlock.id));
  selected=C.getSlot(save.selected)||selected;
  award='기억을 찾았습니다.';
  return true;
 }
 function nextMemory(event){
  revealPending();
  const next=summary().nextSlot;
  return next?start(event,next):open(event);
 }
 function open(event){host.audioGesture?.(event);
  revealPending();
  host.openDialog('restorationCollection',event);host.audioEntry?.({kind:'board',owner:++audioBoardEntry},event);render();focusSlot();return true
 }
 function chooseSetting(value,event){settingValue=value;settingTouched=true;host.prepareTrialSetting?.(selected.rule.setting,value,event);render()}
 function configFor(slot){return {period:$('restorationPeriod').value||'auto',characterId:slot.rule.characterId||save.characterId,setting:slot.rule.setting,settingValue:settingTouched?settingValue:slot.rule.setting==='speed'?'slow':slot.rule.setting==='vibration',settingTouched,freePlay:false}}
 function launch(event,config){
  scene=null;sceneLast=null;newBest=0;free=!!config.freePlay;activeConfig={...config};qualified=false;
  const isCall=activeSlot.rule.type==='call'&&!free;
  // Local-call interruption remains the explicitly authored scene bridge.
  const Run=native&&!isCall&&native.slotMetadata(activeSlot.number,{freePlay:free}).supported?native.RestorationRun:R.RestorationRun;
  const run=new Run({settings:{speed:'fast'},slot:activeSlot,viewport:host.viewport?.(),attempt:save.attempt+1,practice:free||isCall,...config,openingAssist:activeSlot.number===2&&!free,frontier:save.collected.length+1,priorCredit:save.nativeProgress?.[activeSlot.id]?.credit??save.slotScores[activeSlot.id]??0,recordScore:save.nativeProgress?.[activeSlot.id]?.recordScore??0});
  activeRun=run;callContext=isCall?{run,triggered:false,answered:false,pending:false,awarded:false}:null;
  host.startRun(run,event);return true;
 }
 function start(event,id,options={}){host.audioGesture?.(event);
  if(save.pendingUnlock)return open(event);
  if(id&&selected.id!==C.getSlot(id)?.id)select(id);
  if(!options.retry&&id&&(selected.rule.period||selected.rule.setting)){open(event);return true}
  if(!C.unlocked(save,selected.id)&&!summary().finished)return false;
  award='';qualified=false;free=false;activeSlot=selected;persist({...save,selected:selected.id});
  const config=options.config||configFor(selected),intro=INTRO[selected.number];
  launchAfterOpening=options.playAfterStory===true&&selected.number===1;
  const sequence=G?.getSequence(selected);
  if(sequence){scene={kind:sequence.kind,graph:G.createState(selected),sequence,index:0,pages:sequence.steps,elapsed:0,beatAt:0};sceneLast=null;showScene(event);return true}
  if(selected.traversal||selected.rule.type==='call'){
   if(intro&&!options.retry){activeConfig={...config};scene={kind:'intro',pages:intro.pages,index:0,elapsed:0,beats:0,beatAt:0,intro,config};sceneLast=null;showScene(event);return true}
   return launch(event,config);
  }
  const vignette=VIGNETTES[selected.number],pages=vignette?.pages||selected.pages?.length&&selected.pages||[selected.instruction];
  scene={kind:selected.rule.type,index:0,pages,elapsed:0,rings:0,beats:0,beatAt:0,vignette};sceneLast=null;showScene(event);if(vignette?.effect==='ringtone')host.sceneCue?.('ringtone',event);return true;
 }
 function reaction(){if(scene?.graph)return '';return scene?.intro?.reaction??scene?.vignette?.reactions[scene.index]??STORY_REACTIONS[(scene.slot||selected).number]?.[scene.index]??''}
 // Native marker meanings, independently drawn shapes. Cadence is authored.
 function drawNativeMarker(c,marker,x,y,size,ink='#18121d'){
  c.save();c.translate(x,y);c.scale(size/24,size/24);c.lineWidth=2.6;c.lineCap='round';
  c.fillStyle=marker.kind==='heart'?'#ed4776':marker.kind==='blue-drop'?'#32528c':ink;c.strokeStyle=c.fillStyle;
  c.beginPath();
  if(marker.kind==='heart'){c.moveTo(0,9);c.bezierCurveTo(-22,-4,-7,-17,0,-7);c.bezierCurveTo(7,-17,22,-4,0,9);c.fill()}
  else if(marker.kind==='blue-drop'){c.moveTo(0,-13);c.bezierCurveTo(-3,-5,-9,0,-8,5);c.bezierCurveTo(-7,15,7,15,8,5);c.bezierCurveTo(9,0,3,-5,0,-13);c.fill()}
  else if(marker.kind==='question'){c.moveTo(-7,-7);c.bezierCurveTo(-7,-16,10,-16,8,-6);c.bezierCurveTo(7,-1,0,-2,0,4);c.stroke();c.fillRect(-1.6,8,3.2,3.2)}
  else if(marker.kind==='exclamation'){c.moveTo(0,-12);c.lineTo(0,4);c.stroke();c.fillRect(-1.6,8,3.2,3.2)}
  c.restore();
 }
 function drawNarrativePose(c,x,y,h,pose,t,reduced,ink){
  if(root.MongyuMobile)return root.MongyuMobile.narrative(c,x,y,h,pose,t,reduced,ink);
  const wave=reduced?1:(Math.sin(t*3)+1)/2,turn=pose==='turn-head'?(reduced?0.55:Math.sin(t*2.4)):0;
  c.save();c.translate(x,y);c.scale(h/100,h/100);c.strokeStyle='#f6f3e9';c.fillStyle='#f6f3e9';c.lineWidth=5;c.lineCap='round';
  c.fillRect(-7+turn*4,-100,14,16);c.fillRect(-8,-81,16,39);
  c.beginPath();c.moveTo(-4,-43);c.lineTo(-11,0);c.moveTo(4,-43);c.lineTo(12,0);
  const raised=pose==='raise-arms',spread=pose==='open-arms'?wave:0;
  for(const side of [-1,1]){c.moveTo(side*8,-76);c.lineTo(side*(raised?19:14+spread*9),raised?-88:-61-spread*9);c.lineTo(side*(raised?15:14+spread*18),raised?-105:-47-spread*20)}
  c.stroke();c.restore();
 }
 function drawSceneCast(){
  const canvas=$('restorationSceneCast'),A=root.MongyuSquareArt;if(!canvas||!A?.characters||!scene)return;
  const slot=scene.slot||selected,short=(host.viewport?.().height||800)<=480,height=short?200:320,baseline=height-30,bodyHeight=short?126:210,id=scene.intro?.cast||slot.characterId||'walker';
  if(canvas.height!==height)canvas.height=height;
  const c=canvas.getContext('2d');if(!c)return;
  const effect=scene.vignette?.effect||'',reduced=host.reduced?.(),phase=Math.min(1,(scene.elapsed-scene.beatAt)/.6);
  const lift=effect==='levitate'&&scene.index<2?(scene.index===0?(reduced?35:35*phase):70):0;
  canvas.dataset.character=id;canvas.dataset.reaction=reaction();canvas.dataset.effect=effect;canvas.setAttribute('aria-label',(C.characters.find(x=>x.id===id)?.name||'길')+' · '+(scene.vignette?.name||scene.intro?.name||'이야기'));
  const stage=scene.graph?G.stageForStep(slot,scene.index):sceneStage(slot,scene.index,scene.kind,reaction()),fx={p:A.palettes[(slot.chapter-1)%A.palettes.length],t:0,gain:0,ink:root.MongyuStagecraft?.inkFor(root.MongyuMobile.worldPalette((slot.chapter||1)-1)[0],root.MongyuMobile.look().body)||'#18121d'};
  canvas.dataset.actors=stage.actors.map(a=>a.id).join(',');canvas.dataset.beat=stage.beat;
  canvas.dataset.roles=stage.actors.map(a=>a.sourceRole).join(',');
  canvas.dataset.speakerLane=String(stage.speakerLane??'');canvas.dataset.markerCode=String(stage.markerCode??'');canvas.dataset.renderCode=String(stage.nativeRenderCode??'');
  canvas.dataset.stepKind=scene.graph?G.getStep(slot,scene.index).kind:'';canvas.dataset.activeSpeakers=stage.actors.filter(a=>a.activeSpeaker).map(a=>a.id).join(',');
  canvas.dataset.markerKinds=stage.actors.filter(a=>a.marker).map(a=>a.marker.kind).join(',');canvas.dataset.observedPoses=stage.actors.filter(a=>a.pose).map(a=>a.pose).join(',');
  canvas.dataset.artProvenance=scene.graph?'authored-vectors-native-shape-meaning':'';
  canvas.dataset.reactions=stage.actors.filter(a=>a.reaction).map(a=>a.id+':'+a.reaction).join(',');
  const actorName=a=>({'dog-only':'솔','elder-alone':'담','red-form':scene.graph?'붉은 입 모양에 대응한 자체 형상':'옛 연인을 나타내는 붉은 형상'}[a.id]||C.characters.find(v=>v.id===a.id)?.name||'길');
  canvas.setAttribute('aria-label',stage.actors.map(a=>actorName(a)+(a.activeSpeaker?' 말하는 중':a.reaction?' '+({'!':'놀람','?':'의문','…':'말없음'}[a.reaction]||a.reaction):'')).join(', ')+(stage.beat==='departure'?' — 홀로 남은 길':''));
  if(scene.graph){const labels=stage.actors.filter(a=>a.marker).map(a=>a.marker.label);if(labels.length)canvas.setAttribute('aria-label',canvas.getAttribute('aria-label')+' · '+labels.join(', '));}
  c.clearRect(0,0,720,height);c.save();
  if(root.MongyuMobile){c.strokeStyle='#dcc6a666';c.lineWidth=1.5;c.beginPath();c.ellipse(360,baseline+8,300,10,0,0,Math.PI*2);c.stroke()}else{c.fillStyle='#f6f3e9';for(let x=45;x<680;x+=18)c.fillRect(x,baseline+7,14,6);}
  for(const actor of stage.actors){
   const x=actor.x,dog=actor.id==='dog-only',red=actor.id==='red-form',h=red?bodyHeight*.18:dog?bodyHeight*.4:bodyHeight;
   c.save();if(actor.facing===-1||effect==='look-back'&&scene.index<2){c.translate(x*2,0);c.scale(-1,1)}
   if(actor.pose)drawNarrativePose(c,x,baseline,h,actor.pose,scene.elapsed,!!reduced,fx.ink);
   else if(actor.id==='elder-alone')sceneElder(c,x,baseline,bodyHeight,fx.ink);
   else if(red){c.fillStyle='#ed4776';for(const [dx,dy,w,h]of [[-20,-12,40,12],[-12,-20,24,8],[-4,-27,12,7]])c.fillRect(x+dx,baseline+dy,w,h)}
   else A.characters(c,{characterId:dog?'dog':actor.id,player:dog?null:{x,y:baseline-lift,tangent:{x:1,y:0},height:lift,bodyHeight:h},companion:dog?{x,y:baseline,tangent:{x:1,y:0},bodyHeight:h}:null},fx,true);
   c.restore();
   if(actor.marker)drawNativeMarker(c,actor.marker,x+42,Math.max(28,baseline-h-15),short?22:30,fx.ink);
   if(actor.activeSpeaker&&scene.graph){const by=Math.max(22,baseline-h-20);c.strokeStyle=fx.ink;c.lineWidth=2;c.beginPath();c.ellipse(x,by,30,15,0,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(x-6,by+14);c.lineTo(x-12,by+24);c.lineTo(x+4,by+15);c.stroke();c.fillStyle=fx.ink;for(const dx of [-10,0,10])c.fillRect(x+dx-2,by-2,4,4)}
   c.fillStyle=fx.ink;c.font='900 '+(short?26:38)+'px sans-serif';c.textAlign='center';c.fillText(actor.reaction,x+10,Math.max(28,baseline-h-(red?35:lift+12)));
  }
  if(effect==='ringtone'){c.font='700 24px sans-serif';c.textAlign='right';c.fillText(scene.index===2?'…':'따르릉',650,Math.max(40,baseline-bodyHeight/2));}
  c.restore();
 }
 function showScene(event){
  if(!scene)return;
  const slot=scene.slot||selected,isIntro=scene.kind==='intro',isInterlude=scene.kind==='interlude',isCall=scene.kind==='call';
  const storyTone=root.MongyuMobile?.worldPalette?.((slot.chapter||1)-1)?.[0];if(storyTone)$('restorationScene').style.setProperty?.('--story-world',storyTone);
  $('restorationScene').dataset.kind=scene.kind;$('restorationScene').dataset.effect=scene.vignette?.effect||'';
  $('restorationSceneLight').hidden=true;host.openDialog('restorationScene',event);
  text('restorationSceneLabel',String(slot.number).padStart(3,'0')+' · '+(scene.intro?.name||scene.vignette?.name||slot.title));
  const step=scene.graph?G.getStep(slot,scene.index):null,other=slot.number===100?'붉은 형상':({22:'솔',47:'담',69:'여울',87:'여울'}[slot.number]||'');
  const speaker=step&&['reflection','thought'].includes(step.kind)?'길 · 독백':step?.speakerLane===0?'길':step?.speakerLane===1?other:step?.speakerLane===2?'길 · '+other:'';
  $('restorationScene').dataset.presentation=step&&['dialogue','thought','reflection','hesitation'].includes(step.kind)?'speech':'narration';$('restorationScene').dataset.speaker=String(step?.speakerLane??'self');$('restorationScene').querySelector?.('.scene-balloon')?.style?.setProperty?.('--speaker-x',step?.speakerLane===0?'25%':step?.speakerLane===1?'75%':'50%');
  text('restorationSceneSpeaker',isCall?'꿈속 전화':speaker);$('restorationSceneSpeaker').hidden=!isCall&&!speaker;
  text('restorationScenePage',(scene.index+1)+' / '+scene.pages.length);
  const bossRule=slot.rule.type==='boss'?R.BOSS_RULES[R.BOSS_SLOTS.indexOf(slot.number)]:null;
  text('restorationSceneText',step?(step.alternateText!==undefined?'길: '+step.text+'\n'+other+': '+step.alternateText:step.text||step.action):scene.pages[scene.index]);
  $('restorationSceneText').style.whiteSpace='pre-line';$('restorationSceneText').dataset.kind=step?.kind||'';text('restorationSceneRule',isIntro?(bossRule?.instruction||slot.instruction):'');$('restorationSceneRule').hidden=!isIntro;
  text('restorationSceneNext',isIntro?'준비됐어 · 시작':isCall?'꿈속 전화 받기':scene.index===scene.pages.length-1?(launchAfterOpening?'첫 달리기 시작':'기억에 남기기'):'계속');
  $('restorationSceneNext').hidden=false;$('restorationSceneNext').disabled=isCall&&scene.rings<2;
  $('restorationSceneAction').hidden=!!scene.graph||scene.index===0||isInterlude||isIntro||isCall;text('restorationSceneAction','앞 장면');
  text('restorationSceneSkip',isIntro?'세계 모음':isCall?'받지 않고 달리기':'나중에 보기');drawSceneCast();
  host.audioEntry?.({kind:'scene',owner:scene,sceneKind:scene.kind,nativeState:scene.sequence?.nativeState,nativeRow:scene.sequence?.nativeRow},event);
  ($('restorationSceneNext').disabled?$('restorationSceneSkip'):$('restorationSceneNext')).focus({preventScroll:true});
 }
 function finishEvent(proof,gesture){
  const before=save.collected.length,shouldLaunch=launchAfterOpening;
  launchAfterOpening=false;
  persist(C.commitEvent(save,{slotId:selected.id,...proof}));
  award=save.pendingUnlock||save.collected.length>before?'기억을 찾았습니다.':'아직 조건이 완성되지 않았습니다.';
  scene=null;
  if(shouldLaunch&&(save.pendingUnlock||save.collected.length>before))return nextMemory(gesture);
  const next=summary().nextSlot;
  if(next)selected=C.getSlot(next);
  return open(gesture);
 }
 function nextScene(event){host.audioGesture?.(event);
  if(!scene)return false;
  if(scene.graph){scene.graph=G.advance(scene.graph);const proof=G.completionProof(scene.graph);if(proof)return finishEvent(proof,event);scene.index=scene.graph.cursor;showScene(event);return true}
  if(scene.kind==='intro')return launch(event,scene.config);
  if(scene.kind==='call'){
   if(scene.rings<2||!callContext)return false;
   callContext.beforeTime=callContext.run.time;callContext.answered=true;callContext.pending=true;scene=null;host.resumeRun?.(event);return true;
  }
  if(scene.kind==='interlude'){
   scene.beats++;scene.beatAt=scene.elapsed;
   if(scene.beats===3)return finishEvent({type:'interlude',beats:3,completed:true});
   scene.index=scene.beats;showScene(event);if(scene.vignette?.effect==='ringtone'&&scene.index<2)host.sceneCue?.('ringtone',event);return true;
  }
  if(scene.index<scene.pages.length-1){scene.index++;showScene(event);return true}
  return finishEvent({type:'story-read',pageCount:scene.pages.length});
 }
 function skipScene(event){host.audioGesture?.(event);launchAfterOpening=false;if(scene?.graph)scene.graph=G.cancel(scene.graph);if(scene?.kind==='intro'){scene=null;return open()}if(scene?.kind==='call'){scene=null;callContext.answered=false;callContext.pending=false;return host.resumeRun?.(event)}scene=null;return open()}
 function continueJourney(event){const s=summary(),last=C.getSlot(save.selected),slot=last&&!save.collected.includes(last.id)&&C.unlocked(save,last.id)?last:C.getSlot(s.nextSlot)||last||C.slots[0];return start(event,slot.id,{playAfterStory:true})}
 function aftermathSpec(run){
  if(run?.encounter?.kind==='sun')return {kind:'sun',release:2,duration:5,text:'이런 녀석도 있었군.',releaseText:'흰 햇살이 사라집니다.'};
  if(run?.encounter)return {kind:'encounter',release:2.4,duration:4.4,text:{alien:'멍. 이제 가자.',chain:'사슬이 풀렸다.',radial:'돌던 빛이 잠잠해졌다.',wave:'물결이 잦아들었다.',robot:'박자가 끊겼네.' ,orbit:'회오리가 잦아든 자리에 허전함이 남았다.',heart:'길은 자신이 줄곧 옛 연인의 안을 달렸음을 깨달았다.'}[run.encounter.kind],releaseText:run.encounter.kind==='alien'?'흰 사각이 사라집니다.':run.encounter.kind==='heart'?'노란 경계가 사라집니다.':'마지막 사각이 흩어집니다.'};
  if(run?.slot?.number===38&&run.boss?.ruleId==='contact-return')return {kind:'face',release:2.5,duration:4.2,text:'돌려받으세요.',releaseText:'흰 얼굴이 사각 조각으로 흩어집니다.'};
  if(run?.slot?.number===20&&run.boss?.ruleId==='leg-sweep')return {kind:'leg',release:1.25,duration:4,text:'발걸음이 한결 가벼워졌다.',releaseText:'커다란 몸이 사각 조각으로 흩어집니다.'};
  if(run?.slot?.number===8&&run.boss?.ruleId==='charge-release')return {kind:'sun',release:2,duration:5,text:'이런 녀석도 있었네.',releaseText:'빛의 조각들이 흩어집니다.'};
  if(run?.slot?.number===99&&run.boss?.ruleId==='boundary-strike')return {kind:'heart',release:.65,duration:3.6,text:'길은 자신이 줄곧 옛 연인의 안을 달렸음을 깨달았다.',releaseText:'남은 경계가 흩어집니다.'};
  return null;
 }
 function aftermathFor(run){if(!aftermath||aftermath.run!==run)return null;const spec=aftermathSpec(run);return {...spec,phase:aftermath.elapsed<spec.release?'release':'line',elapsed:aftermath.elapsed,paused:aftermath.paused}}
 function aftermathRenderFor(run){const spec=aftermathSpec(run);return aftermathFor(run)||(aftermathRuns.has(run)&&spec?{...spec,phase:'settled',elapsed:spec.duration,text:''}:null)}
 function cancelAftermath(){aftermath=null;$('restorationAftermath').hidden=true}
 function finishAftermath(){if(!aftermath)return false;cancelAftermath();host.refresh();return true}
 function suspendAftermath(){if(aftermath){aftermath.paused=true;aftermath.last=null}}
 function complete(run){
  if(!activeSlot||run.mode!=='restoration'||!run.result||completedRuns.has(run))return;completedRuns.add(run);
  if(callContext?.run===run){award=callContext.awarded?'전화를 받고 달리기로 돌아왔습니다.':'전화를 받지 못했습니다. 다시 시도할 수 있어요.';return}
  const result={...run.result};
  if(M){
   const key=result.freePlay?'freeplay':activeSlot.id;
   const previousBest=localRecord(key).bestScore;
   mastery=M.record(storage,key,result,sessionId+':'+(++completionSequence));
   newBest=mastery.ok&&result.score>previousBest?result.score-previousBest:0;
  }
  if(run.options.freePlay||result.freePlay){qualified=false;award='자유 달리기 기록';return}
  if(activeSlot.rule.type==='setting'&&!run.nativeRuntime){
   const proof=run.settingProof();delete result.settingCredit;
   result.settingValue=proof.settingValue;result.settingChanged=proof.settingChanged;result.settingExperienced=proof.settingExperienced;
   if(proof.settingCredit)result.settingCredit={...proof.settingCredit};
  }
  const before=save.collected.length,priorAttempt=save.attempt,next=C.commit(save,activeSlot.id,result);
  qualified=result.attempt===priorAttempt+1&&next.attempt===result.attempt&&C.validateResult(activeSlot.id,result)&&C.meets(activeSlot,result,next);persist(next);
  if(qualified&&run.nativeRuntime&&skinJournal&&!skinJournal.record(activeSlot.number,run.nativeFrame?.map?.t,true))storageOK=false;
  if(qualified&&aftermathSpec(run)&&run.state==='clear'&&run.boss?.hp===0){aftermathRuns.add(run);aftermath={run,elapsed:0,last:null,paused:false};}
  const objective=scoreProgress(activeSlot);award=save.pendingUnlock||save.collected.length>before?'기억을 찾았습니다.':qualified?'찾은 기억을 다시 만났습니다.':activeSlot.rule.type==='setting'?'설정 변경 조건을 확인하고 다시 바꿔 보세요.':objective.target?'이 기억 '+objective.current+' / '+objective.target+'점 · 다음 시도에 이어집니다.':'조건을 채우지 못했습니다. 같은 길에 다시 도전할 수 있어요.';
 }
 function onRunStatus(v){
  const active=v?.mode==='restoration',after=aftermathFor(host.activeRun());$('restorationAftermath').hidden=!after;
  if(after)text('restorationAftermathStatus',after.phase==='release'?after.releaseText:after.text);
  host.document.body.dataset.restoration=String(active);$('squareCollection').hidden=!active;$('pauseRestoration').hidden=!active;
  const isResult=['clear','fail'].includes(v.state);
  const nextSlot=save.pendingUnlock&&activeSlot?.number<100?activeSlot.number+1:summary().nextSlot;
  $('squareNext').hidden=!active||v.freePlay||!isResult||!qualified||!nextSlot;
  $('restorationCall').hidden=!active||v.state!=='play'||activeSlot?.rule.type!=='call'||callContext?.triggered||(activeRun?.time||0)<.2;
  $('restorationResultScore').hidden=!active;$('restorationResultWorld').hidden=!active;
  if(!active){$('restorationResultMastery').hidden=true;$('restorationResultNext').hidden=true;$('squareRestart').hidden=false;return}
  const objective=scoreProgress(activeSlot),isFree=!!v.freePlay;
  if(objective.target&&!isFree&&!v.nativeRuntime){const current=Math.min(objective.target,objective.current+(['play','pause'].includes(v.state)?v.score:0));text('squareHud',activeSlot.number+' · '+v.roomTitle+'\n이 기억 '+current+' / '+objective.target+'  '+('●'.repeat(Math.max(0,v.hearts))))}
  if(v.deathAnimation&&!v.deathAnimation.completed)text('hudCue','달리기를 마무리합니다.');else if(v.scoreFinalization&&v.qualified&&v.state==='play')text('hudCue','목표 달성 · 계속 달립니다.');
  if(isFree)text('squareHud','자유 달리기 · '+((v.wave||0)+1)+'번째 길\n'+v.score+'점  '+('●'.repeat(Math.max(0,v.hearts))));
  if(['clear','fail'].includes(v.state)){
   text('squareHeading',isFree?'이번 자유 달리기':qualified?'기억 획득':v.state==='clear'?'이번 달리기':'꿈이 접혔다');
   text('restorationResultWorld',isFree?'자유 달리기':activeSlot.number+' · '+v.roomTitle);
   text('restorationScoreValue',String(v.score));
   $('squareRetry').hidden=false;$('squareRestart').hidden=true;
   text('squareRetry','다시 달리기');
   text('squareNext','다음 기억으로');
   const primary=!$('squareNext').hidden?'squareNext':qualified?'squareCollection':'squareRetry';
   $('squareResult').dataset.primaryAction=primary;
   for(const id of ['squareNext','squareCollection','squareRetry','squareRestart','squareHome'])$(id).dataset.primary=String(id===primary);
   const detail=['기억을 찾았습니다.','찾은 기억을 다시 만났습니다.','자유 달리기 기록'].includes(award)?'':award;
   const reason=qualified?'':v.state==='fail'&&v.hearts===0?'남은 기회를 모두 썼어요.':v.result?.reason;
   text('restorationRecordBadge',newBest?'최고 기록 +'+newBest+'점':'');
   $('restorationRecordBadge').hidden=!newBest;
   text('squareSummary',[reason,detail,!storageOK||readOnly?'진행은 이번 실행에만 남습니다.':''].filter(Boolean).join('\n'));
   text('restorationResultMastery',recordText(isFree?'freeplay':activeSlot.id)+(!mastery.ok?'\n기록을 저장할 수 없어 이번 실행에만 남습니다.':''));
   $('restorationResultMastery').hidden=!$('restorationResultMastery').textContent;
   const next=C.getSlot(nextSlot);text('restorationResultNext',qualified&&next?'다음 · '+next.number+' '+next.title:'');$('restorationResultNext').hidden=!qualified||!next;
  }
 }
 function openJournal(event){
  host.openDialog('storyJournal',event);journalButtons.length=0;const list=$('storyJournalList');list.replaceChildren();
  for(const sequence of G.sequences){const slot=C.getSlot(sequence.slot),collected=save.collected.includes(slot.id),unlocked=collected||C.unlocked(save,slot.id);const b=host.document.createElement('button');b.id='story-page-'+slot.number;b.setAttribute('id',b.id);b.disabled=!unlocked;b.textContent=String(slot.number).padStart(3,'0')+' · '+(unlocked?slot.title:'아직 만나지 못한 이야기');b.onclick=e=>start(e,slot.id);list.appendChild(b);if(unlocked)journalButtons.push(b.id);}
  $('storyJournalClose').focus({preventScroll:true});
 }
 function syncTitle(title){$('restorationOpen').hidden=!title;if($('storyOpen'))$('storyOpen').hidden=!title;$('modeRestoration').hidden=false;$('modeSquare').hidden=false;if(title){text('titleContinue',summary().collected?'꿈 이어가기':'꿈속으로');text('restorationOpen','꿈 지도  ·  '+summary().collected+' / 100')}}
 function retry(event){if(activeRun?.deathAnimation&&!activeRun.deathAnimation.completed)return false;
  if(!activeSlot)return continueJourney(event);
  selected=activeSlot;settingValue=activeRun?.options.settingValue??activeConfig?.settingValue;settingTouched=!!activeConfig?.settingTouched;
  const config={...activeConfig,period:activeRun?.options.period||activeConfig?.period,characterId:activeRun?.options.characterId||activeConfig?.characterId,settingValue,settingTouched};
  if(config.freePlay){qualified=false;award='';return launch(event,config)}return start(event,activeSlot.id,{retry:true,config});
 }
 function startFree(event){if(!summary().finished)return false;selected=C.slots.find(slot=>slot.physical&&slot.rule.type==='tutorial')||C.slots.find(slot=>slot.physical);activeSlot=selected;award='';return launch(event,{...configFor(selected),freePlay:true,seed:Date.now()>>>0})}
 for(const slot of C.slots){const b=host.document.createElement('button');b.id='restoration-slot-'+slot.number;b.setAttribute('id',b.id);b.numberPlate=host.document.createElement('span');b.numberPlate.className='world-number';const kind=host.document.createElement('span');kind.className='world-kind';kind.textContent=ticketKind(slot);b.statePlate=host.document.createElement('span');b.statePlate.className='world-state';b.markPlate=host.document.createElement('span');b.markPlate.className='world-mark';b.markPlate.setAttribute('aria-hidden','true');b.skinPlate=host.document.createElement('canvas');b.skinPlate.width=b.skinPlate.height=32;b.skinPlate.className='map-skin-preview';b.skinPlate.setAttribute('aria-hidden','true');b.skinPlate.hidden=true;b.append(b.skinPlate,b.numberPlate,kind,b.statePlate,b.markPlate);b.onclick=()=>select(slot.id);$('restorationGrid').appendChild(b);buttons.push(b)}
 $('restorationGrid').addEventListener('keydown',event=>{const n=Number(event.target?.id?.replace('restoration-slot-',''));if(!n)return;const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-5,ArrowDown:5,PageUp:-10,PageDown:10}[event.code],target=event.code==='Home'?1:event.code==='End'?100:step?n+step:null;if(target!==null){event.preventDefault();select(Math.max(1,Math.min(100,target)),true)}});
 $('restorationPagePrev').onclick=()=>select(Math.max(1,selected.number-10));$('restorationPageNext').onclick=()=>select(Math.min(100,selected.number+10));$('restorationRouteNext').onclick=()=>summary().nextSlot&&select(summary().nextSlot,true);
 $('restorationSetting').onclick=e=>chooseSetting(selected.rule.setting==='speed'?'fast':true,e);$('restorationSettingOff').onclick=e=>chooseSetting(selected.rule.setting==='speed'?'slow':false,e);
 if($('storyOpen'))$('storyOpen').onclick=openJournal;if($('storyJournalClose'))$('storyJournalClose').onclick=host.closeDialog;
 $('restorationOpen').onclick=open;$('restorationClose').onclick=host.closeDialog;$('restorationStart').onclick=e=>start(e);$('restorationSceneNext').onclick=nextScene;$('restorationSceneSkip').onclick=skipScene;
 $('restorationSceneAction').onclick=()=>{if(scene&&!scene.graph&&scene.index>0){scene.index--;showScene()}};
 $('modeRestoration').onclick=open;$('modeSquare').onclick=host.startLegacy;$('pauseRestoration').onclick=open;$('squareCollection').onclick=open;$('squareNext').onclick=nextMemory;$('restorationFree').onclick=startFree;
 function beginCall(event){if(!callContext||callContext.triggered||callContext.run.state!=='play'||callContext.run.time<.2||!callContext.run.localCall())return false;callContext.triggered=true;scene={kind:'call',slot:activeSlot,index:0,pages:['길 한가운데서 전화가 울립니다.'],elapsed:0,rings:0,beats:0,beatAt:0};sceneLast=null;showScene(event);return true}
 $('restorationCall').onclick=beginCall;
 $('restorationAftermathNext').onclick=finishAftermath;
 function tick(now){
  if(aftermath){
   if(host.activeRun()!==aftermath.run)cancelAftermath();
   else if(aftermath.paused||host.document.hidden||host.dialog())aftermath.last=null;
   else if(aftermath.last===null)aftermath.last=now;
   else{const before=aftermath.elapsed,spec=aftermathSpec(aftermath.run);aftermath.elapsed+=Math.min(1,Math.max(0,(now-aftermath.last)/1000));aftermath.last=now;if(aftermath.elapsed>=spec.duration)finishAftermath();else if(before<spec.release&&aftermath.elapsed>=spec.release)host.refresh()}
  }
  if(callContext?.pending&&host.activeRun()===callContext.run&&!host.dialog()&&!host.document.hidden&&callContext.run.state==='play'&&callContext.run.time-callContext.beforeTime>=.2){
   const before=save.collected.length;persist(C.commitEvent(save,{slotId:activeSlot.id,type:'local-call',phase:'answered',rings:2,simulated:true,period:(callContext.run.sampleClock(),callContext.run.period),callContext:{interrupted:true,resumed:true,beforeTime:callContext.beforeTime,afterTime:callContext.run.time}}));
   callContext.pending=false;callContext.awarded=save.pendingUnlock?.slotId===activeSlot.id||save.collected.length>before||save.collected.includes(activeSlot.id);qualified=callContext.awarded;award=qualified?'전화를 받고 달리기로 돌아왔습니다.':'';
  }
  if(callContext&&!callContext.triggered&&callContext.run.state==='play'&&callContext.run.time>=3&&!host.dialog())beginCall();
  if(!scene||host.dialog()!=='restorationScene'||host.document.hidden){sceneLast=null;return}
  if(sceneLast===null){sceneLast=now;return}scene.elapsed+=Math.min(.1,Math.max(0,(now-sceneLast)/1000));sceneLast=now;
  if(root.MongyuMobile&&!host.reduced?.()&&scene.elapsed-(scene.drawAt||0)>=.04){scene.drawAt=scene.elapsed;drawSceneCast()}
  if(scene.kind==='interlude'){if(!host.reduced?.()&&scene.vignette?.effect==='levitate'&&scene.elapsed-(scene.drawAt||0)>=.04){scene.drawAt=scene.elapsed;drawSceneCast()}}
  else if($('restorationSceneCast').height!==((host.viewport?.().height||800)<=480?200:320))drawSceneCast();
  if(scene.kind==='call'){const rings=Math.min(2,Math.floor(scene.elapsed/.9));if(rings!==scene.rings){scene.rings=rings;text('restorationSceneText',rings===2?'두 번의 벨. 받을까요?':'벨이 한 번 울렸습니다.');text('restorationScenePage',rings+' / 2');$('restorationSceneNext').disabled=rings<2}}
 }
 render();
 return {settingChanged:(run,receipt)=>{if(run!==activeRun||!receipt.accepted||receipt.name!==activeSlot?.rule.setting)return false;if(activeConfig){activeConfig.settingValue=receipt.value;activeConfig.settingTouched=true;}if(selected.id===activeSlot.id){settingValue=receipt.value;settingTouched=true;render()}return true},tick,open,start,retry,continueJourney,complete,onRunStatus,syncTitle,select,render,sceneNext:nextScene,aftermathFor,aftermathRenderFor,finishAftermath,cancelAftermath,suspendAftermath,
  view:()=>({aftermath:aftermathFor(host.activeRun()),save:C.normalizeSave(save),status:summary(),selected:selected.id,page:page(),qualified,activeSlot:activeSlot?.id,storageOK,readOnly,scene:scene?{index:scene.index,pages:scene.pages.length,kind:scene.kind,effect:scene.vignette?.effect,nativeState:scene.sequence?.nativeState,nativeRow:scene.sequence?.nativeRow,terminalCursor:scene.sequence?.terminalCursor,sourceStringIds:scene.graph?G.getStep(selected,scene.index)?.sourceStringIds:undefined,stepKind:scene.graph?G.getStep(selected,scene.index)?.kind:undefined}:null,free,settingTouched,settingValue,mastery:localRecord(free?'freeplay':selected.id),call:callContext?{triggered:callContext.triggered,pending:callContext.pending,awarded:callContext.awarded}:null}),
  dialogControls:{get storyJournal(){return ['storyJournalClose',...journalButtons]},get restorationCollection(){return ['restorationClose','restorationPagePrev','restorationPageNext','restorationRouteNext',buttons[selected.number-1].id,...($('restorationClock').hidden?[]:['restorationPeriod']),'restorationSetting','restorationSettingOff','restorationStart','restorationFree']},restorationScene:['restorationSceneAction','restorationSceneNext','restorationSceneSkip']}};
}
root.MongyuRestorationUI={mount,VIGNETTES,INTRO,sceneStage};if(typeof module!=='undefined')module.exports=root.MongyuRestorationUI;
})(globalThis);
