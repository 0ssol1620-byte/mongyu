/* R105 generated-art loader: decodes the embedded WebP sprites/backgrounds (MONGYU_EMBEDDED_ART) lazily and caches them.
   MongyuArt.image(id) -> HTMLImageElement|null (null when unknown; check .complete && .naturalWidth before drawing),
   MongyuArt.ready(id) -> true when decoded, MongyuArt.preload(ids) -> Promise, MongyuArt.draw(ctx,id,x,y,w,h,opts). */
(function(root){'use strict';
const enabled=root.MONGYU_UI_EDITION===true;
const table=()=>root.MONGYU_EMBEDDED_ART||{};
const cache=new Map();
function image(id){
 if(!enabled)return null;
 if(cache.has(id))return cache.get(id);
 const e=table()[id];if(!e||typeof root.Image!=='function'){cache.set(id,null);return null}
 const img=new root.Image();img.decoding='async';img.src=e.src;cache.set(id,img);return img;
}
const ready=id=>{const i=image(id);return !!(i&&i.complete&&i.naturalWidth>0)};
function preload(ids){
 return Promise.all([].concat(ids).map(id=>{const i=image(id);if(!i)return false;if(i.complete&&i.naturalWidth>0)return true;
  return new Promise(res=>{i.addEventListener('load',()=>res(true),{once:true});i.addEventListener('error',()=>res(false),{once:true})})}));
}
/* Draws the sprite centered at (x,y) fitting a w-by-h box (keeps the aspect); returns false while it is still decoding. */
function draw(ctx,id,x,y,w,h,opts={}){
 const i=image(id);if(!i||!i.complete||!i.naturalWidth)return false;
 const k=Math.min(w/i.naturalWidth,h/i.naturalHeight),dw=i.naturalWidth*k,dh=i.naturalHeight*k;
 ctx.save();if(opts.alpha!==undefined)ctx.globalAlpha*=opts.alpha;
 if(opts.rotate){ctx.translate(x,y);ctx.rotate(opts.rotate);ctx.drawImage(i,-dw/2,-dh/2,dw,dh)}else ctx.drawImage(i,x-dw/2,y-dh/2,dw,dh);
 ctx.restore();return true;
}
const api=Object.freeze({enabled,image,ready,preload,draw,has:id=>enabled&&!!table()[id],get ids(){return Object.keys(table())}});
root.MongyuArt=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
