/* Installable-APK checks on an accelerated disposable Android emulator.
 * The two QA packages use an ephemeral CI certificate, never the preview key.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const out=path.resolve('ci/device'),pkg='org.quadrift.mongyu.preview.r82',activity=pkg+'/org.quadrift.hddevelopment.MainActivity';
fs.mkdirSync(out,{recursive:true});
const adb=(...args)=>execFileSync('adb',args,{encoding:'utf8',timeout:60000,maxBuffer:16*1024*1024}).trim();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const report={scope:'Accelerated Android emulator, actual installed APKs. Synthetic version-89 baseline and current version-90 use one ephemeral QA signing key. Not a physical-phone performance certification.',checks:[],errors:[]};
let ws,serial=0,pending=new Map();
function send(method,params={}){return new Promise((resolve,reject)=>{const id=++serial,timer=setTimeout(()=>{pending.delete(id);reject(Error(method+' timed out'))},15000);pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}))})}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text+': '+JSON.stringify(r.exceptionDetails.exception));return r.result?.value}
async function waitFor(fn,label,timeout=60000){const start=Date.now();let last;while(Date.now()-start<timeout){try{const result=await fn();if(result)return result}catch(e){last=e.message}await delay(300)}throw Error(label+' did not become ready'+(last?': '+last:''))}
async function connect(){
 if(ws){ws.onclose=null;ws.onmessage=null;ws.close()}
 const pid=await waitFor(()=>adb('shell','pidof',pkg).split(' ')[0],'app process');
 await waitFor(()=>adb('shell','cat','/proc/net/unix').includes('webview_devtools_remote_'+pid),'WebView debug socket');
 adb('forward','tcp:9223','localabstract:webview_devtools_remote_'+pid);
 const target=await waitFor(async()=>{const rows=await(await fetch('http://127.0.0.1:9223/json',{signal:AbortSignal.timeout(5000)})).json();return rows.find(r=>r.url==='https://appassets.androidplatform.net/index.html')},'packaged page');
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ws.close();reject(Error('WebView WebSocket handshake timed out'))},10000);ws.onopen=()=>{clearTimeout(timer);resolve()};ws.onerror=()=>{clearTimeout(timer);reject(Error('WebView WebSocket failed'))};});
 ws.onmessage=e=>{const m=JSON.parse(e.data),p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown')report.errors.push({text:m.params.exceptionDetails.text,description:m.params.exceptionDetails.exception?.description,url:m.params.exceptionDetails.url,line:m.params.exceptionDetails.lineNumber})};
 ws.onclose=()=>{for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('renderer disconnected'))}pending.clear()};
 await send('Runtime.enable');await waitFor(()=>evaluate('!!window.QUAD_RIFT_APP'),'game initialization');return pid;
}
async function tap(id){const q=await evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});if(!e||e.disabled||e.hidden)return null;const r=e.getBoundingClientRect();return r.width&&r.height?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`);assert.ok(q,id+' is visible');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(100)}
async function screenshot(name){await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(shot.data,'base64'));fs.writeFileSync(path.join(out,name+'-android.png'),execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:16*1024*1024}))}
const state=()=>evaluate('QUAD_RIFT_APP.activeRun()?.state');
async function crashRenderer(){try{await send('Page.crash')}catch(_){}await delay(1000)}
(async()=>{try{
 // First-boot overlay/package initialization can relaunch every Activity.
 // Let the disposable OS settle before measuring game input and persistence.
 console.log('Waiting for first-boot package and display initialization');await delay(20000);
 report.webView=adb('shell','dumpsys','webviewupdate').split('\n').filter(line=>/Current WebView package/.test(line));
 adb('logcat','-c');adb('shell','settings','put','secure','immersive_mode_confirmations','confirmed');
 adb('install','--no-incremental','-t','-r',process.argv[2]);adb('shell','am','start','-W','-n',activity);await connect();
 console.log('Checking installed title and native play');assert.equal(await evaluate('QUAD_RIFT_APP.getState().state'),'title');await screenshot('title');
 await tap('titleContinue');await tap('restorationSceneNext');await tap('restorationSceneNext');await tap('restorationStart');
 await waitFor(()=>evaluate('QUAD_RIFT_APP.activeRun()?.updates>=45'),'post-countdown native movement');
 assert.equal(await state(),'play');const coverage=await evaluate('(()=>{const r=document.getElementById("stage").getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,screenWidth:innerWidth,screenHeight:innerHeight}})()');report.checks.push({name:'actual fullscreen native play',coverage});assert.equal(coverage.x,0);assert.equal(coverage.y,0);
 // Android's integer innerWidth/Height round fractional CSS pixels at noninteger DPR.
 assert.ok(Math.abs(coverage.width-coverage.screenWidth)<1);assert.ok(Math.abs(coverage.height-coverage.screenHeight)<1);
 const raster=await evaluate('(()=>{const c=document.getElementById("game"),p=c.getContext("2d").getImageData(0,0,c.width,c.height).data;let colored=0;for(let y=1;y<33;y++)for(let x=1;x<33;x++){const i=(Math.floor(y*c.height/33)*c.width+Math.floor(x*c.width/33))*4;if(p[i]+p[i+1]+p[i+2]>36)colored++}return{width:c.width,height:c.height,colored,samples:1024}})()');report.checks.push({name:'native game canvas contains rendered content',raster});assert.ok(raster.colored>32,'game canvas is blank');await screenshot('native-play-ready');
 for(let i=0;i<4;i++){await tap('game');await delay(250)}await screenshot('play');
 await tap('pause');assert.equal(await state(),'pause');let time=await evaluate('QUAD_RIFT_APP.activeRun().time');await delay(400);assert.equal(await evaluate('QUAD_RIFT_APP.activeRun().time'),time);await tap('resumePlay');
 assert.equal(await state(),'play','run remains active before native back');adb('shell','input','keyevent','4');await waitFor(async()=>await state()==='pause','Android back pause');time=await evaluate('QUAD_RIFT_APP.activeRun().time');await delay(400);assert.equal(await evaluate('QUAD_RIFT_APP.activeRun().time'),time);report.checks.push({name:'native back cancels input and freezes simulation',passed:true});
 adb('shell','input','keyevent','3');adb('shell','am','start','-W','-n',activity);await delay(400);assert.equal(await state(),'pause');report.checks.push({name:'foreground return requires explicit resume',passed:true});
 await evaluate(fs.readFileSync(path.join(__dirname,'r90-device-visual.js'),'utf8'));const visual=[];
 for(const [slot,steps]of [[2,30],[3,70],[3,131],[4,154],[12,91],[12,126],[18,136],[48,123],[7,66],[25,90],[57,38],[25,173],[79,183],[95,154],[78,134]]){
  const row=await evaluate('__mongyuQaPose('+JSON.stringify({slot,steps})+')');visual.push(row);assert.ok(row.centreError<1e-6);assert.equal(row.legFills,2);assert.ok(row.legPixels>100);assert.equal(row.intersections,0,'rendered legs enter terrain at slot '+slot);
  if([12,7,57].includes(slot))await screenshot('visual-'+slot+'-'+steps);
 }
 report.checks.push({name:'R90 actual renderer body-centre and leg-contact checks',scope:'Isolated normal-input encounters; no campaign progress writes. Tests actual filled leg raster pixels against inner terrain, not original-game equivalence.',rows:visual,passed:true});await evaluate('document.getElementById("mongyuQaVisual").remove();delete window.__mongyuQaPose');
 console.log('Checking earned map skin persistence through normal input');await tap('resumePlay');
 for(let chunk=0;chunk<24&&await state()==='play';chunk++)await evaluate('(()=>{const r=QUAD_RIFT_APP.activeRun();for(let i=0;i<50&&r.state==="play";i++){if(r.updates%7===0)r.action();MongyuPresentation.advance(r,.075);QUAD_RIFT_APP.processEvents()}QUAD_RIFT_APP.sync();return r.state})()');
 const earnedSkin=await evaluate('(()=>{const r=QUAD_RIFT_APP.activeRun();return {earned:r.result?.nativeProof?.earned===true,palette:r.nativeFrame.map.t,state:r.state}})()');assert.equal(earnedSkin.earned,true);await tap('squareCollection');assert.equal(Number(await evaluate('document.getElementById("restoration-slot-2").dataset.skinPalette')),earnedSkin.palette);
 const skinRecord=await evaluate('MongyuNativeRestoration.isolatedStorage(MongyuStorage.create(localStorage)).getItem(MongyuMapSkins.KEY)');assert.ok(skinRecord);report.checks.push({name:'normal input earns and reveals an observed map skin',...earnedSkin,passed:true});await screenshot('earned-skin');
 await evaluate('QUAD_RIFT_APP.home()');await tap('shopOpen');await tap('look-ink');await tap('wardrobeClose');
 const collected=await evaluate('QUAD_RIFT_APP.restoration.view().status.collected');assert.ok(collected>=1);await evaluate('MongyuStorage.create(localStorage).setItem("mongyu.device.qa","r90-update-canary")');
 console.log('Checking immediate APK update persistence');adb('install','--no-incremental','-t','-r',process.argv[3]);adb('shell','am','start','-W','-n',activity);await connect();
 assert.equal(await evaluate('MongyuStorage.create(localStorage).getItem("mongyu.device.qa")'),'r90-update-canary');assert.equal(await evaluate('QUAD_RIFT_APP.mobileWardrobe.view().selected'),'ink');assert.equal(await evaluate('QUAD_RIFT_APP.restoration.view().status.collected'),collected);assert.equal(await evaluate('MongyuNativePalette.count'),100);assert.equal(await evaluate('MongyuNativeRestoration.isolatedStorage(MongyuStorage.create(localStorage)).getItem(MongyuMapSkins.KEY)'),skinRecord);report.checks.push({name:'APK update retains collected memories, outfit and origin storage',collected,passed:true});
 console.log('Checking bounded renderer recovery');let pid=adb('shell','pidof',pkg);await crashRenderer();await connect();assert.equal(adb('shell','pidof',pkg),pid);assert.equal(await evaluate('MongyuStorage.create(localStorage).getItem("mongyu.device.qa")'),'r90-update-canary');report.checks.push({name:'renderer crash recovers once without killing app or erasing storage',passed:true});
 await crashRenderer();await waitFor(()=>{adb('shell','uiautomator','dump','/sdcard/mongyu-recovery.xml');return adb('shell','cat','/sdcard/mongyu-recovery.xml').includes('다시 열기')},'bounded native recovery panel');assert.equal(adb('shell','pidof',pkg),pid);fs.writeFileSync(path.join(out,'recovery.png'),execFileSync('adb',['exec-out','screencap','-p']));report.checks.push({name:'repeated renderer failure waits for player retry',passed:true});
 const xml=adb('shell','cat','/sdcard/mongyu-recovery.xml'),bounds=xml.match(/text="다시 열기"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);assert.ok(bounds);adb('shell','input','tap',String((+bounds[1]+ +bounds[3])/2),String((+bounds[2]+ +bounds[4])/2));await connect();assert.equal(await evaluate('MongyuStorage.create(localStorage).getItem("mongyu.device.qa")'),'r90-update-canary');report.checks.push({name:'player retry restores game with saved data',passed:true});
 await screenshot('after-recovery');assert.deepEqual(report.errors,[]);
 }catch(e){report.failure=e.stack;process.exitCode=1;
  try{report.failureState=await evaluate('({app:QUAD_RIFT_APP.getState(),run:QUAD_RIFT_APP.activeRun()?.state})')}catch(_){}
  try{report.focus=adb('shell','dumpsys','window','windows').split('\n').filter(line=>/mCurrentFocus|mFocusedApp/.test(line));fs.writeFileSync(path.join(out,'failure-android.png'),execFileSync('adb',['exec-out','screencap','-p']))}catch(_){}
 }finally{
  try{fs.writeFileSync(path.join(out,'logcat.txt'),adb('logcat','-d'))}catch(_){}
  if(ws)ws.close();report.passed=!report.failure;fs.writeFileSync(path.join(out,'android-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }})().catch(e=>{console.error(e);process.exitCode=1});
