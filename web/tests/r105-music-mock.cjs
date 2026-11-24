/* Minimal Web Audio stand-in for the music tests: records every source start/stop so voice concurrency can be measured independently of the module's own accounting.
   Sources that are never stopped (the session LFOs) are counted as infrastructure, not voices. */
function param(){const p={value:0,setValueAtTime(v){p.value=v;return p},linearRampToValueAtTime(v){p.value=v;return p},exponentialRampToValueAtTime(v){p.value=v;return p},setTargetAtTime(v){p.value=v;return p},cancelScheduledValues(){return p},cancelAndHoldAtTime(){return p},setValueCurveAtTime(){return p}};return p}
function mockContext({sampleRate=48000}={}){
 const sources=[];const ctx={sampleRate,currentTime:0,state:'running',destination:{},resume(){return Promise.resolve()}};
 const base=()=>({connect(x){return x},disconnect(){},onended:null});
 const source=(extra)=>{const n={...base(),...extra,starts:null,stops:null,start(t){n.starts=t===undefined?ctx.currentTime:t},stop(t){n.stops=t===undefined?ctx.currentTime:t}};sources.push(n);return n};
 ctx.createGain=()=>({...base(),gain:param()});
 ctx.createOscillator=()=>source({frequency:param(),detune:param(),type:'sine',setPeriodicWave(){}});
 ctx.createBufferSource=()=>source({buffer:null,loop:false,detune:param(),playbackRate:param()});
 ctx.createBiquadFilter=()=>({...base(),type:'lowpass',frequency:param(),Q:param(),gain:param(),detune:param()});
 ctx.createDynamicsCompressor=()=>({...base(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()});
 ctx.createConvolver=()=>({...base(),buffer:null});
 ctx.createDelay=()=>({...base(),delayTime:param()});
 ctx.createStereoPanner=()=>({...base(),pan:param()});
 ctx.createPeriodicWave=()=>({});
 ctx.createBuffer=(channels,length,rate)=>{const data=Array.from({length:channels},()=>new Float32Array(length));return {numberOfChannels:channels,length,sampleRate:rate,duration:length/rate,getChannelData:i=>data[i],copyToChannel(src,i){data[i].set(src.subarray?src.subarray(0,length):src)}}};
 ctx.sources=sources;
 /* Peak simultaneous voices over [from,to): only sources that were given a stop time. */
 ctx.peakVoices=(from=0,to=1e9)=>{
  const ev=[];for(const s of sources){if(s.starts===null||s.stops===null)continue;const a=Math.max(from,s.starts),z=Math.min(to,s.stops);if(z>a){ev.push([a,1],[z,-1])}}
  ev.sort((x,y)=>x[0]-y[0]||x[1]-y[1]);let n=0,peak=0;for(const [,d] of ev){n+=d;peak=Math.max(peak,n)}return peak;
 };
 return ctx;
}
module.exports={mockContext,param};
