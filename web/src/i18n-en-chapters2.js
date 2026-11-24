/* R105 English phrases for chapters 6-10 of the dream road (c26-c50): chapter and course names, monologue intros and endings, and the new acts eye / liquid / rhythm (coach lines, fail reasons, canvas labels).
   Registers into MongyuI18n after i18n-en-chapters.js. Keys are the exact Korean source strings; composite lines are split by the runtime, so intro lines are registered one by one. Owned by workstream CH610. */
(function(root){'use strict';
if(root.MONGYU_UI_EDITION!==true||!root.MongyuI18n?.register)return;
root.MongyuI18n.register('en',{},{phrases:{
 // chapters (title, subtitle) and the monologue around them
 '누군가 보고 있다':'Someone Is Watching','눈이 감길 때만 움직이는 무대':'A stage where you move only when the eye shuts',
 '누가 보고 있나 봐.':'Somebody\'s watching, I think.','눈치 좀 봐야겠는걸.':'I\'d better read the room.','눈이 쉬러 갔네. 나도 쉬자.':'The eye went to rest. Let me rest too.',
 '녹아내리는 현실':'Liquid Reality','단단한 건 처음부터 없었다':'Nothing was solid to begin with',
 '나 지금 고체 맞아?':'Am I still solid?','붙잡는 게 아니었나.':'Guess holding on was the wrong idea.','액체 왕이 컵에 들어갔네.':'The Liquid King climbed into a cup.',
 '색채의 섬망':'Chromatic Delirium','박동이 길이 되는 홀':'A hall where the pulse becomes the road',
 '박자가 몸에 들어오네.':'The beat is getting into me.','너 박자 좀 다른데. 좋아.':'Your beat is a bit different. I like it.','음악 끝에 서로 인사했어.':'We bowed to each other at the end of the music.',
 '절대적인 무':'Absolute Nothing','선 하나만 남은 길':'A road with only one line left',
 '조용하네.':'So quiet.','아무것도 없는데 꽤 넓네.':'Nothing here, and yet it\'s so wide.','선 하나가 별이 됐네.':'The one line turned into a star.',
 '각성':'Awakening','모든 길이 하나의 틀로':'Every road into one frame',
 '여기 알아. 아마도.':'I know this place. Probably.','달리는 게 전부인 줄 알았는데.':'I thought running was everything.','문이 열렸네. 밥 먹을래?':'The door opened. Want to get something to eat?',
 // chapter 6
 '눈치':'Reading the Room','눈이 감길 때 움직이기':'Move when the eye closes',
 '스포트라이트':'Spotlight','불빛 안에서는 움직여도 돼요':'Inside the light, you may move',
 '관객':'Audience','객석에서 지켜보는 얼굴들':'Faces watching from the seats',
 '무대 뒤':'Backstage','프레임 바깥의 진짜 길':'The real road outside the frame',
 '관찰자':'The Observer','세 번 바뀌는 시선':'A gaze that changes three times',
 // chapter 7
 '물렁한 틀':'Soft Frame','바닥이 입을 벌리는 박자':'The beat of the floor opening its mouth',
 '종이':'Paper','물방울':'Droplet','뭉쳤다 풀리는 길':'A road that gathers and lets go',
 '잉크':'Ink','번지는 길을 박자로 읽기':'Reading the bleeding road by its beat',
 '종이 인간':'Paper Person','접었다 펴는 몸':'A body that folds and unfolds',
 '액체 왕':'Liquid King','세 번 변하는 길':'A road that changes three times',
 // chapter 8
 '첫 박자':'First Beat','박동에 맞춰 뛰기':'Jump with the pulse',
 '엇박':'Off-Beat','반 박자 어긋난 장애물':'Obstacles half a beat off',
 '만화경':'Kaleidoscope','복제된 배경 속 진짜 길':'The real road among copied backdrops',
 '저음':'Low Note','넓게 퍼지는 맥박':'A pulse that spreads wide',
 '지휘자':'The Conductor','세 구절의 프레임':'A frame in three phrases',
 // chapter 9
 '한 줄':'One Line','밝은 선만 따라가기':'Follow only the bright line',
 '작은 점':'A Small Dot','점이 나타나는 자리로':'To where the dot appears',
 '아무것도':'Nothing','아무것도 안 하는 연습':'Practice doing nothing',
 '발자국':'Footprints','먼저 지나간 흔적을 따라':'Following the traces left before',
 '공허':'The Void','움직임과 기다림이 번갈아':'Moving and waiting, in turns',
 // chapter 10
 '돌아온 정원':'The Garden Again','익숙한 길의 다른 접점':'A different joint on a familiar road',
 '도시의 반대편':'The Other Side of the City','중력과 착시가 만나는 곳':'Where gravity meets illusion',
 '나와 나':'Me and Me','둘이 함께 양보하기':'Two of us, giving way together',
 '마지막 노래':'The Last Song','모든 박자가 모이는 홀':'A hall where every beat gathers',
 '열린 틀':'The Open Frame','길을 열고 함께 나가기':'Open the road and walk out together',
 // new acts: names, coach lines, fail reasons, canvas labels
 '시선':'Gaze','녹는 길':'Melting road','박자':'Beat',
 '시선에서 길이 끊겼어요':'The road broke at the gaze','녹는 길에서 길이 끊겼어요':'The road broke on the melting road','박자에서 길이 끊겼어요':'The road broke on the beat',
 '눈이 감겼을 때만 점프':'Jump only while the eye is shut','눈 감으면 뛰어. 뜨면 가만히':'Jump when it shuts. Stay still when it opens','보고 있어. 가만히':'It\'s watching. Hold still.',
 '들켰어':'Caught','눈에 들켰어요':'The eye caught you','소품에 부딪혔어요':'You hit a prop','보는 중':'Watching','눈 감음':'Eyes shut',
 '탭: 점프 · 바닥이 입을 벌리면 뛰기':'Tap to jump · jump when the floor opens up','바닥이 입을 벌려. 박자에 맞춰 뛰어':'The floor\'s opening up. Jump on the beat.',
 '바닥이 녹아 내렸어요':'The floor melted away','발밑이 녹았어':'The ground melted under me','바닥 혹에 부딪혔어요':'You hit a bump in the floor',
 '탭: 점프 · 고리가 닫힐 때':'Tap to jump · when the ring closes','고리가 닫힐 때 탭':'Tap when the ring closes','박자를 놓쳤어요':'You missed the beat'
},patterns:[]});
})(globalThis);
