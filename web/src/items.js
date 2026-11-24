/* R105 items: pickups (moon bubble, starlight hourglass, cloud feather, memory star), the aurora surge state and the shared run.mods contract. Owned by workstream I.
   run.mods={shield:n,slowUntil:t,featherCharges:n,surgeUntil:t}, t in the act's own raw clock (run.clock, falls back to run.time). Acts call:
   setup(run,{items,start,len,beat,...}) once per attempt, collect(run,distance,height,peak,reach) every tick, applyHit(run) at a hazard collision (true = absorbed),
   applyPace(run,dt) in pace(), applyJump(run,FLIGHT) in jump() (sets run.pk), settle(run) after every tick (score x2 while surging, surge trigger).
   Drawing: drawItems / drawLight / drawAura (in the act's own projection), drawChips (CourseRun HUD). Everything is inert unless MONGYU_UI_EDITION===true. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const TUNING=Object.freeze({slowScale:.7,slowTime:4,surgeTime:4,surgeMult:2,surgeEvery:3,featherLen:1.6,featherPeak:1.5,maxShield:2,maxFeather:2,starPoints:100,giftPoints:20,coach:1.8,blinkHz:2,blinkLast:1});
const SPRITE=Object.freeze({light:'item-light',bubble:'item-bubble',time:'item-hourglass',feather:'item-feather','memory-star':'item-star',ring:'item-ring',pad:'item-lotus-pad'});
const ALIAS=Object.freeze({star:'memory-star',hourglass:'time',slow:'time',shield:'bubble'});
const GIFTS=Object.freeze(['bubble','time','feather']);
/* ring (air jump) and pad (auto launch) devices are not implemented yet: their sprites are mapped but their kinds are not accepted. */
const KINDS=Object.freeze([...GIFTS,'memory-star']);
/* Coach voice (길, 반말). Keys double as the English phrase table keys in i18n-en-items.js. */
const LINES=Object.freeze({bubble:'달빛 방울 얻었어',time:'별빛 시간, 잠깐 느려져',feather:'구름 깃털, 다음 점프는 멀리','memory-star':'기억의 별을 찾았어',surge:'오로라 파도! 점수 두 배','shield-break':'방울이 대신 맞았어',assist:'달빛 방울을 놓아 뒀어'});
/* Distinct sound per item through the host's existing synthesized effects (shape + colour + sound). */
const SFX=Object.freeze({bubble:'square-room',time:'aurora-shimmer',feather:'chain','memory-star':'perfect-chime',surge:'square-portal','shield-break':'impact-glass',ring:'pass',pad:'jump'});
const normKind=k=>{k=ALIAS[k]||k;return KINDS.includes(k)?k:null};
const nowOf=run=>Number.isFinite(run?.clock)?run.clock:Number(run?.time)||0;
const reducedMotion=()=>{try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}};
function sfx(name){try{root.MongyuPolish?.host?.sound?.(name)}catch(_){}}

/* ---------- mods ---------- */
function newMods(){return {shield:0,slowUntil:0,featherCharges:0,surgeUntil:0}}
const int=(v,max)=>Number.isFinite(v)?clamp(Math.trunc(v),0,max):0;
/* Carry format between acts uses time left, because each act starts its own clock at 0. */
function importMods(carry,t=0){
 const m=newMods();if(!carry)return m;
 m.shield=int(carry.shield,TUNING.maxShield);m.featherCharges=int(carry.featherCharges,TUNING.maxFeather);
 if(carry.slowLeft>0)m.slowUntil=t+Math.min(TUNING.slowTime,carry.slowLeft);
 if(carry.surgeLeft>0)m.surgeUntil=t+Math.min(TUNING.surgeTime,carry.surgeLeft);
 return m;
}
function exportMods(run){
 const m=run?.mods;if(!m)return null;const t=nowOf(run);
 return {shield:m.shield,featherCharges:m.featherCharges,slowLeft:Math.max(0,m.slowUntil-t),surgeLeft:Math.max(0,m.surgeUntil-t)};
}
const slowLeft=run=>run?.mods?Math.max(0,run.mods.slowUntil-nowOf(run)):0;
const surgeLeft=run=>run?.mods?Math.max(0,run.mods.surgeUntil-nowOf(run)):0;
function summary(run){const m=run?.mods;return m?{shield:m.shield,slow:slowLeft(run),feather:m.featherCharges,surge:surgeLeft(run)}:null}

/* ---------- persistent memory stars (mongyu.r105.road, entry per course: memoryStars) ---------- */
const ROAD_KEY='mongyu.r105.road';
let store=null;
function storage(){
 if(store)return store;
 try{const s=root.localStorage;store=root.MongyuStorage?root.MongyuStorage.create(s):s;if(!store)throw Error('none')}catch(_){store={getItem(){return null},setItem(){throw Error('no storage')},removeItem(){}}}
 return store;
}
function setStorage(s){store=s||null}
function readRoad(){
 try{const d=JSON.parse(storage().getItem(ROAD_KEY)||'null');if(d&&d.v===1&&d.courses&&typeof d.courses==='object'&&!Array.isArray(d.courses))return d}catch(_){}
 return {v:1,plays:0,last:null,courses:{}};
}
function writeRoad(d){try{storage().setItem(ROAD_KEY,JSON.stringify(d));return true}catch(_){return false}}
function hasMemoryStar(courseId){if(!courseId)return false;const c=readRoad().courses[courseId];return !!c&&typeof c==='object'&&c.memoryStars>0}
function memoryStars(){const d=readRoad(),out={};for(const id of Object.keys(d.courses)){const c=d.courses[id];if(c&&typeof c==='object'&&c.memoryStars>0)out[id]=c.memoryStars|0}return out}
function totalMemoryStars(){return Object.values(memoryStars()).reduce((s,n)=>s+n,0)}
/* Returns true when the star is new (and was saved). The entry is created with the road-mode defaults so record() keeps working on it. */
function saveMemoryStar(courseId){
 if(!courseId)return false;
 const d=readRoad();let c=d.courses[courseId];
 if(!c||typeof c!=='object')c={g:0,stars:0,best:0,clears:0,plays:0,bestShards:0,bestProgress:0};
 if(c.memoryStars>0)return false;
 d.courses[courseId]={...c,memoryStars:1};return writeRoad(d);
}

/* ---------- placement ---------- */
/* An item entry is {at:0..1 of the act path, kind, lane?:'lo'|'hi'} or {beat:n, kind}. start/len/beat (world units) belong to the act. */
function place(e,g){
 if(Number.isFinite(e.beat)&&g.beat>0)return g.start+e.beat*g.beat;
 if(Number.isFinite(e.at))return g.start+clamp(e.at,0,1)*g.len;
 return NaN;
}
/* Builds run.itemList (sorted, deterministic) from options.items. g.height(lane)/g.rank are the act's business. */
function setup(run,g={}){
 if(!enabled||!run)return null;
 const ch=run.chain||null,carry=ch?.carry||{};
 run.mods=importMods(carry.mods,0);run.shielded=!!carry.shielded;run.assisted=!!carry.assisted;run.gotStar=!!carry.memoryStar;
 run.pk=1;run.lastItem=null;run.itemState={k:1,pp:Number(run.points)||0,ps:Number(run.perfectStreak)||0,breakAt:-10,surgeAt:-10,hint:0};
 const owned=hasMemoryStar(ch?.courseId),list=[];
 for(const [i,e] of (Array.isArray(g.items)?g.items:[]).entries()){
  const kind=normKind(e?.kind),at=place(e||{},g);if(!kind||!Number.isFinite(at))continue;
  list.push({id:i,kind,at,lane:e.lane==='hi'||e.lane==='lo'?e.lane:(kind==='memory-star'||kind==='ring'?'hi':'lo'),got:false,gotAt:-10,assist:!!e.assist,owned:kind==='memory-star'&&owned,phase:i*1.7});
 }
 list.sort((a,b)=>a.at-b.at||a.id-b.id);run.itemList=list;return list;
}

/* ---------- effects the acts call ---------- */
function coach(run,text,hold=TUNING.coach){run.coach={kind:'item',text,until:(Number(run.time)||0)+hold}}
function take(run,it){
 const m=run.mods,t=nowOf(run);
 it.got=true;it.gotAt=t;run.lastItem={kind:it.kind,at:it.at,again:it.owned,assist:it.assist};run.events.push('item');
 if(it.kind==='bubble'){m.shield=Math.min(TUNING.maxShield,m.shield+1);if(it.assist)run.assisted=true}
 else if(it.kind==='time')m.slowUntil=t+TUNING.slowTime;
 else if(it.kind==='feather')m.featherCharges=Math.min(TUNING.maxFeather,m.featherCharges+1);
 else if(it.kind==='memory-star'){run.gotStar=true;if(!it.owned)saveMemoryStar(run.chain?.courseId)}
 if(it.kind==='memory-star')run.points=(run.points||0)+TUNING.starPoints;else if(GIFTS.includes(it.kind))run.points=(run.points||0)+TUNING.giftPoints;
 coach(run,LINES[it.kind]||'');sfx(SFX[it.kind]);
}
/* Pickup test, called every tick after the runner moved. lane lo: on the ground path; hi: needs the upper half of a jump. */
function collect(run,dist,height,peak,reach=10){
 const L=run?.itemList;if(!L||!L.length||!run.mods)return;
 for(let i=0;i<L.length;i++){
  const it=L[i];if(it.got)continue;
  const d=dist-it.at;if(d<-reach)break;if(d>reach)continue;
  const ok=it.lane==='hi'?height>=peak*.55:height<=peak*.4;
  if(ok)take(run,it);
 }
}
/* Hazard collision: true when a bubble absorbed it (the act then treats the hazard as passed). */
function applyHit(run){
 const m=run?.mods;if(!enabled||!m||m.shield<=0)return false;
 m.shield--;run.shielded=true;run.lastItem={kind:'shield-break'};run.events.push('shield-break');
 if(run.itemState)run.itemState.breakAt=nowOf(run);
 coach(run,LINES['shield-break'],1.6);sfx(SFX['shield-break']);return true;
}
/* Step multiplier: 0.7 while the starlight hour lasts, eased so the change of speed is not a jolt. */
function applyPace(run,dt){
 const m=run?.mods,st=run?.itemState;if(!enabled||!m||!st)return dt;
 const target=nowOf(run)<m.slowUntil?TUNING.slowScale:1;
 st.k+=(target-st.k)*Math.min(1,dt*10);if(Math.abs(target-st.k)<.004)st.k=target;
 return dt*st.k;
}
/* Next jump length (feather: double), sets run.pk (peak multiplier). Without mods the act's own FLIGHT is returned untouched. */
function applyJump(run,flight){
 const m=run?.mods;run.pk=1;
 if(!enabled||!m||m.featherCharges<=0)return flight;
 m.featherCharges--;run.pk=TUNING.featherPeak;run.featherJump=true;return flight*TUNING.featherLen;
}
/* After every tick: surge trigger (perfect streak reaching a multiple of 3 → 4 s) and x2 on every point gained while it lasts. */
function settle(run){
 const st=run?.itemState,m=run?.mods;if(!enabled||!st||!m)return;
 const t=nowOf(run),ps=Number(run.perfectStreak)||0;
 if(ps>st.ps&&ps%TUNING.surgeEvery===0){m.surgeUntil=t+TUNING.surgeTime;st.surgeAt=t;run.lastItem={kind:'surge'};run.events.push('surge');coach(run,LINES.surge,2);sfx(SFX.surge)}
 st.ps=ps;
 const points=Number(run.points)||0,dp=points-st.pp;
 if(dp>0&&t<m.surgeUntil){
  const extra=dp*(TUNING.surgeMult-1);run.points=points+extra;if(Number.isFinite(run.score))run.score+=extra;
  if(run.result&&Number.isFinite(run.result.points)){run.result.points+=extra;if(Number.isFinite(run.result.score)&&run.result.mode!=='restoration')run.result.score+=extra}
  st.pp=run.points;
 }else st.pp=points;
}
/* Hands the assist bubble to an act that restarted a stretch the player failed three times (CourseRun passes it as an item with assist:true). */
const assistLine=()=>LINES.assist;

/* ---------- drawing ---------- */
const cache=new Map();
function bitmap(id,px){
 const art=root.MongyuArt;if(!art||!art.ready(id))return null;
 const size=px<=34?32:px<=52?48:px<=76?72:px<=110?112:px<=170?160:256,key=id+'@'+size;
 let c=cache.get(key);if(c!==undefined)return c;
 const img=art.image(id);c=img;
 try{
  const doc=root.document;if(doc?.createElement&&size<256){
   const cv=doc.createElement('canvas');cv.width=cv.height=size;const x=cv.getContext('2d');
   if(x){x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
    /* halve in steps so a 256px source never aliases */
    let src=img,sw=img.naturalWidth||256;
    while(sw/2>size*1.2){const h=Math.round(sw/2),t=doc.createElement('canvas');t.width=t.height=h;const tx=t.getContext('2d');tx.imageSmoothingQuality='high';tx.drawImage(src,0,0,h,h);src=t;sw=h}
    x.drawImage(src,0,0,size,size);c=cv}
  }
 }catch(_){c=img}
 cache.set(key,c);return c;
}
function deviceScale(c){try{const m=c.getTransform?.();return m?Math.hypot(m.a,m.b)||1:1}catch(_){return 1}}
/* Simple vector stand-ins (also used until the WebP is decoded): shape tells the kind even without colour. */
function fallback(c,kind,x,y,s){
 c.save();c.translate(x,y);c.lineJoin='round';
 if(kind==='light'){c.fillStyle='#ffe08a';c.beginPath();c.moveTo(0,-s*.5);c.lineTo(s*.28,0);c.lineTo(0,s*.5);c.lineTo(-s*.28,0);c.closePath();c.fill();c.fillStyle='#fff7d0';c.fillRect(-s*.07,-s*.07,s*.14,s*.14)}
 else if(kind==='bubble'){c.beginPath();c.arc(0,0,s*.42,0,TAU);c.fillStyle='rgba(180,220,255,.45)';c.fill();c.lineWidth=Math.max(1,s*.07);c.strokeStyle='#e8f6ff';c.stroke();c.beginPath();c.arc(-s*.12,-s*.12,s*.18,Math.PI,Math.PI*1.5);c.stroke()}
 else if(kind==='time'){c.fillStyle='#b99cff';c.strokeStyle='#efe6ff';c.lineWidth=Math.max(1,s*.06);c.beginPath();c.moveTo(-s*.28,-s*.4);c.lineTo(s*.28,-s*.4);c.lineTo(0,0);c.lineTo(s*.28,s*.4);c.lineTo(-s*.28,s*.4);c.lineTo(0,0);c.closePath();c.fill();c.stroke()}
 else if(kind==='feather'){c.rotate(-.7);c.fillStyle='#ffb8d8';c.strokeStyle='#fff0f7';c.lineWidth=Math.max(1,s*.05);c.beginPath();c.ellipse(0,0,s*.17,s*.46,0,0,TAU);c.fill();c.stroke();c.beginPath();c.moveTo(0,-s*.46);c.lineTo(0,s*.56);c.stroke()}
 else if(kind==='memory-star'){c.fillStyle='#8f6ae0';c.strokeStyle='#ffe9a8';c.lineWidth=Math.max(1,s*.06);c.beginPath();for(let i=0;i<10;i++){const r=i%2?s*.2:s*.48,a=-Math.PI/2+i*Math.PI/5;c[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r)}c.closePath();c.fill();c.stroke()}
 else if(kind==='ring'){c.lineWidth=Math.max(2,s*.12);c.strokeStyle='#ffd98a';c.beginPath();c.arc(0,0,s*.38,0,TAU);c.stroke()}
 else{c.fillStyle='#ffb3d0';c.beginPath();c.ellipse(0,s*.1,s*.46,s*.2,0,0,TAU);c.fill();c.fillStyle='#fff0f6';c.beginPath();c.ellipse(0,0,s*.22,s*.1,0,0,TAU);c.fill()}
 c.restore();
}
/* Draw a sprite centred at (x,y), px world units across. Returns true when the generated art was used. */
function drawSprite(c,kind,x,y,px,o){
 const id=SPRITE[kind],alpha=o&&o.alpha!==undefined?o.alpha:1;if(alpha<=0||!(px>0))return false;
 const img=id?bitmap(id,px*deviceScale(c)):null;
 if(!img){c.save();c.globalAlpha*=alpha;fallback(c,kind,x,y,px);c.restore();return false}
 const rot=o&&o.rot||0,sx=o&&o.sx!==undefined?o.sx:1,pa=c.globalAlpha;
 if(alpha!==1)c.globalAlpha=pa*alpha;
 if(rot||sx!==1){c.save();c.translate(x,y);if(rot)c.rotate(rot);c.drawImage(img,-px*sx/2,-px/2,px*sx,px)}
 else c.drawImage(img,x-px/2,y-px/2,px,px);
 if(rot||sx!==1)c.restore();
 if(alpha!==1)c.globalAlpha=pa;
 return true;
}
/* The collectible light shard as item-light. i=shard index (phase), up=extra rotation that keeps it upright under a rotated camera. */
/* R105 POL: on light trips (the course sets this each frame) collectibles are flat gold with a dark outline instead of the glowing art, so they read on pale ground. */
let LIGHT=null;
function setLight(ink){LIGHT=ink&&ink.light?ink:null}
function goldShard(c,x,y,px,t,i,reduced){
 const K=LIGHT,s=px,w=reduced?.26:.2+.08*Math.cos(t*2+i*1.7);
 c.save();c.translate(x,y);c.lineJoin='round';
 c.beginPath();c.moveTo(0,-s*.5);c.lineTo(s*w+s*.08,0);c.lineTo(0,s*.5);c.lineTo(-s*w-s*.08,0);c.closePath();
 c.fillStyle=K.tap;c.fill();c.lineWidth=Math.max(1.4,s*.1);c.strokeStyle=K.tapLine;c.stroke();
 c.beginPath();c.moveTo(0,-s*.5);c.lineTo(s*w*.5+s*.04,0);c.lineTo(0,s*.12);c.closePath();c.fillStyle='#fff0b8';c.globalAlpha=.8;c.fill();
 c.restore();
 return true;
}
function drawLight(c,x,y,px,t,i,reduced,up){
 if(enabled&&LIGHT){const bob=reduced?0:Math.sin(t*2.2+i)*px*.06;return goldShard(c,x,y+bob,px,t,i,reduced)}
 if(!enabled||!root.MongyuArt?.ready?.('item-light'))return false;
 const sway=reduced?1:.86+.14*Math.cos(t*2+i*1.7),bob=reduced?0:Math.sin(t*2.2+i)*px*.06;
 return drawSprite(c,'light',x,y+bob,px,{rot:up||0,sx:sway});
}
/* One pickup. project(it)->{x,y,s} gives the centre in the current drawing space (s = px per world unit) or null when off screen; up = rotation that keeps it upright. */
function drawItem(c,it,project,t,reduced,up){
 let age=0;if(it.got){age=t-it.gotAt;if(age>.5||age<0)return}
 const p=project(it);if(!p)return;
 const base=it.kind==='memory-star'||it.kind==='ring'||it.kind==='pad'?30:24,px=base*p.s;
 const bob=reduced?0:Math.sin(t*2.1+it.phase)*px*.07,pulse=reduced?1:1+.05*Math.sin(t*3+it.phase);
 if(!it.got){
  /* soft halo keeps the pickup readable on any background, tinted per kind */
  const g=glow(it.kind);if(LIGHT){c.save();c.globalAlpha=(it.owned?.4:.85);c.beginPath();c.arc(p.x,p.y+bob,px*.54,0,TAU);c.fillStyle='rgba(255,252,244,.55)';c.fill();c.lineWidth=Math.max(1.4,px*.06);c.strokeStyle=LIGHT.tapLine;c.stroke();c.restore()}
  else if(g){const gs=px*1.7;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(it.owned?.25:.7)*(reduced?1:.85+.15*Math.sin(t*2.4+it.phase));c.drawImage(g,p.x-gs/2,p.y+bob-gs/2,gs,gs);c.restore()}
  drawSprite(c,it.kind,p.x,p.y+bob,px*pulse,{alpha:it.owned?.5:1,rot:up||0});
 }else{
  const k=age/.5;c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-k)*.8;c.strokeStyle=HALO[it.kind]||HALO.bubble;c.lineWidth=Math.max(1.5,px*.06);c.beginPath();c.arc(p.x,p.y,px*(.5+k*.9),0,TAU);c.stroke();c.restore();
  drawSprite(c,it.kind,p.x,p.y-k*px*.4,px*(1+k*.5),{alpha:1-k,rot:up||0});
 }
}
function drawItems(c,run,project,t,reduced,up){
 const L=run?.itemList;if(!enabled||!L||!L.length)return;
 for(let i=0;i<L.length;i++)drawItem(c,L[i],project,t,reduced,up);
}
const HALO=Object.freeze({bubble:'#9fd8ff',time:'#b99cff',feather:'#ffb3d6','memory-star':'#ffe08a',ring:'#ffd98a',pad:'#ffc2dd'});
const glows=new Map();
/* Soft radial glow per kind, built once (no per-frame gradients). */
function glow(kind){
 if(glows.has(kind))return glows.get(kind);
 let cv=null;
 try{const doc=root.document;if(doc?.createElement){cv=doc.createElement('canvas');cv.width=cv.height=48;const x=cv.getContext('2d'),g=x.createRadialGradient(24,24,0,24,24,24),h=HALO[kind]||HALO.bubble;
  g.addColorStop(0,h+'cc');g.addColorStop(.45,h+'44');g.addColorStop(1,h+'00');x.fillStyle=g;x.fillRect(0,0,48,48)}}catch(_){cv=null}
 glows.set(kind,cv);return cv;
}
/* 2 Hz blink in the last second of a timed mod (steady when reduced). */
function blinkAlpha(left,t,reduced){
 if(left>TUNING.blinkLast||reduced)return reduced&&left<=TUNING.blinkLast?.6:1;
 return Math.floor(t*TUNING.blinkHz*2)%2?.3:1;
}
/* Ring around the runner: bubble = solid pale ring, slow = dashed violet ring, feather = two pink wing arcs, surge = double gold ring with sparks. */
function drawAura(c,run,x,y,r,t,reduced){
 const m=run?.mods;if(!enabled||!m||!(r>0))return;
 const tn=nowOf(run),sl=m.slowUntil-tn,sg=m.surgeUntil-tn,st=run.itemState;
 const rd=reduced===undefined?reducedMotion():reduced;
 c.save();c.translate(x,y);
 if(m.shield>0){
  c.globalAlpha=.9;c.lineWidth=Math.max(1.4,r*.07);c.strokeStyle='rgba(205,236,255,.9)';c.fillStyle='rgba(170,220,255,.12)';c.beginPath();c.arc(0,0,r,0,TAU);c.fill();c.stroke();
  c.lineWidth=Math.max(1,r*.05);c.strokeStyle='rgba(255,255,255,.85)';c.beginPath();c.arc(0,0,r*.82,Math.PI*1.12,Math.PI*1.45);c.stroke();
  if(m.shield>1){c.beginPath();c.arc(0,0,r*1.12,0,TAU);c.strokeStyle='rgba(205,236,255,.5)';c.stroke()}
 }
 if(sl>0){
  c.globalAlpha=.85*blinkAlpha(sl,t,rd);c.lineWidth=Math.max(1.4,r*.07);c.strokeStyle='rgba(196,160,255,.95)';c.setLineDash([r*.28,r*.2]);c.lineDashOffset=rd?0:-t*r*.3;
  c.beginPath();c.arc(0,0,r*1.2,0,TAU);c.stroke();c.setLineDash([]);
 }
 if(m.featherCharges>0){
  c.globalAlpha=.9;c.lineWidth=Math.max(1.6,r*.1);c.lineCap='round';c.strokeStyle='rgba(255,170,212,.95)';
  for(const s of [-1,1]){c.beginPath();c.arc(0,0,r*1.02,s<0?Math.PI*.72:-Math.PI*.28,s<0?Math.PI*1.28:Math.PI*.28);c.stroke()}
  if(m.featherCharges>1){for(const s of [-1,1]){c.beginPath();c.arc(0,0,r*1.18,s<0?Math.PI*.8:-Math.PI*.2,s<0?Math.PI*1.2:Math.PI*.2);c.stroke()}}
 }
 if(sg>0){
  const a=blinkAlpha(sg,t,rd);c.globalAlpha=.9*a;c.lineWidth=Math.max(1.4,r*.07);c.strokeStyle='rgba(255,205,90,.95)';
  const pulse=rd?0:Math.sin(t*3)*.04;c.beginPath();c.arc(0,0,r*(1.26+pulse),0,TAU);c.stroke();c.lineWidth=Math.max(1,r*.045);c.strokeStyle='rgba(88,214,196,.9)';c.beginPath();c.arc(0,0,r*(1.4-pulse),0,TAU);c.stroke();
  if(!rd)for(let i=0;i<4;i++){const q=t*.8+i*Math.PI/2;c.fillStyle='rgba(255,236,160,.95)';c.fillRect(Math.cos(q)*r*1.33-1.6,Math.sin(q)*r*1.33-1.6,3.2,3.2)}
 }
 if(st&&!rd&&tn-st.breakAt<.45&&tn>=st.breakAt){
  const k=(tn-st.breakAt)/.45;c.globalAlpha=(1-k)*.9;c.strokeStyle='#e6f6ff';c.lineWidth=Math.max(1.5,r*.08*(1-k)+1);
  c.beginPath();c.arc(0,0,r*(1+k*.8),0,TAU);c.stroke();
  for(let i=0;i<8;i++){const q=i*Math.PI/4+.3,d=r*(1+k*1.1);c.fillStyle='#d8f0ff';c.fillRect(Math.cos(q)*d-1.6,Math.sin(q)*d-1.6,3.2,3.2)}
 }
 c.restore();
}
/* HUD chips (CourseRun): icon + count or seconds left, in a row centred on cx. Shape and colour differ per kind. */
function rrect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function chipList(run){
 const m=run?.mods,out=[];if(!enabled||!m)return out;
 const sl=slowLeft(run),sg=surgeLeft(run);
 if(m.shield>0)out.push({kind:'bubble',text:'×'+m.shield,left:99,tint:'159,216,255'});
 if(sl>0)out.push({kind:'time',text:String(Math.ceil(sl)),left:sl,tint:'185,156,255'});
 if(m.featherCharges>0)out.push({kind:'feather',text:'×'+m.featherCharges,left:99,tint:'255,179,214'});
 if(sg>0)out.push({kind:'light',text:'×2',left:sg,tint:'255,224,140'});
 return out;
}
function drawChips(c,run,cx,y,reduced){
 const list=chipList(run);if(!list.length)return;
 const rd=reduced===undefined?reducedMotion():reduced,t=nowOf(run),H=24,gap=6;
 c.save();c.font='800 12px system-ui,sans-serif';c.textAlign='left';c.textBaseline='middle';
 const widths=list.map(ch=>H+8+(c.measureText?.(ch.text)?.width||ch.text.length*7)+8);
 let x=cx-(widths.reduce((s,v)=>s+v,0)+gap*(list.length-1))/2;
 list.forEach((ch,i)=>{
  const w=widths[i],a=blinkAlpha(ch.left,t,rd);
  c.globalAlpha=a;rrect(c,x,y,w,H,H/2);c.fillStyle='rgba(26,19,48,.72)';c.fill();c.lineWidth=1.4;c.strokeStyle='rgba('+ch.tint+',.9)';c.stroke();
  drawSprite(c,ch.kind,x+H/2+1,y+H/2,H-4,{});
  c.fillStyle='#fff6e6';c.fillText(ch.text,x+H+3,y+H/2+1);
  if(ch.left<=TUNING.slowTime){c.fillStyle='rgba('+ch.tint+',.95)';c.fillRect(x+H/2,y+H-4,(w-H/2-8)*clamp(ch.left/TUNING.slowTime,0,1),2)}
  x+=w+gap;
 });
 c.restore();
}

const api=Object.freeze({enabled,TUNING,KINDS,GIFTS,LINES,SFX,SPRITE,normKind,nowOf,newMods,importMods,exportMods,slowLeft,surgeLeft,summary,
 hasMemoryStar,memoryStars,totalMemoryStars,saveMemoryStar,setStorage,readRoad,ROAD_KEY,place,setup,collect,applyHit,applyPace,applyJump,settle,assistLine,
 drawSprite,drawLight,setLight,drawItem,drawItems,drawAura,drawChips,chipList,blinkAlpha});
root.MongyuItems=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
