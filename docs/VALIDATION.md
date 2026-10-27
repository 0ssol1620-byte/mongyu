# 검증 증거와 재현 범위

## 이 스냅샷에서 새로 실행한 검사

`python3 scripts/test.py`:

1. 웹 빌드: Python 표준 라이브러리만으로 단일 HTML 재생성.
2. `scripts/verify-snapshot.py`: 검토된 런타임 파일 해시와 웹/Android HTML 바이트 동일성 확인.
3. 웹 선별 테스트 49개: 엔진 튜토리얼·정지, tilt 및 권한, 낮·밤 물리, R31 결말 사실/초기화.
4. R31 결말 14개를 실제 단일 HTML 대상으로 재실행. 49개에 포함된 사례의 재실행입니다.
5. Android 소스/HTML 계약 38개: 세 곁길, R30 키 취소와 명시적 재활성화, R31 결말, 저장·tilt·오디오·native lifecycle 표현.

모두 통과했으며 skipped/cancelled/fail은 0입니다. DOM·Canvas·Audio·센서 stub과 Node VM을 사용합니다. `evidence/portable-checks.json`은 이 실행의 요약입니다.

외부에 이미 설치된 OpenJDK 21 및 Android platform 36/build-tools 36.0.0으로 별도 임시 작업 복사본을 새로 빌드·검증했습니다. 668073바이트 unsigned APK의 SHA-256은 과거 검토본과 동일합니다. `evidence/android-build-verification.json`은 로컬 경로를 상대 경로로 정리한 실제 검증 결과입니다. 서명 검증 실패는 unsigned라는 예상 결과이며 설치 가능 판정이 아닙니다. 생성 APK/DEX/로그/SDK는 저장소에 포함하지 않았습니다.

## 역사적 증거와 구분

원래 R31 최종 검증 기록의 SHA-256:
`ed20a2c86c7629604df310dc870c361e4d3d9608a29afc63f3625a2b293c8b60`

그 기록은 sourceStable=true, 전체 749 TAP 테스트 및 66 custom cases를 보고합니다. `evidence/historical-summary.json`은 원 기록에서 가져온 요약이며 이 스냅샷의 신규 전체 검사 결과가 아닙니다. 역사적 baseline/retargeting/Canvas 도구와 그림은 포함하지 않았으므로 이 저장소만으로 749개 전체 감사를 재현할 수는 없습니다.

원본 runtime src·템플릿·이미지·Java·manifest는 바이트 그대로입니다. 웹 빌드의 출력명만 `MONGYU_R31.html`로 정리했고, R31 테스트의 host 경로 및 host의 HTML 이름을 조정했으며 사용하지 않는 역사적 baseline 분기를 제거했습니다. 선별된 나머지 테스트의 검증 조건은 바꾸지 않았습니다.

## 남은 한계

- 실제 브라우저 기본 이벤트 순서, 화면/접근성 합성, 터치·IME·오디오·센서·기기 성능 미검증.
- Android WebView의 비동기 evaluateJavascript와 timer pause 순서 미검증.
- 설치·업데이트·서명 연속성·프로세스 종료 후 저장 유지·R16 소스 계보 미검증.
- 시각 방향 문서는 디자인 의도이며 새 픽셀 검수나 사용자 재미 평가가 아닙니다.
- 저장소는 자동 배포·서명·외부 업로드를 수행하지 않습니다.
