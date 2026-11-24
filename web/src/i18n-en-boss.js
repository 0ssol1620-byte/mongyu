/* R105 English phrases for the five chapter bosses (boss-act.js): boss names and cards, phase names, telegraph lines, coach lines, fail causes, victory captions. Registers into MongyuI18n (merged with i18n-en.js).
   Keys are the exact Korean source strings of boss-act.js; coverage is checked by web/tests/r105-boss-i18n.test.cjs. Owned by workstream BOSS. */
(function(root){'use strict';
if(root.MONGYU_UI_EDITION!==true||!root.MongyuI18n?.register)return;
root.MongyuI18n.register('en',{},{phrases:{
 // shared UI
 '보스':'Boss','부딪혔어요':'You hit something','탭: 점프':'Tap: jump','완벽!':'Perfect!','다른 문':'Odd door','누르지 말고 기다려':'Don\'t press. Wait.','곧 도시가 돌아가요':'The city is about to turn','발밑이 바닥이야':'Your feet are still the floor',
 '1페이즈부터 다시':'Back to phase 1','2페이즈부터 다시':'Back to phase 2','3페이즈부터 다시':'Back to phase 3','보스를 넘었어요.':'Boss cleared.',
 // B01 cube
 '큐브':'The Cube','여섯 면의 규칙':'The rule of six faces',
 '면 전환':'Face switch','불 켜진 면의 블록이 와':'Blocks come from the lit face','바닥 면이면 뛰고, 천장 면이면 가만히':'Floor face: jump. Ceiling face: stay put.',
 '바닥 면 블록에 부딪혔어요':'You hit a floor-face block','천장 면 블록에 머리를 부딪혔어요':'You bumped your head on a ceiling-face block',
 '연결 정렬':'Link alignment','두 조각이 맞물릴 때 탭':'Tap when the two pieces meet','어긋난 다리가 맞는 순간에 탭':'Tap the moment the crooked bridge lines up','다리가 이어지기 전에 떨어졌어요':'You fell before the bridge linked',
 '반대 면 개방':'Open opposite faces','높이 뛰어 두 면을 함께 열어':'Jump high and open both faces at once','점프 꼭대기에서 위아래 판이 만나':'The top and bottom plates meet at the peak of a jump','반대 면이 한쪽만 열렸어요':'Only one of the opposite faces opened',
 '큐브가 발레 인사를 했어':'The cube took a ballet bow','각 면이 다 열렸어':'Every face is open',
 // B02 toy king
 '장난감 왕':'Toy King','건전지는 어디 넣나':'Where do the batteries go?',
 '크기 변화':'Size change','커졌다 작아져. 도착할 때 크기가 답':'It grows and shrinks. The size on arrival is the answer.','점선이 도착할 때의 크기야':'The dotted line is its size on arrival','커진 블록에 부딪혔어요':'You hit the grown block',
 '변신 통로':'Morph corridor','바닥은 구멍으로, 구멍은 천장으로':'Floor becomes a hole, hole becomes a ceiling','변한 모양을 보고 뛰거나 기다려':'Read the new shape: jump or wait','바닥이 구멍으로 변했어요':'The floor turned into a hole','변신한 천장에 부딪혔어요':'You hit the morphed ceiling',
 '작은 열쇠 길':'Small key path','몸이 작아져. 점프도 작게':'You shrink. Jumps get small too.','작은 점프로 열쇠 이빨을 넘어':'Hop over the key teeth with small jumps','열쇠 이빨에 걸렸어요':'You caught on a key tooth',
 '건전지 없이 잠들었어':'It fell asleep with no batteries','왕이 열쇠만 한 크기가 됐어':'The king is the size of a key now',
 // B03 city
 '도시':'The City','길을 다시 접는 도시':'A city that folds the road again',
 '코너':'Corner','길이 꺾이는 곳엔 틈이 있어':'There is a gap where the road bends','꺾이는 곳 앞에서 탭':'Tap before the bend','코너의 틈에 빠졌어요':'You fell into the corner gap','길모퉁이 블록에 부딪혔어요':'You hit a block at the corner',
 '착시 정렬':'Illusion alignment','어긋난 길이 맞는 순간 탭':'Tap the moment the crooked road lines up','두 길이 겹치는 순간에 탭':'Tap when the two roads overlap','어긋난 길에서 떨어졌어요':'You fell off the crooked road',
 '도시 회전':'City rotation','도시가 돌아도 발밑이 바닥':'The city turns, your feet are still the floor','돌아가는 동안은 길이 비어 있어':'The road is empty while it turns','돌아간 도시의 블록에 부딪혔어요':'You hit a block in the turned city','돌아간 도시에 머리를 부딪혔어요':'You bumped your head in the turned city','돌아간 도시의 틈에 빠졌어요':'You fell into a gap in the turned city',
 '도시가 작은 모형이 됐어':'The city became a tiny model','길이 제자리로 접혔어':'The road folded back into place',
 // B04 reflector
 '반사체':'The Reflection','과거를 기억하는 거울':'A mirror that remembers the past',
 '거울':'Mirror','거울 속 내가 한 박자 늦게 따라 해':'Mirror me copies you one beat late','내 탭은 한 박자 뒤 거울에도 닿아':'Your tap reaches the mirror one beat later','내가 블록에 부딪혔어요':'You hit a block','거울 속 내가 부딪혔어요':'Mirror you hit a block',
 '고스트':'Ghost','그림자는 과거의 내 입력이야. 따라 하지 마':'The shadow is your own past input. Don\'t copy it.','그림자 말고 내 길만 봐':'Ignore the shadow, watch your own road','내 쪽 블록에 부딪혔어요':'You hit a block on your side',
 '함께 작동':'Work together','그림자와 동시에 뛰어 발판을 눌러':'Jump together with the shadow to press the plate','그림자가 뛰는 곳에서 같이 뛰어':'Jump where the shadow jumps','함께 누르지 못했어요':'You didn\'t press it together',
 '둘이 서로 절했어':'The two bowed to each other','서로 한 번 절했어':'They bowed once, together',
 // B05 no exit
 '없는 출구':'No Exit','모든 길이 한 복도로':'Every road ends in one corridor',
 '다른 문 찾기':'Find the odd door','같은 문 중 하나만 달라':'Only one of the identical doors is different','모양이 다른 문에서만 탭':'Tap only at the door with a different shape','같은 문에서 눌렀어요':'You pressed at an identical door','다른 문을 지나쳤어요':'You walked past the odd door','트렁크에 부딪혔어요':'You hit a trunk',
 '표지 반전':'Sign inversion','표지판이 거짓말을 해':'The signs are lying','표지판 말고 앞의 장애물을 봐':'Watch the obstacle, not the sign','바닥 블록에 부딪혔어요':'You hit a floor block','천장 블록에 머리를 부딪혔어요':'You bumped your head on a ceiling block','표지판을 믿었어요':'You trusted the sign',
 '멈춤':'Stop','이번엔 아무것도 누르지 마':'Don\'t press anything this time','멈추면 화면에서 손을 떼':'When it stops, take your hand off','멈춰야 할 때 눌렀어요':'You pressed when you had to stop',
 '출구 표지판이 따라왔어':'The exit sign followed you','복도가 끊어졌어':'The corridor broke apart'
},patterns:[
 // the course HUD label: "title · 1/1 boss" (act counter + act name)
 [/^(\d+)\/(\d+) (.+)$/,'$1/$2 $t3']
]});
})(globalThis);
