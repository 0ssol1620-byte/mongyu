예전 모드 진입을 정리하고 캐릭터 표현과 BGM을 교체한 Android 테스트 버전입니다.

- 메인·일시정지·설정의 ‘다른 꿈’ 경로와 옛 연습 진입을 제거했습니다. 옛 그림 자산은 배포 HTML에 포함하지 않으며 기존 저장 데이터는 지우지 않습니다.
- 각진 독자 캐릭터 윤곽과 더 큰 앞뒤 팔 스윙, 점프의 모으기→뻗기→착지, 팔을 구부린 이야기 자세로 변경했습니다. 할머니가 주인공을 업는 모습을 실제 두 사람의 실루엣으로 표현했습니다.
- 이전 합성 BGM을 Eric Skiff / Resistor Anthems의 CC BY 4.0 녹음곡 18개로 교체했습니다. 맵 10종·보스 4종·메뉴/수집·이야기 세 역할을 구분하고 게임 설정에 곡명·출처·편집 내역을 표시합니다.

**MONGYU_R92_ANDROID.apk**가 Android 8.0 이상용 설치 파일입니다. 기존 R82~R91 테스트와 앱 ID·인증서가 같으므로 기존 앱을 삭제하지 않고 업데이트하세요.

**MONGYU_R92_PLAY_WITH_SOUND.webm**은 소리를 포함한 12초 실제 앱 Canvas/오디오 그래프의 브라우저 캡처입니다. 실제 UI와 정상 입력만 사용하며 휴대폰 녹화가 아닙니다. **MONGYU_R92_source.zip**은 소스·검사 자료·파일별 해시를 포함합니다.

원작 KTF V1.0.1 후보를 로컬 에뮬레이터에서 직접 실행하고 첫 이야기와 수집판 전환, 캐릭터 시트·음악 구조를 조사했습니다. 상용 원작 그림·음원·대사는 배포하지 않습니다. 현재 이야기는 독자 한국어 각색이며 원작 모든 포즈·전체 스토리/콘텐츠의 1:1 복원판은 아닙니다.

검증: [Android Actions](https://github.com/0ssol1620-byte/mongyu/actions/runs/43710355665) 통과. 웹 183개 중 182개 통과·1개 제외. 네 화면 크기 40개 실제 UI 상태, 설치 WebView의 실제 녹음 재생, 업데이트 저장·앱 복귀·렌더러 복구를 확인했습니다. 합성 versionCode 91→92와 임시 CI 인증서의 업데이트 검사이며 최종 서명 APK 자체의 실기기 검사는 아닙니다. 서명 외 5개 항목은 테스트된 unsigned와 바이트 단위로 같습니다.

긴 프레임, 실기기 장시간 성능·청음, 원작 전체 대조와 100구간 연속 완주는 남아 있습니다. 실제 결제·광고는 비활성입니다. [조사·구현·검증 범위](https://github.com/0ssol1620-byte/mongyu/blob/codex/r92-coherent-original-direction/docs/R92_ORIGINAL_DIRECTION_KO.md).

Music: **Eric Skiff — Resistor Anthems**, available at https://ericskiff.com/music/ . Licensed under **Creative Commons Attribution 4.0 International**, https://creativecommons.org/licenses/by/4.0/ . Changes: up to 64-second excerpts, loudness normalization, edge fades, resampling and MP3 encoding; the preview is a gameplay capture containing these edits. Game and source archive include track-specific attribution and source/edit hashes. These are licensed recordings, not MONGYU compositions and not NOM3's original soundtrack.
