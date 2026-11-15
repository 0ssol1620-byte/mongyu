/* Observed map skins from earned runs. Cosmetic history never grants progress. */
(function(root){'use strict';
const KEY='mongyu.r90.map-skins.v1';
function decode(raw){try{const v=JSON.parse(raw);if(v?.schema!==1)return {};return Object.fromEntries(Object.entries(v.records||{}).filter(([id,index])=>/^\d{1,3}$/.test(id)&&+id>=1&&+id<=100&&Number.isInteger(index)&&index>=0&&index<100))}catch(_){return {}}}
function create(storage){let records={},saved=true;try{records=decode(storage.getItem(KEY))}catch(_){saved=false}
 return {get(number,collected){return collected===true&&Number.isInteger(records[number])?records[number]:null},record(number,palette,earned){if(earned!==true||!Number.isInteger(number)||number<1||number>100||!Number.isInteger(palette)||palette<0||palette>=100)return false;records={...records,[number]:palette};const raw=JSON.stringify({schema:1,records});try{storage.setItem(KEY,raw);saved=storage.getItem(KEY)===raw}catch(_){saved=false}return saved},inspect:()=>({saved,count:Object.keys(records).length})};
}
function draw(c,index,size=32){const palette=root.MongyuNativePalette;if(!palette)return false;
 for(let y=0;y<8;y++)for(let x=0;x<8;x++){const a=y*8+x,fold=a>31?63-a:a;c.fillStyle=palette.color(index,{packedPaletteOffset:112+(fold>>1),nibble:fold&1?'high':'low',brightnessDelta:0,grayTransform:'none'},true);c.fillRect(x*size/8,y*size/8,size/8,size/8)}return true;
}
const api={KEY,decode,create,draw};root.MongyuMapSkins=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
