/* Explicit metadata fixtures cover 256 recovered rows; not normal player progression. */
const fs=require('node:fs'),path=require('node:path');require('../web/src/state-clone.js');require('../web/src/native-stability.js');require('../web/src/native-kernels.js');const K=MongyuNativeKernels,N=require('../web/src/native-restoration-run.js'),C=require('../web/src/restoration-catalog.js'),P=require('../web/src/presentation-runtime.js');require('../web/src/mobile-presentation.js');require('../web/src/native-scene.js');
const rows=[],fixtures=[],base=K.MapProviders.createProviders();
for(let index=0;index<256;index++){
 const record=base.stageRecord(index*9),kernels={...K,MapProviders:{...K.MapProviders,createProviders:o=>{const p=K.MapProviders.createProviders(o);return{...p,stageRecord:()=>record.slice()}}}};
 const r=new N.RestorationRun({slot:C.getSlot(3),settings:{speed:'fast'},kernels}),row={index,record,provenance:'explicit table-row provider fixture; not a normal-input clear',supported:false};
 try{r.start();for(let i=0;i<66&&r.state==='play';i++){if(i%6===0)r.action();P.advance(r,.075)}const g=P.geometry(r,{reduced:true});row.supported=r.supported;row.reason=r.reason;row.state=r.state;row.updates=r.updates;row.cells=g.nativeScene.groups.reduce((n,g)=>n+g.cells.length,0);row.groups=g.nativeScene.groups.length;row.split=g.nativeScene.split;row.mode=r.nativeFrame.u.actionLock;row.behavior=r.nativeFrame.game.stage.behaviorCode;row.finite=Number.isFinite(g.player.x)&&Number.isFinite(g.player.y);
 if(row.split&&!fixtures.some(f=>f.mode===row.mode))fixtures.push({index,mode:row.mode,provenance:row.provenance,checkpoint:r.exportNativeCheckpoint()});
 }catch(e){row.reason=e.message}rows.push(row);
}
const report={release:'R86',scope:'All 256 recovered ordinary stage records exercised using an explicit metadata provider, 66 updates each, no changes to player saves. Not a full original-equivalence or normal-input completion proof.',rows,summary:{records:rows.length,errors:rows.filter(r=>!r.supported||!r.finite),splitModes:[...new Set(rows.filter(r=>r.split).map(r=>r.mode))]}};
fs.writeFileSync(path.join(__dirname,'../evidence/r86-pattern-audit.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'../web/tests/r86-partition-fixtures.json'),JSON.stringify({provenance:report.scope,fixtures})+'\n');console.log(JSON.stringify(report.summary));

if(report.summary.errors.length)process.exitCode=1;
