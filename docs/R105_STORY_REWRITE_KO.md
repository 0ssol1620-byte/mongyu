# 몽유 R105 이야기 고쳐 쓰기 (3인칭 서술 → 1인칭 독백)

기준은 `docs/R105_VOICE_TONE_KO.md`예요. 이야기 장면의 화자는 **주인공 본인**이고 말투는 1인칭 혼잣말 반말(~네, ~군, ~는걸, ~잖아, ~어)이에요. 3인칭 서술체(~했다, ~한다)와 합쇼체 서술은 쓰지 않아요.

## 어디에 적용돼 있나

- 이 표의 **고친 문구**는 이미 `web/src/restoration-ui.js` 의 `SCENE105` 표에 들어 있어요. R105 빌드(`MONGYU_UI_EDITION===true`)에서는 장면이 화면에 그려질 때 `v105()` 가 원문을 고친 문구로 바꿔서 보여 줘요. R103/R104 빌드는 원문 그대로예요.
- `restoration-story-graph.js` 는 S 담당이 아니라서 건드리지 않았어요. 메인 세션이 이 표대로 **원문을 직접 고치면** `SCENE105` 항목은 필요 없어져요(원문과 같아져서 아무 일도 하지 않아요). 고칠 때는 R103/R104 테스트가 원문 문자열을 검사하는지 먼저 확인해 주세요.
- 영어는 `web/src/i18n-en-screens.js` 에 이미 등록돼 있어요(키 = 고친 한국어 문구). 원문을 고치면 그 키와 일치해요.
- 화자별 처리: 길의 대사는 반말, 여울 같은 상대의 대사는 해요체를 그대로 둬요(상대의 말투). 둘 다 같은 문장을 쓰는 `action` 줄은 "우린 ~" 처럼 둘 다 어울리게 썼어요.
- 기억 사이 장면의 `narration` 줄도 1인칭 독백으로 바뀌어서, R105 에서는 말풍선(길의 독백)으로 보여 줘요(`restoration-ui.js` 의 `bridgeVoice`).

고친 문장은 그래프 파일 쪽 **59개**예요.

## 시작과 이야기 장면 (`sequences` 의 steps)

| 위치 | 원문 | 고친 문구 | English |
| --- | --- | --- | --- |
| 5 네모로 된 세계 · step 2 (reflection) | 그런데 자꾸 눈길이 간다. | 그런데 자꾸 눈길이 가네. | Still, I keep looking. |
| 13 아름다워도 아픈 · step 0 (reflection) | 모양만 보고 얕봤다가 큰코다쳤다. | 모양만 보고 얕봤다가 큰코다쳤네. | Judged them by their shape and paid for it. |
| 13 아름다워도 아픈 · step 1 (reflection) | 한 대 맞고 나니 정신이 번쩍 든다. | 한 대 맞고 나니 정신이 번쩍 드는걸. | One hit and I'm wide awake. |
| 16 떠오르는 옛 연인 · step 0 (reflection) | 저 모난 모습이 낯설지 않다. | 저 모난 모습, 낯설지 않아. | That sharp look… I know it. |
| 24 그 사람의 안부 · step 0 (reflection) | 한동안 눌러 둔 그리움이 올라온다. | 한동안 눌러 둔 그리움이 올라오네. | The longing I'd pushed down is rising. |
| 34 솔을 보다가 · step 0 (reflection) | 작은 동행이 생겼다. 이제 혼자 걷진 않겠네. | 작은 동행이 생겼네. 이제 혼자 걷진 않겠어. | A little companion. I won't walk alone now. |
| 34 솔을 보다가 · step 1 (reflection) | 이 아이를 보는데도 오래전 사람이 떠오른다. | 이 아이를 보는데도 오래전 사람이 떠오르네. | Even looking at this little one, someone from long ago comes to mind. |
| 39 연애도 하고 싶은 길 · step 2 (reflection) | 내 곁에도 마음을 나눌 사람이 있으면 좋겠다. | 내 곁에도 마음을 나눌 사람이 있으면 좋겠어. | I wish I had someone to share my heart with. |
| 49 친절을 받은 마음 · step 0 (reflection) | 길에서 어르신과 인연이 닿았다. | 길에서 어르신과 인연이 닿았네. | I crossed paths with an elder on the road. |
| 49 친절을 받은 마음 · step 1 (reflection) | 함께 있으니 마음의 날이 조금 무뎌진다. | 함께 있으니 마음의 날이 조금 무뎌지는걸. | Being together dulls my heart's edge a little. |
| 52 다음 만남을 바라며 · step 1 (reflection) | 설레는 만남도 내게 찾아오면 좋겠다. | 설레는 만남도 내게 찾아오면 좋겠어. | I wish an exciting meeting would find me too. |
| 62 닿지 않은 연락 · step 0 (reflection) | 기다려도 소식이 오지 않는다. | 기다려도 소식이 오지 않네. | I wait, but no news comes. |
| 69 여울의 걸음 · step 0 (dialogue) | 저쪽에서 누군가 다가온다. 가슴이 뛴다. | 저쪽에서 누군가 다가와. 가슴이 뛰네. | Someone's coming over. My heart's racing. |
| 69 여울의 걸음 · step 6 (action) | 이런 날도 오는구나. 몸이 저절로 들썩인다. | 이런 날도 오는구나. 몸이 저절로 들썩이네. | Days like this do come. My body's moving on its own. |
| 69 여울의 걸음 · step 8 (action) | 한쪽에서 흥겨운 소리를 보낸다. | 흥겨운 소리, 이쪽에서 보낸다! | Cheerful sound, coming your way! |
| 69 여울의 걸음 · step 8 (alternateText) | 다른 쪽이 그 장단을 이어받는다. | 그 장단, 제가 받을게요. | I'll catch that beat. |
| 73 새로운 연애 · step 0 (reflection) | 드디어 함께할 사람이 생겼다! | 드디어 함께할 사람이 생겼어! | Finally, someone to be with! |
| 73 새로운 연애 · step 1 (reflection) | 마주 볼 때마다 마음이 들뜬다. | 마주 볼 때마다 마음이 들뜨네. | Every time we face each other, my heart lifts. |
| 80 아직 잊지 못한 사람 · step 0 (reflection) | 새 사람이 곁에 있는데도 지난 얼굴이 겹친다. | 새 사람이 곁에 있는데도 지난 얼굴이 겹치네. | Even with someone new beside me, the old face overlaps. |
| 80 아직 잊지 못한 사람 · step 1 (reflection) | 비교하는 내 마음부터 들여다봐야겠다. | 비교하는 내 마음부터 들여다봐야겠어. | I should look at my own comparing heart first. |
| 84 이별을 말하기로 · step 0 (reflection) | 더 늦기 전에 이 관계를 정리해야겠다. | 더 늦기 전에 이 관계를 정리해야겠어. | I should end this before it's too late. |
| 84 이별을 말하기로 · step 2 (reflection) | 마음은 아직 지난 자리에 묶여 있다. | 마음은 아직 지난 자리에 묶여 있네. | My heart is still tied to the old place. |
| 87 다시 혼자 · step 6 (action) | 붙잡는 말 없이 둘은 한발씩 물러선다. | 붙잡는 말 없이, 우린 한 발씩 물러서. | No words to hold on with. We each step back. |
| 87 다시 혼자 · step 7 (action) | 붙잡는 말 없이 둘은 한발씩 물러선다. | 붙잡는 말 없이, 우린 한 발씩 물러서. | No words to hold on with. We each step back. |
| 87 다시 혼자 · step 8 (action) | 한쪽에서 흥겨운 소리를 보낸다. | 흥겨운 소리, 이쪽에서 보낸다! | Cheerful sound, coming your way! |
| 87 다시 혼자 · step 8 (alternateText) | 다른 쪽이 그 장단을 이어받는다. | 그 장단, 제가 받을게요. | I'll catch that beat. |
| 92 거듭되는 그리움 · step 0 (reflection) | 다시 그 사람 생각이다. | 또 그 사람 생각이네. | Thinking of them again. |
| 92 거듭되는 그리움 · step 1 (reflection) | 걸음을 옮겨도 생각이 따라온다. | 걸음을 옮겨도 생각이 따라오네. | I keep walking, and the thought follows. |
| 92 거듭되는 그리움 · step 2 (reflection) | 잊었다 싶으면 또 떠오른다. | 잊었다 싶으면 또 떠오르네. | Just when I think I've forgotten, it's back. |
| 92 거듭되는 그리움 · step 4 (reflection) | 아직 보고 싶은 마음이 남았다. | 아직 보고 싶은 마음이 남았네. | I still miss them. |

## 엔딩 부근 (슬롯 100 `sequences`)

| 위치 | 원문 | 고친 문구 | English |
| --- | --- | --- | --- |
| 100 돌아오지 않는 사랑 · step 9 (hesitation) | 말을 고르다가 다시 멈춘다. | …잠깐만요. 말을 고르는 중이에요. | …Give me a second. I'm picking my words. |
| 100 돌아오지 않는 사랑 · step 10 (hesitation) | 한참 망설인 뒤에야 마음을 꺼낸다. | …그래도 말할게요. 마음부터요. | …I'll say it anyway. The heart of it first. |
| 100 돌아오지 않는 사랑 · step 19 (silence) | 대답 대신 두 사람 사이에 침묵이 남는다. | 대답이 없어. 침묵만 남았네. | No answer. Only silence. |
| 100 돌아오지 않는 사랑 · step 21 (silence) | 대답 대신 두 사람 사이에 침묵이 남는다. | 대답이 없어. 침묵만 남았네. | No answer. Only silence. |
| 100 돌아오지 않는 사랑 · step 22 (hesitation) | 쉽게 나오지 않는 말을 삼킨다. | 쉽게 나오지 않는 말, 그냥 삼키자. | The words that won't come easily. Just swallow them. |
| 100 돌아오지 않는 사랑 · step 23 (hesitation) | 인사말의 다음 음절이 늦게 따라온다. | 인사말의 다음 마디가 자꾸 늦네. | The next part of the goodbye keeps coming late. |
| 100 돌아오지 않는 사랑 · step 24 (hesitation) | 붙잡던 말이 마침내 놓인다. | 붙잡던 말을 이제야 놓네. | Finally letting go of the words I held. |
| 100 돌아오지 않는 사랑 · step 25 (hesitation) | 마지막 인사를 겨우 이어 간다. | 마지막 인사를 겨우 이어 가 본다. | Barely getting through the last goodbye. |
| 100 돌아오지 않는 사랑 · step 27 (closing) | 지켜보던 이는 두 사람의 서툶을 생각한다. | 지켜보던 나는 둘의 서툶을 생각해. | Watching, I think about how clumsy we both were. |
| 100 돌아오지 않는 사랑 · step 29 (closing) | 막상 마주한 끝은 생각보다 조용하다. | 막상 마주한 끝은 생각보다 조용하네. | The end, face to face, is quieter than I thought. |
| 100 돌아오지 않는 사랑 · step 31 (closing) | 이 길을 끝까지 함께한 당신에게도 말을 건넨다. | 이 길을 끝까지 함께한 너에게도 한마디 건넬게. | And a word for you, who walked this road to the end. |
| 100 돌아오지 않는 사랑 · step 32 (closing) | 누군가를 아끼는 마음이 나를 세우고, 내가 살아가는 세계도 넓힌다. | 누군가를 아끼는 마음은 나를 세우고, 내가 사는 세계도 넓혀 주더라. | Caring about someone holds me up and widens the world I live in. |
| 100 돌아오지 않는 사랑 · step 37 (closing) | 모두 지나온 길에 남았습니다. | 모두 지나온 길에 남았어. | All of it stays on the road behind me. |
| 100 돌아오지 않는 사랑 · step 38 (closing) | 돌아오지 않는 마음도 있습니다. | 돌아오지 않는 마음도 있는 법이지. | Some hearts don't come back. |
| 100 돌아오지 않는 사랑 · step 39 (closing) | 주인공은 그 자리에 멈추지 않기로 했습니다. | 나는 그 자리에 멈추지 않기로 했어. | I decided not to stop there. |
| 100 돌아오지 않는 사랑 · step 40 (closing) | 다음 모서리 너머로 발을 내딛습니다. | 다음 모서리 너머로 발을 내딛자. | Let's step past the next corner. |
| 100 돌아오지 않는 사랑 · step 41 (closing) | 주인공의 이야기는 여기까지입니다. | 내 이야기는 여기까지야. | That's the end of my story. |
| 100 돌아오지 않는 사랑 · step 42 (closing) | 끝까지 함께 달려 주셔서 고맙습니다. | 끝까지 같이 달려 줘서 고마워. | Thanks for running with me to the end. |

## 기억 사이 장면 (`interludes` 의 lines)

| 위치 | 원문 | 고친 문구 | English |
| --- | --- | --- | --- |
| interlude 3 · line 0 (narration) | 문 너머에도 네모난 방이 기다리고 있었다. | 문 너머에도 네모난 방이 기다리고 있네. | There's a square room waiting past the door too. |
| interlude 4 · line 1 (narration) | 달린 만큼 차곡차곡 쌓여서, 600점이 되면 열린다. | 달린 만큼 차곡차곡 쌓여서, 600점이 되면 열리나 봐. | It builds up as I run. At 600 it opens, I guess. |
| interlude 7 · line 0 (reflection) | 발이 조금 익숙해졌다. | 발이 좀 익숙해졌어. | My feet are getting used to it. |
| interlude 10 · line 0 (narration) | 첫 장의 마지막 길. 바람이 조금 따뜻하다. | 첫 장의 마지막 길이네. 바람이 조금 따뜻해. | The last road of the first chapter. The wind is a little warm. |
| interlude 12 · line 0 (reflection) | 모서리가 아까보다 조금 둥글어 보인다. | 모서리가 아까보다 조금 둥글어 보이는걸. | The corners look a bit rounder than before. |
| interlude 14 · line 1 (narration) | 1500점이 쌓일 때까지 달린다. | 1500점이 쌓일 때까지 달려 보자. | Let's run until 1500 piles up. |
| interlude 18 · line 0 (narration) | 떠오른 얼굴은 잠시 접어 두기로 했다. | 떠오른 얼굴은 잠깐 접어 두기로 했어. | I'll fold away that face for now. |
| interlude 21 · line 0 (narration) | 새 장이다. 공기의 색이 달라졌다. | 새 장이네. 공기의 색이 달라졌어. | A new chapter. The air's color changed. |
| interlude 25 · line 0 (narration) | 솔이 발끝을 졸졸 따라온다. | 솔이 발끝을 졸졸 따라오네. | Sol is trotting along at my heels. |
| interlude 27 · line 1 (narration) | 1000점의 길이다. | 1000점짜리 길이야. | A 1000-point road. |
| interlude 29 · line 0 (reflection) | 떠올랐던 몸이 다시 무거워졌다. | 떠올랐던 몸이 다시 무거워졌어. | My floating body got heavy again. |

## `restoration-ui.js` 안의 문구 (이미 직접 고쳤어요)

물음표 쉼(`VIGNETTES`)과 대결 전 장면(`INTRO`)의 문장이에요. R105 빌드에서만 `v105()` 로 바뀌어 보여요.

| 장면 | 원문 | 고친 문구 | English |
| --- | --- | --- | --- |
| 공중의 틈 | 잠깐, 달리기를 지켜보는 당신에게 보여 줄 것이 있다. | 잠깐, 구경하는 너한테 보여 줄 게 있어. | Hey, spectator, I've got something to show you. |
| 공중의 틈 | 길이 잠시 공중에 떠올랐다. 이 정도면 작은 묘기라고 해도 될까. | 길이 공중에 떠올랐네. 이 정도면 작은 묘기 아닌가? | The road's floating. Pretty good trick, right? |
| 공중의 틈 | 구경은 여기까지. 발끝이 다시 바닥에 닿았다. | 구경은 여기까지. 발끝이 다시 바닥에 닿았어. | Show's over. My toes are back on the ground. |
| 달아난 벨소리 | 이번 물음표에는 공짜 벨소리 선물을 준비했다고 한다. | 이번 물음표엔 공짜 벨소리 선물이 있다던데. | This question mark was supposed to give out a free ringtone. |
| 달아난 벨소리 | 그런데 선물이 될 벨소리가 먼저 달아나 버렸다. | 어라, 선물이 될 벨소리가 먼저 달아나 버렸네. | Huh, the ringtone ran off before it could be a gift. |
| 달아난 벨소리 | 받을 것은 없어졌다. 남은 것은 조금 허탈한 웃음뿐이었다. | 받을 게 없어졌어. 남은 건 조금 허탈한 웃음뿐이군. | Nothing to take. All that's left is a slightly hollow laugh. |
| 첫 번째 쉼 | 물음표 차례가 돌아왔다. 이번에는 무엇이 나올까. | 물음표 차례가 돌아왔네. 이번엔 뭐가 나올까. | Question mark's turn again. What'll it be this time? |
| 첫 번째 쉼 | 오늘의 물음표는 쉬고 싶다고 한다. | 오늘의 물음표는 쉬고 싶대. | Today's question mark wants a rest. |
| 첫 번째 쉼 | 별일 없이 쉬어 가는 것도 한 차례. 이제 다시 달려 보자. | 별일 없이 쉬어 가는 것도 한 차례지. 이제 다시 달려 보자. | Resting for no reason counts as a turn too. Back to running. |
| 조언도 쉬는 날 | 생활에 도움이 될 이야기를 들려주려던 참이었다. | 생활에 도움이 될 이야기를 해 주려던 참이었는데. | It was about to give me some life advice. |
| 조언도 쉬는 날 | 하지만 준비한 조언보다 쉬고 싶은 마음이 앞섰다. | 준비한 조언보다 쉬고 싶은 마음이 앞섰나 봐. | Guess it wanted a rest more than it wanted to advise. |
| 조언도 쉬는 날 | 이야기는 다음으로 미루고 이번 물음표도 잠시 쉰다. | 이야기는 다음으로 미루자. 이번 물음표도 잠깐 쉬는 걸로. | Let's save the story for later. This one's resting too. |
| 마지막 물음표의 쉼 | 마지막 물음표를 만났다. | 마지막 물음표를 만났어. | Found the last question mark. |
| 마지막 물음표의 쉼 | 끝이라고 거창한 것을 준비하지는 못했다. 이번에도 쉬는 시간이다. | 끝이라고 거창한 걸 준비하진 못했네. 이번에도 쉬는 시간이야. | Nothing grand for the finale. Another break, then. |
| 마지막 물음표의 쉼 | 짧은 여백을 남겨 두고 달리기로 돌아간다. | 짧은 여백을 남겨 두고, 달리기로 돌아가자. | A little blank space left behind. Back to running. |
| 8 작은 햇살 | 여기서 마음대로 놀아도 되느냐는 말에 시비가 붙었다. 길은 앞을 막은 상대를 마주 보았다. | 여기서 맘대로 놀아도 되냐고 물었더니 시비가 붙었어. 앞을 막은 녀석을 똑바로 마주 봤지. | I asked if I could play here and picked a fight. I faced the guy blocking my way. |
| 20 다가오는 발 | 어디서 본 얼굴인지 이야기가 오갔다. 예전 게임에서 만난 사이냐는 실랑이가 곧 대결로 번졌다. | 어디서 본 얼굴이냐며 말이 오가더니, 예전 게임에서 만난 사이냐는 실랑이가 대결로 번졌어. | We went back and forth on where we'd met, and the scuffle over an old game turned into a showdown. |
| 22 뒤따르는 발소리 | 주인공은 작은 개를 발견했다. 서로 장난스럽게 반응을 주고받은 뒤, 강아지를 데리고 함께 가기로 했다. | 작은 개를 발견했어. 서로 장난스럽게 눈치를 보다가 같이 가기로 했지. | Found a little dog. We sized each other up playfully, then decided to go together. |
| 31 강아지를 지키는 길 | 상대가 강아지를 내놓으라고 했다. 주인공은 함께 온 친구를 넘길 생각이 없었다. 물러서지 않는 둘 사이에 대결이 시작됐다. | 저쪽이 강아지를 내놓으래. 같이 온 친구를 넘길 생각은 없는데. 물러서지 않았더니 대결이 시작됐어. | They want me to hand over the pup. No way I'm giving up my friend. I held my ground and the showdown began. |
| 38 벽의 얼굴 | 상대는 자기 얼굴이 신경 쓰이는 모양이었다. 길이 얼굴의 비율을 놀리자 분위기가 험악해졌다. | 상대는 자기 얼굴이 신경 쓰이나 봐. 얼굴 비율을 놀렸더니 분위기가 험악해졌네. | They must be touchy about their face. I teased the proportions and the mood turned ugly. |
| 45 매달린 사슬 | 상대가 주인공에게 누군가를 소개해 주겠다고 나섰다. 주인공은 그 만남을 사양했고, 대화는 순순히 끝나지 않았다. | 누군가를 소개해 주겠대. 사양했더니 대화가 순순히 끝나질 않네. | They offered to introduce me to someone. I said no, and the talk won't end quietly. |
| 47 등을 내어 준 사람 | 할머니가 등에 업혀 가라고 권했다. 주인공은 어느새 이미 업혀 있었다. 그 사실을 알아챈 둘이 함께 놀랐다. | 할머니가 등에 업혀 가라고 하셨어. 정신 차려 보니 벌써 업혀 있네. 둘 다 깜짝 놀랐지. | Grandma told me to hop on her back. Next thing I knew, I was already up there. We were both startled. |
| 58 돌아가는 가지 | 날카롭게 구는 상대에게 주인공은 로션이라도 바르면 부드러워지겠다고 농담했다. 농할머니를 반기는 기색은 없었다. | 날카롭게 구는 상대한테 로션이라도 바르면 부드러워지겠다고 농담했어. 반기는 기색은 전혀 없네. | I joked that some lotion might soften up the sharp one. Not a hint of a smile. |
| 66 밀려오는 물결 | 상대는 옛 연인이 이미 길을 잊었을 거라고 말했다. 주인공은 그 말을 받아들이지 못하고 맞섰다. | 옛 연인은 이미 길을 잊었을 거래. 그 말은 받아들일 수 없어서 맞섰어. | They said my old love has surely forgotten the road. I couldn't accept that, so I stood up to them. |
| 69 새로운 만남 | 새 연인과 길은 서로에게 호감을 보였다. 새 연인이 길 대신 달려 주겠다고 나섰고, 두 사람은 새 만남에 함께 기뻐했다. | 새 연인이랑 서로 호감이 생겼어. 내 대신 달려 주겠다고 해서 둘이 같이 신났지. | My new love and I hit it off. They offered to run for me, and we were both thrilled. |
| 77 교차하는 두 팔 | 상대가 새 연인에게 관심을 보이자 주인공은 퉁명스럽게 대꾸했다. 말이 끝나자 곧 대결이 시작됐다. | 상대가 새 연인에게 관심을 보이기에 퉁명스럽게 대꾸했어. 말이 끝나자마자 대결이 시작됐지. | They showed interest in my new love, so I snapped back. The showdown started the second I finished. |
| 87 알고 있던 이별 | 주인공이 이별을 꺼내려 머뭇거리자 여울은 이미 알고 있었다는 듯 받아들였다. 말을 마친 두 사람은 오히려 마음이 편해졌다. | 이별을 꺼내려고 머뭇거렸는데, 여울은 벌써 알고 있었다는 듯 받아들였어. 말을 마치고 나니 오히려 마음이 편하네. | I hesitated to bring up the breakup, but Yeoul took it like she already knew. Strangely, I feel lighter now. |
| 90 회오리의 반사 | 길은 한 사람에게 빠져드는 마음을 회오리에 휘말리는 일에 빗대었다. 그 마음을 안고 다시 상대를 마주했다. | 한 사람에게 빠져드는 마음은 회오리에 휘말리는 일 같아. 그 마음을 안은 채 다시 상대를 마주했어. | Falling for someone is like getting caught in a whirlwind. I faced them again with that feeling in my arms. |
| 99 거절 뒤의 대결 | 주인공은 옛 연인에게 다가가려 했다. 그녀는 받아들이지 않았지만, 길은 여전히 그리운 마음을 거두지 못했다. | 옛 연인에게 다가가 보려 했어. 받아들이진 않았지만, 그리운 마음은 거두지 못하겠네. | I tried to go to my old love. They didn't accept me, but I can't let go of missing them. |

고친 문장은 여기 **29개**예요.

## 카탈로그 `pages`

`restoration-catalog.js` 의 `pages`(예: 슬롯 1 "처음 보는 곳에 길이 서 있었다.")는 그래프 장면이 있는 슬롯에서는 화면에 쓰이지 않아요(그래프가 우선). 그래서 고치지 않았어요. 접근성 요약 같은 다른 곳에서 읽는다면 같은 방식으로 고쳐야 해요.
