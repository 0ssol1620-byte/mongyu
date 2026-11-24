/* R105 chapters 2-10 of the dream road (chapters 6-10 = ids c26-c50, only in the UI edition) (themes from the blueprint: 잊혀진 유년기, 불가능한 도시, 또 다른 나, 경계의 호텔) (data only; loaded before course-run.js, which turns MongyuChapters.chapters into its CHAPTERS list). Owned by workstream CP.
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
 c25:[[3,'bubble',0.288],[5,'feather',0.429],[5,'star',0.643]],
 c26:[[0,'bubble',0.753],[2,'star',0.452]],
 c27:[[1,'bubble',0.677],[3,'time',0.258],[3,'star',0.323]],
 c28:[[0,'time',0.648],[2,'bubble',0.253],[2,'star',0.314]],
 c29:[[1,'bubble',0.515],[3,'feather',0.264],[3,'star',0.667]],
 c30:[[1,'time',0.272],[2,'bubble',0.821],[3,'star',0.334]],
 c31:[[1,'bubble',0.803],[3,'star',0.378]],
 c32:[[0,'bubble',0.742],[2,'time',0.541],[2,'star',0.412]],
 c33:[[1,'time',0.41],[3,'bubble',0.308],[3,'star',0.693]],
 c34:[[0,'bubble',0.829],[2,'feather',0.26],[2,'star',0.426]],
 c35:[[1,'time',0.256],[3,'bubble',0.239],[3,'star',0.733]],
 c36:[[1,'bubble',0.8],[2,'star',0.492]],
 c37:[[0,'bubble',0.797],[2,'time',0.403],[1,'star',0.365]],
 c38:[[0,'time',0.822],[2,'bubble',0.272],[2,'star',0.446]],
 c39:[[1,'bubble',0.599],[3,'feather',0.242],[3,'star',0.519]],
 c40:[[1,'time',0.292],[3,'bubble',0.309],[3,'star',0.377]],
 c41:[[1,'bubble',0.778],[2,'star',0.393]],
 c42:[[1,'bubble',0.28],[2,'feather',0.222],[2,'star',0.524]],
 c43:[[0,'time',0.746],[2,'star',0.389]],
 c44:[[1,'bubble',0.45],[2,'time',0.637],[3,'star',0.814]],
 c45:[[1,'bubble',0.653],[3,'feather',0.43],[3,'star',0.644]],
 c46:[[1,'bubble',0.724],[2,'star',0.587]],
 c47:[[0,'bubble',0.809],[2,'time',0.244],[2,'star',0.644]],
 c48:[[1,'time',0.24],[2,'bubble',0.325],[2,'star',0.867]],
 c49:[[0,'bubble',0.826],[2,'feather',0.258],[2,'star',0.444]],
 c50:[[3,'bubble',0.288],[5,'time',0.339],[6,'star',0.645]]
};
const withItems=c=>{
 const it=ITEMS[c.id];if(!it)return c;
 const acts=c.acts.map((a,i)=>{const mine=it.filter(e=>e[0]===i).map(e=>e[1]==='star'?star(e[2]):gift(e[2],e[1]));return mine.length?{...a,opts:{...a.opts,items:mine}}:a});
 return {...c,acts};
};
const freeze=c=>Object.freeze({...c,acts:Object.freeze(c.acts),fallback:c.fallback?Object.freeze(c.fallback):null});

/* ---------- chapter 2: 잊혀진 유년기 (c2, bpm 88) — toys, swings, chalkboards; a slow, rubbery, small-scale feel (palette key c2, light sage) ---------- */
const a2=mk('c2');
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

/* ---------- chapter 6: 누군가 보고 있다 (c6, bpm 92) — a stage under a big eye; the lid decides when you may move (blueprint 4.6, M08). Palette key c6, plum / theatre light.
   Chapters 6-10 exist only in the R105 UI edition (MONGYU_UI_EDITION): the new acts eye / liquid / rhythm live in eye-act.js, liquid-act.js, rhythm-act.js. Every chapter's last course is a boss slot:
   `boss:{id}` is data only (the BOSS workstream implements the act for B06-B10); until then the course plays its strongest mechanic as a longer placeholder, flagged by `bossPlaceholder:true`. ---------- */
const a6=mk('c6');
const CH6=[
 {id:'c26',title:'눈치',subtitle:'눈이 감길 때 움직이기',bpm:92,seed:2626,glow:['#d6b9cf','#e0b46b'],
  acts:[a6('eye',{beats:36,level:0,tutorial:true},29),a6('floor-wall',{span:[0,1]},6),a6('eye',{beats:42,level:0},28)],
  fallback:[act('floor-wall',{trip:'c6',span:[0,2]},10),act('bridge',{trip:'c6',preset:'garden',tone:1},25),act('bridge',{trip:'c6',preset:'calm',tone:1},12)]},
 {id:'c27',title:'스포트라이트',subtitle:'불빛 안에서는 움직여도 돼요',bpm:92,seed:2727,glow:['#e0b46b','#d6b9cf'],
  acts:[a6('floor-wall',{span:[0,1]},6),a6('eye',{beats:40,level:1},29),a6('bridge',{preset:'calm',tone:1},11),a6('eye',{beats:40,level:1},28)],
  fallback:[act('floor-wall',{trip:'c6',span:[0,1]},6),act('bridge',{trip:'c6',preset:'stairs',tone:1},18),act('bridge',{trip:'c6',preset:'dawn',tone:1},17),act('floor-wall',{trip:'c6',span:[1,2]},7)]},
 {id:'c28',title:'관객',subtitle:'객석에서 지켜보는 얼굴들',bpm:92,seed:2828,glow:['#544761','#e0b46b'],
  acts:[a6('eye',{beats:34,level:1},22),a6('mirror',{beats:26,level:0},18),a6('eye',{beats:38,level:2},29)],
  fallback:[act('bridge',{trip:'c6',preset:'ascent',tone:1},25),act('floor-wall',{trip:'c6',span:[0,2]},10),act('bridge',{trip:'c6',preset:'descent',tone:1},22)]},
 {id:'c29',title:'무대 뒤',subtitle:'프레임 바깥의 진짜 길',bpm:92,seed:2929,glow:['#d6b9cf','#544761'],
  acts:[a6('bridge',{preset:'calm',tone:1},10),a6('eye',{beats:36,level:2},28),a6('floor-wall',{span:[0,2]},10),a6('eye',{beats:38,level:2},29)],
  fallback:[act('bridge',{trip:'c6',preset:'garden',tone:1},24),act('helix-up',{trip:'c6'},29),act('floor-wall',{trip:'c6',span:[0,2]},10)]},
 {id:'c30',title:'관찰자',subtitle:'세 번 바뀌는 시선',bpm:92,seed:3030,glow:['#e0b46b','#544761'],boss:{id:'B06'},bossPlaceholder:true,
  acts:[a6('eye',{beats:34,level:2},21),a6('eye',{beats:36,level:3},30),a6('floor-wall',{span:[0,1]},6),a6('eye',{beats:36,level:3},29)],
  fallback:[act('floor-wall',{trip:'c6',span:[0,2]},10),act('penrose',{trip:'c6',variant:'dusk'},29),act('helix-down',{trip:'c6'},31)]}
];

/* ---------- chapter 7: 녹아내리는 현실 (c7, bpm 125) — the floor breathes, pits open like mouths, the runner changes form (blueprint 4.7, M04/M11). Palette key c7, grey-blue satin ---------- */
const a7=mk('c7');
const CH7=[
 {id:'c31',title:'물렁한 틀',subtitle:'바닥이 입을 벌리는 박자',bpm:125,seed:3131,glow:['#b2c9c9','#e0819d'],
  acts:[a7('floor-wall',{span:[0,1]},6),a7('liquid',{beats:44,level:0,tutorial:true},20),a7('bridge',{preset:'calm',tone:2},12),a7('liquid',{beats:56,level:0},28)],
  fallback:[act('floor-wall',{trip:'c7',span:[0,2]},10),act('bridge',{trip:'c7',preset:'garden',tone:2},25),act('bridge',{trip:'c7',preset:'calm',tone:2},12)]},
 {id:'c32',title:'물방울',subtitle:'뭉쳤다 풀리는 길',bpm:125,seed:3232,glow:['#9e8fc1','#b2c9c9'],
  acts:[a7('liquid',{beats:52,level:1},24),a7('floor-wall',{span:[0,1]},6),a7('liquid',{beats:64,level:1},31)],
  fallback:[act('bridge',{trip:'c7',preset:'ascent',tone:2},25),act('floor-wall',{trip:'c7',span:[0,2]},10),act('bridge',{trip:'c7',preset:'descent',tone:2},22)]},
 {id:'c33',title:'잉크',subtitle:'번지는 길을 박자로 읽기',bpm:125,seed:3333,glow:['#e0819d','#9e8fc1'],
  acts:[a7('bridge',{preset:'calm',tone:2},12),a7('liquid',{beats:52,level:1},24),a7('floor-wall',{span:[0,1]},6),a7('liquid',{beats:52,level:2},25)],
  fallback:[act('bridge',{trip:'c7',preset:'garden',tone:2},24),act('helix-down',{trip:'c7'},31),act('floor-wall',{trip:'c7',span:[0,2]},10)]},
 {id:'c34',title:'종이 인간',subtitle:'접었다 펴는 몸',bpm:125,seed:3434,glow:['#b2c9c9','#e0819d'],
  acts:[a7('liquid',{beats:56,level:2},26),a7('flip',{beats:34,level:0},15),a7('liquid',{beats:64,level:2},32)],
  fallback:[act('floor-wall',{trip:'c7',span:[0,2]},10),act('bridge',{trip:'c7',preset:'stairs',tone:2},20),act('helix-up',{trip:'c7'},29)]},
 {id:'c35',title:'액체 왕',subtitle:'세 번 변하는 길',bpm:125,seed:3535,glow:['#9e8fc1','#e0819d'],boss:{id:'B07'},bossPlaceholder:true,
  acts:[a7('liquid',{beats:48,level:2},22),a7('liquid',{beats:56,level:3},27),a7('floor-wall',{span:[0,1]},6),a7('liquid',{beats:56,level:3},28)],
  fallback:[act('floor-wall',{trip:'c7',span:[0,2]},10),act('penrose',{trip:'c7',variant:'dawn'},29),act('helix-down',{trip:'c7'},31)]}
];

/* ---------- chapter 8: 색채의 섬망 (c8, bpm 138) — a hall that beats; obstacles on the beat, a pulsing frame, approach rings (blueprint 4.8, M09). Dark psychedelic palette key c8 ---------- */
const a8=mk('c8');
const CH8=[
 {id:'c36',title:'첫 박자',subtitle:'박동에 맞춰 뛰기',bpm:138,seed:3636,glow:['#a95bdc','#64d8cc'],
  acts:[a8('floor-wall',{span:[0,1]},6),a8('rhythm',{beats:56,level:0,tutorial:true},24),a8('rhythm',{beats:72,level:0},32)],
  fallback:[act('floor-wall',{trip:'c8',span:[0,2]},10),act('bridge',{trip:'c8',preset:'garden',tone:3},25),act('bridge',{trip:'c8',preset:'calm',tone:3},12)]},
 {id:'c37',title:'엇박',subtitle:'반 박자 어긋난 장애물',bpm:138,seed:3737,glow:['#64d8cc','#a95bdc'],
  acts:[a8('rhythm',{beats:72,level:1},30),a8('floor-wall',{span:[0,1]},6),a8('rhythm',{beats:84,level:1},37)],
  fallback:[act('bridge',{trip:'c8',preset:'ascent',tone:3},25),act('floor-wall',{trip:'c8',span:[0,2]},10),act('bridge',{trip:'c8',preset:'descent',tone:3},22)]},
 {id:'c38',title:'만화경',subtitle:'복제된 배경 속 진짜 길',bpm:138,seed:3838,glow:['#a95bdc','#7a6bff'],
  acts:[a8('rhythm',{beats:64,level:1},27),a8('mirror',{beats:36,level:1},16),a8('rhythm',{beats:68,level:2},30)],
  fallback:[act('bridge',{trip:'c8',preset:'garden',tone:3},24),act('helix-up',{trip:'c8'},29),act('floor-wall',{trip:'c8',span:[0,2]},10)]},
 {id:'c39',title:'저음',subtitle:'넓게 퍼지는 맥박',bpm:138,seed:3939,glow:['#7a6bff','#64d8cc'],
  acts:[a8('floor-wall',{span:[0,1]},6),a8('rhythm',{beats:76,level:2},32),a8('flip',{beats:26,level:1},11),a8('rhythm',{beats:68,level:2},30)],
  fallback:[act('floor-wall',{trip:'c8',span:[0,2]},10),act('bridge',{trip:'c8',preset:'stairs',tone:3},20),act('helix-down',{trip:'c8'},31)]},
 {id:'c40',title:'지휘자',subtitle:'세 구절의 프레임',bpm:138,seed:4040,glow:['#64d8cc','#a95bdc'],boss:{id:'B08'},bossPlaceholder:true,
  acts:[a8('rhythm',{beats:52,level:1},22),a8('rhythm',{beats:68,level:2},29),a8('floor-wall',{span:[0,1]},6),a8('rhythm',{beats:72,level:3},32)],
  fallback:[act('floor-wall',{trip:'c8',span:[0,2]},10),act('penrose',{trip:'c8',variant:'dusk'},29),act('helix-down',{trip:'c8'},31)]}
];

/* ---------- chapter 9: 절대적인 무 (c9, bpm 71) — a void, one line to follow, waiting is the answer (blueprint 4.9, M13). Palette key c9; the wait act runs with bare:true (no hotel, only the line and a few stars) ---------- */
const a9=mk('c9');
const CH9=[
 {id:'c41',title:'한 줄',subtitle:'밝은 선만 따라가기',bpm:71,seed:4141,glow:['#f2ddc9','#55566e'],
  acts:[a9('wait',{waits:1,level:0,tutorial:true,bare:true},21),a9('floor-wall',{span:[0,1]},6),a9('wait',{waits:2,level:0,bare:true},44)],
  fallback:[act('floor-wall',{trip:'c9',span:[0,2]},10),act('bridge',{trip:'c9',preset:'calm',tone:3},12),act('bridge',{trip:'c9',preset:'garden',tone:3},24)]},
 {id:'c42',title:'작은 점',subtitle:'점이 나타나는 자리로',bpm:71,seed:4242,glow:['#55566e','#f2ddc9'],
  acts:[a9('floor-wall',{span:[0,1]},6),a9('wait',{waits:2,level:0,bare:true},35),a9('floor-wall',{span:[0,2]},12)],
  fallback:[act('floor-wall',{trip:'c9',span:[0,1]},6),act('bridge',{trip:'c9',preset:'calm',tone:3},12),act('bridge',{trip:'c9',preset:'dawn',tone:3},17)]},
 {id:'c43',title:'아무것도',subtitle:'아무것도 안 하는 연습',bpm:71,seed:4343,glow:['#f2ddc9','#8c8ca6'],
  acts:[a9('wait',{waits:2,level:1,bare:true},38),a9('align',{variant:'dusk'},5),a9('wait',{waits:2,level:1,bare:true},35)],
  fallback:[act('bridge',{trip:'c9',preset:'calm',tone:3},12),act('align',{trip:'c9',variant:'dusk'},4),act('floor-wall',{trip:'c9',span:[0,2]},10)]},
 {id:'c44',title:'발자국',subtitle:'먼저 지나간 흔적을 따라',bpm:71,seed:4444,glow:['#8c8ca6','#f2ddc9'],
  acts:[a9('floor-wall',{span:[0,1]},6),a9('wait',{waits:2,level:1,bare:true},35),a9('mirror',{beats:22,level:0},18),a9('wait',{waits:1,level:1,bare:true},27)],
  fallback:[act('floor-wall',{trip:'c9',span:[0,2]},10),act('helix-up',{trip:'c9'},29),act('bridge',{trip:'c9',preset:'calm',tone:3},12)]},
 {id:'c45',title:'공허',subtitle:'움직임과 기다림이 번갈아',bpm:71,seed:4545,glow:['#f2ddc9','#55566e'],boss:{id:'B09'},bossPlaceholder:true,
  acts:[a9('floor-wall',{span:[0,1]},6),a9('wait',{waits:2,level:2,bare:true},40),a9('mirror',{beats:18,level:1},16),a9('wait',{waits:1,level:2,bare:true},26)],
  fallback:[act('floor-wall',{trip:'c9',span:[0,2]},10),act('penrose',{trip:'c9',variant:'dusk'},29),act('helix-down',{trip:'c9'},31)]}
];

/* ---------- chapter 10: 각성 (c10, bpm 96) — every verified mechanic recombined, white and warm primaries (blueprint 4.10). Palette key c10. c50 is the finale ---------- */
const a10=mk('c10');
const CH10=[
 {id:'c46',title:'돌아온 정원',subtitle:'익숙한 길의 다른 접점',bpm:96,seed:4646,glow:['#f4ebdd','#d96764'],
  acts:[a10('floor-wall',{span:[0,1]},6),a10('bridge',{preset:'garden',tone:0},24),a10('helix-up',{},29),a10('align',{variant:'dawn'},6)],
  fallback:[act('floor-wall',{trip:'c10',span:[0,2]},10),act('bridge',{trip:'c10',preset:'garden',tone:0},24),act('bridge',{trip:'c10',preset:'calm',tone:0},12)]},
 {id:'c47',title:'도시의 반대편',subtitle:'중력과 착시가 만나는 곳',bpm:96,seed:4747,glow:['#b9c7d8','#d96764'],
  acts:[a10('flip',{beats:34,level:1},21),a10('penrose',{variant:'dawn'},29),a10('square',{sides:7,startLap:1},19),a10('align',{variant:'dawn'},6)],
  fallback:[act('floor-wall',{trip:'c10',span:[0,2]},10),act('penrose',{trip:'c10',variant:'dawn'},29),act('align',{trip:'c10',variant:'dawn'},4)]},
 {id:'c48',title:'나와 나',subtitle:'둘이 함께 양보하기',bpm:96,seed:4848,glow:['#d96764','#b9c7d8'],
  acts:[a10('mirror',{beats:36,level:2},21),a10('liquid',{beats:48,level:1},28),a10('wait',{waits:2,level:1},25)],
  fallback:[act('floor-wall',{trip:'c10',span:[0,2]},10),act('bridge',{trip:'c10',preset:'descent',tone:0},22),act('helix-down',{trip:'c10'},31)]},
 {id:'c49',title:'마지막 노래',subtitle:'모든 박자가 모이는 홀',bpm:96,seed:4949,glow:['#d96764','#f4ebdd'],
  acts:[a10('rhythm',{beats:44,level:1},28),a10('eye',{beats:30,level:1},21),a10('rhythm',{beats:48,level:2},29)],
  fallback:[act('floor-wall',{trip:'c10',span:[0,2]},10),act('bridge',{trip:'c10',preset:'ascent',tone:0},25),act('helix-up',{trip:'c10'},29)]},
 {id:'c50',title:'열린 틀',subtitle:'길을 열고 함께 나가기',bpm:96,seed:5050,glow:['#f4ebdd','#d96764'],boss:{id:'B10'},bossPlaceholder:true,
  acts:[a10('square',{sides:3,startLap:2},7),a10('flip',{beats:12,level:2},10),a10('mirror',{beats:12,level:2},10),a10('eye',{beats:12,level:2,short:true},18),a10('liquid',{beats:26,level:2},15),a10('rhythm',{beats:28,level:2},17),a10('wait',{waits:1,level:2},21)],
  fallback:[act('floor-wall',{trip:'c10',span:[0,2]},10),act('penrose',{trip:'c10',variant:'dawn'},29),act('helix-down',{trip:'c10'},31),act('align',{trip:'c10',variant:'dawn'},4)]}
];

const build=(n,id,title,subtitle,trip,bpm,intro,ending,list)=>Object.freeze({id,number:n,title,subtitle,trip,bpm,intro:Object.freeze(intro),ending,
 courses:Object.freeze(list.map(c=>freeze(withItems({trip,chapter:n,...c}))))});
const chapters=Object.freeze([
 build(2,'ch2','잊혀진 유년기','작은 것들이 커 보이는 놀이터','c2',[88,88],['나도 한때는 작았다.','지금도 작다.'],'장난감 왕도 건전지가 나갔네.',CH2),
 build(3,'ch3','불가능한 도시','이어지지 않는 길이 이어진다','c3',[120,120],['허가 받고 지었나.','계단이 서로 모른 척하네.'],'출구는 처음 길 바로 옆이었네.',CH3),
 build(4,'ch4','또 다른 나','거울 속 한 박자 뒤','c4',[100,100],['쟤가 나보다 잘생겼네.','한 박자 늦게 따라오는걸.'],'서로 절했어. 나쁘지 않은걸.',CH4),
 build(5,'ch5','경계의 호텔','같은 복도를 몇 번째 걷는 중','c5',[76,76],['예약 안 했는데.','누르지 않으면 열리려나.'],'출구는 처음부터 나였네.',CH5),
 ...(root.MONGYU_UI_EDITION===true?[
  build(6,'ch6','누군가 보고 있다','눈이 감길 때만 움직이는 무대','c6',[92,92],['누가 보고 있나 봐.','눈치 좀 봐야겠는걸.'],'눈이 쉬러 갔네. 나도 쉬자.',CH6),
  build(7,'ch7','녹아내리는 현실','단단한 건 처음부터 없었다','c7',[125,125],['나 지금 고체 맞아?','붙잡는 게 아니었나.'],'액체 왕이 컵에 들어갔네.',CH7),
  build(8,'ch8','색채의 섬망','박동이 길이 되는 홀','c8',[138,138],['박자가 몸에 들어오네.','너 박자 좀 다른데. 좋아.'],'음악 끝에 서로 인사했어.',CH8),
  build(9,'ch9','절대적인 무','선 하나만 남은 길','c9',[71,71],['조용하네.','아무것도 없는데 꽤 넓네.'],'선 하나가 별이 됐네.',CH9),
  build(10,'ch10','각성','모든 길이 하나의 틀로','c10',[96,96],['여기 알아. 아마도.','달리는 게 전부인 줄 알았는데.'],'문이 열렸네. 밥 먹을래?',CH10)
 ]:[])
]);
const api=Object.freeze({enabled,chapters});
root.MongyuChapters=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
