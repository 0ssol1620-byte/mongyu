/* Sustained post-countdown Chromium evidence. Desktop CPU throttling is not an Android device test. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
(async()=>{const release=process.argv[2]||'R92',out=process.argv[3]||'/workspace/artifacts/'+release.toLowerCase(),browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 fs.mkdirSync(out,{recursive:true});const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/web/MONGYU_'+release+'.html');await page.waitForFunction(()=>window.QUAD_RIFT_APP);await page.click('#titleContinue');await page.click('#restorationSceneNext');await page.click('#restorationSceneNext');if(await page.locator('#restorationStart').isVisible())await page.click('#restorationStart');
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const data=await page.evaluate(async()=>{
  const run=QUAD_RIFT_APP.activeRun(),tick=run.tick,frames=[],simulation=[],longTasks=[],changes={};let last=performance.now(),nextAction=2.4;
  const observer=new MutationObserver(entries=>{for(const e of entries){const id=e.target.id;if(['titleScreen','pause','pauseSheet','options','game'].includes(id))changes[id]=(changes[id]||0)+1}});observer.observe(document.body,{subtree:true,attributes:true});
  const po=new PerformanceObserver(list=>longTasks.push(...list.getEntries().map(x=>({start:x.startTime,ms:x.duration}))));po.observe({entryTypes:['longtask']});
  run.tick=function(dt){const a=performance.now(),n=tick.call(this,dt);if(n)simulation.push(performance.now()-a);return n};
  try{for(let i=0;i<600;i++){await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-last);last=now;if(run.time>=nextAction){run.action();nextAction+=.45}}}
  finally{run.tick=tick;observer.disconnect();po.disconnect()}
  return{frames,simulation,longTasks,changes,updates:run.updates,time:run.time,actor:run.nativeFrame.game.actor.actorState,state:run.state,hearts:run.hearts};
 });
 const summarize=a=>{const sorted=a.slice().sort((x,y)=>x-y);return{samples:a.length,p50:sorted[Math.floor((a.length-1)*.5)],p95:sorted[Math.floor((a.length-1)*.95)],p99:sorted[Math.floor((a.length-1)*.99)],max:Math.max(...a)}};
 const report={release,errors,protocol:'600 ordinary RAF frames at CPU rate 4 with native input every 0.45 simulation seconds after countdown; fresh storage, same viewport, DPR and Chromium; no CPU profiler; DOM mutation and long-task observers attached',deviceValidation:false,framesMs:summarize(data.frames),simulationMs:summarize(data.simulation),longTasks:data.longTasks,staticAttributeChanges:data.changes,updates:data.updates,time:data.time,state:data.state,hearts:data.hearts};
 fs.writeFileSync(path.join(out,'sustained.json'),JSON.stringify(report,null,2));await page.screenshot({path:path.join(out,'sustained.png')});console.log(JSON.stringify(report));if(errors.length)process.exitCode=1;
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
