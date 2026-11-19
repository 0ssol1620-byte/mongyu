/* End-to-end WebKit check in an iPhone viewport. No simulation-state injection. */
const {webkit,devices}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await webkit.launch();
 try{
  const page=await browser.newPage({...devices['iPhone 13']});
  const errors=[],speakers=[],tracks=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url=process.argv[2]||'http://127.0.0.1:4173/';
  await page.goto(url);
  assert.equal(await page.evaluate(()=>QUAD_RIFT_APP.candidateVersion),process.env.MONGYU_TEST_RELEASE||'r99');
  await page.tap('#titleContinue');
  const prologue=await page.locator('#restorationSceneText').textContent();
  assert.match(prologue,/빛이 벽 너머/);
  assert.equal(await page.locator('#restorationScene').getAttribute('data-presentation'),'speech');
  speakers.push(prologue);
  await page.tap('#restorationSceneNext');
  await page.waitForFunction(()=>!document.getElementById('runnerSpeech').hidden,null,{timeout:2500});
  speakers.push(await page.locator('#runnerSpeech').textContent());
  const viewport=await page.evaluate(()=>{const r=document.getElementById('game').getBoundingClientRect();return {width:r.width,height:r.height,x:r.x,y:r.y,screenWidth:innerWidth,screenHeight:innerHeight}});
  assert.equal(viewport.width,viewport.screenWidth);assert.equal(viewport.x,0);assert.equal(viewport.y,0);
  for(let i=0;i<6;i++){
   await page.waitForFunction(index=>{
    const r=QUAD_RIFT_APP.activeRun();return r.state!=='play'||r.distance>=MongyuOpening.OBSTACLES[index].at-47;
   },i,{timeout:3500});
   const before=await page.evaluate(()=>{const r=QUAD_RIFT_APP.activeRun(),m=QUAD_RIFT_APP.musicView();return {state:r.state,index:r.index,jumps:r.jumps,track:m.trackId,playing:m.playing}});
   assert.equal(before.state,'play',JSON.stringify(before));assert.equal(before.index,i);
   if(!tracks.at(-1)||tracks.at(-1).id!==before.track)tracks.push({id:before.track,playing:before.playing});
   await page.touchscreen.tap(viewport.width*.5,viewport.height*.25);
  }
  await page.locator('#squareNext').waitFor({timeout:6000});
  assert.equal(await page.evaluate(()=>QUAD_RIFT_APP.activeRun().result.openingProof.passed),6);
  await page.tap('#squareNext');
  const stage=await page.evaluate(()=>QUAD_RIFT_APP.activeRun().slot.number);assert.equal(stage,3);
  await page.reload();
  assert.equal(await page.evaluate(()=>QUAD_RIFT_APP.restoration.view().status.collected),2);
  assert.deepEqual(errors,[]);
  const report={url,scope:'Playwright WebKit, iPhone 13 emulated viewport and touch. Not a physical handset.',viewport,speakers,tracks,clearedObstacles:6,nextStage:stage,saveSurvivesReload:true,errors};
  if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
