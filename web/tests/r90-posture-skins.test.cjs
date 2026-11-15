const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../src/mobile-presentation.js'),Palette=require('../src/native-palette.js'),S=require('../src/native-scene.js'),Skins=require('../src/map-skin-journal.js');
const knee=([a,k,b])=>Math.acos(Math.max(-1,Math.min(1,((a[0]-k[0])*(b[0]-k[0])+(a[1]-k[1])*(b[1]-k[1]))/121)))*180/Math.PI;
test('standing and loaded mid-stance extend the knee instead of keeping a deep permanent crouch',()=>{
 for(const leg of M.gait(0,{pose:'stand'}).legs)assert.ok(knee(leg)>150);
 for(const u of [.2,.25,.3]){const pose=M.gait(0,{strideDistance:u*42});assert.ok(knee(pose.legs[0])>140&&knee(pose.legs[0])<165,'loaded knee stays extended and soft at '+u);assert.ok(pose.hip[1]<-21.5)}
 for(let i=0;i<120;i++){const pose=M.gait(0,{strideDistance:i/120*110/3});for(const [a,k,b]of pose.legs){assert.ok(Math.abs(Math.hypot(a[0]-k[0],a[1]-k[1])-11)<1e-8);assert.ok(Math.abs(Math.hypot(b[0]-k[0],b[1]-k[1])-11)<1e-8)}}
});
test('native body and tile units retain their ratio with the original-sized short-axis framing',()=>{
 const cam=M.camera({width:390,height:844},{nativeRuntime:true,player:{x:0,y:0,bodyHeight:42.5}}, {},{});assert.equal(cam.scale,390/384);assert.ok(42.5*cam.scale/390>.10&&42.5*cam.scale/390<.12);assert.equal(42.5/16,2.65625);assert.equal(cam.zoom,1);
});
test('all 100 cell palettes use their recorded swatches rather than a ten-theme modulo',()=>{
 const variants=new Set();for(let i=0;i<100;i++){const colors=Palette.get(i).colors,p=S.scenePalette(i);assert.deepEqual(p,[colors[0],colors[3],colors[1],colors[2]]);assert.equal(S.cellStyle({palette:i,frame:1},{palette:i},p).base,colors[3]);assert.equal(S.cellStyle({palette:i,frame:2},{palette:i},p).base,colors[1]);variants.add(p.join())}assert.ok(variants.size>70);
});
test('moving boxes rotate in four real frame phases about their command centre',()=>{
 for(const frame of [0,1,2,3]){const calls=[],c=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push([k,...a]),set:(o,k,v)=>(o[k]=v,true)}),cmd=Object.freeze({role:'cell-decoration',palette:5,kind:1,frame,screenX:100,screenY:80,alpha:191}),scene={palette:5,origin:{x:10,y:20}},before=JSON.stringify(cmd);S.tile(c,cmd,scene,S.scenePalette(5));assert.equal(c.fillStyle,Palette.get(5).colors[3],'rotation cannot change the box material');assert.deepEqual(calls.find(c=>c[0]==='translate'),['translate',144,96]);assert.equal(calls.find(c=>c[0]==='rotate')[1],[-Math.PI/8,Math.PI/4,Math.PI/8,0][frame]);const rect=calls.find(c=>c[0]==='fillRect');assert.equal(rect[1],-rect[3]/2);assert.equal(rect[2],-rect[4]/2);assert.equal(c.globalAlpha,191/255);assert.equal(JSON.stringify(cmd),before)}
});
test('skin history persists only observed, earned map palettes and cannot unlock a locked slot',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},j=Skins.create(storage);assert.equal(j.record(2,5,false),false);assert.equal(j.record(2,100,true),false);assert.equal(j.record(2,5,true),true);assert.equal(j.get(2,false),null);assert.equal(j.get(2,true),5);assert.equal(Skins.create(storage).get(2,true),5);assert.deepEqual(Skins.decode('{"schema":1,"records":{"2":5,"101":0,"__proto__":2,"3":1.5,"4":-1}}'),{'2':5});const bad=Skins.create({getItem:()=>null,setItem(){throw Error('full')}});assert.equal(bad.record(2,5,true),false);assert.equal(bad.inspect().saved,false);
});
test('earned skin previews use all 64 actual folded background cells without gameplay writes',()=>{
 const colors=[],c={fillRect(){colors.push(this.fillStyle)}};Skins.draw(c,5);assert.equal(colors.length,64);for(let n=0;n<64;n++){const f=n>31?63-n:n;assert.equal(colors[n],Palette.color(5,{packedPaletteOffset:112+(f>>1),nibble:f&1?'high':'low',brightnessDelta:0,grayTransform:'none'},true))}
});
