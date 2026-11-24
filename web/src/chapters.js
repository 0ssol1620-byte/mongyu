/* R105 chapters 2-5 of the dream road (themes from the blueprint: 잊혀진 유년기, 불가능한 도시, 또 다른 나, 경계의 호텔) (data only; loaded before course-run.js, which turns MongyuChapters.chapters into its CHAPTERS list). Owned by workstream CP.
   Each chapter: id, number, title, subtitle, trip (MongyuTrip key c2-c5; a missing palette falls back to violet), bpm range, intro (1-2 monologue lines), ending (1 line), courses[5].
   Course ids continue the chapter 1 numbering: c6-c10, c11-c15, c16-c20, c21-c25. Course fields as in CHAPTER1 plus trip, chapter and an optional fallback list that only uses acts that always exist.
   Item rules (docs/R105_WAVE2_SPEC_KO.md): at most 2 gifts (bubble/time/feather) per course and at most one per 25-30 s, one memory star, placed right before the hardest stretch or in a calm one.
   Voice (docs/R105_VOICE_TONE_KO.md): intro/ending are first-person monologue in banmal, titles and subtitles are nouns. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const act=(type,opts={},weight)=>({type,opts,weight});
const gift=(at,kind)=>({at,kind,lane:'lo'}),star=at=>({at,kind:'memory-star',lane:'hi'});
/* every act of a chapter carries the chapter's trip palette (acts read options.trip) */
const mk=(trip,bpm)=>(type,opts,weight)=>act(type,{trip,...opts},weight);
/* Item placement: course id -> [act index, kind ('star' = memory star), at = fraction of that act's path]. Found by running the autopilot over probe items (ground stretches for gifts,
   the top of a jump over a hazard for the star); gifts sit near 1/3 and 2/3 of the course, 26+ s apart, and never in an act that cannot use them (no feather in a flip corridor). */
const ITEMS={
 c6:[[1,'bubble',0.363],[1,'star',0.542]],
 c7:[[1,'bubble',0.815],[2,'time',0.798],[2,'star',0.595]],
 c8:[[0,'time',0.695],[2,'bubble',0.818],[3,'star',0.759]],
 c9:[[1,'bubble',0.416],[3,'feather',0.632],[3,'star',0.434]],
 c10:[[1,'time',0.39],[3,'bubble',0.284],[3,'star',0.776]],
 c11:[[1,'bubble',0.468],[2,'star',0.627]],
 c12:[[0,'bubble',0.764],[1,'time',0.811],[3,'star',0.743]],
 c13:[[0,'bubble',0.23],[2,'time',0.326],[2,'star',0.386]],
 c14:[[0,'bubble',0.502],[1,'feather',0.688],[2,'star',0.5]],
 c15:[[0,'time',0.811],[3,'bubble',0.255],[3,'star',0.876]],
 c16:[[1,'bubble',0.341],[2,'star',0.5]],
 c17:[[1,'bubble',0.554],[3,'time',0.24],[3,'star',0.542]],
 c18:[[1,'time',0.232],[2,'bubble',0.229],[2,'star',0.5]],
 c19:[[1,'bubble',0.501],[2,'feather',0.664],[2,'star',0.857]],
 c20:[[0,'time',0.823],[1,'bubble',0.779],[2,'star',0.647]],
 c21:[[1,'bubble',0.531],[2,'star',0.533]],
 c22:[[0,'bubble',0.693],[2,'feather',0.263],[2,'star',0.762]],
 c23:[[0,'time',0.762],[1,'bubble',0.572],[2,'star',0.397]],
 c24:[[1,'bubble',0.34],[2,'time',0.241],[2,'star',0.61]],
 c25:[[3,'bubble',0.288],[5,'feather',0.429],[5,'star',0.643]]
};
const withItems=c=>{
 const it=ITEMS[c.id];if(!it)return c;
 const acts=c.acts.map((a,i)=>{const mine=it.filter(e=>e[0]===i).map(e=>e[1]==='star'?star(e[2]):gift(e[2],e[1]));return mine.length?{...a,opts:{...a.opts,items:mine}}:a});
 return {...c,acts};
};
const freeze=c=>Object.freeze({...c,acts:Object.freeze(c.acts),fallback:c.fallback?Object.freeze(c.fallback):null});

/* ---------- chapter 2: 잊혀진 유년기 (c2, bpm 88) — toys, swings, chalkboards; a slow, rubbery, small-scale feel (palette key c2, light sage) ---------- */
const a2=(type,opts,weight)=>mk('c2')(type,type==='bridge'||type==='floor-wall'?{rubber:true,...opts}:opts,weight);   // R105 POL: rubber floor / toy-size scale cue in chapter 2 (bridge and floor-wall acts)
const CH2=[
 {id:'c6',title:'빈 놀이터',subtitle:'그네가 돌아오는 간격',bpm:88,seed:606,glow:['#c6ddb4','#c67746'],
  acts:[a2('bridge',{preset:'intro',tone:0},12),a2('bridge',{preset:'garden',tone:1},25),a2('align',{variant:'dawn'},4),a2('bridge',{preset:'calm',tone:1},13)],fallback:null},
 {id:'c7',title:'고무 길',subtitle:'바닥이 하품하는 길',bpm:88,seed:707,glow:['#b5c8db','#c67746'],
  acts:[a2('floor-wall',{span:[0,1]},6),a2('bridge',{preset:'stairs',tone:1},19),a2('helix-up',{},29),a2('bridge',{preset:'calm',tone:1},13)],fallback:null},
 {id:'c8',title:'아주 작은 집',subtitle:'전용면적이 너무 작네',bpm:88,seed:808,glow:['#c6ddb4','#b5c8db'],
  acts:[a2('bridge',{preset:'garden',tone:1},25),a2('align',{variant:'dawn'},4),a2('penrose',{variant:'dawn'},29),a2('bridge',{preset:'dawn',tone:2},21)],fallback:null},
 {id:'c9',title:'칠판',subtitle:'지워지는 발판 앞으로',bpm:88,seed:909,glow:['#b5c8db','#c6ddb4'],
  acts:[a2('floor-wall',{span:[0,2]},10),a2('helix-up',{},29),a2('align',{variant:'dawn'},4),a2('bridge',{preset:'descent',tone:2},28)],fallback:null},
 {id:'c10',title:'장난감 왕',subtitle:'건전지는 어디 넣나',bpm:88,seed:1010,glow:['#c67746','#c6ddb4'],
  acts:[a2('bridge',{preset:'ascent',tone:1},25),a2('penrose',{variant:'dawn'},29),a2('align',{variant:'dawn'},4),a2('helix-down',{},31)],fallback:null}
];

/* ---------- chapter 3: 불가능한 도시 (c3, bpm 120) — impossible stairs, gravity flips, a crosswalk upside down; the rotating square room (palette key c3, sand / teal / pink) ---------- */
const a3=mk('c3');
const CH3=[
 {id:'c11',title:'가로등',subtitle:'벽 방향으로 달리기',bpm:120,seed:1111,glow:['#f1ddb7','#cf4763'],
  acts:[a3('floor-wall',{span:[0,2]},10),a3('square',{sides:8,startLap:0,calm:1.3,tutorial:true},23),a3('square',{sides:7,startLap:0,calm:1.15},21)],
  fallback:[act('floor-wall',{trip:'c3',span:[0,2]},10),act('bridge',{trip:'c3',preset:'garden',tone:2},25)]},
 {id:'c12',title:'계단 면허',subtitle:'허가는 받았나 몰라',bpm:120,seed:1212,glow:['#75a6a1','#cf4763'],
  acts:[a3('bridge',{preset:'stairs',tone:2},18),a3('penrose',{variant:'dusk'},29),a3('align',{variant:'dusk'},4),a3('bridge',{preset:'dawn',tone:2},20)],fallback:null},
 {id:'c13',title:'뒤집힌 횡단보도',subtitle:'탭 한 번에 위아래가 바뀌어요',bpm:120,seed:1313,glow:['#cf4763','#75a6a1'],
  acts:[a3('flip',{beats:30,level:0,tutorial:true},14),a3('floor-wall',{span:[0,2]},10),a3('flip',{beats:40,level:0},21)],
  fallback:[act('floor-wall',{trip:'c3',span:[0,2]},10),act('bridge',{trip:'c3',preset:'descent',tone:2},22),act('floor-wall',{trip:'c3',span:[1,2]},7)]},
 {id:'c14',title:'우회로',subtitle:'틀린 길이 맞는 길',bpm:120,seed:1414,glow:['#f1ddb7','#75a6a1'],
  acts:[a3('square',{sides:10,startLap:1},26),a3('bridge',{preset:'garden',tone:2},24),a3('flip',{beats:36,level:1},19)],
  fallback:[act('bridge',{trip:'c3',preset:'ascent',tone:2},25),act('bridge',{trip:'c3',preset:'garden',tone:2},24),act('floor-wall',{trip:'c3',span:[1,2]},7)]},
 {id:'c15',title:'도시',subtitle:'길을 다시 접는 도시',bpm:120,seed:1515,glow:['#cf4763','#f1ddb7'],
  acts:[a3('penrose',{variant:'dusk'},30),a3('flip',{beats:34,level:2},17),a3('align',{variant:'dusk'},4),a3('square',{sides:10,startLap:2},26)],
  fallback:[act('penrose',{trip:'c3',variant:'dusk'},29),act('align',{trip:'c3',variant:'dusk'},4),act('bridge',{trip:'c3',preset:'descent',tone:2},22)]}
];

/* ---------- chapter 4: 또 다른 나 (c4, bpm 100) — a mirror twin who repeats every tap one beat late (palette key c4, ink / ivory) ---------- */
const a4=mk('c4');
const CH4=[
 {id:'c16',title:'반사',subtitle:'쟤가 나보다 잘생겼네',bpm:100,seed:1616,glow:['#eee7d8','#8f90c5'],
  acts:[a4('mirror',{beats:34,level:0,tutorial:true},20),a4('floor-wall',{span:[0,2]},10),a4('mirror',{beats:40,level:0},24)],
  fallback:[act('floor-wall',{trip:'c4',span:[0,2]},10),act('bridge',{trip:'c4',preset:'descent',tone:1},22),act('floor-wall',{trip:'c4',span:[1,2]},7)]},
 {id:'c17',title:'거울의 거짓말',subtitle:'거울에만 보이는 위험',bpm:100,seed:1717,glow:['#8f90c5','#37333d'],
  acts:[a4('floor-wall',{span:[0,1]},6),a4('mirror',{beats:40,level:1},23),a4('bridge',{preset:'calm',tone:1},12),a4('mirror',{beats:36,level:1},22)],
  fallback:[act('floor-wall',{trip:'c4',span:[0,1]},6),act('bridge',{trip:'c4',preset:'stairs',tone:1},18),act('bridge',{trip:'c4',preset:'calm',tone:1},12),act('bridge',{trip:'c4',preset:'dawn',tone:1},17)]},
 {id:'c18',title:'지난 나',subtitle:'과거의 내가 일하네',bpm:100,seed:1818,glow:['#eee7d8','#8f90c5'],
  acts:[a4('mirror',{beats:36,level:1},21),a4('helix-down',{},29),a4('mirror',{beats:40,level:1},25)],
  fallback:[act('bridge',{trip:'c4',preset:'descent',tone:1},22),act('helix-down',{trip:'c4'},29),act('floor-wall',{trip:'c4',span:[0,2]},10)]},
 {id:'c19',title:'미러 발레',subtitle:'둘이 같은 포즈라 민망',bpm:100,seed:1919,glow:['#8f90c5','#eee7d8'],
  acts:[a4('floor-wall',{span:[0,2]},10),a4('mirror',{beats:42,level:2},25),a4('bridge',{preset:'descent',tone:1},26),a4('align',{variant:'dawn'},6)],
  fallback:[act('floor-wall',{trip:'c4',span:[0,2]},10),act('bridge',{trip:'c4',preset:'ascent',tone:1},25),act('bridge',{trip:'c4',preset:'descent',tone:1},26)]},
 {id:'c20',title:'반사체',subtitle:'과거 입력을 기억하는 상대',bpm:100,seed:2020,glow:['#37333d','#8f90c5'],
  acts:[a4('mirror',{beats:40,level:2},23),a4('helix-up',{},29),a4('mirror',{beats:46,level:3},28)],
  fallback:[act('floor-wall',{trip:'c4',span:[0,2]},10),act('helix-up',{trip:'c4'},29),act('bridge',{trip:'c4',preset:'descent',tone:1},22)]}
];

/* ---------- chapter 5: 경계의 호텔 (c5, bpm 76) — endless corridors and elevators where NOT pressing is the answer (palette key c5, tile / carpet) ---------- */
const a5=mk('c5');
const CH5=[
 {id:'c21',title:'체크인',subtitle:'예약 안 했는데',bpm:76,seed:2121,glow:['#d8c5bd','#c9a258'],
  acts:[a5('floor-wall',{span:[0,2]},10),a5('bridge',{preset:'garden',tone:0},26),a5('wait',{waits:1,level:0,tutorial:true},25)],
  fallback:[act('floor-wall',{trip:'c5',span:[0,2]},10),act('bridge',{trip:'c5',preset:'garden',tone:0},24),act('bridge',{trip:'c5',preset:'calm',tone:0},12)]},
 {id:'c22',title:'엘리베이터',subtitle:'누르지 않고 기다리기',bpm:76,seed:2222,glow:['#839687','#c9a258'],
  acts:[a5('wait',{waits:2,level:0},32),a5('bridge',{preset:'calm',tone:0},13),a5('wait',{waits:2,level:1},36)],
  fallback:[act('bridge',{trip:'c5',preset:'garden',tone:0},24),act('floor-wall',{trip:'c5',span:[0,1]},6),act('bridge',{trip:'c5',preset:'calm',tone:0},12)]},
 {id:'c23',title:'복도 끝',subtitle:'뛰었는데 제자리네',bpm:76,seed:2323,glow:['#d8c5bd','#839687'],
  acts:[a5('penrose',{variant:'dusk'},30),a5('wait',{waits:2,level:1},36),a5('floor-wall',{span:[0,1]},9)],
  fallback:[act('penrose',{trip:'c5',variant:'dusk'},29),act('bridge',{trip:'c5',preset:'dawn',tone:0},17),act('floor-wall',{trip:'c5',span:[0,1]},6)]},
 {id:'c24',title:'방해 금지',subtitle:'아무것도 안 하기',bpm:76,seed:2424,glow:['#839687','#d8c5bd'],
  acts:[a5('floor-wall',{span:[0,2]},10),a5('wait',{waits:3,level:1},46),a5('helix-up',{},31)],
  fallback:[act('floor-wall',{trip:'c5',span:[0,2]},10),act('helix-up',{trip:'c5'},29),act('bridge',{trip:'c5',preset:'calm',tone:0},12)]},
 {id:'c25',title:'없는 출구',subtitle:'모든 길이 한 복도로 모여요',bpm:76,seed:2525,glow:['#c9a258','#d8c5bd'],
  acts:[a5('floor-wall',{span:[0,1]},6),a5('align',{variant:'dusk'},5),a5('square',{sides:6,startLap:2},15),a5('flip',{beats:22,level:2},16),a5('mirror',{beats:22,level:2},18),a5('wait',{waits:1,level:2},26)],
  fallback:[act('floor-wall',{trip:'c5',span:[0,2]},10),act('bridge',{trip:'c5',preset:'ascent',tone:0},25),act('helix-down',{trip:'c5'},29)]}
];

const build=(n,id,title,subtitle,trip,bpm,intro,ending,list)=>Object.freeze({id,number:n,title,subtitle,trip,bpm,intro:Object.freeze(intro),ending,
 courses:Object.freeze(list.map(c=>freeze(withItems({trip,chapter:n,...c}))))});
const chapters=Object.freeze([
 build(2,'ch2','잊혀진 유년기','작은 것들이 커 보이는 놀이터','c2',[88,88],['나도 한때는 작았다.','지금도 작다.'],'장난감 왕도 건전지가 나갔네.',CH2),
 build(3,'ch3','불가능한 도시','이어지지 않는 길이 이어진다','c3',[120,120],['허가 받고 지었나.','계단이 서로 모른 척하네.'],'출구는 처음 길 바로 옆이었네.',CH3),
 build(4,'ch4','또 다른 나','거울 속 한 박자 뒤','c4',[100,100],['쟤가 나보다 잘생겼네.','한 박자 늦게 따라오는걸.'],'서로 절했어. 나쁘지 않은걸.',CH4),
 build(5,'ch5','경계의 호텔','같은 복도를 몇 번째 걷는 중','c5',[76,76],['예약 안 했는데.','누르지 않으면 열리려나.'],'출구는 처음부터 나였네.',CH5)
]);
const api=Object.freeze({enabled,chapters});
root.MongyuChapters=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
