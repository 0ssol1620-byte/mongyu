/* R105 HUM: English for the humor lines. Registers the bank's Korean source strings as legacy phrases (so the DOM translator also covers a Korean bubble)
   and humor.<id> keys for MongyuI18n.t(). humor-bank.js is loaded right before this file; the English there is transcreation, not literal. */
(function(root){'use strict';
if(root.MONGYU_UI_EDITION!==true||!root.MongyuI18n?.register||!root.MongyuHumorBank?.ENTRIES)return;
const phrases={},en={},ko={};
for(const e of root.MongyuHumorBank.ENTRIES){
 en[e.key]=e.en;ko[e.key]=e.ko;
 if(e.ko&&e.en)phrases[e.ko]=e.en;
}
root.MongyuI18n.register('ko',ko);
root.MongyuI18n.register('en',en,{phrases,patterns:[]});
})(globalThis);
