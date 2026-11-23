'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'../src');
function boot(polish=true){
 const ctx={console,Math,MONGYU_POLISH_EDITION:polish,MONGYU_DREAM_EDITION:true,MONGYU_STAGE_EDITION:true};ctx.globalThis=ctx;vm.createContext(ctx);
 for(const f of ['character-art.js','mobile-presentation.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return ctx;
}
// Records every call and style assignment; asserts all numeric arguments are finite.
function recorder(){
 const calls=[],fills=new Set();let gradients=0;
 const c=new Proxy({calls,fills},{get(o,k){if(k in o)return o[k];if(k==='gradients')return gradients;
  if(k==='createLinearGradient'||k==='createRadialGradient')return(...a)=>{gradients++;for(const n of a)assert.ok(Number.isFinite(n),k+' non-finite');return {addColorStop(){}}};
  return(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),`${String(k)} non-finite ${args}`);calls.push([k,...args.map(n=>typeof n==='number'?Math.round(n*1e4)/1e4:typeof n)])}},
  set(o,k,v){if(k==='fillStyle'&&typeof v==='string')fills.add(v);if(typeof v==='number')assert.ok(Number.isFinite(v)||k==='globalAlpha',`${String(k)} non-finite`);o[k]=v;return true}});
 return c;
}
const looks=boot().MongyuMobile.looks;

test('polish sprite() delegates to MongyuCharacter.draw with the same drawing and return value',()=>{
 const ctx=boot(true),M=ctx.MongyuMobile,C=ctx.MongyuCharacter;assert.equal(C.enabled,true);
 const q={x:40,y:90,bodyHeight:44,renderAngle:0,strideDistance:57,nativeState:0,height:0,jumpProgress:0};
 C.resetMotion();const a=recorder();assert.equal(M.sprite(a,q,{poseTime:2,onDark:true},false),true);
 C.resetMotion();const b=recorder();assert.equal(C.draw(b,q,{poseTime:2,onDark:true},false,'walker',M.look()),true);
 assert.deepEqual(a.calls,b.calls);assert.ok(a.calls.length>60);
});
test('non-polish builds keep the legacy sprite',()=>{
 const legacy=boot(false),polish=boot(true),q={x:0,y:0,tangent:{x:1,y:0},bodyHeight:43.5,pose:'stand'};
 const a=recorder(),b=recorder();legacy.MongyuMobile.sprite(a,q,{},true);polish.MongyuMobile.sprite(b,q,{},true);
 assert.notDeepEqual(a.calls,b.calls);assert.equal(legacy.MongyuCharacter.enabled,false);
});
test('pose inference covers explicit poses and native/opening fields',()=>{
 const C=boot().MongyuCharacter;
 const cases=[[{pose:'stand'},'stand'],[{pose:'joy'},'joy'],[{pose:'raise-arms'},'joy'],[{pose:'open-arms'},'open'],[{pose:'turn-head'},'stand'],[{pose:'hurt'},'hurt'],[{pose:'land'},'land'],[{pose:'wall'},'wall'],[{pose:'bogus'},'stand'],
  [{nativeState:0,strideDistance:10},'run'],[{nativeState:13},'hurt'],[{nativeState:16},'hurt'],[{deathProgress:.4},'hurt'],[{nativeState:12},'wall'],[{turning:true,turnProgress:.5},'wall'],
  [{nativeState:11},'float'],[{height:6,jumpProgress:.4},'jump'],[{nativeState:14},'stand'],[{},'run']];
 for(const [q,want]of cases)assert.equal(C.poseOf(q),want,JSON.stringify(q));
 for(const p of ['stand','run','jump','land','wall','hurt','joy'])assert.ok(C.poses.includes(p));
});
test('every pose, outfit, character and surface draws finitely without RNG or mutating the actor',()=>{
 const ctx=boot(),C=ctx.MongyuCharacter,oldRandom=ctx.Math.random;ctx.Math.random=()=>{throw Error('renderer consumed RNG')};
 const poses=[{pose:'stand'},{pose:'joy'},{pose:'land'},{pose:'wall'},{pose:'hurt',poseAt:1},{pose:'open-arms'},{pose:'turn-head'},{strideDistance:13,nativeState:0},
  {height:9,jumpProgress:.3},{height:9,jumpProgress:.9,kick:.5},{nativeState:12,nativeFrame:3},{nativeState:13,nativeFrame:7},{nativeState:11},{turning:true,turnProgress:.4},{climbing:true},{deathProgress:.5}];
 try{for(const character of ['walker','elder','woman','dog'])for(const style of looks)for(const [x,y]of [[1,0],[0,1],[-1,0],[0,-1]])for(const extra of poses){
  const q=Object.freeze({x:24,y:55,tangent:Object.freeze({x,y}),direction:x<0?1:0,bodyHeight:42.5,...extra}),before=JSON.stringify(q),c=recorder();
  assert.equal(C.draw(c,q,{poseTime:3.5,onDark:x>0},false,character,style),true);assert.equal(JSON.stringify(q),before);assert.ok(c.calls.length>40);
 }}finally{ctx.Math.random=oldRandom}
});
test('reduced motion is identical across wall times and the stand pose is time-independent',()=>{
 const C=boot().MongyuCharacter;
 for(const q of [{x:0,y:0,tangent:{x:1,y:0},pose:'stand'},{x:0,y:0,tangent:{x:1,y:0},pose:'joy'},{x:0,y:0,tangent:{x:1,y:0}},{x:0,y:0,renderAngle:-1,strideDistance:30,nativeState:0}]){
  const a=recorder(),b=recorder();C.draw(a,q,{poseTime:1},true,'walker',looks[3]);C.draw(b,q,{poseTime:99},true,'walker',looks[3]);assert.deepEqual(a.calls,b.calls);
 }
});
test('run cycle advances with stride distance and idle breathing moves with time',()=>{
 const C=boot().MongyuCharacter,frames=new Set();
 for(let i=0;i<8;i++){C.resetMotion();const c=recorder();C.draw(c,{x:0,y:0,bodyHeight:43.5,strideDistance:i*34/8,nativeState:0},{poseTime:0},false,'walker',looks[0]);frames.add(JSON.stringify(c.calls))}
 assert.equal(frames.size,8);
 const a=recorder(),b=recorder();C.draw(a,{x:0,y:0,pose:'stand'},{poseTime:.1},false,'walker',looks[0]);C.draw(b,{x:0,y:0,pose:'stand'},{poseTime:.7},false,'walker',looks[0]);
 assert.notDeepEqual(a.calls,b.calls);
});
test('wardrobe outfits change the palette; contrast ink tints the outline',()=>{
 const C=boot().MongyuCharacter,sets=looks.map(style=>{const c=recorder();C.draw(c,{x:0,y:0,pose:'stand'},{},true,'walker',style);return [...c.fills].sort().join()});
 assert.equal(new Set(sets).size,looks.length);
 const dark=C.palette(looks[2],'#18363d',false),plain=C.palette(looks[2],undefined,false),night=C.palette(looks[2],'#fff8de',false);
 assert.notEqual(dark.outline,plain.outline);assert.ok(night.rimAlpha>plain.rimAlpha);
});
test('landing after a jump squashes, a corner lean appears while the surface turns, and pause freezes it',()=>{
 const C=boot().MongyuCharacter;C.resetMotion();
 const draw=(q,t)=>{const c=recorder();C.draw(c,{x:0,y:0,bodyHeight:43.5,nativeState:0,...q},{poseTime:t},false,'walker',looks[0]);return c.calls};
 draw({strideDistance:0,height:8,jumpProgress:.9},0);const landed=draw({strideDistance:2},.016);
 C.resetMotion();draw({strideDistance:0},0);const plain=draw({strideDistance:2},.016);
 assert.notDeepEqual(landed,plain);
 C.resetMotion();for(let i=0;i<20;i++)draw({strideDistance:i*2,renderAngle:-i*.05},i*.016);const leaning=draw({strideDistance:40,renderAngle:-1},.32);
 C.resetMotion();for(let i=0;i<20;i++)draw({strideDistance:i*2,renderAngle:0},i*.016);const straight=draw({strideDistance:40,renderAngle:0},.32);
 const rot=calls=>calls.filter(x=>x[0]==='rotate').map(x=>x[1]);
 assert.ok(Math.max(...rot(leaning).slice(1))>Math.max(...rot(straight).slice(1))+.1);
 const again=draw({strideDistance:40,renderAngle:0},.32);assert.deepEqual(again,draw({strideDistance:40,renderAngle:0},.32));
});
test('elder carries the child unless drawn alone, and gradients are cached per context',()=>{
 const C=boot().MongyuCharacter,c1=recorder(),c2=recorder();
 C.draw(c1,{x:0,y:0,pose:'stand'},{},true,'elder',looks[0]);C.draw(c2,{x:0,y:0,pose:'stand',alone:true},{},true,'elder',looks[0]);
 assert.ok(c1.calls.length>c2.calls.length+20);
 const c=recorder();C.draw(c,{x:0,y:0,strideDistance:3},{poseTime:1},false,'walker',looks[4]);const first=c.gradients;
 for(let i=0;i<5;i++)C.draw(c,{x:0,y:0,strideDistance:3+i},{poseTime:1+i/60},false,'walker',looks[4]);
 assert.ok(first>0);assert.equal(c.gradients,first);
});
