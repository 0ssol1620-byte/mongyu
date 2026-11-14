const test=require('node:test'),assert=require('node:assert/strict');
require('../src/native-kernels.js');const N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js');
test('fresh attempts use recovered timer30 and boss score2; pause/resume never reinitializes',()=>{for(const number of [2,3,8]){const r=new N.RestorationRun({slot:C.getSlot(number)});assert.equal(r.start(),true);assert.equal(r.nativeFrame.r.timerT,30);assert.equal(r.score,number===8?2:0);r.tick(.095);const timer=r.nativeFrame.r.timerT;r.pause();r.resume();assert.equal(r.nativeFrame.r.timerT,timer);r.retry();assert.equal(r.nativeFrame.r.timerT,30);}});

