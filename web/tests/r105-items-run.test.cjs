const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
const SRC=path.resolve(__dirname,'..','src');
const Opening=require('../src/opening-run.js'),Illusion=require('../src/illusion-course.js'),Helix=require('../src/helix-act.js'),Pen=require('../src/penrose-act.js'),Items=require('../src/items.js'),Course=require('../src/course-run.js');
const mem={};Items.setStorage({getItem:k=>k in mem?mem[k]:null,setItem:(k,v)=>{mem[k]=String(v)},removeItem:k=>{delete mem[k]}});
const VP={width:390,height:844},DT=1/120,SLOT=Course.SLOT;
const chainOf=(o={})=>({index:1,count:3,first:false,last:false,carry:{points:0,shards:0,perfectStreak:0,hearts:1,...o.carry},bpm:100,seed:7,courseId:'c1'});
const tickUntil=(run,fn,max=120*90)=>{let n=0;while(run.state==='play'&&!fn(run)&&n++<max)run.tick(DT);return n*DT};
/* Test pilot (perfect timing). skip = obstacle indexes it never jumps. */
function pilot(run,c,skip=()=>false){
 if(!c||run.state!=='play'||run.portal&&!run.portal.swapped)return;
 const act=()=>typeof run.action==='function'?run.action():run.inputDown();
 if(c.openingCourse){const o=c.obstacles[c.index];if(!skip(c.index)&&o&&o.at-c.distance<=Opening.PERFECT_LEAD+1&&c.flight===null)act();return}
 const t=c.dreamMode;
 if(t==='helix'){const ob=c.course.obstacles[c.index];if(c.slow==='active'){act();return}if(!skip(c.index)&&ob&&c.flight===null&&(ob.at-c.distance)<=.34*c.speed+.5)act();return}
 if(t==='penrose'){const ob=c.course.obstacles[c.blockIndex];if(!skip(c.blockIndex)&&ob&&c.flight===null&&(ob.at-c.distance)<=.4*c.speed+.5)act();return}
 if(t==='align'){if(c.aligned)act();return}
 const g=c.activeGap?.();
 if(g){const ahead=g.s0-c.distance;if(ahead<=90&&ahead>10||c.slowChance==='active')act();return}
 const b=c.cs.COURSE.blocks[c.blockIndex];
 if(!skip(c.blockIndex)&&b&&b.at-c.distance<=Illusion.SPEED*c.fl/2+.5&&c.flight===null)act();
}
const drive=(c,skip)=>{c.start();let n=0;while(c.state==='play'&&n++<120*90){pilot(c,c,skip);c.tick(DT)}return c};

test('opening: a bubble swallows the first collision, the next one still ends the run', () => {
 const run=new Opening.OpeningRun({slot:SLOT,viewport:VP,settings:{},attempt:1,span:[0,0],chain:chainOf({carry:{mods:{shield:1}}}),items:[]});
 run.start();const seen=[];let atBreak=null,n=0;
 while(run.state==='play'&&n++<120*60){run.tick(DT);for(const e of run.drainEvents()){seen.push(e);if(e==='shield-break')atBreak={hits:run.hits,index:run.index,state:run.state}}}
 assert.deepEqual(atBreak,{hits:0,index:1,state:'play'},'the swallowed hit is not a hit and the obstacle counts as passed');
 assert.equal(seen.filter(e=>e==='shield-break').length,1);assert.equal(seen.filter(e=>e==='hit').length,1,'only the second collision');
 assert.equal(run.shielded,true);assert.equal(run.state,'fail');assert.equal(run.hits,1);
});

test('opening: the beat-grid jump physics are unchanged without items (fl/pk neutral)', () => {
 const a=new Opening.OpeningRun({slot:SLOT,viewport:VP,settings:{},attempt:1,span:[0,2],chain:chainOf()});
 assert.equal(a.fl,.66);assert.equal(a.pk,1);assert.equal(a.mods.shield,0);
 drive(a);assert.equal(a.state,'clear');assert.equal(a.hits,0);assert.equal(a.result.points>0,true);
});

test('feather: the next jump is longer and higher in every act; later jumps are normal again', () => {
 const mk={
  opening:()=>new Opening.OpeningRun({slot:SLOT,viewport:VP,settings:{},attempt:1,span:[0,2],chain:chainOf({carry:{mods:{featherCharges:1}}})}),
  helix:()=>new Helix.HelixRun({variant:'up',viewport:VP,settings:{},attempt:1,chain:chainOf({carry:{mods:{featherCharges:1}}})}),
  bridge:()=>new Illusion.IllusionRun({viewport:VP,settings:{},attempt:1,plan:Course.BRIDGES.garden,sections:[Course.TONES[0]],chain:chainOf({carry:{mods:{featherCharges:1}}})}),
  penrose:()=>new Pen.PenroseRun({viewport:VP,settings:{},attempt:1,chain:chainOf({carry:{mods:{featherCharges:1}}})})
 };
 for(const [name,make] of Object.entries(mk)){
  const run=make();run.start();run.tick(DT);
  const base=run.fl;run.jump();
  assert.ok(Math.abs(run.fl-base*Items.TUNING.featherLen)<1e-9,name+' flight length');assert.equal(run.pk,Items.TUNING.featherPeak,name);assert.equal(run.mods.featherCharges,0);
  let top=0,t=0;while(run.flight!==null&&t++<120*6){run.tick(DT);top=Math.max(top,run.height)}
  const peakBase=run.fl;run.jump();assert.equal(run.fl,base,name+' second jump normal');assert.equal(run.pk,1);
  assert.ok(top>0,name+' got airborne');void peakBase;
 }
});

test('starlight time: the act advances at 0.7x for four seconds, then at full speed', () => {
 const make=(slow)=>new Helix.HelixRun({variant:'up',viewport:VP,settings:{},attempt:1,skipIntro:true,chain:chainOf({carry:{mods:slow?{slowLeft:4}:null}})});
 const a=make(false),b=make(true);a.start();b.start();
 for(let i=0;i<120*1.5;i++){a.tick(DT);b.tick(DT)}
 const ratio=b.distance/a.distance;assert.ok(ratio>.68&&ratio<.82,'ratio '+ratio);
 assert.ok(Items.slowLeft(b)>2&&Items.slowLeft(b)<3);assert.equal(Items.slowLeft(a),0);
});

test('illusion: a bubble absorbs a block hit and turns an unturned bridge instead of the fall', () => {
 const mk=()=>new Illusion.IllusionRun({viewport:VP,settings:{},attempt:1,plan:Course.BRIDGES.garden,sections:[Course.TONES[0]],chain:chainOf({carry:{mods:{shield:2}}})});
 const run=mk();run.start();const seen=[];
 let n=0;while(run.state==='play'&&n++<120*40){run.tick(DT);for(const e of run.drainEvents())seen.push(e);if(seen.filter(e=>e==='shield-break').length>=2)break}
 assert.equal(seen.filter(e=>e==='shield-break').length,2);assert.equal(run.shielded,true);assert.equal(run.state,'play');assert.equal(run.hits,0);
 assert.ok(seen.includes('morph'),'the bridge turned by itself');
});

test('helix and penrose: a bubble is spent on the first crystal or block, the next one fails the act', () => {
 for(const run of [new Helix.HelixRun({variant:'up',viewport:VP,settings:{},attempt:1,skipIntro:true,chain:chainOf({carry:{mods:{shield:1}}})}),new Pen.PenroseRun({viewport:VP,settings:{},attempt:1,chain:chainOf({carry:{mods:{shield:1}}})})]){
  run.start();const seen=[];let n=0;while(run.state==='play'&&n++<120*60){run.tick(DT);for(const e of run.drainEvents())seen.push(e)}
  assert.equal(seen.filter(e=>e==='shield-break').length,1,run.dreamMode);assert.equal(run.state,'fail');assert.equal(run.shielded,true);
 }
});

test('surge: three perfects in a row switch on the aurora wave and double what follows', () => {
 const run=new Helix.HelixRun({variant:'up',viewport:VP,settings:{},attempt:1,chain:{...chainOf(),first:true}});
 drive(run);
 assert.equal(run.state,'clear');
 const seen=[];const again=new Helix.HelixRun({variant:'up',viewport:VP,settings:{},attempt:1,chain:{...chainOf(),first:true}});again.start();
 let n=0;while(again.state==='play'&&n++<120*60){pilot(again,again);again.tick(DT);for(const e of again.drainEvents())seen.push(e)}
 assert.ok(seen.includes('surge'));
 const plain=new Helix.HelixRun({variant:'up',viewport:VP,settings:{},attempt:1,chain:{...chainOf(),first:true},items:undefined});plain.mods=null;plain.itemState=null;
 drive(plain);assert.ok(run.result.points>plain.result.points,'double points while surging: '+run.result.points+' > '+plain.result.points);
});

/* ---- the course engine ---- */
const mkCourse=(id,extra={})=>new Course.CourseRun({...Course.courseById(id),viewport:VP,settings:{},attempt:1,...extra});
function play(run,{skip=()=>false,max=120*200}={}){run.start();let n=0;const log=[];while(run.state==='play'&&n++<max){pilot(run,run.child,skip);run.tick(DT);for(const e of run.drainEvents())if(['item','shield-break','surge'].includes(e))log.push({e,k:run.lastItem?.kind,t:n*DT,act:run.actIndex})}return {n,log,t:n*DT}}

test('chapter 1 items: deterministic, 0-2 gifts and one memory star per course, 25 s apart', () => {
 const gifts=[],stars=[];
 for(const course of Course.CHAPTER1.courses){
  const list=course.acts.flatMap(a=>a.opts.items||[]),g=list.filter(i=>Items.GIFTS.includes(i.kind)),s=list.filter(i=>i.kind==='memory-star');
  assert.ok(g.length<=2,course.id+' gifts');assert.equal(s.length,1,course.id+' memory star');
  for(const i of list){assert.ok(Items.normKind(i.kind));assert.ok(i.at>0&&i.at<1)}
  gifts.push(g.length);stars.push(s.length);
  for(const k in mem)delete mem[k];
  const a=play(mkCourse(course.id)),b=play(mkCourse(course.id));
  assert.deepEqual(a.log,b.log,course.id+' deterministic');
  const times=a.log.filter(l=>Items.GIFTS.includes(l.k)).map(l=>l.t);
  assert.equal(times.length,g.length,course.id+' every gift is on the pilot\'s path');
  for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=25,course.id+' gifts '+times.join(','));
 }
 assert.ok(gifts.some(n=>n===1)&&gifts.some(n=>n===2));
});

test('all five courses clear with and without the items, and the items do not change the clear time much', () => {
 for(const course of Course.CHAPTER1.courses){
  for(const k in mem)delete mem[k];
  const bare=mkCourse(course.id,{acts:course.acts.map(a=>({...a,opts:{...a.opts,items:undefined}}))});
  const withItems=mkCourse(course.id);
  const a=play(bare),b=play(withItems);
  assert.equal(bare.state,'clear',course.id);assert.equal(withItems.state,'clear',course.id);
  assert.ok(Math.abs(b.t-a.t)<=2.5,course.id+' '+a.t.toFixed(1)+' vs '+b.t.toFixed(1));
  assert.equal(withItems.result.memoryStar,true,course.id+' star on the perfect pilot\'s line or after');
 }
});

test('mods carry into the next act; a fail restores the act-start snapshot', () => {
 const run=mkCourse('c1',{acts:[{type:'floor-wall',opts:{span:[0,0],items:[{at:.95,kind:'bubble'},{at:.965,kind:'feather'},{at:.98,kind:'time'}]},weight:10},{type:'bridge',opts:{preset:'garden',tone:1},weight:12}]});
 run.start();let n=0;while(run.state==='play'&&run.actIndex===0&&n++<120*60){pilot(run,run.child);run.tick(DT)}
 assert.equal(run.actIndex,1);
 const m=run.child.mods;assert.equal(m.shield,1);assert.equal(m.featherCharges,1);assert.ok(m.slowUntil>3&&m.slowUntil<=4,'the starlight hour keeps its time left: '+m.slowUntil);
 assert.deepEqual(Object.keys(run.carries[1].mods).sort(),['featherCharges','shield','slowLeft','surgeLeft']);
 assert.equal(run.carries[1].mods.shield,1);assert.equal(run.carries[1].mods.featherCharges,1);
 /* spend them, die, retry: the new attempt starts with the snapshot again */
 for(let i=0;i<120*5&&run.portal;i++)run.tick(DT);
 run.child.mods.shield=0;run.child.mods.featherCharges=0;run.failAct(run.child);
 assert.equal(run.state,'fail');run.retry();
 assert.equal(run.child.mods.shield,1);assert.equal(run.child.mods.featherCharges,1);assert.equal(run.actIndex,1);
});

test('a used bubble costs the no-hit star; the swallowed hit is not a death', () => {
 const run=mkCourse('c1',{acts:[{type:'floor-wall',opts:{span:[0,0]},weight:10}],resume:{index:0,carry:{mods:{shield:1}}}});
 play(run,{skip:i=>i===0});
 assert.equal(run.state,'clear');assert.equal(run.result.deaths,0);assert.equal(run.result.shielded,true);
 assert.deepEqual(JSON.parse(JSON.stringify(Course.goals(run.result))),[true,true,false]);
 assert.deepEqual(JSON.parse(JSON.stringify(Course.goals({state:'clear',shards:14,shardTotal:14,deaths:0}))),[true,true,true],'plain results unchanged');
});

test('assist: after three fails of the same stretch a bubble waits near its start; using it costs the no-hit star', () => {
 const run=mkCourse('c1',{acts:[{type:'floor-wall',opts:{span:[0,2]},weight:10}]});
 run.start();
 for(let i=0;i<3;i++){assert.equal(run.child.itemList.length,0,'try '+(i+1));run.failAct(run.child);run.retry()}
 const bubble=run.child.itemList.find(i=>i.assist);assert.ok(bubble,'assist bubble on the 4th try');assert.equal(bubble.kind,'bubble');
 assert.ok(bubble.at<run.child.obstacles[0].at-60,'well before the first obstacle');
 const checkpoint=run.checkpointRun();assert.equal(checkpoint.failCounts[0],3);assert.ok(checkpoint.child.itemList.some(i=>i.assist),'host restart keeps the count');
 const off=mkCourse('c1',{assist:false,acts:[{type:'floor-wall',opts:{span:[0,2]},weight:10}]});off.start();for(let i=0;i<4;i++){off.failAct(off.child);off.retry()}
 assert.equal(off.child.itemList.length,0,'the helper can be switched off');
 /* picks the bubble, takes a hit: no no-hit star */
 run.start&&run.carry;const r2=mkCourse('c1',{acts:[{type:'floor-wall',opts:{span:[0,2]},weight:10}],resume:{index:0,fails:{0:3}}});
 play(r2,{skip:i=>i===0});assert.equal(r2.state,'clear');assert.equal(r2.result.assisted,true);assert.equal(Course.goals(r2.result)[2],false);
});

test('without the R105 flag the items are inert (R103/R104 behaviour)', () => {
 const ctx=vm.createContext({console,Path2D:undefined});ctx.globalThis=ctx;ctx.MONGYU_POLISH_EDITION=true;ctx.MONGYU_UI_EDITION=false;
 for(const f of ['opening-run.js','illusion-course.js','items.js','course-run.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 assert.equal(ctx.MongyuItems.enabled,false);
 const c=ctx.MongyuCourse.courseById('c1'),run=new ctx.MongyuCourse.CourseRun({...c,viewport:VP,settings:{},attempt:1});
 assert.equal(run.child.itemList,undefined);assert.equal(run.child.mods,undefined);
 const r={mods:{shield:1,featherCharges:1,slowUntil:0,surgeUntil:0},events:[]};
 assert.equal(ctx.MongyuItems.applyHit(r),false);assert.equal(ctx.MongyuItems.applyJump(r,.7),.7);assert.equal(ctx.MongyuItems.applyPace({mods:r.mods,itemState:{k:1}},1),1);
});
