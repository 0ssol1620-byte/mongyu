# 몽유 R105 기획: 중독성·착시·카메라·콘텐츠

<p class="byline">2026-11-24 · 딥리서치 + 상세 연출 기획 · 이전 기획서: <a href="MONGYU_NOM3_MV_PLAN_KO.html">놈3 × Monument Valley</a></p>

## 한 장 요약

**콘텐츠는 충분하지 않습니다.** R104까지 만든 것은 "맛보기 + 연출"이고, 앱스토어 상위권이 요구하는 "몇 시간 계속 하게 만드는 볼륨"은 아직 없습니다. 코드로 확인한 사실은 이렇습니다.

- 1번째 기억(가장 공들인 코스)은 **약 9.7초**입니다(코스 길이 1180 ÷ 속도 122). 기획서에 쓴 "한 판 40~70초"의 6분의 1입니다.
- 100개 슬롯 중 이야기 16 · 캐릭터 4 · 엔딩 1은 읽는 슬롯이고, 69개는 "300점 모으기", "벽이 4번 바뀔 때까지 버티기" 같은 **같은 사각 방 달리기의 조건만 바꾼 것**입니다. 달리기 방식은 사각 방 66개와 보스 10개(던지기 4 · 피하기 3 · 차기 3) 두 종류뿐입니다.
- **착시는 "착시 정원" 코스 1개(약 58초)뿐입니다.** 1번째 기억과 챕터 2~10에는 건축이 돌아 길이 이어지는 연출이 없습니다. 이전 기획서의 챕터 2 "달빛 수로" 착시 점프도 아직 코스로 만들지 않았습니다.
- **나선형 달리기는 없습니다.** 길은 바닥 → 벽 → 천장으로 꺾이는 한 평면의 사각 방이고, 위아래로 감아 오르내리는 길이 없습니다.
- **카메라는 거의 고정입니다.** 면이 바뀔 때 0.35초 회전하고 줌아웃하는 것, 골인 후 포스터 컷이 전부입니다. 속도에 따른 시야 변화, 룩어헤드, 나선 추적 같은 카메라 설계는 없습니다.

**방향은 "10초짜리 맛보기를 60초짜리 경험 5종으로"입니다.** 나선 상승 · 나선 하강 · 착시 점프 · 고요 구간 · 면 갈아타기를 한 판 안에 박자 격자 위에 배치하고, 이 한 판을 챕터 1에서 완성도 최고로 만든 뒤(수직 슬라이스) 나머지 챕터로 복제합니다.

**"앱 1등"의 현실적인 의미를 바꿔야 합니다.** 종합 다운로드 차트는 대규모 마케팅과 라이브옵스 영역이고(2025년 1위 Block Blast 3억 5,620만 다운로드), 몽유 규모에서 노릴 수 있는 것은 **App Store·Google Play 추천 선정 + 디자인 어워드 + 카테고리 상위**입니다. 편집 추천 하나로 다운로드의 70%가 나온 게임도 있습니다. 그 대신 지금 구조로는 닿을 수 없는 조건이 두 가지 있습니다(아래 "출시 전 반드시 풀어야 할 것").

**이전 기획서의 수치 하나를 정정합니다.** 로드맵 관문 C에 쓴 "D1 40%, D7 15%"는 상위 25% 문턱(D1 약 25~33%, D7 약 7~8%)보다 훨씬 높아서 근거 없는 목표였습니다. 아래 "성공 지표"에서 조사 결과에 맞춰 다시 정했습니다.

## 조사 결과와 신뢰도

출처가 있는 내용과 필자 판단·업계 관행을 구분해서 적습니다. **중독성을 수치로 보장하는 자료는 찾지 못했습니다.** 아래 "한 판 더" 설계는 근거가 약한 가설이라 반드시 베타에서 측정해야 합니다.

| 주제 | 확인된 내용 | 출처 | 신뢰도 |
| --- | --- | --- | --- |
| 추천 게임의 공통점 | 2025년 Apple·Google 추천 상위 200개의 평균 평점 4.34(전체 시장 3.48), App Store 추천작 4.43. 장르는 퍼즐 32.7%, 액션 20%, 아케이드 20% | [AppFollow](https://appfollow.io/blog/gaming-featured-games-benchmarks-2026) | 수치는 확인, 인과 해석은 필자 의견 |
| Apple 편집자 기준 | 게임플레이 설계, 아트와 애니메이션, 사운드, 조작과 성능, 현지화와 접근성, 리플레이성, 전반적 가치. 이벤트 홍보를 많이 하고, Game Center API를 쓰면 편집 노출 가능성이 커짐 | [MobileGamer.biz](https://mobilegamer.biz/apples-app-store-team-reveal-their-tips-and-tricks-for-getting-featured/), [Kickstart](https://www.kickstart.tools/blog/how-to-get-featured-on-the-app-store-nominations-timing-and-what-editors-want) | 편집자 발언 + 제3자 정리 |
| 추천 효과의 크기 | Pools는 다운로드의 70%가 편집 추천에서 발생. 한편 디자이너 Michael Flarup은 요즘 최고의 추천 효과를 "수십만~수백만이 아니라 수만 다운로드"로 평가 | 위 두 출처 | 사례 1건, 의견 1건 |
| 제출 시점 | 출시·업데이트 최소 3주 전(권장 약 6주). 문화 이벤트 기반 추천은 10주 이상 전. 유형은 App Launch · App Enhancements · New Content. 30초 영상과 TestFlight 링크, 개발자 스토리가 효과적 | 위 두 출처 | 높음 |
| 리텐션 기준값 | 전 장르 중앙값 D1 22%, D7 3.4~3.9%. 상위 25%는 D1 Android 25~27% · iOS 31~33%, D7 7~8%. 캐주얼/퍼즐 Android는 D1 28~32%, D7 9~12%, D30 3.5~5%(단, 2022년 3분기 자료) | [Game Growth Advisor](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-retention-strategies-2026/), [Interactive Catalyst](https://interactive-catalyst.com/blog/mobile-game-retention-benchmarks) | 전 장르 수치는 신뢰, **러너·장르별 최신 수치는 공개 자료 없음** |
| 첫 세션과 보상 | 60초 안에 플레이 가능 상태, 튜토리얼은 맥락 힌트, 일일 로그인 보너스는 효과 작음, 7일차 보상을 1~6일차 합보다 크게. 푸시는 주당 소수, 보상형 영상이 리텐션을 가장 덜 해침 | 같은 글 | **필자 경험칙, 수치 근거 없음** |
| 측정 표본 | D1 약 30%를 ±3%p 안에서 읽으려면 896 설치, 약 1,000 설치 권장. 120명 코호트는 D1 24%와 34%를 구분 못 함 | 같은 글 | 통계 계산, 높음 |
| Monument Valley | "모든 화면이 벽에 걸 수 있는 작품", 화면 안에 통째로 들어오는 "작은 세계(little worlds)", 건물 조각을 밀고 당기는 레고 같은 촉감, "새로 할 말이 있을 때만 레벨을 추가" | [Game Developer 인터뷰](https://gamedeveloper.com/design/designing-the-surprise-mobile-game-hit-i-monument-valley-i-) | 높음 |
| MV 사운드 | 장치를 돌리는 소리를 장면 음악과 같은 조성에 맞춰 튜닝, 챕터마다 독립된 "사운드 월드", 건축물이 악기가 됨 | [Xbox Wire](https://news.xbox.com/en-us/2025/07/18/how-monument-valley-3-uses-soundscapes-to-tell-its-story/) | 높음 |
| MV3 | 항해 가능한 보트로 선형 경로를 벗어남, 곡선과 식물로 "더 부드러운" 건축, 오리가미 레벨(평면 도면이 2D와 3D를 오감) | [It's Nice That](https://www.itsnicethat.com/features/ustwo-games-monument-valley-3-illustration-digital-spotlight-111224), [Unity](https://unity.com/resources/monument-valley-3-blurring-art-and-design) | 높음 |
| Alto's Odyssey | 절차적 생성과 손으로 만든 시퀀스를 섞어 매 판 기억에 남는 순간을 줌. 환경이 주인공. 이전 작보다 "훨씬 밝고 자신 있는 색". 나비, 서서히 바뀌는 달의 주기로 살아 있는 세계 | [Game Developer](https://www.gamedeveloper.com/business/road-to-the-igf-team-alto-s-i-alto-s-odyssey-i-) | 높음 |
| Sky | 터치 UI가 그래픽을 가리지 않게, "최고의 디자인은 목줄이 아니라 살짝 미는 것", 캐주얼 플레이어는 화면에 두 손을 올리지 않음, "ethereal scenes" 위해 자체 Metal 엔진 | [Apple Developer](https://developer.apple.com/news/?id=zm47it7t) | 높음 |
| 착시·원근 게임 | Fez는 90° 회전, 퍼즐 대부분이 회전 1~2번 거리, 튜토리얼 부족이 약점. Echochrome은 카메라 각도를 바꿔 새 길을 만듦. Manifold Garden은 첫 퍼즐은 해법 하나뿐이고 개념을 정해진 순서로 소개, 방향 단서로 창문의 빛을 일관되게 사용, 플레이테스트에서 "계속 길을 잃는다"가 최대 불만 | [Fez](https://gamedeveloper.com/design/the-dimensions-of-fez), [Manifold Garden](https://gamedeveloper.com/design/designing-i-manifold-garden-i-s-believably-unbelievable-world-and-puzzles) | 높음 (Fez는 2012년 서평) |
| 게임 필(juice) | 이징으로 무게감, 충돌 순간 잠깐 멈춤, 파티클, 은은한 환경음. 트레일은 타격감을 해칠 수 있고 "과하면 시간 낭비이고 사용자를 짜증나게 한다". Vlambeer는 총 쏘는 반대 방향 화면 흔들림. 카메라 킥 6픽셀 같은 수치는 2차 정리 | [Game Developer](https://gamedeveloper.com/design/squeezing-more-juice-out-of-your-game-design-), [Vlambeer](https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games) | 방향은 확인, **수치는 근거 약함** |
| 러너 카메라 | Temple Run과 Sonic Dash는 3D 어깨너머 시점, Subway Surfers는 3레인 스와이프. 카메라와 레인 모델이 제작비를 가르는 핵심 | [Medium 정리](https://medium.com/game-design-fundamentals/temple-run-minion-rush-and-the-genre-of-endless-runners-46de1c6623e8) 등 | 2차 정리 |

**찾지 못한 것(추정으로 채우지 않았습니다):** 러너 장르의 최신 D1/D7 수치, 세션 길이와 일일 세션 수, Subway Surfers의 난이도·미션 설계, 속도에 따른 시야(FOV) 변화나 속도선의 구체적 수치, 카메라 흔들림·롤이 유발하는 멀미에 대한 근거. 아래 카메라 파라미터는 모두 **출발점으로 둔 제안값이며 실제 기기에서 튜닝해야 합니다.**

## 출시 전 반드시 풀어야 할 것

조사하다가 "1등"의 전제를 흔드는 구조적 문제를 두 가지 발견했습니다.

1. **iOS 앱이 없습니다.** 지금 iPhone 사용자는 Safari에서 "홈 화면에 추가"로만 플레이합니다. App Store 추천과 순위는 실제 iOS 앱이 있어야 합니다. Capacitor 같은 WKWebView 래핑으로 만들 수 있지만, 웹사이트를 그대로 감싼 앱은 Apple 심사 가이드라인 4.2(최소 기능)에 걸릴 위험이 있고(일반 지식, 본 조사에서 원문 확인은 못 함), 편집자가 보는 Game Center API · 햅틱 · 접근성 같은 네이티브 기능을 붙여야 안전합니다. 햅틱은 지금 iOS Safari에서 아예 동작하지 않는 항목이기도 합니다.
2. **리텐션을 측정할 수 없습니다.** 현재 빌드는 보안 설정(CSP `connect-src 'none'`)으로 네트워크 요청이 전부 막혀 있어 자체 분석을 넣을 수 없습니다. 베타는 TestFlight와 Play Console 기본 분석으로 D1·D7을 읽거나, 분석 연결을 허용하는 별도 결정이 필요합니다.

## 콘텐츠 볼륨 설계

| 항목 | 현재 | R105 목표 |
| --- | --- | --- |
| 한 판 길이 | 약 9.7초(1번째 기억), 약 58초(착시 정원) | 45~75초 |
| 달리기 방식 | 사각 방 달리기, 보스 3종 | 코스 타입 8종(다음 섹션) |
| 직접 설계한 코스 | 1개 | 챕터 5개 × 코스 4 + 보스 1 = 25개 (챕터 1을 먼저 수직 슬라이스로 완성) |
| 반복 플레이 | 무한 꿈, 오늘의 도전(R104 구현) | + 고스트, 주간 기록, 챕터별 별 3개 도전 |
| 총 신규 플레이 시간 | 약 몇 분 | 이야기 약 25~30분 + 무한·일일 |
| 기존 100개 슬롯 | 진행 필수 | 조건형 69개는 "도전 과제"로 돌려 진행 필수에서 빼고, 새 코스가 진행 본선이 됨 |

**수직 슬라이스 원칙:** 챕터 1만 먼저 코스 5개를 완성도 최고로 만들고, 그것으로 스토어 제출 영상과 베타 측정을 합니다. 이 한 챕터가 좋으면 나머지는 같은 도구로 복제하고, 나쁘면 챕터를 늘리기 전에 고칩니다. Monument Valley도 "새로 할 말이 있을 때만 레벨을 추가"했고, Alto는 적은 수의 에셋과 규칙을 다듬어 큰 경험을 만들었습니다.

**수작업 + 절차 혼합:** 스토리 코스는 손으로 박자에 맞춰 배치하고, 무한 꿈은 절차 생성으로 하되 수작업 "명장면" 시퀀스를 섞어 매 판 기억에 남는 순간을 줍니다(Alto 방식).

## 코스 타입 8종

한 손 탭 조작은 그대로 유지합니다. 코스 타입이 바뀌어도 "탭 = 점프"이고, 착시 점프에서만 같은 탭이 "금빛 표식 근처에서는 정렬"이 됩니다.

| 타입 | 한 줄 설명 | 카메라 | 근거와 위험 |
| --- | --- | --- | --- |
| 1. 면 갈아타기(현재) | 바닥 → 벽 → 천장 | 90° 롤, 줌아웃 0.92 | 놈의 핵심. 구현됨 |
| 2. 나선 상승 | 탑 외벽을 감아 오르는 경사 길. 오를수록 하늘이 새벽에서 여명으로 | 탑 중심 오빗, 캐릭터 각도 추종, 틸트 약 -14°, 골인 직전 3초 동안 위로 올려다봄 | 새 렌더러 필요(아래). 높이감이 핵심 |
| 3. 나선 하강 | 위에서 아래로 소용돌이 질주, 점점 빨라짐 | 룩어헤드 0.35 → 0.6초, FOV 확대, 속도선, 안개 짙어짐 | "내려갈수록 빨라지는 쾌감". 멀미 위험 → 옵션 필수 |
| 4. 펜로즈 계단 | 한 바퀴 돌면 제자리인데 계속 오르는 계단 | 아이소메트릭 고정, 표식 접근 시 시점 정렬 | Monument Valley · Echochrome 방식. R104 착시 정원 확장 |
| 5. 뫼비우스 띠 | 길이 한 면으로 이어져 바닥이 천장이 되는 구간 | 롤 최대 180°(속도 제한) | 놈의 천장 달리기와 자연스럽게 연결 |
| 6. 튜브 | 원통 내부를 360° 달림 | 캐릭터 위쪽 방향을 따라 롤 | 멀미 가장 큼 → 롤 상한과 끄기 옵션 |
| 7. 접힘 건축 | 평면 도면이 접히며 길이 열림 | 2D ↔ 3D 전환 줌 | MV3 오리가미 레벨 참고. 연출 부담 큼 |
| 8. 원근 다리 | 달리다 "고요 구간"에서 시점을 맞추면 끊긴 다리가 이어짐 | 정렬 각도 5° 이내 스냅 | Echochrome · Fez 방식. 교육 순서가 중요 |

**배치 원칙 (Manifold Garden·Fez 교훈):** 새 타입은 처음엔 해법이 하나뿐인 쉬운 형태로 소개하고, 개념을 정해진 순서로 가르치며, 길을 잃게 만들지 않습니다. 착시 점프는 Fez처럼 "정렬 1~2번"이면 풀리게 하고, 방향 단서(금빛 표식, 빛이 새는 쪽)를 모든 코스에서 같은 규칙으로 씁니다.

**나선 구현 방식:** 지금 Canvas 2D로 충분히 가능합니다. 길을 나선 곡선 위의 사각 띠 조각으로 쪼개 3D 좌표(반지름 R, 한 바퀴 높이 pitch)를 원근 투영하고, 깊이 순서로 그립니다(한 번에 보이는 조각 약 200개). 캐릭터와 장애물은 빌보드(항상 정면)로 그립니다. 60fps가 안 나오면 배경·오로라·파티클만 WebGL 레이어로 옮기는 안을 먼저 검증합니다(이전 기획서의 기술 방향과 동일).

## 카메라 시스템 사양

카메라를 코스 위에 "상태 머신"으로 올립니다. 아래 값은 모두 **출발점이고 실기기 튜닝 전제입니다.**

| 상태 | 동작 | 제안값 |
| --- | --- | --- |
| 평지 달리기 | 속도 방향 룩어헤드, 수직 데드존 | 룩어헤드 0.35초, 수직 데드존 ±6% |
| 면 전환 | 롤 + 줌아웃 (구현됨) | 0.35초 ease-in-out, 줌 0.92 |
| 나선 상승 | 탑 중심 오빗, 높이 스프링 추적 | 틸트 -14°, 높이 스프링 감쇠 0.8, 줌 1.0 → 0.9 |
| 나선 하강 | 속도 비례 FOV와 룩어헤드 증가 | FOV +0~12%, 줌 0.98 → 1.06, 룩어헤드 0.35 → 0.6초, 마지막에 감속 |
| 착시 정렬 | 표식 접근 시 시점 고정 후 스냅 | 접근 0.5초, 정렬 오차 5° 이내 스냅, 탭 순간 0.12초 정지, 줌 0.97 |
| 충돌 | 킥 + 흔들림 + 히트스톱 (구현됨) | 킥 6px, 흔들림 6px 감쇠, 정지 0.12초 |
| 고요 구간 | 약한 드리프트로 숨 돌리기 | ±2° sway, 점수 반응 없음 |
| 골인 | 슬로모션 → 돌리아웃 → 포스터 컷 (구현됨) | 0.4초 슬로, 포스터 홀드 |

**접근성 단계:** "움직임 줄임"을 켜면 롤을 최대 15°로 제한하고 흔들림·줌 펄스·FOV 변화를 끕니다. 튜브와 나선 하강에는 별도 "카메라 롤 끄기"를 둡니다. 멀미 근거 자료는 못 찾았으므로 제안한 상한은 베타에서 확인해야 합니다.

## 시각적 자극과 착시 연출

"자극적"은 번쩍임이 아니라 **색과 빛의 변화량**으로 만듭니다. 번쩍임은 접근성 문제(초당 3회를 넘는 번쩍임 금지, WCAG 2.3.1 일반 플래시 기준 — 본 조사에서 원문은 확인하지 못함)와 "과하면 사용자를 짜증나게 한다"는 juice 경고에 걸립니다.

1. **팔레트 전환:** 구간이 바뀔 때 0.8초에 걸쳐 새벽 → 황금 → 분홍 → 밤으로 교차 페이드. 콤보가 오를수록 채도 +10%(Alto의 "밝고 자신 있는 색").
2. **오로라 상시화:** 지금은 골인에서만 켜지는 오로라를, 콤보 ×3 이상일 때 화면 상단에 계속 켜 둡니다. "잘하고 있다"가 눈에 보입니다.
3. **속도감:** 원경 패럴랙스 속도 비율을 속도에 맞춰 키우고, 하강 구간에 속도선 파티클, 블러 대신 색 번짐을 씁니다.
4. **박자 맥동:** 달과 원경 원이 곡의 BPM에 맞춰 ±2% 맥동해 화면과 음악이 하나로 느껴지게 합니다.
5. **착시 순간:** 하얀 섬광 대신 끊긴 길의 선이 "맞물리는" 애니메이션 + 조성에 맞춘 "딸깍" 소리. Monument Valley가 장치 소리를 장면 음악의 조성에 맞춘 방식 그대로입니다.
6. **고요 구간:** 긴장만 이어지면 지칩니다. 장애물이 없고 빛 조각만 줍는 6~10초 구간을 한 판에 한 번 넣고, 이때 멜로디 층이 들어옵니다(Alto의 젠 감각, 긴장 해소).

## 한 판 60초 스토리보드: 챕터 1 "새벽 계단의 탑"

<!--COURSE-->

| 시간 | 구간 | 장애물 | 연출 |
| --- | --- | --- | --- |
| 0~3초 | 도입 | — | 떠 있는 탑 전체 등각 샷에서 캐릭터로 컷, 바탕 음악층 |
| 3~12초 | 바닥 | 3개(첫 번째는 느린 찬스) | 탭 가르침, 첫 점프 성공에 리듬층 |
| 12~22초 | 면 갈아타기 | 4개 | 벽 안내 말풍선, 90° 롤 |
| 22~36초 | 나선 상승 | 5개, 박자 격자 위 | 오빗 카메라, 하늘 새벽 → 여명, 빛 조각 3개에 멜로디층 |
| 36~42초 | 고요 | 없음 | 안개 속 긴 계단, 빛 조각 줄, 카메라 드리프트 |
| 42~50초 | 착시 점프 | 표식 1회 + 장애물 2개 | 끊긴 다리 → 정렬 스냅 → 이어짐 |
| 50~58초 | 나선 하강 | 4개 | 가속, FOV 확대, 속도선, 절정층(합창·현) |
| 58~63초 | 골인 | — | 슬로모션, 오로라 확산, 건축에 불 켜짐, 포스터 컷 |

## "한 판 더" 설계

아래는 **근거 강도를 구분해서** 적습니다. "확인"은 출처가 있는 것, "관행"은 업계에서 흔히 쓰지만 수치 근거를 못 찾은 것, "가설"은 몽유에서 실험해 볼 것입니다.

| 장치 | 내용 | 근거 |
| --- | --- | --- |
| 즉시 재시작 | 실패 후 0.5초 안에 구간 처음부터 (R104 구현) | 관행 |
| 목표 가시화 | 시작 전과 플레이 중 게이지에 "다음 별까지 빛 2개" 표시 | 가설 |
| 아슬아슬 보너스 | 장애물과 아주 가까이 통과하면 "+30 아슬" + 짧은 효과음, 위험 대 보상 | 가설 |
| 고스트 | 내 최고 기록의 반투명 캐릭터가 함께 달림. 코스가 결정적이라(거리 = 시간 × 속도) 입력 기록 재생으로 구현 가능 | 관행 |
| 박자 콤보 | 박자 격자 위 완벽 탭이 곧 음악의 멜로디가 됨. 소리가 피드백 | 간접 확인(MV 사운드) |
| 오늘의 꿈 + 연속 일수 | R104 구현. 7일차 보상을 크게. 연속이 끊겨도 벌칙은 두지 않음(평온한 게임 정체성) | 7일차는 필자 경험칙, 벌칙 없음은 설계 선택 |
| 메타: 꿈의 섬 | 클리어한 기억의 건축이 "작은 세계"로 떠 있는 갤러리, 포스터 컷이 쌓임 | 간접 확인(MV little worlds) |
| 알림 | 주당 소수, 첫 성공 이후에 권한 요청 | 필자 의견 |
| 수익화 | 첫 48시간 공격적 수익화 금지, 진행을 파는 결제 없음, 보상형 영상이 리텐션을 가장 덜 해침 | 필자 의견 |

## 구현 작업 단위 (R105)

| 작업 | 내용 | 선행 |
| --- | --- | --- |
| W1 코스 엔진 | 코스를 데이터로 정의(구간 배열 + 박자 격자 + 장애물). 박자 격자 디버그 오버레이 | — |
| W2 나선 렌더러 | 상승·하강 2.5D 투영, 성능 검증(없으면 WebGL 레이어 PoC) | W1 |
| W3 카메라 시스템 | 상태 머신 + 파라미터 + 접근성 단계 | W1 |
| W4 착시 코스 확장 | 펜로즈 · 뫼비우스 · 원근 다리 | W1, W3 |
| W5 챕터 1 수직 슬라이스 | 위 스토리보드 코스 5개 + 보스 | W2, W3, W4 |
| W6 한 판 더 | 고스트, 아슬아슬, 목표 가시화, 7일 보상 | W5 |
| W7 메타 | 꿈의 섬 갤러리 | W5 |
| W8 사운드 | 코스 박자 격자와 BPM 동기, 조성에 맞춘 착시 효과음 | W1 |
| W9 출시 준비 | iOS 래핑 + Game Center + 햅틱, 스토어 제출 자료, 베타 | W5 |

W2·W3·W8은 W1 이후 병렬로 진행할 수 있고, W4·W6·W7은 W5가 끝난 뒤 병렬입니다.

## 성공 지표 (정정)

조사한 기준값에 맞춰 다시 정했습니다. 목표는 "상위 25% 문턱 근처"이고, 이것도 장르별 최신 수치가 없어 베타에서 확인해야 합니다.

| 지표 | 목표 | 기준 |
| --- | --- | --- |
| 안내 없는 첫 클리어 | 처음 하는 사람 5명 중 5명이 60초 안에 첫 장애물 통과 | 첫 세션 60초 원칙(관행) |
| D1 | 30% 이상 | 상위 25% 문턱 iOS 31~33%, Android 25~27% |
| D7 | 8% 이상 | 상위 25% 7~8%, 캐주얼/퍼즐 상위 9~12%(2022 자료) |
| D30 | 3.5% 이상 | 캐주얼/퍼즐 Android 3.5~5%(2022 자료) |
| 한 판 길이 | 45~75초 | 이 기획 |
| 스토어 평점 | 4.4 이상 | 추천작 평균 4.34, App Store 4.43 |
| 측정 표본 | 약 1,000 설치 | D1 ±3%p를 읽는 데 896 설치 |

이전 기획서의 "D1 40%, D7 15%"는 폐기합니다.

## 출시·추천 체크리스트 (코드 밖)

- [ ] iOS 앱 래핑과 Apple 심사 대응(4.2 위험 검토), Game Center API, 햅틱 플러그인
- [ ] 접근성: 색약 모드(구현됨), 움직임 줄임, 카메라 롤 끄기, VoiceOver
- [ ] 현지화: 최소 한국어 · 영어 · 일본어
- [ ] 추천 제안서: 출시 6주 전(최소 3주), 30초 영상, TestFlight 링크, 개발자 스토리, 접근성 작업 기재
- [ ] 전용 작곡 의뢰로 합성 음악 교체
- [ ] 비즈니스 모델 확정(사전 주문과 프리미엄은 모델 고정이 필요)
- [ ] 스토어 이미지·트레일러 촬영(게임 내 포스터 컷 활용)

## 사용자 확인이 필요한 결정

1. **iOS 앱 래핑 진행 여부.** 하지 않으면 App Store 추천과 순위는 노릴 수 없고, 웹 링크와 Android 중심이 됩니다.
2. **수익화 방향.** 무료 챕터 + 해금, 완전 프리미엄, 광고 중 무엇인지(프리미엄은 Monument Valley 방식이지만 무료 복사본 문제도 있었음).
3. **WebGL 전환 PoC 허용 여부.** 나선과 오로라의 성능에 영향을 줍니다.
4. **분석 허용 여부.** 자체 분석을 넣으려면 지금의 네트워크 차단 보안 설정을 바꿔야 합니다.
5. **작곡가 의뢰 예산과 출시 목표일.**

## 출처

- [AppFollow: Featured Mobile Games 2026](https://appfollow.io/blog/gaming-featured-games-benchmarks-2026)
- [MobileGamer.biz: Apple App Store team tips for getting featured](https://mobilegamer.biz/apples-app-store-team-reveal-their-tips-and-tricks-for-getting-featured/)
- [Kickstart: How to get featured on the App Store](https://www.kickstart.tools/blog/how-to-get-featured-on-the-app-store-nominations-timing-and-what-editors-want)
- [Game Growth Advisor: Mobile Game Retention Benchmarks 2026](https://gamegrowthadvisor.com/blog/2026-03-17-mobile-game-retention-strategies-2026/)
- [Interactive Catalyst: Mobile Game Retention Benchmarks](https://interactive-catalyst.com/blog/mobile-game-retention-benchmarks)
- [Game Developer: Designing the surprise mobile game hit Monument Valley](https://gamedeveloper.com/design/designing-the-surprise-mobile-game-hit-i-monument-valley-i-)
- [Xbox Wire: How Monument Valley 3 uses soundscapes](https://news.xbox.com/en-us/2025/07/18/how-monument-valley-3-uses-soundscapes-to-tell-its-story/)
- [It's Nice That: Monument Valley 3 illustration](https://www.itsnicethat.com/features/ustwo-games-monument-valley-3-illustration-digital-spotlight-111224)
- [Unity: Monument Valley 3, blurring art and design](https://unity.com/resources/monument-valley-3-blurring-art-and-design)
- [Game Developer: Road to the IGF, Alto's Odyssey](https://www.gamedeveloper.com/business/road-to-the-igf-team-alto-s-i-alto-s-odyssey-i-)
- [Apple Developer: Behind the Design, Sky](https://developer.apple.com/news/?id=zm47it7t)
- [Game Developer: The dimensions of Fez](https://gamedeveloper.com/design/the-dimensions-of-fez)
- [Game Developer: Designing Manifold Garden](https://gamedeveloper.com/design/designing-i-manifold-garden-i-s-believably-unbelievable-world-and-puzzles)
- [Game Developer: Squeezing more juice out of your game design](https://gamedeveloper.com/design/squeezing-more-juice-out-of-your-game-design-)
- [Game Developer: Vlambeer co-founder advice](https://gamedeveloper.com/design/vlambeer-co-founder-shares-advice-on-building-better-action-games)
- [PocketGamer.biz: Most downloaded mobile games of 2025](https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025)
- 몽유 저장소 R104 코드에서 직접 측정한 값(코스 길이, 슬롯 구성) — 2026-11-24
