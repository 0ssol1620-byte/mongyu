/* Installable-APK checks on an accelerated disposable Android emulator.
 * The two QA packages use an ephemeral CI certificate, never the preview key.
 */
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const out=path.resolve('ci/device'),pkg='org.quadrift.mongyu.preview.r82',activity=pkg+'/org.quadrift.hddevelopment.MainActivity';
fs.mkdirSync(out,{recursive:true});
const adb=(...args)=>execFileSync('adb',args,{encoding:'utf8',timeout:60000,maxBuffer:16*1024*1024}).trim();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const report={scope:'API35 emulator; actual R93 importer to R94 standalone upgrade with one ephemeral QA key. No original game file, progress injection or file import. Not physical handset certification.',checks:[],errors:[]};
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
async function tap(id){const q=await evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});if(!e||e.disabled||e.hidden)return null;e.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"});const r=e.getBoundingClientRect();return r.width&&r.height?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`);assert.ok(q,id+' is visible');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});if(id==='screen')await delay(150);await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(100)}
async function screenshot(name){await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(shot.data,'base64'));fs.writeFileSync(path.join(out,name+'-android.png'),execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:16*1024*1024}))}
async function crashRenderer(){try{await send('Page.crash')}catch(_){}await delay(1000)}
function xmlNodes(xml){return [...xml.matchAll(/<node\b[^>]+>/g)].map(m=>Object.fromEntries([...m[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])))}
async function androidSnapshot(){
 for(let attempt=0;attempt<8;attempt++){
  try{const result=adb('shell','uiautomator','dump','--compressed','/sdcard/mongyu-picker.xml');if(result.includes('dumped')){const xml=adb('shell','cat','/sdcard/mongyu-picker.xml');if(xml.includes('<hierarchy'))return {xml,nodes:xmlNodes(xml)}}}catch(_){}
  await delay(350);
 }
 throw Error('System picker accessibility tree did not settle');
}
async function androidTapLabel(label,snapshot){const {nodes}=snapshot||await androidSnapshot(),node=nodes.find(n=>(n.text===label||n['content-desc']===label)&&n.bounds);if(!node)return false;const b=node.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);adb('shell','input','tap',String((+b[1]+ +b[3])/2),String((+b[2]+ +b[4])/2));return true}

async function dismissLauncherAnr(){
 const snapshot=await androidSnapshot();
 if(/Quickstep isn(?:'|&apos;|&amp;apos;)t responding/.test(snapshot.xml)){
  assert.ok(await androidTapLabel('Close app',snapshot),'only the identified Quickstep system launcher ANR may be dismissed');
  (report.environmentIssues??=[]).push('Dismissed explicitly identified first-boot Quickstep ANR; never a game ANR');await delay(600);
 }else if(/(?:isn.t|not) responding/.test(snapshot.xml))throw Error('Unexpected application ANR; not dismissed');
}

const inspect=()=>evaluate('MongyuOriginal.inspect()');
async function pixelHash(){const shot=await send('Page.captureScreenshot',{format:'png'});return crypto.createHash('sha256').update(Buffer.from(shot.data,'base64')).digest('hex')}
(async()=>{try{
 await delay(20000);adb('logcat','-c');adb('shell','settings','put','secure','immersive_mode_confirmations','confirmed');
 adb('install','--no-incremental','-t','-r',process.argv[2]);adb('shell','am','start','-W','-n',activity);await connect();
 await waitFor(()=>evaluate('!!window.MongyuOriginal&&document.getElementById("busy").hidden'),'R93 import-only boot');await dismissLauncherAnr();assert.equal((await inspect()).ready,false);assert.equal(await evaluate('!!document.getElementById("chooseOriginal")'),true);
 assert.ok(await evaluate('_MongyuStore.write("mongyu.r93.qa","r94-update-canary")'));assert.ok(await evaluate('_MongyuStore.write("mongyu.r93.original.'+'a'.repeat(64)+'","opaque-original-journal-probe")'));report.checks.push({name:'actual R93 has no original selected; existing private keys recorded',passed:true});
 adb('install','--no-incremental','-t','-r',process.argv[3]);adb('shell','am','start','-W','-n',activity);await connect();
 await dismissLauncherAnr();assert.equal(await evaluate('QUAD_RIFT_APP.getState().state'),'title');assert.equal(await evaluate('document.querySelectorAll("input[type=file],#chooseOriginal").length'),0);assert.equal(await evaluate('typeof window.MongyuOriginal'),'undefined');assert.equal(await evaluate('_MongyuStore.read("mongyu.r93.qa")'),'vr94-update-canary');assert.equal(await evaluate('_MongyuStore.read("mongyu.r93.original.'+'a'.repeat(64)+'")'),'vopaque-original-journal-probe');await screenshot('title');report.checks.push({name:'R93 upgrades to standalone title without file requirement and preserves prior keys',passed:true});
 await tap('titleContinue');await tap('restorationSceneNext');await tap('restorationSceneNext');await tap('restorationStart');await waitFor(()=>evaluate('QUAD_RIFT_APP.activeRun()?.updates>45'),'real standalone movement');assert.equal(await evaluate('QUAD_RIFT_APP.activeRun().state'),'play');
 const coverage=await evaluate('(()=>{const r=document.getElementById("stage").getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,screenWidth:innerWidth,screenHeight:innerHeight}})()');assert.equal(coverage.x,0);assert.equal(coverage.y,0);assert.ok(Math.abs(coverage.width-coverage.screenWidth)<1&&Math.abs(coverage.height-coverage.screenHeight)<1);
 await waitFor(()=>evaluate('QUAD_RIFT_APP.musicView().playing'),'standalone audio');const music=await evaluate('QUAD_RIFT_APP.musicView()');assert.equal(music.backend,'licensed-media');assert.equal(music.artist,'Eric Skiff');
 const before=await evaluate('QUAD_RIFT_APP.activeRun().updates');await tap('game');await delay(250);const after=await evaluate('QUAD_RIFT_APP.activeRun().updates');assert.ok(after>before);await screenshot('play');report.checks.push({name:'no supplied game file: story, campaign start, full-screen movement, touch and music',coverage,music:{artist:music.artist,backend:music.backend,trackId:music.trackId},passed:true});
 await tap('pause');const time=await evaluate('QUAD_RIFT_APP.activeRun().time');await delay(500);assert.equal(await evaluate('QUAD_RIFT_APP.activeRun().time'),time);await tap('resumePlay');await dismissLauncherAnr();adb('shell','input','keyevent','4');await waitFor(()=>evaluate('QUAD_RIFT_APP.activeRun().state==="pause"'),'native back');adb('shell','input','keyevent','3');adb('shell','am','start','-W','-n',activity);await delay(400);assert.equal(await evaluate('QUAD_RIFT_APP.activeRun().state'),'pause');report.checks.push({name:'pause, native back and background freeze play until explicit resume',passed:true});
 await tap('pauseHome');await tap('shopOpen');await tap('look-ink');await tap('wardrobeClose');const collected=await evaluate('QUAD_RIFT_APP.restoration.view().status.collected');assert.ok(collected>=1);
 adb('shell','am','force-stop',pkg);adb('shell','am','start','-W','-n',activity);await connect();assert.equal(await evaluate('QUAD_RIFT_APP.mobileWardrobe.view().selected'),'ink');assert.equal(await evaluate('QUAD_RIFT_APP.restoration.view().status.collected'),collected);assert.equal(await evaluate('_MongyuStore.read("mongyu.r93.qa")'),'vr94-update-canary');report.checks.push({name:'cold relaunch retains legitimate story progress, outfit and R93 keys',collected,passed:true});
 const pid=adb('shell','pidof',pkg);await crashRenderer();await connect();assert.equal(adb('shell','pidof',pkg),pid);assert.equal(await evaluate('QUAD_RIFT_APP.mobileWardrobe.view().selected'),'ink');assert.equal(await evaluate('_MongyuStore.read("mongyu.r93.qa")'),'vr94-update-canary');report.checks.push({name:'renderer recovery returns to playable title without losing private records',passed:true});await screenshot('recovered');assert.deepEqual(report.errors,[]);
 }catch(e){report.failure=e.stack;process.exitCode=1;try{report.failureState=await evaluate('({state:QUAD_RIFT_APP.getState(),run:QUAD_RIFT_APP.activeRun()?.state})');await screenshot('failure')}catch(_){}}
 finally{if(ws)ws.close();report.passed=!report.failure;fs.writeFileSync(path.join(out,'android-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))}
})().catch(e=>{console.error(e);process.exitCode=1});
