/* R105 ghost: a faint marker on the course gauge showing where the player's fastest clear of this course was at the same elapsed time. Owned by workstream GAL.
   Presentation only: it reads run.time / run.progress() after each tick, never writes the run, the RNG or the score, and nothing is drawn on the playfield.
   Record (kept in the course entry of mongyu.r105.road): ghost = [progress in per-mille at t = 0, 0.5, 1.0 ... s] (<= 400 values), ghostTime = that run's clear time in seconds.
   Active only when MONGYU_UI_EDITION===true; old saves without a ghost simply show nothing. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const STEP=.5,MAX=400,SCALE=1000,TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const num=v=>Number.isFinite(v)?v:0;

/* ---------- storage format ---------- */
/* Anything that is not a plain array of 2..MAX finite numbers is ignored (old or damaged saves); values are clamped to 0..1000 and made non-decreasing. */
function normalize(list){
 if(!Array.isArray(list)||list.length<2||list.length>MAX)return null;
 const out=new Array(list.length);let prev=0;
 for(let i=0;i<list.length;i++){
  const v=list[i];if(typeof v!=='number'||!Number.isFinite(v))return null;
  prev=Math.max(prev,Math.round(clamp(v,0,SCALE)));out[i]=prev;
 }
 return out;
}
/* Progress 0..1 of a stored ghost at elapsed seconds t (linear between samples, 1 once the ghost run is over). */
function at(samples,t){
 if(!samples||samples.length<2)return null;
 const x=Math.max(0,num(t))/STEP,i=Math.floor(x);
 if(i>=samples.length-1)return samples[samples.length-1]/SCALE;
 const f=x-i;return (samples[i]+(samples[i+1]-samples[i])*f)/SCALE;
}

/* ---------- recording ---------- */
/* Per run: samples are taken at fixed run times (interpolated between ticks, so the result does not depend on the frame rate).
   A run that restarted in place or began from a checkpoint is not a whole run from the start: it records nothing. */
function state(run){
 let g=run._ghost;
 if(!g){g=run._ghost={s:[],t0:0,p0:0,valid:!run.options?.resume,full:false};g.t0=num(run.time);g.p0=0}
 return g;
}
function tick(run){
 if(!enabled||!run||run.state!=='play'||typeof run.progress!=='function')return;
 const g=state(run);if(!g.valid||g.full)return;
 const t1=num(run.time);
 if(t1<g.t0-1e-6){g.valid=false;return}
 const p1=clamp(num(run.progress()),0,1);
 if(!(t1>g.t0)&&g.s.length)return;
 while(g.s.length*STEP<=t1){
  if(g.s.length>=MAX){g.full=true;g.valid=false;g.s=[];return}
  const b=g.s.length*STEP,u=t1>g.t0?clamp((b-g.t0)/(t1-g.t0),0,1):0;
  g.s.push(Math.round((g.p0+(p1-g.p0)*u)*SCALE));
 }
 g.t0=t1;g.p0=p1;
}
/* After a clear: the samples for the record ({samples,time}) or null when this run cannot be a ghost. */
function take(run){
 const g=run?._ghost;
 if(!enabled||!g||!g.valid||run.state!=='clear')return null;
 const time=num(run.result?.time??run.time),s=g.s.slice();
 if(!(time>0)||s.length<1)return null;
 while(s.length*STEP<time+STEP&&s.length<MAX)s.push(SCALE);
 if(s[s.length-1]<SCALE)s.push(SCALE);
 const samples=normalize(s);return samples?{samples,time}:null;
}

/* ---------- reading ---------- */
/* The stored ghost for the run's course, cached on the run: {samples,time} or false. */
function reference(run){
 if(!run)return false;
 if(run._ghostRef!==undefined)return run._ghostRef;
 let ref=false;
 try{
  const R=root.MongyuRoad,e=R?.read?.()?.courses?.[run.id];
  const samples=normalize(e?.ghost);
  if(samples)ref={samples,time:num(e.ghostTime)};
 }catch(_){ref=false}
 run._ghostRef=ref;return ref;
}
/* {ghost,mine,diff} (progress 0..1; diff = mine - ghost) or null when there is no ghost to compare with. */
function compare(run){
 if(!enabled||!run)return null;
 const ref=reference(run);if(!ref)return null;
 const g=at(ref.samples,num(run.time)),mine=clamp(num(run.progress?.()),0,1);
 return g===null?null:{ghost:g,mine,diff:mine-g};
}
const pct=d=>Math.round(Math.abs(d)*100);
/* Tiny language-neutral indicator: '+4%' ahead of the ghost, '−4%' behind, '±0' within a percent. */
function label(diff){const n=pct(diff);return n<1?'±0':(diff>0?'+':'−')+n+'%'}
/* Gauge marker (course-run.js hud() calls this right after drawing the gauge fill): a pale ring on the gauge where the ghost is, plus the +/- label above the gauge's left end. */
function drawMarker(c,run,x0,gy,gw){
 if(!enabled||run?.state!=='play')return;
 const cmp=compare(run);if(!cmp)return;
 const x=x0+gw*cmp.ghost,y=gy+3,ahead=cmp.diff>=0;
 c.save();
 c.beginPath();c.arc(x,y,5.2,0,TAU);c.fillStyle='rgba(16,10,34,.55)';c.fill();
 c.lineWidth=1.7;c.strokeStyle='rgba(205,236,255,.95)';c.stroke();
 c.beginPath();c.arc(x,y,1.5,0,TAU);c.fillStyle='rgba(205,236,255,.95)';c.fill();
 const text=label(cmp.diff);
 c.font='700 11px system-ui,sans-serif';c.textAlign='left';c.textBaseline='alphabetic';
 c.beginPath();c.arc(x0+3.5,gy-12,3,0,TAU);c.lineWidth=1.3;c.strokeStyle='rgba(205,236,255,.9)';c.stroke();
 c.lineWidth=3;c.strokeStyle='rgba(20,12,36,.6)';c.strokeText(text,x0+10,gy-8);
 c.fillStyle=text==='±0'?'rgba(223,242,255,.92)':ahead?'#9ff0d8':'#ffa7d1';c.fillText(text,x0+10,gy-8);
 c.restore();
}

const api=Object.freeze({enabled,STEP,MAX,SCALE,normalize,at,tick,take,reference,compare,label,drawMarker});
root.MongyuGhost=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
