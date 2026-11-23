# 몽유 R104 · 1단계 "손맛과 연출" 구현 명세

기획서(`docs/MONGYU_NOM3_MV_PLAN_KO.html`) 로드맵 1단계를 코드 작업 단위로 쪼갠 명세다. 모든 새 동작은 `--release R104` 빌드에서만 켜진다(`globalThis.MONGYU_POLISH_EDITION===true`, `<html data-polish-edition="true">`). R103 이하 빌드와 기존 테스트의 동작은 바꾸지 않는다.

## 공통 규칙

- 빌드: `python web/build.py --release R104` → `web/MONGYU_R104.html`. 로컬 확인: `python -m http.server 4173 --bind 127.0.0.1 --directory web` 후 `http://127.0.0.1:4173/MONGYU_R104.html`.
- 기준 화면: 390×844(iPhone), 추가로 320×568, 844×390(가로)에서 깨지지 않을 것.
- 모션 줄이기(`settings.reduced`)가 켜지면 흔들림·플래시·슬로모션·히트스톱을 끄거나 약하게.
- 소리: `MongyuPolish.host.sound(kind)` 로만 재생(음소거·볼륨 설정을 그대로 따름). 새 효과음은 `game-sfx.js`의 `configs`에 합성 정의를 추가하는 방식(외부 파일 추가 금지, CSP `connect-src 'none'`).
- 진동: `settings.vibration`이 켜져 있고 `navigator.vibrate`가 있을 때만.
- 파일 소유권(충돌 방지): 아래 표의 파일만 수정한다. 다른 작업 영역 파일이 꼭 필요하면 수정하지 말고 보고서에 요청으로 적는다.

## 연결 지점 (이미 구현됨)

`web/src/polish-bus.js` 의 `MongyuPolish`:

| 이벤트 | 시점 | detail |
| --- | --- | --- |
| `attach` | 앱 초기화 끝 | `{sound(kind), settings(), activeRun(), canvas, viewport()}` (이후 `MongyuPolish.host`로도 접근) |
| `run-event` | 달리기 이벤트마다 (`jump`,`land`,`hit`,`pass`,`clear`,`fail`,`pause`,`corner`,`perfect` 등) | `{run, event}` |
| `frame` | 활성 달리기 화면을 그린 직후 | `{ctx, run, viewport, time, reduced}` — 같은 캔버스 위에 덧그리기 |

`run`은 1번째 기억이면 `MongyuOpening.OpeningRun`(`run.openingCourse===true`), 그 외는 native 런(`run.nativeRuntime`)이다.

## 작업 영역

| 영역 | 담당 파일 | 핵심 결과 |
| --- | --- | --- |
| A. 이야기·결과 화면 | `web/src/restoration-ui.js`, `web/css/r104-story.css` | 화면 아무 곳 탭으로 넘기기, 타자기 출력, ▼ 표시, 결과 화면 버그 4개 |
| B. 충돌·골인·튜토리얼 | `web/src/opening-run.js`, `web/src/play-juice.js`, `web/src/game-sfx.js`, `web/css/r104-juice.css` | 충돌 연출(플래시·히트스톱·흔들림·파편·진동·3겹 효과음), 오로라 골인, 느린 찬스 튜토리얼, 실패 원인 데이터 |
| C. HUD | `web/src/play-hud.js`, `web/css/r104-hud.css` | 큰 점수, 하단 진행 게이지, 그 위 말풍선 |
| 통합 | `web/build.py`, `web/sources.json`, `web/src/app.js`, 테스트·문서 | 메인 세션이 담당 |

### A. 이야기·결과 화면

1. 이야기 장면(`#restorationScene`)에서 버튼이 아닌 곳(배경·말풍선·캐릭터)을 탭/클릭해도 다음으로. 글자가 출력 중이면 첫 탭은 전체 표시, 다음 탭이 넘김. 버튼(건너뛰기 등)은 기존 동작 유지. 전화 장면(`rings<2`로 비활성)은 비활성 조건을 그대로 지킬 것.
2. 대사 타자기 출력 초당 약 35자, `reduced`면 즉시 전체 표시. 접근성: 전체 문장은 즉시 aria에 노출.
3. 출력이 끝나면 말풍선 우하단에 ▼ 깜빡임(1.2초 주기).
4. 결과 화면 버그: (a) "다음 기억으로" 버튼 아이콘이 ↻ → →(다음) 아이콘, (b) 상단 "다시 달리기" 라벨 줄바꿈 방지, (c) 실패했는데 "✦ 새 기록"이 뜨는 문제 — 실제로 최고 기록을 넘었을 때만, (d) 이야기 장면 "001"과 플레이 화면 "002" 번호 불일치 정리(같은 기억이면 같은 번호).

완료 기준: 390×844에서 이야기 첫 장면을 화면 중앙 탭만으로 끝까지 넘겨 첫 달리기가 시작된다.

### B. 충돌·골인·튜토리얼

1. 충돌(1번째 기억 `OpeningRun`과 native 런 공통, `run-event: hit|fail`):
   - 0ms 흰빛 플래시 60ms + 캐릭터/장애물 색 번쩍임, 진동 40ms.
   - 0~120ms 히트스톱(1번째 기억은 `OpeningRun` 시뮬레이션 일시정지로 구현), 화면 흔들림 진폭 6px 감쇠(캔버스 요소 transform 또는 frame 오버레이 오프셋).
   - 120~600ms 장애물 위치에서 빛 조각 12~20개 파티클, 주변 채도 낮춤(오버레이).
   - 소리: 기존 `hit` + 새 합성 `impact-glass`(고음) + `impact-chime-fall`(하강 차임) 3겹.
2. 골인 오로라(1번째 기억):
   - 시작부터 결승점 위치에 오로라 문이 보임(현재 28px 마름모는 결승 260 전에야 등장 → 교체). 세로 커튼 3~4겹(청록→보라→분홍), 시간에 따라 흐르는 물결, 가산 합성(`globalCompositeOperation='lighter'`), 아래쪽 밝음.
   - 남은 거리 20%부터 화면 가장자리 오로라 비네트가 서서히 밝아짐.
   - 통과 순간: 0.4초 느린 진행(`reduced`면 생략), 오로라 확산, 빛 조각이 상단 점수 방향으로 날아감, 소리 `result-clear` 유지 + 새 `aurora-shimmer`.
3. 튜토리얼(1번째 기억, 첫 시도에 한해 — 저장된 기록이 없거나 `attempt===1`):
   - 느린 찬스: 첫 장애물 `at-70`부터 시뮬레이션 속도 0.25배로 늦추고, 탭할 때까지(또는 장애물 `at-20` 도달 시) 기다림. 탭 손가락 힌트는 frame 오버레이로 장애물 앞 바닥에 빛 고리 + 손가락.
   - 2~3번째 장애물: 앞 바닥에 "여기서 탭" 빛 고리(속도는 정상).
   - 실패 원인: `run.crash.early`(이미 계산됨)로 `run.coach = {kind:'early'|'late', text}` 노출. 텍스트: 일찍 "조금 일찍 눌렀어. 장애물 바로 앞에서!", 늦게 "한 박자 늦었어. 조금만 더 빨리!".
   - 코칭 문구는 `run.coach = {kind, text, until}` 로 노출만 하고, 표시는 C(HUD 말풍선)가 담당. 튜토리얼 단계 문구도 `run.coach`로: 느린 찬스 중 "지금 탭!", 벽 진입 직전 "벽도 바닥이야", 완벽 타이밍 시 "완벽!".
4. 완벽 타이밍 판정: 장애물 직전 적정 구간에서 점프하면 `events.push('perfect')`(기존 이벤트 이름 재사용) + `run.perfectStreak`.

### C. HUD (1번째 기억 + native 런 공통, 플레이 중에만)

1. 점수: 상단 가운데, 숫자 40px 이상, 오를 때 1.2배 튀었다 복귀(`reduced`면 생략). 1번째 기억의 점수 소스는 `run.score`(없으면 빛 개수×100 + 진행 보너스 등 `play-hud.js`에서 계산하지 말고 run 값 그대로 — 없으면 B에 요청). native 런은 기존 상태(`run.status()` 등)에서 점수·목표·목숨을 읽는다.
2. 하단 게이지: 화면 80~90% 높이, 가로 86%, 두께 16px, 진행률 = 결승까지 거리 비율. 위에 빛 수집 눈금 6개(획득 시 금빛), 끝에 오로라 문 아이콘. native 런은 점수/목표 비율 + 목숨 하트.
3. 말풍선(게이지 위 68~80% 영역): 캐릭터 얼굴 아이콘 + 본문 18px, 최대 2줄, 꼬리는 위(게임판) 방향. 소스 우선순위: `run.coach` → 기존 캔버스 대사(`runnerDialogue` 문구) → 구간 안내. 문구가 없으면 숨김(페이드).
4. 기존 HUD와 중복 제거: R104에서는 좌상단 작은 알약(`바닥 · 빛 0/6`)과 하단 작은 힌트 문구를 숨긴다(CSS로, R104 한정).
5. 일시정지·결과·이야기 화면에서는 HUD 숨김. DOM은 `play-hud.js`가 생성(템플릿 수정 금지), `pointer-events:none`(게임 탭을 막지 않게).

완료 기준: 390×844 첫 달리기 동안 점수·게이지·말풍선이 겹치지 않고, 탭 입력이 HUD에 막히지 않는다.

## 검증

- `python scripts/test.py` 가 통과해야 한다(기존 R103·R92 경로).
- 영역별 node 테스트 추가: `web/tests/r104-*.test.cjs`.
- 메인 세션이 통합 후 Playwright로 390×844 스크린샷·완주/충돌 시나리오를 검증한다.
