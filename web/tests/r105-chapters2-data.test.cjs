const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
for(const f of ['trip-palettes','items','opening-run','illusion-course','helix-act','penrose-act','endless-dream','chapters','square-act','eye-act','liquid-act','rhythm-act'])require('../src/'+f+'.js');
const Course=require('../src/course-run.js'),Chapters=globalThis.MongyuChapters,Trip=globalThis.MongyuTrip;
const NEW=Chapters.chapters.slice(4),ALL=Course.allCourses(),LATE=ALL.slice(25);
const seconds=c=>c.acts.reduce((s,a)=>s+a.weight,0);
const SRC=path.resolve(__dirname,'..','src');

test('chapters 6-10: five courses each, ids continue c26-c50, chapters 1-5 and their ids are untouched', () => {
 assert.equal(Course.CHAPTERS.length,10);assert.deepEqual(NEW.map(c=>c.number),[6,7,8,9,10]);
 for(const ch of NEW)assert.equal(ch.courses.length,5,ch.id);
 assert.deepEqual(ALL.map(c=>c.id),Array.from({length:50},(_,i)=>'c'+(i+1)));
 assert.deepEqual(Course.CHAPTER1.courses.map(c=>c.id),['c1','c2','c3','c4','c5']);assert.deepEqual(Course.CHAPTERS.slice(0,5).map(c=>c.number),[1,2,3,4,5]);
 assert.equal(Course.courseById('c26').title,'눈치');assert.equal(Course.courseById('c50').title,'열린 틀');assert.equal(Course.chapterOf('c38').number,8);assert.equal(Course.courseById('c51'),null);
 assert.equal(new Set(ALL.map(c=>c.seed)).size,50,'every course has its own seed');
 for(const ch of NEW)assert.ok(ch.courses.every(c=>Object.isFrozen(c)));
});

test('chapters 6-10 exist only in the UI edition; the five original chapters stay as they were without it', () => {
 const ctx={MONGYU_POLISH_EDITION:true,MONGYU_UI_EDITION:false,console};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(SRC,'chapters.js'),'utf8'),ctx,{filename:'chapters.js'});
 assert.equal(ctx.MongyuChapters.chapters.length,4);assert.deepEqual(Array.from(ctx.MongyuChapters.chapters,c=>c.number),[2,3,4,5]);
 const ui={MONGYU_POLISH_EDITION:true,MONGYU_UI_EDITION:true,console};vm.createContext(ui);vm.runInContext(fs.readFileSync(path.join(SRC,'chapters.js'),'utf8'),ui,{filename:'chapters.js'});assert.equal(ui.MongyuChapters.chapters.length,9);
});

test('each chapter has its own trip palette key (c6-c10) and the music table bpm; every act carries the palette', () => {
 const trips={6:'c6',7:'c7',8:'c8',9:'c9',10:'c10'},bpms={6:92,7:125,8:138,9:71,10:96};
 for(const ch of NEW){
  assert.equal(ch.trip,trips[ch.number]);assert.equal(ch.bpm[0],bpms[ch.number]);assert.ok(Trip.palettes[ch.trip],'palette '+ch.trip);
  for(const c of ch.courses){
   assert.equal(c.trip,ch.trip);assert.equal(c.chapter,ch.number);assert.equal(c.bpm,bpms[ch.number],c.id+' bpm '+c.bpm);
   for(const a of c.acts)assert.equal(a.opts.trip,ch.trip,c.id+' '+a.type);
   for(const a of c.fallback||[])assert.equal(a.opts.trip,ch.trip,c.id+' fallback');
  }
 }
});

test('every act type is registered, courses run 50-100 s, signature acts and boss slots are in place', () => {
 const NEWACTS=['square','flip','mirror','wait','eye','liquid','rhythm'];
 for(const c of LATE){
  for(const a of c.acts)assert.ok(Course.hasAct(a.type),c.id+' needs '+a.type);
  const s=seconds(c);assert.ok(s>=50&&s<=(c.id==='c50'?100:93),c.id+' '+s+'s');
  assert.ok(c.acts.length>=3&&c.acts.length<=8,c.id);
  assert.ok(c.fallback&&c.fallback.length>=3);for(const a of c.fallback)assert.ok(Course.hasAct(a.type)&&!NEWACTS.includes(a.type),'fallback uses classic acts only: '+c.id);
 }
 const types=ch=>new Set(ch.courses.flatMap(c=>c.acts.map(a=>a.type)));
 assert.ok(NEW[0].courses.every(c=>c.acts.some(a=>a.type==='eye')),'chapter 6 is the eye');
 assert.ok(NEW[1].courses.every(c=>c.acts.some(a=>a.type==='liquid')),'chapter 7 is the liquid floor');
 assert.ok(NEW[2].courses.every(c=>c.acts.some(a=>a.type==='rhythm')),'chapter 8 is the rhythm hall');
 const waits=NEW[3].courses.filter(c=>c.acts.some(a=>a.type==='wait'));assert.equal(waits.length,5,'chapter 9 waits');
 for(const c of NEW[3].courses)for(const a of c.acts.filter(x=>x.type==='wait'))assert.equal(a.opts.bare,true,c.id+' wait is bare (a void and one line)');
 assert.ok(NEW[3].courses.every(c=>c.acts.filter(a=>a.type==='wait'||a.type==='floor-wall').length>=2),'chapter 9 is mostly wait and floor-wall');
 assert.ok(!types(NEW[3]).has('eye')&&!types(NEW[3]).has('rhythm')&&!types(NEW[3]).has('liquid'));
 const finale=Course.courseById('c50'),ft=new Set(finale.acts.map(a=>a.type));
 for(const t of ['square','flip','mirror','eye','liquid','rhythm','wait'])assert.ok(ft.has(t),'finale gathers '+t);
 // chapter 10 recombines what was verified before
 for(const t of ['floor-wall','bridge','helix-up','align','flip','penrose','square','mirror','liquid','wait','rhythm','eye'])assert.ok(types(NEW[4]).has(t),'chapter 10 recombines '+t);
 // the first course of each new mechanic is a short tutorial at level 0
 for(const [id,type] of [['c26','eye'],['c31','liquid'],['c36','rhythm'],['c41','wait']]){const c=Course.courseById(id);assert.ok(c.acts.some(a=>a.type===type&&a.opts.tutorial&&a.opts.level===0),id)}
 // boss slots: data only, with placeholders until the boss act exists
 const bosses=NEW.map(ch=>ch.courses[4]);assert.deepEqual(bosses.map(c=>c.id),['c30','c35','c40','c45','c50']);assert.deepEqual(bosses.map(c=>c.boss.id),['B06','B07','B08','B09','B10']);
 for(const c of bosses){assert.equal(c.bossPlaceholder,true);assert.ok(Object.keys(c.boss).length===1)}
 for(const c of LATE.filter(c=>!bosses.includes(c)))assert.equal(c.boss,undefined);for(const c of ALL.slice(0,25))assert.equal(c.boss,undefined);
});

test('levels climb through a chapter: the boss placeholder is at least as hard as the first course', () => {
 const lv=c=>Math.max(...c.acts.map(a=>a.opts.level|0));
 for(const ch of NEW.slice(0,3))assert.ok(lv(ch.courses[4])>=lv(ch.courses[0])+2,ch.id);
 assert.equal(lv(NEW[0].courses[0]),0);assert.equal(lv(NEW[1].courses[0]),0);assert.equal(lv(NEW[2].courses[0]),0);
});

test('item rules: at most 2 gifts and one memory star per course, 24+ s apart, never a feather where it cannot be used', () => {
 for(const c of LATE){
  const list=[];let t0=0;
  for(const a of c.acts){for(const it of a.opts.items||[]){assert.ok(it.at>0&&it.at<1,c.id);list.push({...it,type:a.type,t:t0+it.at*a.weight})}t0+=a.weight}
  const gifts=list.filter(i=>i.kind!=='memory-star'),stars=list.filter(i=>i.kind==='memory-star');
  assert.ok(gifts.length>=1&&gifts.length<=2,c.id+' gifts '+gifts.length);assert.equal(stars.length,1,c.id+' memory star');
  assert.ok(gifts.every(g=>['bubble','time','feather'].includes(g.kind)&&g.lane==='lo'),c.id);assert.equal(stars[0].lane,'hi');
  assert.ok(gifts.every(g=>!(g.kind==='feather'&&['flip','align','mirror','helix-up','helix-down'].includes(g.type))),c.id+' feather');
  assert.ok(gifts.every(g=>g.type!=='align'),c.id+' items in align');
  for(let i=1;i<gifts.length;i++)assert.ok(gifts[i].t-gifts[i-1].t>=24,c.id+' gifts too close ('+(gifts[i].t-gifts[i-1].t).toFixed(1)+'s)');
 }
});

test('every one of the 25 new courses is cleared by the autopilot, with and without the item gifts, with three stars when it collects', () => {
 const {play}=(()=>{
  const VP={width:390,height:844},DT=1/120,Op=globalThis.MongyuOpening,Ill=globalThis.MongyuIllusion;
  const pilot=(r,mode)=>{const c=r.child;if(!c||r.state!=='play'||(r.portal&&!r.portal.swapped))return;const t=c.dreamMode||(c.openingCourse?'opening':'?');
   if(c.pilot){c.pilot(r,mode);return}
   if(c.openingCourse){if(c.slowChance==='active'&&c.distance>=c.obstacles[0].at-80){r.action();return}const o=c.obstacles[c.index];if(o&&o.at-c.distance<=Op.PERFECT_LEAD+1&&c.flight===null)r.action();return}
   if(t==='helix'){const ob=c.course.obstacles[c.index];if(c.slowChance==='active'||c.hold){r.action();return}if(ob&&c.flight===null&&(ob.at-c.distance)<=.34*c.speed+.5)r.action();return}
   if(t==='penrose'){const ob=c.course.obstacles[c.blockIndex];if(ob&&c.flight===null&&(ob.at-c.distance)<=.4*c.speed+.5)r.action();return}
   if(t==='align'){if(c.aligned)r.action();return}
   const g=c.activeGap?.();if(g){const ahead=g.s0-c.distance;if(ahead<=90&&ahead>10||c.slowChance==='active')r.action();return}
   const bl=c.cs.COURSE.blocks[c.blockIndex];if(bl&&bl.at-c.distance<=Ill.SPEED*Ill.FLIGHT/2+.5&&c.flight===null)r.action()};
  return {play:(course,mode)=>{const run=new Course.CourseRun({...course,viewport:VP,settings:{},attempt:1});run.start();let n=0;while(run.state==='play'&&n++<120*200){pilot(run,mode);run.tick(DT)}return {run,seconds:n*DT}}};
 })();
 for(const c of LATE)for(const mode of ['collect','ignore']){
  const {run,seconds:s}=play(c,mode);assert.equal(run.state,'clear',c.id+' '+mode+' '+JSON.stringify(run.result));assert.ok(s>=45&&s<=102,c.id+' '+s.toFixed(1)+'s');
  if(mode==='collect')assert.equal(run.result.stars,3,c.id+' '+JSON.stringify(run.result.goals));
  assert.equal(run.result.memoryStar,mode==='collect'?true:run.result.memoryStar);
 }
});

test('voice: chapter titles are nouns, intro (2 lines) and ending (1 line) are first-person banmal monologue, no developer words', () => {
 const bad=/실행|허용|활성|인스턴스|세션|리셋|했다\.?$|이다\.?$|하십시오|습니다/;
 assert.deepEqual(NEW.map(c=>c.title),['누군가 보고 있다','녹아내리는 현실','색채의 섬망','절대적인 무','각성']);
 for(const ch of NEW){
  assert.equal(ch.intro.length,2,ch.id+' intro lines');assert.equal(typeof ch.ending,'string');assert.ok(ch.ending.length>8&&!ch.ending.includes('\n'));
  for(const l of [...ch.intro,ch.ending,ch.title,ch.subtitle])assert.doesNotMatch(l,bad,l);
  for(const l of [...ch.intro,ch.ending]){assert.match(l,/[.?]$/);assert.ok(l.length<=22,'short monologue: '+l);assert.doesNotMatch(l,/(요|니다|세요)[.?]$/,'banmal: '+l)}
  for(const c of ch.courses){assert.ok(c.title&&c.subtitle,c.id);assert.doesNotMatch(c.title+c.subtitle,bad)}
 }
 // the coach lines the new acts speak are the guide's voice: short banmal, no developer words
 const lines=['눈 감으면 뛰어. 뜨면 가만히','보고 있어. 가만히','들켰어','바닥이 입을 벌려. 박자에 맞춰 뛰어','발밑이 녹았어','고리가 닫힐 때 탭','한 박자 늦었어'];
 for(const l of lines){assert.doesNotMatch(l,bad,l);assert.doesNotMatch(l,/(요|니다|세요)[.?]?$/,l)}
});

test('English: every new title, line and act string of chapters 6-10 translates fully', () => {
 const ctx={MONGYU_UI_EDITION:true,console,performance:{now:()=>0},navigator:{language:'en'}};vm.createContext(ctx);
 for(const f of ['i18n.js','i18n-en.js','i18n-en-psy.js','i18n-en-screens.js','i18n-en-chapters.js','i18n-en-chapters2.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 const T=ctx.MongyuI18n,lines=[];
 for(const ch of NEW){lines.push(ch.title,ch.subtitle,...ch.intro,ch.ending,ch.number+'장',ch.number+'장 '+ch.title+', 별 3 / 15',ch.number+'장 '+ch.title+', 잠김. 앞 장의 마지막 코스를 완주하면 열려요.',
  '새 장이 열렸어요 · '+ch.number+'장 '+ch.title,'다음 장 · '+ch.title,'앞 장의 마지막 코스 「'+ch.courses[4].title+'」를 완주하면 열려요');
  for(const c of ch.courses)lines.push(c.title,c.subtitle,c.title+', 잠김. 앞 장을 완주하면 열려요.')}
 lines.push('시선','녹는 길','박자','시선에서 길이 끊겼어요','녹는 길에서 길이 끊겼어요','박자에서 길이 끊겼어요','눈이 감겼을 때만 점프','눈 감으면 뛰어. 뜨면 가만히','보고 있어. 가만히','들켰어','눈에 들켰어요','소품에 부딪혔어요','보는 중','눈 감음',
  '탭: 점프 · 바닥이 입을 벌리면 뛰기','바닥이 입을 벌려. 박자에 맞춰 뛰어','바닥이 녹아 내렸어요','발밑이 녹았어','바닥 혹에 부딪혔어요','탭: 점프 · 고리가 닫힐 때','고리가 닫힐 때 탭','박자를 놓쳤어요','물방울','잉크','종이','눈치');
 for(const l of lines){const r=T.translate(l,'en');if(!/[가-힣]/.test(l))continue;assert.ok(r!==null&&!/[가-힣]/.test(r),'translates: '+l+' -> '+r)}
 assert.equal(T.translate('누군가 보고 있다','en'),'Someone Is Watching');
});
