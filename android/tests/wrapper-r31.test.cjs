'use strict';
// Independent contract tests against the exact staged HTML and Java source.
// DOM/Audio/Sensor stubs are NOT Android, a browser, hardware, or a Java runtime.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const base=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(base,'app/src/main/assets/index.html'),'utf8');
const java=fs.readFileSync(path.join(base,'app/src/main/java/org/quadrift/hddevelopment/MainActivity.java'),'utf8');
const manifest=fs.readFileSync(path.join(base,'app/src/main/AndroidManifest.xml'),'utf8');
const nativeExpressions=[...java.matchAll(/web\.evaluateJavascript\("([^"\n]+)"/g)].map(x=>x[1]);

function boot({storage={},secure=true,sensors=true,permission='granted'}={}){
 const data=new Map(Object.entries(storage)),nodes={},windowEvents={},documentEvents={},frames=new Map(),audios=[];
 let now=0,nextFrame=1,permissionCalls=0,doc;
 const add=(obj,k,fn)=>(obj[k]??=[]).push(fn),remove=(obj,k,fn)=>obj[k]=(obj[k]||[]).filter(f=>f!==fn);
 const drawing=new Proxy({measureText:t=>({width:String(t).length*7}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 for(const match of html.slice(0,html.indexOf('<script>')).matchAll(/<([a-z]+)([^>]*\bid="([^"]+)"[^>]*)>/g)){
  const [,tag,attrs,id]=match;
  nodes[id]={id,tagName:tag.toUpperCase(),hidden:/\bhidden\b/.test(attrs),disabled:false,inert:false,style:{},dataset:{},attrs:{},events:{},children:[],width:360,height:480,clientWidth:336,clientHeight:560,textContent:'',value:'',
   setAttribute(k,v){this.attrs[k]=String(v)},getContext:()=>drawing,appendChild(v){this.children.push(v)},addEventListener(k,f){add(this.events,k,f)},focus(){doc.activeElement=this},querySelectorAll(){return Object.values(nodes).filter(n=>n.id.startsWith('tilt'))},setPointerCapture(){},
   click(event={}){if(!this.disabled){this.focus();return this.onclick?.({timeStamp:now,isTrusted:true,...event})}}
  };
 }
 doc={hidden:false,documentElement:{dataset:{originMemories:'required'}},getElementById:id=>nodes[id]||null,createElement:tag=>({tagName:tag,textContent:''}),activeElement:null,addEventListener:(k,f)=>add(documentEvents,k,f)};
 class AudioContext {
  constructor(){this.state='running';this.currentTime=0;audios.push(this)}
  suspend(){this.state='suspended';return Promise.resolve()}
  resume(){this.state='running';return Promise.resolve()}
  createOscillator(){return{frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}
  createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}
 }
 const orientationEvents={};
 const context={document:doc,console,performance:{now:()=>now},matchMedia:()=>({matches:false}),requestAnimationFrame(fn){const id=nextFrame++;frames.set(id,fn);return id},cancelAnimationFrame:id=>frames.delete(id),setTimeout,clearTimeout,AudioContext,
  localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v))},addEventListener:(k,f)=>add(windowEvents,k,f),removeEventListener:(k,f)=>remove(windowEvents,k,f),devicePixelRatio:1,isSecureContext:secure,
  screen:{orientation:{angle:0,addEventListener:(k,f)=>add(orientationEvents,k,f),removeEventListener:(k,f)=>remove(orientationEvents,k,f)}}};
 if(sensors)context.DeviceOrientationEvent={requestPermission(){permissionCalls++;return typeof permission==='function'?permission():Promise.resolve(permission)}};
 context.window=context;vm.createContext(context);
 for(const [,code]of html.matchAll(/<script>([\s\S]*?)<\/script>/g))vm.runInContext(code,context);
 return {app:context.QUAD_RIFT_APP,context,e:nodes,data,audios,frames,doc,windowEvents,orientationEvents,
  back:()=>vm.runInContext(nativeExpressions[0],context),pause:()=>vm.runInContext(nativeExpressions[1],context),
  permissionCalls:()=>permissionCalls,emit(type,event={}){for(const fn of [...(windowEvents[type]||[])])fn(event)},
  visibility(hidden){doc.hidden=hidden;for(const fn of documentEvents.visibilitychange||[])fn()},
  frame(t){now=t;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(now)},
  openTilt(){nodes.options.click();nodes.tiltOpen.click()}
 };
}

test('staged asset exactly equals delivered R31 and expected digest',()=>{
 const expected=fs.readFileSync(path.join(base,'expected-asset.sha256'),'utf8').trim();
 assert.equal(crypto.createHash('sha256').update(html).digest('hex'),expected);
 assert.equal(expected,'a7fb4f597a6356ba6a42fe9bba75a42f565ea2ca9426a370652889216235f968'); // Immutable R31 delivery identity; embedded legacy app.version is intentionally unchanged.
 assert.match(html,/version:'r12\.0\.0'/);
});
test('new package is isolated debug preview, not an R6 upgrade; Activity remains explicit',()=>{
 assert.match(manifest,/package="org\.quadrift\.mongyu\.preview\.r12"/);
 assert.doesNotMatch(manifest,/package="org\.quadrift\.mongyu\.preview\.debug"/);
 assert.match(manifest,/android:versionCode="7"/);assert.match(manifest,/android:versionName="0\.31\.0-preview-debug"/);
 assert.match(manifest,/android:debuggable="true"/);assert.match(manifest,/android:label="몽유 테스트"/);
 assert.match(manifest,/android:name="org\.quadrift\.hddevelopment\.MainActivity"/);
 assert.match(manifest,/android:minSdkVersion="26"/);assert.match(manifest,/android:targetSdkVersion="36"/);
});
test('permission-free packaged source forbids backup, external intents, native bridges and network/file/content access',()=>{
 assert.doesNotMatch(manifest,/<uses-permission\b/);assert.match(manifest,/android:allowBackup="false"/);assert.match(manifest,/android:usesCleartextTraffic="false"/);
 for(const name of ['AllowFileAccess','AllowContentAccess','AllowFileAccessFromFileURLs','AllowUniversalAccessFromFileURLs','JavaScriptCanOpenWindowsAutomatically','SupportMultipleWindows'])assert.ok(java.includes(`set${name}(false)`),name);
 assert.ok(java.includes('setBlockNetworkLoads(true)'));assert.doesNotMatch(java,/addJavascriptInterface|startActivity\(/);
 assert.ok(java.includes('MIXED_CONTENT_NEVER_ALLOW'));assert.ok(java.includes('"GET".equals(request.getMethod()) && GAME_URL.equals(request.getUrl().toString())'));
 assert.ok(java.includes('return response(403, "Blocked"'));assert.ok(java.includes("connect-src 'none'"));assert.ok(java.includes("frame-src 'none'"));
 assert.ok(java.includes('setAcceptCookie(false)'));assert.ok(java.includes('setAcceptThirdPartyCookies(web, false)'));
 assert.ok(java.includes('setDomStorageEnabled(true)'));assert.ok(java.includes('setMediaPlaybackRequiresUserGesture(true)'));
 assert.ok(java.includes('setWebContentsDebuggingEnabled(BuildConfig.DEBUG)'));
});
test('API-gated system back and native IME-safe viewport are present with no auto game resume',()=>{
 assert.match(java,/SDK_INT >= 30[\s\S]*setDecorFitsSystemWindows\(false\)/);
 assert.ok(java.includes('WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime()'));
 assert.match(manifest,/android:windowSoftInputMode="adjustResize"/);
 assert.match(java,/SDK_INT >= 33[\s\S]*registerOnBackInvokedCallback/);
 assert.ok(java.includes('web.onPause()'));assert.ok(java.includes('web.pauseTimers()'));assert.ok(java.includes('web.resumeTimers()'));assert.ok(java.includes('web.onResume()'));assert.ok(java.includes('web.destroy()'));
 assert.doesNotMatch(java,/QUAD_RIFT_APP\.resume/);assert.equal(nativeExpressions.length,2);
 assert.ok(java.includes('!"true".equals(handled)'));assert.ok(java.includes('moveTaskToBack(true)'));
});
test('actual native JS expressions are harmless before app initialization',()=>{
 assert.equal(vm.runInNewContext(nativeExpressions[0],{window:{}}),false);
 assert.doesNotThrow(()=>vm.runInNewContext(nativeExpressions[1],{window:{}}));
});
test('exact HTML boots all inline modules; native back pauses gameplay, returns home, then yields',()=>{
 const h=boot();assert.equal(h.app.version,'r12.0.0');assert.ok(h.app.getState().memories.available);assert.ok(h.app.tilt);
 assert.equal(h.back(),false);h.e.primary.click();assert.equal(h.app.game.state,'play');
 for(let i=0;i<240&&!h.app.game.waiting;i++)h.app.game.update(1/120);
 h.app.processEvents();h.e.act.click();assert.ok(h.audios.length>0,'explicit tutorial jump starts audio');
 assert.equal(h.back(),true);assert.equal(h.app.game.state,'pause');assert.equal(h.back(),true);assert.equal(h.app.game.state,'title');assert.equal(h.back(),false);
 assert.ok(h.audios.length>0);assert.ok(h.audios.every(a=>a.state==='suspended'));
});
test('native repeated pause freezes simulation/audio; visibility/focus never resumes it',()=>{
 const h=boot();h.e.primary.click();h.frame(0);h.frame(100);h.pause();
 const before=JSON.stringify({time:h.app.game.time,distance:h.app.game.distance,metrics:h.app.game.metrics});
 for(let i=0;i<3;i++){h.pause();h.frame(1000+i*1000)}h.visibility(false);h.emit('focus');
 assert.equal(h.app.game.state,'pause');assert.equal(JSON.stringify({time:h.app.game.time,distance:h.app.game.distance,metrics:h.app.game.metrics}),before);assert.ok(h.audios.every(a=>a.state==='suspended'));
 h.e.pause.click();assert.equal(h.app.game.state,'play');
});
test('settings, memories and tilt each consume native back without exiting the app',()=>{
 const h=boot();h.e.options.click();h.e.memoriesOpen.click();assert.equal(h.app.getState().dialog,'memories');assert.equal(h.back(),true);assert.equal(h.app.getState().dialog,'settings');assert.equal(h.back(),true);assert.equal(h.app.getState().dialog,null);
 h.openTilt();assert.equal(h.app.tilt.active,true);assert.equal(h.back(),true);assert.equal(h.app.tilt.active,false);assert.equal(h.app.getState().dialog,'settings');assert.equal(h.e.stage.inert,true);assert.equal(h.back(),true);assert.equal(h.back(),false);
});
test('tilt starts permission-free; explicit grant attaches sensor then native pause removes listeners and held input',async()=>{
 const h=boot();h.openTilt();assert.equal(h.permissionCalls(),0);assert.equal(h.app.tilt.sensor,false);
 assert.equal(await h.app.tilt.enable(),true);assert.equal(h.permissionCalls(),1);assert.equal(h.windowEvents.deviceorientation.length,1);
 h.emit('deviceorientation',{beta:0,gamma:0});h.emit('deviceorientation',{beta:0,gamma:25});assert.ok(h.app.tilt.axis>0);
 h.e.tiltLeft.events.pointerdown[0]({button:0,pointerId:1});assert.equal(h.app.tilt.manual,-1);
 h.pause();assert.equal(h.app.tilt.running,false);assert.equal(h.app.tilt.sensor,false);assert.equal(h.app.tilt.manual,0);assert.equal(h.windowEvents.deviceorientation.length,0);assert.equal(h.orientationEvents.change.length,0);
 h.emit('focus');h.visibility(false);assert.equal(h.app.tilt.running,false);h.e.tiltPause.click();assert.equal(h.app.tilt.running,true);assert.equal(h.app.tilt.sensor,false);
});
test('denied, insecure or absent motion API safely leaves buttons usable',async()=>{
 for(const opts of [{permission:'denied'},{secure:false},{sensors:false}]){
  const h=boot(opts);h.openTilt();assert.equal(await h.app.tilt.enable(),false);assert.equal(h.app.tilt.sensor,false);
  h.e.tiltJump.click();h.app.tilt.update(.05);assert.ok(h.app.tilt.y>0);assert.ok(h.app.tilt.time>0);
 }
});
test('permission granted after native suspend cannot reactivate motion or time',async()=>{
 let grant;const h=boot({permission:()=>new Promise(r=>grant=r)});h.openTilt();const pending=h.app.tilt.enable();h.app.tilt.update(.05);assert.equal(h.app.tilt.time,0);
 h.pause();grant('granted');assert.equal(await pending,false);assert.equal(h.app.tilt.running,false);assert.equal(h.app.tilt.sensor,false);assert.equal((h.windowEvents.deviceorientation||[]).length,0);
});
test('same-origin storage persists across a fresh HTML boot; back/pause do not erase it',()=>{
 const h=boot({storage:{'quad-rift-hd-r4':JSON.stringify({schema:4,best:913,mute:true,reduced:true,tutorialStatus:'complete'})}});
 assert.equal(h.app.settings.best,913);assert.equal(h.app.settings.mute,true);assert.equal(h.app.settings.reduced,true);assert.equal(h.app.write(),true);
 h.e.primary.click();h.pause();h.back();const stored=Object.fromEntries(h.data);const reopened=boot({storage:stored});
 assert.equal(reopened.app.settings.best,913);assert.equal(reopened.app.settings.mute,true);assert.equal(reopened.app.settings.reduced,true);assert.equal(reopened.app.game.state,'title');
 // This proves the HTML storage contract only, not Android process death or migration between packages.
});
