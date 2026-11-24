/* R105 chapter palettes for the dark psychedelic look ("트립"). One scene = one dark base + two or three neon hue families + one small accent.
   MongyuTrip.get(key) -> palette; keys: violet, aqua, ember, toxic, heart. Acts read options.trip (a key) and fall back to 'violet'.
   Fields: sky[top,mid,bottom] dark gradient, fog, block[top,side,shadow] dark faces, rim neon edge, rim2 secondary edge, glow, accent,
   danger (obstacle, must contrast with the palette's own hues), gold (collectibles), aurora (goal), ink (text on dark). */
(function(root){'use strict';
const P={
 violet:{name:'블랙라이트 보라',sky:['#07031a','#140a33','#2a1259'],fog:'#5b2bd6',block:['#2b1b5e','#170d3a','#0a0620'],rim:'#7b3cff',rim2:'#ff2e9a',glow:'#b46bff',accent:'#19e3ff',danger:'#ff4d5e',gold:'#ffe27a',aurora:'#4df5e0',ink:'#f3eaff'},
 aqua:{name:'심해',sky:['#02131a','#06303a','#0a5057'],fog:'#16c4b4',block:['#0d3f48','#082a31','#031418'],rim:'#19f0d0',rim2:'#6a3dff',glow:'#5af7e3',accent:'#c6ff3a',danger:'#ff5b6e',gold:'#ffe27a',aurora:'#7dfff0',ink:'#e6fffb'},
 ember:{name:'잉걸불',sky:['#12040f','#2d0a1f','#5a1230'],fog:'#d63a72',block:['#4a1630','#2a0b1c','#12040c'],rim:'#ff7a1a',rim2:'#ff2d78',glow:'#ff9a4d',accent:'#19e3ff',danger:'#34e0ff',gold:'#ffe27a',aurora:'#7dfff0',ink:'#fff0e6'},
 toxic:{name:'독성',sky:['#041208','#0a2a14','#12501f'],fog:'#3ad14a',block:['#14401f','#0b2812','#04120a'],rim:'#b6ff2a',rim2:'#13e08f',glow:'#d4ff6a',accent:'#ff2e9a',danger:'#ff4d6e',gold:'#fff07a',aurora:'#7dfff0',ink:'#f2ffe6'},
 heart:{name:'맥박',sky:['#160408','#3a0b18','#6b1226'],fog:'#e0245a',block:['#52162a','#2e0b18','#14040a'],rim:'#ff3d7a',rim2:'#ffc23d',glow:'#ff7aa2',accent:'#aef3ff',danger:'#4de8ff',gold:'#ffe27a',aurora:'#7dfff0',ink:'#fff0f3'}
};
const KEYS=Object.freeze(Object.keys(P));
const hex=c=>{const n=parseInt(c.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255]};
const css=(c,a=1)=>{const [r,g,b]=hex(c);return a>=1?c:'rgba('+r+','+g+','+b+','+a+')'};
function mix(a,b,t){const x=hex(a),y=hex(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')}
const get=key=>P[key]||P.violet;
const api=Object.freeze({enabled:root.MONGYU_UI_EDITION===true,keys:KEYS,get,mix,css,hex,palettes:P});
root.MongyuTrip=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
