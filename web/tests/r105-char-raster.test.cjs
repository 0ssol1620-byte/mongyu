'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'../src');
const dreamIds=['pose-stand','pose-run-a','pose-run-b','pose-jump','pose-land','pose-hurt','pose-joy','pose-sleep',...Array.from({length:8},(_,i)=>'run-0'+(i+1))];
const silIds=['sil-stand','sil-run-a','sil-run-b','sil-jump','sil-land','sil-hurt','sil-joy','sil-sleep',...Array.from({length:4},(_,i)=>'sil-run-0'+(i+1))];
const ids=[...silIds,...dreamIds];
const WARM='#F3E4CF',INK='#201D29';
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
const frame=(G,q,fx,reduced,style)=>{const s=shot(G,q,fx,reduced,'walker',style);assert.ok(s.frames.length>=1,'raster drawn '+JSON.stringify(q));return s.frames[0]};
const fillsOf=(G,fn)=>{G.canvases.length=0;fn();return new Set(G.canvases.flatMap(c=>c.__fills))};
const dreamLook=G=>G.MongyuMobile.looks.find(l=>l.id==='dream');

test('pose selection: explicit poses and inferred native fields choose the right silhouette',()=>{
 const G=boot();
 const cases=[[{pose:'stand'},'sil-stand'],[{pose:'joy'},'sil-joy'],[{pose:'raise-arms'},'sil-joy'],[{pose:'open-arms'},'sil-joy'],[{pose:'hurt',poseAt:0},'sil-hurt'],
  [{pose:'land'},'sil-land'],[{pose:'sleep'},'sil-sleep'],[{pose:'jump',height:9,jumpProgress:.4},'sil-jump'],[{height:9,jumpProgress:.4,nativeState:0},'sil-jump'],
  [{nativeState:13},'sil-hurt'],[{deathProgress:.5},'sil-hurt'],[{nativeState:11},'sil-jump'],[{nativeState:14},'sil-stand'],[{pose:'turn-head'},'sil-stand'],[{sleeping:true,pose:'stand'},'sil-sleep']];
 for(const [q,want]of cases)assert.equal(frame(G,q),want,JSON.stringify(q));
 // the same inputs in the dream skin pick the pyjama kid
 const dream=dreamLook(G);
 for(const [q,want]of [[{pose:'stand'},'pose-stand'],[{pose:'joy'},'pose-joy'],[{pose:'hurt',poseAt:0},'pose-hurt'],[{pose:'sleep'},'pose-sleep'],[{pose:'land'},'pose-land']])assert.equal(frame(G,q,{},false,dream),want,'dream '+JSON.stringify(q));
});
test('silhouette run cycle: four frames per step follow the stride distance (.65 body heights per step)',()=>{
 const G=boot(),seen=[];
 for(let k=0;k<4;k++)seen.push(frame(G,{strideDistance:(k/4)*.65*44,nativeState:0}));
 assert.deepEqual(seen,Array.from({length:4},(_,i)=>'sil-run-0'+(i+1)));
 assert.equal(frame(G,{strideDistance:.65*44*3},{},false),'sil-run-01','phase wraps every step');
 assert.equal(frame(G,{strideDistance:(.9/4)*.65*44,nativeState:0}),'sil-run-02','frames switch at the midpoints between keys');
 const a=frame(G,{nativeState:0},{poseTime:0}),b=frame(G,{nativeState:0},{poseTime:.3});
 assert.deepEqual([a,b],['sil-run-a','sil-run-b']);
 assert.equal(frame(G,{nativeState:0},{poseTime:.3},true),'sil-run-a','reduced motion with no stride is a still frame');
 assert.equal(frame(G,{nativeState:12,strideDistance:3},{},false).startsWith('sil-run-'),true,'wall running reuses the run frames');
});
test('dream skin keeps its eight-frame run cycle',()=>{
 const G=boot(),dream=dreamLook(G),seen=[];
 for(let k=0;k<8;k++)seen.push(frame(G,{strideDistance:((k+.5)/8)*.9*44,nativeState:0},{},false,dream));
 assert.deepEqual(seen,Array.from({length:8},(_,i)=>'run-0'+(i+1)));
 assert.deepEqual([frame(G,{nativeState:0},{poseTime:0},false,dream),frame(G,{nativeState:0},{poseTime:.3},false,dream)],['pose-run-a','pose-run-b']);
});
test('run frames are foot-locked: the planted foot moves back at the speed of the ground',()=>{
 const G=boot(),foot=[404,315,194,136],rel=[];
 // rim:false draws the flat canvas without a margin, so the destination x maps the source pixel p to x + p*UNIT
 for(let k=0;k<4;k++){const s=shot(G,{strideDistance:(k/4)*.65*43.5,bodyHeight:43.5,nativeState:0},{rim:false,shadow:false},true);const d=s.imgs.pop();rel.push(d[2]+foot[k]*d[4]/512)}
 for(let k=1;k<4;k++)assert.ok(Math.abs((rel[k-1]-rel[k])-(rel[0]-rel[1]))<.05,'step '+k+': '+rel.join());
 assert.ok(Math.abs((rel[0]-rel[3])*4/3-.65*43.5)<1.2,'a step moves the foot back by .65 body heights: '+(rel[0]-rel[3])*4/3);
});
test('a frame that has not decoded yet falls back to a neighbour, then to the vector child',()=>{
 const G=boot({ready:['sil-run-01','sil-run-02','sil-stand']});
 assert.equal(frame(G,{strideDistance:(2/4)*.65*44,nativeState:0}),'sil-run-02');
 const none=boot({ready:[]}),s=shot(none,{pose:'stand'});
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
test('the figure is flat ink and cached per frame, size and skin; a chapter change rebuilds nothing',()=>{
 const G=boot(),st=G.MongyuCharacter.stats;
 const fills=fillsOf(G,()=>shot(G,{pose:'stand'}));assert.ok(fills.has(INK),'the silhouette is filled with the ink colour: '+[...fills]);
 const n=st.builds;assert.equal(n,2,'flat figure and its rimmed copy');
 shot(G,{pose:'stand'});assert.equal(st.builds,n,'second draw reuses both canvases');
 shot(G,{pose:'stand',trip:'aqua'});assert.equal(st.builds,n,'the warm rim does not depend on the chapter colour');
 shot(G,{pose:'stand'},{},false,'walker',G.MongyuMobile.looks[3]);assert.equal(st.builds,n+1,'a new skin builds only its own rim (the flat figure is shared)');
 shot(G,{pose:'stand'},{onDark:false});assert.equal(st.builds,n+1,'a light scene with the default skin draws the flat figure as is');
});
test('rim: warm on dark scenes, none on light scenes, skin accent for the other skins',()=>{
 const G=boot();
 assert.ok(fillsOf(G,()=>shot(G,{pose:'stand'},{onDark:true})).has(WARM),'dark scene: thin warm rim');
 const G2=boot();assert.ok(!fillsOf(G2,()=>shot(G2,{pose:'stand'},{onDark:false})).has(WARM),'onDark:false: no rim');
 const G3=boot();assert.ok(!fillsOf(G3,()=>shot(G3,{pose:'stand'},{onDark:undefined,ink:'#1b1428'})).has(WARM),'dark ink on a page means a light scene');
 const G4=boot();assert.ok(fillsOf(G4,()=>shot(G4,{pose:'stand'},{onDark:undefined,ink:'#fff2df'})).has(WARM),'light ink means a dark scene');
 const G5=boot();
 assert.ok(fillsOf(G5,()=>shot(G5,{pose:'stand',trip:'ember'},{onDark:undefined})).has(WARM),'known chapter palette => dark scene');
 const G6=boot(),dew=G6.MongyuMobile.looks.find(l=>l.id==='dew'),f=fillsOf(G6,()=>shot(G6,{pose:'stand'},{},false,'walker',dew));
 assert.ok(!f.has(WARM)&&f.size>=3,'skin accent replaces the cream rim: '+[...f]);
 const G7=boot();assert.ok(!fillsOf(G7,()=>shot(G7,{pose:'stand'},{rim:false})).has(WARM),'rim:false skips the outline');
 const G8=boot();G8.MongyuCharacter.setTrip('toxic');assert.ok(fillsOf(G8,()=>shot(G8,{pose:'run'},{onDark:undefined})).has(WARM),'a pinned chapter also counts as dark');
});
test('wardrobe: the dream kid is the last look; the other skins only change the rim, halo and shadow',()=>{
 const G=boot(),looks=G.MongyuMobile.looks;
 assert.equal(looks.length,13);assert.equal(looks[12].id,'dream');assert.equal(looks[12].name,'꿈 아이');assert.equal(looks[12].at,0);
 const sig=l=>{const dark=G.MongyuCharacter.silSkin(l,true),light=G.MongyuCharacter.silSkin(l,false);return JSON.stringify([dark.rim,dark.rimW,dark.halo,dark.hb,dark.trail,dark.shadow,light.halo,light.rim,light.trail,light.shadow])};
 assert.equal(new Set(looks.slice(0,12).map(sig)).size,12,'all twelve silhouette skins look different');
 for(const l of looks.slice(0,12)){const s=G.MongyuCharacter.silSkin(l,true);assert.ok(s.rim,l.id+' has a rim on dark scenes')}
 assert.equal(G.MongyuCharacter.silSkin(looks[0],true).rim,WARM,'the default skin keeps the warm cream rim');
 assert.ok(!G.MongyuCharacter.silSkin(looks[0],false).rim&&!G.MongyuCharacter.silSkin(looks[0],false).halo,'and nothing but a faint shadow on a light scene');
 assert.deepEqual(['stand','joy','hurt','sleep'].map(p=>G.MongyuCharacter.portraitId(p,looks[3])),['sil-stand','sil-joy','sil-hurt','sil-sleep']);
 assert.deepEqual(['stand','joy','hurt'].map(p=>G.MongyuCharacter.portraitId(p,looks[12])),['pose-stand','pose-joy','pose-hurt']);
 const plain=require('../src/mobile-presentation.js');assert.equal(plain.looks.length,12,'without the UI edition the wardrobe is unchanged');
});
test('dream skin: the pixel pass only cleans stray pixels; the art keeps its colours',()=>{
 // pixels: purple cape, cream pyjamas, white pom-pom, skin, a magenta-cast edge, a stray near-transparent pixel
 const px=[[120,86,165,255],[255,236,214,255],[252,240,246,255],[255,226,209,255],[230,90,230,90],[200,10,10,3]];
 const G=boot({pixels:px.flat()});shot(G,{pose:'stand',bodyHeight:44},{rim:false,shadow:false},true,'walker',dreamLook(G));
 const put=G.canvases.find(c=>c.__put);assert.ok(put,'pixel pass ran');const out=Array.from(put.__put);
 for(let i=0;i<4;i++)assert.deepEqual(out.slice(i*4,i*4+4),px[i],'pixel '+i+' untouched');
 assert.ok(out[17]>90,'magenta edge cast is pulled toward neutral: '+out.slice(16,20));
 assert.equal(out[23],0,'stray almost-transparent pixels are cleared');
 // and the silhouette never reads pixels at all
 const S=boot({pixels:px.flat()});shot(S,{pose:'stand'},{},true);assert.ok(!S.canvases.some(c=>c.__put),'the silhouette is flat ink, no pixel pass');
});
test('reduced motion is a static frame: poseTime changes nothing',()=>{
 const G=boot();
 for(const style of [undefined,dreamLook(G)])for(const q of [{pose:'stand'},{pose:'joy'},{pose:'sleep'},{strideDistance:30,nativeState:0},{height:8,jumpProgress:.3,nativeState:0},{pose:'hurt',poseAt:0}]){
  const a=shot(G,q,{poseTime:1},true,'walker',style),b=shot(G,q,{poseTime:77},true,'walker',style);
  assert.deepEqual(a.calls.map(c=>c.slice(0,1).concat(c.slice(2).map(v=>typeof v==='number'?Math.round(v*1e6)/1e6:0))),b.calls.map(c=>c.slice(0,1).concat(c.slice(2).map(v=>typeof v==='number'?Math.round(v*1e6)/1e6:0))),JSON.stringify(q));
 }
});
test('head tilt and lean are rotations of the whole sprite about the soles and stay small',()=>{
 const G=boot();
 const rots=q=>shot(G,{strideDistance:25,nativeState:0,renderAngle:0,...q},{poseTime:2.1}).calls.filter(c=>c[0]==='rotate').map(c=>c[1]);
 const r=rots({});assert.equal(r[0],0,'surface angle first');assert.ok(r.length>=2&&Math.abs(r[1])>0&&Math.abs(r[1])<.1,'lean is under ~5 degrees: '+r);
 for(const t of [0,.4,1.1,2.3]){for(const v of rots({})) assert.ok(Math.abs(v)<.2);}
 assert.equal(shot(G,{strideDistance:25,nativeState:0,renderAngle:0},{poseTime:2.1},true).calls.filter(c=>c[0]==='rotate').length,1,'reduced motion adds no lean');
});
test('jump squash/stretch, landing crouch and the sprite stay finite and deterministic',()=>{
 const G=boot();
 for(let u=0;u<=1;u+=.1){const s=shot(G,{height:10,jumpProgress:u,nativeState:0,strideDistance:10});for(const c of s.calls)for(const v of c.slice(1))if(typeof v==='number')assert.ok(Number.isFinite(v),c[0]+' '+u)}
 const C=G.MongyuCharacter,out=mockCanvas();C.resetMotion();
 const run=(t,height,j)=>G.MongyuMobile.sprite(out.ctx,{x:0,y:0,bodyHeight:44,nativeState:0,height,jumpProgress:j,strideDistance:t*100},{poseTime:t,onDark:true},false);
 run(1,10,.5);run(1.05,10,.9);run(1.1,0,0);
 const last=out.ctx.calls.filter(c=>c[0]==='drawImage').pop();assert.ok([...last[1].__ids].includes('sil-land'),'landing shows the ballet crouch for a moment');
 out.ctx.calls.length=0;run(1.5,0,0);assert.ok(![...out.ctx.calls.filter(c=>c[0]==='drawImage').pop()[1].__ids].includes('sil-land'),'and then runs again');
});
test('performance guard: a cached draw issues a small, bounded number of canvas calls',()=>{
 const G=boot();shot(G,{strideDistance:30,nativeState:0});
 const s=shot(G,{strideDistance:30,nativeState:0});assert.ok(s.calls.length<=40,'calls: '+s.calls.length);assert.ok(s.imgs.length<=2,'shadow + figure: '+s.imgs.length);
});
