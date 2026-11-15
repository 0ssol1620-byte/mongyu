/* R86: bounded recovery for an observed spawn-separation cycle. This is an
 * authored stability fix for a formerly unsupported path, not native parity.
 */
(function(root){'use strict';
let repairs=0;const recent=[];
function escapeOverlap(entity,{geometry,actor},valid){
 const half=Math.trunc(((entity.i<<3)+48)/2),x=geometry.position+(actor.direction===1?4:-4),y=actor.height+16,span=geometry.N*16;
 const candidates=[{n:x-half-1,o:entity.o},{n:x+half+1,o:entity.o},{n:entity.n,o:y+half+1},{n:entity.n,o:y-half-1}];
 const allowed=p=>p.n>=0&&p.n<span&&p.o>=0&&p.o<=span&&valid(p.n,p.o);
 let choices=candidates.filter(allowed);
 // A rare large entity can cover all four immediate exits. Bound the search to
 // existing columns and place above their actual surface, never through it.
 if(!choices.length)for(let col=0;col<geometry.N;col++){
  const p={n:col*16+8,o:Math.max(0,geometry.c[col])+half+17};if(allowed(p))choices.push(p);
 }
 if(!choices.length)return false;
 choices.sort((a,b)=>(a.n-entity.n)**2+(a.o-entity.o)**2-((b.n-entity.n)**2+(b.o-entity.o)**2));
 const from={n:entity.n,o:entity.o},to=choices[0];entity.n=to.n;entity.o=to.o;repairs++;
 recent.push({from,to:{...to},reason:'spawn separation repeated a position; minimum valid non-overlap exit'});if(recent.length>16)recent.shift();return true;
}
const api={escapeOverlap,inspect:()=>({repairs,recent:recent.map(r=>({reason:r.reason,from:{...r.from},to:{...r.to}}))})};root.MongyuNativeStability=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
