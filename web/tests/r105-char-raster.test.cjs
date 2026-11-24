'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'../src');
const ids=['pose-stand','pose-run-a','pose-run-b','pose-jump','pose-land','pose-hurt','pose-joy','pose-sleep',...Array.from({length:8},(_,i)=>'run-0'+(i+1))];
// A tiny canvas stand-in: every canvas remembers which source images were drawn into it, so the frame a sprite shows can be traced back.
function mockCanvas(pixels){
 const cv={width:0,height:0,__ids:new Set(),__pixels:pixels,__put:null,__fills:[],__sets:[]};
 const ctx=new Proxy({canvas:cv,calls:[]},{
  get(o,k){
   if(k in o)return o[k];
   if(k==='getTransform')return()=>({a:2,b:0,c:0,d:2,e:0,f:0});
   if(k==='getImageData')return(x,y,w,h)=>({data:cv.__pixels?Uint8ClampedArray.from(cv.__pixels):new Uint8ClampedArray(w*h*4),__ids:cv.__ids});
   if(k==='putImageData')return im=>{cv.__put=im.data;if(im.__ids)for(const i of im.__ids)cv.__ids.add(i)};
   if(k==='drawImage')return(src,...a)=>{if(src&&src.__id)cv.__ids.add(src.__id);else if(src&&src.__ids)for(const i of src.__ids)cv.__ids.add(i);o.calls.push(['drawImage',src,...a])};
   if(k==='fillRect')return(...a)=>{cv.__fills.push(o.fillStyle);o.calls.push(['fillRect',...a])};
   if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});
   return(...a)=>{o.calls.push([k,...a])};
  },
  set(o,k,v){assert.notEqual(k,'filter','ctx.filter must never be used');o[k]=v;cv.__sets.push([k,v]);return true}
 });
 cv.getContext=()=>ctx;cv.ctx=ctx;return cv;
}
function boot(opts={}){
 const ready=new Set(opts.ready||ids),canvases=[];
 const ctx={console,Math,Promise,MONGYU_POLISH_EDITION:true,MONGYU_DREAM_EDITION:true,MONGYU_STAGE_EDITION:true,MONGYU_UI_EDITION:true,
  setTimeout:()=>0,
  document:{createElement(){const c=mockCanvas(opts.pixels?new Uint8ClampedArray(opts.pixels):null);canvases.push(c);return c}},
  MongyuArt:opts.noArt?undefined:{enabled:true,ready:id=>ready.has(id),image:id=>({__id:id,complete:ready.has(id),naturalWidth:ready.has(id)?512:0}),preload:()=>Promise.resolve()}};
 ctx.globalThis=ctx;vm.createContext(ctx);
 for(const f of ['trip-palettes.js','character-art.js','mobile-presentation.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return Object.assign(ctx,{canvases,ready});
}
// Draw one sprite and return the frame ids shown by the final (non-shadow) drawImage plus the recorded calls.
function shot(G,q,fx={},reduced=false,character='walker',style){
 const out=mockCanvas();G.MongyuCharacter.resetMotion();
 G.MongyuMobile.sprite(out.ctx,{x:50,y:90,bodyHeight:44,...q},{poseTime:1.3,onDark:true,...fx},reduced,character,style);
 const imgs=out.ctx.calls.filter(c=>c[0]==='drawImage');
 const last=imgs[imgs.length-1];
 return {frames:last?[...last[1].__ids]:[],calls:out.ctx.calls,imgs,cv:out};
}
const frame=(G,q,fx,reduced)=>{const s=shot(G,q,fx,reduced);assert.ok(s.frames.length>=1,'raster drawn '+JSON.stringify(q));return s.frames[0]};

test('pose selection: explicit poses and inferred native fields choose the right sprite',()=>{
 const G=boot();
 const cases=[[{pose:'stand'},'pose-stand'],[{pose:'joy'},'pose-joy'],[{pose:'raise-arms'},'pose-joy'],[{pose:'open-arms'},'pose-joy'],[{pose:'hurt',poseAt:0},'pose-hurt'],
  [{pose:'land'},'pose-land'],[{pose:'sleep'},'pose-sleep'],[{pose:'jump',height:9,jumpProgress:.4},'pose-jump'],[{height:9,jumpProgress:.4,nativeState:0},'pose-jump'],
  [{nativeState:13},'pose-hurt'],[{deathProgress:.5},'pose-hurt'],[{nativeState:11},'pose-jump'],[{nativeState:14},'pose-stand'],[{pose:'turn-head'},'pose-stand'],[{sleeping:true,pose:'stand'},'pose-sleep']];
 for(const [q,want]of cases)assert.equal(frame(G,q),want,JSON.stringify(q));
});
test('run cycle: eight frames follow the stride distance; without it run-a/run-b alternate',()=>{
 const G=boot(),seen=[];
 for(let k=0;k<8;k++)seen.push(frame(G,{strideDistance:((k+.5)/8)*.9*44,nativeState:0}));
 assert.deepEqual(seen,Array.from({length:8},(_,i)=>'run-0'+(i+1)));
 assert.equal(frame(G,{strideDistance:.9*44*3+(.5/8)*.9*44,nativeState:0}),'run-01','phase wraps every .9 body heights');
 const a=frame(G,{nativeState:0},{poseTime:0}),b=frame(G,{nativeState:0},{poseTime:.3});
 assert.deepEqual([a,b],['pose-run-a','pose-run-b']);
 assert.equal(frame(G,{nativeState:0},{poseTime:.3},true),'pose-run-a','reduced motion with no stride is a still frame');
 assert.equal(frame(G,{nativeState:12,strideDistance:3},{},false).startsWith('run-'),true,'wall running reuses the run frames');
});
test('a frame that has not decoded yet falls back to a neighbour, then to the vector child',()=>{
 const G=boot({ready:['run-01','run-02','pose-stand']});
 assert.equal(frame(G,{strideDistance:(4.5/8)*.9*44,nativeState:0}),'run-02');
 const none=boot({ready:[]}),before=none.MongyuCharacter.stats.fallbacks,s=shot(none,{pose:'stand'});
 assert.equal(s.frames.length,0,'vector fallback draws paths, no raster');assert.ok(s.calls.length>40);
 const noArt=boot({noArt:true});assert.ok(shot(noArt,{pose:'stand'}).calls.length>40);
 assert.equal(noArt.MongyuCharacter.poseOf({pose:'sleep'}),'sleep');
});
test('NPCs keep the vector drawing',()=>{
 const G=boot();
 for(const who of ['elder','woman']){const s=shot(G,{pose:'stand'},{},true,who);assert.equal(s.imgs.length,0,who+' stays vector');assert.ok(s.calls.length>40)}
});
test('orientation: the surface angle, ceiling flip and reversing follow the legacy transform',()=>{
 const G=boot();
 const rot=(q)=>shot(G,{strideDistance:20,nativeState:0,...q}).calls.find(c=>c[0]==='rotate')[1];
 assert.equal(rot({renderAngle:-1.57}),-1.57);assert.equal(rot({tangent:{x:0,y:1}}),Math.PI/2);
 const sc=(q)=>shot(G,{strideDistance:20,nativeState:0,renderAngle:Math.PI,...q}).calls.find(c=>c[0]==='scale');
 const s0=sc({}),s1=sc({direction:1});assert.ok(s0[1]>0&&s0[2]>0);assert.ok(s1[2]<0,'reversing mirrors along the surface');
 const ceil=shot(G,{strideDistance:20,nativeState:0,renderAngle:Math.PI});assert.ok(ceil.calls.some(c=>c[0]==='rotate'&&Math.abs(c[1]-Math.PI)<1e-9));
});
test('size follows bodyHeight and the shadow shrinks with height',()=>{
 const G=boot();
 const sc=bh=>shot(G,{pose:'stand',bodyHeight:bh}).calls.find(c=>c[0]==='scale')[1];assert.ok(Math.abs(sc(88)/sc(44)-2)<1e-9);
 const shadowW=h=>{const s=shot(G,{height:h,jumpProgress:.4,nativeState:0});return s.calls.filter(c=>c[0]==='scale')[1][1]};
 assert.ok(shadowW(0)>shadowW(30),'shadow narrows while airborne');
});
test('the figure is cached per frame, size, skin and chapter',()=>{
 const G=boot(),st=G.MongyuCharacter.stats;
 shot(G,{pose:'stand'});const n=st.builds;assert.ok(n>=2);
 shot(G,{pose:'stand'});assert.equal(st.builds,n,'second draw reuses both the base and the rim canvases');
 shot(G,{pose:'stand',trip:'aqua'});assert.equal(st.builds,n+1,'a new chapter colour only rebuilds the rim');
 shot(G,{pose:'stand'},{},false,'walker',G.MongyuMobile.looks[3]);assert.ok(st.builds>=n+3,'a new outfit builds its own tinted copy');
});
test('chapter rim colour comes from MongyuTrip and the rim can be switched off',()=>{
 const G=boot();
 const rims=trip=>{const s=shot(G,{pose:'stand',trip});return G.canvases.flatMap(c=>c.__fills)};
 G.canvases.length=0;shot(G,{pose:'stand',trip:'aqua'});
 const fills=new Set(G.canvases.flatMap(c=>c.__fills));assert.ok(fills.has(G.MongyuTrip.get('aqua').rim),[...fills].join());
 G.canvases.length=0;shot(G,{pose:'stand',trip:'ember'},{rim:false});
 assert.ok(!G.canvases.flatMap(c=>c.__fills).includes(G.MongyuTrip.get('ember').rim),'rim:false skips the outline');
 G.MongyuCharacter.setTrip('toxic');G.canvases.length=0;shot(G,{pose:'run'});assert.ok(G.canvases.flatMap(c=>c.__fills).includes(G.MongyuTrip.get('toxic').rim));
});
test('wardrobe: skins recolour only the purple hat/cape; skin, pyjamas, pom-pom and the default art stay put',()=>{
 // pixels: purple cape, cream pyjamas, white pom-pom, skin, a magenta-cast edge, a stray near-transparent pixel
 const px=[[120,86,165,255],[255,236,214,255],[252,240,246,255],[255,226,209,255],[230,90,230,90],[200,10,10,3]];
 const run=style=>{const G=boot({pixels:px.flat()});const s=shot(G,{pose:'stand',bodyHeight:44},{rim:false,shadow:false},true,'walker',style);
  const put=G.canvases.find(c=>c.__put);assert.ok(put,'pixel pass ran');return Array.from(put.__put)};
 const moon=run(null),looks=boot().MongyuMobile.looks;
 const moonLook=run(looks[0]);assert.deepEqual(moonLook.slice(0,4),[120,86,165,255],'the default outfit keeps the original purple');
 for(const i of [1,2,3,5])assert.notDeepEqual(run(looks[i]).slice(0,3),[120,86,165],looks[i].id+' changes the hat/cape colour');
 const dew=run(looks.find(l=>l.id==='dew'));
 assert.ok(dew[1]>dew[0]&&dew[1]>dew[2],'dew turns the purple green-teal: '+dew.slice(0,3));
 for(const [i,orig] of [[1,px[1]],[2,px[2]],[3,px[3]]])assert.deepEqual(dew.slice(i*4,i*4+4),orig,'non-purple pixel '+i+' untouched');
 const edge=dew.slice(16,20);assert.ok(edge[1]>90,'magenta edge cast is pulled toward neutral: '+edge);
 assert.equal(dew[23],0,'stray almost-transparent pixels are cleared');
 assert.equal(new Set(looks.map(l=>run(l).slice(0,3).join())).size>=9,true,'distinct outfits look distinct');
});
test('reduced motion is a static frame: poseTime changes nothing',()=>{
 const G=boot();
 for(const q of [{pose:'stand'},{pose:'joy'},{pose:'sleep'},{strideDistance:30,nativeState:0},{height:8,jumpProgress:.3,nativeState:0},{pose:'hurt',poseAt:0}]){
  const a=shot(G,q,{poseTime:1},true),b=shot(G,q,{poseTime:77},true);
  assert.deepEqual(a.calls.map(c=>c.slice(0,1).concat(c.slice(2).map(v=>typeof v==='number'?Math.round(v*1e6)/1e6:0))),b.calls.map(c=>c.slice(0,1).concat(c.slice(2).map(v=>typeof v==='number'?Math.round(v*1e6)/1e6:0))),JSON.stringify(q));
 }
});
test('jump squash/stretch, landing crouch and the strip fan stay finite and deterministic',()=>{
 const G=boot();
 for(let u=0;u<=1;u+=.1){const s=shot(G,{height:10,jumpProgress:u,nativeState:0,strideDistance:10});for(const c of s.calls)for(const v of c.slice(1))if(typeof v==='number')assert.ok(Number.isFinite(v),c[0]+' '+u)}
 const C=G.MongyuCharacter,out=mockCanvas();C.resetMotion();
 const run=(t,height,j)=>G.MongyuMobile.sprite(out.ctx,{x:0,y:0,bodyHeight:44,nativeState:0,height,jumpProgress:j,strideDistance:t*100},{poseTime:t},false);
 run(1,10,.5);run(1.05,10,.9);run(1.1,0,0);
 const last=out.ctx.calls.filter(c=>c[0]==='drawImage').pop();assert.ok([...last[1].__ids].includes('pose-land'),'landing shows the crouch for a moment');
 out.ctx.calls.length=0;run(1.5,0,0);assert.ok(![...out.ctx.calls.filter(c=>c[0]==='drawImage').pop()[1].__ids].includes('pose-land'),'and then runs again');
});
test('performance guard: a cached draw issues a small, bounded number of canvas calls',()=>{
 const G=boot();shot(G,{strideDistance:30,nativeState:0});
 const s=shot(G,{strideDistance:30,nativeState:0});assert.ok(s.calls.length<=60,'calls: '+s.calls.length);assert.ok(s.imgs.length<=7);
});
