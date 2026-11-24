// R105 ACC: effects profile model, persistence, defaults, events, host sync, strings.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'..','src');
function load({edition=true,store={},systemReduced=false,host=null}={}){
 const data=new Map(Object.entries(store)),writes=[];
 const ctx={console,MONGYU_UI_EDITION:edition,
  matchMedia:q=>({matches:/reduce/.test(q)&&systemReduced}),
  localStorage:{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>{data.set(k,String(v));writes.push(k)}},setTimeout:()=>0};
 if(host)ctx.MongyuPolish={host:{settings:()=>host}};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(SRC,'effects-profile.js'),'utf8'),ctx,{filename:'effects-profile.js'});
 return {E:ctx.MongyuEffects,data,writes,ctx};
}
const KEY='mongyu.r105.effects';

test('inert outside the UI edition: every channel is 1 and nothing is stored', () => {
 const {E,data}=load({edition:false});
 for(const c of E.CHANNELS)assert.equal(E.value(c),1);
 assert.equal(E.set('minimal'),false);assert.equal(data.size,0);
});

test('default is Standard, or Reduced when the OS asks for reduced motion; the first-run sheet is still unseen', () => {
 assert.equal(load().E.get().level,'standard');
 const r=load({systemReduced:true}).E.get();assert.equal(r.level,'reduced');assert.equal(r.system,true);assert.equal(r.seen,false);
});

test('level table: Standard full, Reduced no shake and gentle, Minimal everything off', () => {
 const {E}=load();
 assert.deepEqual(E.CHANNELS.map(c=>E.value(c)),E.CHANNELS.map(()=>1));
 E.set('reduced');assert.equal(E.value('shake'),0);assert.ok(E.value('bgmotion')>0&&E.value('bgmotion')<.5);assert.ok(E.value('psy')>0&&E.value('psy')<1);assert.equal(E.feverStyle(),'soft');
 E.set('minimal');for(const c of [...E.CHANNELS,'flash','gate'])assert.equal(E.value(c),0,c);assert.equal(E.feverStyle(),'outline');assert.equal(E.echoCount(3),0);assert.equal(E.scaleMs(40),0);
 E.set('standard');assert.equal(E.feverStyle(),'full');assert.equal(E.echoCount(3),3);assert.equal(E.scaleMs(40),40);
});

test('per-channel overrides: set, clear, reset, and choosing a level drops them', () => {
 const {E}=load();
 assert.ok(E.set('shake',0));assert.equal(E.value('shake'),0);assert.equal(E.get().custom,true);assert.equal(E.value('zoom'),1);
 assert.ok(E.set('shake',null));assert.equal(E.value('shake'),1);assert.equal(E.get().custom,false);
 E.set('psy',.2);E.set('echo',0);E.reset();assert.equal(E.get().custom,false);
 E.set('haptics',0);E.set('reduced');assert.deepEqual({...E.get().overrides},{});
 assert.equal(E.set('nonsense'),false);assert.equal(E.set('shake','x'),false);assert.equal(E.set('text',111),false);
 E.set('psy',5);assert.equal(E.value('psy'),1);
});

test('persisted under mongyu.r105.effects and restored; bad data falls back', () => {
 const a=load();a.E.set('minimal');a.E.set('echo',.5);a.E.set('text',140);
 const saved=a.data.get(KEY);assert.ok(saved);
 const b=load({store:{[KEY]:saved}}).E.get();assert.equal(b.level,'minimal');assert.equal(b.overrides.echo,.5);assert.equal(b.text,140);assert.equal(b.seen,true);
 assert.equal(load({store:{[KEY]:'{bad'}}).E.get().level,'standard');
 assert.equal(load({store:{[KEY]:JSON.stringify({level:'weird',text:3,ov:{shake:9,x:1}})}}).E.get().text,100);
 assert.equal(load({systemReduced:true,store:{[KEY]:JSON.stringify({v:1,level:'standard',seen:true})}}).E.get().level,'standard');
});

test('on(change) fires for levels, channels and text, and can be unsubscribed', () => {
 const {E}=load();const seen=[];const off=E.on('change',d=>seen.push(d.level+':'+d.values.shake));
 E.set('reduced');E.set('shake',1);E.set('text',120);assert.deepEqual(seen,['reduced:0','reduced:1','reduced:1']);
 off();E.set('minimal');assert.equal(seen.length,3);
});

test('the legacy app setting follows the level: Reduced/Minimal set settings.reduced, Standard clears it', () => {
 const host={reduced:false,dreamIntensity:'balanced'};
 const {E}=load({host});
 E.set('reduced');assert.equal(host.reduced,true);E.set('standard');assert.equal(host.reduced,false);E.set('minimal');assert.equal(host.reduced,true);
 E.set('standard');E.set('bgmotion',0);assert.equal(host.reduced,true,'turning background motion off uses the reduced drawing path');
 E.reset();assert.equal(host.reduced,false);
 assert.equal(host.dreamIntensity,'balanced','dream intensity is left alone');
});

test('Korean and English strings exist for every key the UI uses', () => {
 const ko=fs.readFileSync(path.join(SRC,'effects-profile.js'),'utf8'),en=fs.readFileSync(path.join(SRC,'i18n-en-effects.js'),'utf8');
 const keys=[...ko.slice(ko.indexOf('const KO={'),ko.indexOf('function L(key')).matchAll(/'(fx\.[\w.]+)':/g)].map(m=>m[1]);
 assert.ok(keys.length>45);
 for(const k of keys)assert.ok(en.includes("'"+k+"'"),'missing English for '+k);
 for(const k of ['fx.level.standard','fx.level.reduced','fx.level.minimal','fx.adv','fx.first.title','fx.first.go','fx.first.skip','fx.text','fx.ch.haptics'])assert.ok(keys.includes(k),k);
 assert.ok(/'Standard'/.test(en)&&/'Reduced'/.test(en)&&/'Minimal'/.test(en));
 for(const lv of ['standard','reduced','minimal']){const m=new RegExp("'fx\\.levelSub\\."+lv+"':'([^']+)'").exec(ko);assert.ok(m&&m[1].length<=24,lv+' sub '+(m&&m[1].length))}
});

test('sources.json registers the profile before every act and the English table right after it', () => {
 const list=JSON.parse(fs.readFileSync(path.join(SRC,'..','sources.json'),'utf8'));
 const i=list.indexOf('effects-profile.js');assert.ok(i>0);
 assert.equal(list.indexOf('i18n-en-effects.js'),i+1);
 assert.ok(list.indexOf('i18n-en-screens.js')<i);
 for(const a of ['opening-run.js','illusion-course.js','helix-act.js','penrose-act.js','square-act.js','course-run.js','psy-layer.js','play-juice.js','ui-kit.js','lobby-scene.js'])assert.ok(list.indexOf(a)>i,a);
});
