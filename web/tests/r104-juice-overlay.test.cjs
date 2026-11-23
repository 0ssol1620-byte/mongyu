const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const SRC=path.resolve(__dirname,'../src');
function stubContext(log){
 const gradient=()=>({addColorStop(){}});
 return new Proxy({calls:log},{get:(o,k)=>k in o?o[k]:k==='createRadialGradient'||k==='createLinearGradient'?gradient:(...a)=>{log.push(k);return undefined},set:(o,k,v)=>{o[k]=v;if(k==='globalCompositeOperation')log.push('gco:'+v);return true}});
}
function boot({reduced=false,vibration=false}={}){
 let now=0;const sounds=[],vibrations=[],timers=[];
 const canvas={style:{transform:''},classList:{add(){},remove(){}}};
 const ctx={console,Math,performance:{now:()=>now},setTimeout:(f,ms)=>{timers.push(f);return timers.length},clearTimeout(){},navigator:{vibrate:ms=>vibrations.push(ms)},MONGYU_POLISH_EDITION:true};
 ctx.globalThis=ctx;vm.createContext(ctx);
 for(const f of ['polish-bus.js','opening-run.js','play-juice.js'])vm.runInContext(fs.readFileSync(path.join(SRC,f),'utf8'),ctx,{filename:f});
 const settings={reduced,vibration};let active=null;
 ctx.MongyuPolish.attach({sound:k=>sounds.push(k),settings:()=>settings,activeRun:()=>active,canvas,viewport:()=>({width:390,height:844})});
 const O=ctx.MongyuOpening,slot={id:'r38-002',ruleId:'x',number:2};
 const run=new O.OpeningRun({slot,attempt:2});run.start();active=run;
 const log=[],c=stubContext(log);
 const frame=(ms=16)=>{now+=ms;ctx.MongyuPolish.emit('frame',{ctx:c,run,viewport:{width:390,height:844},time:run.time,reduced})};
 return {ctx,run,O,sounds,vibrations,canvas,frame,log,timers,emit:e=>ctx.MongyuPolish.emit('run-event',{run,event:e}),advance:ms=>{now+=ms}};
}
test('collision layers sounds, vibration, flash, shake and capped shards, then settles',()=>{
 const b=boot({vibration:true});
 b.run.view={cx:100,cy:300,scale:1.2,width:390,height:844};b.run.crash={index:2,section:1,at:515,early:false};
 b.emit('hit');
 assert.deepEqual(b.sounds,['impact-glass','impact-chime-fall']);assert.deepEqual(b.vibrations,[40]);
 b.frame(10);assert.match(b.canvas.style.transform,/translate\(.+\) scale\(1\.03\)/);assert.ok(b.log.includes('gco:saturation'));
 for(let i=0;i<5;i++)b.emit('hit');
 assert.ok(b.ctx.MongyuJuice.activeParticles()<=40);
 for(let i=0;i<60;i++)b.frame(16);
 assert.equal(b.canvas.style.transform,'');
 assert.equal(b.ctx.MongyuJuice.activeParticles(),0);
});
test('reduced motion: no shake transform, no vibration without the setting',()=>{
 const b=boot({reduced:true});
 b.run.view={cx:100,cy:300,scale:1.2,width:390,height:844};b.run.crash={index:2,section:1,at:515,early:true};
 b.emit('hit');for(let i=0;i<10;i++)b.frame(16);
 assert.equal(b.canvas.style.transform,'');assert.deepEqual(b.vibrations,[]);
});
test('aurora crossing plays the shimmer once and sends shards to the score',()=>{
 const b=boot();b.run.view={cx:100,cy:300,scale:1.2,width:390,height:844};
 b.run.distance=b.O.FINISH;b.run.outro={kind:'clear',age:0,duration:1.05};
 b.frame();b.frame();
 assert.deepEqual(b.sounds,['aurora-shimmer']);assert.ok(b.ctx.MongyuJuice.activeParticles()>=12);assert.ok(b.log.includes('gco:lighter'));
 b.emit('perfect');assert.ok(b.sounds.includes('perfect-chime'));
});
