/* Controlled defeated-boss checkpoints; never a normal-input victory claim. */
const fs=require('node:fs'),assert=require('node:assert/strict');require('../web/src/state-clone.js');require('../web/src/native-stability.js');require('../web/src/native-kernels.js');const N=require('../web/src/native-restoration-run.js'),C=require('../web/src/restoration-catalog.js'),P=require('../web/src/presentation-runtime.js'),M=require('../web/src/mobile-presentation.js'),Scene=require('../web/src/native-scene.js');
const rows=[];
for(const slot of [8,20,31,38,45,58,66,77,90,99]){
 const r=new N.RestorationRun({slot:C.getSlot(slot),settings:{speed:'fast'},period:'noon'});r.start();for(let i=0;i<35;i++)P.advance(r,.075);
 // Explicitly create a defeated-boss test fixture, without altering player saves.
 r.nativeFrame={...r.nativeFrame,boss:{...r.nativeFrame.boss,K:0},u:{...r.nativeFrame.u,l:2}};
 P.advance(r,.075);assert.equal(r.nativeFrame.u.l,3);const g=P.geometry(r,{}),saved=structuredClone(r.nativeFrame),calls=[];
 const c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...a)=>{for(const x of a)if(typeof x==='number')assert.ok(Number.isFinite(x));calls.push(k)},set:(o,k,v)=>(o[k]=v,true)});
 const view=Scene.draw(c,r,{viewport:{width:390,height:844},presentationTime:1},g);assert.equal(view.nativePhase,'morph');assert.ok(g.nativeScene.transition.count>0);assert.deepEqual(r.nativeFrame,saved);
 for(let i=0;i<12;i++)P.advance(r,.075);assert.equal(r.nativeFrame.u.l,4);assert.equal(r.state,'play');assert.equal(M.hint(r.status(),r),'탭하여 다음으로');r.action();P.advance(r,.075);assert.equal(r.supported,true);assert.equal(r.state,'clear');
 rows.push({slot,scope:'controlled defeated-boss fixture, not normal-input victory',scatterRenderedReadOnly:true,captureCells:g.nativeScene.transition.count,waitedForConfirmation:true,confirmationReturnedNativeResult:true});
}
const report={scope:'Ten explicit defeated-boss fixtures exercise scatter, confirmation and result. No user campaign writes; does not establish ten normal-input victories.',rows};fs.writeFileSync(require('node:path').resolve(__dirname,'../evidence/r86-boss-exits.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({checked:rows.length,errors:0,scope:report.scope}));
