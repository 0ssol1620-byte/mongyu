/* R105 course engine: chains acts into one run with aurora-gate transitions, carry-over score and chapter definitions. Owned by workstream A.
   A CourseRun looks like any dream-mode run to app.js (mode:'dream', drawSelf, status, drainEvents ...) and plays a list of acts
   (OpeningRun, IllusionRun, MongyuHelix, MongyuPenrose ...) one after another. Acts never know about each other: they get options.chain and report
   result.points/shards/perfectStreak when their state turns 'clear'. See docs/R105_SPEC_KO.md. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const TAU=Math.PI*2,PORTAL=.6,PORTAL_REDUCED=.22,FAIL_HUD=.35;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const reducedMotion=()=>{try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}};
const SLOT=Object.freeze({id:'road',ruleId:'road',number:2,title:'꿈의 길'});

/* ---------- act registry ---------- */
const ACTS=new Map();
function registerAct(type,factory){if(typeof type!=='string'||typeof factory!=='function')return false;ACTS.set(type,factory);return true}
function unregisterAct(type){return ACTS.delete(type)}
/* Built-in acts are resolved lazily so modules that load later (or not at all) just make their acts unavailable. */
const BUILTIN={
 'floor-wall':()=>root.MongyuOpening?.OpeningRun&&(o=>new root.MongyuOpening.OpeningRun({slot:SLOT,...o})),
 bridge:()=>root.MongyuIllusion?.IllusionRun&&(o=>{const {tone,preset,...rest}=o;return new root.MongyuIllusion.IllusionRun({...rest,plan:o.plan||BRIDGES[preset||'intro'],sections:o.sections||[TONES[clamp(tone|0,0,TONES.length-1)]]})}),
 'helix-up':()=>root.MongyuHelix?.HelixRun&&(o=>new root.MongyuHelix.HelixRun({...o,variant:'up'})),
 'helix-down':()=>root.MongyuHelix?.HelixRun&&(o=>new root.MongyuHelix.HelixRun({...o,variant:'down'})),
 penrose:()=>root.MongyuPenrose?.PenroseRun&&(o=>new root.MongyuPenrose.PenroseRun(o)),
 align:()=>root.MongyuPenrose?.AlignRun&&(o=>new root.MongyuPenrose.AlignRun(o))
};
function resolveAct(type){return ACTS.get(type)||(BUILTIN[type]?.()||null)}
const hasAct=type=>!!resolveAct(type);
const warned=new Set();
function warnOnce(type){if(warned.has(type))return;warned.add(type);try{root.console?.warn?.('[MongyuCourse] act "'+type+'" is not registered; skipped')}catch(_){}}

/* ---------- authored bridge plans (IllusionRun PLAN format: [direction,length,{blocks,gap,lift,tutorial,stair}]) ----------
   Blocks keep >200 units before the next gap so a tap near a marker is never needed as a jump. */
const BRIDGES={
 intro:[['x',160,{tower:true}],['x',150,{gap:90,tutorial:true}],['x',210,{blocks:[120]}],['z',170,{finish:true}]],
 garden:[['x',150,{tower:true}],['z',210,{blocks:[112]}],['stair',180,{}],['z',150,{gap:92}],['x',220,{blocks:[70,150]}],['z',190,{gap:100,lift:-36}],['x',190,{blocks:[96]}],['z',170,{finish:true}]],
 ascent:[['x',150,{tower:true}],['x',230,{blocks:[80,160]}],['stair',190,{}],['z',160,{gap:96,lift:44}],['z',220,{blocks:[100]}],['x',170,{gap:100}],['x',200,{blocks:[70,140]}],['z',170,{finish:true}]],
 calm:[['x',140,{tower:true}],['stair',190,{}],['z',150,{gap:92,lift:36}],['x',190,{finish:true}]],
 dawn:[['x',140,{tower:true}],['z',230,{blocks:[120]}],['stair',170,{}],['x',170,{gap:100,lift:40}],['z',220,{blocks:[84,156]}],['z',170,{finish:true}]],
 descent:[['x',150,{tower:true}],['z',220,{blocks:[110]}],['x',200,{gap:96,lift:-36}],['x',240,{blocks:[72,150]}],['stair',190,{}],['z',180,{gap:100}],['z',220,{blocks:[104]}],['x',170,{finish:true}]],
 stairs:[['x',140,{tower:true}],['stair',200,{}],['z',210,{blocks:[110]}],['x',170,{gap:92,lift:40}],['z',230,{blocks:[80,160]}],['z',170,{finish:true}]]
};
/* Chapter 1 palette tones for bridge acts: dawn -> morning glow. */
const TONES=[
 {name:'새벽 정원',sky:['#251c40','#5b4270'],arch:['#f7e3ea','#c19ab9','#6b4a7c'],mist:'#d6b3d9',at:0},
 {name:'여명의 길',sky:['#2f2150','#7a4d78'],arch:['#fbe6e6','#d1a1b4','#7b5276'],mist:'#efb9d0',at:0},
 {name:'아침 안개',sky:['#2a2f5a','#8b6b86'],arch:['#fff0e2','#dcb0a8','#85607a'],mist:'#ffd0b4',at:0},
 {name:'달빛 수로',sky:['#0f1d34','#2c4f6e'],arch:['#e0f1f7','#8eb2cb','#3e5d7e'],mist:'#a7cfe6',at:0}
];

/* ---------- chapter 1: 새벽 계단의 탑 ---------- */
const act=(type,opts={},weight)=>({type,opts,weight});
const CHAPTER1=Object.freeze({
 id:'ch1',number:1,title:'새벽 계단의 탑',subtitle:'새벽빛이 계단을 따라 오른다',
 courses:Object.freeze([
  {id:'c1',title:'첫 걸음',subtitle:'접힌 길에서 달리기를 배워요',bpm:96,seed:101,glow:['#ffb083','#e9b2ff'],
   acts:[act('floor-wall',{span:[0,2],tutorial:true},10),act('bridge',{preset:'intro',tone:0},12),act('bridge',{preset:'garden',tone:1},25)],
   fallback:null},
  {id:'c2',title:'올라가는 길',subtitle:'탑을 감아 오르는 나선',bpm:100,seed:202,glow:['#e9b2ff','#ffd98a'],
   acts:[act('floor-wall',{span:[0,1]},7),act('helix-up',{},16),act('bridge',{preset:'calm',tone:1},11),act('helix-up',{},16)],
   fallback:[act('floor-wall',{span:[0,1]},6),act('bridge',{preset:'ascent',tone:1},25),act('bridge',{preset:'stairs',tone:2},20)]},
  {id:'c3',title:'거울 정원',subtitle:'보이는 대로 이어지는 길',bpm:100,seed:303,glow:['#9be8da','#c9a2ff'],
   acts:[act('bridge',{preset:'garden',tone:3},25),act('penrose',{},16),act('bridge',{preset:'dawn',tone:3},14),act('align',{},7)],
   fallback:[act('bridge',{preset:'garden',tone:3},24),act('floor-wall',{span:[1,2]},7),act('bridge',{preset:'dawn',tone:3},17),act('bridge',{preset:'calm',tone:3},11)]},
  {id:'c4',title:'내려오는 길',subtitle:'소용돌이처럼 빨라지는 하강',bpm:104,seed:404,glow:['#ffa7d1','#ffd98a'],
   acts:[act('helix-down',{},14),act('bridge',{preset:'descent',tone:2},22),act('floor-wall',{span:[0,2]},10)],
   fallback:[act('bridge',{preset:'descent',tone:2},22),act('bridge',{preset:'stairs',tone:2},20),act('floor-wall',{span:[0,2]},10)]},
  {id:'c5',title:'새벽의 탑',subtitle:'오르고, 숨 돌리고, 내려와 문을 연다',bpm:100,seed:505,glow:['#ffeca5','#ff9ed8'],
   acts:[act('floor-wall',{span:[0,1]},7),act('helix-up',{},16),act('align',{},7),act('bridge',{preset:'dawn',tone:1},14),act('helix-down',{},14)],
   fallback:[act('floor-wall',{span:[0,1]},7),act('bridge',{preset:'stairs',tone:0},20),act('bridge',{preset:'calm',tone:1},11),act('bridge',{preset:'dawn',tone:2},18),act('floor-wall',{span:[1,2]},9)]}
 ].map(c=>Object.freeze(c)))
});
const courseById=id=>CHAPTER1.courses.find(c=>c.id===id)||null;
/* Plays the ideal act list when every type is registered, else the course's fallback list, else whatever is available. */
function playableActs(course){
 const ideal=course.acts||[],missing=ideal.filter(a=>!hasAct(a.type));
 if(!missing.length)return {acts:ideal,missing,fallback:false};
 for(const a of missing)warnOnce(a.type);
 if(course.fallback){const fb=course.fallback.filter(a=>hasAct(a.type));if(fb.length)return {acts:fb,missing,fallback:true}}
 return {acts:ideal.filter(a=>hasAct(a.type)),missing,fallback:false};
}
/* Star goals: [완주, 빛 조각 전부, 무피격]. */
function goals(result){
 if(!result||result.state!=='clear')return [false,false,false];
 return [true,result.shardTotal>0&&result.shards>=result.shardTotal,result.deaths===0];
}
function stars(result){return goals(result).filter(Boolean).length}

/* ---------- the run ---------- */
const emptyCarry=()=>({points:0,shards:0,shardTotal:0,perfectStreak:0,hearts:1,bonus:0,time:0,perfects:0,bestStreak:0});
const num=v=>Number.isFinite(v)?v:0;
function actShards(child){
 if(Number.isFinite(child.shardCount))return child.shardCount;
 if(Number.isFinite(child.shards))return child.shards;
 return child.chain&&child.openingCourse?Math.max(0,child.index-child.firstIndex):0;
}
function actShardTotal(child,r){
 if(Number.isFinite(r?.shardTotal))return r.shardTotal;
 if(Number.isFinite(child.shardTotal))return child.shardTotal;
 if(child.chain&&child.openingCourse)return child.endIndex-child.firstIndex;
 return num(r?.shards);
}
class CourseRun{
 constructor(options={}){
  this.options=options;this.mode='dream';this.dreamMode='road';this.openingCourse=false;this.polish=true;this.courseRun=true;
  this.id=options.id||'custom';this.name=options.title||options.name||'꿈의 길';this.bpm=options.bpm||100;this.seed=options.seed||1;
  this.settings={...(options.settings||{})};this.attempt=options.attempt||1;
  this.viewport={width:options.viewport?.width||390,height:options.viewport?.height||844};
  const plan=playableActs(options);this.acts=plan.acts.map(a=>({type:a.type,opts:a.opts||{},weight:a.weight>0?a.weight:10}));this.missing=plan.missing.map(a=>a.type);this.usedFallback=plan.fallback;
  this.total=this.acts.reduce((s,a)=>s+a.weight,0)||1;
  this.reset();
 }
 reset(){
  const resume=this.options.resume,idx=this.acts.length?clamp(Math.trunc(resume?.index)||0,0,this.acts.length-1):0;
  this.state='ready';this.events=[];this.updates=0;this.clock=0;this.inputCount=0;this.portal=null;this.result=null;this.outro=null;this.crash=null;this.coach=null;
  this.deaths=Math.max(0,Math.trunc(resume?.deaths)||0);this.carries=[];this.carry={...emptyCarry(),...(resume?.carry||{})};
  this.actIndex=idx;this.child=null;this.hearts=1;this.score=this.carry.points+this.carry.bonus;this.time=this.carry.time;this.pose=undefined;this._p=0;this._pAt=-1;
  this.beginAct(idx,this.carry);
 }
 get distance(){return this.child?.distance||0}
 get perfectStreak(){return this.child?.perfectStreak||0}
 get actName(){return this.actLabel(this.actIndex)}
 actLabel(i){return ({'floor-wall':'면 갈아타기',bridge:'착시 다리','helix-up':'나선 오르막','helix-down':'나선 내리막',penrose:'펜로즈 계단',align:'시점 정렬'})[this.acts[i]?.type]||'구간'}
 setViewport(width=390,height=844){this.viewport={width,height};this.child?.setViewport?.(width,height)}
 makeChild(i,carry){
  const a=this.acts[i];if(!a)return null;
  const chain={index:i,count:this.acts.length,first:i===0,last:i===this.acts.length-1,carry:{points:carry.points,shards:carry.shards,perfectStreak:carry.perfectStreak,hearts:carry.hearts},bpm:this.bpm,seed:this.seed+i*7919};
  const child=resolveAct(a.type)({...a.opts,viewport:{...this.viewport},settings:this.settings,attempt:this.attempt,chain,bpm:this.bpm,seed:chain.seed,hud:false});
  child.setViewport?.(this.viewport.width,this.viewport.height);return child;
 }
 /* Enter act i with the given carried state. A snapshot of the carry is kept: a fail restarts the act from exactly that state. */
 beginAct(i,carry){
  this.actIndex=i;this.carry={...carry};this.carries[i]={...carry};this.child=this.makeChild(i,carry);this._pAt=-1;
  this.hearts=1;this.crash=null;this.outro=null;
 }
 start(){
  if(this.state!=='ready')return false;
  if(!this.child){this.finishCourse('clear');return true}
  this.state='play';this.child.start?.();this.events.push('start');return true;
 }
 pause(){if(this.state!=='play')return false;this.state='pause';this.cancelInput();this.events.push('pause');return true}
 resume(){if(this.state!=='pause')return false;this.state='play';return true}
 /* In place: restart the failed (or current) act from its checkpoint carry. */
 retry(){
  if(!this.acts.length)return false;
  this.attempt++;this.portal=null;this.result=null;this.state='play';this.beginAct(this.actIndex,this.carries[this.actIndex]||this.carry);
  this.score=this.carry.points+this.carry.bonus;this.time=this.carry.time;this.child.start?.();this.events.push('start');return true;
 }
 /* As a fresh run for the host (startRun): resumes at the start of the act where the player fell. */
 checkpointRun(){
  const carry={...(this.carries[this.actIndex]||this.carry)};
  return new CourseRun({...this.options,attempt:this.attempt+1,viewport:{...this.viewport},settings:this.settings,resume:{index:this.actIndex,carry,deaths:this.deaths}});
 }
 inputDown(){return this.action()}
 inputUp(){this.child?.inputUp?.()}
 cancelInput(){this.child?.cancelInput?.()}
 action(){
  if(this.state!=='play'||!this.child||this.portal&&!this.portal.swapped)return false;
  this.inputCount++;
  return typeof this.child.action==='function'?this.child.action():this.child.inputDown();
 }
 drainEvents(){return this.events.splice(0)}
 tick(dt){
  if(this.state!=='play'||!this.child)return;
  this.updates++;this.clock+=dt;
  const p=this.portal;
  if(p){
   p.age+=dt;
   if(!p.swapped&&p.age>=p.duration*.5){p.swapped=true;this.child.start?.()}
   if(p.swapped)this.tickChild(dt);
   if(p.age>=p.duration)this.portal=null;
   return;
  }
  this.tickChild(dt);
 }
 tickChild(dt){
  const child=this.child;if(child.state!=='play'&&child.state!=='ready')return;
  child.tick(dt);
  for(const e of child.drainEvents?.()||[]){if(e==='perfect')this.carry.perfects++;if(!['start','clear','fail','pause','resume'].includes(e))this.events.push(e)}
  this.sync(child);
  if(child.state==='fail')this.failAct(child);
  else if(child.state==='clear')this.clearAct(child);
 }
 sync(child){
  this.score=num(child.score??child.points)+this.carry.bonus;this.time=this.carry.time+num(child.time);
  this.coach=child.coach||null;this.hearts=child.hearts??1;this.crash=child.crash||null;this.outro=child.outro||null;
  this.carry.bestStreak=Math.max(this.carry.bestStreak,num(child.perfectStreak));
 }
 clearAct(child){
  const r=child.result||{},points=num(r.points??child.points??child.score),bonus=Math.max(0,num(child.score)-num(child.points??r.points??child.score));
  const done={points,shards:this.carry.shards+num(r.shards??actShards(child)),shardTotal:this.carry.shardTotal+actShardTotal(child,r),perfectStreak:num(r.perfectStreak??child.perfectStreak),hearts:1,
   bonus:this.carry.bonus+bonus,time:this.carry.time+num(child.time),perfects:this.carry.perfects,bestStreak:Math.max(this.carry.bestStreak,num(r.perfectStreak))};
  if(this.actIndex>=this.acts.length-1){this.carry=done;this.score=done.points+done.bonus;this.time=done.time;this.finishCourse('clear',child);return}
  /* Aurora-gate transition into the next act. The next act is created now (frozen) and starts once the gate is half open. */
  this.beginAct(this.actIndex+1,done);this.score=done.points+done.bonus;this.time=done.time;
  const reduced=reducedMotion();this.portal={age:0,duration:reduced?PORTAL_REDUCED:PORTAL,swapped:false,reduced,snap:null,snapped:false};
  this.events.push('portal');
 }
 failAct(child){this.deaths++;this.finishCourse('fail',child)}
 finishCourse(state,child){
  const r=child?.result||{},c=this.carry,shards=c.shards+(state==='clear'?0:actShards(child||{}));
  this.state=state;this.portal=null;this.hearts=state==='fail'?0:1;
  const result={mode:'road',state,courseId:this.id,name:this.name,score:Math.floor(this.score),points:c.points||num(child?.points),bonus:c.bonus,time:this.time,attempt:this.attempt,
   actIndex:this.actIndex,actCount:this.acts.length,actName:this.actLabel(this.actIndex),shards:state==='clear'?c.shards:shards,shardTotal:c.shardTotal+(state==='clear'?0:actShardTotal(child||{},r)),
   deaths:this.deaths,perfects:c.perfects,bestStreak:c.bestStreak,progress:state==='clear'?1:this.progress(),fallback:this.usedFallback,
   reason:state==='clear'?'오로라의 문을 지났어요.':(r.reason||'길이 끊겼어요')};
  result.goals=goals(result);result.stars=result.goals.filter(Boolean).length;this.result=result;this.events.push(state);
 }
 /* 0..1 over the whole course: finished acts plus the running act's own progress, weighted by act length. */
 progress(){
  if(this.state==='clear')return 1;
  if(this._pAt===this.updates&&this.state==='play')return this._p;
  let done=0;for(let i=0;i<this.actIndex;i++)done+=this.acts[i].weight;
  let inner=0;if(this.child&&!(this.portal&&!this.portal.swapped)){try{inner=clamp(num(this.child.status?.().progress),0,1)}catch(_){inner=0}}
  this._p=clamp((done+inner*(this.acts[this.actIndex]?.weight||0))/this.total,0,1);this._pAt=this.updates;return this._p;
 }
 /* Cumulative act boundaries on the gauge (0..1), for notches. */
 boundaries(){const out=[];let s=0;for(let i=0;i<this.acts.length-1;i++){s+=this.acts[i].weight;out.push(s/this.total)}return out}
 liveShards(){return this.carry.shards+(this.child?actShards(this.child):0)}
 status(){
  return {mode:this.mode,dreamMode:'road',state:this.state,time:this.time,hearts:this.hearts,score:Math.floor(this.score),best:0,progress:this.progress(),
   roomTitle:this.name+' · '+this.actName,roomIndex:this.actIndex,roomCount:this.acts.length,instruction:'탭: 점프 · 금빛 표식 근처면 정렬',cue:null,result:this.result,
   course:{id:this.id,act:this.actIndex,acts:this.acts.length,type:this.acts[this.actIndex]?.type||'',transition:!!this.portal}};
 }
 drawSelf(c,opts){return draw(c,this,opts)}
}

/* ---------- drawing ---------- */
let childOpts=null;
function drawChild(c,run,opts){
 const child=run.child;if(!child)return;
 const o=childOpts||(childOpts={});Object.assign(o,opts);o.chained=true;o.hud=false;o.time=child.time;
 try{
  if(child.openingCourse)root.MongyuOpening.draw(c,child,o);
  else child.drawSelf(c,o);
 }catch(e){if(!child.__drawWarned){child.__drawWarned=true;try{root.console?.error?.('[MongyuCourse] act draw failed',run.acts[run.actIndex]?.type,e)}catch(_){}}}
}
/* Copy what is on the canvas right now (the previous frame: the act that just ended) so the gate can cross-fade from it. */
function snapshot(c,p){
 p.snapped=true;
 try{
  const src=c.canvas,doc=root.document;if(!src||!doc||!src.width)return;
  const snap=doc.createElement('canvas');snap.width=src.width;snap.height=src.height;
  const x=snap.getContext('2d');x.drawImage(src,0,0);p.snap=snap;
 }catch(_){p.snap=null}
}
function gate(c,p,w,h){
 const u=clamp(p.age/p.duration,0,1),cx=w/2,cy=h*.46,maxR=Math.hypot(w,h)/2*1.08,min=Math.min(w,h);
 const fade=u<.4?1:1-ease(clamp((u-.4)/.5,0,1));
 if(p.snap&&fade>0){c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=fade;c.drawImage(p.snap,0,0);c.restore()}
 else if(!p.snap&&fade>0){c.save();c.globalAlpha=fade*.85;c.fillStyle='#1b1230';c.fillRect(0,0,w,h);c.restore()}
 if(p.reduced)return;
 const inward=ease(clamp(u/.5,0,1)),outward=clamp((u-.5)/.5,0,1),alpha=1-outward*outward;
 c.save();c.globalCompositeOperation='lighter';
 const rings=[['127,243,225',0],['183,140,255',.1],['255,158,216',.2]];
 for(let i=0;i<rings.length;i++){
  const [rgb,delay]=rings[i],k=ease(clamp((u-delay*.6)/.5,0,1)),r=maxR+(min*.1-maxR)*k+outward*min*(.5+delay*2);
  c.globalAlpha=alpha*.85;c.lineWidth=3+7*(1-inward)+outward*4;c.strokeStyle='rgba('+rgb+',.9)';
  c.beginPath();c.ellipse(cx,cy,r*.72,r,0,0,TAU);c.stroke();
  c.globalAlpha=alpha*.3;c.lineWidth=14+10*(1-inward);c.strokeStyle='rgba('+rgb+',.4)';c.stroke();
 }
 const glow=Math.sin(Math.PI*u),gr=min*(.2+.9*Math.sin(Math.PI*clamp(u,0,1))*.8),g=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(1,gr));
 g.addColorStop(0,'rgba(255,250,236,'+(.85*glow).toFixed(3)+')');g.addColorStop(.45,'rgba(190,170,255,'+(.28*glow).toFixed(3)+')');g.addColorStop(1,'rgba(190,170,255,0)');
 c.globalAlpha=1;c.fillStyle=g;c.fillRect(0,0,w,h);c.restore();
}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function hud(c,run,w,h,show=1){
 if(run.state==='fail'||run.state==='clear'||show<=0)return;
 const child=run.child,out=show*(run.outro?.kind==='fail'||run.crash?clamp(1-num(run.outro?.age)/FAIL_HUD,0,1):1);if(out<=0)return;
 c.save();c.globalAlpha=out;c.textAlign='center';const top=Math.max(14,h*.035),score=String(Math.floor(run.score));
 const label=run.name+' · '+(run.actIndex+1)+'/'+run.acts.length+' '+run.actName;
 c.font='600 11px system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(20,12,36,.6)';c.strokeText(label,w/2,top+10);c.fillStyle='rgba(255,243,226,.88)';c.fillText(label,w/2,top+10);
 c.font='800 40px system-ui,sans-serif';c.lineWidth=5;c.strokeStyle='rgba(20,12,36,.55)';c.strokeText(score,w/2,top+52);c.fillStyle='#fff3d6';c.fillText(score,w/2,top+52);
 const streak=run.perfectStreak;
 if(streak>=2){const t='완벽 ×'+streak;c.font='800 13px system-ui,sans-serif';const tw=c.measureText(t).width+22;rr(c,w/2-tw/2,top+62,tw,22,11);c.fillStyle='rgba(255,217,138,.9)';c.fill();c.fillStyle='#3a2410';c.fillText(t,w/2,top+77)}
 const coach=child?.coach&&num(child.time)<child.coach.until?child.coach.text:'';
 if(coach&&run.state==='play'&&!run.portal){c.font='700 16px system-ui,sans-serif';const tw=Math.min(w-48,c.measureText(coach).width+36),y=h*.74;rr(c,w/2-tw/2,y-19,tw,38,19);c.fillStyle='rgba(26,19,48,.66)';c.fill();c.strokeStyle='rgba(255,236,255,.16)';c.lineWidth=1;c.stroke();c.fillStyle='#fbf4ff';c.fillText(coach,w/2,y+6)}
 // Progress gauge with a notch for each act gate (lit once passed).
 const gy=h*.86,gw=Math.min(w*.7,320),x0=w/2-gw/2,frac=run.progress();
 rr(c,x0,gy,gw,6,3);c.fillStyle='rgba(255,255,255,.14)';c.fill();rr(c,x0,gy,Math.max(6,gw*frac),6,3);c.fillStyle='#bfe9ff';c.fill();
 for(const b of run.boundaries()){c.save();c.translate(x0+gw*b,gy+3);c.rotate(Math.PI/4);c.fillStyle=frac>=b?'#ffd98a':'rgba(255,255,255,.45)';c.fillRect(-3.4,-3.4,6.8,6.8);c.restore()}
 const total=run.carry.shardTotal+num(actShardTotal(child||{},null));
 if(total>0){c.font='700 11px system-ui,sans-serif';c.textAlign='right';c.fillStyle='rgba(255,236,190,.85)';c.fillText('◆ '+run.liveShards(),x0+gw,gy-8)}
 c.restore();
}
function draw(c,run,opts){
 const {width:w,height:h}=opts.viewport,p=run.portal;
 if(p&&!p.snapped)snapshot(c,p);
 if(run.child){drawChild(c,run,opts);root.MongyuPsy?.draw?.(c,run,opts)}
 else{c.fillStyle='#1b1230';c.fillRect(0,0,w,h)}
 if(p)gate(c,p,w,h);
 hud(c,run,w,h,p?clamp((p.age/p.duration-.45)/.4,0,1):1);
 return null;
}

const api=Object.freeze({enabled,CourseRun,registerAct,unregisterAct,hasAct,resolveAct,playableActs,CHAPTER1,courseById,BRIDGES,TONES,stars,goals,SLOT,PORTAL,PORTAL_REDUCED,draw});
root.MongyuCourse=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
