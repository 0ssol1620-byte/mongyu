'use strict';
// Java evaluateJavascript strings run against the exact embedded HTML in a VM.
// Not Android runtime or device evidence; no JS-to-native interface exists.
const {test}=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {host}=require('./host.cjs');
const java=fs.readFileSync(path.join(__dirname,'../app/src/main/java/org/quadrift/hddevelopment/MainActivity.java'),'utf8');
const expressions=[...java.matchAll(/web\.evaluateJavascript\("([^"\n]+)"/g)].map(m=>m[1]);
function make(){return host({inline:true,saved:JSON.stringify({schema:4,mute:true,reduced:false,best:321,tutorialStatus:'complete',tutorialStep:'approach'}),storage:{'mongyu-origin-route-v1':JSON.stringify({schema:2,checkpoint:3,finaleUnlocked:true,completed:false,introDone:true})}})}
for(const [key,chapter,open,close,obj] of [['squareReply',1,'replyJourneyOpen','replyClose','puzzle'],['companionBridge',2,'bridgeOpen','bridgeClose','room'],['dayNight',3,'dayNightOpen','dayNightClose','room']])for(const method of ['pause','back'])test(`native ${method} freezes ${key} without main-run/save mutation`,()=>{
 const h=make();h.app.startOrigin(undefined,chapter);h.click(open);a.equal(h.app[key].active,true);const save=h.save(),main=JSON.stringify(h.app.game);
 vm.runInContext(expressions[method==='back'?0:1],h.ctx);a.equal(h.app.game.state,'pause');
 if(h.app[key].active){a.equal(h.app[key][obj].paused,true);const frozen=JSON.stringify(h.app[key][obj]);h.advance(1000);a.equal(JSON.stringify(h.app[key][obj]),frozen);h.click(close)}
 a.equal(h.app[key].active,false);a.equal(h.app.game.state,'pause');a.equal(JSON.stringify(h.app.game),main);a.equal(h.save(),save);a.equal(h.doc.activeElement.id,'pause');
});
for(const code of ['Space','Enter'])for(const native of ['pause','back'])test(`R30 held ${code} canceled by native ${native}; first fresh key resumes once`,()=>{
 const h=make();h.app.startOrigin(undefined,3);h.click('dayNightOpen');h.e.dayNightToggle.focus();h.fire('dayNightPanel','keydown',{code,repeat:false});a.equal(h.app.dayNight.room.phase,'day');
 vm.runInContext(expressions[native==='back'?0:1],h.ctx);a.equal(h.app.dayNight.room.paused,true);
 h.e.dayNightPause.focus();h.fire('dayNightPanel','keydown',{code,repeat:false});a.equal(h.app.dayNight.room.paused,false);
 h.fire('dayNightPanel','keydown',{code,repeat:true});h.fire('dayNightPanel','keydown',{code,repeat:false});a.equal(h.app.dayNight.room.paused,false);
});
for(const actualExit of [false,true])test(`R31 native pause/back preserves truthful outcome ${actualExit}`,()=>{
 const h=make();h.app.startOrigin(undefined,3);h.click('dayNightOpen');
 if(actualExit){h.click('dayNightWalk');h.advance(1500);h.click('dayNightToggle');h.advance(500);h.click('dayNightWalk');h.advance(1500);h.click('dayNightToggle');h.click('dayNightWalk');h.advance(1800);a.equal(h.app.dayNight.room.state,'exited')}
 const save=h.save();vm.runInContext(expressions[1],h.ctx);vm.runInContext(expressions[0],h.ctx);a.equal(h.app.getState().narrative.dayNightCrossed,false);h.click('dayNightClose');a.equal(h.app.getState().narrative.dayNightCrossed,actualExit);a.equal(h.save(),save);
});
