const {test}=require('node:test'),assert=require('node:assert/strict');
globalThis.MONGYU_POLISH_EDITION=true;
const P=require('../src/penrose-act.js');
const C=Math.cos(Math.PI/6);
const iso=(x,y,z)=>({x:(x-z)*C,y:(x+z)*.5-y});
const ctxStub=()=>new Proxy({},{get:(o,k)=>k in o?o[k]:k==='measureText'?()=>({width:40}):(k==='createLinearGradient'||k==='createRadialGradient')?()=>({addColorStop(){}}):()=>{},set:(o,k,v)=>(o[k]=v,true)});

test('the module is exported and enabled with the polish flag',()=>{
 assert.equal(P.enabled,true);assert.equal(typeof P.PenroseRun,'function');assert.equal(typeof P.AlignRun,'function');assert.equal(globalThis.MongyuPenrose,P)});

test('the four flights close into a loop on screen although the stair climbs one spiral turn',()=>{
 const L=P.LOOP,F=L.F;
 assert.equal(F.length,4);assert.equal(L.closure,0);
 // Real 3D: the end of flight 4 is displaced by (T,T,T) from the start; screen projection is identical.
 const a=iso(F[0].x0,F[0].y0,F[0].z0),b=iso(F[3].x1,F[3].y1,F[3].z1);
 assert.ok(Math.abs(a.x-b.x)<1e-9&&Math.abs(a.y-b.y)<1e-9);
 assert.ok(Math.abs(F[3].x1-F[0].x0-L.T)<1e-9&&Math.abs(F[3].z1-F[0].z0-L.T)<1e-9&&Math.abs(F[3].y1-F[0].y0-L.T)<1e-9);
 assert.ok(L.T>30);
 // Every flight ascends and starts where the previous one ended.
 for(let k=0;k<4;k++){assert.ok(F[k].h>0&&F[k].n>=3);if(k)assert.ok(Math.abs(F[k].x0-F[k-1].x1)+Math.abs(F[k].z0-F[k-1].z1)+Math.abs(F[k].y0-F[k-1].y1)<1e-9)}
 assert.ok(Math.abs(P.LAP-F.reduce((s,f)=>s+f.len,0))<1e-9);assert.equal(P.FINISH,P.LAP*2)});

test('depth order is a permutation and runner support blocks are ranked along the whole path',()=>{
 const L=P.LOOP;assert.equal(L.blocks.length,L.all.length);assert.deepEqual(L.blocks.map(b=>b.rank),L.blocks.map((_,i)=>i));
 const o={};let last=-1;
 for(let s=0;s<P.FINISH;s+=3){P.pathAt(s,o);assert.ok(Number.isInteger(o.block.rank),'support at '+s);assert.ok(Number.isFinite(o.x+o.y+o.z))}
 // Position is continuous along the path, including across corners (jumps only at the invisible (T,T,T) seam).
 let prev=P.pathAt(0,{});
 for(let s=.5;s<P.LAP;s+=.5){const q=P.pathAt(s,{});const d=iso(q.x,q.y,q.z),e=iso(prev.x,prev.y,prev.z);assert.ok(Math.hypot(d.x-e.x,d.y-e.y)<2,'screen continuity at '+s);prev=q}
 const end=P.pathAt(P.LAP-1e-6,{}),start=P.pathAt(P.LAP,{}),e1=iso(end.x,end.y,end.z),s1=iso(start.x,start.y,start.z);
 assert.ok(Math.hypot(e1.x-s1.x,e1.y-s1.y)<1e-3,'seam is invisible on screen');
 assert.ok(P.climbAt(P.LAP+10)>P.climbAt(10)+P.LOOP.T-1,'second lap is higher');void last});

test('stair steps rise within each flight and landings are flat',()=>{
 const L=P.LOOP;
 for(let k=0;k<4;k++){const t=L.treads[k];assert.equal(t.length,L.F[k].n);for(let j=1;j<t.length;j++)assert.ok(t[j].top>t[j-1].top)}
 for(const l of L.lands)assert.ok(l.box[3]>=0)});

test('obstacles are deterministic, sit on the beat grid of each lap and keep clear of the seam',()=>{
 const a=P.makeCourse(100,7),b=P.makeCourse(100,7),c=P.makeCourse(120,7);
 assert.deepEqual(a.obstacles.map(o=>o.at),b.obstacles.map(o=>o.at));
 assert.notDeepEqual(a.obstacles.map(o=>o.at),c.obstacles.map(o=>o.at));
 for(const bpm of [80,100,120,140]){
  const course=P.makeCourse(bpm,3),beat=60/bpm;
  for(const o of course.obstacles){
   const sp=P.SPEEDS[o.lap]*beat,local=o.at-o.lap*P.LAP;
   assert.ok(Math.abs(local/sp-Math.round(local/sp))<1e-9,'on the beat grid '+bpm);assert.ok(local>=60&&local<=P.LAP-60,'clear of the seam');
  }
  for(let i=1;i<course.obstacles.length;i++)assert.ok(course.obstacles[i].at>course.obstacles[i-1].at+10);
 }
 const laps=[0,1].map(l=>a.obstacles.filter(o=>o.lap===l).length);assert.ok(laps[0]>=3&&laps[1]>=3&&laps[1]>=laps[0]);
 assert.ok(P.SPEEDS[1]>P.SPEEDS[0])});

test('drawing both acts never throws and is cheap',()=>{
 const c=ctxStub(),opts={viewport:{width:390,height:844},reduced:false};
 const r=new P.PenroseRun({viewport:opts.viewport});r.start();
 const t0=process.hrtime.bigint();
 for(let i=0;i<600;i++){r.tick(1/60);if(i%50===10)r.inputDown();r.drawSelf(c,opts)}
 const ms=Number(process.hrtime.bigint()-t0)/1e6/600;assert.ok(ms<4,'draw+tick '+ms+' ms');
 r.drawSelf(c,{...opts,reduced:true});
 const a=new P.AlignRun({viewport:opts.viewport});a.start();for(let i=0;i<900;i++){a.tick(1/60);if(i===100)a.inputDown();a.drawSelf(c,opts)}
 a.drawSelf(c,{...opts,reduced:true});
 for(const w of [320,390,430,768])for(const run of [new P.PenroseRun({}),new P.AlignRun({})]){run.setViewport(w,Math.round(w*2.1));run.start();run.drawSelf(c,{viewport:run.viewport})}});
