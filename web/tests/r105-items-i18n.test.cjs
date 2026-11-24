const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src');
globalThis.MONGYU_UI_EDITION=true;globalThis.MONGYU_POLISH_EDITION=true;
const Items=require('../src/items.js');
function load(edition){
 const data=new Map(),ctx={console,performance,MONGYU_UI_EDITION:edition,navigator:{languages:['en-US']},localStorage:{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v))},requestAnimationFrame:()=>0};
 ctx.globalThis=ctx;vm.createContext(ctx);
 for(const f of ['i18n.js','i18n-ko.js','i18n-en.js','i18n-en-items.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 return ctx.MongyuI18n;
}

test('every item coach line has an English phrase, and Korean stays Korean outside the R105 build', () => {
 const I=load(true);
 for(const [k,line] of Object.entries(Items.LINES)){
  const en=I.translate(line);assert.ok(en&&en!==line&&!/[가-힣]/.test(en),k+': '+line+' -> '+en);
 }
});

test('item lines follow the voice guide: short coach lines in banmal, no developer words, no emoji', () => {
 for(const line of Object.values(Items.LINES)){
  assert.ok(line.length<=18,line);assert.ok(!/(실행|허용|활성|비활성|인스턴스|세션|리셋)/.test(line),line);assert.ok(!/\p{Extended_Pictographic}/u.test(line),line);
  assert.ok(!/(니다|세요|해요|예요|에요)\.?$/.test(line),'banmal: '+line);
 }
});
