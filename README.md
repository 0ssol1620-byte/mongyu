# 몽유 · R98 테스트판

몽유는 바닥을 달리다가 벽과 천장으로 넘어가는 원터치 러너입니다. R98에서는 길의 후드와 대기 동작을 새로 그리고, 첫 코스의 일식과 발판으로 로비와 이야기 화면을 연결했습니다.

[Android APK 다운로드](https://raw.githubusercontent.com/0ssol1620-byte/mongyu/1a647ae41ef353934e41643908f4d89f438b7c47/MONGYU_R98_ANDROID.apk) · [캐릭터·음악·효과음 상세와 출처](docs/R98_PRESENTATION_AND_AUDIO_KO.md)

Android 8.0 이상에서 플레이할 수 있습니다. R97 테스트 앱 위에 설치하면 기존 기록을 이어갑니다. 처음 시작할 때는 ‘꿈속으로’를 누르세요. 이미 진행한 경우 꿈 지도에서 002 ‘접힌 빛’을 선택해 새 디자인과 음악을 확인할 수 있습니다.

```sh
python3 scripts/test.py
ANDROID_SDK_ROOT=/path/to/sdk python3 android/build-unsigned.py
```

Python 3.10+, Node.js 22+, JDK 17, Android SDK/platform/build-tools 36을 사용합니다. 저장소 루트를 4173번 포트에서 제공한 뒤 Playwright와 Chromium으로 `node tools/verify-r98-art.cjs`를 실행하면 브라우저에서 대기 동작, 대사, 오디오와 첫 코스의 진행을 확인할 수 있습니다.

음악은 Kevin MacLeod와 Eric Skiff의 CC BY 4.0 곡을, 효과음은 Kenney의 CC0 1.0 샘플을 사용합니다. 각 파일의 출처와 편집 내역은 설정의 출처 안내와 자산 목록에 있습니다.
