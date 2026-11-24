# R105 인수인계 (2026-11-24)

다음 세션이 이어서 작업할 수 있도록 현재 상태, 구조, 남은 일을 정리한다. 기준 문서는 `NOM3_Final_Master_Blueprint_v2.0.md`(루트)와 `docs/R105_BLUEPRINT_APPLY_KO.md`.

## 1. 지금 무엇이 되어 있나
| 영역 | 상태 | 위치 |
| --- | --- | --- |
| 주인공 | 얼굴 없는 검은 실루엣(포즈 8 + 달리기 4프레임), 어두운 배경에서 따뜻한 윤곽. 기존 잠옷 아이는 스킨 `dream` | `web/src/character-art.js`, `web/assets/art/sil-*`, `pose-*`, `run-*` |
| 로비 | 어두운 환각(보라·마젠타), 달항아리·만다라·눈 깜빡임 | `web/src/lobby-scene.js`, `web/assets/art/lobby-trip` |
| 챕터 1~10 | 코스 50개(c1–c50). 챕터 1~5 마지막 코스는 보스 5종, 6~10 마지막은 보스 자리표시 | `web/src/chapters.js`, `course-run.js` |
| act 종류 | floor-wall, bridge, helix-up/down, penrose, align, square, flip, mirror, wait, eye, liquid, rhythm, boss | `web/src/*-act.js`, `opening-run.js`, `illusion-course.js`, `helix-act.js`, `penrose-act.js`, `boss-act.js` |
| 색감 | 하이브리드. 챕터 1~7·9·10 밝은 팔레트(`c1`…), 챕터 8·로비·피버는 어두운 환각(`violet/aqua/ember/toxic/heart`, `c8`, `c9`) | `web/src/trip-palettes.js`, `psy-layer.js` |
| 음악 | Suno 곡 19곡(10챕터, 타이틀, 피버, 보스 5, 스토리, 메뉴) + 합성 반응 레이어 + 효과음 6개 | `web/assets/audio/`, `adaptive-music.js`, `game-sfx.js`, `tools/audio-pipeline.py` |
| 유머 | 데이터 기반 대사 엔진(97줄), 실패 단계 대사 | `web/src/humor-bank.js`, `humor-director.js` |
| 접근성 | 효과 강도 Standard/Reduced/Minimal, 첫 실행 선택, 글자 크기 | `web/src/effects-profile.js` |
| 갤러리 | 꿈의 섬(기억판), 고스트(최고 기록 위치 점) | `web/src/dream-isle.js`, `ghost-run.js` |
| 한/영 | 전 화면 ko/en | `web/src/i18n-en-*.js` |

## 2. 빌드·테스트·실행
```sh
python web/build.py --release R105          # 단일 HTML (약 38 MB)
python scripts/test.py                        # 전체 (끝나면 android/expected-* 되돌리기: git checkout android/expected-*)
node --test web/tests/r105-*.test.cjs        # R105 테스트만
python -m http.server 4173 --bind 127.0.0.1 --directory web   # web/MONGYU_R105.html
```
- R103/R104 빌드는 바뀌면 안 된다(모든 R105 기능은 `MONGYU_UI_EDITION`/`data-ui-edition`으로 감싼다).
- 타이밍에 민감한 테스트 2개(`r105-music-engine`, `r105-psy-layer` 'layer cost')는 기기 부하가 크면 실패할 수 있다. 단독 실행하면 통과한다.
- 자동 플레이(QA): `tools/qa/roadplay.mjs`(Playwright; 포트와 크롬 경로는 파일 상단에서 설정). 모든 코스 클리어 확인에 쓴다.

## 3. 에셋 파이프라인
- 이미지: Codex CLI `codex exec --skip-git-repo-check -s workspace-write -C . --json -o out.txt "<프롬프트>"`(출력은 `~/.codex/generated_images/`). `python tools/art-pipeline.py bg|grid|cut ...`로 `web/assets/art/`에 WebP 생성. 규칙은 `docs/R105_TRIP_ART_KO.md`. 시안 원본은 `art-concepts/`.
- 음악: Suno MCP(`suno`, 사용자 계정, 상업 이용 가능하다고 사용자가 확인). 원본 `audio-in/` → `python tools/audio-pipeline.py` → `web/assets/audio/*.mp3`+`manifest.json`.
- 상업 이용 근거와 AI 생성물 출처는 스토어 제출 때 라이선스 원장에 기록(§31).

## 4. 아직 안 된 것 (우선순위 순)
1. **챕터 6~10 배경 이미지**: `chapter-6`…`chapter-10`이 없어 어두운 `trip-*` 이미지나 `chapter-1`로 대체 표시 중. 블루프린트 §7.2 팔레트(c6 `#D6B9CF` 극장, c7 `#B2C9C9` 액체, c8 어두운 팝아트, c9 `#141525` 공허, c10 `#F4EBDD` 열린 틀)로 생성.
2. **보스 B06–B10**: 챕터 6~10 마지막 코스는 자리표시(`bossPlaceholder`). `web/src/boss-act.js` 구조를 따라 5종 구현(관찰자·액체 왕·지휘자·공허·열린 틀, 블루프린트 §5.1). 곡 `boss*.mp3`는 1~5만 있음.
3. **보스 연출**: 웃긴 행동(FX22) 소품, 보스 실루엣 아트 고급화(`drawSilhouette`, `drawBoss`).
4. **용량**: 단일 HTML 약 38 MB. 곡을 필요할 때 불러오는 방식으로 줄이는 방안 검토.
5. **밝은 팔레트 마감**: `square-act.js` 방 채움(무거운 회색), helix/penrose 길 가장자리 윤곽, `items.js`의 모래시계·깃털·별 스프라이트(밝은 배경용), 320×568 act 접점 시트.
6. **효과 강도 연결 누락**: mirror/flip/wait 맥동, penrose·illusion·endless·opening·square 카메라의 채널별 줌, `items.js` 오라의 피버 훅(`effects-profile` 보고서 참조).
7. **유머**: 보스 이벤트(`boss-reveal/phase/clear`)에 반응하는 대사, 본 대사 일지(꿈의 섬 '꿈 일기' 탭).
8. **음악**: 키 추정이 약한 곡(boss2, boss4, c8)의 합성 반응음 음정 점검, 보스 도중 포기 시 `setContext` 해제, `unlock`/`discovery` 효과음을 내보내는 이벤트 연결.
9. **스킨**: 13종(블루프린트 목표 100). 계열 10 × 10 중 Classic·Dream 틀만.
10. **스테이지**: 50개(블루프린트 100). 블루프린트는 G3(챕터 1 전체 10스테이지+보스) 통과 후 양산을 권한다.
11. **스토어**: Google Play 유료(2,200원)와 토스 앱인토스(무료+광고) 제출은 게임 완성 후. 문서 `docs/R105_RESEARCH_PLAN_KO.md`.

## 5. 사람이 확인해야 하는 것 (에이전트가 할 수 없음)
- BGM·효과음 청감(이음새, 키 어긋남, 피로감), 보스·새 act의 재미와 난이도, 챕터 3(120 BPM) 난이도.
- 실기기 프레임/입력 지연/발열, 광과민성 전문 도구 검사, 플레이테스트(E01–E20).
- Suno·Codex 생성물의 스토어 정책(AI 생성물 고지) 확인.

## 6. 배포
- `main`과 `gh-pages` 루트(R103)는 건드리지 않는다. 플레이 링크는 `gh-pages`의 `rNNN/index.html`만 추가한다: https://0ssol1620-byte.github.io/mongyu/r105/
- 작업 브랜치: `work/r105-content`.

## 7. 에이전트 작업 방식 메모
- 병렬 작업은 worktree 격리 + 담당 파일 분리. 병합 충돌은 대부분 `web/sources.json`(두 쪽 줄 모두 유지)과 `course-run.js`.
- 합친 뒤에는 R105 테스트 전체와 자동 플레이를 다시 돌린다. 테스트가 코스 수나 보스 위치를 가정하는 곳(챕터·보스·효과 테스트)이 많으니 챕터를 추가하면 같이 고친다.
