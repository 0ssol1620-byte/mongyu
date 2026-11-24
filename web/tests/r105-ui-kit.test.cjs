'use strict';
// R105 workstream E2: icon set, menu sounds, design-system helpers, lobby scene, lobby UI contracts.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src');
function load(files,globals={}){
 const context=vm.createContext({console,structuredClone,Math,Date,Number,...globals});context.globalThis=context;
 for(const f of files)vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),context,{filename:f});
 return context;
}
const REQUIRED=['play','map','wardrobe','story','moon','infinity','star','sparkle','door','settings','close','back','sound','vibration','accessibility','share','poster','video','check','lock','heart'];

test('icons: full set, one stroke style, no glyph characters',()=>{
 const c=load(['ui-icons.js'],{MONGYU_UI_EDITION:true}),I=c.MongyuIcons;
 assert.equal(I.enabled,true);
 for(const n of REQUIRED)assert.ok(I.has(n),'missing icon '+n);
 for(const n of I.names){
  const s=I.svg(n,{size:30,class:'x y'});
  assert.match(s,/^<svg [^>]*viewBox="0 0 24 24"/,n);
  assert.match(s,/stroke-width="2"/);assert.match(s,/stroke-linecap="round"/);assert.match(s,/stroke-linejoin="round"/);
  assert.match(s,/width="30" height="30"/);assert.match(s,/class="x y"/);
  assert.doesNotMatch(s,/[^\x00-\x7f]/,n+' must not contain unicode glyphs');
  assert.doesNotMatch(s,/<text/,n);
  assert.match(I.uri(n),/^data:image\/svg\+xml,/);
 }
 assert.equal(I.svg('nope'),'');
 assert.equal(I.svg('play',{title:'<b>'}).includes('<b>'),false,'title text is sanitized');
});

test('icons: inert outside the R105 build flag, still callable',()=>{
 const c=load(['ui-icons.js']);assert.equal(c.MongyuIcons.enabled,false);
});

test('menu sounds: three quiet tones that start and end at zero',()=>{
 const c=load(['game-sfx.js'],{MONGYU_UI_EDITION:true}),S=c.MongyuSFX;
 for(const kind of ['ui-tap','ui-open','ui-close']){
  assert.ok(S.configs[kind],kind+' registered');assert.ok(S.UI_KINDS.includes(kind));
  const d=S.renderUi(kind,48000);let peak=0;for(const x of d){assert.ok(Number.isFinite(x));peak=Math.max(peak,Math.abs(x))}
  assert.ok(d.length>3000&&d.length<30000,kind+' length');assert.ok(peak>.01&&peak<.1,kind+' peak '+peak);assert.equal(d[0],0);assert.equal(d[d.length-1],0);
 }
 const again=S.renderUi('ui-tap',48000),first=S.renderUi('ui-tap',48000);assert.deepEqual([...again.slice(0,50)],[...first.slice(0,50)],'deterministic');
});

function fakeCanvasFactory(log){
 return (w,h)=>{
  const calls=[];
  const g=new Proxy({},{get:(o,k)=>{
   if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});
   if(k in o)return o[k];
   return(...a)=>{calls.push(k)};
  },set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:w,height:h,getContext:()=>g,calls};log.push(canvas);return canvas;
 };
}
function recorder(){
 const ops=[];
 const g=new Proxy({},{get:(o,k)=>{
  if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});
  if(k in o)return o[k];
  return(...a)=>{ops.push([k,...a.map(x=>typeof x==='number'?Math.round(x*100)/100:typeof x)])};
 },set:(o,k,v)=>(o[k]=v,true)});
 return {g,ops};
}

test('lobby scene: caches static layers per viewport and draws only composites per frame',()=>{
 const sprites=[];let sprite=0;
 const c=load(['lobby-scene.js'],{MONGYU_UI_EDITION:true,MongyuMobile:{sprite(){sprite++}}}),S=c.MongyuLobbyScene;
 S.setFactory(fakeCanvasFactory(sprites));
 const r1=recorder();
 const res=S.draw(r1.g,{viewport:{width:390,height:844,dpr:2},time:1.25,reduced:false});
 assert.equal(res.kind,'r105-lobby');assert.equal(S.cached,'390x844@2');
 const built=sprites.length;assert.ok(built>=8,'static layers are offscreen sprites: '+built);
 const r2=recorder();S.draw(r2.g,{viewport:{width:390,height:844,dpr:2},time:2.5,reduced:false});
 assert.equal(sprites.length,built,'no new sprites for an unchanged viewport');
 assert.ok(sprite>=2,'dreamer is drawn each frame through MongyuMobile.sprite (one call per draw)');
 assert.ok(r2.ops.filter(o=>o[0]==='drawImage').length>20,'frame is mostly drawImage composites');
 S.draw(recorder().g,{viewport:{width:844,height:390,dpr:2},time:0,reduced:false});
 assert.equal(S.cached,'844x390@2');assert.ok(sprites.length>built,'new viewport rebuilds');
});

test('lobby scene: reduced motion freezes particles, fog and parallax',()=>{
 const c=load(['lobby-scene.js'],{MONGYU_UI_EDITION:true,MongyuMobile:{sprite(){}}}),S=c.MongyuLobbyScene;
 S.setFactory(fakeCanvasFactory([]));
 const a=recorder(),b=recorder();
 S.draw(a.g,{viewport:{width:390,height:844,dpr:1},time:3,reduced:true});
 S.draw(b.g,{viewport:{width:390,height:844,dpr:1},time:97.5,reduced:true});
 assert.deepEqual(a.ops,b.ops,'reduced frames are identical regardless of time');
 const m=recorder(),n=recorder();
 S.draw(m.g,{viewport:{width:390,height:844,dpr:1},time:3,reduced:false});
 S.draw(n.g,{viewport:{width:390,height:844,dpr:1},time:4.1,reduced:false});
 assert.notDeepEqual(m.ops,n.ops,'normal frames move');
});

test('title canvas delegates to the lobby scene only in the R105 build',()=>{
 const make=flag=>{const seen=[];const c=load(['mobile-presentation.js'],{MONGYU_UI_EDITION:flag,MongyuLobbyScene:{enabled:true,draw(ctx,opt){seen.push(opt);return {kind:'r105-lobby'}}},MongyuOpening:{drawLobby(){return {kind:'old'}}},MONGYU_DREAM_EDITION:true,document:undefined});return {c,seen}};
 const on=make(true);
 if(on.c.MongyuMobile){const r=on.c.MongyuMobile.title({},{viewport:{width:390,height:844},time:0});assert.equal(r.kind,'r105-lobby');assert.equal(on.seen.length,1)}
 const off=make(undefined);
 if(off.c.MongyuMobile){const r=off.c.MongyuMobile.title({},{viewport:{width:390,height:844},time:0});assert.notEqual(r.kind,'r105-lobby');assert.equal(off.seen.length,0)}
});

test('ui kit: L() falls back to Korean and honours MongyuI18n.t',()=>{
 let c=load(['ui-kit.js'],{MONGYU_UI_EDITION:true});
 assert.equal(c.MongyuUiKit.L('x.y','기본'),'기본');
 c=load(['ui-kit.js'],{MONGYU_UI_EDITION:true,MongyuI18n:{t:(k,f)=>k==='x.y'?'Default':k}});
 assert.equal(c.MongyuUiKit.L('x.y','기본'),'Default');
 assert.equal(c.MongyuUiKit.L('missing','대체'),'대체','an untranslated key (echoed back) uses the fallback');
 assert.equal(c.MongyuUiKit.tokens.staggerMs,40);assert.equal(c.MongyuUiKit.tokens.gateMs,400);assert.equal(c.MongyuUiKit.tokens.pressMs,80);
});

test('ui kit: stagger numbers items in 40 ms steps; transition runs the callback exactly once',()=>{
 const c=load(['ui-kit.js'],{MONGYU_UI_EDITION:true}),K=c.MongyuUiKit;
 const mk=()=>{const cls=new Set(),vars={};return {classList:{add:x=>cls.add(x)},style:{setProperty:(k,v)=>vars[k]=v},cls,vars}};
 const kids=[mk(),mk(),mk()],host={children:kids,querySelectorAll:()=>kids};
 assert.equal(K.stagger(host,{start:1}),3);
 assert.deepEqual(kids.map(k=>k.vars['--i']),['1','2','3']);assert.ok(kids.every(k=>k.cls.has('r105-in')&&k.vars['--r105-step']==='40ms'));
 let n=0;assert.equal(K.transition(()=>{n++;return 'ok'}),'ok');assert.equal(n,1);
});

test('ui kit: switch state is read from aria-pressed (mute is inverted)',()=>{
 const c=load(['ui-kit.js'],{MONGYU_UI_EDITION:true,MongyuIcons:{svg:n=>'<svg data-n="'+n+'"/>'}}),K=c.MongyuUiKit;
 const make=(id,pressed)=>{const attrs={'aria-pressed':String(pressed)},row={classList:{contains:x=>x==='r105-row',toggle(){}},querySelector:()=>icon,removeAttribute(){},setAttribute(){}},icon={getAttribute:k=>icon.n,setAttribute(k,v){icon.n=v},set innerHTML(v){icon.html=v}};
  return {id,nodeType:1,hidden:false,parentNode:row,getAttribute:k=>attrs[k]??null,setAttribute:(k,v)=>attrs[k]=v,textContent:'',attrs,icon}};
 const mute=make('mute',false);K.syncControl(mute);assert.equal(mute.attrs['data-r105-on'],'1','not muted = switch on');assert.equal(mute.icon.n,'sound');
 const muted=make('mute',true);K.syncControl(muted);assert.equal(muted.attrs['data-r105-on'],'0');assert.equal(muted.icon.n,'sound-off');
 const cvd=make('cvdMode',true);K.syncControl(cvd);assert.equal(cvd.attrs['data-r105-on'],'1');
 const slider={min:'0',max:'100',value:'25',style:{v:{},setProperty(k,v){this.v[k]=v}}};K.syncSlider(slider);assert.equal(slider.style.v['--r105-fill'],'25.0%');
});

test('lobby ui: road entry is feature-detected; modes go through MongyuModes.startMode',()=>{
 let c=load(['lobby-ui.js'],{MONGYU_UI_EDITION:true});
 assert.equal(c.MongyuLobbyUi.roadEntry(),'continue','no road module: falls back to the old 꿈속으로');
 const calls=[];
 c=load(['lobby-ui.js'],{MONGYU_UI_EDITION:true,MongyuRoad:{start:(id,e)=>{calls.push(['road',e,id]);return true}},MongyuModes:{startMode:(k,e)=>{calls.push([k,e]);return true}}});
 assert.equal(c.MongyuLobbyUi.roadEntry(),'api');
 const ev={isTrusted:true};
 c.MongyuLobbyUi.startRoad(ev);c.MongyuLobbyUi.startMode('daily',ev);
 assert.deepEqual(calls.map(x=>x[0]),['road','daily']);assert.equal(calls[0][2],'c1','the CTA passes a course id (first run: course 1)');assert.ok(calls.every(x=>x[1]===ev),'the trusted event reaches the handlers (audio unlock)');
 c=load(['lobby-ui.js'],{MONGYU_UI_EDITION:true,MongyuRoad:{}});assert.equal(c.MongyuLobbyUi.roadEntry(),'continue');
});

test('R103/R104 builds are untouched: every module is inert without the flag',()=>{
 const c=load(['ui-icons.js','ui-kit.js','lobby-scene.js','lobby-ui.js']);
 for(const k of ['MongyuIcons','MongyuUiKit','MongyuLobbyScene','MongyuLobbyUi'])assert.equal(c[k].enabled,false,k);
 assert.equal(c.MongyuUiKit.init(),undefined);
});

test('stylesheet only styles the R105 edition',()=>{
 const css=fs.readFileSync(path.join(SRC,'..','css','r104-ui.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const top=sel=>{const out=[];let depth=0,cur='';for(const ch of sel){if(ch==='('||ch==='[')depth++;if(ch===')'||ch===']')depth--;if(ch===','&&depth===0){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out.map(x=>x.trim()).filter(Boolean)};
 // Walk top-level rules and @media blocks; @keyframes bodies are exempt.
 let depth=0,buf='',checked=0;const stack=[];
 for(const ch of css){
  if(ch==='{'){const head=buf.trim();buf='';stack.push(head);if(!head.startsWith('@')&&!stack.slice(0,-1).some(h=>h.startsWith('@keyframes'))){for(const part of top(head)){assert.ok(part.includes('data-ui-edition'),'unscoped selector: '+part);checked++}}}
  else if(ch==='}'){stack.pop();buf=''}
  else buf+=ch;
 }
 assert.ok(checked>100,'checked '+checked+' selectors');
});
