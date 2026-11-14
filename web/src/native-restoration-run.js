/* R79 run bridge. Functional candidate kernels, own art, isolated progress.
 * Bootstrap seed/clock/UI scheduling are authored. No original media or disk I/O.
 */
(function(root){'use strict';
const clone=x=>structuredClone(x),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const INT=(x,label)=>{if(!Number.isInteger(x)||x< -2147483648||x>2147483647)throw new RangeError(label+' requires int32');return x;};
// Numeric control metadata only: CON_STAGE categories and GETSKINTABLE int pairs.
// Original candidate JAR SHA aeadd87840c7b3f1f06548489406dbc0bf833b41de9cdfa3eaf741e832a213c2.
// r.r = inclusive same-category occurrence -1 (2aa72..2aaf0), free index64(2aa3c).
const CATEGORIES=[1,0,0,0,1,0,0,3,0,0,0,0,1,0,0,1,0,0,0,3,0,2,0,1,0,0,0,4,0,0,3,0,0,1,0,0,0,3,1,0,4,0,0,0,3,0,2,0,1,0,0,1,0,0,1,4,0,3,0,0,0,1,0,0,4,3,0,0,2,0,0,0,1,0,0,0,3,0,0,1,4,0,0,1,0,0,2,0,0,3,0,1,0,0,0,1,0,0,3,1,0];
const CONDITIONS=[[25,1],[10,300],[0,600],[28,1],[10,400],[30,1],[10,500],[14,3],[10,600],[0,1500],[10,700],[22,1],[10,800],[0,3000],[10,900],[21,1],[17,250],[11,1],[10,1000],[0,5000],[10,1000],[20,1],[18,4],[17,300],[29,1],[11,1],[0,7000],[10,1000],[31,1],[10,1000],[0,8000],[23,1],[18,4],[0,10000],[17,300],[15,3],[10,1100],[32,1],[0,12000],[10,1100],[11,1],[0,13000],[18,5],[10,1100],[16,3],[17,500],[10,1100],[35,1],[0,15000],[18,5],[34,1],[12,1],[10,1200],[33,1],[10,1200],[17,500],[10,1200],[24,1],[17,500],[0,20000],[10,1500],[13,2],[26,1],[27,1],[-1,-1]];
const STORAGE_PREFIX='mongyu.r79.isolated.',PREVIOUS_STORAGE_PREFIX='mongyu.r78.isolated.',R77_STORAGE_PREFIX='mongyu.r77.isolated.';
// Copy bytes before parsing so malformed/future saves remain read-only and recoverable.
// Existing R79 values always win. Never write R78, R77 or legacy keys. Failed storage
// operations propagate to the caller's read-only path instead of losing progress.
function isolatedStorage(storage){return {getItem(key){
 const target=STORAGE_PREFIX+key,own=storage.getItem(target);
 if(own!==null&&own!==undefined)return own;
 for(const source of [PREVIOUS_STORAGE_PREFIX+key,R77_STORAGE_PREFIX+key,key]){
  const raw=storage.getItem(source);if(raw===null||raw===undefined)continue;
  storage.setItem(target,raw);
  if(storage.getItem(target)!==raw)throw new Error('R79 migration verification failed');
  return raw;
 }
 return null;
},setItem(key,value){storage.setItem(STORAGE_PREFIX+key,value);}};}
// Receipt VERSION stays r77-native-run-v1: R79 fixes the adapter, not its contract.
const SOURCE='KTF-candidate-aeadd87840c7',VERSION='r77-native-run-v1';
function slotMetadata(number,{freePlay=false}={}){
 const slot=freePlay?100:INT(number,'one-based slot')-1;if(slot<0||slot>100)throw new RangeError('slot outside1..101');
 const category=CATEGORIES[slot],conditionIndex=slot===100?64:CATEGORIES.slice(0,slot+1).filter(x=>x===category).length-1;
 const [conditionType,conditionTarget]=CONDITIONS[conditionIndex];let modeQ=CATEGORIES.slice(0,slot+1).filter(x=>x===2).length;if(modeQ>3)modeQ=0;
 return{slot,category,stageClass:category,conditionIndex,conditionType,conditionTarget,ordinal:category===0?conditionIndex:null,bossId:category===3?conditionIndex:null,tutorial:slot===1,modeQ,source:SOURCE,supported:category===0||category===3,reason:category===0||category===3?null:'native-category-'+category+'-uses-scene-entry'};
}
const CHARACTER=['walker','dog','elder','woman'],SPEED_LEVEL={slow:1,default:2,fast:3},PERIOD_HOUR={am:9,pm:18,noon:12,midnight:0};
class NativeRestorationRun{
 constructor(options={}){
  this.options={...options};this.kernels=options.kernels||root.MongyuNativeKernels;if(!this.kernels)throw new Error('MongyuNativeKernels required');
  if(!options.slot||!Number.isInteger(options.slot.number))throw new TypeError('catalog slot required');
  this.slot=options.slot;this.mode='restoration';this.nativeRuntime=true;this.freePlay=options.freePlay===true;this.practice=options.practice===true||this.freePlay;this.attempt=options.attempt||1;this.seed=options.seed??7;this.viewport={width:360,height:640,...options.viewport};
  this.settings={speed:'default',sound:true,vibration:true,...options.settings};if(options.setting&&options.settingValue!==undefined)this.settings[options.setting]=options.settingValue;
  this.settingChanges=[];this.settingCredit=null;this.events=[];this.nativeEffects=[];this.persistEffects=[];this.reset();this.state='title';
 }
 reset(){
  const K=this.kernels;this.metadata=slotMetadata(this.slot.number,{freePlay:this.freePlay});this.time=0;this.runTime=0;this.updates=0;this.remainder=0;this.pendingKey=-9999;this.held=false;this.state='title';this.supported=true;this.reason=null;this.result=null;this.events=[];this.nativeEffects=[];this.persistEffects=[];this.lastResult=null;this.lastTrace=[];this.mapChanges=0;this.hits=0;this.jumps=0;this.kicks=0;this.inputCount=0;this.clockSample=null;this.settingChanges=[];this.settingCredit=null;this.feedback=null;
  this.stepLevel=INT(this.options.speedLevel??SPEED_LEVEL[this.settings.speed]??2,'speed level');if(this.stepLevel<1||this.stepLevel>3)throw new RangeError('speed level1..3');this.stepMs=55+20*(4-this.stepLevel);
  const m=this.metadata,progress=this.options.nativeProgress||{},record=progress.records?.[m.conditionIndex];
  this.characterId=CHARACTER[m.modeQ];this.familyIndex=m.category===3?m.bossId:Math.floor((this.slot.number-1)/10);
  this.room={id:this.slot.id,index:this.familyIndex,familyIndex:this.familyIndex,title:this.slot.title||'',width:448,height:448,radius:0};
  const config={seedA:this.options.seedA??this.seed,seedB:this.options.seedB??11,slot:m.slot,frontier:INT(this.options.frontier??(this.freePlay?100:this.slot.number),'frontier'),ordinal:m.ordinal??0,conditionType:m.conditionType,conditionTarget:m.conditionTarget,actorResourceQ:m.modeQ,recordScore:INT(record?.score??this.options.recordScore??0,'best score')};
  this.actorProviders={...K.Fixture.ownActorProviders(),clockHour:()=>this.sampleClock().hour,...this.options.actorProviders};
  this.driverOptions={actorProviders:this.actorProviders,maskCell:K.Mask.maskCell,...this.options.driverOptions};
  this.nativeFrame=this.options.nativeFrame?clone(this.options.nativeFrame):K.Fixture.createOwnFrame(config);
  if(!this.options.nativeFrame){
   Object.assign(this.nativeFrame.r,{stageClass:m.stageClass,conditionIndex:m.conditionIndex,tutorial:m.tutorial,modeQ:m.modeQ,credit:INT(m.conditionType===0?(this.options.priorCredit??progress.credit??0):0,'prior credit')});
   this.nativeFrame.map.t=m.slot===100?0:m.slot;this.nativeFrame.r.frontier=config.frontier;
  }
  this.initialPending=this.nativeFrame.r.pending;this.initialCredit=this.nativeFrame.r.credit;this.initialLives=this.nativeFrame.u.lives;
  if(!m.supported&&!this.options.nativeFrame){this.block(m.reason);return false;}
  if(this.options.nativeFrame){this.initializationProvenance='explicit caller frame; '+(this.options.frameProvenance||'caller provenance unspecified');this.syncFields();return true;}
  this.initializationProvenance='authored fixture bootstrap; recovered fresh-attempt scalars, native collection category/index and stage setup; not full native boot';
  try{
   if(!K.Entry)throw new Error('native fresh-attempt entry required');
   const entry=K.Entry.initializeAttemptCounters(this.nativeFrame,{previousUiState:119});this.nativeFrame=entry.state;this.consumeEffects(entry);
   const p=K.MapProviders.createProviders({maskCell:K.Mask.maskCell});this.driverOptions.stageProviders=p;
   if(m.category===0&&m.slot!==100&&p.ordinarySlot(m.ordinal)!==m.slot)throw new Error('ordinary metadata mapping mismatch');
   const r=K.MapPorts.setupStage(this.nativeFrame,this.driverOptions);this.nativeFrame=r.state;this.consumeEffects(r);this.lastResult=r;
   if(!r.supported){this.block(r.reason);return false;}
  }catch(error){this.block('native-setup:'+error.message);return false;}
  this.syncFields();return true;
 }
 block(reason){this.supported=false;this.reason=String(reason||'unsupported-native-continuation');this.state='pause';this.cancelInput();this.remainder=0;this.feedback={kind:'unsupported',text:'이 진행 경로는 아직 연결되지 않았습니다.',reason:this.reason};this.syncFields();if(!this.events.includes('pause'))this.events.push('pause');return false;}
 start(){const ok=this.reset();if(!ok){this.state='pause';return false;}this.state='play';this.events.push('start');return true;}
 title(){this.cancelInput();this.state='title';this.events=[];return true;}
 pause(){if(!['play','transition'].includes(this.state))return false;this.state='pause';this.cancelInput();this.remainder=0;this.events.push('pause');return true;}
 resume(){if(this.state!=='pause'||!this.supported||this.result)return false;this.state='play';this.cancelInput();this.remainder=0;this.events.push('resume');return true;}
 retry(){this.attempt++;return this.start();}
 setViewport(width,height){if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return false;this.viewport={width,height};return true;}
 cancelInput(){this.held=false;this.pendingKey=-9999;if(this.nativeFrame)this.nativeFrame.u.buffer=0;}
 inputDown(){if(this.held||this.state!=='play'||!this.supported)return false;this.held=true;return this.action();}
 inputUp(){const held=this.held;this.held=false;return held;}
 action(){if(this.state!=='play'||!this.supported||this.result)return false;this.pendingKey=53;this.inputCount++;return true;}
 sampleClock(){const simulation=Object.hasOwn(PERIOD_HOUR,this.options.period),date=simulation?null:(this.options.clockNow?this.options.clockNow():new Date()),hour=simulation?PERIOD_HOUR[this.options.period]:date.getHours();INT(hour,'hour');if(hour<0||hour>23)throw new RangeError('hour0..23');this.period=hour===0?'midnight':hour===12?'noon':hour<12?'am':'pm';return this.clockSample={hour,source:simulation?'simulation':'device',atTime:this.time};}
 tick(dt){
  if(this.state!=='play'||!this.supported||!Number.isFinite(dt)||dt<=0)return 0;
  // Authored browser clock uses recovered nominal H budget; it is not handset FPS.
  if(dt>.25){this.pause();return 0;}this.remainder+=dt*1000;let n=0;
  while(this.remainder+1e-8>=this.stepMs&&this.state==='play'){
   this.remainder-=this.stepMs;const previous=this.nativeFrame,key=this.pendingKey;this.pendingKey=-9999;let r;
   try{r=this.kernels.Driver.advance(previous,{...this.driverOptions,key});}catch(error){this.block('native-frame:'+error.message);break;}
   this.nativeFrame=r.state;this.lastResult=r;this.lastTrace=clone(r.trace||[]);this.consumeEffects(r);this.syncFields();
   if(!r.supported||!r.integerUpdateComplete){this.block(r.reason||'native-integer-frame-incomplete');break;}
   n++;this.updates++;this.time+=this.stepMs/1000;this.runTime=this.time;
   if(this.nativeFrame.u.lives<previous.u.lives){this.hits+=previous.u.lives-this.nativeFrame.u.lives;this.events.push('hit');}
   if(this.nativeFrame.game.actor.actorState!==previous.game.actor.actorState){const a=this.nativeFrame.game.actor.actorState;if([3,5,7].includes(a)){this.jumps++;this.events.push('jump');}else if([1,2,9,11].includes(a)){this.kicks++;this.events.push('kick');}}
   if((r.trace||[]).some(t=>t.operation==='select-stage')){this.mapChanges++;this.events.push('morph');}
   if(this.nativeFrame.r.goalFlag&&!previous.r.goalFlag)this.events.push('goal-qualified');
   const next=this.nativeFrame.pendingUiState;
   if(next!==-1){if(next===87){this.nativeFrame.pendingUiState=-1;this.pause();}else if([155,156,158].includes(next))this.finishNative(next,r);else this.block('native-ui-entry-'+next+'-not-connected');}
  }
  this.syncFields();return n;
 }
 update(dt){return this.tick(dt);}
 consumeEffects(r){for(const e of r.effects||[]){this.nativeEffects.push(clone(e));if(e.kind==='persist-progress')this.persistEffects.push(clone(e));}if(this.nativeEffects.length>256)this.nativeEffects.splice(0,this.nativeEffects.length-256);}
 finishNative(next,r){
  const requested=(r.effects||[]).some(e=>e.kind==='ui-state-request'&&e.next===next),earned=next===155&&this.nativeFrame.r.pending>this.initialPending;
  if(!requested||next===155&&!earned)return this.block('unproven-native-result-entry-'+next);
  this.cancelInput();this.state=earned?'clear':'fail';this.reason=null;
  const terminalTrace=(r.trace||[]).filter(t=>t.phase==='fatal-return'||t.phase==='request-ui'||t.phase==='death-target'||t.phase==='persist-progress');
  this.result={runVersion:77,nativeRuntime:true,schema:VERSION,mode:this.mode,slotId:this.slot.id,ruleId:this.slot.ruleId,state:this.state,completed:true,practice:this.practice,freePlay:this.freePlay,attempt:this.attempt,score:this.score,time:this.time,initialLives:this.initialLives,livesRemaining:this.hearts,hits:this.hits,jumps:this.jumps,kicks:this.kicks,mapChanges:this.mapChanges,characterId:this.characterId,termination:this.hearts<=0?'collision':'native-ui',reason:earned?'조건을 채웠습니다. 다음 화면에서 기억을 확인하세요.':'이번 달리기를 마쳤습니다.',nativeProof:{schema:VERSION,source:SOURCE,nativeUiState:next,earned,pendingReveal:earned,frontierAdvanced:false,condition:clone(this.metadata),initialPending:this.initialPending,frontier:this.nativeFrame.r.frontier,priorCredit:this.initialCredit,finalCredit:this.nativeFrame.r.credit,recordScore:this.nativeFrame.r.recordScore,pending:this.nativeFrame.r.pending,integerUpdates:this.updates,finalScore:this.score,finalLives:this.hearts,terminalTrace,persist:clone(this.persistEffects),bootstrap:this.initializationProvenance,scheduling:'authored-browser-clock-using-nominal-native-H',fullOriginalEquivalence:false}};
  this.events.push(this.state);return true;
 }
 syncFields(){const s=this.nativeFrame;if(!s)return;this.score=s.u.score;this.hearts=s.u.lives;this.scoreFinalization=[0,10].includes(s.r.conditionType);this.goalQualified=!!s.r.goalFlag;this.boss=s.boss?{hp:s.boss.K,maxHp:s.boss.aK,phase:s.boss.Y,recordIndex:s.boss.J,native:true}:null;this.bossDamage=this.boss?this.boss.maxHp-this.boss.hp:0;this.deathAnimation=s.u.lives===0&&[13,16].includes(s.game.actor.actorState)?{actorState:s.game.actor.actorState,counter:s.game.actor.frame,elapsed:0,completed:!!this.result}:null;}
 setSetting(name,value){
  if(!['play','pause'].includes(this.state)||!this.supported)return{accepted:false,changed:false,reason:'inactive'};
  if(name==='speed'?!Object.hasOwn(SPEED_LEVEL,value):!['sound','vibration'].includes(name)||typeof value!=='boolean')return{accepted:false,changed:false,reason:'invalid-setting'};
  if(this.settings[name]===value)return{accepted:false,changed:false,reason:'unchanged'};
  const receipt={accepted:true,changed:true,name,from:this.settings[name],value,time:this.time,nativeCredit:false};this.settings[name]=value;
  // Browser controls represent an authored phase1/Q0 confirm event, not the handset menu.
  if(this.kernels.SettingsCredit){const context={phase:1,menuPhase:0,key:-5,selection:{sound:0,vibration:1,speed:2}[name],hour:this.sampleClock().hour},credited=this.kernels.SettingsCredit.applySettingCredit(this.nativeFrame,context);if(credited.supported){this.nativeFrame=credited.state;this.consumeEffects(credited);receipt.nativeCredit=credited.handled===true;receipt.menuMapping='authored-browser-setting-confirm';receipt.nativeContext=context;this.syncFields();}}
  this.settingChanges.push(receipt);
  if(name==='speed'){this.stepLevel=SPEED_LEVEL[value];this.stepMs=55+20*(4-this.stepLevel);this.remainder=0;}this.events.push('setting-change');return clone(receipt);
 }
 settingProof(){return{settings:{...this.settings},setting:this.options.setting||this.slot.rule?.setting,settingValue:this.settings[this.options.setting||this.slot.rule?.setting],settingChanged:this.settingChanges.length>0,settingExperienced:false,settingChanges:clone(this.settingChanges),settingCredit:null,nativeSettingCreditSupported:!!this.kernels.SettingsCredit};}
 localCall(){return false;}
 progressSnapshot(){const s=this.nativeFrame,r=s.r;return{schema:VERSION,source:SOURCE,slot:r.slot,slotId:this.slot.id,attempt:this.attempt,frontier:r.frontier,pending:r.pending,credit:r.credit,record:{index:r.conditionIndex,score:r.recordScore},score:s.u.score,lives:s.u.lives,earned:!!this.result?.nativeProof.earned,pendingReveal:!!this.result?.nativeProof.pendingReveal,frontierAdvanced:false,terminal:this.result?clone(this.result.nativeProof):null,persist:clone(this.persistEffects)};}
 exportNativeCheckpoint(){return{schema:VERSION,frame:clone(this.nativeFrame),updates:this.updates,time:this.time,seed:this.seed,stepLevel:this.stepLevel,state:this.state,source:SOURCE};}
 drainEvents(){return this.events.splice(0);}
 drainNativeEffects(){return this.nativeEffects.splice(0);}
 status(){const s=this.nativeFrame,confirmBoss=this.supported&&this.state==='play'&&this.metadata.category===3&&s.u.l===4,confirmInstruction='보스를 통과했습니다. 탭하여 결과를 확인하세요.',target=s.r.conditionTarget,value=s.r.conditionType===0?s.u.score+s.r.credit:s.r.conditionType===10?s.u.score:s.r.credit,progress=target>0&&this.metadata.category===0?clamp(value/target,0,1):this.boss&&this.boss.maxHp>0?clamp(this.bossDamage/this.boss.maxHp,0,1):0;return{mode:this.mode,state:this.state,nativeRuntime:true,supported:this.supported,reason:this.reason,slotId:this.slot.id,ruleId:this.slot.ruleId,freePlay:this.freePlay,time:this.time,score:this.score,best:s.r.recordScore,hearts:this.hearts,progress,roomProgress:progress,roomIndex:0,roomCount:1,roomTitle:this.slot.title||'',familyIndex:this.familyIndex,characterId:this.characterId,feedback:this.feedback,instruction:confirmBoss?confirmInstruction:this.supported?(this.slot.instruction||''):'이 진행 경로는 아직 연결되지 않았습니다.',objective:this.slot.instruction||'',actionLabel:confirmBoss?'확인':'뛰기 · 공중에서 차기',result:this.result?clone(this.result):null,qualified:this.goalQualified,scoreFinalization:this.scoreFinalization,scoreObjective:{target,current:value,qualified:this.goalQualified},deathAnimation:this.deathAnimation,boss:this.boss?{...this.boss}:null,mapChanges:this.mapChanges,held:this.held,cue:confirmBoss?{id:'native-boss-confirm',phase:'confirm',text:confirmInstruction}:null,combo:0,bestCombo:0,passed:0,retries:Math.max(0,this.attempt-1),mastery:{clean:0,bestChain:0,actions:this.inputCount,hits:this.hits},native:{awaitingBossConfirmation:confirmBoss,updates:this.updates,uiState:s.uiState,pendingUiState:s.pendingUiState,condition:clone(this.metadata),countdown:s.u.s,stepMs:this.stepMs,bootstrap:this.initializationProvenance,barrier:s.frameBarrier||null},...this.settingProof()};}
 geometry(){return nativeGeometry(this.nativeFrame,this,this.kernels);}
}
function nativeGeometry(s,run,K){
 const A=K.Assembly,pool=s.game.pool,paths=[],masked=s.game.stage.behaviorCode===3,nativeMaskCells=masked?[]:null;
 // The q3 collision mask lives in fixed native world coordinates, independent of the current actor face.
 if(masked){const occupied=K.Mask.bindMask(s.map.ae);for(let y=0;y<24;y++)for(let x=0;x<24;x++)if(occupied(x,y))nativeMaskCells.push({column:x,row:y,x:x*16,y:y*16,width:16,height:16});}
 for(let side=0;side<pool.objects.length;side++){const item=pool.objects[side];let points=[];const flush=()=>{if(points.length)paths.push({side,current:side===pool.currentIndex,points});points=[];};for(let col=0;col<item.geometry.activeLength;col++){const p=A.projectSurfacePoint(pool,side,col);if(p.sentinelValue!==null){flush();continue;}points.push({x:p.x,y:p.y});}flush();}
 const cur=pool.objects[pool.currentIndex],actor=s.game.actor,project=(x,y)=>A.rotatePoint((cur.scalarE+x)|0,(cur.scalarF-y)|0,cur.geometry.orientation),point=project(cur.position,actor.height),origin=A.rotatePoint(0,0,cur.geometry.orientation),tip=A.rotatePoint(pool.direction===0?1:-1,0,cur.geometry.orientation),tangent={x:tip.x-origin.x,y:tip.y-origin.y};
 const col=clamp(Math.trunc(cur.position/16),0,cur.geometry.activeLength-1),height=Math.max(0,actor.height-cur.geometry.columns.c[col]),player={...point,baseX:point.x,baseY:point.y,tangent,inward:{x:tangent.y,y:-tangent.x},face:cur.geometry.orientation,height,bodyHeight:42.5,poseClock:actor.frame/8,jumpProgress:actor.frame/Math.max(1,K.Trajectories.frameCount(actor.actorState)),kick:[1,2,9,11].includes(actor.actorState)?.5:0,impact:[13,16].includes(actor.actorState)?.7:0,nativeState:actor.actorState,nativeFrame:actor.frame};
 const projectiles=s.entities.filter(e=>e&&e.a!==0).map((e,index)=>({id:'native-entity-'+index,...project(e.n,e.o),width:e.i*16,height:e.i*16,owner:e.l>0?'player':'boss',phase:'active',nativeType:e.a,nativeFields:{a:e.a,c:e.c,d:e.d,j:e.j,l:e.l}}));
 const all=masked?[{x:0,y:0},{x:384,y:384}]:paths.flatMap(p=>p.points);all.push({x:point.x-48,y:point.y-64},{x:point.x+48,y:point.y+32});const left=Math.min(...all.map(p=>p.x))-24,right=Math.max(...all.map(p=>p.x))+24,top=Math.min(...all.map(p=>p.y))-24,bottom=Math.max(...all.map(p=>p.y))+24,bounds={left,right,top,bottom,width:right-left,height:bottom-top};
 const longest=paths.reduce((a,b)=>a.points.length>b.points.length?a:b,{points:[]}),boss=s.boss?{...run.boss,...project(s.boss.W,s.boss.X),width:s.boss.T*16,height:s.boss.U*16}:null;
 return{nativeRuntime:true,source:'native-functional-coordinates-own-art',nativePaths:masked?[]:paths,nativeMaskCells,nativeMaskId:masked?s.map.ae:null,room:{...run.room,width:bounds.width,height:bounds.height},bounds,cameraEnvelope:{width:bounds.width,height:bounds.height},familyIndex:run.familyIndex,time:run.time,progress:run.status().progress,track:{kind:masked?'native-mask':'native-surface',closed:false,points:masked?[]:longest.points,gaps:[]},player,characterId:run.characterId,companion:null,hazards:[],attacks:[],projectiles,boss,portal:null,distance:s.u.score,corner:{face:cur.geometry.orientation,turning:false,progress:0},feedback:run.feedback,transition:null,cellTransition:null,layout:{kind:'single'},feel:{pace:1,tier:0},nativeTransition:{l:s.u.l,controller:s.game.controller.controllerStateUK,step:s.map.ad}};
}
const api=Object.freeze({NativeRestorationRun,RestorationRun:NativeRestorationRun,slotMetadata,nativeGeometry,isolatedStorage,STORAGE_PREFIX,PREVIOUS_STORAGE_PREFIX,R77_STORAGE_PREFIX,VERSION,SOURCE});root.MongyuNativeRestoration=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
