/* R105 English string table. Owned by workstream E1.
 * strings  : key -> text for MongyuI18n.t()/plural() (new code).
 * phrases  : exact Korean text -> English, used by the legacy DOM/canvas translator for text still hardcoded in the sources.
 * patterns : [regex, replacement] for text with numbers. "$1" inserts a capture, "$t1" inserts the capture translated through the
 *            phrase/pattern tables; a function receives the captures. Voice follows docs/R105_VOICE_TONE_KO.md (English tone rules):
 *            guide = friendly contractions, monologue = short thoughts, system = plain and polite. Never a literal translation.
 * Not yet translated on purpose: content.js origin-mode text, the 100-slot catalog, story scenes (final text pass comes later). */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const n1=(n,one,many)=>String(n)==='1'?one:many;
const T=s=>root.MongyuI18n&&root.MongyuI18n.tr?root.MongyuI18n.tr(s):s;

const strings={
 'lang.label':'Language',
 'common.close':'Close','common.back':'Back','common.next':'Next','common.retry':'Retry','common.home':'Home','common.continue':'Continue',
 'common.on':'On','common.off':'Off',
 'unit.pts':{one:'{n} pt',other:'{n} pts'},
 'unit.shards':{one:'{n} shard',other:'{n} shards'},
 'unit.memories':{one:'{n} memory',other:'{n} memories'},
 'unit.lives':{one:'{n} life',other:'{n} lives'},
 'hud.shards':'Shards {a} / {b}','hud.perfect':'Perfect ×{n}',
 'save.failed':"Couldn't save.",'save.ok':'Saved.'
};

const phrases={};
const add=rows=>{for(const [k,v] of rows)phrases[k]=v};

/* ---- title, top bar, shared buttons ---- */
add([
 ['몽유','Mongyu'],['몽유 · 사각의 꿈','Mongyu · Square Dream'],['미션 결과','Mission results'],['설정','Settings'],
 ['선택 곁길','Optional side path'],['모서리의 답신 ↗ 짧은 곁길','Corner Reply ↗ short side path'],['동행의 손짓 ↗ 짧은 곁길','Companion\'s Wave ↗ short side path'],['해와 달의 틈 ↗ 짧은 곁길','Sun-Moon Gap ↗ short side path'],
 ['선택 곁길 · 들어가면 여정 일시정지','Optional side path · your journey pauses while you\'re in'],['같은 달리기로 복귀 · 별도 기록·보상 없음','You return to the same run · no separate records or rewards'],
 ['밤의 모서리를 넘어','Past the corners of the night'],['꿈 시작','Start dreaming'],['100 세계 모음','100 Worlds'],['54초 도전','54-second challenge'],
 ['옷장','Wardrobe'],['이야기','Story'],['다른 꿈','Other dreams'],['꿈속 전화 받기','Answer the dream call'],['경계 너머','Beyond the edge'],
 ['새로운 꿈','New dreams'],['무한 꿈','Endless Dream'],['오늘의 도전','Daily Dream'],['착시 정원','Illusion Garden'],
 ['결과 보기 →','See results →'],['점','pts'],['다음 기억','Next memory'],['이 세계 다시','Replay'],['이 구간 연습','Practice'],['세계 모음','Worlds'],['새 꿈 시작','New dream'],['처음으로','Home'],
 ['달리기 기록','Run record'],['기억 목표 진행','Memory goal progress'],['닫기','Close'],['돌아가기','Back'],['계속','Continue'],['나중에 보기','Later'],['다음으로','Next'],['다음 꿈','Next dream'],
 ['몽유 · MONGYU R86','Mongyu · MONGYU R86'],['걸어 보기','Take a walk'],['구간 연습','Practice'],['첫 달리기 시작','Start the first run'],['앞 장면','Previous scene'],
 ['달리기 시작','Start the run'],['준비됐어 · 시작','Ready · go'],['받지 않고 달리기','Run without answering'],['건너뛰기','Skip'],
]);

/* ---- pause, play controls, practice ---- */
add([
 ['잠깐 멈춤','Paused'],['계속 걷기','Keep going'],['지금 구간 다시','Retry this stretch'],['이야기 · 챕터 지도','Story · chapter map'],['소리 · 화면','Sound & display'],['소리·화면','Sound & display'],
 ['터치 또는 Enter로 시작','Touch or press Enter to start'],['몽유. 터치 또는 Enter로 시작','Mongyu. Touch or press Enter to start'],
 ['이 브라우저에서는 게임 화면을 표시할 수 없습니다.','This browser can\'t show the game screen.'],
 ['점프','Jump'],['일시정지','Pause'],['일시정지 · 메뉴','Pause · menu'],['꿈 지도','Dream map'],['연습 건너뛰기','Skip practice'],['짧은 꿈 체험','Short dream trial'],['체험 나가기','Leave trial'],['꿈속으로','Into the dream'],
 ['계속 달리기','Keep running'],['이 세계 다시','Replay'],['처음부터 다시','Start over'],['다음 세계로','To the next world'],['눌러서 점프','Press to jump'],['눌러서','Press to'],
 ['화면을 눌러 점프','Tap to jump'],['탭하여 점프','Tap to jump'],['점프. 화면·Space·Enter로 점프합니다.','Jump. Use the screen, Space or Enter.'],
 ['달리는 중','Running'],['첫 점프 · 화면 탭','First jump · tap the screen'],['첫 달리기','First run'],['장애물보다 조금 먼저 탭','Tap a little before the obstacle'],
 ['처음 한 번, 안전하게 점프를 익혀 보세요.','Let\'s learn the jump once, nice and safe.'],['장애물 앞입니다. 화면을 눌러 점프하세요.','Obstacle ahead. Tap the screen to jump.'],
 ['화면을 눌러 점프하세요','Tap the screen to jump'],['점프 성공. 착지 후에도 자동으로 달립니다.','Nice jump. You keep running on your own after landing.'],['점프 성공. 착지 후에도 자동으로 달립니다','Nice jump. You keep running on your own after landing'],
 ['연습 성공. 사각의 꿈으로 들어가세요.','Practice done. Step into the Square Dream.'],['괜찮습니다. 같은 지점에서 다시 연습합니다.','No worries. We\'ll practice that spot again.'],['괜찮습니다. 같은 지점에서 다시 연습합니다','No worries. We\'ll practice that spot again'],
 ['장애물 앞에서 안전하게 멈춥니다','You stop safely before the obstacle'],
 ['첫 연습 완료','First practice done'],['연습을 건너뛰었습니다','Practice skipped'],['연습 지점이 저장됩니다','Practice spot is saved'],['100개의 꿈에서는 안전 연습부터 시작합니다','100 Dreams starts with safe practice'],
 ['자동으로 일시정지했습니다','Paused automatically'],['화면 방향이 바뀌어 잠시 멈췄습니다. 계속하기를 눌러 주세요.','The screen turned, so we paused. Tap Continue.'],
 ['안전 연습. 안내에 따라 화면을 눌러 점프','Safe practice. Tap the screen to jump when prompted'],['결과. 다시 달리거나 처음 화면으로 돌아갈 수 있습니다.','Results. You can run again or go back to the start.'],['결과. 다시 도전하거나 꿈 지도를 여세요','Results. Try again or open the dream map'],
 ['100개의 다른 꿈','100 Other Dreams'],['열 개의 꿈','Ten Dreams'],['캠페인 시작','Start campaign'],['이어하기','Continue'],
]);

/* ---- opening run (Folded Light) ---- */
add([
 ['빛의 문을 열었다','The light gate opened'],['빛의 문을 열었다.','The light gate opened.'],['남은 기회','Chances left'],
 ['접힌 빛','Folded Light'],['바닥','Floor'],['벽','Wall'],['천장','Ceiling'],['빛 회수','Collect light'],['충돌 · 바닥','Hit · Floor'],['충돌','Hit'],['통과','Passed'],['착지','Land'],['벽의 변화','Wall shift'],
 ['지금 탭!','Tap now!'],['벽도 바닥이야','Walls count as floors.'],['벽도 바닥이야.','Walls count as floors.'],['완벽!','Perfect!'],['조금 일찍 눌렀어. 장애물 바로 앞에서!','A bit early. Right before the obstacle!'],['한 박자 늦었어. 조금만 더 빨리!','A beat late. Just a little sooner!'],
 ['장애물 앞에서 탭','Tap before the obstacle'],['벽에서도 같은 타이밍으로 탭','Same timing on walls'],['장애물에 닿기 직전에 탭','Tap right before you touch the obstacle'],
 ['저 빛을 따라가 볼까?','Shall we follow that light?'],['벽도 길이 되는구나.','Walls can be roads, too.'],['찾았다, 빛의 문!','Found it. The light gate!'],['빛의 문을 통과했어요.','You passed through the light gate.'],
 ['빛이 벽 너머로 갔어. 따라가 보자.','The light went over the wall. Let\'s follow it.'],['탭','Tap'],['빛','Shards'],['기억','Memory'],
 ['바닥, 벽, 천장에서 장애물을 넘어 빛 여섯 개를 모으세요.','Clear obstacles on the floor, walls and ceiling to collect six shards.'],['다음 기억으로','On to the next memory'],
 ['완주','Finished'],['무충돌','No hits'],['한 번에 모은 빛','Shards in one go'],
 ['달리기 설정','Run settings'],['이번 달리기 설정','Run settings'],['이번 달리기에만 적용됩니다.','Applies to this run only.'],['속도','Speed'],['시각 진동','Visual pulse'],['달리기를 시작한 뒤 설정을 바꾸세요.','Change these after the run starts.'],
]);

/* ---- coach lines (play HUD) ---- */
add([
 ['목표 달성','Goal reached'],['잘했어! 기억이 열렸어','Nice! The memory opened.'],['잘했어! 다 모았어','Nice! You got them all.'],['잘했어! 딱 맞췄어','Nice! Right on the mark.'],['잘했어!','Nice!'],['잘했어! 한 번도 안 다쳤어','Nice! Not a scratch.'],['잘했어! 멋진 차기야','Nice! What a kick.'],
 ['점프한 뒤 공중에서 한 번 더 탭하면 차기야','Jump, then tap once more in the air to kick.'],['하트가 0이 되면 처음부터야','Hearts hit zero and you start over.'],['괜찮아, 하트가 남아 있으면 계속 달려','It\'s fine. Keep running while you\'ve got hearts.'],['잘 버텼어! 그대로 계속','Nice hang-in! Keep going.'],
 ['벽도 길이 돼. 그대로 달려','Walls count as floors. Just keep running.'],['벽도 바닥이야. 그대로 달려','Walls count as floors. Just keep running.'],['잘했어! 어느 면이든 똑같아','Nice! Any side works the same.'],
 ['한 박자 늦었어','A beat late.'],['조금 일찍 눌렀어','A touch early.'],['틈은 뛰어넘어','Hop over gaps.'],['둘을 한 번에','Two in one jump.'],['높은 블록은 바로 앞에서','Tall block? Jump right before it.'],['한 바퀴! 조금 더 빨라져','Lap done! It\'s getting faster.'],
 ['틈에 빠졌어','Fell into a gap.'],['틈에 빠졌어요','You fell into a gap.'],['블록에 부딪혔어요','You hit a block.'],['한 박자 늦었어요','A beat late.'],
]);
add([
 ['움직이는 바닥','Moving Floor'],['물결 달리기','Wave Run'],['네 방 동시 달리기','Four Rooms at Once'],['투척 대결','Throwing Duel'],['돌진 피하기','Dodge the Charge'],['부양 발차기','Floating Kick'],['사각의 꿈','Square Dream'],['안전 연습','Safe practice'],
 ['물결 점프','Wave jump'],['함께 점프','Jump together'],['던지기','Throw'],['차선 바꾸기','Switch lanes'],['점프 / 킥','Jump / Kick'],['응답','Response'],
 ['바닥이 끊긴 틈과 솟는 벽 앞에서 점프합니다. 천장 아래에서는 누르지 마세요.','Jump at gaps and rising walls. Don\'t press under a ceiling.'],
 ['물결의 경사를 보며 벽 앞에서 점프합니다. 낮은 천장 아래는 달려서 통과하세요.','Watch the wave slope and jump at walls. Run through under low ceilings.'],
 ['한 번 누르면 네 사람이 함께 뜁니다. 다음 위험이 오는 방의 말풍선을 보세요.','One press and all four jump together. Watch the speech bubble in the room the next danger is heading for.'],
 ['누르면 사각 탄환을 던집니다. 움직이는 보스와 높이가 맞을 때 쏘세요.','Press to throw a square shot. Fire when you line up with the moving boss.'],
 ['누를 때마다 다음 차선으로 이동합니다. 예고된 돌진을 피해 벽에 부딪히게 하세요.','Each press moves you one lane over. Dodge the warned charge and let it hit the wall.'],
 ['한 번 눌러 도약, 공중에서 다시 눌러 발차기합니다. 보스에 실제로 닿아야 합니다.','Press to leap, press again in the air to kick. The kick has to actually reach the boss.'],
 ['바닥 장애물은 한 번 눌러 점프. 천장 아래에서는 누르지 마세요.','Press once to jump floor obstacles. Don\'t press under a ceiling.'],
 ['화면·Space·Enter로 점프합니다.','Jump with the screen, Space or Enter.'],
]);

/* ---- endless / daily / illusion ---- */
add([
 ['새벽 계단','Dawn Stairs'],['달빛 수로','Moonlit Canal'],['사각 정원','Square Garden'],['거꾸로 된 성','Upside-Down Castle'],['심장의 시계탑','Heart Clock Tower'],['새벽 정원','Dawn Garden'],['오로라 탑','Aurora Tower'],
 ['금빛 표식을 탭하면 건축이 돌아요','Tap the gold marker to turn the architecture'],['지금 금빛 표식을 탭!','Tap the gold marker now!'],['길이 이어졌다!','The path joined up!'],['금빛 표식 · 탭','Gold marker · tap'],['보이는 대로 이어진 길','A path joined as it looks'],
 ['다리가 아직 돌지 않았어','The bridge hasn\'t turned yet.'],['산호빛 블록은 점프','Jump the coral blocks'],['오로라의 문!','Aurora gate!'],['오로라의 문을 지났어요.','You passed the aurora gate.'],['다리를 돌리기 전에 건넜어요','You crossed before the bridge turned'],['산호빛 블록에 부딪혔어요','You hit a coral block.'],
 ['탭: 금빛 표식 근처면 건축 회전, 아니면 점프','Tap: near the gold marker it turns the architecture, otherwise you jump'],
 ['계속 달리기','Keep running'],['탭하면 이 구간부터 다시','Tap to retry from this stretch'],['새 기록','New best'],['새 최고 기록','New best'],
 ['오로라의 문을 열었다','The aurora gate opened'],['정원이 접혔다','The garden folded'],['바퀴를 돌았다','Lap complete'],['꿈이 접혔다','The dream folded'],['꿈을 뚫었다','Broke through the dream'],
 ['오늘의 첫 기록','First record today'],['오늘','today'],['이번 주 기록','This week\'s records'],['이번 주 도전 기록','This week\'s daily records'],['이번 주 최고 기록','This week\'s top runs'],['한 번 더','One more'],['다시 달리기','Retry'],
 ['접힌 빛','Folded Light'],['공유','Share'],['포스터 저장','Save poster'],['영상 저장','Save clip'],['이 순간 저장','Save this moment'],
 ['포스터를 만드는 중…','Making your poster…'],['공유했어요.','Shared.'],['포스터를 저장했어요.','Poster saved.'],['저장하지 못했어요.','Couldn\'t save.'],['영상을 준비하는 중…','Preparing your clip…'],['영상을 저장했어요.','Clip saved.'],['저장할 영상이 없어요.','No clip to save.'],
 ['기록은 이번 실행에만 남습니다.','Records are kept for this run only.'],['밤의 모서리를 넘어','Past the corners of the night'],
]);

/* ---- accessibility, settings ---- */
add([
 ['소리와 화면','Sound & display'],['소리 켜짐','Sound on'],['소리 꺼짐','Sound off'],['음악 볼륨','Music volume'],['효과음 볼륨','Effects volume'],['음악과 효과음의 크기를 따로 조절할 수 있어요.','You can set music and effects volume separately.'],
 ['꿈 연출 강도','Dream effect intensity'],['꿈 연출 · 균형','Dream effects · Balanced'],['꿈의 강도 · 균형','Dream effects · Balanced'],['움직임 줄임','Reduced motion'],['움직임 기본','Default motion'],
 ['사각의 꿈 · 구간 선택','Square Dream · pick a stretch'],['사각의 꿈 · 기억','Square Dream · memories'],['100개의 꿈 · 안전 연습','100 Dreams · safe practice'],['별도 기울기 연습','Tilt practice (separate)'],
 ['화면·Space·Enter는 같은 한 번의 입력입니다. 바닥·물결·네 방에서는 점프, 투척 대결에서는 던지기, 돌진 대결에서는 차선 변경, 부양 대결에서는 점프 후 한 번 더 눌러 킥. 바닥이 끊긴 틈은 뛰어넘고, 낮은 천장은 누르지 않고 통과하세요. 일부 꿈에서는 예고 뒤 길이 솟았다가 돌아옵니다. 변형 중에도 틈·벽·천장을 피해야 합니다. 인물 머리 위 말풍선이 조작과 위험을 알려 줍니다. 움직임 줄이기는 장식을 줄이며 판정에 필요한 움직임은 유지합니다. Esc로 일시정지·닫기.',
  'The screen, Space and Enter all count as the same single input. On floors, waves and four rooms it jumps. In throwing duels it throws, in charge duels it changes lanes, and in floating duels press again after a jump to kick. Hop over gaps in the floor and run through low ceilings without pressing. In some dreams the road rises after a warning and comes back. Even mid-change, avoid gaps, walls and ceilings. Speech bubbles over the characters tell you what to do and what\'s coming. Reduce motion trims decoration but keeps the movement you need to play. Esc pauses or closes.'],
 ['음악 출처와 이용 조건','Music credits and terms'],['접근성','Accessibility'],['색약 모드','Color-blind mode'],['골인 영상 기록','Goal clip recording'],['켜짐','On'],['꺼짐','Off'],['켜기','Turn on'],['끄기','Turn off'],
 ['색약 모드는 위험(산호)과 목적지(청록) 색을 파랑·노랑 계열로 바꿔요. 움직임 줄임은 화면 회전·흔들림을 줄입니다.','Color-blind mode swaps the danger (coral) and goal (teal) colors for blues and yellows. Reduced motion tones down screen rotation and shake.'],
 ['이번 체험은 음악 40%, 효과음 45%로 재생합니다. 체험을 끝내면 기존 소리 설정으로 돌아갑니다.','This trial plays music at 40% and effects at 45%. Your usual sound settings come back when it ends.'],
 ['체험 소리 켜기','Turn trial sound on'],['체험 소리 끄기','Turn trial sound off'],['체험 소리 꺼짐','Trial sound off'],['체험 소리를 재생할 수 없습니다.','Trial sound can\'t play.'],
 ['재생 중','Playing'],['음악을 불러오는 중','Loading music'],['음악','Music'],['플레이를 시작하면 음악이 재생됩니다.','Music plays once you start a run.'],['녹음 재생을 지원하지 않아 기본 합성 음악을 사용합니다.','Recorded playback isn\'t supported here, so built-in synth music is used.'],
 ['재생이 차단되었습니다. 계속하기를 눌러 소리를 다시 허용해 주세요.','Playback was blocked. Tap Continue to turn sound back on.'],['음악이 꺼져 있습니다. 소리 설정을 확인해 주세요.','Music is off. Check your sound settings.'],
 ['게임용 발췌·음량 정리·시작과 끝 페이드·형식 변환을 적용했습니다.','Edited for the game: excerpted, volume-balanced, faded in and out, and converted.'],['몽유를 위해 제작한 오리지널 음악입니다.','Original music made for Mongyu.'],
 ['다운로드에 붙은 오류 문구만 제거했으며 음원은 그대로입니다.','Only a stray error message in the download was removed; the audio is unchanged.'],['원본 음원을 그대로 사용합니다.','The original audio is used as is.'],['CC0 1.0 · 음량 조절 및 PCM 변환','CC0 1.0 · volume adjusted and converted to PCM'],
 ['속도 · 기본','Speed · Default'],['속도 · 느리게','Speed · Slow'],['속도 · 빠르게','Speed · Fast'],['느리게','Slow'],['빠르게','Fast'],['기본','Standard'],['고요','Calm'],['균형','Balanced'],['강렬','Intense'],
 ['이미 도착한 방을 다시 달릴 수 있습니다. 선택만으로는 시작하지 않습니다. 시작하면 현재 달리기를 대신합니다.','You can re-run rooms you\'ve already reached. Picking one doesn\'t start it. Starting replaces your current run.'],
 ['선택한 구간에서 시작','Start from the selected stretch'],['설정으로 돌아가기','Back to settings'],['처음부터 도전','Start from the beginning'],['처음부터 시작','Start from the beginning'],['결과로 돌아가기','Back to results'],['꿈 지도로 돌아가기','Back to the dream map'],
]);

/* ---- wardrobe, stories ---- */
add([
 ['오늘의 나','Today\'s me'],['옷장 닫기','Close wardrobe'],['여행자의 옷','Traveler\'s outfits'],['지난 이야기','Past stories'],['이야기 닫기','Close story'],['이야기와 대사는 몽유를 위한 각색입니다.','The story and dialogue are adapted for Mongyu.'],['만난 이야기','Stories you\'ve met'],
 ['길','Gil'],['솔','Sol'],['담','Dam'],['여울','Yeoul'],['입는 중','Wearing'],['입기','Wear'],['달빛','Moonlight'],['이슬','Dew'],['복숭아','Peach'],['라일락','Lilac'],['물결','Ripple'],['잔불','Embers'],['이끼','Moss'],['저녁별','Evening Star'],['서리','Frost'],['일식','Eclipse'],['새벽','Dawn'],['꿈 아이','Dream kid'],
 ['기억을 모으면 새로운 옷이 열려요.','Collect memories to unlock new outfits.'],['찾은 기억의 색 입기','Wear the found memory\'s color'],['이 기억의 색 입기','Wear this memory\'s color'],['기억 색 벗기','Take off the memory color'],
 ['이야기 보기','View story'],['엔딩 보기','View ending'],['엔딩 다시 보기','View ending again'],['자유 달리기 · 엔딩 감상 후','Free run · after the ending'],['자유롭게 달리기','Run freely'],['자유 플레이 · 100개 수집 후','Free play · after collecting all 100'],
 ['빨리 넘기는 중','Skipping ahead'],['잠긴 기억','Locked memory'],['열린 기억','Open memory'],['찾은 기억','Found memory'],['이 꿈 시작','Start this dream'],['기억 만나기','Meet the memory'],['다시 들어가기','Re-enter'],['달리기','Run'],
 ['동행','Companion'],['기억의 조건','Memory condition'],['대결','Duel'],['마지막 이야기','Final story'],['열림','Open'],['잠김','Locked'],['도전 가능','Available'],['보스','Boss'],['찾음','Found'],['획득','Earned'],['감상 완료','Watched'],['해결','Solved'],['완료','Done'],['미완료','Not done'],
 ['지금 들어갈 수 있어요.','You can go in now.'],['마지막 이야기를 얻었습니다. 끝까지 감상하면 자유 달리기가 열립니다.','You got the final story. Watch it to the end to unlock free run.'],
 ['기억을 찾았습니다.','You found the memory.'],['아직 조건이 완성되지 않았습니다.','The condition isn\'t met yet.'],['꿈속 전화','Dream call'],['따르릉','Ring ring'],
 ['기존 기록은 보존합니다. 지금 진행은 이번 실행에만 남습니다.','Your records are safe. Progress from this run won\'t be saved.'],['저장할 수 없어 이번 실행에만 남습니다.','Couldn\'t save, so this run\'s progress won\'t be kept.'],
]);

/* ---- map / chapters / missions ---- */
add([
 ['꿈 지도 닫기','Close dream map'],['마지막 장까지 이야기를 읽으세요.','Read the story to the last chapter.'],['시작 속도를 고를 수 있어요. 시작 후 설정에서 속도를 한 번 바꾸면 됩니다.','You can pick a starting speed. Change it once in Settings after you start.'],
 ['꿈 지도: 10개 장, 100개의 플레이 미션','Dream map: 10 chapters, 100 missions'],['이전 장','Previous chapter'],['다음 장','Next chapter'],['장 선택','Pick a chapter'],['장의 수수께끼','Chapter riddle'],['이 장의 수수께끼','This chapter\'s riddle'],['선택한 꿈 열기','Open selected dream'],
 ['첫 번째 꿈','First dream'],['두 번째 꿈','Second dream'],['세 번째 꿈','Third dream'],['네 번째 꿈','Fourth dream'],['다섯 번째 꿈','Fifth dream'],['여섯 번째 꿈','Sixth dream'],['일곱 번째 꿈','Seventh dream'],['여덟 번째 꿈','Eighth dream'],['아홉 번째 꿈','Ninth dream'],['열 번째 꿈, 보스','Tenth dream, boss'],
 ['게임 제어','Game controls'],['꿈의 여정 · 열 장','Dream Journey · Ten Chapters'],['기본 · 3목숨','Standard · 3 lives'],['배짱 · 1목숨 · 배율 +1','Bold · 1 life · multiplier +1'],['모서리의 답신 · 짧은 사건','Corner Reply · short event'],
 ['수수께끼 답','Riddle answer'],['답','Answer'],['답 확인','Check answer'],['힌트 보기','Show hint'],['규칙을 읽었어요 · 출발','I\'ve read the rules · Go'],['같은 상황 다시 도전','Retry this situation'],['열 장의 여정 보기','View the ten-chapter journey'],
 ['점수 확정하고 종료','Lock in score and finish'],['다음 막 도전','Take on the next act'],['같은 패턴 재도전','Retry the same pattern'],['새 패턴 도전','Try a new pattern'],
 ['이번 꿈의 미션','This dream\'s missions'],['꿈에 들어가기','Enter the dream'],['기록 없는 연습','Practice (no record)'],['꿈의 여정 · 열 장','Dream Journey · Ten Chapters'],
 ['100 기억의 여정','100-Memory Journey'],['여섯 사각 · 이전 여정','Six Squares · earlier journey'],['열 개의 꿈 · 이어 걷기','Ten Dreams · continue'],['열 개의 꿈 난이도 · 일반','Ten Dreams difficulty · Normal'],['열 개의 꿈 난이도 · 도전','Ten Dreams difficulty · Challenge'],
 ['열 개의 꿈 · 챕터 지도','Ten Dreams · chapter map'],['도전 난이도 · 기본','Challenge difficulty · Standard'],['도전 난이도 · 한 목숨','Challenge difficulty · One life'],['사각의 길 · 원래 여정','Square Road · original journey'],['100개의 꿈','100 Dreams'],['모서리의 답','Corner Answer'],['바람 다리 · 30초','Wind Bridge · 30s'],
 ['선택한 장 이어가기','Continue the selected chapter'],['첫 길 기록 도전 · 선택 메아리','First-road record challenge · choice echo'],['새 꿈 꾸미기 살펴보기 · 개발 미리보기','Browse new dream decor · dev preview'],['이 추천 닫기','Dismiss this suggestion'],
 ['새벽 회랑','Dawn Corridor'],['유리 천장','Glass Ceiling'],['쌍둥이 궤도','Twin Orbit'],['꼭짓점 정원','Vertex Garden'],['침묵 도서관','Silent Library'],['가속 공방','Acceleration Workshop'],['절약의 탑','Tower of Thrift'],['기억의 미로','Memory Maze'],['무결의 심장','Heart of Flawless'],['깨어나는 문','Waking Gate'],
 ['점프와 연속의 첫 문','The first gate of jumps and streaks'],['뛰어야 할 때와 걷는 순간','When to jump and when to walk'],['한 번의 도약으로 두 개의 문','Two gates in one leap'],['가장 높은 순간을 맞추다','Hit the highest moment'],['오래 걷는 것도 하나의 선택','Walking long is a choice, too'],
 ['예고된 속도에 리듬을 바꾸다','Change your rhythm to the announced speed'],['불필요한 도약 없이 꼭 필요한 만큼','Only as many leaps as you need'],['다가오는 표식을 읽고 기억하다','Read the markers coming at you and remember them'],['한 번의 기회에도 침착하게','Stay calm with one chance'],['배운 모든 리듬으로 마지막 꿈을','The last dream, with every rhythm you\'ve learned'],
 ['꿈의 수수께끼','Dream riddle'],['첫 걸음','First steps'],['다시 걸어 볼까요','Walk it again?'],['꿈을 건넜어요','You crossed the dream'],
 ['이 장 다시 만나기','Meet this chapter again'],['수수께끼 이어 풀기','Keep solving the riddle'],['앞 장의 수수께끼를 풀아 주세요','Solve the previous chapter\'s riddle'],['앞 장의 수수께끼를 풀어 주세요','Solve the previous chapter\'s riddle first'],
 ['정답! 다음 장의 첫 꿈이 열렸습니다.','Correct! The next chapter\'s first dream is open.'],['정답! 모든 꿈을 완성했습니다.','Correct! You\'ve completed every dream.'],['아직 맞지 않습니다. 힌트를 살펴보세요.','Not quite yet. Take a look at the hint.'],['답을 확인했습니다.','Answer checked.'],
 ['여정은 이 기기에 별도로 저장됩니다.','This journey is saved separately on this device.'],['찾은 기억은 이 기기에 저장됩니다.','Found memories are saved on this device.'],['다음 기억 위치','Next memory location'],
 ['100 기억의 여정','100-Memory Journey'],['미션을 모두 달성하면 다음 꿈이 열립니다.','Finish every mission to open the next dream.'],['다시 도전','Try again'],['꿈 완료','Dream complete'],['달성','Done'],['미달','Not yet'],
]);

/* ---- shop, extras, small modes ---- */
add([
 ['꿈 공방','Dream Workshop'],['개발 미리보기 · 결제 없음','Dev preview · no payments'],['기존 콘텐츠는 그대로. 능력 강화 없는 추가 구상.','Existing content stays as is. Extra concepts with no power-ups.'],['콘셉트 선택','Pick a concept'],['오로라 실','Aurora Thread'],['자정의 악보','Midnight Score'],['유리 정원','Glass Garden'],['콘셉트 샘플','Concept sample'],
 ['음색 샘플 듣기 · 2초','Hear a tone sample · 2s'],['관심 목록에 담기','Add to wishlist'],['관심 목록에서 빼기','Remove from wishlist'],['구매·소유권 지급 없음.','No purchase, no ownership granted.'],['소리 샘플을 재생할 수 없습니다.','The sound sample can\'t play.'],
 ['좌우로 이동해 빛을 모으고, 붉은 장애물은 점프하세요. 버튼이나 기울기로 움직일 수 있어요.','Move side to side to collect light and jump the red obstacles. Use the buttons or tilt.'],['왼쪽 이동 (누르고 있기)','Move left (hold)'],['오른쪽 이동 (누르고 있기)','Move right (hold)'],
 ['기울기 켜기','Turn on tilt'],['현재 자세를 중심으로','Center on current pose'],['30초 다시 하기','Replay 30s'],['기존 게임으로 돌아가기','Back to the main game'],['기기를 크게 돌릴 필요가 없습니다. 센서값은 저장하거나 전송하지 않습니다.','No need to swing your device around. Sensor readings are never stored or sent.'],
 ['바람 다리. 좌우 방향키로 이동, 화면 아래 점프 버튼 또는 이 화면에서 Space로 점프.','Wind Bridge. Move with the left and right arrow keys; jump with the button below the screen or Space.'],
 ['모서리의 답신 · 기록 없는 짧은 사건','Corner Reply · short event, no record'],['호출: 점, 선, 창. 방향은 오른쪽. 누르면 규칙 다시 보기','Call: dot, line, window. Direction: right. Press to see the rule again.'],['● 점 → ━ 선 → ▣ 창','● Dot → ━ Line → ▣ Window'],
 ['점 답신 선택','Pick dot reply'],['선 답신 선택','Pick line reply'],['창 답신 선택','Pick window reply'],['● 점','● Dot'],['━ 선','━ Line'],['▣ 창','▣ Window'],['현재 답신. 마지막 칸 되돌리기','Current reply. Undo last slot'],['보내기 ↗','Send ↗'],['사건 제어','Event controls'],
 ['답신 비우기','Clear reply'],['쉬기','Rest'],['퇴장 연출 건너뛰기','Skip exit scene'],['다시 하기','Try again'],['제목으로','To title'],['서로의 다리 · 선택 협력 사건','Bridge for Two · optional co-op event'],['동행 사건 제어','Companion event controls'],['다시 맞추기','Realign'],
 ['곁길 건너뛰고 본길로','Skip the side path'],['해와 달의 틈 · 선택 공간 사건','Sun-Moon Gap · optional space event'],['해와 달 사건 제어','Sun-Moon event controls'],['앞으로 걷기 →','Walk ahead →'],['☀ 낮으로 바꾸기','☀ Switch to day'],
 ['기억의 페이지','Memory pages'],['앞의 열 기억','Previous ten memories'],['다음 열 기억','Next ten memories'],['이어갈 기억','Memory to continue'],['100개의 세계 기록','Records of the 100 worlds'],['시간 조건','Time condition'],['지금 기기 시각','Device time now'],['모의 오전 09:00','Mock 9:00 AM'],['모의 오후 18:00','Mock 6:00 PM'],['모의 정오 12시대','Mock noon hour'],['모의 자정 0시대','Mock midnight hour'],
 ['방향키로 이동. Home과 End는 처음과 끝, Page Up과 Page Down은 열 기억씩 이동. Tab으로 기억 선택에서 나갑니다.','Arrow keys move. Home and End jump to the first and last, Page Up and Page Down skip ten memories. Tab leaves the memory picker.'],
 ['피격·행동 순간의 시각을 확인합니다. 시간대를 직접 고르면 모의 체험으로 기록됩니다.','The time of each hit and action is checked. If you pick a time yourself, it\'s recorded as a mock run.'],
 ['꿈속 이야기','Dream story'],['이야기 진행','Story progress'],['이야기 속 인물','Characters in the story'],['콘셉트 선택','Pick a concept'],
 ['짧은 사건 모듈을 불러오지 못했습니다. 완전한 게임 파일을 다시 열어 주세요.','Couldn\'t load the short-event module. Please reopen the complete game file.'],['해와 달 사건 모듈을 불러오지 못했습니다. 완전한 게임 파일을 다시 열어 주세요.','Couldn\'t load the Sun-Moon event module. Please reopen the complete game file.'],['동행 사건 모듈을 불러오지 못했습니다. 완전한 게임 파일을 다시 열어 주세요.','Couldn\'t load the companion event module. Please reopen the complete game file.'],
 ['백업에서 진행을 복구했습니다. 원본은 복구 보관함에 보존합니다.','Restored your progress from the backup. The original is kept in the recovery vault.'],
 ['저장 기록을 읽지 못했습니다. 원본을 보존하며 이번 실행의 진행을 별도로 유지합니다.','Couldn\'t read your save. The original is kept safe and this run\'s progress is held separately.'],['백업을 읽지 못했습니다. 원본을 보존하며 이번 실행에서 계속할 수 있습니다.','Couldn\'t read the backup. The original is kept safe and you can keep going in this run.'],
]);

/* ---- patterns ---- */
const patterns=[
 [/^빛 (\d+) \/ (\d+)$/,'Shards $1 / $2'],
 [/^탭하여 점프 · 빛 (\d+) \/ (\d+)$/,'Tap to jump · Shards $1 / $2'],
 [/^(바닥|벽|천장) · 빛 (\d+) \/ (\d+)$/,'$t1 · Shards $2 / $3'],
 [/^(.+)\. 탭하여 점프 · 빛 (\d+) \/ (\d+)$/,'$t1. Tap to jump · Shards $2 / $3'],
 [/^충돌 · (.+)\. 빛 (\d+) \/ (\d+)\. 장애물에 닿기 직전에 탭$/,'Hit · $t1. Shards $2 / $3. Tap right before you touch the obstacle'],
 [/^(\d[\d,]*)점$/,(n)=>n+' pts'],
 [/^이전 최고 (\d[\d,]*)$/,'Previous best $1'],[/^남은 기회 (\d+)번$/,(n)=>n+n1(n,' chance left',' chances left')],
 [/^별 (\d+)개 중 (\d+)개 · 완주, 빛 (\d+) \/ (\d+), 무충돌$/,'$2 of $1 stars · finished, shards $3 / $4, no hits'],
 [/^빛의 문을 열었다\. 빛 (\d+) \/ (\d+)\.$/,'The light gate opened. Shards $1 / $2.'],
 [/^(\d+)바퀴$/,'Lap $1'],[/^바퀴 · (.*)$/,'Lap · $1'],
 [/^(\d+)장$/,'Ch. $1'],[/^제 (\d+)장$/,'Chapter $1'],[/^제 (\d+)장 · (.+)$/,'Chapter $1 · $t2'],
 [/^(\d+)번부터 (\d+)번 꿈\. 방향키로 선택, Enter로 자세히 보기\.$/,'Dreams $1 to $2. Arrow keys to choose, Enter for details.'],
 [/^(\d+)m$/,'$1 m'],[/^넘은 장애물 (\d+)$/,'Obstacles cleared: $1'],[/^완벽 (\d+) 최고 (\d[\d,]*)점$/,'Perfect $1 · best $2 pts'],[/^완벽 (\d+) 오늘의 첫 기록$/,'Perfect $1 · first record today'],[/^완벽 (\d+)$/,'Perfect $1'],
 [/^완벽 ×(\d+)$/,'Perfect ×$1'],[/^최고 (\d[\d,]*)$/,'Best $1'],[/^최고 (\d[\d,]*)점$/,'Best $1 pts'],[/^오늘 최고 (\d[\d,]*)점$/,'Best today $1 pts'],
 [/^한 번에 모은 빛 (\d+) \/ (\d+)$/,'Shards in one go: $1 / $2'],
 [/^별 (\d+)개 중 (\d+)개 · (.*)$/,'$2 of $1 stars · $3'],[/^별 (\d+)개 중 (\d+)개 ·$/,'$2 of $1 stars'],
 [/^제 (\d+)장 (.+)\. (\d+)번부터 (\d+)번 꿈\. 방향키로 선택, Enter로 자세히 보기\.$/,'Chapter $1, $t2. Dreams $3 to $4. Arrow keys to choose, Enter for details.'],
 [/^사각의 꿈 · (\d+)번째 구간부터 이어가기 \/ 수집 (\d+)\/(\d+) · 새 방식 (\d+)\/(\d+) · 수수께끼 (\d+)\/(\d+) · 기기에 저장됩니다$/,'Square Dream · continue from stretch $1 / collected $2/$3 · new way $4/$5 · riddles $6/$7 · saved on this device'],
 [/^(\d[\d,]*)점 · 완주 최고 (\d[\d,]*)점 (\d+) \/ (\d+) 세계 · (\d+)% (.+)$/,'$1 pts · best finish $2 pts · world $3 / $4 · $5% · $t6'],
 [/^(꿈이 접혔다|꿈을 뚫었다)\. (.+)$/,'$t1. $t2'],
 [/^(.+?) (\d+)번째 장애물에서 충돌$/,'Hit at obstacle #$2 · $t1'],[/^(\d+)번째 장애물에서 충돌$/,'Hit at obstacle #$1'],
 [/^(.+) · (\d+)%$/,'$t1 · $2%'],
 [/^(\d+) \/ (\d+) · (.+) · (\d+)점$/,'$1 / $2 · $t3 · $4 pts'],
 [/^0?(\d+) \/ 0?(\d+) (.+?) (\d+)점 ([♥●]) (\d+)%$/,'$1 / $2 $t3 $4 pts $5 $6%'],
 [/^0?(\d+) \/ 0?(\d+) (.+?) (\d+)점 (\d+)%$/,'$1 / $2 $t3 $4 pts $5%'],
 [/^(\d+) · (.+?) (\d+)점 ([●♥]) (\d+)%$/,'$1 · $t2 $3 pts $4 $5%'],[/^(\d+) · (.+?) (\d+)점 (\d+)%$/,'$1 · $t2 $3 pts $4%'],
 [/^(\d+) · (.+)$/,'$1 · $t2'],
 [/^점수 (\d[\d,]*)점을 모으면 기억이 열려$/,'Score $1 pts and the memory opens.'],[/^(\d[\d,]*)점을 모으면 기억이 열려$/,'Score $1 pts and the memory opens.'],
 [/^점수는 매번 쌓여\. 합쳐서 (\d[\d,]*)점이면 열려$/,'Your score adds up every run. $1 pts total opens it.'],
 [/^점수가 (\d+)~(\d+)점일 때 딱 한 번 부딪혀 봐$/,'Get hit exactly once while you\'re between $1 and $2 pts.'],
 [/^(\d+)~(\d+)점에서 마지막 하트를 잃으면 돼$/,'Lose your last heart between $1 and $2 pts.'],
 [/^같은 장애물에 (\d+)번 부딪혀 봐$/,(n)=>'Hit the same obstacle '+n1(n,'once','$1 times').replace('$1',n)+'.'],
 [/^한 번도 부딪히지 말고 (\d[\d,]*)점까지!$/,'No hits until $1 pts!'],[/^벽 모양이 (\d+)번 바뀔 때까지 버텨 봐$/,(n)=>'Hang in until the wall shape changes '+n1(n,'once','$1 times').replace('$1',n)+'.'],
 [/^보스 (\d+)%$/,'Boss $1%'],[/^(\d+) \/ (\d+)점$/,'$1 / $2 pts'],
 [/^연습 · (.*)$/,'Practice · $t1'],
 [/^기억 (\d+)개$/,(n)=>n+' '+n1(n,'memory','memories')],
 [/^(.+) · 기억 (\d+)개 필요$/,(a,n)=>T(a)+' · needs '+n+' '+n1(n,'memory','memories')],
 [/^(.+) · (입는 중|입기)$/,'$t1 · $t2'],
 [/^(\d+) \/ (\d+)개의 기억$/,'$1 / $2 memories'],[/^(\d+)\/(\d+)개의 기억$/,'$1 / $2 memories'],
 [/^사각의 꿈 · 기억 (\d+)\/(\d+)$/,'Square Dream · memories $1/$2'],
 [/^오늘의 도전 · (\d+\.\d+)$/,'Daily Dream · $1'],[/^(\d+\.\d+) · 오늘$/,'$1 · today'],
 [/^음악 · (.+)$/,'Music · $1'],[/^곡 출처 · (.*)$/,'Source · $1'],[/^(.+) 곡 출처$/,'$1 source'],[/^(.+) CC-BY-4\.0 이용 조건$/,'$1 CC-BY-4.0 terms'],[/^효과음 · (.+)$/,'Sound effects · $1'],
 [/^꿈의 강도 (고요|균형|강렬); 눌러 변경$/,'Dream effects: $t1; press to change'],[/^꿈의 강도 · (고요|균형|강렬)$/,'Dream effects · $t1'],[/^꿈 연출 · (균형|고요|강렬)$/,'Dream effects · $t1'],
 [/^(색약 모드|골인 영상 기록|속도|시각 진동) · (.+)$/,'$t1 · $t2'],
 [/^(.+?)\. 눌러서 점프$/,'$t1. Press to jump'],[/^(.+) · (.+)\. 화면, Space, Enter를 눌러 점프\. 모서리에서는 자동으로 회전합니다\.$/,'$t1 · $t2. Press the screen, Space or Enter to jump. Corners turn automatically.'],
 [/^(.+)\. 화면, Space, Enter를 눌러 점프\. 모서리에서는 자동으로 회전합니다\.$/,'$t1. Press the screen, Space or Enter to jump. Corners turn automatically.'],
 [/^(\d+)점\. (.+)$/,'$1 pts. $t2'],
 [/^(\d+)번 차선으로 이동합니다$/,'Moving to lane $1'],
];

const api=Object.freeze({enabled,strings,phrases,patterns});
if(enabled&&root.MongyuI18n)root.MongyuI18n.register('en',strings,{phrases,patterns});
root.MongyuI18nEn=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
