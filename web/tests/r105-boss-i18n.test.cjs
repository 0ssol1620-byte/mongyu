const {test}=require('node:test'),assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),SRC=path.resolve(__dirname,'..','src');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
for(const f of ['trip-palettes','items','opening-run','illusion-course','helix-act','penrose-act','endless-dream','chapters','square-act','boss-act'])require('../src/'+f+'.js');
const Boss=globalThis.MongyuBossAct,Course=require('../src/course-run.js');
const HANGUL=/[가-힣]/;
function translator(){
 const ctx={MONGYU_UI_EDITION:true,console,performance:{now:()=>0},navigator:{language:'en'}};vm.createContext(ctx);
 for(const f of ['i18n.js','i18n-en.js','i18n-en-psy.js','i18n-en-screens.js','i18n-en-chapters.js','i18n-en-boss.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return ctx.MongyuI18n;
}
/* every Korean string literal of boss-act.js (comments stripped) */
function literals(){
 const src=fs.readFileSync(path.join(SRC,'boss-act.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/(^|[^:'"])\/\/[^\n]*/g,'$1');
 const out=new Set();for(const m of src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)){const s=m[1].replace(/\\'/g,"'");if(HANGUL.test(s))out.add(s)}
 return [...out];
}
test('English: every Korean line of the boss act (names, subs, phases, telegraphs, coach lines, causes, captions, UI) translates fully', () => {
 const T=translator(),bad=[];
 for(const l of literals()){
  const probes=l==='페이즈부터 다시'?[1,2,3].map(n=>n+l):[l];
  for(const p of probes){const r=T.translate(p,'en');if(r===null||HANGUL.test(r)||r===p)bad.push(p+' -> '+r)}
 }
 assert.deepEqual(bad,[]);
 assert.ok(literals().length>=90,'scanned '+literals().length+' literals');
});

test('English: composed lines (boss name + phase, course label with the act count, the boss tag) translate', () => {
 const T=translator();
 for(const id of Boss.BY_N.slice(1)){
  const D=Boss.BOSSES[id];
  for(const p of D.phases)for(const l of [D.name+' · '+p.name,p.tele,p.coach,...Object.values(p.cause)]){const r=T.translate(l,'en');assert.ok(r!==null&&!HANGUL.test(r),id+': '+l+' -> '+r)}
  for(const l of [D.name,D.sub,D.clear,D.win]){const r=T.translate(l,'en');assert.ok(r!==null&&!HANGUL.test(r),id+': '+l+' -> '+r)}
 }
 for(const c of Course.allCourses().filter(c=>c.boss&&!c.bossPlaceholder)){const l=c.title+' · 1/1 보스',r=T.translate(l,'en');assert.ok(r!==null&&!HANGUL.test(r),l+' -> '+r)}
 assert.equal(T.translate('고스트','en'),'Ghost');assert.equal(T.translate('큐브','en'),'The Cube');
});

test('Korean voice: telegraph and coach lines are short banmal, cause lines polite and specific, nothing longer than the banner can hold', () => {
 for(const id of Boss.BY_N.slice(1)){
  const D=Boss.BOSSES[id];assert.ok(D.name.length<=8&&D.sub.length<=16,id);
  for(const p of D.phases){
   assert.ok(p.name.length<=8,p.name);assert.ok(p.tele.length<=24,p.tele);assert.ok(p.coach.length<=24,p.coach);assert.doesNotMatch(p.tele+p.coach,/(니다|세요|하십시오)\.?$/,id);
   for(const c of Object.values(p.cause)){assert.match(c,/(요|어요|았어요|렸어요)$/,c);assert.ok(c.length<=22,c)}
  }
  assert.doesNotMatch(D.clear,/(니다|요)$/);
 }
});
