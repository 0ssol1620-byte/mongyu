/* Original painted scenery and hand-shaped vector gameplay. No external network assets or reference-game bytes. */
(function(root){'use strict';
const GAMEPLAY_SCALE=.75;
// Square-cell edition: original code-native compositions, no recovered game art.
// The painted R11 experiment is retained behind an explicit opt-in only.
let artStyle='square-cells';
function setArtStyle(value){artStyle=value==='painted-experiment'?value:'square-cells';return artStyle}
const cellPalettes=[
 {bg:'#69DBDF',deep:'#2198BC',light:'#DDF7C5',accent:'#E4ED48',ink:'#18363D',danger:'#B53D69',actorInk:'#18363D'},
 {bg:'#EEA4CA',deep:'#B75A9D',light:'#FFE7B5',accent:'#E5EF78',ink:'#45213F',danger:'#8D285C',actorInk:'#45213F'},
 {bg:'#EEE16D',deep:'#DB9655',light:'#FFF4C1',accent:'#CC76A3',ink:'#483346',danger:'#A63F66',actorInk:'#483346'},
 {bg:'#92C9B9',deep:'#408D8F',light:'#EAF2CE',accent:'#DFB2D9',ink:'#243B49',danger:'#B03C68',actorInk:'#243B49'}
];
function cellPalette(chapter=0){return cellPalettes[((chapter|0)%4+4)%4]}
function squareWorld(c,{x=16,y=80,w=328,h=328,time=0,reduced=false,variant=0,chapter=0,morph=0,layout=null}={}){
 const p=cellPalette(chapter),t=reduced?0:time,form=(variant|0)%4,N=layout===null?29:25+2*(Math.floor(layout/10)%4),half=(N-1)/2,step=Math.min(w,h)/N;
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.fillStyle=p.bg;c.fillRect(x,y,w,h);
 // Large flat square planes and sparse fine cells coexist: no uniform confetti.
 const planes=[[[.12,.14,.33],[.56,.53,.28]],[[.28,.25,.44],[.12,.65,.18]],[[.13,.14,.29],[.57,.14,.29],[.13,.57,.29],[.57,.57,.29]],[[.08,.17,.25],[.35,.39,.28],[.65,.61,.22]]][chapter%4];
 const slots=layout===null?planes:Array.from({length:2+(layout%10)%5},(_,i)=>{const slot=layout%10,ch=Math.floor(layout/10),size=.14+((slot+i*3)%4)*.045;return [.1+((i*(slot+2)+ch*3)%11)*.055,.1+((i*3+slot+ch*2)%11)*.055,size]});
 for(const [i,q]of slots.entries()){c.fillStyle=i%2?p.light:p.deep;c.fillRect(x+q[0]*w,y+q[1]*h,q[2]*w,q[2]*h)}
 // Every point is the same square cell throughout a transition; delayed motion
 // redistributes it, rather than crossfading two backgrounds or spinning a camera.
 for(let row=0;row<N;row++)for(let col=0;col<N;col++){
  const u=(col-half)/half,v=(row-half)/half,r=Math.hypot(u,v),seed=col*1.73+row*2.39;
  const ripple=reduced?0:Math.sin(t*.55-r*5+seed*.13),flow=reduced?0:Math.sin(t*.29+v*4);
  const sample=f=>{let mask,dx=0,dy=0,band;
   if(f===0){const wave=Math.sin(u*6+v*2+t*.22)*.22;band=Math.floor((v-wave+1)*7);mask=Math.abs(v-wave)<.7&&Math.abs(u)<.88;dx=Math.sin(v*7+t*.32)*step*.65;dy=wave*step*1.4;}
   else if(f===1){const petal=Math.cos(Math.atan2(v,u)*4+t*.1)*.1;band=Math.floor((r+petal)*10);mask=r<.88+petal&&r>.19;dx=u*ripple*step;dy=v*ripple*step;}
   else if(f===2){const a=Math.abs(u),b=Math.abs(v);band=Math.floor((Math.max(a,b)+Math.min(a,b)*.3)*10);mask=a>.13&&b>.12&&a<.86&&b<.86;dx=Math.sign(u)*flow*step*.7;dy=Math.sign(v)*Math.cos(t*.28+u*3)*step*.7;}
   else{const z=v+Math.sin(u*5+t*.22)*.3;band=Math.floor((z+u*.4+1.3)*8);mask=Math.abs(z)<.78&&Math.abs(u)<.86;dx=Math.sin(v*4+t*.33)*step;dy=Math.cos(u*5+t*.23)*step*.6;}
   const k=((band%6)+6)%6,ink=k<2,scatter=(row*7+col*11)%17===0;
   return {dx,dy,size:mask?(ink?step+.35:step*(scatter?.48:.82)):0,color:ink?p.ink:k===2?p.deep:k===3?p.light:k===4?p.accent:p.bg};
  };
  const from=sample(form),to=sample((form+1)%4),delay=(r+1)/12,raw=Math.max(0,Math.min(1,(morph-delay)/(1-delay))),mix=reduced?0:raw*raw*(3-2*raw),lerp=(a,b)=>a+(b-a)*mix;
  let side=lerp(from.size,to.size);if(layout!==null){const slot=layout%10,ch=Math.floor(layout/10);if((col+ch)% (7+slot)===0||slot>4&&(row+ch*2)%(slot+3)===0)side*=.32;}if(side<.2)continue;
  const move=reduced?0:Math.sin(mix*Math.PI)*step*1.2*Math.sin(v*5+t*.2);
  c.fillStyle=mix<=0?from.color:mix>=1?to.color:'#'+[1,3,5].map(i=>Math.round(lerp(parseInt(from.color.slice(i,i+2),16),parseInt(to.color.slice(i,i+2),16))).toString(16).padStart(2,'0')).join('');
  c.fillRect(x+w/2+u*w*.46+lerp(from.dx,to.dx)+move-side/2,y+h/2+v*h*.46+lerp(from.dy,to.dy)-move-side/2,side,side);
 }
 // Sparse separated squares connect the composition to its otherwise quiet edge.
 for(let i=0;i<17;i++){const q=(i*47)%251,s=2+(i%3);c.fillStyle=i%3?p.deep:p.accent;c.fillRect(x+w*.12+q*w/328,y+h*(i%2?.9:.08),s,s)}
 c.restore();return true;
}
function squareBoss(c,g,p,geo){const b=geo.boss;if(!b||g.boss?.hp===0)return;const w=b.width??b.w??56,h=b.height??b.h??56,open=b.vulnerable!==false;
 c.save();c.translate(b.x,b.y);c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();const unit=Math.min(w,h)/9;
 for(let y=-4;y<=4;y++)for(let x=-4;x<=4;x++){const ring=Math.max(Math.abs(x),Math.abs(y)),split=open&&x===0&&Math.abs(y)>1;if(split||ring===4&&(Math.abs(x)+Math.abs(y)>6))continue;c.fillStyle=ring===4?p.deep:ring===3?p.light:ring===2?p.ink:(x+y)%2?p.accent:p.danger;c.fillRect(x*unit-unit*.46,y*unit-unit*.46,unit*.92,unit*.92)}c.restore();
 for(const q of geo.projectiles||[]){const s=q.width??q.w??8;c.fillStyle=q.owner==='boss'?p.danger:p.accent;c.fillRect(q.x-s/2,q.y-s/2,s,s)}
}
function drawOrigin(c,g,opt={}){
 const reduced=!!opt.reduced,geo=g.geometry(),o=geo.origin||g.originStatus?.()||{},chapter=Math.max(0,(o.chapter||1)-1),p=cellPalette(chapter),t=g.state==='pause'?g.time:Number.isFinite(opt.time)?opt.time:g.time;
 c.save();c.clearRect(0,0,360,480);c.fillStyle=p.ink;c.fillRect(0,0,360,480);
 c.save();c.beginPath();c.rect(16,80,328,328);c.clip();squareWorld(c,{time:t,reduced,chapter,variant:o.morphCount||0,morph:Number(o.transition)||0});
 // Engine samples are the sole source of the visible travel corridor.
 for(const path of geo.paths||[]){if(!path.points?.length)continue;for(const [i,q]of path.points.entries()){c.fillStyle=i%4<2?p.light:p.ink;c.fillRect(q.x-2,q.y-2,4,4)}}c.strokeStyle=p.ink;c.lineWidth=1;c.strokeRect(16.5,80.5,327,327);
 const copy=dialogueCue(g);if(copy)characterBubble(c,g,copy,reduced);
 for(const h of g.hazards||[]){const q=g.hazardPose(h);if(!q||q.visible===false||h.done)continue;const w=q.width??h.width??18,ht=q.height??h.clearance??18;if(q.polygon?.length){c.save();pathPoints(c,q.polygon,true);c.fillStyle=p.ink;c.fill();c.clip();c.save();c.translate(q.x,q.y);c.rotate(q.angle||0);if(q.type!=='ceiling')for(let y=-(q.floor||0)-ht;y<-(q.floor||0);y+=4)for(let x=-w/2;x<w/2;x+=4){c.fillStyle=(Math.floor(x/4)+Math.floor(y/4))%3?p.danger:p.light;c.fillRect(x+.3,y+.3,3.4,3.4)}c.restore();if(q.type==='ceiling'){pathPoints(c,q.polygon,true);c.strokeStyle=p.light;c.lineWidth=2;c.stroke()}c.restore();continue}c.save();c.translate(q.x,q.y);c.rotate(q.angle||0);if((q.type||h.type)==='gap'){c.fillStyle=p.ink;c.fillRect(-w/2,-1,w,17)}else{const beam=(q.type||h.type)==='beam',top=beam?-(27+(q.ceiling??h.ceiling??10))-13:-ht,H=beam?13:ht;c.fillStyle=p.danger;c.fillRect(-w/2,top,w,H);c.fillStyle=p.light;const size=Math.max(2,Math.min(4,w/4));for(let x=-w/2+3;x<w/2-2;x+=size+3)c.fillRect(x,top+3,size,size)}c.restore()}
 drawOriginContact(c,g,p);resultWorld(c,g,p,opt);renderActors(c,g,p,reduced);c.restore();
 text(c,'몽유',20,30,20,p.light,'left',750);text(c,String(o.chapter||1).padStart(2,'0')+' / 04',340,30,12,p.light,'right',600);
 text(c,o.chapterName||['색의 물결','꽃의 안쪽','갈라진 방','다시 흐르는 길'][chapter],20,56,12,p.accent,'left',600);
 // A compact square life row, never a diagnostic footer or a centre instruction.
 const lives=Math.max(0,g.hearts??3);for(let i=0;i<3;i++){c.fillStyle=i<lives?p.accent:p.deep;c.fillRect(20+i*13,435,7,7)}
 c.fillStyle=p.deep;c.fillRect(20,463,320,2);c.fillStyle=p.accent;c.fillRect(20,463,320*Math.min(1,o.progress||0),2);
 resultPanel(c,g,p,opt);c.restore();
}

const themes=[{name:'ACID BLUE',bg:'#72dce7',deep:'#1499d8',light:'#b9f5e7',accent:'#e9fb42',ink:'#092f43',danger:'#f23262'}, {name:'PINK STATIC',bg:'#f9b5e3',deep:'#e953a3',light:'#ffd4a7',accent:'#f7ff56',ink:'#511144',danger:'#573ada'}, {name:'YELLOW ROOM',bg:'#f9ec5c',deep:'#e9b72d',light:'#fff9a7',accent:'#f05b84',ink:'#3e3215',danger:'#b62d6b'},
 {name:'MINT CASCADE',bg:'#8de5b4',deep:'#218c8c',light:'#dcffca',accent:'#ffdb72',ink:'#143f42',danger:'#b33162'},
 {name:'VIOLET PRISM',bg:'#c8a5ed',deep:'#7950bb',light:'#f7dfff',accent:'#d5ff6d',ink:'#382b59',danger:'#a52650'},
 {name:'CORAL MAZE',bg:'#ffb08d',deep:'#df685b',light:'#ffe9c4',accent:'#9dfff1',ink:'#5e263b',danger:'#573ec4'},
 {name:'NIGHT SIGNAL',bg:'#7297d4',deep:'#31518a',light:'#bce4fa',accent:'#fff18d',ink:'#122c4b',danger:'#ab235e'},
 {name:'COPPER ENGINE',bg:'#d8b789',deep:'#9b694e',light:'#ffebbd',accent:'#9af3db',ink:'#472f31',danger:'#8b235f'},
 {name:'PAPER DREAM',bg:'#dedccf',deep:'#9cafa7',light:'#fffced',accent:'#ffb445',ink:'#303f45',danger:'#c02f52'},
 {name:'FINAL FREQUENCY',bg:'#9acbbb',deep:'#497e91',light:'#daffe5',accent:'#f8ed65',ink:'#203443',danger:'#b42772'}];
function rr(c,x,y,w,h,r=8){r=Math.min(r,w/2,h/2);c.beginPath();if(typeof c.roundRect==='function'){c.roundRect(x,y,w,h,r);return}c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath()}
function text(c,t,x,y,size=12,color='#fff',align='left',weight=500){c.font=(Math.round(weight/100)*100)+' '+size+'px "Noto Sans CJK KR",system-ui,sans-serif';c.textAlign=align;c.textBaseline='middle';c.fillStyle=color;c.fillText(t,x,y)}
function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke()}
// In stance the planted foot travels backward relative to the runner; the
// returning foot lifts clear of the ground. Two legs alternate half a cycle.
function runningLeg(phase,reduced=false,bob=0){const t=((phase%(Math.PI*2))+Math.PI*2)%(Math.PI*2),stance=reduced||t<Math.PI,x=reduced?(t<Math.PI?5:-5):stance?10-20*t/Math.PI:-10+20*(t-Math.PI)/Math.PI,y=reduced?0:stance?0:-8*Math.sin(t-Math.PI),contact=stance?bob:0;return {knee:[x*.45+1,-9+y*.35+contact*.35],ankle:[x,y+contact],toe:[x+3,y+contact],stance}}
function actorFacing(g,q={}){if(Number.isFinite(q.facing))return q.facing<0?-1:1;return g.gameMode==='dodge-arena'&&g.arena?.move>0&&g.arena.toX<g.arena.fromX?-1:1}
function human(c,x,y,{angle=0,phase=0,jump=0,color='#081c29',reduced=false,scale=1,kick=false,facing=1,airProgress=.5,idle=false,time=0,throwProgress=null,evade=0,balance=null,settleProgress=null}={}){const classic=artStyle!=='painted-experiment';if(classic)color='#111713';c.save();c.translate(x,y);c.rotate(angle);c.translate(0,-jump);c.scale(scale*(facing<0?-1:1),scale);const a=reduced?.55:Math.sin(phase),b=reduced?.6:Math.cos(phase),air=jump>1,bob=air?0:Math.abs(b)*.8;c.translate(0,-bob);const breath=idle&&!reduced?Math.sin(time*2.2)*.35:0,hip=[-1,classic?-18.5:-16],shoulder=[2,-29+breath],dark=color==='#110E24'||color==='#081c29';
 // Tiny, hand-shaped silhouette: articulated joints are softened, not rubber hoses.
 // The head centre, contact plane and gait phase remain the published anchors.
 let silhouetteEdge=false;
 const limb=(pts,width,back=false)=>{c.save();c.globalAlpha=back&&!classic?.64:1;c.strokeStyle=silhouetteEdge?'#FFF4C9':color;c.lineWidth=width+(silhouetteEdge?1.2:0);c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length-1;i++){const q=pts[i],n=pts[i+1];c.quadraticCurveTo(q[0],q[1],q[0]*.82+n[0]*.18,q[1]*.82+n[1]*.18)}c.lineTo(...pts.at(-1));c.stroke();c.restore()};
 let legs,arms;if(idle&&!air&&!kick){
 // Arena waiting is not running in place: planted asymmetric stance, chest breath.
 legs=[[hip,[-5,-8],[-7,bob],[-4,bob]],[hip,[4,-8],[5,bob],[8,bob]]];
 arms=[[shoulder,[-5,-24],[-6,-19]],[shoulder,[8,-24],[10,-29+breath]]];
 }else if(kick){legs=[[hip,[11,-13],[28,-13]],[hip,[-8,-9],[-12,-1]]];arms=[[shoulder,[-9,-25],[-13,-31]],[shoulder,[12,-26],[15,-34]]]}else if(air){
 // Authored launch / apex / descent gestures interpolate from remaining engine
 // jump time, without renderer-local clocks or synthetic landing events.
 const t=Math.max(0,Math.min(1,airProgress)),u=(t<.5?t:t-.5)*2,e=u*u*(3-2*u),poses=[
 [[-7,-9],[-11,-1],[7,-12],[12,-6],[-6,-28],[-12,-31],[9,-30],[13,-36]],
 [[-10,-11],[-15,-16],[8,-12],[11,-3],[-7,-32],[-13,-37],[10,-26],[16,-29]],
 [[-5,-8],[-7,-1],[6,-8],[9,-1],[-7,-24],[-13,-22],[8,-24],[14,-22]]
 ],from=poses[t<.5?0:1],to=poses[t<.5?1:2],v=from.map((q,i)=>q.map((n,k)=>n+(to[i][k]-n)*e));legs=[[hip,v[0],v[1]],[hip,v[2],v[3]]];arms=[[shoulder,v[4],v[5]],[shoulder,v[6],v[7]]]}else{legs=[Math.PI,0].map(offset=>{const l=runningLeg(reduced?offset:phase+offset,reduced,bob);return [hip,l.knee,l.ankle,l.toe]});arms=[[shoulder,[-4-6*a,-22],[-3-10*a,-18-3*b]],[shoulder,[7+5*a,-24],[10+8*a,-29+2*b]]]}
 // Successful kick results retract into a planted rest pose without resuming play.
 if(settleProgress!==null){const u=settleProgress,restLegs=[[hip,[-5,-8],[-7,bob]],[hip,[4,-8],[5,bob]]],restArms=[[shoulder,[-5,-24],[-6,-19]],[shoulder,[8,-24],[10,-29+breath]]],mix=(a,b)=>a.map((limb,i)=>limb.map((point,j)=>point.map((v,k)=>v+(b[i][Math.min(j,2)][k]-v)*u)));legs=mix(legs,restLegs);arms=mix(arms,restArms)}
 // Action gestures consume authoritative engine progress, never invent motion events.
 if(evade>0&&!air&&!kick){const e=Math.sin(Math.PI*Math.min(1,evade));
 legs=[[hip,[-7,-9],[-11,bob],[-8,bob]],[hip,[5,-8],[10,bob],[13,bob]]];
 arms=[[shoulder,[-6,-25],[-11,-29]],[shoulder,[7,-23+e],[12,-22+e]]];}
 if(balance!==null&&!air&&!kick){const lean=Math.max(-1,Math.min(1,Number(balance)||0));arms=[[shoulder,[-7,-27-lean*3],[-14,-25-lean*5]],[shoulder,[9,-27+lean*3],[15,-25+lean*5]]];}
 if(throwProgress!==null&&!air&&!kick){const t=Math.max(0,Math.min(1,throwProgress)),recover=Math.min(1,t/.72),e=recover*recover*(3-2*recover);
 // Palm overlaps the actual shot birth rectangle (x89..99,y327..337 at scale .75).
 arms[1]=[shoulder,[9-2*e,-29+4*e],[15.5-5.5*e,-29.333+bob+e*.333]];
 arms[0]=[shoulder,[-5,-24],[-9+3*e,-25+6*e]];}

 // One fixed, subpixel pale keyline under the complete dark silhouette. No glow,
 // temporal contrast switching, core-shape inflation or gameplay anchor changes.
 if(classic){silhouetteEdge=true;limb(legs[0],2.45);limb(arms[0],1.9);classicHumanBody(c,'#FFF4C9',breath,limb,true);limb(legs[1],2.6);limb(arms[1],2);silhouetteEdge=false;}
 limb(legs[0],classic?2.45:2.7,true);limb(arms[0],classic?1.9:2.1,true);
 if(classic){classicHumanBody(c,color,breath,limb)}else{
 c.fillStyle=color;c.beginPath();c.moveTo(.3,-30+breath);c.bezierCurveTo(4.8,-30+breath,5.2,-27.5+breath,3,-23);c.quadraticCurveTo(1.6,-19,1,-15);c.quadraticCurveTo(-1,-14,-3,-16);c.bezierCurveTo(-2.7,-21,-1.8,-27,.3,-30);c.fill();limb([[2,-28],[3,-33]],2.4);
 c.beginPath();c.moveTo(-.5,-37.6);c.lineTo(.2,-40);c.lineTo(3.2,-41);c.lineTo(7.2,-39.8);c.lineTo(6.2,-38.7);c.lineTo(7.4,-36.8);c.lineTo(8.5,-35.5);c.lineTo(6.6,-35);c.quadraticCurveTo(6.1,-31.5,3.6,-32.2);c.quadraticCurveTo(.6,-33,-.5,-37.6);c.fill();c.strokeStyle=dark?'#d8ece1':'#263e4b';c.lineWidth=.8;c.beginPath();c.moveTo(4.1,-36.8);c.lineTo(6.2,-36.4);c.stroke();}
 limb(legs[1],classic?2.6:3);limb(arms[1],classic?2:2.4);
 // A small open palm, not a mitten; readable in close-up without visual clutter.
 if(throwProgress!==null){const hand=arms[1].at(-1);limb([[hand[0]-.8,hand[1]+.2],[hand[0]+.2,hand[1]-1.1]],.8);}
if(!classic){c.strokeStyle=dark?'#718184':'#fff9d9';c.lineWidth=.7;c.beginPath();c.moveTo(1,-38.5);c.quadraticCurveTo(3,-40.4,5.2,-39);c.moveTo(.1,-28);c.quadraticCurveTo(-1.4,-23,-1.7,-19);c.stroke();}c.restore()}

// Independently authored slim silhouette, informed only by static proportions.
// Not a sprite trace: no reference pixels, frame sequence or inferred timing.
// Shared world/head/contact anchors and action endpoints stay unchanged.
function classicHumanBody(c,color,breath,limb,edge=false){
 const fill=()=>{if(edge){c.strokeStyle=color;c.lineWidth=1.2;c.lineJoin='round';c.stroke()}c.fill()};
 c.fillStyle=color;c.beginPath();c.moveTo(.5,-30+breath);c.quadraticCurveTo(3.9,-30+breath,3.5,-27+breath);c.lineTo(1,-18);c.quadraticCurveTo(-.6,-17,-2.6,-18.5);c.lineTo(-1.2,-26);c.closePath();fill();
 limb([[2,-29],[3,-34]],1.9);
 // Small head around the existing (3.5,-36.5) anchor; restrained profile.
 c.beginPath();c.moveTo(1.1,-37.4);c.quadraticCurveTo(1,-40.1,3.1,-40.2);c.quadraticCurveTo(5.5,-40.2,5.7,-37.6);c.lineTo(6.3,-36.3);c.lineTo(5.4,-36);c.quadraticCurveTo(5.2,-33.5,3.3,-33.8);c.quadraticCurveTo(1.2,-34,1.1,-37.4);fill();
}

function squarePattern(c,x,y,size,color,phase=0){c.strokeStyle=color;c.lineWidth=3;for(let i=0;i<4;i++){const s=size-i*14;if(s<6)break;c.save();c.translate(x,y);c.rotate(phase);c.strokeRect(-s/2,-s/2,s,s);c.restore()}}
function cornerResponse(distance=0,reduced=false){if(reduced)return {x:0,y:0,roll:0};const q=root.QuadRiftHD.rail(distance),w=Math.sin(q.turn*Math.PI)**2;return {x:-q.nx*w*2.4,y:-q.ny*w*2.4,roll:-w*.012}}
function railPath(c){const E=root.QuadRiftHD,start=E.rail(0);c.beginPath();c.moveTo(start.x,start.y);for(let side=0;side<4;side++){let p=E.rail(side*E.SIDE+E.CORNER_START);c.lineTo(p.x,p.y);for(let i=1;i<=16;i++){const q=E.rail(side*E.SIDE+E.CORNER_START+(E.SIDE-E.CORNER_START)*i/16),ds=E.CORNER_LENGTH/16/3;c.bezierCurveTo(p.x+Math.cos(p.angle)*ds,p.y+Math.sin(p.angle)*ds,q.x-Math.cos(q.angle)*ds,q.y-Math.sin(q.angle)*ds,q.x,q.y);p=q}}c.closePath()}
// Seven additional chapter families. Every motif is an original vector construction;
// the level slot changes the interior arrangement, not the legibility of the rail.
function chapterPattern(c,stage,p,t,reduced,variant=0){
 const shift=reduced?0:Math.sin(t*.24)*7,v=Math.max(0,Number(variant)||0);c.fillStyle=p.bg;c.fillRect(16,80,328,328);
 c.save();c.translate(180,244);
 if(stage===3){ // Mint terraces / falling stair tiles.
  for(let row=-4;row<5;row++)for(let col=-4;col<5;col++){const x=col*39+(row%2)*14,y=row*39;c.fillStyle=(row+col+v)%3===0?p.deep:p.light;c.globalAlpha=.68;c.fillRect(x-15,y-15,30,30);c.fillStyle=p.accent;c.fillRect(x-12,y-12,8,8)}c.globalAlpha=1;
  for(let k=0;k<5;k++){const x=-87+k*30,y=52-k*26+shift;c.fillStyle=k%2?p.ink:p.deep;c.fillRect(x,y,37,19);c.fillStyle=p.accent;c.fillRect(x,y,37,4)}
 }else if(stage===4){ // Nested angular prisms.
  for(let k=6;k>0;k--){c.save();c.rotate(Math.PI/4+(v%3)*.045+(reduced?0:Math.sin(t*.12+k)*.025));const q=20+k*17;c.fillStyle=[p.deep,p.light,p.bg,p.accent][k%4];c.fillRect(-q,-q,q*2,q*2);c.restore()}
  c.fillStyle=p.ink;c.fillRect(-22,-22,44,44);c.fillStyle=p.light;c.fillRect(-12,-12,24,24);
 }else if(stage===5){ // Printed maze paths: disconnected from the actual rail.
  for(let k=0;k<6;k++){const q=24+k*24;c.strokeStyle=k%2?p.deep:p.light;c.lineWidth=12;c.beginPath();c.moveTo(-q,-q);c.lineTo(q,-q);c.lineTo(q,q);c.lineTo(-q,q);c.lineTo(-q,-q+22);c.stroke()}
  for(let k=0;k<6;k++){c.fillStyle=k%2?p.accent:p.ink;const x=-108+k*40;c.fillRect(x,-20+((k+v)%3)*21+shift,18,18)}
 }else if(stage===6){ // Rectilinear night signals and constellations.
  c.fillStyle=p.deep;c.fillRect(-164,-164,328,328);c.globalAlpha=.5;c.strokeStyle=p.bg;c.lineWidth=1;for(let k=-5;k<=5;k++){c.beginPath();c.moveTo(-164,k*30);c.lineTo(164,k*30);c.moveTo(k*30,-164);c.lineTo(k*30,164);c.stroke()}c.globalAlpha=1;
  const points=[[-83,-69],[-25,-69],[-25,-22],[54,-22],[54,61],[-53,61],[-53,108],[101,108]];line(c,points,p.light,3);for(let k=0;k<points.length;k++){const[x,y]=points[k],q=5+((k+v)%3)*2;c.fillStyle=k%2?p.accent:p.light;c.fillRect(x-q,y-q,q*2,q*2)}
  c.strokeStyle=p.bg;c.lineWidth=7;c.strokeRect(-111+shift,-113,217,223);
 }else if(stage===7){ // Copper mechanical gates, exclusively square teeth.
  for(let y=-120;y<=120;y+=60){c.fillStyle=p.deep;c.fillRect(-164,y-17,328,34);for(let x=-140;x<=140;x+=35){c.fillStyle=p.light;c.fillRect(x+(y%120?shift:-shift),y-11,20,22)}}
  for(let k=0;k<3;k++){const q=30+k*27;c.strokeStyle=[p.ink,p.accent,p.light][k];c.lineWidth=9;c.strokeRect(-q,-q,q*2,q*2)}
 }else if(stage===8){ // Offset folded paper panels with clean ink hatchwork.
  for(let r=-2;r<=2;r++)for(let k=-2;k<=2;k++){const x=k*67+(r%2)*12,y=r*67;c.fillStyle=(r+k+v)%2?p.light:p.bg;c.fillRect(x-31,y-31,62,62);c.fillStyle=p.deep;c.beginPath();c.moveTo(x+12,y-31);c.lineTo(x+31,y-12);c.lineTo(x+12,y-12);c.closePath();c.fill();c.strokeStyle=p.ink;c.globalAlpha=.25;c.lineWidth=2;for(let j=0;j<3;j++){c.beginPath();c.moveTo(x-20,y+j*9);c.lineTo(x+9+shift*.3,y+j*9);c.stroke()}c.globalAlpha=1}
 }else{ // Final chamber: woven square frequencies, never whole-screen flashes.
  c.fillStyle=p.ink;c.fillRect(-164,-164,328,328);
  for(let k=7;k>=0;k--){const q=17+k*19;c.save();c.rotate((k%2?1:-1)*.07+(reduced?0:Math.sin(t*.1)*.025));c.strokeStyle=[p.bg,p.accent,p.light,p.deep][(k+v)%4];c.lineWidth=k%2?5:8;c.strokeRect(-q,-q,q*2,q*2);c.restore()}
  c.fillStyle=p.accent;c.fillRect(-9,-9,18,18);
 }
 c.restore();
}
// The ten collected skins in EVERY chapter have different room topology.
// These are structural compositions (portals, towers, windows, stairways),
// not palette swaps or hidden per-level labels. Slot zero preserves legacy art.
function skinComposition(c,p,slot,stage,time,reduced){
 if(!Number.isInteger(slot)||slot<1||slot>10)return;
 const layouts=[
  [[-66,-66,132,132]],
  [[-66,-57,52,114],[14,-57,52,114]],
  [[-70,-38,39,76],[-20,-68,40,136],[31,-49,39,98]],
  [[-68,-68,60,60],[8,-68,60,60],[-68,8,60,60],[8,8,60,60]],
  [[-72,-66,38,38],[-45,-39,38,38],[-18,-12,38,38],[9,15,38,38],[36,42,38,38]],
  [[-72,-54,30,108],[42,-54,30,108],[-40,-15,80,30],[-22,-64,44,24],[-22,40,44,24]],
  [[-72,-66,144,30],[-72,-24,30,90],[-30,36,102,30],[42,-24,30,48],[-20,-20,40,40]],
  [[-66,-66,32,32],[-16,-70,32,32],[34,-66,32,32],[-70,-16,32,32],[38,-16,32,32],[-66,34,32,32],[-16,38,32,32],[34,34,32,32]],
  [[-66,-66,36,36],[-18,-66,36,36],[30,-66,36,36],[-66,-18,36,36],[-18,-18,36,36],[30,-18,36,36],[-66,30,36,36],[-18,30,36,36],[30,30,36,36]],
  [[-68,-68,136,136],[-45,-48,38,96],[7,-48,38,96]]
 ];
 c.save();c.translate(180,244);c.rotate((stage%3-1)*.035);
 const drift=reduced?0:Math.sin(time*.22+slot)*1.4;
 for(let i=0;i<layouts[slot-1].length;i++){
  const [x,y,w,h]=layouts[slot-1][i],dx=(i%2?1:-1)*drift;
  c.globalAlpha=.83;c.fillStyle=p.light;c.fillRect(x+dx,y,w,h);c.globalAlpha=.96;c.strokeStyle=p.ink;c.lineWidth=3;c.strokeRect(x+dx,y,w,h);
  const inset=Math.min(10,w/5,h/5);c.strokeStyle=(i+stage)%2?p.deep:p.accent;c.lineWidth=3;c.strokeRect(x+dx+inset,y+inset,w-inset*2,h-inset*2);
  // The family adds its own seam, so the same topology is visually embedded.
  c.fillStyle=p.deep;if(stage%2===0)c.fillRect(x+dx+w/2-2,y+inset*1.4,4,Math.max(3,h-inset*2.8));else c.fillRect(x+dx+inset*1.4,y+h/2-2,Math.max(3,w-inset*2.8),4);
 }
 c.restore();
}
function backdrop(c,stage,t,reduced,distance=0,variant=0){if(artStyle!=='painted-experiment'){squareWorld(c,{chapter:stage,variant,time:t,reduced,layout:stage*10+variant-1});c.save();c.strokeStyle=cellPalette(stage).light;c.lineWidth=32;railPath(c);c.stroke();c.strokeStyle=cellPalette(stage).ink;c.lineWidth=1;railPath(c);c.stroke();c.restore();return}if(paintedWorld(c,stage%3===2?'mirror':stage%3===1?'eclipse':'tidal',{time:t,reduced,variant})){const p=themes[((Number(stage)||0)%themes.length+themes.length)%themes.length];c.save();c.strokeStyle='#F1E9D6';c.lineWidth=38;railPath(c);c.stroke();c.strokeStyle='#302C3D';c.lineWidth=1.6;railPath(c);c.stroke();c.restore();return}stage=((Number(stage)||0)%themes.length+themes.length)%themes.length;const p=themes[stage],phase=reduced?0:t,breathe=reduced?0:Math.sin(t*.48)*3;c.fillStyle=p.bg;c.fillRect(16,80,328,328);c.save();rr(c,16,80,328,328,3);c.clip();
 // Original modern interpretation: scenery responds subtly, rail/HUD stay fixed.
 const response=cornerResponse(distance,reduced);c.save();c.translate(180+response.x,244+response.y);c.rotate(response.roll);c.scale(1.045,1.045);c.translate(-180,-244);
 const grad=c.createLinearGradient(16,80,344,408);grad.addColorStop(0,p.light);grad.addColorStop(.45,p.bg);grad.addColorStop(1,p.deep);c.fillStyle=grad;c.fillRect(16,80,328,328);
 if(stage===0){
  // A broken corridor: sliding color planes and offset square lattices.
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){c.fillStyle=(row+col)%3===0?'#24a0d3':(row+col)%3===1?'#64e6df':'#2bc5e5';c.globalAlpha=.55;c.fillRect(16+col*82,80+row*82,82,82)}c.globalAlpha=1;
  const shift=Math.sin(phase*.23)*9;for(const y of [158,244,330]){c.fillStyle='#1692ca';c.fillRect(64,y-16,232,32);for(let i=0;i<19;i++){c.fillStyle=i%5<2?'#dbf649':'#096792';c.fillRect(61+i*13+shift,y-4,8,8)}}
  c.fillStyle='#65e8d9';c.fillRect(129,179,104,122);for(let k=0;k<4;k++){c.strokeStyle=k%2?'#e3f856':'#1488b9';c.lineWidth=5;c.strokeRect(139+k*11+breathe,190+k*11,82-k*22,100-k*22)}
  for(let y=130;y<366;y+=26){c.fillStyle='#0a73a1';c.fillRect(77,y,13,13);c.fillStyle='#dafa61';c.fillRect(267,y+7,13,13)}
 }else if(stage===1){
  // Asymmetric liquid ribbons and an abstract single eye, not a face or mascot.
  c.fillStyle='#fb79bb';c.fillRect(16,80,328,328);for(let i=-1;i<8;i++){const x=25+i*48,wave=Math.sin(phase*.2+i*.7)*12;c.fillStyle=i%2?'#ffbf83':'#dd489b';c.beginPath();c.moveTo(x,75);c.bezierCurveTo(x+70+wave,145,x-45,252,x+18,413);c.lineTo(x+42,413);c.bezierCurveTo(x+5,255,x+101+wave,160,x+30,75);c.closePath();c.fill()}
  c.save();c.translate(181,241);c.rotate(-.18+Math.sin(phase*.17)*.025);for(let k=0;k<3;k++){const w=102-k*16,h=75-k*12;c.beginPath();c.moveTo(-w,0);c.bezierCurveTo(-w*.3,-h,w*.5,-h*.8,w,0);c.bezierCurveTo(w*.3,h*.9,-w*.4,h,-w,0);c.fillStyle=['#982aa8','#fff28d','#fdf4cf'][k];c.fill()}
  c.fillStyle='#b440c8';c.beginPath();c.ellipse(Math.sin(phase*.25)*5,0,25,38,.12,0,Math.PI*2);c.fill();c.strokeStyle='#e7ff4d';c.lineWidth=5;c.beginPath();c.ellipse(0,0,33,44,.12,0,Math.PI*2);c.stroke();c.fillStyle='#62228a';c.beginPath();c.ellipse(2,0,9,27,.12,0,Math.PI*2);c.fill();c.restore();
 }else if(stage>=3){
  chapterPattern(c,stage,p,phase,reduced,variant);
 }else{
  // Four warped rooms: curved tile edges breathe without rotating the world.
  c.fillStyle='#ffe751';c.fillRect(16,80,328,328);for(let r=0;r<4;r++)for(let col=0;col<4;col++){c.fillStyle=(r+col)%2?'#ffc52e':'#fff883';c.fillRect(16+col*82,80+r*82,82,82)}
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){const x=116+col*129,y=180+row*129,warp=reduced?3:3+Math.sin(phase*.25+row+col)*4;for(let k=0;k<4;k++){const q=52-k*11;c.beginPath();c.moveTo(x-q,y-q);c.quadraticCurveTo(x+warp,y-q-7,x+q,y-q);c.quadraticCurveTo(x+q+warp,y,x+q,y+q);c.quadraticCurveTo(x-warp,y+q+7,x-q,y+q);c.quadraticCurveTo(x-q-warp,y,x-q,y-q);c.strokeStyle=['#ea632d','#78306c','#ff9c2e','#a8477b'][k];c.lineWidth=5;c.stroke()}}
 }
 skinComposition(c,p,Number(variant)||0,stage,phase,reduced);
 // Chromatic cells emerge, drift, and disperse continuously. No global flashing.
 for(let row=0;row<9;row++)for(let col=0;col<9;col++){const seed=row*1.71+col*2.31,u=phase*.48+seed,pulse=(1+Math.sin(u))*.5,side=3+pulse*9,x=72+col*27+(reduced?0:Math.sin(u*.73)*6),y=136+row*27+(reduced?0:Math.cos(u*.61)*6);c.globalAlpha=.12+pulse*.25;c.fillStyle=[p.accent,p.ink,p.light][(row+col)%3];c.save();c.translate(x,y);c.rotate(reduced?0:Math.sin(u*.4)*.28);c.fillRect(-side/2,-side/2,side,side);c.restore();}
 // Sparse small glints: slow envelopes, restricted to scenery away from the rail.
 if(!reduced)for(let i=0;i<8;i++){const pulse=Math.pow(Math.max(0,Math.sin(phase*1.1+i*2.17)),6);if(pulse<.03)continue;const x=89+(i*47)%185,y=153+(i*61)%179;c.globalAlpha=pulse*.75;c.fillStyle=p.light;c.fillRect(x-3,y-1,6,2);c.fillRect(x-1,y-3,2,6);}c.globalAlpha=1;
 c.restore();
 // A calm runway moat makes the black silhouette and solid hazards unambiguous.
 c.strokeStyle=p.light;c.globalAlpha=.92;c.lineWidth=38;railPath(c);c.stroke();c.globalAlpha=1;c.strokeStyle=p.ink;c.lineWidth=1.6;railPath(c);c.stroke();
 for(let i=0;i<28;i++){const q=20+i*12;c.fillStyle=i%4===0?p.accent:p.ink;c.globalAlpha=.6;c.fillRect(q,84,5,5);c.fillRect(q,399,5,5);c.fillRect(20,84+i*12,5,5);c.fillRect(335,84+i*12,5,5)}c.globalAlpha=1;c.restore()}

// One pose projects both the silhouette and its speech tail. New play families may
// provide their own foot position/tangent; legacy/tutorial rails remain a fallback.
function actorPose(g,reduced=false){const E=root.QuadRiftHD,provided=typeof g.actorPose==='function'?g.actorPose(reduced):typeof E.actorPose==='function'?E.actorPose(g,reduced):null,q=provided||E.rail(g.distance);return {x:q.x,y:q.y,facing:actorFacing(g,q),angle:Number.isFinite(q.angle)?q.angle:E.angleAt(g.distance,reduced),height:Number.isFinite(q.height)?q.height:g.height(),phase:Number.isFinite(q.phase)?q.phase:g.distance*.14,scale:Number.isFinite(q.scale)?q.scale:GAMEPLAY_SCALE}}
function headAnchor(g,reduced=false){const q=actorPose(g,reduced),a=q.angle,j=q.height,bob=j>1?0:Math.abs(reduced?.6:Math.cos(q.phase))*.8,x=4*q.scale*q.facing,y=-j-(36+bob)*q.scale;return {x:q.x+x*Math.cos(a)-y*Math.sin(a),y:q.y+x*Math.sin(a)+y*Math.cos(a),angle:a}}
function actorBounds(g,reduced=false){const q=actorPose(g,reduced),reach=g.gameMode==='kick-arena'&&g.arena?.kick>0?30-12*(g.resultSettle??0):18,corners=[[-18,-43],[reach,-43],[-18,3],[reach,3]].map(([x,y])=>{x*=q.scale*q.facing;y=y*q.scale-q.height;return {x:q.x+x*Math.cos(q.angle)-y*Math.sin(q.angle),y:q.y+x*Math.sin(q.angle)+y*Math.cos(q.angle)}});return {l:Math.min(...corners.map(p=>p.x)),r:Math.max(...corners.map(p=>p.x)),t:Math.min(...corners.map(p=>p.y)),b:Math.max(...corners.map(p=>p.y))}}
// Bounds use the same width, ceiling offset, rotation and room clipping as
// liveHazard. A foot-point proxy cannot protect text from an overhead beam.
function speechObstacles(g){
 const out=[],contact=activeOriginHit(g),rect=(x,y,w,h,angle=0)=>{const points=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([a,b])=>({x:a*Math.cos(angle)-b*Math.sin(angle),y:a*Math.sin(angle)+b*Math.cos(angle)}));return {l:Math.min(...points.map(p=>p.x)),r:Math.max(...points.map(p=>p.x)),t:Math.min(...points.map(p=>p.y)),b:Math.max(...points.map(p=>p.y))}};
 if(contact)out.push({l:Math.min(...contact.polygon.map(p=>p.x))-2,r:Math.max(...contact.polygon.map(p=>p.x))+2,t:Math.min(...contact.polygon.map(p=>p.y))-2,b:Math.max(...contact.polygon.map(p=>p.y))+2});
 if(typeof g.hazardPose==='function')for(const h of g.hazards||[]){if(h.done)continue;const q=g.hazardPose(h);if(!q||q.visible===false)continue;if(q.polygon?.length){out.push({l:Math.min(...q.polygon.map(p=>p.x)),r:Math.max(...q.polygon.map(p=>p.x)),t:Math.min(...q.polygon.map(p=>p.y)),b:Math.max(...q.polygon.map(p=>p.y))});continue}const w=q.width??h.width??18,ht=q.height??h.clearance??18,type=q.type||h.type,lower=type==='beam'?-(36*(g.gameMode==='four-room'?.5:.75)+(q.ceiling??h.ceiling??10)):0,box=rect(-w/2,type==='gap'?0:type==='beam'?lower-13:-ht,w,type==='gap'?Math.max(0,408-q.y):type==='beam'?13:ht,q.angle||0);box.l+=q.x;box.r+=q.x;box.t+=q.y;box.b+=q.y;
  if(g.gameMode==='four-room'){const room=root.QuadRiftHD.R6_ROOMS?.[q.room]||g.geometry?.().rooms?.[q.room];if(room){box.l=Math.max(box.l,room.x+2);box.r=Math.min(box.r,room.x+room.width-2);box.t=Math.max(box.t,room.y+2);box.b=Math.min(box.b,room.y+room.height-2)}}if(box.r>box.l&&box.b>box.t)out.push(box);
 }
 if(g.gameMode?.endsWith('-arena')&&typeof g.geometry==='function'){const geo=g.geometry();if(geo.boss&&g.boss?.hp!==0){const q=geo.boss,w=q.width??q.w??56,h=q.height??q.h??56;out.push({l:q.x-w/2,r:q.x+w/2,t:q.y-h/2,b:q.y+h/2})}for(const q of geo.projectiles||[]){const w=q.width??q.w??8,h=q.height??q.h??8;out.push({l:q.x-w/2,r:q.x+w/2,t:q.y-h/2,b:q.y+h/2})}}
 return out;
}
function bubbleLayout(g,reduced=false,copy=dialogueWindows.get(g)?.active?.copy){const single=copy&&!String(copy[1]||'').trim(),h=headAnchor(g,reduced),w=single?Math.max(72,Math.min(150,Array.from(String(copy[0]||'')).length*12+24)):150,ht=single?28:46,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let best;
 const body=actorBounds(g,reduced);const otherBodies=typeof g.actorPoses==='function'?g.actorPoses(reduced).map(q=>actorBounds({actorPose:()=>q},reduced)):[];
 const obstacles=speechObstacles(g);
 const candidates=[[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]].map(([dx,dy])=>[h.x+dx*(w/2+15)-w/2,h.y+dy*(ht/2+15)-ht/2]);
 // Add body-aware edge candidates: a diagonal running pose can extend beyond
 // the old fixed head gap by a few pixels even though the head is uncovered.
 candidates.push([h.x-w/2,body.t-8-ht],[h.x-w/2,body.b+8],[body.l-8-w,h.y-ht/2],[body.r+8,h.y-ht/2]);
 for(const ob of obstacles)candidates.push([h.x-w/2,ob.t-6-ht],[h.x-w/2,ob.b+6],[ob.l-6-w,h.y-ht/2],[ob.r+6,h.y-ht/2]);
 // Rare crowded-room fallback: still actor-owned speech with a tail, never a
 // fixed central instruction slab. The score favors the nearest safe position.
 for(let x=26;x<=184;x+=26)for(let y=120;y<=322;y+=23)candidates.push([x,y]);
 for(const [candidateX,candidateY] of candidates){const x=clamp(candidateX,26,334-w),y=clamp(candidateY,120,368-ht),cx=x+w/2,cy=y+ht/2;
 let score=Math.max(0,-((cx-h.x)*Math.sin(h.angle)-(cy-h.y)*Math.cos(h.angle)))*12+Math.hypot(cx-h.x,cy-h.y)+Math.max(0,(cx-h.x)*Math.cos(h.angle)+(cy-h.y)*Math.sin(h.angle))*.5;
 // Body overlap is forbidden; a merely tight 0–4px gap is a soft cost.
 // Treating that safe gap as a collision forced compact-room speech onto a
 // real obstacle, which then correctly drew above—and obscured—the text.
 const bodyCost=ob=>x<ob.r&&x+w>ob.l&&y<ob.b&&y+ht>ob.t?1000000:x<ob.r+4&&x+w>ob.l-4&&y<ob.b+4&&y+ht>ob.t-4?80:0;
 score+=bodyCost(body);for(const ob of otherBodies)score+=bodyCost(ob);
 if(h.x>x-8&&h.x<x+w+8&&h.y>y-8&&h.y<y+ht+8)score+=500;
 // Keep speech genuinely attached: a safe but distant box is not preferable
 // to a nearby side position just because it sits above the head.
 const tailGap=Math.hypot(Math.max(x-h.x,0,h.x-x-w),Math.max(y-h.y,0,h.y-y-ht));score+=Math.max(0,tailGap-34)*1000;
 for(const ob of obstacles){if(x<ob.r+2&&x+w>ob.l-2&&y<ob.b+2&&y+ht>ob.t-2)score+=10000;if(x+8<ob.r+2&&x+w-8>ob.l-2&&y+8<ob.b+2&&y+ht-8>ob.t-2)score+=100000;}
 if(!best||score<best.score)best={x,y,w,h:ht,head:h,score};}
 // Tail starts at nearest box edge and ends just short of the moving head.
 const b=best,intersects=(ob,pad=0)=>b.x<ob.r+pad&&b.x+b.w>ob.l-pad&&b.y<ob.b+pad&&b.y+b.h>ob.t-pad;b.safe=![body,...otherBodies].some(ob=>intersects(ob))&&!obstacles.some(ob=>intersects(ob,2));let tx=clamp(h.x,b.x+9,b.x+b.w-9),ty=clamp(h.y,b.y+7,b.y+b.h-7),edge;
 if(h.y<b.y){ty=b.y;edge=2}else if(h.y>b.y+b.h){ty=b.y+b.h;edge=3}else if(h.x<b.x){tx=b.x;edge=0}else{tx=b.x+b.w;edge=1}
 b.tail={x:tx,y:ty,vertical:edge<2};b.safe=b.safe&&Math.hypot(h.x-tx,h.y-ty)<=40;return b}
function characterBubble(c,g,copy,reduced){const b=bubbleLayout(speechActor(g),reduced,copy),h=b.head;if(!b.safe)return false;c.save();c.fillStyle='#fffef2';c.strokeStyle='#17333e';c.lineWidth=1;const d=Math.hypot(h.x-b.tail.x,h.y-b.tail.y)||1,ex=h.x+(b.tail.x-h.x)*5/d,ey=h.y+(b.tail.y-h.y)*5/d;c.beginPath();c.moveTo(b.tail.x+(b.tail.vertical?0:-4),b.tail.y+(b.tail.vertical?-4:0));c.lineTo(ex,ey);c.lineTo(b.tail.x+(b.tail.vertical?0:4),b.tail.y+(b.tail.vertical?4:0));c.closePath();c.fill();c.stroke();rr(c,b.x,b.y,b.w,b.h,artStyle==='painted-experiment'?7:0);c.fill();c.stroke();text(c,copy[0],b.x+b.w/2,b.y+14,12,'#142c37','center',700);if(String(copy[1]||'').trim())text(c,copy[1],b.x+b.w/2,b.y+32,12,'#49616a','center',500);c.restore()}
// Authored Korean reactions, not recovered or quoted NOM3 dialogue.
// Semantic events own their copy. Simulation time freezes during pause; a passed
// hazard, completed action, or ended boss phase invalidates speech immediately.
const dialogueWindows=new WeakMap(),DIALOGUE_SECONDS=1.1,DIALOGUE_GAP=2;
// Same static contact outline and lifetime in ordinary and reduced motion.
const ORIGIN_HIT_SECONDS=1.1;
function originContactCopy(hit){return hit?.type==='ceiling'?['천장에 닿았네.','여긴 누르지 말자.']:['벽에 닿았네.','벽 앞에서 톡!']}
function originDanger(g){const h=(g.hazards||[]).find(h=>!h.done);return h&&(h.d-g.distance)/Math.max(1,g.speed||120)<=(h.type==='ceiling'?1.45:1.05)}
function activeOriginHit(g){const h=g.originHitFeedback,age=(Number(g.time)||0)-(h?.time??0);return g.mode==='origin-route'&&g.state==='play'&&h&&age>=0&&age<ORIGIN_HIT_SECONDS-1e-12&&!originDanger(g)?h:null}
function drawOriginContact(c,g,p){const h=activeOriginHit(g);if(!h)return false;c.save();pathPoints(c,h.polygon,true);c.strokeStyle=p.light;c.lineWidth=3;c.stroke();c.strokeStyle=p.danger;c.lineWidth=1;c.stroke();c.restore();return true}
function gameplayCue(g){
 const make=(key,copy,extra={})=>({key,copy,priority:2,...extra}),time=Number(g.time)||0;
 const hitRoom=(g.hazards||[]).filter(h=>h.hit).at(-1)?.room;
 if(g.gapRecovery>0)return make('recovery:'+g.metrics.hits,['앗, 발밑이!',''],{priority:4,room:hitRoom});
 const originHit=activeOriginHit(g);
 if(originHit)return make('origin-hit:'+originHit.id+':'+originHit.time,originContactCopy(originHit),{priority:3,room:0});
 if(g.mode!=='origin-route'&&g.hitFlash>0)return make('hit:'+g.metrics.hits,['앗!','괜찮아, 다시.'],{priority:4,room:hitRoom});
 if(g.boss?.hp===0)return null;
 const mode=g.gameMode,pose=g.bossPose?.(),cycle=Math.floor(time/(g.modeParams?.cycle||1));
 if(pose&&mode?.endsWith('-arena')){
  const a=g.arena,phase=time%(g.modeParams.cycle||1);
  if(mode==='dodge-arena'&&pose.attack==='telegraph'&&phase>=.45&&a.lane===a.lockedLane&&!a.move)
   return make('dodge:'+cycle,['이쪽으로 온다!',''],{kind:'dodge',firstCopy:['이쪽으로 온다!','톡, 옆 칸으로!']});
  if(mode==='throw-arena'){
   const incoming=g.projectiles.find(p=>!p.dead&&p.owner==='boss'&&(p.x-82)/136>.1&&(p.x-82)/136<=.85);
   if(incoming&&a.cooldown<=0)return make('projectile:'+incoming.id,['날아온다!',''],{kind:'deflect',firstCopy:['날아온다!','톡, 네모로 막자!']});
   const flight=(pose.x-94)/238,future=g.bossPose(time+flight);
   if(a.cooldown<=0&&!g.projectiles.some(p=>!p.dead&&p.owner==='player')&&Math.abs(future.y-332)<22)
    return make('throw:'+Math.floor((time+flight)*1.4/(Math.PI*2)),['지금이야!',''],{kind:'throw',firstCopy:['지금이야!','톡, 네모를 던져!']});
  }
  if(mode==='kick-arena'&&!a.resolved&&a.kickedCycle!==a.cycle){
   if(pose.attack==='open'&&g.jump>0&&g.airHeight()>=72&&a.kick<=0)
    return make('kick:'+cycle,['한 번 더!',''],{kind:'kick',firstCopy:['한 번 더!','공중에서 톡!']});
   if(g.jump<=0&&phase>=.45&&phase<1.45)
    return make('leap:'+cycle,['틈이 보여!',''],{kind:'leap',firstCopy:['틈이 보여!','톡, 뛰어올라!']});
  }
  return time<.75?make('intro:'+mode,['어디, 해 볼까.',''],{priority:0}):null;
 }
 const h=(g.hazards||[]).find(h=>!h.done&&h.d+(h.width||18)/2>=g.distance),speed=Math.max(1,g.speed||120);
 if(h){
  const eta=(h.d-g.distance)/speed,key='hazard:'+(h.id??h.d)+':'+(h.room||0);
  // A warning is useful shortly before the jump, not 240 units away or
  // after takeoff. The beam instruction is likewise only for grounded actors.
  if(g.jump<=0&&eta>.16&&eta<=(mode==='origin-four-edge'&&h.type==='ceiling'?1.45:1.05)){
   if(mode==='origin-four-edge'&&h.type==='ceiling')return make(key,['여긴 그냥 지나가자.',''],{kind:'ceiling',hazard:h,room:0,eta});
   const copies={beam:['낮은 천장이네.',''],precision:['딱 맞춰서!',''],high:['제법 높은데?',''],gap:['앞이 끊겼네!',''],piston:['또 솟아오르네!',''],moving:['움직이잖아!','']};
   const hints={beam:'이번엔 그냥 걷자.',precision:'정점에서 넘어가자.',high:'조금 일찍 뛰자.',gap:'빈틈 앞에서 톡!',piston:'벽 앞에서 톡!',moving:'벽 앞에서 톡!'};
   return make(key,copies[h.type]||['넘어가 볼까!',''],{kind:h.type||'barrier',hazard:h,room:h.room||0,eta,firstCopy:[(copies[h.type]||['넘어가 볼까!'])[0],hints[h.type]||'벽 앞에서 톡!']});
  }
 }
 if(g.gameMode==='origin-four-edge'){
  const E=root.QuadRiftHD,safe=!h||(h.d-g.distance)/speed>1.05;
  // The first real corner is hazard-free. Teach its automatic turn once per
  // run, including a short exit beat, without waiting for an input. This is
  // instruction (not ambient chatter), so the first hazard's quiet interval
  // cannot swallow it. Hits and imminent hazards above still take precedence.
  if(safe&&g.originStartChapter===0&&g.distance>=E.CORNER_START&&g.distance<E.SIDE+speed*.2)
   return make('origin-first-turn',['모서리는 저절로!','장애물 앞에서만 톡!']);
  if(safe){const o=g.originStatus?.();if(o?.phase==='warning')return make('origin-morph:'+o.morphCount,['네모가 움직이네.',''],{priority:1});const q=g.actorPose?.();if(q?.turn>.2&&q.turn<.8)return make('origin-turn:'+Math.floor(g.distance/E.SIDE),['방향이 바뀌네.',''],{priority:1});}
 }
 const transform=g.worldTransform?.(),safe=!h||(h.d-g.distance)/speed>1.5;
 if(g.jump<=0&&safe&&transform&&['warning','rising','settling'].includes(transform.phase))
  return make('transform:'+transform.phase,[transform.phase==='warning'?'어, 바닥이…':transform.phase==='settling'?'다시 평평해지네.':'길이 솟아오르네!',''],{priority:1});
 return time<.75&&g.jump<=0?make('intro:'+g.levelId,['가 볼까.',''],{priority:0}):null;
}
function dialogueCue(g){
 if(g.state!=='play'||g.mode==='tutorial'||!g.level)return null;
 const now=Number(g.time)||0;
 let state=dialogueWindows.get(g);
 // startLevel creates fresh hazards even when retrying the very same level.
 if(!state||state.level!==g.level||state.hazards!==g.hazards||now<state.time||g.distance<state.distance){
  state={level:g.level,hazards:g.hazards,time:now,distance:g.distance,seen:new Set(),kinds:new Set(),active:null,ambientAfter:0};dialogueWindows.set(g,state);
 }
 state.time=now;state.distance=g.distance;
 const cue=gameplayCue(g);
 if(!cue){state.active=null;return null}
 if(state.active?.key===cue.key){if(now<state.active.until)return state.active.copy;state.active=null;return null}
 // Different semantic event: never carry an obsolete instruction into it.
 state.active=null;
 if(state.seen.has(cue.key))return null;
 if(cue.priority<2&&now<state.ambientAfter)return null;
 const copy=cue.kind&&!state.kinds.has(cue.kind)?cue.firstCopy||cue.copy:cue.copy;
 if(cue.kind)state.kinds.add(cue.kind);
 state.seen.add(cue.key);state.active={key:cue.key,room:cue.room,copy:copy.slice(),until:now+DIALOGUE_SECONDS};
 state.ambientAfter=now+DIALOGUE_SECONDS+DIALOGUE_GAP;
 return state.active.copy;
}
// Four-room reactions belong to the actor who encountered the event, including
// a hit already marked done; advancing the hazard queue cannot move their voice.
function speechActor(g){
 const room=dialogueWindows.get(g)?.active?.room;
 if(g.gameMode!=='four-room'||room==null)return g;
 const owner=Object.create(g);owner.actorPose=reduced=>g.actorPoses(reduced).find(p=>p.room===room)||g.actorPose(reduced);return owner;
}
function bossHUD(c,g,p){
 if(!g.level?.isBoss||g.state!=='play')return;
 const boss=g.boss,objectives=typeof g.objectiveProgress==='function'?g.objectiveProgress():[],met=objectives.filter(o=>o.met).length,ratio=boss?Math.max(0,boss.hp)/Math.max(1,boss.maxHp):met/Math.max(1,objectives.length);
 text(c,boss?.hp===0?'문지기 격파':boss?'문지기 · '+boss.phase+'단계 · HP '+boss.hp+'/'+boss.maxHp:'문지기 규칙 '+met+'/'+objectives.length,20,53,12,p.accent,'left',700);
 c.fillStyle='#455964';c.fillRect(20,64,225,4);c.fillStyle=p.accent;c.fillRect(20,64,225*ratio,4);
}
function title(c,time,reduced,best){const p=cellPalette(0),t=reduced?0:time;
 c.fillStyle=p.ink;c.fillRect(0,0,360,480);if(artStyle!=='painted-experiment'||!paintedWorld(c,'tidal',{time:t,reduced}))squareWorld(c,{time:t,reduced,chapter:0,variant:0});
 c.save();c.beginPath();c.rect(16,80,328,328);c.clip();
 c.strokeStyle=p.light;c.lineWidth=32;railPath(c);c.stroke();c.strokeStyle=p.deep;c.lineWidth=1.5;railPath(c);c.stroke();
 const d=reduced?120:(120+t*28)%root.QuadRiftHD.LENGTH,q=root.QuadRiftHD.rail(d);
 human(c,q.x,q.y,{angle:root.QuadRiftHD.angleAt(d,reduced),phase:t*5,scale:GAMEPLAY_SCALE,color:p.ink,reduced});
 c.restore();text(c,'몽유',20,31,22,p.light,'left',750);text(c,'네 변을 따라',20,55,12,p.accent,'left',500);
 text(c,'화면을 눌러 꿈속으로',180,438,14,p.light,'center',650);}
const collectionBounds=Array.from({length:10},(_,i)=>({x:i%2?184:20,y:98+Math.floor(i/2)*56,w:156,h:50,slot:i+1}));
function shorten(value,n=24){const a=Array.from(String(value||''));return a.length>n?a.slice(0,n-1).join('')+'…':a.join('')}
function chapterIndex(g){return g.level?Math.max(0,Math.min(9,(g.level.chapter||1)-1)):Math.max(0,Math.min(9,g.stage||0))}
function collection(c,opt={}){
 const chapter=Math.max(1,Math.min(10,Number(opt.chapter?.id||opt.chapter)||1)),data=root.QuadRiftContent,chapterData=typeof opt.chapter==='object'?opt.chapter:data?.chapters?.find(x=>x.id===chapter),levels=opt.levels||data?.levels?.filter(x=>x.chapter===chapter)||[],p=themes[chapter-1],time=opt.reduced?0:opt.time||0,progress=opt.progress||{},completed=progress.completed||[],P=root.QuadRiftProgress;
 const isComplete=id=>opt.clearedIds?opt.clearedIds.has(id):Array.isArray(completed)?completed.includes(id):!!completed[id];
 c.save();c.clearRect(0,0,360,480);c.fillStyle=p.ink;c.fillRect(0,0,360,480);c.save();c.globalAlpha=.42;backdrop(c,chapter-1,time,!!opt.reduced,0,chapter);c.restore();
 c.fillStyle='rgba(5,18,27,.82)';c.fillRect(0,0,360,91);c.fillRect(0,378,360,102);
 text(c,String(chapter).padStart(2,'0')+'  '+shorten(chapterData?.name||'꿈의 방',11),180,30,18,p.light,'center',800);
 text(c,shorten(chapterData?.subtitle||'열 개의 꿈 · 하나의 문지기',25),180,55,12,p.accent,'center',600);
 const done=levels.filter(x=>isComplete(x.id)).length; text(c,'수집 '+(opt.summary?.completed??(Array.isArray(completed)?completed.length:Object.keys(completed).length))+' / 100  ·  새 방식 '+(opt.summary?.currentCompleted??Object.values(progress.records||{}).filter(r=>r.contentVersion===6).length)+' / 100',180,77,12,'#d3e3df','center',600);
 for(let i=0;i<10;i++){
  const b=collectionBounds[i],level=levels[i]||{id:(chapter-1)*10+i+1,slot:i+1,name:'꿈 '+(i+1),isBoss:i===9},unlocked=opt.unlockedIds?opt.unlockedIds.has(level.id):P?P.unlocked(progress,level.id):level.id===1,cleared=isComplete(level.id),selected=opt.selectedId===level.id;
  c.save();c.fillStyle=selected?p.light:unlocked?'#173440':'#132832';rr(c,b.x,b.y,b.w,b.h,artStyle==='painted-experiment'?7:0);c.fill();c.strokeStyle=selected?p.accent:cleared?p.accent:unlocked?'#63817f':'#3a5059';c.lineWidth=selected?2.5:1; c.stroke();
  const ink=selected?p.ink:'#f1f7e8',muted=selected?'#40554e':'#a0b6bd';
  c.save();c.translate(b.x+23,b.y+25);c.rotate(opt.reduced?0:Math.sin(time*.7+i)*.055);c.fillStyle=selected?p.ink:p.bg;c.fillRect(-14,-14,28,28);c.strokeStyle=unlocked?p.accent:'#526b73';c.lineWidth=2;c.strokeRect(-10,-10,20,20);
  if(level.isBoss){c.beginPath();c.moveTo(0,-9);c.lineTo(9,0);c.lineTo(0,9);c.lineTo(-9,0);c.closePath();c.fillStyle=p.danger;c.fill();c.fillStyle='#fffdf0';c.fillRect(-5,-1,10,3)}else{for(let j=0;j<3;j++){c.fillStyle=[p.light,p.accent,p.deep][(j+i)%3];c.fillRect(-7+j*5,-8+((i+j)%3)*5,4,7)}}c.restore();
  text(c,shorten(level.name,8),b.x+44,b.y+17,12,ink,'left',700);
  const legacy=cleared&&progress.records?.[level.id]?.contentVersion===5,state=cleared?(legacy?'이전판 완료':'완료'):unlocked?'도전 가능':'잠김';text(c,String(level.id).padStart(3,'0')+' · '+state+(level.isBoss&&!legacy?' · 보스':''),b.x+44,b.y+34,12,cleared&&!selected?p.accent:muted,'left',600);
  if(!unlocked&&!cleared){c.strokeStyle=muted;c.lineWidth=1.5;rr(c,b.x+134,b.y+30,9,8,2);c.stroke();c.beginPath();c.arc(b.x+138.5,b.y+30,3,-Math.PI,0);c.stroke()}
  c.restore();
 }
 const selected=levels.find(x=>x.id===opt.selectedId)||levels[0];
 if(selected){text(c,shorten(selected.name,26)+(selected.isBoss?' · 문지기':''),180,393,12,p.light,'center',700);text(c,shorten(selected.cue||selected.description||selected.objectives?.[0]?.text||'미션을 확인하고 꿈에 들어가세요',25),180,411,12,p.accent,'center',550)}
 c.restore();
}
// The ceiling follows the SAME distance-domain rail as its collision interval.
// A tangent-at-center bar would cut across the corner and suggest phantom hits.
function ceilingRibbon(h){
 const width=Math.max(18,Math.min(100,Number(h.width)||18)),steps=Math.max(3,Math.ceil(width/4)),lower=[],upper=[];
 for(let i=0;i<=steps;i++){const d=h.d-width/2+width*i/steps,q=root.QuadRiftHD.rail(d);lower.push({x:q.x+q.nx*42,y:q.y+q.ny*42,d});upper.push({x:q.x+q.nx*54,y:q.y+q.ny*54,d})}
 return {lower,upper,width};
}
function beamArt(c,h,p,tint){
 const ribbon=ceilingRibbon(h);c.save();c.fillStyle=tint;c.strokeStyle=p.ink;c.lineWidth=2;c.beginPath();ribbon.lower.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));for(const q of [...ribbon.upper].reverse())c.lineTo(q.x,q.y);c.closePath();c.fill();c.stroke();
 for(let d=h.d-ribbon.width/2+5;d<h.d+ribbon.width/2-3;d+=12){const q=root.QuadRiftHD.rail(d);c.save();c.translate(q.x,q.y);c.rotate(q.angle);c.fillStyle='#fffef3';c.fillRect(-3,-51,6,3);c.restore()}
 for(const d of [h.d-ribbon.width/2+3,h.d+ribbon.width/2-3]){const q=root.QuadRiftHD.rail(d);line(c,[[q.x+q.nx*55,q.y+q.ny*55],[q.x+q.nx*59,q.y+q.ny*59]],p.ink,2)}c.restore();
}
function hazardArt(c,h,p,g){
 const E=root.QuadRiftHD,q=E.rail(h.d),type=h.type||'barrier',tint=g.level?({beam:'#3679b8',precision:'#7946b5',high:'#d55a37',barrier:'#e77832'}[h.type]||p.danger):p.danger,height=Math.max(E.HAZARD_HEIGHT,Number(h.clearance)||0),width=Math.max(18,Math.min(100,Number(h.width)||18));
 if(type==='beam'){beamArt(c,h,p,tint);return}
 c.save();c.translate(q.x,q.y);c.rotate(q.angle);
 {
  c.fillStyle=p.ink;c.fillRect(-9,-height-2,18,height+2);c.fillStyle=tint;c.fillRect(-7,-height,14,height);c.fillStyle='#fffef3';c.fillRect(-5,-height+2,10,3);
  if(type==='high'||type==='precision'){c.fillStyle=p.accent;c.fillRect(-4,-height+9,8,2);if(type==='precision')c.fillRect(-4,-height+14,8,2)}
  if(h.strike){c.fillStyle=h.struck?p.accent:'#fffef3';c.beginPath();c.moveTo(0,-height-17);c.lineTo(7,-height-10);c.lineTo(0,-height-3);c.lineTo(-7,-height-10);c.closePath();c.fill();c.fillStyle=p.ink;c.fillRect(-1,-height-13,2,7)}
 }
 c.restore();
}
function bossArt(c,g,p,reduced){
 if(!g.level?.isBoss||g.state!=='play')return;const phase=reduced?0:g.time||0,id=g.level.chapter||1,cue=typeof g.bossCue==='function'?g.bossCue():null,boss=g.boss;
 c.save();c.translate(180,266);c.rotate(reduced?0:Math.sin(phase*.25)*.035);c.globalAlpha=boss?.hp===0?.16:.94;c.fillStyle=!reduced&&boss?.flash>0?p.danger:p.ink;
 for(let k=0;k<4;k++){c.save();c.rotate(k*Math.PI/2);c.fillRect(-11,-62,22,17+(id%3)*3);c.restore()}
 rr(c,-40,-40,80,80,6);c.fill();c.strokeStyle=p.accent;c.lineWidth=3;
 // Ten wardens carry different inner seals, not merely a recolored costume.
 if(id===1){c.strokeRect(-31,-31,62,62);c.fillStyle=p.deep;c.fillRect(-23,-23,46,46)}
 else if(id===2){c.save();c.rotate(Math.PI/4);c.strokeRect(-27,-27,54,54);c.fillStyle=p.deep;c.fillRect(-20,-20,40,40);c.restore()}
 else if(id===3){c.strokeRect(-31,-31,62,62);c.strokeRect(-22,-22,44,44);c.fillStyle=p.deep;c.fillRect(-15,-15,30,30)}
 else if(id===4){for(let k=0;k<3;k++){c.strokeRect(-30+k*10,-30+k*10,27,27);c.fillStyle=p.deep;c.fillRect(k*10-5,k*10-5,18,18)}}
 else if(id===5){c.beginPath();c.moveTo(-32,28);c.lineTo(-32,-26);c.lineTo(-14,-10);c.lineTo(0,-31);c.lineTo(14,-10);c.lineTo(32,-26);c.lineTo(32,28);c.closePath();c.fillStyle=p.deep;c.fill();c.stroke()}
 else if(id===6){for(let k=0;k<4;k++){c.save();c.rotate(k*Math.PI/2);c.strokeRect(-29,-29,35,35);c.restore()}c.fillStyle=p.deep;c.fillRect(-18,-18,36,36)}
 else if(id===7){c.fillStyle=p.deep;c.fillRect(-29,-29,58,58);line(c,[[-30,-24],[-8,-24],[-8,-7],[24,-7],[24,25]],p.accent,4);line(c,[[-28,25],[-28,8],[7,8],[7,29]],p.light,3)}
 else if(id===8){for(let k=0;k<3;k++){c.fillStyle=k%2?p.deep:p.accent;c.fillRect(-29,-29+k*22,58,15);c.fillStyle=p.ink;c.fillRect(-20+k*7,-26+k*22,12,9)}}
 else if(id===9){for(let r=0;r<4;r++)for(let k=0;k<4;k++){c.fillStyle=(r+k)%2?p.deep:p.light;c.fillRect(-28+k*14,-28+r*14,13,13)}c.strokeRect(-31,-31,62,62)}
 else{for(let k=0;k<3;k++){c.save();c.rotate((k-1)*.2);c.strokeStyle=k%2?p.light:p.accent;c.strokeRect(-32+k*7,-32+k*7,64-k*14,64-k*14);c.restore()}}
 c.fillStyle=p.light;c.fillRect(-21,-7,42,14);c.fillStyle=p.ink;c.fillRect(-5+(reduced?0:Math.sin(phase*.5)*5),-7,10,14);c.restore();
 if(cue&&cue.type!=='speed'&&Number.isFinite(cue.distance)&&cue.distance>=0&&cue.distance<220){const q=root.QuadRiftHD.rail(g.distance+cue.distance);c.save();c.translate(q.x,q.y);c.rotate(q.angle);c.strokeStyle=p.danger;c.lineWidth=2;c.setLineDash?.([3,3]);c.strokeRect(-16,-58,cue.type==='beam'?32:32,62);c.setLineDash?.([]);c.restore()}
}
// R6: each family is a different play space. Every solid, projectile, lane cue,
// actor and boss below is projected from the same engine geometry as collision.
const MODE_LABELS={'morph-floor':'움직이는 바닥','wave-run':'물결 달리기','four-room':'네 방 동시 달리기','throw-arena':'투척 대결','dodge-arena':'돌진 피하기','kick-arena':'부양 발차기'};
const MODE_HINTS={'morph-floor':['바닥이 움직이고 있어.','틈과 벽을 뛰어넘자.'],'wave-run':['이 길은 물결이야.','경사를 따라 뛰어봐.'],'four-room':['네 방을 함께 봐.','한 번 톡, 모두 점프!'],'throw-arena':['누르면 탄환을 던져.','보스 높이에 맞춰 쏴!'],'dodge-arena':['톡 하면 옆 차선으로!','돌진을 벽으로 유도해.'],'kick-arena':['처음 톡, 높이 점프!','공중에서 톡, 발차기!']};
function pathPoints(c,points,close=false){if(!points?.length)return false;c.beginPath();points.forEach((q,i)=>i?c.lineTo(q.x??q[0],q.y??q[1]):c.moveTo(q.x??q[0],q.y??q[1]));if(close)c.closePath();return true}
function rectSize(q){return {x:q.x,y:q.y,w:q.width??q.w??0,h:q.height??q.h??0}}
// CHROMATIC FOLD: visual-clock breathing only, never an audio synchronization claim.
function familyPalette(g){if(artStyle!=='painted-experiment'){const p=cellPalette(chapterIndex(g));return {...p,mint:'#70D5B6',violet:'#AE79BC'}}const base=themes[chapterIndex(g)],warm=g.gameMode==='dodge-arena'||g.gameMode==='kick-arena';return {...base,bg:warm?'#71366F':'#31586B',deep:warm?'#352244':'#203B52',light:'#F4F0D9',accent:'#DDFE63',ink:'#110E24',danger:'#FF6C79',violet:'#9A63CE',mint:'#43E0C3',actorInk:g.gameMode==='four-room'?'#110E24':'#F4F0D9'}}
function foldedSpace(c,p,t=0,reduced=false,variant=0,kind='title'){
 const time=reduced?0:t,breath=reduced?0:Math.sin(time*.65)*.014,cx=204+Math.sin(time*.18)* (reduced?0:3),cy=203;
 c.fillStyle=p.ink;c.fillRect(16,80,328,328);
 c.save();c.beginPath();c.rect(16,80,328,328);c.clip();
 const poly=(pts,fill,edge)=>{pathPoints(c,pts.map(([x,y])=>({x:x+(reduced?0:Math.sin(time*.65+y/120)*9),y:y+(reduced?0:Math.sin(time*.45+x/150)*4)})),true);c.fillStyle=fill;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=1.5;c.stroke()}};
 if(kind==='morph-floor'||kind==='wave-run'){
  // Two impossible folded planes: a diagonal ceiling and a returning vertical wall.
  const d=reduced?0:Math.sin(time*.65)*12;
  poly([[16,80],[344,80],[344,128+d],[159,182],[16,127]],'#2B2449');
  poly([[16,127],[159,182],[344,128+d],[286,195],[142,232],[16,173]],'#3B6D79',p.mint);
  poly([[16,173],[142,232],[142,247],[16,193]],'#214357');
  poly([[344,80],[292,80],[243,153],[277,229],[344,272]],'#503668',p.violet);
  poly([[292,80],[263,80],[213,152],[248,225],[277,229],[243,153]],'#8353A2');
  poly([[344,272],[277,229],[248,225],[304,276],[344,299]],'#294E60',p.mint);
  // Cell seams follow faces rather than float at random over the player.
  c.globalAlpha=.55;for(let i=1;i<5;i++){const f=i/5;line(c,[[16+143*f,127+55*f],[16+126*f,173+59*f]],'#102538',1);line(c,[[159+185*f,182-54*f],[142+144*f,232-37*f]],'#102538',1)}c.globalAlpha=1;
  line(c,[[18,130],[159,185],[341,131+d]],p.violet,1);
  // A distant missing square gives the folded surfaces a common vanishing point.
  c.save();c.translate(180,248);c.rotate(.15+breath);c.strokeStyle=p.mint;c.globalAlpha=.45;c.lineWidth=1;c.strokeRect(-17,-17,34,34);c.restore();
 }else if(kind==='throw-arena'){
  // Horizontally exploded square halo, deliberately unlike the runner's folded roof.
  for(let i=4;i>=0;i--){const w=48+i*29+(reduced?0:Math.sin(time*.65+i*.3)*8),h=18+i*14,x=208,y=186+(reduced?0:Math.sin(time*.45)*5);c.fillStyle=i%2?'#23394E':'#2B2046';c.fillRect(x-w,y-h,w*2,h*2);c.strokeStyle=i%2?p.mint:p.violet;c.lineWidth=i===0?2:1.5;c.strokeRect(x-w,y-h,w*2,h*2);c.fillStyle='#422C5B';c.fillRect(x-w,y-h,8,h*2)}
  c.fillStyle=p.ink;c.fillRect(16,183,124,7);c.fillRect(262,210,82,12);
 }else if(kind==='kick-arena'){
  // Staircase architecture converges up to ONE aperture, not repeated square rings.
  for(let side of [-1,1]){c.save();c.translate(180,0);c.scale(side,1);poly([[30,110],[64,110],[64,145],[92,145],[92,183],[120,183],[120,225],[151,225],[151,277],[164,277],[164,80],[30,80]],'#4B2B5B',p.violet);poly([[30,110],[47,122],[47,158],[75,158],[75,198],[103,198],[103,240],[134,240],[134,285],[151,277],[151,225],[120,225],[120,183],[92,183],[92,145],[64,145],[64,110]],'#285765',p.mint);c.restore()}
  c.fillStyle=p.ink;c.fillRect(157,100,46,46);c.strokeStyle=p.violet;c.lineWidth=2;c.strokeRect(157,100,46,46);
 }else if(kind==='dodge-arena'){
  poly([[16,80],[344,80],[292,118],[67,118]],'#653D71',p.violet);
  for(let i=0;i<3;i++){const x=90+i*90;c.strokeStyle=p.mint;c.globalAlpha=.5;c.strokeRect(x-30,88,60,42)}c.globalAlpha=1;
 }else{
 // Six large nested rooms form a single focus, not a field of competing tiles.
 for(let i=6;i>=0;i--){const q=24+i*24;c.save();c.translate(cx,cy);c.rotate((i%2?1:-1)*(.055+breath)+variant*.012);c.fillStyle=i%2?'#211A3B':p.deep;c.fillRect(-q,-q,q*2,q*2);c.strokeStyle=i%3===0?p.violet:p.bg;c.lineWidth=i<3?1.5:2;c.strokeRect(-q,-q,q*2,q*2);
 c.globalAlpha=.68;c.strokeStyle=i%2?p.mint:p.violet;c.beginPath();c.moveTo(-q,-q);c.lineTo(q,-q);c.lineTo(q,q);c.stroke();c.globalAlpha=1;
 // Fold face: a broad side plane with a sharp edge, never a fake collision rail.
 c.fillStyle=i%2?'#45305F':'#28586A';c.beginPath();c.moveTo(-q,-q);c.lineTo(-q+12,-q+17);c.lineTo(-q+12,q-17);c.lineTo(-q,q);c.closePath();c.fill();c.restore()}
 }
 // Restrained print separation on two distant edges, away from the action corridor.
 c.globalAlpha=reduced?.5:.5+Math.sin(time*.65)*.12;line(c,[[26,100],[92,122],[109,199]],p.mint,2);line(c,[[29,99],[95,121],[112,198]],p.violet,1);
 c.globalAlpha=.22;for(let i=0;i<7;i++){const x=30+i*46,y=100+(i%3)*34;c.fillStyle=i%2?p.mint:p.violet;c.fillRect(x,y,5,5)}c.globalAlpha=1;
 // A dark lower quiet area preserves the tiny actor and real geometry.
 const shade=c.createLinearGradient(0,230,0,408);shade.addColorStop(0,'rgba(17,14,36,0)');shade.addColorStop(1,'rgba(17,14,36,.9)');c.fillStyle=shade;c.fillRect(16,230,328,178);c.restore();
}
// Painted architecture is scenery only. Crop and light never feed engine geometry.
function paintedWorld(c,key,{x=16,y=80,w=328,h=328,time=0,reduced=false,variant=0,room=false}={}){
 if(artStyle!=='painted-experiment')return squareWorld(c,{x,y,w,h,time,reduced,variant,chapter:key==='eclipse'?1:key==='mirror'?2:0});
 const asset=root.MongyuAssets?.get(key);if(!asset)return false;
 const t=reduced?0:time,drift=reduced?0:Math.sin(t*.13+variant)*1.7,breath=reduced?0:Math.sin(t*.21)*.003;
 c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
 const scale=Math.max(w/asset.width,h/asset.height)*(1.035+breath),dw=asset.width*scale,dh=asset.height*scale;
 const ox=room?(variant%2?-.7:.7):0,oy=room?(variant<2?-.5:.5):0;
 if(room){const sw=asset.width*.5,sh=asset.height*.5,sx=variant%2*sw,sy=Math.floor(variant/2)%2*sh,zoom=1.018+(reduced?0:Math.sin(t*.21)*.002);c.drawImage(asset,sx,sy,sw,sh,x-w*(zoom-1)/2+drift*.2,y-h*(zoom-1)/2,w*zoom,h*zoom)}else c.drawImage(asset,x+(w-dw)/2+drift+ox,y+(h-dh)/2+oy,dw,dh);root.MongyuAssets.record(key);
 // Shared ambient grade joins warm bevels and cool stone without painting false ledges.
 const grade=c.createLinearGradient(x,y,x+w,y+h);grade.addColorStop(0,room?'rgba(255,249,228,.06)':'rgba(24,31,53,.13)');grade.addColorStop(1,room?'rgba(226,238,221,.14)':'rgba(17,14,36,.24)');c.fillStyle=grade;c.fillRect(x,y,w,h);
 const quiet=c.createLinearGradient(0,y+h*.39,0,y+h);quiet.addColorStop(0,room?'rgba(248,243,225,0)':'rgba(17,14,36,0)');quiet.addColorStop(.65,room?'rgba(248,243,225,.72)':'rgba(17,14,36,.56)');quiet.addColorStop(1,room?'rgba(248,243,225,.9)':'rgba(17,14,36,.76)');c.fillStyle=quiet;c.fillRect(x,y+h*.39,w,h*.61);
 c.restore();return true;
}
function sceneTexture(c,p,g,reduced,decorationTime=g.time){if(artStyle!=='painted-experiment'){squareWorld(c,{chapter:chapterIndex(g),variant:g.level?.slot||0,layout:chapterIndex(g)*10+(g.level?.slot||1)-1,time:decorationTime,reduced});c.fillStyle=p.bg;c.fillRect(16,310,328,98);return}if(!paintedWorld(c,g.gameMode?.endsWith('-arena')?'eclipse':'tidal',{time:decorationTime,reduced,variant:g.level?.slot||0}))foldedSpace(c,p,decorationTime,reduced,(g.level?.slot||1)%3,g.gameMode)}
function surfaceBand(c,points,depth){pathPoints(c,points);for(let i=points.length-1;i>=0;i--)c.lineTo(points[i].x,points[i].y+depth);c.closePath()}
function groundTile(c,rect,p,index=0){const q=rectSize(rect);if(q.w<=0||q.h<=0)return;const points=rect.points?.length?rect.points:[{x:q.x,y:q.y},{x:q.x+q.w,y:q.y}],top=Math.min(...points.map(v=>v.y)),bottom=Math.max(...points.map(v=>v.y))+q.h;c.save();surfaceBand(c,points,q.h);c.clip();c.fillStyle=p.deep;c.fillRect(q.x,top,q.w,bottom-top);
 if(artStyle!=='painted-experiment'){
  // Flat square planes and cells remain clipped to the exact support surface.
  const unit=10;for(let row=0;row<Math.ceil((bottom-top)/unit);row++)for(let col=0;col<Math.ceil(q.w/unit);col++){if((row+col+index)%5!==0)continue;c.fillStyle=row%2?p.bg:p.accent;c.fillRect(q.x+col*unit+1,top+row*unit+1,8,8)}
  for(const v of points){c.fillStyle=p.light;c.fillRect(v.x-1,v.y+1,3,3)}pathPoints(c,points);c.strokeStyle=p.ink;c.lineWidth=1;c.stroke();c.restore();return;
 }
 // Pigmented cut stone: all strata, bevel and deterministic grain stay in support.
 for(let band=0;band<4;band++){pathPoints(c,points.map(v=>({x:v.x,y:v.y+6+band*9})));c.strokeStyle=band%2?p.ink:p.bg;c.globalAlpha=band%2?.16:.38;c.lineWidth=band===0?5:2;c.stroke()}
 for(let i=0;i<Math.ceil(q.w*q.h/45);i++){const x=q.x+((i*43.17+index*11)%q.w),y=top+((i*17.91+index*7)%(bottom-top));c.globalAlpha=.07+(i%3)*.025;c.fillStyle=i%3?p.light:p.ink;c.fillRect(x,y,1+(i%3),.65)}
 c.globalAlpha=.24;c.strokeStyle=p.ink;c.lineWidth=1;for(let x=q.x+31;x<q.x+q.w;x+=61){c.beginPath();c.moveTo(x,top+10);c.lineTo(x-3,top+19);c.lineTo(x+1,bottom);c.stroke()}
 c.globalAlpha=1;pathPoints(c,points.map(v=>({x:v.x,y:v.y+3})));c.strokeStyle=p.light;c.lineWidth=4;c.lineCap='butt';c.stroke();pathPoints(c,points.map(v=>({x:v.x,y:v.y+6})));c.strokeStyle=p.bg;c.lineWidth=1;c.stroke();pathPoints(c,points);c.strokeStyle=p.ink;c.lineWidth=1.5;c.stroke();c.restore()}

function floorScene(c,g,p,geo,reduced,decorationTime=g.time){sceneTexture(c,p,g,reduced,decorationTime);c.fillStyle=p.deep;c.globalAlpha=.2;c.fillRect(16,80,328,38);c.globalAlpha=1;// No broad stroke across support ends: its round caps used to paint safe-looking floor into holes.
 // The platform list includes actual holes and moving support faces.
 for(const [i,q]of(geo.platforms||[]).entries())groundTile(c,q,p,i);
 if(!(geo.platforms||[]).length)for(const path of geo.paths||[])if(path.points?.length){const pts=path.points;c.fillStyle=p.deep;pathPoints(c,pts);c.lineTo(pts.at(-1).x,408);c.lineTo(pts[0].x,408);c.closePath();c.fill();pathPoints(c,pts);c.strokeStyle=p.ink;c.lineWidth=3;c.stroke()}
 if(artStyle!=='painted-experiment'){for(let i=0;i<5;i++){const x=16+((i*91-g.distance*.18)%400+400)%400;c.fillStyle=p.deep;c.fillRect(x,151+(i%2)*22,4,4)}return}
 // Wind marks move with world distance, not decoration time, to explain scrolling.
 c.strokeStyle=p.deep;c.lineWidth=2;for(let i=0;i<5;i++){const x=16+((i*91-g.distance*.18)%400+400)%400;line(c,[[x,151+(i%2)*22],[x+24,151+(i%2)*22]],p.deep,2)}
}
function waveScene(c,g,p,geo,reduced,decorationTime=g.time){sceneTexture(c,p,g,reduced,decorationTime);const main=(geo.paths||[])[0]?.points||[];
 // Exactly the sampled support surface, with all pigment beneath its contact line.
 if(main.length)groundTile(c,{x:main[0].x,y:Math.min(...main.map(q=>q.y)),width:main.at(-1).x-main[0].x,height:160,points:main},p,2);
 for(const q of geo.platforms||[])if(q.kind==='moving')groundTile(c,q,p);
}
function roomScene(c,g,p,geo,reduced,decorationTime=g.time){c.fillStyle=p.ink;c.fillRect(16,80,328,328);const rooms=geo.rooms||[];
 for(const [i,rect]of rooms.entries()){const q=rectSize(rect);c.fillStyle=i%2?'#D5DFCE':'#F4F0D9';c.fillRect(q.x,q.y,q.w,q.h);c.strokeStyle=p.bg;c.lineWidth=2;c.strokeRect(q.x,q.y,q.w,q.h);c.save();c.beginPath();c.rect(q.x+2,q.y+2,q.w-4,q.h-4);c.clip();
 if(!paintedWorld(c,'mirror',{x:q.x+2,y:q.y+2,w:q.w-4,h:q.h-4,time:decorationTime,reduced,variant:i,room:true})){const t=reduced?0:decorationTime;c.save();c.translate(q.x+q.w*(i%2?.28:.72),q.y+q.h*.38);c.rotate([.16,-.16,.785,0][i]+(reduced?0:Math.sin(t*.3)*.025));
 for(let k=3;k>=0;k--){const size=18+k*15;c.fillStyle=[p.bg,p.mint,'#ACA0C6',p.deep][k];c.globalAlpha=k===0?.48:.38;c.fillRect(-size,-size,size*2,size*2);c.fillStyle=i%2?'#D5DFCE':'#F4F0D9';c.fillRect(-size+7+(i===1?5:0),-size+7+(i===2?5:0),size*2-14,size*2-14)}if(i===3){c.fillStyle=p.violet;c.globalAlpha=.6;c.fillRect(-52,-8,104,16)}c.restore();c.globalAlpha=1;
 c.fillStyle='rgba(244,240,217,.85)';c.fillRect(q.x,q.y+q.h*.65,q.w,q.h*.35);}c.restore();text(c,String(i+1).padStart(2,'0'),q.x+9,q.y+15,11,p.ink,'left',750)}
 for(const [i,q]of(geo.platforms||[]).entries())groundTile(c,q,p,i);
 for(const path of geo.paths||[]){pathPoints(c,path.points);c.strokeStyle=p.ink;c.lineWidth=2;c.stroke()}
 // Four independent spaces, one shared input. The thin linking bars are outside rooms.
 c.strokeStyle=p.ink;c.lineWidth=2;c.setLineDash?.([3,4]);line(c,[[174,180],[186,180]],p.ink,2);line(c,[[174,331],[186,331]],p.ink,2);c.setLineDash?.([]);
}
function arenaScene(c,g,p,geo,reduced,decorationTime=g.time){const mode=g.gameMode;sceneTexture(c,p,g,reduced,decorationTime);
 if(artStyle!=='painted-experiment'){
  if(mode==='dodge-arena')for(const lane of geo.lanes||[90,180,270]){const x=typeof lane==='number'?lane:lane.x;c.fillStyle=p.light;c.globalAlpha=.3;c.fillRect(x-35,94,70,302);c.globalAlpha=1;for(let y=104;y<383;y+=14){c.fillStyle=p.deep;c.fillRect(x-35,y,3,3);c.fillRect(x+32,y,3,3)}}
  for(const [i,q]of(geo.platforms||[]).entries())groundTile(c,q,p,i);
  const t=geo.telegraph;if(t&&(mode!=='dodge-arena'||t.type==='telegraph')){const q=rectSize(t),r=q.w&&q.h?q:{x:t.x-28,y:105,w:56,h:278};if(Number.isFinite(r.x)){c.save();c.beginPath();c.rect(r.x,r.y,r.w,r.h);c.clip();for(let y=r.y;y<r.y+r.h;y+=9)for(let x=r.x;x<r.x+r.w;x+=9){c.fillStyle=p.danger;c.globalAlpha=.28;c.fillRect(x+2,y+2,5,5)}c.restore()}}return;
 }
 if(mode==='dodge-arena'){
  const lanes=geo.lanes||[90,180,270];for(let i=0;i<lanes.length;i++){const x=typeof lanes[i]==='number'?lanes[i]:lanes[i].x;c.save();const wash=c.createLinearGradient(x-35,0,x+35,0);wash.addColorStop(0,'rgba(93,71,112,.08)');wash.addColorStop(.5,'rgba(30,23,45,.5)');wash.addColorStop(1,'rgba(93,71,112,.08)');c.fillStyle=wash;c.fillRect(x-35,94,70,302);c.strokeStyle='rgba(191,163,193,.3)';c.lineWidth=.8;line(c,[[x-36,103],[x-36,382]],'rgba(191,163,193,.3)',.8);line(c,[[x+36,103],[x+36,382]],'rgba(191,163,193,.3)',.8);text(c,String(i+1),x,389,10,p.light,'center',600);c.restore()}
 }
 for(const [i,q]of(geo.platforms||[]).entries())groundTile(c,q,p,i);
 // Soft engine-owned danger volume and detached directional ticks: no icon frame.
 const t=geo.telegraph;if(t&&(mode!=='dodge-arena'||t.type==='telegraph')){const q=rectSize(t);c.save();c.globalAlpha=.14;c.fillStyle=p.danger;if(q.w&&q.h)c.fillRect(q.x,q.y,q.w,q.h);else if(Number.isFinite(t.x))c.fillRect(t.x-28,105,56,278);c.globalAlpha=1;
 if(q.w&&q.h){const mid=q.x+q.w/2;line(c,[[mid-9,q.y-4],[mid,q.y+1],[mid+9,q.y-4]],p.danger,2);line(c,[[mid-9,q.y+q.h+4],[mid,q.y+q.h-1],[mid+9,q.y+q.h+4]],p.danger,2)}else if(Number.isFinite(t.x))line(c,[[t.x-12,291],[t.x,305],[t.x+12,291]],p.danger,3);c.restore()}
}
// A hole is the engine interval, never a rounded stroke or a decorative tear.
function gapBounds(g,h,geo=g.geometry()){const q=g.hazardPose(h),authoritative=(geo.gaps||[]).find(v=>v.id===h.id&&v.id!==undefined||v.d===h.d&&v.d!==undefined);if(authoritative)return {left:authoritative.left,right:authoritative.right,y:authoritative.y??q.y,depth:authoritative.depth??54,points:authoritative.points||[{x:authoritative.left,y:authoritative.leftY??q.y},{x:authoritative.right,y:authoritative.rightY??q.y}]};return {left:q.x-q.width/2,right:q.x+q.width/2,y:q.y,depth:54}}
function drawGap(c,g,h,p,geo){const b=gapBounds(g,h,geo),w=b.right-b.left;if(w<=0)return;const points=b.points||[{x:b.left,y:b.y},{x:b.right,y:b.y}],top=Math.min(...points.map(v=>v.y)),bottom=Math.max(...points.map(v=>v.y))+b.depth;c.save();surfaceBand(c,points,b.depth);c.clip();c.fillStyle=p.ink;c.fillRect(b.left,top,w,bottom-top);
 // Vertical square-cut walls stay INSIDE the physical missing interval.
 c.fillStyle=p.deep;c.fillRect(b.left,points[0].y+2,2,b.depth-2);c.fillRect(b.right-2,points.at(-1).y+2,2,b.depth-2);c.fillStyle=p.danger;c.fillRect(b.left,points[0].y,2,8);c.fillRect(b.right-2,points.at(-1).y,2,8);c.restore()}
function liveHazard(c,h,g,p,geo){const q=g.hazardPose(h);if(!q||q.visible===false||(h.done&&h.type!=='gap'))return;const w=q.width??h.width??18,ht=q.height??h.clearance??18,type=q.type||h.type;if(type==='gap'){drawGap(c,g,h,p,geo);return}
 c.save();if(g.gameMode==='four-room'){const r=geo?.rooms?.[q.room];if(r){c.beginPath();c.rect(r.x+2,r.y+2,r.width-4,r.height-4);c.clip()}}c.translate(q.x,q.y);c.rotate(q.angle||0);const beam=type==='beam',ceiling=q.ceiling??h.ceiling??10,top=beam?-(36*(g.gameMode==='four-room'?.5:.75)+ceiling)-13:-ht,H=beam?13:ht;
 if(artStyle!=='painted-experiment'){c.fillStyle=p.ink;c.fillRect(-w/2,top,w,H);c.save();c.beginPath();c.rect(-w/2,top,w,H);c.clip();for(let y=top;y<top+H;y+=5)for(let x=-w/2;x<w/2;x+=5){c.fillStyle=(Math.floor(x/5)+Math.floor(y/5))%4?p.danger:p.light;c.fillRect(x+.4,y+.4,4.2,4.2)}c.restore();c.restore();return}
 // Coral ceramic warns by both hue and chipped crown; collision box is unchanged.
 c.fillStyle='#502c40';c.fillRect(-w/2,top,w,H);c.fillStyle=p.danger;c.beginPath();c.moveTo(-w/2+1,top+1);c.lineTo(w/2-1,top+1);c.lineTo(w/2-1,top+H-2);c.lineTo(-w/2+1,top+H-1);c.closePath();c.fill();c.fillStyle='#a94659';c.fillRect(w/2-Math.min(4,w/3),top+2,Math.min(3,w/3),H-3);c.fillStyle='#ffd9bd';c.fillRect(-w/2+1,top+1,Math.max(1,w-3),1.3);c.fillStyle=p.ink;c.fillRect(-w/2,top+H-2,w,2);
 if(beam){for(let x=-w/2+5;x<w/2-2;x+=11)line(c,[[x,top+5],[x+3,top+8],[x,top+11]],'#ffe6cc',1)}else if(type==='moving'||type==='piston'){line(c,[[-Math.min(3,w/4),top+H*.6],[0,top+H*.4],[Math.min(3,w/4),top+H*.6]],'#fff0d7',1.3)}else{c.strokeStyle='#ffe6cc';c.lineWidth=1;c.beginPath();c.moveTo(-w*.22,top+H*.7);c.lineTo(0,top+H*.37);c.lineTo(w*.22,top+H*.7);c.stroke()}c.restore()}

function liveBoss(c,g,p,geo){if(artStyle!=='painted-experiment'){squareBoss(c,g,p,geo);return}const b=geo.boss;if(!b||g.boss?.hp===0)return;const w=b.width??b.w??56,h=b.height??b.h??56;c.save();c.translate(b.x,b.y);c.beginPath();c.rect(-w/2,-h/2,w,h);c.clip();c.scale(w/48,h/48);const flash=g.boss?.flash>0,ivory=flash?'#fffde9':p.light,open=b.vulnerable!==false;
 const shape=(pts,fill,edge=p.ink)=>{pathPoints(c,pts,true);c.fillStyle=fill;c.fill();c.strokeStyle=edge;c.lineWidth=1.2;c.lineJoin='round';c.stroke()};
 if(g.gameMode==='throw-arena'){
  // Kinetic seed: offset shell lobes surround a suspended hot nucleus.
  shape([[-22,-12],[-15,-22],[0,-24],[18,-18],[24,-5],[22,14],[10,23],[-10,24],[-22,13]],p.deep);
  shape([[-22,-12],[-15,-22],[0,-24],[9,-19],[-6,-13],[-14,0],[-22,7]],ivory);
  shape([[18,-18],[24,-5],[22,14],[10,23],[5,17],[13,6],[12,-7]],'#779593');
  shape([[-19,11],[-10,24],[10,23],[5,17],[-5,15],[-11,5]],'#426675');
  c.save();c.rotate((b.y-267)*.009);shape([[-10,-5],[-3,-13],[8,-10],[12,1],[5,12],[-7,10]],p.accent);shape([[-3,-13],[8,-10],[12,1],[1,-1]],'#fff7c5');c.restore();line(c,[[-17,-8],[-9,-17],[0,-19]],'#fff7d6',1);line(c,[[17,2],[14,12],[8,17]],p.mint,1);
 }else if(g.gameMode==='dodge-arena'){
  // A broad brow and split jaw create a heavy charger, not a triangle icon.
  const charge=b.attack==='charge';shape([[-24,-12],[-17,-23],[16,-24],[24,-13],[23,12],[14,23],[-13,24],[-23,12]],'#614956');shape([[-24,-12],[-17,-23],[16,-24],[21,-15],[10,-8],[-9,-10]],ivory);shape([[-20,-10],[-7,-7],[-3,2],[-10,20],[-20,12]],'#a49c9c');shape([[20,-12],[8,-8],[3,2],[10,21],[21,12]],'#756d7d');shape([[-12,-7],[12,-8],[9,11],[0,24],[-8,12]],charge?p.danger:'#c88480');line(c,[[-16,-5],[-7,-2]],p.ink,3);line(c,[[7,-2],[16,-6]],p.ink,3);line(c,[[-14,-5],[-8,-3]],charge?'#fff1cc':p.danger,1.4);line(c,[[8,-3],[14,-5]],charge?'#fff1cc':p.danger,1.4);line(c,[[0,4],[-2,12],[0,18]],'#ffe1c0',1);line(c,[[-19,9],[-14,16]],'#d2b7a6',1);
 }else{
  // Branching mineral heart folds closed during guard and opens on engine cue.
  const spread=open?1:.7;for(const sign of [-1,1]){c.save();c.scale(sign,1);shape([[5,-5],[13*spread,-20],[23,-24],[20,-9],[24,4],[17,14],[8,23],[4,13]],'#706181');shape([[13*spread,-20],[23,-24],[20,-9],[12,-4]],ivory);shape([[12,3],[24,4],[17,14],[8,23]],'#a0829e');line(c,[[18,-16],[14,-5],[18,5],[10,15]],open?p.accent:'#c6b8bf',1.2);c.restore()}
  c.beginPath();c.moveTo(0,-8);c.bezierCurveTo(-13,-20,-21,-3,-9,8);c.lineTo(0,20);c.lineTo(10,8);c.bezierCurveTo(22,-4,12,-20,0,-8);c.fillStyle=flash?'#fffde9':open?p.accent:'#b67891';c.fill();c.strokeStyle=p.ink;c.lineWidth=1.5;c.stroke();line(c,[[0,-7],[-3,2],[3,7],[0,16]],ivory,1.1);line(c,[[-3,2],[-9,-3]],ivory,1);line(c,[[3,7],[10,1]],'#627c68',1);
 }c.restore();
 for(const q of geo.projectiles||[]){const w=q.width??q.w??8,h=q.height??q.h??8;c.save();c.translate(q.x,q.y);c.fillStyle=q.owner==='boss'?p.danger:p.accent;c.beginPath();c.moveTo(-w/2,0);c.quadraticCurveTo(-w/3,-h/2,w/3,-h/2);c.lineTo(w/2,0);c.quadraticCurveTo(w/3,h/2,-w/3,h/2);c.closePath();c.fill();c.strokeStyle=p.ink;c.lineWidth=1;c.stroke();line(c,[[-w*.2,-h*.2],[w*.2,-h*.2]],p.light,.8);c.restore()}
}

function renderActors(c,g,p,reduced){const all=typeof g.actorPoses==='function'?g.actorPoses(reduced):[actorPose(g,reduced)];for(const [index,raw]of all.entries()){const q={height:0,angle:0,phase:g.distance*.14,scale:GAMEPLAY_SCALE,...raw},contact=Math.max(0,1-q.height/100);c.save();c.translate(q.x,q.y);c.rotate(q.angle);c.fillStyle='rgba(7,19,31,'+(.1+contact*.18)+')';c.beginPath();if(artStyle==='painted-experiment')c.ellipse(0,1,3+contact*4,1+contact*.5,0,0,Math.PI*2);else c.rect(-3-contact*4,0,6+contact*8,2);c.fill();c.restore();human(c,q.x,q.y,{angle:q.angle,phase:q.phase,jump:q.height,color:p.actorInk||p.ink,reduced,scale:q.scale,kick:g.gameMode==='kick-arena'&&g.arena?.kick>0,facing:actorFacing(g,q),airProgress:1-(g.jump||0)/(g.gameMode==='kick-arena'?1.28:root.QuadRiftHD.JUMP_SECONDS),idle:!!g.arena&&!(g.arena.move>0)||!!g.waiting,time:g.time||0,settleProgress:g.resultSettle??null,throwProgress:g.gameMode==='throw-arena'&&g.arena.cooldown>0?1-g.arena.cooldown/g.modeParams.cooldown:null,evade:g.gameMode==='dodge-arena'&&g.arena.move>0?1-g.arena.move/.16:0});
 // Brief physical feedback follows actual hit state, never a looping aura.
 // Marks stay within actor bounds; reduced motion receives no added effect.
 if(!reduced&&g.hitFlash>0){c.save();c.translate(q.x,q.y);c.rotate(q.angle);c.translate(0,-q.height);c.scale(q.scale,q.scale);const alpha=Math.min(1,g.hitFlash*4);c.globalAlpha=alpha;line(c,[[-12,-29],[-9,-26]],p.danger,1.3);line(c,[[11,-34],[14,-37]],p.danger,1.3);c.restore()}}
}
function r6HUD(c,g,p){if(g.mode==='origin-finale'){text(c,'사각의 문지기',20,28,17,p.light,'left',700);text(c,'마지막 방 · 네모 투척',20,54,12,p.accent,'left',600);for(let i=0;i<(g.boss?.maxHp||4);i++){c.fillStyle=i<(g.boss?.hp||0)?p.accent:p.deep;c.fillRect(280+i*15,48,9,9)}text(c,'남은 네모 '+Math.max(0,(g.arena?.shotLimit||0)-(g.metrics?.shots||0)),20,435,12,p.light,'left',600);for(let i=0;i<3;i++){c.fillStyle=i<g.hearts?p.accent:p.deep;c.fillRect(305+i*12,431,7,7)}return} text(c,String(g.levelId).padStart(3,'0')+'  '+shorten(g.level.name,14),20,27,15,'#fffef3','left',750);text(c,String(g.score).padStart(3,'0'),340,27,16,'#d8e5e8','right',700);if(g.boss){bossHUD(c,g,p);text(c,MODE_LABELS[g.gameMode],340,53,12,'#c6dce3','right',650)}else{text(c,MODE_LABELS[g.gameMode],20,53,12,p.accent,'left',700);text(c,g.heroShowcase?.active?'짧은 꿈 체험':g.mode==='freeplay'?'기록 없는 연습':'꿈의 길',340,53,12,'#bed6df','right',600)}
 const progress=Math.min(1,g.distance/Math.max(1,g.level.length)),limit=Math.max(1,g.level.heartLimit||3);text(c,g.gameMode==='throw-arena'?'탄환 '+Math.max(0,g.arena.shotLimit-g.metrics.shots):g.boss?Math.max(0,Math.ceil(g.modeParams.duration-g.time))+'초':Math.floor(progress*100)+'%',20,434,12,'#d8e5e8','left',650);text(c,g.combo>1?g.combo+' 연속':MODE_LABELS[g.gameMode],340,434,12,p.accent,'right',650);for(let i=0;i<limit;i++){const x=148+i*19;c.fillStyle=i<g.hearts?'#fb648e':'#30434c';if(artStyle!=='painted-experiment'){c.fillRect(x-3,429,8,8);continue}c.beginPath();c.moveTo(x,439);c.bezierCurveTo(x-10,433,x-8,426,x-2,428);c.bezierCurveTo(x+5,421,x+13,432,x,439);c.fill()}
 const objectives=g.objectiveProgress?.()||[],active=objectives.find(o=>!o.met&&o.type!=='finish')||objectives.find(o=>o.type!=='finish');if(active){const labels={hits:'충돌',jumps:'점프',combo:'연속',perfect:'정점 통과',ground:'천장 통과',passed:'위험 통과',strikes:'명중',boss:'보스 피해',bossDamage:'보스 피해'};text(c,(active.met?'✓ ':'')+(labels[active.type]||shorten(active.text,18))+' '+Math.floor(active.value||0)+' / '+active.target,180,461,12,active.met?p.accent:'#e2edee','center',650)}c.fillStyle='#253c47';c.fillRect(20,476,320,3);c.fillStyle=p.accent;c.fillRect(20,476,320*progress,3)
}
// Terminal states remain places, not slides. This model reads actual outcome
// flags only; decorative gates never advance actors, award progress or imply exit.
const KICK_SETTLE_SECONDS=.65;
// A fresh read-only presentation facade: no renderer cache, game writes or wall clock.
// resultElapsed is supplied by the app's visible, result-identity-local clock.
function resultActor(g,opt={}){
 if(g.state!=='clear'||g.gameMode!=='kick-arena'||!g.result||g.result.state!=='clear')return g;
 const elapsed=Number.isFinite(opt.resultElapsed)?Math.max(0,opt.resultElapsed):0,u=opt.reduced?1:Math.min(1,elapsed/KICK_SETTLE_SECONDS),ease=u*u*(3-2*u),view=Object.create(g);
 view.actorPoses=(reduced=false)=>g.actorPoses(reduced).map(q=>({...q,height:Math.max(0,q.height)*(1-ease)}));
 view.actorPose=(reduced=false)=>view.actorPoses(reduced)[0];
 view.resultSettle=ease;
 return view;
}
function resultScene(g,opt={}){
 if(!['pause','fail','clear'].includes(g.state))return null;
 const cleared=g.state==='clear',finale=g.mode==='origin-finale',facts=cleared&&finale?{replySolved:opt.outcome?.replySolved===true,companionCrossed:opt.outcome?.companionCrossed===true,dayNightCrossed:opt.outcome?.dayNightCrossed===true,fullRoute:opt.outcome?.fullRoute===true,routeComplete:opt.outcome?.routeComplete===true}:{};
 const cue=g.state==='pause'?'잠깐 쉬자.':g.state==='fail'?(g.mode==='origin-route'?(g.originLastHit?originContactCopy(g.originLastHit)[1]:'다시 도전하자.'):g.gameMode==='throw-arena'?'높이를 맞춰 던지자.':'다시 도전하자.'):finale?(facts.dayNightCrossed?(facts.replySolved?(facts.companionCrossed?'답신 따라 함께 왔어.':'답신이 길을 열었어.'):facts.companionCrossed?'둘이 함께 건넜어.':'밤길도 건넜어.'):'문이 열렸어.'):g.gameMode==='four-room'?'건넜어.':'이 길을 지나왔어.';
 const cueSecond=facts.dayNightCrossed&&(facts.replySolved||facts.companionCrossed)?'밤길도 건넜어.':'';
 return {state:g.state,cue,cueSecond,facts,gate:cleared,finale};
}
function resultWorld(c,g,p,opt={}){
 const scene=resultScene(g,opt);if(!scene)return;
 const reduced=!!opt.reduced,q=actorPose(g,reduced);c.save();c.beginPath();c.rect(16,80,328,328);c.clip();
 if(scene.gate){
  // The exit is seated on the retained support, not an icon in a results card.
  const geo=g.geometry?.()||{},room=g.actorPose?.(reduced)?.room??0,path=(geo.paths||[]).find(v=>(v.room??0)===room&&v.points?.length),pts=path?.points||[],platform=(geo.platforms||[]).find(v=>(v.room??0)===room),small=g.gameMode==='four-room';
  let x=q.x<220?286:66,y=q.y;
  if(pts.length){const left=Math.min(...pts.map(v=>v.x)),right=Math.max(...pts.map(v=>v.x)),margin=small?20:30;x=q.x<(left+right)/2?right-margin:left+margin;const sample=pts.reduce((a,b)=>Math.abs(a.x-x)<Math.abs(b.x-x)?a:b);y=sample.y;for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];if(a.x!==b.x&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)){y=a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x);break}}}
  else if(platform){x=platform.x+platform.width-30;y=platform.y}
  const w=small?22:34,h=small?42:66,t=reduced?0:(Number(opt.time)||0);
  c.fillStyle=p.ink;c.fillRect(x-w/2-5,y-h-5,w+10,h+5);
  c.fillStyle=p.light;c.fillRect(x-w/2,y-h,w,h);
  c.fillStyle=p.bg;c.fillRect(x-w/2+7,y-h+8,w-14,h-8);
  // Two retracted square leaves expose the path; no actor crosses it for you.
  c.fillStyle=p.deep;c.fillRect(x-w/2-10,y-h,7,h);c.fillRect(x+w/2+3,y-h,7,h);
  c.fillStyle=p.accent;c.fillRect(x-w/2-6,y-h-8,w+12,3);
  for(let i=0;i<4;i++){c.fillStyle=i%2?p.light:p.accent;c.fillRect(x-11+i*8,y+3,5,3)}
  for(let i=0;i<3;i++){const drift=reduced?0:Math.sin(t*.6+i)*2;c.fillStyle=p.light;c.fillRect(x-5+i*5,y-19-i*12+drift,2,2)}
  // Recollections are physically inset into the door jamb, never fabricated
  // figures, new exits or a claim that this actor crossed during the epilogue.
  if(scene.facts.replySolved){c.strokeStyle=p.accent;c.lineWidth=1.5;c.strokeRect(x-w/2-8,y-44,5,5);line(c,[[x-w/2-8,y-41],[x-w/2-3,y-41]],p.accent,1)}
  if(scene.facts.companionCrossed){for(let i=0;i<2;i++){c.fillStyle=p.accent;c.fillRect(x+w/2+4,y-44+i*8,4,4)}}
 }
 if(g.state==='fail'&&g.mode==='origin-route'&&g.originLastHit?.polygon?.length){pathPoints(c,g.originLastHit.polygon,true);c.strokeStyle=p.light;c.lineWidth=3;c.stroke();c.strokeStyle=p.danger;c.lineWidth=1;c.stroke()}
 c.restore();
}
function resultPanel(c,g,p,opt={}){const scene=resultScene(g,opt);if(!scene)return;characterBubble(c,g,[scene.cue,scene.cueSecond],!!opt.reduced)}
function speechLayouts(g,reduced=false){const copy=dialogueCue(g);if(!copy)return [];const owner=speechActor(g),layout=bubbleLayout(owner,reduced,copy);return layout.safe?[{...layout,copy,actor:actorPose(owner,reduced),room:owner.actorPose?.(reduced)?.room??0}]:[]}
function drawFamilies(c,g,opt={}){const reduced=!!opt.reduced,p=familyPalette(g),geo=g.geometry(),decorationTime=g.state==='pause'?g.time:Number.isFinite(opt.time)?opt.time:g.time;c.save();c.clearRect(0,0,360,480);c.fillStyle='#07151f';c.fillRect(0,0,360,480);c.save();c.beginPath();c.rect(16,80,328,328);c.clip();if(g.gameMode==='morph-floor')floorScene(c,g,p,geo,reduced,decorationTime);else if(g.gameMode==='wave-run')waveScene(c,g,p,geo,reduced,decorationTime);else if(g.gameMode==='four-room')roomScene(c,g,p,geo,reduced,decorationTime);else arenaScene(c,g,p,geo,reduced,decorationTime);
 const actor=resultActor(g,opt),copy=dialogueCue(g);if(copy)characterBubble(c,actor,copy,reduced);for(const h of g.hazards||[])liveHazard(c,h,g,p,geo);liveBoss(c,g,p,geo);resultWorld(c,g,p,opt);renderActors(c,actor,p,reduced);c.restore();r6HUD(c,g,p);resultPanel(c,actor,p,opt);c.restore()}

function tutorialCopy(g){return {approach:['가까이 가 볼까?','장애물 앞에서 멈출게.'],jump:[g.recoveries?'괜찮아, 다시!':'지금, 화면을 톡!','점프해서 넘어가자.'],corner:['잘 넘었어!','착지 후에도 달려가.'],confirm:['다음 꿈은 다른 규칙!','말풍선으로 알려 줄게.']}[g.tutorialStep]}
function drawTutorial(c,g,opt={}){const p=familyPalette(g),reduced=!!opt.reduced,geo=g.geometry();c.save();c.clearRect(0,0,360,480);c.fillStyle='#07151f';c.fillRect(0,0,360,480);c.save();c.beginPath();c.rect(16,80,328,328);c.clip();floorScene(c,g,p,geo,reduced);if(g.state==='play')characterBubble(c,g,tutorialCopy(g),reduced);for(const h of g.hazards)liveHazard(c,h,g,p,geo);renderActors(c,g,p,reduced);c.restore();text(c,'첫 걸음 · 안전 연습',20,28,16,'#fffef3','left',750);text(c,'실수해도 같은 지점에서 다시',20,55,12,p.accent,'left',650);text(c,g.tutorialStep==='confirm'?'한 번 더 눌러 첫 꿈으로':'화면·Space·Enter로 점프',180,438,14,'#f7f5d9','center',700);text(c,'다른 꿈의 조작은 인물의 말풍선에서',180,463,12,'#bad4dc','center');if(g.state==='pause')resultPanel(c,g,p,opt);c.restore()}
function draw(c,g,opt={}){if(!opt.collection&&g.gameMode==='origin-four-edge'&&g.state!=='title'){drawOrigin(c,g,opt);return}if(!opt.collection&&g.gameMode==='tutorial-floor'&&g.state!=='title'){drawTutorial(c,g,opt);return}if(!opt.collection&&g.state!=='title'&&g.mode!=='tutorial'&&MODE_LABELS[g.gameMode]&&typeof g.geometry==='function'){drawFamilies(c,g,opt);return}if(opt.collection){collection(c,{...opt.collection,time:opt.time,reduced:opt.reduced});return}const reduced=!!opt.reduced;c.save();c.clearRect(0,0,360,480);if(g.state==='title'){title(c,opt.time||0,reduced,g.best);c.restore();return}c.fillStyle='#07151f';c.fillRect(0,0,360,480);const stage=chapterIndex(g),p=themes[stage];backdrop(c,stage,g.time,reduced,g.distance,g.level?.slot||0);bossArt(c,g,p,reduced);
 // Dialogue is behind actors: a tail can never erase a hazard or a running limb.
 if(g.mode==='tutorial'&&g.state==='play'){const copy={approach:['가까이 가 볼까?','장애물 앞에서 멈출게.'],jump:[g.recoveries?'괜찮아, 다시!':'지금, 화면을 톡!','점프해서 넘어가자.'],corner:['모서리다!','방향은 저절로 바뀌어.'],confirm:['어느 방향이든, 톡.','한 번 더 누르면 출발!']}[g.tutorialStep];characterBubble(c,g,copy,reduced);}
 const dialogue=dialogueCue(g);if(dialogue)characterBubble(c,g,dialogue,reduced);
 for(const h of g.hazards){if(h.done||h.d<g.distance-Math.max(16,(h.width||0)/2)||h.d>g.distance+(h.revealDistance||g.level?.revealDistance||680))continue;hazardArt(c,h,p,g)}
 const q=actorPose(g,reduced),height=q.height,angle=q.angle;c.save();c.translate(q.x,q.y);c.rotate(q.angle);c.fillStyle='rgba(7,30,41,.16)';c.beginPath();c.ellipse(0,1,10*GAMEPLAY_SCALE*(1-height/100),2.5*GAMEPLAY_SCALE,0,0,Math.PI*2);c.fill();c.restore();human(c,q.x,q.y,{angle,phase:q.phase,jump:height,color:p.ink,reduced,scale:q.scale,facing:q.facing});if(g.invincible>0){c.save();c.translate(q.x,q.y);c.rotate(angle);c.translate(0,-height-22*GAMEPLAY_SCALE);c.strokeStyle=p.danger;c.lineWidth=2*GAMEPLAY_SCALE;c.beginPath();c.arc(0,0,24*GAMEPLAY_SCALE,0,Math.PI*2);c.stroke();c.restore()}
 // Quiet HUD: mission truth, not decorative scores or a fictional boss HP bar.
 const objectives=typeof g.objectiveProgress==='function'?g.objectiveProgress():[];
 if(g.level&&g.mode!=='tutorial'){
  text(c,String(g.levelId).padStart(3,'0')+'  '+shorten(g.level.name,16),20,27,15,'#fffef3','left',750);if(!g.level.isBoss)text(c,(['practice','freeplay'].includes(g.mode)?'자유 연습 · ':'')+p.name,20,53,8,p.accent,'left',700);text(c,String(g.score).padStart(3,'0'),340,27,17,'#d8e5e8','right',700);text(c,'SCORE',340,53,8,'#aac0c9','right',650);
 }else{ text(c,g.mode==='tutorial'?'연습':String(g.score).padStart(3,'0'),20,31,g.mode==='tutorial'?19:28,'#fffef3','left',750);text(c,g.mode==='tutorial'?'SAFE / 무제한 연습':'SCORE',21,58,8,'#aac0c9','left',650);text(c,'BEST '+g.best,340,28,11,'#d8e5e8','right',600);text(c,p.name,340,52,8,p.accent,'right',700)}
 bossHUD(c,g,p);
 if(g.level&&!g.level.isBoss&&g.mode!=='tutorial'){
  const next=g.hazards.find(h=>!h.done&&h.d+(h.width||18)/2>=g.distance),change=(g.level.speedChanges||[]).find(v=>v.at>g.distance&&v.at-g.distance<240);
  const hint=change?change.cue+' · '+Math.ceil((change.at-g.distance)/(g.speed||120))+'초 뒤':next?(next.strike?'공중에서 한 번 더: 반격':{beam:'천장 · 걷기',precision:'보라 아치 · 최고점',high:'높은 벽 · 미리 점프',barrier:'바닥 장애물 · 점프'}[next.type]||'점프')+' · '+Math.max(0,Math.round(next.d-g.distance))+' 거리':'끝 지점까지 안전하게';text(c,shorten(hint,30),180,70,11,'#bed6df','center',600);
 }
 const limit=Math.max(1,g.level?.heartLimit||3);for(let i=0;i<limit;i++){const hx=180+(i-(limit-1)/2)*19;c.fillStyle=i<g.hearts?'#fb648e':'#30434c';if(artStyle!=='painted-experiment'){c.fillRect(hx-3,429,8,8);continue}c.beginPath();c.moveTo(hx,441);c.bezierCurveTo(hx-10,435,hx-8,428,hx-2,430);c.bezierCurveTo(hx+5,423,hx+13,434,hx,441);c.fill()}
 if(g.mode==='campaign'||g.mode==='practice'||g.mode==='freeplay'){
  const length=g.level?.length||root.QuadRiftHD.LENGTH*6,progress=Math.min(1,g.distance/length);text(c,Math.floor(progress*100)+'%  ·  '+(g.level?.isBoss?'문지기':'꿈의 길'),20,435,11,'#bbd0d7','left',600);text(c,g.combo>1?g.combo+' 연속':'한 번의 터치',340,435,11,p.accent,'right',650);
  if(objectives.length){const shown=objectives.filter(o=>o.type!=='finish'&&o.type!=='boss'),near=typeof g.bossCue==='function'?g.bossCue():null,active=(near?.strike?shown.find(o=>o.type==='strikes'):null)||shown.find(o=>!o.met)||shown[0];if(active){const labels={hits:'충돌',jumps:'점프',combo:'연속 통과',perfect:'최고점 통과',ground:'천장 통과',passed:'장애물 통과',strikes:'공중 반격'},value=Number.isFinite(active.value)?Math.floor(active.value*10)/10:0,label=(labels[active.type]||shorten(active.text,14))+' '+value+' / '+active.target+(['hits','jumps'].includes(active.type)?' 이하':'');text(c,(active.met?'✓ ':'· ')+label,180,460,12,active.met?p.accent:'#e2edee','center',650)}c.fillStyle='#253c47';c.fillRect(20,477,320,2);c.fillStyle=p.accent;c.fillRect(20,477,320*progress,2)}else{c.fillStyle='#253c47';c.fillRect(20,460,320,2);c.fillStyle=p.accent;c.fillRect(20,460,320*progress,2)}
 }
 if(g.mode==='tutorial'&&g.state==='play'){
 const n=['approach','jump','corner','confirm'].indexOf(g.tutorialStep);for(let i=0;i<3;i++){c.fillStyle=i<=Math.max(0,n-1)?p.accent:'#354b54';rr(c,155+i*21,458,12,3,1);c.fill()}if(g.waiting&&g.tutorialStep==='jump'){c.strokeStyle=p.danger;c.lineWidth=2;const target=root.QuadRiftHD.rail(root.QuadRiftHD.TUTORIAL_HAZARD);c.beginPath();c.arc(target.x,target.y-9,24+(reduced?0:Math.sin(g.time*3)*2),0,Math.PI*2);c.stroke()}}
 resultWorld(c,g,p,opt);resultPanel(c,g,p,opt);

 c.restore()}
root.QuadRiftArt={resultActor,KICK_SETTLE_SECONDS,resultScene,resultWorld,resultPanel,ORIGIN_HIT_SECONDS,activeOriginHit,originContactCopy,drawOriginContact,setArtStyle,cellPalette,squareWorld,squareBoss,drawOrigin,draw,familyPalette,foldedSpace,drawTutorial,tutorialCopy,drawFamilies,MODE_LABELS,MODE_HINTS,speechLayouts,floorScene,waveScene,roomScene,arenaScene,liveHazard,liveBoss,renderActors,human,runningLeg,actorFacing,gapBounds,drawGap,backdrop,themes,GAMEPLAY_SCALE,actorPose,headAnchor,actorBounds,speechObstacles,bubbleLayout,characterBubble,gameplayCue,dialogueCue,DIALOGUE_SECONDS,DIALOGUE_GAP,bossHUD,title,cornerResponse,railPath,collection,collectionBounds,chapterPattern,skinComposition,hazardArt,bossArt,ceilingRibbon,beamArt};if(typeof module!=='undefined')module.exports=root.QuadRiftArt;
})(globalThis);
