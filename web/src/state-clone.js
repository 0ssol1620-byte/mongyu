/* R84: copy owned plain simulation snapshots without browser serialization.
 * Scoped to the native bundle/bridge; the global structuredClone is untouched.
 */
(function(root){'use strict';
function create(nativeClone){
 const unsupported={},arraySlice=Array.prototype.slice,immutableCaptures=new WeakMap();
 let calls=0,fallbacks=0,tickDepth=0,sharedCaptureArrays=0;
 function duringNativeTick(fn){tickDepth++;try{return fn()}finally{tickDepth--}}
 function clone(value,options){
  calls++;if(options){fallbacks++;return nativeClone(value,options)}
  const seen=new Map();
  // Completed render-capture buffers are read-only until a capture writer phase.
  // Share frozen COPIES only inside the driver transaction. Checkpoint/export
  // calls outside this scope still receive fully independent mutable arrays.
  if(tickDepth&&value?.game&&value?.map?.h===0&&[0,3,4].includes(value.u?.l)){
   for(const array of Object.values(value.map.capture||{})){
    if(!Array.isArray(array))continue;let frozen=immutableCaptures.get(array);
    if(!frozen){if(Object.keys(array).length!==array.length||!array.every(x=>typeof x==='number'))continue;frozen=Object.freeze(arraySlice.call(array));immutableCaptures.set(array,frozen);immutableCaptures.set(frozen,frozen)}
    seen.set(array,frozen);sharedCaptureArrays++;
   }
  }
  function copy(v){
   if(v===null||typeof v!=='object'){if(typeof v==='function'||typeof v==='symbol')throw unsupported;return v}
   if(seen.has(v))return seen.get(v);
   const array=Array.isArray(v);
   if(!array){const proto=Object.getPrototypeOf(v);if(proto!==null&&Object.getPrototypeOf(proto)!==null)throw unsupported}
   const keys=Object.keys(v);
   // Terrain, mask and trajectory tables are dense arrays. Indexed access avoids
   // repeatedly enumerating thousands of string indices during each engine phase.
   if(array&&keys.length===v.length&&(!v.length||keys.at(-1)===String(v.length-1))){
    const result=arraySlice.call(v);seen.set(v,result);
    for(let i=0;i<result.length;i++){const item=result[i],type=typeof item;if(item!==null&&type==='object')result[i]=copy(item);else if(type==='function'||type==='symbol')throw unsupported}
    return result;
   }
   const result=array?new Array(v.length):{};seen.set(v,result);
   for(const key of keys){let item=v[key];const type=typeof item;if(item!==null&&type==='object')item=copy(item);else if(type==='function'||type==='symbol')throw unsupported;
    if(key==='__proto__')Object.defineProperty(result,key,{value:item,enumerable:true,writable:true,configurable:true});else result[key]=item;
   }
   return result;
  }
  try{return copy(value)}catch(error){if(error!==unsupported)throw error;fallbacks++;return nativeClone(value)}
 }
 return {clone,duringNativeTick,inspect:()=>({calls,fallbacks,sharedCaptureArrays,backend:'owned-plain-snapshot'})};
}
const api={create,...create(root.structuredClone.bind(root))};root.MongyuStateClone=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
