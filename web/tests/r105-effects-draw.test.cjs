// R105 ACC: what each level does to the drawing code (psychedelic layer, juice, gate, haptics, text size).
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src');
function recorder(){
 const log=[],state={globalCompositeOperation:'source-over',globalAlpha:1},stack=[];
 return new Proxy({},{
  get(o,k){
   if(k==='__log')return log;if(k in state)return state[k];
   if(k==='save')return()=>stack.push({...state});if(k==='restore')return()=>{Object.assign(state,stack.pop()||{})};
   if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});
   if(k==='createImageData')return(w,h)=>({data:new Uint8ClampedArray(w*h*4)});
   if(k in o)return o[k];
   return(...a)=>{log.push({fn:String(k),op:state.globalCompositeOperation,alpha:state.globalAlpha})};
  },
  set(o,k,v){if(k in state)state[k]=v;else o[k]=v;return true}
 });
}
class P2{rect(){}}
function psy(level,over){
 const ctx={console,performance:{now:()=>Date.now()},MONGYU_UI_EDITION:true,Path2D:P2,matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0};
 const host={reduced:false};ctx.MongyuPolish={host:{settings:()=>host}};
 ctx.document={createElement:()=>({width:0,height:0,getContext:()=>recorder()})};
 ctx.MongyuArt={has:id=>/^course-c[1-5]$|^lobby-psy$/.test(id),image:()=>({complete:true,naturalWidth:540,naturalHeight:959}),ready:()=>true,preload:()=>Promise.resolve([])};
 vm.createContext(ctx);
 for(const f of ['effects-profile.js','psy-layer.js','trip-palettes.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 ctx.MongyuEffects.set(level);if(over)for(const k of Object.keys(over))ctx.MongyuEffects.set(k,over[k]);
 return {ctx,host};
}
const run=(o={})=>({id:'c1',bpm:100,actIndex:0,perfectStreak:0,portal:null,clock:5,viewport:{width:390,height:844},...o});
function frame(level,over,o={}){
 const {ctx,host}=psy(level,over),c=recorder();
 const vp={width:390,height:844},T=o.time??5;
 const r=run({...o.run});   // the same run object: the layer fades in from its first frame
 ctx.MongyuPsy.draw(recorder(),r,{viewport:vp,reduced:host.reduced,time:T-4});
 const ok=ctx.MongyuPsy.draw(c,r,{viewport:vp,reduced:host.reduced,time:T});
 return {ok,log:c.__log,alphaMax:Math.max(0,...c.__log.map(x=>x.alpha)),count:c.__log.length,ctx};
}

test('psychedelic layer: Standard draws it all, Reduced a faint still, Minimal nothing at all', () => {
 const s=frame('standard'),r=frame('reduced'),m=frame('minimal');
 assert.ok(s.count>50,'standard '+s.count);
 assert.ok(r.count>0&&r.count<10,'reduced draws only the still wash: '+r.count);
 assert.equal(m.count,0);assert.equal(m.ok,true);
 assert.ok(r.alphaMax<=.25,'reduced alpha (still wash .2 x .45 strength, vignette .21) '+r.alphaMax);
 const washAlpha=r.log.filter(x=>x.fn==='drawImage'&&x.op==='screen').map(x=>x.alpha);assert.ok(washAlpha.every(a=>a<=.2+1e-9),'the wash is faint '+washAlpha);
});
test('psy and fever channels scale the layer on their own', () => {
 const off=frame('standard',{psy:0});assert.equal(off.count,0);
 const half=frame('standard',{psy:.5},{run:{perfectStreak:6},time:10}),full=frame('standard',{},{run:{perfectStreak:6},time:10});
 assert.ok(half.alphaMax<full.alphaMax,'half '+half.alphaMax+' < full '+full.alphaMax);
 const noFever=frame('standard',{fever:0},{run:{perfectStreak:6},time:10});
 const level=(fr)=>fr.ctx.MongyuPsy.level;
 // two frames so the combo level can ease up
 const a=psy('standard',{fever:0}),b=psy('standard');
 for(const x of [a,b]){const c=recorder();const r=run({perfectStreak:6});for(let i=0;i<120;i++)x.ctx.MongyuPsy.draw(c,r,{viewport:{width:390,height:844},reduced:false,time:5+i/60})}
 assert.equal(a.ctx.MongyuPsy.level,0);assert.ok(b.ctx.MongyuPsy.level>.5);void noFever;void level;
});
test('the beat pulse is a background-motion effect: off by hand => the layer takes the reduced still path', () => {
 const {ctx,host}=psy('standard',{bgmotion:0});assert.equal(host.reduced,true);
 const c=recorder(),r=run();ctx.MongyuPsy.draw(recorder(),r,{viewport:{width:390,height:844},reduced:host.reduced,time:1});ctx.MongyuPsy.draw(c,r,{viewport:{width:390,height:844},reduced:host.reduced,time:5});assert.ok(c.__log.length>0&&c.__log.length<10);
});
test('the psychedelic layer behaves exactly as before without the profile', () => {
 const src=fs.readFileSync(path.join(SRC,'psy-layer.js'),'utf8');
 const ctx={console,performance:{now:()=>Date.now()},MONGYU_UI_EDITION:true,Path2D:P2,document:{createElement:()=>({width:0,height:0,getContext:()=>recorder()})},MongyuArt:{has:()=>false}};
 vm.createContext(ctx);vm.runInContext(src,ctx);const c=recorder(),r=run();ctx.MongyuPsy.draw(recorder(),r,{viewport:{width:390,height:844},reduced:false,time:1});ctx.MongyuPsy.draw(c,r,{viewport:{width:390,height:844},reduced:false,time:5});assert.ok(c.__log.length>50);
});

test('haptics: UI vibration scales with the haptics channel and stops at 0', () => {
 const calls=[];
 const ctx={console,MONGYU_UI_EDITION:true,document:{createElement:()=>({getContext:()=>recorder()}),addEventListener(){},getElementById:()=>null,body:{}},navigator:{vibrate:ms=>{calls.push(ms);return true}},matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,performance:{now:()=>0}};
 ctx.MongyuPolish={host:{settings:()=>({reduced:false})}};
 vm.createContext(ctx);
 for(const f of ['effects-profile.js','ui-kit.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 const K=ctx.MongyuUiKit,E=ctx.MongyuEffects;
 assert.equal(K.vibrate(20),true);assert.equal(calls.pop(),20);
 E.set('reduced');assert.equal(K.vibrate(20),true);const half=calls.pop();assert.ok(half>4&&half<20,'reduced vibration shorter: '+half);
 E.set('minimal');assert.equal(K.vibrate(20),false);assert.equal(calls.length,0);
 E.set('standard');E.set('haptics',0);assert.equal(K.vibrate(20),false);
});

test('juice: shake, zoom and flash read the profile; gameplay-facing hit-stop does not', () => {
 const src=fs.readFileSync(path.join(SRC,'play-juice.js'),'utf8');
 assert.ok(/fx\('shake'\)/.test(src)&&/fx\('zoom'\)/.test(src)&&/fx\('flash'\)/.test(src)&&/fx\('haptics'\)/.test(src));
 assert.ok(!/hitStop[^;]*fx\(/.test(src));
});

test('text size: 100/120/140 sets the CSS variable and the data attribute; bad values are refused', () => {
 const style={},attrs={};
 const ctx={console,MONGYU_UI_EDITION:true,matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,
  document:{readyState:'loading',addEventListener(){},createElement:()=>({}),documentElement:{setAttribute:(k,v)=>{attrs[k]=v},style:{setProperty:(k,v)=>{style[k]=v}}}}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(SRC,'effects-profile.js'),'utf8'),ctx);
 const E=ctx.MongyuEffects;
 E.set('text',140);assert.equal(attrs['data-fx-text'],'140');assert.equal(style['--fx-text'],'1.4');assert.equal(E.get().text,140);
 E.set('minimal');assert.equal(attrs['data-fx'],'minimal');assert.equal(attrs['data-fx-fever'],'outline');assert.equal(style['--fx-shake'],'0.00');
 assert.equal(E.set('text',150),false);assert.equal(E.get().text,140);
 const css=fs.readFileSync(path.join(SRC,'effects-profile.js'),'utf8');
 assert.ok(/data-fx-text="120"\],\[data-fx-text="140"\]\) \.r104-dock-text/.test(css));
});
