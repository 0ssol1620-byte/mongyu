'use strict';
// R105 workstream P: the psychedelic lobby scene (backdrop cover-fit, live moon spiral, gentle overlays, layout in several viewports).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src');
function load(files,globals={}){
 const context=vm.createContext({console,structuredClone,Math,Date,Number,...globals});context.globalThis=context;
 for(const f of files)vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),context,{filename:f});
 return context;
}
/* Offscreen canvases that support ImageData, so the spiral really paints. */
function fakeFactory(log){
 return (w,h)=>{
  const ops=[];
  const g=new Proxy({},{get:(o,k)=>{
   if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});
   if(k==='createImageData')return(a,b)=>({width:a,height:b,data:new Uint8ClampedArray(a*b*4)});
   if(k==='putImageData')return(img)=>{ops.push(['putImageData']);o.lastImage=img};
   if(k in o)return o[k];
   return(...a)=>{ops.push([k,...a])};
  },set:(o,k,v)=>(o[k]=v,true)});
  const canvas={width:w,height:h,getContext:()=>g,ops,g};log.push(canvas);return canvas;
 };
}
/* Main context: records ops, composite switches and per-draw alpha for additive strokes. */
function recorder(){
 const ops=[];let alpha=1,comp='source-over';
 const g=new Proxy({},{get:(o,k)=>{
  if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});
  if(k in o)return o[k];
  return(...a)=>{ops.push([k,...a.map(x=>typeof x==='number'?Math.round(x*100)/100:x)].concat([{alpha,comp}]))};
 },set:(o,k,v)=>{if(k==='globalCompositeOperation'){comp=v;ops.push(['composite',v])}if(k==='globalAlpha')alpha=v;if(k==='filter')ops.push(['filter',v]);o[k]=v;return true}});
 return {g,ops};
}
const scene=(globals={})=>{const c=load(['lobby-scene.js'],{MONGYU_UI_EDITION:true,MongyuMobile:{sprite(){}},...globals});return c.MongyuLobbyScene};

test('moon spec matches the measured jar disc of lobby-psy (centre 50% x, 18% y, radius 15% of the width)',()=>{
 const S=scene(),m=S.IMG.moon;
 assert.equal(S.IMG.w,720);assert.equal(S.IMG.h,1279);
 assert.ok(Math.abs(m.x/S.IMG.w-.5)<.01);assert.ok(Math.abs(m.y/S.IMG.h-.18)<.01);assert.ok(Math.abs(m.r/S.IMG.w-.15)<.01);
});

test('layout: the moon is fully on screen and clear of the menu in portrait, small phone, tablet and landscape',()=>{
 const S=scene();
 for(const [w,h] of [[390,844],[320,568],[412,915],[768,1024],[844,390],[640,360]]){
  const L=S.layout(w,h),m=L.moon;
  assert.ok(m.x-m.r>=0&&m.x+m.r<=w&&m.y-m.r>=0&&m.y+m.r<=h,'moon visible '+w+'x'+h);
  assert.ok(L.ox<=1e-6&&L.oy<=1e-6&&L.ox+S.IMG.w*L.ps>=w-1e-6&&L.oy+S.IMG.h*L.ps>=h-1e-6,'cover fit '+w+'x'+h);
  assert.ok(L.title.x>0&&L.title.x<w&&L.title.y-L.title.h/2>=0,'title on screen '+w+'x'+h);
  assert.ok(L.hero.x-L.slab.rx>0&&L.hero.y<h,'dreamer on screen '+w+'x'+h);
  if(!L.wide){
   // the CTA sits at max(17% of the height, dock + 22px) above the bottom edge and is 60px tall
   const ctaTop=h-Math.max(14+72+22,h*.17)-60;
   assert.ok(m.y+m.r<ctaTop,'moon above CTA '+w+'x'+h);assert.ok(L.hero.y<ctaTop-20,'dreamer above CTA '+w+'x'+h);
   assert.ok(L.title.y<m.y-m.r*.6,'title on the crown above the moon '+w+'x'+h);
   assert.ok(L.hero.x<w*.5,'dreamer is centre-left '+w+'x'+h);
   assert.ok(Math.abs(L.hero.y/h-.6)<.04,'dreamer at about 60% of the height '+w+'x'+h);
  }else{
   // landscape: CTA and dock use the right column (right 24px, width min(280,34%))
   const colLeft=w-24-Math.min(280,w*.34);
   assert.ok(m.x+m.r<=colLeft+m.r*.25,'moon stays out of the right menu column '+w+'x'+h);
   assert.ok(L.title.x+L.title.h*1.1<m.x-m.r*.55,'title is left of the moon '+w+'x'+h);
  }
 }
});

test('draw: backdrop is cover-fit through MongyuArt; hue breathing is a composite op; no ctx.filter',()=>{
 const S=scene({MongyuArt:{ready:id=>id==='lobby-psy',image:id=>({id})}});
 S.setFactory(fakeFactory([]));
 const r=recorder();S.draw(r.g,{viewport:{width:390,height:844,dpr:1},time:3,reduced:false});
 const L=S.layout(390,844);
 const back=r.ops.find(o=>o[0]==='drawImage'&&o[1]&&o[1].id==='lobby-psy');assert.ok(back,'backdrop drawn');
 assert.ok(Math.abs(back[4]-S.IMG.w*L.ps)<.02&&Math.abs(back[5]-S.IMG.h*L.ps)<.02);assert.ok(back[4]>=390-.01&&back[5]>=844-.01);
 assert.ok(r.ops.some(o=>o[0]==='composite'&&o[1]==='hue'),'hue composite');
 assert.ok(r.ops.some(o=>o[0]==='composite'&&o[1]==='lighter'),'additive overlays');
 assert.ok(!r.ops.some(o=>o[0]==='filter'),'no ctx.filter');
 const src=fs.readFileSync(path.join(SRC,'lobby-scene.js'),'utf8');
 assert.ok(!/\.filter\s*=/.test(src)&&!src.includes('ctx.filter'));
 // a backdrop that is still decoding is skipped without throwing
 const S2=scene({MongyuArt:{ready:()=>false,image:()=>null}});S2.setFactory(fakeFactory([]));
 assert.equal(S2.draw(recorder().g,{viewport:{width:390,height:844,dpr:1},time:0}).kind,'r105-lobby');
});

test('moon spiral: paints only the disc, turns slowly, and is frozen when reduced',()=>{
 const S=scene(),log=[];S.setFactory(fakeFactory(log));
 const vp={width:390,height:844,dpr:1};
 S.draw(recorder().g,{viewport:vp,time:0,reduced:false});
 const spiral=log.find(c=>c.width===c.height&&c.width>=96&&c.width<=320&&c.ops.some(o=>o[0]==='putImageData'));assert.ok(spiral,'spiral canvas exists');
 const N=spiral.width,snap=()=>Uint32Array.from(new Uint32Array(spiral.g.lastImage.data.buffer));
 const a=snap(),filled=a.filter(v=>v!==0).length,disc=Math.PI/4*N*N;
 assert.ok(filled>disc*.97&&filled<disc*1.12,'only the disc is painted: '+filled+' vs '+Math.round(disc));
 assert.equal(a[0],0,'corners stay clear');
 // half a second later the bands have moved a little, not a lot (nothing flashes)
 S.draw(recorder().g,{viewport:vp,time:.5,reduced:false});
 const b=snap();let diff=0,big=0;
 const lum=v=>(v&255)*.2126+((v>>8)&255)*.7152+((v>>16)&255)*.0722;
 for(let i=0;i<a.length;i++)if(a[i]&&a[i]!==b[i]){diff++;if(Math.abs(lum(a[i])-lum(b[i]))>90)big++}
 assert.ok(diff>0,'the spiral moves');
 assert.ok(big/filled<.05,'at most 5% of the pixels change strongly in half a second: '+(big/filled));
 // reduced: frozen at the t=0 frame whatever the clock says
 const log2=[];S.setFactory(fakeFactory(log2));
 S.draw(recorder().g,{viewport:vp,time:0,reduced:true});
 const sp2=log2.find(c=>c.ops.some(o=>o[0]==='putImageData')),r0=Uint32Array.from(new Uint32Array(sp2.g.lastImage.data.buffer));
 S.draw(recorder().g,{viewport:vp,time:77,reduced:true});
 assert.deepEqual([...r0],[...new Uint32Array(sp2.g.lastImage.data.buffer)]);assert.deepEqual([...r0],[...a],'reduced equals the t=0 frame');
});

test('safety: slow cycles only (turn >= 40 s, hue breath >= 20 s) and ripples stay at alpha <= .25',()=>{
 const src=fs.readFileSync(path.join(SRC,'lobby-scene.js'),'utf8');
 assert.match(src,/turn=t\/52/);assert.match(src,/TAU\/26/);
 const S=scene();S.setFactory(fakeFactory([]));
 let rings=0;
 for(let t=0;t<40;t+=.5){
  const r=recorder();S.draw(r.g,{viewport:{width:390,height:844,dpr:1},time:t,reduced:false});
  for(const o of r.ops)if(o[0]==='arc'&&o.length>=7){const info=o[o.length-1];if(info.comp==='lighter'){rings++;assert.ok(info.alpha<=.2501,'ripple alpha '+info.alpha)}}
 }
 assert.ok(rings>20,'ripples are drawn: '+rings);
 // reduced: no ripple motion at all (at most one static ring)
 const a=recorder(),b=recorder();
 S.draw(a.g,{viewport:{width:390,height:844,dpr:1},time:3,reduced:true});S.draw(b.g,{viewport:{width:390,height:844,dpr:1},time:50,reduced:true});
 assert.deepEqual(a.ops,b.ops);
});

test('draw: one dreamer sprite per frame on a floating slab',()=>{
 let n=0;const S=scene({MongyuMobile:{sprite(){n++}}});S.setFactory(fakeFactory([]));
 S.draw(recorder().g,{viewport:{width:844,height:390,dpr:2},time:1,reduced:false});assert.equal(n,1);
 assert.equal(S.cached,'844x390@2');
});

test('the old dawn garden is gone from the scene module',()=>{
 const src=fs.readFileSync(path.join(SRC,'lobby-scene.js'),'utf8');
 for(const w of ['pavilion','pagoda','firefl','fogBand','roadIsland','islands'])assert.ok(!src.includes(w),w);
});

test('lobby ui keeps every action: CTA enters the road via nextCourseId; dock targets are unchanged',()=>{
 const src=fs.readFileSync(path.join(SRC,'lobby-ui.js'),'utf8');
 assert.match(src,/MongyuRoad\.start\(nextCourseId\(\),event\)/);
 for(const t of ['restorationOpen','shopOpen','storyOpen'])assert.ok(src.includes(t),t);
 assert.match(src,/function startMode/);
});

test('stylesheet: iridescent hairlines on the CTA and dock, animation off when motion is reduced',()=>{
 const css=fs.readFileSync(path.join(SRC,'..','css','r104-ui.css'),'utf8');
 assert.match(css,/--r105-iris:linear-gradient/);
 assert.match(css,/:is\(\.r105-cta,\.r105-dock\)::before\{[^}]*mask/);
 assert.match(css,/body\[data-dream-motion=reduced\] :is\(\.r105-cta,\.r105-dock\)::before/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{[\s\S]*?:is\(\.r105-cta,\.r105-dock\)::before\{animation:none!important/);
});
