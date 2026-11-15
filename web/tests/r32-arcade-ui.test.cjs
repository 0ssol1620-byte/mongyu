const {test}=require('node:test'),assert=require('node:assert/strict');
const {host:baseHost}=require('./host.cjs');
const host=(options={})=>baseHost({inline:process.env.AUDIT_INLINE==='1',...options});
// Drive the actual UI input and frame clock; no mutation of HP, score, or run outcome.
function playAct(h){for(let i=0;i<2400&&h.app.game.state==='play';i++){
 const g=h.app.game,next=g.hazards.find(x=>!x.done&&x.act===g.arcade.act);
 if(next&&next.type==='barrier'&&next.d-g.distance<=40.8&&g.jump===0)h.action();
 h.advance(1000/120);
}return h.app.game.state}
test('prominent challenge and original journey remain separate entries',()=>{
 const h=host();assert.equal(h.e.arcadeStart.hidden,false);assert.equal(h.e.titleContinue.hidden,false);
 assert.equal(h.e.arcadeStart.textContent,'54초 도전');assert.equal(h.app.candidateVersion,'r92');
 h.click('arcadeRisk');h.click('arcadeStart');assert.equal(h.app.game.mode,'arcade');assert.equal(h.app.game.hearts,1);
 assert.equal(h.e.arcadeStart.hidden,true);assert.equal(h.e.act.textContent,'점프');assert.equal(h.doc.activeElement.id,'game');
 h.click('home');assert.equal(h.app.game.state,'title');assert.equal(h.e.arcadeStart.hidden,false);assert.equal(h.e.titleContinue.hidden,false);assert.equal(h.e.arcadePanel.hidden,true);
 h.click('titleContinue');assert.notEqual(h.app.game.mode,'arcade');
});
test('18 second checkpoint freezes, distinguishes protected score, and requires explicit choice',()=>{
 const h=host();h.click('arcadeStart');assert.equal(playAct(h),'arcade-choice');
 assert.equal(h.e.arcadePanel.hidden,false);assert.equal(h.e.arcadeBank.hidden,false);assert.equal(h.e.arcadePush.hidden,false);
 assert.equal(h.doc.activeElement.id,'arcadeBank');assert.equal(h.e.game.tabIndex,-1);
 assert.match(h.e.arcadeSummary.textContent,/보호 점수 \d+점 · 도전 점수 \d+점/);
 const before=h.app.game.time;h.advance(1000);h.action();assert.equal(h.app.game.time,before);assert.equal(h.app.game.state,'arcade-choice');
 h.docEvent('keydown',{code:'Tab'});assert.equal(h.doc.activeElement.id,'arcadePush');
 h.click('arcadePush');assert.equal(h.app.game.state,'play');assert.equal(h.e.arcadePanel.hidden,true);assert.equal(h.doc.activeElement.id,'game');assert.equal(h.e.game.tabIndex,0);
 assert.equal(playAct(h),'arcade-choice');assert.equal(h.app.game.time.toFixed(3),'36.000');
});
test('bank, same pattern retry, new pattern and risk records use complete real runs',()=>{
 const h=host(),campaign=h.save();h.click('arcadeStart');playAct(h);const score=h.app.game.score;
 h.click('arcadeBank');assert.equal(h.app.game.state,'clear');assert.equal(h.app.game.result.arcade.banked,true);
 assert.equal(h.doc.activeElement.id,'arcadeRetry');assert.match(h.e.arcadeSummary.textContent,new RegExp(score+'점'));
 assert.equal(h.app.arcadeRecords().standard,score);assert.equal(h.save(),campaign);
 const patterns=JSON.stringify(h.app.game.hazards.map(x=>[x.d,x.type]));h.click('arcadeRetry');assert.equal(h.app.game.arcade.seed,1);
 assert.equal(JSON.stringify(h.app.game.hazards.map(x=>[x.d,x.type])),patterns);assert.equal(h.app.game.score,0);
 playAct(h);h.click('arcadeBank');h.click('arcadeNew');assert.equal(h.app.game.arcade.seed,2);
 assert.notEqual(JSON.stringify(h.app.game.hazards.map(x=>[x.d,x.type])),patterns);
 const next=host({storage:Object.fromEntries(h.data)});assert.equal(next.app.arcadeRecords().standard,score);
});
test('failed brave run retains banked score and offers a useful next goal',()=>{
 const h=host();h.click('arcadeRisk');h.click('arcadeStart');playAct(h);const protectedScore=h.app.game.score;h.click('arcadePush');
 h.advance(18000);assert.equal(h.app.game.state,'fail');assert.equal(h.app.game.score,protectedScore);
 assert.match(h.e.arcadeReason.textContent,/보호 \d+점 · 잃은 점수 \d+점/);assert.ok(h.e.arcadeGoal.textContent.length>10);
 assert.equal(h.app.arcadeRecords().brave,protectedScore);assert.equal(h.app.arcadeRecords().standard,0);
});
test('unreadable, corrupt and future record bytes are never replaced',()=>{
 for(const options of [{storage:{'mongyu-arcade-personal-v1':'{broken'}},{storage:{'mongyu-arcade-personal-v1':'{"schema":99,"standard":900,"brave":0}'}},{blockedRead:['mongyu-arcade-personal-v1']}]){
  const h=host(options),before=h.data.get(h.app.arcadeStorageKey);h.click('arcadeStart');playAct(h);h.click('arcadeBank');
  assert.equal(h.data.get(h.app.arcadeStorageKey),before);assert.equal(h.app.arcadeRecords().storageOK,false);assert.match(h.e.arcadeGoal.textContent,/이번 실행/);
 }
});
test('write denial preserves the run and reports volatile best; reduced setting still applies',()=>{
 const h=host({blockedWrite:['mongyu-arcade-personal-v1'],systemReduced:true});h.click('arcadeStart');assert.equal(h.app.settings.reduced,true);
 playAct(h);h.click('arcadeBank');assert.equal(h.app.game.state,'clear');assert.ok(h.app.arcadeRecords().standard>0);assert.equal(h.app.arcadeRecords().storageOK,false);
 h.click('arcadeRetry');h.advance(1000);h.click('pause');const before=h.app.game.time;h.advance(1000);assert.equal(h.app.game.time,before);h.click('pause');h.advance(100);assert.ok(h.app.game.time>before);
});

