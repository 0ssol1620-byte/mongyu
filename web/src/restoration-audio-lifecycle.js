/* R76: native music-role entry semantics using two licensed substitutes.
 * No original recordings, notes or melodies. Media/gates remain owned by app.js.
 */
(function(root){'use strict';
const Policy=root.MongyuRestorationAudioPolicy||(typeof require==='function'?require('./restoration-audio-policy.js'):null);
function sceneRole(scene){
 if(!scene)return null;
 if(scene.sceneKind==='opening')return 'story1';
 if(scene.nativeState===150)return 'story1';
 if(scene.nativeState===151&&Number.isInteger(scene.nativeRow)&&scene.nativeRow>=0&&scene.nativeRow<=4)return scene.nativeRow===4?'story3':'story2';
 if([152,153,154].includes(scene.nativeState)||scene.sceneKind==='intro')return 'skin';
 // Telephone/interlude cues keep their existing exclusive authored SFX path.
 return null;
}
function createController({rng=Math.random,chapterScores=false,mapScores=false}={}){
 const direction=root.MongyuMapDirection||(mapScores&&typeof require==='function'?require('./map-direction.js'):null);
 let current=null,serial=0,lastRun=null,lastAttempt=null,lastMap=null,stageIndex=null,selection=null;
 function request(morphing=false){return {key:current.key,musicContext:{musicRole:current.role,...(mapScores&&current.profile?{recordingId:current.profile.recordingId,mapProfile:current.profile.id}: {})},role:current.role,scope:current.scope,stageIndex:current.stageIndex,preserveTrackOnEntry:current.preserveTrackOnEntry,crossfadeOnEntry:mapScores&&current.crossfadeOnEntry,morphing};}
 function update({enabled=false,title=false,dialog=null,entry=null,run=null,otherRun=false}={}){
  if(!enabled||otherRun)return null;
  let role=null,owner=null,scope=null,map=null,attempt=null;
  if(dialog==='restorationCollection'){role='skin';scope='board';owner=entry?.kind==='board'?entry.owner:'board';}
  else if(dialog==='restorationScene'){role=sceneRole(entry);scope='scene';owner=entry?.owner;}
  else if(dialog)return null;
  else if(run){
   if(!['play','transition'].includes(run.state)||run.deathAnimation||Number.isFinite(run.hearts)&&run.hearts<=0)return null;
   const native=run.nativeRuntime?run.nativeFrame:null;
   if(native?.r.timerT>0||native&&[2,3].includes(native.u.l))return null;
   if(native?.game.controller.controllerStateUK===200){if(mapScores&&current?.owner===run&&current.attempt===run.attempt&&current.scope==='gameplay'&&!run.boss)return request(true);return null;}
   if(run!==lastRun||run.attempt!==lastAttempt||run.mapChanges!==lastMap){
    const nativeIndex=native?.u.ax;
    selection=mapScores&&direction?{index:direction.describe(run).stageIndex,profile:direction.describe(run),nativeIndex,draws:0,fallback:false,source:'authored-map-score'}:Number.isInteger(nativeIndex)&&nativeIndex>=0&&nativeIndex<10?{index:nativeIndex,draws:0,fallback:false,source:'native-audio-selector'}:chapterScores&&Number.isInteger(run.familyIndex)&&run.familyIndex>=0&&run.familyIndex<10?{index:run.familyIndex,draws:0,fallback:false,source:'authored-chapter'}:Policy.rejectPrevious(10,stageIndex,rng);stageIndex=selection.index;
    lastRun=run;lastAttempt=run.attempt;lastMap=run.mapChanges;
   }
   role=run.boss?'boss':Policy.STAGES[stageIndex];scope='gameplay';owner=run;map=run.mapChanges;attempt=run.attempt;
  }else if(title){role='title';scope='title';owner='title';}
  if(!role)return null;
  if(!current||current.owner!==owner||current.role!==role||current.scope!==scope||current.map!==map||current.attempt!==attempt){
   // Authored substitute policy: native map roles can share one long recording.
   // Let the transport retain its clock only for a map change within this attempt.
   const mapOnly=current&&current.scope==='gameplay'&&scope==='gameplay'&&current.owner===owner&&current.attempt===attempt&&current.map!==map&&current.role!=='boss'&&role!=='boss';
   current={key:++serial,role,scope,owner,map,attempt,stageIndex:scope==='gameplay'?stageIndex:null,preserveTrackOnEntry:!!mapOnly,crossfadeOnEntry:!!mapOnly,profile:scope==='gameplay'&&mapScores?selection?.profile:null};
  }
  return request();
 }
 return {update,inspect:()=>current?{key:current.key,role:current.role,scope:current.scope,stageIndex:current.stageIndex,selection:selection?{...selection}:null}:null};
}
const api=Object.freeze({sceneRole,createController});root.MongyuRestorationAudioLifecycle=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
