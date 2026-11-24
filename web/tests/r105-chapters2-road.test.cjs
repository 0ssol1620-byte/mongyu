const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {host:makeHost,event}=require('./host.cjs');
const SRC=path.resolve(__dirname,'..','src');
const FILES=['ui-icons.js','trip-palettes.js','items.js','opening-run.js','illusion-course.js','helix-act.js','penrose-act.js','endless-dream.js','chapters.js','square-act.js','eye-act.js','liquid-act.js','rhythm-act.js','course-run.js','road-mode.js'];
const ART={'lobby-trip':{src:'data:image/webp;base64,LOBBYTRIP'},'trip-heart':{src:'data:image/webp;base64,TRIPHEART'},'trip-aqua':{src:'data:image/webp;base64,TRIPAQUA'},'trip-toxic':{src:'data:image/webp;base64,TRIPTOXIC'},'chapter-1':{src:'data:image/webp;base64,CHAPTER1'},'pose-joy':{src:'data:image/webp;base64,JOY'},'pose-hurt':{src:'data:image/webp;base64,HURT'}};
function page(o={}){
 const h=makeHost({square:true,restoration:true}),ctx=h.ctx;
 ctx.MONGYU_POLISH_EDITION=true;ctx.MONGYU_UI_EDITION=true;ctx.MONGYU_EMBEDDED_ART=o.art||ART;
 let active=null;const started=[];
 ctx.MongyuPolish={on(){return()=>{}},emit(){},host:{startRun(run){active=run;started.push(run);return true},viewport:()=>({width:390,height:844}),settings:()=>({}),activeRun:()=>active}};
 for(const f of FILES)vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return {h,ctx,started,Road:ctx.MongyuRoad,Course:ctx.MongyuCourse,$:id=>h.doc.getElementById(id)};
}
const IDS=Array.from({length:50},(_,i)=>'c'+(i+1));
const save=(h,n,stars=3)=>{const cs={};IDS.slice(0,n).forEach(id=>{cs[id]={g:stars===3?7:1,stars,best:2000,clears:1,plays:1,bestShards:5,bestProgress:1}});h.data.set('mongyu.r105.road',JSON.stringify({v:1,plays:n,last:IDS[Math.max(0,n-1)],courses:cs}))};
const clearResult=(id,o={})=>({mode:'road',state:'clear',courseId:id,name:'코스',score:3000,points:2800,bonus:200,time:45,attempt:1,actIndex:2,actCount:3,actName:'시선',shards:10,shardTotal:10,deaths:0,perfects:5,bestStreak:4,progress:1,goals:[true,true,true],...o});
const tabs=p=>p.$('roadChapters').children;

test('ten chapters, fifty courses: unlocks cross every chapter boundary and nextCourseId keeps working', () => {
 const p=page(),{Road,h}=p;
 assert.equal(Road.courses().length,50);assert.equal(Road.chapters().length,10);
 for(const n of [5,10,15,20,25,30,35,40,45]){save(h,n-1);assert.equal(Road.chapterUnlocked(n/5),false,'chapter '+(n/5+1)+' stays closed while the last course of the one before is open but not cleared');save(h,n);assert.equal(Road.chapterUnlocked(n/5),true);assert.equal(Road.unlocked(n),true);assert.equal(Road.unlocked(n+1),false)}
 save(h,50);assert.equal(Road.totalStars(),150);assert.equal(Road.chapterStars(9),15);assert.equal(Road.chapterStars(5),15);
 assert.equal(Road.nextCourseId(),'c50','everything cleared: the last course');
 for(const [n,want] of [[0,'c1'],[25,'c26'],[29,'c30'],[30,'c31'],[34,'c35'],[35,'c36'],[44,'c45'],[45,'c46'],[49,'c50'],[50,'c50']]){if(n===0)h.data.delete('mongyu.r105.road');else save(h,n);assert.equal(Road.nextCourseId(),want,n+' cleared')}
 h.data.set('mongyu.r105.road',JSON.stringify({v:1,plays:2,last:'c27',courses:{c25:{stars:1,g:1},c26:{stars:3,g:7},c27:{stars:1,g:1}}}));assert.equal(Road.nextCourseId(),'c1','a gap early in the list keeps the first unfinished course');
});

test('road screen: ten chapter tabs with stars and locks scroll sideways; the chapter header and the five courses of chapters 6-10', () => {
 const p=page(),{Road,h,$}=p;save(h,27);Road.open();
 assert.equal(tabs(p).length,10);assert.equal(Road.view,5,'opens on the chapter of the next course (c28 is in chapter 6)');
 assert.equal($('roadHeading').textContent,'누군가 보고 있다');assert.equal($('roadScreen').dataset.chapter,'6');
 assert.deepEqual(Array.from($('roadList').children,n=>n.dataset.course),['c26','c27','c28','c29','c30']);
 assert.deepEqual(Array.from($('roadList').children,n=>n.dataset.state),['done','done','open','locked','locked']);
 const t=tabs(p);assert.deepEqual(Array.from(t,x=>x.attrs['data-chapter']),['1','2','3','4','5','6','7','8','9','10']);
 assert.equal(t[5].attrs['aria-selected'],'true');assert.equal(t[6].attrs['data-state'],'locked');assert.match(t[9].attrs['aria-label'],/^10장 각성, 잠김\. 앞 장의 마지막 코스를 완주하면 열려요\.$/);
 assert.match(t[5].attrs['aria-label'],/^6장 누군가 보고 있다, 별 6 \/ 15$/);
 assert.equal($('roadChapterIntro').querySelector('.ch-sub').textContent,'눈이 감길 때만 움직이는 무대');assert.equal($('roadChapterIntro').querySelector('.ch-text').textContent,'누가 보고 있나 봐.\n눈치 좀 봐야겠는걸.');
 assert.equal($('roadSummary').textContent,'별 '+27*3+' / 150  ·  다음 길은 관객');
 // a locked chapter far ahead says which course opens it
 tabs(p)[9].click();assert.equal(Road.view,9);assert.match($('roadChapterIntro').querySelector('.ch-lock').textContent,/앞 장의 마지막 코스 「공허」를 완주하면 열려요/);assert.equal($('roadChapterIntro').querySelector('.ch-text').hidden,true);
 for(const i of [6,7,8,9]){Road.selectChapter(i);assert.equal($('roadList').children.length,5);assert.equal($('roadScreen').dataset.chapter,String(i+1))}
 assert.equal(Road.selectChapter(10),false);assert.equal(Road.view,9);
});

test('swiping moves through all ten chapters and stops at both ends', () => {
 const p=page(),{Road,h,$}=p;save(h,50);Road.open();assert.equal(Road.view,9);
 const sw=(dx)=>{const s=$('roadScroll');s.dispatchEvent(event('touchstart',{touches:[{clientX:200,clientY:300}]}));s.dispatchEvent(event('touchend',{changedTouches:[{clientX:200+dx,clientY:300}]}))};
 sw(-120);assert.equal(Road.view,9);for(let i=0;i<9;i++)sw(120);assert.equal(Road.view,0);sw(120);assert.equal(Road.view,0);for(let i=0;i<9;i++)sw(-120);assert.equal(Road.view,9);
});

test('backdrop: chapters 6-10 use their own chapter-N art when it exists, else a themed dark trip image, else chapter 1', () => {
 const art={...ART},p=page({art}),{Road,h,$}=p;save(h,50);Road.open();
 const bg=()=>$('roadScreen').style.getPropertyValue?.('--r105-road-bg')||$('roadScreen').style['--r105-road-bg']||'';
 Road.selectChapter(5);assert.match(bg(),/TRIPHEART/);Road.selectChapter(6);assert.match(bg(),/TRIPAQUA/);Road.selectChapter(7);assert.match(bg(),/TRIPTOXIC/);Road.selectChapter(8);assert.match(bg(),/LOBBYTRIP/);Road.selectChapter(9);assert.match(bg(),/CHAPTER1/);
 art['chapter-6']={src:'data:image/webp;base64,CHAPTER6'};Road.selectChapter(5);Road.render();assert.match(bg(),/CHAPTER6/,'generated chapter art wins');assert.equal($('roadList').children[0].querySelector('.rd-thumb-img').src,art['chapter-6'].src);
 const accent=()=>$('roadScreen').style.getPropertyValue?.('--r105-ch')||$('roadScreen').style['--r105-ch'];Road.selectChapter(7);assert.equal(accent(),p.ctx.MongyuTrip.get('c8').rim);
});

test('records stay compatible and the result panel closes each new chapter with its ending line', () => {
 const p=page(),{Road,Course,h,$}=p;
 h.data.set('mongyu.r105.road',JSON.stringify({v:1,plays:3,last:'c25',courses:{c1:{g:7,stars:3,best:4000,clears:2,plays:3,bestShards:14,bestProgress:1},c25:{g:1,stars:1,best:10,clears:1,plays:1,bestShards:1,bestProgress:1}}}));
 const before=JSON.parse(h.data.get('mongyu.r105.road')).courses;
 const rec=Road.record(clearResult('c26'));assert.equal(rec.firstClear,true);assert.equal(rec.unlockedNext.id,'c27');
 let d=JSON.parse(h.data.get('mongyu.r105.road'));assert.deepEqual(d.courses.c1,before.c1);assert.deepEqual(d.courses.c25,before.c25);assert.equal(d.courses.c26.stars,3);assert.equal(d.v,1);
 assert.equal(Road.record(clearResult('c50')).unlockedNext,null,'the last course unlocks nothing');
 Road.mount();const run=id=>({dreamMode:'road',id,name:Course.courseById(id).title,attempt:1,state:'clear',result:clearResult(id),carries:[],actIndex:2});
 Road.onEnd(run('c26'));assert.equal($('roadResultKicker').textContent,'6장 · 눈치');assert.equal($('roadResultEnding').hidden,true);assert.equal($('roadPrimary').textContent,'다음 꿈 · 스포트라이트');
 const ends={c30:['눈이 쉬러 갔네. 나도 쉬자.','다음 장 · 액체 왕'],c35:['액체 왕이 컵에 들어갔네.','다음 장 · 첫 박자'],c40:['음악 끝에 서로 인사했어.','다음 장 · 한 줄'],c45:['선 하나가 별이 됐네.','다음 장 · 돌아온 정원'],c50:['문이 열렸네. 밥 먹을래?','꿈의 길로']};
 void ends;
 Road.onEnd(run('c30'));assert.equal($('roadResultEnding').textContent,'눈이 쉬러 갔네. 나도 쉬자.');assert.equal($('roadPrimary').textContent,'다음 장 · 녹아내리는 현실');assert.match($('roadResultDetail').textContent,/^새 장이 열렸어요 · 7장 녹아내리는 현실\n/);
 Road.onEnd(run('c35'));assert.equal($('roadResultEnding').textContent,'액체 왕이 컵에 들어갔네.');assert.equal($('roadPrimary').textContent,'다음 장 · 색채의 섬망');
 Road.onEnd(run('c40'));assert.equal($('roadResultEnding').textContent,'음악 끝에 서로 인사했어.');assert.equal($('roadPrimary').textContent,'다음 장 · 절대적인 무');
 Road.onEnd(run('c45'));assert.equal($('roadResultEnding').textContent,'선 하나가 별이 됐네.');assert.equal($('roadPrimary').textContent,'다음 장 · 각성');
 Road.onEnd(run('c50'));assert.equal($('roadResultEnding').textContent,'문이 열렸네. 밥 먹을래?');assert.equal($('roadPrimary').textContent,'꿈의 길로');
 Road.onEnd({...run('c30'),state:'fail',result:clearResult('c30',{state:'fail',progress:.4})});assert.equal($('roadResultEnding').hidden,true,'no ending on a fail');
});

test('every new course starts from the road with its chapter data and a CourseRun with the new acts (no fallback needed)', () => {
 const p=page(),{Road,Course,h}=p;save(h,50);
 for(const c of Course.allCourses().slice(25)){
  const run=Road.newRun(c.id);assert.equal(run.id,c.id);assert.equal(run.bpm,c.bpm);assert.equal(run.acts.length,c.acts.length,c.id+' every act is available');assert.equal(run.usedFallback,false,c.id);
  run.start();assert.equal(run.child.chain.bpm,c.bpm);assert.equal(run.child.options.trip||run.child.trip,c.trip,c.id);
 }
 const bare=Road.newRun('c30');assert.deepEqual(Array.from(bare.acts,a=>a.type),['eye','eye','floor-wall','eye']);
});

test('the road screen CSS keeps the tab row scrollable with a soft edge', () => {
 const css=fs.readFileSync(path.resolve(__dirname,'..','css','r104-road.css'),'utf8');
 assert.match(css,/\.r105-chapter-tabs\{[^}]*overflow-x:auto[^}]*mask-image:linear-gradient/);
});
