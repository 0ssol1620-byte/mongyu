/* R105 effects profile (workstream ACC): how much shaking, zooming, echo, background motion, psychedelic layer, haptics and fever light the player wants.
   Blueprint §8.5 / §20 / §22 / §28: three levels (Standard / Reduced / Minimal) plus a per-channel override. It only ever scales PRESENTATION: no gameplay code
   (judgement, timing, collision, score, rewards) may read it, and a test enforces that (web/tests/r105-effects-gameplay.test.cjs).
   API (globalThis.MongyuEffects):
     get()                  -> frozen snapshot {level, values:{channel:0..1}, overrides, text, seen, custom, system}
     value(channel)         -> 0..1 multiplier ('shake','zoom','echo','bgmotion','psy','haptics','fever' + level-only 'flash','gate'); 1 when the edition is off
     set(level)             -> 'standard'|'reduced'|'minimal' (clears the overrides);  set(channel, 0..1|null)  override / back to the level;  set('text', 100|120|140)
     on('change', fn)       -> unsubscribe function;  reset();  feverStyle() -> 'full'|'soft'|'outline';  echoCount(max);  scaleMs(ms) (haptics)
     mountSettings(box)     -> builds the settings section;  showFirstRun()  -> one-time choice sheet
   CSS hooks: html[data-fx='standard|reduced|minimal'], html[data-fx-text='100|120|140'], --fx-shake/--fx-zoom/--fx-echo/--fx-bg/--fx-psy/--fx-haptics/--fx-fever on <html>.
   The legacy app setting `reduced` (and dreamIntensity) is kept in step: Reduced and Minimal turn it on, and flipping the old switch moves the level. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const KEY='mongyu.r105.effects';
const LEVELS=Object.freeze(['standard','reduced','minimal']);
const CHANNELS=Object.freeze(['shake','zoom','echo','bgmotion','psy','haptics','fever']);
const DERIVED=Object.freeze(['flash','gate']);
const TEXTS=Object.freeze([100,120,140]);
/* The level table (every number is a 0..1 multiplier on the Standard strength). Reduced = no shake, slow and faint everything else (static psychedelic wash);
   Minimal = everything off, fever only as a thin outline. */
const TABLE=Object.freeze({
 standard:Object.freeze({shake:1,zoom:1,echo:1,bgmotion:1,psy:1,haptics:1,fever:1,flash:1,gate:1}),
 reduced:Object.freeze({shake:0,zoom:.35,echo:.4,bgmotion:.25,psy:.45,haptics:.5,fever:.5,flash:.3,gate:.3}),
 minimal:Object.freeze({shake:0,zoom:0,echo:0,bgmotion:0,psy:0,haptics:0,fever:0,flash:0,gate:0})
});
const clamp01=v=>v<0?0:v>1?1:v;
const doc=root.document;

/* ---------- state ---------- */
const S={level:'standard',ov:{},text:100,seen:false,system:false};
const listeners=new Set();
function systemReduced(){try{return !!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches}catch(_){return false}}
function read(){try{const raw=root.localStorage?.getItem(KEY);return raw?JSON.parse(raw):null}catch(_){return null}}
function write(){try{root.localStorage?.setItem(KEY,JSON.stringify({v:1,level:S.level,ov:S.ov,text:S.text,seen:S.seen}))}catch(_){}}
function load(){
 S.system=systemReduced();
 const d=read();
 if(d&&typeof d==='object'){
  S.level=LEVELS.includes(d.level)?d.level:'standard';
  S.ov={};if(d.ov&&typeof d.ov==='object')for(const c of CHANNELS)if(Number.isFinite(d.ov[c]))S.ov[c]=clamp01(d.ov[c]);
  S.text=TEXTS.includes(d.text)?d.text:100;S.seen=d.seen===true;
 }else{S.level=S.system?'reduced':'standard';S.ov={};S.text=100;S.seen=false}
}
function valueOf(ch){
 if(!enabled)return 1;
 if(CHANNELS.includes(ch)&&S.ov[ch]!==undefined)return S.ov[ch];
 return TABLE[S.level][ch]??1;
}
const values=()=>{const o={};for(const c of CHANNELS)o[c]=valueOf(c);for(const c of DERIVED)o[c]=valueOf(c);return o};
const custom=()=>Object.keys(S.ov).length>0;
function snapshot(){return Object.freeze({enabled,level:S.level,values:Object.freeze(values()),overrides:Object.freeze({...S.ov}),text:S.text,seen:S.seen,custom:custom(),system:S.system})}
function emit(type){const snap=snapshot();for(const fn of [...listeners]){try{fn({type,...snap})}catch(e){try{root.console?.error?.('[MongyuEffects]',e)}catch(_){}}}}

/* ---------- the legacy app setting ---------- */
function hostSettings(){try{return root.MongyuPolish?.host?.settings?.()||null}catch(_){return null}}
/* The acts, the lobby and the psychedelic layer already have a tested "reduced" drawing path (static or slow, no beat pulses). It is chosen by the background-motion
   channel: Reduced and Minimal turn it on, and so does switching background motion off by hand. */
const wantReduced=()=>valueOf('bgmotion')<.5;
function syncHost(){
 if(!enabled)return;
 const s=hostSettings();if(!s)return;
 if(s.reduced!==wantReduced())s.reduced=wantReduced();
 try{const b=doc?.body;if(b?.dataset&&root.MONGYU_SPECTRAL_EDITION)b.dataset.dreamMotion=wantReduced()?'reduced':'full'}catch(_){}
}
/* The old "움직임 줄이기" switch (or a restored save) changed `reduced` behind our back: follow it. */
function watchHost(){
 const s=hostSettings();if(!s||typeof s.reduced!=='boolean')return;
 if(s.reduced!==wantReduced()){
  S.level=s.reduced?'reduced':'standard';S.ov={};S.seen=true;write();apply();emit('change');
 }
}

/* ---------- applying to the page ---------- */
function apply(){
 if(!enabled)return;
 syncHost();
 if(!doc?.documentElement)return;
 const h=doc.documentElement;
 try{
  h.setAttribute('data-fx',S.level);h.setAttribute('data-fx-text',String(S.text));
  h.style.setProperty('--fx-text',String(S.text/100));h.setAttribute('data-fx-fever',feverStyle());
  for(const [c,v] of [['shake','shake'],['zoom','zoom'],['echo','echo'],['bg','bgmotion'],['psy','psy'],['haptics','haptics'],['fever','fever']])h.style.setProperty('--fx-'+c,valueOf(v).toFixed(2));
 }catch(_){}
 syncHost();   // again: the body attribute needs the document
}

/* ---------- public setters ---------- */
function set(a,b){
 if(!enabled)return false;
 if(LEVELS.includes(a)){S.level=a;S.ov={}}
 else if(CHANNELS.includes(a)){if(b===null||b==='auto'||b===undefined)delete S.ov[a];else if(Number.isFinite(Number(b)))S.ov[a]=clamp01(Number(b));else return false}
 else if(a==='text'){const n=Number(b);if(!TEXTS.includes(n))return false;S.text=n}
 else if(a==='seen'){S.seen=b!==false}
 else return false;
 if(a!=='seen')S.seen=true;
 write();apply();emit('change');return true;
}
function reset(){S.ov={};write();apply();emit('change');return true}
function on(type,fn){if(type!=='change'||typeof fn!=='function')return()=>{};listeners.add(fn);return()=>listeners.delete(fn)}
/* Helpers for presentation code. */
const feverStyle=()=>{const v=valueOf('fever');return v>=.75?'full':v>0?'soft':'outline'};
const echoCount=max=>{const v=valueOf('echo');return v<=0?0:Math.max(1,Math.round((max|0)*v))};
const scaleMs=ms=>{const v=valueOf('haptics');return v<=0?0:Math.max(4,Math.round(ms*(.4+.6*v)))};

/* ---------- strings (Korean source; English is registered by i18n-en-effects.js) ---------- */
const KO={
 'fx.title':'효과 강도','fx.lead':'흔들림과 번쩍임을 얼마나 볼지 골라요. 점수와 판정은 그대로예요.',
 'fx.level.standard':'표준','fx.level.reduced':'줄임','fx.level.minimal':'최소',
 'fx.levelSub.standard':'모든 연출을 그대로 보여 줘요','fx.levelSub.reduced':'흔들림 없이, 움직임은 느리고 약하게','fx.levelSub.minimal':'움직임과 배경 효과를 모두 꺼요',
 'fx.desc.standard':'화면 흔들림, 확대, 잔상, 움직이는 환각 배경이 모두 나와요.',
 'fx.desc.reduced':'화면 흔들림은 없어요. 환각 배경은 은은한 정지 화면이고, 나머지 움직임은 느리고 약해요.',
 'fx.desc.minimal':'흔들림·확대·잔상·배경 움직임·환각 층을 모두 꺼요. 피버는 얇은 테두리로만 보여요.',
 'fx.custom':'직접 조절 중이에요. 아래 세부 조절에서 바꿀 수 있어요.','fx.device':'기기의 움직임 줄이기 설정에 맞춰 두었어요.',
 'fx.adv':'세부 조절','fx.advSub':'효과를 하나씩 켜고 꺼요','fx.reset':'레벨 기본값으로 되돌리기',
 'fx.ch.shake':'화면 흔들림','fx.chSub.shake':'부딪힐 때 화면이 흔들려요',
 'fx.ch.zoom':'확대·기울기','fx.chSub.zoom':'카메라가 다가가거나 기울어요',
 'fx.ch.echo':'잔상','fx.chSub.echo':'지나간 모습이 옅게 남아요',
 'fx.ch.bgmotion':'배경 움직임','fx.chSub.bgmotion':'배경이 흐르고 박자에 맞춰 뛰어요',
 'fx.ch.psy':'환각 배경','fx.chSub.psy':'가장자리의 색 무늬 층',
 'fx.ch.haptics':'진동','fx.chSub.haptics':'부딪히거나 눌렀을 때 진동해요',
 'fx.ch.fever':'피버 연출','fx.chSub.fever':'끄면 얇은 테두리만 남아요',
 'fx.short.shake':'흔들림','fx.short.zoom':'확대','fx.short.echo':'잔상','fx.short.bgmotion':'배경 움직임','fx.short.psy':'환각 배경','fx.short.haptics':'진동','fx.short.fever':'피버',
 'fx.sumOn':'지금 켜진 것: {list}','fx.sumNone':'지금 켜진 연출이 없어요.','fx.sep':' · ','fx.soft':'약하게',
 'fx.text':'글자 크기','fx.textSub':'게임 속 말풍선과 점수 글자','fx.preview':'미리보기',
 'fx.first.title':'화면 효과는 어느 정도가 좋을까요?','fx.first.sub':'나중에 설정에서 언제든 바꿀 수 있어요.','fx.first.go':'이걸로 시작','fx.first.skip':'건너뛰기',
 'fx.first.device':'기기 설정에 맞춰 이 단계를 골라 뒀어요.','fx.first.note':'어느 쪽이든 점수와 보상은 같아요.',
 'fx.ariaLevels':'효과 강도','fx.ariaText':'글자 크기'
};
function L(key,vars){
 try{const I=root.MongyuI18n;if(I?.t){const v=I.t(key,vars);if(typeof v==='string'&&v&&v!==key)return v}}catch(_){}
 let s=KO[key]??key;if(vars)s=s.replace(/\{(\w+)\}/g,(m,k)=>vars[k]!=null?String(vars[k]):m);return s;
}
if(enabled&&root.MongyuI18n?.register){try{root.MongyuI18n.register('ko',KO)}catch(_){}}

/* ---------- DOM helpers ---------- */
const $=id=>doc?doc.getElementById(id):null;
function el(tag,attrs,parent){
 const n=doc.createElement(tag);
 if(attrs)for(const k of Object.keys(attrs)){const v=attrs[k];if(v===undefined||v===null||v===false)continue;if(k==='class')n.className=v;else if(k==='text')n.textContent=v;else n.setAttribute(k,v===true?'':v)}
 if(parent)parent.appendChild(n);return n;
}
const labelled=[];   // {node, attr, key} re-translated when the language changes
function tx(node,key,attr){labelled.push({node,key,attr});if(attr)node.setAttribute(attr,L(key));else node.textContent=L(key);return node}
function relabel(){for(const r of labelled){if(r.node.isConnected===false)continue;if(r.attr)r.node.setAttribute(r.attr,L(r.key));else r.node.textContent=L(r.key)}}
const glyph=name=>{const I=root.MongyuIcons;return I&&name?I.svg(name,{size:20}):''};
const LV_GLYPH={
 standard:'<svg viewBox="0 0 40 24" width="40" height="24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12c4-9 8 9 12 0s8 9 12 0 8 9 10 0" opacity=".95"/><path d="M3 18c4-6 8 6 12 0s8 6 12 0 8 6 10 0" opacity=".5"/></g></svg>',
 reduced:'<svg viewBox="0 0 40 24" width="40" height="24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12c5-3.5 9 3.5 14 0s9 3.5 14 0 5 1.5 6 0" opacity=".95"/><path d="M3 18h34" opacity=".35"/></g></svg>',
 minimal:'<svg viewBox="0 0 40 24" width="40" height="24" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 12h34" opacity=".95"/></g></svg>'
};

/* ---------- CSS (one injected sheet: settings section, first-run sheet, accessibility hooks) ---------- */
const CSS=`
html[data-ui-edition][data-fx=reduced] *,html[data-ui-edition][data-fx=reduced] *::before,html[data-ui-edition][data-fx=reduced] *::after{animation-iteration-count:1!important}
html[data-ui-edition][data-fx=reduced] .r105-fx-prev *{animation-iteration-count:infinite!important}
html[data-ui-edition][data-fx=minimal] *,html[data-ui-edition][data-fx=minimal] *::before,html[data-ui-edition][data-fx=minimal] *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;animation-delay:0s!important;transition-duration:.01ms!important;transition-delay:0s!important;scroll-behavior:auto!important}
/* fever = the HUD combo glow: full (standard), soft (reduced or a partial strength), outline only (off) */
html[data-ui-edition][data-fx-fever=outline] .r104-hud:is([data-combo="1"],[data-combo="2"],[data-combo="3"],[data-combo="4"]) :is(.r104-fill,.r104-fill-clip,.r104-head){filter:none!important;box-shadow:none!important}
html[data-ui-edition][data-fx-fever=outline] .r104-hud:is([data-combo="1"],[data-combo="2"],[data-combo="3"],[data-combo="4"]) .r104-fill-clip{outline:1px solid rgba(255,236,190,.9);outline-offset:1px}
html[data-ui-edition][data-fx-fever=outline] .r104-hud .r104-fill-clip::after{display:none!important}
html[data-ui-edition][data-fx-fever=soft] .r104-hud:is([data-combo="2"],[data-combo="3"],[data-combo="4"]) .r104-fill-clip{box-shadow:0 0 6px rgba(255,220,150,.5)!important}
html[data-ui-edition][data-fx-fever=soft] .r104-hud[data-combo="4"] .r104-head{box-shadow:0 0 6px 2px rgba(255,236,190,.6)!important}
html[data-ui-edition][data-fx-fever=soft] .r104-hud .r104-fill-clip::after{display:none!important}
html[data-ui-edition] #settings .r105-row[data-fx-legacy]{display:none!important}
html[data-ui-edition]:is([data-fx-text="120"],[data-fx-text="140"]) .r104-dock-text{font-size:calc(18px*var(--fx-text))!important;line-height:1.3!important;-webkit-line-clamp:3!important;line-clamp:3!important}
html[data-ui-edition]:is([data-fx-text="120"],[data-fx-text="140"]) .r104-streak{font-size:calc(12px*var(--fx-text))!important}
html[data-ui-edition]:is([data-fx-text="120"],[data-fx-text="140"]) .r104-gauge-cap{font-size:calc(12px*var(--fx-text))!important}
html[data-ui-edition]:is([data-fx-text="120"],[data-fx-text="140"]) #runnerSpeech{font-size:calc(12px*var(--fx-text))!important}
html[data-ui-edition]:is([data-fx-text="120"],[data-fx-text="140"]) #hudCue{font-size:calc(13px*var(--fx-text))!important}
@media (max-width:340px),(max-height:600px){html[data-ui-edition]:is([data-fx-text="120"],[data-fx-text="140"]) .r104-dock-text{font-size:calc(15px*var(--fx-text))!important}}
/* ---- settings section ---- */
html[data-ui-edition] #settings .r105-fx{font-family:var(--r105-font)}
html[data-ui-edition] #settings .r105-fx .r105-note{margin:2px 0 10px!important}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-seg{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:4px;border-radius:18px;background:rgba(10,6,24,.42);border:1px solid rgba(255,255,255,.09)}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-seg button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:56px;min-width:0;margin:0;padding:6px 4px;border:0;border-radius:14px;background:transparent;color:rgba(223,242,255,.78);font:700 15px/1.2 var(--r105-font);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-seg button svg{display:block;opacity:.85}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-seg button[aria-checked=true]{background:linear-gradient(180deg,var(--r105-gold-hi,#ffeca5),var(--r105-gold,#ffd98a));color:var(--r105-ink-on-gold,#4a2a08);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 3px 0 var(--r105-gold-edge,#b97d2e)}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-seg button:focus-visible,html[data-ui-edition] #settings .box .r105-fx .r105-fx-adv-toggle:focus-visible,html[data-ui-edition] #settings .box .r105-fx .r105-fx-reset:focus-visible{outline:3px solid var(--r105-aurora,#7ff3e1);outline-offset:2px}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-desc{margin:10px 2px 4px;min-height:2.7em;font-size:14px;line-height:1.45;color:#efe9fb;word-break:keep-all}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-sum{margin:0 2px 8px;font-size:13px;line-height:1.4;color:var(--r105-muted,rgba(223,242,255,.64));word-break:keep-all}
.r105-fx-prev{position:relative;height:58px;margin:4px 0 10px;border-radius:14px;overflow:hidden;background:#150e2c;border:1px solid rgba(255,255,255,.09)}
.r105-fx-prev .bg{position:absolute;inset:-4px -30px;background:repeating-linear-gradient(100deg,rgba(143,85,255,.0) 0 14px,rgba(255,63,180,.22) 14px 18px,rgba(25,227,255,.18) 18px 20px,rgba(143,85,255,0) 20px 34px);opacity:calc(.12 + .88*var(--fx-psy,1));animation:r105-fxbg 7s linear infinite;animation-play-state:running}
.r105-fx-prev .run{position:absolute;left:50%;bottom:9px;width:22px;height:34px;margin-left:-11px;border-radius:11px 11px 4px 4px;background:#0b0818;box-shadow:0 0 0 1.5px rgba(223,242,255,.7);animation:r105-fxhit 3.2s ease-out infinite}
.r105-fx-prev .run::after{content:'';position:absolute;left:5px;right:5px;top:-5px;height:9px;border-radius:50%;background:#0b0818;box-shadow:0 0 0 1.5px rgba(223,242,255,.7)}
.r105-fx-prev .ech{position:absolute;left:50%;bottom:9px;width:22px;height:34px;margin-left:-11px;border-radius:11px 11px 4px 4px;box-shadow:0 0 0 1.5px rgba(223,242,255,.7);opacity:calc(.55*var(--fx-echo,1));transform:translateX(calc(-14px*var(--fx-echo,1)));animation:r105-fxech 3.2s ease-out infinite}
.r105-fx-prev .ground{position:absolute;left:0;right:0;bottom:8px;height:1.5px;background:rgba(223,242,255,.4)}
@keyframes r105-fxbg{from{transform:translateX(0)}to{transform:translateX(calc(-34px*var(--fx-bg,1)))}}
@keyframes r105-fxhit{0%,70%,100%{transform:translate(0,0) scale(1)}74%{transform:translate(calc(var(--fx-shake,1)*-3px),calc(var(--fx-shake,1)*1px)) scale(calc(1 + .1*var(--fx-zoom,1)))}78%{transform:translate(calc(var(--fx-shake,1)*3px),calc(var(--fx-shake,1)*-1px)) scale(calc(1 + .12*var(--fx-zoom,1)))}84%{transform:translate(calc(var(--fx-shake,1)*-1.5px),0) scale(calc(1 + .08*var(--fx-zoom,1)))}92%{transform:translate(0,0) scale(1)}}
@keyframes r105-fxech{0%,70%,100%{opacity:0}74%{opacity:calc(.55*var(--fx-echo,1))}100%{opacity:0}}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-adv-toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:48px;margin:4px 0 0;padding:6px 4px;border:0;border-top:1px solid rgba(255,255,255,.07);border-radius:0;background:none;color:#f7f2ff;font:700 15px/1.3 var(--r105-font);text-align:left;cursor:pointer;touch-action:manipulation}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-adv-toggle i{font-style:normal;font-weight:500;font-size:13px;color:var(--r105-muted,rgba(223,242,255,.64))}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-adv-toggle::after{content:'';flex:none;width:18px;height:18px;background:currentColor;-webkit-mask:var(--r105-chev) center/contain no-repeat;mask:var(--r105-chev) center/contain no-repeat;transition:transform .15s}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-adv-toggle[aria-expanded=true]::after{transform:rotate(180deg)}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-adv[hidden]{display:none}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-tag{position:absolute;right:62px;top:50%;margin-top:-9px;font-size:12px;font-weight:700;color:var(--r105-muted,rgba(223,242,255,.64));pointer-events:none}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-reset{display:block;width:100%;min-height:44px;margin:6px 0 4px;padding:0 14px;border-radius:22px;border:1px solid var(--r105-line,rgba(255,255,255,.13));background:rgba(255,255,255,.08);color:var(--r105-ice,#dff2ff);font:700 14px/1 var(--r105-font);cursor:pointer;touch-action:manipulation}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-reset[hidden]{display:none}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-textrow{padding:8px 0 6px;border-top:1px solid rgba(255,255,255,.07)}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-textrow .cap{display:flex;flex-direction:column;gap:2px;margin:0 2px 8px}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-textrow .cap b{font-size:16px;color:#f7f2ff}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-textrow .cap i{font-style:normal;font-size:13px;color:var(--r105-muted,rgba(223,242,255,.64))}
html[data-ui-edition] #settings .box .r105-fx .r105-fx-seg.t button{min-height:48px}
/* ---- first-run choice sheet ---- */
.r105-fxs{position:fixed;inset:0;z-index:60;display:flex;align-items:flex-end;justify-content:center;font-family:var(--r105-font,system-ui,sans-serif);color:#f4eefc}
.r105-fxs[hidden]{display:none}
.r105-fxs .scrim{position:absolute;inset:0;background:rgba(10,6,24,.62);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
.r105-fxs .panel{position:relative;width:min(460px,100%);max-height:calc(100dvh - 8px);overflow-y:auto;padding:12px 18px calc(env(safe-area-inset-bottom) + 16px);border-radius:28px 28px 0 0;background:linear-gradient(180deg,#34285a 0%,#231a44 100%);border:1px solid rgba(255,255,255,.13);border-bottom:0;box-shadow:0 -10px 30px rgba(10,6,24,.45);animation:r105-fxslide .3s cubic-bezier(.2,.9,.25,1) both}
@keyframes r105-fxslide{from{transform:translateY(36px);opacity:0}}
.r105-fxs .grab{display:block;width:40px;height:4px;margin:0 auto 12px;border-radius:2px;background:rgba(255,255,255,.28)}
.r105-fxs h2{margin:0 0 4px;font-size:21px;line-height:1.3;font-weight:800;letter-spacing:-.01em;color:#fff;word-break:keep-all}
.r105-fxs .sub{margin:0 0 12px;font-size:14px;line-height:1.45;color:rgba(223,242,255,.7)}
.r105-fxs .opts{margin:0;padding:0;list-style:none;border-radius:18px;background:rgba(10,6,24,.36);border:1px solid rgba(255,255,255,.09);overflow:hidden}
.r105-fxs .opts button{display:flex;align-items:center;gap:12px;width:100%;min-height:64px;margin:0;padding:10px 14px;border:0;border-radius:0;background:transparent;color:#f4eefc;text-align:left;font-family:inherit;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
.r105-fxs .opts li+li button{border-top:1px solid rgba(255,255,255,.07)}
.r105-fxs .opts .gl{flex:none;display:grid;place-items:center;width:48px;height:36px;border-radius:12px;background:rgba(255,255,255,.07);color:var(--r105-ice,#dff2ff)}
.r105-fxs .opts .tx{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.r105-fxs .opts .tx b{font-size:17px;line-height:1.25}
.r105-fxs .opts .tx i{font-style:normal;font-size:13px;line-height:1.35;color:rgba(223,242,255,.7);word-break:keep-all}
.r105-fxs .opts .ck{flex:none;width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.35);display:grid;place-items:center}
.r105-fxs .opts button[aria-checked=true]{background:rgba(255,217,138,.12)}
.r105-fxs .opts button[aria-checked=true] .ck{border-color:var(--r105-gold,#ffd98a)}
.r105-fxs .opts button[aria-checked=true] .ck::after{content:'';width:12px;height:12px;border-radius:50%;background:var(--r105-gold,#ffd98a)}
.r105-fxs button:focus-visible{outline:3px solid var(--r105-aurora,#7ff3e1);outline-offset:-3px}
.r105-fxs .note{margin:10px 2px 12px;font-size:13px;line-height:1.4;color:rgba(223,242,255,.62)}
.r105-fxs .acts{display:flex;flex-direction:column;gap:6px}
.r105-fxs .go{min-height:52px;border:0;border-radius:26px;background:linear-gradient(180deg,var(--r105-gold-hi,#ffeca5),var(--r105-gold,#ffd98a));color:var(--r105-ink-on-gold,#4a2a08);font:800 17px/1 var(--r105-font,system-ui);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 4px 0 var(--r105-gold-edge,#b97d2e);cursor:pointer;touch-action:manipulation}
.r105-fxs .go:active{transform:translateY(2px);box-shadow:inset 0 2px 0 rgba(255,255,255,.55),0 2px 0 var(--r105-gold-edge,#b97d2e)}
.r105-fxs .skip{min-height:44px;border:0;border-radius:22px;background:transparent;color:rgba(223,242,255,.78);font:600 15px/1 var(--r105-font,system-ui);text-decoration:underline;text-underline-offset:3px;cursor:pointer;touch-action:manipulation}
@media (max-height:460px){
 .r105-fxs .panel{width:min(760px,100%);padding-top:8px}
 .r105-fxs .grab{display:none}.r105-fxs h2{font-size:18px}.r105-fxs .sub{margin-bottom:8px}
 .r105-fxs .opts{display:grid;grid-template-columns:repeat(3,1fr)}
 .r105-fxs .opts li+li button{border-top:0;border-left:1px solid rgba(255,255,255,.07)}
 .r105-fxs .opts button{flex-direction:column;align-items:flex-start;gap:6px;min-height:0;padding:8px 10px}
 .r105-fxs .opts .ck{position:absolute;right:8px;top:8px}.r105-fxs .opts li{position:relative}
 .r105-fxs .note{margin:6px 2px 8px}.r105-fxs .acts{flex-direction:row-reverse;align-items:center}.r105-fxs .go{flex:1;min-height:46px}.r105-fxs .skip{flex:none;padding:0 14px}
}
@media (max-width:340px){.r105-fxs h2{font-size:19px}.r105-fxs .opts .tx i{font-size:12.5px}.r105-fx-seg button{font-size:14px}}
@media (prefers-reduced-motion:reduce){.r105-fxs .panel{animation:none}}
html[data-fx=minimal] .r105-fxs .panel{animation:none}
`;
let cssNode=null;
function injectCss(){
 if(!doc||cssNode)return;
 try{cssNode=el('style',{id:'r105FxCss'},doc.head||doc.documentElement);cssNode.textContent=CSS}catch(_){cssNode=null}
}

/* ---------- settings section ---------- */
let sec=null;
const U={};   // live nodes
function summaryText(){
 const on=CHANNELS.filter(c=>valueOf(c)>0).map(c=>L('fx.short.'+c)+(valueOf(c)<.75?'('+L('fx.soft')+')':''));
 return on.length?L('fx.sumOn',{list:on.join(L('fx.sep'))}):L('fx.sumNone');
}
function syncSettings(){
 if(!sec)return;
 for(const b of U.levelBtns)b.setAttribute('aria-checked',String(b.dataset.level===S.level)),b.tabIndex=b.dataset.level===S.level?0:-1;
 for(const b of U.textBtns)b.setAttribute('aria-checked',String(Number(b.dataset.text)===S.text)),b.tabIndex=Number(b.dataset.text)===S.text?0:-1;
 const dkey=custom()?'fx.custom':'fx.desc.'+S.level;
 U.desc.textContent=L(dkey);
 U.sum.textContent=summaryText();
 for(const c of CHANNELS){
  const b=U.sw[c],v=valueOf(c),isOn=v>0;
  b.setAttribute('data-r105-on',isOn?'1':'0');b.setAttribute('aria-checked',String(isOn));
  U.rows[c].classList.toggle('is-off',!isOn);
  U.tags[c].textContent=isOn&&v<.75?L('fx.soft'):'';
 }
 U.reset.hidden=!custom();
}
function toggleChannel(c){
 const auto=TABLE[S.level][c];
 if(valueOf(c)>0)set(c,0);                              // on -> off
 else set(c,auto>0?null:TABLE.reduced[c]);              // off -> the level's own strength, or the gentle one when the level has none
}
function mountSettings(box){
 if(!enabled||!doc||sec)return sec;
 box=box||$('settings')?.querySelector?.('.box');if(!box)return null;
 injectCss();
 sec=el('section',{class:'r105-sec r105-fx','data-sec':'effects','aria-labelledby':'r105sec-effects'});
 const h=el('h2',{id:'r105sec-effects'},sec);
 const ic=el('span',{class:'r105-sec-ic','aria-hidden':'true'},h);ic.innerHTML=glyph('sparkle');
 tx(el('span',null,h),'fx.title');
 tx(el('p',{class:'r105-note'},sec),'fx.lead');
 // Level selector (radio group).
 const seg=el('div',{class:'r105-fx-seg',role:'radiogroup','aria-describedby':'r105FxDesc'},sec);tx(seg,'fx.ariaLevels','aria-label');
 U.levelBtns=[];
 for(const lv of LEVELS){
  const b=el('button',{type:'button',role:'radio','data-level':lv,'aria-checked':'false'},seg);
  const g=el('span',{'aria-hidden':'true'},b);g.innerHTML=LV_GLYPH[lv];
  tx(el('span',null,b),'fx.level.'+lv);
  b.onclick=()=>set(lv);
  U.levelBtns.push(b);
 }
 seg.addEventListener('keydown',e=>roving(e,U.levelBtns,b=>set(b.dataset.level)));
 U.desc=el('p',{id:'r105FxDesc',class:'r105-fx-desc','aria-live':'polite'},sec);
 // Live preview: a tiny runner that gets "hit" every few seconds with the current strengths.
 const prev=el('div',{class:'r105-fx-prev','aria-hidden':'true'},sec);
 el('div',{class:'bg'},prev);el('div',{class:'ground'},prev);el('div',{class:'ech'},prev);el('div',{class:'run'},prev);
 U.sum=el('p',{class:'r105-fx-sum'},sec);
 // Advanced: per-channel switches.
 const tg=el('button',{type:'button',class:'r105-fx-adv-toggle','aria-expanded':'false','aria-controls':'r105FxAdv'},sec);
 const tgt=el('span',null,tg);tx(el('b',null,tgt),'fx.adv');tgt.appendChild(doc.createTextNode(' '));tx(el('i',null,tgt),'fx.advSub');
 const adv=el('div',{id:'r105FxAdv',class:'r105-fx-adv',hidden:true},sec);
 tg.onclick=()=>{const open=tg.getAttribute('aria-expanded')!=='true';tg.setAttribute('aria-expanded',String(open));adv.hidden=!open};
 U.sw={};U.rows={};U.tags={};
 const ICONS={shake:'vibration',zoom:'play',echo:'sparkle',bgmotion:'moon',psy:'moon',haptics:'vibration',fever:'sparkle'};
 for(const c of CHANNELS){
  const row=el('div',{class:'r105-row','data-kind':'switch','data-fx-ch':c},adv);
  const rIc=el('span',{class:'r105-row-ic','aria-hidden':'true'},row);rIc.innerHTML=glyph(ICONS[c]);
  const t=el('span',{class:'r105-row-text','aria-hidden':'true'},row);tx(el('b',null,t),'fx.ch.'+c);tx(el('i',null,t),'fx.chSub.'+c);
  U.tags[c]=el('span',{class:'r105-fx-tag','aria-hidden':'true'},row);
  const b=el('button',{type:'button',role:'switch','data-r105-row':'switch','data-r105-on':'0','aria-checked':'false'},row);
  tx(b,'fx.ch.'+c,'aria-label');
  b.onclick=()=>toggleChannel(c);
  U.sw[c]=b;U.rows[c]=row;
 }
 U.reset=el('button',{type:'button',class:'r105-fx-reset',hidden:true},adv);tx(U.reset,'fx.reset');U.reset.onclick=()=>reset();
 // Text size.
 const tr=el('div',{class:'r105-fx-textrow'},sec);
 const cap=el('div',{class:'cap'},tr);tx(el('b',null,cap),'fx.text');tx(el('i',null,cap),'fx.textSub');
 const ts=el('div',{class:'r105-fx-seg t',role:'radiogroup'},tr);tx(ts,'fx.ariaText','aria-label');
 U.textBtns=[];
 for(const n of TEXTS){const b=el('button',{type:'button',role:'radio','data-text':String(n),'aria-checked':'false'},ts);b.textContent=n+'%';b.onclick=()=>set('text',n);U.textBtns.push(b)}
 ts.addEventListener('keydown',e=>roving(e,U.textBtns,b=>set('text',Number(b.dataset.text))));
 // Place it before the display section so the strength choice sits next to the other screen options.
 const screen=box.querySelector('[data-sec="screen"]'),head=box.querySelector('.r105-head');
 if(screen)box.insertBefore(sec,screen);else if(head)box.insertBefore(sec,head.nextSibling);else box.appendChild(sec);
 const markLegacy=id=>{const b=$(id),r=b?.closest?.('.r105-row');if(r)r.setAttribute('data-fx-legacy','1')};markLegacy('dreamIntensity');markLegacy('motion');
 off.push(on('change',syncSettings));
 syncSettings();
 return sec;
}
const off=[];
function roving(e,list,pick){
 const k=e.key;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(k))return;
 const i=list.indexOf(doc.activeElement);if(i<0)return;
 let n=i;if(k==='ArrowLeft'||k==='ArrowUp')n=(i+list.length-1)%list.length;else if(k==='ArrowRight'||k==='ArrowDown')n=(i+1)%list.length;else if(k==='Home')n=0;else n=list.length-1;
 e.preventDefault();pick(list[n]);list[n].focus?.();
}

/* ---------- first-run choice sheet ---------- */
let sheet=null,sheetPick='standard',sheetReturn=null;
function showFirstRun(force){
 if(!enabled||!doc?.body||sheet)return false;
 if(S.seen&&force!==true)return false;
 injectCss();
 sheetPick=S.level;sheetReturn=doc.activeElement;
 sheet=el('div',{class:'r105-fxs',role:'dialog','aria-modal':'true','aria-labelledby':'r105FxsTitle','aria-describedby':'r105FxsSub'});
 el('div',{class:'scrim'},sheet);
 const p=el('div',{class:'panel'},sheet);
 el('span',{class:'grab','aria-hidden':'true'},p);
 tx(el('h2',{id:'r105FxsTitle'},p),'fx.first.title');
 const sub=el('p',{id:'r105FxsSub',class:'sub'},p);tx(sub,S.system?'fx.first.device':'fx.first.sub');
 const ul=el('ul',{class:'opts',role:'radiogroup'},p);tx(ul,'fx.ariaLevels','aria-label');
 const btns=[];
 for(const lv of LEVELS){
  const li=el('li',null,ul),b=el('button',{type:'button',role:'radio','data-level':lv,'aria-checked':String(lv===sheetPick),tabindex:lv===sheetPick?'0':'-1'},li);
  const g=el('span',{class:'gl','aria-hidden':'true'},b);g.innerHTML=LV_GLYPH[lv];
  const t=el('span',{class:'tx'},b);tx(el('b',null,t),'fx.level.'+lv);tx(el('i',null,t),'fx.levelSub.'+lv);
  el('span',{class:'ck','aria-hidden':'true'},b);
  b.onclick=()=>{sheetPick=lv;for(const x of btns){const on=x===b;x.setAttribute('aria-checked',String(on));x.tabIndex=on?0:-1}};
  btns.push(b);
 }
 ul.addEventListener('keydown',e=>roving(e,btns,b=>b.click()));
 tx(el('p',{class:'note'},p),'fx.first.note');
 const acts=el('div',{class:'acts'},p);
 const go=el('button',{type:'button',class:'go'},acts);tx(go,'fx.first.go');
 const skip=el('button',{type:'button',class:'skip'},acts);tx(skip,'fx.first.skip');
 const close=commit=>{
  if(!sheet)return;
  if(commit&&sheetPick!==S.level)set(sheetPick);else set('seen',true);
  const n=sheet;sheet=null;n.remove();
  try{sheetReturn?.focus?.({preventScroll:true})}catch(_){}
 };
 go.onclick=()=>close(true);skip.onclick=()=>close(false);
 sheet.firstElementChild.onclick=()=>close(false);   // the scrim skips
 sheet.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(false);return}
  if(e.key==='Tab'){
   const f=[...sheet.querySelectorAll('button')].filter(x=>x.tabIndex>=0);if(!f.length)return;
   const a=doc.activeElement,i=f.indexOf(a);
   if(e.shiftKey&&(i<=0)){e.preventDefault();f[f.length-1].focus()}else if(!e.shiftKey&&(i===f.length-1||i<0)){e.preventDefault();f[0].focus()}
  }
 },true);
 doc.body.appendChild(sheet);
 try{(btns.find(b=>b.dataset.level===sheetPick)||btns[0]).focus({preventScroll:true})}catch(_){}
 return true;
}
/* The sheet appears once, over the lobby, before the first run can start. */
function scheduleFirstRun(){
 if(!enabled||!doc||S.seen)return;
 const go=()=>{try{if(!S.seen&&!sheet)showFirstRun()}catch(e){try{root.console?.error?.('[MongyuEffects]',e)}catch(_){}}};
 const arm=()=>root.setTimeout?.(go,700);
 if(doc.readyState==='complete')arm();else root.addEventListener?.('load',arm,{once:true});
}

/* ---------- boot ---------- */
if(enabled){
 load();
 try{
  const bus=root.MongyuPolish;
  if(bus?.on){
   bus.on('attach',()=>{
    // First sight of the host: an old saved "reduced" counts as the default when the player never chose a level.
    const s=hostSettings();if(!S.seen&&s&&s.reduced===true&&S.level==='standard')S.level='reduced';
    apply();
   });
   bus.on('frame',watchHost);
  }
 }catch(_){}
 if(doc){
  const start=()=>{injectCss();apply();scheduleFirstRun()};
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
 }
 try{root.MongyuI18n?.onChange?.(()=>{relabel();syncSettings()})}catch(_){}
}

const api=Object.freeze({enabled,LEVELS,CHANNELS,DERIVED,TEXTS,TABLE,KEY,get,value:valueOf,set,reset,on,feverStyle,echoCount,scaleMs,mountSettings,showFirstRun,syncHost,apply,relabel,
 get sheetOpen(){return !!sheet},get section(){return sec},_reload:()=>{load();apply();emit('change')}});
function get(){return snapshot()}
root.MongyuEffects=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
