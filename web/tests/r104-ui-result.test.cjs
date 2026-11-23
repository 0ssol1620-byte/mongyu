// R104 phase 2 (workstream G): result count-up + stars, fail-screen tap retry, story fast-forward and memory bridges in restoration-ui.js.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const BUTTONS=new Set(['restorationSceneNext','restorationSceneSkip','restorationSceneAction','squareNext','squareRetry','squareCollection','squareRestart','squareHome','squarePractice','restorationStart','restorationClose','restorationOpen']);
function dom(){
 const ids=new Map();
 function element(tag='div',id=''){
  let own='';const e={tagName:tag.toUpperCase(),id,hidden:false,disabled:false,dataset:{},attrs:{},children:[],parentNode:null,className:'',handlers:{},width:720,height:320,value:'',innerHTML:'',
   style:{setProperty(k,v){this[k]=v}},
   get textContent(){return this.children.length?this.children.map(c=>c.textContent).join(''):own},
   set textContent(v){this.children=[];own=String(v)},
   setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},
   addEventListener(k,f){(this.handlers[k]??=[]).push(f)},
   appendChild(x){x.parentNode=this;this.children.push(x);return x},append(...xs){xs.forEach(x=>this.appendChild(x))},
   replaceChildren(...xs){this.children=[];own='';xs.forEach(x=>this.appendChild(x))},
   after(x){if(this.parentNode)this.parentNode.appendChild(x)},
   focus(){doc.activeElement=this},querySelector(){return null},
   closest(sel){const tags=sel.split(',').map(s=>s.trim().toUpperCase());let p=this;while(p){if(tags.includes(p.tagName))return p;p=p.parentNode}return null},
   getContext(){return new Proxy({},{get:()=>()=>({addColorStop(){}})})}
  };
  e.classList={add:c=>{const a=new Set(e.className.split(' ').filter(Boolean));a.add(c);e.className=[...a].join(' ')},contains:c=>e.className.split(' ').includes(c)};
  return e;
 }
 const doc={activeElement:null,body:element('body'),documentElement:{dataset:{}},createElement:t=>element(t),
  getElementById(id){if(!ids.has(id)){const e=element(BUTTONS.has(id)?'button':'div',id);ids.set(id,e);if(id.startsWith('restorationScene')&&id!=='restorationScene')doc.getElementById('restorationScene').appendChild(e);if(id.startsWith('square')&&id!=='squareResult')doc.getElementById('squareResult').appendChild(e)}return ids.get(id)}};
 return doc;
}
function boot({polish=true,reduced=false,storage,openAll=false}={}){
 const doc=dom(),data=storage||new Map(),started=[];let dialog=null,reducedFlag=reduced;
 const ctx={console,structuredClone,MONGYU_DREAM_EDITION:true,MONGYU_STAGE_EDITION:true,MONGYU_STAGE_HUD:true,MONGYU_POLISH_EDITION:polish,QuadRiftRestoration:{BOSS_RULES:[],BOSS_SLOTS:[],RestorationRun:class{constructor(o){this.options=o;this.slot=o.slot;this.mode='restoration';this.attempt=o.attempt;this.state='play'}}}};
 vm.createContext(ctx);
 for(const f of ['restoration-catalog.js','restoration-story-graph.js','restoration-mastery.js','opening-run.js','restoration-ui.js']){
  if(f==='restoration-ui.js'&&openAll)ctx.MongyuRestorationCatalog=Object.freeze({...ctx.MongyuRestorationCatalog,unlocked:()=>true});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',f),'utf8'),ctx,{filename:f});
 }
 const host={document:doc,storage:{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)},
  viewport:()=>({width:390,height:844}),reduced:()=>reducedFlag,dialog:()=>dialog,openDialog:name=>{dialog=name},closeDialog:()=>{dialog=null},
  startRun:(run,event)=>{dialog=null;started.push(run);if(run.state!=='play')run.state='play'},activeRun:()=>started.at(-1)||null,refresh(){},resumeRun(){}};
 const ui=ctx.MongyuRestorationUI.mount(host),$=id=>doc.getElementById(id);
 const fire=(node,type,event={})=>{for(const f of node.handlers[type]||[])f({type,target:node,isTrusted:true,isPrimary:true,button:0,preventDefault(){},...event})};
 const tap=(target=$('restorationScene'))=>fire($('restorationScene'),'click',{target});
 return {ui,$,tap,fire,started,data,doc,ctx,dialog:()=>dialog,setReduced:v=>{reducedFlag=v}};
}
const ticks=(g,from,to,step=50)=>{for(let t=from;t<=to;t+=step)g.ui.tick(t)};
function firstRun(g){g.ui.continueJourney({isTrusted:false});g.tap();g.tap();return g.started.at(-1)}
function endOpening(g,run,{state='clear',score=2330,passed=6,hits=state==='clear'?0:1}={}){
 run.state=state;run.score=score;run.index=passed;run.hits=hits;
 run.result={runVersion:97,mode:'restoration',slotId:run.slot.id,ruleId:run.slot.ruleId,completed:true,practice:false,state,attempt:run.attempt,time:4,hits,score:passed*100,jumps:passed,kicks:0,mapChanges:0,bestCombo:passed,openingProof:{course:'folded-light',passed,clean:0,distance:100},reason:''};
 g.ui.complete(run);
 g.ui.onRunStatus({mode:'restoration',state,score:run.score,hearts:state==='clear'?1:0,opening:{section:'바닥',passed,total:6,clean:0,practice:false,crash:state==='fail'?{early:false,section:0}:null}});
}

test('clear: the polish score counts up over 1 s, then three stars stamp one by one',()=>{
 const g=boot(),run=firstRun(g);endOpening(g,run);
 let r=g.ui.view().result;
 assert.equal(r.score,2330,'polish run.score, not result.score');assert.deepEqual(Array.from(r.stars),[true,true,true]);
 assert.equal(r.shown,'0');assert.equal(r.newRecord,false,'nothing stored to beat yet');
 g.ui.tick(1000);g.ui.tick(1500);
 r=g.ui.view().result;const mid=Number(r.shown.replace(/,/g,''));
 assert.ok(mid>1000&&mid<2330,'eased count-up halfway: '+r.shown);assert.equal(r.stamped,0);
 g.ui.tick(2000);assert.equal(g.ui.view().result.shown,'2,330');assert.equal(g.ui.view().result.stamped,0,'stars wait for the count-up');
 g.ui.tick(2100);assert.equal(g.ui.view().result.stamped,1);
 g.ui.tick(2400);assert.equal(g.ui.view().result.stamped,2);
 g.ui.tick(2700);assert.equal(g.ui.view().result.stamped,3);
 g.ui.tick(3000);assert.equal(g.ui.view().result.done,true);
 assert.equal(g.$('openingResultProgress').hidden,true,'the shard row would only repeat the second star');
 assert.equal(g.$('squareResult').dataset.tapRetry,'false');
});
test('stars: lights and clean run are judged separately; fail shows the score but no stars',()=>{
 const g=boot(),run=firstRun(g);run.checkpointRetries=1;endOpening(g,run);
 assert.deepEqual(Array.from(g.ui.view().result.stars),[true,true,false],'a checkpoint restart is not a clean run');
 g.ui.retry({isTrusted:false});const again=g.started.at(-1);endOpening(g,again,{state:'fail',score:774,passed:2});
 const r=g.ui.view().result;assert.equal(r.state,'fail');assert.deepEqual(Array.from(r.stars),[false,false,false]);
 assert.equal(g.$('squareResult').dataset.tapRetry,'true');assert.equal(r.hint,'탭하면 다시 달리기');
});
test('reduced motion: final score and stars at once, no count-up',()=>{
 const g=boot({reduced:true}),run=firstRun(g);endOpening(g,run);
 const r=g.ui.view().result;assert.equal(r.shown,'2,330');assert.equal(r.done,true);assert.equal(r.stamped,3);
});
test('best score and "새 기록" only when a stored best is beaten',()=>{
 const g=boot(),run=firstRun(g);endOpening(g,run,{state:'fail',score:700,passed:2});
 g.ui.retry({isTrusted:false});endOpening(g,g.started.at(-1),{state:'fail',score:500,passed:1});
 assert.equal(g.ui.view().result.newRecord,false);assert.equal(g.ui.view().result.best,700);
 g.ui.retry({isTrusted:false});endOpening(g,g.started.at(-1),{score:2330});
 assert.equal(g.ui.view().result.newRecord,true);assert.equal(g.$('restorationRecordBadge').hidden,false);
 const saved=JSON.parse(g.data.get('r104-ui'));assert.equal(saved.best['r97-opening'],2330);
});
test('fail: a tap off the buttons retries at once; with retryFromCheckpoint the same run resumes and can complete again',()=>{
 const g=boot(),run=firstRun(g);endOpening(g,run,{state:'fail',score:600,passed:2});
 g.fire(g.$('squareResult'),'click',{target:g.$('squareRetry')});assert.equal(g.started.length,1,'buttons keep their own handlers');
 g.fire(g.$('squareResult'),'click',{target:g.$('squareSummary')});assert.equal(g.started.length,2,'normal retry when the run has no checkpoint');
 const second=g.started.at(-1);let calls=0;
 second.retryFromCheckpoint=function(){calls++;this.state='play';this.result=null;return true};
 endOpening(g,second,{state:'fail',score:650,passed:3});
 assert.equal(g.ui.view().result.hint,'탭하면 이 구간부터 다시');
 const attemptBefore=second.attempt;
 g.fire(g.$('squareResult'),'click',{target:g.$('squareResult')});
 assert.equal(calls,1);assert.equal(g.started.at(-1),second,'same run restarted through host.startRun');assert.equal(second.state,'play');
 assert.equal(second.attempt,g.ui.view().save.attempt+1,'a checkpoint restart is a fresh attempt for the catalog');
 endOpening(g,second,{score:2400});
 assert.equal(g.ui.view().result.state,'clear','the resumed run completes again');
 g.fire(g.$('squareResult'),'click',{target:g.$('squareResult')});assert.equal(calls,1,'no tap retry on a clear');
});
test('fail: a checkpoint that refuses falls back to the normal retry',()=>{
 const g=boot(),run=firstRun(g);run.retryFromCheckpoint=()=>false;endOpening(g,run,{state:'fail',score:300,passed:1});
 g.fire(g.$('squareResult'),'click',{target:g.$('squareResult')});
 assert.equal(g.started.length,2);assert.notEqual(g.started.at(-1),run);
});
// Memories 003/004 open without playing 001-002 (a hand-written save would fail the catalog's proof checks).
function seeded(){return {openAll:true,storage:new Map()}}
function _unused(extra={}){return new Map([['mongyu.r38.restoration.v2',JSON.stringify({schema:2,catalogVersion:2,collected:['r38-001','r38-002','r38-003'],records:{},selected:'r38-003',totalScore:0,slotScores:{},attempt:3,events:{},characterId:'walker',pendingUnlock:null,...extra})]])}
test('bridge: a memory that would open cold shows its short scene once; skip runs straight away',()=>{
 const g=boot(seeded());
 g.ui.start({isTrusted:false},'r38-003');
 assert.equal(g.dialog(),'restorationScene');assert.equal(g.ui.view().scene.kind,'bridge');assert.equal(g.ui.view().scene.pages,2);
 assert.equal(g.$('restorationSceneLabel').textContent,'003 · 300점의 길');assert.equal(g.$('restorationSceneSkip').textContent,'건너뛰기');
 assert.match(g.$('restorationSceneText').textContent,/네모난 방/);
 g.tap();g.tap();assert.equal(g.ui.view().scene.index,1);assert.equal(g.$('restorationSceneNext').textContent,'달리기 시작');
 g.tap();g.tap();assert.equal(g.started.at(-1).slot.number,3,'last page launches the memory');
 g.ui.start({isTrusted:false},'r38-003');assert.equal(g.dialog(),null,'seen: no bridge the second time');assert.equal(g.started.at(-1).slot.number,3);
 const g2=boot(seeded());g2.ui.start({isTrusted:false},'r38-004');assert.equal(g2.ui.view().scene?.kind,'bridge');
 g2.$('restorationSceneSkip').onclick({isTrusted:false});
 assert.equal(g2.started.at(-1).slot.number,4,'skip launches the run');
});
test('bridge content: short, authored, and only for memories with no other scene',()=>{
 const g=boot(),G=g.ctx.MongyuRestorationStoryGraph,C=g.ctx.MongyuRestorationCatalog,UI=g.ctx.MongyuRestorationUI;
 for(const [n,b] of Object.entries(G.interludes)){
  const slot=C.getSlot(Number(n));assert.ok(slot.traversal,n);assert.equal(G.getSequence(slot),null,n);assert.equal(UI.INTRO[n],undefined,n);
  assert.notEqual(slot.rule.type,'setting',n);assert.ok(b.lines.length>=1&&b.lines.length<=3,n);
  for(const l of b.lines){assert.ok(l.text.length>0&&l.text.length<=40,l.text);assert.ok(['narration','reflection'].includes(l.kind))}
 }
 assert.equal(G.getInterlude(5),null);assert.ok(G.getInterlude({number:3}));
});
test('R103 keeps memories without a bridge',()=>{
 const g=boot({polish:false,...seeded()});
 g.ui.start({isTrusted:false},'r38-003');
 assert.notEqual(g.ui.view().scene?.kind,'bridge');assert.equal(g.ui.view().result,undefined);
});
test('long press fast-forwards: typing x4, pages follow by themselves, never past the last page; release stops',()=>{
 const g=boot(seeded());g.ui.start({isTrusted:false},'r38-003');const run=g.started.at(-1)||null,launched=g.started.length;
 const view=g.$('restorationScene');
 ticks(g,0,100);
 g.fire(view,'pointerdown',{target:g.$('restorationSceneCast')});
 ticks(g,150,300);assert.notEqual(view.dataset.ff,'true','not before 350 ms');
 ticks(g,350,500);assert.equal(view.dataset.ff,'true');assert.equal(g.ui.view().fastForward,true);
 ticks(g,550,1500);
 assert.equal(g.ui.view().scene.index,1,'auto-advanced to the last page');
 ticks(g,1550,3000);assert.equal(g.ui.view().scene.index,1);assert.equal(g.started.length,launched,'held fast-forward never launches the run');
 assert.equal(g.ui.view().scene.typing,false);
 g.fire(view,'pointerup');assert.equal(view.dataset.ff,'false');
 g.tap();assert.equal(g.started.length,launched,'the click that ends a hold is swallowed');
 g.tap();assert.equal(g.started.at(-1).slot.number,3,'the next tap works normally');
});
test('fast-forward types four times faster than normal',()=>{
 const shown=hold=>{const g=boot(seeded());g.ui.start({isTrusted:false},'r38-011');const view=g.$('restorationScene');g.ui.tick(0);if(hold)g.fire(view,'pointerdown',{target:view});ticks(g,50,700);return {g,view,n:g.ui.view().scene.lineShown}};
 const plain=shown(false),fast=shown(true);
 assert.ok(fast.n>plain.n+3,'held: '+fast.n+' vs plain: '+plain.n);
 const {g,view}=fast;
 g.fire(view,'pointercancel');assert.equal(view.dataset.ff,'false');
 g.fire(view,'pointerdown',{target:g.$('restorationSceneSkip')});ticks(g,750,1400);assert.notEqual(view.dataset.ff,'true','holding a button never fast-forwards');
});
