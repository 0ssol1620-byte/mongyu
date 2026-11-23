/* R104 polish bus: lets presentation modules (play-juice, play-hud) observe the run without editing app.js. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const listeners=new Map();
let host=null;
function on(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);return()=>listeners.get(type)?.delete(fn)}
function emit(type,detail){
 if(!enabled)return;
 const set=listeners.get(type);if(!set)return;
 for(const fn of [...set]){try{fn(detail)}catch(error){if(root.console)root.console.error('[MongyuPolish]',type,error)}}
}
/* app.js calls attach() once with live accessors: {sound(kind), settings(), activeRun(), canvas, viewport(), audio()->{context,music,sfx}|null, startRun(run,event), refreshMusic()}. */
function attach(api){host=Object.freeze({...api});emit('attach',host)}
/* An adaptive-music module may set a claimant: musicOverride(run)->true makes app.js stop licensed music for that run. */
let musicClaim=null;
function claimMusic(fn){musicClaim=typeof fn==='function'?fn:null}
function musicOverride(run){if(!enabled||!musicClaim)return false;try{return !!musicClaim(run)}catch(_){return false}}
const api=Object.freeze({enabled,on,emit,attach,claimMusic,musicOverride,get host(){return host}});
root.MongyuPolish=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
