// R104 story scene and result-badge behavior of restoration-ui.js, in an isolated VM with a tiny DOM.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const BUTTONS=new Set(['restorationSceneNext','restorationSceneSkip','restorationSceneAction','squareNext','squareRetry','squareCollection','squareRestart','squareHome','squarePractice','restorationStart','restorationClose','restorationOpen']);
function dom(){
 const ids=new Map();
 function element(tag='div',id=''){
  let own='';const e={tagName:tag.toUpperCase(),id,hidden:false,disabled:false,dataset:{},attrs:{},children:[],parentNode:null,className:'',handlers:{},width:720,height:320,value:'',
   style:{setProperty(k,v){this[k]=v}},
   get textContent(){return this.children.length?this.children.map(c=>c.textContent).join(''):own},
   set textContent(v){this.children=[];own=String(v)},
   setAttribute(k,v){this.attrs[k]=String(v)},getAttribute(k){return this.attrs[k]??null},
   addEventListener(k,f){(this.handlers[k]??=[]).push(f)},
   appendChild(x){x.parentNode=this;this.children.push(x);return x},append(...xs){xs.forEach(x=>this.appendChild(x))},
   replaceChildren(...xs){this.children=[];own='';xs.forEach(x=>this.appendChild(x))},after(){},
   focus(){doc.activeElement=this},querySelector(){return null},
   closest(sel){const tags=sel.split(',').map(s=>s.trim().toUpperCase());let p=this;while(p){if(tags.includes(p.tagName))return p;p=p.parentNode}return null},
   getContext(){return new Proxy({},{get:()=>()=>({addColorStop(){}})})}
  };
  e.classList={add:c=>{const a=new Set(e.className.split(' ').filter(Boolean));a.add(c);e.className=[...a].join(' ')},contains:c=>e.className.split(' ').includes(c)};
  return e;
 }
 const doc={activeElement:null,body:element('body'),documentElement:{dataset:{}},createElement:t=>element(t),
  getElementById(id){if(!ids.has(id)){const e=element(BUTTONS.has(id)?'button':'div',id);ids.set(id,e);if(id.startsWith('restorationScene')&&id!=='restorationScene')doc.getElementById('restorationScene').appendChild(e)}return ids.get(id)}};
 return doc;
}
function boot({polish=true,reduced=false,storage}={}){
 const doc=dom(),data=storage||new Map(),started=[];let dialog=null,reducedFlag=reduced;
 const ctx={console,structuredClone,MONGYU_DREAM_EDITION:true,MONGYU_STAGE_EDITION:true,MONGYU_STAGE_HUD:true,MONGYU_POLISH_EDITION:polish,QuadRiftRestoration:{BOSS_RULES:[],BOSS_SLOTS:[],RestorationRun:class{}}};
 vm.createContext(ctx);
 for(const f of ['restoration-catalog.js','restoration-story-graph.js','restoration-mastery.js','opening-run.js','restoration-ui.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',f),'utf8'),ctx,{filename:f});
 const host={document:doc,storage:{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)},
  viewport:()=>({width:390,height:844}),reduced:()=>reducedFlag,dialog:()=>dialog,openDialog:name=>{dialog=name},closeDialog:()=>{dialog=null},
  startRun:run=>{dialog=null;started.push(run)},activeRun:()=>started.at(-1)||null,refresh(){},resumeRun(){}};
 const ui=ctx.MongyuRestorationUI.mount(host),$=id=>doc.getElementById(id);
 const tap=(target=$('restorationScene'))=>{for(const f of $('restorationScene').handlers.click||[])f({type:'click',target,isTrusted:true})};
 return {ui,$,tap,started,data,doc,dialog:()=>dialog,setReduced:v=>{reducedFlag=v}};
}
const LINE='빛이 벽 너머로 갔어. 따라가 보자.';
test('R104 opening line types at ~35 chars/s, the first tap completes it and the next tap starts the first run',()=>{
 const g=boot();g.ui.continueJourney({isTrusted:false});
 assert.equal(g.dialog(),'restorationScene');
 assert.equal(g.$('restorationSceneLabel').textContent,'002 · 접힌 빛');
 assert.equal(g.$('restorationSceneText').textContent,LINE,'the full sentence is in the live region from the start');
 assert.equal(g.$('restorationSceneText').children.length,Array.from(LINE).length);
 assert.equal(g.$('restorationScene').dataset.line,'typing');
 g.ui.tick(0);g.ui.tick(100);g.ui.tick(200);
 assert.equal(g.ui.view().scene.lineShown,8,'0.2 s at 35 chars/s');
 assert.equal(g.$('restorationSceneText').children.filter(c=>c.classList.contains('tw-on')).length,8);
 g.tap();
 assert.equal(g.started.length,0,'first tap only completes the line');
 assert.equal(g.ui.view().scene.typing,false);
 assert.equal(g.$('restorationScene').dataset.line,'done');
 g.tap();
 assert.equal(g.started.length,1);
 assert.equal(g.started[0].openingCourse,true);
 assert.equal(g.started[0].slot.number,2);
});
test('R104 line finishes by itself and the done marker appears without a tap',()=>{
 const g=boot();g.ui.continueJourney({isTrusted:false});
 for(let t=0;t<=1000;t+=50)g.ui.tick(t);
 assert.equal(g.ui.view().scene.typing,false);
 assert.equal(g.$('restorationScene').dataset.line,'done');
 g.tap();assert.equal(g.started.length,1,'a finished line advances on the first tap');
});
test('R104 reduced motion shows the whole line at once',()=>{
 const g=boot({reduced:true});g.ui.continueJourney({isTrusted:false});
 assert.equal(g.$('restorationSceneText').textContent,LINE);
 assert.equal(g.$('restorationSceneText').children.length,0);
 assert.equal(g.$('restorationScene').dataset.line,'done');
 g.tap();assert.equal(g.started.length,1);
});
test('R104 taps never bypass a disabled next button and ignore controls',()=>{
 const g=boot();g.ui.continueJourney({isTrusted:false});g.tap();
 g.$('restorationSceneNext').disabled=true;g.ui.tick(0);g.ui.tick(50);
 assert.equal(g.$('restorationScene').dataset.line,'wait');
 g.tap();g.tap();assert.equal(g.started.length,0);
 g.$('restorationSceneNext').disabled=false;
 g.tap(g.$('restorationSceneSkip'));assert.equal(g.started.length,0,'button taps keep their own handlers only');
 g.tap();assert.equal(g.started.length,1);
});
test('R103 and older keep the original scene: no tap handler, no typewriter, 001 label',()=>{
 const g=boot({polish:false});g.ui.continueJourney({isTrusted:false});
 assert.equal(g.$('restorationScene').handlers.click,undefined);
 assert.equal(g.$('restorationSceneLabel').textContent,'001 · 낯선 곳의 첫 달리기');
 assert.equal(g.$('restorationSceneText').children.length,0);
 assert.equal(g.$('restorationSceneText').textContent,LINE);
 assert.equal(g.$('restorationScene').dataset.line,undefined);
});
function finishOpening(g,run,bestCombo,clean=0,score){
 const passed=bestCombo;
 if(score!==undefined)run.score=score;
 run.state='fail';run.result={runVersion:97,mode:'restoration',slotId:run.slot.id,ruleId:run.slot.ruleId,completed:true,practice:false,state:'fail',attempt:run.attempt,time:4,hits:1,score:passed*100+clean*10,jumps:passed,kicks:0,mapChanges:0,bestCombo,openingProof:{course:'folded-light',passed,clean,distance:100},reason:'충돌'};
 g.ui.complete(run);
 g.ui.onRunStatus({mode:'restoration',state:'fail',score:run.result.score,hearts:0,opening:{section:'바닥',passed,total:6,clean,practice:false,crash:{early:false}}});
 return g.$('restorationRecordBadge').hidden;
}
// Phase 2: the opening result now shows the polish score (run.score), so the record follows that score.
test('R104 record badge only when the run beats a stored best polish score',()=>{
 const g=boot();g.ui.continueJourney({isTrusted:false});g.tap();g.tap();
 assert.equal(finishOpening(g,g.started.at(-1),3,1,640),true,'first attempt: nothing stored to beat');
 g.ui.retry({isTrusted:false});assert.equal(finishOpening(g,g.started.at(-1),1,0,210),true,'lower score');
 g.ui.retry({isTrusted:false});assert.equal(finishOpening(g,g.started.at(-1),3,3,640),true,'same score');
 g.ui.retry({isTrusted:false});assert.equal(finishOpening(g,g.started.at(-1),4,0,820),false,'beats the stored best');
 assert.equal(g.ui.view().result.newRecord,true);
 assert.equal(g.started.length,4);
});
test('R103 keeps its original record badge rule',()=>{
 const g=boot({polish:false});g.ui.continueJourney({isTrusted:false});g.ui.sceneNext({isTrusted:false});
 assert.equal(finishOpening(g,g.started.at(-1),2),false);
});
test('R104 story CSS is scoped to the polish edition and fixes the result icon and label',()=>{
 const css=fs.readFileSync(path.join(__dirname,'..','css','r104-story.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 const rules=css.replace(/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g,'').replace(/@media[^{]*\{/g,'');
 const selectors=(rules.match(/[^{}]+(?=\{)/g)||[]).map(s=>s.trim()).filter(Boolean);
 assert.ok(selectors.length>5);
 for(const group of selectors)for(const s of group.split(/,(?![^(]*\))/))assert.match(s.trim(),/^html\[data-polish-edition\]/,s);
 assert.match(css,/#squareNext\[data-primary=true\]::before\{content:'→'\}/);
 assert.match(css,/white-space:nowrap/);
 assert.match(css,/r104-story-more 1\.2s/);
});
