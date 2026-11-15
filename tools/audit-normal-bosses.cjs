/* Isolated ordinary-input victories; never edits health, position or saves. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
require('../web/src/state-clone.js');require('../web/src/native-stability.js');require('../web/src/native-kernels.js');
const N=require('../web/src/native-restoration-run.js'),C=require('../web/src/restoration-catalog.js'),P=require('../web/src/presentation-runtime.js');
const rows=[];
for(const recorded of require('../web/tests/r87-normal-boss-inputs.json').rows){
 const run=new N.RestorationRun({slot:C.getSlot(recorded.slot),seed:recorded.seed,period:'noon',settings:{speed:'fast'}});run.start();
 const taps=new Set(recorded.actions);let steps=0;
 while(run.state==='play'&&steps++<recorded.updates+4){if(taps.has(run.updates))run.action();P.advance(run,.075)}
 assert.equal(run.supported,true);assert.equal(run.state,'clear');assert.equal(run.boss.hp,0);assert.equal(C.validateResult(run.slot.id,run.result),true);
 assert.equal(run.updates,recorded.updates);assert.equal(run.hearts,recorded.lives);
 rows.push({slot:recorded.slot,seed:recorded.seed,actions:recorded.actions,updates:run.updates,lives:run.hearts,bossHp:run.boss.hp,earned:run.result.nativeProof.earned,resultValidated:true,confirmationInputIncluded:true});
}
const report={scope:'Independently replayed isolated encounters using action() and ordinary time steps. No health, position, score or campaign-progress edits. Does not establish continuous completion of all 100 slots.',rows};
fs.writeFileSync(path.resolve(__dirname,'../evidence/r87-normal-bosses.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({victories:rows.length,slots:rows.map(r=>r.slot),scope:report.scope}));
