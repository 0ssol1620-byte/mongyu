const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;
const Opening=require('../src/opening-run.js'),Illusion=require('../src/illusion-course.js'),Course=require('../src/course-run.js');
const VP={width:390,height:844},DT=1/120;
const CHAIN=(o={})=>({index:0,count:2,first:true,last:false,carry:{points:0,shards:0,perfectStreak:0,hearts:1},bpm:100,seed:1,...o});

test('chained IllusionRun: custom plan, carried points, instant clear unless it is the last act, no intro or teaching', () => {
 const mid=new Illusion.IllusionRun({viewport:VP,attempt:1,plan:Course.BRIDGES.dawn,chain:CHAIN({carry:{points:500,shards:3,perfectStreak:2,hearts:1}})});
 assert.equal(mid.intro,0);assert.equal(mid.slowChance,'done');assert.equal(mid.points,500);assert.equal(mid.perfectStreak,2);assert.equal(mid.score,500);assert.equal(mid.coach,null);
 const last=new Illusion.IllusionRun({viewport:VP,attempt:1,plan:Course.BRIDGES.dawn,chain:CHAIN({last:true,first:false})});
 const drive=run=>{run.start();let outro=false;for(let i=0;i<120*60&&run.state==='play';i++){const c=run.cs.COURSE,g=run.activeGap();if(g){const a=g.s0-run.distance;if(a<=90&&a>10)run.action()}else{const b=c.blocks[run.blockIndex];if(b&&b.at-run.distance<=Illusion.SPEED*Illusion.FLIGHT/2+.5&&run.flight===null)run.action()}run.tick(DT);if(run.outro)outro=true}return outro};
 assert.equal(drive(mid),false);assert.equal(mid.state,'clear');assert.equal(mid.outro,null);
 assert.ok(mid.result.points>=500+100);assert.ok(mid.result.shards>0);
 assert.equal(drive(last),true);assert.equal(last.state,'clear');
 const tut=new Illusion.IllusionRun({viewport:VP,attempt:1,plan:Course.BRIDGES.intro,tutorial:true,chain:CHAIN()});assert.equal(tut.slowChance,'pending')});

test('chained OpeningRun: spans, end line, beat grid, carried points, no clear outro unless last', () => {
 const mk2=(o,c)=>new Opening.OpeningRun({slot:Course.SLOT,attempt:1,viewport:VP,settings:{},span:[0,1],chain:CHAIN(c),...o});
 const a=mk2({},{carry:{points:900,shards:0,perfectStreak:3,hearts:1}});
 assert.equal(a.points,900);assert.equal(a.perfectStreak,3);assert.equal(a.endIndex,4);assert.equal(a.tutorial,false);assert.equal(a.wallCoached,false);
 assert.ok(a.endAt<Opening.FINISH);
 const b=mk2({span:[1,2]},{first:false});assert.equal(b.distance,Opening.SECTIONS[1].start);assert.equal(b.firstIndex,2);assert.equal(b.wallCoached,true);assert.equal(b.status().progress,0);
 let outro=false;const fly=run=>{run.start();for(let i=0;i<120*40&&run.state==='play';i++){const o=run.obstacles[run.index];if(o&&o.at-run.distance<=Opening.PERFECT_LEAD+1&&run.flight===null)run.action();run.tick(DT);if(run.outro)outro=true}};
 fly(a);
 assert.equal(a.state,'clear');assert.equal(outro,false);assert.equal(a.distance,a.endAt);
 assert.ok(a.result.points>=900+150);assert.equal(a.result.shards,4);assert.equal(a.result.shardTotal,4);assert.equal(a.status().progress,1);
 const full=mk2({span:[0,2]},{last:true});fly(full);
 assert.equal(outro,true);assert.equal(full.state,'clear');assert.ok(full.points>=500)});

test('runs without chain keep their R104 defaults', () => {
 const il=new Illusion.IllusionRun({viewport:VP});assert.equal(il.cs.COURSE,Illusion.COURSE);assert.equal(il.sections,Illusion.SECTIONS);assert.ok(il.intro>0);assert.equal(il.slowChance,'pending');
 const op=new Opening.OpeningRun({slot:Course.SLOT,attempt:1,viewport:VP,settings:{}});assert.equal(op.obstacles,Opening.OBSTACLES);assert.equal(op.endAt,Opening.FINISH);assert.equal(op.endIndex,6);assert.equal(op.tutorial,true)});

test('a CourseRun draws its child and the gate on a mock canvas without throwing, including reduced motion', () => {
 const calls=[],c=new Proxy({canvas:{width:390,height:844}},{get:(o,k)=>k in o?o[k]:(k==='createLinearGradient'||k==='createRadialGradient')?()=>({addColorStop(){}}):k==='measureText'?()=>({width:40}):()=>{calls.push(k)},set:(o,k,v)=>(o[k]=v,true)});
 globalThis.MongyuMobile={sprite(){}};const hadPath=typeof Path2D!=='undefined',errors=[],err=console.error;console.error=(...a)=>errors.push(a);
 if(!hadPath)globalThis.Path2D=class{moveTo(){}lineTo(){}arc(){}rect(){}closePath(){}quadraticCurveTo(){}bezierCurveTo(){}ellipse(){}arcTo(){}};
 try{
  const run=new Course.CourseRun({...Course.courseById('c1'),viewport:VP,settings:{},attempt:1});run.start();
  const opts={viewport:VP,reduced:false,time:0};
  for(let i=0;i<120*40&&!run.portal;i++){const ch=run.child,o=ch.obstacles[ch.index];if(ch.slowChance==='active'&&ch.distance>=ch.obstacles[0].at-80||o&&o.at-ch.distance<=Opening.PERFECT_LEAD+1&&ch.flight===null)run.action();run.tick(DT);if(i%12===0)run.drawSelf(c,opts)}
  assert.ok(run.portal,'reached a gate');
  for(let i=0;i<10;i++){run.tick(DT*10);run.drawSelf(c,{...opts,reduced:true})}
  assert.ok(calls.length>50);assert.deepEqual(errors,[])
 }finally{delete globalThis.MongyuMobile;console.error=err;if(!hadPath)delete globalThis.Path2D}});
