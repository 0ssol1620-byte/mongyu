/* R74: recovered music roles and previous-selection rejection, using licensed
 * substitute recordings. No original MMF, melody, samples or instrumentation.
 * Native anchors and limitations: docs/R74_AUDIO_MAP.md, R74_STAGE_DISPATCH.md.
 */
(function(root){'use strict';
const STAGES=Object.freeze(Array.from({length:10},(_,i)=>'stage'+String(i+1).padStart(2,'0')));
const ROLES=Object.freeze(['title','menu','skin','story1','story2','story3',...STAGES,'boss']);
function roleFor(context={}){
 if(ROLES.includes(context.musicRole))return context.musicRole;
 const native=context.nativeState;
 if(native){
  // rK denotes normal state entry here. A shared branch can request Story2
  // while rK==153, but the state's own entry requests Skin (raw 0x2d64c).
  if(native.rK===150)return 'story1';
  if(native.rK===151&&native.rU===4)return 'story3';
  if(native.rK===151)return 'story2';
  if([152,153,154].includes(native.rK))return 'skin';
  if(context.screen==='story')return 'skin';
  if(native.uQ===99)return 'boss';
  if(Number.isInteger(native.uAx)&&native.uAx>=0&&native.uAx<10)return STAGES[native.uAx];
 }
 if(context.screen==='title')return 'title';
 if(context.screen==='menu'||context.screen==='collection')return 'menu';
 if(context.screen==='skin')return 'skin';
 // UI scene classification is an adaptation; exact native story branches may
 // instead be supplied through musicRole/nativeState by the caller.
 if(context.screen==='story'||context.scene?.kind==='story')return 'story1';
 if(context.scene)return 'skin';
 return context.run?.boss||context.boss?'boss':'stage';
}
function rejectPrevious(count,previous,rng=Math.random){
 if(!Number.isInteger(count)||count<1)throw new RangeError('positive selection count required');
 if(count===1)return {index:0,draws:0,fallback:false};
 for(let draws=1;draws<=32;draws++){
  const value=Number(rng());
  if(Number.isFinite(value)&&value>=0&&value<1){const index=Math.floor(value*count);if(index!==previous)return {index,draws,fallback:false};}
 }
 // Unlike the native unbounded loop, a broken injected RNG cannot hang the UI.
 return {index:Number.isInteger(previous)&&previous>=0&&previous<count?(previous+1)%count:0,draws:32,fallback:true};
}
function trackRoles(track){return Array.isArray(track.musicRoles)?track.musicRoles:[track.role];}
function candidates(catalog,role){
 const exact=catalog.filter(t=>trackRoles(t).includes(role));
 if(exact.length)return {tracks:exact,assignment:'dedicated-role'};
 if(STAGES.includes(role)){const stage=catalog.filter(t=>trackRoles(t).includes('stage'));if(stage.length)return {tracks:stage,assignment:'shared-stage-recording'};}
 const fallback=catalog.filter(t=>trackRoles(t).includes(role==='boss'?'boss':'main'));
 return {tracks:fallback.length?fallback:catalog,assignment:fallback.length?'shared-licensed-substitute':'catalog-fallback'};
}
function coverageFor(tracks={}){
 const catalog=Object.values(tracks).filter(t=>t&&typeof t.id==='string'&&typeof t.src==='string'&&t.src);
 const assignments=ROLES.map(role=>{const c=candidates(catalog,role);return {role,trackIds:c.tracks.map(t=>t.id),assignment:c.tracks.length?c.assignment:'unavailable'};});
 return {source:'licensed-substitute-recordings',originalAudioRestored:false,nativeMusicRoleCount:ROLES.length,
  availableRecordingCount:new Set(catalog.map(t=>t.src)).size,
  availableStageRecordingCount:new Set(STAGES.flatMap(role=>candidates(catalog,role).tracks.map(t=>t.src))).size,
  dedicatedRoleCount:assignments.filter(x=>x.assignment==='dedicated-role').length,assignments};
}
function createPolicy({tracks={},rng=Math.random}={}){
 const catalog=Object.values(tracks).filter(t=>t&&typeof t.id==='string'&&typeof t.src==='string'&&t.src),coverage=coverageFor(tracks);
 let stageIndex=null,lastRun,lastAttempt,lastMap,lastKey,lastRole=null,lastTrackId=null,lastSelection=null,current=null;
 function update(context={}){
  let role=roleFor(context);const run=context.run,attempt=run?.attempt,map=run?.mapChanges,key=context.stageKey;
  if(role==='stage'){
   if(stageIndex===null||run!==lastRun||attempt!==lastAttempt||map!==lastMap||key!==lastKey){
    lastSelection=rejectPrevious(10,stageIndex,rng);stageIndex=lastSelection.index;
    lastRun=run;lastAttempt=attempt;lastMap=map;lastKey=key;
   }
   role=STAGES[stageIndex];
  }
  const selection=candidates(catalog,role);
  const requested=selection.tracks.find(t=>t.id===context.recordingId);let chosen=requested||selection.tracks.find(t=>t.id===lastTrackId);
  if(!requested&&(role!==lastRole||!chosen)){
   const previous=selection.tracks.findIndex(t=>t.id===lastTrackId);
   const next=selection.tracks.length>1?rejectPrevious(selection.tracks.length,previous,rng).index:0;
   chosen=selection.tracks[next];
  }
  lastRole=role;lastTrackId=chosen?.id||null;
  current={musicRole:role,trackId:lastTrackId,stageIndex:STAGES.indexOf(role)>=0?STAGES.indexOf(role):null,
   repeat:true,assignment:chosen?selection.assignment:'unavailable',selection:lastSelection?{...lastSelection}:null,coverage};
  return current;
 }
 return {update,inspect:()=>current,coverage};
}
const api=Object.freeze({ROLES,STAGES,roleFor,rejectPrevious,coverageFor,createPolicy});
root.MongyuRestorationAudioPolicy=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
