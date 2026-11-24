/* R105 localization runtime (ko/en): t(), plural(), language detection, legacy DOM translator, language switch. Owned by workstream E1.
 * Tables: register(lang, {key: string | {one,other}}, {phrases:{ko:en}, patterns:[[regex, replacement]]}).
 * The legacy translator maps hardcoded Korean already in the DOM/canvas code to English without touching the sources. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const KEY='mongyu.lang',LANGS=['ko','en'];
const HANGUL=/[ㄱ-ㆎ가-힣]/;
const SKIP_TAGS={SCRIPT:1,STYLE:1,CANVAS:1,TEXTAREA:1,NOSCRIPT:1};
const ATTRS=['aria-label','title','placeholder','alt','data-r105-label'];
const tables={ko:Object.create(null),en:Object.create(null)};
const legacy={ko:{phrases:new Map(),patterns:[]},en:{phrases:new Map(),patterns:[]}};
const listeners=new Set();
const stats={callbacks:0,nodes:0,ms:0,passes:0};
let current='ko',booted=false,observer=null,pending=new Set(),cache=new Map();
const textRec=new WeakMap(),attrRec=new WeakMap();
const now=()=>root.performance&&root.performance.now?root.performance.now():Date.now();
const isLang=l=>LANGS.includes(l);

/* ---- tables, t(), plural() ---- */
function register(lang,table,legacyTables){
 if(!isLang(lang))throw new Error('Unknown language '+lang);
 if(table)Object.assign(tables[lang],table);
 if(legacyTables){
  if(legacyTables.phrases){for(const k of Object.keys(legacyTables.phrases))legacy[lang].phrases.set(k,legacyTables.phrases[k])}
  if(legacyTables.patterns){for(const p of legacyTables.patterns)legacy[lang].patterns.push([p[0] instanceof RegExp?p[0]:new RegExp(p[0]),p[1]])}
 }
 cache.clear();
}
function interpolate(s,vars){
 if(!vars)return s;
 return s.replace(/\{(\w+)\}/g,(m,k)=>Object.prototype.hasOwnProperty.call(vars,k)&&vars[k]!=null?String(vars[k]):m);
}
function lookup(key){
 for(const l of [current,'ko','en']){const v=tables[l][key];if(v!==undefined)return v}
 return undefined;
}
function pick(value,n){
 if(value&&typeof value==='object'){
  let cat='other';
  try{cat=new Intl.PluralRules(current).select(n)}catch(_){cat=n===1?'one':'other'}
  return value[n===0&&value.zero!==undefined?'zero':cat]??value.other??value.one??'';
 }
 return value;
}
function t(key,vars){
 const v=lookup(key);
 if(v===undefined)return key;
 const n=vars&&typeof vars.n==='number'?vars.n:undefined;
 return interpolate(String(pick(v,n===undefined?1:n)),vars);
}
function plural(key,n,vars){
 const v=lookup(key);
 if(v===undefined)return key;
 return interpolate(String(pick(v,n)),{...vars,n});
}

/* ---- legacy Korean -> English phrase/pattern translation ---- */
function applyPattern(re,rep,m,lang){
 if(typeof rep==='function')return rep(...m.slice(1));
 return rep.replace(/\$(t?)(\d)/g,(x,tr,d)=>{const g=m[+d];if(g===undefined)return'';return tr?(lookupPhrase(g,lang)??g):g});
}
function lookupRaw(core,lang){
 const L=legacy[lang];
 const exact=L.phrases.get(core);
 if(exact!==undefined)return exact;
 for(const [re,rep] of L.patterns){const m=re.exec(core);if(m)return applyPattern(re,rep,m,lang)}
 return null;
}
function lookupCore(core,lang){
 const r=lookupRaw(core,lang);
 if(r!==null)return r;
 const m=/^([\s\S]*?[^.!?…\s])([.!?…]+)$/.exec(core);
 if(m){const x=lookupRaw(m[1],lang);if(x!==null)return /[.!?…]$/.test(x)?x:x+m[2]}
 return null;
}
function splitJoin(parts,sep,fn){
 /* all-or-nothing: every Hangul part must translate, otherwise the string stays Korean (no half-English labels) */
 let hit=false;
 const out=[];
 for(const p of parts){
  if(!p||!HANGUL.test(p)){out.push(p);continue}
  const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(p);
  const x=fn(m[2]);
  if(x===null||HANGUL.test(x))return null;
  hit=true;out.push(m[1]+x+m[3]);
 }
 return hit?out.join(sep):null;
}
function lookupPhrase(core,lang){
 const r=lookupCore(core,lang);
 if(r!==null)return r;
 for(const sep of [' · ','\n',' / ']){
  if(!core.includes(sep))continue;
  const x=splitJoin(core.split(sep),sep,c=>lookupPhrase(c,lang));
  if(x!==null)return x;
 }
 if(/[.!?…]\s+\S/.test(core)){
  const parts=core.split(/(?<=[.!?…])(\s+)/);
  const out=[];let ok=true;
  for(const p of parts){
   if(!p||/^\s+$/.test(p)||!HANGUL.test(p)){out.push(p);continue}
   const x=lookupCore(p,lang);
   if(x===null||HANGUL.test(x)){ok=false;break}
   out.push(x);
  }
  if(ok)return out.join('');
 }
 return null;
}
/* Translate a Korean string; returns null when nothing matched fully (caller keeps the original). */
function translate(text,lang=current){
 if(lang==='ko'||typeof text!=='string'||!HANGUL.test(text))return null;
 const hit=cache.get(text);
 if(hit!==undefined)return hit;
 const m=/^(\s*)([\s\S]*?)(\s*)$/.exec(text);
 let r=lookupPhrase(m[2],lang);
 if(r===null&&/\s{2,}|[\t\n\r]/.test(m[2]))r=lookupPhrase(m[2].replace(/\s+/g,' '),lang);
 const out=r===null||HANGUL.test(r)?null:m[1]+r+m[3];
 if(cache.size>4000)cache.clear();
 cache.set(text,out);
 return out;
}
function tr(text){const r=translate(text);return r===null?text:r}

/* ---- DOM translator ---- */
function noTranslate(el){
 for(let e=el;e&&e.nodeType===1;e=e.parentNode)if(e.getAttribute&&e.getAttribute('translate')==='no')return true;
 return false;
}
function doText(node){
 const v=node.nodeValue,rec=textRec.get(node);
 if(rec&&v===rec.en)return;
 if(!v||!HANGUL.test(v)){if(rec)textRec.delete(node);return}
 const p=node.parentNode;
 if(p&&(SKIP_TAGS[p.nodeName]||noTranslate(p)))return;
 const en=translate(v);
 if(en!==null&&en!==v){textRec.set(node,{ko:v,en});node.nodeValue=en}
 else if(rec)textRec.delete(node);
}
function doAttrs(el){
 if(!el.getAttribute||el.nodeName==='SCRIPT'||el.nodeName==='STYLE')return;
 for(const a of ATTRS){
  const v=el.getAttribute(a);
  if(v===null)continue;
  let recs=attrRec.get(el);const rec=recs&&recs[a];
  if(rec&&v===rec.en)continue;
  if(!HANGUL.test(v)){if(rec)delete recs[a];continue}
  if(noTranslate(el))return;
  const en=translate(v);
  if(en!==null&&en!==v){if(!recs){recs={};attrRec.set(el,recs)}recs[a]={ko:v,en};el.setAttribute(a,en)}
  else if(rec)delete recs[a];
 }
}
/* The story typewriter writes one <span class="tw-c"> per character. Swap the whole run for one text node while English is on
   (the app keeps its own span list, so restoring simply puts the same spans back). */
const twRec=new WeakMap();
function isTw(n){return n&&n.nodeType===1&&n.nodeName==='SPAN'&&/(^|\s)tw-c(\s|$)/.test(n.className||'')}
function doTypewriter(box){
 const kids=box.childNodes;
 if(!kids.length||!isTw(kids[0]))return false;
 for(let i=0;i<kids.length;i++)if(!isTw(kids[i]))return false;
 let ko='';for(let i=0;i<kids.length;i++)ko+=kids[i].textContent;
 const en=translate(ko);
 if(en===null||en===ko)return true;
 const nodes=Array.prototype.slice.call(kids);
 const tn=root.document.createTextNode(en);
 twRec.set(box,{nodes,en,tn});
 box.textContent='';box.appendChild(tn);
 return true;
}
function undoTypewriter(box){
 const rec=twRec.get(box);if(!rec)return;
 twRec.delete(box);
 if(box.firstChild!==rec.tn||box.childNodes.length!==1)return;
 while(box.firstChild)box.removeChild(box.firstChild);
 for(const n of rec.nodes)box.appendChild(n);
}
function walk(node){
 if(node.nodeType===3){doText(node);return}
 if(node.nodeType!==1||node.nodeName==='SCRIPT'||node.nodeName==='STYLE')return;
 if(node.getAttribute&&node.getAttribute('translate')==='no')return;
 doAttrs(node);
 if(SKIP_TAGS[node.nodeName])return;
 if(doTypewriter(node))return;
 const kids=node.childNodes;
 for(let i=0;i<kids.length;i++)walk(kids[i]);
}
function restore(node){
 if(node.nodeType===3){const rec=textRec.get(node);if(rec){if(node.nodeValue===rec.en)node.nodeValue=rec.ko;textRec.delete(node)}return}
 if(node.nodeType!==1)return;
 const recs=attrRec.get(node);
 if(recs){for(const a of Object.keys(recs)){if(node.getAttribute(a)===recs[a].en)node.setAttribute(a,recs[a].ko)}attrRec.delete(node)}
 undoTypewriter(node);
 const kids=node.childNodes;
 for(let i=0;i<kids.length;i++)restore(kids[i]);
}
function flush(records){
 const t0=now();
 stats.callbacks++;
 for(const r of records){
  if(r.type==='characterData')pending.add(r.target);
  else if(r.type==='attributes')pending.add(r.target);
  else for(const n of r.addedNodes)pending.add(isTw(n)&&n.parentNode?n.parentNode:n);
 }
 const todo=pending;pending=new Set();
 for(const n of todo){
  stats.nodes++;
  if(n.nodeType===3)doText(n);
  else if(n.nodeType===1)walk(n);
 }
 if(observer)observer.takeRecords();
 stats.ms+=now()-t0;
}
function startObserver(){
 const doc=root.document;
 if(observer||!doc||typeof root.MutationObserver!=='function')return;
 observer=new root.MutationObserver(records=>flush(records));
 observer.observe(doc.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS});
}
function stopObserver(){if(observer){observer.disconnect();observer=null}pending=new Set()}
function translateTree(node){const t0=now();walk(node||root.document.documentElement);stats.passes++;stats.ms+=now()-t0}
function restoreTree(node){restore(node||root.document.documentElement)}
function applyDom(){
 const doc=root.document;
 if(!doc||!doc.documentElement)return;
 if(current==='en'){startObserver();translateTree(doc.documentElement);if(observer)observer.takeRecords()}
 else{stopObserver();restoreTree(doc.documentElement)}
}

/* ---- canvas bridge: fillText/strokeText/measureText of Korean literals follow the language without touching the renderers ---- */
let canvasPatched=false;
function patchCanvas(){
 const proto=root.CanvasRenderingContext2D&&root.CanvasRenderingContext2D.prototype;
 if(canvasPatched||!proto)return;
 canvasPatched=true;
 for(const m of ['fillText','strokeText','measureText']){
  const orig=proto[m];if(typeof orig!=='function')continue;
  proto[m]=function(text,...rest){
   if(current==='en'&&typeof text==='string'&&HANGUL.test(text)){const r=translate(text);if(r!==null)text=r}
   return orig.call(this,text,...rest);
  };
 }
}

/* ---- language choice ---- */
function store(){
 const bridge=root._MongyuStore;
 return {
  read(){
   try{
    if(bridge&&typeof bridge.read==='function'){const s=bridge.read(KEY);if(typeof s==='string'&&s[0]==='v')return s.slice(1)}
    return root.localStorage&&root.localStorage.getItem(KEY);
   }catch(_){return null}
  },
  write(v){
   try{if(bridge&&typeof bridge.write==='function')bridge.write(KEY,v)}catch(_){}
   try{if(root.localStorage)root.localStorage.setItem(KEY,v);return true}catch(_){return false}
  }
 };
}
function detect(){
 const saved=store().read();
 if(isLang(saved))return saved;
 const nav=root.navigator;
 const first=nav&&((Array.isArray(nav.languages)||(nav.languages&&nav.languages.length))?nav.languages[0]:nav.language);
 if(typeof first==='string'&&first)return /^ko/i.test(first)?'ko':'en';
 return 'en';
}
function lang(){return current}
function setLang(next,opts){
 if(!enabled||!isLang(next))return false;
 const changed=next!==current;
 current=next;
 cache.clear();
 const doc=root.document;
 if(doc&&doc.documentElement)doc.documentElement.lang=next;
 if(!(opts&&opts.persist===false))store().write(next);
 if(changed||(opts&&opts.force))applyDom();
 syncSwitch();
 if(changed)for(const fn of [...listeners]){try{fn(next)}catch(_){}}
 return true;
}
function onChange(fn){
 if(typeof fn!=='function')return()=>{};
 listeners.add(fn);
 return()=>listeners.delete(fn);
}

/* ---- language switch (settings dialog) ---- */
const SWITCH_CSS='#langSwitch{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0;padding:6px 0;width:100%;box-sizing:border-box}'
 +'#langSwitch .i18n-lang-label{flex:1 1 auto;min-width:0;font-size:15px;font-weight:650;line-height:1.3}'
 +'#langSwitch .i18n-seg{flex:0 0 auto;display:inline-flex;border:1px solid rgba(255,255,255,.28);border-radius:999px;overflow:hidden;background:rgba(255,255,255,.06)}'
 +'#langSwitch .i18n-seg button{all:unset;box-sizing:border-box;cursor:pointer;min-width:68px;min-height:44px;padding:0 14px;display:flex;align-items:center;justify-content:center;text-align:center;font:inherit;font-size:14px;font-weight:650;color:inherit;opacity:.8;-webkit-tap-highlight-color:transparent}'
 +'#langSwitch .i18n-seg button[aria-pressed=true]{background:rgba(255,241,252,.92)!important;color:#142030!important;opacity:1}'
 +'#langSwitch .i18n-seg button:focus-visible{outline:2px solid #fff;outline-offset:-3px}'
 +'@media (max-width:340px){#langSwitch{flex-direction:column;align-items:stretch}#langSwitch .i18n-seg{align-self:stretch}#langSwitch .i18n-seg button{flex:1 1 0}}'
 /* English runs longer than Korean: let the title-row buttons shrink and wrap instead of colliding */
 +'html[lang=en] .r104-modes-row button{font-size:12.5px;letter-spacing:0;padding-left:6px;padding-right:6px;white-space:normal;line-height:1.15}'
 +'html[lang=en] .title-links button{white-space:normal;line-height:1.15}'
 +'html[lang=en] body :is(#squareResult,#pauseSheet) button:not([data-primary=true]):not(#resumePlay){font-size:10px!important;letter-spacing:0!important}';
function syncSwitch(){
 const doc=root.document;if(!doc||!doc.querySelectorAll)return;
 for(const b of doc.querySelectorAll('#langSwitch button[data-lang]'))b.setAttribute('aria-pressed',String(b.getAttribute('data-lang')===current));
}
function ensureSwitch(){
 const doc=root.document;
 if(!enabled||!doc||!doc.getElementById)return null;
 if(!doc.getElementById('i18nStyle')){
  const st=doc.createElement('style');st.id='i18nStyle';st.textContent=SWITCH_CSS;
  (doc.head||doc.documentElement).appendChild(st);
 }
 const settings=doc.getElementById('settings');
 if(!settings)return null;
 let box=doc.getElementById('langSwitch');
 if(box&&settings.contains(box))return box;
 if(box)box.remove();
 box=doc.createElement('div');
 box.id='langSwitch';box.setAttribute('role','group');box.setAttribute('aria-label','언어 / Language');box.setAttribute('translate','no');
 const label=doc.createElement('span');label.className='i18n-lang-label';label.textContent='언어 / Language';
 const seg=doc.createElement('div');seg.className='i18n-seg';
 for(const [code,name] of [['ko','한국어'],['en','English']]){
  const b=doc.createElement('button');b.type='button';b.setAttribute('data-lang',code);b.setAttribute('lang',code);b.textContent=name;
  b.setAttribute('aria-pressed',String(code===current));
  b.addEventListener('click',()=>setLang(code));
  seg.appendChild(b);
 }
 box.appendChild(label);box.appendChild(seg);
 const anchor=doc.getElementById('volumeHelp')||doc.getElementById('sfxVolume');
 if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(box,anchor.nextSibling);
 else{const close=doc.getElementById('close');if(close&&close.parentNode)close.parentNode.insertBefore(box,close);else(settings.firstElementChild||settings).appendChild(box)}
 return box;
}
function watchSettings(){
 const doc=root.document;
 if(!doc||!doc.getElementById)return;
 const settings=doc.getElementById('settings');
 if(settings&&typeof root.MutationObserver==='function'){
  new root.MutationObserver(()=>{if(!settings.hidden)ensureSwitch()}).observe(settings,{attributes:true,attributeFilter:['hidden']});
 }
 const opener=doc.getElementById('options');
 if(opener)opener.addEventListener('click',()=>ensureSwitch(),true);
}

/* ---- boot ---- */
function boot(){
 if(booted||!enabled)return;
 booted=true;
 patchCanvas();
 const doc=root.document;
 if(!doc)return;
 ensureSwitch();watchSettings();
 applyDom();
 if(typeof root.requestAnimationFrame==='function')root.requestAnimationFrame(()=>{ensureSwitch();if(current==='en')translateTree()});
}

const api=Object.freeze({enabled,t,plural,register,lang,setLang,onChange,tr,translate,translateTree,restoreTree,ensureSwitch,detect,boot,stats:()=>({...stats,lang:current,cache:cache.size,phrases:legacy.en.phrases.size,patterns:legacy.en.patterns.length}),langs:LANGS.slice()});
root.MongyuI18n=api;if(typeof module!=='undefined')module.exports=api;
/* Defer the first pass to the end of script loading so ko/en tables and the other modules have registered; the observer then covers everything the app renders. */
if(enabled){
 current=detect();
 if(root.document&&root.document.documentElement)root.document.documentElement.lang=current;
 const go=()=>boot();
 if(root.document&&root.document.readyState==='loading'&&root.document.addEventListener)root.document.addEventListener('DOMContentLoaded',go);else go();
}
})(globalThis);
