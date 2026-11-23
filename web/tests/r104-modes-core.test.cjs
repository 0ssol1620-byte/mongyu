const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;
const Endless=require('../src/endless-dream.js'),Illusion=require('../src/illusion-course.js');
test('daily seed is stable for a date and differs between days',()=>{
 const a=Endless.dailySeed(new Date(2026,10,23)),b=Endless.dailySeed(new Date(2026,10,23,22)),c=Endless.dailySeed(new Date(2026,10,24));
 assert.equal(a,b);assert.notEqual(a,c)});
test('same seed generates the same obstacle course, one life',()=>{
 const x=new Endless.EndlessRun({seed:12345,viewport:{width:390,height:844}}),y=new Endless.EndlessRun({seed:12345,viewport:{width:390,height:844}});
 assert.deepEqual(x.obstacles.slice(0,3).map(o=>[o.kind,o.at]),y.obstacles.slice(0,3).map(o=>[o.kind,o.at]));
 assert.ok(x.obstacles.length>=1)});
test('an unplayed endless run fails on its own obstacle and daily retry keeps the seed while endless retry reseeds',()=>{
 const r=new Endless.EndlessRun({daily:true,seed:777,viewport:{width:390,height:844}});r.start();
 for(let i=0;i<600&&r.state==='play';i++)r.tick(1/60);
 assert.equal(r.state,'fail');const s=r.seed;r.retry();assert.equal(r.seed,s);assert.equal(r.state,'play');const e=new Endless.EndlessRun({seed:5,viewport:{width:390,height:844}});e.start();e.retry();assert.notEqual(e.seed,5)});
test('illusion course has gold gaps authored in order',()=>{
 assert.ok(Illusion.COURSE.gaps.length>=3);
 for(let i=1;i<Illusion.COURSE.gaps.length;i++)assert.ok(Illusion.COURSE.gaps[i].s0>Illusion.COURSE.gaps[i-1].s0)});
