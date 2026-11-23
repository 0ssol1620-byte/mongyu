# 몽유 R104 · 기획서 전체 완성 명세 (1단계 잔여 + 2~4단계)

기획서(`docs/MONGYU_NOM3_MV_PLAN_KO.html`)에서 코드로 구현 가능한 모든 항목을 R104 빌드(`MONGYU_POLISH_EDITION===true`)에 넣는다. 1단계 기본 구현은 끝났다(`docs/R104_PHASE1_SPEC_KO.md`). 코드로 할 수 없는 항목(전용 작곡가 의뢰, 베타 리텐션 측정, 스토어 제출·피처드 제안)은 "외부 체크리스트"로만 남긴다.

## 아트 방향 (모든 작업 공통)

"한국의 밤을 건축한 떠 있는 조각". Monument Valley처럼 절제된 파스텔, 등각 입체감, 빛과 안개의 층.

- **의미 색 고정:** 금빛 `#ffd98a`~`#ffeca5` = 탭할 곳·빛 조각, 산호/주홍 `#ff8a73`~`#ff6f61` = 위험, 오로라(청록 `#7ff3e1` → 파랑 `#8ab8ff` → 보라 `#b78cff` → 분홍 `#ff9ed8`) = 목적지.
- **챕터 팔레트:** 하늘 그라데이션 2색 + 건축 3톤(윗면 밝음, 옆면 중간, 그림자면 어두움). 배경은 명도 낮고 채도 적게. 고대비 체크무늬·원색 금지.
- **길과 블록:** 선 한 줄이 아니라 두께가 있는 블록(윗면·옆면 3톤 + 아래 그림자). 난간·창·계단 같은 작은 건축 디테일.
- **층:** 전경 실루엣 · 중경 게임판 · 원경 안개 속 건축(패럴랙스 0.2배).
- **품질 기준:** 아무 프레임이나 캡처해도 포스터가 되는 수준. 60fps(보급형 폰), 프레임당 할당 최소화.

## 공용 계약 (이미 구현된 연결 지점)

- `MongyuPolish` (`web/src/polish-bus.js`): `run-event` `{run,event}`, `frame` `{ctx,run,viewport,time,reduced,speech?}`, `attach`.
- `MongyuPolish.host`: `sound(kind)`, `settings()`, `activeRun()`, `canvas`, `viewport()`, `audio()` → `{context,music,sfx}`(음악·효과 버스, 볼륨 설정 반영) 또는 `null`, `startRun(run,event)`(app.js의 `startRestorationRun`), `refreshMusic()`.
- `MongyuPolish.claimMusic(fn)`: `fn(run)`이 true를 반환하면 app.js가 그 달리기 동안 기존 라이선스 음악을 멈춘다.
- 모든 캐릭터는 `MongyuMobile.sprite(c,q,fx,reduced,character,style)` 한 곳을 지난다(이야기 장면, 1번째 기억, native 기억, 로비).

### 작업 간 새 계약

| 계약 | 제공 | 사용 |
| --- | --- | --- |
| `MongyuCharacter.draw(ctx,q,fx,reduced)` — polish 캐릭터. `q`는 기존 sprite 인자 그대로 + `q.pose` ∈ `stand,run,jump,land,wall,hurt,joy`(없으면 `nativeState`·`jumpProgress`·`strideDistance`로 추론). `bodyHeight`는 호출자가 정함 | D | D가 `mobile-presentation.js`의 `sprite()`에서 polish일 때 위임 |
| `run.pose` (`hurt`/`joy`/없음)과 `run.poseAt` — 1번째 기억 충돌·골인 시 캐릭터 포즈 | F | F가 sprite 호출 시 `q.pose`로 전달 |
| `run.retryFromCheckpoint()` — 1번째 기억: 충돌한 구간(바닥/벽/천장) 시작에서 즉시 재시작, 점수는 그 구간 시작 시점으로 | F | G가 실패 화면 "아무 곳 탭 = 재시작"에서 호출 |
| `MongyuSquareArt.actorScreen` → `{x,y}|null` — native 기억에서 캐릭터의 화면 좌표(CSS px) | E | F(`play-juice.js`)가 native 충돌 파편 위치로 사용 |
| `run.coach={kind,text,until}` | F(1번째 기억), G(native는 HUD가 상태로부터 계산) | G |
| `MongyuAdaptiveMusic.intensity` (0~4) | H | G(HUD 콤보 색), 선택 |

## 작업 영역과 파일 소유권

| 영역 | 파일 | 결과 |
| --- | --- | --- |
| D. 캐릭터 | `web/src/character-art.js`(신규), `web/src/mobile-presentation.js` | 잠옷 망토 아이 리디자인, 달리기 8프레임·점프·착지·벽 전환·넘어짐·기쁨, 망토 흔들림, 모든 화면 공통 |
| E. native 기억 아트 | `web/src/square-art.js`, `web/src/native-scene.js`, `web/src/native-palette.js`, `web/src/scene-stagecraft.js`, `web/src/immersive-art.js`, `web/css/r104-world.css` | 체크무늬 제거, 챕터 팔레트, 입체 블록 벽, 장애물(셀·발사체) 리디자인, 안개 층, `actorScreen` |
| F. 1번째 기억 아트·카메라·연출 | `web/src/opening-run.js`, `web/src/play-juice.js`, `web/css/r104-juice.css` | 입체 블록 길, 장애물 3종, 배경 3층, 캐릭터 화면 높이 8~10%, 면 전환 카메라 회전+줌아웃, 골인 시 건축에 불 켜짐, 결과 "포스터 컷", "+50 완벽" 떠오름, 캐릭터 충돌 반응, `retryFromCheckpoint` |
| G. UI·이야기·튜토리얼 | `web/src/restoration-ui.js`, `web/src/play-hud.js`, `web/src/restoration-story-graph.js`, `web/css/r104-story.css`, `web/css/r104-hud.css` | 결과 점수 카운트업+별 3개, 실패 화면 탭=체크포인트 재시작, 하트 깨짐+무적 표시, 콤보 게이지 색, 이야기 길게 눌러 빨리감기, 기억 사이 짧은 장면, native 새 규칙 튜토리얼 |
| H. 사운드 | `web/src/adaptive-music.js`(신규), `web/src/game-sfx.js` | 4층 적응형 음악(합성 임시 스템), 충돌 시 필터 닫힘, 골인 해결 화음, 효과음 음조 통일(연속 점프 음 상승 등) |
| I. 모드·공유·접근성 | `web/src/endless-dream.js`, `web/src/illusion-course.js`, `web/src/share-capture.js`, `web/src/play-modes.js`(모두 신규), `web/css/r104-modes.css` | 무한 꿈 모드+일일 도전+주간 최고, 착시 점프 코스, 포스터 이미지·짧은 영상 공유, 색약 모드·모션 줄이기 진입, 로비 진입 버튼 |
| 통합 | `web/build.py`, `web/sources.json`, `web/src/app.js`, `web/src/polish-bus.js`, `web/index.template.html`, 문서·테스트 | 메인 세션 |

## 외부 체크리스트 (코드 밖)

- [ ] 전용 작곡 의뢰: 메인 테마 + 챕터 5곡 × 4스템, 효과음 세트 (H의 합성 스템을 교체)
- [ ] 비공개 베타로 D1·D7 측정 (관문 C: D1 40%, D7 15%)
- [ ] 스토어 아이콘·스크린샷 6장·15~30초 트레일러 촬영 (I의 포스터·영상 캡처 활용)
- [ ] App Store·Google Play 피처드 제안, 소프트 런칭
- [ ] Android R104 APK: `VIBRATE` 권한 추가 후 서명 빌드
