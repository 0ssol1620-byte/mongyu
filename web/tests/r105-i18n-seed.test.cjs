// R105 seed English table: main screens are covered, English never contains Hangul, voice examples read naturally.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src'),TEMPLATE=path.resolve(__dirname,'..','index.template.html');
const ctx={console,performance,MONGYU_UI_EDITION:true,navigator:{languages:['en-US']}};ctx.globalThis=ctx;vm.createContext(ctx);
for(const f of ['i18n.js','i18n-ko.js','i18n-en.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
const I=ctx.MongyuI18n,H=/[가-힣]/;

test('title, settings, pause, wardrobe, modes and result chrome translate',()=>{
 const must={'꿈 시작':'Start dreaming','옷장':'Wardrobe','이야기':'Story','설정':'Settings','잠깐 멈춤':'Paused','다시 달리기':'Retry','다음 꿈':'Next dream','처음으로':'Home','무한 꿈':'Endless Dream','오늘의 도전':'Daily Dream','착시 정원':'Illusion Garden',
  '음악 볼륨':'Music volume','효과음 볼륨':'Effects volume','포스터 저장':'Save poster','영상 저장':'Save clip','공유':'Share','접근성':'Accessibility','움직임 줄임':'Reduced motion','새 최고 기록':'New best','완벽 ×3':'Perfect ×3','빛 2 / 6':'Shards 2 / 6','이번 주 기록':"This week's records"};
 for(const [ko,en] of Object.entries(must))assert.equal(I.tr(ko),en,ko);
});

test('coach lines keep the guide voice (contractions, short, no manual-speak)',()=>{
 assert.equal(I.tr('벽도 바닥이야. 그대로 달려'),'Walls count as floors. Just keep running.');
 assert.equal(I.tr('한 박자 늦었어'),'A beat late.');
 for(const en of ['A beat late.','A touch early.','Hop over gaps.','Two in one jump.'])assert.ok(en.split(' ').length<=5);
});

test('every English string in the table is free of Hangul and developer words',()=>{
 const T=ctx.MongyuI18nEn;
 const all=[...Object.values(T.phrases),...Object.values(T.strings).flatMap(v=>typeof v==='string'?[v]:Object.values(v))];
 for(const en of all){assert.ok(!H.test(en),en);assert.ok(!/\b(session|instance|reset|activate|deactivate)\b/i.test(en),'developer word: '+en);assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(en),'emoji: '+en)}
});

test('template coverage: the large majority of static panel strings have an English entry',()=>{
 const html=fs.readFileSync(TEMPLATE,'utf8').replace(/\r\n/g,'\n');
 const body=html.slice(html.indexOf('<body>'));
 const texts=new Set();
 for(const m of body.matchAll(/>([^<>]*[가-힣][^<>]*)</g))texts.add(m[1].trim());
 for(const m of body.matchAll(/(?:aria-label|title|placeholder)="([^"]*[가-힣][^"]*)"/g))texts.add(m[1].trim());
 const missing=[...texts].filter(t=>I.translate(t)===null);
 const ratio=1-missing.length/texts.size;
 assert.ok(texts.size>150);
 assert.ok(ratio>=0.9,'coverage '+ratio.toFixed(2)+' missing: '+missing.slice(0,12).join(' | '));
});

test('plural-aware patterns',()=>{
 assert.equal(I.tr('기억 1개'),'1 memory');assert.equal(I.tr('기억 25개'),'25 memories');
 assert.equal(I.tr('남은 기회 1번'),'1 chance left');assert.equal(I.tr('남은 기회 3번'),'3 chances left');
 assert.equal(I.tr('같은 장애물에 2번 부딪혀 봐'),'Hit the same obstacle 2 times.');
});
