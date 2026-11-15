const {chromium}=require('playwright'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/web/MONGYU_R85.html');await page.waitForFunction(()=>window.QUAD_RIFT_APP);
 const frames=[];for(const step of [44,118,164,177]){
 frames.push(await page.evaluate(step=>{let canvas=document.getElementById('dog-preview');if(!canvas){canvas=document.createElement('canvas');canvas.id='dog-preview';canvas.width=390;canvas.height=844;canvas.style='position:fixed;inset:0;width:390px;height:844px;z-index:2147483647';document.body.append(canvas)}
 const r=new MongyuNativeRestoration.RestorationRun({slot:MongyuRestorationCatalog.getSlot(23),settings:{speed:'fast'}});r.start();for(let i=0;i<step;i++){if(i%6===0)r.action();MongyuPresentation.advance(r,.075);MongyuPresentation.geometry(r,{})}r.remainder=37.5;const g=MongyuPresentation.geometry(r,{}),ctx=canvas.getContext('2d');let result;const start=performance.now();for(let i=0;i<60;i++)result=MongyuSquareArt.draw(ctx,r,{viewport:{width:390,height:844},presentationTime:step*.075+i/60});
 const d=g.companion,c=result.camera;if(!d||!Number.isFinite(d.x))throw Error('missing dog');return {step,playerFace:g.player.face,dogFace:d.face,historyIndex:d.historyIndex,zoom:c.zoom,dogScreen:{x:d.x*c.scale+c.offsetX,y:d.y*c.scale+c.offsetY},meanDrawMs:(performance.now()-start)/60};},step));
 await page.screenshot({path:`/workspace/artifacts/r85/dog-${step}.png`});
 }
 if(errors.length)throw Error(errors.join('\n'));const report={errors,frames,note:'Dedicated renderer capture of genuine native slot 23 snapshots; does not bypass or award player progression.'};fs.writeFileSync('/workspace/artifacts/r85/camera-companion.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
