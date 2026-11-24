/* R105 boss act (workstream BOSS): act type "boss", the rule exam that closes a chapter (blueprint 5.1, 3.6, FX20/FX21). Follows the act contract of docs/R105_SPEC_KO.md. Inert unless MONGYU_UI_EDITION===true.
   Not an HP bar: three phases, each one a single rule. A phase = telegraph (1.15 s banner + an outline glyph, a silhouette that re-forms; never colour or sound alone) -> pattern -> next phase.
   Each phase is a checkpoint: a fail keeps phaseCheckpoint() ({ph,points,perfectStreak,rec}) and CourseRun hands it back as chain.resume, so retry restarts at the start of the failed phase (no reveal again).
   Bosses (options.boss): B01 cube (faces / link / open), B02 toy king (scale / morph / key), B03 city (corner / illusion / rotate), B04 reflector (mirror / ghost / coop), B05 no exit (diff / invert / stop).
   Mechanics reuse the corridor runner of square-act.js (SideRun base of the mirror and wait acts: tap = jump, hold zones, items, hit-stop, crash outro) and add the element kinds jump, duck, pit, gate, door, hold, rot, tjump, gjump.
   Everything is on the beat grid and fully seeded; only B04's ghost depends on what you tapped (an "ideal" recording stands in when there is none).
   Events: start jump land perfect pass hit portal collect item, plus boss-reveal / boss-phase / boss-clear (also emitted on MongyuPolish as bus events for the humor director). options: boss, bpm, seed, items, trip, hud, chain. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const num=v=>Number.isFinite(v)?v:0;
const reducedMotion=()=>{try{return root.MongyuPolish?.host?.settings?.()?.reduced===true}catch(_){return false}};
const cvdOn=()=>{try{const d=root.document?.documentElement;return !!d&&d.dataset&&d.dataset.cvd==='on'}catch(_){return false}};
const items=()=>root.MONGYU_UI_EDITION===true&&root.MongyuItems?.enabled?root.MongyuItems:null;
const mixc=(a,b,k)=>root.MongyuTrip?.mix?.(a,b,k)||a;
const lum=c=>{const n=parseInt(String(c).slice(1,7),16)||0;return (.2126*(n>>16&255)+.7152*(n>>8&255)+.0722*(n&255))/255};
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function mulberry(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
const hash=(i,k=0)=>{let h=(i*374761393+k*668265263)>>>0;h=Math.imul(h^h>>>13,1274126177)>>>0;return((h^h>>>16)>>>0)/4294967296};

/* ---------- constants ---------- */
const B=100,FL=.62,PEAK=44,W=15,SHOP_FL=.52,HOP=30,TEL=1.15,INTRO=1.8,CLEAR=1.3,CLEAR_REDUCED=.5,PIT=64,ROT_T=.85,STOP=30,DEC=150,OPEN=.9,RAMP=.7;
const SECS=[21,22,24];

/* ---------- boss sheet (ko source strings; English in i18n-en-boss.js) ---------- */
const BOSSES={
 B01:{n:1,id:'B01',trip:'c1',name:'큐브',sub:'여섯 면의 규칙',bpm:100,clear:'큐브가 발레 인사를 했어',win:'각 면이 다 열렸어',
  phases:[
   {kind:'faces',name:'면 전환',tele:'불 켜진 면의 블록이 와',coach:'바닥 면이면 뛰고, 천장 면이면 가만히',cause:{jump:'바닥 면 블록에 부딪혔어요',duck:'천장 면 블록에 머리를 부딪혔어요'}},
   {kind:'link',skin:'bridge',name:'연결 정렬',tele:'두 조각이 맞물릴 때 탭',coach:'어긋난 다리가 맞는 순간에 탭',cause:{pit:'다리가 이어지기 전에 떨어졌어요'}},
   {kind:'open',name:'반대 면 개방',tele:'높이 뛰어 두 면을 함께 열어',coach:'점프 꼭대기에서 위아래 판이 만나',cause:{gate:'반대 면이 한쪽만 열렸어요',jump:'바닥 면 블록에 부딪혔어요'}}]},
 B02:{n:2,id:'B02',trip:'c2',name:'장난감 왕',sub:'건전지는 어디 넣나',bpm:88,clear:'건전지 없이 잠들었어',win:'왕이 열쇠만 한 크기가 됐어',
  phases:[
   {kind:'scale',name:'크기 변화',tele:'커졌다 작아져. 도착할 때 크기가 답',coach:'점선이 도착할 때의 크기야',cause:{jump:'커진 블록에 부딪혔어요'}},
   {kind:'morph',name:'변신 통로',tele:'바닥은 구멍으로, 구멍은 천장으로',coach:'변한 모양을 보고 뛰거나 기다려',cause:{pit:'바닥이 구멍으로 변했어요',duck:'변신한 천장에 부딪혔어요'}},
   {kind:'hop',name:'작은 열쇠 길',tele:'몸이 작아져. 점프도 작게',coach:'작은 점프로 열쇠 이빨을 넘어',cause:{jump:'열쇠 이빨에 걸렸어요'}}]},
 B03:{n:3,id:'B03',trip:'c3',name:'도시',sub:'길을 다시 접는 도시',bpm:120,clear:'도시가 작은 모형이 됐어',win:'길이 제자리로 접혔어',
  phases:[
   {kind:'corner',name:'코너',tele:'길이 꺾이는 곳엔 틈이 있어',coach:'꺾이는 곳 앞에서 탭',cause:{pit:'코너의 틈에 빠졌어요',jump:'길모퉁이 블록에 부딪혔어요'}},
   {kind:'link',skin:'illusion',name:'착시 정렬',tele:'어긋난 길이 맞는 순간 탭',coach:'두 길이 겹치는 순간에 탭',cause:{pit:'어긋난 길에서 떨어졌어요'}},
   {kind:'rotate',name:'도시 회전',tele:'도시가 돌아도 발밑이 바닥',coach:'돌아가는 동안은 길이 비어 있어',cause:{jump:'돌아간 도시의 블록에 부딪혔어요',duck:'돌아간 도시에 머리를 부딪혔어요',pit:'돌아간 도시의 틈에 빠졌어요'}}]},
 B04:{n:4,id:'B04',trip:'c4',name:'반사체',sub:'과거를 기억하는 거울',bpm:100,clear:'둘이 서로 절했어',win:'서로 한 번 절했어',
  phases:[
   {kind:'mirror',name:'거울',tele:'거울 속 내가 한 박자 늦게 따라 해',coach:'내 탭은 한 박자 뒤 거울에도 닿아',cause:{jump:'내가 블록에 부딪혔어요',tjump:'거울 속 내가 부딪혔어요'}},
   {kind:'ghost',name:'고스트',tele:'그림자는 과거의 내 입력이야. 따라 하지 마',coach:'그림자 말고 내 길만 봐',cause:{jump:'내 쪽 블록에 부딪혔어요'}},
   {kind:'coop',name:'함께 작동',tele:'그림자와 동시에 뛰어 발판을 눌러',coach:'그림자가 뛰는 곳에서 같이 뛰어',cause:{gate:'함께 누르지 못했어요',jump:'내 쪽 블록에 부딪혔어요'}}]},
 B05:{n:5,id:'B05',trip:'c5',name:'없는 출구',sub:'모든 길이 한 복도로',bpm:76,clear:'출구 표지판이 따라왔어',win:'복도가 끊어졌어',
  phases:[
   {kind:'diff',name:'다른 문 찾기',tele:'같은 문 중 하나만 달라',coach:'모양이 다른 문에서만 탭',cause:{door:'같은 문에서 눌렀어요',miss:'다른 문을 지나쳤어요',jump:'트렁크에 부딪혔어요'}},
   {kind:'invert',name:'표지 반전',tele:'표지판이 거짓말을 해',coach:'표지판 말고 앞의 장애물을 봐',cause:{jump:'바닥 블록에 부딪혔어요',duck:'천장 블록에 머리를 부딪혔어요',lie:'표지판을 믿었어요'}},
   {kind:'stop',name:'멈춤',tele:'이번엔 아무것도 누르지 마',coach:'멈추면 화면에서 손을 떼',cause:{hold:'멈춰야 할 때 눌렀어요',jump:'트렁크에 부딪혔어요'}}]}
};
const BY_N=[null,'B01','B02','B03','B04','B05'];

/* ---------- pure seeded layouts ---------- */
/* ctx: {r rng, B, bpm, lead, first (earliest tap-free beat of the pattern), e (last beat), s (phase start beat), boss, rec (previous phase's tap offsets, units), rec2}. Elements carry tap=beat of the ideal tap when one is needed. */
const q4=v=>Math.round(v*4)/4;
const pick=(r,a)=>a[Math.floor(r()*a.length)];
const el=(k,m,o={})=>({k,m,at:m*B,...o});
const tapEl=(k,m,lead,o)=>el(k,m,{tap:q4(m-lead),...o});
function runOf(ctx,make,gaps,rehearseGap=4){
 const out=[];let m=ctx.first,i=0;
 while(m<=ctx.e-3){const e=make(m,i,out);if(!e)break;out.push(e);m=q4(m+(i===0?rehearseGap:pick(ctx.r,gaps)));i++}
 return out;
}
const GEN={
 /* B01 P1: the lit cube face tells what comes: floor face = block on the floor (jump), ceiling face = block on the ceiling (stay) */
 faces(ctx){
  let prev='',run=0;
  return runOf(ctx,(m,i)=>{
   let k=i===0?'jump':i===1?'duck':(ctx.r()<.5?'jump':'duck');
   if(k===prev&&run>=2)k=k==='jump'?'duck':'jump';
   run=k===prev?run+1:1;prev=k;
   return k==='jump'?tapEl('jump',m,ctx.lead,{h:ctx.r()<.45?22:14,face:1}):el('duck',m,{face:0});
  },[2,3,3,4],4);
 },
 /* link (B01 P2 bridge, B03 P2 illusion): a pit whose two halves slide into line on the tap beat */
 link(ctx){return runOf(ctx,(m)=>tapEl('pit',m,ctx.lead,{w:PIT,skin:ctx.skin,off:ctx.r()<.5?1:-1}),[3,3,4],4)},
 /* B01 P3: an apex gate needs the top of the jump (floor plate and ceiling plate meet); blocks from phase 1 keep you honest */
 open(ctx){
  let gates=0;
  return runOf(ctx,(m,i)=>{
   if(i>=2&&gates>=1&&ctx.r()<.3)return tapEl('jump',m,ctx.lead,{h:ctx.r()<.4?22:14,face:1});
   gates++;return tapEl('gate',m,ctx.lead,{need:.6,coop:false});
  },[3,3,4],4);
 },
 /* B02 P1: blocks whose size pulses; the size on arrival decides (tiny = just walk through) */
 scale(ctx){
  const sizes=['mid','big','tiny','mid','big','mid','tiny','mid'];
  return runOf(ctx,(m,i)=>{
   const sz=i===0?'mid':i===1?'big':i===2?'tiny':pick(ctx.r,sizes),h=sz==='big'?26:sz==='mid'?16:0;
   return h?tapEl('jump',m,ctx.lead,{h,size:sz,pulse:ctx.r()*TAU}):el('jump',m,{h:0,size:'tiny',pulse:ctx.r()*TAU});
  },[2,3,3,4],4);
 },
 /* B02 P2: the corridor morphs between pit and ceiling block; the final shape is outlined before the cells settle */
 morph(ctx){
  let prev='',run=0;
  return runOf(ctx,(m,i)=>{
   let k=i===0?'pit':i===1?'duck':(ctx.r()<.5?'pit':'duck');if(k===prev&&run>=2)k=k==='pit'?'duck':'pit';
   run=k===prev?run+1:1;prev=k;
   return k==='pit'?tapEl('pit',m,ctx.lead,{w:PIT,skin:'morph',off:0}):el('duck',m,{morph:true});
  },[3,3,4],4);
 },
 /* B02 P3: you are small now: little hops over key teeth, a dense row */
 hop(ctx){return runOf(ctx,(m)=>tapEl('jump',m,ctx.lead,{h:ctx.r()<.5?8:12,teeth:true}),[2,2,2.5,3],4)},
 /* B03 P1: the road folds at a corner; the fold is a gap */
 corner(ctx){
  let prev='';
  return runOf(ctx,(m,i)=>{
   const k=i===0?'pit':(prev==='pit'?'jump':ctx.r()<.55?'pit':'jump');prev=k;
   return k==='pit'?tapEl('pit',m,ctx.lead,{w:PIT,skin:'corner',off:0}):tapEl('jump',m,ctx.lead,{h:ctx.r()<.4?22:14,face:1});
  },[3,3,4],4);
 },
 /* B03 P3: the whole city turns over; no hazard comes while it turns */
 rotate(ctx){
  const out=[],rots=[],n=3,span=ctx.e-ctx.first;
  for(let i=0;i<n;i++)rots.push(Math.round(ctx.first+span*(.2+.27*i)));
  for(let i=0;i<n;i++)out.push(el('rot',rots[i],{ang:i===1?0:Math.PI,idx:i}));
  let m=ctx.first,i=0,prev='';
  while(m<=ctx.e-3){
   const near=rots.find(rm=>m>rm-3.2&&m<rm+3);if(near!==undefined){m=near+3.25;continue}
   const q=i===0?'jump':pick(ctx.r,['jump','duck','pit']),k=q===prev&&q!=='jump'?'jump':q;prev=k;
   out.push(k==='jump'?tapEl('jump',m,ctx.lead,{h:ctx.r()<.4?22:14,face:1}):k==='pit'?tapEl('pit',m,ctx.lead,{w:PIT,skin:'corner',off:0}):el('duck',m,{face:0}));
   m=q4(m+(i===0?4:pick(ctx.r,[3,3,4])));i++;
  }
  return out.sort((a,b)=>a.at-b.at);
 },
 /* B04 P1: the mirror twin repeats every tap one beat late: events 'both' / 'me' / 'twin' (as the mirror act) */
 mirror(ctx){
  const out=[],w={both:.35,me:.25,twin:.4};let m=ctx.first,k=0,twins=0;
  const pk=()=>{const x=ctx.r();let a=0;for(const key of ['both','me','twin']){a+=w[key];if(x<a)return key}return 'both'};
  while(m<=ctx.e-4){
   const kind=k===0?'both':k===1?'twin':pk();if(kind==='twin')twins++;const h=ctx.r()<.45?22:14;
   if(kind!=='twin')out.push(tapEl('jump',m,ctx.lead,{h,face:1,ev:k}));
   if(kind!=='me')out.push(el('tjump',m+1,{h,ev:k,...(kind==='twin'?{tap:q4(m-ctx.lead)}:{})}));
   m=q4(m+(k===0?4:pick(ctx.r,[2,3,3])));k++;
  }
  if(!twins){const last=out[out.length-1];if(last&&last.k==='jump'){last.k='tjump';last.at+=B;last.m+=1}}
  return out.sort((a,b)=>a.at-b.at);
 },
 /* B04 P2: your own blocks (seeded) plus the ghost lane: it replays the taps you made in phase 1 */
 ghost(ctx){
  const own=runOf(ctx,(m)=>tapEl('jump',m,ctx.lead,{h:ctx.r()<.45?22:14,face:1}),[3,3,4],4);
  const g=(ctx.rec||[]).filter(o=>o>=ctx.tel*B).map((o,i)=>el('gjump',(ctx.s*B+o)/B+ctx.lead,{h:14,gi:i}));
  return [...own,...g].sort((a,b)=>a.at-b.at);
 },
 /* B04 P3: the plates sit where the ghost (your phase-2 input) is at the top of its jump; press them together */
 coop(ctx){
  const out=[],taps=(ctx.rec||[]).filter(o=>o>=ctx.tel*B);
  taps.forEach((o,i)=>{const m=q4((ctx.s*B+o)/B+ctx.lead);if(m<=ctx.e-2)out.push(tapEl('gate',m,ctx.lead,{need:.5,coop:true,gi:i}))});
  return out;
 },
 /* B05 P1: rows of three identical doors; exactly one differs in shape; tap there and nowhere else */
 diff(ctx){
  const out=[];let m=ctx.first+1,row=0,lastOdd=-1;
  while(m+5<=ctx.e-2){
   let odd=Math.floor(ctx.r()*3);if(odd===lastOdd)odd=(odd+1)%3;lastOdd=odd;const feat=row%3;
   for(let d=0;d<3;d++)out.push(d===odd?tapEl('door',m+d*2,0,{odd:true,row,feat,hint:row===0,tap:m+d*2}):el('door',m+d*2,{odd:false,row,feat}));
   const cart=m+6.5;if(cart<=ctx.e-2.5&&row>0)out.push(tapEl('jump',cart,ctx.lead,{h:14,face:1,cart:true}));
   m=q4(m+(row===0?8:cart<=ctx.e-2.5&&row>0?9:7.5));row++;
  }
  return out;
 },
 /* B05 P2: every hazard carries a sign; after the first two (honest) ones the signs lie */
 invert(ctx){
  let prev='',run=0;
  return runOf(ctx,(m,i)=>{
   let k=i===0?'jump':i===1?'duck':(ctx.r()<.5?'jump':'duck');if(k===prev&&run>=2)k=k==='jump'?'duck':'jump';run=k===prev?run+1:1;prev=k;
   const lie=i>=2&&ctx.r()<.65;
   return k==='jump'?tapEl('jump',m,ctx.lead,{h:ctx.r()<.45?22:14,face:1,sign:true,lie}):el('duck',m,{face:0,sign:true,lie});
  },[2,3,3,4],4);
 },
 /* B05 P3: stand still: the car brakes in front of a door, holds a few beats, then goes on (as the wait act) */
 stop(ctx){
  const out=[];let m=ctx.first+1,k=0;const n=3;
  const cart=()=>{out.push(tapEl('jump',m,ctx.lead,{h:14,face:1,cart:true}));m=q4(m+3)};
  cart();
  for(let i=0;i<n&&m+9<=ctx.e;i++){
   m+=1;out.push(el('hold',m,{hold:pick(ctx.r,[3,4,4]),idx:i}));m+=3+pick(ctx.r,[2,3])+(k===0?1:0);k++;
   if(m<=ctx.e-3)cart();
  }
  return out;
 }
};
/* ideal recording of a phase: the offsets (units from the phase start) of its taps, used when no real input exists */
/* a recording thinned to taps 2.4+ beats apart (spam taps never become impossible plates) */
const thin=rec=>{const out=[];for(const o of rec||[])if(!out.length||o-out[out.length-1]>=2.4*B)out.push(o);return out};
const idealRec=(els,startU)=>els.filter(e=>e.tap!=null&&(e.k==='jump'||e.k==='pit'||e.k==='gate')).map(e=>Math.round(e.tap*B-startU));

function buildBoss(def,o={}){
 const bpm=Number(o.bpm)||def.bpm,seed=(o.seed??1)>>>0,speed=B*bpm/60,rec=o.rec||[],phases=[];
 const tb=Math.ceil(TEL*bpm/60)+1;let s=0;
 for(let p=0;p<3;p++){
  const P=def.phases[p],len=Math.round(SECS[p]*bpm/60),hop=P.kind==='hop',lead=(hop?SHOP_FL:FL)*bpm/120;
  const ctx={r:mulberry(seed^(0x51ED27*(p+1))),bpm,lead,s,e:s+len,tel:tb,first:s+tb+Math.ceil(lead),skin:P.skin,boss:def.id,rec:thin(p===1?rec[0]:p===2?rec[1]:null)};
  const els=GEN[P.kind](ctx);els.forEach((e,i)=>{e.ph=p;e.idx=i;e.done=false;e.res=false;e.absorbed=false});
  phases.push({p,kind:P.kind,sb:s,eb:s+len,start:s*B,end:(s+len)*B,tb,els,hop});s+=len;
 }
 const length=(s+3)*B,all=phases.flatMap(x=>x.els).sort((a,b)=>a.at-b.at),shardEls=all.filter(e=>e.tap!=null&&(e.k==='jump'||e.k==='pit'||e.k==='gate')&&e.idx%2===0&&!e.cart);
 return {id:def.id,bpm,speed,B,length,beats:s+3,phases,tb,shardTotal:shardEls.length,secs:length/speed+INTRO+CLEAR,rec,
  rebuildPhase(p,recIn){const P=def.phases[p],ph=phases[p];const ctx={r:mulberry(seed^(0x51ED27*(p+1))),bpm,lead:FL*bpm/120,s:ph.sb,e:ph.eb,tel:tb,first:ph.sb+tb+Math.ceil(FL*bpm/120),skin:P.skin,boss:def.id,rec:thin(recIn)};
   const els=GEN[P.kind](ctx);els.forEach((e,i)=>{e.ph=p;e.idx=i;e.done=false;e.res=false;e.absorbed=false});ph.els=els;return els}};
}
const flat=C=>C.phases.flatMap(x=>x.els).sort((a,b)=>a.at-b.at||a.idx-b.idx);

/* ---------- art: giant silhouettes built from rounded cells (FX20 reveal, FX21 clear) ---------- */
const PAL_FALLBACK={sky:['#07031a','#140a33','#2a1259'],fog:'#5b2bd6',block:['#2b1b5e','#170d3a','#0a0620'],rim:'#7b3cff',rim2:'#ff2e9a',glow:'#b46bff',accent:'#19e3ff',danger:'#ff4d5e',gold:'#ffe27a',aurora:'#4df5e0',ink:'#f3eaff'};
const palOf=key=>root.MongyuTrip?.get?.(key||'violet')||PAL_FALLBACK;
const NC=27;
const sqc=(x,y,s,t,r)=>({x,y,m:[s,0,0,s],t,r:r==null?.28:r,f:-1});
/* pad / cut to NC cells; extras are zero-size copies so a morph never has to create cells */
const fit=a=>{const o=a.slice(0,NC);for(let i=0;o.length<NC;i++){const b=a[i%a.length];o.push({...b,m:[.001,0,0,.001]})}return o};
const rowOf=(n,x0,dx,y,s,t,r)=>Array.from({length:n},(_,i)=>sqc(x0+i*dx,y,s,t,r));
function cubeCells(spread,liftL,liftR){
 const S=.66,ex=[.866*S,.5*S],ey=[-.866*S,.5*S],ez=[0,-S],k=1/3,e=.86*k,out=[];
 const P=(x,y,z)=>[x*ex[0]+y*ey[0]+z*ez[0],x*ex[1]+y*ey[1]+z*ez[1]];
 for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++){const p=P(a*k,.5+spread,c*k+liftL);out.push({x:p[0],y:p[1]+.15,m:[ex[0]*e,ex[1]*e,ez[0]*e,ez[1]*e],t:(a+c+2)%2?1:0,r:.24,f:1})}
 for(let b=-1;b<=1;b++)for(let c=-1;c<=1;c++){const p=P(.5+spread,b*k,c*k+liftR);out.push({x:p[0],y:p[1]+.15,m:[ey[0]*e,ey[1]*e,ez[0]*e,ez[1]*e],t:(b+c+2)%2?2:1,r:.24,f:2})}
 for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const p=P(a*k,b*k,.5+spread);out.push({x:p[0],y:p[1]+.15,m:[ex[0]*e,ex[1]*e,ey[0]*e,ey[1]*e],t:(a+b+2)%2?0:3,r:.24,f:0})}
 return out;
}
const KING1=[[-.5,-1.3,.3,3],[0,-1.42,.3,3],[.5,-1.3,.3,3],[-.34,-.88,.33,0],[0,-.88,.33,0],[.34,-.88,.33,0],[-.34,-.52,.33,0],[0,-.52,.33,0],[.34,-.52,.33,0],[-.17,-.7,.17,2],[.17,-.7,.17,2],
 [-.5,-.14,.33,1],[-.17,-.14,.33,1],[.17,-.14,.33,1],[.5,-.14,.33,1],[-.5,.22,.33,1],[-.17,.22,.33,1],[.17,.22,.33,1],[.5,.22,.33,1],[0,.04,.2,2],[-.88,0,.28,0],[.88,0,.28,0],[-.3,.64,.3,2],[.3,.64,.3,2]];
const KING2=[[-.4,-.66,.26,3],[0,-.74,.26,3],[.4,-.66,.26,3],[-.45,-.3,.36,0],[0,-.3,.36,0],[.45,-.3,.36,0],[-.45,.06,.36,0],[0,.06,.36,0],[.45,.06,.36,0],[1.05,.06,.16,3],[1.05,.36,.16,3],
 [-1.05,.42,.34,1],[-.72,.42,.34,1],[-.39,.42,.34,1],[-.06,.42,.34,1],[.27,.42,.34,1],[.6,.42,.34,1],[.93,.42,.34,1],[-.9,.06,.2,2],[-1.3,.1,.26,0],[1.45,.42,.26,0],[-.6,.84,.46,2,.5],[.7,.84,.46,2,.5],[-1.3,-.4,.2,3]];
const toCells=(a,sc=1,dx=0,dy=0)=>a.map(([x,y,s,t,r])=>sqc(x*sc+dx,y*sc+dy,s*sc,t,r));
const KING3=[...toCells(KING1.slice(0,11),.3,.2,.95),
 ...[[-1.25,-.35,.3,3],[-.9,-.7,.3,3],[-.55,-.35,.3,3],[-.9,.0,.3,3],[-.2,-.35,.26,1],[.15,-.35,.26,1],[.5,-.35,.26,1],[.85,-.35,.26,1],[1.2,-.35,.26,1],[.5,-.0,.26,2],[.85,-.0,.26,2],[1.2,-.0,.26,2],[1.2,.3,.26,2]].map(([x,y,s,t])=>sqc(x,y-.2,s,t))];
function cityCells(mode){
 const hs=[3,5,4,6,4,3],out=[];
 hs.forEach((n,c)=>{for(let r=0;r<n;r++){
  const x=-1.25+c*.5,yb=.78,sh=mode===1?(c%2?-.3:.3):0,sx=mode===2?.82:1;
  out.push(sqc(x*sx,(yb-r*.46*(mode===2?.82:1))+sh,.42,r===n-1?2:(c+r)%2?0:1,.2));
 }});
 out.push(sqc(-.25*(mode===2?.82:1),-1.72+(mode===2?.4:0)+(mode===1?-.3:0),.16,3,.5),sqc(.25*(mode===2?.82:1),-1.72+(mode===2?.4:0),.12,3,.5));
 return out;
}
function mirrorCells(mode){
 const out=[];
 for(let i=0;i<5;i++)out.push(sqc(-.9+i*.45,-1.25,.34,1));
 for(let i=0;i<5;i++)out.push(sqc(-.9+i*.45,.8,.34,1));
 for(const sx of [-1,1])for(let i=0;i<3;i++)out.push(sqc(sx*1.12,-.72+i*.5,.34,1));
 const fig=(dx,dy,fl,s)=>[[0,-.62,.3,2,.5],[0,-.26,.3,2],[0,.08,.3,2],[-.17,.46,.26,2],[.17,.46,.26,2],[-.42,-.2,.24,2],[.42,-.2,.24,2],[0,-.62-.38,.001,2]].slice(0,7).map(([x,y,z,t,r])=>sqc(x*s*(fl?-1:1)+dx,y*s*(fl?-1:1)+dy,z*s,t,r));
 if(mode===0)out.push(...fig(0,-.3,false,.9),sqc(1.35,-1.25,.14,3,.5));
 else if(mode===1)out.push(...fig(-.3,.0,false,1),...[0,1].map(i=>sqc(.45+i*.3,.1,.16-i*.05,3,.5)),sqc(1.35,-1.25,.14,3,.5));
 else out.push(...fig(-.45,.05,false,.82),...fig(.45,.05,true,.82).map(c=>({...c,m:[c.m[0],c.m[1],c.m[2],-c.m[3]]})),sqc(0,-.9,.18,3,.5));
 return out;
}
function exitCells(mode){
 const out=[];
 const ring=(hw,hh,n,sz,t)=>{const o=[];for(let i=0;i<n.x;i++)o.push(sqc(-hw+i*(2*hw/(n.x-1)),-hh,sz,t),sqc(-hw+i*(2*hw/(n.x-1)),hh,sz,t));for(let j=1;j<n.y-1;j++)for(const s of [-1,1])o.push(sqc(s*hw,-hh+j*(2*hh/(n.y-1)),sz,t));return o};
 out.push(...ring(1,1.3,{x:4,y:4},.34,1),...ring(.62,.85,{x:3,y:3},.28,0));
 out.push(sqc(-.15,-.3,.3,3),sqc(.15,-.3,.3,3),sqc(-.15,-.02,.3,3),sqc(.15,-.02,.3,3));
 const up=mode!==1;out.push(sqc(0,up?.3:.62,.22,2),sqc(-.26,up?.6:.32,.22,2),sqc(.26,up?.6:.32,.22,2));
 return out;
}
const LAYOUT={
 B01:[fit(cubeCells(0,0,0)),fit(cubeCells(0,.22,-.2)),fit(cubeCells(.34,0,0))],
 B02:[fit(toCells(KING1)),fit(toCells(KING2)),fit(KING3)],
 B03:[fit(cityCells(0)),fit(cityCells(1)),fit(cityCells(2))],
 B04:[fit(mirrorCells(0)),fit(mirrorCells(1)),fit(mirrorCells(2))],
 B05:[fit(exitCells(0)),fit(exitCells(1)),fit(exitCells(2).map(c=>({...c,x:c.x*.4+.5,y:c.y*.4+.7,m:c.m.map(v=>v*.4)})))]
};
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
const tonesOf=P=>[P.block[0],P.block[1],P.block[2],P.accent];
const TOP={};
/* highest cell edge over all three layouts of a boss (units), so no silhouette ever covers the phase pips */
function topOf(id){if(TOP[id]!==undefined)return TOP[id];let m=0;for(const L of LAYOUT[id]||[])for(const c of L){if(c.m[0]*c.m[0]+c.m[1]*c.m[1]<1e-5)continue;m=Math.min(m,c.y-(Math.abs(c.m[1])+Math.abs(c.m[3]))/2-.05)}return TOP[id]=m}
/* silhouette: cells lerped between the phase layouts; reveal scatters them in, clear shrinks them into props on the floor */
function drawSilhouette(c,run,w,h,sc,t,reduced,P,yF){
 const L=LAYOUT[run.bossId]||LAYOUT.B01,ph=run.ph,tele=run.tele,cx=w/2,U=Math.min(h*.093,w*.245),cy=Math.max(h*.352,h*.232-topOf(run.bossId)*U),tones=tonesOf(P);
 const k=tele&&ph>0?ease(clamp(tele.age/(TEL*.7),0,1)):1,from=L[Math.max(0,ph-(tele&&ph>0?1:0))],to=L[ph];
 const intro=run.stage==='intro'?clamp(run.introAge/INTRO,0,1):1,fin=run.finishing?clamp(run.finishing.age/run.finishing.dur,0,1):0,lean=reduced?0:Math.sin(Math.min(1,fin*2.2)*Math.PI)*.22*(run.bossId==='B01'?1:.5);
 const beatP=reduced?0:Math.sin(((t*run.bpm/60)%1)*TAU),pulse=run.bossId==='B02'&&ph===0&&!reduced?1+.12*Math.sin(t*run.bpm/60*Math.PI/2):1,bob=reduced?0:Math.sin(t*1.3)*.04;
 const ink=P.rim;
 c.save();c.translate(cx,cy+bob*U);if(lean)c.rotate(lean*(Math.sin(t*3)>0?1:-1)*.6);
 for(let i=0;i<NC;i++){
  const a=from[i],b=to[i];let x=a.x+(b.x-a.x)*k,y=a.y+(b.y-a.y)*k,m=[0,1,2,3].map(j=>a.m[j]+(b.m[j]-a.m[j])*k),sz=1;
  // reveal: cells fly in from scattered spots, staggered
  if(intro<1&&!reduced){const d=clamp((intro*1.35-(i/NC)*.35)/.65,0,1),e=1-ease(d);x+=(hash(i,3)-.5)*5*e;y+=(hash(i,5)-.5)*5*e-e*1.5;sz=.2+.8*d}
  x*=pulse;y*=pulse;
  let px=x*U,py=y*U;
  if(fin>0){
   const d=ease(clamp((fin*1.25-(i/NC)*.25),0,1)),tx=(w*.62-cx)+((i%9)-4)*20*sc,ty=(yF-9*sc-Math.floor(i/9)*19*sc)-(cy+bob*U);
   px+=(tx-px)*d;py+=(ty-py)*d;sz*=1-.62*d;
  }
  const sx=U*(pulse>1?1:1)*sz;
  if(m[0]*m[0]+m[1]*m[1]<1e-5)continue;
  c.save();c.translate(px,py);c.transform(m[0]*sx,m[1]*sx,m[2]*sx,m[3]*sx,0,0);
  rr(c,-.5,-.5,1,1,Math.max(.05,a.r*.5));
  c.globalAlpha=run.bossId==='B04'&&ph===0&&i>=16&&py>U*.3?.55:1;
  c.fillStyle=tones[(b.t|0)%4];c.fill();
  c.lineWidth=1.6/Math.max(8,sx*Math.hypot(m[0],m[1]));c.strokeStyle=ink;c.globalAlpha*=.75;c.stroke();
  c.restore();
 }
 // face highlight (cube): the lit face is the rule of the next block; shape cue = thick rim around that face
 if(run.bossId==='B01'&&run.stage==='run'&&!fin&&ph!==2){
  const next=run.el.slice(run.ei).find(e=>e.k==='jump'||e.k==='duck'||e.k==='pit'),f=ph===0?(next&&next.k==='duck'?0:2):1;
  const S=.66,e1=[.866*S,.5*S],e2=[-.866*S,.5*S],e3=[0,-S],Q=(x,y,z)=>[(x*e1[0]+y*e2[0]+z*e3[0])*U,(x*e1[1]+y*e2[1]+z*e3[1]+.15)*U];
  const quad=f===0?[Q(-.5,-.5,.5),Q(.5,-.5,.5),Q(.5,.5,.5),Q(-.5,.5,.5)]:f===1?[Q(-.5,.5,-.5),Q(.5,.5,-.5),Q(.5,.5,.5),Q(-.5,.5,.5)]:[Q(.5,-.5,-.5),Q(.5,.5,-.5),Q(.5,.5,.5),Q(.5,-.5,.5)];
  c.save();c.lineJoin='round';c.lineWidth=4;c.strokeStyle=P.rim;c.globalAlpha=.9;c.beginPath();quad.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.stroke();c.restore();
 }
 c.restore();
 return U;
}

/* ---------- art: outline glyphs (shape cue of every phase, readable without colour or sound) ---------- */
function glyph(c,kind,cx,cy,col){
 c.save();c.translate(cx,cy);c.strokeStyle=col;c.fillStyle=col;c.lineWidth=2.4;c.lineJoin='round';c.lineCap='round';
 const L=(...p)=>{c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);c.stroke()};
 const R=(x,y,w,h,r=3)=>{rr(c,x,y,w,h,r);c.stroke()};
 switch(kind){
  case 'faces':R(-11,-11,22,22);L(-11,-3,11,-3);c.lineWidth=4.4;L(-8,11,8,11);break;
  case 'link':R(-13,-8,12,6,2);R(1,2,12,6,2);c.setLineDash([2,3]);c.lineWidth=1.6;L(-1,-2,1,2);c.setLineDash([]);L(-6,10,0,6,6,10);break;
  case 'open':R(-11,-13,22,5,2);R(-11,8,22,5,2);c.setLineDash([2,3]);L(0,-7,0,7);c.setLineDash([]);L(-4,-3,0,-7,4,-3);L(-4,3,0,7,4,3);break;
  case 'scale':R(-12,-12,24,24,4);R(-5,-5,10,10,2);L(2,2,10,10);L(10,5,10,10,5,10);break;
  case 'morph':R(-13,-6,12,12,2);c.beginPath();c.arc(7,0,6.5,0,TAU);c.stroke();L(-1,0,2,0);break;
  case 'hop':c.beginPath();c.arc(-6,0,6,0,TAU);c.stroke();L(0,0,13,0);L(8,0,8,6);L(12,0,12,5);break;
  case 'corner':L(-12,10,-2,10,-2,-2,12,-2);L(-8,-8,-2,-2);L(-2,-2,-2,-8);break;
  case 'rotate':c.beginPath();c.arc(0,0,10,-.5,TAU*.72);c.stroke();L(7,-13,10,-8,4,-7);break;
  case 'mirror':R(-9,-13,18,9,2);L(-13,0,13,0);c.globalAlpha=.55;R(-9,4,18,9,2);break;
  case 'ghost':R(-3,-8,15,16,3);c.setLineDash([3,3]);R(-13,-8,15,16,3);c.setLineDash([]);break;
  case 'coop':R(-13,-7,13,14,3);R(0,-7,13,14,3);L(-4,0,4,0);break;
  case 'diff':R(-14,-7,8,14,2);c.beginPath();c.arc(0,0,5,0,TAU);c.stroke();R(6,-7,8,14,2);break;
  case 'invert':L(-7,8,-7,-8);L(-11,-4,-7,-8,-3,-4);L(7,-8,7,8);L(3,4,7,8,11,4);break;
  case 'stop':R(-10,-10,20,20,4);L(-4,-5,-4,5);L(4,-5,4,5);break;
  case 'x':R(-11,-11,22,22,5);L(-5,-5,5,5);L(5,-5,-5,5);break;
  case 'ok':R(-11,-11,22,22,5);L(-6,0,-2,5,6,-5);break;
  default:R(-10,-10,20,20,4);
 }
 c.restore();
}
function banner(c,w,y,P,kind,title,text,alpha,prog,tone){
 const bw=Math.min(w-28,344),bh=60,x=w/2-bw/2;
 c.save();c.globalAlpha=alpha;rr(c,x,y-bh/2,bw,bh,16);c.fillStyle='rgba(30,22,44,.84)';c.fill();c.lineWidth=2;c.strokeStyle=tone||P.accent;c.stroke();
 rr(c,x+9,y-22,44,44,11);c.fillStyle='#fbf4ea';c.fill();glyph(c,kind,x+31,y,'#2a2434');
 c.textAlign='left';c.fillStyle='#fff6e6';c.font='800 15px system-ui,sans-serif';c.fillText(title,x+64,y-6,bw-76);
 c.fillStyle='rgba(255,240,226,.88)';c.font='600 12px system-ui,sans-serif';c.fillText(text,x+64,y+14,bw-76);
 if(prog!=null){c.fillStyle='rgba(255,255,255,.22)';c.fillRect(x+16,y+bh/2-5,bw-32,3);c.fillStyle=tone||P.accent;c.fillRect(x+16,y+bh/2-5,(bw-32)*clamp(prog,0,1),3)}
 c.restore();
}
/* ---------- art: the corridor ---------- */
function hazard(c,cx,base,wd,hh,dir,P,k,absorbed){
 const x0=cx-wd/2,top=base+dir*hh;
 c.fillStyle=k.side;c.fillRect(x0+3,Math.min(base,top)-(dir<0?3:0),wd,hh+3);
 c.fillStyle=absorbed?'#b8c4d0':k.d;c.fillRect(x0,Math.min(base,top),wd,hh);
 c.fillStyle=k.top;c.fillRect(x0,dir<0?top:top-3.2,wd,3.2);
 c.strokeStyle=P.rim;c.globalAlpha=.8;c.lineWidth=1.4;c.strokeRect(x0+.5,Math.min(base,top)+.5,wd-1,hh-1);c.globalAlpha=1;
}
const dangerInk=P=>{const cvd=cvdOn();return {d:cvd?'#7f8cff':P.danger,top:cvd?'#b5bcff':mixc(P.danger,'#ffffff',.45),side:cvd?'#4b55c4':mixc(P.danger,'#000000',.5)}};
function drawBoss(c,run,opts){
 const {width:w,height:h}=opts.viewport,reduced=!!opts.reduced,t=run.clock,C=run.course,D=run.def,MI=items(),P=palOf(run.trip),k=dangerInk(P),light=!!P.light||lum(P.sky[1])>.5,MODE=light?'source-over':'lighter';
 const sc=clamp(Math.min(w/300,h/560),.8,1.7),b04=run.bossId==='B04',yM=h*.6,bd=8*sc,yF=b04?yM-bd:h*.64,y1=yM+bd,px=w*.28,X=wx=>px+(wx-run.x)*sc;
 const beatP=reduced?0:.5+.5*Math.cos(((t*run.bpm/60)%1)*TAU),intro=run.stage==='intro',fin=run.finishing?run.finishing.age/run.finishing.dur:0;
 // ---- the scene (rotated as a whole when the city turns over)
 c.save();
 if(run.rot&&!reduced){c.translate(w/2,h*.5);c.rotate(run.rot);c.translate(-w/2,-h*.5)}
 const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,P.sky[0]);g.addColorStop(.5,P.sky[1]);g.addColorStop(1,P.sky[2]);c.fillStyle=g;c.fillRect(0,0,w,h);
 drawSilhouette(c,run,w,h,sc,t,reduced,P,yF);
 // ceiling beam, wall panels (repeat every 150 units, half speed) and floor
 const yC=yF-140*sc;
 {const per=150*sc,off=((run.x*.5*sc)%per+per)%per;for(let x=-off-per;x<w+per;x+=per){rr(c,x+per*.18,yC+16*sc,per*.5,(yF-yC)-26*sc,8*sc);c.fillStyle=P.block[0];c.globalAlpha=.5;c.fill();c.strokeStyle=P.rim;c.globalAlpha=.16;c.lineWidth=1.4;c.stroke();c.globalAlpha=1}}
 c.fillStyle=P.block[1];c.globalAlpha=.9;c.fillRect(0,yC,w,7*sc);c.globalAlpha=1;c.fillStyle=P.rim;c.globalAlpha=.55;c.fillRect(0,yC+7*sc,w,1.4);c.globalAlpha=1;
 c.fillStyle=P.block[2];c.globalAlpha=.92;c.fillRect(0,yF,w,h-yF);c.globalAlpha=1;c.fillStyle=P.block[1];c.fillRect(0,yF,w,9*sc);
 if(!b04){const rows=3;for(let r=0;r<rows;r++){const tw=46*sc,per=58*sc,off=((run.x*(.95-r*.22)*sc+(r%2)*per/2)%per+per)%per,ty=yF+(18+r*28)*sc;for(let x=-off-per;x<w+per;x+=per){rr(c,x,ty,tw*(1-r*.08),17*sc,5*sc);c.fillStyle=P.block[1];c.globalAlpha=.34-r*.06;c.fill();c.strokeStyle=P.rim;c.globalAlpha=.13;c.lineWidth=1.2;c.stroke();c.globalAlpha=1}}}
 if(b04){c.fillStyle=P.sky[0];c.globalAlpha=.62;c.fillRect(0,yM,w,h-yM);c.globalAlpha=1;const band=c.createLinearGradient(0,yF,0,y1);band.addColorStop(0,P.block[0]);band.addColorStop(.5,P.accent+'aa');band.addColorStop(1,P.block[0]);c.fillStyle=band;c.fillRect(0,yF,w,y1-yF)}
 c.strokeStyle=P.rim;c.globalAlpha=.9;c.lineWidth=1.8;c.beginPath();c.moveTo(0,yF);c.lineTo(w,yF);c.stroke();c.globalAlpha=1;
 c.fillStyle=P.rim2;{const first=Math.floor((run.x-px/sc)/B)*B;for(let wx=first;X(wx)<w+B;wx+=B){const s=(2.6+1.2*beatP)*sc;c.globalAlpha=(wx/B)%4===0?.7:.35;c.fillRect(X(wx)-s/2,yF+14*sc-s/2,s,s)}c.globalAlpha=1}
 const ph=1+.05*(beatP*2-1),pur=run.x;
 // ---- elements
 if(!intro)for(const e of run.el){
  const sx=X(e.at);if(sx<-70)continue;if(sx>w+70)break;
  const ahead=(e.at-pur)/B;
  switch(e.k){
   case 'jump':{
    let hh=e.h;
    if(e.size){const s=clamp((e.at-pur)/(B*1.7),0,1),osc=reduced?0:Math.sin(t*run.bpm/60*Math.PI+e.pulse)*.35;hh=(e.size==='tiny'?5:e.h)*(1+osc*s);
     if(e.size!=='tiny'){c.save();c.setLineDash([4,3]);c.strokeStyle=P.rim;c.lineWidth=1.4;c.globalAlpha=.8;c.strokeRect(sx-15*sc+.5,yF-e.h*sc+.5,30*sc,e.h*sc);c.restore()}else{c.save();c.setLineDash([4,3]);c.strokeStyle=P.rim;c.lineWidth=1.4;c.strokeRect(sx-15*sc+.5,yF-6*sc,30*sc,6*sc);c.restore()}}
    hazard(c,sx,yF,(e.teeth?18:30)*sc,hh*sc*(reduced?1:ph),-1,P,k,e.absorbed);
    if(e.teeth){c.fillStyle=k.top;c.fillRect(sx-9*sc,yF-hh*sc-5*sc,5*sc,5*sc);c.fillRect(sx+2*sc,yF-hh*sc-5*sc,5*sc,5*sc)}
    if(e.sign)sign(c,sx-1.15*B*sc,yC+8*sc,e,ahead,P,t,sc,reduced);
    break}
   case 'duck':{
    const s=e.morph?clamp((3-ahead)/1.5,0,1):1,bottom=yF-58*sc,top=yC+7*sc,len=(bottom-top)*s;
    if(e.morph&&s<1){for(let i=0;i<4;i++){const q=reduced?0:Math.sin(t*2+i*1.7+e.idx)*3*sc;rr(c,sx-14*sc+i*8*sc,top+4*sc+q,7*sc,7*sc,2);c.fillStyle=P.block[i%3];c.fill();c.strokeStyle=P.rim;c.lineWidth=1.2;c.stroke()}
     c.save();c.setLineDash([4,3]);c.strokeStyle=P.rim;c.lineWidth=1.4;c.strokeRect(sx-15*sc+.5,top+.5,30*sc,bottom-top);c.restore()}
    if(len>2)hazard(c,sx,top,30*sc,len,1,P,k,e.absorbed);
    if(s>=1){c.fillStyle=k.top;for(let i=0;i<3;i++){const tx=sx-12*sc+i*12*sc;c.beginPath();c.moveTo(tx-4*sc,bottom);c.lineTo(tx+4*sc,bottom);c.lineTo(tx,bottom+7*sc);c.closePath();c.fill()}}
    if(e.sign)sign(c,sx-1.15*B*sc,yC+8*sc,e,ahead,P,t,sc,reduced);
    break}
   case 'pit':drawPit(c,e,sx,yF,sc,P,run,t,reduced,ahead,k);break;
   case 'gate':drawGate(c,e,sx,yF,yC,sc,P,run,t,reduced,b04?y1:null,MODE);break;
   case 'tjump':hazard(c,sx,y1,30*sc,e.h*sc*(reduced?1:ph),1,P,k,e.absorbed);break;
   case 'gjump':c.save();c.setLineDash([3,3]);c.strokeStyle=P.rim;c.lineWidth=1.6;c.globalAlpha=.8;c.strokeRect(sx-15*sc+.5,y1+.5,30*sc,e.h*sc);c.restore();break;
   case 'door':drawDoor(c,e,sx,yF,sc,P,t,reduced);break;
   case 'hold':drawHold(c,e,run,sx,yF,yC,sc,P);break;
   case 'rot':{c.save();c.setLineDash([5,4]);c.strokeStyle=P.rim;c.lineWidth=1.6;c.globalAlpha=.75;c.beginPath();c.moveTo(sx,yC+8*sc);c.lineTo(sx,yF);c.stroke();c.restore();glyph(c,'rotate',sx,yF-92*sc,P.rim);break}
  }
 }
 // gate-less end line
 {const gx=X(C.length-B);if(!intro&&gx<w+40&&gx>-40){c.save();c.setLineDash([6,4]);c.strokeStyle=P.aurora;c.lineWidth=2;c.beginPath();c.moveTo(gx,yC+8*sc);c.lineTo(gx,yF);c.stroke();c.restore()}}
 // shards
 const dia=(x,y,r,rot,fill)=>{c.save();c.translate(x,y);c.rotate(rot);c.fillStyle=fill;c.fillRect(-r,-r,r*2,r*2);c.restore()};
 if(!intro)for(const sh of run.shardList){if(sh.got)continue;const sx=X(sh.e.at);if(sx<-20||sx>w+20)continue;const sy=yF-((run.hop?HOP:PEAK)+8)*sc;
  c.save();c.globalCompositeOperation=MODE;c.globalAlpha=.3;dia(sx,sy,9*sc,Math.PI/4,P.gold);c.restore();
  if(!(MI&&MI.drawLight(c,sx,sy,26*sc,t,sh.e.idx,reduced,0)))dia(sx,sy,4.2*sc,Math.PI/4+(reduced?0:t*1.6),P.gold)}
 if(MI&&run.itemList&&run.itemList.length&&!intro)MI.drawItems(c,run,it=>{const sx=X(it.at);if(sx<-30||sx>w+30)return null;return {x:sx,y:yF-(it.lane==='hi'?PEAK*.62+10:15)*sc,s:sc}},t,reduced,0);
 // twin / ghost
 if(b04&&!intro){
  const ghost=run.def.phases[run.ph].kind!=='mirror',tfp=run.tfly===null?0:run.tfly/run.tfl,cr=run.crash;
  c.save();c.globalAlpha=ghost?.5:.82;
  if(root.MongyuMobile?.sprite)root.MongyuMobile.sprite(c,{x:px,y:y1+run.theight*sc,bodyHeight:PEAK*sc*1.05,renderAngle:Math.PI,strideDistance:run.x,nativeState:0,height:run.theight>.05?1:0,jumpProgress:tfp,pose:cr&&cr.kind==='twin'?'hurt':run.tfly!==null?'jump':'run'},{poseTime:t,onDark:true},reduced);
  else{c.fillStyle='#fff3e0';c.fillRect(px-5,y1+run.theight*sc,10,PEAK*sc)}
  c.restore();
  if(ghost){c.save();c.setLineDash([4,4]);c.strokeStyle=P.rim;c.lineWidth=1.6;c.globalAlpha=.8;rr(c,px-17*sc,y1+run.theight*sc,34*sc,PEAK*sc*1.1,8);c.stroke();c.restore()}
 }
 // the runner
 const cr=run.crash,hold=run.inZone()&&run.zone.phase==='hold',stand=intro||!!run.finishing||hold;
 if(root.MongyuMobile?.sprite)root.MongyuMobile.sprite(c,{x:px,y:yF-run.height*sc,bodyHeight:PEAK*sc*1.12,renderAngle:0,strideDistance:run.x,nativeState:0,height:run.height,jumpProgress:run.fly===null?0:run.fly/run.fl,pose:cr?'hurt':stand?'stand':run.fly!==null?'jump':'run'},{poseTime:t,onDark:true},reduced);
 else{c.fillStyle='#fff3e0';c.fillRect(px-5,yF-run.height*sc-PEAK*sc,10,PEAK*sc)}
 if(MI&&run.mods)MI.drawAura(c,run,px,yF-(run.height+22)*sc,PEAK*sc*.7,t,reduced);
 if(run.time-run.pickedAt<.4){const a=(run.time-run.pickedAt)/.4;c.save();c.globalCompositeOperation=MODE;c.globalAlpha=(1-a)*.7;c.strokeStyle=P.gold;c.lineWidth=2;c.beginPath();c.arc(px,yF-30*sc,(10+a*34)*sc,0,TAU);c.stroke();c.restore()}
 c.restore();
 overlay(c,run,w,h,P,reduced,t,sc);
 return null;
}
function sign(c,sx,y,e,ahead,P,t,sc,reduced){
 if(sx<-40)return;
 const flipK=e.lie?clamp((3.4-ahead)/1.2,0,1):0,says=e.k==='jump'?1:-1;
 const dir=reduced?(flipK>=1?-says:says):(flipK>.5?-says:says),bw=34*sc,bh=26*sc;
 c.save();c.translate(sx,y+bh/2+4*sc);
 if(!reduced&&flipK>0&&flipK<1)c.scale(1,Math.max(.12,Math.abs(Math.cos(flipK*Math.PI))));
 c.strokeStyle=P.rim;c.lineWidth=1.6;c.beginPath();c.moveTo(0,-bh/2-4*sc);c.lineTo(0,-bh/2);c.stroke();
 rr(c,-bw/2,-bh/2,bw,bh,5);c.fillStyle='#fbf4ea';c.fill();c.stroke();
 c.fillStyle=P.rim;c.beginPath();if(dir>0){c.moveTo(0,-8*sc);c.lineTo(8*sc,4*sc);c.lineTo(-8*sc,4*sc)}else{c.moveTo(0,8*sc);c.lineTo(8*sc,-4*sc);c.lineTo(-8*sc,-4*sc)}c.closePath();c.fill();
 if(e.lie&&flipK>=1){c.lineWidth=1.8;c.beginPath();c.moveTo(-bw/2+3,bh/2-3);c.lineTo(bw/2-3,-bh/2+3);c.stroke()}
 c.restore();
}
function drawPit(c,e,sx,yF,sc,P,run,t,reduced,ahead,k){
 const hw=e.w/2*sc,depth=46*sc;
 if(e.skin==='morph'&&ahead>3){
  c.save();c.setLineDash([4,3]);c.strokeStyle=P.rim;c.lineWidth=1.4;c.strokeRect(sx-hw+.5,yF+.5,hw*2,depth);c.restore();
  for(let i=0;i<4;i++){const q=reduced?0:Math.sin(t*2+i*1.9+e.idx)*3*sc;rr(c,sx-14*sc+i*8*sc,yF-12*sc+q,7*sc,7*sc,2);c.fillStyle=P.block[i%3];c.fill();c.strokeStyle=P.rim;c.lineWidth=1.2;c.stroke()}
  return;
 }
 const linked=e.done||e.res&&e.absorbed;
 {const pg=c.createLinearGradient(0,yF,0,yF+depth);pg.addColorStop(0,'rgba(30,24,44,.9)');pg.addColorStop(1,'rgba(30,24,44,.35)');c.fillStyle=pg;c.fillRect(sx-hw,yF,hw*2,depth);
  c.strokeStyle=P.rim;c.lineWidth=1.6;c.globalAlpha=.8;c.beginPath();c.moveTo(sx-hw,yF);c.lineTo(sx-hw,yF+depth);c.moveTo(sx+hw,yF);c.lineTo(sx+hw,yF+depth);c.stroke();
  c.save();c.beginPath();c.rect(sx-hw,yF,hw*2,depth);c.clip();c.globalAlpha=.25;c.lineWidth=1.2;for(let i=-2;i<=6;i++){c.beginPath();c.moveTo(sx-hw+i*14*sc,yF);c.lineTo(sx-hw+i*14*sc-18*sc,yF+depth);c.stroke()}c.restore();c.globalAlpha=1}
 if(e.skin==='bridge'||e.skin==='illusion'){
  const tb=run.x/B-e.tap,a=linked||tb>0.35?0:clamp(Math.abs(tb)/1.2,0,1),dy=(e.off||1)*a*22*sc,th=8*sc,pw=hw+26*sc;
  const plate=(x0,dyy,skew)=>{c.save();c.translate(x0,yF-dyy);c.transform(1,0,skew,1,0,0);rr(c,0,-th,pw*.9,th,3);c.fillStyle=P.block[0];c.fill();c.strokeStyle=P.rim;c.lineWidth=1.8;c.stroke();c.restore()};
  const sk=e.skin==='illusion'?a*.9*(e.off||1):0;
  plate(sx-hw-26*sc+(linked?0:0),dy,sk);plate(sx+hw*.1-(a?0:0),-dy,-sk);
  if(linked||a===0){rr(c,sx-hw,yF-th,hw*2,th,3);c.fillStyle=P.block[0];c.fill();c.strokeStyle=P.rim;c.lineWidth=1.8;c.stroke()}
  if(a<.18&&!linked){c.save();c.strokeStyle=P.aurora;c.lineWidth=2.4;c.beginPath();c.moveTo(sx-hw*.5,yF-th-6*sc);c.lineTo(sx,yF-th-12*sc);c.lineTo(sx+hw*.5,yF-th-6*sc);c.stroke();c.restore()}
 }else if(e.skin==='corner'){
  c.save();c.strokeStyle=P.block[0];c.lineWidth=2;c.beginPath();c.moveTo(sx-hw,yF+depth);c.lineTo(sx+hw,yF);c.stroke();c.restore();
  c.save();c.strokeStyle=P.rim;c.lineWidth=2.4;c.lineJoin='round';c.beginPath();c.moveTo(sx-10*sc,yF-26*sc);c.lineTo(sx-10*sc,yF-12*sc);c.lineTo(sx+10*sc,yF-12*sc);c.stroke();c.restore();
 }
}
function drawGate(c,e,sx,yF,yC,sc,P,run,t,reduced,y1,MODE){
 const ceil=(e.coop?71:78)*sc,open=e.done,col=open?P.gold:P.accent;
 const plate=(y,up)=>{rr(c,sx-16*sc,y-(up?3*sc:0),32*sc,6*sc,3);c.fillStyle=col;c.fill();c.strokeStyle=P.rim;c.lineWidth=1.6;c.stroke()};
 plate(yF-3*sc,false);plate(yF-ceil,true);
 c.save();c.strokeStyle=P.rim;c.lineWidth=1.6;c.beginPath();c.moveTo(sx,yC+7*sc);c.lineTo(sx,yF-ceil-3*sc);c.stroke();c.restore();
 c.save();c.setLineDash([3,4]);c.strokeStyle=P.rim;c.lineWidth=1.6;c.globalAlpha=open?.3:.9;c.beginPath();c.moveTo(sx,yF-9*sc);c.lineTo(sx,yF-ceil+6*sc);c.stroke();c.restore();
 if(!open){c.save();c.strokeStyle=P.rim;c.lineWidth=1.8;c.beginPath();c.moveTo(sx-5*sc,yF-ceil+12*sc);c.lineTo(sx,yF-ceil+6*sc);c.lineTo(sx+5*sc,yF-ceil+12*sc);c.moveTo(sx-5*sc,yF-12*sc);c.lineTo(sx,yF-6*sc);c.lineTo(sx+5*sc,yF-12*sc);c.stroke();c.restore()}
 else{c.save();c.globalCompositeOperation=MODE;c.globalAlpha=.5;c.strokeStyle=P.gold;c.lineWidth=2;c.beginPath();c.arc(sx,yF-ceil/2,(12+(run.time-(e.openAt||0))*60)*sc,0,TAU);c.stroke();c.restore()}
 if(e.coop&&y1!=null){c.save();c.scale(1,1);rr(c,sx-16*sc,y1-0,32*sc,6*sc,3);c.fillStyle=col;c.fill();c.strokeStyle=P.rim;c.lineWidth=1.6;c.stroke();c.restore()}
}
function drawDoor(c,e,sx,yF,sc,P,t,reduced){
 const dw=36*sc,dh=76*sc,x0=sx-dw/2,top=yF-dh,odd=e.odd;
 c.save();c.fillStyle=P.block[0];c.strokeStyle=P.rim;c.lineWidth=2;
 if(odd&&e.feat===0){c.beginPath();c.moveTo(x0,yF);c.lineTo(x0,top+dw/2);c.arc(sx,top+dw/2,dw/2,Math.PI,0);c.lineTo(x0+dw,yF);c.closePath()}else if(odd&&e.feat===2){rr(c,x0-8*sc,top+10*sc,dw+16*sc,dh-10*sc,4)}else rr(c,x0,top,dw,dh,4);
 c.fill();c.stroke();
 if(odd&&e.feat===1){c.beginPath();c.arc(sx,top+20*sc,8*sc,0,TAU);c.fillStyle=P.sky[0];c.fill();c.stroke()}
 c.fillStyle=P.rim;c.fillRect(x0+dw*.72,yF-dh*.45,4*sc,4*sc);
 c.restore();
 if(e.hint){c.save();c.fillStyle=P.accent;c.strokeStyle=P.rim;c.lineWidth=1.5;c.beginPath();c.moveTo(sx,top-6*sc);c.lineTo(sx-8*sc,top-18*sc);c.lineTo(sx+8*sc,top-18*sc);c.closePath();c.fill();c.stroke();
  c.font='800 '+Math.round(11*sc)+'px system-ui,sans-serif';c.textAlign='center';c.fillStyle=P.rim;c.fillText('다른 문',sx,top-24*sc);c.restore()}
}
function drawHold(c,e,run,sx,yF,yC,sc,P){
 const z=run.zone&&run.zone.d===e?run.zone:null,openAmt=e.done?1:z&&z.phase==='open'?clamp(z.t/OPEN,0,1):z&&z.phase==='go'?1:0,dw=44*sc,dh=(yF-yC)*.8,top=yF-dh;
 c.fillStyle=P.block[0];c.fillRect(sx-dw-6*sc,top-10*sc,dw*2+12*sc,dh+10*sc);
 c.fillStyle=openAmt>0?P.aurora:P.block[1];c.globalAlpha=openAmt>0?.55:1;c.fillRect(sx-dw,top,dw*2,dh);c.globalAlpha=1;
 const pw=dw*(1-openAmt);c.fillStyle=P.block[2];c.fillRect(sx-dw,top,pw,dh);c.fillRect(sx+dw-pw,top,pw,dh);
 c.strokeStyle=P.rim;c.lineWidth=2;c.strokeRect(sx-dw-6*sc+.5,top-10*sc+.5,dw*2+12*sc-1,dh+10*sc-1);
 const lampOn=z&&z.phase==='hold',n=lampOn?run.lamp:e.done||z&&(z.phase==='open'||z.phase==='go')?0:e.hold;
 c.fillStyle='#10101a';c.fillRect(sx-16*sc,top-34*sc,32*sc,20*sc);c.font='800 '+Math.round(15*sc)+'px system-ui,sans-serif';c.textAlign='center';c.fillStyle=n>0?P.gold:P.aurora;c.fillText(n>0?String(n):'▼',sx,top-19*sc);
}
/* ---------- art: overlay (not rotated): name card, phase pips, telegraph, fail cause, clear caption ---------- */
function overlay(c,run,w,h,P,reduced,t,sc){
 const D=run.def,ph=run.ph,PH=D.phases[ph],fin=run.finishing?clamp(run.finishing.age/run.finishing.dur,0,1):0;
 // name card (FX20): before input starts
 if(run.stage==='intro'){
  const T=reduced?INTRO*.6:INTRO,a=clamp(run.introAge/T,0,1),al=clamp((a-.25)/.25,0,1)*(1-clamp((a-.88)/.12,0,1));
  if(al>0){c.save();c.globalAlpha=al;const cw=Math.min(w-48,300),cy=h*.5;rr(c,w/2-cw/2,cy-52,cw,104,22);c.fillStyle='rgba(30,22,44,.86)';c.fill();c.lineWidth=2.4;c.strokeStyle=P.accent;c.stroke();
   c.textAlign='center';c.fillStyle=P.accent;c.font='800 12px system-ui,sans-serif';c.fillText(D.id,w/2,cy-28);c.fillStyle='#fff6e6';c.font='800 30px system-ui,sans-serif';c.fillText(D.name,w/2,cy+4,cw-24);c.fillStyle='rgba(255,240,226,.85)';c.font='600 13px system-ui,sans-serif';c.fillText(D.sub,w/2,cy+30,cw-24);c.restore()}
  return;
 }
 // phase pips: filled = done, thick = now, thin = to come
 {const y=h*.185,pw=30,gap=8,x0=w/2-(pw*3+gap*2)/2;c.save();c.textAlign='center';
  for(let i=0;i<3;i++){const x=x0+i*(pw+gap);rr(c,x,y,pw,9,4.5);if(i<ph||fin>0&&i===ph){c.fillStyle=P.rim;c.fill()}else{c.fillStyle='rgba(255,255,255,.35)';c.fill()}c.lineWidth=i===ph?2.6:1.4;c.strokeStyle=P.rim;c.stroke()}
  c.font='700 12px system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(255,246,232,.85)';const lab=D.name+' · '+PH.name;c.strokeText(lab,w/2,y+26,w-40);c.fillStyle=P.rim;c.fillText(lab,w/2,y+26,w-40);c.restore()}
 // telegraph banner (>= 1.15 s), plus a warning chip for the next city rotation
 if(run.tele&&run.state==='play'){const tl=run.tele,a=clamp(tl.age/.18,0,1)*clamp((tl.dur-tl.age)/.22,0,1);banner(c,w,h*.47,P,PH.kind,PH.name,PH.tele,a,1-tl.age/tl.dur)}
 else if(run.state==='play'&&run.def.phases[ph].kind==='rotate'){const nx=run.el.slice(run.ei).find(e=>e.k==='rot'&&!e.res);if(nx){const ahead=(nx.at-run.x)/(B*run.bpm/60);if(ahead>0&&ahead<1.6)banner(c,w,h*.47,P,'rotate','곧 도시가 돌아가요','발밑이 바닥이야',clamp((1.6-ahead)/.3,0,1),null,P.danger)}}
 // fail cause (shown on the hit, stays under the result panel)
 if(run.crash&&(run.state==='fail'||run.outro)&&run.cause){banner(c,w,h*.47,P,'x',run.cause,(ph+1)+'페이즈부터 다시',1,null,P.danger)}
 // clear caption
 if(fin>.25){banner(c,w,h*.47,P,'ok',D.clear,D.win,clamp((fin-.25)/.3,0,1),null,P.aurora)}
}

/* ---------- the run ---------- */
let Class=null;
function makeBossRun(){
 const M=root.MongyuSquareAct?.MirrorRun;if(!M)return null;
 const Base=Object.getPrototypeOf(M);if(!Base||Base===Function.prototype)return null;
 const SIDE_W=11;
 class BossRun extends Base{
  constructor(options={}){
   super(options);
   const id=BOSSES[options.boss]?options.boss:BY_N[options.boss|0]||'B01';
   this.def=BOSSES[id];this.bossId=id;this.boss=this.def.n;this.dreamMode='boss';this.B=B;
   this.bpm=Number(this.chain?.bpm??options.bpm)||this.def.bpm;
   this.reset();
  }
  reset(){
   const o=this.options,cp=this.chain?.resume||null,D=this.def;
   this.baseReset();
   this.rec=cp&&Array.isArray(cp.rec)?[cp.rec[0]||null,cp.rec[1]||null]:[null,null];
   this.course=buildBoss(D,{bpm:this.bpm,seed:this.seed,rec:[this.rec[0]||null,this.rec[1]||null]});
   this.fixRec();
   this.length=this.course.length;this.shardTotal=this.course.shardTotal;this.zone=null;this.v=this.course.speed;this.lamp=0;this.waited=0;this.rot=0;this.rotFrom=0;this.rotTo=0;this.rotT=-1;this.rotIdx=0;
   this.ph=cp?clamp(cp.ph|0,0,2):0;this.stage=cp?'run':'intro';this.introAge=0;this.tele=null;this.lastPhaseAt=-10;this.rec2=[[],[],[]];this.cause=null;this.hop=false;this.joke=0;this.pending=null;this.cpData=null;
   // twin / ghost lane (B04)
   this.q=[];this.tfly=null;this.tfl=FL;this.tpk=PEAK;this.theight=0;this.tlandedAt=-10;this.gi=0;
   this.ei=0;this.el=flat(this.course);this.tapList=this.el.filter(e=>e.tap!=null).sort((a,b)=>a.tap-b.tap);this.next=0;
   this.shardList=this.el.filter(e=>e.tap!=null&&(e.k==='jump'||e.k==='pit'||e.k==='gate')&&e.idx%2===0&&!e.cart).map(e=>({e,got:false}));
   this.coach=null;
   this.syncShards();
   const MI=items();
   if(MI&&(this.chain||o.items)){const len=Math.max(1,this.length-3*B);MI.setup(this,{items:this.itemSpecs(o.items),start:0,len,beat:B})}
   else{this.mods=null;this.itemList=null}
   if(cp){const ph=this.course.phases[this.ph];this.x=ph.start;this.distance=this.x;this.points=num(cp.points);this._own=Math.floor(this.x/12);this.perfectStreak=num(cp.ps);this.score=this.points;this.hop=ph.hop;
    this.skipTo(this.x);this.enterPhase(this.ph,true)}
  }
  /* B04: phases 2 and 3 are laid out from the recorded taps; an ideal recording stands in until there is one */
  fixRec(){
   if(this.bossId!=='B04')return;const C=this.course,P=C.phases;
   const r0=this.rec[0]||idealRec(P[0].els,P[0].start);this.rec[0]=r0;
   if(!this.rec[1]){const e1=C.rebuildPhase(1,r0);this.rec[1]=idealRec(e1,P[1].start)}else C.rebuildPhase(1,r0);
   C.rebuildPhase(2,this.rec[1]);
  }
  itemSpecs(list){
   if(!Array.isArray(list))return [];const C=this.course,out=[];
   for(const e of list){
    if(Number.isFinite(e?.at)){out.push(e);continue}
    const ph=C.phases[clamp(e.ph|0,0,2)],cand=ph.els.filter(x=>x.tap!=null&&(x.k==='jump'||x.k==='pit'||x.k==='gate'));
    let x;
    if(e.kind==='memory-star'||e.kind==='star'){const t=cand[clamp(e.ev|0,0,cand.length-1)];x=t?t.at:ph.start+B*8}
    else{const a=ph.els.filter(z=>z.k!=='rot'&&z.k!=='gjump'&&z.k!=='tjump'),i=clamp(e.ev|0,0,a.length-2),A=a[i],Z=a[i+1];x=A&&Z?(A.at+Z.at)/2:ph.start+B*8}
    out.push({kind:e.kind,at:x/Math.max(1,this.length-3*B),lane:e.kind==='star'||e.kind==='memory-star'?'hi':'lo'});
   }
   return out;
  }
  syncShards(){this.shardTotal=this.shards+this.shardList.filter(s=>!s.got).length}
  skipTo(x){
   for(const e of this.el)if(e.at<x-1){e.done=true;e.res=true}
   this.ei=this.el.findIndex(e=>!e.res);if(this.ei<0)this.ei=this.el.length;
   this.next=this.tapList.findIndex(e=>!e.done);if(this.next<0)this.next=this.tapList.length;
   for(const s of this.shardList)if(s.e.at<x-1)s.got=true;
   this.gi=0;
  }
  get stagePhase(){return this.course.phases[this.ph]}
  start(){
   if(this.state!=='ready')return false;this.state='play';this.events.push('start');
   if(this.stage==='intro')this.bossEvent('boss-reveal');
   this.music(true);return true;
  }
  retry(){this.attempt++;const cp=this.phaseCheckpoint();this.chain={...(this.chain||{}),resume:cp};this.reset();this.state='play';this.events.push('start');this.music(true);return true}
  music(on){
   try{const M=root.MongyuAdaptiveMusic;if(!M)return;if(on){M.setContext?.({boss:this.boss,course:this.chain?.courseId||undefined,bpm:this.bpm})}else M.clearContext?.()}catch(_){}
  }
  bossEvent(name,extra){
   this.events.push(name);this.lastBoss={event:name,boss:this.bossId,n:this.boss,phase:this.ph+1,kind:this.stagePhase.kind,...extra};
   try{root.MongyuPolish?.emit?.(name,{run:this,...this.lastBoss})}catch(_){}
  }
  /* what a retry needs: the phase to start from and what the ghost remembers */
  phaseCheckpoint(){const c=this.cpData;return c?{ph:c.ph,points:c.points,ps:c.ps,rec:[c.rec[0]?[...c.rec[0]]:null,c.rec[1]?[...c.rec[1]]:null]}:null}
  enterPhase(p,resumed){
   this.ph=p;const ph=this.course.phases[p];this.hop=!!ph.hop;
   this.tele={p,age:0,dur:TEL};this.lastPhaseAt=this.time;
   this.cpData={ph:p,points:this.points,ps:this.perfectStreak,rec:[this.rec[0]?[...this.rec[0]]:null,this.rec[1]?[...this.rec[1]]:null]};
   if(this.bossId==='B04'&&p>0){
    // ghost: replays the previous phase's taps; plates / ghost blocks of this phase are laid out from them
    const src=this.rec2[p-1].length?this.rec2[p-1].slice():(this.rec[p-1]||[]);
    if(this.rec2[p-1].length)this.rec[p-1]=this.rec2[p-1].slice();
    this.cpData.rec=[this.rec[0]?[...this.rec[0]]:null,this.rec[1]?[...this.rec[1]]:null];
    this.course.rebuildPhase(p,this.rec[p-1]);this.el=flat(this.course);this.tapList=this.el.filter(e=>e.tap!=null).sort((a,b)=>a.tap-b.tap);
    this.shardList=this.el.filter(e=>e.tap!=null&&(e.k==='jump'||e.k==='pit'||e.k==='gate')&&e.idx%2===0&&!e.cart).map(e=>({e,got:false}));
    this.skipTo(this.x);this.syncShards();this.ghostTaps=thin(src).filter(o=>o>=this.course.tb*B);this.gi=0;
   }
   this.setCoach('phase',TEL+2.2,this.def.phases[p].coach);
   this.bossEvent('boss-phase',{resumed:!!resumed});
  }
  inZone(){return !!this.zone&&(this.zone.phase==='brake'||this.zone.phase==='hold')}
  causeOf(e,kind){const c=this.def.phases[e.ph].cause;if(e.lie&&c.lie)return c.lie;return c[kind||e.k]||c.jump||'부딪혔어요'}
  fail(e,kind,info){
   const text=this.causeOf(e||{ph:this.ph},kind);this.cause=text;this.crashNow(text,text,info||{kind:'hit',at:this.x});
  }
  action(){
   if(this.state!=='play')return false;
   if(this.finishing){if(this.finishing.age>.35)this.complete();return true}
   if(this.stage!=='run'||this.outro||this.hitStop>0)return false;
   this.inputCount++;const C=this.course;
   if(this.inZone()){this.fail({ph:this.ph},'hold',{kind:'button',at:this.x});this.events.push('wait-fail');return true}
   // door rows: the odd door is the only one you may press at
   const dr=this.nearDoor();
   if(dr&&!dr.odd){this.fail(dr,'door',{kind:'door',at:this.x});return true}
   if(this.fly!==null){if(this.fly>=this.fl-.14)this.buffer=.14;return false}
   const e=this.tapList[this.next];
   if(e&&!e.done&&Math.abs(this.x/B-e.tap)<=(e.k==='door'?.8:1.2)){
    e.done=true;this.next++;const err=Math.abs(this.x/B-e.tap);
    if(err<=.17){this.perfects++;this.perfectStreak++;this.bestStreak=Math.max(this.bestStreak,this.perfectStreak);this.perfectPoints+=20*Math.min(5,this.perfectStreak);this.events.push('perfect');this.setCoach('perfect',.6,'완벽!');if(e.k==='pit')this.events.push('corner')}
    else{this.perfectStreak=0;this.events.push('pass')}
   }else this.perfectStreak=0;
   if(dr&&dr.odd)dr.entered=true;
   this.jumpNow();
   this.rec2[this.ph].push(Math.round(this.x-C.phases[this.ph].start));
   if(this.def.phases[this.ph].kind==='mirror')this.q.push({at:this.gt+60/this.bpm,fl:this.fl,pk:this.pk||1});
   return true;
  }
  nearDoor(){
   for(let i=this.ei;i<this.el.length;i++){const e=this.el[i];if(e.at-B>this.x+B)break;if(e.k==='door'&&Math.abs(e.at-this.x)<=.8*B)return e}
   return null;
  }
  jumpNow(){
   const MI=items();this.fl=MI&&this.mods?MI.applyJump(this,this.hop?SHOP_FL:FL):(this.hop?SHOP_FL:FL);
   this.pkH=(this.hop?HOP:PEAK)*(this.pk||1);this.fly=0;this.buffer=0;this.jumps++;this.events.push('jump');
  }
  /* speed factor: full, braking to a stop in front of a hold door, held, then easing back up */
  stepZone(sdt){
   const C=this.course,hs=this.el,i=this.zoneIdx();const d=i>=0?hs[i]:null,z=this.zone;
   if(!z){if(d&&this.x>=d.at-DEC-STOP){this.zone={d,phase:'brake',t:0};this.setCoach('wait',2.2,'누르지 말고 기다려')}return 1}
   const stop=d.at-STOP;
   if(z.phase==='brake'){const u=clamp((stop-this.x)/DEC,0,1);if(this.x>=stop-1.5){z.phase='hold';z.t=0;this.lamp=d.hold;this.events.push('wait')}return .1+.9*u}
   if(z.phase==='hold'){z.t+=sdt;const bt=60/C.bpm,left=Math.max(0,d.hold-Math.floor(z.t/bt));if(left!==this.lamp){this.lamp=left;if(left>0)this.events.push('pass')}
    if(z.t>=d.hold*bt){z.phase='open';z.t=0;this.events.push('corner');this.waited++}return 0}
   if(z.phase==='open'){z.t+=sdt;if(z.t>=OPEN){z.phase='go';z.t=0}return 0}
   z.t+=sdt;const f=clamp(z.t/RAMP,.08,1);if(this.x>d.at+30){d.res=true;d.done=true;this.zone=null}return f;
  }
  zoneIdx(){
   for(let i=this.ei;i<this.el.length;i++){const e=this.el[i];if(e.k==='hold'&&!e.res)return i;if(e.at-this.x>DEC+STOP+40&&e.k!=='hold')break}
   return -1;
  }
  stepTwin(sdt){
   const sk=this.def.phases[this.ph].kind,C=this.course;
   if(this.q.length&&this.gt>=this.q[0].at){const t=this.q.shift();this.tfly=0;this.tfl=t.fl;this.tpk=PEAK*t.pk}
   if(this.ghostTaps&&(sk==='ghost'||sk==='coop')){const st=C.phases[this.ph].start;while(this.gi<this.ghostTaps.length&&this.x-st>=this.ghostTaps[this.gi]){this.gi++;this.tfly=0;this.tfl=FL;this.tpk=PEAK}}
   if(this.tfly!==null){this.tfly+=sdt;const ph=Math.min(1,this.tfly/this.tfl);this.theight=4*this.tpk*ph*(1-ph);if(ph===1){this.tfly=null;this.theight=0;this.tlandedAt=this.time}}
  }
  tick(dt){
   if(this.state!=='play')return;
   if(this.stage==='intro'){
    this.updates++;this.clock+=dt;this.time+=dt;this.introAge+=dt;
    if(this.introAge>=(reducedMotion()?INTRO*.6:INTRO)){this.stage='run';this.enterPhase(0)}
    return;
   }
   if(this.finishing)this.stepRot(dt);
   if(!this.gate(dt))return;
   const C=this.course,sdt=this.pace(dt),Wd=SIDE_W+4;
   const f=this.stepZone(sdt);
   this.time+=dt;this.gt+=sdt;this.v=C.speed*f;this.x+=this.v*sdt;this.distance=this.x;this.buffer=Math.max(0,this.buffer-dt);
   if(this.tele){this.tele.age+=dt;if(this.tele.age>=this.tele.dur)this.tele=null}
   this.flightStep(sdt);this.stepTwin(sdt);
   while(this.ph<2&&this.x>=C.phases[this.ph+1].start)this.enterPhase(this.ph+1);
   this.stepRot(dt);
   const MI=items(),hasMods=!!(MI&&this.mods);
   const hit=(e,kind,info)=>{if(hasMods&&MI.applyHit(this)){e.absorbed=true;e.res=true;return false}this.fail(e,kind,info);return true};
   while(this.ei<this.el.length&&this.el[this.ei].res)this.ei++;
   for(let i=this.ei;i<this.el.length;i++){
    const e=this.el[i];if(e.at-Wd>this.x+90)break;if(e.res)continue;const dx=this.x-e.at;
    switch(e.k){
     case 'jump':if(Math.abs(dx)<=Wd&&e.h>0&&this.height<e.h){if(hit(e,'jump',{kind:'me',at:this.x}))return}else if(dx>Wd)e.res=true;break;
     case 'duck':if(Math.abs(dx)<=Wd&&this.height>9){if(hit(e,'duck',{kind:'me',at:this.x}))return}else if(dx>Wd)e.res=true;break;
     case 'pit':{const hw=e.w/2-8;if(Math.abs(dx)<=hw&&this.height<3){if(hit(e,'pit',{kind:'me',at:this.x,fall:true}))return}else if(dx>hw)e.res=true;break}
     case 'gate':if(dx>=0){e.res=true;const need=e.need*this.pkH,okMe=this.height>=need,okG=!e.coop||this.theight>=e.need*PEAK-1;
       if(okMe&&okG){e.done=true;this.events.push('corner');e.openAt=this.time}
       else if(hit(e,'gate',{kind:'me',at:this.x}))return}break;
     case 'tjump':if(Math.abs(dx)<=Wd&&this.theight<e.h){if(hit(e,'tjump',{kind:'twin',at:this.x}))return}else if(dx>Wd)e.res=true;break;
     case 'gjump':if(dx>Wd)e.res=true;break;
     case 'door':if(e.odd&&!e.entered&&dx>.8*B){if(hit(e,'miss',{kind:'door',at:this.x}))return}else if(dx>.8*B)e.res=true;break;
     case 'rot':if(dx>=0&&!e.res){e.res=true;this.startRot(e)}break;
     case 'hold':break;
    }
   }
   for(const sh of this.shardList){if(sh.got)continue;const sx=sh.e.at;if(this.x>sx+16)continue;if(Math.abs(this.x-sx)<12&&this.height>=this.pkH*.62){sh.got=true;this.shards++;this.pickedAt=this.time;this.events.push('collect')}}
   this.scoreStep();
   if(this.x>=this.length&&!this.crash)this.reachGate();
  }
  startRot(e){this.rotFrom=this.rot;this.rotTo=e.ang;this.rotT=0;this.rotIdx=e.idx;this.events.push('corner')}
  stepRot(dt){if(this.rotT<0)return;this.rotT+=dt;const u=clamp(this.rotT/ROT_T,0,1);this.rot=this.rotFrom+(this.rotTo-this.rotFrom)*ease(u);if(u>=1)this.rotT=-1}
  reachGate(){
   this.events.push('portal');this.bossEvent('boss-clear');this.music(false);
   if(this.rot!==0){this.rotFrom=this.rot;this.rotTo=Math.round(this.rot/TAU)*TAU;this.rotT=0}   // the city folds back upright while it shrinks
   const ch=this.chain;if(ch&&ch.last===false){this.complete();return}
   this.finishing={age:0,dur:reducedMotion()?CLEAR_REDUCED:CLEAR};
  }
  finish(state,reason){
   super.finish(state,reason);
   Object.assign(this.result,{mode:'boss',boss:this.bossId,phase:this.ph+1,phases:3,cause:state==='fail'?this.cause:null,checkpoint:state==='fail'?this.phaseCheckpoint():null,
    reason:state==='clear'?'보스를 넘었어요.':(this.cause||reason||'부딪혔어요')});
   if(state==='fail')this.music(false);
  }
  status(){
   const P=this.def.phases[this.ph];
   return {mode:this.mode,dreamMode:this.dreamMode,state:this.state,time:this.time,hearts:this.hearts,score:Math.floor(this.points),best:0,progress:this.progressNow,roomTitle:this.def.name,roomIndex:this.ph,roomCount:3,
    instruction:'탭: 점프',cue:this.tele?P.tele:null,result:this.result,boss:{id:this.bossId,n:this.boss,phase:this.ph+1,phaseName:P.name,kind:P.kind,telegraph:this.tele?{age:this.tele.age,dur:this.tele.dur,text:P.tele}:null,stage:this.stage}};
  }
  /* Autopilot for the headless checks: taps at the ideal beat of the next tap element, never touches the screen while a car holds (mode 'ignore' = a little late). */
  pilot(cr,mode){
   if(this.stage!=='run'||this.fly!==null||this.outro||this.finishing||this.hitStop>0||this.inZone())return;
   const e=this.tapList[this.next];if(!e)return;
   if(this.x>=(e.tap+(mode==='ignore'?.08:0))*B-.5)cr.action();
  }
  draw(c,opts){return drawBoss(c,this,opts)}
  drawAura(){}
 }
 return BossRun;
}
const getRun=()=>Class||(Class=makeBossRun());
const ACTS=Object.freeze({boss:o=>{const K=getRun();if(!K)throw new Error('boss act needs square-act.js');return new K(o)}});
function register(Course){const C=Course||root.MongyuCourse;if(!enabled||!C?.registerAct||!root.MongyuSquareAct?.MirrorRun)return false;for(const [t,f] of Object.entries(ACTS))C.registerAct(t,f);return true}
const api=Object.freeze({enabled,BOSSES,BY_N,ACTS,GEN,buildBoss,flat,idealRec,register,B,FL,PEAK,TEL,INTRO,CLEAR,constants:Object.freeze({B,FL,PEAK,W,SHOP_FL,HOP,TEL,INTRO,CLEAR,PIT,ROT_T,SECS}),get BossRun(){return getRun()}});
root.MongyuBossAct=api;if(typeof module!=='undefined')module.exports=api;
if(enabled)try{register()}catch(_){}
})(globalThis);
