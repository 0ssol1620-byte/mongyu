/* R105 Korean string table (the source of truth for new strings). Owned by workstream E1.
 * Same keys as i18n-en.js. Voice: see docs/R105_VOICE_TONE_KO.md. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const strings={
 'lang.label':'언어',
 'common.close':'닫기','common.back':'돌아가기','common.next':'다음','common.retry':'다시 달리기','common.home':'처음으로','common.continue':'계속',
 'common.on':'켜짐','common.off':'꺼짐',
 'unit.pts':{other:'{n}점'},
 'unit.shards':{other:'빛 조각 {n}개'},
 'unit.memories':{other:'기억 {n}개'},
 'unit.lives':{other:'목숨 {n}개'},
 'hud.shards':'빛 {a} / {b}','hud.perfect':'완벽 ×{n}',
 'save.failed':'저장하지 못했어요.','save.ok':'저장했어요.'
};
const api=Object.freeze({enabled,strings});
if(enabled&&root.MongyuI18n)root.MongyuI18n.register('ko',strings);
root.MongyuI18nKo=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
