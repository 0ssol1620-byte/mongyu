const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
globalThis.MONGYU_UI_EDITION=true;globalThis.MONGYU_POLISH_EDITION=true;
const SRC=path.resolve(__dirname,'..','src');
const Bank=require('../src/humor-bank.js');
globalThis.MongyuHumorBank=Bank;
const H=require('../src/humor-director.js');
const SFX=require('../src/game-sfx.js');
const E=Bank.ENTRIES;

/* phrases that must never appear in a line (insults, mockery, meme bait, developer words) */
const FORBIDDEN=['바보','멍청','한심','못하네','못 하네','병신','쓰레기','꺼져','죽어','못났','찐따','노잼','개못','초보','ㅋㅋ','ㅎㅎ','ㅠㅠ','실행','허용','활성','인스턴스','세션','리셋','디버그'];
const FORBIDDEN_EN=['idiot','stupid','dumb','loser','noob','pathetic','trash','suck','moron','lol','lmao'];

test('the bank is big enough and every id/line is unique', () => {
 assert.ok(E.length>=80,'rows '+E.length);
 const ids=new Set(E.map(e=>e.id));assert.equal(ids.size,E.length);
 const ko=E.filter(e=>e.ko).map(e=>e.ko);assert.equal(new Set(ko).size,ko.length,'duplicate Korean line');
 assert.ok(E.filter(e=>e.ko&&e.event!=='progress').length+Bank.courseLines.length>=80);
});

test('every row carries the full contract (section 6.6) and a ko + en pair, silence only where STORY allows it', () => {
 for(const e of E){
  for(const k of ['id','event','cls','priority','weight','cooldownSeconds','maxPerSession','oncePerProfile','exclusionTags','when','ko','en','outputs','durationMs','delayMs','graceMs','key'])assert.ok(k in e,e.id+' lacks '+k);
  assert.ok(Bank.CLASS[e.cls]!==undefined,e.id+' class');assert.ok(e.weight>0,e.id);assert.equal(e.key,'humor.'+e.id);
  assert.ok(Bank.EVENTS.includes(e.event),e.id+' event '+e.event);
  assert.ok(['bubble','gesture','sfx'].every(k=>k in e.outputs),e.id);
  if(e.ko===''){assert.equal(e.cls,'STORY',e.id+': only STORY rows may be silent');assert.equal(e.en,'',e.id);assert.equal(e.outputs.bubble,false)}
  else{assert.ok(e.en&&e.en.trim(),e.id+' lacks English');assert.ok(/[가-힣]/.test(e.ko),e.id)}
 }
});

test('length limits: Korean 4-18 chars on at most two lines, English short, no emoji, no exclamation spam', () => {
 for(const e of E){
  if(!e.ko)continue;const n=[...e.ko].length;
  assert.ok(n>=4&&n<=18,e.id+' ko '+n+' chars: '+e.ko);
  assert.ok(e.ko.split('\n').length<=2&&e.en.split('\n').length<=2,e.id);
  assert.ok([...e.en].length<=40,e.id+' en too long: '+e.en);
  assert.ok(!/\p{Extended_Pictographic}/u.test(e.ko+e.en),e.id+' emoji');
  assert.ok((e.ko.match(/!/g)||[]).length<=0&&(e.en.match(/!/g)||[]).length<=0,e.id+' no exclamation marks: deadpan');
  assert.ok(!/[가-힣]/.test(e.en),e.id+' English contains Hangul');assert.ok(!/^[a-z]/.test(e.en),e.id+' English starts lower-case: '+e.en);
 }
});

test('no forbidden or insulting phrases, in either language', () => {
 for(const e of E){
  for(const w of FORBIDDEN)assert.ok(!e.ko.includes(w),e.id+' contains '+w);
  const en=e.en.toLowerCase();for(const w of FORBIDDEN_EN)assert.ok(!new RegExp('\\b'+w+'\\b').test(en),e.id+' contains '+w);
 }
});

test('voice: first-person banmal monologue, never the polite 해요/합쇼 register or a third-person narration', () => {
 for(const e of E){
  if(!e.ko)continue;
  assert.ok(!/(니다|습니다|세요|십시오|해요|예요|에요|어요|아요)[.?]?$/.test(e.ko),e.id+' polite: '+e.ko);
  assert.ok(!/(했다|였다|이었다|렸다|갔다|왔다)\.?$/.test(e.ko),e.id+' narration: '+e.ko);
 }
});

test('the existing voice lint classifier agrees (banmal or noun phrases only)', () => {
 const cp=require('node:child_process'),tmp=path.join(require('node:os').tmpdir(),'hum_ko_'+process.pid+'.json');
 fs.writeFileSync(tmp,JSON.stringify(E.filter(e=>e.ko).map(e=>[e.id,e.ko])));
 const py=`import importlib.util,json,sys\nspec=importlib.util.spec_from_file_location('inv','tools/i18n-inventory.py');inv=importlib.util.module_from_spec(spec);spec.loader.exec_module(inv)\nrows=json.load(open(sys.argv[1],encoding='utf-8'))\nprint(json.dumps([[i,t,inv.classify(t)] for i,t in rows],ensure_ascii=False))`;
 let out;try{out=cp.execFileSync(process.platform==='win32'?'python':'python3',['-c',py,tmp],{cwd:path.resolve(__dirname,'..','..'),encoding:'utf8'})}catch(e){fs.rmSync(tmp,{force:true});return}
 fs.rmSync(tmp,{force:true});
 for(const [id,t,voice] of JSON.parse(out))assert.ok(['반말','명사형'].includes(voice),id+' reads as '+voice+': '+t);
});

test('outputs use only known gestures and the existing synth names', () => {
 for(const e of E){
  const g=e.outputs.gesture;assert.ok(g==='none'||Bank.GESTURES.includes(g),e.id+' gesture '+g);
  const s=e.outputs.sfx;assert.ok(s==='none'||Object.keys(SFX.configs).includes(s),e.id+' sfx '+s);
  assert.ok(Bank.SFX.includes(s),e.id+' sfx not in the bank whitelist');
 }
});

test('failure ladder 6.4: 1 / 3 / 5 (hint) / 10, supportive, never mocking; fail rows are only FAIL class', () => {
 const at=n=>E.filter(e=>e.event==='run.retry'&&e.when.failEq?.includes(n));
 assert.ok(at(1).some(e=>e.ko==='연습이었어.'));assert.ok(at(3).some(e=>e.ko==='이 바닥이랑 정들겠네.'));
 assert.ok(at(5).some(e=>e.outputs.hint==='footprint'&&/발자국/.test(e.ko)));assert.ok(at(5).some(e=>e.outputs.hint==='assist'));
 assert.ok(at(10).some(e=>e.ko==='천천히 가도 돼.'));
 for(const e of E.filter(e=>e.event==='run.retry')){assert.equal(e.cls,'FAIL');assert.ok(e.graceMs>0);assert.ok(e.priority>=30);assert.ok(e.exclusionTags.includes('boss_climax'))}
 for(const w of ['못','틀렸','실패','왜 못'])for(const e of at(10).concat(at(5),at(7)))assert.ok(!e.ko.includes(w),e.id+' '+w);
});

test('ladder end to end: the real director speaks the right rung after n fails of one course', () => {
 const rungs={1:'연습이었어.',3:'이 바닥이랑 정들겠네.',10:'천천히 가도 돼.'};
 for(const [n,text] of Object.entries(rungs)){
  let t=500000;const bus={log:[],emit:(k,d)=>bus.log.push([k,d]),host:{sound(){}}};
  const h=H.create({bank:Bank,clock:()=>t,wall:()=>1.7e12,storage:null,bus,seed:3,lang:()=>'ko',doc:{getElementById:()=>null}});
  const run={courseRun:true,id:'c2',state:'play',time:5,attempt:2,options:{},acts:[{type:'helix-up'}],actIndex:0,child:{distance:0,hazardEta:()=>Infinity,coach:null,time:5},progress:()=>0,perfectStreak:0,assistActs:[]};
  h.setFails('c2',+n);h.onRunEvent(run,'start');t+=2700;h.onFrame(run);t+=100;h.onFrame(run);
  const said=bus.log.filter(x=>x[0]==='humor-bubble').map(x=>x[1].text);assert.ok(said.includes(text),n+' fails -> '+JSON.stringify(said));
 }
});

test('stage lines cover the five chapters and fit the course ids c1..c25', () => {
 const byCh={1:0,2:0,3:0,4:0,5:0};
 for(const e of Bank.courseLines){const c=e.when.course[0],m=/^c(\d+)$/.exec(c);assert.ok(m&&+m[1]>=1&&+m[1]<=25,e.id+' '+c);byCh[Math.ceil(+m[1]/5)]++;assert.ok(e.when.cross.length>=1)}
 for(const k of Object.keys(byCh))assert.ok(byCh[k]>=5,'chapter '+k+' stage lines '+byCh[k]);
});

test('act-specific lines exist for mirror, wait (not pressing), flip and square', () => {
 for(const act of ['mirror','wait','flip','square'])assert.ok(E.some(e=>e.when.act?.includes(act)&&e.ko),act);
 assert.ok(E.some(e=>e.event==='act.wait'&&e.when.act.includes('wait')));
 assert.ok(E.some(e=>e.when.act?.includes('mirror')&&/거울/.test(e.ko)));
 assert.ok(E.some(e=>e.cls==='STORY'&&e.ko===''),'silence is allowed');
});

test('stage lines mention only things the course has (chapter fit sanity: no flip lines in chapter-1 acts)', () => {
 for(const e of E.filter(e=>e.when.ch))for(const c of e.when.ch)assert.ok(c>=1&&c<=5);
});

test('English table: i18n-en-humor registers every line as a phrase and humor.<id> keys', () => {
 const data=new Map(),ctx={console,performance,MONGYU_UI_EDITION:true,navigator:{languages:['en-US']},localStorage:{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v))},requestAnimationFrame:()=>0};
 ctx.globalThis=ctx;vm.createContext(ctx);
 for(const f of ['i18n.js','i18n-ko.js','i18n-en.js','humor-bank.js','i18n-en-humor.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 const I=ctx.MongyuI18n;I.setLang('en');
 for(const e of E){
  if(!e.ko)continue;
  const en=I.translate(e.ko);assert.equal(en,e.en,e.id+' phrase');assert.equal(I.t(e.key),e.en,e.id+' key');
 }
 I.setLang('ko');for(const e of E)if(e.ko)assert.equal(I.t(e.key),e.ko);
});

test('sources.json order: bank and English before the director, director after play-hud', () => {
 const s=JSON.parse(fs.readFileSync(path.join(SRC,'..','sources.json'),'utf8'));
 const i=f=>s.indexOf(f);
 assert.ok(i('humor-bank.js')>i('i18n-en-screens.js')&&i('i18n-en-humor.js')>i('humor-bank.js'));assert.ok(i('humor-director.js')>i('play-hud.js')&&i('humor-bank.js')<i('humor-director.js'));
});

test('R103/R104 builds stay untouched: without the UI edition both modules load as inert', () => {
 for(const f of ['humor-bank.js','humor-director.js']){
  const ctx={console,performance};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
  assert.equal(ctx.MongyuHumorBank,undefined);assert.ok(f==='humor-bank.js'||ctx.MongyuHumor?.enabled===false);
 }
});

test('play-hud shows the humor line last (after coach, dialogue and guide)', () => {
 const Hud=require('../src/play-hud.js');
 const run={time:1,coach:null};
 assert.deepEqual(Hud.pickSpeech(run,'','','','음…'),{text:'음…',kind:'humor',source:'humor'});
 assert.equal(Hud.pickSpeech(run,'','안내','','음…').source,'guide');assert.equal(Hud.pickSpeech(run,'대사','안내','','음…').source,'dialogue');
 assert.equal(Hud.pickSpeech(run,'','','',''),null);
});
