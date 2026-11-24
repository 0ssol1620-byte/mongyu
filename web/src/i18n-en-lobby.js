/* R105 English strings for the lobby, settings and pause sheet: keyed table (used through L(key,fallback) in ui-kit/lobby-ui) plus legacy phrases. */
(function(root){'use strict';
if(root.MONGYU_UI_EDITION!==true||!root.MongyuI18n?.register)return;
/* The lookup falls back from the current language to ko and then en, so every key defined for en also needs its Korean text here,
   otherwise Korean players would see English for it. */
root.MongyuI18n.register('ko',{
 'lobby.modes':'다른 꿈','pause.title':'잠깐 멈춤',
 'settings.title':'설정','settings.secSound':'소리','settings.secScreen':'화면','settings.secAccess':'접근성','settings.secInfo':'정보',
 'settings.soundOn':'소리 켜기','settings.soundOnSub':'음악과 효과음 모두',
 'settings.intensity':'꿈의 강도','settings.intensitySub':'화면 연출의 세기',
 'settings.capture':'골인 영상 기록','settings.captureSub':'골인 순간을 영상으로 남겨요',
 'settings.cvd':'색약 모드','settings.cvdSub':'위험과 목적지 색을 바꿔요',
 'settings.reduceMotion':'움직임 줄이기','settings.reduceMotionSub':'회전과 흔들림을 줄여요',
 'settings.runFlash':'화면 반짝임','settings.runFlashSub':'이번 달리기에만 적용돼요','settings.runSpeed':'속도','settings.runSpeedSub':'이번 달리기에만 적용돼요',
 'settings.thisRun':'이번 달리기','settings.skip':'연습 건너뛰기','settings.credits':'음악 출처와 이용 조건'
});
root.MongyuI18n.register('en',{
 'common.close':'Close','common.home':'Home','lobby.modes':'Other dreams','pause.title':'Paused',
 'settings.title':'Settings','settings.secSound':'Sound','settings.secScreen':'Display','settings.secAccess':'Accessibility','settings.secInfo':'Info',
 'settings.soundOn':'Sound on','settings.soundOnSub':'Music and effects',
 'settings.intensity':'Dream intensity','settings.intensitySub':'Visual strength',
 'settings.capture':'Goal clip recording','settings.captureSub':'Keep the finish as a clip',
 'settings.cvd':'Color-blind mode','settings.cvdSub':'Swaps the danger and goal colors',
 'settings.reduceMotion':'Reduce motion','settings.reduceMotionSub':'Less rotation and shaking',
 'settings.runFlash':'Screen flashes','settings.runFlashSub':'This run only','settings.runSpeed':'Speed','settings.runSpeedSub':'This run only',
 'settings.thisRun':'This run','settings.skip':'Skip practice','settings.credits':'Music credits and terms'
},{phrases:{'꿈의 섬':'Dream isle','곧':'Soon','곧 열려요':'Opens soon','아직 열 수 없어요':'Not available yet','효과음':'Effects','음악':'Music','소리':'Sound','화면':'Display','접근성':'Accessibility','정보':'Info','설정':'Settings','잠깐 멈춤':'Paused','계속 달리기':'Keep running','다시 달리기':'Retry','처음으로':'Home'},patterns:[]});
})(globalThis);
