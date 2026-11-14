(function(root){'use strict';
const BPM=120,DURATION=54,TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function timeline(time,act){const t=clamp(Number.isFinite(time)?time:0,0,DURATION),beat=t*2,section=Number.isInteger(act)?clamp(act,0,2):Math.min(2,Math.floor(t/18));return {beat,bar:Math.floor(beat/4),phase:beat%1,section,energy:[.42,.67,.9][section]};}
const notes=[];function add(voice,beat,duration,midi,amp,pan=0){notes.push(Object.freeze({voice,time:beat/2,duration:duration/2,midi,amp,pan}));}
// Original 27-bar miniature: glass corridor, folding garden, open sky.
// Nine bars per act: eight-bar harmonic phrase plus a suspended turnaround.
const roots=[45,45,48,43,41,41,43,40,43],arp=[0,7,12,15,19,12,7,10,0,12,7,15,22,19,12,7];
for(let bar=0;bar<27;bar++){const act=Math.floor(bar/9),local=bar%9,r=roots[local]+(act===2?12:0),b=bar*4,turn=local===8,contract=bar===25;
 // R34 closing: keep the first fifty seconds intact; thin beat100, then resolve to A minor.
 if(bar===26){const tonic=57;add('bass',b,3.7,tonic-12,.16);for(const interval of [0,7,15,19])add('pad',b,3.9,tonic+interval,.05,interval%2?.62:-.62);for(const [j,interval]of [0,7,3,0].entries())add('bell',b+j,1.4,tonic+24+interval,.095,(j%2?.4:-.4));continue;}
 for(let j=0;j<4;j++){if(contract?j%2===0:!turn||j<3)add('kick',b+j,.75,36,act===0?.5:.62);if(contract?j===3:j===1||j===3)add('snare',b+j,.45,0,.18+act*.035);for(let k=0;k<(act&&!contract?2:1);k++)add('hat',b+j+k*.5,.18,0,k?.065:.09,(j%2?1:-1)*.45);}
 for(const step of (contract?[0,2]:act===0?[0,1.5,2,3]:[0,.75,1.5,2,2.75,3.5]))add('bass',b+step,.62,r-12,.21,0);
 for(const interval of [0,7,act===1?14:15,22])add('pad',b,turn?3.7:4.2,r+interval,.055,interval%2?.62:-.62);
 const count=contract?8:act===0?4:act===1?8:16;for(let j=0;j<count;j++){const step=4/count,jump=arp[(j+local*3+act*2)%arp.length];add('glass',b+j*step,act===2?.7:1.2,r+12+jump,.09+(j%4===0?.025:0),Math.sin(j*1.7+bar)*.72);}
 if(turn)for(let j=0;j<6;j++)add('bell',b+j*.5,1.3,r+24+[0,7,10,14,19,22][j],.1,(j%2?.5:-.5));
}
notes.sort((a,b)=>a.time-b.time);Object.freeze(notes);
const hz=m=>440*Math.pow(2,(m-69)/12),noise=(x,seed)=>{const v=Math.sin((x+seed*131)*12.9898)*43758.5453;return (v-Math.floor(v))*2-1;};
function sample(n,t,sr){const u=t-n.time;if(u<0||u>=n.duration)return 0;const f=hz(n.midi),env=Math.min(1,u/.008)*Math.min(1,(n.duration-u)/.045);let x=0;
 if(n.voice==='kick'){const phase=TAU*(46*u+105*.032*(1-Math.exp(-u/.032)));x=Math.sin(phase)*Math.exp(-u*12)+noise(Math.floor(u*sr),7)*Math.exp(-u*180)*.12;}
 else if(n.voice==='hat')x=noise(Math.floor(u*sr),Math.floor(n.time*100)+9)*Math.exp(-u*55)*.7;
 else if(n.voice==='snare')x=(noise(Math.floor(u*sr),32)*.75+Math.sin(TAU*185*u)*.25)*Math.exp(-u*22);
 else if(n.voice==='bass')x=(Math.sin(TAU*f*u)+.26*Math.sin(TAU*f*2*u)+.12*Math.sin(TAU*f*3*u))*Math.exp(-u*5);
 else if(n.voice==='pad')x=(Math.sin(TAU*f*u)+.3*Math.sin(TAU*f*1.003*u)+.16*Math.sin(TAU*f*2*u))*Math.sin(Math.PI*u/n.duration)*.65;
 else x=(Math.sin(TAU*f*u+1.9*Math.sin(TAU*f*2*u)*Math.exp(-u*8))+.22*Math.sin(TAU*f*3*u))*Math.exp(-u*(n.voice==='bell'?4:9));
 return x*env*n.amp;
}
function renderNotes(list,start,duration,sampleRate){const sr=clamp(Math.floor(sampleRate)||22050,8000,48000),len=Math.max(0,Math.ceil(clamp(duration,0,2)*sr)),left=new Float32Array(len),right=new Float32Array(len);for(const n of list){if(n.time+n.duration<start||n.time>start+duration)continue;const a=Math.max(0,Math.ceil((n.time-start)*sr)),z=Math.min(len,Math.ceil((n.time+n.duration-start)*sr)),lg=Math.sqrt((1-n.pan)/2),rg=Math.sqrt((1+n.pan)/2);for(let i=a;i<z;i++){const t=(Math.round(start*sr)+i)/sr;if(t<0||t>=DURATION)continue;const v=sample(n,t,sr);left[i]+=v*lg;right[i]+=v*rg;}}
 for(let i=0;i<len;i++){const t=(Math.round(start*sr)+i)/sr,fade=clamp(t/.025,0,1)*clamp((54-t)/.3,0,1);left[i]=Math.tanh(left[i]*.72)*.7*fade;right[i]=Math.tanh(right[i]*.72)*.7*fade;}return {left,right,sampleRate:sr};}
function renderBlock(start,duration=1,sampleRate=22050){return renderNotes(notes,Number.isFinite(start)?start:0,duration,sampleRate);}
function response(time,section=0,sampleRate=22050){const beat=Math.ceil(time*4)/2,base=[69,72,76][clamp(section,0,2)],list=[0,7,12].map((v,i)=>({voice:'bell',time:beat/2+i*.0625,duration:.48,midi:base+v,amp:.14,pan:(i-1)*.4}));return {time:beat/2,pcm:renderNotes(list,beat/2,.7,sampleRate)};}
function createPlayer(context,outputs={}){const cache=new Map(),sources=new Set(),sampleRate=22050,chunkSamples=2756,chunk=chunkSamples/sampleRate;let anchor=null,next=0,generation=0,lastTime=null;const gain=context.createGain();gain.gain.value=.78;gain.connect(outputs.musicDestination||context.destination);const effectsGain=outputs.effectsDestination?context.createGain():gain;if(effectsGain!==gain){effectsGain.gain.value=.78;effectsGain.connect(outputs.effectsDestination)}
 function buffer(pcm){const b=context.createBuffer(2,pcm.left.length,pcm.sampleRate);b.getChannelData(0).set(pcm.left);b.getChannelData(1).set(pcm.right);return b;}
 function cached(index){if(cache.has(index))return cache.get(index);const b=buffer(renderBlock(index*chunk,chunk,sampleRate));cache.set(index,b);if(cache.size>12)cache.delete(cache.keys().next().value);return b;}
 function stop(){generation++;for(const s of sources){try{s.stop();s.disconnect()}catch(e){}}sources.clear();anchor=null;lastTime=null;}
 function play(b,when,offset=0,duration,output=gain){const s=context.createBufferSource();s.buffer=b;s.connect(output);sources.add(s);const token=generation;s.onended=()=>{sources.delete(s);try{s.disconnect()}catch(e){}};if(token!==generation)return;s.start(when,offset,duration);}
 function update(time){if(!Number.isFinite(time)||time<0||time>=54){stop();return;}if(anchor===null||lastTime!==null&&(time<lastTime-.05||Math.abs((context.currentTime-anchor)-time)>.15)){stop();anchor=context.currentTime-time+.025;next=time;}lastTime=time;const end=Math.min(54,(Math.floor(time/18)+1)*18);let cold=0;while(next<Math.min(end,time+.18)){const index=Math.floor(next/chunk+1e-7),offset=Math.max(0,next-index*chunk),duration=Math.min(chunk-offset,end-next);if(!cache.has(index)&&cold++>=2)break;const b=cached(index);play(b,Math.max(context.currentTime,anchor+next),offset,duration);next=index*chunk+offset+duration;}}
 function perfect(time){if(anchor===null||sources.size>=7)return;const r=response(time,timeline(time).section);if(r.time>=Math.min(54,(Math.floor(time/18)+1)*18))return;play(buffer(r.pcm),Math.max(context.currentTime,anchor+r.time),0,Math.min(.7,Math.min(54,(Math.floor(time/18)+1)*18)-r.time),effectsGain);}
 return {update,stop,perfect,inspect:()=>({generation,active:sources.size,cache:cache.size,anchor,chunkSeconds:chunk,chunkSamples,sampleRate})};}
const api={BPM,DURATION,timeline,score:()=>notes,renderBlock,response,createPlayer};root.MongyuDreamScore=Object.freeze(api);if(typeof module!=='undefined')module.exports=api;
})(globalThis);
