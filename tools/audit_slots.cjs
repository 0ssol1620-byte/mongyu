/* Initialization/input smoke evidence, deliberately not a full-clear claim. */
const fs=require('node:fs'),path=require('node:path');
require('../web/src/native-kernels.js');const C=require('../web/src/restoration-catalog.js'),N=require('../web/src/native-restoration-run.js');
const rows=C.slots.map(slot=>{
 const m=N.slotMetadata(slot.number),row={slot:slot.number,title:slot.title,category:m.category,rule:slot.rule.type,originalEquivalence:'unverified',normalInputClear:'unverified'};
 if(!m.supported)return {...row,entry:'authored-scene',smoke:'not-a-physical-stage'};
 try{const run=new N.RestorationRun({slot,period:'noon'});run.start();for(let i=0;i<12&&run.state==='play';i++){if(i===3)run.inputDown();if(i===4)run.inputUp();run.tick(run.stepMs/1000)}const g=run.geometry();return {...row,entry:'native-candidate',smoke:run.supported&&Number.isFinite(g.player?.x)&&Number.isFinite(g.player?.y)?'passed':'failed',state:run.state,score:run.score,updates:run.updates,reason:run.reason};}catch(e){return {...row,entry:'native-candidate',smoke:'error',reason:e.message}}
});
const report={scope:'12-step initialization and accepted-input smoke; does not prove full completion or original equivalence',slots:rows.length,physical:rows.filter(x=>x.entry==='native-candidate').length,passed:rows.filter(x=>x.smoke==='passed').length,failed:rows.filter(x=>['failed','error'].includes(x.smoke)).length,rows};
fs.mkdirSync(path.join(__dirname,'../evidence'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../evidence/r81-slot-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));if(report.failed)process.exitCode=1;
