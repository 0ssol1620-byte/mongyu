/* Local replay records only. These never unlock or prove collection entries. */
(function(root){'use strict';
const KEY='mongyu.r40.mastery.v1',LIMIT=65536,MAX=1000000;
const empty=()=>({schema:1,records:{},receipts:[]});
const object=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const validKey=k=>k==='freeplay'||typeof k==='string'&&/^r38-(00[1-9]|0[1-9][0-9]|100)$/.test(k);
const integer=(n,max=MAX)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
const stamp=s=>typeof s==='string'&&s.length>0&&s.length<=96&&/^[A-Za-z0-9:._-]+$/.test(s);
function parse(raw){
 if(typeof raw!=='string'||raw.length>LIMIT)return null;
 try{const s=JSON.parse(raw);if(!object(s)||s.schema!==1||!object(s.records)||Object.keys(s.records).length>101||!Array.isArray(s.receipts)||s.receipts.length>32||!s.receipts.every(stamp)||new Set(s.receipts).size!==s.receipts.length)return null;
  const out=empty();for(const [key,v] of Object.entries(s.records)){
   if(!validKey(key)||!object(v)||!integer(v.bestScore,2000000)||!integer(v.bestChain,100000)||!integer(v.attemptCount)||!integer(v.clearCount)||v.clearCount>v.attemptCount||v.attemptCount<1)return null;
   out.records[key]={bestScore:v.bestScore,bestChain:v.bestChain,attemptCount:v.attemptCount,clearCount:v.clearCount};
  }out.receipts=s.receipts.slice();return out;
 }catch(e){return null}
}
function load(storage){
 try{const raw=storage.getItem(KEY);if(raw===null||raw===undefined)return {ok:true,save:empty(),readOnly:false,reason:''};const save=parse(raw);return save?{ok:true,save,readOnly:false,reason:''}:{ok:false,save:empty(),readOnly:true,reason:'invalid-or-future-record'};}
 catch(e){return {ok:false,save:empty(),readOnly:true,reason:'read-failed'}}
}
function get(save,key){const v=save?.records?.[key];return v?{...v}:{bestScore:0,bestChain:0,attemptCount:0,clearCount:0}}
function validResult(key,r){return validKey(key)&&object(r)&&r.mode==='restoration'&&r.completed===true&&['clear','fail'].includes(r.state)&&integer(r.score,2000000)&&integer(r.bestCombo,100000)&&typeof r.time==='number'&&Number.isFinite(r.time)&&r.time>0&&r.time<=36000&&(key==='freeplay'?r.freePlay===true:r.freePlay!==true&&r.practice!==true&&r.slotId===key)}
function record(storage,key,result,receipt){
 const current=load(storage);if(!current.ok)return current;
 if(!stamp(receipt)||!validResult(key,result))return {...current,ok:false,reason:'invalid-result'};
 if(current.save.receipts.includes(receipt))return {...current,duplicate:true};
 const save={schema:1,records:{...current.save.records},receipts:current.save.receipts.slice()},old=get(save,key);
 save.records[key]={bestScore:Math.max(old.bestScore,result.score),bestChain:Math.max(old.bestChain,result.bestCombo),attemptCount:Math.min(MAX,old.attemptCount+1),clearCount:Math.min(MAX,old.clearCount+(result.state==='clear'?1:0))};
 save.receipts=[...save.receipts,receipt].slice(-32);
 const text=JSON.stringify(save);if(text.length>LIMIT)return {...current,ok:false,reason:'size'};
 try{storage.setItem(KEY,text);if(storage.getItem(KEY)!==text)return {...current,ok:false,reason:'verify-failed'};return {ok:true,save,readOnly:false,reason:''};}
 catch(e){return {...current,ok:false,reason:'write-failed'}}
}
const api=Object.freeze({KEY,load,get,record,parse,validResult});root.MongyuRestorationMastery=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
