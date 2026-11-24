const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {host:makeHost}=require('./host.cjs');
const SRC=path.resolve(__dirname,'..','src');
/* A DOM-stub page (host.cjs) with the course + road modules loaded and a recording MongyuPolish host. */
function page(extra={}){
 const h=makeHost({square:true,restoration:true,...extra}),ctx=h.ctx,started=[];
 ctx.MONGYU_POLISH_EDITION=true;
 let active=null;
 ctx.MongyuPolish={on(){return()=>{}},emit(){},host:{startRun(run){active=run;started.push(run);return true},viewport:()=>({width:390,height:844}),settings:()=>extra.settings||{},activeRun:()=>active}};
 for(const f of ['opening-run.js','illusion-course.js','course-run.js','road-mode.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return {h,ctx,started,Road:ctx.MongyuRoad,Course:ctx.MongyuCourse,$:id=>h.doc.getElementById(id),setActive:r=>{active=r}};
}
const plain=x=>JSON.parse(JSON.stringify(x));
const clearResult=(Course,id,o={})=>({mode:'road',state:'clear',courseId:id,name:'코스',score:3000,points:2800,bonus:200,time:45,attempt:1,actIndex:2,actCount:3,actName:'착시 다리',shards:o.shards??14,shardTotal:14,deaths:o.deaths??0,perfects:5,bestStreak:4,progress:1,goals:Course.goals({state:'clear',shards:o.shards??14,shardTotal:14,deaths:o.deaths??0}),...o});

test('stars: clear, every light shard, no failure', () => {
 const {Course}=page();
 assert.deepEqual(plain(Course.goals({state:'clear',shards:14,shardTotal:14,deaths:0})),[true,true,true]);
 assert.equal(Course.stars({state:'clear',shards:13,shardTotal:14,deaths:0}),2);
 assert.equal(Course.stars({state:'clear',shards:14,shardTotal:14,deaths:2}),2);
 assert.equal(Course.stars({state:'clear',shards:0,shardTotal:14,deaths:1}),1);
 assert.equal(Course.stars({state:'fail',shards:14,shardTotal:14,deaths:0}),0)});

test('unlocks: course n+1 opens once n has a star; records persist under mongyu.r105.road', () => {
 const {Road,Course,h}=page();
 assert.equal(Road.KEY,'mongyu.r105.road');
 assert.equal(Road.unlocked(0),true);assert.equal(Road.unlocked(1),false);
 const rec=Road.record(clearResult(Course,'c1'));
 assert.equal(rec.firstClear,true);assert.equal(rec.stars,3);assert.equal(rec.unlockedNext.id,'c2');assert.equal(rec.saved,true);
 assert.equal(Road.unlocked(1),true);assert.equal(Road.unlocked(2),false);
 const saved=JSON.parse(h.data.get('mongyu.r105.road'));assert.equal(saved.courses.c1.stars,3);assert.equal(saved.courses.c1.best,3000);
 // a worse clear never lowers stars or best; goals merge across runs
 const worse=Road.record(clearResult(Course,'c1',{score:1000,shards:10,deaths:2,goals:[true,false,false]}));
 assert.equal(worse.stars,3);assert.equal(worse.best,3000);assert.equal(worse.newBest,false);
 assert.equal(Road.totalStars(),3);
 // a failed run records the attempt and the furthest progress only
 const f=Road.record({...clearResult(Course,'c2'),state:'fail',score:500,progress:.4,goals:[false,false,false]});
 assert.equal(f.stars,0);assert.equal(Road.entry(Road.read(),'c2').bestProgress,.4);assert.equal(Road.unlocked(2),false)});

test('a better score on a finished course is flagged as a new best only after a first record', () => {
 const {Road,Course}=page();
 assert.equal(Road.record(clearResult(Course,'c1',{score:100})).newBest,false);
 assert.equal(Road.record(clearResult(Course,'c1',{score:200})).newBest,true)});

test('corrupt or blocked storage falls back to an empty, playable road', () => {
 const {Road,h}=page();
 h.data.set('mongyu.r105.road','{not json');assert.deepEqual(plain(Road.read().courses),{});assert.equal(Road.unlocked(0),true);
 h.data.set('mongyu.r105.road',JSON.stringify({v:9,courses:5}));assert.deepEqual(plain(Road.read().courses),{});
 const b=page({blockedWrite:true});const rec=b.Road.record(clearResult(b.Course,'c1'));assert.equal(rec.saved,false);assert.equal(rec.stars,3)});

test('campaign screen lists five courses, locks all but the first, starts a CourseRun through the host', () => {
 const p=page(),{Road,started,$}=p;
 Road.mount();assert.ok(Road.open());
 const screen=$('roadScreen');assert.equal(screen.hidden,false);
 const nodes=$('roadList').children;assert.equal(nodes.length,5);
 assert.deepEqual(plain(nodes.map(n=>n.dataset.state)),['open','locked','locked','locked','locked']);
 // locked cards do nothing
 nodes[1].querySelector('.rd-card').click();assert.equal(started.length,0);
 nodes[0].querySelector('.rd-card').click();
 assert.equal(started.length,1);const run=started[0];
 assert.equal(run.dreamMode,'road');assert.equal(run.id,'c1');assert.equal(run.mode,'dream');assert.equal(screen.hidden,true);
 assert.equal(typeof run.drawSelf,'function')});

test('road screen reflects stars and the next open course', () => {
 const p=page(),{Road,Course,$}=p;
 Road.record(clearResult(Course,'c1'));Road.record(clearResult(Course,'c2',{shards:10,goals:[true,false,true]}));
 Road.mount();Road.open();
 const nodes=$('roadList').children;
 assert.deepEqual(plain(nodes.map(n=>n.dataset.state)),['done','done','open','locked','locked']);
 assert.match($('roadSummary').textContent,/별 5 \/ 15/);assert.match($('roadSummary').textContent,/거울 정원/);
 const lit=n=>n.querySelectorAll('.rd-s').filter(s=>s.attrs['data-on']==='true').length;
 assert.equal(lit(nodes[0]),3);assert.equal(lit(nodes[1]),2)});

test('result panel: clear shows stars and the next course; fail offers a checkpoint restart', () => {
 const p=page(),{Road,Course,started,$,ctx}=p;
 Road.mount();
 const run={dreamMode:'road',id:'c1',name:'첫 걸음',attempt:1,state:'clear',result:clearResult(Course,'c1'),carries:[],actIndex:2};
 Road.onEnd(run);
 const panel=$('roadResult');assert.equal(panel.hidden,false);
 assert.equal($('roadResultHeading').textContent,'빛의 문이 열렸어');assert.match($('roadPrimary').textContent,/다음 꿈/);assert.match($('roadResultDetail').textContent,/새 길이 열렸어요/);
 assert.equal($('dreamResult')?.hidden??true,true);
 $('roadPrimary').click();assert.equal(started.at(-1).id,'c2');assert.equal(panel.hidden,true);
 // fail
 const failing=new Course.CourseRun({...Course.courseById('c1'),viewport:{width:390,height:844},settings:{},attempt:1});failing.start();let tapped=false;
 for(let i=0;i<120*60&&failing.state==='play';i++){if(!tapped&&failing.child.slowChance==='active'){tapped=true;failing.action()}failing.tick(1/120)}
 assert.equal(failing.state,'fail');
 Road.onEnd(failing);
 assert.equal($('roadResultHeading').textContent,'꿈이 접혔네');assert.match($('roadResultDetail').textContent,/길이 끊겼어요/);assert.equal($('roadPrimary').textContent,'이 구간부터 다시');
 $('roadPrimary').click();const again=started.at(-1);assert.equal(again.actIndex,0);assert.equal(again.attempt,2);assert.equal(again.deaths,1);
 assert.equal(Road.read().courses.c1.stars,3)});

test('count-up and stars appear instantly under reduced motion', () => {
 const p=page({settings:{reduced:true}}),{Road,Course,$}=p;
 Road.mount();Road.onEnd({dreamMode:'road',id:'c1',name:'첫 걸음',attempt:1,state:'clear',result:clearResult(Course,'c1',{score:4321}),carries:[],actIndex:2});
 assert.equal($('roadResultScore').textContent,'4,321');
 assert.equal($('roadResult').dataset.reduced,'true');
 assert.deepEqual(plain($('roadResultStars').children.map(n=>n.dataset.on)),['true','true','true'])});

test('play-modes routes road runs: title button, retry and dream result stay out of the way', () => {
 const p=page(),{ctx,h,$}=p;
 const src=fs.readFileSync(path.join(SRC,'play-modes.js'),'utf8');
 ctx.document.documentElement.dataset.polishEdition='true';
 const actions=ctx.document.createElement('div');ctx.document.body.appendChild(actions);actions.prepend=n=>actions.appendChild(n);const q=ctx.document.querySelector;ctx.document.querySelector=sel=>sel.includes('.title-actions')?actions:q(sel);
 const mo=$('motion');if(mo&&mo.parentNode&&!mo.parentNode.insertBefore)mo.parentNode.insertBefore=(n)=>mo.parentNode.appendChild(n);
 vm.runInContext(src,ctx,{filename:'play-modes.js'});
 const M=ctx.MongyuModes;M.mount();
 const btn=$('dreamRoadOpen');assert.ok(btn,'title button exists');assert.equal(btn.textContent,'꿈의 길');
 btn.click();assert.equal($('roadScreen').hidden,false);
 // a finished road run opens the road panel, not the dream panel
 const run=new p.Course.CourseRun({...p.Course.courseById('c1'),viewport:{width:390,height:844},settings:{},attempt:1});
 assert.equal(M.isDream(run),true)});
