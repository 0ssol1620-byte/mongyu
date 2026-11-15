/* R82 original tactile effects. Cached PCM; no samples, network or game RNG. */
(function(root){'use strict';
const configs=Object.freeze({
 jump:[.15,260,640,.008,.3],land:[.09,160,65,.45,.1],
 'square-corner':[.1,400,700,.12,.12],'square-portal':[.28,470,1200,.02,.7],
 'square-room':[.3,520,1040,.02,.6],hit:[.22,130,43,.65,.04],
 kick:[.11,210,80,.7,.07],throw:[.12,540,180,.32,.1],dodge:[.1,360,170,.45,.1],
 deflect:[.16,760,1400,.12,.65],'boss-damage':[.2,640,1050,.2,.6],
 'boss-strike':[.18,220,72,.5,.2],'boss-wall-impact':[.24,100,38,.72,.05],
 'attack-telegraph':[.18,220,330,.01,.25],'boss-projectile':[.1,300,150,.15,.1],
 pass:[.13,650,980,.01,.5],chain:[.17,780,1300,.02,.6],start:[.15,260,520,.01,.3],resume:[.12,260,440,.01,.25],
 'r34-counter':[.16,760,1400,.12,.65],'r36-echo-collected':[.18,850,1300,.02,.6],
 'tutorial-progress':[.13,500,750,.01,.4],'tutorial-complete':[.26,520,1040,.01,.55],'tutorial-retry':[.13,280,200,.04,.2],
 'arcade-perfect':[.14,720,1080,.01,.55]
});
const caches=new WeakMap();
function buffer(context,kind){
 const spec=configs[kind];if(!spec)return null;let cache=caches.get(context);if(!cache){cache=new Map();caches.set(context,cache)}if(cache.has(kind))return cache.get(kind);
 const [duration,from,to,air,chime]=spec,rate=context.sampleRate||44100,n=Math.ceil(duration*rate),b=context.createBuffer(1,n,rate),data=b.getChannelData(0);let phase=0,noise=0;
 for(let i=0;i<n;i++){
  const t=i/rate,u=i/(n-1),freq=from*Math.pow(to/from,u),env=Math.min(1,t/.004)*Math.pow(1-u,2.3);
  phase+=2*Math.PI*freq/rate;
  const next=Math.sin((i+1)*127.1+from*311.7)*43758.5453,white=(next-Math.floor(next))*2-1,high=white-noise;noise=white;
  data[i]=.045*env*(Math.sin(phase)*(1-air)+high*air*.45+Math.sin(phase*1.5)*chime*.35)/(1+chime*.35);
 }
 data[0]=data[n-1]=0;cache.set(kind,b);return b;
}
function voice(context,destination,kind){const pcm=buffer(context,kind);if(!pcm)return null;const source=context.createBufferSource();source.buffer=pcm;source.connect(destination);source._role='fx';return source}
const observations=new WeakMap();
function observe(run){
 if(!run.nativeRuntime||!run.nativeFrame)return [];
 const state=run.nativeFrame.game.actor.actorState,face=run.nativeFrame.game.pool.currentIndex,last=observations.get(run),current={state,face,attempt:run.attempt,updates:run.updates,bossHp:run.nativeFrame.boss?.K,bossId:run.nativeFrame.boss?.J};
 if(last?.updates===current.updates&&last?.attempt===current.attempt)return [];
 observations.set(run,current);if(!last||last.attempt!==current.attempt||run.state!=='play')return [];
 const events=[];
 if(state===0&&[1,2,3,5,7,9,11].includes(last.state))events.push('land');
 if(face!==last.face)events.push('square-corner');
 if(state===11&&last.state!==11)events.push('deflect');
 if(current.bossId===last.bossId&&Number.isFinite(current.bossHp)&&current.bossHp>=0&&current.bossHp<last.bossHp)events.push('boss-damage');
 if(run.lastResult?.effects?.some(e=>e.kind==='audio-cue-request'&&e.role==='start-countdown'))events.push('start');
 return events;
}
const api=Object.freeze({configs,buffer,voice,observe});root.MongyuSFX=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
