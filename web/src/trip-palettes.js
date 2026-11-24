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
const hex=c=>{const n=parseInt(c.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255]};
const css=(c,a=1)=>{const [r,g,b]=hex(c);return a>=1?c:'rgba('+r+','+g+','+b+','+a+')'};
function mix(a,b,t){const x=hex(a),y=hex(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('')}
/* R105 hybrid chapters (NOM3 blueprint 7.2): c1..c10. Light calm palettes (light:true: c1-c7, c9?, c10) keep a thin DARK ink outline instead of a neon rim, almost no glow, soft shadows;
   the runner is a near-black silhouette, so the path top is the lightest face. c8 is dark psychedelic, c9 dark and almost empty. Fields as above plus light:true. */
const INK_DARK='#15121c';
function lightPal(name,bg,sec,acc,danger){
 return {name,light:true,sky:[mix(sec,bg,.5),bg,mix(bg,'#ffffff',.45)],fog:mix(bg,'#ffffff',.55),block:[mix(bg,'#ffffff',.5),mix(bg,sec,.55),mix(sec,'#2a2434',.4)],
  rim:mix(sec,INK_DARK,.82),rim2:mix(sec,INK_DARK,.58),glow:mix(bg,'#ffffff',.6),accent:acc,danger,gold:'#E0A12A',aurora:'#1E9E90',ink:'#2a2434'};
}
Object.assign(P,{
 c1:lightPal('c1 복숭아 회반죽','#F4DDC5','#AA9CC6','#D75F61','#D13B44'),
 c2:lightPal('c2 이끼 물가','#C6DDB4','#B5C8DB','#C67746','#D0522A'),
 c3:lightPal('c3 모래 정원','#F1DDB7','#75A6A1','#CF4763','#CF3A55'),
 c4:lightPal('c4 상아와 먹','#EEE7D8','#37333D','#8F90C5','#D9472B'),
 c5:lightPal('c5 장밋빛 안개','#D8C5BD','#839687','#C9A258','#B8323A'),
 c6:lightPal('c6 자두빛 저녁','#D6B9CF','#544761','#E0B46B','#E5503A'),
 c7:lightPal('c7 청회색 새벽','#B2C9C9','#9E8FC1','#E0819D','#D63F63'),
 c8:{name:'c8 어두운 환각',sky:['#14122a','#26223D','#3a3160'],fog:'#5a4a8a',block:['#2f2a4e','#201c3a','#120f26'],rim:'#A95BDC',rim2:'#7a6bff',glow:'#c58cf0',accent:'#64D8CC',danger:'#ff5a6e',gold:'#ffe27a',aurora:'#64D8CC',ink:'#f3eaff'},
 c9:{name:'c9 텅 빈 밤',sky:['#0b0b16','#141525','#1f2036'],fog:'#2a2b42',block:['#2a2b40','#1c1d30','#0d0d1a'],rim:'#8c8ca6',rim2:'#55566E',glow:'#F2DDC9',accent:'#F2DDC9',danger:'#ff6b5e',gold:'#ffe27a',aurora:'#9fe8da',ink:'#f2ddc9'},
 c10:lightPal('c10 새벽의 끝','#F4EBDD','#B9C7D8','#D96764','#D9453F')
});
const KEYS=Object.freeze(Object.keys(P));
const get=key=>P[key]||P.violet;
/* R105 wave 3 (TR): helpers shared by every act and the psy layer. rgb('#rrggbb') -> 'r,g,b'; ink(key) -> meaning colours of a trip (danger/gold/aurora), colour-blind aware
   (html[data-cvd=on]: danger turns a light periwinkle unless the palette's own danger is already blue, gold turns a saturated yellow); face(key) -> dark block faces and neon edge colours. */
const rgb=c=>hex(c).join(',');
const cvdOn=()=>{try{const d=root.document?.documentElement;return !!d&&!!d.dataset&&d.dataset.cvd==='on'}catch(_){return false}};
const tripKey=key=>P[key]?key:'violet';
const inkCache=new Map(),faceCache=new Map();
function ink(key){
 key=tripKey(key);const cvd=cvdOn(),id=key+(cvd?'|cvd':''),hit=inkCache.get(id);if(hit)return hit;
 const p=P[key],light=!!p.light;let danger=key==='violet'?'#ff5a36':p.danger,gold=p.gold;   // violet: the magenta rim2 sits next to #ff4d5e, so its danger leans orange-red
 if(cvd){const [r,,b]=hex(danger);if(b<=r)danger=light?'#2748b8':'#8fb4ff';gold=light?'#b98a00':'#ffe14d'}
 const v=Object.freeze({danger,dangerTop:mix(danger,'#ffffff',.38),dangerSide:mix(danger,'#000000',.42),dangerLine:light?mix(danger,'#000000',.6):mix(danger,'#ffffff',.82),dangerRgb:rgb(danger),
  tap:gold,tapDeep:mix(gold,'#ff9a1f',.3),tapRgb:rgb(gold),aurora:p.aurora,auroraRgb:rgb(p.aurora),rim:p.rim,rimRgb:rgb(p.rim),rim2:p.rim2,rim2Rgb:rgb(p.rim2),glow:p.glow,glowRgb:rgb(p.glow),fogRgb:rgb(p.fog),accent:p.accent,accentRgb:rgb(p.accent),cvd,light});
 inkCache.set(id,v);return v;
}
function face(key){
 key=tripKey(key);let v=faceCache.get(key);if(v)return v;const p=P[key];

 if(p.light){v=Object.freeze({tint:0,light:true,top:p.block[0],front:p.block[1],side:p.block[2],deep:mix(p.block[2],'#000000',.2),edge:p.rim,edge2:p.rim2,glow:p.glow});faceCache.set(key,v);return v}
 const [r,g,b]=hex(p.rim),lum=(.2126*r+.7152*g+.0722*b)/255,tint=Math.max(.35,Math.min(1,1.2-lum));   // tint: how much of a bright neon (lime, aqua) may bleed into the dark faces
 v=Object.freeze({tint,top:mix(p.block[0],p.rim,.26*tint),front:mix(p.block[1],p.rim,.07*tint),side:p.block[2],deep:mix(p.block[2],'#000000',.35),edge:mix(p.rim,'#ffffff',.28),edge2:mix(p.rim2,'#ffffff',.2),glow:p.glow});
 faceCache.set(key,v);return v;
}
const active=()=>root.MONGYU_UI_EDITION===true;
const api=Object.freeze({enabled:root.MONGYU_UI_EDITION===true,keys:KEYS,get,mix,css,hex,rgb,ink,face,active,cvdOn,palettes:P});
root.MongyuTrip=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
