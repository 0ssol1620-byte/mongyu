# 몽유 · R97 테스트판

**‘꿈속으로’ → ‘첫 달리기 시작’**을 누르면 파일 선택 없이 플레이할 수 있습니다. 첫 코스 ‘접힌 빛’에서는 달리는 동안 화면을 눌러 바닥, 벽, 천장의 장애물을 넘고 빛 여섯 개를 모읍니다. 충돌한 구간부터 연습하거나 바로 다시 달릴 수 있습니다.

[R97 Android 테스트 APK](https://raw.githubusercontent.com/0ssol1620-byte/mongyu/1aa0ccb7f8619e7f7bcd35bcb64995639341e6da/MONGYU_R97_ANDROID.apk) · [플레이 연구와 적용 기준](docs/MONGYU_PLAY_RESEARCH_KO.md) · [출시·손익 판단 기준](docs/R95_PLAY_STORE_READINESS_KO.md)

Android 8.0 이상에서 오프라인으로 플레이할 수 있습니다. 기존 몽유 테스트 앱 위에 업데이트할 수 있습니다. 이미 다음 기억까지 진행했다면 꿈 지도에서 002 ‘접힌 빛’을 선택하세요.

```sh
python3 scripts/test.py
ANDROID_SDK_ROOT=/path/to/sdk python3 android/build-unsigned.py
```

Python 3.10+, Node.js 22+, JDK 17, Android SDK/platform/build-tools 36이 필요합니다. `scripts/test.py`는 게임 검사를 실행하고 R97 오프라인 HTML과 Android 자산을 만듭니다. 터치 흐름을 확인하려면 저장소 루트를 4173번 포트에서 제공한 뒤 Playwright와 Chromium으로 `node tools/verify-r97-opening.cjs`를 실행합니다.

음악은 Eric Skiff의 Resistor Anthems(CC BY 4.0)를 사용합니다. 곡별 출처와 편집 내역은 앱 설정의 음악 정보와 `web/assets/music`에 있습니다.
