/* R105 hand-drawn SVG icon set. Owned by workstream E2.
   One grid (24x24), one stroke (2px, round caps and joins), no glyph characters.
   MongyuIcons.svg(name,{size,class,title}) -> string; el(name,opts) -> Element; uri(name) -> data: URI usable as a CSS mask. */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const P=(...d)=>d.map(x=>'<path d="'+x+'"/>').join('');
const ICONS={
 play:P('M7.4 5.9v12.2a1 1 0 0 0 1.5.86l10-6.1a1 1 0 0 0 0-1.72l-10-6.1a1 1 0 0 0-1.5.86z'),
 pause:P('M8.5 5.5v13','M15.5 5.5v13'),
 map:P('M3.5 6.8 9 4.5l6 2.3 5.5-2.3v12.7L15 19.5l-6-2.3-5.5 2.3z','M9 4.5v12.7','M15 6.8v12.7'),
 wardrobe:P('M12 9.8V8.6c0-1 .9-1.6 1.7-1.9A2.2 2.2 0 1 0 9.9 5.2','M12 9.8 3.8 15.4a1.4 1.4 0 0 0 .8 2.6h14.8a1.4 1.4 0 0 0 .8-2.6z'),
 story:P('M12 6.6C10.4 5.2 8 4.6 4.4 4.6v12.8c3.6 0 6 .6 7.6 2 1.6-1.4 4-2 7.6-2V4.6c-3.6 0-6 .6-7.6 2z','M12 6.6v12.8'),
 moon:P('M19.6 14.5A8 8 0 0 1 9.5 4.4a8 8 0 1 0 10.1 10.1z','M16.5 4v3.2','M14.9 5.6h3.2'),
 infinity:P('M12 12c-1.7-2.4-3.2-3.6-5-3.6a3.6 3.6 0 0 0 0 7.2c1.8 0 3.3-1.2 5-3.6s3.2-3.6 5-3.6a3.6 3.6 0 0 1 0 7.2c-1.8 0-3.3-1.2-5-3.6z'),
 star:P('m12 3.7 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8z'),
 sparkle:P('M12 3.4c.6 4.7 2.5 6.6 8.2 8.6-5.7 2-7.6 3.9-8.2 8.6-.6-4.7-2.5-6.6-8.2-8.6 5.7-2 7.6-3.9 8.2-8.6z'),
 door:P('M5.5 20.6V11a6.5 6.5 0 0 1 13 0v9.6','M3.4 20.6h17.2','M9.6 20.6v-6.8a2.4 2.4 0 0 1 4.8 0v6.8'),
 settings:P('M4 7.2h8.6','M17.6 7.2H20','M4 16.8h2.4','M11.4 16.8H20')+'<circle cx="15.1" cy="7.2" r="2.5"/><circle cx="8.9" cy="16.8" r="2.5"/>',
 close:P('M6.2 6.2l11.6 11.6','M17.8 6.2 6.2 17.8'),
 back:P('M14.6 5.4 8 12l6.6 6.6'),
 chevron:P('M9.4 5.6 15.8 12l-6.4 6.4'),
 'chevron-down':P('M5.6 9.4 12 15.8l6.4-6.4'),
 sound:P('M4.4 9.6h3.1l4.6-3.9v12.6l-4.6-3.9H4.4z','M15.6 9.1a4.1 4.1 0 0 1 0 5.8','M18.2 6.6a7.6 7.6 0 0 1 0 10.8'),
 'sound-off':P('M4.4 9.6h3.1l4.6-3.9v12.6l-4.6-3.9H4.4z','M16 9.6l4.8 4.8','M20.8 9.6 16 14.4'),
 vibration:'<rect x="8.2" y="4.6" width="7.6" height="14.8" rx="2.2"/>'+P('M4.8 9v6','M19.2 9v6','M2.6 11v2','M21.4 11v2'),
 accessibility:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="7.9" r="1.1"/>'+P('M7.6 10.6c3 .9 6.8.9 8.8 0','M12 11.2v3.1','M9.7 18.2 12 14.3l2.3 3.9'),
 share:P('M12 15.2V4.4','M8.3 8 12 4.4 15.7 8','M6 11.6v6.2a1.8 1.8 0 0 0 1.8 1.8h8.4a1.8 1.8 0 0 0 1.8-1.8v-6.2'),
 poster:'<rect x="4" y="4" width="16" height="16" rx="3.2"/><circle cx="15.6" cy="8.8" r="1.3"/>'+P('M4.2 16.4l4.6-4.4 3.4 3.2 3-3 4.6 4.4'),
 video:'<rect x="3.4" y="6.2" width="11.8" height="11.6" rx="3"/>'+P('M15.2 10.6 20.6 7.6v8.8l-5.4-3'),
 check:P('M5 12.6l4.6 4.6L19 7.6'),
 lock:'<rect x="5.4" y="10.4" width="13.2" height="9.6" rx="2.6"/>'+P('M8.5 10.4V8.2a3.5 3.5 0 0 1 7 0v2.2','M12 14.2v2'),
 heart:P('M12 19.6S5 15.2 5 9.9a3.9 3.9 0 0 1 7-2.3 3.9 3.9 0 0 1 7 2.3c0 5.3-7 9.7-7 9.7z'),
 info:'<circle cx="12" cy="12" r="9"/>'+P('M12 11.2v5.2','M12 7.8h.01'),
 retry:P('M5.2 12a6.9 6.9 0 1 0 2.2-5','M5.2 4.6v4.2h4.2'),
 home:P('M4.2 11.2 12 4.8l7.8 6.4v7.7a1 1 0 0 1-1 1h-4.3v-5.4H9.5v5.4H5.2a1 1 0 0 1-1-1z'),
 isle:P('M4 11.4c0-1.4 3.6-2.5 8-2.5s8 1.1 8 2.5-3.6 2.5-8 2.5-8-1.1-8-2.5z','M5.2 13.4c.9 3 3.3 5.4 6.8 7 3.5-1.6 5.9-4 6.8-7','M12 6.8V3.6','M10.6 5.2h2.8'),
 music:'<circle cx="7.6" cy="17.4" r="2.6"/><circle cx="16.8" cy="15.4" r="2.6"/>'+P('M10.2 17.4V6.2l9.2-2v11.2','M10.2 9.4l9.2-2'),
 shard:P('M12 3.6 17.4 12 12 20.4 6.6 12z','M12 3.6v16.8','M6.6 12h10.8')
};
const NAMES=Object.freeze(Object.keys(ICONS));
function attrs(size,cls){return 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="'+size+'" height="'+size+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"'+(cls?' class="'+String(cls).replace(/[^\w -]/g,'')+'"':'')}
function svg(name,opts){
 const o=opts||{},body=ICONS[name];if(!body)return '';
 const size=Number.isFinite(o.size)?o.size:24,title=o.title?'<title>'+String(o.title).replace(/[<>&]/g,'')+'</title>':'';
 return '<svg '+attrs(size,o.class)+'>'+title+body+'</svg>';
}
function el(name,opts){
 const doc=root.document;if(!doc||!ICONS[name])return null;
 const host=doc.createElement('span');host.innerHTML=svg(name,opts);return host.firstChild;
}
/* Mask source: black strokes on transparent, so `background:currentColor; mask:url(...)` tints it. */
function uri(name,strokeWidth){
 const body=ICONS[name];if(!body)return '';
 const sw=Number.isFinite(strokeWidth)?strokeWidth:2;
 const text='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="'+sw+'" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg>';
 return 'data:image/svg+xml,'+encodeURIComponent(text).replace(/'/g,'%27').replace(/\(/g,'%28').replace(/\)/g,'%29');
}
const api=Object.freeze({enabled,names:NAMES,has:n=>Object.prototype.hasOwnProperty.call(ICONS,n),svg,el,uri,STROKE:2});
root.MongyuIcons=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
