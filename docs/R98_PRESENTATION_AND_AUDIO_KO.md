# 몽유 R98 캐릭터와 음향

첫 코스 ‘접힌 빛’의 일식, 굽은 발판, 마름모를 로비와 도입 장면에 사용했다. 길의 새 외형은 접힌 후드, 빛이 드는 눈, 사선 여밈, 복숭아색 목도리로 형태를 구분한다. 달리기와 점프는 기존 발 접촉과 관절 길이를 사용한다. 로비·이야기·게임 카운트다운의 대기 자세는 두 발을 지면에 둔 채 상체와 눈만 움직인다. 모션 줄이기를 켜면 대기 동작을 정지한다.

도입 대사와 코스의 대사는 몽유를 위해 작성했다. 도입부에는 화자 이름과 말풍선 꼬리를 붙였다. 달리는 동안에는 주인공 위에 짧은 대사를 표시하고, 점프·연습·일시정지·결과 화면에서는 해당 대사를 감춘다. 코스 말풍선 위에서도 탭이 게임으로 전달된다.

## 새 음악

공식 카탈로그에서 Kevin MacLeod의 음원을 골랐다. 모든 곡은 CC BY 4.0이다. 게임에 들어가는 것은 시작과 끝을 페이드하고 음량과 저음을 다듬은 발췌본이다.

| 장면 | 곡 |
| --- | --- |
| 로비 | Dreams Become Real의 피아노와 신스 [곡과 라이선스](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500027) |
| 꿈 지도 | Music for Manatees의 전자 피아노와 현악 [곡과 라이선스](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400009) |
| 바닥 | Floating Cities의 신스와 타악기 [곡과 라이선스](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600018) |
| 벽 | Dream Culture의 물결 같은 피아노와 역재생 효과 [곡과 라이선스](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1300046) |
| 천장 | Frost Waltz의 첼레스타와 글로켄슈필 [곡과 라이선스](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100516) |

다른 기억과 대결의 음악에는 Eric Skiff의 Resistor Anthems를 사용한다. 곡별 발췌 지점, 처리, 파일 해시는 앱 설정과 음악 목록에 있다. [Eric Skiff 공식 출처](https://ericskiff.com/music/) · [R98 음악 목록](../web/assets/music/r98-manifest.json)

## 새 효과음

Kenney의 공식 **Interface Sounds**, **Impact Sounds**, **Music Jingles**에서 CC0 샘플 열 개를 가져왔다. 점프·대사는 서로 다른 뜯는 소리, 착지는 나무, 벽 전환은 스위치, 충돌은 낮은 타격, 일반 통과와 여유 있는 통과는 유리와 확인음, 완주는 짧은 스틸 징글을 사용한다. 리샘플링과 음량·길이 조절을 거쳐 오프라인 앱에 포함했다. [Interface Sounds](https://kenney.nl/assets/interface-sounds) · [Impact Sounds](https://kenney.nl/assets/impact-sounds) · [Music Jingles](https://kenney.nl/assets/music-jingles) · [효과음 목록](../web/assets/effects/manifest.json)

## 확인한 범위

- 390×844 Chromium에서 대기 동작과 말풍선, 다섯 음악의 재생·전환, 점프·착지·빛의 획득·충돌·완주 효과음, 진행 저장까지 확인했다. [브라우저 결과](../evidence/r98-browser-presentation.json)
- 후속 맵의 표본 15개 장면에서 렌더링한 다리와 발판의 픽셀 겹침을 확인했다. 이 표본에서 겹침은 0건이었다. [접촉 검사](../evidence/r98-native-contact.json)
- Android 15 에뮬레이터에서 R97 설치에 R98을 덮어쓰고 터치 여섯 번으로 완주했다. 화면을 떠났다가 돌아왔을 때의 일시정지, 앱 재시작 후 진행과 의상 보존도 확인했다. [Android 검사](../evidence/r98-android-device.json) · [서명과 다운로드 대조](../evidence/r98-signed-apk.json)
