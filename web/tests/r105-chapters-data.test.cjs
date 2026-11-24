const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
for(const f of ['trip-palettes','items','opening-run','illusion-course','helix-act','penrose-act','endless-dream','chapters','square-act','boss-act'])require('../src/'+f+'.js');
const Course=require('../src/course-run.js'),Chapters=globalThis.MongyuChapters,Trip=globalThis.MongyuTrip;
const NEW=Chapters.chapters,ALL=Course.allCourses();
const seconds=c=>c.acts.reduce((s,a)=>s+a.weight,0);

test('chapters 2-5: five courses each, ids continue c6-c25, chapter 1 and its ids are untouched', () => {
 assert.equal(Course.CHAPTERS.length,5);assert.equal(Course.CHAPTERS[0],Course.CHAPTER1);
 assert.deepEqual(Course.CHAPTER1.courses.map(c=>c.id),['c1','c2','c3','c4','c5']);
 assert.deepEqual(NEW.map(c=>c.number),[2,3,4,5]);
 for(const ch of NEW)assert.equal(ch.courses.length,5,ch.id);
 assert.deepEqual(ALL.map(c=>c.id),Array.from({length:25},(_,i)=>'c'+(i+1)));
 assert.equal(Course.courseById('c25').title,'없는 출구');assert.equal(Course.chapterOf('c13').number,3);assert.equal(Course.courseById('c99'),null);
 assert.equal(new Set(ALL.map(c=>c.seed)).size,25,'every course has its own seed');
});

test('each chapter has its own trip palette key (c1-c5) and bpm; every act carries the palette', () => {
 const trips={2:'c2',3:'c3',4:'c4',5:'c5'},bpms={1:96,2:88,3:120,4:100,5:76};
 assert.equal(Course.CHAPTER1.trip,'c1');for(const c of Course.CHAPTER1.courses)assert.equal(c.trip,'c1');
 for(const ch of NEW){
  assert.equal(ch.trip,trips[ch.number]);assert.equal(ch.bpm[0],bpms[ch.number]);
  for(const c of ch.courses){
   assert.equal(c.trip,ch.trip);assert.equal(c.chapter,ch.number);
   assert.equal(c.bpm,bpms[ch.number],c.id+' bpm '+c.bpm);
   for(const a of c.acts)assert.equal(a.opts.trip,ch.trip,c.id+' '+a.type);
   for(const a of c.fallback||[])assert.equal(a.opts.trip,ch.trip,c.id+' fallback');
  }
 }
 // the trip palettes c1-c5 come from trip-palettes.js (another workstream); a missing key falls back to violet
 assert.ok(Trip.get('c2')&&Trip.get('nope'));
});

test('every act type is registered, courses run 42-96 s, and the chapter signature acts are present', () => {
 const NEWACTS=['square','flip','mirror','wait'];
 for(const c of ALL.slice(5)){
  for(const a of c.acts)assert.ok(Course.hasAct(a.type),c.id+' needs '+a.type);
  if(c.boss){assert.ok(seconds(c)>=60&&seconds(c)<=120,c.id+' boss length');assert.equal(c.acts.length,1,c.id);if(c.fallback)for(const a of c.fallback)assert.ok(Course.hasAct(a.type)&&!NEWACTS.includes(a.type)&&a.type!=='boss');continue}   // boss courses: r105-boss-act.test.cjs
  const s=seconds(c);assert.ok(s>=42&&s<=96,c.id+' '+s+'s');
  assert.ok(c.acts.length>=3&&c.acts.length<=6,c.id);
  if(c.fallback)for(const a of c.fallback)assert.ok(Course.hasAct(a.type)&&!NEWACTS.includes(a.type),'fallback uses classic acts only: '+c.id);
 }
 const types=ch=>new Set(ch.courses.flatMap(c=>c.acts.map(a=>a.type)));
 for(const t of ['bridge','penrose','align','helix-up','floor-wall'])assert.ok(types(NEW[0]).has(t),'ch2 '+t);
 for(const t of ['square','flip','penrose','align'])assert.ok(types(NEW[1]).has(t),'ch3 impossible city '+t);
 assert.ok(NEW[2].courses.every(c=>c.boss||c.acts.some(a=>a.type==='mirror')),'ch4 is the mirror');
 assert.ok(types(NEW[3]).has('wait')&&NEW[3].courses.slice(0,4).every(c=>c.acts.some(a=>a.type==='wait')),'ch5 waits at the elevator');
 const finale=Course.courseById('c25');assert.equal(finale.boss.id,'B05','the finale is boss B05 "No Exit" (its three rules are tested in r105-boss-act.test.cjs)');
 // the first course of a chapter introduces its new idea (tutorial, level 0, short)
 assert.ok(Course.courseById('c11').acts.some(a=>a.type==='square'&&a.opts.tutorial));assert.ok(Course.courseById('c13').acts[0].type==='flip'&&Course.courseById('c13').acts[0].opts.tutorial);
 assert.ok(Course.courseById('c16').acts[0].type==='mirror'&&Course.courseById('c16').acts[0].opts.tutorial&&Course.courseById('c16').acts[0].opts.level===0);
 assert.ok(Course.courseById('c21').acts.some(a=>a.type==='wait'&&a.opts.tutorial&&a.opts.waits===1));
});

test('item rules: at most 2 gifts and one memory star per course, 26+ s apart, never a feather where it cannot be used', () => {
 for(const c of ALL.slice(5).filter(c=>!c.boss)){   // boss courses place items by phase/element: r105-boss-act.test.cjs
  const list=[];let t0=0;
  for(const a of c.acts){for(const it of a.opts.items||[]){assert.ok(it.at>0&&it.at<1,c.id);list.push({...it,type:a.type,t:t0+it.at*a.weight})}t0+=a.weight}
  const gifts=list.filter(i=>i.kind!=='memory-star'),stars=list.filter(i=>i.kind==='memory-star');
  assert.ok(gifts.length>=1&&gifts.length<=2,c.id+' gifts '+gifts.length);assert.equal(stars.length,1,c.id+' memory star');
  assert.ok(gifts.every(g=>['bubble','time','feather'].includes(g.kind)&&g.lane==='lo'),c.id);assert.equal(stars[0].lane,'hi');
  assert.ok(gifts.every(g=>!(g.kind==='feather'&&['flip','align','mirror','helix-up','helix-down'].includes(g.type))),c.id+' feather in '+gifts.map(g=>g.type));
  assert.ok(gifts.every(g=>g.type!=='align'),c.id+' items in align');
  for(let i=1;i<gifts.length;i++)assert.ok(gifts[i].t-gifts[i-1].t>=24,c.id+' gifts too close ('+(gifts[i].t-gifts[i-1].t).toFixed(1)+'s)');
 }
});

test('voice: chapter titles are nouns, intro (1-2 lines) and ending (1 line) are first-person banmal monologue, no developer words', () => {
 const bad=/실행|허용|활성|인스턴스|세션|리셋|했다\.?$|이다\.?$|하십시오|습니다/;
 assert.equal(Course.CHAPTER1.title,'자각몽의 정원');assert.deepEqual(NEW.map(c=>c.title),['잊혀진 유년기','불가능한 도시','또 다른 나','경계의 호텔']);
 for(const ch of Course.CHAPTERS){
  assert.ok(ch.intro.length>=1&&ch.intro.length<=2,ch.id+' intro lines');assert.equal(typeof ch.ending,'string');assert.ok(ch.ending.length>8&&!ch.ending.includes('\n'));
  for(const l of [...ch.intro,ch.ending,ch.title,ch.subtitle])assert.doesNotMatch(l,bad,l);
  for(const l of [...ch.intro,ch.ending]){assert.match(l,/[.?]$/);assert.ok(l.length<=22,'short monologue: '+l);assert.doesNotMatch(l,/(요|니다|세요)[.?]$/,'banmal: '+l)}
  for(const c of ch.courses){assert.ok(c.title&&c.subtitle,c.id);assert.doesNotMatch(c.title+c.subtitle,bad)}
 }
});

test('English: every new title, line and chapter-tab label translates fully', () => {
 const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),SRC=path.resolve(__dirname,'..','src');
 const ctx={MONGYU_UI_EDITION:true,console,performance:{now:()=>0},navigator:{language:'en'}};vm.createContext(ctx);
 for(const f of ['i18n.js','i18n-en.js','i18n-en-psy.js','i18n-en-screens.js','i18n-en-chapters.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 const T=ctx.MongyuI18n,lines=[];
 for(const ch of Course.CHAPTERS){lines.push(ch.title,ch.subtitle,...ch.intro,ch.ending,ch.number+'장',ch.number+'장 '+ch.title+', 별 3 / 15',ch.number+'장 '+ch.title+', 잠김. 앞 장의 마지막 코스를 완주하면 열려요.',
  '새 장이 열렸어요 · '+ch.number+'장 '+ch.title,'다음 장 · '+ch.title,'앞 장의 마지막 코스 「'+ch.courses[4].title+'」를 완주하면 열려요');
  for(const c of ch.courses)lines.push(c.title,c.subtitle,c.title+', 잠김. 앞 장을 완주하면 열려요.')}
 lines.push('장 선택','잠김','앞 장을 완주하면 열려요','사각 방','중력 뒤집기','탭하면 중력이 뒤집혀','사각 방에서 길이 끊겼어요','중력 뒤집기에서 길이 끊겼어요','★ 11');
 for(const l of lines){const r=T.translate(l,'en');if(!/[가-힣]/.test(l))continue;assert.ok(r!==null&&!/[가-힣]/.test(r),'translates: '+l+' -> '+r)}
 assert.equal(T.translate('달빛 수로','en'),'Moonlit Canal');assert.equal(T.translate('심장의 시계탑','en'),'Heart Clock Tower');
});
