/* Current exact-HTML JS/native contract. VM evidence, not an Android device test. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {host}=require('../../web/tests/host.cjs'),base=path.resolve(__dirname,'..');
const java=fs.readFileSync(path.join(base,'app/src/main/java/org/quadrift/hddevelopment/MainActivity.java'),'utf8');
const expressions=[...java.matchAll(/web\.evaluateJavascript\("([^"\n]+)"/g)].map(m=>m[1]);
const boot=()=>host({inline:true,square:true,restoration:true,native:true});
function play(h){h.click('titleContinue');h.click('restorationSceneNext');h.click('restorationSceneNext');h.click('restorationStart');h.advance(120)}
test('Android staged payload is exactly current R88 and matches its pinned digest',()=>{
 const staged=fs.readFileSync(path.join(base,'app/src/main/assets/index.html')),web=fs.readFileSync(path.join(base,'../web/MONGYU_R88.html'));assert.deepEqual(staged,web);assert.equal(crypto.createHash('sha256').update(staged).digest('hex'),fs.readFileSync(path.join(base,'expected-asset.sha256'),'utf8').trim());
 const manifest=fs.readFileSync(path.join(base,'app/src/main/AndroidManifest.xml'),'utf8');assert.match(manifest,/versionCode="88"/);assert.match(manifest,/versionName="0\.88\.0-preview"/);assert.doesNotMatch(manifest,/uses-permission/);
});
for(const [i,name]of [[0,'back'],[1,'pause']])test('R88 native '+name+' cancels held input, freezes current run, preserves storage and needs explicit resume',()=>{
 const h=boot();play(h);const r=h.app.activeRun();h.fire('game','pointerdown',{pointerId:9,button:0,isPrimary:true});assert.equal(r.held,true);const data=[...h.data];
 vm.runInContext(expressions[i],h.ctx);assert.equal(r.state,'pause');assert.equal(r.held,false);const time=r.time;
 h.advance(600);h.winEvent('focus');h.doc.hidden=false;h.docEvent('visibilitychange');assert.equal(r.time,time);assert.equal(r.state,'pause');assert.deepEqual([...h.data],data);
 h.click('resumePlay');h.advance(120);assert.equal(r.state,'play');assert.ok(r.time>time);
});
test('native callbacks are harmless before the HTML initializes',()=>{const c={window:{}};vm.createContext(c);for(const e of expressions)assert.doesNotThrow(()=>vm.runInContext(e,c))});
test('R88 wardrobe consumes Android back and keeps equipped style without erasing progress',()=>{
 const h=boot();h.click('shopOpen');h.click('look-ink');assert.equal(h.app.getState().dialog,'wardrobePanel');const save=[...h.data];assert.equal(vm.runInContext(expressions[0],h.ctx),true);assert.equal(h.app.getState().dialog,null);assert.equal(h.app.mobileWardrobe.view().selected,'ink');assert.deepEqual([...h.data],save);
});
