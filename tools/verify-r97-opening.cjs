/* Exercise opening, same-section practice and campaign continuation through real UI events. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

async function run(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  const errors=[],stops=[],out=process.argv[3];
  page.on('pageerror',error=>errors.push(error.message));
  const read=fn=>page.evaluate(fn);
  const visible=(id,timeout=7000)=>page.locator('#'+id).waitFor({timeout});
  const tap=id=>page.tap('#'+id,{timeout:5000});
  const screenshot=async name=>{if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:out+'/'+name+'.png'})}};
  const snapshot=()=>read(()=>{const r=QUAD_RIFT_APP.activeRun();return {
   time:r.time,distance:r.distance,state:r.state,slot:r.slot.number,index:r.index,jumps:r.jumps,
   map:r.mapChanges,attempt:r.attempt,practice:r.practice, crash:r.crash,result:r.result,
   collected:QUAD_RIFT_APP.restoration.view().status.collected}});
  const jump=async index=>{
   await page.waitForFunction(i=>{
    const r=QUAD_RIFT_APP.activeRun();
    return r.state!=='play'||r.distance>=MongyuOpening.OBSTACLES[i].at-44;
   },index,{timeout:5000});
   const before=await snapshot();
   assert.equal(before.state,'play');
   await page.touchscreen.tap(193,200);
   assert.equal((await snapshot()).jumps,before.jumps+1);
   await page.waitForFunction(i=>QUAD_RIFT_APP.activeRun().index>i||QUAD_RIFT_APP.activeRun().state==='fail',index,{timeout:3500});
   const after=await snapshot();
   assert.equal(after.index,index+1,JSON.stringify({index,before,after}));
   stops.push({obstacle:index+1,sector:after.map,practice:!!after.practice,clearedAt:after.time});
  };
  const measureRetry=()=>read(()=>{
   const button=document.getElementById('squareRetry');
   button.addEventListener('click',()=>{
    const start=performance.now(),previous=QUAD_RIFT_APP.activeRun();
    let origin=null;
    window.retryTime=new Promise(resolve=>{
     function watch(){
      const r=QUAD_RIFT_APP.activeRun();
      if(r!==previous){
       if(r.openingCourse&&r.distance>0)return resolve(performance.now()-start);
       if(r.nativeRuntime){
        const pool=r.nativeFrame.game.pool,index=pool.currentIndex,position=pool.objects[index].position;
        if(!origin)origin={index,position};
        if(index!==origin.index||position!==origin.position)return resolve(performance.now()-start);
       }
      }
      if(performance.now()-start>1800)return resolve({state:r.state,slot:r.slot.number,time:r.time,quick:r.options.quickRetry});
      requestAnimationFrame(watch);
     }
     requestAnimationFrame(watch);
    });
   },{once:true,capture:true});
  });
  await page.goto('http://127.0.0.1:4173/web/MONGYU_R97.html');
  await tap('titleContinue');
  assert.equal(await page.locator('#restorationSceneNext').textContent(),'첫 달리기 시작');
  await tap('restorationSceneNext');
  await screenshot('opening');
  await visible('squareResult');
  const idle=await snapshot();
  assert.equal(idle.index,0);assert.equal(idle.collected,1);
  assert.equal(idle.crash.section,0);
  assert.equal(await page.locator('#squareNext').isVisible(),false);
  await screenshot('collision');

  await measureRetry();
  await tap('squareRetry');
  const immediateRetryMs=await read(()=>window.retryTime);
  assert.ok(immediateRetryMs<250,JSON.stringify(immediateRetryMs)+' after retry tap');
  await jump(0);await jump(1);
  await visible('squareResult');
  const wall=await snapshot();
  assert.equal(wall.crash.index,2);assert.equal(wall.crash.section,1);
  const savedMastery=()=>read(()=>MongyuNativeRestoration.isolatedStorage(localStorage).getItem(MongyuRestorationMastery.KEY));
  const recordsBefore=await savedMastery();
  assert.equal(JSON.parse(recordsBefore).records['r97-opening'].attemptCount,2);
  await tap('squarePractice');
  assert.equal((await snapshot()).map,1);
  await jump(2);await jump(3);
  await visible('squareResult');
  const practice=await snapshot();
  assert.equal(practice.collected,1);
  assert.equal(practice.attempt,wall.attempt+1);
  assert.equal(await savedMastery(),recordsBefore);
  assert.equal(await page.locator('#squareNext').isVisible(),false);
  assert.equal(await page.locator('#squareRetry').textContent(),'처음부터 도전');
  await screenshot('practice-complete');

  await tap('squareRetry');
  for(let i=0;i<6;i++){await jump(i);if(i===2)await screenshot('wall');if(i===4)await screenshot('ceiling')}
  await visible('squareResult');
  const clear=await snapshot();
  assert.equal(clear.result.openingProof.passed,6);assert.equal(clear.result.mapChanges,2);
  assert.equal(clear.result.hits,0);assert.equal(clear.collected,1);
  const correct=await read(()=>MongyuRestorationCatalog.validateResult('r38-002',QUAD_RIFT_APP.activeRun().result));
  assert.ok(correct);
  await screenshot('finish');
  await tap('squareNext');
  const next=await snapshot();assert.equal(next.slot,3);assert.equal(next.collected,2);
  await visible('squareResult',30000);
  const stage3=await page.locator('#squareSummary').textContent();
  assert.match(stage3,/이번 [0-9]+ \/ 목표 300점/);
  await measureRetry();
  await tap('squareRetry');
  const stage3RetryMs=await read(()=>window.retryTime);
  assert.ok(stage3RetryMs<950,JSON.stringify(stage3RetryMs)+' after retry tap');

  await tap('pause');
  const paused=await snapshot();await page.waitForTimeout(300);
  assert.equal((await snapshot()).time,paused.time);
  await page.reload();
  assert.equal(await read(()=>QUAD_RIFT_APP.restoration.view().status.collected),2);
  assert.deepEqual(errors,[]);
  const report={scope:'390×844 Chromium with real touchscreen events; observations from one scripted session',
   idle:{at:idle.crash.at,section:idle.crash.section,earned:false},immediateRetryMs,stage3RetryMs,stage3,
   stops,practice:{section:practice.map,earned:false,recordsUnchanged:true},clear:{...clear.result.openingProof,time:clear.time},nextSlot:next.slot,progressSurvivesReload:true,errors};
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
 }finally{await browser.close()}
}
run().catch(error=>{console.error(error);process.exitCode=1});
