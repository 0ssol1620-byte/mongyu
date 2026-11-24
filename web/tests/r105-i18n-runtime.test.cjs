// R105 i18n runtime: detection, t()/plural(), phrase+pattern translation, DOM translator reversibility, language switch.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src');

/* ---- tiny DOM: enough for the translator and the switch ---- */
function makeDom(){
 let ids={};
 class Node{constructor(t){this.nodeType=t;this.parentNode=null;this.childNodes=[]}
  appendChild(c){if(c.parentNode)c.parentNode.removeChild(c);c.parentNode=this;this.childNodes.push(c);if(c.id)ids[c.id]=c;return c}
  insertBefore(c,ref){if(c.parentNode)c.parentNode.removeChild(c);c.parentNode=this;const i=ref?this.childNodes.indexOf(ref):-1;if(i<0)this.childNodes.push(c);else this.childNodes.splice(i,0,c);if(c.id)ids[c.id]=c;return c}
  removeChild(c){this.childNodes=this.childNodes.filter(x=>x!==c);c.parentNode=null;return c}
  get nextSibling(){const p=this.parentNode;return p?p.childNodes[p.childNodes.indexOf(this)+1]||null:null}
 }
 class Text extends Node{constructor(v){super(3);this.nodeValue=v;this.nodeName='#text'}}
 class El extends Node{constructor(tag){super(1);this.nodeName=tag.toUpperCase();this.attrs={};this.listeners={};this.hidden=false;this.id='';this.className=''}
  setAttribute(k,v){this.attrs[k]=String(v);if(k==='id'){this.id=String(v);ids[v]=this}}
  getAttribute(k){return k in this.attrs?this.attrs[k]:null}
  addEventListener(k,f){(this.listeners[k]??=[]).push(f)}
  click(){for(const f of this.listeners.click||[])f({})}
  contains(x){for(let n=x;n;n=n.parentNode)if(n===this)return true;return false}
  remove(){if(this.parentNode)this.parentNode.removeChild(this);if(this.id&&ids[this.id]===this)delete ids[this.id]}
  set textContent(v){this.childNodes=[];if(v!=='')this.appendChild(new Text(String(v)))}
  get textContent(){return this.childNodes.map(c=>c.nodeType===3?c.nodeValue:c.textContent).join('')}
  get firstElementChild(){return this.childNodes.find(c=>c.nodeType===1)||null}
  get lang(){return this.attrs.lang}set lang(v){this.attrs.lang=v}
 }
 const all=n=>n.childNodes.flatMap(c=>c.nodeType===1?[c,...all(c)]:[]);
 const documentElement=new El('html'),head=new El('head'),body=new El('body');documentElement.appendChild(head);documentElement.appendChild(body);
 const doc={documentElement,head,body,readyState:'complete',
  createElement:t=>new El(t),createTextNode:v=>new Text(v),getElementById:id=>ids[id]||null,
  querySelectorAll(sel){const m=/^#(\w+) button\[data-lang\]$/.exec(sel);if(!m)return[];const root=ids[m[1]];return root?all(root).filter(e=>e.nodeName==='BUTTON'&&e.getAttribute('data-lang')):[]},
  addEventListener(){}};
 const el=(tag,attrs={},text,parent=body)=>{const e=new El(tag);for(const k of Object.keys(attrs))e.setAttribute(k,attrs[k]);if(text!==undefined)e.appendChild(new Text(text));parent.appendChild(e);return e};
 return {doc,el,Text,El,all};
}
class FakeObserver{static all=[];constructor(cb){this.cb=cb;this.records=[];this.connected=false;FakeObserver.all.push(this)}
 observe(){this.connected=true}disconnect(){this.connected=false}takeRecords(){const r=this.records;this.records=[];return r}fire(recs){this.cb(recs)}}

function load({langs=['en-US'],saved,store,edition=true,dom=true,rawStore}={}){
 const D=dom?makeDom():null;FakeObserver.all=[];
 const data=new Map(saved?[['mongyu.lang',saved]]:[]);
 const ctx={console,performance,MONGYU_UI_EDITION:edition,navigator:{languages:langs},
  localStorage:store||{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v))},_data:data,requestAnimationFrame:f=>0};
 if(rawStore)ctx._MongyuStore=rawStore;
 if(D){ctx.document=D.doc;ctx.MutationObserver=FakeObserver}
 ctx.globalThis=ctx;vm.createContext(ctx);
 for(const f of ['i18n.js','i18n-ko.js','i18n-en.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return {ctx,I:ctx.MongyuI18n,D,data};
}

test('detection: saved choice, then first navigator language, then English',()=>{
 assert.equal(load({langs:['ko-KR','en']}).I.lang(),'ko');
 assert.equal(load({langs:['en-US','ko']}).I.lang(),'en','only the first entry counts');
 assert.equal(load({langs:['ja-JP']}).I.lang(),'en','anything else is English');
 assert.equal(load({langs:[]}).I.lang(),'en');
 assert.equal(load({langs:['ko-KR'],saved:'en'}).I.lang(),'en','saved choice wins');
 assert.equal(load({langs:['en-US'],saved:'ko'}).I.lang(),'ko');
 assert.equal(load({langs:['ko-KR'],saved:'zz'}).I.lang(),'ko','invalid saved value is ignored');
 const bad={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 const r=load({langs:['ko-KR'],store:bad});assert.equal(r.I.lang(),'ko');assert.doesNotThrow(()=>r.I.setLang('en'));assert.equal(r.I.lang(),'en');
 assert.equal(load({langs:['ko-KR']}).D.doc.documentElement.lang,'ko','sets <html lang>');
 assert.equal(load({langs:['en-US']}).D.doc.documentElement.lang,'en');
});

test('release without the UI flag stays Korean and inert',()=>{
 const r=load({edition:false,langs:['en-US']});
 assert.equal(r.I.enabled,false);assert.equal(r.I.lang(),'ko');assert.equal(r.I.setLang('en'),false);
 assert.equal(r.D.doc.getElementById('i18nStyle'),null);
 assert.equal(r.I.tr('몽유'),'몽유');
});

test('setLang persists (localStorage, or the durable bridge), updates <html lang> and notifies once',()=>{
 const r=load({langs:['ko-KR']});const seen=[];const off=r.I.onChange(l=>seen.push(l));
 assert.equal(r.I.setLang('en'),true);assert.equal(r.data.get('mongyu.lang'),'en');assert.equal(r.D.doc.documentElement.lang,'en');
 r.I.setLang('en');assert.deepEqual(seen,['en'],'no event when unchanged');
 off();r.I.setLang('ko');assert.deepEqual(seen,['en'],'unsubscribed');
 assert.equal(r.I.setLang('fr'),false);
 const writes=[];const bridge={read:k=>k==='mongyu.lang'?'ven':null,write:(k,v)=>{writes.push([k,v]);return true}};
 const b=load({langs:['ko-KR'],rawStore:bridge});assert.equal(b.I.lang(),'en','reads the durable bridge format');b.I.setLang('ko');assert.deepEqual(writes,[['mongyu.lang','ko']]);
});

test('t(): interpolation, fallback chain, plural()',()=>{
 const r=load({langs:['en-US']}),I=r.I;
 I.register('en',{'a.hi':'Hi, {name}! {name} again, {missing}.','a.only_en':'EN only'});
 I.register('ko',{'a.hi':'안녕, {name}!','a.only_ko':'한국어만'});
 assert.equal(I.t('a.hi',{name:'Gil'}),'Hi, Gil! Gil again, {missing}.');
 assert.equal(I.t('a.only_ko'),'한국어만','falls back to Korean');
 assert.equal(I.t('nope.key'),'nope.key');
 assert.equal(I.plural('unit.shards',1),'1 shard');assert.equal(I.plural('unit.shards',0),'0 shards');assert.equal(I.plural('unit.shards',6),'6 shards');
 assert.equal(I.t('unit.pts',{n:1}),'1 pt');assert.equal(I.t('unit.pts',{n:42}),'42 pts');
 I.setLang('ko');assert.equal(I.t('a.hi',{name:'길'}),'안녕, 길!');assert.equal(I.plural('unit.shards',3),'빛 조각 3개');assert.equal(I.t('common.close'),'닫기');
 I.register('en',{'z.zero':{zero:'none',one:'one',other:'{n} things'}});I.setLang('en');assert.equal(I.plural('z.zero',0),'none');assert.equal(I.plural('z.zero',5),'5 things');
});

test('legacy translation: phrases, patterns with captures, $t recursion, plural functions, separators, whitespace',()=>{
 const I=load({langs:['en-US']}).I;
 assert.equal(I.tr('처음으로'),'Home');
 assert.equal(I.tr('  처음으로\n'),'  Home\n','keeps surrounding whitespace');
 assert.equal(I.tr('빛 3 / 6'),'Shards 3 / 6');
 assert.equal(I.tr('바닥 · 빛 2 / 6'),'Floor · Shards 2 / 6','$t1 translates the capture');
 assert.equal(I.tr('374점'),'374 pts');
 assert.equal(I.tr('1,500점'),'1,500 pts');
 assert.equal(I.tr('기억 1개'),'1 memory');assert.equal(I.tr('기억 10개'),'10 memories');
 assert.equal(I.tr('이슬 · 기억 3개 필요'),'Dew · needs 3 memories');
 assert.equal(I.tr('같은 장애물에 1번 부딪혀 봐'),'Hit the same obstacle once.');assert.equal(I.tr('같은 장애물에 3번 부딪혀 봐'),'Hit the same obstacle 3 times.');
 assert.equal(I.tr('1 / 1 · 무한 꿈 · 새벽 계단 · 0점'),'1 / 1 · Endless Dream · Dawn Stairs · 0 pts','splits composite labels on " · "');
 assert.equal(I.tr('꿈이 접혔다. 15점 · 완주 최고 0점 1 / 1 세계 · 11% 블록에 부딪혔어요'),'The dream folded. 15 pts · best finish 0 pts · world 1 / 1 · 11% · You hit a block.');
 assert.equal(I.tr('한 박자 늦었어. 조금만 더 빨리!'),'A beat late. Just a little sooner!');
 assert.equal(I.tr('아직 번역 안 된 문장'),'아직 번역 안 된 문장','unknown text is returned unchanged');
 assert.equal(I.translate('아직 번역 안 된 문장'),null);
 assert.equal(I.tr('English only'),'English only');
 assert.equal(I.tr('처음으로. 설정'),'Home. Settings','sentence-level fallback');
 I.setLang('ko');assert.equal(I.tr('처음으로'),'처음으로','Korean mode is a no-op');assert.equal(I.translate('처음으로'),null);
});

test('every phrase has a non-empty English value without Hangul, every pattern compiles',()=>{
 const en=require(path.join(SRC,'i18n-en.js'));
 assert.equal(en.enabled,false,'module loaded outside the build is inert');
 const r=load();const T=r.ctx.MongyuI18nEn;
 for(const [k,v] of Object.entries(T.phrases)){assert.ok(/[가-힣]/.test(k),'key is Korean: '+k);assert.ok(v&&!/[가-힣]/.test(v),'English only: '+k)}
 for(const [re,rep] of T.patterns){assert.equal(Object.prototype.toString.call(re),'[object RegExp]');assert.ok(typeof rep==='string'||typeof rep==='function')}
 assert.ok(Object.keys(T.phrases).length>500,'seed table size');
});

test('DOM: translates text, aria-label/title/placeholder; skips script/style/canvas/translate=no; reversible',()=>{
 const r=load({langs:['ko-KR']}),{I,D}=r;
 const h1=D.el('h1',{},'꿈 시작'),btn=D.el('button',{'aria-label':'설정',title:'닫기',placeholder:'답'},'설정');
 const script=D.el('script',{},'const x="설정"'),style=D.el('style',{},'.a::after{content:"닫기"}'),canvas=D.el('canvas',{},'설정'),keep=D.el('div',{translate:'no'},'닫기');
 const p=D.el('p',{},'아직 번역 안 된 문장'),en=D.el('p',{},'Already English');
 I.translateTree();assert.equal(h1.textContent,'꿈 시작','nothing happens in Korean mode');
 I.setLang('en');
 assert.equal(h1.textContent,'Start dreaming');assert.equal(btn.textContent,'Settings');
 assert.equal(btn.getAttribute('aria-label'),'Settings');assert.equal(btn.getAttribute('title'),'Close');assert.equal(btn.getAttribute('placeholder'),'Answer');
 assert.equal(script.textContent,'const x="설정"');assert.equal(style.textContent,'.a::after{content:"닫기"}');assert.equal(canvas.textContent,'설정');assert.equal(keep.textContent,'닫기');
 assert.equal(p.textContent,'아직 번역 안 된 문장');assert.equal(en.textContent,'Already English');
 I.setLang('ko');
 assert.equal(h1.textContent,'꿈 시작');assert.equal(btn.textContent,'설정');assert.equal(btn.getAttribute('aria-label'),'설정');assert.equal(btn.getAttribute('title'),'닫기');
 I.setLang('en');assert.equal(h1.textContent,'Start dreaming','translates again after a round trip');
});

test('DOM: observer re-translates re-rendered text and new nodes, ignores its own writes, and stops in Korean',()=>{
 const r=load({langs:['en-US']}),{I,D}=r;
 const obs=FakeObserver.all.find(o=>o.connected);assert.ok(obs,'observer connected in English');
 const hud=D.el('p',{},'빛 0 / 6');obs.fire([{type:'childList',target:D.doc.body,addedNodes:[hud]}]);
 assert.equal(hud.textContent,'Shards 0 / 6');
 // the app re-renders: new Korean text node in the same element
 hud.textContent='빛 1 / 6';
 const before=I.stats().nodes;
 obs.fire([{type:'childList',target:hud,addedNodes:[hud.childNodes[0]]}]);
 assert.equal(hud.textContent,'Shards 1 / 6');
 // characterData change on an existing node
 hud.childNodes[0].nodeValue='빛 2 / 6';obs.fire([{type:'characterData',target:hud.childNodes[0],addedNodes:[]}]);
 assert.equal(hud.textContent,'Shards 2 / 6');
 // our own write comes back as a record: no change, no loop
 obs.fire([{type:'characterData',target:hud.childNodes[0],addedNodes:[]}]);assert.equal(hud.textContent,'Shards 2 / 6');
 // added subtree
 const wrap=D.el('div',{});const b=new D.El('button');b.setAttribute('aria-label','일시정지');b.appendChild(new D.Text('일시정지'));wrap.appendChild(b);
 obs.fire([{type:'childList',target:D.doc.body,addedNodes:[wrap]}]);
 assert.equal(b.textContent,'Pause');assert.equal(b.getAttribute('aria-label'),'Pause');
 // attribute record
 b.setAttribute('aria-label','닫기');obs.fire([{type:'attributes',target:b,addedNodes:[],attributeName:'aria-label'}]);assert.equal(b.getAttribute('aria-label'),'Close');
 assert.ok(I.stats().nodes>before);
 I.setLang('ko');assert.equal(obs.connected,false,'observer disconnected in Korean');assert.equal(b.textContent,'일시정지');
 // text re-rendered while in Korean is simply Korean
 hud.textContent='빛 3 / 6';assert.equal(hud.textContent,'빛 3 / 6');
});

test('language switch: injected once into #settings under the sound section, survives rebuilds, toggles live',()=>{
 const r=load({langs:['ko-KR']}),{I,D}=r;
 const settings=D.el('section',{id:'settings'});const box=D.el('div',{},undefined,settings);
 D.el('input',{id:'sfxVolume'},undefined,box);D.el('p',{id:'volumeHelp'},'음악과 효과음의 크기를 따로 조절할 수 있어요.',box);D.el('button',{id:'mute'},'소리 켜짐',box);D.el('button',{id:'close'},'닫기',box);
 const sw=I.ensureSwitch();assert.ok(sw);assert.equal(sw.id,'langSwitch');
 assert.equal(box.childNodes[box.childNodes.indexOf(sw)-1].id,'volumeHelp','right after the sound help text');
 assert.equal(I.ensureSwitch(),sw,'idempotent');
 assert.ok(D.doc.getElementById('i18nStyle'),'inline style element');
 const btns=D.doc.querySelectorAll('#langSwitch button[data-lang]');assert.equal(btns.length,2);
 assert.deepEqual(btns.map(b=>b.getAttribute('aria-pressed')),['true','false']);
 assert.equal(sw.getAttribute('translate'),'no');
 btns[1].click();assert.equal(I.lang(),'en');assert.deepEqual(btns.map(b=>b.getAttribute('aria-pressed')),['false','true']);
 assert.equal(D.doc.getElementById('mute').textContent,'Sound on');
 assert.equal(sw.textContent,'언어 / Language한국어English','switch labels stay untranslated');
 btns[0].click();assert.equal(I.lang(),'ko');assert.equal(D.doc.getElementById('mute').textContent,'소리 켜짐');
 // the settings panel gets rebuilt by another module: the switch is re-injected when needed
 sw.remove();assert.equal(D.doc.getElementById('langSwitch'),null);
 const again=I.ensureSwitch();assert.ok(again&&box.contains(again));
});
