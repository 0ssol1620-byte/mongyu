/* R38 clean-room collection: factual rule ledger + explicitly authored presentation.
 * No original binary, dialogue, image, audio, or code is included.
 * Sequential gates and simulated device events are our adaptation, not recovered behavior.
 */
(function(root){'use strict';
const VERSION=2,SAVE_KEY='mongyu.r38.restoration.v2',MAX_SAVE_BYTES=262144;
const sources=Object.freeze({
 interview:{url:'https://www.gamemeca.com/view.php?gid=65877',type:'primary',supports:'100 collection entries; Free Play after all entries'},
 postmortem:{url:'https://www.gamedeveloper.com/game-platforms/-i-nom-3-i-an-advanced-mobile-game-created-with-love',type:'primary-creator',supports:'Knowledge without love, longing, mutual hurt, beloved leaves; relationships and rejection ending'},
 community:{url:'https://namu.moe/w/%EB%86%883',type:'secondary',supports:'Slot positions and collection condition descriptions; provisional'},
 footage:{url:'https://www.youtube.com/watch?v=CoOo9UDeFtg',type:'observed-gameplay',supports:'Selected visible board, rule cards and event categories; see evidence ledger'}
});
const characters=Object.freeze([
 {id:'walker',name:'길',role:'옛 연인을 잊지 못하는 주인공',sourceRole:'protagonist longs for former beloved; dates a different woman at 69; separates at 87; reconciliation refused at 100',unlockSlot:1,color:'#70d8d0',description:'새로운 만남 뒤에도 옛 연인을 그리워합니다. 87번에서 여울과 헤어지고 혼자 달립니다.'},
 {id:'dog',name:'솔',role:'뒤따르는 개',sourceRole:'dog follows the protagonist',unlockSlot:22,color:'#ffcb71',description:'주인공의 뒤를 따라 달리는 동행입니다.'},
 {id:'elder',name:'담',role:'주인공을 업는 할머니',sourceRole:'grandmother carries the protagonist',unlockSlot:47,color:'#f0a8c6',description:'지친 주인공을 업고 길을 이어 갑니다.'},
 {id:'woman',name:'여울',role:'새로 만난 연인',sourceRole:'new girlfriend, distinct from former beloved at 99/100; offers to run at 69; anticipates and accepts breakup at 87',unlockSlot:69,color:'#b7b2ff',description:'길에게 호감을 보이고 대신 달려 줍니다. 길의 마음이 다른 곳에 있음을 알고 이별을 받아들입니다.'}
].map(Object.freeze));
const story=Object.freeze({
 1:['처음 보는 곳에 길이 서 있었다. 여기가 어디인지 짐작할 수 없었다.','가만히 있어도 답은 나오지 않았다. 길은 일단 달려 보기로 했다.'],
 5:['눈앞의 풍경이 믿기지 않아 길은 자기 감각을 의심했다.','어디를 보아도 네모였다. 낯설지만 눈을 떼기 어려운 세계였다.'],
 13:['아름다운 네모들이 다가와 길을 다치게 했다.','보기 좋다는 이유로 마음을 놓을 수는 없었다. 길은 아픈 곳을 추슬렀다.'],
 16:['아름답다가도 가까이 가면 아픈 네모들. 길에게 익숙한 감정이었다.','헤어진 연인을 떠올렸다. 좋았던 기억과 그때의 상처가 함께 돌아왔다.'],
 24:['그 사람은 지금 어디에서 무엇을 하며 지낼까. 길은 자꾸 궁금해졌다.','헤어진 뒤에도 마음은 소식을 기다렸다. 곁의 솔과 달리면서도 그 생각이 났다.'],
 34:['길은 곁을 따르는 솔을 보다가 또 옛 연인을 떠올렸다.','함께 있던 때라면 이 작은 친구를 보고 어떤 표정을 지었을까.'],
 39:['게임 속을 뛰어다닌 지도 꽤 되었다. 길은 지나온 시간을 헤아렸다.','계속 달리는 일 말고 연애도 하고 싶었다. 누군가 곁에 있기를 바랐다.'],
 49:['담을 만난 뒤로 길의 마음이 조금 누그러졌다.','누군가의 친절을 받으니 자신도 남에게 다정하게 대하고 싶어졌다.'],
 52:['솔도 만나고 담의 도움도 받았다. 낯선 곳에도 함께할 사람이 있었다.','길은 이제 연인이 될 사람을 만나면 좋겠다고 생각했다.'],
 55:['길은 옛 연인에게 연락해 볼까 망설였다.','메시지를 막아 둔 상태가 아직 그대로일까. 보내기도 전에 마음이 움츠러들었다.'],
 62:['마음을 내어 연락해 보았지만 여전히 닿지 않았다.','길은 답을 기다리다 다시 달렸다. 잊은 줄 알았던 그리움만 또렷해졌다.'],
 73:['여울과 연인이 되었다는 사실에 길은 들떠 있었다.','멋진 사람을 새로 만났다. 이번에는 좋은 시간을 보낼 수 있을 것 같았다.'],
 80:['여울이 곁에 있어도 길은 헤어진 연인을 떠올렸다.','새로 시작한 마음만으로 지난 사랑이 지워지지는 않았다.'],
 84:['다른 사람을 그리워하면서 여울의 곁에 계속 있을 수는 없었다.','길은 옛 연인을 잊지 못했다는 사실을 인정하고 여울에게 이별을 말하기로 했다.'],
 92:['길은 혼자 달리며 같은 사람을 거듭 그리워했다.','멀리 와도 생각은 그 사람에게 돌아갔다. 보고 싶다는 마음이 좀처럼 가시지 않았다.'],
 96:['길은 살아가다 보면 언젠가는 다시 만날 수 있지 않을까 생각했다.','확신할 수는 없었다. 그래도 그 가능성을 마음에 두고 달렸다.'],
 100:['길은 마침내 옛 연인을 마주했다. 두 사람은 자신도 아팠지만 상대에게도 상처를 주었다는 것을 알게 되었다.','길이 다시 함께해 볼 수 없겠느냐고 물었다. 그녀는 서로에게 또 상처가 될 수 있다며 돌아오기를 거절했다.','두 사람은 작별을 나누었다. 서로를 아프게 한 사랑은 그렇게 끝났다. 길의 이야기를 따라온 당신에게도 마지막 인사를 남긴다.']
});
// Each token is an independently researched collection slot, not a generated level.
const ledger=[
 'S','T','R300','C600','S','damage190:210','R400','Bthrow','D490:510','R500',
 'H3','R600','S','C1500','R700','S','V','R800','C3000','Bdodge',
 'R900','Edog','Z','S','N250','K1','R1000','Ilevitate','C5000','R1000',
 'Bthrow','A','M4','S','N300','Pdamage190:210','K1','Bthrow','S','C7000',
 'Iringtone','R1000','PD490:510','R1000','Bdodge','C8000','Eelder','CALL','S','M4',
 'C10000','S','N300','PH3','S','Irest','R1100','Bkick','D990:1010','C12000',
 'R1100','S','K1','C13000','Irest','Bdodge','M5','R1100','Ewoman','OH3',
 'N500','R1100','S','PV','C15000','M5','Bkick','PZ','PK1','S',
 'Irest','R1200','OD990:1010','S','R1200','N500','Ewalker','R1200','PCALL','Bthrow',
 'N500','S','C20000','R1500','OK2','S','Qnoon','Qmidnight','Bkick','S'
];
// R73: recovered BSDATA header HP, linked by the category ordinal to slots.
const BOSS_TARGETS=Object.freeze({8:10,20:12,31:18,38:10,45:15,58:10,66:25,77:18,90:15,99:20});
const MECHANICS_VERSION=75;
const slotId=n=>'r38-'+String(n).padStart(3,'0');
const titles={1:'낯선 곳의 첫 달리기',5:'네모로 된 세계',13:'아름다워도 아픈',16:'떠오르는 옛 연인',24:'그 사람의 안부',28:'잠깐의 공중 산책',34:'솔을 보다가',39:'연애도 하고 싶은 길',41:'달아난 벨소리',49:'친절을 받은 마음',52:'다음 만남을 바라며',55:'보내지 못한 연락',56:'숨 한 번',62:'닿지 않은 연락',65:'두 번째 쉼',73:'새로운 연애',80:'아직 잊지 못한 사람',81:'마지막 쉼',84:'이별을 말하기로',92:'거듭되는 그리움',96:'언젠가 다시 만날까',100:'돌아오지 않는 사랑'};
const bossTitles={8:'작은 햇살',20:'거인의 발걸음',31:'외계인',38:'돌아오는 사각',45:'매달린 사슬',58:'돌아가는 가지',66:'밀려오는 물결',77:'교차하는 두 팔',90:'마지막 반사',99:'닫힌 모서리'};
function ruleFrom(token){
 if(token==='C20000+OK2')return {type:'combined',totalScore:20000,kicks:2,period:'am'};
 let period=null;if(/^[PO]/.test(token)){period=token[0]==='P'?'pm':'am';token=token.slice(1)}
 let rule;
 if(token==='S')rule={type:'story'};
 else if(token==='T')rule={type:'tutorial',target:4};
 else if(token.startsWith('B'))rule={type:'boss',family:token.slice(1),target:6};
 else if(token.startsWith('E'))rule={type:'character',characterId:token.slice(1)};
 else if(token.startsWith('I'))rule={type:'interlude',theme:token.slice(1),target:3};
 else if(token.startsWith('Q'))rule={type:'clock-death',period:token.slice(1),min:0,max:2000000};
 else if(token==='CALL')rule={type:'call',target:2};
 else if(['V','Z','A'].includes(token))rule={type:'setting',setting:{V:'speed',Z:'vibration',A:'sound'}[token]};
 else if(token.startsWith('damage')){const a=token.slice(6).split(':').map(Number);rule={type:'damage-range',min:a[0],max:a[1]}}
 else {const type={R:'run-score',C:'cumulative-score',D:'death-range',H:'repeated-damage',N:'flawless-score',K:'kick',M:'map-change'}[token[0]],a=token.slice(1).split(':').map(Number);rule=type==='death-range'?{type,min:a[0],max:a[1]}:{type,target:a[0]}}
 if(period)rule.period=period;return rule;
}
const periodText=r=>r.period?({am:'오전',pm:'오후',noon:'정오',midnight:'자정'}[r.period]+' 시간대에 '):'';
function objectiveTitle(r){
 const period=r.period?({am:'오전',pm:'오후',noon:'정오',midnight:'자정'}[r.period]+' · '):'';
 switch(r.type){
  case'tutorial':return '네 벽의 첫걸음';
  case'run-score':return period+r.target+'점의 길';
  case'cumulative-score':return '쌓인 '+r.target.toLocaleString('en-US')+'점';
  case'death-range':return period+r.min+'–'+r.max+'점의 끝';
  case'damage-range':return period+r.min+'–'+r.max+'점의 충돌';
  case'repeated-damage':return period+'같은 충돌 '+r.target+'회';
  case'flawless-score':return '상처 없이 '+r.target+'점';
  case'kick':return period+'공중 차기 '+r.target+'회';
  case'map-change':return '벽의 변화 '+r.target+'번';
  case'setting':return period+{speed:'속도 바꾸기',vibration:'진동의 박자',sound:'소리 바꾸기'}[r.setting];
  case'call':return period+'두 번 울리는 벨';
  case'character':return {dog:'뒤따르는 솔',elder:'담의 등에 업혀',woman:'여울의 걸음',walker:'다시 혼자'}[r.characterId];
  case'clock-death':return {noon:'정오에 멈춘 걸음',midnight:'자정에 멈춘 걸음'}[r.period];
  case'combined':return period+r.totalScore.toLocaleString('en-US')+'점과 차기 '+r.kicks+'회';
  default:return '잠시 쉬는 길';
 }
}
function instruction(r){const p=periodText(r);switch(r.type){
 case'story':return '마지막 장까지 이야기를 읽으세요.';
 case'tutorial':return '네 벽을 돌아 점프와 낮은 천장 통과를 익히세요.';
 case'boss':return {throw:'표적이 열릴 때 빛을 던져 6회 맞히세요.',dodge:'다가오는 파동을 6회 피하세요.',kick:'뛰어올라 열린 표적을 6회 차세요.'}[r.family];
 case'run-score':return p+'한 번의 달리기에서 '+r.target+'점을 모으세요.';
 case'cumulative-score':return '이 기록의 도전에서 얻은 점수를 합쳐 '+r.target+'점에 도달하세요.';
 case'death-range':return p+r.min+'~'+r.max+'점에서 달리기를 마치세요. 마지막 충돌로 끝나야 합니다.';
 case'damage-range':return p+r.min+'~'+r.max+'점일 때 한 번 부딪히세요. 게임 오버는 필요하지 않습니다.';
 case'repeated-damage':return p+'같은 종류의 장애물에 '+r.target+'번 부딪히세요.';
 case'flawless-score':return '한 번도 부딪히지 않고 '+r.target+'점에 도달하세요.';
 case'kick':return p+'점프 후 공중 차기를 '+r.target+'회 성공하세요.';
 case'map-change':return '벽의 모양이 '+r.target+'번 바뀌는 동안 살아남으세요.';
 case'setting':return p+'설정을 열어 '+{speed:'속도를',vibration:'진동을',sound:'소리를'}[r.setting]+' 한 번 바꾸세요.';

 case'call':return p+'달리다가 앱 안의 모의 전화가 오면 잠시 멈춰 받으세요. 같은 달리기를 이어가면 완료됩니다. 실제 전화는 사용하지 않습니다.';
 case'character':return characters.find(c=>c.id===r.characterId).name+'의 걸음으로 짧은 길을 완주하세요.';
 case'interlude':return {levitate:'몸이 떠오르는 세 장면을 차례로 넘겨 보세요.',ringtone:'벨소리에 반응하는 세 장면을 넘겨 보세요. 소리를 꺼도 진행할 수 있습니다.',rest:'잠시 쉬며 짧은 세 장면을 차례로 읽어 보세요.'}[r.theme];
 case'clock-death':return (r.period==='noon'?'12:00–12:59':'00:00–00:59')+'에 마지막 체력을 잃으면 기록됩니다. 시간 선택에서 모의 체험도 할 수 있습니다.';
 case'combined':return '누적 20,000점을 모은 뒤 오전 시간대에 공중 차기를 2회 성공하세요.';
 default:return ''}}
const encounterInstructions={45:'내려오는 사슬을 뛰어넘으세요. 돌아가는 몸까지 피하며 여섯 번 버티세요.',58:'화면을 튕기며 날아갑니다. 가지가 가까이 올 때 한 번 눌러 여섯 번 받아치세요.',66:'오른쪽에서 떨어져 밀려오는 파동을 넘으며 여섯 번 버티세요.',77:'화면을 튕기며 날아갑니다. 다가오는 팔과 몸을 여섯 번 받아치세요.'};
encounterInstructions[8]='가까운 흑백 탄을 점프로 받아치세요. 공중에 다시 탄이 오면 한 번 더 누르세요. 돌아간 탄이 햇살 윤곽에 여섯 번 닿아야 합니다.';
encounterInstructions[31]='가까운 탄을 점프로 받아치세요. 공중에 다시 탄이 오면 한 번 더 누르세요. 되돌린 탄이 외계인에게 여섯 번 닿아야 합니다.';
encounterInstructions[90]='검은 사각을 받아쳐 보스에게 여섯 번 돌려보내세요. 파란 사각은 일찍 뛰어넘으세요.';
encounterInstructions[99]='하트 안을 날며 경계와 안쪽 사각을 받아치세요. 초록 경계에 팔·다리가 닿아야 체력이 줄어듭니다.';
const observed=new Set([8,17,20,22,23,28,31,32,36,38,45,47,48,58,66,69,77,87,90,93,95,97,98,99,100]);
function originalEvidence(number,rule){return Object.freeze({
 sourceId:number===6?'candidate-and-footage-caption':[93,95].includes(number)?'footage':'community',sourceUrl:number===6?sources.footage.url+'&t=190s':[93,95].includes(number)?sources.footage.url+'&t='+(number===93?5315:5485)+'s':sources.community.url,
 certainty:number===6?'candidate-native-predicate':[93,95].includes(number)?'direct-observed-v1.0.1':observed.has(number)?'secondary-plus-observation':'secondary-provisional',
 conditionFamily:rule.type,slotPosition:number,originalTitle:null,exactTiming:null,lockSemantics:'unknown',
 observationSource:observed.has(number)?'footage':null,observedVersion:[93,95].includes(number)?'V1.0.1':null,observedTimestamp:number===93?'88:35':number===95?'91:25.58':null,
 confirmedThreshold:number===6?Object.freeze({min:190,max:210,event:'damage'}):number===93?20000:number===95?Object.freeze({kick:2,period:'am'}):undefined,
 candidateEvidence:number===6?Object.freeze({jarSha256:'aeadd87840c7b3f1f06548489406dbc0bf833b41de9cdfa3eaf741e832a213c2',table:'GETSKINTABLE.bin',typeCode:28,parameter:1,textPrefixOffset:483752,report:'docs/R73_NATIVE_CONDITIONS.md',authenticity:'unverified-third-party-candidate',runtimePredicate:'native-branch-recovered-inclusive-damage-window'}):null,
 cumulativeScope:rule.type==='cumulative-score'||rule.type==='combined'?'per-slot; directly observed fresh counters at slots 51 and 93 in V1.0.1; generalized to other cumulative slots':null,
 conflict:number===6?'R73 native branch confirms damage at score 190..210 inclusive before the last-life guard. Candidate authenticity and other carrier versions remain unverified.':number===93?'In-game V1.0.1 rule card at 88:35 directly shows cumulative 20000 and current 0/20000. Community lists 18000; historical version difference is possible, not established.':number===95?'In-game V1.0.1 rule card at 91:25.58 shows only AM jump-then-kick twice, without cumulative-score condition. Community adds cumulative 20000; historical/carrier version difference is possible, not established.':null
})}
const slots=Object.freeze(ledger.map((token,index)=>{
 const number=index+1,rule=ruleFrom(token),kind=rule.type==='story'?(number===100?'ending':'story'):rule.type==='boss'?'boss':rule.type==='character'?'character':'condition';
 const physical=!['story','interlude','call'].includes(rule.type),traversal=rule.type==='boss'?rule.family+'-boss':physical?'square-run':null;
 if(rule.type==='boss')rule.target=BOSS_TARGETS[number];
 const title=titles[number]||bossTitles[number]||objectiveTitle(rule);
 if(encounterInstructions[number])encounterInstructions[number]=encounterInstructions[number].replace('여섯 번',rule.target+'번');
 const simulation=rule.period?'clock':rule.type==='call'?'call':rule.type==='setting'?'setting':rule.type==='interlude'?'authored-interlude':null;
 return Object.freeze({id:slotId(number),number,chapter:Math.ceil(number/10),kind,title,instruction:encounterInstructions[number]||(number===38?'가까운 흰 사각을 쳐내 얼굴에 10번 맞히세요. 검은 사각은 점프로 피하세요.':number===20?'낮은 발은 점프, 높은 발은 지상에서 피하며 12번 빈틈을 만드세요.':instruction(rule)),traversal,physical,characterId:number<22?'walker':number<47?'dog':number<69?'elder':number<87?'woman':'walker',ruleId:slotId(number)+':'+rule.type,rule:Object.freeze(rule),requirements:Object.freeze({all:Object.freeze(number===1?[]:[slotId(number-1)])}),pages:Object.freeze(story[number]||[]),original:originalEvidence(number,rule),adaptation:Object.freeze({authored:true,simulation,labels:Object.freeze(['제목·문장·동작은 독자 창작',...(simulation?['기기 조건은 앱 안의 모의 체험']:[])]),sequentialGate:true,attackTiming:'authored',originalMechanicVerified:false,thresholdDecision:number===93?'Uses the directly observed V1.0.1 in-game 20000 threshold; does not generalize to every historical version.':number===95?'Uses the directly observed V1.0.1 in-game AM two-kick condition with no cumulative requirement; does not generalize to every historical/carrier version.':null})});
}));
const getSlot=id=>{const n=typeof id==='number'?id:typeof id==='string'&&/^r38-\d{3}$/.test(id)?Number(id.slice(4)):NaN;return Number.isInteger(n)&&n>=1&&n<=100?slots[n-1]:null};
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const integer=(n,max=2000000)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
function cumulativeTarget(slot){return slot.rule.type==='cumulative-score'?slot.rule.target:slot.rule.type==='combined'?slot.rule.totalScore:0}
function createSave(){return {schema:2,catalogVersion:VERSION,collected:[],records:{},selected:slotId(1),totalScore:0,slotScores:{},attempt:0,events:{},characterId:'walker',pendingUnlock:null}}
// R72 corrects slot 6 from death to damage. Preserve an already earned legacy
// record only when its original failed run also proves damage inside the window.
// Other schema, sequence, attempt and score checks still run below; caller bytes
// are never mutated and new attempts cannot submit the obsolete rule ID.
function normalizedSlotRecord(slot,value){
 const rec=obj(value),legacy='r38-006:death-range';
 if(slot.number!==6||rec.ruleId!==legacy||rec.source!=='run')return rec;
 const old=obj(rec.proof);if(old.ruleId!==legacy||old.state!=='fail'||old.score<190||old.score>210)return rec;
 const proof={...old,ruleId:slot.ruleId};if(!validateResult(slot.id,proof)||!meets(slot,proof,{}))return rec;
 return {...rec,ruleId:slot.ruleId,proof};
}
function normalizeSave(raw){
 const s=createSave();raw=obj(raw);if(raw.schema!==2||raw.catalogVersion!==VERSION)return s;
 s.totalScore=integer(raw.totalScore)?raw.totalScore:0;s.attempt=integer(raw.attempt,1000000)?raw.attempt:0;
 const scores=obj(raw.slotScores);for(const slot of slots){const target=cumulativeTarget(slot);if(target&&integer(scores[slot.id],target))s.slotScores[slot.id]=scores[slot.id]}
 const done=Array.isArray(raw.collected)?new Set(raw.collected.slice(0,100)):new Set(),records=obj(raw.records);let lastAttempt=0,lastTotal=0;
 for(const slot of slots){if(!done.has(slot.id))break;const rec=normalizedSlotRecord(slot,records[slot.id]),proof=obj(rec.proof);if(rec.ruleId!==slot.ruleId||rec.awarded!==true||!integer(rec.score)||!integer(rec.attempt,1000000)||rec.attempt>s.attempt||rec.attempt<lastAttempt||!integer(rec.totalScore)||rec.totalScore>s.totalScore||rec.totalScore<lastTotal)break;
  const historical=slot.rule.type==='boss'&&rec.mechanicsVersion===undefined?{...slot,rule:{...slot.rule,target:6}}:slot;
  if(rec.mechanicsVersion!==undefined&&![73,74,77,MECHANICS_VERSION].includes(rec.mechanicsVersion))break;
  const target=cumulativeTarget(slot),slotScore=rec.slotScore;if(!integer(slotScore,target)||target&&slotScore>(s.slotScores[slot.id]||0))break;
  if(rec.source==='run'){if(rec.attempt<=lastAttempt||!validateSlotResult(historical,proof,(rec.mechanicsVersion||73)<74,rec.mechanicsVersion||73)||proof.attempt!==rec.attempt||proof.score!==rec.score||!meets(historical,proof,{slotScores:{[slot.id]:slotScore}},(rec.mechanicsVersion||73)<74))break}
  else if(rec.source!=='event'||!validEvent(slot,proof)||rec.score!==0)break;
  s.collected.push(slot.id);s.records[slot.id]={ruleId:slot.ruleId,awarded:true,score:rec.score,attempt:rec.attempt,totalScore:rec.totalScore,slotScore,source:rec.source,proof:copyProof(proof,rec.source),...(rec.mechanicsVersion!==undefined?{mechanicsVersion:rec.mechanicsVersion}:{})};if(rec.source==='event')s.events[slot.id]=true;lastAttempt=rec.attempt;lastTotal=rec.totalScore}
 for(const id of Object.keys(s.slotScores))if(getSlot(id).number>s.collected.length+1)delete s.slotScores[id];
 const selected=getSlot(raw.selected);if(selected&&selected.number<=s.collected.length+1)s.selected=selected.id;else s.selected=slotId(Math.min(100,s.collected.length+1));
 if(characters.some(c=>c.id===raw.characterId&&c.unlockSlot<=s.collected.length))s.characterId=raw.characterId;
 if(raw.nativeProgress&&root.MongyuNativeRestoration){s.nativeProgress={};for(const [id,v]of Object.entries(obj(raw.nativeProgress))){const slot=getSlot(id);if(slot&&slot.number<=s.collected.length+1&&integer(v?.credit)&&integer(v?.recordScore)&&integer(v?.attempt,1000000)&&v.attempt<=s.attempt)s.nativeProgress[id]={credit:v.credit,recordScore:v.recordScore,attempt:v.attempt};}}
 s.pendingUnlock=normalizePending(s,raw.pendingUnlock);
 return s;
}
// R74: earning a completion and revealing it on the board are separate commits.
// The receipt uses the existing validated record shape, but is not in collected
// until reveal(). All score and attempt accounting has already happened.
function pendingId(slot,record){return 'r'+(record.mechanicsVersion||74)+':'+record.source+':'+record.attempt+':'+slot.id}
function normalizePending(s,value){
 if(value===null||value===undefined)return null;
 const p=obj(value),slot=getSlot(p.slotId),rec=obj(p.record),proof=obj(rec.proof);
 if(p.schema!==1||!slot||slot.number!==s.collected.length+1||slot.number>=100||p.id!==pendingId(slot,rec))return null;
 if(Object.keys(p).some(k=>!['schema','id','slotId','record'].includes(k))||![74,77,MECHANICS_VERSION].includes(rec.mechanicsVersion)||rec.ruleId!==slot.ruleId||rec.awarded!==true||rec.attempt!==s.attempt||rec.totalScore!==s.totalScore||!integer(rec.score)||rec.slotScore!==(s.slotScores[slot.id]||0))return null;
 const previous=s.records[s.collected[s.collected.length-1]],lastAttempt=previous?.attempt||0;
 if(rec.source==='run'){
  if(rec.attempt<=lastAttempt||!validateSlotResult(slot,proof,false,rec.mechanicsVersion)||proof.attempt!==rec.attempt||proof.score!==rec.score||!meets(slot,proof,s))return null;
 }else if(rec.source!=='event'||rec.score!==0||rec.attempt<lastAttempt||!validEvent(slot,proof))return null;
 return {schema:1,id:p.id,slotId:slot.id,record:{ruleId:slot.ruleId,awarded:true,score:rec.score,attempt:rec.attempt,totalScore:rec.totalScore,slotScore:rec.slotScore,source:rec.source,proof:copyProof(proof,rec.source),mechanicsVersion:rec.mechanicsVersion}};
}
function parseSave(text){
 if(typeof text!=='string'||text.length>MAX_SAVE_BYTES)return {ok:false,save:createSave(),reason:'size-or-type'};
 try{const raw=JSON.parse(text);if(!raw||raw.schema!==2||raw.catalogVersion!==VERSION||!Array.isArray(raw.collected)||raw.collected.length>100||!integer(raw.totalScore)||!integer(raw.attempt,1000000)||!raw.slotScores||typeof raw.slotScores!=='object'||Array.isArray(raw.slotScores))return {ok:false,save:createSave(),reason:'schema'};const save=normalizeSave(raw);if(save.collected.length!==raw.collected.length||new Set(raw.collected).size!==raw.collected.length||Object.keys(raw.slotScores).length!==Object.keys(save.slotScores).length||Object.keys(raw.slotScores).some(id=>raw.slotScores[id]!==save.slotScores[id]))return {ok:false,save:createSave(),reason:'invalid-progression'};if(raw.pendingUnlock!=null&&!save.pendingUnlock)return {ok:false,save:createSave(),reason:'invalid-pending-unlock'};return {ok:true,save,reason:''}}catch(e){return {ok:false,save:createSave(),reason:'invalid-json'}}
}
function loadSave(storage){try{const raw=storage.getItem(SAVE_KEY);if(raw===null||raw===undefined)return {ok:true,save:createSave(),readOnly:false,reason:''};const parsed=parseSave(raw);return {...parsed,readOnly:!parsed.ok}}catch(e){return {ok:false,save:createSave(),readOnly:true,reason:'read-failed'}}}
function writeSave(storage,raw){const current=loadSave(storage);if(current.readOnly)return {ok:false,reason:current.reason,readOnly:true};const save=normalizeSave(raw),text=JSON.stringify(save);if(raw?.pendingUnlock!=null&&!save.pendingUnlock)return {ok:false,reason:'invalid-pending-unlock',readOnly:false};if(save.attempt<current.save.attempt||save.collected.length<current.save.collected.length||save.totalScore<current.save.totalScore||Object.keys(current.save.slotScores).some(id=>(save.slotScores[id]||0)<current.save.slotScores[id]))return {ok:false,reason:'stale-save',readOnly:false};const pending=current.save.pendingUnlock;if(pending){const kept=save.pendingUnlock&&JSON.stringify(save.pendingUnlock)===JSON.stringify(pending),revealed=save.collected.includes(pending.slotId)&&JSON.stringify(save.records[pending.slotId])===JSON.stringify(pending.record);if(!kept&&!revealed)return {ok:false,reason:'pending-unlock-loss',readOnly:false};}if(text.length>MAX_SAVE_BYTES)return {ok:false,reason:'size-or-type',readOnly:false};try{storage.setItem(SAVE_KEY,text);if(storage.getItem(SAVE_KEY)!==text)return {ok:false,reason:'verify-failed',readOnly:false};return {ok:true,save,reason:'',readOnly:false}}catch(e){return {ok:false,reason:'write-failed',readOnly:false}}}
function unlocked(raw,id){const slot=getSlot(id);return !!slot&&slot.number<=normalizeSave(raw).collected.length+1}
function lockReason(raw,id){return !getSlot(id)?'없는 기록입니다.':unlocked(raw,id)?'':'앞선 기록을 먼저 모으세요.'}
function status(raw){const s=normalizeSave(raw),n=s.collected.length;return {collected:n,total:100,nextSlot:n===100?null:n+1,finished:n===100,freePlay:n===100,endingAcquired:n>=99,endingViewed:n===100,unlockedCount:Math.min(100,n+1),playableCount:slots.filter(v=>v.physical&&v.number<=n+1).length,totalScore:s.totalScore,selected:s.selected}}
function collection(raw){const s=normalizeSave(raw);return slots.map(slot=>({...slot,collected:s.collected.includes(slot.id),unlocked:slot.number<=s.collected.length+1,lockReason:slot.number<=s.collected.length+1?'':'앞선 기록을 먼저 모으세요.'}))}
function scoreProgress(raw,id){const slot=getSlot(id),target=slot?cumulativeTarget(slot):0,s=normalizeSave(raw),current=target?(s.slotScores[slot.id]||0):0;return {current,target,remaining:Math.max(0,target-current)}}
// R73 native predicates sample HOUR_OF_DAY at the event, not at run start.
function hourMatches(period,hour){return period==='am'?hour<12:period==='pm'?hour>=12:period==='noon'?hour===12:period==='midnight'?hour===0:true}
function periodMatches(rule,result){if(!rule.period)return true;if(result.clockSample)return hourMatches(rule.period,result.clockSample.hour);return result.period===rule.period||rule.period==='pm'&&result.period==='noon'||rule.period==='am'&&result.period==='midnight'}
// R74 candidate native types20/21/22/34/35: credit is earned at the operation.
function settingType(rule){return rule?.type==='setting'?({sound:20,vibration:rule.period==='pm'?34:21,speed:rule.period==='pm'?35:22}[rule.setting]):null}
function validSettingCredit(slot,result){
 const c=result.settingCredit,keys=['typeCode','credit','activeIndex','frontier','setting','before','after','atTime','hour','clockSource'];
 if(!c||typeof c!=='object'||Array.isArray(c)||Object.keys(c).length!==keys.length||Object.keys(c).some(k=>!keys.includes(k)))return false;
 const value=v=>c.setting==='speed'?['default','slow','fast'].includes(v):typeof v==='boolean';
 return c.typeCode===settingType(slot.rule)&&c.credit===1&&c.setting===slot.rule.setting&&c.setting===result.setting&&value(c.before)&&value(c.after)&&c.before!==c.after&&result.settingChanged===true&&c.activeIndex===slot.number-1&&c.activeIndex!==100&&c.frontier===c.activeIndex+1&&integer(c.frontier,100)&&Number.isFinite(c.atTime)&&c.atTime>=0&&c.atTime<=result.time&&integer(c.hour,23)&&['device','simulation'].includes(c.clockSource)&&(!slot.rule.period||hourMatches(slot.rule.period,c.hour));
}
function validSettingContext(context,result){
 if(!context||typeof context!=='object'||Array.isArray(context)||Object.keys(context).some(k=>!['setting','before','after','changedAt','experiencedAt'].includes(k)))return false;
 const value=v=>context.setting==='speed'?['default','slow','fast'].includes(v):typeof v==='boolean';
 return ['speed','sound','vibration'].includes(context.setting)&&context.setting===result.setting&&value(context.before)&&value(context.after)&&context.before!==context.after&&context.after===result.settingValue&&result.settingChanged===true&&result.settingExperienced===true&&Number.isFinite(context.changedAt)&&context.changedAt>0&&Number.isFinite(context.experiencedAt)&&context.experiencedAt>context.changedAt&&context.experiencedAt<=result.time;
}
function validAnimationGate(g){return g&&typeof g==='object'&&!Array.isArray(g)&&Object.keys(g).length===6&&['schema','actorState','counter','completed','presentationSeconds','timingSource'].every(k=>Object.hasOwn(g,k))&&g.schema===1&&[13,16].includes(g.actorState)&&g.counter===8&&g.completed===true&&g.presentationSeconds===.64&&g.timingSource==='authored-presentation';}
// R77 receipts are distinct from authored R75 predicate proofs.
function validNativeResult(slot,r){
 const N=root.MongyuNativeRestoration,p=r.nativeProof;
 if(!N||!p||r.runVersion!==77||r.nativeRuntime!==true||r.schema!==N.VERSION||p.schema!==N.VERSION||p.source!==N.SOURCE||p.fullOriginalEquivalence!==false||p.frontierAdvanced!==false||r.freePlay||r.practice)return false;
 if(r.slotId!==slot.id||r.ruleId!==slot.ruleId||r.mode!=='restoration'||r.completed!==true||!['clear','fail'].includes(r.state)||!integer(r.attempt,1000000)||r.attempt<1)return false;
 for(const key of ['score','hits','jumps','kicks','mapChanges'])if(!integer(r[key]))return false;
 if(!Number.isFinite(r.time)||r.time<=0||r.time>36000||!integer(p.integerUpdates)||p.integerUpdates<1||r.initialLives!==3||!integer(r.livesRemaining,3))return false;
 const m=N.slotMetadata(slot.number);if(!m.supported||!p.condition||['slot','category','conditionIndex','conditionType','conditionTarget','bossId'].some(k=>p.condition[k]!==m[k]))return false;
 if(!integer(p.frontier,101)||!integer(p.initialPending,100)||!integer(p.pending,100)||!integer(p.priorCredit)||!integer(p.finalCredit)||!integer(p.recordScore)||!Array.isArray(p.persist)||!Array.isArray(p.terminalTrace))return false;
 if(![155,156,158].includes(p.nativeUiState)||!p.terminalTrace.some(t=>t.phase==='request-ui'&&t.state===p.nativeUiState))return false;
 if(p.finalScore!==r.score||p.finalLives!==r.livesRemaining)return false;
 const earned=p.nativeUiState===155;
 if(!earned&&p.pending!==p.initialPending)return false;
 if(p.earned!==earned||p.pendingReveal!==earned||r.state!==(earned?'clear':'fail'))return false;
 if(earned&&(p.frontier!==slot.number||p.pending!==p.initialPending+1||!p.persist.some(e=>e.kind==='persist-progress'&&e.schema==='nom3-semantic-progress-v1'&&e.snapshot?.frontier===p.frontier&&e.snapshot.pending===p.pending&&e.snapshot.credit===p.finalCredit&&e.snapshot.record?.index===m.conditionIndex&&e.snapshot.record.score===p.recordScore)))return false;
 return true;
}
function validateResult(id,result){return validateSlotResult(getSlot(id),result)}
function validateSlotResult(slot,result,legacy=false,mechanicsVersion=MECHANICS_VERSION){
 const r=obj(result);if(r.runVersion===97)return !!(root.MongyuOpening||(typeof require==='function'&&require('./opening-run.js')))?.validResult(slot,r);if(r.runVersion===77||r.nativeRuntime||r.nativeProof)return !!slot&&validNativeResult(slot,r);if(!slot||!slot.physical||r.slotId!==slot.id||r.ruleId!==slot.ruleId||r.mode!=='restoration'||r.completed!==true||r.practice===true||!['clear','fail'].includes(r.state)||!integer(r.attempt,1000000)||r.attempt<1)return false;
 for(const key of ['score','hits','jumps','kicks','mapChanges'])if(!integer(r[key],key==='score'?2000000:key==='hits'?64:100000))return false;
 if(r.period!==undefined&&!['am','pm','noon','midnight'].includes(r.period)||r.characterId!==undefined&&!characters.some(c=>c.id===r.characterId)||r.setting!==undefined&&!['speed','vibration','sound'].includes(r.setting)||r.settingValue!==undefined&&!['default','fast','slow',true,false].includes(r.settingValue))return false;
 if(['settingChanged','settingExperienced'].some(key=>r[key]!==undefined&&typeof r[key]!=='boolean'))return false;
 if(r.settingContext!==undefined&&!validSettingContext(r.settingContext,r))return false;
 if(!legacy&&r.settingCredit!==undefined&&(slot.rule.type!=='setting'||!validSettingCredit(slot,r)))return false;
 if(r.clockSample!==undefined&&(!r.clockSample||!integer(r.clockSample.hour,23)||!['device','simulation'].includes(r.clockSample.source)||!Number.isFinite(r.clockSample.atTime)||r.clockSample.atTime<0||r.clockSample.atTime>r.time))return false;
 if(r.damageTypes!==undefined&&(!Array.isArray(r.damageTypes)||r.damageTypes.length!==r.hits||r.damageTypes.some(t=>typeof t!=='string'||t.length>32)))return false;
 if(r.kickHours!==undefined&&(!Array.isArray(r.kickHours)||r.kickHours.length!==r.kicks||r.kickHours.some(h=>!integer(h,23))))return false;
 if(r.damageHours!==undefined&&(!Array.isArray(r.damageHours)||r.damageHours.length!==r.hits||r.damageHours.some(h=>!integer(h,23))))return false;
 if(typeof r.time!=='number'||!Number.isFinite(r.time)||(r.time<0||r.time===0&&!(slot.rule.type==='setting'&&r.settingCredit))||r.time>36000||r.kicks>r.jumps||r.score>Math.ceil(r.time*1000)||r.hits>r.time*20+1)return false;
 if(r.state==='fail'&&r.hits<1)return false;
 if(r.runVersion!==undefined&&![74,75].includes(r.runVersion))return false;
 if(!legacy&&mechanicsVersion>=75&&['cumulative-score','run-score'].includes(slot.rule.type)){
  if(r.runVersion!==75||r.state!=='fail'||!['collision','quit'].includes(r.termination))return false;
  if(r.termination==='collision'&&!validAnimationGate(r.animationGate))return false;
 }
 if(r.animationGate!==undefined&&(!validAnimationGate(r.animationGate)||r.termination!=='collision'||r.runVersion!==75))return false;
 if(r.termination!==undefined&&!['collision','quit','exit','objective'].includes(r.termination))return false;
 if(r.initialLives!==undefined&&(r.initialLives!==3||!integer(r.livesRemaining,3)||r.hits>3||r.livesRemaining!==3-r.hits))return false;
 if(r.termination==='collision'&&(r.state!=='fail'||r.initialLives!==3||r.livesRemaining!==0||r.hits!==3))return false;
 if(!legacy&&['death-range','clock-death'].includes(slot.rule.type)&&(!r.termination||r.initialLives!==3||!integer(r.livesRemaining,3)))return false;
 if(!Array.isArray(r.damageScores)||r.damageScores.length!==r.hits||r.damageScores.some(n=>!integer(n)||n>r.score))return false;
 const damage=obj(r.damageTypeCounts),counts=Object.values(damage);if(counts.length>8||Object.keys(damage).some(k=>k.length>32)||counts.some(n=>!integer(n,64))||counts.reduce((a,b)=>a+b,0)!==r.hits)return false;
 if(slot.rule.type==='boss'&&(!integer(r.bossDamage,100)||r.bossDamage>slot.rule.target||r.bossDefeated!==(r.bossDamage===slot.rule.target)))return false;
 if(slot.rule.type==='boss'&&(!integer(r.shots,100000)||!integer(r.dodges,100000)))return false;
 for(const key of ['counters','wavePasses'])if(r[key]!==undefined&&!integer(r[key],100))return false;
 const flight=([58,77].includes(slot.number)&&r.encounter?.kind===(slot.number===58?'radial':'robot')&&r.encounter.policy==='near')||(slot.number===99&&r.encounter?.kind==='heart'&&r.encounter.policy==='boundary-counter');
 const wave=slot.number===66&&r.encounter?.kind==='wave'&&r.encounter.policy==='cycle';
 if((r.counters||0)>0&&!flight||(r.wavePasses||0)>0&&!wave)return false;
 if(slot.number===8&&r.encounter&&(r.encounter.kind!=='sun'||r.encounter.policy!=='human-air-contact'||r.shots<r.bossDamage||r.kicks!==0||r.dodges!==0))return false;
 if(slot.number===31&&r.encounter&&(r.encounter.kind!=='alien'||r.encounter.policy!=='pair-air-contact'||r.shots<r.bossDamage||r.kicks!==0||r.dodges!==0))return false;
 if(flight&&(r.counters!==r.bossDamage||r.kicks!==0))return false;
 if(wave&&(r.wavePasses!==r.bossDamage||r.dodges>r.wavePasses))return false;
 return true;
}
function meets(slot,r,s,legacy=false){if(r.runVersion===97)return r.state==='clear'&&validateSlotResult(slot,r);if(r.runVersion===77)return validNativeResult(slot,r)&&r.nativeProof.earned;const q=slot.rule;if(!['damage-range','repeated-damage','kick','setting'].includes(q.type)&&!periodMatches(q,r))return false;switch(q.type){
 case'tutorial':return r.state==='clear'&&r.mapChanges>=q.target&&r.jumps>=1;
 case'boss':return r.state==='clear'&&r.bossDefeated===true&&r.bossDamage===q.target&&(([58,77].includes(slot.number)&&r.encounter?.policy==='near'||slot.number===99&&r.encounter?.kind==='heart'&&r.encounter?.policy==='boundary-counter')?r.counters>=q.target:slot.number===66&&r.encounter?.policy==='cycle'?r.wavePasses>=q.target:q.family==='throw'?r.shots>=q.target:q.family==='dodge'?r.dodges>=q.target:r.kicks>=q.target);
 case'run-score':return r.score>=q.target;
 case'cumulative-score':return (obj(s.slotScores)[slot.id]||0)>=q.target;
 case'death-range':return fatalCollision(r,legacy)&&r.score>=q.min&&r.score<=q.max;
 case'damage-range':return r.damageScores.some((score,i)=>score>=q.min&&score<=q.max&&(!q.period||(r.damageHours?hourMatches(q.period,r.damageHours[i]):periodMatches(q,r))));
 case'repeated-damage':{if(r.damageTypes&&r.damageHours){const counts={};r.damageTypes.forEach((t,i)=>{if(!q.period||hourMatches(q.period,r.damageHours[i]))counts[t]=(counts[t]||0)+1});return Object.values(counts).some(n=>n>=q.target)}return periodMatches(q,r)&&Object.values(r.damageTypeCounts).some(n=>n>=q.target);}
 case'flawless-score':return r.hits===0&&r.score>=q.target;
 case'kick':return r.kickHours?r.kickHours.filter(h=>!q.period||hourMatches(q.period,h)).length>=q.target:periodMatches(q,r)&&r.kicks>=q.target;
 case'map-change':return r.state==='clear'&&r.mapChanges>=q.target;
 case'character':return r.state==='clear'&&r.characterId===q.characterId&&r.mapChanges>=1;
 case'setting':if(!legacy)return validSettingCredit(slot,r);return periodMatches(q,r)&&r.state==='clear'&&r.mapChanges>=1&&r.setting===q.setting&&r.settingChanged!==false&&r.settingExperienced!==false&&(q.setting==='speed'?['fast','slow'].includes(r.settingValue):r.settingValue===true||r.settingValue===false&&r.settingChanged===true&&r.settingExperienced===true);
 case'clock-death':return fatalCollision(r,legacy);
 case'combined':return (obj(s.slotScores)[slot.id]||0)>=q.totalScore&&r.kicks>=q.kicks;
 default:return false}}
function fatalCollision(r,legacy){return r.state==='fail'&&(legacy||r.termination==='collision'&&r.initialLives===3&&r.livesRemaining===0&&r.hits===3&&r.damageScores[r.damageScores.length-1]===r.score)}
function copyProof(value,source){const eventKeys=value.type==='narrative-complete'?['slotId','type','slot','nativeState','nativeRow','terminalCursor','structureVersion','wording']:value.type==='opening-read'?['slotId','type','scene']:value.type==='story-read'?['slotId','type','pageCount']:value.type==='local-call'?['slotId','type','phase','rings','simulated','period','callContext']:['slotId','type','beats','completed'];const keys=source==='event'?eventKeys:['slotId','ruleId','mode','completed','state','attempt','score','hits','jumps','kicks','mapChanges','time','damageScores','damageTypeCounts','bossDamage','bossDefeated','shots','dodges','counters','wavePasses','encounter','period','characterId','setting','settingValue','settingChanged','settingExperienced','settingContext','settingCredit','clockSample','damageHours','damageTypes','kickHours','runVersion','initialLives','livesRemaining','termination','animationGate','nativeRuntime','schema','nativeProof','openingProof'];const out={};for(const k of keys)if(value[k]!==undefined)out[k]=k==='nativeProof'?JSON.parse(JSON.stringify(value[k])):Array.isArray(value[k])?value[k].slice():value[k]&&typeof value[k]==='object'?{...value[k]}:value[k];return out}
function award(s,slot,score,source,proof){if(s.collected.includes(slot.id))return s;s.collected.push(slot.id);s.records[slot.id]={ruleId:slot.ruleId,awarded:true,score,attempt:s.attempt,totalScore:s.totalScore,slotScore:s.slotScores[slot.id]||0,source,proof:copyProof(proof,source),mechanicsVersion:proof.runVersion===77?77:MECHANICS_VERSION};if(source==='event')s.events[slot.id]=true;if(slot.rule.type==='character')s.characterId=slot.rule.characterId;s.selected=slotId(Math.min(100,slot.number+1));return s}
function completeOrDefer(s,slot,score,source,proof,defer){
 if(!defer||slot.number===100)return award(s,slot,score,source,proof);
 const record={ruleId:slot.ruleId,awarded:true,score,attempt:s.attempt,totalScore:s.totalScore,slotScore:s.slotScores[slot.id]||0,source,proof:copyProof(proof,source),mechanicsVersion:proof.runVersion===77?77:MECHANICS_VERSION};
 s.pendingUnlock={schema:1,id:pendingId(slot,record),slotId:slot.id,record};return s;
}
function collect(raw,id,result,options={}){const s=normalizeSave(raw),slot=getSlot(id);if(s.pendingUnlock||!slot||!unlocked(s,slot.id)||!validateResult(slot.id,result)||result.attempt!==s.attempt+1)return s;s.attempt=result.attempt;if(result.runVersion===77){s.nativeProgress??={};s.nativeProgress[slot.id]={credit:result.nativeProof.finalCredit,recordScore:result.nativeProof.recordScore,attempt:result.attempt};}s.totalScore=Math.min(2000000,s.totalScore+result.score);const target=cumulativeTarget(slot);if(target)s.slotScores[slot.id]=Math.min(target,(s.slotScores[slot.id]||0)+result.score);if(!s.collected.includes(slot.id)&&meets(slot,result,s)&&(result.runVersion===77||slot.rule.type!=='setting'||result.settingCredit.frontier===s.collected.length+1))completeOrDefer(s,slot,result.score,'run',result,options.deferUnlock===true);return s}
function commit(raw,id,result){return collect(raw,id,result,{deferUnlock:true})}
function reveal(raw,id){
 const s=normalizeSave(raw),p=s.pendingUnlock;
 if(!p||p.id!==id)return s;
 const slot=getSlot(p.slotId);s.collected.push(slot.id);s.records[slot.id]=p.record;
 if(p.record.source==='event')s.events[slot.id]=true;
 if(slot.rule.type==='character')s.characterId=slot.rule.characterId;
 s.selected=slotId(Math.min(100,slot.number+1));s.pendingUnlock=null;return s;
}
function validCallContext(context){if(!context||typeof context!=='object'||Array.isArray(context)||Object.keys(context).some(key=>!['interrupted','resumed','beforeTime','afterTime'].includes(key)))return false;return context.interrupted===true&&context.resumed===true&&Number.isFinite(context.beforeTime)&&Number.isFinite(context.afterTime)&&context.beforeTime>0&&context.afterTime<=36000&&context.afterTime-context.beforeTime>=.2}
function validNarrativeEvent(slot,e){
 if(!['story','character'].includes(slot.rule.type)||e.slot!==slot.number||e.structureVersion!==74||e.wording!=='authored')return false;
 const graph=root.MongyuRestorationStoryGraph||(typeof require==='function'?require('./restoration-story-graph.js'):null),sequence=graph?.getSequence(slot.number);
 return !!sequence&&e.nativeState===sequence.nativeState&&e.nativeRow===sequence.nativeRow&&e.terminalCursor===sequence.terminalCursor;
}
function validEvent(slot,e){if(e.slotId!==slot.id||e.practice===true||e.replay===true||e.skipped===true)return false;const r=slot.rule;let valid=false;
 if(e.type==='opening-read')return slot.number===1&&e.scene==='light-folds';
 if(e.type==='narrative-complete')return validNarrativeEvent(slot,e);
 if(r.type==='story')valid=e.type==='story-read'&&e.pageCount===slot.pages.length;
 if(r.type==='call')valid=e.type==='local-call'&&e.phase==='answered'&&e.rings===2&&e.simulated===true&&['am','pm','noon','midnight'].includes(e.period)&&periodMatches(r,e)&&(e.callContext===undefined||validCallContext(e.callContext));
 if(r.type==='interlude')valid=e.type==='interlude'&&e.beats===3&&e.completed===true;
 return valid;
}
function applyEvent(raw,event,options={}){const s=normalizeSave(raw),e=obj(event),slot=getSlot(e.slotId);if(s.pendingUnlock||!slot||!unlocked(s,slot.id)||s.collected.includes(slot.id))return s;if(validEvent(slot,e))completeOrDefer(s,slot,0,'event',e,options.deferUnlock===true);return s;
}
function commitEvent(raw,event){return applyEvent(raw,event,{deferUnlock:true})}
function select(raw,id){const s=normalizeSave(raw),slot=getSlot(id);if(slot&&unlocked(s,slot.id))s.selected=slot.id;return s}
const api={VERSION,MECHANICS_VERSION,BOSS_TARGETS,hourMatches,settingType,SAVE_KEY,MAX_SAVE_BYTES,sources,slots,characters,story,getSlot,createSave,normalizeSave,parseSave,loadSave,writeSave,unlocked,collect,commit,applyEvent,commitEvent,reveal,validateResult,meets,status,collection,scoreProgress,lockReason,select};
root.MongyuRestorationCatalog=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
