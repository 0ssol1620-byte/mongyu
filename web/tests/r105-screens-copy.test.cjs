// R105 screens (workstream S): story prose is 1st-person monologue, copy goes through v105 only in the UI edition, English covers every rewritten line.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src');
function load(ui,files){
 const ctx={console,performance,MONGYU_UI_EDITION:ui,MONGYU_DREAM_EDITION:ui,MONGYU_POLISH_EDITION:ui,navigator:{languages:['en-US']}};ctx.globalThis=ctx;vm.createContext(ctx);
 for(const f of files)vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return ctx;
}
const STORY=['restoration-catalog.js','restoration-story-graph.js','restoration-mastery.js','opening-run.js','restoration-ui.js'];
const H=/[가-힣]/;

// every line the story scenes can show (graph steps, bridges, vignettes, boss intros)
function sceneLines(ctx){
 const G=ctx.MongyuRestorationStoryGraph,U=ctx.MongyuRestorationUI,out=[];
 for(const s of G.sequences)for(const st of s.steps){out.push(st.text||st.action||'');if(st.alternateText!==undefined)out.push(st.alternateText)}
 for(const v of Object.values(G.interludes))for(const l of v.lines)out.push(l.text);
 for(const v of Object.values(U.VIGNETTES))out.push(...v.pages);
 for(const v of Object.values(U.INTRO))out.push(...v.pages);
 return out.filter(Boolean);
}

test('UI edition: no scene line ends like 3rd-person narration (~했다. ~습니다.)',()=>{
 const ctx=load(true,STORY),U=ctx.MongyuRestorationUI;
 const bad=[];
 for(const line of sceneLines(ctx)){
  const shown=U.v105(line);
  for(const sentence of shown.split(/(?<=[.!?])\s+/)){
   if(/[았었였했랐렸웠]다[.!]?$/.test(sentence)||/(합니다|습니다|입니다)[.!]?$/.test(sentence))bad.push(sentence);
  }
 }
 assert.deepEqual(bad,[],'3rd-person endings left: '+bad.join(' | '));
});

test('UI edition: addressing the player stays informal (no 합쇼 in monologue lines)',()=>{
 const ctx=load(true,STORY),U=ctx.MongyuRestorationUI;
 for(const line of sceneLines(ctx)){const s=U.v105(line);assert.ok(!/(주셔서|하십시오|하세요)/.test(s),s)}
});

test('R104 and older builds keep the original wording',()=>{
 const ctx=load(false,STORY),U=ctx.MongyuRestorationUI;
 for(const line of sceneLines(ctx))assert.equal(U.v105(line),line);
 assert.equal(U.v105('꿈이 접혔다'),'꿈이 접혔다');
 assert.equal(ctx.MongyuRestorationUI.VIGNETTES[28].pages[1],'길이 잠시 공중에 떠올랐다. 이 정도면 작은 묘기라고 해도 될까.');
});

test('headlines are short monologue lines, instructions are task nouns',()=>{
 const U=load(true,STORY).MongyuRestorationUI;
 assert.equal(U.v105('빛의 문을 열었다'),'빛의 문이 열렸어');
 assert.equal(U.v105('꿈이 접혔다'),'꿈이 접혔네');
 assert.equal(U.v105('충돌 · 바닥'),'바닥에서 부딪혔네');
 assert.equal(U.v105('한 번의 달리기에서 300점을 모으세요.'),'한 번 달려서 300점 모으기');
 assert.equal(U.v105('오후 시간대에 설정을 열어 속도를 한 번 바꾸세요.'),'오후에 설정에서 속도를 한 번 바꾸기');
 assert.equal(U.v105('앞선 기록을 먼저 모으세요.'),'앞선 기록을 먼저 찾아야 열려요.');
 assert.equal(U.v105('기록은 이번 실행에만 남습니다.'),'기록은 이번 플레이에만 남아요.');
 assert.equal(U.v105('이미 해요체인 문장이에요.'),'이미 해요체인 문장이에요.','unknown strings pass through');
});

test('no developer words in anything the UI edition shows from the table',()=>{
 const U=load(true,STORY).MongyuRestorationUI;
 for(const [from,to] of U.COPY105)assert.ok(!/실행|허용|활성|인스턴스|시각 신호|세션|리셋/.test(to),from+' -> '+to);
});

test('pause line: the stale "탭하여 점프 · 빛 0 / 6" is replaced',()=>{
 const U=load(true,STORY).MongyuRestorationUI;
 const open={opening:{passed:2,total:6}};
 assert.equal(U.pauseLine105(open,'탭하여 점프 · 빛 2 / 6'),'빛 6개 중 2개 모았어요');
 assert.equal(U.pauseLine105({roomTitle:'무한 꿈'},'탭하여 점프'),'무한 꿈');
 assert.equal(U.pauseLine105({},'탭하여 점프'),'');
 assert.equal(U.pauseLine105({},'1 / 1 · 무한 꿈 · 새벽 계단 · 14점'),'무한 꿈 · 새벽 계단 · 14점','dream runs lose the "1 / 1" counter');
 assert.equal(U.pauseLine105({},'가까운 탄을 점프로 받아치세요. 공중에 다시 탄이 오면 한 번 더 누르세요. 되돌린 탄이 외계인에게 18번 닿아야 합니다.').includes('습니다'),false);
});

test('story list folds locked entries into one count; wardrobe keeps one next hint',()=>{
 const U=load(true,STORY).MongyuRestorationUI;
 const j=U.journalState105([{unlocked:true},{unlocked:false},{unlocked:false},{unlocked:false}]);
 assert.equal(j.open.length,1);assert.equal(j.locked,3);assert.equal(j.total,4);
 const looks=[{id:'a',at:0},{id:'b',at:0},{id:'c',at:3},{id:'d',at:6},{id:'e',at:10}];
 const w=U.wardrobeState105(looks,x=>x.at<=2);
 assert.deepEqual(Array.from(w.owned,x=>x.id),['a','b']);assert.equal(w.remaining,3);assert.equal(w.next.id,'c');
 const done=U.wardrobeState105(looks,()=>true);assert.equal(done.remaining,0);assert.equal(done.next,null);
});

test('English: every rewritten scene line and screen string has a phrase, none contains Hangul',()=>{
 const ctx=load(true,['i18n.js','i18n-ko.js','i18n-en.js','i18n-en-screens.js',...STORY]);
 const I=ctx.MongyuI18n,U=ctx.MongyuRestorationUI;I.setLang?.('en');
 const missing=[];
 const seen=new Set();
 const check=s=>{if(!s||seen.has(s))return;seen.add(s);const en=I.translate(s);if(en===null||H.test(en))missing.push(s)};
 for(const line of sceneLines(ctx))check(U.v105(line));
 for(const v of [...Object.values(U.VIGNETTES),...Object.values(U.INTRO)])check(v.name);
 for(const [,to] of U.COPY105)check(to);
 for(const slot of ctx.MongyuRestorationCatalog.slots){check(slot.title);check(U.v105(slot.instruction))}
 for(const s of ['만난 이야기 3 / 21','아직 만나지 못한 이야기 18개','아직 만나지 못한 이야기 1개','열리면 이 자리에 나와요 · 10벌 남음','찾은 기억 12 / 100','빛 6개 중 2개 모았어요','3바퀴 돌았어','1바퀴 돌았어','오로라의 문이 열렸어','정원이 접혔네','바닥에서 부딪혔네','천장에서 부딪혔네',
  '빈 곳을 탭하면 이 구간부터 다시','이야기와 대사는 몽유를 위해 새로 쓴 글이에요.','예전 꿈 100개를 다시 걸어요. 새 길은 홈의 달리기에서 이어져요.','이번 플레이에만 옷을 보관할 수 있어요.'])check(s);
 assert.deepEqual(missing,[],'English missing for: '+missing.slice(0,12).join(' | '));
 assert.equal(I.translate('아직 만나지 못한 이야기 1개'),'1 story not met yet');
 assert.equal(I.translate('아직 만나지 못한 이야기 18개'),'18 stories not met yet');
 assert.equal(I.translate('빛 6개 중 2개 모았어요'),'2 of 6 shards collected');
});

test('English table has no developer words or emoji',()=>{
 let table={};
 const ctx={console,MONGYU_UI_EDITION:true,MongyuI18n:{register(l,t,x){if(x?.phrases)Object.assign(table,x.phrases)}}};ctx.globalThis=ctx;vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(path.join(SRC,'i18n-en-screens.js'),'utf8'),ctx);
 const all=Object.values(table);assert.ok(all.length>250);
 for(const en of all){assert.ok(!H.test(en),en);assert.ok(!/\b(session|instance|reset|activate|deactivate)\b/i.test(en),en);assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(en),en)}
});
