/* Real post-countdown exercise. Terminal failure is not a correctness failure or a clear proof. */
const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks');
require('../web/src/state-clone.js');require('../web/src/native-stability.js');require('../web/src/native-kernels.js');const N=require('../web/src/native-restoration-run.js'),C=require('../web/src/restoration-catalog.js'),P=require('../web/src/presentation-runtime.js');
const rows=[],started=performance.now(),limit=Number(process.argv[2]||420),release=process.argv[3]||'R87';
for(const slot of C.slots){const metadata=N.slotMetadata(slot.number);if(!metadata.supported){rows.push({slot:slot.number,entry:'scene',kind:slot.rule.type,steps:0,fullOriginalEquivalence:'unverified'});continue}
 for(const seed of [7,19]){const r=new N.RestorationRun({slot,seed,settings:{speed:'fast'},period:slot.rule.period||'noon'});r.start();const stats={slot:slot.number,seed,entry:'native-candidate',steps:0,postCountdownSteps:0,maps:0,phases:{},actorStates:[],maxStepMs:0,finiteGeometry:true,fullOriginalEquivalence:'unverified',clear:false};const states=new Set();
 try{for(let i=0;i<limit&&r.state==='play';i++){
  if(i%(seed===7?6:11)===0){r.inputDown();r.inputUp()}
  const a=performance.now();P.advance(r,r.stepMs/1000);stats.maxStepMs=Math.max(stats.maxStepMs,performance.now()-a);stats.steps++;
  const s=r.nativeFrame,g=P.geometry(r,{reduced:true});if(s.r.timerT===0)stats.postCountdownSteps++;
  const phase=s.r.timerT>0?'countdown':s.game.controller.controllerStateUK===200?'morph':s.u.l===3?'boss-scatter':s.u.l===4?'boss-confirm':s.u.D>0?'notification':'play';stats.phases[phase]=(stats.phases[phase]||0)+1;states.add(s.game.actor.actorState);
  stats.finiteGeometry&&=[g.player?.x,g.player?.y,...g.nativeSurfaces.flatMap(x=>x.points.filter(Boolean).flatMap(p=>[p.x,p.y]))].every(Number.isFinite);
  if(r.nativeFrame.u.l===4)r.action();
 }
 stats.state=r.state;stats.reason=r.reason;stats.supported=r.supported;stats.maps=r.mapChanges;stats.score=r.score;stats.hearts=r.hearts;stats.clear=r.state==='clear';stats.actorStates=[...states];
 }catch(e){stats.error=e.stack;stats.supported=false}rows.push(stats);}
 if(slot.number%10===0)process.stdout.write('Checked slot '+slot.number+'\n');
}
const report={release,scope:'100 entry ledger; 74 native candidate slots, two seeds each, up to '+limit+' real native updates after normal initialization; inputs only; not a 100-slot campaign completion or original equivalence proof',elapsedMs:performance.now()-started,rows,summary:{slots:new Set(rows.map(r=>r.slot)).size,nativeRuns:rows.filter(r=>r.entry==='native-candidate').length,errors:rows.filter(r=>r.entry==='native-candidate'&&(!r.supported||r.error||!r.finiteGeometry)).map(r=>({slot:r.slot,seed:r.seed,reason:r.reason,error:r.error})),clears:rows.filter(r=>r.clear).length}};
fs.writeFileSync(path.join(__dirname,'../evidence/'+release.toLowerCase()+'-runtime-audit.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary));if(report.summary.errors.length)process.exitCode=1;
