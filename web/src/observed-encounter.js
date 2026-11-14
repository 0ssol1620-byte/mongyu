/* Integration adapter for the separately tested R55/R57/R59/R61 candidates.
   Timing and input policies remain authored hypotheses, not original binaries. */
(function(root){'use strict';
const dep=(global,file,key)=>root[global]?.[key]||(typeof require==='function'?require(file)[key]:null);
const Chain=dep('MongyuChainLab','./encounter-chain.js','ChainRun');
const Radial=dep('MongyuRadialLab','./encounter-radial.js','RadialRun');
const Wave=dep('MongyuWaveLab','./encounter-wave.js','WaveRun');
const Robot=dep('MongyuRobotLab','./encounter-robot.js','RobotRun');
const Orbit=dep('MongyuOrbitEncounter','./encounter-orbit.js','OrbitRun');
const Heart=dep('MongyuHeartEncounter','./encounter-heart.js','HeartRun');
const Alien=dep('MongyuAlienEncounter','./encounter-alien.js','AlienRun');
const Sun=dep('MongyuSunEncounter','./encounter-sun.js','SunRun');
const specs={8:{kind:'sun',Model:Sun,policy:'human-air-contact'},31:{kind:'alien',Model:Alien,policy:'pair-air-contact'},45:{kind:'chain',Model:Chain,policy:'avoid'},58:{kind:'radial',Model:Radial,policy:'near'},66:{kind:'wave',Model:Wave,policy:'cycle'},77:{kind:'robot',Model:Robot,policy:'near'},90:{kind:'orbit',Model:Orbit,policy:'black-return-blue-jump'},99:{kind:'heart',Model:Heart,policy:'boundary-counter'}};
const box=cells=>{const x=Math.min(...cells.map(c=>c.x)),y=Math.min(...cells.map(c=>c.y));return{x,y,w:Math.max(...cells.map(c=>c.x+c.w))-x,h:Math.max(...cells.map(c=>c.y+c.h))-y};};
class ObservedEncounter{
 constructor(number,size,target=6){const spec=specs[number];if(!spec)throw Error('Unsupported encounter');if(!Number.isInteger(target)||target<1||target>30)throw Error('Invalid target');this.number=number;this.kind=spec.kind;this.maxHp=target;this.model=new spec.Model({...size,policy:spec.policy});this.model.start();this.model.hp=target;this.model.maxHp=target;this.model.events=[];this.cueSequence=0;this.wasReady=false;this.refreshCue();}
 inputDown(){const accepted=this.model.inputDown();if(accepted&&['radial','robot'].includes(this.kind)){this.model.counterUntil=this.model.time+.24;this.model.cooldownUntil=this.model.time+.72;}this.refreshCue();return accepted;}
 inputUp(){this.model.inputUp();}
 pause(){return this.model.pause();}
 resume(){return this.model.resume();}
 advance(dt){this.model.advance(dt);this.refreshCue();}
 drain(){return this.model.events.splice(0);}
 refreshCue(){const q=this.model.cue();if(q.ready&&!this.wasReady)this.cueSequence++;this.wasReady=q.ready;this.currentCue={...q,id:this.number+':'+this.cueSequence,verb:q.ready?'tap':'wait',phase:q.ready?'ready':'preview',text:['sun','alien'].includes(this.kind)?q.text:this.kind==='heart'?(q.kind==='orb'?'안쪽 사각이 가까워지면 한 번 눌러 받아치세요.':'초록 경계에 닿기 직전에 한 번 누르세요.'):this.kind==='orbit'?(q.color==='black'?'검은 사각이 손 가까이 오면 받아치세요.':'파란 사각은 일찍 뛰어넘으세요.'):this.kind==='chain'?'내려오는 사슬을 뛰어넘으세요.':this.kind==='wave'?'바닥으로 밀려오는 파동을 넘으세요.':q.ready?'가까이 온 사각을 받아치세요.':'사각이 인물 가까이 오면 한 번 누르세요.'};}
 cue(){return{...this.currentCue};}
 clearReason(){return{sun:'되받아친 탄이 햇살 윤곽에 여섯 번 닿았습니다.',alien:'되받아친 탄이 외계인에게 여섯 번 닿았습니다.',chain:'사슬이 여섯 번 오가는 동안 몸을 피했습니다.',radial:'다가오는 가지를 여섯 번 받아쳤습니다.',wave:'여섯 번 밀려온 파동을 버텼습니다.',robot:'다가오는 팔과 몸을 여섯 번 받아쳤습니다.',orbit:'되돌려 보낸 검은 사각이 여섯 번 닿았습니다.',heart:'초록 경계를 여섯 번 받아쳤습니다.'}[this.kind].replace('여섯 번',this.maxHp+'번');}
 snapshot(endingSeconds=0){
  const m=this.model,et=Number.isFinite(endingSeconds)?Math.max(0,endingSeconds):0;
  // Presentation copy: ending pose may settle, while terminal simulation and
  // receipt remain immutable. No swapping state on the live model.
  const view=Object.assign(Object.create(Object.getPrototypeOf(m)),m,{endingTime:et});
  let a=view.actor();if(['radial','robot'].includes(this.kind)&&et>0)a=view.actor(m.x,m.y,m.angle+et*2);
  if(this.kind==='radial'&&et>0)a.invulnerable=m.time+et<m.invulnerableUntil;
  const cells=a.cells||a.humanCells,b=a.box||a.human||box(cells),body=view.body();
  return{number:this.number,kind:this.kind,state:m.state,time:m.time,width:m.width,height:m.height,hp:m.hp,maxHp:this.maxHp,lives:m.lives,hits:m.hits,successes:m.successes,inputs:m.inputs,policy:m.policy,endingTime:et,hurtUntil:m.hurtUntil||0,body,projectiles:m.projectileCells?m.projectiles.map(p=>({...p,trail:p.trail.map(q=>({...q})),cells:m.projectileCells(p)})):[],orbs:m.orbs?m.orbs():[],actor:{...a,cells,box:b},cue:this.cue(),sourceStatus:'observed-structure-authored-input-and-timing'};
 }
}
const api={ObservedEncounter,specs,box};root.MongyuObservedEncounter=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
