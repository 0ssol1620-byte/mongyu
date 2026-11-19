const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const output=process.argv[2]||'/workspace/artifacts';fs.mkdirSync(output,{recursive:true});
(async()=>{
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4173/web/MONGYU_R95.html');await p.context().setOffline(true);
  await p.tap('#titleContinue');await p.tap('#restorationSceneNext');await p.tap('#restorationSceneNext');
  assert.equal(await p.locator('#restorationCollection').isVisible(),false);
  let bump=false,taps=0;
  for(let i=0;i<88&&!await p.locator('#squareResult').isVisible();i++){
   const s=await p.evaluate(()=>{const r=QUAD_RIFT_APP.activeRun();return {time:r.time,bump:r.lastOpeningBump}});
   bump||=s.bump!==null;
   if(s.time>2.4){await p.touchscreen.tap(195,510);taps++}
   await p.waitForTimeout(405);
  }
  await p.locator('#squareResult').waitFor({timeout:3500});
  assert.equal(await p.locator('#squareHeading').textContent(),'기억 획득');
  assert.equal(await p.locator('#restorationRecordBadge').isVisible(),true);
  assert.match(await p.locator('#restorationResultMastery').textContent(),/최고 \d+점/);
  const score=Number(await p.locator('#restorationScoreValue').textContent());
  const time=await p.evaluate(()=>QUAD_RIFT_APP.activeRun().time);assert.ok(time<24);assert.equal(bump,true);
  await p.screenshot({path:path.join(output,'r95-result.png')});
  await p.tap('#squareNext');
  assert.equal(await p.evaluate(()=>QUAD_RIFT_APP.activeRun().slot.number),3);
  assert.equal(await p.evaluate(()=>QUAD_RIFT_APP.restoration.view().status.collected),2);
  assert.equal(await p.locator('#runGoal').isVisible(),true);
  await p.screenshot({path:path.join(output,'r95-goal.png')});
  await p.tap('#pause');await p.tap('#retryPlay');
  assert.equal(await p.evaluate(()=>QUAD_RIFT_APP.activeRun().slot.number),3);
  assert.equal(await p.evaluate(()=>QUAD_RIFT_APP.activeRun().state),'play');
  assert.equal(await p.locator('#restorationCollection').isVisible(),false);
  await p.context().setOffline(false);await p.reload();await p.waitForFunction(()=>window.QUAD_RIFT_APP);
  assert.equal(await p.evaluate(()=>QUAD_RIFT_APP.restoration.view().status.collected),2);
  assert.deepEqual(errors,[]);
  const report={scope:'Android-sized Chromium viewport, offline after load, normal touch input without save injection',firstRunSeconds:time,openingBumpObserved:bump,taps,score,newBestVisible:true,firstWorldEarned:true,oneTapNext:true,goalsVisible:true,oneTapRestartFromPause:true,persistAfterReload:true,errors};
  fs.writeFileSync(path.join(output,'r95-campaign-flow.json'),JSON.stringify(report,null,2)+'\n');console.log(report);
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
