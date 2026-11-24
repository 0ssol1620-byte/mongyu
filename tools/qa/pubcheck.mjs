import { chromium } from 'playwright-core';
const out=process.argv[2];
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
for (const [loc,tag] of [['ko-KR','ko'],['en-US','en']]) {
  const ctx = await b.newContext({locale:loc,viewport:{width:390,height:844},hasTouch:true,isMobile:true,bypassCSP:true});
  const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  const t0=Date.now();
  await p.goto('https://0ssol1620-byte.github.io/mongyu/r105/'); await p.waitForFunction(()=>document.documentElement.dataset.boot==='ready',null,{timeout:60000,polling:100});
  console.log(tag,'boot ms',Date.now()-t0);
  await p.waitForTimeout(1500); await p.screenshot({path:`${out}/${tag}-lobby.png`});
  console.log(tag,'errors',JSON.stringify(errs));
  await ctx.close();
}
await b.close();
