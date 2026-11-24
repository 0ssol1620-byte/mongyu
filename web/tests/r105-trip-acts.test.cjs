const {test}=require('node:test'),assert=require('node:assert/strict');
/* R105 wave 3 (TR): every act renders the dark psychedelic look from a MongyuTrip palette (option `trip`, default violet). */
globalThis.MONGYU_POLISH_EDITION=true;globalThis.MONGYU_UI_EDITION=true;
class Path2D{constructor(){}moveTo(){}lineTo(){}closePath(){}rect(){}arc(){}ellipse(){}bezierCurveTo(){}quadraticCurveTo(){}addPath(){}}
globalThis.Path2D=Path2D;globalThis.MongyuMobile={sprite(){}};
const Trip=require('../src/trip-palettes.js');
const Opening=require('../src/opening-run.js'),Illusion=require('../src/illusion-course.js'),Helix=require('../src/helix-act.js'),Penrose=require('../src/penrose-act.js'),Course=require('../src/course-run.js');
const W=390,H=844,VP={width:W,height:H},KEYS=['violet','aqua','ember','toxic','heart'],LIGHT=['c1','c2','c3','c4','c5','c6','c7','c10'],DARKC=['c8','c9'];
const rgbOf=col=>{
 if(typeof col!=='string')return null;
 if(col[0]==='#'){const h=col.length===4?col.slice(1).replace(/./g,'$&$&'):col.slice(1);const n=parseInt(h.slice(0,6),16);return [n>>16&255,n>>8&255,n&255,1]}
 const m=/rgba?\(([^)]+)\)/.exec(col);if(!m)return null;const v=m[1].split(',').map(Number);return [v[0],v[1],v[2],v.length>3?v[3]:1];
};
const luma=c=>(.2126*c[0]+.7152*c[1]+.0722*c[2])/255;
const hueOf=c=>{const [r,g,b]=c,mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(mx-mn<28)return null;const d=mx-mn,h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return (h*60+360)%360};
const hdist=(a,b)=>{const d=Math.abs(a-b);return Math.min(d,360-d)};
/* Recording canvas: logs every fill with the luminance of the fillStyle that was active, every colour stop, every stroke colour, and flags non-finite numbers. */
function recorder(){
 const log={bad:[],fills:[],stops:[],strokes:[],calls:0},st={fillStyle:'#000',strokeStyle:'#000'};
 const grad={addColorStop(o,col){log.stops.push(col)}};
 const ctx=new Proxy({canvas:{width:W,height:H}},{
  get(o,k){
   if(k==='__log')return log;
   if(k in st)return st[k];
   if(k in o)return o[k];
   if(k==='createLinearGradient'||k==='createRadialGradient')return()=>grad;
   if(k==='measureText')return t=>({width:String(t).length*9});
   if(k==='getTransform')return()=>({});
   return(...a)=>{log.calls++;
    if(k==='fill'||k==='fillRect')log.fills.push(st.fillStyle);
    if(k==='stroke'||k==='strokeRect')log.strokes.push(st.strokeStyle);
    for(const v of a)if(typeof v==='number'&&!Number.isFinite(v))log.bad.push(k+':'+a.join(','))};
  },
  set(o,k,v){if(k in st)st[k]=v;else o[k]=v;return true}
 });
 return {ctx,log};
}
const STOPS={};
const frame=(run,reduced=false,tag)=>{const r=recorder();run.drawSelf(r.ctx,{viewport:VP,reduced,time:run.time});if(tag)(STOPS[tag]=STOPS[tag]||[]).push(...r.log.stops);return r.log};
const course=(act,trip,extra={})=>new Course.CourseRun({id:'c1',title:'t',bpm:100,seed:101,...(trip?{trip}:{}),acts:[act],viewport:VP,settings:{},...extra});
const ACTS={
 'floor-wall':{type:'floor-wall',opts:{span:[0,2]},weight:10},bridge:{type:'bridge',opts:{preset:'garden',tone:1},weight:25},
 'helix-up':{type:'helix-up',opts:{},weight:16},'helix-down':{type:'helix-down',opts:{},weight:14},penrose:{type:'penrose',opts:{},weight:16},align:{type:'align',opts:{},weight:7}
};
function advance(run,seconds){run.start();for(let i=0;i<seconds*60;i++){run.tick(1/60);if(run.state!=='play')break}}

test('trip palettes: danger is distinct from the scene hues, meaning inks are colour-blind aware', () => {
 for(const key of KEYS){
  const ink=Trip.ink(key),p=Trip.get(key),dh=hueOf(Trip.hex(ink.danger));
  for(const n of ['rim','rim2','glow'])assert.ok(hdist(dh,hueOf(Trip.hex(p[n])))>=30,key+': danger vs '+n);
  assert.ok(ink.dangerTop&&ink.dangerSide&&ink.dangerLine&&/^\d+,\d+,\d+$/.test(ink.dangerRgb));
  const f=Trip.face(key);assert.ok(luma(Trip.hex(f.top))<.45&&luma(Trip.hex(f.front))<.3&&luma(Trip.hex(f.side))<.2,key+' faces are dark');
 }
 assert.equal(Trip.ink('nope').danger,Trip.ink('violet').danger);
 globalThis.document={documentElement:{dataset:{cvd:'on'}}};
 try{for(const key of KEYS){const i=Trip.ink(key),[r,,b]=Trip.hex(i.danger);assert.ok(b>r,key+' cvd danger leans blue');assert.equal(i.tap,'#ffe14d')}}
 finally{delete globalThis.document}});

test('CourseRun passes the course trip (or the act trip, default violet) to every child act', () => {
 for(const [type,act] of Object.entries(ACTS)){
  assert.equal(course(act).child.trip||course(act).child.trip,'violet',type+' default');
  assert.equal(course(act,'aqua').child.trip,'aqua',type+' course trip');
  assert.equal(course({...act,opts:{...act.opts,trip:'heart'}},'aqua').child.trip,'heart',type+' act trip wins');
 }
 globalThis.MONGYU_UI_EDITION=false;
 try{for(const [type,act] of Object.entries(ACTS))assert.equal(course(act,'aqua').child.trip??null,null,type+' R104: no trip look')}
 finally{globalThis.MONGYU_UI_EDITION=true}});

test('every act draws all 15 trips (5 dark, 8 light calm, 2 dark chapters) without invalid geometry', () => {
 for(const key of [...KEYS,...LIGHT,...DARKC])for(const [type,act] of Object.entries(ACTS)){
  const run=course(act,key);
  let log=frame(run,false,type+'|'+key);assert.deepEqual(log.bad,[],type+' '+key+' fresh');assert.ok(log.calls>30,type+' '+key+' draws');
  advance(run,6);log=frame(run);assert.deepEqual(log.bad,[],type+' '+key+' mid');
  log=frame(run,true);assert.deepEqual(log.bad,[],type+' '+key+' reduced');
 }});

test('skies are dark in every act and dark palette (no pastel gradient stops); light palettes are light', () => {
 let checked=0;
 for(const key of [...KEYS,...DARKC])for(const type of Object.keys(ACTS)){
  const sky=(STOPS[type+'|'+key]||[]).map(rgbOf).filter(c=>c&&c[3]===1).slice(0,3);   // the sky gradient is the first gradient every act builds (cached gradients are not rebuilt)
  for(const c of sky){assert.ok(luma(c)<.4,type+' '+key+' sky stop '+c.slice(0,3)+' luma '+luma(c).toFixed(2));checked++}
 }
 assert.ok(checked>60,'checked '+checked+' sky stops');
 for(const key of LIGHT){const sky=(STOPS['bridge|'+key]||[]).map(rgbOf).filter(c=>c&&c[3]===1).slice(0,2);assert.ok(sky.length&&sky.every(c=>luma(c)>.5),key+' light sky')}});

test('no pastel faces: bright fills are a small minority in the dark trip looks, far more in the R104 look', () => {
 const count=(act,trip)=>{const run=course(act,trip);advance(run,5);const log=frame(run);let n=0,b=0;
  for(const f of log.fills){const c=rgbOf(f);if(!c||c[3]<.9)continue;n++;if(luma(c)>.55)b++}return [n,b]};
 const share=(trip)=>{let n=0,b=0;for(const act of Object.values(ACTS)){const r=count(act,trip);n+=r[0];b+=r[1]}return b/n};
 let worst=0;
 for(const key of [...KEYS,...DARKC]){const s=share(key);worst=Math.max(worst,s);assert.ok(s<=.4,key+' bright fill share '+s.toFixed(2))}
 globalThis.MONGYU_UI_EDITION=false;let old;
 try{old=share('violet')}finally{globalThis.MONGYU_UI_EDITION=true}
 assert.ok(old>worst*1.15,'the R104 look is brighter ('+old.toFixed(2)+' vs '+worst.toFixed(2)+')')});

test('obstacles use the palette danger colour and the gate rings use the 2-3 hue family, not a rainbow', () => {
 for(const key of KEYS){
  const ink=Trip.ink(key),p=Trip.get(key),fam=[p.rim,p.rim2,p.glow].map(c=>hueOf(Trip.hex(c)));
  // illusion block faces
  const run=course(ACTS.bridge,key);advance(run,4);const log=frame(run);
  assert.ok(log.fills.includes(ink.danger)||log.fills.includes(ink.dangerTop),key+' draws danger faces');
  // gate transition rings
  const two=new Course.CourseRun({id:'c1',title:'t',bpm:100,seed:101,trip:key,acts:[ACTS.bridge,ACTS.penrose],viewport:VP,settings:{}});
  two.portal={age:.25,duration:.6,swapped:false,reduced:false,snap:null,snapped:false};
  const r=recorder();Course.draw(r.ctx,two,{viewport:VP,reduced:false,time:0});
  const rings=r.log.strokes.filter(x=>/,\.9\)$|,\.4\)$/.test(x)).map(rgbOf).filter(c=>c&&c[3]>0&&hueOf(c)!==null);
  assert.ok(rings.length>=3,key+' gate rings are drawn');
  for(const c of rings)assert.ok(fam.some(h=>hdist(h,hueOf(c))<=24),key+' ring colour '+c.slice(0,3)+' is in the palette family');
  assert.equal(new Set(rings.map(c=>Math.floor(hueOf(c)/40))).size<=3,true,key+' ring hues');
 }});

test('light calm chapters: dark ink outline (not neon), light sky, shadows soft; dark chapters stay dark', () => {
 for(const key of LIGHT){
  const p=Trip.get(key),f=Trip.face(key),ink=Trip.ink(key);
  assert.equal(p.light,true,key);assert.ok(luma(Trip.hex(p.rim))<.3,key+' rim is a dark ink line');assert.ok(luma(Trip.hex(p.sky[1]))>.55,key+' sky is light');
  assert.ok(luma(Trip.hex(f.top))>luma(Trip.hex(f.side))+.15,key+' path top is lighter than its sides (the near-black runner must contrast with it)');
  assert.ok(luma(Trip.hex(f.top))>.6,key+' path top luminance '+luma(Trip.hex(f.top)).toFixed(2));
  assert.ok(luma(Trip.hex(ink.danger))<.55&&luma(Trip.hex(ink.danger))>.1,key+' danger is saturated, not pastel');
  const dh=hueOf(Trip.hex(ink.danger)),ah=hueOf(Trip.hex(p.accent));void ah;
  assert.ok(dh!==null,key+' danger has a hue');
 }
 for(const key of DARKC){const p=Trip.get(key);assert.ok(!p.light);assert.ok(luma(Trip.hex(p.sky[1]))<.2,key+' sky dark')}
 assert.equal(Trip.get('c8').sky[1].toLowerCase(),'#26223d');assert.equal(Trip.get('c8').rim.toLowerCase(),'#a95bdc');assert.equal(Trip.get('c8').accent.toLowerCase(),'#64d8cc');
 assert.equal(Trip.keys.length,15)});
