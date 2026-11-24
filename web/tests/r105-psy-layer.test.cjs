const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src');
/* A recording canvas context: every call is logged with the composite operation and alpha that were active when it ran. */
const colours=[];
function recorder(){
 const log=[],state={globalCompositeOperation:'source-over',globalAlpha:1};
 const stack=[];
 const target={};
 const ctx=new Proxy(target,{
  get(o,k){
   if(k==='__log')return log;
   if(k in state)return state[k];
   if(k==='save')return()=>stack.push({...state});
   if(k==='restore')return()=>{Object.assign(state,stack.pop()||{})};
   if(k==='createLinearGradient'||k==='createRadialGradient'||k==='createConicGradient')return()=>({addColorStop(o2,col){colours.push(col)}});
   if(k==='createImageData')return(w,h)=>({data:new Uint8ClampedArray(w*h*4)});
   if(k in o)return o[k];
   return(...a)=>{log.push({fn:String(k),op:state.globalCompositeOperation,alpha:state.globalAlpha,args:a})};
  },
  set(o,k,v){if(k==='globalCompositeOperation'||k==='globalAlpha')state[k]=v;else{if((k==='strokeStyle'||k==='fillStyle')&&typeof v==='string')colours.push(v);o[k]=v}return true}
 });
 return ctx;
}
const rects=[];
class Path2DStub{rect(x,y,w,h){rects.push({x,y,w,h})}}
function load(extra={}){
 const ctx={console,performance:{now:()=>Date.now()},MONGYU_UI_EDITION:true,Path2D:Path2DStub,...extra};
 ctx.document={createElement:()=>({width:0,height:0,getContext:()=>recorder()})};
 const img=id=>({complete:true,naturalWidth:540,naturalHeight:id==='course-c3'?769:959});
 ctx.MongyuArt={has:id=>/^course-c[1-5]$|^lobby-psy$/.test(id),image:img,ready:()=>true,preload:()=>Promise.resolve([])};
 vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(SRC,'psy-layer.js'),'utf8'),ctx,{filename:'psy-layer.js'});
 return ctx;
}
const withTrip=()=>{const c=load();vm.runInContext(fs.readFileSync(path.join(SRC,'trip-palettes.js'),'utf8'),c,{filename:'trip-palettes.js'});return c};
const run=(o={})=>({id:'c1',bpm:100,actIndex:0,perfectStreak:0,portal:null,clock:0,viewport:{width:390,height:844},...o});
const opts=(t,o={})=>({viewport:{width:390,height:844},reduced:false,time:t,...o});
const plain=x=>JSON.parse(JSON.stringify(x));

test('layer is inert outside the UI edition', () => {
 const c=load({MONGYU_UI_EDITION:false}),g=recorder();
 assert.equal(c.MongyuPsy.enabled,false);
 assert.equal(c.MongyuPsy.draw(g,run(),opts(5)),false);assert.equal(g.__log.length,0)});

test('combo level: mapped from the streak and eased gradually (never a jump)', () => {
 const P=load().MongyuPsy;
 assert.equal(P.levelFor(0),0);assert.equal(P.levelFor(3),.5);assert.equal(P.levelFor(6),1);assert.equal(P.levelFor(40),1);
 let l=0;const step=1/60;let maxStep=0;
 for(let i=0;i<60*8;i++){const n=P.easeLevel(l,1,step);maxStep=Math.max(maxStep,n-l);l=n}
 assert.equal(l,1);assert.ok(maxStep*60<=P.PARAMS.levelUp+1e-9,'rises at most '+P.PARAMS.levelUp+'/s');
 let d=1;for(let i=0;i<60*8;i++)d=P.easeLevel(d,0,step);assert.equal(d,0);
 assert.ok(P.easeLevel(1,0,1)>=1-P.PARAMS.levelDown-1e-9,'falls at most '+P.PARAMS.levelDown+'/s')});

test('safety: colour cycle >= 20 s, mandala turn >= 40 s, breathing >= 20 s', () => {
 const P=load().MongyuPsy,q=P.PARAMS;
 assert.ok(q.huePeriod>=20);assert.ok(q.rotatePeriod>=40);assert.ok(q.breathPeriod>=20);assert.ok(q.parallaxPeriodX>=20&&q.parallaxPeriodY>=20);
 assert.ok(Math.abs(P.hueAt(3)-P.hueAt(3+q.huePeriod))<1e-9);
 let worst=0;for(let t=0;t<120;t+=1/30)worst=Math.max(worst,Math.min(Math.abs(P.hueAt(t+1/30)-P.hueAt(t)),360-Math.abs(P.hueAt(t+1/30)-P.hueAt(t))));
 assert.ok(worst*30<=360/q.huePeriod+1e-6,'hue moves at most one full turn per '+q.huePeriod+' s')});

test('ripples: born on the beat, thin (alpha <= .15), every second beat until the combo reaches x3', () => {
 const P=load().MongyuPsy,beat=60/100;
 let max=0;
 for(let lvl of [0,.5,1])for(let t=0;t<60;t+=.05)for(const r of P.ripples(t,100,lvl))max=Math.max(max,r.alpha);
 assert.ok(max<=.15+1e-9,'cap '+max);assert.ok(max>0);
 // a ring is born exactly at a beat boundary (radius 0, alpha 0) and grows from there
 const born=P.ripples(10*beat+1e-6,100,0).find(r=>r.k===10);assert.ok(born&&born.r<1e-3&&born.alpha<1e-3);
 const lowKs=P.ripples(10.4*beat,100,0).map(r=>r.k),highKs=P.ripples(10.4*beat,100,1).map(r=>r.k);
 assert.ok(lowKs.every(k=>k%2===0),'every second beat at a low combo');assert.ok(highKs.some(k=>k%2===1),'every beat once the combo is up');
 assert.ok(P.ripples(10*beat,100,1).length>P.ripples(10*beat,100,0).length-1);
 // stronger with the combo
 const a=P.ripples(10.3*beat,100,0)[0].alpha,b=P.ripples(10.3*beat,100,1).find(r=>r.k===10).alpha;assert.ok(b>a)});

test('placement covers the viewport with the slow parallax in every orientation and swap variant', () => {
 const P=load().MongyuPsy;
 for(const [iw,ih,W,H] of [[540,959,390,844],[540,769,390,844],[540,959,320,568],[540,959,844,390],[540,769,844,390]])for(const v of [0,1])for(let t=0;t<200;t+=3.7){
  const p=P.placement(iw,ih,W,H,t,v);
  assert.ok(p.x<=1e-6&&p.x+p.w>=W-1e-6,`covers width ${iw}x${ih} in ${W}x${H} t=${t}`);
 }});

test('full layer: only screen / lighten / lighter, low alphas, no flash (smooth frame-to-frame energy)', () => {
 const c=load(),P=c.MongyuPsy,g=recorder(),r=run({perfectStreak:6});
 const ops=new Set();let prev=null,worst=0,maxAlpha=0;
 for(let f=0;f<30*60;f++){
  const t=f/30;g.__log.length=0;r.clock=t;
  assert.equal(P.draw(g,r,opts(t)),true);
  let energy=0;
  for(const e of g.__log){if(e.fn==='drawImage'||e.fn==='stroke'){ops.add(e.op);maxAlpha=Math.max(maxAlpha,e.alpha);energy+=e.alpha*(e.fn==='drawImage'?1:.02)}}
  if(prev!==null&&f>45)worst=Math.max(worst,Math.abs(energy-prev));
  prev=energy;
 }
 assert.deepEqual([...ops].sort(),['lighten','lighter','screen']);
 assert.ok(maxAlpha<=.85,'max alpha '+maxAlpha);
 assert.ok(worst<.03,'frame-to-frame change '+worst+' (30 fps)')});

test('swap at the aurora gate: the new layer rises with the gate and never pops in', () => {
 const P=load().MongyuPsy,g=recorder(),r=run({actIndex:1,portal:{age:0,duration:.6,swapped:false}});
 P.draw(g,r,opts(50));g.__log.length=0;
 let last=0;const alphas=[];
 for(let age=0;age<=.6;age+=.05){r.portal={age,duration:.6,swapped:age>=.3};g.__log.length=0;P.draw(g,r,opts(50+age));
  const a=g.__log.filter(e=>e.fn==='drawImage').reduce((s,e)=>s+e.alpha,0);alphas.push(a)}
 assert.ok(alphas[0]<=1e-6,'starts invisible');assert.ok(alphas.at(-1)>alphas[3]);
 for(let i=1;i<alphas.length;i++)assert.ok(alphas[i]-alphas[i-1]<.25,'rises smoothly')});

test('reduce motion: one static faint edge wash, no ripples, rings, squares, rotation or cycling', () => {
 const P=load().MongyuPsy,g=recorder();
 const rr=run({perfectStreak:6});
 for(const t of [0,7,40]){g.__log.length=0;P.draw(g,rr,opts(5+t,{reduced:true}))}
 const a=plain(g.__log.map(e=>({fn:e.fn,op:e.op,alpha:e.alpha})));
 assert.equal(a.filter(e=>e.fn==='stroke'||e.fn==='ellipse'||e.fn==='rotate').length,0);
 const imgs=a.filter(e=>e.fn==='drawImage');assert.equal(imgs.length,1);assert.equal(imgs[0].op,'screen');assert.ok(imgs[0].alpha<=.2+1e-9);
 // identical on every frame (static)
 const g2=recorder();P.draw(g2,rr,opts(100,{reduced:true}));assert.equal(JSON.stringify(plain(g2.__log.map(e=>e.args.slice(1)))),JSON.stringify(plain(g.__log.map(e=>e.args.slice(1)))))});

test('missing course art falls back to the lobby backdrop; no art at all still draws the edge layer', () => {
 const c=load(),P=c.MongyuPsy;
 assert.equal(P.backdropId({id:'c3'}),'course-c3');assert.equal(P.backdropId({id:'zz'}),'lobby-psy');
 c.MongyuArt={has:()=>false,image:()=>null,ready:()=>false};P.reset();
 const g=recorder(),rr=run();P.draw(g,rr,opts(9));g.__log.length=0;assert.equal(P.draw(g,rr,opts(12)),true);assert.ok(g.__log.some(e=>e.fn==='drawImage'),'vignette is still drawn')});

test('layer cost: the draw path stays cheap (CPU, stubbed canvas)', () => {
 const c=load(),P=c.MongyuPsy,g=recorder(),r=run({perfectStreak:6});
 for(let f=0;f<60;f++){g.__log.length=0;P.draw(g,r,opts(f/60))}
 P.resetStats();for(let f=0;f<600;f++){g.__log.length=0;r.clock=f/60;P.draw(g,r,opts(f/60))}
 // The real in-browser budget is 2 ms (measured 0.59 ms in Chrome); this CPU-only stub run only guards against regressions, so it gets 4x headroom to stay stable when the machine is busy.
 assert.ok(P.stats().avgMs<8,'avg '+P.stats().avgMs)});

test('course-run calls the layer hook right after the act is drawn', () => {
 const src=fs.readFileSync(path.join(SRC,'course-run.js'),'utf8');
 assert.match(src,/drawChild\(c,run,opts\);root\.MongyuPsy\?\.draw\?\.\(c,run,opts\)/)});

/* ---- wave 3 (TR): the dark psychedelic look ---- */
const hueOf=col=>{
 let r,g,b;
 if(col[0]==='#'){const n=parseInt(col.slice(1),16);r=n>>16&255;g=n>>8&255;b=n&255}
 else{const m=/rgba?\(([^)]+)\)/.exec(col);if(!m)return null;[r,g,b]=m[1].split(',').map(Number)}
 const mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx-mn<28||mx<40)return null;     // neutral / near black / near white: no hue
 const d=mx-mn,h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return (h*60+360)%360;
};
test('the conic rainbow wheel is gone: no conic gradient, no hsl() colour wheel, no soft-light', () => {
 const src=fs.readFileSync(path.join(SRC,'psy-layer.js'),'utf8');
 assert.ok(!/createConicGradient\(/.test(src));assert.ok(!/hsla?\(/.test(src));assert.ok(!/'soft-light'/.test(src))});

test('every colour the layer draws belongs to the trip palette: neighbouring hue families only, never a rainbow', () => {
 for(const key of ['violet','aqua','ember','toxic','heart']){
  const c=withTrip(),P=c.MongyuPsy,pal=c.MongyuTrip.get(key),g=recorder();colours.length=0;
  const r=run({child:{trip:key,perfectStreak:6},perfectStreak:6});
  for(let f=0;f<240;f++){r.clock=f/6;P.draw(g,r,opts(f/6))}
  assert.ok(colours.length>10,key+' draws coloured shapes');
  const hues=new Set();for(const col of colours){const h=hueOf(col);if(h!==null)hues.add(Math.floor(h/36))};   // 36 degree bins
  const allowed=[pal.rim,pal.rim2,pal.glow].map(hueOf).filter(h=>h!==null);
  assert.ok(hues.size<=4,key+' uses '+hues.size+' hue bins');
  for(const col of colours){const h=hueOf(col);if(h===null)continue;
   assert.ok(allowed.some(a=>{const d=Math.abs(a-h);return Math.min(d,360-d)<=24}),key+': '+col+' (hue '+Math.round(h)+') is outside the palette')}
 }});

test('layer reads the trip from the child act, then the course option, default violet', () => {
 const c=withTrip(),P=c.MongyuPsy;
 assert.equal(P.paletteOf('aqua').rim,c.MongyuTrip.get('aqua').rim);assert.equal(P.paletteOf('nope').rim,c.MongyuTrip.get('violet').rim);
 const g=recorder(),r=run({options:{trip:'toxic'}});colours.length=0;P.draw(g,r,opts(5));P.draw(g,r,opts(8));
 assert.ok(colours.some(x=>{const h=hueOf(x);return h>60&&h<170}),'a toxic course draws green')});

test('NOM3 squares: never inside the lane ellipse, in every viewport, at every combo level', () => {
 const P=load().MongyuPsy,q=P.PARAMS.gridInner;
 for(const [W,H] of [[390,844],[320,568],[844,390],[412,915]])for(const L of [0,.5,1]){
  const cells=P.gridCells(W,H,L);assert.ok(cells.length>20,'cells '+W+'x'+H);
  for(const k of cells){const dx=(k.x-W/2)/(W*q.x),dy=(k.y-H*.52)/(H*q.y);assert.ok(dx*dx+dy*dy>=1,'cell ('+k.x+','+k.y+') is in the lane')}
 }
 assert.ok(P.gridCells(390,844,1).length>P.gridCells(390,844,0).length,'denser with the combo')});

test('NOM3 squares pulse with the beat: size within +-6 %, one wave per beat', () => {
 const c=load(),P=c.MongyuPsy,g=recorder(),beat=.6,t0=10,r=run();
 P.draw(g,r,opts(t0-5));P.draw(g,r,opts(t0-4.9));
 const sizes=[];
 for(let k=0;k<20;k++){rects.length=0;const t=t0+k*beat/20;r.clock=t;P.draw(g,r,opts(t));sizes.push(rects[0].w)}
 const lo=Math.min(...sizes),hi=Math.max(...sizes),mid=(lo+hi)/2;
 assert.ok(hi>lo,'the squares pulse');assert.ok((hi-lo)/2/mid<=.065,'size amplitude '+((hi-lo)/2/mid));
 assert.ok(P.PARAMS.gridAmp<=.06&&P.PARAMS.gridAlphaAmp<=.2+1e-9);
 rects.length=0;P.draw(g,r,opts(12));const a=rects.map(q=>Math.round(q.w*100));
 rects.length=0;P.draw(g,r,opts(12+beat));assert.deepEqual(rects.map(q=>Math.round(q.w*100)),a)});

test('backdrop blend is screen + lighten and clearly stronger than the old .20 soft-light', () => {
 const c=withTrip(),P=c.MongyuPsy,g=recorder(),r=run({child:{trip:'violet'}});
 P.draw(g,r,opts(0));const ops=new Set();let best=0;
 for(let f=0;f<30*40;f+=15){g.__log.length=0;r.clock=f/30;P.draw(g,r,opts(f/30));
  const tiles=g.__log.filter(e=>e.fn==='drawImage'&&(e.op==='screen'||e.op==='lighten'));
  for(const e of tiles)ops.add(e.op);
  const sc=g.__log.filter(e=>e.fn==='drawImage'&&e.op==='screen')[0],li=g.__log.filter(e=>e.fn==='drawImage'&&e.op==='lighten')[0];
  if(sc&&li)best=Math.max(best,sc.alpha+li.alpha)}
 assert.ok(P.PARAMS.backdropScreen+P.PARAMS.backdropLighten>=.4-1e-9&&P.PARAMS.backdropMax<=.4+1e-9);
 assert.ok(ops.has('lighten')&&ops.has('screen'),[...ops].join());assert.ok(best>.2,'backdrop alpha '+best)});

test('duotone LUT: black -> palette neighbours, monotonic in brightness', () => {
 const c=withTrip(),P=c.MongyuPsy;
 for(const key of ['violet','aqua','ember','toxic','heart']){
  const lut=P.lutFor(P.paletteOf(key));assert.equal(lut.length,768);
  assert.deepEqual([lut[0],lut[1],lut[2]],[0,0,0]);
  let prev=-1;for(let i=0;i<256;i++){const l=lut[i*3]*.3+lut[i*3+1]*.59+lut[i*3+2]*.11;assert.ok(l>=prev-1.5,key+' brightness is monotonic at '+i);prev=l}
 }});
