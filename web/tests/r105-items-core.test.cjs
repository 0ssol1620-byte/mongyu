const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
const Items=require('../src/items.js');
const {host:makeHost}=require('./host.cjs');
const mem=()=>{const d={};return {getItem:k=>k in d?d[k]:null,setItem:(k,v)=>{d[k]=String(v)},removeItem:k=>{delete d[k]},d}};
/* A fake act: the fields the helpers read and write. */
function fakeRun(o={}){return {chain:{courseId:'c1',carry:{}},clock:0,time:0,points:0,score:0,perfectStreak:0,events:[],coach:null,...o}}
function armed(o={},items=[]){const r=fakeRun(o);Items.setup(r,{items,start:0,len:1000,beat:100});return r}

test('run.mods contract: shield, slowUntil, featherCharges, surgeUntil, all zero at the start', () => {
 const r=armed();
 assert.deepEqual(Object.keys(r.mods).sort(),['featherCharges','shield','slowUntil','surgeUntil']);
 assert.deepEqual({...r.mods},{shield:0,slowUntil:0,featherCharges:0,surgeUntil:0});
 assert.deepEqual(Items.newMods(),{shield:0,slowUntil:0,featherCharges:0,surgeUntil:0});
});

test('mods cross acts as time left (each act has its own clock) and clamp bad input', () => {
 const r=armed();r.mods.shield=2;r.mods.featherCharges=1;r.mods.slowUntil=3;r.mods.surgeUntil=2.5;r.clock=1;
 const out=Items.exportMods(r);
 assert.deepEqual({...out},{shield:2,featherCharges:1,slowLeft:2,surgeLeft:1.5});
 const next=fakeRun({chain:{carry:{mods:out,shielded:true}}});Items.setup(next,{items:[]});
 assert.equal(next.mods.shield,2);assert.equal(next.mods.featherCharges,1);assert.equal(next.mods.slowUntil,2);assert.equal(next.mods.surgeUntil,1.5);assert.equal(next.shielded,true);
 const bad=Items.importMods({shield:99,featherCharges:-4,slowLeft:999,surgeLeft:NaN},0);
 assert.equal(bad.shield,Items.TUNING.maxShield);assert.equal(bad.featherCharges,0);assert.equal(bad.slowUntil,Items.TUNING.slowTime);assert.equal(bad.surgeUntil,0);
});

test('bubble: one hit is absorbed, the no-hit star is lost, event shield-break', () => {
 const r=armed();assert.equal(Items.applyHit(r),false);assert.equal(r.shielded,false);
 r.mods.shield=1;assert.equal(Items.applyHit(r),true);
 assert.equal(r.mods.shield,0);assert.equal(r.shielded,true);assert.deepEqual(r.events,['shield-break']);assert.equal(r.lastItem.kind,'shield-break');
 assert.equal(Items.applyHit(r),false);
});

test('starlight time: 0.7x for 4 s of the raw clock, eased in and out', () => {
 const r=armed();r.mods.slowUntil=4;
 let step=0;for(let i=0;i<60;i++)step=Items.applyPace(r,1/120);
 assert.ok(step<1/120*.8,'slowing');
 for(let i=0;i<240;i++)step=Items.applyPace(r,1/120);
 assert.ok(Math.abs(step/(1/120)-.7)<.005,'settled at 0.7');
 r.clock=4.2;for(let i=0;i<120;i++)step=Items.applyPace(r,1/120);
 assert.equal(step,1/120);
 assert.equal(Items.applyPace({},1),1,'no mods: untouched');
});

test('cloud feather: the next jump only, longer and higher', () => {
 const r=armed();assert.equal(Items.applyJump(r,.66),.66);assert.equal(r.pk,1);
 r.mods.featherCharges=2;
 assert.equal(Items.applyJump(r,.66),.66*Items.TUNING.featherLen);assert.equal(r.pk,Items.TUNING.featherPeak);assert.equal(r.mods.featherCharges,1);
 assert.equal(Items.applyJump(r,.66),.66*Items.TUNING.featherLen);assert.equal(r.mods.featherCharges,0);
 assert.equal(Items.applyJump(r,.66),.66);assert.equal(r.pk,1);
});

test('aurora surge: perfect x3 starts 4 s of double points; only while it lasts', () => {
 const r=armed();
 r.perfectStreak=2;r.points=100;Items.settle(r);assert.equal(r.points,100);assert.equal(r.mods.surgeUntil,0);
 r.perfectStreak=3;r.points=250;r.score=250;Items.settle(r);
 assert.equal(r.mods.surgeUntil,Items.TUNING.surgeTime);assert.ok(r.events.includes('surge'));
 assert.equal(r.points,100+(250-100)*2,'the perfect that triggers it is already doubled');
 r.points+=60;r.score+=60;r.clock=2;Items.settle(r);assert.equal(r.points,100+300+120);
 r.clock=4.5;const before=r.points;r.points+=60;Items.settle(r);assert.equal(r.points,before+60,'over');
 r.perfectStreak=6;Items.settle(r);assert.equal(r.events.filter(e=>e==='surge').length,2,'streak 6 renews it');
 r.perfectStreak=3;r.events.length=0;r.mods.surgeUntil=0;Items.settle(r);assert.equal(r.events.length,0,'a lower streak never triggers');
});

test('surge also doubles the points already written into the result', () => {
 const r=armed();r.mods.surgeUntil=9;r.points=0;Items.settle(r);
 r.points=50;r.result={points:50,score:50,mode:'dream'};Items.settle(r);
 assert.equal(r.points,100);assert.equal(r.result.points,100);
});

test('pickups: lane lo on the ground, lane hi at the top of a jump, in reach only, deterministic order', () => {
 const items=[{at:.3,kind:'time'},{at:.1,kind:'bubble'},{at:.5,kind:'feather'},{at:.7,kind:'star'},{at:.9,kind:'ring'},{at:.2,kind:'nonsense'},{beat:4,kind:'bubble'}];
 const r=armed({},items);
 assert.deepEqual(r.itemList.map(i=>i.kind),['bubble','time','bubble','feather','memory-star'],'aliases normalised, unknown kinds (and the unbuilt ring device) dropped');
 assert.deepEqual(r.itemList.map(i=>i.at),[100,300,400,500,700],'at (fraction) and beat both resolve, sorted');
 assert.equal(r.itemList.find(i=>i.kind==='memory-star').lane,'hi');
 Items.collect(r,90,0,40,10);assert.equal(r.mods.shield,1);assert.deepEqual(r.events,['item']);assert.equal(r.lastItem.kind,'bubble');
 Items.collect(r,90,0,40,10);assert.equal(r.mods.shield,1,'only once');
 Items.collect(r,300,30,40,10);assert.equal(r.mods.slowUntil,0,'lane lo needs the ground');
 Items.collect(r,300,2,40,10);assert.equal(r.mods.slowUntil,Items.TUNING.slowTime);
 Items.collect(r,500,0,40,10);assert.equal(r.mods.featherCharges,1);
 Items.collect(r,700,0,40,10);assert.equal(r.gotStar,false,'lane hi ignores the ground');
 Items.collect(r,700,30,40,10);assert.equal(r.gotStar,true);
 assert.match(r.coach.text,/기억의 별/);
 Items.collect(r,160,0,40,10);assert.equal(r.mods.shield,1,'out of reach');
});

test('the assist bubble is a normal bubble that marks the run as assisted', () => {
 const r=armed({},[{at:.04,kind:'bubble',assist:true}]);Items.collect(r,40,0,40,10);
 assert.equal(r.mods.shield,1);assert.equal(r.assisted,true);
});

test('memory star persists in the road record and stays compatible with MongyuRoad', () => {
 const h=makeHost({square:true,restoration:true}),ctx=h.ctx;ctx.MONGYU_POLISH_EDITION=true;ctx.MONGYU_UI_EDITION=true;
 ctx.MongyuPolish={on(){return()=>{}},emit(){},host:{startRun(){return true},viewport:()=>({width:390,height:844}),settings:()=>({}),activeRun:()=>null}};
 const SRC=path.resolve(__dirname,'..','src');
 for(const f of ['opening-run.js','illusion-course.js','items.js','course-run.js','road-mode.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 const I=ctx.MongyuItems,R=ctx.MongyuRoad;
 assert.equal(I.ROAD_KEY,R.KEY);assert.equal(I.hasMemoryStar('c1'),false);
 assert.equal(I.saveMemoryStar('c1'),true);assert.equal(I.saveMemoryStar('c1'),false,'second time is not new');
 assert.equal(I.hasMemoryStar('c1'),true);assert.equal(R.read().courses.c1.memoryStars,1);
 /* a clear recorded by road-mode keeps the star, a star saved after a clear keeps the stars */
 const res={mode:'road',state:'clear',courseId:'c1',score:3000,points:2800,progress:1,shards:14,shardTotal:14,deaths:0,attempt:1};
 R.record(res);assert.equal(R.read().courses.c1.memoryStars,1);assert.equal(R.read().courses.c1.stars,3);
 R.record({...res,courseId:'c2'});I.saveMemoryStar('c2');
 const c2=R.read().courses.c2;assert.equal(c2.memoryStars,1);assert.equal(c2.stars,3);assert.equal(c2.clears,1);
 assert.deepEqual(JSON.parse(JSON.stringify(I.memoryStars())),{c1:1,c2:1});assert.equal(I.totalMemoryStars(),2);
 /* unplayed course: the entry is created with road-mode defaults */
 I.saveMemoryStar('c4');assert.deepEqual(JSON.parse(JSON.stringify(R.read().courses.c4)),{g:0,stars:0,best:0,clears:0,plays:0,bestShards:0,bestProgress:0,memoryStars:1});
 assert.equal(R.unlocked(1),true);
});

test('storage failures never throw', () => {
 Items.setStorage({getItem(){throw Error('no')},setItem(){throw Error('no')}});
 assert.equal(Items.hasMemoryStar('c1'),false);assert.equal(Items.saveMemoryStar('c1'),false);assert.deepEqual(Items.memoryStars(),{});
 Items.setStorage(mem());
});

test('chips and drawing are inert without mods and use only simple canvas calls', () => {
 const calls=[],c=new Proxy({},{get:(t,k)=>k==='measureText'?()=>({width:20}):k==='getTransform'?undefined:(...a)=>{calls.push(k)},set:()=>true});
 const r=armed();Items.drawChips(c,r,195,90);Items.drawAura(c,r,10,10,20,0,false);assert.equal(calls.filter(k=>['stroke','fill','fillText','drawImage'].includes(k)).length,0);
 r.mods.shield=1;r.mods.slowUntil=2;r.mods.featherCharges=1;r.mods.surgeUntil=3;
 assert.deepEqual(Items.chipList(r).map(c2=>c2.kind),['bubble','time','feather','light']);
 Items.drawChips(c,r,195,90);Items.drawAura(c,r,10,10,20,0,false);assert.ok(calls.length>10);
 assert.equal(Items.drawLight(c,0,0,10,0,0,false,0),false,'no art decoded: the act draws its own shard');
 r.itemList=[{kind:'bubble',at:1,lane:'lo',got:false,gotAt:-10,phase:0}];assert.doesNotThrow(()=>Items.drawItems(c,r,()=>({x:1,y:1,s:1}),0,false,0));
});

test('blink in the last second stays at or under 2 Hz and holds steady when reduced', () => {
 const states=[];for(let t=0;t<1;t+=.01)states.push(Items.blinkAlpha(.9,3+t,false)<1);
 let flips=0;for(let i=1;i<states.length;i++)if(states[i]!==states[i-1])flips++;
 assert.ok(flips<=4,'at most 2 cycles in one second: '+flips);
 assert.equal(Items.blinkAlpha(3,5,false),1);assert.equal(Items.blinkAlpha(.5,5.1,true),.6);
});
