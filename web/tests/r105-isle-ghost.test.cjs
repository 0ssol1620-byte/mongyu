const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {host:makeHost}=require('./host.cjs');
const SRC=path.resolve(__dirname,'..','src');
function ghostCtx(road){
 const ctx={MONGYU_UI_EDITION:true,console,Math,Number,MongyuRoad:road||{read:()=>({courses:{}})}};vm.createContext(ctx);ctx.globalThis=ctx;
 vm.runInContext(fs.readFileSync(path.join(SRC,'ghost-run.js'),'utf8'),ctx,{filename:'ghost-run.js'});return ctx.MongyuGhost;
}
/* A fake run: progress is a pure function of time; ticks come at a chosen step so frame rate independence can be checked. */
function fakeRun(f,opts={}){return {id:'c1',state:'play',time:0,options:opts.options||{},result:null,progress(){return f(this.time)}}}
function drive(G,run,seconds,dt){for(let t=0;t<seconds-1e-9;){t=Math.min(seconds,t+dt);run.time=t;G.tick(run)}}
const ramp=t=>Math.min(1,t/40);

test('sampling: progress every 0.5 s as per-mille, independent of the frame rate, ending at 1000',()=>{
 const G=ghostCtx();const out=[];
 for(const dt of [1/60,1/30,.07]){
  const run=fakeRun(ramp);drive(G,run,40,dt);run.state='clear';run.time=40;run.result={time:40};
  const g=G.take(run);assert.ok(g,'a clear run yields a ghost');out.push(g)}
 for(const g of out){assert.equal(g.time,40);assert.ok(g.samples.length>=80&&g.samples.length<=82);assert.equal(g.samples[0],0);assert.equal(g.samples.at(-1),1000);
  assert.ok(Math.abs(g.samples[40]-500)<=1,'t=20s is half way');for(let i=1;i<g.samples.length;i++)assert.ok(g.samples[i]>=g.samples[i-1])}
 assert.ok(Math.abs(out[0].samples[17]-out[1].samples[17])<=1&&Math.abs(out[1].samples[60]-out[2].samples[60])<=1)});

test('sampling: at most 400 samples; a run past 200 s keeps no ghost; fails, resumed and rewound runs keep none',()=>{
 const G=ghostCtx();
 const long=fakeRun(t=>Math.min(1,t/300));drive(G,long,260,.1);long.state='clear';long.result={time:260};assert.equal(G.take(long),null);assert.ok(long._ghost.s.length<=G.MAX);
 const fail=fakeRun(ramp);drive(G,fail,20,.05);fail.state='fail';assert.equal(G.take(fail),null);
 const resumed=fakeRun(ramp,{options:{resume:{index:2}}});drive(G,resumed,20,.05);resumed.state='clear';resumed.result={time:20};assert.equal(G.take(resumed),null);
 const rewound=fakeRun(ramp);drive(G,rewound,10,.05);rewound.time=2;G.tick(rewound);drive(G,rewound,12,.05);rewound.state='clear';rewound.result={time:12};assert.equal(G.take(rewound),null)});

test('reading: at() interpolates, clamps to the end; normalize() rejects damaged data and repairs ranges',()=>{
 const G=ghostCtx(),s=[0,100,300,1000];
 assert.equal(G.at(s,0),0);assert.equal(G.at(s,.25),.05);assert.equal(G.at(s,.5),.1);assert.equal(G.at(s,1),.3);assert.equal(G.at(s,99),1);assert.equal(G.at(null,3),null);assert.equal(G.at([5],1),null);
 for(const bad of [undefined,null,'x',{},[],[1],[0,'a',2],[0,NaN,1],new Array(401).fill(1)])assert.equal(G.normalize(bad),null);
 assert.equal(JSON.stringify(G.normalize([0,50,40,2000,-5])),'[0,50,50,1000,1000]');
 assert.equal(G.normalize(new Array(400).fill(7)).length,400)});

test('compare/label: ahead, behind and equal; no ghost means no marker and no calls on the canvas',()=>{
 const samples=[];for(let i=0;i<=81;i++)samples.push(Math.round(Math.min(1,i*.5/40)*1000));
 const G=ghostCtx({read:()=>({courses:{c1:{ghost:samples,ghostTime:40}}})});
 const run=fakeRun(t=>Math.min(1,t/36));run.time=18;const c=G.compare(run);assert.ok(c);assert.ok(Math.abs(c.ghost-.45)<.01);assert.ok(c.diff>.04);
 assert.equal(G.label(.044),'+4%');assert.equal(G.label(-.12),'−12%');assert.equal(G.label(.004),'±0');assert.equal(G.label(-.004),'±0');
 const calls=[];const cv=new Proxy({},{get:(o,k)=>(...a)=>{calls.push(k)},set:()=>true});
 G.drawMarker(cv,run,50,700,300);assert.ok(calls.includes('arc')&&calls.includes('fillText'),'draws a ring and the label');
 const none=ghostCtx();const run2=fakeRun(ramp);run2.time=10;assert.equal(none.compare(run2),null);calls.length=0;none.drawMarker(cv,run2,50,700,300);assert.equal(calls.length,0);
 // deterministic: same inputs, same numbers, and it never writes the run
 const before=JSON.stringify({s:run.state,t:run.time});G.compare(run);G.compare(run);assert.equal(JSON.stringify({s:run.state,t:run.time}),before)});

test('record: the fastest clear keeps its ghost (and bestTime); old saves without ghost still load and migrate on the next clear',()=>{
 const h=makeHost({square:true,restoration:true}),ctx=h.ctx;ctx.MONGYU_POLISH_EDITION=true;ctx.MONGYU_UI_EDITION=true;
 ctx.MongyuPolish={on(){return()=>{}},emit(){},host:{startRun(){return true},viewport:()=>({width:390,height:844}),settings:()=>({}),activeRun:()=>null}};
 for(const f of ['ui-icons.js','opening-run.js','illusion-course.js','chapters.js','ghost-run.js','course-run.js','road-mode.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 const Road=ctx.MongyuRoad,G=ctx.MongyuGhost;
 // an old save (no ghost, no bestTime, no memoryStars) loads untouched
 h.data.set('mongyu.r105.road',JSON.stringify({v:1,plays:2,last:'c1',courses:{c1:{g:7,stars:3,best:3000,clears:1,plays:2,bestShards:14,bestProgress:1}}}));
 assert.equal(Road.entry(Road.read(),'c1').best,3000);assert.equal(Road.entry(Road.read(),'c1').ghost,undefined);
 assert.equal(G.compare({id:'c1',time:5,progress:()=>.1}),null,'no ghost yet: nothing shown');
 const result=(time,score)=>({mode:'road',state:'clear',courseId:'c1',score,time,shards:14,shardTotal:14,deaths:0,progress:1});
 const mk=s=>[...Array(Math.round(s*2)+2).keys()].map(i=>Math.min(1000,Math.round(i*500/s)));
 Road.record(result(50,3200),{samples:mk(50),time:50});
 let e=Road.entry(Road.read(),'c1');assert.equal(e.ghostTime,50);assert.equal(e.ghost.length,102);assert.equal(e.bestTime,50);assert.equal(e.best,3200);assert.equal(e.memoryStars,undefined);
 Road.record(result(58,3300),{samples:mk(58),time:58});e=Road.entry(Road.read(),'c1');assert.equal(e.ghostTime,50,'a slower clear keeps the faster ghost');assert.equal(e.best,3300);
 Road.record(result(44,3100),{samples:mk(44),time:44});e=Road.entry(Road.read(),'c1');assert.equal(e.ghostTime,44);assert.equal(e.bestTime,44);assert.equal(e.ghost.length,90);
 Road.record({...result(10,0),state:'fail',progress:.3},null);e=Road.entry(Road.read(),'c1');assert.equal(e.ghostTime,44,'a failed run never touches the ghost');
 // the ghost reaches the next run through MongyuRoad.read()
 const next=Object.assign(Object.create(null),{id:'c1',time:22,progress:()=>.4});const cmp=G.compare(next);assert.ok(cmp&&Math.abs(cmp.ghost-.5)<.02);
 // a damaged ghost field is ignored, not fatal
 const d=Road.read();d.courses.c1.ghost='oops';Road.write(d);assert.equal(G.compare({id:'c1',time:3,progress:()=>0,_ghostRef:undefined}),null);assert.equal(Road.entry(Road.read(),'c1').best,3300,'best score keeps the maximum')});

test('wiring: course-run samples after each tick and draws the marker on the gauge only; nothing on the playfield',()=>{
 const run=fs.readFileSync(path.join(SRC,'course-run.js'),'utf8');
 assert.match(run,/this\.sync\(child\);root\.MongyuGhost\?\.tick\?\.\(this\)/);
 const hud=run.slice(run.indexOf('function hud('),run.indexOf('function draw('));assert.match(hud,/MongyuGhost\?\.drawMarker\?\.\(c,run,x0,gy,gw\)/);
 assert.doesNotMatch(run.slice(run.indexOf('function drawChild('),run.indexOf('function snapshot(')),/Ghost/);
 const g=fs.readFileSync(path.join(SRC,'ghost-run.js'),'utf8');assert.doesNotMatch(g,/Math\.random|Date\.now|\.score\s*=|\.state\s*=(?!=)/,'presentation only: no randomness, no writes to the run');
 const road=fs.readFileSync(path.join(SRC,'road-mode.js'),'utf8');assert.match(road,/MongyuGhost\?\.take\?\.\(run\)/)});
