# 몽유 R94 · 설치 후 플레이

R94는 원본 파일 선택을 요구하던 R93의 시작 차단을 수정합니다. **KTF ZIP/JAR 없이 설치 후 ‘꿈속으로’를 누르면 이야기와 게임을 시작할 수 있습니다.** 몽유의 자체 게임 코드·그림·이야기·사용 허가된 BGM이 APK에 들어 있으며 네트워크 연결도 필요하지 않습니다.

[Android APK 다운로드](https://github.com/0ssol1620-byte/mongyu/releases/download/r94-preview/MONGYU_R94_ANDROID.apk) · [수정 내용과 검증](docs/R94_PLAYABLE_KO.md)

기존 앱을 삭제하지 않고 업데이트하세요. 동일한 앱 ID·미리보기 인증서와 더 높은 버전 코드 94를 사용합니다. 이전 몽유 기록과 R93의 내부 파일·저장을 삭제하지 않습니다. R93 원작 실행 기록을 몽유 진행으로 변환하지 않습니다.

이 수정은 R92 기반의 독립 플레이 경로를 복구하는 작업입니다. 원작 놈3의 완전 동일 복구판이나 원작 그림·대사·음원 배포판은 아닙니다. 원본 실행기 소스와 이전 조사 기록은 저장소 이력에 남습니다. 실제 광고·결제는 없습니다.

```sh
python3 scripts/test.py
ANDROID_SDK_ROOT=/path/to/sdk python3 android/build-unsigned.py
```

Python 3.10+, Node.js 22+, JDK 17, Android SDK/platform/build-tools 36이 필요합니다. `scripts/test.py`는 기존 게임 검사를 실행하고 R94 오프라인 HTML·Android 자산을 만듭니다. 브라우저 확인은 Playwright·Chromium, 저장소 루트를 제공하는 4173번 서버와 `node tools/verify-r94-playable.cjs`를 사용합니다. Android 8.0 이상용 미리보기입니다.

BGM: Eric Skiff / Resistor Anthems, CC BY 4.0. 곡별 출처·편집·해시·라이선스는 앱 설정의 음악 정보와 `web/assets/music`에 포함합니다.
