# 몽유 · 원작 파일 실행 R93

R93은 R92의 각색 엔진을 APK에서 제외하고, 사용자가 보유한 놈3 KTF ZIP/JAR의 실행 코드·그림·애니메이션·음악·대사·수집 규칙을 직접 실행하는 오프라인 플레이어입니다.

**상용 원작 파일은 APK에 포함하지 않습니다. 처음 실행할 때 보유한 원본 파일을 한 번 선택해야 합니다.** 파일과 원본 저장은 이 기기에만 보관합니다. 원작이 들어 있는 별도 다운로드 링크를 제공하는 앱이 아닙니다.

[Android APK](https://github.com/0ssol1620-byte/mongyu/releases/download/r93-preview/MONGYU_R93_ANDROID.apk) · [원작 실행 방식·검증·한계](docs/R93_ORIGINAL_PLAYER_KO.md)

원본 화면비·설정 1배속을 유지하며 탭은 OK 입력입니다. 아래 취소·방향·확인·숫자·별표/우물정 키로 원작 메뉴와 수집판을 조작합니다. 일시정지·앱 전환 시 입력과 오디오를 중단하며 명시적으로 재개합니다. 원본 코드가 만든 저장은 원본 파일별로 보관합니다. 예전 몽유 기록은 삭제하거나 원작 수집 진행으로 바꾸지 않습니다.

```sh
python3 scripts/test.py
ANDROID_SDK_ROOT=/path/to/sdk python3 android/build-unsigned.py
# 별도로 보유한 원작 자료로 실제 브라우저 검증
node tools/verify-original-browser.cjs /private/path/to/original.zip
```

Python 3.10+, Node.js 22, Android SDK 36/JDK 17이 필요합니다. 브라우저 검사는 Playwright·Chromium과 저장소 루트를 제공하는 4173번 로컬 서버를 사용합니다. 이전 각색 엔진 검사는 `python3 scripts/test-legacy-r92.py`로 남깁니다. APK 자산은 `web/original`에서 생성하며 상용 게임 자료를 저장소나 빌드에 넣지 않습니다.

Android 8.0 이상용이며 기존 테스트의 앱 ID·인증서를 유지합니다. Android 에뮬레이터에서 불러오기·음악/효과음·저장·업데이트 후 기록 유지·렌더러 복구 검사를 통과했습니다. 설정은 1배속이지만 마지막 에뮬레이터 구간의 달성 속도는 약 0.642배로, 실기 속도나 끊김 해결을 보장하지 않습니다. 원작의 모든 버전·기기 기능·옛 통신사 서비스와의 동일 동작, 100개 수집 연속 완주, 옛 휴대폰과 동일한 Yamaha 음색·실기 장시간 성능은 확인이 필요합니다. 원본 코드를 실행한다는 이유로 이 검증까지 완료했다고 주장하지 않습니다. 실제 광고·결제는 없습니다.
