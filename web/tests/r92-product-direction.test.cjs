const test=require('node:test'),assert=require('node:assert/strict'),{host}=require('./host.cjs');
const boot=o=>host({inline:true,square:true,restoration:true,native:true,...o});
const retired=['modesOpen','pauseModes','settingsModes','journeyOpen','memoriesOpen','replay','tiltOpen','modes','journey','memories','r34Map','mission','riddle','shopPanel'];
function hidden(h){for(const id of retired){assert.equal(h.e[id].hidden,true,id+' hidden');assert.equal(h.e[id].inert,true,id+' inert')}}
test('shipping edition has one campaign and blocks prototype entry before any mutation',()=>{
 const h=boot({storage:{'quad-rift-hd-r4':'legacy bytes preserved'}});hidden(h);assert.equal(h.doc.documentElement.dataset.edition,'mongyu');
 const before=JSON.stringify(h.app.getState()),bytes=h.data.get('quad-rift-hd-r4');for(const name of ['openModes','startArcade','openR34','startR34','openMemories','startMemoryChallenge','startOrigin','startFinale','startHero','openCollection','startSelected','startSquare','openShop'])assert.equal(h.app[name](),false,name);
 assert.equal(JSON.stringify(h.app.getState()),before);assert.equal(h.data.get('quad-rift-hd-r4'),bytes);assert.deepEqual(Object.keys(h.ctx.MONGYU_EMBEDDED_IMAGES),[]);
});
test('campaign settings, wardrobe and home cannot restore the retired menu during a real run',()=>{
 const h=boot();h.click('titleContinue');h.click('restorationSceneNext');h.click('restorationSceneNext');h.click('pause');const r=h.app.activeRun(),before=r.exportSave?.();hidden(h);
 h.click('pauseOptions');hidden(h);h.click('dreamIntensity');h.click('close');assert.equal(r.state,'pause');assert.equal(h.app.activeRun(),r);hidden(h);h.click('pauseHome');hidden(h);h.click('shopOpen');assert.equal(h.app.getState().dialog,'wardrobePanel');h.click('wardrobeClose');hidden(h);
});
