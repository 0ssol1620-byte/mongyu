const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
for(const f of ['trip-palettes','items','endless-dream'])require('../src/'+f+'.js');
const Square=require('../src/square-act.js'),Course=require('../src/course-run.js'),E=globalThis.MongyuEndless,Items=globalThis.MongyuItems;
const VP={width:390,height:844},DT=1/120;
const chain=(o={})=>({index:1,count:3,first:false,last:false,carry:{points:500,shards:3,perfectStreak:2,hearts:1},bpm:100,seed:77,...o});
const mkSquare=(o={})=>Square.ACTS.square({viewport:VP,settings:{},sides:6,chain:chain(),...o});
const mkFlip=(o={})=>Square.ACTS.flip({viewport:VP,settings:{},beats:24,chain:chain(),...o});
function play(run,{pilot=true,mode='collect',max=120*120}={}){
 const cr={action:()=>run.action()},seen=[];run.start();let n=0;
 while(run.state==='play'&&n++<max){if(pilot)run.pilot(cr,mode);run.tick(DT);for(const e of run.drainEvents())seen.push(e)}
 return {n,seconds:n*DT,seen};
}
const contract=run=>{
 for(const k of ['state','mode','dreamMode','time','clock','updates','score','hearts','distance','events','coach','crash','result','attempt','outro','perfectStreak','polish'])assert.ok(k in run,'field '+k);
 for(const m of ['setViewport','start','pause','resume','retry','inputDown','inputUp','cancelInput','tick','drainEvents','status','drawSelf'])assert.equal(typeof run[m],'function',m);
 assert.equal(run.mode,'dream');assert.equal(run.polish,true);assert.equal(run.state,'ready');
};

test('both acts register with the course engine and follow the act contract', () => {
 assert.ok(Course.hasAct('square')&&Course.hasAct('flip'));
 for(const type of ['square','flip']){const run=Course.resolveAct(type)({viewport:VP,settings:{},chain:chain()});contract(run);assert.equal(run.dreamMode,type);const st=run.status();assert.ok(st.progress>=0&&st.progress<=1);assert.equal(st.state,'ready')}
 assert.equal(typeof Square.register,'function');
});

test('square: finite, deterministic from the seed, hazards snap to the half-beat grid, no hazard near the gate', () => {
 const a=mkSquare(),b=mkSquare(),c=mkSquare({chain:chain({seed:78})});
 assert.deepEqual(a.obstacles.map(o=>[o.kind,o.at]),b.obstacles.map(o=>[o.kind,o.at]));
 assert.notDeepEqual(a.obstacles.map(o=>o.at),c.obstacles.map(o=>o.at));
 assert.ok(a.obstacles.length>=6,'obstacles '+a.obstacles.length);
 assert.ok(a.length>1500&&a.length<4500,'length '+a.length);
 // beat grid: (position - side start) is a multiple of speed*30/bpm of that lap
 const bpm=100;
 for(const o of a.obstacles){
  const side=Math.floor(o.at/E.SIDE),speed=Math.min(a.maxSpeed,E.speedFor(Math.floor(side/4)+a.lapBase)),step=speed*30/bpm,v=(o.kind==='pit'?o.start:o.kind==='double'?o.parts[0]:o.at);
  assert.ok(Math.abs(v/step-Math.round(v/step))<1e-6,o.kind+' at '+o.at+' off grid');
 }
 const last=a.obstacles[a.obstacles.length-1],end=last.kind==='pit'?last.end:last.kind==='double'?last.parts[1]:last.at;assert.ok(end<a.length-60,'hazards stay clear of the gate');
 assert.equal(a.shardTotal,a.obstacles.filter(o=>o.shard).length);assert.ok(a.shardTotal>0);
 assert.ok(E.generateSide(5,0,{beat:100,lapBase:3}).length>0);
 // the endless modes are untouched by the hooks
 assert.deepEqual(E.generateSide(5,2).map(o=>o.at),E.generateSide(5,2,undefined).map(o=>o.at));
});

test('square: clears at the aurora gate (immediately when chain.last is false), carries score, reports points/shards/perfectStreak', () => {
 const run=mkSquare(),{seen,seconds}=play(run);
 assert.equal(run.state,'clear',JSON.stringify(run.result));assert.ok(seconds>8&&seconds<40,seconds+'s');
 const r=run.result;assert.ok(r.points>500,'score continues from carry.points: '+r.points);assert.equal(r.score,r.points);assert.equal(r.shards,run.shards);assert.equal(r.shardTotal,run.shardTotal);assert.ok(r.shards>0&&r.shards<=r.shardTotal);assert.ok(r.perfectStreak>=2);
 assert.equal(seen.filter(e=>e==='clear').length,1);assert.ok(seen.includes('portal')&&seen.includes('jump')&&seen.includes('perfect'));assert.equal(seen.filter(e=>e==='fail').length,0);
 assert.ok(run.distance>=run.length-1);
 // chain.last: a short aurora-gate clear animation first
 const last=mkSquare({chain:chain({last:true})});last.start();let n=0,cleared=-1,gate=-1;const cr={action:()=>last.action()};
 while(last.state==='play'&&n++<120*60){last.pilot(cr);last.tick(DT);if(last.finishing&&gate<0)gate=n;if(last.state==='clear')cleared=n}
 assert.equal(last.state,'clear');assert.ok(cleared-gate>=100,'gate outro lasts '+((cleared-gate)*DT).toFixed(2)+'s');
});

test('square: a missed jump fails the act; the failed act restarts from the same state; standalone runs keep the coach', () => {
 const run=mkSquare();run.start();let n=0;while(run.state==='play'&&n++<120*30)run.tick(DT);
 assert.equal(run.state,'fail');assert.equal(run.result.state,'fail');assert.ok(run.result.reason);assert.equal(run.hearts,0);
 const again=mkSquare();assert.equal(again.score,500);assert.equal(again.perfectStreak,2);
 assert.equal(mkSquare().coach,null,'no teaching between acts');assert.equal(mkSquare({chain:chain({first:true})}).coach.text,'탭하여 점프');
 assert.equal(mkSquare({tutorial:true}).coach.kind,'start');
 const solo=Square.ACTS.square({viewport:VP,settings:{},sides:4,seed:3});assert.equal(solo.coach.kind,'start');
 const r2=mkSquare();r2.start();r2.retry();assert.equal(r2.attempt,2);assert.equal(r2.state,'play');
});

test('square: items use the shared helpers (bubble absorbs one hit, time slows, feather lengthens the jump) and hud:false hides the HUD', () => {
 const run=mkSquare({items:[{at:.02,kind:'bubble',lane:'lo'}]});assert.ok(run.mods&&run.itemList.length===1);
 run.mods.shield=1;run.start();let n=0,absorbed=false;
 while(run.state==='play'&&n++<120*30){run.tick(DT);if(run.drainEvents().includes('shield-break')){absorbed=true;break}}
 assert.ok(absorbed&&run.mods.shield===0,'the bubble took the hit');assert.equal(run.state,'play');
 const f=mkSquare();f.mods.featherCharges=1;f.start();f.action();assert.ok(Math.abs(f.fl-E.FLIGHT*Items.TUNING.featherLen)<1e-9);assert.ok(f.pkH>E.PEAK);
 const s=mkSquare();s.mods.slowUntil=99;s.start();for(let i=0;i<60;i++)s.tick(DT);const plain=mkSquare();plain.start();for(let i=0;i<60;i++)plain.tick(DT);assert.ok(s.distance<plain.distance*.85,'slow time');
 assert.equal(mkSquare({hud:false}).hudOff,true);assert.equal(Square.ACTS.square({viewport:VP,settings:{},seed:1}).hudOff,false);
 // without a chain and without items nothing item-related runs
 const bare=Square.ACTS.square({viewport:VP,settings:{},seed:1});assert.equal(bare.mods,null);
});

class P2D{moveTo(){}lineTo(){}arcTo(){}arc(){}rect(){}closePath(){}}
test('square: draws with the chapter palette (dark neon, beat pulse within +-5%) and reduced motion', () => {
 globalThis.Path2D=P2D;
 const calls=[];const g=()=>({addColorStop(){}});
 const ctx=new Proxy({canvas:{width:390,height:844},createLinearGradient:g,createRadialGradient:g,getTransform:()=>({a:1,b:0}),measureText:()=>({width:40})},{get:(o,k)=>k in o?o[k]:(k==='fillStyle'||k==='strokeStyle'?'':(...a)=>{calls.push(k)}),set:(o,k,v)=>{o[k]=v;return true}});
 const th=E.tripTheme('ember');assert.equal(th.key,'ember');assert.equal(th.ink.danger,globalThis.MongyuTrip.get('ember').danger);assert.notEqual(th.palette.sky[0],E.PALETTES[0].sky[0]);
 assert.equal(E.tripTheme('nope').key,'nope');
 for(const reduced of [false,true]){
  const run=mkSquare({trip:'ember',hud:false,items:[{at:.1,kind:'bubble',lane:'lo'},{at:.5,kind:'memory-star',lane:'hi'}]});run.start();for(let i=0;i<120*3;i++)run.tick(DT);
  assert.doesNotThrow(()=>run.drawSelf(ctx,{viewport:VP,reduced,time:run.time}));
 }
 const k=th.palette.arch;for(const c of k)assert.match(c,/^#[0-9a-f]{6}$/i);
});

test('flip: layout is deterministic, on the beat grid, alternates surfaces and leaves a flip window between hazards', () => {
 const a=Square.buildFlip({bpm:100,seed:5,beats:36,level:1}),b=Square.buildFlip({bpm:100,seed:5,beats:36,level:1}),c=Square.buildFlip({bpm:100,seed:6,beats:36,level:1});
 assert.deepEqual(a.events,b.events);assert.deepEqual(a.crystals,b.crystals);assert.notDeepEqual(a.events.map(e=>e.beat),c.events.map(e=>e.beat));
 assert.ok(a.events.length>=5);assert.equal(a.length,a.beats*a.B);
 a.events.forEach((e,i)=>{assert.equal(e.from,i%2);assert.equal(e.to,1-i%2);assert.ok(Math.abs(e.beat*4-Math.round(e.beat*4))<1e-9);assert.ok(e.beat<a.beats-3);
  const cr=a.crystals[i];assert.equal(cr.surf,e.from,'crystals sit on the surface being left');assert.ok(cr.start>=e.beat+1,'hazard starts after the flip window');
  if(i>0){const prev=a.crystals[i-1];assert.ok(e.beat>=prev.start+prev.len+.6,'room to flip between hazards: '+(e.beat-prev.start-prev.len))}});
 for(const lv of [0,1,2,3]){const l=Square.buildFlip({bpm:104,seed:9,beats:40,level:lv});assert.ok(l.events.length>=4,'level '+lv);if(lv===0)assert.ok(l.crystals.every(x=>!x.tall))}
 assert.ok(Square.buildFlip({bpm:104,seed:9,beats:60,level:3}).crystals.some(x=>x.tall),'tall crystals appear at level 3');
 assert.ok(a.shardTotal>0&&a.shardTotal<=a.events.length);
 const t=Square.buildFlip({bpm:100,seed:5,beats:30,level:0,tutorial:true});assert.ok(t.events[0].beat>=6,'tutorial gives a longer lead-in');
});

test('flip: tapping on the beat clears it with perfects and light shards; the fall accelerates; chain.last false ends at once', () => {
 const run=mkFlip({level:2,beats:30}),{seen,seconds}=play(run);
 assert.equal(run.state,'clear',JSON.stringify(run.result));assert.ok(seconds>10&&seconds<30,seconds+'s');
 const r=run.result;assert.ok(r.points>500);assert.equal(r.shards,run.shardTotal,'every shard on the ideal path');assert.ok(r.perfectStreak>=run.course.events.length);assert.ok(seen.includes('perfect')&&seen.includes('land')&&seen.includes('jump'));
 // accelerating fall: the first quarter of the fall covers much less than the last quarter
 const f=mkFlip();f.start();f.action();const y=[];for(let i=0;i<Math.ceil(f.course.tf/DT);i++){f.tick(DT);y.push(f.yc())}
 const d1=Math.abs(y[Math.floor(y.length/4)]-y[0]),d4=Math.abs(y[y.length-1]-y[Math.floor(y.length*3/4)]);assert.ok(d4>d1*2.5,'accelerates '+d1.toFixed(1)+' -> '+d4.toFixed(1));
 // gravity really flips: landing on the other surface
 assert.equal(f.surf,1);
 const l=mkFlip({chain:chain({last:true})});l.start();let n=0,gate=-1;const cr={action:()=>l.action()};while(l.state==='play'&&n++<120*60){l.pilot(cr);l.tick(DT);if(l.finishing&&gate<0)gate=n}
 assert.equal(l.state,'clear');assert.ok(n-gate>=100);
});

test('flip: staying put or tapping late hits a crystal and fails; a bubble absorbs one hit; sloppy-but-in-window taps still clear', () => {
 const lazy=mkFlip();lazy.start();let n=0;while(lazy.state==='play'&&n++<120*30)lazy.tick(DT);assert.equal(lazy.state,'fail');assert.equal(lazy.hearts,0);assert.ok(lazy.result.reason);
 const late=mkFlip();late.start();n=0;const e=late.course.events[0];while(late.state==='play'&&n++<120*40){if(late.x>=(e.beat+1.1)*late.course.B&&late.fly===null&&late.next===0)late.action();late.tick(DT)}
 assert.equal(late.state,'fail','a late flip lands in the crystals');
 const sloppy=mkFlip({level:1}),r=play(sloppy,{mode:'ignore'});assert.equal(sloppy.state,'clear');
 const shield=mkFlip({items:[{at:.1,kind:'bubble',lane:'lo'}]});shield.mods.shield=1;shield.start();n=0;let broke=false;
 while(shield.state==='play'&&n++<120*30){shield.tick(DT);if(shield.drainEvents().includes('shield-break')){broke=true;break}}
 assert.ok(broke&&shield.state==='play');
 const again=mkFlip();assert.equal(again.score,500);assert.equal(again.coach,null);assert.equal(mkFlip({tutorial:true}).coach.text,'탭하면 중력이 뒤집혀');
});

test('flip: items pick up on the ground (lo) and mid-fall (hi); drawing works for every palette, reduced motion and the colour-blind mode', () => {
 const run=mkFlip({level:1,beats:30,items:[{at:.2,kind:'time',lane:'lo'},{at:.6,kind:'memory-star',lane:'hi'}]});
 const p=play(run);assert.equal(run.state,'clear');assert.ok(p.seen.filter(e=>e==='item').length>=1);
 const g=()=>({addColorStop(){}}),calls=[];
 const ctx=new Proxy({canvas:{width:390,height:844},createLinearGradient:g,createRadialGradient:g,getTransform:()=>({a:1,b:0}),measureText:()=>({width:40})},{get:(o,k)=>k in o?o[k]:(k==='fillStyle'||k==='strokeStyle'?'':(...a)=>{calls.push(k)}),set:(o,k,v)=>{o[k]=v;return true}});
 for(const trip of ['aqua','ember','toxic','heart','violet'])for(const reduced of [false,true]){
  const r=mkFlip({trip,hud:false,items:[{at:.3,kind:'bubble',lane:'lo'}]});r.start();for(let i=0;i<120*4;i++){r.pilot({action:()=>r.action()});r.tick(DT)}
  assert.doesNotThrow(()=>r.drawSelf(ctx,{viewport:VP,reduced,time:r.time}),trip);
 }
 globalThis.document={documentElement:{dataset:{cvd:'on'}}};try{const r=mkFlip({trip:'toxic'});r.start();for(let i=0;i<200;i++)r.tick(DT);assert.doesNotThrow(()=>r.drawSelf(ctx,{viewport:VP,reduced:false,time:r.time}))}finally{delete globalThis.document}
 assert.ok(calls.length>200);
});
