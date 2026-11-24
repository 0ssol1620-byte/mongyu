const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {host:makeHost}=require('./host.cjs');
const SRC=path.resolve(__dirname,'..','src');
const ART={'course-c1':{src:'data:image/webp;base64,AAAA1'},'course-c2':{src:'data:image/webp;base64,AAAA2'},'course-c3':{src:'data:image/webp;base64,AAAA3'},'lobby-psy':{src:'data:image/webp;base64,LOBBY'},'pose-joy':{src:'data:image/webp;base64,JOY'},'pose-hurt':{src:'data:image/webp;base64,HURT'}};
/* The road module on a DOM-stub page with the UI edition flags, the embedded art table and the icon set. */
function page(o={}){
 const h=makeHost({square:true,restoration:true,...(o.host||{})}),ctx=h.ctx;
 ctx.MONGYU_POLISH_EDITION=true;ctx.MONGYU_UI_EDITION=o.ui!==false;if(o.art!==false)ctx.MONGYU_EMBEDDED_ART=o.art||ART;
 let active=null;const started=[];
 ctx.MongyuPolish={on(){return()=>{}},emit(){},host:{startRun(run){active=run;started.push(run);return true},viewport:()=>({width:390,height:844}),settings:()=>o.settings||{},activeRun:()=>active}};
 for(const f of ['ui-icons.js','opening-run.js','illusion-course.js','course-run.js','road-mode.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return {h,ctx,started,Road:ctx.MongyuRoad,Course:ctx.MongyuCourse,$:id=>h.doc.getElementById(id)};
}
const seed=(h,courses)=>h.data.set('mongyu.r105.road',JSON.stringify({v:1,plays:3,last:'c1',courses}));
const text=n=>n.textContent||'';
const walk=(n,fn)=>{fn(n);for(const c of n.children||[])walk(c,fn)};
const clearResult=(Course,o={})=>({mode:'road',state:'clear',courseId:'c1',name:'첫 걸음',score:3000,points:2800,bonus:200,time:45,attempt:1,actIndex:2,actCount:3,actName:'착시 다리',shards:14,shardTotal:14,deaths:0,perfects:5,bestStreak:4,progress:1,...o});

test('course cards: thumbnail art, stars as icons, lock icon on locked courses, done badge', () => {
 const p=page();seed(p.h,{c1:{g:7,stars:3,best:3000,clears:1,plays:1,bestShards:14,bestProgress:1},c2:{g:1,stars:1,best:1200,clears:1,plays:1,bestShards:3,bestProgress:1}});
 p.Road.mount();p.Road.open();
 const nodes=p.$('roadList').children;assert.equal(nodes.length,5);
 const img=n=>n.querySelector('.rd-thumb-img');
 assert.equal(img(nodes[0]).attrs.src||img(nodes[0]).src,ART['course-c1'].src);assert.equal(img(nodes[2]).src,ART['course-c3'].src);
 assert.equal(img(nodes[3]).src,ART['lobby-psy'].src,'a course without its own backdrop falls back to the lobby art');
 // locked: lock icon (MongyuIcons), dimmed thumb, not clickable
 for(const i of [3,4]){assert.equal(nodes[i].dataset.state,'locked');assert.match(nodes[i].querySelector('.rd-lock').innerHTML,/<svg/);assert.equal(nodes[i].querySelector('.rd-card').attrs['aria-disabled'],'true')}
 assert.equal(nodes[2].dataset.state,'open');assert.equal(nodes[2].querySelector('.rd-lock'),null);
 assert.match(nodes[0].querySelector('.rd-done').innerHTML,/<svg/);
 const stars=n=>n.querySelectorAll('.rd-s');assert.equal(stars(nodes[0]).length,3);assert.ok(stars(nodes[0]).every(s=>/<svg/.test(s.innerHTML)));
 assert.equal(stars(nodes[1]).filter(s=>s.attrs['data-on']==='true').length,1)});

test('road screen uses the lobby art as its backdrop and still renders without any art', () => {
 const p=page();p.Road.mount();assert.match(p.$('roadScreen').style.getPropertyValue?.('--r105-road-bg')||p.$('roadScreen').style['--r105-road-bg']||'',/LOBBY/);
 const bare=page({art:false});bare.Road.mount();bare.Road.open();
 const nodes=bare.$('roadList').children;assert.equal(nodes.length,5);assert.equal(nodes[0].querySelector('.rd-thumb-img'),null);assert.equal(bare.$('roadScreen').hidden,false)});

test('result panel: pose-joy and a one-line headline on a clear, pose-hurt on a fail', () => {
 const p=page(),{Road,Course,$}=p;Road.mount();
 const run={dreamMode:'road',id:'c1',name:'첫 걸음',attempt:1,state:'clear',result:clearResult(Course),carries:[],actIndex:2};
 Road.onEnd(run);
 const img=document=>$('roadResult').querySelector('.road-portrait-img');
 assert.equal(img().src,ART['pose-joy'].src);assert.equal(img().hidden,false);assert.equal(img().dataset.pose,'joy');
 assert.equal($('roadResultHeading').textContent,'빛의 문이 열렸어');assert.equal($('roadResultKicker').textContent,'1장 · 첫 걸음');
 assert.equal($('roadResultStars').hidden,false);
 const fail={...run,state:'fail',result:clearResult(Course,{state:'fail',score:540,progress:.38,actIndex:1,shards:3,shardTotal:5,deaths:1})};
 Road.onEnd(fail);
 assert.equal(img().src,ART['pose-hurt'].src);assert.equal(img().dataset.pose,'hurt');assert.equal($('roadResultHeading').textContent,'꿈이 접혔네');
 assert.equal($('roadResultStars').hidden,true);assert.equal($('roadPrimary').textContent,'이 구간부터 다시');
 assert.match($('roadResultDetail').textContent,/^착시 다리에서 길이 끊겼어요\n길의 38% · 빛 조각 3개/);
 // no portrait art: the panel still works
 const bare=page({art:false});bare.Road.mount();bare.Road.onEnd({...run,result:clearResult(bare.Course)});
 assert.equal(bare.$('roadResult').querySelector('.road-portrait-img').hidden,true);assert.equal(bare.$('roadResultHeading').textContent,'빛의 문이 열렸어')});

test('result layout contract: portrait first, sheet last, share buttons are labelled icon buttons, three goal chips', () => {
 const p=page(),{Road,Course,$}=p;Road.mount();
 const panel=$('roadResult'),kids=panel.children.map(c=>c.className.split(' ')[0]);
 assert.deepEqual(kids.filter(k=>['road-share','road-portrait','box','dream-note'].includes(k)),['road-share','road-portrait','box','dream-note']);
 assert.equal($('roadPoster').attrs['aria-label'],'포스터 저장');assert.equal($('roadClip').attrs['aria-label'],'영상 저장');
 assert.match($('roadPoster').innerHTML,/<svg/);
 assert.equal($('roadResult').querySelector('.road-goals').children.length,3);
 Road.onEnd({dreamMode:'road',id:'c1',name:'첫 걸음',attempt:1,state:'clear',result:clearResult(Course,{shards:14,deaths:0,goals:Course.goals({state:'clear',shards:14,shardTotal:14,deaths:0})}),carries:[],actIndex:2});
 assert.deepEqual(panel.querySelector('.road-goals').children.map(n=>n.textContent),['끝까지 가기','빛 조각 모으기','안 부딪히기'])});

test('voice: the result and road copy has no developer words or 3rd-person narration', () => {
 const p=page(),{Road,Course,$}=p;Road.mount();Road.open();
 const bad=/실행|허용|활성|세션|리셋|했다\.?$|이다\.?$/;
 const lines=[];walk($('roadScreen'),n=>{if(n.children?.length===0&&text(n))lines.push(text(n))});
 for(const [state,extra] of [['clear',{}],['fail',{state:'fail',progress:.4,actIndex:1}]]){
  Road.onEnd({dreamMode:'road',id:'c1',name:'첫 걸음',attempt:1,state,result:clearResult(Course,{state,...extra}),carries:[{points:10,bonus:0}],actIndex:1});
  walk($('roadResult'),n=>{if(n.children?.length===0&&text(n))lines.push(text(n))});
 }
 Road.onEnd({dreamMode:'road',id:'c1',name:'첫 걸음',attempt:1,state:'clear',result:clearResult(Course),carries:[],actIndex:2});
 // a failed save speaks in the system voice
 const blocked=page({host:{blockedWrite:true}});blocked.Road.mount();blocked.Road.onEnd({dreamMode:'road',id:'c1',name:'첫 걸음',attempt:1,state:'clear',result:clearResult(blocked.Course),carries:[],actIndex:2});
 lines.push(blocked.$('roadResultDetail').textContent);
 assert.match(blocked.$('roadResultDetail').textContent,/기록을 저장하지 못했어요\. 이번 플레이에만 남아요\./);
 for(const l of lines.flatMap(x=>x.split('\n')))assert.doesNotMatch(l,bad,l)});

test('English: every road and result line translates fully (no half-English strings)', () => {
 const ctx={MONGYU_UI_EDITION:true,console,performance:{now:()=>0},navigator:{language:'en'}};vm.createContext(ctx);
 for(const f of ['i18n.js','i18n-en.js','i18n-en-psy.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 const T=ctx.MongyuI18n,Course=(()=>{const c={MONGYU_POLISH_EDITION:true,console};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(SRC,'course-run.js'),'utf8'),c);return c.MongyuCourse})();
 const lines=['새벽 계단의 탑','1장','1장 · 첫 걸음','별 5 / 15  ·  다음 길은 거울 정원','별 15 / 15  ·  모든 길을 걸었어요','앞 코스를 완주하면 열려요','3구간 · 약 45초','최고 3,120','도전 42%','별 2 / 3','첫 걸음, 잠김. 앞 코스를 완주하면 열려요.',
  '빛의 문이 열렸어','꿈이 접혔네','새 최고 기록','끝까지 가기','빛 조각 모으기','안 부딪히기','오로라의 문을 지났어요\n빛 조각 12 / 14 · 넘어짐 1번 · 완벽 ×5','새 길이 열렸어요 · 올라가는 길','최고 3,120점 · 별 3 / 3',
  '빛 조각 14 / 14 · 한 번도 안 넘어졌어요','착시 다리에서 길이 끊겼어요\n길의 38% · 빛 조각 3개 · 이 구간은 1,200점부터','다음 꿈 · 거울 정원','꿈의 길로','이 구간부터 다시','처음부터','다시 달리기','포스터 저장','영상 저장',
  '기록을 저장하지 못했어요. 이번 플레이에만 남아요.','포스터를 만드는 중…','영상을 저장했어요.','면 갈아타기에서 길이 끊겼어요',...Course.CHAPTER1.courses.flatMap(c=>[c.title,c.subtitle])];
 for(const l of lines){const r=T.translate(l,'en');assert.ok(r!==null&&!/[가-힣]/.test(r),'translates: '+l+' -> '+r)}
 assert.equal(T.translate('빛의 문이 열렸어','en'),'The gate of light opened')});
