/* R105 HUM: data for the humor engine (docs: NOM3 blueprint 6.3 / 6.4 / 24.2, voice: docs/R105_VOICE_TONE_KO.md). Pure data, no logic besides normalising rows.
   One row = one candidate line. ko = first-person banmal monologue (4-18 chars, deadpan, never insulting), en = a transcreation, not a literal translation.
   ko '' (empty) is a STORY row on purpose: silence is allowed (the director then keeps every other joke quiet for a while).
   Row fields: id, event, cls (STORY TEACH FIRST FAIL COMBO META RARE), priority, weight, cooldownSeconds, maxPerSession, oncePerProfile, group (once-per-profile is per group),
   exclusionTags, allow (tags this row may speak through), when {ch,course,act,streakMin,failEq,failMin,failMax,failEvery,cross,item,assist,assistItem,pausedMsMin,awayDaysMin,notFirstEver},
   outputs {bubble,gesture,sfx,hint,result}, durationMs, delayMs, key (localization key). Events are produced by humor-director.js. */
(function(root){'use strict';
if(root.MONGYU_UI_EDITION!==true)return;
const CLASS=Object.freeze({STORY:90,TEACH:100,FIRST:50,FAIL:30,COMBO:25,META:20,RARE:10});
/* Events the director derives from the course run (run-event bus + per-frame snapshot). */
const EVENTS=Object.freeze(['run.start','run.retry','run.resume','jump.perfect','obstacle.pass','corner','morph','portal','act.enter','act.exit','item','surge','surge.end','shield.break','progress','course.clear']);
/* Gesture names the CH/SIL owner may consume via MongyuHumor.on('gesture'). play-hud only animates the speech-bubble face. */
const GESTURES=Object.freeze(['tiny_bow','shrug','head_tilt','hold_head','peek','nod','lie_down','straighten','knock','panic','stand_up','wave','stare','pretend','step_aside','look_back','stretch']);
/* Existing synth names only (game-sfx.js configs). */
const SFX=Object.freeze(['none','tutorial-progress','ui-open','square-room','pass']);
const DEFAULT_EXCLUSION=Object.freeze(['boss_climax','fever_peak','tutorial_critical']);
const rows=[];
function row(id,event,cls,when,ko,en,o){
 o=o||{};
 const out=Object.freeze({bubble:o.bubble!==false&&ko!=='',gesture:o.gesture||'none',sfx:o.sfx||'none',hint:o.hint||null,result:o.result===true});
 rows.push(Object.freeze({id,event,cls,priority:o.priority||CLASS[cls],weight:o.weight||1,cooldownSeconds:o.cooldownSeconds??600,maxPerSession:o.maxPerSession??2,oncePerProfile:o.oncePerProfile===true,
  group:o.group||id,exclusionTags:Object.freeze(o.exclusionTags||DEFAULT_EXCLUSION),allow:Object.freeze(o.allow||[]),when:Object.freeze(when||{}),ko,en,outputs:out,
  durationMs:o.durationMs||0,delayMs:o.delayMs||0,key:'humor.'+id}));
}
const G='tiny_bow';

/* ---- FIRST: first start, first clean pass (once per profile, one of three) ---- */
row('F01','run.start','FIRST',{},'일단 가 보자.',"Well. Let's go.",{oncePerProfile:true,group:'first-start',delayMs:2700,gesture:'nod'});
row('F02','run.start','FIRST',{},'여기 길 맞지?','This is the road, right?',{oncePerProfile:true,group:'first-start',delayMs:2700,gesture:'head_tilt'});
row('F03','run.start','FIRST',{},'나 준비 안 했는데.',"I didn't even stretch.",{oncePerProfile:true,group:'first-start',delayMs:2700,gesture:'shrug'});
row('F04','obstacle.pass','FIRST',{},'원래 잘하잖아.','Been good at this forever.',{oncePerProfile:true,group:'first-pass',gesture:G});
row('F05','obstacle.pass','FIRST',{},'봤냐.','You saw that, right?',{oncePerProfile:true,group:'first-pass',gesture:G});

/* ---- COMBO: perfect jumps (J202 and the 6.6 sample HUM-JUMP-001) ---- */
row('P01','jump.perfect','COMBO',{streakMin:2},'착지 점수 주세요.','Scores for the landing, please.',{gesture:G,cooldownSeconds:900});
row('HUM-JUMP-001','jump.perfect','COMBO',{ch:[1,2,3],streakMin:3},'이 정도면 발레지.','Practically ballet.',{gesture:G,cooldownSeconds:45,maxPerSession:1,durationMs:1400});
row('J202','jump.perfect','COMBO',{streakMin:2},'박수는 됐고.','Save the applause.',{gesture:G,cooldownSeconds:900});
row('K01','jump.perfect','COMBO',{streakMin:4},'오늘 컨디션 좋네.','Good day for it.',{gesture:'nod'});
row('K02','jump.perfect','COMBO',{streakMin:4},'너무 잘하는데?','This is going too well.',{gesture:'head_tilt'});

/* ---- corners, spins (J201) ---- */
row('J201','corner','COMBO',{act:['floor-wall','bridge']},'땅이 참 바쁘네.',"The ground's busy today.",{gesture:'head_tilt',maxPerSession:1});
row('C02','corner','COMBO',{act:['floor-wall','bridge']},'허리 조심.','Mind the spine.',{gesture:'hold_head'});
row('C04','corner','COMBO',{act:['floor-wall','bridge']},'위가 어디였지.','Which way was up?',{gesture:'head_tilt'});
row('C05','corner','COMBO',{act:['helix-up','helix-down','penrose']},'세상이 날 돌리네.',"The world's spinning me.",{gesture:'panic'});

/* ---- optical illusions: a bridge turns (J203) ---- */
row('M01','morph','FIRST',{},'법적으로 괜찮나?','Is this even legal?',{oncePerProfile:true,group:'first-morph',gesture:'peek'});
row('M02','morph','COMBO',{},'어? 붙었네.','Huh. They connected.',{gesture:'head_tilt'});
row('M04','morph','COMBO',{},'이래도 되나?','Can it do that?',{gesture:'shrug'});

/* ---- act-specific beats (chapters 3-5 acts; harmless when an act is absent) ---- */
row('G01','act.enter','COMBO',{act:['flip']},'물리 선생님, 미안.','Sorry, physics teacher.',{delayMs:1400,gesture:'tiny_bow'});
row('G02','act.enter','COMBO',{act:['flip']},'천장 출근이네.','Commuting on the ceiling.',{delayMs:1400,gesture:'nod'});
row('G03','act.enter','COMBO',{act:['flip']},'바닥이 변심했네.','The floor changed its mind.',{delayMs:1400,gesture:'shrug'});
row('R01','act.enter','COMBO',{act:['mirror']},'쟤도 나야?','Is that me, too?',{delayMs:1400,gesture:'stare'});
row('R03','act.enter','COMBO',{act:['mirror']},'쟤는 왜 안 늙어.',"Why doesn't he age?",{delayMs:1400,gesture:'stare'});
row('R04','act.enter','COMBO',{act:['mirror']},'둘이니까 한 명 몫만 하자.','Two of us. One share of work.',{delayMs:1400,gesture:'step_aside'});
row('W01','act.enter','COMBO',{act:['wait']},'퇴근해도 돼?','Can I clock out?',{delayMs:1600,gesture:'stretch'});
row('W02','act.enter','COMBO',{act:['wait']},'나 여기 있거든.',"I'm right here, you know.",{delayMs:1600,gesture:'wave'});
row('W04','act.exit','COMBO',{act:['wait']},'이게 재능이지.',"That's talent.",{delayMs:1600,gesture:'lie_down'});
row('L01','act.enter','COMBO',{ch:[5],act:['bridge','penrose','floor-wall']},'아까 왔던 데네.',"I've been here before.",{delayMs:1400,gesture:'head_tilt'});
row('L03','act.enter','COMBO',{ch:[5],act:['bridge','penrose','floor-wall']},'집에 가긴 글렀네.',"Going home's off the table.",{delayMs:1400,gesture:'shrug'});
row('J207','act.enter','COMBO',{ch:[5],act:['bridge','penrose','floor-wall']},'이 집 구조가 이상해.','Weird floor plan.',{delayMs:1400,gesture:'knock'});

/* ---- fever (aurora surge) in / out (J210) ---- */
row('S01','surge','COMBO',{},'어어어, 잠깐.','Whoa, whoa, wait.',{delayMs:2100,allow:['fever_peak'],gesture:'panic'});
row('S03','surge','COMBO',{},'이거 좀 멋있네.','This is kind of cool.',{delayMs:2100,allow:['fever_peak'],gesture:'tiny_bow'});
row('E01','surge.end','COMBO',{},'이제 좀 쉬자.','Okay. Break time.',{gesture:'stretch'});
row('J210','surge.end','COMBO',{},'어지러운 척 안 했어.',"I wasn't faking dizzy.",{gesture:'straighten'});

/* ---- near miss, items, rare finds (J213 lives in the ladder) ---- */
row('B01','shield.break','COMBO',{},'큰일 날 뻔했네.','That was close.',{delayMs:1800,gesture:'shrug'});
row('B03','shield.break','COMBO',{},'다행인 척 좀 할게.','Pretending to be relieved.',{delayMs:1800,gesture:'pretend'});
row('I01','item','COMBO',{item:['bubble','time','feather']},'주는 건 받지.',"I take what I'm given.",{delayMs:2000,gesture:'nod'});
row('I03','item','COMBO',{item:['bubble','time','feather']},'서랍에 넣어 둬야지.',"Into the drawer it goes.",{delayMs:2000,gesture:'nod'});
row('A01','item','FAIL',{assistItem:true},'현명하네. 우리 둘 다.','Wise. Both of us.',{delayMs:2000,gesture:'nod',cooldownSeconds:900});
row('A02','item','FAIL',{assistItem:true},'이게 문명이지.','This is civilization.',{delayMs:2000,gesture:'tiny_bow',cooldownSeconds:900});
row('X01','item','RARE',{item:['memory-star']},'이런 게 있었네.','There was one of these.',{delayMs:2000,gesture:'peek'});
row('X03','item','RARE',{item:['memory-star']},'못 본 척해.',"You didn't see this.",{delayMs:2000,gesture:'pretend'});
row('J214','portal','RARE',{},'문도 낯을 가리네.',"Even the door's shy.",{oncePerProfile:true,delayMs:1200,gesture:'peek',sfx:'ui-open'});

/* ---- pause / return ---- */
row('U01','run.resume','META',{pausedMsMin:3000},'다 쉬었냐.','Done resting?',{gesture:'stand_up',delayMs:900,cooldownSeconds:300});
row('U03','run.resume','META',{pausedMsMin:3000},'다시 일하자.','Back to work.',{gesture:'stretch',delayMs:900,cooldownSeconds:300});
row('V01','run.start','META',{awayDaysMin:1,notFirstEver:true},'왔네.',"Oh. You're here.",{delayMs:2700,gesture:'wave',maxPerSession:1});
row('J212','run.start','META',{awayDaysMin:1,notFirstEver:true},'자리 안 뺏겼네.',"Nobody took my seat.",{delayMs:2700,gesture:'stand_up',maxPerSession:1});

/* ---- 6.4 failure ladder: cumulative fails on one course. 1 / 3 / 5 (hint) / 7 / 10 / every 5 after 14. Never mocks the player; help is always an offer. ---- */
const L={delayMs:2600,cooldownSeconds:120,maxPerSession:3,exclusionTags:['boss_climax','tutorial_critical']};
row('T01','run.retry','FAIL',{failEq:[1]},'연습이었다.','Consider that practice.',{...L,gesture:'pretend'});
row('T03','run.retry','FAIL',{failEq:[3]},'이 바닥이랑 정들겠네.','Getting attached to this floor.',{...L,gesture:'head_tilt'});
row('T05a','run.retry','FAIL',{failEq:[5],assist:true},'방울 하나 놔뒀어. 써도 돼.','Left you a bubble. Use it.',{...L,gesture:'nod',sfx:'tutorial-progress',hint:'assist'});
row('T05d','run.retry','FAIL',{failEq:[5]},'발자국 표시해 줄게.',"I'll mark where to jump.",{...L,gesture:'knock',hint:'footprint'});
row('T05b','run.retry','FAIL',{failEq:[5]},'같이 생각한 걸로 하자.',"Let's say we thought of it together.",{...L,gesture:'nod'});
row('T05c','run.retry','FAIL',{failEq:[5]},'숨 좀 쉬고 가자.','Breathe first. Then go.',{...L,gesture:'stretch'});
row('T07','run.retry','FAIL',{failEq:[7]},'여기 그냥 살까.',"Maybe I'll just live here.",{...L,gesture:'shrug'});
row('T10','run.retry','FAIL',{failEq:[10]},'천천히 가도 된다.',"Take it slow. It's fine.",{...L,gesture:'nod',cooldownSeconds:600});
row('T15','run.retry','FAIL',{failEvery:[15,5]},'쉬어도 돼. 길은 안 도망가.',"Rest if you like. The road stays.",{...L,gesture:'lie_down',cooldownSeconds:900});

/* ---- course endings: result-panel lines (bubble off; consumers read the 'line' event) and the J216 silence ---- */
row('N01','course.clear','STORY',{course:['c25']},'끝났나.',"Is that it?",{bubble:false,result:true,weight:1,cooldownSeconds:3600});
row('N02','course.clear','STORY',{course:['c25']},'집에 갈까.','Home, then?',{bubble:false,result:true,weight:1,cooldownSeconds:3600});
row('J216','course.clear','STORY',{course:['c25']},'','',{weight:2,gesture:'step_aside',cooldownSeconds:3600,result:true});

/* ---- stage lines (section 4, rewritten): one or two per course, spoken once the run crosses the progress mark. Chapter = ceil(n/5) of course id cN. ----
   Marks are chances: if the first is dropped (danger, coach, gap) the second may still land; a line that already played is on cooldown. */
const stage=(id,course,cross,ko,en,gesture,o)=>row(id,'progress','COMBO',{course:[course],cross},ko,en,{gesture,cooldownSeconds:900,maxPerSession:2,...o});
// chapter 1 · 자각몽의 정원
stage('S101','c1',[.5,.7],'원래 이렇게 우아하잖아.',"I'm always this graceful.",'tiny_bow');
stage('S102','c2',[.4,.6],'다리 길이는 비밀이야.','Leg length is classified.','shrug');
stage('S103','c3',[.35,.55],'붙어 있네. 설마.','They connect. No way.','head_tilt');
stage('S104','c4',[.35,.55],'모자 날아가겠네.','There goes my hat.','hold_head');
stage('S105','c5',[.3,.5],'조명한테 인사해야 하나.','Should I wave at the lights?','wave');
stage('S106','c5',[.8,.9],'큐브한텐 질 수 없지.',"Can't lose to a cube.",'tiny_bow');
// chapter 2 · 잊혀진 유년기
stage('S201','c6',[.4,.6],'그네가 나보다 한가하네.',"The swing's more relaxed than me.",'head_tilt');
stage('S202','c7',[.4,.6],'바닥이 하품했어.','The floor just yawned.','stare');
stage('S203','c8',[.3,.5],'전용면적이 너무 작네.','Tiny floor area.','shrug');
stage('S204','c8',[.7,.85],'나 원래 컸어.','I used to be bigger.','straighten');
stage('S205','c9',[.4,.6],'숙제는 안 했어.',"Didn't do my homework.",'pretend');
stage('S206','c10',[.35,.55],'건전지 어디 넣어?','Where do the batteries go?','head_tilt');
stage('S207','c10',[.75,.9],'건전지 없나 보네.','Maybe it needs batteries.','shrug');
// chapter 3 · 불가능한 도시
stage('S301','c11',[.4,.6],'가로등도 몸이 도네.',"Even the lamp's turning.",'stare');
stage('S302','c12',[.4,.6],'계단 면허는 어디서 따지?','Where do you get a stair license?','head_tilt');
stage('S303','c13',[.4,.6],'신호등이 나보다 침착하네.',"The signal's calmer than me.",'pretend');
stage('S304','c14',[.4,.6],'길이 날 잘못 골랐어.','The road picked the wrong guy.','shrug');
stage('S305','c15',[.35,.55],'건물이 재채기했어.','The building just sneezed.','head_tilt');
stage('S306','c15',[.75,.9],'규정 위반 아닌가.','Is this against the rules?','pretend');
// chapter 4 · 또 다른 나
stage('S401','c16',[.4,.6],'왼쪽이 어느 쪽이더라.','Which one was left again?','head_tilt');
stage('S402','c17',[.4,.6],'거울이 먼저 인사했어.','The mirror bowed first.','tiny_bow');
stage('S403','c18',[.4,.6],'과거의 내가 일하네.','Past me is on the clock.','nod');
stage('S404','c19',[.4,.6],'나는 정품이야.',"I'm the genuine one.",'straighten');
stage('S405','c20',[.4,.6],'쟤는 쉬지도 않네.',"He never takes a break.",'stare');
// chapter 5 · 경계의 호텔
stage('S501','c21',[.4,.6],'안내가 너무 솔직하네.',"That sign's too honest.",'head_tilt');
stage('S502','c22',[.4,.6],'계단이 먼저 퇴근했네.','The stairs clocked out early.','shrug');
stage('S503','c23',[.4,.6],'뛰었는데 제자리네.','I ran. Same spot.','hold_head');
stage('S504','c24',[.4,.6],'발만 흔들고 있을게.',"I'll just wiggle my feet.",'lie_down');
stage('S505','c25',[.35,.5],'출구 표지판이 따라오네.',"The exit sign is following me.",'look_back');
stage('S506','c25',[.7,.85],'먼저 가도 돼.','You can go first.','step_aside',{cooldownSeconds:900});

const ENTRIES=Object.freeze(rows);
const courseLines=Object.freeze(ENTRIES.filter(e=>e.event==='progress'));
const byEvent=new Map();for(const e of ENTRIES){if(!byEvent.has(e.event))byEvent.set(e.event,[]);byEvent.get(e.event).push(e)}
const api=Object.freeze({CLASS,EVENTS,GESTURES,SFX,DEFAULT_EXCLUSION,ENTRIES,courseLines,byEvent,count:()=>ENTRIES.length});
root.MongyuHumorBank=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
