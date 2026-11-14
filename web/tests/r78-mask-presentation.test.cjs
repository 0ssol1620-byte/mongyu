'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const web=path.resolve(__dirname,'..');
function load(inline){
 const context=vm.createContext({structuredClone}),html=inline?fs.readFileSync(path.join(web,'MONGYU_R80.html'),'utf8'):null;
 const scripts=html?[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]):[];
 for(const name of ['native-kernels.js','native-restoration-run.js','restoration-catalog.js','square-art.js']){
  const source=fs.readFileSync(path.join(web,'src',name),'utf8'),normalized=s=>s.replaceAll('\r\n','\n').trim();
  const actual=inline?scripts.find(s=>normalized(s)===normalized(source)):source;assert.ok(actual,name+' missing from generated HTML');vm.runInContext(actual,context,{filename:name});
 }return {N:context.MongyuNativeRestoration,K:context.MongyuNativeKernels,C:context.MongyuRestorationCatalog,A:context.MongyuSquareArt};
}
const plain=x=>JSON.parse(JSON.stringify(x));
const cells=s=>plain(s.map.drawCommands.filter(d=>d.raw==='0x5113a').map(d=>[d.x,d.y]));
function expected(K,id){const points=[];for(let y=0;y<24;y++)for(let x=0;x<24;x++)if(K.Mask.maskCell(id,x,y))points.push([x*16+8,y*16+8]);return points;}
for(const inline of [false,true]){
 const label=inline?'embedded HTML':'source';
 test(label+': regular presentation preserves mask ID and both grid coordinates',()=>{
  const {N,K,C}=load(inline);for(const slot of [4,12,18]){
   const r=new N.RestorationRun({slot:C.getSlot(slot),seedA:7,seedB:11,period:'noon'});assert.equal(r.start(),true);assert.equal(r.tick(r.stepMs/1000),1);assert.equal(r.supported,true);
   assert.equal(r.nativeFrame.game.stage.behaviorCode,3);const want=expected(K,r.nativeFrame.map.ae);assert.ok(want.length>0);if(slot===4)assert.equal(want.length,100);
   assert.deepEqual(cells(r.nativeFrame),want);
  }
 });
 test(label+': default mask provider matches explicitly supplied provider',()=>{
  const {N,K,C}=load(inline),r=new N.RestorationRun({slot:C.getSlot(4),seedA:7,seedB:11,period:'noon'});r.start();
  const options={...r.driverOptions,key:-9999};delete options.maskCell;
  const result=K.Driver.advance(r.nativeFrame,options);assert.equal(result.supported,true,result.reason);assert.equal(result.renderRngComplete,true);assert.deepEqual(cells(result.state),expected(K,result.state.map.ae));
 });
 test(label+': collision mask is visible in world coordinates without phantom column edges',()=>{
  const {N,K,C,A}=load(inline),r=new N.RestorationRun({slot:C.getSlot(4),seedA:7,seedB:11,period:'noon'});r.start();r.tick(r.stepMs/1000);
  const before=JSON.stringify(r.nativeFrame),geo=r.geometry(),want=expected(K,r.nativeFrame.map.ae);
  assert.equal(JSON.stringify(r.nativeFrame),before,'geometry must not advance state/RNG');
  assert.equal(geo.nativeMaskId,35);assert.equal(geo.nativePaths.length,0);assert.equal(geo.track.points.length,0);
  assert.deepEqual(plain(geo.nativeMaskCells.map(c=>[c.x+8,c.y+8])),want);
  const draws=[],context={save(){},restore(){},fillRect(...rect){draws.push({rect,color:this.fillStyle});}};
  A.support(context,geo,{p:{wall:'#ff00ff'}});assert.equal(draws.length,want.length*3);
  assert.deepEqual(draws.filter((_,i)=>i%3===0).map(d=>d.rect),want.map(([x,y])=>[x-8,y-8,16,16]));
  for(const c of geo.nativeMaskCells){assert.ok(c.x>=0&&c.y>=0&&c.x+c.width<=384&&c.y+c.height<=384);}
 });
}
test.skip('external audit adapter (not distributed in this checkout): preserves unbound mask callback',()=>{
 require('../src/native-kernels.js');const N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js'),Ports=require('../[REDACTED].cjs');
 const r=new N.RestorationRun({slot:C.getSlot(4),seedA:7,seedB:11,period:'noon'});r.start();r.tick(.095);const previous=cells(r.nativeFrame).length,want=expected(r.kernels,r.nativeFrame.map.ae);
 for(const options of [{maskCell:r.kernels.Mask.maskCell},{}]){
  const result=Ports.call({state:r.nativeFrame,method:'u.(Lorg/kwis/msp/lcdui/Graphics;)V+a',args:[null],raw:'synthetic-adapter-probe'},options);
  assert.equal(result.supported,true,result.reason);assert.deepEqual(cells(result.state).slice(previous),want);
 }
});
test('an empty mask layer never falls back to ordinary support geometry',()=>{
 const A=require('../src/square-art.js'),calls=[],c={save(){},restore(){},fillRect(){calls.push('fill');},beginPath(){calls.push('path');}};
 A.support(c,{nativeMaskCells:[],nativePaths:[{points:[{x:0,y:0},{x:10,y:0}]}]},{p:{wall:'#fff'}});
 assert.deepEqual(calls,[]);
});

