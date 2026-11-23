# 몽유 R104 · 기획서 대조표

기획서(`docs/MONGYU_NOM3_MV_PLAN_KO.html`) 항목별 구현 상태. R104 빌드(`python web/build.py --release R104`)에서만 켜진다.

## 연출 기획

| 기획 항목 | 상태 | 구현 위치 |
| --- | --- | --- |
| 하단 게이지 + 그 위 말풍선, 상단 큰 점수 | 완료 | `play-hud.js`, `r104-hud.css` |
| 캐릭터 화면 높이 8~10% | 완료 (약 9%) | `opening-run.js` layout |
| 튜토리얼: 느린 찬스, 탭 빛 고리, 벽 안내, 실패 원인 안내 | 완료 | `opening-run.js`, `play-juice.js` |
| 튜토리얼: 새 규칙(점수 목표·목숨·벽) 등장 때마다 안내 | 완료 | `play-hud.js` |
| 이야기: 아무 곳 탭, 타자기, ▼, 길게 눌러 빨리감기 | 완료 | `restoration-ui.js` |
| 기억 사이 짧은 장면 | 완료 | `restoration-story-graph.js` |
| 충돌: 플래시·히트스톱·흔들림·파편·채도·3겹 효과음·진동 | 완료 | `play-juice.js`, `game-sfx.js` |
| 충돌: 캐릭터 색 번쩍임·뒤로 튕겨 구르기 | 완료 | `opening-run.js`, `character-art.js` |
| 충돌: BGM 필터 닫힘 후 복귀 | 완료 | `adaptive-music.js` |
| 실패 후 탭하면 체크포인트(구간)부터 즉시 재시작 | 완료 | `opening-run.js` `retryFromCheckpoint`, `restoration-ui.js` |
| 목숨: 하트 깨짐 + 무적 표시 | 완료 | `play-hud.js` |
| 골인: 오로라 문, 마지막 20% 가장자리 빛, 슬로모션 | 완료 | `opening-run.js`, `play-juice.js` |
| 골인: 건축 전체 불 켜짐, BGM 해결 화음 | 완료 | `opening-run.js`, `adaptive-music.js` |
| 점수 튐, "+50 완벽", 콤보 게이지 색 | 완료 | `play-hud.js`, `play-juice.js` |
| 결과: 점수 카운트업, 별 3개, 새 기록 조건, → 아이콘 | 완료 | `restoration-ui.js` |
| 카메라: 면 전환 회전 + 줌아웃, 결과 포스터 컷 | 완료 | `opening-run.js` |

## 아트·사운드·메커닉

| 기획 항목 | 상태 | 구현 위치 |
| --- | --- | --- |
| 주인공 리디자인(8프레임 달리기, 점프·착지·벽·넘어짐·기쁨, 망토 흔들림, 옷장 연동) | 완료 | `character-art.js`, `mobile-presentation.js` |
| 1번째 기억: 입체 블록 길, 장애물 3종, 배경 3층 | 완료 | `opening-run.js` |
| 2번째 이후: 체크무늬 제거, 챕터 10개 팔레트, 입체 블록 벽, 수정·문양 판·조각, 안개 층 | 완료 | `square-art.js`, `native-*.js`, `scene-stagecraft.js` |
| 의미 색 고정(금빛·산호·오로라) | 완료 | 각 아트 모듈 |
| 4층 적응형 음악(챕터별 음조·템포, 국악기 음색) | 완료 (합성 임시 스템) | `adaptive-music.js` |
| 효과음 음조 통일, 연속 점프 음 상승 | 완료 | `game-sfx.js` |
| 착시 점프 코스 | 완료 (착시 정원) | `illusion-course.js` |
| 무한 꿈 모드, 일일 도전, 주간 최고 | 완료 | `endless-dream.js` |
| 포스터·짧은 영상 저장/공유 | 완료 | `share-capture.js` |
| 접근성: 색약 모드, 움직임 줄임 | 완료 | `play-modes.js` |
| 챕터별 새 메커닉 5종(달빛 수로·사각 정원·거꾸로 성·심장 시계탑) | 일부 — 착시 점프만 별도 코스로 구현, 기존 챕터 레벨 구조는 유지 | — |

## 외부 체크리스트 (코드 밖)

- [ ] 전용 작곡 의뢰로 합성 스템 교체
- [ ] 비공개 베타 D1·D7 측정
- [ ] 스토어 아이콘·스크린샷·트레일러
- [ ] App Store·Google Play 피처드 제안, 소프트 런칭
- [ ] Android R104 APK (VIBRATE 권한 추가 후 서명 빌드)
