# 몽유 R95 출시 판단과 R96 테스트 후보

**판정은 Play 폐쇄 테스트 준비 단계다.** R95의 오프라인 시작, 첫 달리기, 게임 저장, 업데이트, 앱 복귀는 자동 입력과 Android 에뮬레이터에서 검증했다. 이 검사로 재미, 재방문율, 유료 상품 수요나 상위권 품질을 비교할 수 없다. 비교할 시장은 일단 한국 Google Play 아케이드로 가정한다. 이 시장의 무료 인기 순위와 매출 순위는 별개이며, 제한 테스트 성과도 순위를 보장하지 않는다.

[몽유 R95 검수 기록](R95_QUALITY_KO.md)

## 상용 게임과의 차이

| 항목 | 공개 비교 기준 | 몽유 R95에서 확인한 점과 부족한 근거 |
| --- | --- | --- |
| 즉시 이해되는 조작과 연습 | Geometry Dash Lite는 조작 숙달을 위한 연습 모드를 제공한다. | 첫 달리기에서 입력과 충돌 후 진행을 검증했다. 입력 0회, 점프 0회인 실제 R95 실행에서도 기억을 얻었다. R96 테스트 후보에서는 첫 달리기 기억 획득 전에 점프가 필요하도록 바꿨다. 브라우저에서 무입력 종료 후 재도전하고 터치로 12회 점프해 다음 기억으로 진행한 사실을 확인했다. |
| 오래 이어지는 반복 플레이 | Alto’s Odyssey는 콤보와 목표를 이어가는 구조에 휴식용 Zen Mode를 제공한다. | 기억·목표·기록·옷장이 있다. 각 요소가 자발적 재도전을 만드는지, 이야기와 액션의 리듬이 후반까지 유지되는지 측정하지 못했다. |
| 안정적인 모바일 입력과 화면 | Play의 Slow Sessions는 시스템에서 표시된 프레임을 집계한다. | CPU를 제한한 Chromium에서 R95의 프레임 간격 95백분위가 34.8ms였다. 실제 Android 실기기와 60fps 목표 달성 여부는 이 값으로 판단할 수 없다. |
| 구매 가치 | 비교 게임의 상점 설명은 상품 제공 여부만 알려준다. | 현재 직접 측정한 순매출·광고 단가·전환율·획득비가 없다. R95의 광고와 실제 결제는 비활성이다. |

비교 게임은 조작과 분위기가 가까운 참고 사례다. 공개 설명을 확인했으며 실제 게임끼리 블라인드 시연을 하지는 않았다. [Geometry Dash Lite](https://play.google.com/store/apps/details?id=com.robtopx.geometryjumplite) · [Alto’s Odyssey](https://play.google.com/store/apps/details?id=com.noodlecake.altosodyssey) · [Android Slow Sessions](https://developer.android.com/games/optimize/vitals/slow-session)

## 한 번에 확인할 출시 기준

| 지표 | 집계 방식 | 판단 기준 |
| --- | --- | --- |
| 첫 세션에서 실제 점프 후 다음 달리기 진입 | 새 설치 후 첫 세션에 실제 점프가 발생하고 세 번째 기억의 달리기를 시작한 순 이용자 ÷ 신규 첫 실행 순 이용자. 5분 안에 진입했는지도 집계한다. | 설명 없이 처음 플레이하는 참가자 20~30명에게 막힌 위치와 이유를 먼저 관찰한다. 그 결과로 목표를 확정한다. 자동 완주나 스크립트 입력은 집계에서 제외한다. |
| 7일차 재방문율 | 최초 실행일로부터 한국 현지 달력 기준 7일째에 실제 달리기를 한 순 이용자 ÷ 해당 날짜까지 관찰이 끝난 신규 코호트. 1일차도 같은 방식으로 진단한다. | 높은 목표로 D1 40%, D7 12%를 사용한다. GameAnalytics의 2025년 전 세계 모바일 표본에서 D1 약 40%, D7 약 11~12%가 상위 10% 경계였다는 점을 참고했다. 한국 Android 아케이드의 보장치로 해석하지 않는다. |
| 설치당 90일 공헌이익 | 해당 코호트의 90일 구매 정산액 + 광고 실수령액 − 환불·가변 운영비·해당 코호트 유료 획득비를 전체 신규 설치 수로 나눈다. 정산액에 이미 반영된 차감은 두 번 빼지 않는다. 채널별로 따로 본다. | 여러 유료 코호트에서 고정비 회수에 기여하는 금액이 양수이고, 보수적 추정에서도 90일 안에 획득비를 회수하기 전에는 광고비를 확대하지 않는다. |

두 개의 서로 다른 주차 코호트와 보급형·중급·고급 실제 기기를 포함한다. 500명에서 D7 12%가 관측돼도 단순 95% 구간의 반폭은 약 2.8%p 수준이다. 표본 수와 구간을 함께 적는다. 유료와 자연 유입, 빌드 버전, 기기 등급을 기록한다. 실제 참가자를 관찰하는 첫 검증은 자동 입력 검사와 다르게 해석한다. Play Console의 사용자 인지 충돌 1.09%, ANR 0.47%는 전체 모델 대상의 불량 기준이다. 실제 기기의 프레임 지연, 충돌과 ANR이 주요 안전 지표다. [GameAnalytics 2026 벤치마크](https://www.gameanalytics.com/reports/2026-mobile-pc-gaming-benchmarks) · [Google Play Android vitals](https://support.google.com/googleplay/android-developer/answer/9844486)

먼저 광고 없이 튜토리얼과 재도전을 본다. 첫 5분에 점프 성공 후 다음 기억을 고르는 이유를 한 문장으로 설명할 수 있는지 확인한다. 그다음 옷장에서 선택할 수 있는 일회 구매 의상과 독립된 추가 챕터를 비교한다. 선택형 광고는 별도 소규모 실험에서 구매·재방문에 미치는 영향을 함께 확인한다. 게임 중 끊김과 실패 직후 강제 광고는 이 설계에 넣지 않는다. 초기 테스트에는 `첫 실행`, `실제 점프`, `다음 달리기 진입`, `달리기 재시작`, `다음 날/7일째 달리기`의 정의를 미리 고정한다. 현재 빌드에는 운영 분석 전송이 없다. R95에서 재현한 무입력 획득 결과는 [재현 기록](../evidence/r95-first-run-no-action.json)에 남겼다.

## 손익 시험 계산

유료 설치 10,000건과 설치당 비용 700원을 가정했다. 각 설치의 첫 90일 동안 1.5%가 6,900원 상품을 한 번 결제하고, 결제 적용 정산률 85%, 환불 3%, 설치당 실제 광고 노출 4회와 순 eCPM 6,000원, 설치당 운영비 25원을 놓았다. 가격·전환율·광고 단가·정산률 모두 시험 입력이다. 실제 세금과 수수료는 판매 국가, 계정 및 프로그램에 따라 달라진다. [Google Play 수수료](https://support.google.com/googleplay/android-developer/answer/112622)

| 계산 | 설치당 | 10,000설치 |
| --- | ---: | ---: |
| 구매 정산액 `6,900 × 1.5% × 85% × 97%` | 85.34원 | 853,358원 |
| 광고 실수령 가정 `4 × 6,000 ÷ 1,000` | 24.00원 | 240,000원 |
| 유료 획득 전 공헌이익 `구매 + 광고 − 25` | 84.34원 | 843,358원 |
| 획득비 차감 후 공헌이익 `유료 획득 전 − 700` | −615.66원 | −6,156,643원 |

이 가정에서 고정비와 추가 세금 차감 전 손익분기 CPI는 약 84원이다. CPI 700원을 고정하면 필요한 구매자 비율은 약 12.3%다. 광고를 넣어도 이 시나리오의 손익 차이는 24원/설치에 그친다. 어느 값도 몽유의 전망치로 쓰지 않는다. 첫 구매 의견과 실제 정산액 측정이 다음 투자를 판단하는 근거다.

## 준비한 Android 번들

R95에서 발견한 첫 점프 조건을 수정한 R96 HTML을 Android 테스트 후보 AAB로 패키징했다. 테스트에는 기존 미리보기 애플리케이션 ID를 쓴다. 실제 스토어 등록 전에 최종 패키지와 Play 서명으로 버전 및 업데이트 경로를 점검해야 한다. AAB에 최종 업로드 서명이 없고 Play Console에 올린 이력도 없다.

빌드에는 Android SDK 36, Build Tools 36.0.0, JDK 17 이상과 해시 고정한 Linux x86_64 도구를 사용한다. Google Maven의 [AAPT2 8.13.2-14304508 Linux 패키지](https://dl.google.com/dl/android/maven2/com/android/tools/build/aapt2/8.13.2-14304508/aapt2-8.13.2-14304508-linux.jar)에서 `aapt2`를 꺼내 실행 권한을 주고, [bundletool 1.18.3](https://github.com/google/bundletool/releases/tag/1.18.3)의 `bundletool-all-1.18.3.jar`를 사용한다.

```sh
python3 scripts/build-playable.py
python3 android/build-store-bundle.py --sdk /path/to/sdk \
  --aapt2 /path/to/aapt2 --bundletool /path/to/bundletool-all-1.18.3.jar \
  --output android/outputs/MONGYU_R96_PLAY_TEST_UNSIGNED.aab
```

`bundletool validate`와 AAB에서 만든 APK의 서명·버전·전체 HTML 해시를 검사했다. 서명 검사는 일회용 로컬 검증 키로 만든 APK에 수행했다. R95의 로컬 구조 검사는 [번들 검사 JSON](../evidence/r95-play-bundle.json)에 남겼다. 공식 경로는 [Android 명령줄 빌드](https://developer.android.com/build/building-cmdline)와 [Play 폐쇄 테스트 도움말](https://support.google.com/googleplay/android-developer/answer/9845334)을 참고했다.

R96 번들에서 생성한 비디버그 APK를 API 35 Google Play `user` 에뮬레이터에 설치했다. 실제 화면 입력으로 첫 달리기를 시작하고, 무입력 종료 시 첫 점프 연습을 표시하는 것과 재도전을 확인했다. DevTools 엔드포인트가 열리지 않았다. [Play용 Android 이미지 검사](https://github.com/0ssol1620-byte/mongyu/actions/runs/44439148492) · [R96 번들 검사 근거](../evidence/r96-play-bundle.json)

별도 설치용 APK는 R95에서 업데이트, 저장, 터치와 음악, 일시정지, 복귀 및 렌더러 복구 검사를 통과한 산출물에 기존 미리보기 키로 서명했다. 게임 검사 182개 통과, 외부 감사 도구 1개는 기존 제외다. [R96 Android 설치 검사](https://github.com/0ssol1620-byte/mongyu/actions/runs/44438717281)
