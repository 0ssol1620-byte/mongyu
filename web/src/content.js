/* MONGYU R5: independently authored campaign. A skin is a collected playable stage,
 * not an outfit. The original game's individual levels, assets and answers are
 * not supplied or reconstructed here. No network, random state, or monetization. */
(function(root){'use strict';
const palettes=[
 {bg:'#72dce7',deep:'#1499d8',light:'#b9f5e7',accent:'#e9fb42',ink:'#092f43',danger:'#f23262'},
 {bg:'#c6deff',deep:'#7189d8',light:'#f2f7ff',accent:'#ffd35d',ink:'#203456',danger:'#d73876'},
 {bg:'#ffbb8f',deep:'#dc6470',light:'#ffe8ba',accent:'#baffd7',ink:'#582a37',danger:'#752ead'},
 {bg:'#c8a3ed',deep:'#8256b8',light:'#ead7ff',accent:'#fff17a',ink:'#342747',danger:'#d63669'},
 {bg:'#afdbb5',deep:'#468f77',light:'#e2efd0',accent:'#ffe2a8',ink:'#173b35',danger:'#ba4564'},
 {bg:'#ffd866',deep:'#dc8d36',light:'#fff5ad',accent:'#bdffec',ink:'#493923',danger:'#a83366'},
 {bg:'#e7b9ba',deep:'#bd777e',light:'#ffe6da',accent:'#c2f5ff',ink:'#4a2c3a',danger:'#8436a1'},
 {bg:'#84c3d4',deep:'#5069a6',light:'#d0f2e6',accent:'#ffccec',ink:'#183449',danger:'#c02f74'},
 {bg:'#f4afcb',deep:'#c94d91',light:'#ffe8ed',accent:'#e6ff8a',ink:'#4e2345',danger:'#5b3caf'},
 {bg:'#d4e89c',deep:'#7fae87',light:'#fff3bd',accent:'#f7b4e8',ink:'#294535',danger:'#a73770'}
];
// Every row is an authored chapter grammar. The nine explicit route strings
// change obstacle order as well as rhythm, route length, and mission demands.
// B=barrier, H=high hurdle, P=apex arch, G=ground-only beam, L=long beam, D=two-hurdle leap.
const designs=[
 {name:'새벽 회랑',subtitle:'점프와 연속의 첫 문',motif:'broken-corridor',rhythm:[1.8,1.65,1.95,1.6,1.8,2.05],names:['첫빛의 선','두 번째 박자','흔들리지 않는 발','짧은 약속','빛의 높이','느린 모서리','이어진 아침','접힌 복도','마지막 예행'],routes:['BBBBBB','BBBHBB','BHBBHB','BBHBBBHB','BHBHBB','BBBHHB','BBHBBHBB','BHHBBBHB','BHBBHHBB'],boss:'회랑의 문지기',bossRule:'chain',bossRoute:'BHBHBBHB',bossCue:'모든 장애물을 연속으로 통과하세요. 한 번의 충돌도 사슬을 끊습니다.'},
 {name:'유리 천장',subtitle:'뛰어야 할 때와 걷는 순간',motif:'glass-canopy',rhythm:[1.85,1.6,1.9,1.75,1.65,2.0],names:['천장 아래','멈춘 날개','낮은 창문','빛과 그늘','걸음의 틈','유리 계단','교대 신호','두 개의 높이','빈 하늘'],routes:['BGBBGB','BGBGBG','HGBBGB','BBGGHB','HGBGHB','BGGBHB','HGBHGBG','BGHGBBG','HGBGHGB'],boss:'유리 파수꾼',bossRule:'alternation',bossRoute:'HGBGPGBG',bossCue:'주황 바닥 장애물은 점프, 푸른 천장은 걸어서 통과하세요.'},
 {name:'쌍둥이 궤도',subtitle:'한 번의 도약으로 두 개의 문',motif:'twin-orbit',rhythm:[1.9,1.7,2.0,1.75,1.85,1.65],names:['나란한 점','쌍의 간격','한 번의 날개','둘과 하나','엇갈린 궤도','짝 없는 빛','쌍둥이 모서리','두 줄의 시','겹친 발자국'],routes:['BDBBDB','DBDBBD','DGBDGB','BDDGBB','DHDGBD','BDGDBD','DDGBHD','DGBDHD','DGDBDG'],boss:'쌍궤도 수문장',bossRule:'paired',bossRoute:'DGBDGD',bossCue:'붙어 있는 두 장애물은 한 번에 넘으세요. 허용 점프 수는 필요한 도약 수와 같습니다.'},
 {name:'꼭짓점 정원',subtitle:'가장 높은 순간을 맞추다',motif:'apex-garden',rhythm:[1.8,1.65,1.9,1.75,1.95,1.7],names:['꽃의 정점','높이의 약속','정확한 오후','세 번째 꽃잎','정원 가로질러','하늘의 열쇠','끝에 핀 꽃','정점의 리듬','고요한 절정'],routes:['PBBPBB','PBPBHB','PGPBBP','BPHPBP','PGBPHP','PPGBHP','PBPGBP','PHBPGP','PGBPHPG'],boss:'꼭짓점 정원사',bossRule:'apex',bossRoute:'PHPBPH',bossCue:'보랏빛 아치는 점프 최고점에서만 통과합니다. 일찍 준비해 중심을 맞추세요.'},
 {name:'침묵 도서관',subtitle:'오래 걷는 것도 하나의 선택',motif:'silent-pages',rhythm:[1.9,1.8,2.0,1.7,1.85,2.05],names:['접힌 책장','조용한 복도','긴 숨','문장 사이','말없는 점','책등의 그림자','빈 페이지','쉬어 가는 문','끝나지 않은 행'],routes:['BGLBHG','GLGPHG','BLDGBG','LPHGBG','BGLPBG','DGLGPH','PGLBDG','LBPHGL','DLPGLB'],boss:'침묵의 사서',bossRule:'rest',bossRoute:'BGLPGLDGL',bossCue:'긴 푸른 천장 아래에서는 점프하지 마세요. 천장이 끝난 뒤 다음 도약을 준비합니다.'},
 {name:'가속 공방',subtitle:'예고된 속도에 리듬을 바꾸다',motif:'clockwork',rhythm:[1.7,1.9,1.65,1.85,1.75,2.0],names:['첫 톱니','빨라지는 초침','느려진 맥박','회전의 틈','속도의 결','엇박 기어','두 번째 동력','변속의 창','태엽 끝'],routes:['BHPGBH','PHGBDB','DBPGHB','HGBPDG','BPGHPD','DGBPHB','PHDBGPG','DBPHGB','PGDBHPG'],boss:'태엽 조율자',bossRule:'acceleration',bossRoute:'BHGPDBHG',bossCue:'속도 변경이 먼저 예고됩니다. 느림·빠름·안정을 읽고 점프 시점을 바꾸세요.'},
 {name:'절약의 탑',subtitle:'불필요한 도약 없이 꼭 필요한 만큼',motif:'counted-steps',rhythm:[1.9,1.65,1.85,1.7,1.95,1.8],names:['한 칸의 여유','세어 보는 발','남겨 둔 날개','작은 저금통','낭비 없는 길','약속한 횟수','정확한 장부','한 번만 더','마지막 여백'],routes:['DGBGDB','BDGPDG','DGHGBD','PGDGBG','DGBDGP','BDGHDG','DGPGDB','PDGBDG','DGBPDG'],boss:'도약의 회계사',bossRule:'budget',bossRoute:'DGBDGPGB',bossCue:'필요한 점프만 사용하세요. 천장 앞의 빈 점프도 횟수에 포함됩니다.'},
 {name:'기억의 미로',subtitle:'다가오는 표식을 읽고 기억하다',motif:'memory-mosaic',rhythm:[1.85,1.7,1.95,1.65,1.9,1.8],names:['남은 잔상','뒤집힌 순서','기억의 조각','다시 본 신호','어제의 창','사라진 그림','세 갈래 기억','이어 붙인 길','새벽의 기록'],routes:['BGPGBH','PGHGBD','DGPBHG','HGBDGP','GPBHDG','BPDGHB','PGDGBHP','DGBPHG','PHGDBPG'],boss:'잔상의 기록자',bossRule:'memory',bossRoute:'BGPHDGPG',bossCue:'먼 장애물은 가려져도 다음 표식과 거리는 계속 보입니다. 표식 순서를 읽으세요.'},
 {name:'무결의 심장',subtitle:'한 번의 기회에도 침착하게',motif:'living-ribbon',rhythm:[1.8,1.7,1.9,1.65,1.85,1.75],names:['첫 맥박','흔들림 없이','작은 용기','선명한 걸음','하나의 생명','붉은 고요','깨지지 않는 선','두려움의 문','심장 앞에서'],routes:['HGPBHD','PDGBHG','HGBPDG','DPGHGB','PGHDGB','HDPGBG','PDGHBPG','DGPBHG','PHGDBPG'],boss:'하나뿐인 심장',bossRule:'fragile',bossRoute:'PHGDBHGP',bossCue:'이번 보스는 생명이 하나입니다. 모든 위험은 미리 보이며 충돌하면 즉시 재도전합니다.'},
 {name:'깨어나는 문',subtitle:'배운 모든 리듬으로 마지막 꿈을',motif:'woven-dawn',rhythm:[1.85,1.7,1.9,1.65,1.8,1.95],names:['모인 빛','열 번째 방향','쌍과 정점','정지와 도약','시간을 건너','기억의 높이','아홉 문의 잔향','새로운 경계','눈뜨기 직전'],routes:['DPGHBG','PGDBHP','DGPBHG','PLGDBH','HGDPGB','DPGHBP','PGLDHB','DHPGDB','PGDBHPG'],boss:'꿈의 직조자',bossRule:'synthesis',bossRoute:'DPGLHGPDBPGL',bossCue:'쌍장애물·정점·긴 천장·변속이 함께 옵니다. 마지막 표식까지 정해진 점프 안에 도달하세요.'}
];
const bosses={chain:'연속 사슬',alternation:'점프 / 지상 교대',paired:'쌍장애물의 한 도약',apex:'최고점 통과',rest:'긴 천장 아래 걷기',acceleration:'세 구간 변속',budget:'도약 수 제한',memory:'가려진 거리와 예고',fragile:'생명 하나',synthesis:'모든 규칙의 결합'};
const objective=(type,target,text)=>({type,target,text});
function buildLevel(c,slot){
 const chapter=c+1,design=designs[c],isBoss=slot===10,id=c*10+slot;
 const speed=120+c*3+((slot-1)%3)*2;
 const groupCount=isBoss?29+c:13+Math.floor(c/2)+((slot-1)%4);
 const route=isBoss?design.bossRoute:design.routes[slot-1];
 const hazards=[],speedChanges=[];let d=240+slot*7,activeSpeed=speed,jumpGroups=0,groundCount=0,apexCount=0;
 const tempo=isBoss&&(chapter===6||chapter===10)||!isBoss&&chapter>=6&&[2,5,8].includes(slot);
 const shiftA=Math.floor(groupCount/3),shiftB=Math.floor(groupCount*2/3);
 for(let i=0;i<groupCount;i++){
  // A speed transition takes place on a clear straight between encounters. The
  // new velocity is already stable well before the next jump's launch window.
  if(tempo&&(i===shiftA||i===shiftB)){
   const nextSpeed=i===shiftA?speed+16:speed-6;
   const at=d-activeSpeed*.68;
   speedChanges.push({at:Math.round(at*100)/100,speed:nextSpeed,cue:i===shiftA?'변속 예고 · 빨라집니다':'변속 예고 · 안정 속도'});
   activeSpeed=nextSpeed;
  }
  const symbol=route[i%route.length],group=i+1;
  function add(type,delta=0,width=18){
   const h={id:id+'-'+(hazards.length+1),d:Math.round((d+delta)*100)/100,type,width,group,jumpGroup:type==='beam'?null:jumpGroups+1};
   if(type==='beam')h.ceiling=10;else h.clearance=type==='precision'?40:type==='high'?30:17;
   hazards.push(h);
  }
  if(symbol==='G'||symbol==='L'){add('beam',0,symbol==='L'?90:22);groundCount++}
  else if(symbol==='D'){add('barrier');add('barrier',22);jumpGroups++}
  else{add(symbol==='P'?'precision':symbol==='H'?'high':'barrier');jumpGroups++;if(symbol==='P')apexCount++}
  const rhythm=design.rhythm[(i+slot-1)%design.rhythm.length];
  // Authored cadence differs by route and every third phrase adds a breath.
  const phraseBreath=i%5===4?.22:0;
  const slotAccent=!isBoss&&i%4===slot%4?.08*slot:0;
  d+=activeSpeed*(rhythm+phraseBreath+slotAccent);
 }
 const length=Math.ceil(hazards[hazards.length-1].d+Math.max(220,activeSpeed*1.5));
 const bossAttack=isBoss&&[3,6,10].includes(chapter)?'airstrike':isBoss?'dodge':null;
 let strikeCount=0;
 if(bossAttack==='airstrike'){
  const eligible=hazards.filter(h=>(h.type==='barrier'||h.type==='high')&&hazards.filter(other=>other.group===h.group).length===1);
  const count=Math.min(4,eligible.length);
  for(let i=0;i<count;i++){const h=eligible[Math.floor(i*eligible.length/count)];h.strike=true;strikeCount++}
 }
 const objectives=[objective('finish',1,'끝 지점까지 완주')];
 if(isBoss){
  if(chapter===1)objectives.push(objective('combo',hazards.length,'모든 장애물 연속 통과 '+hazards.length+'회'));
  if(chapter===2)objectives.push(objective('ground',groundCount,'천장 아래 지상 통과 '+groundCount+'회'));
  if(chapter===3)objectives.push(objective('jumps',jumpGroups,'점프 '+jumpGroups+'회 이하'),objective('passed',hazards.length,'장애물 전부 통과'));
  if(chapter===4)objectives.push(objective('perfect',Math.max(1,apexCount),'최고점 통과 '+apexCount+'회'));
  if(chapter===5)objectives.push(objective('ground',groundCount,'긴 천장 포함 지상 통과 '+groundCount+'회'));
  if(chapter===6)objectives.push(objective('combo',Math.ceil(hazards.length*.7),'변속 속 연속 통과 '+Math.ceil(hazards.length*.7)+'회'));
  if(chapter===7)objectives.push(objective('jumps',jumpGroups,'점프 '+jumpGroups+'회 이하'),objective('passed',hazards.length,'장애물 전부 통과'));
  if(chapter===8)objectives.push(objective('hits',0,'예고를 읽고 충돌 없이 완주'));
  if(chapter===9)objectives.push(objective('hits',0,'생명 하나로 무충돌 완주'));
  if(chapter===10)objectives.push(objective('jumps',jumpGroups,'점프 '+jumpGroups+'회 이하'),objective('perfect',Math.max(1,apexCount),'최고점 통과 '+apexCount+'회'),objective('hits',0,'모든 규칙을 무충돌로 통과'));
 }else{
  const combo=Math.ceil(hazards.length*(slot===7?.75:.55));
  if(slot===1)objectives.push(objective('passed',Math.ceil(hazards.length*.8),'장애물 통과 '+Math.ceil(hazards.length*.8)+'회'));
  if(slot===2||slot===7)objectives.push(objective('combo',combo,'연속 통과 '+combo+'회'));
  if(slot===3||slot===9)objectives.push(objective('hits',0,'충돌 없이 완주'));
  if(slot===4||slot===8)objectives.push(objective('jumps',jumpGroups+(slot===8?1:0),'점프 '+(jumpGroups+(slot===8?1:0))+'회 이하'));
  if(slot===5||slot===8||slot===9){const n=Math.max(1,Math.floor(jumpGroups*(slot===9?.6:.45)));objectives.push(objective('perfect',n,'최고점 통과 '+n+'회'))}
  if(slot===6)objectives.push(groundCount?objective('ground',groundCount,'천장 아래 지상 통과 '+groundCount+'회'):objective('passed',hazards.length,'장애물 전부 통과'));
  if(chapter===7&&!objectives.some(o=>o.type==='jumps'))objectives.push(objective('jumps',jumpGroups+1,'점프 '+(jumpGroups+1)+'회 이하'));
 }
 let seconds=0,last=0,v=speed;for(const change of speedChanges){seconds+=(change.at-last)/v;last=change.at;v=change.speed}seconds+=(length-last)/v;
 if(strikeCount)objectives.push(objective('strikes',strikeCount,'공중 반격 '+strikeCount+'회'));
 const heartLimit=isBoss&&chapter===9?1:3,bossHp=isBoss?Math.max(1,hazards.length+strikeCount-(heartLimit-1)):null;
 const name=isBoss?design.boss:design.names[slot-1];
 const bossRule=isBoss?design.bossRule:null;
 const cue=isBoss?design.bossCue+(strikeCount?' 표식 앞에서 점프한 뒤 공중에서 한 번 더 눌러 반격하세요.':''):(chapter===7?'필요한 도약만 사용하세요. ':chapter===4?'보라색 아치는 최고점에서 넘으세요. ':chapter===5?'긴 천장에서는 바닥을 따라 걸으세요. ':'')+(groundCount?'바닥 장애물은 점프, 천장은 지상 통과. ':'')+objectives.slice(1).map(o=>o.text).join(' · ');
 return {id,chapter,slot,name,isBoss,description:design.subtitle+' · '+(isBoss?bosses[bossRule]:'루트 '+slot+' / '+groupCount+'개 리듬 구간'),cue,speed,length,hazards,objectives,bossRule,bossAttack,theme:c,motif:design.motif+'-'+slot,palette:palettes[c],heartLimit,bossHp,speedChanges,revealDistance:chapter===8&&(isBoss||slot>=5)?(isBoss?240:300):null,recommendedJumps:jumpGroups,estimatedSeconds:Math.round(seconds*10)/10,difficulty:Math.min(10,chapter+(slot>=8?.5:0)),route};
}
const levels=[],chapters=[];for(let c=0;c<10;c++){for(let slot=1;slot<=10;slot++)levels.push(buildLevel(c,slot));chapters.push({id:c+1,name:designs[c].name,subtitle:designs[c].subtitle,levelIds:Array.from({length:10},(_,s)=>c*10+s+1),bossId:c*10+10,riddleId:c+1})}
// R6 keeps the exact R5 rule snapshot for validating already-earned clears.
// Saves use stable slot IDs. A migrated R5 clear is never reinterpreted as R6 play.
const legacyLevels=levels.map(level=>JSON.parse(JSON.stringify(level)));
const modeNames={'morph-floor':'움직이는 발판 생존','wave-run':'물결 지형 달리기','four-room':'네 방 동시 달리기','throw-arena':'네모 투척 대결','dodge-arena':'돌진 유도 대결','kick-arena':'공중 발차기 대결'};
function buildR6Level(old){
 const {id,chapter,slot,isBoss}=old,gameMode=isBoss?['throw-arena','dodge-arena','kick-arena'][(chapter-1)%3]:['morph-floor','wave-run','four-room'][(slot-1)%3];
 const boss=isBoss,speed=boss?100:112+chapter*2+(slot%3)*3,modeParams={variant:slot,chapter};
 let hazards=[],length,objectives,estimatedSeconds,bossHp=null,recommendedJumps=0;
 if(!boss){
  const groups=12+Math.floor(chapter/2)+Math.floor((slot-1)/3),types=gameMode==='morph-floor'?['barrier','gap','piston','gap','barrier','piston']:gameMode==='wave-run'?['barrier','beam','high','barrier','beam','precision']:['barrier','barrier','beam','high','barrier','beam'];
  let d=260;
  for(let i=0;i<groups;i++){
   const type=types[(i+Math.floor((slot-1)/3))%types.length],jumpGroup=type==='beam'?null:++recommendedJumps,room=gameMode==='four-room'?(i+chapter+slot)%4:0;
   const h={id:id+'-r6-'+(hazards.length+1),d:Math.round(d),type,width:type==='gap'?46:type==='beam'?26:type==='precision'?14:18,clearance:type==='gap'?8:type==='high'?29:type==='precision'?34:18,ceiling:10,jumpGroup,group:i+1,room,phase:(i+chapter)*.8};hazards.push(h);
   // Linked rooms sometimes demand one jump for two independently colliding bodies.
   if(gameMode==='four-room'&&type!=='beam'&&i%4===1)hazards.push({...h,id:id+'-r6-'+(hazards.length+1),d:h.d+12,room:(room+2)%4,clearance:18,type:'barrier'});
   d+=speed*(1.58+((i+slot)%4)*.11+(i%5===4?.22:0));
  }
  length=Math.ceil(d+130);estimatedSeconds=Math.round(length/speed*10)/10;
  const passTarget=hazards.length-2;
  objectives=[objective('finish',1,'하트가 남은 채 끝까지 생존'),objective('passed',passTarget,'위험 통과 '+passTarget+'회 이상 (두 번 실수 허용)')];
  if(gameMode==='four-room')objectives.push(objective('rooms',4,'네 방 모두에서 위험 통과'));
  if(slot===4||slot===6){const combo=Math.ceil(hazards.length*(slot===4?.55:.45));objectives.push(objective('combo',combo,'연속 통과 '+combo+'회'))}
  if(slot===5||slot===8){const perfect=Math.ceil(recommendedJumps*(slot===5?.45:.5));objectives.push(objective('perfect',perfect,'최고점 통과 '+perfect+'회'))}
  if(slot===7)objectives.push(objective('hits',0,'이번 도전은 충돌 없이 생존'));
  if(slot===8||slot===9)objectives.push(objective('jumps',recommendedJumps+(slot===8?1:0),'점프 '+(recommendedJumps+(slot===8?1:0))+'회 이하'));
  // R7 authored world-transform interpretation, not a claimed original fever mode.
  if([4,5,7,8].includes(slot))modeParams.worldTransform={start:length*.30,end:length*.68,ramp:speed*3,warning:speed*2,amplitude:gameMode==='morph-floor'?32:19};
  modeParams.duration=estimatedSeconds;modeParams.floorY=gameMode==='wave-run'?305:328;modeParams.scrollScale=gameMode==='four-room'?.38:.7;modeParams.roomCount=gameMode==='four-room'?4:1;
 }else{
  bossHp=4+Math.floor((chapter-1)/3);modeParams.hp=bossHp;modeParams.duration=gameMode==='throw-arena'?46:gameMode==='dodge-arena'?bossHp*3.6+7:bossHp*3.8+8;length=modeParams.duration*speed;estimatedSeconds=modeParams.duration;
  modeParams.cycle=gameMode==='dodge-arena'?3.6:gameMode==='kick-arena'?3.8:3.4;modeParams.cooldown=gameMode==='throw-arena'?.48:gameMode==='dodge-arena'?.32:.25;
  objectives=[objective('finish',1,'아레나 대결 완료'),objective('bossDamage',bossHp,'직접 상호작용으로 보스 격파 '+bossHp+'회')];
  if(gameMode==='throw-arena')objectives.push(objective('shots',bossHp,'직접 네모를 던져 명중시키기'));
  if(gameMode==='dodge-arena')objectives.push(objective('dodges',bossHp,'돌진을 피해서 벽 충돌 유도'));
  if(gameMode==='kick-arena')objectives.push(objective('kicks',bossHp,'떠오른 뒤 발차기로 접촉하기'));
 }
 const cues={
  'morph-floor':'자동으로 달립니다. 빈 발판과 솟는 네모 앞에서 한 번 눌러 점프하세요.',
  'wave-run':'물결 지형을 자동으로 달립니다. 벽은 점프, 푸른 천장은 누르지 말고 통과하세요.',
  'four-room':'네 방의 몸이 함께 움직입니다. 어느 방이든 위험이 오면 한 번 눌러 모두 점프하세요.',
  'throw-arena':'한 번 누르면 오른쪽으로 네모를 던집니다. 보스가 투척 높이에 내려올 때 명중시키세요.',
  'dodge-arena':'한 번 누를 때마다 오른쪽 다음 칸으로 피합니다. 붉은 돌진 예고 칸을 비우면 보스가 벽에 부딪힙니다.',
  'kick-arena':'한 번 눌러 떠오른 뒤, 보스와 가까운 공중에서 다시 눌러 발차기하세요.'
 };
 return {...old,contentVersion:6,gameMode,modeParams,name:old.name,description:modeNames[gameMode]+' · 새로 설계한 원버튼 규칙 (원작 개별 스테이지 복원 아님)',cue:cues[gameMode]+(!boss?' '+objectives.slice(2).map(o=>o.text).join(' · '):''),speed,length,hazards,objectives,bossHp,bossRule:boss?gameMode:null,bossAttack:boss?gameMode:null,heartLimit:3,speedChanges:[],revealDistance:null,recommendedJumps,estimatedSeconds,route:gameMode+'-'+chapter+'-'+slot,fidelity:boss?'secondary-inspired-authored':'primary-inspired-authored'};
}
// Vertical slices are verified before expanding the same modes across all slots.
const R6_SLICE_IDS=new Set([1,2,3,10,20,30]);
// Six action-only slice proofs are archived in qa/r6/six-vertical-slices.json.
for(let i=0;i<levels.length;i++)levels[i]=buildR6Level(levels[i]);
const riddles=[
 {id:1,chapter:1,earnedClue:'문지기를 넘은 발밑에, 달리는 몸과 닮은 검은 모양이 남았습니다.',prompt:'문지기를 넘은 발밑을 보세요. 빛이 있으면 발밑에서 태어나고, 빛이 사라지면 나도 사라집니다. 당신의 움직임을 따라 모양이 바뀌는 나는?',hints:['달리는 인물의 발밑에 몸을 닮은 모양이 있어요.','바닥이나 벽에 빛이 가려진 모습으로 나타나요.','정답은 “그림자”입니다. 직접 입력하면 문이 열립니다.']},
 {id:2,chapter:2,earnedClue:'높음과 낮음이 되풀이되듯, 소리도 제자리로 돌아올 수 있습니다.',prompt:'유리 파수꾼은 높고 낮은 신호를 되풀이했습니다. 빈 골짜기에 말을 건네면, 새 말은 만들지 않고 당신의 말을 되돌려 주는 나는?',hints:['교대 신호의 반복을, 소리의 반복으로 생각해 보세요.','산이나 빈 공간에서 같은 소리가 되돌아와요.','정답은 “메아리”입니다. 직접 입력해 주세요.']},
 {id:3,chapter:3,earnedClue:'둘을 하나의 박자로 넘었습니다. 서로 다른 두 바늘도 하나의 시간을 가리킵니다.',prompt:'쌍궤도에서 두 장애물을 한 도약으로 넘었습니다. 두 손이 쉬지 않고 돌지만 물건을 잡지는 못합니다. 오늘의 시간을 알려 주는 나는?',hints:['쌍장애물처럼 둘이 함께 움직여요. 여기의 두 손은 바늘이에요.','짧은 바늘과 긴 바늘이 시간을 가리켜요.','정답은 “시계”입니다. 직접 입력해 주세요.']},
 {id:4,chapter:4,earnedClue:'정원의 꼭짓점을 지나 더 높은 밤하늘을 올려다봅니다.',prompt:'정원의 꼭짓점보다 더 높은 밤하늘에 있습니다. 스스로 빛을 만들지 않지만 밤하늘에서 빛납니다. 지구 곁을 돌며 둥글었다 가늘어지는 나는?',hints:['가장 높은 점프보다 먼 밤하늘에서 태양빛을 받아 밝게 보여요.','보름에는 둥글고 초승에는 가늘어요.','정답은 “달”입니다. 직접 입력해 주세요.']},
 {id:5,chapter:5,earnedClue:'긴 천장 아래에서 도약을 쉬니, 발소리마저 작아졌습니다.',prompt:'긴 천장 아래에서는 뛰지 않고 기다렸습니다. 모두가 말을 멈추면 찾아옵니다. 작은 한마디만으로도 깨지는 조용한 상태인 나는?',hints:['긴 천장에서 도약을 쉬었던 것처럼, 소리도 쉬는 상태예요.','“조용함”과 비슷한 두 글자 낱말이에요.','정답은 “침묵”입니다. 직접 입력해 주세요.']},
 {id:6,chapter:6,earnedClue:'빠르고 느린 속도 변화는 나뭇잎을 흔드는 보이지 않는 흐름을 닮았습니다.',prompt:'공방의 속도 변화처럼, 빨라졌다 잦아들 수 있습니다. 모습은 보이지 않지만 나뭇잎을 흔듭니다. 창문을 열면 뺨을 스치고 지나가는 나는?',hints:['속도가 달라져도 모습은 보이지 않는, 움직이는 공기예요.','세게 불면 나무와 깃발이 흔들려요.','정답은 “바람”입니다. 직접 입력해 주세요.']},
 {id:7,chapter:7,earnedClue:'도약을 아껴 탑의 잠긴 문 앞에 도착했습니다. 작은 도구 하나가 남은 문을 엽니다.',prompt:'도약을 아껴 도착한 탑의 문이 잠겨 있습니다. 자물쇠의 작은 구멍에 들어가 돌면 잠긴 문을 열어 줍니다. 문마다 맞는 모양을 가진 나는?',hints:['아낀 도약으로 도착한 문을 열 도구예요. 보통 손바닥보다 작아요.','자물쇠와 한 쌍을 이루어요.','정답은 “열쇠”입니다. 직접 입력해 주세요.']},
 {id:8,chapter:8,earnedClue:'길이 가려져도 방금 본 표식의 순서는 마음속에 남았습니다.',prompt:'가려진 길에서도 방금 본 표식을 떠올렸습니다. 지나간 순간은 되돌릴 수 없지만, 마음속에 남겨 다시 떠올릴 수 있습니다. 어제의 장면을 간직하는 능력은?',hints:['가려진 다음 길을 준비할 때 썼어요. 사진 없이도 어제를 떠올릴 수 있어요.','잊음의 반대에 가까운 두 글자 낱말이에요.','정답은 “기억”입니다. 직접 입력해 주세요.']},
 {id:9,chapter:9,earnedClue:'생명 하나로 마지막 장애물을 넘자, 가슴속 박자가 또렷하게 들립니다.',prompt:'생명 하나를 지켜 낸 뒤 가슴속 박자를 들어 보세요. 가슴 안에서 쉬지 않고 뛰며 온몸으로 피를 보냅니다. 생명의 박자를 만드는 기관인 나는?',hints:['생명 하나를 나타낸 모양을 떠올려 보세요. 우리 몸의 기관이에요.','맥박의 시작이 되는 곳이에요.','정답은 “심장”입니다. 직접 입력해 주세요.']},
 {id:10,chapter:10,earnedClue:'열 가지 리듬을 엮어 마지막 문에 도착했습니다. 이제 이 밤의 모험에 이름을 붙일 차례입니다.',prompt:'열 가지 리듬으로 엮은 밤의 모험입니다. 잠든 동안 머릿속에서 펼쳐지는 이야기입니다. 눈을 뜨면 희미해지기도 하는 밤의 모험은?',hints:['지금 달려온 열 장의 밤 세계를 하나로 부르는 말이에요.','잠을 자는 동안 꾸는 한 글자 낱말이에요.','정답은 “꿈”입니다. 직접 입력하면 마지막 기록이 완성됩니다.']}
];
const r6Story=[
 ['던진 네모가 문지기에게 닿자 문이 열립니다. 달리는 몸 아래 검은 모양이 길게 누웠습니다.','빛이 있으면 발밑에서 태어나고, 빛이 사라지면 사라집니다. 당신의 움직임을 따라 모양이 바뀌는 나는?','몸을 따라 움직이는 발밑의 검은 모양을 보세요.'],
 ['돌진을 피하자 문지기는 빈 칸 끝의 벽에 부딪혔습니다. 충돌 소리가 방을 돌아 되돌아옵니다.','빈 방에 말을 건네면 새 말은 만들지 않고 당신의 말을 되돌려 줍니다. 되돌아오는 소리인 나는?','벽에 부딪힌 소리가 같은 방으로 돌아오는 모습을 떠올리세요.'],
 ['떠올라 발차기를 맞힌 뒤 바닥으로 돌아왔습니다. 문지기의 열림과 닫힘은 일정한 간격으로 반복됩니다.','두 바늘이 쉬지 않고 돌며 오늘의 시간을 알려 줍니다. 시간을 재는 이 물건은?','반복되는 대결의 간격처럼 시간을 세는 물건이에요.'],
 ['문지기가 내려오는 순간 네모를 던졌습니다. 잠잠해진 방 위로 둥근 빛이 떠오릅니다.','스스로 빛을 만들지 않지만 밤하늘에서 빛납니다. 지구 곁을 돌며 둥글었다 가늘어지는 나는?','밤하늘에서 태양빛을 받아 밝게 보여요.'],
 ['예고된 칸을 비우자 마지막 돌진이 벽에서 멎었습니다. 쿵 소리 뒤 방 안이 조용해집니다.','모두가 말을 멈추면 찾아옵니다. 작은 한마디만으로도 깨지는 조용한 상태인 나는?','돌진과 충돌 소리가 모두 멈춘 뒤의 상태예요.'],
 ['공중으로 떠올라 문지기에 발을 뻗었습니다. 내려오는 몸 옆으로 보이지 않는 흐름이 스칩니다.','모습은 보이지 않지만 나뭇잎을 흔듭니다. 창문을 열면 뺨을 스치는 움직이는 공기는?','떠오른 몸을 스쳐 가는 공기의 흐름을 생각해 보세요.'],
 ['던진 네모가 마지막 틈에 닿자 잠긴 문이 반짝입니다. 문 앞에 작은 도구 하나가 남았습니다.','자물쇠의 작은 구멍에 들어가 돌면 잠긴 문을 열어 줍니다. 문마다 맞는 모양을 가진 나는?','마지막 문을 여는 데 필요한 작은 도구예요.'],
 ['붉은 예고 칸을 보고 미리 옆 칸으로 피했습니다. 사라진 예고도 마음속에는 남아 있습니다.','지나간 순간은 되돌릴 수 없지만 마음속에 남겨 다시 떠올릴 수 있습니다. 어제의 장면을 간직하는 능력은?','사라진 돌진 예고를 떠올릴 때 쓰는 능력이에요.'],
 ['마지막 공중 발차기 뒤 바닥에 내려섰습니다. 숨을 고르자 가슴속 박자가 또렷합니다.','가슴 안에서 쉬지 않고 뛰며 온몸으로 피를 보냅니다. 생명의 박자를 만드는 기관인 나는?','우리 몸 안에서 맥박을 만드는 기관이에요.'],
 ['움직이는 발판, 물결의 길, 네 방과 세 대결을 지나 마지막 문에 도착했습니다. 이 밤의 모험에 이름을 붙일 차례입니다.','잠든 동안 머릿속에서 펼쳐지는 이야기입니다. 눈을 뜨면 희미해지기도 하는 밤의 모험은?','지금 지나온 열 장의 밤 세계를 하나로 부르는 말이에요.']
];
for(let i=0;i<riddles.length;i++){riddles[i].earnedClue=r6Story[i][0];riddles[i].prompt=r6Story[i][1];riddles[i].hints[0]=r6Story[i][2]}
for(const riddle of riddles)levels[riddle.chapter*10-1].clearClue=riddle.earnedClue;
const answers=[['그림자','shadow'],['메아리','echo'],['시계','clock'],['달','moon'],['침묵','silence'],['바람','wind'],['열쇠','key'],['기억','memory'],['심장','heart'],['꿈','dream']];
function cleanAnswer(answer){return typeof answer==='string'&&answer.length<=256?answer.normalize('NFKC').trim().toLowerCase().replace(/[\s.,!?。？！“”‘’'"·_-]/g,''):''}
function validId(id,max){return Number.isInteger(id)&&id>=1&&id<=max?id:null}
function getLevel(id){const n=validId(id,100);return n===null?null:levels[n-1]}
function checkAnswer(id,answer){const n=validId(id,10),value=cleanAnswer(answer);return n!==null&&value.length>0&&answers[n-1].includes(value)}
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const key of Object.keys(value))freeze(value[key])}return value}
// The migration snapshot lives in a closure, outside content's public tree.
// Freeze it explicitly so callers cannot rewrite the rules for earned R5 clears.
freeze(legacyLevels);
const getLegacyLevel=id=>validId(id,100)===null?null:legacyLevels[id-1];
// A separate, authored four-edge survival route. Not an original mission port.
// Numeric campaign IDs and their migration snapshots deliberately remain untouched.
const originRoute={id:'origin-inspired-v1',title:'네 변의 여정',provenance:'independent-reconstruction-not-original-port',speed:120,length:1104*8,revealDistance:330,heartLimit:3,
 chapters:[
  {id:'origin-square',name:'네 변의 방',start:0,end:2208,description:'한 사람 · 네 변 · 안쪽으로 점프'},
  {id:'origin-pressure',name:'좁아지는 방',start:2208,end:4416,description:'벽이 이동해도 달리는 선은 이어진다'},
  {id:'origin-lean',name:'기울어진 방',start:4416,end:6624,description:'쌓인 변형 위에서 다음 위험을 읽는다'},
  {id:'origin-return',name:'겹쳐진 방',start:6624,end:8832,description:'네 번째 방 끝까지 살아남는다'}
 ],
 // Each target persists until the next authored transformation; no random speed ramp.
 transforms:[{sx:1,sy:.96,skew:0},{sx:.94,sy:.96,skew:0},{sx:.88,sy:.96,skew:0},{sx:.88,sy:.88,skew:0},{sx:.88,sy:.88,skew:.07},{sx:.92,sy:.88,skew:-.06},{sx:.92,sy:.94,skew:.035},{sx:1,sy:1,skew:0}],
 // Chapter 3: jump at 5660, land, withhold under 5850, then jump at 6010.
 // The ceiling is 54 units beyond the corner; all three resolve before the next morph.
 routeRule:'late-choice-v3',
 hazards:Array.from({length:32},(_,i)=>({id:'origin-hazard-'+i,d:i===21?5850:i===22?6010:i*276+(i<8?140:i%3===0?214:140),width:[10,13,21].includes(i)?40:18,clearance:12,type:[10,13,21].includes(i)?'ceiling':'barrier',...([10,13,21].includes(i)?{floor:28}:{}),chapter:1+Math.floor(i/8)})),
 objectives:[{type:'finish',target:1,text:'네 개의 방 끝까지 생존'}]
};
// Reuses independently authored projectile mechanics, never numeric campaign rewards.
const originFinale={...levels[9],id:'origin-finale-v1',name:'사각의 문지기',description:'독립 설계한 사각 셀 결말 · 투척으로 문지기 격파',provenance:'independent-reconstruction-not-original-port',route:'origin-finale',objectives:[{type:'finish',target:1,text:'사각 문지기 격파'},{type:'bossDamage',target:4,text:'실제 투사체 명중 4회'}]};
const content=freeze({schema:6,contentVersion:6,provenance:'original-independent-design-not-exact-restoration',modeNames,levels,chapters,riddles,originRoute,originFinale,getLevel,getLegacyLevel,checkAnswer});root.QuadRiftContent=content;if(typeof module!=='undefined')module.exports=content;
})(globalThis);
