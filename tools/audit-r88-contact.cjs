/* Authored display audit: ordinary inputs, finite ground/corner sample coverage.
 * No health, position, score, RNG or campaign progress edits. Not original-game equivalence.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
for(const f of ['state-clone','native-stability','native-kernels','native-restoration-run','restoration-catalog','presentation-runtime','mobile-presentation','native-scene'])require('../web/src/'+f+'.js');
const N=MongyuNativeRestoration,C=MongyuRestorationCatalog,P=MongyuPresentation,M=MongyuMobile,S=MongyuNativeScene,rows=[];
function inspect(g){const q=g.player,b=M.actorBasis(q),size=q.bodyHeight/43.5,rects=g.nativeScene.groups.flatMap(g=>g.cells).filter(c=>c.role==='terrain-cell'&&!/^0x4c/.test(c.raw)).map(c=>S.tileBounds(c,g.nativeScene));
 for(const leg of M.gait(0,q).legs){const points=leg.map(([x,y])=>({x:q.x+(x*b.tx-y*b.sign*b.ty)*size,y:q.y+(x*b.ty+y*b.sign*b.tx)*size}));
  for(let n=1;n<3;n++)for(let j=1;j<40;j++){const a=points[n-1],b=points[n],p={x:a.x+(b.x-a.x)*j/40,y:a.y+(b.y-a.y)*j/40},cell=rects.find(c=>p.x>c.x+2.5&&p.x<c.x+13.5&&p.y>c.y+2.5&&p.y<c.y+13.5);if(cell)return{point:p,cell,face:q.face,direction:q.direction,turnProgress:q.turnProgress};}
 }return null;
}
for(const slot of C.slots){if(!N.slotMetadata(slot.number).supported)continue;const r=new N.RestorationRun({slot,period:'noon',settings:{speed:'fast'}});r.start();const row={slot:slot.number,ground:0,corners:0,errors:[]};
 for(let i=0;i<220&&r.state==='play';i++){
  if(i%7===0)r.action();P.advance(r,.075);const g=P.geometry(r,{reduced:true}),q=g.player,s=g.nativeScene;
  if(s.countdown||s.transition||s.split||g.boss||q.nativeState!==0||q.height>0)continue;
  row.ground++;const hit=inspect(g);if(hit)row.errors.push({update:r.updates,...hit});
  for(const alpha of [.1,.25,.5,.75,.9]){r.remainder=r.stepMs*alpha;const mid=P.geometry(r,{});if(!mid.player.turning||mid.player.height>0)continue;row.corners++;const hit=inspect(mid);if(hit)row.errors.push({update:r.updates,alpha,...hit})}r.remainder=0;
 }rows.push(row);
}
const report={scope:'74 isolated native entries, seed 7, noon, fast, up to 220 updates, action every seven updates. Ground poses and five intermediate samples of reached grounded corners. Segment centrelines tested against the inner 11x11 units of visible 16-unit terrain cells. Does not certify all possible runs, stroke-edge overlap, whole-body clearance or original-game equivalence.',slots:rows.length,groundPoses:rows.reduce((n,r)=>n+r.ground,0),cornerPoses:rows.reduce((n,r)=>n+r.corners,0),intersections:rows.reduce((n,r)=>n+r.errors.length,0),rows};
const output=path.resolve(process.argv[2]||'evidence/r88-contact-audit.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({slots:report.slots,groundPoses:report.groundPoses,cornerPoses:report.cornerPoses,intersections:report.intersections}));assert.equal(report.intersections,0,'visible terrain intersects planted legs; see '+output);
