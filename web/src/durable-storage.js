/* Android writes acknowledge a private durable journal; browsers keep Web Storage.
 * No global Storage methods are changed. Legacy values migrate on first read.
 */
(function(root){'use strict';
function owns(key){return typeof key==='string'&&key.length<=160&&/^(mongyu[.-]|quad-rift)[A-Za-z0-9._-]*$/.test(key)}
function create(browser,bridge=root._MongyuStore){
 if(!bridge||typeof bridge.read!=='function'||typeof bridge.write!=='function'||typeof bridge.remove!=='function')return browser;
 const mirror=(method,...args)=>{try{browser[method](...args)}catch(_){}};
 return {
  getItem(key){key=String(key);if(!owns(key))return browser.getItem(key);const stored=bridge.read(key);
   if(stored==='d'){mirror('removeItem',key);return null}
   if(typeof stored==='string'&&stored[0]==='v'){const value=stored.slice(1);mirror('setItem',key,value);return value}
   if(stored!==null&&stored!==undefined)throw Error('Unreadable durable save');
   const previous=browser.getItem(key);if(previous===null||previous===undefined)return null;
   if(bridge.write(key,previous)!==true)throw Error('Legacy save migration failed');return previous;
  },
  setItem(key,value){key=String(key);value=String(value);if(!owns(key))return browser.setItem(key,value);
   if(bridge.write(key,value)!==true)throw Error('Durable save failed');mirror('setItem',key,value);
  },
  removeItem(key){key=String(key);if(!owns(key))return browser.removeItem(key);
   if(bridge.remove(key)!==true)throw Error('Durable removal failed');mirror('removeItem',key);
  }
 };
}
const api=Object.freeze({create,owns});root.MongyuStorage=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
