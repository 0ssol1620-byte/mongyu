# 몽유 · MONGYU R92

[Android APK 다운로드](https://github.com/0ssol1620-byte/mongyu/releases/download/r92-preview/MONGYU_R92_ANDROID.apk) · [배포 파일·소스](https://github.com/0ssol1620-byte/mongyu/releases/tag/r92-preview)

100개 기억을 모으는 오프라인 게임의 개발 빌드입니다. R92는 메인·일시정지·설정에서 과거 실험 모드로 새던 경로와 그 그림 자산을 정리합니다. 각진 캐릭터 윤곽과 팔 스윙·점프·이야기 자세, 할머니가 주인공을 업는 모습을 수정하고, 이전 합성 음악을 Eric Skiff의 CC BY 4.0 녹음곡 18개로 교체합니다.

[원작 실행 조사·수정 이유·검증 범위](docs/R92_ORIGINAL_DIRECTION_KO.md) · [음악 출처와 편집 내역](web/assets/music/MUSIC-CREDITS.txt)

```sh
python3 web/build.py
python3 scripts/test.py
python3 scripts/prepare-android-r80.py
node --test android/tests/r82-wrapper.test.cjs
node tools/verify_browser.cjs
```

Python 3.10+와 Node.js 18+가 필요합니다. `web/MONGYU_R92.html`은 오프라인 단일 HTML입니다. 브라우저 검사는 Playwright·Chromium과 4173번 로컬 서버, Android 빌드는 SDK 36/JDK 환경을 사용합니다.

Android 8.0 이상용 `몽유 R92 테스트`입니다. 기존 테스트와 앱 ID `org.quadrift.mongyu.preview.r82` 및 미리보기 인증서를 유지합니다. 기존 앱을 지우지 않고 업데이트하세요. 서명 비밀키는 소스와 배포 파일에 포함하지 않습니다. 합성 QA 버전 사이의 업데이트 검사와 최종 서명 APK 자체의 실기기 설치 검사는 구분합니다.

원작 후보를 직접 실행하고 첫 이야기·캐릭터 시트·음악 구조를 확인했지만 원작 그림·음원·대사는 배포하지 않습니다. 원작 전체 일치·100구간 연속 완주·실기기 장시간 성능과 청음 검수는 남아 있습니다. 원작 복원 완료 또는 무지연을 주장하지 않습니다. 실제 결제·광고는 비활성입니다. 과거 문서와 evidence는 버전별 기록입니다.
