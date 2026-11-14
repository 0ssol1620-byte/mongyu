const test=require('node:test'),assert=require('node:assert/strict'),{host}=require('./host.cjs');
const M=require('../src/mobile-presentation.js');
test('play HUD is a compact score, never the objective paragraph',()=>{
 const v={score:123,hearts:3,instruction:'긴 설명문',roomTitle:'제목',time:1};assert.equal(M.hud(v),'123  ●●●');assert.equal(M.hint(v,{inputCount:0}),'탭하여 점프');assert.equal(M.hint(v,{inputCount:1}),'');assert.equal(M.hint({...v,time:7},{inputCount:0}),'');assert.equal(M.hint({...v,native:{awaitingBossConfirmation:true}},{}),'탭하여 다음으로');
});
test('exact R81 distribution removes tutorial text after first accepted tap and retains pause',()=>{
 const h=host({inline:true,square:true,restoration:true,native:true});h.click('titleContinue');h.click('restorationSceneNext');h.click('restorationSceneNext');h.click('restorationStart');assert.equal(h.e.hudCue.textContent,'탭하여 점프');h.fire('game','pointerdown',{pointerId:1,button:0,isPrimary:true});h.advance(120);assert.equal(h.e.hudCue.hidden,true);assert.equal(h.e.act.hidden,true);assert.equal(h.e.primary.hidden,true);assert.equal(h.e.pause.hidden,false);h.click('pause');assert.equal(h.app.activeRun().state,'pause');
});
test('browser fullscreen requires a trusted coarse-pointer gesture and denial cannot break the run',async()=>{
 const vm=require('node:vm'),fs=require('node:fs');let calls=0;const c={matchMedia:()=>({matches:true}),document:{documentElement:{requestFullscreen(){calls++;return Promise.reject(Error('browser declined'))}}}};vm.createContext(c);vm.runInContext(fs.readFileSync(require.resolve('../src/mobile-presentation.js'),'utf8'),c);
 assert.equal(c.MongyuMobile.requestImmersive({isTrusted:false}),false);assert.equal(calls,0);assert.equal(c.MongyuMobile.requestImmersive({isTrusted:true}),true);await new Promise(setImmediate);assert.equal(calls,1);assert.equal(c.MongyuMobile.requestImmersive({isTrusted:true}),false);
});
