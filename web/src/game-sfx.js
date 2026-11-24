/* Offline PCM effects and a deterministic synth fallback. */
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
 'arcade-perfect':[.14,720,1080,.01,.55],
 'impact-glass':[.3,2600,3900,.22,.95],'impact-chime-fall':[.62,1560,520,.02,.85],
 'aurora-shimmer':[1.2,620,1320,.07,.95],'perfect-chime':[.24,990,1480,.01,.75],
 'ui-tap':[.12,520,400,.02,.3],'ui-open':[.42,520,784,.02,.6],'ui-close':[.3,660,440,.02,.5]
});
/* R105 menu sounds: soft synthesized tones (no samples), rendered by renderUi() below. */
const UI_KINDS=Object.freeze(['ui-tap','ui-open','ui-close']);
const caches=new WeakMap();
function sample(kind){return root.MONGYU_EMBEDDED_EFFECTS?.[kind]}
function buffer(context,kind){
 const spec=configs[kind],clip=sample(kind);if(!spec&&!clip)return null;
 let cache=caches.get(context);if(!cache){cache=new Map();caches.set(context,cache)}if(cache.has(kind))return cache.get(kind);
 if(UI_KINDS.includes(kind)&&root.MONGYU_UI_EDITION===true){
  const rate=context.sampleRate||48000,data=renderUi(kind,rate),b=context.createBuffer(1,data.length,rate);
  if(b.copyToChannel)b.copyToChannel(data,0);else b.getChannelData(0).set(data);cache.set(kind,b);return b;
 }
 if(clip){
  const raw=root.atob(clip.src),count=raw.length/2,b=context.createBuffer(1,count,clip.rate),data=b.getChannelData(0);
  for(let i=0;i<count;i++){
   const word=raw.charCodeAt(i*2)|raw.charCodeAt(i*2+1)<<8;
   data[i]=(word>=32768?word-65536:word)/32768;
  }
  cache.set(kind,b);return b;
 }
 const [duration,from,to,air,chime]=spec,rate=context.sampleRate||44100,n=Math.ceil(duration*rate),b=context.createBuffer(1,n,rate),data=b.getChannelData(0);let phase=0,noise=0;
 for(let i=0;i<n;i++){
  const t=i/rate,u=i/(n-1),freq=from*Math.pow(to/from,u),env=Math.min(1,t/.004)*Math.pow(1-u,2.3);
  phase+=2*Math.PI*freq/rate;
  const next=Math.sin((i+1)*127.1+from*311.7)*43758.5453,white=(next-Math.floor(next))*2-1,high=white-noise;noise=white;
  data[i]=.045*env*(Math.sin(phase)*(1-air)+high*air*.45+Math.sin(phase*1.5)*chime*.35)/(1+chime*.35);
 }
 data[0]=data[n-1]=0;cache.set(kind,b);return b;
}
/* R104 tuned effects: in the polish edition, while MongyuAdaptiveMusic reports the current key,
   these kinds are re-synthesized (deterministically, no samples) in that key and replace the flat
   sample/synth for the same event, so app.js keeps its voice cap and lifecycle unchanged. */
const TUNED=Object.freeze(['jump','land','square-corner','pass','chain','perfect-chime','hit','impact-glass','impact-chime-fall','aurora-shimmer','result-clear','start','resume','kick','square-room','square-portal']);
const PEAK=Object.freeze({jump:.07,land:.05,'square-corner':.07,pass:.065,chain:.065,'perfect-chime':.072,hit:.095,'hit:fail':.05,'impact-glass':.042,'impact-chime-fall':.05,'aurora-shimmer':.055,'result-clear':.075,start:.05,resume:.05,kick:.06,'square-room':.06,'square-portal':.06,'item:bubble':.07,'item:time':.065,'item:feather':.06,'item:star':.07,'item:surge':.065,'item:shield-break':.05});
const mtof=m=>440*Math.pow(2,(m-69)/12);
function prng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function hashString(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
/* Decaying sine with optional exponential glide; the attack is a raised-cosine ramp (no clicks). */
function addSine(out,rate,f,amp,start,attack,tau,glide){
 const n=out.length,s0=Math.max(0,Math.round(start*rate)),end=Math.min(n,s0+Math.ceil((attack+tau*7)*rate));let phase=0;
 if(!glide){
  /* fixed pitch: the raised-cosine attack is computed directly, the exponential tail with a sine recurrence and a running envelope (no per-sample sin/exp) */
  if(f>=rate*.45)return;
  const w=2*Math.PI*f/rate,c=2*Math.cos(w),na=Math.min(end-s0,Math.ceil(attack*rate)),decay=Math.exp(-1/(rate*tau));
  for(let i=0;i<na;i++){const a=.5-.5*Math.cos(Math.PI*(i/rate)/attack);out[s0+i]+=amp*a*Math.sin(phase);phase+=w}
  let s2=Math.sin(phase-w),s1=Math.sin(phase),env=Math.exp(-(na/rate-attack)/tau);
  for(let i=s0+na;i<end;i++){out[i]+=amp*env*s1;const v=c*s1-s2;s2=s1;s1=v;env*=decay}
  return;
 }
 for(let i=s0;i<end;i++){
  const t=(i-s0)/rate,freq=glide.to+(f-glide.to)*Math.exp(-t/glide.tau);
  if(freq<rate*.45){const a=t<attack?.5-.5*Math.cos(Math.PI*t/attack):Math.exp(-(t-attack)/tau);out[i]+=amp*a*Math.sin(phase)}
  phase+=2*Math.PI*freq/rate;
 }
}
/* Vibraphone-like bar: integer partials 1, 4, 10 keep it consonant with the key. */
function addBell(out,rate,f,amp,start,tau,bright=1){
 addSine(out,rate,f,amp,start,.002,tau);addSine(out,rate,f*4,amp*.22*bright,start,.001,tau*.28);addSine(out,rate,f*10,amp*.06*bright,start,.001,tau*.09);
}
/* RBJ constant-peak band-pass resonator used for soundboard / sympathetic-string resonance. */
function resonator(fc,Q,rate){const w=2*Math.PI*fc/rate,al=Math.sin(w)/(2*Q),a0=1+al;return {b0:al/a0,b2:-al/a0,a1:-2*Math.cos(w)/a0,a2:(1-al)/a0,x1:0,x2:0,y1:0,y2:0}}
function runResonator(r,x){const y=r.b0*x+r.b2*r.x2-r.a1*r.y1-r.a2*r.y2;r.x2=r.x1;r.x1=x;r.y2=r.y1;r.y1=y;return y}
/* Karplus-Strong pluck with an allpass fractional delay for exact tuning.
   R105 options: pick (0..1 plucking position, comb-filters the excitation), body (0..1 soundboard resonance mix),
   sym (0..1 sympathetic ringing of the octave and twelfth), all baked offline so the live path stays one buffer source per note. */
function pluckData(f,rate,seconds,{decay=.6,bright=.6,seed=1,pick=0,body=0,sym=0}={}){
 const n=Math.ceil(seconds*rate),out=new Float32Array(n),P=rate/f,N=Math.max(2,Math.floor(P-.5)),frac=P-.5-N,C=(1-frac)/(1+frac),line=new Float32Array(N),random=prng(seed);
 let lp=0;for(let i=0;i<N;i++){const w=random()*2-1;lp+=(w-lp)*(.15+.8*bright);line[i]=lp}
 if(pick>0){const k=Math.max(1,Math.round(N*pick*.5)),src=Float32Array.from(line);for(let i=0;i<N;i++)line[i]=src[i]-src[(i-k+N)%N]*.9}
 let mean=0;for(let i=0;i<N;i++)mean+=line[i]/N;for(let i=0;i<N;i++)line[i]-=mean;
 const g=Math.pow(10,-3/(Math.max(.05,decay)*f));let idx=0,last=0,x1=0,y1=0;
 for(let i=0;i<n;i++){const y=line[idx],avg=.5*(y+last);last=y;const ap=C*avg+x1-C*y1;x1=avg;y1=ap;line[idx]=ap*g;out[i]=y;idx=idx+1===N?0:idx+1}
 if(body>0||sym>0){
  let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(out[i]));
  const res=[];if(body>0)for(const [fc,Q,a] of [[190,9,1],[340,11,.8],[610,8,.55],[1240,6,.3]])res.push([resonator(fc,Q,rate),body*a*.6]);
  if(sym>0)for(const [m,Q,a] of [[2,70,1],[3,70,.6]])if(f*m<rate*.4)res.push([resonator(f*m,Q,rate),sym*a*.5]);
  const mix=new Float32Array(n);for(let i=0;i<n;i++){const v=out[i];let acc=0;for(const [r,a] of res)acc+=runResonator(r,v)*a;mix[i]=v+acc}
  let m2=0;for(let i=0;i<n;i++)m2=Math.max(m2,Math.abs(mix[i]));const k=m2>0?peak/m2:1;for(let i=0;i<n;i++)out[i]=mix[i]*k;
 }
 return out;
}
/* Bowed string (haegeum) by digital waveguide with a friction ("stick-slip") bow table, STK-style:
   neck and bridge delay lines, a one-pole lossy bridge reflection, bow velocity from an attack/sustain/release envelope with a little
   rosin-noise jitter, delayed vibrato by modulating the loop length, and a body made of one low-pass plus two nasal resonators. Mono, normalised to peak 1. */
function bowedData(f,rate,seconds,{pressure=.55,beta=.127,attack=.14,release=.3,vibHz=5.4,vibDepth=.009,vibDelay=.45,seed=3,nasal=.35}={}){
 const n=Math.ceil(seconds*rate),rnd=prng(seed),total=rate/f-(.62+.9*Math.exp(-f/330)+.75*f/1000),cap=Math.ceil(total*1.1)+8;
 const nk=new Float32Array(cap),br=new Float32Array(cap),out=new Float32Array(n),slope=5-4*pressure;let w=0,lp=0,body=0;
 const r1=resonator(1150,4,rate),r2=resonator(2350,3.5,rate),kb=1-Math.exp(-2*Math.PI*1700/rate);
 const read=(buf,len)=>{const p=w-len;let i0=Math.floor(p);const fr=p-i0;i0=((i0%cap)+cap)%cap;const i1=(i0+1)%cap;return buf[i0]*(1-fr)+buf[i1]*fr};
 for(let i=0;i<n;i++){
  const t=i/rate,vib=1+vibDepth*Math.sin(2*Math.PI*vibHz*t)*Math.min(1,Math.max(0,(t-vibDelay)/.5)),L=total*vib;
  const nOut=read(nk,L*(1-beta)),bOut=read(br,L*beta);
  const a=t<attack?t/attack:t>seconds-release?Math.max(0,(seconds-t)/release):1,bowVel=a*(.1+.012*(rnd()*2-1));
  lp=.2*bOut+.6*lp;const bridge=-lp,nut=-nOut,vd=bowVel-(bridge+nut);
  let tab=Math.pow(Math.abs((vd+.001)*slope)+.75,-4);if(tab>1)tab=1;const nv=vd*tab;
  nk[w]=bridge+nv;br[w]=nut+nv;w=w+1===cap?0:w+1;
  body+=(bOut-body)*kb;out[i]=body+nasal*(runResonator(r1,body)+.6*runResonator(r2,body));
 }
 let sum=0;for(let i=0;i<n;i++)sum+=out[i]/n;for(let i=0;i<n;i++)out[i]-=sum;
 /* A bowed-string loop hops between slip regimes, so its level wanders by several dB: flatten it with a slow gain rider (floored so the attack keeps its scratch),
    then soft-limit. The caller shapes the note envelope. */
 const a0=Math.floor(Math.min(.7,seconds*.3)*rate),a1=Math.max(a0+1,Math.floor(seconds*.7*rate));let ref=0;for(let i=a0;i<a1;i++)ref+=out[i]*out[i];ref=Math.sqrt(ref/(a1-a0))||1e-4;
 const k=1-Math.exp(-1/(.18*rate));let env=ref;
 for(let i=0;i<n;i++){env+=(Math.abs(out[i])*1.2-env)*k;const g=ref/Math.max(env,ref*.45);out[i]=Math.tanh(out[i]*Math.min(2.2,g)/(ref*3.2))}
 const fi=Math.round(rate*.03),fo=Math.min(n,Math.round(rate*.08));for(let i=0;i<fi;i++)out[i]*=i/fi;for(let i=0;i<fo;i++)out[n-1-i]*=i/fo;
 return out;
}
/* Membrane percussion (janggu / buk): a few circular-membrane modes whose pitch drops fast after the strike, a stick click, optional snare wires. Mono, peak 1. */
const MEMBRANE=Object.freeze({
 gung:{f0:78,drop:1.9,dropTau:.035,decay:.34,modes:[[1,1],[1.59,.38],[2.14,.2],[2.3,.14]],click:.28,clickLp:1800,seconds:.7},
 deok:{f0:215,drop:1.45,dropTau:.012,decay:.12,modes:[[1,1],[1.59,.5],[2.14,.34],[2.65,.2]],click:.5,clickLp:5200,snare:.5,snareDecay:.09,seconds:.4},
 kung:{f0:96,drop:1.7,dropTau:.03,decay:.26,modes:[[1,1],[1.59,.45],[2.14,.25]],click:.35,clickLp:2600,snare:.28,snareDecay:.07,seconds:.55},
 buk:{f0:62,drop:2.1,dropTau:.045,decay:.42,modes:[[1,1],[1.59,.3],[2.14,.15]],click:.2,clickLp:1400,seconds:.9},
 tick:{f0:1900,drop:1.08,dropTau:.004,decay:.03,modes:[[1,1],[2.7,.5],[5.1,.3]],click:.4,clickLp:9000,seconds:.12},
 tock:{f0:760,drop:1.15,dropTau:.006,decay:.05,modes:[[1,1],[2.4,.45],[4.6,.2]],click:.3,clickLp:6000,seconds:.18}
});
/* tonic (0-11) nudges the low drums (gung/buk/kung) by up to a quarter tone so they sit under the key instead of beating against it. */
function membraneData(name,rate,{tonic=0,seed=5}={}){
 const p=MEMBRANE[name];if(!p)return null;
 const n=Math.ceil(p.seconds*rate),out=new Float32Array(n),rnd=prng(seed+tonic),low=name==='gung'||name==='buk'||name==='kung',base=p.f0*(low?Math.pow(2,((tonic+6)%12-6)/12*.5):1);
 const ph=p.modes.map(()=>0);let click=0,pv=0;
 for(let i=0;i<n;i++){
  const t=i/rate,drop=1+(p.drop-1)*Math.exp(-t/p.dropTau);let v=0;
  for(let m=0;m<p.modes.length;m++){const ratio=p.modes[m][0],amp=p.modes[m][1],fr=base*ratio*drop;ph[m]+=2*Math.PI*fr/rate;if(fr<rate*.45)v+=amp*Math.exp(-t/(p.decay/(1+.35*m)))*Math.sin(ph[m])}
  const w=rnd()*2-1;click+=(w-click)*Math.min(1,2*Math.PI*p.clickLp/rate);v+=p.click*click*Math.exp(-t/.006);
  if(p.snare){const h=w-pv;pv=w;v+=p.snare*h*.5*Math.exp(-t/p.snareDecay)}
  out[i]=v*(t<.0006?t/.0006:1);
 }
 let max=0;for(let i=0;i<n;i++)max=Math.max(max,Math.abs(out[i]));const fade=Math.min(n,Math.round(rate*.01));
 for(let i=0;i<n;i++)out[i]*=(max?1/max:1)*(i>n-fade?(n-i)/fade:1);
 return out;
}
/* Tower bell: inharmonic partials with their own decays (hum, prime, tierce, quint, nominal). Mono, peak 1. */
function bellData(f,rate,seconds=2.4){
 const out=new Float32Array(Math.ceil(seconds*rate));
 for(const [ratio,amp,tau] of [[.5,.5,1.1],[1,1,.9],[1.19,.6,.7],[1.5,.45,.5],[2,.55,.4],[2.51,.3,.25],[3.8,.18,.12]])if(f*ratio<rate*.45)addSine(out,rate,f*ratio,amp,0,.0015,tau);
 let max=0;for(const x of out)max=Math.max(max,Math.abs(x));if(max>0)for(let i=0;i<out.length;i++)out[i]/=max;
 const fade=Math.round(rate*.03);for(let i=0;i<fade;i++)out[out.length-1-i]*=i/fade;return out;
}
/* Glass / vibraphone bar (partials 1, 4, 10) as a buffer for arpeggios and sparkle. Mono, peak 1. */
function glassData(f,rate,seconds=1.1,tau=.34){
 const out=new Float32Array(Math.ceil(seconds*rate));addBell(out,rate,f,1,0,tau,.9);
 let max=0;for(const x of out)max=Math.max(max,Math.abs(x));if(max>0)for(let i=0;i<out.length;i++)out[i]/=max;
 const fade=Math.round(rate*.03);for(let i=0;i<fade;i++)out[out.length-1-i]*=i/fade;return out;
}
/* Pitched voices for the blueprint chapters. marimba: wooden bar (partials 1, 3.9, 9.2); musicbox: steel comb tine (1, 2.76 detuned, 5.4) with a tiny pluck click;
   ding: elevator bell (1, 2.4, 5.95, long tail); piano: hammered string (Karplus-Strong body + felt thud). Mono, peak 1, silent edges. */
function voiceData(kind,f,rate){
 const secs={marimba:1.1,musicbox:1.8,ding:2.6,piano:2.4}[kind];if(!secs)return null;
 const out=new Float32Array(Math.ceil(secs*rate));
 if(kind==='marimba'){addSine(out,rate,f,1,0,.001,.28);addSine(out,rate,f*3.93,.35,0,.001,.07);addSine(out,rate,f*9.2,.08,0,.001,.025);addNoise(out,rate,.08,0,.0005,.006,{lp:3500,hp:600,seed:61})}
 else if(kind==='musicbox'){addSine(out,rate,f,1,0,.0015,.6);addSine(out,rate,f*2.76*1.004,.28,0,.001,.3);addSine(out,rate,f*5.4,.1,0,.001,.14);addNoise(out,rate,.05,0,.0004,.004,{lp:8000,hp:3000,seed:63})}
 else if(kind==='ding'){addSine(out,rate,f,1,0,.002,.9);addSine(out,rate,f*2.4,.4,0,.002,.5);addSine(out,rate,f*5.95,.12,0,.002,.2);addSine(out,rate,f*.5,.2,0,.01,.8)}
 else{const d=pluckData(f,rate,secs,{decay:1.3,bright:.42,seed:Math.round(f)%97+5,pick:.12,body:.55,sym:.25});for(let i=0;i<out.length;i++)out[i]=d[i];addNoise(out,rate,.15,0,.0006,.008,{lp:1200,seed:65})}
 let max=0;for(const x of out)max=Math.max(max,Math.abs(x));if(max>0)for(let i=0;i<out.length;i++)out[i]/=max;
 const fi=Math.round(rate*.0015),fo=Math.round(rate*.04);for(let i=0;i<fi;i++)out[i]*=i/fi;for(let i=0;i<fo;i++)out[out.length-1-i]*=i/fo;return out;
}
/* Water drop: a fast upward sine glide with a soft ring, mono, peak 1. */
function dropData(f,rate){
 const out=new Float32Array(Math.ceil(.55*rate));addSine(out,rate,f*.62,1,0,.002,.11,{to:f*1.05,tau:.035});addSine(out,rate,f*1.5,.12,0,.002,.05,{to:f*1.6,tau:.04});
 let max=0;for(const x of out)max=Math.max(max,Math.abs(x));if(max>0)for(let i=0;i<out.length;i++)out[i]/=max;
 const fade=Math.round(rate*.03);for(let i=0;i<fade;i++)out[out.length-1-i]*=i/fade;return out;
}
/* Long stereo reverb impulse: pre-delay, sparse early reflections, then decorrelated noise that darkens as it decays. Returns [L,R]. */
function impulseData(rate,seconds,{seed=77,damp=1.6,pre=.014}={}){
 const n=Math.floor(rate*seconds),out=[new Float32Array(n),new Float32Array(n)];
 for(let c=0;c<2;c++){
  const ch=out[c],rnd=prng(seed+c*131);let lp=0;
  for(let i=0;i<n;i++){const t=i/rate,k=.9*Math.exp(-t*damp)+.04;lp+=(rnd()*2-1-lp)*k;const fadeIn=Math.min(1,Math.max(0,(t-pre)/.03));ch[i]=lp*Math.exp(-t*6.9/seconds*1.05)*fadeIn}
  for(let e=0;e<9;e++){const at=Math.floor((pre+.012+e*.0087+rnd()*.006)*rate);if(at<n)ch[at]+=(rnd()<.5?-1:1)*(.55-e*.04)}
 }
 return out;
}
/* Reversed-reverb swell: a chord tail (decaying noise + sines) built backwards so it blooms into the downbeat and stops dead on it. Returns [L,R], peak 1. */
function swellData(rate,seconds,{f=220,third=4,seed=9}={}){
 const n=Math.ceil(seconds*rate),out=[new Float32Array(n),new Float32Array(n)],tones=[[1,1],[Math.pow(2,third/12),.6],[1.5,.7],[2,.5]];
 for(let c=0;c<2;c++){
  const ch=out[c],rnd=prng(seed+c*17);let lp=0,lp2=0;
  const st=tones.map(([m,a])=>{const w=2*Math.PI*f*m*(1+(c?.0016:-.0016))/rate;return {a,cs:Math.cos(w),sn:Math.sin(w),re:1,im:0}});
  for(let i=0;i<n;i++){
   const u=i/n,rise=Math.pow(u,2.6),w=rnd()*2-1,cut=.03+.5*u*u;lp+=(w-lp)*cut;lp2+=(lp-lp2)*cut;
   let tone=0;for(const t of st){tone+=t.a*t.im;const re=t.re*t.cs-t.im*t.sn;t.im=t.re*t.sn+t.im*t.cs;t.re=re}
   if((i&4095)===4095)for(const t of st){const m=Math.hypot(t.re,t.im);t.re/=m;t.im/=m}
   ch[i]=rise*(2.7*lp2+.16*tone)*(u>.985?(1-u)/.015:1);
  }
 }
 let max=0;for(const c of out)for(const x of c)max=Math.max(max,Math.abs(x));if(max>0)for(const c of out)for(let i=0;i<n;i++)c[i]/=max;
 const fi=Math.round(rate*.02);for(const c of out)for(let i=0;i<fi;i++)c[i]*=i/fi;return out;
}
function addPluck(out,rate,f,amp,start,seconds,opts){
 const data=pluckData(f,rate,seconds,opts),s0=Math.round(start*rate);let peak=0;for(const x of data)peak=Math.max(peak,Math.abs(x));if(!peak)return;
 for(let i=0;i<data.length&&s0+i<out.length;i++)out[s0+i]+=amp*data[i]/peak*Math.min(1,i/(rate*.0015));
}
/* Filtered noise burst: one-pole low-pass (optionally sweeping up) and high-pass, raised-cosine attack, exponential decay. */
function addNoise(out,rate,amp,start,attack,tau,{lp=8000,hp=0,seed=7,sweep=0}={}){
 const random=prng(seed),s0=Math.max(0,Math.round(start*rate)),end=Math.min(out.length,s0+Math.ceil((attack+tau*7)*rate));let low=0,high=0,prev=0;
 for(let i=s0;i<end;i++){
  const t=(i-s0)/rate,cut=lp*(sweep?1+sweep*Math.min(1,t/(attack||1)):1),k=1-Math.exp(-2*Math.PI*Math.min(cut,rate*.45)/rate),w=random()*2-1;low+=(w-low)*k;
  let v=low;if(hp>0){const kh=Math.exp(-2*Math.PI*hp/rate);high=kh*(high+v-prev);prev=v;v=high}
  const a=t<attack?.5-.5*Math.cos(Math.PI*t/attack):Math.exp(-(t-attack)/tau);out[i]+=amp*a*v;
 }
}
/* DC blocker, edge fades and peak normalisation: every tuned buffer starts/ends at 0 and never clips. */
function finishData(out,rate,peak){
 let x1=0,y1=0;const R=Math.exp(-2*Math.PI*18/rate);for(let i=0;i<out.length;i++){const y=out[i]-x1+R*y1;x1=out[i];y1=y;out[i]=y}
 const fadeIn=Math.min(out.length,Math.round(rate*.001)),fadeOut=Math.min(out.length,Math.round(rate*.025));
 for(let i=0;i<fadeIn;i++)out[i]*=i/fadeIn;for(let i=0;i<fadeOut;i++)out[out.length-1-i]*=i/fadeOut;
 let max=0;for(const x of out)max=Math.max(max,Math.abs(x));if(max>0){const k=peak/max;for(let i=0;i<out.length;i++)out[i]*=k}
 out[0]=0;out[out.length-1]=0;return out;
}
/* R105 menu tones: a dry wooden "tok" for taps, a two-note rising bell for opening, a falling one for closing.
   Fixed pitches (C5 / G5 / E5 / A4 family) so they sit under any adaptive-music key. Mono Float32Array. */
function renderUi(kind,rate=48000){
 const seconds={'ui-tap':.16,'ui-open':.62,'ui-close':.42}[kind]||.2,out=new Float32Array(Math.ceil(seconds*rate));
 if(kind==='ui-tap'){
  addSine(out,rate,mtof(84),1,0,.0012,.03,{to:mtof(76),tau:.014});addSine(out,rate,mtof(96),.18,0,.001,.014);addSine(out,rate,mtof(55),.2,0,.002,.05,{to:mtof(48),tau:.03});
  addNoise(out,rate,.16,0,.0008,.004,{lp:3200,hp:700,seed:31});
 }else if(kind==='ui-open'){
  addBell(out,rate,mtof(79),.8,0,.24,.6);addBell(out,rate,mtof(86),.7,.07,.3,.55);addBell(out,rate,mtof(91),.28,.14,.3,.5);addSine(out,rate,mtof(55),.22,0,.012,.14);
  addNoise(out,rate,.05,0,.05,.12,{lp:5200,hp:2400,seed:33,sweep:1.4});
 }else{
  addBell(out,rate,mtof(84),.7,0,.18,.5);addBell(out,rate,mtof(76),.7,.06,.26,.45);addSine(out,rate,mtof(60),.16,.03,.01,.1,{to:mtof(53),tau:.12});
 }
 return finishData(out,rate,{'ui-tap':.05,'ui-open':.045,'ui-close':.04}[kind]||.04);
}
/* Sine with a time-varying frequency and amplitude (phase is integrated, so glissandi never click). */
function addChirp(out,rate,start,dur,freqAt,ampAt){
 const s0=Math.round(start*rate),n=Math.min(out.length-s0,Math.ceil(dur*rate));let ph=0;
 for(let i=0;i<n;i++){const t=i/rate,f=freqAt(t);ph+=2*Math.PI*f/rate;if(f<rate*.45)out[s0+i]+=ampAt(t)*Math.sin(ph)}
}
/* R105 item pickups. Each is built from the current key (tonic, third, scale) so it sits in the music:
   bubble = clear bell, time = a tone that slows while it falls, feather = rising glissando, star = sparkling arpeggio,
   surge = bright aurora chord with a whoosh, shield-break = glass pop. */
const ITEM_KINDS=Object.freeze(['bubble','time','feather','star','surge','shield-break']);
const ITEM_SECONDS=Object.freeze({bubble:1.2,time:1.6,feather:.95,star:1.7,surge:1.5,'shield-break':.75});
function renderItem(item,t,rate){
 const tonic=((t.tonic|0)%12+12)%12,third=t.third===3?3:4,scale=Array.isArray(t.scale)&&t.scale.length===5?t.scale:third===3?[0,3,5,7,10]:[0,2,4,7,9],deg=d=>scale[(d%5+5)%5]+12*Math.floor(d/5);
 const random=prng(hashString('item:'+item+':'+tonic)),out=new Float32Array(Math.ceil(ITEM_SECONDS[item]*rate));
 switch(item){
  case 'bubble':
   addBell(out,rate,mtof(84+tonic),1,0,.6,.45);addBell(out,rate,mtof(91+tonic),.5,.045,.5,.55);addSine(out,rate,mtof(96+tonic),.16,.02,.004,.8);
   addSine(out,rate,mtof(60+tonic),.22,0,.05,.25);addNoise(out,rate,.06,0,.0006,.012,{lp:9000,hp:4000,seed:41});break;
  case 'time':{
   const f0=mtof(79+tonic),fall=u=>12*(1-Math.exp(-u/.62));
   for(const [mul,a] of [[1,1],[1.5,.4],[.5,.35]])addChirp(out,rate,0,1.5,u=>f0*mul*Math.pow(2,-fall(u)/12),u=>a*(u<.01?u/.01:1)*Math.exp(-u/.62)*(1-.35*(.5+.5*Math.cos(2*Math.PI*(14*Math.exp(-u/.5)+2)*u))));
   addNoise(out,rate,.12,0,.0008,.02,{lp:9000,hp:5000,seed:43});break}
  case 'feather':{
   const f0=mtof(72+tonic),rise=u=>12*(1-Math.pow(1-Math.min(1,u/.5),2));
   addChirp(out,rate,0,.8,u=>f0*Math.pow(2,rise(u)/12),u=>(u<.01?u/.01:1)*Math.exp(-u/.38)*.9);
   addChirp(out,rate,.03,.8,u=>f0*1.5*Math.pow(2,rise(u)/12),u=>(u<.01?u/.01:1)*Math.exp(-u/.3)*.35);
   addNoise(out,rate,.4,0,.18,.12,{lp:2400,hp:900,seed:47,sweep:3});addBell(out,rate,mtof(96+tonic),.4,.42,.3,.5);break}
  case 'star':{
   const steps=[0,1,2,3,4,5,6,7,8];
   steps.forEach((d,i)=>{const at=i*.052+random()*.008,m=84+tonic+deg(d);addBell(out,rate,mtof(m),.55+i*.045,at,.22+i*.02,.8)});
   addBell(out,rate,mtof(96+tonic+deg(5)),.9,.5,.9,.7);addBell(out,rate,mtof(84+tonic),.5,.5,.8,.6);
   for(let i=0;i<7;i++)addSine(out,rate,mtof(100+tonic+deg(i%5))*(1+(random()-.5)*.01),.12,.5+i*.07,.003,.1);break}
  case 'surge':
   addNoise(out,rate,.5,0,.45,.2,{lp:700,sweep:7,seed:49});
   [0,7,12,12+third,19].forEach((iv,i)=>addBell(out,rate,mtof(72+tonic+iv),.6-i*.05,.28+i*.04,.6,.7));
   for(const d of [-1.7,2.1])addSine(out,rate,mtof(84+tonic)+d,.3,.3,.35,.6);break;
  case 'shield-break':
   addNoise(out,rate,.5,0,.0008,.014,{lp:12000,hp:3500,seed:53});
   for(let i=0;i<5;i++)addSine(out,rate,mtof(96+tonic+deg(i*2%5))*(1+(random()-.5)*.012),.45,random()*.03,.0006,.05+random()*.08);
   addSine(out,rate,mtof(72+tonic),.5,.02,.002,.1,{to:mtof(60+tonic),tau:.06});break;
 }
 return finishData(out,rate,PEAK['item:'+item]);
}
/* t = {tonic:0-11, third:3|4, scale:[5 pentatonic offsets], step, variant ('', 'fail' or 'item:<kind>')}. Returns mono Float32Array or null. */
function renderTuned(kind,t,rate=48000){
 if(!TUNED.includes(kind)||!t)return null;
 if(typeof t.variant==='string'&&t.variant.startsWith('item:')&&ITEM_KINDS.includes(t.variant.slice(5)))return renderItem(t.variant.slice(5),t,rate);
 const tonic=((t.tonic|0)%12+12)%12,third=t.third===3?3:4,scale=Array.isArray(t.scale)&&t.scale.length===5?t.scale:third===3?[0,3,5,7,10]:[0,2,4,7,9],step=Math.max(0,t.step|0),fail=kind==='hit'&&t.variant==='fail';
 const deg=d=>scale[(d%5+5)%5]+12*Math.floor(d/5),random=prng(hashString(kind+':'+tonic+':'+step));
 const seconds={jump:.5,land:.16,'square-corner':.95,pass:.9,chain:1,'perfect-chime':.75,hit:fail?.95:.6,'impact-glass':.5,'impact-chime-fall':1.05,'aurora-shimmer':1.9,'result-clear':1.7,start:.55,resume:.55,kick:.32,'square-room':.8,'square-portal':.8}[kind];
 const out=new Float32Array(Math.ceil(seconds*rate)),base=60+tonic;
 switch(kind){
  case 'jump':{const rise=[0,third,7,12,14,12+third][Math.min(5,step)];addPluck(out,rate,mtof(base+rise),1,0,.48,{decay:.32,bright:.72,seed:11+step});addSine(out,rate,mtof(base+rise+12),.12,0,.002,.03);break}
  case 'land':{const f=mtof(base+7);addSine(out,rate,f,1,0,.0015,.034);addSine(out,rate,f*2.32,.32,0,.001,.016);addSine(out,rate,f*4.25,.1,0,.001,.008);addNoise(out,rate,.18,0,.001,.004,{lp:2400,seed:3});break}
  case 'square-corner':{const low=mtof(36+tonic),swell=.32;
   for(const [f,a] of [[low,1],[low*2,.45],[mtof(43+tonic),.22]])addSine(out,rate,f,a,0,swell,.22);
   addNoise(out,rate,.22,0,swell,.12,{lp:220,sweep:4,seed:5});
   for(const [at,a] of [[swell,.5],[swell+.075,.36]]){addSine(out,rate,mtof(base+19),a,at,.0008,.011);addSine(out,rate,mtof(base+26)*1.01,a*.6,at,.0008,.007);addNoise(out,rate,a*.5,at,.0006,.006,{lp:6000,hp:900,seed:9})}
   break}
  case 'pass':case 'chain':{const m=72+tonic+deg(step%10);addBell(out,rate,mtof(m),1,0,.42);addBell(out,rate,mtof(m+12),.22,.03,.25,.6);if(kind==='chain')addBell(out,rate,mtof(m+7),.45,.05,.38,.8);break}
  case 'perfect-chime':{[0,7,14].forEach((iv,i)=>addBell(out,rate,mtof(84+tonic+iv),.55-i*.1,i*.032,.3,.7));addSine(out,rate,mtof(48+tonic),1.1,0,.004,.085,{to:mtof(36+tonic),tau:.02});addSine(out,rate,mtof(48+tonic),.35,0,.003,.05);break}
  case 'hit':{
   if(fail){addSine(out,rate,mtof(base+7),1,0,.03,.22);addSine(out,rate,mtof(base),1,.22,.03,.3);addSine(out,rate,mtof(base-12),.4,.22,.04,.3);break}
   const f0=mtof(26+tonic);addSine(out,rate,f0*2,1,0,.003,.16,{to:f0,tau:.07});addSine(out,rate,f0*4,.32,0,.003,.07,{to:f0*2,tau:.07});addNoise(out,rate,.55,0,.002,.05,{lp:420,seed:13});break}
  case 'impact-glass':{for(let i=0;i<7;i++){const m=96+tonic+deg(i*2%5)+(i>4?12:0),at=random()*.045,detune=1+(random()-.5)*.014;addSine(out,rate,mtof(m)*detune,.5+random()*.5,at,.0006,.05+random()*.12);addSine(out,rate,mtof(m)*detune*2.71,.18,at,.0005,.03)}addNoise(out,rate,.6,0,.0008,.012,{lp:12000,hp:3200,seed:17});break}
  case 'impact-chime-fall':{for(let i=0;i<6;i++)addBell(out,rate,mtof(72+tonic+deg(9-i)),.8-i*.07,.02+i*.082,.34,.75);break}
  case 'aurora-shimmer':{[0,7,12+third,14,19,24].forEach((iv,i)=>{const f=mtof(72+tonic+iv),at=i*.06;for(const d of [-1.6,1.9])addSine(out,rate,f+d,.5-i*.04,at,.5,.55)});
   for(let i=0;i<out.length;i++){const tm=i/rate;out[i]*=1-.18*(.5-.5*Math.cos(2*Math.PI*6.2*tm))}break}
  case 'result-clear':{[0,third,7,12,14].forEach((iv,i)=>addBell(out,rate,mtof(72+tonic+iv),.75,i*.095,.5,.7));for(const iv of [0,7,12+third])addSine(out,rate,mtof(base+iv),.34,.38,.2,.42);break}
  case 'start':case 'resume':{addSine(out,rate,mtof(base),.8,0,.012,.12);addSine(out,rate,mtof(base+(kind==='start'?7:12)),.8,.075,.012,.16);break}
  case 'kick':{addPluck(out,rate,mtof(48+tonic+7),1,0,.3,{decay:.16,bright:.4,seed:21});addNoise(out,rate,.25,0,.001,.008,{lp:3000,seed:23});break}
  case 'square-room':case 'square-portal':{(kind==='square-room'?[0,7,12]:[7,12,12+third]).forEach((iv,i)=>addBell(out,rate,mtof(76+tonic+iv),.7,i*.07,.36,.7));break}
 }
 return finishData(out,rate,PEAK[fail?'hit:fail':kind]);
}
const tunedCaches=new WeakMap();
function tunedBuffer(context,kind,tuning){
 if(!TUNED.includes(kind)||!tuning||!context?.createBuffer)return null;
 let cache=tunedCaches.get(context);if(!cache){cache=new Map();tunedCaches.set(context,cache)}
 const rate=context.sampleRate||48000,id=kind+'|'+(tuning.tonic|0)+'|'+(tuning.third|0)+'|'+(tuning.scale||[]).join(',')+'|'+(tuning.step|0)+'|'+(tuning.variant||'')+'|'+rate;
 if(cache.has(id))return cache.get(id);if(cache.size>96)cache.clear();
 const data=renderTuned(kind,tuning,rate);if(!data)return null;
 const b=context.createBuffer(1,data.length,rate);if(b.copyToChannel)b.copyToChannel(data,0);else b.getChannelData(0).set(data);cache.set(id,b);return b;
}
function tuningFor(kind){
 if(root.MONGYU_POLISH_EDITION!==true||!TUNED.includes(kind))return null;
 try{return root.MongyuAdaptiveMusic?.sfxTuning?.(kind)||null}catch(_){return null}
}
function voice(context,destination,kind){const tuning=tuningFor(kind),pcm=(tuning&&tunedBuffer(context,kind,tuning))||buffer(context,kind);if(!pcm)return null;const source=context.createBufferSource();source.buffer=pcm;source.connect(destination);source._role='fx';return source}
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
const api=Object.freeze({configs,buffer,voice,observe,sample,TUNED,renderTuned,tunedBuffer,pluckData,UI_KINDS,renderUi,ITEM_KINDS,bowedData,membraneData,MEMBRANE,bellData,glassData,voiceData,dropData,impulseData,swellData,addChirp});root.MongyuSFX=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
