import { chromium } from 'playwright-core';
const out=process.argv[2], which=process.argv[3].split(',').map(Number);
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args:['--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true,bypassCSP:true});
const p = await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://127.0.0.1:4198/MONGYU_R105.html'); await p.waitForTimeout(2000);
await p.evaluate(()=>{
  window.__log=[];window.__pilotOn=true;
  const Ill=MongyuIllusion,Op=MongyuOpening;
  setInterval(()=>{
    const r=MongyuPolish.host.activeRun();if(!r||!window.__pilotOn||r.state!=='play')return;
    const c=r.child;if(!c||(r.portal&&!r.portal.swapped))return;
    const t=c.dreamMode||(c.openingCourse?'opening':'?');
    try{
      if(c.openingCourse){
        if(c.slowChance==='active'&&c.distance>=c.obstacles[0].at-80){r.action();return}
        const o=c.obstacles[c.index];if(o&&o.at-c.distance<=Op.PERFECT_LEAD+1&&c.flight===null)r.action();return}
      if(t==='helix'){const ob=c.course.obstacles[c.index];if(c.slowChance==='active'||c.hold){r.action();return}
        if(ob&&c.flight===null&&(ob.at-c.distance)<=.34*c.speed+.5)r.action();return}
      if(t==='penrose'){const ob=c.course.obstacles[c.blockIndex];if(ob&&c.flight===null&&(ob.at-c.distance)<=.4*c.speed+.5)r.action();return}
      if(t==='align'){if(c.aligned)r.action();return}
      // illusion bridge act
      const g=c.activeGap?.();
      if(g){const ahead=g.s0-c.distance;if(ahead<=90&&ahead>10||c.slowChance==='active')r.action();return}
      const bl=c.cs.COURSE.blocks[c.blockIndex];
      if(bl&&bl.at-c.distance<=Ill.SPEED*Ill.FLIGHT/2+.5&&c.flight===null)r.action();
    }catch(e){window.__log.push('pilot '+t+' '+e.message)}
  },8);
});
for (const idx of which){
  await p.evaluate(i=>{const c=MongyuCourse.CHAPTER1.courses[i];const run=new MongyuCourse.CourseRun({...c,viewport:MongyuPolish.host.viewport(),settings:MongyuPolish.host.settings()});MongyuPolish.host.startRun(run,null);window.__t0=performance.now()},idx);
  let last='',shots=0,done=false,k=0;
  while(!done&&k++<400){
    await p.waitForTimeout(500);
    const s=await p.evaluate(()=>{const r=MongyuPolish.host.activeRun();return r?{state:r.state,act:r.actIndex,type:r.acts?.[r.actIndex]?.type,score:r.score,hearts:r.hearts,child:r.child?.state,t:Math.round((performance.now()-window.__t0)/100)/10}:null});
    if(!s){console.log('no run');break}
    const key=s.act+':'+s.type;
    if(key!==last){last=key;await p.screenshot({path:`${out}/c${idx}-act${s.act}-${s.type}-a.png`});await p.waitForTimeout(2200);await p.screenshot({path:`${out}/c${idx}-act${s.act}-${s.type}-b.png`});console.log(`course ${idx} -> act ${s.act} ${s.type} @${s.t}s score ${s.score}`)}
    if(s.state==='clear'||s.state==='fail'){console.log(`course ${idx} END ${s.state} act ${s.act}/${s.type} score ${s.score} time ${s.t}s`);await p.waitForTimeout(1500);await p.screenshot({path:`${out}/c${idx}-end-${s.state}.png`});done=true}
  }
  if(!done)console.log('course',idx,'TIMEOUT');
  await p.evaluate(()=>{MongyuPolish.host.activeRun()?.pause?.()});await p.waitForTimeout(300);
}
console.log('log',JSON.stringify(await p.evaluate(()=>window.__log)),'errors',JSON.stringify(errs));
await b.close();
