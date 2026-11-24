/* R105 BGM 2.0 (workstream MU). One chapter = one generative-but-deterministic piece, all synthesized with Web Audio on the shared AudioContext
   (no audio files) and routed into host.audio().music.
   Four stems (1 base: pad/drone/heartbeat, 2 rhythm: janggu/buk percussion, bass pulse, arpeggiator, 3 melody: gayageum/haegeum/daegeum,
   4 climax: choir/strings/glass) are scheduled bar by bar on a short lookahead on the AudioContext clock.
   Two families of pieces share the same voices:
   - ARRANGEMENTS: the R104 pieces for the first-memory course and the native chapters (opening, 1..10), unchanged structure, better instruments.
   - TRIPS (r1..r5): the five dream-road chapters (violet / aqua / ember / toxic / heart) with a macro structure (intro, A, B, climax, resolve) driven by the
     course progress, a heartbeat low-pulse motif that pumps the pad, an arpeggiator, dropouts and reverse-reverb swells before section changes, and a
     Shepard-Risset endless glissando while the act is an ascent / Penrose (rising) or a descent (falling).
   Everything that is arithmetic (chords, phrases, macro plan, Shepard window, context mapping) is a pure function shared by the live scheduler, the
   offline renderer and the tests. MongyuAdaptiveMusic.setContext({chapter,course,act,bpm,trip}) lets CourseRun-driven runs steer it without any change to
   course-run.js; without it the module polls MongyuPolish.host.activeRun() (run.id, run.actIndex, run.acts, run.child, run.perfectStreak) itself. */
(function(root){'use strict';
const enabled=root.MONGYU_POLISH_EDITION===true;
const LOOKAHEAD=.28,OPEN=16000,CLOSED=300,MAX_VOICES=48;
const NOTE_NAMES=['C','C#','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
/* Pentatonic melody scales (semitones from the tonic). pyeong ≈ 평조 (sol-mode), minor ≈ 계면조, yo = suspended minor. */
const SCALES=Object.freeze({major:[0,2,4,7,9],pyeong:[0,2,5,7,9],minor:[0,3,5,7,10],yo:[0,2,5,7,10]});
const MINOR=Object.freeze({major:false,pyeong:false,minor:true,yo:true});
/* Chords: bass offset + colour tones (pitch classes relative to the tonic). The last four are the near-dissonant colours of the toxic chapter. */
const CHORDS=Object.freeze({
 I9:{b:0,p:[4,7,11,2]},ii9:{b:2,p:[5,9,0,4]},iii7:{b:4,p:[7,11,2]},IVmaj7:{b:5,p:[9,0,4,7]},V9sus:{b:7,p:[0,2,5,9]},vi9:{b:9,p:[0,4,7,11]},
 i9:{b:0,p:[3,7,10,2]},iv9:{b:5,p:[8,0,3,7]},v7:{b:7,p:[10,2,5]},III7:{b:3,p:[7,10,2]},VI7:{b:8,p:[0,3,7]},VIIsus:{b:10,p:[3,5,0]},
 'i-b2':{b:0,p:[1,3,7,10]},bII:{b:1,p:[5,8,0]},tri:{b:6,p:[9,0,3]},clus:{b:0,p:[1,2,3,6]}
});
/* Arrangement per native chapter. loops[section] is a 4-bar chord loop; shift[section] transposes the key (semitones).
   Sections: 1st memory floor/wall/ceiling; native memories rotate with map changes. */
const ARRANGEMENTS=Object.freeze({
 opening:{title:'접힌 빛',pc:2,mode:'major',bpm:100,seed:104,lead:'daegeum',pizz:[0,6,8,12],loops:[['I9','vi9','IVmaj7','V9sus'],['vi9','IVmaj7','I9','V9sus'],['IVmaj7','I9','vi9','V9sus']],shift:[0,0,2]},
 1:{title:'낯선 곳',pc:2,mode:'pyeong',bpm:96,seed:11,lead:'daegeum',pizz:[0,4,8,12],loops:[['I9','IVmaj7','vi9','V9sus'],['vi9','IVmaj7','I9','V9sus'],['IVmaj7','V9sus','I9','vi9']],shift:[0,0,2]},
 2:{title:'아픈 네모',pc:9,mode:'minor',bpm:100,seed:23,lead:'haegeum',pizz:[0,3,6,10,12],loops:[['i9','VI7','III7','VIIsus'],['VI7','VIIsus','i9','i9'],['iv9','VI7','i9','VIIsus']],shift:[0,0,2]},
 3:{title:'솔과 함께',pc:7,mode:'major',bpm:104,seed:37,lead:'daegeum',pizz:[0,6,8,14],loops:[['I9','iii7','IVmaj7','V9sus'],['vi9','iii7','IVmaj7','V9sus'],['IVmaj7','V9sus','vi9','I9']],shift:[0,0,2]},
 4:{title:'흐르는 시간',pc:4,mode:'minor',bpm:98,seed:41,lead:'haegeum',pizz:[0,4,8,10],loops:[['i9','iv9','VI7','VIIsus'],['VI7','III7','iv9','v7'],['i9','VI7','iv9','VIIsus']],shift:[0,0,2]},
 5:{title:'담의 다정함',pc:5,mode:'major',bpm:92,seed:53,lead:'daegeum',pizz:[0,6,8,12],loops:[['I9','ii9','IVmaj7','V9sus'],['IVmaj7','I9','ii9','V9sus'],['vi9','ii9','V9sus','I9']],shift:[0,0,2]},
 6:{title:'닿지 않는 연락',pc:1,mode:'yo',bpm:100,seed:67,lead:'haegeum',pizz:[0,3,6,10,12],loops:[['i9','VI7','iv9','VIIsus'],['VI7','VIIsus','III7','i9'],['iv9','i9','VI7','VIIsus']],shift:[0,0,2]},
 7:{title:'여울',pc:9,mode:'major',bpm:108,seed:71,lead:'daegeum',pizz:[0,3,6,8,12,14],loops:[['I9','vi9','ii9','V9sus'],['IVmaj7','V9sus','iii7','vi9'],['I9','IVmaj7','ii9','V9sus']],shift:[0,0,2]},
 8:{title:'이별을 말하다',pc:6,mode:'minor',bpm:96,seed:83,lead:'haegeum',pizz:[0,4,8,12],loops:[['i9','III7','VI7','v7'],['VI7','VIIsus','i9','III7'],['iv9','VI7','v7','i9']],shift:[0,0,2]},
 9:{title:'혼자 달리는 밤',pc:2,mode:'yo',bpm:90,seed:97,lead:'daegeum',pizz:[0,6,8,12],loops:[['i9','VIIsus','VI7','iv9'],['VI7','iv9','i9','VIIsus'],['III7','VI7','VIIsus','i9']],shift:[0,0,2]},
 10:{title:'작별',pc:3,mode:'pyeong',bpm:94,seed:101,lead:'daegeum',pizz:[0,4,8,12],loops:[['IVmaj7','I9','vi9','V9sus'],['vi9','IVmaj7','V9sus','I9'],['ii9','V9sus','IVmaj7','I9']],shift:[0,0,2]}
});
/* ---------- the five dream-road pieces ("trips") ----------
   loops = [A, B, climax, resolve] chord loops (4 bars each). groove rows are [sixteenth step, instrument, velocity, sections, every n bars, remainder];
   sections use the letters A B C(limax) R(esolve). heart: per-beat lub / dub velocities (the low pulse), gap = beats between lub and dub, pump = depth of the
   sidechain-style dip the pad takes on every lub. arp: per-section arpeggiator {rate steps per beat, pattern, velocity, rest probability}. */
const rows=(steps,inst,vel,secs,every=1,rem=0)=>steps.map(s=>[s,inst,vel,secs,every,rem]);
const TRIPS=Object.freeze({
 r1:{road:true,chapter:1,trip:'violet',title:'새벽 계단 · 자외선 맥박',pc:2,mode:'yo',bpm:96,seed:1051,lead:'daegeum',pizz:[0,6,10],
  loops:[['i9','i9','VIIsus','i9'],['VI7','VIIsus','iv9','i9'],['iv9','VI7','VIIsus','i9'],['VI7','iv9','VIIsus','i9']],shift:[0,0,2,0],
  verb:{sec:4.4,damp:1.4,send:.5},pad:{cut:900,lfo:.06,detune:7,voices:3},shepCycle:8,gain:1,
  heart:{lub:[1,.45,.8,.45],dub:[.5,0,.4,0],gap:.5,pump:.3},
  groove:[[8,'buk',.5,'AB',1,0],[10,'deok',.22,'AB',2,1],[14,'wood',.3,'ABC',2,0],[6,'wood',.22,'BC',2,1],...rows([0,4,8,12],'shaker',.22,'ABC'),[4,'deok',.4,'C',1,0],[12,'deok',.4,'C',1,0]],fill:[],
  bp:{A:[0,8],B:[0,8],C:[0,6,8,12],R:[0]},
  arp:{B:{rate:2,pat:'up',vel:.5,rest:.25},C:{rate:4,pat:'updown',vel:.45,rest:.15},R:{rate:2,pat:'down',vel:.35,rest:.4}},drops:{}},
 r2:{road:true,chapter:2,trip:'aqua',title:'달빛 수로 · 심해',pc:4,mode:'pyeong',bpm:98,seed:2053,lead:'daegeum',pizz:[0,8],
  loops:[['I9','vi9','IVmaj7','I9'],['IVmaj7','V9sus','vi9','I9'],['vi9','IVmaj7','V9sus','I9'],['IVmaj7','vi9','V9sus','I9']],shift:[0,0,5,0],
  verb:{sec:6.4,damp:1,send:.68},pad:{cut:800,lfo:.045,detune:9,voices:4},shepCycle:10,gain:1,
  heart:{lub:[.8,0,.5,0],dub:[.35,0,0,0],gap:.5,pump:.22},
  groove:[[0,'buk',.35,'ABC',2,0],[8,'gung',.3,'BC',2,1],[10,'tock',.2,'C',2,0]],fill:[],
  bp:{A:[0],B:[0,8],C:[0,8,12],R:[0]},
  arp:{B:{rate:2,pat:'skip',vel:.4,rest:.35},C:{rate:2,pat:'updown',vel:.4,rest:.2},R:{rate:1,pat:'down',vel:.3,rest:.3}},drops:{A:2,B:3,C:3,R:1}},
 r3:{road:true,chapter:3,trip:'ember',title:'사각의 정원 · 잉걸',pc:7,mode:'minor',bpm:106,seed:3059,lead:'haegeum',pizz:[0,3,6,10,12],
  loops:[['i9','VI7','III7','VIIsus'],['VI7','VIIsus','i9','iv9'],['iv9','VI7','VIIsus','i9'],['VI7','iv9','VIIsus','i9']],shift:[0,0,2,0],
  verb:{sec:2.4,damp:2.2,send:.3},pad:{cut:1400,lfo:.1,detune:6,voices:3},shepCycle:8,gain:1,bpGain:.55,
  heart:{lub:[1,.7,.9,.7],dub:[0,.45,0,.45],gap:.5,pump:.38},
  groove:[[0,'gung',.95,'ABC',1,0],[3,'deok',.5,'ABC',1,0],[6,'deok',.45,'ABC',1,0],[8,'gung',.8,'ABC',1,0],[10,'kung',.7,'BC',1,0],[12,'deok',.55,'ABC',1,0],[14,'deok',.5,'BC',1,0],[7,'deok',.3,'C',1,0],...rows([2,6,10,14],'shaker',.22,'BC')],
  fill:[[12,'deok',.6],[13,'deok',.5],[14,'deok',.7],[15,'kung',.8]],
  bp:{A:[0,6,8,14],B:[0,2,6,8,10,14],C:[0,2,4,6,8,10,12,14],R:[0,8]},
  arp:{A:{rate:4,pat:'up',vel:.3,rest:.5},B:{rate:4,pat:'updown',vel:.4,rest:.3},C:{rate:4,pat:'updown',vel:.45,rest:.15},R:{rate:2,pat:'down',vel:.3,rest:.3}},drops:{}},
 r4:{road:true,chapter:4,trip:'toxic',title:'거꾸로 된 성 · 독성',pc:1,mode:'yo',bpm:100,seed:4061,lead:'haegeum',tension:.7,pizz:[0,6,10],
  loops:[['i9','bII','i9','tri'],['i-b2','bII','tri','VIIsus'],['bII','tri','i-b2','clus'],['VI7','iv9','VIIsus','i9']],shift:[0,0,0,0],
  verb:{sec:3.6,damp:1.8,send:.45},pad:{cut:1000,lfo:.13,detune:16,voices:4},shepCycle:7,gain:1,
  heart:{lub:[1,0,.6,0],dub:[.4,0,0,.35],gap:.5,pump:.3},
  groove:[[0,'tick',.5,'ABC',1,0],[3,'tick',.3,'ABC',1,0],[6,'tick',.4,'ABC',1,0],[9,'tick',.3,'BC',1,0],[12,'tick',.4,'ABC',1,0],[7,'tock',.35,'BC',1,0],[14,'tock',.3,'C',1,0],[0,'buk',.6,'BC',1,0],[10,'deok',.3,'C',1,0]],
  fill:[[12,'tick',.5],[13,'tick',.4],[14,'tick',.6],[15,'tock',.6]],
  bp:{A:[0,10],B:[0,6,10],C:[0,3,6,9,12],R:[0]},
  arp:{B:{rate:4,pat:'skip',vel:.38,rest:.45},C:{rate:4,pat:'down',vel:.45,rest:.2},R:{rate:2,pat:'up',vel:.3,rest:.4}},drops:{}},
 r5:{road:true,chapter:5,trip:'heart',title:'심장의 시계탑 · 맥박',pc:9,mode:'minor',bpm:108,seed:5077,lead:'daegeum',pizz:[0,4,8,12],
  loops:[['i9','VI7','iv9','v7'],['VI7','III7','iv9','v7'],['iv9','v7','VI7','VIIsus'],['VI7','iv9','VIIsus','i9']],shift:[0,0,0,0],
  verb:{sec:3.4,damp:1.7,send:.4},pad:{cut:1200,lfo:.09,detune:8,voices:3},shepCycle:8,gain:1,
  heart:{lub:[1,.85,.95,.85],dub:[.55,.5,.55,.5],gap:.5,pump:.42},
  groove:[[0,'gung',.7,'ABC',2,0],[8,'gung',.6,'BC',1,0],...rows([0,2,4,6,8,10,12,14],'tick',.2,'ABC'),[4,'tock',.5,'BC',1,0],[12,'tock',.5,'BC',1,0],[0,'bell',.6,'ABC',2,0]],fill:[[12,'tock',.6],[13,'tick',.4],[14,'tock',.7],[15,'gung',.8]],
  bp:{A:[0,8],B:[0,4,8,12],C:[0,2,4,6,8,10,12,14],R:[0,8]},
  arp:{B:{rate:2,pat:'up',vel:.4,rest:.3},C:{rate:4,pat:'updown',vel:.45,rest:.12},R:{rate:2,pat:'down',vel:.3,rest:.35}},drops:{}},
 /* Blueprint chapters (trip keys c1..c10; c6, c7, c9, c10 borrow a road piece until their own identity is composed). Heartline: hline = pitched 4-slot thump cell. */
 b1:{road:true,bp:true,chapter:1,trip:'c1',title:'열린 정원 · 피아노와 마림바',pc:0,mode:'major',bpm:96,seed:6011,lead:'marimba',pluck:'piano',pizz:[],
  loops:[['I9','vi9','IVmaj7','V9sus'],['IVmaj7','V9sus','vi9','I9'],['vi9','IVmaj7','V9sus','I9'],['IVmaj7','V9sus','I9','I9']],shift:[0,0,2,0],
  verb:{sec:3.8,damp:1.5,send:.45},pad:{cut:1100,lfo:.07,detune:5,voices:3},shepCycle:8,gain:1,
  heart:{lub:[.9,.4,.7,.4],dub:[.4,0,.3,0],gap:.5,pump:.25},hline:{a:0,b:7,rot:0},
  groove:[[8,'buk',.35,'AB',1,0],...rows([0,4,8,12],'shaker',.15,'BC'),[6,'wood',.2,'BC',2,0]],fill:[],bp:{A:[0],B:[0,8],C:[0,6,8,12],R:[0]},
  arp:{A:{rate:2,pat:'up',vel:.4,rest:.45,inst:'marimba'},B:{rate:2,pat:'updown',vel:.45,rest:.3,inst:'marimba'},C:{rate:4,pat:'updown',vel:.4,rest:.2,inst:'marimba'},R:{rate:1,pat:'down',vel:.35,rest:.3,inst:'marimba'}},drops:{}},
 b2:{road:true,bp:true,chapter:2,trip:'c2',title:'오래된 그네 · 오르골',pc:9,mode:'pyeong',bpm:88,seed:6023,lead:'musicbox',pluck:'musicbox',pizz:[],tape:true,
  loops:[['I9','IVmaj7','vi9','I9'],['vi9','IVmaj7','V9sus','I9'],['IVmaj7','vi9','V9sus','I9'],['IVmaj7','V9sus','I9','I9']],shift:[0,0,0,0],
  verb:{sec:4.6,damp:1.6,send:.5},pad:{cut:700,lfo:.05,detune:11,voices:3},shepCycle:8,gain:1,
  heart:{lub:[.7,0,.45,0],dub:[.3,0,0,0],gap:.5,pump:.2},hline:{a:0,b:5,rot:1},
  groove:[[0,'buk',.25,'BC',2,0],[10,'tock',.15,'C',2,0]],fill:[],bp:{A:[0],B:[0],C:[0,8],R:[0]},
  arp:{A:{rate:2,pat:'up',vel:.45,rest:.5,inst:'musicbox'},B:{rate:2,pat:'skip',vel:.5,rest:.35,inst:'musicbox'},C:{rate:2,pat:'updown',vel:.5,rest:.25,inst:'musicbox'},R:{rate:1,pat:'down',vel:.4,rest:.3,inst:'musicbox'}},drops:{}},
 b3:{road:true,bp:true,chapter:3,trip:'c3',title:'건축 허가 · 클릭과 서브',pc:5,mode:'minor',bpm:120,seed:6037,lead:'arp',pluck:'arp',pizz:[],
  loops:[['i9','i9','VI7','VIIsus'],['VI7','VIIsus','i9','iv9'],['iv9','VI7','VIIsus','i9'],['VI7','iv9','VIIsus','i9']],shift:[0,0,0,0],
  verb:{sec:1.6,damp:2.4,send:.22},pad:{cut:600,lfo:.08,detune:4,voices:2},shepCycle:8,gain:1,
  heart:{lub:[1,.5,.8,.5],dub:[0,0,0,0],gap:.5,pump:.35},hline:{a:0,b:7,rot:0},
  groove:[...rows([0,2,4,6,8,10,12,14],'tick',.16,'ABC'),[0,'tock',.3,'BC',1,0],[10,'tock',.25,'BC',1,0],[4,'deok',.3,'C',1,0],[12,'deok',.3,'C',1,0]],fill:[[13,'tick',.5],[14,'tick',.5],[15,'tock',.6]],
  bp:{A:[0,6,10],B:[0,3,6,10,12],C:[0,2,3,6,8,10,12,14],R:[0]},
  arp:{A:{rate:4,pat:'up',vel:.3,rest:.55,inst:'arp'},B:{rate:4,pat:'skip',vel:.38,rest:.4,inst:'arp'},C:{rate:4,pat:'updown',vel:.42,rest:.25,inst:'arp'},R:{rate:2,pat:'down',vel:.3,rest:.4,inst:'arp'}},drops:{}},
 b4:{road:true,bp:true,chapter:4,trip:'c4',title:'한 박자 늦은 나 · 역재생',pc:3,mode:'pyeong',bpm:100,seed:6049,lead:'piano',pluck:'piano',pizz:[],echoArp:1,reverseTex:true,
  loops:[['I9','vi9','IVmaj7','V9sus'],['vi9','IVmaj7','V9sus','I9'],['IVmaj7','V9sus','vi9','I9'],['IVmaj7','V9sus','I9','I9']],shift:[0,0,2,0],
  verb:{sec:5,damp:1.2,send:.55},pad:{cut:900,lfo:.06,detune:9,voices:3},shepCycle:8,gain:1,
  heart:{lub:[.9,0,.7,0],dub:[.4,0,.3,0],gap:.5,pump:.28},hline:{a:0,b:7,rot:3},
  groove:[[8,'buk',.35,'BC',1,0],[4,'tock',.22,'BC',2,1],[12,'tock',.22,'BC',2,0]],fill:[],bp:{A:[0],B:[0,8],C:[0,6,8],R:[0]},
  arp:{A:{rate:2,pat:'up',vel:.4,rest:.4,inst:'piano'},B:{rate:2,pat:'updown',vel:.45,rest:.3,inst:'piano'},C:{rate:4,pat:'updown',vel:.4,rest:.25,inst:'piano'},R:{rate:2,pat:'down',vel:.3,rest:.4,inst:'piano'}},drops:{}},
 b5:{road:true,bp:true,chapter:5,trip:'c5',title:'없는 층 · 엘리베이터 벨',pc:10,mode:'yo',bpm:76,seed:6053,lead:'daegeum',pluck:'piano',pizz:[],
  loops:[['i9','VIIsus','i9','iv9'],['VI7','VIIsus','iv9','i9'],['iv9','VI7','VIIsus','i9'],['VI7','iv9','VIIsus','i9']],shift:[0,0,0,0],
  verb:{sec:6.8,damp:.9,send:.7},pad:{cut:600,lfo:.04,detune:12,voices:4},shepCycle:10,gain:1,
  heart:{lub:[.6,0,0,0],dub:[.25,0,0,0],gap:.5,pump:.18},hline:{a:0,b:5,rot:0},
  groove:[[0,'ding',.5,'ABC',4,0],[8,'buk',.2,'C',2,1]],fill:[],bp:{A:[0],B:[0],C:[0,8],R:[0]},
  arp:{B:{rate:1,pat:'skip',vel:.35,rest:.4,inst:'musicbox'},C:{rate:2,pat:'updown',vel:.35,rest:.3,inst:'musicbox'},R:{rate:1,pat:'down',vel:.3,rest:.4,inst:'musicbox'}},drops:{A:1,B:2,C:2,R:1}},
 b8:{road:true,bp:true,chapter:8,trip:'c8',title:'색채의 박동 · 브레이크비트',pc:6,mode:'minor',bpm:138,seed:6089,lead:'haegeum',pluck:'arp',pizz:[],acid:true,
  loops:[['i9','VI7','iv9','VIIsus'],['VI7','VIIsus','i9','iv9'],['iv9','VI7','VIIsus','i9'],['VI7','iv9','VIIsus','i9']],shift:[0,0,2,0],
  verb:{sec:2.6,damp:2,send:.3},pad:{cut:1500,lfo:.14,detune:13,voices:3},shepCycle:6,gain:1,
  heart:{lub:[1,.8,.9,.8],dub:[.5,0,.5,0],gap:.5,pump:.45},hline:{a:0,b:7,rot:0},
  groove:[[0,'gung',.95,'ABC',1,0],[6,'gung',.7,'ABC',1,0],[10,'kung',.8,'ABC',1,0],[4,'deok',.8,'ABC',1,0],[12,'deok',.85,'ABC',1,0],[7,'deok',.25,'BC',1,0],[9,'deok',.25,'BC',1,0],[14,'deok',.35,'C',1,0],...rows([0,2,4,6,8,10,12,14],'tick',.18,'ABC'),...rows([1,3,5,7,9,11,13,15],'tick',.1,'C')],
  fill:[[12,'deok',.7],[13,'deok',.5],[14,'deok',.8],[15,'kung',.9]],bp:{A:[0,3,6,10],B:[0,3,6,7,10,12,15],C:[0,2,3,6,7,10,11,12,14,15],R:[0]},
  arp:{B:{rate:4,pat:'up',vel:.3,rest:.5,inst:'arp'},C:{rate:4,pat:'updown',vel:.4,rest:.25,inst:'arp'},R:{rate:2,pat:'down',vel:.3,rest:.4,inst:'arp'}},drops:{}}
});
const TRIP_KEYS=Object.freeze({violet:'r1',aqua:'r2',ember:'r3',toxic:'r4',heart:'r5'});
/* blueprint chapter keys c1..c10 -> piece (c6, c7, c9, c10 are placeholders until composed) */
const BLUE_KEYS=Object.freeze({c1:'b1',c2:'b2',c3:'b3',c4:'b4',c5:'b5',c6:'r4',c7:'r2',c8:'b8',c9:'r5',c10:'r1'});
const pieceOfTrip=key=>TRIP_KEYS[key]||BLUE_KEYS[key]||null;
const FEVER_LEVEL=Object.freeze({NORMAL:1,FLOW:2,LUCID:3,OVERLOAD:4,RECOVERY:2});
const SECTIONS=Object.freeze(['intro','A','B','climax','resolve']);
const LOOP_OF=Object.freeze({intro:0,A:0,B:1,climax:2,resolve:3});
const LETTER=Object.freeze({intro:'A',A:'A',B:'B',climax:'C',resolve:'R'});
const MIN_BARS=Object.freeze({intro:2,A:4,B:4,climax:4,resolve:2});
const PLAN_BARS=Object.freeze({intro:4,A:8,B:8,climax:8,resolve:4});
const PLANS=[['pluck','pluck','lead','pluck','lead','lead','pluck','lead'],['lead','pluck','pluck','lead','pluck','pluck','lead','lead']];
const RHYTHMS=Object.freeze({
 pluck:[[[0,1],[1,.5],[1.5,1.5],[3,1]],[[0,.75],[.75,.75],[1.5,1],[2.5,1.5]],[[0,1.5],[1.5,.5],[2,2]],[[0,.5],[.5,.5],[1,1],[2,.5],[2.5,1.5]]],
 lead:[[[0,3],[3,1]],[[0,4]],[[.5,1.5],[2,2]],[[0,2],[2,1],[3,1]]]
});
/* Acts whose visual illusion is an endless ascent (+1) or descent (-1): the Shepard-Risset glissando follows. Other modules may register their own. */
const SHEP_ACTS=new Map([['helix-up',1],['penrose',1],['helix-down',-1]]);
function shepDirOf(type){
 if(!type)return 0;if(SHEP_ACTS.has(type))return SHEP_ACTS.get(type);
 if(/(^|[-_])(up|asc|rise|climb)/i.test(type))return 1;if(/(^|[-_])(down|desc|fall|drop)/i.test(type))return -1;return 0;
}
function registerShepardAct(type,dir){if(typeof type!=='string')return false;if(dir>0||dir<0)SHEP_ACTS.set(type,dir>0?1:-1);else SHEP_ACTS.delete(type);return true}
const SHEP=Object.freeze({N:6,low:32.7,sigma:1.35,points:20,amp:.05});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mod=(a,n)=>((a%n)+n)%n;
const mtof=m=>440*Math.pow(2,(m-69)/12);
function prng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

/* ---------- pure arrangement (deterministic; shared by the live scheduler, offline renderer and tests) ---------- */
const courseCache=new Map();
function arrangement(id,course){
 const base=TRIPS[id]||ARRANGEMENTS[id]||ARRANGEMENTS[1];
 const n=Number(String(course||'').replace(/\D/g,''))|0;if(!base.road||!n)return base;
 const k=id+':'+n;let c=courseCache.get(k);if(!c){c=Object.freeze({...base,seed:base.seed+n*13,course:n});courseCache.set(k,c)}return c;
}
function chapterOf(run){
 if(!run)return null;if(run.openingCourse)return 'opening';
 const n=Number(run.slot?.chapter)||Math.floor(((Number(run.slot?.number)||1)-1)/10)+1;return clamp(n|0,1,10);
}
/* Which road chapter (1..5) a course belongs to: the course definition's trip key, an explicit chapter, or its id (c1..c5 = chapter 1, c6..c10 = 2, ...). */
function roadChapterOf(run,over){
 over=over||{};
 if(over.trip&&TRIP_KEYS[over.trip])return +TRIP_KEYS[over.trip].slice(1);
 if(over.chapter!=null&&Number.isFinite(+over.chapter)&&+over.chapter>=1)return clamp(+over.chapter|0,1,5);
 const o=run?.options||{};
 if(Number.isFinite(+o.chapter)&&+o.chapter>=1)return clamp(+o.chapter|0,1,5);
 if(Number.isFinite(+run?.chapter)&&+run.chapter>=1)return clamp(+run.chapter|0,1,5);
 const t=o.trip||run?.trip;if(t&&TRIP_KEYS[t])return +TRIP_KEYS[t].slice(1);
 const m=/^c(\d+)$/.exec(String(over.course||run?.id||''));if(m)return clamp(Math.ceil((+m[1])/5),1,5);
 return 1;
}
/* Which piece a road run plays: override trip/chapter, the course's trip key (violet.. or c1..c10), else the course id (c1..c5 = chapter 1 ...). */
function roadPieceOf(run,over){
 over=over||{};
 if(over.trip&&pieceOfTrip(over.trip))return pieceOfTrip(over.trip);
 if(over.chapter!=null&&Number.isFinite(+over.chapter)&&+over.chapter>=1)return 'r'+clamp(+over.chapter|0,1,5);
 const o=run?.options||{},t=o.trip||run?.trip||run?.child?.options?.trip;
 if(t&&pieceOfTrip(t)&&!(o.chapter>=1))return pieceOfTrip(t);
 return 'r'+roadChapterOf(run,over);
}
function isRoadRun(run){return !!run&&(run.courseRun===true||run.dreamMode==='road'||run.mode==='road')}
/* Everything the music needs to know about the run: piece id, course, act, tempo (act > course > piece). */
function contextOf(run,over){
 over=over||{};const road=isRoadRun(run)||!!over.trip||(over.chapter!=null&&Number.isFinite(+over.chapter)&&!over.piece);
 const act=over.act||(run?.acts?.[run.actIndex]?.type)||'';
 const course=over.course||run?.id||'';
 let piece;
 if(over.piece&&(TRIPS[over.piece]||ARRANGEMENTS[over.piece]))piece=over.piece;
 else if(road)piece=roadPieceOf(run,over);
 else piece=run?chapterOf(run):1;
 const cfg=arrangement(piece,course);
 const candidates=[over.bpm,run?.acts?.[run.actIndex]?.opts?.bpm,run?.child?.chain?.bpm,run?.child?.bpm,run?.bpm];
 let bpm=cfg.bpm;for(const b of candidates){const v=Number(b);if(Number.isFinite(v)&&v>=40&&v<=220){bpm=v;break}}
 return {road:!!cfg.road,piece,course:String(course||''),act,actIndex:run?.actIndex|0,acts:run?.acts?.length|0,bpm,trip:cfg.trip||null,fever:over.fever||run?.fever?.state||run?.feverState||null,shepDir:shepDirOf(act),cfg};
}
function keyOf(cfg,section=0){
 const n=cfg.loops.length,s=mod(section,n),tonic=(cfg.pc+(cfg.shift[s]||0))%12,minor=MINOR[cfg.mode];
 return {tonic,name:NOTE_NAMES[tonic]+(minor?'m':''),mode:cfg.mode,minor,third:minor?3:4,scale:SCALES[cfg.mode]};
}
function chordAt(cfg,section,bar){
 const n=cfg.loops.length,s=mod(section,n),loop=cfg.loops[s]||cfg.loops[0],name=loop[mod(bar,4)],c=CHORDS[name],key=keyOf(cfg,s);
 return {name,bass:(key.tonic+c.b)%12,pcs:c.p.map(p=>(key.tonic+p)%12),key};
}
function chordSet(ch){return new Set([ch.bass,...ch.pcs])}
/* A melody pitch class is safe over a chord unless it sits a semitone from a chord tone it is not itself. */
function safe(pc,ch){const set=chordSet(ch);if(set.has(pc))return true;for(const c of set){const d=(pc-c+12)%12;if(d===1||d===11)return false}return true}
function place(pc,lo,hi,center){let best=null;for(let m=lo;m<=hi;m++)if(mod(m,12)===pc&&(best===null||Math.abs(m-center)<Math.abs(best-center)))best=m;return best}
function voicing(pcs,lo,hi,center,count){
 const out=[];for(const pc of pcs.slice(0,count)){let m=place(pc,lo,hi,center);while(out.includes(m))m+=12;if(m!==null&&m<=hi+12)out.push(m)}return out.sort((a,b)=>a-b);
}
const phraseCache=new Map();
/* 8-bar melody phrase: gayageum plucks (call) and daegeum/haegeum long tones (answer), stepwise pentatonic contour.
   cfg.tension (toxic chapter) lets a passing note rub a semitone against the chord; the first and last notes of a bar are always safe so it resolves. */
function phrase(cfg,section,variant){
 const id=cfg.seed+':'+section+':'+variant;if(phraseCache.has(id))return phraseCache.get(id);
 const key=keyOf(cfg,section),scale=key.scale,base=60+key.tonic-(key.tonic>=6?12:0),random=prng(cfg.seed*977+section*131+variant*7919);
 const midiOf=d=>base+scale[mod(d,5)]+12*Math.floor(d/5),pcOf=d=>mod(midiOf(d),12);
 const plan=PLANS[variant%2],events=[];let d=5;
 for(let bar=0;bar<8;bar++){
  const ch=chordAt(cfg,section,bar),type=plan[bar],pool=RHYTHMS[type],rhythm=pool[Math.floor(random()*pool.length)],lo=type==='lead'?2:3,hi=type==='lead'?8:9;
  rhythm.forEach(([at,dur],k)=>{
   const last=bar===7&&k===rhythm.length-1;
   if(last){let best=d,score=1e9;for(let x=lo;x<=hi;x++){const pc=pcOf(x);if(pc!==key.tonic&&pc!==(key.tonic+7)%12)continue;const s=Math.abs(x-d);if(s<score){score=s;best=x}}d=best}
   else if(k===0){let best=d,score=1e9;for(let x=lo;x<=hi;x++){const pc=pcOf(x);if(!ch.pcs.includes(pc)&&pc!==ch.bass)continue;const s=Math.abs(x-d)+random()*.6;if(s<score){score=s;best=x}}d=best}
   else{
    const bias=bar<4?.1:-.1,r=clamp(random()+bias,0,.999);let step=r<.14?-2:r<.46?-1:r<.52?0:r<.86?1:2;
    if(d+step>hi||d+step<lo)step=-step;
    let next=clamp(d+step,lo,hi),tries=0;const rub=cfg.tension?random()<cfg.tension*.5:false;
    if(!rub){while(!safe(pcOf(next),ch)&&tries++<4)next=clamp(next+(step>=0?1:-1),lo,hi);
     if(!safe(pcOf(next),ch)){for(let x=lo;x<=hi;x++)if(safe(pcOf(x),ch)&&Math.abs(x-d)<=2){next=x;break}}}
    d=next;
   }
   const inst=type==='pluck'?(cfg.pluck||'gayageum'):cfg.lead;
   events.push({bar,at,dur,midi:midiOf(d),inst,vel:type==='pluck'?(k===0?.95:.72+random()*.2):.85,bend:type==='pluck'?dur>=1&&random()<.45:random()<.6,vib:dur>=1.5});
  });
 }
 const out=Object.freeze(events.map(Object.freeze));phraseCache.set(id,out);return out;
}
/* All note events of one bar for stems 1..level (R104 pieces). at/dur are in beats from the bar start. */
function barEvents(cfg,bar,section=0,level=1,options={}){
 const ch=chordAt(cfg,section,bar),key=ch.key,events=[],random=prng(cfg.seed*31+bar*17+section*5);
 const pad=voicing(ch.pcs,52,71,61,4),bass=place(ch.bass,38,49,43);
 events.push({stem:1,inst:'pad',at:0,dur:4,midis:pad,vel:1});
 events.push({stem:1,inst:'bass',at:0,dur:4,midi:bass,vel:1});
 events.push({stem:1,inst:'kick',at:0,dur:.5,vel:1},{stem:1,inst:'kick',at:.25,dur:.5,vel:.55},{stem:1,inst:'kick',at:2,dur:.5,vel:.42});
 if(level>=2){
  [.5,.25,.35,.22,.45,.25,.35,.3].forEach((v,i)=>events.push({stem:2,inst:'shaker',at:i*.5,dur:.25,vel:v}));
  if(bar%2===1)events.push({stem:2,inst:'shaker',at:3.75,dur:.25,vel:.18});
  events.push({stem:2,inst:'wood',at:1,dur:.25,vel:.55},{stem:2,inst:'wood',at:3,dur:.25,vel:.5});
  if(bar%2===1)events.push({stem:2,inst:'buk',at:3.5,dur:.5,vel:.7});
  const tones=voicing([ch.bass,...ch.pcs],55,72,64,4);
  cfg.pizz.forEach((s,i)=>events.push({stem:2,inst:'pizz',at:s/4,dur:.5,midi:tones[(i+bar)%tones.length],vel:i===0?.9:.65+random()*.2}));
 }
 if(level>=3){
  const variant=Math.floor(bar/8)%2;
  for(const e of phrase(cfg,section,variant))if(e.bar===mod(bar,8))events.push({stem:3,...e,bar:undefined});
 }
 if(level>=4){
  events.push({stem:4,inst:'choir',at:0,dur:4,midis:voicing(ch.pcs,62,79,70,3),vel:1});
  if(bar%2===0){
   const scale=key.scale,next=chordAt(cfg,section,bar+1),base=48+key.tonic,line=[];
   let d=7;for(let x=6;x<=9;x++){const pc=(key.tonic+scale[x%5])%12;if(ch.pcs.includes(pc)||pc===ch.bass){d=x;break}}
   for(let beat=0;beat<8;beat++){const over=beat<4?ch:next;let tries=0;while(!safe((key.tonic+scale[d%5])%12,over)&&tries++<3)d++;line.push(base+scale[d%5]+12*Math.floor(d/5));d++}
   events.push({stem:4,inst:'strings',at:0,dur:8,line,vel:1});
  }
 }
 if(options.goal)events.length=0;
 return events;
}
/* ---- macro structure of the road pieces: intro -> A -> B -> climax -> resolve ---- */
function sectionAtProgress(p){p=Number(p)||0;return p<.07?'intro':p<.36?'A':p<.64?'B':p<.9?'climax':'resolve'}
/* Offline / authoring plan: one entry per bar for a whole piece (32 bars = about 80 s at 96 BPM). */
function macroPlan(){const out=[];for(const name of SECTIONS)for(let i=0;i<PLAN_BARS[name];i++)out.push({section:name,barIn:i,newSection:i===0});return out}
function isDropout(section,barIn){
 if(section==='A')return barIn>=7&&barIn%8===7;
 if(section==='B')return barIn>=3&&barIn%4===3&&barIn%8===7;
 if(section==='climax')return barIn===5;
 return false;
}
/* The stems that should sound. combo/jumpOk/melody are the player's adaptive inputs; surge adds a layer. */
function tripLevel(section,{jumpOk=false,melody=false,surge=false,progress=0}={}){
 let level={intro:1,A:1,B:2,climax:3,resolve:2}[section]||1;
 if(section==='A'&&jumpOk)level=2;
 if(melody&&section!=='intro')level=Math.max(level,3);
 if(section==='climax'&&(melody||progress>=.82))level=4;
 if(section==='resolve')level=Math.min(level,3);
 if(surge)level=Math.min(4,level+1);
 return level;
}
const PAT=Object.freeze({
 up:(i,n)=>i%n,down:(i,n)=>n-1-i%n,
 updown:(i,n)=>{const m=Math.max(1,2*n-2),k=i%m;return k<n?k:m-k},
 skip:(i,n)=>(i*2+(Math.floor(i/n)%2))%n
});
/* Events of one bar of a road piece. st = {section, barIn, level, energy 0..1, dropout, newSection, swellNext}. */
function tripBarEvents(cfg,bar,st={}){
 const section=st.section||'A',barIn=st.barIn??bar,level=st.level??4,energy=clamp(st.energy||0,0,1),loop=LOOP_OF[section],letter=LETTER[section];
 const ch=chordAt(cfg,loop,barIn),key=ch.key,ev=[],random=prng(cfg.seed*31+bar*17+loop*5),dropout=!!st.dropout;
 const hs=section==='intro'?.45+.55*Math.min(1,barIn/3):1,hv=cfg.heart;
 ev.push({stem:1,inst:'pad',at:0,dur:4,midis:voicing(ch.pcs,50,71,60,cfg.pad.voices),vel:section==='intro'?.8:1});
 ev.push({stem:1,inst:'bass',at:0,dur:4,midi:place(ch.bass,36,47,41),vel:1});
 for(let b=0;b<4;b++){
  const lub=hv.lub[b]*hs*(1+.2*energy),dub=hv.dub[b]*hs*(1+.3*energy);
  if(lub>0)ev.push({stem:1,inst:'heart',kind:'lub',at:b,dur:.5,vel:lub});
  if(dub>0)ev.push({stem:1,inst:'heart',kind:'dub',at:b+hv.gap,dur:.4,vel:dub});
 }
 /* Heartline: a pitched 4-slot thump cell (A, B, A, rest) one octave above the pulse; it thins in the intro, doubles in the climax and shrinks in the resolve. */
 if(cfg.hline&&section!=='intro'){
  const hl=cfg.hline,pa=place(ch.bass,40,51,45),pb=place((ch.bass+hl.b)%12,40,51,47),slots=letter==='R'?[0]:[0,1,2];
  for(const sl of slots){const at=(sl+hl.rot)%4;ev.push({stem:1,inst:'heart',kind:sl===1?'dub':'lub',midi:sl===1?pb:pa,at,dur:.5,vel:.55*(sl===1?.8:1)});if(letter==='C')ev.push({stem:1,inst:'heart',kind:'dub',midi:sl===1?pa:pb,at:at+.5,dur:.4,vel:.3})}
 }
 if(st.newSection&&bar>0)ev.push({stem:1,inst:'impact',at:0,dur:2,vel:section==='climax'?1:.6});
 if(cfg.reverseTex&&!dropout&&section!=='intro'&&barIn%2===1)ev.push({stem:1,inst:'swell',at:1,dur:1,vel:.5});
 if(dropout)ev.push({stem:1,inst:'swell',at:0,dur:4,vel:.9});
 else if(st.swellNext)ev.push({stem:1,inst:'swell',at:2,dur:2,vel:.9});
 if(level>=2&&!dropout){
  const fill=cfg.fill.length&&(letter==='B'||letter==='C')&&barIn%4===3;
  for(const [step,inst,vel,secs,every,rem] of cfg.groove){
   if(!secs.includes(letter)||barIn%every!==rem||(fill&&step>=12))continue;
   ev.push({stem:2,inst,at:step/4,dur:.25,vel:vel*(.85+.15*energy)});
  }
  if(fill)for(const [step,inst,vel] of cfg.fill)ev.push({stem:2,inst,at:step/4,dur:.25,vel});
  const bp=cfg.bp[letter]||[],root=place(ch.bass,36,47,41);
  bp.forEach((s,i)=>ev.push({stem:2,inst:'bpulse',at:s/4,dur:.45,midi:root+(i%2&&s%8!==0?12:0),vel:s%8===0?1:.7}));
  const nd=cfg.drops[letter]||0;
  for(let k=0;k<nd;k++){const steps=[1,2,3,5,6,7,9,10,11,13,14,15],s=steps[Math.floor(random()*steps.length)],deg=Math.floor(random()*5),m=place(mod(key.tonic+key.scale[deg],12),79,96,88);ev.push({stem:2,inst:'drop',at:s/4,dur:.5,midi:m,vel:.6+random()*.4})}
  const a=cfg.arp[letter];
  if(a&&section!=='intro'){
   const tones=voicing([ch.bass,...ch.pcs],55,79,66,5),n=tones.length,steps=Math.round(a.rate*4),pick=PAT[a.pat]||PAT.up;
   for(let i=0;i<steps;i++){if(random()<a.rest&&i%a.rate!==0)continue;
    const m=tones[pick(i+bar,n)]+(i%7===6?12:0),v=(i%a.rate===0?1:.62)*a.vel,inst=a.inst||'arp',pan=i%2?.5:-.5;
    ev.push({stem:2,inst,at:i/a.rate,dur:.5,midi:m,vel:v,pan});
    if(cfg.echoArp&&i%a.rate===0)ev.push({stem:2,inst,at:i/a.rate+cfg.echoArp/4,dur:.5,midi:m,vel:v*.4,pan:-pan})}
  }
 }
 if(level>=3&&!dropout&&section!=='intro'){
  const variant=(Math.floor(barIn/8)+(cfg.course|0))%2;
  for(const e of phrase(cfg,loop,variant))if(e.bar===mod(barIn,8))ev.push({stem:3,...e,bar:undefined});
 }
 if(level>=4&&!dropout){
  ev.push({stem:4,inst:'choir',at:0,dur:4,midis:voicing(ch.pcs,62,79,70,3),vel:1});
  if(barIn%2===0){
   const scale=key.scale,next=chordAt(cfg,loop,barIn+1),base=48+key.tonic,line=[];
   let d=7;for(let x=6;x<=9;x++){const pc=(key.tonic+scale[x%5])%12;if(ch.pcs.includes(pc)||pc===ch.bass){d=x;break}}
   for(let beat=0;beat<8;beat++){const over=beat<4?ch:next;let tries=0;while(!cfg.tension&&!safe((key.tonic+scale[d%5])%12,over)&&tries++<3)d++;line.push(base+scale[d%5]+12*Math.floor(d/5));d++}
   ev.push({stem:4,inst:'strings',at:0,dur:8,line,vel:1});
  }
  if(letter==='C'){const tones=voicing([ch.bass,...ch.pcs],62,84,74,5);for(let i=0;i<8;i++)ev.push({stem:4,inst:'glass',at:i/2,dur:.5,midi:tones[PAT.updown(i,tones.length)]+12,vel:.5,pan:i%2?.6:-.6})}
 }
 return ev;
}
function goalEvents(cfg,section=0){
 const key=keyOf(cfg,section),t=key.tonic,third=key.third;
 return [{inst:'goal-bass',midi:place(t,36,47,40),at:0},{inst:'goal-pad',midis:[48+t,55+t,48+t+12+third,62+t,67+t].map(m=>m>79?m-12:m),at:0},
  {inst:'goal-bell',midis:[72+t,72+t+third,79+t,84+t,86+t].map(m=>m>91?m-12:m),at:0}];
}
/* ---- Shepard-Risset: partial at octave position x (0..N) has amplitude shepWindow(x); the pattern is periodic, so the pitch climbs forever ---- */
function shepWindow(x,N=SHEP.N){const c=N/2,s=SHEP.sigma,w=Math.exp(-.5*((x-c)/s)*((x-c)/s)),e=Math.exp(-.5*(c/s)*(c/s));return Math.max(0,(w-e)/(1-e))}
function shepFreq(x,tonic=0){return SHEP.low*Math.pow(2,tonic/12+x)}
/* Sum of window amplitudes of the N partials at sweep phase ph (0..1): near constant, which is what makes the glissando seamless. */
function shepLoudness(ph,N=SHEP.N){let s=0;for(let k=0;k<N;k++)s+=shepWindow(k+ph,N);return s}

/* ---------- Web Audio voices ---------- */
const shared=new WeakMap();
function resources(ctx){
 let r=shared.get(ctx);if(r)return r;
 const rate=ctx.sampleRate||48000,noise=ctx.createBuffer(1,rate,rate),data=noise.getChannelData(0),random=prng(9001);
 for(let i=0;i<data.length;i++)data[i]=random()*2-1;
 const wave=(h)=>{const real=new Float32Array(h.length+1),imag=new Float32Array(h.length+1);h.forEach((a,i)=>{imag[i+1]=a});return ctx.createPeriodicWave(real,imag)};
 r={noise,soft:wave([1,.28,.1,.04,.015]),reed:wave([1,.5,.32,.18,.12,.07,.05,.03]),fat:wave([1,.5,.33,.2,.14,.1,.07,.045,.03]),flute:wave([1,.3,.17,.1,.05,.03]),irs:new Map(),bufs:new Map(),live:false,spent:0,deferred:null};shared.set(ctx,r);return r;
}
function irFor(ctx,verb){
 const r=resources(ctx),sec=verb?.sec||3.2,damp=verb?.damp||1.6,id=sec+':'+damp;if(r.irs.has(id))return r.irs.get(id);
 const SFX=root.MongyuSFX,rate=ctx.sampleRate||48000;if(!SFX?.impulseData)return null;
 const d=SFX.impulseData(rate,sec,{damp}),b=ctx.createBuffer(2,d[0].length,rate);
 for(let c=0;c<2;c++){if(b.copyToChannel)b.copyToChannel(d[c],c);else b.getChannelData(c).set(d[c])}
 r.irs.set(id,b);return b;
}
/* One cache for every pre-rendered voice (plucks, bowed notes, drums, bells ...): make() returns a Float32Array [or [L,R]] at `rate`. */
const clock=()=>root.performance?.now?.()??Date.now();
const SYNTH_BUDGET=9;/* ms of voice synthesis per scheduling pass in a live session; the rest is deferred to the warm-up queue (a note is skipped once rather than the frame stalling) */
function cached(ctx,id,rate,make,force=false){
 const r=resources(ctx);if(r.bufs.has(id))return r.bufs.get(id);
 if(!force&&r.live&&r.spent>SYNTH_BUDGET){(r.deferred||(r.deferred=new Map())).set(id,[rate,make]);return null}
 const t0=clock();let d;try{d=make()}catch(_){d=null}if(r.live)r.spent+=clock()-t0;if(!d)return null;
 const chans=Array.isArray(d)?d:[d],b=ctx.createBuffer(chans.length,chans[0].length,rate);
 chans.forEach((c,i)=>{if(b.copyToChannel)b.copyToChannel(c,i);else b.getChannelData(i).set(c)});
 if(r.bufs.size>260){const first=r.bufs.keys().next().value;r.bufs.delete(first)}r.bufs.set(id,b);return b;
}
function norm(data,k=1){let peak=0;for(const x of data)peak=Math.max(peak,Math.abs(x));const g=peak?k/peak:0,fade=Math.round(data.length*.016);for(let i=0;i<data.length;i++)data[i]*=g*(i<44?i/44:1)*(i>data.length-fade?(data.length-i)/fade:1);return data}
const PLUCK={
 piano:{sec:2.4,decay:1.3,bright:.42,pick:.12,body:.55,sym:.25,amp:1},
 gayageum:{sec:2.4,decay:1.6,bright:.62,pick:.18,body:.85,sym:.5,amp:1},
 pizz:{sec:.7,decay:.42,bright:.5,pick:0,body:.25,sym:0,amp:1},
 arp:{sec:.9,decay:.5,bright:.8,pick:.3,body:.4,sym:.2,amp:1}
};
function pluckBuffer(ctx,kind,midi){
 const SFX=root.MongyuSFX;if(!SFX?.pluckData)return null;const rate=ctx.sampleRate||48000,p=PLUCK[kind]||PLUCK.pizz;
 return cached(ctx,'pl:'+kind+':'+midi,rate,()=>norm(SFX.pluckData(mtof(midi),rate,p.sec,{decay:p.decay,bright:p.bright,seed:midi*7+(kind==='gayageum'?1:kind==='arp'?3:kind==='piano'?4:2),pick:p.pick,body:p.body,sym:p.sym})));
}
function bowBuffer(ctx,midi){
 const SFX=root.MongyuSFX;if(!SFX?.bowedData)return null;const rate=Math.round((ctx.sampleRate||48000)/2);
 return cached(ctx,'bow:'+midi,rate,()=>SFX.bowedData(mtof(midi),rate,3,{seed:midi*5+3}));
}
function drumBuffer(ctx,name,tonic){
 const SFX=root.MongyuSFX;if(!SFX?.membraneData)return null;const rate=ctx.sampleRate||48000;
 return cached(ctx,'dr:'+name+':'+tonic,rate,()=>SFX.membraneData(name,rate,{tonic}));
}
function voiceBuffer(ctx,kind,midi){const SFX=root.MongyuSFX;if(!SFX?.voiceData)return null;const rate=ctx.sampleRate||48000;return cached(ctx,'v:'+kind+':'+midi,rate,()=>SFX.voiceData(kind,mtof(midi),rate))}
function bellBuffer(ctx,midi){const SFX=root.MongyuSFX;if(!SFX?.bellData)return null;const rate=ctx.sampleRate||48000;return cached(ctx,'bell:'+midi,rate,()=>SFX.bellData(mtof(midi),rate,2.6))}
function glassBuffer(ctx,midi){const SFX=root.MongyuSFX;if(!SFX?.glassData)return null;const rate=ctx.sampleRate||48000;return cached(ctx,'glass:'+midi,rate,()=>SFX.glassData(mtof(midi),rate,1.1,.34))}
function dropBuffer(ctx,midi){const SFX=root.MongyuSFX;if(!SFX?.dropData)return null;const rate=ctx.sampleRate||48000;return cached(ctx,'drop:'+midi,rate,()=>SFX.dropData(mtof(midi),rate))}
function swellBuffer(ctx,seconds,tonic){
 const SFX=root.MongyuSFX;if(!SFX?.swellData)return null;const rate=ctx.sampleRate||48000,sec=Math.round(seconds*10)/10;
 return cached(ctx,'sw:'+sec+':'+tonic,rate,()=>SFX.swellData(rate,sec,{f:mtof(48+tonic),third:4}));
}

/* Session = one live (or offline) graph: stems -> sum -> duck low-pass -> master -> compressor -> out -> music bus.
   Pad voices run through a heartbeat "pump" gain, a slow low-pass and a stereo chorus; arpeggios through a phaser; the Shepard bank has its own bus. */
function createSession(ctx,destination,cfg,{bar0=0,start,fadeIn=1.2,closed=false,section=0,bpm}={}){
 const r=resources(ctx),t0=start??ctx.currentTime+.08,bpm0=bpm||cfg.bpm,spb=60/bpm0;
 const S={ctx,cfg,r,spb,bpm:bpm0,barDur:spb*4,t0,bar0,nextBar:bar0,nextTime:t0,section,level:0,ducked:false,goal:false,spans:[],scheduled:0,nodes:new Set(),upper:[],stopped:false,bass:null,
  beatNo:bar0*4,anchors:[{time:t0,beat:bar0*4,spb}],shep:{},shepDir:0,buses:new Map(),key:keyOf(cfg,section),baseTonic:keyOf(cfg,0).tonic,peakVoices:0};
 const node=n=>{S.nodes.add(n);return n};S.node=node;
 S.out=node(ctx.createGain());S.out.gain.value=1.1*(cfg.gain||1);/* compensates the compressor's automatic makeup gain (about +4.3 dB at these settings) */
 S.comp=node(ctx.createDynamicsCompressor());
 const c=S.comp;c.threshold.value=-8;c.knee.value=3;c.ratio.value=10;c.attack.value=.003;c.release.value=.2;
 S.master=node(ctx.createGain());S.master.gain.value=0;S.master.gain.setValueAtTime(0,t0-.05);S.master.gain.linearRampToValueAtTime(1,t0+fadeIn);
 S.duck=node(ctx.createBiquadFilter());S.duck.type='lowpass';S.duck.Q.value=.6;S.duck.frequency.setValueAtTime(closed?CLOSED:OPEN,ctx.currentTime);S.ducked=closed;
 S.sum=node(ctx.createGain());
 /* last stage: a transparent soft ceiling at about -1 dBFS (linear below 0.6, tanh knee above), so the bus can never clip */
 S.safety=node(ctx.createWaveShaper?ctx.createWaveShaper():ctx.createGain());if(ctx.createWaveShaper){const n=2049,cv=new Float32Array(n);for(let i=0;i<n;i++){const v=(i/(n-1))*2-1,x=Math.abs(v),y=x<.6?x:.6+.29*Math.tanh((x-.6)/.29);cv[i]=v<0?-y:y}S.safety.curve=cv;S.safety.oversample='2x'}
 S.verbIn=node(ctx.createGain());const hp=node(ctx.createBiquadFilter());hp.type='highpass';hp.frequency.value=240;
 S.verb=node(ctx.createConvolver());const ir=irFor(ctx,cfg.verb);if(ir)S.verb.buffer=ir;S.verbOut=node(ctx.createGain());S.verbOut.gain.value=.55*(cfg.verb?.send?cfg.verb.send/.5:1);
 S.verbIn.connect(hp);hp.connect(S.verb);S.verb.connect(S.verbOut);S.verbOut.connect(S.duck);
 S.sum.connect(S.duck);S.duck.connect(S.master);S.master.connect(S.comp);S.comp.connect(S.out);S.out.connect(S.safety);S.safety.connect(destination);
 S.stemLevels=[.9,.72,.7,.62];S.sends=[.4,.22,.5,.6];
 S.deco=node(ctx.createGain());S.deco.connect(S.sum);/* stems 2-4 are decoration: essential cues dip this bus so they stay readable */
 S.stems=[0,1,2,3].map(i=>{const g=node(ctx.createGain()),send=node(ctx.createGain());g.gain.value=0;send.gain.value=S.sends[i];g.connect(i?S.deco:S.sum);g.connect(send);send.connect(S.verbIn);return g});
 S.goalBus=node(ctx.createGain());S.goalBus.gain.value=1;S.goalBus.connect(S.sum);const gs=node(ctx.createGain());gs.gain.value=.6;S.goalBus.connect(gs);gs.connect(S.verbIn);
 /* the surge layer and the Shepard bank bypass the stems: they follow the act and the items, not the combo */
 S.surgeBus=node(ctx.createGain());S.surgeBus.gain.value=1;S.surgeBus.connect(S.sum);const ss=node(ctx.createGain());ss.gain.value=.7;S.surgeBus.connect(ss);ss.connect(S.verbIn);
 S.shepBus=node(ctx.createGain());S.shepBus.gain.value=1;const shlp=node(ctx.createBiquadFilter());shlp.type='lowpass';shlp.frequency.value=2600;shlp.Q.value=.3;S.shepBus.connect(shlp);shlp.connect(S.sum);const sh=node(ctx.createGain());sh.gain.value=.5;shlp.connect(sh);sh.connect(S.verbIn);
 const lfo=(hz,phase)=>{const o=node(ctx.createOscillator());o.frequency.value=hz;o.start(Math.max(0,t0-.05));return o};
 const lfoGain=(o,depth,param)=>{const g=node(ctx.createGain());g.gain.value=depth;o.connect(g);g.connect(param);return g};
 /* pad chain: pump (heartbeat duck) -> slow filter -> dry + chorus L/R -> stem 1 */
 S.padIn=node(ctx.createGain());S.pump=node(ctx.createGain());S.pump.gain.value=1;S.padLp=node(ctx.createBiquadFilter());S.padLp.type='lowpass';S.padLp.Q.value=.5;
 const cut=cfg.pad?.cut||1100;S.padLp.frequency.value=cut*2.2;S.padCut=cut;S.padIn.connect(S.pump);S.pump.connect(S.padLp);
 const padLfo=lfo(cfg.pad?.lfo||.07);lfoGain(padLfo,cut*.4,S.padLp.frequency);
 S.padLp.connect(S.stems[0]);
 const chLfo=lfo(.23),mk=(base,sign,pan)=>{const d=node(ctx.createDelay(.1));d.delayTime.value=base;lfoGain(chLfo,sign*.004,d.delayTime);const p=node(ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain());if(p.pan)p.pan.value=pan;const g=node(ctx.createGain());g.gain.value=.55;S.padLp.connect(d);d.connect(g);g.connect(p);p.connect(S.stems[0])};
 mk(.019,1,-.8);mk(.026,-1,.8);
 /* arpeggio phaser: 4 all-pass stages swept by a slow LFO, mixed with the dry signal */
 S.arpIn=node(ctx.createGain());const dry=node(ctx.createGain());dry.gain.value=.62;S.arpIn.connect(dry);dry.connect(S.stems[1]);
 const phLfo=lfo(.17);let prev=S.arpIn;const wet=node(ctx.createGain());wet.gain.value=.5;
 for(const [f,d] of [[420,260],[760,420],[1300,700],[2200,1100]]){const ap=node(ctx.createBiquadFilter());ap.type='allpass';ap.frequency.value=f;ap.Q.value=.8;lfoGain(phLfo,d,ap.frequency);prev.connect(ap);prev=ap}
 prev.connect(wet);wet.connect(S.stems[1]);
 if(cfg.tape){const n=node(ctx.createBufferSource()),bp=node(ctx.createBiquadFilter()),g=node(ctx.createGain()),fl=lfo(.31);n.buffer=r.noise;n.loop=true;bp.type='bandpass';bp.frequency.value=3200;bp.Q.value=.4;g.gain.value=.012;lfoGain(fl,.005,g.gain);n.connect(bp);bp.connect(g);g.connect(S.stems[0]);n.start(Math.max(0,t0-.05))}
 /* shared vibrato / flutter LFOs for the daegeum */
 S.vibLfo=lfo(5.1);S.flutLfo=lfo(13.5);
 return S;
}
/* A (panned) sub-bus into stem `stem` (or into any other node when `target` is given), created once per pan position. */
function busFor(S,stem,pan=0,target=null){
 const id=(target?'t':'s')+stem+':'+pan;let b=S.buses.get(id);if(b)return b;
 const ctx=S.ctx,g=S.node(ctx.createGain()),to=target||S.stems[stem-1];
 if(pan&&ctx.createStereoPanner){const p=S.node(ctx.createStereoPanner());p.pan.value=pan;g.connect(p);p.connect(to)}else g.connect(to);
 S.buses.set(id,g);return g;
}
/* Voices are counted by their scheduled [start,end) span, so the cap also holds while scheduling ahead (and offline). */
function track(S,src,stem,at,end,offset=0){
 const span=[at,end];S.spans.push(span);S.scheduled++;S.nodes.add(src);
 src.onended=()=>{S.nodes.delete(src);try{src.disconnect()}catch(_){}};
 if(stem>=2)S.upper.push({src,at,stem,span});
 try{if(offset)src.start(at,offset);else src.start(at);src.stop(end)}catch(_){}
 return span;
}
function voicesAt(S,t){let n=0;for(const [a,z] of S.spans)if(a<=t+.001&&z>t)n++;return n}
/* Peak concurrency of the already-admitted spans anywhere in [at,end): a new voice may not push it past the cap for its priority (2 base, 1 musical, 0 decoration). */
function peakIn(S,at,end){
 let peak=voicesAt(S,at);for(const [a] of S.spans)if(a>at&&a<end){const n=voicesAt(S,a);if(n>peak)peak=n}return peak;
}
const CAPS=[MAX_VOICES-12,MAX_VOICES-6,MAX_VOICES];
function admit(S,priority,at,len,need=1){const cap=CAPS[priority===true?2:priority===false?0:priority]??MAX_VOICES;return peakIn(S,at,at+len)+need<=cap}
function env(param,t,peak,attack,hold,release){param.setValueAtTime(0,t);param.linearRampToValueAtTime(peak,t+attack);param.setValueAtTime(peak,t+Math.max(attack,hold));param.setTargetAtTime(0,t+Math.max(attack,hold),release/4)}
/* Envelope gains start at 0: a default gain of 1 lets the first frame of a source through before setValueAtTime applies. */
function zg(ctx){const g=ctx.createGain();g.gain.value=0;return g}
function bufferVoice(S,buf,t,dest,peak,{prio=1,stem=2,rate=1,detune=0,filter=null,len=null}={}){
 const ctx=S.ctx,end=t+(len||buf.duration)+.02;if(!admit(S,prio,t,end-t))return null;
 const src=ctx.createBufferSource(),g=ctx.createGain();src.buffer=buf;g.gain.value=peak;if(detune&&src.detune)src.detune.value=detune;
 if(filter){src.connect(filter);filter.connect(g)}else src.connect(g);g.connect(dest);track(S,src,stem,t,end);return {src,g};
}
function play(S,e,t,dest){
 const ctx=S.ctx,spb=S.spb,dur=(e.dur||1)*spb,tonic=S.key?.tonic??0,bus=(stem,pan)=>busFor(S,stem,pan);
 switch(e.inst){
  case 'pad':{const n=e.midis.length,len=dur+1.5;if(!admit(S,2,t,len,n*2))return;const g=zg(ctx),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=(S.cfg.pad?.cut||1100)*(S.cfg.road?2.2:1);lp.Q.value=.25;
   env(g.gain,t,.0185*e.vel,.9,dur,1.5);lp.connect(g);g.connect(S.cfg.road?S.padIn:dest);const det=S.cfg.pad?.detune||7;
   e.midis.forEach((m,i)=>{for(const sgn of [-1,1]){const o=ctx.createOscillator();o.setPeriodicWave(S.r.fat);o.frequency.value=mtof(m);o.detune.value=sgn*(det+((m*37+i*11)%5))*(i%2?1.2:1);o.connect(lp);track(S,o,e.stem,t,t+len)}});break}
  case 'bass':{
   if(!S.bass||S.curBar%16===0&&S.bass.from<t-.05){if(!admit(S,2,t,600,2))return;
    if(S.bass){const old=S.bass;try{old.g.gain.cancelScheduledValues(t);old.g.gain.setTargetAtTime(0,t,.25);old.o.stop(t+2);old.o2.stop(t+2)}catch(_){}}
    const o=ctx.createOscillator(),o2=ctx.createOscillator(),lp=ctx.createBiquadFilter(),g=zg(ctx),g2=zg(ctx);o.type='sine';o2.type='triangle';lp.type='lowpass';lp.frequency.value=380;
    o.frequency.setValueAtTime(mtof(e.midi),t);o2.frequency.setValueAtTime(mtof(e.midi+12),t);g2.gain.value=.22;o.connect(g);o2.connect(g2);g2.connect(lp);lp.connect(g);g.connect(S.cfg.road?S.pump:dest);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.03,t+.6);
    S.bass={o,o2,g,from:t};track(S,o,1,t,t+600);track(S,o2,1,t,t+600);
   }else{for(const [osc,m] of [[S.bass.o,e.midi],[S.bass.o2,e.midi+12]])osc.frequency.setTargetAtTime(mtof(m),t,.09)}
   break}
  case 'kick':{if(!admit(S,2,t,.55,2))return;const o=ctx.createOscillator(),g=zg(ctx),o2=ctx.createOscillator(),g2=zg(ctx);o.type='sine';o2.type='sine';
   o.frequency.setValueAtTime(70,t);o.frequency.exponentialRampToValueAtTime(42,t+.13);o2.frequency.setValueAtTime(140,t);o2.frequency.exponentialRampToValueAtTime(84,t+.13);
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.148*e.vel,t+.006);g.gain.setTargetAtTime(0,t+.01,.085);g2.gain.value=.22;o.connect(g);o2.connect(g2);g2.connect(g);g.connect(dest);
   track(S,o,e.stem,t,t+.55);track(S,o2,e.stem,t,t+.55);break}
  case 'heart':{
   /* lub / dub: a sine thump whose pitch falls from 1.7x to the key's low note, plus its octave so phone speakers still carry it, plus a soft knock. */
   const lub=e.kind!=='dub';if(!admit(S,2,t,.6,2))return;const f=e.midi?mtof(e.midi)*.5:mtof(29+mod(tonic-5,12))*(lub?1:1.12),o=ctx.createOscillator(),o2=ctx.createOscillator(),g=zg(ctx),g2=zg(ctx);o.type='sine';o2.type='sine';
   o.frequency.setValueAtTime(f*1.7,t);o.frequency.exponentialRampToValueAtTime(f,t+(lub?.11:.08));o2.frequency.setValueAtTime(f*3.4,t);o2.frequency.exponentialRampToValueAtTime(f*2,t+.1);
   const peak=(lub?.115:.07)*e.vel;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.006);g.gain.setTargetAtTime(0,t+.012,lub?.075:.055);g2.gain.value=.26;o.connect(g);o2.connect(g2);g2.connect(g);g.connect(dest);
   track(S,o,1,t,t+.5);track(S,o2,1,t,t+.5);break}
  case 'impact':{if(!admit(S,2,t,1.4,2))return;const o=ctx.createOscillator(),g=zg(ctx),n=ctx.createBufferSource(),ng=zg(ctx),lp=ctx.createBiquadFilter();o.type='sine';o.frequency.setValueAtTime(mtof(41+mod(tonic-5,12))*1.8,t);o.frequency.exponentialRampToValueAtTime(mtof(29+mod(tonic-5,12)),t+.3);
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.2*e.vel,t+.008);g.gain.setTargetAtTime(0,t+.02,.28);o.connect(g);g.connect(dest);
   n.buffer=S.r.noise;n.loop=true;lp.type='lowpass';lp.frequency.setValueAtTime(5000,t);lp.frequency.exponentialRampToValueAtTime(260,t+.7);ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(.05*e.vel,t+.004);ng.gain.setTargetAtTime(0,t+.01,.22);n.connect(lp);lp.connect(ng);ng.connect(dest);
   track(S,o,e.stem,t,t+1.4);track(S,n,e.stem,t,t+1.2,(t*3.1)%.8);break}
  case 'swell':{const len=e.len||dur,buf=swellBuffer(ctx,len,S.baseTonic);if(!buf)return;bufferVoice(S,buf,t+Math.max(0,len-buf.duration),dest,.26*e.vel,{prio:1,stem:1});break}
  case 'shaker':{if(!admit(S,0,t,.16))return;const src=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),g=zg(ctx);src.buffer=S.r.noise;hp.type='highpass';hp.frequency.value=6500;
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.26*e.vel,t+.004);g.gain.setTargetAtTime(0,t+.006,.022);src.connect(hp);hp.connect(g);g.connect(dest);
   track(S,src,e.stem,t,t+.16,(t*7.919)%.8);break}
  case 'wood':{if(!admit(S,0,t,.14))return;const o=ctx.createOscillator(),g=zg(ctx);o.type='triangle';o.frequency.setValueAtTime(mtof(84+tonic),t);o.frequency.exponentialRampToValueAtTime(mtof(79+tonic),t+.03);
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22*e.vel,t+.002);g.gain.setTargetAtTime(0,t+.003,.016);o.connect(g);g.connect(dest);track(S,o,e.stem,t,t+.14);break}
  case 'buk':case 'gung':case 'deok':case 'kung':case 'tick':case 'tock':{
   const buf=drumBuffer(ctx,e.inst,S.baseTonic);if(!buf)return;const peak={buk:.22,gung:.22,deok:.2,kung:.2,tick:.14,tock:.14}[e.inst];
   bufferVoice(S,buf,t,dest,peak*e.vel,{prio:e.inst==='tick'||e.inst==='tock'?0:1,stem:e.stem});break}
  case 'bpulse':{if(!admit(S,1,t,.34,2))return;const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=zg(ctx),lp=ctx.createBiquadFilter(),acid=!!S.cfg.acid;o.type=acid?'sawtooth':'sine';o2.type=acid?'square':'triangle';o.frequency.value=mtof(e.midi);o2.frequency.value=mtof(e.midi);lp.type='lowpass';lp.frequency.value=520;
   if(acid){lp.Q.value=9;lp.frequency.setValueAtTime(260,t);lp.frequency.exponentialRampToValueAtTime(1800,t+.04);lp.frequency.exponentialRampToValueAtTime(300,t+.28)}
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime((acid?.04:.06)*(S.cfg.bpGain||1)*e.vel,t+.01);g.gain.setTargetAtTime(0,t+.02,.07);o.connect(lp);o2.connect(lp);lp.connect(g);g.connect(dest);track(S,o,e.stem,t,t+.34);track(S,o2,e.stem,t,t+.34);break}
  case 'bell':{const buf=bellBuffer(ctx,60+S.baseTonic);if(buf)bufferVoice(S,buf,t,dest,.085*e.vel,{prio:1,stem:e.stem});break}
  case 'drop':{const buf=dropBuffer(ctx,e.midi);if(buf)bufferVoice(S,buf,t,bus(2,e.pan||0),.11*e.vel,{prio:0,stem:e.stem});break}
  case 'arp':{const buf=pluckBuffer(ctx,'arp',e.midi);if(buf)bufferVoice(S,buf,t,busFor(S,2,e.pan||0,S.arpIn),.3*e.vel,{prio:0,stem:e.stem});break}
  case 'piano':case 'marimba':case 'musicbox':{
   const buf=e.inst==='piano'?pluckBuffer(ctx,'piano',e.midi):voiceBuffer(ctx,e.inst,e.midi);if(!buf)return;
   const peak={piano:.42,marimba:.34,musicbox:.26}[e.inst]*e.vel*(e.stem===3?1:.7);bufferVoice(S,buf,t,e.stem===3?bus(3,-.2):busFor(S,2,e.pan||0,S.arpIn),peak,{prio:e.stem===3?1:0,stem:e.stem});break}
  case 'ding':{const buf=voiceBuffer(ctx,'ding',84+S.baseTonic);if(buf)bufferVoice(S,buf,t,dest,.12*e.vel,{prio:1,stem:e.stem});break}
  case 'glass':{const buf=glassBuffer(ctx,e.midi);if(buf)bufferVoice(S,buf,t,bus(4,e.pan||0),.1*e.vel,{prio:0,stem:e.stem});break}
  case 'pizz':case 'gayageum':{const g=e.inst==='gayageum',b=pluckBuffer(ctx,e.inst,e.midi);if(!b)return;if(!admit(S,g?1:0,t,b.duration))return;const src=ctx.createBufferSource(),gn=zg(ctx);src.buffer=b;
   const peak=e.inst==='pizz'?.27*e.vel:.5*e.vel;gn.gain.setValueAtTime(peak,t);
   if(g){
    if(e.bend&&src.detune){src.detune.setValueAtTime(-90,t);src.detune.setTargetAtTime(0,t+.01,.035)}
    if(e.vib&&src.detune){const lfo=ctx.createOscillator(),depth=zg(ctx);lfo.frequency.value=5.2;depth.gain.setValueAtTime(0,t);depth.gain.linearRampToValueAtTime(16,t+dur*.6);lfo.connect(depth);depth.connect(src.detune);track(S,lfo,e.stem,t,t+2.2)}
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(5200,t);lp.frequency.setTargetAtTime(1800,t+.02,.3);src.connect(lp);lp.connect(gn);
   }else src.connect(gn);
   gn.connect(g?bus(3,-.25):dest);track(S,src,e.stem,t,t+b.duration);break}
  case 'haegeum':{
   /* bowed string: friction-model buffer (vibrato baked in), note envelope + a scooping slide into the pitch */
   const b=bowBuffer(ctx,e.midi);if(!b){playLegacyLead(S,e,t,dest,dur);return}const len=Math.max(.3,Math.min(dur*.98,b.duration-.1));if(!admit(S,1,t,len+.4))return;
   const src=ctx.createBufferSource(),g=zg(ctx);src.buffer=b;if(e.bend&&src.detune){src.detune.setValueAtTime(-160,t);src.detune.setTargetAtTime(0,t+.01,.07)}
   const peak=.2*e.vel;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+.08);g.gain.setTargetAtTime(peak*.85,t+.15,.4);g.gain.setTargetAtTime(0,t+len,.1);src.connect(g);g.connect(bus(3,.3));track(S,src,e.stem,t,t+len+.5);break}
  case 'daegeum':playLegacyLead(S,e,t,dest,dur);break;
  case 'choir':{if(!admit(S,0,t,dur+1.7,e.midis.length))return;const g=zg(ctx),f1=ctx.createBiquadFilter(),f2=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter();
   f1.type='bandpass';f1.frequency.value=720;f1.Q.value=2.5;f2.type='bandpass';f2.frequency.value=1150;f2.Q.value=3;lp.type='lowpass';lp.frequency.value=2600;
   f1.connect(g);f2.connect(g);g.connect(lp);lp.connect(dest);env(g.gain,t,.062,1.1,dur,1.6);
   e.midis.forEach((m,i)=>{const o=ctx.createOscillator();o.type='sawtooth';o.frequency.value=mtof(m);o.detune.value=i%2?9:-8;o.connect(f1);o.connect(f2);track(S,o,e.stem,t,t+dur+1.7)});break}
  case 'strings':{if(!admit(S,0,t,dur+1,2))return;const g=zg(ctx),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(900,t);lp.frequency.linearRampToValueAtTime(2600,t+dur);lp.Q.value=.5;
   g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.029,t+spb);g.gain.linearRampToValueAtTime(.065,t+dur-spb*.5);g.gain.setTargetAtTime(0,t+dur-spb*.3,.25);lp.connect(g);g.connect(dest);
   for(const det of [-7,8]){const o=ctx.createOscillator();o.type='sawtooth';o.detune.value=det;e.line.forEach((m,i)=>{if(i===0)o.frequency.setValueAtTime(mtof(m),t);else o.frequency.setTargetAtTime(mtof(m),t+i*spb,.03)});o.connect(lp);track(S,o,e.stem,t,t+dur+1)}
   break}
  case 'goal-bass':{const o=ctx.createOscillator(),g=zg(ctx);o.type='sine';o.frequency.value=mtof(e.midi);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.08);g.gain.setTargetAtTime(0,t+.4,1.1);o.connect(g);g.connect(dest);track(S,o,0,t,t+5.5);break}
  case 'goal-pad':{const g=zg(ctx),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2400;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.042,t+.18);g.gain.setTargetAtTime(0,t+.6,1.2);lp.connect(g);g.connect(dest);
   e.midis.forEach((m,i)=>{const o=ctx.createOscillator();o.setPeriodicWave(S.r.fat);o.frequency.value=mtof(m);o.detune.value=i%2?4:-4;o.connect(lp);track(S,o,0,t,t+6)});break}
  case 'goal-bell':{e.midis.forEach((m,i)=>{const at=t+i*.06;for(const [ratio,amp,tau] of [[1,.05,.9],[4,.011,.25]]){const o=ctx.createOscillator(),g=zg(ctx);o.type='sine';o.frequency.value=mtof(m)*ratio;g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(amp,at+.004);g.gain.setTargetAtTime(0,at+.006,tau);o.connect(g);g.connect(dest);track(S,o,0,at,at+tau*7)}});break}
  case 'surge-pad':{if(!admit(S,1,t,e.len+1.5,6))return;const g=zg(ctx),lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3600;env(g.gain,t,.03,.5,e.len,1.2);lp.connect(g);g.connect(dest);
   e.midis.forEach((m,i)=>{for(const sgn of [-1,1]){const o=ctx.createOscillator();o.setPeriodicWave(S.r.soft);o.frequency.value=mtof(m);o.detune.value=sgn*(5+i);o.connect(lp);track(S,o,0,t,t+e.len+1.5)}});break}
 }
}
/* Daegeum: breath noise + flute-like wave, a leap into the note, flutter at the onset and a delayed shared-LFO vibrato; (also the haegeum fallback when the SFX module is missing). */
function playLegacyLead(S,e,t,dest,dur){
 const ctx=S.ctx,h=e.inst==='haegeum',f=mtof(e.midi),len=Math.max(.25,dur*.96);if(!admit(S,1,t,len+.6,3))return;
 const o=ctx.createOscillator(),g=zg(ctx),lp=ctx.createBiquadFilter();
 if(h)o.setPeriodicWave(S.r.reed);else o.setPeriodicWave(S.r.flute);
 o.frequency.value=f;lp.type='lowpass';lp.frequency.value=h?2400:3000;lp.Q.value=h?1.4:.4;
 const peak=(h?.11:.144)*e.vel;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+(h?.09:.12));g.gain.setTargetAtTime(peak*.82,t+.15,.3);g.gain.setTargetAtTime(0,t+len,.12);
 if(e.bend){o.detune.setValueAtTime(h?-140:-210,t);o.detune.setTargetAtTime(0,t+.01,h?.06:.035)}
 const vd=zg(ctx);vd.gain.setValueAtTime(0,t);vd.gain.linearRampToValueAtTime(e.vib?(h?22:14):6,t+Math.min(.6,len));S.vibLfo.connect(vd);vd.connect(o.detune);
 o.connect(lp);lp.connect(g);g.connect(busFor(S,3,h?.3:.1));track(S,o,e.stem,t,t+len+.6);
 if(!h){
  const fd=zg(ctx);fd.gain.setValueAtTime(peak*.28,t);fd.gain.setTargetAtTime(0,t+.1,.12);S.flutLfo.connect(fd);fd.connect(g.gain);/* flutter-tongue shimmer in the attack */
  const n=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),ng=zg(ctx);n.buffer=S.r.noise;n.loop=true;bp.type='bandpass';bp.frequency.value=Math.min(6000,f*2.2);bp.Q.value=2.2;
  ng.gain.setValueAtTime(0,t);ng.gain.linearRampToValueAtTime(peak*.55,t+.05);ng.gain.setTargetAtTime(peak*.16,t+.08,.12);ng.gain.setTargetAtTime(0,t+len,.1);n.connect(bp);bp.connect(ng);ng.connect(busFor(S,3,.1));track(S,n,e.stem,t,t+len+.5,(t*5.3)%.7);
 }
}
/* ---- Shepard-Risset bank ---- */
function shepSpawn(S,b,at,pos0){
 const N=SHEP.N,T=b.T,dur=(N-pos0)*T;if(dur<.6)return;
 const ctx=S.ctx,o=ctx.createOscillator(),g=ctx.createGain(),x=p=>b.dir>0?p:N-p,M=Math.max(8,Math.ceil((N-pos0)*SHEP.points)),curve=new Float32Array(M);
 for(let i=0;i<M;i++)curve[i]=SHEP.amp*shepWindow(x(pos0+(N-pos0)*i/(M-1)));
 o.type='sine';o.frequency.setValueAtTime(shepFreq(x(pos0),b.tonic),at);o.frequency.exponentialRampToValueAtTime(shepFreq(x(N),b.tonic),at+dur);
 g.gain.value=0;try{g.gain.setValueCurveAtTime(curve,at,dur)}catch(_){}o.connect(g);g.connect(b.gain);
 b.partials.push({o,span:track(S,o,1,at,at+dur+.05),end:at+dur});S.nodes.add(g);
}
function shepEnsure(S,dir,t){
 let b=S.shep[dir];if(b&&!b.dead)return b;
 const ctx=S.ctx,N=SHEP.N,T=(S.cfg.shepCycle||8)*S.barDur;
 b={dir,dead:false,gain:S.node(ctx.createGain()),partials:[],T,tonic:S.key?.tonic??0,next:0,offSince:null};b.gain.gain.value=0;b.gain.connect(S.shepBus);
 if(!admit(S,2,t,N*T,SHEP.N))return null;
 for(let k=0;k<N;k++)shepSpawn(S,b,t,k+.5);
 b.next=t+.5*T;S.shep[dir]=b;return b;
}
function shepRetire(S,b,t){
 if(b.dead)return;b.dead=true;b.gain.gain.cancelScheduledValues(t);b.gain.gain.setTargetAtTime(0,t,.1);
 for(const p of b.partials){try{p.o.stop(t+.5)}catch(_){}p.span[1]=Math.min(p.span[1],t+.5)}
}
/* Called once per bar: keeps the bank for the active direction alive and fading in, the other one fading out (and retired after a while). */
function shepStep(S,dir,level,t){
 for(const k of [1,-1]){
  const b=S.shep[k];
  if(k===dir&&level>0){
   const bank=shepEnsure(S,k,t);if(!bank)continue;
   while(bank.next<t+S.barDur+LOOKAHEAD){shepSpawn(S,bank,bank.next,0);bank.next+=bank.T}
   bank.partials=bank.partials.filter(p=>p.end>t);bank.offSince=null;bank.gain.gain.setTargetAtTime(level,t,S.barDur*.4);
  }else if(b&&!b.dead){
   b.gain.gain.setTargetAtTime(0,t,S.barDur*.35);if(b.offSince===null)b.offSince=t;
   if(t-b.offSince>S.barDur*3)shepRetire(S,b,t);
  }
 }
}
function setStem(S,i,value,t,tc){const p=S.stems[i].gain;try{p.cancelScheduledValues(t)}catch(_){}p.setTargetAtTime(value,t,tc)}
/* Re-points the beat grid. Anchors keep the (time, beat, seconds-per-beat) of every scheduled bar so beat() stays exact across tempo changes. */
function anchor(S,time){
 S.anchors.push({time,beat:S.beatNo,spb:S.spb});if(S.anchors.length>12)S.anchors.shift();
}
function scheduleBar(S,level,section,tripState){
 const t=S.nextTime,bar=S.nextBar;S.curBar=bar;S.section=section;
 if(tripState){
  const cfg=S.cfg,loop=LOOP_OF[tripState.section];S.key=keyOf(cfg,loop);S.sectionName=tripState.section;S.loop=loop;
  if(tripState.bpm&&Math.abs(tripState.bpm-S.bpm)>.01){S.bpm=tripState.bpm;S.spb=60/S.bpm;S.barDur=S.spb*4}
  anchor(S,t);
  if(!S.goal){
   for(let i=0;i<4;i++)setStem(S,i,i<level?S.stemLevels[i]:0,t,i<level?S.spb*.3:S.spb*.5);
   S.level=level;S.padLp.frequency.setTargetAtTime(S.padCut*(.9+.2*level+(tripState.dropout?-.35:0)),t,S.spb);
   const events=tripBarEvents(cfg,bar,{...tripState,level});
   for(const e of events){if(S.only&&!S.only.includes(e.inst))continue;
    const at=t+e.at*S.spb,dest=e.stem===1?S.stems[0]:e.stem===2?S.stems[1]:e.stem===3?S.stems[2]:S.stems[3];
    play(S,e,at,dest);
    if(e.inst==='heart'&&e.kind==='lub'){const pg=S.pump.gain,depth=cfg.heart.pump*(.75+.5*(tripState.energy||0));pg.setTargetAtTime(1-depth,at,.006);pg.setTargetAtTime(1,at+.045,.1)}
   }
   shepStep(S,tripState.shepDir||0,tripState.shep??0,t);
  }
 }else{
  S.key=keyOf(S.cfg,section);anchor(S,t);
  if(!S.goal){
   for(let i=0;i<4;i++)setStem(S,i,i<level?S.stemLevels[i]:0,t,i<level?S.spb*.3:S.spb*.5);
   S.level=level;
   for(const e of barEvents(S.cfg,bar,section,level))if(!S.only||S.only.includes(e.inst))play(S,e,t+e.at*S.spb,S.stems[e.stem-1]);
  }
 }
 const now=S.ctx.currentTime;S.upper=S.upper.filter(u=>u.at>now-.05);S.spans=S.spans.filter(z=>z[1]>now);
 S.peakVoices=Math.max(S.peakVoices,peakIn(S,Math.max(t,now),t+S.barDur));
 S.nextBar++;S.beatNo+=4;S.nextTime+=S.barDur;return {bar,time:t,level};
}
/* Crash: low-pass sweeps closed in ~120ms, upper stems drop, not-yet-started upper notes are cancelled. */
function duck(S,t){
 const f=S.duck.frequency;try{if(f.cancelAndHoldAtTime)f.cancelAndHoldAtTime(t);else{f.cancelScheduledValues(t);f.setValueAtTime(S.ducked?CLOSED:OPEN,t)}}catch(_){}
 f.exponentialRampToValueAtTime(CLOSED,t+.12);S.ducked=true;
 for(let i=1;i<4;i++)setStem(S,i,i===1&&S.cfg.road?S.stemLevels[1]*.4:0,t,.04);setStem(S,0,S.stemLevels[0]*.8,t,.08);
 for(const d of [1,-1]){const b=S.shep[d];if(b&&!b.dead)b.gain.gain.setTargetAtTime(.25,t,.05)}
 for(const u of S.upper)if(u.at>t+.01){try{u.src.stop(t)}catch(_){}u.span[1]=t}
 S.upper=[];S.level=1;
}
function rebuild(S,t){
 const f=S.duck.frequency;try{f.cancelScheduledValues(t)}catch(_){}f.setValueAtTime(CLOSED,t);f.exponentialRampToValueAtTime(OPEN,t+S.barDur);S.ducked=false;
}
/* Goal: rhythm/melody stems fade out, the tonic resolution chord rings on its own bus. */
function goalChord(S,t,section){
 if(S.goal)return;S.goal=true;
 const f=S.duck.frequency;try{f.cancelScheduledValues(t)}catch(_){}f.setValueAtTime(S.ducked?CLOSED:OPEN,t);if(S.ducked)f.exponentialRampToValueAtTime(OPEN,t+.25);S.ducked=false;
 for(let i=0;i<4;i++)setStem(S,i,0,t,i===0?.35:.12);
 for(const d of [1,-1]){const b=S.shep[d];if(b&&!b.dead)b.gain.gain.setTargetAtTime(0,t,.3)}
 for(const u of S.upper)if(u.at>t+.01){try{u.src.stop(t)}catch(_){}u.span[1]=t}
 for(const e of goalEvents(S.cfg,S.cfg.road?0:section))play(S,e,t+e.at,S.goalBus);
}
/* Aurora wave (surge): a short sparkling arpeggio and a bright pad on the surge bus, quantised to the next eighth of the beat grid. */
/* An essential cue (pickup, perfect, gate, shield) dips the decoration stems for a moment; the base pulse never moves. */
function cueDuck(S,t,depth=.4,hold=.28){
 if(!S?.deco||S.goal)return;const g=S.deco.gain;try{g.cancelScheduledValues(t);g.setTargetAtTime(1-depth,t,.015);g.setTargetAtTime(1,t+hold,.12)}catch(_){}
}
function surgeLayer(S,t,seconds=4){
 if(S.goal)return;const key=S.key,steps=Math.max(4,Math.floor(seconds/(S.spb/2))),scale=key.scale,line=[0,1,2,3,4,5,6,5,4,3,2,1];
 play(S,{inst:'surge-pad',midis:[60,67,72+key.third,76].map(m=>m+key.tonic).map(m=>m>84?m-12:m),len:seconds,vel:1},t,S.surgeBus);
 for(let i=0;i<steps;i++){const d=line[i%line.length],m=72+key.tonic+scale[d%5]+12*Math.floor(d/5);play(S,{inst:'glass',midi:m>96?m-12:m,vel:.7+.3*((i%4)===0),pan:i%2?.6:-.6,stem:4},t+i*S.spb/2,S.surgeBus)}
}
/* Reverse-reverb swell that blooms into the new downbeat at time `end` (aurora gates and section changes). */
function gateSwell(S,end,now){
 const len=Math.round(Math.min(S.spb*2,end-(now+.04))*10)/10;if(len<.25)return;play(S,{inst:'swell',len,vel:.9,dur:len/S.spb,stem:1},end-len,S.stems[0]);
}
function disposeSession(S,fade=0){
 if(!S||S.stopped)return;S.stopped=true;const ctx=S.ctx,t=ctx.currentTime;
 const hold=fade>=2?1:0;try{S.master.gain.cancelScheduledValues(t);if(fade>0){S.master.gain.setValueAtTime(S.master.gain.value,t);S.master.gain.setTargetAtTime(0,t+hold,fade/4)}else S.master.gain.setValueAtTime(0,t)}catch(_){}
 const kill=()=>{for(const n of S.nodes){try{if(n.stop)n.stop()}catch(_){}try{n.onended=null}catch(_){}try{n.disconnect()}catch(_){}}S.nodes.clear();S.spans=[]};
 S.kill=kill;if(fade>0){S.killAt=t+hold+fade+.1;if(typeof setTimeout==='function'){const id=setTimeout(()=>{if(!S.done){S.done=true;kill()}},(hold+fade+.4)*1000);id?.unref?.()}}else kill();
}

/* ---------- live controller ---------- */
const bus=root.MongyuPolish;
let session=null,lingering=[],timer=null,clockOverride=null,lastResume=0,override=null;
const M={run:null,chapter:null,cfg:null,ctx:null,section:0,applied:0,jumpOk:false,jumpAt:null,shards:0,melody:false,climax:false,crashed:false,crashedAt:0,recover:false,bar:0,goal:false,jumpStep:0,lastJump:-9,lastEnd:null,warm:[],
 macro:null,child:null,attempt:0,portal:null,surgeAt:-9,itemSeen:new WeakMap(),itemUsed:new WeakSet(),stats:{bars:0,notes:0,ducks:0,rebuilds:0,goals:0,sessions:0,resyncs:0,gates:0,surges:0,maxVoices:0,transitions:[],sections:[]}};
const now=()=>clockOverride?clockOverride():(root.performance?.now?.()??Date.now())/1000;
const hostOf=()=>bus?.host||null;
function hidden(){try{return !!root.document?.hidden}catch(_){return false}}
function supported(){return !!(root.AudioContext||root.webkitAudioContext)}
function sectionOf(run){return run.openingCourse?clamp(run.mapChanges|0,0,2):((run.mapChanges|0)%3)}
function progressOf(run){
 if(run.openingCourse){const O=root.MongyuOpening;if(!O)return 0;
  if(run.practice){const end=O.OBSTACLES[Math.max(0,(run.endIndex|0)-1)];const start=O.OBSTACLES[run.firstIndex|0];return end&&start?clamp((run.distance-(start.at-120))/(end.at+30-(start.at-120)),0,1):0}
  return clamp(run.distance/O.FINISH,0,1)}
 try{return Number(run.status?.().progress)||0}catch(_){return 0}
}
function desired(run){
 const melody=M.melody||M.shards>=3||(run.perfectStreak|0)>=2,climax=M.climax||progressOf(run)>=.8;
 if(melody)M.melody=true;if(climax)M.climax=true;
 let level=1;if(M.jumpOk||M.melody||M.climax)level=2;if(M.melody||M.climax)level=3;if(M.climax)level=4;
 if(run.boss)level=Math.max(level,2);
 return M.crashed?1:level;
}
/* Fever state of the run (NORMAL, FLOW, LUCID, OVERLOAD, RECOVERY) from setContext({fever}), run.fever.state / run.feverState or the act child; case-insensitive. */
function feverOf(run){
 const v=override?.fever??run?.fever?.state??run?.fever??run?.feverState??run?.child?.fever?.state??run?.child?.feverState;
 const k=typeof v==='string'?v.toUpperCase():null;return k&&FEVER_LEVEL[k]?k:null;
}
function surgeActive(){return M.surgeAt>0&&session&&session.ctx.currentTime<M.surgeAt+4}
/* Road pieces: the macro section follows the course progress, one section per bar at most, never shorter than MIN_BARS. */
function stepMacro(run,S){
 const p=progressOf(run),want=sectionAtProgress(p);
 if(!M.macro){M.macro={name:want,bars:0,fresh:true};}
 else{
  const i=SECTIONS.indexOf(M.macro.name),w=SECTIONS.indexOf(want);
  if(w>i&&M.macro.bars>=MIN_BARS[M.macro.name]){M.macro={name:SECTIONS[i+1],bars:0,fresh:true}}
 }
 const m=M.macro,barIn=m.bars,newSection=m.fresh;m.fresh=false;m.bars++;
 const melody=M.melody||M.shards>=3||(run.perfectStreak|0)>=2;if(melody)M.melody=true;
 let level=M.crashed?1:tripLevel(m.name,{jumpOk:M.jumpOk,melody:M.melody,surge:surgeActive(),progress:p});
 const fever=feverOf(run);M.fever=fever;if(fever&&!M.crashed){if(fever==='RECOVERY')level=Math.min(level,2);else level=Math.max(level,FEVER_LEVEL[fever])}
 if(run.boss)level=Math.max(level,2);
 const ct=S.ctx.currentTime;let rate=M.rate||0;if(M.pHist&&ct>M.pHist.t+.5){rate=Math.max(0,(p-M.pHist.p)/(ct-M.pHist.t));M.rate=rate}if(!M.pHist||ct>M.pHist.t+.5)M.pHist={p,t:ct};
 const next=m.bars>=MIN_BARS[m.name]&&SECTIONS.indexOf(sectionAtProgress(p+rate*S.barDur))>SECTIONS.indexOf(m.name);
 const energy=clamp(((run.perfectStreak|0)+M.shards*.4)/10+(M.fever==='OVERLOAD'?.4:M.fever==='LUCID'?.2:0),0,1);
 return {section:m.name,barIn,newSection,level,energy,dropout:!M.crashed&&isDropout(m.name,barIn),swellNext:next,progress:p};
}
function beginRun(run){
 const ctx=contextOf(run,override),recentCrash=M.lastEnd&&M.lastEnd.kind==='crash'&&now()-M.lastEnd.at<45&&M.chapter===ctx.piece;
 endSession(0);
 Object.assign(M,{run,ctx,chapter:ctx.piece,section:sectionOf(run),jumpOk:false,jumpAt:null,shards:0,melody:false,climax:false,crashed:false,recover:false,bar:0,goal:false,jumpStep:0,lastJump:-9,rebuildStart:!!recentCrash,macro:null,child:null,attempt:0,portal:null,surgeAt:-9,pHist:null,rate:0,voiceWarm:null,voiceQueue:null});
 M.cfg=ctx.cfg;M.applied=M.section;queueWarm();
}
function endRun(){endSession(.25);M.run=null;M.chapter=null;M.cfg=null;M.ctx=null;M.warm=[];M.macro=null}
function endSession(fade){
 if(session){M.bar=session.nextBar;disposeSession(session,fade);if(fade>0)lingering.push(session);session=null}
 if(timer){clearInterval(timer);timer=null}
}
function crash(){
 M.crashed=true;M.crashedAt=now();M.recover=false;M.jumpStep=0;M.lastJump=-9;M.jumpAt=null;M.stats.ducks++;
 if(session&&!session.goal)duck(session,session.ctx.currentTime);
}
function goal(){
 if(M.goal)return;M.goal=true;M.stats.goals++;
 if(session){const S=session,t=S.ctx.currentTime,eighth=S.spb/2,k=Math.ceil((t+.03-S.t0)/eighth);goalChord(S,Math.max(t+.03,S.t0+k*eighth),M.applied)}
}
function ensureSession(host,run){
 const audio=host.audio?.();if(!audio||!audio.context||!audio.music){endSession(0);return}resources(audio.context).live=true;
 const s=host.settings?.()||{};if(s.mute||Number(s.musicVolume)<=0){endSession(0);return}
 const ctx=audio.context;if(session&&session.ctx!==ctx)endSession(0);
 if(!session){
  M.macro=null;M.ctx=contextOf(run,override);M.cfg=M.ctx.cfg;
  session=createSession(ctx,audio.music,M.cfg,{bar0:M.bar,fadeIn:M.bar>0?.5:1.4,closed:M.rebuildStart||M.crashed,section:M.applied,bpm:M.ctx?.road?M.ctx.bpm:undefined});
  if(M.rebuildStart){M.rebuildStart=false;rebuild(session,session.t0);M.stats.rebuilds++}
  M.stats.sessions++;M.child=run.child||null;M.attempt=run.attempt|0;M.portal=run.portal||null;
  if(!timer&&typeof setInterval==='function'){timer=setInterval(update,45);timer?.unref?.()}
 }
 if(ctx.state==='suspended'&&now()-lastResume>.5){lastResume=now();try{Promise.resolve(ctx.resume()).catch(()=>{})}catch(_){}}
}
/* A new act (aurora gate), a retry or a tempo change: keep the music going and re-lock the beat grid to the act's own clock (its time 0 = next gate half-open). */
function resync(run,reason){
 const S=session;if(!S||S.goal||!M.cfg?.road)return;
 const ctx=contextOf(run,override),t=S.ctx.currentTime,p=run.portal;
 let swap;if(p&&!p.swapped)swap=t+Math.max(0,p.duration*.5-p.age);else swap=t-Math.max(0,Number(run.child?.time)||0);
 const spb=60/ctx.bpm,k=Math.ceil((S.nextTime-swap)/spb-1e-6),grid=swap+k*spb;
 if(grid<S.nextTime-1e-6||grid>S.nextTime+spb*1.01)return;
 const gap=grid-S.nextTime;
 S.nextTime=grid;S.nextBpm=ctx.bpm;M.ctx=ctx;M.stats.resyncs++;if(reason==='gate')M.stats.gates++;
 if(reason==='gate'||gap>.05)gateSwell(S,grid,t);
}
function pump(run){
 const S=session;if(!S||S.goal)return;
 while(S.nextTime<S.ctx.currentTime+LOOKAHEAD){
  if(M.crashed&&M.recover){M.crashed=false;M.recover=false;if(S.ducked){rebuild(S,S.nextTime);M.stats.rebuilds++}}
  if(M.section!==M.applied)M.applied=M.section;
  let out;
  if(M.cfg.road){
   const st=stepMacro(run,S),want=st.level,level=want<S.level?want:Math.min(want,S.level+1)||1,before=S.level;
   const actType=run.acts?.[run.actIndex]?.type||'',dir=override?.shep===undefined?shepDirOf(actType):override.shep;
   const portalOpen=run.portal&&!run.portal.swapped;
   st.shepDir=portalOpen&&dir===0?S.shepDir:dir;S.shepDir=st.shepDir;
   st.shep=st.shepDir&&!M.crashed?(S.level>=1?.9:0):0;st.bpm=S.nextBpm||M.ctx?.bpm||S.cfg.bpm;
   out=scheduleBar(S,level,M.applied,st);
   if(level!==before)M.stats.transitions.push({bar:out.bar,time:+out.time.toFixed(3),from:before,to:level,section:st.section});
   if(st.newSection)M.stats.sections.push({bar:out.bar,time:+out.time.toFixed(3),section:st.section,progress:+st.progress.toFixed(3)});
   if(M.stats.sections.length>64)M.stats.sections.shift();
  }else{
   const want=desired(run),level=want<S.level?want:Math.min(want,S.level+1)||1,before=S.level;
   out=scheduleBar(S,level,M.applied);
   if(level!==before)M.stats.transitions.push({bar:out.bar,time:+out.time.toFixed(3),from:before,to:level});
  }
  M.stats.bars++;
  if(M.stats.transitions.length>64)M.stats.transitions.shift();
 }
 M.stats.notes=S.scheduled;const v=voicesAt(S,S.ctx.currentTime);M.stats.maxVoices=Math.max(M.stats.maxVoices,v,S.peakVoices);
}
/* Watch the first-class run fields a CourseRun exposes (child, attempt, portal) without needing any hook inside course-run.js. */
function watchRun(run){
 if(!M.cfg?.road||!session)return;
 const child=run.child||null,attempt=run.attempt|0,portal=run.portal||null;
 if(portal&&portal!==M.portal){M.portal=portal;resync(run,'gate')}
 else if(child&&child!==M.child){resync(run,portal?'gate':'act')}
 else if(attempt!==M.attempt&&session)resync(run,'retry');
 M.child=child;M.attempt=attempt;if(!portal)M.portal=null;
}
function update(){
 for(const S of lingering)if(!S.done&&(S.ctx.currentTime>=S.killAt||S.ctx.state==='closed')){S.done=true;S.kill()}
 lingering=lingering.filter(S=>!S.done);
 if(!enabled)return;
 if(session)resources(session.ctx).spent=0;
 const host=hostOf(),run=host?.activeRun?.();
 if(!run){if(M.run)endRun();return}
 if(run!==M.run)beginRun(run);
 M.section=sectionOf(run);
 if(M.jumpAt!==null&&now()-M.jumpAt>.7){M.jumpOk=true;M.jumpAt=null}
 if(M.crashed&&!M.recover&&run.state==='play'&&!run.outro&&run.recoverAt===undefined&&now()-M.crashedAt>.5)M.recover=true;
 if(!M.goal&&run.outro?.kind==='clear')goal();
 if(run.state==='play'&&!hidden()){ensureSession(host,run);watchRun(run);if(session){const it=run.child?.lastItem;if(it&&!M.itemSeen.has(it))M.itemSeen.set(it,now());pump(run)}}
 else if(session)endSession(['clear','fail'].includes(run.state)?(M.goal?4:.35):0);
 warmStep(host);
}
function onEvent({run,event}){
 if(!enabled)return;const host=hostOf();if(!run||run!==host?.activeRun?.())return;
 if(run!==M.run)beginRun(run);
 switch(event){
  case 'jump':{const t=now();M.jumpStep=t-M.lastJump<2.4?Math.min(5,M.jumpStep+1):0;M.lastJump=t;if(!run.openingCourse)M.jumpAt=t;else M.pendingLand=true;break}
  case 'land':if(M.pendingLand&&!M.crashed)M.jumpOk=true;M.pendingLand=false;break;
  case 'pass':case 'perfect':M.shards++;M.jumpOk=true;break;
  case 'kick':case 'morph':case 'boss-damage':case 'room-clear':case 'portal':case 'item':M.shards++;break;
  case 'surge':{M.surgeAt=session?session.ctx.currentTime:-9;M.stats.surges++;
   if(session&&!session.goal){const S=session,t=S.ctx.currentTime;let at=api.nextBeatTime(.5);if(at===null)at=t+.05;else if(at<t+.03)at+=S.spb/2;surgeLayer(S,at,4)}break}
  case 'goal-qualified':M.climax=true;break;
  case 'hit':M.pendingLand=false;crash();break;
  case 'pause':endSession(0);break;
  case 'fail':M.lastEnd={kind:'crash',at:now()};endSession(.35);break;
  case 'clear':goal();M.lastEnd={kind:'clear',at:now()};endSession(4);break;
 }
 if(session&&['item','perfect','portal','shield-break','surge','pass'].includes(event))cueDuck(session,session.ctx.currentTime+.005,event==='surge'?.25:.4);
 if(['jump','land','pass','perfect','hit','portal','item'].includes(event))update();
}
/* Pre-render the tuned effect buffers for the current key a few per frame so the first jump never stalls. Voices (plucks, bowed notes, drums) follow. */
function queueWarm(){
 const kinds=[['jump',0],['land',0],['pass',0],['chain',0],['hit',0],['impact-glass',0],['impact-chime-fall',0],['perfect-chime',0],['square-corner',0],['jump',1],['jump',2],['jump',3],['pass',1],['pass',2],['chain',1],['chain',2],['jump',4],['jump',5],['pass',3],['pass',4],['pass',5],['aurora-shimmer',0],['result-clear',0],
  ['square-room','item:bubble'],['aurora-shimmer','item:time'],['chain','item:feather'],['perfect-chime','item:star'],['square-portal','item:surge'],['impact-glass','item:shield-break']];
 M.warm=kinds.map(([kind,step])=>typeof step==='string'?{kind,step:0,variant:step}:{kind,step});
}
function warmVoices(host){
 const audio=host?.audio?.(),cfg=M.cfg;if(!audio?.context||!cfg||M.voiceWarm===cfg)return;M.voiceWarm=cfg;
 const ctx=audio.context,list=[];
 for(const loop of cfg.road?[0,1,2,3]:[0,1,2])for(const v of [0,1])for(const e of phrase(cfg,loop,v)){
  if(e.inst==='gayageum')list.push(()=>pluckBuffer(ctx,'gayageum',e.midi));else if(e.inst==='haegeum')list.push(()=>bowBuffer(ctx,e.midi));
 }
 if(cfg.road){const key=keyOf(cfg,0);for(const n of ['gung','deok','kung','buk','tick','tock'])list.push(()=>drumBuffer(ctx,n,key.tonic));for(let m=55;m<=79;m++)if(key.scale.includes(mod(m-key.tonic,12)))list.push(()=>pluckBuffer(ctx,'arp',m))}
 M.voiceQueue=list;
}
function warmStep(host){
 if(M.warm.length&&root.MongyuSFX?.tunedBuffer){
  const audio=host?.audio?.();if(audio?.context){const item=M.warm.shift(),t=tuning(item.kind,item.step,item.variant||'');if(t)try{root.MongyuSFX.tunedBuffer(audio.context,item.kind,t)}catch(_){}}
  return;
 }
 const ctx=host?.audio?.()?.context;
 if(ctx){const r=resources(ctx);if(r.deferred?.size){const [id,[rate,make]]=r.deferred.entries().next().value;r.deferred.delete(id);try{cached(ctx,id,rate,make,true)}catch(_){}return}}
 if(!M.voiceQueue||!M.voiceQueue.length){warmVoices(host);return}
 try{M.voiceQueue.shift()()}catch(_){}
}
function tuning(kind,step,variant){
 if(!M.cfg)return null;const key=keyOf(M.cfg,M.cfg.road?(session?.loop??0):M.applied);
 return {tonic:key.tonic,third:key.third,scale:key.scale,step,variant,key:key.name};
}
/* Effects for the pickups: the item scripts call host.sound('square-room' | 'aurora-shimmer' | 'chain' | 'perfect-chime' | 'square-portal' | 'impact-glass')
   right after setting run.lastItem, so a fresh, not yet voiced lastItem of the matching kind picks the item's own tone. */
const ITEM_OF=Object.freeze({'square-room':'bubble','aurora-shimmer':'time',chain:'feather','perfect-chime':'memory-star','square-portal':'surge','impact-glass':'shield-break'});
function itemVariant(kind){
 const want=ITEM_OF[kind];if(!want)return '';const r=M.run,it=r?.child?.lastItem||r?.lastItem;
 if(!it||M.itemUsed.has(it)||it.kind!==want)return '';
 const seen=M.itemSeen.get(it);if(seen!==undefined&&now()-seen>.3)return '';
 M.itemUsed.add(it);return 'item:'+(want==='memory-star'?'star':want);
}
function sfxTuning(kind){
 if(!enabled||!M.run||M.run!==hostOf()?.activeRun?.()||!M.cfg)return null;
 const step=kind==='jump'?M.jumpStep:kind==='pass'||kind==='chain'?Math.max(0,M.shards-1):0;
 const v=M.run.state==='fail'&&kind==='hit'?'fail':itemVariant(kind);
 return tuning(kind,v.startsWith('item:')?0:step,v);
}
if(enabled&&bus){
 bus.claimMusic(run=>!!run&&supported()&&(run.openingCourse||!!run.slot||isRoadRun(run)));
 bus.on('run-event',onEvent);bus.on('frame',update);
 bus.on('attach',host=>{try{host.refreshMusic?.()}catch(_){}});
 if(typeof root.document?.addEventListener==='function')root.document.addEventListener('visibilitychange',()=>{if(hidden())endSession(0);else update()});
}

/* Offline render (tests/tools). piece: 'opening' | 1..10 | 'r1'..'r5'. For road pieces plan:true plays the whole macro plan (intro, A, B, climax, resolve)
   with stems following the section, then the goal chord; shep=+1/-1 turns the Shepard bank on throughout. */
async function renderOffline({chapter='opening',level=4,seconds=20,section=0,sampleRate=44100,crashAt=null,rebuildAt=null,goalAt=null,only=null,plan=false,shep=0,bpm=null,course=null,energy=.5,melody=true,fromBar=0,bars=null}={}){
 const Offline=root.OfflineAudioContext||root.webkitOfflineAudioContext;if(!Offline)throw Error('OfflineAudioContext unavailable');
 const ctx=new Offline(2,Math.ceil(seconds*sampleRate),sampleRate),cfg=arrangement(chapter,course),S=createSession(ctx,ctx.destination,cfg,{start:.05,fadeIn:.02,section,bpm:bpm||undefined});if(Array.isArray(only))S.only=only;
 S.key=keyOf(cfg,cfg.road?0:section);
 const marks={crash:crashAt,rebuild:rebuildAt,goal:goalAt},done={};let crashed=false,idx=0;const marks_plan=cfg.road?macroPlan():null;let planned=0;
 const sections=[],clk0=clock();idx=fromBar;let rendered=0;
 while(S.nextTime<seconds){
  for(const k of ['crash','rebuild','goal'])if(marks[k]!==null&&!done[k]&&marks[k]<=S.nextTime-LOOKAHEAD*.5){done[k]=true;
   if(k==='crash'){duck(S,marks[k]);crashed=true}else if(k==='rebuild'){crashed=false}else goalChord(S,marks[k],section)}
  if(done.rebuild&&S.ducked&&!crashed)rebuild(S,S.nextTime);
  if(S.goal)break;
  if(cfg.road){
   let st;
   if(plan){
    if(idx>=marks_plan.length||(bars!==null&&rendered>=bars)){goalChord(S,S.nextTime,0);break}
    const m=marks_plan[idx],progress=Math.min(1,(idx+.5)/marks_plan.length);
    st={section:m.section,barIn:m.barIn,newSection:m.newSection,level:crashed?1:tripLevel(m.section,{jumpOk:true,melody,progress}),energy:m.section==='climax'?1:energy,dropout:isDropout(m.section,m.barIn),swellNext:false,progress};
    const nxt=marks_plan[idx+1];st.swellNext=!!nxt&&nxt.newSection;
    if(m.newSection||rendered===0)sections.push({section:m.section,time:+S.nextTime.toFixed(2),bar:idx});idx++;rendered++;
   }else{
    const sec=SECTIONS[clamp(section,0,4)];st={section:sec,barIn:idx++,newSection:false,level:crashed?1:level,energy,dropout:false,swellNext:false,progress:.5};
   }
   st.shepDir=shep;st.shep=shep?.9:0;st.bpm=bpm||cfg.bpm;
   scheduleBar(S,st.level,0,st);
  }else scheduleBar(S,crashed?1:level,section);
 }
 for(const k of ['crash','goal'])if(marks[k]!==null&&!done[k]){if(k==='crash')duck(S,marks[k]);else goalChord(S,marks[k],section)}
 const clk1=clock(),buffer=await ctx.startRendering();return {buffer,ms:{schedule:Math.round(clk1-clk0),render:Math.round(clock()-clk1)},notes:S.scheduled,peakVoices:S.peakVoices,sections,bars:S.nextBar,spb:S.spb,cfg:{bpm:S.bpm,key:keyOf(cfg,0).name,title:cfg.title}};
}
function inspect(){
 const S=session;
 return {enabled,active:!!S,chapter:M.chapter,piece:M.ctx?.piece||null,road:!!M.cfg?.road,course:M.ctx?.course||null,act:M.ctx?.act||'',key:M.cfg?keyOf(M.cfg,S?.loop??M.applied).name:null,bpm:S?S.bpm:M.cfg?.bpm||0,section:M.applied,macro:M.macro?{name:M.macro.name,bars:M.macro.bars}:null,
  level:S?S.level:0,ducked:!!S?.ducked,goal:M.goal,jumpOk:M.jumpOk,shards:M.shards,melody:M.melody,climax:M.climax,crashed:M.crashed,bar:S?S.nextBar:M.bar,
  voices:S?voicesAt(S,S.ctx.currentTime):0,scheduled:S?S.scheduled:0,duckHz:S?S.duck.frequency.value:0,shepDir:S?.shepDir||0,fever:M.fever||null,surging:surgeActive(),override:override?{...override}:null,stats:JSON.parse(JSON.stringify(M.stats))};
}
const api={
 enabled,ARRANGEMENTS,TRIPS,SCALES,CHORDS,SECTIONS,MAX_VOICES,SHEP,arrangement,chapterOf,roadChapterOf,contextOf,isRoadRun,keyOf,chordAt,phrase,barEvents,tripBarEvents,tripLevel,macroPlan,sectionAtProgress,isDropout,goalEvents,safe,
 FEVER_LEVEL,BLUE_KEYS,roadPieceOf,shepWindow,shepFreq,shepLoudness,shepDirOf,registerShepardAct,renderOffline,inspect,sfxTuning,update,
 /* Steer the music without course-run.js cooperation: setContext({chapter:1..5, trip:'violet'.., course:'c7', act:'penrose', bpm:104, shep:-1|0|1, piece:'r3'}). */
 /* fever:'NORMAL'|'FLOW'|'LUCID'|'OVERLOAD'|'RECOVERY' maps onto the stems (1,2,3,4,2). */
 setContext(ctx){override=ctx&&typeof ctx==='object'?{...ctx}:null;if(M.run){const c=contextOf(M.run,override);M.ctx=c;if(c.piece!==M.chapter||c.cfg!==M.cfg){M.chapter=c.piece;M.cfg=c.cfg;M.macro=null;if(session)endSession(.25)}}return override},
 clearContext(){return api.setContext(null)},
 getContext(){return M.ctx?{piece:M.ctx.piece,course:M.ctx.course,act:M.ctx.act,bpm:M.ctx.bpm,trip:M.ctx.trip,road:M.ctx.road,shepDir:M.ctx.shepDir}:null},
 get intensity(){return session&&!session.stopped?(session.goal?0:session.level):0},
 get bpm(){return session?session.bpm:M.cfg?.bpm||0},
 get key(){return M.cfg?keyOf(M.cfg,session?.loop??M.applied).name:null},
 get secondsPerBeat(){return session?session.spb:M.cfg?60/M.cfg.bpm:0},
 get section(){return M.macro?M.macro.name:null},
 /* Current musical position in beats (fractional) on the AudioContext clock; 0 when idle. Exact across tempo changes (anchored per bar). */
 beat(){const S=session;if(!S||S.stopped)return 0;const t=S.ctx.currentTime;let a=S.anchors[0];for(const x of S.anchors)if(x.time<=t)a=x;return Math.max(0,a.beat+(t-a.time)/a.spb)},
 /* 0..1 position inside the current beat (0 = on the beat): lets the visuals pulse in lock step with the heartbeat. */
 beatPhase(){const b=api.beat();return b-Math.floor(b)},
 /* Heartbeat-shaped pulse 0..1 (sharp attack on the beat, a smaller second thump half a beat later): visual layers can scale by 1+0.06*pulse(). */
 pulse(){const p=api.beatPhase();return Math.max(Math.exp(-p*7),.55*Math.exp(-Math.abs(p-.5)*14))},
 /* Next beat (or bar, unit=4) boundary in AudioContext seconds; null when idle. */
 nextBeatTime(unit=1){const S=session;if(!S||S.stopped)return null;const t=S.ctx.currentTime;let a=S.anchors[0];for(const x of S.anchors)if(x.time<=t)a=x;const b=(t-a.time)/a.spb+a.beat;return a.time+(Math.ceil(b/unit+1e-9)*unit-a.beat)*a.spb},
 /* Level-design helper: world units per beat for a run speed (e.g. 1st memory speed 122 → 73.2 units at 100 BPM). */
 beatDistance(speed,chapter){const cfg=chapter!==undefined?arrangement(chapter):M.cfg||arrangement('opening');return speed*60/cfg.bpm},
 _setClock(fn){clockOverride=typeof fn==='function'?fn:null},
 _reset(){endSession(0);for(const S of lingering)S.kill?.();lingering=[];override=null;Object.assign(M,{run:null,chapter:null,cfg:null,ctx:null,section:0,applied:0,lastEnd:null,warm:[],macro:null,voiceWarm:null,voiceQueue:null,stats:{bars:0,notes:0,ducks:0,rebuilds:0,goals:0,sessions:0,resyncs:0,gates:0,surges:0,maxVoices:0,transitions:[],sections:[]}})},
 _session:()=>session,
 _internals:{cueDuck,createSession,scheduleBar,play,duck,goalChord,rebuild,surgeLayer,shepStep,resync,voicesAt,peakIn,admit,stepMacro}
};
Object.freeze(api);
root.MongyuAdaptiveMusic=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
