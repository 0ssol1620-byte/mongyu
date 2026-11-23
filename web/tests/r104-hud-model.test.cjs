// R104 play HUD: pure model/speech rules plus a mounted HUD driven through a tiny DOM stub.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src');
function fakeDom(){
 const byId={};
 function element(tag){
  const e={tagName:tag.toUpperCase(),id:'',className:'',hidden:false,textContent:'',dataset:{},style:{},attrs:{},children:[],parentNode:null,animations:[],
   setAttribute(k,v){this.attrs[k]=String(v);if(k==='id'){this.id=String(v);byId[v]=this}},getAttribute(k){return this.attrs[k]??null},
   appendChild(x){x.parentNode=this;this.children.push(x);return x},replaceChildren(...xs){this.children=[];xs.forEach(x=>this.appendChild(x))},
   remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this)},
   animate(frames,opts){this.animations.push({frames,opts});return {}}};
  let inner='';Object.defineProperty(e,'innerHTML',{get(){return inner},set(v){inner=String(v);e.children=[]}});
  const classes=new Set();e.classList={toggle(c,on){if(on)classes.add(c);else classes.delete(c)},remove:c=>classes.delete(c),contains:c=>classes.has(c)};
  return e;
 }
 const doc={documentElement:element('html'),body:element('body'),createElement:element,getElementById:id=>byId[id]||null};
 for(const id of ['stage','runnerSpeech','hudCue','runLesson','restorationScene','pauseSheet','squareResult','restorationAftermath']){const n=element(id==='stage'?'main':'p');n.setAttribute('id',id);n.hidden=id!=='stage';doc.body.appendChild(n)}
 doc.body.dataset.screen='play';
 return doc;
}
function load({polish=true}={}){
 const listeners={};
 const ctx={console,MONGYU_POLISH_EDITION:polish,MONGYU_STAGE_EDITION:true,performance:{now:()=>ctx.now},now:0,requestAnimationFrame:()=>0,cancelAnimationFrame(){}};
 ctx.globalThis=ctx;vm.createContext(ctx);
 for(const f of ['polish-bus.js','opening-run.js','play-hud.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return ctx;
}
const find=(root,cls)=>{if((root.className||'').split(' ').includes(cls))return root;for(const c of root.children){const r=find(c,cls);if(r)return r}return null};
function opening(O,extra={}){const run=new O.OpeningRun({slot:{id:'s2',number:2,ruleId:'r'},attempt:1});run.start();return Object.assign(run,extra)}

test('HUD stays inert outside the R104 polish edition',()=>{
 const ctx=load({polish:false});
 assert.equal(ctx.MongyuPlayHud.enabled,false);
 assert.equal(ctx.MongyuPlayHud.mounted,null);
});

test('opening model reads run.score, distance/FINISH progress and gold notches for passed obstacles',()=>{
 const ctx=load(),H=ctx.MongyuPlayHud,O=ctx.MongyuOpening;
 const run=opening(O,{distance:O.FINISH/2,index:3,score:300});
 const m=H.model(run,O);
 assert.equal(m.kind,'opening');assert.equal(m.score,300);assert.equal(m.ratio,.5);
 assert.equal(m.notches.length,O.OBSTACLES.length);
 assert.deepEqual(Array.from(m.notches,n=>n.lit),[true,true,true,false,false,false]);
 assert.ok(Math.abs(m.notches[0].pos-O.OBSTACLES[0].at/O.FINISH)<1e-9);
 assert.equal(m.right,'빛 3 / 6');assert.equal(m.left,'벽');assert.equal(m.hearts,null);
 assert.equal(H.model(opening(O),O).score,0,'no invented scoring when the run has none');
});

test('native model mirrors the existing score, goal and lives readout',()=>{
 const H=load().MongyuPlayHud;
 const run={nativeRuntime:true,initialLives:3};
 const m=H.model(run,null,{score:38.7,hearts:2,freePlay:false,scoreFinalization:true,scoreObjective:{target:300,current:38}});
 assert.equal(m.kind,'native');assert.equal(m.score,38);assert.equal(m.right,'38 / 300점');
 assert.ok(Math.abs(m.ratio-38/300)<1e-9);assert.deepEqual({...m.hearts},{now:2,max:3});
 assert.equal(H.model(run,null,{score:5,hearts:3,freePlay:false,scoreFinalization:true,scoreObjective:{target:300,current:300}}).right,'목표 달성');
});

test('speech priority is coach (until it expires), then canvas dialogue, then section guide',()=>{
 const H=load().MongyuPlayHud;
 const run={time:4,coach:{kind:'early',text:'조금 일찍 눌렀어. 장애물 바로 앞에서!',until:5}};
 assert.equal(H.pickSpeech(run,'저 빛을 따라가 볼까?','장애물 앞에서 탭').source,'coach');
 run.time=5.01;
 assert.equal(H.pickSpeech(run,'저 빛을 따라가 볼까?','장애물 앞에서 탭').text,'저 빛을 따라가 볼까?');
 assert.equal(H.pickSpeech(run,'','장애물 앞에서 탭').kind,'guide');
 assert.equal(H.pickSpeech({time:0},'',''),null);
});

test('mounted HUD shows only during play, writes changes, bounces score and replaces the canvas bubble',()=>{
 const ctx=load(),doc=fakeDom();ctx.document=doc;
 const settings={reduced:false},O=ctx.MongyuOpening;let run=opening(O);
 const hud=ctx.MongyuPlayHud.mount(doc,{settings:()=>settings,activeRun:()=>run});
 const el=hud.element,score=find(el,'r104-score'),value=find(el,'r104-score-value'),dock=find(el,'r104-dock'),text=find(el,'r104-dock-text');
 assert.equal(el.parentNode,doc.getElementById('stage'));
 hud.update();
 assert.equal(el.dataset.show,'true');assert.ok(doc.documentElement.classList.contains('r104-hud-on'));
 assert.equal(value.textContent,'0');
 const bubble=doc.getElementById('runnerSpeech');bubble.hidden=false;bubble.textContent='저 빛을 따라가 볼까?';
 hud.update();assert.equal(dock.dataset.on,'true');assert.equal(text.textContent,'저 빛을 따라가 볼까?');
 run.coach={kind:'perfect',text:'완벽!',until:run.time+1};hud.update();
 assert.equal(text.textContent,'완벽!');assert.equal(dock.dataset.source,'coach');
 run.score=100;run.index=1;hud.update();
 assert.equal(value.textContent,'100');assert.equal(score.animations.length,1,'score bounces on increase');
 assert.equal(find(el,'r104-notches').children[0].dataset.lit,'true');
 settings.reduced=true;run.score=200;hud.update();
 assert.equal(score.animations.length,1,'no bounce when reduced');
 run.state='pause';hud.update();
 assert.equal(el.dataset.show,'false');assert.ok(!doc.documentElement.classList.contains('r104-hud-on'));
 run.state='play';doc.getElementById('restorationScene').hidden=false;hud.update();
 assert.equal(el.dataset.show,'false','story scene hides the HUD');
 doc.getElementById('restorationScene').hidden=true;doc.body.dataset.screen='panel';hud.update();
 assert.equal(el.dataset.show,'false','dialogs (screen=panel) hide the HUD');
 doc.body.dataset.screen='play';run={nativeRuntime:true,initialLives:3,updates:1,state:'play',status:()=>({state:'play',score:12,hearts:3,scoreFinalization:true,scoreObjective:{target:300,current:12}})};
 hud.update();
 assert.equal(el.dataset.kind,'native');assert.equal(value.textContent,'12');
 assert.equal(find(el,'r104-notches').children.length,0,'opening notches cleared for native runs');
 assert.equal(find(el,'r104-cap-left').children.length,3);
 hud.destroy();
});
