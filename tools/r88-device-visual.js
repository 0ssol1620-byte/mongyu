/* Injected only by QA. Independent encounters never change the active run or saved progress. */
window.__mongyuQaPose=({slot,steps})=>{
 const r=new MongyuNativeRestoration.RestorationRun({slot:MongyuRestorationCatalog.getSlot(slot),period:'noon',settings:{speed:'fast'}});r.start();
 for(let i=0;i<steps;i++){if(i%7===0)r.action();MongyuPresentation.advance(r,.075);MongyuPresentation.geometry(r,{})}r.remainder=r.stepMs*(1-1e-8);
 let canvas=document.getElementById('mongyuQaVisual');if(!canvas){canvas=document.createElement('canvas');canvas.id='mongyuQaVisual';canvas.style='position:fixed;inset:0;z-index:2147483647;width:100vw;height:100vh';document.body.append(canvas)}
 canvas.width=innerWidth;canvas.height=innerHeight;const ctx=canvas.getContext('2d'),strokes=[];let path=[];
 const originals=Object.fromEntries(['beginPath','moveTo','lineTo','stroke'].map(k=>[k,ctx[k]])),record=(x,y)=>{const p=ctx.getTransform().transformPoint({x,y});path.push({x:p.x,y:p.y})};
 ctx.beginPath=function(...args){path=[];return originals.beginPath.apply(this,args)};ctx.moveTo=function(x,y){record(x,y);return originals.moveTo.call(this,x,y)};ctx.lineTo=function(x,y){record(x,y);return originals.lineTo.call(this,x,y)};ctx.stroke=function(...args){if(Math.abs(this.lineWidth-3.1)<1e-4)strokes.push(path.slice());return originals.stroke.apply(this,args)};
 const g=MongyuPresentation.geometry(r,{});let result;try{result=MongyuNativeScene.draw(ctx,r,{viewport:{width:innerWidth,height:innerHeight},presentationTime:steps*.075},g)}finally{Object.assign(ctx,originals)}
 const cam=result.camera,basis=MongyuMobile.actorBasis(g.player),centre={x:(g.player.x+basis.nx*21.25)*cam.scale+cam.offsetX,y:(g.player.y+basis.ny*21.25)*cam.scale+cam.offsetY},cells=g.nativeScene.groups.flatMap(g=>g.cells).filter(c=>c.role==='terrain-cell'&&!/^0x4c/.test(c.raw)).map(c=>MongyuNativeScene.tileBounds(c,g.nativeScene));let intersections=0;
 for(const stroke of strokes){const points=stroke.map(p=>({x:(p.x-cam.offsetX)/cam.scale,y:(p.y-cam.offsetY)/cam.scale}));for(let n=1;n<points.length;n++)for(let i=1;i<40;i++){const a=points[n-1],b=points[n],x=a.x+(b.x-a.x)*i/40,y=a.y+(b.y-a.y)*i/40;if(cells.some(c=>x>c.x+2.5&&x<c.x+13.5&&y>c.y+2.5&&y<c.y+13.5))intersections++}}
 return {slot,steps,direction:r.nativeFrame.game.pool.direction,face:g.player.face,state:g.player.nativeState,phase:result.nativePhase,legStrokes:strokes.length,intersections,centreError:Math.hypot(centre.x-innerWidth/2,centre.y-innerHeight/2)};
};
true;
