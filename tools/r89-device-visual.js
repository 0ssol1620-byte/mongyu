/* Injected only by QA. Independent encounters never change the active run or saved progress. */
window.__mongyuQaPose=({slot,steps})=>{
 const r=new MongyuNativeRestoration.RestorationRun({slot:MongyuRestorationCatalog.getSlot(slot),period:'noon',settings:{speed:'fast'}});r.start();
 for(let i=0;i<steps;i++){if(i%7===0)r.action();MongyuPresentation.advance(r,.075);MongyuPresentation.geometry(r,{})}r.remainder=r.stepMs*(1-1e-8);
 let canvas=document.getElementById('mongyuQaVisual');if(!canvas){canvas=document.createElement('canvas');canvas.id='mongyuQaVisual';canvas.style='position:fixed;inset:0;z-index:2147483647;width:100vw;height:100vh';document.body.append(canvas)}
 canvas.width=innerWidth;canvas.height=innerHeight;const ctx=canvas.getContext('2d'),g=MongyuPresentation.geometry(r,{}),result=MongyuNativeScene.draw(ctx,r,{viewport:{width:innerWidth,height:innerHeight},presentationTime:steps*.075},g);
 const cam=result.camera,basis=MongyuMobile.actorBasis(g.player),centre={x:(g.player.x+basis.nx*21.25)*cam.scale+cam.offsetX,y:(g.player.y+basis.ny*21.25)*cam.scale+cam.offsetY},cells=g.nativeScene.groups.flatMap(g=>g.cells).filter(c=>c.role==='terrain-cell'&&!/^0x4c/.test(c.raw)).map(c=>MongyuNativeScene.tileBounds(c,g.nativeScene));
 // Isolate the two production filled leg components, using their actual curves.
 // No substituted skeleton or invisible geometry enters this pixel audit.
 const mask=document.createElement('canvas');mask.width=innerWidth*3;mask.height=innerHeight*3;const m=mask.getContext('2d'),fill=m.fill.bind(m);let fills=0;
 m.fill=function(...args){if(++fills<=2)fill(...args)};m.stroke=()=>{};m.scale(3,3);m.translate(cam.offsetX,cam.offsetY);m.scale(cam.scale,cam.scale);MongyuMobile.sprite(m,g.player,{ink:'#ffffff'},false,g.characterId);
 const pixels=m.getImageData(0,0,mask.width,mask.height).data;let intersections=0,legPixels=0;
 for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){if(pixels[(y*mask.width+x)*4+3]<128)continue;legPixels++;const wx=((x+.5)/3-cam.offsetX)/cam.scale,wy=((y+.5)/3-cam.offsetY)/cam.scale;if(cells.some(c=>wx>c.x+2.5&&wx<c.x+13.5&&wy>c.y+2.5&&wy<c.y+13.5))intersections++}

 return {slot,steps,direction:r.nativeFrame.game.pool.direction,face:g.player.face,state:g.player.nativeState,phase:result.nativePhase,legFills:Math.min(fills,2),legPixels,intersections,centreError:Math.hypot(centre.x-innerWidth/2,centre.y-innerHeight/2)};
};
true;
