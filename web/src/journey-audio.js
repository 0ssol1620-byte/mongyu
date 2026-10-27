// R16 original procedural score. No recordings, network, timers, or game mutation.
(function(root){
'use strict';
const NOTES=Object.freeze([0,7,4,9,7,2,4,0]);
function score(beat,chapter=0,accent=false){
 chapter=Math.max(0,Math.min(4,Math.floor(chapter)||0));
 const semitone=NOTES[((Math.floor(beat)%8)+8)%8]+(chapter===2?12:chapter===4?-12:0)+(accent?7:0);
 return {frequency:164.813778*Math.pow(2,semitone/12),duration:accent?.18:.32,gain:accent?.003:.009,harmonic:[0,.12,.06,.18,.08][chapter],beat:Math.floor(beat),chapter,accent};
}
function pcm(note,sampleRate=48000){
 if(!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)throw Error('unsupported sample rate');
 const n=Math.ceil(note.duration*sampleRate),out=new Float32Array(n);
 for(let i=0;i<n;i++){const t=i/sampleRate,p=2*Math.PI*note.frequency*t,envelope=Math.sin(Math.PI*i/(n-1))**2;
 out[i]=note.gain*envelope*(Math.sin(p)+note.harmonic*Math.sin(2*p))/(1+note.harmonic);}
 out[0]=out[n-1]=0;return out;
}
const api=Object.freeze({NOTES,score,pcm});root.MongyuJourneyAudio=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
