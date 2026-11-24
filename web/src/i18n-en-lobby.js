/* R105 English strings for the lobby, settings and pause sheet: keyed table (used through L(key,fallback) in ui-kit/lobby-ui) plus legacy phrases. */
(function(root){'use strict';
if(root.MONGYU_UI_EDITION!==true||!root.MongyuI18n?.register)return;
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
},{phrases:{'효과음':'Effects','음악':'Music','소리':'Sound','화면':'Display','접근성':'Accessibility','정보':'Info','설정':'Settings','잠깐 멈춤':'Paused','계속 달리기':'Keep running','다시 달리기':'Retry','처음으로':'Home'},patterns:[]});
})(globalThis);
