const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {host:makeHost}=require('./host.cjs');
const SRC=path.resolve(__dirname,'..','src');
const ART={'chapter-1':{src:'data:image/webp;base64,CH1'},'chapter-2':{src:'data:image/webp;base64,CH2'},'lobby-trip':{src:'data:image/webp;base64,LOBBY'},'item-star':{src:'data:image/webp;base64,STAR'}};
/* The isle on a DOM-stub page with the real course registry (chapters 1-5), the road module and the icon set. */
function page(o={}){
 const h=makeHost({square:true,restoration:true}),ctx=h.ctx;
 ctx.MONGYU_POLISH_EDITION=true;ctx.MONGYU_UI_EDITION=true;ctx.MONGYU_EMBEDDED_ART=ART;
 let active=null;const started=[];
 ctx.MongyuPolish={on(){return()=>{}},emit(){},host:{startRun(run){active=run;started.push(run);return true},viewport:()=>({width:390,height:844}),settings:()=>o.settings||{},activeRun:()=>active}};
 for(const f of ['ui-icons.js','trip-palettes.js','opening-run.js','illusion-course.js','chapters.js','course-run.js','road-mode.js','dream-isle.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return {h,ctx,started,Road:ctx.MongyuRoad,Isle:ctx.MongyuDreamIsle,Course:ctx.MongyuCourse};
}
const seed=(h,courses)=>h.data.set('mongyu.r105.road',JSON.stringify({v:1,plays:3,last:'c1',courses}));
const C=(g,extra={})=>({g,stars:[0,1,1,2,1,2,2,3][g],best:g?1000*g:0,clears:g?1:0,plays:1,bestShards:0,bestProgress:g?1:.3,...extra});
const textOf=n=>n.textContent||'';
const walk=(n,fn)=>{fn(n);for(const c of n.children||[])walk(c,fn)};

test('model: one slot per course of every chapter, read from the registry (c1-c25), with chapter totals',()=>{
 const p=page();seed(p.h,{c1:C(7,{memoryStars:1,bestTime:44.6}),c2:C(3,{memoryStars:1}),c3:C(1)});
 const m=p.Isle.buildModel(p.Course.CHAPTERS,p.Road.read(),i=>p.Road.unlocked(i,p.Road.read()));
 assert.equal(m.total,p.Course.allCourses().length);assert.ok(m.total>=25,'chapters 1-5 are present');
 assert.deepEqual(m.chapters.map(c=>c.count),p.Course.CHAPTERS.map(c=>c.courses.length));
 assert.equal(m.chapters[0].stars,3+2+1);assert.equal(m.chapters[0].maxStars,15);assert.equal(m.stars,6);assert.equal(m.maxStars,m.total*3);
 assert.equal(m.memory,2);assert.equal(m.memoryMax,m.total);
 const s=m.chapters[0].slots;assert.equal(s[0].state,'cleared');assert.equal(s[0].memory,true);assert.equal(s[0].bestTime,44.6);assert.equal(JSON.stringify(s[0].goals),'[true,true,true]');
 assert.equal(s[2].memory,false);assert.equal(s[3].state,'open','the first course without a star is open');assert.equal(s[4].state,'locked');
 assert.equal(m.next,s[3].id);assert.equal(m.cleared,3)});

test('model: unlock reasons name the course before (also across a chapter border); open and cleared slots have none',()=>{
 const p=page();seed(p.h,{c1:C(1),c2:C(1),c3:C(1),c4:C(1),c5:C(1)});
 const m=p.Isle.buildModel(p.Course.CHAPTERS,p.Road.read(),i=>p.Road.unlocked(i,p.Road.read()));
 const c1=m.chapters[0].slots,c2=m.chapters[1].slots,list=p.Course.allCourses();
 assert.equal(c1[4].state,'cleared');assert.equal(c2[0].state,'open');assert.equal(c2[0].reason,null);
 assert.equal(c2[1].state,'locked');assert.equal(c2[1].reason.prev,c2[0].title);assert.equal(p.Isle.reasonText(c2[1]),'‘'+c2[0].title+'’ 완주가 필요해요');
 const last=m.chapters[m.chapters.length-1].slots,prevTitle=list[list.length-2].title;assert.equal(last[last.length-1].reason.prev,prevTitle);
 for(const s of m.chapters.flatMap(c=>c.slots)){if(s.state==='locked'){assert.ok(s.reason&&s.reason.prev);assert.ok(p.Isle.reasonText(s).length<=40,'one short line')}else assert.equal(s.reason,null)}
 // an empty / damaged record still yields a full board
 for(const bad of [null,{},{courses:[]},{courses:{c1:'x'}}]){const e=p.Isle.buildModel(p.Course.CHAPTERS,bad);assert.equal(e.total,m.total);assert.equal(e.chapters[0].slots[0].state,'open');assert.equal(e.chapters[0].slots[1].state,'locked')}});

test('model: a new chapter appears without changes (dynamic registry); times format as m:ss',()=>{
 const p=page();
 const extra=[...p.Course.CHAPTERS,{id:'ch6',number:6,title:'새 장',trip:'violet',courses:[{id:'c26',title:'하나'},{id:'c27',title:'둘'}]}];
 const m=p.Isle.buildModel(extra,{courses:{}});assert.equal(m.chapters.length,p.Course.CHAPTERS.length+1);assert.equal(m.total,p.Course.allCourses().length+2);
 assert.equal(p.Isle.fmtTime(44.6),'0:45');assert.equal(p.Isle.fmtTime(125),'2:05');assert.equal(p.Isle.fmtTime(-3),'0:00')});

test('screen: every course is a slot, art slices come from the chapter backdrop, memory star shows its sprite, locked slots carry a lock and a reason',()=>{
 const p=page();seed(p.h,{c1:C(7,{memoryStars:1,bestTime:40}),c2:C(1)});
 assert.equal(p.Isle.open(),true);const $=id=>p.h.doc.getElementById(id);
 assert.equal($('isleScreen').hidden,false);assert.equal(p.h.doc.body.dataset.isle,'open');
 const slots=$('isleBoard').querySelectorAll('.isle-slot');assert.equal(slots.length,p.Course.allCourses().length);
 const first=slots[0];assert.equal(first.dataset.state,'cleared');assert.match(first.attrs['aria-label'],/별 3 \/ 3 · 기억의 별 찾음/);
 assert.equal(first.querySelector('.isle-gem').querySelector('img').src,ART['item-star'].src);
 const locked=slots.filter(s=>s.dataset.state==='locked');assert.ok(locked.length>10);
 for(const s of locked){assert.match(s.querySelector('.isle-lock').innerHTML,/<svg/);assert.match(s.attrs['aria-label'],/완주가 필요해요/)}
 const head=$('isleBoard').querySelectorAll('.isle-ch');assert.equal(head.length,p.Course.CHAPTERS.length);
 assert.match(textOf($('isleSummary')),/^별 4 \/ \d+ {2}· {2}기억의 별 1 \/ \d+$|^별 4 \/ \d+ +· +기억의 별 1 \/ \d+$/)});

test('tap: first tap selects (panel shows the facts), a second tap on the selected open slot replays through MongyuRoad.start; locked slots never start',()=>{
 const p=page();seed(p.h,{c1:C(7,{memoryStars:1,bestTime:44.6})});p.Isle.open();
 const slots=p.h.doc.getElementById('isleBoard').querySelectorAll('.isle-slot'),$=id=>p.h.doc.getElementById(id);
 const click=s=>s.click();
 // the default selection is the next course (c2); select c1 first
 click(slots[0]);assert.equal(p.Isle.selected,'c1');assert.equal(p.started.length,0);
 assert.equal(textOf($('isleInfo').querySelector('.isle-info-title')),p.Course.allCourses()[0].title);
 assert.match(textOf($('isleInfo').querySelector('.isle-info-line')),/기억의 별 찾음 · 최고 7,000점 · 가장 빠른 길 0:45/);
 assert.equal(textOf($('islePlay')),'다시 달리기');
 click(slots[0]);assert.equal(p.started.length,1);assert.equal(p.started[0].id,'c1');assert.equal($('isleScreen').hidden,true,'the isle closes when a run starts');
 // locked: shows the reason, no play button, never starts
 p.Isle.open();const lockedSlot=p.h.doc.getElementById('isleBoard').querySelectorAll('.isle-slot').find(s=>s.dataset.state==='locked');
 lockedSlot.click();lockedSlot.click();assert.equal(p.started.length,1);assert.equal($('islePlay').hidden,true);assert.match(textOf($('isleInfo').querySelector('.isle-info-line')),/완주가 필요해요$/)});

test('list view: the same facts as plain rows with real buttons, remembered between visits; play buttons replay; wardrobe link opens the original control',()=>{
 const p=page();seed(p.h,{c1:C(7,{memoryStars:1,bestTime:44.6}),c2:C(3)});p.Isle.open();
 const $=id=>p.h.doc.getElementById(id);$('isleViewList').click();
 assert.equal($('isleList').hidden,false);assert.equal($('isleBoard').hidden,true);assert.equal($('isleViewList').attrs['aria-pressed'],'true');
 const rows=$('isleList').querySelectorAll('.isle-row');assert.equal(rows.length,p.Course.allCourses().length);
 assert.equal(rows.filter(r=>r.dataset.state==='locked').every(r=>{let t='';walk(r,n=>{t+=textOf(n)&&!n.children?.length?textOf(n):''});return t.includes('완주가 필요해요')}),true);
 const go=$('isleList').querySelectorAll('.isle-row-go');assert.equal(go.length,rows.filter(r=>r.dataset.state!=='locked').length);
 assert.equal(p.h.ctx.localStorage.getItem('mongyu.r105.isleView'),'list');
 go[0].click();assert.equal(p.started.at(-1).id,'c1');
 p.Isle.open();assert.equal(p.Isle.mode,'list','the choice is remembered');
 let opened=0;$('shopOpen').onclick=()=>{opened++};$('isleWardrobe').click();assert.equal(opened,1);assert.equal($('isleScreen').hidden,true)});

test('close: Escape and the back button close it, focus returns to the opener; the isle works without any art',()=>{
 const p=page();const opener=p.h.doc.getElementById('titleContinue');opener.focus();
 p.Isle.open();p.Isle.ui.screen.dispatchEvent({type:'keydown',key:'Escape',preventDefault(){},stopPropagation(){}});
 assert.equal(p.Isle.isOpen,false);assert.equal(p.h.doc.activeElement,opener);assert.equal(p.h.doc.body.dataset.isle,undefined);
 p.Isle.open();p.Isle.ui.back.click();assert.equal(p.Isle.isOpen,false);
 p.ctx.MONGYU_EMBEDDED_ART=undefined;p.Isle.open();assert.equal(p.Isle.ui.board.querySelectorAll('.isle-slot').length,p.Course.allCourses().length)});

test('motion: slots pulse by 6 percent and everything is static when reduced',()=>{
 const css=fs.readFileSync(path.resolve(__dirname,'..','css','r105-isle.css'),'utf8');
 assert.match(css,/@keyframes isle-pulse\{0%,100%\{transform:scale\(1\)\}50%\{transform:scale\(1\.06\)\}\}/);
 assert.match(css,/\[data-reduced=true\] :is\(\.isle-slot,\.isle-cell,\.isle-mote\)\{animation:none!important/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{[^}]*isle-slot[^}]*animation:none!important/);
 assert.match(css,/min-height:44px/);
 const p=page({settings:{reduced:true}});p.Isle.open();assert.equal(p.Isle.ui.screen.dataset.reduced,'true')});

test('lobby: the dock button is enabled (no soon badge) and opens the isle',()=>{
 const src=fs.readFileSync(path.join(SRC,'lobby-ui.js'),'utf8');
 assert.doesNotMatch(src,/id:'isle'[^}]*soon:true/);assert.match(src,/root\.MongyuDreamIsle\.open\(event\)/);
 const build=fs.readFileSync(path.resolve(__dirname,'..','build.py'),'utf8');assert.match(build,/r105-isle\.css/);
 const sources=JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','sources.json'),'utf8'));
 assert.ok(sources.indexOf('i18n-en-isle.js')>sources.indexOf('i18n-en-screens.js'));assert.ok(sources.indexOf('dream-isle.js')>sources.indexOf('road-mode.js'));assert.ok(sources.indexOf('ghost-run.js')<sources.indexOf('course-run.js'))});

test('English: every isle line translates fully; the Korean voice has no developer words',()=>{
 const ctx={MONGYU_UI_EDITION:true,console,performance:{now:()=>0},navigator:{language:'en'}};vm.createContext(ctx);
 for(const f of ['i18n.js','i18n-en.js','i18n-en-lobby.js','i18n-en-psy.js','i18n-en-screens.js','i18n-en-chapters.js','i18n-en-isle.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 const T=ctx.MongyuI18n,p=page();seed(p.h,{c1:C(7,{memoryStars:1,bestTime:44.6}),c2:C(1)});p.Isle.open();
 const lines=new Set();
 walk(p.Isle.ui.screen,n=>{if(n.children?.length===0&&textOf(n)&&/[가-힣]/.test(textOf(n)))lines.add(textOf(n));const a=n.attrs?.['aria-label'];if(a&&/[가-힣]/.test(a))lines.add(a)});
 $=null;p.h.doc.getElementById('isleViewList').click();
 walk(p.Isle.ui.screen,n=>{if(n.children?.length===0&&textOf(n)&&/[가-힣]/.test(textOf(n)))lines.add(textOf(n));const a=n.attrs?.['aria-label'];if(a&&/[가-힣]/.test(a))lines.add(a)});
 for(const l of ['꿈의 섬','기억판','네모를 눌러 보세요','다시 달리기','달리기','옷장','처음으로'])lines.add(l);
 assert.ok(lines.size>40);
 for(const l of lines){const r=T.translate(l,'en');assert.ok(r!==null&&!/[가-힣]/.test(r),'translates: '+l+' -> '+r)}
 assert.equal(T.translate('꿈의 섬','en'),'Dream Isle');
 assert.equal(T.translate('별 11 / 75  ·  기억의 별 4 / 25','en'),'Stars 11 / 75  ·  Memory stars 4 / 25');
 const bad=/실행|허용|활성|세션|리셋|했다\.?$|이다\.?$/;for(const l of lines)assert.doesNotMatch(l,bad,l)});
