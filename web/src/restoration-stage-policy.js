/* Functional dispatch recovered from one unauthenticated KTF candidate.
 * Evidence: docs/R74_STAGE_DISPATCH.md. This selects indices only: existing
 * authored geometry is a substitute, and no original map/mask/palette is here.
 * RNG A/B are explicit bounded-draw functions. Phase is never guessed.
 */
(function(root){'use strict';
// CON_STAGE category-0 mission indices, expressed as semantic one-based slots.
const ORDINARY_SLOTS=Object.freeze([2,3,4,6,7,9,10,11,12,14,15,17,18,19,21,23,25,26,27,29,30,32,33,35,36,37,40,42,43,44,46,48,50,51,53,54,57,59,60,61,63,64,67,68,70,71,72,74,75,76,78,79,82,83,85,86,88,89,91,93,94,95,97,98]);
function integer(value,min,max,name){
 if(!Number.isInteger(value)||value<min||value>max)throw new RangeError(name+' must be an integer in '+min+'..'+max);
 return value;
}
function draw(rng,count){
 if(typeof rng!=='function')throw new TypeError('explicit RNG function required');
 return integer(rng(count),0,count-1,'RNG result');
}
// Optional exact adapter for Java Math.abs(nextInt()) % max(1,n).
// MIN_VALUE can produce a negative index in the candidate. Keep that observable;
// selectors reject such an invalid bounded result instead of silently fixing it.
function nativeBoundedDraw(nextInt,count){
 integer(count,-2147483648,2147483647,'bound');
 if(typeof nextInt!=='function')throw new TypeError('nextInt required');
 const value=integer(nextInt(),-2147483648,2147483647,'nextInt result');
 const abs=value===-2147483648?value:Math.abs(value);
 const result=abs%Math.max(1,count);
 return Object.is(result,-0)?0:result;
}
function rejectPrevious(count,previous,rng,{maxDraws=Infinity}={}){
 integer(count,1,2147483647,'count');
 if(count===1&&previous===0)throw new RangeError('native rejection would never terminate for singleton previous 0');
 if(maxDraws!==Infinity)integer(maxDraws,1,2147483647,'maxDraws');
 for(let draws=0;draws<maxDraws;draws++){
  const index=draw(rng,count);
  if(index!==previous)return index;
 }
 throw new RangeError('rejection draw budget exhausted; no replacement index invented');
}
function selectStage({mode,selectedSlot,ordinal,previousVariant,previousGroup,firstSelection,rngA,rngB,maxDraws=Infinity}={}){
 integer(previousVariant,0,3,'previousVariant (native cold phase is not assumed)');
 if(typeof firstSelection!=='boolean')throw new TypeError('firstSelection must explicitly represent native u.u == 0');
 let group;
 if(mode==='ordinary'){
  integer(selectedSlot,0,99,'selectedSlot');integer(ordinal,0,63,'ordinal');
  group=firstSelection?ordinal:ordinal===0?0:rejectPrevious(ordinal+1,integer(previousGroup,0,63,'previousGroup'),rngA,{maxDraws});
 }else if(mode==='freePlay'){
  if(selectedSlot!==100)throw new RangeError('FreePlay native selectedSlot must be 100');
  group=firstSelection?draw(rngB,64):rejectPrevious(64,integer(previousGroup,0,63,'previousGroup'),rngA,{maxDraws});
 }else throw new RangeError('supported modes are ordinary and freePlay');
 const variant=(previousVariant+1)%4;
 return {group,variant,stageTableOffset:(group*4+variant)*9,geometrySource:'authored-substitute',originalGeometryRestored:false};
}
function initialPalette({mode,selectedSlot,rngB}={}){
 if(mode==='ordinary')return integer(selectedSlot,0,99,'selectedSlot');
 if(mode==='freePlay'&&selectedSlot===100)return draw(rngB,100);
 throw new RangeError('ordinary or FreePlay selectedSlot required');
}
function nextPalette({mode,selectedSlot,currentPalette,rngA,maxDraws=Infinity}={}){
 integer(currentPalette,0,99,'currentPalette');
 if(mode==='ordinary'){
  integer(selectedSlot,0,99,'selectedSlot');
  return selectedSlot===0?0:rejectPrevious(selectedSlot+1,currentPalette,rngA,{maxDraws});
 }
 if(mode==='freePlay'&&selectedSlot===100)return rejectPrevious(100,currentPalette,rngA,{maxDraws});
 throw new RangeError('ordinary or FreePlay selectedSlot required');
}
function rotateMaskCoordinate(x,y,orientation){
 integer(x,0,23,'x');integer(y,0,23,'y');integer(orientation,0,3,'orientation');
 return orientation===0?[y,23-x]:orientation===1?[23-x,23-y]:orientation===2?[23-y,x]:[x,y];
}
function initialCountdown({nativeRZa,rngA}={}){
 if(typeof nativeRZa!=='boolean')throw new TypeError('nativeRZa boolean required');
 return nativeRZa?1000000:150+draw(rngA,150);
}
// These are isolated native predicates, not the complete update scheduler.
// Keep expiry, l=1 dispatch, and palette commit as separate integration steps.
function countdownStep({remaining,nativeRT,nativeED,nativeUQ}={}){
 integer(remaining,-2147483648,2147483647,'remaining');
 integer(nativeRT,-2147483648,2147483647,'nativeRT');
 integer(nativeED,-2147483648,2147483647,'nativeED');
 integer(nativeUQ,-2147483648,2147483647,'nativeUQ');
 const next=nativeED!==13&&nativeRT===0?(remaining-1)|0:remaining;
 return {remaining:next,expiryPredicate:next < -29&&nativeED!==13&&nativeED!==16&&nativeUQ!==99};
}
const api=Object.freeze({ORDINARY_SLOTS,nativeBoundedDraw,rejectPrevious,selectStage,initialPalette,nextPalette,rotateMaskCoordinate,initialCountdown,countdownStep,
 scope:'one-unauthenticated-KTF-candidate',nativeColdPhase:'caller-required',originalGeometryRestored:false});
root.MongyuRestorationStagePolicy=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
