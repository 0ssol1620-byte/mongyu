/* Optional, independently authored origin-route memories. Not an original-game
 * mission port, a numeric campaign migration, or cryptographic anti-cheat.
 * This pure module has no storage, clock, network, engine mutation or telemetry.
 * sessionEligible is supplied by the app's live, uninterrupted-run lifecycle;
 * routeStats alone cannot distinguish a first finale attempt from a boss retry. */
(function(root){'use strict';
const VERSION=1,RECORD_VERSION=3,ROUTE_RULE='late-choice-v3',PROVENANCE='independent-reconstruction-not-original-port',SCORE_TARGET=600;
const KIND='origin-memories',RUN_KIND='origin-memory-run',ROUTE_ID='origin-inspired-v1',FINALE_ID='origin-finale-v1';
const MEMORIES=Object.freeze([
 Object.freeze({id:'journey',title:'돌아온 사각',description:'처음부터 네 구간을 지나 첫 대결에서 문지기 격파'}),
 Object.freeze({id:'unbroken',title:'흔들리지 않은 꿈',description:'처음부터 문지기까지 한 번도 부딪히지 않고 완료'}),
 Object.freeze({id:'precision',title:'선명한 발걸음',description:'처음부터 길 점수 600점 이상을 얻고 첫 대결에서 문지기 격파'})
]);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const object=o=>!!o&&typeof o==='object'&&!Array.isArray(o)&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
const number=(n,min=0,max=Number.MAX_VALUE)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
// JSON copies retain inert own __proto__ keys without assigning a prototype and
// never freeze or otherwise mutate objects owned by callers.
function copy(value){try{return JSON.parse(JSON.stringify(value))}catch(_){return null}}
function put(o,k,v){Object.defineProperty(o,k,{value:v,writable:true,enumerable:true,configurable:true})}
function create(){return {schema:VERSION,kind:KIND,provenance:PROVENANCE,records:{}}}
function future(o){return object(o)&&integer(o.schema,VERSION+1)}
function futureRecord(o){return object(o)&&integer(o.schema,RECORD_VERSION+1)}
function supported(o){return object(o)&&o.schema===VERSION&&o.kind===KIND&&o.provenance===PROVENANCE&&object(o.records)}
function readOnly(raw){const o=copy(raw);return future(o)||supported(o)&&MEMORIES.some(m=>own(o.records,m.id)&&futureRecord(o.records[m.id]))}

// These checks bind this schema to the actual v1 engine's route and throwing
// arena. They reject missing/coerced/nonfinite evidence and flags-only clears.
// The compact record always describes ONE run, not favorable fields stitched
// together from different runs. It is still a user-editable local record.
function validRun(r){
 if(!object(r)||![1,2,RECORD_VERSION].includes(r.schema)||r.kind!==RUN_KIND||r.routeId!==ROUTE_ID||r.levelId!==FINALE_ID||r.sessionEligible!==true)return false;
 const ints=['routeScore','finaleScore','score','routeHits','finaleHits','hits','chapters','edges','morphs','passed','jumps','perfect','bossDamage','shots','misses','deflects'];
 if(ints.some(k=>!own(r,k)||!integer(r[k]))||['routeTime','finaleTime','time'].some(k=>!own(r,k)||!number(r[k])))return false;
 if(r.chapters!==4||r.edges!==32||r.morphs!==8||!integer(r.passed,30,32)||r.routeHits>2||r.passed+r.routeHits!==32||r.finaleHits>2||r.bossDamage!==4)return false;
 if(!number(r.routeTime,73.6-.051,73.6+.051)||!number(r.finaleTime,.001,46.051))return false;
 if(r.schema===1){
  // Historical earned proofs retain the exact original jump/perfect contract.
  if(r.jumps<r.passed||r.perfect>r.passed)return false;
 }else{
  const counts=['encounters','barriers','ceilings','barrierPassed','ceilingPassed','barrierHits','ceilingHits'];
  const rule=r.schema===2?'choice-ceilings-v2':ROUTE_RULE,barriers=r.schema===2?30:29,ceilings=r.schema===2?2:3;
  if(r.routeRule!==rule||counts.some(k=>!own(r,k)||!integer(r[k])))return false;
  if(r.encounters!==32||r.barriers!==barriers||r.ceilings!==ceilings||r.barrierPassed+r.barrierHits!==barriers||r.ceilingPassed+r.ceilingHits!==ceilings||r.passed!==r.barrierPassed+r.ceilingPassed||r.routeHits!==r.barrierHits+r.ceilingHits)return false;
  if(r.jumps<r.barrierPassed||r.perfect>r.barrierPassed)return false;
 }
 if(r.jumps>Math.floor(r.routeTime/.68)+1)return false;
 if(!integer(r.shots,4,16)||r.bossDamage+r.misses+r.deflects>r.shots||r.finaleTime+.051<(r.shots-1)*.48)return false;
 if(r.routeScore!==368+r.passed*5+r.perfect*3||r.finaleScore!==r.bossDamage*100+r.deflects*15+Math.floor(r.finaleTime*2))return false;
 return r.score===r.routeScore+r.finaleScore&&r.hits===r.routeHits+r.finaleHits&&r.time===r.routeTime+r.finaleTime;
}
function awards(r){return ['journey',...(r.hits===0?['unbroken']:[]),...(r.routeScore>=SCORE_TARGET?['precision']:[])]}
function cleanRun(r){
 const keys=['schema','kind','routeId','levelId','sessionEligible','routeScore','finaleScore','score','routeTime','finaleTime','time','routeHits','finaleHits','hits','chapters','edges','morphs','passed','jumps','perfect','bossDamage','shots','misses','deflects'];
 if(r.schema>=2)keys.push('routeRule','encounters','barriers','ceilings','barrierPassed','ceilingPassed','barrierHits','ceilingHits');
 return Object.fromEntries(keys.map(k=>[k,r[k]]));
}
function normalize(raw){
 const o=copy(raw);if(future(o))return o;if(!supported(o))return create();
 const result={...o,records:{...o.records}};
 for(const m of MEMORIES){if(!own(result.records,m.id))continue;const r=result.records[m.id];
  if(futureRecord(r))continue;
  if(!validRun(r)||!awards(r).includes(m.id))delete result.records[m.id];else put(result.records,m.id,{...r,...cleanRun(r)});
 }
 return result;
}
function decode(text){
 if(typeof text!=='string'||text.length===0)return null;let raw;try{raw=JSON.parse(text)}catch(_){return null}
 if(future(raw))return raw;if(!supported(raw))return null;
 const state=normalize(raw);
 // Loading must distinguish repairable corrupt bytes from a truly empty save.
 // The app can archive those bytes before writing; normalize remains available
 // for explicitly recovering the valid subset without destroying that archive.
 if(MEMORIES.some(m=>own(raw.records,m.id)&&!own(state.records,m.id)))return null;
 return state;
}
// Higher route precision, fewer total hits, then shorter *whole-run* time. Boss
// waiting increases the engine's score, so it is deliberately not the first key.
function better(a,b){return !!a&&(!b||a.routeScore>b.routeScore||a.routeScore===b.routeScore&&(a.hits<b.hits||a.hits===b.hits&&(a.time<b.time||a.time===b.time&&a.score>b.score)))}
function merge(a,b){
 const left=normalize(a),right=normalize(b);
 // Unknown semantics cannot be safely merged or downgraded. The app must leave
 // their durable raw bytes alone. A tie deliberately preserves the left input.
 if(future(left)||future(right))return future(left)&&(!future(right)||left.schema>=right.schema)?left:right;
 const result={...right,...left,records:{...right.records,...left.records}};
 for(const m of MEMORIES){const x=own(left.records,m.id)?left.records[m.id]:null,y=own(right.records,m.id)?right.records[m.id]:null;
  if(futureRecord(x)||futureRecord(y))put(result.records,m.id,futureRecord(x)&&(!futureRecord(y)||x.schema>=y.schema)?x:y);
  else if(x||y)put(result.records,m.id,better(y,x)?y:x);
 }
 return result;
}
function progress(result){
 const r=object(result?.routeStats)?result.routeStats:null;
 return {chapters:r&&integer(r.chapters,0,4)?r.chapters:0,edges:r&&integer(r.edges,0,32)?r.edges:0,morphs:r&&integer(r.morphs,0,8)?r.morphs:0,bossDamage:integer(result?.bossDamage,0,4)?result.bossDamage:0};
}
function evaluate(raw,options={}){
 const result=copy(raw),policy=copy(options),p=progress(result),reject=reason=>({eligible:false,reason,earned:[],record:null,progress:p});
 if(!object(policy)||!own(policy,'sessionEligible')||policy.sessionEligible!==true)return reject('session-ineligible');
 if(!object(result)||result.kind!=='origin-finale'||result.mode!=='origin-finale'||result.levelId!==FINALE_ID||result.contentVersion!=='origin-finale-1'||result.gameMode!=='throw-arena'||result.provenance!==PROVENANCE)return reject('wrong-result');
 if(result.state!=='clear'||result.objectivesMet!==true||result.bossDefeated!==true||result.journeyCompleted!==true)return reject('not-complete');
 const r=result.routeStats;
 if(!object(r)||r.kind!=='origin-route-complete'||r.routeId!==ROUTE_ID||r.provenance!==PROVENANCE||r.startChapter!==0||r.distance!==8832)return reject('not-full-route');
 const zeros=['passed','bestCombo','jumps','perfect','ground','strikes','rooms','dodges','kicks','encounters'];
 if(zeros.some(k=>result[k]!==0)||!Array.isArray(result.roomPasses)||result.roomPasses.length!==4||result.roomPasses.some(v=>v!==0))return reject('invalid-metrics');
 if(r.routeRule!==ROUTE_RULE)return reject('unknown-route-rule');
 const record={schema:RECORD_VERSION,routeRule:r.routeRule,encounters:r.encounters,barriers:r.barriers,ceilings:r.ceilings,barrierPassed:r.barrierPassed,ceilingPassed:r.ceilingPassed,barrierHits:r.barrierHits,ceilingHits:r.ceilingHits,kind:RUN_KIND,routeId:ROUTE_ID,levelId:FINALE_ID,sessionEligible:true,
  routeScore:r.score,finaleScore:result.score,score:r.score+result.score,routeTime:r.time,finaleTime:result.time,time:r.time+result.time,
  routeHits:r.hits,finaleHits:result.hits,hits:r.hits+result.hits,chapters:r.chapters,edges:r.edges,morphs:r.morphs,passed:r.passed,jumps:r.jumps,perfect:r.perfect,
  bossDamage:result.bossDamage,shots:result.shots,misses:result.misses,deflects:result.deflects};
 if(!validRun(record))return reject('invalid-metrics');
 return {eligible:true,reason:null,earned:awards(record),record,progress:p};
}
function complete(raw,result,options={}){
 const state=normalize(raw);if(readOnly(state))return state;
 const evaluation=evaluate(result,options);if(!evaluation.eligible)return state;
 const earned=create();for(const id of evaluation.earned)put(earned.records,id,{...evaluation.record});return merge(state,earned);
}
function summarize(raw){
 const state=normalize(raw),records=supported(state)?state.records:{};
 const memories=MEMORIES.map(m=>{const r=own(records,m.id)?records[m.id]:null,earned=validRun(r)&&awards(r).includes(m.id);return {...m,earned,record:earned?cleanRun(r):null}});
 return {obtained:memories.filter(m=>m.earned).length,total:MEMORIES.length,readOnly:readOnly(state),memories,best:memories.find(m=>m.id==='journey')?.record||null};
}
const api=Object.freeze({VERSION,RECORD_VERSION,ROUTE_RULE,PROVENANCE,SCORE_TARGET,MEMORIES,create,decode,normalize,readOnly,merge,evaluate,complete,summarize});
root.QuadRiftOriginRecords=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
