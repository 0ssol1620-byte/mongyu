const test=require('node:test'),assert=require('node:assert/strict'),{host}=require('./host.cjs');
const boot=o=>host({inline:true,square:true,restoration:true,native:true,...o});
test('exact distributable: wardrobe equips, persists and restores without awarding locked outfits',()=>{
 const h=boot();h.click('shopOpen');assert.equal(h.app.getState().dialog,'wardrobePanel');h.click('look-ink');assert.equal(h.app.mobileWardrobe.view().selected,'ink');h.click('look-dawn');assert.equal(h.app.mobileWardrobe.view().selected,'ink');
 const bytes=h.data.get('mongyu.r80.style.v1');assert.deepEqual(JSON.parse(bytes),{schema:1,selected:'ink'});
 const reloaded=boot({storage:{'mongyu.r80.style.v1':bytes}});assert.equal(reloaded.app.mobileWardrobe.view().selected,'ink');
 const tampered=boot({storage:{'mongyu.r80.style.v1':'{"schema":1,"selected":"dawn"}'}});assert.equal(tampered.app.mobileWardrobe.view().selected,'moon');
});
test('exact distributable: story, unlock, playable stage, foreground hitch and background lifecycle',()=>{
 const h=boot();h.click('titleContinue');assert.equal(h.app.getState().dialog,'restorationScene');h.click('restorationSceneNext');h.click('restorationSceneNext');assert.equal(h.app.restoration.view().status.collected,1);
 h.click('restorationStart');const r=h.app.activeRun();assert.equal(r.state,'play');h.tick(0);h.tick(1000);assert.equal(r.state,'play');assert.ok(r.time>0&&r.time<=.101);h.tick(1100);assert.ok(r.time>.1);
 h.doc.hidden=true;h.docEvent('visibilitychange');const t=r.time;h.tick(5000);assert.equal(r.state,'pause');assert.equal(r.time,t);h.doc.hidden=false;h.click('resumePlay',{isTrusted:true});h.tick(5100);assert.equal(r.state,'play');assert.ok(r.time>t);
 h.click('pause');assert.equal(r.state,'pause');h.click('pauseHome');h.click('shopOpen');assert.equal(h.e['look-dew'].disabled,false);
});
test('exact distributable: blocked storage remains playable and cosmetic save failure is disclosed',()=>{
 const h=boot({blockedRead:true,blockedWrite:true});h.click('shopOpen');h.click('look-ink');assert.equal(h.app.mobileWardrobe.view().selected,'ink');assert.equal(h.app.mobileWardrobe.view().saved,false);assert.match(h.e.wardrobeStatus.textContent,/이번 실행/);h.click('wardrobeClose');h.click('titleContinue');assert.equal(h.app.getState().dialog,'restorationScene');
});
test('exact distributable: three embedded soundtracks have a dedicated original menu theme',()=>{
 const h=boot(),tracks=h.ctx.MONGYU_EMBEDDED_MUSIC;assert.equal(Object.keys(tracks).length,3);const p=h.ctx.MongyuRestorationAudioPolicy.createPolicy({tracks});assert.equal(p.update({screen:'title'}).trackId,'night-corners');assert.equal(p.update({boss:true}).trackId,'racket-and-bang');assert.equal(tracks['night-corners'].license,'Project-original composition');
});
