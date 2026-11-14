/* R36 offline commerce lab. No billing, network, storage, game mutation or paid ownership. */
(function(root){
'use strict';
const DAY_MS=86400000;
const NOTICE='개발 미리보기 · 결제 없음';
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value)}return value}
const catalog=freeze([
 {id:'aurora-thread',name:'오로라 실',nameEn:'Aurora Thread',kind:'cosmetic',
  summary:'도약 뒤에 남는 청록빛 실과 진주빛 여행자. 능력은 그대로.',
  proposedContents:['새 여행자 팔레트 1종','도약 잔상 1종'],
  priceHypothesis:{currency:'KRW',amount:2900,usdReference:1.99,label:'가격 가설 ₩2,900 · 미국 참고 US$1.99 · 실제 판매 아님'},
  releaseState:'concept',previewKind:'palette',labOnly:true,noCharge:true,availableForPurchase:false,
  gameplayAdvantage:false,recurring:false,includesExistingCollectibles:false},
 {id:'midnight-score',name:'자정의 악보',nameEn:'Midnight Score',kind:'audio',
  summary:'꿈의 박자는 그대로, 밤의 음색으로 다시 듣는 여행.',
  proposedContents:['새 대체 편곡 3곡','기본 음악과 자유롭게 전환'],
  priceHypothesis:{currency:'KRW',amount:3900,usdReference:2.99,label:'가격 가설 ₩3,900 · 미국 참고 US$2.99 · 실제 판매 아님'},
  releaseState:'concept',previewKind:'soundscape',labOnly:true,noCharge:true,availableForPurchase:false,
  gameplayAdvantage:false,recurring:false,includesExistingCollectibles:false},
 {id:'glass-garden',name:'유리 정원',nameEn:'Glass Garden',kind:'expansion',
  summary:'새로운 거울길 세 장면과 정원지기. 기존 열 개의 장과는 별개의 다음 꿈.',
  proposedContents:['새로운 세계 1개: 장면 3개와 보스 1개','새 수수께끼와 무료로 획득하는 기념품'],
  priceHypothesis:{currency:'KRW',amount:6900,usdReference:4.99,label:'가격 가설 ₩6,900 · 미국 참고 US$4.99 · 실제 판매 아님'},
  releaseState:'concept',previewKind:'world',labOnly:true,noCharge:true,availableForPurchase:false,
  gameplayAdvantage:false,recurring:false,includesExistingCollectibles:false}
]);
const getProduct=id=>catalog.find(p=>p.id===id)||null;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
const timestamp=v=>Number.isSafeInteger(v)&&v>=0?v:null;
const ids=v=>Array.isArray(v)?catalog.map(p=>p.id).filter(id=>v.includes(id)):[];
/** Preferences only. Imported 'owned', receipts and purchase claims are intentionally discarded. */
function createState(raw){
 raw=object(raw);if(raw.schema!==1)raw={};
 return {schema:1,wishlist:ids(raw.wishlist),previewed:ids(raw.previewed),
  suggestionsEnabled:raw.suggestionsEnabled!==false,lastOfferAt:timestamp(raw.lastOfferAt),
  offersThisSession:raw.offersThisSession===1?1:0};
}
function beginSession(raw){return {...createState(raw),offersThisSession:0}}
/** No automatic modal: suggest=true permits an optional, secondary success-screen link only. */
function offerEligibility(context,state){
 context=object(context);state=createState(state);
 const manualEntry=['title','collection','success'].includes(context.surface);
 let reason='eligible';
 if(context.surface!=='success')reason='success-only';
 else if(context.outcome!=='success')reason='success-required';
 else if(context.completedRuns<1||!Number.isSafeInteger(context.completedRuns))reason='complete-a-run-first';
 else if(context.interrupted===true||context.dialogOpen===true)reason='interaction-in-progress';
 else if(!state.suggestionsEnabled)reason='suggestions-dismissed';
 else if(state.offersThisSession)reason='session-cap';
 else if(timestamp(context.nowMs)===null)reason='clock-required';
 else if(state.lastOfferAt!==null&&(context.nowMs-state.lastOfferAt<DAY_MS))reason='cooldown';
 // Expansion becomes relevant after a return. Manual browsing always shows the full catalog.
 const productIds=context.hasReturned===true?catalog.map(p=>p.id):['aurora-thread','midnight-score'];
 return {manualEntry,suggest:reason==='eligible',reason,productIds:reason==='eligible'?productIds:[],
  labOnly:true,noCharge:true};
}
function reduce(state,event){
 const next=createState(state);event=object(event);const product=getProduct(event.productId);
 switch(event.type){
  case 'wishlist-toggle':if(product)next.wishlist=next.wishlist.includes(product.id)?next.wishlist.filter(id=>id!==product.id):ids(next.wishlist.concat(product.id));break;
  case 'preview':if(product)next.previewed=ids(next.previewed.concat(product.id));break;
  case 'offer-shown':if(offerEligibility(event.context,next).suggest){next.lastOfferAt=event.context.nowMs;next.offersThisSession=1}break;
  case 'dismiss-suggestions':next.suggestionsEnabled=false;break;
  case 'enable-suggestions':next.suggestionsEnabled=true;break;
  // No purchase-success, restore-success, unlock, currency, or ownership reducer exists.
 }
 return next;
}
/** A presentation sample, never a playable unlock or owned/equipped game skin. */
function preview(id){
 const p=getProduct(id);if(!p)return null;
 const common={productId:id,kind:p.previewKind,title:p.name,notice:NOTICE,labOnly:true,noCharge:true,
  conceptOnly:true,ownsProduct:false,modifiesGame:false};
 if(p.kind==='cosmetic')return freeze({...common,label:'팔레트 콘셉트 샘플 · 실제 스킨 미지급',
  palette:['#c6fff5','#6ce4e6','#8492f1'],trail:'thread',sampleOnly:true});
 if(p.kind==='audio')return freeze({...common,label:'음색 콘셉트 · 완성된 세 곡은 아직 없음',
  notes:[0,7,12,9,4,7,2,0],tempo:120,timbre:'soft-bell',sampleSeconds:2,sampleOnly:true});
 return freeze({...common,label:'세계 기획 미리보기 · 플레이 가능한 확장팩 아님',
  palette:['#c8f7e4','#7bded2','#152c3a'],scenes:['거울을 건너는 길','접힌 연못','정원지기의 대답'],sampleOnly:true});
}
/** Production adapter interface requirements, not an implemented billing integration. */
const ENTITLEMENT_CONTRACT=freeze({
 version:1,productionImplemented:false,methods:['getCatalog','getEntitlements','purchase','restore'],
 trustedAuthority:'Platform-verified transaction evidence; never browser preferences or caller-owned flags.',
 states:['unavailable','pending','verified','revoked','error'],
 verificationRequired:true,grantOnPending:false,restoreRequired:true,
 offlinePolicy:'Preserve last verified non-consumable rights on transient failure; only an authoritative verified revocation may remove them.',
 legacyPolicy:'R35 chapters, modes, default music and earned keepsakes remain available under their existing progression rules.'
});
function disabled(operation,productId){
 return {status:'disabled',operation,productId:getProduct(productId)?.id||null,labOnly:true,
  noCharge:true,charged:false,ownsProduct:false,entitlements:[],preserveExistingEntitlements:true,
  authoritative:false,notice:NOTICE,reason:'billing-not-connected'};
}
function createLabProvider(){
 return Object.freeze({kind:'offline-lab',canPurchase:false,
  getCatalog:()=>catalog,
  getEntitlements:()=>({...disabled('getEntitlements'),status:'unavailable'}),
  purchase:productId=>disabled('purchase',productId),restore:()=>disabled('restore')});
}
/** Simulates UI failures/pending states only. Even a claimed success cannot mint ownership. */
function createTestProvider(scenario='unavailable'){
 const allowed=['unavailable','pending','cancelled','error','claimed-success'];
 const status=allowed.includes(scenario)?scenario:'unavailable';
 const response=(operation,productId)=>({...disabled(operation,productId),status:status==='claimed-success'?'unverified':status,
  reason:'test-provider-only',simulated:true});
 return Object.freeze({kind:'offline-test',canPurchase:false,getCatalog:()=>catalog,
  getEntitlements:()=>response('getEntitlements'),purchase:id=>response('purchase',id),restore:()=>response('restore')});
}
const api=Object.freeze({catalog,getProduct,createState,beginSession,offerEligibility,reduce,preview,
 createLabProvider,createTestProvider,ENTITLEMENT_CONTRACT,DAY_MS,NOTICE});
root.MongyuCommerce=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
