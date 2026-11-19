# 몽유 R95 · 플레이 검수판

설치 후 **‘꿈속으로’ → ‘첫 달리기 시작’**으로 들어갑니다. 기존 앱 위에 업데이트할 수 있으며 오프라인에서 플레이할 수 있습니다.

첫 연습의 반복 충돌 문제, 점수 목표와 남은 기회 표시, 기억 획득 후 다음 달리기와 최고 기록 저장을 수정했습니다. 장애물·발판·캐릭터의 대비를 다듬고 불필요한 화면 처리도 줄였습니다.

[Android APK 다운로드](https://github.com/0ssol1620-byte/mongyu/releases/download/r95-preview/MONGYU_R95_ANDROID.apk) · [검수 결과](docs/R95_QUALITY_KO.md)

```sh
python3 scripts/test.py
ANDROID_SDK_ROOT=/path/to/sdk python3 android/build-unsigned.py
```

Python 3.10+, Node.js 22+, JDK 17, Android SDK/platform/build-tools 36이 필요합니다. `scripts/test.py`는 기존 게임 검사를 실행하고 R95 오프라인 HTML·Android 자산을 만듭니다. 브라우저 확인은 Playwright·Chromium, 저장소 루트를 제공하는 4173번 서버와 `node tools/verify-r95-playable.cjs`를 사용합니다. Android 8.0 이상용 미리보기입니다.

BGM: Eric Skiff / Resistor Anthems, CC BY 4.0. 곡별 출처·편집·해시·라이선스는 앱 설정의 음악 정보와 `web/assets/music`에 포함합니다.
