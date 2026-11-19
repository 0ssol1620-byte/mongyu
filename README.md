# 몽유 · R99

몽유는 바닥을 달리다가 벽과 천장으로 넘어가는 원터치 러너입니다. R99는 후속 코스에서 새 길, 최고 기록, 목표 달성을 실제 문장으로 보여 줍니다.

[Safari에서 플레이](https://0ssol1620-byte.github.io/mongyu/) · [Android APK 다운로드](https://raw.githubusercontent.com/0ssol1620-byte/mongyu/aee2107c1d3844e85cd23b67a02b064e3ed23792/MONGYU_R99_ANDROID.apk) · [캐릭터·음악·효과음 상세와 출처](docs/R98_PRESENTATION_AND_AUDIO_KO.md)

iPhone에서는 Safari로 링크를 열고 ‘꿈속으로’를 누르세요. 공유 메뉴에서 ‘홈 화면에 추가’를 선택하면 홈 화면에 아이콘을 만들 수 있습니다. 웹의 진행 기록은 접속한 주소의 브라우저 저장소에 남습니다. Android 8.0 이상의 R98 테스트 앱은 R99로 업데이트할 수 있습니다.

```sh
python3 scripts/test.py
ANDROID_SDK_ROOT=/path/to/sdk python3 android/build-unsigned.py
python3 scripts/build-pages.py /path/to/pages-output
```

Python 3.10+, Node.js 22+, JDK 17, Android SDK/platform/build-tools 36을 사용합니다. GitHub Pages는 `gh-pages` 브랜치의 루트에서 배포합니다. [iPhone 크기 WebKit 검사](evidence/r99-webkit.json) · [공개 페이지 검증](evidence/r99-web-release.json)

음악은 Kevin MacLeod와 Eric Skiff의 CC BY 4.0 곡을, 효과음은 Kenney의 CC0 1.0 샘플을 사용합니다. 각 파일의 출처와 편집 내역은 설정의 출처 안내와 자산 목록에 있습니다.
