const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_UI_EDITION=true;
const Bank=require('../src/humor-bank.js');
globalThis.MongyuHumorBank=Bank;
const H=require('../src/humor-director.js');

function row(id,o={}){
 return {id,event:o.event||'ev',cls:o.cls||'COMBO',priority:o.priority??({STORY:90,TEACH:100,FIRST:50,FAIL:30,COMBO:25,META:20,RARE:10})[o.cls||'COMBO'],weight:o.weight??1,cooldownSeconds:o.cooldownSeconds??600,maxPerSession:o.maxPerSession??99,
  oncePerProfile:!!o.oncePerProfile,group:o.group||id,exclusionTags:o.exclusionTags||['boss_climax','fever_peak','tutorial_critical'],allow:o.allow||[],when:o.when||{},ko:o.ko??('줄 '+id),en:o.en??('line '+id),
  outputs:{bubble:o.ko!=='',gesture:o.gesture||'none',sfx:o.sfx||'none',hint:null,result:!!o.result},durationMs:o.durationMs||0,delayMs:o.delayMs||0,key:'humor.'+id};
}
const mkBank=rows=>({ENTRIES:rows});
function mkStore(init){const m=new Map(Object.entries(init||{}));return {m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))}}
function mkBus(){const log=[];return {log,emit:(t,d)=>log.push([t,d]),host:{sound:s=>log.push(['sound',s])}}}
function mkRun(o={}){
 const child={distance:0,coach:null,time:10,hazardEta:()=>Infinity,...(o.child||{})};
 return {courseRun:true,id:o.id||'c1',state:'play',time:10,attempt:1,options:o.options||{},acts:[{type:o.act||'floor-wall'}],actIndex:0,child,perfectStreak:o.streak||0,progress:()=>o.progress||0,
  crash:null,outro:null,portal:null,coach:null,assistActs:[],lastItem:null,...(o.run||{})};
}
function mk(rows,o={}){
 let t=100000;const store=o.storage||mkStore(),bus=o.bus||mkBus();
 const h=H.create({bank:mkBank(rows),clock:()=>t,wall:()=>1.7e12,storage:store,bus,seed:o.seed??12345,lang:o.lang||(()=> 'ko'),doc:{getElementById:()=>null},config:{gapMs:8000,...(o.config||{})}});
 return {h,store,bus,at:()=>t,adv:ms=>{t+=ms},run:o.run||mkRun()};
}
const lines=bus=>bus.log.filter(x=>x[0]==='humor-bubble').map(x=>x[1].id);

test('a line is emitted once, with bubble, gesture and sfx outputs', () => {
 const m=mk([row('a',{gesture:'tiny_bow',sfx:'pass'})]);m.adv(5000);
 const seen=[];m.h.on('gesture',d=>seen.push(d.gesture));
 m.h.handle('ev',{},m.run);
 assert.deepEqual(lines(m.bus),['a']);assert.deepEqual(seen,['tiny_bow']);assert.ok(m.bus.log.some(x=>x[0]==='sound'&&x[1]==='pass'));
 const b=m.bus.log.find(x=>x[0]==='humor-bubble')[1];assert.ok(b.durationMs>=1200&&b.durationMs<=2800);
});

test('per-line cooldown and maxPerSession', () => {
 const m=mk([row('a',{cooldownSeconds:100})],{config:{historySize:0}});m.adv(5000);
 m.h.handle('ev',{},m.run);m.adv(20000);m.h.handle('ev',{},m.run);assert.equal(lines(m.bus).length,1,'cooldown');
 m.adv(100000);m.h.handle('ev',{},m.run);assert.equal(lines(m.bus).length,2);
 const n=mk([row('b',{cooldownSeconds:0,maxPerSession:2})],{config:{historySize:0}});n.adv(5000);
 for(let i=0;i<6;i++){n.h.handle('ev',{},n.run);n.adv(16000)}
 assert.equal(lines(n.bus).length,2);
});

test('global gap (8-15 s, config) and at most 3 lines per minute', () => {
 const rows=Array.from({length:10},(_,i)=>row('r'+i,{cooldownSeconds:0}));
 const m=mk(rows,{config:{gapMs:3000}});assert.equal(m.h.config.gapMs,8000,'gap is clamped to 8 s');m.adv(5000);
 m.h.handle('ev',{},m.run);m.adv(7000);m.h.handle('ev',{},m.run);assert.equal(lines(m.bus).length,1);
 m.adv(1500);m.h.handle('ev',{},m.run);assert.equal(lines(m.bus).length,2);
 const c=mk(rows,{config:{gapMs:99999}});assert.equal(c.h.config.gapMs,15000);
 const k=mk(rows);k.adv(5000);for(let i=0;i<30;i++){k.h.handle('ev',{},k.run);k.adv(2500)}
 const ts=k.h.log().map(l=>l.at);assert.ok(ts.length>=2);
 for(const t of ts)assert.ok(ts.filter(u=>u>=t&&u<t+60000).length<=3);
});

test('STORY and TEACH bypass the global gap and the minute cap; a joke right after is dropped', () => {
 const m=mk([row('s',{cls:'STORY',cooldownSeconds:0}),row('t',{cls:'TEACH',event:'ev2',cooldownSeconds:0}),row('x',{event:'ev3',cooldownSeconds:0})],{config:{historySize:0}});m.adv(5000);
 for(let i=0;i<5;i++){m.h.handle('ev',{},m.run);m.h.handle('ev2',{},m.run);m.adv(200)}
 assert.ok(lines(m.bus).length>=6);
 m.h.handle('ev3',{},m.run);assert.ok(!lines(m.bus).includes('x'));
});

test('recent-history exclusion: the last 20 ids never repeat; exhaustion means silence', () => {
 const rows=Array.from({length:25},(_,i)=>row('h'+i,{cooldownSeconds:0}));
 const m=mk(rows,{config:{maxPerMinute:99}});m.adv(5000);
 for(let i=0;i<60;i++){m.h.handle('ev',{},m.run);m.adv(9000)}
 const ids=m.h.log().map(l=>l.id);assert.equal(ids.length,60);
 for(let i=0;i<ids.length;i++)for(let j=Math.max(0,i-20);j<i;j++)assert.notEqual(ids[i],ids[j],'repeat inside 20');
 const few=mk(rows.slice(0,3),{config:{maxPerMinute:99}});few.adv(5000);for(let i=0;i<10;i++){few.h.handle('ev',{},few.run);few.adv(9000)}
 assert.equal(few.h.log().length,3,'only three distinct lines exist: then silence');
});

test('a rejected line is not written to the history (only presented lines are)', () => {
 const m=mk([row('a',{cooldownSeconds:0})]);m.adv(5000);
 m.run.child.hazardEta=()=>0.2;m.h.handle('ev',{},m.run);assert.deepEqual(m.h.history(),[]);
 m.run.child.hazardEta=()=>Infinity;m.h.handle('ev',{},m.run);assert.deepEqual(m.h.history(),['a']);
});

test('seeded pick: same seed + same event stream = same lines; own RNG, never Math.random', () => {
 const rows=Array.from({length:12},(_,i)=>row('d'+i,{cooldownSeconds:0}));
 const play=seed=>{const m=mk(rows,{seed,config:{maxPerMinute:99}});m.adv(5000);for(let i=0;i<8;i++){m.h.handle('ev',{},m.run);m.adv(9000)}return m.h.log().map(l=>l.id).join()};
 assert.equal(play(7),play(7));assert.notEqual(play(7),play(8));
 const real=Math.random;let calls=0;Math.random=()=>{calls++;return real()};
 try{const m=mk(rows,{seed:5});m.adv(5000);for(let i=0;i<8;i++){m.h.handle('ev',{},m.run);m.adv(9000)}}finally{Math.random=real}
 assert.equal(calls,0);
});

test('the seed survives in storage so a profile keeps its stream across reloads', () => {
 const store=mkStore();const a=mk([row('a')],{storage:store,seed:777});const b=mk([row('a')],{storage:store,seed:1});
 assert.equal(a.h.seed,777);assert.equal(b.h.seed,777);
});

test('drop, never defer: danger, coach, portal, pause; queued lines that turn unsafe vanish', () => {
 const m=mk([row('a',{cooldownSeconds:0}),row('b',{event:'ev2',cooldownSeconds:0,delayMs:1000})],{config:{maxPerMinute:99,historySize:0}});m.adv(5000);
 const run=m.run;
 run.child.hazardEta=()=>.65;m.h.handle('ev',{},run);assert.equal(m.h.log().length,0,'hazard within 700 ms');
 run.child.hazardEta=()=>.9;m.h.handle('ev',{},run);assert.equal(m.h.log().length,1,'hazard 900 ms away is fine');
 m.adv(9000);run.child.hazardEta=()=>-.5;m.h.handle('ev',{},run);assert.equal(m.h.log().length,2,'hazard already behind us');
 m.adv(9000);run.child.hazardEta=()=>Infinity;
 run.child.coach={text:'지금 탭!',until:99,kind:'slow'};m.h.handle('ev',{},run);assert.equal(m.h.log().length,2,'a coach line is on screen');run.child.coach=null;
 run.portal={age:0};m.h.handle('ev',{},run);assert.equal(m.h.log().length,2,'portal');run.portal=null;
 run.state='pause';m.h.handle('ev',{},run);assert.equal(m.h.log().length,2,'pause');run.state='play';
 m.adv(9000);const before=m.h.log().length;
 m.h.handle('ev2',{},run);run.child.hazardEta=()=>.2;m.adv(1100);m.h.tick(run);run.child.hazardEta=()=>Infinity;m.adv(100);m.h.tick(run);m.adv(5000);m.h.tick(run);
 assert.equal(m.h.log().length,before,'never retried');
 assert.ok(m.h.stats().dropped['unsafe:danger']>=1);
});

test('queued line speaks once it is due and still safe; hides the moment a hazard comes close', () => {
 const m=mk([row('q',{delayMs:1000,cooldownSeconds:0,durationMs:2000})]);m.adv(5000);const run=m.run;
 const r=m.h.handle('ev',{},run);assert.deepEqual(r,{queued:'q'});assert.equal(m.h.log().length,0);
 m.adv(900);m.h.tick(run);assert.equal(m.h.log().length,0);m.adv(200);m.h.tick(run);assert.equal(m.h.log().length,1);
 m.adv(400);run.child.hazardEta=()=>.3;m.h.tick(run);
 assert.ok(m.bus.log.some(x=>x[0]==='humor-hide'));
});

test('failure help (graceMs) waits out a coach line but speaks only when safe, and still expires', () => {
 const mkrow=()=>({...row('g',{cls:'FAIL',delayMs:500,cooldownSeconds:0,exclusionTags:['boss_climax']}),graceMs:3000});
 const m=mk([mkrow()]);m.adv(5000);const run=m.run;run.child.coach={text:'지금 탭!',until:99};
 m.h.handle('ev',{},run);m.adv(600);m.h.tick(run);assert.equal(m.h.log().length,0);
 m.adv(1000);m.h.tick(run);assert.equal(m.h.log().length,0,'still waiting for the coach');
 run.child.coach=null;run.child.hazardEta=()=>.3;m.adv(200);m.h.tick(run);assert.equal(m.h.log().length,0,'never during a hazard');
 run.child.hazardEta=()=>Infinity;m.adv(200);m.h.tick(run);assert.equal(m.h.log().length,1,'speaks as soon as it is safe');
 const n=mk([mkrow()]);n.adv(5000);n.run.child.coach={text:'x',until:99};n.h.handle('ev',{},n.run);n.adv(4000);n.h.tick(n.run);n.run.child.coach=null;n.adv(100);n.h.tick(n.run);
 assert.equal(n.h.log().length,0,'expired after graceMs');
});

test('road mode paints the bubble on the canvas under the coach pill spot, never over the gauge; the DOM dock path stays off there', () => {
 const calls=[];const ctx=new Proxy({},{get:(o,k)=>k==='measureText'?(t=>({width:[...t].length*9})):k==='font'||k==='fillStyle'||k==='strokeStyle'||k==='globalAlpha'||k==='lineWidth'||k==='textAlign'?o[k]:((...a)=>{calls.push([k,...a])}),set:(o,k,v)=>{o[k]=v;return true}});
 const body={hasAttribute:k=>k==='data-r104-mode',dataset:{r104Mode:'road'}};
 let t=100000;const bus=mkBus();
 const h=H.create({bank:mkBank([row('a',{cooldownSeconds:0,durationMs:2000})]),clock:()=>t,wall:()=>1.7e12,storage:mkStore(),bus,seed:1,doc:{body,getElementById:()=>null},config:{gapMs:8000}});
 const run=mkRun();t+=5000;h.handle('ev',{},run);t+=400;
 h.onFrame(run,{ctx,viewport:{width:390,height:844},reduced:false});
 const text=calls.find(c=>c[0]==='fillText');assert.ok(text&&text[1]==='줄 a','bubble text drawn');
 const gaugeY=844*.86;assert.ok(text[3]<gaugeY-20,'above the gauge: y='+text[3]);
 assert.ok(text[3]>844*.6,'below the playfield centre');
 calls.length=0;t+=3000;h.onFrame(run,{ctx,viewport:{width:390,height:844}});assert.equal(calls.length,0,'nothing after the dwell');
 const d2={body:{hasAttribute:()=>false,dataset:{}},getElementById:()=>null};
 const h2=H.create({bank:mkBank([row('a',{cooldownSeconds:0})]),clock:()=>t,wall:()=>1.7e12,storage:mkStore(),bus:mkBus(),seed:1,doc:d2,config:{gapMs:8000}});
 t+=9000;h2.handle('ev',{},run);calls.length=0;h2.onFrame(run,{ctx,viewport:{width:390,height:844}});assert.equal(calls.length,0,'DOM-HUD modes do not double-draw');
});

test('boss climax and fever peak tags exclude lines unless the row allows them', () => {
 const m=mk([row('a',{cooldownSeconds:0}),row('f',{event:'evf',cooldownSeconds:0,allow:['fever_peak']})],{config:{maxPerMinute:99}});m.adv(5000);
 m.run.child.boss=true;m.h.handle('ev',{},m.run);assert.equal(m.h.log().length,0);m.run.child.boss=false;
 const orig=globalThis.MongyuItems;globalThis.MongyuItems={summary:()=>({surgeLeft:2})};
 try{m.h.handle('ev',{},m.run);assert.equal(m.h.log().length,0,'fever peak');m.h.handle('evf',{},m.run);assert.equal(m.h.log().length,1,'allowed at the surge itself')}finally{globalThis.MongyuItems=orig}
});

test('speech level: off / min / default, setLevel persists in mongyu.r105.humor', () => {
 const rows=[row('j',{cooldownSeconds:0}),row('f',{cls:'FAIL',event:'evf',cooldownSeconds:0}),row('s',{cls:'STORY',event:'evs',cooldownSeconds:0})];
 const store=mkStore();const m=mk(rows,{storage:store,config:{maxPerMinute:99}});m.adv(5000);
 assert.equal(m.h.getLevel(),'default');assert.equal(m.h.setLevel('bogus'),false);
 assert.ok(m.h.setLevel('off'));m.h.handle('ev',{},m.run);m.h.handle('evf',{},m.run);m.h.handle('evs',{},m.run);assert.equal(m.h.log().length,0);
 assert.equal(JSON.parse(store.getItem('mongyu.r105.humor')).level,'off');
 assert.equal(mk(rows,{storage:store}).h.getLevel(),'off','reloaded');
 m.h.setLevel('min');m.adv(9000);m.h.handle('ev',{},m.run);assert.equal(m.h.log().length,0,'jokes are muted at min');
 m.h.handle('evf',{},m.run);m.h.handle('evs',{},m.run);assert.deepEqual(m.h.log().map(l=>l.id),['f','s']);
 m.h.setLevel('default');m.adv(9000);m.h.handle('ev',{},m.run);assert.equal(m.h.log().at(-1).id,'j');
});

test('oncePerProfile is remembered across reloads; a silent STORY line says nothing and quiets the jokes', () => {
 const store=mkStore();const rows=[row('o',{oncePerProfile:true,group:'g',cooldownSeconds:0})];
 const a=mk(rows,{storage:store});a.adv(5000);a.h.handle('ev',{},a.run);assert.equal(a.h.log().length,1);
 const b=mk(rows,{storage:store});b.adv(5000);b.h.handle('ev',{},b.run);assert.equal(b.h.log().length,0);
 const m=mk([row('z',{cls:'STORY',ko:'',en:'',cooldownSeconds:0}),row('j',{event:'ev2',cooldownSeconds:0})]);m.adv(5000);const got=[];m.h.on('silence',d=>got.push(d.id));
 m.h.handle('ev',{},m.run);assert.deepEqual(got,['z']);assert.equal(lines(m.bus).length,0);
 m.adv(8500);m.h.handle('ev2',{},m.run);assert.equal(lines(m.bus).length,0,'quiet after a deliberate silence');
 m.adv(9000);m.h.handle('ev2',{},m.run);assert.equal(lines(m.bus).length,1);
});

test('English: the bubble carries the current language, switching mid-session works', () => {
 let lang='ko';const m=mk([row('a',{ko:'안녕.',en:'Hi.',cooldownSeconds:0})],{lang:()=>lang,config:{maxPerMinute:99,historySize:0}});m.adv(5000);
 m.h.handle('ev',{},m.run);lang='en';m.adv(9000);m.h.handle('ev',{},m.run);
 assert.deepEqual(m.bus.log.filter(x=>x[0]==='humor-bubble').map(x=>x[1].text),['안녕.','Hi.']);
});

test('hazardEta reads every act family (distance / speed) and honours an act hook', () => {
 const opening={openingCourse:true,obstacles:[{at:300}],index:0,distance:220,practice:false};
 assert.ok(Math.abs(H.hazardEta(opening)-(80/122))<1e-9);
 const flip={dreamMode:'flip',x:100,distance:100,next:0,course:{B:100,speed:100,events:[{beat:2}],crystals:[{start:3,len:1,beat:2}]}};
 assert.ok(Math.abs(H.hazardEta(flip)-1)<1e-9);flip.x=flip.distance=310;assert.equal(H.hazardEta(flip),0);
 const mir={dreamMode:'mirror',x:100,distance:100,next:0,course:{B:100,speed:100,events:[{m:3,tapBeat:2}]}};assert.ok(Math.abs(H.hazardEta(mir)-1)<1e-9);
 const wait={dreamMode:'wait',x:100,distance:100,next:0,course:{B:100,speed:100,hazards:[{at:300,tapBeat:2}]}};assert.ok(Math.abs(H.hazardEta(wait)-1)<1e-9);
 const helix={course:{obstacles:[{at:500}]},index:0,distance:450,speed:100};assert.ok(Math.abs(H.hazardEta(helix)-.5)<1e-9);
 assert.equal(H.hazardEta({hazardEta:()=>.25}),.25);assert.equal(H.hazardEta(null),Infinity);assert.equal(H.hazardEta({hazardEta(){throw new Error('x')}}),Infinity);
});

test('unknown acts without a hazard hook only speak at act.enter / act.exit (blind rule)', () => {
 const m=mk([row('a',{cooldownSeconds:0}),row('e',{event:'act.enter',cooldownSeconds:0})],{config:{maxPerMinute:99}});m.adv(5000);
 const run=mkRun();run.acts=[{type:'mystery'}];delete run.child.hazardEta;
 m.h.handle('ev',{},run);assert.equal(m.h.log().length,0);m.h.handle('act.enter',{act:'mystery'},run);assert.equal(m.h.log().length,1);
});

test('run events: fail counts persist per course, reset on clear, retry vs start', () => {
 const m=mk([row('s',{event:'run.start',cooldownSeconds:0,delayMs:1500}),row('r',{event:'run.retry',cooldownSeconds:0,delayMs:1500,when:{failEq:[2]}})],{config:{maxPerMinute:99}});m.adv(5000);
 const run=m.run;
 m.h.onRunEvent(run,'start');m.adv(2000);m.h.tick(run);assert.equal(lines(m.bus).join(),'s');
 m.h.onRunEvent(run,'fail');m.adv(9000);m.h.onRunEvent(run,'start');assert.equal(m.h.fails().c1,1);
 m.h.onRunEvent(run,'fail');m.adv(9000);m.h.onRunEvent(run,'start');assert.equal(m.h.fails().c1,2);m.adv(2000);m.h.tick(run);assert.ok(lines(m.bus).includes('r'));
 m.h.onRunEvent(run,'clear');assert.equal(m.h.fails().c1,undefined);
});

test('8000 random events: no exceptions, no rule violations', () => {
 const m=mk(Bank.ENTRIES,{seed:99});m.adv(5000);
 let s=1;const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
 const events=['run.start','run.retry','run.resume','jump.perfect','obstacle.pass','corner','morph','portal','act.enter','act.exit','act.wait','item','surge','surge.end','shield.break','progress','course.clear','nonsense'];
 const types=['floor-wall','bridge','helix-up','helix-down','penrose','align','square','flip','mirror','wait','mystery'];
 const ids=['c1','c2','c5','c8','c13','c16','c21','c25','zzz'];
 for(let i=0;i<8000;i++){
  const run=mkRun({id:ids[Math.floor(rnd()*ids.length)],act:types[Math.floor(rnd()*types.length)],streak:Math.floor(rnd()*6),progress:rnd()});
  if(rnd()<.1)run.state=['pause','fail','clear','ready'][Math.floor(rnd()*4)];
  if(rnd()<.05)run.portal={age:0};if(rnd()<.05)run.crash={};if(rnd()<.2)run.child.hazardEta=()=>rnd()*1.5-.4;if(rnd()<.05)run.child.coach={text:'x',until:99};
  if(rnd()<.03)run.child=null;if(rnd()<.02)run.acts=null;
  const roll=rnd();
  try{
   if(roll<.55)m.h.handle(events[Math.floor(rnd()*events.length)],{cross:.4,item:['bubble','memory-star','time'][i%3],assist:i%7===0,pausedMs:i%5*1500,act:types[i%types.length]},run);
   else if(roll<.8)m.h.onRunEvent(run,['start','perfect','pass','corner','morph','portal','item','surge','shield-break','hit','fail','clear','wait','nonsense'][Math.floor(rnd()*14)]);
   else m.h.onFrame(run);
   m.h.tick(run);
  }catch(e){assert.fail('exception at '+i+': '+e.stack)}
  m.adv(Math.floor(rnd()*4000));
  if(i%997===0)m.h.setLevel(['off','min','default'][i%3]);
 }
 assert.ok(m.h.stats().emitted>30,'engine did speak: '+m.h.stats().emitted);
 const bubbles=m.bus.log.filter(x=>x[0]==='humor-bubble').map(x=>x[1]);
 for(const b of bubbles){assert.ok(b.durationMs>=1200&&b.durationMs<=2800,b.id+' '+b.durationMs);assert.ok(b.text.length>0)}
 const plain=bubbles.filter(b=>!['STORY','TEACH','FAIL'].includes(b.cls));
 for(let i=1;i<plain.length;i++)assert.ok(plain[i].at-plain[i-1].at>=8000,'gap '+(plain[i].at-plain[i-1].at));
 const capped=bubbles.filter(b=>!['STORY','TEACH'].includes(b.cls));
 for(const b of capped)assert.ok(capped.filter(c=>c.at>=b.at&&c.at<b.at+60000).length<=3,'3/min');
});

test('the global instance exists, defaults to level default, chapters resolve from course ids', () => {
 assert.equal(typeof H.setLevel,'function');assert.equal(H.getLevel(),'default');assert.ok(H.LEVELS.includes('min'));
 assert.equal(H.chapterOf({id:'c11'}),3);assert.equal(H.chapterOf({id:'c25'}),5);assert.equal(H.chapterOf({id:'c1'}),1);assert.equal(H.chapterOf({options:{chapter:4}}),4);assert.equal(H.chapterOf(null),0);
});
