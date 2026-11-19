# 몽유 · R101

몽유는 바닥을 달리다가 벽과 천장으로 넘어가는 원터치 러너입니다. R101의 꿈 지도에서는 빛이 이어지는 길을 따라 기억을 고릅니다. 금빛 표식은 다음 기억, 체크는 수집한 기억, 자물쇠는 잠긴 기억을 나타냅니다.

[Safari에서 플레이](https://0ssol1620-byte.github.io/mongyu/?v=101) · [Android APK 다운로드](https://raw.githubusercontent.com/0ssol1620-byte/mongyu/3c650dc2729091cd28e6d04f8c006a8ecfb47e8b/MONGYU_R101_ANDROID.apk) · [모바일 게임 화면 연구](docs/R101_MOBILE_GAME_UI_KO.md) · [캐릭터·음악·효과음 상세와 출처](docs/R98_PRESENTATION_AND_AUDIO_KO.md)

iPhone에서는 Safari로 링크를 열고 ‘꿈속으로’를 누르세요. 공유 메뉴에서 ‘홈 화면에 추가’를 선택하면 홈 화면에 아이콘을 만들 수 있습니다. 웹의 진행 기록은 접속한 주소의 브라우저 저장소에 남습니다. Android 8.0 이상의 R100 테스트 앱은 R101으로 업데이트할 수 있습니다.

```sh
python3 scripts/test.py
ANDROID_SDK_ROOT=/path/to/sdk python3 android/build-unsigned.py
python3 scripts/build-pages.py /path/to/pages-output
```

Python 3.10+, Node.js 22+, JDK 17, Android SDK/platform/build-tools 36을 사용합니다. GitHub Pages는 `gh-pages` 브랜치의 루트에서 배포합니다. [iPhone 크기 WebKit 검사](evidence/r101-webkit.json) · [공개 페이지 검증](evidence/r101-web-release.json)

음악은 Kevin MacLeod와 Eric Skiff의 CC BY 4.0 곡을, 효과음은 Kenney의 CC0 1.0 샘플을 사용합니다. 각 파일의 출처와 편집 내역은 설정의 출처 안내와 자산 목록에 있습니다.
