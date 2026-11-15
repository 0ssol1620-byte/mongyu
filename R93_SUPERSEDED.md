> **바로 플레이하려면 [R94 수정판](https://github.com/0ssol1620-byte/mongyu/releases/tag/r94-preview)을 설치하세요.** R93은 원본 파일이 없으면 시작할 수 없는 실행기입니다. R94는 외부 파일 없이 시작하는 몽유 플레이 경로를 복구합니다.

**이 APK에는 놈3 게임 파일이 없습니다. 처음 실행할 때 보유한 KTF ZIP/JAR를 선택해야 합니다.** 원작 파일을 받을 수 있는 링크를 제공하지 않습니다. 가져온 파일과 저장은 기기 내부에만 보관합니다.

R92의 자체 그림·포즈·각색 대사·대체 녹음 대신 원본 실행 코드와 리소스를 직접 실행하는 Android 8.0 이상용 미리보기입니다. 캐릭터·장애물·배경·대사·수집·카메라·음악 데이터는 가져온 원작 파일에서 실행됩니다. 원본 240×320 비율을 보존하며 방향·확인·취소·소프트키·숫자·별표/우물정 입력을 지원합니다. 키패드를 열면 원작 화면이 가려지지 않게 공간을 확보합니다. 이전 테스트의 앱 ID·서명 인증서는 유지하며 기존 기록은 지우거나 원작 진행으로 변환하지 않습니다.

[MONGYU_R93_ANDROID.apk](https://github.com/0ssol1620-byte/mongyu/releases/download/r93-preview/MONGYU_R93_ANDROID.apk)는 설치 파일, source.zip은 현재 실행기 소스·라이선스·검사 근거·파일별 해시, SHA256SUMS.txt는 두 파일의 SHA-256입니다. 소스 ZIP에는 이전 각색 엔진·상용 게임 파일·서명 키가 없습니다.

검증: [Android Actions](https://github.com/0ssol1620-byte/mongyu/actions/runs/43718973589) 통과. 실제 시스템 파일 선택기, 원작 리소스 무변조, 음악/PCM 출력, 저장, 일시정지, 앱 복귀, APK 업데이트 후 파일·기록 유지, 렌더러 장애 복구를 확인했습니다. API 35 x86_64/WebView 124 에뮬레이터에서 R93 호스트의 합성 버전 92→93과 임시 CI 인증서를 사용한 검사입니다. 배포 APK는 검증한 unsigned 산출물 자체에 서명했으며 서명 외 16개 항목이 같습니다. 최종 서명 APK의 물리 기기 설치·청음·장시간 성능 검사는 아닙니다. 단위 검사 8개, 실제 브라우저 ZIP/JAR 실행·저장·재실행·잘못된 교체 거부·화면비 및 키 배치 검사도 통과했습니다.

**완전 동일 복구가 검증된 완성판은 아닙니다.** 원본 MMF의 음표·PCM을 실행하지만 현재 합성기는 옛 Yamaha 휴대폰 칩의 음색과 다릅니다. 설정 1배속과 달리 실제 속도 저하가 있으며, 마지막 에뮬레이터 검사 구간은 약 0.642배였습니다. 브라우저의 다른 구간에서는 약 0.7655~0.9195배가 기록됐습니다. 원작 전체 버전·통신사 서버·기기 API·모든 포즈/분기·100개 연속 수집 완주는 미확인입니다. 실제 광고·결제는 없습니다. [구현·검증·남은 차이](https://github.com/0ssol1620-byte/mongyu/blob/e4f42e529a71fe30532021cc21b6a72e256dfa9d/docs/R93_ORIGINAL_PLAYER_KO.md).

Runtime: [wie](https://github.com/Jun025/wie), pinned source `1ca15ebf5a3ebc691a680a7854e99a32e75d46f4`. Applicable MIT, Apache 2.0 and Neo둥근모 OFL notices are bundled in the APK and source archive. Original commercial game files are separate from the open-source runtime and are not distributed in this release.

