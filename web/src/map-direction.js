/* Authored map art/audio direction. Read-only; independent of native RNG and receipts. */
(function(root){'use strict';
const profiles=Object.freeze(Object.fromEntries([
 ['maze','사탕의 미로','stage01','chapter-01',0,'checker'],['stream','유리의 길','stage02','chapter-02',1,'flow'],
 ['floating','부유하는 섬','stage03','chapter-03',2,'orbit'],['garden','자석 정원','stage04','chapter-04',3,'checker'],
 ['wave','액체 계단','stage05','chapter-05',4,'flow'],['machine','잠든 기계','stage06','chapter-06',5,'pulse'],
 ['mirror','거울 너머','stage07','chapter-07',6,'mirror'],['memory','기억의 접힘','stage08','chapter-08',7,'mirror'],
 ['orbit','궤도 밖으로','stage09','chapter-09',8,'orbit'],['finale','마지막 사각','stage10','chapter-10',9,'pulse'],
 ['boss','심장 회로','boss','heart-circuit',9,'pulse']
].map(([id,title,musicRole,recordingId,stageIndex,field])=>[id,Object.freeze({id,title,musicRole,recordingId,stageIndex,field})])));
function describe(run){
 if(run?.openingCourse){
  const profile=[profiles.memory,profiles.mirror,profiles.stream][run.mapChanges]||profiles.memory;
  if(root.MONGYU_DREAM_EDITION===true)return {...profile,recordingId:(['opening-floor','opening-wall','opening-ceiling'][run.mapChanges]||'opening-floor')};
  return profile;
 }
 const s=run?.nativeFrame;if(!s)return profiles[run?.boss?'boss':'memory'];
 const stage=s.game?.stage||{},controller=s.game?.controller||{},view=s.game?.view||{},pool=s.game?.pool,current=pool?.objects?.[pool.currentIndex],mask=stage.behaviorCode===3;
 if(run.boss||stage.behaviorCode===99){const group=[0,1,2,3,0,2,1,3,2,0][s.boss?.J]??0;return {...profiles.boss,recordingId:['heart-circuit','boss-glass','boss-motor','boss-orbit'][group],bossGroup:group}}
 if((s.u?.actionLock&15)>0&&(s.u.actionLock&15)<=4)return profiles.machine;
 if(controller.modeP>0)return profiles.orbit;
 if(view.aq>0&&16*(current?.geometry?.activeLength||24)<view.av)return profiles.floating;
 if(stage.behaviorCode===1)return profiles.mirror;
 if(stage.behaviorCode===2)return profiles.wave;
 if(mask){const color=root.MongyuNativePalette?.get(s.map?.t||0).colors[0]||'#55aaff',r=parseInt(color.slice(1,3),16),g=parseInt(color.slice(3,5),16),b=parseInt(color.slice(5,7),16);return g>r*1.1&&g>b*.95?profiles.garden:profiles.maze}
 if(run.familyIndex===9)return profiles.finale;
 if((current?.geometry?.activeLength||0)>40)return profiles.stream;
 return (s.map?.ai||0)%3===0?profiles.garden:profiles.memory;
}
const api=Object.freeze({profiles,describe});root.MongyuMapDirection=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
