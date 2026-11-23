/* R104 play HUD: large score, bottom progress gauge and speech dock. Owned by workstream C. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const api=Object.freeze({enabled});
root.MongyuPlayHud=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
