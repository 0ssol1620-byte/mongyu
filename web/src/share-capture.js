/* R104 poster image and short clip capture for sharing. Owned by workstream I.
   - Poster: 1080x1920 (9:16) PNG of the game canvas (snapshot taken at the clear) with a 몽유 caption frame.
   - Clip: while a run plays, the canvas is composited at 30 fps into a 540x960 (9:16) canvas whose
     captureStream() feeds two staggered MediaRecorders (restarted every SEGMENT ms). When the run ends the
     older recorder is stopped, so the clip holds the last ~4.5-9 s (the goal moment / aurora).
   - Export: navigator.share({files}) on touch devices when available, otherwise an <a download> link. No network. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const doc=root.document;
const CLIP_W=540,CLIP_H=960,POSTER_W=1080,POSTER_H=1920,FPS=30,SEGMENT=9000,STAGGER=4500;
const PREF_KEY='mongyu.r104.capture';
const MIMES=['video/mp4;codecs=avc1.42E01E','video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
function pickMime(MR=root.MediaRecorder){if(!MR||typeof MR.isTypeSupported!=='function')return '';for(const m of MIMES){try{if(MR.isTypeSupported(m))return m}catch(_){}}return ''}
function videoSupported(){
 try{return !!(enabled&&root.MediaRecorder&&root.HTMLCanvasElement&&typeof root.HTMLCanvasElement.prototype.captureStream==='function'&&pickMime())}catch(_){return false}
}
function isWebView(){try{return /\bwv\b|; wv\)/.test(root.navigator?.userAgent||'')}catch(_){return false}}
function canExport(){return !isWebView()||typeof root.navigator?.share==='function'}
function extFor(type){return /mp4/.test(type)?'mp4':/webm/.test(type)?'webm':'bin'}
/* Crop rectangle for a 9:16 cover fit of a w x h source, centred (focusY = fraction of height to keep centred). */
function coverCrop(w,h,ratio=9/16,focusY=.5){
 if(w/h>ratio){const cw=h*ratio;return {sx:(w-cw)/2,sy:0,sw:cw,sh:h}}
 const ch=w/ratio;return {sx:0,sy:Math.max(0,Math.min(h-ch,h*focusY-ch/2)),sw:w,sh:ch};
}
let store=null;
function storage(){if(store)return store;try{const s=root.localStorage;store=root.MongyuStorage?root.MongyuStorage.create(s):s}catch(_){store=null}return store}
function readPref(){try{return storage()?.getItem(PREF_KEY)!=='off'}catch(_){return true}}
let wanted=readPref();

/* ---------- rolling recorder ---------- */
const rec={canvas:null,ctx:null,stream:null,mime:'',slots:[],lastDraw:0,run:null,clip:null,clipRun:null,pending:null,error:null,started:false};
function ensureComposite(){
 if(rec.canvas)return true;
 try{
  rec.canvas=doc.createElement('canvas');rec.canvas.width=CLIP_W;rec.canvas.height=CLIP_H;rec.ctx=rec.canvas.getContext('2d');
  rec.mime=pickMime();rec.stream=rec.canvas.captureStream(FPS);return !!rec.ctx;
 }catch(e){rec.error=e;rec.canvas=null;return false}
}
function newSlot(now){
 const chunks=[];let recorder;
 try{recorder=new root.MediaRecorder(rec.stream,{mimeType:rec.mime,videoBitsPerSecond:2500000})}catch(e){rec.error=e;return null}
 const slot={recorder,chunks,startedAt:now,stopped:null};
 recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
 recorder.onerror=e=>{rec.error=e?.error||e};
 try{recorder.start()}catch(e){rec.error=e;return null}
 return slot;
}
function stopSlot(slot){
 return new Promise(resolve=>{
  if(!slot||slot.recorder.state==='inactive')return resolve(slot?new Blob(slot.chunks,{type:rec.mime.split(';')[0]}):null);
  slot.recorder.onstop=()=>resolve(new Blob(slot.chunks,{type:rec.mime.split(';')[0]}));
  try{slot.recorder.stop()}catch(_){resolve(null)}
 });
}
function startRecording(run,now){
 if(!wanted||!videoSupported()||!ensureComposite())return false;
 stopRecording();rec.run=run;rec.started=true;rec.slots=[newSlot(now)].filter(Boolean);rec.secondAt=now+STAGGER;return rec.slots.length>0;
}
function stopRecording(){for(const s of rec.slots){try{if(s.recorder.state!=='inactive')s.recorder.stop()}catch(_){}}rec.slots=[];rec.run=null;rec.started=false}
function service(now,playing){
 if(!rec.started)return;
 // Second staggered recorder, then periodic restarts so the oldest never exceeds SEGMENT.
 if(rec.secondAt&&now>=rec.secondAt){rec.secondAt=0;const s=newSlot(now);if(s)rec.slots.push(s)}
 for(let i=0;i<rec.slots.length;i++){
  const s=rec.slots[i];
  if(playing&&s.recorder.state==='paused')try{s.recorder.resume()}catch(_){}
  if(!playing&&s.recorder.state==='recording')try{s.recorder.pause()}catch(_){}
  if(playing&&now-s.startedAt>=SEGMENT&&rec.slots.every(o=>o===s||now-o.startedAt>=STAGGER*.8)){
   try{s.recorder.stop()}catch(_){}const n=newSlot(now);if(n)rec.slots[i]=n;else rec.slots.splice(i--,1);
  }
 }
}
/* Freeze the clip: stop the oldest recorder (longest footage) and discard the other. */
function finalize(run){
 if(!rec.started||rec.run!==run)return rec.pending||Promise.resolve(rec.clipRun===run?rec.clip:null);
 const slots=rec.slots.slice().sort((a,b)=>a.startedAt-b.startedAt),now=perf();
 rec.slots=[];rec.started=false;rec.run=null;
 const oldest=slots[0],rest=slots.slice(1);
 for(const s of rest){try{if(s.recorder.state!=='inactive')s.recorder.stop()}catch(_){}}
 const duration=oldest?Math.round(now-oldest.startedAt):0;
 rec.pending=stopSlot(oldest).then(blob=>{rec.pending=null;rec.clip=blob&&blob.size?blob:null;rec.clipRun=run;rec.clipMeta={duration,type:blob?.type||''};return rec.clip});
 return rec.pending;
}
const perf=()=>root.performance?.now?.()??Date.now();
function composite(source,run,caption){
 const c=rec.ctx,crop=coverCrop(source.width,source.height,9/16,.5);
 c.drawImage(source,crop.sx,crop.sy,crop.sw,crop.sh,0,0,CLIP_W,CLIP_H);
 // Small watermark so a shared clip carries the name.
 c.save();c.font='700 20px system-ui,sans-serif';c.textAlign='left';c.fillStyle='rgba(255,246,228,.78)';c.shadowColor='rgba(12,6,24,.6)';c.shadowBlur=6;
 c.fillText('몽유',22,CLIP_H-28);c.font='500 13px system-ui,sans-serif';c.fillStyle='rgba(255,246,228,.6)';if(caption)c.fillText(caption,74,CLIP_H-29);c.restore();
}

/* ---------- snapshots and poster ---------- */
const snap={canvas:null,run:null,meta:null};
function snapshot(source,run,meta){
 try{
  if(!source||!source.width)return false;
  if(!snap.canvas)snap.canvas=doc.createElement('canvas');
  snap.canvas.width=source.width;snap.canvas.height=source.height;snap.canvas.getContext('2d').drawImage(source,0,0);snap.run=run;snap.meta=meta||null;return true;
 }catch(_){return false}
}
function wrapText(c,text,maxWidth){const words=String(text||'').split(' '),lines=[];let line='';for(const word of words){const next=line?line+' '+word:word;if(c.measureText(next).width>maxWidth&&line){lines.push(line);line=word}else line=next}if(line)lines.push(line);return lines}
function drawPoster(c,source,info={}){
 const W=POSTER_W,H=POSTER_H;
 c.fillStyle='#120c22';c.fillRect(0,0,W,H);
 if(source&&source.width){const crop=coverCrop(source.width,source.height,9/16,.47);c.drawImage(source,crop.sx,crop.sy,crop.sw,crop.sh,0,0,W,H)}
 // Vignette and caption band.
 const v=c.createRadialGradient(W/2,H*.42,H*.18,W/2,H*.5,H*.75);v.addColorStop(0,'rgba(10,6,22,0)');v.addColorStop(1,'rgba(10,6,22,.55)');c.fillStyle=v;c.fillRect(0,0,W,H);
 const band=c.createLinearGradient(0,H*.66,0,H);band.addColorStop(0,'rgba(14,9,30,0)');band.addColorStop(.18,'rgba(14,9,30,.55)');band.addColorStop(.38,'rgba(14,9,30,.9)');band.addColorStop(1,'rgba(14,9,30,.97)');c.fillStyle=band;c.fillRect(0,H*.66,W,H*.34);
 const top=c.createLinearGradient(0,0,0,H*.2);top.addColorStop(0,'rgba(14,9,30,.95)');top.addColorStop(.45,'rgba(14,9,30,.8)');top.addColorStop(.75,'rgba(14,9,30,.35)');top.addColorStop(1,'rgba(14,9,30,0)');c.fillStyle=top;c.fillRect(0,0,W,H*.2);
 // Thin frame.
 c.save();c.strokeStyle='rgba(255,233,190,.42)';c.lineWidth=2;const m=44,r=28;c.beginPath();c.moveTo(m+r,m);c.arcTo(W-m,m,W-m,H-m,r);c.arcTo(W-m,H-m,m,H-m,r);c.arcTo(m,H-m,m,m,r);c.arcTo(m,m,W-m,m,r);c.closePath();c.stroke();c.restore();
 c.save();c.textAlign='center';c.textBaseline='alphabetic';
 c.font='600 26px system-ui,sans-serif';c.fillStyle='rgba(255,236,214,.75)';const kicker='M O N G Y U';c.fillText(kicker,W/2,124);
 // Wordmark and aurora rule.
 const baseY=H-372;
 c.font='700 150px "Nanum Myeongjo","Noto Serif KR","Apple SD Gothic Neo",serif';c.shadowColor='rgba(140,110,255,.55)';c.shadowBlur=36;c.fillStyle='#fff6ea';c.fillText('몽유',W/2,baseY);c.shadowBlur=0;
 const rule=c.createLinearGradient(W/2-180,0,W/2+180,0);rule.addColorStop(0,'rgba(127,243,225,0)');rule.addColorStop(.2,'#7ff3e1');rule.addColorStop(.45,'#8ab8ff');rule.addColorStop(.7,'#b78cff');rule.addColorStop(.85,'#ff9ed8');rule.addColorStop(1,'rgba(255,158,216,0)');
 c.fillStyle=rule;c.fillRect(W/2-180,baseY+34,360,4);
 c.font='700 46px system-ui,sans-serif';c.fillStyle='#ffe9bf';const lines=wrapText(c,info.title||'밤의 모서리를 넘어',W-200);
 lines.slice(0,2).forEach((line,i)=>c.fillText(line,W/2,baseY+112+i*58));
 c.font='500 32px system-ui,sans-serif';c.fillStyle='rgba(255,240,226,.82)';if(info.subtitle)c.fillText(info.subtitle,W/2,baseY+112+Math.min(2,lines.length)*58+12);
 c.font='500 24px system-ui,sans-serif';c.fillStyle='rgba(255,240,226,.55)';c.fillText(info.date||dateText(),W/2,H-92);
 c.restore();
}
function dateText(d=new Date()){return d.getFullYear()+'.'+String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0')}
function poster(info={},source){
 return new Promise((resolve,reject)=>{
  try{
   const src=source||(snap.canvas&&(!info.run||snap.run===info.run)?snap.canvas:root.MongyuPolish?.host?.canvas);
   const out=doc.createElement('canvas');out.width=POSTER_W;out.height=POSTER_H;drawPoster(out.getContext('2d'),src,info);
   out.toBlob(blob=>blob?resolve(blob):reject(Error('poster encode failed')),'image/png');
  }catch(e){reject(e)}
 });
}
function clip(run){if(rec.pending)return rec.pending;return Promise.resolve(rec.clip&&(!run||rec.clipRun===run)?rec.clip:null)}
function hasClip(run){return !!(rec.pending&&rec.run===null)||!!(rec.clip&&(!run||rec.clipRun===run))}

/* ---------- export ---------- */
let lastExport=null;
async function save(blob,name,options={}){
 if(!blob)return {ok:false,method:'none'};
 const nav=root.navigator,coarse=(()=>{try{return root.matchMedia?.('(pointer:coarse)').matches}catch(_){return false}})();
 if(options.share!==false&&coarse&&typeof nav?.share==='function'&&typeof root.File==='function'){
  try{
   const file=new File([blob],name,{type:blob.type});
   if(!nav.canShare||nav.canShare({files:[file]})){await nav.share({files:[file],title:'몽유'});lastExport={ok:true,method:'share',name,type:blob.type,size:blob.size};return lastExport}
  }catch(e){if(e?.name==='AbortError'){lastExport={ok:false,method:'share-cancel',name,type:blob.type,size:blob.size};return lastExport}}
 }
 try{
  const url=root.URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download=name;a.rel='noopener';a.style.display='none';
  doc.body.appendChild(a);a.click();a.remove();root.setTimeout(()=>root.URL.revokeObjectURL(url),60000);
  lastExport={ok:true,method:'download',name,type:blob.type,size:blob.size};return lastExport;
 }catch(e){lastExport={ok:false,method:'error',error:String(e)};return lastExport}
}
function fileStamp(d=new Date()){return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'-'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0')+String(d.getSeconds()).padStart(2,'0')}
async function savePoster(info={}){const blob=await poster(info);return save(blob,'mongyu-'+fileStamp()+'.png',info)}
async function saveClip(run,info={}){const blob=await clip(run);if(!blob)return {ok:false,method:'none'};return save(blob,'mongyu-'+fileStamp()+'.'+extFor(blob.type),info)}
function setWanted(on){wanted=!!on;try{storage()?.setItem(PREF_KEY,on?'on':'off')}catch(_){}if(!wanted)stopRecording()}

/* ---------- bus wiring ---------- */
const ENDINGS=new Set(['clear','fail']);
function captionFor(run){if(!run)return '';if(run.dreamMode==='endless')return '무한 꿈';if(run.dreamMode==='daily')return '오늘의 도전';if(run.dreamMode==='illusion')return '착시 정원';if(run.openingCourse)return '접힌 빛';return run.slot?.title||''}
function wire(bus){
 bus.on('frame',({run})=>{
  if(!run)return;
  const now=perf(),playing=run.state==='play';
  if(!rec.started&&playing&&wanted&&rec.clipRun!==run&&rec.run!==run)startRecording(run,now);
  if(rec.started&&rec.run!==run){if(playing)startRecording(run,now);else return}
  if(!rec.started)return;
  service(now,playing);
  if(playing&&now-rec.lastDraw>=1000/FPS-2){rec.lastDraw=now;const source=bus.host?.canvas;if(source)try{composite(source,run,captionFor(run))}catch(e){rec.error=e}}
 });
 bus.on('run-event',({run,event})=>{
  if(event==='start'&&rec.clipRun===run){rec.clip=null;rec.clipRun=null}
  if(!ENDINGS.has(event))return;
  const source=bus.host?.canvas;
  if(event==='clear'||run?.mode==='dream')snapshot(source,run);
  if(rec.started&&rec.run===run)finalize(run);
 });
}
if(enabled&&root.MongyuPolish)wire(root.MongyuPolish);
const api=Object.freeze({enabled,get supported(){return {video:videoSupported(),export:canExport(),share:typeof root.navigator?.share==='function'}},
 get recording(){return rec.started},get wanted(){return wanted},setWanted,pickMime,coverCrop,poster,drawPoster,clip,hasClip,save,savePoster,saveClip,snapshot,finalize,
 get lastExport(){return lastExport},get clipMeta(){return rec.clipMeta||null},get error(){return rec.error?String(rec.error):null},captionFor,CLIP_W,CLIP_H,POSTER_W,POSTER_H,SEGMENT});
root.MongyuShare=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
