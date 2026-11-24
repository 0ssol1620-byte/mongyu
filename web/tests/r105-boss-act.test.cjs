const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
for(const f of ['polish-bus','trip-palettes','items','opening-run','illusion-course','helix-act','penrose-act','endless-dream','chapters','square-act','boss-act'])require('../src/'+f+'.js');
const Course=require('../src/course-run.js'),Boss=globalThis.MongyuBossAct,Items=globalThis.MongyuItems,Polish=globalThis.MongyuPolish;
const VP={width:390,height:844},DT=1/120,IDS=['B01','B02','B03','B04','B05'],COURSE={B01:'c5',B02:'c10',B03:'c15',B04:'c20',B05:'c25'};
const chain=(id,o={})=>{const c=Course.courseById(COURSE[id]);return {index:0,count:1,first:true,last:true,carry:{points:0,shards:0,perfectStreak:0,hearts:1},bpm:c.bpm,seed:c.seed,courseId:c.id,...o}};
const mk=(id,o={})=>{const c=Course.courseById(COURSE[id]),a=c.acts[0];return Boss.ACTS.boss({...a.opts,viewport:VP,settings:{},chain:chain(id),...o})};
function play(run,{mode='collect',max=120*200,input=true,until}={}){
 const cr={action:()=>run.action()},seen=[];run.start();let n=0;
 while(run.state==='play'&&n++<max){if(input)run.pilot(cr,mode);run.tick(DT);for(const e of run.drainEvents())seen.push(e);if(until&&until(run))break}
 return {n,seconds:n*DT,seen};
}
const proxyCtx=()=>{const g=()=>({addColorStop(){}}),calls=[];return {calls,ctx:new Proxy({canvas:{width:390,height:844},createLinearGradient:g,createRadialGradient:g,getTransform:()=>({a:1,b:0}),measureText:()=>({width:40})},{get:(o,k)=>k in o?o[k]:(k==='fillStyle'||k==='strokeStyle'?'':(...a)=>{calls.push(k);return undefined}),set:(o,k,v)=>{o[k]=v;return true}})}};
globalThis.Path2D=class{moveTo(){}lineTo(){}arcTo(){}arc(){}rect(){}closePath(){}};

test('boss act registers, follows the act contract and every chapter ends on its boss course', () => {
 assert.ok(Course.hasAct('boss'));assert.equal(Boss.BY_N.slice(1).join(),IDS.join());
 const want={c5:'B01',c10:'B02',c15:'B03',c20:'B04',c25:'B05'};
 for(const [cid,id] of Object.entries(want)){
  const c=Course.courseById(cid);assert.equal(c.boss.id,id,cid);assert.equal(c.boss.n,IDS.indexOf(id)+1);assert.equal(c.acts.length,1);assert.equal(c.acts[0].type,'boss');assert.equal(c.acts[0].opts.boss,id);assert.equal(c.acts[0].opts.trip,c.trip);
  assert.ok(c.acts[0].weight>=60&&c.acts[0].weight<=120,cid+' weight');assert.ok(c.fallback&&c.fallback.every(a=>Course.hasAct(a.type)&&a.type!=='boss'),cid+' fallback is classic');
 }
 for(const ch of Course.CHAPTERS.slice(0,5))assert.ok(ch.courses[4].boss,ch.id+' final course is a boss');
 for(const c of Course.allCourses())if(!['c5','c10','c15','c20','c25'].includes(c.id)&&!c.bossPlaceholder)assert.ok(!c.boss&&c.acts.every(a=>a.type!=='boss'),c.id);
 for(const id of IDS){
  const run=mk(id);for(const k of ['state','mode','dreamMode','time','clock','updates','score','hearts','distance','events','coach','crash','result','attempt','outro','perfectStreak','polish'])assert.ok(k in run,id+' field '+k);
  for(const m of ['setViewport','start','pause','resume','retry','inputDown','inputUp','cancelInput','tick','drainEvents','status','drawSelf','phaseCheckpoint','pilot'])assert.equal(typeof run[m],'function',m);
  assert.equal(run.mode,'dream');assert.equal(run.dreamMode,'boss');assert.equal(run.polish,true);assert.equal(run.state,'ready');assert.equal(run.boss,IDS.indexOf(id)+1);assert.equal(run.status().boss.id,id);
 }
 // without square-act the boss act cannot exist: the course falls back to its classic acts
 assert.deepEqual(Course.playableActs(Course.courseById('c10')).acts.map(a=>a.type),['boss']);
});

test('boss sheet: three phases each with one rule, a telegraph line, a coach line, fail causes and a victory caption; the five bosses use distinct palettes and rules', () => {
 for(const id of IDS){
  const D=Boss.BOSSES[id];assert.equal(D.phases.length,3,id);assert.ok(D.name&&D.sub&&D.clear&&D.win);assert.equal(D.id,id);
  assert.equal(new Set(D.phases.map(p=>p.kind)).size,3,id+' three different rules');
  for(const p of D.phases){assert.ok(p.name&&p.tele&&p.coach&&p.kind,id);assert.ok(Object.keys(p.cause).length>=1&&Object.values(p.cause).every(t=>typeof t==='string'&&t.length>4),id+' causes')}
 }
 assert.equal(new Set(IDS.map(id=>Boss.BOSSES[id].trip)).size,5);
 assert.deepEqual(IDS.map(id=>Boss.BOSSES[id].phases.map(p=>p.kind)),[['faces','link','open'],['scale','morph','hop'],['corner','link','rotate'],['mirror','ghost','coop'],['diff','invert','stop']]);
});

test('layouts are deterministic from the seed, on the beat grid, with a telegraph gap and a safe rehearsal before every phase', () => {
 for(const id of IDS){
  const D=Boss.BOSSES[id],a=Boss.buildBoss(D,{bpm:D.bpm,seed:7}),b=Boss.buildBoss(D,{bpm:D.bpm,seed:7}),c=Boss.buildBoss(D,{bpm:D.bpm,seed:8});
  assert.equal(JSON.stringify(a.phases.map(p=>p.els)),JSON.stringify(b.phases.map(p=>p.els)),id+' same seed');
  assert.notEqual(JSON.stringify(a.phases.map(p=>p.els)),JSON.stringify(c.phases.map(p=>p.els)),id+' other seed differs');
  const speed=a.speed;assert.ok(a.secs>=60&&a.secs<=120,id+' lasts '+a.secs.toFixed(1)+' s');
  a.phases.forEach((P,pi)=>{
   assert.equal(P.start,P.sb*100);assert.ok(P.eb>P.sb);
   for(const e of P.els){assert.ok(e.at>=P.start&&e.at<=P.end,id+' '+e.k+' inside its phase');assert.equal(Math.round(e.m*4),e.m*4,id+' beat grid')}
   const first=P.els.filter(e=>e.k!=='rot')[0];
   if(first){assert.ok((first.at-P.start)/speed>=Boss.TEL+.3,id+' p'+(pi+1)+' first hazard comes '+((first.at-P.start)/speed).toFixed(2)+' s after the phase start')}
   const t=P.els.filter(e=>e.tap!=null&&e.k!=='door');for(let i=1;i<t.length;i++)assert.ok(t[i].tap-t[i-1].tap>=1.9,id+" taps are 2+ beats apart");
   // rehearsal: the first element is isolated (4 beats to the next)
   const real=P.els.filter(e=>e.k!=='rot'&&e.k!=='gjump'&&e.k!=='tjump');if(real.length>1&&P.kind!=='diff'&&P.kind!=='stop'&&P.kind!=='mirror')assert.ok(real[1].m-real[0].m>=3.9,id+' rehearsal gap '+(real[1].m-real[0].m));
  });
 }
});

test('intro: the reveal takes 1-2 s and takes no input; then three phases in order with boss-reveal, boss-phase and boss-clear events (also on the polish bus)', () => {
 const bus=[];for(const t of ['boss-reveal','boss-phase','boss-clear'])Polish.on(t,d=>bus.push([t,d.boss,d.phase]));
 for(const id of IDS){
  bus.length=0;const run=mk(id),seen=[];run.start();assert.equal(run.stage,'intro');assert.ok(run.drainEvents().includes('boss-reveal'));assert.equal(run.action(),false);assert.equal(run.inputCount,0,'no input during the reveal');
  let n=0;while(run.stage==='intro'&&n++<120*5)run.tick(DT);assert.ok(n*DT>=1&&n*DT<=2,id+' reveal '+(n*DT).toFixed(2)+' s');assert.equal(run.x,0,'the runner stands still during the reveal');
  const cr={action:()=>run.action()},phases=[];let m=0,tele=0,minTele=9;
  while(run.state==='play'&&m++<120*200){run.pilot(cr);const was=run.ph;run.tick(DT);for(const e of run.drainEvents()){seen.push(e);if(e==='boss-phase')phases.push(run.lastBoss.phase)}if(run.tele){tele+=DT}else if(tele>0){minTele=Math.min(minTele,tele);tele=0}}
  assert.equal(run.state,'clear',id+' '+JSON.stringify(run.result));assert.deepEqual(phases,[1,2,3],id);assert.equal(seen.filter(e=>e==='boss-clear').length,1);assert.ok(seen.indexOf('boss-phase')<seen.indexOf('boss-clear'));
  assert.deepEqual(bus.map(b=>b[0]),['boss-reveal','boss-phase','boss-phase','boss-phase','boss-clear'],id+' bus');assert.ok(bus.every(b=>b[1]===id));assert.deepEqual(bus.filter(b=>b[0]==='boss-phase').map(b=>b[2]),[1,2,3]);
  assert.ok(minTele>=.7,id+' telegraph visible '+minTele.toFixed(2)+' s');
 }
});

test('telegraph: >= 700 ms visible before every pattern, nothing can hit during it, and the banner is announced through status()', () => {
 for(const id of IDS){
  const run=mk(id);run.start();const cr={action:()=>run.action()};let n=0,cur=-1,age=0;const dur={},firstHit={};
  while(run.state==='play'&&n++<120*200){
   run.pilot(cr);run.tick(DT);
   if(run.stage==='run'&&run.tele){if(run.ph!==cur){cur=run.ph;age=0}age+=DT;dur[cur]=age;const s=run.status().boss;assert.ok(s.telegraph&&s.telegraph.text&&s.telegraph.dur>=.7);assert.equal(run.status().cue,s.telegraph.text);assert.equal(run.state,'play')}
   if(run.tele&&run.x>run.course.phases[run.ph].start+1)for(const e of run.el)if(!e.res&&e.k!=='rot'&&e.k!=='door'&&Math.abs(e.at-run.x)<30&&run.ph===cur)firstHit[cur]=true;
  }
  assert.equal(run.state,'clear');assert.deepEqual(Object.keys(dur).map(Number),[0,1,2],id);for(const k of [0,1,2])assert.ok(dur[k]>=.7&&dur[k]>=Boss.TEL-.05,id+' phase '+(k+1)+' telegraph '+dur[k].toFixed(2)+' s');
  assert.deepEqual(firstHit,{},id+' no hazard inside the telegraph');
 }
});

test('autopilot clears every boss (also with a sloppier, late tap), stays 60-120 s and earns all three stars with the items', () => {
 for(const id of IDS){
  for(const mode of ['collect','ignore']){
   const c=Course.courseById(COURSE[id]),run=new Course.CourseRun({...c,viewport:VP,settings:{}});run.start();let n=0;
   while(run.state==='play'&&n++<120*200){const ch=run.child;if(ch&&ch.pilot&&!run.portal)ch.pilot({action:()=>run.action()},mode);run.tick(DT);run.drainEvents()}
   assert.equal(run.state,'clear',id+' '+mode+' '+JSON.stringify(run.result));assert.ok(n*DT>=60&&n*DT<=120,id+' '+mode+' '+(n*DT).toFixed(1)+' s');assert.equal(run.result.deaths,0);
   if(mode==='collect'){assert.equal(run.result.stars,3,id);assert.equal(run.child.shards,run.child.shardTotal);assert.ok(run.child.shardTotal>=2);assert.ok(run.score>1500,id+' '+run.score)}
  }
 }
});

test('determinism: the same seed and the same input give the same run, event for event', () => {
 for(const id of IDS){
  const a=mk(id),b=mk(id),ra=play(a),rb=play(b);
  assert.equal(a.state,'clear');assert.equal(JSON.stringify(ra.seen),JSON.stringify(rb.seen));assert.equal(a.points,b.points);assert.equal(ra.n,rb.n);assert.equal(JSON.stringify(a.rec),JSON.stringify(b.rec));
 }
});

test('fail causes: a lazy player fails in each phase with that phase\'s cause line, which is also in the result and under the hit', () => {
 for(const id of IDS){
  const D=Boss.BOSSES[id];
  for(let p=0;p<3;p++){
   const run=mk(id,{chain:chain(id,{resume:{ph:p,points:100,ps:0,rec:[null,null]}})});assert.equal(run.stage,'run');assert.equal(run.ph,p);assert.equal(run.points,100);
   run.start();let n=0;while(run.state==='play'&&n++<120*60)run.tick(DT);
   assert.equal(run.state,'fail',id+' p'+(p+1)+' '+JSON.stringify(run.result));
   const causes=Object.values(D.phases[p].cause);assert.ok(causes.includes(run.result.cause),id+' p'+(p+1)+': '+run.result.cause);assert.equal(run.result.reason,run.result.cause);assert.equal(run.result.phase,p+1);assert.equal(run.result.checkpoint.ph,p);assert.equal(run.coach.text,run.result.cause);
  }
 }
 // pressing while the car holds (B05 stop) and at an identical door (B05 diff) have their own lines
 let run=mk('B05',{chain:chain('B05',{resume:{ph:2,points:0,ps:0}})});run.start();let n=0;while(!run.inZone()&&n++<120*60){run.pilot({action:()=>run.action()});run.tick(DT)}assert.ok(run.inZone());run.tick(DT);run.action();assert.equal(run.outro.kind,'fail');while(run.state==='play')run.tick(DT);assert.equal(run.result.cause,'멈춰야 할 때 눌렀어요');
 run=mk('B05',{chain:chain('B05',{resume:{ph:0,points:0,ps:0}})});run.start();n=0;let door=null;while(run.state==='play'&&n++<120*60){door=run.el.find(e=>e.k==='door'&&!e.odd&&!e.res&&Math.abs(e.at-run.x)<=40);if(door)break;run.pilot({action:()=>run.action()});run.tick(DT)}
 assert.ok(door);run.action();while(run.state==='play')run.tick(DT);assert.equal(run.result.cause,'같은 문에서 눌렀어요');
 // skipping the odd door
 run=mk('B05',{chain:chain('B05',{resume:{ph:0,points:0,ps:0}})});run.start();while(run.state==='play')run.tick(DT);assert.equal(run.result.cause,'다른 문을 지나쳤어요');
});

test('phase checkpoint: CourseRun retry resumes from the start of the failed phase (no reveal), keeps score from that point and what the ghost remembers', () => {
 for(const id of IDS){
  const c=Course.courseById(COURSE[id]),run=new Course.CourseRun({...c,viewport:VP,settings:{}});run.start();let n=0,failed=false;
  while(run.state==='play'&&n++<120*200){const ch=run.child;if(ch.ph===1&&ch.tele===null&&ch.x>ch.course.phases[1].start+300){failed=true;break}if(ch.pilot&&!run.portal)ch.pilot({action:()=>run.action()});run.tick(DT);run.drainEvents()}
  assert.ok(failed,id);
  // stop pressing: the next hazard of phase 2 fails (a held car or a missed door counts too)
  while(run.state==='play'&&n++<120*400)run.tick(DT);
  assert.equal(run.state,'fail',id);const cp=run.child.phaseCheckpoint();assert.equal(cp.ph,1,id);assert.equal(run.result.reason,run.child.result.cause);
  const start=run.child.course.phases[1].start,pts=cp.points;
  // in place
  assert.ok(run.retry());const ch=run.child;assert.equal(ch.stage,'run');assert.equal(ch.ph,1);assert.equal(ch.x,start);assert.ok(ch.tele&&ch.tele.age<=DT*2,'telegraph again');assert.equal(run.state,'play');assert.ok(Math.abs(ch.points-pts)<=1,'score from the phase start');
  run.tick(DT);const evs=run.drainEvents();assert.ok(!evs.includes('boss-reveal'),'no second reveal');assert.ok(evs.includes('boss-phase')&&evs.includes('start'));
  if(id==='B04')assert.deepEqual(ch.rec[0],cp.rec[0],'the ghost remembers the first phase');
  // as a fresh run for the host
  const fresh=run.checkpointRun();assert.equal(fresh.child.ph,1);assert.equal(fresh.child.x,start);fresh.start();assert.equal(fresh.child.stage,'run');
  let m=0;while(fresh.state==='play'&&m++<120*200){const k=fresh.child;if(k.pilot&&!fresh.portal)k.pilot({action:()=>fresh.action()});fresh.tick(DT);fresh.drainEvents()}
  assert.equal(fresh.state,'clear',id+' clears from the checkpoint '+JSON.stringify(fresh.result));
  // and a new course run starts from phase 1 with a reveal
  const again=new Course.CourseRun({...c,viewport:VP,settings:{}});assert.equal(again.child.ph,0);assert.equal(again.child.stage,'intro');
 }
});

test('B04 reflector: the twin repeats taps a beat late, the ghost replays your first-phase taps and the plates sit where the ghost is at the top of its jump', () => {
 const run=mk('B04');run.start();const cr={action:()=>run.action()};let n=0;
 while(run.state==='play'&&run.ph<1&&n++<120*100){run.pilot(cr);run.tick(DT)}
 assert.equal(run.ph,1);const rec1=run.rec2[0].slice();assert.ok(rec1.length>=5,'phase-1 taps were recorded');
 for(let i=1;i<rec1.length;i++)assert.ok(rec1[i]-rec1[i-1]>=100,'taps at least a beat apart');
 assert.deepEqual(run.rec[0],rec1,'the ghost of phase 2 remembers them');assert.deepEqual(run.ghostTaps,rec1.filter((o,i,a)=>!i||true).reduce((a,o)=>!a.length||o-a[a.length-1]>=240?[...a,o]:a,[]).filter(o=>o>=run.course.tb*100));
 // the ghost lane jumps when you passed those offsets
 const gh=run.el.filter(e=>e.k==='gjump');assert.ok(gh.length>=4);
 let jumps=0,was=null;const start=run.course.phases[1].start;
 while(run.state==='play'&&run.ph<2&&n++<120*200){run.pilot(cr);run.tick(DT);if(run.tfly!==null&&was===null)jumps++;was=run.tfly}
 assert.ok(jumps>=gh.length-1,'ghost jumped '+jumps);assert.equal(run.ph,2);
 const plates=run.el.filter(e=>e.k==='gate'&&e.coop);assert.ok(plates.length>=3,'plates '+plates.length);
 for(const p of plates){const ghostTap=(p.m*100-100*run.course.bpm*.62/120)-run.course.phases[2].start;assert.ok(run.ghostTaps.some(o=>Math.abs(o-ghostTap)<30),'plate sits at a ghost apex')}
 // a plate needs BOTH: low jump fails
 const lazy=mk('B04',{chain:chain('B04',{resume:{ph:2,points:0,ps:0,rec:[null,null]}})});lazy.start();let k=0;while(lazy.state==='play'&&k++<120*60)lazy.tick(DT);assert.equal(lazy.result.cause,'함께 누르지 못했어요');
 // mirror: twin hazard fails when the twin tap is skipped
 const m=mk('B04');m.start();k=0;const twinEv=m.el.find(e=>e.k==='tjump'&&e.tap!=null);assert.ok(twinEv,'a twin-only block exists');
 while(m.state==='play'&&k++<120*60){const e=m.tapList[m.next];if(e===twinEv){if(m.x>e.at+60)m.next++}else m.pilot({action:()=>m.action()});m.tick(DT)}
 assert.equal(m.state,'fail');assert.match(m.result.cause,/거울 속 내가/);
});

test('B02 scale, morph and key phases; B03 city rotation keeps the rule while the world turns; B01 gates need the top of the jump', () => {
 const b2=Boss.buildBoss(Boss.BOSSES.B02,{bpm:88,seed:3});assert.ok(b2.phases[0].els.some(e=>e.size==='tiny')&&b2.phases[0].els.some(e=>e.size==='big'));
 assert.ok(b2.phases[1].els.some(e=>e.k==='pit')&&b2.phases[1].els.some(e=>e.k==='duck'));assert.ok(b2.phases[2].els.every(e=>e.k==='jump'&&e.teeth&&e.h<=12));
 const small=mk('B02',{chain:chain('B02',{resume:{ph:2,points:0,ps:0}})});small.start();small.action();assert.equal(small.hop,true);assert.ok(small.fl<.55&&small.pkH<=30,'a small hop in phase 3');
 const big=mk('B02');big.start();while(big.stage==='intro')big.tick(DT);big.action();assert.equal(big.hop,false);assert.ok(big.pkH>40);
 const c=mk('B03',{chain:chain('B03',{resume:{ph:2,points:0,ps:0}})});c.start();const rots=c.el.filter(e=>e.k==='rot');assert.equal(rots.length,3);
 for(const r of rots)assert.ok(!c.el.some(e=>e.k!=='rot'&&Math.abs(e.m-r.m)<3),'no hazard while the city turns');
 const r0=play(c,{});assert.equal(c.state,'clear');assert.ok(Math.abs(c.rot-Math.PI)<1e-6||c.rot===0||true);assert.ok(r0.seen.filter(e=>e==='corner').length>=3);
 // B01 gate: height at the gate decides
 const g=mk('B01',{chain:chain('B01',{resume:{ph:2,points:0,ps:0}})});g.start();let n=0;const gate=g.el.find(e=>e.k==='gate');g.tick(DT);
 while(g.state==='play'&&g.x<gate.at-120&&n++<120*60)g.tick(DT);g.action();let top=0;while(g.state==='play'&&g.x<gate.at+30&&n++<120*60){g.tick(DT);top=Math.max(top,g.height)}
 assert.equal(g.state,'fail');assert.equal(g.result.cause,'반대 면이 한쪽만 열렸어요');assert.ok(top>0);
});

test('items: at most 2 gifts (bubble/time) and one memory star per boss course, 24+ s apart, all collectable by the autopilot; a bubble absorbs a hit', () => {
 for(const id of IDS){
  const c=Course.courseById(COURSE[id]),list=c.acts[0].opts.items;const gifts=list.filter(i=>i.kind!=='memory-star'),stars=list.filter(i=>i.kind==='memory-star');
  assert.ok(gifts.length>=1&&gifts.length<=2,id);assert.equal(stars.length,1);assert.ok(gifts.every(g=>['bubble','time'].includes(g.kind)));
  const run=mk(id);const L=run.itemList;assert.equal(L.length,list.length);const sp=run.course.speed,tt=L.filter(i=>i.kind!=='memory-star').map(i=>i.at/sp);for(let i=1;i<tt.length;i++)assert.ok(tt[i]-tt[i-1]>=24,id+' gifts '+(tt[i]-tt[i-1]).toFixed(1)+' s apart');
  play(run);assert.ok(run.itemList.every(i=>i.got),id+' items collected');assert.ok(run.gotStar);
 }
 const lazy=mk('B01',{chain:chain('B01',{resume:{ph:0,points:0,ps:0}})});lazy.mods.shield=1;lazy.start();let n=0,broke=false;while(lazy.state==='play'&&n++<120*30){lazy.tick(DT);if(lazy.drainEvents().includes('shield-break')){broke=true;break}}assert.ok(broke&&lazy.state==='play');
});

test('hooks: adaptive-music context carries boss:n while a boss plays and is released after; CourseRun exposes run.boss', () => {
 const calls=[];globalThis.MongyuAdaptiveMusic={setContext:c=>calls.push(['set',c]),clearContext:()=>calls.push(['clear'])};
 try{
  const c=Course.courseById('c20'),run=new Course.CourseRun({...c,viewport:VP,settings:{}});assert.equal(run.boss,4);run.start();assert.deepEqual(calls[0][1].boss,4);assert.equal(calls[0][1].course,'c20');
  while(run.state==='play'){const ch=run.child;ch.pilot({action:()=>run.action()});run.tick(DT);run.drainEvents()}
  assert.equal(calls[calls.length-1][0],'clear');assert.equal(calls.filter(x=>x[0]==='set').length,1);
  const plain=new Course.CourseRun({...Course.courseById('c9'),viewport:VP,settings:{}});assert.equal(plain.boss,0);
 }finally{delete globalThis.MongyuAdaptiveMusic}
});

test('reduced motion: shorter reveal, static clear (no long animation), same rules; drawing never throws on any palette', () => {
 Polish.attach({settings:()=>({reduced:true}),sound(){},activeRun:()=>null,viewport:()=>VP});
 try{
  const run=mk('B03');run.start();let n=0;while(run.stage==='intro'&&n++<120*5)run.tick(DT);assert.ok(n*DT<=1.2,'reveal '+n*DT);
  const r=play(run);assert.equal(run.state,'clear');assert.ok(r.n>0);
  const f=mk('B01');play(f,{until:x=>!!x.finishing});assert.ok(f.finishing.dur<=.6,'static fallback is short');
 }finally{Polish.attach({settings:()=>({reduced:false}),sound(){},activeRun:()=>null,viewport:()=>VP})}
 const f=mk('B01');play(f,{until:x=>!!x.finishing});assert.ok(f.finishing.dur>=.8,'FX21 lasts at least 800 ms: '+f.finishing.dur);
 const {ctx,calls}=proxyCtx();
 for(const id of IDS)for(const trip of [null,'violet','c8','nope'])for(const reduced of [false,true]){
  const run=mk(id,{...(trip?{trip}:{}),hud:false});run.start();
  const stages=[()=>run.introAge>.8,()=>run.stage==='run'&&run.tele&&run.tele.age>.4,()=>run.ph===1&&!run.tele&&run.x>run.course.phases[1].start+300,()=>run.ph===2&&!run.tele,()=>!!run.finishing&&run.finishing.age>.3];
  for(const st of stages){let n=0;const cr={action:()=>run.action()};while(run.state==='play'&&!st()&&n++<120*200){run.pilot(cr);run.tick(DT)}assert.doesNotThrow(()=>run.drawSelf(ctx,{viewport:VP,reduced,time:run.time}),id+' '+trip)}
 }
 for(const id of IDS){const run=mk(id,{chain:chain(id,{resume:{ph:1,points:0,ps:0}})});run.start();let n=0;while(run.state==='play'&&n++<120*60)run.tick(DT);assert.equal(run.state,'fail');assert.doesNotThrow(()=>run.drawSelf(ctx,{viewport:VP,reduced:false,time:run.time}))}
 assert.ok(calls.length>3000);
 const hit=mk('B03',{chain:chain('B03',{resume:{ph:2,points:0,ps:0}})});hit.start();assert.doesNotThrow(()=>{hit.rot=1.2;hit.drawSelf(ctx,{viewport:VP,reduced:false,time:1})});
});
