# 몽유 R105 구현 명세 · 코스 엔진과 구간(act)

기획서 `docs/R105_RESEARCH_PLAN_KO.md`의 "코스 타입 8종", "카메라 시스템", "챕터 1 한 판 63초"를 구현하기 위한 작업 명세. R105 빌드(`python web/build.py --release R105` → `web/MONGYU_R105.html`)에서만 켜진다. R105는 R104(`MONGYU_POLISH_EDITION===true`)를 그대로 포함하고 그 위에 새 파일만 얹는다. R103·R104 빌드의 동작은 바꾸지 않는다.

## 구조 한눈에

한 판 = **여러 구간(act)을 이어 붙인 하나의 달리기**. 구간마다 렌더러와 카메라가 다르고(평면 사각 방, 등각 착시 다리, 나선 탑), 구간 사이는 **오로라 문 전환**(0.6초, 꿈속 장면 전환)으로 잇는다. 점수·빛 조각·완벽 콤보는 구간을 넘어 이어진다. 구간은 서로 모르고, `CourseRun`(코스 엔진)이 순서와 전환을 맡는다. 그래서 구간을 병렬로 개발할 수 있다.

| 작업 | 파일 | 내용 |
| --- | --- | --- |
| A. 코스 엔진 + 꿈의 길 | `course-run.js` `road-mode.js` `play-modes.js`(진입·결과 연결만) `opening-run.js` `illusion-course.js`(chain 옵션만) `r104-road.css` | `CourseRun`, 챕터 1 코스 5개 정의, 캠페인 화면(별·해금·결과) |
| B. 나선 구간 | `helix-act.js` | 나선 상승·하강 구간(의사 3D, 오빗 카메라) |
| C. 착시 구간 | `penrose-act.js` | 펜로즈 계단 루프, 시점 정렬 다리(둘 다 등각 투영) |

## 공용 실행체 계약 (act = run)

`IllusionRun`(`web/src/illusion-course.js`)과 `OpeningRun`(`web/src/opening-run.js`)이 이미 구현한 형식이 곧 계약이다. app.js와 HUD가 이 형식만 안다.

필드: `state`(`ready|play|pause|clear|fail`), `mode:'dream'`, `dreamMode`, `time`, `clock`, `updates`, `score`, `hearts`, `distance`, `events`, `coach{kind,text,until}`, `crash`, `result`, `attempt`, `outro`, `perfectStreak`, `pose`, `polish:true`.
메서드: `setViewport(w,h)`, `start()`, `pause()`, `resume()`, `retry()`, `inputDown()`, `inputUp()`, `cancelInput()`, `tick(dt)`(app.js가 1/120초 단위로 호출), `drainEvents()`, `status()`, `drawSelf(ctx,opts)`(`mode==='dream'`인 런은 스스로 그린다. `play-modes.js`가 `MongyuSquareArt.draw`를 감싸 이 경로를 연결한다).
이벤트 이름: `start jump land hit pass perfect morph corner portal clear fail pause resume`.
`opts`(draw): `{viewport,time,reduced,...}`. 접근성: `MongyuPolish.host.settings().reduced`가 true면 흔들림·회전·플래시를 줄이거나 끈다.

### act 확장 계약 (모든 act가 지킨다)

생성자 옵션에 `chain`이 있으면 코스 엔진 안의 구간이다.
- `chain={index,count,first,last,carry:{points,shards,perfectStreak,hearts},bpm,seed}`
- `chain.first===false`면 인트로·튜토리얼·느린 찬스를 건너뛴다(구간 사이에 가르치지 않음. 새 개념의 튜토리얼은 구간 옵션 `tutorial:true`로 켠다).
- `chain.last===false`면 끝선을 넘는 순간 **긴 clear 연출(아웃트로·포스터 컷) 없이 곧바로 `state='clear'`** 로 끝낸다. 전환은 코스 엔진이 그린다. `last===true`면 지금처럼 클리어 연출을 한다.
- `chain.carry.points`부터 점수를 이어서 센다. `result`에 `points`(이 구간 끝 시점의 누적 점수 원점수), `shards`(이 구간에서 모은 수), `perfectStreak`를 담는다.
- 실패하면 `state='fail'`(구간 단위 체크포인트 재시작은 코스 엔진이 한다).
- 박자 격자: `chain.bpm`(기본 100)이 있으면 장애물·표식 위치를 박자 간격(`speed*60/bpm`)의 배수에 둔다. 음악과 맞추기 위함이다.

## 카메라 (구간마다)

기획서 "카메라 시스템 사양" 표를 따른다. 값은 모두 제안값이고 실제 화면에서 보며 조정한다. 롤·흔들림·줌 펄스·FOV 변화는 `reduced`에서 끈다.

## 공통 규칙

- 코드는 `globalThis.MONGYU_POLISH_EDITION===true`일 때만 켠다. 파일은 IIFE + `root.MongyuXxx=api` + `module.exports` 형식(기존 파일과 같음).
- 새 코스·장애물 배치는 **결정적**이어야 한다(같은 입력 → 같은 결과). 고스트와 일일 도전을 위해서다. 무작위가 필요하면 시드 기반.
- 줄바꿈은 LF. 코드 스타일은 기존 파일처럼 압축형.
- 성능: 프레임당 그리기 4ms 이하(데스크톱 Chrome 기준), 프레임당 객체 할당 최소화.
- 모든 새 동작에 `web/tests/r105-*.test.cjs` 노드 테스트를 붙인다(`web/tests/host.cjs`와 기존 `r104-*.test.cjs` 참고).
- 검증: `python web/build.py --release R105` 후 Playwright로 390×844 모바일 컨텍스트에서 직접 플레이하고 화면을 눈으로 확인한다. `python scripts/test.py`(약 3분)가 통과해야 한다. 테스트가 `android/expected-asset.sha256`, `android/expected-playable-assets.json`을 고치면 `git checkout --`로 되돌린다.

## 작업 A 세부: CourseRun과 꿈의 길

`MongyuCourse`:
- `CourseRun(options)` — act 목록(`acts:[{type,opts}]`)을 받아 하나의 run처럼 동작한다. 자식 act는 `ACTS[type](opts)`로 생성하며, `ACTS`는 `MongyuCourse.registerAct(type,factory)`로 등록한다(`floor-wall`=OpeningRun, `bridge`=IllusionRun(부분 plan), `helix-up`/`helix-down`=MongyuHelix, `penrose`/`align`=MongyuPenrose). 등록이 없는 act 타입은 건너뛰되 경고를 남긴다(다른 작업이 아직 없어도 코스를 구성해 시험할 수 있어야 한다).
- 자식이 `clear`가 되면 0.6초 오로라 문 전환(화면 가장자리에서 청록→보라→분홍 고리가 모이며 다음 구간 장면으로 교차 페이드, reduced에서는 짧은 페이드)을 그리고 다음 자식을 시작한다. 마지막 자식의 clear는 코스 clear다.
- 자식이 `fail`이면 코스도 fail. **재시작은 실패한 구간의 처음부터**(`retry`가 같은 구간을 새로 만들고 점수·콤보를 그 구간 시작 시점으로 되돌림). 코스 전체 점수는 `points` 합 + 거리 보너스.
- `status()`는 전체 코스 진행도(구간 진행도 가중 평균)와 점수·하트를 돌려준다. HUD(`play-hud.js`)가 읽는 형식을 따른다(`openingCourse`가 아니므로 native 형식인지 확인).
- 이벤트는 자식 것을 그대로 중계하고 구간 전환에 `portal`을 낸다.
- `IllusionRun`은 `options.plan`(PLAN 배열)과 `options.sections`를 받을 수 있게 하고(기본값은 지금 그대로), `OpeningRun`과 함께 `chain` 옵션을 지원하게 최소 수정한다.
- 챕터 1 정의 `CHAPTER1`: 코스 5개. 구성 예시(구간 수와 길이는 구현하면서 시간 40~70초로 맞춘다): ①입문(floor-wall + 짧은 bridge 튜토리얼) ②나선 오르막(helix-up) ③거울 정원(bridge 여러 개 + penrose) ④내려오는 길(helix-down + floor-wall) ⑤새벽의 탑(floor-wall → helix-up → 고요 → bridge → helix-down → 골인, 기획서 63초 스토리보드). 각 코스에 이름, 구간 목록, 별 조건(★완주 ★빛 조각 전부 ★무피격), 팔레트(챕터 1 새벽 계열)를 둔다.

`MongyuRoad`(꿈의 길):
- 타이틀 화면에 "꿈의 길" 진입 버튼을 `play-modes.js`의 기존 행(`.r104-modes-row`)에 추가한다. 기존 3개 모드는 건드리지 않는다.
- 캠페인 화면: 코스 5개를 위로 이어지는 길(돌 표식)로 보여 주고 별(0~3), 잠금(앞 코스 클리어 시 해금)을 표시한다. 기록은 기존 저장 방식(`_MongyuStore`/`durable-storage.js`)에 `mongyu.r105.road`로 저장(try/catch).
- 결과 패널: 점수 카운트업, 별 3개, 최고 기록, "다음 코스"/"다시 달리기"/"꿈의 길로". 디자인은 `restoration-ui.js` 폴리시 결과 화면(R104)과 같은 톤.
- `play-modes.js`의 `isDream`, `newRun`, `retry`가 `dreamMode:'road'`를 다루도록 최소 연결(결과 패널은 `MongyuRoad`가 자기 것을 쓰고 `dreamResult` 패널과 겹치지 않게).
- 포스터·영상 저장은 `MongyuShare`를 그대로 쓴다.

## 작업 B 세부: 나선 구간 `MongyuHelix`

`HelixRun`(act 계약을 지키는 run) + `variant:'up'|'down'`. 기획서 "나선 상승/하강" 행과 카메라 표를 구현한다.
- 의사 3D: 탑 축을 중심으로 나선 경사로(반지름 R, 한 바퀴 높이 pitch, 3~4바퀴)를 매개변수 θ(s)로 정의하고 원근 투영(카메라 거리 D, 초점 f)해 얇은 사각 띠 조각(한 바퀴당 약 48~64개)을 깊이 순서로 그린다. 캐릭터와 장애물은 빌보드. 캐릭터는 `MongyuMobile.sprite`로 그린다(`q.pose`, `bodyHeight`는 화면 높이 약 9%).
- 조작: 탭 = 점프(박자 격자 위 장애물, 산호빛 수정). 달리는 방향은 항상 진행 방향.
- 카메라: **오빗**(캐릭터 각도를 따라 탑 둘레를 돈다), 높이 스프링 추적. 상승: 틸트 -14°, 오를수록 줌 1.0→0.9, 골인 직전 3초 올려다봄. 하강: 속도에 따라 FOV·줌 증가, 룩어헤드 0.35→0.6초, 속도선 파티클, 안개 짙어짐, 마지막 감속. `reduced`에서는 오빗 각속도와 줌 변화를 줄인다.
- 시각: 탑 몸통(창 슬릿·난간이 있는 두꺼운 원통), 경사로는 윗면·옆면·그림자 3톤, 깊이에 따른 안개 페이드, 하늘 그라데이션 + 원경 실루엣, 상승은 새벽→여명, 하강은 황금→분홍→밤. 빛 조각, 충돌 파편은 `play-juice.js` 규칙을 따라 `run-event`로 연결된다(자체 구현 불필요).
- 끝: 구간 끝에 오로라 문(`chain.last`일 때 기존 골인 연출 수준).
- 혼자서도 시험할 수 있어야 한다: `MongyuPolish.host.startRun(new MongyuHelix.HelixRun({variant:'up',viewport,settings}),event)`.

## 작업 C 세부: 착시 구간 `MongyuPenrose`

등각 투영 act 두 개. 렌더 규칙(등각 좌표, 두꺼운 블록, 팔레트)은 `illusion-course.js`와 같게 맞춘다(필요한 보조 함수는 복사해서 쓴다. 파일은 그 파일을 수정하지 않는다).
- `PenroseRun`: 펜로즈 계단 루프. 네 방향 계단이 이어져 한 바퀴 돌아도 제자리인데 계속 오르는 것처럼 보이는 폐곡선. 캐릭터는 루프를 2바퀴 달리며 박자 격자에 놓인 장애물을 점프로 넘고, 바퀴마다 속도가 올라가며, 카메라는 아주 천천히 돈다. 2바퀴째 끝에 오로라 문이 열린다. "계속 오르는데 끝이 없다"가 한눈에 읽혀야 한다.
- `AlignRun`: 시점 정렬 다리(고요 구간용). 캐릭터가 절벽 끝에 서면 끊어진 두 다리 조각이 서로 다른 깊이에 떠 있고, 카메라가 천천히 회전한다. 두 조각이 시각적으로 정확히 이어지는 각도 창(±5°)에서 탭하면 정렬이 스냅되고(0.12초 정지, 딸깍 소리 `corner`, 선이 맞물리는 애니메이션) 다리가 이어져 건넌다. 놓치면 카메라가 한 바퀴 더 돌아 다시 기회가 오며(실패 없음, 느긋한 구간), 코치 문구로 안내한다. 4~8초.
- 두 act 모두 `variant`·`bpm`·`seed` 옵션, 단독 시험 방법은 B와 같다.

## 아이템 설계 (2차 작업 예정, 계약 초안)

작업 A·B·C가 끝난 뒤 별도 작업(D)으로 구현한다. 모든 act는 코스 정의의 `items:[{at,kind,lane?}]`를 받아 처리하고, 효과는 공용 수정자 `run.mods`로 표현한다.

- 종류(MVP): `light`(빛 조각, 기존), `bubble`(달빛 방울: 다음 충돌 1회 무효, 사용하면 ★3 무피격 불가), `time`(별빛 시간: 4초 동안 속도 0.7배), `feather`(구름 깃털: 다음 점프 1회가 두 배 길이/높이, 위 경로의 빛에 닿게 함). 콤보 보상 `surge`(완벽 ×3 달성 시 4초 오로라 파도: 점수 ×2)는 줍는 아이템이 아니라 상태다.
- `run.mods={shield:n, slowUntil:t, featherCharges:n, surgeUntil:t}`. act의 `hit()`은 `shield>0`이면 소모하고 충돌을 무시, `pace(dt)`는 `slowUntil` 동안 시간 배율을 곱하고, `jump()`는 `featherCharges>0`이면 큰 점프를 쓴다. 이벤트 이름: `item` (detail: kind), `shield-break`, `surge`.
- 배치 규칙: 위치는 결정적이고 박자 격자·점프 궤적 위, 선물(bubble/time/feather)은 코스당 0~2개이며 약 25~30초에 1개 이하, 가장 어려운 구간 직전이나 고요 구간에 둔다. 위험한 곁길에는 분홍 빛(가치 3배).
- 가독성: 형태+색+소리 3중 구별(빛=금빛 마름모, 방울=청백 물방울, 시간=보라 초승달/모래시계, 깃털=분홍 깃털), 위험=산호 수정. 색약 모드에서도 형태로 구별. 획득 시 곡의 조성에 맞는 음, 유형별 악기 층.
- 지속 표시: 캐릭터 주변 링 + HUD 칩, 끝나기 1초 전 깜빡임.
- 도움: 같은 구간에서 3번 실패하면 다음 시도에 방울이 시작 위치에 놓이는 선택형 도움(설정에서 끌 수 있음, 사용한 런은 ★3 불가).
- 영속 수집: 코스마다 숨은 "기억의 별" 1개(위험한 곁길/착시 뒤). 모으면 꿈의 섬 갤러리 해금(포스터 프레임, 음악 스템 듣기, 이야기 조각)과 캐릭터 외형 성장(능력 아님).
- 장치(비소모, Geometry Dash식): 금빛 고리(닿았을 때 탭하면 공중 추가 도약), 도약 패드(닿으면 자동 발사), 포털(면 전환·중력 반전·속도 변화). 챕터마다 새 장치 하나를 처음엔 쉽게 소개한다.
