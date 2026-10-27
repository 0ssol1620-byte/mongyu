/* Original, embedded painted scenery. No network requests and no collision data. */
(function(root){'use strict';
const keys=['tidal','mirror','eclipse'],items={},draws={tidal:0,mirror:0,eclipse:0};
const safe=/^data:image\/(?:webp|png);base64,[A-Za-z0-9+/]+={0,2}$/;
function create(bundle={},ImageClass=root.Image){
 const states={},images={};
 const ready=Promise.all(keys.map(key=>new Promise(resolve=>{
  const src=bundle[key];states[key]='loading';
  if(!safe.test(src||'')||typeof ImageClass!=='function'){states[key]='failed';resolve();return}
  const im=new ImageClass();let settled=false;
  const finish=ok=>{if(settled)return;settled=true;clearTimeout(timeout);states[key]=ok?'loaded':'failed';if(ok)images[key]=im;resolve()};
  const timeout=setTimeout(()=>finish(false),10000);im.onload=()=>finish(im.width>0&&im.height>0);im.onerror=()=>finish(false);im.src=src;
 })));
 return {ready,get:key=>images[key]||null,status:()=>({...states}),draws};
}
const api=create(root.MONGYU_EMBEDDED_IMAGES||{});api.create=create;api.record=key=>{if(key in draws)draws[key]++};root.MongyuAssets=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
