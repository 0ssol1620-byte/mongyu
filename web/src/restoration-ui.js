/* Authored wording/staging. R74 native cursor, lane and terminal structure is recovered;
 * original dialogue, marker appearance and frame-exact presentation are not reproduced. */
(function(root){'use strict';
const VIGNETTES={
 28:{name:'공중의 틈',effect:'levitate',pages:['잠깐, 달리기를 지켜보는 당신에게 보여 줄 것이 있다.','길이 잠시 공중에 떠올랐다. 이 정도면 작은 묘기라고 해도 될까.','구경은 여기까지. 발끝이 다시 바닥에 닿았다.'],reactions:['!','?','']},
 41:{name:'달아난 벨소리',effect:'ringtone',pages:['이번 물음표에는 공짜 벨소리 선물을 준비했다고 한다.','그런데 선물이 될 벨소리가 먼저 달아나 버렸다.','받을 것은 없어졌다. 남은 것은 조금 허탈한 웃음뿐이었다.'],reactions:['!','?','']},
 56:{name:'첫 번째 쉼',effect:'breath',pages:['물음표 차례가 돌아왔다. 이번에는 무엇이 나올까.','오늘의 물음표는 쉬고 싶다고 한다.','별일 없이 쉬어 가는 것도 한 차례. 이제 다시 달려 보자.'],reactions:['','…','']},
 65:{name:'조언도 쉬는 날',effect:'look-back',pages:['생활에 도움이 될 이야기를 들려주려던 참이었다.','하지만 준비한 조언보다 쉬고 싶은 마음이 앞섰다.','이야기는 다음으로 미루고 이번 물음표도 잠시 쉰다.'],reactions:['?','…','']},
 81:{name:'마지막 물음표의 쉼',effect:'stillness',pages:['마지막 물음표를 만났다.','끝이라고 거창한 것을 준비하지는 못했다. 이번에도 쉬는 시간이다.','짧은 여백을 남겨 두고 달리기로 돌아간다.'],reactions:['','?','!']}
};
const INTRO={
 20:{name:'다가오는 발',pages:['어디서 본 얼굴인지 이야기가 오갔다. 예전 게임에서 만난 사이냐는 실랑이가 곧 대결로 번졌다.'],reaction:'!'},
 38:{name:'벽의 얼굴',pages:['상대는 자기 얼굴이 신경 쓰이는 모양이었다. 길이 얼굴의 비율을 놀리자 분위기가 험악해졌다.'],reaction:'?'},
 8:{name:'작은 햇살',pages:['여기서 마음대로 놀아도 되느냐는 말에 시비가 붙었다. 길은 앞을 막은 상대를 마주 보았다.'],reaction:'!'},
 22:{name:'뒤따르는 발소리',pages:['주인공은 작은 개를 발견했다. 서로 장난스럽게 반응을 주고받은 뒤, 강아지를 데리고 함께 가기로 했다.'],cast:'dog',reaction:'?'},
 47:{name:'등을 내어 준 사람',pages:['할머니가 등에 업혀 가라고 권했다. 주인공은 어느새 이미 업혀 있었다. 그 사실을 알아챈 둘이 함께 놀랐다.'],cast:'elder',reaction:''},
 69:{name:'새로운 만남',pages:['새 연인과 길은 서로에게 호감을 보였다. 새 연인이 길 대신 달려 주겠다고 나섰고, 두 사람은 새 만남에 함께 기뻐했다.'],cast:'woman',reaction:'!'},
 87:{name:'알고 있던 이별',pages:['주인공이 이별을 꺼내려 머뭇거리자 여울은 이미 알고 있었다는 듯 받아들였다. 말을 마친 두 사람은 오히려 마음이 편해졌다.'],cast:'walker',reaction:'…'},
 31:{name:'강아지를 지키는 길',pages:['상대가 강아지를 내놓으라고 했다. 주인공은 함께 온 친구를 넘길 생각이 없었다. 물러서지 않는 둘 사이에 대결이 시작됐다.'],reaction:'!'},
 45:{name:'매달린 사슬',pages:['상대가 주인공에게 누군가를 소개해 주겠다고 나섰다. 주인공은 그 만남을 사양했고, 대화는 순순히 끝나지 않았다.'],reaction:'!'},
 58:{name:'돌아가는 가지',pages:['날카롭게 구는 상대에게 주인공은 로션이라도 바르면 부드러워지겠다고 농담했다. 농할머니를 반기는 기색은 없었다.'],reaction:'?'},
 66:{name:'밀려오는 물결',pages:['상대는 옛 연인이 이미 길을 잊었을 거라고 말했다. 주인공은 그 말을 받아들이지 못하고 맞섰다.'],reaction:'!'},
 77:{name:'교차하는 두 팔',pages:['상대가 새 연인에게 관심을 보이자 주인공은 퉁명스럽게 대꾸했다. 말이 끝나자 곧 대결이 시작됐다.'],reaction:'!'},
 90:{name:'회오리의 반사',pages:['길은 한 사람에게 빠져드는 마음을 회오리에 휘말리는 일에 빗대었다. 그 마음을 안고 다시 상대를 마주했다.'],reaction:'?'},
 99:{name:'거절 뒤의 대결',pages:['주인공은 옛 연인에게 다가가려 했다. 그녀는 받아들이지 않았지만, 길은 여전히 그리운 마음을 거두지 못했다.'],reaction:'…'}
};
const STORY_REACTIONS={1:['!','?'],5:['?','…'],13:['?','…'],16:['?','!'],24:['!','?'],34:['','?'],39:['!','…'],49:['','…'],52:['','?'],55:['?','…'],62:['','?'],73:['!','?'],80:['?','…'],84:['!','…'],92:['…','?'],96:['!','…'],100:['…','?','']};
// ---- R105 screen wording (UI edition only). The R104 sources above stay untouched; every visible string passes through v105(). ----
const UI105=root.MONGYU_UI_EDITION===true;
// Third-person story prose -> 1st-person monologue (반말). Keys are the exact source strings (this file and restoration-story-graph.js).
const SCENE105=[
 // vignettes (물음표 쉼)
 ['잠깐, 달리기를 지켜보는 당신에게 보여 줄 것이 있다.','잠깐, 구경하는 너한테 보여 줄 게 있어.'],
 ['길이 잠시 공중에 떠올랐다. 이 정도면 작은 묘기라고 해도 될까.','길이 공중에 떠올랐네. 이 정도면 작은 묘기 아닌가?'],
 ['구경은 여기까지. 발끝이 다시 바닥에 닿았다.','구경은 여기까지. 발끝이 다시 바닥에 닿았어.'],
 ['이번 물음표에는 공짜 벨소리 선물을 준비했다고 한다.','이번 물음표엔 공짜 벨소리 선물이 있다던데.'],
 ['그런데 선물이 될 벨소리가 먼저 달아나 버렸다.','어라, 선물이 될 벨소리가 먼저 달아나 버렸네.'],
 ['받을 것은 없어졌다. 남은 것은 조금 허탈한 웃음뿐이었다.','받을 게 없어졌어. 남은 건 조금 허탈한 웃음뿐이군.'],
 ['물음표 차례가 돌아왔다. 이번에는 무엇이 나올까.','물음표 차례가 돌아왔네. 이번엔 뭐가 나올까.'],
 ['오늘의 물음표는 쉬고 싶다고 한다.','오늘의 물음표는 쉬고 싶대.'],
 ['별일 없이 쉬어 가는 것도 한 차례. 이제 다시 달려 보자.','별일 없이 쉬어 가는 것도 한 차례지. 이제 다시 달려 보자.'],
 ['생활에 도움이 될 이야기를 들려주려던 참이었다.','생활에 도움이 될 이야기를 해 주려던 참이었는데.'],
 ['하지만 준비한 조언보다 쉬고 싶은 마음이 앞섰다.','준비한 조언보다 쉬고 싶은 마음이 앞섰나 봐.'],
 ['이야기는 다음으로 미루고 이번 물음표도 잠시 쉰다.','이야기는 다음으로 미루자. 이번 물음표도 잠깐 쉬는 걸로.'],
 ['마지막 물음표를 만났다.','마지막 물음표를 만났어.'],
 ['끝이라고 거창한 것을 준비하지는 못했다. 이번에도 쉬는 시간이다.','끝이라고 거창한 걸 준비하진 못했네. 이번에도 쉬는 시간이야.'],
 ['짧은 여백을 남겨 두고 달리기로 돌아간다.','짧은 여백을 남겨 두고, 달리기로 돌아가자.'],
 // boss intros
 ['여기서 마음대로 놀아도 되느냐는 말에 시비가 붙었다. 길은 앞을 막은 상대를 마주 보았다.','여기서 맘대로 놀아도 되냐고 물었더니 시비가 붙었어. 앞을 막은 녀석을 똑바로 마주 봤지.'],
 ['어디서 본 얼굴인지 이야기가 오갔다. 예전 게임에서 만난 사이냐는 실랑이가 곧 대결로 번졌다.','어디서 본 얼굴이냐며 말이 오가더니, 예전 게임에서 만난 사이냐는 실랑이가 대결로 번졌어.'],
 ['주인공은 작은 개를 발견했다. 서로 장난스럽게 반응을 주고받은 뒤, 강아지를 데리고 함께 가기로 했다.','작은 개를 발견했어. 서로 장난스럽게 눈치를 보다가 같이 가기로 했지.'],
 ['상대가 강아지를 내놓으라고 했다. 주인공은 함께 온 친구를 넘길 생각이 없었다. 물러서지 않는 둘 사이에 대결이 시작됐다.','저쪽이 강아지를 내놓으래. 같이 온 친구를 넘길 생각은 없는데. 물러서지 않았더니 대결이 시작됐어.'],
 ['상대는 자기 얼굴이 신경 쓰이는 모양이었다. 길이 얼굴의 비율을 놀리자 분위기가 험악해졌다.','상대는 자기 얼굴이 신경 쓰이나 봐. 얼굴 비율을 놀렸더니 분위기가 험악해졌네.'],
 ['상대가 주인공에게 누군가를 소개해 주겠다고 나섰다. 주인공은 그 만남을 사양했고, 대화는 순순히 끝나지 않았다.','누군가를 소개해 주겠대. 사양했더니 대화가 순순히 끝나질 않네.'],
 ['할머니가 등에 업혀 가라고 권했다. 주인공은 어느새 이미 업혀 있었다. 그 사실을 알아챈 둘이 함께 놀랐다.','할머니가 등에 업혀 가라고 하셨어. 정신 차려 보니 벌써 업혀 있네. 둘 다 깜짝 놀랐지.'],
 ['날카롭게 구는 상대에게 주인공은 로션이라도 바르면 부드러워지겠다고 농담했다. 농할머니를 반기는 기색은 없었다.','날카롭게 구는 상대한테 로션이라도 바르면 부드러워지겠다고 농담했어. 반기는 기색은 전혀 없네.'],
 ['상대는 옛 연인이 이미 길을 잊었을 거라고 말했다. 주인공은 그 말을 받아들이지 못하고 맞섰다.','옛 연인은 이미 길을 잊었을 거래. 그 말은 받아들일 수 없어서 맞섰어.'],
 ['새 연인과 길은 서로에게 호감을 보였다. 새 연인이 길 대신 달려 주겠다고 나섰고, 두 사람은 새 만남에 함께 기뻐했다.','새 연인이랑 서로 호감이 생겼어. 내 대신 달려 주겠다고 해서 둘이 같이 신났지.'],
 ['상대가 새 연인에게 관심을 보이자 주인공은 퉁명스럽게 대꾸했다. 말이 끝나자 곧 대결이 시작됐다.','상대가 새 연인에게 관심을 보이기에 퉁명스럽게 대꾸했어. 말이 끝나자마자 대결이 시작됐지.'],
 ['주인공이 이별을 꺼내려 머뭇거리자 여울은 이미 알고 있었다는 듯 받아들였다. 말을 마친 두 사람은 오히려 마음이 편해졌다.','이별을 꺼내려고 머뭇거렸는데, 여울은 벌써 알고 있었다는 듯 받아들였어. 말을 마치고 나니 오히려 마음이 편하네.'],
 ['길은 한 사람에게 빠져드는 마음을 회오리에 휘말리는 일에 빗대었다. 그 마음을 안고 다시 상대를 마주했다.','한 사람에게 빠져드는 마음은 회오리에 휘말리는 일 같아. 그 마음을 안은 채 다시 상대를 마주했어.'],
 ['주인공은 옛 연인에게 다가가려 했다. 그녀는 받아들이지 않았지만, 길은 여전히 그리운 마음을 거두지 못했다.','옛 연인에게 다가가 보려 했어. 받아들이진 않았지만, 그리운 마음은 거두지 못하겠네.'],
 // aftermath lines
 ['사슬이 풀렸다.','사슬이 풀렸네.'],['돌던 빛이 잠잠해졌다.','돌던 빛이 잠잠해졌네.'],['물결이 잦아들었다.','물결이 잦아들었어.'],
 ['회오리가 잦아든 자리에 허전함이 남았다.','회오리가 잦아든 자리에 허전함이 남았네.'],
 ['길은 자신이 줄곧 옛 연인의 안을 달렸음을 깨달았다.','내가 줄곧 옛 연인의 안을 달리고 있었네.'],
 ['돌려받으세요.','돌려줄게.'],['발걸음이 한결 가벼워졌다.','발걸음이 한결 가벼워졌어.'],
 ['흰 햇살이 사라집니다.','흰 햇살이 사라져요.'],['흰 사각이 사라집니다.','흰 사각이 사라져요.'],['노란 경계가 사라집니다.','노란 경계가 사라져요.'],
 ['마지막 사각이 흩어집니다.','마지막 사각이 흩어져요.'],['흰 얼굴이 사각 조각으로 흩어집니다.','흰 얼굴이 사각 조각으로 흩어져요.'],
 ['커다란 몸이 사각 조각으로 흩어집니다.','커다란 몸이 사각 조각으로 흩어져요.'],['빛의 조각들이 흩어집니다.','빛의 조각들이 흩어져요.'],['남은 경계가 흩어집니다.','남은 경계가 흩어져요.'],
 // between-memory bridges (restoration-story-graph.js interludes)
 ['문 너머에도 네모난 방이 기다리고 있었다.','문 너머에도 네모난 방이 기다리고 있네.'],
 ['달린 만큼 차곡차곡 쌓여서, 600점이 되면 열린다.','달린 만큼 차곡차곡 쌓여서, 600점이 되면 열리나 봐.'],
 ['발이 조금 익숙해졌다.','발이 좀 익숙해졌어.'],
 ['첫 장의 마지막 길. 바람이 조금 따뜻하다.','첫 장의 마지막 길이네. 바람이 조금 따뜻해.'],
 ['모서리가 아까보다 조금 둥글어 보인다.','모서리가 아까보다 조금 둥글어 보이는걸.'],
 ['1500점이 쌓일 때까지 달린다.','1500점이 쌓일 때까지 달려 보자.'],
 ['떠오른 얼굴은 잠시 접어 두기로 했다.','떠오른 얼굴은 잠깐 접어 두기로 했어.'],
 ['새 장이다. 공기의 색이 달라졌다.','새 장이네. 공기의 색이 달라졌어.'],
 ['솔이 발끝을 졸졸 따라온다.','솔이 발끝을 졸졸 따라오네.'],
 ['1000점의 길이다.','1000점짜리 길이야.'],
 ['떠올랐던 몸이 다시 무거워졌다.','떠올랐던 몸이 다시 무거워졌어.'],
 // story scenes (restoration-story-graph.js sequences)
 ['그런데 자꾸 눈길이 간다.','그런데 자꾸 눈길이 가네.'],
 ['모양만 보고 얕봤다가 큰코다쳤다.','모양만 보고 얕봤다가 큰코다쳤네.'],
 ['한 대 맞고 나니 정신이 번쩍 든다.','한 대 맞고 나니 정신이 번쩍 드는걸.'],
 ['저 모난 모습이 낯설지 않다.','저 모난 모습, 낯설지 않아.'],
 ['한동안 눌러 둔 그리움이 올라온다.','한동안 눌러 둔 그리움이 올라오네.'],
 ['작은 동행이 생겼다. 이제 혼자 걷진 않겠네.','작은 동행이 생겼네. 이제 혼자 걷진 않겠어.'],
 ['이 아이를 보는데도 오래전 사람이 떠오른다.','이 아이를 보는데도 오래전 사람이 떠오르네.'],
 ['내 곁에도 마음을 나눌 사람이 있으면 좋겠다.','내 곁에도 마음을 나눌 사람이 있으면 좋겠어.'],
 ['길에서 어르신과 인연이 닿았다.','길에서 어르신과 인연이 닿았네.'],
 ['함께 있으니 마음의 날이 조금 무뎌진다.','함께 있으니 마음의 날이 조금 무뎌지는걸.'],
 ['설레는 만남도 내게 찾아오면 좋겠다.','설레는 만남도 내게 찾아오면 좋겠어.'],
 ['기다려도 소식이 오지 않는다.','기다려도 소식이 오지 않네.'],
 ['저쪽에서 누군가 다가온다. 가슴이 뛴다.','저쪽에서 누군가 다가와. 가슴이 뛰네.'],
 ['이런 날도 오는구나. 몸이 저절로 들썩인다.','이런 날도 오는구나. 몸이 저절로 들썩이네.'],
 ['한쪽에서 흥겨운 소리를 보낸다.','흥겨운 소리, 이쪽에서 보낸다!'],
 ['다른 쪽이 그 장단을 이어받는다.','그 장단, 제가 받을게요.'],
 ['드디어 함께할 사람이 생겼다!','드디어 함께할 사람이 생겼어!'],
 ['마주 볼 때마다 마음이 들뜬다.','마주 볼 때마다 마음이 들뜨네.'],
 ['새 사람이 곁에 있는데도 지난 얼굴이 겹친다.','새 사람이 곁에 있는데도 지난 얼굴이 겹치네.'],
 ['비교하는 내 마음부터 들여다봐야겠다.','비교하는 내 마음부터 들여다봐야겠어.'],
 ['더 늦기 전에 이 관계를 정리해야겠다.','더 늦기 전에 이 관계를 정리해야겠어.'],
 ['마음은 아직 지난 자리에 묶여 있다.','마음은 아직 지난 자리에 묶여 있네.'],
 ['붙잡는 말 없이 둘은 한발씩 물러선다.','붙잡는 말 없이, 우린 한 발씩 물러서.'],
 ['다시 그 사람 생각이다.','또 그 사람 생각이네.'],
 ['걸음을 옮겨도 생각이 따라온다.','걸음을 옮겨도 생각이 따라오네.'],
 ['잊었다 싶으면 또 떠오른다.','잊었다 싶으면 또 떠오르네.'],
 ['아직 보고 싶은 마음이 남았다.','아직 보고 싶은 마음이 남았네.'],
 ['말을 고르다가 다시 멈춘다.','…잠깐만요. 말을 고르는 중이에요.'],
 ['한참 망설인 뒤에야 마음을 꺼낸다.','…그래도 말할게요. 마음부터요.'],
 ['대답 대신 두 사람 사이에 침묵이 남는다.','대답이 없어. 침묵만 남았네.'],
 ['쉽게 나오지 않는 말을 삼킨다.','쉽게 나오지 않는 말, 그냥 삼키자.'],
 ['인사말의 다음 음절이 늦게 따라온다.','인사말의 다음 마디가 자꾸 늦네.'],
 ['붙잡던 말이 마침내 놓인다.','붙잡던 말을 이제야 놓네.'],
 ['마지막 인사를 겨우 이어 간다.','마지막 인사를 겨우 이어 가 본다.'],
 ['지켜보던 이는 두 사람의 서툶을 생각한다.','지켜보던 나는 둘의 서툶을 생각해.'],
 ['막상 마주한 끝은 생각보다 조용하다.','막상 마주한 끝은 생각보다 조용하네.'],
 ['이 길을 끝까지 함께한 당신에게도 말을 건넨다.','이 길을 끝까지 함께한 너에게도 한마디 건넬게.'],
 ['누군가를 아끼는 마음이 나를 세우고, 내가 살아가는 세계도 넓힌다.','누군가를 아끼는 마음은 나를 세우고, 내가 사는 세계도 넓혀 주더라.'],
 ['모두 지나온 길에 남았습니다.','모두 지나온 길에 남았어.'],
 ['돌아오지 않는 마음도 있습니다.','돌아오지 않는 마음도 있는 법이지.'],
 ['주인공은 그 자리에 멈추지 않기로 했습니다.','나는 그 자리에 멈추지 않기로 했어.'],
 ['다음 모서리 너머로 발을 내딛습니다.','다음 모서리 너머로 발을 내딛자.'],
 ['주인공의 이야기는 여기까지입니다.','내 이야기는 여기까지야.'],
 ['끝까지 함께 달려 주셔서 고맙습니다.','끝까지 같이 달려 줘서 고마워.'],
 // result, notices, instructions (UI strings)
 ['기억 획득','기억을 찾았어'],['이번 달리기','끝까지 달렸어'],['꿈이 접혔다','꿈이 접혔네'],['이번 자유 달리기','자유롭게 달렸어'],
 ['첫 점프 연습','점프부터 해 보자'],['구간 연습 완료','손이 좀 풀렸어'],['빛의 문을 열었다','빛의 문이 열렸어'],
 ['처음부터 도전','처음부터 다시'],['다음 기억으로','다음 꿈'],['장애물에 조금 더 가까워진 뒤 탭','조금 더 다가간 뒤에 탭해.'],['장애물에 닿기 직전에 탭','닿기 직전에 탭해.'],
 ['진행은 이번 실행에만 남습니다.','이번 플레이에만 남아요.'],['기록은 이번 실행에만 남습니다.','기록은 이번 플레이에만 남아요.'],
 ['기록을 저장할 수 없어 이번 실행에만 남습니다.','저장하지 못했어요. 이번 플레이에만 남아요.'],
 ['기존 기록은 보존합니다. 지금 진행은 이번 실행에만 남습니다.','기록은 그대로예요. 이번 플레이는 저장되지 않아요.'],
 ['저장할 수 없어 이번 실행에만 남습니다.','저장하지 못했어요. 이번 플레이에만 남아요.'],
 ['기억을 찾았습니다.','기억을 찾았어요.'],['찾은 기억을 다시 만났습니다.','찾은 기억을 다시 만났어요.'],['아직 조건이 완성되지 않았습니다.','아직 조건이 덜 채워졌어요.'],
 ['설정 변경 조건을 확인하고 다시 바꿔 보세요.','설정을 한 번 바꿔서 다시 해 봐요.'],
 ['조건을 채우지 못했습니다. 같은 길에 다시 도전할 수 있어요.','조건을 못 채웠어요. 같은 길로 다시 가 봐요.'],
 ['장애물에 닿기 전에 화면을 눌러 첫 점프를 해 보세요.','장애물에 닿기 전에 화면을 눌러 점프해 봐.'],
 ['전화를 받고 달리기로 돌아왔습니다.','전화를 받고 달리기로 돌아왔어요.'],['전화를 받지 못했습니다. 다시 시도할 수 있어요.','전화를 못 받았어요. 다시 해 봐요.'],
 ['마지막 이야기를 얻었습니다. 끝까지 감상하면 자유 달리기가 열립니다.','마지막 이야기를 얻었어요. 끝까지 보면 자유 달리기가 열려요.'],
 ['앞선 기록을 먼저 모으세요.','앞선 기록을 먼저 찾아야 열려요.'],
 ['시작 소리를 고를 수 있어요. 시작 후 설정에서 소리를 한 번 바꾸면 됩니다. 켜기: 음악 40%, 효과음 45%. 끝나면 원래 설정으로 돌아갑니다.','시작할 때 소리를 고를 수 있어요. 시작한 뒤 설정에서 소리를 한 번 바꾸면 돼요. 켜면 음악 40%, 효과음 45%예요. 끝나면 원래대로 돌아가요.'],
 ['시작 후 설정에서 시각 진동을 한 번 바꾸면 됩니다. 점프·착지·충돌의 시각 신호이며 화면은 흔들리지 않습니다.','시작한 뒤 설정에서 화면 반짝임을 한 번 바꾸면 돼요. 점프와 착지, 부딪힐 때 화면이 반짝여요. 화면이 흔들리지는 않아요.'],
 ['시작 속도를 고를 수 있어요. 시작 후 설정에서 속도를 한 번 바꾸면 됩니다.','시작할 때 속도를 고를 수 있어요. 시작한 뒤 설정에서 속도를 한 번 바꾸면 돼요.'],
 ['마지막 장까지 이야기를 읽으세요.','이야기를 끝까지 읽기'],
 ['네 벽을 돌아 점프와 낮은 천장 통과를 익히세요.','네 벽을 돌며 점프와 낮은 천장 지나기 익히기'],
 ['설정을 열어 속도를 한 번 바꾸세요.','설정에서 속도를 한 번 바꾸기'],['설정을 열어 진동을 한 번 바꾸세요.','설정에서 화면 반짝임을 한 번 바꾸기'],['설정을 열어 소리를 한 번 바꾸세요.','설정에서 소리를 한 번 바꾸기'],
 ['같은 종류의 장애물에 3번 부딪히세요.','같은 장애물에 3번 부딪히기'],['점프 후 공중 차기를 1회 성공하세요.','점프한 뒤 공중에서 한 번 차기'],
 ['몸이 떠오르는 세 장면을 차례로 넘겨 보세요.','몸이 떠오르는 장면 세 개 넘겨 보기'],
 ['벨소리에 반응하는 세 장면을 넘겨 보세요. 소리를 꺼도 진행할 수 있습니다.','벨소리에 놀라는 장면 세 개 넘겨 보기. 소리를 꺼도 괜찮아요.'],
 ['잠시 쉬며 짧은 세 장면을 차례로 읽어 보세요.','쉬면서 짧은 장면 세 개 읽기'],
 ['달리다가 앱 안의 모의 전화가 오면 잠시 멈춰 받으세요. 같은 달리기를 이어가면 완료됩니다. 실제 전화는 사용하지 않습니다.','달리다가 가짜 전화가 오면 잠깐 멈춰서 받기. 이어서 달리면 끝나요. 진짜 전화는 쓰지 않아요.'],
 ['낮은 발은 점프, 높은 발은 지상에서 피하며 12번 빈틈을 만드세요.','낮은 발은 점프, 높은 발은 바닥에서 피하며 빈틈 12번 만들기'],
 ['가까운 흑백 탄을 점프로 받아치세요. 공중에 다시 탄이 오면 한 번 더 누르세요. 돌아간 탄이 햇살 윤곽에 10번 닿아야 합니다.','가까운 흑백 탄은 점프로 받아치기. 공중에 또 오면 한 번 더 누르기. 돌아간 탄이 햇살 윤곽에 10번 닿으면 끝나요.'],
 ['가까운 탄을 점프로 받아치세요. 공중에 다시 탄이 오면 한 번 더 누르세요. 되돌린 탄이 외계인에게 18번 닿아야 합니다.','가까운 탄은 점프로 받아치기. 공중에 또 오면 한 번 더 누르기. 되돌린 탄이 외계인에게 18번 닿으면 끝나요.'],
 ['가까운 흰 사각을 쳐내 얼굴에 10번 맞히세요. 검은 사각은 점프로 피하세요.','가까운 흰 사각은 쳐내서 얼굴에 10번 맞히기. 검은 사각은 점프로 피하기'],
 ['내려오는 사슬을 뛰어넘으세요. 돌아가는 몸까지 피하며 15번 버티세요.','내려오는 사슬은 뛰어넘기. 돌아가는 몸도 피하며 15번 버티기'],
 ['화면을 튕기며 날아갑니다. 가지가 가까이 올 때 한 번 눌러 10번 받아치세요.','화면을 튕기며 날아와요. 가지가 가까이 올 때 눌러서 10번 받아치기'],
 ['오른쪽에서 떨어져 밀려오는 파동을 넘으며 25번 버티세요.','오른쪽에서 밀려오는 파동을 넘으며 25번 버티기'],
 ['화면을 튕기며 날아갑니다. 다가오는 팔과 몸을 18번 받아치세요.','화면을 튕기며 날아와요. 다가오는 팔과 몸을 18번 받아치기'],
 ['검은 사각을 받아쳐 보스에게 15번 돌려보내세요. 파란 사각은 일찍 뛰어넘으세요.','검은 사각은 받아쳐서 15번 돌려보내기. 파란 사각은 일찍 뛰어넘기'],
 ['하트 안을 날며 경계와 안쪽 사각을 받아치세요. 초록 경계에 팔·다리가 닿아야 체력이 줄어듭니다.','하트 안을 날며 경계와 안쪽 사각을 받아치기. 초록 경계에 팔다리가 닿아야 체력이 줄어요.'],
 ['바닥, 벽, 천장에서 장애물을 넘어 빛 여섯 개를 모으세요.','바닥, 벽, 천장에서 장애물을 넘어 빛 여섯 개 모으기'],
 ['꿈속 전화 받기','전화 받기'],['길 한가운데서 전화가 울립니다.','길 한가운데서 전화가 울려요.'],['두 번의 벨. 받을까요?','벨이 두 번 울렸어요. 받을까요?'],['벨이 한 번 울렸습니다.','벨이 한 번 울렸어요.'],
 ['달리기를 마무리합니다.','달리기를 마무리해요.'],['목표 달성 · 계속 달립니다.','목표 달성 · 계속 달려요.']
];
const COPY105=new Map(SCENE105);
const PATTERNS105=[
 [/^충돌 · (.+)$/,'$1에서 부딪혔네'],
 [/^점프 후 공중 차기를 (\d+)회 성공하세요\.$/,'점프한 뒤 공중에서 $1번 차기'],
 [/^(\d\d:\d\d–\d\d:\d\d)에 마지막 체력을 잃으면 기록됩니다\. 시간 선택에서 모의 체험도 할 수 있습니다\.$/,'$1에 마지막 체력 잃기. 시간을 골라 모의로 해 볼 수도 있어요.'],[/^(.+)에서 멈췄다$/,'$1에서 멈췄네'],
 [/^한 번의 달리기에서 (\d+)점을 모으세요\.$/,'한 번 달려서 $1점 모으기'],
 [/^이 기록의 도전에서 얻은 점수를 합쳐 (\d+)점에 도달하세요\.$/,'이 기록에서 얻은 점수를 합쳐 $1점 채우기'],
 [/^(\d+)~(\d+)점일 때 한 번 부딪히세요\. 게임 오버는 필요하지 않습니다\.$/,'$1~$2점일 때 딱 한 번 부딪히기'],
 [/^(\d+)~(\d+)점에서 달리기를 마치세요\. 마지막 충돌로 끝나야 합니다\.$/,'$1~$2점에서 마지막 충돌로 끝내기'],
 [/^한 번도 부딪히지 않고 (\d+)점에 도달하세요\.$/,'한 번도 안 부딪히고 $1점 모으기'],
 [/^벽의 모양이 (\d+)번 바뀌는 동안 살아남으세요\.$/,'벽 모양이 $1번 바뀔 때까지 버티기'],
 [/^(.+)의 걸음으로 짧은 길을 완주하세요\.$/,'$1의 걸음으로 짧은 길 끝까지 가기'],
 [/^이 기억 (\d+) \/ (\d+)점 · 다음 시도에 이어집니다\.$/,'이 기억 $1 / $2점 · 다음에 이어져요.']
];
function v105(s){
 if(!UI105||typeof s!=='string'||!s)return s;
 const hit=COPY105.get(s);if(hit!==undefined)return hit;
 const time=/^(오전|오후) 시간대에 ([\s\S]+)$/.exec(s);
 if(time){const inner=v105(time[2]);return inner!==time[2]?time[1]+'에 '+inner:s}
 for(const [re,rep] of PATTERNS105)if(re.test(s))return s.replace(re,rep);
 return s;
}
function portrait105(parent,id,cls){
 const d=root.document;if(!d?.createElement||!parent)return null;
 const wrap=d.createElement('span');wrap.className='r105-portrait'+(cls?' '+cls:'');wrap.setAttribute('aria-hidden','true');
 const img=d.createElement('img');img.alt='';img.decoding='async';wrap.appendChild(img);
 if(parent.firstChild&&parent.insertBefore)parent.insertBefore(wrap,parent.firstChild);else parent.appendChild(wrap);
 setPortrait105(wrap,id);return wrap;
}
function setPortrait105(wrap,id){
 const img=wrap?.firstChild,art=root.MongyuArt?.image?.(id);
 if(!img||!art)return false;
 if(wrap.dataset)wrap.dataset.pose=id;
 if(img.getAttribute?.('src')!==art.src)img.setAttribute('src',art.src);
 return true;
}
// Pure helpers behind the R105 pause line, story list and wardrobe (unit-tested without a DOM).
function pauseLine105(v,current){
 const t=String(current||'');
 if(v?.opening)return v.opening.total>0?'빛 '+v.opening.total+'개 중 '+v.opening.passed+'개 모았어요':'';
 if(/^탭하여 점프|^눌러서 점프/.test(t))return v?.roomTitle||'';
 return v105(t.replace(/^\d+ \/ \d+ · /,''));
}
function journalState105(entries){const open=entries.filter(e=>e.unlocked);return {open,locked:entries.length-open.length,total:entries.length}}
function wardrobeState105(looks,isOwned){
 const owned=[],locked=[];for(const item of looks)(isOwned(item)?owned:locked).push(item);
 return {owned,remaining:locked.length,next:locked[0]||null};
}
// Authored actor staging. Marks never assert original dialogue attribution.
function sceneStage(slot,index,kind,mark=''){
 const actor=(id,x,reaction='',facing=1)=>({id,x,reaction,facing,sourceRole:({'walker':'protagonist','woman':'new-girlfriend','red-form':'former-beloved','dog-only':'dog','elder-alone':'grandmother','elder':'grandmother-carrying-protagonist'}[id]||id)});
 if(kind==='intro'){
  if(slot.number===22)return {beat:'meeting-dog',actors:[actor('walker',240,'!'),actor('dog-only',500,'?',-1)]};
  if(slot.number===47)return {beat:'meeting-elder',actors:[actor('walker',240,'!'),actor('elder-alone',500,'!',-1)]};
  if(slot.number===69)return {beat:'meeting-woman',actors:[actor('walker',240,'!'),actor('woman',500,'',-1)]};
  if(slot.number===87)return {beat:'parting',actors:[actor('walker',240,''),actor('woman',500,'?',-1)]};
  if(slot.number===99)return {beat:'rejected-approach',actors:[actor('walker',230,mark),actor('red-form',500,'')]};
 }
 if(slot.number===100)return {beat:['meeting','distance','departure'][index]||'departure',actors:index<2?[actor('walker',230,index===0?'!':''),actor('red-form',index===0?500:575,index===1?'!':'')]:[actor('walker',300,'')]};
 if([73,80,84].includes(slot.number))return {beat:({73:'new-relationship',80:'remembering-former-beloved',84:'deciding-to-part'})[slot.number],actors:[actor('walker',240,mark),actor('woman',500,'',-1)]};
 const id=slot.characterId||'walker';
 if(id==='dog')return {beat:'companions',actors:[actor('walker',285,mark),actor('dog-only',490,'')]};
 return {beat:'journey',actors:[actor(id,360,mark)]};
}
function sceneElder(c,x,y,height,ink='#18121d'){
 if(root.MongyuMobile){root.MongyuMobile.sprite(c,{x,y,bodyHeight:height,pose:'stand',tangent:{x:1,y:0}},{ink},true,'elder');c.save();c.strokeStyle=ink;c.lineWidth=height/100;c.beginPath();c.moveTo(x+height*.2,y-height*.5);c.lineTo(x+height*.23,y);c.stroke();c.restore();return;}
 // Separate standing visitor: gameplay's elder renderer carries the runner.
 c.save();c.translate(x,y);c.scale(height/100,height/100);c.strokeStyle='#f6f3e9';c.fillStyle='#f6f3e9';c.lineWidth=4;c.lineCap='round';
 c.beginPath();c.arc(0,-83,7,0,Math.PI*2);c.fill();
 for(const points of [[[0,-74],[-7,-50],[-14,-34]], [[-7,-50],[6,-31],[9,-3]], [[-14,-34],[-23,-3]], [[-2,-66],[14,-51],[23,-52]], [[23,-55],[23,0]]]){c.beginPath();points.forEach(([px,py],i)=>i?c.lineTo(px,py):c.moveTo(px,py));c.stroke()}
 c.restore();
}
function mount(host){
 const C=root.MongyuRestorationCatalog,G=root.MongyuRestorationStoryGraph,R=root.QuadRiftRestoration,M=root.MongyuRestorationMastery,$=id=>host.document.getElementById(id);
 if(!C||!R||!$('restorationCollection'))return null;
 const native=root.MongyuNativeRestoration;
 const stageHud=root.MONGYU_STAGE_HUD===true;
 const stageEdition=root.MONGYU_STAGE_EDITION===true;
 const routeEdition=root.MONGYU_ROUTE_EDITION===true;
 const dreamEdition=root.MONGYU_DREAM_EDITION===true;
 const polishEdition=root.MONGYU_POLISH_EDITION===true,TYPE_RATE=35,HOLD_FF=.35,FF_RATE=4,FF_PAGE=.3;
 const openingEnabled=(dreamEdition||root.MONGYU_PLAYABLE_RELEASE==='R97')&&!!root.MongyuOpening;
 const storage=native?native.isolatedStorage(host.storage):host.storage,skinJournal=root.MongyuMapSkins?.create(storage);
 const loaded=C.loadSave(storage);let save=loaded.save,storageOK=loaded.ok,readOnly=loaded.readOnly,selected=C.getSlot(save.selected)||C.slots[0];
 let audioBoardEntry=0,aftermath=null,scene=null,sceneLast=null,activeSlot=null,activeConfig=null,activeRun=null,callContext=null,award='',free=false,settingValue=false,settingTouched=false,qualified=false,summaryCache=null,launchAfterOpening=false,newBest=0,openingNeedsJump=false,line=null;
 let mastery=M?.load(storage)||{ok:true,save:null},completionSequence=0;
 // R104 polish-only UI memory (best polish score per memory, bridges already seen). Separate key: the catalog/mastery saves stay untouched.
 const UI_KEY='r104-ui';let uiStore=null,resultView=null,resultShow=null,hold=null,suppressTap=false;
 function uiData(){
  if(uiStore)return uiStore;uiStore={best:{},bridges:[]};
  try{const v=JSON.parse(storage.getItem(UI_KEY)||'null');if(v&&typeof v==='object'){if(v.best&&typeof v.best==='object')for(const [k,n] of Object.entries(v.best))if(Number.isSafeInteger(n)&&n>=0)uiStore.best[k]=n;if(Array.isArray(v.bridges))uiStore.bridges=v.bridges.filter(Number.isInteger)}}catch(_){}
  return uiStore;
 }
 function uiPersist(){try{storage.setItem(UI_KEY,JSON.stringify(uiData()))}catch(_){}}
 const journalButtons=[];
 const sessionId=Date.now().toString(36),completedRuns=new WeakSet(),aftermathRuns=new WeakSet(),progressCache=new Map(),buttons=[];
 const labels={story:'이야기',character:'동행',condition:'기억의 조건',boss:'대결',ending:'마지막 이야기'};
 function summary(){return summaryCache||(summaryCache=C.status(save))}
 function scoreProgress(slot=selected){if(!progressCache.has(slot.id))progressCache.set(slot.id,C.scoreProgress?.(save,slot.id)||{current:0,target:slot.rule.type==='cumulative-score'?slot.rule.target:slot.rule.type==='combined'?slot.rule.totalScore:0,remaining:0});return progressCache.get(slot.id)}
 function persist(next){save=next;summaryCache=null;progressCache.clear();const r=C.writeSave(storage,save);storageOK=r===true||r?.ok===true;if(r?.readOnly)readOnly=true;return storageOK}
 function text(id,value){const node=$(id);if(UI105)value=v105(String(value??''));if(node&&node.textContent!==String(value??''))node.textContent=String(value??'')}
 function ticketKind(slot){return {story:'S',boss:'B',character:'E',call:'?',interlude:'?'}[slot.rule.type]||''}
 function page(){return Math.floor((selected.number-1)/10)}
 function localRecord(key){return M?.get(mastery.save,key)||{bestScore:0,bestChain:0,attemptCount:0,clearCount:0}}
 function recordText(key){const v=localRecord(key);return v.attemptCount?['최고 '+v.bestScore+'점',v.bestChain?'연속 '+v.bestChain:'','완주 '+v.clearCount+'회'].filter(Boolean).join(' · '):''}
 function openingRecordText(){
  const record=localRecord('r97-opening');
  if(record.bestChain===0)return '';
  return record.bestChain===6?'최고 완주 · 여유 있게 '+(record.bestScore%100/10)+' / 6':'한 번에 모은 빛 '+record.bestChain+' / 6';
 }
 function focusSlot(){buttons[selected.number-1]?.focus({preventScroll:true})}
 function select(id,focus=false){const slot=C.getSlot(id);if(!slot)return false;if(slot.id!==selected.id){settingValue=false;settingTouched=false;award=''}selected=slot;render();if(focus)focusSlot();return true}
 function render(){
  if(root.MONGYU_SPECTRAL_EDITION)text('restorationTitle','꿈 지도');
  const s=summary(),currentPage=page();text('restorationProgress',UI105?'찾은 기억 '+s.collected+' / 100':s.collected+' / 100');text('restorationPage',(currentPage+1)+' / 10');
  const entries=C.collection(save);
  for(const entry of entries){
   const b=buttons[entry.number-1];if(!b)continue;
   const skin=skinJournal?.get(entry.number,entry.collected);if(skin!==null&&skin!==undefined&&b.dataset.skinPalette!==String(skin)){root.MongyuMapSkins.draw(b.skinPlate.getContext('2d'),skin);b.dataset.skinPalette=String(skin)}b.skinPlate.hidden=skin===null||skin===undefined;
   const chosen=entry.id===selected.id;b.hidden=Math.floor((entry.number-1)/10)!==currentPage;b.numberPlate.textContent=String(entry.number).padStart(3,'0');
   b.statePlate.textContent=entry.number===100&&entry.unlocked?(entry.collected?'감상 완료':'획득'):entry.collected?'찾음':entry.unlocked?'열림':'잠김';b.markPlate.textContent=entry.collected?'✓':entry.unlocked?(ticketKind(entry)||'→'):'×';
   if(routeEdition){b.dataset.frontier=String(entry.number===s.nextSlot);b.dataset.kind=entry.kind;}
   b.dataset.collected=String(entry.collected);b.dataset.locked=String(!entry.unlocked);b.tabIndex=chosen?0:-1;b.setAttribute('aria-pressed',String(chosen));b.setAttribute('aria-label',entry.number+'. '+entry.title+'. '+(entry.number===100&&entry.unlocked?(entry.collected?'감상한 마지막 이야기':'획득한 마지막 이야기'):entry.collected?'찾은 기억':entry.unlocked?'열린 기억':'잠긴 기억'));
  }
  $('restorationPagePrev').disabled=currentPage===0;$('restorationPageNext').disabled=currentPage===9;$('restorationRouteNext').disabled=!s.nextSlot;
  if(routeEdition)$('restorationRouteNext').hidden=!s.nextSlot||selected.number===s.nextSlot;
  const opening=selected.number===2&&openingEnabled;
  text('restorationSlotTitle',(routeEdition?'':String(selected.number).padStart(3,'0')+' · ')+(opening?'접힌 빛':selected.title));text('restorationKind',labels[selected.kind]||'기억');text('restorationInstruction',opening?'바닥, 벽, 천장에서 장애물을 넘어 빛 여섯 개를 모으세요.':selected.instruction);
  if(routeEdition){
   $('restorationKind').hidden=true;
   $('restorationInstruction').hidden=selected.number===1;
  }
  const masteryText=opening?openingRecordText():recordText(selected.id);
  text('restorationMastery',masteryText);$('restorationMastery').hidden=!masteryText;
  $('restorationSettingNotice').hidden=selected.rule.type!=='setting';
  text('restorationSettingNotice',selected.rule.setting==='sound'?'시작 소리를 고를 수 있어요. 시작 후 설정에서 소리를 한 번 바꾸면 됩니다. 켜기: 음악 40%, 효과음 45%. 끝나면 원래 설정으로 돌아갑니다.':selected.rule.setting==='vibration'?'시작 후 설정에서 시각 진동을 한 번 바꾸면 됩니다. 점프·착지·충돌의 시각 신호이며 화면은 흔들리지 않습니다.':'시작 속도를 고를 수 있어요. 시작 후 설정에서 속도를 한 번 바꾸면 됩니다.');
  const objective=scoreProgress();text('restorationObjective',objective.target?'이 기억 '+objective.current+' / '+objective.target+'점':'');$('restorationObjective').hidden=!objective.target;
  const lock=selected.number===100&&s.endingAcquired&&!s.endingViewed?'마지막 이야기를 얻었습니다. 끝까지 감상하면 자유 달리기가 열립니다.':C.lockReason(save,selected.id);
  text('restorationLock',lock||(routeEdition?'':'지금 들어갈 수 있어요.'));
  if(routeEdition)$('restorationLock').hidden=!lock;
  const open=C.unlocked(save,selected.id)||s.finished,obtained=save.collected.includes(selected.id),isSetting=selected.rule.type==='setting';
  $('restorationStart').disabled=!open;$('restorationSetting').hidden=!isSetting;$('restorationSettingOff').hidden=!isSetting;
  const fast=selected.rule.setting==='speed',initialValue=settingTouched?settingValue:fast?'slow':selected.rule.setting==='vibration';text('restorationSetting',fast?'빠르게':'켜기');text('restorationSettingOff',fast?'느리게':'끄기');
  $('restorationSetting').setAttribute('aria-pressed',String(fast?initialValue==='fast':initialValue===true));
  $('restorationSettingOff').setAttribute('aria-pressed',String(fast?initialValue==='slow':initialValue===false));
  text('restorationStart',selected.number===100&&s.endingAcquired?(s.endingViewed?'엔딩 다시 보기':'엔딩 보기'):routeEdition?(!open?'잠긴 기억':selected.traversal?(obtained?'다시 달리기':'달리기'):'이야기 보기'):obtained?'다시 들어가기':selected.traversal?'이 꿈 시작':'기억 만나기');
  $('restorationClock').hidden=!selected.rule.period;$('restorationFree').disabled=!s.finished;text('restorationFree',s.finished?'자유롭게 달리기':'자유 달리기 · 엔딩 감상 후');
  if(routeEdition){
   $('restorationFree').hidden=!s.finished;
   routeMap?.update({page:currentPage,entries:entries.slice(currentPage*10,currentPage*10+10),selected:selected.id,frontier:C.getSlot(s.nextSlot)?.id});
  }
  text('restorationNotice',readOnly?'기존 기록은 보존합니다. 지금 진행은 이번 실행에만 남습니다.':!storageOK?'저장할 수 없어 이번 실행에만 남습니다.':award||'');
  const palette=root.MongyuSquareArt?.palettes,tone=palette?.[(selected.chapter-1)%palette.length]?.hot; if(tone)host.document.body.style.setProperty?.('--world-color',tone);
 }
 function revealPending(){
  if(!save.pendingUnlock)return false;
  persist(C.reveal(save,save.pendingUnlock.id));
  selected=C.getSlot(save.selected)||selected;
  award='기억을 찾았습니다.';
  return true;
 }
 function nextMemory(event){
  revealPending();
  const next=summary().nextSlot;
  return next?start(event,next):open(event);
 }
 function open(event){host.audioGesture?.(event);
  revealPending();
  host.openDialog('restorationCollection',event);host.audioEntry?.({kind:'board',owner:++audioBoardEntry},event);render();focusSlot();return true
 }
 function chooseSetting(value,event){settingValue=value;settingTouched=true;host.prepareTrialSetting?.(selected.rule.setting,value,event);render()}
 function configFor(slot){return {period:$('restorationPeriod').value||'auto',characterId:slot.rule.characterId||save.characterId,setting:slot.rule.setting,settingValue:settingTouched?settingValue:slot.rule.setting==='speed'?'slow':slot.rule.setting==='vibration',settingTouched,freePlay:false}}
 function launch(event,config){
  scene=null;sceneLast=null;newBest=0;openingNeedsJump=false;free=!!config.freePlay;activeConfig={...config};qualified=false;
  const isCall=activeSlot.rule.type==='call'&&!free;
  // Local-call interruption remains the explicitly authored scene bridge.
  const opening=activeSlot.number===2&&!free&&openingEnabled;
  const Run=opening?root.MongyuOpening.OpeningRun:native&&!isCall&&native.slotMetadata(activeSlot.number,{freePlay:free}).supported?native.RestorationRun:R.RestorationRun;
  const run=new Run({settings:{speed:'fast'},slot:activeSlot,viewport:host.viewport?.(),attempt:save.attempt+1,practice:free||isCall,...config,openingAssist:!opening&&activeSlot.number===2&&!free,requireOpeningJump:!opening&&activeSlot.number===2&&!free&&!save.collected.includes(activeSlot.id),frontier:save.collected.length+1,priorCredit:save.nativeProgress?.[activeSlot.id]?.credit??save.slotScores[activeSlot.id]??0,recordScore:save.nativeProgress?.[activeSlot.id]?.recordScore??0});
  activeRun=run;callContext=isCall?{run,triggered:false,answered:false,pending:false,awarded:false}:null;
  host.startRun(run,event);return true;
 }
 function start(event,id,options={}){host.audioGesture?.(event);
  if(save.pendingUnlock)return open(event);
  if(id&&selected.id!==C.getSlot(id)?.id)select(id);
  if(!options.retry&&id&&(selected.rule.period||selected.rule.setting)){open(event);return true}
  if(!C.unlocked(save,selected.id)&&!summary().finished)return false;
  award='';qualified=false;free=false;activeSlot=selected;persist({...save,selected:selected.id});
  const config=options.config||configFor(selected),intro=INTRO[selected.number];
  launchAfterOpening=options.playAfterStory===true&&selected.number===1;
  if(launchAfterOpening&&openingEnabled&&!save.collected.includes(selected.id)){
   scene={kind:'opening',pages:[dreamEdition?'빛이 벽 너머로 갔어. 따라가 보자.':'벽 너머로 빛 하나가 굴러갔다. 길은 접혔지만, 달리기는 계속됐다.'],index:0,elapsed:0,beatAt:0};sceneLast=null;showScene(event);return true;
  }
  const sequence=G?.getSequence(selected);
  if(sequence){scene={kind:sequence.kind,graph:G.createState(selected),sequence,index:0,pages:sequence.steps,elapsed:0,beatAt:0};sceneLast=null;showScene(event);return true}
  if(selected.traversal||selected.rule.type==='call'){
   if(intro&&!options.retry){activeConfig={...config};scene={kind:'intro',pages:intro.pages,index:0,elapsed:0,beats:0,beatAt:0,intro,config};sceneLast=null;showScene(event);return true}
   // R104: a memory that would open cold gets its short bridge once (marked seen as soon as it shows; "건너뛰기" runs straight away).
   const bridge=polishEdition&&!options.retry&&!free&&G?.getInterlude?.(selected);
   if(bridge&&!uiData().bridges.includes(selected.number)){
    uiData().bridges.push(selected.number);uiPersist();activeConfig={...config};
    scene={kind:'bridge',bridge,pages:bridge.lines.map(l=>l.text),index:0,elapsed:0,beats:0,beatAt:0,config};sceneLast=null;showScene(event);return true;
   }
   return launch(event,config);
  }
  const vignette=VIGNETTES[selected.number],pages=vignette?.pages||selected.pages?.length&&selected.pages||[selected.instruction];
  scene={kind:selected.rule.type,index:0,pages,elapsed:0,rings:0,beats:0,beatAt:0,vignette};sceneLast=null;showScene(event);if(vignette?.effect==='ringtone')host.sceneCue?.('ringtone',event);return true;
 }
 function reaction(){if(scene?.graph)return '';return scene?.intro?.reaction??scene?.vignette?.reactions[scene.index]??STORY_REACTIONS[(scene.slot||selected).number]?.[scene.index]??''}
 // Native marker meanings, independently drawn shapes. Cadence is authored.
 function drawNativeMarker(c,marker,x,y,size,ink='#18121d'){
  c.save();c.translate(x,y);c.scale(size/24,size/24);c.lineWidth=2.6;c.lineCap='round';
  c.fillStyle=marker.kind==='heart'?'#ed4776':marker.kind==='blue-drop'?'#32528c':ink;c.strokeStyle=c.fillStyle;
  c.beginPath();
  if(marker.kind==='heart'){c.moveTo(0,9);c.bezierCurveTo(-22,-4,-7,-17,0,-7);c.bezierCurveTo(7,-17,22,-4,0,9);c.fill()}
  else if(marker.kind==='blue-drop'){c.moveTo(0,-13);c.bezierCurveTo(-3,-5,-9,0,-8,5);c.bezierCurveTo(-7,15,7,15,8,5);c.bezierCurveTo(9,0,3,-5,0,-13);c.fill()}
  else if(marker.kind==='question'){c.moveTo(-7,-7);c.bezierCurveTo(-7,-16,10,-16,8,-6);c.bezierCurveTo(7,-1,0,-2,0,4);c.stroke();c.fillRect(-1.6,8,3.2,3.2)}
  else if(marker.kind==='exclamation'){c.moveTo(0,-12);c.lineTo(0,4);c.stroke();c.fillRect(-1.6,8,3.2,3.2)}
  c.restore();
 }
 function drawNarrativePose(c,x,y,h,pose,t,reduced,ink){
  if(root.MongyuMobile)return root.MongyuMobile.narrative(c,x,y,h,pose,t,reduced,ink);
  const wave=reduced?1:(Math.sin(t*3)+1)/2,turn=pose==='turn-head'?(reduced?0.55:Math.sin(t*2.4)):0;
  c.save();c.translate(x,y);c.scale(h/100,h/100);c.strokeStyle='#f6f3e9';c.fillStyle='#f6f3e9';c.lineWidth=5;c.lineCap='round';
  c.fillRect(-7+turn*4,-100,14,16);c.fillRect(-8,-81,16,39);
  c.beginPath();c.moveTo(-4,-43);c.lineTo(-11,0);c.moveTo(4,-43);c.lineTo(12,0);
  const raised=pose==='raise-arms',spread=pose==='open-arms'?wave:0;
  for(const side of [-1,1]){c.moveTo(side*8,-76);c.lineTo(side*(raised?19:14+spread*9),raised?-88:-61-spread*9);c.lineTo(side*(raised?15:14+spread*18),raised?-105:-47-spread*20)}
  c.stroke();c.restore();
 }
 function drawSceneCast(){
  const canvas=$('restorationSceneCast'),A=root.MongyuSquareArt;if(!canvas||!A?.characters||!scene)return;
  const slot=scene.slot||selected,short=(host.viewport?.().height||800)<=480,height=short?200:320,baseline=height-30,bodyHeight=short?126:210,id=scene.intro?.cast||slot.characterId||'walker';
  if(canvas.height!==height)canvas.height=height;
  const c=canvas.getContext('2d');if(!c)return;
  const effect=scene.vignette?.effect||'',reduced=host.reduced?.(),phase=Math.min(1,(scene.elapsed-scene.beatAt)/.6);
  const lift=effect==='levitate'&&scene.index<2?(scene.index===0?(reduced?35:35*phase):70):0;
  canvas.dataset.character=id;canvas.dataset.reaction=reaction();canvas.dataset.effect=effect;canvas.setAttribute('aria-label',(C.characters.find(x=>x.id===id)?.name||'길')+' · '+(scene.vignette?.name||scene.intro?.name||'이야기'));
  const stage=scene.graph?G.stageForStep(slot,scene.index):sceneStage(slot,scene.index,scene.kind,dreamEdition&&scene.kind==='opening'?'':reaction()),fx={p:A.palettes[(slot.chapter-1)%A.palettes.length],t:0,gain:0,ink:root.MongyuStagecraft?.inkFor(root.MongyuMobile.worldPalette((slot.chapter||1)-1)[0],root.MongyuMobile.look().body)||'#18121d'};
  canvas.dataset.actors=stage.actors.map(a=>a.id).join(',');canvas.dataset.beat=stage.beat;
  canvas.dataset.roles=stage.actors.map(a=>a.sourceRole).join(',');
  canvas.dataset.speakerLane=String(stage.speakerLane??'');canvas.dataset.markerCode=String(stage.markerCode??'');canvas.dataset.renderCode=String(stage.nativeRenderCode??'');
  canvas.dataset.stepKind=scene.graph?G.getStep(slot,scene.index).kind:'';canvas.dataset.activeSpeakers=stage.actors.filter(a=>a.activeSpeaker).map(a=>a.id).join(',');
  canvas.dataset.markerKinds=stage.actors.filter(a=>a.marker).map(a=>a.marker.kind).join(',');canvas.dataset.observedPoses=stage.actors.filter(a=>a.pose).map(a=>a.pose).join(',');
  canvas.dataset.artProvenance=scene.graph?'authored-vectors-native-shape-meaning':'';
  canvas.dataset.reactions=stage.actors.filter(a=>a.reaction).map(a=>a.id+':'+a.reaction).join(',');
  const actorName=a=>({'dog-only':'솔','elder-alone':'담','red-form':scene.graph?'붉은 입 모양에 대응한 자체 형상':'옛 연인을 나타내는 붉은 형상'}[a.id]||C.characters.find(v=>v.id===a.id)?.name||'길');
  canvas.setAttribute('aria-label',stage.actors.map(a=>actorName(a)+(a.activeSpeaker?' 말하는 중':a.reaction?' '+({'!':'놀람','?':'의문','…':'말없음'}[a.reaction]||a.reaction):'')).join(', ')+(stage.beat==='departure'?' — 홀로 남은 길':''));
  if(scene.graph){const labels=stage.actors.filter(a=>a.marker).map(a=>a.marker.label);if(labels.length)canvas.setAttribute('aria-label',canvas.getAttribute('aria-label')+' · '+labels.join(', '));}
  c.clearRect(0,0,720,height);c.save();
  if(dreamEdition&&scene.kind==='opening'){
   c.beginPath();c.moveTo(53,baseline+2);c.lineTo(565,baseline+2);c.lineTo(621,baseline-12);c.lineTo(675,baseline-74);
   c.lineWidth=11;c.strokeStyle='#171124';c.stroke();c.lineWidth=2;c.strokeStyle='#d899c2';c.stroke();
   c.save();c.translate(530,baseline-111);c.rotate(Math.PI/4);c.strokeStyle='#ffdeac';c.strokeRect(-12,-12,24,24);c.fillStyle='#f9ac88';c.fillRect(-6,-6,12,12);c.restore();
  }else if(root.MongyuMobile){c.strokeStyle='#dcc6a666';c.lineWidth=1.5;c.beginPath();c.ellipse(360,baseline+8,300,10,0,0,Math.PI*2);c.stroke()}else{c.fillStyle='#f6f3e9';for(let x=45;x<680;x+=18)c.fillRect(x,baseline+7,14,6);}
  for(const actor of stage.actors){
   const x=actor.x,dog=actor.id==='dog-only',red=actor.id==='red-form',h=red?bodyHeight*.18:dog?bodyHeight*.4:bodyHeight;
   c.save();if(actor.facing===-1||effect==='look-back'&&scene.index<2){c.translate(x*2,0);c.scale(-1,1)}
   if(actor.pose)drawNarrativePose(c,x,baseline,h,actor.pose,scene.elapsed,!!reduced,fx.ink);
   else if(actor.id==='elder-alone')sceneElder(c,x,baseline,bodyHeight,fx.ink);
   else if(red){c.fillStyle='#ed4776';for(const [dx,dy,w,h]of [[-20,-12,40,12],[-12,-20,24,8],[-4,-27,12,7]])c.fillRect(x+dx,baseline+dy,w,h)}
   else if(dreamEdition&&root.MongyuMobile){
    const q={x,y:baseline-lift,bodyHeight:h,height:lift,pose:'stand'};
    if(dog)root.MongyuMobile.dog(c,q,{poseTime:scene.elapsed,ink:fx.ink},!!reduced);
    else root.MongyuMobile.sprite(c,q,{poseTime:scene.elapsed,ink:scene.kind==='opening'?'#fff2df':fx.ink},!!reduced,actor.id);
   }
   else A.characters(c,{characterId:dog?'dog':actor.id,player:dog?null:{x,y:baseline-lift,tangent:{x:1,y:0},height:lift,bodyHeight:h},companion:dog?{x,y:baseline,tangent:{x:1,y:0},bodyHeight:h}:null},fx,true);
   c.restore();
   if(actor.marker)drawNativeMarker(c,actor.marker,x+42,Math.max(28,baseline-h-15),short?22:30,fx.ink);
   if(actor.activeSpeaker&&scene.graph&&!dreamEdition){const by=Math.max(22,baseline-h-20);c.strokeStyle=fx.ink;c.lineWidth=2;c.beginPath();c.ellipse(x,by,30,15,0,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(x-6,by+14);c.lineTo(x-12,by+24);c.lineTo(x+4,by+15);c.stroke();c.fillStyle=fx.ink;for(const dx of [-10,0,10])c.fillRect(x+dx-2,by-2,4,4)}
   c.fillStyle=fx.ink;c.font='900 '+(short?26:38)+'px sans-serif';c.textAlign='center';c.fillText(actor.reaction,x+10,Math.max(28,baseline-h-(red?35:lift+12)));
  }
  if(effect==='ringtone'){c.font='700 24px sans-serif';c.textAlign='right';c.fillText(scene.index===2?'…':'따르릉',650,Math.max(40,baseline-bodyHeight/2));}
  c.restore();
 }
 function showScene(event){
  if(!scene)return;
  const slot=scene.slot||selected,isIntro=scene.kind==='intro',isInterlude=scene.kind==='interlude',isCall=scene.kind==='call';
  const storyTone=root.MongyuMobile?.worldPalette?.((slot.chapter||1)-1)?.[0];if(storyTone)$('restorationScene').style.setProperty?.('--story-world',storyTone);
  $('restorationScene').dataset.kind=scene.kind;$('restorationScene').dataset.effect=scene.vignette?.effect||'';
  $('restorationSceneLight').hidden=true;host.openDialog('restorationScene',event);
  // R104: the opening prologue chains straight into memory 002's run (map, result and record all use 002), so it carries that number.
  text('restorationSceneLabel',polishEdition&&scene.kind==='opening'?'002 · 접힌 빛':String(slot.number).padStart(3,'0')+' · '+(scene.intro?.name||scene.vignette?.name||slot.title));
  const openingVoice=dreamEdition&&scene.kind==='opening',step=scene.graph?G.getStep(slot,scene.index):null,other=slot.number===100?'붉은 형상':({22:'솔',47:'담',69:'여울',87:'여울'}[slot.number]||'');
  const isBridge=scene.kind==='bridge',bridgeLine=isBridge?scene.bridge.lines[scene.index]:null,bridgeVoice=!!bridgeLine&&(UI105||bridgeLine.kind!=='narration');
  const speaker=openingVoice||bridgeVoice?'길':step&&['reflection','thought'].includes(step.kind)?'길 · 독백':step?.speakerLane===0?'길':step?.speakerLane===1?other:step?.speakerLane===2?'길 · '+other:'';
  $('restorationScene').dataset.presentation=openingVoice||bridgeVoice||step&&['dialogue','thought','reflection','hesitation'].includes(step.kind)?'speech':'narration';$('restorationScene').dataset.speaker=String(step?.speakerLane??'self');$('restorationScene').querySelector?.('.scene-balloon')?.style?.setProperty?.('--speaker-x',step?.speakerLane===0?'25%':step?.speakerLane===1?'75%':'50%');
  text('restorationSceneSpeaker',isCall?'꿈속 전화':speaker);$('restorationSceneSpeaker').hidden=!isCall&&!speaker;
  text('restorationScenePage',scene.kind==='opening'?'':(scene.index+1)+' / '+scene.pages.length);
  const bossRule=slot.rule.type==='boss'?R.BOSS_RULES[R.BOSS_SLOTS.indexOf(slot.number)]:null;
  const lineText=step?(step.alternateText!==undefined?'길: '+v105(step.text)+'\n'+other+': '+v105(step.alternateText):v105(step.text||step.action)):v105(scene.pages[scene.index]);
  if(polishEdition)startLine(lineText);else text('restorationSceneText',lineText);
  $('restorationSceneText').style.whiteSpace='pre-line';$('restorationSceneText').dataset.kind=step?.kind||'';text('restorationSceneRule',isIntro?(bossRule?.instruction||slot.instruction):'');$('restorationSceneRule').hidden=!isIntro;
  text('restorationSceneNext',isIntro?'준비됐어 · 시작':isCall?'꿈속 전화 받기':scene.index===scene.pages.length-1?(isBridge?'달리기 시작':launchAfterOpening?'첫 달리기 시작':'기억에 남기기'):'계속');
  $('restorationSceneNext').hidden=false;$('restorationSceneNext').disabled=isCall&&scene.rings<2;if(polishEdition)paintLine();
  $('restorationSceneAction').hidden=!!scene.graph||scene.index===0||isInterlude||isIntro||isCall||isBridge;text('restorationSceneAction','앞 장면');
  text('restorationSceneSkip',isIntro?(root.MONGYU_SPECTRAL_EDITION?'꿈 지도':'세계 모음'):isCall?'받지 않고 달리기':isBridge?'건너뛰기':'나중에 보기');drawSceneCast();
  host.audioEntry?.({kind:'scene',owner:scene,sceneKind:scene.kind,spoken:openingVoice||!!speaker,nativeState:scene.sequence?.nativeState,nativeRow:scene.sequence?.nativeRow},event);
  ($('restorationSceneNext').disabled?$('restorationSceneSkip'):$('restorationSceneNext')).focus({preventScroll:true});
 }
 // R104 typewriter: one span per character keeps the full sentence in the live region at once; only classes change while typing.
 function startLine(value){
  const node=$('restorationSceneText'),full=String(value??''),chars=Array.from(full),instant=!!host.reduced?.()||scene?.kind==='call';
  line={full,count:chars.length,at:scene?.elapsed||0,shown:instant?chars.length:0,typed:0,doneAt:null,spans:null,painted:0};
  if(instant||!chars.length||!host.document.createElement||!node?.replaceChildren){text('restorationSceneText',full);line.shown=line.count;return}
  line.spans=chars.map(ch=>{const span=host.document.createElement('span');span.className='tw-c';span.textContent=ch;return span});
  node.replaceChildren(...line.spans);
  if(node.textContent!==full){node.textContent=full;line.spans=null;line.shown=line.count}
 }
 function lineTyping(){return !!line&&line.shown<line.count&&$('restorationSceneText')?.textContent===line.full}
 function paintLine(){
  if(!line)return;
  if(line.spans){if($('restorationSceneText').children?.[0]!==line.spans[0])line.shown=line.count;const to=Math.min(line.shown,line.count);for(let i=line.painted;i<to;i++)line.spans[i].classList.add('tw-on');line.painted=Math.max(line.painted,to)}
  const next=$('restorationSceneNext'),state=lineTyping()?'typing':next.disabled||next.hidden?'wait':'done',view=$('restorationScene');
  if(view.dataset.line!==state)view.dataset.line=state;
 }
 function completeLine(){if(!line)return false;line.shown=line.count;paintLine();return true}
 // R104: a tap anywhere but a control first finishes the typing line, then acts like the next button (never while it is disabled).
 function tapScene(event){
  // The click that ends a fast-forward hold is not a tap.
  const swallow=suppressTap&&suppressTap.scene===scene&&scene.elapsed-suppressTap.at<.6;suppressTap=false;if(swallow)return false;
  if(!scene||host.dialog?.()!=='restorationScene'||event.target?.closest?.('button,a,input,select,textarea,label,summary'))return false;
  const next=$('restorationSceneNext');
  if(lineTyping()){completeLine();(next.disabled?$('restorationSceneSkip'):next).focus({preventScroll:true});return true}
  if(next.hidden||next.disabled)return false;
  return nextScene(event);
 }
 function finishEvent(proof,gesture){
  const before=save.collected.length,shouldLaunch=launchAfterOpening;
  launchAfterOpening=false;
  persist(C.commitEvent(save,{slotId:selected.id,...proof}));
  award=save.pendingUnlock||save.collected.length>before?'기억을 찾았습니다.':'아직 조건이 완성되지 않았습니다.';
  scene=null;
  if(shouldLaunch&&(save.pendingUnlock||save.collected.length>before))return nextMemory(gesture);
  const next=summary().nextSlot;
  if(next)selected=C.getSlot(next);
  return open(gesture);
 }
 function nextScene(event){host.audioGesture?.(event);
  if(!scene)return false;
  if(scene.kind==='opening')return finishEvent({type:'opening-read',scene:'light-folds'},event);
  if(scene.graph){scene.graph=G.advance(scene.graph);const proof=G.completionProof(scene.graph);if(proof)return finishEvent(proof,event);scene.index=scene.graph.cursor;showScene(event);return true}
  if(scene.kind==='intro')return launch(event,scene.config);
  if(scene.kind==='bridge'){if(scene.index<scene.pages.length-1){scene.index++;showScene(event);return true}return launch(event,scene.config)}
  if(scene.kind==='call'){
   if(scene.rings<2||!callContext)return false;
   callContext.beforeTime=callContext.run.time;callContext.answered=true;callContext.pending=true;scene=null;host.resumeRun?.(event);return true;
  }
  if(scene.kind==='interlude'){
   scene.beats++;scene.beatAt=scene.elapsed;
   if(scene.beats===3)return finishEvent({type:'interlude',beats:3,completed:true});
   scene.index=scene.beats;showScene(event);if(scene.vignette?.effect==='ringtone'&&scene.index<2)host.sceneCue?.('ringtone',event);return true;
  }
  if(scene.index<scene.pages.length-1){scene.index++;showScene(event);return true}
  return finishEvent({type:'story-read',pageCount:scene.pages.length});
 }
 function skipScene(event){host.audioGesture?.(event);if(scene?.kind==='bridge')return launch(event,scene.config);launchAfterOpening=false;if(scene?.graph)scene.graph=G.cancel(scene.graph);if(scene?.kind==='intro'){scene=null;return open()}if(scene?.kind==='call'){scene=null;callContext.answered=false;callContext.pending=false;return host.resumeRun?.(event)}scene=null;return open()}
 function continueJourney(event){const s=summary(),last=C.getSlot(save.selected),slot=last&&!save.collected.includes(last.id)&&C.unlocked(save,last.id)?last:C.getSlot(s.nextSlot)||last||C.slots[0];return start(event,slot.id,{playAfterStory:true})}
 function aftermathSpec(run){
  if(run?.encounter?.kind==='sun')return {kind:'sun',release:2,duration:5,text:'이런 녀석도 있었군.',releaseText:'흰 햇살이 사라집니다.'};
  if(run?.encounter)return {kind:'encounter',release:2.4,duration:4.4,text:{alien:'멍. 이제 가자.',chain:'사슬이 풀렸다.',radial:'돌던 빛이 잠잠해졌다.',wave:'물결이 잦아들었다.',robot:'박자가 끊겼네.' ,orbit:'회오리가 잦아든 자리에 허전함이 남았다.',heart:'길은 자신이 줄곧 옛 연인의 안을 달렸음을 깨달았다.'}[run.encounter.kind],releaseText:run.encounter.kind==='alien'?'흰 사각이 사라집니다.':run.encounter.kind==='heart'?'노란 경계가 사라집니다.':'마지막 사각이 흩어집니다.'};
  if(run?.slot?.number===38&&run.boss?.ruleId==='contact-return')return {kind:'face',release:2.5,duration:4.2,text:'돌려받으세요.',releaseText:'흰 얼굴이 사각 조각으로 흩어집니다.'};
  if(run?.slot?.number===20&&run.boss?.ruleId==='leg-sweep')return {kind:'leg',release:1.25,duration:4,text:'발걸음이 한결 가벼워졌다.',releaseText:'커다란 몸이 사각 조각으로 흩어집니다.'};
  if(run?.slot?.number===8&&run.boss?.ruleId==='charge-release')return {kind:'sun',release:2,duration:5,text:'이런 녀석도 있었네.',releaseText:'빛의 조각들이 흩어집니다.'};
  if(run?.slot?.number===99&&run.boss?.ruleId==='boundary-strike')return {kind:'heart',release:.65,duration:3.6,text:'길은 자신이 줄곧 옛 연인의 안을 달렸음을 깨달았다.',releaseText:'남은 경계가 흩어집니다.'};
  return null;
 }
 function aftermathFor(run){if(!aftermath||aftermath.run!==run)return null;const spec=aftermathSpec(run);return {...spec,phase:aftermath.elapsed<spec.release?'release':'line',elapsed:aftermath.elapsed,paused:aftermath.paused}}
 function aftermathRenderFor(run){const spec=aftermathSpec(run);return aftermathFor(run)||(aftermathRuns.has(run)&&spec?{...spec,phase:'settled',elapsed:spec.duration,text:''}:null)}
 function cancelAftermath(){aftermath=null;$('restorationAftermath').hidden=true}
 function finishAftermath(){if(!aftermath)return false;cancelAftermath();host.refresh();return true}
 function suspendAftermath(){if(aftermath){aftermath.paused=true;aftermath.last=null}}
 function complete(run){
  if(!activeSlot||run.mode!=='restoration'||!run.result||completedRuns.has(run))return;completedRuns.add(run);
  if(callContext?.run===run){award=callContext.awarded?'전화를 받고 달리기로 돌아왔습니다.':'전화를 받지 못했습니다. 다시 시도할 수 있어요.';return}
  const result={...run.result};
  if(polishEdition)resultView=run.openingCourse&&run.practice?null:polishResult(run,result);
  if(run.openingCourse&&run.practice){qualified=false;return}
  if(run.options.requireOpeningJump&&result.state==='clear'&&(!run.inputCount||!result.jumps)){
   openingNeedsJump=true;
   award='장애물에 닿기 전에 화면을 눌러 첫 점프를 해 보세요.';
   qualified=false;
   return;
  }
  if(M){
   const key=result.freePlay?'freeplay':run.openingCourse?'r97-opening':activeSlot.id;
   const previous=localRecord(key),previousBest=previous.bestScore;
   mastery=M.record(storage,key,result,sessionId+':'+(++completionSequence));
   newBest=mastery.ok&&result.score>previousBest?result.score-previousBest:0;
   // R104: the badge needs a stored best to beat; the opening result shows lights, so it must collect more lights than that best.
   if(polishEdition&&newBest&&(!previous.attemptCount||run.openingCourse&&!(result.bestCombo>previous.bestChain)))newBest=0;
  }
  if(run.options.freePlay||result.freePlay){qualified=false;award='자유 달리기 기록';return}
  if(activeSlot.rule.type==='setting'&&!run.nativeRuntime){
   const proof=run.settingProof();delete result.settingCredit;
   result.settingValue=proof.settingValue;result.settingChanged=proof.settingChanged;result.settingExperienced=proof.settingExperienced;
   if(proof.settingCredit)result.settingCredit={...proof.settingCredit};
  }
  const before=save.collected.length,priorAttempt=save.attempt,next=C.commit(save,activeSlot.id,result);
  qualified=result.attempt===priorAttempt+1&&next.attempt===result.attempt&&C.validateResult(activeSlot.id,result)&&C.meets(activeSlot,result,next);persist(next);
  if(qualified&&run.nativeRuntime&&skinJournal&&!skinJournal.record(activeSlot.number,run.nativeFrame?.map?.t,true))storageOK=false;
  if(qualified&&aftermathSpec(run)&&run.state==='clear'&&run.boss?.hp===0){aftermathRuns.add(run);aftermath={run,elapsed:0,last:null,paused:false};}
  const objective=scoreProgress(activeSlot);award=save.pendingUnlock||save.collected.length>before?'기억을 찾았습니다.':qualified?'찾은 기억을 다시 만났습니다.':activeSlot.rule.type==='setting'?'설정 변경 조건을 확인하고 다시 바꿔 보세요.':objective.target?'이 기억 '+objective.current+' / '+objective.target+'점 · 다음 시도에 이어집니다.':'조건을 채우지 못했습니다. 같은 길에 다시 도전할 수 있어요.';
 }
 // ---- R105 screens: result sheet, pause line, story list, wardrobe, old map ("예전 꿈") ----
 let result105=null;
 const ICON105={squareNext:'chevron',squareRetry:'retry',squarePractice:'play',squareCollection:'map',squareRestart:'retry',squareHome:'home',sharePoster:'poster',shareClip:'video'};
 function sync105Result(v){
  const panel=$('squareResult');if(!panel?.querySelector)return;
  const identity=panel.querySelector('.result-identity'),box=panel.querySelector('.box'),actions=panel.querySelector('.result-actions');
  if(!identity||!box||!actions)return;
  if(!result105){
   result105={portrait:portrait105(identity,'pose-hurt')};
   panel.dataset.r105='result';
   for(const [id,name] of Object.entries(ICON105))$(id)?.setAttribute('data-r105-icon',name);
   for(const id of ['sharePoster','shareClip']){const b=$(id);if(b&&!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.textContent)}
  }
  // share pair and the tap-to-retry hint live inside the sheet, so everything sits in the bottom third
  const bar=$('r104ShareBar');if(bar&&bar.parentNode!==actions)actions.appendChild(bar);
  const hint=panel.querySelector('.r104-retry-hint');if(hint&&hint.parentNode!==box)box.appendChild(hint);
  setPortrait105(result105.portrait,v.state==='clear'?'pose-joy':'pose-hurt');
  panel.dataset.outcome105=v.state;
 }
 function sync105Pause(v){
  const node=$('pauseContext');if(!node)return;
  const t=pauseLine105(v,node.textContent);
  if(node.textContent!==t)node.textContent=t;
 }
 function summary105(slot){
  const seq=G?.getSequence?.(slot);const first=seq?.steps?.[0];
  const line=v105(first?.text||first?.action||slot.instruction||'');
  return String(line).split('\n')[0];
 }
 function journal105(list){
  const entries=G.sequences.map(sequence=>{const slot=C.getSlot(sequence.slot),collected=save.collected.includes(slot.id);return {slot,sequence,unlocked:collected||C.unlocked(save,slot.id)}});
  const {open,locked}=journalState105(entries);
  const d=host.document,make=(tag,cls,parent,value)=>{const n=d.createElement(tag);n.className=cls;if(value!==undefined)n.textContent=value;parent?.appendChild(n);return n};
  const head=make('p','r105-journal-count',list,'만난 이야기 '+open.length+' / '+entries.length);
  for(const {slot} of open){
   const b=d.createElement('button');b.id='story-page-'+slot.number;b.setAttribute('id',b.id);b.className='r105-story-card';b.type='button';
   make('span','r105-story-no',b,String(slot.number).padStart(3,'0'));
   const body=make('span','r105-story-body',b);make('span','r105-story-title',body,slot.title);make('span','r105-story-line',body,summary105(slot));
   b.onclick=e=>start(e,slot.id);list.appendChild(b);journalButtons.push(b.id);
  }
  if(locked>0){
   const row=make('p','r105-story-locked',list);
   const ic=root.MongyuIcons?.el?.('lock',{size:20});if(ic)row.appendChild(ic);
   make('span','',row,'아직 만나지 못한 이야기 '+locked+'개');
  }
  return head;
 }
 function wardrobe105(){
  const panel=$('wardrobePanel'),looksEl=$('wardrobeLooks'),M2=root.MongyuMobile,d=host.document;
  if(!panel?.querySelector||!looksEl||!M2?.looks||!d.createElement)return;
  const box=panel.querySelector('.box'),count=$('wardrobeCount');if(!box||!count)return;
  const hero=d.createElement('div');hero.className='r105-ward-hero';
  const aura=d.createElement('span');aura.className='r105-ward-aura';aura.setAttribute('aria-hidden','true');hero.appendChild(aura);
  const pose=portrait105(hero,'pose-stand','r105-ward-pose');
  const name=d.createElement('p');name.className='r105-ward-name';hero.appendChild(name);
  box.insertBefore(hero,count);
  const locked=d.createElement('p');locked.className='r105-ward-locked';
  const status=$('wardrobeStatus');box.insertBefore(locked,status);
  let busy=false;
  function sync(){
   if(busy)return;busy=true;
   try{
    const n=summary().collected;let equipped=null;
    const {remaining,next}=wardrobeState105(M2.looks,item=>M2.available(item.id,n));
    for(const item of M2.looks){
     const b=$('look-'+item.id);if(!b)continue;
     const owned=M2.available(item.id,n);
     b.dataset.owned=String(owned);b.dataset.next='false';
     if(b.getAttribute('aria-pressed')==='true'&&owned)equipped=item;
    }
    for(const item of M2.looks){const b=$('look-'+item.id);if(!b)continue;const isNext=!!next&&item.id===next.id;b.dataset.next=String(isNext);b.hidden=b.dataset.owned!=='true'&&!isNext;const ic=b.getAttribute('aria-pressed')==='true'&&b.dataset.owned==='true'?'check':isNext?'lock':'';if(ic)b.setAttribute('data-r105-icon',ic);else b.removeAttribute('data-r105-icon')}
    const eq=equipped||M2.looks[0];
    aura.style.background='radial-gradient(circle at 50% 55%,'+eq.body+'66,'+eq.accent+'22 55%,transparent 72%)';
    name.textContent=eq.name+' · 입는 중';
    locked.hidden=remaining===0;
    locked.textContent=remaining?'열리면 이 자리에 나와요 · '+remaining+'벌 남음':'';
    const st=$('wardrobeStatus');
    if(st&&/실행/.test(st.textContent))st.textContent='이번 플레이에만 옷을 보관할 수 있어요.';
    if(count&&/100개의 기억$/.test(count.textContent))count.textContent=count.textContent.replace(/^(\d+) \/ 100개의 기억$/,'찾은 기억 $1 / 100');
   }finally{busy=false}
   void pose;
  }
  if(typeof root.MutationObserver==='function'){
   new root.MutationObserver(sync).observe(looksEl,{attributes:true,subtree:true,attributeFilter:['aria-pressed','disabled']});
   new root.MutationObserver(sync).observe(panel,{attributes:true,attributeFilter:['hidden']});
  }
  sync();
  const open=$('shopOpen');if(open?.addEventListener)open.addEventListener('click',()=>root.setTimeout?.(sync,0));
 }
 function onRunStatus(v){
  const active=v?.mode==='restoration',after=aftermathFor(host.activeRun());$('restorationAftermath').hidden=!after;
  if(after)text('restorationAftermathStatus',after.phase==='release'?after.releaseText:after.text);
  host.document.body.dataset.restoration=String(active);$('squareCollection').hidden=!active;$('pauseRestoration').hidden=!active;
  const isResult=['clear','fail'].includes(v.state);
  if(UI105&&active&&isResult)sync105Result(v);
  if(UI105)sync105Pause(v);
  if(stageEdition){
   $('squareResult').dataset.outcome=isResult?(stageHud&&qualified?'clear':v.state):'';
   $('openingResultProgress').hidden=!(isResult&&v.opening);
  }
  if($('squarePractice'))$('squarePractice').hidden=!(isResult&&v.opening&&!v.opening.practice&&v.state==='fail');
  const nextSlot=save.pendingUnlock&&activeSlot?.number<100?activeSlot.number+1:summary().nextSlot;
  $('squareNext').hidden=!active||v.freePlay||!isResult||!qualified||!nextSlot;
  $('restorationCall').hidden=!active||v.state!=='play'||activeSlot?.rule.type!=='call'||callContext?.triggered||(activeRun?.time||0)<.2;
  $('restorationResultScore').hidden=!active;$('restorationResultWorld').hidden=!active;
  if(!active){$('restorationResultMastery').hidden=true;$('restorationResultNext').hidden=true;$('squareRestart').hidden=false;if(polishEdition)syncPolishResult(false);return}
  const objective=scoreProgress(activeSlot),isFree=!!v.freePlay;
  if(objective.target&&!isFree&&!v.nativeRuntime){const current=Math.min(objective.target,objective.current+(['play','pause'].includes(v.state)?v.score:0));text('squareHud',activeSlot.number+' · '+v.roomTitle+'\n이 기억 '+current+' / '+objective.target+'  '+('●'.repeat(Math.max(0,v.hearts))))}
  if(v.deathAnimation&&!v.deathAnimation.completed)text('hudCue','달리기를 마무리합니다.');else if(v.scoreFinalization&&v.qualified&&v.state==='play')text('hudCue','목표 달성 · 계속 달립니다.');
  if(isFree)text('squareHud','자유 달리기 · '+((v.wave||0)+1)+'번째 길\n'+v.score+'점  '+('●'.repeat(Math.max(0,v.hearts))));
  if(isResult&&v.opening){
   showOpeningResult(v,nextSlot);if(polishEdition)syncPolishResult(true);return;
  }
  if(isResult){
   text('squareHeading',openingNeedsJump?'첫 점프 연습':isFree?'이번 자유 달리기':qualified?'기억 획득':v.state==='clear'?'이번 달리기':'꿈이 접혔다');
   text('restorationResultWorld',isFree?'자유 달리기':activeSlot.number+' · '+v.roomTitle);
   $('restorationResultScore').hidden=openingNeedsJump;
   text('restorationScoreValue',String(v.score));
   $('squareRetry').hidden=false;$('squareRestart').hidden=true;
   text('squareRetry','다시 달리기');
   text('squareNext','다음 기억으로');
   text('squareCollection','꿈 지도');
   const primary=!$('squareNext').hidden?'squareNext':qualified?'squareCollection':'squareRetry';
   $('squareResult').dataset.primaryAction=primary;
   for(const id of ['squareNext','squareCollection','squareRetry','squareRestart','squareHome'])$(id).dataset.primary=String(id===primary);
   const detail=['기억을 찾았습니다.','찾은 기억을 다시 만났습니다.','자유 달리기 기록'].includes(award)?'':award;
   const currentGoal=v.scoreFinalization&&v.scoreObjective?.target>0&&v.scoreObjective;
   const reason=qualified||openingNeedsJump?'':currentGoal&&openingEnabled?'이번 '+currentGoal.current+' / 목표 '+currentGoal.target+'점':v.state==='fail'&&v.hearts===0?'남은 기회를 모두 썼어요.':v.result?.reason;
   text('restorationRecordBadge',newBest?'새 최고 기록':'');
   $('restorationRecordBadge').hidden=!newBest;
   const goal=stageHud&&!qualified&&objective.target?'누적 '+objective.current+' / '+objective.target+'점':'';
   text('squareSummary',[goal||reason,goal?'':detail,!storageOK||readOnly?'진행은 이번 실행에만 남습니다.':''].filter(Boolean).join('\n'));
   const recordKey=isFree?'freeplay':activeSlot.id;
   const best=localRecord(recordKey).bestScore;
   const masteryNote=stageHud?(best>v.score?'최고 '+best+'점':''):recordText(recordKey);
   text('restorationResultMastery',masteryNote+(!mastery.ok?'\n기록을 저장할 수 없어 이번 실행에만 남습니다.':''));
   $('restorationResultMastery').hidden=!$('restorationResultMastery').textContent;
   const next=C.getSlot(nextSlot);text('restorationResultNext',qualified&&next?'다음 · '+next.number+' '+next.title:'');$('restorationResultNext').hidden=!qualified||!next;
  }
  if(polishEdition)syncPolishResult(isResult);
 }
 function showOpeningResult(v,nextSlot){
  const {section,passed,total,clean,practice,crash}=v.opening,cleared=v.state==='clear';
  const record=openingRecordText();
  text('squareHeading',practice?'구간 연습 완료':cleared?'빛의 문을 열었다':stageEdition?'충돌 · '+section:section+'에서 멈췄다');
  text('restorationResultWorld','002 · 접힌 빛');
  $('restorationResultScore').hidden=true;$('squareRestart').hidden=true;$('squareRetry').hidden=false;
  text('squareRetry',practice?'처음부터 도전':'다시 달리기');
  text('squareNext','다음 기억으로');text('squareCollection','꿈 지도');
  const primary=$('squareNext').hidden?'squareRetry':'squareNext';
  $('squareResult').dataset.primaryAction=primary;
  for(const id of ['squareNext','squareCollection','squareRetry','squareRestart','squareHome','squarePractice'])$(id).dataset.primary=String(id===primary);
  text('restorationRecordBadge',!practice&&newBest?(stageEdition?'새 기록':'새 점수 기록'):'');
  $('restorationRecordBadge').hidden=practice||!newBest;
  if(stageEdition){
   const shards=$('openingResultShards');
   shards.replaceChildren(...Array.from({length:total},(_,i)=>{
    const shard=host.document.createElement('i');shard.dataset.lit=String(i<passed);return shard;
   }));
   text('openingResultCount','빛 '+passed+' / '+total);
   const hint=cleared?'':crash?.early?'장애물에 조금 더 가까워진 뒤 탭':'장애물에 닿기 직전에 탭';
   text('squareSummary',[hint,!storageOK||readOnly?'기록은 이번 실행에만 남습니다.':''].filter(Boolean).join('\n'));
   text('restorationResultMastery',newBest||practice?'':record);
   $('restorationResultMastery').hidden=newBest||practice||!record||cleared;
   $('restorationResultNext').hidden=true;
   return;
  }
  const detail=practice?'이 구간의 장애물 2개를 넘었어요.':cleared?'문 너머에서 물소리가 들려요.':v.result.reason+'. '+(crash.early?'다음엔 장애물에 조금 더 가까워졌을 때 탭하세요.':'다음엔 장애물에 닿기 전에 탭하세요.');
  text('squareSummary',detail+'\n'+(practice?'연습은 꿈 지도 기록에 반영되지 않아요.':'빛 '+passed+' / '+total+' · 여유 있게 넘은 장애물 '+clean+'개')+(!storageOK||readOnly?'\n진행은 이번 실행에만 남습니다.':''));
  text('restorationResultMastery',record);
  $('restorationResultMastery').hidden=practice||!record;
  const next=qualified&&C.getSlot(nextSlot);
  text('restorationResultNext',next?'다음 · '+next.title:'');$('restorationResultNext').hidden=!next;
 }
 // ---- R104 result: big polish score with a 1 s count-up, three stamped stars, best score, fail-screen tap retry ----
 const fmt=n=>String(Math.max(0,Math.floor(n))).replace(/\B(?=(\d{3})+(?!\d))/g,',');
 const STAR='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.85 6.4.72-4.76 4.36 1.3 6.32L12 16.86l-5.64 3.19 1.3-6.32L2.9 9.37l6.4-.72z"/></svg>';
 const COUNT_UP=1,STAR_AT=1.08,STAR_GAP=.3;
 function polishResult(run,result){
  if(result.practice&&!result.freePlay)return null;
  const opening=!!run.openingCourse,key=result.freePlay?'freeplay':opening?'r97-opening':activeSlot.id;
  const score=Math.max(0,Math.floor(Number(opening?run.score:result.score)||0)),store=uiData();
  const prev=Math.max(store.best[key]||0,opening?0:localRecord(key).bestScore||0);
  if(score>(store.best[key]||0)){store.best[key]=score;uiPersist()}
  const clear=result.state==='clear',total=opening?run.endIndex-run.firstIndex:0,passed=opening?run.index-run.firstIndex:0;
  let objective=null;if(!opening)try{objective=run.status?.().scoreObjective||null}catch(_){}
  const goal=opening?total>0&&passed>=total:!!run.goalQualified||!!(objective&&objective.target>0&&objective.current>=objective.target);
  const lives=Number.isFinite(result.initialLives)?result.initialLives:run.initialLives;
  const clean=opening?run.hits===0&&!(run.checkpointRetries>0):result.hits===0&&!(Number.isFinite(lives)&&Number.isFinite(result.livesRemaining)&&result.livesRemaining<lives);
  return {run,key,score,prev,best:Math.max(prev,score),newRecord:prev>0&&score>prev,state:result.state,free:!!result.freePlay,
   stars:[clear,goal,clean],labels:['완주',opening?'빛 '+total+' / '+total:'목표 달성',opening?'무충돌':'하트 그대로']};
 }
 let resultNodes;
 function resultDom(){
  if(resultNodes!==undefined)return resultNodes;
  const d=host.document,heading=$('squareHeading'),panel=$('squareResult');
  if(!d.createElement||!heading||!panel)return resultNodes=null;
  const el=(tag,cls,parent,value)=>{const n=d.createElement(tag);n.className=cls;if(value!==undefined)n.textContent=value;parent?.appendChild(n);return n};
  const box=el('div','r104-result');box.hidden=true;
  const row=el('div','r104-result-row',box),scoreLine=el('p','r104-result-score',row),value=el('span','r104-result-value',scoreLine,'0');el('span','r104-result-unit',scoreLine,'점');
  const starList=el('ol','r104-stars',row),stars=[0,1,2].map(()=>{const li=el('li','r104-star',starList);li.dataset.on='false';const icon=el('span','r104-star-icon',li);icon.innerHTML=STAR;const label=el('span','r104-star-label',li);return {li,label}});
  const meta=el('p','r104-result-meta',box),fresh=el('span','r104-result-new',meta,'새 기록'),best=el('span','r104-result-best',meta);
  const hint=el('p','r104-retry-hint',panel,'탭하면 이 구간부터 다시');hint.hidden=true;hint.setAttribute('aria-hidden','true');
  if(typeof heading.after==='function')heading.after(box);if(!box.parentNode)heading.parentNode?.appendChild?.(box);
  return resultNodes={box,value,scoreLine,starList,stars,meta,fresh,best,hint};
 }
 function checkpointable(run){return !!run?.openingCourse&&!run.practice&&typeof run.retryFromCheckpoint==='function'}
 function syncPolishResult(isResult){
  const nodes=resultDom(),view=isResult&&resultView&&resultView.run===activeRun&&!openingNeedsJump?resultView:null;
  $('squareResult').dataset.tapRetry=String(!!view&&view.state==='fail');
  if(!nodes)return;
  nodes.box.hidden=!view;nodes.hint.hidden=!view||view.state!=='fail';
  if(!view){resultShow=null;return}
  $('restorationResultScore').hidden=true;$('restorationResultMastery').hidden=true;
  // A clear says "빛 6 / 6" in its second star, so the shard row would only repeat it (and push the text into the poster shot).
  if(view.state==='clear'&&view.run.openingCourse&&$('openingResultProgress'))$('openingResultProgress').hidden=true;
  text('restorationRecordBadge',view.newRecord?'새 기록':'');$('restorationRecordBadge').hidden=!view.newRecord;
  if(resultShow?.view===view)return;
  const starsOn=view.state==='clear'&&!view.free;
  resultShow={view,start:null,done:false,stamped:0,starsOn,at:null};
  nodes.box.dataset.state=view.state;nodes.starList.hidden=!starsOn;nodes.fresh.hidden=true;nodes.box.dataset.fresh='false';
  nodes.scoreLine.setAttribute('aria-label',fmt(view.score)+'점');
  nodes.starList.setAttribute('aria-label','별 3개 중 '+view.stars.filter(Boolean).length+'개 · '+view.labels.filter((_,i)=>view.stars[i]).join(', '));
  view.stars.forEach((on,i)=>{const s=nodes.stars[i];s.li.dataset.on='false';s.li.dataset.earned=String(on);s.li.dataset.stamp='false';s.label.textContent=v105(view.labels[i])});
  text('restorationResultMastery','');
  nodes.best.textContent=view.newRecord?'이전 최고 '+fmt(view.prev):view.best>view.score?'최고 '+fmt(view.best):view.prev>0?'최고 기록과 같아요':'';
  nodes.meta.hidden=!view.newRecord&&!nodes.best.textContent;
  nodes.hint.textContent=view.state==='fail'?(checkpointable(view.run)?(UI105?'빈 곳을 탭하면 이 구간부터 다시':'탭하면 이 구간부터 다시'):(UI105?'빈 곳을 탭하면 다시 달리기':'탭하면 다시 달리기')):'';
  nodes.value.textContent=host.reduced?.()?fmt(view.score):'0';
  if(host.reduced?.())finishResult();
 }
 function finishResult(){
  const nodes=resultDom(),show=resultShow;if(!nodes||!show)return;
  nodes.value.textContent=fmt(show.view.score);
  show.view.stars.forEach((on,i)=>{nodes.stars[i].li.dataset.on=String(show.starsOn&&on)});
  nodes.fresh.hidden=!show.view.newRecord;nodes.box.dataset.fresh=String(show.view.newRecord);show.stamped=3;show.done=true;
 }
 function tickResult(now){
  const show=resultShow;if(!show||show.done)return;
  if(host.reduced?.()){finishResult();return}
  if(show.start===null){show.start=now;return}
  const t=Math.max(0,(now-show.start)/1000),nodes=resultDom(),p=Math.min(1,t/COUNT_UP),eased=1-Math.pow(1-p,3);
  const value=fmt(show.view.score*eased);if(nodes.value.textContent!==value)nodes.value.textContent=value;
  while(show.stamped<3&&t>=STAR_AT+show.stamped*STAR_GAP){
   const i=show.stamped++,on=show.starsOn&&show.view.stars[i];
   if(on){nodes.stars[i].li.dataset.on='true';nodes.stars[i].li.dataset.stamp='true';try{root.MongyuPolish?.host?.sound?.('pass')}catch(_){}}
  }
  if(show.stamped>=3&&t>=STAR_AT+3*STAR_GAP){
   if(show.view.newRecord&&nodes.fresh.hidden){nodes.fresh.hidden=false;nodes.box.dataset.fresh='true'}
   show.done=true;
  }
 }
 // Fail screen: a tap that is not on a button restarts at once (first memory: from the crashed section when the run supports it).
 function tapResult(event){
  const run=activeRun;
  if(!run||host.activeRun?.()!==run||run.state!=='fail'||$('squareResult').hidden)return false;
  if(event.target?.closest?.('button,a,input,select,textarea,label,summary'))return false;
  const t=root.performance?.now?.();if(Number.isFinite(t)&&resultShow?.start!=null&&t-resultShow.start<280)return false;
  if(checkpointable(run)){
   let ok=false;try{ok=run.retryFromCheckpoint()===true}catch(error){root.console?.error?.('[MongyuRestorationUI] retryFromCheckpoint',error)}
   if(ok){
    // Same run object resumes: let its next result complete again, as a fresh attempt.
    completedRuns.delete(run);if(Number.isInteger(run.attempt)&&run.attempt<=save.attempt)run.attempt=save.attempt+1;
    qualified=false;newBest=0;award='';resultView=null;resultShow=null;host.audioGesture?.(event);host.startRun(run,event);return true;
   }
  }
  return retry(event);
 }
 function practiceOpening(event){
  if(!activeRun?.openingCourse||activeRun.state!=='fail')return false;
  return launch(event,{...activeConfig,practice:true,section:activeRun.crash.section});
 }
 function openJournal(event){
  host.openDialog('storyJournal',event);journalButtons.length=0;const list=$('storyJournalList');list.replaceChildren();
  if(UI105){const note=$('storyJournal').querySelector?.('.story-journal-note');if(note)note.textContent='이야기와 대사는 몽유를 위해 새로 쓴 글이에요.';journal105(list);$('storyJournalClose').focus({preventScroll:true});return}
  for(const sequence of G.sequences){const slot=C.getSlot(sequence.slot),collected=save.collected.includes(slot.id),unlocked=collected||C.unlocked(save,slot.id);const b=host.document.createElement('button');b.id='story-page-'+slot.number;b.setAttribute('id',b.id);b.disabled=!unlocked;b.textContent=String(slot.number).padStart(3,'0')+' · '+(unlocked?slot.title:'아직 만나지 못한 이야기');b.onclick=e=>start(e,slot.id);list.appendChild(b);if(unlocked)journalButtons.push(b.id);}
  $('storyJournalClose').focus({preventScroll:true});
 }
 function syncTitle(title){$('restorationOpen').hidden=!title;if($('storyOpen'))$('storyOpen').hidden=!title;$('modeRestoration').hidden=false;$('modeSquare').hidden=false;if(title){text('titleContinue',summary().collected?'꿈 이어가기':'꿈속으로');text('restorationOpen',routeEdition?'꿈 지도':'꿈 지도  ·  '+summary().collected+' / 100')}}
 function retry(event){if(activeRun?.deathAnimation&&!activeRun.deathAnimation.completed)return false;
  if(!activeSlot)return continueJourney(event);
  revealPending();
  selected=activeSlot;settingValue=activeRun?.options.settingValue??activeConfig?.settingValue;settingTouched=!!activeConfig?.settingTouched;
  const config={...activeConfig,practice:false,section:0,quickRetry:openingEnabled,period:activeRun?.options.period||activeConfig?.period,characterId:activeRun?.options.characterId||activeConfig?.characterId,settingValue,settingTouched};
  if(config.freePlay){qualified=false;award='';return launch(event,config)}return start(event,activeSlot.id,{retry:true,config});
 }
 function startFree(event){if(!summary().finished)return false;selected=C.slots.find(slot=>slot.physical&&slot.rule.type==='tutorial')||C.slots.find(slot=>slot.physical);activeSlot=selected;award='';return launch(event,{...configFor(selected),freePlay:true,seed:Date.now()>>>0})}
 for(const slot of C.slots){const b=host.document.createElement('button');b.id='restoration-slot-'+slot.number;b.setAttribute('id',b.id);b.numberPlate=host.document.createElement('span');b.numberPlate.className='world-number';const kind=host.document.createElement('span');kind.className='world-kind';kind.textContent=ticketKind(slot);b.statePlate=host.document.createElement('span');b.statePlate.className='world-state';b.markPlate=host.document.createElement('span');b.markPlate.className='world-mark';b.markPlate.setAttribute('aria-hidden','true');b.skinPlate=host.document.createElement('canvas');b.skinPlate.width=b.skinPlate.height=32;b.skinPlate.className='map-skin-preview';b.skinPlate.setAttribute('aria-hidden','true');b.skinPlate.hidden=true;b.append(b.skinPlate,b.numberPlate,kind,b.statePlate,b.markPlate);b.onclick=()=>select(slot.id);$('restorationGrid').appendChild(b);buttons.push(b)}
 const routeMap=routeEdition?root.MongyuDreamRouteArt?.mount($('restorationGrid'),buttons,host.document):null;
 if(routeMap){
  $('restorationTitle').after($('restorationProgress'));
  if(UI105&&host.document.createElement){const help=host.document.createElement('p');help.id='r105MapHelp';help.className='r105-map-help';help.textContent='예전 꿈 100개를 다시 걸어요. 새 길은 홈의 달리기에서 이어져요.';$('restorationClose').after(help)}
  text('restorationClose','×');
  $('restorationClose').setAttribute('aria-label','꿈 지도 닫기');
  text('restorationRouteNext','다음 기억 위치');
 }
 $('restorationGrid').addEventListener('keydown',event=>{
  const n=Number(event.target?.id?.replace('restoration-slot-',''));if(!n)return;
  const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-5,ArrowDown:5,PageUp:-10,PageDown:10}[event.code];
  const target=event.code==='Home'?1:event.code==='End'?100:routeMap&&event.code.startsWith('Arrow')?routeMap.target(n,event.code):step?n+step:null;
  if(target!==null){event.preventDefault();if(target!==n)select(Math.max(1,Math.min(100,target)),true)}
 });
 $('restorationPagePrev').onclick=()=>select(Math.max(1,selected.number-10));$('restorationPageNext').onclick=()=>select(Math.min(100,selected.number+10));$('restorationRouteNext').onclick=()=>summary().nextSlot&&select(summary().nextSlot,true);
 $('restorationSetting').onclick=e=>chooseSetting(selected.rule.setting==='speed'?'fast':true,e);$('restorationSettingOff').onclick=e=>chooseSetting(selected.rule.setting==='speed'?'slow':false,e);
 if($('storyOpen'))$('storyOpen').onclick=openJournal;if($('storyJournalClose'))$('storyJournalClose').onclick=host.closeDialog;
 $('restorationOpen').onclick=open;$('restorationClose').onclick=host.closeDialog;$('restorationStart').onclick=e=>start(e);$('restorationSceneNext').onclick=nextScene;$('restorationSceneSkip').onclick=skipScene;
 if(polishEdition){
  const view=$('restorationScene');view.addEventListener('click',tapScene);
  view.addEventListener('pointerdown',holdStart);for(const type of ['pointerup','pointercancel','lostpointercapture'])view.addEventListener(type,holdEnd);
  view.addEventListener('contextmenu',event=>{if(scene&&!event.target?.closest?.('button,a,input,select,textarea'))event.preventDefault?.()});
  const badge=host.document.createElement?.('span');if(badge){badge.className='r104-ff';badge.setAttribute('aria-hidden','true');badge.textContent='빨리 넘기는 중';view.appendChild(badge)}
  $('squareResult').addEventListener('click',tapResult);
 }
 $('restorationSceneAction').onclick=()=>{if(scene&&!scene.graph&&scene.index>0){scene.index--;showScene()}};
 if($('squarePractice'))$('squarePractice').onclick=practiceOpening;
 if(stageHud)text('squarePractice','구간 연습');
 if(root.MONGYU_SPECTRAL_EDITION)text('pauseRestoration','꿈 지도');
 $('modeRestoration').onclick=open;$('modeSquare').onclick=host.startLegacy;$('pauseRestoration').onclick=open;$('squareCollection').onclick=open;$('squareNext').onclick=nextMemory;$('restorationFree').onclick=startFree;
 function beginCall(event){if(!callContext||callContext.triggered||callContext.run.state!=='play'||callContext.run.time<.2||!callContext.run.localCall())return false;callContext.triggered=true;scene={kind:'call',slot:activeSlot,index:0,pages:['길 한가운데서 전화가 울립니다.'],elapsed:0,rings:0,beats:0,beatAt:0};sceneLast=null;showScene(event);return true}
 $('restorationCall').onclick=beginCall;
 $('restorationAftermathNext').onclick=finishAftermath;
 function tick(now){
  if(aftermath){
   if(host.activeRun()!==aftermath.run)cancelAftermath();
   else if(aftermath.paused||host.document.hidden||host.dialog())aftermath.last=null;
   else if(aftermath.last===null)aftermath.last=now;
   else{const before=aftermath.elapsed,spec=aftermathSpec(aftermath.run);aftermath.elapsed+=Math.min(1,Math.max(0,(now-aftermath.last)/1000));aftermath.last=now;if(aftermath.elapsed>=spec.duration)finishAftermath();else if(before<spec.release&&aftermath.elapsed>=spec.release)host.refresh()}
  }
  if(callContext?.pending&&host.activeRun()===callContext.run&&!host.dialog()&&!host.document.hidden&&callContext.run.state==='play'&&callContext.run.time-callContext.beforeTime>=.2){
   const before=save.collected.length;persist(C.commitEvent(save,{slotId:activeSlot.id,type:'local-call',phase:'answered',rings:2,simulated:true,period:(callContext.run.sampleClock(),callContext.run.period),callContext:{interrupted:true,resumed:true,beforeTime:callContext.beforeTime,afterTime:callContext.run.time}}));
   callContext.pending=false;callContext.awarded=save.pendingUnlock?.slotId===activeSlot.id||save.collected.length>before||save.collected.includes(activeSlot.id);qualified=callContext.awarded;award=qualified?'전화를 받고 달리기로 돌아왔습니다.':'';
  }
  if(callContext&&!callContext.triggered&&callContext.run.state==='play'&&callContext.run.time>=3&&!host.dialog())beginCall();
  if(polishEdition)tickResult(now);
  if(!scene||host.dialog()!=='restorationScene'||host.document.hidden){sceneLast=null;if(hold)holdEnd();return}
  if(sceneLast===null){sceneLast=now;return}const dt=Math.min(.1,Math.max(0,(now-sceneLast)/1000));scene.elapsed+=dt;sceneLast=now;
  if(root.MongyuMobile&&!host.reduced?.()&&scene.elapsed-(scene.drawAt||0)>=.04){scene.drawAt=scene.elapsed;drawSceneCast()}
  if(scene.kind==='interlude'){if(!host.reduced?.()&&scene.vignette?.effect==='levitate'&&scene.elapsed-(scene.drawAt||0)>=.04){scene.drawAt=scene.elapsed;drawSceneCast()}}
  else if($('restorationSceneCast').height!==((host.viewport?.().height||800)<=480?200:320))drawSceneCast();
  if(scene.kind==='call'){const rings=Math.min(2,Math.floor(scene.elapsed/.9));if(rings!==scene.rings){scene.rings=rings;text('restorationSceneText',rings===2?'두 번의 벨. 받을까요?':'벨이 한 번 울렸습니다.');text('restorationScenePage',rings+' / 2');$('restorationSceneNext').disabled=rings<2}}
  if(polishEdition&&line){
   // Long press (>=350 ms) fast-forwards: typing x4 and, once a line is out, the next page follows by itself (never past the last page or a disabled button).
   if(hold&&hold.scene!==scene)holdEnd();
   const ff=!!hold&&scene.elapsed-hold.at>=HOLD_FF;if(hold&&ff!==hold.active){hold.active=ff;setFastForward(ff)}
   if(line.shown<line.count){line.typed+=dt*TYPE_RATE*(ff?FF_RATE:1);line.shown=host.reduced?.()?line.count:Math.min(line.count,Math.floor(line.typed)+1)}
   paintLine();
   if(line.shown>=line.count&&line.doneAt===null)line.doneAt=scene.elapsed;
   const next=$('restorationSceneNext');
   if(ff&&line.doneAt!==null&&scene.elapsed-line.doneAt>=FF_PAGE&&!next.hidden&&!next.disabled&&!['call','opening','intro'].includes(scene.kind)&&scene.index<scene.pages.length-1)nextScene();
  }
 }
 function setFastForward(on){const view=$('restorationScene');view.dataset.ff=String(on)}
 function holdStart(event){
  if(!scene||host.dialog()!=='restorationScene'||event.isPrimary===false||event.button>0||event.target?.closest?.('button,a,input,select,textarea,label,summary'))return false;
  hold={at:scene.elapsed,active:false,scene};return true;
 }
 function holdEnd(){if(!hold)return false;const was=hold.active;if(was){setFastForward(false);suppressTap={scene:hold.scene,at:hold.scene.elapsed}}hold=null;return was}
 if(UI105)wardrobe105();
 render();
 return {settingChanged:(run,receipt)=>{if(run!==activeRun||!receipt.accepted||receipt.name!==activeSlot?.rule.setting)return false;if(activeConfig){activeConfig.settingValue=receipt.value;activeConfig.settingTouched=true;}if(selected.id===activeSlot.id){settingValue=receipt.value;settingTouched=true;render()}return true},tick,open,start,retry,continueJourney,complete,onRunStatus,syncTitle,select,render,sceneNext:nextScene,aftermathFor,aftermathRenderFor,finishAftermath,cancelAftermath,suspendAftermath,
  view:()=>({aftermath:aftermathFor(host.activeRun()),save:C.normalizeSave(save),status:summary(),selected:selected.id,page:page(),qualified,activeSlot:activeSlot?.id,storageOK,readOnly,scene:scene?{index:scene.index,pages:scene.pages.length,kind:scene.kind,effect:scene.vignette?.effect,nativeState:scene.sequence?.nativeState,nativeRow:scene.sequence?.nativeRow,terminalCursor:scene.sequence?.terminalCursor,sourceStringIds:scene.graph?G.getStep(selected,scene.index)?.sourceStringIds:undefined,stepKind:scene.graph?G.getStep(selected,scene.index)?.kind:undefined,...(polishEdition&&line?{typing:lineTyping(),lineShown:Math.min(line.shown,line.count),lineLength:line.count}:{})}:null,...(polishEdition?{fastForward:!!hold?.active,result:resultView?{score:resultView.score,best:resultView.best,newRecord:resultView.newRecord,stars:[...resultView.stars],state:resultView.state,shown:resultNodes?.value?.textContent??null,stamped:resultShow?.stamped??0,done:!!resultShow?.done,hint:resultNodes&&!resultNodes.hint.hidden?resultNodes.hint.textContent:''}:null}:{}),free,settingTouched,settingValue,mastery:localRecord(free?'freeplay':selected.id),call:callContext?{triggered:callContext.triggered,pending:callContext.pending,awarded:callContext.awarded}:null}),
  dialogControls:{get storyJournal(){return ['storyJournalClose',...journalButtons]},get restorationCollection(){return ['restorationClose','restorationPagePrev','restorationPageNext','restorationRouteNext',buttons[selected.number-1].id,...($('restorationClock').hidden?[]:['restorationPeriod']),'restorationSetting','restorationSettingOff','restorationStart','restorationFree']},restorationScene:['restorationSceneAction','restorationSceneNext','restorationSceneSkip']}};
}
root.MongyuRestorationUI={mount,VIGNETTES,INTRO,sceneStage,v105,COPY105,pauseLine105,journalState105,wardrobeState105};if(typeof module!=='undefined')module.exports=root.MongyuRestorationUI;
})(globalThis);
