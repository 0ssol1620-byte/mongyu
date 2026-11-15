import test from 'node:test';import assert from 'node:assert/strict';
import {zipIndex,storedZip,unzipEntry,prepareOriginal,crc32} from '../../web/original/archive.mjs';
import {SaveJournal,parseSave} from '../../web/original/storage.mjs';
import {OriginalRuntime} from '../../web/original/runtime.mjs';
const bytes=s=>new TextEncoder().encode(s),id='a'.repeat(64),snapshot=s=>bytes('WIESAV01'+s),memory=()=>{const data=new Map();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}};
const fakeResources=()=>storedZip(['nom1.pzx','dog1.pzx','gm1.pzx','nyun1.pzx','GETSKINTABLE.bin','BgmStage01.mmf','BgmStage10.mmf','client.bin1108'].map(name=>[name,bytes('synthetic fixture, not game data')]));
test('ZIP entries are CRC checked and traversal, duplicate paths and invalid directory ranges fail',async()=>{
 const zip=storedZip([['data',bytes('hello')]]),index=zipIndex(zip);assert.equal(new TextDecoder().decode(await unzipEntry(zip,index[0])),'hello');assert.equal(crc32(bytes('123456789')),0xcbf43926);
 const changed=zip.slice();changed[index[0].start]^=1;await assert.rejects(unzipEntry(changed,index[0]),/검사/);
 for(const name of ['../bad','/bad','a/../bad','a\\bad'])assert.throws(()=>zipIndex(storedZip([[name,bytes('x')]])),/경로/);
 assert.throws(()=>zipIndex(storedZip([['a',bytes('x')],['a',bytes('y')]])),/경로/);
 const corrupt=zip.slice();new DataView(corrupt.buffer).setUint32(corrupt.length-6,0xffffffff,true);assert.throws(()=>zipIndex(corrupt),/구조/);
});
test('the player refuses unrelated files and bare KTF resources receive only a container descriptor',async()=>{
 await assert.rejects(prepareOriginal(storedZip([['unrelated.txt',bytes('no')]]),'x.zip'),/놈3/);
 const jar=fakeResources(),prepared=await prepareOriginal(jar,'my-original.jar');assert.equal(prepared.engineName,'original.zip');const index=zipIndex(prepared.engineBytes),inside=await unzipEntry(prepared.engineBytes,index.find(x=>x.name.endsWith('.jar')));assert.deepEqual(inside,jar,'commercial resource bytes must not be replaced by authored assets');assert.equal(prepared.resourceCount,8);assert.equal(prepared.originalMusicFiles,2);
 const wrapped=storedZip([['folder/__adf__',bytes('MClass:Nom3\n')],['folder/original.jar',jar]]);const normalized=await prepareOriginal(wrapped,'original.zip');assert.ok(zipIndex(normalized.engineBytes).some(x=>x.name==='__adf__'));
});
test('a save journal reloads its own opaque bytes and cannot accept a different game or silent damage',()=>{
 const storage=memory(),journal=new SaveJournal(id,storage);assert.equal(journal.load(),null);assert.equal(journal.write(snapshot('first')),true);assert.equal(journal.write(snapshot('first')),false);journal.write(snapshot('second'));
 assert.deepEqual(new SaveJournal(id,storage).load().bytes,snapshot('second'));storage.data.set(journal.key,'damaged');const recovered=new SaveJournal(id,storage).load();assert.equal(recovered.recovered,true);assert.deepEqual(recovered.bytes,snapshot('first'));
 assert.throws(()=>parseSave(storage.getItem(journal.key+'.backup'),'b'.repeat(64)));storage.data.set(journal.key+'.backup','also damaged');assert.throws(()=>new SaveJournal(id,storage).load(),/지우지/);assert.equal(storage.getItem(journal.key),'damaged');
});
test('a failed new save retains the previous valid record and reports failure',()=>{
 const storage=memory(),journal=new SaveJournal(id,storage);journal.write(snapshot('previous'));const key=journal.key,base=storage.setItem;storage.setItem=(k,v)=>{if(k===key)throw Error('disk full');base(k,v)};assert.throws(()=>journal.write(snapshot('new')),/disk full/);assert.deepEqual(new SaveJournal(id,storage).load().bytes,snapshot('previous'));
});
function fixture(){const events=[],queue=new Map();let seq=0;globalThis.requestAnimationFrame=f=>{queue.set(++seq,f);return seq};globalThis.cancelAnimationFrame=i=>queue.delete(i);class Emulator{constructor(){this.exit=false;this.save=snapshot('counter0');this.ticks=0}tick(){this.ticks++;events.push('tick')}key_down(k){events.push('down:'+k)}key_up(k){events.push('up:'+k)}has_saves(){return true}export_saves(){return this.save}import_saves(b){events.push('restore');this.save=b;return true}has_exited(){return this.exit}free(){events.push('free')}platform_kind(){return 'KTF'}speed(){return 1}achieved_speed(){return 1}}
 const storage=memory(),runtime=new OriginalRuntime({canvas:{},factory:Emulator,storage});return {runtime,events,queue,storage,step(){const [i,f]=queue.entries().next().value;queue.delete(i);f(performance.now())}}}
test('pause releases held input, stops future ticks and preserves original save bytes before resume',async()=>{
 const f=fixture();await f.runtime.start({id,engineName:'original.zip',engineBytes:bytes('fixture')});f.runtime.press('OK');f.runtime.press('OK');f.step();assert.equal(f.events.filter(e=>e==='down:OK').length,1);assert.equal(f.runtime.pause(),true);assert.deepEqual(f.runtime.inspect().held,[]);assert.equal(f.queue.size,0);assert.ok(f.events.includes('up:OK'));assert.equal(f.runtime.inspect().savedSequence,1);await f.runtime.resume();assert.equal(f.queue.size,1);f.runtime.stop();assert.equal(f.queue.size,0);assert.deepEqual(new SaveJournal(id,f.storage).load().bytes,snapshot('counter0'));
});
test('normal guest exit is preserved once and never keeps running the guest',async()=>{
 const f=fixture();await f.runtime.start({id,engineName:'original.zip',engineBytes:bytes('fixture')});f.runtime.emulator.exit=true;f.step();assert.equal(f.runtime.state,'ended');assert.equal(f.queue.size,0);assert.equal(f.runtime.inspect().savedSequence,1);f.runtime.stop();
});
test('future saves fail closed and recovered corruption is archived before the first new save',()=>{
 const storage=memory(),journal=new SaveJournal(id,storage);journal.write(snapshot('one'));journal.write(snapshot('two'));storage.data.set(journal.key,'damaged');const recovered=new SaveJournal(id,storage);assert.equal(recovered.load().recovered,true);recovered.write(snapshot('three'));assert.equal(storage.getItem(journal.key+'.damaged'),'damaged');
 const before=storage.getItem(journal.key);storage.data.set(journal.key+'.backup','{"schema":2}');assert.throws(()=>new SaveJournal(id,storage).load(),/새 버전/);assert.equal(storage.getItem(journal.key),before);
});
