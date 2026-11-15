/* Optional Chromium integration evidence. Requires Playwright, no package runtime dependency. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
let activeBrowser;
const target=process.argv[2]||'http://127.0.0.1:4173/web/MONGYU_R91.html',out=process.argv[3]||'/workspace/artifacts/r86';
const percentile=(xs,p)=>xs.slice().sort((a,b)=>a-b)[Math.floor((xs.length-1)*p)];
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=activeBrowser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(target);await page.waitForFunction(()=>window.QUAD_RIFT_APP);await page.screenshot({path:path.join(out,'title.png')});
 await page.click('#shopOpen');await page.click('#look-ink');await page.click('#wardrobeClose');await page.reload();
 if(await page.evaluate(()=>QUAD_RIFT_APP.mobileWardrobe.view().selected)!=='ink')throw Error('wardrobe restore');
 await page.click('#titleContinue');await page.screenshot({path:path.join(out,'story.png')});await page.click('#restorationSceneNext');await page.click('#restorationSceneNext');await page.click('#restorationStart');await page.waitForTimeout(250);
 await page.screenshot({path:path.join(out,'play.png')});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const perf=await page.evaluate(async()=>{
  const render=[],frames=[];let last=performance.now();
  // Explicit draw timing plus ordinary RAF/tick workload, identically for both builds.
  for(let i=0;i<120;i++){await new Promise(requestAnimationFrame);const now=performance.now();frames.push(now-last);last=now;const start=performance.now();QUAD_RIFT_APP.draw();render.push(performance.now()-start)}
  return {render,frames,state:QUAD_RIFT_APP.getState().state,viewport:QUAD_RIFT_APP.viewport(),music:QUAD_RIFT_APP.musicView().title,copyBackend:globalThis.MongyuStateClone?.inspect()||null};
 });
 const metrics={samples:120,cpuThrottle:4,protocol:'ordinary RAF/tick plus one explicitly timed draw per frame; includes warm-up and simulation work',renderMedianMs:percentile(perf.render,.5),renderP95Ms:percentile(perf.render,.95),frameMedianMs:percentile(perf.frames,.5),frameP95Ms:percentile(perf.frames,.95),state:perf.state,viewport:perf.viewport,music:perf.music,copyBackend:perf.copyBackend};
 fs.writeFileSync(path.join(out,'performance.json'),JSON.stringify(metrics,null,2)+'\n');
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await page.click('#pause');const time=await page.evaluate(()=>QUAD_RIFT_APP.activeRun().time);await page.waitForTimeout(200);if(time!==await page.evaluate(()=>QUAD_RIFT_APP.activeRun().time))throw Error('pause advanced');
 await page.click('#resumePlay');await page.dispatchEvent('#game','pointerdown',{pointerId:1,button:0,isPrimary:true});await page.dispatchEvent('body','pointerup',{pointerId:1,button:0,isPrimary:true});await page.waitForTimeout(100);if(await page.locator('#hudCue').isVisible())throw Error('tutorial hint remains');
 const layouts=[];
 for(const [width,height]of [[844,390],[320,568],[800,1280]]){await page.setViewportSize({width,height});await page.waitForTimeout(100);const box=await page.locator('#stage').boundingBox();layouts.push({width,height,box});if(box.x||box.y||box.width!==width||box.height!==height)throw Error('viewport coverage');await page.screenshot({path:path.join(out,`play-${width}.png`)})}
 await page.evaluate(()=>QUAD_RIFT_APP.home());const offlinePage=await browser.newPage();offlinePage.on('pageerror',e=>errors.push('offline: '+e.message));const standalone=fs.readFileSync(process.argv[4]||path.resolve(__dirname,'../web/MONGYU_R91.html'),'utf8');let unexpectedRequests=0;
 await offlinePage.route('**/*',route=>{if(route.request().isNavigationRequest())return route.fulfill({status:200,contentType:'text/html',body:standalone});unexpectedRequests++;return route.abort()});await offlinePage.context().setOffline(true);await offlinePage.goto('http://mongyu-offline.test/');await offlinePage.waitForFunction(()=>window.QUAD_RIFT_APP);const offline=await offlinePage.evaluate(()=>QUAD_RIFT_APP.getState().state==='title');if(unexpectedRequests)throw Error('standalone bundle requested external resources');
 const sound=await page.evaluate(()=>({tracks:Object.values(MONGYU_EMBEDDED_MUSIC).map(t=>({id:t.id,bytes:t.bytes,roles:t.musicRoles})),coverage:MongyuRestorationAudioPolicy.coverageFor(MONGYU_EMBEDDED_MUSIC)}));
 const report={target,errors,metrics,layouts,offline,sound};fs.writeFileSync(path.join(out,'browser-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({out,errors,metrics,offline,stageRecordings:sound.coverage.availableStageRecordingCount}));await browser.close();if(errors.length)process.exitCode=1;
})().catch(async e=>{console.error(e);await activeBrowser?.close();process.exitCode=1});
