# 몽유 · R103

몽유는 바닥을 달리다가 벽과 천장으로 넘어가는 원터치 러너입니다. R103은 네 방향 벽 접합부를 다듬고, 달리기 결과를 화면 상단과 재시도 표식으로 표시합니다. 꿈 지도에서는 길 위의 금빛 표식으로 다음 기억을 고를 수 있습니다.

[Safari에서 플레이](https://0ssol1620-byte.github.io/mongyu/?v=103) · [Android APK 다운로드](https://raw.githubusercontent.com/0ssol1620-byte/mongyu/b7779f59851153741e0202f4cc8188798f6db9b4/MONGYU_R103_ANDROID.apk) · [플레이 화면 검수](docs/R103_PLAY_UI_AUDIT_KO.md) · [캐릭터·음악·효과음 상세와 출처](docs/R98_PRESENTATION_AND_AUDIO_KO.md)

iPhone에서는 Safari로 링크를 열고 ‘꿈속으로’를 누르세요. 공유 메뉴에서 ‘홈 화면에 추가’를 선택하면 홈 화면에 아이콘을 만들 수 있습니다. 웹의 진행 기록은 접속한 주소의 브라우저 저장소에 남습니다. Android 8.0 이상의 R102 테스트 앱은 R103으로 업데이트할 수 있습니다.

## R104 미리보기 (`work/r104-phase1`)

[R104 플레이](https://0ssol1620-byte.github.io/mongyu/r104/) · [기획서](docs/MONGYU_NOM3_MV_PLAN_KO.html) · [기획서 대조표](docs/R104_COMPLETION_KO.md)

놈3의 회전 러닝과 Monument Valley의 착시 건축을 섞은 기획서를 R104에 구현했습니다. 새 캐릭터와 포즈, 입체 블록 코스와 챕터 10개 밤하늘 팔레트, 충돌·오로라 골인·포스터 컷 연출, 큰 점수·하단 게이지·말풍선 HUD, 결과 화면 별 3개, 구간 재시작, 4층 적응형 음악, 무한 꿈·오늘의 도전·착시 정원 모드, 포스터·영상 저장, 색약 모드가 들어 있습니다.

```sh
python3 web/build.py --release R104
python3 -m http.server 4173 --bind 127.0.0.1 --directory web
# http://127.0.0.1:4173/MONGYU_R104.html
```

## 함께 개발하기

공동 작업의 기준 브랜치는 `main`입니다. 저장소 소유자가 GitHub의 **Settings → Collaborators → Add people**에서 상대 GitHub 아이디를 초대합니다. 상대가 수락하면 같은 저장소에서 작업 브랜치를 만들고 올릴 수 있습니다. [공동 작업자 설정](https://github.com/0ssol1620-byte/mongyu/settings/access)

```sh
git clone https://github.com/0ssol1620-byte/mongyu.git
cd mongyu
git switch -c work/change-name
```

한 가지 변경을 작업 브랜치에 커밋한 뒤 GitHub에서 `main` 대상의 Pull Request를 열면 서로 수정 내용을 확인할 수 있습니다. 게임 코드는 `web/src/`에, 화면 스타일은 `web/mobile.css`에, Android 앱 코드는 `android/app/`에 있습니다. 코드가 바뀐 Pull Request에서 GitHub Actions가 게임 소스 검사를 실행합니다. 공개 플레이 페이지는 별도 `gh-pages` 브랜치에서 배포합니다.

Python 3.10 이상에서 웹 빌드를 만들어 브라우저로 바로 테스트할 수 있습니다. [로컬 플레이 주소](http://127.0.0.1:4173/MONGYU_R103.html)

```sh
python3 web/build.py --release R103
python3 -m http.server 4173 --bind 127.0.0.1 --directory web
```

## 빌드와 검사

```sh
python3 scripts/test.py
ANDROID_SDK_ROOT=/path/to/sdk python3 android/build-unsigned.py
python3 scripts/build-pages.py /path/to/pages-output
```

Python 3.10+, Node.js 22+, JDK 17, Android SDK/platform/build-tools 36을 사용합니다. GitHub Pages는 `gh-pages` 브랜치의 루트에서 배포합니다. [iPhone 크기 WebKit 검사](evidence/r103-webkit.json) · [공개 페이지 검증](evidence/r103-web-release.json)

음악은 Kevin MacLeod와 Eric Skiff의 CC BY 4.0 곡을, 효과음은 Kenney의 CC0 1.0 샘플을 사용합니다. 각 파일의 출처와 편집 내역은 설정의 출처 안내와 자산 목록에 있습니다.
