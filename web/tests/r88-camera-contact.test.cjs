const test=require('node:test'),assert=require('node:assert/strict');
require('../src/state-clone.js');require('../src/native-stability.js');require('../src/native-kernels.js');
const N=require('../src/native-restoration-run.js'),C=require('../src/restoration-catalog.js'),P=require('../src/presentation-runtime.js'),M=require('../src/mobile-presentation.js'),Scene=require('../src/native-scene.js');
const cases=[[2,30],[3,70],[3,131],[4,154],[12,91],[12,126],[18,136],[48,123]];
function encounter(slot,steps){const r=new N.RestorationRun({slot:C.getSlot(slot),period:'noon',settings:{speed:'fast'}});r.start();for(let i=0;i<steps;i++){if(i%7===0)r.action();P.advance(r,.075);P.geometry(r,{})}return r}
const close=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-7,`${label}: ${a} != ${b}`);
function painter(){let matrix=[1,0,0,1,0,0],path=[],stack=[];const strokes=[],ellipses=[],fills=[];
 const mul=t=>{const [a,b,c,d,e,f]=matrix,[g,h,i,j,k,l]=t;matrix=[a*g+c*h,b*g+d*h,a*i+c*j,b*i+d*j,a*k+c*l+e,b*k+d*l+f]},point=(x,y)=>({x:matrix[0]*x+matrix[2]*y+matrix[4],y:matrix[1]*x+matrix[3]*y+matrix[5]});
 const c={globalAlpha:1,strokes,ellipses,fills,save(){stack.push([...matrix])},restore(){matrix=stack.pop()},translate(x,y){mul([1,0,0,1,x,y])},rotate(a){mul([Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0])},scale(x,y){mul([x,0,0,y,0,0])},quadraticCurveTo(){},bezierCurveTo(){},closePath(){},beginPath(){path=[]},moveTo(x,y){path.push(point(x,y))},lineTo(x,y){path.push(point(x,y))},stroke(){strokes.push({width:c.lineWidth,points:path.slice()})},ellipse(x,y){ellipses.push(point(x,y))},fill(){fills.push(path.slice())}};return c;
}
function headPoint(c){const points=c.fills.at(-1);assert.ok(points&&points.length>=3,'actual filled head contour');return {x:points.reduce((n,p)=>n+p.x,0)/points.length,y:points.reduce((n,p)=>n+p.y,0)/points.length}}
function rigStrokes(q){const basis=M.actorBasis(q),size=(q.bodyHeight||60)/43.5;return M.gait(0,q,false).legs.map(leg=>({points:leg.map(([x,y])=>({x:q.x+(x*basis.tx-y*basis.nx)*size,y:q.y+(x*basis.ty-y*basis.ny)*size}))}))}
test('the displayed body centre stays at the viewport centre on both directions and every turn angle',()=>{
 const reference=painter();M.sprite(reference,{x:0,y:0,renderAngle:0,direction:0,bodyHeight:43.5},{},false);const localHeadX=headPoint(reference).x;
 for(const [width,height]of [[390,844],[844,390],[320,568],[800,1280]])for(const direction of [0,1])for(let degree=0;degree<360;degree++){
  const angle=degree*Math.PI/180,q={x:140+degree,y:300-degree/2,renderAngle:angle,direction,bodyHeight:42.5},g={nativeRuntime:true,player:q},cam=M.camera({width,height},g,{},{}),c=painter();M.sprite(c,q,{},false);const head=headPoint(c);
  // The centre target is halfway between the contact anchor and the body's height.
  const normal={x:(head.x-q.x)-localHeadX*Math.cos(angle)*42.5/43.5,y:(head.y-q.y)-localHeadX*Math.sin(angle)*42.5/43.5},length=Math.hypot(normal.x,normal.y);
  close((q.x+normal.x/length*21.25)*cam.scale+cam.offsetX,width/2,'body x');close((q.y+normal.y/length*21.25)*cam.scale+cam.offsetY,height/2,'body y');
  assert.equal(cam.zoom,1);assert.equal(cam.scale,Math.min(width/384,height/384));
  assert.deepEqual(M.camera({width,height},{...g,companion:{x:-900,y:900}}, {},{}),cam,'dog cannot pull camera away from player');
 }
});
test('normal-input ground poses put the head above the supporting face in all eight face/direction combinations',()=>{
 const found=new Set();for(const [slot,steps]of cases){const r=encounter(slot,steps),before=structuredClone(r.nativeFrame),q=Scene.geometry(r).player,c=painter();assert.equal(q.height,0);assert.equal(q.nativeState,0);M.sprite(c,q,{},false);const h=headPoint(c),face=r.nativeFrame.game.pool.objects[r.nativeFrame.game.pool.currentIndex].geometry.orientation,normal=[{x:0,y:-1},{x:-1,y:0},{x:0,y:1},{x:1,y:0}][face];
  assert.ok((h.x-q.x)*normal.x+(h.y-q.y)*normal.y>30,`body faces into tiles at slot ${slot}`);found.add(face+'/'+r.nativeFrame.game.pool.direction);assert.deepEqual(r.nativeFrame,before);
 }assert.equal(found.size,8);
});
test('fixed mask tiles occupy their collision-grid cells, and leg rig centrelines stay outside those cells',()=>{
 let checked=0;for(const [slot,steps]of cases){const r=encounter(slot,steps);if(r.nativeFrame.game.stage.behaviorCode!==3)continue;const g=Scene.geometry(r),scene=Scene.snapshot(r),cells=scene.groups.flatMap(group=>group.cells).filter(c=>c.raw==='0x5113a'),rects=cells.map(c=>Scene.tileBounds(c,scene)),c=painter();
  for(let i=0;i<cells.length;i++){close(rects[i].x,cells[i].x-8,'mask left');close(rects[i].y,cells[i].y-8,'mask top');assert.ok(r.kernels.Mask.maskCell(r.nativeFrame.map.ae,cells[i].x/16-.5,cells[i].y/16-.5));}
  M.sprite(c,g.player,{poseTime:0,contrast:true},false);const legs=rigStrokes(g.player);assert.equal(legs.length,2);
  for(const leg of legs)for(let n=1;n<leg.points.length;n++){const a=leg.points[n-1],b=leg.points[n];for(let k=0;k<=40;k++){const x=a.x+(b.x-a.x)*k/40,y=a.y+(b.y-a.y)*k/40;assert.equal(rects.some(r=>x>r.x+.5&&x<r.x+15.5&&y>r.y+.5&&y<r.y+15.5),false,`leg inside mask at slot ${slot}: ${x},${y}`)}}checked++;
 }assert.ok(checked>=4);
});
test('reverse airborne corners keep the inward normal separate from forward motion',()=>{
 const p={x:-8,y:-10,height:10,tangent:{x:1,y:0},inward:{x:0,y:-1},direction:1,face:0,nativeState:3},q={x:12,y:24,height:12,tangent:{x:0,y:1},inward:{x:1,y:0},direction:1,face:1,nativeState:3};
 // A reversed local frame has the opposite normal from the movement tangent.
 p.inward={x:0,y:1};p.y=10;q.inward={x:-1,y:0};q.x=-12;
 for(const alpha of [0,.25,.5,.75,1]){const v=P.interpolatePlayer(p,q,alpha);assert.equal(v.direction,1);close(v.inward.x,-Math.sin(v.renderAngle),'normal x');close(v.inward.y,Math.cos(v.renderAngle),'normal y');}
 const p2={...p,direction:0};assert.deepEqual(P.interpolatePlayer(p2,q,.5),q,'a direction reversal must mirror rather than sweep through the floor');
});
test('ordinary morphs and floating stages retain player tracking and scale; boss and split layouts retain their arena',()=>{
 const data=require('./r86-morph-fixture.json'),r=new N.RestorationRun({slot:C.getSlot(data.checkpoint.frame.r.slot+1),nativeFrame:data.checkpoint.frame,frameProvenance:data.provenance,settings:{speed:'fast'}});r.start();const g=P.geometry(r,{}),viewport={width:390,height:844};
 const context=new Proxy({globalAlpha:1},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 for(const remainder of [10,60]){r.remainder=remainder;const out=Scene.draw(context,r,{viewport},g);assert.equal(out.camera.follow,true);assert.equal(out.camera.scale,390/384);const u=(g.nativeScene.transition.step-1+remainder/r.stepMs)/10,q=Scene.morphPlayer(g,g.nativeScene,u),normal=M.actorBasis(q);close((q.x+normal.nx*21.25)*out.camera.scale+out.camera.offsetX,195,'morph centre x');close((q.y+normal.ny*21.25)*out.camera.scale+out.camera.offsetY,422,'morph centre y');}
 const flat={...g,nativeScene:{...g.nativeScene,transition:null,floating:true,groups:[],backgrounds:[]}};assert.equal(Scene.draw(context,r,{viewport},flat).camera.follow,true);
 const boss={...flat,boss:{maxHp:1,hp:1}};assert.equal(Scene.draw(context,r,{viewport},boss).camera.follow,false);
 const split={...flat,nativeScene:{...flat.nativeScene,split:true}};assert.equal(Scene.draw(context,r,{viewport},split).camera.follow,false);
});

test('stairs shorten or lift planted legs without changing either rigid link length or native state',()=>{
 for(const [slot,steps]of [[7,66],[14,42],[6,42],[21,34],[25,90]]){
  const r=encounter(slot,steps),before=structuredClone(r.nativeFrame),g=P.geometry(r,{reduced:true}),scene=g.nativeScene,rects=scene.groups.flatMap(g=>g.cells).filter(c=>c.role==='terrain-cell'&&!/^0x4c/.test(c.raw)).map(c=>Scene.tileBounds(c,scene)),c=painter();M.sprite(c,g.player,{contrast:true},false);
  for(const leg of rigStrokes(g.player))for(let n=1;n<3;n++){const a=leg.points[n-1],b=leg.points[n];close(Math.hypot(b.x-a.x,b.y-a.y),11*42.5/43.5,'rigid link');for(let k=0;k<=40;k++){const x=a.x+(b.x-a.x)*k/40,y=a.y+(b.y-a.y)*k/40;assert.equal(rects.some(r=>x>r.x+2.5&&x<r.x+13.5&&y>r.y+2.5&&y<r.y+13.5),false,'leg passes through step at slot '+slot)}}
  assert.deepEqual(r.nativeFrame,before);
 }
});
test('free-rotation poses consume the actual native actor orientation and anchor',()=>{
 const r=encounter(57,0),orientations=new Set();for(let i=0;i<180&&r.state==='play';i++){
  if(i%7===0)r.action();P.advance(r,.075);const command=r.nativeFrame.map.drawCommands.find(c=>c.role==='current-actor');if(!command)continue;const before=structuredClone(r.nativeFrame),g=Scene.geometry(r),angle=-command.variantOrientation*Math.PI/2,origin=r.nativeFrame.presentation.viewport;
  close(g.player.x,(command.x-origin.x)*1.6+8*Math.sin(angle),'free anchor x');close(g.player.y,(command.y-origin.y)*1.6-8*Math.cos(angle),'free anchor y');orientations.add(command.variantOrientation);const c=painter();M.sprite(c,g.player,{},false);const h=headPoint(c);assert.ok((h.x-g.player.x)*Math.sin(angle)-(h.y-g.player.y)*Math.cos(angle)>30);assert.deepEqual(r.nativeFrame,before);
 }assert.equal(orientations.size,4);
});

test('actual intermediate grounded corners keep leg paths out of both adjoining walls',()=>{
 for(const [slot,steps,alpha]of [[15,147,.1],[19,188,.1],[19,188,.25],[19,211,.1],[33,147,.1],[33,147,.25],[78,49,.1]]){
  const r=encounter(slot,steps);r.remainder=r.stepMs*alpha;const g=P.geometry(r,{}),rects=g.nativeScene.groups.flatMap(g=>g.cells).filter(c=>c.role==='terrain-cell'&&!/^0x4c/.test(c.raw)).map(c=>Scene.tileBounds(c,g.nativeScene)),c=painter();assert.equal(g.player.turning,true);M.sprite(c,g.player,{contrast:true},false);
  for(const leg of rigStrokes(g.player))for(let n=1;n<3;n++)for(let k=1;k<40;k++){const a=leg.points[n-1],b=leg.points[n],x=a.x+(b.x-a.x)*k/40,y=a.y+(b.y-a.y)*k/40;assert.equal(rects.some(r=>x>r.x+2.5&&x<r.x+13.5&&y>r.y+2.5&&y<r.y+13.5),false,'corner leg intersects slot '+slot)}
 }
});
