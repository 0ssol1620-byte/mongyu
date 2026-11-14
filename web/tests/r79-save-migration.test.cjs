'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
require('../src/native-kernels.js');const N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js'),{prefix}=require('./r40-event-fixtures.cjs');
const key=C.SAVE_KEY,old=N.PREVIOUS_STORAGE_PREFIX+key,next=N.STORAGE_PREFIX+key;
function fixture(values={}){const data=new Map(Object.entries(values)),writes=[];const raw={getItem:k=>data.has(k)?data.get(k):null,setItem(k,v){writes.push(k);data.set(k,v)}};return {data,writes,raw,store:N.isolatedStorage(raw)}}
function pending(){const before=prefix(2),r=new N.RestorationRun({slot:C.getSlot(3),attempt:before.attempt+1});r.start();r.nativeFrame.r.timerT=0;r.nativeFrame.u.score=400;r.nativeFrame.u.lives=0;r.nativeFrame.game.actor.actorState=13;r.nativeFrame.game.actor.frame=8;r.hits=3;r.tick(.095);return {before,result:r.result,save:C.commit(before,3,r.result)}}
test('R79 copies R78 pending receipt byte-exactly; reveal and duplicate commit are idempotent',()=>{
 const p=pending(),bytes=JSON.stringify(p.save),legacy=JSON.stringify(prefix(1)),f=fixture({[old]:bytes,[key]:legacy});
 const loaded=C.loadSave(f.store);assert.equal(loaded.ok,true);assert.equal(f.data.get(next),bytes);assert.equal(loaded.save.pendingUnlock.record.mechanicsVersion,77);
 const final=C.reveal(loaded.save,loaded.save.pendingUnlock.id);assert.equal(C.writeSave(f.store,final).ok,true);assert.equal(final.collected.length,3);assert.deepEqual(C.commit(final,3,p.result),final);assert.deepEqual(C.reveal(final,p.save.pendingUnlock.id),final);assert.equal(f.data.get(old),bytes);assert.equal(f.data.get(key),legacy);assert.ok(f.writes.every(k=>k===next));
 const again=C.loadSave(N.isolatedStorage(f.raw));assert.deepEqual(again.save,final);assert.deepEqual(final.records[p.before.collected[0]],p.before.records[p.before.collected[0]]);
});
test('R79 wins over R78 and legacy, and legacy-only saves copy without writes to their key',()=>{const a=JSON.stringify(prefix(3)),b=JSON.stringify(prefix(1));const f=fixture({[next]:a,[old]:b,[key]:b});assert.equal(C.loadSave(f.store).save.collected.length,3);assert.deepEqual(f.writes,[]);const g=fixture({[key]:b});assert.equal(C.loadSave(g.store).ok,true);assert.equal(g.data.get(next),b);assert.equal(g.data.get(key),b);assert.deepEqual(g.writes,[next])});
test('invalid existing or migrated saves fail closed without falling back to older progress',()=>{for(const value of ['{bad','',JSON.stringify({schema:999})]){for(const target of [old,next]){const f=fixture({[target]:value,[key]:JSON.stringify(prefix(1))});assert.equal(C.loadSave(f.store).readOnly,true);assert.equal(C.writeSave(f.store,C.createSave()).readOnly,true);assert.equal(f.data.get(target),value);assert.equal(f.data.get(next),value)}}});
test('storage failure never discards a legacy save or reports migration success',()=>{const bytes=JSON.stringify(prefix(1));for(const mode of ['throw','drop','read']){const f=fixture({[old]:bytes});if(mode==='read')f.raw.getItem=()=>{throw Error('blocked')};else f.raw.setItem=()=>{if(mode==='throw')throw Error('quota')};const r=C.loadSave(N.isolatedStorage(f.raw));assert.equal(r.ok,false);assert.equal(r.readOnly,true);assert.equal(f.data.get(old),bytes);assert.equal(f.data.has(next),false)}});
test('migrated setting credit stays unchanged and duplicate setting change cannot award twice',()=>{const r=new N.RestorationRun({slot:C.getSlot(17),period:'pm'});r.start();r.pause();assert.equal(r.setSetting('speed','fast').nativeCredit,true);assert.equal(r.setSetting('speed','fast').accepted,false);const k='synthetic-settings-credit',bytes=JSON.stringify({speed:'fast',credit:r.nativeFrame.r.credit}),f=fixture({[N.PREVIOUS_STORAGE_PREFIX+k]:bytes});assert.equal(f.store.getItem(k),bytes);f.store.setItem(k,JSON.stringify({speed:'normal',credit:1}));assert.equal(f.data.get(N.PREVIOUS_STORAGE_PREFIX+k),bytes);assert.equal(r.nativeFrame.r.credit,1)});

test('R79 complete precedence chain is byte-exact and older sources are immutable',()=>{
 assert.equal(N.STORAGE_PREFIX,'mongyu.r79.isolated.');assert.equal(N.PREVIOUS_STORAGE_PREFIX,'mongyu.r78.isolated.');assert.equal(N.R77_STORAGE_PREFIX,'mongyu.r77.isolated.');
 const keys=[next,old,N.R77_STORAGE_PREFIX+key,key];
 for(let start=0;start<keys.length;start++){
  const values=Object.fromEntries(keys.slice(start).map((k,i)=>[k,JSON.stringify(prefix(4-i),null,2)+'\n'])),f=fixture(values),bytes=values[keys[start]];
  assert.equal(C.loadSave(f.store).ok,true);assert.equal(f.data.get(next),bytes);
  for(const [k,v] of Object.entries(values))assert.equal(f.data.get(k),v);
  assert.deepEqual(f.writes,start===0?[]:[next]);
 }
});
test('R79 fails closed at every invalid chain level including future saves without older fallback',()=>{
 for(const source of [next,old,N.R77_STORAGE_PREFIX+key,key])for(const bytes of ['{bad','',JSON.stringify({schema:999})]){
  const values={[key]:JSON.stringify(prefix(1)),[source]:bytes},f=fixture(values);
  assert.equal(C.loadSave(f.store).readOnly,true);assert.equal(C.writeSave(f.store,C.createSave()).readOnly,true);
  assert.equal(f.data.get(next),bytes);for(const [k,v] of Object.entries(values))assert.equal(f.data.get(k),v);
  assert.ok(f.writes.every(k=>k===next));
 }
});
test('R77 and legacy pending receipts survive R79 reload/reveal exactly once',()=>{
 for(const source of [N.R77_STORAGE_PREFIX+key,key]){
  const p=pending(),bytes=JSON.stringify(p.save,null,2),f=fixture({[source]:bytes});
  const loaded=C.loadSave(f.store);assert.equal(loaded.ok,true);assert.equal(f.data.get(next),bytes);
  const final=C.reveal(loaded.save,loaded.save.pendingUnlock.id);assert.equal(C.writeSave(f.store,final).ok,true);
  assert.deepEqual(C.loadSave(N.isolatedStorage(f.raw)).save,final);assert.deepEqual(C.commit(final,3,p.result),final);
  assert.deepEqual(C.reveal(final,p.save.pendingUnlock.id),final);assert.equal(f.data.get(source),bytes);assert.ok(f.writes.every(k=>k===next));
 }
});

