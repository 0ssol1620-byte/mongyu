# 몽유 · MONGYU R87

[Android APK 다운로드](https://github.com/0ssol1620-byte/mongyu/releases/download/r87-preview/MONGYU_R87_ANDROID.apk) · [소스와 변경 기록](https://github.com/0ssol1620-byte/mongyu/releases/tag/r87-preview)

100개 기억을 모으는 오프라인 게임의 개발 빌드입니다. 원작 전체 복원 완료 상태가 아닙니다. R87은 직접 확보한 KTF 후보를 대조해 보스 반격의 잘못된 필드를 수정하고, 100개 숫자 팔레트와 실제 배경 명령, 음악 선택·피격 효과를 연결합니다. 이전 버전의 지연·관절·상시 확대 수정도 포함합니다.

```sh
python3 web/build.py
python3 scripts/test.py
node tools/audit-runtime.cjs
node tools/audit-native-patterns.cjs
```

Python 3.10+와 Node.js 18+가 필요합니다. web/MONGYU_R87.html은 오프라인 단일 HTML입니다. 브라우저 도구는 Playwright와 Chromium을 별도로 사용합니다. Android는 python3 scripts/prepare-android-r80.py로 입력 파일을 준비한 뒤 SDK 36/JDK 환경에서 빌드합니다.

[발견한 문제, 수정, 원작 콘텐츠별 현황과 검증 한계](docs/R87_ORIGINAL_RESEARCH_KO.md)를 확인하세요. 생성 위치 조정의 반복 복구는 원작 동일성을 주장하지 않는 명시적 안정성 수정입니다. 원본 캐릭터·스킨 그림과 음원·대사의 재현, 필드 아이템/확대의 정확한 연계 대조, 100개 정상 완주, Android 실기기 검수는 아직 남아 있습니다.

APK는 몽유 R87 테스트이며 org.quadrift.mongyu.preview.r82 ID와 같은 인증서를 사용합니다. R82~R86을 삭제하지 않고 업데이트할 수 있습니다. 최소 Android 8.0입니다. 공개 검증 결과는 evidence/r87-signed-apk.json에 남깁니다. 서명 비밀키는 소스에 포함하지 않습니다.

음원은 몽유용 자체 제작 12곡입니다. 실제 결제·광고는 비활성입니다. 상품/광고/출시 운영 계획은 docs/R81_RELEASE_REVIEW_KO.md에 있으며 이전 버전 문서와 evidence는 과거 기록으로 보존합니다.

R87은 가속 Android 15 / WebView 124에서 실제 설치 APK의 입력·전체 화면·업데이트 저장·복구 검사 8개를 통과했습니다. 웹 검사는 153개 중 152개 통과·외부 어댑터 1개 제외입니다. [공개 Android 검사](https://github.com/0ssol1620-byte/mongyu/actions/runs/43667332494). Android는 최신 System WebView가 필요하며 실제 휴대폰 장시간 성능·청음 검수는 남아 있습니다.
