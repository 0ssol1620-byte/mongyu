/* R68: observed sun-like silhouette and black/white field.
   Coordinates, contacts, timing, and color equivalence are authored hypotheses. */
(function(root){'use strict';
const Base=root.MongyuAlienEncounter?.AlienRun||(typeof require==='function'?require('./encounter-alien.js').AlienRun:null);
const rows=['    # #    ','    ###    ','  #     #  ','##       ##',' #  # #  # ',' #       # ','##       ##','  #     #  ','    ###    ','    # #    '];
class SunRun extends Base{
 constructor(options={}){super({...options,policy:'human-air-contact'});}
 actor(time){const a=super.actor(time);return{...a,dogCells:[]};}
 body(time=this.time){
  const arena=this.arena(),cx=Math.max(arena.left+130,Math.min(arena.right-130,this.width*.72+Math.sin(time*.63)*12)),cy=Math.max(arena.top+122,Math.min(this.floor-235,this.height*.30+Math.sin(time*.43)*12)),x=cx-110,y=cy-100,cells=[];
  rows.forEach((row,j)=>[...row].forEach((mark,i)=>{if(mark==='#')cells.push({id:'sun'+j+'-'+i,x:x+i*20,y:y+j*20,w:17,h:17});}));
  return{x:cx,y:cy,cells,arena,hurt:time<this.hurtUntil};
 }
 spawn(){
  const b=this.body(),cell=b.cells.find(c=>c.id==='sun3-0'),color=this.volley%2?'#111118':'#ffffff',x=cell.x-9,y=cell.y+cell.h/2,targetY=this.floor-130,flight=1.8;
  this.add({x,y,vx:(this.playerX-x)/flight,vy:(targetY-y)/flight,color});
  if(this.volley%2===1){const top=b.cells[0];this.add({x:top.x+top.w/2,y:top.y-9,vx:-120,vy:-165,color:color==='#ffffff'?'#111118':'#ffffff'});}
  this.nextSpawn+=[3.4,2.8,3.8,3.1][this.volley%4];this.volley++;this.emit('spawn',{color,origin:{x,y},cell:cell.id});
 }
}
root.MongyuSunEncounter={SunRun};if(typeof module!=='undefined')module.exports=root.MongyuSunEncounter;
})(typeof globalThis!=='undefined'?globalThis:this);
