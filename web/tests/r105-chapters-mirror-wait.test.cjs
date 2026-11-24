const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
for(const f of ['trip-palettes','items','endless-dream'])require('../src/'+f+'.js');
const Square=require('../src/square-act.js'),Course=require('../src/course-run.js'),E=globalThis.MongyuEndless,Items=globalThis.MongyuItems;
const VP={width:390,height:844},DT=1/120;
const chain=(o={})=>({index:1,count:3,first:false,last:false,carry:{points:500,shards:3,perfectStreak:2,hearts:1},bpm:100,seed:77,...o});
const mkSquare=(o={})=>Square.ACTS.square({viewport:VP,settings:{},sides:6,chain:chain(),...o});
const mkFlip=(o={})=>Square.ACTS.flip({viewport:VP,settings:{},beats:24,chain:chain(),...o});
const mkMirror=(o={})=>Square.ACTS.mirror({viewport:VP,settings:{},beats:30,chain:chain(),...o});
const mkWait=(o={})=>Square.ACTS.wait({viewport:VP,settings:{},waits:1,chain:chain({bpm:76}),...o});
function play(run,{mode='collect',max=120*150}={}){
 const cr={action:()=>run.action()},seen=[];run.start();let n=0;
 while(run.state==='play'&&n++<max){run.pilot(cr,mode);run.tick(DT);for(const e of run.drainEvents())seen.push(e)}
 return {n,seconds:n*DT,seen};
}
const contract=run=>{
 for(const k of ['state','mode','dreamMode','time','clock','updates','score','hearts','distance','events','coach','crash','result','attempt','outro','perfectStreak','polish'])assert.ok(k in run,'field '+k);
 for(const m of ['setViewport','start','pause','resume','retry','inputDown','inputUp','cancelInput','tick','drainEvents','status','drawSelf'])assert.equal(typeof run[m],'function',m);
 assert.equal(run.mode,'dream');assert.equal(run.polish,true);assert.equal(run.state,'ready');
};
const proxyCtx=(modes)=>{const g=()=>({addColorStop(){}}),calls=[];return {calls,ctx:new Proxy({canvas:{width:390,height:844},createLinearGradient:g,createRadialGradient:g,getTransform:()=>({a:1,b:0}),measureText:()=>({width:40})},{get:(o,k)=>k in o?o[k]:(k==='fillStyle'||k==='strokeStyle'?'':(...a)=>{calls.push(k)}),set:(o,k,v)=>{if(modes&&k==='globalCompositeOperation')modes.add(v);o[k]=v;return true}})}};
globalThis.Path2D=class{moveTo(){}lineTo(){}arcTo(){}arc(){}rect(){}closePath(){}};

test('mirror and wait register and follow the act contract', () => {
 assert.ok(Course.hasAct('mirror')&&Course.hasAct('wait'));
 for(const type of ['mirror','wait']){const run=Course.resolveAct(type)({viewport:VP,settings:{},chain:chain()});contract(run);assert.equal(run.dreamMode,type);assert.ok(run.status().progress>=0)}
});

test('mirror: deterministic layout on the beat grid; the twin hazard sits one beat after the tap it needs; taps are 2+ beats apart', () => {
 const a=Square.buildMirror({bpm:100,seed:4,beats:40,level:1}),b=Square.buildMirror({bpm:100,seed:4,beats:40,level:1}),c=Square.buildMirror({bpm:100,seed:5,beats:40,level:1});
 assert.deepEqual(a.events,b.events);assert.notDeepEqual(a.events.map(e=>e.m),c.events.map(e=>e.m));assert.equal(a.length,a.beats*a.B);
 assert.ok(a.events.some(e=>e.kind==='twin')&&a.events.some(e=>e.kind!=='twin'));
 a.events.forEach((e,i)=>{assert.equal(e.m,Math.round(e.m));if(i)assert.ok(e.m-a.events[i-1].m>=2);
  assert.equal(a.own.some(o=>o.at===e.m*a.B),e.kind!=='twin');assert.equal(a.twin.some(o=>o.at===(e.m+1)*a.B),e.kind!=='me')});
 assert.equal(Square.buildMirror({bpm:100,seed:4,beats:40,level:0,tutorial:true}).events[0].kind,'both');
 for(const lv of [0,1,2,3])assert.ok(Square.buildMirror({bpm:100,seed:9,beats:44,level:lv}).events.length>=4);
});

test('mirror: the twin repeats every tap one beat later; clearing needs the taps for BOTH lanes; a twin-only hazard fails if you skip its tap', () => {
 const run=mkMirror({level:2}),{seen}=play(run);assert.equal(run.state,'clear',JSON.stringify(run.result));assert.ok(seen.includes('perfect'));assert.equal(run.result.shards,run.shardTotal);
 const t=mkMirror();t.start();t.action();assert.equal(t.tfly,null);const delay=t.course.delay;let n=0;while(t.tfly===null&&n++<120*3)t.tick(DT);assert.ok(Math.abs(t.gt-delay)<=.02,'twin jumps '+t.gt.toFixed(3)+'s after the tap, expected '+delay.toFixed(3));
 const C=mkMirror({level:3,beats:44}).course,twinEv=C.events.find(e=>e.kind==='twin');assert.ok(twinEv);
 const skip=mkMirror({level:3,beats:44});skip.start();n=0;const cr={action:()=>skip.action()};
 while(skip.state==='play'&&n++<120*60){const e=skip.course.events[skip.next];if(e&&e.idx===twinEv.idx){if(skip.x>e.m*skip.course.B+60)skip.next++}else skip.pilot(cr);skip.tick(DT)}
 assert.equal(skip.state,'fail');assert.match(skip.result.reason,/거울 속 내가/);
 const lazy=mkMirror();lazy.start();n=0;while(lazy.state==='play'&&n++<120*30)lazy.tick(DT);assert.equal(lazy.state,'fail');
 const sloppy=mkMirror({level:1});play(sloppy,{mode:'ignore'});assert.equal(sloppy.state,'clear');
 assert.equal(mkMirror().coach,null);assert.equal(mkMirror({tutorial:true}).coach.kind,'start');
});

test('mirror: items (bubble absorbs a hit, feather is copied by the twin), score carry, chain.last and drawing', () => {
 const lazy=mkMirror({level:3,beats:44,items:[]});lazy.mods.shield=1;lazy.start();let n=0,broke=false;
 while(lazy.state==='play'&&n++<120*30){lazy.tick(DT);if(lazy.drainEvents().includes('shield-break')){broke=true;break}}assert.ok(broke&&lazy.state==='play');
 const f=mkMirror();f.mods.featherCharges=1;f.start();f.action();assert.ok(Math.abs(f.q[0].fl-E.FLIGHT*Items.TUNING.featherLen)<1e-9);assert.ok(f.q[0].pk>1,'the twin copies the feather jump');
 const run=mkMirror({level:1});play(run);assert.ok(run.result.points>500);
 const l=mkMirror({chain:chain({last:true})});l.start();n=0;let gate=-1;const cr={action:()=>l.action()};while(l.state==='play'&&n++<120*60){l.pilot(cr);l.tick(DT);if(l.finishing&&gate<0)gate=n}
 assert.equal(l.state,'clear');assert.ok(n-gate>=100);
 const {ctx,calls}=proxyCtx();
 for(const trip of ['c4','violet','nope'])for(const reduced of [false,true]){const r=mkMirror({trip,hud:trip!=='c4',items:[{at:.3,kind:'bubble',lane:'lo'},{at:.6,kind:'memory-star',lane:'hi'}]});r.start();for(let i=0;i<120*4;i++){r.pilot({action:()=>r.action()});r.tick(DT)}assert.doesNotThrow(()=>r.drawSelf(ctx,{viewport:VP,reduced,time:r.time}),trip)}
 assert.ok(calls.length>200);
});

test('wait: layout is deterministic; hazards and doors are on the beat grid, room between the last jump and the next door', () => {
 const a=Square.buildWait({bpm:76,seed:3,waits:2,level:1}),b=Square.buildWait({bpm:76,seed:3,waits:2,level:1});
 assert.deepEqual(a.hazards,b.hazards);assert.deepEqual(a.doors,b.doors);assert.equal(a.doors.length,2);assert.ok(a.hazards.length>=3);
 for(const d of a.doors){assert.ok(d.hold>=3&&d.hold<=5);assert.equal(d.at,d.beat*a.B);const before=a.hazards.filter(h=>h.at<d.at).pop();assert.ok(!before||d.at-before.at>=a.B*3,'room between the last jump and the elevator')}
 assert.equal(Square.buildWait({bpm:76,seed:3,waits:3,level:2}).doors.length,3);assert.ok(a.holdSeconds>3);
});

test('wait: the car brakes to a stop in front of the door and opens after the hold; NOT pressing clears, any tap while waiting fails', () => {
 const run=mkWait({level:1,waits:2}),seen=[];let stopped=0,maxHold=0;run.start();const cr={action:()=>run.action()};let n=0;
 while(run.state==='play'&&n++<120*150){run.pilot(cr);run.tick(DT);for(const e of run.drainEvents())seen.push(e);if(run.zone&&run.zone.phase==='hold'){stopped++;maxHold=Math.max(maxHold,run.zone.t)}}
 assert.equal(run.state,'clear',JSON.stringify(run.result));assert.ok(seen.includes('wait'));assert.equal(run.waited,2);assert.ok(stopped>120*3,'stood still for seconds: '+stopped);assert.ok(maxHold>=run.course.doors[0].hold*60/76-.05);
 const t=mkWait({level:0});t.start();n=0;while(!t.inZone()&&n++<120*60){t.pilot({action:()=>t.action()});t.tick(DT)}assert.ok(t.inZone());
 t.tick(DT);t.action();assert.equal(t.outro.kind,'fail');let m=0;while(t.state==='play'&&m++<120*3)t.tick(DT);assert.equal(t.state,'fail');assert.equal(t.result.reason,'엘리베이터 버튼을 눌렀어요');
 const s=mkWait({level:0});s.start();n=0;while(!(s.zone&&s.zone.phase==='hold')&&n++<120*60){s.pilot({action:()=>s.action()});s.tick(DT)}const x0=s.x;for(let i=0;i<120;i++)s.tick(DT);assert.ok(Math.abs(s.x-x0)<1e-6,'the car stands still while holding');
});

test('wait: jumps still matter; items, chain.last, hud and drawing (palettes, reduced motion, colour-blind mode)', () => {
 const lazy=mkWait();lazy.start();let n=0;while(lazy.state==='play'&&n++<120*40)lazy.tick(DT);assert.equal(lazy.state,'fail');assert.match(lazy.result.reason,/트렁크/);
 const sloppy=mkWait({level:1,waits:2});play(sloppy,{mode:'ignore'});assert.equal(sloppy.state,'clear');
 assert.equal(mkWait().coach,null);assert.equal(mkWait({tutorial:true}).coach.kind,'start');assert.equal(mkWait({hud:false}).hudOff,true);
 const sh=mkWait({items:[{at:.1,kind:'bubble',lane:'lo'}]});sh.mods.shield=1;sh.start();n=0;let broke=false;while(sh.state==='play'&&n++<120*30){sh.tick(DT);if(sh.drainEvents().includes('shield-break')){broke=true;break}}assert.ok(broke&&sh.state==='play');
 const l=mkWait({chain:chain({last:true,bpm:76})});l.start();n=0;let gate=-1;const cr={action:()=>l.action()};while(l.state==='play'&&n++<120*120){l.pilot(cr);l.tick(DT);if(l.finishing&&gate<0)gate=n}assert.equal(l.state,'clear');assert.ok(n-gate>=100);
 const {ctx,calls}=proxyCtx();
 for(const trip of ['c5','violet'])for(const reduced of [false,true]){const r=mkWait({trip,items:[{at:.2,kind:'time',lane:'lo'}]});r.start();for(let i=0;i<120*12;i++){r.pilot({action:()=>r.action()});r.tick(DT)}assert.doesNotThrow(()=>r.drawSelf(ctx,{viewport:VP,reduced,time:r.time}),trip)}
 globalThis.document={documentElement:{dataset:{cvd:'on'}}};try{const r=mkWait();r.start();for(let i=0;i<300;i++)r.tick(DT);assert.doesNotThrow(()=>r.drawSelf(ctx,{viewport:VP,reduced:false,time:r.time}))}finally{delete globalThis.document}
 assert.ok(calls.length>200);
});

test('light palettes (blueprint chapters) draw every new act without additive glow washing out', () => {
 const Trip=globalThis.MongyuTrip;
 Trip.palettes.c9test={name:'t',sky:['#f4ddc5','#e8d3bb','#cdb5a0'],fog:'#aa9cc6',block:['#aa9cc6','#8b7ea8','#5b4f78'],rim:'#d75f61',rim2:'#aa9cc6',glow:'#d75f61',accent:'#8f90c5',danger:'#d75f61',gold:'#c9a258',aurora:'#75a6a1',ink:'#37333d'};
 try{
  const modes=new Set(),{ctx}=proxyCtx(modes);
  for(const make of [()=>mkFlip({trip:'c9test'}),()=>mkMirror({trip:'c9test'}),()=>mkWait({trip:'c9test'}),()=>mkSquare({trip:'c9test'})]){const r=make();r.start();for(let i=0;i<200;i++)r.tick(DT);r.drawSelf(ctx,{viewport:VP,reduced:false,time:r.time})}
  assert.ok(!modes.has('lighter'),'additive glow on a light sky: '+[...modes]);
  assert.equal(E.tripTheme('c9test').light,true);
 }finally{delete Trip.palettes.c9test}
});
