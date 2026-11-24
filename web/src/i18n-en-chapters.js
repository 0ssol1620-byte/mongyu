/* R105 English phrases for chapters 1-5 of the dream road: chapter and course names, monologue intros and endings, chapter tabs and the new acts. Registers into MongyuI18n (merged with i18n-en.js).
   Keys are the exact Korean source strings; composite lines ("a · b", "a\nb") are split by the runtime, so intro lines are registered one by one. Owned by workstream CP. */
(function(root){'use strict';
if(root.MONGYU_UI_EDITION!==true||!root.MongyuI18n?.register)return;
root.MongyuI18n.register('en',{},{phrases:{
 // chapter 1 (renamed) and the monologue around it
 '자각몽의 정원':'Lucid Garden','접힌 길 위의 우아한 한 걸음':'One graceful step on a folded road',
 '꿈인 줄 알면서 걷네.':'I know it\'s a dream, and I\'m walking anyway.','나는 꽤 우아한 것 같아.':'I think I\'m rather graceful.','문이 열렸어. 우아함은 비밀이야.':'The door opened. Grace is a secret.',
 // chapters (title, subtitle) and the monologue around them
 '잊혀진 유년기':'Forgotten Childhood','작은 것들이 커 보이는 놀이터':'A playground where small things look big',
 '불가능한 도시':'Impossible City','이어지지 않는 길이 이어진다':'Roads that don\'t connect, connect',
 '또 다른 나':'The Other Me','거울 속 한 박자 뒤':'One beat behind in the mirror',
 '경계의 호텔':'Liminal Hotel','같은 복도를 몇 번째 걷는 중':'Walking the same corridor again',
 '나도 한때는 작았다.':'I was small once.','지금도 작다.':'I still am.','장난감 왕도 건전지가 나갔네.':'Even the toy king ran out of batteries.',
 '허가 받고 지었나.':'Did they get a permit for this?','계단이 서로 모른 척하네.':'The stairs are pretending not to know each other.','출구는 처음 길 바로 옆이었네.':'The exit was right next to where I started.',
 '쟤가 나보다 잘생겼네':'He\'s better looking than me','쟤가 나보다 잘생겼네.':'He\'s better looking than me.','한 박자 늦게 따라오는걸.':'He follows one beat late.','서로 절했어. 나쁘지 않은걸.':'We bowed to each other. Not bad.',
 '예약 안 했는데.':'I didn\'t book a room.','누르지 않으면 열리려나.':'Maybe it opens if I don\'t press.','출구는 처음부터 나였네.':'The exit was me all along.',
 // chapter 2
 '빈 놀이터':'Empty Playground','그네가 돌아오는 간격':'The beat of the swing coming back',
 '고무 길':'Rubber Road','바닥이 하품하는 길':'A road where the floor yawns',
 '아주 작은 집':'A Very Small House','전용면적이 너무 작네':'The floor area is awfully small',
 '칠판':'Chalkboard','지워지는 발판 앞으로':'Ahead of the erasing steps',
 '장난감 왕':'Toy King','건전지는 어디 넣나':'Where do the batteries go?',
 // chapter 3
 '가로등':'Streetlamp','벽 방향으로 달리기':'Run toward the wall',
 '계단 면허':'Stair License','허가는 받았나 몰라':'Not sure it was permitted',
 '뒤집힌 횡단보도':'Upside-Down Crosswalk','탭 한 번에 위아래가 바뀌어요':'One tap swaps up and down',
 '우회로':'Detour','틀린 길이 맞는 길':'The wrong road is the right one',
 '도시':'The City','길을 다시 접는 도시':'A city that refolds its roads',
 // chapter 4
 '반사':'Reflection','거울의 거짓말':'The Mirror\'s Lie','거울에만 보이는 위험':'Danger only the mirror shows',
 '지난 나':'Past Me','과거의 내가 일하네':'Past me is on the job',
 '미러 발레':'Mirror Ballet','둘이 같은 포즈라 민망':'Awkward, we struck the same pose',
 '반사체':'The Reflection','과거 입력을 기억하는 상대':'Someone who remembers my past inputs',
 // chapter 5
 '체크인':'Check-In','예약 안 했는데':'I didn\'t book a room',
 '엘리베이터':'Elevator','누르지 않고 기다리기':'Wait without pressing',
 '복도 끝':'End of the Hall','뛰었는데 제자리네':'I ran, but I\'m still here',
 '방해 금지':'Do Not Disturb','아무것도 안 하기':'Do nothing',
 '없는 출구':'No Exit','모든 길이 한 복도로 모여요':'Every road gathers into one corridor',
 // chapter tabs and locks
 '장 선택':'Chapters','잠김':'Locked','앞 장을 완주하면 열려요':'Finish the previous chapter to unlock',
 // new acts
 '사각 방':'Square room','중력 뒤집기':'Gravity flip','거울':'Mirror',
 '탭하면 중력이 뒤집혀':'Tap to flip gravity','수정에 부딪혔어요':'You hit a crystal',
 '거울 속 내가 한 박자 늦게 뛰어':'Mirror me jumps one beat late','거울 속 내가 부딪혔어요':'Mirror you hit a block','거울 속 내가 먼저 부딪혔어':'Mirror me crashed first',
 '탭하면 점프. 엘리베이터 앞에선 가만히':'Tap to jump. Stand still at the elevator','누르지 말고 기다려':'Don\'t press. Wait.',
 '엘리베이터 버튼을 눌렀어요':'You pressed the elevator button','눌렀더니 층이 도망갔어':'I pressed it and the floor ran away','트렁크에 부딪혔어요':'You hit a trunk',
 '사각 방에서 길이 끊겼어요':'The road broke in the square room','중력 뒤집기에서 길이 끊겼어요':'The road broke in the gravity flip','거울에서 길이 끊겼어요':'The road broke in the mirror','엘리베이터에서 길이 끊겼어요':'The road broke at the elevator'
},patterns:[
 [/^(\d+)장 (.+), 별 (\d+) \/ (\d+)$/,'Chapter $1 $t2, stars $3 / $4'],
 [/^(\d+)장 (.+), 잠김\. 앞 장의 마지막 코스를 완주하면 열려요\.$/,'Chapter $1 $t2, locked. Finish the last course of the previous chapter to unlock.'],
 [/^(.+), 잠김\. 앞 장을 완주하면 열려요\.$/,'$t1, locked. Finish the previous chapter to unlock.'],
 [/^앞 장의 마지막 코스 「(.+)」를 완주하면 열려요$/,'Finish the last course of the previous chapter, "$t1", to unlock'],
 [/^새 장이 열렸어요 · (\d+)장 (.+)$/,'New chapter unlocked · Chapter $1 $t2'],
 [/^다음 장 · (.+)$/,'Next chapter · $t1'],
 [/^(\d+)장 (.+)$/,'Chapter $1 $t2'],
 [/^★ (\d+)$/,'★ $1']
]});
})(globalThis);
