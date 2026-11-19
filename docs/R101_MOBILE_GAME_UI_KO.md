# 몽유 R101 · 모바일 게임 화면 연구

Google Play에 공개된 네 게임의 실제 스크린샷과 닌텐도 공식 사이트의 세 모드 화면을 비교했다. 스크린샷으로는 화면의 우선순위와 소재 표현을 관찰할 수 있다. 플레이 지속 시간이나 현재 순위는 이 비교에서 측정하지 않았다.

## 공식 화면에서 확인한 것

- **Super Mario Run**. Kingdom Builder에서 연결된 장소와 건물, 캐릭터가 화면의 대부분을 차지한다. World Tour에서 플레이에 필요한 시간과 코인은 상단에 모인다. 몽유에서도 화면의 가장 큰 영역을 기억을 고르는 길에 쓰고, 수집 개수와 페이지를 가장자리로 옮겼다. [Nintendo 공식 사이트](https://supermariorun.com/en/index.html)
- **Monument Valley 2**. 건축물의 여러 높이가 다리와 계단으로 이어진다. 작은 인물과 경로가 같은 구조 위에 있어 다음 이동 방향을 읽을 수 있다. 몽유는 굽은 길과 기억 표식, 떠 있는 돌 조각에 각각 다른 높이와 그림자를 부여했다. [Google Play 공식 스크린샷](https://play.google.com/store/apps/details?id=com.ustwo.monumentvalley2)
- **Alto’s Odyssey**. 노을과 보라색 밤에서 전경·중경·배경의 색과 명도가 달라진다. 몽유에서는 챕터마다 길의 빛과 윤곽 색을 바꾸고, 배경 굴곡 위에서도 글자와 목적지가 또렷하게 보이도록 대비를 줬다. [Google Play 공식 스크린샷](https://play.google.com/store/apps/details?id=com.noodlecake.altosodyssey)
- **Geometry Dash Lite**. 플레이어, 가시, 통과 지점이 외곽선과 실루엣만으로도 구분된다. 몽유의 기억은 금빛 표식, 체크 표시, 자물쇠를 통해 다음 목적지, 수집 완료, 잠금 상태를 함께 전달한다. [Google Play 공식 스크린샷](https://play.google.com/store/apps/details?id=com.robtopx.geometryjumplite)
- **Candy Crush Saga**. 게임판을 화면 가운데 두고, 목표를 위에, 쓸 수 있는 아이템을 아래에 배치한다. 아이템은 모양으로 구분된다. 몽유는 선택한 기억의 제목과 지금 누를 수 있는 행동을 하단 한 곳에 모으고, 같은 금속 테두리와 눌리는 면을 로비와 플레이 화면의 주요 버튼에 사용했다. [Google Play 공식 스크린샷](https://play.google.com/store/apps/details?id=com.king.candycrushsaga)

다섯 게임에서 화면 구성의 원리를 참고했다. 몽유의 길, 돌 표식, 조작 버튼은 자체 제작했다. 지도는 페이지, 선택 상태, 진행도 또는 화면 크기가 바뀔 때 Canvas를 갱신한다. 각 목적지는 독립된 버튼이라 터치, 방향키, 접근성 도구로 선택할 수 있다.
