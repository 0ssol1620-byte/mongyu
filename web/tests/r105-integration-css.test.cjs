'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const css=n=>fs.readFileSync(path.join(__dirname,'..','css',n),'utf8');
test('story CSS for the generic dream result sheet never targets the dream-road result panel',()=>{
 const rules=css('r104-story.css').split('\n').filter(l=>l.includes(':root .r104-dream-result'));
 assert.ok(rules.length>20,'expected the generic result rules to exist');
 for(const l of rules){
  const bare=(l.match(/\.r104-dream-result(?!:not\(\.r105-road-result\))/g)||[]).length;
  assert.equal(bare,0,'rule would also restyle #roadResult: '+l.slice(0,140));
 }
});
test('the road result panel keeps a single column identity block',()=>{
 const road=css('r104-road.css');
 assert.ok(/\.r105-road-result \.dream-identity\{[^}]*align-items:stretch/.test(road));
});
