'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/mobile-presentation.js');
function recorder(){const calls=[];const c=new Proxy({calls},{get(o,k){if(k in o)return o[k];if(k==='createLinearGradient'||k==='createRadialGradient')return()=>({addColorStop(){}});return(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),`${k} non-finite`);calls.push([k,...args])}},set(o,k,v){o[k]=v;return true}});return c}
test('cosmetics validate progress, corrupt saves, unknown ids and locked selection',()=>{
 assert.equal(M.looks.length,12);assert.equal(new Set(M.looks.map(x=>x.id)).size,12);
 for(const n of [NaN,Infinity,-1,'100',null,{},1.5])assert.equal(M.available('dawn',n),false);
 assert.equal(M.available('dawn',99),false);assert.equal(M.available('dawn',100),true);assert.equal(M.available('unknown',100),false);
 for(const raw of ['{','null','{"schema":9,"selected":"dawn"}','{"schema":1,"selected":"paid-admin"}'])assert.equal(M.decode(raw),'moon');
 assert.equal(M.decode('{"schema":1,"selected":"ink","owned":["everything"]}'),'ink');
});
test('presentation clock freezes in pause and bounds a foreground hitch',()=>{
 const initial=M.clock(0,'play'),moving=M.clock(.02,'play');assert.ok(moving>initial);
 assert.equal(M.clock(20,'pause'),moving);assert.equal(M.clock(21,'pause'),moving);
 assert.ok(M.clock(23,'play')-moving<=.05000001);
});
test('all outfits, wall tangents, and poses draw without mutating geometry or RNG',()=>{
 const oldRandom=Math.random;Math.random=()=>{throw Error('renderer consumed RNG')};
 try{for(const style of M.looks)for(const [x,y]of [[1,0],[0,1],[-1,0],[0,-1]]){
  const q=Object.freeze({x:24,y:55,tangent:Object.freeze({x,y}),bodyHeight:42.5,height:4,jumpProgress:.5});
  const before=JSON.stringify(q),c=recorder();M.sprite(c,q,{poseTime:3.5},false,'walker',style);assert.equal(JSON.stringify(q),before);assert.ok(c.calls.length>30);
 }for(const pose of ['raise-arms','open-arms','turn-head'])M.narrative(recorder(),100,200,60,pose,2,false);
 }finally{Math.random=oldRandom}
});
test('reduced motion produces identical actor drawing across different wall times',()=>{
 const q={x:0,y:0,tangent:{x:1,y:0}},a=recorder(),b=recorder();M.sprite(a,q,{poseTime:1},true);M.sprite(b,q,{poseTime:99},true);assert.deepEqual(a.calls,b.calls);
});
test('portrait, short landscape and tablet title canvases remain finite',()=>{
 for(const [width,height]of [[320,568],[390,844],[844,390],[1024,1366]]){const c=recorder();const out=M.title(c,{viewport:{width,height},time:20});assert.equal(out.width,width);assert.ok(c.calls.length>100)}
});
test('long native rooms use readable follow framing on all walls; masks and bosses keep whole arenas',()=>{
 for(const [x,y]of [[1,0],[0,1],[-1,0],[0,-1]]){
  const run={time:1},geo={nativeRuntime:true,bounds:{width:1152,height:1168},player:{x:500,y:500,tangent:{x,y},inward:{x:y,y:-x}}};
  const cam=M.camera({width:390,height:844},geo,{presentationTime:1},run),sx=500*cam.scale+cam.offsetX,sy=500*cam.scale+cam.offsetY;
  assert.ok(cam.scale*42.5>=30);assert.ok(sx>40&&sx<350&&sy>48&&sy<804);
  assert.equal(M.camera({width:390,height:844},{...geo,boss:{}},{},run),null);
  assert.equal(M.camera({width:390,height:844},{...geo,nativeMaskCells:[]},{},run).framing,'viewport-cover');
 }
});
test('simulation source preserves its baseline except for named engine fixes and the opt-in opening lesson',()=>{
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
 const evidence=JSON.parse(fs.readFileSync(path.join(__dirname,'r80-native-integrity.json')));
 for(const [file,hash]of Object.entries(evidence)){const raw=fs.readFileSync(path.join(__dirname,'..','src',file),'utf8');const baseline=file==='native-restoration-run.js'?raw
   .replace(/   const openingBump=this\.options\.openingAssist===true[\s\S]*?(?=   this\.nativeFrame=r\.state;)/,'')
   .replace('this.lastOpeningBump=null;','')
   .replace('countdown:s.r.timerT','countdown:s.u.s'):raw;
  const data=baseline.replace("const structuredClone=root.MongyuStateClone?.clone||root.structuredClone; // R84 snapshot copy binding\n",'').replace('root.MongyuNativeRenderParameters=Object.freeze(load("experiments/r77-native-render/parameters.cjs")); // R86 read-only render parameters binding\n','');assert.equal(crypto.createHash('sha256').update(data.replace(/^.*R86 bounded spawn recovery binding\n/m,'').replace(/^.*R87 verified idle recovery 0x55c6c -> 0x56f20 -> 0x55c8a\n/m,'').replace('   Runtime.finalizeEntity(e);e.a=1;if(e.i===1)e.c=3; // R87 verified y.c field token 0x012c0095; y.l is 0x012c00a7\n','   Runtime.finalizeEntity(e);e.a=1;if(e.i===1)e.l=3;\n')).digest('hex'),hash,file)}
});
