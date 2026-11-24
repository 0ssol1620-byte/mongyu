/* R105 English phrases for the Dream Isle screen (dream-isle.js). Registers into MongyuI18n (merged with i18n-en.js). Keys are the exact Korean source strings. */
(function(root){'use strict';
if(root.MONGYU_UI_EDITION!==true||!root.MongyuI18n?.register)return;
root.MongyuI18n.register('en',{},{phrases:{
 '꿈의 섬':'Dream Isle','기억판':'Memory board','섬':'Isle','목록':'List','보기 방식':'View','잠김':'Locked',
 '기억의 별 찾음':'Memory star found','기억의 별 아직':'Memory star not found yet','네모를 눌러 보세요':'Tap a square',
 '달리기':'Run','아직 문을 못 열었어요':"Haven't opened the gate yet",'아직 가 보지 않았어요':"Haven't been here yet"
},patterns:[
 [/^별 (\d+) \/ (\d+)$/,'Stars $1 / $2'],
 [/^기억의 별 (\d+) \/ (\d+)$/,'Memory stars $1 / $2'],
 [/^최고 ([\d,]+)점$/,'Best $1'],
 [/^가장 빠른 길 (\d+:\d\d)$/,'Fastest $1'],
 [/^‘(.+)’ 완주가 필요해요$/,'Finish “$t1” first']
]});
})(globalThis);
