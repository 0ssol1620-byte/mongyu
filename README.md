# 몽유 · MONGYU R89

[Android APK 다운로드](https://github.com/0ssol1620-byte/mongyu/releases/download/r89-preview/MONGYU_R89_ANDROID.apk) · [소스와 변경 기록](https://github.com/0ssol1620-byte/mongyu/releases/tag/r89-preview)

100개 기억을 모으는 오프라인 게임의 개발 빌드입니다. R89는 도형처럼 보이던 관절을 연결된 인물 실루엣으로 다시 그리고, 팔·다리의 달리기와 점프 자세, 개와 이야기 장면의 미술을 정리했습니다. 맵 구조에 맞는 10곡과 보스별 4곡을 자체 편곡했고, 변형 중 음악 유지와 곡 전환을 연결했습니다. 화면비에 맞는 구도와 배경 깊이층도 조정했습니다.

[리서치·기획과 실제 적용](docs/R89_ART_SOUND_RESEARCH_KO.md) · [전후 이미지·검사 범위·성능](docs/R89_VALIDATION_KO.md)

```sh
python3 web/build.py
python3 scripts/test.py
python3 scripts/prepare-android-r80.py
node --test android/tests/r82-wrapper.test.cjs
```

Python 3.10+와 Node.js 18+가 필요합니다. web/MONGYU_R89.html은 오프라인 단일 HTML입니다. 브라우저 검사는 Playwright와 Chromium을 별도로 사용하며 Android 빌드는 SDK 36/JDK 환경을 사용합니다.

웹 168개 중 167개 통과·외부 어댑터 1개 제외, 실패 0개. 74개 격리 진입의 접지·코너 자세 2,232개에서 실제 다리 채움 픽셀의 검사한 깊은 관통 0개. 가속 Android 15 / WebView 124에서 설치·입력·전체 화면·중단 복귀·업데이트 저장·렌더러 복구 및 15개 실제 Canvas 장면 검사도 통과했습니다. [공개 검사](https://github.com/0ssol1620-byte/mongyu/actions/runs/43688251721).

APK는 몽유 R89 테스트이며 org.quadrift.mongyu.preview.r82 ID와 기존 인증서를 사용합니다. 기존 R82~R88을 삭제하지 않고 업데이트할 수 있습니다. 최소 Android 8.0이며 최신 System WebView가 필요합니다. 서명 정보는 evidence/r89-signed-apk.json에 남기며 비밀키를 소스에 포함하지 않습니다. 배포 파일은 Android 검사에 통과한 unsigned 페이로드에 기존 인증서로 서명했습니다. 같은 코드로 만든 두 QA 버전의 업데이트 검사와 최종 서명 APK 자체의 실기기 설치는 구분합니다.

긴 프레임과 실기기 장시간 성능·청음 검수, 원작 전체 미디어·모든 동작의 일치와 100개 연속 완주는 남아 있습니다. 원작 복원 완료를 주장하지 않습니다. [원작 콘텐츠별 조사와 남은 범위](docs/R87_ORIGINAL_RESEARCH_KO.md).

음원은 몽유용 자체 제작 15곡입니다. 실제 결제·광고는 비활성입니다. 수익 모델과 출시 운영 계획은 docs/R81_RELEASE_REVIEW_KO.md에 있으며 과거 문서와 evidence는 버전별 기록으로 보존합니다.
