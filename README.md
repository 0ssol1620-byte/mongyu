# 몽유 · MONGYU R31

사각 세계를 달리는 오프라인 게임 프로토타입의 정리된 개발 스냅샷입니다. 게임 코드는 기존 R31 그대로이며, 저장소용 경로·빌드 출력명·선별 테스트 및 문서만 정리했습니다.

## 웹 실행과 빌드

`web/MONGYU_R31.html`을 브라우저에서 열면 됩니다. 이미지가 포함된 단일 HTML이며 서버나 npm 패키지는 필요 없습니다.

```sh
python3 web/build.py
python3 scripts/verify-snapshot.py
python3 scripts/test.py
```

Python 3 및 Node.js 18 이상이 필요합니다. Git 체크아웃은 `.gitattributes`에 따라 텍스트 LF를 유지합니다. 웹 빌드는 UTF-8 입력과 바이트 출력으로 플랫폼별 줄바꿈 변환을 방지합니다. 이번 검증 환경은 Python 3.12.14 / Node.js 24.22.1입니다. `build.py`는 로컬 이미지 해시를 검사하고 소스와 템플릿을 단일 HTML로 묶습니다. 게임 내부의 과거 버전 표기 `r12.0.0`은 그대로이며 R31의 식별 기준은 [파일 해시](evidence/runtime-sha256.json)입니다.

Windows의 이전 빌드에서 CRLF 출력으로 해시 검증이 실패한 문제를 수정했습니다. 수정본 커밋 `d2d5d591917663d112ade8c3eabffb1e09ca4e89`은 **실제 Windows에서도 재검증 통과**했습니다: Python 3.12.13 / Node.js 22.14.0, 기본 cp949·UTF-8 모드 꺼짐에서 해시 검사와 전체 선별 runner가 통과했습니다. 이는 빌드·Node 검사이며 브라우저·Android 기기 검증은 아닙니다.

## Android 소스

`android/`는 기존 R12 Java WebView 래퍼에 **동일한 R31 HTML**을 포함합니다. `versionCode=7`, `versionName=0.31.0-preview-debug`입니다. Java 코드를 바꾼 버전이나 R16 소스 복원본이 아닙니다.

이미 설치된 OpenJDK 21, Android SDK platform 36 / build-tools 36.0.0과 Python 3가 필요합니다. SDK·JDK·Gradle·서명키는 포함하거나 자동 다운로드하지 않습니다.

```sh
export ANDROID_SDK_ROOT=/path/to/your/android-sdk
python3 android/build-unsigned.py
python3 android/verify-apk.py
```

생성물은 **서명되지 않은 검증용 APK이며 설치할 수 없습니다.** `verify-apk.py`는 서명하지 않고 `apksigner verify`의 예상된 unsigned 실패, ZIP/정렬, manifest/DEX와 내장 HTML을 검사합니다. APK·중간 빌드·로그는 Git 대상에서 제외됩니다. 서명·설치·배포 작업은 이 저장소의 범위가 아닙니다.

## 테스트와 검증 범위

- 웹 선별 테스트 **49/49**, 같은 R31 결말 테스트의 실제 인라인 HTML 재실행 **14/14**, Android 소스/HTML VM 계약 **38/38** 통과.
- 인라인 재실행 14개는 웹 49개 중 R31 사례를 다른 입력으로 다시 실행한 것이며 별개의 기능 14개를 뜻하지 않습니다.
- 과거 전체 회귀 **749 TAP 테스트 + 66 custom cases**는 이 저장소에서 새로 재실행한 결과가 아닙니다. 전체 역사·기준본·Canvas 감사 아카이브는 의도적으로 포함하지 않았습니다. [증거와 한계](docs/VALIDATION.md)를 확인하세요.
- 실제 브라우저/Android WebView·터치·IME·센서·오디오·스크린리더·기기 저장 유지·업데이트 서명 연속성은 검증하지 않았습니다. Node VM 통과가 기기 동작이나 재미의 증명이 아닙니다.

## 구성

- `web/src`, `web/assets`, `web/index.template.html`: 원본 R31 게임 코드·필수 이미지·템플릿
- `web/tests`, `android/tests`: 필요한 모든 로컬 의존성을 포함하는 선별 자동 검사
- `android/app`: Android 래퍼와 정확한 웹 자산
- `docs`: [아트 방향](docs/ART_DIRECTION.md), [R31 동작](docs/R31_BEHAVIOR.md), [검증 설명](docs/VALIDATION.md)
- `evidence`: 원본과 현재 검증을 구분한 요약 및 파일 해시

배포 설정이나 GitHub Actions 워크플로는 없습니다. 원작 게임 바이너리·고객 자료·비밀키·SDK·개인 전송 도구·과거 QA 그림 묶음은 포함하지 않았습니다. 오픈소스 라이선스 또는 상업 사용 권한을 새로 부여하는 스냅샷이 아닙니다.
