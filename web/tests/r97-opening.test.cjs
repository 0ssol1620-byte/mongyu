const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../src/restoration-catalog.js');
const O=require('../src/opening-run.js');
const slot=C.getSlot(2),dt=1/120;
function play({practice=false,section=0,skip=-1}={}){
 const run=new O.OpeningRun({slot,attempt:1,practice,section});
 let lastIndex=-1;
 run.start();
 for(let n=0;n<2000&&run.state==='play';n++){
  const obstacle=O.OBSTACLES[run.index];
  if(obstacle&&run.index!==skip&&lastIndex!==run.index&&obstacle.at-run.distance<=39){
   run.inputDown();run.inputUp();lastIndex=run.index;
  }
  run.tick(dt);
 }
 return run;
}
test('opening requires demonstrated obstacle passes and crossing both folds before the next memory',()=>{
 const first=C.applyEvent(C.createSave(),{slotId:C.getSlot(1).id,type:'opening-read',scene:'light-folds'});
 const failed=play({skip:2}),complete=play();
 assert.equal(failed.crash.index,2);
 assert.equal(C.commit(first,slot.id,failed.result).pendingUnlock,null);
 assert.equal(complete.result.openingProof.passed,6);
 const forged={...complete.result,openingProof:{...complete.result.openingProof,passed:5}};
 assert.equal(C.validateResult(slot.id,forged),false);
 const pending=C.commit(first,slot.id,complete.result);
 assert.ok(pending.pendingUnlock);
 const revealed=C.reveal(C.normalizeSave(JSON.parse(JSON.stringify(pending))),pending.pendingUnlock.id);
 assert.equal(C.status(revealed).collected,2);
 assert.equal(C.status(C.normalizeSave(revealed)).collected,2);
});
test('wall practice clears the same obstacles at matching tap distances and grants no campaign receipt',()=>{
 const practice=play({practice:true,section:1});
 assert.equal(practice.state,'clear');
 assert.equal(practice.status().opening.passed,2);
 assert.equal(practice.mapChanges,1);
 assert.equal(C.validateResult(slot.id,practice.result),false);
});
