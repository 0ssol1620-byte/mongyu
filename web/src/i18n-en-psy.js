/* R105 English phrases for psychedelic layer and road screen. Registers into MongyuI18n (merged with i18n-en.js). Keys are the exact Korean source strings.
   Composite lines ("a · b", "a\nb") are split by the runtime, so every segment is registered on its own. */
(function(root){'use strict';
if(root.MONGYU_UI_EDITION!==true||!root.MongyuI18n?.register)return;
root.MongyuI18n.register('en',{},{phrases:{
 // campaign screen
 '꿈의 길':'Dream Road','새벽 계단의 탑':'Dawn Stair Tower','처음으로':'Home','모든 길을 걸었어요':'You have walked every road',
 '첫 걸음':'First Steps','올라가는 길':'The Climb','거울 정원':'Mirror Garden','내려오는 길':'The Descent','새벽의 탑':'Tower of Dawn',
 '접힌 길에서 달리기를 배워요':'Learn to run on folded roads','탑을 감아 오르는 나선':'A spiral winding up the tower','보이는 대로 이어지는 길':'A road that joins up as it looks',
 '소용돌이처럼 빨라지는 하강':'A descent that whirls faster','오르고, 숨 돌리고, 내려와 문을 연다':'Climb, catch your breath, come down, open the gate',
 '앞 코스를 완주하면 열려요':'Finish the course before it to unlock','별 없음':'No stars',
 // result panel
 '빛의 문이 열렸어':'The gate of light opened','꿈이 접혔네':'The dream folded up','새 최고 기록':'New best',
 '끝까지 가기':'Reach the end','빛 조각 모으기':'Collect light shards','안 부딪히기':'No bumps',
 '오로라의 문을 지났어요':'You passed through the aurora gate','한 번도 안 넘어졌어요':'You never fell',
 '꿈의 길로':'To Dream Road','이 구간부터 다시':'Retry from this stretch','처음부터':'From the start','다시 달리기':'Retry',
 '포스터 저장':'Save poster','영상 저장':'Save clip','공유':'Share','점':'pts',
 '기록을 저장하지 못했어요. 이번 플레이에만 남아요.':'Couldn\'t save your record. It stays for this run only.',
 '이번 플레이 기록은 저장되지 않아요.':'This run won\'t be saved.',
 '포스터를 만드는 중…':'Making your poster…','공유했어요.':'Shared.','포스터를 저장했어요.':'Poster saved.','저장하지 못했어요.':'Couldn\'t save.',
 '영상을 준비하는 중…':'Getting your clip ready…','영상을 저장했어요.':'Clip saved.','저장할 영상이 없어요.':'No clip to save.',
 // act names shown when a run ends
 '면 갈아타기':'Plane switch','착시 다리':'Illusion bridge','나선 오르막':'Spiral climb','나선 내리막':'Spiral descent','펜로즈 계단':'Penrose stairs','시점 정렬':'Viewpoint alignment','구간':'stretch'
},patterns:[
 [/^(\d+)장$/,'Chapter $1'],
 [/^(\d+)장 · (.+)$/,'Chapter $1 · $t2'],
 [/^별 (\d+) \/ (\d+)\s+·\s+다음 길은 (.+)$/,'Stars $1 / $2 · Next: $t3'],
 [/^별 (\d+) \/ (\d+)\s+·\s+모든 길을 걸었어요$/,'Stars $1 / $2 · You have walked every road'],
 [/^별 (\d+) \/ (\d+)$/,'Stars $1 / $2'],
 [/^(.+), 잠김\. 앞 코스를 완주하면 열려요\.$/,'$t1, locked. Finish the course before it to unlock.'],
 [/^(\d+)구간 · 약 (\d+)초$/,'$1 stretches · about $2 s'],
 [/^최고 ([\d,]+)$/,'Best $1'],
 [/^도전 (\d+)%$/,'Reached $1%'],
 [/^다음 꿈 · (.+)$/,'Next dream · $t1'],
 [/^새 길이 열렸어요 · (.+)$/,'New road unlocked · $t1'],
 [/^최고 ([\d,]+)점 · 별 (\d) \/ 3$/,'Best $1 pts · stars $2 / 3'],
 [/^빛 조각 (\d+) \/ (\d+)$/,'Light shards $1 / $2'],
 [/^빛 조각 (\d+)개$/,'$1 light shards'],
 [/^넘어짐 (\d+)번$/,'Fell $1 times'],
 [/^완벽 ×(\d+)$/,'Perfect ×$1'],
 [/^길의 (\d+)%$/,'$1% of the road'],
 [/^이 구간은 ([\d,]+)점부터$/,'This stretch restarts at $1 pts'],
 [/^(.+)에서 길이 끊겼어요$/,'The road broke at $t1']
]});
})(globalThis);
