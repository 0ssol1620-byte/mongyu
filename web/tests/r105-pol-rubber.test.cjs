const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
for(const f of ['trip-palettes','items','opening-run','illusion-course','helix-act','penrose-act','endless-dream'])require('../src/'+f+'.js');
require('../src/chapters.js');require('../src/square-act.js');const Course=require('../src/course-run.js');const Psy=require('../src/psy-layer.js');
const Ill=globalThis.MongyuIllusion,Trip=globalThis.MongyuTrip;
const VP={width:390,height:844},DT=1/120;
const chain=(o={})=>({index:0,count:1,first:true,last:true,carry:{points:0,shards:0,perfectStreak:0,hearts:1},bpm:88,seed:5,...o});

test('rubber floor: +-6 % squash in a rhythm of at least 1.5 s, block and runner sizes within +-12 %', () => {
 const R=Ill.RUBBER;assert.ok(R.period>=1.5);assert.ok(R.squash<=.06+1e-9&&R.scale<=.12+1e-9);
 let lo=9,hi=0;for(let t=0;t<R.period*2;t+=.01){const q=Ill.rubberSquash(t);lo=Math.min(lo,q);hi=Math.max(hi,q)}
 assert.ok(lo>=.94-1e-6&&hi<=1.06+1e-6&&hi-lo>.1,lo+' '+hi);
 for(let i=0;i<24;i++){const s=Ill.blockScale(i);assert.ok(s>=.88-1e-9&&s<=1.12+1e-9)}
 assert.notEqual(Ill.blockScale(0),Ill.blockScale(1));
 const run=Course.resolveAct('bridge')({rubber:true,preset:'garden',viewport:VP,settings:{},chain:chain()});
 for(let s=0;s<run.cs.FINISH;s+=3){const k=Ill.runnerScale(run.cs.COURSE,s);assert.ok(k>=.88-1e-9&&k<=1.12+1e-9)}
});

test('rubber floor: the hitbox is the visible (scaled) block, off by default', () => {
 const mk=rubber=>{const r=Course.resolveAct('bridge')({rubber,preset:'garden',viewport:VP,settings:{},chain:chain()});r.start();r.intro=0;return r};
 for(const rubber of [false,true]){
  const r=mk(rubber),b=r.cs.COURSE.blocks[0],bs=rubber?Ill.blockScale(0):1;
  r.slowChance='done';
  r.distance=b.at-(Ill.BLOCK*bs+Ill.FOOT*1.12)-3;r.blockIndex=0;r.height=0;
  r.tick(DT);assert.equal(r.crash,null,'outside the scaled footprint, rubber='+rubber);
  r.distance=b.at-(Ill.BLOCK*bs+Ill.FOOT*r.rs)+1;r.tick(DT);assert.ok(r.crash,'inside the scaled footprint, rubber='+rubber);
 }
 assert.equal(mk(false).rubber,false);assert.equal(mk(true).rubber,true);
});

test('chapter 2: bridge and floor-wall acts are rubber, other chapters and acts are not; telegraphs stay >= 700 ms', () => {
 const ch=Course.CHAPTERS.find(c=>c.number===2);let rubbers=0;
 for(const co of ch.courses)for(const a of co.acts){const want=a.type==='bridge'||a.type==='floor-wall';assert.equal(a.opts.rubber===true,want,co.id+' '+a.type);if(want)rubbers++}
 assert.ok(rubbers>=8);
 for(const other of Course.CHAPTERS.filter(c=>c.number!==2))for(const co of other.courses)for(const a of co.acts)assert.ok(!a.opts.rubber,co.id);
 for(const co of ch.courses)for(const a of co.acts.filter(q=>q.type==='bridge')){
  /* rubber changes sizes only: block and gap positions equal the plain course, a double block (0.68 s apart, as authored) stays one flight (0.64 s) apart,
     and the coach telegraph for a block starts 90 units (1.3 s) ahead */
  const run=Course.resolveAct('bridge')({...a.opts,viewport:VP,settings:{},chain:chain()}),plain=Course.resolveAct('bridge')({...a.opts,rubber:false,viewport:VP,settings:{},chain:chain()}),C=run.cs.COURSE,ev=[];
  assert.deepEqual(C.blocks.map(b=>b.at),plain.cs.COURSE.blocks.map(b=>b.at));assert.deepEqual(C.gaps.map(g=>[g.s0,g.s1]),plain.cs.COURSE.gaps.map(g=>[g.s0,g.s1]));
  for(const b of C.blocks)ev.push(b.at);ev.sort((x,y)=>x-y);
  for(let i=1;i<ev.length;i++)assert.ok((ev[i]-ev[i-1])/Ill.SPEED>=Ill.FLIGHT,co.id+' spacing '+((ev[i]-ev[i-1])/Ill.SPEED).toFixed(2));
  assert.ok(90/Ill.SPEED>=.7);
 }
});

test('light palettes: HUD ink is the palette ink, dark palettes keep the cream text', () => {
 for(const k of ['c1','c2','c3','c4','c5','c6','c7','c10']){const h=Trip.hud(k);assert.equal(h.fill,Trip.get(k).ink);assert.ok(Trip.hex(h.fill).every(v=>v<90),k)}
 for(const k of ['c8','c9','violet']){const h=Trip.hud(k);assert.equal(h.fill,'#fff3d6')}
 const d=Trip.ink('c1');assert.ok(Trip.hex(d.dangerLine).every(v=>v<90),'bold dark outline');assert.ok(Trip.hex(d.tapLine).every(v=>v<120),'dark gold outline');
});

test('psy layer on light palettes: one violet-magenta family (hue spread <= 60 degrees)', () => {
 const hue=h=>{const [r,g,b]=Trip.hex(h).map(v=>v/255),mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;const q=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return (q*60+360)%360};
 for(const k of ['c1','c2','c3','c4','c5','c6','c7','c10']){
  const p=Psy.paletteOf(k),hs=[p.rim,p.rim2,p.glow,p.rimL,p.glowL,p.rimD,p.rim2D,p.glowD].map(hue);
  assert.ok(Math.max(...hs)-Math.min(...hs)<=60,k+' '+hs.map(Math.round));
  assert.ok(Math.min(...hs)>=240&&Math.max(...hs)<=330,k);
 }
 assert.ok(Psy.PARAMS.washLight<=.3);
});
