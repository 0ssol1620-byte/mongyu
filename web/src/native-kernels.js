/* R79 functional-kernel bundle. Generated; no original assets. */
(function(root){'use strict';
const structuredClone=root.MongyuStateClone?.clone||root.structuredClone; // R84 snapshot copy binding
const factories={
"evidence/r75-research/collision-native/airborne_adapter.cjs":function(module,exports,require){
"use strict";
// Local u.E branch contract. Does not simulate all u.E predecessors or mission effects.
const base=require("./collision_adapter.cjs");
const i32=x=>x|0,sub=(a,b)=>(a-b)|0;
function resolveAirborneContact({q,modeP,actor,sample,delta,previousX}){
 if(q===3)return {supported:false,reason:"q3-has-separate-boundary-and-transform-path"};
 if(modeP!==0)return {supported:false,reason:"u.p-mode-state-remapping-not-modelled"};
 if(!actor.verticalActive)return {supported:false,reason:"requires-reached-e.Z+a-contact-branch"};
 const F=i32(sample.floor),U=i32(sample.upper),O=i32(sample.otherHeight),C=!!sample.crossed;
 let H=i32(actor.height);const P=i32(actor.p),D=i32(delta),effects=[];
 const out=branch=>({supported:true,branch,height:H,effects,stateRequests:effects.filter(e=>e.op==="request-state").map(e=>e.state)});
 const project=(includingEquality,raw)=>{if(H<F||(includingEquality&&H===F)){effects.push({op:"add-height",delta:sub(F,H),raw});H=F}};
 const reset=raw=>effects.push({op:"request-state",state:0,raw});
 const hit=raw=>{
  // All callers here test p==0 before entering e.IIb.
  effects.push({op:"resource-cue-request",kind:"collision",raw});
  effects.push({op:"rewind-tangent",value:i32(previousX),raw:"0x16808"});
  effects.push({op:"request-state",state:13,raw:"0x16812",caller:raw});
 };
 if(actor.special||actor.state===13||actor.state===16){
  project(true,"0x44238");
  if(actor.o===1)reset("0x44218");
  return out("special-state-project-then-o-reset");
 }
 if(H>F){
  if(U<=0||H>U)return out("above-floor-outside-upper-band");
  if(P===0)hit("0x43ef2");
  // Native re-reads H after e.IIb. This contract assumes its non-exceptional
  // state helper does not change normal height; mission hooks are not run here.
  project(false,"0x43ec6");
  return out(P===0?"upper-band-hit":"upper-band-immune");
 }
 if(P>0){project(false,"0x43f36");return out("positive-cooldown-project-only")}
 if(D>0){
  const penetrates=C?(O<sub(F,32)&&H<sub(F,24)):H<sub(F,16);
  if(penetrates&&P===0)hit("0x44092");
  return out(penetrates?(P===0?"rising-step-hit":"rising-nonzero-cooldown"):"rising-continue");
 }
 if(D===0){
  const canReset=C?(O>=sub(F,32)||H>=sub(F,24)):H>=sub(F,16);
  if(canReset){if(actor.frame!==0)reset("0x440cc");return out(actor.frame!==0?"zero-delta-reset-without-projection":"zero-delta-frame-zero-wait")}
  if(P===0)hit("0x44136");
  return out(P===0?"zero-delta-step-hit":"zero-delta-nonzero-cooldown");
 }
 const safe=!C||O>=sub(F,32)||H>=sub(F,24)||O===-80;
 if(safe){reset("0x44154");project(false,"0x44184");return out("descending-reset-then-project")}
 if(P===0)hit("0x441e6");
 return out(P===0?"descending-step-hit":"descending-nonzero-cooldown");
}
function ordinaryAirborneStep({q,modeP,geometry,previousX,x,direction,actor,frameRow}){
 if(q===3||modeP!==0||!actor.verticalActive)return resolveAirborneContact({q,modeP,actor});
 // Entry is AFTER u.E counter increment, horizontal movement, precontact resets,
 // and dynamic geometry update. Caller must supply the row for this current state.
 if(!Array.isArray(frameRow)&&!ArrayBuffer.isView(frameRow))throw new TypeError("explicit injected frameRow required");
 const sample=base.ordinaryTerrainSample(geometry,previousX,x,direction);
 const delta=base.animationDelta(actor.state,actor.frame,true,actor.height,sample.floor,frameRow);
 const postVertical={...actor,height:(actor.height+delta)|0};
 const contact=resolveAirborneContact({q,modeP,actor:postVertical,sample,delta,previousX});
 return {supported:true,sample,vertical:{before:actor.height,delta,after:postVertical.height},contact};
}
function knownOrdinaryReset0(actor){
 // Verified local field subset of e.d(0) for u.p==0; no sound/render/mission hooks.
 return {...actor,previousState:actor.state,state:0,frame:0,o:0,k:0,verticalActive:false,special:false};
}
module.exports={resolveAirborneContact,ordinaryAirborneStep,knownOrdinaryReset0};

},
"evidence/r75-research/collision-native/boundary-transition.cjs":function(module,exports,require){
"use strict";
// Own research implementation: normal four-side ring, no original tables/assets.
const Assembly=require("../../../experiments/r75-procedural-geometry/assembly.cjs");
const Life=require("../../../experiments/r75-procedural-geometry/lifecycle.cjs");
const Q=require("./q3-adapter.cjs");
const add=(a,b)=>(a+b)|0,sub=(a,b)=>(a-b)|0;
function orientation(t){if(!Number.isInteger(t)||t<0||t>3)throw new RangeError("explicit actor e.t in0..3 required");return t}
function vector(e,f,t){switch(orientation(t)){case 0:return[e|0,f|0];case 1:return[-f|0,e|0];case 2:return[-e|0,-f|0];case 3:return[f|0,-e|0]}}
function read(a,i){if(!a||i<0||i>=a.length)throw new RangeError("native direct array access");return a[i]|0}
function transformEntities(entities,surface,t,toWorld){
 orientation(t);if(!Array.isArray(entities))throw new TypeError("explicit y object array required");
 const transform=(x,y)=>{
  if(toWorld)return Q.rot384(add(x,surface.scalarE),sub(surface.scalarF,y),t);
  const p=Q.rot384(x,y,(4-t)%4);return[sub(p[0],surface.scalarE),sub(surface.scalarF,p[1])];
 };
 // Mutates in native array order. Null skipped; y.a==0 is NOT skipped.
 for(const y of entities){if(y===null)continue;
  [y.n,y.o]=transform(y.n,y.o);
  if(y.c!==null){for(let i=y.c.length-1;i>=0;i--){const p=transform(read(y.c,i),read(y.d,i));y.c[i]=p[0];y.d[i]=p[1]}}
  [y.e,y.f]=vector(y.e,y.f,toWorld?t:(4-t)%4);
 }
 return entities;
}
function entitiesToWorld(entities,surface,t){return transformEntities(entities,surface,t,true)}
function entitiesToLocal(entities,surface,t){return transformEntities(entities,surface,t,false)}
function createState(input){
 if(!input||!input.actor||!input.controller||!input.mission)throw new TypeError("explicit pool, actor, controller and mission required");
 const state=structuredClone(input);state.pool=Assembly.createExistingAssembly(input.pool);
 orientation(state.actor.orientation);
 if(!Array.isArray(state.entities))throw new TypeError("explicit complete y entities required (separate from assembly subset)");
 return state;
}
function current(s){return s.pool.objects[s.pool.currentIndex]}
function syncEntitySubset(s){s.pool.entities=s.entities.map(y=>y===null?null:{a:y.a,n:y.n,c:y.c===null?null:[...y.c]})}
function switchSide(s,forward){
 // Native e.b/e.c changes actor orientation BEFORE pool search/current writes.
 const oldIndex=s.pool.currentIndex,oldOrientation=s.actor.orientation;
 s.actor.orientation=(oldOrientation+(forward?1:3))%4;
 s.pool.direction=s.actor.direction;syncEntitySubset(s);
 s.pool=Assembly.switchSide(s.pool,forward,s.controller.q);
 return {oldIndex,newIndex:s.pool.currentIndex,oldOrientation,newOrientation:s.actor.orientation};
}
function resetAllSides(s){for(const side of s.pool.objects)side.geometry=Life.resetHeight(side.geometry,16)}
function advance(s,amount){const side=current(s);side.position=Q.tangentMove({x:side.position,direction:s.actor.direction,amount,modeM:s.pool.shape.m,modeN:s.pool.n,length:side.geometry.activeLength})}
function positionAtEntry(s){
 if(s.controller.modeP!==0)throw new RangeError("alternate u.p placement excluded");
 const side=current(s),N=side.geometry.activeLength;
 side.position=s.actor.direction===0?48:16*N-64;
 const i=Math.max(0,Math.min(N-1,Math.trunc(side.position/16)));
 s.actor.height=read(side.geometry.columns.c,i);s.actor.verticalActive=false;s.actor.special=false;
}
function event(s,operation,raw,detail={}){const e={operation,raw,...detail};s.trace.push(e);return e}
function* external(s,operation,raw,detail={}){
 const e=event(s,operation,raw,detail);
 const ack=yield {...e,state:s,requiresAcknowledgement:true};
 if(!ack||ack.handled!==true)throw new Error("unresolved native continuation: "+operation);
}
function* completedBoundary(input,{rng}={}){
 const s=createState(input);s.trace=[];
 if(s.controller.modeP!==0)return{supported:false,reason:"alternate-u.p-mode",state:s};
 if(s.actor.state!==12||s.actor.k!==1)return{supported:false,reason:"requires-reached-state12-completion",state:s};
 if(typeof rng!=="function")throw new TypeError("explicit gameplay A RNG required");
 // Tutorial timer continues into the same random branch; it is not a return.
 if(s.controller.tutorial){s.controller.timerS=-20;event(s,"tutorial-timer", "0x44d4c")}
 const choice=rng(100);event(s,"rng-A","0x448a4",{bound:100,value:choice});
 let transition=null,kind;
 if(choice<s.actor.s){
  kind="reverse";s.actor.direction=1-s.actor.direction;s.pool.direction=s.actor.direction;s.actor.p=4;s.actor.s=sub(s.actor.s,4);
  yield* external(s,"request-state","0x44902",{requested:14});
  if(s.controller.q===3){advance(s,32);event(s,"advance32","0x44a70")}
 }else{
  kind="turn";const old=current(s),oldT=s.actor.orientation;
  entitiesToWorld(s.entities,old,oldT);event(s,"entities-to-world","0x44a7a");
  let world;
  if(s.controller.q===3){
   world=Q.rot384(add(old.position,old.scalarE),add(sub(old.scalarF,s.actor.height),8),oldT);
   s.actor.b=world[0];s.actor.height=world[1];event(s,"actor-world-temporary","0x44d20/0x44d38");
  }else{resetAllSides(s);event(s,"reset-all-height16","0x44aa0")}
  transition=switchSide(s,s.actor.direction===0);event(s,"switch-side","0x44ab8/0x44c96",transition);
  if(s.controller.q===3){
   const p=Q.rot384(s.actor.b,s.actor.height,-s.actor.orientation),side=current(s);
   side.position=sub(p[0],side.scalarE);s.actor.height=sub(side.scalarF,p[1]);advance(s,32);event(s,"actor-rebase-advance32","0x44c46/0x44c88");
  }
  entitiesToLocal(s.entities,current(s),s.actor.orientation);event(s,"entities-to-local","0x44ad0");
  s.actor.p=4;s.actor.s=add(s.actor.s,1);
  yield* external(s,"request-state","0x44afe",{requested:0});
 }
 // Common continuation is reached by reversal too, without changing side.
 if(s.pool.shape.m===3){s.pool.af=s.pool.n;event(s,"arm-shape-af","0x44a64",{value:s.pool.af})}
 if(s.controller.q!==3)yield* external(s,"regenerate-current","0x4494c",{primitive:s.controller.aj,argument:0,currentIndex:s.pool.currentIndex});
 if(s.controller.az===1){
  s.entities=s.entities.map(()=>null);event(s,"clear-entities","0x44a3a");
  yield* external(s,"configure-cells","0x44a4e",{configuration:s.controller.ak});
 }
 if(s.controller.q!==3)yield* external(s,"populate-objects","0x44970");
 if(s.controller.tutorial){if(s.controller.tutorialStage===0){s.controller.timerS=-20;event(s,"tutorial-timer","0x449dc")}}
 else if(s.controller.scoreU>5){
  const draw=rng(1000);event(s,"rng-A","0x449fc",{bound:1000,value:draw});
  if(draw<=49){s.controller.aF=add(rng(30),45);s.controller.D=10;event(s,"set-aF-D","0x44a1c/0x44a26");yield* external(s,"request-state","0x44a30",{requested:0})}
 }
 if(s.controller.q!==3){positionAtEntry(s);event(s,"place-at-entry","0x449ae")}
 // This is condition credit r.A, not run score or frontier award.
 s.mission.credit=current(s).position;event(s,"write-condition-credit","0x449ce->0x44726",{value:s.mission.credit});
 syncEntitySubset(s);
 return{supported:true,kind,transition,state:s,continuation:"u.E precontact 0x420f6",fullRuntimeEquivalence:false};
}
function beginRelocation(input){
 const s=createState(input);s.trace=[];
 if(s.controller.modeP!==0||s.controller.q!==3)throw new RangeError("requires q3/u.p0");
 const old=current(s);s.relocationOrigin=Q.relocationOrigin(old.position,s.actor.height,s.actor.orientation);
 entitiesToWorld(s.entities,old,s.actor.orientation);event(s,"entities-to-world","0x44df8");
 s.entitiesSpace="world";return s;
}
function relocationAngle(oldAngle,candidate,margins){
 let angle=oldAngle|0;const writes=[],{cx,cy}=candidate,{mx,my}=margins;
 // Independent tests in this exact order; later matches overwrite earlier ones.
 for(const [match,value,raw]of [[cx===mx,270,"0x452ae"],[cy===my,180,"0x4529c"],[cx===23-mx,90,"0x45290"],[cy===23-my,0,"0x45284"]])if(match){angle=value;writes.push({raw,value})}
 return{angle,writes};
}
function* finishRelocation(prepared,accepted,margins){
 if(prepared.entitiesSpace!=="world"||!accepted.accepted)throw new TypeError("beginRelocation state and accepted candidate required");
 orientation(accepted.orientation);
 const s=structuredClone(prepared),a=s.actor;
 a.direction=accepted.draws[3].value;s.pool.direction=a.direction;event(s,"draw-direction","0x4509c",{value:a.direction});
 const n=relocationAngle(a.n,accepted.candidate,margins);a.n=n.angle;event(s,"set-heading-angle","0x452ae..0x45284",{writes:n.writes});
 a.p=10;
 // Four-side adapter domain: next traversal must agree with target orientation.
 while(a.orientation!==accepted.orientation){const t=switchSide(s,true);event(s,"switch-side","0x45150",t)}
 a.direction=accepted.direction;s.pool.direction=a.direction;
 current(s).position=accepted.x;a.height=accepted.height;event(s,"write-relocated-position","0x451a0/0x451ae");
 entitiesToLocal(s.entities,current(s),a.orientation);s.entitiesSpace="local";event(s,"entities-to-local","0x451b6");
 yield* external(s,"request-state","0x451c8",{requested:4});
 syncEntitySubset(s);
 return{supported:true,state:s,continuation:"u.E contact setup 0x4210a (skips e.o check at0x420f6)",fullRuntimeEquivalence:false};
}
module.exports={vector,entitiesToWorld,entitiesToLocal,createState,switchSide,positionAtEntry,completedBoundary,beginRelocation,relocationAngle,finishRelocation};

},
"evidence/r75-research/collision-native/collision_adapter.cjs":function(module,exports,require){
"use strict";
// Clean-room research kernels, not a complete actor/collision engine.
// Inputs are caller-supplied metadata or synthetic arrays; no original table payload.
const i32=x=>x|0, add=(a,b)=>(a+b)|0, sub=(a,b)=>(a-b)|0;
const mul=(a,b)=>Math.imul(a,b), div=(a,b)=>Math.trunc(i32(a)/b)|0;
const signedByte=x=>(x<<24)>>24;
function read(a,index,byte=false){
 if(a==null)throw new TypeError("null native array");
 if(index<0||index>=a.length)throw new RangeError("native array bounds");
 return byte?signedByte(a[index]):i32(a[index]);
}
function probeIndex(x,distance,direction){
 return div(direction===0?add(add(x,distance),8):sub(x,distance),16);
}
function lookaheadHeight(c,x,direction){
 try{return read(c,probeIndex(x,0,direction))}catch(e){if(e instanceof TypeError||e instanceof RangeError)return 0;throw e}
}
function lookaheadFlag(h,x,distance,direction){
 try{return read(h,probeIndex(x,distance,direction),true)}catch(e){if(e instanceof TypeError||e instanceof RangeError)return 0;throw e}
}
function lookaheadDelta(c,x,distance,direction){
 try{
  const current=read(c,probeIndex(x,0,direction));
  if(current===-80)return 0;
  const next=read(c,probeIndex(x,distance,direction));
  return next===-80?0:sub(next,current);
 }catch(e){if(e instanceof TypeError||e instanceof RangeError)return 0;throw e}
}
function ordinaryTerrainSample({c,d,h,i},previousX,x,direction){
 // Precondition: ordinary q!=3 terrain branch, current/previous indices valid.
 // Unlike the small probes, this kernel propagates bounds errors: enclosing native
 // recovery is not established. It returns evidence operands, not a final hit.
 const decreasing=previousX>x,bias=decreasing?0:15;
 let selected=div(add(x,bias),16),other=selected;
 const previous=div(add(previousX,bias),16);
 let crossed=selected!==previous;
 if(crossed){
  const a=read(c,selected),b=read(c,previous);
  if(a<b){other=selected;selected=previous}
  else if(a>b)other=previous;
  else crossed=false;
 }
 let floor=read(c,selected),otherHeight=read(c,other);
 let upper=read(h,selected,true);
 if(upper!==0){upper=floor;floor=read(d,selected)}
 if(crossed&&((!decreasing&&selected<other)||(direction===1&&selected>other)))otherHeight=floor;
 const special=read(i,selected,true)===1;
 if(special&&upper!==0){floor=16;otherHeight=16;upper=-1}
 return {selected,other,previous,crossed,decreasing,floor,upper,otherHeight,special};
}
function groundedContact(sample,actorHeight,p){
 // Reached ordinary !e.Z+a branch only, after vertical update. Not q3 or airborne.
 const {floor,upper,otherHeight,crossed}=sample;
 let hitReason=null;
 if(p===0){
  if(upper>0)hitReason="upper-band";
  else if(crossed&&otherHeight>=sub(floor,32)&&actorHeight<sub(floor,32))hitReason="crossed-near-step";
  else if(crossed&&otherHeight<sub(floor,32)&&actorHeight<sub(floor,16))hitReason="crossed-large-step";
 }
 return {requestsState:hitReason?13:null,hitReason,projectedHeight:Math.max(actorHeight,floor),rewindOnHit:!!hitReason};
}
function animationDelta(state,frame,airborne,actorHeight,floor,row){
 // Corresponds only to ordinary terrain vertical update at 0x4237c..4240e.
 if(!airborne)return actorHeight>floor?-24:0;
 if(state===0||state===1)return -24;
 const count=read(row,0,true);
 if(count===0)throw new RangeError("native arithmetic division by zero");
 return read(row,add(i32(frame)%count,1),true);
}
function rectangleContains({originX,originY,pointX,pointY,width,height,tangentOffset,normalOffset,direction,coefficients}){
 // u.(IIIIIIIII)Z+a: first legacy argument is unused. Inclusive edges.
 const {i0,j0,k0,k3,l0,l3}=coefficients;
 const tangent=direction===1?i32(-tangentOffset):i32(tangentOffset);
 const dx=add(mul(k0,tangent),mul(k3,normalOffset));
 const dy=add(mul(l0,tangent),mul(l3,normalOffset));
 const hx=add(div(mul(i0,width),2),div(mul(j0,height),2));
 const hy=add(div(mul(i0,height),2),div(mul(j0,width),2));
 const cx=add(originX,dx),cy=add(originY,dy);
 const bounds={left:sub(cx,hx),right:add(cx,hx),bottom:sub(cy,hy),top:add(cy,hy)};
 return {inside:pointX>=bounds.left&&pointX<=bounds.right&&pointY>=bounds.bottom&&pointY<=bounds.top,bounds};
}
function cooldownTick(p,state){return p>0&&![13,16,11].includes(state)?sub(p,1):p}
function damageCooldownAllows(requestedState,p){return ![13,16].includes(requestedState)||p===0}
function damageLeaf(lives,tutorial){
 // ONLY the reached 0x16c8a leaf, after other state/frontier/mission guards.
 return tutorial?{lives,p:0,s:1000}:{lives:sub(lives,1),p:20};
}
function fatalAnimationGate(lives,state,counter){return lives<=0&&[13,16].includes(state)&&counter>7}
module.exports={probeIndex,lookaheadHeight,lookaheadFlag,lookaheadDelta,ordinaryTerrainSample,groundedContact,animationDelta,rectangleContains,cooldownTick,damageCooldownAllows,damageLeaf,fatalAnimationGate};

},
"evidence/r75-research/collision-native/q3-adapter.cjs":function(module,exports,require){
"use strict";
// Research kernels for q3; no original masks/animation rows or engine integration.
const C=require("./collision_adapter.cjs"),A=require("./airborne_adapter.cjs");
const div=(x,n)=>Math.trunc((x|0)/n)|0,add=(a,b)=>(a+b)|0,sub=(a,b)=>(a-b)|0;
const abs32=x=>x===-2147483648?x:Math.abs(x);
const byte=x=>(x<<24)>>24;
function at(a,i){if(!a||i<0||i>=a.length)throw new RangeError("native profile bounds");return a[i]|0}
function rot384(x,y,t){
 const n=((t|0)+4)%4;
 if(n===0)return [x|0,y|0];if(n===1)return [y|0,sub(384,x)];
 if(n===2)return [sub(384,x),sub(384,y)];if(n===3)return [sub(384,y),x|0];
 throw new RangeError("rotation outside verified caller domain");
}
function classifyBoundary({c,x,height,direction,modeP=0}){
 if(modeP!==0)return {supported:false,reason:"alternate-u.p-mode"};
 if(x< -16||x>400||height< -32)return {supported:true,kind:"relocation",raw:"0x44d6e/0x453c0"};
 const column=direction===0?Math.min(div(add(x,15),16),22):Math.max(div(x,16),1);
 const next=column+(direction===0?1:-1),currentHeight=at(c,column),nextHeight=at(c,next);
 return {supported:true,kind:sub(nextHeight,currentHeight)>96||nextHeight===-1?"wall":"columns",column,next,currentHeight,nextHeight};
}
function columnStep({geometry,previousX,x,direction,actor,frameRow,modeP=0}){
 if(modeP!==0)return {supported:false,reason:"alternate-u.p-mode"};
 if(!Array.isArray(frameRow)&&!ArrayBuffer.isView(frameRow))throw new TypeError("explicit injected frame row required");
 const rowCount=byte(at(frameRow,0));
 const index=div(add(x,previousX>x?0:15),16);
 if(index<0||index>23){
  let delta=0;
  if(actor.verticalActive&&!actor.special){
   if([0,1,2].includes(actor.state))delta=-24;
   else {const n=rowCount;if(n===0)throw new RangeError("native divide by zero");delta=byte(at(frameRow,add((actor.frame|0)%n,1)))}
  }
  return {supported:true,branch:"q3-outside-column-no-terrain-contact",index,delta,height:add(actor.height,delta),effects:delta?[{op:"add-height",delta}]:[]};
 }
 const previous=div(add(previousX,previousX>x?0:15),16);
 if(previous<0||previous>23)return {supported:false,reason:"prior-column-direct-array-exception-unresolved",index,previous};
 const sample=C.ordinaryTerrainSample(geometry,previousX,x,direction);
 const delta=C.animationDelta(actor.state,actor.frame,actor.verticalActive,actor.height,sample.floor,frameRow);
 const post={...actor,height:add(actor.height,delta)};
 // Verified q3 in-range dispatch returns to the SAME local contact body.
 // The earlier airborne module's q guard is a caller-domain guard only.
 const contact=post.verticalActive?A.resolveAirborneContact({q:0,modeP:0,actor:post,sample,delta,previousX}):C.groundedContact(sample,post.height,post.p);
 return {supported:true,branch:"q3-shared-column-contact",index,sample,vertical:{before:actor.height,delta,after:post.height},contact};
}
function maskReader(mask){if(typeof mask!=="function")throw new TypeError("caller supplied mask(x,y) required");return (x,y)=>!!mask(Math.max(0,Math.min(23,x|0)),Math.max(0,Math.min(23,y|0)))}
function relocationMargins(mask){
 const read=maskReader(mask);let mx=0,my=0;
 outerX:for(let edge=0;edge<=7;edge++)for(let row=0;row<=23;row++)if(read(edge,row)||read(23-edge,row)){mx=edge;break outerX}
 // Native second scan tests row=edge, x=j or23-j; it does NOT test23-edge rows.
 outerY:for(let edge=0;edge<=7;edge++)for(let col=0;col<=23;col++)if(read(col,edge)||read(23-col,edge)){my=edge;break outerY}
 return {mx,my};
}
function relocationAttempt({mask,rng,margins,oldWorld,currentOrientation}){
 const read=maskReader(mask);if(typeof rng!=="function")throw new TypeError("explicit gameplay RNG callback required");
 const {mx,my}=margins;let cx,cy,dx,dy;const draws=[];
 const draw=bound=>{const value=rng(bound);if(!Number.isInteger(value)||value!==(value|0))throw new TypeError("rng must return signed int32");draws.push({bound,value});return value};
 if(draw(2)===0){cx=add(Math.imul(23-2*mx,draw(2)),mx);cy=add(add(draw(22-2*my),1),my);dx=0;dy=1}
 else {cx=add(add(draw(22-2*mx),1),mx);cy=add(Math.imul(23-2*my,draw(2)),my);dx=1;dy=0}
 const candidate={cx,cy,dx,dy};
 if(read(cx,cy)||read(cx+dx,cy+dy)||read(cx-dx,cy-dy))return {accepted:false,retry:true,reason:"occupied-triplet",candidate,draws};
 if(abs32(sub(oldWorld[0],Math.imul(cx,16)))<=79&&abs32(sub(oldWorld[1],Math.imul(cy,16)))<=79)return {accepted:false,retry:true,reason:"too-near",candidate,draws};
 let direction=draw(2),orientation,localX,localHeight;
 if(dx===1&&cy>11){orientation=0;localX=cx*16;localHeight=(23-cy)*16}
 else if(dy===1&&cx>11){orientation=1;localX=(23-cy)*16;localHeight=(23-cx)*16}
 else if(dx===1){orientation=2;localX=(23-cx)*16;localHeight=cy*16}
 else {orientation=3;localX=cy*16;localHeight=cx*16}
 const margin=orientation%2===0?mx:my;
 if(localX<(margin+4)*16)direction=0;
 else if(localX>(19-margin)*16)direction=1;
 return {accepted:true,retry:false,candidate,draws,orientation,forwardSurfaceSteps:(orientation-currentOrientation+4)%4,x:localX|0,height:localHeight|0,direction,p:10,stateRequest:4,effects:["requires u.A once before search loop","repeat e.b until target orientation","write g.a/e.a","u.B","request state4"]};
}
function relocationOrigin(x,height,orientation){return rot384(x,sub(376,height),orientation)}
function tangentMove({x,direction,amount,modeM=0,modeN=0,length=24}){
 let step=amount|0;
 if(modeM===4&&abs32(sub(x,Math.imul(length-1,8)))<=16&&modeN<0)step=div(step,2);
 return add(x,direction===0?step:-step);
}
function turnProjection({oldSurface,newSurface,oldActorOrientation,newActorOrientation,x,height,direction,modeM=0,modeN=0}){
 if(!Number.isInteger(oldActorOrientation)||!Number.isInteger(newActorOrientation))throw new TypeError("explicit e.t orientations required");
 const world=rot384(add(x,oldSurface.e),add(sub(oldSurface.f,height),8),oldActorOrientation);
 const local=rot384(world[0],world[1],-newActorOrientation);
 const beforeAdvance=sub(local[0],newSurface.e),nextHeight=sub(newSurface.f,local[1]);
 return {world,beforeAdvance,height:nextHeight,x:tangentMove({x:beforeAdvance,direction,amount:32,modeM,modeN,length:newSurface.length}),effects:["u.A","e.b if direction0 else e.c","coordinate rebase","e.a(32)","u.B"]};
}
function wallDecision({state,p,k,verticalActive,direction,s,tutorial=false,rng,modeP=0}){
 if(modeP!==0)return {supported:false,reason:"alternate-u.p-mode"};
 if(state===12){
  if(k!==1)return {supported:true,kind:"wait-state12"};
  if(tutorial)return {supported:true,kind:"tutorial-timer",s:-20,handlerComplete:false,continuation:{raw:"0x44d50->0x4489e",operation:"continue RNG100 reverse-or-turn; use boundary-transition.completedBoundary"}};
  if(typeof rng!=="function")throw new TypeError("explicit gameplay RNG required after state12 completion");
  const draw=rng(100);
  if(draw<s)return {supported:true,kind:"reverse",draw,direction:1-direction,p:4,s:sub(s,4),stateRequest:14,advance:32};
  return {supported:true,kind:"turn-surface",draw,direction,p:4,s:add(s,1),stateRequest:0};
 }
 if(state===13||state===16)return {supported:true,kind:"skip-hurt-state"};
 if(p!==0)return {supported:true,kind:"request-state12",stateRequest:12};
 return {supported:true,kind:"wall-damage",setSpecial:!!verticalActive,stateRequest:13,missionEffects:"not modelled; subsequent native credit hooks remain caller-owned"};
}
module.exports={rot384,classifyBoundary,columnStep,maskReader,relocationMargins,relocationAttempt,relocationOrigin,tangentMove,turnProjection,wallDecision};

},
"experiments/r75-procedural-geometry/assembly.cjs":function(module,exports,require){
'use strict';
// Explicit four-object assembly only. Origin/orientation transforms, dynamic
// length policy and packed masks are not inferred from shape m/n here.
const G=require('./geometry.cjs'),L=require('./lifecycle.cjs');
function int32(value,label){if(!Number.isInteger(value)||value<-2147483648||value>2147483647)throw new RangeError(label+' must be a non-overflowing signed integer');return value;}
function index(value,label){if(!Number.isInteger(value)||value<0||value>3)throw new RangeError(label+' must be 0..3');return value;}
function link(value,label){return value===null?null:index(value,label);}
function createExistingAssembly(input){
 if(!input||!Array.isArray(input.objects)||input.objects.length!==4)throw new TypeError('explicit four-object pool required');
 const objects=input.objects.map((entry,i)=>{
  if(!entry)throw new TypeError('normal four-object pool requires object '+i);
  return {geometry:L.createExisting(entry.geometry),position:int32(entry.position,'g.I+a position'),scalarE:int32(entry.scalarE,'scalarE'),scalarF:int32(entry.scalarF,'scalarF'),linkA:link(entry.linkA,'linkA'),linkB:link(entry.linkB,'linkB')};
 });
 const shape={};for(const key of ['m','n','ag','ah']){
  const value=input.shape&&input.shape[key];if(!Number.isInteger(value)||value<-128||value>127)throw new RangeError('explicit signed shape.'+key+' required');shape[key]=value;
 }
 if(!Array.isArray(input.entities))throw new TypeError('explicit entities array required');
 const entities=input.entities.map(entity=>{
  if(entity===null)return null;
  if(!entity||!(entity.c===null||Array.isArray(entity.c)))throw new TypeError('entity {a,n,c:null|array} required');
  return {a:int32(entity.a,'entity.a'),n:int32(entity.n,'entity.n'),c:entity.c===null?null:entity.c.map(v=>int32(v,'entity.c'))};
 });
 return {objects,currentIndex:index(input.currentIndex,'currentIndex'),shape,af:int32(input.af,'af'),n:int32(input.n,'dynamic n'),shapeIndex:int32(input.shapeIndex,'shapeIndex'),direction:int32(input.direction,'direction'),entities,
  originalRuntimeFullEquivalence:false,originalGeometryPayloadIncluded:false};
}
function adjustMutable(pool,current){
 const a=pool.objects[current],N=a.geometry.activeLength;
 // g.b @0x18aa4 handles b/next first, then a/previous (control-flow order,
 // not ascending raw address order). These are scalar
 // g.I+e/f/c/d fields, not arrays; linked object's lengths can differ.
 if(a.linkB!==null){
  const b=pool.objects[a.linkB],span=int32(16*N-16,'current span');
  b.scalarE=int32(384-a.scalarF,'next E');b.scalarF=int32(a.scalarE+span,'next F');
  b.geometry.scalarC=0;a.geometry.scalarD=span;
 }
 if(a.linkA!==null){
  const p=pool.objects[a.linkA],span=int32(16*p.geometry.activeLength-16,'previous span');
  p.scalarE=int32(a.scalarF-span,'previous E');p.scalarF=int32(384-a.scalarE,'previous F');
  p.geometry.scalarD=span;a.geometry.scalarC=0;
 }
}
function adjustNeighbors(input,currentIndex){
 const pool=createExistingAssembly(input);adjustMutable(pool,index(currentIndex,'adjustment currentIndex'));return pool;
}
function resizeFour(input,shape,rngA,shapeIndex){
 int32(shapeIndex,'explicit shapeIndex');
 const pool=createExistingAssembly(input),selected=G.selectColumnCount(shape,rngA),trace=[];
 // u.f makes one count draw shared by all four objects. Link adjustment starts
 // only after every object has its new active length.
 for(let i=0;i<4;i++){pool.objects[i].geometry=L.resize(pool.objects[i].geometry,selected.N);trace.push({operation:'resize',index:i,requestedLength:selected.N});}
 for(let i=0;i<4;i++){adjustMutable(pool,i);trace.push({operation:'adjust-neighbors',index:i});}
 pool.shape={m:selected.m,n:selected.n,ag:selected.ag,ah:selected.ah};pool.n=selected.n;pool.shapeIndex=shapeIndex;pool.af=0;
 return {pool,selectedShape:selected,trace,originalRuntimeFullEquivalence:false};
}
function generateCurrentProcedural(input,{behaviorCode,primitive,col8,group,z,rngA}={}){
 int32(behaviorCode,'explicit behaviorCode');
 if(behaviorCode===3)throw new RangeError('unimplemented q3 gate: process four oriented mask profiles, not one procedural object');
 const pool=createExistingAssembly(input),i=pool.currentIndex,N=pool.objects[i].geometry.activeLength;
 if(N>127)throw new RangeError('active N cannot be represented by the strict signed-byte shape generator');
 const result=G.generatePrimitive({primitive,col8,group,z,rngA,
  shape:{m:pool.shape.m,n:pool.shape.n,ag:N,ah:N},initialColumns:L.activeColumns(pool.objects[i].geometry)});
 pool.objects[i].geometry=L.applyPrimitiveResult(pool.objects[i].geometry,result);
 return {pool,result,generatedIndices:[i],globalScalarWrites:{...result.scalarWrites},originalRuntimeFullEquivalence:false};
}
function normalizeOrientation(value){
 int32(value,'orientation');const normalized=int32(value+4,'orientation+4')%4;
 if(normalized<0)throw new RangeError('negative Java orientation remainder is outside the reviewed normal domain');
 return normalized===0?0:normalized;
}
function rotatePoint(x,y,orientation){
 int32(x,'x');int32(y,'y');
 const r=normalizeOrientation(orientation);
 const coordinates=r===0?[x,y]:r===1?[y,int32(384-x,'rotated y')]:r===2?[int32(384-x,'rotated x'),int32(384-y,'rotated y')]:[int32(384-y,'rotated x'),x];
 return {x:coordinates[0],y:coordinates[1],orientation:r,coordinateSpace:'native 384-unit point transform; terrain binding unspecified',originalRuntimeFullEquivalence:false};
}
function translateFrames(input,dx,dy,referenceOrientation){
 int32(dx,'dx');int32(dy,'dy');const reference=normalizeOrientation(referenceOrientation),pool=createExistingAssembly(input);
 for(const entry of pool.objects){
  const r=(normalizeOrientation(entry.geometry.orientation)+4-reference)%4;
  const [de,df]=r===0?[dx,dy]:r===1?[-dy,dx]:r===2?[-dx,-dy]:[dy,-dx];
  entry.scalarE=int32(entry.scalarE+de,'translated E');entry.scalarF=int32(entry.scalarF+df,'translated F');
 }
 return pool;
}
function createFreshRing({shape,af,n,shapeIndex,direction,entities}={}){
 // Constructor facts initialize g objects only. Global shape/control state is
 // required from the caller instead of borrowing a synthetic reference default.
 const fresh=()=>({geometry:L.createFresh(),position:0,scalarE:0,scalarF:0,linkA:null,linkB:null});
 const pool={objects:[fresh(),null,null,null]};pool.objects[0].position=16;
 for(let i=1;i<4;i++){
  const tail=pool.objects[i-1],next=fresh();pool.objects[i]=next;tail.linkB=i;next.linkA=i-1;
  next.geometry.orientation=(tail.geometry.orientation+1)%4;
  next.scalarE=384-tail.scalarF;next.scalarF=tail.scalarE+16*tail.geometry.activeLength;
  next.geometry.scalarC=0;adjustMutable(pool,0);tail.geometry.scalarD=16*tail.geometry.activeLength-16;
 }
 const first=pool.objects[0],last=pool.objects[3];first.linkA=3;last.linkB=0;
 last.geometry.orientation=(first.geometry.orientation+3)%4;
 last.scalarE=first.scalarF-16*last.geometry.activeLength;last.scalarF=384-first.scalarE;last.geometry.scalarD=16*last.geometry.activeLength-16;
 adjustMutable(pool,0);first.geometry.scalarC=0;
 return createExistingAssembly({...pool,currentIndex:0,shape,af,n,shapeIndex,direction,entities});
}
function resizeDeltaMutable(pool,delta){
 int32(delta,'delta');
 for(const entry of pool.objects)entry.geometry=L.resize(entry.geometry,int32(entry.geometry.activeLength+delta,'new length'));
 for(let i=0;i<4;i++)adjustMutable(pool,i);
 const current=pool.objects[pool.currentIndex];
 if(pool.direction===0&&current.position>8*current.geometry.activeLength){
  const shift=int32(delta*16,'requested delta shift');current.position=int32(current.position+shift,'shifted position');
  for(let i=pool.entities.length-1;i>=0;i--){const entity=pool.entities[i];if(entity!==null&&entity.a!==0){
   entity.n=int32(entity.n+shift,'shifted entity n');
   if(entity.c!==null)for(let j=entity.c.length-1;j>=0;j--)entity.c[j]=int32(entity.c[j]+shift,'shifted entity c');
  }}
 }
}
function resizeDelta(input,delta){const pool=createExistingAssembly(input);resizeDeltaMutable(pool,delta);return pool;}
function draw(rng,bound){if(typeof rng!=='function')throw new TypeError('explicit bounded rngA required');const v=rng(bound);if(!Number.isInteger(v)||v<0||v>=bound)throw new RangeError('bounded RNG result required');return v;}
function shapeDirection(af){if(!Number.isInteger(af)||af<0||af>2)throw new RangeError('direction table af must be 0..2');return [1,-1,1][af];}
function tickShape(input,rngA){
 if(typeof rngA!=='function')throw new TypeError('explicit bounded rngA required');
 const pool=createExistingAssembly(input),current=pool.objects[pool.currentIndex],{m,ag,ah}=pool.shape;
 if(m===1){
  if(draw(rngA,100)<pool.n){const delta=draw(rngA,3)-1;resizeDeltaMutable(pool,delta);if(pool.shapeIndex===0||pool.shapeIndex===2)resizeDeltaMutable(pool,delta);}
 }else if(m===2){
  if(draw(rngA,100)<pool.n){resizeDeltaMutable(pool,draw(rngA,2)*shapeDirection(pool.af));if(current.geometry.activeLength<=ag)pool.af=0;if(current.geometry.activeLength>=ah)pool.af=1;}
 }else if(m===3){
  if(pool.af>0){resizeDeltaMutable(pool,draw(rngA,3)-1);pool.af--;}
 }else if(m===4){
  pool.n=int32(pool.n-1,'dynamic n decrement');
  if(Math.abs(current.position-8*(current.geometry.activeLength-1))<=16&&pool.n<0){
   resizeDeltaMutable(pool,3*shapeDirection(pool.af));
   const N=current.geometry.activeLength,target=N<=ag?ag:N>=ah?ah:null;
   if(target!==null){resizeDeltaMutable(pool,int32(target-N,'clamp delta'));pool.n=20+draw(rngA,30);pool.af=(pool.af+1)&1;}
   current.position=8*current.geometry.activeLength-24;
  }
 }
 return pool;
}
function switchSide(input,forward,behaviorCode){
 if(typeof forward!=='boolean')throw new TypeError('explicit forward boolean required');int32(behaviorCode,'behaviorCode');
 const pool=createExistingAssembly(input),old=pool.objects[pool.currentIndex],destination=old[forward?'linkB':'linkA'];
 if(destination===null)throw new RangeError('unmodeled missing destination exception path');
 pool.currentIndex=destination;const next=pool.objects[destination];
 if(behaviorCode!==3)next.position=forward?32:int32(next.geometry.scalarD-32,'reverse entry position');
 return pool;
}
function armShapeAtBoundary(input){const pool=createExistingAssembly(input);if(pool.shape.m===3)pool.af=pool.n;return pool;}
function moveCurrent(input,step){
 int32(step,'step');const pool=createExistingAssembly(input),current=pool.objects[pool.currentIndex];
 if(pool.shape.m===4&&pool.n<0&&Math.abs(current.position-8*(current.geometry.activeLength-1))<=16)step=Math.trunc(step/2);
 current.position=int32(current.position+(pool.direction===0?step:-step),'moved position');return pool;
}
function projectSurfacePoint(input,objectIndex,column){
 const pool=createExistingAssembly(input),entry=pool.objects[index(objectIndex,'objectIndex')];
 if(!Number.isInteger(column)||column<0||column>=entry.geometry.activeLength)throw new RangeError('active surface column required');
 const height=entry.geometry.columns.c[column],localX=int32(entry.scalarE+16*column,'surface x'),localY=int32(entry.scalarF-height,'surface y');
 return {...rotatePoint(localX,localY,entry.geometry.orientation),objectIndex,column,height,localX,localY,
  coordinateSpace:'native logical terrain surface coordinate',sentinelValue:height===-1||height===-80?height:null,
  renderability:'not evaluated; tile flags, sentinels, clipping and decoration remain separate'};
}
function toScreen(point,originX,originY){
 int32(originX,'explicit screen originX');int32(originY,'explicit screen originY');
 return {x:int32(Math.trunc(int32(point.x*10,'scaled x')/16)+originX,'screen x'),y:int32(Math.trunc(int32(point.y*10,'scaled y')/16)+originY,'screen y'),coordinateSpace:'screen with explicit caller-provided origin',originalRuntimeFullEquivalence:false};
}
module.exports=Object.freeze({createExistingAssembly,createFreshRing,adjustNeighbors,resizeFour,generateCurrentProcedural,rotatePoint,translateFrames,resizeDelta,tickShape,switchSide,armShapeAtBoundary,moveCurrent,projectSurfacePoint,toScreen});

},
"experiments/r75-procedural-geometry/cell-entity-runtime.cjs":function(module,exports,require){
'use strict';
// Isolated native entity consumers. No asset/record payload and no product hookup.
const Policy=require('./cell-factory.cjs');
const INTEGER_FIELDS=Object.freeze('abcdefghijklmno'.split(''));
function int(v,name){if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new RangeError(name+' must be signed32');return v;}
function entityObject(entity){if(!entity||typeof entity!=='object'||Array.isArray(entity))throw new TypeError('explicit y object required');return entity;}
function allocateEntity({caughtException=false}={}){
 if(typeof caughtException!=='boolean')throw new TypeError('caughtException must be explicit boolean');
 // j.a allocates NEW y, not a pool lookup. This switch models its caught
 // java/lang/Exception return only; it does not claim to catch VM Errors/OOM.
 if(caughtException)return null;
 return {...Object.fromEntries(INTEGER_FIELDS.map(k=>[k,0])),v:0,cArray:null,dArray:null};
}
function draw(rngA,bound,trace){
 if(typeof rngA!=='function')throw new TypeError('explicit bounded rngA required');
 int(bound,'RNG requested bound');const effectiveBound=Math.max(1,bound),value=rngA(bound);
 trace.push({requestedBound:bound,effectiveBound,value});
 if(!Number.isInteger(value)||value<0||value>=effectiveBound)throw new RangeError('initializer RNG outside normal bounded domain; negative native remainder is not normalized');
 return value;
}
function initializeEntity(entity,rngA,trace=[]){
 entityObject(entity);for(const key of ['a','g','h'])int(entity[key],'y.'+key);
 // Java int arithmetic and statement order; each magnitude and sign consumes
 // its own draw even when the magnitude interval has only one value.
 for(const field of ['e','f']){
  const magnitude=(draw(rngA,((entity.g-entity.h)|0)+1|0,trace)+entity.h)|0;
  const sign=draw(rngA,2,trace)===0?1:-1;
  entity[field]=Math.imul(magnitude,sign);
 }
 if(entity.a===5)entity.b=(draw(rngA,8,trace)+20)|0;
 if(entity.a===10)entity.b=(draw(rngA,10,trace)+5)|0;
 return {entity,rngTrace:trace};
}
function registerEntity(slots,entity){
 // A null array triggers the reviewed java/lang/Exception catch and returns -1.
 if(slots===null)return -1;
 if(!Array.isArray(slots))throw new TypeError('explicit fixed-capacity slots array required');
 if(entity!==null)entityObject(entity);
 for(let index=0;index<slots.length;index++)if(slots[index]===null){slots[index]=entity;return index;}
 return -1;
}
function finalizeEntity(entity){
 entityObject(entity);
 // y.b only releases the two array REFERENCES; integers c/d are separate fields.
 if(entity.cArray!==null)entity.cArray=null;
 if(entity.dArray!==null)entity.dArray=null;
 return entity;
}
function executeFactory(args,{viewOrientation,rngA,slots,caughtAllocationException=false}){
 const operations=Policy.factoryWrites(args,viewOrientation),rngTrace=[];let entity=null,index=-1;
 for(const operation of operations){
  switch(operation.operation){
   case 'allocate-or-reuse':entity=allocateEntity({caughtException:caughtAllocationException});break;
   case 'set-orientation':
    if(entity===null)throw new TypeError('native allocator returned null; enclosing cell exception/catch path is unsupported');
    entity.v=operation.value;break;
   case 'set-field':entity[operation.field.slice('y.I+'.length)]=operation.value;break;
   case 'invoke':
    if(operation.method!=='y.()V+c')throw new Error('unsupported factory consumer '+operation.method);
    initializeEntity(entity,rngA,rngTrace);break;
   case 'register':index=registerEntity(slots,entity);break;
   default:throw new Error('unsupported factory operation '+operation.operation);
  }
 }
 return {entity,index,rngTrace,allocation:'fresh',originalRuntimeFullEquivalence:false};
}
function consumeCellRequests(input,{slots,rngA,globals,hooks={}}){
 if(!Array.isArray(slots))throw new TypeError('explicit fixed-capacity slots array required');
 if(!globals||typeof globals!=='object')throw new TypeError('explicit mutable controller globals required');
 const iterator=Policy.requestStream(input,rngA),events=[],factories=[],externalHooks=[];
 let next=iterator.next();
 while(!next.done){
  const event=next.value;events.push(event);let resume;
  switch(event.operation){
   case 'clear-entities':for(let i=0;i<slots.length;i++)slots[i]=null;break;
   case 'spawn':{
    const result=executeFactory(event.args,{viewOrientation:input.viewOrientation,rngA,slots});
    factories.push(result);resume=result.index;break;
   }
   case 'set-entity-field':{
    if(event.index<0||event.index>=slots.length||slots[event.index]===null)throw new RangeError('unsupported missing entity on successful factory index');
    slots[event.index][event.field.slice('y.I+'.length)]=event.value;break;
   }
   case 'set-global':
    if(event.field!=='u.I+az')throw new Error('unsupported global write '+event.field);
    globals.az=event.value;break;
   case 'invoke':{
    const callback=hooks[event.method];
    if(typeof callback!=='function')throw new Error('unsupported native posthook body: '+event.method);
    externalHooks.push(event.method);
    callback(event.args,{slots,globals,rngA});break;
   }
   case 'read-entity-slots':resume=slots;break;
   case 'invoke-entity':
    if(event.method!=='y.()V+b')throw new Error('unsupported entity finalizer '+event.method);
    finalizeEntity(slots[event.index]);break;
   default:throw new Error('unsupported cell policy event '+event.operation);
  }
  next=iterator.next(resume);
 }
 return {slots,globals,events,factories,externalHooks,requestSummary:next.value,
  implementedConsumers:['fresh y allocation','y.c initializer','first-null registration','y.b array-reference finalizer'],
  nativePosthookBodiesImplemented:false,originalRuntimeFullEquivalence:false};
}
module.exports=Object.freeze({allocateEntity,initializeEntity,registerEntity,finalizeEntity,executeFactory,consumeCellRequests});

},
"experiments/r75-procedural-geometry/cell-factory.cjs":function(module,exports,require){
'use strict';
// Functional request stream, not an entity implementation. Original records,
// live geometry, RNG state and all entity/posthook consumers remain external.
const D=require('./column-dynamics.cjs');
const SUPPORTED_KINDS=Object.freeze(Array.from({length:28},(_,i)=>i));
function integer(v,label){if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new RangeError(label+' outside non-overflowing signed32 domain');return v;}
function byte(v,label){integer(v,label);if(v<-128||v>127)throw new RangeError(label+' must be a signed byte');return v;}
function mul(a,b){return integer(a*b,'product');}
function divide(a,b){if(b===0)throw new RangeError('unmodeled native arithmetic-exception path: division by zero');return Math.trunc(a/b);}
function source(input){
 const record=D.decodeCellRecord(input);
 if(!SUPPORTED_KINDS.includes(record.kind))throw new RangeError('unsupported cell kind: '+record.kind);
 for(const k of ['N','y','group','missionType','behaviorCode','behaviorArgument','primitiveIndex','maskId','viewOrientation'])integer(input[k],k);
 byte(input.col8,'signed stage col8');
 if(input.N<6||input.N>65536)throw new RangeError('normal N6..65536 required');
 if(!Array.isArray(input.c)||input.c.length<input.N)throw new TypeError('explicit c array covering active N required');
 input.c.forEach(v=>integer(v,'c height'));
 return {...input,...record,c:input.c.slice()};
}
function random(rngA,trace){
 if(typeof rngA!=='function')throw new TypeError('explicit native bounded rngA required');
 return requestedBound=>{
  integer(requestedBound,'requested RNG bound');const effectiveBound=Math.max(1,requestedBound),value=rngA(requestedBound);
  trace.push({requestedBound,effectiveBound,value});
  if(!Number.isInteger(value)||value<0||value>=effectiveBound)throw new RangeError('RNG result outside normal bounded domain; negative native remainder is not normalized');
  return value;
 };
}
function derivedCount(code,N,y){
 integer(code,'derived count code');
 if(code>=-128&&code<=127)return D.deriveCount({code,N,y});
 if(code<0)return divide(mul(-(N-4),N-y-4),code);
 return 0;
}
function parameters(s,R){
 let count=s.countCode,sizeCode=s.sizeCode;const mode=s.shapeMode;
 const sampledSize=()=>divide(R(6)-1,2)+1;
 if(s.kind===0)return {count:0,sizeCode};
 if(s.group>=0&&mode===4){
  sizeCode=sampledSize();if(sizeCode===3)sizeCode=10;
  count=sizeCode>1?divide(s.col8,10):s.col8%10;
  return {count,sizeCode};
 }
 if(mode>0&&mode<=5){
  sizeCode=sampledSize();if(sizeCode===3)sizeCode=10;
  if(sizeCode>1)count=mode===5?divide(mul(count,6),5):divide(mul(count,13),10);
  if(mode===2)count=s.primitiveIndex===20?divide(mul(count,3),2):divide(mul(count,27),20);
  if(mode===4){
   byte(s.maskWeight,'explicit r.r[maskId-1] weight');
   const divisor=s.maskId<=59?(sizeCode>1?70:80):(s.behaviorArgument===2?64:72);
   count=divide(mul(count,s.maskWeight),divisor);
  }
 }
 if(mode===3){
  const span=s.behaviorCode===1?22-s.y:s.behaviorArgument-2;
  count=divide(mul(mul(-(s.N-4),span),20),mul(count,27));
  count=D.scaleCount({count,col8:s.col8,group:s.group});
 }else if(mode===5){
  // Intentionally bypass both count decoding and density scaling.
 }else if(mode===0&&s.missionType===1){
  if(s.group>=0)count=D.scaleCount({count:derivedCount(8,s.N,s.y),col8:s.col8,group:s.group});
  // Negative group keeps the raw count code here.
 }else count=D.scaleCount({count:derivedCount(count,s.N,s.y),col8:s.col8,group:s.group});
 return {count,sizeCode};
}
function resolveConfiguration(input,rngA){const s=source(input),rngTrace=[],R=random(rngA,rngTrace);return {...parameters(s,R),kind:s.kind,rngTrace,fullEntityFactoryImplemented:false,originalRuntimeFullEquivalence:false};}
function factoryWrites(args,viewOrientation){
 if(!Array.isArray(args)||args.length!==10)throw new TypeError('ten explicit native factory arguments required');args.forEach(v=>integer(v,'factory argument'));integer(viewOrientation,'viewOrientation');
 const orientation=integer(viewOrientation+4,'orientation normalization')%4;
 if(orientation<0)throw new RangeError('negative native orientation remainder is outside normal domain');
 return [
  {operation:'allocate-or-reuse',method:'j.()Ly;+a'},
  {operation:'set-orientation',value:orientation},
  ...[['a',0],['c',2],['d',3],['i',4],['n',5],['o',6],['h',7],['g',8]].map(([field,i])=>({operation:'set-field',field:'y.I+'+field,value:args[i]})),
  {operation:'set-field',field:'y.I+j',value:0},{operation:'set-field',field:'y.I+k',value:args[9]},{operation:'set-field',field:'y.I+l',value:0},
  ...(args[0]===4?[{operation:'set-field',field:'y.I+e',value:0},{operation:'set-field',field:'y.I+f',value:0}]:[{operation:'invoke',method:'y.()V+c'}]),
  {operation:'set-field',field:'y.I+b',value:args[1]},
  {operation:'register',method:'u.(Ly;)I+a'}
 ];
}
function coordinates(args,s,R){
 const out=args.slice();
 // u.a(10I) fills zero parameter6 first, then zero parameter7, consuming even
 // bound<=0 via the native max(1,bound) helper. Caller owns subsequent draws.
 for(const i of [5,6])if(out[i]===0)out[i]=16*(s.behaviorCode===3?11+R(4):2+R(s.N-6));
 return out;
}
function* requestStream(input,rngA){
 const s=source(input),rngTrace=[],R=random(rngA,rngTrace);
 yield {operation:'clear-entities',method:'u.()V+F',raw:'0x39bb2'};
 if(s.kind===0)return {count:0,spawnAttempts:0,rngTrace,fullEntityFactoryImplemented:false,originalRuntimeFullEquivalence:false};
 const {count,sizeCode}=parameters(s,R);let spawnAttempts=0;
 function* spawn(args,origin){
  const resolved=coordinates(args,s,R);resolved.forEach(v=>integer(v,'resolved factory argument'));
  const returnedIndex=yield {operation:'spawn',origin,args:resolved,factoryWrites:factoryWrites(resolved,s.viewOrientation),method:'u.(IIIIIIIIII)I+c',raw:'0x38794'};
  integer(returnedIndex,'explicit consumer returned entity index');spawnAttempts++;return returnedIndex;
 }
 if(s.kind===7){
  let remaining=mul(s.N-15,s.N-15)+1,wanted=mul(s.N-20,3);
  for(let x=7;x<s.N-8;x++)for(let y=7;y<s.N-8;y++){
   remaining--;if(R(remaining)<wanted){wanted--;const p9=R(100)<=59?11:0;yield* spawn([4,25,0,0,1,x*16,y*16,0,p9,1],'kind7-prepass');}
  }
 }
 let p1=1,p2=0,p3=0,p4=0;
 if(s.kind>20){
  if(count<=0)throw new RangeError('unsupported nonpositive native grid spacing: no terminating normal path');
  for(let x=(s.N-2)*16;x>0;x-=count*2)for(let y=(s.N-2)*16;y>0;y-=count*2){
   let p9=0;
   if(s.kind===21)p9=((R(2)+1)*(R(2)+1)*(R(3)*2+1))>>1;
   else if(s.kind===22)p9=5;
   else if(s.kind===23){p1=2;p2=R(7)+2;p3=3;p4=divide(p2,6)+3;p9=7;}
   else if(s.kind===24){p1=6;p9=7;}
   else if(s.kind===25){p1=7;p2=R(5)*5+8;p3=3;p4=4;p9=6;}
   else if(s.kind===26){p1=5;p2=R(25)+1;p9=6;}
   else if(s.kind===27){p1=4;p2=3;p9=5;}
   const size=D.resolveSize(sizeCode,R),px=x-R(count-size*16)+size*8,py=y-R(count-size*16)+size*8;
   yield* spawn([p1,p2,p3,p4,size,px,py,0,p9,1],'grid');
  }
 }else{
  for(let attempt=0;attempt<count;attempt++){
   let size=D.resolveSize(sizeCode,R),x=0,y=0,p8=0,p9=11,p10=size>1?7:5;
   if(s.kind===1){p9=attempt%4===0?16:3;if(attempt%4===0)p8=10;y=16*(R(s.N-13)+13);p10=1;}
   else if(s.kind===2){p10=1;if(attempt%3===0){p1=7;p2=34;p3=3;p4=5;p9=10;}else{p3=0;p1=1;}}
   else if(s.kind===3){p1=7;p2=R(5)*5+16;p3=3;p4=4;p10=1;p9=10;}
   else if(s.kind===4){p1=2;p2=R(31)+10;p3=3;p9=R(5)+4;p10=1;p4=divide(p9,2)+1;}
   else if(s.kind===5){p1=2;p2=20;p3=3;p4=R(3)+3;p10=1;}
   else if(s.kind===6)p10=1;
   else if(s.kind===8){p1=5;p2=R(25)+1;p10=1;}
   else if(s.kind===9||s.kind===15){
    p1=6;p3=4;p9=0;x=(R(s.N-10)+6)*16;const i=x>>4;
    if(i<0||i>=s.c.length)throw new RangeError('unmodeled native profile-read exception');
    y=s.c[i]+(s.kind===9?8:24);p10=1;size=2;
   }else if(s.kind===10){
    p9=0;x=(R(s.N-15)+9)*16;const extra=R(4)*4+4,i=(x>>4)-1;
    if(i<0||i>=s.c.length)throw new RangeError('unmodeled native profile-read exception');
    y=extra+s.c[i];p10=3;
   }else if(s.kind===16){p1=10;p2=R(10)+1;p10=1;p9=9;p3=3;p4=4;}
   if(p3===3&&size>1)p4=p4-4+size;
   const entityIndex=yield* spawn([p1,p2,p3,p4,size,x,y,p8,p9,p10],'counted');
   if(s.kind===9&&entityIndex>=0)yield {operation:'set-entity-field',index:entityIndex,field:s.viewOrientation===0||s.viewOrientation===2?'y.I+f':'y.I+e',value:0,raw:'0x38ea6..0x38efc'};
  }
 }
 if(s.shapeMode===3||[1,9,10,15].includes(s.kind))yield {operation:'set-global',field:'u.I+az',value:1};
 if([9,10,15].includes(s.kind))yield {operation:'invoke',method:'u.(I)V+g',args:[s.kind===15?32:80]};
 yield {operation:'invoke',method:s.behaviorCode===3?'u.()V+v':'u.()V+u',args:[]};
 yield {operation:'invoke',method:s.missionType>0?'u.()V+w':'u.()V+x',args:[]};
 const slots=yield {operation:'read-entity-slots',reason:'posthooks may change entity slots before finalization'};
 if(!Array.isArray(slots))throw new TypeError('explicit posthook entity slots required');
 for(let i=0;i<slots.length;i++)if(slots[i]!==null){integer(slots[i].a,'entity active field y.I+a');if(slots[i].a!==0)yield {operation:'invoke-entity',index:i,method:'y.()V+b'};}
 return {count,sizeCode,spawnAttempts,rngTrace,fullEntityFactoryImplemented:false,originalRuntimeFullEquivalence:false};
}
module.exports=Object.freeze({SUPPORTED_KINDS,resolveConfiguration,factoryWrites,requestStream});

},
"experiments/r75-procedural-geometry/column-dynamics.cjs":function(module,exports,require){
'use strict';
// g.c() normal signed-arithmetic contract, plus isolated cell-record helpers.
// No original table, entity payload or host-time conversion is included.
const L=require('./lifecycle.cjs');
function int(value,label){if(!Number.isInteger(value)||value<-2147483648||value>2147483647)throw new RangeError(label+' outside non-overflowing signed integer domain');return value;}
function byte(value,label){int(value,label);if(value<-128||value>127)throw new RangeError(label+' requires signed byte');return value;}
const signedByte=value=>(value<<24)>>24;
function stepColumns({geometry,position,behaviorCode,direction,controllerStateUK,actorFlagEZA,actorHeight}={}){
 for(const [key,value] of Object.entries({position,behaviorCode,direction,controllerStateUK,actorHeight}))int(value,key);
 if(typeof actorFlagEZA!=='boolean')throw new TypeError('explicit e.Z+a actorFlagEZA required');
 const next=L.createExisting(geometry),g=next.columns,N=next.activeLength;
 let sampledIndex=null,oldHeight=null,sampledDelta=null,processedColumns=0;
 const result=(caughtException=null)=>({geometry:next,actorHeight,sampledIndex,sampledDelta,processedColumns,caughtException,
  originalRuntimeFullEquivalence:false,originalGeometryPayloadIncluded:false});
 if(behaviorCode!==3){
  sampledIndex=Math.trunc(int(position+(direction===0?5:0),'sample position')/16);
  // The VM bounds check uses physical array length, not logical active N.
  if(sampledIndex<0||sampledIndex>=g.c.length)return result({kind:'ArrayIndexOutOfBoundsException',phase:'initial-height-sample',index:sampledIndex});
  oldHeight=g.c[sampledIndex];
 }
 for(let i=0;i<N;i++){
  const type=g.type[i];
  if(type!==0){
   g.G[i]=g.c[i];
   if(type===1){
    const remainder=g.gFlag[i]%2;
    if(remainder<0)return result({kind:'ArrayIndexOutOfBoundsException',phase:'direction-table',index:remainder,column:i});
    g.c[i]=int(g.c[i]+int([1,-1][remainder]*g.F[i],'signed step'),'updated c');
   }else if(type===2&&Math.abs(int(position-16*i,'proximity distance'))<=g.F[i]){
    g.c[i]=int(g.c[i]+16,'proximity first step');
    if(g.e[i]>80)g.c[i]=int(g.c[i]+16,'proximity second step');
   }
   if(g.c[i]>g.e[i]||g.c[i]<g.d[i]){
    // Preserve ordered clamps; do not rewrite as an unordered min/max when d>e.
    if(g.c[i]>g.e[i])g.c[i]=g.e[i];
    if(g.c[i]<g.d[i])g.c[i]=g.d[i];
    if(type===1)g.gFlag[i]=signedByte(1-g.gFlag[i]);
   }
  }
  processedColumns++;
 }
 if(behaviorCode!==3){
  sampledDelta=int(g.c[sampledIndex]-oldHeight,'sampled height delta');
  if(controllerStateUK===0&&!actorFlagEZA)actorHeight=int(actorHeight+sampledDelta,'carried actor height');
 }
 return result();
}
function decodeCellRecord({cellIndex,record,shapeMode}={}){
 int(cellIndex,'cellIndex');if(cellIndex<0)throw new RangeError('nonnegative cellIndex required');
 if(!Array.isArray(record)||record.length!==3)throw new TypeError('explicit three-byte cell record required');
 record.forEach((v,i)=>byte(v,'cell record '+i));byte(shapeMode,'separate r.t[shapeIndex] mode');
 return {cellIndex,recordIndices:[3*cellIndex,3*cellIndex+1,3*cellIndex+2],countCode:record[0],sizeCode:record[1],kind:record[2],shapeMode,
  clearEntitySlotsFirst:true,zeroKindReturnsAfterClear:record[2]===0,
  fullCellConfigurationImplemented:false,originalRuntimeFullEquivalence:false};
}
function deriveCount({code,N,y}={}){
 byte(code,'count code');int(N,'N');int(y,'explicit u.y');
 const span=int(N-4,'N-4'),square=()=>int(span*span,'squared count numerator');
 if(code<0)return Math.trunc(int(-span*int(N-y-4,'height-adjusted span'),'negative count numerator')/code);
 if(code===1)return Math.trunc(square()/40);
 if(code===2)return Math.trunc(square()/60);
 if(code===3)return Math.trunc(square()/80);
 if(code===4)return Math.trunc(square()/100);
 if(code===5)return Math.trunc(int(span*6,'count numerator')/5);
 if(code===6)return Math.trunc((N-16)/4)+2;
 if(code===7)return Math.trunc(N/4);
 if(code===8)return Math.trunc(square()/50);
 if(code===9)return Math.trunc((N-22)/7)+1;
 if(code===10)return Math.trunc(N/5);
 return 0;
}
function scaleCount({count,col8,group}={}){
 int(count,'count');byte(col8,'signed stage col8');int(group,'group');
 const value=group<0?count:Math.trunc(int(count*col8,'scaled count numerator')/30);return value===0?0:value;
}
function resolveSize(code,rngA){
 byte(code,'size code');if(code<=9)return code;
 if(typeof rngA!=='function')throw new TypeError('explicit bounded rngA required');
 const value=rngA(6);if(!Number.isInteger(value)||value<0||value>=6)throw new RangeError('bounded rngA(6) result required');
 return Math.trunc((value-1)/2)+1;
}
function clearEntitySlots(slots){if(!Array.isArray(slots))throw new TypeError('entity slots array required');return Array(slots.length).fill(null);}
module.exports=Object.freeze({stepColumns,decodeCellRecord,deriveCount,scaleCount,resolveSize,clearEntitySlots});

},
"experiments/r75-procedural-geometry/entity-bounds.cjs":function(module,exports,require){
'use strict';
// Reconstructed integer behavior; no original resource payload. The bit cache
// is shared controller state, NOT an independent random stream per entity.
function int32(value,label){
 if(!Number.isInteger(value)||value<-2147483648||value>2147483647)throw new TypeError(label+' must be signed int32');
 return value;
}
function nextPackedCode(controller,nextIntA){
 int32(controller.aH,'u.aH');int32(controller.aG,'u.aG');
 if(controller.aH<=1){
  if(typeof nextIntA!=='function')throw new TypeError('explicit raw nextIntA required');
  controller.aG=int32(nextIntA(),'raw A draw');controller.aH=32;
 }
 const code=controller.aG&3;controller.aG>>=2;controller.aH=(controller.aH-2)|0;
 return code;
}
function adjustBounds(index,margin,{slots,geometry,controller},nextIntA){
 if(!Array.isArray(slots)||!Number.isInteger(index)||index<0||index>=slots.length)throw new RangeError('entity slot outside array');
 const entity=slots[index];if(entity===null)return [];
 int32(entity.a,'y.a');if(entity.a===0)return [];
 for(const field of ['n','o','i','e','f'])int32(entity[field],'y.'+field);
 int32(margin,'margin');int32(geometry.N,'g.g');
 const radius=(entity.i-1)<<3,lower=(margin+radius)|0,upper=((((geometry.N-1)<<4)-margin)|0)-radius|0;
 const effects=[];
 const bounce=(axis,bound,edge)=>{
  if(axis==='x'){entity.n=bound;entity.e=-entity.e|0;entity.f=(entity.f+nextPackedCode(controller,nextIntA)-1)|0;}
  else{entity.o=bound;entity.f=-entity.f|0;entity.e=(entity.e+nextPackedCode(controller,nextIntA)-1)|0;}
  effects.push({kind:'bounds-bounce',edge,bound});
 };
 // Four independent tests. A corner can bounce twice, and an inverted interval
 // can take BOTH low and high branches. Equality does not bounce.
 if(entity.n<lower)bounce('x',lower,'x-low');
 if(entity.o<lower)bounce('y',lower,'y-low');
 if(entity.n>upper)bounce('x',upper,'x-high');
 if(entity.o>upper)bounce('y',upper,'y-high');
 return effects;
}
function createBoundsAdjust(nextIntA){return (index,margin,state)=>adjustBounds(index,margin,state,nextIntA);}
module.exports={nextPackedCode,adjustBounds,createBoundsAdjust};

},
"experiments/r75-procedural-geometry/entity-posthooks.cjs":function(module,exports,require){
'use strict';
const Runtime=require('./cell-entity-runtime.cjs');
const add=(a,b)=>(a+b)|0,sub=(a,b)=>(a-b)|0,mul=Math.imul,abs=x=>x===-2147483648?x:Math.abs(x),sign=x=>x>0?1:x<0?-1:0;
class UnsupportedEntityPath extends Error{constructor(gate,detail={}){super('unsupported entity path: '+gate);this.name='UnsupportedEntityPath';this.gate=gate;this.detail=detail;}}
class NativeArrayFault extends Error{constructor(field,index){super('native array fault '+field+'['+index+']');this.name='NativeArrayFault';this.field=field;this.index=index;}}
function integer(x,name){if(!Number.isInteger(x)||x<-2147483648||x>2147483647)throw new TypeError(name+' must be explicit signed32');return x;}
function read(array,index,field){if(!Array.isArray(array)||index<0||index>=array.length)throw new NativeArrayFault(field,index);return array[index]|0;}
function write(array,index,value,field){if(!Array.isArray(array)||index<0||index>=array.length)throw new NativeArrayFault(field,index);array[index]=value|0;}
function ceilingHeight(height,{q,r}){return q===1?sub(368,height):q===2?add(add(height,r<<4),16):height;}
function penetration(entity,geometry,controller,upper=false){
 const {n,o,i}=entity;let result=0,k;
 const sample=(index,offset)=>{const c=read(geometry.c,index,'g.c');return upper?add(sub(o,ceilingHeight(c,controller)),offset):sub(add(c,offset),o);};
 if(i===1){k=add(n,8)>>4;result=sample(k,16);}
 else if(i===2){k=n>>4;if(k>=0)result=sample(k,24);result=Math.max(result,sample(add(k,1),24));}
 else if(i===3){k=add(n,8)>>4;if(k>0)result=sample(sub(k,1),32);if(k>=0)result=Math.max(result,sample(k,32));result=Math.max(result,sample(add(k,1),32));}
 return upper?(controller.q===1?sub(result,32):result):sub(result,16);
}
function floorPenetration(entity,geometry){return penetration(entity,geometry,null,false);}
function ceilingPenetration(entity,geometry,controller){return penetration(entity,geometry,controller,true);}
function correctVertical(entity,delta){entity.f=delta<0?-abs(entity.f)|0:abs(entity.f)|0;entity.o=add(entity.o,delta);}
function rectangle(originX,originY,pointX,pointY,width,height,tangentOffset=0,normalOffset=0,direction=0){
 const x=add(originX,direction===1?-tangentOffset:tangentOffset),y=add(originY,normalOffset),hx=Math.trunc(width/2),hy=Math.trunc(height/2);
 return pointX>=sub(x,hx)&&pointX<=add(x,hx)&&pointY>=sub(y,hy)&&pointY<=add(y,hy);
}
function maskEntityCollision(entity,orientation,maskCell){
 if(typeof maskCell!=='function')throw new UnsupportedEntityPath('q3 mask-cell provider');
 const x=Math.max(0,Math.min(368,entity.n)),y=Math.max(0,Math.min(368,entity.o));let px,py;
 switch(orientation){case 0:px=x;py=368-y;break;case 1:px=368-y;py=368-x;break;case 2:px=368-x;py=y;break;case 3:px=y;py=x;break;default:throw new UnsupportedEntityPath('mask orientation',{orientation});}
 const half=entity.i<<3,fromX=Math.trunc(add(sub(px,half),8)/16),fromY=Math.trunc(add(sub(py,half),8)/16),toX=Math.trunc(add(add(px,half),23)/16),toY=Math.trunc(add(add(py,half),23)/16);
 for(let col=fromX;col<toX;col++)for(let row=fromY;row<toY;row++)if(maskCell(col,row))return true;
 return false;
}
function bounded(rngA,bound){if(typeof rngA!=='function')throw new TypeError('explicit rngA required');const value=rngA(bound);if(!Number.isInteger(value)||value<0||value>=Math.max(1,bound))throw new UnsupportedEntityPath('negative/out-of-domain RNG remainder',{bound,value});return value;}
function posthookU(slots,{geometry,controller}){
 for(const entity of slots){if(entity===null||entity.a===0)continue;const floor=floorPenetration(entity,geometry);
  if(floor>0){correctVertical(entity,floor);Runtime.finalizeEntity(entity);}
  else if(controller.q>0&&controller.q<=2){const upper=ceilingPenetration(entity,geometry,controller);if(upper>0){correctVertical(entity,sub(-upper,32));Runtime.finalizeEntity(entity);}}
 }
}
function posthookV(slots,{viewOrientation,maskCell},rngA){
 for(const entity of slots){if(entity===null||entity.a===0)continue;let moved=0;
  while(maskEntityCollision(entity,viewOrientation,maskCell)){
   entity.n=add(entity.n,(bounded(rngA,3)-1)<<4);entity.o=add(entity.o,(bounded(rngA,3)-1)<<4);
   if(++moved>50)break;
  }
 }
}
function posthookW(slots,{geometry,actor}){
 for(const entity of slots){if(entity===null||entity.a===0)continue;let moved=0;
  while(rectangle(geometry.position,actor.height,entity.n,entity.o,add(entity.i<<3,48),add(entity.i<<3,48),0,0,actor.direction)){
   entity.n=sub(entity.n,sign(sub(geometry.N<<3,entity.n))<<4);
   entity.o=sub(entity.o,sign(sub(geometry.N<<3,entity.o))<<4);
   if(++moved>50)break;
  }
 }
}
function posthookX(slots,{geometry,actor,workBudget=10000}){
 integer(workBudget,'authored execution budget');if(workBudget<1)throw new TypeError('positive workBudget required');
 for(const entity of slots){if(entity===null||entity.a===0)continue;const seen=new Set();let moves=0;
  while(rectangle(geometry.position,actor.height,entity.n,entity.o,add(entity.i<<3,48),add(entity.i<<3,48),-4,16,actor.direction)){
   if((seen.has(entity.n+','+entity.o)||moves>=workBudget)&&root.MongyuNativeStability?.escapeOverlap(entity,{geometry,actor},(n,o)=>!rectangle(geometry.position,actor.height,n,o,add(entity.i<<3,48),add(entity.i<<3,48),-4,16,actor.direction)&&floorPenetration({...entity,n,o},geometry)<=0))break; // R86 bounded spawn recovery binding
   const key=entity.n+','+entity.o;if(seen.has(key))throw new UnsupportedEntityPath('native posthook-x nonterminating cycle',{n:entity.n,o:entity.o,moves});
   if(moves>=workBudget)throw new UnsupportedEntityPath('authored posthook-x work budget',{moves});seen.add(key);
   entity.n=add(entity.n,sign(sub(geometry.N>>1,entity.n))<<4);entity.o=add(entity.o,sign(sub(geometry.N>>1,entity.o))<<4);moves++;
  }
 }
}
function posthookG(slots,margin){
 integer(margin,'pair separation margin');
 for(let i=0;i<slots.length;i++){const first=slots[i];if(first===null||first.a===0)continue;
  for(let j=i+1;j<slots.length;j++){const second=slots[j];if(second===null||second.a===0)continue;const width=add(add(first.i,second.i)<<3,margin);
   if(rectangle(first.n,first.o,second.n,second.o,width,width))slots[j]=null;
  }
 }
}
function createEntityPosthooks(context){
 return Object.freeze({
  'u.()V+u':(_args,{slots})=>posthookU(slots,context),
  'u.()V+v':(_args,{slots,rngA})=>posthookV(slots,context,rngA),
  'u.()V+w':(_args,{slots})=>posthookW(slots,context),
  'u.()V+x':(_args,{slots})=>posthookX(slots,context),
  'u.(I)V+g':(args,{slots})=>posthookG(slots,args[0])
 });
}
module.exports=Object.freeze({UnsupportedEntityPath,NativeArrayFault,integer,read,write,add,sub,mul,abs,sign,bounded,ceilingHeight,floorPenetration,ceilingPenetration,correctVertical,rectangle,maskEntityCollision,posthookU,posthookV,posthookW,posthookX,posthookG,createEntityPosthooks});

},
"experiments/r75-procedural-geometry/entity-update.cjs":function(module,exports,require){
'use strict';
const Runtime=require('./cell-entity-runtime.cjs'),H=require('./entity-posthooks.cjs'),Bounds=require('./entity-bounds.cjs');
const {add,sub,mul,abs,read,write,bounded,UnsupportedEntityPath,NativeArrayFault,integer}=H;
function nativeCos100(angle){
 integer(angle,'native angle');if(angle===-2147483648)throw new UnsupportedEntityPath('cos MIN_VALUE array exception');
 const phase=Math.abs(angle)%360;
 // Own formula reproduces every one of 91 native quarter-wave entries; no table
 // is copied. Native negative input is absolute before folding (cos semantics).
 const quarter=phase<=90?phase:phase<=180?180-phase:phase<=270?phase-180:360-phase;
 const magnitude=Math.round(100*Math.cos(quarter*Math.PI/180));return (phase>90&&phase<=270?-magnitude:magnitude)|0;
}
function nativeWrap(value,bound){
 integer(value,'wrap value');integer(bound,'wrap bound');
 if(bound<=1)throw new UnsupportedEntityPath('native recursive wrap nonnormal modulus',{value,bound});
 let count=0;while(value<0){value=sub(value,mul(bound,value));if(++count>64)throw new UnsupportedEntityPath('native recursive wrap overflow cycle');}
 return value%bound;
}
function nudgeVelocity(entity){
 // Ordered independent comparisons. Zero takes the positive sign, and a value
 // moved up to the lower bound can then be moved down by the upper-bound pass.
 if(abs(entity.e)<entity.h)entity.e=add(entity.e,entity.e<0?-1:1);
 if(abs(entity.f)<entity.h)entity.f=add(entity.f,entity.f<0?-1:1);
 if(abs(entity.e)>entity.g)entity.e=sub(entity.e,entity.e<0?-1:1);
 if(abs(entity.f)>entity.g)entity.f=sub(entity.f,entity.f<0?-1:1);
}
function shiftHistory(entity){
 if(entity.cArray===null){entity.cArray=Array(8).fill(0);entity.dArray=Array(8).fill(0);}
 for(let i=7;i>0;i--){write(entity.cArray,i,read(entity.cArray,i-1,'y.cArray'),'y.cArray');write(entity.dArray,i,read(entity.dArray,i-1,'y.dArray'),'y.dArray');}
 write(entity.cArray,0,entity.n,'y.cArray');write(entity.dArray,0,entity.o,'y.dArray');
}
function applyType(entity,index,state,rngA){
 const {geometry,actor,controller}=state;
 if(entity.a===3){if(abs(sub(geometry.position,entity.n))<=entity.b)return false;entity.a=1;}
 else if(entity.a===4){if(bounded(rngA,1000)>=entity.b)return false;entity.a=1;Runtime.initializeEntity(entity,rngA);}
 else if(entity.a===2){
  const targetX=geometry.position,targetY=actor.height;
  if(bounded(rngA,100)<entity.b)entity.e=add(entity.e,sub(targetX,entity.n)<0?-1:1);
  if(bounded(rngA,100)<entity.b)entity.f=add(entity.f,sub(targetY,entity.o)<0?-1:1);
 }else if(entity.a===5){
  if(entity.b!==0)entity.b=sub(entity.b,1);
  else if(entity.e===0&&entity.f===0)Runtime.initializeEntity(entity,rngA);
  else{entity.e=0;entity.f=0;entity.b=add(bounded(rngA,8),13);}
 }else if(entity.a===10){
  if(entity.b!==0)entity.b=sub(entity.b,1);
  else{Runtime.initializeEntity(entity,rngA);entity.b=add(bounded(rngA,10),5);}
 }else if(entity.a===7){
  const phase=add(mul(add(controller.s,mul(index,45)),15),10000)%360;
  entity.e=add(entity.e,Math.trunc(mul(entity.b,nativeCos100(phase))/1000));
  entity.f=add(entity.f,Math.trunc(mul(entity.b,nativeCos100(sub(phase,90)))/1000));
  nudgeVelocity(entity); // Native type7 invokes y.a here AND common path invokes it again.
 }else if(entity.a===8||entity.a===9){
  entity.e=Math.trunc(mul(entity.b,nativeCos100(entity.m))/1000)|0;
  entity.f=Math.trunc(mul(entity.b,nativeCos100(sub(entity.m,90)))/1000)|0;
  entity.m=nativeWrap(add(entity.m,entity.a===8?6:-6),360);entity.b=add(entity.b,3);nudgeVelocity(entity);
 }
 return true;
}
function advanceCommon(entity,index,state,rngA){
 if(entity.j>0)entity.j=sub(entity.j,1);
 if(entity.l>0){entity.l=sub(entity.l,1);entity.d=add(Math.trunc(entity.l/3),1);if(entity.l===0)entity.a=0;}
 shiftHistory(entity);
 if(!applyType(entity,index,state,rngA))return false;
 nudgeVelocity(entity);
 return true;
}
function stepEntities(state,{rngA,nextIntA,boundsAdjust=Bounds.createBoundsAdjust(nextIntA)}){
 const {slots,geometry,actor,controller}=state;
 if(!Array.isArray(slots))throw new TypeError('explicit fixed entity slots required');
 for(const [object,keys] of [[geometry,['N','position']],[actor,['height','direction']],[controller,['q','r','s']]])for(const key of keys)integer(object?.[key],key);
 if(controller.q===3||controller.q===99)throw new UnsupportedEntityPath(controller.q===3?'q3 entity motion':'boss99 entity motion');
 if(typeof boundsAdjust!=='function')throw new UnsupportedEntityPath('u.(II)V+c bounds consumer');
 const effects=[],rngTrace=[];let currentIndex=-1;
 const tracedRng=bound=>{if(typeof rngA!=='function')throw new TypeError('explicit rngA required');const value=rngA(bound);rngTrace.push({index:currentIndex,requestedBound:bound,value});return value;};
 try{
  for(let index=0;index<slots.length;index++){
   currentIndex=index;const entity=slots[index];if(entity===null)continue;
   if(entity.a===0){slots[index]=null;effects.push({kind:'remove-inactive',index});continue;}
   if(!advanceCommon(entity,index,state,tracedRng)){effects.push({kind:'stationary-type',index,type:entity.a});continue;}
   const floor=H.floorPenetration(entity,geometry);
   if(floor>0)H.correctVertical(entity,add(floor,8));
   else if(controller.q>0&&controller.q<=2){const upper=H.ceilingPenetration(entity,geometry,controller);if(upper>0)H.correctVertical(entity,-upper|0);}
   entity.n=add(entity.n,entity.e);entity.o=add(entity.o,entity.f);
   if(H.floorPenetration(entity,geometry)>0){entity.f=abs(entity.f)|0;entity.o=add(entity.o,entity.f);}
   else if(controller.q>0&&controller.q<=2&&H.ceilingPenetration(entity,geometry,controller)>0){entity.f=-abs(entity.f)|0;entity.o=add(entity.o,entity.f);}
   const boundaryEffects=boundsAdjust(index,16,{slots,geometry,actor,controller});
   if(Array.isArray(boundaryEffects))effects.push(...boundaryEffects.map(effect=>({...effect,index})));
   effects.push({kind:'updated',index,type:entity.a});
  }
 }catch(error){
  if(!(error instanceof NativeArrayFault))throw error;
  return {slots,effects,rngTrace,abortedByNativeException:{type:'java/lang/Exception',index:currentIndex,field:error.field,arrayIndex:error.index},originalRuntimeFullEquivalence:false};
 }
 return {slots,effects,rngTrace,abortedByNativeException:null,originalRuntimeFullEquivalence:false};
}
module.exports=Object.freeze({nativeCos100,nativeWrap,nudgeVelocity,shiftHistory,applyType,advanceCommon,stepEntities});

},
"experiments/r75-procedural-geometry/geometry.cjs":function(module,exports,require){
'use strict';
// Independent implementation of reviewed functional contracts. No candidate
// executable, table payload, mask, art or palette is bundled with this module.
const SUPPORTED=Object.freeze([0,2,3,7,9,11,12,13,15,17,19,21,22,26,28,35,36,37]);
const KEYS=Object.freeze(['c','d','e','G','F','type','gFlag','h','i']);
const BYTE_KEYS=new Set(['type','gFlag','h','i']);
const RESET=new Set([0,7,9,11,12,17,26]);
const PLACEMENT={7:{offset:8,divisor:2,low:2,high:6},9:{offset:6,divisor:3,low:2,high:6},11:{offset:10,divisor:2,low:2,high:6},12:{offset:10,divisor:2,low:3,high:9},13:{offset:6,divisor:3,low:3,high:6},15:{offset:6,divisor:3,low:3,high:8}};
const MISSING_GATES=Object.freeze([
 'product integration of the separately implemented lifecycle and assembly adapters',
 'complete camera/render and actor-collision integration beyond local surface projection',
 'cell-table decoration and later dynamic c/d/e updates',
 'native RNG seed, intervening draws, MIN_VALUE anomaly and VM exceptions',
 'unreferenced primitive IDs and packed-mask path (all 18 IDs in the 124 procedural stage references are implemented)',
 'comparison with actual native execution'
]);
function integer(v,min,max,label){if(!Number.isInteger(v)||v<min||v>max)throw new RangeError(label+' outside '+min+'..'+max);return v;}
function int32(v,label){return integer(v,-2147483648,2147483647,label);}
function add(a,b){return int32(a+b,'non-overflowing arithmetic');}
function rngFunction(rng){if(typeof rng!=='function')throw new TypeError('explicit bounded rngA(bound) required');return rng;}
function draw(rng,bound){integer(bound,1,2147483647,'RNG bound');return integer(rng(bound),0,bound-1,'bounded RNG result (negative native anomaly is outside this prototype)');}
function validateColumns(columns){
 if(!columns||!Array.isArray(columns.c))throw new TypeError('initialized column arrays required');
 const N=columns.c.length;
 for(const key of KEYS){
  if(!Array.isArray(columns[key])||columns[key].length!==N)throw new RangeError('equal-length array required: '+key);
  for(const v of columns[key])integer(v,BYTE_KEYS.has(key)?-128:-2147483648,BYTE_KEYS.has(key)?127:2147483647,key+' element');
 }
 return N;
}
function cloneColumns(columns){validateColumns(columns);return Object.fromEntries(KEYS.map(k=>[k,columns[k].slice()]));}
// This convenience constructor is explicitly synthetic, not an assertion about
// native allocation/reset history. Callers choose whether zero state is valid.
function createSyntheticColumns(N){integer(N,0,65536,'synthetic column count');return Object.fromEntries(KEYS.map(k=>[k,Array(N).fill(0)]));}
function selectColumnCount(shape,rngA){
 rngFunction(rngA);
 if(!shape||typeof shape!=='object')throw new TypeError('shape {m,n,ag,ah} required');
 for(const k of ['m','n','ag','ah'])integer(shape[k],-128,127,'signed shape.'+k);
 if(shape.ag>shape.ah)throw new RangeError('shape length range is reversed');
 const N=shape.ag===shape.ah?shape.ag:shape.ag+draw(rngA,shape.ah-shape.ag+1);
 return {m:shape.m,n:shape.n,ag:shape.ag,ah:shape.ah,N};
}
function resetFlat(columns,height){
 for(const key of KEYS)columns[key].fill(['c','d','e'].includes(key)?height:0);
}
function setCell(columns,index,type,height,hFlag,iFlag){
 for(const key of ['c','d','e','G'])columns[key][index]=height;
 columns.type[index]=type;columns.h[index]=hFlag;columns.i[index]=iFlag;columns.gFlag[index]=0;
 // F is deliberately untouched.
}
function placeMutable(g,low,high,rngA){
 const N=g.c.length;
 if(N<=14)return {index:-1,accepted:false,reason:'N<=14',sampledHeight:null,placedHeight:null};
 const j=7+draw(rngA,N-14),sampledHeight=int32(16*(low+draw(rngA,high-low+1)),'sampled height');
 let height=sampledHeight;
 const reject=reason=>({index:-1,candidateIndex:j,accepted:false,reason,sampledHeight,placedHeight:null});
 const {c,e,h}=g;
 for(let k=-5;k<=5;k++)if(h[j+k]===1&&e[j+k]>112)return reject('radius5-existing-above112');
 if(height>112)for(let k=-6;k<=6;k++)if(h[j+k]===1)return reject('initial-height-above112-radius6');
 // The high-height radius check is not repeated after these ordered lifts.
 for(const k of [1,-1])if(h[j+k]!==1)height=Math.max(height,add(c[j+k],32));
 for(const k of [1,-1])if(h[j+k]===1&&e[j+k]>80&&height>80)return reject('distance1-both-above80');
 if(h[j-1]===1&&h[j+2]===1||h[j-2]===1&&h[j+1]===1)return reject('paired-offsets');
 for(const k of [3,-3,4,-4])if(h[j+k]===1)return reject('distance3-or4');
 for(const k of [-2,2])if(h[j+k]===1&&e[j+k]>48&&height>48)return reject('distance2-both-above48');
 for(const [distance,threshold] of [[5,48],[6,64],[7,96]])for(const k of [distance,-distance]){
  if(h[j+k]===1&&(e[j+k]>threshold||height>threshold))return reject('distance'+distance+'-either-above'+threshold);
 }
 g.type[j]=0;g.c[j]=height;g.G[j]=height;g.e[j]=height;g.h[j]=1;g.i[j]=0;g.gFlag[j]=0;
 // Native helper leaves d and F unchanged, unlike setCell.
 return {index:j,candidateIndex:j,accepted:true,reason:null,sampledHeight,placedHeight:height};
}
function place({columns,minHeight,maxHeight,rngA}={}){
 rngFunction(rngA);int32(minHeight,'minHeight');int32(maxHeight,'maxHeight');
 if(minHeight>maxHeight)throw new RangeError('reversed placement height range');
 const output=cloneColumns(columns),result=placeMutable(output,minHeight,maxHeight,rngA);
 return {...result,columns:output,originalRuntimeFullEquivalence:false};
}
function postprocessMutable(g){
 const N=g.c.length;
 if(N<8)throw new RangeError('unknown gate: common postprocess requires indices 0..7; short-array VM path not modeled');
 for(let j=0;j<7;j++)g.c[j+1]=Math.min(g.c[j+1],add(g.c[j],32));
 for(let j=1;j<N-5;j++)if(g.h[j]!==0){
  if(g.h[j-1]===0&&g.c[j]<add(g.c[j-1],16)&&g.c[j]===g.e[j])g.c[j]=add(g.c[j-1],16);
  if(g.h[j+1]===0&&g.c[j]<add(g.c[j+1],16)&&g.c[j]===g.e[j])g.c[j]=add(g.c[j+1],16);
 }
 // g.a() resets scalar h INSIDE each iteration. Keep the observed ordering.
 let scalarH;
 for(let j=0;j<N;j++){scalarH=0;if(scalarH<g.e[j])scalarH=g.e[j];}
 return scalarH;
}
function commonPostprocess(columns){const output=cloneColumns(columns);return {scalarH:postprocessMutable(output),columns:output,originalRuntimeFullEquivalence:false};}
function generatePrimitive({primitive,shape,col8,group,z,rngA,initialColumns}={}){
 if(!SUPPORTED.includes(primitive))throw new RangeError('unimplemented primitive: '+primitive);
 rngFunction(rngA);integer(col8,-128,127,'signed col8');int32(group,'group');int32(z,'incoming z');
 if(!RESET.has(primitive)&&initialColumns===undefined)throw new TypeError('initialColumns required: native setCell preserves F; resize/allocation history is unknown');
 const selectedShape=selectColumnCount(shape,rngA),N=selectedShape.N;
 if(N<8)throw new RangeError('unknown gate: selected N<8 reaches unmodeled short-array postprocess');
 let columns;
 if(RESET.has(primitive))columns=createSyntheticColumns(N);
 else{
  columns=cloneColumns(initialColumns);
  if(columns.c.length!==N)throw new RangeError('unknown resize gate: initialColumns length differs from selected N');
 }
 const initialZ=z;let y=null;
 if(RESET.has(primitive))resetFlat(columns,16);
 if(primitive===2||primitive===3||primitive===22){
  if(primitive===22)y=5;
  let direction=0;const high=primitive===3?8:primitive===22?7:4,low=primitive===3?1:0,resetLow=primitive===3?3:2,unit=primitive===3?8:16;
  for(let j=0;j<N;j++){
   z=add(z,direction===0?1:-1);
   if(z>high||z<=low)direction=(direction+1)&1;
   if(z>high)z=high-1;if(z<=low)z=resetLow;
   setCell(columns,j,0,z*unit,0,1);
  }
 }else if(primitive===17||primitive===26){
  const cap=primitive===17?5+draw(rngA,6):3+draw(rngA,3),threshold=primitive===17?69:59;
  y=primitive===17?Math.trunc(cap*14/10):Math.trunc(N/5)+cap;
  for(let j=0;j<N;j++){
   if(draw(rngA,100)<=threshold)z=add(z,draw(rngA,2)===0?1:-1);
   z=Math.max(1,Math.min(z,cap));setCell(columns,j,1,z*16,0,1);
   columns.d[j]=16;columns.e[j]=cap*16;columns.F[j]=primitive===17?8:16;
  }
 }else if(primitive===21){
  let direction=0,total=0;const upper=N>>2;
  for(let j=0;j<N;j++){
   z=add(z,direction===0?1:-1);
   if(z>upper||z<=0)direction=(direction+1)&1;
   else if(draw(rngA,10000)<=1499)direction=(direction+1)&1;
   if(z>upper)z=upper-1;if(z<=0)z=2;
   total=add(total,z);setCell(columns,j,0,z*16,0,1);
  }
  y=Math.trunc(12*Math.trunc(total/N)/10);
 }else if(primitive===13||primitive===15){
  for(let j=0;j<N;j++){
   if(draw(rngA,100)<=49)z=add(z,draw(rngA,3)-1);
   if(z>3||z<=0)z=2;
   setCell(columns,j,0,z*16,0,0);
  }
 }else if(primitive===19){
  y=9;
  for(let j=0;j<N;j++){z=Math.max(1,Math.min(7,add(z,draw(rngA,3)-1)));setCell(columns,j,0,z*16,0,1);}
 }else if(primitive===28||primitive===37){
  y=primitive===28?0:10;
  if(z>(primitive===28?6:7))z=primitive===28?7:8;
  let remaining=primitive===28?5:8;
  for(let j=0;j<N;j++){
   let flagged=true;
   if(remaining>0){if(j<N-(primitive===28?5:6))remaining--;}
   else{
    if(primitive===28){
     remaining=draw(rngA,5)+3;
     const delta=draw(rngA,7)>4?draw(rngA,2)-3:1,candidate=add(z,delta);
     z=candidate<=1?add(z,1):candidate>7?5:candidate;
    }else{
     remaining=((draw(rngA,3)*draw(rngA,3)+1)>>1)+2;
     z=draw(rngA,7)+2;
     const previous=columns.c[j-1]>>4;
     if(Math.abs(previous-z)<=2){let next;do{next=draw(rngA,7);}while(next===previous-2);z=next+2;}
     if(previous+2===z)z++;
     if(previous-2===z)z++;
    }
    if(columns.c[j-1]<int32(z*16,'profile height'))flagged=false;
    else columns.i[j-1]=0;
   }
   setCell(columns,j,0,int32(z*16,'profile height'),0,flagged?1:0);
   if(primitive===28&&flagged)y=add(y,z);
  }
  if(primitive===28)y=Math.trunc(y/Math.trunc(N/2));
 }else if(primitive===35||primitive===36){
  let remaining=8,segmentFlag=0;
  for(let j=0;j<N;j++){
   if(remaining>0){
    if(j<N-(primitive===35?7:5))remaining--;
    z=add(z,primitive===35?draw(rngA,3)-1:draw(rngA,2)===0?1:-1);
   }else if(primitive===35){
    remaining=draw(rngA,4)+2;z=draw(rngA,7)+1;
    const previous=columns.c[j-1]>>4;
    if(Math.abs(previous-z)<=2)z=previous>3?1:7;
   }else{
    remaining=draw(rngA,6)+3;segmentFlag=(segmentFlag+1)%2;z=z>3?1:6;
   }
   // 35 clamps only its walk branch; transition draws already lie in 1..7.
   if(z<=0)z=2;if(z>(primitive===35?7:6))z=primitive===35?6:5;
   setCell(columns,j,primitive===36?1:0,z*16,0,0);
   if(primitive===36){columns.e[j]=96;columns.d[j]=16;columns.F[j]=16;columns.gFlag[j]=segmentFlag;}
  }
 }
 const placements=[];let baseAttempts=0,attempts=0;
 const config=PLACEMENT[primitive];
 if(config){
  baseAttempts=config.divisor===2?(N-config.offset)>>1:Math.trunc((N-config.offset)/3);
  attempts=group>=0?Math.trunc(Math.imul(baseAttempts,col8)/30):baseAttempts;
  if(Object.is(attempts,-0))attempts=0;
  for(let attempt=0;attempt<attempts;attempt++){
   const placed=placeMutable(columns,config.low,config.high,rngA);placements.push({attempt,...placed});
   if(placed.accepted&&(primitive===11||primitive===15)){
    const j=placed.index;columns.type[j]=1;columns.i[j]=1;columns.F[j]=1;columns.d[j]=48;
   }else if(placed.accepted&&primitive===9){
    const j=placed.index;columns.type[j]=2;columns.F[j]=80+3*(draw(rngA,9)+draw(rngA,9));columns.c[j]=16;columns.d[j]=16;
   }else if(placed.accepted&&primitive===12){
    const j=placed.index;columns.type[j]=1;columns.i[j]=1;columns.F[j]=1+draw(rngA,5);columns.d[j]=32;
   }
  }
  if(RESET.has(primitive))z=1;
 }
 const scalarH=postprocessMutable(columns);
 return {primitive,shape:selectedShape,col8,group,initialZ,z,columns,collisionColumns:columns.c.slice(),
  placements,baseAttempts,attempts,scalarH,scalarWrites:{uZ:primitive===0?null:z,uY:y},
  coordinateSpace:'local-column-index; c is the recovered local collision height array',
  originalRuntimeFullEquivalence:false,originalGeometryPayloadIncluded:false,
  missingGates:MISSING_GATES.slice()};
}
module.exports=Object.freeze({SUPPORTED,KEYS,MISSING_GATES,createSyntheticColumns,selectColumnCount,place,commonPostprocess,generatePrimitive});

},
"experiments/r75-procedural-geometry/lifecycle.cjs":function(module,exports,require){
'use strict';
// Explicit local lifecycle adapter. No implicit fresh/reused choice is made by
// geometry.cjs; no object-link, m/n interpretation or world transform is added.
const {KEYS}=require('./geometry.cjs');
const BYTE_KEYS=new Set(['type','gFlag','h','i']);
const HEIGHT_KEYS=new Set(['c','d','e']);
const SCALARS=['orientation','scalarB','scalarC','scalarD','scalarH'];
const MAX_CAPACITY=65536; // Experiment resource guard, not a native limit.
function integer(value,min,max,label){
 if(!Number.isInteger(value)||value<min||value>max)throw new RangeError(label+' outside '+min+'..'+max);
 return value;
}
const int32=(value,label)=>integer(value,-2147483648,2147483647,label);
function inspectState(state){
 if(!state||!state.columns)throw new TypeError('explicit lifecycle state required');
 integer(state.activeLength,6,MAX_CAPACITY,'activeLength (old N below6 is not modeled)');
 for(const key of SCALARS)int32(state[key],key);
 const capacityByArray={};
 for(const key of KEYS){
  const values=state.columns[key];
  if(!Array.isArray(values))throw new TypeError('capacity array required: '+key);
  integer(values.length,state.activeLength,MAX_CAPACITY,key+' capacity');
  for(const value of values)integer(value,BYTE_KEYS.has(key)?-128:-2147483648,BYTE_KEYS.has(key)?127:2147483647,key+' value');
  capacityByArray[key]=values.length;
 }
 return {activeLength:state.activeLength,capacityByArray};
}
function cloneState(state){
 inspectState(state);
 return {activeLength:state.activeLength,...Object.fromEntries(SCALARS.map(k=>[k,state[k]])),
  columns:Object.fromEntries(KEYS.map(k=>[k,state.columns[k].slice()])),
  originalRuntimeFullEquivalence:false,originalGeometryPayloadIncluded:false};
}
function createExisting(state){return cloneState(state);}
function createFresh(){
 return {activeLength:24,orientation:0,scalarB:0,scalarC:0,scalarD:368,scalarH:16,
  columns:Object.fromEntries(KEYS.map(k=>[k,Array(24).fill(HEIGHT_KEYS.has(k)?16:0)])),
  originalRuntimeFullEquivalence:false,originalGeometryPayloadIncluded:false};
}
function growCapacity(columns,length){
 for(const key of KEYS)while(columns[key].length<length)columns[key].push(0);
}
function fillActive(state,height){
 for(const key of KEYS)state.columns[key].fill(HEIGHT_KEYS.has(key)?height:0,0,state.activeLength);
}
function resize(state,requestedLength){
 int32(requestedLength,'requestedLength');
 const next=cloneState(state),oldN=next.activeLength,newN=Math.max(6,requestedLength);
 integer(newN,6,MAX_CAPACITY,'requested capacity (experiment guard)');
 growCapacity(next.columns,newN);
 for(let index=oldN;index<newN;index++){
  for(const key of HEIGHT_KEYS)next.columns[key][index]=16;
  for(const key of ['F','type','gFlag','h','i'])next.columns[key][index]=0;
  // Integer G is not written. An existing capacity tail may be exposed again.
 }
 // g.a() runs against OLD logical N before assignment, even on shrink.
 // The native finalizer resets scalar h each iteration, so only oldN-1 wins.
 next.scalarH=Math.max(0,next.columns.e[oldN-1]);
 next.activeLength=newN;
 return next;
}
function resetHeight(state,height){
 int32(height,'height');const next=cloneState(state);fillActive(next,height);next.scalarH=height;return next;
}
function resetAllocate(state,requestedLength){
 // g.d(N) itself has no six-column clamp. Keep malformed/short old-N states
 // outside this adapter's reviewed normal lifecycle domain instead of guessing.
 integer(requestedLength,6,MAX_CAPACITY,'reset allocation N (normal domain)');
 const next=cloneState(state);growCapacity(next.columns,requestedLength);
 next.activeLength=requestedLength;fillActive(next,16);
 next.scalarC=0;next.scalarD=(requestedLength-1)*16;
 // This method has no established scalarH write; g.b follows it in <init>.
 return next;
}
function activeColumns(state){
 inspectState(state);return Object.fromEntries(KEYS.map(k=>[k,state.columns[k].slice(0,state.activeLength)]));
}
function applyPrimitiveResult(state,result){
 const next=cloneState(state);
 if(!result||!result.columns)throw new TypeError('explicit generated columns and scalarH required');
 int32(result.scalarH,'generated scalarH');
 const probe={...next,columns:result.columns};
 inspectState(probe);
 for(const key of KEYS){
  if(result.columns[key].length!==next.activeLength)throw new RangeError('primitive result length must equal activeLength');
  for(let i=0;i<next.activeLength;i++)next.columns[key][i]=result.columns[key][i];
 }
 next.scalarH=result.scalarH;
 // Global u.z/u.y writes remain in the primitive result, outside this g state.
 return next;
}
module.exports=Object.freeze({createFresh,createExisting,inspectState,resize,resetHeight,resetAllocate,activeColumns,applyPrimitiveResult});

},
"experiments/r75-procedural-geometry/local-collision.cjs":function(module,exports,require){
'use strict';
// These three e-method contracts catch Java array exceptions and return zero.
// This behavior must NOT be generalized to direct terrain/actor array readers.
function integer(value,label){if(!Number.isInteger(value)||value<-2147483648||value>2147483647)throw new RangeError(label+' outside reviewed signed integer domain');return value;}
const add=(a,b)=>integer(a+b,'non-overflowing index arithmetic');
function sampled(array,index,byte=false){
 if(array===null||array===undefined||index<0||index>=array.length)return {failed:true};
 if(!Array.isArray(array))throw new TypeError('explicit native array representation required');
 const value=integer(array[index],'array value');
 if(byte&&(value<-128||value>127))throw new RangeError('signed byte h required');
 return {value,failed:false};
}
function inputs(x,direction){integer(x,'x');integer(direction,'direction');}
function deltaHeight({columns,x,distance,direction}={}){
 inputs(x,direction);integer(distance,'distance');
 const current=Math.trunc((direction===0?add(x,8):x)/16);
 const next=Math.trunc((direction===0?add(add(x,distance),8):add(x,-distance))/16);
 const a=sampled(columns&&columns.c,current),b=sampled(columns&&columns.c,next);
 if(a.failed||b.failed||a.value===-80||b.value===-80)return 0;
 return integer(b.value-a.value,'non-overflowing height difference');
}
function flagAtDistance({columns,x,distance,direction}={}){
 inputs(x,direction);integer(distance,'distance');
 const i=Math.trunc((direction===0?add(add(x,distance),8):add(x,-distance))/16),value=sampled(columns&&columns.h,i,true);
 return value.failed?0:value.value;
}
function heightAt({columns,x,direction}={}){
 inputs(x,direction);const i=Math.trunc((direction===0?add(x,8):x)/16),value=sampled(columns&&columns.c,i);
 return value.failed?0:value.value;
}
module.exports=Object.freeze({deltaHeight,flagAtDistance,heightAt});

},
"experiments/r75-procedural-geometry/native-rng.cjs":function(module,exports,require){
'use strict';
// Candidate native bounded wrappers + current WIE Java Random algorithm.
// Original handset JVM equivalence is unconfirmed. No clock or guest access.
const MULTIPLIER=0x5deece66dn, ADDEND=11n, MASK=(1n<<48n)-1n;
function exactInteger(value,label){
  if(typeof value==='bigint')return value;
  if(typeof value==='number'&&Number.isSafeInteger(value))return BigInt(value);
  throw new TypeError(label+' must be a bigint or safe integer');
}
function int32(value,label){
  if(!Number.isInteger(value)||value< -2147483648||value>2147483647)throw new RangeError(label+' must be signed int32');
  return value;
}
function seedArgument(value){
  const seed=exactInteger(value,'seed');
  if(seed< -(1n<<63n)||seed>=(1n<<63n))throw new RangeError('seed must be signed int64');
  return seed;
}
function reduceNativeDraw(draw,bound){
  int32(draw,'draw');int32(bound,'bound');
  const divisor=bound<=0?1:bound;
  const wrappedAbs=draw===-2147483648?draw:Math.abs(draw);
  const remainder=wrappedAbs%divisor;
  // Java integer zero has no negative-zero representation.
  return remainder===0?0:remainder;
}
class Java48Random{
  #state;
  constructor(seed){this.setSeed(seed);}
  static fromState(state){
    const value=exactInteger(state,'internal state');
    if(value<0n||value>MASK)throw new RangeError('internal state must fit unsigned 48 bits');
    const random=new Java48Random(0n);random.#state=value;return random;
  }
  get state(){return this.#state;}
  setSeed(seed){this.#state=(seedArgument(seed)^MULTIPLIER)&MASK;}
  nextInt(){
    this.#state=(this.#state*MULTIPLIER+ADDEND)&MASK;
    return Number(BigInt.asIntN(32,this.#state>>16n));
  }
  bounded(bound){int32(bound,'bound');return reduceNativeDraw(this.nextInt(),bound);}
}
class NativeRngStreams{
  #a=null;#b=null;
  constructor({seedA,seedB}={}){
    if(seedA!==undefined)this.#a=new Java48Random(seedA);
    if(seedB!==undefined)this.#b=new Java48Random(seedB);
    // Bound callbacks can be passed directly to geometry without losing this.
    this.rngA=bound=>this.#require('A').bounded(bound);
    this.rngB=bound=>this.#require('B').bounded(bound);
  }
  #require(stream){
    const random=stream==='A'?this.#a:this.#b;
    if(!random)throw new Error('explicit seed required for uninitialized stream '+stream);
    return random;
  }
  initializeA(seed){if(this.#a)throw new Error('stream A already initialized');this.#a=new Java48Random(seed);}
  initializeB(seed){if(this.#b)throw new Error('stream B already initialized');this.#b=new Java48Random(seed);}
  nextIntA(){return this.#require('A').nextInt();}
  setSeedB(seed){
    int32(seed,'B seed');
    if(this.#b)this.#b.setSeed(BigInt(seed));else this.#b=new Java48Random(BigInt(seed));
  }
  snapshot(){return {A:this.#a?this.#a.state:null,B:this.#b?this.#b.state:null};}
}
module.exports={Java48Random,NativeRngStreams,reduceNativeDraw,MULTIPLIER,ADDEND,MASK};

},
"experiments/r76-native-cadence/native-cadence.cjs":function(module,exports,require){
'use strict';

// Candidate-specific primitives, not a complete gameplay dispatcher or a clock.
const INT_MAX = 2147483647;
function requireThat(ok, message) { if (!ok) throw new RangeError(message); }
function integer(value, name, min = -2147483648, max = INT_MAX) {
  requireThat(Number.isSafeInteger(value) && value >= min && value <= max, name + ' is outside the supported integer domain');
  return value;
}
function bool(value, name) { requireThat(typeof value === 'boolean', name + ' must be explicit boolean'); return value; }
function finite(value, name, min = 0) { requireThat(Number.isFinite(value) && value >= min, name + ' must be finite and >= ' + min); return value; }

function intervalForLevel(level) {
  integer(level, 'level', 1, 3); // UI evidence only; setter algebra alone does not establish levels 0/4.
  return 55 + 20 * (4 - level);
}
function nativeLoopBudget({ level, elapsedMs, modelFlag }) {
  const H = intervalForLevel(level);
  requireThat(Number.isSafeInteger(elapsedMs), 'elapsedMs must be integer milliseconds');
  bool(modelFlag, 'modelFlag');
  const remainingMs = Math.max(0, Math.min(H, H - elapsedMs));
  const sleepMs = modelFlag ? Math.floor(remainingMs * 3 / 5) : remainingMs;
  return { H, remainingMs, sleepMs, nextAction: sleepMs > 0 ? 'sleep' : 'yield',
    scope: 'requested wait after one iteration; not measured FPS or an elapsed-time catch-up count' };
}
function nativeDispatchCount({ uiState, loopGuardC }) {
  integer(uiState, 'uiState'); integer(loopGuardC, 'loopGuardC');
  return uiState === 60 && loopGuardC === 0 ? 1 : 0;
}
function ordinaryCountdown({ selector, tutorial, random150 }) {
  requireThat(selector === 'ordinary' && tutorial === false, 'Only the confirmed non-tutorial ordinary selector is supported');
  return 150 + integer(random150, 'random150', 0, 149);
}
function nativeState(input) {
  requireThat(input && typeof input === 'object', 'native state required');
  const { score, countdown, jitter, transitionRequest } = input;
  integer(score, 'score', 0); integer(countdown, 'countdown'); bool(jitter, 'jitter');
  // R77 also reaches native u.l2/3/4; scalar cadence preserves these phases.
  // This widens input validation only; ordinary R76 branch behavior is unchanged.
  integer(transitionRequest, 'transitionRequest', 0, 4);
  return { score, countdown, jitter, transitionRequest };
}

// Each event denotes arrival at the named raw branch. Outer u.k/u.l/UI guards
// are deliberately NOT inferred from these four modeled fields.
function applyNative(state, event) {
  const next = nativeState(state);
  requireThat(event && typeof event === 'object', 'branch event required');
  const kinds = ['score', 'countdown', 'expiry', 'request-map', 'consume-map'];
  requireThat(kinds.includes(event.kind), 'Unknown native branch');
  bool(event.reached, 'reached');
  const result = effect => ({ state: next, effect });
  if (!event.reached) return result('branch-not-reached');
  if (event.kind === 'expiry') {
    if (next.countdown <= 0) next.jitter = true;
    return result(next.countdown <= 0 ? 'jitter-enabled' : 'not-expired');
  }
  const actor = integer(event.actorState, 'actorState');
  if (event.kind === 'score') {
    const behavior = integer(event.behavior, 'behavior');
    if ([13, 16, 11].includes(actor) || behavior === 99) return result('score-blocked');
    requireThat(next.score < INT_MAX, 'Score overflow is outside this experiment');
    next.score++;
    return result('score-plus-one');
  }
  if (event.kind === 'countdown') {
    const guard = integer(event.timerGuardT, 'timerGuardT');
    if (actor === 13 || guard !== 0) return result('countdown-blocked');
    requireThat(next.countdown > -2147483648, 'Countdown underflow is outside this experiment');
    next.countdown--;
    return result('countdown-minus-one');
  }
  if (event.kind === 'request-map') {
    const behavior = integer(event.behavior, 'behavior');
    if (next.countdown >= -29 || [13, 16].includes(actor) || behavior === 99) return result('request-blocked');
    next.transitionRequest = 1;
    return result('map-requested');
  }
  if (next.transitionRequest !== 1) return result('no-map-request');
  if ([13, 11, 16].includes(actor)) return result('consume-blocked');
  const conditionType = integer(event.conditionType, 'conditionType');
  requireThat(conditionType !== 18, 'Condition 18 has a separate unresolved consumer');
  const countdown = ordinaryCountdown(event);
  next.countdown = countdown;
  next.transitionRequest = 0;
  next.jitter = false;
  return result('ordinary-map-consumed'); // Does not reset score/lives or create a new attempt.
}

// Everything below is an authored browser/host policy. It does not recreate
// Thread.sleep or establish the candidate's actual device cadence.
function hostOptions(input) {
  requireThat(input && typeof input === 'object', 'Explicit host options required');
  const { stepMs, maxStepsPerFrame, maxFrameElapsedMs, catchUp, overflow, pausePolicy, backgroundReturnPolicy, longGapPolicy } = input;
  finite(stepMs, 'stepMs'); requireThat(stepMs > 0, 'stepMs must be positive');
  integer(maxStepsPerFrame, 'maxStepsPerFrame', 1);
  finite(maxFrameElapsedMs, 'maxFrameElapsedMs'); requireThat(maxFrameElapsedMs >= stepMs, 'maxFrameElapsedMs must cover one authored step');
  requireThat(['none', 'bounded'].includes(catchUp), 'catchUp must be none or bounded');
  requireThat(['discard', 'retain'].includes(overflow), 'overflow must be discard or retain');
  requireThat(catchUp !== 'none' || (maxStepsPerFrame === 1 && overflow === 'discard'), 'No catch-up requires cap 1 and discarded overflow');
  requireThat(pausePolicy === 'discard' && backgroundReturnPolicy === 'discard' && longGapPolicy === 'discard', 'Only explicit discarded pause/background/long-gap elapsed is modeled');
  return { stepMs, maxStepsPerFrame, maxFrameElapsedMs, catchUp, overflow, pausePolicy, backgroundReturnPolicy, longGapPolicy };
}
function createHostClock(options) {
  return { schema: 1, authored: true, options: hostOptions(options), lastMs: null, remainderMs: 0, suspended: false };
}
function hostClock(input) {
  requireThat(input && input.schema === 1 && input.authored === true, 'Unsupported host clock');
  const options = hostOptions(input.options);
  if (input.lastMs !== null) finite(input.lastMs, 'lastMs');
  finite(input.remainderMs, 'remainderMs'); bool(input.suspended, 'suspended');
  requireThat(options.overflow === 'retain' || input.remainderMs < options.stepMs, 'Discarding clock cannot retain whole-step backlog');
  return { schema: 1, authored: true, options, lastMs: input.lastMs, remainderMs: input.remainderMs, suspended: input.suspended };
}
function hostFrame(input, frame) {
  const clock = hostClock(input), o = clock.options;
  requireThat(frame && typeof frame === 'object', 'Explicit host frame required');
  const { nowMs, paused, backgrounded, returnedFromBackground } = frame;
  finite(nowMs, 'nowMs'); bool(paused, 'paused'); bool(backgrounded, 'backgrounded'); bool(returnedFromBackground, 'returnedFromBackground');
  requireThat(clock.lastMs === null || nowMs >= clock.lastMs, 'Authored host clock requires monotonic timestamps');
  const elapsedMs = clock.lastMs === null ? 0 : nowMs - clock.lastMs;
  const first = clock.lastMs === null, wasSuspended = clock.suspended;
  clock.lastMs = nowMs;
  clock.suspended = paused || backgrounded;
  const result = (steps, reason, droppedMs) => ({ clock, steps, reason, elapsedMs, droppedMs, authored: true });
  if (first || clock.suspended || wasSuspended || returnedFromBackground || elapsedMs > o.maxFrameElapsedMs) {
    const droppedMs = elapsedMs + clock.remainderMs;
    clock.remainderMs = 0;
    return result(0, first ? 'baseline' : clock.suspended ? 'suspended' : wasSuspended || returnedFromBackground ? 'return-baseline' : 'long-gap-discard', droppedMs);
  }
  const available = clock.remainderMs + elapsedMs;
  const due = Math.floor(available / o.stepMs);
  requireThat(Number.isSafeInteger(due), 'Host backlog exceeds supported arithmetic');
  const steps = Math.min(due, o.maxStepsPerFrame);
  const droppedMs = o.overflow === 'discard' ? (due - steps) * o.stepMs : 0;
  // Modulo keeps fractional authored intervals non-negative after discarding
  // whole steps, without subtracting two separately rounded products.
  clock.remainderMs = o.overflow === 'discard' ? available % o.stepMs : available - steps * o.stepMs;
  return result(steps, due > steps ? 'authored-step-cap' : 'scheduled', droppedMs);
}

module.exports = { intervalForLevel, nativeLoopBudget, nativeDispatchCount, ordinaryCountdown, nativeState, applyNative, createHostClock, hostFrame };

},
"experiments/r76-native-composition/composition.cjs":function(module,exports,require){
'use strict';
// Independent composition experiment. No original masks, frame rows or stage data.
const R=require('../r75-procedural-geometry/native-rng.cjs');
const A=require('../r75-procedural-geometry/assembly.cjs');
const D=require('../r75-procedural-geometry/column-dynamics.cjs');
const C=require('../../evidence/r75-research/collision-native/collision_adapter.cjs');
const Air=require('../../evidence/r75-research/collision-native/airborne_adapter.cjs');
const SCHEMA='nom3-local-composition-v2';
const UNSUPPORTED=Object.freeze(['q3-mask-path','cell-entity-factory-and-collisions','boundary-side-transition','actor-state-setter-and-mission-hooks','score-and-cadence','scene-save-and-renderer']);
const copy=x=>structuredClone(x);
function int(v,label){if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new RangeError(label+' must be signed int32');return v;}
function bool(v,label){if(typeof v!=='boolean')throw new TypeError(label+' must be explicit boolean');return v;}
function actor(value){
 if(!value)throw new TypeError('explicit actor snapshot required');
 const result={};
 for(const k of ['actorState','frame','height','p','o','k'])result[k]=int(value[k],'actor.'+k);
 for(const k of ['verticalActive','special'])result[k]=bool(value[k],'actor.'+k);
 return result;
}
function stage(value){
 if(!value)throw new TypeError('explicit stage contract required');
 return Object.fromEntries(['behaviorCode','primitive','col8','group'].map(k=>[k,int(value[k],'stage.'+k)]));
}
function validate(s){
 if(!s||s.schema!==SCHEMA)throw new TypeError('composition schema required');
 A.createExistingAssembly(s.pool);actor(s.actor);stage(s.stage);
 int(s.controller.controllerStateUK,'u.I+k');int(s.controller.modeP,'u.I+p');int(s.controller.z,'u.I+z');int(s.controller.y,'u.I+y');
 if(typeof s.rng.A!=='string'||!/^\d+$/.test(s.rng.A))throw new TypeError('RNG A internal state must be a decimal string');
 R.Java48Random.fromState(BigInt(s.rng.A));
 if(!Array.isArray(s.pendingEffects))throw new TypeError('pendingEffects array required');
 bool(s.initialized,'initialized');
 return s;
}
function create({seedA,pool,stage:stageInput,actor:actorInput,controller,fixtureOrigin}={}){
 if(typeof fixtureOrigin!=='string'||!fixtureOrigin.trim())throw new TypeError('explicit supplied-data provenance label required');
 const random=new R.Java48Random(seedA);
 const s={schema:SCHEMA,pool:A.createExistingAssembly(pool),stage:stage(stageInput),actor:actor(actorInput),
  controller:{controllerStateUK:int(controller?.controllerStateUK,'u.I+k'),modeP:int(controller?.modeP,'u.I+p'),z:int(controller?.z,'u.I+z'),y:int(controller?.y,'u.I+y')},
  rng:{A:random.state.toString(),B:null,algorithm:'existing WIE Java48 contract; original handset seed/VM unconfirmed'},
  initialized:false,stepCount:0,pendingEffects:[],fixtureOrigin,
  originalRuntimeFullEquivalence:false,originalPayloadIncluded:false,productIntegrated:false};
 return validate(s);
}
function randomFor(s,trace){
 const r=R.Java48Random.fromState(BigInt(s.rng.A));
 return {draw:phase=>bound=>{const before=r.state.toString(),value=r.bounded(bound);trace.push({phase,bound,value,before,after:r.state.toString()});return value;},save:()=>{s.rng.A=r.state.toString();}};
}
function blocked(s,reason,trace=[]){return {supported:false,state:copy(s),reason,trace,unsupported:UNSUPPORTED,originalRuntimeFullEquivalence:false};}
function initialize(input,{sharedNReached,currentPrimitiveReached}={}){
 validate(input);bool(sharedNReached,'sharedNReached');bool(currentPrimitiveReached,'currentPrimitiveReached');
 if(input.pendingEffects.length)return blocked(input,'pending-effects-require-explicit-external-resolution');
 if(input.stage.behaviorCode===3)return blocked(input,'q3-mask-path');
 if(!sharedNReached||!currentPrimitiveReached)return blocked(input,'initialization-caller-gates-not-reached');
 if(input.initialized)throw new Error('explicit new stage state required for reinitialization');
 const s=copy(input),trace=[],rngTrace=[],r=randomFor(s,rngTrace);
 const resized=A.resizeFour(s.pool,s.pool.shape,r.draw('shared-N'),s.pool.shapeIndex);
 s.pool=resized.pool;trace.push({phase:'shared-N',N:resized.selectedShape.N,operations:resized.trace});
 const generated=A.generateCurrentProcedural(s.pool,{...s.stage,z:s.controller.z,rngA:r.draw('current-primitive')});
 s.pool=generated.pool;
 // Preserve the exact explicit global write names; do not invent cell consumers.
 const globalWrites=copy(generated.globalScalarWrites);
 if(globalWrites.uZ!==null)s.controller.z=int(globalWrites.uZ,'generated uZ');
 if(globalWrites.uY!==null)s.controller.y=int(globalWrites.uY,'generated uY');
 s.generatedGlobals=globalWrites;
 trace.push({phase:'current-primitive',indices:generated.generatedIndices,globalWrites});
 r.save();s.initialized=true;
 return {supported:true,state:s,trace,rngTrace,unsupported:UNSUPPORTED,originalRuntimeFullEquivalence:false};
}
function step(){throw new Error('v1 step removed: use terrainPhase then caller-owned u.E prefix/input/movement then contactPhase; scalar u.I+z cannot replace u.()V+z');}
function terrainPhase(input,request={}){
 validate(input);
 if(Object.hasOwn(request,'camera')||Object.hasOwn(request,'globalUpdate'))throw new TypeError('legacy camera/globalUpdate proxies cannot certify nativeT/nativeZ');
 if(input.pendingEffects.length)return blocked(input,'pending-effects-require-explicit-external-resolution');
 if(!input.initialized)return blocked(input,'not-initialized');
 if(input.stage.behaviorCode===3)return blocked(input,'q3-mask-path');
 for(const key of ['shapeTick','columns'])bool(request.reached?.[key],'reached.'+key);
 let s=copy(input);const trace=[],rngTrace=[],r=randomFor(s,rngTrace);
 if(request.reached.shapeTick){s.pool=A.tickShape(s.pool,r.draw('dynamic-shape'));trace.push({phase:'dynamic-shape',method:'u.()V+y'});}
 r.save();
 function port(name,method){
  if(typeof request[name]!=='function')return {supported:false,reason:'missing-explicit-port:'+method};
  const answer=request[name](copy(s));
  if(!answer||answer.supported!==true)return {supported:false,reason:answer?.reason||'unsupported-port:'+method};
  if(!['synthetic-fixture','implemented-contract'].includes(answer.scope))throw new TypeError('port scope required');
  s=copy(validate(answer.state));trace.push({phase:name,method,scope:answer.scope,effects:copy(answer.effects||[])});return {supported:true};
 }
 let answer=port('nativeT','u.()V+t');
 if(!answer.supported)return {...blocked(s,answer.reason,trace),rngTrace};
 const current=s.pool.objects[s.pool.currentIndex];
 if(request.reached.columns){
  const columns=D.stepColumns({geometry:current.geometry,position:current.position,behaviorCode:s.stage.behaviorCode,direction:s.pool.direction,
   controllerStateUK:s.controller.controllerStateUK,actorFlagEZA:s.actor.verticalActive,actorHeight:s.actor.height});
  current.geometry=columns.geometry;s.actor.height=columns.actorHeight;
  trace.push({phase:'columns',method:'g.()V+c',sampledIndex:columns.sampledIndex,sampledDelta:columns.sampledDelta,processedColumns:columns.processedColumns});
  if(columns.caughtException){s.pendingEffects=[{op:'external-exception-continuation',...columns.caughtException}];return {...blocked(s,'column-exception-continuation-not-composed',trace),rngTrace};}
 }
 answer=port('nativeZ','u.()V+z');
 if(!answer.supported)return {...blocked(s,answer.reason,trace),rngTrace};
 return {supported:true,state:s,trace,rngTrace,unsupported:UNSUPPORTED,originalRuntimeFullEquivalence:false,scope:'terrain-prefix-only; no u.E or horizontal movement executed'};
}
function contactPhase(input,request={}){
 validate(input);
 if(input.pendingEffects.length)return blocked(input,'pending-effects-require-explicit-external-resolution');
 if(!input.initialized)return blocked(input,'not-initialized');
 if(input.stage.behaviorCode===3)return blocked(input,'q3-mask-path');
 if(input.controller.modeP!==0)return blocked(input,'alternate-u.p-mode');
 bool(request.ordinaryContact,'ordinaryContact');
 const previousX=int(request.previousX,'explicit pre-movement u.aB');
 const s=copy(input),trace=[],current=s.pool.objects[s.pool.currentIndex];
 let contact=null;
 if(request.ordinaryContact){
  const columns=current.geometry.columns,x=current.position,direction=s.pool.direction;
  if(s.actor.verticalActive){
   const nativeActor={...s.actor,state:s.actor.actorState};delete nativeActor.actorState;
   contact=Air.ordinaryAirborneStep({q:s.stage.behaviorCode,modeP:s.controller.modeP,geometry:columns,previousX,x,direction,actor:nativeActor,frameRow:request.frameRow});
   s.actor.height=contact.contact.height;s.pendingEffects=copy(contact.contact.effects).filter(e=>e.op!=='add-height');
  }else{
   const sample=C.ordinaryTerrainSample(columns,previousX,x,direction);
   const before=s.actor.height,delta=C.animationDelta(s.actor.actorState,s.actor.frame,false,before,sample.floor,request.frameRow);
   const after=int(before+delta,'ground vertical sum');
   const ground=C.groundedContact(sample,after,s.actor.p);
   s.actor.height=ground.projectedHeight;
   s.pendingEffects=ground.requestsState===null?[]:[{op:'rewind-tangent',value:previousX},{op:'request-state',state:ground.requestsState}];
   contact={supported:true,sample,vertical:{before,delta,after},contact:ground};
  }
  trace.push({phase:'ordinary-contact',branch:s.actor.verticalActive?'airborne':'grounded',pendingCount:s.pendingEffects.length});
 }
 s.stepCount++;
 return {supported:true,state:s,trace,contact,unsupported:UNSUPPORTED,originalRuntimeFullEquivalence:false,scope:'reached ordinary contact only; u.E tail not executed'};
}
function acceptExternalContinuation(input,{actor:nextActor,pool,controller,evidenceLabel}={}){
 validate(input);
 if(!input.pendingEffects.length)throw new Error('no pending effects to resolve');
 if(typeof evidenceLabel!=='string'||!evidenceLabel.trim())throw new TypeError('external continuation provenance required');
 const s=copy(input);s.actor=actor(nextActor);s.pool=A.createExistingAssembly(pool);
 s.controller={controllerStateUK:int(controller?.controllerStateUK,'u.I+k'),modeP:int(controller?.modeP,'u.I+p'),z:int(controller?.z,'u.I+z'),y:int(controller?.y,'u.I+y')};
 s.lastExternalContinuation={evidenceLabel,effects:copy(s.pendingEffects),nativeSetterExecutedByComposition:false};s.pendingEffects=[];
 return s;
}
module.exports=Object.freeze({SCHEMA,UNSUPPORTED,create,initialize,step,terrainPhase,contactPhase,acceptExternalContinuation});

},
"experiments/r76-native-input/input-action.cjs":function(module,exports,require){
'use strict';
// Independent, reached-branch input/action contract. No guest/frame payload.
const terrain=require('../r75-procedural-geometry/local-collision.cjs');
const collision=require('../../evidence/r75-research/collision-native/collision_adapter.cjs');
const i32=(x,label)=>{if(!Number.isInteger(x)||x< -2147483648||x>2147483647)throw new RangeError(label+' requires int32');return x;};
const add=(a,b)=>i32(a+b,'non-overflowing arithmetic');
function direction(v){if(v!==0&&v!==1)throw new RangeError('direction must be 0 or 1');return v;}
function keyNotify({event,key,enabled,latch}){
 i32(event,'event');i32(key,'key');i32(latch,'latch');
 if(typeof enabled!=='boolean')throw new TypeError('explicit callback enabled flag required');
 return {handled:true,latched:event===1&&enabled,latch:event===1&&enabled?(key===0x10004?-5:key):latch};
}
function consumeLatch(latch){i32(latch,'latch');return {key:latch,latch:-9999};}
function dispatchGameplayKey({key,u,r}){
 i32(key,'key');
 for(const k of ['l','D','q','s','k','j'])i32(u[k],'u.'+k);i32(r.t,'r.t');
 const out=(reason,buffer=u.j,pause=false,supported=true)=>({supported,reason,buffer,pauseRequested:pause});
 if(key===-16)return out(r.t===0?'pause-request':'input-lock',u.j,r.t===0);
 if(![-5,53,0x10004].includes(key))return out('unhandled-gameplay-key');
 if(u.l===4)return out('u.l4-result-flow-outside-action-dispatch',u.j,false,false);
 if(u.D!==0)return out('u.D-lock');
 if(r.t!==0)return out('r.t-lock');
 if(u.q===99&&u.s<0)return out('q99-negative-countdown');
 if(u.l>0)return out('u.l-lock');
 if(u.k!==0)return out('u.k-lock');
 return out('action-buffer-refill',3);
}
function arrayAt(array,index,label){
 if(!Array.isArray(array)||index<0||index>=array.length)throw new RangeError('native direct array read failed: '+label+'['+index+']');
 return i32(array[index],label);
}
function ordinaryTerrainRequest({columns,x,N,direction:dir}){
 direction(dir);i32(x,'lookahead');i32(N,'N');
 const deltas=[16,32,48,64,80,96].map(distance=>terrain.deltaHeight({columns,x,distance,direction:dir}));
 // These two clamps precede moving-column adjustments; the96 sample is untouched.
 for(const i of [3,4])if(deltas[i]>96)deltas[i]=0;
 let index=Math.trunc(x/16);const step=dir===0?1:-1;
 for(let i=0;i<5;i++){
  index+=step;if(index<0||index>=N)continue;
  // g.[B+h=h, g.[B+f=type, g.[B+g=gFlag, g.[I+f=F.
  if(arrayAt(columns.h,index,'h')!==1)continue;
  deltas[i]=add(deltas[i],8);
  if(arrayAt(columns.type,index,'type')===1&&(arrayAt(columns.gFlag,index,'gFlag')&1)===0)
   deltas[i]=add(deltas[i],arrayAt(columns.F,index,'F')*[3,4,4,5,5][i]);
  deltas[i]=Math.max(deltas[i],32);
 }
 const [a,b,c,d,e,f]=deltas;
 const band=[32,48,64].some(distance=>terrain.flagAtDistance({columns,x,distance,direction:dir})===1);
 let request=0;
 if(band){
  if(a>0&&b>0||b>0&&c>0||c>0&&d>0)request=5;
  if(a>32||b>32||c>32||d>32)request=5;
  if(b>64||c>64||d>64||b+c>80||c+d>80||b>48&&c>48||c>48&&d>48||
    a>16&&c>16||b>16&&d>16||c>16&&e>16||a>16&&d>16||b>16&&e>16||c>16&&f>16)request=7;
 }else{
  if(b>32||c>32)request=5;
  if(b>64||c>64||d>64)request=7;
  if(Math.abs(a-b)<=16&&Math.abs(b-c)<=16)request=0;
 }
 return {request,deltas,band};
}
function contains(actorX,actorY,target,frame,dir,box){
 const pointX=add(target.n,target.e*frame),pointY=add(target.o,target.f*frame),scale=target.i*8;
 return collision.rectangleContains({originX:actorX,originY:actorY,pointX,pointY,
  width:add(box[0],scale),height:add(box[1],scale),tangentOffset:box[2],normalOffset:box[3],direction:dir,
  coefficients:{i0:1,j0:0,k0:1,k3:0,l0:0,l3:1}}).inside;
}
function validateTargets(targets){
 if(!Array.isArray(targets))throw new TypeError('explicit targets array required (empty is allowed)');
 for(const target of targets)if(target!==null)for(const k of ['a','n','o','e','f','i','k'])i32(target[k],'target.'+k);
}
function predictAction({request,targets,x,height,speed,direction:dir,frameRows,targetIds}){
 validateTargets(targets);direction(dir);i32(request,'request');i32(speed,'speed');
 const sign=dir===0?1:-1,checks=[];
 if([3,5,7].includes(request)){
  const row=frameRows&&frameRows[request];
  if(!Array.isArray(row)||row.length<1)return {supported:false,reason:'explicit-jump-frame-row-required',request};
  const count=i32(row[0],'row count');if(count<=0||count>127||row.length<=count)throw new RangeError('native jump row must have positive signed-byte count and available deltas');
  for(let i=1;i<=count;i++){i32(row[i],'signed delta');if(row[i]<-128||row[i]>127)throw new RangeError('row delta must be signed byte');}
  let px=x,py=height;const maximum=request===5?4:6;
  for(let frame=0;frame<=maximum;frame++){
   for(let index=0;index<targets.length;index++){
    const t=targets[index];if(t===null||t.a===0)continue;
    checks.push({frame,index,box:'jump'});
    if(contains(px,py,t,frame,dir,[32,32,-2,24]))return {supported:true,request:request+1,targetIds:targetIds.slice(),checks,reason:'jump-forecast-upgrade'};
   }
   px=add(px,speed*sign);py=add(py,row[frame%count+1]);
  }
  return {supported:true,request,targetIds:targetIds.slice(),checks,reason:'jump-forecast-clear'};
 }
 const selected=[];
 for(let frame=0;frame<=6;frame++){
  const px=add(x,speed*frame*sign);
  for(let index=0;index<targets.length;index++){
   const t=targets[index];if(t===null||t.a===0||selected.includes(index))continue;
   let hit=false;checks.push({frame,index,box:'first'});
   if(contains(px,height,t,frame,dir,[32,48,-18,16])){
    if(t.k===1&&request<=1)request=2;request=Math.max(request,t.k);hit=true;
   }else{
    checks.push({frame,index,box:'second'});
    if(contains(px,height,t,frame,dir,[48,32,-10,56])){
     if(t.k===7&&request<=7)request=8;
     if(t.k===5&&request<=5)request=6;
     if(request<=3)request=4;hit=true;
    }else{
     checks.push({frame,index,box:'third'});
     if(contains(px,height,t,frame,dir,[32,64,14,16])){request=Math.max(request,t.k);hit=true;}
    }
   }
   if(hit)selected.push(index);
   if(selected.length===3)return {supported:true,request:request===0?3:request,targetIds:selected,checks,reason:'three-target-limit'};
  }
 }
 return {supported:true,request:request===0?3:request,targetIds:[...selected,...Array(3-selected.length).fill(-1)],checks,reason:'linear-forecast'};
}
function knownActionSetter({actor,requested,tutorial,x,modeP=0}){
 if(modeP!==0)return {supported:false,reason:'alternate-mode-setter-remapping-and-effects'};
 if(!Number.isInteger(requested)||requested<0||requested>12||requested===11)return {supported:false,reason:'requested-state-outside-reviewed-action-subset'};
 let state=requested;
 if(tutorial&&(state===6||state===5&&x>400))state=7;
 const next={...actor,previousState:actor.state,state,frame:0,o:0,k:0};
 if(state===0){next.verticalActive=false;next.special=false;}
 else if(![1,2,12].includes(state))next.verticalActive=true;
 if(state===12&&actor.p<=5)next.p=6;
 const effects=[];
 if([13,11].includes(actor.state)&&requested!==actor.state)effects.push({op:'external-u.i-clear-and-u.c-call',raw:'0x170e8..170f6'});
 effects.push({op:'resource-and-animation-setup-required',raw:'0x169e6..16b68',state});
 return {supported:true,actor:next,effects,requested,effective:state};
}
function evaluateBufferedAction(input){
 const {buffer,modeP,q,x,N,direction:dir,actor,actionLock,tutorial,columns,targets,frameRows,q99H,q99J}=input;
 for(const [k,v] of Object.entries({buffer,modeP,q,x,N,actionLock}))i32(v,k);direction(dir);
 for(const k of ['state','frame','height','p','o','k','requested','speed'])i32(actor[k],'actor.'+k);
 for(const k of ['verticalActive','special'])if(typeof actor[k]!=='boolean')throw new TypeError('explicit actor.'+k+' required');
 if(typeof tutorial!=='boolean')throw new TypeError('explicit tutorial flag required');
 if(!Array.isArray(actor.targetIds)||actor.targetIds.length!==3)throw new TypeError('actor.targetIds requires three explicit IDs');
 const unsupported=reason=>({supported:false,reason,buffer,actor:{...actor},effects:[]});
 if(buffer<=0)return {supported:true,reason:'no-positive-buffer',buffer,actor:{...actor},effects:[],direction:dir};
 if(N<=0)return unsupported('active-geometry-positive-width-required');
 if(modeP!==0)return unsupported('u.p-nonzero-selects9-and-has-separate-setter');
 if(q===3)return unsupported('q3-input-mask-selection-not-modelled');
 let next={...actor,targetIds:actor.targetIds.slice()},remaining=buffer-1,selection;
 const lookahead=dir===0?Math.min(add(x,15),N*16-1):Math.max(x,0);
 if(q===99&&(q99H===undefined||q99J===undefined))return unsupported('q99-H-and-J-required');
 if(q===99){i32(q99H,'u.H');i32(q99J,'u.J');}
 if(q===99&&q99H>0&&[1,4,6].includes(q99J))selection={supported:true,request:7,reason:'q99-priority-action'};
 else if(dir===0?lookahead>N*16-72:lookahead<=71)selection={supported:true,request:12,reason:'near-corner-priority'};
 else{
  const chosen=ordinaryTerrainRequest({columns,x:lookahead,N,direction:dir});
  selection=predictAction({request:chosen.request,targets,x,height:actor.height,speed:actor.speed,direction:dir,frameRows,targetIds:actor.targetIds});
  selection.terrain=chosen;
  if(!selection.supported)return unsupported(selection.reason);
 }
 next.requested=selection.request;if(selection.targetIds)next.targetIds=selection.targetIds.slice();
 const effects=[];let reason='request-retained-no-transition';
 const apply=requested=>{
  const result=knownActionSetter({actor:next,requested,tutorial,x,modeP});
  if(!result.supported)return result;
  next=result.actor;effects.push({op:'request-state',requested,effective:result.effective},...result.effects);return result;
 };
 const floor=()=>terrain.heightAt({columns,x,direction:dir});
 if(next.state===0&&!next.verticalActive&&next.height<add(floor(),8)&&terrain.flagAtDistance({columns,x,distance:0,direction:dir})===0){
  const applied=apply(next.requested);if(!applied.supported)return unsupported(applied.reason);
  reason='grounded-request';
 }else if(actionLock<=0&&[3,5,7].includes(next.state)){
  const limit={3:5,5:8,7:11}[next.state];
  if(next.frame>1&&next.frame<=limit){apply(10);reason='early-airborne-action10';}
  else if(next.height>add(floor(),24)){apply(10);reason='high-airborne-action10';}
 }
 if(next.state!==actor.state)remaining=0;
 return {supported:true,reason,selection,buffer:remaining,actor:next,effects,direction:dir,
  scope:'reached-input-selection-only; omitted resource effects and remaining update are caller-owned'};
}
module.exports={keyNotify,consumeLatch,dispatchGameplayKey,ordinaryTerrainRequest,predictAction,knownActionSetter,evaluateBufferedAction};

},
"experiments/r76-native-input/q3-input-action.cjs":function(module,exports,require){
'use strict';
// Reached q3 input selector. No mask/frame payload, RNG, or boundary execution.
const common=require('./input-action.cjs');
const terrain=require('../r75-procedural-geometry/local-collision.cjs');
function integer(v,label){if(!Number.isInteger(v)||v< -2147483648||v>2147483647)throw new RangeError(label+' requires int32');return v;}
const add=(a,b)=>integer(a+b,'non-overflowing q3 input arithmetic');
function validateDirection(dir){if(dir!==0&&dir!==1)throw new RangeError('direction must be0 or1');}
class NativeInputArrayError extends RangeError{
 constructor(index,length,raw,checks){
  super('q3 input native direct c['+index+'] read is out of bounds');
  this.name='NativeInputArrayError';this.index=index;this.length=length;this.raw=raw;this.checks=checks.slice();
  this.nativeException='java/lang/ArrayIndexOutOfBoundsException';
 }
}
function q3CornerScan({c,lookahead,N,direction}){
 integer(lookahead,'lookahead');integer(N,'N');validateDirection(direction);
 if(!Array.isArray(c))throw new TypeError('explicit prepared current-side c array required');
 const checks=[];
 const read=(index,raw)=>{
  if(index<0||index>=c.length)throw new NativeInputArrayError(index,c.length,raw,checks);
  return integer(c[index],'column height');
 };
 let column=Math.trunc(lookahead/16);
 if(direction===0)column=Math.min(column,23);else column=Math.max(column,0);
 const out=(corner,reason)=>({corner,reason,column,lookahead,checks,rngDraws:0});
 // Four adjacent rises are checked before any missing-column sentinel.
 for(let distance=1;distance<=4;distance++){
  const available=direction===0?column<=N-distance-1:column>=distance;
  if(!available)continue;
  const destination=column+(direction===0?distance:-distance),previous=destination+(direction===0?-1:1);
  const raw=direction===0?['0x48034','0x47fac','0x47f22','0x47e9a'][distance-1]:['0x483a4','0x48348','0x482ea','0x4828c'][distance-1];
  const height=read(destination,raw),priorHeight=read(previous,raw),delta=add(height,-priorHeight);
  const corner=delta>96&&(direction===1||height!==-80);
  checks.push({kind:'rise',distance,destination,previous,height,priorHeight,delta,corner,raw});
  if(corner)return out(true,'adjacent-rise-over96');
 }
 for(let distance=1;distance<=4;distance++){
  // Native left fourth test uses column>2, not column>3 (0x48122/48124).
  const available=direction===0?column<=N-distance-1:column>(distance===4?2:distance-1);
  if(!available)continue;
  const index=column+(direction===0?distance:-distance);
  const raw=direction===0?['0x47dda','0x47d9e','0x47d62','0x47d2a'][distance-1]:['0x48252','0x4819e','0x48162','0x47d2a'][distance-1];
  const value=read(index,raw),corner=value===-1;
  checks.push({kind:'sentinel',distance,index,value,corner,raw});
  if(corner)return out(true,'missing-column-minus1');
 }
 return out(false,'continue-common-terrain-and-target-forecast');
}
function evaluateQ3BufferedAction(input){
 const {buffer,modeP,q,x,N,direction,actor,actionLock,tutorial,columns,targets,frameRows}=input;
 for(const [label,value] of Object.entries({buffer,modeP,q,x,N,actionLock}))integer(value,label);
 validateDirection(direction);
 for(const key of ['state','frame','height','p','o','k','requested','speed'])integer(actor[key],'actor.'+key);
 for(const key of ['verticalActive','special'])if(typeof actor[key]!=='boolean')throw new TypeError('explicit actor.'+key+' required');
 if(typeof tutorial!=='boolean')throw new TypeError('explicit tutorial flag required');
 if(!Array.isArray(actor.targetIds)||actor.targetIds.length!==3)throw new TypeError('three explicit actor.targetIds required');
 const unsupported=reason=>({supported:false,reason,buffer,actor:{...actor},effects:[],direction,rngDraws:0});
 if(q!==3)return unsupported('requires-q3-input-dispatch');
 if(modeP!==0)return unsupported('u.p-alternate-mode-precedes-q3-selector');
 if(buffer<=0)return {supported:true,reason:'no-positive-buffer',buffer,actor:{...actor},effects:[],direction,rngDraws:0};
 // All132 retained q3 variants use fixed shape16=[0,0,24,24]. The standalone
 // scanner keeps its exact N guards, but full fallback needs a matched column
 // base because right scan caps23 while the common routine preserves that base.
 if(N!==24)return unsupported('full-q3-phase-requires-confirmed-fixed24-shape');
 const lookahead=direction===0?Math.min(add(x,15),N*16-1):Math.max(x,0);
 let scan,scanError=null;
 try{scan=q3CornerScan({c:columns&&columns.c,lookahead,N,direction});}
 catch(error){
  if(!(error instanceof NativeInputArrayError))throw error;
  scanError=error;
  scan={corner:null,reason:'direct-array-error-caught-by-input-handler',index:error.index,raw:error.raw,checks:error.checks};
 }
 let selection;
 if(scanError)selection={supported:true,request:actor.requested,reason:'handler3099-retains-existing-e.r'};
 else if(scan.corner)selection={supported:true,request:12,reason:scan.reason};
 else{
  // q3 rejoins0x41dc4, not0x41d7c: do not run ordinary72-unit corner tests.
  const chosen=common.ordinaryTerrainRequest({columns,x:lookahead,N,direction});
  selection=common.predictAction({request:chosen.request,targets,x,height:actor.height,speed:actor.speed,
   direction,frameRows,targetIds:actor.targetIds});
  selection.terrain=chosen;
  if(!selection.supported)return unsupported(selection.reason);
 }
 let next={...actor,targetIds:actor.targetIds.slice(),requested:selection.request},remaining=buffer-1;
 if(selection.targetIds)next.targetIds=selection.targetIds.slice();
 const effects=scanError?[{op:'caught-native-array-error-diagnostic',exception:scanError.nativeException,index:scanError.index,
  readRaw:scanError.raw,protectedCheckpoint:621,handlerState:3099,handlerRaw:'0x489e6..48a58',resumeRaw:'0x41ddc',executed:false}]:[];
 let reason='request-retained-no-transition';
 const apply=requested=>{
  const result=common.knownActionSetter({actor:next,requested,tutorial,x,modeP});
  if(result.supported){next=result.actor;effects.push({op:'request-state',requested,effective:result.effective},...result.effects);}
  return result;
 };
 const floor=()=>terrain.heightAt({columns,x,direction});
 if(next.state===0&&!next.verticalActive&&next.height<add(floor(),8)&&terrain.flagAtDistance({columns,x,distance:0,direction})===0){
  const result=apply(next.requested);if(!result.supported)return unsupported(result.reason);reason='grounded-request';
 }else if(actionLock<=0&&[3,5,7].includes(next.state)){
  const limit={3:5,5:8,7:11}[next.state];
  if(next.frame>1&&next.frame<=limit){apply(10);reason='early-airborne-action10';}
  else if(next.height>add(floor(),24)){apply(10);reason='high-airborne-action10';}
 }
 if(next.state!==actor.state)remaining=0;
 return {supported:true,reason,scan,selection,buffer:remaining,actor:next,effects,direction,rngDraws:0,
  scope:'q3 reached input phase and known array-error continuation; no mask construction, movement, boundary RNG or general VM unwind'};
}
module.exports={NativeInputArrayError,q3CornerScan,evaluateQ3BufferedAction};

},
"experiments/r77-native-actor-state/actor-state.cjs":function(module,exports,require){
'use strict';
// Static-derived actor state transitions. Providers supply scalar resource/clock
// metadata; no original animation, image, sound or byte-array payload is embedded.
const copy=x=>structuredClone(x),sub=(a,b)=>(a-b)|0;
const Goals=require('../r77-native-goals/goals.cjs');
function int(v,label){if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new RangeError(label+' requires int32');return v;}
function base(s){
 if(!s?.game?.actor||!s.game.controller||!s.game.pool||!s.u||!s.r||!s.action)throw new TypeError('explicit frame-driver state required');
 for(const k of ['actorState','frame','height','p','o','k'])int(s.game.actor[k],'actor.'+k);
 for(const k of ['verticalActive','special'])if(typeof s.game.actor[k]!=='boolean')throw new TypeError('actor.'+k+' requires boolean');
 int(s.game.controller.modeP,'modeP');return s;
}
function reachedDamageCredit({conditionType,score,lives,hour}){
 for(const[k,v]of Object.entries({conditionType,score,lives,hour}))int(v,k);
 if(score>189&&score<=210&&(conditionType===28||conditionType===29&&hour>11&&hour<=23))return true;
 if(lives!==1)return false;
 return conditionType===26&&hour===12||conditionType===27&&hour===0||
  conditionType===30&&score>489&&score<=510||conditionType===31&&hour>11&&hour<=23&&score>489&&score<=510||
  conditionType===32&&score>989&&score<=1010||conditionType===33&&hour>=0&&hour<=11&&score>989&&score<=1010;
}
function setActorState(input,requested,providers={}){
 base(input);int(requested,'requested state');
 if(requested<0||requested>16)return{supported:false,state:copy(input),effects:[],accepted:false,reason:'actor-state-outside-reviewed0..16'};
 const s=copy(input),a=s.game.actor,effects=[],trace=[],old=a.actorState,modeP=s.game.controller.modeP;
 let effective=requested,accepted=false;
 const emit=(kind,raw,detail={})=>effects.push({kind,raw,...detail});
 const music=raw=>emit('music-reselect',raw,{nativeMethod:'u.()V+c',callContext:{uiState:s.uiState,pendingUiState:s.pendingUiState,timerT:s.r.timerT,lives:s.u.lives,behaviorCode:s.game.stage?.behaviorCode,stageMusicIndex:s.u.ax}});
 const mark=(phase,raw,detail={})=>trace.push({phase,raw,...detail});
 const out=(reason,supported=true)=>({supported,state:s,effects,trace,accepted,requested,effective,reason,originalRuntimeFullEquivalence:false,originalPayloadIncluded:false});
 // Damage immunity precedes cleanup, tutorial remaps and all resource work.
 if([13,16].includes(requested)&&a.p!==0)return out('damage-cooldown-rejected');
 if(modeP===0){
  if([13,11].includes(old)&&requested!==old){s.u.musicModeI=0;mark('clear-music-mode','0x170ee');music('0x170f6')}
 }else if(old===16)music('0x17114');
 if(typeof s.r.tutorial!=='boolean')throw new TypeError('r.tutorial requires boolean');
 if(s.r.tutorial){
  const side=s.game.pool.objects[s.game.pool.currentIndex];int(side.position,'current local x');
  if(effective===6||effective===5&&side.position>400){effective=7;mark('tutorial-state-remap','0x170c8')}
 }
 // These checks happen BEFORE alternate-mode13->16. Do not combine them.
 if(effective===13&&old===13||effective===16&&old===16)return out('same-hurt-state-rejected');
 if(modeP!==0){if(effective===0)effective=15;if(effective===13)effective=16;}
 a.frame=0;a.o=0;a.k=0;s.action.previousState=old;a.actorState=effective;accepted=true;
 mark('common-state-reset','0x16968..0x169a4',{old,effective});
 if([13,16].includes(effective)){
  emit('vibration-request','0x16c5a',{nativeMethod:'k.(I)V+c',durationArgument:300,gate:'k.Z+a',strengthArgument:100});
  int(s.r.slot,'r.slot');int(s.r.frontier,'r.frontier');
  if(s.r.slot!==100&&s.r.slot===sub(s.r.frontier,1)){
   if(typeof providers.clockHour!=='function')return out('clock-hour-provider-required',false);
   let hour;
   try{hour=int(providers.clockHour({state:s,raw:'0x16cda'}),'provided hour');}catch(error){return out('clock-hour-provider-failed:'+error.message,false)}
   if(hour<0||hour>23)return out('clock-hour-provider-outside0..23',false);
   s.u.hourA=hour;mark('sample-hour-before-damage','0x16cda',{hour});
   if(reachedDamageCredit({conditionType:s.r.conditionType,score:s.u.score,lives:s.u.lives,hour})){s.r.credit=1;mark('damage-condition-credit','0x16cd6..0x17084',{conditionType:s.r.conditionType})}
  }
  if(s.r.tutorial){a.p=0;s.u.s=1000;mark('tutorial-damage','0x16c9e/0x16cae')}
  else{a.p=20;s.u.lives=sub(int(s.u.lives,'lives'),1);mark('damage-life-decrement','0x16cba/0x16cd4')}
 }
 if(effective===12&&a.p<=5){a.p=6;mark('state12-minimum-cooldown','0x16c48')}
 if(effective===0){a.verticalActive=false;a.special=false;mark('clear-vertical-flags','0x16c1a/0x16c24')}
 else if(![1,2,12,14].includes(effective)){a.verticalActive=true;mark('set-vertical-active','0x169e2')}
 // State setter does not alter speed/requested/targetIds/direction/height.
 int(s.r.actorResourceQ,'r.actorResourceQ');
 emit('ensure-actor-resource','0x169fe',{resource:s.r.actorResourceQ,variant:0,part:0,load:true});
 // The (0,0) resource slot returns before the loader's nonzero-slot D path.
 if(typeof providers.spriteState!=='function')return out('sprite-scalar-metadata-provider-required',false);
 let metadata;
 try{metadata=providers.spriteState({resource:s.r.actorResourceQ,state:effective,raw:'0x16a40'});int(metadata?.stateCount,'sprite stateCount');}
 catch(error){return out('sprite-scalar-metadata-provider-failed:'+error.message,false)}
 if(metadata.stateCount< -32768||metadata.stateCount>32767)return out('sprite-stateCount-not-signed-short',false);
 if(metadata.stateCount<=effective){emit('diagnostic','0x16a4c..0x16afc',{code:'actor-resource-state-out-of-range',state:effective,stateCount:metadata.stateCount});return out('native-resource-range-diagnostic-return')}
 s.actorSprite={...(s.actorSprite||{}),flagsB:96,flagsA:0,frameIndex:0};
 mark('sprite-counter-reset','0x16b22/0x16b32/0x16b42');
 if(metadata.firstFrame===undefined){
  // Presentation can be handled semantically without original x.[B+a IDs.
  s.actorSprite.binding={resource:s.r.actorResourceQ,state:effective,status:'semantic-effect'};
  emit('bind-actor-sprite','0x16b54/0x16b68',{resource:s.r.actorResourceQ,state:effective,index:0,firstFrame:'provider-owned',presentationOnly:true});
 }else{
  int(metadata.firstFrame,'first sprite frame');if(metadata.firstFrame< -128||metadata.firstFrame>127)return out('sprite-firstFrame-not-signed-byte',false);
  s.actorSprite.firstFrame=metadata.firstFrame;s.actorSprite.binding={resource:s.r.actorResourceQ,state:effective,status:'scalar-metadata'};
  mark('sprite-first-frame','0xa9cc/0x16b68',{value:metadata.firstFrame});
 }
 return out('state-setter-return');
}
function advanceFrameCounters(input,rowCount){
 base(input);int(rowCount,'signed animation row count');if(rowCount< -128||rowCount>127)throw new RangeError('signed-byte rowCount required');
 const s=copy(input),a=s.game.actor;a.frame=(a.frame+1)|0;a.k=0;
 if(a.frame>=rowCount-1){a.k=1;if(a.frame>=rowCount)a.o=1;}
 return{state:s,raw:'0x41afc..0x41b32/0x48862..0x4888a',rowCount};
}
function fatalGate(input){
 base(input);const a=input.game.actor,lives=int(input.u.lives,'lives');
 if(lives<=0&&[13,16].includes(a.actorState)&&a.frame>7)return{reached:true,reason:'hurt-animation-complete',raw:'0x4882e..0x4885c',target:'0x485c4'};
 if(lives<0)return{reached:true,reason:'negative-lives-direct',raw:'0x41b48..0x41b56',target:'0x485c4'};
 return{reached:false,reason:'continue-cooldown-and-early-reset',target:'0x41b60'};
}
function finalizeIfFatal(input,{deathTail=Goals.fatalFinalize}={}){
 const gate=fatalGate(input);
 if(!gate.reached)return{supported:true,state:copy(input),effects:[],gate,terminal:false};
 if(typeof deathTail!=='function')return{supported:false,state:copy(input),effects:[],gate,terminal:false,reason:'native-death-tail-adapter-required'};
 const result=deathTail(copy(input),{entryRaw:'0x485c4',gate});
 if(!result||!result.state||result.supported!==true||result.exit!=='return-u.E')return{...result,supported:false,gate,terminal:false,reason:result?.reason||'native-death-tail-not-completed'};
 return{...result,gate,terminal:true,continuation:'u.E return, no cooldown/input/contact afterward'};
}
module.exports={setActorState,reachedDamageCredit,advanceFrameCounters,fatalGate,finalizeIfFatal};

},
"experiments/r77-native-alternate-frame/alternate-frame.cjs":function(module,exports,require){
'use strict';
const Actor=require('../r77-native-actor-state/actor-state.cjs');
const U=require('../r75-procedural-geometry/entity-update.cjs');
const R=require('../r75-procedural-geometry/native-rng.cjs');
const Angles=require('../r77-native-entity-contact/entity-contact.cjs');
const Boss=require('../r77-native-boss-contact/boss-contact.cjs');
const copy=x=>structuredClone(x),add=(a,b)=>(a+b)|0,sub=(a,b)=>(a-b)|0,mul=Math.imul;
const abs=x=>x===-2147483648?x:Math.abs(x),div=(a,b)=>Math.trunc(a/b)|0;
function int(v,label){if(!Number.isInteger(v)||v< -2147483648||v>2147483647)throw new TypeError(label+' requires int32');return v;}
const side=s=>s.game.pool.objects[s.game.pool.currentIndex];
function context(input,options={}){
 const c={s:copy(input),effects:[],trace:[],options};
 c.mark=(phase,raw,detail={})=>c.trace.push({phase,raw,...detail});
 c.finish=(supported=true,reason='alternate-actor-complete',continuation='u.E-tail')=>({supported,state:c.s,effects:c.effects,trace:c.trace,reason,continuation,
  originalRuntimeFullEquivalence:false,originalPayloadIncluded:false,scope:'reached alternate actor continuation; caller owns prelude and entity tail'});
 c.apply=r=>{c.s=r.state;c.effects.push(...r.effects||[]);c.trace.push(...r.trace||[]);return r;};
 c.setter=id=>c.apply(Actor.setActorState(c.s,id,options.actorProviders));
 c.draw=(bound,raw)=>{const random=R.Java48Random.fromState(BigInt(c.s.game.rng.A)),value=random.bounded(bound);c.s.game.rng.A=random.state.toString();c.mark('rng-A',raw,{bound,value});return value;};
 c.music=raw=>c.effects.push({kind:'music-reselect',raw,nativeMethod:'u.()V+c',callContext:{uiState:c.s.uiState,pendingUiState:c.s.pendingUiState,timerT:c.s.r.timerT,lives:c.s.u.lives,behaviorCode:c.s.game.stage.behaviorCode,stageMusicIndex:c.s.u.ax}});
 return c;
}
function directionSign(s){const d=int(s.game.pool.direction,'direction');if(d!==0&&d!==1)throw new RangeError('native direction0..1 required');return d===0?1:-1;}
function components(s,amount){
 const n=int(s.game.actor.angleN,'actor.angleN'),sign=directionSign(s);
 return{x:div(mul(mul(int(amount,'amount'),U.nativeCos100(sub(360,n))),sign),100),
  y:div(mul(mul(amount,U.nativeCos100(sub(270,n))),sign),100)};
}
function angularStep(input,amount){
 const c=context(input),v=components(c.s,amount),a=c.s.game.actor,p=side(c.s);
 p.position=add(int(p.position,'position'),v.x);a.height=add(int(a.height,'height'),v.y);
 c.mark('angular-step','0x16660..16782',{amount,dx:v.x,dy:v.y});return c.finish(true,'angular-step-return','return-e.a');
}
function advanceDBody(c){
 let a=c.s.game.actor;
 if(c.s.game.stage.behaviorCode!==99||int(c.s.boss?.K,'boss.K')>0){
  const r=angularStep(c.s,[13,16].includes(a.actorState)?3:int(c.s.action.speed,'speed'));c.apply(r);
 }
 a=c.s.game.actor;
 if(a.o>0){
  if(a.actorState===15)a.o=0;
  else if(a.actorState===16)c.music('0x4195c');
  const r=c.setter(0);if(!r.supported)return r;
 }
 a=c.s.game.actor;
 if(a.actorState===15&&(a.frame&3)===0&&![9,16].includes(c.s.action.previousState)){
  a.angleQ=add(int(a.angleQ,'angleQ'),450)%360;c.mark('state15-quarter-turn','0x4190a..41952',{angleQ:a.angleQ});
 }
 return c.finish(true,'u.D-return','return-u.D');
}
function advanceD(input,options={}){const c=context(input,options);return advanceDBody(c);}
function homingBody(c){
 const a=c.s.game.actor,b=c.s.boss,p=side(c.s);
 const target=add(Angles.sampledAngle(p.position,a.height,int(b?.W,'boss.W'),add(int(b.X,'boss.X'),8),n=>c.draw(n,'0x5792c')),180)%360;
 const difference=sub(target,int(a.angleN,'angleN')),step=mul(2,Math.sign(difference));
 a.angleN=abs(difference)<=179?add(a.angleN,step):sub(a.angleN,step);
 // u.L does not normalize this last write or copy it to angleQ.
 c.mark('homing-heading','0x57900..579ba',{target,difference,angleN:a.angleN});return c.finish(true,'u.L-return','return-u.L');
}
function homing(input,options={}){return homingBody(context(input,options));}
function boundsBody(c){
 const s=c.s,a=s.game.actor,p=side(s),N=int(p.geometry.activeLength,'N');
 let margin=a.actorState===9&&a.frame>1&&a.frame<=5?10:0;
 const v=components(s,s.action.speed),ax=abs(v.x),ay=abs(v.y);
 const hi=()=>sub(sub(mul(N,16),32),margin),lo=()=>add(16,margin),bottom=()=>add(32,margin);
 c.mark('alternate-boundary-entry','0x45ad8..45bd4',{margin,absX:ax,absY:ay});
 if(p.position<=hi()&&p.position>=lo()&&a.height>=bottom()&&a.height<=hi())return c.finish(true,'alternate-inside-bounds','0x41f4a');
 const bounce=(constant,raw)=>{
  a.angleN=add(add(-a.angleN|0,c.draw(91,raw)),constant)%360;a.angleQ=a.angleN;
  c.mark('boundary-heading',raw,{constant,angleN:a.angleN});
 };
 // The same native stack scalar is first a10-unit attack margin and later a
 //1-valued glancing flag. Later clamps deliberately observe its updated value.
 if(p.position>hi()){
  bounce(495,'0x46094');p.position=hi();if(ay>mul(ax,2))margin=1;
  c.mark('right-clamp','0x46080..4610c',{x:p.position,margin});
 }
 if(p.position<lo()){
  bounce(495,'0x4601e');p.position=lo();if(ay>mul(ax,2))margin=1;
  c.mark('left-clamp','0x4600a..4607e',{x:p.position,margin});
 }
 if(a.height<bottom()){
  bounce(675,'0x45fb4');a.height=bottom();if(mul(ay,2)<ax)margin=1;
  c.mark('bottom-clamp','0x45fa0..46008',{height:a.height,margin});
 }
 if(a.height>hi()){
  bounce(675,'0x45f32');a.height=hi();if(mul(ay,2)<ax)margin=1;
  c.mark('top-clamp','0x45f1e..45f9e',{height:a.height,margin});
 }
 if(margin===0&&a.p===0){
  c.effects.push({kind:'audio-cue-request',role:'alternate-boundary-impact',raw:'0x45d0e'});
  const r=c.setter(13);if(!r.supported)return r;
  if(c.s.r.slot!==100&&c.s.r.slot===sub(c.s.r.frontier,1)){
   if(typeof c.options.actorProviders?.clockHour!=='function')return c.finish(false,'boundary-credit-clock-hour-required');
   const hour=int(c.options.actorProviders.clockHour({state:c.s,raw:'0x45d4c'}),'hour');if(hour<0||hour>23)return c.finish(false,'hour-outside0..23');
   c.s.u.hourA=hour;const type=c.s.r.conditionType;
   if(type===14||type===15&&hour>=12&&hour<=23||type===16&&hour>=0&&hour<=11)c.s.r.credit=add(c.s.r.credit,1);
   c.mark('alternate-boundary-credit','0x45d1c..45f1c',{hour,type,credit:c.s.r.credit});
  }
 }
 // Overwrites even the state16 setter's20. No assignment on inside-bound return.
 c.s.game.actor.p=8;c.mark('boundary-cooldown8','0x45cdc..45ce6');return c.finish(true,'alternate-boundary-return','0x41f4a');
}
function reflectBounds(input,options={}){return boundsBody(context(input,options));}
function continueActor(input,options={}){
 const c=context(input,options);
 if(int(c.s.game.controller.modeP,'modeP')===0)return c.finish(false,'alternate-mode-required');
 if(c.s.game.pendingEffects?.length)return c.finish(false,'prior-pending-effects-require-resolution');
 c.mark('alternate-input-entry','0x41c9c');
 if(int(c.s.u.buffer,'buffer')>0){
  c.s.u.buffer=sub(c.s.u.buffer,1);const old=c.s.game.actor.actorState;
  c.s.action.requested=9;c.mark('alternate-request9','0x48488');
  if(old===15){const r=c.setter(9);if(!r.supported)return r;}
  if(c.s.game.actor.actorState!==old)c.s.u.buffer=0;
 }
 const q=c.s.game.stage.behaviorCode;
 if(q===99){const r=c.apply(Boss.actorContact(c.s,options));if(!r.supported)return c.finish(false,r.reason);}
 const bounds=boundsBody(c);if(!bounds.supported)return bounds;
 if(q===99){
  if(c.s.game.controller.modeP<=0){const r=c.apply(Boss.groundedBossBranch(c.s,options));return c.finish(r.supported,r.reason);}
  const j=int(c.s.boss?.J,'boss.J');
  if(j===5&&c.draw(10000,'0x458fa')<2000||j===7)homingBody(c);
 }
 const d=advanceDBody(c);if(!d.supported)return d;
 c.mark('tail-entry',q===99?'0x458e4 -> 0x4248c':'0x458a6 -> 0x4248c');
 return c.finish();
}
module.exports={continueActor,reflectBounds,angularStep,advanceD,homing,components};

},
"experiments/r77-native-boss-contact/boss-contact.cjs":function(module,exports,require){
'use strict';
const G=require('./boss-geometry.cjs');
const H=require('../r75-procedural-geometry/entity-posthooks.cjs');
const Runtime=require('../r75-procedural-geometry/cell-entity-runtime.cjs');
const Angles=require('../r77-native-entity-contact/entity-contact.cjs');
const Actor=require('../r77-native-actor-state/actor-state.cjs');
const Trajectory=require('../r77-native-trajectories/trajectories.cjs');
const RNG=require('../r75-procedural-geometry/native-rng.cjs');
const {add,sub,mul,integer:int,NativeArrayFault}=H;
function actorContact(input,providers={}){
 let s=structuredClone(input);const effects=[],trace=[],rngTrace=[];
 const finish=(supported,reason)=>({supported,state:s,effects,trace,rngTrace,reason,scope:'implemented-contract',continuationRaw:'0x45ad8',originalRuntimeFullEquivalence:false});
 if(s.game.stage.behaviorCode!==99)return finish(false,'q99-required');
 if(s.game.controller.modeP===0)return finish(false,'alternate-mode-contact-not-reached');
 const a=()=>s.game.actor,b=()=>s.boss,pos=()=>s.game.pool.objects[s.game.pool.currentIndex].position;
 int(b().K,'boss.K');
 if(b().K<=0)return finish(true,'boss-inactive');
 for(const k of ['actorState','frame','height','p','angleN','orientation'])int(a()[k],'actor.'+k);
 const attack=a().actorState===9&&a().frame>1&&a().frame<=5,size=attack?2:1;
 const hit=G.bossFootprint(b(),pos(),a().height,size,{B:s.u.B,bossCell:providers.bossCell});
 trace.push({raw:'0x46278',phase:'boss-footprint',size,hit});
 if(!hit)return finish(true,'no-contact');
 const random=RNG.Java48Random.fromState(BigInt(s.game.rng.A));
 const draw=bound=>{const value=providers.rngA?providers.rngA(bound):random.bounded(bound);int(value,'RNG value');if(value<0||value>=Math.max(1,bound))throw new RangeError('native negative remainder/out-of-domain draw');rngTrace.push({bound,value});s.game.rng.A=random.state.toString();return value;};
 const angle=(x,y)=>Angles.sampledAngle(pos(),a().height,x,y,draw);
 if(b().J===5)a().angleN=angle(b().W,add(b().X,8));
 if(b().J===7)a().angleN=angle(184,0);
 if(b().J===9)a().angleN=add(angle(b().W,add(b().X,8)),180)%360;
 a().angleQ=a().angleN;
 trace.push({raw:'0x462c6',phase:'contact-recoil-heading',angleQ:a().angleQ});
 if(!attack){
  if(a().p!==0)return finish(true,'actor-cooldown');
  effects.push({kind:'diagnostic',semantic:'boss-body-contact',raw:'0x46300'});
  const result=Actor.setActorState(s,13,providers.actorProviders||providers);
  s=result.state;effects.push(...result.effects);trace.push(...result.trace);
  return finish(result.supported,result.supported?'actor-damage-setter':'actor-setter-provider-required');
 }
 if(b().Y===2)return finish(true,'boss-hit-recovery');
 b().K=sub(b().K,1);b().Y=2;b().H=4;a().p=8;
 trace.push({raw:'0x46356..0x46374',phase:'boss-damage',K:b().K,Y:2,H:4,p:8});
 if(b().J===9){
  const size=add(Math.trunc(draw(3)/2),1);
  const args=[2,32,0,0,size,add(b().W,8),sub(b().X,16),0,6,1];
  const result=Runtime.executeFactory(args,{viewOrientation:a().orientation,rngA:draw,slots:s.entities});
  trace.push({raw:'0x463d2',phase:'boss9-contact-spawn',args,index:result.index});
  if(result.index<0||!s.entities[result.index])throw new NativeArrayFault('u.entities',result.index);
  const e=s.entities[result.index],t=a().orientation,dir=s.game.pool.direction;
  if(t<0||t>3||![0,1].includes(dir))throw new RangeError('normal orientation/direction required');
  const dx=t===0?1:t===2?-1:0,dy=t===1?-1:t===3?1:0,sign=dir===0?1:-1;
  e.n=add(e.n,mul(mul(dx,40),sign));e.o=add(e.o,mul(mul(dy,40),sign));
  effects.push({kind:'spawned-entity',index:result.index,raw:'0x464de'});
 }
 return finish(true,'boss-damaged');
}
function groundedBossBranch(input,providers={}){
 let s=structuredClone(input);const effects=[],trace=[];
 const result=(supported,reason)=>({supported,state:s,effects,trace,reason,scope:'implemented-contract',continuationRaw:'0x4248c',originalRuntimeFullEquivalence:false});
 if(s.game.stage.behaviorCode!==99)return result(false,'q99-required');
 if(s.game.controller.modeP>0)return result(false,'positive-mode-uD-and-homing-required');
 let a=s.game.actor;
 const delta=Trajectory.deltaAt(a.actorState,a.frame,providers.trajectoryOptions);
 if(!delta.supported)return result(false,delta.reason);
 a.height=add(a.height,delta.delta);trace.push({raw:'0x45990',phase:'boss-row-displacement',delta:delta.delta});
 if(a.actorState===0&&a.height>16){a.height=sub(a.height,24);trace.push({raw:'0x45a1a',phase:'boss-standing-fall',delta:-24});}
 if(a.height<=16){a.height=16;trace.push({raw:'0x459fc',phase:'boss-floor-clamp',height:16});}
 if(a.o>0&&a.actorState>0){const reset=Actor.setActorState(s,0,providers.actorProviders||providers);s=reset.state;effects.push(...reset.effects);trace.push(...reset.trace);if(!reset.supported)return result(false,reset.reason);}
 return result(true,'boss-grounded-to-entity-tail');
}
module.exports={actorContact,groundedBossBranch};

},
"experiments/r77-native-boss-contact/boss-geometry.cjs":function(module,exports,require){
'use strict';
const records=require('./boss-regions.json').records;
const H=require('../r75-procedural-geometry/entity-posthooks.cjs');
const {add,sub,mul,abs,integer:int,NativeArrayFault}=H;
function record(id){if(!Number.isInteger(id)||id<0||id>=records.length)throw new NativeArrayFault('u.c',id);return records[id];}
function bossHeader(id){return record(id).header.slice();}
function bossFields(id){return Object.fromEntries('HIJKLMNOPQRSTUV'.split('').map((key,i)=>[key,bossHeader(id)[i]]));}
function frameIndex(b,B){
 for(const k of ['J','Y'])int(b[k],'boss.'+k);
 if(b.Y===1)return sub(int(b.R,'boss.R'),1);
 if(b.Y===2)return sub(int(b.S,'boss.S'),1);
 if(b.Y===20){if(b.J===5)return 1;if(b.J===7||b.J===9)return 2;}
 if(b.Y>10&&b.Y<=19){if([1,5,6].includes(b.J))return sub(b.Y,9);if(b.J===4)return Math.trunc(sub(b.Y,8)/2)|0;}
 int(B,'u.B');const time=b.J===7?Math.trunc(B/3)|0:B;
 const phase=abs(sub(-100,time))%6;
 // Native switch uses an unsigned >5 test; negative MIN_VALUE remainder takes L.
 return sub(int(b[phase<0?'L':'LMNOPQ'[phase]],'boss animation field'),1);
}
function geometryCell(id,frame,col,row){
 const r=record(id);if(!Number.isInteger(frame)||frame<0||frame>=r.planes.length)throw new NativeArrayFault('boss collision plane',frame);
 int(col,'boss col');int(row,'boss row');
 if(col<0||row<0||col>=r.header[12]||row>=r.header[13])return false;
 return r.planes[frame].some(([x0,y0,x1,y1])=>col>=x0&&col<x1&&row>=y0&&row<y1);
}
function bossPoint(b,x,y,{bossCell,B}={}){
 for(const k of ['W','X','T','U'])int(b[k],'boss.'+k);int(x,'point x');int(y,'point y');
 const col=Math.trunc(sub(x,sub(b.W,b.T<<3))/16)|0;
 const row=Math.trunc(sub(y,sub(add(b.X,8),b.U<<3))/16)|0;
 if(col<0||row<0||col>=b.T||row>=b.U)return false;
 const plane=frameIndex(b,B);
 return bossCell?!!bossCell(b.J,plane,col,row):geometryCell(b.J,plane,col,row);
}
function bossFootprint(b,x,y,size,options={}){
 for(const k of ['W','X','T','U'])int(b[k],'boss.'+k);int(x,'entity x');int(y,'entity y');int(size,'size');
 if(abs(sub(x,b.W))>=add(b.T<<4,16)||abs(sub(y,add(b.X,8)))>=add(b.U<<4,16))return false;
 const left=sub(sub(x,16),size<<3),bottom=sub(sub(y,4),size<<3);
 const point=(px,py)=>bossPoint(b,px,py,options);
 if(point(sub(left,1),sub(bottom,1)))return true;
 for(let i=0;i<=size;i++)if(point(add(left,i<<4),sub(bottom,1)))return true;
 for(let i=0;i<=size;i++)if(point(sub(left,1),add(bottom,i<<4)))return true;
 for(let i=0;i<=size;i++)for(let j=0;j<=size;j++)if(point(add(left,i<<4),add(bottom,j<<4)))return true;
 return false;
}
module.exports=Object.freeze({bossHeader,bossFields,frameIndex,geometryCell,bossPoint,bossFootprint,supportedRecords:Object.freeze(records.map((_,i)=>i))});

},
"experiments/r77-native-boss-contact/boss-regions.json":function(module,exports,require){
module.exports={"schema":"boss-functional-regions-v1","scope":"Candidate functional numeric headers and gameplay occupancy; original packed resources excluded","nativeSha256":"782b2c836ef32331e74a943367aa7bae09891fa56ca39cd89acfa887bcfa55d3","records":[{"header":[15,15,1,10,1,1,1,2,2,2,3,4,10,10,4],"planes":[[[2,0,3,1],[7,0,8,1],[3,1,7,2],[0,2,1,3],[2,2,3,3],[7,2,8,3],[9,2,10,3],[1,3,2,7],[8,3,9,7],[3,5,4,6],[6,5,7,6],[0,7,1,8],[2,7,3,8],[7,7,8,8],[9,7,10,8],[3,8,7,9],[2,9,3,10],[7,9,8,10]],[[3,0,4,1],[6,0,7,1],[3,1,7,2],[2,2,3,3],[7,2,8,3],[0,3,2,4],[8,3,10,4],[1,4,2,6],[8,4,9,6],[3,5,4,6],[6,5,7,6],[0,6,2,7],[8,6,10,7],[2,7,3,8],[7,7,8,8],[3,8,7,9],[3,9,4,10],[6,9,7,10]],[[3,1,7,2],[2,2,3,3],[7,2,8,3],[1,3,2,7],[8,3,9,7],[4,5,6,6],[3,6,4,7],[6,6,7,7],[2,7,3,8],[7,7,8,8],[3,8,7,9]],[[1,0,2,1],[8,0,9,1],[0,1,1,2],[3,1,7,2],[9,1,10,2],[2,2,3,3],[4,2,6,3],[7,2,8,3],[1,3,2,7],[8,3,9,7],[3,4,4,6],[6,4,7,6],[2,7,3,8],[7,7,8,8],[0,8,1,9],[3,8,7,9],[9,8,10,9],[1,9,2,10],[8,9,9,10]]]},{"header":[16,8,1,12,1,1,1,2,2,2,3,2,12,18,6],"planes":[[[4,1,6,2],[9,1,11,2],[5,2,6,5],[9,2,10,5],[5,5,10,6],[7,6,8,11],[3,8,4,9],[9,8,10,9],[4,9,5,11],[10,9,11,11],[4,11,11,12],[7,12,8,13],[7,13,9,14],[5,14,8,15],[7,15,9,16],[5,16,8,17],[6,17,7,18]],[[3,1,5,2],[10,1,12,2],[4,2,5,4],[10,2,11,4],[5,4,6,5],[9,4,10,5],[6,5,9,6],[7,6,8,10],[5,7,6,8],[11,7,12,8],[4,8,5,10],[10,8,11,10],[5,10,10,11],[7,11,8,12],[7,12,9,13],[5,13,8,14],[7,14,9,15],[5,15,8,16],[6,16,7,17]],[[9,1,11,2],[3,2,5,3],[9,2,10,5],[4,3,5,6],[8,5,9,6],[4,6,8,7],[11,6,12,7],[7,7,8,9],[10,7,11,9],[4,9,10,10],[4,10,5,11],[7,10,8,12],[5,11,6,12],[7,12,9,13],[5,13,8,14],[7,14,9,15],[5,15,8,16],[6,16,7,17]],[[9,1,11,2],[9,2,10,5],[8,5,9,6],[4,6,8,7],[11,6,12,7],[0,7,5,8],[7,7,8,9],[10,7,11,9],[0,8,1,9],[5,9,10,10],[4,10,5,11],[7,10,8,12],[3,11,4,12],[7,12,9,13],[5,13,8,14],[7,14,9,15],[5,15,8,16],[6,16,7,17]],[[4,1,6,2],[9,1,11,2],[5,2,6,3],[9,2,10,3],[3,3,5,4],[10,3,12,4],[4,4,11,5],[7,5,8,8],[4,6,5,7],[10,6,11,7],[3,7,4,8],[11,7,12,8],[4,8,11,9],[7,9,8,11],[7,11,9,12],[5,12,8,13],[7,13,9,14],[5,14,8,15],[6,15,7,16]],[[9,1,11,2],[9,2,10,3],[0,3,4,4],[10,3,12,4],[0,4,1,5],[3,4,11,5],[4,5,5,7],[7,5,8,8],[10,5,11,8],[5,7,6,8],[6,8,10,9],[7,9,8,11],[7,11,9,12],[5,12,8,13],[7,13,9,14],[5,14,8,15],[6,15,7,16]]]},{"header":[14,3,1,18,1,1,1,2,2,2,3,4,9,8,4],"planes":[[[0,1,2,2],[4,1,5,3],[7,1,9,2],[1,2,2,3],[7,2,8,3],[1,3,8,4],[0,4,1,6],[8,4,9,6],[2,5,3,6],[6,5,7,6],[1,6,8,7],[3,7,4,8],[5,7,6,8]],[[1,1,3,2],[4,1,5,3],[6,1,8,2],[2,2,3,3],[6,2,7,3],[1,3,8,4],[0,4,1,6],[8,4,9,6],[2,5,3,6],[6,5,7,6],[1,6,8,7],[2,7,3,8],[6,7,7,8]],[[0,1,2,2],[3,1,4,3],[5,1,6,3],[7,1,9,2],[1,2,2,3],[7,2,8,3],[1,3,8,4],[0,4,1,6],[8,4,9,6],[3,5,4,6],[5,5,6,6],[1,6,8,7],[3,7,4,8],[5,7,6,8]],[[2,1,3,2],[5,1,6,2],[8,1,9,2],[1,2,2,3],[4,2,5,3],[7,2,8,3],[1,3,8,4],[0,4,1,6],[2,4,3,5],[6,4,7,5],[8,4,9,6],[3,5,4,6],[5,5,6,6],[1,6,8,7],[2,7,3,8],[6,7,7,8]]]},{"header":[19,11,1,10,1,1,1,2,2,2,3,4,6,20,4],"planes":[[[3,0,5,1],[2,1,3,4],[5,1,6,2],[3,4,4,5],[2,5,3,8],[0,8,2,9],[0,9,1,10],[1,10,2,12],[2,12,3,17],[4,12,5,14],[3,17,4,19],[4,19,6,20]],[[3,0,5,1],[2,1,3,3],[5,1,6,2],[3,3,4,4],[2,4,3,8],[0,8,2,9],[0,9,1,10],[1,10,2,12],[2,12,3,17],[4,12,5,14],[3,17,4,19],[4,19,6,20]],[[3,0,6,1],[2,1,3,2],[2,2,4,3],[4,3,5,4],[5,4,6,5],[4,5,5,6],[2,6,4,7],[2,7,3,8],[0,8,2,9],[0,9,1,10],[1,10,2,12],[2,12,3,17],[4,12,6,14],[3,17,4,19],[4,19,6,20]],[[3,0,5,1],[2,1,3,4],[5,1,6,2],[3,4,4,6],[2,6,3,8],[0,8,2,9],[0,9,1,10],[1,10,2,12],[2,12,3,17],[4,12,5,13],[5,13,6,14],[4,14,5,15],[3,17,4,19],[4,19,6,20]]]},{"header":[12,11,1,15,1,1,1,2,2,2,3,3,20,22,6],"planes":[[[10,14,13,15],[9,15,14,17],[9,17,10,18],[11,17,14,18],[10,18,13,19],[14,18,15,19],[15,19,17,20],[17,20,19,21],[19,21,20,22]],[[14,11,17,12],[13,12,18,14],[13,14,14,15],[15,14,18,15],[14,15,17,16],[17,16,18,18],[18,18,19,20],[19,20,20,22]],[[9,9,12,10],[8,10,13,12],[8,12,9,13],[10,12,13,13],[9,13,13,14],[13,14,14,15],[14,15,15,16],[15,16,16,17],[16,17,17,19],[17,19,18,20],[18,20,19,21],[19,21,20,22]],[[7,6,10,7],[6,7,11,9],[6,9,7,10],[8,9,11,10],[7,10,11,11],[11,11,12,12],[12,12,13,13],[13,13,14,15],[14,15,15,16],[15,16,16,17],[16,17,17,19],[17,19,18,20],[18,20,19,21],[19,21,20,22]],[[5,4,8,5],[4,5,9,7],[4,7,5,8],[6,7,9,8],[5,8,9,9],[9,9,10,10],[10,10,11,11],[11,11,12,12],[12,12,13,14],[13,14,14,15],[14,15,15,16],[15,16,16,18],[16,18,17,19],[17,19,18,20],[18,20,19,21],[19,21,20,22]],[[1,0,4,1],[0,1,5,3],[0,3,1,4],[2,3,5,4],[1,4,5,5],[5,5,6,6],[6,6,7,7],[7,7,8,8],[8,8,9,9],[9,9,10,11],[10,11,11,12],[11,12,12,13],[12,13,13,14],[13,14,14,15],[14,15,15,17],[15,17,16,18],[16,18,17,19],[17,19,18,20],[18,20,19,21],[19,21,20,22]]]},{"header":[11,12,1,10,1,1,1,2,1,1,3,2,14,15,8],"planes":[[[3,4,4,5],[10,4,11,5],[4,5,5,6],[6,5,7,6],[9,5,10,6],[5,6,7,7],[8,6,9,7],[4,7,8,8],[6,8,10,9],[5,9,6,10],[7,9,9,10],[4,10,5,11],[7,10,8,11],[9,10,10,11],[3,11,4,12],[10,11,11,12]],[[6,4,7,6],[4,5,5,6],[9,5,10,6],[5,6,7,7],[8,6,9,7],[3,7,8,8],[6,8,11,9],[5,9,6,10],[7,9,9,10],[4,10,5,11],[7,10,8,12],[9,10,10,11]],[[2,3,3,4],[3,4,4,5],[6,4,7,6],[4,5,5,6],[9,5,10,6],[5,6,7,7],[8,6,9,7],[3,7,8,8],[6,8,11,9],[5,9,6,10],[7,9,9,10],[4,10,5,11],[7,10,8,12],[9,10,10,11],[10,11,11,12],[11,12,12,13]],[[0,1,1,2],[1,2,2,3],[2,3,3,4],[6,3,7,6],[3,4,4,5],[4,5,5,6],[5,6,7,7],[8,6,9,7],[2,7,8,8],[6,8,12,9],[5,9,6,10],[7,9,9,10],[7,10,8,13],[9,10,10,11],[10,11,11,12],[11,12,12,13],[12,13,13,14],[13,14,14,15]],[[11,3,12,4],[6,4,7,6],[10,4,11,5],[4,5,5,6],[9,5,10,6],[5,6,7,7],[8,6,9,7],[3,7,8,8],[6,8,11,9],[5,9,6,10],[7,9,9,10],[4,10,5,11],[7,10,8,12],[9,10,10,11],[3,11,4,12],[2,12,3,13]],[[13,1,14,2],[12,2,13,3],[6,3,7,6],[11,3,12,4],[10,4,11,5],[4,5,5,6],[9,5,10,6],[5,6,7,7],[8,6,9,7],[2,7,8,8],[6,8,12,9],[5,9,6,10],[7,9,9,10],[4,10,5,11],[7,10,8,13],[9,10,10,11],[3,11,4,12],[2,12,3,13],[1,13,2,14],[0,14,1,15]],[[6,3,7,6],[4,5,5,6],[9,5,10,6],[5,6,7,7],[8,6,9,7],[2,7,8,8],[6,8,12,9],[5,9,6,10],[7,9,9,10],[4,10,5,11],[7,10,8,13],[9,10,10,11]],[[6,1,7,6],[5,6,7,7],[8,6,9,7],[0,7,8,8],[6,8,14,9],[5,9,6,10],[7,9,9,10],[7,10,8,15]]]},{"header":[17,23,1,25,1,1,1,1,1,1,3,1,10,8,4],"planes":[[[6,0,9,1],[5,1,6,3],[9,1,10,3],[6,3,7,5],[8,3,9,5],[7,5,8,7]],[[3,0,10,1],[3,1,4,2],[9,1,10,2],[4,2,6,3],[8,2,9,4],[6,3,7,4],[7,4,8,5]],[[1,0,10,1],[1,1,3,2],[9,1,10,2],[3,2,5,3],[8,2,9,3],[5,3,8,4]],[[0,0,10,1],[0,1,1,2],[2,1,3,2],[7,1,9,2],[1,2,2,3],[5,2,7,3],[2,3,5,4]]]},{"header":[11,8,1,18,1,1,1,2,2,2,3,3,14,16,3],"planes":[[[3,0,6,1],[8,0,11,1],[5,1,6,5],[8,1,9,5],[1,4,2,5],[0,5,1,9],[2,5,12,7],[2,7,4,9],[10,7,12,9],[5,8,6,10],[8,8,9,10],[1,9,4,10],[10,9,13,10],[2,10,4,11],[10,10,12,11],[13,10,14,15],[2,11,12,12],[12,15,13,16]],[[2,0,5,1],[9,0,12,1],[4,1,5,3],[9,1,10,3],[5,3,6,5],[8,3,9,5],[12,4,13,5],[2,5,12,7],[13,5,14,9],[2,7,4,9],[10,7,12,9],[5,8,6,10],[8,8,9,10],[1,9,4,10],[10,9,13,10],[0,10,1,15],[2,10,4,11],[10,10,12,11],[2,11,12,12],[1,15,2,16]],[[1,0,4,1],[10,0,13,1],[3,1,4,2],[10,1,11,2],[4,2,5,3],[9,2,10,3],[5,3,6,4],[8,3,9,4],[2,4,12,6],[2,6,4,8],[10,6,12,8],[5,7,6,9],[8,7,9,9],[1,8,4,9],[10,8,13,9],[0,9,1,12],[2,9,4,10],[10,9,12,10],[13,9,14,12],[2,10,12,11],[1,12,2,14],[12,12,13,14],[2,14,3,15],[11,14,12,15]]]},{"header":[15,15,1,15,1,1,1,2,2,2,3,4,6,6,4],"planes":[[[4,0,5,1],[0,1,1,2],[3,1,4,2],[1,2,4,3],[2,3,5,4],[2,4,3,5],[5,4,6,5],[1,5,2,6]],[[2,0,3,1],[1,1,2,2],[4,1,5,2],[2,2,4,4],[5,2,6,3],[0,3,1,4],[1,4,2,5],[4,4,5,5],[3,5,4,6]],[[0,0,1,2],[4,0,6,1],[2,1,4,2],[1,2,2,4],[4,2,5,4],[2,4,4,5],[5,4,6,6],[0,5,2,6]],[[0,0,1,1],[5,0,6,1],[1,1,2,2],[4,1,5,2],[2,2,4,4],[1,4,2,5],[4,4,5,5],[0,5,1,6],[5,5,6,6]]]},{"header":[11,11,1,20,1,1,1,2,1,1,3,3,20,20,3],"planes":[[[9,0,11,1],[8,1,9,2],[11,1,12,2],[7,2,8,3],[12,2,13,3],[6,3,7,4],[13,3,14,4],[5,4,6,5],[14,4,15,5],[4,5,5,6],[15,5,16,6],[3,6,4,7],[16,6,17,7],[2,7,3,9],[17,7,18,9],[1,9,2,11],[18,9,19,11],[0,11,1,17],[19,11,20,17],[1,17,2,18],[9,17,11,18],[18,17,19,18],[2,18,3,19],[7,18,9,19],[11,18,13,19],[17,18,18,19],[3,19,7,20],[13,19,17,20]],[[9,1,11,2],[8,2,9,3],[11,2,12,3],[7,3,8,4],[12,3,13,4],[6,4,7,5],[13,4,14,5],[5,5,6,6],[14,5,15,6],[4,6,5,7],[15,6,16,7],[3,7,4,9],[16,7,17,9],[2,9,3,11],[17,9,18,11],[1,11,2,17],[18,11,19,17],[9,16,11,17],[2,17,3,18],[7,17,9,18],[11,17,13,18],[17,17,18,18],[3,18,7,19],[13,18,17,19]],[[9,0,11,1],[8,1,9,2],[11,1,12,2],[6,2,8,3],[12,2,13,3],[5,3,6,5],[13,3,15,4],[15,4,16,6],[4,5,5,6],[3,6,4,7],[16,6,17,7],[2,7,3,9],[17,7,18,9],[1,9,2,10],[18,9,19,10],[0,10,1,12],[19,10,20,11],[18,11,19,13],[1,12,2,13],[0,13,1,14],[19,13,20,15],[1,14,2,15],[0,15,1,17],[18,15,19,16],[19,16,20,17],[1,17,3,18],[8,17,11,18],[17,17,19,18],[3,18,4,19],[5,18,6,19],[7,18,8,19],[11,18,12,19],[14,18,15,19],[16,18,17,19],[4,19,5,20],[6,19,7,20],[12,19,14,20],[15,19,16,20]]]},{"header":[1,1,1,15,1,0,0,0,0,0,0,0,9,13,3],"planes":[[[0,0,5,1],[6,0,9,1],[0,1,1,4],[4,1,5,4],[8,1,9,4],[0,4,5,5],[6,4,9,5],[8,5,9,6],[0,6,5,7],[6,6,9,7],[2,7,3,8],[0,8,5,9],[0,9,1,13]],[[2,1,5,2],[6,1,8,2],[2,2,3,4],[4,2,5,4],[7,2,8,4],[2,4,5,5],[6,4,8,5],[7,5,8,6],[2,6,5,7],[6,6,8,7],[3,7,4,8],[2,8,5,9],[2,9,3,12]],[[2,2,5,3],[6,2,8,3],[2,3,3,4],[4,3,5,4],[7,3,8,4],[2,4,5,5],[6,4,8,5],[7,5,8,6],[2,6,5,7],[6,6,8,7],[3,7,4,8],[2,8,5,9],[2,9,3,11]]]}]};
},
"experiments/r77-native-boss-entities/boss-entities.cjs":function(module,exports,require){
'use strict';
const Common=require('../r75-procedural-geometry/entity-update.cjs');
const H=require('../r75-procedural-geometry/entity-posthooks.cjs');
const Bounds=require('../r75-procedural-geometry/entity-bounds.cjs');
const Runtime=require('../r75-procedural-geometry/cell-entity-runtime.cjs');
const BossGeometry=require('../r77-native-boss-contact/boss-geometry.cjs');
const {integer,add,sub,mul,abs,bounded,NativeArrayFault,UnsupportedEntityPath}=H;
class NativeEntityArithmeticFault extends Error{constructor(){super('native entity divide by zero');this.name='NativeEntityArithmeticFault';}}
function repel(entity,targetX,targetY,minSpeed,maxSpeed,rngA){
 const dx=sub(entity.n,targetX),dy=sub(entity.o,targetY);
 if(dx===0&&dy===0){Runtime.initializeEntity(entity,rngA);return {kind:'repulsion-coincident-initializer'};}
 const bound=add(sub(maxSpeed,minSpeed),1);
 // Two independently sampled speeds, even when one numerator is zero.
 for(const [field,delta] of [['e',dx],['f',dy]]){
  const speed=add(bounded(rngA,bound),minSpeed),numerator=mul(speed,delta),denominator=abs(Math.max(abs(dx),abs(dy)));
  if(denominator===0)throw new NativeEntityArithmeticFault();
  entity[field]=Math.trunc(numerator/denominator)|0;
 }
 return {kind:'boss-repulsion'};
}
function moveBossEntity(entity,state,boundsAdjust,index){
 const {controller,geometry,boss}=state,effects=[];
 if(controller.r===8){
  entity.n=add(entity.n,entity.e);entity.o=add(entity.o,entity.f);
  for(const axis of ['n','o'])if(entity[axis]<0||entity[axis]>=384){
   const before=entity[axis];entity[axis]=Common.nativeWrap(before,384);entity.a=0;
   effects.push({kind:'boss-wrap-deactivate',axis,before,after:entity[axis],raw:axis==='n'?'0x3f102':'0x3f0e2'});
  }
 }else{
  const floor=H.floorPenetration(entity,geometry);if(floor>0)H.correctVertical(entity,add(floor,8));
  entity.n=add(entity.n,entity.e);entity.o=add(entity.o,entity.f);
  if(H.floorPenetration(entity,geometry)>0){entity.f=abs(entity.f)|0;entity.o=add(entity.o,entity.f);}
  const extra=boundsAdjust(index,16,state);if(Array.isArray(extra))effects.push(...extra);
 }
 // This tests J, while the no-terrain/wrap mode above tests u.r. Do not alias.
 if(boss.J===8&&(entity.n>480||entity.o>480||entity.n<-96||entity.o<-96)){
  entity.a=0;effects.push({kind:'boss-extended-bounds-deactivate',raw:'0x3ee7a'});
 }
 return effects;
}
function bossContact(entity,state,{rngA,bossFootprint,bossCell}){
 const {boss,controller}=state;
 const hit=bossFootprint(boss,entity.n,entity.o,entity.i,{bossCell,B:controller.B});
 if(typeof hit!=='boolean')throw new TypeError('bossFootprint must return boolean');
 if(!hit)return [];
 // Native does not recheck a after lifetime expiry, wrap or extended culling.
 if(entity.l>0&&controller.r!==9){
  boss.K=sub(integer(boss.K,'u.K'),1);boss.Y=2;boss.H=8;entity.a=0;
  return [{kind:'entity-damaged-boss',health:boss.K,raw:'0x3ec50..0x3ec82'}];
 }
 if(controller.r===3){Runtime.initializeEntity(entity,rngA);entity.f=-8;return [{kind:'boss-contact-reinitialize',raw:'0x3edfa..0x3ee16'}];}
 const effect=repel(entity,integer(boss.W,'u.W'),add(integer(boss.X,'u.X'),8),entity.h,entity.g,rngA);
 if(controller.r===9){entity.e=-entity.e|0;entity.f=-entity.f|0;effect.kind='boss-contact-attraction';}
 return [effect];
}
function stepBossEntities(state,{rngA,nextIntA,bossFootprint=BossGeometry.bossFootprint,bossCell,boundsAdjust=Bounds.createBoundsAdjust(nextIntA)}={}){
 const {slots,geometry,actor,controller,boss}=state;
 if(!Array.isArray(slots))throw new TypeError('explicit fixed entity slots required');
 for(const [object,keys] of [[geometry,['N','position']],[actor,['height','direction']],[controller,['q','r','s']],[boss,['J']]])for(const key of keys)integer(object?.[key],key);
 if(controller.q!==99)throw new UnsupportedEntityPath('boss entity module requires q99');
 if(typeof bossFootprint!=='function')throw new UnsupportedEntityPath('implemented bossFootprint consumer required');
 if(typeof boundsAdjust!=='function')throw new TypeError('boundsAdjust required');
 const effects=[],rngTrace=[];let currentIndex=-1;
 const tracedRng=bound=>{if(typeof rngA!=='function')throw new TypeError('explicit rngA required');const value=rngA(bound);rngTrace.push({index:currentIndex,requestedBound:bound,value});return value;};
 try{
  for(let index=0;index<slots.length;index++){
   currentIndex=index;const entity=slots[index];if(entity===null)continue;
   if(entity.a===0){slots[index]=null;effects.push({kind:'remove-inactive',index});continue;}
   if(!Common.advanceCommon(entity,index,state,tracedRng)){effects.push({kind:'stationary-type',index,type:entity.a});continue;}
   effects.push(...moveBossEntity(entity,state,boundsAdjust,index).map(e=>({...e,index})));
   effects.push(...bossContact(entity,state,{rngA:tracedRng,bossFootprint,bossCell}).map(e=>({...e,index})));
   effects.push({kind:'updated',index,type:entity.a});
  }
 }catch(error){
  if(!(error instanceof NativeArrayFault)&&!(error instanceof NativeEntityArithmeticFault))throw error;
  return {slots,boss,effects,rngTrace,abortedByNativeException:{type:'java/lang/Exception',index:currentIndex,...(error instanceof NativeArrayFault?{field:error.field,arrayIndex:error.index}:{cause:'java/lang/ArithmeticException'})},originalRuntimeFullEquivalence:false};
 }
 return {slots,boss,effects,rngTrace,abortedByNativeException:null,originalRuntimeFullEquivalence:false};
}
module.exports=Object.freeze({NativeEntityArithmeticFault,repel,moveBossEntity,bossContact,stepBossEntities});

},
"experiments/r77-native-boss-exit/boss-exit.cjs":function(module,exports,require){
'use strict';
// Native l2 continuation only. Entry l2 must be earned by the boss runtime.
const Capture=require('../r77-native-render/capture.cjs');
const Special=require('../r77-native-render/special-effects.cjs');
const Geometry=require('../r77-native-boss-contact/boss-geometry.cjs');
const Transition=require('../r77-native-transition/transition.cjs');
const int=(v,n)=>{if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new TypeError(n+' requires int32');return v;};
function consumeBossExit(input,options={}){
 if(input.u?.l!==2)throw new RangeError('native boss exit requires earned u.l2');
 const c=Capture.createCapture(input),s=c.state,m=s.map;
 const result=(supported,reason)=>({supported,state:s,trace:c.trace,effects:c.effects,scope:'implemented-contract',phase:supported?'boss-exit-scatter-ready':'boss-exit-barrier',...(reason?{reason}:{}),nativeUpdateReturned:supported,continuationRaw:supported?'0x49e08':null,graphicsExecuted:false,mediaExecuted:false,originalRuntimeFullEquivalence:false,originalPayloadIncluded:false});
 // Validate functional geometry against its metadata, rather than silently using
 // a mismatched header or manufacturing an empty capture on missing data.
 try{
  if(!s.boss)throw new TypeError('explicit boss fields required');
  const b=s.boss;int(b.K,'boss.K');
  if(b.K>=0){
   for(const key of ['J','T','U','W','X','Y'])int(b[key],'boss.'+key);
   if(!options.bossCell){const h=Geometry.bossHeader(b.J);if(b.T!==h[12]||b.U!==h[13])throw new RangeError('boss dimensions differ from recovered geometry');}
  }
  m.e=0;m.h=1;c.trace.push({raw:'0x4a53a',method:'u.()V+i',operation:'capture-old-reset',targetRaw:'0x531dc',e:0,h:1});
  Special.bossCells(c,options);
  c.trace.push({raw:'0x4a54a',method:'u.(ZI)V+a',args:[false,-1],operation:'capture-boss-return',targetRaw:'0x556c0'});
  m.f=0;m.h=2;c.trace.push({raw:'0x4a552',method:'u.()V+j',operation:'capture-new-reset',targetRaw:'0x53214',f:0,h:2});
  const t=Transition.setup(s,true,options);
  Object.assign(s,t.state);c.trace.push({raw:'0x4a55c',method:'u.(Z)V+b',args:[true],operation:'scatter-balance'});c.trace.push(...t.trace);c.effects.push(...t.effects);
  const capture=s.map.capture,count=int(s.map.f,'map.f');
  if(count<0||!capture||!Array.isArray(capture.oldCommands)||!Array.isArray(capture.newCommands)||count>capture.oldCommands.length||count>capture.newCommands.length)throw new RangeError('native command-copy bounds');
  for(let i=0;i<count;i++)capture.newCommands[i]=int(capture.oldCommands[i],'old command');
  c.trace.push({raw:'0x4a578..0x4a59a',operation:'copy-old-commands-to-new',count});
  s.map.ad=0;s.u.l=3;s.game.actor.actorState=11;s.map.h=0;s.u.actionLock=0;
  c.trace.push({raw:'0x4a5aa..0x4a5d8',operation:'enter-boss-exit-scatter',ad:0,l:3,actorState:11,h:0,actionLock:0});
  return result(true);
 }catch(error){
  // Preserve the partial numeric prefix and leave l2 unconsumed. The caller
  // stops on this explicit barrier; it must not retry the partial state as entry.
  c.trace.push({operation:'boss-exit-dependency-barrier',name:error.name,detail:error.message});
  return {...result(false,error.gate||error.message),retryRequiresOriginalInput:true};
 }
}
module.exports={consumeBossExit};

},
"experiments/r77-native-boss-finalization/finalization.cjs":function(module,exports,require){
'use strict';
const Goals=require('../r77-native-goals/goals.cjs');
const int=(v,n)=>{if(!Number.isInteger(v)||v< -2147483648||v>2147483647)throw new RangeError(n+' requires int32');return v;};
function finalizeBossAction(input,{key}={}){
 int(key,'key');let out={supported:true,state:structuredClone(input),effects:[],trace:[],handled:false,reason:'not-l4-action'};
 const s=out.state;if(![-5,53,65540].includes(key)||int(s.u.l,'u.l')!==4)return out;
 if(int(s.uiState,'uiState')!==60){out.reason='requires-gameplay-ui60';return out;}
 if(int(s.pendingUiState,'pendingUiState')!==-1){out.reason='pending-ui-entry-must-run-first';out.exit='pending-ui';return out;}
 const write=(key,value,raw)=>{s.r[key]=value;out.trace.push({phase:'write',field:'r.'+key,after:value,raw});};
 write('n',0,'0x20c12');const success=((int(s.r.slot,'r.slot')+1)|0)===int(s.r.frontier,'r.frontier');
 write('resultVariant',success?3:2,success?'0x20c52':'0x20c3c');
 if(success){
  const e=Goals.enqueueAdvancement(s);s.r=e.state.r;out.trace.push(...e.trace);
  const snapshot={frontier:int(s.r.frontier,'r.frontier'),pending:int(s.r.pending,'r.pending'),credit:int(s.r.credit,'r.credit'),record:{index:int(s.r.conditionIndex,'r.conditionIndex'),score:int(s.r.recordScore,'r.recordScore')}};
  if(s.r.bestScores!==undefined)snapshot.bestScores=structuredClone(s.r.bestScores);
  out.effects.push({kind:'persist-progress',schema:'nom3-semantic-progress-v1',snapshot,raw:'0x20c62'});out.trace.push({phase:'persist-progress',raw:'0x20c62'});
  write('resultState',156,'0x20c6c');
 }
 s.r.previousUiState=s.uiState;s.pendingUiState=success?155:156;
 out.effects.push({kind:'ui-state-request',previous:s.uiState,next:s.pendingUiState,capture:'semantic-only',raw:success?'0x20c76':'0x20c46'});out.trace.push({phase:'request-ui',state:s.pendingUiState,raw:success?'0x20c76':'0x20c46'});
 return {...out,handled:true,success,reason:success?'boss-frontier-success':'boss-replay-result',exit:'return-r.run-action'};
}
// Mutates caller-owned cloned capture. Callbacks perform existing renderer helpers.
// Text and sprite payloads are deliberately absent; identifiers are semantic only.
function renderL4(c,{graphicsAvailable,bg,clip,terrain,actor,emit}={}){
 const s=c.state,m=s.map;if(s.u.l!==4)throw new RangeError('renderL4 requires l4');
 if(typeof graphicsAvailable!=='boolean'||typeof actor!=='function'||typeof emit!=='function')throw new TypeError('explicit renderer callbacks required');
 if(graphicsAvailable){
  if(![bg,clip,terrain].every(f=>typeof f==='function'))throw new TypeError('nonnull renderer callbacks required');
  bg();clip();if(int(m.r,'map.r')<=7)terrain();
 }
 s.game.actor.frame=0;c.trace.push({operation:'boss-result-actor-frame-reset',raw:'0x51c46'});actor();
 const code=((int(s.r.slot,'r.slot')+1)|0)<int(s.r.frontier,'r.frontier')?42:((int(s.boss.J,'boss.J')<<2)+3)|0;
 const a=int(m.a,'map.a'),b=int(m.b,'map.b');
 for(const [dx,dy,color,raw] of [[121,100,16777215,'0x51cb4'],[119,100,16777215,'0x51cf6'],[120,101,16777215,'0x51d38'],[120,99,16777215,'0x51d7a'],[120,100,0,'0x51dbe']])emit({type:'semantic-boss-result-text',code,x:(a+dx)|0,y:(b+dy)|0,width:180,alignment:1,color,raw,originalTextIncluded:false,nativeFontMetrics:false});
 if((int(s.r.n,'r.n')&1)===1)emit({type:'semantic-boss-result-prompt',frame:25,right:(a+210)|0,y:(b+115)|0,raw:'0x51e32',originalMediaIncluded:false,nativeSpriteMetrics:false});
 if(graphicsAvailable)clip({reset:true});
 c.trace.push({operation:'boss-result-presentation-complete',raw:'0x51c38..0x51eaa'});
 return {supported:true,code,finalized:false};
}
module.exports={finalizeBossAction,renderL4};


},
"experiments/r77-native-boss-runtime/boss-runtime.cjs":function(module,exports,require){
'use strict';
// u.K numerical control only. Original audio, imagery and animation rows absent.
const H=require('../r75-procedural-geometry/entity-posthooks.cjs');
const Update=require('../r75-procedural-geometry/entity-update.cjs');
const Entities=require('../r75-procedural-geometry/cell-entity-runtime.cjs');
const Random=require('../r75-procedural-geometry/native-rng.cjs');
const Actor=require('../r77-native-actor-state/actor-state.cjs');
const Geometry=require('../r77-native-boss-contact/boss-geometry.cjs');
const {add,sub,mul,integer:int}=H,copy=x=>structuredClone(x);
const div=(a,b)=>Math.trunc(a/b)|0,cos=Update.nativeCos100;
// d.b, d.c, d.d: functional signs, verified at114bc /11f56..11fc4.
const DIRECTION=[1,-1,1],CORNER_X=[1,-1,-1,1],CORNER_Y=[1,1,-1,-1];
function activeCount(slots){let n=0;for(let i=slots.length-1;i>=0;i--)if(slots[i]!==null&&slots[i].a!==0)n++;return n;}
function clearEntities(input){const s=copy(input);if(!Array.isArray(s.entities))throw new TypeError('native entity slots required');const cleared=[];for(let i=0;i<s.entities.length;i++)if(s.entities[i]!==null){s.entities[i]=null;cleared.push(i);}return{supported:true,state:s,effects:[],trace:[{phase:'u.F-clear',raw:'0x49280..492fc',cleared}],exit:'return-u.F'};}
function stepBoss(input,providers={}){
 let s=copy(input);const effects=[],trace=[],rngTrace=[];let raw='0x55bdc';
 const b=()=>s.boss,a=()=>s.game.actor;
 const result=(supported,reason)=>({supported,state:s,effects,trace,rngTrace,reason,scope:'implemented-contract',exit:supported?'return-u.K':'barrier',originalRuntimeFullEquivalence:false});
 const mark=(phase,at,detail={})=>{raw=at;trace.push({phase,raw:at,...detail});};
 if(!b())return result(false,'explicit-boss-fields-required');
 for(const k of ['H','I','J','K','W','X','Y'])int(b()[k],'boss.'+k);
 int(s.u.s,'u.s');if(!Array.isArray(s.entities))return result(false,'explicit-native-entity-slots-required');
 let random;
 const draw=bound=>{if(!random)random=Random.Java48Random.fromState(BigInt(s.game.rng.A));const before=random.state.toString();const value=providers.rngA?providers.rngA(bound):random.bounded(bound);int(value,'RNG result');if(value<0||value>=Math.max(1,bound))throw new RangeError('RNG outside normal native remainder domain');s.game.rng.A=random.state.toString();rngTrace.push({raw,bound,value,before,after:random.state.toString(),source:providers.rngA?'explicit-test-provider':'Java48'});return value;};
 const probability=(capacity,denominator)=>{const free=sub(capacity,activeCount(s.entities));return div(mul(mul(free,free),free),denominator);};
 function move(speed,low,high){const direction=DIRECTION[b().I];if(direction===undefined)throw new RangeError('native d.b direction index');b().W=add(b().W,mul(speed,direction));if(b().W<=low||b().W>high)b().I=add(b().I,1)&1;}
 function spawn(args){
  // u.b wrapper reflects Y around boss.X, adds the cell-center X bias.
  const converted=[args[0],args[1],0,0,args[4],add(args[5],8),sub(sub(mul(2,b().X),args[6]),8),args[7],args[8],1];
  const r=Entities.executeFactory(converted,{viewOrientation:int(a().orientation,'actor.orientation'),rngA:draw,slots:s.entities});
  trace.push({phase:'u.b-boss-spawn',raw,args:args.slice(),factoryArgs:converted,index:r.index});return r.index<0?null:s.entities[r.index];
 }
 function hurt(at){mark('boss-actor-damage',at);effects.push({kind:'sound-request',cue:'boss-contact-damage',raw:at,originalAudioIncluded:false});const r=Actor.setActorState(s,13,providers.actorProviders||providers);s=r.state;effects.push(...(r.effects||[]));trace.push(...(r.trace||[]));if(!r.supported){const e=new Error(r.reason);e.name='BossPortBarrier';throw e;}}
 function actorInputs(){int(a().height,'actor.height');int(a().p,'actor.p');}
 try{
  if(b().H<=0)b().Y=0; // R87 verified idle recovery 0x55c6c -> 0x56f20 -> 0x55c8a
  b().H=b().H>0?sub(b().H,1):0;mark('boss-timer','0x55c62..55c8a',{H:b().H});
  if(b().K<=0&&s.u.s>0){b().K=0;s.u.s=-10;b().H=50;b().Y=2;const r=clearEntities(s);s=r.state;trace.push(...r.trace);return result(true,'boss-depleted-clear');}
  if(b().H>=1000){int(b().T,'boss.T');const header=(providers.bossHeader||Geometry.bossHeader)(b().J);const x=int(header[0],'boss header0');if(x< -128||x>127)throw new RangeError('signed boss header byte');b().W=add(x<<4,div(mul(sub(b().H,1000),b().T)<<4,30));if(b().H===1000)b().H=0;mark('boss-entrance','0x56e4a..56ed8',{W:b().W,H:b().H});return result(true,'boss-entrance');}
  if(b().H>0){
   if(s.u.s<0)return result(true,'negative-countdown-active-timer');
   mark('boss-active','0x55d08..56210',{J:b().J,Y:b().Y});
   switch(b().J){
    case 1:actorInputs();if(b().H===2)b().Y=add(b().Y,1);else if(b().H<2&&a().p===0){if(b().Y===12&&a().height>80&&a().height<=143||b().Y===14&&a().height<=79)hurt('0x56142..56210');else b().K=sub(b().K,1);}break;
    case 2:if(b().Y===1)b().X=add(b().X,8);break;
    case 4:{const y=b().Y;if(y>10&&(y&1)===1)b().Y=add(y,1);else if(y===16){if(draw(10000)<=8499)b().Y=add(y,2);}else if(y===14){if(draw(10000)<=5999)b().Y=add(y,1);}else if(y===12){if(draw(10000)<4000)b().Y=add(y,1);}else if(y===18){actorInputs();if(a().p===0){if(a().height<=79)hurt('0x5600c..56070');else b().K=sub(b().K,1);b().H=1;b().I=0;}}break;}
    case 5:if(b().Y!==2&&b().H===3)b().Y=add(b().Y,1);break;
    case 6:actorInputs();if(b().Y<=11)b().Y=add(b().Y,1);b().I=add(b().I,sub(draw(11),5));if(b().I<=13)b().I=14;b().W=sub(b().W,b().I);if(b().W>0&&b().W<=159&&a().height<=47&&a().p===0){hurt('0x55dce..55e10');b().H=add(b().H,13);}if(b().H===1||b().W< -32){b().W=272;b().X=336;b().Y=0;b().H=1;b().K=sub(b().K,1);}break;
   }
   return result(true,'boss-active');
  }
  mark('boss-idle','0x563a8..56e48',{J:b().J});
  switch(b().J){
   case 0:move(2,223,256);if(draw(10000)<probability(40,150)){b().Y=1;b().H=8;for(let j=0;j<4;j++)spawn([1,0,0,0,1,add(b().W,CORNER_X[j]<<6),sub(b().X,CORNER_Y[j]<<6),6,11,1]);}break;
   case 1:move(5,127,256);if(b().W<=143&&b().I===1&&draw(10000)<=4999){b().Y=add(11,mul(2,draw(2)));b().H=add(8,draw(5));b().I=0;}break;
   case 2:b().X=int(b().aL,'boss.aL');move(4,191,240);if(draw(10000)<probability(s.entities.length,50)&&sub(40,activeCount(s.entities))>=0){b().Y=1;b().H=4;const e=spawn([2,20,0,0,1,sub(b().W,8),sub(b().X,72),0,6,1]);if(e){e.e=0;e.f=10;e.g=10;}}break;
   case 3:if(draw(10000)<probability(40,90)&&sub(40,activeCount(s.entities))>=0){b().Y=1;b().H=4;const e=spawn([2,35,0,0,2,sub(b().W,32),add(b().X,88),0,14,1]);if(e)e.e=-8;}break;
   case 4:if(b().I<=11)b().I=add(b().I,1);else if(draw(10000)<2000){b().Y=11;b().H=add(6,mul(10,Math.sign(draw(3))));b().I=6;}break;
   case 5:b().W=sub(b().W,div(cos(b().I),16));b().X=sub(b().X,div(cos(sub(b().I,90)),16));b().I=Update.nativeWrap(add(b().I,10),360);if(draw(10000)<300){b().Y=add(11,mul(2,draw(3)));b().H=8;}break;
   case 6:if(b().X>64)b().X=sub(b().X,32);else{b().Y=11;b().H=20;b().I=add(16,draw(24));}break;
   case 7:move(2,112,240);break;
   case 8:b().W=sub(b().W,div(cos(b().I),16));b().X=add(b().X,div(cos(sub(b().I,90)),16));b().I=Update.nativeWrap(add(b().I,10),360);if(draw(10000)<probability(40,50)&&sub(40,activeCount(s.entities))>=0){b().Y=1;b().H=4;const timer=add(80,draw(160)),phase=draw(45),type=add(8,draw(2));for(let j=0;j<8;j++){const angle=add(phase,mul(45,j)),x=add(b().W,div(cos(angle)<<6,100)),y=sub(b().X,div(cos(sub(angle,90))<<6,100)),e=spawn([type,timer,0,0,1,x,y,0,19,1]);if(e)e.m=angle;}}break;
  }
  return result(true,'boss-idle');
 }catch(e){if(e.name==='BossPortBarrier')return result(false,e.message);throw e;}
}
module.exports=Object.freeze({stepBoss,clearEntities,activeCount});

},
"experiments/r77-native-boss-setup/boss-setup.cjs":function(module,exports,require){
'use strict';
const G=require('../r77-native-boss-contact/boss-geometry.cjs');
const A=require('../r75-procedural-geometry/assembly.cjs');
const facts=require('./initialization-facts.json');
const int=(v,n)=>{if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new TypeError(n+' int32 required');return v;};
function bossIdForSlot(slot){int(slot,'selected zero-based slot');const id=facts.bossSlotsZeroBased.indexOf(slot);if(id<0)throw new RangeError('selected slot is not a mapped boss mission');return id;}
function paletteRoles(palette){int(palette,'palette record');const r=facts.paletteRoleIndices[palette];if(!r)throw new RangeError('unknown palette record');return {...r};}
function scanRoleMetrics(metrics,previous={}){
 let low=0xffffff,high=0;const result={aI:previous.aI,aJ:previous.aJ};
 for(let i=0;i<metrics.length;i++){const value=int(metrics[i],'palette metric');if(value<low){low=value;result.aI=i+1;}if(value>high){high=value;result.aJ=i+1;}}
 return result;
}
// u.i only: header positions are consumed before H/I/J are overwritten. No RNG.
function initializeBoss(previous,id,palette,{bossHeader=G.bossHeader,roleProvider=paletteRoles}={}){
 int(id,'boss record');const header=bossHeader(id);if(!Array.isArray(header)||header.length!==15)throw new TypeError('15 gameplay header integers required');
 const boss={...previous};'HIJKLMNOPQRSTUV'.split('').forEach((key,i)=>boss[key]=int(header[i],'boss header '+i));
 boss.W=boss.H<<4;boss.X=boss.I<<4;boss.J=id;boss.I=0;boss.Y=0;boss.aK=boss.K;boss.aL=boss.X;
 const roles=roleProvider(palette);for(const key of ['aI','aJ'])if(roles[key]!==null&&roles[key]!==undefined)boss[key]=int(roles[key],key);
 boss.H=1031;return boss;
}
function configure(frame,arg){
 int(arg,'positive boss argument');if(arg<=0||arg>G.supportedRecords.length)throw new RangeError('boss argument outside supported records');
 const s=frame,m=s.map;Object.assign(m,{ai:41,aj:0,ak:0,al:0,o:0,p:0,q:99,r:arg-1});
 let turns=0;int(s.game.actor.orientation,'actor orientation');if(s.game.actor.orientation<0||s.game.actor.orientation>3)throw new RangeError('normal four-side orientation required');
 while(s.game.actor.orientation!==0){s.game.actor.orientation=(s.game.actor.orientation+1)%4;s.game.pool=A.switchSide(s.game.pool,true,99);turns++;}
 s.game.pool.direction=0;if([5,7,9].includes(m.r))m.p=1;return {turns,record:m.r};
}
function initializeFrame(frame,options={}){
 const s=frame;s.boss=initializeBoss(s.boss||{},int(s.map.r,'map.r'),int(s.map.t,'current palette'),options);
 s.u.s=10000;s.game.pool.objects[s.game.pool.currentIndex].position=48;return s;
}
module.exports=Object.freeze({bossIdForSlot,paletteRoles,scanRoleMetrics,initializeBoss,configure,initializeFrame,bossSlotsZeroBased:Object.freeze([...facts.bossSlotsZeroBased]),originalRuntimeFullEquivalence:false});

},
"experiments/r77-native-boss-setup/initialization-facts.json":function(module,exports,require){
module.exports={"schema":"functional-boss-initialization-v1","nativeSha256":"782b2c836ef32331e74a943367aa7bae09891fa56ca39cd89acfa887bcfa55d3","bossSlotsZeroBased":[7,19,30,37,44,57,65,76,89,98],"paletteRoleIndices":[{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":3,"aJ":1},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":1,"aJ":4},{"aI":1,"aJ":5},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":4,"aJ":2},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":3},{"aI":2,"aJ":1},{"aI":3,"aJ":2},{"aI":2,"aJ":1},{"aI":3,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":2,"aJ":3},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":1,"aJ":3},{"aI":2,"aJ":1},{"aI":3,"aJ":4},{"aI":6,"aJ":3},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":3,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":3,"aJ":2},{"aI":1,"aJ":2},{"aI":2,"aJ":3},{"aI":2,"aJ":3},{"aI":3,"aJ":1},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":3,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":2,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":2},{"aI":3,"aJ":2},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":1,"aJ":2},{"aI":4,"aJ":1},{"aI":2,"aJ":1},{"aI":1,"aJ":6},{"aI":2,"aJ":1}],"excluded":["RGB values","sprite/mask/script/music payload"],"originalRuntimeFullEquivalence":false};
},
"experiments/r77-native-entity-contact/entity-contact.cjs":function(module,exports,require){
'use strict';
// Recovered native control/geometry. No original media, text or animation rows.
const H=require('../r75-procedural-geometry/entity-posthooks.cjs');
const Runtime=require('../r75-procedural-geometry/cell-entity-runtime.cjs');
const Update=require('../r75-procedural-geometry/entity-update.cjs');
const R=require('../r75-procedural-geometry/native-rng.cjs');
const Actor=require('../r77-native-actor-state/actor-state.cjs');
const {add,sub,mul,abs,integer:int}=H,copy=x=>structuredClone(x);
function div(a,b){if(b===0)throw new RangeError('native integer division by zero');return Math.trunc(a/b)|0;}
function magnitude(low,high,draw){return add(draw(add(sub(high,low),1)),low);}
// y.(II)V+a: two positive magnitudes; horizontal sign is direction XOR state2.
function directionalImpulse(e,low,high,{direction,actorState},draw){
 e.e=magnitude(low,high,draw);e.f=magnitude(low,high,draw);
 if((direction===1)!==(actorState===2))e.e=-e.e|0;
 if(e.a===5)e.b=add(draw(8),20);
 if(e.a===10)e.b=add(draw(10),5);
}
// y.(IIII)V+a: independent RNG draws per axis, max-axis normalization.
function radialImpulse(e,x,y,low,high,draw){
 const dx=sub(e.n,x),dy=sub(e.o,y);
 if(dx===0&&dy===0){Runtime.initializeEntity(e,draw);return;}
 const denominator=abs(Math.max(abs(dx),abs(dy)));
 e.e=div(mul(magnitude(low,high,draw),dx),denominator);
 e.f=div(mul(magnitude(low,high,draw),dy),denominator);
}
function transferVelocity(source,target,draw){
 target.e=add(sub(source.e,1),draw(3));target.f=add(sub(source.f,1),draw(3));
}
// u.(II)I+e selects a random angle in an octant, not atan2.
function sampledAngle(actorX,actorY,x,y,draw){
 const dx=sub(actorX,x),dy=sub(actorY,y),wide=abs(dx)>abs(dy);
 const base=dx>0?(dy>0?(wide?315:270):(wide?0:45)):(dy>0?(wide?180:225):(wide?135:90));
 return add(base,draw(45));
}
function actorTail(input,providers={}){
 let s=copy(input);const effects=[],trace=[],rngTrace=[];
 const result=(supported,reason)=>({supported,state:s,effects,trace,rngTrace,reason,scope:'implemented-contract',exit:supported?'return-u.E':'barrier',originalRuntimeFullEquivalence:false});
 const actor=()=>s.game.actor,geometry=()=>s.game.pool.objects[s.game.pool.currentIndex],direction=()=>s.game.pool.direction;
 int(actor().actorState,'actorState');
 if([13,11,16].includes(actor().actorState)){trace.push({phase:'u.E-hurt-tail-return',raw:'0x4248c..424ca'});return result(true,'hurt-tail-return');}
 if(!Array.isArray(s.entities))return result(false,'explicit-native-entity-slots-required');
 if(!s.entities.some(e=>e!==null&&e.a!==0)){trace.push({phase:'u.E-inactive-entity-tail',raw:'0x424da..43538'});return result(true,'inactive-entity-tail');}
 for(const e of s.entities)if(e!==null&&e.a!==0)for(const k of 'abcdefghijklmno')int(e[k],'entity.'+k);
 for(const k of ['frame','height','p'])int(actor()[k],'actor.'+k);
 int(geometry().position,'current geometry position');int(direction(),'direction');
 const random=R.Java48Random.fromState(BigInt(s.game.rng.A));let raw='entry',index=-1,pairIndex=null;
 const draw=bound=>{
  int(bound,'RNG bound');const before=random.state.toString();
  const value=providers.rngA?providers.rngA(bound):random.bounded(bound);
  int(value,'RNG result');if(value<0||value>=Math.max(1,bound))throw new RangeError('RNG result outside normal native remainder domain');
  rngTrace.push({raw,index,pairIndex,bound,value,before,after:random.state.toString(),source:providers.rngA?'explicit-test-provider':'Java48'});
  s.game.rng.A=random.state.toString();return value;
 };
 const mark=(phase,at,detail={})=>{raw=at;trace.push({phase,raw:at,index,pairIndex,...detail});};
 const point=(e,w,h,t=0,n=0)=>H.rectangle(geometry().position,actor().height,e.n,e.o,add(e.i<<3,w),add(e.i<<3,h),t,n,direction());
 function setActor(requested,at){
  mark('entity-actor-setter',at,{requested});
  const r=Actor.setActorState(s,requested,providers.actorProviders||providers);
  s=r.state;effects.push(...(r.effects||[]));trace.push(...(r.trace||[]));
  if(!r.supported){const error=new Error(r.reason);error.name='EntityPortBarrier';throw error;}
 }
 function sound(cue,at){effects.push({kind:'sound-request',cue,raw:at,index,originalAudioIncluded:false});mark('entity-sound-request',at,{cue});}
 function parryCredit(){
  if(s.r.slot===100||s.r.slot!==sub(s.r.frontier,1))return;
  const clock=(providers.actorProviders||providers).clockHour;
  if(typeof clock!=='function'){const error=new Error('clock-hour-provider-required');error.name='EntityPortBarrier';throw error;}
  const hour=int(clock({state:s,raw:'0x42cf8'}),'hour');if(hour<0||hour>23)throw new RangeError('hour outside0..23');
  s.u.hourA=hour;mark('entity-parry-clock','0x42cf8',{hour});
  const type=s.r.conditionType;
  if(type===11||type===12&&hour>=12&&hour<=23||type===13&&hour>=0&&hour<=11){s.r.credit=add(int(s.r.credit,'credit'),1);mark('entity-parry-credit','0x42da2/0x42ddc/0x42df8',{type,credit:s.r.credit});}
 }
 function ordinaryAttack(e){
  const q=int(s.game.stage.behaviorCode,'u.q');
  if(q!==99){
   if(e.a===6){e.c=0;mark('type6-attack','0x427a8');directionalImpulse(e,19,24,{direction:direction(),actorState:actor().actorState},draw);e.l=8;}
   else{mark('ordinary-attack','0x426e4');directionalImpulse(e,10,24,{direction:direction(),actorState:actor().actorState},draw);}
  }else{
   const variant=int(s.map?.r??s.game.entityController?.r,'u.r');
   mark('boss-entity-attack','0x427da',{variant});
   radialImpulse(e,sub(geometry().position,8),add(actor().height,[2,3,8].includes(variant)?8:0),variant===8?19:16,variant===8?24:21,draw);
   if(e.l===0)e.l=variant===3?23:15;
   Runtime.finalizeEntity(e);e.a=1;if(e.i===1)e.c=3; // R87 verified y.c field token 0x012c0095; y.l is 0x012c00a7
  }
  e.j=8;mark('entity-attack-cooldown','0x426f2');
 }
 function angleAfterAlternate(e){
  if(e.j!==0)return;
  mark('alternate-recoil-angle','0x43238/0x433fa');
  // Both arguments are native y.n. Preserve this asymmetry, do not replace y with y.o.
  const angle=sampledAngle(geometry().position,actor().height,e.n,e.n,draw);
  actor().angleN=sub(360,angle)%360;e.j=10;actor().angleQ=actor().angleN;
 }
 try{
  for(index=0;index<s.entities.length;index++){
   let e=s.entities[index];if(e===null||e.a===0)continue;
   pairIndex=null;mark('entity-actor-contact','0x42530');
   if(int(s.game.controller.modeP,'u.p')!==0){
    if(!point(e,56,56))continue;
    if(actor().actorState===9&&actor().frame>1&&actor().frame<=5){
     if(s.game.stage.behaviorCode===99){if(e.l===0)e.l=12;Runtime.finalizeEntity(e);e.a=1;if(e.i===1)e.c=3;mark('alternate-boss-convert','0x43472');}
     mark('alternate-attack','0x433b8/0x4346c');radialImpulse(e,geometry().position,actor().height,e.a===6?16:10,e.a===6?19:24,draw);
     angleAfterAlternate(e);continue;
    }
    if(!point(e,40,40)||actor().p!==0||e.j!==0)continue;
    sound('actor-hit','0x431de');setActor(13,'0x431e8');e=s.entities[index];
    mark('entity-randomize-after-hit','0x431f6');Runtime.initializeEntity(e,draw);angleAfterAlternate(e);continue;
   }
   // Native evaluates both broad rectangles; preserve order in trace.
   const upper=point(e,32,32,-2,24),lower=point(e,32,16,-2,8),broad=upper||lower;
   mark('ordinary-broad-overlap','0x425c6/0x4264e',{upper,lower});
   let attack=false,forcedHit=false;const d=actor().actorState,f=actor().frame;
   if(d===1&&f===2)attack=point(e,32,32,16,24)||broad;
   else if(d===1&&f>0&&f<=3)attack=point(e,16,32,-8,24)||broad;
   else if(d===2)attack=point(e,32,32,-16,32)||broad;
   if(broad){
    if(d===4&&f<=6||d===6&&f<=9||d===8&&f<=12||d===12||d===14)attack=true;
    if(d===10){
     if(f<=2){parryCredit();setActor(11,'0x42cae');actor().p=17;mark('parry-cooldown','0x42cb8');mark('parry-music-draw','0x42cc2');s.u.musicModeI=add(draw(3),1);sound('actor-parry','0x42cee');attack=true;e=s.entities[index];}
     else forcedHit=true;
    }
   }
   if(attack){ordinaryAttack(e);continue;}
   const hit=point(e,16,32,-2,24)||forcedHit;if(!hit)continue;
   if(actor().p===0&&e.j===0){sound('actor-hit','0x42bbc');setActor(13,'0x42bc6');e=s.entities[index];mark('entity-randomize-after-hit','0x42bd4');Runtime.initializeEntity(e,draw);}
   if(actor().actorState===12||actor().actorState===14){mark('cooldown-deflection','0x42ac6');directionalImpulse(e,e.h,e.g,{direction:direction(),actorState:actor().actorState},draw);}
   e.j=8;mark('entity-contact-cooldown','0x426f2');
  }
  // Pair order matters: first receives its y.a velocity clamp AFTER all later pairs.
  for(index=0;index<s.entities.length;index++){
   const first=s.entities[index];if(first===null||first.a===0)continue;
   for(pairIndex=index+1;pairIndex<s.entities.length;pairIndex++){
    const second=s.entities[pairIndex];if(second===null||second.a===0)continue;
    const width=add(first.i,second.i)<<4;
    if(!H.rectangle(first.n,first.o,second.n,second.o,width,width,0,0,direction()))continue;
    mark('entity-pair-overlap','0x4364c');
    if(first.j>3&&first.a!==6){mark('pair-velocity-transfer-first','0x4369e');transferVelocity(first,second,draw);continue;}
    if(second.j>3&&second.a!==6){mark('pair-velocity-transfer-second','0x437aa');transferVelocity(second,first,draw);continue;}
    if(second.a===6){mark('pair-second-type6','0x43c32');radialImpulse(first,second.n,second.o,first.h,first.g,draw);continue;}
    const dx=sub(first.n,second.n),dy=sub(first.o,second.o),denominator=abs(Math.max(abs(dx),abs(dy)));
    function repel(e,sign,at){
     if(e.a===3||e.a===4)return;
     mark('pair-separation-velocity',at,{target:sign===1?index:pairIndex});
     if(dx===0&&dy===0){Runtime.initializeEntity(e,draw);return;}
     e.e=div(mul(mul(magnitude(e.h,e.g,draw),dx),sign),denominator);
     e.f=div(mul(mul(magnitude(e.h,e.g,draw),dy),sign),denominator);
    }
    repel(first,1,'0x438fc/0x4399c');repel(second,-1,'0x43a7c/0x43b1e');
   }
   pairIndex=null;Update.nudgeVelocity(first);mark('entity-tail-velocity-clamp','0x4356c');
  }
 }catch(error){
  s.game.rng.A=random.state.toString();
  if(error.name==='EntityPortBarrier')return result(false,error.message);
  throw error;
 }
 s.game.rng.A=random.state.toString();trace.push({phase:'u.E-active-entity-tail',raw:'0x434fa -> 0x41a8a'});
 return result(true,'active-entity-contact-pair-and-tick-complete');
}
module.exports={actorTail,directionalImpulse,radialImpulse,transferVelocity,sampledAngle};

},
"experiments/r77-native-frame-driver/boundary.cjs":function(module,exports,require){
'use strict';
const B=require('../../evidence/r75-research/collision-native/boundary-transition.cjs'),A=require('../r75-procedural-geometry/assembly.cjs'),R=require('../r75-procedural-geometry/native-rng.cjs');
const Actor=require('../r77-native-actor-state/actor-state.cjs'),H=require('../r75-procedural-geometry/entity-posthooks.cjs');
const copy=x=>structuredClone(x),int=(v,n)=>{if(!Number.isInteger(v))throw new TypeError(n+' integer required');return v;};
function reached(s){const c=s.game.pool.objects[s.game.pool.currentIndex];return s.game.pool.direction===0?c.position>16*(c.geometry.activeLength-1)-31:c.position<=30;}
function run(input,options={}){
 let s=copy(input);const effects=[],trace=[],out=(supported=true,reason='ordinary-boundary-return')=>({supported,state:s,effects,trace,reason});
 if(s.game.stage.behaviorCode===3||s.game.controller.modeP!==0)return out(false,'ordinary-boundary-mode-required');
 if(!reached(s))return out(true,'boundary-not-reached');
 const setter=id=>{const r=Actor.setActorState(s,id,options.actorProviders);s=r.state;effects.push(...r.effects);trace.push(...r.trace);return r;};
 const a=s.game.actor;
 trace.push({phase:'boundary-entry',raw:'0x44542',actorState:a.actorState});
 if(a.actorState===12){
  if(a.k!==1)return out(true,'state12-not-complete');
  return complete();
 }
 if([13,16].includes(a.actorState))return out(true,'hurt-boundary-bypass');
 if(a.p!==0){const r=setter(12);return out(r.supported,r.reason);}
 const cur=s.game.pool.objects[s.game.pool.currentIndex],hit=s.game.pool.direction===0?cur.position>16*(cur.geometry.activeLength-1)-24:cur.position<=23;
 if(!hit)return out(true,'boundary-margin-before-impact');
 if(a.verticalActive)a.special=true;
 effects.push({kind:'audio-cue-request',role:'boundary-impact',raw:'0x4462e'});
 const damage=setter(13);if(!damage.supported)return out(false,damage.reason);
 if(s.r.slot!==100&&s.r.slot===s.r.frontier-1){
  if(typeof options.actorProviders?.clockHour!=='function')return out(false,'boundary-credit-clock-hour-required');
  const hour=int(options.actorProviders.clockHour({state:s,raw:'0x44674'}),'hour');if(hour<0||hour>23)return out(false,'clock-hour-outside0..23');s.u.hourA=hour;
  if(s.r.conditionType===14||s.r.conditionType===15&&hour>11||s.r.conditionType===16&&hour<=11)s.r.credit=(int(s.r.credit,'credit')+1)|0;
  trace.push({phase:'boundary-hit-credit',raw:'0x4463c..44760',hour,conditionType:s.r.conditionType});
 }
 return out();
 function complete(){
  let random=R.Java48Random.fromState(BigInt(s.game.rng.A));
  const toB=()=>({pool:s.game.pool,actor:{...s.game.actor,state:s.game.actor.actorState,direction:s.game.pool.direction,s:int(s.game.actor.s,'actor.s')},
   controller:{q:s.game.stage.behaviorCode,modeP:s.game.controller.modeP,tutorial:s.r.tutorial,tutorialStage:s.r.timerT,timerS:s.u.s,scoreU:s.u.score,aj:s.game.stage.primitive,ak:s.map?.ak??0,az:s.map?.az??0,aF:s.u.aF,D:s.u.D},
   mission:{credit:s.r.credit},entities:s.entities.map(e=>e===null?null:{...e,bridgeScalarC:e.c,bridgeScalarD:e.d,c:e.cArray,d:e.dArray})});
  const fromB=b=>{
   s.game.pool=copy(b.pool);const {state,direction,...actor}=b.actor;s.game.actor={...s.game.actor,...actor,actorState:state};s.game.pool.direction=direction;
   s.entities=b.entities.map(e=>{if(e===null)return null;const {c,d,bridgeScalarC,bridgeScalarD,...rest}=e;return {...rest,c:bridgeScalarC,d:bridgeScalarD,cArray:c,dArray:d};});
   s.u.s=b.controller.timerS;s.u.aF=b.controller.aF;s.u.D=b.controller.D;s.r.credit=b.mission.credit;s.game.rng.A=random.state.toString();
  };
  const iterator=B.completedBoundary(toB(),{rng:n=>random.bounded(n)});let next=iterator.next();
  while(!next.done){
   const e=next.value;fromB(e.state);trace.push({phase:'boundary-'+e.operation,raw:e.raw});
   if(e.operation==='request-state'){const r=setter(e.requested);if(!r.supported)return out(false,r.reason);}
   else if(e.operation==='regenerate-current'){
    if(e.argument!==0)return out(false,'nonzero-primitive-argument-unreviewed');
    const g=A.generateCurrentProcedural(s.game.pool,{...s.game.stage,z:s.game.controller.z,rngA:n=>random.bounded(n)});s.game.pool=g.pool;
    if(g.globalScalarWrites.uZ!==null)s.game.controller.z=g.globalScalarWrites.uZ;if(g.globalScalarWrites.uY!==null)s.game.controller.y=g.globalScalarWrites.uY;
   }else if(e.operation==='populate-objects'){
    const c=s.game.pool.objects[s.game.pool.currentIndex];H.posthookU(s.entities,{geometry:{N:c.geometry.activeLength,position:c.position,c:c.geometry.columns.c},controller:{q:s.game.stage.behaviorCode,r:s.map?.r??s.game.entityController.r}});
   }else if(e.operation==='configure-cells'){
    if(typeof options.configureCells!=='function')return out(false,'boundary-cell-configuration-required');
    const r=options.configureCells(s);if(!r?.supported)return out(false,r?.reason||'boundary-cell-configuration-blocked');s=r.state;effects.push(...r.effects||[]);trace.push(...r.trace||[]);
    random=R.Java48Random.fromState(BigInt(s.game.rng.A));
   }else return out(false,'unhandled-boundary-continuation:'+e.operation);
   s.game.rng.A=random.state.toString();Object.assign(e.state,toB());next=iterator.next({handled:true});
  }
  fromB(next.value.state);trace.push(...next.value.state.trace.map(e=>({phase:'boundary-native',...e})));return out(next.value.supported,next.value.reason||'completed-boundary-return');
 }
}
module.exports={run,reached};

},
"experiments/r77-native-frame-driver/fixture.cjs":function(module,exports,require){
'use strict';
// Authored starting composition for renderer/integration work. It is not a
// recovered native boot/save constructor or original stage-table substitution.
const X=require('../r76-native-composition/composition.cjs'),A=require('../r75-procedural-geometry/assembly.cjs'),R=require('../r75-procedural-geometry/native-rng.cjs');
function createOwnFrame({seedA=7,seedB=11,slot=100,frontier=100,direction=0,behaviorCode=0,primitive=17,shape={m:0,n:0,ag:24,ah:24},speed=8,conditionType=0,conditionTarget=1000,actorResourceQ=0,recordScore=1000000,ordinal=0,originX=0,originY=40}={}){
 const pool=A.createFreshRing({shape,af:0,n:shape.n,shapeIndex:7,direction,entities:[]});
 const game=X.initialize(X.create({seedA,pool,stage:{behaviorCode,primitive,col8:20,group:0},
  actor:{actorState:0,frame:0,height:16,p:0,o:0,k:0,verticalActive:false,special:false},
  controller:{controllerStateUK:0,modeP:0,z:0,y:0},fixtureOrigin:'authored R77 starting state; no original mask/frame/script payload'}),{sharedNReached:true,currentPrimitiveReached:true}).state;
 const cur=game.pool.objects[game.pool.currentIndex];cur.position=direction===0?48:16*cur.geometry.activeLength-64;
 game.actor.height=cur.geometry.columns.c[Math.trunc(cur.position/16)];game.actor.orientation=cur.geometry.orientation;game.actor.angleQ=0;game.actor.angleN=0;game.actor.s=0;
 game.rng.B=new R.Java48Random(seedB).state.toString();
 game.view={bounds:{f:0,g:384,h:0,i:384},aq:0,av:384,ar:0,as:0,at:0,au:0};game.entityController={r:0};
 return {uiState:60,loopGuardC:0,pendingUiState:-1,game,entities:Array(40).fill(null),
  u:{B:0,l:0,D:0,s:150,score:0,ao:0,ap:0,lives:3,buffer:0,actionLock:0,jitter:false,pauseRequested:false,aG:0,aH:0,aF:0,ax:0,musicModeI:0},
  r:{timerT:0,slot,frontier,goalFlag:0,n:0,recordScore,conditionType,conditionTarget,tutorial:false,credit:0,conditionIndex:0,stageClass:0,pending:0,resultState:0,resultVariant:0,actorResourceQ,ordinal},
  action:{speed,requested:0,previousState:0,targetIds:[-1,-1,-1]},
  history:{ay:0,aw:0,rows:Array.from({length:7},()=>[cur.position,game.actor.height,game.actor.orientation,direction,0,0]),selectedMode:0,stageFlag:0},
  presentation:{width:240,height:320,viewport:{x:originX,y:originY,width:240,height:240,screenWidth:240}},
  map:{a:originX,b:originY,aC:0,aA:require('../r77-native-transition/transition.cjs').paletteColor(0,require('../r77-native-render/parameters.cjs').paletteByte,[]),aE:0,h:0,e:0,f:0,g:0,capture:Object.fromEntries(['old','new','third'].flatMap(side=>['X','Y','Commands'].map(part=>[side+part,Array(200).fill(0)]))),ai:0,aj:primitive,ak:0,al:0,o:0,p:0,q:behaviorCode,r:0,w:0,x:0,t:0,J:0,az:0},
  initializationProvenance:'authored fixture; seeded native geometry kernels; normal UI60 gate fields supplied, not native boot equivalence'};
}
const ownActorProviders=()=>({spriteState:()=>({stateCount:17})});
module.exports={createOwnFrame,ownActorProviders};

},
"experiments/r77-native-frame-driver/frame-driver.cjs":function(module,exports,require){
'use strict';
// R77 integer update composition. Native data providers remain explicit; no payload.
const X=require('../r76-native-composition/composition.cjs');
const A=require('../r75-procedural-geometry/assembly.cjs');
const I=require('../r76-native-input/input-action.cjs');
const Cad=require('../r76-native-cadence/native-cadence.cjs');
const C=require('../../evidence/r75-research/collision-native/collision_adapter.cjs');
const T=require('./native-t.cjs'),Post=require('./post-e.cjs'),Boundary=require('./boundary.cjs');
const Actor=require('../r77-native-actor-state/actor-state.cjs');
const Goals=require('../r77-native-goals/goals.cjs');
const R=require('../r75-procedural-geometry/native-rng.cjs');
const Traj=require('../r77-native-trajectories/trajectories.cjs');
const Terrain=require('./terrain-phase.cjs');
const Transition=require('../r77-native-transition/transition.cjs');
const copy=x=>structuredClone(x),hurt=s=>[13,11,16].includes(s);
function int(v,label){if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new RangeError(label+' requires int32');return v;}
function boolean(v,label){if(typeof v!=='boolean')throw new TypeError(label+' requires boolean');return v;}
function validate(s){
 if(!s?.game||s.game.schema!==X.SCHEMA)throw new TypeError('explicit composition state required');
 for(const k of ['uiState','loopGuardC','pendingUiState'])int(s[k],k);
 for(const k of ['B','l','D','s','score','ao','ap','lives','buffer','actionLock'])int(s.u?.[k],'u.'+k);
 for(const k of ['timerT','slot','frontier','goalFlag','actorResourceQ','recordScore','conditionType'])int(s.r?.[k],'r.'+k);
 for(const k of ['jitter','pauseRequested'])boolean(s.u[k],'u.'+k);
 boolean(s.r.tutorial,'tutorial');
 for(const k of ['speed','requested','previousState'])int(s.action?.[k],'action.'+k);
 if(!Array.isArray(s.action.targetIds)||s.action.targetIds.length!==3)throw new TypeError('three targetIds required');
 return s;
}
function movement({actorState,special,direction,x,N,speed,tutorial}){
 for(const [k,v] of Object.entries({actorState,direction,x,N,speed}))int(v,k);
 if(direction!==0&&direction!==1)throw new RangeError('direction 0/1 required');
 const span=(N-1)*16;
 if(actorState===11)return {supported:false,reason:'state11-skips-ordinary-contact'};
 if([13,16].includes(actorState)||special){
  const allowed=direction===0?x>23:x<=span-24;
  return {supported:true,step:allowed?(tutorial?-6:-3):0,reason:'hurt-or-special-recoil'};
 }
 const allowed=actorState!==14&&(direction===0?x<=span-24:x>23);
 return {supported:true,step:allowed?speed:0,reason:actorState===14?'state14-no-horizontal':'ordinary-speed'};
}
function boundaryRequired(direction,x,N){return direction===0?x>(N-1)*16-31:x<=30;}
function advanceCore(input,options={},entry='state60'){
 const {key}=options;const frameRows=Traj.generatedRows();
 for(const [id,row] of Object.entries(options.frameRows||{}))frameRows[id]=Traj.frameRow(Number(id),{suppliedRow:row,evidence:options.rowEvidence}).row;
 validate(input);if(entry==='state60')int(key,'explicit consumed key or -9999');
 let s=copy(input);const trace=[],cadenceEvents=[],effects=[];
 const emit=(phase,raw,detail={})=>trace.push({phase,raw,...detail});
 const finish=(reason,supported=false)=>{
  s.frameBarrier={reason,entry,nativeContinuationExecuted:false};
  return {supported,state:s,trace,cadenceEvents,effects,reason,completeNativeFrame:false,originalRuntimeFullEquivalence:false,productIntegrated:false};
 };
 const cadence=event=>{
  const r=Cad.applyNative({score:s.u.score,countdown:s.u.s,jitter:s.u.jitter,transitionRequest:s.u.l},event);
  s.u.score=r.state.score;s.u.s=r.state.countdown;s.u.jitter=r.state.jitter;s.u.l=r.state.transitionRequest;
  cadenceEvents.push({...event,effect:r.effect});return r;
 };
 const apply=result=>{s=result.state;trace.push(...(result.trace||[]));effects.push(...(result.effects||[]));return result;};
 const setter=requested=>apply(Actor.setActorState(s,requested,options.actorProviders));
 const presentOnly=()=>{const p=apply(presentFrame(s,options));const result=finish(p.supported?'integer-update-and-presentation-commands-complete':p.reason,p.supported);if(p.supported)result.state.frameBarrier=null;else result.state.frameBarrier.integerUpdateComplete=true;result.integerUpdateComplete=true;result.renderRngComplete=p.renderRngComplete;result.graphicsExecuted=false;return result;};
 const post=()=>{if(entry==='u.E'){const result=finish('u.E-integer-return',true);result.state.frameBarrier=null;result.actorUpdateComplete=true;return result;}apply(Post.updateHistory(s));return presentOnly();};
 if(s.frameBarrier)return finish('unresolved-frame-continuation');
 if(s.uiState!==60)return finish('outside-stable-state60');
 if(s.pendingUiState!==-1)return finish('pending-ui-entry-dispatch-unmodelled');
 if(s.game.pendingEffects.length)return finish('unconsumed-composition-effects');
 let q=s.game.stage.behaviorCode;
 if(entry==='state60'){
 // Key dispatch precedes the u.C update guard. Latch notification/consume are external.
 let bossActionHandled=false;
 if(s.u.l===4){
  const finalization=apply(require('../r77-native-boss-finalization/finalization.cjs').finalizeBossAction(s,{key}));
  if(!finalization.supported)return finish(finalization.reason);
  bossActionHandled=finalization.handled;
 }
 if(!bossActionHandled){
 const keyResult=I.dispatchGameplayKey({key,u:{l:s.u.l,D:s.u.D,q,s:s.u.s,k:s.game.controller.controllerStateUK,j:s.u.buffer},r:{t:s.r.timerT}});
 emit('state60-key','0x20b5c..20c0c',{reason:keyResult.reason});
 if(!keyResult.supported)return finish(keyResult.reason);
 s.u.buffer=keyResult.buffer;if(keyResult.pauseRequested)s.u.pauseRequested=true;
 }
 if(Cad.nativeDispatchCount({uiState:s.uiState,loopGuardC:s.loopGuardC})===0){const skipped=finish('u.C-blocks-update',true);skipped.state.frameBarrier=null;skipped.updateSkipped=true;skipped.renderRngComplete=false;return skipped;}
 emit('u.b-entry','0x20b56');
 if(!hurt(s.game.actor.actorState)&&s.u.l<=2)s.u.B=int(s.u.B+1,'u.B increment');
 s.u.B=Math.max(0,s.u.B);emit('u.B-counter','0x49c3e..49c8c');
 if(s.u.l===1&&!hurt(s.game.actor.actorState)){
  const map=apply(require('./map-ports.cjs').consumeMap(s,options));q=s.game.stage.behaviorCode;if(!map.supported){const r=finish(map.reason);r.continuation=map.continuation;return r;}
 }
 if(s.u.l===2){
  const exit=apply(require('../r77-native-boss-exit/boss-exit.cjs').consumeBossExit(s,options));
  if(!exit.supported)return finish(exit.reason);return presentOnly();
 }
 if(s.u.l===3){
  s.map.ad=(int(s.map.ad,'map.ad')+1)|0;emit('boss-scatter-counter','0x4a4ec',{ad:s.map.ad});
  if(s.map.ad>10){
   s.game.controller.controllerStateUK=int(s.map.aC,'map.aC');
   // Native direct field assignment, not the actor setter/reset path.
   s.game.actor.actorState=s.game.controller.modeP>0?15:0;s.u.l=4;
   emit('boss-scatter-complete','0x4a50a..4a52c',{actorState:s.game.actor.actorState});
  }
  return presentOnly();
 }
 if(s.u.l===4)return presentOnly();
 if(s.u.l<0||s.u.l>4)return finish('unreviewed-transition-value');
 if(s.game.controller.controllerStateUK===200){
  try{apply(Transition.update(s,{paletteByte:options.paletteByte||require('../r77-native-render/parameters.cjs').paletteByte}));return presentOnly();}catch(e){if(e.name==='TransitionContractError')return finish(e.message);throw e;}
 }
 if(s.game.controller.controllerStateUK!==0)return finish('controller-k-nonzero');
 if(s.u.pauseRequested&&s.u.l===0&&s.r.timerT===0){s.u.pauseRequested=false;s.pendingUiState=87;emit('pause-request87','0x4a404..4a41c');return presentOnly();}
 cadence({kind:'countdown',reached:true,actorState:s.game.actor.actorState,timerGuardT:s.r.timerT});emit('countdown','0x49d20..49d50/4a3c8');
 s.u.ao=int(s.u.ao-1,'u.ao decrement');if(s.u.ao<0)s.u.ao=3;
 s.u.ap=int(s.u.ap+1,'u.ap increment');if(s.u.ap>3)s.u.ap=0;emit('aux-counters','0x49d52..49d90');
 if(s.r.timerT>0){
  if(q===99){emit('boss-K-callsite','0x49e4e');const boss=apply(require('../r77-native-boss-runtime/boss-runtime.cjs').stepBoss(s,options));if(!boss.supported)return finish(boss.reason);}
  if(s.u.D>0)s.u.D--;const cue=s.r.timerT%10===0;s.r.timerT--;
  emit('start-presentation','0x49d92..49e28',{cueRequested:cue,needsNativeC:s.r.timerT===0});
  if(cue)effects.push({kind:'audio-cue-request',role:'start-countdown',raw:'0x49e44'});
  if(s.r.timerT===0){const e=Transition.resumeAudioEffect(s);if(e)effects.push(e);if(s.r.tutorial)s.u.s=200;}
  return presentOnly();
 }
 if(s.u.D>0){if(q===99){emit('boss-K-callsite','0x49e8c');const boss=apply(require('../r77-native-boss-runtime/boss-runtime.cjs').stepBoss(s,options));if(!boss.supported)return finish(boss.reason);}s.u.D--;emit('completion-presentation','0x49e54..49e90');return presentOnly();}
 apply(Goals.liveGoal(s));
 cadence({kind:'request-map',reached:true,actorState:s.game.actor.actorState,behavior:q});emit('map-request','0x49ff2..4a03a');
 if(q===99&&s.u.s< -29&&![13,16].includes(s.game.actor.actorState)){s.u.l=2;emit('boss-map-request','0x4a180');}
 if([1,2].includes(s.u.l)&&s.r.tutorial){apply(Goals.tutorialMapEnd(s));return presentOnly();}
 const skipTerrain=hurt(s.game.actor.actorState);
 if(!skipTerrain){
  const nativeT=g=>T.step(g,{tutorial:s.r.tutorial,actionLock:s.u.actionLock});
  const nativeK=q===99?g=>{const k=require('../r77-native-boss-runtime/boss-runtime.cjs').stepBoss({...s,game:g},options);s=k.state;return {...k,state:k.state.game};}:undefined;
  const nativeZ=g=>{const z=nativeEntityUpdate({...s,game:g},options);s.entities=z.state.entities;s.u.aG=z.state.u.aG;s.u.aH=z.state.u.aH;if(z.state.boss)s.boss=z.state.boss;return {...z,state:z.state.game};};
  const t=Terrain.run(s.game,{nativeT,nativeK,nativeZ});
  s.game=t.state;effects.push(...t.effects||[]);trace.push(...t.trace.map(x=>({...x,raw:{'dynamic-shape':'0x4a076',nativeT:'0x4a07e',columns:'0x4a092',nativeZ:'0x4a0a8'}[x.phase]||x.raw})));
  if(!t.supported)return finish(t.reason);
 }else emit('terrain-prefix-skipped','0x4a048..4a070',{actorState:s.game.actor.actorState});
 }
 emit('u.E-entry',entry==='u.E'?'0x4a838':hurt(s.game.actor.actorState)?'0x4a0e2':'0x4a0b0');
 s=Actor.advanceFrameCounters(s,Traj.frameCount(s.game.actor.actorState)).state;emit('actor-frame-counter','0x41afc..41b32/48862..4888a',{frame:s.game.actor.frame,k:s.game.actor.k,o:s.game.actor.o});
 const fatal=Actor.finalizeIfFatal(s,{deathTail:Goals.fatalFinalize});
 if(fatal.terminal){apply(fatal);emit('fatal-return','0x485c4');return post();}
 s.game.actor.p=C.cooldownTick(s.game.actor.p,s.game.actor.actorState);emit('actor-cooldown','0x41b60..41bb4');
 if(s.game.actor.o===1){emit('early-reset0','0x41bc6/48514');const a=setter(0);if(!a.supported)return finish(a.reason);}
 cadence({kind:'expiry',reached:true});emit('expiry-jitter','0x41bca/48506');
 cadence({kind:'score',reached:true,actorState:s.game.actor.actorState,behavior:q});emit('score','0x41bdc..41c28');
 apply(Goals.condition17(s));
 if(s.game.controller.modeP!==0){
  const alternate=apply(require('../r77-native-alternate-frame/alternate-frame.cjs').continueActor(s,options));if(!alternate.supported)return finish(alternate.reason);
  const tail=apply(actorTail(s,options));if(!tail.supported)return finish(tail.reason);return post();
 }
 if(q===3){
  const result=apply(require('../r77-native-q3-frame-own/q3-frame.cjs').continueActor(s,{...options,maskCell:options.maskCell?((x,y)=>options.maskCell(s.map.ae,x,y)):undefined,configureCells:state=>require('./map-ports.cjs').configureCells(state,options)}));
  if(!result.supported)return finish(result.reason);
  const tail=apply(actorTail(s,options));if(!tail.supported)return finish(tail.reason);return post();
 }
 const cur=s.game.pool.objects[s.game.pool.currentIndex];
 const targets=options.targets??targetsFromFrame(s);
 const ai={...s.game.actor,state:s.game.actor.actorState,...s.action};delete ai.actorState;
 const selection=I.evaluateBufferedAction({buffer:s.u.buffer,modeP:s.game.controller.modeP,q,x:cur.position,N:cur.geometry.activeLength,
  direction:s.game.pool.direction,actor:ai,actionLock:s.u.actionLock,tutorial:s.r.tutorial,columns:cur.geometry.columns,targets,frameRows,q99H:s.boss?.H,q99J:s.boss?.J});
 emit('buffered-input','0x41c9c..41f30',{reason:selection.reason});
 if(!selection.supported)return finish(selection.reason);
 s.u.buffer=selection.buffer;
 for(const k of ['requested','speed','targetIds'])s.action[k]=copy(selection.actor[k]);
 for(const effect of selection.effects){if(effect.op==='request-state'){const a=setter(effect.requested);if(!a.supported)return finish(a.reason);}}
 if(s.game.actor.actorState===11){const tail=apply(actorTail(s,options));if(!tail.supported)return finish(tail.reason);return post();}
 if(q===99){const branch=apply(require('../r77-native-boss-contact/boss-contact.cjs').groundedBossBranch(s,options));if(!branch.supported)return finish(branch.reason);const tail=apply(actorTail(s,options));if(!tail.supported)return finish(tail.reason);return post();}
 const direction=s.game.pool.direction,N=cur.geometry.activeLength,previousX=cur.position;
 const m=movement({actorState:s.game.actor.actorState,special:s.game.actor.special,direction,x:previousX,N,speed:s.action.speed,tutorial:s.r.tutorial});
 if(!m.supported)return finish(m.reason);
 s.game.pool=A.moveCurrent(s.game.pool,m.step);emit('horizontal-movement','0x41f8e..42054/45562..4565e',{previousX,step:m.step,reason:m.reason});
 const x=s.game.pool.objects[s.game.pool.currentIndex].position;
 if(boundaryRequired(direction,x,N)){const b=apply(Boundary.run(s,{...options,configureCells:state=>require('./map-ports.cjs').configureCells(state,options)}));if(!b.supported)return finish(b.reason);}
 if(s.game.actor.o===1){const a=setter(0);if(!a.supported)return finish(a.reason);}
 emit('precontact-reset-check','0x420f6..42104');
 if(!frameRows[s.game.actor.actorState])return finish('explicit-nonzero-displacement-row-required:state'+s.game.actor.actorState);
 const contact=X.contactPhase(s.game,{ordinaryContact:true,previousX,frameRow:frameRows[s.game.actor.actorState]});
 s.game=contact.state;
 if(contact.contact?.contact?.requestsState===13){s.game.actor.height=contact.contact.vertical.after;contact.contact.contact.projectedHeight=contact.contact.vertical.after;s.game.pendingEffects.unshift({op:'resource-cue-request',kind:'collision',raw:'0x43d86/0x43dec/0x43e18'});emit('ground-hit-skips-projection','0x43d98/0x43dfe/0x43e2a -> 0x4247a');}
 trace.push(...contact.trace.map(x=>({...x,raw:'0x4210c..42488'})));
 if(!contact.supported)return finish(contact.reason);
 const pending=copy(s.game.pendingEffects);s.game.pendingEffects=[];
 for(let index=0;index<pending.length;index++){
  const e=pending[index];
  if(e.op==='rewind-tangent')s.game.pool.objects[s.game.pool.currentIndex].position=e.value;
  else if(e.op==='request-state'){const a=setter(e.state);if(!a.supported){s.game.pendingEffects=pending.slice(index+1);return finish(a.reason);}}
  else if(e.op==='resource-cue-request')effects.push({...e,kind:'audio-cue-request'});
  else{s.game.pendingEffects=pending.slice(index);return finish('unhandled-contact-effect:'+e.op);}
 }
 const sample=contact.contact?.sample;
 if(sample?.upper===-1&&sample.special&&s.game.actor.p===0){
  const current=s.game.pool.objects[s.game.pool.currentIndex],inside=require('../r75-procedural-geometry/entity-posthooks.cjs').rectangle(current.position,s.game.actor.height,sample.selected*16,current.geometry.columns.c[sample.selected]-8,32,48,-2,24,s.game.pool.direction);
  emit('special-column-hit-probe','0x43c48..43ce0',{selected:sample.selected,inside});
  if(inside){effects.push({kind:'audio-cue-request',role:'special-column-impact',raw:'0x43cfc'});const hit=setter(13);if(!hit.supported)return finish(hit.reason);}
 }
 const tail=apply(actorTail(s,options));if(!tail.supported)return finish(tail.reason);
 return post();
}
function acceptExternalFrameState(state,evidenceLabel){
 validate(state);if(!state.frameBarrier)throw new Error('no frame barrier');
 if(typeof evidenceLabel!=='string'||!evidenceLabel.trim())throw new TypeError('explicit continuation provenance required');
 const next=copy(state);next.lastExternalFrame={...next.frameBarrier,evidenceLabel};next.frameBarrier=null;return next;
}
function advance(state,options){return advanceCore(state,options,'state60');}
function updateActor(state,options){return advanceCore(state,options,'u.E');}
module.exports={advance,updateActor,resumeFrame,movement,boundaryRequired,acceptExternalFrameState,nativeEntityUpdate,actorTail,targetsFromFrame};

function nativeEntityUpdate(frame,options={}){
 const s=copy(frame);if(!Array.isArray(s.entities))return {supported:false,state:s,reason:'explicit-native-entity-slots-required'};
 const Z=require('../r75-procedural-geometry/entity-update.cjs');
 const g=s.game,cur=g.pool.objects[g.pool.currentIndex],random=R.Java48Random.fromState(BigInt(g.rng.A));
 if(!g.entityController&&!s.map)return {supported:false,state:s,reason:'explicit-native-entity-controller-required'};
 try{
  const controller={q:g.stage.behaviorCode,r:s.map?.r??g.entityController.r,s:s.u.s,B:s.u.B,aG:s.u.aG,aH:s.u.aH};
  const step=g.stage.behaviorCode===99?require('../r77-native-boss-entities/boss-entities.cjs').stepBossEntities:g.stage.behaviorCode===3?require('../r77-native-q3-entities/q3-entities.cjs').stepQ3Entities:Z.stepEntities;
  const r=step({slots:s.entities,geometry:{N:cur.geometry.activeLength,position:cur.position,c:cur.geometry.columns.c},actor:{height:g.actor.height,direction:g.pool.direction},controller,boss:s.boss},{rngA:n=>random.bounded(n),nextIntA:()=>random.nextInt(),boundsAdjust:options.boundsAdjust,maskId:s.map?.ae,viewOrientation:g.actor.orientation,maskCell:options.maskCell?((x,y)=>options.maskCell(s.map.ae,x,y)):undefined});
  s.u.aG=controller.aG;s.u.aH=controller.aH;
  s.entities=r.slots;if(r.boss)s.boss=r.boss;g.rng.A=random.state.toString();
  if(r.abortedByNativeException)r.effects.push({kind:'nativeZ-caught-array-exception',detail:r.abortedByNativeException,continuation:'u.E'});
  return {supported:true,state:s,scope:'implemented-contract',effects:r.effects||[],trace:r.trace||[]};
 }catch(error){if(error.name==='UnsupportedEntityPath')return {supported:false,state:s,reason:error.message};throw error;}
}
function actorTail(input,options={}){
 const s=copy(input),state=s.game.actor.actorState;
 if([13,11,16].includes(state))return {supported:true,state:s,effects:[],trace:[{phase:'u.E-hurt-tail-return',raw:'0x4248c..424ca -> 0x43c3c -> 0x41a8a'}]};
 if(!Array.isArray(s.entities))return {supported:false,state:s,effects:[],reason:'explicit-native-entity-slots-required'};
 if(s.entities.some(e=>e!==null&&e.a!==0))return require('../r77-native-entity-contact/entity-contact.cjs').actorTail(s,{actorProviders:options.actorProviders});
 return {supported:true,state:s,effects:[],trace:[{phase:'u.E-inactive-entity-tail',raw:'0x424da..4252e -> 0x434da..43538 -> 0x41a8a'}]};
}

function targetsFromFrame(frame){
 if(!Array.isArray(frame.entities))throw new TypeError('explicit full native entity slots required for prediction');
 return frame.entities.map((entity,index)=>{if(entity===null)return null;const t={};for(const key of ['a','n','o','e','f','i','k'])t[key]=int(entity[key],'target['+index+'].'+key);return t;});
}
function resumeFrame(input,options={}){
 if(!input.q3Continuation||!input.frameBarrier)throw new TypeError('serializable q3 relocation continuation and frame barrier required');
 let s=copy(input);const entry=s.frameBarrier.entry;s.frameBarrier=null;const effects=[],trace=[];
 const apply=r=>{s=r.state;effects.push(...r.effects||[]);trace.push(...r.trace||[]);return r;};
 const out=(supported,reason)=>({supported,state:s,effects,trace,reason,completeNativeFrame:false,originalRuntimeFullEquivalence:false,productIntegrated:false});
 const r=apply(require('../r77-native-q3-frame-own/q3-frame.cjs').resumeRelocation(s,{...options,maskCell:options.maskCell?((x,y)=>options.maskCell(s.map.ae,x,y)):undefined,configureCells:state=>require('./map-ports.cjs').configureCells(state,options)}));
 if(!r.supported){s.frameBarrier={reason:r.reason,entry,nativeContinuationExecuted:false};return out(false,r.reason);}
 const tail=apply(actorTail(s,options));if(!tail.supported){s.frameBarrier={reason:tail.reason,entry,nativeContinuationExecuted:false};return out(false,tail.reason);}
 if(entry==='u.E')return {...out(true,'u.E-integer-return'),actorUpdateComplete:true};
 apply(Post.updateHistory(s));const p=apply(presentFrame(s,options));if(!p.supported)s.frameBarrier={reason:p.reason,entry,integerUpdateComplete:true,nativeContinuationExecuted:false};return {...out(p.supported,p.supported?'integer-update-and-presentation-commands-complete':p.reason),integerUpdateComplete:true,renderRngComplete:p.renderRngComplete,graphicsExecuted:false};
}

function presentFrame(s,options){
 const renderer=require('../r77-native-render/frame-renderer.cjs');
 const render=options.renderFrame|| (typeof renderer.renderFrame==='function'?state=>renderer.renderFrame(state,{graphicsAvailable:true,viewport:state.presentation.viewport,maskCell:options.maskCell??require('../r77-native-mask-geometry/mask-geometry.cjs').maskCell}):undefined);
 return Post.present(s,{render});
}

},
"experiments/r77-native-frame-driver/map-ports.cjs":function(module,exports,require){
'use strict';
const M=require('../r77-native-map-setup/map-setup.cjs'),FP=require('../r77-native-map-setup/functional-providers.cjs');
const T=require('./native-t.cjs'),Post=require('./post-e.cjs'),Actor=require('../r77-native-actor-state/actor-state.cjs');
const H=require('../r75-procedural-geometry/entity-posthooks.cjs'),Bounds=require('../r75-procedural-geometry/entity-bounds.cjs'),R=require('../r75-procedural-geometry/native-rng.cjs');
const copy=x=>structuredClone(x);
function maskCell(options){return options.maskCell||((id,x,y)=>require('../r77-native-mask-geometry/mask-geometry.cjs').bindMask(id)(x,y));}
function provider(options){return options.stageProviders||FP.createProviders({maskCell:maskCell(options)});}
function call(request,options={}){
 const s=copy(request.state),{method,args}=request,cur=s.game.pool.objects[s.game.pool.currentIndex];
 const random=R.Java48Random.fromState(BigInt(s.game.rng.A));
 const controller={q:s.game.stage.behaviorCode,r:s.map?.r??s.game.entityController?.r,s:s.u.s,aG:s.u.aG,aH:s.u.aH};
 const context={slots:s.entities,geometry:{N:cur.geometry.activeLength,position:cur.position,c:cur.geometry.columns.c},actor:{height:s.game.actor.height,direction:s.game.pool.direction},controller,viewOrientation:s.game.actor.orientation,maskCell:(x,y)=>maskCell(options)(s.map.ae,x,y)};
 let r;
 if(method==='e.(Z)V+a'){const f=T.follow(s.game,{force:args[0],tutorial:s.r.tutorial});s.game=f.state;r={supported:true,state:s,effects:[],trace:[{phase:'map-camera-follow',...f.translation,raw:request.raw}]};}
 else if(method==='u.()V+t'){const f=T.step(s.game,{tutorial:s.r.tutorial,actionLock:s.u.actionLock});s.game=f.state;r={...f,state:s};}
 else if(method==='e.(I)V+d')r=Actor.setActorState(s,args[0],options.actorProviders);
 else if(method==='u.()V+E')r=require('./frame-driver.cjs').updateActor(s,options);
 else if(method==='u.()V+r'){
  const p=provider(options);s.history.selectedMode=p.historyMode(s.map.aj);s.history.stageFlag=p.cameraRecord(s.map.al)[0];r=Post.initializeHistory(s);
 }else if(method==='u.(II)V+c'){
  const effects=Bounds.adjustBounds(args[0],args[1],context,()=>random.nextInt());s.u.aG=controller.aG;s.u.aH=controller.aH;s.game.rng.A=random.state.toString();r={supported:true,state:s,effects};
 }else if(['u.()V+u','u.()V+v','u.()V+w','u.()V+x','u.(I)V+g'].includes(method)){
  try{H.createEntityPosthooks(context)[method](args,{slots:s.entities,rngA:n=>random.bounded(n)});s.game.rng.A=random.state.toString();r={supported:true,state:s,effects:[]};}
  catch(error){if(error instanceof H.NativeArrayFault){s.game.rng.A=random.state.toString();r={supported:false,state:s,reason:'posthook-native-array-exception-continuation-unverified:'+method,effects:[{kind:'native-posthook-array-exception',field:error.field,index:error.index}]};}else if(error instanceof H.UnsupportedEntityPath)r={supported:false,state:s,reason:error.message};else throw error;}
 }else if(method==='k.(Ljava/lang/String;)V+a')r={supported:true,state:s,effects:[{kind:'audio-cue-request',role:args[0]?.role,reference:args[0],raw:request.raw}]};
 else if(method==='u.(Lorg/kwis/msp/lcdui/Graphics;)V+a')r=typeof options.renderMap==='function'?options.renderMap({...request,state:s}):require('../r77-native-render/renderer.cjs').renderNull(s,{maskCell:maskCell(options)});
 else if(method==='u.(Z)V+b')r=require('../r77-native-transition/transition.cjs').setup(s,args[0]);
 else r={supported:false,state:s,reason:'unsupported-native-map-call:'+method};
 return {...r,scope:r.supported?'implemented-contract':undefined};
}
function drive(iterator,options={}){
 let next=iterator.next();
 while(!next.done){
  const request=next.value,result=call(request,options);
  if(!result.supported)return {supported:false,state:result.state||request.state,effects:[...(request.effects||[]),...(result.effects||[])],trace:[...(request.trace||[]),...(result.trace||[])],reason:result.reason,continuation:{iterator,pending:request},completeNativeFrame:false};
  next=iterator.next(result);
 }
 return next.value;
}
function setupStage(state,options={}){const Boss=require('../r77-native-boss-setup/boss-setup.cjs');const arg=Boss.bossSlotsZeroBased.includes(state.r.slot)?Boss.bossIdForSlot(state.r.slot)+1:0;return drive(M.setupStage(state,provider(options),arg),options);}
function configureCells(state,options={}){return drive(M.configureCells(state,provider(options)),options);}
function consumeMap(state,options={}){return drive(M.mapConsumer(state,provider(options)),options);}
module.exports={call,drive,setupStage,configureCells,consumeMap};

},
"experiments/r77-native-frame-driver/native-t.cjs":function(module,exports,require){
'use strict';
// u.()V+t and e.(Z)V+a. Only integer coordinate effects; no original art.
const A=require('../r75-procedural-geometry/assembly.cjs');
const clone=x=>structuredClone(x),i=(x,n)=>{if(!Number.isInteger(x)||x< -2147483648||x>2147483647)throw new RangeError(n+' requires int32');return x;};
const add=(a,b)=>i(a+b,'coordinate sum'),sub=(a,b)=>i(a-b,'coordinate difference');
function boundsFor(bounds,orientation){
 const {f,g,h,i:bottom}=bounds;for(const [k,v] of Object.entries({f,g,h,i:bottom}))i(v,'view.bounds.'+k);
 let q;switch(orientation){
 case 0:q=[f,g,h,bottom];break;
 case 1:q=[384-bottom,384-h,f,g];break;
 case 2:q=[384-g,384-f,384-bottom,384-h];break;
 case 3:q=[h,bottom,384-g,384-f];break;
 default:throw new RangeError('current w.v orientation must be 0..3');
 }
 return {left:add(q[0],8),right:sub(q[1],8),top:add(q[2],8),bottom:sub(q[3],8)};
}
function follow(input,{force,tutorial}={}){
 if(typeof force!=='boolean'||typeof tutorial!=='boolean')throw new TypeError('explicit force/tutorial booleans required');
 const s=clone(input),cur=s.pool.objects[s.pool.currentIndex],a=s.actor;
 const b=boundsFor(s.view.bounds,cur.geometry.orientation),W=sub(b.right,b.left),H=sub(b.bottom,b.top);
 const N=i(cur.geometry.activeLength,'N'),span=i(16*(N-1),'span'),x=i(cur.position,'position'),height=i(a.height,'height');
 i(a.orientation,'e.t');i(s.controller.modeP,'u.p');
 let targetX,targetY;
 if(span<=W){
  targetX=add(b.left,Math.trunc(sub(W,span)/2));
  targetY=span<=H?add(add(b.top,Math.trunc(H/2)),Math.trunc(span/2)):b.bottom;
 }else if(s.controller.modeP===0){
  targetY=H>=368&&height-8>Math.trunc(H/2)?add(Math.trunc(H/2),height-8):b.bottom;
  let threshold=W>=368?120:40;if(s.pool.direction!==0)threshold=sub(W,threshold);
  targetX=x<threshold?b.left:span-x<=W-threshold?sub(b.right,span):add(sub(b.left,x),threshold);
 }else{
  targetX=x<=183?b.left:span-x<=W-184?sub(b.right,span):add(sub(b.left,x),184);
  targetY=height<=183?b.bottom:16*(N-2)-16-height<=H-184?add(b.top,16*(N-2)+16):add(Math.trunc(H/2),height+8);
 }
 let dx=sub(targetX,cur.scalarE),dy=sub(targetY,cur.scalarF);
 if(!force){const limit=tutorial?16:8;dx=Math.max(-limit,Math.min(limit,dx));dy=Math.max(-limit,Math.min(limit,dy));}
 s.pool=A.translateFrames(s.pool,dx,dy,a.orientation);
 return {state:s,translation:{dx,dy,referenceOrientation:a.orientation},bounds:b,force,raw:'0x1505c..15692'};
}
function step(input,{tutorial,actionLock}={}){
 i(actionLock,'u.o actionLock');if(typeof tutorial!=='boolean')throw new TypeError('tutorial boolean required');
 let s=clone(input);const trace=[],v=s.view;if(!v)throw new TypeError('explicit view state required');
 for(const k of ['aq','av'])i(v[k],'view.'+k);
 const N=s.pool.objects[s.pool.currentIndex].geometry.activeLength;
 const floating=v.aq>0&&i(16*N,'16N')<v.av;
 if(!floating&&actionLock!==0)return {supported:true,state:s,scope:'implemented-contract',effects:[],trace:[{phase:'nativeT-lock-return',raw:'0x38212..38236'}]};
 const f=follow(s,{force:floating,tutorial});s=f.state;trace.push({phase:'nativeT-follow',...f.translation,force:floating,raw:f.raw});
 if(floating){
  const v=s.view;for(const k of ['ar','as','at','au'])i(v[k],'view.'+k);
  v.ar=add(v.ar,v.at);v.as=add(v.as,v.au);
  // Native order is both lower clamps followed by both upper clamps.
  if(v.ar<8){v.ar=8;v.at=i(-v.at,'at negation');}
  if(v.as<8){v.as=8;v.au=i(-v.au,'au negation');}
  const upper=i(376-16*(N-1),'floating upper bound');
  if(v.ar>upper){v.ar=upper;v.at=i(-v.at,'at negation');}
  if(v.as>upper){v.as=upper;v.au=i(-v.au,'au negation');}
  const dx=i(-(8*(N-1)-192+v.ar),'floating dx'),dy=i(-(8*(N-1)-192+v.as),'floating dy');
  s.pool=A.translateFrames(s.pool,dx,dy,0);trace.push({phase:'nativeT-floating',dx,dy,referenceOrientation:0,raw:'0x38254..384b0'});
 }
 return {supported:true,state:s,scope:'implemented-contract',effects:[],trace,originalRuntimeFullEquivalence:false};
}
module.exports={step,follow,boundsFor};

},
"experiments/r77-native-frame-driver/post-e.cjs":function(module,exports,require){
'use strict';
const clone=x=>structuredClone(x),int=(v,n)=>{if(!Number.isInteger(v)||v< -2147483648||v>2147483647)throw new TypeError(n+' requires int32');return v;};
function actorRow(s,alternate){const a=s.game.actor,c=s.game.pool.objects[s.game.pool.currentIndex];return [c.position,a.height,alternate?a.angleQ:a.orientation,s.game.pool.direction,a.actorState,a.frame].map((v,k)=>int(v,'history row '+k));}
function initializeHistory(input){
 const s=clone(input);if(!s.history||!Array.isArray(s.history.rows)||s.history.rows.length!==7)throw new TypeError('explicit seven history rows required');
 const row=actorRow(s,false);s.history.rows=s.history.rows.map(r=>[...row,...r.slice(6)]);s.history.aw=0;
 return {supported:true,state:s,effects:[],trace:[{phase:'history-initialize-all',raw:'0x37d30..37e28'}]};
}
function updateHistory(input){
 const s=clone(input),trace=[],effects=[];const result=()=>({supported:true,state:s,trace,effects});
 if(int(s.r.actorResourceQ,'r.q')!==1)return result();
 trace.push({phase:'post-E-u.s',raw:'0x4a0ce/0x4a108'});
 if(s.game.actor.actorState===11)return result();
 const h=s.history;if(!h||!Array.isArray(h.rows)||h.rows.length!==7||h.rows.some(r=>!Array.isArray(r)||r.length<6))throw new TypeError('explicit seven history rows required');
 int(h.ay,'u.ay');int(h.aw,'u.aw');
 if(h.ay===10){
  const row=actorRow(s,false);h.rows=h.rows.map(r=>[...row,...r.slice(6)]);h.aw=0;
  // Caller supplies resolved metadata scalars, never a guessed native table.
  h.ay=int(h.selectedMode,'resolved r.d[u.aj]');
  const flag=int(h.stageFlag,'resolved signed r.m[4*u.al]');if(flag< -128||flag>127)throw new RangeError('stageFlag signed byte');
  if(flag>0&&s.game.controller.modeP===0)h.aw=0;
  trace.push({phase:'history-initialize',raw:'0x3805e..380c0/0x37d30..37e28'});return result();
 }
 if(h.ay===0&&h.rows[0][2]!==s.game.actor.orientation)h.ay=2;
 if(h.ay===1){
  if(h.aw<0||h.aw>=7)throw new RangeError('native history index out of bounds');
  const row=actorRow(s,s.game.controller.modeP>0);h.rows[h.aw]=[...row,...h.rows[h.aw].slice(6)];
  h.aw++;if(h.aw===7)h.aw=0;trace.push({phase:'history-write',raw:'0x37eba..3802c'});
 }
 return result();
}
function present(input,{render}={}){
 // r.t() transaction: semantic functional renderer runs between clip and repaint.
 let s=clone(input);let p=s.presentation;if(!p)throw new TypeError('explicit presentation dimensions required');
 int(p.width,'r.a');int(p.height,'r.D');
 p.J=0;p.K=0;p.L=p.width;p.M=p.height;p.drawing=true;
 const rect={x:0,y:0,width:p.width,height:p.height};
 const effects=[{kind:'graphics-set-clip',...rect,raw:'0x344fe'},{kind:'render-ui-dispatch',uiState:s.uiState,raw:'0x34512'}];
 const trace=[{phase:'r.t-render-transaction',raw:'0x34420..3468a'}];let renderRngComplete=false;
 if(typeof render==='function'){
  const result=render(s);if(result.state)s=result.state;effects.push(...result.effects||[]);trace.push(...result.trace||[]);
  if(!result.supported)return {supported:false,state:s,effects,trace,reason:result.reason||'functional-render-continuation-required',integerUpdateComplete:true,renderRngComplete:false,graphicsExecuted:false,originalRuntimeFullEquivalence:false};
  renderRngComplete=true;
 }
 effects.push({kind:'canvas-repaint',...rect,raw:'0x34546'},{kind:'canvas-service-repaints',raw:'0x3455c'},{kind:'graphics-set-clip',...rect,raw:'0x34588'});
 p=s.presentation;p.J=p.width;p.K=p.height;p.L=0;p.M=0;p.drawing=false;
 return {supported:true,state:s,effects,trace,renderRngComplete,graphicsExecuted:false,originalRuntimeFullEquivalence:false};
}

module.exports={updateHistory,initializeHistory,present};

},
"experiments/r77-native-frame-driver/terrain-phase.cjs":function(module,exports,require){
'use strict';
const A=require('../r75-procedural-geometry/assembly.cjs'),D=require('../r75-procedural-geometry/column-dynamics.cjs'),R=require('../r75-procedural-geometry/native-rng.cjs');
const copy=x=>structuredClone(x);
function run(input,{nativeT,nativeK,nativeZ}){
 let s=copy(input);const trace=[],effects=[],rng=R.Java48Random.fromState(BigInt(s.rng.A));
 const finish=(supported,reason)=>({supported,state:s,trace,effects,reason,originalRuntimeFullEquivalence:false});
 if(!s.initialized)return finish(false,'terrain-not-initialized');if(s.pendingEffects.length)return finish(false,'pending-composition-effects');
 s.pool=A.tickShape(s.pool,n=>rng.bounded(n));s.rng.A=rng.state.toString();trace.push({phase:'dynamic-shape',raw:'0x4a076'});
 function port(fn,name){const r=fn(copy(s));if(r.state)s=copy(r.state);effects.push(...r.effects||[]);trace.push({phase:name,scope:r.scope,raw:name==='nativeT'?'0x4a07e':'0x4a0a8'},...r.trace||[]);return r;}
 let answer=port(nativeT,'nativeT');if(!answer.supported)return finish(false,answer.reason);
 const current=s.pool.objects[s.pool.currentIndex],columns=D.stepColumns({geometry:current.geometry,position:current.position,behaviorCode:s.stage.behaviorCode,direction:s.pool.direction,controllerStateUK:s.controller.controllerStateUK,actorFlagEZA:s.actor.verticalActive,actorHeight:s.actor.height});
 current.geometry=columns.geometry;s.actor.height=columns.actorHeight;trace.push({phase:'columns',raw:'0x4a092',sampledIndex:columns.sampledIndex,sampledDelta:columns.sampledDelta});
 if(columns.caughtException)return finish(false,'column-native-exception-continuation-unreviewed');
 if(nativeK){answer=port(nativeK,'nativeK');if(!answer.supported)return finish(false,answer.reason);}
 answer=port(nativeZ,'nativeZ');if(!answer.supported)return finish(false,answer.reason);
 return finish(true,'native-terrain-prefix-return');
}
module.exports={run};

},
"experiments/r77-native-goals/attempt-entry.cjs":function(module,exports,require){
'use strict';
// Recovered scalar subset of fresh UI60 entry, not the complete native boot.
const Goals=require('./goals.cjs');
const int=(v,name)=>{if(!Number.isInteger(v)||v< -2147483648||v>2147483647)throw new TypeError(name+' int32 required');return v;};
function initializeAttemptCounters(input,{previousUiState}={}){
 int(previousUiState,'previousUiState');if(!input?.r||!input?.u)throw new TypeError('explicit r/u state required');
 const state=structuredClone(input),trace=[],out=reason=>({supported:true,state,trace,effects:[],reason,scope:'fresh-attempt-scalar-subset',originalRuntimeFullEquivalence:false});
 if([87,157].includes(previousUiState))return out('resume-preserves-attempt');
 for(const field of ['slot','frontier','stageClass','conditionType'])int(state.r[field],'r.'+field);
 const write=(group,key,value,raw)=>{const before=state[group][key];state[group][key]=value;trace.push({phase:'fresh-attempt-counter',field:group+'.'+key,before,after:value,raw});};
 write('r','goalFlag',state.r.slot!==100&&state.r.slot===((state.r.frontier-1)|0)?0:1,'0x4bae4..4bae8/0x4bd90..4bd96');
 write('r','resultVariant',0,'0x4baee..4baf2');write('u','score',0,'0x4bb02..4bb06');write('u','lives',3,'0x4bb0c..4bb10');write('u','buffer',0,'0x4bb16..4bb1a');write('u','l',0,'0x4bb20..4bb24');write('u','pauseRequested',false,'0x4bb34..4bb38');write('r','timerT',30,'0x4bb3e..4bb42');
 const credit=Goals.initializeCredit(state,{previousUiState});state.r.credit=credit.state.r.credit;trace.push(...credit.trace);
 if(state.r.stageClass===3&&state.r.slot!==100)write('u','score',2,'0x4bd32..4bd36');
 return out('fresh-attempt-counters-initialized');
}
module.exports={initializeAttemptCounters};

},
"experiments/r77-native-goals/goals.cjs":function(module,exports,require){
'use strict';
// Executable native control contracts; no original media/text payload or disk I/O.
// Addresses refer to the single researched candidate, not arbitrary NOM3 builds.
const SCHEMA='r77-native-goals-v1',copy=x=>structuredClone(x);
function int(v,name){if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new RangeError(name+' requires int32');return v;}
const add=(a,b)=>(a+b)|0;
function begin(input){if(!input?.r||!input?.u)throw new TypeError('explicit r/u state required');return {schema:SCHEMA,scope:'implemented-contract',supported:true,state:copy(input),effects:[],trace:[],handled:false,exit:'continue'};}
function read(result,group,key){return int(result.state[group]?.[key],group+'.'+key);}
function write(result,group,key,value,raw){int(value,group+'.'+key);const before=result.state[group][key];result.state[group][key]=value;result.trace.push({phase:'write',field:group+'.'+key,before,after:value,raw});}
function actor(result){return int(result.state.game?.actor?.actorState,'game.actor.actorState');}
function q(result){return int(result.state.game?.stage?.behaviorCode,'game.stage.behaviorCode');}
function frontier(result){return read(result,'r','slot')!==100&&read(result,'r','slot')===add(read(result,'r','frontier'),-1);}
function enqueue(result,raw){
 const n=read(result,'r','frontier')>100?-1:add(read(result,'r','pending'),1);
 write(result,'r','pending',n,raw||'0x305d4..0x30606');write(result,'r','credit',0,'0x305ee');
}
function persist(result,raw){
 const r=result.state.r;
 // Only recovered progress fields and current indexed best score. This is a
 // semantic save effect, not the original whole record serializer/checksum.
 const snapshot={frontier:int(r.frontier,'r.frontier'),pending:int(r.pending,'r.pending'),credit:int(r.credit,'r.credit'),record:{index:int(r.conditionIndex,'r.conditionIndex'),score:int(r.recordScore,'r.recordScore')}};
 if(r.bestScores!==undefined)snapshot.bestScores=copy(r.bestScores);
 result.effects.push({kind:'persist-progress',schema:'nom3-semantic-progress-v1',snapshot,raw});result.trace.push({phase:'persist-progress',raw});
}
function requestUi(result,id,raw){
 const s=result.state;int(s.uiState,'uiState');int(s.pendingUiState,'pendingUiState');
 // The image/graphics capture inside r.a is represented by a typed effect.
 s.r.previousUiState=s.uiState;s.pendingUiState=id;
 result.effects.push({kind:'ui-state-request',previous:s.uiState,next:id,capture:'semantic-only',raw});result.trace.push({phase:'request-ui',state:id,raw});
}
function blocked(result){
 int(result.state.pendingUiState,'pendingUiState');
 if(result.state.pendingUiState===-1)return false;
 result.reason='pending-ui-entry-must-run-first';result.exit='pending-ui';return true;
}
function enqueueAdvancement(input){const r=begin(input);enqueue(r);r.handled=true;r.reason='pending-enqueued';return r;}

// u.b raw49f50 entry: caller has already handled r.t and positive u.D.
function liveGoal(input){
 const r=begin(input),score=read(r,'u','score');
 if(score<=0||[13,16,11].includes(actor(r))||q(r)===99){r.reason='ordinary-live-gate';return r;}
 if(score===read(r,'r','recordScore')){
  write(r,'u','aF',256,'0x4a3a4');write(r,'u','D',10,'0x4a3ae -> 0x4a222');
  r.handled=true;r.reason='record-equality-notice';return r;
 }
 if(!frontier(r)||read(r,'r','goalFlag')!==0){r.reason='not-unlatched-frontier';return r;}
 const type=read(r,'r','conditionType');let pass=false;
 if(type!==-1&&type!==25){
  const target=read(r,'r','conditionTarget');
  const value=type===0?add(score,read(r,'r','credit')):type===10?score:read(r,'r','credit');
  pass=target<=value;r.trace.push({phase:'live-target',type,target,value,pass,raw:type===0?'0x4a356..0x4a396':type===10?'0x4a314..0x4a348':'0x4a1ce..0x4a1fc'});
  if(pass)write(r,'u','D',10,'0x4a22e');
 }
 if(read(r,'u','D')>0){write(r,'u','aF',257,'0x4a218');write(r,'r','goalFlag',1,'0x4a222');r.handled=true;r.reason='live-goal-notice';}
 else r.reason=type===-1||type===25?'live-threshold-bypass':'live-target-not-met';
 return r;
}

// u.E after its eligible score increment, before buffered input. Two distinct
// native call sites both assign the same score while lives==3; preserve order.
function condition17(input){
 const r=begin(input);
 if(read(r,'r','slot')===100||read(r,'r','conditionType')!==17){r.reason='condition17-not-selected';return r;}
 const lives=read(r,'u','lives');
 for(const raw of ['0x484fe','0x484d4']){
  r.trace.push({phase:'condition17-life-check',lives,raw:raw==='0x484fe'?'0x484e6':'0x484bc'});
  if(lives===3){write(r,'r','credit',read(r,'u','score'),raw);r.handled=true;}
 }
 r.reason=lives===3?'condition17-score-captured-twice':'condition17-lives-not-three';return r;
}

function fatalFinalize(input){
 const r=begin(input);if(blocked(r))return r;
 const lives=read(r,'u','lives'),state=actor(r),frame=int(r.state.game.actor.frame,'game.actor.frame');
 if(!(lives<0||lives===0&&[13,16].includes(state)&&frame>7)){r.reason='fatal-gate-not-reached';return r;}
 const score=read(r,'u','score'),best=read(r,'r','recordScore'),stageClass=read(r,'r','stageClass');
 if(stageClass<-128||stageClass>127)throw new RangeError('r.stageClass requires signed byte');
 const beatsOrEquals=best<=score;let dirty=false;
 write(r,'r','resultState',beatsOrEquals&&stageClass!==3?156:158,'0x485c4..0x48628/0x48826');
 if(beatsOrEquals){
  write(r,'r','recordScore',score,'0x4881c');dirty=true;
  if(r.state.r.bestScores!==undefined){
   const index=read(r,'r','conditionIndex'),scores=r.state.r.bestScores;
   if(!Array.isArray(scores)||index<0||index>=scores.length)throw new RangeError('explicit indexed bestScores required');
   int(scores[index],'bestScores[index]');scores[index]=score;
  }
 }
 let success=false;
 if(frontier(r)&&read(r,'r','frontier')!==101){
  const type=read(r,'r','conditionType');
  if(type===0||type===10){write(r,'r','credit',add(read(r,'r','credit'),score),type===0?'0x487ee':'0x487ca');if(type===0)dirty=true;}
  success=read(r,'r','conditionTarget')<=read(r,'r','credit');r.trace.push({phase:'death-target',type,success,raw:'0x48792..0x48794'});
  if(success){enqueue(r,'0x4879a -> r.b');persist(r,'0x487a2');}
 }
 if(!success&&dirty)persist(r,'0x486c6/0x48710');
 requestUi(r,success?155:read(r,'r','resultState'),success?'0x48694':'0x486b6');
 write(r,'r','resultVariant',success?1:0,success?'0x4869e':'0x41a84');
 r.handled=true;r.exit='return-u.E';r.reason=success?'fatal-frontier-success':'fatal-result';r.dirty=dirty;r.success=success;return r;
}

// u.b tutorial branch immediately after the expiry path has written u.l.
// l==1 is not required by the native branch: q99 writes l==2 before this gate.
function tutorialMapEnd(input){
 const r=begin(input);if(blocked(r))return r;
 if(typeof r.state.r.tutorial!=='boolean')throw new TypeError('r.tutorial requires boolean');
 if(!r.state.r.tutorial){r.reason='not-tutorial';return r;}
 if(read(r,'u','s')>=-29||[13,16].includes(actor(r))){r.reason='map-expiry-not-reached';return r;}
 if(read(r,'u','l')!==(q(r)===99?2:1))throw new RangeError('tutorialMapEnd requires the preceding native expiry u.l write');
 const success=add(read(r,'r','slot'),1)===read(r,'r','frontier');
 write(r,'r','resultVariant',success?1:0,success?'0x4a156':'0x4a140');
 if(success){enqueue(r,'0x4a15e -> r.b');persist(r,'0x4a166');write(r,'r','resultState',156,'0x4a170');}
 requestUi(r,success?155:156,success?'0x4a17a':'0x4a14a');
 r.handled=true;r.exit='return-u.b';r.reason=success?'tutorial-frontier-success':'tutorial-replay-result';r.success=success;return r;
}

// Fresh UI60 initialization of the credit slot. Resume87/157 skips it.
function initializeCredit(input,{previousUiState}={}){
 const r=begin(input);int(previousUiState,'previousUiState');
 if([87,157].includes(previousUiState)){r.reason='resume-preserves-credit';return r;}
 if(frontier(r)&&read(r,'r','conditionType')!==0){write(r,'r','credit',0,'0x4bd8a');r.handled=true;}
 r.reason=r.handled?'fresh-nonzero-condition-credit-cleared':'fresh-credit-preserved';return r;
}
module.exports={SCHEMA,liveGoal,condition17,fatalFinalize,tutorialMapEnd,enqueueAdvancement,initializeCredit};

},
"experiments/r77-native-goals/settings-credit.cjs":function(module,exports,require){
'use strict';
// Credit branch only, not a settings UI or device-setting implementation.
// Evidence: evidence/r74-research/remaining-native-conditions.json,
// r.(II)V+h at raw 0x33154; input gates 0x3317a,0x333c8..0x33402.
const int=(v,name)=>{if(!Number.isInteger(v)||v< -2147483648||v>2147483647)throw new TypeError(name+' int32 required');return v;};
function applySettingCredit(input,{phase,menuPhase,key,selection,hour}={}){
 if(!input?.r)throw new TypeError('explicit r state required');
 for(const [name,value] of Object.entries({phase,menuPhase,key,selection}))int(value,name);
 for(const field of ['slot','frontier','conditionType','credit'])int(input.r[field],'r.'+field);
 const state=structuredClone(input),trace=[],out=(reason,handled=false)=>({supported:true,scope:'implemented-contract',state,trace,effects:[],handled,reason,originalRuntimeFullEquivalence:false});
 if(phase!==1||menuPhase!==0||![-3,-4,-5].includes(key)||selection<0||selection>2)return out('setting-input-gate');
 if(state.r.slot===100||state.r.slot!==((state.r.frontier-1)|0))return out('setting-frontier-gate');
 const type=state.r.conditionType,expected=({20:0,21:1,22:2,34:1,35:2})[type];
 if(expected!==selection)return out('setting-condition-mismatch');
 if(type===34||type===35){int(hour,'refreshed hour');if(hour<0||hour>23)throw new RangeError('refreshed hour outside0..23');if(hour<12)return out('setting-hour-gate');}
 const raw=type===34?'0x337bc':type===35?'0x335ac':'0x331b8',before=state.r.credit;
 state.r.credit=1;trace.push({phase:'setting-condition-credit',field:'r.credit',before,after:1,conditionType:type,selection,key,raw,...(type===34||type===35?{hour}:{})});
 return out('setting-condition-credit',true);
}
module.exports={applySettingCredit};

},
"experiments/r77-native-map-setup/functional-metadata.json":function(module,exports,require){
module.exports={"schema":"nom3-reviewed-functional-config-v1","scope":"one unauthenticated KTF candidate; numeric behavior rules only","nativeSha256":"782b2c836ef32331e74a943367aa7bae09891fa56ca39cd89acfa887bcfa55d3","jarSha256":"aeadd87840c7b3f1f06548489406dbc0bf833b41de9cdfa3eaf741e832a213c2","recordFields":{"stageRecords":["shapeIndex","primitiveOrMaskIndex","cellIndex","cameraIndex","actionLock","modeP","behaviorCode","behaviorArgument","density"],"shapeRecords":["m","n","ag","ah"],"cellRecords":["countCode","sizeCode","kind"],"cameraRecords":["aq","unreadColumn1","lowSpeed","highSpeed"],"weightedRecords":["shapeIndex","primitiveIndex","cellIndex","cameraIndex","actionLock","modeP","behaviorCode","behaviorArgument","weight"]},"tables":{"stageRecords":[[6,2,6,0,0,0,2,7,30],[6,19,6,0,0,0,2,7,30],[6,3,6,0,0,0,2,7,40],[6,19,6,0,0,0,2,7,30],[8,0,46,0,0,0,0,0,14],[8,0,46,0,0,0,0,0,14],[8,0,46,0,0,0,0,0,14],[8,0,46,0,0,0,0,0,14],[16,34,46,0,0,0,3,0,23],[16,35,46,0,0,0,3,0,23],[16,34,46,0,0,0,3,0,23],[16,35,46,0,0,0,3,0,23],[16,61,46,0,0,0,3,1,23],[16,62,46,0,0,0,3,1,23],[16,61,46,0,0,0,3,1,23],[16,62,46,0,0,0,3,1,23],[13,2,46,0,0,0,2,15,22],[14,19,46,0,0,0,2,15,22],[14,2,46,0,0,0,2,15,22],[15,19,46,0,0,0,2,15,22],[29,7,0,0,0,0,0,0,10],[30,7,0,0,0,0,0,0,10],[31,7,0,0,0,0,0,0,10],[32,7,0,0,0,0,0,0,10],[16,31,46,0,0,0,3,0,23],[16,32,46,0,0,0,3,0,23],[16,36,46,0,0,0,3,0,23],[16,37,46,0,0,0,3,0,23],[39,0,0,10,0,0,0,0,0],[40,0,0,11,0,0,0,0,0],[39,0,0,11,0,0,0,0,0],[40,0,0,10,0,0,0,0,0],[16,1,46,0,0,0,3,0,23],[16,2,46,0,0,0,3,0,23],[16,5,46,0,0,0,3,0,23],[16,6,46,0,0,0,3,0,23],[11,19,19,0,0,0,0,0,20],[11,19,20,0,0,0,0,0,20],[11,19,21,0,0,0,0,0,20],[11,19,23,0,0,0,0,0,20],[16,53,46,0,0,0,3,1,23],[16,54,46,0,0,0,3,1,23],[16,53,46,0,0,0,3,1,23],[16,54,46,0,0,0,3,1,23],[13,28,26,0,0,0,1,0,20],[13,28,26,0,0,0,1,0,20],[13,28,26,0,0,0,1,0,20],[13,28,26,0,0,0,1,0,20],[16,9,46,0,0,0,3,0,23],[16,10,46,0,0,0,3,0,23],[16,11,46,0,0,0,3,0,23],[16,12,46,0,0,0,3,0,23],[16,69,46,0,0,0,3,2,23],[16,70,46,0,0,0,3,2,23],[16,69,47,0,0,0,3,2,23],[16,70,47,0,0,0,3,2,23],[11,17,19,0,0,0,0,0,23],[11,17,20,0,0,0,0,0,23],[11,17,21,0,0,0,0,0,23],[11,17,23,0,0,0,0,0,23],[16,71,51,0,0,0,3,1,23],[16,72,51,0,0,0,3,1,23],[16,71,52,0,0,0,3,1,23],[16,72,52,0,0,0,3,1,23],[43,35,0,0,0,0,0,0,0],[43,35,0,0,0,0,0,0,0],[43,35,0,0,0,0,0,0,0],[43,35,0,0,0,0,0,0,0],[16,56,50,0,0,0,3,1,22],[16,57,50,0,0,0,3,1,22],[16,56,49,0,0,0,3,1,22],[16,57,49,0,0,0,3,1,22],[16,67,50,0,0,0,3,1,23],[16,68,50,0,0,0,3,1,23],[16,67,49,0,0,0,3,1,23],[16,68,49,0,0,0,3,1,23],[29,12,0,0,0,0,0,0,16],[30,12,0,0,0,0,0,0,16],[31,12,0,0,0,0,0,0,16],[32,12,0,0,0,0,0,0,16],[42,0,46,0,0,1,0,0,11],[42,0,46,0,0,1,0,0,11],[42,0,46,0,0,1,0,0,11],[42,0,46,0,0,1,0,0,11],[16,7,47,0,0,0,3,0,23],[16,8,48,0,0,0,3,0,22],[16,13,47,0,0,0,3,0,23],[16,14,48,0,0,0,3,0,23],[7,0,2,0,0,0,0,0,26],[7,0,2,0,0,0,0,0,26],[7,0,2,0,0,0,0,0,26],[7,0,2,0,0,0,0,0,26],[16,63,46,0,0,0,3,1,23],[16,64,46,0,0,0,3,1,23],[16,65,47,0,0,0,3,1,23],[16,66,47,0,0,0,3,1,23],[29,2,6,0,17,0,0,0,30],[30,3,6,0,17,0,0,0,30],[31,2,6,0,17,0,0,0,30],[32,3,6,0,17,0,0,0,30],[16,27,46,0,0,0,3,0,22],[16,28,46,0,0,0,3,0,22],[16,29,46,0,0,0,3,0,12],[16,30,46,0,0,0,3,0,12],[6,3,3,0,20,0,0,0,22],[6,2,3,0,20,0,0,0,22],[6,3,3,0,20,0,0,0,22],[6,2,3,0,20,0,0,0,22],[16,17,48,0,0,0,3,0,23],[16,18,48,0,0,0,3,0,23],[16,17,51,0,0,0,3,0,23],[16,18,51,0,0,0,3,0,23],[41,11,0,0,0,0,0,0,15],[41,12,0,0,0,0,0,0,15],[41,11,0,0,0,0,0,0,15],[41,12,0,0,0,0,0,0,15],[16,46,51,0,0,0,3,0,23],[16,47,51,0,0,0,3,0,23],[16,46,52,0,0,0,3,0,23],[16,47,52,0,0,0,3,0,23],[29,13,0,0,0,0,0,0,20],[30,13,0,0,0,0,0,0,20],[31,13,0,0,0,0,0,0,20],[32,13,0,0,0,0,0,0,20],[16,19,49,0,0,0,3,0,34],[16,20,50,0,0,0,3,0,34],[16,21,49,0,0,0,3,0,34],[16,22,50,0,0,0,3,0,34],[8,0,7,0,0,0,0,0,32],[8,0,7,0,0,0,0,0,32],[8,0,7,0,0,0,0,0,32],[8,0,7,0,0,0,0,0,32],[11,21,18,0,0,0,0,0,27],[11,22,20,0,0,0,0,0,27],[11,21,21,0,0,0,0,0,27],[11,22,23,0,0,0,0,0,27],[31,36,0,0,0,0,0,0,0],[31,36,0,0,0,0,0,0,0],[32,36,0,0,0,0,0,0,0],[32,36,0,0,0,0,0,0,0],[16,42,49,0,0,0,3,0,23],[16,45,49,0,0,0,3,0,23],[16,42,50,0,0,0,3,0,23],[16,45,50,0,0,0,3,0,23],[42,0,47,0,0,1,0,0,11],[42,0,48,0,0,1,0,0,10],[42,0,47,0,0,1,0,0,11],[42,0,48,0,0,1,0,0,10],[16,23,46,0,0,0,3,0,34],[16,24,46,0,0,0,3,0,34],[16,23,51,0,0,0,3,0,34],[16,24,51,0,0,0,3,0,34],[44,0,0,0,4,0,0,0,0],[44,0,0,0,4,0,0,0,0],[44,0,0,0,4,0,0,0,0],[44,0,0,0,4,0,0,0,0],[29,15,0,0,0,0,0,0,23],[30,15,0,0,0,0,0,0,23],[31,15,0,0,0,0,0,0,23],[32,15,0,0,0,0,0,0,23],[16,49,46,0,0,0,3,0,23],[16,50,46,0,0,0,3,0,23],[16,49,51,0,0,0,3,0,22],[16,50,51,0,0,0,3,0,22],[31,37,0,0,0,0,0,0,0],[31,37,0,0,0,0,0,0,0],[32,37,0,0,0,0,0,0,0],[32,37,0,0,0,0,0,0,0],[16,75,46,0,0,0,3,2,34],[16,76,46,0,0,0,3,2,34],[16,75,46,0,0,0,3,2,34],[16,76,46,0,0,0,3,2,34],[16,73,51,0,0,0,3,1,34],[16,74,52,0,0,0,3,1,34],[16,73,52,0,0,0,3,1,34],[16,74,51,0,0,0,3,1,34],[29,0,4,0,3,0,0,0,30],[30,0,4,0,3,0,0,0,30],[31,0,4,0,3,0,0,0,30],[32,0,4,0,3,0,0,0,30],[16,25,51,0,0,0,3,0,23],[16,26,51,0,0,0,3,0,23],[16,25,52,0,0,0,3,0,23],[16,26,52,0,0,0,3,0,23],[16,41,46,0,0,0,3,0,12],[16,41,47,0,0,0,3,0,12],[16,41,48,0,0,0,3,0,12],[16,41,50,0,0,0,3,0,12],[29,11,0,0,0,0,0,0,26],[30,11,0,0,0,0,0,0,26],[31,11,0,0,0,0,0,0,26],[32,11,0,0,0,0,0,0,26],[16,51,49,0,0,0,3,1,45],[16,52,49,0,0,0,3,1,45],[16,51,50,0,0,0,3,1,45],[16,52,50,0,0,0,3,1,45],[16,58,46,0,0,0,3,0,35],[16,58,46,0,0,0,3,0,35],[16,58,48,0,0,0,3,0,34],[16,58,48,0,0,0,3,0,34],[37,0,0,10,0,0,0,0,0],[38,0,0,11,0,0,0,0,0],[37,0,0,11,0,0,0,0,0],[38,0,0,10,0,0,0,0,0],[16,81,51,0,0,0,3,2,34],[16,82,51,0,0,0,3,2,34],[16,81,52,0,0,0,3,2,34],[16,82,52,0,0,0,3,2,34],[41,9,0,0,0,0,0,0,10],[41,9,0,0,0,0,0,0,10],[41,9,0,0,0,0,0,0,10],[41,9,0,0,0,0,0,0,10],[16,43,47,0,0,0,3,0,23],[16,44,48,0,0,0,3,0,23],[16,43,51,0,0,0,3,0,23],[16,44,52,0,0,0,3,0,23],[16,88,51,0,0,0,3,1,34],[16,89,51,0,0,0,3,2,34],[16,88,52,0,0,0,3,1,34],[16,89,52,0,0,0,3,2,34],[29,9,0,0,0,0,0,0,27],[30,9,0,0,0,0,0,0,27],[31,9,0,0,0,0,0,0,27],[32,9,0,0,0,0,0,0,27],[16,48,46,0,0,0,3,0,45],[16,48,48,0,0,0,3,0,35],[16,48,49,0,0,0,3,0,35],[16,48,50,0,0,0,3,0,35],[16,90,47,0,0,0,3,1,45],[16,90,48,0,0,0,3,1,45],[16,90,51,0,0,0,3,1,45],[16,90,52,0,0,0,3,1,45],[6,0,4,0,4,0,0,0,30],[6,0,4,0,4,0,0,0,30],[6,0,4,0,4,0,0,0,30],[6,0,4,0,4,0,0,0,30],[16,39,46,0,0,0,3,0,23],[16,40,46,0,0,0,3,0,23],[16,39,46,0,0,0,3,0,23],[16,40,46,0,0,0,3,0,23],[13,26,26,0,0,0,1,0,35],[13,26,26,0,0,0,2,15,35],[13,26,27,0,0,0,1,0,35],[13,26,27,0,0,0,2,15,35],[16,85,51,0,0,0,3,2,45],[16,86,51,0,0,0,3,2,45],[16,85,52,0,0,0,3,2,45],[16,86,52,0,0,0,3,2,45],[16,15,51,0,0,0,3,0,57],[16,16,51,0,0,0,3,0,57],[16,15,52,0,0,0,3,0,57],[16,16,52,0,0,0,3,0,57],[29,9,0,0,4,0,0,0,30],[30,9,0,0,4,0,0,0,30],[31,9,0,0,4,0,0,0,30],[32,9,0,0,4,0,0,0,30]],"cameraRecords":[[0,0,0,0],[1,0,13,16],[1,4,8,11],[1,2,10,14],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[1,1,8,13],[1,2,7,11]],"cameraTypes":[[1],[2],[3],[4],[0],[0],[5],[6],[6],[7],[8]],"primitiveTypes":[[0],[1],[0],[0],[0],[0],[7],[7],[7],[7],[7],[7],[7],[7],[7],[7],[2],[2],[2],[2],[2],[2],[2],[2],[5],[8],[3],[3],[3],[3],[3],[3],[3],[3],[4],[6],[6],[6]],"cellTypes":[[0],[0],[0],[0],[0],[0],[0],[0],[6],[7],[8],[1],[1],[1],[1],[1],[1],[1],[2],[2],[2],[2],[2],[2],[2],[3],[3],[3],[3],[3],[3],[3],[4],[4],[4],[4],[4],[4],[4],[5],[5],[5],[5],[5],[5],[5],[0],[0],[0],[0],[0],[0],[0]],"cellRecords":[[0,0,0],[6,1,6],[0,1,7],[6,1,9],[7,1,10],[72,5,22],[10,1,15],[-24,1,1],[0,0,0],[0,0,0],[0,0,0],[-60,1,16],[-38,1,6],[-48,1,2],[-50,1,3],[-56,1,4],[-60,1,5],[-45,1,8],[-68,1,16],[-42,1,6],[-50,1,2],[-63,1,3],[-70,1,4],[-68,1,5],[-50,1,8],[-62,1,16],[-38,1,6],[-45,1,2],[-57,1,3],[-64,1,4],[-62,1,5],[-45,1,8],[-92,1,16],[-67,1,6],[-76,1,2],[-83,1,3],[-78,1,4],[-81,1,5],[-76,1,8],[60,1,21],[62,1,22],[72,1,23],[52,1,24],[80,1,25],[80,1,26],[58,1,27],[-50,1,6],[-50,1,2],[-50,1,3],[-50,1,4],[-50,1,5],[-50,1,8],[-50,1,16]],"weightedRecords":[[0,0,0,0,0,0,0,0,2],[1,0,0,0,0,0,0,0,2],[2,0,0,2,0,0,0,0,2],[3,0,0,1,0,0,0,0,2],[4,0,0,2,0,0,0,0,2],[7,0,2,0,0,0,0,0,12],[8,0,7,0,0,0,0,0,12],[6,4,0,0,1,0,0,0,15],[6,2,6,0,18,0,0,0,4],[6,0,4,0,2,0,0,0,4],[6,3,6,0,19,0,0,0,4],[6,0,4,0,3,0,0,0,4],[6,3,3,0,20,0,0,0,4],[6,0,4,0,4,0,0,0,4],[2,0,0,1,0,1,0,0,5],[3,0,0,1,0,1,0,0,5],[44,0,0,0,20,0,0,0,10]],"shapeTypes":[[0],[0],[0],[0],[0],[0],[0],[0],[0],[1],[1],[2],[2],[3],[3],[3],[4],[4],[4],[4],[4],[4],[4],[5],[5],[5],[6],[6],[6],[7],[7],[7],[7],[7],[7],[7],[7],[8],[8],[8],[8],[0],[0],[0],[0],[0]],"maskWeights":[[57],[57],[57],[57],[57],[57],[62],[64],[61],[61],[61],[61],[67],[67],[80],[80],[100],[100],[95],[95],[95],[95],[105],[105],[120],[120],[120],[120],[125],[125],[74],[74],[80],[74],[75],[82],[85],[95],[125],[125],[125],[125],[105],[105],[125],[125],[125],[115],[118],[120],[90],[90],[98],[98],[90],[122],[122],[110],[125],[125],[84],[84],[84],[84],[84],[84],[84],[84],[84],[84],[84],[84],[97],[97],[75],[75],[100],[105],[105],[105],[96],[96],[96],[102],[105],[105],[102],[102],[105],[102]],"historyModes":[1,1,0,0,1,1,0,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],"shapeRecords":[[1,45,10,18],[2,65,9,16],[1,20,10,18],[2,40,9,16],[0,0,13,16],[0,0,18,20],[0,0,60,75],[0,0,27,28],[0,0,23,24],[3,1,26,28],[0,0,26,28],[0,0,36,42],[0,0,38,44],[0,0,36,42],[0,0,38,42],[0,0,38,44],[0,0,24,24],[0,0,24,24],[0,0,24,24],[0,0,24,24],[0,0,24,24],[0,0,24,24],[0,0,24,24],[0,0,36,44],[0,0,37,43],[0,0,38,42],[0,0,30,40],[0,0,32,38],[0,0,34,36],[0,0,55,60],[0,0,60,65],[0,0,65,70],[0,0,70,75],[0,0,59,71],[0,0,60,70],[0,0,62,68],[0,0,64,66],[4,0,8,20],[4,0,10,16],[1,30,9,16],[2,50,11,20],[0,0,24,24],[0,0,30,32],[0,0,35,40],[4,0,8,12],[0,0,70,70]],"ordinarySlotsZeroBased":[1,2,3,5,6,8,9,10,11,13,14,16,17,18,20,22,24,25,26,28,29,31,32,34,35,36,39,41,42,43,45,47,49,50,52,53,56,58,59,60,62,63,66,67,69,70,71,73,74,75,77,78,81,82,84,85,87,88,90,92,93,94,96,97]},"provenance":{"stageRecords":{"resource":"stageTable.bin","resourceSha256":"9c92f6620866d29e38276b376e99f48e757e779741cad5c8aa5d9ed211040844","field":"r.[B+f","consumerOrBindingRaw":"0x371b6..0x3739e","recordCount":256,"columnsPerRecord":9,"representation":"signed functional integers"},"cameraRecords":{"resource":"tblScr2.bin","resourceSha256":"b8f82adadedac2d8653d79471b22332c8b719f0deb23e3f96fc34c2ec7d59e17","field":"r.[B+m","consumerOrBindingRaw":"0x1f97a/0x1f986;0x365ec","recordCount":12,"columnsPerRecord":4,"representation":"signed functional integers"},"cameraTypes":{"resource":"tblScr.bin","resourceSha256":"a39f1e93b070ccc3c2ed0c98f9ad0ab9312e4e015d98ffcd4ae8f6e3e3432ff8","field":"r.[B+n","consumerOrBindingRaw":"0x1f99a/0x1f9a6;0x37964","recordCount":11,"columnsPerRecord":1,"representation":"signed functional integers"},"primitiveTypes":{"resource":"tblDown.bin","resourceSha256":"223a2d058f7e7753f6fd4f50a979055b9ad7adca79314612ddee51e054696b43","field":"r.[B+p","consumerOrBindingRaw":"0x1f9d8/0x1f9e4;0x377b8","recordCount":38,"columnsPerRecord":1,"representation":"signed functional integers"},"cellTypes":{"resource":"tblCell.bin","resourceSha256":"0b0fbb31b5495d14ccee5c1bb04393a456ee8a8f98bf22b279e1b0f2d93cfe72","field":"r.[B+q","consumerOrBindingRaw":"0x1fa16/0x1fa22;0x37900","recordCount":53,"columnsPerRecord":1,"representation":"signed functional integers"},"cellRecords":{"resource":"tblCell2.bin","resourceSha256":"62800f496c486bee1d7ee797782662cfda6b48723abdb9a84a174559072a03dd","field":"r.[B+o","consumerOrBindingRaw":"0x1f9b8/0x1f9c4;u.c","recordCount":53,"columnsPerRecord":3,"representation":"signed functional integers"},"weightedRecords":{"resource":"tblStage.bin","resourceSha256":"252e13c13fa61f559fba8e2b69226efb8874aba5890daee10dc168b00e0ad7a7","field":"r.[B+s","consumerOrBindingRaw":"0x1fa54/0x1fa60;0x3630c","recordCount":17,"columnsPerRecord":9,"representation":"signed functional integers"},"shapeTypes":{"resource":"tblSize.bin","resourceSha256":"69c5622caf6012909b6a42cf6fded49e30bc4dae1184f06014a08c4aa253adb2","field":"r.[B+t","consumerOrBindingRaw":"0x1fa74/0x1fa80;0x37758","recordCount":46,"columnsPerRecord":1,"representation":"signed functional integers"},"maskWeights":{"resource":"PACK_STAGE_CELL.bin","resourceSha256":"26ec8274d5bd31f1d01ee6e2aa05f0cb158a82c4b1859919d68b9210f4b3cde9","field":"r.[B+r","consumerOrBindingRaw":"0x1fa36/0x1fa42;cell-count-only","recordCount":90,"columnsPerRecord":1,"representation":"signed functional integers"},"historyModes":{"resource":"tblDog.bin","resourceSha256":"a20be71e42ee4debcb1405bdc51f3140081c8724c4318538905fe71236b58438","field":"r.[I+d","bindingRaw":"0x1f9f6/0x1fa02","decoderRaw":"0x1a310/0x1a324/0x1a33c/0x1a354","representation":"big-endian 32-bit behavior modes","recordCount":38},"shapeRecords":{"field":"d.[B+a","recordCount":46,"source":"evidence/r74-research/stages/procedural-contracts.json","initializerRaw":"0x10d14..0x114a0","representation":"m,n,ag,ah integer rules"}},"excluded":["original masks","pixel data","palette RGB","text/script","sound/music","native byte dumps"]};
},
"experiments/r77-native-map-setup/functional-providers.cjs":function(module,exports,require){
'use strict';
const metadata=require('./functional-metadata.json');
function row(table,index){if(!Number.isInteger(index)||index<0||index>=table.length)throw new RangeError('functional metadata index outside table: '+index);return Array.isArray(table[index])?table[index].slice():table[index];}
function createProviders({maskCell,maxDraws=10000}={}){
 const t=metadata.tables;
 const providers={stageRecord:offset=>{if(offset%9!==0)throw new RangeError('stage record byte offset must be divisible by9');return row(t.stageRecords,offset/9);},shapeRecord:index=>row(t.shapeRecords,index),cellRecord:index=>row(t.cellRecords,index),cameraRecord:index=>row(t.cameraRecords,index),weightedRecord:index=>row(t.weightedRecords,index),shapeType:index=>row(t.shapeTypes,index),primitiveType:index=>row(t.primitiveTypes,index),cellType:index=>row(t.cellTypes,index),cameraType:index=>row(t.cameraTypes,index),maskWeight:index=>row(t.maskWeights,index),historyMode:index=>row(t.historyModes,index),ordinarySlot:ordinal=>row(t.ordinarySlotsZeroBased,ordinal),maxDraws};
 if(maskCell!==undefined){if(typeof maskCell!=='function')throw new TypeError('explicit maskCell function required');providers.maskCell=maskCell;}
 return providers;
}
module.exports={createProviders,provenance:{schema:metadata.schema,nativeSha256:metadata.nativeSha256,jarSha256:metadata.jarSha256,excluded:metadata.excluded}};

},
"experiments/r77-native-map-setup/map-setup.cjs":function(module,exports,require){
'use strict';
// Candidate-specific numeric control flow. All records/masks come from callers.
// Missing native consumers are resumable calls, never silently skipped.
const A=require('../r75-procedural-geometry/assembly.cjs');
const L=require('../r75-procedural-geometry/lifecycle.cjs');
const R=require('../r75-procedural-geometry/native-rng.cjs');
const P=require('../../web/src/restoration-stage-policy.js');
const Cells=require('../r75-procedural-geometry/cell-factory.cjs');
const Entities=require('../r75-procedural-geometry/cell-entity-runtime.cjs');
const BossSetup=require('../r77-native-boss-setup/boss-setup.cjs');
const clone=x=>structuredClone(x);
function int(v,label){if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new RangeError(label+' requires int32');return v;}
function bytes(v,n,label){if(!Array.isArray(v)||v.length!==n||v.some(x=>!Number.isInteger(x)||x<-128||x>127))throw new TypeError(label+' requires '+n+' signed bytes');return v;}
function current(s){return s.game.pool.objects[s.game.pool.currentIndex];}
function validate(s){if(!s?.game?.pool||!s.map||!Array.isArray(s.entities))throw new TypeError('driver state plus explicit map fields and entity slots required');A.createExistingAssembly(s.game.pool);return s;}
function fields(s){return s.map;}
function context(input,providers){
 const c={state:clone(validate(input)),providers,trace:[],effects:[]};
 c.mark=(raw,operation,detail={})=>c.trace.push({raw,operation,...detail});
 c.draw=(stream,bound,raw)=>{
  int(bound,'bound');const key=c.state.game.rng[stream];
  if(typeof key!=='string')throw new TypeError('explicit initialized RNG '+stream+' state required');
  const random=R.Java48Random.fromState(BigInt(key)),value=random.bounded(bound);
  c.state.game.rng[stream]=random.state.toString();c.mark(raw,'draw',{stream,bound,value,before:key,after:random.state.toString()});
  if(value<0||value>=Math.max(1,bound))throw new RangeError('native negative remainder / invalid bounded result preserved: '+value);
  return value;
 };
 c.record=(name,index,length)=>{const f=providers?.[name];if(typeof f!=='function')throw new TypeError('numeric provider required: '+name);return bytes(f(index),length,name+'['+index+']');};
 return c;
}
function* call(c,method,args,raw){
 c.mark(raw,'call',{method,args});
 const reply=yield {kind:'native-call',method,args,raw,state:clone(c.state),trace:clone(c.trace),effects:clone(c.effects)};
 if(!reply||reply.supported!==true||!['implemented-contract','synthetic-fixture'].includes(reply.scope))throw new TypeError('native continuation requires supported state and explicit scope: '+method);
 c.state=clone(validate(reply.state));c.trace.push(...clone(reply.trace||[]));c.effects.push(...clone(reply.effects||[]));
 c.mark(raw,'call-return',{method,scope:reply.scope});
}
function done(c,extra={}){return {supported:true,state:c.state,trace:c.trace,effects:c.effects,...extra,completeNativeFrame:false,originalRuntimeFullEquivalence:false,originalPayloadIncluded:false};}
function reject(c,n,previous,raw){return P.rejectPrevious(n,previous,b=>c.draw('A',b,raw),{maxDraws:c.providers.maxDraws??10000});}
function writeRow(c,row){const m=fields(c.state);['ai','aj','ak','al','o','p','q','r'].forEach((k,i)=>m[k]=row[i]);syncMode(c);}
function syncMode(c){const s=c.state;s.u.actionLock=s.map.o;s.game.controller.modeP=s.map.p;s.game.stage.behaviorCode=s.map.q;s.game.stage.behaviorArgument=s.map.r;s.game.stage.primitive=s.map.aj;}
function preparation(c){
 const s=c.state,m=s.map;
 s.game.controller.controllerStateUK=c.draw('A',1,'0x36276');m.az=0;s.game.controller.y=0;
 c.mark('0x36282..0x362a4','controller-and-cell-reset');
 if(s.game.controller.controllerStateUK!==0)return false;
 s.u.s=s.r.tutorial?1000000:150+c.draw('A',150,'0x37b08');
 if(c.draw('A',1000,'0x362ec')<=69){
  const records=Array.from({length:17},(_,i)=>c.record('weightedRecord',i,9));
  const total=records.reduce((a,r)=>(a+r[8])|0,0),sample=c.draw('A',total,'0x3633a');
  let cumulative=0;for(let i=0;i<17;i++){cumulative=(cumulative+records[i][8])|0;if(sample<cumulative){writeRow(c,records[i]);break;}}
 }else{
  // Rejection updates ai before the next shape rejection; previous is not fixed.
  let type,attempt=0;do{if(++attempt>(c.providers.maxDraws??10000))throw new RangeError('shape rejection budget exhausted');m.ai=reject(c,46,int(m.ai,'map.ai'),'0x37744');type=c.record('shapeType',m.ai,1)[0];}while(type===0);
  const compatible=(field,bound,provider,raw)=>{for(let i=0;i<(c.providers.maxDraws??10000);i++){m[field]=c.draw('A',bound,raw);if(c.record(provider,m[field],1)[0]===type)return;}throw new RangeError('compatibility rejection budget exhausted: '+provider);};
  compatible('aj',38,'primitiveType','0x37782');compatible('ak',53,'cellType','0x378ca');compatible('al',11,'cameraType','0x3792e');
  m.o=m.p=m.q=m.r=0;
  if(type===5)m.p=1;
  if(type===3){m.q=1+c.draw('A',2,'0x37a9a');if(m.aj===28)m.q=1;if(m.q===2)m.r=11+c.draw('A',5,'0x37ad2');}
  if(type===4){m.q=3;m.aj=30*c.draw('A',3,'0x37a3c')+c.draw('A',20,'0x37a50')+1;m.r=m.aj>60?1+c.draw('A',2,'0x37a74'):0;}
  syncMode(c);
 }
 c.mark('0x36504','preliminary-configuration-complete');return true;
}
function select(c){
 const s=c.state,m=s.map,selected=P.selectStage({mode:s.r.slot===100?'freePlay':'ordinary',selectedSlot:s.r.slot,ordinal:s.r.ordinal,previousVariant:m.x,previousGroup:m.w,firstSelection:s.u.score===0,rngA:b=>c.draw('A',b,'0x374d4/0x37728'),rngB:b=>c.draw('B',b,'0x37518'),maxDraws:c.providers.maxDraws??10000});
 m.w=selected.group;m.x=selected.variant;
 const row=c.record('stageRecord',selected.stageTableOffset,9);writeRow(c,row);
 s.game.stage={...s.game.stage,behaviorCode:m.q,primitive:m.aj,col8:row[8],group:m.w};
 c.mark('0x37156..0x3739e','select-stage',{...selected,rowFields:{ai:m.ai,aj:m.aj,ak:m.ak,al:m.al,o:m.o,p:m.p,q:m.q,r:m.r,col8:row[8]}});
}
function profileRow(row,dense){
 if(!row.some(Boolean)&&!dense)return -1;
 let before=true,count=0,gap=0;
 for(let depth=0;depth<24;depth++){
  const bit=row[depth];if(before){if(depth>20)return -80;if(!bit)continue;before=false;}
  if(bit){if(depth>20)return -1;count++;gap=0;}else if(++gap>2)return count<=0?-80:depth>22?320:(depth-2)*16;
 }
 return 0;
}
function maskProfile(maskCell,orientation){
 const rows=Array.from({length:24},(_,t)=>Array.from({length:24},(_,d)=>{const xy=orientation===1?[23-d,23-t]:orientation===2?[23-t,d]:orientation===3?[d,t]:[t,23-d];return !!maskCell(...xy);}));
 const occupied=rows.flatMap((row,i)=>row.some(Boolean)?[i]:[]);
 if(!occupied.length)return {empty:true,c:Array(24).fill(-1)};
 const first=occupied[0],last=occupied.at(-1),dense=rows[0].filter(Boolean).length>19;
 return {empty:false,c:rows.map((r,t)=>t<first||t>last?-1:profileRow(r,dense))};
}
function shape(c,index){
 const r=c.record('shapeRecord',index,4),shape={m:r[0],n:r[1],ag:r[2],ah:r[3]};
 c.state.game.pool=A.resizeFour(c.state.game.pool,shape,b=>c.draw('A',b,'0x3e230'),index).pool;
 c.mark('0x365aa','shape',{index,N:current(c.state).geometry.activeLength});
}
function geometry(c){
 const s=c.state,m=s.map;
 if(m.q===3){
  if(typeof c.providers.maskCell!=='function')throw new TypeError('caller maskCell(maskId,x,y) required');
  const order=[];let at=s.game.pool.currentIndex;
  for(let step=0;step<4;step++){
   at=s.game.pool.objects[at].linkB;if(at===null)throw new RangeError('q3 requires closed four-member next ring');order.push(at);
   const g=s.game.pool.objects[at];if(g.geometry.activeLength!==24)throw new RangeError('q3 normal contract requires N24');
   g.geometry=L.resetHeight(g.geometry,0);
   const p=maskProfile((x,y)=>c.providers.maskCell(m.ae,x,y),g.geometry.orientation);
   for(let j=0;j<24;j++)g.geometry.columns.c[j]=p.c[j];
   c.mark('0x3d3c4..0x3d76c','mask-profile',{index:at,orientation:g.geometry.orientation,empty:p.empty});
   if(p.empty){c.effects.push({kind:'caught-native-exception',name:'ArrayIndexOutOfBoundsException',raw:'0x3d6f4',index:-1,remainingProfilesSkipped:true,linksSkipped:true});return;}
  }
  for(const index of order)s.game.pool=A.adjustNeighbors(s.game.pool,index);
  c.mark('0x3d7ac','q3-neighbor-reconcile',{order});
 }else{
  const result=A.generateCurrentProcedural(s.game.pool,{behaviorCode:m.q,primitive:m.aj,col8:s.game.stage.col8,group:m.w,z:s.game.controller.z,rngA:b=>c.draw('A',b,'u.d primitive')});
  s.game.pool=result.pool;if(result.globalScalarWrites.uZ!==null)s.game.controller.z=result.globalScalarWrites.uZ;if(result.globalScalarWrites.uY!==null)s.game.controller.y=result.globalScalarWrites.uY;
  c.mark('0x365c0','current-primitive',{primitive:m.aj,index:s.game.pool.currentIndex});
 }
}
function* cells(c){
 let s=c.state,m=s.map,g=current(s);
 const input={cellIndex:m.ak,record:c.record('cellRecord',m.ak,3),shapeMode:c.record('shapeType',m.ai,1)[0],N:g.geometry.activeLength,y:s.game.controller.y,group:m.w,missionType:s.r.conditionType,behaviorCode:m.q,behaviorArgument:m.r,primitiveIndex:m.aj,maskId:m.ae??0,viewOrientation:int(s.game.actor.orientation,'actor.orientation'),col8:s.game.stage.col8,c:g.geometry.columns.c};
 if(input.shapeMode===4)input.maskWeight=c.record('maskWeight',input.maskId-1,1)[0];
 const stream=Cells.requestStream(input,b=>c.draw('A',b,'u.c cell-policy'));let answer=stream.next();
 while(!answer.done){const e=answer.value;let resume;s=c.state;
  c.mark('0x365d4','cell-request',{operation:e.operation});
  switch(e.operation){
   case 'clear-entities':s.entities.fill(null);break;
   case 'spawn':resume=Entities.executeFactory(e.args,{viewOrientation:input.viewOrientation,rngA:b=>c.draw('A',b,'entity-initializer'),slots:s.entities}).index;break;
   case 'set-entity-field':if(!s.entities[e.index])throw new RangeError('missing entity slot');s.entities[e.index][e.field.slice(4)]=e.value;break;
   case 'set-global':if(e.field!=='u.I+az')throw new Error('unsupported cell global');s.map.az=e.value;break;
   case 'invoke':yield* call(c,e.method,e.args,'0x365d4 nested cell posthook');break;
   case 'read-entity-slots':resume=s.entities;break;
   case 'invoke-entity':Entities.finalizeEntity(s.entities[e.index]);break;
   default:throw new Error('unsupported cell event '+e.operation);
  }
  answer=stream.next(resume);
 }
}
function cameraConfiguration(c){
 const s=c.state,m=s.map,row=c.record('cameraRecord',m.al,4);
 m.aq=row[0];m.at=m.au=m.ar=m.as=0;m.av=384;
 if(m.aq>0){const low=row[2],span=row[3]-low+1;const signed=(bound,raw)=>c.draw('A',bound,raw)*[1,-1][c.draw('A',2,raw+' direction')];
  m.at=(low+c.draw('A',span,'0x366a2'))*[1,-1][c.draw('A',2,'0x366be')];
  m.au=(low+c.draw('A',span,'0x366f6'))*[1,-1][c.draw('A',2,'0x36712')];
  const bound=(24-current(s).geometry.activeLength)>>1;m.ar=16*signed(bound,'0x3675c');m.as=16*signed(bound,'0x368a2');
 }
 m.an=m.q===99?s.r.slot:P.nextPalette({mode:s.r.slot===100?'freePlay':'ordinary',selectedSlot:s.r.slot,currentPalette:m.t,rngA:b=>c.draw('A',b,'0x37092/0x370b4'),maxDraws:c.providers.maxDraws??10000});
 s.game.view={...s.game.view,...Object.fromEntries(['aq','av','ar','as','at','au'].map(k=>[k,m[k]]))};
 c.mark('0x365e4..0x370cc','camera-and-next-palette');
}
function resetPosition(s){
 const m=s.map,g=current(s),a=s.game.actor,N=g.geometry.activeLength;
 if(m.p===0){g.position=s.game.pool.direction===0?48:16*N-64;const index=Math.max(0,Math.min(N-1,Math.trunc(g.position/16)));a.height=g.geometry.columns.c[index];a.verticalActive=false;a.special=false;}
 else{g.position=8*N-16;a.height=8*N-16;a.p=15;if(m.r===5||m.r===7)a.special=true;}
}
function q3EntryPosition(s){
 const g=current(s),cols=g.geometry.columns.c,N=g.geometry.activeLength,m=s.map;
 let t=s.game.pool.direction===0?0:N-1;
 for(;;){t+=s.game.pool.direction===0?1:-1;const other=t+(s.game.pool.direction===0?1:-1);if(t<0||t>=cols.length||other<0||other>=cols.length)throw new RangeError('native q3 entry scan reached array bounds');if(cols[t]>15&&cols[other]>15)break;}
 t+=s.game.pool.direction===0?3:-3;
 if(m.p!==0){g.position=184;s.game.actor.height=(s.boss?.J??m.J)===9?184:280;}
 else{if(t<0||t>=cols.length)throw new RangeError('native q3 entry target outside array');g.position=t*16;s.game.actor.height=cols[t];}
}
function notification(c){const s=c.state,m=s.map;int(s.u.aF,'u.aF');
 if(m.q===99){s.entities.fill(null);s.u.D=0;s.u.aF=0;}
 else if(s.u.aF>1000){s.u.D=10;s.u.aF=(s.u.aF-1000)|0;}
 else if(c.draw('A',1000,'0x36f04')<=49){s.u.D=10;s.u.aF=s.u.score<=4?c.draw('A',30,'0x36f2e'):75+c.draw('A',15,'0x36f42');}
}
function* setupBody(c,arg){
 if(!preparation(c))return;
 if(arg>0){c.mark('0x36504..0x37152','boss-configuration',BossSetup.configure(c.state,arg));syncMode(c);}else select(c);
 let s=c.state,m=s.map;
 if(m.q===99&&arg<=0){yield* call(c,'unsupported-boss-stage-record',[],'0x36564');return;}
 if(m.q===3||m.q===99){m.ae=m.aj;m.aj=0;s.game.stage.primitive=0;c.mark('0x370d2..0x370ec','special-primitive-transfer',{ae:m.ae});}
 shape(c,m.ai);geometry(c);yield* cells(c);cameraConfiguration(c);
 s=c.state;m=s.map;
 if(s.r.tutorial){
  writeRow(c,[45,0,0,0,0,0,0,0]);shape(c,45);const g=current(s);g.geometry=L.resetHeight(g.geometry,16);s.entities.fill(null);
  for(const [index,height,h,i] of [[20,64,1,0],[49,80,0,0],[50,80,0,1],[51,80,0,0]]){if(index>=g.geometry.activeLength)throw new RangeError('tutorial shape provider must cover direct column writes');for(const k of ['c','d','e','G'])g.geometry.columns[k][index]=height;g.geometry.columns.type[index]=0;g.geometry.columns.h[index]=h;g.geometry.columns.i[index]=i;g.geometry.columns.gFlag[index]=0;}
  for(const [x,y] of [[560,40],[800,120]])Entities.executeFactory([6,0,4,0,1,x,y,0,0,1],{viewOrientation:s.game.actor.orientation,rngA:b=>c.draw('A',b,'tutorial entity'),slots:s.entities});
  c.mark('0x36924..0x36a62','tutorial-override');
 }else notification(c);
 if(m.p>0)s.game.pool.direction=0;resetPosition(s);s.game.view={...s.game.view,bounds:{f:0,g:384,h:0,i:384}};
 c.mark('0x36a7e..0x36aa2','entry-position-and-bounds');
 if(m.q===99){BossSetup.initializeFrame(s,c.providers.bossSetup);c.mark('0x36e7c..0x36eb0','boss-initialization',{record:s.boss.J,H:s.boss.H,K:s.boss.K});}
 if(m.q===3||m.q===99)q3EntryPosition(s);
 if(m.p>0)s.action.speed=6; // Deliberately overwritten by the following selector.
 s.action.speed=m.ai<=1?12:m.ak===7?6:m.ak===4?9:8;
 yield* call(c,m.q===3?'u.()V+v':'u.()V+u',[],m.q===3?'0x36cb8':'0x36b1c');
 yield* call(c,c.state.map.p>0?'u.()V+w':'u.()V+x',[],c.state.map.p>0?'0x36b34':'0x36cae');
 for(let i=0;i<40;i++)yield* call(c,'u.(II)V+c',[i,16],'0x36b4c');
 yield* call(c,'e.(Z)V+a',[true],'0x36c3a');yield* call(c,'u.()V+t',[],'0x36c42');
 c.state.game.actor.p=6;c.state.u.ax=reject(c,10,int(c.state.u.ax,'u.ax'),'0x36c62');
 if(c.state.r.modeQ===1){yield* call(c,'u.()V+r',[],'0x36c9a');if(!c.state.history)throw new TypeError('history initializer must supply state.history');c.state.history.ay=10;}
 yield* call(c,'e.(I)V+d',[0],'0x36c8e');c.state.game.initialized=true;
 c.mark('0x362ac','setup-return');
}
function* setupStage(input,providers={},arg=0){const c=context(input,providers);yield* setupBody(c,int(arg,'setup argument'));return done(c,{phase:'stage-setup-return'});}
function* configureCells(input,providers={}){const c=context(input,providers);yield* cells(c);return done(c,{phase:'cell-configuration-return'});}
function point(s){const g=current(s);return A.rotatePoint((g.scalarE+g.position)|0,(g.scalarF-s.game.actor.height+16)|0,int(s.game.actor.orientation,'actor.orientation'));}
function capture(c,xKey,yKey,raw){const p=point(c.state);c.state.map.E=p.x;c.state.map.F=p.y;c.state.map[xKey]=Math.trunc(Math.imul(p.x,10)/16);c.state.map[yKey]=Math.trunc(Math.imul(p.y,10)/16);c.mark(raw,'capture-point',{xKey,yKey});}
function* mapConsumer(input,providers={}){
 const c=context(input,providers);let s=c.state;
 if(s.u.l!==1||[13,11,16].includes(s.game.actor.actorState))return done(c,{consumed:false,continuationRaw:'0x49ca2'});
 if(s.r.slot!==100&&s.r.conditionType===18){s.r.credit=(int(s.r.credit,'r.credit')+1)|0;c.mark('0x4a9a4..0x4a9ba','condition18-credit',{credit:s.r.credit});}
 s.u.l=0;s.u.jitter=false;capture(c,'Z','aa','0x4a79e..0x4a7e8');s.map.e=0;s.map.h=1;
 yield* call(c,'u.(Lorg/kwis/msp/lcdui/Graphics;)V+a',[null],'0x4a7fa');
 s=c.state;s.entities.fill(null);s.map.f=0;s.map.h=2;
 for(const g of s.game.pool.objects)g.geometry=L.resetHeight(g.geometry,16);
 resetPosition(s);c.mark('0x4a802..0x4a826','clear-entities-reset-four-entry');
 yield* setupBody(c,0);
 yield* call(c,'u.()V+E',[],'0x4a838');
 const oldPalette=c.state.map.t;c.state.map.t=c.state.map.an;
 yield* call(c,'u.(Lorg/kwis/msp/lcdui/Graphics;)V+a',[null],'0x4a862');
 c.state.map.t=oldPalette;capture(c,'ab','ac','0x4a8da..0x4a924');
 s=c.state;if(int(s.u.aH,'u.aH')<=1){const random=R.Java48Random.fromState(BigInt(s.game.rng.A));s.u.aG=random.nextInt();s.game.rng.A=random.state.toString();s.u.aH=32;c.mark('0x53928','next-int-A',{value:s.u.aG});}
 const code=int(s.u.aG,'u.aG')&3;s.u.aG>>=2;s.u.aH-=2;
 yield* call(c,'u.(Z)V+b',[code===0],'0x4a940');
 s=c.state;s.map.h=0;s.map.aC=s.game.controller.controllerStateUK;s.game.controller.controllerStateUK=200;s.map.ad=0;
 yield* call(c,'k.(Ljava/lang/String;)V+a',[{kind:'resource-reference',role:'map-transition',literalRaw:'0x4a976..0x4a990'}],'0x4a990');
 return done(c,{consumed:true,phase:'map-consumer-return',continuationRaw:'0x49ca2'});
}
function drive(iterator,ports={},pending){
 let step=pending?{done:false,value:pending}:iterator.next();
 while(!step.done){const request=step.value,port=ports[request.method];
  if(typeof port!=='function')return {supported:false,reason:'missing-native-consumer:'+request.method,state:request.state,trace:request.trace,effects:request.effects,continuation:{iterator,pending:request}};
  const reply=port(request);if(reply?.supported!==true)return {supported:false,reason:reply?.reason||'unsupported-native-consumer:'+request.method,state:request.state,trace:request.trace,effects:request.effects,continuation:{iterator,pending:request}};
  step=iterator.next(reply);
 }
 return step.value;
}
module.exports={setupStage,configureCells,mapConsumer,drive,maskProfile,profileRow,resetPosition,q3EntryPosition};


},
"experiments/r77-native-mask-geometry/mask-geometry.cjs":function(module,exports,require){
'use strict';
// Functional collision regions only. Coordinates are cells, not display pixels.
const data = require('./regions.json');
const records = new Map(data.masks.map(m => [m.id, m]));
function record(id) {
  if (!Number.isInteger(id) || !records.has(id)) throw new RangeError('Unknown candidate collision mask ID: '+id);
  return records.get(id);
}
function coordinate(value) {
  if (!Number.isInteger(value) || value < -2147483648 || value > 2147483647) throw new TypeError('Mask coordinate requires int32');
  return Math.max(0, Math.min(23, value));
}
function bindMask(id) {
  const rectangles = record(id).rectangles;
  return (x,y) => {
    x=coordinate(x); y=coordinate(y);
    return rectangles.some(([x0,y0,x1,y1]) => x>=x0 && x<x1 && y>=y0 && y<y1);
  };
}
function maskCell(id,x,y) { return bindMask(id)(x,y); }
function describe(id) { return structuredClone(record(id)); }
module.exports=Object.freeze({maskCell,bindMask,describe,supportedIds:Object.freeze([...records.keys()]),provenance:Object.freeze({schema:data.schema,nativeSha256:data.nativeSha256,scope:data.scope})});

},
"experiments/r77-native-mask-geometry/regions.json":function(module,exports,require){
module.exports={"schema":"functional-collision-rectangles-v1","scope":"One unauthenticated KTF candidate; gameplay occupancy only, not artwork or original resource payload.","nativeSha256":"782b2c836ef32331e74a943367aa7bae09891fa56ca39cd89acfa887bcfa55d3","bounds":"[x0,y0,x1,y1], half-open integer cells in 24 by 24 space","construction":"Own axis-run partition; smaller of horizontal/vertical partitions, not globally minimal","masks":[{"id":1,"stageVariantReferences":1,"occupiedCells":86,"rectangles":[[0,0,1,24],[1,0,20,1],[23,0,24,24],[4,23,23,24]]},{"id":2,"stageVariantReferences":1,"occupiedCells":86,"rectangles":[[0,0,1,23],[4,0,24,1],[23,1,24,24],[0,23,20,24]]},{"id":3,"stageVariantReferences":0,"occupiedCells":86,"rectangles":[[0,0,1,13],[1,0,23,1],[23,0,24,8],[23,11,24,24],[0,16,1,24],[1,23,23,24]]},{"id":4,"stageVariantReferences":0,"occupiedCells":86,"rectangles":[[0,0,1,24],[1,0,8,1],[11,0,23,1],[23,0,24,24],[1,23,13,24],[16,23,23,24]]},{"id":5,"stageVariantReferences":1,"occupiedCells":86,"rectangles":[[0,0,23,1],[23,0,24,20],[0,4,1,24],[1,23,24,24]]},{"id":6,"stageVariantReferences":1,"occupiedCells":86,"rectangles":[[0,0,1,20],[1,0,24,1],[23,4,24,24],[0,23,23,24]]},{"id":7,"stageVariantReferences":1,"occupiedCells":98,"rectangles":[[0,0,22,1],[22,1,23,2],[23,2,24,20],[0,4,1,22],[9,8,10,10],[14,9,16,10],[10,10,11,11],[13,10,14,11],[11,11,13,13],[10,13,11,14],[13,13,14,14],[8,14,10,15],[14,14,15,16],[1,22,2,23],[2,23,24,24]]},{"id":8,"stageVariantReferences":1,"occupiedCells":122,"rectangles":[[0,0,1,23],[4,0,24,1],[23,1,24,24],[7,7,8,9],[14,7,17,8],[14,8,15,9],[7,9,10,10],[12,9,15,10],[9,10,10,11],[12,10,13,11],[9,11,13,12],[11,12,15,13],[11,13,12,14],[14,13,15,14],[9,14,12,15],[14,14,17,15],[9,15,10,16],[16,15,17,17],[7,16,10,17],[0,23,20,24]]},{"id":9,"stageVariantReferences":1,"occupiedCells":80,"rectangles":[[0,0,20,1],[23,0,24,20],[0,4,1,24],[4,23,24,24]]},{"id":10,"stageVariantReferences":1,"occupiedCells":80,"rectangles":[[0,0,1,20],[4,0,24,1],[23,4,24,24],[0,23,20,24]]},{"id":11,"stageVariantReferences":1,"occupiedCells":80,"rectangles":[[0,0,1,13],[1,0,8,1],[11,0,23,1],[23,0,24,8],[23,11,24,24],[0,16,1,24],[1,23,13,24],[16,23,23,24]]},{"id":12,"stageVariantReferences":1,"occupiedCells":80,"rectangles":[[0,0,1,8],[1,0,13,1],[16,0,23,1],[23,0,24,13],[0,11,1,24],[23,16,24,24],[1,23,8,24],[11,23,23,24]]},{"id":13,"stageVariantReferences":1,"occupiedCells":108,"rectangles":[[0,0,1,20],[4,0,24,1],[23,4,24,24],[13,7,14,10],[7,10,14,11],[10,11,14,13],[10,13,17,14],[10,14,11,17],[0,23,20,24]]},{"id":14,"stageVariantReferences":1,"occupiedCells":100,"rectangles":[[0,0,20,1],[23,0,24,20],[0,4,1,24],[10,7,11,8],[11,8,12,11],[16,10,17,11],[11,11,16,12],[8,12,13,13],[7,13,8,14],[12,13,13,16],[13,16,14,17],[4,23,24,24]]},{"id":15,"stageVariantReferences":2,"occupiedCells":132,"rectangles":[[0,0,1,10],[1,0,2,1],[2,0,3,8],[3,0,11,1],[14,0,15,1],[15,0,16,2],[16,0,23,1],[23,0,24,11],[16,2,23,3],[9,7,10,10],[14,7,15,10],[1,8,2,9],[7,9,9,10],[15,9,17,10],[0,13,1,24],[7,14,9,15],[9,14,10,17],[14,14,15,17],[15,14,17,15],[23,14,24,24],[22,15,23,16],[21,16,22,24],[1,21,8,22],[8,22,9,24],[1,23,8,24],[9,23,10,24],[13,23,21,24],[22,23,23,24]]},{"id":16,"stageVariantReferences":2,"occupiedCells":132,"rectangles":[[0,0,1,11],[1,0,8,1],[8,0,9,2],[9,0,10,1],[13,0,21,1],[21,0,22,8],[22,0,23,1],[23,0,24,10],[1,2,8,3],[9,7,10,10],[14,7,15,10],[22,8,23,9],[7,9,9,10],[15,9,17,10],[23,13,24,24],[0,14,1,24],[7,14,9,15],[9,14,10,17],[14,14,15,17],[15,14,17,15],[1,15,2,16],[2,16,3,24],[16,21,23,22],[15,22,16,24],[1,23,2,24],[3,23,11,24],[14,23,15,24],[16,23,23,24]]},{"id":17,"stageVariantReferences":2,"occupiedCells":120,"rectangles":[[1,0,2,1],[4,0,5,1],[7,0,8,1],[10,0,11,1],[13,0,14,1],[16,0,17,1],[19,0,20,1],[22,0,23,1],[0,1,24,2],[1,2,2,4],[0,4,2,5],[1,5,2,7],[23,5,24,6],[22,6,23,7],[0,7,2,8],[22,7,24,8],[1,8,5,10],[22,8,23,10],[0,10,2,11],[22,10,24,11],[1,11,2,13],[22,11,23,13],[0,13,2,14],[22,13,24,14],[1,14,2,16],[19,14,23,16],[0,16,2,17],[22,16,24,17],[1,17,2,18],[22,17,23,19],[0,18,1,19],[22,19,24,20],[22,20,23,22],[0,22,24,23],[1,23,2,24],[4,23,5,24],[7,23,8,24],[10,23,11,24],[13,23,14,24],[16,23,17,24],[19,23,20,24],[22,23,23,24]]},{"id":18,"stageVariantReferences":2,"occupiedCells":120,"rectangles":[[1,0,2,24],[4,0,5,2],[7,0,8,2],[10,0,11,5],[13,0,14,2],[16,0,17,2],[18,0,19,1],[22,0,23,24],[0,1,1,2],[2,1,4,2],[5,1,7,2],[8,1,9,2],[9,1,10,5],[11,1,13,2],[14,1,16,2],[17,1,18,2],[23,1,24,2],[0,4,1,5],[23,4,24,5],[0,7,1,8],[23,7,24,8],[0,10,1,11],[23,10,24,11],[0,13,1,14],[23,13,24,14],[0,16,1,17],[23,16,24,17],[0,19,1,20],[13,19,14,24],[14,19,15,23],[23,19,24,20],[0,22,1,23],[6,22,7,23],[7,22,8,24],[8,22,10,23],[10,22,11,24],[11,22,13,23],[15,22,16,23],[16,22,17,24],[17,22,19,23],[19,22,20,24],[20,22,22,23],[23,22,24,23],[5,23,6,24]]},{"id":19,"stageVariantReferences":1,"occupiedCells":70,"rectangles":[[0,4,23,5],[23,4,24,16],[0,8,1,20],[1,19,24,20]]},{"id":20,"stageVariantReferences":1,"occupiedCells":70,"rectangles":[[0,4,1,16],[1,4,24,5],[23,8,24,20],[0,19,23,20]]},{"id":21,"stageVariantReferences":1,"occupiedCells":70,"rectangles":[[4,0,5,24],[5,0,16,1],[19,0,20,24],[8,23,19,24]]},{"id":22,"stageVariantReferences":1,"occupiedCells":70,"rectangles":[[4,0,5,23],[8,0,20,1],[19,1,20,24],[4,23,16,24]]},{"id":23,"stageVariantReferences":2,"occupiedCells":96,"rectangles":[[0,0,24,1],[0,1,1,10],[7,1,8,4],[16,1,17,4],[23,1,24,10],[0,14,1,23],[23,14,24,23],[7,20,8,23],[16,20,17,23],[0,23,24,24]]},{"id":24,"stageVariantReferences":2,"occupiedCells":96,"rectangles":[[0,0,1,24],[1,0,10,1],[14,0,23,1],[23,0,24,24],[1,7,4,8],[20,7,23,8],[1,16,4,17],[20,16,23,17],[1,23,10,24],[14,23,23,24]]},{"id":25,"stageVariantReferences":2,"occupiedCells":76,"rectangles":[[0,4,1,16],[1,4,24,5],[23,8,24,20],[1,10,4,11],[20,13,23,14],[0,19,23,20]]},{"id":26,"stageVariantReferences":2,"occupiedCells":76,"rectangles":[[4,0,16,1],[19,0,20,23],[4,1,5,24],[10,1,11,4],[13,20,14,23],[8,23,20,24]]},{"id":27,"stageVariantReferences":1,"occupiedCells":92,"rectangles":[[0,0,1,8],[1,0,7,1],[7,0,8,4],[8,0,13,1],[16,0,23,1],[23,0,24,13],[20,7,23,8],[0,11,1,24],[1,16,4,17],[23,16,24,24],[16,20,17,24],[1,23,8,24],[11,23,16,24],[17,23,23,24]]},{"id":28,"stageVariantReferences":1,"occupiedCells":92,"rectangles":[[0,0,1,12],[1,0,9,1],[12,0,17,1],[17,0,18,4],[18,0,23,1],[23,0,24,9],[1,6,4,7],[23,12,24,24],[0,15,1,24],[20,17,23,18],[6,20,7,24],[1,23,6,24],[7,23,12,24],[15,23,23,24]]},{"id":29,"stageVariantReferences":1,"occupiedCells":144,"rectangles":[[0,0,1,12],[1,0,2,11],[2,0,9,1],[12,0,13,1],[13,0,16,2],[16,0,18,5],[18,0,23,2],[23,0,24,9],[2,6,5,8],[23,12,24,24],[22,13,23,24],[0,15,1,24],[19,16,22,18],[6,19,8,24],[1,22,6,24],[8,22,11,24],[11,23,12,24],[15,23,22,24]]},{"id":30,"stageVariantReferences":1,"occupiedCells":144,"rectangles":[[0,0,1,9],[1,0,6,2],[6,0,8,5],[8,0,11,2],[11,0,12,1],[15,0,22,1],[22,0,23,11],[23,0,24,12],[19,6,22,8],[0,12,1,24],[1,13,2,24],[23,15,24,24],[2,16,5,18],[16,19,18,24],[13,22,16,24],[18,22,23,24],[2,23,9,24],[12,23,13,24]]},{"id":31,"stageVariantReferences":1,"occupiedCells":108,"rectangles":[[0,0,1,24],[1,0,23,1],[23,0,24,24],[8,8,9,9],[15,8,16,9],[9,9,10,10],[14,9,15,10],[10,10,11,11],[13,10,14,11],[11,11,13,13],[10,13,11,14],[13,13,14,14],[9,14,10,15],[14,14,15,15],[8,15,9,16],[15,15,16,16],[1,23,23,24]]},{"id":32,"stageVariantReferences":1,"occupiedCells":104,"rectangles":[[2,0,22,1],[1,1,2,2],[22,1,23,2],[0,2,1,22],[23,2,24,22],[10,7,11,8],[11,8,12,11],[16,10,17,11],[11,11,16,12],[8,12,13,13],[7,13,8,14],[12,13,13,16],[13,16,14,17],[1,22,2,23],[22,22,23,23],[2,23,22,24]]},{"id":33,"stageVariantReferences":0,"occupiedCells":148,"rectangles":[[0,0,1,24],[1,0,7,1],[7,0,8,2],[8,0,9,3],[9,0,10,2],[10,0,14,1],[14,0,15,2],[15,0,16,3],[16,0,17,2],[17,0,23,1],[23,0,24,24],[1,7,2,10],[22,7,23,10],[2,8,3,9],[13,8,14,14],[21,8,22,9],[8,10,10,11],[10,10,11,16],[11,10,13,14],[14,13,16,14],[1,14,2,17],[22,14,23,17],[2,15,3,16],[21,15,22,16],[8,21,9,24],[15,21,16,24],[7,22,8,24],[9,22,10,24],[14,22,15,24],[16,22,17,24],[1,23,7,24],[10,23,14,24],[17,23,23,24]]},{"id":34,"stageVariantReferences":2,"occupiedCells":108,"rectangles":[[14,0,15,2],[15,0,21,1],[21,0,22,8],[7,1,8,3],[8,1,14,2],[0,2,1,10],[1,2,7,3],[22,7,23,15],[1,9,2,17],[10,10,14,14],[23,14,24,22],[2,16,3,24],[16,21,17,23],[17,21,23,22],[9,22,10,24],[10,22,16,23],[3,23,9,24]]},{"id":35,"stageVariantReferences":2,"occupiedCells":100,"rectangles":[[1,1,2,23],[2,1,22,2],[22,1,23,23],[10,10,14,14],[2,22,22,23]]},{"id":36,"stageVariantReferences":1,"occupiedCells":144,"rectangles":[[0,0,1,24],[1,0,23,1],[23,0,24,24],[7,7,8,9],[8,7,9,10],[15,7,16,10],[16,7,17,9],[9,8,10,11],[14,8,15,11],[10,9,11,15],[13,9,14,15],[11,10,13,14],[9,13,10,16],[14,13,15,16],[8,14,9,17],[15,14,16,17],[7,15,8,17],[16,15,17,17],[1,23,23,24]]},{"id":37,"stageVariantReferences":1,"occupiedCells":160,"rectangles":[[0,0,1,24],[1,0,7,1],[7,0,10,2],[10,0,14,3],[14,0,17,2],[17,0,23,1],[23,0,24,24],[1,7,2,17],[22,7,23,17],[9,9,10,10],[14,9,15,10],[2,10,3,14],[10,10,11,11],[13,10,14,11],[21,10,22,14],[11,11,13,13],[10,13,11,14],[13,13,14,14],[9,14,10,15],[14,14,15,15],[10,21,14,24],[7,22,10,24],[14,22,17,24],[1,23,7,24],[17,23,23,24]]},{"id":38,"stageVariantReferences":0,"occupiedCells":124,"rectangles":[[0,0,1,24],[1,0,7,1],[7,0,9,4],[9,0,15,1],[15,0,17,2],[17,0,23,1],[23,0,24,24],[1,7,2,9],[20,7,23,9],[1,15,4,17],[22,15,23,17],[15,20,17,24],[7,22,9,24],[1,23,7,24],[9,23,15,24],[17,23,23,24]]},{"id":39,"stageVariantReferences":2,"occupiedCells":164,"rectangles":[[0,0,1,24],[1,0,7,2],[7,0,9,7],[9,0,22,1],[22,0,23,9],[23,0,24,24],[17,7,22,9],[1,15,2,24],[2,15,7,17],[15,17,17,24],[17,22,23,24],[2,23,15,24]]},{"id":40,"stageVariantReferences":2,"occupiedCells":164,"rectangles":[[0,0,1,24],[1,0,2,9],[2,0,15,1],[15,0,17,7],[17,0,23,2],[23,0,24,24],[2,7,7,9],[17,15,22,17],[22,15,23,24],[7,17,9,24],[1,22,7,24],[9,23,22,24]]},{"id":41,"stageVariantReferences":4,"occupiedCells":110,"rectangles":[[16,0,18,4],[18,0,23,1],[23,0,24,15],[11,3,13,7],[13,3,16,4],[6,6,8,10],[8,6,11,7],[0,9,1,24],[1,9,6,10],[16,14,18,18],[18,14,23,15],[11,17,13,21],[13,17,16,18],[6,20,8,24],[8,20,11,21],[1,23,6,24]]},{"id":42,"stageVariantReferences":2,"occupiedCells":180,"rectangles":[[0,0,1,24],[1,0,7,1],[7,0,10,2],[10,0,11,3],[11,0,13,7],[13,0,14,3],[14,0,17,2],[17,0,23,1],[23,0,24,24],[1,7,2,17],[22,7,23,17],[2,10,3,14],[21,10,22,14],[3,11,7,13],[17,11,21,13],[11,17,13,24],[10,21,11,24],[13,21,14,24],[7,22,10,24],[14,22,17,24],[1,23,7,24],[17,23,23,24]]},{"id":43,"stageVariantReferences":2,"occupiedCells":164,"rectangles":[[0,0,2,1],[4,0,8,1],[10,0,14,1],[16,0,20,1],[22,0,24,1],[0,1,1,23],[2,1,3,2],[5,1,6,2],[8,1,9,2],[11,1,13,2],[15,1,16,2],[18,1,19,2],[21,1,22,2],[23,1,24,23],[3,2,4,3],[6,2,7,3],[9,2,10,3],[14,2,15,3],[17,2,18,3],[20,2,21,3],[4,3,5,4],[7,3,8,4],[10,3,11,4],[13,3,14,4],[16,3,17,4],[19,3,20,4],[5,4,6,5],[8,4,9,5],[11,4,13,5],[15,4,16,5],[18,4,19,5],[6,5,7,6],[9,5,10,6],[14,5,15,6],[17,5,18,6],[7,6,8,7],[10,6,14,7],[16,6,17,7],[8,7,9,8],[15,7,16,8],[9,8,15,9],[9,15,15,16],[8,16,9,17],[15,16,16,17],[7,17,8,18],[10,17,14,18],[16,17,17,18],[6,18,7,19],[9,18,10,19],[14,18,15,19],[17,18,18,19],[5,19,6,20],[8,19,9,20],[11,19,13,20],[15,19,16,20],[18,19,19,20],[4,20,5,21],[7,20,8,21],[10,20,11,21],[13,20,14,21],[16,20,17,21],[19,20,20,21],[3,21,4,22],[6,21,7,22],[9,21,10,22],[14,21,15,22],[17,21,18,22],[20,21,21,22],[2,22,3,23],[5,22,6,23],[8,22,9,23],[11,22,13,23],[15,22,16,23],[18,22,19,23],[21,22,22,23],[0,23,2,24],[4,23,8,24],[10,23,14,24],[16,23,20,24],[22,23,24,24]]},{"id":44,"stageVariantReferences":2,"occupiedCells":164,"rectangles":[[0,0,1,2],[1,0,23,1],[23,0,24,2],[1,2,2,3],[22,2,23,3],[2,3,3,4],[21,3,22,4],[0,4,1,8],[3,4,4,5],[20,4,21,5],[23,4,24,8],[1,5,2,6],[4,5,5,6],[19,5,20,6],[22,5,23,6],[2,6,3,7],[5,6,6,7],[18,6,19,7],[21,6,22,7],[3,7,4,8],[6,7,7,8],[17,7,18,8],[20,7,21,8],[1,8,2,9],[4,8,5,9],[7,8,8,9],[16,8,17,9],[19,8,20,9],[22,8,23,9],[2,9,3,10],[5,9,6,10],[8,9,9,15],[15,9,16,15],[18,9,19,10],[21,9,22,10],[0,10,1,14],[3,10,4,11],[6,10,7,14],[17,10,18,14],[20,10,21,11],[23,10,24,14],[1,11,2,13],[4,11,5,13],[19,11,20,13],[22,11,23,13],[3,13,4,14],[20,13,21,14],[2,14,3,15],[5,14,6,15],[18,14,19,15],[21,14,22,15],[1,15,2,16],[4,15,5,16],[7,15,8,16],[16,15,17,16],[19,15,20,16],[22,15,23,16],[0,16,1,20],[3,16,4,17],[6,16,7,17],[17,16,18,17],[20,16,21,17],[23,16,24,20],[2,17,3,18],[5,17,6,18],[18,17,19,18],[21,17,22,18],[1,18,2,19],[4,18,5,19],[19,18,20,19],[22,18,23,19],[3,19,4,20],[20,19,21,20],[2,20,3,21],[21,20,22,21],[1,21,2,22],[22,21,23,22],[0,22,1,24],[23,22,24,24],[1,23,23,24]]},{"id":45,"stageVariantReferences":2,"occupiedCells":164,"rectangles":[[0,0,1,24],[1,0,8,1],[8,0,9,2],[9,0,10,3],[10,0,14,1],[14,0,15,3],[15,0,16,2],[16,0,23,1],[23,0,24,24],[10,2,11,6],[11,2,13,3],[13,2,14,6],[11,5,13,6],[1,8,2,10],[22,8,23,10],[2,9,3,15],[21,9,22,15],[3,10,5,11],[5,10,6,14],[18,10,19,14],[19,10,21,11],[3,13,5,14],[19,13,21,14],[1,14,2,16],[22,14,23,16],[10,18,11,22],[11,18,13,19],[13,18,14,22],[9,21,10,24],[11,21,13,22],[14,21,15,24],[8,22,9,24],[15,22,16,24],[1,23,8,24],[10,23,14,24],[16,23,23,24]]},{"id":46,"stageVariantReferences":2,"occupiedCells":128,"rectangles":[[0,0,1,11],[1,0,10,1],[10,0,11,7],[13,0,14,7],[14,0,23,1],[23,0,24,11],[11,6,13,7],[1,10,3,11],[3,10,4,14],[20,10,21,14],[21,10,23,11],[0,13,1,24],[1,13,3,14],[21,13,23,14],[23,13,24,24],[10,17,11,24],[11,17,13,18],[13,17,14,24],[1,23,10,24],[14,23,23,24]]},{"id":47,"stageVariantReferences":2,"occupiedCells":128,"rectangles":[[0,0,1,11],[1,0,10,1],[10,0,11,4],[13,0,14,4],[14,0,23,1],[23,0,24,11],[11,3,13,4],[1,10,6,11],[6,10,7,14],[17,10,18,14],[18,10,23,11],[0,13,1,24],[1,13,6,14],[18,13,23,14],[23,13,24,24],[10,20,11,24],[11,20,13,21],[13,20,14,24],[1,23,10,24],[14,23,23,24]]},{"id":48,"stageVariantReferences":4,"occupiedCells":116,"rectangles":[[0,0,1,24],[1,0,23,1],[23,0,24,24],[7,3,9,5],[15,3,17,5],[3,11,5,13],[19,11,21,13],[7,19,9,21],[15,19,17,21],[1,23,23,24]]},{"id":49,"stageVariantReferences":2,"occupiedCells":140,"rectangles":[[0,0,1,24],[1,0,7,1],[7,0,9,4],[9,0,15,1],[15,0,17,4],[17,0,23,1],[23,0,24,24],[1,7,4,9],[20,7,23,9],[1,15,4,17],[20,15,23,17],[7,20,9,24],[15,20,17,24],[1,23,7,24],[9,23,15,24],[17,23,23,24]]},{"id":50,"stageVariantReferences":2,"occupiedCells":124,"rectangles":[[0,0,1,24],[1,0,7,1],[7,0,8,5],[8,0,16,1],[16,0,17,5],[17,0,23,1],[23,0,24,24],[1,7,5,8],[19,7,23,8],[1,16,5,17],[19,16,23,17],[7,19,8,24],[16,19,17,24],[1,23,7,24],[8,23,16,24],[17,23,23,24]]},{"id":51,"stageVariantReferences":2,"occupiedCells":76,"rectangles":[[4,0,5,9],[5,0,19,1],[19,0,20,9],[5,9,6,10],[18,9,19,10],[6,10,7,11],[17,10,18,11],[7,11,8,13],[16,11,17,13],[6,13,7,14],[17,13,18,14],[5,14,6,15],[18,14,19,15],[4,15,5,24],[19,15,20,24],[5,23,19,24]]},{"id":52,"stageVariantReferences":2,"occupiedCells":76,"rectangles":[[0,4,1,20],[1,4,9,5],[15,4,23,5],[23,4,24,20],[9,5,10,6],[14,5,15,6],[10,6,11,7],[13,6,14,7],[11,7,13,8],[11,16,13,17],[10,17,11,18],[13,17,14,18],[9,18,10,19],[14,18,15,19],[1,19,9,20],[15,19,23,20]]},{"id":53,"stageVariantReferences":2,"occupiedCells":80,"rectangles":[[6,0,18,1],[5,1,6,2],[18,1,19,2],[4,2,5,22],[19,2,20,22],[11,9,13,15],[5,22,6,23],[18,22,19,23],[6,23,18,24]]},{"id":54,"stageVariantReferences":2,"occupiedCells":80,"rectangles":[[2,4,22,5],[1,5,2,6],[22,5,23,6],[0,6,1,18],[23,6,24,18],[9,11,15,13],[1,18,2,19],[22,18,23,19],[2,19,22,20]]},{"id":55,"stageVariantReferences":0,"occupiedCells":60,"rectangles":[[16,0,23,1],[23,0,24,8],[15,1,16,2],[14,2,15,3],[13,3,14,4],[12,4,13,5],[11,5,12,6],[10,6,11,7],[9,7,10,8],[8,8,9,9],[22,8,23,9],[7,9,8,10],[21,9,22,10],[6,10,7,11],[20,10,21,11],[5,11,6,12],[19,11,20,12],[4,12,5,13],[18,12,19,13],[3,13,4,14],[17,13,18,14],[2,14,3,15],[16,14,17,15],[1,15,2,16],[15,15,16,16],[0,16,1,24],[14,16,15,17],[13,17,14,18],[12,18,13,19],[11,19,12,20],[10,20,11,21],[9,21,10,22],[8,22,9,23],[1,23,8,24]]},{"id":56,"stageVariantReferences":2,"occupiedCells":88,"rectangles":[[0,4,1,20],[1,4,8,5],[8,4,9,8],[15,4,16,8],[16,4,23,5],[23,4,24,20],[9,7,15,8],[8,16,9,20],[9,16,15,17],[15,16,16,20],[1,19,8,20],[16,19,23,20]]},{"id":57,"stageVariantReferences":2,"occupiedCells":88,"rectangles":[[4,0,5,9],[5,0,19,1],[19,0,20,9],[5,8,7,9],[7,8,8,16],[16,8,17,16],[17,8,19,9],[4,15,5,24],[5,15,7,16],[17,15,19,16],[19,15,20,24],[5,23,19,24]]},{"id":58,"stageVariantReferences":4,"occupiedCells":112,"rectangles":[[0,0,1,24],[1,0,8,1],[8,0,9,6],[15,0,16,6],[16,0,23,1],[23,0,24,24],[9,5,15,6],[8,18,9,24],[9,18,15,19],[15,18,16,24],[1,23,8,24],[16,23,23,24]]},{"id":59,"stageVariantReferences":0,"occupiedCells":100,"rectangles":[[5,0,6,6],[6,0,18,1],[18,0,19,6],[0,5,1,19],[1,5,5,6],[19,5,23,6],[23,5,24,19],[11,10,12,13],[12,11,13,14],[13,11,14,12],[10,12,11,13],[1,18,5,19],[5,18,6,24],[18,18,19,24],[19,18,23,19],[6,23,18,24]]},{"id":60,"stageVariantReferences":0,"occupiedCells":128,"rectangles":[[6,1,8,8],[8,1,16,2],[16,1,18,8],[1,6,2,18],[2,6,6,8],[18,6,22,8],[22,6,23,18],[2,16,6,18],[6,16,8,23],[16,16,18,23],[18,16,22,18],[8,22,16,23]]},{"id":61,"stageVariantReferences":2,"occupiedCells":100,"rectangles":[[0,0,1,8],[1,0,7,1],[7,0,8,2],[16,0,17,2],[17,0,23,1],[23,0,24,8],[8,2,9,3],[15,2,16,3],[9,3,11,4],[13,3,15,4],[11,4,13,5],[1,7,2,8],[22,7,23,8],[2,8,3,9],[21,8,22,9],[3,9,4,11],[20,9,21,11],[4,11,5,13],[19,11,20,13],[3,13,4,15],[20,13,21,15],[2,15,3,16],[21,15,22,16],[0,16,1,24],[1,16,2,17],[22,16,23,17],[23,16,24,24],[11,19,13,20],[9,20,11,21],[13,20,15,21],[8,21,9,22],[15,21,16,22],[7,22,8,24],[16,22,17,24],[1,23,7,24],[17,23,23,24]]},{"id":62,"stageVariantReferences":2,"occupiedCells":92,"rectangles":[[1,1,2,9],[2,1,8,2],[8,1,9,3],[15,1,16,3],[16,1,22,2],[22,1,23,9],[9,3,10,4],[14,3,15,4],[10,4,11,5],[13,4,14,5],[11,5,13,6],[2,8,3,9],[21,8,22,9],[3,9,4,10],[20,9,21,10],[4,10,5,11],[19,10,20,11],[5,11,6,13],[18,11,19,13],[4,13,5,14],[19,13,20,14],[3,14,4,15],[20,14,21,15],[1,15,2,23],[2,15,3,16],[21,15,22,16],[22,15,23,23],[11,18,13,19],[10,19,11,20],[13,19,14,20],[9,20,10,21],[14,20,15,21],[8,21,9,23],[15,21,16,23],[2,22,8,23],[16,22,22,23]]},{"id":63,"stageVariantReferences":1,"occupiedCells":60,"rectangles":[[7,1,17,2],[6,2,7,3],[17,2,18,3],[5,3,6,4],[18,3,19,4],[4,4,5,5],[19,4,20,5],[3,5,4,6],[20,5,21,6],[2,6,3,7],[21,6,22,7],[1,7,2,17],[22,7,23,17],[2,17,3,18],[21,17,22,18],[3,18,4,19],[20,18,21,19],[4,19,5,20],[19,19,20,20],[5,20,6,21],[18,20,19,21],[6,21,7,22],[17,21,18,22],[7,22,17,23]]},{"id":64,"stageVariantReferences":1,"occupiedCells":84,"rectangles":[[3,3,4,11],[4,3,9,4],[9,3,11,5],[13,3,15,5],[15,3,20,4],[20,3,21,11],[11,4,13,5],[4,9,5,15],[19,9,20,15],[3,13,4,21],[20,13,21,21],[9,19,11,21],[11,19,13,20],[13,19,15,21],[4,20,9,21],[15,20,20,21]]},{"id":65,"stageVariantReferences":1,"occupiedCells":60,"rectangles":[[5,3,19,4],[4,4,5,5],[19,4,20,5],[3,5,4,19],[20,5,21,19],[4,19,5,20],[19,19,20,20],[5,20,19,21]]},{"id":66,"stageVariantReferences":1,"occupiedCells":72,"rectangles":[[5,3,10,4],[10,3,11,5],[13,3,14,5],[14,3,19,4],[4,4,5,5],[19,4,20,5],[3,5,4,11],[11,5,13,6],[20,5,21,11],[4,10,5,11],[19,10,20,11],[5,11,6,13],[11,11,13,13],[18,11,19,13],[3,13,4,19],[4,13,5,14],[19,13,20,14],[20,13,21,19],[11,18,13,19],[4,19,5,20],[10,19,11,21],[13,19,14,21],[19,19,20,20],[5,20,10,21],[14,20,19,21]]},{"id":67,"stageVariantReferences":2,"occupiedCells":136,"rectangles":[[0,2,1,5],[3,2,5,5],[7,2,9,5],[11,2,13,5],[15,2,17,5],[19,2,21,5],[23,2,24,5],[0,7,1,17],[1,7,23,8],[23,7,24,17],[1,16,23,17],[0,19,1,22],[3,19,5,22],[7,19,9,22],[11,19,13,22],[15,19,17,22],[19,19,21,22],[23,19,24,22]]},{"id":68,"stageVariantReferences":2,"occupiedCells":136,"rectangles":[[2,0,5,1],[7,0,8,24],[8,0,16,1],[16,0,17,24],[19,0,22,1],[2,3,5,5],[19,3,22,5],[2,7,5,9],[19,7,22,9],[2,11,5,13],[19,11,22,13],[2,15,5,17],[19,15,22,17],[2,19,5,21],[19,19,22,21],[2,23,5,24],[8,23,16,24],[19,23,22,24]]},{"id":69,"stageVariantReferences":2,"occupiedCells":52,"rectangles":[[5,5,6,19],[6,5,18,6],[18,5,19,19],[6,18,18,19]]},{"id":70,"stageVariantReferences":2,"occupiedCells":44,"rectangles":[[7,5,17,6],[6,6,7,7],[17,6,18,7],[5,7,6,17],[18,7,19,17],[6,17,7,18],[17,17,18,18],[7,18,17,19]]},{"id":71,"stageVariantReferences":2,"occupiedCells":62,"rectangles":[[14,1,22,2],[22,1,23,10],[13,2,14,3],[12,3,13,4],[11,4,12,5],[10,5,11,6],[9,6,10,7],[8,7,9,8],[7,8,8,9],[6,9,7,10],[5,10,6,11],[13,10,14,11],[21,10,22,11],[4,11,5,12],[12,11,13,12],[20,11,21,12],[3,12,4,13],[11,12,12,13],[19,12,20,13],[2,13,3,14],[10,13,11,14],[18,13,19,14],[1,14,2,23],[17,14,18,15],[16,15,17,16],[15,16,16,17],[14,17,15,18],[13,18,14,19],[12,19,13,20],[11,20,12,21],[10,21,11,22],[2,22,10,23]]},{"id":72,"stageVariantReferences":2,"occupiedCells":62,"rectangles":[[1,1,2,10],[2,1,10,2],[10,2,11,3],[11,3,12,4],[12,4,13,5],[13,5,14,6],[14,6,15,7],[15,7,16,8],[16,8,17,9],[17,9,18,10],[2,10,3,11],[10,10,11,11],[18,10,19,11],[3,11,4,12],[11,11,12,12],[19,11,20,12],[4,12,5,13],[12,12,13,13],[20,12,21,13],[5,13,6,14],[13,13,14,14],[21,13,22,14],[6,14,7,15],[22,14,23,23],[7,15,8,16],[8,16,9,17],[9,17,10,18],[10,18,11,19],[11,19,12,20],[12,20,13,21],[13,21,14,22],[14,22,22,23]]},{"id":73,"stageVariantReferences":2,"occupiedCells":128,"rectangles":[[7,0,8,5],[8,0,16,1],[16,0,17,5],[0,4,1,20],[1,4,3,5],[3,4,4,6],[4,4,6,5],[6,4,7,6],[17,4,18,6],[18,4,20,5],[20,4,21,6],[21,4,23,5],[23,4,24,20],[2,6,3,7],[5,6,6,7],[18,6,19,7],[21,6,22,7],[1,7,2,8],[4,7,5,8],[19,7,20,8],[22,7,23,8],[3,8,4,9],[20,8,21,9],[2,9,3,10],[21,9,22,10],[1,10,2,11],[22,10,23,11],[1,13,2,14],[22,13,23,14],[2,14,3,15],[21,14,22,15],[3,15,4,16],[20,15,21,16],[1,16,2,17],[4,16,5,17],[19,16,20,17],[22,16,23,17],[2,17,3,18],[5,17,6,18],[18,17,19,18],[21,17,22,18],[3,18,4,20],[6,18,7,20],[17,18,18,20],[20,18,21,20],[1,19,3,20],[4,19,6,20],[7,19,8,24],[16,19,17,24],[18,19,20,20],[21,19,23,20],[8,23,16,24]]},{"id":74,"stageVariantReferences":2,"occupiedCells":128,"rectangles":[[4,0,20,1],[4,1,5,3],[7,1,8,2],[10,1,11,2],[13,1,14,2],[16,1,17,2],[19,1,20,3],[6,2,7,3],[9,2,10,3],[14,2,15,3],[17,2,18,3],[4,3,6,4],[8,3,9,4],[15,3,16,4],[18,3,20,4],[4,4,5,6],[7,4,8,5],[16,4,17,5],[19,4,20,6],[6,5,7,6],[17,5,18,6],[4,6,6,7],[18,6,20,7],[0,7,5,8],[19,7,24,8],[0,8,1,16],[23,8,24,16],[0,16,5,17],[19,16,24,17],[4,17,6,18],[18,17,20,18],[4,18,5,20],[6,18,7,19],[17,18,18,19],[19,18,20,20],[7,19,8,20],[16,19,17,20],[4,20,6,21],[8,20,9,21],[15,20,16,21],[18,20,20,21],[4,21,5,23],[6,21,7,22],[9,21,10,22],[14,21,15,22],[17,21,18,22],[19,21,20,23],[7,22,8,23],[10,22,11,23],[13,22,14,23],[16,22,17,23],[4,23,20,24]]},{"id":75,"stageVariantReferences":2,"occupiedCells":184,"rectangles":[[1,1,2,5],[2,1,4,2],[4,1,5,5],[7,1,8,5],[8,1,10,2],[10,1,11,5],[13,1,14,5],[14,1,16,2],[16,1,17,5],[19,1,20,5],[20,1,22,2],[22,1,23,5],[2,4,4,5],[8,4,10,5],[14,4,16,5],[20,4,22,5],[1,7,2,11],[2,7,4,8],[4,7,5,11],[7,7,8,11],[8,7,10,8],[10,7,11,11],[13,7,14,11],[14,7,16,8],[16,7,17,11],[19,7,20,11],[20,7,22,8],[22,7,23,11],[2,10,4,11],[8,10,10,11],[14,10,16,11],[20,10,22,11],[1,13,2,17],[2,13,4,14],[4,13,5,17],[7,13,8,17],[8,13,10,14],[10,13,11,17],[13,13,14,24],[14,13,23,14],[23,13,24,24],[2,16,4,17],[8,16,10,17],[1,19,2,23],[2,19,4,20],[4,19,5,23],[7,19,8,23],[8,19,10,20],[10,19,11,23],[2,22,4,23],[8,22,10,23],[14,23,23,24]]},{"id":76,"stageVariantReferences":2,"occupiedCells":184,"rectangles":[[0,0,1,11],[1,0,10,1],[10,0,11,11],[13,1,14,5],[14,1,16,2],[16,1,17,5],[19,1,20,5],[20,1,22,2],[22,1,23,5],[14,4,16,5],[20,4,22,5],[13,7,14,11],[14,7,16,8],[16,7,17,11],[19,7,20,11],[20,7,22,8],[22,7,23,11],[1,10,10,11],[14,10,16,11],[20,10,22,11],[1,13,2,17],[2,13,4,14],[4,13,5,17],[7,13,8,17],[8,13,10,14],[10,13,11,17],[13,13,14,17],[14,13,16,14],[16,13,17,17],[19,13,20,17],[20,13,22,14],[22,13,23,17],[2,16,4,17],[8,16,10,17],[14,16,16,17],[20,16,22,17],[1,19,2,23],[2,19,4,20],[4,19,5,23],[7,19,8,23],[8,19,10,20],[10,19,11,23],[13,19,14,23],[14,19,16,20],[16,19,17,23],[19,19,20,23],[20,19,22,20],[22,19,23,23],[2,22,4,23],[8,22,10,23],[14,22,16,23],[20,22,22,23]]},{"id":77,"stageVariantReferences":0,"occupiedCells":58,"rectangles":[[6,4,18,5],[5,5,6,6],[11,5,12,8],[18,5,19,6],[4,6,5,18],[19,6,20,18],[12,16,13,19],[5,18,6,19],[18,18,19,19],[6,19,18,20]]},{"id":78,"stageVariantReferences":0,"occupiedCells":80,"rectangles":[[3,3,4,21],[4,3,12,4],[12,3,13,7],[13,3,20,4],[20,3,21,21],[4,11,7,12],[17,12,20,13],[11,17,12,21],[4,20,11,21],[12,20,20,21]]},{"id":79,"stageVariantReferences":0,"occupiedCells":92,"rectangles":[[4,2,9,3],[9,2,11,6],[11,2,20,3],[3,3,4,4],[20,3,21,4],[2,4,3,20],[21,4,22,20],[18,9,21,11],[3,13,6,15],[13,18,15,22],[3,20,4,21],[20,20,21,21],[4,21,13,22],[15,21,20,22]]},{"id":80,"stageVariantReferences":0,"occupiedCells":92,"rectangles":[[3,3,4,11],[4,3,10,4],[10,3,11,7],[13,3,14,7],[14,3,20,4],[20,3,21,11],[11,6,13,7],[4,10,6,11],[6,10,7,14],[17,10,18,14],[18,10,20,11],[3,13,4,21],[4,13,6,14],[18,13,20,14],[20,13,21,21],[10,17,11,21],[11,17,13,18],[13,17,14,21],[4,20,10,21],[14,20,20,21]]},{"id":81,"stageVariantReferences":2,"occupiedCells":96,"rectangles":[[0,5,24,6],[0,6,1,18],[7,6,9,9],[15,6,17,9],[23,6,24,18],[7,15,9,18],[15,15,17,18],[0,18,24,19]]},{"id":82,"stageVariantReferences":2,"occupiedCells":96,"rectangles":[[5,0,6,24],[6,0,18,1],[18,0,19,24],[6,7,9,9],[15,7,18,9],[6,15,9,17],[15,15,18,17],[6,23,18,24]]},{"id":83,"stageVariantReferences":0,"occupiedCells":76,"rectangles":[[6,2,7,7],[7,2,17,3],[17,2,18,7],[2,6,3,18],[3,6,6,7],[18,6,21,7],[21,6,22,18],[3,17,6,18],[6,17,7,22],[17,17,18,22],[18,17,21,18],[7,21,17,22]]},{"id":84,"stageVariantReferences":0,"occupiedCells":116,"rectangles":[[3,3,4,7],[4,3,6,4],[6,3,7,7],[8,3,9,9],[9,3,15,4],[15,3,16,9],[17,3,18,7],[18,3,20,4],[20,3,21,7],[4,6,6,7],[18,6,20,7],[3,8,4,16],[4,8,8,9],[16,8,20,9],[20,8,21,16],[4,15,8,16],[8,15,9,21],[15,15,16,21],[16,15,20,16],[3,17,4,21],[4,17,6,18],[6,17,7,21],[17,17,18,21],[18,17,20,18],[20,17,21,21],[4,20,6,21],[9,20,15,21],[18,20,20,21]]},{"id":85,"stageVariantReferences":2,"occupiedCells":92,"rectangles":[[6,0,7,11],[7,0,13,1],[13,0,14,7],[14,6,23,7],[23,6,24,14],[0,10,1,18],[1,10,6,11],[17,13,18,24],[18,13,23,14],[1,17,10,18],[10,17,11,24],[11,23,17,24]]},{"id":86,"stageVariantReferences":2,"occupiedCells":92,"rectangles":[[11,0,12,6],[12,0,18,1],[18,0,19,12],[0,5,1,13],[1,5,11,6],[19,11,23,12],[23,11,24,19],[1,12,5,13],[5,12,6,24],[12,18,13,24],[13,18,23,19],[6,23,12,24]]},{"id":87,"stageVariantReferences":0,"occupiedCells":124,"rectangles":[[1,1,2,10],[2,1,9,2],[9,1,10,4],[14,1,15,4],[15,1,22,2],[22,1,23,10],[10,3,11,4],[11,3,13,7],[13,3,14,4],[2,9,3,10],[3,9,4,15],[20,9,21,15],[21,9,22,10],[4,11,7,13],[17,11,20,13],[1,14,2,23],[2,14,3,15],[21,14,22,15],[22,14,23,23],[11,17,13,21],[9,20,10,23],[10,20,11,21],[13,20,14,21],[14,20,15,23],[2,22,9,23],[15,22,22,23]]},{"id":88,"stageVariantReferences":2,"occupiedCells":92,"rectangles":[[7,0,8,8],[8,0,16,1],[16,0,17,8],[0,7,1,17],[1,7,7,8],[17,7,23,8],[23,7,24,17],[1,16,7,17],[7,16,8,24],[16,16,17,24],[17,16,23,17],[8,23,16,24]]},{"id":89,"stageVariantReferences":2,"occupiedCells":84,"rectangles":[[8,1,9,9],[9,1,15,2],[15,1,16,9],[1,8,2,16],[2,8,8,9],[16,8,22,9],[22,8,23,16],[2,15,8,16],[8,15,9,23],[15,15,16,23],[16,15,22,16],[9,22,15,23]]},{"id":90,"stageVariantReferences":4,"occupiedCells":112,"rectangles":[[7,1,8,8],[8,1,16,2],[16,1,17,8],[6,2,7,3],[17,2,18,3],[5,3,6,4],[18,3,19,4],[4,4,5,5],[19,4,20,5],[3,5,4,6],[6,5,7,6],[17,5,18,6],[20,5,21,6],[2,6,3,8],[5,6,6,8],[18,6,19,8],[21,6,22,8],[1,7,2,17],[3,7,5,8],[6,7,7,8],[17,7,18,8],[19,7,21,8],[22,7,23,17],[2,16,3,18],[3,16,5,17],[5,16,6,18],[6,16,7,17],[7,16,8,23],[16,16,17,23],[17,16,18,17],[18,16,19,18],[19,16,21,17],[21,16,22,18],[3,18,4,19],[6,18,7,19],[17,18,18,19],[20,18,21,19],[4,19,5,20],[19,19,20,20],[5,20,6,21],[18,20,19,21],[6,21,7,22],[17,21,18,22],[8,22,16,23]]}]};
},
"experiments/r77-native-q3-entities/q3-entities.cjs":function(module,exports,require){
'use strict';
const Common=require('../r75-procedural-geometry/entity-update.cjs');
const H=require('../r75-procedural-geometry/entity-posthooks.cjs');
const Bounds=require('../r75-procedural-geometry/entity-bounds.cjs');
const Masks=require('../r77-native-mask-geometry/mask-geometry.cjs');
const {add,integer,NativeArrayFault,UnsupportedEntityPath}=H;
function moveQ3(entity,{r,viewOrientation,maskCell}){
 integer(r,'u.r');
 const effects=[];
 entity.n=add(entity.n,entity.e);
 if(r===0&&H.maskEntityCollision(entity,viewOrientation,maskCell)){
  entity.e=-entity.e|0;entity.n=add(entity.n,entity.e);
  effects.push({kind:'mask-axis-bounce',axis:'x',raw:'0x3f57e'});
 }
 entity.o=add(entity.o,entity.f);
 if(r===0&&H.maskEntityCollision(entity,viewOrientation,maskCell)){
  entity.f=-entity.f|0;entity.o=add(entity.o,entity.f);
  effects.push({kind:'mask-axis-bounce',axis:'y',raw:'0x3f50c'});
 }
 return effects;
}
function stepQ3Entities(state,{rngA,nextIntA,maskId,viewOrientation=state.actor?.orientation,maskCell,boundsAdjust=Bounds.createBoundsAdjust(nextIntA)}={}){
 const {slots,geometry,actor,controller}=state;
 if(!Array.isArray(slots))throw new TypeError('explicit fixed entity slots required');
 for(const [object,keys] of [[geometry,['N','position']],[actor,['height','direction']],[controller,['q','r','s']]])for(const key of keys)integer(object?.[key],key);
 if(controller.q!==3)throw new UnsupportedEntityPath('q3 entity module requires q=3; boss99 separate');
 if(!Number.isInteger(viewOrientation)||viewOrientation<0||viewOrientation>3)throw new UnsupportedEntityPath('explicit actor orientation e.t 0..3 required');
 const reader=maskCell===undefined?Masks.bindMask(maskId):maskCell;
 if(typeof reader!=='function')throw new TypeError('maskCell callback required');
 if(typeof boundsAdjust!=='function')throw new TypeError('boundsAdjust required');
 const effects=[],rngTrace=[];let currentIndex=-1;
 const tracedRng=bound=>{if(typeof rngA!=='function')throw new TypeError('explicit rngA required');const value=rngA(bound);rngTrace.push({index:currentIndex,requestedBound:bound,value});return value;};
 try{
  for(let index=0;index<slots.length;index++){
   currentIndex=index;const entity=slots[index];if(entity===null)continue;
   if(entity.a===0){slots[index]=null;effects.push({kind:'remove-inactive',index});continue;}
   if(!Common.advanceCommon(entity,index,state,tracedRng)){effects.push({kind:'stationary-type',index,type:entity.a});continue;}
   effects.push(...moveQ3(entity,{r:controller.r,viewOrientation,maskCell:reader}).map(e=>({...e,index})));
   if(controller.r<=1){
    const extra=boundsAdjust(index,0,state);
    if(Array.isArray(extra))effects.push(...extra.map(e=>({...e,index})));
   }else{
    // Native mode -1: each axis wraps independently; mode -2 deletion is unreachable here.
    for(const axis of ['n','o'])if(entity[axis]<0||entity[axis]>=384){
     const before=entity[axis];entity[axis]=Common.nativeWrap(before,384);
     effects.push({kind:'wrap',axis,before,after:entity[axis],index,raw:axis==='n'?'0x3f00c':'0x3f0aa'});
    }
   }
   effects.push({kind:'updated',index,type:entity.a});
  }
 }catch(error){
  if(!(error instanceof NativeArrayFault))throw error;
  return {slots,effects,rngTrace,abortedByNativeException:{type:'java/lang/Exception',index:currentIndex,field:error.field,arrayIndex:error.index},originalRuntimeFullEquivalence:false};
 }
 return {slots,effects,rngTrace,abortedByNativeException:null,originalRuntimeFullEquivalence:false};
}
function createMaskPosthooks(maskId,viewOrientation){
 const maskCell=Masks.bindMask(maskId);
 return {maskCell,collides:entity=>H.maskEntityCollision(entity,viewOrientation,maskCell),posthookV:(slots,rngA)=>H.posthookV(slots,{viewOrientation,maskCell},rngA)};
}
module.exports=Object.freeze({moveQ3,stepQ3Entities,createMaskPosthooks});

},
"experiments/r77-native-q3-frame-own/q3-frame.cjs":function(module,exports,require){
'use strict';
// Reached candidate u.E continuation, not a scheduler or native boot constructor.
const Q=require('../../evidence/r75-research/collision-native/q3-adapter.cjs');
const B=require('../../evidence/r75-research/collision-native/boundary-transition.cjs');
const C=require('../../evidence/r75-research/collision-native/collision_adapter.cjs');
const Air=require('../../evidence/r75-research/collision-native/airborne_adapter.cjs');
const I=require('../r76-native-input/q3-input-action.cjs');
const Actor=require('../r77-native-actor-state/actor-state.cjs');
const T=require('../r77-native-trajectories/trajectories.cjs');
const Mask=require('../r77-native-mask-geometry/mask-geometry.cjs');
const R=require('../r75-procedural-geometry/native-rng.cjs');
const copy=x=>structuredClone(x),add=(a,b)=>(a+b)|0,sub=(a,b)=>(a-b)|0;
function int(v,n){if(!Number.isInteger(v)||v< -2147483648||v>2147483647)throw new TypeError(n+' requires int32');return v;}
function current(s){return s.game.pool.objects[s.game.pool.currentIndex];}
function probe(c,x,direction){
 const column=direction===0?Math.min(Math.trunc(add(x,15)/16),22):Math.max(Math.trunc(x/16),1);
 const next=column+(direction===0?1:-1);
 for(const i of [column,next])if(i<0||i>=c.length)throw new RangeError('q3 direct c['+i+'] array read');
 const delta=sub(int(c[next],'next height'),int(c[column],'current height'));
 return{wall:delta>96||c[next]===-1,column,next,delta};
}
function continueActor(input,options={}){return execute(input,options,false);}
function resumeRelocation(input,options={}){return execute(input,options,true);}
function execute(input,options,resume){
 let s=copy(input);const effects=[],trace=[];
 const out=(supported=true,reason='q3-actor-contact-complete',continuation='u.E-tail')=>({supported,state:s,effects,trace,reason,continuation,
  originalRuntimeFullEquivalence:false,originalPayloadIncluded:false,scope:'q3/u.p0 reached actor phase; no prelude, terrain phase or entity tail'});
 const stop=(reason,continuation={kind:'unresolved-native-continuation'})=>out(false,reason,continuation);
 const mark=(phase,raw,detail={})=>trace.push({phase,raw,...detail});
 if(s.game?.stage?.behaviorCode!==3||s.game.controller.modeP!==0)return stop('requires-q3-and-modeP0');
 if(s.game.pendingEffects?.length)return stop('prior-pending-effects-require-resolution');
 const pool=s.game.pool;
 if(!Array.isArray(pool.objects)||pool.objects.length!==4||pool.objects.some(x=>!x||x.geometry.activeLength!==24))return stop('requires-fixed24-four-side-ring');
 if(![0,1].includes(pool.direction))return stop('direction-outside0..1');
 if(!Array.isArray(s.entities))return stop('explicit-entity-slots-required');
 const rows=T.generatedRows();
 const setter=request=>{const r=Actor.setActorState(s,request,options.actorProviders);s=r.state;effects.push(...r.effects);trace.push(...r.trace);return r;};
 let random=R.Java48Random.fromState(BigInt(s.game.rng.A));
 const draw=bound=>{const value=random.bounded(bound);s.game.rng.A=random.state.toString();mark('rng-A','native-i.a',{bound,value});return value;};
 const music=raw=>effects.push({kind:'music-reselect',raw,nativeMethod:'u.()V+c',callContext:{uiState:s.uiState,pendingUiState:s.pendingUiState,timerT:s.r.timerT,lives:s.u.lives,behaviorCode:3,stageMusicIndex:s.u.ax}});
 const toBoundary=()=>({pool:s.game.pool,actor:{...s.game.actor,state:s.game.actor.actorState,direction:s.game.pool.direction,n:s.game.actor.angleN,s:int(s.game.actor.s,'actor.s')},
  controller:{q:3,modeP:0,tutorial:s.r.tutorial,tutorialStage:s.r.timerT,timerS:s.u.s,scoreU:s.u.score,aj:s.game.stage.primitive,ak:s.map?.ak??0,az:s.map?.az??0,aF:s.u.aF,D:s.u.D},
  mission:{credit:s.r.credit},entities:s.entities.map(e=>e===null?null:{...e,bridgeScalarC:e.c,bridgeScalarD:e.d,c:e.cArray,d:e.dArray})});
 const fromBoundary=b=>{
  s.game.pool=copy(b.pool);const {state,direction,n,...a}=b.actor;
  s.game.actor={...s.game.actor,...a,actorState:state,angleN:n};s.game.pool.direction=direction;
  s.entities=b.entities.map(e=>{if(e===null)return null;const {c,d,bridgeScalarC,bridgeScalarD,...rest}=e;
   return{...rest,c:bridgeScalarC,d:bridgeScalarD,cArray:c,dArray:d};});
  s.u.s=b.controller.timerS;s.u.aF=b.controller.aF;s.u.D=b.controller.D;s.r.credit=b.mission.credit;s.game.rng.A=random.state.toString();
 };
 const generator=iterator=>{
  let item=iterator.next();
  while(!item.done){
   const e=item.value;fromBoundary(e.state);mark('boundary-'+e.operation,e.raw);
   if(e.operation==='request-state'){const r=setter(e.requested);if(!r.supported)return r;}
   else if(e.operation==='configure-cells'){
    if(typeof options.configureCells!=='function')return{supported:false,reason:'boundary-cell-configuration-required'};
    const r=options.configureCells(s);if(!r?.supported||!r.state)return{supported:false,reason:r?.reason||'boundary-cell-configuration-blocked'};
    s=r.state;effects.push(...r.effects||[]);trace.push(...r.trace||[]);
    random=R.Java48Random.fromState(BigInt(s.game.rng.A));
   }else return{supported:false,reason:'unhandled-boundary-operation:'+e.operation};
   Object.assign(e.state,toBoundary());item=iterator.next({handled:true});
  }
  fromBoundary(item.value.state);trace.push(...item.value.state.trace.map(e=>({phase:'boundary-native',...e})));
  return item.value;
 };
 let previousX;
 try{
  if(resume){
   if(s.q3Continuation?.kind!=='relocation-search')return stop('no-relocation-search-to-resume');
   previousX=s.q3Continuation.previousX;return relocation();
  }
  if(s.q3Continuation)return stop('use-resumeRelocation-before-starting-another-actor-phase');
  mark('q3-input-entry','0x41c9c');
  const a=s.game.actor,c=current(s);
  const selected=I.evaluateQ3BufferedAction({buffer:s.u.buffer,modeP:0,q:3,x:c.position,N:24,direction:pool.direction,
   actor:{...a,state:a.actorState,...s.action},actionLock:s.u.actionLock,tutorial:s.r.tutorial,columns:c.geometry.columns,
   targets:options.targets??s.entities,frameRows:rows});
  if(!selected.supported)return stop(selected.reason);
  s.u.buffer=selected.buffer;s.action.requested=selected.actor.requested;s.action.targetIds=selected.actor.targetIds.slice();
  mark('q3-input-selection','0x47ce0..48404/0x41ddc',{reason:selected.reason,scan:selected.scan});
  for(const e of selected.effects){
   if(e.op==='request-state'){const r=setter(e.requested);if(!r.supported)return stop(r.reason);}
   else if(e.op==='caught-native-array-error-diagnostic')effects.push(e);
   // knownActionSetter's resource placeholders are replaced by the full setter.
  }
  if(s.game.actor.actorState===11){mark('state11-skip','0x41f78..41f7c');return out(true,'state11-skips-movement-contact');}
  previousX=current(s).position;s.u.aB=previousX;mark('capture-pre-movement-x','0x41f9a',{previousX});
  let amount=0;const now=s.game.actor,dir=s.game.pool.direction;
  if([13,16].includes(now.actorState)||now.special){
   if(dir===0?previousX>23:previousX<=344)amount=s.r.tutorial?-6:-3;
  }else if(now.actorState!==14){
   const p=probe(current(s).geometry.columns.c,previousX,dir);mark('q3-movement-wall-probe','0x456e4..45896',p);
   if(!p.wall)amount=int(s.action.speed,'action.speed');
  }
  current(s).position=Q.tangentMove({x:previousX,direction:dir,amount,modeM:pool.shape.m,modeN:pool.n,length:24});
  mark('tangent-movement','0x42002..42058/0x457a2',{amount,before:previousX,after:current(s).position});
  const boundary=Q.classifyBoundary({c:current(s).geometry.columns.c,x:current(s).position,height:s.game.actor.height,direction:dir});
  mark('q3-boundary-classification','0x44d6e/0x453c0',boundary);
  if(boundary.kind==='relocation'){
   if(s.game.actor.actorState===13)music('0x453ba');
   const prepared=B.beginRelocation(toBoundary());fromBoundary(prepared);
   const mask=options.maskCell??Mask.bindMask(s.map?.ae);
   s.q3Continuation={kind:'relocation-search',prepared,margins:Q.relocationMargins(mask),previousX,attempts:0};
   mark('relocation-world-transform-once','0x44df8');return relocation();
  }
  if(boundary.kind==='wall'){
   const a=s.game.actor;
   if(a.actorState===12&&a.k===1){const r=generator(B.completedBoundary(toBoundary(),{rng:draw}));if(!r.supported)return stop(r.reason);}
   else if(a.actorState!==12&&![13,16].includes(a.actorState)){
    if(a.p!==0){const r=setter(12);if(!r.supported)return stop(r.reason);}
    else{
     if(a.verticalActive)a.special=true;
     effects.push({kind:'audio-cue-request',role:'boundary-impact',raw:'0x4462e'});
     const r=setter(13);if(!r.supported)return stop(r.reason);
     if(s.r.slot!==100&&s.r.slot===s.r.frontier-1){
      if(typeof options.actorProviders?.clockHour!=='function')return stop('boundary-credit-clock-hour-required');
      const hour=int(options.actorProviders.clockHour({state:s,raw:'0x44674'}),'hour');
      if(hour<0||hour>23)return stop('clock-hour-outside0..23');s.u.hourA=hour;
      if(s.r.conditionType===14||s.r.conditionType===15&&hour>11||s.r.conditionType===16&&hour<=11)s.r.credit=add(s.r.credit,1);
      mark('boundary-credit','0x4463c..44760',{hour});
     }
    }
   }
  }
  if(s.game.actor.o===1){const r=setter(0);if(!r.supported)return stop(r.reason);}
  mark('precontact-reset-check','0x420f6..42104');return contact();
 }catch(error){
  if(!(error instanceof RangeError))throw error;
  return stop('native-array-or-domain-exception:'+error.message,{kind:'native-exception-unresolved'});
 }
 function relocation(){
  const cp=s.q3Continuation,mask=options.maskCell??Mask.bindMask(s.map?.ae),budget=options.relocationAttemptBudget??1024;
  if(!Number.isInteger(budget)||budget<1||budget>100000)throw new RangeError('authored relocation work budget requires1..100000');
  for(let i=0;i<budget;i++){
   const attempt=Q.relocationAttempt({mask,rng:draw,margins:cp.margins,oldWorld:cp.prepared.relocationOrigin,currentOrientation:cp.prepared.actor.orientation});
   cp.attempts++;mark('relocation-attempt','0x44efc..451c8',{attempt:cp.attempts,accepted:attempt.accepted,reason:attempt.reason,draws:attempt.draws});
   if(!attempt.accepted)continue;
   const r=generator(B.finishRelocation(cp.prepared,attempt,cp.margins));if(!r.supported)return stop(r.reason);
   delete s.q3Continuation;mark('relocation-skips-o-reset','0x451ce -> 0x4210a',{x:current(s).position,height:s.game.actor.height});return contact();
  }
  return stop('authored-relocation-work-budget-yield',{kind:'q3-relocation-search',resume:'resumeRelocation',raw:'0x44efc',authoredWorkBudget:budget});
 }
 function contact(){
  const a=s.game.actor,c=current(s);let result=Q.columnStep({geometry:c.geometry.columns,previousX,x:c.position,direction:s.game.pool.direction,
   actor:{...a,state:a.actorState},frameRow:rows[a.actorState]});
  if(!result.supported&&result.reason==='prior-column-direct-array-exception-unresolved'){
   // The native read is bounded by physical capacity, not logical24. Do not
   // clamp the old column or treat an allocated inactive tail as an exception.
   if(result.previous<0||result.previous>=c.geometry.columns.c.length){
    effects.push({kind:'native-caught-array-diagnostic',exception:'java/lang/ArrayIndexOutOfBoundsException',index:result.previous,
     readRaw:'0x44304',checkpoint:6714,catchRecordRaw:'0x67164',handlerState:7560,handlerRaw:'0x4916e..491de',resumeRaw:'0x4248c',diagnosticText:'semantic-only'});
    mark('contact-array-catch-preserves-prior-writes','0x44304 -> 0x4916e -> 0x4248c');
    return out(true,'q3-contact-array-exception-caught');
   }
   const sample=C.ordinaryTerrainSample(c.geometry.columns,previousX,c.position,s.game.pool.direction);
   const delta=C.animationDelta(a.actorState,a.frame,a.verticalActive,a.height,sample.floor,rows[a.actorState]);
   const post={...a,state:a.actorState,height:add(a.height,delta)};
   result={supported:true,branch:'q3-physical-tail-column-contact',sample,vertical:{before:a.height,delta,after:post.height},
    contact:post.verticalActive?Air.resolveAirborneContact({q:0,modeP:0,actor:post,sample,delta,previousX}):C.groundedContact(sample,post.height,post.p)};
  }
  if(!result.supported)return stop(result.reason);
  mark('q3-contact','0x4210a..42488/0x443f4..444f2',{branch:result.branch,sample:result.sample});
  if(result.branch==='q3-outside-column-no-terrain-contact'){a.height=result.height;return out();}
  a.height=result.vertical.after;
  if(a.verticalActive){
   // Preserve ordered projection/reset/rewind effects: setters can reject midstream.
   for(const e of result.contact.effects){
    if(e.op==='add-height')s.game.actor.height=add(s.game.actor.height,e.delta);
    else if(e.op==='rewind-tangent')current(s).position=e.value;
    else if(e.op==='resource-cue-request')effects.push({...e,kind:'audio-cue-request'});
    else if(e.op==='request-state'){const r=setter(e.state);if(!r.supported)return stop(r.reason);}
    else return stop('unknown-airborne-contact-effect:'+e.op);
   }
  }else{
   const sample=result.sample,ground=result.contact;
   if(ground.requestsState!==null){
    effects.push({kind:'audio-cue-request',role:'terrain-impact',raw:'0x43e18/43dfa/43d94'});
    current(s).position=previousX;const r=setter(ground.requestsState);if(!r.supported)return stop(r.reason);
    // Hit branches return to4247a, skipping projection at42464.
   }else s.game.actor.height=ground.projectedHeight;
   if(sample.upper===-1&&sample.special&&s.game.actor.p===0){
    const hit=C.rectangleContains({originX:current(s).position,originY:s.game.actor.height,pointX:sample.selected*16,
     pointY:c.geometry.columns.c[sample.selected]-8,width:32,height:48,tangentOffset:-2,normalOffset:24,direction:s.game.pool.direction,
     coefficients:{i0:1,j0:0,k0:1,k3:0,l0:0,l3:1}});
    if(hit.inside){effects.push({kind:'audio-cue-request',role:'special-terrain-impact',raw:'0x43cfc'});const r=setter(13);if(!r.supported)return stop(r.reason);}
   }
  }
  mark('tail-entry','0x4248c');return out();
 }
}
module.exports={continueActor,resumeRelocation,probe};

},
"experiments/r77-native-render/actor-renderer.cjs":function(module,exports,require){
'use strict';
// u.I and its numeric presentation wrappers. No original sprite/frame payload.
const int=(v,n)=>{if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new RangeError(n+' requires int32');return v;};
const add=(a,b)=>(a+b)|0,sub=(a,b)=>(a-b)|0,div=(a,b)=>Math.trunc(a/b)|0;
function grayscale(color){int(color,'color');const r=(color>>>16)&255,g=(color>>>8)&255,b=color&255;const v=div(Math.max(r,g,b),3)+div(r,4)+div(g,6)+div(b,12);return v*0x010101;}
function spriteFlags(orientation,direction){int(orientation,'orientation');int(direction,'direction');return orientation===1?(direction===0?36:4):orientation===2?(direction===0?40:36):orientation===3?(direction===0?8:40):(direction===0?4:8);}
function colorFor(s){
 const a=s.game.actor,color=int(s.map.aA,'map.aA'),d=int(a.actorState,'actorState');
 if(d===13||d===16)return grayscale(color);
 if(int(s.u.l,'u.l')>2)return color;
 if(int(s.r.timerT,'r.timerT')>0)return 0xffffff;
 if(d===11)return int(s.r.n,'r.n render counter')%2===0?0xffffff:0x9492ad;
 if(int(a.p,'actor.p')>3&&int(s.r.n,'r.n render counter')%2===0)return grayscale(color===0?0x9492ad:color);
 return color;
}
function alpha(c,raw){c.state.map.drawAlpha=255;c.effects.push({type:'draw-alpha',value:255,raw});}
function emit(c,command){c.state.map.drawCommands??=[];c.state.map.drawCommands.push(command);c.effects.push(command);}
// x/y are already scaled local screen coordinates; r.f/g are added exactly once.
function renderActorAt(c,sample,options={}){
 const s=c.state,a=s.game.actor;
 for(const k of ['resource','x','y','orientation','direction','state','frame'])int(sample[k],'sample.'+k);
 const {resource,direction,state,frame}=sample;
 const variant=int(s.game.controller.modeP,'modeP')>0?div(resource===1?sample.orientation:int(a.angleQ,'actor.angleQ'),90):sample.orientation;
 const origin=options.screenOrigin??{x:s.r.f,y:s.r.g};int(origin.x,'screen origin x');int(origin.y,'screen origin y');
 const x=add(origin.x,sample.x),y=add(origin.y,sample.y),color=colorFor(s),flags=spriteFlags(variant,direction);
 const region={type:'semantic-xor-region',x:sub(x,50),y:sub(y,50),width:100,height:100,color,operation:'xor-fill-then-disable'};
 emit(c,{...region,phase:'before-actor',raw:'0x4ee8a'});
 c.effects.push({type:'ensure-actor-resource',resource,variantOrientation:variant,direction,load:true,presentationOnly:true,raw:'0x4eea8'});
 const draw={type:'semantic-actor-draw',role:sample.role??'actor',resource,state,frame,x,y,orientation:sample.orientation,variantOrientation:variant,direction,flags,color,alpha:s.map.drawAlpha??255,wrapperBoolean:sample.wrapperBoolean,nativeSpriteFrameResolved:false,originalPayloadIncluded:false,raw:'0x4ef20'};
 emit(c,draw);emit(c,{...region,phase:'after-actor',raw:'0x4ef5a'});alpha(c,'0x4ef64');
 c.trace.push({raw:'0x4ed80',operation:'actor-presentation',resource,variantOrientation:variant,state,frame});
 return draw;
}
// u.(IIIIIIIZ)V+a: local surface position -> 384 rotation -> 10/16 scale.
function renderActorLocal(c,sample,options={}){
 const s=c.state,a=s.game.actor,g=s.game.pool.objects[s.game.pool.currentIndex];
 for(const k of ['resource','x','y','orientation','direction','state','frame'])int(sample[k],'sample.'+k);
 const mode=int(s.game.controller.modeP,'modeP');let offsetOrientation=sample.orientation,rotation=sample.orientation,magnitude=11;
 if(mode>0){
  if(sample.resource===1){offsetOrientation=div(sample.orientation,90);rotation=int(a.orientation,'actor.orientation');magnitude=10;}
  else if([0,2,3].includes(sample.resource)){offsetOrientation=div(int(a.angleQ,'actor.angleQ'),90);magnitude=15;}
 }
 const x=add(int(g.scalarE,'g.scalarE'),sample.x),y=add(sub(int(g.scalarF,'g.scalarF'),sample.y),8),normalized=add(rotation,4)%4;
 let rx,ry;
 if(normalized===0){rx=x;ry=y;}else if(normalized===1){rx=y;ry=sub(384,x);}else if(normalized===2){rx=sub(384,x);ry=sub(384,y);}else if(normalized===3){rx=sub(384,y);ry=x;}
 // Native negative remainder falls through without overwriting scratch E/F.
 if(rx!==undefined){s.map.E=rx;s.map.F=ry;}
 let px=div(Math.imul(int(s.map.E,'map.E'),10),16),py=div(Math.imul(int(s.map.F,'map.F'),10),16);
 if(mode>0){if(offsetOrientation===1)px=add(px,magnitude);else if(offsetOrientation===2)py=sub(py,magnitude);else if(offsetOrientation===3)px=sub(px,magnitude);else py=add(py,magnitude);}
 c.trace.push({raw:'0x4ec4c',operation:'actor-transform',rotation,offsetOrientation,magnitude:mode>0?magnitude:0,E:s.map.E,F:s.map.F});
 return renderActorAt(c,{...sample,x:px,y:py},options);
}
function renderActor(c,options={}){
 const s=c.state,a=s.game.actor,p=s.game.pool,g=p.objects[p.currentIndex],resource=int(s.r.actorResourceQ,'r.actorResourceQ');let emitted=0;
 if(resource===1&&int(s.history?.ay,'history.ay')===1){
  const index=int(s.history.aw,'history.aw'),row=s.history.rows?.[index];
  if(index<0||!Array.isArray(row)||row.length<6){const error=new RangeError('native history row index/capacity');error.name='NativeArrayFault';throw error;}
  renderActorLocal(c,{resource:1,x:row[0],y:row[1],orientation:row[2],direction:row[3],state:row[4],frame:row[5],role:'history-actor',wrapperBoolean:true},options);emitted++;
 }
 renderActorLocal(c,{resource:resource===1?0:resource,x:g.position,y:a.height,orientation:a.orientation,direction:p.direction,state:a.actorState,frame:a.frame,role:'current-actor',wrapperBoolean:resource!==1},options);emitted++;
 alpha(c,'0x4f364');return {supported:true,emitted,rngCalls:0,actorCounterWrites:0,graphicsArgument:'nonnull',originalPayloadIncluded:false,nativeSpriteFrameResolved:false};
}
module.exports={renderActor,renderActorAt,renderActorLocal,grayscale,spriteFlags,colorFor};

},
"experiments/r77-native-render/background.cjs":function(module,exports,require){
'use strict';
const P=require('./parameters.cjs');
function background(c,{viewport,parameter=i=>P.paletteByte(c.state.map.t,i),rngA}={}){
 const s=c.state,a=s.game.actor;
 if(!viewport||!['x','y','width','height'].every(k=>Number.isInteger(viewport[k])))throw new TypeError('explicit viewport x/y/width/height required');
 const emit=command=>{const effect={type:'semantic-background',palette:s.map.t,...command};c.effects.push(effect);s.map.drawCommands??=[];s.map.drawCommands.push(effect);};
 const solid=(rgb,raw)=>emit({role:'background-fill',x:viewport.x,y:viewport.y,width:viewport.width,height:viewport.height,rgb,raw});
 if(a.actorState===13&&a.frame===0){solid(0,'0x52e38');return;}
 if(a.actorState===13&&a.frame===1){solid(0xffffff,'0x52dee');return;}
 if(s.r.timerT>0||(a.actorState===11&&s.u.l!==3)){solid(0,'0x5298e');return;}
 const q=s.game.stage.behaviorCode,period=parameter(140);if(period===0)throw new RangeError('native background division by zero');
 const boss=q===99,phase=Math.trunc((boss?(s.u.s+1000)|0:s.u.B)/period),reflect=boss?(phase&1)!==0:phase%2!==0,gray=a.actorState===13||a.actorState===16,count=boss?16:8;
 for(let row=0;row<count;row++)for(let col=0;col<count;col++){
  let sourceX=boss?col>>1:col,sourceY=boss?row>>1:row;if(reflect)sourceX=7-sourceX;
  const folded0=sourceY*8+sourceX,folded=folded0>31?63-folded0:folded0;
  let brightnessDelta=0;if(boss){if(typeof rngA!=='function')throw new TypeError('boss background requires shared RNG A');brightnessDelta=rngA(33)-16;c.trace.push({raw:'0x52ca6',operation:'boss-background-draw',bound:33,brightnessDelta});}
  emit({role:'background-cell',x:viewport.x+col*(boss?15:30),y:viewport.y+row*(boss?15:30),width:boss?15+col%2:30,height:boss?15+row%2:30,colorRole:{sourceX,sourceY,packedPaletteOffset:112+Math.trunc(folded/2),nibble:folded%2===1?'high':'low',grayTransform:gray?'u.k':'none',brightnessDelta,channelOverflowRule:'subtract delta if addition outside0..255'},raw:boss?'0x52d36':gray?'0x52b3a':'0x52a6e'});
 }
}
module.exports={background};

},
"experiments/r77-native-render/capture.cjs":function(module,exports,require){
'use strict';
// Numeric u.(IIIIIZ)V+a capture. No original graphics or sprite payload.
const {rotatePoint}=require('../r75-procedural-geometry/assembly.cjs');
const {Java48Random}=require('../r75-procedural-geometry/native-rng.cjs');
const i32=(v,n)=>{if(!Number.isInteger(v)||v<-2147483648||v>2147483647)throw new RangeError(n+' must be int32');return v;};
const signedByte=v=>(v<<24)>>24, signedShort=v=>(v<<16)>>16;
function createCapture(frame,{clone=true}={}){
 const state=clone?structuredClone(frame):frame,trace=[],effects=[];
 if(!state.map||!state.u||!state.game?.rng)throw new TypeError('map/u/game.rng state required');
 const m=state.map; m.drawCommands??=[];
 function packed(raw){
  i32(state.u.aH,'u.aH');i32(state.u.aG,'u.aG');
  if(state.u.aH<=1){const rng=Java48Random.fromState(BigInt(state.game.rng.A));state.u.aG=rng.nextInt();state.game.rng.A=rng.state.toString();state.u.aH=32;trace.push({raw,operation:'raw-A-refill',after:state.game.rng.A});}
  const value=state.u.aG&3;state.u.aG>>=2;state.u.aH-=2;trace.push({raw,operation:'packed-two-bit',value});return value;
 }
 function emitTile(command,raw='0x53bd0'){
  const {x,y,kind,frame:fr,orientation,jitter}=command;
  for(const [k,v]of Object.entries({x,y,kind,frame:fr,orientation}))i32(v,k);
  if(state.loopGuardC===1)return {emitted:false,reason:'u.C'};
  if(x< -8||x>392||y< -8||y>392)return {emitted:false,reason:'pre-rotation-bounds'};
  const rotated=orientation===0?{x,y}:rotatePoint(x,y,orientation);
  if(orientation!==0){m.E=rotated.x;m.F=rotated.y;}
  let screenX=(Math.trunc((rotated.x*10)/16)+i32(m.a,'map.a viewport x'))|0;
  let screenY=(Math.trunc((rotated.y*10)/16)+i32(m.b,'map.b viewport y'))|0;
  if(kind===0&&jitter&&state.u.jitter){screenX+=packed('0x543fa')%3-1;screenY+=packed('0x54418')%3-1;}
  const draw={role:kind===0?'terrain-cell':'cell-decoration',kind,frame:fr,orientation,x,y,screenX,screenY,palette:m.t,alpha:m.drawAlpha??255,raw};
  const buffer=m.h===1?'old':m.h===2?'new':m.h===3?'third':null;
  if(buffer){
   const key=buffer==='old'?'e':buffer==='new'?'f':'g',count=i32(m[key],'capture count');
   if(count>=200)return {emitted:false,reason:'capture-limit',draw};
   if(count<0)throw new RangeError('negative native capture index');
   const capture=m.capture;for(const suffix of ['X','Y','Commands'])if(!Array.isArray(capture?.[buffer+suffix])||capture[buffer+suffix].length<=count)throw new RangeError('native capture capacity exhausted: '+buffer+suffix);
   capture[buffer+'X'][count]=signedShort(screenX);capture[buffer+'Y'][count]=signedShort(screenY);capture[buffer+'Commands'][count]=signedByte(fr);m[key]=count+1;
   draw.buffer=buffer;draw.index=count;draw.command=signedByte(fr);
  }else if(m.h!==0)throw new RangeError('unknown capture mode');
  // Registry is separate from native signed-byte command arrays, preserving semantic role.
  m.drawCommands.push(draw);effects.push({type:'semantic-draw',...draw});trace.push({raw,operation:'emit',buffer,index:draw.index});return {emitted:true,draw};
 }
 return {state,trace,effects,emitTile,emitEntity:emitTile,result:()=>({supported:true,state,trace,effects,scope:'implemented-contract',originalPayloadIncluded:false,completeNativeGraphics:false})};
}
module.exports={createCapture};



},
"experiments/r77-native-render/entity-renderer.cjs":function(module,exports,require){
'use strict';
// u.G functional draw scheduling, visibility, alpha and RNG consumption only.
// The renderer supplies its own artwork for numeric kind/frame commands.
const H=require('../r75-procedural-geometry/entity-posthooks.cjs');
const {integer,add,sub,mul,abs,read}=H;
function divide(a,b){if(b===0){const e=new Error('native integer division by zero');e.name='NativeArithmeticFault';throw e;}return Math.trunc(a/b)|0;}
function renderEntities({slots,geometry,controller,orientation},{rngA,parameter,emitTile,setAlpha=()=>{}}){
 integer(controller.i,'u.i');if(controller.i!==0)return {emitted:0,rngCalls:0,suppressed:true};
 if(!Array.isArray(slots))throw new TypeError('fixed entity slots required');
 for(const key of ['position','E','F'])integer(geometry[key],'g.'+key);
 integer(controller.B,'u.B');integer(orientation,'e.t');
 if(typeof emitTile!=='function'||typeof parameter!=='function')throw new TypeError('capture and numeric palette parameter providers required');
 let emitted=0,rngCalls=0;const events=[];
 const alpha=(value,raw)=>{setAlpha(value,raw);events.push({kind:'alpha',value,raw});};
 const emit=(x,y,kind,frame,raw)=>{emitTile({x,y,kind,frame,orientation,jitter:false},raw);emitted++;};
 for(let index=0;index<slots.length;index++){
  const e=slots[index];if(e===null)continue;integer(e.a,'y.a');if(e.a===0)continue;
  for(const f of ['c','d','k','e','f','n','o','j','i'])integer(e[f],'y.'+f);
  if(e.c===1){
   const phase=divide(add(controller.B,mul(index,7)),e.d);
   if(phase%2===0)continue;
  }
  if(e.c===2&&abs(sub(geometry.position,e.n))>e.d){
   if(typeof rngA!=='function')throw new TypeError('explicit shared RNG A required');
   const value=integer(rngA(100),'bounded A draw');rngCalls++;
   // Preserve signed native MIN_VALUE remainder behavior: it also takes <70.
   events.push({kind:'rng',bound:100,value,raw:'0x4cbd8'});if(value<70)continue;
  }
  let kind=e.k===1?(index&1)+1:0;
  const count=integer(parameter(138),'palette[138]');
  if(count===0)divide(1,0);
  const frame=add(index%count,1);
  if(e.e===0&&e.f===0&&e.c!==4)kind=0;
  if(e.c!==3){
   if(add(add(e.n,8),geometry.E)<0)continue;
   if(sub(sub(geometry.F,e.o),8)>384)continue;
  }else if(e.i===1&&e.cArray!==null){
   for(let h=sub(e.d,1);h>=0;h--){
    const x=read(e.cArray,h,'y.cArray');
    if(x===0&&read(e.dArray,h,'y.dArray')===0)continue;
    const shade=add(divide(mul(h,3),e.d),1);
    alpha(divide(mul(sub(4,shade),255),4),'0x4ca38');
    emit(add(read(e.cArray,h,'y.cArray'),geometry.E),sub(geometry.F,read(e.dArray,h,'y.dArray')),kind,frame,'0x4caac');
   }
  }
  const flash=mul(e.j%2,2);
  alpha(divide(mul(sub(4,flash),255),4),'0x4c70a');
  if(e.i===1)emit(add(e.n,geometry.E),sub(geometry.F,e.o),kind,frame,'0x4c91e');
  else{
   const radius=(e.i-1)<<3;
   for(let x=0;x<e.i;x++)for(let y=0;y<e.i;y++)
    emit(add(add(sub(e.n,radius),x<<4),geometry.E),sub(geometry.F,add(sub(e.o,radius),y<<4)),kind,frame,'0x4c88a');
  }
 }
 alpha(255,'0x4cc52');
 return {emitted,rngCalls,events,suppressed:false,originalRuntimeFullEquivalence:false,originalPayloadIncluded:false};
}
module.exports={renderEntities};

},
"experiments/r77-native-render/frame-renderer.cjs":function(module,exports,require){
'use strict';
const Capture=require('./capture.cjs'),Terrain=require('./terrain.cjs'),Palette=require('./parameters.cjs'),Entity=require('./entity-renderer.cjs'),Background=require('./background.cjs'),Actor=require('./actor-renderer.cjs'),Special=require('./special-effects.cjs');
const Camera=require('../r77-native-frame-driver/native-t.cjs'),Trajectory=require('../r77-native-trajectories/trajectories.cjs'),{Java48Random}=require('../r75-procedural-geometry/native-rng.cjs');
const int=(v,n)=>{if(!Number.isInteger(v))throw new TypeError(n+' integer required');return v;},mix=(a,b,t)=>Math.trunc(((Math.imul(a,10-t)+Math.imul(b,t))|0)/10)|0;
function renderFrame(input,options={}){
 if(options.graphicsAvailable!==true)throw new TypeError('renderFrame requires graphicsAvailable:true; use renderNull for capture');
 const c=Capture.createCapture(input),s=c.state,m=s.map;c.state.map.drawCommands=[];
 const viewport=options.viewport??s.presentation?.viewport;
 const result=(supported=true,reason)=>({...c.result(),supported,reason,graphicsArgument:'nonnull',graphicsExecuted:supported,renderRngComplete:supported,semanticGraphics:true,completeNativeGraphics:false,partial:!supported});
 const emit=e=>{c.effects.push(e);m.drawCommands.push(e);},alpha=(v,raw)=>{m.drawAlpha=v;c.effects.push({type:'draw-alpha',value:v,raw});};
 const clip=(v,raw)=>emit({type:'semantic-clip',...v,raw});
 const parameter=options.parameter??(i=>Palette.paletteByte(m.t,i));
 const drawA=bound=>{const rng=Java48Random.fromState(BigInt(s.game.rng.A)),v=rng.bounded(bound);s.game.rng.A=rng.state.toString();c.trace.push({operation:'draw-A',bound,value:v,after:s.game.rng.A});return v;};
 const bg=()=>{Background.background(c,{viewport,parameter,rngA:drawA});c.trace.push({operation:'J-background-complete',raw:'0x5291c'});};
 const actorOptions={screenOrigin:viewport&&{x:viewport.x,y:viewport.y}};
 const actor=()=>{Actor.renderActor(c,actorOptions);c.trace.push({operation:'I-actor-complete',raw:'0x4f2d0'});};
 const entities=()=>{const g=s.game.pool.objects[s.game.pool.currentIndex],out=Entity.renderEntities({slots:s.entities,geometry:{position:g.position,E:g.scalarE,F:g.scalarF},controller:{i:s.u.musicModeI,B:s.u.B},orientation:s.game.actor.orientation},{rngA:drawA,parameter,emitTile:c.emitTile,setAlpha:alpha});c.trace.push({raw:'0x4c468',operation:'G-entities-complete',rngCalls:out.rngCalls});};
 const terrain=()=>{Terrain.terrain(c,{parameter,depthThreshold:options.depthThreshold??Palette.depthThreshold,maxIterations:options.maxIterations});c.trace.push({raw:'0x4ccf4',operation:'H-terrain-complete'});};
 try{
  alpha(255,'0x4fe90');if(s.loopGuardC===1)return result();
  if(m.h!==0)return result(false,'normal Graphics frame requires map.h0; null capture path is separate');
  if(!viewport||!['x','y','width','height','screenWidth'].every(k=>Number.isInteger(viewport[k])))return result(false,'explicit viewport and screenWidth required');
  emit({type:'semantic-hud',role:'border-and-status',phase:'before-world',viewport:{...viewport},score:s.u.score,lives:s.u.lives,slot:s.r.slot,frontier:s.r.frontier,tutorial:s.r.tutorial,boss:s.game.stage.behaviorCode===99,raw:'0x52084..0x52760',originalTextIncluded:false,nativeFontMetrics:false});
  if(s.u.l===3){
   // u.a Graphics branch51eac: background and terrain precede capture interpolation.
   bg();clip(viewport,'0x51f78');if(int(s.map.r,'map.r')<=7)terrain();
   const ad=int(m.ad,'map.ad'),b=m.capture,count=int(m.e,'map.e');
   for(let i=0;i<count;i++){
    for(const key of ['oldX','oldY','newX','newY',ad<=4?'oldCommands':'newCommands'])if(!Array.isArray(b[key])||i>=b[key].length)throw new RangeError('boss transition capture bounds');
    emit({type:'semantic-transition-cell',role:'boss-scatter',x:mix(b.oldX[i],b.newX[i],ad),y:mix(b.oldY[i],b.newY[i],ad),frame:b[ad<=4?'oldCommands':'newCommands'][i],palette:m.t,index:i,raw:'0x51ec4/0x4f844'});
   }
   s.game.actor.frame=(int(s.game.actor.frame,'actor.frame')+1)|0;if(s.game.actor.frame>=Trajectory.frameCount(s.game.actor.actorState))s.game.actor.frame=0;
   c.trace.push({operation:'boss-scatter-actor-frame',raw:'0x51ef4..51f30',frame:s.game.actor.frame});actor();clip({reset:true},'0x51f22');alpha(255,'0x50036');return result();
  }
  if(s.u.l===4){
   require('../r77-native-boss-finalization/finalization.cjs').renderL4(c,{graphicsAvailable:true,bg,clip:arg=>clip(arg??viewport,'0x51e88/0x51eaa'),terrain,actor,emit});alpha(255,'0x50036');return result();
  }
  const controller=s.game.controller.controllerStateUK;
  if(controller===200){
   bg();clip(viewport,'0x51b8e');
   const ad=int(m.ad,'map.ad'),x=mix(int(m.Z,'map.Z'),int(m.ab,'map.ab'),ad),y=mix(int(m.aa,'map.aa'),int(m.ac,'map.ac'),ad);
   m.spriteFlagB=true;m.aE=(int(m.aE,'map.aE')+1)|0;if(m.aE>=Trajectory.frameCount(11))m.aE=0;
   const resource=int(s.r.actorResourceQ,'r.actorResourceQ');Actor.renderActorAt(c,{resource:resource===1?0:resource,x,y,orientation:s.game.actor.orientation,direction:s.game.pool.direction,state:11,frame:m.aE,role:'transition-actor'},actorOptions);
   const b=m.capture,count=int(m.e,'map.e');for(let i=0;i<count;i++){
    for(const key of ['oldX','oldY','newX','newY',ad<=4?'oldCommands':'newCommands'])if(!Array.isArray(b[key])||i>=b[key].length)throw new RangeError('transition capture bounds');
    emit({type:'semantic-transition-cell',x:mix(b.oldX[i],b.newX[i],ad),y:mix(b.oldY[i],b.newY[i],ad),frame:b[ad<=4?'oldCommands':'newCommands'][i],palette:m.t,index:i,raw:'0x4f844'});
   }
   c.trace.push({operation:'transition-presentation-complete',raw:'0x5193c',ad,aE:m.aE});clip({reset:true},'0x51a7e');alpha(255,'0x50036');return result();
  }
  if(controller!==0){alpha(255,'0x50036');return result();}
  bg();
  if(s.r.tutorial&&s.game.actor.orientation===0&&s.game.pool.direction===0&&s.u.musicModeI===0)emit({type:'semantic-tutorial-cues',points:[[288,336],[528,336],[752,336],[768,240],[1056,336]],coordinateSpace:'native helper h/i projection',phase:int(s.r.n,'r.n')&1,raw:'0x5161c..0x5187a',originalTextIncluded:false});
  const low=s.u.actionLock&15;
  if(low===0){
   clip(viewport,'0x515c0');entities();
   if(s.game.actor.actorState===11)Special.special11(c);
   else if(s.game.stage.behaviorCode===3)Terrain.maskTerrain(c,{parameter,maskCell:options.maskCell});
   else if(s.game.stage.behaviorCode===99){if(s.game.stage.behaviorArgument<=7)terrain();Special.bossCells(c,options);}
   else terrain();
   m.spriteFlagB=true;actor();clip({reset:true},'0x50f42');
  }else if(low<=4){
   m.spriteFlagB=true;const count=low===4?4:low+1;
   for(let n=0;n<count;n++){
    let bounds,rect;
    if(low===4){const x=n>=2?192:0,y=n%2===1?192:0;bounds={f:x,g:x+192,h:y,i:y+192};rect={x:m.a+(n>=2?Math.trunc(viewport.width/2):0),y:m.b+(n%2?Math.trunc(viewport.height/2):0),width:Math.trunc(viewport.width/2),height:Math.trunc(viewport.height/2)};}
    else{const size=Math.trunc(384/count);if(s.game.actor.orientation%2===0){bounds={f:0,g:384,h:n*size,i:(n+1)*size};rect={x:m.a,y:m.b+n*Math.trunc(viewport.height/count),width:viewport.width,height:(n+1)*Math.trunc(viewport.height/count)};}else{bounds={f:n*size,g:(n+1)*size,h:0,i:384};rect={x:m.a+n*Math.trunc(viewport.width/count),y:m.b,width:(n+1)*Math.trunc(viewport.width/count),height:viewport.height};}}
    s.game.view.bounds=bounds;clip(rect,low===4?'0x508bc..0x50a74':'0x50dae/0x50ec4');
    const followed=(options.follow??Camera.follow)(s.game,{force:true,tutorial:!!s.r.tutorial});s.game=followed.state;c.trace.push({operation:'partition-camera-follow',partition:n,bounds,translation:followed.translation});entities();terrain();
    const unit=low===4?(s.u.actionLock>16?8:24):Math.trunc((s.u.actionLock>16?32:96)/count),phase=(Math.trunc(((s.u.s+1000)|0)/unit)+n)|0,remainder=low===4?(phase&3):phase%count;
    if(s.u.actionLock>16?remainder<=0:remainder!==0)actor();clip({reset:true},'0x50bc2/0x5079c');
   }
  }
  if(s.u.D>0){clip(viewport,'0x506d2');if(s.u.aF>255&&s.u.aF<1000)emit({type:'semantic-overlay',role:'goal-or-status',code:s.u.aF,remaining:s.u.D,raw:'0x504ac'});else if(s.game.controller.modeP<=0)emit({type:'semantic-overlay',role:'stage-notification',code:s.u.aF,remaining:s.u.D,raw:'0x50140',originalTextIncluded:false});else s.u.D=0;clip({reset:true},'0x50094');}
  if(s.r.timerT>0){clip(viewport,'0x5008e');emit({type:'semantic-overlay',role:'countdown',frame:Math.trunc(s.r.timerT/10)+22,right:m.a+210,y:m.b+30,raw:'0x5000c',ownFontMetrics:true});clip({reset:true},'0x50054');}
  alpha(255,'0x50036');return result();
 }catch(error){c.trace.push({operation:'presentation-contract-error',name:error.name,message:error.message});return result(false,error.message);}
}
module.exports={renderFrame};

},
"experiments/r77-native-render/parameters.cjs":function(module,exports,require){
'use strict';
const p=require('./parameters.json');
function paletteByte(palette,index){if(!Number.isInteger(palette)||palette<0||palette>=p.paletteParameters.length)throw new RangeError('palette index');const bg=p.backgroundColors[palette];if(index===128)return bg.selector;const base=bg.selector*7;if(index>=base&&index<base+3){const b=bg.rgb[index-base];return b<128?b:b-256;}const c=p.paletteOffsets.indexOf(index);if(c<0)throw new RangeError('nonfunctional palette offset excluded: '+index);return p.paletteParameters[palette][c];}
function depthThreshold(index){if(!Number.isInteger(index)||index<0||index>=p.depthThresholds.length)throw new RangeError('native depth threshold array bounds');return p.depthThresholds[index];}
module.exports={paletteByte,depthThreshold,orientationX:p.orientationX,orientationY:p.orientationY};

},
"experiments/r77-native-render/parameters.json":function(module,exports,require){
module.exports={"schema":"nom3-functional-render-parameters-v1","nativeSha256":"782b2c836ef32331e74a943367aa7bae09891fa56ca39cd89acfa887bcfa55d3","paletteStride":141,"paletteOffsets":[137,138,139,140],"paletteParameters":[[4,2,1,6],[4,2,1,6],[4,2,1,5],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,3,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,5],[4,2,1,5],[4,2,1,6],[4,2,1,6],[4,2,1,6],[7,6,1,6],[4,6,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[5,5,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,3,1,6],[4,2,1,6],[4,3,1,6],[4,2,1,6],[6,3,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,3,1,6],[4,2,1,6],[4,2,1,6],[5,4,1,6],[4,3,1,6],[4,4,1,6],[1,7,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,3,1,6],[4,2,1,6],[4,2,1,6],[4,3,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,3,1,6],[4,2,1,6],[4,3,1,6],[4,3,1,6],[4,3,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,3,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,3,1,6],[4,2,1,6],[4,2,1,6],[4,2,1,6],[4,6,1,6],[4,2,1,6],[1,6,1,6],[4,2,1,6]],"backgroundColors":[{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":4,"rgb":[255,246,0]},{"selector":1,"rgb":[0,0,0]},{"selector":1,"rgb":[0,0,0]},{"selector":1,"rgb":[0,0,0]},{"selector":1,"rgb":[0,0,0]},{"selector":6,"rgb":[255,255,255]},{"selector":3,"rgb":[0,0,0]},{"selector":0,"rgb":[0,0,0]},{"selector":9,"rgb":[0,0,0]},{"selector":0,"rgb":[0,0,0]},{"selector":2,"rgb":[255,255,255]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":6,"rgb":[255,255,255]},{"selector":6,"rgb":[255,255,255]},{"selector":3,"rgb":[0,0,0]},{"selector":6,"rgb":[255,255,255]},{"selector":6,"rgb":[255,255,255]},{"selector":12,"rgb":[0,0,0]},{"selector":0,"rgb":[0,255,255]},{"selector":3,"rgb":[0,0,0]},{"selector":6,"rgb":[255,255,255]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":4,"rgb":[27,54,75]},{"selector":8,"rgb":[255,255,255]},{"selector":8,"rgb":[255,255,255]},{"selector":3,"rgb":[102,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":2,"rgb":[0,64,128]},{"selector":0,"rgb":[79,0,79]},{"selector":6,"rgb":[64,0,128]},{"selector":3,"rgb":[255,255,255]},{"selector":12,"rgb":[0,0,0]},{"selector":0,"rgb":[0,0,0]},{"selector":0,"rgb":[0,32,64]},{"selector":8,"rgb":[0,0,0]},{"selector":7,"rgb":[255,255,0]},{"selector":11,"rgb":[0,0,0]},{"selector":11,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":5,"rgb":[1,56,47]},{"selector":14,"rgb":[255,255,255]},{"selector":2,"rgb":[0,64,128]},{"selector":2,"rgb":[0,0,0]},{"selector":15,"rgb":[255,255,255]},{"selector":3,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":5,"rgb":[202,0,0]},{"selector":4,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[91,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[0,0,0]},{"selector":8,"rgb":[0,0,0]},{"selector":2,"rgb":[49,49,49]},{"selector":2,"rgb":[0,64,0]},{"selector":8,"rgb":[181,0,90]},{"selector":4,"rgb":[0,0,0]},{"selector":0,"rgb":[0,0,0]},{"selector":4,"rgb":[128,0,64]},{"selector":7,"rgb":[0,0,0]},{"selector":2,"rgb":[128,0,0]},{"selector":4,"rgb":[255,255,0]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[128,0,0]},{"selector":3,"rgb":[24,32,0]},{"selector":2,"rgb":[0,0,0]},{"selector":6,"rgb":[0,0,128]},{"selector":2,"rgb":[0,0,0]},{"selector":2,"rgb":[16,57,90]},{"selector":2,"rgb":[0,0,0]},{"selector":3,"rgb":[0,0,0]},{"selector":7,"rgb":[255,255,255]},{"selector":7,"rgb":[0,0,0]},{"selector":4,"rgb":[64,0,0]},{"selector":9,"rgb":[255,255,255]},{"selector":2,"rgb":[64,0,64]}],"depthThresholds":[100,75,50,40,30,25,23,22,20,20,15,15,13,13,13,10,10,10,10,10],"orientationX":[1,0,-1,0],"orientationY":[0,-1,0,1],"provenance":{"palette":{"resourceSha256":"351c6a61d11da1bc3c0a74987c5c5898e943c61c9a5f37eccd3d5f420d08d3d4","consumer":"0x52fb4;0x4cf30/0x4cf7c/0x4cf8a","excluded":"all palette fields except functional137..140, active selector128 and its referenced RGB triple"},"thresholds":{"resourceSha256":"1358b182f0a6ab495c43cd68d1a400a36202b7445063ed0122870dc915d70a52","binding":"0x1f8de/0x1f8ea","consumer":"0x4d2fe..0x4d328"},"directions":{"xSha256":"e9e53e3a3aacd9420bcf3d573dafce569d85a0b224d591526974ee14b29454d4","ySha256":"bc66f5f425fe27e0cfb1395ec354328674831bac1d11b73be59eea25e305cad3","consumer":"0x51068..0x510b4"}},"excluded":["pixels","scripts","audio","mask bitmap"]};
},
"experiments/r77-native-render/renderer.cjs":function(module,exports,require){
'use strict';
const Capture=require('./capture.cjs'),T=require('./terrain.cjs'),P=require('./parameters.cjs'),G=require('./entity-renderer.cjs');
const Camera=require('../r77-native-frame-driver/native-t.cjs');
const {Java48Random}=require('../r75-procedural-geometry/native-rng.cjs');
function renderNull(input,options={}){
 const c=Capture.createCapture(input),s=c.state,m=s.map;
 const fail=(reason,raw)=>({...c.result(),supported:false,reason,raw,partial:true});
 const setAlpha=(value,raw)=>{m.drawAlpha=value;c.effects.push({type:'draw-alpha',value,raw});};
 const parameter=options.parameter??(index=>P.paletteByte(m.t,index));
 const rngA=bound=>{const rng=Java48Random.fromState(BigInt(s.game.rng.A)),value=rng.bounded(bound);s.game.rng.A=rng.state.toString();c.trace.push({raw:'0x4cbd8',operation:'draw-A',bound,value,after:s.game.rng.A});return value;};
 const entities=()=>{const g=s.game.pool.objects[s.game.pool.currentIndex];const out=G.renderEntities({slots:s.entities,geometry:{position:g.position,E:g.scalarE,F:g.scalarF},controller:{i:s.u.musicModeI,B:s.u.B},orientation:s.game.actor.orientation},{rngA,parameter,emitTile:c.emitTile,setAlpha});c.trace.push({raw:'0x4c468',operation:'entity-render',rngCalls:out.rngCalls,emitted:out.emitted});};
 const terrain=()=>T.terrain(c,{parameter,depthThreshold:options.depthThreshold??P.depthThreshold,maxIterations:options.maxIterations});
 setAlpha(255,'0x4fe90');if(s.loopGuardC===1)return c.result();
 if(s.u.l===3||s.u.l===4)return fail('special l3/l4 presentation not in null capture contract','0x4febe/0x4fece');
 if(s.game.controller.controllerStateUK===200)return fail('transition presentation belongs to transition module','0x4fede');
 if(s.game.controller.controllerStateUK!==0)return c.result();
 const low=s.u.actionLock&15;
 if(low===0){
  entities();
  if(s.game.actor.actorState===11)return fail('actor11 special presentation unresolved','0x51186');
  if(s.game.stage.behaviorCode===99)return fail('boss presentation unresolved','0x50f4a');
  if(s.game.stage.behaviorCode===3)T.maskTerrain(c,{parameter,maskCell:options.maskCell});else terrain();
 }else if(low<=4){
  m.spriteFlagB=true;const count=low===4?4:low+1;
  for(let n=0;n<count;n++){
   let b;
   if(low===4){const x=n>=2?192:0,y=n%2===1?192:0;b={f:x,g:x+192,h:y,i:y+192};}
   else{const size=Math.trunc(384/count);b=s.game.actor.orientation%2===0?{f:0,g:384,h:n*size,i:(n+1)*size}:{f:n*size,g:(n+1)*size,h:0,i:384};}
   s.game.view.bounds=b;c.trace.push({raw:low===4?'0x509b6/0x50a18/0x50940/0x508bc':'0x50b1c/0x50e30',operation:'set-bounds',bounds:{...b}});
   const followed=(options.follow??Camera.follow)(s.game,{force:true,tutorial:!!s.r.tutorial});s.game=followed.state;c.trace.push({raw:low===4?'0x50744':'0x50b2e',operation:'camera-follow',translation:followed.translation});
   entities();terrain();
   // Subsequent time-mask branches select actor drawing only for non-null Graphics.
  }
 }
 // Overlay drawing uses separate sprite/text calls, not transition capture arrays.
 if(s.u.D>0){
  if(s.u.aF>255&&s.u.aF<1000)c.effects.push({type:'semantic-overlay',role:'goal-or-status',code:s.u.aF,palette:m.t,remaining:s.u.D,raw:'0x504ac',alignment:'native metric-dependent; own visual layout'});
  else if(s.game.controller.modeP<=0)c.effects.push({type:'semantic-overlay',role:'stage-notification',code:s.u.aF,remaining:s.u.D,raw:'0x50140',originalTextIncluded:false});
  else{s.u.D=0;c.trace.push({raw:'0x4ff82',operation:'clear-notification'});}
 }
 if(s.r.timerT>0)c.effects.push({type:'semantic-overlay',role:'countdown',frame:Math.trunc(s.r.timerT/10)+22,right:m.a+210,y:m.b+30,raw:'0x5000c',alignment:'right; own visual metrics'});
 return {...c.result(),scope:'implemented-contract',graphicsArgument:null,completeNativeGraphics:false};
}
module.exports={renderNull};



},
"experiments/r77-native-render/special-effects.cjs":function(module,exports,require){
'use strict';
const A=require('../r75-procedural-geometry/assembly.cjs'),U=require('../r75-procedural-geometry/entity-update.cjs'),B=require('../r77-native-boss-contact/boss-geometry.cjs');
const div=(a,b)=>Math.trunc(a/b)|0;
function special11(c){
 const s=c.state,a=s.game.actor,g=s.game.pool.objects[s.game.pool.currentIndex],frame=a.frame;
 const p=A.rotatePoint(g.scalarE+g.position,g.scalarF-a.height-24,a.orientation);s.map.E=p.x;s.map.F=p.y;
 const x=div(Math.imul(p.x,10),16)+s.map.a,y=div(Math.imul(p.y,10),16)+s.map.b,mode=s.u.musicModeI;
 const emit=e=>{const effect={type:'semantic-action-effect',role:'state11-particles',rgb:0xffffff,...e};c.effects.push(effect);s.map.drawCommands??=[];s.map.drawCommands.push(effect);};
 if(mode===1||mode===3){
  const rings=div(frame,4)+2,phase=frame%4;
  for(let ring=0;ring<rings;ring++)for(let n=0;n<10;n++){
   const angle=36*n+8*(ring+frame),radius=phase+4*ring;
   const scale=v=>mode===1?div((Math.imul(Math.imul(v,10),radius)>>1),80):div(div(Math.imul(Math.imul(v,10),radius),2),100);
   emit({primitive:'rect',x:x+scale(U.nativeCos100(angle)),y:y+scale(U.nativeCos100(angle-90)),width:2,height:2,raw:mode===1?'0x51570':'0x51324'});
  }
 }else if(mode===2){
  const radius=div(Math.imul(frame+8,10),2);
  for(let n=0;n<10;n++){const angle=18*(n%10)+(Math.imul(frame,7)%18),dx=div(Math.imul(radius,U.nativeCos100(angle)),100),dy=div(Math.imul(radius,U.nativeCos100(angle-90)),100);emit({primitive:'line',x1:x+dx,y1:y+dy,x2:x-dx,y2:y-dy,raw:'0x51488/0x514aa'});}
 }
 c.trace.push({raw:'0x51186',operation:'state11-special',mode,frame,x,y});
}
function bossCells(c,{bossCell=B.geometryCell}={}){
 const s=c.state,b=s.boss;if(!b)throw new TypeError('native boss fields required');if(b.K<0)return;
 const plane=B.frameIndex(b,s.u.B),frame=s.game.actor.actorState===13?0:b.Y===2?b.aJ:b.aI;
 if(!Number.isInteger(frame))throw new TypeError('boss.aI/aJ tile-frame role required');
 for(let index=0;index<Math.ceil(b.T*b.U/8)*8;index++){
  const col=index%b.T,row=div(index,b.T);if(!bossCell(b.J,plane,col,b.U-1-row))continue;
  c.emitTile({x:b.W-(b.T<<3)+16*col+24,y:376-(b.X+(b.U<<3)-16*row),kind:0,frame,orientation:0,jitter:true},'0x5595a');
 }
 c.trace.push({raw:'0x556c0',operation:'boss-cells',plane});
}
module.exports={special11,bossCells};


},
"experiments/r77-native-render/terrain.cjs":function(module,exports,require){
'use strict';
const {Java48Random}=require('../r75-procedural-geometry/native-rng.cjs');
const P=require('./parameters.cjs');
function div(a,b){if(!b)throw new RangeError('native division by zero');return Math.trunc(a/b);}
function boundsFor(b,o){return o===0?[b.f,b.g,b.h,b.i]:o===1?[384-b.i,384-b.h,b.f,b.g]:o===2?[384-b.g,384-b.f,384-b.i,384-b.h]:[b.h,b.i,384-b.g,384-b.f];}
function terrain(c,{parameter=i=>P.paletteByte(c.state.map.t,i),depthThreshold=P.depthThreshold,maxIterations=100000}={}){
 const s=c.state,q=s.game.stage.behaviorCode,r=s.game.stage.behaviorArgument??s.map.r,a=s.game.actor;let iterations=0;
 const step=()=>{if(++iterations>maxIterations)throw new RangeError('render work budget');};
 const reseed=seed=>{const rng=new Java48Random(BigInt(seed));s.game.rng.B=rng.state.toString();c.trace.push({raw:'0x4d2dc/0x4d41e',operation:'reseed-B',seed,after:s.game.rng.B});};
 const drawB=()=>{const rng=Java48Random.fromState(BigInt(s.game.rng.B)),value=rng.bounded(100);s.game.rng.B=rng.state.toString();c.trace.push({raw:'0x4d2f4/0x4d4e4',operation:'draw-B',bound:100,value,after:s.game.rng.B});return value;};
 for(const object of s.game.pool.objects){
  if(!object)continue;const g=object.geometry,o=g.orientation,E=object.scalarE,F=object.scalarF,N=g.activeLength,C=g.columns;
  if(E>384||E+16*N<0||F-g.scalarH>384||F<0)continue;
  const [left,right,top,bottom]=boundsFor(s.game.view.bounds,o);
  const startX=left-16>=E?left-((left-16-E)%16):E,endX=right<=g.scalarD+E?right+((g.scalarD+E-right)%16):g.scalarD+E;
  let col=div(Math.abs(E-startX),16);
  const base=(div(s.u.B,parameter(139))+Math.imul(o,N-1))|0,frames=parameter(138),spacing=parameter(137);
  for(let x=startX;x<=endX;x+=16){
   step();if(col<0||col>=C.c.length)throw new RangeError('native terrain column bounds');
   const frame=div((base+(s.game.pool.direction===0?col:-col))|0,spacing)%frames+1;
   if(frames===0)throw new RangeError('native remainder by zero');
   const height=C.c[col],i=C.i[col];
   // These raw branches intentionally advance x without advancing col.
   if(height<=0||(i!==1&&height<16)||![0,1,2].includes(i)){c.trace.push({raw:'0x4dc04/0x4dc0a/0x4d152',operation:'advance-x-only',x,column:col});continue;}
   let kind=C.h[col]===1&&height>16?x%2+1:0;if(C.type[col]===2&&height===C.d[col])kind=0;
   const emit=(xx,yy,oo,raw,k=kind)=>c.emitTile({x:xx,y:yy,kind:k,frame,orientation:oo,jitter:true},raw);
   const aligned=surface=>Math.max(top-((top-surface)%16),surface);
   const y0=aligned(F-height),y1=Math.min(bottom+((F-bottom)%16),F);
   const mirroredSurface=F+height+(16*r-368),mirrorY0=aligned(mirroredSurface),mirrorY1=bottom+((F-bottom)%16);
   const seed=(Math.imul(o,571)+Math.imul(col,827))|0;
   if(i===1){
    emit(x,y0+16,o,'0x4d68a');
    if(o===a.orientation&&q===1)emit(384-x,y0+16,o+2,'0x4d834');
    if(o===a.orientation&&q===2)emit(384-x,mirrorY0+16,o+2,'0x4d7f2');
    if(C.h[col]===1)emit(x,F,o,'0x4d72c',0);
   }else{
    if(i===2)reseed(seed);
    for(let y=y0+16;y<=y1;y+=16){step();if(i===2&&!(drawB()<depthThreshold(div(y-y0-16,16))))continue;emit(x,y,o,i===2?'0x4d35a':'0x4d936');if(o===a.orientation&&q===1)emit(384-x,y,o+2,i===2?'0x4d3b8':'0x4da10');}
    if(o===a.orientation&&q===2){
     if(i===2)reseed(seed);
     for(let y=mirrorY0+16;y<=mirrorY1;y+=16){step();if(i===2&&!(drawB()<depthThreshold(div(y-mirrorY0-16,16))))continue;emit(384-x,y,o+2,i===2?'0x4d54c':'0x4db54');}
    }
   }
   col++;
  }
 }
 return c.result();
}
function maskTerrain(c,{maskCell,parameter=i=>P.paletteByte(c.state.map.t,i)}={}){
 if(typeof maskCell!=='function')throw new TypeError('functional mask provider required');
 const s=c.state,a=s.game.actor,spacing=parameter(137),frames=parameter(138),period=parameter(139),base=1000+(s.game.pool.direction===0?1:-1)*div(s.u.s,period),ox=P.orientationX[a.orientation],oy=P.orientationY[a.orientation];
 if(ox===undefined||oy===undefined)throw new RangeError('mask orientation');
 if(frames===0)throw new RangeError('native remainder by zero');
 for(let n=0;n<576;n++){const x=n%24,y=div(n,24);if(!maskCell(s.map.ae,x,y))continue;let frame=div(base-ox*x-oy*y,spacing)%frames+1;if(a.actorState===13||a.actorState===16)frame=0;c.emitTile({x:x*16+8,y:y*16+8,kind:0,frame,orientation:0,jitter:true},'0x5113a');}
 return c.result();
}
module.exports={terrain,maskTerrain,boundsFor};


},
"experiments/r77-native-trajectories/trajectories.cjs":function(module,exports,require){
'use strict';
// Functional state counts and finite-domain displacement recipes. No copied frame-row,
// sprite-frame, bitmap, dialogue, animation-resource or script payload.
function int(value, label, min = -2147483648, max = 2147483647) {
  if (!Number.isInteger(value) || value < min || value > max) throw new RangeError(label + ' requires a supported int32');
  return value;
}
function stateId(state) { return int(state, 'actor state', 0, 16); }
function frameCount(state) {
  stateId(state);
  if (state >= 3 && state <= 8) return 7 + 3 * Math.floor((state - 3) / 2);
  if (state === 1 || state === 2 || state === 12) return 6;
  if (state === 0 || state === 10 || state === 15) return 4;
  if (state === 13 || state === 16) return 15;
  if (state === 9) return 8;
  if (state === 11) return 13;
  return 3; // state14; finite domain checked above.
}
function zeroDisplacement(state) {
  stateId(state);
  return state <= 2 || state === 9 || state === 11 || state === 12 || state >= 14;
}
function generatedDelta(state, index) {
  const count = frameCount(state);
  int(index, 'displacement index', 0, count - 1);
  if (zeroDisplacement(state)) return 0;
  const family = state >= 3 && state <= 8 ? state - (state % 2 === 0 ? 1 : 0) : state;
  if (family === 3) {
    if (index === 0) return 0;
    if (index === 1) return 32;
    if (index <= 3) return 16 - 4 * index;
    if (index <= 5) return 12 - 4 * index;
    return -24;
  }
  if (family === 5) {
    if (index === 0 || index === 5) return 0;
    if (index === 1) return 26;
    if (index === 9) return -24;
    const t = Math.abs(5 - index) - 1; // Finite integer domain 0..2.
    const magnitude = 5 + 11 * t - 3 * t * (t - 1) / 2;
    return index < 5 ? magnitude : -magnitude;
  }
  if (family === 7) {
    if (index === 0) return 0;
    if (index === 1) return 35;
    if (index === 12) return -24;
    const ascending = index <= 6, d = ascending ? 6 - index : index - 7;
    const magnitude = d <= 2 ? 3 + d * (d + 3) / 2 : 21 + 11 * (d - 3);
    return ascending ? magnitude : -Math.min(24, magnitude);
  }
  if (family === 10) return index === 0 || index === 3 ? 0 : -7 - 6 * index;
  // State13: alternating one/two decrement runs, plus two explicit zero events.
  if (index === 0 || index === 10) return 0;
  return index <= 7 ? 6 - Math.floor(3 * (index - 1) / 2) : 7 - Math.floor(3 * index / 2);
}
function validateSupplied(state, row, evidence) {
  const count = frameCount(state);
  if (typeof evidence !== 'string' || !evidence.trim()) throw new TypeError('Explicit supplied-row provenance label required');
  if (!Array.isArray(row) || row.length !== count + 1 || row[0] !== count) throw new RangeError('Supplied row must have the confirmed count and exactly count+1 elements');
  for (let i = 1; i <= count; i++) int(row[i], 'signed displacement', -128, 127);
  return row.slice();
}
function frameRow(state, { suppliedRow, evidence } = {}) {
  const count = frameCount(state);
  const row = [count, ...Array.from({ length: count }, (_, index) => generatedDelta(state, index))];
  if (suppliedRow !== undefined) {
    const supplied = validateSupplied(state, suppliedRow, evidence);
    if (supplied.some((v, i) => v !== row[i])) throw new RangeError('Supplied row conflicts with the verified functional recipe');
  }
  return { supported: true, row, count, provenance: zeroDisplacement(state) ? 'derived-zero-displacement' : 'derived-piecewise-functional-metadata',
    candidateValuesVerified: true, nativeGenerationAlgorithmEstablished: false,
    ...(suppliedRow === undefined ? {} : { suppliedRowChecked: true, evidence }) };
}
function generatedRows() {
  const rows = {};
  for (let state = 0; state <= 16; state++) {
    const result = frameRow(state);
    if (result.supported) rows[state] = result.row;
  }
  return rows; // All finite-domain recipes are checked against every candidate sample.
}
function deltaAt(state, frame, options) {
  int(frame, 'frame', 0);
  const result = frameRow(state, options);
  if (!result.supported) return result;
  const index = frame % result.count + 1;
  return { ...result, index, delta: result.row[index] };
}
function advanceCounter({ state, frame, completionFlag }) {
  const count = frameCount(state);
  int(frame, 'frame', 0, 2147483646); int(completionFlag, 'completionFlag', 0, 1);
  const next = frame + 1;
  return { frame: next, count, lastFrameFlag: next >= count - 1 ? 1 : 0,
    completionFlag: next >= count ? 1 : completionFlag,
    resetRequired: next >= count || completionFlag === 1 };
  // The actor setter/resource effects are intentionally external; do not reset here.
}
function constructorSpeed() { return 8; }
function ordinarySelectorSpeed({ reached, behaviorCode, modeP, ai, ak }) {
  if (typeof reached !== 'boolean') throw new TypeError('Explicit selector reachability required');
  if (!reached) return { supported: false, reason: 'selector-speed-branch-not-reached' };
  for (const [name, value] of Object.entries({ behaviorCode, modeP, ai, ak })) int(value, name);
  if (behaviorCode === 3 || behaviorCode === 99) return { supported: false, reason: 'q3-q99-different-selector-branch' };
  const speed = ai <= 1 ? 12 : ak === 7 ? 6 : ak === 4 ? 9 : 8;
  return { supported: true, speed, writes: modeP > 0 ? [6, speed] : [speed],
    units: 'local tangent units per reached movement call; not pixels/second',
    scope: 'ordinary selector speed-write subgraph only' };
}
module.exports = { frameCount, zeroDisplacement, generatedDelta, frameRow, generatedRows, deltaAt, advanceCounter, constructorSpeed, ordinarySelectorSpeed };

},
"experiments/r77-native-transition/transition.cjs":function(module,exports,require){
'use strict';
// Isolated functional transition state. Capture data and palette bytes are caller
// inputs. No original graphics, palette records, strings or sound payload.
const R=require('../r75-procedural-geometry/native-rng.cjs');
const clone=x=>structuredClone(x),add=(a,b)=>(a+b)|0,short=x=>x<<16>>16;
class TransitionContractError extends Error{constructor(gate,detail={}){super('transition contract gate: '+gate);this.name='TransitionContractError';this.gate=gate;this.detail=detail;}}
function integer(x,name){if(!Number.isInteger(x)||x<-2147483648||x>2147483647)throw new TypeError(name+' requires signed32');return x;}
function read(array,index,name){if(!Array.isArray(array)||index<0||index>=array.length)throw new TransitionContractError('native array access',{name,index});return integer(array[index],name+'['+index+']');}
function write(array,index,value,name){if(!Array.isArray(array)||index<0||index>=array.length)throw new TransitionContractError('native array write',{name,index});array[index]=value;}
function result(state,trace,effects,extra={}){return {supported:true,scope:'implemented-contract',state,trace,effects,...extra,graphicsExecuted:false,mediaExecuted:false,productIntegrated:false,originalRuntimeFullEquivalence:false,originalPayloadIncluded:false};}
function context(input,options){
 const state=clone(input),trace=[],effects=[];
 if(!state.map)throw new TypeError('explicit state.map required');
 const draw=(bound,raw)=>{
  integer(bound,'RNG bound');let value,before,after;
  if(typeof options.rngA==='function')value=options.rngA(bound);
  else{
   before=state.game?.rng?.A;if(typeof before!=='string')throw new TypeError('explicit initialized game.rng.A required');
   const random=R.Java48Random.fromState(BigInt(before));value=random.bounded(bound);after=random.state.toString();state.game.rng.A=after;
  }
  trace.push({raw,operation:'draw',stream:'A',bound,value,...(before===undefined?{}:{before,after})});
  if(!Number.isInteger(value)||value<0||value>=Math.max(1,bound))throw new TransitionContractError('negative/out-of-domain native bounded remainder',{bound,value});
  return value;
 };
 return {state,trace,effects,draw};
}
function setup(input,scatter,options={}){
 if(typeof scatter!=='boolean')throw new TypeError('explicit boolean transition argument required');
 const c=context(input,options),{state,trace,effects,draw}=c,m=state.map;
 integer(m.e,'u.e old capture count');integer(m.f,'u.f new capture count');
 if(m.e<0||m.f<0)throw new TransitionContractError('negative capture count');
 const buffers=m.capture;
 if(add(m.e,m.f)===0)scatter=true;
 const append=(side,countKey)=>{
  if(!buffers)throw new TransitionContractError('explicit capture buffers required');
  const xKey=side+'X',yKey=side+'Y',commandKey=side+'Commands',index=m[countKey];
  if(scatter){
   const sample=draw(384,side==='new'?'0x532b0':'0x535d8'),edge=sample%4;
   const x=edge===0?-32:edge===1?384:short(sample-16);
   const y=edge===2?-32:edge===3?384:short(sample-16);
   write(buffers[xKey],index,x,xKey);write(buffers[yKey],index,y,yKey);
   const command=index>0?read(buffers[commandKey],sample%index,commandKey):0;
   write(buffers[commandKey],index,command,commandKey);
   trace.push({raw:side==='new'?'0x532c2..0x53324':'0x535ea..0x5364c',operation:'scatter-capture-entry',side,index,edge,sample});
  }else{
   const source=draw(index,side==='new'?'0x53476':'0x5379e');
   // Even active count0 consumes A(0) and reads retained capacity index0.
   write(buffers[xKey],index,short(read(buffers[xKey],source,xKey)),xKey);
   write(buffers[yKey],index,short(read(buffers[yKey],source,yKey)),yKey);
   write(buffers[commandKey],index,read(buffers[commandKey],source,commandKey),commandKey);
   trace.push({raw:side==='new'?'0x53480..0x534fa':'0x537a8..0x53822',operation:'clone-capture-entry',side,index,source});
  }
  m[countKey]=add(index,1);
 };
 while(m.e>m.f)append('new','f');
 while(m.e<m.f)append('old','e');
 return result(state,trace,effects,{phase:'transition-capture-balanced',captureSetupComplete:true,scatter,oldCount:m.e,newCount:m.f});
}
function paletteColor(palette,provider,trace,raw){
 if(typeof provider!=='function')throw new TransitionContractError('explicit paletteByte(palette,offset) provider required');
 const byte=offset=>{const value=provider(palette,offset);if(!Number.isInteger(value)||value<-128||value>127)throw new TypeError('paletteByte must return signed8');trace.push({raw,operation:'palette-byte',palette,offset});return value;};
 const selector=byte(128),base=Math.imul(selector,7);
 const r=byte(base)&255,g=byte(add(base,1))&255,b=byte(add(base,2))&255;
 return (r<<16)|(g<<8)|b;
}
function resumeAudioEffect(state){
 // u.()V+c: only metadata identifying the requested resource; playback is an effect.
 for(const [name,value] of [['r.m',state.pendingUiState],['r.k',state.uiState],['r.t',state.r?.timerT],['u.v',state.u?.lives]])integer(value,name);
 if(state.pendingUiState!==-1||state.uiState!==60||state.r.timerT>0||state.u.lives<=0)return null;
 const q=integer(state.game?.stage?.behaviorCode,'u.q');
 if(q===99)return {kind:'audio-resource-request',method:'k.(Ljava/lang/String;)V+b',role:'boss',raw:'0x4adc2',executed:false};
 const index=integer(state.u.ax,'u.ax');
 if(index<9)return {kind:'audio-resource-request',method:'k.(Ljava/lang/String;)V+b',role:'stage-numbered',number:add(index,1),raw:'0x4ad6e',executed:false};
 if(index===9)return {kind:'audio-resource-request',method:'k.(Ljava/lang/String;)V+b',role:'stage-ten',raw:'0x4ada6',executed:false};
 return null;
}
function update(input,options={}){
 const c=context(input,options),{state,trace,effects}=c,m=state.map;
 if(integer(state.game?.controller?.controllerStateUK,'u.k')!==200)throw new TransitionContractError('k200 entry required');
 m.ad=add(integer(m.ad,'u.ad'),1);trace.push({raw:'0x4a43c',operation:'presentation-counter',ad:m.ad});
 if(m.ad===5){
  m.t=integer(m.an,'u.an');trace.push({raw:'0x4a486',operation:'palette-switch',palette:m.t});
  m.aA=paletteColor(m.t,options.paletteByte,trace,'0x4a4a4..0x4a4c6');
  // The called resource refresh repeats this numeric color selection before
  // allocating/loading images. Preserve the second selection, emit media work.
  m.aA=paletteColor(m.t,options.paletteByte,trace,'0x41292..0x412b4');
  effects.push({kind:'palette-resource-refresh',method:'u.(Z)V+a',args:[false],palette:m.t,color:m.aA,raw:'0x4a4d0',resourceBodyExecuted:false});
  return result(state,trace,effects,{phase:'k200-midpoint',presentationTickComplete:true,presentationFinished:false,nativeUpdateReturned:true,continuationRaw:'0x49e08'});
 }
 if(m.ad<=10)return result(state,trace,effects,{phase:'k200-wait',presentationTickComplete:true,presentationFinished:false,nativeUpdateReturned:true,continuationRaw:'0x49cf4'});
 state.game.controller.controllerStateUK=integer(m.aC,'u.aC');trace.push({raw:'0x4a468',operation:'restore-controller',controllerStateUK:m.aC});
 const audio=resumeAudioEffect(state);if(audio)effects.push(audio);
 trace.push({raw:'0x4a470',operation:'resume-audio-selector',requested:audio!==null});
 return result(state,trace,effects,{phase:'k200-finished',presentationTickComplete:true,presentationFinished:true,nativeUpdateReturned:true,continuationRaw:'0x49e08'});
}
module.exports=Object.freeze({TransitionContractError,setup,update,paletteColor,resumeAudioEffect});

},
"web/src/restoration-stage-policy.js":function(module,exports,require){
/* Functional dispatch recovered from one unauthenticated KTF candidate.
 * Evidence: docs/R74_STAGE_DISPATCH.md. This selects indices only: existing
 * authored geometry is a substitute, and no original map/mask/palette is here.
 * RNG A/B are explicit bounded-draw functions. Phase is never guessed.
 */
(function(root){'use strict';
// CON_STAGE category-0 mission indices, expressed as semantic one-based slots.
const ORDINARY_SLOTS=Object.freeze([2,3,4,6,7,9,10,11,12,14,15,17,18,19,21,23,25,26,27,29,30,32,33,35,36,37,40,42,43,44,46,48,50,51,53,54,57,59,60,61,63,64,67,68,70,71,72,74,75,76,78,79,82,83,85,86,88,89,91,93,94,95,97,98]);
function integer(value,min,max,name){
 if(!Number.isInteger(value)||value<min||value>max)throw new RangeError(name+' must be an integer in '+min+'..'+max);
 return value;
}
function draw(rng,count){
 if(typeof rng!=='function')throw new TypeError('explicit RNG function required');
 return integer(rng(count),0,count-1,'RNG result');
}
// Optional exact adapter for Java Math.abs(nextInt()) % max(1,n).
// MIN_VALUE can produce a negative index in the candidate. Keep that observable;
// selectors reject such an invalid bounded result instead of silently fixing it.
function nativeBoundedDraw(nextInt,count){
 integer(count,-2147483648,2147483647,'bound');
 if(typeof nextInt!=='function')throw new TypeError('nextInt required');
 const value=integer(nextInt(),-2147483648,2147483647,'nextInt result');
 const abs=value===-2147483648?value:Math.abs(value);
 const result=abs%Math.max(1,count);
 return Object.is(result,-0)?0:result;
}
function rejectPrevious(count,previous,rng,{maxDraws=Infinity}={}){
 integer(count,1,2147483647,'count');
 if(count===1&&previous===0)throw new RangeError('native rejection would never terminate for singleton previous 0');
 if(maxDraws!==Infinity)integer(maxDraws,1,2147483647,'maxDraws');
 for(let draws=0;draws<maxDraws;draws++){
  const index=draw(rng,count);
  if(index!==previous)return index;
 }
 throw new RangeError('rejection draw budget exhausted; no replacement index invented');
}
function selectStage({mode,selectedSlot,ordinal,previousVariant,previousGroup,firstSelection,rngA,rngB,maxDraws=Infinity}={}){
 integer(previousVariant,0,3,'previousVariant (native cold phase is not assumed)');
 if(typeof firstSelection!=='boolean')throw new TypeError('firstSelection must explicitly represent native u.u == 0');
 let group;
 if(mode==='ordinary'){
  integer(selectedSlot,0,99,'selectedSlot');integer(ordinal,0,63,'ordinal');
  group=firstSelection?ordinal:ordinal===0?0:rejectPrevious(ordinal+1,integer(previousGroup,0,63,'previousGroup'),rngA,{maxDraws});
 }else if(mode==='freePlay'){
  if(selectedSlot!==100)throw new RangeError('FreePlay native selectedSlot must be 100');
  group=firstSelection?draw(rngB,64):rejectPrevious(64,integer(previousGroup,0,63,'previousGroup'),rngA,{maxDraws});
 }else throw new RangeError('supported modes are ordinary and freePlay');
 const variant=(previousVariant+1)%4;
 return {group,variant,stageTableOffset:(group*4+variant)*9,geometrySource:'authored-substitute',originalGeometryRestored:false};
}
function initialPalette({mode,selectedSlot,rngB}={}){
 if(mode==='ordinary')return integer(selectedSlot,0,99,'selectedSlot');
 if(mode==='freePlay'&&selectedSlot===100)return draw(rngB,100);
 throw new RangeError('ordinary or FreePlay selectedSlot required');
}
function nextPalette({mode,selectedSlot,currentPalette,rngA,maxDraws=Infinity}={}){
 integer(currentPalette,0,99,'currentPalette');
 if(mode==='ordinary'){
  integer(selectedSlot,0,99,'selectedSlot');
  return selectedSlot===0?0:rejectPrevious(selectedSlot+1,currentPalette,rngA,{maxDraws});
 }
 if(mode==='freePlay'&&selectedSlot===100)return rejectPrevious(100,currentPalette,rngA,{maxDraws});
 throw new RangeError('ordinary or FreePlay selectedSlot required');
}
function rotateMaskCoordinate(x,y,orientation){
 integer(x,0,23,'x');integer(y,0,23,'y');integer(orientation,0,3,'orientation');
 return orientation===0?[y,23-x]:orientation===1?[23-x,23-y]:orientation===2?[23-y,x]:[x,y];
}
function initialCountdown({nativeRZa,rngA}={}){
 if(typeof nativeRZa!=='boolean')throw new TypeError('nativeRZa boolean required');
 return nativeRZa?1000000:150+draw(rngA,150);
}
// These are isolated native predicates, not the complete update scheduler.
// Keep expiry, l=1 dispatch, and palette commit as separate integration steps.
function countdownStep({remaining,nativeRT,nativeED,nativeUQ}={}){
 integer(remaining,-2147483648,2147483647,'remaining');
 integer(nativeRT,-2147483648,2147483647,'nativeRT');
 integer(nativeED,-2147483648,2147483647,'nativeED');
 integer(nativeUQ,-2147483648,2147483647,'nativeUQ');
 const next=nativeED!==13&&nativeRT===0?(remaining-1)|0:remaining;
 return {remaining:next,expiryPredicate:next < -29&&nativeED!==13&&nativeED!==16&&nativeUQ!==99};
}
const api=Object.freeze({ORDINARY_SLOTS,nativeBoundedDraw,rejectPrevious,selectStage,initialPalette,nextPalette,rotateMaskCoordinate,initialCountdown,countdownStep,
 scope:'one-unauthenticated-KTF-candidate',nativeColdPhase:'caller-required',originalGeometryRestored:false});
root.MongyuRestorationStagePolicy=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);

},
};
const edges={"experiments/r77-native-frame-driver/frame-driver.cjs":{"../r76-native-composition/composition.cjs":"experiments/r76-native-composition/composition.cjs","../r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs","../r76-native-input/input-action.cjs":"experiments/r76-native-input/input-action.cjs","../r76-native-cadence/native-cadence.cjs":"experiments/r76-native-cadence/native-cadence.cjs","../../evidence/r75-research/collision-native/collision_adapter.cjs":"evidence/r75-research/collision-native/collision_adapter.cjs","./native-t.cjs":"experiments/r77-native-frame-driver/native-t.cjs","./post-e.cjs":"experiments/r77-native-frame-driver/post-e.cjs","./boundary.cjs":"experiments/r77-native-frame-driver/boundary.cjs","../r77-native-actor-state/actor-state.cjs":"experiments/r77-native-actor-state/actor-state.cjs","../r77-native-goals/goals.cjs":"experiments/r77-native-goals/goals.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","../r77-native-trajectories/trajectories.cjs":"experiments/r77-native-trajectories/trajectories.cjs","./terrain-phase.cjs":"experiments/r77-native-frame-driver/terrain-phase.cjs","../r77-native-transition/transition.cjs":"experiments/r77-native-transition/transition.cjs","../r77-native-boss-finalization/finalization.cjs":"experiments/r77-native-boss-finalization/finalization.cjs","./map-ports.cjs":"experiments/r77-native-frame-driver/map-ports.cjs","../r77-native-boss-exit/boss-exit.cjs":"experiments/r77-native-boss-exit/boss-exit.cjs","../r77-native-render/parameters.cjs":"experiments/r77-native-render/parameters.cjs","../r77-native-boss-runtime/boss-runtime.cjs":"experiments/r77-native-boss-runtime/boss-runtime.cjs","../r77-native-alternate-frame/alternate-frame.cjs":"experiments/r77-native-alternate-frame/alternate-frame.cjs","../r77-native-q3-frame-own/q3-frame.cjs":"experiments/r77-native-q3-frame-own/q3-frame.cjs","../r77-native-boss-contact/boss-contact.cjs":"experiments/r77-native-boss-contact/boss-contact.cjs","../r75-procedural-geometry/entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs","../r75-procedural-geometry/entity-update.cjs":"experiments/r75-procedural-geometry/entity-update.cjs","../r77-native-boss-entities/boss-entities.cjs":"experiments/r77-native-boss-entities/boss-entities.cjs","../r77-native-q3-entities/q3-entities.cjs":"experiments/r77-native-q3-entities/q3-entities.cjs","../r77-native-entity-contact/entity-contact.cjs":"experiments/r77-native-entity-contact/entity-contact.cjs","../r77-native-render/frame-renderer.cjs":"experiments/r77-native-render/frame-renderer.cjs","../r77-native-mask-geometry/mask-geometry.cjs":"experiments/r77-native-mask-geometry/mask-geometry.cjs"},"experiments/r76-native-composition/composition.cjs":{"../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","../r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs","../r75-procedural-geometry/column-dynamics.cjs":"experiments/r75-procedural-geometry/column-dynamics.cjs","../../evidence/r75-research/collision-native/collision_adapter.cjs":"evidence/r75-research/collision-native/collision_adapter.cjs","../../evidence/r75-research/collision-native/airborne_adapter.cjs":"evidence/r75-research/collision-native/airborne_adapter.cjs"},"experiments/r75-procedural-geometry/native-rng.cjs":{},"experiments/r75-procedural-geometry/assembly.cjs":{"./geometry.cjs":"experiments/r75-procedural-geometry/geometry.cjs","./lifecycle.cjs":"experiments/r75-procedural-geometry/lifecycle.cjs"},"experiments/r75-procedural-geometry/geometry.cjs":{},"experiments/r75-procedural-geometry/lifecycle.cjs":{"./geometry.cjs":"experiments/r75-procedural-geometry/geometry.cjs"},"experiments/r75-procedural-geometry/column-dynamics.cjs":{"./lifecycle.cjs":"experiments/r75-procedural-geometry/lifecycle.cjs"},"evidence/r75-research/collision-native/collision_adapter.cjs":{},"evidence/r75-research/collision-native/airborne_adapter.cjs":{"./collision_adapter.cjs":"evidence/r75-research/collision-native/collision_adapter.cjs"},"experiments/r76-native-input/input-action.cjs":{"../r75-procedural-geometry/local-collision.cjs":"experiments/r75-procedural-geometry/local-collision.cjs","../../evidence/r75-research/collision-native/collision_adapter.cjs":"evidence/r75-research/collision-native/collision_adapter.cjs"},"experiments/r75-procedural-geometry/local-collision.cjs":{},"experiments/r76-native-cadence/native-cadence.cjs":{},"experiments/r77-native-frame-driver/native-t.cjs":{"../r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs"},"experiments/r77-native-frame-driver/post-e.cjs":{},"experiments/r77-native-frame-driver/boundary.cjs":{"../../evidence/r75-research/collision-native/boundary-transition.cjs":"evidence/r75-research/collision-native/boundary-transition.cjs","../r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","../r77-native-actor-state/actor-state.cjs":"experiments/r77-native-actor-state/actor-state.cjs","../r75-procedural-geometry/entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs"},"evidence/r75-research/collision-native/boundary-transition.cjs":{"../../../experiments/r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs","../../../experiments/r75-procedural-geometry/lifecycle.cjs":"experiments/r75-procedural-geometry/lifecycle.cjs","./q3-adapter.cjs":"evidence/r75-research/collision-native/q3-adapter.cjs"},"evidence/r75-research/collision-native/q3-adapter.cjs":{"./collision_adapter.cjs":"evidence/r75-research/collision-native/collision_adapter.cjs","./airborne_adapter.cjs":"evidence/r75-research/collision-native/airborne_adapter.cjs"},"experiments/r77-native-actor-state/actor-state.cjs":{"../r77-native-goals/goals.cjs":"experiments/r77-native-goals/goals.cjs"},"experiments/r77-native-goals/goals.cjs":{},"experiments/r75-procedural-geometry/entity-posthooks.cjs":{"./cell-entity-runtime.cjs":"experiments/r75-procedural-geometry/cell-entity-runtime.cjs"},"experiments/r75-procedural-geometry/cell-entity-runtime.cjs":{"./cell-factory.cjs":"experiments/r75-procedural-geometry/cell-factory.cjs"},"experiments/r75-procedural-geometry/cell-factory.cjs":{"./column-dynamics.cjs":"experiments/r75-procedural-geometry/column-dynamics.cjs"},"experiments/r77-native-trajectories/trajectories.cjs":{},"experiments/r77-native-frame-driver/terrain-phase.cjs":{"../r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs","../r75-procedural-geometry/column-dynamics.cjs":"experiments/r75-procedural-geometry/column-dynamics.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs"},"experiments/r77-native-transition/transition.cjs":{"../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs"},"experiments/r77-native-boss-finalization/finalization.cjs":{"../r77-native-goals/goals.cjs":"experiments/r77-native-goals/goals.cjs"},"experiments/r77-native-frame-driver/map-ports.cjs":{"../r77-native-map-setup/map-setup.cjs":"experiments/r77-native-map-setup/map-setup.cjs","../r77-native-map-setup/functional-providers.cjs":"experiments/r77-native-map-setup/functional-providers.cjs","./native-t.cjs":"experiments/r77-native-frame-driver/native-t.cjs","./post-e.cjs":"experiments/r77-native-frame-driver/post-e.cjs","../r77-native-actor-state/actor-state.cjs":"experiments/r77-native-actor-state/actor-state.cjs","../r75-procedural-geometry/entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs","../r75-procedural-geometry/entity-bounds.cjs":"experiments/r75-procedural-geometry/entity-bounds.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","../r77-native-mask-geometry/mask-geometry.cjs":"experiments/r77-native-mask-geometry/mask-geometry.cjs","./frame-driver.cjs":"experiments/r77-native-frame-driver/frame-driver.cjs","../r77-native-render/renderer.cjs":"experiments/r77-native-render/renderer.cjs","../r77-native-transition/transition.cjs":"experiments/r77-native-transition/transition.cjs","../r77-native-boss-setup/boss-setup.cjs":"experiments/r77-native-boss-setup/boss-setup.cjs"},"experiments/r77-native-map-setup/map-setup.cjs":{"../r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs","../r75-procedural-geometry/lifecycle.cjs":"experiments/r75-procedural-geometry/lifecycle.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","../../web/src/restoration-stage-policy.js":"web/src/restoration-stage-policy.js","../r75-procedural-geometry/cell-factory.cjs":"experiments/r75-procedural-geometry/cell-factory.cjs","../r75-procedural-geometry/cell-entity-runtime.cjs":"experiments/r75-procedural-geometry/cell-entity-runtime.cjs","../r77-native-boss-setup/boss-setup.cjs":"experiments/r77-native-boss-setup/boss-setup.cjs"},"web/src/restoration-stage-policy.js":{},"experiments/r77-native-boss-setup/boss-setup.cjs":{"../r77-native-boss-contact/boss-geometry.cjs":"experiments/r77-native-boss-contact/boss-geometry.cjs","../r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs","./initialization-facts.json":"experiments/r77-native-boss-setup/initialization-facts.json"},"experiments/r77-native-boss-contact/boss-geometry.cjs":{"./boss-regions.json":"experiments/r77-native-boss-contact/boss-regions.json","../r75-procedural-geometry/entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs"},"experiments/r77-native-boss-contact/boss-regions.json":{},"experiments/r77-native-boss-setup/initialization-facts.json":{},"experiments/r77-native-map-setup/functional-providers.cjs":{"./functional-metadata.json":"experiments/r77-native-map-setup/functional-metadata.json"},"experiments/r77-native-map-setup/functional-metadata.json":{},"experiments/r75-procedural-geometry/entity-bounds.cjs":{},"experiments/r77-native-mask-geometry/mask-geometry.cjs":{"./regions.json":"experiments/r77-native-mask-geometry/regions.json"},"experiments/r77-native-mask-geometry/regions.json":{},"experiments/r77-native-render/renderer.cjs":{"./capture.cjs":"experiments/r77-native-render/capture.cjs","./terrain.cjs":"experiments/r77-native-render/terrain.cjs","./parameters.cjs":"experiments/r77-native-render/parameters.cjs","./entity-renderer.cjs":"experiments/r77-native-render/entity-renderer.cjs","../r77-native-frame-driver/native-t.cjs":"experiments/r77-native-frame-driver/native-t.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs"},"experiments/r77-native-render/capture.cjs":{"../r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs"},"experiments/r77-native-render/terrain.cjs":{"../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","./parameters.cjs":"experiments/r77-native-render/parameters.cjs"},"experiments/r77-native-render/parameters.cjs":{"./parameters.json":"experiments/r77-native-render/parameters.json"},"experiments/r77-native-render/parameters.json":{},"experiments/r77-native-render/entity-renderer.cjs":{"../r75-procedural-geometry/entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs"},"experiments/r77-native-boss-exit/boss-exit.cjs":{"../r77-native-render/capture.cjs":"experiments/r77-native-render/capture.cjs","../r77-native-render/special-effects.cjs":"experiments/r77-native-render/special-effects.cjs","../r77-native-boss-contact/boss-geometry.cjs":"experiments/r77-native-boss-contact/boss-geometry.cjs","../r77-native-transition/transition.cjs":"experiments/r77-native-transition/transition.cjs"},"experiments/r77-native-render/special-effects.cjs":{"../r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs","../r75-procedural-geometry/entity-update.cjs":"experiments/r75-procedural-geometry/entity-update.cjs","../r77-native-boss-contact/boss-geometry.cjs":"experiments/r77-native-boss-contact/boss-geometry.cjs"},"experiments/r75-procedural-geometry/entity-update.cjs":{"./cell-entity-runtime.cjs":"experiments/r75-procedural-geometry/cell-entity-runtime.cjs","./entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs","./entity-bounds.cjs":"experiments/r75-procedural-geometry/entity-bounds.cjs"},"experiments/r77-native-boss-runtime/boss-runtime.cjs":{"../r75-procedural-geometry/entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs","../r75-procedural-geometry/entity-update.cjs":"experiments/r75-procedural-geometry/entity-update.cjs","../r75-procedural-geometry/cell-entity-runtime.cjs":"experiments/r75-procedural-geometry/cell-entity-runtime.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","../r77-native-actor-state/actor-state.cjs":"experiments/r77-native-actor-state/actor-state.cjs","../r77-native-boss-contact/boss-geometry.cjs":"experiments/r77-native-boss-contact/boss-geometry.cjs"},"experiments/r77-native-alternate-frame/alternate-frame.cjs":{"../r77-native-actor-state/actor-state.cjs":"experiments/r77-native-actor-state/actor-state.cjs","../r75-procedural-geometry/entity-update.cjs":"experiments/r75-procedural-geometry/entity-update.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","../r77-native-entity-contact/entity-contact.cjs":"experiments/r77-native-entity-contact/entity-contact.cjs","../r77-native-boss-contact/boss-contact.cjs":"experiments/r77-native-boss-contact/boss-contact.cjs"},"experiments/r77-native-entity-contact/entity-contact.cjs":{"../r75-procedural-geometry/entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs","../r75-procedural-geometry/cell-entity-runtime.cjs":"experiments/r75-procedural-geometry/cell-entity-runtime.cjs","../r75-procedural-geometry/entity-update.cjs":"experiments/r75-procedural-geometry/entity-update.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","../r77-native-actor-state/actor-state.cjs":"experiments/r77-native-actor-state/actor-state.cjs"},"experiments/r77-native-boss-contact/boss-contact.cjs":{"./boss-geometry.cjs":"experiments/r77-native-boss-contact/boss-geometry.cjs","../r75-procedural-geometry/entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs","../r75-procedural-geometry/cell-entity-runtime.cjs":"experiments/r75-procedural-geometry/cell-entity-runtime.cjs","../r77-native-entity-contact/entity-contact.cjs":"experiments/r77-native-entity-contact/entity-contact.cjs","../r77-native-actor-state/actor-state.cjs":"experiments/r77-native-actor-state/actor-state.cjs","../r77-native-trajectories/trajectories.cjs":"experiments/r77-native-trajectories/trajectories.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs"},"experiments/r77-native-q3-frame-own/q3-frame.cjs":{"../../evidence/r75-research/collision-native/q3-adapter.cjs":"evidence/r75-research/collision-native/q3-adapter.cjs","../../evidence/r75-research/collision-native/boundary-transition.cjs":"evidence/r75-research/collision-native/boundary-transition.cjs","../../evidence/r75-research/collision-native/collision_adapter.cjs":"evidence/r75-research/collision-native/collision_adapter.cjs","../../evidence/r75-research/collision-native/airborne_adapter.cjs":"evidence/r75-research/collision-native/airborne_adapter.cjs","../r76-native-input/q3-input-action.cjs":"experiments/r76-native-input/q3-input-action.cjs","../r77-native-actor-state/actor-state.cjs":"experiments/r77-native-actor-state/actor-state.cjs","../r77-native-trajectories/trajectories.cjs":"experiments/r77-native-trajectories/trajectories.cjs","../r77-native-mask-geometry/mask-geometry.cjs":"experiments/r77-native-mask-geometry/mask-geometry.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs"},"experiments/r76-native-input/q3-input-action.cjs":{"./input-action.cjs":"experiments/r76-native-input/input-action.cjs","../r75-procedural-geometry/local-collision.cjs":"experiments/r75-procedural-geometry/local-collision.cjs"},"experiments/r77-native-boss-entities/boss-entities.cjs":{"../r75-procedural-geometry/entity-update.cjs":"experiments/r75-procedural-geometry/entity-update.cjs","../r75-procedural-geometry/entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs","../r75-procedural-geometry/entity-bounds.cjs":"experiments/r75-procedural-geometry/entity-bounds.cjs","../r75-procedural-geometry/cell-entity-runtime.cjs":"experiments/r75-procedural-geometry/cell-entity-runtime.cjs","../r77-native-boss-contact/boss-geometry.cjs":"experiments/r77-native-boss-contact/boss-geometry.cjs"},"experiments/r77-native-q3-entities/q3-entities.cjs":{"../r75-procedural-geometry/entity-update.cjs":"experiments/r75-procedural-geometry/entity-update.cjs","../r75-procedural-geometry/entity-posthooks.cjs":"experiments/r75-procedural-geometry/entity-posthooks.cjs","../r75-procedural-geometry/entity-bounds.cjs":"experiments/r75-procedural-geometry/entity-bounds.cjs","../r77-native-mask-geometry/mask-geometry.cjs":"experiments/r77-native-mask-geometry/mask-geometry.cjs"},"experiments/r77-native-render/frame-renderer.cjs":{"./capture.cjs":"experiments/r77-native-render/capture.cjs","./terrain.cjs":"experiments/r77-native-render/terrain.cjs","./parameters.cjs":"experiments/r77-native-render/parameters.cjs","./entity-renderer.cjs":"experiments/r77-native-render/entity-renderer.cjs","./background.cjs":"experiments/r77-native-render/background.cjs","./actor-renderer.cjs":"experiments/r77-native-render/actor-renderer.cjs","./special-effects.cjs":"experiments/r77-native-render/special-effects.cjs","../r77-native-frame-driver/native-t.cjs":"experiments/r77-native-frame-driver/native-t.cjs","../r77-native-trajectories/trajectories.cjs":"experiments/r77-native-trajectories/trajectories.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","../r77-native-boss-finalization/finalization.cjs":"experiments/r77-native-boss-finalization/finalization.cjs"},"experiments/r77-native-render/background.cjs":{"./parameters.cjs":"experiments/r77-native-render/parameters.cjs"},"experiments/r77-native-render/actor-renderer.cjs":{},"experiments/r77-native-goals/settings-credit.cjs":{},"experiments/r77-native-goals/attempt-entry.cjs":{"./goals.cjs":"experiments/r77-native-goals/goals.cjs"},"experiments/r77-native-frame-driver/fixture.cjs":{"../r76-native-composition/composition.cjs":"experiments/r76-native-composition/composition.cjs","../r75-procedural-geometry/assembly.cjs":"experiments/r75-procedural-geometry/assembly.cjs","../r75-procedural-geometry/native-rng.cjs":"experiments/r75-procedural-geometry/native-rng.cjs","../r77-native-transition/transition.cjs":"experiments/r77-native-transition/transition.cjs","../r77-native-render/parameters.cjs":"experiments/r77-native-render/parameters.cjs"}},cache=Object.create(null);

function load(id){if(cache[id])return cache[id].exports;if(!factories[id])throw Error('Unknown native module '+id);const module={exports:{}};cache[id]=module;factories[id](module,module.exports,name=>{const target=edges[id][name];if(!target)throw Error('Unlisted dependency '+name);return load(target)});return module.exports;}

root.MongyuNativeKernels=Object.freeze({"Driver":load("experiments/r77-native-frame-driver/frame-driver.cjs"),"SettingsCredit":load("experiments/r77-native-goals/settings-credit.cjs"),"Entry":load("experiments/r77-native-goals/attempt-entry.cjs"),"Fixture":load("experiments/r77-native-frame-driver/fixture.cjs"),"Assembly":load("experiments/r75-procedural-geometry/assembly.cjs"),"Trajectories":load("experiments/r77-native-trajectories/trajectories.cjs"),"MapSetup":load("experiments/r77-native-map-setup/map-setup.cjs"),"MapProviders":load("experiments/r77-native-map-setup/functional-providers.cjs"),"MapPorts":load("experiments/r77-native-frame-driver/map-ports.cjs"),"Mask":load("experiments/r77-native-mask-geometry/mask-geometry.cjs")});
root.MongyuNativeRenderParameters=Object.freeze(load("experiments/r77-native-render/parameters.cjs")); // R86 read-only render parameters binding
})(globalThis);
