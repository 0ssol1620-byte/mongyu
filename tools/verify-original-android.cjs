/* Installable-APK checks on an accelerated disposable Android emulator.
 * The two QA packages use an ephemeral CI certificate, never the preview key.
 */
const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const out=path.resolve('ci/device'),pkg='org.quadrift.mongyu.preview.r82',activity=pkg+'/org.quadrift.hddevelopment.MainActivity';
fs.mkdirSync(out,{recursive:true});
const adb=(...args)=>execFileSync('adb',args,{encoding:'utf8',timeout:60000,maxBuffer:16*1024*1024}).trim();
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const report={scope:'Accelerated Android emulator, actual installed APKs. Original-file player. Synthetic version-92/93 host packages use one ephemeral QA signing key. Original archive is separately supplied for private QA and never packaged or uploaded. Not physical handset certification.',checks:[],errors:[]};
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
async function tap(id){const q=await evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});if(!e||e.disabled||e.hidden)return null;e.scrollIntoView({block:"nearest",inline:"nearest",behavior:"instant"});const r=e.getBoundingClientRect();return r.width&&r.height?{x:r.x+r.width/2,y:r.y+r.height/2}:null})()`);assert.ok(q,id+' is visible');await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[q]});await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(100)}
async function screenshot(name){await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(out,name+'.png'),Buffer.from(shot.data,'base64'));fs.writeFileSync(path.join(out,name+'-android.png'),execFileSync('adb',['exec-out','screencap','-p'],{maxBuffer:16*1024*1024}))}
function xmlNodes(xml){return [...xml.matchAll(/<node\b[^>]+>/g)].map(m=>Object.fromEntries([...m[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(x=>[x[1],x[2]])))}
function androidTapLabel(label){adb('shell','uiautomator','dump','/sdcard/mongyu-picker.xml');const xml=adb('shell','cat','/sdcard/mongyu-picker.xml'),node=xmlNodes(xml).find(n=>(n.text===label||n['content-desc']===label)&&n.bounds);if(!node)return false;const b=node.bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);adb('shell','input','tap',String((+b[1]+ +b[3])/2),String((+b[2]+ +b[4])/2));return true}
async function selectOriginal(){await tap('chooseOriginal');await delay(800);const file='MONGYU-original-qa.zip';for(let i=0;i<3;i++){if(androidTapLabel(file))return;androidTapLabel('Show roots');await delay(300);androidTapLabel('Downloads');await delay(500)}throw Error('Original file was not reachable in the actual system picker')}
const inspect=()=>evaluate('MongyuOriginal.inspect()');
async function pixelHash(){const shot=await send('Page.captureScreenshot',{format:'png'});return crypto.createHash('sha256').update(Buffer.from(shot.data,'base64')).digest('hex')}
(async()=>{try{
 await delay(20000);adb('logcat','-c');adb('shell','settings','put','secure','immersive_mode_confirmations','confirmed');
 adb('push',process.argv[4],'/sdcard/Download/MONGYU-original-qa.zip');
 adb('shell','am','broadcast','-a','android.intent.action.MEDIA_SCANNER_SCAN_FILE','-d','file:///sdcard/Download/MONGYU-original-qa.zip');
 report.webView=adb('shell','dumpsys','webviewupdate').split('\n').filter(x=>/Current WebView package/.test(x));
 adb('install','--no-incremental','-t','-r',process.argv[2]);adb('shell','am','start','-W','-n',activity);await connect();
 await waitFor(()=>evaluate('!!window.MongyuOriginal&&document.getElementById("busy").hidden'),'original player boot');assert.equal((await inspect()).ready,false);
 await selectOriginal();await waitFor(()=>evaluate('MongyuOriginal.inspect().ready'),'real SAF import');const imported=await inspect();assert.equal(imported.resourceCount,106);assert.equal(imported.originalMusicFiles,17);assert.equal(imported.jarDigest,'aeadd87840c7b3f1f06548489406dbc0bf833b41de9cdfa3eaf741e832a213c2');report.checks.push({name:'actual system file picker imports unchanged original resources',resourceCount:imported.resourceCount,musicFiles:imported.originalMusicFiles,jarDigest:imported.jarDigest,passed:true});
 await tap('startOriginal');await waitFor(()=>evaluate('MongyuOriginal.inspect().frames>120'),'original engine rendering');
 const first=await inspect();assert.equal(first.platform,'KTF');assert.equal(first.speed,1);assert.equal(first.audio,'running');
 for(let i=0;i<18;i++){await delay(1600);await tap('screen');assert.equal(await evaluate('document.getElementById("errorPanel").hidden'),true)}
 await waitFor(()=>evaluate('MongyuOriginal.inspect().savedSequence>0'),'original guest save writes',30000);
 const played=await inspect();report.checks.push({name:'actual original guest renders, runs at configured 1x, starts audio and writes its save',...played,passed:true});
 await tap('pauseOriginal');const paused=await inspect(),hash=await pixelHash();await delay(600);assert.equal((await inspect()).frames,paused.frames);assert.deepEqual((await inspect()).held,[]);assert.equal((await inspect()).audio,'suspended');assert.equal(await pixelHash(),hash);report.checks.push({name:'pause freezes original frames and sound and releases input',passed:true});
 await tap('resumeOriginal');await waitFor(()=>evaluate('MongyuOriginal.inspect().state==="play"'),'explicit resume');adb('shell','input','keyevent','4');await waitFor(()=>evaluate('MongyuOriginal.inspect().state==="pause"'),'native back pause');
 adb('shell','input','keyevent','3');adb('shell','am','start','-W','-n',activity);await delay(500);assert.equal((await inspect()).state,'pause');report.checks.push({name:'Android back and background require explicit resume',passed:true});
 const key='mongyu.r93.original.'+played.gameId,record=await evaluate('_MongyuStore.read('+JSON.stringify(key)+')');assert.ok(record?.startsWith('v'));assert.ok(await evaluate('_MongyuStore.write("mongyu.r93.qa","r93-update-canary")'));
 adb('install','--no-incremental','-t','-r',process.argv[3]);adb('shell','am','start','-W','-n',activity);await connect();await waitFor(()=>evaluate('MongyuOriginal.inspect().ready'),'imported original after update');assert.equal((await inspect()).gameId,played.gameId);assert.equal(await evaluate('_MongyuStore.read('+JSON.stringify(key)+')'),record);assert.equal(await evaluate('_MongyuStore.read("mongyu.r93.qa")'),'vr93-update-canary');
 await tap('startOriginal');await waitFor(()=>evaluate('MongyuOriginal.inspect().frames>30'),'original restart');assert.ok((await inspect()).savedSequence>=paused.savedSequence);report.checks.push({name:'APK update retains the exact imported file and original save record',passed:true});
 await tap('pauseOriginal');let pid=adb('shell','pidof',pkg);await crashRenderer();await connect();await waitFor(()=>evaluate('MongyuOriginal.inspect().ready'),'renderer recovery import');assert.equal(adb('shell','pidof',pkg),pid);assert.equal((await inspect()).gameId,played.gameId);assert.equal(await evaluate('_MongyuStore.read("mongyu.r93.qa")'),'vr93-update-canary');report.checks.push({name:'renderer recovery keeps imported file and private save storage',passed:true});assert.deepEqual(report.errors,[]);
 }catch(e){report.failure=e.stack;process.exitCode=1;try{report.failureState=await inspect();report.nativeFocus=adb('shell','dumpsys','window','windows').split('\n').filter(x=>/mCurrentFocus|mFocusedApp/.test(x));adb('shell','uiautomator','dump','/sdcard/mongyu-error.xml');report.nativeNodes=xmlNodes(adb('shell','cat','/sdcard/mongyu-error.xml')).map(n=>({text:n.text,description:n['content-desc']})).filter(n=>n.text||n.description)}catch(_){}
 }finally{if(ws)ws.close();report.passed=!report.failure;fs.writeFileSync(path.join(out,'android-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));}
})().catch(e=>{console.error(e);process.exitCode=1});
