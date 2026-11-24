/* R105 course engine: chains acts into one run with portal transitions, carry-over score and chapter definitions. Owned by workstream A. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const api=Object.freeze({enabled});
root.MongyuCourse=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
