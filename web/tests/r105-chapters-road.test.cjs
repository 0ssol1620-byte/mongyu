const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {host:makeHost,event}=require('./host.cjs');
const SRC=path.resolve(__dirname,'..','src');
const FILES=['ui-icons.js','trip-palettes.js','items.js','opening-run.js','illusion-course.js','helix-act.js','penrose-act.js','endless-dream.js','chapters.js','square-act.js','course-run.js','road-mode.js'];
const ART={'lobby-trip':{src:'data:image/webp;base64,LOBBYTRIP'},'chapter-3':{src:'data:image/webp;base64,CHAPTER3'},'course-c1':{src:'data:image/webp;base64,COURSE1'},'pose-joy':{src:'data:image/webp;base64,JOY'},'pose-hurt':{src:'data:image/webp;base64,HURT'}};
/* The road module on a DOM-stub page with every chapter loaded. */
function page(o={}){
 const h=makeHost({square:true,restoration:true,...(o.host||{})}),ctx=h.ctx;
 ctx.MONGYU_POLISH_EDITION=true;ctx.MONGYU_UI_EDITION=true;ctx.MONGYU_EMBEDDED_ART=o.art||ART;
 let active=null;const started=[];
 ctx.MongyuPolish={on(){return()=>{}},emit(){},host:{startRun(run){active=run;started.push(run);return true},viewport:()=>({width:390,height:844}),settings:()=>({}),activeRun:()=>active}};
 for(const f of FILES)vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return {h,ctx,started,Road:ctx.MongyuRoad,Course:ctx.MongyuCourse,$:id=>h.doc.getElementById(id)};
}
const save=(h,n,stars=3)=>{const ids=Array.from({length:25},(_,i)=>'c'+(i+1)),cs={};ids.slice(0,n).forEach(id=>{cs[id]={g:stars===3?7:1,stars,best:2000,clears:1,plays:1,bestShards:5,bestProgress:1}});h.data.set('mongyu.r105.road',JSON.stringify({v:1,plays:n,last:ids[Math.max(0,n-1)],courses:cs}))};
const clearResult=(Course,id,o={})=>({mode:'road',state:'clear',courseId:id,name:'코스',score:3000,points:2800,bonus:200,time:45,attempt:1,actIndex:2,actCount:3,actName:'착시 다리',shards:10,shardTotal:10,deaths:0,perfects:5,bestStreak:4,progress:1,goals:[true,true,true],...o});
const tabs=p=>p.$('roadChapters').children;

test('unlocks run over all chapters: a course needs the previous one starred, a chapter opens when the previous last course is cleared', () => {
 const p=page(),{Road,h}=p;
 assert.equal(Road.courses().length,25);assert.equal(Road.chapters().length,5);
 assert.equal(Road.unlocked(0),true);assert.equal(Road.unlocked(5),false);assert.equal(Road.chapterUnlocked(0),true);assert.equal(Road.chapterUnlocked(1),false);
 save(h,4);assert.equal(Road.chapterUnlocked(1),false,'c4 cleared: c5 is open but chapter 2 is not');assert.equal(Road.unlocked(4),true);
 save(h,5);assert.equal(Road.chapterUnlocked(1),true);assert.equal(Road.unlocked(5),true);assert.equal(Road.unlocked(6),false);assert.equal(Road.chapterUnlocked(2),false);
 save(h,10);assert.equal(Road.chapterUnlocked(2),true);save(h,24);assert.equal(Road.chapterUnlocked(4),true);assert.equal(Road.unlocked(24),true);
 assert.equal(Road.totalStars(),24*3);assert.equal(Road.chapterStars(0),15);assert.equal(Road.chapterStars(4),12);
 // a single star is enough to pass on
 save(h,5,1);assert.equal(Road.chapterUnlocked(1),true);
});

test('MongyuRoad.nextCourseId(): first open course without a star, else the last cleared, across every chapter', () => {
 const p=page(),{Road,h}=p;
 assert.equal(Road.nextCourseId(),'c1');
 for(const [n,want] of [[1,'c2'],[4,'c5'],[5,'c6'],[7,'c8'],[10,'c11'],[19,'c20'],[24,'c25'],[25,'c25']]){save(h,n);assert.equal(Road.nextCourseId(),want,n+' cleared')}
 // a gap: c1 and c2 cleared, c3 not, c4 never played (locked) -> c3
 h.data.set('mongyu.r105.road',JSON.stringify({v:1,plays:2,last:'c2',courses:{c1:{stars:1,g:1},c2:{stars:2,g:3}}}));assert.equal(Road.nextCourseId(),'c3');
 // corrupt storage -> the first course
 h.data.set('mongyu.r105.road','{nope');assert.equal(Road.nextCourseId(),'c1');
});

test('road screen: chapter tabs with stars and locks, the chapter header (subtitle, monologue intro) and the five courses of the chapter', () => {
 const p=page(),{Road,h,$}=p;save(h,7);Road.open();
 assert.equal(tabs(p).length,5);assert.equal($('roadScreen').hidden,false);
 assert.equal(Road.view,1,'opens on the chapter of the next course (c8 is in chapter 2)');
 assert.equal($('roadHeading').textContent,'잊혀진 유년기');assert.equal($('roadScreen').dataset.chapter,'2');
 assert.equal($('roadList').children.length,5);assert.equal($('roadList').children[0].dataset.course,'c6');assert.equal($('roadList').children[4].dataset.course,'c10');
 const t=tabs(p);assert.equal(t[1].attrs['aria-selected'],'true');assert.equal(t[0].attrs['aria-selected'],'false');
 assert.equal(t[0].attrs['data-state'],'open');assert.equal(t[2].attrs['data-state'],'locked');assert.match(t[2].attrs['aria-label'],/^3장 불가능한 도시, 잠김\. 앞 장의 마지막 코스를 완주하면 열려요\.$/);
 assert.match(t[0].attrs['aria-label'],/^1장 자각몽의 정원, 별 15 \/ 15$/);assert.match(t[1].attrs['aria-label'],/^2장 잊혀진 유년기, 별 6 \/ 15$/);
 assert.equal($('roadChapterIntro').querySelector('.ch-sub').textContent,'작은 것들이 커 보이는 놀이터');assert.equal($('roadChapterIntro').querySelector('.ch-text').textContent,'나도 한때는 작았다.\n지금도 작다.');
 assert.equal($('roadSummary').textContent,'별 21 / 75  ·  다음 길은 아주 작은 집');
 // tab 5 of the 7 cleared courses: courses 6 and 7 done, 8 is open, 9 and 10 locked
 const states=Array.from($('roadList').children).map(n=>n.dataset.state);assert.deepEqual(states,['done','done','open','locked','locked']);
 // each node shows its number within the chapter
 assert.equal($('roadList').children[2].querySelector('i').textContent,'3');
});

test('a locked chapter stays selectable and says why; its first course explains the previous chapter must be finished', () => {
 const p=page(),{Road,h,$}=p;save(h,3);Road.open();assert.equal(Road.view,0);
 tabs(p)[2].click();assert.equal(Road.view,2);
 assert.equal($('roadHeading').textContent,'불가능한 도시');assert.equal($('roadChapterIntro').querySelector('.ch-lock').hidden,false);
 assert.match($('roadChapterIntro').querySelector('.ch-lock').textContent,/앞 장의 마지막 코스 「장난감 왕」를 완주하면 열려요/);
 assert.equal($('roadChapterIntro').querySelector('.ch-text').hidden,true,'a closed chapter keeps its intro a secret');
 const nodes=$('roadList').children;assert.ok(Array.from(nodes).every(n=>n.dataset.state==='locked'));
 assert.equal(nodes[0].querySelector('.rd-desc').textContent,'앞 장을 완주하면 열려요');assert.equal(nodes[1].querySelector('.rd-desc').textContent,'앞 코스를 완주하면 열려요');
 const start=p.started.length;nodes[0].querySelector('.rd-card').click();assert.equal(p.started.length,start,'a locked card does not start');
 // the chapter that just closed is the one before: tab 2 is locked too (c5 not cleared)
 assert.equal(tabs(p)[1].attrs['data-state'],'locked');assert.equal(Road.chapterUnlocked(1),false);
});

test('choosing a chapter and a course starts that course; swiping the list changes chapter; bounds are respected', () => {
 const p=page(),{Road,h,$}=p;save(h,12);Road.open();assert.equal(Road.view,2);
 tabs(p)[1].click();assert.equal(Road.view,1);
 $('roadList').children[1].querySelector('.rd-card').click();const run=p.started.at(-1);assert.equal(run.id,'c7');assert.equal(run.dreamMode,'road');assert.equal(run.bpm,88);
 assert.equal($('roadScreen').hidden,true);
 Road.open();assert.equal(Road.view,2);
 const sw=(dx,dy=0)=>{const s=$('roadScroll');s.dispatchEvent(event('touchstart',{touches:[{clientX:200,clientY:300}]}));s.dispatchEvent(event('touchend',{changedTouches:[{clientX:200+dx,clientY:300+dy}]}))};
 sw(-110);assert.equal(Road.view,3);sw(110);assert.equal(Road.view,2);sw(-20);assert.equal(Road.view,2,'a small drag does nothing');sw(-120,200);assert.equal(Road.view,2,'a vertical scroll is not a swipe');
 Road.selectChapter(0);sw(120);assert.equal(Road.view,0);Road.selectChapter(4);sw(-120);assert.equal(Road.view,4);assert.equal(Road.selectChapter(99),false);assert.equal(Road.view,4);Road.selectChapter(-5);assert.equal(Road.view,0);
});

test('backdrop: chapter-N art when present, else the dark lobby; course thumbnails fall back to the chapter art', () => {
 const p=page(),{Road,h,$}=p;save(h,10);Road.open();Road.selectChapter(1);
 const bg=()=>$('roadScreen').style.getPropertyValue?.('--r105-road-bg')||$('roadScreen').style['--r105-road-bg']||'';
 assert.match(bg(),/LOBBYTRIP/,'chapter 2 has no art yet');
 const img=i=>$('roadList').children[i].querySelector('.rd-thumb-img');assert.equal(img(0).src,ART['lobby-trip'].src);
 Road.selectChapter(2);assert.match(bg(),/CHAPTER3/);assert.equal($('roadList').children[0].querySelector('.rd-thumb-img').src,ART['chapter-3'].src);
 Road.selectChapter(0);assert.equal(img(0).src,ART['course-c1'].src,'no chapter-1 art yet: the course backdrop is used');assert.equal(img(1).src,ART['lobby-trip'].src);
 ART['chapter-1']={src:'data:image/webp;base64,CHAPTER1'};Road.render();assert.equal(img(0).src,ART['chapter-1'].src,'chapter art wins over course art');
 const accent=()=>$('roadScreen').style.getPropertyValue?.('--r105-ch')||$('roadScreen').style['--r105-ch'];
 assert.equal(accent(),p.ctx.MongyuTrip.get('c1').rim);Road.selectChapter(3);assert.equal(accent(),p.ctx.MongyuTrip.get('c4').rim);
 const bare=page({art:{}});bare.Road.open();assert.equal(bare.$('roadList').children.length,5);assert.equal(bare.$('roadList').children[0].querySelector('.rd-thumb-img'),null);
});

test('records stay compatible: c1-c5 keep their entries, new ids c6-c25 are added beside them; the next chapter opens on the chapter boundary', () => {
 const p=page(),{Road,Course,h}=p;
 h.data.set('mongyu.r105.road',JSON.stringify({v:1,plays:5,last:'c5',courses:{c1:{g:7,stars:3,best:4000,clears:2,plays:3,bestShards:14,bestProgress:1},c2:{g:3,stars:2,best:1,clears:1,plays:1,bestShards:1,bestProgress:1},memo:{x:1}}}));
 const before=JSON.parse(h.data.get('mongyu.r105.road')).courses;
 const rec=Road.record(clearResult(Course,'c5'));assert.equal(rec.firstClear,true);assert.equal(rec.unlockedNext.id,'c6');assert.equal(Road.unlocked(5),true);
 let d=JSON.parse(h.data.get('mongyu.r105.road'));assert.deepEqual(d.courses.c1,before.c1);assert.deepEqual(d.courses.c2,before.c2);assert.equal(d.courses.c5.stars,3);assert.equal(d.v,1);assert.equal(d.last,'c5');
 Road.record(clearResult(Course,'c6',{score:999}));d=JSON.parse(h.data.get('mongyu.r105.road'));assert.equal(d.courses.c6.best,999);assert.equal(d.courses.c6.stars,3);assert.deepEqual(d.courses.c1,before.c1);
 const f=Road.record({...clearResult(Course,'c25'),state:'fail',progress:.5,goals:[false,false,false]});assert.equal(f.unlockedNext,null);assert.equal(Road.entry(Road.read(),'c25').bestProgress,.5);
 assert.equal(Road.record(clearResult(Course,'c25')).unlockedNext,null,'the last course unlocks nothing');
});

test('result panel: chapter kicker, the chapter ending on its last course, next chapter button and unlock line', () => {
 const p=page(),{Road,Course,$}=p;Road.mount();
 const run=id=>({dreamMode:'road',id,name:Course.courseById(id).title,attempt:1,state:'clear',result:clearResult(Course,id),carries:[],actIndex:2});
 Road.onEnd(run('c6'));assert.equal($('roadResultKicker').textContent,'2장 · 빈 놀이터');assert.equal($('roadResultEnding').hidden,true);assert.equal($('roadPrimary').textContent,'다음 꿈 · 고무 길');
 Road.onEnd(run('c10'));assert.equal($('roadResultEnding').hidden,false);assert.equal($('roadResultEnding').textContent,'장난감 왕도 건전지가 나갔네.');
 assert.equal($('roadPrimary').textContent,'다음 장 · 불가능한 도시');assert.match($('roadResultDetail').textContent,/^새 장이 열렸어요 · 3장 불가능한 도시\n/);
 Road.onEnd(run('c5'));assert.equal($('roadResultEnding').textContent,'문이 열렸어. 우아함은 비밀이야.');assert.equal($('roadPrimary').textContent,'다음 장 · 잊혀진 유년기');
 Road.onEnd(run('c25'));assert.equal($('roadResultEnding').textContent,'출구는 처음부터 나였네.');assert.equal($('roadPrimary').textContent,'꿈의 길로');
 Road.onEnd({...run('c10'),state:'fail',result:clearResult(Course,'c10',{state:'fail',progress:.4})});assert.equal($('roadResultEnding').hidden,true,'no ending on a fail');
 Road.onEnd(run('c13'));assert.equal($('roadResultEnding').hidden,true,'only the last course of a chapter closes it');assert.equal($('roadResultKicker').textContent,'3장 · 뒤집힌 횡단보도');
});

test('every course starts from the road with its chapter data (trip, bpm, seed, items) and a CourseRun with the new acts', () => {
 const p=page(),{Road,Course,h}=p;save(h,25);
 for(const c of Course.allCourses()){
  const run=Road.newRun(c.id);assert.equal(run.id,c.id);assert.equal(run.bpm,c.bpm);assert.equal(run.acts.length,c.acts.length,c.id+' every act is available');assert.equal(run.usedFallback,false,c.id);
  run.start();assert.equal(run.child.chain.bpm,c.bpm);
  if(c.chapter>1){assert.equal(run.child.options.trip||run.child.trip,c.trip,c.id)}
 }
});
