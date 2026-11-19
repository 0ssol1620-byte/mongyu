/* Render checks through visible controls on the R100 distribution. */
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const base=process.argv[2]||'http://127.0.0.1:4173/web/MONGYU_R100.html';
 const out=process.argv[3];
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[],checks=[];
 try{
  for(const [width,height] of [[390,844],[844,390]]){
   const page=await browser.newPage({viewport:{width,height},hasTouch:true});
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base);
   const tap=id=>page.locator('#'+id).tap({timeout:6000});
   const screen=async (name,selector)=>{
    const painted=await page.locator(selector).evaluate(el=>getComputedStyle(el).backgroundImage.includes('data:image/webp'));
    assert.ok(painted,name+' should use its spectral backdrop');
    if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:out+'/'+width+'-'+name+'.png'})}
   };
   assert.equal(await page.evaluate(()=>QUAD_RIFT_APP.candidateVersion),'r100');
   await screen('lobby','#stage');
   await tap('restorationOpen');await screen('map','#restorationCollection');
   assert.equal(await page.locator('#restorationTitle').textContent(),'꿈 지도');
   assert.ok(await page.locator('#restorationStart').isVisible());
   await tap('restorationClose');
   await tap('shopOpen');await screen('wardrobe','#wardrobePanel');await tap('wardrobeClose');
   await tap('storyOpen');await screen('journal','#storyJournal');await tap('storyJournalClose');
   await tap('options');await screen('settings','#settings');
   const setting=key=>page.evaluate(k=>getComputedStyle(document.body).getPropertyValue(k).trim(),key);
   const balanced=await setting('--field-shade');await tap('dreamIntensity');const intense=await setting('--field-shade');
   assert.notEqual(balanced,intense);await tap('dreamIntensity');const calm=await setting('--field-shade');
   assert.notEqual(calm,intense);await tap('dreamIntensity');
   await tap('motion');await tap('close');
   assert.equal(await page.evaluate(()=>document.body.dataset.dreamMotion),'reduced');
   const canvasData=()=>page.locator('#game').evaluate(el=>el.toDataURL());
   const frame=await canvasData();await page.waitForTimeout(550);
   assert.equal(await canvasData(),frame,'reduced motion freezes the lobby paint');
   await tap('titleContinue');await screen('story','#restorationScene');
   assert.match(await page.locator('#restorationSceneText').textContent(),/빛이 벽 너머/);
   await tap('restorationSceneNext');await tap('pause');await screen('pause','#pauseSheet .box');
   await tap('resumePlay');
   await page.locator('#squareRetry').waitFor({timeout:4000});
   await screen('result','#squareResult .box');
   await tap('squareRetry');
   for(let i=0;i<6;i++){
    const ready=await page.waitForFunction(index=>{
     const run=QUAD_RIFT_APP.activeRun();
     return run.state!=='play'||run.distance>=MongyuOpening.OBSTACLES[index].at-47;
    },i,{timeout:4500});await ready.dispose();
    const mode=await page.evaluate(()=>QUAD_RIFT_APP.activeRun().state);assert.equal(mode,'play');
    await page.touchscreen.tap(width*.50,height*.28);
   }
   await tap('squareNext');
   const slot=await page.evaluate(()=>QUAD_RIFT_APP.activeRun().slot.number);assert.equal(slot,3);
   checks.push({viewport:[width,height],screens:['lobby','map','wardrobe','journal','settings','story','pause','result'],intensityModes:3,frozenLobbyUnderReducedMotion:true,firstCourseCleared:true,nextSlot:slot});
   await page.close();
  }
  assert.deepEqual(errors,[]);
  const report={scope:'Chromium touch events with portrait and landscape captures. Reduced-motion frame equality and first course clear.',checks,errors};
  if(out)fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
