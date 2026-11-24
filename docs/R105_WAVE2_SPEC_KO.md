# 몽유 R105 2차 명세 · 환각 적용, 아이템, 화면 개편

기준 문서: `docs/R105_PSYCHEDELIC_ART_KO.md`(환각 방향과 **안전 규칙**), `docs/R105_UI_SPEC_KO.md`, `docs/R105_VOICE_TONE_KO.md`(말투), `docs/R105_SPEC_KO.md`(공용 실행체·act 계약, 아이템 계약 초안). 모든 새 동작은 `MONGYU_UI_EDITION===true`(R105 빌드)에서만 켠다. R103·R104는 바꾸지 않는다.

## 공통 규칙

**생성 이미지 사용:** `MongyuArt`(`web/src/art-assets.js`)로 임베드된 WebP를 쓴다. `MongyuArt.image(id)`, `ready(id)`, `preload(ids)`, `draw(ctx,id,x,y,w,h,opts)`. 사용 가능한 id:
- 배경: `lobby-psy`(720×1279, 환각 로비), 코스 배경 `course-c1`~`course-c5`(곧 추가, 없으면 `lobby-psy`로 대체해 시험)
- 아이템(256px, 투명): `item-light`(금빛 조각) `item-bubble`(달빛 방울) `item-hourglass`(별빛 시간) `item-feather`(구름 깃털) `item-star`(기억의 별) `item-ring`(금빛 고리) `item-lotus-pad`(도약 패드) `item-portal`(만화경 포털) `item-gate`(오로라 문) `item-crystal` `item-plate` `item-shard-broken`(장애물 시안)
- 캐릭터 포즈(512px, 투명): `pose-stand` `pose-run-a` `pose-run-b` `pose-jump` `pose-land` `pose-hurt` `pose-joy` `pose-sleep`
이미지가 아직 디코딩 중이면(`ready(id)===false`) 건너뛰고 다음 프레임에 그린다. 번들 용량을 지키려고 **새 이미지를 추가하려면 `tools/art-pipeline.py`**(`bg`, `cut`, `grid`, `list`)를 쓰고, 추가한 이미지 목록과 크기를 보고서에 적는다.

**환각 안전:** 초당 3회를 넘는 밝기·색 번쩍임 금지, 색 순환 주기 ≥ 20초, 회전 한 바퀴 ≥ 40초, 화면 전체 고대비 줄무늬 이동 금지, 플레이 영역(장애물·캐릭터 근처)의 가독성이 우선(오버레이 알파는 낮게). `settings().reduced`면 움직임·순환·파문을 모두 끈다. 색약 모드(`html[data-cvd]`)에서 위험·목적지 구별이 유지돼야 한다.

**말투:** `docs/R105_VOICE_TONE_KO.md`. 새 한국어 문구는 길(반말 코치) / 독백 / 시스템(해요체) 중 한 목소리로 통일하고 개발자 용어를 쓰지 않는다. **영어 문구는 담당 파일 `web/src/i18n-en-<영역>.js`에만 쓴다**(`i18n-en.js`는 건드리지 않는다). 키는 한국어 원문 그대로, 패턴은 정규식.

**파일 소유:** 아래 표 밖의 파일은 고치지 않는다. 필요하면 보고서에 정확한 패치를 적는다. 줄바꿈은 LF.

**검증:** `python web/build.py --release R105` → Playwright 390×844(`hasTouch`, `isMobile`, `bypassCSP`)로 직접 플레이해 눈으로 확인한다. `python scripts/test.py`(약 3분) 통과. 테스트가 `android/expected-*`를 고치면 `git checkout --`로 되돌린다. 새 테스트는 `web/tests/r105-*.test.cjs`.

## 작업 P · 환각 로비

소유: `web/src/lobby-scene.js`, `web/src/lobby-ui.js`, `web/css/r104-ui.css`, `web/src/i18n-en-lobby.js`, `web/tests/r105-ui-*.test.cjs`(로비 관련).

현재 로비는 "새벽 정원"(벡터 풀 장면)이다. 이것을 **환각 로비**로 바꾼다.
- 뒤 배경 = `lobby-psy`(cover 맞춤, 화면 비율이 달라도 중요한 부분이 보이게 위치 고정). 이미지의 달항아리 달은 속이 빈 흰 원이다(중심 약 (50%, 18%), 반지름 약 15% 너비). **이 원 안을 살아 있는 최면 소용돌이**(나선 + 만화경 대칭, 천천히 회전, 색은 이미지 팔레트)로 직접 그려 채운다.
- 이미지 위에 겹치는 움직임: 달에서 퍼지는 동심원 파문(느리게, 알파 ≤ .25), 떠다니는 눈과 반짝이는 마름모(이미지의 것과 어긋나지 않는 위치에서 은은히), 색 숨쉬기(주기 ≥ 20초, `hue` 합성 또는 `ctx.filter` 대신 합성 모드를 우선 — iOS Safari는 `ctx.filter`를 지원하지 않을 수 있음).
- 캐릭터는 벡터 스프라이트(`MongyuMobile.sprite`)로 이미지의 징검돌/계단 쪽 작은 떠 있는 돌판 위(화면 높이 약 60%, 중앙 왼쪽)에 서서 숨 쉰다. 지금 로비의 징검섬과 정원 벡터 풍경은 제거한다. 캐릭터가 이미지와 어울리게 이미지 속 팔레트로 림라이트를 준다.
- 타이틀 "몽유" 벡터 레터링은 유지하되 **무지갯빛 그라데이션(고정, 순환 없음) + 어긋난 윤곽 그림자**로 환각 스타일로 바꾼다.
- 하단(화면 높이 약 78%~)은 이미지가 어둡게 비어 있어 CTA와 도크가 읽힌다. CTA와 도크의 유리 패널 테두리를 무지갯빛 얇은 그라데이션으로, 눌림/숨쉬기 모션은 유지.
- 가로 모드·320×568에서도 달 소용돌이와 CTA가 겹치지 않게 레이아웃.
- 성능: 장면 그리기 프레임당 3ms 이하. 소용돌이는 낮은 해상도 오프스크린에 그려 확대해도 된다.

## 작업 I · 아이템과 수집물

소유: `web/src/items.js`(신규 로직), `web/src/opening-run.js`, `web/src/illusion-course.js`, `web/src/helix-act.js`, `web/src/penrose-act.js`, `web/src/play-hud.js`(칩 표시가 필요하면), `web/src/i18n-en-items.js`, `web/tests/r105-items-*.test.cjs`. `web/src/course-run.js`는 **mods 이월과 칩 HUD, 코스 정의의 `items`만** 최소 수정(다른 에이전트가 같은 파일에 작은 훅을 추가하므로 해당 함수 안에서만 고친다).

`docs/R105_SPEC_KO.md`의 "아이템 설계" 계약을 구현한다.
- **종류:** `bubble`(다음 충돌 1회 무효, 사용하면 ★무피격 불가) `time`(4초 동안 속도 0.7배) `feather`(다음 점프 1회가 두 배 길이) 그리고 상태 `surge`(완벽 ×3 달성 시 4초 점수 ×2, 줍는 게 아님) 그리고 숨은 수집물 `memory-star`(코스당 1개, 위험한 곁길/착시 뒤. 획득은 `mongyu.r105.road` 기록의 코스별 `memoryStars`에 저장하되 저장 형식은 road-mode.js의 `record`를 읽어 호환되게 `items.js`에서 읽고 쓰는 함수로 분리).
- **데이터:** act 옵션 `items:[{at,kind}]`. `at`은 act 진행 비율(0~1) 또는 박자 번호 중 하나(`{beat:n}`)로 act가 자기 거리로 변환. 결정적. 선물(bubble/time/feather)은 코스당 0~2개, 약 25~30초에 1개 이하, 가장 어려운 구간 직전이나 고요 구간 배치. 챕터 1 코스 5개 정의(`course-run.js`의 `CHAPTER1`)에 배치한다.
- **`run.mods`:** `{shield:n, slowUntil:t, featherCharges:n, surgeUntil:t}`. 모든 act의 `hit()`/`pace()`/`jump()`가 공용 헬퍼 `MongyuItems.apply*`를 거치게 해 act마다 중복 구현하지 않는다. `CourseRun`이 다음 act로 mods를 이월(실패 시 구간 시작 시점의 mods로 복원).
- **그리기:** 줍는 아이템은 `MongyuArt`의 `item-*` 스프라이트를 act의 월드 좌표로 투영해 그린다(없으면 기존 벡터 빛 조각처럼 단순 도형으로 대체). 빛 조각도 `item-light` 스프라이트로 바꾸되 성능 예산을 지킨다. 유효 지속 표시: 캐릭터 주변 링 + HUD 칩(끝나기 1초 전 깜빡임은 ≤ 2Hz).
- **이벤트·소리:** `item`(detail: kind), `shield-break`, `surge`. 획득음은 `host.sound`로, 기존 효과음 이름을 재사용하거나 `game-sfx.js`에 합성 음 추가가 필요하면 보고서에 요청(그 파일은 소유하지 않음).
- **스프라이트 가독성:** 형태+색+소리로 구별(색약 모드 대비), 장애물(산호 수정)과 헷갈리지 않게.
- **소극적 도움:** 같은 구간에서 3번 실패하면 다음 시도 시작 위치에 방울이 놓이는 선택형 도움(`options.assist`, 기본 켜짐, 설정 토글은 제안만), 쓴 판은 ★무피격 불가.
- **장치(여력이 있으면):** `ring`(닿았을 때 탭하면 공중 추가 도약), `pad`(닿으면 자동 발사)를 helix/floor-wall에서. 핵심은 위 아이템이 먼저다.
- 코스 클리어 시간과 난이도 균형이 깨지지 않게 자동 조종으로 5개 코스를 끝까지 시험한다(아이템을 먹는 조종과 안 먹는 조종 모두).

## 작업 L · 환각 층(코스)과 꿈의 길 화면

소유: `web/src/psy-layer.js`, `web/src/road-mode.js`, `web/css/r104-road.css`, `web/src/i18n-en-psy.js`, `web/tests/r105-psy-*.test.cjs`, `web/tests/r105-road-*.test.cjs`. `web/src/course-run.js`에는 **자식 act를 그린 직후 `MongyuPsy.draw(ctx,run,opts)`를 호출하는 한 줄 훅과 그 호출에 필요한 최소 옵션 전달만** 넣는다(다른 에이전트가 같은 파일에서 아이템 이월을 고친다).

- **`MongyuPsy.draw(ctx,run,opts)`:** act 위에 겹치는 약한 환각 층. (1) 코스 배경 이미지(`course-<id>`, 없으면 `lobby-psy`)를 `soft-light`/`screen` 합성, 알파 약 .18~.28로 천천히 흐르게(패럴랙스, 느린 호흡), 플레이 영역 가독성 우선; (2) 박자에 맞춘 파문(바이트 간격은 BPM, 알파 ≤ .15, 완벽 콤보에서 강해짐); (3) 가장자리 무지갯빛 비네트(콤보 ×3 이상에서 진하게, 번쩍임 없이); (4) 색 숨쉬기(≥ 20초); (5) 구간 전환(오로라 문)에서 층 교체. 콤보가 오를수록 채도와 만다라 선 수가 늘어남(점진적 변화). `reduced`이면 정지된 은은한 비네트만. **장애물과 캐릭터가 항상 또렷해야 하며**, 스크린샷에서 이를 눈으로 검증한다.
- **꿈의 길 화면 개편:** 코스 카드에 `course-<id>` 썸네일(없으면 `lobby-psy` 일부)과 별, 잠금(자물쇠 아이콘은 `MongyuIcons`), 환각 테두리. 결과 패널 상단에 `pose-joy`(클리어) / `pose-hurt`(실패) 초상을 크게(생성 이미지), 점수 카운트업·별·버튼 레이아웃은 겹침 없이 하단 1/3에 고정, 포스터 컷이 가려지지 않게. 지금 결과 패널의 한국어 문구를 말투 가이드로 윤문.
- 성능: 층 그리기 프레임당 2ms 이하.

## 작업 S · 결과·이야기·옷장·지도 화면

소유: `web/src/restoration-ui.js`, `web/css/r104-story.css`, `web/css/r104-hud.css`, `web/src/play-modes.js`(무한/일일/착시 결과 패널 문구·배치만), `web/src/i18n-en-screens.js`, `web/tests/r105-screens-*.test.cjs`.

`docs/R105_UI_SPEC_KO.md`의 "결과·목록" 항목과 실제 문제를 고친다.
- **결과 화면(옛 지도 기억 결과, 무한·일일·착시 결과):** 점수·별·버튼이 **스테이지 위에 겹치지 않게** 하단 1/3에 고정하고 스테이지는 포스터처럼 보이게. 헤드라인은 짧은 독백체("빛의 문이 열렸어", "꿈이 접혔네"), 설명은 해요체. 초상 `pose-joy`/`pose-hurt`를 곁들일 수 있다.
- **이야기 목록:** 잠긴 항목은 한 줄 "아직 만나지 못한 이야기 N개"로 접고 열린 항목만 보여 준다. 카드에 번호·제목·한 줄 요약.
- **옷장:** 잠긴 옷은 실루엣 격자 대신 "열리면 이 자리에 나와요 · N벌 남음" 한 줄과 다음에 열릴 옷 1개만 힌트로. 열린 옷을 먼저, 선택 상태는 명확히. 상단에 `pose-stand` 큰 초상(가능하면 선택한 옷 색을 입힌 벡터 스프라이트도 좋음).
- **꿈 지도(옛 100슬롯):** 새 "꿈의 길"이 본선이므로 옛 지도는 "예전 꿈" 섹션으로 위치·이름을 정리하고, 카드의 어색한 문구를 말투 가이드로 윤문. 100개를 전부 고칠 필요는 없고 **화면에 먼저 보이는 문구와 잘 보이는 도움말**을 우선한다.
- **이야기 장면:** 3인칭 서술체("~했다")로 된 장면 문장을 **1인칭 독백 반말**로 고친다(우선 오프닝·기억 사이 장면·엔딩 부근의 눈에 띄는 것들, 약 20~40문장). `restoration-story-graph.js`는 소유하지 않으므로 문장 목록과 고친 문구를 `docs/R105_STORY_REWRITE_KO.md`에 정리하고, 적용 가능한 곳(`restoration-ui.js`에 있는 문구)은 직접 고친다. 영어는 `i18n-en-screens.js`에.
- 일시정지 화면에 남은 옛 문구("탭하여 점프 · 빛 0 / 6")를 정리한다.
- 모든 화면에서 최소 14px, 터치 대상 44px, 겹침 없음(390×844, 320×568, 844×390).
