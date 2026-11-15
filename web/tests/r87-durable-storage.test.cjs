const test=require('node:test'),assert=require('node:assert/strict'),S=require('../src/durable-storage.js');
function storage(values={}){const m=new Map(Object.entries(values));return{m,getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)}}
function journal(){const m=new Map();return{m,read:k=>m.get(k)??null,write(k,v){m.set(k,'v'+v);return true},remove(k){m.set(k,'d');return true}}}
test('an acknowledged native save survives immediate loss of all browser storage',()=>{
 const original=storage(),native=journal(),first=S.create(original,native);first.setItem('mongyu.r38.restoration.v2','{"collected":[1]}');first.setItem('mongyu.r80.style.v1','ink');
 const restarted=S.create(storage(),native);assert.equal(restarted.getItem('mongyu.r38.restoration.v2'),'{"collected":[1]}');assert.equal(restarted.getItem('mongyu.r80.style.v1'),'ink');
});
test('legacy browser saves migrate once and a newer native record takes precedence',()=>{
 const browser=storage({'quad-rift-v5':'legacy'}),native=journal(),s=S.create(browser,native);assert.equal(s.getItem('quad-rift-v5'),'legacy');assert.equal(native.m.get('quad-rift-v5'),'vlegacy');s.setItem('quad-rift-v5','new');browser.setItem('quad-rift-v5','stale');assert.equal(s.getItem('quad-rift-v5'),'new');
});
test('failed native commits and migrations are reported without pretending the browser copy is durable',()=>{
 const browser=storage({'mongyu.save':'previous'}),native={read:()=>null,write:()=>false,remove:()=>false},s=S.create(browser,native);assert.throws(()=>s.setItem('mongyu.save','new'),/Durable save failed/);assert.equal(browser.getItem('mongyu.save'),'previous');assert.throws(()=>s.getItem('mongyu.save'),/migration failed/);assert.throws(()=>s.removeItem('mongyu.save'),/removal failed/);
});
test('removal tombstones prevent an old browser mirror from resurrecting deleted data',()=>{
 const browser=storage({'mongyu.save':'old'}),native=journal(),s=S.create(browser,native);s.getItem('mongyu.save');s.removeItem('mongyu.save');browser.setItem('mongyu.save','stale');assert.equal(s.getItem('mongyu.save'),null);assert.equal(browser.getItem('mongyu.save'),null);
});
test('the browser API is untouched and unowned keys never enter the native journal',()=>{
 const browser=storage(),native=journal();assert.equal(S.create(browser,null),browser);const s=S.create(browser,native);s.setItem('outside','web');assert.equal(s.getItem('outside'),'web');assert.equal(native.m.size,0);for(const k of ['../mongyu.save','mongyu./path','mongyu.'+'x'.repeat(160),'mongyu.save\n'])assert.equal(S.owns(k),false);
});

test('all shipped legacy and current save namespaces enter the native journal',()=>{
 const native=journal(),s=S.create(storage(),native);for(const key of ['mongyu-square-dream-v1','mongyu-arcade-personal-v1','mongyu-r34-journey-v1','mongyu-origin-route-v1','mongyu-origin-memories-v1','mongyu-r36-commerce-lab-v1','quad-rift-hd-r4-backup','mongyu.r38.restoration.v2','mongyu.r40.mastery.v1','mongyu.r80.style.v1']){s.setItem(key,'saved');assert.equal(native.m.get(key),'vsaved');}
});
