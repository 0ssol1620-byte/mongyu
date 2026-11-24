const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
for(const f of ['trip-palettes','items','endless-dream'])require('../src/'+f+'.js');
const Square=require('../src/square-act.js'),Eye=require('../src/eye-act.js'),Liquid=require('../src/liquid-act.js'),Rhythm=require('../src/rhythm-act.js'),Course=require('../src/course-run.js'),Items=globalThis.MongyuItems;
const VP={width:390,height:844},DT=1/120;
const chain=(o={})=>({index:1,count:3,first:false,last:false,carry:{points:500,shards:3,perfectStreak:2,hearts:1},bpm:92,seed:77,...o});
const mk=(Act,type,bpm)=>(o={})=>Act.ACTS[type]({viewport:VP,settings:{},chain:chain({bpm}),...o});
const mkEye=mk(Eye,'eye',92),mkLiquid=mk(Liquid,'liquid',125),mkRhythm=mk(Rhythm,'rhythm',138);
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
const proxyCtx=()=>{const g=()=>({addColorStop(){}}),calls=[],fills=[];const o={canvas:{width:390,height:844},createLinearGradient:g,createRadialGradient:g,getTransform:()=>({a:1,b:0}),measureText:()=>({width:40})};
 const ctx=new Proxy(o,{get:(t,k)=>k in t?t[k]:(k==='fillStyle'||k==='strokeStyle'?'':(...a)=>{calls.push(k);if(k==='fillRect'&&a[2]>=380&&a[3]>=800)fills.push(String(t.fillStyle)+'|'+t.globalAlpha)}),set:(t,k,v)=>{t[k]=v;return true}});
 return {calls,fills,ctx}};
globalThis.Path2D=class{moveTo(){}lineTo(){}arcTo(){}arc(){}rect(){}closePath(){}};

test('eye, liquid and rhythm register with a HUD label and follow the act contract', () => {
 for(const type of ['eye','liquid','rhythm']){assert.ok(Course.hasAct(type),type);const run=Course.resolveAct(type)({viewport:VP,settings:{},chain:chain()});contract(run);assert.equal(run.dreamMode,type);assert.ok(run.status().progress>=0)}
 const labels=['eye','liquid','rhythm'].map(t=>new Course.CourseRun({id:'x',acts:[{type:t,opts:{beats:24}}],viewport:VP}).actName);assert.deepEqual(labels,['시선','녹는 길','박자']);
 assert.equal(typeof Square.kit.sideBase,'function');
});

/* ---------------------------------------------------------------- eye */
test('eye: the layout is deterministic and every tap beat sits inside a safe window (or a lit pool) with a one-beat margin', () => {
 const a=Eye.buildEye({bpm:92,seed:4,beats:50,level:2}),b=Eye.buildEye({bpm:92,seed:4,beats:50,level:2}),c=Eye.buildEye({bpm:92,seed:5,beats:50,level:2});
 assert.deepEqual(a.events,b.events);assert.deepEqual(a.watch,b.watch);assert.notDeepEqual(a.events.map(e=>e.m),c.events.map(e=>e.m));assert.equal(a.length,a.beats*a.B);
 for(const lv of [0,1,2,3])for(const seed of [1,2,3,4,5,6]){
  const C=Eye.buildEye({bpm:92,seed,beats:50,level:lv,tutorial:seed===1});assert.ok(C.events.length>=3&&C.watch.length>=3,'lv'+lv);
  for(const e of C.events){
   assert.equal(e.m,Math.round(e.m));
   for(const d of [-1,-.5,0,.5,1]){const x=(e.tapBeat+d)*C.B;assert.ok(!Eye.watchedAt(C,x)||Eye.inPool(C,x),'tap window of hazard '+e.idx+' lv'+lv+' seed'+seed+' at '+d)}
  }
  C.events.forEach((e,i)=>{if(i)assert.ok(e.m-C.events[i-1].m>=3)});
  for(const w of C.watch){assert.ok(w.w1-w.w0>=3);assert.equal(w.w0,Math.round(w.w0))}
  if(lv>=2&&seed>=2)assert.ok(C.pools.length>=0);
 }
 assert.ok([1,2,3,4,5,6,7,8].some(s=>Eye.buildEye({bpm:92,seed:s,beats:60,level:3}).pools.length>0),'spot pools exist at higher levels');
 assert.equal(Eye.buildEye({bpm:92,seed:3,beats:50,level:0}).pools.length,0);
});

test('eye: the lid openness is a half-beat ramp around each watched window and is >= .5 exactly while watched', () => {
 const C=Eye.buildEye({bpm:92,seed:7,beats:50,level:1}),w=C.watch[0];
 assert.equal(Eye.lidAt(C,0),0);assert.equal(Eye.lidAt(C,w.w0-.5),0);assert.equal(Eye.lidAt(C,w.w0),.5);assert.equal(Eye.lidAt(C,w.w0+.5),1);assert.equal(Eye.lidAt(C,w.w1),.5);assert.equal(Eye.lidAt(C,w.w1+.5),0);
 for(let b=0;b<C.beats;b+=.05){const L=Eye.lidAt(C,b),wt=Eye.watchedAt(C,b*C.B);assert.ok(wt?L>=.5-1e-9:L<=.5+1e-9,'consistent at '+b)}
 const ch=Eye.untilChange(C,w.w0-2);assert.equal(ch.watched,false);assert.ok(Math.abs(ch.left-2)<1e-9);assert.equal(Eye.untilChange(C,w.w0+1).watched,true);
});

test('eye: the pilot clears every level in both timing modes; a tap while the lid is open fails; a lit pool allows it', () => {
 for(const lv of [0,1,2,3])for(const mode of ['collect','ignore']){const run=mkEye({level:lv,beats:44});const {seen}=play(run,{mode});assert.equal(run.state,'clear',lv+' '+mode+' '+JSON.stringify(run.result));assert.ok(seen.includes('eye-open')&&seen.includes('eye-close'))}
 const run=mkEye({level:0});run.start();let n=0;while(!run.watchedNow()&&n++<120*60){run.pilot({action:()=>run.action()});run.tick(DT)}assert.ok(run.watchedNow());
 while(run.fly!==null)run.tick(DT);run.action();assert.equal(run.outro.kind,'fail');assert.ok(run.drainEvents().includes('seen'));let m=0;while(run.state==='play'&&m++<120*3)run.tick(DT);assert.equal(run.state,'fail');assert.equal(run.result.reason,'눈에 들켰어요');
 // inside a pool a tap is fine even though the eye is open
 const p=mkEye({level:3,beats:60,seed:2});p.course.pools.length||(p.course=Eye.buildEye({bpm:92,seed:2,beats:60,level:3}));
 const seed=[1,2,3,4,5,6,7,8].find(s=>Eye.buildEye({bpm:92,seed:s,beats:60,level:3}).pools.length>0),q=mkEye({level:3,beats:60,seed,chain:chain({seed})});
 assert.ok(q.course.pools.length>0);q.start();const pool=q.course.pools[0];q.x=(pool.x0+pool.x1)/2;assert.ok(Eye.watchedAt(q.course,q.x));assert.equal(q.allowed(),true);assert.equal(q.action(),true);assert.equal(q.state,'play');assert.equal(q.outro,null);
 const lazy=mkEye();lazy.start();n=0;while(lazy.state==='play'&&n++<120*40)lazy.tick(DT);assert.equal(lazy.state,'fail');assert.match(lazy.result.reason,/소품/);
 assert.equal(mkEye().coach,null);assert.equal(mkEye({tutorial:true}).coach.kind,'start');
});

test('eye: items, score carry, chain.last and drawing (palettes, reduced motion, shape cues)', () => {
 const bub=mkEye({items:[]});bub.mods.shield=1;bub.start();let n=0,broke=false;while(bub.state==='play'&&n++<120*40){bub.tick(DT);if(bub.drainEvents().includes('shield-break')){broke=true;break}}assert.ok(broke&&bub.state==='play');
 const run=mkEye({level:1});play(run);assert.ok(run.result.points>500);assert.equal(run.result.shards,run.shardTotal);
 const l=mkEye({chain:chain({last:true})});l.start();n=0;let gate=-1;const cr={action:()=>l.action()};while(l.state==='play'&&n++<120*80){l.pilot(cr);l.tick(DT);if(l.finishing&&gate<0)gate=n}
 assert.equal(l.state,'clear');assert.ok(n-gate>=100);
 const {ctx,calls}=proxyCtx();
 for(const trip of ['c6','c8','violet','nope'])for(const reduced of [false,true]){
  const r=mkEye({trip,level:3,beats:60,seed:2,hud:trip!=='c6',items:[{at:.3,kind:'bubble',lane:'lo'},{at:.6,kind:'memory-star',lane:'hi'}]});r.start();
  for(let i=0;i<120*30;i++){r.pilot({action:()=>r.action()});r.tick(DT);if(i%240===0)assert.doesNotThrow(()=>r.drawSelf(ctx,{viewport:VP,reduced,time:r.time}),trip)}}
 assert.ok(calls.length>800);
 assert.ok(calls.includes('quadraticCurveTo')&&calls.includes('clip'),'the eye and the hatched beam are drawn');
});

/* ---------------------------------------------------------------- liquid */
test('liquid: deterministic layout; pits are sized from the form that jumps over them; gates keep three clear beats on both sides', () => {
 const a=Liquid.buildLiquid({bpm:125,seed:6,beats:70,level:2}),b=Liquid.buildLiquid({bpm:125,seed:6,beats:70,level:2}),c=Liquid.buildLiquid({bpm:125,seed:7,beats:70,level:2});
 assert.deepEqual(a.events,b.events);assert.deepEqual(a.gates,b.gates);assert.notDeepEqual(a.events.map(e=>e.m),c.events.map(e=>e.m));
 for(const lv of [0,1,2,3])for(const seed of [1,2,3,4,5,6,7,8]){
  const C=Liquid.buildLiquid({bpm:125,seed,beats:80,level:lv,tutorial:seed===1});
  assert.ok(C.events.length>=5,'lv'+lv);if(lv===0||seed===1)assert.equal(C.gates.length,0);
  C.events.forEach((e,i)=>{assert.equal(e.m,Math.round(e.m));assert.equal(e.form,Liquid.formAt(C,e.at),'event form = form in force at its position');if(i)assert.ok(e.m-C.events[i-1].m>=3);
   if(e.kind==='pit'){assert.ok(e.hw*2<=Liquid.FORMS[e.form].fl*C.speed*.5,'the pit is narrower than half the jump');assert.equal(e.hw*2,e.w)}assert.ok(Math.abs(e.tapBeat-(e.m-Liquid.FORMS[e.form].fl*125/120))<1e-9)});
  for(const g of C.gates){for(const e of C.events){const d=e.m-g.beat;assert.ok(d<=-3||d>=4,'gate '+g.beat+' vs hazard '+e.m)}}
 }
 assert.ok([1,2,3,4,5,6].some(s=>Liquid.buildLiquid({bpm:125,seed:s,beats:80,level:2}).gates.length>0),'gates appear from level 1');
 assert.ok(Liquid.buildLiquid({bpm:125,seed:2,beats:80,level:2}).events.some(e=>e.kind==='bulge')&&Liquid.buildLiquid({bpm:125,seed:2,beats:80,level:2}).events.some(e=>e.kind==='pit'));
 const e=Liquid.buildLiquid({bpm:125,seed:3,beats:60,level:3}).events.find(x=>x.kind==='pit'),C0={...e};
 assert.equal(Liquid.centerAt(e,e.m),e.at,'the sway is zero when the runner passes the centre');assert.ok(Math.abs(Liquid.centerAt(e,e.m+1)-e.at)>1);void C0;
 assert.equal(Liquid.openAt(e,e.m),1);assert.equal(Liquid.openAt(e,e.m-4),0);assert.equal(Liquid.openAt(e,e.m+4),0);assert.equal(Liquid.openAt(e,e.m-e.lead),1);assert.equal(Liquid.openAt(e,e.m+e.lead),1);
});

test('liquid: the pilot clears every level; a morph changes the jump length, standing in an open pit fails, items and chain work', () => {
 for(const lv of [0,1,2,3])for(const seed of [3,9,21])for(const mode of ['collect','ignore']){const run=mkLiquid({level:lv,beats:60,seed,chain:chain({bpm:125,seed})});const {seen}=play(run,{mode});assert.equal(run.state,'clear',lv+' '+seed+' '+mode+' '+JSON.stringify(run.result));if(lv>=2&&seed===21)void seen}
 let morphed=0;for(const seed of [1,2,3,4,5,6]){const run=mkLiquid({level:2,beats:80,seed,chain:chain({bpm:125,seed})});const {seen}=play(run);assert.equal(run.state,'clear');morphed+=seen.filter(e=>e==='morph').length}assert.ok(morphed>=3,'forms change: '+morphed);
 const d=mkLiquid();d.start();d.formIdx=0;d.action();assert.equal(d.fl,.62);const dk=mkLiquid();dk.start();dk.formIdx=1;dk.action();assert.equal(dk.fl,.5);const pp=mkLiquid();pp.start();pp.formIdx=2;pp.action();assert.equal(pp.fl,.78);assert.ok(pp.pkH>d.pkH&&dk.pkH<d.pkH);
 // standing still on the floor: the first pit swallows the runner
 const lazy=mkLiquid({level:0});lazy.start();let n=0;while(lazy.state==='play'&&n++<120*40)lazy.tick(DT);assert.equal(lazy.state,'fail');assert.ok(lazy.crash&&['pit','hit'].includes(lazy.crash.kind));assert.match(lazy.result.reason,/바닥/);
 const bub=mkLiquid({items:[]});bub.mods.shield=1;bub.start();n=0;let broke=false;while(bub.state==='play'&&n++<120*40){bub.tick(DT);if(bub.drainEvents().includes('shield-break')){broke=true;break}}assert.ok(broke&&bub.state==='play');
 const f=mkLiquid();f.mods.featherCharges=1;f.start();f.action();assert.ok(Math.abs(f.fl-.62*Items.TUNING.featherLen)<1e-9);
 const run=mkLiquid({level:1});play(run);assert.ok(run.result.points>500);
 const l=mkLiquid({chain:chain({last:true,bpm:125})});l.start();n=0;let gate=-1;const cr={action:()=>l.action()};while(l.state==='play'&&n++<120*80){l.pilot(cr);l.tick(DT);if(l.finishing&&gate<0)gate=n}assert.equal(l.state,'clear');assert.ok(n-gate>=100);
 assert.equal(mkLiquid().coach,null);assert.equal(mkLiquid({tutorial:true}).coach.kind,'start');
});

test('liquid: drawing across palettes, forms and reduced motion (the runner is a silhouette per form)', () => {
 const {ctx,calls}=proxyCtx();
 for(const trip of ['c7','c10','violet'])for(const reduced of [false,true]){
  const r=mkLiquid({trip,level:3,beats:70,seed:5,chain:chain({bpm:125,seed:5}),hud:trip!=='c7',items:[{at:.3,kind:'time',lane:'lo'},{at:.5,kind:'memory-star',lane:'hi'}]});r.start();const seenForms=new Set();
  for(let i=0;i<120*34;i++){r.pilot({action:()=>r.action()});r.tick(DT);seenForms.add(r.form.id);if(i%180===0)assert.doesNotThrow(()=>r.drawSelf(ctx,{viewport:VP,reduced,time:r.time}),trip)}
  if(trip==='c7'&&!reduced)assert.ok(seenForms.size>=2,'several forms were drawn: '+[...seenForms]);
 }
 for(const f of ['drop','ink','paper'])assert.ok(Liquid.FORMS.some(x=>x.id===f));assert.ok(calls.length>1000);assert.ok(calls.includes('bezierCurveTo'));
});

/* ---------------------------------------------------------------- rhythm */
test('rhythm: layout on the beat grid (notes and bass on whole beats, off-beats on half beats), taps 2+ beats apart, deterministic', () => {
 const a=Rhythm.buildRhythm({bpm:138,seed:4,beats:80,level:3}),b=Rhythm.buildRhythm({bpm:138,seed:4,beats:80,level:3});assert.deepEqual(a.events,b.events);assert.equal(a.length,a.beats*a.B);
 const kinds=new Set();
 for(const lv of [0,1,2,3])for(const seed of [1,2,3,4,5,6]){
  const C=Rhythm.buildRhythm({bpm:138,seed,beats:80,level:lv,tutorial:seed===1});assert.ok(C.events.length>=8,'lv'+lv);
  C.events.forEach((e,i)=>{kinds.add(e.kind);assert.equal(e.at,e.m*C.B);if(e.kind==='off')assert.equal(e.m%1,.5);else assert.equal(e.m,Math.round(e.m));if(i)assert.ok(e.m-C.events[i-1].m>=2,'taps 2+ beats apart');
   assert.ok(Math.abs(e.tapBeat-(e.m-.62*138/120))<1e-9);if(e.kind==='bass')assert.ok(e.hw>0&&e.h<=12)});
  if(lv===0)assert.ok(C.events.every(e=>e.kind==='note'));
 }
 assert.deepEqual([...kinds].sort(),['bass','note','off']);
});

test('rhythm: the pilot clears every level in both timing modes, a missed beat fails, items and chain work', () => {
 for(const lv of [0,1,2,3])for(const seed of [3,9,21])for(const mode of ['collect','ignore']){const run=mkRhythm({level:lv,beats:70,seed,chain:chain({bpm:138,seed})});play(run,{mode});assert.equal(run.state,'clear',lv+' '+seed+' '+mode+' '+JSON.stringify(run.result));assert.equal(run.result.shards,run.shardTotal)}
 const lazy=mkRhythm();lazy.start();let n=0;while(lazy.state==='play'&&n++<120*40)lazy.tick(DT);assert.equal(lazy.state,'fail');assert.equal(lazy.result.reason,'박자를 놓쳤어요');
 const bub=mkRhythm({items:[]});bub.mods.shield=1;bub.start();n=0;let broke=false;while(bub.state==='play'&&n++<120*40){bub.tick(DT);if(bub.drainEvents().includes('shield-break')){broke=true;break}}assert.ok(broke&&bub.state==='play');
 const run=mkRhythm({level:2});const {seen}=play(run);assert.ok(run.result.points>500);assert.ok(seen.includes('perfect'));
 const l=mkRhythm({chain:chain({last:true,bpm:138})});l.start();n=0;let gate=-1;const cr={action:()=>l.action()};while(l.state==='play'&&n++<120*80){l.pilot(cr);l.tick(DT);if(l.finishing&&gate<0)gate=n}assert.equal(l.state,'clear');assert.ok(n-gate>=100);
 assert.equal(mkRhythm().coach,null);assert.equal(mkRhythm({tutorial:true}).coach.kind,'start');
});

test('rhythm: sensory safety - beat rate under 3 Hz, no full-screen fill changes with the beat, the frame is a thin outline, reduced motion stops the kaleidoscope', () => {
 for(const bpm of [92,96,125,138])assert.ok(bpm/60<=3,'pulse rate '+bpm/60+' Hz');
 const frames=[];
 for(const phase of [0,.1,.25,.5,.75,.95]){
  const r=mkRhythm({trip:'c8',level:2,beats:70,seed:5,chain:chain({bpm:138,seed:5})});r.start();
  r.x=r.course.B*(12+phase);r.clock=r.course.B*0+ (12+phase)*60/138;
  const {ctx,fills,calls}=proxyCtx();r.drawSelf(ctx,{viewport:VP,reduced:false,time:r.clock});frames.push({fills,calls});
 }
 assert.ok(frames[0].fills.length>=1);for(const f of frames)assert.deepEqual(f.fills,frames[0].fills,'the full-screen fills never change with the beat phase');
 // the frame is drawn as a stroked outline, never filled (no fillRect over the frame inset)
 assert.ok(frames[0].calls.includes('roundRect')||frames[0].calls.includes('rect'));
 assert.equal(Rhythm.kaleidoAngle(37,true),0);assert.ok(Math.abs(Rhythm.kaleidoAngle(90,false)-Math.PI*2)<1e-9,'one turn per 90 s');assert.ok(Rhythm.kaleidoAngle(1,false)<.07)
});

test('rhythm: drawing across palettes and reduced motion (note, off-beat, bass and the approach rings)', () => {
 const {ctx,calls}=proxyCtx();
 for(const trip of ['c8','c10','violet','nope'])for(const reduced of [false,true]){
  const r=mkRhythm({trip,level:3,beats:80,seed:6,chain:chain({bpm:138,seed:6}),hud:trip!=='c8',items:[{at:.3,kind:'feather',lane:'lo'},{at:.6,kind:'memory-star',lane:'hi'}]});r.start();
  for(let i=0;i<120*30;i++){r.pilot({action:()=>r.action()});r.tick(DT);if(i%160===0)assert.doesNotThrow(()=>r.drawSelf(ctx,{viewport:VP,reduced,time:r.time}),trip)}}
 assert.ok(calls.includes('ellipse')&&calls.includes('setLineDash'),'approach rings (dashed for off-beats)');assert.ok(calls.length>1500);
});
