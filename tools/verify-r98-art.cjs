/* Read-only capture of the R98 presentation and audio through normal inputs. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

async function verify(){
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[],report={scope:'Chromium touch flow in the shipped R98 HTML, including actual media and sample start calls.',errors};
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   window.sampleStarts=[];
   const start=AudioBufferSourceNode.prototype.start;
   AudioBufferSourceNode.prototype.start=function(...args){
    if(this.buffer?.sampleRate===24000)window.sampleStarts.push(this.buffer.length);
    return start.apply(this,args);
   };
  });
  await page.goto('http://127.0.0.1:4173/web/MONGYU_R98.html');
  const read=fn=>page.evaluate(fn);
  const shot=async name=>{if(process.argv[3]){fs.mkdirSync(process.argv[3],{recursive:true});await page.screenshot({path:process.argv[3]+'/'+name+'.png'})}};
  assert.equal(await read(()=>QUAD_RIFT_APP.candidateVersion),'r98');
  const idle=await read(()=>{
   const pose={pose:'stand'},a=MongyuMobile.gait(0,pose),b=MongyuMobile.gait(.8,pose);
   const calmA=MongyuMobile.gait(0,pose,true),calmB=MongyuMobile.gait(.8,pose,true);
   return {feet:a.legs.map(x=>x[2]),laterFeet:b.legs.map(x=>x[2]),shoulderMoves:a.shoulder[1]!==b.shoulder[1],
    reduced:JSON.stringify(calmA)===JSON.stringify(calmB)};
  });
  assert.deepEqual(idle.feet,idle.laterFeet);assert.ok(idle.shoulderMoves&&idle.reduced);
  report.idle=idle;
  await shot('lobby');
  await page.tap('#shopOpen');assert.equal(await page.locator('#wardrobeLooks canvas').count(),12);
  await page.tap('#wardrobeClose');
  await page.waitForFunction(()=>QUAD_RIFT_APP.musicView().playing&&QUAD_RIFT_APP.musicView().title==='Dreams Become Real',null,{timeout:7000});
  await page.tap('#restorationOpen');
  await page.waitForFunction(()=>QUAD_RIFT_APP.musicView().playing&&QUAD_RIFT_APP.musicView().title==='Music for Manatees',null,{timeout:7000});
  report.menuTracks=['Dreams Become Real','Music for Manatees'];
  await page.tap('#restorationClose');
  await page.tap('#titleContinue');
  assert.equal(await page.locator('#restorationScene').getAttribute('data-presentation'),'speech');
  assert.equal(await page.locator('#restorationSceneSpeaker').textContent(),'길');
  const speechPanel=await read(()=>{
   const bubble=document.querySelector('#restorationScene .scene-balloon'),cast=document.getElementById('restorationSceneCast');
   const box=cast.getBoundingClientRect(),scale=Math.min(box.width/cast.width,box.height/cast.height);
   const head=box.top+(box.height-cast.height*scale)/2+(cast.height-30-210*1.02)*scale;
   return {tail:getComputedStyle(bubble,'::after').display,gap:head-bubble.getBoundingClientRect().bottom};
  });
  assert.equal(speechPanel.tail,'block');assert.ok(speechPanel.gap>8&&speechPanel.gap<68,speechPanel.gap+'px');
  report.speechPanel=speechPanel;
  await shot('story');
  await page.tap('#restorationSceneNext');
  await page.waitForFunction(()=>!document.getElementById('runnerSpeech').hidden,null,{timeout:1500});
  report.fieldDialogue=await page.locator('#runnerSpeech').textContent();
  assert.match(report.fieldDialogue,/저 빛/);
  await shot('course');
  await page.locator('#squareRetry').waitFor({timeout:3500});
  const collision=await read(()=>({state:QUAD_RIFT_APP.activeRun().state,jumps:QUAD_RIFT_APP.activeRun().jumps}));
  assert.deepEqual(collision,{state:'fail',jumps:0});
  await page.waitForFunction(()=>sampleStarts.includes(MONGYU_EMBEDDED_EFFECTS.hit.bytes/2),null,{timeout:3000});
  await page.tap('#squareRetry');
  const waypoints=[];
  for(let i=0;i<6;i++){
   const after=await page.waitForFunction(index=>{
    const run=QUAD_RIFT_APP.activeRun();
    return run.state!=='play'||run.distance>=MongyuOpening.OBSTACLES[index].at-47;
   },i,{timeout:4500});
   await after.dispose();
   const before=await read(()=>({state:QUAD_RIFT_APP.activeRun().state,track:QUAD_RIFT_APP.musicView().trackId}));
   assert.equal(before.state,'play');
   waypoints.push(before.track);
   await page.touchscreen.tap(195,205);
  }
  await page.locator('#squareNext').waitFor({timeout:4000});
  assert.deepEqual(waypoints,['opening-floor','opening-floor','opening-wall','opening-wall','opening-ceiling','opening-ceiling']);
  const sounds=await read(()=>Object.fromEntries(Object.entries(MONGYU_EMBEDDED_EFFECTS).map(([id,s])=>[id,window.sampleStarts.filter(n=>n===s.bytes/2).length])));
  for(const event of ['scene-line','jump','land','square-corner','hit','chain','result-clear'])assert.ok(sounds[event]>0,event);
  const clear=await read(()=>QUAD_RIFT_APP.activeRun().result);
  assert.equal(clear.openingProof.passed,6);
  await page.tap('#squareNext');
  assert.equal(await read(()=>QUAD_RIFT_APP.activeRun().slot.number),3);
  report.recordings=waypoints;report.sampleStarts=sounds;report.clear=clear.openingProof;
  await page.reload();
  assert.equal(await read(()=>QUAD_RIFT_APP.restoration.view().status.collected),2);
  report.savedProgress=true;
  assert.deepEqual(errors,[]);
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
 }finally{await browser.close()}
}
verify().catch(e=>{console.error(e);process.exitCode=1});
