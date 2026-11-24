'use strict';
// R105 workstream LB: the dark-psychedelic lobby scene (lobby-trip backdrop, jar glow, ripples, mandala rings, blinking eyes, motes,
// the dreamer on a stepping stone, neon logo), its layout in several viewports, and the lobby menu actions.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src');
function load(files,globals={}){
 const context=vm.createContext({console,structuredClone,Math,Date,Number,...globals});context.globalThis=context;
 for(const f of files)vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),context,{filename:f});
 return context;
}
/* Offscreen canvases (sprites) that swallow every call. */
function fakeFactory(log){
 return (w,h)=>{
  const ops=[];
  const g=new Proxy({},{get:(o,k)=>{
   if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});
   if(k in o)return o[k];
   return(...a)=>{ops.push([k,...a])};
  },set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:w,height:h,getContext:()=>g,ops,g};if(log)log.push(canvas);return canvas;
 };
}
/* Main context: records ops, composite switches and per-draw alpha. */
function recorder(){
 const ops=[];let alpha=1,comp='source-over';
 const g=new Proxy({},{get:(o,k)=>{
  if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});
  if(k in o)return o[k];
  return(...a)=>{ops.push([k,...a.map(x=>typeof x==='number'?Math.round(x*100)/100:x)].concat([{alpha,comp}]))};
 },set:(o,k,v)=>{if(k==='globalCompositeOperation'){comp=v;ops.push(['composite',v])}if(k==='globalAlpha')alpha=v;if(k==='filter')ops.push(['filter',v]);o[k]=v;return true}});
 return {g,ops};
}
const TRIP=path.join(SRC,'trip-palettes.js');
const scene=(globals={})=>{
 const c=load(['trip-palettes.js','lobby-scene.js'],{MONGYU_UI_EDITION:true,MongyuMobile:{sprite(){}},...globals});
 c.MongyuLobbyScene.setFactory(fakeFactory());return c.MongyuLobbyScene;
};
const VP={width:390,height:844,dpr:1};
const SIZES=[[390,844],[320,568],[412,915],[768,1024],[844,390],[640,360]];
void TRIP;

test('jar spec matches the measured moon jar of lobby-trip (ellipse centre ~50% x, 16% y, 376 px wide)',()=>{
 const S=scene(),m=S.IMG.moon;
 assert.equal(S.IMG.w,720);assert.equal(S.IMG.h,1279);
 assert.ok(Math.abs(m.x/S.IMG.w-.5)<.01,'centred horizontally');
 assert.ok(Math.abs(m.y/S.IMG.h-.16)<.01);
 assert.ok(Math.abs(m.rx*2/S.IMG.w-.52)<.02,'376 px wide');
 assert.ok(m.ry>m.rx*.8&&m.ry<m.rx*1.05,'slightly flattened');
 assert.ok(m.top<40&&m.bottom>360&&m.bottom<390,'neck lip and foot');
 for(const e of S.IMG.eyes){assert.ok(e.x>0&&e.x<S.IMG.w&&e.y>0&&e.y<S.IMG.h&&e.w>40&&e.h>10)}
 assert.equal(S.IMG.eyes.length,3);
});

test('layout: jar, logo, dreamer and menu do not overlap in portrait, small phone, tablet and landscape',()=>{
 const S=scene();
 for(const [w,h] of SIZES){
  const L=S.layout(w,h),m=L.moon,T=L.title;
  const inJar=(x,y)=>((x-m.x)/m.rx)**2+((y-m.y)/m.ry)**2<1;
  assert.ok(m.x-m.rx>=0&&m.x+m.rx<=w&&m.y-m.ry>=0&&m.y+m.ry<=h,'jar fully visible '+w+'x'+h);
  assert.ok(T.x-T.h>=0&&T.x+T.h<=w&&T.y-T.h/2>=0,'logo on screen '+w+'x'+h);
  // logo box vs the jar ellipse (sampled)
  for(let i=0;i<=8;i++)for(let j=0;j<=4;j++){
   const x=T.x-T.h+i/8*T.h*2,y=T.y-T.h/2+j/4*T.h;assert.ok(!inJar(x,y),'logo clear of the jar '+w+'x'+h+' @'+x+','+y);
  }
  assert.ok(L.hero.x-L.slab.rx>0&&L.hero.x+L.slab.rx<w&&L.hero.y<h,'dreamer on screen '+w+'x'+h);
  assert.ok(!inJar(L.hero.x,L.hero.y-L.hero.h*.5),'dreamer outside the jar '+w+'x'+h);
  if(!L.wide){
   assert.ok(L.ox<=1e-6&&L.ox+S.IMG.w*L.ps>=w-1e-6&&L.oy+S.IMG.h*L.ps>=h-1e-6,'backdrop covers the screen below the logo band '+w+'x'+h);
   const ctaTop=h-(S.DOCK_B+S.DOCK_H+S.CTA_GAP)-S.CTA_H;
   assert.equal(L.cta.top,ctaTop);
   assert.ok(L.hero.y<=ctaTop-20,'dreamer above the CTA '+w+'x'+h);
   assert.ok(m.y+m.ry<ctaTop,'jar above the CTA '+w+'x'+h);
   assert.ok(T.y+T.h/2<=L.oy+S.IMG.moon.top*L.ps+2,'logo above the jar lip '+w+'x'+h);
   if(!L.useSlab){
    const st=S.IMG.stone;assert.ok(Math.abs(L.hero.x-(L.ox+st.x*L.ps))<1e-6&&Math.abs(L.hero.y-(L.oy+st.y*L.ps))<1e-6,'dreamer stands on the stepping stone of the picture '+w+'x'+h);
   }
  }else{
   const colLeft=w-24-Math.min(280,w*.34);
   assert.ok(m.x+m.rx<=colLeft+4,'jar stays out of the right menu column '+w+'x'+h);
   assert.ok(L.hero.x+L.hero.h*.6<m.x-m.rx*.6||L.hero.y-L.hero.h>m.y+m.ry*.6,'dreamer clear of the jar '+w+'x'+h);
   assert.ok(L.useSlab,'landscape uses a procedural slab');
  }
 }
});

test('draw: lobby-trip is the backdrop (and lobby-psy is not used); no ctx.filter, no hue composite',()=>{
 const reqs=[];
 const S=scene({MongyuArt:{ready:id=>id==='lobby-trip',image:id=>{reqs.push(id);return {id}}}});
 const r=recorder();S.draw(r.g,{viewport:VP,time:3,reduced:false});
 const L=S.layout(390,844);
 const back=r.ops.find(o=>o[0]==='drawImage'&&o[1]&&o[1].id==='lobby-trip');assert.ok(back,'backdrop drawn');
 assert.ok(Math.abs(back[4]-S.IMG.w*L.ps)<.02&&Math.abs(back[5]-S.IMG.h*L.ps)<.02);assert.ok(back[4]>=390-.01&&back[5]>=844-.01);
 assert.ok(!reqs.includes('lobby-psy'));
 assert.ok(r.ops.some(o=>o[0]==='composite'&&o[1]==='lighter'),'additive overlays');
 assert.ok(!r.ops.some(o=>o[0]==='composite'&&o[1]==='hue'),'no hue breathing');
 assert.ok(!r.ops.some(o=>o[0]==='filter'));
 for(const f of ['lobby-scene.js','lobby-ui.js']){
  const src=fs.readFileSync(path.join(SRC,f),'utf8');
  assert.ok(!src.includes('lobby-psy'),f+' no old backdrop id');assert.ok(!/\.filter\s*=/.test(src)&&!src.includes('ctx.filter'));
 }
 // a backdrop that is still decoding is skipped without throwing
 const S2=scene({MongyuArt:{ready:()=>false,image:()=>null}});
 assert.equal(S2.draw(recorder().g,{viewport:VP,time:0}).kind,'r105-lobby');
});

test('landscape: the jar is fitted to the height; the picture melts into the dark base beside the menu column',()=>{
 const S=scene({MongyuArt:{ready:()=>true,image:id=>({id})}});
 const L=S.layout(844,390);
 assert.ok(L.moon.ry*2<=390*.92&&L.moon.ry*2>=390*.7,'jar fills most of the height');
 const r=recorder();S.draw(r.g,{viewport:{width:844,height:390,dpr:1},time:1});
 assert.equal(S.draw(recorder().g,{viewport:{width:844,height:390,dpr:1},time:1}).kind,'r105-lobby');
 assert.ok(r.ops.filter(o=>o[0]==='fillRect').length>=3,'edge fades are painted');
});

test('palette: only the violet trip (violet / magenta / cyan accent) - no rainbow bands in the scene or the lobby styles',()=>{
 const src=fs.readFileSync(path.join(SRC,'lobby-scene.js'),'utf8');
 for(const bad of ['#a6ff4a','#ffe04a','#ff8a4a','#a6ff6a','#ffe66a','#8cff6b','#30e6ff','PAL.band','conic-gradient'])assert.ok(!src.includes(bad),bad);
 assert.match(src,/MongyuTrip\?\.get\?\.\('violet'\)/);
 const css=fs.readFileSync(path.join(SRC,'..','css','r104-ui.css'),'utf8');
 const iris=/--r105-iris:linear-gradient\(([^;]*?)\)\}/.exec(css);assert.ok(iris,'iris variable');
 const cols=iris[1].match(/#[0-9a-f]{6}/gi);assert.ok(cols.length>=3);
 const hue=c=>{const n=parseInt(c.slice(1),16),r=(n>>16)/255,g=((n>>8)&255)/255,b=(n&255)/255,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;
  let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;h*=60;return h<0?h+360:h};
 for(const c of cols){const h=hue(c);assert.ok(h>=255&&h<=345,'border colour in the violet-magenta family: '+c+' hue '+Math.round(h))}
 assert.ok(!/#6ff0ff,#a6ff6a/.test(css));
});

test('motion: jar glow breathes +-6% with a >= 6 s period; rings turn once per >= 40 s; ripples stay at alpha <= .25',()=>{
 const src=fs.readFileSync(path.join(SRC,'lobby-scene.js'),'utf8');
 assert.match(src,/\.06\*Math\.sin\(t\*TAU\/7\.5\)/);
 assert.match(src,/t\/64\*TAU/);assert.match(src,/-t\/96\*TAU/);
 const S=scene();
 // the first additive drawImage after the 'lighter' switch is the jar glow
 const glowAlpha=t=>{const r=recorder();S.draw(r.g,{viewport:VP,time:t,reduced:false});const i=r.ops.findIndex(o=>o[0]==='composite'&&o[1]==='lighter');
  const d=r.ops.slice(i).find(o=>o[0]==='drawImage');return d[d.length-1].alpha};
 let lo=9,hi=0;for(let t=0;t<15;t+=.25){const a=glowAlpha(t);lo=Math.min(lo,a);hi=Math.max(hi,a)}
 assert.ok(hi/lo<=1.13&&hi/lo>1.05,'breath amplitude +-6%: '+hi/lo);
 assert.ok(Math.abs(glowAlpha(2)-glowAlpha(9.5))<1e-9,'7.5 s period');
 // ripples
 let rings=0;
 for(let t=0;t<40;t+=.5){
  const r=recorder();S.draw(r.g,{viewport:VP,time:t,reduced:false});
  for(const o of r.ops)if(o[0]==='ellipse'){const info=o[o.length-1];if(info.comp==='lighter'){rings++;assert.ok(info.alpha<=.2501,'ripple alpha '+info.alpha)}}
 }
 assert.ok(rings>40,'ripples are drawn: '+rings);
 // nothing is animated by the clock when reduced
 const a=recorder(),b=recorder();
 S.draw(a.g,{viewport:VP,time:3,reduced:true});S.draw(b.g,{viewport:VP,time:50,reduced:true});
 assert.deepEqual(a.ops,b.ops);
});

test('eyes: slow blinks at the picture eyes (about 1.4 s, never while reduced)',()=>{
 const S=scene();
 const clips=(t,red)=>{const r=recorder();S.draw(r.g,{viewport:VP,time:t,reduced:red});return r.ops.filter(o=>o[0]==='clip').length};
 assert.ok(clips(.7,false)>=1,'first eye is closed mid-blink at 0.7 s');
 assert.equal(clips(5,false),0,'eyes open between blinks');
 let blinking=0,n=0;for(let t=0;t<120;t+=.1){n++;if(clips(t,false)>0)blinking++}
 assert.ok(blinking/n<.45,'eyes are open most of the time: '+blinking/n);
 for(const t of [.7,20,77])assert.equal(clips(t,true),0,'reduced: no blink at '+t);
 const src=fs.readFileSync(path.join(SRC,'lobby-scene.js'),'utf8');
 assert.match(src,/d=1\.4\/per/);assert.match(src,/per=9\.5\+i\*1\.7/);
});

test('draw: one dreamer sprite per frame, on the stone; the logo is baked (no per-frame colour cycling)',()=>{
 let n=0;const S=scene({MongyuMobile:{sprite(){n++}}});
 S.draw(recorder().g,{viewport:{width:844,height:390,dpr:2},time:1,reduced:false});assert.equal(n,1);
 assert.equal(S.cached,'844x390@2');
 const src=fs.readFileSync(path.join(SRC,'lobby-scene.js'),'utf8');
 assert.match(src,/#8d55ff/);assert.match(src,/#ff3fb4/);assert.match(src,/P\.accent/);
 assert.ok(!/hsl\(/.test(src),'no hue cycling');
});

test('the old scene (spiral moon, rainbow rim, floating slab, hue breath) is gone',()=>{
 const src=fs.readFileSync(path.join(SRC,'lobby-scene.js'),'utf8');
 for(const w of ['buildSpiral','paintSpiral','spiralState','PAL.band','pavilion','firefl','fogBand','roadIsland','iridescent'])assert.ok(!src.includes(w),w);
});

test('lobby ui keeps every action: CTA enters the road via MongyuRoad.nextCourseId() (fallback: its own logic, then c1); dock targets are unchanged',()=>{
 const src=fs.readFileSync(path.join(SRC,'lobby-ui.js'),'utf8');
 assert.match(src,/MongyuRoad\.start\(nextCourseId\(\),event\)/);
 assert.match(src,/R0\.nextCourseId\(\)/);
 for(const t of ['restorationOpen','shopOpen','storyOpen'])assert.ok(src.includes(t),t);
 assert.match(src,/function startMode/);
 assert.match(src,/return 'c1'/);
});

test('English table: every key defined for en also has its Korean text (the lookup falls back en when ko lacks a key)',()=>{
 const reg={ko:{},en:{}};
 const ctx=vm.createContext({console,MONGYU_UI_EDITION:true});ctx.globalThis=ctx;
 ctx.MongyuI18n={register(lang,table){Object.assign(reg[lang],table||{})}};
 vm.runInContext(fs.readFileSync(path.join(SRC,'i18n-en-lobby.js'),'utf8'),ctx);
 const koMain={};
 const ctx2=vm.createContext({console,MONGYU_UI_EDITION:true});ctx2.globalThis=ctx2;
 ctx2.MongyuI18n={register(lang,table){if(lang==='ko')Object.assign(koMain,table||{})}};
 try{vm.runInContext(fs.readFileSync(path.join(SRC,'i18n-ko.js'),'utf8'),ctx2)}catch(_){}
 for(const k of Object.keys(reg.en))assert.ok(k in reg.ko||k in koMain,'ko text for '+k);
 assert.equal(reg.ko['lobby.modes'],'다른 꿈');
});

test('stylesheet: violet-magenta hairlines on the CTA and dock, animation off when motion is reduced',()=>{
 const css=fs.readFileSync(path.join(SRC,'..','css','r104-ui.css'),'utf8');
 assert.match(css,/--r105-iris:linear-gradient/);
 assert.match(css,/:is\(\.r105-cta,\.r105-dock\)::before\{[^}]*mask/);
 assert.match(css,/body\[data-dream-motion=reduced\] :is\(\.r105-cta,\.r105-dock\)::before/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{[\s\S]*?:is\(\.r105-cta,\.r105-dock\)::before\{animation:none!important/);
 assert.match(css,/--r105-dock-h:66px/);
});

test('CTA starts the course MongyuRoad.nextCourseId() names; without it the old star/unlock logic; without both course 1',()=>{
 const run=(Road,Course)=>{
  const got=[];
  const c=load(['lobby-ui.js'],{MONGYU_UI_EDITION:true,MongyuRoad:{start:(id)=>{got.push(id)},...Road},MongyuCourse:Course});
  c.MongyuLobbyUi.startRoad({});return got;
 };
 assert.deepEqual(run({nextCourseId:()=>'c13'}),['c13']);
 assert.deepEqual(run({nextCourseId:()=>{throw new Error('x')}}),['c1'],'throwing function falls back to course 1');
 assert.deepEqual(run({}),['c1'],'no data: course 1');
 const course={CHAPTER1:{courses:[{id:'c1'},{id:'c2'},{id:'c3'}]}};
 const road={read:()=>({}),entry:(d,id)=>({stars:id==='c1'?2:0}),unlocked:(i)=>i<2};
 assert.deepEqual(run(road,course),['c2'],'first unlocked course without a star');
});
