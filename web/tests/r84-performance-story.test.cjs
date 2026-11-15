const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Clone=require('../src/state-clone.js'),M=require('../src/mobile-presentation.js');
test('owned snapshot copier preserves values, aliases, cycles, holes and own proto keys without touching its input',()=>{
 const shared={value:NaN,missing:undefined,big:123n},a={shared,again:shared,array:new Array(4)};a.self=a;a.array[2]=shared;a.array.extra={n:Infinity};Object.defineProperty(a,'__proto__',{value:{safe:true},enumerable:true});
 const b=Clone.clone(a);assert.notEqual(b,a);assert.equal(b.self,b);assert.equal(b.shared,b.again);assert.equal(b.array[2],b.shared);assert.equal(0 in b.array,false);assert.deepEqual(Object.keys(b),Object.keys(a));assert.equal(Object.getPrototypeOf(b),Object.prototype);assert.equal(b.__proto__.safe,true);b.shared.big=9n;assert.equal(a.shared.big,123n);
});
test('unsupported native values and transfer options use the platform copier',()=>{
 const c=Clone.create(structuredClone),v={date:new Date('2020-01-01'),map:new Map([['x',1]])};assert.deepEqual(c.clone(v),structuredClone(v));assert.equal(c.inspect().fallbacks,1);
 assert.throws(()=>c.clone({f(){}}),{name:'DataCloneError'});const buffer=new ArrayBuffer(8),result=c.clone(buffer,{transfer:[buffer]});assert.equal(buffer.byteLength,0);assert.equal(result.byteLength,8);
});
function context(fast){const c={structuredClone,console};vm.createContext(c);for(const f of [...(fast?['state-clone.js']:[]),'native-kernels.js','native-restoration-run.js','restoration-catalog.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f),'utf8'),c,{filename:f});return c}
test('all 74 native physical entries: optimized and platform cloning produce identical states, RNG, traces, effects and inputs',()=>{
 const canonical=context(false),optimized=context(true);let checked=0;
 for(const slot of canonical.MongyuRestorationCatalog.slots){if(!canonical.MongyuNativeRestoration.slotMetadata(slot.number).supported)continue;checked++;
  const a=new canonical.MongyuNativeRestoration.RestorationRun({slot,period:'noon',settings:{speed:'fast'}}),b=new optimized.MongyuNativeRestoration.RestorationRun({slot:optimized.MongyuRestorationCatalog.getSlot(slot.number),period:'noon',settings:{speed:'fast'}});a.start();b.start();
  for(let frame=0;frame<64;frame++){if(frame===31||frame===45){a.inputDown();b.inputDown()}if(frame===32||frame===46){a.inputUp();b.inputUp()}a.tick(.075);b.tick(.075);assert.equal(JSON.stringify(b.nativeFrame),JSON.stringify(a.nativeFrame),'slot '+slot.number+' frame '+frame);assert.equal(JSON.stringify(b.lastTrace),JSON.stringify(a.lastTrace));assert.equal(JSON.stringify(b.result),JSON.stringify(a.result));assert.equal(JSON.stringify(b.drainEvents()),JSON.stringify(a.drainEvents()));assert.equal(JSON.stringify(b.lastResult?.effects),JSON.stringify(a.lastResult?.effects));}
 }assert.equal(checked,74);assert.ok(optimized.MongyuStateClone.inspect().calls>1000);
});
test('native normal arenas use stable width-based framing while the actor stays inside the edges',()=>{
 for(const [w,h]of [[390,844],[844,390],[320,568],[800,1280]])for(const mask of [false,true])for(const [x,y]of [[1,0],[0,1],[-1,0],[0,-1]]){
  const g={nativeRuntime:true,bounds:{width:432,height:432},player:{x:200,y:200,tangent:{x,y},bodyHeight:42.5},...(mask?{nativeMaskCells:[]}:{} )},c=M.camera({width:w,height:h},g,{presentationTime:1},{time:0});assert.equal(c.framing,'viewport-cover');assert.equal(c.scale,Math.min(w/320,h/320));const px=200*c.scale+c.offsetX,py=200*c.scale+c.offsetY;assert.ok(px>=40&&px<=w-40);assert.ok(py>=40&&py<=h-40);
 }
});
test('story journal exposes only unlocked scenes and replaying the opening does not grant another memory',()=>{
 const {host}=require('./host.cjs'),h=host({inline:true,square:true,restoration:true,native:true});h.click('storyOpen');assert.equal(h.app.getState().dialog,'storyJournal');assert.equal(h.e['story-page-1'].disabled,false);assert.equal(h.e['story-page-5'].disabled,true);h.click('story-page-5');assert.equal(h.app.getState().dialog,'storyJournal');h.click('story-page-1');assert.equal(h.app.getState().dialog,'restorationScene');assert.match(h.e.restorationSceneSpeaker.textContent,/길/);assert.equal(h.e.restorationScene.dataset.presentation,'speech');h.click('restorationSceneNext');h.click('restorationSceneNext');const n=h.app.restoration.view().status.collected;assert.equal(n,1);h.app.home();h.click('storyOpen');h.click('story-page-1');h.click('restorationSceneNext');h.click('restorationSceneNext');assert.equal(h.app.restoration.view().status.collected,n);
});
test('ending contains no numbered placeholder sentences, and wording remains explicitly authored',()=>{
 const G=require('../src/restoration-story-graph.js');for(const scene of G.sequences){assert.equal(scene.provenance.wording,'independently authored semantic adaptation');for(const step of scene.steps)assert.doesNotMatch(step.text||'',/아직 전하지 못한 마음.*·\s*\d/)}
});
test('camera keeps the feet on screen throughout every intermediate corner angle without diagonal overshoot',()=>{
 for(const [width,height]of [[390,844],[844,390],[320,568],[568,320],[800,1280]])for(let d=0;d<360;d++){
  const angle=d*Math.PI/180,g={nativeRuntime:true,bounds:{width:432,height:432},player:{x:200,y:200,tangent:{x:Math.cos(angle),y:Math.sin(angle)},renderAngle:angle}};
  const c=M.camera({width,height},g,{},{time:0}),x=200*c.scale+c.offsetX,y=200*c.scale+c.offsetY;assert.ok(x>=40&&x<=width-40,'x at '+d+' '+width+'x'+height);assert.ok(y>=40&&y<=height-40,'y at '+d+' '+width+'x'+height);
 }
});
